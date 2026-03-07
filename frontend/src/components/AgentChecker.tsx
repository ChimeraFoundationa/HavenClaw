import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ethers } from 'ethers'
import {
  Bot,
  CheckCircle,
  Loader2,
  AlertCircle,
  Wallet,
  Sparkles,
  Key,
  ExternalLink,
  RefreshCw,
  Plug,
  ArrowRight,
  Shield,
  Cpu
} from 'lucide-react'
import {
  ERC8004_CONFIG,
  ONE_CLICK_REGISTRAR,
  NETWORK_CONFIG,
  INTEGRATION_PLATFORMS,
  CLAWDBOT_CONFIG
} from '../data/constants'
import { HavenRegistration } from './HavenRegistration'

declare global {
  interface Window {
    ethereum?: any
  }
}

// ============================================================================
// Types
// ============================================================================
interface AgentData {
  tokenId: string
  owner: string
  metadataURI: string
  tbaAddress: string
  capabilities: string[]
  createdAt: number
  clawdbotAgentId?: string
}

interface AgentCheckerProps {
  clawdbotEndpoint?: string
  onAgentFound?: (agent: AgentData) => void
  onRegistrationComplete?: (result: any) => void
}

type CheckerStep =
  | 'idle'
  | 'connecting'
  | 'checking'
  | 'has_agent'
  | 'no_agent'
  | 'error'

// ============================================================================
// Component
// ============================================================================
export function AgentChecker({
  clawdbotEndpoint,
  onAgentFound,
  onRegistrationComplete
}: AgentCheckerProps) {
  const [step, setStep] = useState<CheckerStep>('idle')
  const [error, setError] = useState<string | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [agentData, setAgentData] = useState<AgentData | null>(null)
  const [showRegistration, setShowRegistration] = useState(false)
  const [showIntegration, setShowIntegration] = useState(false)

  // ============================================================================
  // Check if wallet has ERC-8004 agent
  // ============================================================================
  const checkAgentStatus = async () => {
    setStep('connecting')
    setError(null)

    try {
      // Check wallet
      if (!window.ethereum) {
        throw new Error('Please install MetaMask or another Web3 wallet')
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      setWalletAddress(address)

      setStep('checking')

      // Check network
      const network = await provider.getNetwork()
      if (network.chainId !== BigInt(NETWORK_CONFIG.FUJI.CHAIN_ID)) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${NETWORK_CONFIG.FUJI.CHAIN_ID.toString(16)}` }],
          })
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${NETWORK_CONFIG.FUJI.CHAIN_ID.toString(16)}`,
                chainName: NETWORK_CONFIG.FUJI.CHAIN_NAME,
                nativeCurrency: NETWORK_CONFIG.FUJI.NATIVE_CURRENCY,
                rpcUrls: [NETWORK_CONFIG.FUJI.RPC_URL],
                blockExplorerUrls: [NETWORK_CONFIG.FUJI.EXPLORER_URL]
              }],
            })
          } else {
            throw new Error('Please switch to Avalanche Fuji testnet')
          }
        }
      }

      // Query One-Click Registrar for latest agent (PRIMARY METHOD)
      const registrarContract = new ethers.Contract(
        ONE_CLICK_REGISTRAR.ADDRESS,
        ONE_CLICK_REGISTRAR.ABI,
        provider
      )

      // Also query ERC-8004 contract as fallback
      const registryContract = new ethers.Contract(
        ERC8004_CONFIG.AGENT_REGISTRY_ADDRESS,
        ERC8004_CONFIG.ABI,
        provider
      )

      // Method 1: Check via One-Click Registrar (recommended)
      let latestAgent
      try {
        latestAgent = await registrarContract.getLatestAgent(address)
        console.log('One-Click Registrar result:', latestAgent)
      } catch (err) {
        console.log('No agent found in One-Click Registrar')
        latestAgent = null
      }

      // Method 2: Check ERC-8004 balance as fallback
      let balance: bigint = BigInt(0)
      if (!latestAgent || latestAgent.erc8004TokenId === BigInt(0)) {
        try {
          balance = await registryContract.balanceOf(address)
          console.log('ERC-8004 balance:', balance.toString())
        } catch {
          balance = BigInt(0)
        }
      }

      // Determine if user has an agent
      const hasAgent = (latestAgent && latestAgent.erc8004TokenId > BigInt(0)) || balance > BigInt(0)

      if (hasAgent) {
        // Get agent details
        const tokenId = latestAgent && latestAgent.erc8004TokenId > BigInt(0)
          ? latestAgent.erc8004TokenId.toString()
          : (await registryContract.tokenByIndex(0)).toString()

        let metadataURI = ''
        let capabilities: string[] = []
        let createdAt = 0
        let clawdbotAgentId: string | undefined

        // Get metadata URI from registrar or ERC-8004
        if (latestAgent?.metadataURI) {
          metadataURI = latestAgent.metadataURI
        } else {
          try {
            metadataURI = await registryContract.tokenURI(tokenId)
          } catch {
            metadataURI = ''
          }
        }

        // Parse metadata URI for capabilities and Clawdbot ID
        if (metadataURI.startsWith('data:application/json;base64,')) {
          try {
            const base64 = metadataURI.split(',')[1]
            const metadata = JSON.parse(atob(base64))
            capabilities = metadata.capabilities || []
            createdAt = metadata.registeredAt
              ? new Date(metadata.registeredAt).getTime()
              : Date.now()
            clawdbotAgentId = metadata.clawdbot_agent_id
          } catch (e) {
            console.warn('Could not parse metadata URI:', e)
          }
        }

        const agent: AgentData = {
          tokenId,
          owner: address,
          metadataURI,
          tbaAddress: latestAgent?.tbaAddress || '',
          capabilities,
          createdAt,
          clawdbotAgentId
        }

        setAgentData(agent)
        setStep('has_agent')
        onAgentFound?.(agent)
      } else {
        setStep('no_agent')
      }

    } catch (err: any) {
      console.error('Agent check failed:', err)
      setError(err.message || 'Failed to check agent status')
      setStep('error')
    }
  }

  // ============================================================================
  // Handle integration with platform
  // ============================================================================
  const handleIntegrate = async (platform: string) => {
    if (!agentData) return

    setShowIntegration(true)

    try {
      // Call Clawdbot integration endpoint
      if (platform === 'clawdbot' && clawdbotEndpoint) {
        const response = await fetch(clawdbotEndpoint, {
          method: 'POST',
          headers: CLAWDBOT_CONFIG.HEADERS,
          body: JSON.stringify({
            action: 'integrate',
            agent_id: agentData.tokenId,
            clawdbot_agent_id: agentData.clawdbotAgentId || agentData.tokenId,
            owner_address: agentData.owner,
            tba_address: agentData.tbaAddress,
            metadata_uri: agentData.metadataURI,
            capabilities: agentData.capabilities
          })
        })

        const result = await response.json()
        console.log('Clawdbot integration result:', result)
        
        if (result.success) {
          alert('Successfully integrated with Clawdbot!')
        } else {
          alert('Integration failed: ' + (result.error || 'Unknown error'))
        }
      } else if (platform === 'haven') {
        // Haven integration is already done via smart contract
        alert('Your agent is already integrated with Haven Framework!')
      }
    } catch (err: any) {
      console.error('Integration failed:', err)
      alert('Integration failed: ' + err.message)
    } finally {
      setShowIntegration(false)
    }
  }

  // ============================================================================
  // Render
  // ============================================================================
  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {/* ======================================================================
            IDLE STATE - Show connect button
        ====================================================================== */}
        {step === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card p-8 text-center bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Bot className="w-10 h-10 text-white" />
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">
              Check Your Agent Status
            </h3>
            <p className="text-gray-400 mb-6">
              Connect your wallet to check if you already have an ERC-8004 agent
            </p>

            <button
              onClick={checkAgentStatus}
              className="w-full py-4 px-6 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/25"
            >
              <Wallet className="w-5 h-5" />
              Connect Wallet & Check Status
            </button>

            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-white/5 rounded-lg">
                <Shield className="w-5 h-5 mx-auto mb-2 text-indigo-400" />
                <p className="text-xs text-gray-400">ERC-8004</p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <Key className="w-5 h-5 mx-auto mb-2 text-cyan-400" />
                <p className="text-xs text-gray-400">ERC-6551 TBA</p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <Cpu className="w-5 h-5 mx-auto mb-2 text-purple-400" />
                <p className="text-xs text-gray-400">AI Ready</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ======================================================================
            CHECKING STATE
        ====================================================================== */}
        {step === 'connecting' || step === 'checking' ? (
          <motion.div
            key="checking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="card p-8 text-center bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20"
          >
            <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              {step === 'connecting' ? 'Connecting Wallet...' : 'Checking Agent Status...'}
            </h3>
            <p className="text-gray-400">
              {step === 'connecting'
                ? 'Please connect your Web3 wallet'
                : 'Querying ERC-8004 contract on Avalanche Fuji'}
            </p>
          </motion.div>
        ) : null}

        {/* ======================================================================
            ERROR STATE
        ====================================================================== */}
        {step === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="card p-8 text-center bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20"
          >
            <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Check Failed</h3>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={checkAgentStatus}
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </motion.div>
        )}

        {/* ======================================================================
            NO AGENT STATE - Show registration
        ====================================================================== */}
        {step === 'no_agent' && (
          <motion.div
            key="no_agent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="card p-8 text-center bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                No Agent Found
              </h3>
              <p className="text-gray-400 mb-6">
                You don't have an ERC-8004 agent yet. Create one now to get started!
              </p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Est. Gas Cost</p>
                  <p className="text-sm font-semibold text-white">~0.002 AVAX</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Time</p>
                  <p className="text-sm font-semibold text-white">~15-30s</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Network</p>
                  <p className="text-sm font-semibold text-white">Fuji</p>
                </div>
              </div>

              <button
                onClick={() => setShowRegistration(true)}
                className="w-full py-4 px-6 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/25"
              >
                <Bot className="w-5 h-5" />
                Create Your Agent
              </button>
            </div>

            {showRegistration && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <HavenRegistration
                  agentId={`agent_${Date.now()}`}
                  agentName="My AI Agent"
                  capabilities={['trading', 'analysis']}
                  endpointUrl={clawdbotEndpoint}
                  useClawdbotEndpoint={!!clawdbotEndpoint}
                  onSuccess={(result) => {
                    setStep('has_agent')
                    setAgentData({
                      tokenId: result.tokenId,
                      owner: walletAddress || '',
                      metadataURI: result.metadataURI,
                      tbaAddress: result.tbaAddress,
                      capabilities: ['trading', 'analysis'],
                      createdAt: Date.now()
                    })
                    onRegistrationComplete?.(result)
                    setShowRegistration(false)
                  }}
                  onError={(err) => {
                    setError(err.message)
                    setStep('error')
                  }}
                />
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ======================================================================
            HAS AGENT STATE - Show agent info and integration options
        ====================================================================== */}
        {step === 'has_agent' && agentData && (
          <motion.div
            key="has_agent"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            {/* Agent Info Card */}
            <div className="card p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Agent Found!</h3>
                  <p className="text-sm text-gray-400">Your ERC-8004 agent is ready</p>
                </div>
              </div>

              <div className="space-y-3">
                <InfoRow
                  label="Token ID"
                  value={`#${agentData.tokenId}`}
                  icon={<Sparkles className="w-4 h-4" />}
                />
                <InfoRow
                  label="Owner"
                  value={agentData.owner}
                  icon={<Wallet className="w-4 h-4" />}
                  isAddress
                />
                <InfoRow
                  label="TBA Address"
                  value={agentData.tbaAddress}
                  icon={<Key className="w-4 h-4" />}
                  isAddress
                />
                {agentData.capabilities.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Capabilities</p>
                    <div className="flex flex-wrap gap-2">
                      {agentData.capabilities.map((cap, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-xs text-indigo-400"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <a
                  href={`${NETWORK_CONFIG.FUJI.EXPLORER_URL}/token/${ERC8004_CONFIG.AGENT_REGISTRY_ADDRESS}?a=${agentData.tokenId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on Explorer
                </a>
              </div>
            </div>

            {/* Integration Options */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Plug className="w-5 h-5 text-cyan-400" />
                Integrate With
              </h3>

              <div className="space-y-3">
                {/* Clawdbot Integration */}
                <button
                  onClick={() => handleIntegrate('clawdbot')}
                  className="w-full p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 border border-cyan-500/30 rounded-xl transition-all flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                      Clawdbot
                    </h4>
                    <p className="text-sm text-gray-400">
                      AI Agent platform with advanced analytics
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                </button>

                {/* Haven Integration */}
                <button
                  onClick={() => handleIntegrate('haven')}
                  className="w-full p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border border-indigo-500/30 rounded-xl transition-all flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-white group-hover:text-indigo-400 transition-colors">
                      Haven Framework
                    </h4>
                    <p className="text-sm text-gray-400">
                      Autonomous agent coordination protocol
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-400 transition-colors" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={checkAgentStatus}
                className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Re-check
              </button>
              <button
                onClick={() => {
                  setStep('idle')
                  setWalletAddress(null)
                  setAgentData(null)
                }}
                className="flex-1 py-3 px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-all"
              >
                Change Wallet
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================================
// Helper Components
// ============================================================================
function InfoRow({
  label,
  value,
  icon,
  isAddress = false
}: {
  label: string
  value: string
  icon: React.ReactNode
  isAddress?: boolean
}) {
  const displayValue = isAddress
    ? `${value.slice(0, 6)}...${value.slice(-4)}`
    : value

  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-gray-400">{icon}</span>
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <span className="text-sm font-mono text-white">{displayValue}</span>
    </div>
  )
}

export default AgentChecker
