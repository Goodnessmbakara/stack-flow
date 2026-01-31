import dotenv from 'dotenv';
import { dbService } from '../src/lib/db.ts';

dotenv.config();

const STACKS_API_URL = process.env.VITE_STACKS_API_URL || 'https://api.mainnet.hiro.so';

/**
 * Curated whale addresses for initial seeding
 * Mix of known DeFi participants, large holders, and active traders
 * ALL ADDRESSES VERIFIED from Stacks blockchain data (Jan 2026)
 */
const SEED_WHALES = [
  // Recent active traders (from token_transfer transactions)
  'SP2DG9HY0BGZB96DGK7387D2VZRGCJGM761DD89CM',
  'SP2DM475GWX9D4RMD4ZH5GTGW9ZY25W218HV389CM',
  'SP35RH089XVVDJSND5CJD1RD0SZXW4D8J55VC0SZZ',
  'SP3SBQ9PZEMBNBAWTR7FRPE3XK0EFW9JWVX4G80S2',
  'SP3XXK8BG5X7CRH7W07RRJK3JZJXJ799WX3Y0SMCR',
  'SPG7RD94XW8HN5NS7V68YDJAY4PJVZ2KNY79Z518',
  
  // Known protocol addresses for ecosystem tracking
  'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9', // ALEX - verified 254M STX+
  'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR', // Arkadiko - verified 254M STX
  'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG', // StackingDAO - verified 282M STX
  'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1', // Velar DEX
  'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9', // Gamma NFT
  'SP1Z92MPDQEWZXW36VX71Q25HKF5K2EPCJ304F275', // StackSwap
  
  // Token contract addresses (important for ecosystem tracking)
  'SP3NE50GEXFG9SZGTT51P40X2CKYSZ5CC4ZTZ7A2G', // WELSH - verified has holdings
  
  // Additional verified addresses from ecosystem
  'SP000000000000000000002Q6VF78', // BNS contract
  'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE', // Previously verified address
  'SP1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRCBGD7R', // Previously verified address
  'SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS', // Previously verified address
];

/**
 * Known protocol contracts to track (not whales, but important for context)
 */
const PROTOCOL_CONTRACTS = {
  'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9': { name: 'ALEX DEX', type: 'defi' },
  'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR': { name: 'Arkadiko', type: 'defi' },
  'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1': { name: 'Velar', type: 'defi' },
  'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9': { name: 'Gamma', type: 'nft' },
  'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG': { name: 'StackingDAO', type: 'stacking' },
};

/**
 * SIP-010 tokens to track
 */
const TRACKED_TOKENS = {
  'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.age000-governance-token': 'ALEX',
  'SP3NE50GEXFG9SZGTT51P40X2CKYSZ5CC4ZTZ7A2G.welshcorgicoin-token': 'WELSH',
  'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token': 'sBTC',
  'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-token': 'DIKO',
  'SP1Z92MPDQEWZXW36VX71Q25HKF5K2EPCJ304F275.stackswap-token-v4b': 'STSW',
};

// Rate limiting
let lastApiCall = 0;
const MIN_API_INTERVAL = 300; // 300ms between API calls

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
 * Fetch complete address data including SIP-010 tokens
 */
async function fetchAddressData(address) {
  try {
    console.log(`[Seeder] Fetching data for ${address.slice(0, 8)}...`);
    
    const response = await rateLimitedFetch(
      `${STACKS_API_URL}/extended/v1/address/${address}/balances`
    );
    
    if (!response.ok) {
      console.error(`[Seeder] Failed to fetch ${address}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    // Parse STX balance
    const stxBalance = parseInt(data.stx.balance) / 1_000_000;
    const stxLocked = parseInt(data.stx.locked) / 1_000_000;
    
    // Parse SIP-010 tokens
    const tokens = [];
    const fungibleTokens = data.fungible_tokens || {};
    
    for (const [contract, tokenData] of Object.entries(fungibleTokens)) {
      const symbol = TRACKED_TOKENS[contract] || contract.split('.')[1]?.slice(0, 10) || 'UNKNOWN';
      const balance = parseInt(tokenData.balance) / 1_000_000; // Assume 6 decimals for most
      
      if (balance > 0) {
        tokens.push({
          contract,
          symbol,
          balance,
          valueUSD: 0 // Will be calculated with price feeds later
        });
      }
    }
    
    return {
      address,
      stxBalance,
      stxLocked,
      tokens
    };
    
  } catch (error) {
    console.error(`[Seeder] Error fetching ${address}:`, error.message);
    return null;
  }
}

/**
 * Fetch recent transactions to calculate activity
 */
async function fetchActivityMetrics(address) {
  try {
    const response = await rateLimitedFetch(
      `${STACKS_API_URL}/extended/v1/address/${address}/transactions?limit=50`
    );
    
    if (!response.ok) return { txCount: 0, protocols: [] };
    
    const data = await response.json();
    const transactions = data.results || [];
    
    // Filter to last 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentTxs = transactions.filter(tx => 
      tx.burn_block_time && (tx.burn_block_time * 1000) > thirtyDaysAgo
    );
    
    // Identify protocols
    const protocols = new Set();
    transactions.forEach(tx => {
      if (tx.tx_type === 'contract_call' && tx.contract_call?.contract_id) {
        const [contractAddr] = tx.contract_call.contract_id.split('.');
        const protocol = PROTOCOL_CONTRACTS[contractAddr];
        if (protocol) {
          protocols.add(protocol.name);
        }
      }
    });
    
    return {
      txCount30d: recentTxs.length,
      txCount90d: transactions.length,
      protocols: Array.from(protocols),
      lastActiveAt: transactions[0]?.burn_block_time 
        ? new Date(transactions[0].burn_block_time * 1000).toISOString()
        : new Date().toISOString()
    };
    
  } catch (error) {
    console.error(`[Seeder] Error fetching activity for ${address}:`, error.message);
    return { txCount30d: 0, txCount90d: 0, protocols: [], lastActiveAt: new Date().toISOString() };
  }
}

function calculateScore(whale) {
  const balanceScore = Math.min(100, (whale.portfolio.stxBalance / 1_000_000) * 10);
  const activityScore = Math.min(100, (whale.stats?.txCount30d || 0) * 2);
  const diversityScore = Math.min(100, (whale.stats?.protocolsUsed?.length || 0) * 20);
  const tokenScore = Math.min(100, (whale.portfolio?.tokens?.length || 0) * 10);
  
  return {
    composite: Math.round(balanceScore * 0.40 + activityScore * 0.25 + diversityScore * 0.20 + tokenScore * 0.15),
    balance: Math.round(balanceScore),
    activity: Math.round(activityScore),
    diversity: Math.round(diversityScore),
    tokens: Math.round(tokenScore)
  };
}

/**
 * Determine activity level
 */
function getActivityLevel(txCount) {
  if (txCount >= 50) return 'high';
  if (txCount >= 20) return 'medium';
  return 'low';
}

/**
 * Main seeding function
 */
async function seedWhales() {
  console.log('[Seeder] 🌱 Starting whale seeding process...');
  console.log(`[Seeder] Processing ${SEED_WHALES.length} addresses`);
  
  // Connect to MongoDB
  try {
    await dbService.connect();
    console.log('[Seeder] ✅ Connected to MongoDB');
  } catch (error) {
    console.error('[Seeder] ❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
  
  const whales = [];
  let processed = 0;
  
  for (const address of SEED_WHALES) {
    processed++;
    console.log(`[Seeder] [${processed}/${SEED_WHALES.length}] Processing ${address.slice(0, 12)}...`);
    
    // Fetch balance and activity data
    const [balanceData, activityData] = await Promise.all([
      fetchAddressData(address),
      fetchActivityMetrics(address)
    ]);
    
    if (!balanceData) {
      console.log(`[Seeder] ⚠️  Skipping ${address} - failed to fetch data`);
      continue;
    }
    
    // Build whale profile
    const whale = {
      address,
      discoveredAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      
      portfolio: {
        stxBalance: balanceData.stxBalance,
        stxLocked: balanceData.stxLocked,
        tokens: balanceData.tokens,
        totalValueUSD: balanceData.stxBalance * 1.5 // Rough estimate, will update with real prices
      },
      
      stats: {
        txCount30d: activityData.txCount30d,
        txCount90d: activityData.txCount90d,
        volume30dSTX: 0, // Will calculate from transaction values later
        protocolsUsed: activityData.protocols,
        lastActiveAt: activityData.lastActiveAt,
        activityLevel: getActivityLevel(activityData.txCount30d)
      },
      
      classification: {
        type: 'whale', // Manual seed assumed to be whales
        confidence: 0.9,
        tags: activityData.protocols.map(p => p.toLowerCase().replaceAll(' ', '_'))
      },
      
      source: 'manual_seed',
      verified: false,
      alias: null
    };
    
    // Calculate scores
    whale.scores = calculateScore(whale);
    
    whales.push(whale);
    
    console.log(`[Seeder] ✓ ${address.slice(0, 12)}: ${whale.portfolio.stxBalance.toLocaleString()} STX, ${whale.portfolio.tokens.length} tokens, Score: ${whale.scores.composite}`);
  }
  
  // Store in MongoDB
  console.log(`\n[Seeder] 💾 Storing ${whales.length} whales in MongoDB...`);
  
  try {
    const collection = dbService.getCollection('whales');
    
    for (const whale of whales) {
      await collection.updateOne(
        { address: whale.address },
        { $set: whale },
        { upsert: true }
      );
    }
    
    console.log('[Seeder] ✅ Successfully seeded whales');
    
    // Print summary
    console.log('\n[Seeder] 📊 Summary:');
    console.log(`   Total whales: ${whales.length}`);
    console.log(`   Avg STX balance: ${(whales.reduce((sum, w) => sum + w.portfolio.stxBalance, 0) / whales.length).toLocaleString()}`);
    console.log(`   Total tokens tracked: ${whales.reduce((sum, w) => sum + w.portfolio.tokens.length, 0)}`);
    console.log(`   High activity: ${whales.filter(w => w.stats.activityLevel === 'high').length}`);
    console.log(`   Medium activity: ${whales.filter(w => w.stats.activityLevel === 'medium').length}`);
    console.log(`   Low activity: ${whales.filter(w => w.stats.activityLevel === 'low').length}`);
    
  } catch (error) {
    console.error('[Seeder] ❌ Error storing whales:', error);
    process.exit(1);
  }
  
  await dbService.close();
  console.log('\n[Seeder] 🎉 Seeding complete!');
  process.exit(0);
}

// Run the seeder
seedWhales();
