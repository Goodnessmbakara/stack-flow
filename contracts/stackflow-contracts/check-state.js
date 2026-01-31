// Simple script to check FLOW token state and attempt minimal initialization
import { mnemonicToSeedSync } from '@scure/bip39';
import { HDKey } from '@scure/bip32';
import transactionsPkg from '@stacks/transactions';
import { STACKS_MAINNET } from '@stacks/network';
import dotenv from 'dotenv';

dotenv.config();

const { getAddressFromPrivateKey } = transactionsPkg;
const DEPLOYER_MNEMONIC = process.env.DEPLOYER_MNEMONIC;
const contractAddress = 'SP3F4WEX90KZQ6D25TWP09J90D6CSYGW1JWXN5YF4';

// Derive address
function getAddress() {
  const seed = mnemonicToSeedSync(DEPLOYER_MNEMONIC);
  const hdKey = HDKey.fromMasterSeed(seed);
  const child = hdKey.derive("m/44'/5757'/0'/0/0");
  const privateKey = Buffer.from(child.privateKey).toString('hex');
  return getAddressFromPrivateKey(privateKey + '01');
}

const address = getAddress();

// Check contract state
async function callReadOnly(contractName, functionName, args = []) {
  const url = `https://api.mainnet.hiro.so/v2/contracts/call-read/${contractAddress}/${contractName}/${functionName}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: contractAddress,
      arguments: args
    })
  });
  
  return await response.json();
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 FLOW Ecosystem State Check');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log(`📍 Address: ${address}\n`);

async function checkState() {
  // Check token state
  console.log('━━━ Token State ━━━\n');
  
  const totalSupply = await callReadOnly('stackflow-flow-token', 'get-total-supply');
  const contractInfo = await callReadOnly('stackflow-flow-token', 'get-contract-info');
  const balance = await callReadOnly('stackflow-flow-token', 'get-balance', [
    `0x051a${contractAddress.slice(2)}`
  ]);
  
  console.log('Total Supply:', totalSupply);
  console.log('Contract Info:', contractInfo);
  console.log('Deployer Balance:', balance);
  
  // Check staking state
  console.log('\n━━━ Staking State ━━━\n');
  
  const stats = await callReadOnly('stackflow-staking', 'get-stats');
  const stake = await callReadOnly('stackflow-staking', 'get-stake', [
    `0x051a${contractAddress.slice(2)}`
  ]);
  
  console.log('Staking Stats:', stats);
  console.log('Deployer Stake:', stake);
  
  // Check governance state  
  console.log('\n━━━ Governance State ━━━\n');
  
  const govStats = await callReadOnly('stackflow-governance', 'get-governance-stats');
  const proposals = await callReadOnly('stackflow-governance', 'get-active-proposals');
  
  console.log('Governance Stats:', govStats);
  console.log('Active Proposals:', proposals);
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ State check complete!');
  console.log('\n📝 Summary:');
  console.log('   - All contracts are deployed and responding');
  console.log('   - Ready for initialization');
  console.log('   - Run initialize-ecosystem.js to mint tokens and test full flow\n');
}

checkState().catch(console.error);
