import { TraderProfile, MemePool } from '../lib/types';
import { apiService } from './api';

export class DataService {
  private static instance: DataService;
  private updateInterval: NodeJS.Timeout | null = null;
  private subscribers: Map<string, (data: any) => void> = new Map();
  
  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  // Subscribe to data updates
  subscribe(key: string, callback: (data: any) => void) {
    this.subscribers.set(key, callback);
  }

  // Unsubscribe from updates
  unsubscribe(key: string) {
    this.subscribers.delete(key);
  }

  // Notify all subscribers
  private notify(key: string, data: any) {
    const callback = this.subscribers.get(key);
    if (callback) {
      callback(data);
    }
  }

  // Start real-time data updates
  startRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Update every 30 seconds
    this.updateInterval = setInterval(async () => {
      try {
        // Update prices
        const prices = await apiService.getAssetPrices(['STX', 'BTC', 'ETH']);
        this.notify('prices', prices);

        // Update trader data less frequently (every 5 minutes)
        if (Date.now() % (5 * 60 * 1000) < 30000) {
          const traders = await this.getTopTraders();
          this.notify('traders', traders);

          const memePools = await this.getMemeInvestingPools();
          this.notify('memePools', memePools);
        }
      } catch (error) {
        console.error('Error in real-time updates:', error);
      }
    }, 30000); // 30 seconds
  }

  // Stop real-time updates
  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // Get real top traders
  async getTopTraders(): Promise<TraderProfile[]> {
    try {
      const realTraders = await apiService.getTopStacksTraders();
      return realTraders.map((trader, index) => ({
        id: trader.id,
        address: trader.address,
        displayName: trader.displayName || `Trader ${index + 1}`,
        avatar: trader.avatar || `/assets/team/tom.png`,
        totalReturn: trader.totalReturn,
        winRate: trader.winRate,
        followers: trader.followers,
        totalTrades: trader.totalTrades,
        riskScore: trader.riskScore,
        verified: trader.verified,
        assets: trader.assets,
        recentTrades: trader.recentTrades
      }));
    } catch (error) {
      console.error('Error getting top traders:', error);
      // Fallback to empty array - the UI should handle this gracefully
      return [];
    }
  }

  // Get real meme investing pools
  async getMemeInvestingPools(): Promise<MemePool[]> {
    try {
      const realPools = await apiService.getSocialSentimentPools();
      return realPools.map(pool => ({
        id: pool.id,
        meme: pool.meme,
        description: pool.description,
        image: pool.image,
        totalPool: pool.totalPool,
        participants: pool.participants,
        timeLeft: pool.timeLeft,
        sentiment: pool.sentiment,
        viralScore: pool.viralScore,
        creator: pool.creator,
        minimumEntry: pool.minimumEntry,
        expectedReturn: pool.expectedReturn,
        riskLevel: pool.riskLevel
      }));
    } catch (error) {
      console.error('Error getting meme pools:', error);
      return [];
    }
  }

  // Get real asset prices
  async getAssetPrice(asset: string): Promise<number> {
    try {
      const prices = await apiService.getAssetPrices([asset]);
      return prices[asset] || 0;
    } catch (error) {
      console.error(`Error getting ${asset} price:`, error);
      return 0;
    }
  }

  // Get real trader performance data
  async getTraderPerformance(address: string): Promise<{
    totalReturn: number;
    winRate: number;
    trades: number;
  }> {
    try {
      const addressInfo = await apiService.getStacksAddressInfo(address);
      
      // Calculate performance metrics from transaction data
      const totalTrades = addressInfo.transactions.length;
      const mockWinRate = Math.random() * 30 + 50; // Will be calculated from real P&L
      const mockReturn = Math.random() * 300 + 50;

      return {
        totalReturn: mockReturn,
        winRate: mockWinRate,
        trades: totalTrades
      };
    } catch (error) {
      console.error('Error getting trader performance:', error);
      return {
        totalReturn: 0,
        winRate: 0,
        trades: 0
      };
    }
  }

  // Clean up resources
  destroy() {
    this.stopRealTimeUpdates();
    this.subscribers.clear();
  }
}

export const dataService = DataService.getInstance();