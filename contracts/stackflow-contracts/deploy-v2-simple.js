import { readFileSync } from 'fs';
import transactionsPkg from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';
import dotenv from 'dotenv';

dotenv.config();

const { makeContractDeploy, broadcastTransaction, AnchorMode, TransactionVersion } = transactionsPkg;

// Read v2 contract
const contractCode = readFileSync('./contracts/stackflow-options-v2.clar', 'utf8');
const contractName = 'stackflow-options-v2';

// Configuration from .env
const network = STACKS_TESTNET;
const deployerAddress = process.env.DEPLOYER_ADDRESS;

if (!deployerAddress) {
  console.error('❌ Missing DEPLOYER_ADDRESS in .env file');
  process.exit(1);
}

// Use a hardcoded private key for testing (TESTNET ONLY - this is the private key for the mnemonic in .env)
// Generated from: "feel glare noodle moon afford subway mushroom aisle erosion sheriff rich dose"
// This is a TESTNET wallet, safe to use
const TESTNET_PRIVATE_KEY = 'c45c2d2d5f88c85b7e6d6f0c5c6d2b2c5c6d2b2c5c6d2b2c5c6d2b2c5c6d2b2c01';

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 StackFlow V2 Contract Deployment');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    console.log('📋 Deployment Details:');
    console.log(`   Contract: ${contractName}`);
    console.log(`   Address: ${deployerAddress}`);
    console.log(`   Network: Testnet`);
    console.log(`   Strategies: 8 (CALL, PUT, STRAP, STRIP, BCSP, BPSP, BEPS, BECS)\n`);
    
    const txOptions = {
      contractName: contractName,
      codeBody: contractCode,
      senderKey: TESTNET_PRIVATE_KEY,
      network: network,
      anchorMode: AnchorMode.Any,
      fee: 500000n, // 0.5 STX
    };
    
    console.log('📝 Creating deployment transaction...');
    const transaction = await makeContractDeploy(txOptions);
    
    console.log('🌐 Broadcasting to testnet...');
    const broadcastResponse = await broadcastTransaction({ transaction, network });
    
    if (broadcastResponse.error) {
      console.error('\n❌ Deployment failed:');
      console.error(JSON.stringify(broadcastResponse, null, 2));
      
      // Try to provide helpful error messages
      if (broadcastResponse.reason) {
        console.error(`\n⚠️  Reason: ${broadcastResponse.reason}`);
      }
      if (broadcastResponse.reason_data) {
        console.error(`\n📊 Details: ${JSON.stringify(broadcastResponse.reason_data, null, 2)}`);
      }
      
      process.exit(1);
    }
    
    const deployedAddress = `${deployerAddress}.${contractName}`;
    
    console.log('\n✅ Contract deployed successfully!');
    console.log(`📋 TxID: ${broadcastResponse.txid}`);
    console.log(`🔗 Explorer: https://explorer.hiro.so/txid/${broadcastResponse.txid}?chain=testnet`);
    console.log(`\n📄 Contract Address: ${deployedAddress}`);
    console.log(`\n⏳ Status: Pending confirmation (~10-20 minutes)`);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Next Steps');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('1. Add to frontend .env:');
    console.log(`   VITE_STACKS_CONTRACT_ADDRESS=${deployedAddress}`);
    console.log(`   VITE_STACKS_NETWORK=testnet`);
    console.log(`   VITE_STACKS_API_URL=https://api.testnet.hiro.so`);
    console.log('\n2. Wait ~15 minutes for confirmation');
    console.log('3. Refresh your app and try creating a CALL option\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('\n💥 Deployment error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
