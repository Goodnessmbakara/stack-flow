// Token Service for fetching balances of various tokens on Stacks
// Supports sBTC, SIP-010 tokens, and future USDC integration

import { useWallet } from '../context/WalletContext';

export interface TokenBalance {
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  contractId?: string;
}

export interface TokenInfo {
  symbol: string;
  name: string;
  contractId: string;
  decimals: number;
  isNative: boolean;
}

  // Known tokens on Stacks
export const KNOWN_TOKENS: Record<string, TokenInfo> = {
  'STX': {
    symbol: 'STX',
    name: 'Stacks',
    contractId: 'native',
    decimals: 6,
    isNative: true
  },
  'sBTC': {
    symbol: 'sBTC',
    name: 'Bitcoin on Stacks',
    contractId: 'native',
    decimals: 8,
    isNative: true
  }
};

export class TokenService {
  private apiUrl: string;
  private address: string | null = null;

  constructor(address: string | null, network: 'testnet' | 'mainnet' = 'mainnet') {
    this.address = address;
    this.apiUrl = network === 'testnet' 
      ? 'https://api.testnet.hiro.so' 
      : 'https://api.mainnet.hiro.so';
  }

  // Fetch STX balance
  async getStxBalance(): Promise<number> {
    if (!this.address) return 0;
    
    try {
      const response = await fetch(`${this.apiUrl}/extended/v1/address/${this.address}/stx`);
      if (!response.ok) throw new Error('Failed to fetch STX balance');
      
      const data = await response.json();
      return parseFloat(data.balance) / 1000000; // Convert from microSTX
    } catch (error) {
      console.error('Error fetching STX balance:', error);
      return 0;
    }
  }

  // Fetch sBTC balance
  async getSbtcBalance(): Promise<number> {
    if (!this.address) return 0;
    
    try {
      const response = await fetch(`${this.apiUrl}/extended/v1/address/${this.address}/stx`);
      if (!response.ok) throw new Error('Failed to fetch sBTC balance');
      
      const data = await response.json();
      return parseFloat(data.sbtc_balance || '0') / 100000000; // Convert from satoshis
    } catch (error) {
      console.error('Error fetching sBTC balance:', error);
      return 0;
    }
  }

  // Fetch SIP-010 token balance
  async getSip010Balance(contractId: string): Promise<number> {
    if (!this.address) return 0;
    
    try {
      const response = await fetch(
        `${this.apiUrl}/extended/v1/tokens/ft/balances/${this.address}`
      );
      if (!response.ok) throw new Error('Failed to fetch token balances');
      
      const data = await response.json();
      const token = data.ft_balances?.find((t: any) => 
        t.contract_id === contractId
      );
      
      return token ? parseFloat(token.balance) / Math.pow(10, token.decimals) : 0;
    } catch (error) {
      console.error('Error fetching SIP-010 balance:', error);
      return 0;
    }
  }

  // Fetch all available token balances
  async getAllBalances(): Promise<TokenBalance[]> {
    const balances: TokenBalance[] = [];
    
    // STX balance
    const stxBalance = await this.getStxBalance();
    balances.push({
      symbol: 'STX',
      name: 'Stacks',
      balance: stxBalance,
      decimals: 6
    });
    
    // sBTC balance
    const sbtcBalance = await this.getSbtcBalance();
    balances.push({
      symbol: 'sBTC',
      name: 'Bitcoin on Stacks',
      balance: sbtcBalance,
      decimals: 8
    });
    
    
    return balances;
  }

  // Get primary trading balance (sBTC primary, STX fallback)
  async getPrimaryBalance(): Promise<number> {
    const sbtcBalance = await this.getSbtcBalance();
    
    if (sbtcBalance > 0) {
      return sbtcBalance;
    }
    
    // Fallback to STX if no sBTC
    return await this.getStxBalance();
  }

  // Get balance for a specific token
  async getTokenBalance(symbol: string): Promise<number> {
    switch (symbol.toUpperCase()) {
      case 'STX':
        return await this.getStxBalance();
      case 'SBTC':
        return await this.getSbtcBalance();
      default:
        return 0;
    }
  }
}

// Hook for using token service
export function useTokenService() {
  const { address } = useWallet();
  const network = import.meta.env.VITE_STACKS_NETWORK || 'testnet';
  
  return new TokenService(address, network as 'testnet' | 'mainnet');
}
