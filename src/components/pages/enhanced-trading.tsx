import { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { AssetSelector } from "../app/assets-selector";
import { PriceSelector } from "../app/price-selector";
import { SentimentSelector } from "../app/sentiment-selector";
import { StrategySelector } from "../app/strategy-selector";
import { TradeSummary } from "../app/trade-summary";
import { TradingChart } from "../app/trading-chart";
import { SocialSentimentDashboard } from "../app/social-sentiment-dashboard";
import { WhaleTracker } from "../app/whale-tracker";
import { MemeSignals } from "../app/meme-signals";

import { Icons } from "../ui/icons";
import ReferralModal from "../molecules/ReferralModal";

export default function EnhancedTradingPage() {
  const { state } = useAppContext();
  const { asset, sentiment, strategy } = state;
  const [activeView, setActiveView] = useState<'trading' | 'social'>('trading');

  return (
    <div className="p-0 m-0">
      <ReferralModal />

      {/* View Toggle */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-[#1D2215] p-1 rounded-lg max-w-md">
          <button
            onClick={() => setActiveView('trading')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeView === 'trading'
                ? 'bg-linear-to-r from-[#37f741] to-[#FDEE61] text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Icons.call className="w-4 h-4" />
              Options Trading
            </div>
          </button>
          <button
            onClick={() => setActiveView('social')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeView === 'social'
                ? 'bg-linear-to-r from-[#37f741] to-[#FDEE61] text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Icons.users className="w-4 h-4" />
              Social Sentiment
            </div>
          </button>
        </div>
      </div>

      {activeView === 'trading' ? (
        <div className="space-y-4">
          {/* Trading Interface */}
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

          {/* Social Sentiment Preview for BTC trades */}
          {asset === "BTC" && (
            <div className="mt-8">
              <div className="bg-[#1D2215] rounded-lg p-6 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                      <Icons.users className="w-5 h-5 text-[#bbf838]" />
                      Social Trading Insights for {asset}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      See how whales and the community are trading {asset}.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveView('social')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#37f741]/10 hover:bg-[#37f741]/20 text-[#37f741] transition-colors text-sm font-medium"
                  >
                    <span>View Full Analysis</span>
                    <Icons.arrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <WhaleTracker maxWhales={3} />
                <MemeSignals maxSignals={3} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Full Social Sentiment Dashboard */}
          <SocialSentimentDashboard />
          
          {/* Quick Trading Actions */}
          <div className="bg-[#1D2215] rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Icons.trending className="w-5 h-5 text-[#bbf838]" />
              Quick Trade Based on Sentiment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setActiveView('trading');
                  // Could also auto-select bullish sentiment and call strategy
                }}
                className="p-4 bg-[#121412] rounded-lg border border-green-500/20 hover:border-green-500/40 transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Icons.arrowUpRight className="w-5 h-5 text-green-400" />
                  <span className="text-white font-medium">Follow Bullish Whales</span>
                </div>
                <p className="text-gray-400 text-sm">Copy successful bullish strategies from top whales</p>
              </button>
              
              <button
                onClick={() => {
                  setActiveView('trading');
                  // Could also auto-select volatile sentiment and strap strategy
                }}
                className="p-4 bg-[#121412] rounded-lg border border-yellow-500/20 hover:border-yellow-500/40 transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Icons.waves className="w-5 h-5 text-yellow-400" />
                  <span className="text-white font-medium">Volatility Play</span>
                </div>
                <p className="text-gray-400 text-sm">Trade high volatility based on meme signals</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
