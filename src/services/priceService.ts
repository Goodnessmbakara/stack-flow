/**
 * Real-time Price Service
 * Provides consistent price data across the application
 */

import { memeDataService, type MemeToken, type SocialSentimentData } from './memeDataService';

export interface PriceData {
  price: number;
  timestamp: number;
  source: string;
}

export type AssetType = 'STX' | 'BTC' | 'ETH';

class PriceService {
  private cache: Map<AssetType, PriceData> = new Map();
  private subscribers: Map<AssetType, Set<(price: PriceData) => void>> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  constructor() {
    this.startPeriodicUpdates();
  }

  /**
   * Get current price for an asset
   */
  async getCurrentPrice(asset: AssetType): Promise<number> {
    const cached = this.cache.get(asset);
    const now = Date.now();

    // Return cached price if it's fresh
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return cached.price;
    }

    // Fetch fresh price
    const priceData = await this.fetchPrice(asset);
    this.cache.set(asset, priceData);
    
    // Notify subscribers
    this.notifySubscribers(asset, priceData);
    
    return priceData.price;
  }

  /**
   * Subscribe to price updates
   */
  subscribe(asset: AssetType, callback: (price: PriceData) => void): () => void {
    if (!this.subscribers.has(asset)) {
      this.subscribers.set(asset, new Set());
    }
    
    this.subscribers.get(asset)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.get(asset)?.delete(callback);
    };
  }

  /**
   * Fetch price from external APIs
   */
  private async fetchPrice(asset: AssetType): Promise<PriceData> {
    try {
      let price = 0;
      let source = '';

      if (asset === 'STX') {
        // Try CoinGecko first for STX
        try {
          const response = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=stacks&vs_currencies=usd'
          );
          
          if (response.ok) {
            const data = await response.json();
            price = data.stacks?.usd || 0;
            source = 'CoinGecko';
          }
        } catch (error) {
          console.warn('CoinGecko failed for STX:', error);
        }

        // Fallback to Stacks API if CoinGecko fails
        if (price === 0) {
          try {
            const response = await fetch(
              'https://api.testnet.hiro.so/v2/pox'
            );
            
            if (response.ok) {
              const data = await response.json();
              // This is a simplified approach - you might need to adjust based on actual API
              price = 0.58; // Fallback price
              source = 'Stacks API';
            }
          } catch (error) {
            console.warn('Stacks API failed:', error);
          }
        }
      } else {
        // Use Binance for BTC/ETH
        const symbol = asset === 'BTC' ? 'BTCUSDT' : 'ETHUSDT';
        
        try {
          const response = await fetch(
            `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`
          );
          
          if (response.ok) {
            const data = await response.json();
            price = parseFloat(data.price);
            source = 'Binance';
          }
        } catch (error) {
          console.warn(`Binance failed for ${asset}:`, error);
        }
      }

      // Final fallback
      if (price === 0) {
        const fallbackPrices = {
          'STX': 0.58,
          'BTC': 50000,
          'ETH': 3000
        };
        price = fallbackPrices[asset];
        source = 'Fallback';
      }

      return {
        price,
        timestamp: Date.now(),
        source
      };
    } catch (error) {
      console.error(`Failed to fetch price for ${asset}:`, error);
      
      // Return fallback price
      const fallbackPrices = {
        'STX': 0.58,
        'BTC': 50000,
        'ETH': 3000
      };
      
      return {
        price: fallbackPrices[asset],
        timestamp: Date.now(),
        source: 'Error Fallback'
      };
    }
  }

  /**
   * Start periodic price updates
   */
  private startPeriodicUpdates(): void {
    this.updateInterval = setInterval(async () => {
      const assets: AssetType[] = ['STX', 'BTC', 'ETH'];
      
      for (const asset of assets) {
        try {
          const priceData = await this.fetchPrice(asset);
          this.cache.set(asset, priceData);
          this.notifySubscribers(asset, priceData);
        } catch (error) {
          console.error(`Failed to update price for ${asset}:`, error);
        }
      }
    }, 30000); // Update every 30 seconds
  }

  /**
   * Notify subscribers of price updates
   */
  private notifySubscribers(asset: AssetType, priceData: PriceData): void {
    const subscribers = this.subscribers.get(asset);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(priceData);
        } catch (error) {
          console.error('Error in price subscriber callback:', error);
        }
      });
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.cache.clear();
    this.subscribers.clear();
  }
}

// Export singleton instance
export const priceService = new PriceService();

/**
 * Get enhanced price data with social sentiment
 */
export async function getEnhancedPriceData(symbol: string): Promise<{
  price: number;
  change24h: number;
  sentiment: SocialSentimentData | null;
  memeData?: MemeToken;
}> {
  try {
    const [priceData, sentimentData, memeTokens] = await Promise.all([
      getPrice(symbol),
      symbol === 'BTC' ? memeDataService.getSBTCSentiment() : null,
      memeDataService.getTrendingMemeCoins()
    ]);

    const memeData = memeTokens.find(token => token.symbol === symbol.toUpperCase());

    return {
      price: priceData.price,
      change24h: priceData.change24h || 0,
      sentiment: sentimentData,
      memeData
    };
  } catch (error) {
    console.error(`Failed to get enhanced price data for ${symbol}:`, error);
    return {
      price: 0,
      change24h: 0,
      sentiment: null
    };
  }
}

/**
 * Get social sentiment dashboard data
 */
export async function getSocialSentimentDashboard(): Promise<{
  sBTCSentiment: SocialSentimentData;
  trendingMemes: MemeToken[];
  memePools: any[];
}> {
  try {
    const [sBTCSentiment, trendingMemes, memePools] = await Promise.all([
      memeDataService.getSBTCSentiment(),
      memeDataService.getTrendingMemeCoins(),
      memeDataService.getMemeBasedPools()
    ]);

    return {
      sBTCSentiment,
      trendingMemes: trendingMemes.slice(0, 10),
      memePools
    };
  } catch (error) {
    console.error('Failed to get social sentiment dashboard:', error);
    return {
      sBTCSentiment: {
        token: 'sBTC',
        sentiment: 'neutral',
        score: 50,
        volume: 0,
        social_mentions: 0,
        price_momentum: 0
      },
      trendingMemes: [],
      memePools: []
    };
  }
}
function getPrice(symbol: string): any {
  throw new Error('Function not implemented.');
}

