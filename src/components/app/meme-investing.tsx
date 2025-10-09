import { useState } from 'react';
import { Icons } from '../ui/icons';
import Button from '../atoms/Button';
import { useRealTimeData } from '../../hooks/useRealTimeData';
import { MemePool } from '../../lib/types';

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
          <p className="text-white">Loading Real Stacks Pool Data...</p>
          <p className="text-gray-400 text-sm">Fetching live liquidity data from APIs...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="w-full h-full p-8 bg-[#1D2215] rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center justify-center space-y-4 max-w-md text-center">
          <div className="text-red-400 text-4xl">⚠️</div>
          <h3 className="text-white text-lg font-semibold">Real Data Unavailable</h3>
          <p className="text-red-400 text-sm">{error}</p>
          <p className="text-gray-400 text-xs">
            StackFlow only displays real blockchain data. Please check your internet connection or try again later.
          </p>
          <Button
            variant="default"
            onClick={refreshData}
            className="text-[#bbf838] border-[#bbf838] hover:bg-[#bbf838] hover:text-black"
          >
            Retry Real Data Fetch
          </Button>
        </div>
      </div>
    );
  }

  // Handle empty state (no pools available)
  if (memePools.length === 0) {
    return (
      <div className="w-full h-full p-8 bg-[#1D2215] rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center justify-center space-y-4 max-w-md text-center">
          <div className="text-yellow-400 text-4xl">📊</div>
          <h3 className="text-white text-lg font-semibold">No Active Pools</h3>
          <p className="text-gray-400 text-sm">
            No real liquidity pools are currently available from the Stacks blockchain.
          </p>
          <p className="text-gray-500 text-xs">
            This may be due to low DEX activity or API rate limits.
          </p>
          <Button
            variant="default"
            onClick={refreshData}
            className="text-[#bbf838] border-[#bbf838] hover:bg-[#bbf838] hover:text-black"
          >
            Refresh Pool Data
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
          <h2 className="text-xl font-bold text-white mb-2">Real Liquidity Pools</h2>
          <p className="text-gray-400 text-sm">
            Live DEX pools with real trading data from Stacks blockchain
          </p>
        </div>
        <Button onClick={refreshData} variant="default" className="text-sm">
          <Icons.refresh className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Real-time data indicator */}
      <div className="flex items-center space-x-2 text-sm">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-green-400">Live Pool Data</span>
        <span className="text-gray-500">• {memePools.length} Active Pools</span>
        <span className="text-gray-500">• Real Blockchain Data</span>
      </div>

      {/* Pools Grid */}
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
                  {pool.verified && (
                    <Icons.verified className="w-4 h-4 text-blue-400" />
                  )}
                  {pool.isHot && (
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-bold">
                      HOT
                    </span>
                  )}
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
                
                {/* Show real trading stats */}
                {pool.volume24h && pool.trades24h && (
                  <div className="flex space-x-4 text-xs text-gray-400 mb-2">
                    <span>Vol: ${pool.volume24h.toLocaleString()}</span>
                    <span>•</span>
                    <span>Trades: {pool.trades24h}</span>
                    <span>•</span>
                    <span className={pool.priceChange24h && pool.priceChange24h > 0 ? 'text-green-400' : 'text-red-400'}>
                      {pool.priceChange24h ? `${pool.priceChange24h > 0 ? '+' : ''}${pool.priceChange24h.toFixed(2)}%` : '0%'}
                    </span>
                  </div>
                )}
                
                {/* Show contract ID */}
                {pool.contractId && (
                  <p className="text-xs text-gray-500 font-mono mb-2">
                    Contract: {pool.contractId.slice(0, 25)}...
                  </p>
                )}
                
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-gray-400">by <span className="text-white">{pool.creator}</span></span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-400">{pool.timeLeft}</span>
                </div>
              </div>
            </div>

            {/* Pool Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-white">
                  ${pool.totalPool.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">Total Liquidity</p>
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
            Enter Pool: "{selectedPool.meme}"
          </h3>
          
          {/* Show real pool stats */}
          {selectedPool.volume24h && (
            <div className="p-3 bg-gray-700 rounded space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">24h Volume:</span>
                <span className="text-white">${selectedPool.volume24h.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">24h Trades:</span>
                <span className="text-white">{selectedPool.trades24h}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Price Change:</span>
                <span className={selectedPool.priceChange24h && selectedPool.priceChange24h > 0 ? 'text-green-400' : 'text-red-400'}>
                  {selectedPool.priceChange24h ? `${selectedPool.priceChange24h > 0 ? '+' : ''}${selectedPool.priceChange24h.toFixed(2)}%` : '0%'}
                </span>
              </div>
            </div>
          )}
          
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
              Enter Pool - {investmentAmount} STX
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemeInvesting;