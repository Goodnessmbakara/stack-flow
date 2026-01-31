/**
 * Yaps on X Feed Component - Premium Glassmorphism Design
 * Displays REAL tweets from X with AI-powered sentiment analysis
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { RefreshCw, Heart, Repeat2, MessageCircle, ChevronDown, ExternalLink, Zap } from 'lucide-react';
import { 
  getRealSentimentData, 
  type SentimentAnalysisResult 
} from '../../services/twitterSentimentService';

interface AITweetFeedProps {
  onTokenClick?: (token: any) => void;
  selectedTimeframe: '1h' | '4h' | '1d' | '1w';
  selectedAsset: 'all' | 'STX' | 'BTC';
}

export function AITweetFeed({ onTokenClick: _onTokenClick, selectedTimeframe: _selectedTimeframe, selectedAsset }: AITweetFeedProps) {
  const [data, setData] = useState<SentimentAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(7);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadTweets = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    
    try {
      const result = await getRealSentimentData(showRefresh);
      setData(result);
    } catch (error) {
      console.error('Failed to load real tweets:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTweets();

    // Refresh every 5 minutes (matching service cache)
    refreshTimerRef.current = setInterval(() => {
      loadTweets(true);
    }, 5 * 60 * 1000);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, []);

  const handleRefresh = () => {
    loadTweets(true);
  };

  const loadMore = () => {
    setVisibleCount(prev => prev + 7);
  };

  // Filter tweets based on asset
  const filteredTweets = useMemo(() => {
    if (!data?.tweets) return [];
    
    return data.tweets.filter((tweet) => {
      if (selectedAsset === 'all') return true;
      const text = tweet.text.toLowerCase();
      if (selectedAsset === 'STX' && (text.includes('stx') || text.includes('stacks'))) return true;
      if (selectedAsset === 'BTC' && (text.includes('btc') || text.includes('bitcoin') || text.includes('sbtc'))) return true;
      return false;
    });
  }, [data, selectedAsset]);

  const displayedTweets = useMemo(() => {
    return filteredTweets.slice(0, visibleCount);
  }, [filteredTweets, visibleCount]);

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diff < 60) return `${diff}s`;
      if (diff < 3600) return `${Math.floor(diff / 60)}m`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
      return `${Math.floor(diff / 86400)}d`;
    } catch (e) {
      return 'now';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse backdrop-blur-md bg-white/[0.03] rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-white/10"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-1/4"></div>
                <div className="h-3 bg-white/5 rounded w-1/2"></div>
              </div>
            </div>
            <div className="h-20 bg-white/5 rounded-xl"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            Yaps on X 
            <Zap className="w-4 h-4 text-[#37F741] fill-[#37F741]" />
          </h3>
          <p className="text-sm text-slate-400">
            Real-time feed for <span className="text-white font-medium">"{data?.query}"</span>
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-[#37F741] ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Tweet List */}
      <div className="space-y-3">
        {displayedTweets.map((tweet) => (
          <a
            key={tweet.id}
            href={tweet.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group transition-all"
          >
            <div className="backdrop-blur-md bg-white/[0.03] rounded-2xl p-5 border border-white/5 group-hover:bg-white/[0.05] group-hover:border-white/20 transition-all relative overflow-hidden">
              {/* Sentiment Highlight Line */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                tweet.sentiment?.label === 'bullish' ? 'bg-[#37F741]' : 
                tweet.sentiment?.label === 'bearish' ? 'bg-red-500' : 'bg-slate-500'
              } opacity-50 group-hover:opacity-100 transition-opacity`} />

              {/* Author */}
              <div className="flex items-start gap-3 mb-4">
                <div className="relative">
                  <img
                    src={tweet.author.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${tweet.author.username}`}
                    alt={tweet.author.name}
                    className="w-10 h-10 rounded-full bg-slate-800 border border-white/10"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-black flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-white" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white truncate group-hover:text-[#37F741] transition-colors">{tweet.author.name}</span>
                    <span className="text-slate-500 text-sm truncate">@{tweet.author.username}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-500 text-sm">{formatTime(tweet.createdAt)}</span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
              </div>

              {/* Tweet Text */}
              <p className="text-white text-[15px] leading-relaxed mb-4 whitespace-pre-wrap break-words">
                {tweet.text}
              </p>

              {/* Footer Metrics */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                    <MessageCircle className="w-3.5 h-3.5" />
                    {formatNumber(tweet.metrics.replies)}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                    <Repeat2 className="w-3.5 h-3.5" />
                    {formatNumber(tweet.metrics.retweets)}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                    <Heart className="w-3.5 h-3.5" />
                    {formatNumber(tweet.metrics.likes)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {tweet.sentiment && (
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                      tweet.sentiment.label === 'bullish'
                        ? 'bg-[#37F741]/10 text-[#37F741] border border-[#37F741]/20'
                        : tweet.sentiment.label === 'bearish'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {tweet.sentiment.label}
                      <span className="opacity-60">{tweet.sentiment.score > 0 ? '+' : ''}{tweet.sentiment.score}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Empty State */}
      {filteredTweets.length === 0 && (
        <div className="backdrop-blur-xl bg-white/[0.02] rounded-2xl border border-white/10 p-12 text-center">
          <p className="text-slate-400 italic">No yaps match the selected asset filter</p>
          <button onClick={() => loadTweets(true)} className="mt-4 text-[#37F741] text-sm hover:underline">
            Try a fresh search
          </button>
        </div>
      )}

      {/* Load More */}
      {filteredTweets.length > visibleCount && (
        <button
          onClick={loadMore}
          className="w-full py-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all text-slate-400 text-sm font-medium flex items-center justify-center gap-2"
        >
          <ChevronDown className="w-4 h-4" />
          Load More Yaps
        </button>
      )}
    </div>
  );
}

export default AITweetFeed;

