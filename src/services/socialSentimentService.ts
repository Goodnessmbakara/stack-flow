/**
 * Social Sentiment Service
 * Provides whale tracking, copy trading signals, and meme sentiment data
 * Uses mock data with realistic patterns for demo purposes
 */

export interface WhaleWallet {
  id: string;
  address: string;
  alias: string;
  totalValue: number;
  winRate: number;
  avgProfitLoss: number;
  lastTradeTime: number;
  totalTrades: number;
  followersCount: number;
  isVerified: boolean;
  strategy: 'bullish' | 'bearish' | 'volatile' | 'conservative';
  recentTrades: WhaleTradeActivity[];
}

export interface WhaleTradeActivity {
  txId: string;
  timestamp: number;
  action: 'BUY' | 'SELL';
  strategy: string;
  amount: number;
  asset: 'STX' | 'BTC' | 'sBTC';
  profitLoss?: number;
  confidence: number; // 0-100
}

export interface MemeSignal {
  id: string;
  title: string;
  description: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  viralScore: number; // 0-100
  communityEngagement: number;
  timeframe: '1h' | '4h' | '1d' | '1w';
  source: 'twitter' | 'reddit' | 'discord' | 'telegram';
  mentions: number;
  confidence: number;
  tags: string[];
  createdAt: number;
  asset: 'STX' | 'BTC' | 'general';
}

export interface CopyTradingPool {
  id: string;
  name: string;
  description: string;
  managerAddress: string;
  managerAlias: string;
  totalValue: number;
  participantsCount: number;
  performanceData: {
    '24h': number;
    '7d': number;
    '30d': number;
    'all': number;
  };
  strategy: string;
  minInvestment: number;
  managementFee: number;
  isActive: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface SocialSentimentData {
  whaleActivity: WhaleWallet[];
  memeSignals: MemeSignal[];
  copyTradingPools: CopyTradingPool[];
  overallSentiment: {
    score: number; // -100 to 100
    trend: 'up' | 'down' | 'stable';
    confidence: number;
    lastUpdate: number;
  };
  marketMetrics: {
    whaleActivityLevel: number;
    socialVolume: number;
    viralMentions: number;
    communityEngagement: number;
  };
}

class SocialSentimentService {
  private cache: SocialSentimentData | null = null;
  private subscribers: Set<(data: SocialSentimentData) => void> = new Set();
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_INTERVAL = 60000; // 1 minute

  constructor() {
    this.generateMockData();
    this.startPeriodicUpdates();
  }

  /**
   * Get current social sentiment data
   */
  async getSocialSentiment(): Promise<SocialSentimentData> {
    if (!this.cache) {
      this.cache = await this.generateMockData();
    }
    return this.cache;
  }

  /**
   * Get whale wallets by strategy
   */
  async getWhalesByStrategy(strategy?: string): Promise<WhaleWallet[]> {
    const data = await this.getSocialSentiment();
    if (!strategy) return data.whaleActivity;
    
    return data.whaleActivity.filter(whale => 
      whale.strategy === strategy || whale.recentTrades.some(trade => 
        trade.strategy.toLowerCase().includes(strategy.toLowerCase())
      )
    );
  }

  /**
   * Get top performing whales
   */
  async getTopWhales(limit: number = 10): Promise<WhaleWallet[]> {
    const data = await this.getSocialSentiment();
    return data.whaleActivity
      .sort((a, b) => b.avgProfitLoss - a.avgProfitLoss)
      .slice(0, limit);
  }

  /**
   * Get meme signals by sentiment
   */
  async getMemeSignals(sentiment?: 'bullish' | 'bearish' | 'neutral'): Promise<MemeSignal[]> {
    const data = await this.getSocialSentiment();
    if (!sentiment) return data.memeSignals;
    
    return data.memeSignals.filter(signal => signal.sentiment === sentiment);
  }

  /**
   * Get copy trading pools
   */
  async getCopyTradingPools(): Promise<CopyTradingPool[]> {
    const data = await this.getSocialSentiment();
    return data.copyTradingPools.filter(pool => pool.isActive);
  }

  /**
   * Subscribe to social sentiment updates
   */
  subscribe(callback: (data: SocialSentimentData) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Simulate following a whale wallet
   */
  async followWhale(whaleId: string): Promise<boolean> {
    const data = await this.getSocialSentiment();
    const whale = data.whaleActivity.find(w => w.id === whaleId);
    
    if (whale) {
      whale.followersCount += 1;
      this.notifySubscribers();
      console.log(`Now following whale: ${whale.alias}`);
      return true;
    }
    
    return false;
  }

  /**
   * Simulate joining a copy trading pool
   */
  async joinCopyTradingPool(poolId: string, amount: number): Promise<boolean> {
    const data = await this.getSocialSentiment();
    const pool = data.copyTradingPools.find(p => p.id === poolId);
    
    if (pool && amount >= pool.minInvestment) {
      pool.participantsCount += 1;
      pool.totalValue += amount;
      this.notifySubscribers();
      console.log(`Joined copy trading pool: ${pool.name} with ${amount} STX`);
      return true;
    }
    
    return false;
  }

  /**
   * Generate realistic mock data
   */
  private async generateMockData(): Promise<SocialSentimentData> {
    const now = Date.now();
    
    // Generate whale wallets
    const whaleWallets: WhaleWallet[] = [
      {
        id: 'whale-1',
        address: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
        alias: 'StacksWhale',
        totalValue: 2450000,
        winRate: 78.5,
        avgProfitLoss: 15.2,
        lastTradeTime: now - 3600000,
        totalTrades: 234,
        followersCount: 1247,
        isVerified: true,
        strategy: 'bullish',
        recentTrades: this.generateRecentTrades('bullish')
      },
      {
        id: 'whale-2',
        address: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
        alias: 'BTCMaximalist',
        totalValue: 3200000,
        winRate: 82.1,
        avgProfitLoss: 22.8,
        lastTradeTime: now - 1800000,
        totalTrades: 567,
        followersCount: 2341,
        isVerified: true,
        strategy: 'conservative',
        recentTrades: this.generateRecentTrades('conservative')
      },
      {
        id: 'whale-3',
        address: 'SP1A1YQHDRQG2D5GWVQBZZQC4FJRQVHJ3MT2X7BG5',
        alias: 'VolatilityKing',
        totalValue: 1850000,
        winRate: 65.3,
        avgProfitLoss: 28.7,
        lastTradeTime: now - 900000,
        totalTrades: 123,
        followersCount: 892,
        isVerified: true,
        strategy: 'volatile',
        recentTrades: this.generateRecentTrades('volatile')
      },
      {
        id: 'whale-4',
        address: 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KTX9',
        alias: 'BearHunter',
        totalValue: 1320000,
        winRate: 71.2,
        avgProfitLoss: -8.4,
        lastTradeTime: now - 2700000,
        totalTrades: 89,
        followersCount: 543,
        isVerified: false,
        strategy: 'bearish',
        recentTrades: this.generateRecentTrades('bearish')
      }
    ];

    // Generate meme signals
    const memeSignals: MemeSignal[] = [
      {
        id: 'meme-1',
        title: 'STX to the Moon 🚀',
        description: 'Stacks community rallying behind major Bitcoin L2 adoption',
        sentiment: 'bullish',
        viralScore: 87,
        communityEngagement: 94,
        timeframe: '4h',
        source: 'twitter',
        mentions: 12500,
        confidence: 82,
        tags: ['stacks', 'bitcoin', 'l2', 'moon'],
        createdAt: now - 7200000,
        asset: 'STX'
      },
      {
        id: 'meme-2',
        title: 'Diamond Hands Bitcoin Strategy',
        description: 'Community pushing long-term BTC accumulation strategies',
        sentiment: 'bullish',
        viralScore: 92,
        communityEngagement: 88,
        timeframe: '1d',
        source: 'reddit',
        mentions: 8900,
        confidence: 91,
        tags: ['bitcoin', 'hodl', 'diamond-hands'],
        createdAt: now - 14400000,
        asset: 'BTC'
      },
      {
        id: 'meme-3',
        title: 'Bears Getting Rekt',
        description: 'Short sellers facing massive liquidations as market pumps',
        sentiment: 'bullish',
        viralScore: 76,
        communityEngagement: 71,
        timeframe: '1h',
        source: 'discord',
        mentions: 3400,
        confidence: 68,
        tags: ['bears', 'liquidation', 'pump'],
        createdAt: now - 3600000,
        asset: 'general'
      },
      {
        id: 'meme-4',
        title: 'Market Correction Incoming',
        description: 'Technical analysis suggests potential pullback',
        sentiment: 'bearish',
        viralScore: 45,
        communityEngagement: 52,
        timeframe: '1w',
        source: 'telegram',
        mentions: 1200,
        confidence: 43,
        tags: ['correction', 'technical-analysis', 'pullback'],
        createdAt: now - 21600000,
        asset: 'general'
      }
    ];

    // Generate copy trading pools
    const copyTradingPools: CopyTradingPool[] = [
      {
        id: 'pool-1',
        name: 'Stacks Whale Fund',
        description: 'Following top STX whales with proven track records',
        managerAddress: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
        managerAlias: 'StacksWhale',
        totalValue: 450000,
        participantsCount: 127,
        performanceData: {
          '24h': 2.3,
          '7d': 15.7,
          '30d': 42.1,
          'all': 156.8
        },
        strategy: 'Whale Tracking + Options',
        minInvestment: 50,
        managementFee: 2.5,
        isActive: true,
        riskLevel: 'medium'
      },
      {
        id: 'pool-2',
        name: 'Conservative BTC Strategy',
        description: 'Low-risk Bitcoin accumulation with options hedging',
        managerAddress: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
        managerAlias: 'BTCMaximalist',
        totalValue: 1200000,
        participantsCount: 89,
        performanceData: {
          '24h': 0.8,
          '7d': 8.2,
          '30d': 18.9,
          'all': 78.4
        },
        strategy: 'Conservative DCA + Put Protection',
        minInvestment: 50,
        managementFee: 1.5,
        isActive: true,
        riskLevel: 'low'
      },
      {
        id: 'pool-3',
        name: 'High Volatility Plays',
        description: 'Aggressive options strategies for high returns',
        managerAddress: 'SP1A1YQHDRQG2D5GWVQBZZQC4FJRQVHJ3MT2X7BG5',
        managerAlias: 'VolatilityKing',
        totalValue: 320000,
        participantsCount: 45,
        performanceData: {
          '24h': -1.2,
          '7d': 28.9,
          '30d': 67.3,
          'all': 198.7
        },
        strategy: 'Straddles + Strangles',
        minInvestment: 50,
        managementFee: 3.0,
        isActive: true,
        riskLevel: 'high'
      }
    ];

    return {
      whaleActivity: whaleWallets,
      memeSignals,
      copyTradingPools,
      overallSentiment: {
        score: 67, // Bullish sentiment
        trend: 'up',
        confidence: 78,
        lastUpdate: now
      },
      marketMetrics: {
        whaleActivityLevel: 82,
        socialVolume: 94,
        viralMentions: 67843,
        communityEngagement: 89
      }
    };
  }

  /**
   * Generate recent trades for whales
   */
  private generateRecentTrades(strategy: string): WhaleTradeActivity[] {
    const now = Date.now();
    const trades: WhaleTradeActivity[] = [];
    
    for (let i = 0; i < 5; i++) {
      const timestamp = now - (i * 3600000 + Math.random() * 3600000);
      const strategies = ['CALL', 'PUT', 'STRAP', 'STRIP', 'Bull Call Spread'];
      
      trades.push({
        txId: `0x${Math.random().toString(16).substr(2, 40)}`,
        timestamp,
        action: Math.random() > 0.5 ? 'BUY' : 'SELL',
        strategy: strategies[Math.floor(Math.random() * strategies.length)],
        amount: Math.random() * 1000 + 100,
        asset: Math.random() > 0.7 ? 'BTC' : 'STX',
        profitLoss: strategy === 'bearish' ? 
          -(Math.random() * 50 + 10) : 
          Math.random() * 100 + 20,
        confidence: Math.random() * 30 + 70
      });
    }
    
    return trades.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Start periodic updates
   */
  private startPeriodicUpdates(): void {
    this.updateInterval = setInterval(async () => {
      try {
        // Simulate dynamic updates
        if (this.cache) {
          // Update whale activity
          this.cache.whaleActivity.forEach(whale => {
            whale.lastTradeTime = Math.random() > 0.8 ? Date.now() : whale.lastTradeTime;
            whale.followersCount += Math.random() > 0.9 ? 1 : 0;
          });

          // Update meme signals
          this.cache.memeSignals.forEach(signal => {
            signal.viralScore += (Math.random() - 0.5) * 10;
            signal.viralScore = Math.max(0, Math.min(100, signal.viralScore));
            signal.mentions += Math.floor(Math.random() * 100);
          });

          // Update overall sentiment
          this.cache.overallSentiment.score += (Math.random() - 0.5) * 20;
          this.cache.overallSentiment.score = Math.max(-100, Math.min(100, this.cache.overallSentiment.score));
          this.cache.overallSentiment.lastUpdate = Date.now();

          this.notifySubscribers();
        }
      } catch (error) {
        console.error('Error updating social sentiment data:', error);
      }
    }, this.UPDATE_INTERVAL);
  }

  /**
   * Notify subscribers
   */
  private notifySubscribers(): void {
    if (this.cache) {
      this.subscribers.forEach(callback => {
        try {
          callback(this.cache!);
        } catch (error) {
          console.error('Error in social sentiment subscriber:', error);
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
    this.cache = null;
    this.subscribers.clear();
  }
}

// Export singleton instance
export const socialSentimentService = new SocialSentimentService();
