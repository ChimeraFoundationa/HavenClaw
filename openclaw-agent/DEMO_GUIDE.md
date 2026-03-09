# 🎯 HavenClaw Agent - End-to-End Demo Guide

This guide shows you how to run the complete HavenClaw Agent system with smart contract integration.

---

## 📋 Prerequisites

1. **Node.js 22+** and **pnpm 10+**
2. **Foundry** (for Anvil local blockchain)
3. **HavenClaw contracts** deployed

---

## 🚀 Quick Start

### Step 1: Start Local Blockchain

```bash
# Start Anvil (local blockchain)
anvil --port 8545 --mnemonic "test test test test test test test test test test test junk"
```

Keep this terminal open - Anvil needs to stay running.

### Step 2: Deploy Contracts

```bash
cd /root/soft/contracts

# Deploy to local Anvil
export RPC_URL="http://localhost:8545"
export DEPLOYER_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

forge script script/DeployHavenClaw.s.sol:DeployHavenClaw \
  --rpc-url $RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast
```

Save the contract addresses from the output!

### Step 3: Run End-to-End Demo

```bash
cd /root/soft/havenclaw-agent

# Run the demo script
node --loader tsx examples/demo-e2e.ts
```

### Step 4: Start Agent Daemon (Optional)

```bash
# Create configuration
pnpm havenclaw-agent init --name "Demo Agent"

# Edit config and add private key
nano agent-config.yaml

# Start the agent
pnpm havenclaw-agent start --config agent-config.yaml
```

---

## 📊 What the Demo Does

### 1. Initialize Contract Client
- Connects to local Anvil blockchain
- Loads deployed contract addresses
- Creates wallet from private key

### 2. Register Agent
- Checks if agent is already registered
- Registers agent with capabilities if not
- Displays agent information

### 3. Initialize Reputation & Stake
- Initializes reputation for the agent
- Stakes 1000 tokens for 1 day
- Shows reputation info

### 4. Create Task
- Creates a task in the marketplace
- Sets reward (100 tokens)
- Sets deadline (1 day)
- Displays task details

### 5. Create Governance Proposal
- Creates a new proposal
- Sets description and metadata
- Displays proposal details

### 6. Vote on Proposal
- Casts vote on active proposal
- Includes voting reason
- Displays vote details

### 7. Check Voting Power
- Shows agent's voting power
- Based on reputation + stake

---

## 🎨 Demo Output Example

```
============================================================
🚀 HavenClaw Agent - End-to-End Demo
============================================================

Loading contract addresses...
✓ Contract addresses loaded

Contract Addresses:
  Registry:         0x5FC8d32690cc91D4c39d9d3abcBD16989F87570C
  TaskMarketplace:  0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
  Governance:       0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
  Reputation:       0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

============================================================
📦 Step 1: Initialize Contract Client
============================================================

Agent Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
✓ Contract client initialized

============================================================
📝 Step 2: Check Agent Registration
============================================================

Agent registered: false
Registering agent...
✓ Agent registered! TX: 0x...

Agent Info:
  TBA Address:    0x70997970C51812dc3A010C7d01b50e0d17dc79C8
  NFT Token ID:   1
  Metadata URI:   ipfs://QmDemoAgent123
  Capabilities:   trading, analysis, governance

... (continues for all steps)

============================================================
✅ Demo Complete!
============================================================

Summary:
  ✓ Contract client initialized
  ✓ Agent registered (or already registered)
  ✓ Reputation initialized and tokens staked
  ✓ Task created in marketplace
  ✓ Governance proposal created
  ✓ Vote cast on proposal
  ✓ Voting power checked

The HavenClaw Agent system is fully functional!
```

---

## 🔧 Troubleshooting

### "Could not load deployment file"

Make sure you deployed the contracts first:
```bash
cd /root/soft/contracts
forge script script/DeployHavenClaw.s.sol:DeployHavenClaw \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

### "Connection refused"

Make sure Anvil is running:
```bash
anvil --port 8545
```

### "Insufficient funds"

The demo uses pre-funded Anvil accounts. If you're using different accounts, make sure they have ETH:
```bash
# Check balance
cast balance 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 --rpc-url http://localhost:8545
```

---

## 📚 Next Steps

After running the demo:

1. **Explore the contracts** on a block explorer (if using testnet)
2. **Modify the demo script** to test different scenarios
3. **Start the autonomous agent** to see AI-powered decision making
4. **Deploy to testnet** for real blockchain interaction

---

## 🎯 Key Files

| File | Purpose |
|------|---------|
| `examples/demo-e2e.ts` | Main demo script |
| `apps/agent-daemon/src/ContractActionExecutor.ts` | Contract execution bridge |
| `packages/contract-client/src/index.ts` | TypeScript contract clients |
| `contracts/script/DeployHavenClaw.s.sol` | Contract deployment script |

---

<div align="center">

**Happy Building! 🚀**

</div>
