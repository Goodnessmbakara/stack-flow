import { createAppKit } from '@reown/appkit/react';

// Get Project ID from environment
export const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || '5423def4a6d894310da27a68b0f97ab5';

if (projectId === '8e390c8b668d2a65a2977727e0256860') {
  console.warn('[WalletConfig] Using default Reown Project ID. Please set VITE_REOWN_PROJECT_ID in your .env for better reliability.');
}

// Define Stacks networks for Reown
export const stacksMainnet = {
  id: 'stacks:1',
  name: 'Stacks Mainnet',
  chainNamespace: 'stacks',
  rpcUrl: 'https://api.mainnet.hiro.so',
  explorerUrl: 'https://explorer.stacks.co',
  currency: 'STX',
};

export const stacksTestnet = {
  id: 'stacks:2147483648', // 0x80000000 as decimal
  name: 'Stacks Testnet',
  chainNamespace: 'stacks',
  rpcUrl: 'https://api.testnet.hiro.so',
  explorerUrl: 'https://explorer.stacks.co/?chain=testnet',
  currency: 'STX',
};

// Metadata for the app
const metadata = {
  name: 'StackFlow',
  description: 'StackFlow - Premium Stacks Trading & Market Intel',
  url: 'https://stackflow.app',
  icons: ['https://stackflow.app/icon.svg']
};

// Initialize AppKit
export const modal = createAppKit({
  adapters: [], // Using universal provider for Stacks
  networks: [stacksMainnet, stacksTestnet] as any,
  projectId,
  metadata,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#37F741',
  }
});
