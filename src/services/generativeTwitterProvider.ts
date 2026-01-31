import axios from 'axios';
import type { Tweet } from './twitterService';

// Simple in-memory cache to avoid calling Gemini too often during dev
const cache = new Map<string, { ts: number; tweets: Tweet[] }>();
const TTL_MS = 60 * 1000; // 60s cache

function extractJsonArray(text: string): any[] | null {
  // Try to extract the first JSON array from the text
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const json = text.slice(start, end + 1);
    return JSON.parse(json);
  } catch (err) {
    return null;
  }
}

/**
 * Ask Gemini (via our dev proxy) to generate synthetic tweets for a topic.
 * Returns tweets mapped to Tweet shape.
 */
export async function generateTweetsGemini(query: string, maxResults = 10): Promise<Tweet[]> {
  const key = `${query}::${maxResults}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < TTL_MS) return cached.tweets;

  try {
    // Prompt instructing Gemini to return a JSON array of tweets
    const prompt = `Generate ${maxResults} brief, realistic tweets about the topic: "${query}". ` +
      'Return a valid JSON array only. Each item must be an object with fields: id (string), text (string), created_at (ISO string), author_id (string), public_metrics (object with like_count and retweet_count integers). Example: [{"id":"1","text":"...","created_at":"2025-01-01T00:00:00Z","author_id":"u1","public_metrics":{"like_count":2,"retweet_count":1}}]';

    const body = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    };

    const resp = await axios.post('/api/gemini/generate', body, { headers: { 'Content-Type': 'application/json' } });

    // Gemini response may place text in resp.data.candidates[0].content[0].text or in resp.data["candidates"]
    const raw = resp.data?.candidates?.[0]?.content?.[0]?.text || resp.data?.candidates?.[0]?.text || resp.data?.output?.[0]?.content?.[0]?.text || JSON.stringify(resp.data);

    let arr = extractJsonArray(String(raw));
    if (!arr) {
      // Fallback: sometimes model returns plain JSON in the first candidate
      try {
        arr = resp.data?.candidates?.[0]?.metadata?.json || null;
      } catch (e) {
        arr = null;
      }
    }

    if (!arr || !Array.isArray(arr)) {
      console.warn('[GenerativeProvider] Could not parse JSON from Gemini response, returning empty array');
      cache.set(key, { ts: Date.now(), tweets: [] });
      return [];
    }

    const tweets: Tweet[] = arr.slice(0, maxResults).map((t: any, idx: number) => ({
      id: String(t.id || `gen-${Date.now()}-${idx}`),
      text: String(t.text || t.content || ''),
      created_at: t.created_at || new Date().toISOString(),
      author_id: String(t.author_id || `gen-${idx}`),
      public_metrics: {
        retweet_count: Number((t.public_metrics && t.public_metrics.retweet_count) || t.retweet_count || 0),
        reply_count: Number((t.public_metrics && t.public_metrics.reply_count) || 0),
        like_count: Number((t.public_metrics && t.public_metrics.like_count) || t.like_count || 0),
        quote_count: Number((t.public_metrics && t.public_metrics.quote_count) || 0),
        impression_count: Number((t.public_metrics && t.public_metrics.impression_count) || 0)
      }
    }));

    cache.set(key, { ts: Date.now(), tweets });
    return tweets;
  } catch (error) {
    console.error('[GenerativeProvider] Gemini request failed:', error);
    cache.set(key, { ts: Date.now(), tweets: [] });
    return [];
  }
}

export default { generateTweetsGemini };
