# 🏛️ HavenClaw Platform - Setup Guide Lengkap

## 📋 Apa yang Sudah Dibuat

### ✅ Completed (Hari 1)

#### 1. Next.js Web Dashboard
```
/apps/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx          ✅ Root layout dengan WagmiProvider
│   │   ├── page.tsx            ✅ Landing page dengan hero & features
│   │   └── agents/create/
│   │       └── page.tsx        ✅ Agent creation form
│   ├── components/
│   │   ├── ui/
│   │   │   └── Button.tsx      ✅ Button component
│   │   ├── wallet/
│   │   │   └── WalletConnect.tsx ✅ Wallet connection
│   │   └── layout/
│   │       └── Navbar.tsx      ✅ Top navigation
│   └── lib/
│       └── WagmiProvider.tsx   ✅ Web3 provider setup
├── package.json                ✅ Dependencies configured
└── README.md                   ✅ Documentation
```

#### 2. Smart Contract Integration
- ✅ Wagmi config untuk Avalanche Fuji
- ✅ OneClickRegistrar ABI & address
- ✅ Contract addresses exported

#### 3. UI Components
- ✅ Landing page dengan comparison table
- ✅ Agent creation form dengan transaction support
- ✅ Wallet connection (MetaMask, WalletConnect)
- ✅ Network switcher (Fuji testnet)
- ✅ Transaction status notifications

---

## 🎯 Yang Masih Dibutuhkan

### 1. Environment Variables

Buat file `.env.local` di `/root/soft/havenclaw/apps/web/`:

```bash
# Network Configuration
NEXT_PUBLIC_CHAIN_ID=43113
NEXT_PUBLIC_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
NEXT_PUBLIC_EXPLORER_URL=https://testnet.snowscan.xyz

# Contract Addresses (Fuji Testnet)
NEXT_PUBLIC_ONE_CLICK_REGISTRAR=0xE5fB1158B69933d215c99adfd23D16d6e6293294
NEXT_PUBLIC_AGENT_REGISTRY=0x913836702a423d75Ae97e439E6CBF12B7Ae3A6eC
NEXT_PUBLIC_ERC8004_REGISTRY=0x8004A818BFB912233c491871b3d84c89A494BD9e
NEXT_PUBLIC_ERC6551_REGISTRY=0x6bbA4040a81c779f356B487c9fcE89EE3308C54a
NEXT_PUBLIC_HAVEN_TOKEN=0x414b10bED95b018Aa8F3A4c027E436e4bECBf1B0

# WalletConnect (optional - get from cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# IPFS (optional)
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs
```

**Cara mendapatkan WalletConnect Project ID:**
1. Visit https://cloud.walletconnect.com
2. Sign up / Login
3. Create new project
4. Copy Project ID

---

### 2. Additional Pages (To Build)

#### Agent Management
```bash
# Yang perlu dibuat:
src/app/agents/page.tsx           # Agent list dashboard
src/app/agents/[address]/page.tsx # Agent detail view
```

#### Task Marketplace
```bash
src/app/tasks/page.tsx            # Task board
src/app/tasks/create/page.tsx     # Create task form
src/app/tasks/[id]/page.tsx       # Task detail
```

#### Prediction Markets
```bash
src/app/predictions/page.tsx      # Prediction markets list
src/app/predictions/[id]/page.tsx # Market detail
```

#### Governance
```bash
src/app/governance/page.tsx       # HAVEN governance dashboard
src/app/governance/stake/page.tsx # Staking interface
src/app/governance/proposals/page.tsx # Proposals list
```

---

### 3. Additional Components (To Build)

#### Agent Components
```bash
src/components/agent/
├── AgentCard.tsx      # Display agent info
├── AgentList.tsx      # List of agents
├── AgentStats.tsx     # Agent statistics
└── AgentUpdate.tsx    # Update agent form
```

#### Task Components
```bash
src/components/task/
├── TaskCard.tsx       # Display task info
├── TaskBoard.tsx      # Task marketplace
├── TaskCreator.tsx    # Create task form
└── TaskSubmit.tsx     # Submit completion
```

#### Common Components
```bash
src/components/ui/
├── Card.tsx           # Card container
├── Input.tsx          # Text input
├── Dialog.tsx         # Modal dialog
├── Toast.tsx          # Notification toast
└── Spinner.tsx        # Loading spinner
```

---

### 4. Hooks (To Build)

```bash
src/hooks/
├── useWallet.ts        # Wallet management utilities
├── useAgent.ts         # Agent operations (create, update, list)
├── useTask.ts          # Task operations (create, submit, claim)
├── usePrediction.ts    # Prediction market operations
└── useGovernance.ts    # Governance operations (stake, vote)
```

---

### 5. Contract ABIs (To Add)

Create `src/lib/contracts.ts`:

```typescript
export const AGENT_REGISTRY_ABI = [
  // Copy dari contracts/artifacts/AgentRegistry.json
] as const

export const TASK_MARKETPLACE_ABI = [
  // Copy dari contracts/artifacts/TaskMarketplace.json
] as const

export const PREDICTION_MARKET_ABI = [
  // Copy dari contracts/artifacts/PredictionMarket.json
] as const

export const HAVEN_TOKEN_ABI = [
  // Copy dari contracts/artifacts/HAVEN.json
] as const
```

---

## 🚀 Cara Menjalankan

### Development

```bash
cd /root/soft/havenclaw/apps/web

# 1. Buat .env.local
cp .env.example .env.local
# Edit .env.local dengan values yang benar

# 2. Install dependencies (sudah done)
pnpm install

# 3. Run development server
pnpm dev

# 4. Open browser
# http://localhost:3000
```

### Production Build

```bash
# Build
pnpm build

# Start production server
pnpm start

# Port: 3000 (default)
```

---

## 📊 Comparison: Clawdbot vs HavenClaw Platform

| Feature | Clawdbot | HavenClaw Platform |
|---------|----------|-------------------|
| **Dashboard** | ✅ Web-based | ✅ Web-based (Next.js) |
| **Agent Creation** | ✅ Form | ✅ Form + Blockchain |
| **Identity** | Platform account | ✅ ERC-8004 NFT |
| **Account** | Platform wallet | ✅ ERC-6551 TBA |
| **Earnings** | Platform credits | ✅ Crypto (HAVEN, AVAX) |
| **Censorship** | Can ban users | ✅ Permissionless |
| **Portability** | Locked in | ✅ Portable NFT |
| **Governance** | Company-controlled | ✅ DAO (token holders) |

---

## 🎯 Roadmap

### Phase 1: Core Platform (Hari 1-3) ✅

- [x] Next.js setup
- [x] Wallet connection
- [x] Landing page
- [x] Agent creation form
- [ ] Agent list dashboard
- [ ] Agent detail view

### Phase 2: Task Marketplace (Hari 4-7)

- [ ] Task board UI
- [ ] Task creation
- [ ] Task submission
- [ ] Claim bounty

### Phase 3: Advanced Features (Hari 8-14)

- [ ] Prediction markets
- [ ] Governance dashboard
- [ ] Analytics & charts
- [ ] Mobile responsive

### Phase 4: Production (Hari 15-21)

- [ ] Security audit
- [ ] Performance optimization
- [ ] Error handling
- [ ] Documentation
- [ ] Deployment

---

## 🧪 Testing

```bash
# Run tests (once implemented)
pnpm test

# Run e2e tests
pnpm test:e2e

# Generate coverage
pnpm test:coverage
```

---

## 📁 Project Structure Lengkap

```
/root/soft/havenclaw/
├── apps/
│   └── web/                    ✅ Web Dashboard (NEW!)
│       ├── src/
│       │   ├── app/            ✅ Next.js pages
│       │   ├── components/     ✅ React components
│       │   ├── hooks/          📋 To build
│       │   ├── lib/            ✅ Web3 config
│       │   └── types/          📋 To build
│       ├── .env.local          📋 Need to create
│       ├── package.json        ✅
│       └── next.config.js      ✅
│
├── contracts/                  ✅ Smart Contracts
│   └── src/
│
└── havenclaw/                  ✅ CLI Tool
    └── src/
```

---

## 🔧 Troubleshooting

### Wallet tidak connect

**Problem:** MetaMask tidak muncul

**Solution:**
```bash
# Check MetaMask installed
# Visit https://metamask.io

# Clear browser cache
# Reload page

# Check console for errors (F12)
```

### Transaction failed

**Problem:** Transaction revert

**Possible causes:**
1. Insufficient AVAX → Get from faucet
2. Wrong network → Switch to Fuji (43113)
3. Gas too low → Increase gas limit

**Solution:**
```bash
# Get test AVAX
https://faucet.avax.network

# Add Fuji to MetaMask:
Network Name: Avalanche Fuji
RPC: https://api.avax-test.network/ext/bc/C/rpc
Chain ID: 43113
Symbol: AVAX
Explorer: https://testnet.snowscan.xyz
```

### Build error

**Problem:** TypeScript errors

**Solution:**
```bash
cd /root/soft/havenclaw/apps/web

# Check types
pnpm tsc --noEmit

# Fix errors
# Re-run build
pnpm build
```

---

## 📞 Next Steps

### Immediate (Hari ini)

1. **Buat .env.local**
   ```bash
   cd /root/soft/havenclaw/apps/web
   cp ../.env.example .env.local
   # Edit dengan values yang benar
   ```

2. **Test development server**
   ```bash
   pnpm dev
   # Open http://localhost:3000
   ```

3. **Test wallet connection**
   - Install MetaMask
   - Add Fuji network
   - Get test AVAX
   - Connect wallet

4. **Test agent creation**
   - Fill form
   - Sign transaction
   - View on explorer

### Short-term (Minggu ini)

1. Build agent list dashboard
2. Build agent detail view
3. Add task marketplace
4. Add prediction markets

### Medium-term (Next month)

1. Governance dashboard
2. Analytics & charts
3. Mobile responsive
4. Production deployment

---

## ✅ Setup Checklist

```bash
# Prerequisites
[ ] Node.js 22+ installed
[ ] pnpm 10+ installed
[ ] MetaMask installed
[ ] Test AVAX available

# Setup
[ ] .env.local created
[ ] Dependencies installed
[ ] Development server running
[ ] Wallet connected

# Testing
[ ] Landing page loads
[ ] Wallet connects
[ ] Agent creation form works
[ ] Transaction succeeds
[ ] Explorer link works

# Documentation
[ ] README.md reviewed
[ ] API docs read
[ ] Contract addresses verified
```

---

**Status:** 🚀 **READY TO DEVELOP**

**Last Updated:** 2026-03-07

**Next Action:** Buat .env.local dan test development server!

🏛️🦞✨
