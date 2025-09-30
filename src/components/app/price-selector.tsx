import { Slider } from "../ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useAppContext } from "../../context/AppContext";
import Loader from "../atoms/Loader";

export function PriceSelector() {
  const {
    state,
    handlePeriodChange,
    handleAmountChange,
    handlePremiumSelect,
    formatNumber,
  } = useAppContext();

  const {
    premiumAndProfitZone,
    isFetchingPremiums,
    asset,
    selectedPremium,
    selectedProfitZone,
  } = state;

  return (
    <>
      <div className="bg-[#1D2215] p-6 rounded-lg space-y-2">
        <p className="text-sm text-[#ECECEC]">Amount</p>
        <div className="space-y-2">
          <div className="bg-gradient-to-r w-full h-[50px] from-[#BDF738] rounded-lg to-[#FDEE61] overflow-hidden p-px">
            <div className="rounded-lg px-5  bg-[#171717] h-full flex justify-between items-center">
              <input
                type="number"
                className="h-full w-[70%] bg-transparent border-none outline-none text-sm text-[#D6D6D6]"
                // placeholder="1"
                value={state.amount}
                onChange={(value) => handleAmountChange(value.target.value)}
              />
              <p className="text-sm text-[#7A7A7A]">{asset}</p>
            </div>
          </div>
          <p className="text-xs text-[#666666]">
            Limit: 30.5261 (check limits)
          </p>
        </div>
      </div>

      {/* period */}
      <div className="bg-[#1D2215] p-6 rounded-lg flex flex-col justify-between">
        <p className="text-sm text-[#ECECEC]">
          Period: <span className="text-white">{state.period} days</span>
        </p>

        <Slider
          defaultValue={[+state.period]}
          onValueChange={(value) => handlePeriodChange(value[0].toString())}
          max={90}
          min={7}
          step={1}
          className="cursor-grab"
        />

        <p className="text-xs text-[#666666]">Expiration Date: 28 Nov, 12:31</p>
      </div>

      {/* profit zone */}
      <div className="bg-[#1D2215] p-6 rounded-lg space-y-2">
        <p className="text-sm text-[#ECECEC]">Profit Zone</p>
        <div className="space-y-2">
          <div className="bg-gradient-to-r w-full h-[50px] from-[#BDF738] rounded-lg to-[#FDEE61] overflow-hidden p-px">
            <Select
              value={selectedProfitZone.toString()}
              onValueChange={handlePremiumSelect}
            >
              <SelectTrigger className="w-full bg-[#171717] h-full border-none outline-none rounded-lg">
                <SelectValue className="text-[#D6D6D6] text-sm">
                  {isFetchingPremiums ? (
                    <Loader />
                  ) : (
                    premiumAndProfitZone.length > 0 &&
                    formatNumber(
                      (Number(selectedProfitZone) as unknown as number) ||
                        premiumAndProfitZone[0].profitZone
                    )
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="border border-[#666666]">
                {!isFetchingPremiums &&
                  premiumAndProfitZone &&
                  premiumAndProfitZone.map((el) => (
                    <SelectItem
                      key={el.profitZone}
                      value={el.profitZone.toString()}
                    >
                      {formatNumber(el.profitZone)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          {/* <p></p> */}
        </div>
      </div>
    </>
  );
}
