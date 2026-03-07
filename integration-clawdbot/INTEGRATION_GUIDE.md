# 🤖 Clawdbot × Haven Framework Integration Guide

## 📋 Overview

Integrasi **Clawdbot** dengan **Haven Framework** memungkinkan AI agent yang dibuat di Clawdbot untuk:
- ✅ Mendapatkan identitas on-chain (ERC-8004 NFT)
- ✅ Memiliki Token Bound Account (ERC-6551 TBA)
- ✅ Terdaftar di Haven Agent Registry
- ✅ Berpartisipasi dalam governance HAVEN token
- ✅ Akses ke prediction markets dan task collective

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│         Clawdbot × Haven Integration Flow                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. User Creates Agent di Clawdbot                       │
│         ↓                                                │
│  2. Click "Register on Haven" Button                     │
│         ↓                                                │
│  3. Sign Transaction (MetaMask)                          │
│         ↓                                                │
│  4. OneClick Registrar Contract                          │
│     ├─ ERC-8004 Registry (mint NFT)                     │
│     ├─ ERC-6551 Registry (create TBA)                   │
│     └─ Haven Agent Registry (register agent)            │
│         ↓                                                │
│  5. Registration Complete                                │
│     ├─ Token ID                                         │
│     ├─ TBA Address                                      │
│     └─ Metadata URI (includes Clawdbot ID)              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Smart Contracts (Deployed on Fuji)

| Contract | Address | Purpose |
|----------|---------|---------|
| **OneClickAgentRegistrar** | `0xE5fB1158B69933d215c99adfd23D16d6e6293294` | One-click registration |
| **ERC8004AgentRegistry** | `0x187A01e251dF08D5908d61673EeF1157306F974C` | ERC-8004 identity |
| **ERC6551Registry** | `0xaCA0fA40b2eaAdcdF1c72cB36e88aBd76C0EA464` | Token Bound Accounts |
| **AgentRegistry** | `0x58EcC1A3B5a9c78f59A594120405058FB40a3201` | Haven agent registry |

---

## 🎯 Integration Methods

### Method 1: Frontend Component (Recommended)

Tambahkan component React langsung di UI Clawdbot:

#### Step 1: Install Dependencies

```bash
# Di project Clawdbot
npm install ethers@6 framer-motion lucide-react
```

#### Step 2: Copy Component Files

```bash
# Copy dari Haven frontend ke Clawdbot project
cp /root/soft/frontend/src/components/HavenRegistration.tsx src/components/
cp /root/soft/frontend/src/components/AgentChecker.tsx src/components/
cp /root/soft/frontend/src/data/constants.ts src/data/
```

#### Step 3: Usage di Clawdbot

```tsx
// Di page create/edit agent Clawdbot
import { HavenRegistration } from '@/components/HavenRegistration'

function CreateAgentPage() {
  const [agentData, setAgentData] = useState({...})

  const handleSuccess = async (result) => {
    // Save result ke Clawdbot database
    await api.updateAgent(agentData.id, {
      haven_token_id: result.tokenId,
      haven_tba_address: result.tbaAddress,
      haven_registered: true,
      haven_metadata_uri: result.metadataURI
    })

    alert('✅ Agent registered on Haven Framework!')
  }

  return (
    <div>
      {/* Form create agent */}
      <AgentForm data={agentData} />

      {/* Haven registration */}
      <HavenRegistration
        agentId={agentData.id}
        agentName={agentData.name}
        capabilities={agentData.capabilities}
        metadata={{
          description: agentData.description,
          model: agentData.model,
          clawdbot_url: window.location.origin
        }}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
```

---

### Method 2: Direct Web3 Call

Jika ingin custom implementation:

```javascript
import { ethers } from 'ethers'

const ONE_CLICK_ADDRESS = '0xE5fB1158B69933d215c99adfd23D16d6e6293294'

const ONE_CLICK_ABI = [
  'function registerAgentWithStrings(string memory metadataURI, string[] memory capabilities) external returns (uint256, address)',
  'event AgentOneClickRegistered(address indexed owner, uint256 indexed erc8004TokenId, address indexed tbaAddress, string metadataURI, bytes32[] capabilities)'
]

async function registerAgentOnHaven(agentData, signerAddress) {
  // 1. Connect wallet
  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  
  // 2. Check network
  const network = await provider.getNetwork()
  if (network.chainId !== 43113n) {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xa869' }] // 43113 in hex
    })
  }
  
  // 3. Connect to contract
  const contract = new ethers.Contract(ONE_CLICK_ADDRESS, ONE_CLICK_ABI, signer)
  
  // 4. Prepare metadata dengan Clawdbot info
  const metadata = {
    name: agentData.name,
    clawdbot_agent_id: agentData.id,
    owner: signerAddress,
    capabilities: agentData.capabilities,
    registeredAt: new Date().toISOString(),
    source: 'clawdbot',
    version: '1.0.0',
    ...agentData.metadata
  }
  
  // 5. Create metadata URI (data URI)
  const json = JSON.stringify(metadata, null, 2)
  const base64 = btoa(json)
  const metadataURI = `data:application/json;base64,${base64}`
  
  // 6. Execute registration
  const tx = await contract.registerAgentWithStrings(
    metadataURI,
    agentData.capabilities
  )
  
  // 7. Wait for confirmation
  const receipt = await tx.wait()
  
  // 8. Parse event
  const event = receipt.logs.find(log => {
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
}

// Usage
const result = await registerAgentOnHaven(agentData, userAddress)
console.log('Registered!', result)
```

---

## 📊 Metadata Format

Metadata yang disimpan di ERC-8004 NFT:

```json
{
  "name": "Trading Bot Alpha",
  "clawdbot_agent_id": "agent_12345",
  "owner": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "capabilities": ["trading", "analysis", "prediction"],
  "registeredAt": "2026-03-07T10:30:00.000Z",
  "source": "clawdbot",
  "version": "1.0.0",
  "description": "Advanced ML trading bot",
  "model": "gpt-4",
  "metadata": {
    "strategy": "momentum",
    "risk_level": "medium"
  }
}
```

### Important Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Agent name |
| `clawdbot_agent_id` | string | ✅ | ID dari Clawdbot |
| `owner` | address | ✅ | Owner wallet address |
| `capabilities` | string[] | ✅ | Agent capabilities |
| `registeredAt` | string | ✅ | ISO timestamp |
| `source` | string | ✅ | Must be "clawdbot" |
| `version` | string | ✅ | Metadata version |

---

## 🔍 Query Agent Status

### Check if User Has Agent

```javascript
const contract = new ethers.Contract(
  ONE_CLICK_ADDRESS,
  ['function getLatestAgent(address) view returns (tuple(uint256 erc8004TokenId, address tbaAddress, string metadataURI, uint256 registeredAt))'],
  provider
)

const agent = await contract.getLatestAgent(userAddress)

if (agent.erc8004TokenId > 0) {
  console.log('User has agent:', {
    tokenId: agent.erc8004TokenId.toString(),
    tba: agent.tbaAddress,
    metadata: agent.metadataURI
  })
} else {
  console.log('User has no agent')
}
```

### Get All User Agents

```javascript
const agents = await contract.getUserAgents(userAddress)
console.log(`User has ${agents.length} agent(s)`)

agents.forEach(agent => {
  console.log({
    tokenId: agent.erc8004TokenId.toString(),
    tba: agent.tbaAddress
  })
})
```

---

## 🎨 UI Components

### AgentChecker Component

Component untuk check status dan show integration options:

```tsx
import { AgentChecker } from '@/components/AgentChecker'

function IntegrationPage() {
  return (
    <AgentChecker
      clawdbotEndpoint="http://localhost:3000/api/v1/clawdbot/integrate"
      onAgentFound={(agent) => {
        console.log('Agent found:', agent)
        // agent.tokenId, agent.tbaAddress, agent.clawdbotAgentId
      }}
      onRegistrationComplete={(result) => {
        console.log('Registration complete:', result)
        // Update Clawdbot database
      }}
    />
  )
}
```

**Features:**
- ✅ Auto-detect if wallet has ERC-8004 agent
- ✅ Show registration form if no agent
- ✅ Show integration options if has agent
- ✅ Support Clawdbot API integration

---

## 🧪 Testing

### Test Registration

```bash
# 1. Go to frontend
cd /root/soft/frontend

# 2. Start dev server
npm run dev

# 3. Open browser
http://localhost:5173/clawdbot

# 4. Connect MetaMask (Fuji testnet)
# 5. Click "Check Agent Status"
# 6. Follow registration flow
```

### Verify on Explorer

Setelah registration, verify di:
```
https://testnet.snowscan.xyz/address/0xE5fB1158B69933d215c99adfd23D16d6e6293294
```

---

## 📈 Gas Costs

| Operation | Gas Estimate | Cost (AVAX) | Cost (USD) |
|-----------|--------------|-------------|------------|
| Register Agent | ~500,000 | ~0.002 | ~$0.08 |
| Check Status | ~50,000 | ~0.0002 | ~$0.008 |
| Integrate | ~200,000 | ~0.0008 | ~$0.03 |

*Prices may vary based on network congestion*

---

## 🔐 Security Considerations

### For Clawdbot

1. **Never store private keys** - User signs transactions directly
2. **Validate metadata** - Ensure Clawdbot agent ID is included
3. **Handle errors gracefully** - Network switches, rejections
4. **Rate limiting** - If using API endpoint

### For Users

1. **Verify contract addresses** - Use deployed addresses above
2. **Check network** - Must be Avalanche Fuji
3. **Review transaction** - Check metadata before signing
4. **Save Token ID** - Needed for future interactions

---

## 🚀 Production Deployment

### Update Contract Addresses

Untuk Avalanche Mainnet (setelah deployment):

```typescript
// src/data/constants.ts
export const ONE_CLICK_REGISTRAR = {
  ADDRESS: '0x...' // Update after mainnet deployment
}
```

### Environment Variables

```bash
# .env
VITE_HAVEN_CONTRACT_ADDRESS=0x...
VITE_CLAWDBOT_API_URL=https://api.clawdbot.ai
VITE_AVALANCHE_RPC_URL=https://api.avax.network/ext/bc/C/rpc
```

---

## 📞 Support & Resources

### Documentation
- [Haven Framework Docs](/contracts/README.md)
- [ERC-8004 Spec](https://github.com/erc-8004)
- [ERC-6551 Spec](https://eips.ethereum.org/EIPS/eip-6551)

### Contract Source
- [OneClickAgentRegistrar.sol](/contracts/src/core/OneClickAgentRegistrar.sol)
- [ERC8004AgentRegistry.sol](/contracts/src/core/ERC8004AgentRegistry.sol)

### Tools
- [Snowscan Explorer](https://testnet.snowscan.xyz)
- [Avalanche Faucet](https://core.app/tools/testnet-faucet)

---

## ✅ Integration Checklist

| Task | Status |
|------|--------|
| Copy components ke Clawdbot | ⬜ |
| Update contract addresses | ⬜ |
| Test registration flow | ⬜ |
| Save Token ID ke database | ⬜ |
| Add UI button di Clawdbot | ⬜ |
| Handle success/error states | ⬜ |
| Test on Fuji testnet | ⬜ |
| Deploy to production | ⬜ |

---

## 🎉 Example Implementation

Lihat implementasi lengkap di:
```
/root/soft/frontend/src/pages/ClawdbotIntegration.tsx
/root/soft/frontend/src/components/HavenRegistration.tsx
/root/soft/frontend/src/components/AgentChecker.tsx
```

---

**Last Updated**: March 7, 2026  
**Version**: 1.0.0  
**Network**: Avalanche Fuji Testnet
