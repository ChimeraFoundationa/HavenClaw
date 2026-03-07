# 🏛️ HavenClaw Dashboard

**Dashboard untuk melihat agent yang telah dibuat** via HavenClaw CLI.

---

## 🚀 Quick Start

```bash
cd /root/soft/havenclaw/apps/ui

# Install dependencies
pnpm install

# Development
pnpm dev

# Production build
pnpm build
```

---

## 📋 Fitur

Dashboard ini menampilkan:
- ✅ Wallet connection (MetaMask)
- ✅ Status koneksi network
- ✅ Statistik agent
- ✅ Quick links ke dokumentasi
- ✅ CLI command reference

**Catatan:** Agent dibuat menggunakan **HavenClaw CLI**, bukan melalui UI ini.

---

## 🔧 Setup

### 1. Install MetaMask
```
https://metamask.io
```

### 2. Add Avalanche Fuji
```
Network: Avalanche Fuji
RPC: https://api.avax-test.network/ext/bc/C/rpc
Chain ID: 43113
Symbol: AVAX
```

### 3. Get Test AVAX
```
https://faucet.avax.network
```

### 4. Register Agent via CLI
```bash
# Install HavenClaw CLI
curl -fsSL https://havenclaw.ai/install.sh | bash

# Register agent
havenclaw agent register --name "My Agent" --capabilities trading,analysis
```

### 5. View Dashboard
```bash
cd /root/soft/havenclaw/apps/ui
pnpm dev

# Open http://localhost:5173
```

---

## 📁 Project Structure

```
apps/ui/
├── src/
│   ├── components/
│   │   ├── ui/Button.tsx
│   │   ├── wallet/WalletConnect.tsx
│   │   └── layout/Navbar.tsx
│   ├── lib/WagmiProvider.tsx
│   ├── pages/Dashboard.tsx
│   └── App.tsx
├── dist/              # Production build
└── package.json
```

---

## 🎯 CLI Commands

```bash
# Register agent
havenclaw agent register --name "Trading Bot" --capabilities trading,analysis

# List agents
havenclaw agent list

# Get agent info
havenclaw agent info --address 0x...

# Create task
havenclaw task create --capability trading --bounty 100
```

---

## 🔗 Links

| Resource | URL |
|----------|-----|
| Documentation | https://docs.havenclaw.ai |
| Explorer | https://testnet.snowscan.xyz |
| Faucet | https://faucet.avax.network |
| GitHub | https://github.com/ava-labs/havenclaw |

---

**Status:** ✅ **Production Ready**

**Build:** Vite + React + Wagmi

**Last Updated:** 2026-03-07

🏛️🦞
