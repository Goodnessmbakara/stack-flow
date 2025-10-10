import React, { useState, useEffect } from 'react';
import { getSocialSentimentDashboard } from '../../services/priceService';
import type { MemeToken, SocialSentimentData } from '../../services/memeDataService';

interface DashboardData {
  sBTCSentiment: SocialSentimentData;
  trendingMemes: MemeToken[];
  memePools: any[];
}

export const SocialSentimentDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getSocialSentimentDashboard();
        setDashboardData(data);
        setError(null);
      } catch (err) {
        setError('Failed to load social sentiment data');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
          <div className="h-8 bg-gray-700 rounded w-1/2"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg p-6 text-center">
        <p className="text-red-400">{error || 'No data available'}</p>
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

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return '🚀';
      case 'bearish': return '📉';
      default: return '⚡';
    }
  };

  return (
    <div className="space-y-6">
      {/* sBTC Sentiment Card */}
      <div className="bg-gradient-to-r from-[#1a1a1a] to-[#2a2a2a] rounded-lg p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">sBTC Social Sentiment</h3>
          <span className="text-2xl">{getSentimentEmoji(dashboardData.sBTCSentiment.sentiment)}</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-gray-400 text-sm">Sentiment</p>
            <p className={`font-bold text-lg capitalize ${getSentimentColor(dashboardData.sBTCSentiment.sentiment)}`}>
              {dashboardData.sBTCSentiment.sentiment}
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-gray-400 text-sm">Score</p>
            <p className="font-bold text-lg text-white">{dashboardData.sBTCSentiment.score}/100</p>
          </div>
          
          <div className="text-center">
            <p className="text-gray-400 text-sm">24h Change</p>
            <p className={`font-bold text-lg ${dashboardData.sBTCSentiment.price_momentum >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {dashboardData.sBTCSentiment.price_momentum > 0 ? '+' : ''}{dashboardData.sBTCSentiment.price_momentum.toFixed(2)}%
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-gray-400 text-sm">Volume</p>
            <p className="font-bold text-lg text-white">
              ${(dashboardData.sBTCSentiment.volume / 1000000000).toFixed(1)}B
            </p>
          </div>
        </div>
      </div>

      {/* Trending Memes */}
      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
        <h3 className="text-xl font-bold text-white mb-4">🔥 Trending Meme Coins</h3>
        
        <div className="space-y-3">
          {dashboardData.trendingMemes.slice(0, 5).map((meme, index) => (
            <div key={meme.id} className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-bold text-[#bbf838]">#{index + 1}</span>
                <div>
                  <p className="font-semibold text-white">{meme.name}</p>
                  <p className="text-sm text-gray-400">{meme.symbol}</p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-semibold text-white">${meme.current_price.toLocaleString()}</p>
                <p className={`text-sm ${meme.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {meme.price_change_percentage_24h > 0 ? '+' : ''}{meme.price_change_percentage_24h.toFixed(2)}%
                </p>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-gray-400">Viral Score</p>
                <p className="font-semibold text-[#bbf838]">{meme.viral_score}/100</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Meme-Based Pools */}
      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
        <h3 className="text-xl font-bold text-white mb-4">🎭 Live Meme Pools</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboardData.memePools.map((pool) => (
            <div key={pool.id} className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700 hover:border-[#bbf838] transition-all">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-white text-sm">{pool.meme}</h4>
                <span className="text-xs bg-[#bbf838] text-black px-2 py-1 rounded">
                  {pool.viralScore}/100
                </span>
              </div>
              
              <p className="text-xs text-gray-400 mb-3 line-clamp-2">{pool.description}</p>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Pool Size:</span>
                  <span className="text-white">${pool.totalPool.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Participants:</span>
                  <span className="text-white">{pool.participants}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Expected Return:</span>
                  <span className="text-green-400">{pool.expectedReturn}</span>
                </div>
              </div>
              
              <button className="w-full mt-4 bg-gradient-to-r from-[#bbf838] to-[#9ed82e] text-black font-semibold py-2 px-4 rounded text-sm hover:opacity-90 transition-opacity">
                Join Pool
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};