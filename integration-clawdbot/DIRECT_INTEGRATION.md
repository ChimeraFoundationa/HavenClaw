# 🚀 Direct Smart Contract Integration

## Kenapa Tidak Perlu API Layer?

Anda benar - **tidak perlu API layer**! Clawdbot bisa langsung interact dengan smart contract dari frontend/backend mereka.

### Architecture yang Lebih Simple:

```
┌─────────────────────────────────────────────────────────┐
│         Direct Contract Integration                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Clawdbot Frontend/Backend                              │
│         ↓ (direct Web3 call)                            │
│  OneClickAgentRegistrar Contract                        │
│         ↓                                                │
│  Avalanche Blockchain                                   │
│                                                          │
│  ✅ No middleware                                       │
│  ✅ No API server needed                                │
│  ✅ Fully trustless                                     │
│  ✅ Lower latency                                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Cara Integrasi Langsung

### Option 1: Dari Frontend Clawdbot (Recommended)

User connect wallet mereka langsung dari UI Clawdbot:

```javascript
// Di React component Clawdbot
import { ethers } from 'ethers'

const ONE_CLICK_ABI = [
  'function registerAgentWithStrings(string memory metadataURI, string[] memory capabilities) external returns (uint256, address)'
]

const ONE_CLICK_ADDRESS = '0x...' // Deployed contract address

async function registerAgent() {
  // 1. Connect to user's wallet
  if (!window.ethereum) {
    alert('Please install MetaMask')
    return
  }

  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  
  // 2. Connect to contract
  const contract = new ethers.Contract(ONE_CLICK_ADDRESS, ONE_CLICK_ABI, signer)
  
  // 3. Prepare metadata
  const metadata = {
    name: agentName,
    clawdbot_agent_id: agentId,
    capabilities: capabilities,
    createdAt: new Date().toISOString()
  }
  const metadataURI = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`
  
  // 4. Call contract (user will sign transaction)
  const tx = await contract.registerAgentWithStrings(metadataURI, capabilities)
  
  // 5. Wait for confirmation
  const receipt = await tx.wait()
  
  console.log('Agent registered!', receipt)
  
  // 6. Parse event untuk dapat token ID dan TBA address
  const event = receipt.logs.find(log => {
    try {
      const parsed = contract.interface.parseLog(log)
      return parsed?.name === 'AgentOneClickRegistered'
    } catch { return false }
  })
  
  const parsed = contract.interface.parseLog(event)
  const tokenId = parsed.args[1].toString()
  const tbaAddress = parsed.args[2]
  
  // 7. Save to Clawdbot database
  await saveToDatabase({ tokenId, tbaAddress })
}
```

### Option 2: Dari Backend Clawdbot (Server-side)

Jika Clawdbot punya server wallet untuk pay gas:

```javascript
// Node.js backend
import { ethers } from 'ethers'

const provider = new ethers.JsonRpcProvider('https://api.avax-test.network/ext/bc/C/rpc')
const signer = new ethers.Wallet(process.env.CLAWDBOT_WALLET_PRIVATE_KEY, provider)

const contract = new ethers.Contract(ONE_CLICK_ADDRESS, ONE_CLICK_ABI, signer)

async function registerAgentForUser(agentData, userAddress) {
  const metadataURI = generateMetadataURI(agentData)
  
  // Call contract
  const tx = await contract.registerAgentWithStrings(metadataURI, agentData.capabilities)
  const receipt = await tx.wait()
  
  // Parse event
  const event = receipt.logs.find(...)
  const parsed = contract.interface.parseLog(event)
  
  return {
    tokenId: parsed.args[1].toString(),
    tbaAddress: parsed.args[2],
    txHash: receipt.hash
  }
}
```

## React Component untuk Clawdbot

Saya buatkan component yang bisa langsung di-embed:

```tsx
// components/HavenRegistration.tsx
import { useState } from 'react'
import { ethers } from 'ethers'

const ONE_CLICK_ADDRESS = '0x...' // Your deployed contract
const ONE_CLICK_ABI = [
  'function registerAgentWithStrings(string,string[]) returns (uint256,address)',
  'event AgentOneClickRegistered(address indexed owner, uint256 indexed tokenId, address indexed tba, string metadataURI, bytes32[] capabilities)'
]

interface HavenRegistrationProps {
  agentId: string
  agentName: string
  capabilities: string[]
  onSuccess?: (result: HavenResult) => void
}

interface HavenResult {
  tokenId: string
  tbaAddress: string
  txHash: string
}

export function HavenRegistration({ agentId, agentName, capabilities, onSuccess }: HavenRegistrationProps) {
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRegister = async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask')
      return
    }

    setIsRegistering(true)
    setError(null)

    try {
      // Connect wallet
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      
      // Check network
      const network = await provider.getNetwork()
      if (network.chainId !== 43113n) { // Fuji testnet
        // Switch to Fuji
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xa869' }], // 43113 in hex
        })
      }

      // Connect to contract
      const contract = new ethers.Contract(ONE_CLICK_ADDRESS, ONE_CLICK_ABI, signer)

      // Generate metadata URI (data URI for simplicity)
      const metadata = {
        name: agentName,
        clawdbot_agent_id: agentId,
        capabilities,
        registeredAt: new Date().toISOString()
      }
      const metadataURI = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`

      // Execute registration
      const tx = await contract.registerAgentWithStrings(metadataURI, capabilities)
      
      // Wait for confirmation
      const receipt = await tx.wait()

      // Parse event
      const event = receipt.logs?.find(log => {
        try {
          const parsed = contract.interface.parseLog(log)
          return parsed?.name === 'AgentOneClickRegistered'
        } catch { return false }
      })

      const parsed = contract.interface.parseLog(event)
      
      const result: HavenResult = {
        tokenId: parsed.args[1].toString(),
        tbaAddress: parsed.args[2],
        txHash: receipt.hash
      }

      onSuccess?.(result)

    } catch (err: any) {
      console.error('Registration failed:', err)
      setError(err.message || 'Registration failed')
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <div className="haven-registration">
      <button
        onClick={handleRegister}
        disabled={isRegistering}
        className="btn-register"
      >
        {isRegistering ? 'Registering...' : 'Register on Haven'}
      </button>
      
      {error && <div className="error">{error}</div>}
    </div>
  )
}
```

### Usage di Clawdbot:

```tsx
// Di page create agent Clawdbot
import { HavenRegistration } from '@/components/HavenRegistration'

function CreateAgentPage() {
  const [agentData, setAgentData] = useState({...})

  const handleSuccess = async (result) => {
    // Save to Clawdbot database
    await api.updateAgent(agentData.id, {
      haven_token_id: result.tokenId,
      haven_tba_address: result.tbaAddress,
      haven_registered: true
    })
    
    alert('Agent registered on Haven!')
  }

  return (
    <div>
      {/* Form create agent */}
      <AgentForm data={agentData} />
      
      {/* Haven registration button */}
      <HavenRegistration
        agentId={agentData.id}
        agentName={agentData.name}
        capabilities={agentData.capabilities}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
```

## SDK Package (Optional)

Jika mau publish sebagai npm package:

```javascript
// @haven-framework/sdk
import { ethers } from 'ethers'

export class HavenAgent {
  constructor(contractAddress: string, signer: ethers.Signer) {
    this.contract = new ethers.Contract(contractAddress, ABI, signer)
  }

  async register(name: string, capabilities: string[], metadata?: object) {
    const metadataURI = this.createMetadataURI(name, capabilities, metadata)
    const tx = await this.contract.registerAgentWithStrings(metadataURI, capabilities)
    const receipt = await tx.wait()
    
    return this.parseRegistrationResult(receipt)
  }

  private createMetadataURI(name: string, capabilities: string[], metadata?: object) {
    const data = { name, capabilities, ...metadata }
    return `data:application/json;base64,${btoa(JSON.stringify(data))}`
  }

  private parseRegistrationResult(receipt: ethers.TransactionReceipt) {
    const event = receipt.logs.find(...)
    const parsed = this.contract.interface.parseLog(event)
    return {
      tokenId: parsed.args[1].toString(),
      tbaAddress: parsed.args[2],
      txHash: receipt.hash
    }
  }
}

// Usage
const haven = new HavenAgent(CONTRACT_ADDRESS, signer)
const result = await haven.register('My Agent', ['trading', 'analysis'])
```

## Comparison: API vs Direct

| Aspect | API Layer | Direct Contract |
|--------|-----------|-----------------|
| **Complexity** | Higher (need server) | Lower (just Web3) |
| **Trust** | Need to trust API | Fully trustless |
| **Cost** | Server cost | Only gas fees |
| **Latency** | API + Blockchain | Blockchain only |
| **Control** | API controls flow | User controls |
| **Best For** | Managed onboarding | Self-serve |

## Recommendation

**Gunakan Direct Contract** jika:
- ✅ User punya wallet (MetaMask)
- ✅ Mau trustless dan decentralized
- ✅ Tidak mau maintain API server
- ✅ User OK sign transaction

**Gunakan API Layer** jika:
- ✅ Mau abstract away blockchain complexity
- ✅ Need server-side logic (KYC, validation)
- ✅ Mau pay gas untuk user (sponsored)
- ✅ Need rate limiting / access control

## Quick Start - Direct Integration

```bash
# Di project Clawdbot
npm install ethers

# Copy component
cp /root/soft/integration-clawdbot/HavenRegistration.tsx src/components/

# Update contract address
# Edit ONE_CLICK_ADDRESS di component

# Use di page
import { HavenRegistration } from '@/components/HavenRegistration'
```

That's it! Tidak perlu API server sama sekali. 🎉
