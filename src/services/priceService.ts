/**
 * Real-time Price Service
 * Provides consistent price data across the application
 */

export interface PriceData {
  price: number;
  timestamp: number;
  source: string;
}

export type AssetType = 'STX' | 'BTC' | 'ETH' | 'ALEX' | 'WELSH' | 'SBTC';

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
   * Fetch price from external APIs with improved CORS and rate-limit handling
   */
  private async fetchPrice(asset: AssetType): Promise<PriceData> {
    try {
      const response = await fetch(`/api/prices?asset=${asset}`);
      if (response.ok) {
        return await response.json();
      }
      throw new Error(`Proxy returned ${response.status}`);
    } catch (e) {
      console.warn(`[PriceService] Proxy fetch failed for ${asset}, using static fallback.`, e);
      const fallbacks: Record<AssetType, number> = { 
        STX: 2.10, 
        BTC: 96000, 
        ETH: 3300,
        ALEX: 0.15,
        WELSH: 0.002,
        SBTC: 96000
      };
      return {
        price: fallbacks[asset],
        timestamp: Date.now(),
        source: 'Internal Fallback'
      };
    }
  }

  /**
   * Start periodic price updates
   */
  private startPeriodicUpdates(): void {
    this.updateInterval = setInterval(async () => {
      const assets: AssetType[] = ['STX', 'BTC', 'ETH', 'ALEX', 'WELSH', 'SBTC'];

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
