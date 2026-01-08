# Whale Strategy Pools - 3-Week Implementation Plan

**Created**: 2026-01-08  
**Timeline**: 15 working days  
**Goal**: Production-ready smart contracts + automation service  
**Status**: Ready to Execute

---

## Executive Summary

This plan details day-by-day tasks for implementing Whale Strategy Pools over 3 weeks:
- **Week 1**: Smart contract foundation (whale-pool-vault.clar)
- **Week 2**: DEX integration & rebalancing (pool-rebalancer.clar)
- **Week 3**: Backend automation & testing (pool-manager-service)

**Prerequisites Already Complete**:
✅ Real-time whale monitoring (17 whales tracked)  
✅ Whale discovery & scoring system  
✅ MongoDB with performance analytics  
✅ Frontend whale tracking UI  
✅ Existing contracts: FLOW token, staking, governance

**What We're Building**: The missing 20% to complete the system

---

## Week 1: Smart Contract Foundation
**Goal**: Build whale-pool-vault.clar for deposits, shares, and withdrawals

### Day 1 (Monday): Project Setup & Architecture
**Morning Tasks** (4hrs):
- [ ] Create Clarinet project: `clarinet  new whale-pools`
- [ ] Set up directory structure:
  ```
  contracts/whale-pools/
  ├── whale-pool-vault.clar
  ├── pool-rebalancer.clar
  ├── traits/
  │   ├── pool-share-trait.clar (SIP-010)
  │   └── dex-adapter-trait.clar
  └── tests/
      ├── whale-pool-vault_test.ts
      └── pool-rebalancer_test.ts
  ```
- [ ] Review `stackflow-staking.clar` for existing patterns
- [ ] Create ARCHITECTURE.md design document

**Afternoon Tasks** (4hrs):
- [ ] Define core data structures:
  ```clarity
  (define-map pools
    { pool-id: uint }
    {
      name: (string-ascii 50),
      target-allocation: (list 10 { asset: principal, pct: uint }),
      total-shares: uint,
      total-value-stx: uint,
      created-at: uint,
      paused: bool
    }
  )
  
  (define-map user-shares
    { user: principal, pool-id: uint }
    { shares: uint }
  )
  
  (define-map pool-holdings
    { pool-id: uint, asset: principal }
    { amount: uint }
  )
  ```
- [ ] Create trait files (SIP-010 for pool shares)
- [ ] Write initial test scaffolding

**Deliverable**: Project skeleton with all files created, interfaces defined

---

### Day 2 (Tuesday): Deposit & Share Minting
**Morning Implementation** (4hrs):
```clarity
(define-public (deposit (pool-id uint) (amount uint))
  (let (
    (share-price (get-share-price pool-id))
    (shares-to-mint (/ (* amount u1000000) share-price))
  )
    ;; Validate inputs
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (not (get-pool-paused pool-id)) ERR-PAUSED)
    
    ;; Transfer STX from user to pool vault
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    
    ;; Mint pool shares to user
    (try! (ft-mint? pool-shares shares-to-mint tx-sender))
    
    ;; Update pool totals
    (map-set pools { pool-id: pool-id }
      (merge (unwrap! (map-get? pools { pool-id: pool-id }) ERR-POOL-NOT-FOUND)
        { total-shares: (+ current-shares shares-to-mint) }
      )
    )
    
    (ok { shares: shares-to-mint, price: share-price })
  )
)

(define-read-only (get-share-price (pool-id uint))
  (let (
    (total-shares (ft-get-supply pool-shares))
    (total-value (get-pool-total-value pool-id))
  )
    ;; Handle first deposit edge case
    (if (is-eq total-shares u0)
      u1000000 ;; 1 STX = 1 share initially
      (/ (* total-value u1000000) total-shares)
    )
  )
)
```

**Afternoon Testing** (4hrs):
- [ ] Test first deposit (bootstrap pool)
- [ ] Test multiple sequential deposits
- [ ] Test share price calculation accuracy
- [ ] Test edge cases (zero amount, paused pool)
- [ ] Verify integer division rounding doesn't compound

**Deliverable**: Working deposit function with comprehensive tests

---

### Day 3 (Wednesday): Asset Management & Fees
**Morning Implementation** (4hrs):
```clarity
(define-public (set-target-allocation
  (pool-id uint)
  (allocations (list 10 { asset: principal, percentage: uint }))
)
  ;; Authorization check
  (asserts! (is-pool-creator-or-governance tx-sender pool-id) ERR-NOT-AUTHORIZED)
  
  ;; Validate percentages sum to 100
  (asserts! 
    (is-eq 
      (fold + (map get percentage allocations) u0)
      u100
    )
    ERR-INVALID-ALLOCATION
  )
  
  ;; Store target allocation
  (map-set pool-targets { pool-id: pool-id } { allocations: allocations })
  (ok true)
)

;; Fee collection (0.5% annual = 0.042% monthly)
(define-constant ANNUAL-MGMT-FEE u50) ;; 0.5% in basis points
(define-constant PERFORMANCE-FEE u1000) ;; 10% in basis points

(define-public (collect-management-fees (pool-id uint))
  (let (
    (pool-value (get-pool-total-value pool-id))
    (days-since-last-collection (get-days-since-fee-collection pool-id))
    (daily-fee-bps (/ ANNUAL-MGMT-FEE u365))
    (fee-amount (/ (* (* pool-value daily-fee-bps) days-since-last-collection) u10000))
  )
    ;; Transfer fees to treasury
    (try! (as-contract (stx-transfer? fee-amount tx-sender TREASURY-ADDRESS)))
    
    ;; Update last collection timestamp
    (map-set fee-timestamps { pool-id: pool-id } { last-collected: block-height })
    (ok fee-amount)
  )
)
```

**Afternoon Tasks** (4hrs):
- [ ] Implement performance fee calculation
- [ ] Add fee withdrawal function
- [ ] Test fee accrual simulation (30-day period)
- [ ] Verify fees never exceed reasonable limits

**Deliverable**: Complete fee system with accurate calculations

---

### Day 4 (Thursday): Withdrawal Logic
**Morning Implementation** (4hrs):
```clarity
(define-public (withdraw (pool-id uint) (shares uint))
  (let (
    (share-price (get-share-price pool-id))
    (stx-value (/ (* shares share-price) u1000000))
    (user-shares (get-user-shares tx-sender pool-id))
  )
    ;; Validate
    (asserts! (<= shares user-shares) ERR-INSUFFICIENT-SHARES)
    (asserts! (> shares u0) ERR-INVALID-AMOUNT)
    
    ;; Burn user's shares
    (try! (ft-burn? pool-shares shares tx-sender))
    
    ;; Check if pool has non-STX assets
    (if (has-non-stx-assets pool-id)
      ;; Queue for rebalancing
      (begin
        (map-set pending-withdrawals
          { user: tx-sender, pool-id: pool-id }
          { shares: shares, status: "pending-rebalance", queued-at: block-height }
        )
        (ok "withdrawal-queued")
      )
      ;; All STX - immediate payout
      (begin
        (try! (as-contract (stx-transfer? stx-value tx-sender)))
        (ok "withdrawal-complete")
      )
    )
  )
)

;; Process pending withdrawals after rebalancing
(define-public (process-pending-withdrawal (user principal) (pool-id uint))
  (let (
    (withdrawal (unwrap! (map-get? pending-withdrawals { user: user, pool-id: pool-id }) ERR-NO-PENDING))
    (stx-value (calculate-withdrawal-value withdrawal))
  )
    ;; Transfer STX to user
    (try! (as-contract (stx-transfer? stx-value user)))
    
    ;; Remove from pending queue
    (map-delete pending-withdrawals { user: user, pool-id: pool-id })
    (ok stx-value)
  )
)
```

**Afternoon Tasks** (4hrs):
- [ ] Implement withdrawal queue management
- [ ] Test immediate withdrawal (100% STX pools)
- [ ] Test queued withdrawal (mixed asset pools)
- [ ] Test batch withdrawal processing
- [ ] Verify withdrawal limits don't cause bank run

**Deliverable**: Complete withdrawal system with queue management

---

### Day 5 (Friday): Security & Emergency Controls
**Morning Implementation** (4hrs):
```clarity
;; Emergency pause mechanism
(define-data-var emergency-paused bool false)

(define-public (emergency-pause (pool-id uint))
  (begin
    (asserts! (is-emergency-admin tx-sender) ERR-NOT-AUTHORIZED)
    (var-set emergency-paused true)
    (print {
      event: "emergency-pause",
      pool-id: pool-id,
      admin: tx-sender,
      block: block-height
    })
    (ok true)
  )
)

(define-public (emergency-resume (pool-id uint))
  (begin
    (asserts! (is-emergency-admin tx-sender) ERR-NOT-AUTHORIZED)
    (var-set emergency-paused false)
    (print { event: "emergency-resume", pool-id: pool-id })
    (ok true)
  )
)

;; All state-changing functions check pause status
(define-private (check-not-paused)
  (asserts! (not (var-get emergency-paused)) ERR-PAUSED)
)

;; Rate limiting to prevent attacks
(define-map user-action-timestamps
  { user: principal, action: (string-ascii 20) }
  { last-action: uint }
)

(define-private (check-rate-limit (action (string-ascii 20)))
  (let (
    (last-action (default-to u0 (get last-action 
      (map-get? user-action-timestamps { user: tx-sender, action: action }))))
    (blocks-since (- block-height last-action))
  )
    (asserts! (>= blocks-since u10) ERR-RATE-LIMITED) ;; ~100 seconds between actions
    (map-set user-action-timestamps
      { user: tx-sender, action: action }
      { last-action: block-height }
    )
    (ok true)
  )
)
```

**Afternoon Security Review** (4hrs):
- [ ] Run security checklist:
  - [ ] Integer overflow protection (Clarity built-in ✅)
  - [ ] Reentrancy protection (Clarity built-in ✅)
  - [ ] Access control on all admin functions
  - [ ] Fee calculations can't drain pool
  - [ ] Emergency pause works on all functions
  - [ ] Rate limiting prevents spam
- [ ] Code review with team
- [ ] Document known limitations
- [ ] Prepare for Week 2

**Weekend Task**: Internal review of whale-pool-vault.clar

**Deliverable**: whale-pool-vault.clar COMPLETE (~400 lines, >90% test coverage)

---

## Week 2: DEX Integration & Rebalancing
**Goal**: Build pool-rebalancer.clar with ALEX DEX integration

### Day 6 (Monday): ALEX DEX Adapter
**Morning Research & Design** (4hrs):
- [ ] Study ALEX DEX documentation
- [ ] Analyze existing ALEX contract interfaces:
  ```clarity
  ;; ALEX swap-helper interface
  (contract-call? .amm-swap-pool swap-helper
    token-x-trait
    token-y-trait
    amount-in
    min-amount-out
  )
  ```
- [ ] Create DEX adapter trait:
  ```clarity
  (define-trait dex-adapter-trait
    (
      (swap-exact-tokens (uint uint principal principal) (response uint uint))
      (get-quote (uint principal principal) (response uint uint))
    )
  )
  ```

**Afternoon Implementation** (4hrs):
```clarity
;; ALEX DEX adapter implementation
(define-public (swap-via-alex
  (amount-in uint)
  (min-out uint)
  (token-x principal)
  (token-y principal)
)
  (contract-call?
    'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.amm-swap-pool-v2-01 
    swap-helper
    token-x ;; Token in
    token-y ;; Token out
    u100000000 ;; Factor (10^8)
    amount-in
    min-out
  )
)

;; Velar DEX adapter (fallback)
(define-public (swap-via-velar
  (amount-in uint)
  (min-out uint)
  (token-x principal)
  (token-y principal)
)
  ;; Velar-specific contract call
  (contract-call?
    .velar-router
    swap
    token-x
    token-y
    amount-in
    min-out
  )
)

;; Router: try ALEX, fallback to Velar
(define-public (swap-with-fallback
  (amount uint)
  (min-out uint)
  (from-token principal)
  (to-token principal)
)
  (match (swap-via-alex amount min-out from-token to-token)
    success (ok success)
    error-alex (swap-via-velar amount min-out from-token to-token)
  )
)
```

**Tasks**:
- [ ] Implement both DEX adapters
- [ ] Test quote accuracy vs actual swaps
- [ ] Document slippage expectations (1-3%)

**Deliverable**: Multi-DEX routing system

---

### Day 7 (Tuesday): Pyth Oracle Integration
**Morning Implementation** (4hrs):
```clarity
;; Pyth Oracle integration for price validation
(define-read-only (get-token-price-from-pyth (token principal))
  (contract-call?
    'SP2T5JKWWP3FYYX4YRK8GK5BG2YCNGEAEY2P2PKN0.pyth-oracle-v1
    get-price
    token
  )
)

;; Validate slippage before executing swap
(define-private (validate-slippage
  (expected-price uint)
  (actual-price uint)
  (max-slippage-bps uint) ;; basis points (200 = 2%)
)
  (let (
    (price-diff (if (> actual-price expected-price)
                   (- actual-price expected-price)
                   (- expected-price actual-price)))
    (slippage-bps (/ (* price-diff u10000) expected-price))
  )
    (asserts! (<= slippage-bps max-slippage-bps) ERR-SLIPPAGE-TOO-HIGH)
    (ok true)
  )
)

;; 3-source price aggregation
(define-read-only (get-consensus-price (token principal))
  (let (
    (pyth-price (get-token-price-from-pyth token))
    (alex-twap (get-alex-twap token))
    (manual-override (get-manual-price token))
  )
    ;; Use median of 3 sources
    (ok (calculate-median (list pyth-price alex-twap manual-override)))
  )
)
```

**Afternoon Tasks** (4hrs):
- [ ] Implement ALEX TWAP calculation
- [ ] Add manual price override (emergency)
- [ ] Test oracle failure scenarios
- [ ] Add circuit breaker (pause if price deviation >10%)

**Deliverable**: Robust price validation system

---

### Day 8 (Wednesday): Core Rebalancing Implementation
**Morning Implementation** (4hrs):
```clarity
(define-public (rebalance-pool
  (pool-id uint)
  (swaps (list 10 {
    from-token: principal,
    to-token: principal,
    amount: uint,
    min-out: uint,
    dex: principal
  }))
)
  ;; Authorization
  (asserts! (is-rebalancer tx-sender) ERR-NOT-AUTHORIZED)
  (asserts! (not (var-get emergency-paused)) ERR-PAUSED)
  
  ;; Validate swaps match target allocation
  (try! (validate-rebalance-matches-target pool-id swaps))
  
  ;; Execute each swap sequentially
  (try! (fold execute-single-swap swaps (ok u0)))
  
  ;; Update pool holdings in state
  (update-pool-holdings-after-rebalance pool-id swaps)
  
  ;; Emit event
  (print {
    event: "pool-rebalanced",
    pool-id: pool-id,
    swaps: (len swaps),
    block: block-height
  })
  
  (ok true)
)

(define-private (execute-single-swap
  (swap {from-token: principal, to-token: principal, amount: uint, min-out: uint, dex: principal})
  (previous-result (response uint uint))
)
  ;; Verify slippage using oracle
  (let (
    (oracle-price (unwrap! (get-consensus-price (get from-token swap)) ERR-ORACLE-FAILURE))
    (expected-out (calculate-expected-output swap oracle-price))
  )
    (try! (validate-slippage expected-out (get min-out swap) u200)) ;; Max 2% slippage
    
    ;; Execute swap via selected DEX
    (if (is-eq (get dex swap) ALEX-DEX-ADDRESS)
      (swap-via-alex (get amount swap) (get min-out swap) (get from-token swap) (get to-token swap))
      (swap-via-velar (get amount swap) (get min-out swap) (get from-token swap) (get to-token swap))
    )
  )
)
```

**Afternoon Tasks** (4hrs):
- [ ] Implement multi-step rebalancing for large positions
- [ ] Add gas optimization (batch small swaps)
- [ ] Test with various pool sizes (small/medium/large)
- [ ] Verify state updates are atomic

**Deliverable**: Fully functional rebalancing engine

---

### Day 9 (Thursday): Integration Testing
**Full Day Testing** (8hrs):
```typescript
// Clarinet test suite
describe('Vault + Rebalancer Integration', () => {
  it('E2E: deposit → rebalance → withdraw', () => {
    // 1. User deposits 1000 STX into pool
    const depositTx = chain.mineBlock([
      Tx.contractCall('whale-pool-vault', 'deposit', [
        types.uint(1),
        types.uint(1000000000)
      ], user1.address)
    ]);
    depositTx.receipts[0].result.expectOk();
    
    // 2. Set target: 60% STX, 40% ALEX
    const targetTx = chain.mineBlock([
      Tx.contractCall('whale-pool-vault', 'set-target-allocation', [
        types.uint(1),
        types.list([
          types.tuple({ asset: 'STX', percentage: types.uint(60) }),
          types.tuple({ asset: 'ALEX', percentage: types.uint(40) })
        ])
      ], poolCreator.address)
    ]);
    
    // 3. Rebalance: swap 400 STX → ALEX
    const rebalanceTx = chain.mineBlock([
      Tx.contractCall('pool-rebalancer', 'rebalance-pool', [
        types.uint(1),
        types.list([{
          from: 'STX',
          to: 'ALEX',
          amount: types.uint(400000000),
          minOut: types.uint(2600000000), // ~$260 worth of ALEX
          dex: ALEX_DEX
        }])
      ], rebalancerBot.address)
    ]);
    rebalanceTx.receipts[0].result.expectOk();
    
    // 4. Verify pool allocation matches target
    const allocation = chain.callReadOnlyFn(
      'whale-pool-vault',
      'get-pool-allocation',
      [types.uint(1)],
      user1.address
    );
    expect(allocation.result).toHaveProperty('STX', '~60%');
    expect(allocation.result).toHaveProperty('ALEX', '~40%');
  });
  
  it('Handles DEX failure gracefully', () => {
    // Mock ALEX DEX failure
    // Verify fallback to Velar works
    // Confirm pool state is consistent
  });
  
  it('Rejects rebalance with excessive slippage', () => {
    // Try to execute swap with >2% slippage
    // Should fail with ERR-SLIPPAGE-TOO-HIGH
  });
  
  it('Emergency pause prevents rebalancing', () => {
    // Pause pool
    // Attempt rebalance
    // Should fail with ERR-PAUSED
  });
});
```

**Test Coverage**:
- [ ] First pool creation + deposit
- [ ] Multiple users deposit concurrently
- [ ] Rebalance to 3 different allocations
- [ ] Withdrawals during active rebalancing
- [ ] DEX failure scenarios
- [ ] Oracle failure scenarios
- [ ] Emergency pause mid-rebalance

**Deliverable**: Comprehensive test suite (>95% coverage)

---

### Day 10 (Friday): Documentation & Property Tests
**Morning - Property-Based Testing** (4hrs):
```typescript
import fc from 'fast-check';

describe('Pool Invariants (Property Tests)', () => {
  it('Share price only increases (unless pool loses money)', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer(100, 10000), 1, 100), // Deposit amounts
        (deposits) => {
          const initialPrice = getSharePrice();
          
          // Execute all deposits
          deposits.forEach(amount => deposit(amount));
          
          // If no rebalancing loss, price should be >= initial
          const finalPrice = getSharePrice();
          expect(finalPrice).toBeGreaterThanOrEqual(initialPrice);
        }
      ),
      { numRuns: 1000 }
    );
  });
  
  it('Total shares × share price = total pool value', () => {
    fc.assert(
      fc.property(
        fc.record({
          deposits: fc.array(fc.integer(100, 5000)),
          withdrawals: fc.array(fc.integer(10, 500))
        }),
        ({ deposits, withdrawals }) => {
          deposits.forEach(d => deposit(d));
          withdrawals.forEach(w => withdraw(w));
          
          const totalShares = getTotalShares();
          const sharePrice = getSharePrice();
          const poolValue = getPoolValue();
          
          expect(totalShares * sharePrice).toBeCloseTo(poolValue, 2);
        }
      )
    );
  });
  
  it('Fees never exceed 1% of pool value in any period', () => {
    fc.assert(
      fc.property(
        fc.integer(1, 365), // Days elapsed
        (days) => {
          simulateDaysElapsed(days);
          const collectedFees = collectFees();
          const poolValue = getPoolValue();
          
          expect(collectedFees / poolValue).toBeLessThan(0.01);
        }
      )
    );
  });
});
```

**Afternoon - Documentation** (4hrs):
- [ ] Inline documentation for all public functions
- [ ] Create deployment checklist
- [ ] Security self-audit using CertiK checklist
- [ ] Generate Clarinet coverage report
- [ ] Document known limitations

**Deliverable**: pool-rebalancer.clar COMPLETE with docs

---

## Week 3: Backend Automation Service
**Goal**: Build pool-manager-service for automated analysis & rebalancing

### Day 11 (Monday): Service Architecture Setup
**Morning - Project Setup** (4hrs):
```bash
# Create service directory
mkdir -p services/pool-manager
cd services/pool-manager

pnpm init
pnpm add @stacks/transactions @stacks/network mongodb node-cron dotenv

# Directory structure
services/pool-manager/
├── src/
│   ├── pool-analyzer.ts
│   ├── rebalance-calculator.ts
│   ├── governance-proposer.ts
│   ├── dex-simulator.ts
│   └── index.ts
├── config/
│   ├── pools.json
│   └── whale-mappings.json
├── tests/
│   └── integration.test.ts
└── package.json
```

**Afternoon - Core Implementation** (4hrs):
```typescript
// pool-analyzer.ts
import { MongoClient } from 'mongodb';

interface PoolConfig {
  poolId: string;
  name: string;
  followedWhales: string[];
  whaleWeights: { [address: string]: number };
  rebalanceThreshold: number;
}

class PoolAnalyzer {
  private mongoClient: MongoClient;
  
  async analyzePool(config: PoolConfig): Promise<AnalysisResult> {
    // 1. Fetch whale portfolios from MongoDB
    const whalePortfolios = await this.fetchWhalePortfolios(
      config.followedWhales
    );
    
    // 2. Calculate weighted target allocation
    const targetAllocation = this.calculateWeightedAverage(
      whalePortfolios,
      config.whaleWeights
    );
    
    // 3. Get current pool holdings from blockchain
    const currentAllocation = await this.getChainPoolHoldings(config.poolId);
    
    // 4. Calculate drift percentage
    const drift = this.calculateDrift(currentAllocation, targetAllocation);
    
    return {
      poolId: config.poolId,
      driftPercentage: drift,
      needsRebalance: drift > config.rebalanceThreshold,
      targetAllocation,
      currentAllocation,
      timestamp: new Date()
    };
  }
  
  private calculateWeightedAverage(
    portfolios: WhalePortfolio[],
    weights: { [address: string]: number }
  ): Allocation {
    const result: Allocation = {};
    
    for (const portfolio of portfolios) {
      const weight = weights[portfolio.address] || 0;
      
      for (const [asset, percentage] of Object.entries(portfolio.allocation)) {
        result[asset] = (result[asset] || 0) + (percentage * weight);
      }
    }
    
    return result;
  }
  
  private calculateDrift(current: Allocation, target: Allocation): number {
    let totalDrift = 0;
    
    for (const [asset, targetPct] of Object.entries(target)) {
      const currentPct = current[asset] || 0;
      totalDrift += Math.abs(targetPct - currentPct);
    }
    
    return totalDrift / 2; // Divide by 2 to avoid double-counting
  }
}
```

**Tasks**:
- [ ] Implement MongoDB whale data fetching
- [ ] Write drift calculation algorithm
- [ ] Test with real data (17 whales in your DB)
- [ ] Validate weighted average logic

**Deliverable**: Working pool analysis engine

---

### Day 12 (Tuesday): Rebalancing Transaction Builder
**Morning Implementation** (4hrs):
```typescript
// rebalance-calculator.ts
class RebalanceCalculator {
  calculateOptimalSwaps(
    current: Allocation,
    target: Allocation,
    poolTVL: number
  ): SwapInstruction[] {
    const swaps: SwapInstruction[] = [];
    
    // Calculate delta for each asset
    for (const [asset, targetPct] of Object.entries(target)) {
      const currentPct = current[asset] || 0;
      const delta = targetPct - currentPct;
      
      if (Math.abs(delta) < 0.01) continue; // Ignore <1% differences
      
      if (delta > 0) {
        // Need to BUY this asset
        swaps.push({
          from: 'STX',
          to: asset,
          amountUSD: poolTVL * delta,
          type: 'buy'
        });
      } else {
        // Need to SELL this asset
        swaps.push({
          from: asset,
          to: 'STX',
          amountUSD: poolTVL * Math.abs(delta),
          type: 'sell'
        });
      }
    }
    
    // Optimize swap order (minimize cumulative slippage)
    return this.optimizeSwapOrder(swaps);
  }
  
  private optimizeSwapOrder(swaps: SwapInstruction[]): SwapInstruction[] {
    // Execute largest swaps first (they have most liquidity)
    return swaps.sort((a, b) => b.amountUSD - a.amountUSD);
  }
  
  async estimateSlippage(asset: string, amountUSD: number): Promise<number> {
    // Query ALEX DEX for quote
    const alexQuote = await this.getALEXQuote(asset, amountUSD);
    
    // Get oracle price
    const oraclePrice = await this.getPythPrice(asset);
    
    // Calculate slippage
    const expectedOut = amountUSD / oraclePrice;
    const actualOut = alexQuote.amountOut;
    
    return Math.abs(actualOut - expectedOut) / expectedOut;
  }
}
```

**Afternoon Tasks** (4hrs):
- [ ] Implement DEX quote fetching (ALEX API)
- [ ] Create Clarity transaction builder
- [ ] Test swap optimization
- [ ] Validate gas estimates

**Deliverable**: Complete rebalancing calculation engine

---

### Day 13 (Wednesday): Governance Integration
**Morning Implementation** (4hrs):
```typescript
// governance-proposer.ts
import { makeContractCall, principalCV, uintCV, listCV, tupleCV } from '@stacks/transactions';

class GovernanceProposer {
  async createRebalanceProposal(
    poolId: string,
    swaps: SwapInstruction[],
    analysis: AnalysisResult
  ): Promise<ProposalTx> {
    // Build contract call for rebalancing
    const contractCall = await makeContractCall({
      contractAddress: process.env.CONTRACT_ADDRESS!,
      contractName: 'pool-rebalancer',
      functionName: 'rebalance-pool',
      functionArgs: [
        uintCV(poolId),
        listCV(swaps.map(s => tupleCV({
          'from-token': principalCV(s.fromToken),
          'to-token': principalCV(s.toToken),
          'amount': uintCV(s.amount),
          'min-out': uintCV(s.minOut),
          'dex': principalCV(ALEX_DEX_ADDRESS)
        })))
      ],
      network: this.network,
      anchorMode: 1,
      postConditionMode: 1,
      senderKey: process.env.REBALANCER_PRIVATE_KEY!
    });
    
    // Create governance proposal
    const proposal = {
      title: `Rebalance ${poolId}: ${analysis.driftPercentage.toFixed(2)}% drift`,
      description: this.generateDescription(analysis, swaps),
      transaction: contractCall,
      votingPeriod: 24 * 60, // 24 hours (in 10-min blocks)
      quorum: 51 // 51% of FLOW stakers
    };
    
    // Store in MongoDB
    await this.saveProposal(proposal);
    
    // Broadcast via WebSocket to frontend
    this.broadcastNewProposal(proposal);
    
    return proposal;
  }
  
  generateDescription(analysis: AnalysisResult, swaps: SwapInstruction[]): string {
    return `
## Pool Rebalancing Proposal

**Drift Detected**: ${analysis.driftPercentage.toFixed(2)}%  
**Threshold**: 10%  
**Action**: Rebalance to match whale allocations

### Current vs Target

| Asset | Current | Target | Delta |
|-------|---------|--------|-------|
${Object.keys(analysis.targetAllocation).map(asset => {
  const current = (analysis.currentAllocation[asset] || 0) * 100;
  const target = analysis.targetAllocation[asset] * 100;
  return `| ${asset} | ${current.toFixed(1)}% | ${target.toFixed(1)}% | ${(target - current).toFixed(1)}% |`;
}).join('\n')}

### Proposed Swaps

${swaps.map(s => `- **${s.type.toUpperCase()}** ${s.amountUSD.toLocaleString()} USD of ${s.from} → ${s.to}`).join('\n')}

### Cost Estimate
- Gas: ~1.5 STX
- Slippage: ~${swaps.reduce((sum, s) => sum + s.estimatedSlippage, 0).toFixed(2)}%
- Total Cost: ${((swaps.reduce((sum, s) => sum + s.slippageCost, 0) + 1.5) / analysis.poolTVL * 100).toFixed(3)}% of pool

Vote YES to execute rebalancing.
`;
  }
}
```

**Afternoon Tasks** (4hrs):
- [ ] Integrate with stackflow-governance.clar
- [ ] Test proposal creation flow
- [ ] Implement auto-execution after vote
- [ ] Add failure handling

**Deliverable**: Governance proposal system

---

### Day 14 (Thursday): Automation & Monitoring
**Morning - Cron Setup** (4hrs):
```typescript
// index.ts
import cron from 'node-cron';

class PoolManagerService {
  private analyzer: PoolAnalyzer;
  private calculator: RebalanceCalculator;
  private proposer: GovernanceProposer;
  
  start() {
    console.log('[PoolManager] 🚀 Starting service...');
    
    // Analyze pools every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      console.log('[PoolManager] Running scheduled pool analysis...');
      await this.analyzeAllPools();
    });
    
    // Check proposal status every hour
    cron.schedule('0 * * * *', async () => {
      console.log('[PoolManager] Checking active proposals...');
      await this.processActiveProposals();
    });
    
    // Daily health check at midnight
    cron.schedule('0 0 * * *', async () => {
      console.log('[PoolManager] Running daily health check...');
      await this.runHealthChecks();
    });
    
    // Start API server
    this.startAPIServer(5182);
  }
  
  async analyzeAllPools() {
    const pools = await this.loadPoolConfigs();
    
    for (const pool of pools) {
      try {
        const analysis = await this.analyzer.analyzePool(pool);
        
        if (analysis.needsRebalance) {
          const swaps = await this.calculator.calculateOptimalSwaps(
            analysis.currentAllocation,
            analysis.targetAllocation,
            analysis.poolTVL
          );
          
          await this.proposer.createRebalanceProposal(pool.id, swaps, analysis);
          
          console.log(`[PoolManager] ✅ Created rebalancing proposal for pool ${pool.id}`);
        } else {
          console.log(`[PoolManager] ✓ Pool ${pool.id} within threshold (${analysis.driftPercentage.toFixed(2)}%)`);
        }
      } catch (error) {
        console.error(`[PoolManager] ❌ Error analyzing pool ${pool.id}:`, error);
      }
    }
  }
  
  async processActiveProposals() {
    const proposals = await this.getActiveProposals();
    
    for (const proposal of proposals) {
      if (proposal.votingEnded && proposal.passed && !proposal.executed) {
        await this.executeRebalance(proposal);
      }
    }
  }
  
  async runHealthChecks() {
    // Check MongoDB connection
    // Check Stacks API availability
    // Check DEX liquidity
    // Send alerts if issues detected
  }
}

// Start the service
new PoolManagerService().start();
```

**Afternoon - Monitoring** (4hrs):
- [ ] Add Prometheus metrics
- [ ] Implement Slack/Discord alerts
- [ ] Create health dashboard
- [ ] Test full automation loop

**Deliverable**: Fully automated service with monitoring

---

### Day 15 (Friday): E2E Testing & Documentation
**Morning - Integration Tests** (4hrs):
```typescript
describe('Pool Manager E2E', () => {
  it('Complete flow: analyze → propose → vote → execute', async () => {
    // Seed whale data
    await seedWhaleData([
      { address: WHALE_1, allocation: { STX: 50, ALEX: 40, DIKO: 10 } },
      { address: WHALE_2, allocation: { STX: 60, ALEX: 30, DIKO: 10 } },
      { address: WHALE_3, allocation: { STX: 55, ALEX: 35, DIKO: 10 } }
    ]);
    
    // 1. Service analyzes pool
    const analysis = await service.analyzePool(POOL_CONFIG);
    expect(analysis.needsRebalance).toBe(true);
    
    // 2. Proposal created
    const proposals = await getProposals();
    expect(proposals.length).toBe(1);
    
    // 3. Simulate voting
    await voteOnProposal(proposals[0].id, 'yes', FLOW_STAKERS);
    await advanceTime(24, 'hours');
    
    // 4. Proposal executes
    await service.processActiveProposals();
    
    // 5. Verify pool rebalanced
    const newAllocation = await getPoolAllocation(POOL_ID);
    expect(newAllocation.ALEX).toBeCloseTo(0.35, 0.02); // Within 2%
  });
});
```

**Afternoon - Documentation** (4hrs):
- [ ] API documentation
- [ ] Configuration guide
- [ ] Deployment instructions
- [ ] Monitoring playbook

**Deliverable**: Complete E2E tests + docs

---

## Post-Week 3: Next Steps

### Week 4: Testnet Deployment
- Deploy contracts to testnet
- Seed with 3 test pools
- Invite 20 internal testers
- Monitor for bugs

### Week 5: Security Audit
- Engage professional auditor ($5k-$15k)
- Fix critical/major issues
- Retest after fixes

### Week 6: Beta Launch
- Deploy to mainnet
- $25k TVL cap per pool
- 50+ beta users
- Collect feedback

---

## Success Criteria

### Week 1 Success:
- [ ] whale-pool-vault.clar passes all tests
- [ ] Users can deposit/withdraw
- [ ] Share price accurate
- [ ] Fees calculate correctly
- [ ] Emergency pause works

### Week 2 Success:
- [ ] pool-rebalancer.clar integrates with ALEX
- [ ] Pyth oracle validates prices
- [ ] Slippage protection works (<2%)
- [ ] Test coverage >95%

### Week 3 Success:
- [ ] pool-manager analyzes whale portfolios
- [ ] Drift calculation accurate
- [ ] Governance proposals automatic
- [ ] Cron jobs reliable
- [ ] E2E tests pass

---

## Risk Mitigation

**High Risks**:
1. **DEX Liquidity** → $25k pool cap initially
2. **Smart Contract Audit** → Testnet-only until complete
3. **Oracle Failure** → 3-source price aggregation

**Medium Risks**:
1. **Governance Attack** → 24hr voting, 51% quorum
2. **Whale Data Quality** → Validate MongoDB data
3. **Gas Costs** → Only rebalance when drift >10%

**Go/No-Go Points**:
- Day 5: If vault fails, delay 1 week
- Day 10: If DEX fails, pivot to manual
- Day 15: If tests fail, extend 1 week

---

## Alternative: MVP Simplification

If timeline is too aggressive:

**Week 1 MVP**: STX-only pools (skip multi-asset)  
**Week 2 MVP**: Manual rebalancing (skip automation)  
**Week 3 MVP**: Semi-automated proposals  

**MVP Timeline**: 9 days instead of 15

**Trade-offs**: Faster launch, manual overhead, less competitive

---

## Final Checklist

**Pre-Implementation**:
- [ ] Review stackflow contracts
- [ ] Set up Clarinet
- [ ] Access ALEX DEX docs
- [ ] Confirm Pyth availability
- [ ] Review MongoDB whale data

**Development Resources**:
- Clarity developer (lead)
- TypeScript developer (backend)
- DevOps engineer (deployment)
- QA tester (testing)

**Budget**:
- Smart contract audit: $5k-$15k
- Infrastructure: $500/month
- Bug bounty: $2k fund

---

**Total Time to Beta**: 5-6 weeks from today  
**Confidence**: 85%  
**Status**: Ready to execute

---

*Document created via deep sequential thinking analysis*  
*Based on: WHALE_STRATEGY_POOLS_DESIGN.md + market research*
