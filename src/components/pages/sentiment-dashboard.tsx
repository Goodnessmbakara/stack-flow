/**
 * Sentiment Dashboard Page
 * Comprehensive view of social sentiment data, trending topics, and market sentiment
 */

import { useState, useEffect } from "react";
import { Activity, MessageCircle, TrendingUp, Users } from 'lucide-react';
import {
    socialSentimentService,
    type SocialSentimentData,
} from "../../services/socialSentimentService";
import { AITweetFeed } from "../app/ai-tweet-feed";
import { TokenTradeModal } from "../app/token-trade-modal";
import { type TokenMention } from "../../services/openRouterService";

export default function SentimentDashboard() {
    const [sentimentData, setSentimentData] = useState<SocialSentimentData | null>(null);
    const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '4h' | '1d' | '1w'>('4h');
    const [selectedAsset, setSelectedAsset] = useState<'all' | 'STX' | 'BTC'>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'ai-tweets' | 'signals'>('ai-tweets');
    const [selectedToken, setSelectedToken] = useState<TokenMention | null>(null);

    const handleTokenClick = (token: TokenMention) => {
        setSelectedToken(token);
    };

    useEffect(() => {
        loadSentimentData();

        // Subscribe to real-time updates
        const unsubscribe = socialSentimentService.subscribe((data) => {
            setSentimentData(data);
        });

        return () => unsubscribe();
    }, []);

    const loadSentimentData = async () => {
        setIsLoading(true);
        try {
            const data = await socialSentimentService.getSocialSentiment();
            setSentimentData(data);
        } catch (error) {
            console.error('Error loading sentiment data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredSignals = sentimentData?.memeSignals.filter(signal => {
        const matchesTimeframe = selectedTimeframe === '1w' || signal.timeframe === selectedTimeframe;
        const matchesAsset = selectedAsset === 'all' || signal.asset === selectedAsset;
        return matchesTimeframe && matchesAsset;
    }) || [];

    const getSentimentLabel = (score: number) => {
        if (score >= 60) return { label: 'Extremely Bullish', color: 'text-[#40F749]' };
        if (score >= 20) return { label: 'Bullish', color: 'text-[#37F741]' };
        if (score >= -20) return { label: 'Neutral', color: 'text-slate-300' };
        if (score >= -60) return { label: 'Bearish', color: 'text-red-300' };
        return { label: 'Extremely Bearish', color: 'text-red-400' };
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#1D2215] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#37F741' }}></div>
                    <p className="text-slate-400">Loading sentiment data...</p>
                </div>
            </div>
        );
    }

    if (!sentimentData) {
        return (
            <div className="min-h-screen bg-[#1D2215] flex items-center justify-center">
                <p className="text-slate-400">Failed to load sentiment data</p>
            </div>
        );
    }

    const sentiment = getSentimentLabel(sentimentData.overallSentiment.score);

    return (
        <div className="min-h-screen bg-[#1D2215] text-white">
            {/* Header */}
            <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <h1 className="text-3xl font-bold text-[#40F749]">
                        Sentiment Dashboard
                    </h1>
                    <p className="text-slate-400 mt-2">
                        Real-time social sentiment analysis and trending topics
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Overall Sentiment */}
                <div className="card p-8 mb-8 relative">
                    <div className="text-center">
                        <div className="text-sm text-slate-400 mb-2">Overall Market Sentiment</div>
                        <div className={`text-6xl font-bold mb-2 ${sentiment.color} sentiment-score`}>
                            {sentimentData.overallSentiment.score > 0 ? '+' : ''}{sentimentData.overallSentiment.score}
                        </div>
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="neon-badge">{sentiment.label}</div>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                            <TrendingUp className="w-4 h-4" style={{ color: sentimentData.overallSentiment.trend === 'up' ? '#37F741' : sentimentData.overallSentiment.trend === 'down' ? '#ff4d4d' : '#94a3b8' }} />
                            Confidence: {sentimentData.overallSentiment.confidence}%
                        </div>
                    </div>
                </div>

                {/* Sentiment Bar */}
                <div className="mt-6">
                    {/* Track with a non-gradient pointer */}
                    <div className="h-3 bg-[#0b1209] rounded-full relative">
                        {/* thin indicator line */}
                        <div
                            style={{ left: `${((sentimentData.overallSentiment.score + 100) / 200) * 100}%` }}
                            className="absolute top-0 bottom-0 w-[2px] bg-[#37F741]"
                        />
                        {/* pointer */}
                        <div
                            style={{ left: `${((sentimentData.overallSentiment.score + 100) / 200) * 100}%`, transform: 'translateX(-50%)', backgroundColor: sentimentData.overallSentiment.score >= 0 ? '#40F749' : '#ff4d4d' }}
                            className="absolute -top-2 w-3 h-3 rounded-full border border-white/10"
                        />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-500">
                        <span>Extremely Bearish</span>
                        <span>Neutral</span>
                        <span>Extremely Bullish</span>
                    </div>
                </div>

                {/* Market Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="card p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-5 h-5" style={{ color: 'var(--accent-green)' }} />
                            <div className="text-xs text-slate-400">Whale Activity</div>
                        </div>
                        <div className="text-2xl font-bold">{sentimentData.marketMetrics.whaleActivityLevel}%</div>
                    </div>

                    <div className="card p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <MessageCircle className="w-5 h-5" style={{ color: 'var(--accent-green-strong)' }} />
                            <div className="text-xs text-slate-400">Social Volume</div>
                        </div>
                        <div className="text-2xl font-bold">{sentimentData.marketMetrics.socialVolume}%</div>
                    </div>

                    <div className="card p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-5 h-5" style={{ color: '#7cc6ff' }} />
                            <div className="text-xs text-slate-400">Viral Mentions</div>
                        </div>
                        <div className="text-2xl font-bold">{formatNumber(sentimentData.marketMetrics.viralMentions)}</div>
                    </div>

                    <div className="card p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-5 h-5" style={{ color: 'var(--accent-green)' }} />
                            <div className="text-xs text-slate-400">Engagement</div>
                        </div>
                        <div className="text-2xl font-bold">{sentimentData.marketMetrics.communityEngagement}%</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex gap-2">
                        <span className="text-sm text-slate-400 self-center">Timeframe:</span>
                        {(['1h', '4h', '1d', '1w'] as const).map((tf) => (
                            <button
                                key={tf}
                                onClick={() => setSelectedTimeframe(tf)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedTimeframe === tf
                                    ? 'bg-[#37f741] text-black'
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                    }`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <span className="text-sm text-slate-400 self-center">Asset:</span>
                        {(['all', 'STX', 'BTC'] as const).map((asset) => (
                            <button
                                key={asset}
                                onClick={() => setSelectedAsset(asset)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedAsset === asset
                                    ? 'bg-[#37f741] text-black'
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                    }`}
                            >
                                {asset.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('ai-tweets')}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                            activeTab === 'ai-tweets'
                                ? 'bg-[#37f741] text-black'
                                : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                    >
                        Yaps on X
                    </button>
                    <button
                        onClick={() => setActiveTab('signals')}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                            activeTab === 'signals'
                                ? 'bg-[#37f741] text-black'
                                : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                    >
                         Trending Signals
                    </button>
                </div>

                {/* Yaps on X Tab */}
                {activeTab === 'ai-tweets' && (
                    <div className="card p-6">
                        <AITweetFeed 
                            onTokenClick={handleTokenClick} 
                            selectedTimeframe={selectedTimeframe}
                            selectedAsset={selectedAsset}
                        />
                    </div>
                )}

                {/* Trending Signals Tab */}
                {activeTab === 'signals' && (
                <div>
                    <h2 className="text-xl font-bold mb-4">Trending Signals</h2>

                    {filteredSignals.length === 0 ? (
                        <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                            <p className="text-slate-400">No signals found for the selected filters</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {filteredSignals.map((signal) => (
                                <a
                                    key={signal.id}
                                    href={signal.source === 'twitter' ? `https://x.com/i/web/status/${signal.id.replace('tweet-', '')}` : '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block card p-6 transition-all group cursor-pointer relative overflow-hidden"
                                >
                                    {/* left accent */}
                                    <div style={{ left: 0 }} className={`absolute top-0 bottom-0 w-1`} />
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold mb-2 group-hover:text-[#37f741] transition-colors">{signal.title}</h3>
                                            <p className="text-sm text-slate-400 mb-3">{signal.description}</p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-medium ml-4 ${signal.sentiment === 'bullish'
                                            ? 'bg-[#37f741]/20 text-[#37f741]'
                                            : signal.sentiment === 'bearish'
                                                ? 'bg-red-500/20 text-red-300'
                                                : 'bg-slate-500/20 text-slate-300'
                                            }`}>
                                            {signal.sentiment.toUpperCase()}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <div>
                                            <div className="text-xs text-slate-500 mb-1">Viral Score</div>
                                            <div className="font-semibold">{signal.viralScore}/100</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500 mb-1">Engagement</div>
                                            <div className="font-semibold">{signal.communityEngagement}%</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500 mb-1">Mentions</div>
                                            <div className="font-semibold">{formatNumber(signal.mentions)}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500 mb-1">Source</div>
                                            <div className="font-semibold capitalize">{signal.source}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500 mb-1">Confidence</div>
                                            <div className="font-semibold">{signal.confidence}%</div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {signal.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="tag-pill"
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
                )}

                {/* Token Trade Modal */}
                <TokenTradeModal 
                    token={selectedToken} 
                    onClose={() => setSelectedToken(null)} 
                />

                {/* Last Updated */}
                <div className="text-center mt-8 text-sm text-slate-500">
                    Last updated: {new Date(sentimentData.overallSentiment.lastUpdate).toLocaleString()}
                </div>
            </div>
        </div>
    );
}
