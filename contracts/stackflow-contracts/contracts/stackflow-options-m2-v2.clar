;; StackFlow Options M2 - Milestone 2 Implementation
;; Bitcoin-secured options trading on Stacks
;; M2: CALL, Bull Put Spread (BPSP), STRAP, and Bull Call Spread (BCSP) strategies
;; With Oracle integration and sBTC collateral support

;; Contract owner
(define-data-var contract-owner principal tx-sender)
(define-constant ustx-per-stx u1000000)

;; M1 Error Constants
(define-constant err-not-authorized (err u100))
(define-constant err-protocol-paused (err u101))
(define-constant err-invalid-amount (err u102))
(define-constant err-invalid-premium (err u103))
(define-constant err-invalid-expiry (err u104))
(define-constant err-option-not-found (err u105))
(define-constant err-not-owner (err u106))
(define-constant err-already-exercised (err u107))
(define-constant err-option-expired (err u108))
(define-constant err-not-in-the-money (err u109))
(define-constant err-not-expired (err u110))
(define-constant err-already-settled (err u111))
(define-constant err-invalid-strikes (err u112))

;; M2 New Error Constants
(define-constant err-oracle-failure (err u113))
(define-constant err-stale-price (err u114))
(define-constant err-insufficient-sbtc (err u115))
(define-constant err-below-margin (err u116))
(define-constant err-strap-component-fail (err u117))
(define-constant err-invalid-collateral-type (err u118))
(define-constant err-component-not-found (err u119))
(define-constant err-invalid-strategy (err u120))

;; Enhanced Data Structures
(define-map options uint {
  owner: principal,
  strategy: (string-ascii 5),    ;; "CALL", "BPSP", "STRAP", "BCSP", "PUT"
  amount-ustx: uint,
  strike-price: uint,
  upper-strike: uint,
  premium-paid: uint,
  collateral-type: (string-ascii 4),  ;; "STX" or "sBTC"
  collateral-amount: uint,
  created-at: uint,
  expiry-block: uint,
  oracle-price-at-creation: uint,
  is-exercised: bool,
  is-settled: bool,
  settlement-price: uint
})

;; STRAP Strategy Components (2 CALL + 1 PUT)
(define-map strap-components uint {
  call-option-1: uint,
  call-option-2: uint,
  put-option: uint,
  combined-premium: uint,
  max-profit-potential: uint
})

;; Bull Call Spread Components (Long CALL + Short CALL)
(define-map bull-call-spreads uint {
  long-call: uint,
  short-call: uint,
  net-premium: uint,
  max-profit: uint,
  max-loss: uint
})

;; sBTC Collateral Tracking
(define-map sbtc-collateral principal {
  total-deposited: uint,
  available-balance: uint,
  locked-in-positions: uint,
  last-valuation-price: uint,
  margin-call-threshold: uint
})

;; Existing M1 Maps
(define-map user-options principal (list 500 uint))
(define-data-var option-nonce uint u0)
(define-data-var protocol-fee-bps uint u10)
(define-data-var protocol-wallet principal tx-sender)
(define-data-var paused bool false)
(define-data-var min-option-period uint u1008)  ;; 7 days
(define-data-var max-option-period uint u12960) ;; 90 days

;; M2 New Configuration
;; M2 New Configuration
(use-trait price-oracle-trait .price-oracle-trait-v2.price-oracle-trait)
(define-data-var oracle-contract (optional principal) none)
(define-data-var sbtc-contract (optional principal) none)
(define-data-var margin-requirement-pct uint u150)  ;; 150% of position value

;; Constants for sBTC integration
(define-constant sbtc-mainnet-contract 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token)

;; Helper Functions
(define-private (fee (p uint)) (/ (* p (var-get protocol-fee-bps)) u10000))
(define-private (valid-expiry (e uint)) 
  (and (> e stacks-block-height) 
       (>= (- e stacks-block-height) (var-get min-option-period)) 
       (<= (- e stacks-block-height) (var-get max-option-period))))
(define-private (add-user-option (u principal) (id uint)) 
  (map-set user-options u (unwrap-panic (as-max-len? (append (default-to (list) (map-get? user-options u)) id) u500))))

;; Input Validation Functions
(define-private (valid-price (price uint)) (and (> price u0) (<= price u100000000)))
(define-private (valid-wallet (wallet principal)) (not (is-eq wallet (as-contract tx-sender))))
(define-private (valid-collateral-type (ctype (string-ascii 4))) 
  (or (is-eq ctype "STX") (is-eq ctype "sBTC")))

;; Helper function to get current oracle price - UPDATED to take trait
(define-private (get-current-oracle-price (oracle <price-oracle-trait>))
  (contract-call? oracle get-price "STX"))

;; M1 Payout Calculators (unchanged)
(define-private (call-payout (strike uint) (amount uint) (premium uint) (current-price uint))
  (if (> current-price strike)
    (let ((diff (- current-price strike))
          (gains (/ (* diff amount) ustx-per-stx)))
      (if (> gains premium) (- gains premium) u0))
    u0))

(define-private (bpsp-payout (lower-strike uint) (upper-strike uint) (amount uint) (premium uint) (current-price uint))
  (if (>= current-price upper-strike)
    u0
    (if (< current-price lower-strike)
      (let ((max-loss (- upper-strike lower-strike)))
        (if (> max-loss premium) u0 (- premium max-loss)))
      (let ((loss-amount (/ (* (- upper-strike current-price) amount) ustx-per-stx)))
        (if (> loss-amount premium) u0 (- premium loss-amount))))))

;; M2 New Payout Calculators

;; PUT option payout (for STRAP strategy)
(define-private (put-payout (strike uint) (amount uint) (premium uint) (current-price uint))
  (if (< current-price strike)
    (let ((diff (- strike current-price))
          (gains (/ (* diff amount) ustx-per-stx)))
      (if (> gains premium) (- gains premium) u0))
    u0))

;; STRAP payout (2 calls + 1 put at same strike)
(define-private (strap-payout (strike uint) (amount uint) (premium uint) (current-price uint))
  (if (> current-price strike)
    ;; Price above strike: both calls pay out
    (let ((single-call-payout (call-payout strike amount u0 current-price))
          (total-call-payout (* single-call-payout u2)))
      (if (> total-call-payout premium) (- total-call-payout premium) u0))
    ;; Price below strike: put pays out
    (put-payout strike amount premium current-price)))

;; Bull Call Spread payout (capped profit between strikes)
(define-private (bcsp-payout (lower-strike uint) (upper-strike uint) (amount uint) (net-premium uint) (current-price uint))
  (if (<= current-price lower-strike)
    ;; Below lower strike: no payout (max loss = net premium)
    u0
    (if (>= current-price upper-strike)
      ;; Above upper strike: max profit
      (let ((max-profit-raw (- upper-strike lower-strike)))
        (if (> max-profit-raw net-premium) (- max-profit-raw net-premium) u0))
      ;; Between strikes: proportional payout
      (let ((profit-raw (- current-price lower-strike)))
        (if (> profit-raw net-premium) (- profit-raw net-premium) u0)))))

;; M1 Strategy Functions (maintained for backward compatibility)

;; Create CALL Option (enhanced with oracle and collateral options)
(define-public (create-call-option (amount uint) (strike uint) (premium uint) (expiry uint) (oracle <price-oracle-trait>))
  (create-call-option-with-collateral amount strike premium expiry "STX" oracle))

(define-public (create-call-option-with-collateral 
    (amount uint) 
    (strike uint) 
    (premium uint) 
    (expiry uint)
    (collateral-type (string-ascii 4))
    (oracle <price-oracle-trait>))
  (begin
    (asserts! (not (var-get paused)) err-protocol-paused)
    (asserts! (> amount u0) err-invalid-amount)
    (asserts! (> premium u0) err-invalid-premium)
    (asserts! (> strike u0) err-invalid-amount)
    (asserts! (valid-expiry expiry) err-invalid-expiry)
    (asserts! (valid-collateral-type collateral-type) err-invalid-collateral-type)
    
    (let ((id (+ (var-get option-nonce) u1))
          (fee-amount (fee premium))
          (total (+ premium fee-amount))
          (oracle-price (get price (unwrap! (get-current-oracle-price oracle) err-oracle-failure))))
      
      ;; Handle collateral based on type
      (if (is-eq collateral-type "STX")
        (begin
          (try! (stx-transfer? total tx-sender (as-contract tx-sender)))
          (try! (as-contract (stx-transfer? fee-amount tx-sender (var-get protocol-wallet)))))
        (try! (deposit-sbtc-for-option tx-sender total)))
      
      (map-set options id {
        owner: tx-sender,
        strategy: "CALL",
        amount-ustx: amount,
        strike-price: strike,
        upper-strike: strike,
        premium-paid: premium,
        collateral-type: collateral-type,
        collateral-amount: total,
        created-at: stacks-block-height,
        expiry-block: expiry,
        oracle-price-at-creation: oracle-price,
        is-exercised: false,
        is-settled: false,
        settlement-price: u0
      })
      (add-user-option tx-sender id)
      (var-set option-nonce id)
      (ok id))))

;; Create Bull Put Spread (enhanced)
(define-public (create-bull-put-spread (amount uint) (lower-strike uint) (upper-strike uint) (collateral uint) (expiry uint) (oracle <price-oracle-trait>))
  (create-bull-put-spread-with-collateral amount lower-strike upper-strike collateral expiry "STX" oracle))

(define-public (create-bull-put-spread-with-collateral
    (amount uint) 
    (lower-strike uint) 
    (upper-strike uint) 
    (collateral uint) 
    (expiry uint)
    (collateral-type (string-ascii 4))
    (oracle <price-oracle-trait>))
  (begin
    (asserts! (not (var-get paused)) err-protocol-paused)
    (asserts! (> amount u0) err-invalid-amount)
    (asserts! (> lower-strike u0) err-invalid-amount)
    (asserts! (> upper-strike lower-strike) err-invalid-strikes)
    (asserts! (> collateral u0) err-invalid-amount)
    (asserts! (valid-expiry expiry) err-invalid-expiry)
    (asserts! (valid-collateral-type collateral-type) err-invalid-collateral-type)
    
    (let ((id (+ (var-get option-nonce) u1))
          (oracle-price (get price (unwrap! (get-current-oracle-price oracle) err-oracle-failure))))
      
      ;; Handle collateral
      (if (is-eq collateral-type "STX")
        (try! (stx-transfer? collateral tx-sender (as-contract tx-sender)))
        (try! (deposit-sbtc-for-option tx-sender collateral)))
      
      (map-set options id {
        owner: tx-sender,
        strategy: "BPSP",
        amount-ustx: amount,
        strike-price: lower-strike,
        upper-strike: upper-strike,
        premium-paid: collateral,
        collateral-type: collateral-type,
        collateral-amount: collateral,
        created-at: stacks-block-height,
        expiry-block: expiry,
        oracle-price-at-creation: oracle-price,
        is-exercised: false,
        is-settled: false,
        settlement-price: u0
      })
      (add-user-option tx-sender id)
      (var-set option-nonce id)
      (ok id))))

;; M2 New Strategy Functions

;; Create STRAP Option (2 CALL + 1 PUT at same strike)
(define-public (create-strap-option 
    (amount uint) 
    (strike uint) 
    (premium uint) 
    (expiry uint)
    (oracle <price-oracle-trait>))
  (create-strap-option-with-collateral amount strike premium expiry "STX" oracle))

(define-public (create-strap-option-with-collateral
    (amount uint) 
    (strike uint) 
    (premium uint) 
    (expiry uint)
    (collateral-type (string-ascii 4))
    (oracle <price-oracle-trait>))
  (begin
    (asserts! (not (var-get paused)) err-protocol-paused)
    (asserts! (> amount u0) err-invalid-amount)
    (asserts! (> premium u0) err-invalid-premium)
    (asserts! (> strike u0) err-invalid-amount)
    (asserts! (valid-expiry expiry) err-invalid-expiry)
    (asserts! (valid-collateral-type collateral-type) err-invalid-collateral-type)
    
    (let ((strap-id (+ (var-get option-nonce) u1))
          (call1-id (+ strap-id u1))
          (call2-id (+ strap-id u2))
          (put-id (+ strap-id u3))
          (total-premium (* premium u3))  ;; Premium for all 3 components
          (fee-amount (fee total-premium))
          (total-cost (+ total-premium fee-amount))
          (oracle-price (get price (unwrap! (get-current-oracle-price oracle) err-oracle-failure))))
      
      ;; Collect collateral
      (if (is-eq collateral-type "STX")
        (begin
          (try! (stx-transfer? total-cost tx-sender (as-contract tx-sender)))
          (try! (as-contract (stx-transfer? fee-amount tx-sender (var-get protocol-wallet)))))
        (try! (deposit-sbtc-for-option tx-sender total-cost)))
      
      ;; Create master STRAP record
      (map-set options strap-id {
        owner: tx-sender,
        strategy: "STRAP",
        amount-ustx: amount,
        strike-price: strike,
        upper-strike: strike,
        premium-paid: total-premium,
        collateral-type: collateral-type,
        collateral-amount: total-cost,
        created-at: stacks-block-height,
        expiry-block: expiry,
        oracle-price-at-creation: oracle-price,
        is-exercised: false,
        is-settled: false,
        settlement-price: u0
      })
      
      ;; Create component options (for detailed tracking)
      (map-set options call1-id {
        owner: tx-sender,
        strategy: "CALL",
        amount-ustx: amount,
        strike-price: strike,
        upper-strike: strike,
        premium-paid: premium,
        collateral-type: collateral-type,
        collateral-amount: u0,
        created-at: stacks-block-height,
        expiry-block: expiry,
        oracle-price-at-creation: oracle-price,
        is-exercised: false,
        is-settled: false,
        settlement-price: u0
      })
      
      (map-set options call2-id {
        owner: tx-sender,
        strategy: "CALL",
        amount-ustx: amount,
        strike-price: strike,
        upper-strike: strike,
        premium-paid: premium,
        collateral-type: collateral-type,
        collateral-amount: u0,
        created-at: stacks-block-height,
        expiry-block: expiry,
        oracle-price-at-creation: oracle-price,
        is-exercised: false,
        is-settled: false,
        settlement-price: u0
      })
      
      (map-set options put-id {
        owner: tx-sender,
        strategy: "PUT",
        amount-ustx: amount,
        strike-price: strike,
        upper-strike: strike,
        premium-paid: premium,
        collateral-type: collateral-type,
        collateral-amount: u0,
        created-at: stacks-block-height,
        expiry-block: expiry,
        oracle-price-at-creation: oracle-price,
        is-exercised: false,
        is-settled: false,
        settlement-price: u0
      })
      
      ;; Link components
      (map-set strap-components strap-id {
        call-option-1: call1-id,
        call-option-2: call2-id,
        put-option: put-id,
        combined-premium: total-premium,
        max-profit-potential: u0  ;; Unlimited for STRAP
      })
      
      (add-user-option tx-sender strap-id)
      (var-set option-nonce put-id)  ;; Advance nonce past all components
      (ok strap-id))))

;; Create Bull Call Spread (Long lower strike CALL + Short higher strike CALL)
(define-public (create-bull-call-spread 
    (amount uint) 
    (lower-strike uint) 
    (upper-strike uint) 
    (net-premium uint) 
    (expiry uint)
    (oracle <price-oracle-trait>))
  (create-bull-call-spread-with-collateral amount lower-strike upper-strike net-premium expiry "STX" oracle))

(define-public (create-bull-call-spread-with-collateral
    (amount uint) 
    (lower-strike uint) 
    (upper-strike uint) 
    (net-premium uint) 
    (expiry uint)
    (collateral-type (string-ascii 4))
    (oracle <price-oracle-trait>))
  (begin
    (asserts! (not (var-get paused)) err-protocol-paused)
    (asserts! (> amount u0) err-invalid-amount)
    (asserts! (> lower-strike u0) err-invalid-amount)
    (asserts! (> upper-strike lower-strike) err-invalid-strikes)
    (asserts! (>= net-premium u0) err-invalid-premium)
    (asserts! (valid-expiry expiry) err-invalid-expiry)
    (asserts! (valid-collateral-type collateral-type) err-invalid-collateral-type)
    
    (let ((spread-id (+ (var-get option-nonce) u1))
          (long-call-id (+ spread-id u1))
          (short-call-id (+ spread-id u2))
          (max-profit (- upper-strike lower-strike))
          (max-loss net-premium)
          (collateral-required (+ net-premium (fee net-premium)))
          (oracle-price (get price (unwrap! (get-current-oracle-price oracle) err-oracle-failure))))
      
      ;; Require collateral equal to max loss
      (if (is-eq collateral-type "STX")
        (begin
          (try! (stx-transfer? collateral-required tx-sender (as-contract tx-sender)))
          (try! (as-contract (stx-transfer? (fee net-premium) tx-sender (var-get protocol-wallet)))))
        (try! (deposit-sbtc-for-option tx-sender collateral-required)))
      
      ;; Create master BCSP record
      (map-set options spread-id {
        owner: tx-sender,
        strategy: "BCSP",
        amount-ustx: amount,
        strike-price: lower-strike,
        upper-strike: upper-strike,
        premium-paid: net-premium,
        collateral-type: collateral-type,
        collateral-amount: collateral-required,
        created-at: stacks-block-height,
        expiry-block: expiry,
        oracle-price-at-creation: oracle-price,
        is-exercised: false,
        is-settled: false,
        settlement-price: u0
      })
      
      ;; Create component options
      (map-set options long-call-id {
        owner: tx-sender,
        strategy: "CALL",
        amount-ustx: amount,
        strike-price: lower-strike,
        upper-strike: lower-strike,
        premium-paid: u0,
        collateral-type: collateral-type,
        collateral-amount: u0,
        created-at: stacks-block-height,
        expiry-block: expiry,
        oracle-price-at-creation: oracle-price,
        is-exercised: false,
        is-settled: false,
        settlement-price: u0
      })
      
      (map-set options short-call-id {
        owner: tx-sender,
        strategy: "CALL",
        amount-ustx: amount,
        strike-price: upper-strike,
        upper-strike: upper-strike,
        premium-paid: u0,
        collateral-type: collateral-type,
        collateral-amount: u0,
        created-at: stacks-block-height,
        expiry-block: expiry,
        oracle-price-at-creation: oracle-price,
        is-exercised: false,
        is-settled: false,
        settlement-price: u0
      })
      
      ;; Link components
      (map-set bull-call-spreads spread-id {
        long-call: long-call-id,
        short-call: short-call-id,
        net-premium: net-premium,
        max-profit: max-profit,
        max-loss: max-loss
      })
      
      (add-user-option tx-sender spread-id)
      (var-set option-nonce short-call-id)
      (ok spread-id))))

;; Exercise Option (enhanced for all 4 strategies)
(define-public (exercise-option (option-id uint) (oracle <price-oracle-trait>))
  (let ((option (unwrap! (map-get? options option-id) err-option-not-found))
        (oracle-price-data (unwrap! (get-current-oracle-price oracle) err-oracle-failure))
        (current-price (get price oracle-price-data)))
    (begin
      (asserts! (not (var-get paused)) err-protocol-paused)
      (asserts! (is-eq tx-sender (get owner option)) err-not-owner)
      (asserts! (not (get is-exercised option)) err-already-exercised)
      (asserts! (> (get expiry-block option) stacks-block-height) err-option-expired)
      
      (let ((strategy (get strategy option))
            (strike (get strike-price option))
            (upper-strike (get upper-strike option))
            (amount (get amount-ustx option))
            (premium (get premium-paid option))
            (payout (if (is-eq strategy "CALL")
                       (call-payout strike amount premium current-price)
                       (if (is-eq strategy "BPSP")
                           (bpsp-payout strike upper-strike amount premium current-price)
                           (if (is-eq strategy "STRAP")
                               (strap-payout strike amount premium current-price)
                               (if (is-eq strategy "BCSP")
                                   (bcsp-payout strike upper-strike amount premium current-price)
                                   u0))))))
        
        (if (> payout u0)
          (let ((contract-balance (as-contract (stx-get-balance tx-sender)))
                (available-payout (if (> payout contract-balance) contract-balance payout)))
            (begin
              (if (> available-payout u0)
                (unwrap-panic (as-contract (stx-transfer? available-payout tx-sender (get owner option))))
                false)
              (map-set options option-id (merge option {
                is-exercised: true,
                settlement-price: current-price
              }))
              (ok payout)))
          (begin
            (map-set options option-id (merge option {
              is-exercised: true,
              settlement-price: current-price
            }))
            (ok u0)))))))

;; Settle Expired Option (enhanced with oracle)
(define-public (settle-expired (option-id uint) (oracle <price-oracle-trait>))
  (let ((option (unwrap! (map-get? options option-id) err-option-not-found))
        (oracle-price-data (unwrap! (get-current-oracle-price oracle) err-oracle-failure))
        (settlement-price (get price oracle-price-data)))
    (begin
      (asserts! (not (var-get paused)) err-protocol-paused)
      (asserts! (not (get is-settled option)) err-already-settled)
      (asserts! (<= (get expiry-block option) stacks-block-height) err-not-expired)
      
      (let ((strategy (get strategy option))
            (strike (get strike-price option))
            (upper-strike (get upper-strike option))
            (amount (get amount-ustx option))
            (premium (get premium-paid option))
            (payout (if (is-eq strategy "CALL")
                       (call-payout strike amount premium settlement-price)
                       (if (is-eq strategy "BPSP")
                           (bpsp-payout strike upper-strike amount premium settlement-price)
                           (if (is-eq strategy "STRAP")
                               (strap-payout strike amount premium settlement-price)
                               (if (is-eq strategy "BCSP")
                                   (bcsp-payout strike upper-strike amount premium settlement-price)
                                   u0))))))
        
        (if (> payout u0)
          (let ((contract-balance (as-contract (stx-get-balance tx-sender)))
                (available-payout (if (> payout contract-balance) contract-balance payout)))
            (begin
              (if (> available-payout u0)
                (unwrap-panic (as-contract (stx-transfer? available-payout tx-sender (get owner option))))
                false)
              (map-set options option-id (merge option {
                is-settled: true,
                settlement-price: settlement-price
              }))
              (ok payout)))
          (begin
            (map-set options option-id (merge option {
              is-settled: true,
              settlement-price: settlement-price
            }))
            (ok u0)))))))

;; sBTC Collateral Management Functions
;; Simplified for testing: tracks sBTC balances internally
;; In production, this would integrate with actual sBTC token contract

(define-private (deposit-sbtc-for-option (user principal) (amount uint))
  (begin
    (asserts! (> amount u0) err-invalid-amount)
    (let ((current-collateral (default-to 
                                {total-deposited: u0, available-balance: u0, locked-in-positions: u0, 
                                 last-valuation-price: u0, margin-call-threshold: u0}
                                (map-get? sbtc-collateral user))))
      (map-set sbtc-collateral user (merge current-collateral {
        total-deposited: (+ (get total-deposited current-collateral) amount),
        locked-in-positions: (+ (get locked-in-positions current-collateral) amount),
        available-balance: (+ (get available-balance current-collateral) amount)
      }))
      (ok true))))

(define-public (deposit-sbtc-collateral (amount uint))
  (begin
    (asserts! (> amount u0) err-invalid-amount)
    (try! (deposit-sbtc-for-option tx-sender amount))
    (ok true)))

(define-public (withdraw-sbtc-collateral (amount uint))
  (begin
    (asserts! (> amount u0) err-invalid-amount)
    
    (let ((collateral (unwrap! (map-get? sbtc-collateral tx-sender) err-insufficient-sbtc)))
      (asserts! (>= (get available-balance collateral) amount) err-insufficient-sbtc)
      
      ;; Update collateral tracking
      (map-set sbtc-collateral tx-sender (merge collateral {
        total-deposited: (- (get total-deposited collateral) amount),
        available-balance: (- (get available-balance collateral) amount)
      }))
      (ok true))))

(define-read-only (get-collateral-value (user principal))
  (match (map-get? sbtc-collateral user)
    collateral (ok (get total-deposited collateral))
    (ok u0)))

(define-read-only (get-margin-requirements (user principal))
  (match (map-get? sbtc-collateral user)
    collateral (ok (/ (* (get locked-in-positions collateral) (var-get margin-requirement-pct)) u100))
    (ok u0)))

;; Read-Only Functions
(define-read-only (get-option (id uint)) (map-get? options id))
(define-read-only (get-user-options (user principal)) (default-to (list) (map-get? user-options user)))
(define-read-only (get-strap-components (id uint)) (map-get? strap-components id))
(define-read-only (get-bull-call-spread (id uint)) (map-get? bull-call-spreads id))
(define-read-only (get-stats) {
  total: (var-get option-nonce),
  fee: (var-get protocol-fee-bps),
  paused: (var-get paused),
  min-period: (var-get min-option-period),
  max-period: (var-get max-option-period),
  oracle: (var-get oracle-contract),
  sbtc: (var-get sbtc-contract)
})
(define-read-only (get-contract-owner) (ok (var-get contract-owner)))

;; Admin Functions
(define-public (pause-protocol) 
  (begin 
    (asserts! (is-eq tx-sender (var-get contract-owner)) err-not-authorized) 
    (var-set paused true) 
    (ok true)))

(define-public (unpause-protocol) 
  (begin 
    (asserts! (is-eq tx-sender (var-get contract-owner)) err-not-authorized) 
    (var-set paused false) 
    (ok true)))

(define-public (set-protocol-fee (new-fee uint)) 
  (begin 
    (asserts! (is-eq tx-sender (var-get contract-owner)) err-not-authorized) 
    (asserts! (<= new-fee u1000) err-invalid-amount) 
    (var-set protocol-fee-bps new-fee) 
    (ok true)))

(define-public (set-protocol-wallet (wallet principal)) 
  (begin 
    (asserts! (is-eq tx-sender (var-get contract-owner)) err-not-authorized) 
    (asserts! (valid-wallet wallet) err-invalid-amount) 
    (var-set protocol-wallet wallet) 
    (ok true)))

(define-public (set-oracle-contract (oracle principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) err-not-authorized)
    (var-set oracle-contract (some oracle))
    (ok true)))

(define-public (set-sbtc-contract (sbtc principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) err-not-authorized)
    (var-set sbtc-contract (some sbtc))
    (ok true)))
