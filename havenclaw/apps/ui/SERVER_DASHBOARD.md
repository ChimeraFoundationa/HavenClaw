# 🏛️ HavenClaw Dashboard - Server-Side Wallet Connection

## 🎯 Overview

Dashboard ini **TIDAK PERLU MetaMask** atau wallet connection lainnya. Server langsung connect ke private key yang disimpan di environment variable.

**Keamanan:**
- ✅ Private key disimpan di server (tidak di browser)
- ✅ Dashboard read-only (hanya menampilkan data)
- ✅ Cocok untuk self-hosted dashboard

---

## 🚀 Quick Start

### 1. Set Environment Variable

```bash
export HAVENCLAW_PRIVATE_KEY="your_private_key_here"
```

### 2. Install Dependencies

```bash
cd /root/soft/havenclaw/apps/ui
pnpm install
```

### 3. Run Server

```bash
# Development
pnpm dev

# Production
pnpm start
```

Server akan start di `http://localhost:3000`

---

## 📊 API Endpoints

### GET /api/wallet

Returns wallet info:

```json
{
  "address": "0xDc9D44889eD7A98a9a2B976146B2395df25f334d",
  "balance": "4.7123",
  "chainId": 43113,
  "connected": true
}
```

### GET /api/agents

Returns list of registered agents:

```json
{
  "wallet": "0xDc9D44889eD7A98a9a2B976146B2395df25f334d",
  "agents": [
    {
      "address": "0x5eb9F161211F5cd3Ca669dc993585388b5757715",
      "name": "Dashboard Agent",
      "capabilities": ["trading", "analysis"],
      "registeredAt": "2026-03-07T18:13:55.000Z",
      "verified": false
    }
  ]
}
```

### GET /api/agent/:address

Returns specific agent info by TBA address.

---

## 🔐 Security Considerations

### For Development/Testing
```bash
# OK untuk development
export HAVENCLAW_PRIVATE_KEY="0x..."
pnpm dev
```

### For Production

1. **Use environment file:**
   ```bash
   # .env (don't commit to git!)
   HAVENCLAW_PRIVATE_KEY=your_key_here
   PORT=3000
   ```

2. **Use secrets manager:**
   ```bash
   # AWS Secrets Manager, HashiCorp Vault, etc.
   export HAVENCLAW_PRIVATE_KEY=$(aws secretsmanager get-secret-value ...)
   ```

3. **Use reverse proxy:**
   ```nginx
   # nginx config
   location / {
     proxy_pass http://localhost:3000;
     auth_basic "Private";
     auth_basic_user_file /etc/nginx/.htpasswd;
   }
   ```

---

## 📁 File Structure

```
apps/ui/
├── server.js           # Express server with wallet connection
├── src/
│   ├── pages/
│   │   └── Dashboard.tsx  # Frontend (fetches from /api/*)
│   └── components/
│       └── layout/
│           └── Navbar.tsx
├── dist/               # Built frontend
└── package.json
```

---

## 🎨 Features

### Auto-Connected Dashboard

- ✅ Server connects to wallet on startup
- ✅ Frontend fetches data from server API
- ✅ No browser wallet needed
- ✅ Read-only access (safe for viewing)

### Display Information

- Wallet address & balance
- List of registered agents
- Agent details (name, capabilities, registration date)
- Links to explorer

---

## 🧪 Testing

### 1. Start Server

```bash
export HAVENCLAW_PRIVATE_KEY="0xaee82fa4e0df351eb8275b0de7f00bddb8935c4d996c39bbe83069bdde48109a"
pnpm dev
```

### 2. Test API

```bash
# Wallet info
curl http://localhost:3000/api/wallet

# Agent list
curl http://localhost:3000/api/agents

# Specific agent
curl http://localhost:3000/api/agent/0x5eb9F161211F5cd3Ca669dc993585388b5757715
```

### 3. Open Dashboard

```
http://localhost:3000
```

---

## 🔄 Workflow

```
1. User sets HAVENCLAW_PRIVATE_KEY env var
         ↓
2. Server starts and connects to wallet
         ↓
3. User opens dashboard in browser
         ↓
4. Frontend fetches data from /api/* endpoints
         ↓
5. Dashboard displays wallet & agent info
         ↓
6. No MetaMask connection needed! ✅
```

---

## 🛡️ Security Best Practices

1. **Never expose private key in frontend code**
   - ✅ Server-side only
   - ✅ Environment variable

2. **Use HTTPS in production**
   ```bash
   # With Let's Encrypt
   certbot --nginx -d yourdomain.com
   ```

3. **Add authentication**
   ```javascript
   // Add basic auth to server.js
   app.use((req, res, next) => {
     const auth = req.headers.authorization
     if (auth !== 'Bearer YOUR_SECRET_TOKEN') {
       return res.status(401).send('Unauthorized')
     }
     next()
   })
   ```

4. **Rate limiting**
   ```javascript
   import rateLimit from 'express-rate-limit'
   
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   })
   
   app.use(limiter)
   ```

---

## 📊 Comparison

| Feature | MetaMask Dashboard | Server-Side Dashboard |
|---------|-------------------|----------------------|
| **Wallet Connect** | Required | ❌ Not needed |
| **Private Key** | In browser | ✅ Server-side only |
| **Security** | User responsibility | ✅ Server responsibility |
| **UX** | Click to connect | ✅ Auto-connected |
| **Best For** | Public dApps | ✅ Private/Internal dashboards |

---

## ✅ Summary

**Server-side dashboard ini:**
- ✅ Tidak perlu MetaMask
- ✅ Auto-connect ke private key
- ✅ Read-only (aman untuk viewing)
- ✅ Cocok untuk self-hosted monitoring

**Next Steps:**
1. Build frontend dengan Vite
2. Add authentication
3. Deploy dengan HTTPS
4. Setup monitoring & alerts

🏛️🦞✨
