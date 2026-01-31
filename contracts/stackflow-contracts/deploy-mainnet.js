import { readFileSync } from 'fs';
import { mnemonicToSeedSync } from '@scure/bip39';
import { HDKey } from '@scure/bip32';
import transactionsPkg from '@stacks/transactions';
import { STACKS_MAINNET } from '@stacks/network';
import dotenv from 'dotenv';

dotenv.config();

const { makeContractDeploy, broadcastTransaction, AnchorMode, getAddressFromPrivateKey, TransactionVersion } = transactionsPkg;

// Read v2 contract
const contractCode = readFileSync('./contracts/stackflow-options-v2.clar', 'utf8');
const contractName = 'stackflow-options-v2';

// MAINNET Configuration
const network = STACKS_MAINNET;
const DEPLOYER_MNEMONIC = process.env.DEPLOYER_MNEMONIC;
const EXPECTED_MAINNET_ADDRESS = 'SP3F4WEX90KZQ6D25TWP09J90D6CSYGW1JWXN5YF4';

if (!DEPLOYER_MNEMONIC) {
  console.error('❌ Missing DEPLOYER_MNEMONIC in .env file');
  process.exit(1);
}

// Derive mainnet private key from mnemonic
function getPrivateKeyFromMnemonic() {
  // Convert mnemonic to seed
  const seed = mnemonicToSeedSync(DEPLOYER_MNEMONIC);
  
  // Create HD key from seed
  const hdKey = HDKey.fromMasterSeed(seed);
  
  // Mainnet derivation path: m/44'/5757'/0'/0/0
  const mainnetPath = "m/44'/5757'/0'/0/0";
  const child = hdKey.derive(mainnetPath);
  
  if (!child.privateKey) {
    throw new Error('Failed to derive private key');
  }
  
  const privateKey = Buffer.from(child.privateKey).toString('hex');
  
  // Verify address matches (use 0x16 for mainnet)
  const derivedAddress = getAddressFromPrivateKey(privateKey + '01');
  
  console.log(`📍 Derived Address: ${derivedAddress}`);
  console.log(`📍 Expected Address: ${EXPECTED_MAINNET_ADDRESS}`);
  
  if (derivedAddress !== EXPECTED_MAINNET_ADDRESS) {
    console.warn('\n⚠️  WARNING: Derived address does not match expected address!');
    console.warn('   Derived: ' + derivedAddress);
    console.warn('   Expected: ' + EXPECTED_MAINNET_ADDRESS);
    console.warn('\n   Deployment will use the DERIVED address.');
    console.warn('   If this is incorrect, please check your mnemonic.\n');
  }
  
  return { privateKey, address: derivedAddress };
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 StackFlow V2 MAINNET Deployment');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('⚠️  WARNING: You are deploying to MAINNET!');
  console.log('This will cost real STX (~1.0 STX)\n');
  
  try {
    const { privateKey, address } = getPrivateKeyFromMnemonic();
    
    console.log('\n📋 Deployment Details:');
    console.log(`   Contract: ${contractName}`);
    console.log(`   Deployer: ${address}`);
    console.log(`   Network: MAINNET`);
    console.log(`   Strategies: 8 (CALL, PUT, STRAP, STRIP, BCSP, BPSP, BEPS, BECS)\n`);
    
    // Check contract size
    const contractSize = Buffer.byteLength(contractCode, 'utf8');
    console.log(`📏 Contract size: ${contractSize.toLocaleString()} bytes`);
    console.log(`💰 Deployment fee: 1.0 STX\n`);
    
    // Fetch current nonce from the network
    console.log('🔢 Fetching account nonce...');
    const accountResponse = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${address}?proof=0`);
    const accountData = await accountResponse.json();
    const nonce = accountData.nonce;
    
    console.log(`   Current nonce: ${nonce}`);
    console.log(`   Balance: ${parseInt(accountData.balance, 16) / 1000000} STX\n`);
    
    const txOptions = {
      contractName: contractName,
      codeBody: contractCode,
      senderKey: privateKey + '01', // Add compression suffix
      network: network,
      anchorMode: AnchorMode.Any,
      fee: 1000000n, // 1.0 STX fee for mainnet
      nonce: BigInt(nonce), // Explicitly set nonce
    };
    
    console.log('📝 Creating deployment transaction...');
    const transaction = await makeContractDeploy(txOptions);
    
    console.log('🌐 Broadcasting to MAINNET...');
    const broadcastResponse = await broadcastTransaction({ transaction, network });
    
    if (broadcastResponse.error) {
      console.error('\n❌ Deployment failed:');
      console.error(JSON.stringify(broadcastResponse, null, 2));
      
      if (broadcastResponse.reason) {
        console.error(`\n⚠️  Reason: ${broadcastResponse.reason}`);
      }
      
      process.exit(1);
    }
    
    const deployedAddress = `${address}.${contractName}`;
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ DEPLOYMENT SUCCESSFUL!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log(`📋 Transaction ID: ${broadcastResponse.txid}`);
    console.log(`🔗 Explorer: https://explorer.hiro.so/txid/${broadcastResponse.txid}?chain=mainnet`);
    console.log(`📄 Contract: ${deployedAddress}\n`);
    
    console.log(`⏳ Status: Pending confirmation (~10-20 minutes)\n`);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Update Frontend .env');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Add this line to /Users/abba/Desktop/stack-flow/.env:');
    console.log(`\nVITE_STACKS_CONTRACT_ADDRESS=${deployedAddress}\n`);
    
    console.log('The frontend is already configured for mainnet.');
    console.log('Once confirmed, you can start trading!\n');
    
  } catch (error) {
    console.error('\n💥 Deployment error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
