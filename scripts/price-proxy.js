import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const CACHE_TTL = 30 * 1000; // 30 seconds
const cache = new Map();

const assetMap = {
  STX: { coingecko: 'blockstack', coincap: 'stacks', binance: 'STXUSDT' },
  BTC: { coingecko: 'bitcoin', coincap: 'bitcoin', binance: 'BTCUSDT' },
  ETH: { coingecko: 'ethereum', coincap: 'ethereum', binance: 'ETHUSDT' },
  ALEX: { coingecko: 'alexgo', coincap: null, binance: null },
  WELSH: { coingecko: 'welshcorgicoin', coincap: null, binance: null },
  SBTC: { coingecko: 'bitcoin', coincap: 'bitcoin', binance: 'BTCUSDT' }, // Pegged to BTC
};

// Fallback constants
const fallbacks = { 
  STX: 1.50, 
  BTC: 96000, 
  ETH: 3300, 
  ALEX: 0.15, 
  WELSH: 0.002,
  SBTC: 96000 
};

async function fetchFromCoinCap(id) {
  try {
    const resp = await axios.get(`https://api.coincap.io/v2/assets/${id}`, { timeout: 5000 });
    return parseFloat(resp.data.data.priceUsd);
  } catch (e) {
    return null;
  }
}

async function fetchFromCoinGecko(id) {
  try {
    const resp = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`, { timeout: 5000 });
    return resp.data[id]?.usd;
  } catch (e) {
    return null;
  }
}

async function fetchFromBinance(symbol) {
  try {
    const resp = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, { timeout: 5000 });
    return parseFloat(resp.data.price);
  } catch (e) {
    return null;
  }
}

app.get('/api/prices', async (req, res) => {
  const asset = req.query.asset?.toUpperCase();
  if (!asset || !assetMap[asset]) {
    return res.status(400).json({ error: 'Invalid asset' });
  }

  const cached = cache.get(asset);
  if (cached && (Date.now() - cached.ts) < CACHE_TTL) {
    return res.json(cached.data);
  }

  const config = assetMap[asset];
  let price = null;
  let source = '';

  // Try sources in order based on availability
  if (config.coincap) {
    price = await fetchFromCoinCap(config.coincap);
    source = 'CoinCap';
  }

  if (!price && config.binance) {
    price = await fetchFromBinance(config.binance);
    source = 'Binance';
  }

  if (!price && config.coingecko) {
    price = await fetchFromCoinGecko(config.coingecko);
    source = 'CoinGecko';
  }

  if (!price) {
    price = fallbacks[asset];
    source = 'Fallback';
  }

  const result = { price, timestamp: Date.now(), source };
  cache.set(asset, { ts: Date.now(), data: result });
  res.json(result);
});

const port = process.env.PRICE_PROXY_PORT || 5177;
app.listen(port, () => console.log(`[price-proxy] listening on http://localhost:${port}`));
