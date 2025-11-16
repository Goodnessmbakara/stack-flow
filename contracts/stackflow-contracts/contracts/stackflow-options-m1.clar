;; StackFlow Options M1 - Milestone 1 Implementation
;; Bitcoin-secured options trading on Stacks
;; M1 Focus: CALL and Bull Put Spread (BPSP) strategies only

;; Contract owner - initialized at deployment time
;; Using define-data-var so tx-sender is evaluated at deployment, not definition time
;; This is the correct pattern for contract ownership in Clarity
(define-data-var contract-owner principal tx-sender)
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
  upper-strike: uint,             ;; For BPSP: upper strike price
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


;; Helper Functions
(define-private (fee (p uint)) (/ (* p (var-get protocol-fee-bps)) u10000))
(define-private (valid-expiry (e uint)) (and (> e stacks-block-height) (>= (- e stacks-block-height) (var-get min-option-period)) (<= (- e stacks-block-height) (var-get max-option-period))))
(define-private (add-user-option (u principal) (id uint)) (map-set user-options u (unwrap-panic (as-max-len? (append (default-to (list) (map-get? user-options u)) id) u500))))

;; Input Validation Functions
(define-private (valid-price (price uint)) (and (> price u0) (<= price u100000000)))  ;; Price must be > 0 and <= 100,000,000 micro-USD ($100,000)
(define-private (valid-wallet (wallet principal)) (not (is-eq wallet (as-contract tx-sender))))  ;; Wallet cannot be the contract itself

;; Payout Calculators
(define-private (call-payout (strike uint) (amount uint) (premium uint) (current-price uint))
  (if (> current-price strike)
    (let ((diff (- current-price strike))
          (gains (/ (* diff amount) ustx-per-stx)))
      (if (> gains premium) (- gains premium) u0))
    u0))

(define-private (bpsp-payout (lower-strike uint) (upper-strike uint) (amount uint) (premium uint) (current-price uint))
  (if (>= current-price upper-strike)
    ;; Price above upper strike - option expires worthless, no payout (premium already collected)
    u0
    (if (< current-price lower-strike)
      ;; Maximum loss if price falls below lower strike
      (let ((max-loss (- upper-strike lower-strike)))
        (if (> max-loss premium) u0 (- premium max-loss)))
      ;; Partial loss between strikes (proportional)
      (let ((loss-amount (/ (* (- upper-strike current-price) amount) ustx-per-stx)))
        (if (> loss-amount premium) u0 (- premium loss-amount))))))

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
        upper-strike: strike,  ;; For CALL options, upper-strike = strike
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
(define-public (create-bull-put-spread (amount uint) (lower-strike uint) (upper-strike uint) (collateral uint) (expiry uint))
  (begin
    (asserts! (not (var-get paused)) err-protocol-paused)
    (asserts! (> amount u0) err-invalid-amount)
    (asserts! (> lower-strike u0) err-invalid-amount)
    (asserts! (> upper-strike lower-strike) err-invalid-strikes)
    (asserts! (> collateral u0) err-invalid-amount)
    (asserts! (valid-expiry expiry) err-invalid-expiry)
    (let ((id (+ (var-get option-nonce) u1)))
      ;; User provides collateral for BPSP
      (try! (stx-transfer? collateral tx-sender (as-contract tx-sender)))
      (map-set options id {
        owner: tx-sender,
        strategy: "BPSP",
        amount-ustx: amount,
        strike-price: lower-strike,  ;; Store lower strike for BPSP
        upper-strike: upper-strike,  ;; Store upper strike for BPSP
        premium-paid: collateral,     ;; Collateral provided (positive)
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
    (asserts! (valid-price current-price) err-invalid-amount)
    (asserts! (is-some (map-get? options option-id)) err-option-not-found)
    (let ((option (unwrap-panic (map-get? options option-id))))
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
                       (bpsp-payout strike upper-strike amount premium current-price))))
        (if (> payout u0)
          (let ((contract-balance (as-contract (stx-get-balance tx-sender)))
                (available-payout (if (> payout contract-balance) contract-balance payout)))
            (begin
              (if (> available-payout u0)
                (unwrap-panic (as-contract (stx-transfer? available-payout tx-sender (get owner option))))
                false)
              (map-set options option-id (merge option {
                is-exercised: true
              }))
              (ok payout)))
          (begin
            (map-set options option-id (merge option {
              is-exercised: true
            }))
            (ok u0)))))))

;; Settle Expired Option
(define-public (settle-expired (option-id uint) (settlement-price uint))
  (begin
    (asserts! (not (var-get paused)) err-protocol-paused)
    (asserts! (valid-price settlement-price) err-invalid-amount)
    (asserts! (is-some (map-get? options option-id)) err-option-not-found)
    (let ((option (unwrap-panic (map-get? options option-id))))
      (asserts! (not (get is-settled option)) err-already-settled)
      (asserts! (<= (get expiry-block option) stacks-block-height) err-not-expired)
      (let ((strategy (get strategy option))
            (strike (get strike-price option))
            (upper-strike (get upper-strike option))
            (amount (get amount-ustx option))
            (premium (get premium-paid option))
            (payout (if (is-eq strategy "CALL")
                       (call-payout strike amount premium settlement-price)
                       (bpsp-payout strike upper-strike amount premium settlement-price))))
        (if (> payout u0)
          (let ((contract-balance (as-contract (stx-get-balance tx-sender)))
                (available-payout (if (> payout contract-balance) contract-balance payout)))
            (begin
              (if (> available-payout u0)
                (unwrap-panic (as-contract (stx-transfer? available-payout tx-sender (get owner option))))
                false)
              (map-set options option-id (merge option {
                is-settled: true
              }))
              (ok payout)))
          (begin
            (map-set options option-id (merge option {
              is-settled: true
            }))
            (ok u0)))))))

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
(define-read-only (get-contract-owner) (ok (var-get contract-owner)))

;; Admin Functions
(define-public (pause-protocol) (begin (asserts! (is-eq tx-sender (var-get contract-owner)) err-not-authorized) (var-set paused true) (ok true)))
(define-public (unpause-protocol) (begin (asserts! (is-eq tx-sender (var-get contract-owner)) err-not-authorized) (var-set paused false) (ok true)))
(define-public (set-protocol-fee (new-fee uint)) (begin (asserts! (is-eq tx-sender (var-get contract-owner)) err-not-authorized) (asserts! (<= new-fee u1000) err-invalid-amount) (var-set protocol-fee-bps new-fee) (ok true)))
(define-public (set-protocol-wallet (wallet principal)) (begin (asserts! (is-eq tx-sender (var-get contract-owner)) err-not-authorized) (asserts! (valid-wallet wallet) err-invalid-amount) (var-set protocol-wallet wallet) (ok true)))