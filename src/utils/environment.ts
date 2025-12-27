export const ENVIRONMENT = {
  // Stacks Network Configuration
  STACKS_NETWORK: import.meta.env.VITE_STACKS_NETWORK || 'mainnet',
  STACKS_API_URL: import.meta.env.VITE_STACKS_API_URL || 'https://api.mainnet.hiro.so',
  STACKS_CONTRACT_ADDRESS: import.meta.env.VITE_STACKS_CONTRACT_ADDRESS,
  
  // App Configuration
  PLATFORM_FEE_ADDRESS: import.meta.env.VITE_PLATFORM_FEE_ADDRESS,
  BASE_URL: import.meta.env.VITE_BASE_URL,
};
