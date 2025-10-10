import { twitterSentimentService, type WhaleTrader } from './twitterSentimentService';
import { memeDataService } from './memeDataService';

export interface CopyTradeSignal {
  id: string;
  trader_address: string;
  trader_name: string;
  signal_type: 'entry' | 'exit' | 'rebalance';
  asset: string;
  action: 'buy' | 'sell' | 'hold';
  confidence: number;
  sentiment_based: boolean;
  amount_suggested: number;
  reasoning: string;
  timestamp: string;
  expires_at: string;
}

export interface CopyTradingStats {
  total_followers: number;
  active_signals: number;
  success_rate_24h: number;
  total_volume_copied: number;
  top_performers: WhaleTrader[];
}

class CopyTradingService {
  /**
   * Get real-time copy trading signals based on sentiment
   */
  async getSentimentBasedSignals(): Promise<CopyTradeSignal[]> {
    try {
      const [whales, twitterSentiment, memeData] = await Promise.all([
        twitterSentimentService.getTopWhaleTraders(),
        twitterSentimentService.getSBTCTwitterSentiment(),
        memeDataService.getSBTCSentiment()
      ]);

      const signals: CopyTradeSignal[] = [];

      // Generate signals based on sentiment changes
      for (const whale of whales.slice(0, 3)) {
        if (whale.sentiment_alignment > 80 && twitterSentiment.sentiment === 'bullish') {
          signals.push({
            id: `signal-${whale.address.slice(-8)}-${Date.now()}`,
            trader_address: whale.address,
            trader_name: whale.name,
            signal_type: 'entry',
            asset: 'sBTC',
            action: 'buy',
            confidence: Math.min(95, whale.sentiment_alignment),
            sentiment_based: true,
            amount_suggested: this.calculateSuggestedAmount(whale.trade_style),
            reasoning: `High sentiment alignment (${whale.sentiment_alignment}%) with bullish Twitter sentiment. Win rate: ${whale.win_rate}%`,
            timestamp: new Date().toISOString(),
            expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours
          });
        }

        // Add meme-based signals
        if (whale.trade_style === 'aggressive' && memeData.sentiment === 'bullish') {
          signals.push({
            id: `meme-signal-${whale.address.slice(-8)}-${Date.now()}`,
            trader_address: whale.address,
            trader_name: whale.name,
            signal_type: 'entry',
            asset: 'MEME_POOL',
            action: 'buy',
            confidence: 75,
            sentiment_based: true,
            amount_suggested: this.calculateSuggestedAmount('aggressive') * 0.5, // Lower amount for memes
            reasoning: `Aggressive trader entering meme positions. Sentiment score: ${memeData.score}/100`,
            timestamp: new Date().toISOString(),
            expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours for memes
          });
        }
      }

      return signals;
    } catch (error) {
      console.error('Failed to generate sentiment-based signals:', error);
      return [];
    }
  }

  /**
   * Get copy trading statistics
   */
  async getCopyTradingStats(): Promise<CopyTradingStats> {
    try {
      const whales = await twitterSentimentService.getTopWhaleTraders();
      const signals = await this.getSentimentBasedSignals();

      return {
        total_followers: whales.reduce((sum, whale) => sum + whale.followers, 0),
        active_signals: signals.length,
        success_rate_24h: whales.reduce((sum, whale) => sum + whale.win_rate, 0) / whales.length,
        total_volume_copied: 2450000, // Simulated total volume
        top_performers: whales.slice(0, 5)
      };
    } catch (error) {
      console.error('Failed to get copy trading stats:', error);
      return {
        total_followers: 0,
        active_signals: 0,
        success_rate_24h: 0,
        total_volume_copied: 0,
        top_performers: []
      };
    }
  }

  /**
   * Execute copy trade based on sentiment signal
   */
  async executeCopyTrade(signal: CopyTradeSignal, userAmount: number): Promise<{
    success: boolean;
    transaction_id?: string;
    error?: string;
  }> {
    try {
      console.log(`Executing copy trade:`, {
        signal: signal.id,
        trader: signal.trader_name,
        asset: signal.asset,
        action: signal.action,
        amount: userAmount
      });

      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000));

      return {
        success: true,
        transaction_id: `0x${Math.random().toString(16).substr(2, 8)}`
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to execute copy trade'
      };
    }
  }

  /**
   * Calculate suggested amount based on trader style
   */
  private calculateSuggestedAmount(tradeStyle: string): number {
    switch (tradeStyle) {
      case 'conservative': return 100; // $100 default
      case 'balanced': return 250; // $250 default  
      case 'aggressive': return 500; // $500 default
      default: return 150;
    }
  }
}

export const copyTradingService = new CopyTradingService();