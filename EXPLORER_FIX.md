# 🔧 Explorer Link Fix - Arbiscan → Stacks Explorer

**Date:** October 3, 2025  
**Issue:** Frontend was linking to Arbiscan (Arbitrum) instead of Stacks Explorer

---

## ❌ **Problem**

The `SuccessModal` component was hardcoded to open transactions on Arbiscan:
```typescript
const viewOnArbiscan = `https://arbiscan.io/tx/${txHash}`;
```

This caused:
- ❌ "Invalid Txn hash" errors on Arbiscan
- ❌ Wrong blockchain explorer (Arbitrum vs Stacks)
- ❌ Users couldn't view their transactions

---

## ✅ **Solution**

Updated `src/components/molecules/SuccessModal.tsx` to use **Stacks Explorer**:

```typescript
// Get network from environment (testnet or mainnet)
const network = import.meta.env.VITE_STACKS_NETWORK || 'testnet';
const explorerUrl = `https://explorer.hiro.so/txid/${txHash}?chain=${network}`;
```

**Button text changed:**
- ❌ "View on Arbiscan"
- ✅ "View on Stacks Explorer"

---

## 🔗 **Explorer URLs**

### **Testnet**
```
https://explorer.hiro.so/txid/{TX_ID}?chain=testnet
```

### **Mainnet**
```
https://explorer.hiro.so/txid/{TX_ID}?chain=mainnet
```

The network is automatically determined from `VITE_STACKS_NETWORK` env variable.

---

## 🎯 **Result**

Now when users complete a transaction:
1. ✅ Transaction link opens **Stacks Explorer** (not Arbiscan)
2. ✅ Correct network (testnet/mainnet) based on environment
3. ✅ Users can view their transaction details successfully

---

## 📝 **Files Modified**

- ✅ `src/components/molecules/SuccessModal.tsx`
  - Updated explorer URL to use Stacks
  - Made it network-aware (testnet/mainnet)
  - Changed button text to "View on Stacks Explorer"

---

## 🚀 **Testing**

To test the fix:
1. Start dev server: `pnpm dev`
2. Complete a transaction
3. Click "View on Stacks Explorer"
4. Should open: `https://explorer.hiro.so/txid/{YOUR_TX}?chain=testnet`

---

*Fixed as part of V2 deployment configuration* ✅

