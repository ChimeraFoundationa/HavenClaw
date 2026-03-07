# 🚀 HavenClaw True One-Liner Installation

## Fully Automated - Single Command

**Install + Configure Wallet + Register Agent dalam SATU baris command!**

---

## ⚡ Quick Start

### Complete Installation (Copy-Paste Ready)

```bash
HAVENCLAW_PRIVATE_KEY=0xYourPrivateKeyHere HAVENCLAW_AGENT_NAME="My Bot" HAVENCLAW_CAPABILITIES="trading,analysis" AUTO_REGISTER=1 curl -fsSL https://havenclaw.ai/install.sh | bash
```

**That's it!** Satu command ini akan:
1. ✅ Install HavenClaw CLI
2. ✅ Setup wallet (encrypted)
3. ✅ Create configuration
4. ✅ Register agent on HavenVM
5. ✅ Everything configured automatically

---

## 📋 One-Liner Templates

### 1. Trading Bot

```bash
HAVENCLAW_PRIVATE_KEY=0xabc123... HAVENCLAW_AGENT_NAME="Trading Bot" HAVENCLAW_CAPABILITIES="trading,analysis,prediction" AUTO_REGISTER=1 curl -fsSL https://havenclaw.ai/install.sh | bash
```

### 2. Prediction Market Bot

```bash
HAVENCLAW_PRIVATE_KEY=0xabc123... HAVENCLAW_AGENT_NAME="Prediction Bot" HAVENCLAW_CAPABILITIES="prediction,analysis" AUTO_REGISTER=1 curl -fsSL https://havenclaw.ai/install.sh | bash
```

### 3. Multi-Purpose Agent

```bash
HAVENCLAW_PRIVATE_KEY=0xabc123... HAVENCLAW_AGENT_NAME="Assistant Bot" HAVENCLAW_CAPABILITIES="chat,analysis,automation" AUTO_REGISTER=1 curl -fsSL https://havenclaw.ai/install.sh | bash
```

### 4. Production Deployment (Mainnet)

```bash
HAVENCLAW_NETWORK=mainnet HAVENCLAW_RPC_URL=https://api.avax.network/ext/bc/C/rpc HAVENCLAW_PRIVATE_KEY=0xabc123... HAVENCLAW_AGENT_NAME="Production Agent" AUTO_REGISTER=1 curl -fsSL https://havenclaw.ai/install.sh | bash
```

### 5. CI/CD Pipeline

```bash
export HAVENCLAW_PRIVATE_KEY="${{ secrets.PRIVATE_KEY }}" && \
export HAVENCLAW_AGENT_NAME="CI Agent" && \
export HAVENCLAW_CAPABILITIES="testing,automation" && \
export AUTO_REGISTER=1 && \
export NO_PROMPT=1 && \
curl -fsSL https://havenclaw.ai/install.sh | bash
```

---

## ⚙️ All Environment Variables

| Variable | Required | Default | Example |
|----------|----------|---------|---------|
| `HAVENCLAW_PRIVATE_KEY` | ✅ For automation | - | `0x1234...` (0x + 64 hex) |
| `HAVENCLAW_AGENT_NAME` | ❌ | `My AI Agent` | `"Trading Bot"` |
| `HAVENCLAW_CAPABILITIES` | ❌ | - | `"trading,analysis"` |
| `AUTO_REGISTER` | ❌ | `0` | `1` (to auto-register) |
| `HAVENCLAW_NETWORK` | ❌ | `fuji` | `fuji`, `mainnet`, `local` |
| `HAVENCLAW_RPC_URL` | ❌ | Auto | `https://...` |
| `NO_PROMPT` | ❌ | `0` | `1` (no interactive prompts) |
| `INSTALL_METHOD` | ❌ | `npm` | `npm`, `git` |

---

## 🔧 Format Requirements

### Private Key
```
✅ Correct: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
❌ Wrong: 1234... (missing 0x)
❌ Wrong: 0x123 (too short)
❌ Wrong: 0x1234567890ABCDEF... (uppercase OK but must be 64 chars)
```

### Agent Name
```
✅ Any string: "My Bot", "Trading Bot Alpha", "Assistant"
```

### Capabilities
```
✅ Comma-separated: "trading,analysis,prediction"
✅ Single: "trading"
✅ Empty: (will register without capabilities)
```

---

## 📊 What Gets Created

```
~/.havenclaw/
├── config.json           # Network, agent name, preferences
├── .wallet.enc          # Encrypted private key
└── (optional) .wallet   # Fallback (base64)

~/.local/bin/
└── havenclaw            # CLI executable
```

---

## ✅ Verification Commands

After one-liner completes:

```bash
# Check version
havenclaw --version

# Check health
havenclaw doctor

# Check agent info
havenclaw agent info --address 0xYourAgentAddress

# Check balance
havenclaw wallet balance
```

---

## 🎯 Real Examples

### Example 1: Complete Setup

```bash
# Copy this entire line and paste in terminal:
HAVENCLAW_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef HAVENCLAW_AGENT_NAME="Alpha Trading Bot" HAVENCLAW_CAPABILITIES="trading,analysis,prediction" AUTO_REGISTER=1 curl -fsSL https://havenclaw.ai/install.sh | bash
```

**Output:**
```
🏛️ HavenClaw Installer
  Agent Coordination, One Command.

✓ Detected: linux
✓ Node.js ready (v24.13.0)
✓ Git ready (2.34.1)
✓ pnpm ready (10.23.0)

[1/4] Preparing environment
[2/4] Installing dependencies
[3/4] Installing HavenClaw
[4/5] Wallet configuration
✓ Private key provided - configuring wallet...
✓ Wallet configured securely
✓ Network: fuji
✓ Configuration created: /home/user/.havenclaw/config.json
[5/5] Finalizing setup
✓ HavenClaw installed successfully!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Configuration Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Network: fuji
  Config:  /home/user/.havenclaw/config.json
  Wallet:  ✓ Configured
  Agent:   Alpha Trading Bot
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Example 2: Minimal (Wallet Only)

```bash
HAVENCLAW_PRIVATE_KEY=0x1234... curl -fsSL https://havenclaw.ai/install.sh | bash
```

### Example 3: No Auto-Register

```bash
HAVENCLAW_PRIVATE_KEY=0x1234... HAVENCLAW_AGENT_NAME="My Bot" AUTO_REGISTER=0 curl -fsSL https://havenclaw.ai/install.sh | bash
```

Then register manually later:
```bash
havenclaw agent register --name "My Bot" --capabilities trading
```

---

## 🔐 Security Notes

### ✅ Safe Usage

```bash
# Environment variable (not visible in ps)
export HAVENCLAW_PRIVATE_KEY=0x...
curl -fsSL https://havenclaw.ai/install.sh | bash

# Or inline (visible in shell history but not ps)
HAVENCLAW_PRIVATE_KEY=0x... curl -fsSL https://havenclaw.ai/install.sh | bash
```

### ⚠️ Avoid

```bash
# Don't pass as argument to bash (visible in ps)
curl -fsSL https://havenclaw.ai/install.sh | bash -s -- --private-key 0x...
```

### Best Practices

1. **Use dedicated test wallet** for development
2. **Get test tokens** from https://faucet.avax.network/
3. **Don't commit** private keys to version control
4. **Use secrets manager** in production (GitHub Secrets, AWS Secrets Manager, etc.)

---

## 🛠️ Troubleshooting

### Error: "Invalid private key format"

```bash
# Make sure format is: 0x + 64 hexadecimal characters
# Example:
HAVENCLAW_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef \
curl -fsSL https://havenclaw.ai/install.sh | bash
```

### Error: "Agent registration failed"

```bash
# Wallet needs test tokens
# 1. Get your wallet address
havenclaw wallet balance

# 2. Get test AVAX from faucet
https://faucet.avax.network/

# 3. Retry registration
havenclaw agent register --name "My Bot" --capabilities trading
```

### Command Not Found

```bash
# Add to PATH
export PATH="$HOME/.local/bin:$PATH"

# Make permanent
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

---

## 📖 Next Steps After Installation

```bash
# 1. Verify installation
havenclaw --version
havenclaw doctor

# 2. Check agent status
havenclaw agent info --address 0x...

# 3. Get test tokens (if needed)
# Visit: https://faucet.avax.network/

# 4. Start using HavenClaw
havenclaw --help
havenclaw agent --help
havenclaw task --help
havenclaw dashboard
```

---

## 🎉 One Command Does Everything!

```bash
HAVENCLAW_PRIVATE_KEY=0xYourKey HAVENCLAW_AGENT_NAME="My Bot" HAVENCLAW_CAPABILITIES="trading" AUTO_REGISTER=1 curl -fsSL https://havenclaw.ai/install.sh | bash
```

**Install → Configure → Setup Wallet → Register Agent → DONE!** 🚀

---

For more details: https://docs.havenclaw.ai
