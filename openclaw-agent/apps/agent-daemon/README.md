# 🤖 HavenClaw Agent Daemon

**Autonomous AI Agent for HAVEN Protocol**

---

## Quick Start

### 1. Initialize Configuration

```bash
# Create config file
pnpm havenclaw-agent init --name "My Trading Bot"

# Edit the config and add your private key
nano agent-config.yaml
```

### 2. Create Agent Identity

```bash
# Create identity with capabilities
pnpm havenclaw-agent create-identity \
  --config agent-config.yaml \
  --name "Trading Bot" \
  --capabilities trading,analysis,prediction \
  --stake 1000
```

### 3. Start Agent

```bash
# Start the daemon
pnpm havenclaw-agent start --config agent-config.yaml
```

---

## CLI Commands

### `init` - Create Configuration

```bash
# Create default config
havenclaw-agent init --name "My Agent"

# Specify output path
havenclaw-agent init --output my-config.yaml
```

### `create-identity` - Create Agent Identity

```bash
# Basic identity
havenclaw-agent create-identity \
  --config agent-config.yaml \
  --name "Trading Bot" \
  --capabilities trading,analysis

# With staking
havenclaw-agent create-identity \
  --config agent-config.yaml \
  --name "Governance Bot" \
  --capabilities governance,voting \
  --stake 5000 \
  --lock-period 604800
```

### `start` - Start Agent Daemon

```bash
# From config file
havenclaw-agent start --config agent-config.yaml

# From environment variables
export OPERATOR_PRIVATE_KEY="0x..."
export RPC_URL="https://..."
havenclaw-agent start --env
```

### `status` - Show Agent Status

```bash
havenclaw-agent status --config agent-config.yaml
```

---

## Configuration Options

### Required Fields

```yaml
agentId: "my-agent"           # Unique agent identifier
operatorPrivateKey: "0x..."   # Private key (KEEP SECRET!)

network:
  chainId: 43113              # Fuji testnet
  rpcUrl: "https://..."       # RPC endpoint
```

### Decision Engine

```yaml
decision:
  autoVote: false             # Auto-vote on proposals
  autoAcceptTasks: false      # Auto-accept tasks
  minTaskReward: "1000000000000000000"  # 1 HAVEN minimum
  
  votingRules:
    trustedProposers: []      # Always vote FOR these addresses
```

### Transaction Settings

```yaml
transactions:
  maxFeePerGas: "50000000000"      # 50 gwei max
  gasPriceBufferPercent: 20        # 20% buffer
  confirmationsRequired: 1         # Wait for 1 confirmation
```

---

## Environment Variables

```bash
# Required
export OPERATOR_PRIVATE_KEY="0x..."

# Optional
export AGENT_ID="my-agent"
export CHAIN_ID="43113"
export RPC_URL="https://api.avax-test.network/ext/bc/C/rpc"
export LOG_LEVEL="info"
export LOG_FORMAT="text"

# Contract addresses (defaults to Fuji)
export ERC8004_REGISTRY="0x..."
export AGENT_REGISTRY="0x..."
# ... etc
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Agent Daemon                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  CLI (commander)                                        │
│  ├── init                                               │
│  ├── create-identity                                    │
│  ├── start                                              │
│  └── status                                             │
│                                                          │
│  HavenClawDaemon (orchestrator)                          │
│  ├── IdentityManager                                    │
│  ├── DecisionEngine                                     │
│  ├── TransactionSubmitter                               │
│  └── Event Listeners                                    │
│                                                          │
│  Packages                                                │
│  ├── @havenclaw/runtime                                  │
│  ├── @havenclaw/haven-interface                          │
│  ├── @havenclaw/transaction                              │
│  ├── @havenclaw/identity                                 │
│  └── @havenclaw/decision                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Security Best Practices

### 🔐 Private Key Management

```bash
# ❌ DON'T: Commit private keys to git
git add agent-config.yaml

# ✅ DO: Use environment variables
export OPERATOR_PRIVATE_KEY="0x..."
havenclaw-agent start --env

# ✅ DO: Use .env file (add to .gitignore)
echo "OPERATOR_PRIVATE_KEY=0x..." >> .env
```

### 🛡️ Transaction Limits

```yaml
transactions:
  maxFeePerGas: "50000000000"  # Limit gas price
  confirmationsRequired: 1     # Wait for confirmation
```

### 📝 Logging

```yaml
logging:
  level: "info"      # Don't log debug in production
  format: "json"     # Use JSON for log aggregation
  file: "agent.log"  # Log to file for auditing
```

---

## Troubleshooting

### "Failed to connect to RPC"

```bash
# Check RPC endpoint
curl -X POST \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  https://api.avax-test.network/ext/bc/C/rpc
```

### "Insufficient funds for gas"

```bash
# Check balance
cast balance <ADDRESS> --rpc-url <RPC_URL>

# Get test AVAX from faucet
# https://faucet.avax.network/
```

### "Nonce too low"

```bash
# Restart daemon to reset nonce
havenclaw-agent stop
havenclaw-agent start
```

---

## Development

```bash
# Build
pnpm build

# Run in development mode
pnpm dev

# Run with config
pnpm dev -- --config ../agent-config.yaml
```

---

## License

MIT
