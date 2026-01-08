import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { dbService } from '../src/lib/db.ts';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuration
const DISCOVERY_INTERVAL = parseInt(process.env.WHALE_DISCOVERY_INTERVAL || '3600000'); // 1 hour
const UPDATE_INTERVAL = parseInt(process.env.WHALE_UPDATE_INTERVAL || '900000'); // 15 minutes
const MIN_BALANCE = parseInt(process.env.WHALE_MIN_BALANCE || '10000'); // 10K STX
const MIN_TRANSACTIONS = parseInt(process.env.WHALE_MIN_TRANSACTIONS || '10');
const TOP_N = parseInt(process.env.WHALE_TOP_N || '100');
const STACKS_API_URL = process.env.VITE_STACKS_API_URL || 'https://api.mainnet.hiro.so';

// Known exchanges and contracts to filter out
const EXCLUDED_ADDRESSES = new Set([
  'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR', // Arkadiko
  'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9', // Alex
  'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1', // Velar
  'SP1Z92MPDQEWZXW36VX71Q25HKF5K2EPCJ304F275', // StackSwap
  'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9', // Gamma
]);

// Protocol mapping
const PROTOCOL_CONTRACTS = {
  'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9': 'Alex',
  'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR': 'Arkadiko',
  'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1': 'Velar',
  'SP1Z92MPDQEWZXW36VX71Q25HKF5K2EPCJ304F275': 'StackSwap',
  'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9': 'Gamma',
};

// Rate limiting
let lastApiCall = 0;
const MIN_API_INTERVAL = 250; // 250ms between API calls

async function rateLimitedFetch(url) {
  const now = Date.now();
  const timeSinceLastCall = now - lastApiCall;
  
  if (timeSinceLastCall < MIN_API_INTERVAL) {
    await new Promise(r => setTimeout(r, MIN_API_INTERVAL - timeSinceLastCall));
  }
  
  lastApiCall = Date.now();
  return fetch(url);
}

/**
 * Fetch address balance from Stacks API
 */
async function fetchAddressBalance(address) {
  try {
    const response = await rateLimitedFetch(
      `${STACKS_API_URL}/extended/v1/address/${address}/balances`
    );
    
    if (!response.ok) {
      console.error(`[WhaleIndexer] Balance fetch failed for ${address}: ${response.status}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`[WhaleIndexer] Error fetching balance for ${address}:`, error.message);
    return null;
  }
}

/**
 * Fetch recent transactions for an address with retry logic
 */
async function fetchAddressTransactions(address, limit = 50, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await rateLimitedFetch(
        `${STACKS_API_URL}/extended/v1/address/${address}/transactions?limit=${limit}`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.results || [];
      }
      
      // Handle different error codes
      if (response.status === 500) {
        console.warn(`[WhaleIndexer] API 500 error for ${address}, attempt ${attempt}/${retries}`);
        if (attempt < retries) {
          // Exponential backoff: 1s, 2s, 4s
          const backoffMs = Math.pow(2, attempt - 1) * 1000;
          console.log(`[WhaleIndexer] Retrying in ${backoffMs}ms...`);
          await new Promise(r => setTimeout(r, backoffMs));
          continue;
        }
      } else if (response.status === 429) {
        console.warn(`[WhaleIndexer] Rate limited for ${address}, backing off...`);
        await new Promise(r => setTimeout(r, 5000)); // Wait 5s for rate limit
        if (attempt < retries) continue;
      } else {
        console.error(`[WhaleIndexer] Transaction fetch failed for ${address}: ${response.status}`);
      }
      
      return []; // Return empty on final failure
    } catch (error) {
      console.error(`[WhaleIndexer] Error fetching transactions for ${address} (attempt ${attempt}):`, error.message);
      if (attempt === retries) return [];
      
      // Backoff on network errors too
      const backoffMs = Math.pow(2, attempt - 1) * 1000;
      await new Promise(r => setTimeout(r, backoffMs));
    }
  }
  
  return [];
}

/**
 * Identify protocols from transactions
 */
function identifyProtocols(transactions) {
  const protocols = new Set();
  
  transactions.forEach(tx => {
    if (tx.tx_type === 'contract_call' && tx.contract_call?.contract_id) {
      const [contractAddress] = tx.contract_call.contract_id.split('.');
      const protocol = PROTOCOL_CONTRACTS[contractAddress];
      if (protocol) {
        protocols.add(protocol);
      }
    }
  });
  
  return Array.from(protocols);
}

/**
 * Calculate composite whale score
 */
function calculateWhaleScore(whale) {
  // Balance score (0-100 based on percentile)
  const balanceScore = Math.min(100, (whale.portfolio.stxBalance / 1000000) * 10);
  
  // Activity score (0-100 based on transaction count)
  const activityScore = Math.min(100, whale.stats.txCount30d * 2);
  
  // Diversity score (0-100 based on protocols used)
  const diversityScore = Math.min(100, whale.stats.protocolsUsed.length * 20);
  
  // Weighted composite
  const composite = (
    balanceScore * 0.50 +
    activityScore * 0.30 +
    diversityScore * 0.20
  );
  
  return {
    composite: Math.round(composite),
    balance: Math.round(balanceScore),
    activity: Math.round(activityScore),
    diversity: Math.round(diversityScore)
  };
}

/**
 * Check if address should be excluded
 */
function isExcludedAddress(address) {
  return EXCLUDED_ADDRESSES.has(address);
}

/**
 * Discover top whales from blockchain
 */
async function discoverTopWhales() {
  console.log('[WhaleIndexer] 🔍 Starting whale discovery...');
  
  try {
    // Get top addresses by STX balance
    // Note: Hiro API doesn't have a direct endpoint for this,
    // so we'll use a heuristic approach: fetch recent high-value transactions
    // and build a set of addresses, then fetch their balances
    
    console.log('[WhaleIndexer] Fetching recent high-value transactions...');
    const txResponse = await rateLimitedFetch(
      `${STACKS_API_URL}/extended/v1/tx?limit=200`
    );
    
    if (!txResponse.ok) {
      throw new Error(`Failed to fetch transactions: ${txResponse.status}`);
    }
    
    const txData = await txResponse.json();
    const transactions = txData.results || [];
    
    // Extract unique sender addresses
    const addressSet = new Set();
    transactions.forEach(tx => {
      if (tx.sender_address && !isExcludedAddress(tx.sender_address)) {
        addressSet.add(tx.sender_address);
      }
    });
    
    console.log(`[WhaleIndexer] Found ${addressSet.size} unique addresses from recent transactions`);
    
    // Fetch balances and analyze each address
    const potentialWhales = [];
    let processed = 0;
    
    for (const address of addressSet) {
      processed++;
      if (processed % 10 === 0) {
        console.log(`[WhaleIndexer] Progress: ${processed}/${addressSet.size} addresses analyzed`);
      }
      
      // Fetch balance and transactions
      const [balance, addressTxs] = await Promise.all([
        fetchAddressBalance(address),
        fetchAddressTransactions(address, 50)
      ]);
      
      if (!balance) continue;
      
      const stxBalance = parseInt(balance.stx.balance) / 1_000_000;
      const stxLocked = parseInt(balance.stx.locked) / 1_000_000;
      
      // Filter: minimum balance and transaction count
      if (stxBalance < MIN_BALANCE) continue;
      
      // Get last 30 days of transactions
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const recentTxs = addressTxs.filter(tx => 
        tx.burn_block_time && (tx.burn_block_time * 1000) > thirtyDaysAgo
      );
      
      if (recentTxs.length < MIN_TRANSACTIONS) continue;
      
      // Identify protocols
      const protocols = identifyProtocols(addressTxs);
      
      // Calculate volume
      const volume30d = recentTxs.reduce((sum, tx) => {
        return sum + (parseInt(tx.fee_rate || '0') / 1_000_000);
      }, 0);
      
      // Determine activity level
      let activityLevel = 'low';
      if (recentTxs.length >= 50) activityLevel = 'high';
      else if (recentTxs.length >= 20) activityLevel = 'medium';
      
      const lastTx = addressTxs[0];
      const lastActiveAt = lastTx 
        ? new Date(lastTx.burn_block_time * 1000).toISOString()
        : new Date().toISOString();
      
      // Build whale profile
      const whale = {
        address,
        discoveredAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        
        portfolio: {
          stxBalance,
          stxLocked,
          tokens: [],
          totalValueUSD: stxBalance * 1.5, // Rough estimate
          percentile: 0 // Will calculate after sorting
        },
        
        stats: {
          txCount30d: recentTxs.length,
          txCount90d: addressTxs.length,
          volume30dSTX: volume30d,
          protocolsUsed: protocols,
          lastActiveAt,
          activityLevel
        },
        
        source: 'auto_discovered',
        verified: false,
        alias: null
      };
      
      // Calculate scores
      whale.scores = calculateWhaleScore(whale);
      
      potentialWhales.push(whale);
    }
    
    // Sort by composite score
    potentialWhales.sort((a, b) => b.scores.composite - a.scores.composite);
    
    // Take top N and calculate percentiles
    const topWhales = potentialWhales.slice(0, TOP_N);
    topWhales.forEach((whale, index) => {
      whale.portfolio.percentile = Math.round(((TOP_N - index) / TOP_N) * 100);
    });
    
    console.log(`[WhaleIndexer] ✅ Discovered ${topWhales.length} whales`);
    
    return topWhales;
  } catch (error) {
    console.error('[WhaleIndexer] ❌ Error during whale discovery:', error);
    return [];
  }
}

/**
 * Store whales in MongoDB
 */
async function storeWhales(whales) {
  try {
    const collection = dbService.getCollection('whales');
    
    for (const whale of whales) {
      await collection.updateOne(
        { address: whale.address },
        { $set: whale },
        { upsert: true }
      );
    }
    
    console.log(`[WhaleIndexer] ✅ Stored ${whales.length} whales in MongoDB`);
  } catch (error) {
    console.error('[WhaleIndexer] ❌ Error storing whales:', error.message);
  }
}

/**
 * Update existing tracked whales
 */
async function updateTrackedWhales() {
  console.log('[WhaleIndexer] 🔄 Updating tracked whales...');
  
  try {
    const collection = dbService.getCollection('whales');
    const existingWhales = await collection.find({}).toArray();
    
    console.log(`[WhaleIndexer] Updating ${existingWhales.length} existing whales...`);
    
    let updated = 0;
    for (const whale of existingWhales) {
      const [balance, transactions] = await Promise.all([
        fetchAddressBalance(whale.address),
        fetchAddressTransactions(whale.address, 50)
      ]);
      
      if (!balance) continue;
      
      const stxBalance = parseInt(balance.stx.balance) / 1_000_000;
      const stxLocked = parseInt(balance.stx.locked) / 1_000_000;
      
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const recentTxs = transactions.filter(tx => 
        tx.burn_block_time && (tx.burn_block_time * 1000) > thirtyDaysAgo
      );
      
      const protocols = identifyProtocols(transactions);
      
      whale.portfolio.stxBalance = stxBalance;
      whale.portfolio.stxLocked = stxLocked;
      whale.portfolio.totalValueUSD = stxBalance * 1.5;
      whale.stats.txCount30d = recentTxs.length;
      whale.stats.protocolsUsed = protocols;
      whale.lastUpdated = new Date().toISOString();
      
      whale.scores = calculateWhaleScore(whale);
      
      await collection.updateOne(
        { address: whale.address },
        { $set: whale }
      );
      
      updated++;
    }
    
    console.log(`[WhaleIndexer] ✅ Updated ${updated} whales`);
  } catch (error) {
    console.error('[WhaleIndexer] ❌ Error updating whales:', error.message);
  }
}

/**
 * Create MongoDB indexes
 */
async function createIndexes() {
  try {
    const collection = dbService.getCollection('whales');
    
    await collection.createIndex({ address: 1 }, { unique: true });
    await collection.createIndex({ 'scores.composite': -1 });
    await collection.createIndex({ 'portfolio.stxBalance': -1 });
    await collection.createIndex({ 'stats.lastActiveAt': -1 });
    
    console.log('[WhaleIndexer] ✅ Created MongoDB indexes');
  } catch (error) {
    console.error('[WhaleIndexer] Error creating indexes:', error.message);
  }
}

/**
 * Main indexer loop
 */
async function startIndexer() {
  console.log('[WhaleIndexer] 🚀 Starting Whale Indexer Service');
  console.log(`[WhaleIndexer] Discovery interval: ${DISCOVERY_INTERVAL / 1000 / 60} minutes`);
  console.log(`[WhaleIndexer] Update interval: ${UPDATE_INTERVAL / 1000 / 60} minutes`);
  console.log(`[WhaleIndexer] Min balance: ${MIN_BALANCE} STX`);
  console.log(`[WhaleIndexer] Min transactions: ${MIN_TRANSACTIONS}`);
  
  // Connect to MongoDB
  try {
    await dbService.connect();
    await createIndexes();
  } catch (error) {
    console.error('[WhaleIndexer] Failed to connect to MongoDB:', error);
  }
  
  // Initial discovery
  const whales = await discoverTopWhales();
  await storeWhales(whales);
  
  // Schedule periodic discovery
  setInterval(async () => {
    const newWhales = await discoverTopWhales();
    await storeWhales(newWhales);
  }, DISCOVERY_INTERVAL);
  
  // Schedule periodic updates
  setInterval(async () => {
    await updateTrackedWhales();
  }, UPDATE_INTERVAL);
  
  console.log('[WhaleIndexer] ✅ Indexer running');
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'whale-indexer',
    mongodb: dbService.isConnected()
  });
});

// Start the indexer
startIndexer();

const port = process.env.WHALE_INDEXER_PORT || 5180;
app.listen(port, () => console.log(`[whale-indexer] Health endpoint on http://localhost:${port}`));
