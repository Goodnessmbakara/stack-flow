/**
 * StackFlow Profit Zone Calculator
 * 
 * Calculates break-even prices (profit zones) for various option strategies
 * Profit zone = price at which the option starts making profit
 * 
 * Formula Guide:
 * - CALL: Strike + Premium (profit above this price)
 * - STRAP: Strike + (Premium / 2) (asymmetric due to 2 calls)
 * - BULL CALL SPREAD: Lower Strike + Net Premium
 * - BULL PUT SPREAD: Upper Strike - Net Premium
 */

/**
 * Calculate profit zones for CALL options
 * 
 * Call profit zone = Strike Price + Premium per unit
 * 
 * Example:
 * - Strike: $2.50
 * - Premium: $0.07
 * → Profit Zone: $2.57 (profit when price > $2.57)
 */
function getProfitZonesForCall(
  premiums: number[],
  strikePrice: number,
  amount: number
): number[] {
  return premiums.map(premium => {
    const premiumPerUnit = premium / amount;
    return strikePrice + premiumPerUnit;
  });
}

/**
 * Calculate profit zones for PUT options
 * 
 * Put profit zone = Strike Price - Premium per unit
 */
function getProfitZonesForPut(
  premiums: number[],
  strikePrice: number,
  amount: number
): number[] {
  return premiums.map(premium => {
    const premiumPerUnit = premium / amount;
    return strikePrice - premiumPerUnit;
  });
}

/**
 * Calculate profit zones for STRAP options (2 Calls + 1 Put)
 * 
 * Strap has TWO profit zones (upside and downside)
 * For bullish focus, we return upside zone
 * 
 * Upside profit zone = Strike + (Premium / 2)
 * (Divided by 2 because of 2 calls providing 2x leverage)
 * 
 * Example:
 * - Strike: $2.50
 * - Premium: $0.14 (for 2 calls + 1 put)
 * → Upside Profit Zone: $2.57
 * → Downside Profit Zone: $2.36 (not returned here)
 */
function getProfitZonesForStrap(
  premiums: number[],
  strikePrice: number,
  amount: number
): number[] {
  return premiums.map(premium => {
    const premiumPerUnit = premium / amount;
    // Upside break-even (2x leverage from 2 calls)
    return strikePrice + (premiumPerUnit / 2);
  });
}

/**
 * Calculate profit zones for BULL CALL SPREAD
 * 
 * Bull Call Spread:
 * - Buy Call at Lower Strike (pay premium)
 * - Sell Call at Upper Strike (receive premium)
 * - Net cost: Lower Premium - Upper Premium (debit)
 * 
 * Profit zone = Lower Strike + Net Premium per unit
 * 
 * Example:
 * - Lower Strike: $2.50, Premium: $0.10
 * - Upper Strike: $2.63, Premium: $0.05
 * - Net Premium: $0.05 (debit)
 * → Profit Zone: $2.55
 * 
 * Note: We're working backwards from StrikeData format where:
 * - strikePrice = lowerStrike
 * - premium = net premium (already calculated)
 */
function getProfitZonesForBullCallSpread(
  premiums: number[],
  lowerStrike: number,
  amount: number
): number[] {
  return premiums.map(netPremium => {
    const netPremiumPerUnit = netPremium / amount;
    return lowerStrike + netPremiumPerUnit;
  });
}

/**
 * Calculate profit zones for BULL PUT SPREAD
 * 
 * Bull Put Spread:
 * - Sell Put at Upper Strike (receive premium)
 * - Buy Put at Lower Strike (pay premium)
 * - Net credit: Upper Premium - Lower Premium (credit!)
 * 
 * Profit zone = Upper Strike - Net Premium per unit
 * 
 * Example:
 * - Upper Strike: $2.63, Premium received: $0.08
 * - Lower Strike: $2.50, Premium paid: $0.03
 * - Net Premium: $0.05 (credit)
 * → Profit Zone: $2.58
 * 
 * Note: In premium calculator, premium is negative (you receive it)
 * So we use Math.abs() here
 */
function getProfitZonesForBullPutSpread(
  premiums: number[],
  upperStrike: number,
  amount: number
): number[] {
  return premiums.map(netPremium => {
    const netPremiumPerUnit = Math.abs(netPremium) / amount;
    return upperStrike - netPremiumPerUnit;
  });
}

/**
 * Calculate profit zones for STRIP options (2 Puts + 1 Call)
 * 
 * Strip has TWO profit zones (downside and upside)
 * For bearish focus, we return downside zone
 * 
 * Downside profit zone = Strike - (Premium / 2)
 * (Divided by 2 because of 2 puts providing 2x leverage)
 * 
 * Example:
 * - Strike: $2.50
 * - Premium: $0.14 (for 2 puts + 1 call)
 * → Downside Profit Zone: $2.43
 * → Upside Profit Zone: $2.64 (not returned here)
 */
function getProfitZonesForStrip(
  premiums: number[],
  strikePrice: number,
  amount: number
): number[] {
  return premiums.map(premium => {
    const premiumPerUnit = premium / amount;
    // Downside break-even (2x leverage from 2 puts)
    return strikePrice - (premiumPerUnit / 2);
  });
}

/**
 * Calculate profit zones for BEAR PUT SPREAD
 * 
 * Bear Put Spread:
 * - Buy Put at Upper Strike (pay premium)
 * - Sell Put at Lower Strike (receive premium)
 * - Net cost: Upper Premium - Lower Premium (debit)
 * 
 * Profit zone = Upper Strike - Net Premium per unit
 * 
 * Example:
 * - Upper Strike: $2.63, Premium: $0.10
 * - Lower Strike: $2.50, Premium: $0.05
 * - Net Premium: $0.05 (debit)
 * → Profit Zone: $2.58 (profit when price < $2.58)
 */
function getProfitZonesForBearPutSpread(
  premiums: number[],
  upperStrike: number,
  amount: number
): number[] {
  return premiums.map(netPremium => {
    const netPremiumPerUnit = netPremium / amount;
    return upperStrike - netPremiumPerUnit;
  });
}

/**
 * Calculate profit zones for BEAR CALL SPREAD
 * 
 * Bear Call Spread:
 * - Sell Call at Lower Strike (receive premium)
 * - Buy Call at Upper Strike (pay premium)
 * - Net credit: Lower Premium - Upper Premium (credit!)
 * 
 * Profit zone = Lower Strike + Net Premium per unit
 * 
 * Example:
 * - Lower Strike: $2.50, Premium received: $0.08
 * - Upper Strike: $2.63, Premium paid: $0.03
 * - Net Premium: $0.05 (credit)
 * → Profit Zone: $2.55 (profit when price < $2.55)
 * 
 * Note: In premium calculator, premium is negative (you receive it)
 * So we use Math.abs() here
 */
function getProfitZonesForBearCallSpread(
  premiums: number[],
  lowerStrike: number,
  amount: number
): number[] {
  return premiums.map(netPremium => {
    const netPremiumPerUnit = Math.abs(netPremium) / amount;
    return lowerStrike + netPremiumPerUnit;
  });
}

/**
 * Main profit zone calculator
 * 
 * Takes array of premiums and returns array of profit zones
 * Each premium corresponds to a different strike price
 * 
 * @param premiums - Array of premium values (total cost, not per unit)
 * @param strategy - Strategy name (CALL, STRAP, BULL CALL SPREAD, BULL PUT SPREAD)
 * @param strikePrice - Strike price (or lower strike for spreads)
 * @param amount - Amount of underlying asset
 * @returns Array of profit zone prices
 */
export function getProfitZones(
  premiums: number[] | string[],
  strategy: string,
  strikePrice: number,
  amount: number | string
): number[] {
  // Normalize inputs
  const premiumNumbers = premiums.map(p => typeof p === 'string' ? parseFloat(p) : p);
  const amountNumber = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Validate inputs
  if (premiumNumbers.some(isNaN) || isNaN(amountNumber) || isNaN(strikePrice)) {
    console.error('[ProfitZoneCalc] Invalid inputs:', { premiums, amount, strikePrice });
    return [];
  }
  
  if (amountNumber <= 0) {
    console.error('[ProfitZoneCalc] Amount must be > 0:', amountNumber);
    return [];
  }
  
  // Calculate profit zones based on strategy
  let profitZones: number[] = [];
  
  const strategyUpper = strategy.toUpperCase().trim();
  
  switch (strategyUpper) {
    case 'CALL':
      profitZones = getProfitZonesForCall(premiumNumbers, strikePrice, amountNumber);
      break;
      
    case 'PUT':
      profitZones = getProfitZonesForPut(premiumNumbers, strikePrice, amountNumber);
      break;
      
    case 'STRAP':
      profitZones = getProfitZonesForStrap(premiumNumbers, strikePrice, amountNumber);
      break;
      
    case 'STRIP':
      profitZones = getProfitZonesForStrip(premiumNumbers, strikePrice, amountNumber);
      break;
      
    case 'BULL CALL SPREAD':
    case 'BULLCALLSPREAD':
    case 'BCSP':
      profitZones = getProfitZonesForBullCallSpread(premiumNumbers, strikePrice, amountNumber);
      break;
      
    case 'BULL PUT SPREAD':
    case 'BULLPUTSPREAD':
    case 'BPSP':
      profitZones = getProfitZonesForBullPutSpread(premiumNumbers, strikePrice, amountNumber);
      break;
      
    case 'BEAR PUT SPREAD':
    case 'BEARPUTSPREAD':
    case 'BEPS':
      profitZones = getProfitZonesForBearPutSpread(premiumNumbers, strikePrice, amountNumber);
      break;
      
    case 'BEAR CALL SPREAD':
    case 'BEARCALLSPREAD':
    case 'BECS':
      profitZones = getProfitZonesForBearCallSpread(premiumNumbers, strikePrice, amountNumber);
      break;
      
    default:
      console.warn(`[ProfitZoneCalc] Unknown strategy: ${strategy}`);
      profitZones = [];
  }
  
  console.log(`[ProfitZoneCalc] ${strategy}: Generated ${profitZones.length} profit zones`);
  
  return profitZones;
}

/**
 * Calculate profit/loss for a given current price
 * 
 * @param strategy - Strategy name
 * @param strikePrice - Strike price (or lower strike)
 * @param premium - Premium paid/received
 * @param currentPrice - Current market price
 * @param amount - Amount of underlying
 * @returns Profit (positive) or Loss (negative)
 */
export function calculateProfitLoss(
  strategy: string,
  strikePrice: number,
  premium: number,
  currentPrice: number,
  amount: number
): number {
  const strategyUpper = strategy.toUpperCase().trim();
  
  switch (strategyUpper) {
    case 'CALL':
      if (currentPrice > strikePrice) {
        return ((currentPrice - strikePrice) * amount) - premium;
      }
      return -premium; // Loss is capped at premium
      
    case 'PUT':
      if (currentPrice < strikePrice) {
        return ((strikePrice - currentPrice) * amount) - premium;
      }
      return -premium;
      
    case 'STRAP':
      if (currentPrice > strikePrice) {
        // 2x call profit (2 calls)
        return (2 * (currentPrice - strikePrice) * amount) - premium;
      } else {
        // 1x put profit (1 put)
        return ((strikePrice - currentPrice) * amount) - premium;
      }
      
    case 'STRIP':
      if (currentPrice < strikePrice) {
        // 2x put profit (2 puts)
        return (2 * (strikePrice - currentPrice) * amount) - premium;
      } else {
        // 1x call profit (1 call)
        return ((currentPrice - strikePrice) * amount) - premium;
      }
      
    default:
      return 0;
  }
}

/**
 * Format profit zone for display
 * 
 * @param profitZone - Profit zone price
 * @param currency - Currency symbol (default: '$')
 * @returns Formatted string like "> $2.57"
 */
export function formatProfitZone(profitZone: number, currency = '$'): string {
  return `> ${currency}${profitZone.toFixed(2)}`;
}

/**
 * Check if current price is in profit zone
 * 
 * @param currentPrice - Current market price
 * @param profitZone - Profit zone threshold
 * @param strategy - Strategy name
 * @returns true if in profit, false otherwise
 */
export function isInProfitZone(
  currentPrice: number,
  profitZone: number,
  strategy: string
): boolean {
  const strategyUpper = strategy.toUpperCase().trim();
  
  // Bullish strategies: profit when price rises
  if (strategyUpper.includes('CALL') || strategyUpper === 'STRAP' || strategyUpper === 'BCSP') {
    return currentPrice > profitZone;
  }
  
  // Bearish strategies: profit when price falls
  if (strategyUpper.includes('PUT') || strategyUpper === 'STRIP' || 
      strategyUpper === 'BEPS' || strategyUpper === 'BECS') {
    return currentPrice < profitZone;
  }
  
  return false;
}



