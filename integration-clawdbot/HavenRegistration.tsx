import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ethers } from 'ethers'
import {
  Zap,
  CheckCircle,
  Loader2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Wallet
} from 'lucide-react'

// ============================================================================
// Configuration - Update dengan deployed contract address
// ============================================================================
const ONE_CLICK_ADDRESS = '0x0000000000000000000000000000000000000000' // UPDATE INI!

const ONE_CLICK_ABI = [
  'function registerAgentWithStrings(string memory metadataURI, string[] memory capabilities) external returns (uint256, address)',
  'event AgentOneClickRegistered(address indexed owner, uint256 indexed erc8004TokenId, address indexed tbaAddress, string metadataURI, bytes32[] capabilities)'
]

const FUJI_CHAIN_ID = 43113
const FUJI_RPC = 'https://api.avax-test.network/ext/bc/C/rpc'
const EXPLORER_BASE = 'https://testnet.snowscan.xyz'

// ============================================================================
// Types
// ============================================================================
interface HavenRegistrationProps {
  agentId: string
  agentName: string
  capabilities: string[]
  metadata?: Record<string, any>
  onSuccess?: (result: HavenResult) => void
  onError?: (error: Error) => void
}

interface HavenResult {
  tokenId: string
  tbaAddress: string
  txHash: string
  metadataURI: string
}

// ============================================================================
// Component
// ============================================================================
export function HavenRegistration({
  agentId,
  agentName,
  capabilities,
  metadata = {},
  onSuccess,
  onError
}: HavenRegistrationProps) {
  const [isRegistering, setIsRegistering] = useState(false)
  const [step, setStep] = useState<'idle' | 'connecting' | 'signing' | 'confirming' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<HavenResult | null>(null)

  const handleRegister = async () => {
    setIsRegistering(true)
    setStep('connecting')
    setError(null)

    try {
      // ======================================================================
      // Step 1: Check wallet
      // ======================================================================
      if (!window.ethereum) {
        throw new Error('Please install MetaMask or another Web3 wallet')
      }

      // ======================================================================
      // Step 2: Connect to wallet
      // ======================================================================
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const address = await signer.getAddress()

      setStep('signing')

      // ======================================================================
      // Step 3: Check network
      // ======================================================================
      const network = await provider.getNetwork()
      
      if (network.chainId !== BigInt(FUJI_CHAIN_ID)) {
        // Try to switch to Fuji testnet
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${FUJI_CHAIN_ID.toString(16)}` }],
          })
        } catch (switchError: any) {
          // Network not added, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${FUJI_CHAIN_ID.toString(16)}`,
                chainName: 'Avalanche Fuji Testnet',
                nativeCurrency: {
                  name: 'AVAX',
                  symbol: 'AVAX',
                  decimals: 18
                },
                rpcUrls: [FUJI_RPC],
                blockExplorerUrls: [EXPLORER_BASE]
              }],
            })
          } else {
            throw new Error('Please switch to Avalanche Fuji testnet')
          }
        }
      }

      // ======================================================================
      // Step 4: Connect to contract
      // ======================================================================
      const contract = new ethers.Contract(ONE_CLICK_ADDRESS, ONE_CLICK_ABI, signer)

      // ======================================================================
      // Step 5: Generate metadata URI
      // ======================================================================
      const metadataURI = createMetadataURI(agentName, agentId, capabilities, metadata)

      // ======================================================================
      // Step 6: Execute registration
      // ======================================================================
      const tx = await contract.registerAgentWithStrings(metadataURI, capabilities)

      setStep('confirming')

      // ======================================================================
      // Step 7: Wait for confirmation
      // ======================================================================
      const receipt = await tx.wait()

      // ======================================================================
      // Step 8: Parse event
      // ======================================================================
      const event = receipt.logs?.find(log => {
        try {
          const parsed = contract.interface.parseLog(log)
          return parsed?.name === 'AgentOneClickRegistered'
        } catch {
          return false
        }
      })

      if (!event) {
        throw new Error('Could not parse registration event')
      }

      const parsed = contract.interface.parseLog(event)
      
      const registrationResult: HavenResult = {
        tokenId: parsed.args[1].toString(),
        tbaAddress: parsed.args[2],
        txHash: receipt.hash,
        metadataURI
      }

      setResult(registrationResult)
      setStep('success')
      onSuccess?.(registrationResult)

    } catch (err: any) {
      console.error('Registration failed:', err)
      const errorMessage = err.message || err.reason || 'Registration failed'
      setError(errorMessage)
      setStep('error')
      onError?.(err)
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="card p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full mb-3">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-medium text-indigo-400">Powered by Haven Framework</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Register on Haven
          </h3>
          <p className="text-sm text-gray-400">
            Get your agent on-chain with ERC-8004 + ERC-6551
          </p>
        </div>

        {/* Status */}
        <AnimatePresence mode="wait">
          {step === 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <button
                onClick={handleRegister}
                disabled={isRegistering}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
              >
                <Wallet className="w-5 h-5" />
                Register Agent
              </button>
              
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  ERC-8004 NFT
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  ERC-6551 TBA
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Haven Registry
                </span>
              </div>
            </motion.div>
          )}

          {step === 'connecting' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-4"
            >
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
              <p className="text-white font-medium">Connecting wallet...</p>
            </motion.div>
          )}

          {step === 'signing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-4"
            >
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
              <p className="text-white font-medium">Please sign the transaction</p>
              <p className="text-sm text-gray-400 mt-1">Check your wallet</p>
            </motion.div>
          )}

          {step === 'confirming' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-4"
            >
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
              <p className="text-white font-medium">Confirming on blockchain...</p>
              <p className="text-sm text-gray-400 mt-1">This may take a few seconds</p>
            </motion.div>
          )}

          {step === 'success' && result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-lg font-bold text-white">Registration Complete!</h4>
              </div>

              <div className="space-y-2">
                <ResultRow label="Token ID" value={result.tokenId} />
                <ResultRow label="TBA Address" value={result.tbaAddress} isAddress />
                <div className="flex gap-2">
                  <a
                    href={`${EXPLORER_BASE}/tx/${result.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-lg text-indigo-400 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on Explorer
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(result, null, 2))
                    }}
                    className="py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  setStep('idle')
                  setResult(null)
                }}
                className="w-full py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-medium transition-colors"
              >
                Register Another
              </button>
            </motion.div>
          )}

          {step === 'error' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Registration Failed</h4>
                <p className="text-sm text-gray-400">{error}</p>
              </div>

              <button
                onClick={() => {
                  setStep('idle')
                  setError(null)
                }}
                className="w-full py-2 px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ============================================================================
// Helper Functions
// ============================================================================
function createMetadataURI(
  name: string,
  agentId: string,
  capabilities: string[],
  metadata: Record<string, any>
): string {
  const fullMetadata = {
    name,
    clawdbot_agent_id: agentId,
    capabilities,
    registeredAt: new Date().toISOString(),
    source: 'clawdbot',
    ...metadata
  }
  
  const json = JSON.stringify(fullMetadata)
  const base64 = btoa(json)
  return `data:application/json;base64,${base64}`
}

// ============================================================================
// Sub-components
// ============================================================================
function ResultRow({ label, value, isAddress = false }: { 
  label: string
  value: string
  isAddress?: boolean
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
      <span className="text-sm text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono text-white">{displayValue}</span>
        {isAddress && (
          <button onClick={copyToClipboard} className="p-1 hover:bg-white/10 rounded">
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
          </button>
        )}
      </div>
    </div>
  )
}

export default HavenRegistration
