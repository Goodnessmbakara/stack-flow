import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { useConnect } from "@stacks/connect-react";
import { showConnect, disconnect } from "@stacks/connect";
import { StacksMainnet } from "@stacks/network";

interface AddressData {
  address: string;
  symbol?: string;
  purpose?: string;
}

interface WalletContextType {
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

const network = new StacksMainnet();

export function WalletProvider({ children }: { children: ReactNode }) {
  // Use Stacks Connect React hook
  const { isConnected, address } = useConnect();
  
  const [addresses, setAddresses] = useState<{
    stx: AddressData[];
    btc: AddressData[];
  }>({ stx: [], btc: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  // Sync with Stacks Connect state
  useEffect(() => {
    if (isConnected && address) {
      // Set address when connected
      setAddresses({
        stx: [{ address, symbol: 'STX', purpose: 'mainnet' }],
        btc: [] // BTC address can be derived later if needed
      });
    } else {
      // Clear addresses when disconnected
      setAddresses({ stx: [], btc: [] });
    }
    setIsLoading(false);
  }, [isConnected, address]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      showConnect({
        appDetails: {
          name: "StackFlow",
          icon: window.location.origin + "/logo.png",
        },
        network,
        onFinish: () => {
          console.log("[WalletContext] Wallet connected successfully");
          setIsConnecting(false);
        },
        onCancel: () => {
          console.log("[WalletContext] Connection cancelled");
          setIsConnecting(false);
        },
      });
    } catch (error) {
      console.error("[WalletContext] Error connecting wallet:", error);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    try {
      disconnect();
      setAddresses({ stx: [], btc: [] });
      console.log("[WalletContext] Disconnected wallet");
    } catch (error) {
      console.error("[WalletContext] Error disconnecting wallet:", error);
    }
  };

  // Primary address (mainnet by default)
  const stxAddress = address || null;
  const btcAddress = addresses.btc.length > 0 ? addresses.btc[0].address : null;

  return (
    <WalletContext.Provider
      value={{
        isLoading,
        isConnecting,
        isConnected,
        connectWallet: handleConnect,
        disconnect: handleDisconnect,
        address: stxAddress,
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
