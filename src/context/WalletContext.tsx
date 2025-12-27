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
  showConnect,
} from "@stacks/connect";
import { projectId } from "../lib/wallet-config";

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
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if user is already authenticated on mount
  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData();
      const stxAddr = userData.profile.stxAddress;
      const mainnetAddr = stxAddr.mainnet;
      const testnetAddr = stxAddr.testnet;
      
      setAddresses({
        stx: [
          { address: mainnetAddr, symbol: 'STX', purpose: 'mainnet' },
          { address: testnetAddr, symbol: 'STX', purpose: 'testnet' }
        ],
        btc: [] // BTC addresses can be added if available
      });
    }
    setIsLoading(false);
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      showConnect({
        appDetails: {
          name: import.meta.env.VITE_APP_NAME || 'StackFlow',
          icon: import.meta.env.VITE_APP_ICON || window.location.origin + '/icon.svg',
        },
        onFinish: () => {
          setIsConnecting(false);
          if (userSession.isUserSignedIn()) {
            const userData = userSession.loadUserData();
            const stxAddr = userData.profile.stxAddress;
            const mainnetAddr = stxAddr.mainnet;
            const testnetAddr = stxAddr.testnet;
            
            setAddresses({
              stx: [
                { address: mainnetAddr, symbol: 'STX', purpose: 'mainnet' },
                { address: testnetAddr, symbol: 'STX', purpose: 'testnet' }
              ],
              btc: []
            });
          }
        },
        onCancel: () => {
          setIsConnecting(false);
        },
        userSession,
        walletConnectProjectId: projectId,
      });
    } catch (error) {
      console.error("Error opening Stacks Connect modal:", error);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    try {
      userSession.signUserOut();
      setAddresses({ stx: [], btc: [] });
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  // Primary address (mainnet by default)
  const isConnected = userSession.isUserSignedIn();
  const stxAddress = addresses.stx.find(a => a.purpose === 'mainnet')?.address || addresses.stx[0]?.address || null;
  const btcAddress = addresses.btc.length > 0 ? addresses.btc[0].address : null;

  return (
    <WalletContext.Provider
      value={{
        userSession,
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

