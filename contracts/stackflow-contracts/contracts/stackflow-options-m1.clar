;; StackFlow Options M1 - Milestone 1 Implementation
;; Bitcoin-secured options trading on Stacks
;; M1 Focus: CALL and Bull Put Spread (BPSP) strategies only

(define-constant contract-owner tx-sender)
(define-constant ustx-per-stx u1000000)

;; Errors
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

;; Data Structures
(define-map options uint {
  owner: principal,
  strategy: (string-ascii 4),    ;; "CALL" or "BPSP"
  amount-ustx: uint,
  strike-price: uint,
  premium-paid: uint,
  created-at: uint,
  expiry-block: uint,
  is-exercised: bool,
  is-settled: bool
})

(define-map user-options principal (list 500 uint))
(define-data-var option-nonce uint u0)
(define-data-var protocol-fee-bps uint u10)
(define-data-var protocol-wallet principal tx-sender)
(define-data-var paused bool false)
(define-data-var min-option-period uint u1008)  ;; 7 days
(define-data-var max-option-period uint u12960) ;; 90 days

;; Oracle Interface Trait
(define-trait oracle-trait
  (
    ;; Get current price for an asset
    (get-price (asset (string-ascii 10)) (response uint uint))
    
    ;; Get historical price at block height
    (get-price-at-block (asset (string-ascii 10)) (block-height uint) (response uint uint))
    
    ;; Verify price authenticity
    (verify-price (asset (string-ascii 10)) (price uint) (response bool uint))
  )
)

;; Settlement Interface Trait
(define-trait settlement-trait
  (
    ;; Auto-settle expired options
    (auto-settle-expired (option-id uint) (response bool uint))
    
    ;; Batch settle multiple options
    (batch-settle (option-ids (list 100 uint)) (response bool uint))
    
    ;; Get settlement status
    (get-settlement-status (option-id uint) (response (optional bool) uint))
  )
)

;; Helper Functions
(define-private (fee (p uint)) (/ (* p (var-get protocol-fee-bps)) u10000))
(define-private (valid-expiry (e uint)) (and (> e stacks-block-height) (>= (- e stacks-block-height) (var-get min-option-period)) (<= (- e stacks-block-height) (var-get max-option-period))))
(define-private (add-user-option (u principal) (id uint)) (map-set user-options u (unwrap-panic (as-max-len? (append (default-to (list) (map-get? user-options u)) id) u500))))

;; Payout Calculators
(define-private (call-payout (strike uint) (amount uint) (premium uint) (current-price uint))
  (if (> current-price strike)
    (let ((diff (- current-price strike))
          (gains (/ (* diff amount) ustx-per-stx)))
      (if (> gains premium) (- gains premium) u0))
    u0))

(define-private (bpsp-payout (lower-strike uint) (upper-strike uint) (amount uint) (premium uint) (current-price uint))
  (if (>= current-price upper-strike)
    ;; Keep premium if price stays above upper strike (best case)
    premium
    (if (< current-price lower-strike)
      ;; Maximum loss if price falls below lower strike
      (let ((max-loss (- upper-strike lower-strike)))
        (- premium max-loss))
      ;; Partial loss between strikes (proportional)
      (let ((loss-amount (/ (* (- upper-strike current-price) amount) ustx-per-stx)))
        (if (< loss-amount premium) (- premium loss-amount) u0)))))

;; Public Functions

;; Create CALL Option
(define-public (create-call-option (amount uint) (strike uint) (premium uint) (expiry uint))
  (begin
    (asserts! (not (var-get paused)) err-protocol-paused)
    (asserts! (> amount u0) err-invalid-amount)
    (asserts! (> premium u0) err-invalid-premium)
    (asserts! (> strike u0) err-invalid-amount)
    (asserts! (valid-expiry expiry) err-invalid-expiry)
    (let ((id (+ (var-get option-nonce) u1))
          (fee-amount (fee premium))
          (total (+ premium fee-amount)))
      (try! (stx-transfer? total tx-sender (as-contract tx-sender)))
      (try! (as-contract (stx-transfer? fee-amount tx-sender (var-get protocol-wallet))))
      (map-set options id {
        owner: tx-sender,
        strategy: "CALL",
        amount-ustx: amount,
        strike-price: strike,
        premium-paid: premium,
        created-at: stacks-block-height,
        expiry-block: expiry,
        is-exercised: false,
        is-settled: false
      })
      (add-user-option tx-sender id)
      (var-set option-nonce id)
      (ok id))))

;; Create Bull Put Spread (BPSP)
(define-public (create-bull-put-spread (amount uint) (lower-strike uint) (upper-strike uint) (premium uint) (expiry uint))
  (begin
    (asserts! (not (var-get paused)) err-protocol-paused)
    (asserts! (> amount u0) err-invalid-amount)
    (asserts! (> lower-strike u0) err-invalid-amount)
    (asserts! (> upper-strike lower-strike) err-invalid-strikes)
    (asserts! (> premium u0) err-invalid-premium)
    (asserts! (valid-expiry expiry) err-invalid-expiry)
    (let ((id (+ (var-get option-nonce) u1))
          (spread-width (- upper-strike lower-strike))
          (max-loss spread-width)
          (collateral max-loss))
      ;; User receives premium upfront for BPSP (no transfer needed, just record it)
      (map-set options id {
        owner: tx-sender,
        strategy: "BPSP",
        amount-ustx: amount,
        strike-price: lower-strike,  ;; Store lower strike for BPSP
        premium-paid: premium,        ;; Premium received (positive)
        created-at: stacks-block-height,
        expiry-block: expiry,
        is-exercised: false,
        is-settled: false
      })
      (add-user-option tx-sender id)
      (var-set option-nonce id)
      (ok id))))

;; Exercise Option
(define-public (exercise-option (option-id uint) (current-price uint))
  (begin
    (asserts! (not (var-get paused)) err-protocol-paused)
    (asserts! (is-some (map-get? options option-id)) err-option-not-found)
    (let ((option (unwrap-panic (map-get? options option-id))))
      (asserts! (is-eq tx-sender (get owner option)) err-not-owner)
      (asserts! (not (get is-exercised option)) err-already-exercised)
      (asserts! (<= (get expiry-block option) stacks-block-height) err-option-expired)
      (let ((strategy (get strategy option))
            (strike (get strike-price option))
            (amount (get amount-ustx option))
            (premium (get premium-paid option))
            (payout (if (is-eq strategy "CALL")
                       (call-payout strike amount premium current-price)
                       (bpsp-payout u0 strike amount premium current-price))))
        (if (> payout u0)
          (begin
            (try! (stx-transfer? payout tx-sender (get owner option)))
            (map-set options option-id (merge option {
              is-exercised: true
            }))
            (ok payout))
          (begin
            (map-set options option-id (merge option {
              is-exercised: true
            }))
            (ok u0))))))

;; Settle Expired Option
(define-public (settle-expired (option-id uint) (settlement-price uint))
  (begin
    (asserts! (not (var-get paused)) err-protocol-paused)
    (asserts! (is-some (map-get? options option-id)) err-option-not-found)
    (let ((option (unwrap-panic (map-get? options option-id))))
      (asserts! (not (get is-settled option)) err-already-settled)
      (asserts! (> (get expiry-block option) stacks-block-height) err-not-expired)
      (let ((strategy (get strategy option))
            (strike (get strike-price option))
            (amount (get amount-ustx option))
            (premium (get premium-paid option))
            (payout (if (is-eq strategy "CALL")
                       (call-payout strike amount premium settlement-price)
                       (bpsp-payout u0 strike amount premium settlement-price))))
        (if (> payout u0)
          (begin
            (try! (stx-transfer? payout tx-sender (get owner option)))
            (map-set options option-id (merge option {
              is-settled: true
            }))
            (ok payout))
          (begin
            (map-set options option-id (merge option {
              is-settled: true
            }))
            (ok u0))))))

;; Read-Only Functions
(define-read-only (get-option (id uint)) (map-get? options id))
(define-read-only (get-user-options (user principal)) (default-to (list) (map-get? user-options user)))
(define-read-only (get-stats) {
  total: (var-get option-nonce),
  fee: (var-get protocol-fee-bps),
  paused: (var-get paused),
  min-period: (var-get min-option-period),
  max-period: (var-get max-option-period)
})

;; Admin Functions
(define-public (pause-protocol) (begin (asserts! (is-eq tx-sender contract-owner) err-not-authorized) (var-set paused true) (ok true)))
(define-public (unpause-protocol) (begin (asserts! (is-eq tx-sender contract-owner) err-not-authorized) (var-set paused false) (ok true)))
(define-public (set-protocol-fee (new-fee uint)) (begin (asserts! (is-eq tx-sender contract-owner) err-not-authorized) (asserts! (<= new-fee u1000) err-invalid-amount) (var-set protocol-fee-bps new-fee) (ok true)))
(define-public (set-protocol-wallet (wallet principal)) (begin (asserts! (is-eq tx-sender contract-owner) err-not-authorized) (var-set protocol-wallet wallet) (ok true)))
