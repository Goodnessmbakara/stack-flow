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
    <div className="p-4 rounded-lg bg-[#1D2215] border border-white/5 shadow-lg">
      <h2 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#37f741]/60">Asset Type</h2>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={selectedAsset === "STX" ? "gradient" : "default"}
          className={`h-auto py-2 px-1.5 flex-col items-center justify-center text-center transition-all duration-300 ${
            selectedAsset === "STX"
              ? "text-[#090909] scale-[1.01]"
              : "text-[#ECECEC] border-[#37f741]/20 hover:border-[#37f741]/40"
          }`}
          onClick={() => handleAssetChange("STX")}
        >
          <Icons.trending className={`w-4 h-4 mb-1 ${selectedAsset === "STX" ? "text-black" : "text-[#37f741]"}`} />
          <span className="text-[11px] font-bold leading-tight">Capital Sentiment</span>
        </Button>
        <Button
          variant={selectedAsset === "BTC" ? "gradient" : "default"}
          className={`h-auto py-2 px-1.5 flex-col items-center justify-center text-center transition-all duration-300 ${
            selectedAsset === "BTC"
              ? "text-[#090909] scale-[1.01]"
              : "text-[#ECECEC] border-[#37f741]/20 hover:border-[#37f741]/40"
          }`}
          onClick={() => handleAssetChange("BTC")}
        >
          <Icons.users className={`w-4 h-4 mb-1 ${selectedAsset === "BTC" ? "text-black" : "text-[#bbf838]"}`} />
          <span className="text-[11px] font-bold leading-tight">Social Sentiment</span>
        </Button>
      </div>
    </div>
  );
}
