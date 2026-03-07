# 🚀 HavenClaw Interactive One-Liner

## Installer yang MEMINTA Konfigurasi

**Jalankan one-liner, installer akan meminta semua konfigurasi secara interactive!**

---

## ⚡ Quick Start

### Cara Paling Mudah (RECOMMENDED)

```bash
curl -fsSL https://havenclaw.ai/install.sh | bash
```

**Itu saja!** Installer akan memandu Anda melalui semua konfigurasi.

---

## 📋 Interactive Flow

Saat Anda menjalankan one-liner, installer akan meminta:

### Step 1: Private Key

```
⚠️  Wallet Configuration
   Your private key will be encrypted and stored securely.

Enter your private key (0x + 64 hex chars): [input disembunyikan]
✓ Wallet configured securely
```

**Private key:**
- Input **disembunyikan** (tidak terlihat di terminal)
- Akan di-**enkripsi** dan disimpan aman
- Format: `0x` + 64 karakter hex

### Step 2: Network

```
⚠️  Network Configuration
Select network (fuji/mainnet/local) [fuji]: [Enter untuk default]
✓ Network: fuji
```

**Pilihan network:**
- `fuji` - Testnet (recommended untuk development)
- `mainnet` - Avalanche Mainnet
- `local` - Local development network

### Step 3: RPC URL (Optional)

```
Custom RPC URL (leave empty for default): [Enter untuk skip]
```

**Kosongkan** untuk menggunakan RPC default network yang dipilih.

### Step 4: Agent Name

```
⚠️  Agent Configuration
Enter agent name [My AI Agent]: [Nama agent Anda]
```

**Contoh:** `"Trading Bot"`, `"Prediction Master"`, dll.

### Step 5: Capabilities

```
Enter capabilities (comma-separated, e.g., trading,analysis): [kemampuan agent]
```

**Contoh:** `trading,analysis,prediction`

### Step 6: Auto-Register

```
Agent Registration:
  Would you like to register your agent on HavenVM now?
Register agent? (y/N): [y untuk yes, N untuk no]
```

**Pilih:**
- `y` - Langsung register agent
- `N` - Register nanti manual

---

## 🎬 Contoh Session Lengkap

```bash
$ curl -fsSL https://havenclaw.ai/install.sh | bash

🏛️ HavenClaw Installer
  Agent Coordination, One Command.
  For HavenVM Agent Coordination Framework

✓ Detected: linux
✓ Node.js ready (v24.13.0)
✓ Git ready (2.34.1)
✓ pnpm ready (10.23.0)

[1/4] Preparing environment
[2/4] Installing dependencies
[3/4] Installing HavenClaw
[4/5] Wallet configuration

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Configuration Setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please enter your configuration:

⚠️  Wallet Configuration
   Your private key will be encrypted and stored securely.

Enter your private key (0x + 64 hex chars): ••••••••••••••••••••••••••••••••••••••••••••••••
✓ Wallet configured securely

⚠️  Network Configuration
Select network (fuji/mainnet/local) [fuji]: [Enter]
✓ Network: fuji

⚠️  Agent Configuration
Enter agent name [My AI Agent]: Trading Bot Alpha
Enter capabilities (comma-separated, e.g., trading,analysis): trading,analysis,prediction

Agent Registration:
  Would you like to register your agent on HavenVM now?
Register agent? (y/N): y

✓ Configuration created: /home/user/.havenclaw/config.json
[5/5] Finalizing setup
✓ HavenClaw installed successfully!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Configuration Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Network: fuji
  Config:  /home/user/.havenclaw/config.json
  Wallet:  ✓ Configured
  Agent:   Trading Bot Alpha
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔐 Security Features

### Private Key Protection

✅ **Input disembunyikan** - Tidak terlihat di terminal  
✅ **Encrypted storage** - Disimpan dengan enkripsi AES-256  
✅ **File permissions 600** - Hanya owner yang bisa baca  
✅ **No logging** - Tidak dicatat di log installer  

### Best Practices

1. **Gunakan dedicated wallet** untuk testing
2. **Jangan gunakan main wallet** dengan dana besar
3. **Dapatkan test tokens** dari faucet
4. **Backup private key** di tempat aman

---

## 🆚 Comparison: Interactive vs Arguments

### Interactive (RECOMMENDED)

```bash
curl -fsSL https://havenclaw.ai/install.sh | bash
```

**Keuntungan:**
- ✅ Dipandu step-by-step
- ✅ Input private key secure (disembunyikan)
- ✅ Tidak perlu hafal arguments
- ✅ Validation otomatis
- ✅ Cocok untuk first-time users

### Arguments (Advanced)

```bash
curl -fsSL https://havenclaw.ai/install.sh | bash -s -- --private-key 0x... --agent-name "Bot" --auto-register
```

**Keuntungan:**
- ✅ Fully automated
- ✅ Cocok untuk CI/CD
- ✅ Scriptable

---

## 🛠️ Troubleshooting

### Error: "Invalid private key format"

```
✗ Invalid private key format (must be 0x + 64 hex chars)
```

**Solusi:**
- Pastikan format: `0x` + 64 karakter hexadecimal
- Contoh valid: `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`

### Error: "Agent registration failed"

```
✗ Agent registration failed, run manually later
```

**Solusi:**
1. Wallet butuh test tokens
2. Dapatkan dari: https://faucet.avax.network/
3. Retry: `havenclaw agent register --name "My Bot"`

### Installer Tidak Meminta Input

**Kemungkinan penyebab:**
- Running dalam non-interactive mode (CI/CD, script)
- Tidak ada TTY available

**Solusi:**
- Jalankan manual di terminal
- Atau gunakan arguments: `--private-key 0x... --agent-name "Bot"`

---

## 📖 Next Steps

Setelah instalasi:

```bash
# 1. Verify installation
havenclaw --version

# 2. Check health
havenclaw doctor

# 3. Check wallet balance
havenclaw wallet balance

# 4. Get test tokens (if needed)
# Visit: https://faucet.avax.network/

# 5. Start using HavenClaw
havenclaw --help
```

---

## 🎯 One-Liner, Full Control!

**Jalankan, jawab prompt, DONE!** 🚀

```bash
curl -fsSL https://havenclaw.ai/install.sh | bash
```

---

For more info: https://docs.havenclaw.ai
