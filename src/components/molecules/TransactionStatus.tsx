/**
 * Transaction Status Component
 * 
 * Shows real-time transaction status:
 * - Pending (waiting for confirmation)
 * - Success (confirmed)
 * - Failed (error occurred)
 * 
 * Includes link to Stacks Explorer
 */

import { useEffect, useState } from "react";
import { Icons } from "../ui/icons";
import { InlineLoader } from "../ui/inline-loader";

interface TransactionStatusProps {
  txId: string;
  status: "pending" | "success" | "failed";
  blockHeight?: number;
  error?: string;
  explorerUrl?: string;
  onClose?: () => void;
}

export function TransactionStatus({
  txId,
  status,
  blockHeight,
  error,
  explorerUrl,
  onClose,
}: TransactionStatusProps) {
  const [dots, setDots] = useState(".");

  // Animate loading dots
  useEffect(() => {
    if (status === "pending") {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [status]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 mx-4 space-y-4 rounded-lg bg-gradient-to-b from-[#1D2215] to-[#121412] border border-white/10">
        {/* Header */}
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-bold text-white">
            {status === "pending" && "Processing Transaction"}
            {status === "success" && "Transaction Successful!"}
            {status === "failed" && "Transaction Failed"}
          </h3>
          {onClose && status !== "pending" && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Icons.close />
            </button>
          )}
        </div>

        {/* Status Icon */}
        <div className="flex justify-center py-6">
          {status === "pending" && (
            <div className="relative">
              <InlineLoader />
              <p className="mt-4 text-sm text-gray-400 text-center">
                Confirming{dots}
              </p>
            </div>
          )}
          {status === "success" && (
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-[#37f741] to-[#FDEE61] flex items-center justify-center">
                <Icons.check className="w-8 h-8 text-black" />
              </div>
              {blockHeight && (
                <p className="text-sm text-gray-400">
                  Confirmed at block #{blockHeight}
                </p>
              )}
            </div>
          )}
          {status === "failed" && (
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center border border-red-500">
                <Icons.close className="w-8 h-8 text-red-500" />
              </div>
              {error && (
                <p className="text-sm text-red-400 max-w-xs mx-auto">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Transaction ID */}
        <div className="space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Transaction ID
          </p>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-black/50 border border-white/5">
            <code className="flex-1 text-xs text-gray-300 font-mono truncate">
              {txId}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(txId)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title="Copy transaction ID"
            >
              <Icons.copy className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Explorer Link */}
        {explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full p-3 rounded-lg bg-gradient-to-r from-[#37f741]/10 to-[#FDEE61]/10 border border-[#37f741]/20 hover:border-[#37f741]/40 transition-colors text-white"
          >
            <span className="text-sm">View on Stacks Explorer</span>
            <Icons.externalLink className="w-4 h-4" />
          </a>
        )}

        {/* Action Button */}
        {status === "success" && onClose && (
          <button
            onClick={onClose}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-[#37f741] to-[#FDEE61] text-black font-bold hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        )}

        {status === "failed" && onClose && (
          <button
            onClick={onClose}
            className="w-full py-3 rounded-lg bg-gray-700 text-white font-bold hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        )}

        {/* Pending Info */}
        {status === "pending" && (
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm text-blue-300 text-center">
              Please wait while your transaction is being confirmed on the blockchain.
              This usually takes 1-2 minutes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}



