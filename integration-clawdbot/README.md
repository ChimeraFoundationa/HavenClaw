# Clawdbot Integration

## Overview

Integrasi Clawdbot dengan Haven Framework memungkinkan agent yang dibuat di Clawdbot otomatis terdaftar di ERC-8004 dan Haven Framework melalui API endpoint.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Clawdbot Integration Flow                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Clawdbot     →    Haven API       →    Blockchain      │
│  ────────         ──────────         ───────────        │
│  POST /analyze    1. Validate        ERC-8004 Register  │
│  Agent Data       2. Create TBA      Haven Register     │
│                   3. Sign Tx         Emit Event         │
│                                      ↓                  │
│  ← Response ←   ← Blockchain ←    Return Result        │
│  • Token ID                         • Agent Address     │
│  • TBA Address                      • Tx Hash           │
│  • Capabilities                     • Status            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## API Endpoint

### Register Agent from Clawdbot

**Endpoint:** `POST /api/v1/clawdbot/register`

**Request:**
```json
{
  "clawdbot_agent_id": "agent_12345",
  "name": "Trading Bot Alpha",
  "owner_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "capabilities": ["trading", "analysis", "prediction"],
  "metadata": {
    "description": "Advanced ML trading bot",
    "model": "gpt-4",
    "strategy": "momentum"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "erc8004_token_id": "46",
    "tba_address": "0x120062C24C899190bC6676D71f202F7422264255",
    "agent_address": "0x58EcC1A3B5a9c78f59A594120405058FB40a3201",
    "transaction_hash": "0xabc123...",
    "metadata_uri": "ipfs://Qm...",
    "registered_at": "2026-03-06T10:30:00Z"
  },
  "message": "Agent successfully registered"
}
```

## Implementation

### 1. Backend Service (Node.js/Express)

```javascript
// routes/clawdbot.js
import express from 'express'
import { ethers } from 'ethers'
import { OneClickAgentRegistrar__factory } from '../typechain-types.js'

const router = express.Router()

// Configuration
const RPC_URL = process.env.AVALANCHE_FUJI_RPC
const PRIVATE_KEY = process.env.REGISTRAR_PRIVATE_KEY
const ONE_CLICK_ADDRESS = process.env.ONE_CLICK_REGISTRAR_ADDRESS

// Initialize provider and signer
const provider = new ethers.JsonRpcProvider(RPC_URL)
const signer = new ethers.Wallet(PRIVATE_KEY, provider)
const registrar = OneClickAgentRegistrar__factory.connect(ONE_CLICK_ADDRESS, signer)

// Clawdbot API Key validation
function validateClawdbotAuth(req, res, next) {
  const apiKey = req.headers['x-clawdbot-api-key']
  if (apiKey !== process.env.CLawdbot_API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' })
  }
  next()
}

/**
 * POST /api/v1/clawdbot/register
 * Register agent from Clawdbot to ERC-8004 + Haven
 */
router.post('/register', validateClawdbotAuth, async (req, res) => {
  try {
    const {
      clawdbot_agent_id,
      name,
      owner_address,
      capabilities,
      metadata
    } = req.body

    // Validate required fields
    if (!name || !owner_address || !capabilities) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, owner_address, capabilities'
      })
    }

    // Generate metadata URI
    const metadataURI = await uploadMetadataToIPFS({
      name,
      clawdbot_agent_id,
      owner: owner_address,
      capabilities,
      ...metadata,
      registered_at: new Date().toISOString()
    })

    // Execute one-click registration
    const tx = await registrar.registerAgentWithStrings(
      metadataURI,
      capabilities
    )

    // Wait for confirmation
    const receipt = await tx.wait()

    // Parse events
    const event = receipt.logs?.find(log => {
      try {
        const parsed = registrar.interface.parseLog(log)
        return parsed?.name === 'AgentOneClickRegistered'
      } catch {
        return false
      }
    })

    const parsed = registrar.interface.parseLog(event)
    const erc8004TokenId = parsed.args[1].toString()
    const tbaAddress = parsed.args[2]

    // Return result
    res.json({
      success: true,
      data: {
        clawdbot_agent_id,
        erc8004_token_id: erc8004TokenId,
        tba_address: tbaAddress,
        agent_address: owner_address,
        transaction_hash: receipt.hash,
        metadata_uri: metadataURI,
        registered_at: new Date().toISOString()
      },
      message: 'Agent successfully registered on Haven Framework'
    })

  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Registration failed'
    })
  }
})

/**
 * GET /api/v1/clawdbot/agent/:address
 * Get agent info by address
 */
router.get('/agent/:address', async (req, res) => {
  try {
    const { address } = req.params

    const agentInfo = await registrar.getLatestAgent(address)
    
    res.json({
      success: true,
      data: {
        address,
        erc8004_token_id: agentInfo.erc8004TokenId.toString(),
        tba_address: agentInfo.tbaAddress,
        metadata_uri: agentInfo.metadataURI,
        registered_at: new Date(agentInfo.registeredAt * 1000).toISOString()
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export default router
```

### 2. IPFS Upload Helper

```javascript
// utils/ipfs.js
import { create } from 'ipfs-http-client'

const ipfs = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: `Basic ${process.env.INFURA_AUTH}`
  }
})

export async function uploadMetadataToIPFS(metadata) {
  try {
    const added = await ipfs.add(JSON.stringify(metadata))
    return `ipfs://${added.path}`
  } catch (error) {
    // Fallback: return data URI
    const base64 = Buffer.from(JSON.stringify(metadata)).toString('base64')
    return `data:application/json;base64,${base64}`
  }
}
```

### 3. Environment Variables

```bash
# .env
AVALANCHE_FUJI_RPC=https://api.avax-test.network/ext/bc/C/rpc
REGISTRAR_PRIVATE_KEY=your_registrar_wallet_private_key
ONE_CLICK_REGISTRAR_ADDRESS=0x...
CLAWDBOT_API_KEY=your_clawdbot_api_key
INFURA_AUTH=your_infura_project_id:your_infura_project_secret
```

### 4. Server Setup

```javascript
// server.js
import express from 'express'
import cors from 'cors'
import clawdbotRoutes from './routes/clawdbot.js'

const app = express()

app.use(cors())
app.use(express.json())

// Routes
app.use('/api/v1/clawdbot', clawdbotRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Haven API server running on port ${PORT}`)
})
```

## Clawdbot Integration

### Call Clawdbot Endpoint

Jika Anda ingin memanggil Clawdbot untuk analisis agent sebelum registrasi:

```javascript
import axios from 'axios'

async function analyzeAgentWithClawdbot(agentData) {
  const response = await axios.post(
    'https://api.clawdbot.ai/agent/analyze',
    {
      agent_id: agentData.clawdbot_agent_id,
      capabilities: agentData.capabilities,
      metadata: agentData.metadata
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.CLawdbot_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  )

  return response.data
}

// Usage in registration flow
router.post('/register', async (req, res) => {
  // First, analyze with Clawdbot
  const analysis = await analyzeAgentWithClawdbot(req.body)
  
  // Then register with enhanced capabilities
  const enhancedCapabilities = [
    ...req.body.capabilities,
    ...analysis.suggested_capabilities || []
  ]
  
  // Proceed with registration...
})
```

## Testing

### Using curl

```bash
# Register agent
curl -X POST http://localhost:3000/api/v1/clawdbot/register \
  -H "Content-Type: application/json" \
  -H "x-clawdbot-api-key: your_api_key" \
  -d '{
    "clawdbot_agent_id": "agent_12345",
    "name": "Trading Bot Alpha",
    "owner_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "capabilities": ["trading", "analysis"],
    "metadata": {
      "description": "ML-based trading bot"
    }
  }'

# Get agent info
curl http://localhost:3000/api/v1/clawdbot/agent/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

### Using Postman

1. **Method:** POST
2. **URL:** `http://localhost:3000/api/v1/clawdbot/register`
3. **Headers:**
   - `Content-Type: application/json`
   - `x-clawdbot-api-key: your_api_key`
4. **Body (raw JSON):**
```json
{
  "clawdbot_agent_id": "agent_12345",
  "name": "Trading Bot Alpha",
  "owner_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "capabilities": ["trading", "analysis", "prediction"],
  "metadata": {
    "description": "Advanced ML trading bot",
    "model": "gpt-4"
  }
}
```

## Security

### API Authentication

- Require `x-clawdbot-api-key` header for all requests
- Validate API key against environment variable
- Rate limiting per API key

### Transaction Signing

- Use dedicated registrar wallet (not main wallet)
- Store private key in secure vault (AWS Secrets Manager, HashiCorp Vault)
- Implement transaction nonce management

### Input Validation

- Validate Ethereum addresses
- Sanitize metadata before IPFS upload
- Rate limit registration requests

## Deployment

### Deploy Backend

```bash
# Install dependencies
npm install

# Build TypeScript (if using)
npm run build

# Start server
npm start

# Or with PM2 for production
pm2 start server.js --name haven-api
```

### Deploy Smart Contract

```bash
cd contracts

# Deploy OneClickRegistrar
forge script script/DeployOneClickRegistrar.s.sol \
  --rpc-url https://api.avax-test.network/ext/bc/C/rpc \
  --broadcast \
  --verify

# Update ONE_CLICK_REGISTRAR_ADDRESS in .env
```

## Monitoring

### Logs

```javascript
// middleware/logger.js
import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})

// Usage
logger.info('Agent registered', { clawdbot_agent_id, tx_hash })
```

### Metrics to Track

- Total agents registered
- Registration success/failure rate
- Average gas cost
- API response times
- Failed transactions

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid API key` | Missing/wrong x-clawdbot-api-key | Check API key in request |
| `Insufficient funds` | Registrar wallet out of AVAX | Fund registrar wallet |
| `Transaction failed` | Smart contract error | Check contract logs |
| `Agent already registered` | Duplicate registration | Use existing agent address |

## Next Steps

1. **Deploy OneClickRegistrar** contract to Fuji
2. **Setup backend server** with Express
3. **Configure Clawdbot** to call your endpoint
4. **Test integration** end-to-end
5. **Monitor and optimize**

## Resources

- [Clawdbot API Docs](https://docs.clawdbot.ai)
- [Haven Framework Docs](/docs)
- [ERC-8004 Spec](https://github.com/erc-8004)
- [Ethers.js Docs](https://docs.ethers.org)
