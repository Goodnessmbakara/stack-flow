/**
 * Join Pool Modal Component
 * Modal for joining copy trading pools with amount input and blockchain transaction
 */

import { useState, useEffect } from "react";
import { Icons } from "../ui/icons";
import { toast } from "react-toastify";
import { type CopyTradingPool } from "../../services/socialSentimentService";
import { useWallet } from "../../context/WalletContext";
import { useTokenService } from "../../services/tokenService";

interface JoinPoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  pool: CopyTradingPool | null;
  onSuccess: (txId: string, amount: number) => void;
}

export function JoinPoolModal({ isOpen, onClose, pool, onSuccess }: JoinPoolModalProps) {
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  
  const { address } = useWallet();
  const tokenService = useTokenService();

  // Fetch user balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!address) return;
      try {
        const userBalance = await tokenService.getPrimaryBalance();
        setBalance(userBalance);
      } catch (error) {
        console.error('Failed to fetch balance:', error);
      }
    };

    if (isOpen && address) {
      fetchBalance();
    }
  }, [isOpen, address, tokenService]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && pool) {
      setAmount("50"); // Default to 50 STX
    } else {
      setAmount("");
    }
  }, [isOpen, pool]);

  const handleJoinPool = async () => {
    if (!pool || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    const investAmount = parseFloat(amount);

    // Validation
    if (isNaN(investAmount) || investAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (investAmount < pool.minInvestment) {
      toast.error(`Minimum investment is ${pool.minInvestment} STX`);
      return;
    }

    if (investAmount > balance) {
      toast.error("Insufficient balance");
      return;
    }

    setIsProcessing(true);

    try {
      // Import transaction manager
      const { createPoolInvestment, monitorTransaction } = await import(
        "../../blockchain/stacks/poolInvestmentManager"
      );

      await createPoolInvestment({
        poolId: pool.id,
        amount: investAmount,
        poolManagerAddress: pool.managerAddress,
        userAddress: address,
        onFinish: async (data: any) => {
          console.log("✓ Pool investment transaction broadcast:", data.txId);
          toast.info("Transaction submitted! Monitoring confirmation...");
          
          // Monitor transaction
          const confirmed = await monitorTransaction(
            data.txId,
            (status: string, details: any) => {
              console.log("Pool investment status update:", status, details);
              
              if (status === "confirmed") {
                toast.success(`Successfully joined ${pool.name}! Block: ${details?.blockHeight}`);
                onSuccess(data.txId, investAmount);
                onClose();
              } else if (status === "failed") {
                toast.error(`Transaction failed: ${details?.reason || 'Unknown error'}`);
                setIsProcessing(false);
              }
            }
          );
          
          if (!confirmed) {
            setIsProcessing(false);
          }
        },
        onCancel: () => {
          toast.info("Transaction cancelled");
          setIsProcessing(false);
        },
      });
    } catch (error) {
      console.error("Failed to join pool:", error);
      toast.error("Failed to join pool. Please try again.");
      setIsProcessing(false);
    }
  };

  if (!isOpen || !pool) return null;

  const investAmount = parseFloat(amount) || 0;
  const isValidAmount = investAmount >= pool.minInvestment && investAmount <= balance;
  const platformFee = investAmount * 0.001; // 0.1% platform fee
  const totalCost = investAmount + platformFee;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-[#1D2215] rounded-lg p-6 w-full max-w-md border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Join Copy Trading Pool</h3>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <Icons.close className="w-6 h-6" />
          </button>
        </div>

        {/* Pool Info */}
        <div className="bg-[#121412] rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-white font-bold">{pool.name}</h4>
            <div className="px-2 py-1 rounded-full text-xs font-bold" style={{ background: pool.riskLevel === 'high' ? 'rgba(255,77,77,0.12)' : pool.riskLevel === 'medium' ? 'rgba(245,197,66,0.12)' : 'rgba(55,247,65,0.12)', color: pool.riskLevel === 'high' ? '#ff4d4d' : pool.riskLevel === 'medium' ? '#f5c542' : 'var(--accent-green)' }}>
              {pool.riskLevel.toUpperCase()} RISK
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-3">{pool.description}</p>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-gray-400">Performance (30d)</div>
              <div className="text-green-400 font-bold">
                +{pool.performanceData['30d'].toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-gray-400">Management Fee</div>
              <div className="text-white font-bold">{pool.managementFee}%</div>
            </div>
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <label className="block text-white text-sm font-medium mb-2">
            Investment Amount (STX)
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isProcessing}
              min={pool.minInvestment}
              max={balance}
              step="0.01"
              className="w-full bg-[#121412] border border-white/10 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-hidden disabled:opacity-50"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
              placeholder={`Min: ${pool.minInvestment} STX`}
            />
            <div className="absolute right-3 top-3 text-gray-400 text-sm">STX</div>
          </div>
          
          {/* Balance and Min Info */}
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>Min: {pool.minInvestment} STX</span>
            <span>Balance: {balance.toFixed(2)} STX</span>
          </div>
          
          {investAmount > 0 && investAmount < pool.minInvestment && (
            <div className="text-red-400 text-xs mt-1">
              Amount must be at least {pool.minInvestment} STX
            </div>
          )}
          
          {investAmount > balance && (
            <div className="text-red-400 text-xs mt-1">
              Insufficient balance
            </div>
          )}
        </div>

        {/* Cost Breakdown */}
          <div className="bg-[#121412] rounded-lg p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Investment Amount</span>
            <span className="text-white">{investAmount.toFixed(2)} STX</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Platform Fee (0.1%)</span>
            <span className="text-white">{platformFee.toFixed(4)} STX</span>
          </div>
          <div className="border-t border-white/10 pt-2">
            <div className="flex justify-between text-sm font-bold">
              <span className="text-white">Total Cost</span>
              <span style={{ color: 'var(--accent-green-strong)', fontWeight: 700 }}>{totalCost.toFixed(4)} STX</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 py-3 px-4 bg-[#121412] text-white rounded-lg border border-white/10 hover:border-white/20 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleJoinPool}
            disabled={isProcessing || !isValidAmount || !address}
            className="flex-1 py-3 px-4 text-black font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--accent-green)', color: '#000', boxShadow: '0 10px 30px rgba(55,247,65,0.08)' }}
          >
            {isProcessing ? (
              <>
                <Icons.waves className="w-4 h-4 animate-pulse" />
                Processing...
              </>
            ) : (
              `Join Pool`
            )}
          </button>
        </div>

        {!address && (
          <div className="text-center text-yellow-400 text-sm mt-4">
            Please connect your wallet to join pools
          </div>
        )}
      </div>
    </div>
  );
}
