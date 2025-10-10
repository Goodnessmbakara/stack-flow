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
// import { getProfitZones } from "../blockchain/stacks/profitZoneCalculator";
import { calculatePremiumsCached, type StrikeData } from "../blockchain/stacks/premiumCalculator";
import { getAssetPrice } from "../blockchain/stacks/assetPrices";

type TokenType = 'STX' | 'BTC';

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
      // Ensure amount is never empty or zero
      const validAmount = amount === "" || parseFloat(amount) <= 0 ? "1" : amount;
      setState((prev) => ({ ...prev, amount: validAmount }));
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

  // calculate Strike (Cost) and premium using real Black-Scholes
  useEffect(() => {
    const fetchPremium = async () => {
      // Don't calculate if we don't have required data
      if (!state.amount || !state.period || !state.assetPrice || state.assetPrice === 0) {
        console.log('[AppContext] Skipping premium calculation - missing data');
        return;
      }

      setState((prev) => ({ ...prev, isFetchingPremiums: true }));

      try {
        // Map strategy names to calculator format
        const strategyMap: Record<string, 'CALL' | 'STRAP' | 'BCSP' | 'BPSP' | 'PUT' | 'STRIP' | 'BEPS' | 'BECS'> = {
          'CALL': 'CALL',
          'Call': 'CALL',
          'STRAP': 'STRAP',
          'Strap': 'STRAP',
          'Bull Call Spread': 'BCSP',
          'Bull Put Spread': 'BPSP',
          'PUT': 'PUT',
          'Put': 'PUT',
          'STRIP': 'STRIP',
          'Strip': 'STRIP',
          'Bear Put Spread': 'BEPS',
          'Bear Call Spread': 'BECS',
        };

        const mappedStrategy = strategyMap[state.strategy] || 'CALL';

        const strikeDataArray: StrikeData[] = await calculatePremiumsCached({
          amount: Number(state.amount),
          period: Number(state.period),
          currentPrice: state.assetPrice,
          strategy: mappedStrategy,
          asset: state.asset,
        });

        // Convert StrikeData to our format
        const combinedData = strikeDataArray.map((data) => ({
          premium: data.premium.toString(),
          profitZone: data.profitZone,
        }));

        setState((prev) => ({
          ...prev,
          premiumAndProfitZone: combinedData,
          selectedPremium: combinedData[0]?.premium || '0',
          selectedProfitZone: combinedData[0]?.profitZone || 0,
        }));

        console.log('[AppContext] ✓ Premium calculation complete:', combinedData.length, 'strikes');
      } catch (err) {
        console.error('[AppContext] Premium calculation failed:', err);
        // Keep existing values on error
      } finally {
        setState((prev) => ({ ...prev, isFetchingPremiums: false }));
      }
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
