// Simplified version without post conditions for immediate testing
// Post conditions will be added back after successful testnet verification

import { openContractCall, type FinishedTxData } from '@stacks/connect';
import { uintCV, AnchorMode, PostConditionMode } from '@stacks/transactions';
import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';

// Contract configuration
const TESTNET_CONTRACT = {
  address: 'ST3DSAPR2WF7D7SMR6W0R436AA6YYTD8RFT9E9NPH',
  name: 'stackflow-options-v2',
};

const MAINNET_CONTRACT = {
  address: 'SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS', // Example mainnet address provided by user/analysis
  name: 'stackflow-options-v2',
};

const NETWORK = import.meta.env.VITE_STACKS_NETWORK || 'mainnet';
const API_URL = import.meta.env.VITE_STACKS_API_URL || 'https://api.mainnet.hiro.so';

export const CONTRACT_ADDRESS = import.meta.env.VITE_STACKS_CONTRACT_ADDRESS 
  ? import.meta.env.VITE_STACKS_CONTRACT_ADDRESS.split('.')[0]
  : (NETWORK === 'mainnet' ? MAINNET_CONTRACT.address : TESTNET_CONTRACT.address);

export const CONTRACT_NAME = 'stackflow-options-v2';

export function getNetwork() {
  return NETWORK === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
}

export type StrategyType = 'CALL' | 'STRAP' | 'BCSP' | 'BPSP' | 'PUT' | 'STRIP' | 'BEPS' | 'BECS';

export interface CreateOptionParams {
  strategy: StrategyType;
  amount: number;
  strikePrice: number;
  premium: number;
  period: number;
  userAddress: string;
  onFinish?: (data: FinishedTxData) => void;
  onCancel?: () => void;
}

async function getCurrentBlockHeight(): Promise<number> {
  try {
    const response = await fetch(`${API_URL}/v2/info`);
    const data = await response.json();
    return data.stacks_tip_height || 0;
  } catch (error) {
    console.error('Failed to get block height:', error);
    return 0;
  }
}

function toMicroUnits(value: number): number {
  return Math.floor(value * 1_000_000);
}

export async function createOption(params: CreateOptionParams): Promise<void> {
  const { strategy, amount, strikePrice, premium, period, onFinish, onCancel } = params;
  
  console.log('🚀 Creating option with params:', {
    strategy,
    amount,
    strikePrice,
    premium,
    period,
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME
  });

  // Validation
  if (amount <= 0 || strikePrice <= 0 || premium <= 0 || period <= 0) {
    throw new Error('Invalid parameters: all values must be positive');
  }

  try {
    const currentBlock = await getCurrentBlockHeight();
    if (currentBlock === 0) {
      throw new Error('Unable to fetch current block height');
    }

    const blocksPerDay = 144; // Stacks blocks per day
    const BLOCK_BUFFER = 20; // Increased safety margin
    const expiryBlock = currentBlock + (Math.floor(period) * blocksPerDay) + BLOCK_BUFFER;
    
    console.log(`📅 Block calculation: current=${currentBlock}, expiry=${expiryBlock}, period=${period} days`);
    
    const amountMicro = toMicroUnits(amount);
    const strikeMicro = toMicroUnits(strikePrice);
    const premiumMicro = toMicroUnits(premium);
    
    console.log('🔢 Micro unit conversion:', {
      amountMicro,
      strikeMicro,
      premiumMicro,
      expiryBlock
    });
    
    let functionName = 'create-call-option';
    let functionArgs = [
      uintCV(amountMicro),
      uintCV(strikeMicro),
      uintCV(premiumMicro),
      uintCV(expiryBlock),
    ];
    
    // Map strategy to contract function
    switch (strategy) {
      case 'STRAP':
        functionName = 'create-strap-option';
        break;
      case 'PUT':
        functionName = 'create-put-option';
        break;
      case 'STRIP':
        functionName = 'create-strip-option';
        break;
      case 'BCSP':
        functionName = 'create-bull-call-spread';
        const upperStrikeBCSP = strikeMicro + toMicroUnits(strikePrice * 0.1); // 10% spread
        functionArgs = [uintCV(amountMicro), uintCV(strikeMicro), uintCV(upperStrikeBCSP), uintCV(premiumMicro), uintCV(expiryBlock)];
        break;
      case 'BPSP':
        functionName = 'create-bull-put-spread';
        const upperStrikeBPSP = strikeMicro + toMicroUnits(strikePrice * 0.1);
        functionArgs = [uintCV(amountMicro), uintCV(strikeMicro), uintCV(upperStrikeBPSP), uintCV(premiumMicro), uintCV(expiryBlock)];
        break;
      case 'BEPS':
        functionName = 'create-bear-put-spread';
        const upperStrikeBEPS = strikeMicro + toMicroUnits(strikePrice * 0.1);
        functionArgs = [uintCV(amountMicro), uintCV(strikeMicro), uintCV(upperStrikeBEPS), uintCV(premiumMicro), uintCV(expiryBlock)];
        break;
      case 'BECS':
        functionName = 'create-bear-call-spread';
        const upperStrikeBECS = strikeMicro + toMicroUnits(strikePrice * 0.1);
        functionArgs = [uintCV(amountMicro), uintCV(strikeMicro), uintCV(upperStrikeBECS), uintCV(premiumMicro), uintCV(expiryBlock)];
        break;
      case 'CALL':
      default:
        functionName = 'create-call-option';
        break;
    }
    
    console.log(`📞 Calling contract function: ${functionName}`);
    console.log(`📋 Function args:`, functionArgs.map(arg => arg.value.toString()));
    
    await openContractCall({
      network: getNetwork(),
      anchorMode: AnchorMode.Any,
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName,
      functionArgs,
      postConditionMode: PostConditionMode.Allow, // Using Allow for testing
      onFinish: (data: FinishedTxData) => {
        console.log('✅ Transaction successfully broadcast:', data.txId);
        console.log('🔗 Explorer URL:', getExplorerUrl(data.txId));
        onFinish?.(data);
      },
      onCancel: () => {
        console.log('❌ Transaction cancelled by user');
        onCancel?.();
      },
    });
    
  } catch (error) {
    console.error('💥 Error creating option:', error);
    throw error;
  }
}

export async function monitorTransaction(
  txId: string,
  onUpdate: (status: string, details?: any) => void,
  maxAttempts = 60
): Promise<boolean> {
  console.log(`🔍 Starting transaction monitoring for ${txId}`);
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${API_URL}/extended/v1/tx/${txId}`);
      
      if (!response.ok) {
        console.warn(`API response not OK: ${response.status}`);
        onUpdate('pending');
        await new Promise(resolve => setTimeout(resolve, 3000));
        continue;
      }
      
      const data = await response.json();
      console.log(`📊 Transaction ${txId} status: ${data.tx_status} (attempt ${i + 1}/${maxAttempts})`);
      
      if (data.tx_status === 'success') {
        console.log(`✅ Transaction confirmed: ${txId}`);
        onUpdate('confirmed', { 
          blockHeight: data.block_height,
          blockHash: data.block_hash 
        });
        return true;
      }
      
      if (data.tx_status === 'abort_by_response' || data.tx_status === 'abort_by_post_condition') {
        console.error(`❌ Transaction failed: ${txId}`, data);
        onUpdate('failed', { 
          reason: data.tx_result?.repr || 'Unknown error',
          errorCode: data.tx_status 
        });
        return false;
      }
      
      // Still pending
      onUpdate('pending', { 
        attempts: i + 1,
        maxAttempts,
        nonce: data.nonce 
      });
      
    } catch (error) {
      console.error(`⚠️ Error checking transaction ${txId}:`, error);
      onUpdate('pending');
    }
    
    // Progressive backoff: start with 2s, increase to 5s after 15 attempts
    const delay = i < 15 ? 2000 : 5000;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  console.warn(`⏰ Transaction monitoring timeout for ${txId}`);
  onUpdate('failed', { reason: 'Monitoring timeout' });
  return false;
}

export function getExplorerUrl(txId: string): string {
  const chain = NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
  return `https://explorer.hiro.so/txid/${txId}?chain=${chain}`;
}

export function getContractIdentifier(): string {
  return `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`;
}
