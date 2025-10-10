import { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { AssetSelector } from "../app/assets-selector";
import { PriceSelector } from "../app/price-selector";
import { SentimentSelector } from "../app/sentiment-selector";
import { StrategySelector } from "../app/strategy-selector";
import { TradeSummary } from "../app/trade-summary";
import { TradingChart } from "../app/trading-chart";
import { WhaleTracker } from "../app/whale-tracker";
import { MemeSignals } from "../app/meme-signals";
import { CopyTradingPools } from "../app/copy-trading-pools";
import { SocialSentimentDemo } from "../molecules/SocialSentimentDemo";
import { Icons } from "../ui/icons";
import ReferralModal from "../molecules/ReferralModal";

export default function DappPage() {
  const { state } = useAppContext();
  const { asset, sentiment, strategy } = state;
  const [showSocialSentiment, setShowSocialSentiment] = useState(false);

  return (
    <div className="p-0 m-0">
      <ReferralModal />

      <div className="space-y-4">
        {/* Main Trading Interface */}
        <div className="flex flex-col items-start w-full gap-4 md:flex-row">
          <div className="w-full md:max-w-[388px] space-y-4 mx-auto">
            <AssetSelector selectedAsset={asset} />
            {asset === "STX" && <SentimentSelector selectedSentiment={sentiment} />}
            <StrategySelector
              selectedStrategy={strategy}
              selectedSentiment={sentiment}
              asset={asset}
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

        {/* Social Sentiment Toggle */}
        <div className="bg-[#1D2215] rounded-lg p-4">
          <button
            onClick={() => setShowSocialSentiment(!showSocialSentiment)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-3">
              <Icons.users className="w-5 h-5 text-[#bbf838]" />
              <div>
                <h3 className="text-lg font-bold text-white">Social Sentiment & Whale Tracking</h3>
                <p className="text-sm text-gray-400">
                  Follow whales, meme signals, and copy trading strategies
                </p>
              </div>
            </div>
            <Icons.arrowUpRight 
              className={`w-5 h-5 text-[#bbf838] transition-transform ${
                showSocialSentiment ? 'rotate-90' : ''
              }`} 
            />
          </button>
        </div>

        {/* Social Sentiment Content */}
        {showSocialSentiment && (
          <div className="space-y-6 animate-in slide-in-from-top duration-300">
            {/* Live Social Sentiment Demo */}
            <SocialSentimentDemo />
            
            {/* Social Trading Overview */}
            <div className="bg-[#1D2215] rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Icons.trending className="w-6 h-6 text-[#bbf838]" />
                Live Social Trading Data
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-[#121412] rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">+67</div>
                  <div className="text-sm text-gray-400">Market Sentiment</div>
                  <div className="text-xs text-green-400 mt-1">Bullish</div>
                </div>
                <div className="bg-[#121412] rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-[#bbf838] mb-1">82%</div>
                  <div className="text-sm text-gray-400">Whale Activity</div>
                  <div className="text-xs text-gray-400 mt-1">Very High</div>
                </div>
                <div className="bg-[#121412] rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-400 mb-1">67.8K</div>
                  <div className="text-sm text-gray-400">Social Mentions</div>
                  <div className="text-xs text-orange-400 mt-1">Trending</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="p-4 bg-[#121412] rounded-lg border border-green-500/20 hover:border-green-500/40 transition-colors text-left">
                  <div className="flex items-center gap-3 mb-2">
                    <Icons.arrowUpRight className="w-5 h-5 text-green-400" />
                    <span className="text-white font-medium">Follow Bullish Trend</span>
                  </div>
                  <p className="text-gray-400 text-sm">Auto-select bullish strategies based on current sentiment</p>
                </button>
                
                <button className="p-4 bg-[#121412] rounded-lg border border-blue-500/20 hover:border-blue-500/40 transition-colors text-left">
                  <div className="flex items-center gap-3 mb-2">
                    <Icons.users className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-medium">Copy Top Whale</span>
                  </div>
                  <p className="text-gray-400 text-sm">Mirror the strategy of the best performing whale</p>
                </button>
              </div>
            </div>

            {/* Social Trading Components */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WhaleTracker maxWhales={5} />
              <MemeSignals maxSignals={4} />
            </div>

            <CopyTradingPools maxPools={3} />
          </div>
        )}
      </div>
    </div>
  );
}
