# HavenClaw Wallet Setup Guide

## 🔐 Wallet Configuration Methods

HavenClaw supports multiple ways to configure your wallet for interacting with HavenVM.

---

## Method 1: Interactive Setup (Recommended for New Users)

```bash
# After installation
havenclaw wallet setup
```

This will guide you through:
1. Choosing wallet setup method
2. Entering private key or importing keystore
3. Optional encryption
4. Verification

**Pros:**
- ✅ User-friendly wizard
- ✅ Built-in validation
- ✅ Optional encryption

**Cons:**
- ⚠️ Requires interactive terminal

---

## Method 2: Environment Variable (Recommended for Production)

### Temporary (Current Session)

```bash
export HAVENCLAW_PRIVATE_KEY=0xYourPrivateKeyHere
havenclaw agent register --name "My Bot"
```

### Permanent (Add to Shell Config)

```bash
# Add to ~/.bashrc or ~/.zshrc
echo 'export HAVENCLAW_PRIVATE_KEY=0xYourPrivateKeyHere' >> ~/.bashrc
source ~/.bashrc
```

**Pros:**
- ✅ Works with all commands
- ✅ No file storage
- ✅ CI/CD friendly

**Cons:**
- ⚠️ Visible in process list
- ⚠️ Must secure shell config

---

## Method 3: Wallet File (Development Only)

```bash
havenclaw wallet setup
# Choose option 1 and store private key
```

This creates: `~/.havenclaw/.wallet`

**Security:**
- File permissions: `600` (owner read/write only)
- ⚠️ Not encrypted by default
- ⚠️ Not recommended for production

---

## Method 4: Encrypted Wallet File

```bash
havenclaw wallet setup
# Choose option 1 and select encryption
```

This creates: `~/.havenclaw/.wallet.enc`

**Security:**
- ✅ Password protected
- ✅ Base64 encoded
- ✅ File permissions: `600`

**Usage:**
```bash
# Decrypt when needed
openssl enc -aes-256-cbc -pbkdf2 -d -in ~/.havenclaw/.wallet.enc -pass pass:your_password
export HAVENCLAW_PRIVATE_KEY=$(decrypted_key)
```

---

## Method 5: Keystore File (Advanced)

```bash
havenclaw wallet setup
# Choose option 2: Import from keystore
```

This imports:
- `~/.havenclaw/keystore.json`
- `~/.havenclaw/.keystore_pass`

**Compatible with:**
- MetaMask keystore files
- geth keystore format
- Ethereum JSON keystore

---

## Security Best Practices

### ✅ DO:

1. **Use dedicated wallet** for HavenClaw operations
2. **Use testnet tokens** for development (Fuji testnet)
3. **Encrypt sensitive files** with strong passwords
4. **Set proper file permissions** (`chmod 600`)
5. **Use environment variables** in production
6. **Backup your private keys** securely
7. **Use hardware wallets** for large amounts

### ❌ DON'T:

1. **Never share your private key** with anyone
2. **Don't use mainnet wallet** for testing
3. **Don't commit private keys** to version control
4. **Don't store unencrypted** in production
5. **Don't use weak passwords** for encryption
6. **Don't log private keys** in plain text

---

## Getting Test Tokens

### Fuji Testnet Faucet

```bash
# Get your wallet address first
havenclaw wallet balance

# Visit faucet
https://faucet.avax.network/

# Enter your address and request AVAX
```

### Alternative Faucets

- https://faucets.chain.link/avalanche
- https://www.alchemy.com/faucets/avalanche-fuji

---

## Verification

After setup, verify your wallet:

```bash
# Check wallet status
havenclaw doctor

# Check balance (if configured)
havenclaw wallet balance

# Try a read-only operation
havenclaw agent list
```

---

## Troubleshooting

### Error: "Private key not found"

```bash
# Check if wallet file exists
ls -la ~/.havenclaw/.wallet*

# Set environment variable
export HAVENCLAW_PRIVATE_KEY=your_key

# Or re-run setup
havenclaw wallet setup
```

### Error: "Invalid private key format"

```bash
# Ensure format is: 0x followed by 64 hex characters
# Example: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Check for extra spaces or characters
echo $HAVENCLAW_PRIVATE_KEY | wc -c
```

### Error: "Insufficient funds"

```bash
# Get test tokens from faucet
https://faucet.avax.network/

# Check balance
havenclaw wallet balance
```

---

## One-Line Installer with Wallet Setup

```bash
# Install and setup in one command
curl -fsSL https://havenclaw.ai/install.sh | bash -s -- --no-prompt

# Then setup wallet
havenclaw wallet setup

# Or with environment variable
export HAVENCLAW_PRIVATE_KEY=your_key && curl -fsSL https://havenclaw.ai/install.sh | bash
```

---

## Configuration Files

| File | Purpose | Permissions |
|------|---------|-------------|
| `~/.havenclaw/.wallet` | Unencrypted private key | `600` |
| `~/.havenclaw/.wallet.enc` | Encrypted private key | `600` |
| `~/.havenclaw/keystore.json` | Keystore file | `600` |
| `~/.havenclaw/.keystore_pass` | Keystore password | `600` |
| `~/.havenclaw/config.json` | General config | `644` |

---

## Next Steps

After wallet setup:

1. **Get test tokens**: Visit Fuji faucet
2. **Register agent**: `havenclaw agent register --name "My Bot"`
3. **Explore commands**: `havenclaw --help`
4. **Read docs**: https://docs.havenclaw.ai

---

**Remember:** Your private key is your identity on HavenVM. Keep it secure! 🔐
