// Get Project ID from environment
export const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || '5423def4a6d894310da27a68b0f97ab5';

if (projectId === '8e390c8b668d2a65a2977727e0256860') {
  console.warn('[WalletConfig] Using default Reown Project ID. Please set VITE_REOWN_PROJECT_ID in your .env for better reliability.');
}

// NOTE: AppKit is not used for Stacks connections.
// We use @stacks/connect directly because AppKit doesn't have native Stacks support.
// The projectId above is exported for use with @stacks/connect's walletConnectProjectId option.

/*
// COMMENTED OUT: AppKit configuration (not supported for Stacks)
// If you need to add EVM, Solana, or Bitcoin support in the future, you can uncomment and configure this.

import { createAppKit } from '@reown/appkit/react';

// Define Stacks networks for Reown
export const stacksMainnet = {
  id: '1',
  caipNetworkId: 'stacks:1',
  name: 'Stacks Mainnet',
  chainNamespace: 'stacks',
  rpcUrl: 'https://api.mainnet.hiro.so',
  explorerUrl: 'https://explorer.stacks.co',
  currency: 'STX',
};

export const stacksTestnet = {
  id: '2147483648', // 0x80000000 as decimal
  caipNetworkId: 'stacks:2147483648',
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
  features: {
    analytics: false,
    onramp: false,
    email: false, // Stacks typically uses wallet direct
    socials: []   // Stacks typically uses wallet direct
  },
  themeVariables: {
    '--w3m-accent': '#37F741',
  },
  // Explicitly request the stacks namespace via optionalNamespaces
  // This prevents AppKit from defaulting to eip155 for the stacks chains
  // @ts-ignore - Some versions of AppKit types might not yet fully expose this via the top-level option
  optionalNamespaces: {
    stacks: {
      methods: [
        'stx_signTransaction',
        'stx_transferStx',
        'stx_callContract',
        'stx_signMessage',
        'stx_contractDeploy'
      ],
      chains: ['stacks:1', 'stacks:2147483648'],
      events: ['addressesChanged', 'chainChanged']
    }
  }
});
*/
