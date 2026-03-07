# 🦞 Haven Framework × Clawdbot - Setup Guide Lengkap

## 📋 Apa yang Dibutuhkan

### 1. Prerequisites (Wajib)

| Requirement | Version | Cara Install |
|-------------|---------|--------------|
| **Node.js** | 22+ | `curl -fsSL https://deb.nodesource.com/setup_22.x \| sudo -E bash - && sudo apt-get install -y nodejs` |
| **pnpm** | 10+ | `npm install -g pnpm` |
| **Git** | Latest | `sudo apt-get install git` |
| **Browser** | Chrome/Brave/Edge | Download dari website resmi |

### 2. Wallet & Network

| Item | Detail | Link |
|------|--------|------|
| **MetaMask** | Browser extension | https://metamask.io |
| **Avalanche Fuji** | Testnet | Chain ID: 43113 |
| **Test AVAX** | Faucet | https://faucet.avax.network |

### 3. Smart Contracts (Sudah Deployed)

| Contract | Address | Network |
|----------|---------|---------|
| **OneClickRegistrar** | `0xE5fB1158B69933d215c99adfd23D16d6e6293294` | Fuji |
| **ERC8004AgentRegistry** | `0x8004A818BFB912233c491871b3d84c89A494BD9e` | Fuji |
| **ERC6551Registry** | `0x6bbA4040a81c779f356B487c9fcE89EE3308C54a` | Fuji |
| **AgentRegistry** | `0x913836702a423d75Ae97e439E6CBF12B7Ae3A6eC` | Fuji |

---

## 🚀 Step-by-Step Setup

### Step 1: Clone/Update Repository

```bash
cd /root/soft
git pull origin main  # Jika ada repo
```

### Step 2: Build HavenClaw (Optional - untuk testing)

```bash
cd /root/soft/havenclaw
pnpm install
pnpm build
pnpm test
```

### Step 3: Setup Extension Icons

```bash
cd /root/soft/integration-clawdbot/extension/icons

# Install librsvg untuk generate icons
sudo apt-get install -y librsvg2-bin imagemagick

# Generate icons
bash generate-icons.sh
```

### Step 4: Load Extension di Browser

1. **Buka Chrome/Brave**
   ```
   chrome://extensions/  # Chrome
   brave://extensions/   # Brave
   edge://extensions/    # Edge
   ```

2. **Enable Developer Mode**
   - Toggle switch di pojok kanan atas

3. **Load Extension**
   - Click "Load unpacked"
   - Pilih folder: `/root/soft/integration-clawdbot/extension/`

4. **Verify**
   - Extension icon 🏛️ muncul di toolbar
   - Tidak ada error di extension page

### Step 5: Setup MetaMask

1. **Install MetaMask**
   - Chrome Web Store: https://chrome.google.com/webstore/detail/metamask
   - Website: https://metamask.io

2. **Add Avalanche Fuji Network**
   ```
   Network Name: Avalanche Fuji Testnet
   RPC URL: https://api.avax-test.network/ext/bc/C/rpc
   Chain ID: 43113
   Currency Symbol: AVAX
   Block Explorer: https://testnet.snowscan.xyz
   ```

3. **Get Test AVAX**
   - Visit: https://faucet.avax.network
   - Enter wallet address
   - Request tokens (~0.5 AVAX untuk testing)

### Step 6: Test Extension

1. **Buka Clawdbot/OpenClaw**
   ```
   https://clowd.bot
   https://openclaw.ai
   ```

2. **Navigate ke Agent Page**
   ```
   https://clowd.bot/agent/{agent-id}
   ```

3. **Look for Button**
   - Scroll ke agent info section
   - Should see button "Register on Haven"

4. **Click & Register**
   - Connect MetaMask
   - Sign transaction
   - Wait for confirmation (~15-30 detik)

5. **Verify Registration**
   - Check Snowscan explorer
   - Agent should have ERC-8004 NFT + ERC-6551 TBA

---

## 📁 Project Structure

```
/root/soft/integration-clawdbot/
├── extension/                    # Browser Extension
│   ├── manifest.json            # Extension config
│   ├── content.js               # Auto-inject button
│   ├── styles.css               # Button styling
│   ├── popup.html               # Extension popup
│   ├── README.md                # Extension docs
│   └── icons/                   # Extension icons
│       ├── icon16.png
│       ├── icon48.png
│       ├── icon128.png
│       └── generate-icons.sh
│
├── src/                         # Source code
│   ├── HavenRegistration.tsx    # React component
│   └── ...
│
├── middleware/                  # API middleware
├── routes/                      # API routes
├── utils/                       # Utility functions
│
├── CLAWDBOT_INTEGRATION.md      # Integration guide
├── COMPLETE.md                  # Completion status
├── HOW_TO_LINK.md               # Linking guide
└── README.md                    # Main documentation
```

---

## 🔧 Troubleshooting

### Extension Tidak Muncul

**Problem:** Extension tidak load di browser

**Solution:**
```bash
# Check manifest.json valid
cd /root/soft/integration-clawdbot/extension
cat manifest.json | jq .

# Reload extension
# 1. chrome://extensions/
# 2. Click refresh icon on extension card
```

### Icons Tidak Ada

**Problem:** Error "Missing icon"

**Solution:**
```bash
cd /root/soft/integration-clawdbot/extension/icons
bash generate-icons.sh

# Manual create jika script gagal
convert -size 16x16 xc:#6366f1 icon16.png
convert -size 48x48 xc:#8b5cf6 icon48.png
convert -size 128x128 xc:#6366f1 icon128.png
```

### Button Tidak Inject

**Problem:** Button tidak muncul di halaman Clawdbot

**Solution:**
1. Check console untuk error (F12 → Console)
2. Verify URL match pattern di manifest.json
3. Reload halaman (Ctrl+R)
4. Check extension enabled

### Transaction Failed

**Problem:** Transaction revert/fail

**Possible Causes:**
1. **Insufficient AVAX** → Get from faucet
2. **Wrong network** → Switch to Fuji (Chain ID: 43113)
3. **Already registered** → Check existing TBA
4. **Gas too low** → Increase gas limit

**Solution:**
```bash
# Check balance
havenclaw wallet balance

# Switch network
havenclaw connect --network fuji

# Check existing registration
havenclaw agent info --address 0x...
```

---

## 🧪 Testing Checklist

### Extension Tests

- [ ] Extension load di browser
- [ ] Icons muncul dengan benar
- [ ] Popup opens when clicked
- [ ] Content script injects on clowd.bot
- [ ] Content script injects on openclaw.ai
- [ ] Button appears on agent pages
- [ ] Button styling correct
- [ ] Click button opens MetaMask
- [ ] Transaction signs successfully
- [ ] Success message appears
- [ ] Explorer link works

### Smart Contract Tests

- [ ] OneClickRegistrar responds
- [ ] ERC-8004 NFT minted
- [ ] ERC-6551 TBA created
- [ ] Agent registered in registry
- [ ] Events emitted correctly
- [ ] Metadata stored correctly

### Integration Tests

```bash
cd /root/soft/havenclaw
bash test-non-interactive.sh
```

Expected: ✅ 19/19 tests passing

---

## 📊 Requirements Summary

### Hardware

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **RAM** | 4 GB | 8 GB |
| **Storage** | 1 GB | 5 GB |
| **CPU** | Dual core | Quad core |

### Software

| Item | Required | Purpose |
|------|----------|---------|
| Node.js 22+ | ✅ | Runtime |
| pnpm 10+ | ✅ | Package manager |
| Chrome/Brave | ✅ | Browser |
| MetaMask | ✅ | Wallet |
| Git | ✅ | Version control |

### Network

| Network | Required | Purpose |
|---------|----------|---------|
| Avalanche Fuji | ✅ | Testnet deployment |
| Test AVAX | ✅ | Gas fees |

---

## 🎯 Next Steps After Setup

### 1. Test Full Flow

```
1. Buka clowd.bot
2. Pilih agent
3. Click "Register on Haven"
4. Sign transaction
5. Verify on explorer
```

### 2. Deploy to Production

```bash
# Update contract addresses for mainnet
# Update extension manifest
# Build and publish to Chrome Web Store
```

### 3. Monitor & Maintain

```bash
# Check extension analytics
# Monitor contract events
# Handle user support
```

---

## 📞 Support & Resources

| Resource | Link |
|----------|------|
| **Documentation** | https://docs.havenclaw.ai |
| **GitHub** | https://github.com/ava-labs/havenclaw |
| **Discord** | https://discord.gg/havenclaw |
| **Twitter** | https://twitter.com/havenclaw |

---

## ✅ Setup Complete Checklist

```bash
# Prerequisites
[ ] Node.js 22+ installed
[ ] pnpm 10+ installed
[ ] Git installed
[ ] Chrome/Brave installed

# Wallet
[ ] MetaMask installed
[ ] Fuji network added
[ ] Test AVAX received

# Extension
[ ] Icons generated
[ ] Extension loaded
[ ] No errors in console

# Testing
[ ] Extension works on clowd.bot
[ ] Extension works on openclaw.ai
[ ] Button injects correctly
[ ] Transaction succeeds
[ ] Agent registered on-chain

# Documentation
[ ] README reviewed
[ ] Integration guide read
[ ] Troubleshooting section bookmarked
```

---

**Status:** ✅ **READY FOR DEPLOYMENT**

**Last Updated:** 2026-03-07
**Network:** Avalanche Fuji Testnet
**Extension Version:** 1.0.0

🏛️🦞✨
