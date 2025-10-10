/**
 * Pool Investment Manager
 * Handles blockchain transactions for joining copy trading pools
 */

import { openContractCall, type FinishedTxData } from '@stacks/connect';
import { uintCV, AnchorMode, PostConditionMode } from '@stacks/transactions';
import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';

// Contract configuration
const NETWORK = import.meta.env.VITE_STACKS_NETWORK || 'testnet';
const API_URL = import.meta.env.VITE_STACKS_API_URL || 'https://api.testnet.hiro.so';

// Use the same contract for pool investments
const CONTRACT_ADDRESS = 'ST3DSAPR2WF7D7SMR6W0R436AA6YYTD8RFT9E9NPH';
const CONTRACT_NAME = 'stackflow-options-v2';

export function getNetwork() {
  return NETWORK === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
}

export interface CreatePoolInvestmentParams {
  poolId: string;
  amount: number;
  poolManagerAddress: string;
  userAddress: string;
  onFinish: (data: FinishedTxData) => void;
  onCancel: () => void;
}

export interface TransactionStatus {
  txId: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockHeight?: number;
  reason?: string;
  attempts?: number;
  maxAttempts?: number;
}

export type TransactionCallback = (status: string, details?: any) => void;

/**
 * Create a pool investment transaction
 * For now, we'll use the existing contract's create-call-option function as a placeholder
 * In a real implementation, this would be a dedicated pool investment function
 */
export async function createPoolInvestment(params: CreatePoolInvestmentParams): Promise<void> {
  const { poolId, amount, userAddress, onFinish, onCancel } = params;
  
  console.log('🏊 Creating pool investment transaction:', {
    poolId,
    amount,
    contract: `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`,
    user: userAddress
  });

  // Get current block height to calculate valid expiry
  let currentBlockHeight = 0;
  try {
    const response = await fetch(`${API_URL}/v2/info`);
    const info = await response.json();
    currentBlockHeight = info.stacks_tip_height || 0;
    console.log('📊 Current block height:', currentBlockHeight);
  } catch (error) {
    console.error('Failed to get block height, using fallback:', error);
    currentBlockHeight = 150000; // Fallback for testnet
  }

  // Convert STX amount to microSTX (1 STX = 1,000,000 microSTX)
  const amountMicroSTX = Math.floor(amount * 1_000_000);
  
  // Calculate valid expiry (current height + 2000 blocks, ~2 weeks)
  const validExpiry = currentBlockHeight + 2000;
  
  // Create a mock option transaction to represent pool investment
  // In a real implementation, this would call a dedicated pool investment function
  const functionName = 'create-call-option';
  const functionArgs = [
    uintCV(amountMicroSTX), // amount in microSTX
    uintCV(100_000_000), // strike price (100 STX in microSTX)
    uintCV(Math.floor(amount * 0.05 * 1_000_000)), // premium (5% of investment as mock)
    uintCV(validExpiry) // expiry (valid future block)
  ];

  console.log('📝 Pool investment transaction params:', {
    amount: amountMicroSTX,
    strikePrice: 100_000_000,
    premium: Math.floor(amount * 0.05 * 1_000_000),
    expiry: validExpiry,
    currentHeight: currentBlockHeight
  });

  const transactionOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName,
    functionArgs,
    network: getNetwork(),
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    onFinish,
    onCancel,
  };

  console.log('📝 Pool investment transaction options:', transactionOptions);

  try {
    await openContractCall(transactionOptions);
  } catch (error) {
    console.error('💥 Pool investment transaction failed:', error);
    throw error;
  }
}

/**
 * Monitor transaction status with progressive backoff
 */
export async function monitorTransaction(
  txId: string, 
  callback: TransactionCallback,
  maxAttempts = 20
): Promise<boolean> {
  console.log('🔍 Monitoring pool investment transaction:', txId);
  
  let attempts = 0;
  
  const checkStatus = async (): Promise<boolean> => {
    attempts++;
    
    try {
      const response = await fetch(`${API_URL}/extended/v1/tx/${txId}`);
      
      if (!response.ok) {
        if (response.status === 404 && attempts < 5) {
          // Transaction might not be indexed yet, retry soon
          console.log(`⏳ Transaction not found yet (attempt ${attempts}/${maxAttempts})`);
          callback('pending', { attempts, maxAttempts, reason: 'Transaction not indexed yet' });
          return false;
        } else {
          throw new Error(`API error: ${response.status}`);
        }
      }
      
      const txData = await response.json();
      console.log(`📊 Pool investment transaction status (attempt ${attempts}):`, txData.tx_status);
      
      switch (txData.tx_status) {
        case 'success':
          console.log('✅ Pool investment transaction confirmed!');
          callback('confirmed', { 
            blockHeight: txData.block_height,
            attempts,
            maxAttempts
          });
          return true;
          
        case 'abort_by_response':
        case 'abort_by_post_condition':
          console.log('❌ Pool investment transaction failed:', txData.tx_result);
          
          // Parse error code for better user feedback
          let errorMessage = 'Transaction failed';
          if (txData.tx_result?.repr) {
            const errorRepr = txData.tx_result.repr;
            if (errorRepr.includes('u104')) {
              errorMessage = 'Invalid expiry period';
            } else if (errorRepr.includes('u102')) {
              errorMessage = 'Invalid amount';
            } else if (errorRepr.includes('u103')) {
              errorMessage = 'Invalid premium';
            } else if (errorRepr.includes('u101')) {
              errorMessage = 'Protocol is paused';
            } else {
              errorMessage = `Contract error: ${errorRepr}`;
            }
          }
          
          callback('failed', { 
            reason: errorMessage,
            attempts,
            maxAttempts
          });
          return false;
          
        case 'pending':
        default:
          console.log(`⏳ Pool investment transaction pending (attempt ${attempts}/${maxAttempts})`);
          callback('pending', { attempts, maxAttempts });
          
          if (attempts >= maxAttempts) {
            console.log('⌛ Pool investment transaction monitoring timeout');
            callback('failed', { 
              reason: 'Monitoring timeout - transaction may still be processing',
              attempts,
              maxAttempts
            });
            return false;
          }
          
          return false;
      }
    } catch (error) {
      console.error(`💥 Error checking pool investment transaction status (attempt ${attempts}):`, error);
      
      if (attempts >= maxAttempts) {
        callback('failed', { 
          reason: `Monitoring error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          attempts,
          maxAttempts
        });
        return false;
      }
      
      callback('pending', { attempts, maxAttempts, reason: 'API error, retrying...' });
      return false;
    }
  };
  
  // Initial check
  if (await checkStatus()) {
    return true;
  }
  
  // Progressive backoff polling
  while (attempts < maxAttempts) {
    const delay = Math.min(2000 + (attempts * 1000), 10000); // 2s to 10s
    console.log(`⏱️ Waiting ${delay}ms before next pool investment check...`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    if (await checkStatus()) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get explorer URL for transaction
 */
export function getExplorerUrl(txId: string): string {
  const baseUrl = NETWORK === 'mainnet' 
    ? 'https://explorer.stacks.co' 
    : 'https://explorer.stacks.co';
  
  return `${baseUrl}/txid/${txId}?chain=${NETWORK}`;
}
