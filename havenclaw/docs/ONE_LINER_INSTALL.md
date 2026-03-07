# HavenClaw One-Liner Installation Guide

## 🚀 Fully Automated Installation

HavenClaw supports **complete one-line installation** with wallet setup and agent registration.

---

## Quick Start

### Option 1: All-in-One Command (Recommended)

```bash
HAVENCLAW_PRIVATE_KEY=0xYourPrivateKey HAVENCLAW_AGENT_NAME="My Bot" HAVENCLAW_CAPABILITIES="trading,analysis" AUTO_REGISTER=1 curl -fsSL https://havenclaw.ai/install.sh | bash
```

This single command will:
1. ✅ Install HavenClaw CLI
2. ✅ Configure wallet securely
3. ✅ Create configuration file
4. ✅ Register your agent on HavenVM
5. ✅ Setup PATH and permissions

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HAVENCLAW_PRIVATE_KEY` | ✅ For auto-setup | - | Your wallet private key (0x + 64 hex chars) |
| `HAVENCLAW_NETWORK` | ❌ | `fuji` | Network: `fuji`, `mainnet`, or `local` |
| `HAVENCLAW_RPC_URL` | ❌ | Auto | Custom RPC endpoint |
| `HAVENCLAW_AGENT_NAME` | ❌ | `My AI Agent` | Name for your agent |
| `HAVENCLAW_CAPABILITIES` | ❌ | - | Comma-separated capabilities |
| `AUTO_REGISTER` | ❌ | `0` | Set to `1` to auto-register agent |
| `NO_PROMPT` | ❌ | `0` | Set to `1` for non-interactive |

---

## Installation Examples

### 1. Basic Install (Wallet Setup Later)

```bash
curl -fsSL https://havenclaw.ai/install.sh | bash
```

### 2. Install with Wallet Configuration

```bash
HAVENCLAW_PRIVATE_KEY=0x1234...5678 curl -fsSL https://havenclaw.ai/install.sh | bash
```

### 3. Install + Wallet + Agent Registration

```bash
HAVENCLAW_PRIVATE_KEY=0x1234...5678 \
HAVENCLAW_AGENT_NAME="Trading Bot" \
HAVENCLAW_CAPABILITIES="trading,analysis,prediction" \
AUTO_REGISTER=1 \
curl -fsSL https://havenclaw.ai/install.sh | bash
```

### 4. Production Deployment (Custom Network)

```bash
HAVENCLAW_PRIVATE_KEY=0x1234...5678 \
HAVENCLAW_NETWORK=mainnet \
HAVENCLAW_RPC_URL=https://api.avax.network/ext/bc/C/rpc \
HAVENCLAW_AGENT_NAME="Production Agent" \
AUTO_REGISTER=1 \
curl -fsSL https://havenclaw.ai/install.sh | bash
```

### 5. CI/CD Pipeline

```bash
export HAVENCLAW_PRIVATE_KEY="${{ secrets.PRIVATE_KEY }}"
export HAVENCLAW_AGENT_NAME="CI Agent"
export AUTO_REGISTER=1
export NO_PROMPT=1

curl -fsSL https://havenclaw.ai/install.sh | bash
```

### 6. Development Setup

```bash
HAVENCLAW_NETWORK=fuji \
HAVENCLAW_AGENT_NAME="Dev Bot" \
curl -fsSL https://havenclaw.ai/install.sh | bash
```

---

## Security Considerations

### ✅ Best Practices

1. **Use environment variables** instead of command line arguments
   ```bash
   # Good - not visible in process list
   export HAVENCLAW_PRIVATE_KEY=0x...
   curl ... | bash
   
   # Avoid - visible in ps
   curl ... | HAVENCLAW_PRIVATE_KEY=0x... bash
   ```

2. **Use dedicated wallet** for testing
   - Don't use main wallet with significant funds
   - Get test tokens from: https://faucet.avax.network/

3. **Secure your shell**
   - Ensure `~/.bashrc` and `~/.zshrc` have proper permissions
   - Don't commit private keys to version control

4. **Use secrets management** in production
   - GitHub Secrets
   - AWS Secrets Manager
   - HashiCorp Vault

### ⚠️ Warnings

- Private key in command line is visible in `ps` output
- Installer logs don't include private keys (validated)
- Wallet file is stored encrypted with permissions `600`

---

## What Gets Installed

### Files Created

```
~/.havenclaw/
├── config.json           # Configuration
├── .wallet.enc          # Encrypted private key (if provided)
└── .wallet              # Fallback (base64 encoded)

~/.local/bin/
└── havenclaw            # CLI wrapper
```

### Configuration File

```json
{
  "network": "fuji",
  "agentName": "My AI Agent",
  "installDaemon": false,
  "rpcUrl": "",
  "preferences": {
    "autoApprove": false,
    "notifications": true
  }
}
```

---

## Post-Installation

### Verify Installation

```bash
# Check version
havenclaw --version

# Check health
havenclaw doctor

# Check wallet status
havenclaw wallet balance
```

### If Auto-Register Failed

```bash
# Manual registration
havenclaw agent register \
  --name "My Bot" \
  --capabilities trading,analysis
```

### Get Test Tokens

```bash
# Visit Fuji Faucet
https://faucet.avax.network/

# Enter your wallet address
```

---

## Troubleshooting

### Error: "Invalid private key format"

```bash
# Ensure format: 0x + 64 hexadecimal characters
# Correct: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
# Wrong: 1234... (missing 0x)
# Wrong: 0x123 (too short)
```

### Error: "Agent registration failed"

```bash
# Check wallet has test tokens
havenclaw wallet balance

# Get tokens from faucet
https://faucet.avax.network/

# Retry registration
havenclaw agent register --name "My Bot"
```

### Command Not Found After Install

```bash
# Add to PATH
export PATH="$HOME/.local/bin:$PATH"

# Add to shell config permanently
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

---

## Advanced Usage

### Multiple Agents

```bash
# Install once
curl -fsSL https://havenclaw.ai/install.sh | bash

# Register multiple agents
havenclaw agent register --name "Bot 1" --capabilities trading
havenclaw agent register --name "Bot 2" --capabilities analysis
havenclaw agent register --name "Bot 3" --capabilities prediction
```

### Custom RPC Endpoint

```bash
HAVENCLAW_RPC_URL=https://your-custom-rpc.com \
curl -fsSL https://havenclaw.ai/install.sh | bash
```

### Mainnet Deployment

```bash
HAVENCLAW_NETWORK=mainnet \
HAVENCLAW_RPC_URL=https://api.avax.network/ext/bc/C/rpc \
HAVENCLAW_PRIVATE_KEY=0x... \
HAVENCLAW_AGENT_NAME="Mainnet Agent" \
AUTO_REGISTER=1 \
curl -fsSL https://havenclaw.ai/install.sh | bash
```

---

## Complete Example

```bash
#!/bin/bash
# Complete HavenClaw setup script

# Configuration
export HAVENCLAW_PRIVATE_KEY="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
export HAVENCLAW_AGENT_NAME="Trading Bot Alpha"
export HAVENCLAW_CAPABILITIES="trading,analysis,prediction"
export HAVENCLAW_NETWORK="fuji"
export AUTO_REGISTER=1

# Install
echo "Installing HavenClaw..."
curl -fsSL https://havenclaw.ai/install.sh | bash

# Verify
echo "Verifying installation..."
havenclaw --version
havenclaw doctor

# Check balance
echo "Checking balance..."
havenclaw wallet balance

echo "Setup complete!"
```

---

## Support

- **Documentation**: https://docs.havenclaw.ai
- **GitHub Issues**: https://github.com/ava-labs/havenclaw/issues
- **Discord**: https://discord.gg/havenclaw

---

**One command to rule them all!** 🏛️🦞
