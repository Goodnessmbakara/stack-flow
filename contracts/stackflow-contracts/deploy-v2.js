import { readFileSync } from 'fs';
import { generateWallet, generateSecretKey, getStxAddress } from '@stacks/wallet-sdk';
import transactionsPkg from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';
import dotenv from 'dotenv';

dotenv.config();

const { makeContractDeploy, broadcastTransaction, AnchorMode } = transactionsPkg;

// Read v2 contract
const contractCode = readFileSync('./contracts/stackflow-options-v2.clar', 'utf8');
const contractName = 'stackflow-options-v2';

// Configuration from .env
const network = STACKS_TESTNET;
const mnemonic = process.env.DEPLOYER_MNEMONIC;
const expectedAddress = process.env.DEPLOYER_ADDRESS;

if (!mnemonic || !expectedAddress) {
  console.error('❌ Missing DEPLOYER_MNEMONIC or DEPLOYER_ADDRESS in .env file');
  process.exit(1);
}

// Generate wallet from mnemonic
function getWalletFromMnemonic() {
  const wallet = generateWallet({
    secretKey: mnemonic,
    password: ''
  });
  
  const account = wallet.accounts[0];
  const privateKey = account.stxPrivateKey;
  const address = getStxAddress({ account, transactionVersion: 'testnet' });
  
  console.log(`📍 Derived Address: ${address}`);
  console.log(`📍 Expected Address: ${expectedAddress}`);
  
  if (address !== expectedAddress) {
    console.warn('⚠️  Address mismatch - using derived address');
  }
  
  return privateKey;
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 StackFlow V2 Contract Deployment');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    const privateKey = getWalletFromMnemonic();
    
    console.log('\n📋 Deployment Details:');
    console.log(`   Contract: ${contractName}`);
    console.log(`   Network: Testnet`);
    console.log(`   Strategies: CALL, PUT, STRAP, STRIP, BCSP, BPSP, BEPS, BECS\n`);
    
    const txOptions = {
      contractName: contractName,
      codeBody: contractCode,
      senderKey: privateKey,
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
      console.error(broadcastResponse);
      process.exit(1);
    }
    
    const deployedAddress = `${expectedAddress}.${contractName}`;
    
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
    console.log('\n2. Wait for confirmation, then test from frontend');
    console.log('3. Try creating a CALL option to verify integration\n');
    
  } catch (error) {
    console.error('\n💥 Deployment error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
