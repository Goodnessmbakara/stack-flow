/**
 * Unified P&L Calculator for Options Strategies
 * Handles both projected P&L (trade page) and actual P&L (My Strategies)
 */

export interface PnLCalculationParams {
  strategy: 'CALL' | 'PUT' | 'STRAP' | 'STRIP' | 'BCSP' | 'BPSP' | 'BEPS' | 'BECS';
  currentPrice: number;
  strikePrice: number;
  amount: number;
  premium: number;
  expectedPrice?: number; // For projected P&L
}

export interface PnLResult {
  pnl: number;
  intrinsicValue: number;
  isProfitable: boolean;
  breakevenPrice: number;
}

/**
 * Calculate P&L for options strategies
 * @param params - Calculation parameters
 * @param isProjected - Whether this is a projected P&L (trade page) or actual P&L (My Strategies)
 */
export function calculatePnL(
  params: PnLCalculationParams,
  isProjected: boolean = false
): PnLResult {
  const { strategy, currentPrice, strikePrice, amount, premium, expectedPrice } = params;
  
  // Use expected price for projected P&L, current price for actual P&L
  const priceToUse = isProjected && expectedPrice ? expectedPrice : currentPrice;
  
  let intrinsicValue = 0;
  let pnl = 0;
  
  switch (strategy.toUpperCase()) {
    case 'CALL':
      // CALL: profit if price > strike price
      intrinsicValue = Math.max(0, priceToUse - strikePrice);
      pnl = (intrinsicValue * amount) - premium;
      break;
      
    case 'PUT':
      // PUT: profit if price < strike price
      intrinsicValue = Math.max(0, strikePrice - priceToUse);
      pnl = (intrinsicValue * amount) - premium;
      break;
      
    case 'STRAP':
      // STRAP: 2 calls + 1 put
      const callValue = Math.max(0, priceToUse - strikePrice);
      const putValue = Math.max(0, strikePrice - priceToUse);
      intrinsicValue = (2 * callValue) + putValue;
      pnl = (intrinsicValue * amount) - premium;
      break;
      
    case 'STRIP':
      // STRIP: 2 puts + 1 call
      const callValueStrip = Math.max(0, priceToUse - strikePrice);
      const putValueStrip = Math.max(0, strikePrice - priceToUse);
      intrinsicValue = callValueStrip + (2 * putValueStrip);
      pnl = (intrinsicValue * amount) - premium;
      break;
      
    case 'BCSP': // Bull Call Spread
      // Simplified: profit if price rises above strike
      intrinsicValue = Math.max(0, priceToUse - strikePrice);
      pnl = (intrinsicValue * amount) - premium;
      break;
      
    case 'BPSP': // Bull Put Spread
      // Simplified: profit if price stays above strike
      intrinsicValue = Math.max(0, priceToUse - strikePrice);
      pnl = (intrinsicValue * amount) - premium;
      break;
      
    case 'BEPS': // Bear Put Spread
      // Simplified: profit if price falls below strike
      intrinsicValue = Math.max(0, strikePrice - priceToUse);
      pnl = (intrinsicValue * amount) - premium;
      break;
      
    case 'BECS': // Bear Call Spread
      // Simplified: profit if price stays below strike
      intrinsicValue = Math.max(0, strikePrice - priceToUse);
      pnl = (intrinsicValue * amount) - premium;
      break;
      
    default:
      // Fallback to simple calculation
      intrinsicValue = Math.max(0, priceToUse - strikePrice);
      pnl = (intrinsicValue * amount) - premium;
  }
  
  // Calculate breakeven price
  const breakevenPrice = calculateBreakevenPrice(strategy, strikePrice, premium, amount);
  
  return {
    pnl,
    intrinsicValue,
    isProfitable: pnl > 0,
    breakevenPrice
  };
}

/**
 * Calculate breakeven price for different strategies
 */
function calculateBreakevenPrice(
  strategy: string,
  strikePrice: number,
  premium: number,
  amount: number
): number {
  const premiumPerUnit = premium / amount;
  
  switch (strategy.toUpperCase()) {
    case 'CALL':
    case 'BCSP':
    case 'BPSP':
      return strikePrice + premiumPerUnit;
      
    case 'PUT':
    case 'BEPS':
    case 'BECS':
      return strikePrice - premiumPerUnit;
      
    case 'STRAP':
      // For STRAP, breakeven is more complex, using simplified calculation
      return strikePrice + (premiumPerUnit / 2);
      
    case 'STRIP':
      // For STRIP, breakeven is more complex, using simplified calculation
      return strikePrice - (premiumPerUnit / 2);
      
    default:
      return strikePrice + premiumPerUnit;
  }
}

/**
 * Format P&L for display
 */
export function formatPnL(pnl: number): string {
  const sign = pnl >= 0 ? '+' : '';
  return `${sign}$${pnl.toFixed(2)}`;
}

/**
 * Get P&L color class for UI
 */
export function getPnLColorClass(pnl: number): string {
  if (pnl > 0) return 'text-green-400';
  if (pnl < 0) return 'text-red-400';
  return 'text-gray-400';
}
