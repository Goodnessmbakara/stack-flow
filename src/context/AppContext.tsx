import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
// import { useNavigate } from "react-router-dom";
import { TSentiment, TokenType } from "../lib/types";
import { usePriceData } from "../hooks/useRealTimeData";

// TODO: Implement Stacks premium calculator
// import calculatePremium from "../blockchain/stacks/premiumCalculator";

// Placeholder function for now
// const calculatePremium = async (
//   _amount: number,
//   _period: string,
//   _asset: string
// ): Promise<number[]> => {
//   // Placeholder implementation
//   return [100, 200, 300, 400, 500]; // Mock premiums
// };

type AppContextState = {
  period: string;
  amount: string;
  selectedPremium: string;
  selectedProfitZone: number;
  asset: TokenType;
  sentiment: TSentiment;
  strategy: string;
  premiumAndProfitZone: Array<{
    premium: string;
    profitZone: number;
  }>;
  isFetching: boolean;
  isFetchingPremiums: boolean;
  assetPrice: number;
  priceChange24h: number;
};

interface AppContextType {
  state: AppContextState;
  handlePeriodChange: (period: string) => void;
  handleAmountChange: (amount: string) => void;
  handlePremiumSelect: (profitZone: string) => void;
  handleAssetChange: (asset: TokenType) => void;
  handleSentimentChange: (sentiment: TSentiment) => void;
  handleStrategyChange: (strategy: string) => void;
  formatNumber: (num: number) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: ReactNode }) {
  // const navigate = useNavigate();
  const [state, setState] = useState<AppContextState>({
    period: "7",
    amount: "1",
    selectedPremium: "0",
    selectedProfitZone: 0,
    asset: "STX" as TokenType,
    sentiment: "bull" as TSentiment,
    strategy: "CALL",
    premiumAndProfitZone: [],
    isFetching: false,
    isFetchingPremiums: false,
    assetPrice: 0,
    priceChange24h: 0,
  });

  // Use real-time price data
  const { price: realTimePrice, priceChange24h: realTimePriceChange, loading: priceLoading } = usePriceData(state.asset);

  // Update state when real-time price changes - with safe handling
  useEffect(() => {
    setState(prev => ({
      ...prev,
      assetPrice: realTimePrice || 0,
      priceChange24h: realTimePriceChange ?? 0, // Use nullish coalescing to handle undefined
      isFetching: priceLoading
    }));
  }, [realTimePrice, realTimePriceChange, priceLoading]);

  const handlePeriodChange = useCallback(
    (period: string) => {
      setState((prev) => ({ ...prev, period }));
    },
    []
  );

  const handleAmountChange = useCallback(
    (amount: string) => {
      setState((prev) => ({ ...prev, amount }));
    },
    []
  );

  const handlePremiumSelect = useCallback(
    (profitZone: string) => {
      setState((prev) => ({
        ...prev,
        selectedProfitZone: Number(profitZone),
        selectedPremium:
          state.premiumAndProfitZone.find(
            (item) => item.profitZone.toString() === profitZone
          )?.premium || "0",
      }));
    },
    [state.premiumAndProfitZone]
  );

  const handleAssetChange = useCallback(
    (asset: TokenType) => {
      setState((prev) => ({ ...prev, asset }));
    },
    []
  );

  const handleSentimentChange = useCallback(
    (sentiment: TSentiment) => {
      setState((prev) => ({ ...prev, sentiment }));
    },
    []
  );

  const formatNumber = useCallback((num: number) => {
    // Safe handling of number formatting
    if (typeof num !== 'number' || isNaN(num)) {
      return '$0.00';
    }
    return Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num);
  }, []);

  const handleStrategyChange = useCallback(
    (strategy: string) => {
      setState((prev) => ({ ...prev, strategy }));
    },
    []
  );

  // Check if current strategy is a social strategy
  const isSocialStrategy = (strategy: string) => {
    return strategy === "Copy Trading" || strategy === "Meme-Driven Investing";
  };

  // calculate Strike (Cost) and premium - only for capital sentiment strategies
  useEffect(() => {
    // Skip premium calculation for social strategies
    if (isSocialStrategy(state.strategy)) {
      return;
    }

    const calculatePremiumData = async () => {
      setState((prev) => ({ ...prev, isFetchingPremiums: true }));

      try {
        // Simulate premium calculation with real price data
        const mockPremiums = Array.from({ length: 5 }, (_, i) => ({
          premium: ((realTimePrice || 100) * (0.05 + i * 0.02)).toFixed(2),
          profitZone: Math.floor((realTimePrice || 100) * (1.1 + i * 0.05)),
        }));

        setState((prev) => ({
          ...prev,
          premiumAndProfitZone: mockPremiums,
          selectedProfitZone: mockPremiums[0]?.profitZone || 0,
          selectedPremium: mockPremiums[0]?.premium || "0",
          isFetchingPremiums: false,
        }));
      } catch (error) {
        console.error("Error calculating premiums:", error);
        setState((prev) => ({
          ...prev,
          premiumAndProfitZone: [],
          selectedProfitZone: 0,
          selectedPremium: "0",
          isFetchingPremiums: false,
        }));
      }
    };

    // Only calculate if we have a valid price
    if (realTimePrice && realTimePrice > 0) {
      calculatePremiumData();
    }
  }, [state.asset, state.strategy, state.sentiment, realTimePrice]);

  return (
    <AppContext.Provider
      value={{
        state,
        handlePeriodChange,
        handleAmountChange,
        handlePremiumSelect,
        handleAssetChange,
        handleSentimentChange,
        handleStrategyChange,
        formatNumber,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }
  return context;
}
