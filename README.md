# StackFlow - DeFi Sentiment & Whale Strategy Platform

**The first comprehensive DeFi platform on Stacks combining sentiment analysis, whale tracking, and automated investment pools**

[![Live Demo](https://img.shields.io/badge/demo-live-green)](https://stackflow.xyz)
[![Stacks](https://img.shields.io/badge/built%20on-Stacks-purple)](https://stacks.co)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## 🚀 What is StackFlow?

StackFlow is a next-generation DeFi platform that brings institutional-grade investment strategies to everyone on the Stacks blockchain. We track 17 top whales in real-time, analyze market sentiment with AI, and offer automated investment pools that mirror the strategies of successful traders.

### Key Features:

🐋 **Whale Strategy Pools** - *NEW!*
- First whale-following index funds on Bitcoin L2
- Automated portfolio rebalancing based on top traders
- Security-hardened smart contracts with 7 layers of protection
- 0.5% annual management fee + 10% performance fee

📊 **Real-Time Whale Monitoring**
- Track 17 top Stacks whales live
- WebSocket-powered instant transaction alerts
- Portfolio analysis and performance metrics
- Historical tracking and pattern recognition

🤖 **AI Sentiment Analysis**
- Gemini-powered market sentiment tracking
- Real-time social media analysis
- Sentiment-indexed trading signals

💰 **Governance & Staking**
- FLOW token for platform governance
- Staking rewards (15% APY)
- Vote on pool strategies and upgrades

---

## 📦 Project Structure

```
stackflow/
├── contracts/
│   ├── stackflow-contracts/          # Core DeFi contracts
│   │   ├── stackflow-flow-token.clar # FLOW governance token
│   │   ├── stackflow-staking.clar    # Staking mechanism
│   │   └── stackflow-governance.clar # DAO governance
│   └── whale-pools/                  # Whale Strategy Pools (NEW)
│       ├── whale-pool-vault.clar     # Vault for user deposits
│       ├── pool-rebalancer.clar      # DEX integration & rebalancing
│       └── traits/                   # SIP-010 & DEX traits
│
├── src/                              # React frontend
│   ├── components/
│   │   ├── pages/
│   │   │   ├── copy-trading-dashboard.tsx  # Main dashboard
│   │   │   └── ...
│   │   └── ui/
│   │       ├── whale-alert.tsx       # Real-time alerts
│   │       └── ...
│   ├── hooks/
│   │   └── useWhaleWebSocket.ts      # WebSocket connection
│   ├── services/
│   │   └── ecosystemWhaleService.ts  # Whale data fetching
│   └── context/
│       └── WalletContext.tsx         # Stacks wallet integration
│
├── services/                         # Backend services
│   └── pool-manager/                 # Whale Pool automation (NEW)
│       ├── src/
│       │   ├── pool-analyzer.ts      # Portfolio analysis
│       │   ├── rebalance-calculator.ts # Swap optimization
│       │   └── index.ts              # Main service
│       └── package.json
│
├── scripts/
│   ├── whale-monitor.js              # Real-time whale tracking
│   ├── price-proxy.js                # Multi-asset pricing
│   └── gemini-proxy.js               # AI sentiment analysis
│
└── docs/
    ├── WHALE_STRATEGY_POOLS_DESIGN.md
    └── WHALE_POOLS_3WEEK_PLAN.md
```

---

## 🏗️ Tech Stack

### Smart Contracts
- **Clarity** - Decidable smart contract language (Stacks)
- **Clarinet** - Testing and deployment framework
- **Stacks.js** - JavaScript SDK for Stacks

### Frontend
- **React 18** + **TypeScript**
- **Vite** - Lightning-fast build tool
- **TailwindCSS** - Utility-first styling
- **Socket.io** - Real-time WebSocket connections
- **Stacks Connect** - Wallet integration

### Backend Services
- **Node.js** + **TypeScript**
- **MongoDB Atlas** - Whale data storage
- **Express** - API server
- **node-cron** - Scheduled tasks
- **Winston** - Logging

### Infrastructure
- **Stacks Blockchain** (Bitcoin L2)
- **ALEX DEX** - Primary swap execution
- **Velar DEX** - Fallback routing
- **Pyth Oracle** - Price feeds

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- MongoDB Atlas account
- Clarinet (for smart contract development)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/stackflow.git
cd stackflow

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB URI and API keys

# Install pool manager dependencies
cd services/pool-manager
pnpm install
cd ../..
```

### Running the Application

#### Option 1: Full Stack (Recommended)
```bash
# Starts frontend + all backend services
pnpm dev:full
```

This starts:
- Frontend: http://localhost:5173
- Whale Monitor: ws://localhost:5181
- Price Proxy: http://localhost:5177
- Gemini Proxy: http://localhost:5178
- Mongo Proxy: http://localhost:5179

#### Option 2: Individual Services
```bash
# Frontend only
pnpm dev

# Whale monitor only
pnpm start:whale-monitor

# Pool manager (NEW)
cd services/pool-manager
pnpm dev
```

### Smart Contract Development

```bash
# Check contracts
cd contracts/whale-pools
clarinet check

# Run tests
clarinet test

# Deploy to testnet
clarinet deploy --testnet
```

---

## 🐋 Whale Strategy Pools

### How It Works

1. **Whale Tracking**: Our system monitors 17 top Stacks traders in real-time
2. **Portfolio Analysis**: AI analyzes their holdings and calculates optimal allocations
3. **Automated Rebalancing**: Smart contracts automatically adjust pool holdings to match whale strategies
4. **User Investment**: Deposit STX, receive pool shares, earn returns

### Available Pools

| Pool Name | Risk Level | Strategy | Target Return |
|-----------|------------|----------|---------------|
| DeFi Whale Index | Moderate | Top DeFi traders | 15-25% APY |
| Meme Whale Portfolio | High | WELSH/meme specialists | 30-50% APY |
| Conservative Stacker | Low | PoX participants | 8-12% APY |

### Security Features

✅ **7 Layers of Protection**:
1. First-deposit attack prevention
2. Flash loan protection (7-day timelock)
3. Rate limiting (spam prevention)
4. TVL caps (blast radius limitation)
5. Circuit breakers (anomaly detection)
6. Emergency pause controls
7. Comprehensive event logging

✅ **Professional Audit**: Planned before mainnet launch  
✅ **Bug Bounty**: $2k fund for security researchers  
✅ **Insurance Fund**: 5% of management fees

---

## 📊 API Documentation

### Whale Monitor WebSocket

Connect to real-time whale tracking:

```typescript
import io from 'socket.io-client';

const socket = io('ws://localhost:5181');

socket.on('whale:transaction', (tx) => {
  console.log('Whale transaction:', tx);
  // { whale, action, amount, token, timestamp }
});
```

### Pool Manager REST API

```bash
# Health check
GET http://localhost:5182/health

# List all pools
GET http://localhost:5182/api/pools

# Get pool analysis
GET http://localhost:5182/api/pools/:id/analysis

# Trigger manual analysis
POST http://localhost:5182/api/pools/:id/analyze
```

---

## 🛠️ Development

### Project Commands

```bash
# Development
pnpm dev              # Start frontend
pnpm dev:full         # Start full stack
pnpm build            # Build for production

# Services
pnpm start:whale-monitor    # Whale tracking service
pnpm start:price-proxy      # Price feed service
pnpm start:gemini-proxy     # AI sentiment service

# Smart Contracts
cd contracts/whale-pools
clarinet check        # Verify syntax
clarinet test         # Run tests
clarinet deploy       # Deploy contracts

# Pool Manager
cd services/pool-manager
pnpm dev             # Development mode
pnpm build           # Build TypeScript
pnpm start           # Run production
```

### Environment Variables

Required in `.env`:

```bash
# MongoDB
MONGODB_URI=mongodb+srv://...
DB_NAME=stackflow

# Stacks Network
VITE_STACKS_NETWORK=mainnet
POOL_CONTRACT_ADDRESS=SP...

# APIs
GEMINI_API_KEY=your-key
COINGECKO_API_KEY=your-key

# Services
PORT=5182
LOG_LEVEL=info
```

---

## 🧪 Testing

### Smart Contracts

```bash
cd contracts/whale-pools
clarinet test

# Specific test file
clarinet test tests/whale-pool-vault.test.ts

# Coverage report
clarinet test --coverage
```

### Backend Services

```bash
cd services/pool-manager
pnpm test

# Watch mode
pnpm test:watch
```

### Integration Tests

```bash
# E2E tests (coming soon)
pnpm test:e2e
```

---

## 📈 Roadmap

### ✅ Completed (Q4 2025)
- Real-time whale monitoring (17 whales)
- WebSocket infrastructure
- MongoDB analytics storage
- Frontend dashboard
- FLOW token contracts
- Staking & governance

### ✅ Completed (Q1 2026)
- Whale Strategy Pools smart contracts
- Pool rebalancer with DEX integration
- Backend automation service
- Security hardening (7 layers)
- API endpoints

### 🔜 Upcoming (Q1 2026)
- [ ] Comprehensive test suite (>95% coverage)
- [ ] Professional security audit
- [ ] Testnet deployment
- [ ] Beta launch ($25k TVL cap)
- [ ] Frontend pool management UI

### 🎯 Future (Q2 2026+)
- [ ] Public mainnet launch
- [ ] Mobile app (iOS/Android)
- [ ] Advanced analytics dashboard
- [ ] Cross-chain integration (sBTC)
- [ ] Institutional features

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Bug Reports

Found a bug? Please open an issue with:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/logs if applicable

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Stacks Foundation** - For the amazing blockchain infrastructure
- **ALEX** - DEX integration and liquidity
- **Hiro** - Development tools and APIs
- **Pyth Network** - Oracle price feeds
- **Community** - For feedback and support

---

## 📞 Contact & Support

- **Website**: https://stackflow.xyz
- **Discord**: https://discord.gg/stackflow
- **Twitter**: [@StackFlowDeFi](https://twitter.com/StackFlowDeFi)
- **Email**: support@stackflow.xyz
- **Docs**: https://docs.stackflow.xyz

---

## ⚠️ Disclaimer

StackFlow is in active development. Smart contracts have not been audited yet. Use at your own risk. Never invest more than you can afford to lose. This is not financial advice.

---

**Built with ❤️ on Stacks (Bitcoin L2)**

*Last Updated: January 2026*
