/**
 * OpenRouter Service
 * Generates mock tweets (yaps) with STX ecosystem token mentions
 */

export interface AITweet {
  id: string;
  text: string;
  author: {
    username: string;
    displayName: string;
    avatar: string;
  };
  createdAt: string;
  metrics: {
    likes: number;
    retweets: number;
    replies: number;
  };
  tokens: TokenMention[];
  sentiment: 'bullish' | 'bearish' | 'neutral';
  timeframe: '1h' | '4h' | '1d' | '1w';
  asset: 'STX' | 'BTC' | 'general';
}

export interface TokenMention {
  type: 'ticker' | 'contract';
  value: string;
  symbol?: string;
}

// Paginated cache - stores tweets by page with timestamps
interface PageCache {
  tweets: AITweet[];
  generatedAt: number;
}
const paginatedCache = new Map<number, PageCache>();
const TWEETS_PER_PAGE = 7;
const PAGE_REFRESH_INTERVAL = 45 * 60 * 1000; // 45 minutes

// STX ecosystem tokens
const SAMPLE_TOKENS = [
  { ticker: '$STX', ca: 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBX9.stx-token' },
  { ticker: '$ALEX', ca: 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBX9.age000-governance-token' },
  { ticker: '$VELAR', ca: 'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.velar-token' },
  { ticker: '$WELSH', ca: 'SP3NE50GEXFG9SZGTT51P40X2CKYSZ5CC4ZTZ7A2G.welshcorgicoin-token' },
  { ticker: '$ROO', ca: 'SP2C1WREHGM75C7TGFAEJPFKTFTEGZKF6DFT6E2GE.kangaroo-token' },
  { ticker: '$LEO', ca: 'SP1AY6K3PQV5MRT6R4S671NWW2FRVPKM0BR162CT6.leo-token' },
  { ticker: '$ODIN', ca: 'SP2X2Z28NXZVJFCJPBR9Q3NBVYBK3GPX8PXA3R83C.odin-tkn' },
  { ticker: '$NOT', ca: 'SP32AEEF6WW5Y0NMJ1S8SBSZDAY8R5J32NBZFPKKZ.nope-token' },
  { ticker: '$sBTC', ca: 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBX9.sbtc-token' },
  { ticker: '$GWEI', ca: 'SP1Z92MPDQEWZXW36VX71Q25HKF5K2EPCJ304F275.gwei-token' },
  { ticker: '$MIA', ca: 'SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-token' },
  { ticker: '$NYC', ca: 'SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11.newyorkcitycoin-token' },
];

const USERNAMES = [
  { username: 'stx_maxi', displayName: 'STX Maximalist' },
  { username: 'stacks_degen', displayName: 'Stacks Degen 🟠' },
  { username: 'btc_l2_chad', displayName: 'Bitcoin L2 Chad' },
  { username: 'welsh_holder', displayName: 'Welsh Corgi Holder 🐕' },
  { username: 'alex_trader', displayName: 'ALEX Lab Trader' },
  { username: 'velar_ape', displayName: 'Velar Ape 🦍' },
  { username: 'stacks_whale', displayName: 'Stacks Whale 🐋' },
  { username: 'clarity_dev', displayName: 'Clarity Developer' },
  { username: 'sbtc_believer', displayName: 'sBTC Believer ₿' },
  { username: 'hiro_builder', displayName: 'Hiro Builder 🔨' },
  { username: 'stx_signals', displayName: 'STX Signals 📊' },
  { username: 'defi_stacker', displayName: 'DeFi Stacker' },
];

function extractJsonArray(text: string): any[] | null {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

/**
 * Determine asset type based on tweet content
 */
function determineAsset(text: string, tokens: TokenMention[]): 'STX' | 'BTC' | 'general' {
  const lowerText = text.toLowerCase();
  const tokenSymbols = tokens.map((t) => t.symbol?.toUpperCase() || t.value.toUpperCase());

  // Check for BTC-related content
  if (
    tokenSymbols.includes('BTC') ||
    tokenSymbols.includes('SBTC') ||
    lowerText.includes('bitcoin') ||
    lowerText.includes('sbtc') ||
    lowerText.includes('btc')
  ) {
    return 'BTC';
  }

  // Check for STX-related content
  if (
    tokenSymbols.includes('STX') ||
    tokenSymbols.includes('ALEX') ||
    tokenSymbols.includes('VELAR') ||
    tokenSymbols.includes('WELSH') ||
    tokenSymbols.includes('ROO') ||
    tokenSymbols.includes('LEO') ||
    tokenSymbols.includes('ODIN') ||
    tokenSymbols.includes('MIA') ||
    tokenSymbols.includes('NYC') ||
    lowerText.includes('stacks') ||
    lowerText.includes('stx') ||
    lowerText.includes('clarity')
  ) {
    return 'STX';
  }

  return 'general';
}

/**
 * Extract token mentions from tweet text
 */
export function extractTokens(text: string): TokenMention[] {
  const tokens: TokenMention[] = [];

  // Match tickers like $STX, $ALEX, $WELSH
  const tickerRegex = /\$[A-Za-z]{2,10}/g;
  const tickers = text.match(tickerRegex) || [];
  tickers.forEach((ticker) => {
    if (!tokens.some((t) => t.value === ticker.toUpperCase())) {
      tokens.push({ type: 'ticker', value: ticker.toUpperCase(), symbol: ticker.slice(1).toUpperCase() });
    }
  });

  // Match Stacks contract addresses (SP...)
  const stacksRegex = /\bSP[A-Z0-9]{38,50}\.[a-z0-9-]+/g;
  const stacksAddresses = text.match(stacksRegex) || [];
  stacksAddresses.forEach((addr) => {
    if (!tokens.some((t) => t.value === addr)) {
      tokens.push({ type: 'contract', value: addr });
    }
  });

  return tokens;
}

/**
 * Get tweets for a specific page with auto-refresh every 45 minutes
 */
export async function getTweetsForPage(page: number): Promise<{ tweets: AITweet[]; hasMore: boolean }> {
  const cached = paginatedCache.get(page);
  const now = Date.now();

  // Return cached if still valid
  if (cached && now - cached.generatedAt < PAGE_REFRESH_INTERVAL) {
    return { tweets: cached.tweets, hasMore: true };
  }

  // Generate new tweets for this page
  const tweets = await generateTweetsOpenRouter(TWEETS_PER_PAGE, page);
  paginatedCache.set(page, { tweets, generatedAt: now });

  return { tweets, hasMore: true };
}

/**
 * Get all loaded tweets up to a page
 */
export function getAllLoadedTweets(upToPage: number): AITweet[] {
  const allTweets: AITweet[] = [];
  for (let i = 1; i <= upToPage; i++) {
    const cached = paginatedCache.get(i);
    if (cached) {
      allTweets.push(...cached.tweets);
    }
  }
  return allTweets;
}

/**
 * Clear cache for fresh generation
 */
export function clearTweetCache(): void {
  paginatedCache.clear();
}

/**
 * Generate tweets using OpenRouter API
 */
export async function generateTweetsOpenRouter(count: number = 7, page: number = 1): Promise<AITweet[]> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    console.warn('[OpenRouter] No API key found, using mock data');
    return generateMockTweets(count, page);
  }

  try {
    const tokenList = SAMPLE_TOKENS.map((t) => `${t.ticker} (CA: ${t.ca})`).join(', ');

    const prompt = `Generate ${count} realistic crypto Twitter/X posts about Stacks (STX) ecosystem tokens.
Each tweet should:
- Be 50-280 characters
- Include at least one STX ecosystem token ticker ($STX, $ALEX, $VELAR, $WELSH, $ROO, $LEO, $ODIN, $sBTC, $MIA, $NYC)
- Some tweets should include Stacks contract addresses (format: SP...address.token-name)
- Mix of bullish, bearish, and neutral sentiments
- Use crypto Twitter slang (gm, wagmi, ngmi, lfg, degen, ape, moon, stack, etc.)
- Reference Stacks/Bitcoin L2 ecosystem themes
- Some should have emojis

Available tokens: ${tokenList}

Return ONLY a valid JSON array:
[{"text": "tweet content", "sentiment": "bullish|bearish|neutral"}]`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'StackFlow Sentiment',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const parsed = extractJsonArray(content);

    if (!parsed || !Array.isArray(parsed)) {
      console.warn('[OpenRouter] Failed to parse response, using mock data');
      return generateMockTweets(count, page);
    }

    const timeframes: Array<'1h' | '4h' | '1d' | '1w'> = ['1h', '4h', '1d', '1w'];
    const tweets: AITweet[] = parsed.slice(0, count).map((item, idx) => {
      const userIdx = (page * count + idx) % USERNAMES.length;
      const user = USERNAMES[userIdx];
      const text = String(item.text || '');
      const tokens = extractTokens(text);

      // Determine asset based on tokens mentioned
      const asset = determineAsset(text, tokens);

      return {
        id: `yap-${page}-${Date.now()}-${idx}`,
        text,
        author: {
          ...user,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
        },
        createdAt: new Date(Date.now() - Math.random() * 2700000).toISOString(), // Within 45 mins
        metrics: {
          likes: Math.floor(Math.random() * 5000),
          retweets: Math.floor(Math.random() * 1000),
          replies: Math.floor(Math.random() * 200),
        },
        tokens,
        sentiment: item.sentiment || 'neutral',
        timeframe: timeframes[Math.floor(Math.random() * timeframes.length)],
        asset,
      };
    });

    return tweets;
  } catch (error) {
    console.error('[OpenRouter] Request failed:', error);
    return generateMockTweets(count, page);
  }
}

/**
 * Generate mock tweets as fallback - STX ecosystem focused
 */
function generateMockTweets(count: number, page: number = 1): AITweet[] {
  const mockTexts = [
    { text: 'gm stackers! $STX looking primed for a breakout. Bitcoin L2 szn is here 🟠', sentiment: 'bullish' },
    { text: '$ALEX governance proposal passing, bullish for the whole Stacks DeFi ecosystem', sentiment: 'bullish' },
    { text: 'Just aped into $WELSH, the Stacks memecoin meta is real 🐕 CA: SP3NE50GEXFG9SZGTT51P40X2CKYSZ5CC4ZTZ7A2G.welshcorgicoin-token', sentiment: 'bullish' },
    { text: '$VELAR DEX volume pumping hard. Stacks DeFi summer incoming? 🔥', sentiment: 'bullish' },
    { text: 'sBTC launch getting closer, $STX holders gonna make it. Stack sats, stack STX', sentiment: 'bullish' },
    { text: '$ROO kangaroo token hopping to new ATH. Stacks memes dont miss 🦘', sentiment: 'bullish' },
    { text: 'Clarity smart contracts are underrated. Building on Stacks hits different', sentiment: 'neutral' },
    { text: '$LEO looking like a sleeping giant. Low cap STX gem alert 🦁', sentiment: 'bullish' },
    { text: 'Not gonna lie, $ODIN chart looking rough rn. Might wait for better entry 📉', sentiment: 'bearish' },
    { text: '$MIA and $NYC citycoin holders still waiting... patience is key', sentiment: 'neutral' },
    { text: 'Stacks 2.5 upgrade coming, $STX about to get way faster. Bullish af', sentiment: 'bullish' },
    { text: 'Whale just moved 500k $STX to exchange. Dump incoming? 🐋', sentiment: 'bearish' },
    { text: 'CA: SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.velar-token - $VELAR still early imo', sentiment: 'bullish' },
    { text: 'Bitcoin pumping but $STX lagging. Ratio looking weak ngl', sentiment: 'bearish' },
    { text: 'Stacking STX for that sweet 10% APY. Passive income while I sleep 😴', sentiment: 'bullish' },
    { text: '$WELSH community is unmatched. Best vibes in the Stacks ecosystem 🐕', sentiment: 'bullish' },
    { text: 'ALEX Lab shipping features fast. $ALEX token utility expanding 🚀', sentiment: 'bullish' },
    { text: 'Hiro wallet update is clean. Stacks UX getting better every day', sentiment: 'neutral' },
    { text: 'ngmi if youre not paying attention to Bitcoin L2s. $STX leading the charge', sentiment: 'bullish' },
    { text: '$GWEI token interesting concept. Gas token for Stacks? Watching closely', sentiment: 'neutral' },
    { text: 'Taking profits on $NOT, nice 3x but momentum fading', sentiment: 'bearish' },
  ];

  // Use page to offset which tweets we pick for variety
  const offset = ((page - 1) * count) % mockTexts.length;
  const shuffled = [...mockTexts].sort(() => Math.random() - 0.5);

  const timeframes: Array<'1h' | '4h' | '1d' | '1w'> = ['1h', '4h', '1d', '1w'];
  return shuffled.slice(0, count).map((item, idx) => {
    const userIdx = (offset + idx) % USERNAMES.length;
    const user = USERNAMES[userIdx];
    const tokens = extractTokens(item.text);
    const asset = determineAsset(item.text, tokens);
    return {
      id: `mock-${page}-${Date.now()}-${idx}`,
      text: item.text,
      author: {
        ...user,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
      },
      createdAt: new Date(Date.now() - Math.random() * 2700000).toISOString(),
      metrics: {
        likes: Math.floor(Math.random() * 5000),
        retweets: Math.floor(Math.random() * 1000),
        replies: Math.floor(Math.random() * 200),
      },
      tokens,
      sentiment: item.sentiment as 'bullish' | 'bearish' | 'neutral',
      timeframe: timeframes[Math.floor(Math.random() * timeframes.length)],
      asset,
    };
  });
}

/**
 * Get token info by ticker or CA
 */
export function getTokenInfo(tokenValue: string): { ticker: string; ca: string } | null {
  const normalized = tokenValue.toUpperCase();

  const byTicker = SAMPLE_TOKENS.find((t) => t.ticker === normalized || t.ticker === `$${normalized}`);
  if (byTicker) return { ticker: byTicker.ticker, ca: byTicker.ca };

  const byCA = SAMPLE_TOKENS.find((t) => t.ca.toLowerCase() === tokenValue.toLowerCase());
  if (byCA) return { ticker: byCA.ticker, ca: byCA.ca };

  return null;
}

export default { generateTweetsOpenRouter, extractTokens, getTokenInfo, getTweetsForPage, getAllLoadedTweets, clearTweetCache };
