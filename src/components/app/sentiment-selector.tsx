import Button from "../atoms/Button";
import { Icons } from "../ui/icons";
import { TSentiment } from "../../lib/types";
import { useAppContext } from "../../context/AppContext";

interface SentimentSelectorProps {
  selectedSentiment: TSentiment;
}

const sentimentOptions = [
  { tag: "bull", name: "Bullish", icon: <Icons.arrowUpRight /> },
  { tag: "bear", name: "bearish", icon: <Icons.arrowDownRight /> },
  { tag: "high", name: "High Volatility", icon: <Icons.waves /> },
  { tag: "low", name: "Low Volatility", icon: <Icons.waves /> },
];

export function SentimentSelector({
  selectedSentiment,
}: SentimentSelectorProps) {
  const { handleSentimentChange } = useAppContext();

  return (
    <div className="px-6 py-4 rounded-lg bg-[#1D2215]">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-sm text-[#ECECEC]">Sentiment:</h2>
        <span className="text-sm font-bold text-white capitalize">
          {
            sentimentOptions.find(
              (sentiment) =>
                sentiment.tag.toLowerCase() === selectedSentiment.toLowerCase()
            )?.name
          }
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {sentimentOptions.map((sentiment, index) => (
          <Button
            key={index}
            className="grid p-1 border-none h-11 w-full place-items-center bg-[#171717]"
            onClick={() => handleSentimentChange(sentiment.tag as TSentiment)}
            variant={
              selectedSentiment === sentiment.tag ? "gradient" : "default"
            }
          >
            {sentiment.icon}
          </Button>
        ))}
      </div>
    </div>
  );
}
