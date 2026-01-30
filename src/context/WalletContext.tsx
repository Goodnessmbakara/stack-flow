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

// Determine network from environment (mainnet or testnet)
const NETWORK = import.meta.env.VITE_STACKS_NETWORK || 'mainnet';
const isTestnet = NETWORK === 'testnet';

console.log('[WalletContext] Network configured:', NETWORK);

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
    try {
      if (userSession.isUserSignedIn()) {
        const userData = userSession.loadUserData();
        // Use testnet or mainnet address based on network config
        const stxAddr = isTestnet 
          ? userData.profile.stxAddress?.testnet 
          : userData.profile.stxAddress?.mainnet;
        
        console.log('[WalletContext] Existing session found, network:', NETWORK, 'address:', stxAddr);
        
        if (stxAddr) {
          setIsConnected(true);
          setAddress(stxAddr);
          setAddresses({
            stx: [{ address: stxAddr, symbol: 'STX', purpose: NETWORK }],
            btc: []
          });
        }
      }
    } catch (error) {
      // Clear corrupted session data from old WalletConnect
      console.warn('[WalletContext] Clearing corrupted session:', error);
      try {
        userSession.signUserOut();
      } catch (e) {
        // If signOut fails, manually clear localStorage
        localStorage.removeItem('blockstack-session');
      }
    }
    setIsLoading(false);
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Use showConnect from @stacks/connect
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
              // Use testnet or mainnet address based on network config
              const stxAddr = isTestnet 
                ? userData.profile.stxAddress?.testnet 
                : userData.profile.stxAddress?.mainnet;
              
              console.log('[WalletContext] Sign-in pending resolved, network:', NETWORK, 'address:', stxAddr);
              
              if (stxAddr) {
                setIsConnected(true);
                setAddress(stxAddr);
                setAddresses({
                  stx: [{ address: stxAddr, symbol: 'STX', purpose: NETWORK }],
                  btc: []
                });
              }
              setIsConnecting(false);
              console.log("[WalletContext] Connected:", stxAddr);
            }).catch((error) => {
              console.error('[WalletContext] Error handling pending sign-in:', error);
              setIsConnecting(false);
            });
          } else if (userSession.isUserSignedIn()) {
            const userData = userSession.loadUserData();
            // Use testnet or mainnet address based on network config
            const stxAddr = isTestnet 
              ? userData.profile.stxAddress?.testnet 
              : userData.profile.stxAddress?.mainnet;
            
            console.log('[WalletContext] Already signed in, network:', NETWORK, 'address:', stxAddr);
            
            if (stxAddr) {
              setIsConnected(true);
              setAddress(stxAddr);
              setAddresses({
                stx: [{ address: stxAddr, symbol: 'STX', purpose: NETWORK }],
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
