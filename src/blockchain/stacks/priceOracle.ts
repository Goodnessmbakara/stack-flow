/**
 * StackFlow Price Oracle
 * 
 * Fetches real-time STX and BTC prices from multiple sources
 * - Primary: CoinGecko API (free tier, no API key needed)
 * - Secondary: Binance API (fallback)
 * - Future: Pyth Network oracle for on-chain prices
 * 
 * Features:
 * - 30-second caching to minimize API calls
 * - Multi-source fetching with fallbacks
 * - Type-safe with proper error handling
 * - Rate limit aware (CoinGecko free: 30 calls/minute)
 */

interface PriceData {
  symbol: string;
  price: number;
  source: string;
  timestamp: number;
  confidence?: number; // Price confidence (0-1)
}

// Price cache
const priceCache = new Map<string, PriceData>();
const CACHE_TTL = 30000; // 30 seconds (optimal for free tier)

/**
 * Get current price for STX or BTC
 * 
 * @param asset - Asset symbol ('STX' or 'BTC')
 * @returns Current USD price
 */
export async function getAssetPrice(asset: 'STX' | 'BTC'): Promise<number> {
  // Check cache first
  const cached = priceCache.get(asset);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[PriceOracle] Using cached price for ${asset}: $${cached.price}`);
    return cached.price;
  }
  
  console.log(`[PriceOracle] Fetching fresh price for ${asset}...`);
  
  // Try sources sequentially (more reliable than Promise.race for CORS issues)
  let priceData: PriceData | null = null;
  let lastError: Error | null = null;
  
  try {
    priceData = await fetchFromCoinGecko(asset);
  } catch (error) {
    lastError = error as Error;
    console.warn(`[PriceOracle] CoinGecko failed, trying Binance...`);
    try {
      priceData = await fetchFromBinance(asset);
    } catch (error2) {
      lastError = error2 as Error;
      console.warn(`[PriceOracle] Binance failed, trying CoinCap...`);
      try {
        priceData = await fetchFromCoinCap(asset);
      } catch (error3) {
        lastError = error3 as Error;
        // All failed
      }
    }
  }
  
  if (priceData) {
    // Cache the result
    priceCache.set(asset, priceData);
    
    console.log(`[PriceOracle] ✓ ${asset} price: $${priceData.price} (source: ${priceData.source})`);
    
    return priceData.price;
  } else {
    console.error(`[PriceOracle] ✗ All price sources failed for ${asset}`, lastError);
    
    // Return last known price if available (stale price better than no price)
    if (cached) {
      const staleAge = Math.floor((Date.now() - cached.timestamp) / 1000);
      console.warn(`[PriceOracle] Using stale price (${staleAge}s old) for ${asset}: $${cached.price}`);
      return cached.price;
    }
    
    throw new Error(`Unable to fetch price for ${asset}. All sources failed.`);
  }
}

/**
 * Get both STX and BTC prices in a single call
 * More efficient than calling getAssetPrice twice
 */
export async function getAllPrices(): Promise<{ stx: number; btc: number }> {
  const [stx, btc] = await Promise.all([
    getAssetPrice('STX'),
    getAssetPrice('BTC'),
  ]);
  
  return { stx, btc };
}

/**
 * Fetch price from CoinGecko API
 * 
 * Free tier limits:
 * - 30 calls/minute
 * - No API key required
 * - Reliable and widely used
 * 
 * @see https://www.coingecko.com/en/api/documentation
 */
async function fetchFromCoinGecko(asset: string): Promise<PriceData> {
  const coinIds: Record<string, string> = {
    STX: 'blockstack',
    BTC: 'bitcoin',
  };
  
  const coinId = coinIds[asset];
  if (!coinId) {
    throw new Error(`Unknown asset: ${asset}`);
  }
  
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_last_updated_at=true`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`CoinGecko HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data[coinId]?.usd) {
      throw new Error(`CoinGecko: No price data for ${asset}`);
    }
    
    return {
      symbol: asset,
      price: data[coinId].usd,
      source: 'CoinGecko',
      timestamp: Date.now(),
      confidence: 1.0, // CoinGecko is highly reliable
    };
  } catch (error) {
    console.error(`[CoinGecko] Failed to fetch ${asset}:`, error);
    throw error;
  }
}

/**
 * Fetch price from Binance API
 * 
 * Binance Spot API:
 * - No rate limits for public endpoints (reasonable use)
 * - Fast and reliable
 * - Good fallback option
 * 
 * @see https://binance-docs.github.io/apidocs/spot/en/#symbol-price-ticker
 */
async function fetchFromBinance(asset: string): Promise<PriceData> {
  const symbols: Record<string, string> = {
    STX: 'STXUSDT',
    BTC: 'BTCUSDT',
  };
  
  const symbol = symbols[asset];
  if (!symbol) {
    throw new Error(`Unknown asset: ${asset}`);
  }
  
  const url = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Binance HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.price) {
      throw new Error(`Binance: No price data for ${asset}`);
    }
    
    return {
      symbol: asset,
      price: parseFloat(data.price),
      source: 'Binance',
      timestamp: Date.now(),
      confidence: 0.95, // Slightly lower confidence than CoinGecko (exchange-specific)
    };
  } catch (error) {
    console.error(`[Binance] Failed to fetch ${asset}:`, error);
    throw error;
  }
}

/**
 * Fetch price from CoinCap API
 * 
 * CoinCap API:
 * - Free, no auth required
 * - Good as tertiary fallback
 * 
 * @see https://docs.coincap.io/
 */
async function fetchFromCoinCap(asset: string): Promise<PriceData> {
  const coinIds: Record<string, string> = {
    STX: 'blockstack',
    BTC: 'bitcoin',
  };
  
  const coinId = coinIds[asset];
  if (!coinId) {
    throw new Error(`Unknown asset: ${asset}`);
  }
  
  const url = `https://api.coincap.io/v2/assets/${coinId}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`CoinCap HTTP ${response.status}: ${response.statusText}`);
    }
    
    const json = await response.json();
    const data = json.data;
    
    if (!data?.priceUsd) {
      throw new Error(`CoinCap: No price data for ${asset}`);
    }
    
    return {
      symbol: asset,
      price: parseFloat(data.priceUsd),
      source: 'CoinCap',
      timestamp: Date.now(),
      confidence: 0.9,
    };
  } catch (error) {
    console.error(`[CoinCap] Failed to fetch ${asset}:`, error);
    throw error;
  }
}

/**
 * Clear price cache (useful for testing or force refresh)
 */
export function clearPriceCache(): void {
  priceCache.clear();
  console.log('[PriceOracle] Cache cleared');
}

/**
 * Get cache stats (for monitoring)
 */
export function getCacheStats(): {
  size: number;
  entries: Array<{ asset: string; price: number; age: number; source: string }>;
} {
  const entries = Array.from(priceCache.entries()).map(([asset, data]) => ({
    asset,
    price: data.price,
    age: Date.now() - data.timestamp,
    source: data.source,
  }));
  
  return {
    size: priceCache.size,
    entries,
  };
}

/**
 * Future: Fetch price from Pyth Network oracle (on-chain)
 * 
 * Pyth Network provides decentralized, on-chain price feeds
 * This will be used for settlement prices in smart contracts
 * 
 * @see https://pyth.network/
 * @see https://github.com/hirosystems/stacks-pyth-bridge
 */
export async function fetchFromPythOracle(_asset: 'STX' | 'BTC'): Promise<number> {
  // TODO: Implement Pyth Network integration in Phase 2
  // Pyth feed IDs will be:
  // STX: '0x...'  // Get from Pyth documentation
  // BTC: '0x...'  // Get from Pyth documentation
  
  throw new Error('Pyth oracle integration coming in Phase 2');
}

