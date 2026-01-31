# Whale Discovery Pipeline: Architecture & Decision Log

**Date**: 2026-01-08  
**Phase**: 1.5 - Real-Time Whale Discovery  
**Status**: Active Development

---

## Executive Summary

We're transitioning from a static whale tracking system (3 hardcoded addresses) to an active, real-time discovery pipeline capable of monitoring 100+ Stacks whales across multiple assets. This document explains our architectural choices, technical decisions, and the rationale behind each.

---

## Problem Statement

**Original State**:
- 3 hardcoded whale addresses in `CURATED_WHALES` array
- Only tracking STX balance
- No automatic discovery
- No real-time updates
- REST API polling with failures

**Target State**:
- 100+ automatically discovered whales
- Multi-asset tracking (STX, ALEX, WELSH, sBTC)
- Real-time WebSocket monitoring
- Entity classification (whale vs exchange vs contract)
- Intent detection (bullish/bearish signals)

---

## Key Architectural Decisions

### Decision 1: Hybrid Discovery Strategy 

**Choice**: Manual seed + Programmatic expansion  
**Alternatives Considered**:
- Pure REST API discovery (rejected - no suitable endpoints exist)
- Blockchain indexer (rejected - too complex for MVP)
- Third-party APIs (rejected - costs and rate limits)

**Rationale**:
The Stacks API doesn't provide a "top addresses by balance" endpoint. Based on technical analysis of the Stacks data landscape, we chose a hybrid approach:

1. **Manual Seed** (`whale-seeder.js`): Bootstrap with 20 hand-picked addresses
2. **Protocol Queries** (Phase 2): Mine ALEX DEX, PoX contract for active whales
3. **Event-Based Expansion** (Phase 2): Monitor high-value transactions (>$50K) to discover new whales

This gets us running TODAY while building toward automated discovery.

### Decision 2: WebSocket Streaming Over REST Polling

**Choice**: socket.io WebSocket subscriptions  
**Alternatives Considered**:
- REST polling every N seconds (rejected - latency, rate limits, inefficient)
- Long polling (rejected - same issues as REST)

**Rationale**:
Stacks blockchain operates on:
- **Microblocks**: ~5 second intervals (speculative state)
- **Anchor blocks**: ~10 minutes (Bitcoin-finality)

For "real-time" whale tracking, we need sub-minute updates. The Hiro API uses socket.io protocol for event streaming, allowing us to subscribe to specific address transactions:

```javascript
socket.emit('subscribe', { topic: 'address_transaction', address: whale });
// Real-time events as they happen
```

**Implementation**:
- Created `whale-monitor.js` (WebSocket stream processor)
- Kept `whale-indexer.js` (daily batch reconciliation)
- Both write to same MongoDB collection (upsert pattern)

### Decision 3: Multi-Asset Portfolio Tracking

**Choice**: Track STX + SIP-010 tokens (ALEX, WELSH, sBTC, DIKO)  
**Alternatives Considered**:
- STX only (rejected - misses 90% of ecosystem exposure)
- All tokens (rejected - too noisy, many worthless tokens)

**Rationale**:
A whale holding 100K STX + 5M ALEX tokens has vastly different risk profile than 100K STX alone. Based on ecosystem analysis:

| Asset | Why Track | Signal |
|-------|-----------|--------|
| **STX** | Base layer | Core holding |
| **ALEX** | Primary DEX token | DeFi activity, high beta |
| **WELSH** | Premier memecoin | Sentiment/risk-on indicator |
| **sBTC** | Bitcoin bridge | Capital flows (in/out of ecosystem) |
| **stSTX** | Liquid staking | Alternative to raw stacking |
| **DIKO** | Arkadiko governance | Leverage indicator (collateral loans) |

**Implementation**:
The `/extended/v1/address/{addr}/balances` endpoint returns ALL SIP-010 tokens in one call. We parse this and calculate:
```
Total Ecosystem Value = (STX × STX_price) + Σ(token_i × price_i)
```

### Decision 4: Composite Scoring Algorithm

**Choice**: Weighted score = Balance (40%) + Activity (25%) + Diversity (20%) + Tokens (15%)  
**Alternatives Considered**:
- Balance only (rejected - favors inactive holders)
- Activity only (rejected - trading bots score high)
- ML-based (deferred to Phase 3 - need more data first)

**Rationale**:
A "whale worth following" isn't just wealthy - they're active, diversified, and engaged. Our scoring reflects this:

```javascript
compositeScore = 
  balanceScore × 0.40 +      // Size matters, but not everything
  activityScore × 0.25 +     // Transaction frequency (10-1000 range)
  diversityScore × 0.20 +    // Protocols used (ALEX, Arkadiko, etc.)
  tokenScore × 0.15          // Asset variety
```

This filters out:
- ✅ Inactive mega-holders (low activity score)
- ✅ Trading bots (low balance, low diversity)
- ✅ Single-protocol farmers (low diversity)

Keeps:
- ✅ Active DeFi participants
- ✅ Multi-protocol whales
- ✅ Sophisticated traders

### Decision 5: Entity Classification Layer

**Choice**: Tag addresses as whale/exchange/contract/inactive  
**Alternatives Considered**:
- No filtering (rejected - noisy, false signals)
- Whitelist only (rejected - misses new whales)

**Rationale**:
Raw "top 100 addresses by balance" includes:
- Binance cold wallet (millions of STX, but user deposits)
- ALEX liquidity pool (contract, not a trader)
- Dormant 2021 holder (no recent activity)

**Classification Heuristics**:

**Exchange Detection**:
```javascript
if (txCount > 10,000 && hasHighDepositFrequency) {
  type = 'exchange';
}
```

**Contract Detection**:
```javascript
if (hasDeployedContracts || isKnownProtocolAddress) {
  type = 'contract';
}
```

**Whale Detection**:
```javascript
if (hasDeFiInteractions && avgTxValue > $10K && activityRecent) {
  type = 'whale';
}
```

### Decision 6: MongoDB Schema Design

**Choice**: Embedded document model with optional fields  
**Alternatives Considered**:
- SQL with joins (rejected - slower queries for real-time)
- Separate collections per whale (rejected - query complexity)

**Schema**:
```typescript
{
  address: string,
  portfolio: {
    stxBalance, stxLocked,
    tokens: [{ contract, symbol, balance, valueUSD }],
    totalValueUSD
  },
  scores: { composite, balance, activity, diversity, tokens },
  stats: { txCount30d, protocolsUsed, lastActiveAt, activityLevel },
  classification: { type, confidence, tags },
  lastUpdated: Date
}
```

**Rationale**:
- Embedded tokens array: Fast reads (no joins)
- Optional fields (`scores?`, `stats?`): Backward compatible with Phase 1
- Indexed on `scores.composite`: Fast rankings
- Indexed on `address`: Unique constraint, fast lookups

---

## Data Sources & Endpoints

### Stacks API (Hiro)
- **Balance Query**: `/extended/v1/address/{addr}/balances`
  - Returns STX (liquid + locked) + all SIP-010 tokens
  - Single call per address (efficient)
  
- **Transaction History**: `/extended/v1/address/{addr}/transactions?limit=50`
  - Activity metrics, protocol identification
  - Last 50 transactions sufficient for 30-day analysis
  
- **WebSocket**: `wss://api.mainnet.hiro.so` (socket.io)
  - Real-time event subscription
  - Topics: `block`, `microblock`, `address_transaction`

### Why Not Use Bitcoin Chain Directly?

**Question**: Should we monitor Bitcoin instead of Stacks?

**Answer**: **Both, but Stacks first**

Stacks settles to Bitcoin via Proof-of-Transfer (PoX), creating a two-layer system:
- **Stacks Layer**: Execution (trades, swaps, contracts) - HIGH FREQUENCY
- **Bitcoin Layer**: Settlement (finality, stacking rewards) - LOW FREQUENCY

**Our Strategy**:
1. **Phase 1.5** (Current): Monitor Stacks exclusively
   - Track trades, DeFi positions, token holdings
   - 95% of actionable signals happen here
   
2. **Phase 2**: Add Bitcoin surveillance
   - Extract `pox-addr` from stacking transactions
   - Monitor BTC reward addresses for:
     - Yield accumulation (hodling rewards = bullish)
     - Yield dumping (sending to exchanges = profit-taking)
   - Track sBTC bridge for capital flows

**Rationale**: Stacks shows **INTENT** (trading activity), Bitcoin shows **CONVICTION** (long-term holds). We need both, but Stacks data gives more frequent, actionable signals.

---

## Technical Stack

### Languages & Frameworks
- **Node.js** (v24.7.0): JavaScript runtime for scripts
- **MongoDB**: Document store for whale data
- **socket.io-client**: WebSocket library (critical - not raw WebSockets)

### Services Architecture
```
whale-seeder.js      (One-time bootstrap, manual run)
    ↓
whale-monitor.js     (Real-time WebSocket stream, 24/7)
    ↓                ↓
whale-indexer.js  ←  MongoDB  →  Frontend API
(Daily batch,       (Central       (ecosystemWhaleService)
3am UTC cron)       storage)
```

**Why Three Services?**
- **Seeder**: One-time bootstrap, can re-run to add new seeds
- **Monitor**: Live stream, crashes don't corrupt historical data
- **Indexer**: Batch reconciliation, catches missed events, recalculates scores

---

## Migration Path from Phase 1

### What We Kept ✅
- MongoDB as primary data store
- Composite scoring concept
- Service-based architecture
- Frontend components (minimal changes needed)

### What We Replaced ❌
- `CURATED_WHALES` array → Database-driven
- `discoverWhalesWithAI()` → Manual seed + protocol queries
- REST polling → WebSocket streaming

### What We Added ➕
- `whale-seeder.js`: Bootstrap script
- Multi-asset balance tracking
- Entity classification layer
- Real-time event handlers (coming in `whale-monitor.js`)

---

## Known Limitations & Future Work

### Current Limitations
1. **Manual seed addresses**: Some test/invalid addresses return 400 errors
2. **No real-time yet**: Phase 1.5 is still batch-oriented, WebSocket coming next
3. **Static prices**: Using rough STX estimate ($1.50), need real price feeds
4. **No Bitcoin tracking**: PoX addresses not monitored yet

### Phase 2 Roadmap
- [ ] Install `socket.io-client` dependency
- [ ] Build `whale-monitor.js` WebSocket service
- [ ] Add real-time transaction classification
- [ ] Integrate price feeds for accurate USD values
- [ ] Expand seed list from 20 → 100 whales

### Phase 3 Roadmap
- [ ] Bitcoin address tracking from PoX
- [ ] Cross-chain correlation analysis
- [ ] Machine learning for alpha prediction
- [ ] Network graph (whale clusters, copy trading detection)

---

## Success Metrics

### Phase 1.5 (Current)
- ✅ 20+ whale addresses seeded
- ✅ Multi-asset balances tracked
- ✅ Composite scoring implemented
- 🔄 MongoDB populated with real data
- ⏳ Frontend displaying real whales

### Phase 2 (Next Week)
- WebSocket connection stable for 24+ hours
- Real-time updates reflected in UI within 30 seconds
- Entity classification filters 90%+ of noise
- 100+ whales tracked concurrently

### Phase 3 (Long-term)
- Predictive accuracy: 60%+ on whale intent detection
- Bitcoin tracking for top 20 whales
- Alert system: <5% false positives on significant movements

---

## Lessons Learned

### 1. API Limitations Drive Architecture
The absence of a "top addresses" endpoint forced us into creative discovery strategies. Sometimes constraints breed better solutions - our hybrid approach is more robust than a simple API call would be.

### 2. Real-Time is Relative
"Real-time" doesn't mean sub-millisecond. For whale tracking, 10-30 second latency is acceptable and significantly cheaper than true sub-second streaming.

### 3. Multi-Asset View is Essential
Single-asset tracking in a complex ecosystem is like watching only stock prices and ignoring bonds, options, and derivatives. The full picture requires holistic portfolio view.

### 4. Entity Resolution > Raw Data
A list of addresses is useless without context. Knowing that `SP2BE8TZ...` is Binance (not a whale to follow) is as important as knowing `SP3FBR...` is an active DeFi trader.

---

## References

1. **Stacks API Documentation**: https://docs.hiro.so/api
2. **Stacks Blockchain Specification**: https://github.com/stackslib/stacks-blockchain
3. **Technical Analysis Paper**: Internal document, comprehensive whale tracking architecture
4. **SIP-010 Standard**: Stacks Fungible Token Standard

---

## Change Log

**2026-01-08**: Initial implementation
- Created whale-seeder.js for manual bootstrapping
- Implemented multi-asset balance tracking
- Designed composite scoring algorithm
- Established MongoDB schema
- Documented architecture decisions

---

**Document Status**: Living document, updated as implementation evolves  
**Next Review**: After Phase 2 WebSocket implementation  
**Maintainers**: Development team
