# StackFlow

**Ride the flow of capital and sentiment on Stacks**

StackFlow is a Bitcoin-secured DeFi and sentiment trading platform built on Stacks blockchain. Track whales, copy trades, and engage in meme-driven investing with professional trading strategies made simple.

## Features

- 🐋 **Copy Trading** - Automatically mirror successful whale and efficient trader wallets
- 🎯 **Capital Sentiment Strategies** - 12 proven strategies for bullish, bearish, volatile, and stable markets
- 🎪 **Meme-Driven Investing** - Community pools driven by viral content and social sentiment
- 🌊 **FLOW Token Ecosystem** - Native token with staking, governance, and fee discounts
- 🔐 **Self-Custody** - Your assets never leave your wallet
- ⚡ **Bitcoin Security** - Built on Stacks, secured by Bitcoin

## FLOW Token

**FLOW** is the native utility and governance token of StackFlow with a fixed supply of **100M tokens**.

### Token Utility

1. **🎯 Fee Discounts**: Stake FLOW to earn up to 75% discount on trading fees
   - Ripple Tier (1K FLOW): 10% discount
   - Wave Tier (5K FLOW): 25% discount
   - Current Tier (20K FLOW): 50% discount
   - Ocean Tier (100K FLOW): 75% discount

2. **🗳️ Governance**: Vote on protocol changes, new strategies, and treasury allocation
   - 1 FLOW = 1 Vote
   - 5,000 FLOW minimum to submit proposals

3. **💰 Whale Rewards**: Verified traders earn FLOW for providing copy trading signals

4. **🌊 Liquidity Mining**: Stake capital in copy trading pools to earn FLOW rewards

5. **🔓 Premium Access**: Hold FLOW to unlock advanced features
   - 500+ FLOW: Premium analytics
   - 2,000+ FLOW: AI sentiment reports
   - 10,000+ FLOW: Early access to strategies
   - 50,000+ FLOW: Private whale signals

### Distribution
- 40% Community Rewards (vested over 4 years)
- 25% Ecosystem Development (vested over 5 years)
- 20% Team (4-year vesting, 1-year cliff)
- 10% Liquidity Provision
- 5% Public Distribution

**Contract**: `SP3F4WEX90KZQ6D25TWP09J90D6CSYGW1JWXN5YF4.stackflow-flow-token`

Learn more in our [FLOW Token Narrative](./FLOW_NARRATIVE.md) and [Tokenomics Document](./FLOW_TOKENOMICS.md).

## Documentation

- **[Whitepaper](./WHITEPAPER.md)** - Complete platform documentation
- **[Migration Plan](./STACKFLOW_MIGRATION_PLAN.md)** - Technical implementation details

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (we use pnpm, not npm)
- A Stacks wallet (Leather or Xverse)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp env.example .env

# Start development server
pnpm dev
```

### Build for Production

```bash
# Type check and build
pnpm build

# Preview production build
pnpm preview
```

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS
- **Blockchain**: Stacks (@stacks/connect, @stacks/transactions)
- **State Management**: React Context + TanStack Query
- **Routing**: React Router v7
- **Charts**: Lightweight Charts

## Project Structure

```
src/
├── components/
│   ├── app/          # Trading app components
│   ├── atoms/        # Basic UI components
│   ├── molecules/    # Composite components
│   ├── layout/       # Layout wrappers
│   └── pages/        # Page components
├── hooks/            # Custom React hooks
├── context/          # React context providers
├── utils/            # Utility functions
├── blockchain/       # Blockchain integration
└── lib/              # Shared libraries
```

## Environment Variables

Create a `.env` file based on `env.example`:

```env
VITE_STACKS_NETWORK=testnet
VITE_STACKS_API_URL=https://api.testnet.hiro.so
VITE_APP_NAME=StackFlow
VITE_APP_ICON=/src/assets/stackflow-icon.svg
```

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

- All smart contracts are audited before deployment
- Non-custodial architecture - you control your funds
- Open-source for community review
- Report security issues to: security@stackflow.io

## Community

- **Twitter**: [@stackflowBTC](https://x.com/stackflowBTC)
- **Website**: [stackflow](https://stack-flow-myqo.vercel.app/)

## License

MIT License - see LICENSE file for details

## Hackathon

Built for Stacks Hackathon - demonstrating Bitcoin-secured DeFi with sentiment trading.

---

*Built with Bitcoin. Powered by Stacks. Driven by Community.*
