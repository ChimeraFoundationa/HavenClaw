/**
 * HavenClaw Dashboard Server
 * Server-side wallet connection - no MetaMask needed
 */

import express from 'express'
import { ethers } from 'ethers'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Configuration
const RPC_URL = 'https://api.avax-test.network/ext/bc/C/rpc'
const PRIVATE_KEY = process.env.HAVENCLAW_PRIVATE_KEY

if (!PRIVATE_KEY) {
  console.error('❌ HAVENCLAW_PRIVATE_KEY environment variable not set!')
  console.error('Please set: export HAVENCLAW_PRIVATE_KEY=your_key_here')
  process.exit(1)
}

// Initialize provider and signer
const provider = new ethers.JsonRpcProvider(RPC_URL)
const signer = new ethers.Wallet(PRIVATE_KEY, provider)

// Contract Addresses
const CONTRACTS = {
  AGENT_REGISTRY: '0x913836702a423d75Ae97e439E6CBF12B7Ae3A6eC',
  ERC6551_REGISTRY: '0x6bbA4040a81c779f356B487c9fcE89EE3308C54a',
  ERC8004_REGISTRY: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
}

// Agent Registry ABI
const AGENT_REGISTRY_ABI = [
  'function getAgent(address agent) external view returns (tuple(address agentAddress, string metadataURI, bytes32[] capabilities, uint256 registeredAt, uint256 verifiedAt, bool exists) info)',
  'function event AgentRegistered(address indexed agent, string metadataURI, bytes32[] capabilities, uint256 timestamp)'
]

// Serve static files from dist directory
app.use(express.static(join(__dirname, 'dist')))

// API: Get wallet info
app.get('/api/wallet', async (req, res) => {
  try {
    const balance = await provider.getBalance(signer.address)
    const network = await provider.getNetwork()
    
    res.json({
      address: signer.address,
      balance: ethers.formatEther(balance),
      chainId: Number(network.chainId),
      connected: true
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// API: Get agent info by TBA address
app.get('/api/agent/:address', async (req, res) => {
  try {
    const agentRegistry = new ethers.Contract(CONTRACTS.AGENT_REGISTRY, AGENT_REGISTRY_ABI, provider)
    const agentInfo = await agentRegistry.getAgent(req.params.address)
    
    // Decode metadata
    let metadata = { name: 'Unknown' }
    if (agentInfo.metadataURI && agentInfo.metadataURI.startsWith('data:application/json;base64,')) {
      try {
        const base64Data = agentInfo.metadataURI.replace('data:application/json;base64,', '')
        metadata = JSON.parse(Buffer.from(base64Data, 'base64').toString())
      } catch (e) {
        metadata = { name: agentInfo.metadataURI }
      }
    }
    
    // Decode capabilities
    const capabilities = agentInfo.capabilities.map(cap => {
      try {
        return ethers.decodeBytes32String(cap)
      } catch (e) {
        return cap
      }
    })
    
    res.json({
      address: agentInfo.agentAddress,
      name: metadata.name,
      description: metadata.description || '',
      capabilities: capabilities,
      registeredAt: new Date(Number(agentInfo.registeredAt) * 1000).toISOString(),
      verified: agentInfo.isVerified || false,
      exists: agentInfo.exists
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// API: Get all agents for this wallet (scan past events)
app.get('/api/agents', async (req, res) => {
  try {
    // For now, return known TBAs
    // In production, you'd scan events from AgentRegistry
    const knownTBAs = [
      '0x5eb9F161211F5cd3Ca669dc993585388b5757715', // First agent
    ]
    
    const agents = []
    const agentRegistry = new ethers.Contract(CONTRACTS.AGENT_REGISTRY, AGENT_REGISTRY_ABI, provider)
    
    for (const tba of knownTBAs) {
      try {
        const info = await agentRegistry.getAgent(tba)
        if (info.exists) {
          let metadata = { name: 'Unknown' }
          if (info.metadataURI && info.metadataURI.startsWith('data:application/json;base64,')) {
            try {
              const base64Data = info.metadataURI.replace('data:application/json;base64,', '')
              metadata = JSON.parse(Buffer.from(base64Data, 'base64').toString())
            } catch (e) {}
          }
          
          const capabilities = info.capabilities.map(cap => {
            try {
              return ethers.decodeBytes32String(cap)
            } catch (e) {
              return cap
            }
          })
          
          agents.push({
            address: info.agentAddress,
            name: metadata.name,
            description: metadata.description || '',
            capabilities: capabilities,
            registeredAt: new Date(Number(info.registeredAt) * 1000).toISOString(),
            verified: info.isVerified || false,
          })
        }
      } catch (e) {
        // Agent doesn't exist or error, skip
      }
    }
    
    res.json({ agents, wallet: signer.address })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Serve index.html for all other routes
app.get('/{*path}', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

// Start server
app.listen(PORT, () => {
  console.log('')
  console.log('🏛️  HavenClaw Dashboard Server')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📊 Dashboard: http://localhost:${PORT}`)
  console.log(`🔐 Wallet: ${signer.address}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  console.log('✅ Server-side wallet connection active')
  console.log('✅ No MetaMask connection needed')
  console.log('')
})
