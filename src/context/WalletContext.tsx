import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { connect, isConnected as stacksIsConnected, disconnect as stacksDisconnect, getLocalStorage } from "@stacks/connect";

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

// Determine network from environment (mainnet or testnet)
const NETWORK = import.meta.env.VITE_STACKS_NETWORK || 'mainnet';

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

  // Check for existing session on mount (@stacks/connect v8: isConnected + getLocalStorage)
  useEffect(() => {
    try {
      if (stacksIsConnected()) {
        const userData = getLocalStorage();
        const stxAddr = userData?.addresses?.stx?.[0]?.address ?? null;
        console.log('[WalletContext] Existing session found, network:', NETWORK, 'stx:', stxAddr);
        if (stxAddr) {
          setIsConnected(true);
          setAddress(stxAddr);
          setAddresses({
            stx: (userData?.addresses?.stx ?? []).map((a: { address: string }) => ({ address: a.address, symbol: 'STX', purpose: NETWORK })),
            btc: (userData?.addresses?.btc ?? []).map((a: { address: string }) => ({ address: a.address, symbol: 'BTC', purpose: NETWORK }))
          });
        }
      }
    } catch (error) {
      console.warn('[WalletContext] Error reading session:', error);
    }
    setIsLoading(false);
  }, []);

  const handleConnect = async () => {
    if (stacksIsConnected()) {
      const userData = getLocalStorage();
      const stxAddr = userData?.addresses?.stx?.[0]?.address ?? null;
      if (stxAddr) {
        setAddress(stxAddr);
        setAddresses({
          stx: (userData?.addresses?.stx ?? []).map((a: { address: string }) => ({ address: a.address, symbol: 'STX', purpose: NETWORK })),
          btc: (userData?.addresses?.btc ?? []).map((a: { address: string }) => ({ address: a.address, symbol: 'BTC', purpose: NETWORK }))
        });
        setIsConnected(true);
      }
      return;
    }
    setIsConnecting(true);
    try {
      // connect() returns { addresses: AddressEntry[] }. Call with no params to avoid "Invalid parameters"
      // from wallets that don't support the network param for getAddresses; they use their default network.
      const response = await connect();
      const list = response?.addresses ?? [];
      const stxList = list.filter((a: { address: string; symbol?: string }) => a.symbol === 'STX' || a.address.startsWith('S'));
      const btcList = list.filter((a: { address: string; symbol?: string }) => a.symbol === 'BTC' || (a.address && !a.address.startsWith('S')));
      const stxAddr = stxList[0]?.address ?? null;
      console.log('[WalletContext] connect() response:', list.length, 'addresses');
      if (stxAddr) {
        setIsConnected(true);
        setAddress(stxAddr);
        setAddresses({
          stx: stxList.map((a: { address: string }) => ({ address: a.address, symbol: 'STX', purpose: NETWORK })),
          btc: btcList.map((a: { address: string }) => ({ address: a.address, symbol: 'BTC', purpose: NETWORK }))
        });
        console.log("[WalletContext] Connected:", stxAddr);
      }
    } catch (error) {
      console.error("[WalletContext] Error connecting:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    try {
      stacksDisconnect();
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
