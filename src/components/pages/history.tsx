import { useEffect, useState } from "react";
// TODO: Implement Stacks positions fetching
// import { getUserStacksPositions, StacksPositionType } from "../../blockchain/stacks/positions";
import CustomConnectButton from "../atoms/ConnectButton";
import { useStacksWallet } from "../../hooks/useStacksWallet";
import closePositionLogo from "./../../assets/icons/closeHegic.svg";

export default function HistoryPage() {
  const { userData } = useStacksWallet();
  const [isFetching, setIsFetching] = useState(false);
  const [isError, setIsError] = useState<Error | null>(null);
  const [positions, setPositions] = useState<any[]>([]);

  useEffect(() => {
    console.log("address", userData?.address);
    if (!userData?.address) return;
    setIsFetching(true);
    // TODO: Implement getUserStacksPositions
    console.log("Fetching Stacks positions for:", userData.address);
    setPositions([]); // Placeholder
    setIsFetching(false);
  }, [userData?.address]);
  
  return (
    <div className="bg-[#1D2215] h-fit rounded-lg py-7 px-6">
      {!userData?.address && <CustomConnectButton />}
      {isError && (
        <div className="font-semibold text-white">
          Error: {isError?.message}
        </div>
      )}
      {isFetching && (
        <div className="flex items-center justify-center h-full self-center">
          <div className="w-4 h-4 bg-white/80 rounded-full animate-[flash_0.5s_ease-out_infinite_alternate] delay-100" />
        </div>
      )}
      {positions && (
        <div className="rounded-lg flex items-center justify-between flex-col gap-8">
          {positions.map((el: any) => (
            <div className="bg-[#252A1C] p-4 flex items-center gap-8 justify-between w-full m">
              <div>
                <span className="text-green-400 font-semibold">
                  {el.amount}
                </span>
                <span className="text-gray-400 ml-1">Calls</span>
                <div className="text-gray-400 text-sm">≈${el.markPrice}</div>
              </div>

              <div>
                <div className="text-gray-400 text-sm">Profit Zone</div>
                <div className="text-white">${"4,198"}</div>
              </div>

              <div>
                <div className="text-gray-400 text-sm">Net P&L</div>
                <div className="text-red-400">-${el.negPnl}</div>
              </div>

              <div>
                <div className="text-gray-400 text-sm">Expires In</div>
                <div className="text-white">{el.expirationTimestamp}</div>
              </div>

              <img src={closePositionLogo} alt="" className="text-white " />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
