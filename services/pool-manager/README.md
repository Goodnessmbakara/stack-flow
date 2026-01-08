# Pool Manager Service

Automated whale portfolio analysis and pool rebalancing service for StackFlow Whale Strategy Pools.

## Overview

This service monitors whale portfolios from MongoDB, calculates optimal pool allocations, detects drift, and proposes rebalancing transactions. It runs on a 6-hour cron schedule and exposes an HTTP API for manual operations.

## Features

- **Automated Analysis**: Analyzes pools every 6 hours
- **Drift Detection**: Triggers rebalancing when drift >10%
- **Cost Optimization**: Calculates optimal swap sequences
- **Slippage Protection**: Validates swaps before execution
- **HTTP API**: Manual analysis and monitoring endpoints
- **Comprehensive Logging**: Winston-based logging to file and console

## Installation

```bash
npm install
```

## Configuration

Create `.env` file:

```bash
cp .env.example .env
```

Required environment variables:

```bash
# MongoDB
MONGODB_URI=mongodb+srv://your-connection-string
DB_NAME=stackflow

# Stacks Network
STACKS_NETWORK=mainnet
POOL_CONTRACT_ADDRESS=SP...your-deployed-contract

# Service
PORT=5182
LOG_LEVEL=info
```

## Usage

### Development Mode

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

### Testing

```bash
npm test
```

## API Endpoints

### Health Check
```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "service": "pool-manager",
  "timestamp": "2026-01-08T23:00:00.000Z",
  "poolsConfigured": 1
}
```

### List Pools
```
GET /api/pools
```

Response:
```json
{
  "pools": [
    {
      "poolId": "1",
      "name": "DeFi Whale Index",
      "followedWhales": 3,
      "threshold": 0.10
    }
  ]
}
```

### Get Pool Analysis
```
GET /api/pools/:id/analysis
```

Response:
```json
{
  "poolId": "1",
  "driftPercentage": 0.15,
  "needsRebalance": true,
  "targetAllocation": {
    "STX": 0.6,
    "ALEX": 0.3,
    "WELSH": 0.1
  },
  "currentAllocation": {
    "STX": 0.7,
    "ALEX": 0.2,
    "WELSH": 0.1
  },
  "poolTVL": 100000,
  "estimatedCost": {
    "gasCostSTX": 0.09,
    "slippageCostSTX": 150,
    "totalCostPercent": 0.15
  },
  "timestamp": "2026-01-08T23:00:00.000Z"
}
```

### Trigger Manual Analysis
```
POST /api/pools/:id/analyze
```

Response:
```json
{
  "analysis": { /* analysis result */ },
  "swaps": [
    {
      "from": "STX",
      "to": "ALEX",
      "amountUSD": 10000,
      "estimatedSlippage": 0.012,
      "dex": "ALEX"
    }
  ],
  "validation": {
    "valid": true,
    "errors": []
  }
}
```

## Architecture

### Components

1. **PoolAnalyzer** (`src/pool-analyzer.ts`)
   - Fetches whale portfolios from MongoDB
   - Calculates weighted average allocations
   - Compares with current pool holdings
   - Detects drift from target

2. **RebalanceCalculator** (`src/rebalance-calculator.ts`)
   - Calculates optimal swap sequences
   - Estimates slippage and gas costs
   - Selects best DEX for each swap
   - Validates swap safety

3. **Main Service** (`src/index.ts`)
   - Cron job scheduling
   - HTTP API server
   - Integration layer
   - Error handling & logging

### Data Flow

```
┌─────────────┐         ┌──────────────┐
│   MongoDB   │────────▶│PoolAnalyzer │
│ (17 Whales) │         └──────┬───────┘
└─────────────┘                │
                               ▼
                        ┌──────────────┐
                        │ Drift Check  │
                        └──────┬───────┘
                               │ >10%?
                               ▼
                     ┌──────────────────┐
                     │RebalanceCalculator│
                     └─────────┬─────────┘
                               │
                               ▼
                      ┌─────────────────┐
                      │ Validation      │
                      └────────┬────────┘
                               │ Valid?
                               ▼
                    ┌──────────────────────┐
                    │ Governance Proposal  │
                    └──────────────────────┘
```

## Cron Schedule

- **Pool Analysis**: Every 6 hours (`0 */6 * * *`)
- **Health Check**: Every hour (`0 * * * *`)

## Logging

Logs are written to:
- Console (with colors)
- `pool-manager.log` file

Log levels:
- `error`: Critical failures
- `warn`: Non-critical issues
- `info`: Normal operations
- `debug`: Detailed debugging

## Error Handling

The service handles:
- MongoDB connection failures (auto-reconnect)
- Whale data inconsistencies (skip invalid data)
- Smart contract read failures (retry with backoff)
- Invalid swap calculations (log and alert)

## Integration with Smart Contracts

This service integrates with:

1. **whale-pool-vault.clar**
   - Reads current pool allocations
   - Reads pool TVL
   - Checks pool status

2. **pool-rebalancer.clar**
   - Creates rebalancing proposals
   - Executes approved swaps

3. **stackflow-governance.clar**
   - Submits rebalancing proposals
   - Monitors voting status

## Development

### Code Structure

```
src/
├── pool-analyzer.ts       # Portfolio analysis logic
├── rebalance-calculator.ts # Swap calculation logic
├── logger.ts              # Winston configuration
└── index.ts               # Main service entry point
```

### Adding New Features

1. Create new service class in `src/`
2. Import into `index.ts`
3. Add to cron schedule or API routes
4. Write tests in `tests/`
5. Update this README

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm test:watch

# Coverage
npm test:coverage
```

## Deployment

### Production Deployment

```bash
# Build
npm run build

# Start PM2
pm2 start dist/index.js --name pool-manager

# Monitor
pm2 logs pool-manager
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
CMD ["node", "dist/index.js"]
```

## Troubleshooting

### Common Issues

**MongoDB Connection Failed**
- Check MONGODB_URI in .env
- Ensure MongoDB Atlas whitelist includes your IP
- Verify network connectivity

**No Whale Data**
- Ensure whale-monitor.js is running
- Check MongoDB has whaleProfiles collection
- Verify whale addresses in pool config

**Rebalancing Not Triggering**
- Check drift calculation: drift < threshold
- Verify cron job is running: check logs
- Ensure pool contract address is correct

## Performance

- **Memory**: ~50MB baseline
- **CPU**: <5% during analysis
- **Network**: ~1MB per analysis cycle
- **MongoDB Queries**: ~10 queries per analysis

## Security

- No private keys stored
- Read-only MongoDB access
- Rate-limited API endpoints
- Input validation on all requests
- Secure environment variable handling

## License

MIT

## Support

For issues or questions:
- GitHub Issues: [stackflow/issues](https://github.com/yourrepo/stackflow/issues)
- Discord: [StackFlow Community](https://discord.gg/stackflow)
- Email: dev@stackflow.xyz

---

**Last Updated**: January 2026
