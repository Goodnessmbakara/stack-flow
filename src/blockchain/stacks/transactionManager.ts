import { makeContractCall, broadcastTransaction } from '@stacks/transactions';
import { uintCV, PostConditionMode } from '@stacks/transactions';
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
  onFinish?: (data: { txId: string }) => void;
  onCancel?: () => void;
  onError?: (error: Error) => void;
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

function getStrategyFunctionDetails(
  strategy: StrategyType,
  amountMicro: number,
  strikeMicro: number,
  premiumMicro: number,
  expiryBlock: number
): { functionName: string; functionArgs: ReturnType<typeof uintCV>[] } {
  const baseArgs = [
    uintCV(amountMicro),
    uintCV(strikeMicro),
    uintCV(premiumMicro),
    uintCV(expiryBlock),
  ];

  switch (strategy) {
    case 'STRAP':
      return {
        functionName: 'create-strap-option',
        functionArgs: baseArgs,
      };
    case 'PUT':
      return {
        functionName: 'create-put-option',
        functionArgs: baseArgs,
      };
    case 'STRIP':
      return {
        functionName: 'create-strip-option',
        functionArgs: baseArgs,
      };
    case 'BCSP': {
      const upperStrike = strikeMicro + toMicroUnits(strikeMicro / 10_000_000 * 0.1);
      return {
        functionName: 'create-bull-call-spread',
        functionArgs: [
          uintCV(amountMicro),
          uintCV(strikeMicro),
          uintCV(upperStrike),
          uintCV(premiumMicro),
          uintCV(expiryBlock),
        ],
      };
    }
    case 'BPSP': {
      const upperStrike = strikeMicro + toMicroUnits(strikeMicro / 10_000_000 * 0.1);
      return {
        functionName: 'create-bull-put-spread',
        functionArgs: [
          uintCV(amountMicro),
          uintCV(strikeMicro),
          uintCV(upperStrike),
          uintCV(premiumMicro),
          uintCV(expiryBlock),
        ],
      };
    }
    case 'BEPS': {
      const upperStrike = strikeMicro + toMicroUnits(strikeMicro / 10_000_000 * 0.1);
      return {
        functionName: 'create-bear-put-spread',
        functionArgs: [
          uintCV(amountMicro),
          uintCV(strikeMicro),
          uintCV(upperStrike),
          uintCV(premiumMicro),
          uintCV(expiryBlock),
        ],
      };
    }
    case 'BECS': {
      const upperStrike = strikeMicro + toMicroUnits(strikeMicro / 10_000_000 * 0.1);
      return {
        functionName: 'create-bear-call-spread',
        functionArgs: [
          uintCV(amountMicro),
          uintCV(strikeMicro),
          uintCV(upperStrike),
          uintCV(premiumMicro),
          uintCV(expiryBlock),
        ],
      };
    }
    case 'CALL':
    default:
      return {
        functionName: 'create-call-option',
        functionArgs: baseArgs,
      };
  }
}

export async function createOption(
  params: CreateOptionParams,
  signTransaction: (tx: any) => Promise<string>
): Promise<void> {
  const { strategy, amount, strikePrice, premium, period, userAddress, onFinish, onCancel, onError } = params;

  console.log('Creating option with params:', {
    strategy,
    amount,
    strikePrice,
    premium,
    period,
    userAddress,
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
  });

  // Validation
  if (amount <= 0 || strikePrice <= 0 || premium <= 0 || period <= 0) {
    const error = new Error('Invalid parameters: all values must be positive');
    onError?.(error);
    throw error;
  }

  try {
    const currentBlock = await getCurrentBlockHeight();
    if (currentBlock === 0) {
      throw new Error('Unable to fetch current block height');
    }

    const blocksPerDay = 144;
    const BLOCK_BUFFER = 20;
    const expiryBlock = currentBlock + Math.floor(period) * blocksPerDay + BLOCK_BUFFER;

    console.log(`Block calculation: current=${currentBlock}, expiry=${expiryBlock}, period=${period} days`);

    const amountMicro = toMicroUnits(amount);
    const strikeMicro = toMicroUnits(strikePrice);
    const premiumMicro = toMicroUnits(premium);

    console.log('Micro unit conversion:', {
      amountMicro,
      strikeMicro,
      premiumMicro,
      expiryBlock,
    });

    const { functionName, functionArgs } = getStrategyFunctionDetails(
      strategy,
      amountMicro,
      strikeMicro,
      premiumMicro,
      expiryBlock
    );

    console.log(`Calling contract function: ${functionName}`);
    console.log('Function args:', functionArgs.map((arg) => arg.value?.toString()));

    // Build the contract call transaction
    const transaction = await makeContractCall({
      network: getNetwork(),
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName,
      functionArgs,
      senderKey: userAddress,
      postConditionMode: PostConditionMode.Allow,
    });

    console.log('Transaction built, sending to wallet for signing...');

    // Sign the transaction using Turnkey
    const signedTx = await signTransaction(transaction);

    console.log('Transaction signed:', signedTx.substring(0, 50) + '...');

    // Broadcast the signed transaction
    const response = await broadcastTransaction({
      transaction: signedTx as any,
      network: getNetwork(),
    });

    console.log('Transaction broadcasted:', response);
    onFinish?.({ txId: response as any});

  } catch (error) {
    console.error('Error creating option:', error);
    const err = error instanceof Error ? error : new Error(String(error));
    onError?.(err);
    onCancel?.();
    throw error;
  }
}

export async function monitorTransaction(
  txId: string,
  onUpdate: (status: string, details?: any) => void,
  maxAttempts = 60
): Promise<boolean> {
  console.log(`Starting transaction monitoring for ${txId}`);

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
      console.log(`Transaction ${txId} status: ${data.tx_status} (attempt ${i + 1}/${maxAttempts})`);

      if (data.tx_status === 'success') {
        console.log(`Transaction confirmed: ${txId}`);
        onUpdate('confirmed', {
          blockHeight: data.block_height,
          blockHash: data.block_hash,
        });
        return true;
      }

      if (data.tx_status === 'abort_by_response' || data.tx_status === 'abort_by_post_condition') {
        console.error(`Transaction failed: ${txId}`, data);
        onUpdate('failed', {
          reason: data.tx_result?.repr || 'Unknown error',
          errorCode: data.tx_status,
        });
        return false;
      }

      onUpdate('pending', {
        attempts: i + 1,
        maxAttempts,
        nonce: data.nonce,
      });

    } catch (error) {
      console.error(`Error checking transaction ${txId}:`, error);
      onUpdate('pending');
    }

    const delay = i < 15 ? 2000 : 5000;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  console.warn(`Transaction monitoring timeout for ${txId}`);
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