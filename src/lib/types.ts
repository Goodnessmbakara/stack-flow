export type TSentiment = "bull" | "bear" | "high" | "low";

// Add new types for copy trading
export interface TraderProfile {
  id: string;
  address: string;
  displayName: string;
  avatar?: string;
  totalReturn: number;
  winRate: number;
  followers: number;
  totalTrades: number;
  riskScore: 'Low' | 'Medium' | 'High';
  recentTrades: Trade[];
  verified: boolean;
  assets: string[];
}

export interface Trade {
  id: string;
  asset: string;
  action: 'BUY' | 'SELL' | 'TRANSFER' | 'CONTRACT_CALL';
  amount: number;
  price: number;
  timestamp: Date;
  pnl?: number;
  status: 'OPEN' | 'CLOSED' | 'PENDING' | 'FAILED';
  txHash?: string;
}

export interface CopyTradeSettings {
  traderId: string;
  copyPercentage: number;
  maxAmountPerTrade: number;
  stopLoss?: number;
  takeProfit?: number;
  assetFilters: string[];
  isActive: boolean;
}

// Add MemePool type for meme investing
export interface MemePool {
  id: string;
  meme: string;
  description: string;
  image?: string;
  totalPool: number;
  participants: number;
  timeLeft: string;
  sentiment: 'bullish' | 'bearish' | 'volatile' | string;
  viralScore: number;
  creator: string;
  minimumEntry: number;
  expectedReturn: string;
  riskLevel: 'Low' | 'Medium' | 'High' | string;
  tokens?: string[];
  contractId?: string;
  // New real pool data fields
  volume24h?: number;
  trades24h?: number;
  priceChange24h?: number;
  verified?: boolean;
  isHot?: boolean;
}

// Fix TokenType to match the actual usage in the app
export type TokenType = "STX" | "BTC" | "ETH";

// TokenData defines the structure of token information
export type TokenData = {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
};
