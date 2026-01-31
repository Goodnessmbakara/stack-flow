import { readFileSync } from 'fs';
import { mnemonicToSeedSync } from '@scure/bip39';
import { HDKey } from '@scure/bip32';
import transactionsPkg from '@stacks/transactions';
import { STACKS_MAINNET } from '@stacks/network';
import dotenv from 'dotenv';

dotenv.config();

const { 
  makeContractCall, 
  broadcastTransaction, 
  AnchorMode, 
  getAddressFromPrivateKey,
  principalCV,
  uintCV,
  stringUtf8CV,
  stringAsciiCV,
  someCV,
  noneCV,
  trueCV
} = transactionsPkg;

const network = STACKS_MAINNET;
const DEPLOYER_MNEMONIC = process.env.DEPLOYER_MNEMONIC;
const contractAddress = 'SP3F4WEX90KZQ6D25TWP09J90D6CSYGW1JWXN5YF4';

if (!DEPLOYER_MNEMONIC) {
  console.error('❌ Missing DEPLOYER_MNEMONIC in .env file');
  process.exit(1);
}

// Derive private key
function getPrivateKey() {
  const seed = mnemonicToSeedSync(DEPLOYER_MNEMONIC);
  const hdKey = HDKey.fromMasterSeed(seed);
  const child = hdKey.derive("m/44'/5757'/0'/0/0");
  const privateKey = Buffer.from(child.privateKey).toString('hex');
  const address = getAddressFromPrivateKey(privateKey + '01');
  return { privateKey: privateKey + '01', address };
}

// Get nonce
async function getNonce(address) {
  const response = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${address}?proof=0`);
  const data = await response.json();
  return data.nonce;
}

// Wait for transaction confirmation
async function waitForConfirmation(txid, maxWait = 3000000) {
  console.log(`   ⏳ Waiting for confirmation...`);
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    try {
      const response = await fetch(`https://api.mainnet.hiro.so/extended/v1/tx/${txid}`);
      const data = await response.json();
      
      if (data.tx_status === 'success') {
        console.log(`   ✅ Confirmed in block ${data.block_height}`);
        return true;
      } else if (data.tx_status === 'abort_by_response' || data.tx_status === 'abort_by_post_condition') {
        console.log(`   ❌ Transaction failed: ${data.tx_status}`);
        return false;
      }
    } catch (e) {
      // Transaction not found yet, keep waiting
    }
    
    await new Promise(resolve => setTimeout(resolve, 10000)); // Check every 10s
  }
  
  console.log(`   ⏱️  Timeout waiting for confirmation`);
  return false;
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🌊 FLOW Ecosystem - Complete Initialization & Testing');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const { privateKey, address } = getPrivateKey();
console.log(`📍 Deployer Address: ${address}\n`);

console.log('⚠️  WARNING: This will execute multiple MAINNET transactions!');
console.log('   Estimated cost: ~2-3 STX\n');
console.log('📋 Execution Plan:');
console.log('   1. Configure distribution wallets');
console.log('   2. Mint 100M FLOW tokens');
console.log('   3. Stake 10,000 FLOW (Wave tier)');
console.log('   4. Submit governance proposal');
console.log('   5. Vote on proposal');
console.log('   6. Run comprehensive tests\n');

let currentNonce;

async function executePhase1_Initialize() {
  console.log('\n━━━ Phase 1: Token Initialization ━━━\n');
  
  currentNonce = await getNonce(address);
  console.log(`Starting nonce: ${currentNonce}\n`);
  
  // Step 1: Configure distribution wallets
  console.log('📝 Step 1: Configure Distribution Wallets');
  
  const configTx = await makeContractCall({
    contractAddress,
    contractName: 'stackflow-flow-token',
    functionName: 'configure-distribution-wallets',
    functionArgs: [
      principalCV(address), // community wallet
      principalCV(address), // ecosystem wallet
      principalCV(address), // team wallet
      principalCV(address), // liquidity wallet
      principalCV(address)  // public wallet
    ],
    senderKey: privateKey,
    network,
    anchorMode: AnchorMode.Any,
    fee: 500000n,
    nonce: BigInt(currentNonce)
  });
  
  const configResult = await broadcastTransaction({ transaction: configTx, network });
  console.log(`   TX ID: ${configResult.txid}`);
  
  if (configResult.error) {
    console.error(`   ❌ Failed: ${configResult.error}`);
    return false;
  }
  
  const configConfirmed = await waitForConfirmation(configResult.txid);
  if (!configConfirmed) return false;
  
  currentNonce++;
  
  // Step 2: Mint initial distribution
  console.log('\n📝 Step 2: Mint Initial Distribution (100M FLOW)');
  
  const mintTx = await makeContractCall({
    contractAddress,
    contractName: 'stackflow-flow-token',
    functionName: 'mint-initial-distribution',
    functionArgs: [],
    senderKey: privateKey,
    network,
    anchorMode: AnchorMode.Any,
    fee: 500000n,
    nonce: BigInt(currentNonce)
  });
  
  const mintResult = await broadcastTransaction({ transaction: mintTx, network });
  console.log(`   TX ID: ${mintResult.txid}`);
  
  if (mintResult.error) {
    console.error(`   ❌ Failed: ${mintResult.error}`);
    return false;
  }
  
  const mintConfirmed = await waitForConfirmation(mintResult.txid);
  if (!mintConfirmed) return false;
  
  currentNonce++;
  console.log('\n✅ Phase 1 Complete: Tokens Minted!\n');
  return true;
}

async function executePhase2_Staking() {
  console.log('\n━━━ Phase 2: Staking Test ━━━\n');
  
  // Stake 10,000 FLOW (Wave tier: 5K-20K)
  const stakeAmount = 10000000000n; // 10,000 FLOW with 6 decimals
  
  console.log('📝 Step 3: Stake 10,000 FLOW');
  console.log(`   Target Tier: WAVE (5,000-20,000 FLOW)`);
  console.log(`   Expected Discount: 25%\n`);
  
  const stakeTx = await makeContractCall({
    contractAddress,
    contractName: 'stackflow-staking',
    functionName: 'stake',
    functionArgs: [uintCV(stakeAmount)],
    senderKey: privateKey,
    network,
    anchorMode: AnchorMode.Any,
    fee: 300000n,
    nonce: BigInt(currentNonce)
  });
  
  const stakeResult = await broadcastTransaction({ transaction: stakeTx, network });
  console.log(`   TX ID: ${stakeResult.txid}`);
  
  if (stakeResult.error) {
    console.error(`   ❌ Failed: ${stakeResult.error}`);
    return false;
  }
  
  const stakeConfirmed = await waitForConfirmation(stakeResult.txid);
  if (!stakeConfirmed) return false;
  
  currentNonce++;
  console.log('\n✅ Phase 2 Complete: Staking Active!\n');
  return true;
}

async function executePhase3_Governance() {
  console.log('\n━━━ Phase 3: Governance DAO Test ━━━\n');
  
  // Submit a proposal
  console.log('📝 Step 4: Submit Governance Proposal');
  console.log(`   Title: "Increase Staking Rewards"`);
  console.log(`   Type: Parameter Change`);
  console.log(`   Proposal: Increase base staking APY from 10% to 15%\n`);
  
  const proposalTx = await makeContractCall({
    contractAddress,
    contractName: 'stackflow-governance',
    functionName: 'submit-proposal',
    functionArgs: [
      stringUtf8CV("Increase Staking Rewards"),
      stringUtf8CV("Proposal to increase the base staking APY from 10% to 15% to incentivize more long-term holders and   increase ecosystem participation."),
      stringAsciiCV("PARAM"),
      someCV(stringAsciiCV("staking-apy")),
      someCV(uintCV(1500n)) // 15% in basis points
    ],
    senderKey: privateKey,
    network,
    anchorMode: AnchorMode.Any,
    fee: 500000n,
    nonce: BigInt(currentNonce)
  });
  
  const proposalResult = await broadcastTransaction({ transaction: proposalTx, network });
  console.log(`   TX ID: ${proposalResult.txid}`);
  
  if (proposalResult.error) {
    console.error(`   ❌ Failed: ${proposalResult.error}`);
    return false;
  }
  
  const proposalConfirmed = await waitForConfirmation(proposalResult.txid);
  if (!proposalConfirmed) return false;
  
  currentNonce++;
  
  // Vote on the proposal
  console.log('\n📝 Step 5: Vote on Proposal');
  console.log(`   Vote: YES (in favor)\n`);
  
  const voteTx = await makeContractCall({
    contractAddress,
    contractName: 'stackflow-governance',
    functionName: 'vote',
    functionArgs: [
      uintCV(1n), // proposal ID = 1
      trueCV()     // vote yes
    ],
    senderKey: privateKey,
    network,
    anchorMode: AnchorMode.Any,
    fee: 300000n,
    nonce: BigInt(currentNonce)
  });
  
  const voteResult = await broadcastTransaction({ transaction: voteTx, network });
  console.log(`   TX ID: ${voteResult.txid}`);
  
  if (voteResult.error) {
    console.error(`   ❌ Failed: ${voteResult.error}`);
    return false;
  }
  
  const voteConfirmed = await waitForConfirmation(voteResult.txid);
  if (!voteConfirmed) return false;
  
  currentNonce++;
  console.log('\n✅ Phase 3 Complete: DAO is Active!\n');
  return true;
}

async function main() {
  try {
    const phase1 = await executePhase1_Initialize();
    if (!phase1) {
      console.error('\n❌ Phase 1 failed. Stopping.');
      process.exit(1);
    }
    
    const phase2 = await executePhase2_Staking();
    if (!phase2) {
      console.error('\n❌ Phase 2 failed. Stopping.');
      process.exit(1);
    }
    
    const phase3 = await executePhase3_Governance();
    if (!phase3) {
      console.error('\n❌ Phase 3 failed. Stopping.');
      process.exit(1);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 ALL PHASES COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('✅ Token: 100M FLOW minted and distributed');
    console.log('✅ Staking: 10,000 FLOW staked (WAVE tier, 25% discount)');
    console.log('✅ Governance: Proposal #1 submitted and voted on');
    console.log('\n🧪 Run comprehensive tests: node test-all-functions.js\n');
    
  } catch (error) {
    console.error('\n💥 Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
