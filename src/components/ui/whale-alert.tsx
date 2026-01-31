import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { WhaleTransaction } from '../../hooks/useWhaleWebSocket';

interface WhaleAlertProps {
  transaction: WhaleTransaction;
  onDismiss: () => void;
}

export function WhaleAlert({ transaction, onDismiss }: WhaleAlertProps) {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300); // Wait for animation
    }, 8000); // Auto-dismiss after 8 seconds
    
    return () => clearTimeout(timer);
  }, [onDismiss]);
  
  if (!visible) return null;
  
  const { whale, transaction: tx } = transaction;
  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
  
  const intentColors = {
    bullish: 'from-emerald-900/95 to-green-900/95 border-emerald-500/50',
    bearish: 'from-red-900/95 to-rose-900/95 border-red-500/50',
    neutral: 'from-purple-900/95 to-blue-900/95 border-purple-500/50'
  };
  
  return (
    <div className={`fixed top-4 right-4 z-50 w-96 max-w-[90vw]
                    bg-gradient-to-r ${intentColors[tx.intent]}
                    backdrop-blur-xl border rounded-xl p-4 shadow-2xl
                    animate-slide-in-right`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-5xl animate-bounce">🐋</div>
          <div>
            <h3 className="text-white font-bold text-lg">Whale Alert!</h3>
            <p className="text-white/70 text-xs">
              {whale.alias || formatAddress(whale.address)}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setVisible(false)}
          className="text-white/50 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>
      
      {/* Content */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">
            {tx.intent === 'bullish' ? '🟢' : tx.intent === 'bearish' ? '🔴' : '⚪'}
          </span>
          <p className="text-white/90 text-sm flex-1">{tx.action}</p>
        </div>
        
        {tx.protocol && (
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-md 
                        bg-white/10 border border-white/20">
            <span className="text-xs text-white/80">via {tx.protocol}</span>
          </div>
        )}
        
        <div className="pt-3 border-t border-white/20">
          <div className="flex items-baseline gap-2">
            <span className="text-white/60 text-xs">Value:</span>
            <span className="text-emerald-400 font-mono font-bold text-xl">
              {formatCurrency(tx.valueUSD)}
            </span>
          </div>
          
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-white/60 text-xs">STX:</span>
            <span className="text-white/80 font-mono text-sm">
              {tx.valueSTX.toLocaleString()} STX
            </span>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-white/10 flex items-center gap-2">
          <span className="text-yellow-400 text-xs">⚡</span>
          <span className="text-yellow-400/90 text-xs uppercase font-semibold tracking-wider">
            {tx.intent} Signal
          </span>
        </div>
      </div>
    </div>
  );
}
