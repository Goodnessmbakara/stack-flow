/**
 * StackFlow Price Oracle
 * 
 * Delegates to the consolidated priceService for consistent pricing
 */

import { priceService } from '../../services/priceService';

/**
 * Get current price for STX or BTC
 * 
 * @param asset - Asset symbol ('STX' or 'BTC')
 * @returns Current USD price
 */
export async function getAssetPrice(asset: 'STX' | 'BTC'): Promise<number> {
  return priceService.getCurrentPrice(asset as any);
}

/**
 * Get both STX and BTC prices in a single call
 * More efficient than calling getAssetPrice twice
 */
export async function getAllPrices(): Promise<{ stx: number; btc: number }> {
  const [stx, btc] = await Promise.all([
    getAssetPrice('STX'),
    getAssetPrice('BTC'),
  ]);
  
  return { stx, btc };
}

/**
 * Clear price cache (useful for testing or force refresh)
 */
export function clearPriceCache(): void {
  priceService.destroy();
  // Service will re-initialize on next call
}

/**
 * Placeholder for future Pyth Network oracle (on-chain)
 */
export async function fetchFromPythOracle(_asset: 'STX' | 'BTC'): Promise<number> {
  throw new Error('Pyth oracle integration coming in Phase 2');
}
