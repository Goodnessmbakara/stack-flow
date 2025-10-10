import { Icons } from "../ui/icons";
import { TSentiment } from "../../lib/types";
import { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { memeDataService } from "../../services/memeDataService";

const bullStrategies = {
  tag: "bull",
  items: [
    {
      name: "Call",
      description: "High profits if the price rises sharply",
    },
    {
      name: "Strap",
      description:
        "High profits if the price rises sharply, reasonable profits if the price falls",
    },
    {
      name: "Bull Call Spread",
      description:
        "Low cost, decent profits if the price rises to a certain level",
    },
    {
      name: "Bull Put Spread",
      description:
        "Low cost, decent profits if the price stays at a certain level or rises",
    },
  ],
};

const bearStrategies = {
  tag: "bear",
  items: [
    {
      name: "Put",
      description: "High profits if the price falls sharply",
    },
    {
      name: "Strip",
      description:
        "High profits if the price falls sharply, reasonable profits if the price rises",
    },
    {
      name: "Bear Call Spread",
      description:
        "Low cost, decent profits if the price falls to a certain level",
    },
    {
      name: "Bear Put Spread",
      description:
        "Low cost, decent profits if the price stays at a certain level or falls",
    },
  ],
};

const highVolStrategies = {
  tag: "high",
  items: [
    {
      name: "Long Straddle",
      description: "High profits if the price changes sharply in either direction",
    },
    {
      name: "Long Strangle",
      description: "High profits if the price changes sharply, lower cost than straddle",
    },
    {
      name: "Short Iron Condor",
      description: "Decent profits if the price changes significantly",
    },
    {
      name: "Short Iron Butterfly",
      description: "High profits if the price changes significantly",
    },
  ],
};

const lowVolStrategies = {
  tag: "low",
  items: [
    {
      name: "Short Straddle",
      description: "Decent profits if the price stays relatively stable",
    },
    {
      name: "Short Strangle",
      description: "Decent profits if the price doesn't change much",
    },
    {
      name: "Long Iron Condor",
      description: "Decent profits if the price changes slightly",
    },
    {
      name: "Long Condor",
      description: "Decent profits if the price changes slightly",
    },
  ],
};

const sentiments = [
  bullStrategies,
  bearStrategies,
  highVolStrategies,
  lowVolStrategies,
];

const socialStrategies = [
  {
    name: "Copy Trading",
    description: "Automatically mirror whale and efficient trader wallets.",
  },
  {
    name: "Meme-Driven Investing",
    description: "Community pools driven by viral content and meme culture.",
  },
];

type Props = {
  selectedStrategy: string;
  selectedSentiment: TSentiment;
  asset: string;
};

export function StrategySelector({
  selectedStrategy,
  selectedSentiment,
  asset,
}: Props) {
  const { handleStrategyChange } = useAppContext();
  const [memeStats, setMemeStats] = useState<{trending: number, totalPools: number}>({
    trending: 0,
    totalPools: 0
  });

  const currentStrategies =
    asset === "STX"
      ? sentiments.find(
          (sentiment) =>
            sentiment.tag.toLowerCase() === selectedSentiment.toLowerCase()
        )?.items || sentiments[0].items
      : socialStrategies;

  // Fetch live meme data for Social Sentiment tab
  useEffect(() => {
    if (asset === "BTC") {
      const fetchMemeStats = async () => {
        try {
          const [trendingMemes, memePools] = await Promise.all([
            memeDataService.getTrendingMemeCoins(),
            memeDataService.getMemeBasedPools()
          ]);
          setMemeStats({
            trending: trendingMemes.length,
            totalPools: memePools.length
          });
        } catch (error) {
          console.error('Failed to fetch meme stats:', error);
        }
      };
      fetchMemeStats();
    }
  }, [asset]);

  useEffect(() => {
    const defaultStrategy =
      asset === "STX"
        ? sentiments?.find(
            (sentiment) =>
              sentiment.tag?.toLowerCase() === selectedSentiment?.toLowerCase()
          )?.items?.[0]?.name ??
          sentiments?.[0]?.items?.[0]?.name ??
          ""
        : "Copy Trading";

    if (!defaultStrategy) return;

    handleStrategyChange(defaultStrategy);
  }, [selectedSentiment, asset]);

  // Enhanced descriptions for social strategies with live data
  const getEnhancedStrategy = (strategy: any) => {
    if (asset === "BTC" && strategy.name === "Meme-Driven Investing") {
      return {
        ...strategy,
        description: `${memeStats.totalPools} live pools from ${memeStats.trending} trending memes. Real-time viral score tracking.`
      };
    }
    return strategy;
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 ">
      {currentStrategies?.map((strategy, i) => {
        const enhancedStrategy = getEnhancedStrategy(strategy);
        return (
          <div
            className={`p-px rounded-lg ${
              selectedStrategy?.toLowerCase() === strategy.name.toLowerCase()
                ? " bg-gradient-to-r from-[#37f741] to-[#FDEE61]"
                : " bg-transparent"
            }`}
            key={i}
          >
            <div
              key={i}
              className={`p-3 rounded-lg h-full cursor-pointer space-y-3 bg-gradient-to-b from-[#1D2215] to-[#121412] hover:from-[#252825] hover:to-[#1a1f1a] transition-all`}
              onClick={() => {
                handleStrategyChange(strategy.name);
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-transparent bg-gradient-to-r from-[#37f741] to-[#FDEE61] bg-clip-text font-semibold">
                  {strategy.name}
                </p>
                {asset === "BTC" && strategy.name === "Meme-Driven Investing" && memeStats.trending > 0 && (
                  <span className="text-xs bg-[#37f741] text-black px-2 py-1 rounded font-bold">
                    🔥 {memeStats.trending}
                  </span>
                )}
              </div>

              <Icons.call />

              <p className="text-sm text-[#ECECEC]">{enhancedStrategy.description}</p>
              
              {/* Live stats for social strategies */}
              {asset === "BTC" && (
                <div className="text-xs text-gray-400 border-t border-gray-700 pt-2 mt-2">
                  {strategy.name === "Copy Trading" && "🐋 Track successful traders • 📊 Auto-copy trades"}
                  {strategy.name === "Meme-Driven Investing" && memeStats.totalPools > 0 && 
                    `🎭 ${memeStats.totalPools} active pools • ⚡ Real-time sentiment`}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
