/**
 * Ecosystem Whale Tracking Service
 * Tracks whales across Stacks ecosystem using blockchain data and AI analysis
 */

import mongoClient from '../lib/mongoClient';
import { priceService } from './priceService';

// Stacks API configuration (routed through our dev proxy)
const STACKS_API_URL = '/api/stacks';

// Types
export interface WhaleProfile {
  _id?: string;
  address: string;
  alias: string | null;
  category: 'defi' | 'validator' | 'nft' | 'dao' | 'trader' | 'infrastructure';
  verified: boolean;
  source: 'curated' | 'ai_discovered' | 'alex_leaderboard' | 'manual';
  
  portfolio: {
    stxBalance: number;
    stxLocked: number;
    totalValueUSD: number;
    tokens: Array<{ symbol: string; amount: number; value?: number }>;
  };
  
  activity: {
    protocols: string[];
    txCount30d: number;
    volume30dSTX: number;
    lastActiveAt: string;
    activityLevel: 'high' | 'medium' | 'low';
  };
  
  // New fields from whale-indexer
  scores?: {
    composite: number;
    balance: number;
    activity: number;
    diversity: number;
  };
  
  stats?: {
    txCount30d: number;
    txCount90d: number;
    volume30dSTX: number;
    protocolsUsed: string[];
    lastActiveAt: string;
    activityLevel: 'high' | 'medium' | 'low';
  };
  
  recentTransactions?: StacksTransaction[];
  
  ai?: {
    confidence: number;
    reasoning: string;
    lastAnalyzed: string;
  };
  
  createdAt?: string;
  updatedAt?: string;
}

export interface StacksTransaction {
  tx_id: string;
  tx_type: string;
  sender_address: string;
  fee_rate: string;
  block_height: number;
  burn_block_time: number;
  tx_status: string;
  contract_call?: {
    contract_id: string;
    function_name: string;
  };
}

export interface AddressBalance {
  stx: {
    balance: string;
    locked: string;
  };
  fungible_tokens: Record<string, { balance: string }>;
}

// Token contract mapping for price service
const TOKEN_MAPPING: Record<string, string> = {
  'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.age000-governance-token::alex': 'ALEX',
  'SP3NE50G7MKSLRQD5SBDGRMTKC7JS8E3J0M9543A9.welshcorgicoin-token::welsh': 'WELSH',
  'SM3VDXK3WZZS1A27S09M26S07H6N8HDBM0X047G9.sbtc-token::sbtc': 'SBTC',
};

const TOKEN_DECIMALS: Record<string, number> = {
  'ALEX': 8,
  'WELSH': 6,
  'SBTC': 8,
  'STX': 6,
};

// Known protocol contracts on mainnet
const PROTOCOL_CONTRACTS: Record<string, string> = {
  'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9': 'Alex',
  'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR': 'Arkadiko',
  'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1': 'Velar',
  'SP1Z92MPDQEWZXW36VX71Q25HKF5K2EPCJ304F275': 'StackSwap',
  'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9': 'Gamma',
};

// Curated whale list (initial seed data)
const CURATED_WHALES: Partial<WhaleProfile>[] = [
  {
    address: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
    alias: 'Stacks DeFi Whale',
    category: 'defi',
    source: 'curated',
  },
  {
    address: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
    alias: 'Arkadiko Protocol',
    category: 'infrastructure',
    source: 'curated',
  },
  {
    address: 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9',
    alias: 'Alex DEX',
    category: 'infrastructure',
    source: 'curated',
  },
];

// Cache for rate limiting
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class EcosystemWhaleService {
  private lastApiCall = 0;
  private readonly MIN_API_INTERVAL = 200; // 200ms between calls

  /**
   * Get cached data or null if expired
   */
  private getCached<T>(key: string): T | null {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as T;
    }
    return null;
  }

  /**
   * Set cache data
   */
  private setCache(key: string, data: unknown): void {
    cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Rate-limited API call
   */
  private async rateLimitedFetch(url: string): Promise<Response> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastApiCall;
    
    if (timeSinceLastCall < this.MIN_API_INTERVAL) {
      await new Promise(r => setTimeout(r, this.MIN_API_INTERVAL - timeSinceLastCall));
    }
    
    this.lastApiCall = Date.now();
    return fetch(url);
  }

  /**
   * Fetch address balance from Stacks API
   */
  async fetchAddressBalance(address: string): Promise<AddressBalance | null> {
    const cacheKey = `balance:${address}`;
    const cached = this.getCached<AddressBalance>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.rateLimitedFetch(
        `${STACKS_API_URL}/extended/v1/address/${address}/balances`
      );
      
      if (!response.ok) {
        console.error(`[WhaleService] Balance fetch failed for ${address}: ${response.status}`);
        return null;
      }
      
      const data = await response.json();
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`[WhaleService] Error fetching balance for ${address}:`, error);
      return null;
    }
  }

  /**
   * Fetch recent transactions for an address
   */
  async fetchAddressTransactions(address: string, limit = 50): Promise<StacksTransaction[]> {
    const cacheKey = `txs:${address}:${limit}`;
    const cached = this.getCached<StacksTransaction[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.rateLimitedFetch(
        `${STACKS_API_URL}/extended/v1/address/${address}/transactions?limit=${limit}`
      );
      
      if (!response.ok) {
        console.error(`[WhaleService] Transaction fetch failed for ${address}: ${response.status}`);
        return [];
      }
      
      const data = await response.json();
      this.setCache(cacheKey, data.results || []);
      return data.results || [];
    } catch (error) {
      console.error(`[WhaleService] Error fetching transactions for ${address}:`, error);
      return [];
    }
  }

  /**
   * Identify protocols from transactions
   */
  identifyProtocols(transactions: StacksTransaction[]): string[] {
    const protocols = new Set<string>();
    
    transactions.forEach(tx => {
      if (tx.tx_type === 'contract_call' && tx.contract_call?.contract_id) {
        const [contractAddress] = tx.contract_call.contract_id.split('.');
        const protocol = PROTOCOL_CONTRACTS[contractAddress];
        if (protocol) {
          protocols.add(protocol);
        }
      }
    });
    
    return Array.from(protocols);
  }

  /**
   * Calculate activity level based on transaction count
   */
  calculateActivityLevel(txCount: number): 'high' | 'medium' | 'low' {
    if (txCount >= 50) return 'high';
    if (txCount >= 20) return 'medium';
    return 'low';
  }

  /**
   * Build complete whale profile from blockchain data
   */
  async buildWhaleProfile(address: string, baseData?: Partial<WhaleProfile>): Promise<WhaleProfile | null> {
    console.log(`[WhaleService] Building profile for ${address}...`);
    
    // Fetch balance, transactions, and STX price in parallel
    const [balance, transactions, stxPrice] = await Promise.all([
      this.fetchAddressBalance(address),
      this.fetchAddressTransactions(address, 50),
      priceService.getCurrentPrice('STX')
    ]);
    
    if (!balance) {
      console.warn(`[WhaleService] Could not fetch balance for ${address}`);
      return null;
    }
    
    // Parse balance
    const stxBalance = parseInt(balance.stx.balance) / 1_000_000;
    const stxLocked = parseInt(balance.stx.locked) / 1_000_000;
    
    // Identify protocols
    const protocols = this.identifyProtocols(transactions);
    
    // Calculate activity metrics
    const txCount = transactions.length;
    const volume30d = transactions.reduce((sum, tx) => {
      return sum + parseInt(tx.fee_rate) / 1_000_000;
    }, 0);
    
    const lastTx = transactions[0];
    const lastActiveAt = lastTx 
      ? new Date(lastTx.burn_block_time * 1000).toISOString()
      : new Date().toISOString();
    
    // Parse token balances
    const tokens = await this.parseTokenBalances(balance.fungible_tokens);

    // Calculate total portfolio value in USD (STX + Tokens)
    const stxValueUSD = (stxBalance + stxLocked) * stxPrice;
    const tokensValueUSD = tokens.reduce((sum, t) => sum + (t.value || 0), 0);
    const totalValueUSD = stxValueUSD + tokensValueUSD;
    
    // Build profile
    const profile: WhaleProfile = {
      address,
      alias: baseData?.alias || this.generateAlias(address),
      category: baseData?.category || this.inferCategory(protocols, stxBalance),
      verified: baseData?.verified || false,
      source: baseData?.source || 'ai_discovered',
      
      portfolio: {
        stxBalance,
        stxLocked,
        totalValueUSD,
        tokens,
      },
      
      activity: {
        protocols,
        txCount30d: txCount,
        volume30dSTX: volume30d,
        lastActiveAt,
        activityLevel: this.calculateActivityLevel(txCount),
      },
      
      recentTransactions: transactions.slice(0, 5),
      
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return profile;
  }

  /**
   * Parse token balances and fetch their values
   */
  private async parseTokenBalances(tokenData: Record<string, { balance: string }>): Promise<Array<{ symbol: string; amount: number; value?: number }>> {
    const results = await Promise.all(Object.entries(tokenData).map(async ([tokenId, data]) => {
      // Extract symbol
      const symbol = tokenId.split('::')[1] || tokenId.split('.')[1] || 'Unknown';
      
      // Get price and decimals if we track it
      const assetType = TOKEN_MAPPING[tokenId] as any;
      const decimals = assetType ? (TOKEN_DECIMALS[assetType] || 6) : 6;
      
      // Calculate amount
      const amount = parseInt(data.balance) / Math.pow(10, decimals);
      
      if (amount <= 0) return null;

      let value = 0;
      if (assetType) {
        const price = await priceService.getCurrentPrice(assetType);
        value = amount * price;
      }

      return { symbol, amount, value };
    }));

    return results.filter((t): t is { symbol: string; amount: number; value: number } => t !== null);
  }

  /**
   * Generate alias from address
   */
  private generateAlias(address: string): string {
    const prefix = address.substring(0, 6);
    const suffix = address.substring(address.length - 4);
    return `Whale_${prefix}...${suffix}`;
  }

  /**
   * Infer category from activity
   */
  private inferCategory(protocols: string[], balance: number): WhaleProfile['category'] {
    if (protocols.includes('Alex') || protocols.includes('Arkadiko')) return 'defi';
    if (protocols.includes('Gamma')) return 'nft';
    if (balance > 1_000_000) return 'trader';
    return 'trader';
  }

  /**
   * Get all whales from MongoDB (indexed by whale-indexer service)
   */
  async getWhales(limit = 20): Promise<WhaleProfile[]> {
    // Use indexed whales from MongoDB (populated by whale-indexer service)
    return this.getIndexedWhales(limit);
  }

  /**
   * Get curated whales with live blockchain data
   */
  async getCuratedWhales(): Promise<WhaleProfile[]> {
    const profiles: WhaleProfile[] = [];
    
    for (const whale of CURATED_WHALES) {
      if (whale.address) {
        const profile = await this.buildWhaleProfile(whale.address, whale);
        if (profile) {
          profiles.push(profile);
        }
      }
    }
    
    return profiles.sort((a, b) => b.portfolio.stxBalance - a.portfolio.stxBalance);
  }

  /**
   * Get whales by category
   */
  async getWhalesByCategory(category: string): Promise<WhaleProfile[]> {
    return this.getIndexedWhales(20, { category });
  }

  /**
   * Get whales by protocol
   */
  async getWhalesByProtocol(protocol: string): Promise<WhaleProfile[]> {
    return this.getIndexedWhales(20, { protocol });
  }

  /**
   * Get indexed whales from MongoDB (populated by whale-indexer service)
   */
  async getIndexedWhales(limit = 20, filters?: {
    category?: string;
    protocol?: string;
    minScore?: number;
  }): Promise<WhaleProfile[]> {
    if (!mongoClient.isConfigured) {
      console.warn('[WhaleService] MongoDB not configured - returning curated whales');
      return this.getCuratedWhales();
    }
    
    try {
      // Build filter query
      const query: Record<string, unknown> = {};
      
      if (filters?.category) {
        query.category = filters.category;
      }
      
      if (filters?.protocol) {
        query['stats.protocolsUsed'] = filters.protocol;
      }
      
      if (filters?.minScore) {
        query['scores.composite'] = { $gte: filters.minScore };
      }
      
      const whales = await mongoClient.find('whales', query, {
        sort: { 'scores.composite': -1 },
        limit,
      });
      
      if (whales.length > 0) {
        console.log(`[WhaleService] ✓ Retrieved ${whales.length} indexed whales from MongoDB`);
        return whales as WhaleProfile[];
      }
      
      // Fallback to curated if no indexed whales found
      console.warn('[WhaleService] No indexed whales found, using curated list');
      return this.getCuratedWhales();
    } catch (error) {
      console.error('[WhaleService] Error fetching indexed whales:', error);
      return this.getCuratedWhales();
    }
  }

  /**
   * Calculate composite whale score
   */
  calculateCompositeScore(whale: Partial<WhaleProfile>): number {
    const stxBalance = whale.portfolio?.stxBalance || 0;
    const txCount = whale.activity?.txCount30d || whale.stats?.txCount30d || 0;
    const protocols = whale.activity?.protocols || whale.stats?.protocolsUsed || [];
    
    // Balance score (0-100 based on size)
    const balanceScore = Math.min(100, (stxBalance / 1000000) * 10);
    
    // Activity score (0-100 based on transaction count)
    const activityScore = Math.min(100, txCount * 2);
    
    // Diversity score (0-100 based on protocols used)
    const diversityScore = Math.min(100, protocols.length * 20);
    
    // Weighted composite
    return Math.round(
      balanceScore * 0.50 +
      activityScore * 0.30 +
      diversityScore * 0.20
    );
  }

  /**
   * Get finality status of a transaction based on block heights
   */
  getFinalityStatus(
    _stacksBlockHeight: number,
    bitcoinBlockHeight?: number
  ): 'mempool' | 'microblock' | 'bitcoin-anchored' | 'bitcoin-final' {
    if (!bitcoinBlockHeight) {
      return 'microblock';
    }
    
    // Get current Bitcoin block (approximate)
    // In production, this should query a Bitcoin node
    const currentBtcBlock = 931428; // Approximate current block
    const confirmations = currentBtcBlock - bitcoinBlockHeight;
    
    if (confirmations >= 6) {
      return 'bitcoin-final';
    } else if (confirmations >= 1) {
      return 'bitcoin-anchored';
    }
    
    return 'microblock';
  }

  /**
   * Refresh whale data (call periodically)
   * NOTE: This is now handled by the whale-indexer service
   * Keeping for backward compatibility but delegating to indexer
   */
  async refreshWhaleData(): Promise<void> {
    console.log('[WhaleService] Whale data refresh is now handled by whale-indexer service');
    console.log('[WhaleService] To manually refresh, restart the whale-indexer service');
    
    // The whale-indexer service handles automatic discovery and updates
    // This method is kept for backward compatibility but does nothing
  }
}

// Export singleton
export const ecosystemWhaleService = new EcosystemWhaleService();
export default ecosystemWhaleService;
