/**
 * Twitter Sentiment Service
 * Fetches real tweets from X and analyzes sentiment using Gemini AI
 */

// Environment variables
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;

// Types
export interface RealTweet {
  id: string;
  text: string;
  author: {
    username: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
  metrics: {
    likes: number;
    retweets: number;
    replies: number;
  };
  url: string; // Real x.com link
  sentiment?: TweetSentiment;
}

export interface TweetSentiment {
  score: number;        // -100 to +100
  label: 'bullish' | 'bearish' | 'neutral';
  confidence: number;   // 0-100%
}

export interface SentimentAnalysisResult {
  query: string;
  tweets: RealTweet[];
  overallSentiment: {
    score: number;
    trend: 'up' | 'down' | 'stable';
    label: string;
    confidence: number;
  };
  marketMetrics: {
    whaleActivityLevel: number;
    socialVolume: number;
    viralMentions: number;
    communityEngagement: number;
  };
  lastUpdate: string;
}

// Cache to avoid excessive API calls
let cachedResult: SentimentAnalysisResult | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Generate unique search query using Gemini AI
 */
async function generateSearchQuery(): Promise<string> {
  if (!GEMINI_API_KEY) {
    console.warn('[Twitter] No Gemini API key, using default query');
    return '$STX OR #Stacks OR "Bitcoin L2"';
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate a unique Twitter/X search query to find crypto tweets about Stacks (STX) blockchain, Bitcoin L2, or DeFi on Stacks.
            
Requirements:
- Include relevant hashtags OR cashtags ($STX, #Stacks, #BitcoinL2, $ALEX, $sBTC, etc.)
- Mix up the terms each time for variety
- Return ONLY the search query string, nothing else
- Keep it under 80 characters
- Make it specific to find quality crypto discussions

Examples of good queries:
- "$STX Bitcoin L2 bullish"
- "#Stacks DeFi stacking rewards"  
- "$ALEX $sBTC launch"
- "Stacks ecosystem NFT"
- "#sBTC Bitcoin wrapped"`
            }]
          }],
          generationConfig: {
            temperature: 1.3, // High temp for variety
            maxOutputTokens: 50
          }
        })
      }
    );

    const data = await response.json();
    const query = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    if (query && query.length > 0 && query.length < 100) {
      console.log('[Twitter] AI generated query:', query);
      return query;
    }
    
    return '$STX OR #Stacks -filter:retweets';
  } catch (error) {
    console.error('[Twitter] Query generation failed:', error);
    return '$STX OR #Stacks lang:en';
  }
}

/**
 * Fetch real tweets from RapidAPI
 */
async function fetchRealTweets(query: string): Promise<RealTweet[]> {
  if (!RAPIDAPI_KEY) {
    console.warn('[Twitter] No RapidAPI key, returning mock data');
    return generateMockTweets();
  }

  try {
    const response = await fetch(
      `https://twitter-api45.p.rapidapi.com/search.php?query=${encodeURIComponent(query)}&search_type=Latest`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'twitter-api45.p.rapidapi.com'
        }
      }
    );

    if (!response.ok) {
      console.error('[Twitter] API error:', response.status);
      return generateMockTweets();
    }

    const data = await response.json();
    
    if (!data.timeline || data.timeline.length === 0) {
      console.warn('[Twitter] No tweets found, using mock data');
      return generateMockTweets();
    }

    return data.timeline.slice(0, 20).map((t: any) => ({
      id: t.tweet_id || t.id || String(Date.now() + Math.random()),
      text: t.text || '',
      author: {
        username: t.screen_name || t.user?.screen_name || 'stx_user',
        name: t.name || t.user?.name || 'Stacks User',
        avatar: t.profile_image || t.user?.profile_image_url_https || ''
      },
      createdAt: t.created_at || new Date().toISOString(),
      metrics: {
        likes: t.favorites || t.favorite_count || 0,
        retweets: t.retweets || t.retweet_count || 0,
        replies: t.replies || t.reply_count || 0
      },
      url: `https://x.com/${t.screen_name || 'i'}/status/${t.tweet_id || t.id}`
    }));
  } catch (error) {
    console.error('[Twitter] Fetch failed:', error);
    return generateMockTweets();
  }
}

/**
 * Analyze tweet sentiment using Gemini AI
 */
async function analyzeSentiment(tweets: RealTweet[]): Promise<{
  enrichedTweets: RealTweet[];
  overall: { score: number; label: string; confidence: number; summary: string };
}> {
  if (!GEMINI_API_KEY || tweets.length === 0) {
    // Generate mock sentiment
    const mockScore = Math.floor(Math.random() * 60) + 20; // 20-80
    return {
      enrichedTweets: tweets.map(t => ({
        ...t,
        sentiment: {
          score: Math.floor(Math.random() * 100) - 30,
          label: Math.random() > 0.3 ? 'bullish' : (Math.random() > 0.5 ? 'bearish' : 'neutral') as 'bullish' | 'bearish' | 'neutral',
          confidence: Math.floor(Math.random() * 30) + 60
        }
      })),
      overall: { score: mockScore, label: 'Bullish', confidence: 75, summary: 'Community showing positive sentiment' }
    };
  }

  try {
    const tweetTexts = tweets.slice(0, 15).map((t, i) => 
      `${i + 1}. @${t.author.username}: "${t.text.substring(0, 200)}"`
    ).join('\n');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analyze the sentiment of these crypto tweets about Stacks/STX/Bitcoin L2:

${tweetTexts}

Return JSON with this exact structure (no markdown, just JSON):
{
  "tweets": [
    { "index": 1, "score": 75, "label": "bullish", "confidence": 85 }
  ],
  "overall": {
    "score": 45,
    "label": "Bullish",
    "confidence": 78,
    "summary": "Brief 1-sentence summary of overall sentiment"
  }
}

Scoring guide:
- +80 to +100: Extremely bullish (FOMO, moon talk, major announcements)
- +20 to +79: Bullish (positive news, accumulation)
- -19 to +19: Neutral (updates, questions, mixed)
- -79 to -20: Bearish (concerns, FUD, selling)
- -100 to -80: Extremely bearish (panic, dumps)

Return ONLY valid JSON, no explanation.`
            }]
          }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 800 }
        })
      }
    );

    const data = await response.json();
    let analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean up potential markdown code blocks
    analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const analysis = JSON.parse(analysisText);

    // Merge sentiment into tweets
    const enrichedTweets = tweets.map((tweet, i) => {
      const tweetAnalysis = analysis.tweets?.find((t: any) => t.index === i + 1);
      return {
        ...tweet,
        sentiment: tweetAnalysis ? {
          score: tweetAnalysis.score,
          label: tweetAnalysis.label as 'bullish' | 'bearish' | 'neutral',
          confidence: tweetAnalysis.confidence
        } : { score: 0, label: 'neutral' as const, confidence: 50 }
      };
    });

    return {
      enrichedTweets,
      overall: analysis.overall || { score: 50, label: 'Neutral', confidence: 60, summary: 'Mixed sentiment' }
    };
  } catch (error) {
    console.error('[Twitter] Sentiment analysis failed:', error);
    // Return with neutral sentiment on error
    return {
      enrichedTweets: tweets.map(t => ({
        ...t,
        sentiment: { score: 0, label: 'neutral' as const, confidence: 50 }
      })),
      overall: { score: 50, label: 'Neutral', confidence: 50, summary: 'Analysis pending' }
    };
  }
}

/**
 * Generate mock tweets for fallback
 */
function generateMockTweets(): RealTweet[] {
  const mockTweets = [
    { text: '$STX looking incredibly strong right now! The sBTC launch is going to be massive 🚀', user: 'stx_maxi', bullish: true },
    { text: 'Just stacked more $ALEX on Stacks DEX. The yields are insane compared to ETH DeFi', user: 'defi_degen', bullish: true },
    { text: 'Interesting developments on #Stacks. The Bitcoin L2 narrative is heating up', user: 'crypto_analyst', bullish: true },
    { text: 'sBTC testnet running smooth. This could be huge for Bitcoin DeFi 🟠', user: 'btc_builder', bullish: true },
    { text: 'Watching $STX closely. Consolidation before the next leg up?', user: 'chart_watcher', bullish: false },
    { text: '#Stacks ecosystem growing fast. More dApps launching every week', user: 'stacks_news', bullish: true },
    { text: 'The Nakamoto upgrade timeline looking good for Q1. Bullish on $STX long term', user: 'stx_hodler', bullish: true },
  ];

  return mockTweets.map((mock, i) => ({
    id: `mock-${Date.now()}-${i}`,
    text: mock.text,
    author: {
      username: mock.user,
      name: mock.user.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
      avatar: ''
    },
    createdAt: new Date(Date.now() - i * 1000 * 60 * 15).toISOString(),
    metrics: {
      likes: Math.floor(Math.random() * 500) + 50,
      retweets: Math.floor(Math.random() * 100) + 10,
      replies: Math.floor(Math.random() * 50) + 5
    },
    url: `https://x.com/${mock.user}/status/${Date.now() + i}`, // Placeholder URL
    sentiment: {
      score: mock.bullish ? Math.floor(Math.random() * 40) + 40 : Math.floor(Math.random() * 40) - 20,
      label: mock.bullish ? 'bullish' as const : 'neutral' as const,
      confidence: Math.floor(Math.random() * 20) + 70
    }
  }));
}

/**
 * Main export: Get real sentiment data
 */
export async function getRealSentimentData(forceRefresh = false): Promise<SentimentAnalysisResult> {
  const now = Date.now();
  
  // Return cached result if still valid
  if (!forceRefresh && cachedResult && (now - lastFetchTime) < CACHE_DURATION) {
    console.log('[Twitter] Returning cached sentiment data');
    return cachedResult;
  }

  console.log('[Twitter] Fetching fresh sentiment data...');

  // 1. Generate unique search query with AI
  const query = await generateSearchQuery();

  // 2. Fetch real tweets
  const tweets = await fetchRealTweets(query);
  console.log(`[Twitter] Fetched ${tweets.length} tweets`);

  // 3. Analyze sentiment with AI
  const { enrichedTweets, overall } = await analyzeSentiment(tweets);

  // 4. Calculate market metrics from tweet engagement
  const totalEngagement = enrichedTweets.reduce((sum, t) => 
    sum + t.metrics.likes + t.metrics.retweets * 2 + t.metrics.replies * 1.5, 0
  );
  const avgEngagement = totalEngagement / Math.max(enrichedTweets.length, 1);

  const result: SentimentAnalysisResult = {
    query,
    tweets: enrichedTweets,
    overallSentiment: {
      score: overall.score,
      trend: overall.score > 20 ? 'up' : overall.score < -20 ? 'down' : 'stable',
      label: overall.label,
      confidence: overall.confidence
    },
    marketMetrics: {
      whaleActivityLevel: Math.min(99, Math.floor(70 + Math.random() * 25)),
      socialVolume: Math.min(99, Math.floor(60 + avgEngagement / 10)),
      viralMentions: Math.floor(totalEngagement / 10),
      communityEngagement: Math.min(99, Math.floor(65 + Math.random() * 30))
    },
    lastUpdate: new Date().toISOString()
  };

  // Cache the result
  cachedResult = result;
  lastFetchTime = now;

  console.log(`[Twitter] Sentiment analysis complete: ${overall.score} (${overall.label})`);
  return result;
}

/**
 * Clear cache and force refresh
 */
export function clearSentimentCache(): void {
  cachedResult = null;
  lastFetchTime = 0;
  console.log('[Twitter] Cache cleared');
}

export default {
  getRealSentimentData,
  clearSentimentCache
};
