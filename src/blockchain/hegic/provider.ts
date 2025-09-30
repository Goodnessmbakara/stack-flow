import { ENVIRONMENT } from "../../utils/environment";
import { AlchemyProvider } from "ethers";

export const provider = new AlchemyProvider(
  "arbitrum",
  ENVIRONMENT.ARBISCAN_API_KEY
);
