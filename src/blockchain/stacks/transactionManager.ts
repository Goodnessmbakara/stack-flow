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

const NETWORK = import.meta.env.VITE_STACKS_NETWORK || 'testnet';
const API_URL = import.meta.env.VITE_STACKS_API_URL || 'https://api.testnet.hiro.so';

export const CONTRACT_ADDRESS = import.meta.env.VITE_STACKS_CONTRACT_ADDRESS 
  ? import.meta.env.VITE_STACKS_CONTRACT_ADDRESS.split('.')[0]
  : TESTNET_CONTRACT.address;

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
  const { strategy, amount, strikePrice, premium, period, userAddress, onFinish, onCancel } = params;
  
  const currentBlock = await getCurrentBlockHeight();
  const blocksPerDay = 144;
  const BLOCK_BUFFER = 10; // Safety margin for transaction confirmation time
  const expiryBlock = currentBlock + (Math.floor(period) * blocksPerDay) + BLOCK_BUFFER;
  
  const amountMicro = toMicroUnits(amount);
  const strikeMicro = toMicroUnits(strikePrice);
  const premiumMicro = toMicroUnits(premium);
  
  let functionName = 'create-call-option';
  let functionArgs = [
    uintCV(amountMicro),
    uintCV(strikeMicro),
    uintCV(premiumMicro),
    uintCV(expiryBlock),
  ];
  
  if (strategy === 'STRAP') {
    functionName = 'create-strap-option';
  } else if (strategy === 'PUT') {
    functionName = 'create-put-option';
  } else if (strategy === 'STRIP') {
    functionName = 'create-strip-option';
  } else if (strategy === 'BCSP' || strategy === 'BPSP' || strategy === 'BEPS' || strategy === 'BECS') {
    // For spreads, use strike as lower, and calculate upper
    const upperStrike = strikeMicro + toMicroUnits(amount * 0.1);
    functionArgs = [
      uintCV(amountMicro), 
      uintCV(strikeMicro), 
      uintCV(upperStrike), 
      uintCV(premiumMicro), 
      uintCV(expiryBlock)
    ];
    
    if (strategy === 'BCSP') {
      functionName = 'create-bull-call-spread';
    } else if (strategy === 'BPSP') {
      functionName = 'create-bull-put-spread';
    } else if (strategy === 'BEPS') {
      functionName = 'create-bear-put-spread';
    } else if (strategy === 'BECS') {
      functionName = 'create-bear-call-spread';
    }
  }
  
  await openContractCall({
    network: getNetwork(),
    anchorMode: AnchorMode.Any,
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName,
    functionArgs,
    postConditionMode: PostConditionMode.Allow,
    onFinish: (data: FinishedTxData) => {
      console.log('Transaction broadcast:', data.txId);
      onFinish?.(data);
    },
    onCancel: () => {
      console.log('Transaction cancelled');
      onCancel?.();
    },
  });
}

export async function monitorTransaction(
  txId: string,
  onUpdate: (status: string) => void,
  maxAttempts = 30
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${API_URL}/extended/v1/tx/${txId}`);
      const data = await response.json();
      
      if (data.tx_status === 'success') {
        onUpdate('confirmed');
        return true;
      }
      
      if (data.tx_status === 'abort_by_response' || data.tx_status === 'abort_by_post_condition') {
        onUpdate('failed');
        return false;
      }
      
      onUpdate('pending');
    } catch (error) {
      console.error('Failed to check transaction:', error);
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return false;
}

export function getExplorerUrl(txId: string): string {
  const chain = NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
  return `https://explorer.hiro.so/txid/${txId}?chain=${chain}`;
}

export function getContractIdentifier(): string {
  return `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`;
}
