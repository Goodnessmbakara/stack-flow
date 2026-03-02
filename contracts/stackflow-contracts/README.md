# StackFlow Contracts

> Smart contracts for Bitcoin-secured options trading on Stacks blockchain

## Overview

StackFlow is a decentralized options trading platform built on Stacks, bringing sophisticated derivatives trading to Bitcoin. The platform features multiple option strategies, oracle integrations, and a complete governance and staking ecosystem.

**Current Status**: ✅ **LIVE ON TESTNET**

- **Deployer Address**: `ST3F4WEX90KZQ6D25TWP09J90D6CSYGW1JX8WH3Y7`
- **Total Contracts**: 11 deployed smart contracts
- **Test Coverage**: 100% (31+ comprehensive tests)
- **Simulation Results**: 70.4% success rate, 213.13 STX profit over 1000 trades

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      StackFlow Ecosystem                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐     ┌──────────────────┐                │
│  │  FLOW Token     │────▶│  Staking         │                │
│  │  (SIP-010)      │     │  (Tier System)   │                │
│  └─────────────────┘     └──────────────────┘                │
│           │                       │                            │
│           │                       ▼                            │
│           │              ┌──────────────────┐                │
│           └─────────────▶│  Governance      │                │
│                          │  (On-chain DAO)  │                │
│                          └──────────────────┘                │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              Options Trading Contracts                    │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │ │
│  │  │   M1 Core   │  │   M2 Core   │  │ V1 Wrapper  │     │ │
│  │  │ CALL, BPSP  │  │ STRAP, BCSP │  │  (8 Total)  │     │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │ │
│  └──────────────────────────────────────────────────────────┘ │
│                          │         │                           │
│                          ▼         ▼                           │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Oracle Infrastructure                       │  │
│  │  ┌──────────────┐       ┌──────────────────────┐       │  │
│  │  │ Mock Oracle  │       │  Pyth Oracle         │       │  │
│  │  │ (Testing)    │       │  (Production Ready)  │       │  │
│  │  └──────────────┘       └──────────────────────┘       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Core Contracts

### Options Trading

#### 1. **stackflow-options-v1.clar**
Legacy options contract implementing CALL and Bull Put Spread (BPSP) strategies.

**Strategies**:
- **CALL Options**: Bullish call options (42.8% success rate)
- **Bull Put Spread**: Limited-risk bullish strategy (98.0% success rate)

**Key Functions**:
- `create-call-option`: Create bullish call options
- `create-bull-put-spread`: Create bull put spreads
- `exercise-option`: Exercise profitable options
- `settle-expired`: Auto-settle expired positions

**Performance**: 213.13 STX profit over 1000 simulated trades

#### 2. **stackflow-options-v2.clar**
Enhanced options contract with improved architecture and additional strategies.

**Features**:
- Modular strategy design
- Improved gas efficiency
- Enhanced error handling
- Better price oracle integration

#### 3. **stackflow-options-m2-v2.clar**
Milestone 2 implementation with advanced strategies.

**New Strategies**:
- **STRAP**: Aggressive bullish strategy (2 CALL + 1 PUT)
- **Bull Call Spread (BCSP)**: Limited-risk, limited-reward bullish play

**Enhancements**:
- Multi-strategy support
- Advanced position management
- Comprehensive testing suite

### Token & Economics

#### 4. **stackflow-flow-token.clar**
Native governance and utility token (SIP-010 compliant).

**Token Details**:
- **Symbol**: FLOW
- **Total Supply**: 100,000,000 FLOW
- **Decimals**: 6
- **Distribution**:
  - Community Rewards: 40M (40%)
  - Ecosystem Fund: 25M (25%)
  - Team: 20M (20%)
  - Liquidity: 10M (10%)
  - Public Distribution: 5M (5%)

**Utility**:
- Governance voting power
- Staking for fee discounts
- Protocol fee payments
- Liquidity incentives

#### 5. **stackflow-staking.clar**
Staking mechanism with tiered benefits system.

**Tier System**:
| Tier | Threshold | Fee Discount | Benefits |
|------|-----------|--------------|----------|
| 🌊 Ripple | 1,000 FLOW | 10% | Basic benefits |
| 🌊🌊 Wave | 5,000 FLOW | 25% | Enhanced rewards |
| 🌊🌊🌊 Current | 20,000 FLOW | 50% | Premium access |
| 🌊🌊🌊🌊 Ocean | 100,000 FLOW | 75% | VIP status |

**Functions**:
- `stake`: Lock FLOW tokens for benefits
- `unstake`: Withdraw staked tokens
- `get-user-tier`: Check current tier
- `calculate-discount`: Get fee discount rate

#### 6. **stackflow-governance.clar**
On-chain governance for protocol decisions.

**Governance Parameters**:
- **Proposal Stake**: 5,000 FLOW minimum
- **Voting Period**: ~10 days (1,440 blocks)
- **Quorum**: 10,000 FLOW minimum participation
- **Approval Threshold**: 60% required

**Proposal Types**:
- `PARAM`: Protocol parameter changes
- `STRATEGY`: New strategy additions
- `TREASURY`: Treasury management
- `UPGRADE`: Contract upgrades

**Functions**:
- `submit-proposal`: Create governance proposal
- `vote-on-proposal`: Cast vote (for/against)
- `execute-proposal`: Execute passed proposals
- `get-proposal`: Read proposal details

### Oracle Infrastructure

#### 7. **price-oracle-trait-v2.clar**
Unified trait for price oracle implementations.

**Interface**:
```clarity
(define-trait price-oracle-trait
  (
    (get-price (string-ascii 12)) (response uint uint))
    (get-last-update () (response uint uint))
  )
)
```

#### 8. **stackflow-oracle-mock-v2.clar**
Mock oracle for testing and simulations.

**Features**:
- Configurable price feeds
- Manual price updates
- Zero external dependencies
- Perfect for testing

**Use Cases**:
- Local development
- Unit testing
- Integration testing
- Simulations

#### 9. **stackflow-pyth-oracle-v2.clar**
Production-ready Pyth Network integration.

**Features**:
- Real-time price feeds
- Cryptographic verification
- Low-latency updates
- Battle-tested reliability

**Supported Assets**:
- BTC/USD
- STX/USD
- ETH/USD
- Custom asset pairs

### Utilities

#### 10. **sip-010-trait-ft-standard.clar**
Standard fungible token trait implementation (SIP-010).

#### 11. **stackflow-sbtc-mock.clar**
Mock sBTC token for testing Bitcoin-backed collateral.

## Quick Start

### Prerequisites

```bash
# Install Clarinet
brew install clarinet

# Install Node.js dependencies
pnpm install
```

### Development Workflow

```bash
# Run all tests
pnpm run test:all

# Run unit tests
pnpm run test:unit

# Run integration tests
pnpm run test:integration

# Run contract API tests
pnpm run test:api

# Run simulation (1000 trades)
pnpm run simulate

# Run quick simulation (200 trades)
pnpm run simulate:quick
```

### Deploy to Testnet

```bash
# Using Clarinet (recommended)
clarinet deployments apply --testnet

# View deployed contracts
clarinet deployments describe --testnet
```

**Requirements**:
- STX for gas (~0.6 STX total)
- Valid mnemonic in `settings/Testnet.toml`
- Testnet network access

## Testing

### Test Coverage

- **Unit Tests**: 31 comprehensive test cases
- **Integration Tests**: Full contract interaction flows
- **Simulation Tests**: 1000+ trade backtests
- **Performance Tests**: Gas efficiency validation

### Running Tests

```bash
# All tests
pnpm run test:all

# Watch mode (auto-rerun on changes)
pnpm run test:watch

# With coverage report
pnpm run test:report
```

**Note**: Some tests require proper mnemonic configuration in `settings/Simnet.toml`. For testing without mnemonic setup, use the simulation runner:

```bash
pnpm run simulate:quick
```

## Simulation Framework

The simulation framework provides realistic backtesting of trading strategies.

### Features

- **Realistic Market Conditions**: Random price movements
- **Multiple Strategies**: CALL and BPSP strategies
- **Comprehensive Metrics**: Success rates, profits, gas costs
- **Risk Analysis**: P&L distribution, win/loss patterns

### Results

**1000 Trade Simulation**:
- Total Profit: **213.13 STX**
- Success Rate: **70.4%** (704/1000 trades)
- CALL Strategy: 42.8% success, 192.62 STX profit
- BPSP Strategy: 98.0% success, 20.51 STX profit
- Gas Efficiency: 0.15 STX per trade

## Deployment Status

### Testnet Deployment ✅

All contracts successfully deployed to Stacks Testnet:

| Contract | Address | Status |
|----------|---------|--------|
| Price Oracle Trait | `ST3F4WEX...price-oracle-trait-v2` | ✅ Live |
| SIP-010 Trait | `ST3F4WEX...sip-010-trait-ft-standard` | ✅ Live |
| Options M1 | `ST3F4WEX...stackflow-options-m1` | ✅ Live |
| Options V2 | `ST3F4WEX...stackflow-options-v2` | ✅ Live |
| Options M2-V2 | `ST3F4WEX...stackflow-options-m2-v2` | ✅ Live |
| Mock Oracle | `ST3F4WEX...stackflow-oracle-mock-v2` | ✅ Live |
| Pyth Oracle | `ST3F4WEX...stackflow-pyth-oracle-v2` | ✅ Live |
| FLOW Token | `ST3F4WEX...stackflow-flow-token` | ✅ Live |
| Staking | `ST3F4WEX...stackflow-staking` | ✅ Live |
| Governance | `ST3F4WEX...stackflow-governance` | ✅ Live |
| sBTC Mock | `ST3F4WEX...stackflow-sbtc-mock` | ✅ Live |

**Explorer**: [View all contracts](https://explorer.hiro.so/address/ST3F4WEX90KZQ6D25TWP09J90D6CSYGW1JX8WH3Y7?chain=testnet)

### Mainnet Deployment 🚧

Mainnet deployment pending after final security audits.

## Project Structure

```
contracts/stackflow-contracts/
├── contracts/              # Smart contract source files (.clar)
│   ├── stackflow-options-v1.clar
│   ├── stackflow-options-v2.clar
│   ├── stackflow-options-m2-v2.clar
│   ├── stackflow-flow-token.clar
│   ├── stackflow-staking.clar
│   ├── stackflow-governance.clar
│   ├── stackflow-oracle-mock-v2.clar
│   ├── stackflow-pyth-oracle-v2.clar
│   ├── price-oracle-trait-v2.clar
│   ├── sip-010-trait-ft-standard.clar
│   └── stackflow-sbtc-mock.clar
├── tests/                  # Test suites
│   ├── unit/              # Vitest unit tests
│   ├── integration/       # Integration tests
│   └── contract-calls/    # Contract API tests
├── simulation/            # Trading strategy simulations
│   └── m1-simulation.ts
├── deployments/           # Clarinet deployment plans
│   ├── default.testnet-plan.yaml
│   ├── default.mainnet-plan.yaml
│   └── default.simnet-plan.yaml
├── settings/              # Network configurations
│   ├── Simnet.toml
│   ├── Devnet.toml
│   └── Testnet.toml
├── Clarinet.toml         # Clarinet project config
├── package.json          # Node.js dependencies
└── README.md            # This file
```

## Contract Interactions

### Create a Call Option

```clarity
(contract-call? .stackflow-options-v1 create-call-option
  u95000000  ;; strike price (95 STX)
  u100       ;; blocks until expiry
  u5000000   ;; premium (5 STX)
  .stackflow-oracle-mock-v2)
```

### Stake FLOW Tokens

```clarity
(contract-call? .stackflow-staking stake u5000000000) ;; 5,000 FLOW
```

### Submit Governance Proposal

```clarity
(contract-call? .stackflow-governance submit-proposal
  "Reduce Trading Fees"
  "Proposal to reduce base trading fee from 0.3% to 0.2%"
  "PARAM"
  (some "base-fee")
  (some u20))
```

### Vote on Proposal

```clarity
(contract-call? .stackflow-governance vote-on-proposal
  u1        ;; proposal ID
  u1000000  ;; vote weight (FLOW tokens)
  true)     ;; vote in favor
```

## Gas Costs

Approximate gas costs for common operations:

| Operation | Gas Cost (STX) | Notes |
|-----------|----------------|-------|
| Create CALL Option | ~0.15 | Basic option creation |
| Create Bull Put Spread | ~0.18 | Two-leg strategy |
| Exercise Option | ~0.12 | Settlement execution |
| Stake FLOW | ~0.10 | Token transfer + update |
| Submit Proposal | ~0.20 | Governance action |
| Vote on Proposal | ~0.08 | Simple vote cast |

## Security Considerations

### Audits

- ✅ Internal code review completed
- 🚧 External security audit pending
- 🚧 Formal verification in progress

### Best Practices

- All contracts use Clarity 3
- Strict error handling
- Comprehensive input validation
- Guard rails for critical operations
- Pausable emergency mechanisms

### Known Limitations

- Oracle updates require trust in data source
- Governance proposals require minimum stake
- Contract upgrades require proposal approval

## Development Tools

### Clarinet Commands

```bash
# Check contract syntax
clarinet check

# Run console for interactive testing
clarinet console

# Generate deployment plan
clarinet deployments generate --testnet

# Apply deployment
clarinet deployments apply --testnet
```

### Useful Scripts

```bash
# Deploy all contracts
node deploy-all-contracts.js

# Initialize ecosystem
node initialize-ecosystem.js

# Test all functions
node test-all-functions.js

# Check contract state
node check-state.js
```

## Milestones

### ✅ Milestone 1 (Completed)

- CALL and BPSP strategies
- Mock oracle integration
- Comprehensive testing
- Testnet deployment
- 70.4% success rate achieved

### ✅ Milestone 2 (Completed)

- STRAP and Bull Call Spread strategies
- Pyth oracle integration
- FLOW token implementation
- Staking mechanism
- Governance system
- Advanced simulation framework

### 🚧 Milestone 3 (In Progress)

- Security audits
- Mainnet deployment
- Additional strategies
- Enhanced UI/UX
- Liquidity mining

## Resources

### Documentation

- [Deployment Guide](DEPLOYMENT.md)
- [Test Documentation](tests/README.md)
- [Clarinet Docs](https://docs.hiro.so/clarinet)
- [Stacks Docs](https://docs.stacks.co)

### Explorer Links

- [Testnet Explorer](https://explorer.hiro.so/?chain=testnet)
- [Contract Deployer](https://explorer.hiro.so/address/ST3F4WEX90KZQ6D25TWP09J90D6CSYGW1JX8WH3Y7?chain=testnet)

### Community

- Discord: [Join our community](#)
- Twitter: [@StackFlowOptions](#)
- Docs: [docs.stackflow.xyz](#)

## Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**StackFlow Options** - Bitcoin-secured derivatives trading on Stacks 🚀

Built with Clarity 3 | Powered by Stacks Blockchain | Secured by Bitcoin
