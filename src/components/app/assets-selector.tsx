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
    <div className="p-5 rounded-lg bg-[#1D2215] border border-white/5 shadow-lg">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#37f741]/70">Asset Type</h2>
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant={selectedAsset === "STX" ? "gradient" : "default"}
          className={`h-auto py-3 px-2 flex-col items-center justify-center text-center transition-all duration-300 ${
            selectedAsset === "STX"
              ? "text-[#090909] scale-[1.02]"
              : "text-[#ECECEC] border-[#37f741]/30 hover:border-[#37f741]/60"
          }`}
          onClick={() => handleAssetChange("STX")}
        >
          <Icons.trending className={`w-5 h-5 mb-1 ${selectedAsset === "STX" ? "text-black" : "text-[#37f741]"}`} />
          <span className="text-xs font-bold leading-tight">Capital Sentiment</span>
        </Button>
        <Button
          variant={selectedAsset === "BTC" ? "gradient" : "default"}
          className={`h-auto py-3 px-2 flex-col items-center justify-center text-center transition-all duration-300 ${
            selectedAsset === "BTC"
              ? "text-[#090909] scale-[1.02]"
              : "text-[#ECECEC] border-[#37f741]/30 hover:border-[#37f741]/60"
          }`}
          onClick={() => handleAssetChange("BTC")}
        >
          <Icons.users className={`w-5 h-5 mb-1 ${selectedAsset === "BTC" ? "text-black" : "text-[#bbf838]"}`} />
          <span className="text-xs font-bold leading-tight">Social Sentiment</span>
        </Button>
      </div>
    </div>
  );
}
