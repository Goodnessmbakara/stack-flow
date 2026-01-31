# Whale Strategy Pools - Implementation Design

**Date**: 2026-01-08  
**Status**: Design Phase  
**Priority**: Beta Feature for Milestone 3

---

## Executive Summary

**Whale Strategy Pools** are index funds that mirror the portfolio allocations of the most successful whales on Stacks. Instead of real-time trade copying (which suffers from execution lag and liquidity issues), we implement **strategic portfolio mirroring** with periodic rebalancing.

### Key Insight
We already have 80% of the required infrastructure:
- ✅ Real-time whale monitoring (`whale-monitor.js` - tracking 17 whales)
- ✅ Whale discovery & scoring (`whale-indexer.js`)
- ✅ Performance analytics (MongoDB)
- ✅ Frontend whale tracking (WhaleTracker component)

**What's Missing**: Smart contracts for pooled deposits + automated rebalancing

---

## Product Positioning

### ❌ NOT THIS:
"Copy Trading" - Users expect instant trade mirroring (impossible due to lag)

### ✅ THIS:
**"Whale Strategy Pools"** - *"Invest like the smartest wallets on Stacks"*
- Index funds that track whale portfolio allocations
- Monthly rebalancing to match whale holdings
- Transparent performance vs whale benchmarks

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    USER DEPOSITS STX                         │
│                 Receives Pool Share Tokens                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  whale-pool-vault.clar     │ ← Smart Contract
        │  - Holds pooled STX        │
        │  - Mints/burns shares      │
        │  - Tracks allocations      │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  pool-manager-service.ts   │ ← Backend Service
        │  - Fetches whale portfolios│
        │  - Calculates target alloc │
        │  - Proposes rebalancing    │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  pool-rebalancer.clar      │ ← Smart Contract
        │  - Executes DEX swaps      │
        │  - Slippage protection     │
        │  - Multi-DEX routing       │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  ALEX DEX / Velar          │ ← External DEXs
        │  - STX ↔ ALEX/WELSH swaps │
        └────────────────────────────┘
```

---

## Three Launch Pools

### 1. **DeFi Whale Index** (Moderate Risk)
**Target Allocation**: 60% STX, 30% ALEX, 10% DIKO  
**Followed Whales**: Top 3 DeFi participants by composite score  
**Rebalancing**: Monthly or when drift >10%  
**Expected APY**: 15-25%  

### 2. **Meme Whale Portfolio** (High Risk)
**Target Allocation**: 50% STX, 50% WELSH  
**Followed Whales**: Top WELSH traders with 30d win rate >60%  
**Rebalancing**: Bi-weekly  
**Expected APY**: 30-50% (high volatility)  

### 3. **Conservative Stacker Pool** (Low Risk)
**Target Allocation**: 90% Stacked STX, 10% Liquid STX  
**Followed Whales**: Largest PoX participants  
**Rebalancing**: Quarterly  
**Expected APY**: 8-12% (PoX rewards)

---

## Smart Contract Specifications

### Contract 1: `whale-pool-vault.clar`

**Purpose**: Custody user deposits, mint/burn pool shares

```clarity
;; Key Functions:
(define-public (deposit (amount uint))
  ;; User deposits STX, receives pool shares
  ;; Share price = total-pool-value / total-shares
)

(define-public (withdraw (shares uint))
  ;; User burns shares, receives proportional STX value
  ;; Executes any necessary swaps to return STX
)

(define-read-only (get-pool-allocation)
  ;; Returns current holdings: {stx: uint, alex: uint, welsh: uint}
)

(define-public (set-target-allocation (targets {stx: uint, alex: uint}))
  ;; Governance sets target allocation
  ;; Only callable by FLOW governance contract
)

;; Fee Structure:
;; - 0.5% annual management fee (withdrawn quarterly)
;; - 10% performance fee on profits (calculated vs STX baseline)
```

### Contract 2: `pool-rebalancer.clar`

**Purpose**: Execute rebalancing trades with slippage protection

```clarity
;; Key Functions:
(define-public (rebalance-pool (pool-id uint) (swaps (list 10 {from: principal, to: principal, amount: uint})))
  ;; Executes multiple swaps to reach target allocation
  ;; Checks slippage vs Pyth oracle (max 2% variance)
  ;; Uses multi-DEX routing (ALEX primary, Velar fallback)
)

(define-public (emergency-pause (pool-id uint))
  ;; Pauses all deposits/withdrawals/rebalancing
  ;; Only callable by governance or pool creator
)

(define-read-only (estimate-rebalance-cost (pool-id uint))
  ;; Returns estimated gas + slippage cost
  ;; Users can see this before approving rebalance
)
```

---

## Backend Service: `pool-manager-service.ts`

**Purpose**: Calculate optimal allocations and propose rebalancing

```typescript
class PoolManager {
  // Runs daily cron job
  async analyzePoolDrift(poolId: string) {
    // 1. Fetch whale portfolios from MongoDB
    const whales = await getPoolWhales(poolId);
    const whalePortfolios = await fetchWhaleHoldings(whales);
    
    // 2. Calculate weighted average allocation
    const targetAllocation = calculateWeightedAverage(whalePortfolios);
    
    // 3. Get current pool holdings
    const currentAllocation = await getPoolHoldings(poolId);
    
    // 4. Calculate drift
    const drift = calculateDrift(currentAllocation, targetAllocation);
    
    // 5. If drift > 10%, propose rebalancing
    if (drift > 0.10) {
      const rebalanceTx = buildRebalancingTransaction(
        currentAllocation,
        targetAllocation,
        poolId
      );
      
      // Submit to governance vote (24h period)
      await submitGovernanceProposal(rebalanceTx);
    }
  }
  
  // Calculate gas costs + expected slippage
  async estimateRebalancingCost(poolId: string): Promise<{
    gasCostSTX: number;
    slippageCostSTX: number;
    totalCostPercent: number;
  }> {
    // Use DEX quotes + gas estimation
    // Factor in multi-step swaps
    // Return to frontend for user visibility
  }
}
```

---

## Frontend Components

### 1. **PoolDashboard** (`/pools`)
Shows all available strategy pools:
```tsx
<PoolCard
  name="DeFi Whale Index"
  tvl={125000} // Total Value Locked
  apy={18.5}   // Annualized return
  allocation={{ STX: 60, ALEX: 30, DIKO: 10 }}
  performance={+12.3} // 30d performance vs STX baseline
  followedWhales={3}
/>
```

### 2. **PoolDetails** (`/pools/:id`)
Deep dive into specific pool:
- Current vs target allocation (pie charts)
- Whale performance vs pool performance (comparison table)
- Historical rebalancing events
- Slippage/cost breakdown

### 3. **StakeInterface**
User deposits STX:
```tsx
<DepositFlow
  poolId="defi-whale-index"
  onDeposit={(amount) => {
    // Call whale-pool-vault.clar::deposit
    // Show estimated share price
    // Display fee breakdown
  }}
/>
```

---

## Risk Mitigation Strategies

### 1. **Liquidity Risk**
- **Problem**: ALEX DEX has ~$5M liquidity, large rebalances cause slippage
- **Solution**: 
  - Cap each pool at $25k TVL initially
  - Multi-DEX routing (ALEX + Velar)
  - TWAP execution over 24 hours for large trades

### 2. **Oracle Dependency**
- **Problem**: Need accurate prices for slippage protection
- **Solution**:
  - Primary: Pyth Network oracle (already integrated!)
  - Fallback: ALEX DEX TWAP
  - Final fallback: CoinGecko API (via price-proxy.js)
  - Use median of 3 sources

### 3. **Smart Contract Security**
- **Problem**: Custody of user funds requires audit
- **Solution**:
  - Professional audit ($5k-$15k budget)
  - Testnet-only until audit complete
  - Bug bounty program ($2k max)
  - Insurance fund (5% of management fees)

### 4. **Gas Economics**
- **Problem**: Rebalancing costs ~1.5 STX per pool per rebalance
- **Solution**:
  - Only rebalance when drift >10% (not scheduled)
  - Gas paid from pool assets (factored into APY)
  - Keeper earns 10% of gas as incentive

---

## Implementation Timeline

### **Week 1-2: Smart Contract Development**
- [ ] `whale-pool-vault.clar` - Deposits, withdrawals, shares
- [ ] `pool-rebalancer.clar` - DEX integration, slippage protection
- [ ] Unit tests (Clarinet)
- [ ] Property-based tests

### **Week 3: Backend Automation**
- [ ] `pool-manager-service.ts` - Daily cron job
- [ ] Whale portfolio aggregation logic
- [ ] Rebalancing proposal system
- [ ] Cost estimation API

### **Week 4: Frontend Integration**
- [ ] PoolDashboard component
- [ ] PoolDetails component
- [ ] Stake/Unstake interface
- [ ] Real-time pool stats

### **Week 5: Testnet Deployment**
- [ ] Deploy contracts to testnet
- [ ] Seed with mock data
- [ ] Internal testing (20 users)
- [ ] Begin audit process

### **Week 6: Beta Launch**
- [ ] Mainnet deployment (TVL cap: $10k per pool)
- [ ] Invite 50 beta users
- [ ] Monitor performance vs whale benchmarks
- [ ] Collect feedback

---

## Success Metrics

### Beta Phase (6 weeks):
- ✅ 50+ users deposit into pools
- ✅ $100k+ TVL across 3 pools
- ✅ 80%+ correlation between whale performance and pool performance
- ✅ <3% average slippage on rebalancing trades
- ✅ Zero critical security incidents

### Public Launch (3 months):
- 500+ active depositors
- $1M+ TVL
- 3+ new pools created by community
- Featured in Stacks ecosystem reports

---

## Revenue Model

### Fee Structure:
- **Management Fee**: 0.5% annual (withdrawn quarterly)
- **Performance Fee**: 10% of profits above STX baseline
- **100% fees paid in FLOW tokens** (creates buy pressure)

### Example:
- Pool TVL: $100k
- Annual management: $500 in FLOW
- If pool returns 20% while STX returns 5%:
  - Excess return: 15% = $15k
  - Performance fee: 10% × $15k = $1,500 in FLOW
- **Total annual revenue**: $2,000 per $100k pool

At $1M TVL across pools: **$20k annual revenue in FLOW**

---

## Competitive Advantage

### Why This Beats Traditional Copy Trading:

| Feature | Traditional Copy Trading | Whale Strategy Pools |
|---------|-------------------------|---------------------|
| **Execution** | Real-time (lag issues) | Strategic (no lag) |
| **Liquidity** | Requires deep liquidity | Works with modest liquidity |
| **Scalability** | Limited by DEX depth | Unlimited (cap per pool) |
| **Transparency** | Black box | Full portfolio visibility |
| **Regulatory** | Gray area | Index fund precedent |
| **Fees** | High (gas per trade) | Low (quarterly rebalancing) |

### Unique Differentiators:
1. **First whale-following index on Bitcoin L2**
2. **Real-time whale monitoring** (your moat!)
3. **Performance attribution** (show why pool differs from whale)
4. **Community governance** (FLOW holders curate whales)

---

## Next Steps

### Immediate Actions (This Week):
1. ✅ Review this design document
2. ⏳ Set up Clarity development environment
3. ⏳ Begin `whale-pool-vault.clar` implementation
4. ⏳ Update frontend messaging ("Copy Trading" → "Whale Strategy Pools")

### Questions to Resolve:
- [ ] Budget for smart contract audit?
- [ ] Which auditor to use? (Zellic, Trail of Bits, Least Authority)
- [ ] Initial TVL cap per pool? ($10k, $25k, $50k?)
- [ ] Fee split? (100% to treasury vs partial to FLOW stakers)

---

## References

- [WHALE_DISCOVERY_ARCHITECTURE.md](./WHALE_DISCOVERY_ARCHITECTURE.md) - Whale monitoring infrastructure
- [MILESTONE3_PROMPT.md](./MILESTONE3_PROMPT.md) - Beta launch requirements
- [FLOW_TOKENOMICS.md](./FLOW_TOKENOMICS.md) - Token utility and governance

---

**Document Status**: Ready for Review  
**Author**: Development Team + AI Analysis  
**Last Updated**: 2026-01-08
