import { TraderProfile, MemePool } from '../lib/types';
import { apiService } from './api';

export class DataService {
  private static instance: DataService;
  private subscribers = new Set<() => void>();
  private updateInterval: NodeJS.Timeout | null = null;

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  // Subscribe to data updates
  subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // Notify all subscribers
  private notifySubscribers() {
    this.subscribers.forEach(callback => callback());
  }

  // Start real-time data updates
  startRealTimeUpdates(intervalMs: number = 30000) {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(() => {
      console.log('📊 Real-time data update triggered');
      this.notifySubscribers();
    }, intervalMs);
  }

  // Stop real-time updates
  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // Get real top traders - no fallback
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
      console.error('Error getting real top traders:', error);
      throw new Error('Failed to fetch real trader data. API may be unavailable.');
    }
  }

  // Get real meme investing pools - no fallback
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
        riskLevel: pool.riskLevel,
        tokens: pool.tokens,
        contractId: pool.contractId,
        volume24h: pool.volume24h,
        trades24h: pool.trades24h,
        priceChange24h: pool.priceChange24h,
        verified: pool.verified,
        isHot: pool.isHot
      }));
    } catch (error) {
      console.error('Error getting real meme pools:', error);
      throw new Error('Failed to fetch real pool data. API may be unavailable.');
    }
  }

  // Get real trader performance data - no mock data
  async getTraderPerformance(address: string): Promise<{
    totalReturn: number;
    winRate: number;
    trades: number;
  }> {
    try {
      const addressInfo = await apiService.getStacksAddressInfo(address);
      
      // Calculate real performance metrics from transaction data
      const totalTrades = addressInfo.transactions.length;
      const successfulTxs = addressInfo.transactions.filter(tx => tx.tx_status === 'success').length;
      const winRate = totalTrades > 0 ? (successfulTxs / totalTrades) * 100 : 0;
      
      // Calculate returns based on transaction values (simplified)
      let totalReturn = 0;
      addressInfo.transactions.forEach(tx => {
        if (tx.token_transfer && tx.token_transfer.amount) {
          totalReturn += parseInt(tx.token_transfer.amount) / 1000000;
        }
      });
      
      return {
        totalReturn: Math.max(totalReturn / 100, 0), // Convert to percentage
        winRate,
        trades: totalTrades
      };
    } catch (error) {
      console.error('Error getting real trader performance:', error);
      throw new Error('Failed to fetch real trader performance data.');
    }
  }

  // Clean up resources
  destroy() {
    this.stopRealTimeUpdates();
    this.subscribers.clear();
  }
}

export const dataService = DataService.getInstance();