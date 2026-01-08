// pool-analyzer.ts
// Week 3 Day 11-12: Analyzes whale portfolios and calculates target allocations

import { MongoClient, Db } from 'mongodb';
import { logger } from './logger.js';

export interface WhalePortfolio {
  address: string;
  alias?: string;
  allocation: {
    [asset: string]: number; // Percentage (0-1)
  };
  totalValueUSD: number;
  lastUpdated: Date;
}

export interface PoolConfig {
  poolId: string;
  name: string;
  followedWhales: string[]; // Whale addresses
  whaleWeights: { [address: string]: number }; // Weight 0-1
  rebalanceThreshold: number; // 0.10 = 10% drift triggers rebalance
  contractAddress: string;
}

export interface Allocation {
  [asset: string]: number; // Percentage 0-1
}

export interface AnalysisResult {
  poolId: string;
  driftPercentage: number;
  needsRebalance: boolean;
  targetAllocation: Allocation;
  currentAllocation: Allocation;
  poolTVL: number;
  estimatedCost: {
    gasCostSTX: number;
    slippageCostSTX: number;
    totalCostPercent: number;
  };
  timestamp: Date;
}

export class PoolAnalyzer {
  private db: Db;
  private mongoClient: MongoClient;

  constructor(mongoUri: string, dbName: string) {
    this.mongoClient = new MongoClient(mongoUri);
    this.db = this.mongoClient.db(dbName);
  }

  async connect() {
    await this.mongoClient.connect();
    logger.info('[PoolAnalyzer] Connected to MongoDB');
  }

  async disconnect() {
    await this.mongoClient.close();
    logger.info('[PoolAnalyzer] Disconnected from MongoDB');
  }

  /**
   * Analyze a pool's drift from target allocation
   */
  async analyzePool(config: PoolConfig): Promise<AnalysisResult> {
    logger.info(`[PoolAnalyzer] Analyzing pool ${config.poolId}: ${config.name}`);

    // 1. Fetch whale portfolios from MongoDB
    const whalePortfolios = await this.fetchWhalePortfolios(config.followedWhales);

    // 2. Calculate weighted average target allocation
    const targetAllocation = this.calculateWeightedAverage(
      whalePortfolios,
      config.whaleWeights
    );

    // 3. Get current pool holdings from blockchain
    const currentAllocation = await this.getPoolHoldings(config.contractAddress);

    // 4. Get pool TVL
    const poolTVL = await this.getPoolTVL(config.contractAddress);

    // 5. Calculate drift
    const drift = this.calculateDrift(currentAllocation, targetAllocation);

    // 6. Estimate rebalancing cost
    const estimatedCost = await this.estimateRebalancingCost(
      currentAllocation,
      targetAllocation,
      poolTVL
    );

    const result: AnalysisResult = {
      poolId: config.poolId,
      driftPercentage: drift,
      needsRebalance: drift > config.rebalanceThreshold,
      targetAllocation,
      currentAllocation,
      poolTVL,
      estimatedCost,
      timestamp: new Date()
    };

    logger.info(`[PoolAnalyzer] Pool ${config.poolId} drift: ${(drift * 100).toFixed(2)}%`);
    logger.info(`[PoolAnalyzer] Needs rebalance: ${result.needsRebalance}`);

    return result;
  }

  /**
   * Fetch whale portfolios from MongoDB
   */
  private async fetchWhalePortfolios(whaleAddresses: string[]): Promise<WhalePortfolio[]> {
    const collection = this.db.collection('whaleProfiles');
    
    const whales = await collection
      .find({ address: { $in: whaleAddresses } })
      .toArray();

    return whales.map(whale => ({
      address: whale.address,
      alias: whale.alias,
      allocation: this.parseTokenBalances(whale.tokenBalances),
      totalValueUSD: whale.totalValueUSD || 0,
      lastUpdated: whale.lastUpdated || new Date()
    }));
  }

  /**
   * Parse token balances into allocation percentages
   */
  private parseTokenBalances(tokenBalances: any): Allocation {
    if (!tokenBalances || typeof tokenBalances !== 'object') {
      return { STX: 1.0 }; // Default to 100% STX
    }

    const allocation: Allocation = {};
    let totalValue = 0;

    // Calculate total value
    for (const [asset, balance] of Object.entries(tokenBalances)) {
      if (typeof balance === 'number') {
        totalValue += balance;
      }
    }

    // Convert to percentages
    if (totalValue > 0) {
      for (const [asset, balance] of Object.entries(tokenBalances)) {
        if (typeof balance === 'number') {
          allocation[asset] = balance / totalValue;
        }
      }
    } else {
      allocation['STX'] = 1.0;
    }

    return allocation;
  }

  /**
   * Calculate weighted average allocation across multiple whales
   */
  private calculateWeightedAverage(
    portfolios: WhalePortfolio[],
    weights: { [address: string]: number }
  ): Allocation {
    const result: Allocation = {};

    for (const portfolio of portfolios) {
      const weight = weights[portfolio.address] || 0;

      for (const [asset, percentage] of Object.entries(portfolio.allocation)) {
        result[asset] = (result[asset] || 0) + (percentage * weight);
      }
    }

    // Normalize to sum to 1.0
    const total = Object.values(result).reduce((sum, val) => sum + val, 0);
    if (total > 0) {
      for (const asset of Object.keys(result)) {
        result[asset] = result[asset] / total;
      }
    }

    return result;
  }

  /**
   * Get current pool holdings from blockchain
   * TODO: Integrate with Stacks API to read contract state
   */
  private async getPoolHoldings(contractAddress: string): Promise<Allocation> {
    // Placeholder - in production, call Stacks API
    // const response = await fetch(`https://api.mainnet.hiro.so/v2/contracts/call-read/${contractAddress}/whale-pool-vault/get-pool-allocation`);
    
    // For now, return mock data
    return {
      STX: 0.70,
      ALEX: 0.20,
      WELSH: 0.10
    };
  }

  /**
   * Get pool total value locked
   * TODO: Integrate with Stacks API
   */
  private async getPoolTVL(contractAddress: string): Promise<number> {
    // Placeholder - in production, read from contract
    return 100000; // $100k TVL
  }

  /**
   * Calculate drift between current and target allocations
   */
  private calculateDrift(current: Allocation, target: Allocation): number {
    let totalDrift = 0;
    const allAssets = new Set([...Object.keys(current), ...Object.keys(target)]);

    for (const asset of allAssets) {
      const currentPct = current[asset] || 0;
      const targetPct = target[asset] || 0;
      totalDrift += Math.abs(targetPct - currentPct);
    }

    // Divide by 2 to avoid double-counting (moving from A to B counts as drift in both)
    return totalDrift / 2;
  }

  /**
   * Estimate cost of rebalancing operation
   */
  private async estimateRebalancingCost(
    current: Allocation,
    target: Allocation,
    poolTVL: number
  ): Promise<{ gasCostSTX: number; slippageCostSTX: number; totalCostPercent: number }> {
    // Calculate how many swaps needed
    let numSwaps = 0;
    for (const asset of Object.keys(target)) {
      const delta = Math.abs((target[asset] || 0) - (current[asset] || 0));
      if (delta > 0.01) numSwaps++; // Count swaps for >1% difference
    }

    // Gas cost: ~30k microSTX per swap = 0.03 STX
    const gasCostSTX = numSwaps * 0.03;

    // Slippage estimate: 1% of rebalanced amount
    const totalRebalancedAmount = poolTVL * (this.calculateDrift(current, target));
    const slippageCostSTX = totalRebalancedAmount * 0.01;

    const totalCostSTX = gasCostSTX + slippageCostSTX;
    const totalCostPercent = (totalCostSTX / poolTVL) * 100;

    return {
      gasCostSTX,
      slippageCostSTX,
      totalCostPercent
    };
  }

  /**
   * Get pools that need rebalancing
   */
  async getPoolsNeedingRebalance(configs: PoolConfig[]): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];

    for (const config of configs) {
      const analysis = await this.analyzePool(config);
      if (analysis.needsRebalance) {
        results.push(analysis);
      }
    }

    logger.info(`[PoolAnalyzer] ${results.length}/${configs.length} pools need rebalancing`);
    return results;
  }
}
