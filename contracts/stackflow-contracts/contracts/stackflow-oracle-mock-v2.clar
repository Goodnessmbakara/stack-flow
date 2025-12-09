;; StackFlow Oracle Mock - Price Feed Contract
;; Provides reliable price feeds with validation and staleness checks
;; Mock implementation for M2 testing and development

;; Trait Definition
;; Trait Definition
(impl-trait .price-oracle-trait-v2.price-oracle-trait)


;; Contract Owner
(define-data-var contract-owner principal tx-sender)

;; Constants
(define-constant err-not-authorized (err u200))
(define-constant err-invalid-price (err u201))
(define-constant err-stale-price (err u202))
(define-constant err-price-not-found (err u203))
(define-constant err-out-of-range (err u204))

;; Price validation bounds
(define-constant min-price u1)                    ;; $0.000001 minimum
(define-constant max-price u100000000000)        ;; $100,000 maximum
(define-constant staleness-threshold u300)       ;; 5 minutes (300 blocks approx 5 min at 1 block/sec)

;; Data Structures
(define-map price-feeds (string-ascii 12) {
  current-price: uint,
  last-updated: uint,
  confidence-score: uint,        ;; 0-100 confidence level
  source-count: uint,            ;; Number of contributing sources
  price-history: (list 10 uint)  ;; Recent price history
})

;; Price source tracking for consensus simulation
(define-map price-sources (string-ascii 12) (list 5 {source: principal, price: uint, weight: uint}))

;; Helper Functions
(define-private (valid-price-range (price uint))
  (and (>= price min-price) (<= price max-price)))

(define-private (calculate-confidence (source-count uint))
  ;; Simple confidence: more sources = higher confidence
  ;; 1 source = 50%, 2+ sources = 75%, 3+ sources = 90%, 5+ sources = 100%
  (if (>= source-count u5)
      u100
      (if (>= source-count u3)
          u90
          (if (>= source-count u2)
              u75
              u50))))

(define-private (add-to-price-history (history (list 10 uint)) (new-price uint))
  ;; Add new price to history, keeping last 10
  (if (>= (len history) u10)
      (let ((sliced (unwrap-panic (slice? history u1 (len history)))))
        (unwrap-panic (as-max-len? (append sliced new-price) u10)))
      (unwrap-panic (as-max-len? (append history new-price) u10))))

;; Public Functions

;; Get current price for an asset
(define-read-only (get-price (asset (string-ascii 12)))
  (match (map-get? price-feeds asset)
    feed (ok {
      price: (get current-price feed),
      timestamp: (get last-updated feed),
      confidence: (get confidence-score feed)
    })
    err-price-not-found))

;; Check if price is fresh (within staleness threshold)
(define-read-only (is-price-fresh (asset (string-ascii 12)) (max-age uint))
  (match (map-get? price-feeds asset)
    feed (ok (<= (- stacks-block-height (get last-updated feed)) max-age))
    err-price-not-found))

;; Get price with freshness validation
(define-read-only (get-fresh-price (asset (string-ascii 12)))
  (let ((feed-result (get-price asset)))
    (match feed-result
      feed (if (<= (- stacks-block-height (get timestamp feed)) staleness-threshold)
               (ok feed)
               err-stale-price)
      error err-stale-price)))

;; Update price (admin only for testing)
(define-public (update-price (asset (string-ascii 12)) (new-price uint) (source-count uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) err-not-authorized)
    (asserts! (> new-price u0) err-invalid-price)
    (asserts! (valid-price-range new-price) err-out-of-range)
    
    (let ((current-feed (default-to 
                          {current-price: u0, last-updated: u0, confidence-score: u0, 
                           source-count: u0, price-history: (list)}
                          (map-get? price-feeds asset)))
          (new-confidence (calculate-confidence source-count))
          (updated-history (add-to-price-history (get price-history current-feed) new-price)))
      
      (map-set price-feeds asset {
        current-price: new-price,
        last-updated: stacks-block-height,
        confidence-score: new-confidence,
        source-count: source-count,
        price-history: updated-history
      })
      (ok true))))

;; Batch update multiple prices (for simulation efficiency)
(define-public (batch-update-prices (updates (list 10 {asset: (string-ascii 12), price: uint, sources: uint})))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) err-not-authorized)
    (ok (map update-single-price updates))))

(define-private (update-single-price (update {asset: (string-ascii 12), price: uint, sources: uint}))
  (begin
    (unwrap-panic (update-price (get asset update) (get price update) (get sources update)))
    true))

;; Initialize common assets with default prices (for testing)
(define-public (initialize-test-prices)
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) err-not-authorized)
    
    ;; Initialize BTC price at $45,000
    (try! (update-price "BTC" u45000000000 u5))
    
    ;; Initialize STX price at $2.50
    (try! (update-price "STX" u2500000 u5))
    
    ;; Initialize sBTC price (should match BTC)
    (try! (update-price "sBTC" u45000000000 u5))
    
    (ok true)))

;; Read-only helper functions
(define-read-only (get-price-history (asset (string-ascii 12)))
  (match (map-get? price-feeds asset)
    feed (ok (get price-history feed))
    err-price-not-found))

(define-read-only (get-confidence (asset (string-ascii 12)))
  (match (map-get? price-feeds asset)
    feed (ok (get confidence-score feed))
    err-price-not-found))

(define-read-only (get-staleness-threshold)
  (ok staleness-threshold))

(define-read-only (get-price-age (asset (string-ascii 12)))
  (match (map-get? price-feeds asset)
    feed (ok (- stacks-block-height (get last-updated feed)))
    err-price-not-found))

;; Admin Functions
(define-public (set-contract-owner (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) err-not-authorized)
    (var-set contract-owner new-owner)
    (ok true)))

(define-read-only (get-contract-owner)
  (ok (var-get contract-owner)))
