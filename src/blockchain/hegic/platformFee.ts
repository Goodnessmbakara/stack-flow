const CONTRACT_ADDRESS_USDCe = "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8";

import erc20ABI from "./ERC20ABI.json";
import { writeContract } from "@wagmi/core";
import { wagmiConfig } from "../../utils/wagmi";
import { ENVIRONMENT } from "../../utils/environment";
import { parseUnits } from "viem";

export const takePlatformFree = async (trxAmount: number) => {
  const platformFee = trxAmount / 1000;
  const feeWalletAddress = ENVIRONMENT.PLATFORM_FEE_ADDRESS;

  const feeSentHash = await writeContract(wagmiConfig, {
    address: CONTRACT_ADDRESS_USDCe,
    abi: erc20ABI,
    functionName: "transfer",
    args: [feeWalletAddress, parseUnits(platformFee.toString(), 6)],
  });

  console.log("feeSent", feeSentHash);
  // if (!feeSent) {
  //   throw new Error("Error in sending platform fee");
  // }
  return feeSentHash;
};
