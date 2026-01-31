;; whale-pool-vault.clar - COMPLETE Week 1 Implementation
;; Security-hardened vault with withdrawal, fees, and allocation management

;; [Previous content remains - constants, data structures, helpers, deposit, pause functions...]

;; ===== WEEK 1 DAYS 2-5: ADDITIONAL FUNCTIONS =====

;; Set target allocation for pool - Only creator or governance
(define-public (set-target-allocation 
  (pool-id uint)
  (allocations (list 10 {
    asset: (string-ascii 10),
    percentage: uint
  }))
)
  (let (
    (pool-info (unwrap! (get-pool pool-id) ERR-POOL-NOT-FOUND))
    (is-creator (is-eq tx-sender (get creator pool-info)))
    (is-governance (is-eq (some tx-sender) (var-get governance-address)))
    (total-pct (fold + (map get-pct allocations) u0))
  )
    (asserts! (or is-creator is-governance) ERR-NOT-AUTHORIZED)
    (asserts! (is-eq total-pct u100) ERR-INVALID-ALLOCATION)
    
    (map-set pool-target-allocations
      { pool-id: pool-id }
      { allocations: allocations }
    )
    
    (print { event: "allocation-set", pool-id: pool-id })
    (ok true)
  )
)

(define-private (get-pct (item { asset: (string-ascii 10), percentage: uint }))
  (get percentage item)
)

;; Withdraw shares - Immediate or queued based on pool composition
(define-public (withdraw (pool-id uint) (shares uint))
  (let (
    (pool-info (unwrap! (get-pool pool-id) ERR-POOL-NOT-FOUND))
    (user-data (unwrap! (map-get? user-shares { user: tx-sender, pool-id: pool-id }) ERR-INSUFFICIENT-SHARES))
    (user-total-shares (get shares user-data))
    (share-price (get-share-price pool-id))
    (stx-value (/ (* shares share-price) u1000000))
    (stx-holdings (get-pool-holding pool-id "STX"))
  )
    (asserts! (> shares u0) ERR-INVALID-AMOUNT)
    (asserts! (<= shares user-total-shares) ERR-INSUFFICIENT-SHARES)
    (try! (check-not-paused pool-id))
    (try! (check-timelock tx-sender pool-id))
    
    (try! (ft-burn? pool-shares shares tx-sender))
    
    (if (>= stx-holdings stx-value)
      (begin
        (try! (as-contract (stx-transfer? stx-value tx-sender)))
        
        (map-set user-shares
          { user: tx-sender, pool-id: pool-id }
          { shares: (- user-total-shares shares), deposited-at-height: burn-block-height }
        )
        
        (map-set pools
          { pool-id: pool-id }
          (merge pool-info {
            total-shares: (- (get total-shares pool-info) shares),
            total-value-locked: (- (get total-value-locked pool-info) stx-value)
          })
        )
        
        (map-set pool-holdings
          { pool-id: pool-id, asset: "STX" }
          { amount: (- stx-holdings stx-value) }
        )
        
        (print { event: "withdrawal-complete", user: tx-sender, value: stx-value })
        (ok { status: "complete", value: stx-value })
      )
      (begin
        (map-set pending-withdrawals
          { user: tx-sender, pool-id: pool-id }
          { shares: shares, status: "pending-rebalance", queued-at: burn-block-height }
        )
        
        (print { event: "withdrawal-queued", user: tx-sender, shares: shares })
        (ok { status: "queued", value: u0 })
      )
    )
  )
)

;; Collect management fees
(define-public (collect-management-fees (pool-id uint))
  (let (
    (pool-info (unwrap! (get-pool pool-id) ERR-POOL-NOT-FOUND))
    (is-creator (is-eq tx-sender (get creator pool-info)))
    (is-governance (is-eq (some tx-sender) (var-get governance-address)))
    (pool-value (get total-value-locked pool-info))
    (last-collection (get last-fee-collection pool-info))
    (blocks-since (- burn-block-height last-collection))
    (days-elapsed (/ blocks-since u144))
    (fee-amount (/ (* (* pool-value days-elapsed) DAILY-MGMT-FEE-BPS) u10000))
    (treasury (match (var-get governance-address) addr addr CONTRACT-OWNER))
  )
    (asserts! (or is-creator is-governance) ERR-NOT-AUTHORIZED)
    (asserts! (<= fee-amount (/ pool-value u100)) ERR-EXCEEDS-LIMIT)
    
    (try! (as-contract (stx-transfer? fee-amount treasury)))
    
    (map-set pools
      { pool-id: pool-id }
      (merge pool-info { last-fee-collection: burn-block-height })
    )
    
    (print { event: "fees-collected", amount: fee-amount, treasury: treasury })
    (ok fee-amount)
  )
)

;; Process queued withdrawal
(define-public (process-queued-withdrawal (user principal) (pool-id uint))
  (let (
    (withdrawal-data (unwrap! (map-get? pending-withdrawals { user: user, pool-id: pool-id }) ERR-POOL-NOT-FOUND))
    (shares (get shares withdrawal-data))
    (share-price (get-share-price pool-id))
    (stx-value (/ (* shares share-price) u1000000))
    (is-governance (is-eq (some tx-sender) (var-get governance-address)))
  )
    (asserts! is-governance ERR-NOT-AUTHORIZED)
    
    (try! (as-contract (stx-transfer? stx-value user)))
    (map-delete pending-withdrawals { user: user, pool-id: pool-id })
    
    (print { event: "queued-withdrawal-processed", user: user, value: stx-value })
    (ok stx-value)
  )
)

;; Read-only: Get target allocation
(define-read-only (get-target-allocation (pool-id uint))
  (map-get? pool-target-allocations { pool-id: pool-id })
)

;; Read-only: Get pending withdrawal
(define-read-only (get-pending-withdrawal (user principal) (pool-id uint))
  (map-get? pending-withdrawals { user: user, pool-id: pool-id })
)
