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
  connect,
  isConnected,
  getLocalStorage,
  disconnect as disconnectWallet,
} from "@stacks/connect";

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

  // Load wallet state from localStorage on mount
  useEffect(() => {
    const loadWalletState = () => {
      try {
        // Check if user is connected using v8 API
        if (isConnected()) {
          const storageData = getLocalStorage();
          if (storageData && storageData.addresses) {
            setAddresses({
              stx: storageData.addresses.stx || [],
              btc: storageData.addresses.btc || [],
            });
          }
        }
      } catch (error) {
        console.error("Error loading wallet state:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWalletState();
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Use the new connect() API from @stacks/connect v8
      // This automatically stores addresses in localStorage
      const result = await connect();
      
      if (result && result.addresses) {
        // Separate STX and BTC addresses
        const stxAddrs: AddressData[] = [];
        const btcAddrs: AddressData[] = [];
        
        result.addresses.forEach((addr) => {
          const addressData = {
            address: addr.address,
            symbol: addr.symbol,
            // purpose: addr.purpose, // Property doesn't exist on AddressEntry
          };
          
          // STX addresses start with 'S'
          if (addr.address.startsWith('S')) {
            stxAddrs.push(addressData);
          } else {
            btcAddrs.push(addressData);
          }
        });
        
        setAddresses({ stx: stxAddrs, btc: btcAddrs });
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    // Use v8's built-in disconnect function
    disconnectWallet();
    setAddresses({ stx: [], btc: [] });
    userSession.signUserOut();
  };

  // Extract primary addresses
  const stxAddress = addresses.stx.length > 0 ? addresses.stx[0].address : null;
  const btcAddress = addresses.btc.length > 0 
    ? addresses.btc.find(a => a.purpose === 'payment')?.address || addresses.btc[0].address
    : null;

  // Use STX address as primary address
  const address = stxAddress;

  return (
    <WalletContext.Provider
      value={{
        userSession,
        isLoading,
        isConnecting,
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

