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
  action: 'BUY' | 'SELL';
  amount: number;
  price: number;
  timestamp: Date;
  pnl?: number;
  status: 'OPEN' | 'CLOSED' | 'PENDING';
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
