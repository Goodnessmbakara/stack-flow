import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import {
  AppConfig,
  UserSession,
} from "@stacks/connect";
import { modal } from "../lib/wallet-config";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";

// Configure the app - only request necessary permissions
const appConfig = new AppConfig(["store_write"]);

// Create a single user session instance
const userSession = new UserSession({ appConfig });

interface AddressData {
  address: string;
  symbol?: string;
  purpose?: string;
}

interface WalletContextType {
  userSession: UserSession;
  isLoading: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnect: () => void;
  address: string | null;
  stxAddress: string | null;
  btcAddress: string | null;
  addresses: {
    stx: AddressData[];
    btc: AddressData[];
  };
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [addresses, setAddresses] = useState<{
    stx: AddressData[];
    btc: AddressData[];
  }>({ stx: [], btc: [] });
  const [isLoading, setIsLoading] = useState(true);

  const { address: reownAddress, isConnected: reownIsConnected } = useAppKitAccount();
  const { walletProvider: _walletProvider } = useAppKitProvider('stacks') as any;

  // Sync addresses from AppKit/WalletConnect
  useEffect(() => {
    if (reownIsConnected && reownAddress) {
      // For Stacks via WalletConnect, we often get multiple addresses via JSON-RPC
      // But AppKitAccount gives the primary one.
      setAddresses({
        stx: [{ address: reownAddress, symbol: 'STX' }],
        btc: [] // BTC addresses might require specific RPC calls if available
      });
    } else {
      setAddresses({ stx: [], btc: [] });
    }
    setIsLoading(false);
  }, [reownAddress, reownIsConnected]);

  const handleConnect = async () => {
    try {
      await modal.open();
    } catch (error) {
      console.error("Error opening Reown modal:", error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await modal.disconnect();
      setAddresses({ stx: [], btc: [] });
    } catch (error) {
      console.error("Error disconnecting Reown:", error);
    }
  };

  // Primary address
  const address = reownAddress || null;
  const stxAddress = address;
  const btcAddress = addresses.btc.length > 0 ? addresses.btc[0].address : null;

  return (
    <WalletContext.Provider
      value={{
        userSession,
        isLoading,
        isConnecting: false, // AppKit handles its own loading state
        isConnected: reownIsConnected,
        connectWallet: handleConnect,
        disconnect: handleDisconnect,
        address,
        stxAddress,
        btcAddress,
        addresses,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}

