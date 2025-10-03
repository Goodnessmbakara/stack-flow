# Changelog

## [Testnet Integration] - 2025-10-03

### 🚀 Deployed
- **Contract Address:** `ST3DSAPR2WF7D7SMR6W0R436AA6YYTD8RFT9E9NPH.stackflow-options-v1`
- **Network:** Stacks Testnet
- **Transaction ID:** `ee51046f5c0f9ce1003c000cda5ebb415b13736c5a5d811c94085df98cbdc6f2`

### ✅ Added
- Testnet wallet configuration with custom mnemonic
- Frontend integration with deployed testnet contract
- Transaction manager for all 4 option strategies (CALL, STRAP, BCSP, BPSP)
- Block buffer (10 blocks) to prevent expiry validation errors
- Comprehensive testnet deployment documentation

### 🔧 Fixed
- **Critical:** Fixed `err-invalid-expiry` (u104) by adding block buffer for transaction confirmation time
- **API Compatibility:** Updated imports for @stacks/transactions v7.2.0 and @stacks/connect v8.2.0
  - Changed from `new StacksTestnet()` to `STACKS_TESTNET` constant
  - Fixed `openContractCall` to use callbacks instead of promise returns
  - Removed incorrect post-condition imports from @stacks/connect
- **Referral System:** Removed failing backend API calls (no BASE_URL configured)

### 🗑️ Removed
- Devnet configuration and references
- Legacy referral backend API calls
- Temporary documentation files
- Backup and log files

### 📝 Changed
- Updated `.env` and `env.example` with testnet configuration
- Simplified transaction manager to production-ready code
- Updated `TESTNET_DEPLOYMENT_GUIDE.md` with deployment details

### 🎯 Technical Details

#### Contract Requirements
- Minimum option period: 1008 blocks (~7 days)
- Maximum option period: 12960 blocks (~90 days)
- Block buffer added: 10 blocks (~100 seconds)

#### API Versions
- `@stacks/connect`: ^8.2.0
- `@stacks/transactions`: ^7.2.0
- `@stacks/network`: ^7.2.0

#### Network Configuration
- API URL: https://api.testnet.hiro.so
- Explorer: https://explorer.hiro.so/?chain=testnet
- Contract: ST3DSAPR2WF7D7SMR6W0R436AA6YYTD8RFT9E9NPH.stackflow-options-v1

### 🔗 Related Documentation
- `TESTNET_DEPLOYMENT_SUCCESS.md` - Deployment record
- `FRONTEND_TESTNET_READY.md` - Integration guide
- `TRANSACTION_FAILURE_ANALYSIS.md` - Error analysis & fix
- `REFERRAL_SYSTEM_NOTES.md` - Referral system context
- `PHASE_3_TESTNET_COMPLETE.md` - Phase 3 completion summary

