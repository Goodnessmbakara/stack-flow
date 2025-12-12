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

export default function SentimentDashboard() {
    const [sentimentData, setSentimentData] = useState<SocialSentimentData | null>(null);
    const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '4h' | '1d' | '1w'>('4h');
    const [selectedAsset, setSelectedAsset] = useState<'all' | 'STX' | 'BTC'>('all');
    const [isLoading, setIsLoading] = useState(true);

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
        if (score >= 60) return { label: 'Extremely Bullish', color: 'text-[#37f741]' };
        if (score >= 20) return { label: 'Bullish', color: 'text-[#bbf737]' };
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
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading sentiment data...</p>
                </div>
            </div>
        );
    }

    if (!sentimentData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
                <p className="text-slate-400">Failed to load sentiment data</p>
            </div>
        );
    }

    const sentiment = getSentimentLabel(sentimentData.overallSentiment.score);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
            {/* Header */}
            <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-[#37f741] to-[#FDEE61] bg-clip-text text-transparent">
                        Sentiment Dashboard
                    </h1>
                    <p className="text-slate-400 mt-2">
                        Real-time social sentiment analysis and trending topics
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Overall Sentiment */}
                <div className="bg-gradient-to-br from-[#37f741]/10 to-[#FDEE61]/10 border border-white/20 rounded-2xl p-8 mb-8">
                    <div className="text-center">
                        <div className="text-sm text-slate-400 mb-2">Overall Market Sentiment</div>
                        <div className={`text-6xl font-bold mb-2 ${sentiment.color}`}>
                            {sentimentData.overallSentiment.score > 0 ? '+' : ''}{sentimentData.overallSentiment.score}
                        </div>
                        <div className={`text-2xl font-semibold mb-4 ${sentiment.color}`}>
                            {sentiment.label}
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                            <TrendingUp className={`w-4 h-4 ${sentimentData.overallSentiment.trend === 'up' ? 'text-[#37f741]' :
                                sentimentData.overallSentiment.trend === 'down' ? 'text-red-400' :
                                    'text-slate-400'
                                }`} />
                            Confidence: {sentimentData.overallSentiment.confidence}%
                        </div>            </div>
                </div>

                {/* Sentiment Bar */}
                <div className="mt-6">
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-red-500 via-slate-400 to-green-500 transition-all"
                            style={{
                                width: '100%',
                                marginLeft: `${((sentimentData.overallSentiment.score + 100) / 200) * 100 - 50}%`
                            }}
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
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-5 h-5 text-[#37f741]" />
                            <div className="text-xs text-slate-400">Whale Activity</div>
                        </div>
                        <div className="text-2xl font-bold">{sentimentData.marketMetrics.whaleActivityLevel}%</div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <MessageCircle className="w-5 h-5 text-[#FDEE61]" />
                            <div className="text-xs text-slate-400">Social Volume</div>
                        </div>
                        <div className="text-2xl font-bold">{sentimentData.marketMetrics.socialVolume}%</div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-5 h-5 text-blue-400" />
                            <div className="text-xs text-slate-400">Viral Mentions</div>
                        </div>
                        <div className="text-2xl font-bold">{formatNumber(sentimentData.marketMetrics.viralMentions)}</div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-5 h-5 text-[#37f741]" />
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

                {/* Trending Signals */}
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
                                    className="block bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-[#37f741]/50 transition-all group cursor-pointer"
                                >
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
                                                className="px-2 py-1 bg-[#37f741]/10 text-[#37f741] text-xs rounded-full"
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

                {/* Last Updated */}
                <div className="text-center mt-8 text-sm text-slate-500">
                    Last updated: {new Date(sentimentData.overallSentiment.lastUpdate).toLocaleString()}
                </div>
            </div>
        </div>
    );
}
