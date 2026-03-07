# 🧪 Testing HavenClaw Server-Side Dashboard

## ✅ Setup Complete

Dashboard server-side sudah dibuat di `/root/soft/havenclaw/apps/ui/`

---

## 🚀 Cara Menjalankan Dashboard

### Step 1: Set Private Key

```bash
export HAVENCLAW_PRIVATE_KEY="0xaee82fa4e0df351eb8275b0de7f00bddb8935c4d996c39bbe83069bdde48109a"
```

### Step 2: Start Server

```bash
cd /root/soft/havenclaw/apps/ui
node server.js
```

Expected output:
```
🏛️  HavenClaw Dashboard Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Dashboard: http://localhost:3000
🔐 Wallet: 0xDc9D44889eD7A98a9a2B976146B2395df25f334d
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Server-side wallet connection active
✅ No MetaMask connection needed
```

### Step 3: Test Dashboard

**Option A: Open in Browser**
```
http://localhost:3000
```

**Option B: Test API with curl**
```bash
# Test wallet endpoint
curl http://localhost:3000/api/wallet

# Test agents endpoint
curl http://localhost:3000/api/agents

# Test specific agent
curl http://localhost:3000/api/agent/0x5eb9F161211F5cd3Ca669dc993585388b5757715
```

---

## 📊 Expected API Responses

### GET /api/wallet

```json
{
  "address": "0xDc9D44889eD7A98a9a2B976146B2395df25f334d",
  "balance": "4.7123456789",
  "chainId": 43113,
  "connected": true
}
```

### GET /api/agents

```json
{
  "agents": [
    {
      "address": "0x5eb9F161211F5cd3Ca669dc993585388b5757715",
      "name": "Dashboard Agent",
      "description": "",
      "capabilities": ["trading", "analysis"],
      "registeredAt": "2026-03-07T18:13:55.000Z",
      "verified": false,
      "exists": true
    }
  ],
  "wallet": "0xDc9D44889eD7A98a9a2B976146B2395df25f334d"
}
```

### GET /api/agent/:address

```json
{
  "address": "0x5eb9F161211F5cd3Ca669dc993585388b5757715",
  "name": "Dashboard Agent",
  "description": "",
  "capabilities": ["trading", "analysis"],
  "registeredAt": "2026-03-07T18:13:55.000Z",
  "verified": false,
  "exists": true
}
```

---

## 🐛 Troubleshooting

### Server tidak start

**Problem:** `HAVENCLAW_PRIVATE_KEY environment variable not set`

**Solution:**
```bash
export HAVENCLAW_PRIVATE_KEY="your_key_here"
```

### Port 3000 sudah dipakai

**Problem:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 node server.js
```

### API tidak merespon

**Problem:** curl timeout

**Solution:**
```bash
# Check server is running
ps aux | grep "node server.js"

# Restart server
pkill -f "node server.js"
node server.js &

# Test again
curl http://localhost:3000/api/wallet
```

### Build error (Vite)

**Problem:** Frontend build gagal

**Solution:** Gunakan simple HTML test yang sudah dibuat:
```bash
# Simple HTML sudah ada di dist/index.html
# Server akan serve file ini
```

---

## 📁 Files Structure

```
apps/ui/
├── server.js              # Express server (RUN THIS)
├── src/
│   ├── pages/
│   │   └── Dashboard.tsx  # React dashboard
│   └── components/
│       └── layout/
│           └── Navbar.tsx # Navbar component
├── dist/
│   └── index.html         # Simple test HTML
├── package.json
└── SERVER_DASHBOARD.md    # Documentation
```

---

## 🔐 Security Notes

### For Development ✅
```bash
# OK untuk testing
export HAVENCLAW_PRIVATE_KEY="0x..."
node server.js
```

### For Production ⚠️
1. **Jangan commit .env ke git**
2. **Gunakan HTTPS**
3. **Add authentication**
4. **Rate limiting**
5. **Environment variables dari secrets manager**

---

## ✅ Checklist Test

```bash
# 1. Set private key
[ ] export HAVENCLAW_PRIVATE_KEY="..."

# 2. Start server
[ ] node server.js

# 3. Server started successfully
[ ] Look for "✅ Server-side wallet connection active"

# 4. Test wallet API
[ ] curl http://localhost:3000/api/wallet
[ ] Should return address & balance

# 5. Test agents API
[ ] curl http://localhost:3000/api/agents
[ ] Should return list of agents

# 6. Open dashboard in browser
[ ] http://localhost:3000
[ ] Should show wallet info & agents
```

---

## 🎯 Next Steps

1. ✅ Server running
2. ✅ API endpoints working
3. ⏳ Build React frontend (optional - simple HTML already works)
4. ⏳ Add authentication for production
5. ⏳ Deploy with HTTPS

---

**Dashboard server-side siap digunakan tanpa MetaMask!** 🏛️🦞✨
