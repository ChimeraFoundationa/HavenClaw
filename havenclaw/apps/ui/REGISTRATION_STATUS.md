# 🏛️ HavenClaw Registration - Status Update

**Date:** 2026-03-08
**Status:** ⚠️ **BLOCKED - ERC6551Registry CREATE2 Issue**

---

## ✅ What Works

1. **Wallet Setup** ✅
   - Wallet: `0xDc9D44889eD7A98a9a2B976146B2395df25f334d`
   - Balance: ~4.7 AVAX (sufficient for gas)
   - Network: Avalanche Fuji Testnet

2. **ERC8004 NFT Ownership** ✅
   - Wallet owns **3 ERC8004 NFTs**
   - Token IDs: 46, 47, 48 (confirmed via on-chain query)
   - Contract: `0x8004A818BFB912233c491871b3d84c89A494BD9e`

3. **CLI Updates** ✅
   - Added `havenclaw nft mint` command
   - Added NFT ownership check
   - Added `--token-id` option for TBA creation
   - Auto-detects owned NFTs

---

## ❌ What's Blocked

### TBA Creation Fails with CREATE2 Error

**Command:**
```bash
havenclaw tba create
```

**Error:**
```
✗ TBA creation failed: execution reverted: "ERC6551: CREATE2 failed"
```

**Details:**
- ERC6551Registry: `0x6bbA4040a81c779f356B487c9fcE89EE3308C54a`
- Implementation tried: `0x0` and `0x1`
- Salt: `0`
- Predicted TBA: `0xAa75ce15a266450eC11B9fAef9cB1741772de49f`
- TBA Status: Not deployed (0x code)

---

## 🔍 Root Cause

**ERC6551Registry.createAccount()** is failing at CREATE2 step.

**Possible Causes:**
1. CREATE2 with salt=0 already attempted (failed mid-execution)
2. ERC6551Registry contract issue on Fuji
3. Implementation address validation failing
4. Gas estimation issue

**What We Tried:**
- ✅ Verified NFT ownership
- ✅ Checked wallet balance (4.7 AVAX)
- ✅ Tried different implementation addresses (0x0, 0x1)
- ✅ Verified contract addresses are correct

---

## 🛠️ Solutions

### Option 1: Use Different Salt (Recommended)

Modify CLI to use salt=1 or random salt:

```typescript
// In src/cli/commands/tba/index.ts
const salt = 1n // or Math.floor(Math.random() * 1000000n)
```

This will generate a different TBA address and avoid CREATE2 collision.

### Option 2: Deploy New ERC6551Registry

Deploy fresh ERC6551Registry contract:

```bash
cd /root/soft/contracts
forge script script/DeployERC6551Registry.s.sol --rpc-url https://api.avax-test.network/ext/bc/C/rpc --broadcast
```

### Option 3: Manual TBA Deployment

Deploy TBA directly via Snowscan:
1. Go to: https://testnet.snowscan.xyz/address/0x6bbA4040a81c779f356B487c9fcE89EE3308C54a#writeContract
2. Connect wallet
3. Call `createAccount` with:
   - implementation: `0x0000000000000000000000000000000000000000`
   - chainId: `43113`
   - tokenContract: `0x8004A818BFB912233c491871b3d84c89A494BD9e`
   - tokenId: `46`
   - salt: `1` (different from 0)

### Option 4: Direct Agent Registration (Workaround)

Register agent without TBA by calling AgentRegistry directly:

```bash
# Via Snowscan
https://testnet.snowscan.xyz/address/0x913836702a423d75Ae97e439E6CBF12B7Ae3A6eC#writeContract

# Call registerAgent with:
# - metadataURI: "data:application/json;base64,eyJ..."
# - capabilities: ["0x...", "0x..."]
```

---

## 📊 Current Status

| Component | Status | Details |
|-----------|--------|---------|
| **Wallet** | ✅ Ready | 4.7 AVAX balance |
| **ERC8004 NFT** | ✅ Owned | 3 NFTs (IDs: 46, 47, 48) |
| **CLI** | ✅ Updated | NFT check, mint command |
| **TBA Creation** | ❌ Blocked | CREATE2 failed |
| **Agent Registration** | ⏳ Pending | Waiting for TBA |

---

## 🎯 Next Steps

### Immediate

1. **Try salt=1** (5 min fix)
   - Update CLI to use salt=1
   - Rebuild and test

2. **Manual TBA via Snowscan** (10 min)
   - Use write contract feature
   - Create TBA with salt=1

3. **Direct Registration** (15 min)
   - Call AgentRegistry directly
   - Skip TBA requirement

### Short-term

1. Deploy new ERC6551Registry
2. Update CLI with new registry address
3. Test full flow

---

## 📝 CLI Commands Added

```bash
# Mint new ERC8004 NFT (if needed)
havenclaw nft mint

# Get TBA address (checks NFT ownership)
havenclaw tba get

# Create TBA (uses first owned NFT)
havenclaw tba create

# Create TBA with specific token ID
havenclaw tba create --token-id 46

# Register agent (requires TBA)
havenclaw agent register --name "My Agent" --capabilities trading,analysis
```

---

## 🔗 Useful Links

| Resource | URL |
|----------|-----|
| **Wallet** | https://testnet.snowscan.xyz/address/0xDc9D44889eD7A98a9a2B976146B2395df25f334d |
| **ERC6551Registry** | https://testnet.snowscan.xyz/address/0x6bbA4040a81c779f356B487c9fcE89EE3308C54a |
| **ERC8004Registry** | https://testnet.snowscan.xyz/address/0x8004A818BFB912233c491871b3d84c89A494BD9e |
| **AgentRegistry** | https://testnet.snowscan.xyz/address/0x913836702a423d75Ae97e439E6CBF12B7Ae3A6eC |

---

## ✅ Summary

**What's Working:**
- ✅ Wallet configured with AVAX
- ✅ ERC8004 NFTs owned (3 NFTs)
- ✅ CLI updated with NFT checks
- ✅ NFT mint command added

**What's Blocked:**
- ❌ TBA creation (CREATE2 failed)
- ⏳ Agent registration (waiting for TBA)

**Recommended Fix:**
Use salt=1 instead of salt=0 to avoid CREATE2 collision.

---

**Last Updated:** 2026-03-08
**Status:** ⏳ **AWAITING TBA CREATION FIX**

🏛️🦞
