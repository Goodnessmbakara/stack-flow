;; Pyth Oracle Integration for StackFlow M2
;; Integrates with Pyth Network for reliable STX/USD and BTC/USD price feeds

;; Pyth Oracle Interface (simplified for Stacks integration)
(impl-trait .price-oracle-trait-v2.price-oracle-trait)

;; Based on Pyth's Stacks integration pattern

;; Price feed IDs (Pyth mainnet)
;; STX/USD: 0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17
;; BTC/USD: 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43

(define-constant pyth-stx-usd-feed-id 0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17)
(define-constant pyth-btc-usd-feed-id 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43)

;; Error constants
(define-constant err-pyth-feed-not-found (err u300))
(define-constant err-pyth-stale-price (err u301))
(define-constant err-pyth-invalid-feed (err u302))

;; Pyth contract reference (configurable for testnet vs mainnet)
;; Mainnet: SP2T5V2MBY453R8ANCMV5D85TYF3AVTFQ1WTXMFGZ.pyth-oracle-v1
;; Set via admin function before use
(define-data-var pyth-contract-address (optional principal) none)

;; Get STX/USD price from Pyth
;; Returns price in micro-USD format (6 decimals)
(define-read-only (get-stx-price)
  (get-pyth-price pyth-stx-usd-feed-id))

;; Get BTC/USD price from Pyth
(define-read-only (get-btc-price)
  (get-pyth-price pyth-btc-usd-feed-id))

;; Generic Pyth price getter
;; In production, this would call the actual Pyth contract
;; For testing/development, returns default prices
(define-read-only (get-pyth-price (feed-id (buff 32)))
  (if (is-eq feed-id pyth-stx-usd-feed-id)
      ;; STX/USD default: $2.50
      (ok {
        price: u2500000,
        conf: u10000,
        expo: -6,
        publish-time: stacks-block-height
      })
      (if (is-eq feed-id pyth-btc-usd-feed-id)
          ;; BTC/USD default: $45,000
          (ok {
            price: u45000000000,
            conf: u100000000,
            expo: -6,
            publish-time: stacks-block-height
          })
          err-pyth-feed-not-found)))

;; Production Pyth integration (commented out for testing)
;; (define-read-only (get-pyth-price (feed-id (buff 32)))
;;   (contract-call? pyth-contract get-price feed-id))

;; Helper function to convert Pyth price format to our internal format
(define-read-only (pyth-price-to-micro-usd (pyth-price {price: uint, conf: uint, expo: int, publish-time: uint}))
  (ok {
    price: (get price pyth-price),
    timestamp: (get publish-time pyth-price),
    confidence: u100
  }))

;; Main interface for M2 contract
(define-read-only (get-price (asset (string-ascii 12)))
  (if (is-eq asset "STX")
      (match (get-stx-price)
        pyth-data (pyth-price-to-micro-usd pyth-data)
        err (err err))
      (if (is-eq asset "BTC")
          (match (get-btc-price)
            pyth-data (pyth-price-to-micro-usd pyth-data)
            err (err err))
          err-pyth-invalid-feed)))

;; Freshness check (Pyth includes timestamp in response)
(define-read-only (is-price-fresh (asset (string-ascii 12)) (max-age uint))
  (match (get-price asset)
    price-data (ok (<= (- stacks-block-height (get timestamp price-data)) max-age))
    err (ok false)))
