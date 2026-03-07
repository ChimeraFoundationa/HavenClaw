# 🦞 Haven × Clawdbot Integration

## Cara Menghubungkan Haven Framework ke Clawdbot

Ada 3 cara untuk mengintegrasikan Haven Framework dengan Clawdbot:

---

## Option 1: Embed React Component (Paling Mudah) ⭐

### Step 1: Copy Component Files

```bash
# Dari project Haven ke project Clawdbot
cd /root/soft

# Copy komponen ke project Clawdbot
cp frontend/src/components/HavenRegistration.tsx /path/to/clawdbot/src/components/
cp frontend/src/components/AgentChecker.tsx /path/to/clawdbot/src/components/
cp frontend/src/data/constants.ts /path/to/clawdbot/src/data/
```

### Step 2: Install Dependencies di Clawdbot

```bash
cd /path/to/clawdbot

npm install ethers@6 framer-motion lucide-react
# atau
yarn add ethers@6 framer-motion lucide-react
```

### Step 3: Tambahkan Button di Create Agent Page

```tsx
// /path/to/clawdbot/src/pages/CreateAgent.tsx
import { HavenRegistration } from '@/components/HavenRegistration'

function CreateAgentPage() {
  const [agent, setAgent] = useState({
    id: 'agent_001',
    name: 'My Trading Bot',
    capabilities: ['trading', 'analysis']
  })

  const handleHavenSuccess = async (result) => {
    // Simpan ke database Clawdbot
    await fetch('/api/agents/' + agent.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        haven_token_id: result.tokenId,
        haven_tba_address: result.tbaAddress,
        haven_registered: true,
        haven_metadata_uri: result.metadataURI
      })
    })
    
    alert('✅ Successfully registered on Haven Framework!')
  }

  return (
    <div className="create-agent-page">
      <h1>Create New Agent</h1>
      
      {/* Form Clawdbot */}
      <AgentForm agent={agent} onChange={setAgent} />
      
      {/* Haven Registration - TAMBAHKAN INI */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Register on Haven Framework</h2>
        <p className="text-gray-600 mb-4">
          Get your agent on-chain with ERC-8004 identity and ERC-6551 Token Bound Account
        </p>
        <HavenRegistration
          agentId={agent.id}
          agentName={agent.name}
          capabilities={agent.capabilities}
          metadata={{
            description: agent.description,
            model: agent.model,
            clawdbot_url: window.location.origin
          }}
          onSuccess={handleHavenSuccess}
          useClawdbotEndpoint={false} // Set true jika punya API endpoint
        />
      </div>
    </div>
  )
}
```

### Step 4: Tambahkan di Agent Dashboard (Optional)

```tsx
// /path/to/clawdbot/src/pages/AgentDashboard.tsx
import { AgentChecker } from '@/components/AgentChecker'

function AgentDashboard({ agent }) {
  return (
    <div>
      <h1>Agent Dashboard</h1>
      
      {/* Agent Info */}
      <AgentInfo agent={agent} />
      
      {/* Haven Integration Status */}
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4">Haven Framework Integration</h2>
        
        {agent.haven_registered ? (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Registered on Haven</span>
            </div>
            <div className="mt-3 space-y-2 text-sm text-green-700">
              <div>Token ID: <span className="font-mono">{agent.haven_token_id}</span></div>
              <div>TBA: <span className="font-mono">{agent.haven_tba_address}</span></div>
              <a 
                href={`https://testnet.snowscan.xyz/token/${agent.haven_token_id}`}
                target="_blank"
                className="text-blue-600 hover:underline"
              >
                View on Explorer →
              </a>
            </div>
          </div>
        ) : (
          <AgentChecker
            clawdbotEndpoint={undefined}
            onRegistrationComplete={(result) => {
              // Update agent data
              updateAgent(agent.id, {
                haven_token_id: result.tokenId,
                haven_tba_address: result.tbaAddress,
                haven_registered: true
              })
            }}
          />
        )}
      </div>
    </div>
  )
}
```

---

## Option 2: Gunakan Custom Hook (Untuk Flexibility)

### Step 1: Buat Hook

```tsx
// /path/to/clawdbot/src/hooks/useHavenRegistration.ts
import { useState } from 'react'
import { ethers } from 'ethers'

const ONE_CLICK_ADDRESS = '0xE5fB1158B69933d215c99adfd23D16d6e6293294'

const ONE_CLICK_ABI = [
  'function registerAgentWithStrings(string memory metadataURI, string[] memory capabilities) external returns (uint256, address)',
  'event AgentOneClickRegistered(address indexed owner, uint256 indexed erc8004TokenId, address indexed tbaAddress, string metadataURI, bytes32[] capabilities)'
]

export function useHavenRegistration() {
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const registerAgent = async (agentData: {
    id: string
    name: string
    capabilities: string[]
    metadata?: Record<string, any>
  }) => {
    if (!window.ethereum) {
      throw new Error('Please install MetaMask')
    }

    setIsRegistering(true)
    setError(null)

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const address = await signer.getAddress()

      // Check network
      const network = await provider.getNetwork()
      if (network.chainId !== 43113n) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xa869' }]
        })
      }

      const contract = new ethers.Contract(ONE_CLICK_ADDRESS, ONE_CLICK_ABI, signer)

      // Create metadata
      const metadata = {
        name: agentData.name,
        clawdbot_agent_id: agentData.id,
        owner: address,
        capabilities: agentData.capabilities,
        registeredAt: new Date().toISOString(),
        source: 'clawdbot',
        ...agentData.metadata
      }

      const json = JSON.stringify(metadata)
      const base64 = btoa(json)
      const metadataURI = `data:application/json;base64,${base64}`

      const tx = await contract.registerAgentWithStrings(metadataURI, agentData.capabilities)
      const receipt = await tx.wait()

      // Parse event
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log)
          return parsed?.name === 'AgentOneClickRegistered'
        } catch { return false }
      })

      const parsed = contract.interface.parseLog(event)

      return {
        tokenId: parsed.args[1].toString(),
        tbaAddress: parsed.args[2],
        txHash: receipt.hash,
        metadataURI
      }
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setIsRegistering(false)
    }
  }

  return { registerAgent, isRegistering, error }
}
```

### Step 2: Gunakan di Component

```tsx
// /path/to/clawdbot/src/pages/CreateAgent.tsx
import { useHavenRegistration } from '@/hooks/useHavenRegistration'

function CreateAgentPage() {
  const { registerAgent, isRegistering, error } = useHavenRegistration()

  const handleCreateAgent = async () => {
    // 1. Create agent di Clawdbot
    const agent = await createAgentInClawdbot(agentData)
    
    // 2. Register di Haven
    const havenResult = await registerAgent({
      id: agent.id,
      name: agent.name,
      capabilities: agent.capabilities
    })
    
    // 3. Save result
    await updateAgent(agent.id, {
      haven_token_id: havenResult.tokenId,
      haven_tba_address: havenResult.tbaAddress
    })
    
    alert('Success!')
  }

  return (
    <button 
      onClick={handleCreateAgent}
      disabled={isRegistering}
    >
      {isRegistering ? 'Registering...' : 'Create Agent on Haven'}
    </button>
  )
}
```

---

## Option 3: Backend API Endpoint (Untuk Auto-Register)

Jika Clawdbot punya server wallet untuk pay gas:

### Step 1: Buat API Endpoint

```javascript
// /path/to/clawdbot/server/routes/haven.js
import express from 'express'
import { ethers } from 'ethers'

const router = express.Router()

const ONE_CLICK_ADDRESS = '0xE5fB1158B69933d215c99adfd23D16d6e6293294'
const ONE_CLICK_ABI = [
  'function registerAgentWithStrings(string memory metadataURI, string[] memory capabilities) external returns (uint256, address)'
]

// Server wallet (untuk pay gas)
const provider = new ethers.JsonRpcProvider('https://api.avax-test.network/ext/bc/C/rpc')
const signer = new ethers.Wallet(process.env.CLAWDBOT_WALLET_PRIVATE_KEY, provider)
const contract = new ethers.Contract(ONE_CLICK_ADDRESS, ONE_CLICK_ABI, signer)

router.post('/register-agent', async (req, res) => {
  try {
    const { agentId, agentName, capabilities, ownerAddress, metadata } = req.body

    // Create metadata
    const metadataURI = `data:application/json;base64,${btoa(JSON.stringify({
      name: agentName,
      clawdbot_agent_id: agentId,
      owner: ownerAddress,
      capabilities,
      registeredAt: new Date().toISOString(),
      source: 'clawdbot',
      ...metadata
    }))}`

    // Execute registration
    const tx = await contract.registerAgentWithStrings(metadataURI, capabilities)
    const receipt = await tx.wait()

    // Parse event
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log)
        return parsed?.name === 'AgentOneClickRegistered'
      } catch { return false }
    })

    const parsed = contract.interface.parseLog(event)

    res.json({
      success: true,
      data: {
        tokenId: parsed.args[1].toString(),
        tbaAddress: parsed.args[2],
        txHash: receipt.hash,
        metadataURI
      }
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
})

export default router
```

### Step 2: Call dari Frontend

```tsx
// Di Clawdbot frontend
async function registerOnHaven(agent) {
  const response = await fetch('/api/haven/register-agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentId: agent.id,
      agentName: agent.name,
      capabilities: agent.capabilities,
      ownerAddress: agent.ownerAddress,
      metadata: agent.metadata
    })
  })

  const result = await response.json()
  
  if (result.success) {
    // Save to database
    await updateAgent(agent.id, {
      haven_token_id: result.data.tokenId,
      haven_tba_address: result.data.tbaAddress
    })
  }
  
  return result
}
```

---

## 🎨 UI Component Sederhana

Buat button component yang bisa di-customize:

```tsx
// /path/to/clawdbot/src/components/HavenButton.tsx
import { useState } from 'react'
import { useHavenRegistration } from '@/hooks/useHavenRegistration'

interface HavenButtonProps {
  agentId: string
  agentName: string
  capabilities: string[]
  onSuccess?: (result: any) => void
}

export function HavenButton({ agentId, agentName, capabilities, onSuccess }: HavenButtonProps) {
  const { registerAgent, isRegistering, error } = useHavenRegistration()

  const handleClick = async () => {
    try {
      const result = await registerAgent({
        id: agentId,
        name: agentName,
        capabilities
      })
      onSuccess?.(result)
    } catch (err) {
      console.error('Registration failed:', err)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isRegistering}
        className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRegistering ? '⏳ Registering on Haven...' : '🏛️ Register on Haven Framework'}
      </button>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
```

---

## 📊 Update Database Schema

Tambahkan kolom untuk Haven integration:

```sql
-- PostgreSQL
ALTER TABLE agents 
ADD COLUMN haven_token_id VARCHAR(255),
ADD COLUMN haven_tba_address VARCHAR(255),
ADD COLUMN haven_metadata_uri TEXT,
ADD COLUMN haven_registered BOOLEAN DEFAULT FALSE,
ADD COLUMN haven_registered_at TIMESTAMP;

-- MongoDB
// agents collection
{
  _id: "agent_001",
  name: "My Bot",
  // ... existing fields
  haven: {
    tokenId: "46",
    tbaAddress: "0x120062C24C899190bC6676D71f202F7422264255",
    metadataUri: "data:application/json;base64,...",
    registered: true,
    registeredAt: ISODate("2026-03-07T10:30:00Z")
  }
}
```

---

## 🧪 Testing

### Test di Local Clawdbot

```bash
# 1. Start Clawdbot dev server
cd /path/to/clawdbot
npm run dev

# 2. Open browser
http://localhost:3000/agents/create

# 3. Create agent dan click "Register on Haven"
# 4. Sign transaction di MetaMask
# 5. Check result
```

### Verify Transaction

```
https://testnet.snowscan.xyz/tx/{txHash}
```

---

## 🔗 Quick Links

| Resource | Link |
|----------|------|
| Contract Address | `0xE5fB1158B69933d215c99adfd23D16d6e6293294` |
| Component Location | `/root/soft/frontend/src/components/HavenRegistration.tsx` |
| Documentation | `/root/soft/integration-clawdbot/INTEGRATION_GUIDE.md` |

---

## ✅ Checklist Integration

```
[ ] Copy components ke Clawdbot
[ ] Install dependencies (ethers, framer-motion)
[ ] Tambah button di Create Agent page
[ ] Update database schema
[ ] Handle success/error states
[ ] Test di Fuji testnet
[ ] Deploy to production
```

---

**Pilih Option 1** jika ingin yang paling cepat dan mudah! 🚀
