# 🚀 HavenClaw One-Liner - Format Baru!

## TRUE One-Liner dengan Command-Line Arguments

**Sekarang bisa install dengan arguments yang lebih clean!**

---

## ⚡ Format Baru (RECOMMENDED)

```bash
curl -fsSL https://havenclaw.ai/install.sh | bash -s -- --private-key 0xYourKey --agent-name "My Bot" --capabilities trading,analysis --auto-register
```

### Kenapa Lebih Baik?

✅ **Lebih readable** - Setiap parameter jelas  
✅ **Lebih clean** - Tidak ada environment variables di depan  
✅ **Lebih mudah** - Tinggal copy-paste dan ganti nilai  
✅ **Support quotes** - Agent name dengan spasi: `"Trading Bot Alpha"`  

---

## 📋 Template Copy-Paste

### 1. Trading Bot

```bash
curl -fsSL https://havenclaw.ai/install.sh | bash -s -- --private-key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef --agent-name "Alpha Trading Bot" --capabilities trading,analysis,prediction --auto-register
```

### 2. Prediction Market Bot

```bash
curl -fsSL https://havenclaw.ai/install.sh | bash -s -- --private-key 0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890 --agent-name "Prediction Master" --capabilities prediction --auto-register
```

### 3. Production (Mainnet)

```bash
curl -fsSL https://havenclaw.ai/install.sh | bash -s -- --private-key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef --agent-name "Production Agent" --network mainnet --auto-register
```

### 4. Dengan Custom RPC

```bash
curl -fsSL https://havenclaw.ai/install.sh | bash -s -- --private-key 0x1234... --agent-name "Custom Bot" --rpc-url https://your-rpc.com --auto-register
```

---

## 🛠️ Arguments Reference

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `--private-key KEY` | ✅ | - | Wallet private key (0x + 64 hex) |
| `--agent-name NAME` | ❌ | `My AI Agent` | Agent/bot name |
| `--capabilities CAPS` | ❌ | - | Comma-separated capabilities |
| `--network NET` | ❌ | `fuji` | Network: `fuji`, `mainnet`, `local` |
| `--rpc-url URL` | ❌ | Auto | Custom RPC endpoint |
| `--auto-register` | ❌ | No | Auto-register agent |
| `--no-prompt` | ❌ | No | Non-interactive mode |
| `--help, -h` | ❌ | - | Show help |

---

## 🎯 Cara Menggunakan

### Step 1: Copy Template

Copy salah satu template di atas

### Step 2: Ganti Nilai

- `0x1234...` → Private key Anda
- `"My Bot"` → Nama bot Anda
- `trading,analysis` → Kemampuan bot

### Step 3: Paste & Run

Paste di terminal dan tekan Enter

### Step 4: DONE! ✅

Semua otomatis:
- ✅ Install HavenClaw
- ✅ Setup wallet (encrypted)
- ✅ Create config
- ✅ Register agent

---

## 📊 Perbandingan Format

### ❌ Format Lama (Environment Variables)

```bash
HAVENCLAW_PRIVATE_KEY=0x... HAVENCLAW_AGENT_NAME="Bot" AUTO_REGISTER=1 curl ... | bash
```

**Masalah:**
- Sulit dibaca
- Environment variables di depan
- Quotes sulit handle
- Tidak konsisten

### ✅ Format Baru (Arguments)

```bash
curl ... | bash -s -- --private-key 0x... --agent-name "Bot" --auto-register
```

**Keuntungan:**
- ✅ Clean dan readable
- ✅ Arguments yang jelas
- ✅ Quotes support
- ✅ Standard unix format

---

## 🔐 Security Notes

### ✅ Safe Usage

```bash
# Arguments (visible in shell history but not in ps)
curl -fsSL https://havenclaw.ai/install.sh | bash -s -- --private-key 0x... --agent-name "Bot" --auto-register
```

### ⚠️ Best Practices

1. **Use dedicated test wallet** untuk development
2. **Get test tokens** dari https://faucet.avax.network/
3. **Jangan commit** private key ke git
4. **Use secrets manager** untuk production

---

## 🎬 Real Example

### Full Command (Copy-Paste Ready)

```bash
curl -fsSL https://havenclaw.ai/install.sh | bash -s -- --private-key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef --agent-name "My First Bot" --capabilities trading,analysis --auto-register
```

### Output

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
  Agent:   My First Bot
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🆘 Troubleshooting

### Error: "Invalid private key format"

```bash
# Pastikan format: 0x + 64 hexadecimal characters
curl ... | bash -s -- --private-key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef --agent-name "Bot" --auto-register
```

### Error: "Agent registration failed"

```bash
# Wallet butuh test tokens
# 1. Install dulu (tanpa auto-register)
curl ... | bash -s -- --private-key 0x... --agent-name "Bot"

# 2. Get test tokens dari faucet
https://faucet.avax.network/

# 3. Register manual
havenclaw agent register --name "Bot" --capabilities trading
```

---

## 📖 More Info

- **Help**: `curl ... | bash -s -- --help`
- **Docs**: https://docs.havenclaw.ai
- **GitHub**: https://github.com/ava-labs/havenclaw

---

**One line is all you need!** 🚀🏛️🦞
