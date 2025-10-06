import { useState } from 'react';
import { Icons } from '../ui/icons';
import Button from '../atoms/Button';
import { useRealTimeData } from '../../hooks/useRealTimeData';

interface MemePool {
  id: string;
  meme: string;
  description: string;
  image?: string;
  totalPool: number;
  participants: number;
  timeLeft: string;
  sentiment: 'bullish' | 'bearish' | 'volatile' | string;
  viralScore: number;
  creator: string;
  minimumEntry: number;
  expectedReturn: string;
  riskLevel: 'Low' | 'Medium' | 'High' | string;
  tokens?: string[];
  contractId?: string;
}

const MemeInvesting = () => {
  const { memePools, loading, error, refreshData } = useRealTimeData();
  const [selectedPool, setSelectedPool] = useState<MemePool | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState<number>(50);

  // Handle loading state
  if (loading) {
    return (
      <div className="w-full h-full p-8 bg-[#1D2215] rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#bbf838]"></div>
          <p className="text-white">Loading All Stacks Meme Tokens...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="w-full h-full p-8 bg-[#1D2215] rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <p className="text-red-400">Error loading meme pools: {error}</p>
          <Button onClick={refreshData} variant="gradient">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Handle no data state
  if (!memePools || memePools.length === 0) {
    return (
      <div className="w-full h-full p-8 bg-[#1D2215] rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <p className="text-white">No active meme pools found</p>
          <Button onClick={refreshData} variant="gradient">
            <Icons.refresh className="w-4 h-4 mr-2" />
            Refresh Pools
          </Button>
        </div>
      </div>
    );
  }

  const handleInvestInPool = async () => {
    if (!selectedPool) return;
    alert(`Successfully invested ${investmentAmount} STX in "${selectedPool.meme}" pool!`);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-400 bg-green-400/20';
      case 'bearish': return 'text-red-400 bg-red-400/20';
      case 'volatile': return 'text-yellow-400 bg-yellow-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-400 bg-green-400/20';
      case 'Medium': return 'text-yellow-400 bg-yellow-400/20';
      case 'High': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  return (
    <div className="w-full h-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Meme Token Pools</h2>
          <p className="text-gray-400 text-sm">
            All Stacks meme tokens and viral investment opportunities
          </p>
        </div>
        <Button onClick={refreshData} variant="outline" className="text-sm">
          <Icons.refresh className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Real-time data indicator */}
      <div className="flex items-center space-x-2 text-sm">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-green-400">Live Token Data</span>
        <span className="text-gray-500">• {memePools.length} Pools Available</span>
      </div>

      {/* Meme Pools Grid */}
      <div className="grid gap-4 max-h-96 overflow-y-auto">
        {memePools.map((pool) => (
          <div
            key={pool.id}
            className={`p-4 rounded-lg border transition-all cursor-pointer ${
              selectedPool?.id === pool.id
                ? 'border-[#bbf838] bg-[#bbf838]/10'
                : 'border-gray-600 bg-[#2A2A2A] hover:border-gray-500'
            }`}
            onClick={() => setSelectedPool(pool)}
          >
            {/* Pool Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-bold text-white">{pool.meme}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    getSentimentColor(pool.sentiment)
                  }`}>
                    {pool.sentiment.toUpperCase()}
                  </span>
                  <span className="text-yellow-400 font-bold">
                    🔥 {pool.viralScore}
                  </span>
                </div>
                
                {/* Show supported tokens */}
                {pool.tokens && pool.tokens.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {pool.tokens.map((token, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-700 rounded text-xs text-white"
                      >
                        {token}
                      </span>
                    ))}
                  </div>
                )}
                
                <p className="text-gray-300 text-sm mb-2">{pool.description}</p>
                
                {/* Show contract ID for real tokens */}
                {pool.contractId && (
                  <p className="text-xs text-gray-500 font-mono mb-2">
                    Contract: {pool.contractId.slice(0, 20)}...
                  </p>
                )}
                
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-gray-400">by <span className="text-white">{pool.creator}</span></span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-400">{pool.timeLeft} left</span>
                </div>
              </div>
            </div>

            {/* Pool Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-white">
                  ${pool.totalPool.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">Pool Size</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">{pool.participants}</p>
                <p className="text-xs text-gray-400">Participants</p>
              </div>
              <div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  getRiskColor(pool.riskLevel)
                }`}>
                  {pool.riskLevel}
                </span>
                <p className="text-xs text-gray-400 mt-1">Risk</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Investment Panel */}
      {selectedPool && (
        <div className="p-4 bg-[#2A2A2A] rounded-lg space-y-4">
          <h3 className="text-lg font-semibold text-white">
            Invest in "{selectedPool.meme}"
          </h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Investment Amount (STX)
              </label>
              <input
                type="number"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                min={selectedPool.minimumEntry}
                step="10"
              />
            </div>
            
            <Button 
              onClick={handleInvestInPool}
              variant="gradient"
              className="w-full"
              disabled={investmentAmount < selectedPool.minimumEntry}
            >
              Invest {investmentAmount} STX
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemeInvesting;