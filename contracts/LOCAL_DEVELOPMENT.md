# 🧪 OpenClaw Contracts - Local Development Guide

**Using Foundry Anvil for Local Testing**

---

## 🚀 Quick Start

### 1. Start Anvil (Local Blockchain)

```bash
# Start anvil in background
anvil --port 8545 --mnemonic "test test test test test test test test test test test junk"
```

**Default Configuration:**
- RPC URL: `http://localhost:8545`
- Chain ID: `31337`
- Accounts: 10 pre-funded accounts (10,000 ETH each)
- Block time: Instant (auto-mine)

### 2. Deploy Contracts

```bash
# Run deployment script
./scripts/deploy-local.sh

# Or manually:
export RPC_URL="http://localhost:8545"
export DEPLOYER_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

forge script script/DeployOpenClaw.s.sol:DeployOpenClaw \
  --rpc-url $RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast
```

### 3. Run Tests

```bash
# Run all tests
forge test

# Run with gas report
forge test --gas-report

# Run specific test
forge test --match-path test/OpenClawRegistry.t.sol

# Run with logs
forge test -vvv
```

---

## 📋 Pre-funded Accounts

Anvil provides 10 pre-funded accounts:

| # | Address | Private Key |
|---|---------|-------------|
| 1 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| 2 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| 3 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |

Use account #1 as deployer by default.

---

## 🔧 Interactive Testing with cast

### Check Contract State

```bash
# Get agent count
cast call $REGISTRY_ADDRESS \
  "getAgentCount()(uint256)" \
  --rpc-url http://localhost:8545

# Get agent info
cast call $REGISTRY_ADDRESS \
  "getAgent(address)(tuple)" \
  0x70997970C51812dc3A010C7d01b50e0d17dc79C8 \
  --rpc-url http://localhost:8545
```

### Send Transactions

```bash
# Register an agent
cast send $REGISTRY_ADDRESS \
  "registerAgent(address,uint256,string,bytes32[])" \
  0x70997970C51812dc3A010C7d01b50e0d17dc79C8 \
  1 \
  "ipfs://QmTest" \
  '["0x74726164696e6700000000000000000000000000000000000000000000000000"]' \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

---

## 🧪 Testing Workflows

### Workflow 1: Register Agent

```bash
# 1. Deploy contracts
./scripts/deploy-local.sh

# 2. Get contract addresses from output
REGISTRY_ADDRESS="0x..."

# 3. Register agent
cast send $REGISTRY_ADDRESS \
  "registerAgent(address,uint256,string,bytes32[])" \
  <TBA_ADDRESS> \
  1 \
  "ipfs://QmAgent1" \
  '["0x74726164696e6700000000000000000000000000000000000000000000000000"]' \
  --rpc-url http://localhost:8545 \
  --private-key <PRIVATE_KEY>
```

### Workflow 2: Create and Complete Task

```bash
MARKETPLACE_ADDRESS="0x..."

# Create task (with ERC20 token)
cast send $MARKETPLACE_ADDRESS \
  "createTask(string,bytes32,uint256,address,uint256)" \
  "Analyze market trends" \
  "0x74726164696e6700000000000000000000000000000000000000000000000000" \
  100000000000000000000 \
  $TOKEN_ADDRESS \
  $(($(cast block --rpc-url http://localhost:8545 number) + 100000)) \
  --rpc-url http://localhost:8545 \
  --private-key <PRIVATE_KEY>
```

### Workflow 3: Governance Vote

```bash
GOVERNANCE_ADDRESS="0x..."

# Create proposal
cast send $GOVERNANCE_ADDRESS \
  "createProposal(string,string,bytes32[])" \
  "Increase rewards" \
  "ipfs://QmProposal1" \
  '[]' \
  --rpc-url http://localhost:8545 \
  --private-key <PRIVATE_KEY>

# Wait for voting period, then vote
cast send $GOVERNANCE_ADDRESS \
  "castVote(uint256,uint8,string)" \
  1 \
  1 \
  "I support this" \
  --rpc-url http://localhost:8545 \
  --private-key <PRIVATE_KEY>
```

---

## 📊 Fork Testing

Test against real Avalanche Fuji or Mainnet:

```bash
# Fork Fuji testnet
anvil --fork-url https://api.avax-test.network/ext/bc/C/rpc

# Fork mainnet
anvil --fork-url https://api.avax.network/ext/bc/C/rpc

# Then deploy and test
forge script script/DeployOpenClaw.s.sol:DeployOpenClaw \
  --rpc-url http://localhost:8545 \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast
```

---

## 🐛 Debugging

### Enable Logging

```bash
# Run tests with full logs
forge test -vvvv

# Run specific test with logs
forge test --match-test testFullWorkflow -vvvv
```

### Console Logging

Add console logs to your tests:

```solidity
import {console} from "forge-std/Test.sol";

function testSomething() public {
    console.log("Current state:", someValue);
    console.logAddress(contractAddress);
}
```

### Gas Reports

```bash
# Get detailed gas report
forge test --gas-report

# Match specific contract
forge test --match-contract OpenClawRegistry --gas-report
```

---

## 🔄 Reset Local Chain

```bash
# Stop anvil
pkill anvil

# Clear cache
rm -rf cache broadcast

# Restart fresh
anvil --port 8545
```

---

## 📝 Common Commands

```bash
# Get block number
cast block-number --rpc-url http://localhost:8545

# Get balance
cast balance 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  --rpc-url http://localhost:8545

# Get nonce
cast nonce 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  --rpc-url http://localhost:8545

# Decode calldata
cast calldata "registerAgent(address,uint256,string,bytes32[])"

# Get code at address
cast code $CONTRACT_ADDRESS --rpc-url http://localhost:8545
```

---

## 🎯 Integration with OpenClaw Agent

### TypeScript Example

```typescript
import { ethers } from 'ethers';
import { OpenClawRegistry__factory } from './types';

// Connect to local anvil
const provider = new ethers.JsonRpcProvider('http://localhost:8545');
const signer = new ethers.Wallet(
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  provider
);

// Connect to deployed contract
const registry = OpenClawRegistry__factory.connect(
  REGISTRY_ADDRESS,
  signer
);

// Register agent
const capabilities = [ethers.id('trading')];
await registry.registerAgent(
  agentTbaAddress,
  1,
  'ipfs://QmAgent1',
  capabilities
);

console.log('Agent registered!');
```

---

## 📚 Additional Resources

- [Foundry Book](https://book.getfoundry.sh/)
- [Anvil Documentation](https://book.getfoundry.sh/anvil/)
- [Cast Documentation](https://book.getfoundry.sh/cast/)
- [Forge Documentation](https://book.getfoundry.sh/forge/)

---

<div align="center">

**Happy Testing! 🧪**

</div>
