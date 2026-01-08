import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { showConnect } from "@stacks/connect";
import { AppConfig, UserSession } from "@stacks/auth";

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

// Configure Stacks authentication
const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<{
    stx: AddressData[];
    btc: AddressData[];
  }>({ stx: [], btc: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData();
      const stxAddr = userData.profile.stxAddress?.mainnet;
      
      if (stxAddr) {
        setIsConnected(true);
        setAddress(stxAddr);
        setAddresses({
          stx: [{ address: stxAddr, symbol: 'STX', purpose: 'mainnet' }],
          btc: []
        });
      }
    }
    setIsLoading(false);
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      showConnect({
        appDetails: {
          name: "StackFlow",
          icon: window.location.origin + "/logo.png",
        },
        redirectTo: "/",
        onFinish: () => {
          // Handle pending sign in
          if (userSession.isSignInPending()) {
            userSession.handlePendingSignIn().then((userData) => {
              const stxAddr = userData.profile.stxAddress?.mainnet;
              if (stxAddr) {
                setIsConnected(true);
                setAddress(stxAddr);
                setAddresses({
                  stx: [{ address: stxAddr, symbol: 'STX', purpose: 'mainnet' }],
                  btc: []
                });
              }
              setIsConnecting(false);
              console.log("[WalletContext] Connected:", stxAddr);
            });
          } else if (userSession.isUserSignedIn()) {
            const userData = userSession.loadUserData();
            const stxAddr = userData.profile.stxAddress?.mainnet;
            if (stxAddr) {
              setIsConnected(true);
              setAddress(stxAddr);
              setAddresses({
                stx: [{ address: stxAddr, symbol: 'STX', purpose: 'mainnet' }],
                btc: []
              });
            }
            setIsConnecting(false);
            console.log("[WalletContext] Already connected:", stxAddr);
          }
        },
        onCancel: () => {
          console.log("[WalletContext] Connection cancelled");
          setIsConnecting(false);
        },
      });
    } catch (error) {
      console.error("[WalletContext] Error connecting:", error);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    try {
      userSession.signUserOut();
      setIsConnected(false);
      setAddress(null);
      setAddresses({ stx: [], btc: [] });
      console.log("[WalletContext] Disconnected");
    } catch (error) {
      console.error("[WalletContext] Error disconnecting:", error);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        isLoading,
        isConnecting,
        isConnected,
        connectWallet: handleConnect,
        disconnect: handleDisconnect,
        address,
        stxAddress: address,
        btcAddress: null,
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
