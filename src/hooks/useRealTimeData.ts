import { useState, useEffect, useCallback } from 'react';
import { TraderProfile, MemePool } from '../lib/types';
import { apiService } from '../services/api';

interface UseRealTimeDataReturn {
  traders: TraderProfile[];
  memePools: MemePool[];
  prices: { [key: string]: number };
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export function useRealTimeData(): UseRealTimeDataReturn {
  const [traders, setTraders] = useState<TraderProfile[]>([]);
  const [memePools, setMemePools] = useState<MemePool[]>([]);
  const [prices, setPrices] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializeData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Fetching real data from APIs...');

      // Fetch all data with proper error handling - no fallbacks
      const results = await Promise.allSettled([
        apiService.getTopStacksTraders(),
        apiService.getSocialSentimentPools(),
        apiService.getAssetPrices(['STX', 'BTC', 'ETH'])
      ]);

      // Handle traders result
      if (results[0].status === 'fulfilled') {
        setTraders(results[0].value);
        console.log('✅ Real traders loaded:', results[0].value.length);
      } else {
        console.error('❌ Traders API failed:', results[0].reason);
        setTraders([]);
      }

      // Handle meme pools result
      if (results[1].status === 'fulfilled') {
        setMemePools(results[1].value);
        console.log('✅ Real meme pools loaded:', results[1].value.length);
      } else {
        console.error('❌ Meme pools API failed:', results[1].reason);
        setMemePools([]);
      }

      // Handle prices result
      if (results[2].status === 'fulfilled') {
        setPrices(results[2].value);
        console.log('✅ Real prices loaded:', Object.keys(results[2].value).length);
      } else {
        console.error('❌ Prices API failed:', results[2].reason);
        setPrices({});
      }

      // Check if all APIs failed
      const allFailed = results.every(result => result.status === 'rejected');
      if (allFailed) {
        setError('All APIs are currently unavailable. Please check your internet connection and try again later.');
      } else {
        // Set specific error message for what failed
        const failedServices = [];
        if (results[0].status === 'rejected') failedServices.push('trader data');
        if (results[1].status === 'rejected') failedServices.push('pool data');
        if (results[2].status === 'rejected') failedServices.push('price data');
        
        if (failedServices.length > 0) {
          setError(`Some services are unavailable: ${failedServices.join(', ')}. Displaying available data only.`);
        }
      }

    } catch (error) {
      console.error('❌ Data initialization failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      
      // Clear all data on failure
      setTraders([]);
      setMemePools([]);
      setPrices({});
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    console.log('🔄 Refreshing real-time data...');
    await initializeData();
  }, [initializeData]);

  useEffect(() => {
    initializeData();
    
    // Set up real-time updates every 5 minutes
    const interval = setInterval(() => {
      console.log('⏰ Auto-refreshing real data...');
      refreshData();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [initializeData, refreshData]);

  return {
    traders,
    memePools,
    prices,
    loading,
    error,
    refreshData
  };
}

// Hook for individual trader data - no fallback data
export function useTraderData(address: string) {
  const [traderData, setTraderData] = useState<{
    balance: number;
    performance: {
      totalReturn: number;
      winRate: number;
      trades: number;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTraderData = async () => {
      if (!address) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const addressInfo = await apiService.getStacksAddressInfo(address);
        
        setTraderData({
          balance: addressInfo.balance,
          performance: {
            totalReturn: 0, // Will be calculated from real P&L data
            winRate: 0, // Will be calculated from successful vs failed transactions
            trades: addressInfo.transactions.length
          }
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load real trader data');
        setTraderData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTraderData();
  }, [address]);

  return { traderData, loading, error };
}

// Hook for real-time price updates - now properly returns both price and priceChange24h
export function usePriceData(asset: string) {
  const [price, setPrice] = useState<number | null>(null);
  const [priceChange24h, setPriceChange24h] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use the new API method that returns both price and 24h change
        const priceData = await apiService.getAssetPriceWithChange(asset);
        
        if (priceData) {
          setPrice(priceData.price);
          setPriceChange24h(priceData.priceChange24h);
        } else {
          setPrice(null);
          setPriceChange24h(null);
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch real price data');
        setPrice(null);
        setPriceChange24h(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
    
    // Update price every 30 seconds
    const interval = setInterval(fetchPrice, 30 * 1000);
    
    return () => clearInterval(interval);
  }, [asset]);

  return { price, priceChange24h, loading, error };
}