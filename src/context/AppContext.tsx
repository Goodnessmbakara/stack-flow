import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useNavigate } from "react-router-dom";
import { TSentiment } from "../lib/types";
import { getProfitZones } from "../blockchain/hegic/profitZoneCalculator";
// TODO: Implement Stacks premium calculator
// import calculatePremium, { TokenType } from "../blockchain/stacks/premiumCalculator";

// Placeholder types and functions for now
type TokenType = 'STX' | 'BTC';
const calculatePremium = async (amount: number, period: string, asset: string): Promise<number[]> => {
  // Placeholder implementation
  return [100, 200, 300, 400, 500]; // Mock premiums
};
import { getAssetPrice } from "../blockchain/hegic/assetPrices";

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
  assetPrice: number;
  isFetchingPremiums: boolean;
};

type AppContextType = {
  state: AppContextState;
  handlePeriodChange: (period: string) => void;
  handleAmountChange: (amount: string) => void;
  handlePremiumSelect: (strike: string) => void;
  handleAssetChange: (asset: TokenType) => void;
  handleSentimentChange: (sentiment: TSentiment) => void;
  handleStrategyChange: (strategy: string) => void;
  formatNumber: (num: number) => string;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
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
  });

  const handlePeriodChange = useCallback(
    (period: string) => {
      setState((prev) => ({ ...prev, period }));
    },
    [navigate]
  );

  const handleAmountChange = useCallback(
    (amount: string) => {
      setState((prev) => ({ ...prev, amount }));
    },
    [navigate]
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
    [navigate]
  );

  const handleAssetChange = useCallback(
    (asset: TokenType) => {
      setState((prev) => ({ ...prev, asset }));
    },
    [navigate]
  );

  const handleSentimentChange = useCallback(
    (sentiment: TSentiment) => {
      setState((prev) => ({ ...prev, sentiment }));
    },
    [navigate]
  );

  const formatNumber = useCallback((num: number) => {
    return Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num);
  }, []);

  const handleStrategyChange = useCallback(
    (strategy: string) => {
      setState((prev) => ({ ...prev, strategy }));
    },
    [navigate]
  );

  // Check if current strategy is a social strategy
  const isSocialStrategy = (strategy: string) => {
    return strategy === "Copy Trading" || strategy === "Meme-Driven Investing";
  };

  // fetch asset price
  useEffect(() => {
    const fetchAssetPrice = async () => {
      setState((prev) => ({ ...prev, isFetching: true }));
      getAssetPrice(state.asset)
        .then((data) => {
          setState((prev) => ({
            ...prev,
            assetPrice: data,
          }));
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => {
          setState((prev) => ({ ...prev, isFetching: false }));
        });
    };

    fetchAssetPrice();
  }, [state.asset]);

  // calculate Strike (Cost) and premium - only for capital sentiment strategies
  useEffect(() => {
    // Skip premium calculation for social strategies
    if (isSocialStrategy(state.strategy)) {
      return;
    }

    const fetchPremium = async () => {
      setState((prev) => ({ ...prev, isFetchingPremiums: true }));

      calculatePremium(
        Number(state.amount),
        state.period,
        state.asset
      )
        .then((premiums) => {
          const profitZones = getProfitZones(
            premiums.map(p => p.toString()),
            state.strategy,
            state.assetPrice,
            state.amount
          );

          const combinedData = premiums.map((premium, index) => ({
            premium: premium.toString(),
            profitZone: profitZones[index],
          }));

          setState((prev) => ({
            ...prev,
            premiumAndProfitZone: combinedData,
            selectedPremium: combinedData[0]?.premium || "0",
            selectedProfitZone: combinedData[0]?.profitZone || 0,
          }));
        })

        .catch((err) => {
          console.log(err);
        })
        .finally(() => {
          setState((prev) => ({ ...prev, isFetchingPremiums: false }));
        });
    };

    fetchPremium();
  }, [
    state.amount,
    state.period,
    state.strategy,
    state.asset,
    state.sentiment,
    state.assetPrice,
  ]);

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
  if (!context) {
    throw new Error(
      "usePriceSelector must be used within a PriceSelectorProvider"
    );
  }
  return context;
}
