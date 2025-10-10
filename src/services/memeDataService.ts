import axios from 'axios';

export interface MemeToken {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  volume_24h: number;
  social_stats?: {
    twitter_followers?: number;
    reddit_subscribers?: number;
    telegram_channel_user_count?: number;
  };
  sentiment_score: number;
  viral_score: number;
}

export interface SocialSentimentData {
  token: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  score: number;
  volume: number;
  trending_rank?: number;
  social_mentions: number;
  price_momentum: number;
}

class MemeDataService {
  private readonly BASE_URL = 'https://api.coingecko.com/api/v3';
  private readonly API_KEY = import.meta.env.VITE_COINGECKO_API_KEY;

  private getHeaders() {
    const headers: Record<string, string> = {
      'accept': 'application/json',
    };
    
    if (this.API_KEY) {
      headers['x-cg-pro-api-key'] = this.API_KEY;
    }
    
    return headers;
  }

  /**
   * Get trending meme coins from CoinGecko
   */
  async getTrendingMemeCoins(): Promise<MemeToken[]> {
    try {
      console.log('🔄 Fetching trending meme coins...');
      
      // Get trending coins
      const trendingResponse = await axios.get(`${this.BASE_URL}/search/trending`, {
        headers: this.getHeaders()
      });

      const trendingIds = trendingResponse.data.coins.slice(0, 10).map((coin: any) => coin.item.id);
      console.log('📊 Found trending coins:', trendingIds);

      // Get detailed data for trending coins
      const detailsResponse = await axios.get(`${this.BASE_URL}/coins/markets`, {
        params: {
          vs_currency: 'usd',
          ids: trendingIds.join(','),
          order: 'market_cap_desc',
          per_page: 10,
          page: 1,
          sparkline: false,
          price_change_percentage: '24h,7d'
        },
        headers: this.getHeaders()
      });

      const memeTokens: MemeToken[] = detailsResponse.data.map((coin: any, index: number) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        current_price: coin.current_price,
        market_cap: coin.market_cap,
        market_cap_rank: coin.market_cap_rank,
        price_change_percentage_24h: coin.price_change_percentage_24h,
        price_change_percentage_7d: coin.price_change_percentage_7d_in_currency,
        volume_24h: coin.total_volume,
        sentiment_score: this.calculateSentimentScore(coin),
        viral_score: this.calculateViralScore(coin, index)
      }));

      // Get social stats for each coin (limit to avoid rate limits)
      for (let i = 0; i < Math.min(3, memeTokens.length); i++) {
        const token = memeTokens[i];
        try {
          const socialData = await this.getSocialStats(token.id);
          token.social_stats = socialData;
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.warn(`Failed to get social stats for ${token.symbol}:`, error);
        }
      }

      console.log('✅ Successfully fetched meme tokens:', memeTokens.length);
      return memeTokens;
    } catch (error) {
      console.error('❌ Failed to fetch trending meme coins:', error);
      // Return empty array instead of throwing to prevent app crash
      return [];
    }
  }

  /**
   * Get social statistics for a specific coin
   */
  private async getSocialStats(coinId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.BASE_URL}/coins/${coinId}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: false,
          community_data: true,
          developer_data: false,
          sparkline: false
        },
        headers: this.getHeaders()
      });

      return {
        twitter_followers: response.data.community_data?.twitter_followers || 0,
        reddit_subscribers: response.data.community_data?.reddit_subscribers || 0,
        telegram_channel_user_count: response.data.community_data?.telegram_channel_user_count || 0,
      };
    } catch (error) {
      console.warn(`Failed to get social stats for ${coinId}:`, error);
      return {
        twitter_followers: 0,
        reddit_subscribers: 0,
        telegram_channel_user_count: 0,
      };
    }
  }

  /**
   * Calculate sentiment score based on price action and volume
   */
  private calculateSentimentScore(coin: any): number {
    const priceChange24h = coin.price_change_percentage_24h || 0;
    const priceChange7d = coin.price_change_percentage_7d_in_currency || 0;
    const volume = coin.total_volume || 0;
    const marketCap = coin.market_cap || 0;
    
    // Volume to market cap ratio (higher = more interest)
    const volumeRatio = marketCap > 0 ? volume / marketCap : 0;
    
    // Price momentum score
    const momentumScore = (priceChange24h * 0.7) + (priceChange7d * 0.3);
    
    // Volume activity score (0-50 points)
    const volumeScore = Math.min(volumeRatio * 1000, 50);
    
    // Final sentiment score (0-100)
    const sentimentScore = Math.max(0, Math.min(100, 50 + momentumScore + volumeScore));
    
    return Math.round(sentimentScore);
  }

  /**
   * Calculate viral score based on trending position and social metrics
   */
  private calculateViralScore(coin: any, trendingIndex: number): number {
    // Base score from trending position (90-40 points)
    const trendingScore = 90 - (trendingIndex * 5);
    
    // Volume bonus (0-10 points)
    const volume = coin.total_volume || 0;
    const volumeBonus = Math.min(volume / 1000000, 10); // $1M volume = 1 point
    
    return Math.max(40, Math.min(100, trendingScore + volumeBonus));
  }

  /**
   * Get sBTC specific sentiment data
   */
  async getSBTCSentiment(): Promise<SocialSentimentData> {
    try {
      console.log('🔄 Fetching sBTC sentiment data...');
      
      // For now, we'll use Bitcoin data as proxy for sBTC sentiment
      const response = await axios.get(`${this.BASE_URL}/coins/bitcoin`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: true,
          developer_data: false,
          sparkline: false
        },
        headers: this.getHeaders()
      });

      const data = response.data;
      const priceChange24h = data.market_data?.price_change_percentage_24h || 0;
      const volume24h = data.market_data?.total_volume?.usd || 0;
      const socialScore = this.calculateSocialScore(data.community_data);

      const sentiment: 'bullish' | 'bearish' | 'neutral' = 
        priceChange24h > 2 ? 'bullish' : 
        priceChange24h < -2 ? 'bearish' : 'neutral';

      const result = {
        token: 'sBTC',
        sentiment,
        score: this.calculateSentimentScore(data.market_data),
        volume: volume24h,
        social_mentions: socialScore,
        price_momentum: priceChange24h
      };

      console.log('✅ sBTC sentiment data:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to fetch sBTC sentiment:', error);
      return {
        token: 'sBTC',
        sentiment: 'neutral',
        score: 50,
        volume: 0,
        social_mentions: 0,
        price_momentum: 0
      };
    }
  }

  /**
   * Calculate social engagement score
   */
  private calculateSocialScore(communityData: any): number {
    if (!communityData) return 0;
    
    const twitter = communityData.twitter_followers || 0;
    const reddit = communityData.reddit_subscribers || 0;
    const telegram = communityData.telegram_channel_user_count || 0;
    
    // Weighted social score
    const socialScore = (twitter * 0.5) + (reddit * 0.3) + (telegram * 0.2);
    
    // Normalize to 0-100 scale
    return Math.min(100, socialScore / 10000);
  }

  /**
   * Get meme pools data based on trending tokens
   */
  async getMemeBasedPools(): Promise<any[]> {
    try {
      console.log('🔄 Creating meme-based pools...');
      
      const trendingMemes = await this.getTrendingMemeCoins();
      const pools = [];

      for (let i = 0; i < Math.min(5, trendingMemes.length); i++) {
        const meme = trendingMemes[i];
        const sentiment = meme.price_change_percentage_24h > 5 ? 'bullish' : 
                         meme.price_change_percentage_24h < -5 ? 'bearish' : 'volatile';
        
        pools.push({
          id: `meme-${meme.id}`,
          meme: `${this.getMemeEmoji(sentiment)} ${meme.name} ${sentiment === 'bullish' ? '🚀' : sentiment === 'bearish' ? '📉' : '🔥'}`,
          description: `${meme.symbol} trending #${i + 1}. 24h: ${meme.price_change_percentage_24h?.toFixed(2)}%. Vol: $${(meme.volume_24h / 1000000).toFixed(1)}M`,
          image: '/assets/Graphics/01.png',
          totalPool: 15000 + (i * 3000),
          participants: 50 + (i * 15),
          timeLeft: `${20 + i * 3} days`,
          sentiment,
          viralScore: meme.viral_score,
          creator: 'MemeHunter',
          minimumEntry: 5,
          expectedReturn: sentiment === 'bullish' ? '100-500%' : sentiment === 'volatile' ? '50-200%' : '20-100%',
          riskLevel: 'High' as const,
          tokens: [meme.symbol, 'STX'],
          contractId: `meme-${meme.id}`,
          coinGeckoId: meme.id,
          marketCap: meme.market_cap,
          currentPrice: meme.current_price,
          socialStats: meme.social_stats
        });
      }

      console.log('✅ Created meme pools:', pools.length);
      return pools;
    } catch (error) {
      console.error('❌ Failed to create meme-based pools:', error);
      return [];
    }
  }

  private getMemeEmoji(sentiment: string): string {
    switch (sentiment) {
      case 'bullish': return '🐂';
      case 'bearish': return '🐻';
      case 'volatile': return '⚡';
      default: return '🎯';
    }
  }
}

export const memeDataService = new MemeDataService();