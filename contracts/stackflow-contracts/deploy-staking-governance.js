import { readFileSync } from 'fs';
import { mnemonicToSeedSync } from '@scure/bip39';
import { HDKey } from '@scure/bip32';
import transactionsPkg from '@stacks/transactions';
import { STACKS_MAINNET } from '@stacks/network';
import dotenv from 'dotenv';

dotenv.config();

const { makeContractDeploy, broadcastTransaction, AnchorMode, getAddressFromPrivateKey, TransactionVersion } = transactionsPkg;

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
  const seed = mnemonicToSeedSync(DEPLOYER_MNEMONIC);
  const hdKey = HDKey.fromMasterSeed(seed);
  const mainnetPath = "m/44'/5757'/0'/0/0";
  const child = hdKey.derive(mainnetPath);
  
  if (!child.privateKey) {
    throw new Error('Failed to derive private key');
  }
  
  const privateKey = Buffer.from(child.privateKey).toString('hex');
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

// Get account nonce
async function getNonce(address) {
  const accountResponse = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${address}?proof=0`);
  const accountData = await accountResponse.json();
  return accountData.nonce;
}

// Deploy a contract
async function deployContract(contractName, contractCode, privateKey, address, nonce) {
  console.log(`\n📝 Deploying ${contractName}...`);
  
  const contractSize = Buffer.byteLength(contractCode, 'utf8');
  console.log(`   Contract size: ${contractSize.toLocaleString()} bytes`);
  
  const txOptions = {
    contractName: contractName,
    codeBody: contractCode,
    senderKey: privateKey + '01',
    network: network,
    anchorMode: AnchorMode.Any,
    fee: 1000000n, // 1.0 STX
    nonce: BigInt(nonce),
  };
  
  const transaction = await makeContractDeploy(txOptions);
  const broadcastResponse = await broadcastTransaction({ transaction, network });
  
  if (broadcastResponse.error) {
    console.error(`\n❌ ${contractName} deployment failed:`);
    console.error(JSON.stringify(broadcastResponse, null, 2));
    throw new Error(`Failed to deploy ${contractName}`);
  }
  
  const deployedAddress = `${address}.${contractName}`;
  
  console.log(`✅ ${contractName} deployed!`);
  console.log(`   TX ID: ${broadcastResponse.txid}`);
  console.log(`   Contract: ${deployedAddress}`);
  console.log(`   Explorer: https://explorer.hiro.so/txid/${broadcastResponse.txid}?chain=mainnet`);
  
  return {
    txid: broadcastResponse.txid,
    contractAddress: deployedAddress
  };
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌊 StackFlow Staking & Governance Deployment');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('⚠️  WARNING: Deploying to MAINNET!');
  console.log('This will deploy 2 contracts and cost ~2.0 STX\n');
  
  try {
    const { privateKey, address } = getPrivateKeyFromMnemonic();
    
    // Get starting nonce
    console.log('\n🔢 Fetching account nonce...');
    let currentNonce = await getNonce(address);
    console.log(`   Starting nonce: ${currentNonce}\n`);
    
    // Read contract files
    const stakingCode = readFileSync('./contracts/stackflow-staking.clar', 'utf8');
    const governanceCode = readFileSync('./contracts/stackflow-governance.clar', 'utf8');
    
    const deployments = [];
    
    // Deploy 1: Staking Contract
    console.log('\n━━━ Phase 1: Staking Contract ━━━');
    const stakingDeployment = await deployContract(
      'stackflow-staking',
      stakingCode,
      privateKey,
      address,
      currentNonce
    );
    deployments.push({ name: 'Staking', ...stakingDeployment });
    currentNonce++;
    
    // Wait a bit between deployments
    console.log('\n⏳ Waiting 5 seconds before next deployment...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Deploy 2: Governance Contract
    console.log('\n━━━ Phase 2: Governance Contract ━━━');
    const governanceDeployment = await deployContract(
      'stackflow-governance',
      governanceCode,
      privateKey,
      address,
      currentNonce
    );
    deployments.push({ name: 'Governance', ...governanceDeployment });
    
    // Summary
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ALL DEPLOYMENTS SUCCESSFUL!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    deployments.forEach(d => {
      console.log(`📋 ${d.name}`);
      console.log(`   Contract: ${d.contractAddress}`);
      console.log(`   TX ID: ${d.txid}`);
      console.log(`   Explorer: https://explorer.hiro.so/txid/${d.txid}?chain=mainnet\n`);
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 NEXT STEPS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('1. ⏳ Wait for confirmations (~10-20 minutes)');
    console.log('   Monitor transactions in the explorer\n');
    
    console.log('2. 🧪 Test all three contracts');
    console.log('   Run: node test-mainnet-flow-ecosystem.js\n');
    
    console.log('3. 💰 Mint FLOW tokens');
    console.log('   Call configure-distribution-wallets on FLOW token');
    console.log('   Then call mint-initial-distribution\n');
    
    console.log('4. 🎯 Start using the ecosystem');
    console.log('   Users can stake FLOW tokens');
    console.log('   Users can submit and vote on proposals\n');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌊 FLOW Ecosystem Complete on Mainnet!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('\n💥 Deployment error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
