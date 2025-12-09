(define-trait price-oracle-trait
  (
    (get-price ((string-ascii 12)) (response {price: uint, timestamp: uint, confidence: uint} uint))
    (is-price-fresh ((string-ascii 12) uint) (response bool uint))
  )
)
