/**
 * Copy Trading Pools Component
 * Displays copy trading pools that users can join to follow successful strategies
 */

import { useState, useEffect } from "react";
import { Icons } from "../ui/icons";
import { 
  socialSentimentService, 
  type CopyTradingPool
} from "../../services/socialSentimentService";
import { JoinPoolModal } from "../molecules/JoinPoolModal";
import { toast } from "react-toastify";

interface CopyTradingPoolsProps {
  maxPools?: number;
  onPoolJoin?: (pool: CopyTradingPool) => void;
}

export function CopyTradingPools({ maxPools = 3, onPoolJoin }: CopyTradingPoolsProps) {
  const [pools, setPools] = useState<CopyTradingPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPool, setSelectedPool] = useState<CopyTradingPool | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    const fetchPools = async () => {
      setLoading(true);
      try {
        const poolsData = await socialSentimentService.getCopyTradingPools();
        setPools(poolsData.slice(0, maxPools));
      } catch (error) {
        console.error('Failed to fetch copy trading pools:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPools();

    // Subscribe to updates
    const unsubscribe = socialSentimentService.subscribe((data) => {
      setPools(data.copyTradingPools.filter(p => p.isActive).slice(0, maxPools));
    });

    return unsubscribe;
  }, [maxPools]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-400 bg-green-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'high': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return <Icons.shield className="w-4 h-4" />;
      case 'medium': return <Icons.waves className="w-4 h-4" />;
      case 'high': return <Icons.fire className="w-4 h-4" />;
      default: return <Icons.questionMark className="w-4 h-4" />;
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 10) return 'text-green-400';
    if (performance >= 0) return 'text-yellow-400';
    return 'text-red-400';
  };

  const handleJoinPool = (pool: CopyTradingPool) => {
    setSelectedPool(pool);
    setShowJoinModal(true);
  };

  const handleJoinSuccess = (txId: string, amount: number) => {
    toast.success(`Successfully joined ${selectedPool?.name}! Transaction: ${txId.slice(0, 10)}...`);
    
    if (selectedPool) {
      onPoolJoin?.(selectedPool);
      // Update local state to reflect participant count change
      setPools(prev => prev.map(p => 
        p.id === selectedPool.id 
          ? { ...p, participantsCount: p.participantsCount + 1, totalValue: p.totalValue + amount }
          : p
      ));
    }
  };

  const handleCloseModal = () => {
    setShowJoinModal(false);
    setSelectedPool(null);
  };

  if (loading) {
    return (
      <div className="bg-[#1D2215] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Icons.trending className="w-5 h-5 text-[#bbf838]" />
          <h3 className="text-lg font-bold text-white">Copy Trading Pools</h3>
        </div>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-700 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1D2215] rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icons.trending className="w-5 h-5 text-[#bbf838]" />
        <h3 className="text-lg font-bold text-white">Copy Trading Pools</h3>
      </div>

      <div className="space-y-4">
        {pools.map((pool) => (
          <div
            key={pool.id}
            className="bg-[#121412] rounded-lg p-4 border border-white/5 hover:border-[#bbf838]/20 transition-colors"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-white font-bold text-sm">{pool.name}</h4>
                  <div className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getRiskColor(pool.riskLevel)}`}>
                    {getRiskIcon(pool.riskLevel)}
                    {pool.riskLevel.toUpperCase()} RISK
                  </div>
                </div>
                <p className="text-gray-400 text-xs mb-2">{pool.description}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>By {pool.managerAlias}</span>
                  <span>•</span>
                  <span>{pool.strategy}</span>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-3 bg-[#0a0b0a] rounded-lg">
              <div className="text-center">
                <div className={`text-sm font-bold ${getPerformanceColor(pool.performanceData['24h'])}`}>
                  {pool.performanceData['24h'] >= 0 ? '+' : ''}{pool.performanceData['24h'].toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">24h</div>
              </div>
              <div className="text-center">
                <div className={`text-sm font-bold ${getPerformanceColor(pool.performanceData['7d'])}`}>
                  {pool.performanceData['7d'] >= 0 ? '+' : ''}{pool.performanceData['7d'].toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">7d</div>
              </div>
              <div className="text-center">
                <div className={`text-sm font-bold ${getPerformanceColor(pool.performanceData['30d'])}`}>
                  {pool.performanceData['30d'] >= 0 ? '+' : ''}{pool.performanceData['30d'].toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">30d</div>
              </div>
              <div className="text-center">
                <div className={`text-sm font-bold ${getPerformanceColor(pool.performanceData.all)}`}>
                  {pool.performanceData.all >= 0 ? '+' : ''}{pool.performanceData.all.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">All time</div>
              </div>
            </div>

            {/* Pool Details */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
              <div>
                <div className="text-gray-400">Total Value</div>
                <div className="text-white font-bold">{formatCurrency(pool.totalValue)}</div>
              </div>
              <div>
                <div className="text-gray-400">Participants</div>
                <div className="text-white font-bold">{pool.participantsCount}</div>
              </div>
              <div>
                <div className="text-gray-400">Min Investment</div>
                <div className="text-white font-bold">{pool.minInvestment} STX</div>
              </div>
              <div>
                <div className="text-gray-400">Management Fee</div>
                <div className="text-white font-bold">{pool.managementFee}%</div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => handleJoinPool(pool)}
              className="w-full py-2 px-4 bg-gradient-to-r from-[#37f741] to-[#FDEE61] text-black text-sm font-bold rounded-lg hover:opacity-90 transition-opacity"
            >
              Join Pool (Min: {pool.minInvestment} STX)
            </button>
          </div>
        ))}
      </div>

      {pools.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Icons.trending className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No active copy trading pools available</p>
        </div>
      )}

      {/* Join Pool Modal */}
      <JoinPoolModal
        isOpen={showJoinModal}
        onClose={handleCloseModal}
        pool={selectedPool}
        onSuccess={handleJoinSuccess}
      />
    </div>
  );
}
