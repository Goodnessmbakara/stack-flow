import { useAppContext } from "../../context/AppContext";
import { AssetSelector } from "../app/assets-selector";
import { PriceSelector } from "../app/price-selector";
import { SentimentSelector } from "../app/sentiment-selector";
import { StrategySelector } from "../app/strategy-selector";
import { TradeSummary } from "../app/trade-summary";
import { TradingChart } from "../app/trading-chart";
import CopyTrading from "../app/copy-trading";
import MemeInvesting from "../app/meme-investing";
import ReferralModal from "../molecules/ReferralModal";

export default function DappPage() {
  const { state } = useAppContext();
  const { asset, sentiment, strategy } = state;

  // "Social Sentiment" is the BTC asset button
  const showCopyTrading = asset === "BTC" && strategy === "Copy Trading";
  const showMemeInvesting =
    asset === "BTC" && strategy === "Meme-Driven Investing";
  const showSocialFeatures = showCopyTrading || showMemeInvesting;

  return (
    <div className="p-0 m-0">
      <ReferralModal />

      <div className="space-y-4">
        <div className="flex flex-col items-start w-full gap-4 md:flex-row">
          <div className="w-full md:max-w-[388px] space-y-4 mx-auto">
            <AssetSelector selectedAsset={asset} />
            {asset === "STX" && (
              <SentimentSelector selectedSentiment={sentiment} />
            )}
            <StrategySelector
              selectedStrategy={strategy}
              selectedSentiment={sentiment}
              asset={asset}
            />
          </div>
          <div className="w-full lg:max-w-[667px] bg-[#1D2215] p-7 rounded-lg min-h-[400px]">
            {showCopyTrading && <CopyTrading />}
            {showMemeInvesting && <MemeInvesting />}
            <TradingChart asset={asset} visible={!showSocialFeatures} />
          </div>
        </div>

        {!showSocialFeatures && (
          <div className="flex flex-col items-start w-full gap-4 md:flex-row">
            <PriceSelector />
            <div className="">
              <TradeSummary />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
