;; dex-adapter-trait.clar
;; Trait for DEX integrations (ALEX, Velar, etc.)

(define-trait dex-adapter-trait
  (
    ;; Execute token swap
    ;; Returns amount of tokens received
    (swap-exact-tokens-for-tokens (
      uint       ;; amount-in
      uint       ;; min-amount-out
      principal  ;; token-in
      principal  ;; token-out
      principal  ;; recipient
    ) (response uint uint))
    
    ;; Get quote for swap
    ;; Returns expected output amount
    (get-swap-quote (
      uint       ;; amount-in
      principal  ;; token-in
      principal  ;; token-out
    ) (response uint uint))
  )
)
