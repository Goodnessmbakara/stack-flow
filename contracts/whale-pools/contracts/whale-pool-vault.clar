;; whale-pool-vault.clar
;; SECURITY-HARDENED Core Vault Contract for Whale Strategy Pools
;; Implements defense-in-depth security measures
;; Version: 1.0.0-beta

;; ===== CONSTANTS =====

;; Contract governance
(define-constant CONTRACT-OWNER tx-sender)
(define-constant DEPLOYER tx-sender)

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-POOL-NOT-FOUND (err u101))
(define-constant ERR-INVALID-AMOUNT (err u102))
(define-constant ERR-PAUSED (err u103))
(define-constant ERR-INSUFFICIENT-SHARES (err u104))
(define-constant ERR-INVALID-ALLOCATION (err u105))
(define-constant ERR-POOL-EXISTS (err u106))
(define-constant ERR-TIMELOCK-ACTIVE (err u107))
(define-constant ERR-EXCEEDS-LIMIT (err u108))
(define-constant ERR-RATE-LIMITED (err u109))
(define-constant ERR-INVARIANT-VIOLATION (err u110))
(define-constant ERR-CIRCUIT-BREAKER (err u111))

;; Security parameters
(define-constant MIN-INITIAL-DEPOSIT u100000000) ;; 100 STX minimum first deposit
(define-constant MAX-DEPOSIT-PER-TX u100000000000) ;; 100,000 STX max per transaction
(define-constant DEPOSIT-TIMELOCK-BLOCKS u1008) ;; ~7 days (10 min blocks)
(define-constant MAX-TVL-PER-POOL u1000000000000) ;; 1M STX cap (upgradeable)
(define-constant RATE-LIMIT-BLOCKS u10) ;; ~100 seconds between actions

;; Fee constants (in basis points, 10000 = 100%)
(define-constant ANNUAL-MGMT-FEE-BPS u50)  ;; 0.5% annual management fee
(define-constant DAILY-MGMT-FEE-BPS u1)    ;; ~0.0014% daily (50/365/10000)
(define-constant PERFORMANCE-FEE-BPS u1000) ;; 10% performance fee on profits
(define-constant MAX-FEE-PER-PERIOD-BPS u100) ;; Never more than 1% per 30 days

;; Circuit breaker thresholds
(define-constant MAX-PRICE-DROP-BPS u2000) ;; 20% max price drop per block
(define-constant MAX-DAILY-VOLUME-MULTIPLIER u3) ;; 3x TVL daily volume triggers pause

;; ===== DATA STRUCTURES =====

;; Pool metadata with security fields
(define-map pools
  { pool-id: uint }
  {
    name: (string-ascii 50),
    creator: principal,
    created-at-height: uint,
    paused: bool,
    total-shares: uint,
    total-value-locked: uint,
    last-fee-collection: uint,
    daily-volume: uint,
    last-volume-reset: uint,
    last-share-price: uint
  }
)

;; User share balances with timelock
(define-map user-shares
  { user: principal, pool-id: uint }
  { 
    shares: uint,
    deposited-at-height: uint
  }
)

;; Pool asset holdings
(define-map pool-holdings
  { pool-id: uint, asset: (string-ascii 10) }
  { amount: uint }
)

;; Target allocation for each pool
(define-map pool-target-allocations
  { pool-id: uint }
  {
    allocations: (list 10 {
      asset: (string-ascii 10),
      percentage: uint
    })
  }
)

;; Pending withdrawals (for pools with non-STX assets)
(define-map pending-withdrawals
  { user: principal, pool-id: uint }
  {
    shares: uint,
    status: (string-ascii 20),
    queued-at: uint
  }
)

;; Rate limiting per user per action
(define-map user-action-timestamps
  { user: principal, action: (string-ascii 20), pool-id: uint }
  { last-action: uint }
)

;; ===== DATA VARIABLES =====

(define-data-var pool-nonce uint u0)
(define-data-var emergency-paused bool false)
(define-data-var governance-address (optional principal) none)

;; Pool share token (SIP-010)
(define-fungible-token pool-shares)

;; ===== PRIVATE HELPER FUNCTIONS =====

;; Check if action is rate-limited
(define-private (check-rate-limit (action (string-ascii 20)) (pool-id uint))
  (let (
    (last-action-data (map-get? user-action-timestamps 
      {user: tx-sender, action: action, pool-id: pool-id }))
    (last-action-height (match last-action-data
      data (get last-action data)
      u0))
    (blocks-since (- burn-block-height last-action-height))
  )
    (asserts! (>= blocks-since RATE-LIMIT-BLOCKS) ERR-RATE-LIMITED)
    (map-set user-action-timestamps
      { user: tx-sender, action: action, pool-id: pool-id }
      { last-action: burn-block-height }
    )
    (ok true)
  )
)

;; Check if pool is paused (emergency or pool-specific)
(define-private (check-not-paused (pool-id uint))
  (let (
    (pool-info (unwrap! (map-get? pools { pool-id: pool-id }) ERR-POOL-NOT-FOUND))
  )
    (asserts! (not (var-get emergency-paused)) ERR-PAUSED)
    (asserts! (not (get paused pool-info)) ERR-PAUSED)
    (ok true)
  )
)

;; Check deposit timelock (7 days since deposit)
(define-private (check-timelock (user principal) (pool-id uint))
  (let (
    (user-data (map-get? user-shares { user: user, pool-id: pool-id }))
    (deposited-at (match user-data
      data (get deposited-at-height data)
      u0))
    (blocks-since (- burn-block-height deposited-at))
  )
    (asserts! (>= blocks-since DEPOSIT-TIMELOCK-BLOCKS) ERR-TIMELOCK-ACTIVE)
    (ok true)
  )
)

;; Validate input amounts
(define-private (validate-deposit-amount (amount uint) (pool-id uint) (is-first-deposit bool))
  (begin
    ;; Basic validation
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    
    ;; First deposit minimum
    (asserts! 
      (or (not is-first-deposit) (>= amount MIN-INITIAL-DEPOSIT))
      ERR-INVALID-AMOUNT
    )
    
    ;; Per-transaction maximum
    (asserts! (<= amount MAX-DEPOSIT-PER-TX) ERR-EXCEEDS-LIMIT)
    
    (ok true)
  )
)

;; Circuit breaker: Check for anomalies
(define-private (check-circuit-breaker (pool-id uint) (new-share-price uint))
  (let (
    (pool-info (unwrap! (map-get? pools { pool-id: pool-id }) ERR-POOL-NOT-FOUND))
    (last-price (get last-share-price pool-info))
    (daily-volume (get daily-volume pool-info))
    (tvl (get total-value-locked pool-info))
  )
    ;; Check for sharp price drop (>20%)
    (if (> last-price u0)
      (let (
        (price-drop (if (> last-price new-share-price)
                      (- last-price new-share-price)
                      u0))
        (drop-percentage (/ (* price-drop u10000) last-price))
      )
        (begin
          (asserts! (<= drop-percentage MAX-PRICE-DROP-BPS) ERR-CIRCUIT-BREAKER)
          ;; Check for excessive daily volume (>3x TVL)
          (asserts! 
            (<= daily-volume (* tvl MAX-DAILY-VOLUME-MULTIPLIER))
            ERR-CIRCUIT-BREAKER
          )
          (ok true)
        )
      )
      (begin
        ;; If no previous price, still check volume
        (asserts! 
          (<= daily-volume (* tvl MAX-DAILY-VOLUME-MULTIPLIER))
          ERR-CIRCUIT-BREAKER
        )
        (ok true)
      )
    )
  )
)

;; ===== READ-ONLY FUNCTIONS =====

(define-read-only (get-pool (pool-id uint))
  (map-get? pools { pool-id: pool-id })
)

(define-read-only (get-user-shares (user principal) (pool-id uint))
  (default-to u0
    (get shares (map-get? user-shares { user: user, pool-id: pool-id }))
  )
)

(define-read-only (get-pool-holding (pool-id uint) (asset (string-ascii 10)))
  (default-to u0
    (get amount (map-get? pool-holdings { pool-id: pool-id, asset: asset }))
  )
)

(define-read-only (get-share-price (pool-id uint))
  (let (
    (pool-info (unwrap! (get-pool pool-id) u0))
    (total-shares (get total-shares pool-info))
    (total-value (get total-value-locked pool-info))
  )
    ;; Handle first deposit edge case
    ;; Use 1:1 ratio initially
    (if (is-eq total-shares u0)
      u1000000 ;; 1 STX = 1 share (6 decimals)
      (/ (* total-value u1000000) total-shares)
    )
  )
)

(define-read-only (is-pool-paused (pool-id uint))
  (default-to true
    (get paused (map-get? pools { pool-id: pool-id }))
  )
)

(define-read-only (is-emergency-paused)
  (var-get emergency-paused)
)

(define-read-only (get-user-deposit-time (user principal) (pool-id uint))
  (default-to u0
    (get deposited-at-height (map-get? user-shares { user: user, pool-id: pool-id }))
  )
)

;; ===== PUBLIC FUNCTIONS =====

;; Create a new whale strategy pool
;; @param name: Pool name (max 50 chars)
;; @returns pool-id on success
(define-public (create-pool (name (string-ascii 50)))
  (let (
    (new-pool-id (+ (var-get pool-nonce) u1))
  )
    ;; Validate
    (asserts! (> (len name) u0) ERR-INVALID-AMOUNT)
    (try! (check-rate-limit "create-pool" u0))
    
    ;; Create pool with security defaults
    (map-set pools
      { pool-id: new-pool-id }
      {
        name: name,
        creator: tx-sender,
        created-at-height: burn-block-height,
        paused: false,
        total-shares: u0,
        total-value-locked: u0,
        last-fee-collection: burn-block-height,
        daily-volume: u0,
        last-volume-reset: burn-block-height,
        last-share-price: u1000000
      }
    )
    
    ;; Initialize STX holdings
    (map-set pool-holdings
      { pool-id: new-pool-id, asset: "STX" }
      { amount: u0 }
    )
    
    ;; Increment nonce
    (var-set pool-nonce new-pool-id)
    
    ;; Emit event
    (print {
      event: "pool-created",
      pool-id: new-pool-id,
      name: name,
      creator: tx-sender,
      block: burn-block-height
    })
    
    (ok new-pool-id)
  )
)

;; Deposit STX into pool and receive pool shares
;; @param pool-id: Target pool
;; @param amount: Amount of STX to deposit (in microSTX)
;; @returns tuple with shares minted and share price
(define-public (deposit (pool-id uint) (amount uint))
  (let (
    (pool-info (unwrap! (get-pool pool-id) ERR-POOL-NOT-FOUND))
    (is-first-deposit (is-eq (get total-shares pool-info) u0))
    (share-price (get-share-price pool-id))
    (shares-to-mint (/ (* amount u1000000) share-price))
    (current-user-shares (get-user-shares tx-sender pool-id))
    (new-tvl (+ (get total-value-locked pool-info) amount))
  )
    ;; Security checks
    (try! (check-not-paused pool-id))
    (try! (check-rate-limit "deposit" pool-id))
    (try! (validate-deposit-amount amount pool-id is-first-deposit))
    
    ;; TVL cap check
    (asserts! (<= new-tvl MAX-TVL-PER-POOL) ERR-EXCEEDS-LIMIT)
    
    ;; Circuit breaker
    (try! (check-circuit-breaker pool-id share-price))
    
    ;; Transfer STX from user to contract
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    
    ;; First deposit: Burn 1000 shares to prevent manipulation
    (try! (if is-first-deposit
      (begin
        (try! (ft-mint? pool-shares shares-to-mint tx-sender))
        (ft-burn? pool-shares u1000 tx-sender)
      )
      (ft-mint? pool-shares shares-to-mint tx-sender)
    ))
    
    ;; Update user shares with timelock
    (map-set user-shares
      { user: tx-sender, pool-id: pool-id }
      {
        shares: (+ current-user-shares (if is-first-deposit (- shares-to-mint u1000) shares-to-mint)),
        deposited-at-height: burn-block-height
      }
    )
    
    ;; Update pool state
    (map-set pools
      { pool-id: pool-id }
      (merge pool-info {
        total-shares: (+ (get total-shares pool-info) 
                        (if is-first-deposit (- shares-to-mint u1000) shares-to-mint)),
        total-value-locked: new-tvl,
        daily-volume: (+ (get daily-volume pool-info) amount),
        last-share-price: share-price
      })
    )
    
    ;; Update STX holdings
    (map-set pool-holdings
      { pool-id: pool-id, asset: "STX" }
      { amount: (+ (get-pool-holding pool-id "STX") amount) }
    )
    
    ;; Emit event
    (print {
      event: "deposit",
      pool-id: pool-id,
      user: tx-sender,
      amount: amount,
      shares: (if is-first-deposit (- shares-to-mint u1000) shares-to-mint),
      share-price: share-price,
      block: burn-block-height
    })
    
    (ok {
      shares: (if is-first-deposit (- shares-to-mint u1000) shares-to-mint),
      price: share-price
    })
  )
)

;; Emergency pause - Only contract owner
(define-public (emergency-pause)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set emergency-paused true)
    (print { 
      event: "emergency-pause", 
      admin: tx-sender, 
      block: burn-block-height 
    })
    (ok true)
  )
)

;; Emergency resume - Only contract owner
(define-public (emergency-resume)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set emergency-paused false)
    (print { 
      event: "emergency-resume", 
      admin: tx-sender, 
      block: burn-block-height 
    })
    (ok true)
  )
)

;; Pause specific pool - Only pool creator or governance
(define-public (pause-pool (pool-id uint))
  (let (
    (pool-info (unwrap! (get-pool pool-id) ERR-POOL-NOT-FOUND))
    (is-creator (is-eq tx-sender (get creator pool-info)))
    (is-governance (is-eq (some tx-sender) (var-get governance-address)))
  )
    (asserts! (or is-creator is-governance) ERR-NOT-AUTHORIZED)
    (map-set pools
      { pool-id: pool-id }
      (merge pool-info { paused: true })
    )
    (print { event: "pool-paused", pool-id: pool-id, by: tx-sender })
    (ok true)
  )
)

;; Resume specific pool - Only pool creator or governance
(define-public (resume-pool (pool-id uint))
  (let (
    (pool-info (unwrap! (get-pool pool-id) ERR-POOL-NOT-FOUND))
    (is-creator (is-eq tx-sender (get creator pool-info)))
    (is-governance (is-eq (some tx-sender) (var-get governance-address)))
  )
    (asserts! (or is-creator is-governance) ERR-NOT-AUTHORIZED)
    (map-set pools
      { pool-id: pool-id }
      (merge pool-info { paused: false })
    )
    (print { event: "pool-resumed", pool-id: pool-id, by: tx-sender })
    (ok true)
  )
)

;; Set governance address - Only contract owner, one-time only
(define-public (set-governance (new-governance principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (is-none (var-get governance-address)) ERR-NOT-AUTHORIZED)
    (var-set governance-address (some new-governance))
    (print { event: "governance-set", address: new-governance })
    (ok true)
  )
)
