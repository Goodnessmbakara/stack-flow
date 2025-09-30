import { Contract, parseEther, parseUnits, formatUnits } from "ethers";
import calculatorABI from "./CalculatorABI.json";
import hegicContracts from "./hegicContracts";
import { provider } from "./provider";

// Helper Function: Get Premium
const getPremium = async (
  contractAddress: string,
  timeInSeconds: number,
  amountInETH: bigint
): Promise<string> => {
  try {
    if (!provider) {
      throw new Error("Provider is not defined");
    }

    const calculatorContract = new Contract(
      contractAddress,
      calculatorABI,
      provider
    );

    const premium = await calculatorContract.calculatePremium(
      timeInSeconds,
      amountInETH,
      0
    );

    // console.log("premium", premium);
    const premiumInUsdc = formatUnits(premium.toString(), 6);
    console.log("premium In USDc", premiumInUsdc);
    return premiumInUsdc;
  } catch (error) {
    console.error("Error calculating premium:", error);
    throw error;
  }
};

export type TokenType = "ETH" | "BTC";

const calculatePremium = async (
  amount: number,
  days: number,
  optionType: string,
  token: TokenType
): Promise<string[] | string | null> => {
  try {
    console.log(
      "==> ",
      amount,
      "amount",
      days,
      "days",
      optionType,
      "optionType",
      token,
      "token"
    );

    let premium: string[] | string = [];
    const timeInSeconds = Number(days * 86_400);

    switch (token) {
      case "ETH": {
        const amountInETH = parseEther(amount.toString());
        let ethContracts: Record<string, string> | string;

        switch (optionType) {
          case "CALL":
            ethContracts = hegicContracts.PriceCalculator.CALL.ETH as Record<
              string,
              string
            >;
            premium = await Promise.all(
              Object.values(ethContracts).map((contractAddress) =>
                getPremium(contractAddress, timeInSeconds, amountInETH)
              )
            );
            // console.error("Call premium", premium);
            return premium;

          case "PUT":
            ethContracts = hegicContracts.PriceCalculator.PUT.ETH as Record<
              string,
              string
            >;
            console.log("Contracts: ", ethContracts);
            premium = await Promise.all(
              Object.values(ethContracts).map((contractAddress) =>
                getPremium(contractAddress, timeInSeconds, amountInETH)
              )
            );
            return premium;

          // STRAP has only one calculator contracct and Profit Zone
          case "STRAP":
            ethContracts = hegicContracts.PriceCalculator.STRAP.ETH as string;
            console.log("Contracts: ", ethContracts);
            premium = await getPremium(
              ethContracts,
              timeInSeconds,
              amountInETH
            );
            return [premium];

          case "STRIP":
            ethContracts = hegicContracts.PriceCalculator.STRIP
              .ETH as unknown as Record<string, string>;
            console.log("Contracts: ", ethContracts);
            if (typeof ethContracts === "string") {
              premium = await getPremium(
                ethContracts,
                timeInSeconds,
                amountInETH
              );
              premium = [premium];
            } else {
              premium = await Promise.all(
                Object.values(ethContracts).map((contractAddress) =>
                  getPremium(contractAddress, timeInSeconds, amountInETH)
                )
              );
            }
            return premium;

          default:
            throw new Error("Invalid Option Type");
        }
      }

      case "BTC": {
        const amountInBTC = parseUnits(amount.toString(), 8);
        let btcContracts: Record<string, string> | string;

        switch (optionType) {
          case "CALL":
            btcContracts = hegicContracts.PriceCalculator.CALL.BTC as Record<
              string,
              string
            >;
            premium = await Promise.all(
              Object.values(btcContracts).map((contractAddress) =>
                getPremium(contractAddress, timeInSeconds, amountInBTC)
              )
            );
            break;

          case "PUT":
            btcContracts = hegicContracts.PriceCalculator.PUT.BTC as Record<
              string,
              string
            >;
            premium = await Promise.all(
              Object.values(btcContracts).map((contractAddress) =>
                getPremium(contractAddress, timeInSeconds, amountInBTC)
              )
            );
            break;

          case "STRAP":
            btcContracts = hegicContracts.PriceCalculator.STRAP.BTC as
              | Record<string, string>
              | string;
            if (typeof btcContracts === "string") {
              premium = await getPremium(
                btcContracts,
                timeInSeconds,
                amountInBTC
              );
              premium = [premium];
            } else {
              premium = await Promise.all(
                Object.values(btcContracts).map((contractAddress) =>
                  getPremium(contractAddress, timeInSeconds, amountInBTC)
                )
              );
            }
            break;

          case "STRIP":
            btcContracts = hegicContracts.PriceCalculator.STRIP.BTC as
              | Record<string, string>
              | string;
            if (typeof btcContracts === "string") {
              premium = await getPremium(
                btcContracts,
                timeInSeconds,
                amountInBTC
              );
              premium = [premium];
            } else {
              premium = await Promise.all(
                Object.values(btcContracts).map((contractAddress) =>
                  getPremium(contractAddress, timeInSeconds, amountInBTC)
                )
              );
            }
            break;

          default:
            throw new Error("Invalid Option Type");
        }
        break;
      }
    }

    return premium;
  } catch (error) {
    console.log("Calculate Premium Error", error);
    return null;
  }
};
export default calculatePremium;
