import { arbitrum } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

export const wagmiConfig = getDefaultConfig({
  appName: "Optrix.finance",
  projectId: "3114d3c28803a5d487e6f5b2d5e0655b",
  chains: [arbitrum],
  ssr: true,
});
