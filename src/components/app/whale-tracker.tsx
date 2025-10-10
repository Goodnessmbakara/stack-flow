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
      <div className="bg-[#1D2215] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Icons.users className="w-5 h-5 text-[#bbf838]" />
          <h3 className="text-lg font-bold text-white">Whale Tracker</h3>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-700 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1D2215] rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icons.users className="w-5 h-5 text-[#bbf838]" />
          <h3 className="text-lg font-bold text-white">Whale Tracker</h3>
        </div>
        
        {/* Strategy Filter */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="bg-[#121412] border border-white/10 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:border-[#bbf838]/50"
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
            className="bg-[#121412] rounded-lg p-4 border border-white/5 hover:border-[#bbf838]/20 transition-colors cursor-pointer"
            onClick={() => {
              setSelectedWhale(selectedWhale?.id === whale.id ? null : whale);
              onWhaleSelect?.(whale);
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#37f741] to-[#FDEE61] flex items-center justify-center">
                  <span className="text-black font-bold text-sm">
                    {whale.alias.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{whale.alias}</span>
                    {whale.isVerified && (
                      <Icons.check className="w-4 h-4 text-[#bbf838]" />
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
                <div className={`text-sm font-bold ${whale.avgProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
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
                    className="px-3 py-1.5 bg-gradient-to-r from-[#37f741] to-[#FDEE61] text-black text-xs font-bold rounded-lg hover:opacity-90 transition-opacity"
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
