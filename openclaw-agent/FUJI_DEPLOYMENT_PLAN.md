# 📋 HavenClaw Agent - Fuji Testnet Deployment Plan

**Date:** March 8, 2026
**Status:** 📋 Planning Phase
**Target Deployment:** Week 1-2

---

## 🎯 Deployment Objectives

### Primary Goals
1. ✅ Deploy all 4 smart contracts to Fuji testnet
2. ✅ Verify contracts on Snowtrace explorer
3. ✅ Test all core transactions on live testnet
4. ✅ Document deployment process
5. ✅ Create user onboarding guide

### Success Criteria
- [ ] All contracts deployed successfully
- [ ] All contracts verified on Snowtrace
- [ ] Test transactions successful (registration, task, proposal)
- [ ] Documentation published
- [ ] Community can participate

---

## 📦 Pre-Deployment Checklist

### 1. Environment Setup

#### Required Tools
```bash
# Install Foundry (if not already)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Verify installation
forge --version
cast --version
```

#### Required Accounts
```markdown
- [ ] Avalanche wallet (MetaMask or similar)
- [ ] Fuji testnet AVAX (from faucet)
- [ ] Snowtrace API key (for verification)
- [ ] GitHub account (for documentation)
```

### 2. Testnet AVAX Acquisition

#### Faucets
```markdown
Primary Faucet:
- URL: https://faucet.avax.network/
- Amount: 0.5 AVAX per request
- Cooldown: 24 hours

Secondary Faucet:
- URL: https://faucet.quicknode.com/avalanche/fuji
- Amount: 0.1 AVAX per request
- Cooldown: 24 hours

Discord Faucet:
- URL: https://discord.gg/avalanche
- Command: !faucet
- Amount: 0.5 AVAX
- Cooldown: 24 hours
```

#### Required Balance
```
Deployment Cost: ~0.02 AVAX
Testing Budget: 0.5 AVAX
Buffer: 0.5 AVAX
─────────────────────
Total Needed: ~1.02 AVAX

Recommendation: Get 2 AVAX (multiple faucets)
```

### 3. Contract Configuration

#### Update Deployment Script
```bash
# File: contracts/script/DeployHavenClaw.s.sol

# Current (Local):
votingDelay: 86400      // 86400 blocks for local testing
votingPeriod: 604800    // 604800 blocks

# Recommended for Testnet:
votingDelay: 7200       // 7200 blocks ≈ 1 day (at 12 sec/block)
votingPeriod: 50400     // 50400 blocks ≈ 7 days
```

#### Environment Variables
```bash
# Create .env file (DO NOT COMMIT)
export RPC_URL="https://api.avax-test.network/ext/bc/C/rpc"
export CHAIN_ID=43113
export DEPLOYER_PRIVATE_KEY="your_private_key_here"
export STAKING_TOKEN_ADDRESS="0x0000000000000000000000000000000000000000"  # Mock for now
export SNOWTRACE_API_KEY="your_snowtrace_api_key"
```

---

## 🚀 Deployment Steps

### Step 1: Network Configuration (15 min)

#### Add Fuji to MetaMask
```json
{
  "networkName": "Avalanche Fuji Testnet",
  "rpcUrl": "https://api.avax-test.network/ext/bc/C/rpc",
  "chainId": 43113,
  "currencySymbol": "AVAX",
  "blockExplorerUrl": "https://testnet.snowtrace.io"
}
```

#### Verify Connection
```bash
cast chain-id --rpc-url https://api.avax-test.network/ext/bc/C/rpc
# Expected output: 43113
```

### Step 2: Contract Deployment (30 min)

#### Deploy Command
```bash
cd /root/soft/contracts

# Set environment
source .env

# Deploy contracts
forge script script/DeployHavenClaw.s.sol:DeployHavenClaw \
  --rpc-url $RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $SNOWTRACE_API_KEY \
  --chain-id $CHAIN_ID
```

#### Expected Output
```
==========================
Chain 43113

Estimated gas price: 25 gwei
Estimated total gas used: 9,723,968
Estimated amount required: 0.24 AVAX
==========================

ONCHAIN EXECUTION COMPLETE & SUCCESSFUL.

Contracts Deployed:
  HavenClawRegistry:        0x...
  HavenClawReputation:      0x...
  HavenClawGovernance:      0x...
  HavenClawTaskMarketplace: 0x...
```

### Step 3: Contract Verification (15 min)

#### Automatic Verification
```bash
# Already included in deploy command with --verify flag

# If manual verification needed:
forge verify-contract \
  --chain-id 43113 \
  --num-of-optimizations 200 \
  --compiler-version v0.8.26 \
  0xContractAddress \
  src/core/HavenClawRegistry.sol:HavenClawRegistry \
  --etherscan-api-key $SNOWTRACE_API_KEY
```

#### Verify on Snowtrace
```
URL: https://testnet.snowtrace.io/

For each contract:
1. Search contract address
2. Click "Contract" tab
3. Click "Verify and Publish"
4. Submit source code
```

### Step 4: Post-Deployment Configuration (30 min)

#### Update Contract Client
```typescript
// File: packages/contract-client/src/index.ts

export const FUJI_CONTRACTS = {
  registry: '0x...',           // Replace with deployed address
  taskMarketplace: '0x...',    // Replace with deployed address
  governance: '0x...',         // Replace with deployed address
  reputation: '0x...',         // Replace with deployed address
};
```

#### Update Agent Daemon Config
```yaml
# File: apps/agent-daemon/agent-config.example.yaml

network:
  chainId: 43113
  rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc"
  explorerUrl: "https://testnet.snowtrace.io"

contracts:
  agentRegistry: "0x..."
  agentReputation: "0x..."
  havenGovernance: "0x..."
  taskMarketplace: "0x..."
```

### Step 5: Test Transactions (1 hour)

#### Test Script
```bash
cd /root/soft/havenclaw-agent

# Update test script with Fuji RPC
export RPC_URL="https://api.avax-test.network/ext/bc/C/rpc"
export DEPLOYER_PRIVATE_KEY="your_key"

# Run test suite
node test-nonce-managed.js
```

#### Required Tests
```markdown
- [ ] Agent Registration
- [ ] Reputation Initialization
- [ ] Task Creation (with testnet AVAX)
- [ ] Task Acceptance
- [ ] Task Completion
- [ ] Proposal Creation
- [ ] Voting Power Query
```

---

## 📊 Risk Management

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Deployment fails | Low | High | Test on local first ✅ Done |
| Verification fails | Medium | Medium | Manual verification backup |
| Insufficient AVAX | Low | Low | Get from multiple faucets |
| Network congestion | Medium | Low | Retry with higher gas |

### Security Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Private key exposure | Medium | Critical | Use .env, never commit |
| Wrong contract addresses | Low | High | Double-check all addresses |
| Testnet/mainnet confusion | Medium | High | Clear documentation, different colors |

---

## 📝 Documentation Deliverables

### 1. Deployment Guide
```markdown
File: docs/DEPLOYMENT_GUIDE.md

Contents:
- Prerequisites
- Step-by-step deployment
- Verification process
- Troubleshooting
- FAQ
```

### 2. User Guide
```markdown
File: docs/USER_GUIDE.md

Contents:
- Getting testnet AVAX
- Setting up wallet
- Registering agent
- Creating tasks
- Voting on proposals
- Common issues
```

### 3. Developer Guide
```markdown
File: docs/DEVELOPER_GUIDE.md

Contents:
- Contract architecture
- API reference
- Integration examples
- Testing guide
- Contributing
```

### 4. Announcement Template
```markdown
File: docs/ANNOUNCEMENT.md

Contents:
- Project overview
- Testnet details
- How to participate
- Rewards/incentives
- Social media links
```

---

## 🎯 Timeline

### Day 1: Preparation
```
09:00 - 10:00  Setup environment
10:00 - 11:00  Get testnet AVAX
11:00 - 12:00  Configure contracts
13:00 - 15:00  Update documentation
15:00 - 17:00  Final review
```

### Day 2: Deployment
```
09:00 - 10:00  Deploy contracts
10:00 - 11:00  Verify contracts
11:00 - 12:00  Test transactions
13:00 - 15:00  Fix any issues
15:00 - 17:00  Publish documentation
```

### Day 3-14: Testnet Period
```
Daily:
- Monitor transactions
- Respond to issues
- Gather feedback
- Iterate on fixes
```

---

## 🔧 Troubleshooting Guide

### Common Issues

#### Issue 1: "Insufficient funds"
```bash
# Solution: Get more testnet AVAX
# Visit: https://faucet.avax.network/
```

#### Issue 2: "Contract not verified"
```bash
# Solution: Manual verification
forge verify-contract \
  --chain-id 43113 \
  0xContractAddress \
  ContractName \
  --etherscan-api-key $SNOWTRACE_API_KEY
```

#### Issue 3: "Nonce too low"
```bash
# Solution: Wait for previous transaction to confirm
# Or increase gas price
```

#### Issue 4: "Voting not active"
```bash
# Solution: Wait for votingDelay blocks
# For testnet: ~7200 blocks ≈ 1 day
```

---

## 📊 Success Metrics

### Deployment Metrics
| Metric | Target | Status |
|--------|--------|--------|
| Contracts Deployed | 4/4 | ⏳ Pending |
| Contracts Verified | 4/4 | ⏳ Pending |
| Gas Used | < 10M | ⏳ Pending |
| Deployment Cost | < 0.3 AVAX | ⏳ Pending |

### Testing Metrics
| Metric | Target | Status |
|--------|--------|--------|
| Test Pass Rate | 100% | ⏳ Pending |
| Transactions Tested | 20+ | ⏳ Pending |
| Issues Found | < 5 | ⏳ Pending |
| Documentation | Complete | ⏳ Pending |

---

## 🎉 Post-Deployment

### Immediate Actions
```markdown
- [ ] Announce on Twitter
- [ ] Post on Discord
- [ ] Update README with testnet addresses
- [ ] Create testnet dashboard
- [ ] Monitor for 24 hours
```

### Week 1 Actions
```markdown
- [ ] Gather user feedback
- [ ] Fix critical bugs
- [ ] Write Medium article
- [ ] Host AMA session
- [ ] Recruit beta testers
```

### Week 2 Actions
```markdown
- [ ] Analyze usage metrics
- [ ] Prepare audit materials
- [ ] Plan mainnet deployment
- [ ] Create migration guide
- [ ] Celebrate! 🎉
```

---

## 📞 Support & Resources

### Official Resources
- Avalanche Docs: https://docs.avax.network/
- Foundry Book: https://book.getfoundry.sh/
- Snowtrace: https://testnet.snowtrace.io/

### Community Support
- Avalanche Discord: https://discord.gg/avalanche
- Foundry Discord: https://discord.gg/foundry
- GitHub Issues: [Project Repo]

### Emergency Contacts
```
Technical Lead: [Name] - [Contact]
Community Manager: [Name] - [Contact]
Security Lead: [Name] - [Contact]
```

---

<div align="center">

# 🚀 Ready for Deployment

**Status:** 📋 Planning Complete

**Next:** Execute Deployment Plan

**Timeline:** Week 1-2

---

*This plan will be executed after final review and approval*

</div>
