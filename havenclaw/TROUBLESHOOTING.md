# 🔧 Troubleshooting Guide

## Agent Registration Failed

Jika Anda mengalami error saat register agent, berikut solusi:

### Error: "missing revert data" / "execution reverted"

**Penyebab**: OneClickRegistrar contract mungkin belum di-setup dengan benar atau ERC8004 contract requires mint permission.

**Solusi 1: Gunakan Manual Registration (2 steps)**

```bash
# Step 1: Create TBA dulu
havenclaw tba create

# Step 2: Register agent dari TBA
havenclaw agent register --name "ryu" --capabilities trading
```

**Solusi 2: Check Contract Permissions**

OneClickRegistrar perlu permission untuk mint ERC8004 NFT.
Contact contract owner untuk setup.

**Solusi 3: Use Direct Contract Interaction**

```bash
# Via Foundry
cd /root/soft/contracts

# Load env
source .env

# Call contract directly
cast send 0xe5fb1158b69933d215c99adfd23d16d6e6293294 \
  "registerAgentWithStrings(string,string[])" \
  "data:application/json;base64,eyJuYW1lIjoicnl1In0=" \
  '["trading"]' \
  --private-key $PRIVATE_KEY \
  --rpc-url https://api.avax-test.network/ext/bc/C/rpc
```

### Error: "Insufficient AVAX"

**Solusi**: Get test AVAX from faucet
- https://faucet.avax.network/
- https://core.app/tools/testnet-faucet/?subnet=avalanche

### Error: "No private key found"

**Solusi**: Set environment variable
```bash
export HAVENCLAW_PRIVATE_KEY=your_private_key_here
```

## Contract Addresses (Fuji Testnet)

| Contract | Address |
|----------|---------|
| OneClickRegistrar | 0xe5fb1158b69933d215c99adfd23d16d6e6293294 |
| ERC8004 | 0x8004A818BFB912233c491871b3d84c89A494BD9e |
| ERC6551Registry | 0xaCA0fA40b2eaAdcdF1c72cB36e88aBd76C0EA464 |
| AgentRegistry | 0x58EcC1A3B5a9c78f59A594120405058FB40a3201 |
| TBA Implementation | 0x287aAc478eA8063Bc5EDB53a89B7Ea77950Ee477 |

## Manual Registration Flow

If OneClick fails, use manual flow:

### Option A: Via TBA

```bash
# 1. Create ERC6551 TBA
havenclaw tba create

# 2. Register agent (will use TBA)
havenclaw agent register --name "My Agent" --capabilities trading
```

### Option B: Direct Contract Call

```solidity
// Via Remix or Foundry
// 1. Call ERC8004.mint() to get NFT
// 2. Call ERC6551Registry.createAccount() to create TBA
// 3. Call AgentRegistry.registerAgent() from TBA
```

## Need Help?

- Check contract deployment: `contracts/DEPLOYMENT_ADDRESSES.md`
- Check OneClick docs: `contracts/ONE_CLICK_REGISTRATION.md`
- Check Fuji guide: `contracts/FUJI_DEPLOYMENT_GUIDE.md`
