// Declare ethereum type
declare global {
  interface Window {
    ethereum?: any
  }
}

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  CheckCircle,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  Bot,
  Key,
  FileText,
  Sparkles,
  ExternalLink
} from 'lucide-react'
import { ethers } from 'ethers'

// One Click Registrar ABI (minimal)
const ONE_CLICK_ABI = [
  'function registerAgentWithStrings(string memory metadataURI, string[] memory capabilities) external returns (uint256, address)',
  'function getLatestAgent(address user) external view returns (tuple(uint256 erc8004TokenId, address tbaAddress, string metadataURI, uint256 registeredAt))',
  'function getUserAgents(address user) external view returns (tuple(uint256 erc8004TokenId, address tbaAddress, string metadataURI, uint256 registeredAt)[])',
  'event AgentOneClickRegistered(address indexed owner, uint256 indexed erc8004TokenId, address indexed tbaAddress, string metadataURI, bytes32[] capabilities)'
]

const ONE_CLICK_ADDRESS = '0x0000000000000000000000000000000000000000' // Update after deployment

interface OneClickRegistrarProps {
  contractAddress?: string
  onSuccess?: (data: RegistrationSuccess) => void
}

interface RegistrationSuccess {
  erc8004TokenId: bigint
  tbaAddress: string
  metadataURI: string
  txHash: string
}

interface RegistrationStep {
  id: number
  title: string
  description: string
  status: 'pending' | 'processing' | 'completed' | 'error'
}

export function OneClickRegistrar({ contractAddress, onSuccess }: OneClickRegistrarProps) {
  const [agentName, setAgentName] = useState('')
  const [capabilities, setCapabilities] = useState<string[]>(['trading', 'analysis'])
  const [customCapability, setCustomCapability] = useState('')
  const [metadataURI, setMetadataURI] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string>('')
  const [result, setResult] = useState<RegistrationSuccess | null>(null)

  const [steps, setSteps] = useState<RegistrationStep[]>([
    {
      id: 1,
      title: 'Register in ERC-8004',
      description: 'Mint your agent identity NFT',
      status: 'pending'
    },
    {
      id: 2,
      title: 'Create Token Bound Account',
      description: 'Setup ERC-6551 wallet for your agent',
      status: 'pending'
    },
    {
      id: 3,
      title: 'Register in Haven Framework',
      description: 'Enable agent coordination features',
      status: 'pending'
    },
    {
      id: 4,
      title: 'Complete',
      description: 'Agent ready for coordination',
      status: 'pending'
    }
  ])

  const addCapability = () => {
    if (customCapability && !capabilities.includes(customCapability)) {
      setCapabilities([...capabilities, customCapability])
      setCustomCapability('')
    }
  }

  const removeCapability = (cap: string) => {
    setCapabilities(capabilities.filter(c => c !== cap))
  }

  const generateMetadataURI = () => {
    // In production, this would upload to IPFS
    const metadata = {
      name: agentName || 'AI Agent',
      description: 'Autonomous AI Agent on Haven Framework',
      capabilities: capabilities,
      createdAt: new Date().toISOString()
    }
    const ipfsHash = 'Qm' + Buffer.from(JSON.stringify(metadata)).toString('base64').slice(0, 42)
    return `ipfs://${ipfsHash}`
  }

  const handleRegister = async () => {
    if (!agentName.trim()) {
      setError('Please enter an agent name')
      return
    }

    setIsRegistering(true)
    setError(null)
    setSteps(steps.map(s => ({ ...s, status: 'pending' as const })))

    try {
      // Connect to wallet
      if (!window.ethereum) {
        throw new Error('Please install MetaMask or another Web3 wallet')
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const registrar = new ethers.Contract(
        contractAddress || ONE_CLICK_ADDRESS,
        ONE_CLICK_ABI,
        signer
      )

      // Generate metadata URI
      const finalMetadataURI = metadataURI || generateMetadataURI()

      // Update step 1: Processing
      setSteps(prev => prev.map(s => s.id === 1 ? { ...s, status: 'processing' } : s))

      // Execute one-click registration
      const tx = await registrar.registerAgentWithStrings(finalMetadataURI, capabilities)
      setTxHash(tx.hash)

      // Update steps as transaction progresses
      setSteps(prev => prev.map(s => {
        if (s.id === 1) return { ...s, status: 'completed' }
        if (s.id === 2) return { ...s, status: 'processing' }
        return s
      }))

      // Wait for transaction confirmation
      const receipt = await tx.wait()

      // Update remaining steps to completed
      setSteps(prev => prev.map(s => ({ ...s, status: 'completed' })))

      // Parse events to get token ID and TBA address
      const event = receipt.logs?.find((log: any) => {
        try {
          const parsed = registrar.interface.parseLog(log)
          return parsed?.name === 'AgentOneClickRegistered'
        } catch {
          return false
        }
      })

      if (event) {
        const parsed = registrar.interface.parseLog(event)
        const registrationData = {
          erc8004TokenId: parsed?.args[1],
          tbaAddress: parsed?.args[2],
          metadataURI: parsed?.args[3],
          txHash: tx.hash
        }
        setResult(registrationData)
        setRegistrationComplete(true)
        onSuccess?.(registrationData)
      }

    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'Registration failed')
      setSteps(prev => prev.map(s => ({
        ...s,
        status: s.status === 'processing' ? 'error' : s.status
      })))
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-4">
          <Zap className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-medium text-indigo-400">One-Click Registration</span>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">
          Register Your AI Agent
        </h2>
        <p className="text-gray-400">
          Get your agent on-chain in a single transaction
        </p>
      </div>

      {!registrationComplete ? (
        <div className="space-y-6">
          {/* Agent Details */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-400" />
              Agent Details
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Agent Name *
                </label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="e.g., Trading Bot Alpha"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={isRegistering}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Metadata URI (Optional)
                </label>
                <input
                  type="text"
                  value={metadataURI}
                  onChange={(e) => setMetadataURI(e.target.value)}
                  placeholder="ipfs://..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={isRegistering}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to auto-generate from details above
                </p>
              </div>
            </div>
          </div>

          {/* Capabilities */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-400" />
              Capabilities
            </h3>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-sm text-indigo-400"
                  >
                    {cap}
                    <button
                      onClick={() => removeCapability(cap)}
                      className="hover:text-white transition-colors"
                      disabled={isRegistering}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={customCapability}
                  onChange={(e) => setCustomCapability(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCapability()}
                  placeholder="Add capability (e.g., prediction, arbitrage)"
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  disabled={isRegistering}
                />
                <button
                  onClick={addCapability}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors text-sm font-medium"
                  disabled={isRegistering || !customCapability.trim()}
                >
                  Add
                </button>
              </div>

              {/* Preset capabilities */}
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-xs text-gray-500 mr-2">Quick add:</span>
                {['trading', 'analysis', 'prediction', 'arbitrage', 'governance'].map((cap) => (
                  <button
                    key={cap}
                    onClick={() => !capabilities.includes(cap) && setCapabilities([...capabilities, cap])}
                    className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs text-gray-400 transition-colors"
                    disabled={isRegistering || capabilities.includes(cap)}
                  >
                    + {cap}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Registration Steps */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Registration Process
            </h3>

            <div className="space-y-3">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/5"
                >
                  <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                    ${step.status === 'completed' ? 'bg-green-500' :
                      step.status === 'processing' ? 'bg-indigo-500 animate-pulse' :
                      step.status === 'error' ? 'bg-red-500' :
                      'bg-gray-600'}
                  `}>
                    {step.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : step.status === 'error' ? (
                      <AlertCircle className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-xs text-white font-medium">{step.id}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${
                        step.status === 'completed' ? 'text-green-400' :
                        step.status === 'error' ? 'text-red-400' :
                        'text-white'
                      }`}>
                        {step.title}
                      </span>
                      {step.status === 'processing' && (
                        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-400 mb-1">Registration Error</h4>
                  <p className="text-sm text-gray-400">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Register Button */}
          <button
            onClick={handleRegister}
            disabled={isRegistering || !agentName.trim()}
            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
          >
            {isRegistering ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Register Agent - One Click
              </>
            )}
          </button>

          <p className="text-xs text-center text-gray-500">
            By registering, you agree to create an ERC-8004 identity NFT and ERC-6551 Token Bound Account
          </p>
        </div>
      ) : (
        /* Success State */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Registration Complete!
            </h3>
            <p className="text-gray-400 mb-6">
              Your AI agent is now registered on Haven Framework
            </p>

            {result && (
              <div className="space-y-3 text-left">
                <InfoRow
                  label="Agent Name"
                  value={agentName}
                  icon={<Bot className="w-4 h-4" />}
                />
                <InfoRow
                  label="ERC-8004 Token ID"
                  value={result.erc8004TokenId.toString()}
                  icon={<Sparkles className="w-4 h-4" />}
                />
                <InfoRow
                  label="TBA Address"
                  value={result.tbaAddress}
                  icon={<Key className="w-4 h-4" />}
                  isAddress
                />
                <InfoRow
                  label="Transaction"
                  value={txHash}
                  icon={<ExternalLink className="w-4 h-4" />}
                  isTx
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <a
              href={`https://testnet.snowscan.xyz/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="card p-4 flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium text-white">View on Explorer</span>
            </a>
            <button
              onClick={() => {
                setRegistrationComplete(false)
                setAgentName('')
                setCapabilities(['trading', 'analysis'])
                setResult(null)
                setTxHash('')
              }}
              className="card p-4 flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
            >
              <Zap className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium text-white">Register Another</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Helper Component
function InfoRow({ label, value, icon, isAddress = false, isTx = false }: {
  label: string
  value: string
  icon: React.ReactNode
  isAddress?: boolean
  isTx?: boolean
}) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const displayValue = isAddress
    ? `${value.slice(0, 6)}...${value.slice(-4)}`
    : value

  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-gray-400">{icon}</span>
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-white font-mono">{displayValue}</span>
        {(isAddress || isTx) && (
          <button onClick={copyToClipboard} className="p-1 hover:bg-white/10 rounded">
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
          </button>
        )}
      </div>
    </div>
  )
}

export default OneClickRegistrar
