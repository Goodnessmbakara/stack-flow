export const environment = {
  ARBISCAN_API_KEY: import.meta.env.VITE_ARBISCAN_API_KEY,
  PLATFORM_FEE_ADDRESS: import.meta.env.VITE_PLATFORM_FEE_ADDRESS,
  BASE_URL: import.meta.env.VITE_BASE_URL,
  COINGECKO_API_KEY: import.meta.env.VITE_COINGECKO_API_KEY,
  BITQUERY_API_KEY: import.meta.env.VITE_BITQUERY_API_KEY || '',
  MORALIS_API_KEY: import.meta.env.VITE_MORALIS_API_KEY || '',
};
