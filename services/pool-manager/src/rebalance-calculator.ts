// rebalance-calculator.ts
// Week 3 Day 13-14: Calculates optimal swaps for rebalancing

import { logger } from './logger.js';
import { Allocation } from './pool-analyzer.js';

export interface SwapInstruction {
  from: string;
  to: string;
  amountUSD: number;
  amountFrom: number;
  minOut: number;
  estimatedSlippage: number;
  dex: 'ALEX' | 'VELAR';
}

export class RebalanceCalculator {
  /**
   * Calculate optimal swaps to reach target allocation
   */
  calculateOptimalSwaps(
    current: Allocation,
    target: Allocation,
    poolTVL: number
  ): SwapInstruction[] {
    const swaps: SwapInstruction[] = [];
    
    logger.info('[RebalanceCalculator] Calculating optimal swaps');
    logger.info(`[RebalanceCalculator] Current: ${JSON.stringify(current)}`);
    logger.info(`[RebalanceCalculator] Target: ${JSON.stringify(target)}`);

    // Get all unique assets
    const allAssets = new Set([...Object.keys(current), ...Object.keys(target)]);

    for (const asset of allAssets) {
      const currentPct = current[asset] || 0;
      const targetPct = target[asset] || 0;
      const delta = targetPct - currentPct;
      
      // Ignore tiny differences (<1%)
      if (Math.abs(delta) < 0.01) continue;

      const amountUSD = poolTVL * Math.abs(delta);

      if (delta > 0) {
        // Need to BUY this asset (sell STX)
        swaps.push({
          from: 'STX',
          to: asset,
          amountUSD,
          amountFrom: this.convertUSDToAsset(amountUSD, 'STX'),
          minOut: this.convertUSDToAsset(amountUSD * 0.98, asset), // 2% slippage tolerance
          estimatedSlippage: this.estimateSlippage(asset, amountUSD),
          dex: this.selectBestDEX(asset, amountUSD)
        });
      } else {
        // Need to SELL this asset (buy STX)
        swaps.push({
          from: asset,
          to: 'STX',
          amountUSD,
          amountFrom: this.convertUSDToAsset(amountUSD, asset),
          minOut: this.convertUSDToAsset(amountUSD * 0.98, 'STX'), // 2% slippage tolerance
          estimatedSlippage: this.estimateSlippage(asset, amountUSD),
          dex: this.selectBestDEX(asset, amountUSD)
        });
      }
    }

    // Optimize swap order (largest first for better liquidity)
    const optimizedSwaps = this.optimizeSwapOrder(swaps);

    logger.info(`[RebalanceCalculator] Calculated ${optimizedSwaps.length} swaps`);
    return optimizedSwaps;
  }

  /**
   * Convert USD value to asset amount
   */
  private convertUSDToAsset(usdAmount: number, asset: string): number {
    // Mock prices - in production, fetch from price oracle
    const prices: { [key: string]: number } = {
      'STX': 1.00, // $1 per STX
      'ALEX': 0.65, // $0.65 per ALEX
      'WELSH': 0.0001, // $0.0001 per WELSH
      'DIKO': 0.50
    };

    const price = prices[asset] || 1.0;
    return usdAmount / price;
  }

  /**
   * Estimate slippage for a swap
   */
  private estimateSlippage(asset: string, amountUSD: number): number {
    // Mock slippage estimation - in production, query DEX
    // Slippage increases with trade size
    const baseSlippage = 0.005; // 0.5% base
    const volumeMultiplier = Math.min(amountUSD / 10000, 2); // Caps at 2x for $10k+
    
    return baseSlippage * (1 + volumeMultiplier);
  }

  /**
   * Select best DEX for a given asset and amount
   */
  private selectBestDEX(asset: string, amountUSD: number): 'ALEX' | 'VELAR' {
    // Mock DEX selection - in production, compare quotes
    // ALEX has better liquidity for larger trades
    if (amountUSD > 5000) {
      return 'ALEX';
    }
    
    // Velar might be better for smaller trades or certain assets
    return Math.random() > 0.5 ? 'ALEX' : 'VELAR';
  }

  /**
   * Optimize swap order to minimize total slippage
   */
  private optimizeSwapOrder(swaps: SwapInstruction[]): SwapInstruction[] {
    // Execute largest swaps first (better liquidity)
    return swaps.sort((a, b) => b.amountUSD - a.amountUSD);
  }

  /**
   * Validate swaps are safe to execute
   */
  validateSwaps(swaps: SwapInstruction[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const swap of swaps) {
      // Check slippage is acceptable
      if (swap.estimatedSlippage > 0.03) { // >3%
        errors.push(`Excessive slippage for ${swap.from} → ${swap.to}: ${(swap.estimatedSlippage * 100).toFixed(2)}%`);
      }

      // Check amounts are reasonable
      if (swap.amountUSD < 10) {
        errors.push(`Swap amount too small: $${swap.amountUSD}`);
      }

      // Check min-out makes sense
      if (swap.minOut <= 0) {
        errors.push(`Invalid min-out for ${swap.from} → ${swap.to}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
