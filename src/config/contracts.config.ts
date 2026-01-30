/**
 * Network-Aware Contract Configuration
 * 
 * Automatically switches between testnet and mainnet contract addresses
 * based on the VITE_STACKS_NETWORK environment variable.
 * 
 * IMPORTANT: Testnet uses M2 contracts (supports all 8 strategies: CALL, PUT, STRAP, STRIP, BCSP, BPSP, BEPS, BECS)
 *            Mainnet uses V2 contracts (basic strategies only)
 */

// Network detection
const NETWORK = import.meta.env.VITE_STACKS_NETWORK || 'mainnet';
const isTestnet = NETWORK === 'testnet';

console.log(`[Contracts Config] Network: ${NETWORK}`);

/**
 * Contract Addresses by Network
 */

// StackFlow Options Trading Contract
export const OPTIONS_CONTRACT = isTestnet
  ? {
      address: 'ST3F4WEX90KZQ6D25TWP09J90D6CSYGW1JX8WH3Y7',
      name: 'stackflow-options-m2-v2', // M2: Supports all 8 strategies
    }
  : {
      address: 'SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS',
      name: 'stackflow-options-v2', // V2: Basic strategies
    };

// Price Oracle Contract
export const ORACLE_CONTRACT = isTestnet
  ? {
      address: 'ST3F4WEX90KZQ6D25TWP09J90D6CSYGW1JX8WH3Y7',
      name: 'stackflow-oracle-mock-v2', // Mock oracle for testing
    }
  : null; // TODO: Add mainnet Pyth oracle when deployed

// Pyth Oracle Contract (for production price feeds)
export const PYTH_ORACLE_CONTRACT = isTestnet
  ? {
      address: 'ST3F4WEX90KZQ6D25TWP09J90D6CSYGW1JX8WH3Y7',
      name: 'stackflow-pyth-oracle-v2',
    }
  : null; // TODO: Add mainnet Pyth oracle

// sBTC Mock Token (testnet only)
export const SBTC_CONTRACT = isTestnet
  ? {
      address: 'ST3F4WEX90KZQ6D25TWP09J90D6CSYGW1JX8WH3Y7',
      name: 'stackflow-sbtc-mock',
    }
  : null; // TODO: Add mainnet sBTC when available

// FLOW Token (not yet deployed on testnet)
export const FLOW_TOKEN_CONTRACT = isTestnet
  ? null // Not deployed on testnet yet
  : {
      address: 'SP3F4WEX90KZQ6D25TWP09J90D6CSYGW1JX8WH3Y7', // Placeholder
      name: 'stackflow-flow-token',
    };

// Staking Contract (not yet deployed on testnet)
export const STAKING_CONTRACT = isTestnet
  ? null // Not deployed on testnet yet
  : {
      address: 'SP3F4WEX90KZQ6D25TWP09J90D6CSYGW1JX8WH3Y7', // Placeholder
      name: 'stackflow-staking',
    };

// Governance Contract (not yet deployed on testnet)
export const GOVERNANCE_CONTRACT = isTestnet
  ? null // Not deployed on testnet yet
  : {
      address: 'SP3F4WEX90KZQ6D25TWP09J90D6CSYGW1JX8WH3Y7', // Placeholder
      name: 'stackflow-governance',
    };

/**
 * Helper Functions
 */

/**
 * Get full contract identifier (address.contract-name)
 */
export function getContractIdentifier(
  contract: { address: string; name: string } | null
): string | null {
  if (!contract) return null;
  return `${contract.address}.${contract.name}`;
}

/**
 * Get contract address only
 */
export function getContractAddress(
  contract: { address: string; name: string } | null
): string | null {
  if (!contract) return null;
  return contract.address;
}

/**
 * Get contract name only
 */
export function getContractName(
  contract: { address: string; name: string } | null
): string | null {
  if (!contract) return null;
  return contract.name;
}

/**
 * Check if a contract is deployed on current network
 */
export function isContractAvailable(
  contract: { address: string; name: string } | null
): boolean {
  return contract !== null;
}

/**
 * Available Strategies by Network
 * 
 * Testnet (M2): All 8 strategies
 * Mainnet (V2): Basic strategies only (until M2 is deployed)
 */
export const AVAILABLE_STRATEGIES = isTestnet
  ? ['CALL', 'PUT', 'STRAP', 'STRIP', 'BCSP', 'BPSP', 'BEPS', 'BECS'] as const
  : ['CALL', 'PUT'] as const; // Mainnet V2 has basic strategies

export type AvailableStrategy = typeof AVAILABLE_STRATEGIES[number];

/**
 * Check if a strategy is available on current network
 */
export function isStrategyAvailable(strategy: string): boolean {
  return AVAILABLE_STRATEGIES.includes(strategy as any);
}

/**
 * Network Information
 */
export const NETWORK_INFO = {
  network: NETWORK,
  isTestnet,
  isMainnet: !isTestnet,
  apiUrl: isTestnet
    ? 'https://api.testnet.hiro.so'
    : 'https://api.mainnet.hiro.so',
  explorerUrl: isTestnet
    ? 'https://explorer.hiro.so'
    : 'https://explorer.hiro.so',
};

/**
 * Export all contracts as a single object for convenience
 */
export const CONTRACTS = {
  OPTIONS: OPTIONS_CONTRACT,
  ORACLE: ORACLE_CONTRACT,
  PYTH_ORACLE: PYTH_ORACLE_CONTRACT,
  SBTC: SBTC_CONTRACT,
  FLOW_TOKEN: FLOW_TOKEN_CONTRACT,
  STAKING: STAKING_CONTRACT,
  GOVERNANCE: GOVERNANCE_CONTRACT,
} as const;

// Log contract configuration on load
console.log('[Contracts Config] Loaded contracts:', {
  options: getContractIdentifier(OPTIONS_CONTRACT),
  oracle: getContractIdentifier(ORACLE_CONTRACT),
  network: NETWORK_INFO.network,
  availableStrategies: AVAILABLE_STRATEGIES,
});
