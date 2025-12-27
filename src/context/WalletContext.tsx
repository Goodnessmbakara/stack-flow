import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import {
  connect,
  disconnect,
  isConnected,
  request,
} from "@stacks/connect";
import { projectId } from "../lib/wallet-config";

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

export function WalletProvider({ children }: { children: ReactNode }) {
  const [addresses, setAddresses] = useState<{
    stx: AddressData[];
    btc: AddressData[];
  }>({ stx: [], btc: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const connectionStatus = isConnected();
        setConnected(connectionStatus);
        
        if (connectionStatus) {
          // Fetch addresses if connected
          const result = await request('getAddresses');
          if (result?.addresses && Array.isArray(result.addresses)) {
            setAddresses({
              stx: result.addresses.map((addr: any) => ({
                address: addr.address,
                symbol: addr.symbol || 'STX',
                purpose: addr.type || 'mainnet'
              })),
              btc: [] // BTC addresses can be added if available
            });
          }
        }
      } catch (error) {
        console.error('[WalletContext] Error checking connection:', error);
        setConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connect({
        appDetails: {
          name: import.meta.env.VITE_APP_NAME || 'StackFlow',
          icon: import.meta.env.VITE_APP_ICON || window.location.origin + '/icon.svg',
        },
        walletConnectProjectId: projectId,
        onFinish: async () => {
          setIsConnecting(false);
          setConnected(true);
          
          // Fetch addresses after successful connection
          try {
            const result = await request('getAddresses');
            if (result?.addresses && Array.isArray(result.addresses)) {
              setAddresses({
                stx: result.addresses.map((addr: any) => ({
                  address: addr.address,
                  symbol: addr.symbol || 'STX',
                  purpose: addr.type || 'mainnet'
                })),
                btc: []
              });
            }
          } catch (error) {
            console.error('[WalletContext] Error fetching addresses:', error);
          }
        },
        onCancel: () => {
          setIsConnecting(false);
        },
      });
    } catch (error) {
      console.error("Error opening Stacks Connect modal:", error);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    try {
      disconnect();
      setConnected(false);
      setAddresses({ stx: [], btc: [] });
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  // Primary address (mainnet by default)
  const stxAddress = addresses.stx.find(a => a.purpose === 'mainnet')?.address || addresses.stx[0]?.address || null;
  const btcAddress = addresses.btc.length > 0 ? addresses.btc[0].address : null;

  return (
    <WalletContext.Provider
      value={{
        isLoading,
        isConnecting,
        isConnected: connected,
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
