import axios from "axios";

type CacheEntry = {
  price: number;
  timestamp: number;
};

type PriceCache = {
  [key: string]: CacheEntry;
};

const CACHE_DURATION = 30 * 1000; // 30 seconds cache duration
const priceCache: PriceCache = {};

const getCachedPrice = (asset: string): number | null => {
  const cacheEntry = priceCache[asset];
  if (!cacheEntry) return null;

  const now = Date.now();
  if (now - cacheEntry.timestamp > CACHE_DURATION) return null;

  return cacheEntry.price;
};

const setCachedPrice = (asset: string, price: number): void => {
  priceCache[asset] = {
    price,
    timestamp: Date.now(),
  };
};

export const getEthPrice = async (): Promise<number> => {
  const cachedPrice = getCachedPrice("ETH");
  if (cachedPrice !== null) return cachedPrice;

  try {
    const response = await axios.get(
      "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD"
    );

    const price = response.data?.USD;
    if (!price) throw new Error("Invalid API response format");

    setCachedPrice("ETH", price);
    return price;
  } catch (error) {
    console.error("Error fetching ETH price:", error);
    const lastCachedPrice = priceCache["ETH"]?.price;
    if (lastCachedPrice) return lastCachedPrice;
    throw error;
  }
};

export const getBtcPrice = async (): Promise<number> => {
  const cachedPrice = getCachedPrice("BTC");
  if (cachedPrice !== null) return cachedPrice;

  try {
    const response = await axios.get(
      "https://api.coindesk.com/v1/bpi/currentprice.json"
    );
    const price = parseFloat(response.data?.bpi?.USD?.rate.replace(",", ""));
    if (isNaN(price)) throw new Error("Invalid API response format");

    setCachedPrice("BTC", price);
    return price;
  } catch (error) {
    console.error("Error fetching BTC price:", error);
    const lastCachedPrice = priceCache["BTC"]?.price;
    if (lastCachedPrice) return lastCachedPrice;
    throw error;
  }
};

export const getStxPrice = async (): Promise<number> => {
  const cachedPrice = getCachedPrice("STX");
  if (cachedPrice !== null) return cachedPrice;

  try {
    const response = await axios.get(
      "https://min-api.cryptocompare.com/data/price?fsym=STX&tsyms=USD"
    );

    const price = response.data?.USD;
    if (!price) throw new Error("Invalid API response format");

    setCachedPrice("STX", price);
    return price;
  } catch (error) {
    console.error("Error fetching STX price:", error);
    const lastCachedPrice = priceCache["STX"]?.price;
    if (lastCachedPrice) return lastCachedPrice;
    // Return a fallback price if API fails
    return 1.85; // Fallback STX price
  }
};

export const getAssetPrice = async (asset: string): Promise<number> => {
  const upperAsset = asset.toUpperCase();
  switch (upperAsset) {
    case "ETH":
      return getEthPrice();
    case "BTC":
      return getBtcPrice();
    case "STX":
      return getStxPrice();
    default:
      throw new Error(`Unsupported asset: ${asset}`);
  }
};
