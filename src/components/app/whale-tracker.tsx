/**
 * Whale Tracker Component
 * Displays whale wallet activities and allows users to follow successful traders
 */

import { useState, useEffect } from "react";
import { Icons } from "../ui/icons";
import { 
  socialSentimentService, 
  type WhaleWallet
} from "../../services/socialSentimentService";

interface WhaleTrackerProps {
  onWhaleSelect?: (whale: WhaleWallet) => void;
  maxWhales?: number;
}

export function WhaleTracker({ onWhaleSelect, maxWhales = 5 }: WhaleTrackerProps) {
  const [whales, setWhales] = useState<WhaleWallet[]>([]);
  const [selectedWhale, setSelectedWhale] = useState<WhaleWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bullish' | 'bearish' | 'volatile' | 'conservative'>('all');

  useEffect(() => {
    const fetchWhales = async () => {
      setLoading(true);
      try {
        const whaleData = filter === 'all' 
          ? await socialSentimentService.getTopWhales(maxWhales)
          : await socialSentimentService.getWhalesByStrategy(filter);
        
        setWhales(whaleData.slice(0, maxWhales));
      } catch (error) {
        console.error('Failed to fetch whale data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWhales();

    // Subscribe to updates
    const unsubscribe = socialSentimentService.subscribe((data) => {
      const filteredWhales = filter === 'all' 
        ? data.whaleActivity.slice(0, maxWhales)
        : data.whaleActivity.filter(w => w.strategy === filter).slice(0, maxWhales);
      
      setWhales(filteredWhales);
    });

    return unsubscribe;
  }, [filter, maxWhales]);

  const handleFollowWhale = async (whaleId: string) => {
    try {
      const success = await socialSentimentService.followWhale(whaleId);
      if (success) {
        // Update local state to reflect follower count change
        setWhales(prev => prev.map(whale => 
          whale.id === whaleId 
            ? { ...whale, followersCount: whale.followersCount + 1 }
            : whale
        ));
      }
    } catch (error) {
      console.error('Failed to follow whale:', error);
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'bullish': return 'text-green-400';
      case 'bearish': return 'text-red-400';
      case 'volatile': return 'text-yellow-400';
      case 'conservative': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'bullish': return <Icons.arrowUpRight className="w-4 h-4" />;
      case 'bearish': return <Icons.arrowDownRight className="w-4 h-4" />;
      case 'volatile': return <Icons.waves className="w-4 h-4" />;
      case 'conservative': return <Icons.shield className="w-4 h-4" />;
      default: return <Icons.user className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Icons.users className="w-5 h-5" style={{ color: 'var(--accent-green-strong)' }} />
          <h3 className="text-lg font-bold text-white">Whale Tracker</h3>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse card p-3">
              <div className="h-14 bg-gray-700 rounded-md"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icons.users className="w-5 h-5" style={{ color: 'var(--accent-green-strong)' }} />
          <h3 className="text-lg font-bold text-white">Whale Tracker</h3>
        </div>
        
        {/* Strategy Filter */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="bg-[#121412] border border-white/10 rounded-lg px-3 py-1 text-sm text-white focus:outline-hidden focus:border-[#bbf838]/50"
        >
          <option value="all">All Strategies</option>
          <option value="bullish">Bullish</option>
          <option value="bearish">Bearish</option>
          <option value="volatile">Volatile</option>
          <option value="conservative">Conservative</option>
        </select>
      </div>

      <div className="space-y-3">
        {whales.map((whale) => (
          <div
            key={whale.id}
            className="card p-4 cursor-pointer"
            onClick={() => {
              setSelectedWhale(selectedWhale?.id === whale.id ? null : whale);
              onWhaleSelect?.(whale);
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#131712] flex items-center justify-center border border-white/5" style={{ boxShadow: '0 8px 24px rgba(55,247,65,0.06)' }}>
                  <span className="text-white font-bold text-sm">
                    {whale.alias.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{whale.alias}</span>
                    {whale.isVerified && (
                      <Icons.check className="w-4 h-4 text-[var(--accent-green)]" />
                    )}
                    <div className={`flex items-center gap-1 ${getStrategyColor(whale.strategy)}`}>
                      {getStrategyIcon(whale.strategy)}
                      <span className="text-xs capitalize">{whale.strategy}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-3">
                    <span>{formatCurrency(whale.totalValue)} Portfolio</span>
                    <span>{whale.winRate}% Win Rate</span>
                    <span>{whale.followersCount} Followers</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className={`text-sm font-bold ${whale.avgProfitLoss >= 0 ? 'text-[var(--accent-green)]' : 'text-red-400'}`}>
                  {whale.avgProfitLoss >= 0 ? '+' : ''}{whale.avgProfitLoss.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-400">
                  {formatTimeAgo(whale.lastTradeTime)}
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {selectedWhale?.id === whale.id && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-white">Recent Trades</h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFollowWhale(whale.id);
                    }}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg"
                    style={{ backgroundColor: 'var(--accent-green)', color: '#000', boxShadow: '0 8px 30px rgba(55,247,65,0.08)' }}
                  >
                    Follow Whale
                  </button>
                </div>
                
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {whale.recentTrades.slice(0, 3).map((trade) => (
                    <div
                      key={trade.txId}
                      className="flex items-center justify-between text-xs bg-[#0a0b0a] rounded-lg p-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          trade.action === 'BUY' 
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {trade.action}
                        </span>
                        <span className="text-white">{trade.strategy}</span>
                        <span className="text-gray-400">{trade.asset}</span>
                      </div>
                      
                      <div className="text-right">
                        <div className={`font-bold ${
                          (trade.profitLoss || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {(trade.profitLoss || 0) >= 0 ? '+' : ''}{(trade.profitLoss || 0).toFixed(1)}%
                        </div>
                        <div className="text-gray-500">
                          {formatTimeAgo(trade.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {whales.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Icons.users className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No whale activity found for this strategy</p>
        </div>
      )}
    </div>
  );
}
