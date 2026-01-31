/**
 * Social Sentiment Dashboard
 * Combines whale tracking, meme signals, and copy trading in a unified interface
 */

import { useState, useEffect } from "react";
import { Icons } from "../ui/icons";
import { WhaleTracker } from "./whale-tracker";
import { MemeSignals } from "./meme-signals";
import { CopyTradingPools } from "./copy-trading-pools";
import { 
  socialSentimentService, 
  type SocialSentimentData,
  type MemeSignal,
  type CopyTradingPool
} from "../../services/socialSentimentService";
import { type WhaleProfile } from "../../services/ecosystemWhaleService";

export function SocialSentimentDashboard() {
  const [sentimentData, setSentimentData] = useState<SocialSentimentData | null>(null);
  const [activeTab, setActiveTab] = useState<'whales' | 'memes' | 'pools'>('whales');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await socialSentimentService.getSocialSentiment();
        setSentimentData(data);
      } catch (error) {
        console.error('Failed to fetch social sentiment data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to updates
    const unsubscribe = socialSentimentService.subscribe((data) => {
      setSentimentData(data);
    });

    return unsubscribe;
  }, []);

  const getSentimentColor = (score: number) => {
    if (score >= 50) return 'text-green-400';
    if (score >= 0) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSentimentIcon = (score: number) => {
    if (score >= 50) return <Icons.trending className="w-5 h-5" />;
    if (score >= 0) return <Icons.waves className="w-5 h-5" />;
    return <Icons.arrowDownRight className="w-5 h-5" />;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handleWhaleSelect = (whale: WhaleProfile) => {
    console.log('Selected whale:', whale.address);
    // Could trigger a modal or detailed view
  };

  const handleSignalSelect = (signal: MemeSignal) => {
    console.log('Selected meme signal:', signal.title);
    // Could trigger strategy suggestions based on signal
  };

  const handlePoolJoin = (pool: CopyTradingPool) => {
    console.log('Joined pool:', pool.name);
    // Could trigger wallet connection and transaction
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-[#1D2215] rounded-lg p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded-sm w-1/3 mb-4"></div>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-700 rounded-sm"></div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-gray-700 rounded-lg animate-pulse"></div>
          <div className="h-96 bg-gray-700 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!sentimentData) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Icons.questionMark className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Failed to load social sentiment data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Sentiment Header */}
      <div className="bg-[#1D2215] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Social Sentiment Overview</h2>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Last updated:</span>
            <span>{new Date(sentimentData.overallSentiment.lastUpdate).toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Overall Sentiment Score */}
          <div className="bg-[#121412] rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              {getSentimentIcon(sentimentData.overallSentiment.score)}
              <span className="text-sm text-gray-400">Market Sentiment</span>
            </div>
            <div className={`text-2xl font-bold ${getSentimentColor(sentimentData.overallSentiment.score)}`}>
              {sentimentData.overallSentiment.score > 0 ? '+' : ''}{sentimentData.overallSentiment.score}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {sentimentData.overallSentiment.confidence}% confidence
            </div>
          </div>

          {/* Whale Activity */}
          <div className="bg-[#121412] rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Icons.users className="w-5 h-5 text-[#bbf838]" />
              <span className="text-sm text-gray-400">Whale Activity</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {sentimentData.marketMetrics.whaleActivityLevel}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {sentimentData.whaleActivity.length} active whales
            </div>
          </div>

          {/* Social Volume */}
          <div className="bg-[#121412] rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Icons.fire className="w-5 h-5 text-orange-400" />
              <span className="text-sm text-gray-400">Social Volume</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {formatNumber(sentimentData.marketMetrics.viralMentions)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              viral mentions
            </div>
          </div>

          {/* Community Engagement */}
          <div className="bg-[#121412] rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Icons.heart className="w-5 h-5 text-pink-400" />
              <span className="text-sm text-gray-400">Engagement</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {sentimentData.marketMetrics.communityEngagement}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              community activity
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-[#1D2215] p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('whales')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'whales'
              ? 'bg-linear-to-r from-[#37f741] to-[#FDEE61] text-black'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Icons.users className="w-4 h-4" />
            Whale Tracker
          </div>
        </button>
        <button
          onClick={() => setActiveTab('memes')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'memes'
              ? 'bg-linear-to-r from-[#37f741] to-[#FDEE61] text-black'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Icons.fire className="w-4 h-4" />
            Meme Signals
          </div>
        </button>
        <button
          onClick={() => setActiveTab('pools')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'pools'
              ? 'bg-linear-to-r from-[#37f741] to-[#FDEE61] text-black'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Icons.trending className="w-4 h-4" />
            Copy Trading
          </div>
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'whales' && (
          <WhaleTracker
            onWhaleSelect={handleWhaleSelect}
            maxWhales={8}
          />
        )}
        
        {activeTab === 'memes' && (
          <MemeSignals
            onSignalSelect={handleSignalSelect}
            maxSignals={6}
          />
        )}
        
        {activeTab === 'pools' && (
          <CopyTradingPools
            onPoolJoin={handlePoolJoin}
            maxPools={4}
          />
        )}
      </div>
    </div>
  );
}
