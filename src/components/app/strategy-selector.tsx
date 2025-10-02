import { Icons } from "../ui/icons";
import { TSentiment } from "../../lib/types";
import { useEffect } from "react";
import { useAppContext } from "../../context/AppContext";

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
      name: "Bear Put Spread",
      description:
        "Low cost, decent profits if the price falls to a certain level",
    },
    {
      name: "Bear Call Spread",
      description:
        "Low cost, decent profits if the price stays at a certain level or falls",
    },
  ],
};

const highVolStrategies = {
  tag: "high",
  items: [
    {
      name: "Straddle",
      description:
        "High profits if the price rises or falls sharply during the period of holding",
    },
    {
      name: "Strangle",
      description:
        "Low cost, very high profits if the price rises or falls significantly",
    },
  ],
};

const lowVolStrategies = {
  tag: "low",
  items: [
    {
      name: "Long Butterfly",
      description:
        "Low cost, high profits if the price is about a strike price",
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
  const currentStrategies = asset === "STX" ? sentiments.find(
    (sentiment) =>
      sentiment.tag.toLowerCase() === selectedSentiment.toLowerCase()
  )?.items || sentiments[0].items : socialStrategies;

  useEffect(() => {
    const defaultStrategy = asset === "STX" ? sentiments?.find(
      (sentiment) =>
        sentiment.tag?.toLowerCase() === selectedSentiment?.toLowerCase()
    )?.items?.[0]?.name ??
    sentiments?.[0]?.items?.[0]?.name ??
    "" : "Copy Trading";

    if (!defaultStrategy) return;

    handleStrategyChange(defaultStrategy);
  }, [selectedSentiment, asset]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 ">
      {currentStrategies?.map((strategy, i) => (
        <div
          className={`p-px rounded-lg ${
            selectedStrategy?.toLowerCase() === strategy.name.toLowerCase()
              ? " bg-gradient-to-r from-[#BDF738] to-[#FDEE61]"
              : " bg-transparent"
          }`}
          key={i}
        >
          <div
            key={i}
            className={`p-3 rounded-lg h-full cursor-pointer space-y-3 bg-gradient-to-b from-[#1D2215] to-[#121412]`}
            onClick={() => {
              handleStrategyChange(strategy.name);
            }}
          >
            <p className="text-transparent bg-gradient-to-r from-[#BDF738] to-[#FDEE61] bg-clip-text">
              {strategy.name}
            </p>

            <Icons.call />

            <p className="text-sm text-[#ECECEC]">{strategy.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
