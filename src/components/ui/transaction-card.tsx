import { WhaleTransaction } from '../../hooks/useWhaleWebSocket';

interface TransactionCardProps {
  transaction: WhaleTransaction;
  onWhaleClick?: (address: string) => void;
}

export function TransactionCard({ transaction, onWhaleClick }: TransactionCardProps) {
  const { whale, transaction: tx } = transaction;
  
  // Intent colors
  const intentColors = {
    bullish: 'from-emerald-500/20 to-green-500/20 border-emerald-500/30',
    bearish: 'from-red-500/20 to-rose-500/20 border-red-500/30',
    neutral: 'from-gray-500/20 to-slate-500/20 border-gray-500/30'
  };
  
  const intentIcons = {
    bullish: '🟢',
    bearish: '🔴',
    neutral: '⚪'
  };
  
  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };
  
  const timeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };
  
  return (
    <div 
      className={`backdrop-blur-md bg-gradient-to-r ${intentColors[tx.intent]} 
                  border rounded-lg p-3 transition-all hover:scale-[1.02] cursor-pointer`}
      onClick={() => onWhaleClick?.(whale.address)}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Whale info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{intentIcons[tx.intent]}</span>
            <span className="text-white/90 font-mono text-sm truncate">
              {whale.alias || formatAddress(whale.address)}
            </span>
          </div>
          
          <p className="text-white/70 text-sm mb-1">{tx.action}</p>
          
          {tx.protocol && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md 
                          bg-white/5 border border-white/10">
              <span className="text-xs text-white/60">{tx.protocol}</span>
            </div>
          )}
        </div>
        
        {/* Right: Value and time */}
        <div className="text-right">
          <div className="text-white font-semibold text-sm mb-1">
            {formatCurrency(tx.valueUSD)}
          </div>
          <div className="text-white/50 text-xs">
            {timeAgo(tx.timestamp)}
          </div>
        </div>
      </div>
      
      {transaction.isSignificant && (
        <div className="mt-2 pt-2 border-t border-white/10">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-yellow-400">⚡</span>
            <span className="text-yellow-400/90">Significant Movement</span>
          </div>
        </div>
      )}
    </div>
  );
}
