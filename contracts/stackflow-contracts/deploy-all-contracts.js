import { readFileSync } from 'fs';
import * as bip39 from 'bip39';
import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
import transactionsPkg from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';
import dotenv from 'dotenv';

dotenv.config();

const { makeContractDeploy, broadcastTransaction, AnchorMode, getAddressFromPrivateKey, TransactionVersion } = transactionsPkg;

// Initialize BIP32
const bip32 = BIP32Factory(ecc);

// Read contracts
const m1ContractCode = readFileSync('./contracts/stackflow-options-m1.clar', 'utf8');
const v1ContractCode = readFileSync('./contracts/stackflow-options-v1.clar', 'utf8');

// Configuration from .env
const network = STACKS_TESTNET;
const mnemonic = process.env.DEPLOYER_MNEMONIC;
const deployerAddress = process.env.DEPLOYER_ADDRESS;

if (!mnemonic || !deployerAddress) {
  console.error('❌ Missing DEPLOYER_MNEMONIC or DEPLOYER_ADDRESS in .env file');
  process.exit(1);
}

// Derive private key from mnemonic
async function getPrivateKey() {
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const root = bip32.fromSeed(seed);
  // Testnet derivation path: m/44'/1'/0'/0/0
  const child = root.derivePath("m/44'/1'/0'/0/0");
  return child.privateKey.toString('hex') + '01'; // Add suffix for compressed key
}


async function deployContract(contractName, contractCode, delay = 0) {
  try {
    const privateKey = await getPrivateKey();
    
    console.log(`\n🚀 Deploying ${contractName}...`);
    console.log(`📍 Address: ${deployerAddress}`);
    
    const txOptions = {
      contractName: contractName,
      codeBody: contractCode,
      senderKey: privateKey,
      network: network,
      anchorMode: AnchorMode.Any,
      fee: 500000n, // 0.5 STX fee
    };
    
    console.log('📝 Creating transaction...');
    const transaction = await makeContractDeploy(txOptions);
    
    console.log('🌐 Broadcasting to testnet...');
    const broadcastResponse = await broadcastTransaction({ transaction, network });
    
    if (broadcastResponse.error) {
      console.error(`❌ ${contractName} deployment failed:`);
      console.error(broadcastResponse);
      return null;
    }
    
    console.log(`✅ ${contractName} deployed successfully!`);
    console.log(`📋 TxID: ${broadcastResponse.txid}`);
    console.log(`🔗 Explorer: https://explorer.hiro.so/txid/${broadcastResponse.txid}?chain=testnet`);
    console.log(`📄 Contract: ${deployerAddress}.${contractName}`);
    
    return {
      contractName,
      txid: broadcastResponse.txid,
      address: `${deployerAddress}.${contractName}`
    };
    
  } catch (error) {
    console.error(`❌ Error deploying ${contractName}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 StackFlow Contract Deployment');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const results = [];
  
  // Deploy M1 contract
  const m1Result = await deployContract('stackflow-options-m1', m1ContractCode);
  if (m1Result) results.push(m1Result);
  
  // Wait 30 seconds between deployments to avoid nonce issues
  console.log('\n⏳ Waiting 30 seconds before next deployment...');
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  // Deploy V1 contract
  const v1Result = await deployContract('stackflow-options-v1', v1ContractCode);
  if (v1Result) results.push(v1Result);
  
  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Deployment Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (results.length === 0) {
    console.log('❌ No contracts deployed successfully');
  } else {
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.contractName}`);
      console.log(`   Address: ${result.address}`);
      console.log(`   TxID: ${result.txid}`);
      console.log(`   Status: Pending confirmation (~10-20 minutes)\n`);
    });
    
    console.log('📝 Next Steps:');
    console.log('1. Update frontend .env with contract addresses');
    console.log('2. Wait for transaction confirmations');
    console.log('3. Verify contracts on Stacks Explorer');
    console.log('4. Test contract functions from frontend');
    
    console.log('\n💾 Add to your frontend .env:');
    results.forEach(result => {
      console.log(`VITE_${result.contractName.toUpperCase().replace(/-/g, '_')}_ADDRESS=${result.address}`);
    });
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(console.error);
