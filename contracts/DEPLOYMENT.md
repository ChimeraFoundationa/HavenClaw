# HAVEN Contracts Deployment Guide

## Prerequisites

1. Install Foundry:
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

2. Install dependencies:
```bash
forge install OpenZeppelin/openzeppelin-contracts --no-git
forge install foundry-rs/forge-std --no-git
```

3. Set environment variables:
```bash
export PRIVATE_KEY=your_private_key
export SNOWTRACE_API_KEY=your_snowtrace_api_key
```

## Deploy to Fuji Testnet

```bash
# Build contracts
forge build

# Run tests
forge test

# Deploy to Fuji
forge script script/DeployHaven.s.sol \
  --rpc-url https://api.avax-test.network/ext/bc/C/rpc \
  --broadcast \
  --verify \
  --etherscan-api-key $SNOWTRACE_API_KEY
```

## Deploy to Local Network

```bash
# Start local node (with Avalanche CLI)
avalanche network start

# Deploy
forge script script/DeployHaven.s.sol \
  --rpc-url http://localhost:9650/ext/bc/C/rpc \
  --broadcast
```

## Get Test AVAX

Before deploying, get test AVAX from:
- https://faucet.avax.network/
- https://core.app/tools/testnet-faucet/?subnet=avalanche

## Verify Deployment

After deployment, the script will output:
- HAVEN Token address
- AgentRegistry address
- TaskMarketplace address
- Deployer address

Save these addresses for CLI configuration!

## Post-Deployment

1. Update HavenClaw CLI config with new addresses
2. Test agent registration
3. Test task creation
4. Verify contracts on Snowtrace
