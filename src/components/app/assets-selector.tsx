"use client";

import { Icons } from "../ui/icons";
import Button from "../atoms/Button";
import { useAppContext } from "../../context/AppContext";

interface AssetSelectorProps {
  selectedAsset: string;
}

export function AssetSelector({ selectedAsset }: AssetSelectorProps) {
  const { handleAssetChange } = useAppContext();

  return (
    <div className="p-4 h-[113px] rounded-lg px-6 py-5 bg-[#1D2215]">
      <h2 className="mb-2 text-sm text-[#ECECEC]">Asset</h2>
      <div className="flex w-full gap-2 *:w-full">
        <Button
          variant={selectedAsset === "STX" ? "gradient" : "default"}
          className={`font-bold font-lato text-xs ${
            selectedAsset === "STX"
              ? "text-[#090909]"
              : "text-[#ECECEC] border border-[#BDF738]"
          }`}
          onClick={() => handleAssetChange("STX")}
        >
          <Icons.eth className="w-4 h-4 mr-2" />
          Capital Sentiment
        </Button>
        <Button
          variant={selectedAsset === "BTC" ? "gradient" : "default"}
          className={`font-bold font-lato text-xs ${
            selectedAsset === "BTC"
              ? "text-[#090909]"
              : "text-[#ECECEC] border border-[#BDF738]"
          }`}
          onClick={() => handleAssetChange("BTC")}
        >
          <Icons.bitcoin className="w-4 h-4 mr-2" />
          Social Sentiment
        </Button>
      </div>
    </div>
  );
}
