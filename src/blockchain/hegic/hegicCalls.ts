import { writeContract, readContract, getAccount } from "@wagmi/core";
import { parseEther,  } from "viem";
import erc20ABI from "./ERC20ABI.json";
import investABI from "./investABI.json";
import { wagmiConfig } from "../../utils/wagmi";
import { ethers, MaxInt256 } from "ethers";
import { takePlatformFree } from "./platformFee";

interface HegicStrategyParams {
  optionType: OptionType;
  amount: number;
  period: string;
  asset: Asset;
  index: number;
  premium: number;
}

export enum OptionType {
  CALL = "CALL",
  PUT = "PUT",
  STRAP = "STRAP",
  STRIP = "STRIP",
  BULLCALL = "BULLCALL",
  BEARCALL = "BEARCALL",
  BULLPUT = "BULLPUT",
  BEARPUT = "BEARPUT",
  STRADDLE = "STRADDLE",
  STRANGLE = "STRANGLE",
  CONDOR = "CONDOR",
  BUTTERFLY = "BUTTERFLY",
}

export enum Asset {
  ETH = "ETH",
  BTC = "BTC",
}

interface StrategyCallParams {
  strategy: string;
  amount: number;
  period: number;
  premium: number;
}

const strategyCall = async ({
  strategy,
  amount,
  period,
}: StrategyCallParams) => {
  try {
    if (amount <= 0 || period <= 0) {
      throw new Error("Invalid Amount Or Days");
    }

    const CONTRACT_ADDRESS_ARB = "0x7740FC99bcaE3763a5641e450357a94936eaF380";
    const CONTRACT_ADDRESS_USDCe = "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8";
    const amountInETH = parseEther(amount.toString());
    const timeInSeconds = period * 86_400;
    const account = getAccount(wagmiConfig).address;

    // taking platform fee

    // First approve USDC
    const allowance = await readContract(wagmiConfig, {
      address: CONTRACT_ADDRESS_USDCe,
      abi: erc20ABI,
      functionName: "allowance",
      args: [account, CONTRACT_ADDRESS_ARB],
    });

    if (allowance === 0n) {
      const approvalHash = await writeContract(wagmiConfig, {
        address: CONTRACT_ADDRESS_USDCe,
        abi: erc20ABI,
        functionName: "approve",
        args: [CONTRACT_ADDRESS_ARB, MaxInt256],
      });
      console.log("Approval Hash:", approvalHash);
    }

    const feeTakenHash = await takePlatformFree(amount);

    console.log("feeTakenHash", feeTakenHash);

    if (!feeTakenHash) {
      throw new Error("Error in taking platform fee");
    }

    // Then execute the strategy purchase
    const purchaseHash = await writeContract(wagmiConfig, {
      address: CONTRACT_ADDRESS_ARB,
      abi: investABI,
      functionName: "buyWithReferal",
      args: [
        strategy,
        amountInETH,
        BigInt(timeInSeconds),
        [],
        ethers.ZeroAddress,
      ],
    });

    return purchaseHash;
  } catch (error) {
    console.error(error);
    return { status: false, message: "Transaction failed" };
  }
};

export async function callHegicStrategyContract({
  optionType,
  amount,
  period,
  asset,
  index,
  premium,
}: HegicStrategyParams) {
  try {
    const strategies: Record<Asset, Record<OptionType, string[]>> = {
      [Asset.ETH]: {
        [OptionType.CALL]: [
          "0x09a4B65b3144733f1bFBa6aEaBEDFb027a38Fb60",
          "0xF48f571DdD77dba9Ae10fefF6df04484685091D9",
        ],
        [OptionType.PUT]: [
          "0xaA0DfBFb8dA7f45BB41c0fB68B71FAEB959B22aa",
          "0x6B7e5906F53d8bB365f4A6fA776Fd0f0caf57881",
        ],
        [OptionType.STRAP]: ["0x64622a28F97D877E9Ff1E2A7322786A58c3D8Fc7"],
        [OptionType.STRIP]: ["0x812CEcB0519d972809091594B82bf580452955A6"],

        // some have multiple contracts based on the profit zones
        [OptionType.BULLCALL]: ["0x5c59f7ec23C0Bace3B1959C99A43FFd30078E5bE"],
        [OptionType.BEARCALL]: ["0x218F71341d6eAaf48b71dA5b24B1B285E1EA9c6a"],
        [OptionType.BULLPUT]: ["0x74986E5DE2899750229d64f9748B1f23Ee9F5caD"],
        [OptionType.BEARPUT]: ["0xc4C3b5050D574CBF3eE0b613104cF5C4E47625d4"],
        [OptionType.STRADDLE]: ["0x5b77F04A304239aA2dF3b7236A3471Ab4e348B7e"],
        [OptionType.STRANGLE]: ["0x6C5140a9296007A8d23a4162B0271aDfaA9cB7BA"],
        [OptionType.CONDOR]: ["0x016F745C91d77685068CF361835f33254eAb058C"],
        [OptionType.BUTTERFLY]: ["0x7F9198b959814f680B0a3E0FB1C01A0d7F6838F9"],
      },
      [Asset.BTC]: {
        [OptionType.CALL]: [
          "0x527d1086C3DD22FcdB338F69D47A1e4bFE11E539",
          "0x20ee3e61e8f1eB8ae959abf5F78bA8731d010Ac3",
        ],
        [OptionType.PUT]: ["0xA8DF600289bEc25602741756f55f27ffFDAB69a6"],
        [OptionType.STRAP]: ["0x2bbC4dd98d897F59f04C6cd8aDaCea880bdf4d93"],
        [OptionType.STRIP]: ["0xeD63Fc0c7E46c4B24425BFEa32D76307D1655316"],
        // some have multiple contracts based on the profit zones
        [OptionType.BULLCALL]: ["0x5D0bc0d08e8A7C09d10df9BB2498f1d4aB986e6A"],
        [OptionType.BEARCALL]: ["0x4085776b53D40452372E991Fe31BD264103BC313"],
        [OptionType.BULLPUT]: ["0x6EA86A0b675dE37e211c27b1Fd844d5F29418661"],
        [OptionType.BEARPUT]: ["0x45b9D63F1998ca31151981792849a64342C88631"],
        [OptionType.STRADDLE]: ["0x7D294eE096293cee0b09f05FB43A3c26fa4B6F57"],
        [OptionType.STRANGLE]: ["0x26E219F01fA57dE868798e358A2517eDb2Ef1E7F"],
        [OptionType.CONDOR]: ["0x58f59d649b808B2c0cb82C4ceb44eD9F29d2f906"],
        [OptionType.BUTTERFLY]: ["0xAcd93bc4F2D886920D601E8e3370791202C76Ff2"],
      },
    };

    const strategyList = strategies[asset][optionType];
    const strategy = strategyList[index] || strategyList[0]; // Default to first if out of bounds

    return await strategyCall({
      strategy,
      amount,
      period: parseFloat(period),
      premium,
    });
  } catch (error) {
    console.error("Error in callHegicStrategyContract:", error);
    throw new Error("Transaction failed");
  }
}
