so import { io } from 'socket.io-client';
import { Server } from 'socket.io';
import http from 'http';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { dbService } from '../src/lib/db.ts';

dotenv.config();

const STACKS_API_URL = process.env.VITE_STACKS_API_URL || 'https://api.mainnet.hiro.so';
const UPDATE_THRESHOLD_USD = parseInt(process.env.WHALE_ALERT_THRESHOLD || '50000'); // $50K+ transactions
const WHALE_SOCKET_PORT = parseInt(process.env.WHALE_SOCKET_PORT || '5181');

// Dynamic STX price (updated every 5 minutes)
let STX_PRICE_USD = 1.5; // Fallback
let lastPriceUpdate = 0;
const PRICE_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch current STX price from CoinGecko
 */
async function fetchSTXPrice() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=blockstack&vs_currencies=usd'
    );
    const data = await response.json();
    
    if (data.blockstack?.usd) {
      STX_PRICE_USD = data.blockstack.usd;
      lastPriceUpdate = Date.now();
      console.log(`[WhaleMonitor] 💰 Updated STX price: $${STX_PRICE_USD}`);
      return STX_PRICE_USD;
    }
  } catch (error) {
    console.warn('[WhaleMonitor] Failed to fetch STX price:', error.message);
  }
  return STX_PRICE_USD; // Return last known price
}

/**
 * Get current STX price (cached)
 */
async function getSTXPrice() {
  const now = Date.now();
  if (now - lastPriceUpdate > PRICE_UPDATE_INTERVAL) {
    await fetchSTXPrice();
  }
  return STX_PRICE_USD;
}

// Known protocols for transaction classification
const PROTOCOLS = {
  'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9': 'ALEX',
  'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR': 'Arkadiko',
  'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1': 'Velar',
  'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG': 'StackingDAO',
  'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9': 'Gamma',
  'SP1Z92MPDQEWZXW36VX71Q25HKF5K2EPCJ304F275': 'StackSwap',
};

// Transaction intent classification
const INTENT_SIGNALS = {
  'stack-stx': 'bullish', // Locking STX for yield
  'delegate-stx': 'bullish', // Liquid stacking
  'swap': 'neutral', // Active trading
  'mint': 'bullish', // Bridging into ecosystem
  'burn': 'bearish', // Bridging out of ecosystem
  'transfer': 'neutral', // Simple transfer
};

/**
 * Classify transaction type and intent
 */
function classifyTransaction(tx) {
  const txType = tx.tx_type;
  
  if (txType === 'token_transfer') {
    return {
      type: 'transfer',
      intent: 'neutral',
      action: 'Transferred STX'
    };
  }
  
  if (txType === 'contract_call' && tx.contract_call) {
    const functionName = tx.contract_call.function_name;
    const contractId = tx.contract_call.contract_id;
    const [contractAddress] = contractId.split('.');
    const protocol = PROTOCOLS[contractAddress] || 'Unknown';
    
    // Classify intent based on function
    let intent = 'neutral';
    let action = `Called ${functionName} on ${protocol}`;
    
    if (functionName.includes('stack')) {
      intent = 'bullish';
      action = `Stacked STX via ${protocol}`;
    } else if (functionName.includes('swap')) {
      intent = 'neutral';
      action = `Swapped tokens on ${protocol}`;
    } else if (functionName.includes('mint')) {
      intent = 'bullish';
      action = `Minted on ${protocol}`;
    } else if (functionName.includes('burn')) {
      intent = 'bearish';
      action = `Burned on ${protocol}`;
    } else if (functionName.includes('lp') || functionName.includes('liquidity')) {
      intent = 'bullish';
      action = `Provided liquidity on ${protocol}`;
    }
    
    return { type: 'contract_call', intent, action, protocol };
  }
  
  return { type: txType, intent: 'neutral', action: 'Unknown transaction' };
}

/**
 * Calculate transaction value in USD
 */
function calculateTransactionValue(tx) {
  let valueSTX = 0;
  
  if (tx.tx_type === 'token_transfer' && tx.token_transfer) {
    valueSTX = parseInt(tx.token_transfer.amount) / 1_000_000;
  } else if (tx.tx_type === 'contract_call') {
    // For contract calls, use fee as proxy for significance
    valueSTX = parseInt(tx.fee_rate || '0') / 1_000_000;
  }
  
  return {
    stx: valueSTX,
    usd: valueSTX * STX_PRICE_ESTIMATE
  };
}

/**
 * Update whale in MongoDB with transaction data
 */
async function updateWhaleTransaction(address, tx, classification, value) {
  try {
    const collection = dbService.getCollection('whales');
    
    await collection.updateOne(
      { address },
      {
        $set: {
          lastUpdated: new Date().toISOString(),
          'last_transaction': {
            tx_id: tx.tx_id,
            timestamp: new Date(tx.burn_block_time * 1000).toISOString(),
            type: classification.type,
            intent: classification.intent,
            action: classification.action,
            protocol: classification.protocol || null,
            valueSTX: value.stx,
            valueUSD: value.usd,
            blockHeight: tx.block_height,
            status: tx.tx_status
          }
        },
        $inc: {
          'stats.txCount30d': 1,
          'stats.volume30dSTX': value.stx
        }
      }
    );
    
    console.log(`[WhaleMonitor] Updated ${address.slice(0, 12)}: ${classification.action} ($${value.usd.toFixed(2)})`);
  } catch (error) {
    console.error(`[WhaleMonitor] Error updating whale ${address}:`, error.message);
  }
}

/**
 * Log significant whale movement
 */
function logSignificantMovement(whale, tx, classification, value) {
  if (value.usd > UPDATE_THRESHOLD_USD) {
    console.log(`\n🐋 WHALE ALERT!`);
    console.log(`Address: ${whale.address}`);
    console.log(`Action: ${classification.action}`);
    console.log(`Value: ${value.stx.toLocaleString()} STX ($${value.usd.toLocaleString()})`);
    console.log(`Intent: ${classification.intent.toUpperCase()}`);
    console.log(`TX: ${tx.tx_id}\n`);
  }
}

// Create HTTP server for WebSocket broadcasting to frontend
const httpServer = http.createServer();
const frontendIO = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Track connected frontend clients
let connectedClients = 0;
frontendIO.on('connection', (socket) => {
  connectedClients++;
  console.log(`[WhaleMonitor] Frontend client connected (${connectedClients} total)`);
  
  socket.on('disconnect', () => {
    connectedClients--;
    console.log(`[WhaleMonitor] Frontend client disconnected (${connectedClients} remaining)`);
  });
});

/**
 * Broadcast whale transaction to frontend clients
 */
function broadcastToFrontend(whale, tx, classification, value) {
  frontendIO.emit('whale:transaction', {
    whale: {
      address: whale.address,
      alias: whale.alias || null
    },
    transaction: {
      tx_id: tx.tx_id,
      type: classification.type,
      intent: classification.intent,
      action: classification.action,
      protocol: classification.protocol || null,
      valueSTX: value.stx,
      valueUSD: value.usd,
      blockHeight: tx.block_height,
      timestamp: new Date(tx.burn_block_time * 1000).toISOString()
    },
    isSignificant: value.usd > UPDATE_THRESHOLD_USD
  });
}

/**
 * Main WebSocket monitoring service
 */
async function startWhaleMonitor() {
  console.log('[WhaleMonitor] 🚀 Starting Whale WebSocket Monitor');
  console.log(`[WhaleMonitor] API: ${STACKS_API_URL}`);
  console.log(`[WhaleMonitor] Alert threshold: $${UPDATE_THRESHOLD_USD.toLocaleString()}`);
  
  // Connect to MongoDB
  try {
    await dbService.connect();
    console.log('[WhaleMonitor] ✅ Connected to MongoDB');
  } catch (error) {
    console.error('[WhaleMonitor] ❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
  
  // Start WebSocket server for frontend
  httpServer.listen(WHALE_SOCKET_PORT, () => {
    console.log(`[WhaleMonitor] 📡 WebSocket server for frontend listening on port ${WHALE_SOCKET_PORT}`);
  });
  
  // Get tracked whales from database
  const collection = dbService.getCollection('whales');
  const whales = await collection.find({}).toArray();
  console.log(`[WhaleMonitor] Tracking ${whales.length} whales`);
  
  if (whales.length === 0) {
    console.warn('[WhaleMonitor] No whales found in database! Run whale-seeder.js first.');
    process.exit(1);
  }
  
  // Create WebSocket connection with extended timeouts
  const socket = io(STACKS_API_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 120000, // 2 minutes max delay
    reconnectionAttempts: Infinity,
    timeout: 120000 // 2 minute connection timeout
  });
  
  // Connection handlers
  socket.on('connect', () => {
    console.log('[WhaleMonitor] ✅ WebSocket connected');
    
    // Subscribe to block updates (heartbeat)
    socket.emit('subscribe', 'block');
    console.log('[WhaleMonitor] 📡 Subscribed to blocks');
    
    // Subscribe to each whale's transactions
    whales.forEach((whale, index) => {
      socket.emit('subscribe', {
        topic: 'address-transaction',
        address: whale.address
      });
      
      if ((index + 1) % 5 === 0) {
        console.log(`[WhaleMonitor] Subscribed to ${index + 1}/${whales.length} whales...`);
      }
    });
    
    console.log(`[WhaleMonitor] ✅ Subscribed to ${whales.length} whale addresses`);
    console.log('[WhaleMonitor] 👀 Monitoring for transactions...\n');
  });
  
  socket.on('disconnect', (reason) => {
    console.warn(`[WhaleMonitor] ⚠️  Disconnected: ${reason}`);
  });
  
  socket.on('connect_error', (error) => {
    console.error(`[WhaleMonitor] ❌ Connection error:`, error.message);
  });
  
  socket.on('error', (error) => {
    console.error(`[WhaleMonitor] ❌ Socket error:`, error);
  });
  
  // Block update handler (heartbeat to know system is working)
  let blockCount = 0;
  socket.on('block', (data) => {
    blockCount++;
    if (blockCount % 10 === 0) {
      console.log(`[WhaleMonitor] ⏰ Block ${data.height || 'unknown'} (heartbeat check)`);
    }
  });
  
  // Address transaction handler (THE MAIN EVENT)
  socket.on('address-transaction', async (data) => {
    try {
      const tx = data.tx || data;
      const address = tx.sender_address;
      
      // Find whale in our database
      const whale = whales.find(w => w.address === address);
      if (!whale) {
        console.warn(`[WhaleMonitor] Received transaction for non-tracked address: ${address}`);
        return;
      }
      
      // Classify transaction
      const classification = classifyTransaction(tx);
      const value = calculateTransactionValue(tx);
      
      // Log activity
      console.log(`[WhaleMonitor] 📊 ${address.slice(0, 12)}: ${classification.action}`);
      
      // Update database
      await updateWhaleTransaction(address, tx, classification, value);
      
      // Broadcast to frontend clients
      broadcastToFrontend(whale, tx, classification, value);
      
      // Alert on significant movements
      logSignificantMovement(whale, tx, classification, value);
      
    } catch (error) {
      console.error('[WhaleMonitor] Error processing transaction:', error.message);
    }
  });
  
  // Microblock handler (faster updates)
  socket.on('microblock', (data) => {
    // Microblocks happen ~5 seconds, don't log each one
    // Just good to know we're getting real-time data
  });
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n[WhaleMonitor] 🛑 Shutting down gracefully...');
    socket.disconnect();
    frontendIO.close();
    httpServer.close();
    await dbService.close();
    process.exit(0);
  });
  
  console.log('[WhaleMonitor] ✅ Monitor running. Press Ctrl+C to stop.\n');
}

// Start the monitor
startWhaleMonitor().catch(error => {
  console.error('[WhaleMonitor] Fatal error:', error);
  process.exit(1);
});
