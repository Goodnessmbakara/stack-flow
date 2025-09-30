import { AppConfig, UserSession } from '@stacks/connect';
import { StacksNetwork, STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';

// Get environment variables
const isMainnet = import.meta.env.VITE_STACKS_NETWORK === 'mainnet';
const networkUrl = import.meta.env.VITE_STACKS_API_URL || 'https://api.testnet.hiro.so';

// Configure the Stacks network
export const network: StacksNetwork = isMainnet 
  ? STACKS_MAINNET
  : STACKS_TESTNET;

// Configure the app
export const appConfig = new AppConfig(['store_write', 'publish_data']);

// Create user session
export const userSession = new UserSession({ appConfig });

// App details for wallet connection
export const appDetails = {
  name: import.meta.env.VITE_APP_NAME || 'StackFlow',
  icon: import.meta.env.VITE_APP_ICON || '/src/assets/stackflow-icon.svg',
};

// Helper function to get user data
export const getUserData = () => {
  if (userSession.isUserSignedIn()) {
    return userSession.loadUserData();
  }
  return null;
};

// Helper function to check if user is signed in
export const isSignedIn = () => {
  return userSession.isUserSignedIn();
};

// Helper function to sign out
export const signOut = () => {
  userSession.signUserOut();
  window.location.reload();
};

// Helper function to get the user's address
export const getUserAddress = () => {
  const userData = getUserData();
  return userData?.profile?.stxAddress?.testnet || userData?.profile?.stxAddress?.mainnet;
};

// Helper function to get the user's Bitcoin address
export const getUserBtcAddress = () => {
  const userData = getUserData();
  return userData?.profile?.btcAddress?.p2wpkh?.testnet || userData?.profile?.btcAddress?.p2wpkh?.mainnet;
};

// Network configuration for different environments
export const getNetworkConfig = () => {
  return {
    network,
    isMainnet,
    networkUrl,
    contractAddress: import.meta.env.VITE_STACKS_CONTRACT_ADDRESS || 'ST000000000000000000002Q6WAP',
  };
};
