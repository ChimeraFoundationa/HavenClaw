# 🚀 Quick Start - Clawdbot Integration

## Langkah 1: Deploy Smart Contract

```bash
cd /root/soft/contracts

# Deploy OneClickAgentRegistrar
forge script script/DeployOneClickRegistrar.s.sol \
  --rpc-url https://api.avax-test.network/ext/bc/C/rpc \
  --broadcast \
  --verify

# Catat address yang di-deploy
ONE_CLICK_REGISTRAR_ADDRESS=0x...
```

## Langkah 2: Setup Environment

```bash
cd /root/soft/integration-clawdbot

# Copy environment template
cp .env.example .env

# Edit .env dengan values Anda
nano .env
```

**Required variables:**
```bash
REGISTRAR_PRIVATE_KEY=your_wallet_private_key
ONE_CLICK_REGISTRAR_ADDRESS=0x...  # dari step 1
CLAWDBOT_API_KEY=your_clawdbot_key
```

## Langkah 3: Install Dependencies

```bash
npm install
```

## Langkah 4: Run Server

```bash
# Development
npm run dev

# Production
npm start
```

Server akan running di `http://localhost:3000`

## Langkah 5: Test Integration

### Test Health Check
```bash
curl http://localhost:3000/health
```

### Test Register Agent
```bash
curl -X POST http://localhost:3000/api/v1/clawdbot/register \
  -H "Content-Type: application/json" \
  -H "x-clawdbot-api-key: your_api_key" \
  -d '{
    "clawdbot_agent_id": "test_agent_1",
    "name": "My Trading Bot",
    "owner_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "capabilities": ["trading", "analysis"],
    "metadata": {
      "description": "Test agent from Clawdbot"
    }
  }'
```

### Expected Response
```json
{
  "success": true,
  "data": {
    "clawdbot_agent_id": "test_agent_1",
    "erc8004_token_id": "46",
    "tba_address": "0x120062C24C899190bC6676D71f202F7422264255",
    "agent_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "transaction_hash": "0xabc123...",
    "metadata_uri": "ipfs://Qm...",
    "explorer_url": "https://testnet.snowscan.xyz/tx/0xabc123..."
  },
  "message": "Agent successfully registered"
}
```

## Langkah 6: Integrate di Clawdbot

Di code Clawdbot Anda, tambahkan call ke endpoint registration:

```javascript
// Di Clawdbot backend
async function registerAgentToHaven(agentData) {
  const response = await fetch('http://localhost:3000/api/v1/clawdbot/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-clawdbot-api-key': process.env.CLAWDBOT_API_KEY
    },
    body: JSON.stringify({
      clawdbot_agent_id: agentData.id,
      name: agentData.name,
      owner_address: agentData.ownerWallet,
      capabilities: agentData.capabilities,
      metadata: {
        description: agentData.description,
        model: agentData.model,
        // ... metadata lainnya
      }
    })
  })

  const result = await response.json()
  
  if (result.success) {
    // Simpan result ke database
    await db.agents.update(agentData.id, {
      haven_erc8004_token_id: result.data.erc8004_token_id,
      haven_tba_address: result.data.tba_address,
      haven_registered: true
    })
    
    return result
  } else {
    throw new Error(result.error)
  }
}

// Call setelah user create agent di Clawdbot
app.post('/api/agents/create', async (req, res) => {
  // 1. Create agent di Clawdbot
  const agent = await createAgent(req.body)
  
  // 2. Register ke Haven (optional/async)
  registerAgentToHaven(agent).catch(console.error)
  
  res.json({ agent })
})
```

## Troubleshooting

### Error: Missing API key
```json
{"success": false, "error": "Missing API key"}
```
**Solution:** Tambahkan header `x-clawdbot-api-key` di request

### Error: Invalid Ethereum address
```json
{"success": false, "error": "Invalid Ethereum address format"}
```
**Solution:** Pastikan address dimulai dengan `0x` dan valid

### Error: Insufficient funds
```json
{"success": false, "error": "insufficient funds"}
```
**Solution:** Fund registrar wallet dengan AVAX (Fuji testnet)

### Error: Agent already registered
```json
{
  "success": true,
  "data": { "already_registered": true, ... }
}
```
**Solution:** Agent sudah terdaftar, gunakan address yang sama

## Next Steps

1. ✅ Test di Fuji Testnet
2. ✅ Integrate di Clawdbot production
3. ✅ Monitor logs di `logs/combined.log`
4. ✅ Setup monitoring/alerting
5. ✅ Deploy ke production (VPS/Cloud)

## Production Deployment

```bash
# Install PM2
npm install -g pm2

# Start dengan PM2
pm2 start server.js --name haven-clawdbot

# Auto-start on reboot
pm2 startup
pm2 save
```

## Support

- Docs: `/root/soft/integration-clawdbot/README.md`
- API: `http://localhost:3000/api`
- Health: `http://localhost:3000/health`
