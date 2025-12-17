import axios from 'axios';

export interface Tweet {
    id: string;
    text: string;
    created_at: string;
    author_id: string;
    public_metrics: {
        retweet_count: number;
        reply_count: number;
        like_count: number;
        quote_count: number;
        impression_count: number;
    };
}

export interface TwitterSentimentResult {
    score: number; // -100 to 100
    confidence: number; // 0 to 100
    sampleSize: number;
    topTweets: Tweet[];
    trendingTopics: string[];
}

class TwitterService {
    private readonly baseUrl = '/api/twitter';
    private readonly bearerToken = import.meta.env.VITE_TWITTER_BEARER_TOKEN;

    // Simple sentiment dictionary (AFINN-165 based subset + crypto slang)
    private readonly sentimentDict: Record<string, number> = {
        // Positive
        'bullish': 4, 'moon': 4, 'lfg': 3, 'gem': 3, 'pump': 3, 'long': 2,
        'buy': 2, 'green': 2, 'profit': 3, 'gain': 3, 'up': 1, 'high': 1,
        'good': 2, 'great': 3, 'amazing': 4, 'love': 3, 'best': 3,
        'breakout': 3, 'ath': 4, 'wagmi': 3, 'accumulation': 2,

        // Negative
        'bearish': -4, 'dump': -4, 'crash': -4, 'rekt': -4, 'short': -2,
        'sell': -2, 'red': -2, 'loss': -3, 'down': -1, 'low': -1,
        'bad': -2, 'terrible': -3, 'hate': -3, 'worst': -3,
        'rug': -5, 'scam': -5, 'fear': -3, 'panic': -3, 'ngmi': -3
    };

    constructor() {
        console.log('🔑 [TwitterService] Checking Bearer Token...');
        console.log('🔑 [TwitterService] Token exists:', !!this.bearerToken);
        console.log('🔑 [TwitterService] Token length:', this.bearerToken?.length || 0);
        console.log('🔑 [TwitterService] Token preview:', this.bearerToken?.substring(0, 20) + '...');

        if (!this.bearerToken) {
            console.warn('❌ [TwitterService] Twitter Bearer Token not found in environment variables');
            console.warn('💡 [TwitterService] Make sure VITE_TWITTER_BEARER_TOKEN is set in your .env file');
        } else {
            console.log('✅ [TwitterService] Bearer Token loaded successfully');
        }
    }

    /**
     * Search for recent tweets about a query
     */
    async searchTweets(query: string, maxResults: number = 20): Promise<Tweet[]> {
        // Prefer native Bearer Token if provided
        if (this.bearerToken) {
            try {
                const url = `${this.baseUrl}/tweets/search/recent`;
                const response = await axios.get(url, {
                    params: {
                        query: `${query} -is:retweet lang:en`,
                        max_results: maxResults,
                        'tweet.fields': 'created_at,public_metrics,author_id',
                        sort_order: 'recency'
                    },
                    headers: {
                        'Authorization': `Bearer ${this.bearerToken}`
                    }
                });
                return response.data.data || [];
            } catch (error) {
                    const status = (error as any)?.response?.status;
                    console.error('Error fetching tweets with bearer token:', error);
                    if (status === 403) {
                        console.warn('⚠️ [TwitterService] Received 403 from Twitter API. Check VITE_TWITTER_BEARER_TOKEN or RapidAPI key.');
                    }
            }
        }

            // Try server-side RapidAPI proxy first (avoids exposing the key to the client and CORS)
            try {
                console.log('🔁 [TwitterService] Attempting server-side RapidAPI proxy...');
                const resp = await axios.get(`/api/rapid/twitter/tweets/search/recent`, {
                    params: {
                        query: `${query} -is:retweet lang:en`,
                        max_results: maxResults,
                        'tweet.fields': 'created_at,public_metrics,author_id'
                    }
                });

                const data = resp.data?.data || [];
                if (data && data.length) {
                    console.log('✅ [TwitterService] Received tweets from server-side RapidAPI proxy');
                    return data.map((t: any) => ({
                        id: t.id || t.tweet_id || String(Math.random()),
                        text: t.text || t.full_text || '',
                        created_at: t.created_at || t.createdAt || new Date().toISOString(),
                        author_id: t.author_id || t.user?.id || '',
                        public_metrics: {
                            retweet_count: (t.public_metrics?.retweet_count) || (t.retweet_count) || 0,
                            reply_count: (t.public_metrics?.reply_count) || (t.reply_count) || 0,
                            like_count: (t.public_metrics?.like_count) || (t.like_count) || 0,
                            quote_count: (t.public_metrics?.quote_count) || 0,
                            impression_count: (t.public_metrics?.impression_count) || 0
                        }
                    }));
                }
            } catch (err) {
                console.warn('⚠️ [TwitterService] Server-side RapidAPI proxy failed or unavailable:', err);
            }

            // Fallback to client-side RapidAPI provider if server proxy is not available
            try {
                const { searchTweetsRapid } = await import('./rapidapiTwitterProvider');
                const rapidTweets = await searchTweetsRapid(query, maxResults);
                if (rapidTweets && rapidTweets.length) return rapidTweets;
            } catch (err) {
                console.warn('⚠️ [TwitterService] RapidAPI fallback failed:', err);
            }

            // Fallback to generative (Gemini) provider to synthesize tweets when live sources fail
            try {
                const { generateTweetsGemini } = await import('./generativeTwitterProvider');
                const genTweets = await generateTweetsGemini(query, Math.min(20, maxResults));
                if (genTweets && genTweets.length) {
                    console.log('🔮 [TwitterService] Using generative Gemini fallback with', genTweets.length, 'tweets');
                    return genTweets;
                }
            } catch (err) {
                console.warn('⚠️ [TwitterService] Generative fallback failed:', err);
            }

        console.warn('⚠️ [TwitterService] No tweet provider available or no results');
        return [];
    }

    /**
     * Analyze sentiment of a text
     */
    analyzeText(text: string): number {
        const words = text.toLowerCase().split(/\s+/);
        let score = 0;
        let matchCount = 0;

        words.forEach(word => {
            // Remove punctuation
            const cleanWord = word.replace(/[^\w]/g, '');
            if (this.sentimentDict[cleanWord]) {
                score += this.sentimentDict[cleanWord];
                matchCount++;
            }
        });

        // Normalize score between -5 and 5 roughly, then scale to -100 to 100
        if (matchCount === 0) return 0;

        const normalizedScore = (score / matchCount) * 20; // Scale factor
        return Math.max(-100, Math.min(100, normalizedScore));
    }

    /**
     * Get overall sentiment for a topic
     */
    async getTopicSentiment(topic: string): Promise<TwitterSentimentResult> {
        const tweets = await this.searchTweets(topic);

        if (tweets.length === 0) {
            return {
                score: 0,
                confidence: 0,
                sampleSize: 0,
                topTweets: [],
                trendingTopics: []
            };
        }

        let totalScore = 0;
        let totalWeight = 0;
        const scoredTweets = [];

        for (const tweet of tweets) {
            const sentiment = this.analyzeText(tweet.text);

            // Weight by engagement (likes + retweets)
            const engagement = tweet.public_metrics.like_count + (tweet.public_metrics.retweet_count * 2);
            const weight = Math.max(1, Math.log(engagement + 1));

            totalScore += sentiment * weight;
            totalWeight += weight;

            scoredTweets.push({ ...tweet, sentiment, engagement });
        }

        const averageScore = totalWeight > 0 ? totalScore / totalWeight : 0;

        // Sort by engagement to find top tweets
        const topTweets = scoredTweets
            .sort((a, b) => b.engagement - a.engagement)
            .slice(0, 5);

        // Extract hashtags for trending topics
        const hashtags = new Map<string, number>();
        tweets.forEach(tweet => {
            const matches = tweet.text.match(/#[a-zA-Z0-9_]+/g);
            if (matches) {
                matches.forEach(tag => {
                    const t = tag.toLowerCase();
                    hashtags.set(t, (hashtags.get(t) || 0) + 1);
                });
            }
        });

        const trendingTopics = Array.from(hashtags.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([tag]) => tag);

        return {
            score: Math.round(averageScore),
            confidence: Math.min(100, Math.round(Math.sqrt(tweets.length) * 10)), // Simple confidence based on sample size
            sampleSize: tweets.length,
            topTweets,
            trendingTopics
        };
    }
}

export const twitterService = new TwitterService();
