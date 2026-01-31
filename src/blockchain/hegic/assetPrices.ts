import { priceService } from "../../services/priceService";

export const getEthPrice = async (): Promise<number> => {
  return priceService.getCurrentPrice("ETH");
};

export const getBtcPrice = async (): Promise<number> => {
  return priceService.getCurrentPrice("BTC");
};

export const getStxPrice = async (): Promise<number> => {
  return priceService.getCurrentPrice("STX");
};

export const getAssetPrice = async (asset: string): Promise<number> => {
  const upperAsset = asset.toUpperCase();
  if (upperAsset === 'ETH' || upperAsset === 'BTC' || upperAsset === 'STX') {
    return priceService.getCurrentPrice(upperAsset as any);
  }
  throw new Error(`Unsupported asset: ${asset}`);
};
