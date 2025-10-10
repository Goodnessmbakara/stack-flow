import React, { useState, useEffect } from 'react';
import { getSocialSentimentDashboard } from '../../services/priceService';
import type { MemeToken, SocialSentimentData } from '../../services/memeDataService';
import { useAppContext } from '../../context/AppContext';

interface SocialSentimentDisplayProps {
  selectedStrategy: string;
}

export const SocialSentimentDisplay: React.FC<SocialSentimentDisplayProps> = ({ selectedStrategy }) => {
  const [dashboardData, setDashboardData] = useState<{
    sBTCSentiment: SocialSentimentData;
    trendingMemes: MemeToken[];
    memePools: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const { state } = useAppContext();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getSocialSentimentDashboard();
        setDashboardData(data);
      } catch (error) {
        console.error('Failed to load social sentiment data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (state.asset === "BTC") {
      fetchData();
      // Refresh every 30 seconds for live data
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [state.asset]);

  if (state.asset !== "BTC" || loading) {
    return null;
  }

  if (!dashboardData) {
    return (
      <div className="bg-[#1D2215] rounded-lg p-4 text-center">
        <p className="text-gray-400">Unable to load social sentiment data</p>
      </div>
    );
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-400';
      case 'bearish': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  if (selectedStrategy === "Copy Trading") {
    return (
      <div className="bg-[#1D2215] rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">🐋 Copy Trading Hub</h3>
          <span className="text-xs bg-green-500 text-black px-2 py-1 rounded">LIVE</span>
        </div>
        
        {/* sBTC Sentiment Overview */}
        <div className="bg-[#2a2a2a] rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">sBTC Market Sentiment</span>
            <span className={`text-sm font-bold capitalize ${getSentimentColor(dashboardData.sBTCSentiment.sentiment)}`}>
              {dashboardData.sBTCSentiment.sentiment}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <p className="text-gray-400">Score</p>
              <p className="text-white font-bold">{dashboardData.sBTCSentiment.score}/100</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400">24h Change</p>
              <p className={`font-bold ${dashboardData.sBTCSentiment.price_momentum >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {dashboardData.sBTCSentiment.price_momentum > 0 ? '+' : ''}{dashboardData.sBTCSentiment.price_momentum.toFixed(2)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400">Volume</p>
              <p className="text-white font-bold">${(dashboardData.sBTCSentiment.volume / 1000000000).toFixed(1)}B</p>
            </div>
          </div>
        </div>

        {/* Copy Trading Actions */}
        <div className="space-y-2">
          <button className="w-full bg-gradient-to-r from-[#37f741] to-[#FDEE61] text-black font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity">
            🔍 Browse Top Traders
          </button>
          <button className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
            📊 View Performance Metrics
          </button>
        </div>
      </div>
    );
  }

  if (selectedStrategy === "Meme-Driven Investing") {
    return (
      <div className="bg-[#1D2215] rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">🎭 Meme Trading Pools</h3>
          <span className="text-xs bg-[#37f741] text-black px-2 py-1 rounded font-bold">
            {dashboardData.memePools.length} ACTIVE
          </span>
        </div>

        {/* Trending Memes Quick View */}
        <div className="bg-[#2a2a2a] rounded-lg p-3">
          <h4 className="text-sm font-semibold text-white mb-2">🔥 Top Trending</h4>
          <div className="space-y-2">
            {dashboardData.trendingMemes.slice(0, 3).map((meme, index) => (
              <div key={meme.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-[#37f741] font-bold">#{index + 1}</span>
                  <span className="text-white">{meme.symbol}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`${meme.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {meme.price_change_percentage_24h > 0 ? '+' : ''}{meme.price_change_percentage_24h.toFixed(1)}%
                  </span>
                  <span className="text-gray-400">🔥{meme.viral_score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Pools */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {dashboardData.memePools.slice(0, 3).map((pool) => (
            <div key={pool.id} className="bg-[#2a2a2a] rounded-lg p-3 hover:bg-[#333] transition-colors cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-sm font-semibold text-white truncate flex-1">{pool.meme}</h5>
                <span className="text-xs bg-[#37f741] text-black px-2 py-1 rounded ml-2">
                  {pool.viralScore}/100
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-2 line-clamp-2">{pool.description}</p>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Pool: ${pool.totalPool.toLocaleString()}</span>
                <span className="text-green-400">{pool.expectedReturn}</span>
              </div>
            </div>
          ))}
        </div>

        <button className="w-full bg-gradient-to-r from-[#37f741] to-[#FDEE61] text-black font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity">
          🎯 Join Active Pool
        </button>
      </div>
    );
  }

  return null;
};