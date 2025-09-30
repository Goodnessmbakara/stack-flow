import { useAppContext } from "../../context/AppContext";
import { AssetSelector } from "../app/assets-selector";
import { PriceSelector } from "../app/price-selector";
import { SentimentSelector } from "../app/sentiment-selector";
import { StrategySelector } from "../app/strategy-selector";
import { TradeSummary } from "../app/trade-summary";
import { TradingChart } from "../app/trading-chart";
import ReferralModal from "../molecules/ReferralModal";

export default function DappPage() {
  const { state } = useAppContext();
  const { asset, sentiment, strategy } = state;

  return (
    <div className="p-0 m-0">
      <ReferralModal />

      <div className="space-y-4">
        <div className="flex flex-col items-start w-full gap-4 md:flex-row">
          <div className="w-full md:max-w-[388px] space-y-4 mx-auto">
            <AssetSelector selectedAsset={asset} />
            <SentimentSelector selectedSentiment={sentiment} />
            <StrategySelector
              selectedStrategy={strategy}
              selectedSentiment={sentiment}
            />
          </div>
          <div className="w-full lg:max-w-[667px] bg-[#1D2215] p-7 rounded-lg">
            <TradingChart asset={asset} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <PriceSelector />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <TradeSummary />
        </div>
      </div>
    </div>
  );
}
