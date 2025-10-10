/**
 * StackFlow Transaction Manager
 * 
 * Handles all smart contract interactions:
 * - Creating options (CALL, STRAP, BCSP, BPSP)
 * - Exercising options
 * - Transaction monitoring
 * - Post-conditions for safety
 * 
 * Uses @stacks/connect for wallet integration
 */

import { 
  uintCV,
  PostCondition,
  makeSTXPostCondition,
  FungibleConditionCode,
  PostConditionMode,
  AnchorMode
} from '@stacks/transactions';

import { 
  openContractCall,
  FinishedTxData 
} from '@stacks/connect';

import { 
  StacksMainnet,
  StacksTestnet,
  StacksDevnet
} from '@stacks/network';

// Contract configuration
const DEVNET_CONTRACT = {
  address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  name: 'stackflow-options-v1',
};

const TESTNET_CONTRACT = {
  address: 'ST1CS6D7VNBJD300QT2S2SKXG9C36TV1KAT63222S',
  name: 'stackflow-options-v1',
};

// Get environment (default to testnet for Leather wallet compatibility)
const ENV = import.meta.env.VITE_NETWORK || 'testnet';

export const CONTRACT_ADDRESS = ENV === 'devnet' 
  ? DEVNET_CONTRACT.address 
  : ENV === 'testnet'
  ? TESTNET_CONTRACT.address
  : import.meta.env.VITE_CONTRACT_ADDRESS || TESTNET_CONTRACT.address;

export const CONTRACT_NAME = 'stackflow-options-v1';

// Network configuration
export function getNetwork() {
  switch (ENV) {
    case 'devnet':
      return new StacksDevnet();
    case 'testnet':
      return new StacksTestnet();
    case 'mainnet':
      return new StacksMainnet();
    default:
      return new StacksTestnet(); // Default to testnet for Leather compatibility
  }
}

// Strategy type
export type StrategyType = 'CALL' | 'STRAP' | 'BCSP' | 'BPSP';

// Transaction result
export interface TransactionResult {
  txId: string;
  success: boolean;
  error?: string;
}

/**
 * Create option parameters
 */
export interface CreateOptionParams {
  strategy: StrategyType;
  amount: number;          // STX amount
  strikePrice: number;     // USD price
  premium: number;         // STX premium
  period: number;          // Days
  userAddress: string;
  onFinish?: (data: FinishedTxData) => void;
  onCancel?: () => void;
}

/**
 * Get current block height
 */
async function getCurrentBlockHeight(): Promise<number> {
  const network = getNetwork();
  try {
    const response = await fetch(`${network.coreApiUrl}/v2/info`);
    const data = await response.json();
    return data.stacks_tip_height || 0;
  } catch (error) {
    console.error('[TxManager] Failed to get block height:', error);
    return 0;
  }
}

/**
 * Convert to micro-units (STX and USD use 6 decimals)
 */
function toMicroUnits(value: number): number {
  return Math.floor(value * 1_000_000);
}

/**
 * Create CALL option
 */
export async function createCallOption(params: CreateOptionParams): Promise<TransactionResult> {
  const {
    amount,
    strikePrice,
    premium,
    period,
    userAddress,
    onFinish,
    onCancel,
  } = params;
  
  try {
    // Convert to micro-units
    const amountMicro = toMicroUnits(amount);
    const strikeMicro = toMicroUnits(strikePrice);
    const premiumMicro = toMicroUnits(premium);
    
    // Calculate expiry block
    const currentBlock = await getCurrentBlockHeight();
    const expiryBlock = currentBlock + (period * 144); // 144 blocks per day
    
    // Build function arguments
    const functionArgs = [
      uintCV(amountMicro),
      uintCV(strikeMicro),
      uintCV(premiumMicro),
      uintCV(expiryBlock),
    ];
    
    // Add post-condition: User must transfer premium + fee (0.1%)
    const totalCost = premiumMicro + Math.floor(premiumMicro * 0.001);
    const postConditions: PostCondition[] = [
      makeSTXPostCondition(
        userAddress,
        FungibleConditionCode.LessEqual,
        totalCost
      ),
    ];
    
    // Open contract call - returns void, transaction details come through callbacks
    await openContractCall({
      network: getNetwork(),
      anchorMode: AnchorMode.Any,
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'create-call-option',
      functionArgs,
      postConditions,
      postConditionMode: PostConditionMode.Deny,
      onFinish: (data: FinishedTxData) => {
        console.log('[TxManager] ✓ CALL option transaction broadcast:', data.txId);
        onFinish?.(data);
      },
      onCancel: () => {
        console.log('[TxManager] Transaction cancelled by user');
        onCancel?.();
      },
    });
    
    // Note: The actual txId comes through the onFinish callback
    // We return a placeholder here since the wallet interaction is async
    return {
      txId: 'pending',
      success: true,
    };
  } catch (error) {
    console.error('[TxManager] ✗ Failed to create CALL option:', error);
    return {
      txId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create STRAP option
 */
export async function createStrapOption(params: CreateOptionParams): Promise<TransactionResult> {
  const {
    amount,
    strikePrice,
    premium,
    period,
    userAddress,
    onFinish,
    onCancel,
  } = params;
  
  try {
    const amountMicro = toMicroUnits(amount);
    const strikeMicro = toMicroUnits(strikePrice);
    const premiumMicro = toMicroUnits(premium);
    const currentBlock = await getCurrentBlockHeight();
    const expiryBlock = currentBlock + (period * 144);
    
    const functionArgs = [
      uintCV(amountMicro),
      uintCV(strikeMicro),
      uintCV(premiumMicro),
      uintCV(expiryBlock),
    ];
    
    const totalCost = premiumMicro + Math.floor(premiumMicro * 0.001);
    const postConditions: PostCondition[] = [
      makeStandardSTXPostCondition(
        userAddress,
        FungibleConditionCode.LessEqual,
        totalCost
      ),
    ];
    
    await openContractCall({
      network: getNetwork(),
      anchorMode: AnchorMode.Any,
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'create-strap-option',
      functionArgs,
      postConditions,
      postConditionMode: PostConditionMode.Deny,
      onFinish: (data: FinishedTxData) => {
        console.log('[TxManager] ✓ STRAP option transaction broadcast:', data.txId);
        onFinish?.(data);
      },
      onCancel: () => {
        console.log('[TxManager] Transaction cancelled');
        onCancel?.();
      },
    });
    
    return {
      txId: 'pending',
      success: true,
    };
  } catch (error) {
    console.error('[TxManager] ✗ Failed to create STRAP option:', error);
    return {
      txId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create Bull Call Spread
 */
export async function createBullCallSpread(params: CreateOptionParams): Promise<TransactionResult> {
  const {
    amount,
    strikePrice,
    premium,
    period,
    userAddress,
    onFinish,
    onCancel,
  } = params;
  
  try {
    const amountMicro = toMicroUnits(amount);
    const lowerStrikeMicro = toMicroUnits(strikePrice);
    const upperStrikeMicro = toMicroUnits(strikePrice * 1.1); // 10% spread
    const premiumMicro = toMicroUnits(premium);
    const currentBlock = await getCurrentBlockHeight();
    const expiryBlock = currentBlock + (period * 144);
    
    const functionArgs = [
      uintCV(amountMicro),
      uintCV(lowerStrikeMicro),
      uintCV(upperStrikeMicro),
      uintCV(premiumMicro),
      uintCV(expiryBlock),
    ];
    
    const totalCost = premiumMicro + Math.floor(premiumMicro * 0.001);
    const postConditions: PostCondition[] = [
      makeStandardSTXPostCondition(
        userAddress,
        FungibleConditionCode.LessEqual,
        totalCost
      ),
    ];
    
    await openContractCall({
      network: getNetwork(),
      anchorMode: AnchorMode.Any,
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'create-bull-call-spread',
      functionArgs,
      postConditions,
      postConditionMode: PostConditionMode.Deny,
      onFinish: (data: FinishedTxData) => {
        console.log('[TxManager] ✓ Bull Call Spread transaction broadcast:', data.txId);
        onFinish?.(data);
      },
      onCancel: () => {
        console.log('[TxManager] Transaction cancelled');
        onCancel?.();
      },
    });
    
    return {
      txId: 'pending',
      success: true,
    };
  } catch (error) {
    console.error('[TxManager] ✗ Failed to create Bull Call Spread:', error);
    return {
      txId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create Bull Put Spread
 */
export async function createBullPutSpread(params: CreateOptionParams): Promise<TransactionResult> {
  const {
    amount,
    strikePrice,
    premium,
    period,
    userAddress,
    onFinish,
    onCancel,
  } = params;
  
  try {
    const amountMicro = toMicroUnits(amount);
    const upperStrikeMicro = toMicroUnits(strikePrice);
    const lowerStrikeMicro = toMicroUnits(strikePrice * 0.9); // 10% spread
    const collateralMicro = toMicroUnits(premium); // Collateral = max loss
    const currentBlock = await getCurrentBlockHeight();
    const expiryBlock = currentBlock + (period * 144);
    
    const functionArgs = [
      uintCV(amountMicro),
      uintCV(lowerStrikeMicro),
      uintCV(upperStrikeMicro),
      uintCV(collateralMicro),
      uintCV(expiryBlock),
    ];
    
    const postConditions: PostCondition[] = [
      makeSTXPostCondition(
        userAddress,
        FungibleConditionCode.LessEqual,
        collateralMicro
      ),
    ];
    
    await openContractCall({
      network: getNetwork(),
      anchorMode: AnchorMode.Any,
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'create-bull-put-spread',
      functionArgs,
      postConditions,
      postConditionMode: PostConditionMode.Deny,
      onFinish: (data: FinishedTxData) => {
        console.log('[TxManager] ✓ Bull Put Spread transaction broadcast:', data.txId);
        onFinish?.(data);
      },
      onCancel: () => {
        console.log('[TxManager] Transaction cancelled');
        onCancel?.();
      },
    });
    
    return {
      txId: 'pending',
      success: true,
    };
  } catch (error) {
    console.error('[TxManager] ✗ Failed to create Bull Put Spread:', error);
    return {
      txId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Main function to create option based on strategy
 */
export async function createOption(params: CreateOptionParams): Promise<TransactionResult> {
  console.log('[TxManager] Creating option:', params.strategy);
  
  switch (params.strategy) {
    case 'CALL':
      return createCallOption(params);
    case 'STRAP':
      return createStrapOption(params);
    case 'BCSP':
      return createBullCallSpread(params);
    case 'BPSP':
      return createBullPutSpread(params);
    default:
      return {
        txId: '',
        success: false,
        error: `Unknown strategy: ${params.strategy}`,
      };
  }
}

/**
 * Exercise option
 */
export interface ExerciseOptionParams {
  optionId: number;
  currentPrice: number;  // Current USD price
  userAddress: string;
  onFinish?: (data: FinishedTxData) => void;
  onCancel?: () => void;
}

export async function exerciseOption(params: ExerciseOptionParams): Promise<TransactionResult> {
  const {
    optionId,
    currentPrice,
    userAddress,
    onFinish,
    onCancel,
  } = params;
  
  try {
    const priceMicro = toMicroUnits(currentPrice);
    
    const functionArgs = [
      uintCV(optionId),
      uintCV(priceMicro),
    ];
    
    await openContractCall({
      network: getNetwork(),
      anchorMode: AnchorMode.Any,
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'exercise-option',
      functionArgs,
      postConditionMode: PostConditionMode.Deny,
      onFinish: (data: FinishedTxData) => {
        console.log('[TxManager] ✓ Option exercised:', data.txId);
        onFinish?.(data);
      },
      onCancel: () => {
        console.log('[TxManager] Exercise cancelled');
        onCancel?.();
      },
    });
    
    return {
      txId: 'pending',
      success: true,
    };
  } catch (error) {
    console.error('[TxManager] ✗ Failed to exercise option:', error);
    return {
      txId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get transaction status
 */
export async function getTransactionStatus(txId: string): Promise<{
  status: 'pending' | 'success' | 'failed';
  blockHeight?: number;
  error?: string;
}> {
  const network = getNetwork();
  
  try {
    const response = await fetch(`${network.coreApiUrl}/extended/v1/tx/${txId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return { status: 'pending' };
      }
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.tx_status === 'success') {
      return {
        status: 'success',
        blockHeight: data.block_height,
      };
    }
    
    if (data.tx_status === 'abort_by_response' || data.tx_status === 'abort_by_post_condition') {
      return {
        status: 'failed',
        error: data.tx_result?.repr || 'Transaction failed',
      };
    }
    
    return { status: 'pending' };
  } catch (error) {
    console.error('[TxManager] Failed to get transaction status:', error);
    return { status: 'pending' };
  }
}

/**
 * Monitor transaction until confirmed
 */
export async function monitorTransaction(
  txId: string,
  onUpdate: (status: string) => void,
  maxAttempts = 30
): Promise<boolean> {
  console.log('[TxManager] Monitoring transaction:', txId);
  
  for (let i = 0; i < maxAttempts; i++) {
    const status = await getTransactionStatus(txId);
    
    if (status.status === 'success') {
      console.log('[TxManager] Transaction confirmed in block', status.blockHeight);
      onUpdate('confirmed');
      return true;
    }
    
    if (status.status === 'failed') {
      console.error('[TxManager] Transaction failed:', status.error);
      onUpdate('failed');
      return false;
    }
    
    onUpdate('pending');
    
    // Wait before next status check
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  console.warn('[TxManager] Transaction monitoring timed out');
  onUpdate('timeout');
  return false;
}