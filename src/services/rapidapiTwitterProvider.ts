import axios from 'axios';
import type { Tweet } from './twitterService';

const RAPIDAPI_HOST = import.meta.env.VITE_RAPIDAPI_HOST || 'twitter241.p.rapidapi.com';
const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;

/**
 * Search tweets using RapidAPI Twttr endpoint
 * Returns tweets mapped to our internal Tweet shape
 */
export async function searchTweetsRapid(query: string, maxResults = 20): Promise<Tweet[]> {
  if (!RAPIDAPI_KEY) {
    console.warn('[RapidAPI] Missing VITE_RAPIDAPI_KEY');
    return [];
  }

  try {
    const url = `https://${RAPIDAPI_HOST}/tweets/search/recent`;
    const resp = await axios.get(url, {
      params: {
        query: `${query} -is:retweet lang:en`,
        max_results: maxResults,
        'tweet.fields': 'created_at,public_metrics,author_id'
      },
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY,
        'useQueryString': 'true'
      }
    });

    const data = resp.data?.data || [];

    // Map to our Tweet shape defensively
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
  } catch (error) {
    // Surface helpful hints for common errors like 403 (missing key or unauthorized)
    const status = (error as any)?.response?.status;
    if (status === 403) {
      console.error('[RapidAPI] 403 Forbidden - check your VITE_RAPIDAPI_KEY and that your RapidAPI Twttr subscription is active');
    } else if ((error as any)?.code === 'ECONNREFUSED') {
      console.error('[RapidAPI] Connection refused - check network or RapidAPI host');
    } else {
      console.error('[RapidAPI] Failed to fetch tweets:', error);
    }
    return [];
  }
}

export default { searchTweetsRapid };
