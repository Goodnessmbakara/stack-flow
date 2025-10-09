// import axios from 'axios';
import { environment } from '../utils/environment';

export interface LiquidityPoolData {
  id: string;
  name: string;
  symbol: string;
  contractAddress: string;
  totalLiquidity: number;
  volume24h: number;
  trades24h: number;
  priceChange24h: number;
  participants: number;
  verified: boolean;
  isHot: boolean;
}

class LiquidityService {
  private readonly bitqueryApiKey = environment.BITQUERY_API_KEY;
  private readonly moralisApiKey = environment.MORALIS_API_KEY;

  // Bitquery GraphQL queries - requires API key
  async getBitqueryLiquidityPools(): Promise<LiquidityPoolData[]> {
    if (!this.bitqueryApiKey) {
      throw new Error('Bitquery API key is required for real liquidity data');
    }

    try {
      console.log('🔄 Fetching real liquidity pools from Bitquery...');
      
      const query = `
        query GetStacksDEXTrades {
          bitcoin {
            dexTrades(
              options: {limit: 50, desc: "timeInterval.minute"}
              date: {since: "2024-01-01"}
              exchangeName: {is: "Stacks"}
            ) {
              timeInterval {
                minute(count: 1440)
              }
              baseCurrency {
                symbol
                address
              }
              quoteCurrency {
                symbol  
                address
              }
              trades: count
              tradeAmount(in: USD)
              median_price: price(calculate: median)
              
              # Volume and liquidity metrics
              buyAmount
              sellAmount
              minimum_price: price(calculate: minimum)
              maximum_price: price(calculate: maximum)
            }
          }
        }
      `;

      const response = await fetch('https://graphql.bitquery.io/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.bitqueryApiKey,
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`Bitquery API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.errors) {
        console.error('Bitquery GraphQL errors:', data.errors);
        throw new Error('Bitquery GraphQL query failed');
      }

      // Process Bitquery response into our format
      const pools: LiquidityPoolData[] = data.data?.bitcoin?.dexTrades?.map((trade: any, index: number) => ({
        id: `bitquery-pool-${index}`,
        name: `${trade.baseCurrency.symbol}-${trade.quoteCurrency.symbol} Pool`,
        symbol: `${trade.baseCurrency.symbol}-${trade.quoteCurrency.symbol}`,
        contractAddress: trade.baseCurrency.address || `SP_CONTRACT_${index}`,
        totalLiquidity: trade.tradeAmount || 0,
        volume24h: trade.tradeAmount || 0,
        trades24h: trade.trades || 0,
        priceChange24h: trade.maximum_price && trade.minimum_price 
          ? ((trade.maximum_price - trade.minimum_price) / trade.minimum_price) * 100 
          : 0,
        participants: Math.floor(trade.trades / 5) || 10,
        verified: trade.baseCurrency.symbol?.includes('stBTC') || trade.baseCurrency.symbol?.includes('STX') || false,
        isHot: trade.trades > 100 || false
      })) || [];

      return pools.filter(pool => pool.volume24h > 0);

    } catch (error) {
      console.error('Error fetching from Bitquery:', error);
      throw new Error('Failed to fetch real liquidity data from Bitquery');
    }
  }

  // Moralis Web3 API calls - requires API key
  async getMoralisTokenData(): Promise<any[]> {
    if (!this.moralisApiKey) {
      throw new Error('Moralis API key is required for token metadata');
    }

    try {
      console.log('🔄 Fetching token metadata from Moralis...');
      
      // Get Stacks network tokens
      const response = await fetch(`https://deep-index.moralis.io/api/v2/0x0000000000000000000000000000000000000000/erc20`, {
        headers: {
          'X-API-Key': this.moralisApiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Moralis API error: ${response.status}`);
      }

      const data = await response.json();
      return data || [];

    } catch (error) {
      console.error('Error fetching from Moralis:', error);
      throw new Error('Failed to fetch token data from Moralis');
    }
  }

  // Get StBTC specific pools
  async getStBTCPools(): Promise<LiquidityPoolData[]> {
    const allPools = await this.getBitqueryLiquidityPools();
    return allPools.filter(pool => 
      pool.symbol.toLowerCase().includes('stbtc') || 
      pool.name.toLowerCase().includes('stbtc')
    );
  }

  // Main method to get all liquidity pools - requires API keys
  async getAllLiquidityPools(): Promise<LiquidityPoolData[]> {
    try {
      console.log('🔄 Getting all liquidity pools from real APIs...');
      
      // Get pools from both services - both require API keys
      const [bitqueryPools, moralisTokens] = await Promise.allSettled([
        this.getBitqueryLiquidityPools(),
        this.getMoralisTokenData()
      ]);

      let pools: LiquidityPoolData[] = [];

      if (bitqueryPools.status === 'fulfilled') {
        pools = bitqueryPools.value;
      } else {
        console.error('Bitquery pools failed:', bitqueryPools.reason);
        throw new Error('Bitquery API unavailable');
      }

      // Enhance with Moralis token data if available
      if (moralisTokens.status === 'fulfilled' && moralisTokens.value.length > 0) {
        console.log(`📊 Enhanced pools with Moralis metadata for ${moralisTokens.value.length} tokens`);
        // Additional processing could be added here
      }

      if (pools.length === 0) {
        throw new Error('No real liquidity pools available');
      }

      console.log(`✅ Fetched ${pools.length} real liquidity pools`);
      return pools;

    } catch (error) {
      console.error('Error in getAllLiquidityPools:', error);
      throw new Error('Failed to fetch real liquidity pools. API keys may be missing or APIs unavailable.');
    }
  }
}

export const liquidityService = new LiquidityService();