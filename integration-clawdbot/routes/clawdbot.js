// routes/clawdbot.js
import express from 'express'
import { ethers } from 'ethers'
import axios from 'axios'
import { uploadMetadataToIPFS } from '../utils/ipfs.js'
import { logger } from '../middleware/logger.js'
import rateLimit from 'express-rate-limit'

const router = express.Router()

// Configuration
const RPC_URL = process.env.AVALANCHE_FUJI_RPC || 'https://api.avax-test.network/ext/bc/C/rpc'
const PRIVATE_KEY = process.env.REGISTRAR_PRIVATE_KEY
const ONE_CLICK_ADDRESS = process.env.ONE_CLICK_REGISTRAR_ADDRESS
const CLAWDBOT_API_KEY = process.env.CLAWDBOT_API_KEY
const CLAWDBOT_ANALYZE_URL = process.env.CLAWDBOT_ANALYZE_URL || 'https://api.clawdbot.ai/agent/analyze'

// Validate configuration
if (!PRIVATE_KEY || !ONE_CLICK_ADDRESS) {
  logger.error('Missing required environment variables')
  throw new Error('Missing REGISTRY_PRIVATE_KEY or ONE_CLICK_REGISTRAR_ADDRESS')
}

// Initialize provider and signer
const provider = new ethers.JsonRpcProvider(RPC_URL)
const signer = new ethers.Wallet(PRIVATE_KEY, provider)

// ABI minimal untuk OneClickAgentRegistrar
const ONE_CLICK_ABI = [
  'function registerAgentWithStrings(string memory metadataURI, string[] memory capabilities) external returns (uint256, address)',
  'function getLatestAgent(address user) external view returns (tuple(uint256 erc8004TokenId, address tbaAddress, string metadataURI, uint256 registeredAt))',
  'function getUserAgents(address user) external view returns (tuple(uint256 erc8004TokenId, address tbaAddress, string metadataURI, uint256 registeredAt)[])',
  'event AgentOneClickRegistered(address indexed owner, uint256 indexed erc8004TokenId, address indexed tbaAddress, string metadataURI, bytes32[] capabilities)'
]

const registrar = new ethers.Contract(ONE_CLICK_ADDRESS, ONE_CLICK_ABI, signer)

// Rate limiter untuk API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, error: 'Too many requests, please try again later' }
})

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 registrations per hour
  message: { success: false, error: 'Too many registration requests, please try again later' }
})

// Clawdbot API Key validation middleware
function validateClawdbotAuth(req, res, next) {
  const apiKey = req.headers['x-clawdbot-api-key']
  
  if (!apiKey) {
    return res.status(401).json({ 
      success: false, 
      error: 'Missing API key. Please provide x-clawdbot-api-key header' 
    })
  }
  
  if (CLAWDBOT_API_KEY && apiKey !== CLAWDBOT_API_KEY) {
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid API key' 
    })
  }
  
  next()
}

/**
 * POST /api/v1/clawdbot/register
 * Register agent from Clawdbot to ERC-8004 + Haven Framework
 */
router.post('/register', apiLimiter, registerLimiter, validateClawdbotAuth, async (req, res) => {
  const requestId = Date.now().toString(36)
  logger.info(`[ ${requestId} ] Registration request received`, { body: req.body })

  try {
    const {
      clawdbot_agent_id,
      name,
      owner_address,
      capabilities,
      metadata,
      skip_clawdbot_analysis = false
    } = req.body

    // Validate required fields
    if (!name || !owner_address) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, owner_address'
      })
    }

    if (!capabilities || !Array.isArray(capabilities) || capabilities.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Capabilities array is required and must not be empty'
      })
    }

    // Validate Ethereum address
    if (!ethers.isAddress(owner_address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address format'
      })
    }

    // Optional: Analyze with Clawdbot first
    let enhancedCapabilities = capabilities
    if (!skip_clawdbot_analysis && CLAWDBOT_API_KEY) {
      try {
        logger.info(`[ ${requestId} ] Analyzing agent with Clawdbot...`)
        const analysis = await analyzeWithClawdbot({
          clawdbot_agent_id,
          name,
          capabilities,
          metadata
        })
        
        if (analysis.suggested_capabilities && analysis.suggested_capabilities.length > 0) {
          enhancedCapabilities = [...new Set([...capabilities, ...analysis.suggested_capabilities])]
          logger.info(`[ ${requestId} ] Enhanced capabilities from Clawdbot analysis`, { 
            original: capabilities, 
            enhanced: enhancedCapabilities 
          })
        }
      } catch (analysisError) {
        logger.warn(`[ ${requestId} ] Clawdbot analysis failed, continuing with original capabilities`, { 
          error: analysisError.message 
        })
        // Continue with original capabilities
      }
    }

    // Generate metadata URI
    logger.info(`[ ${requestId} ] Uploading metadata to IPFS...`)
    const metadataURI = await uploadMetadataToIPFS({
      name,
      clawdbot_agent_id,
      owner: owner_address,
      capabilities: enhancedCapabilities,
      description: metadata?.description || `AI Agent created on Clawdbot`,
      ...metadata,
      registered_at: new Date().toISOString(),
      source: 'clawdbot'
    })

    // Check if agent already exists
    try {
      const existingAgent = await registrar.getLatestAgent(owner_address)
      if (existingAgent.erc8004TokenId > 0) {
        logger.info(`[ ${requestId} ] Agent already registered for this address`, { 
          existing_token_id: existingAgent.erc8004TokenId.toString() 
        })
        return res.status(200).json({
          success: true,
          data: {
            clawdbot_agent_id,
            erc8004_token_id: existingAgent.erc8004TokenId.toString(),
            tba_address: existingAgent.tbaAddress,
            agent_address: owner_address,
            metadata_uri: existingAgent.metadataURI,
            already_registered: true,
            registered_at: new Date(Number(existingAgent.registeredAt) * 1000).toISOString()
          },
          message: 'Agent already registered for this address'
        })
      }
    } catch (e) {
      // Agent doesn't exist, continue with registration
    }

    // Execute one-click registration
    logger.info(`[ ${requestId} ] Executing blockchain registration...`)
    const tx = await registrar.registerAgentWithStrings(metadataURI, enhancedCapabilities)
    
    logger.info(`[ ${requestId} ] Transaction submitted`, { txHash: tx.hash })

    // Wait for confirmation
    const receipt = await tx.wait()
    logger.info(`[ ${requestId} ] Transaction confirmed`, { 
      txHash: tx.hash, 
      blockNumber: receipt.blockNumber 
    })

    // Parse events
    const event = receipt.logs?.find(log => {
      try {
        const parsed = registrar.interface.parseLog(log)
        return parsed?.name === 'AgentOneClickRegistered'
      } catch {
        return false
      }
    })

    if (!event) {
      throw new Error('Could not parse registration event')
    }

    const parsed = registrar.interface.parseLog(event)
    const erc8004TokenId = parsed.args[1].toString()
    const tbaAddress = parsed.args[2]

    logger.info(`[ ${requestId} ] Registration successful`, {
      token_id: erc8004TokenId,
      tba: tbaAddress
    })

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
        capabilities: enhancedCapabilities,
        registered_at: new Date().toISOString(),
        explorer_url: `https://testnet.snowscan.xyz/tx/${receipt.hash}`
      },
      message: 'Agent successfully registered on Haven Framework'
    })

  } catch (error) {
    logger.error(`[ ${requestId} ] Registration failed`, { error: error.message, stack: error.stack })
    res.status(500).json({
      success: false,
      error: error.message || 'Registration failed',
      request_id: requestId
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
    
    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address format'
      })
    }

    const agentInfo = await registrar.getLatestAgent(address)
    
    if (agentInfo.erc8004TokenId === 0n) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found for this address'
      })
    }
    
    res.json({
      success: true,
      data: {
        address,
        erc8004_token_id: agentInfo.erc8004TokenId.toString(),
        tba_address: agentInfo.tbaAddress,
        metadata_uri: agentInfo.metadataURI,
        registered_at: new Date(Number(agentInfo.registeredAt) * 1000).toISOString()
      }
    })
  } catch (error) {
    logger.error('Error fetching agent info:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/v1/clawdbot/analyze
 * Analyze agent with Clawdbot before registration
 */
router.post('/analyze', validateClawdbotAuth, async (req, res) => {
  try {
    const analysis = await analyzeWithClawdbot(req.body)
    
    res.json({
      success: true,
      data: analysis,
      message: 'Agent analysis completed'
    })
  } catch (error) {
    logger.error('Analysis failed:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Helper function: Analyze with Clawdbot
async function analyzeWithClawdbot(agentData) {
  const response = await axios.post(
    CLAWDBOT_ANALYZE_URL,
    {
      agent_id: agentData.clawdbot_agent_id,
      name: agentData.name,
      capabilities: agentData.capabilities,
      metadata: agentData.metadata
    },
    {
      headers: {
        'Authorization': `Bearer ${CLAWDBOT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    }
  )

  return response.data
}

export default router
