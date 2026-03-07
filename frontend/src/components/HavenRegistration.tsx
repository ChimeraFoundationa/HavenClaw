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
  Wallet,
  Server,
  Clock,
  Coins,
  Bot,
  Sparkles,
  Key
} from 'lucide-react'
import {
  ONE_CLICK_REGISTRAR,
  CLAWDBOT_CONFIG,
  NETWORK_CONFIG,
  GAS_ESTIMATION,
  ERC8004_CONFIG
} from '../data/constants'

declare global {
  interface Window {
    ethereum?: any
  }
}

// ============================================================================
// Types
// ============================================================================
interface HavenRegistrationProps {
  agentId: string
  agentName: string
  capabilities: string[]
  ownerAddress?: string
  endpointUrl?: string
  metadata?: Record<string, any>
  onSuccess?: (result: HavenResult) => void
  onError?: (error: Error) => void
  useClawdbotEndpoint?: boolean
}

interface HavenResult {
  tokenId: string
  tbaAddress: string
  txHash: string
  metadataURI: string
  clawdbotAgentId?: string
  registeredAt?: string
}

interface ClawdbotResponse {
  success: boolean
  data: {
    clawdbot_agent_id?: string
    erc8004_token_id?: string
    tba_address?: string
    transaction_hash?: string
    metadata_uri?: string
    registered_at?: string
  }
  message?: string
  error?: string
}

// ============================================================================
// Helper: Create Metadata URI with Clawdbot integration
// ============================================================================
function createClawdbotMetadataURI(
  name: string,
  clawdbotAgentId: string,
  capabilities: string[],
  metadata: Record<string, any>,
  ownerAddress: string
): string {
  const fullMetadata = {
    name,
    clawdbot_agent_id: clawdbotAgentId,
    owner: ownerAddress,
    capabilities,
    registeredAt: new Date().toISOString(),
    source: 'clawdbot',
    version: '1.0.0',
    ...metadata
  }

  const json = JSON.stringify(fullMetadata, null, 2)
  const encoder = new TextEncoder()
  const encoded = encoder.encode(json)
  
  let binary = ''
  for (let i = 0; i < encoded.length; i++) {
    binary += String.fromCharCode(encoded[i])
  }
  const base64 = btoa(binary)
  
  return `data:application/json;base64,${base64}`
}

// ============================================================================
// Component
// ============================================================================
export function HavenRegistration({
  agentId,
  agentName,
  capabilities,
  ownerAddress,
  endpointUrl,
  metadata = {},
  onSuccess,
  onError,
  useClawdbotEndpoint = true
}: HavenRegistrationProps) {
  const [isRegistering, setIsRegistering] = useState(false)
  const [step, setStep] = useState<'idle' | 'connecting' | 'signing' | 'confirming' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<HavenResult | null>(null)
  const [clawdbotCalled, setClawdbotCalled] = useState(false)
  const [txHash, setTxHash] = useState<string>('')

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
      const signerAddress = await signer.getAddress()

      // Use provided owner address or connected wallet address
      const effectiveOwner = ownerAddress || signerAddress

      setStep('signing')

      // ======================================================================
      // Step 3: Check and switch network
      // ======================================================================
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

      // ======================================================================
      // Step 4: Generate metadata URI with Clawdbot integration
      // ======================================================================
      const metadataURI = createClawdbotMetadataURI(
        agentName,
        agentId,
        capabilities,
        metadata,
        effectiveOwner
      )

      // ======================================================================
      // Step 5: If endpoint URL provided, try Clawdbot endpoint first
      // ======================================================================
      if (useClawdbotEndpoint && endpointUrl && endpointUrl.trim()) {
        try {
          setStep('connecting')
          console.log('Calling Clawdbot endpoint:', endpointUrl)
          
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), CLAWDBOT_CONFIG.TIMEOUT)

          const response = await fetch(endpointUrl, {
            method: 'POST',
            headers: CLAWDBOT_CONFIG.HEADERS,
            signal: controller.signal,
            body: JSON.stringify({
              clawdbot_agent_id: agentId,
              name: agentName,
              owner_address: effectiveOwner,
              capabilities,
              metadata: {
                ...metadata,
                registeredAt: new Date().toISOString(),
                source: 'clawdbot'
              }
            })
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || `Endpoint returned ${response.status}`)
          }

          const endpointResult: ClawdbotResponse = await response.json()
          console.log('Clawdbot endpoint response:', endpointResult)

          // If endpoint returns registration data, use it
          if (endpointResult.success && endpointResult.data?.erc8004_token_id) {
            const registrationResult: HavenResult = {
              tokenId: endpointResult.data.erc8004_token_id,
              tbaAddress: endpointResult.data.tba_address || '',
              txHash: endpointResult.data.transaction_hash || '',
              metadataURI: endpointResult.data.metadata_uri || metadataURI,
              clawdbotAgentId: endpointResult.data.clawdbot_agent_id || agentId,
              registeredAt: endpointResult.data.registered_at || new Date().toISOString()
            }
            setResult(registrationResult)
            setStep('success')
            setClawdbotCalled(true)
            onSuccess?.(registrationResult)
            setIsRegistering(false)
            return
          }
        } catch (endpointError: any) {
          console.warn('Clawdbot endpoint call failed, falling back to direct registration:', endpointError.message)
          // Continue with direct on-chain registration
        }
      }

      // ======================================================================
      // Step 6: Connect to OneClick Registrar contract
      // ======================================================================
      const contract = new ethers.Contract(
        ONE_CLICK_REGISTRAR.ADDRESS,
        ONE_CLICK_REGISTRAR.ABI,
        signer
      )

      // ======================================================================
      // Step 7: Execute registration via OneClick Registrar
      // ======================================================================
      console.log('Registering agent with:', {
        contract: ONE_CLICK_REGISTRAR.ADDRESS,
        metadataURI,
        capabilities
      })

      const tx = await contract.registerAgentWithStrings(metadataURI, capabilities)
      setTxHash(tx.hash)
      setStep('confirming')

      // ======================================================================
      // Step 8: Wait for confirmation
      // ======================================================================
      console.log('Waiting for transaction confirmation...', tx.hash)
      const receipt = await tx.wait()
      console.log('Transaction confirmed!', receipt)

      // ======================================================================
      // Step 9: Parse AgentOneClickRegistered event
      // ======================================================================
      const event = receipt.logs?.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log)
          return parsed?.name === 'AgentOneClickRegistered'
        } catch {
          return false
        }
      })

      if (!event) {
        throw new Error('Could not parse registration event. Transaction may have failed.')
      }

      const parsed = contract.interface.parseLog(event)

      if (!parsed || !parsed.args) {
        throw new Error('Could not parse event args')
      }

      const tokenId = parsed.args[1].toString()
      const tbaAddress = parsed.args[2]

      const registrationResult: HavenResult = {
        tokenId,
        tbaAddress,
        txHash: receipt.hash,
        metadataURI,
        clawdbotAgentId: agentId,
        registeredAt: new Date().toISOString()
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
            <span className="text-xs font-medium text-indigo-400">Haven Framework</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Register AI Agent
          </h3>
          <p className="text-sm text-gray-400">
            ERC-8004 + ERC-6551 One-Click Registration
          </p>
          {endpointUrl && useClawdbotEndpoint && (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-cyan-400">
              <Server className="w-3 h-3" />
              <span>Clawdbot Integration Enabled</span>
            </div>
          )}
        </div>

        {/* Contract Info */}
        <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="flex items-center gap-1.5 text-gray-400">
              <Coins className="w-3 h-3" />
              Est. Gas Cost
            </span>
            <span className="text-white font-medium">
              ~{GAS_ESTIMATION.REGISTRATION.ESTIMATED_COST_AVAX} AVAX
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-gray-400">
              <Clock className="w-3 h-3" />
              Est. Time
            </span>
            <span className="text-white font-medium">~15-30 seconds</span>
          </div>
        </div>

        {/* What You Get */}
        <div className="mb-4 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg">
          <p className="text-xs text-gray-400 mb-2">You will receive:</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>ERC-8004 Identity NFT</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <Key className="w-3 h-3 text-cyan-400" />
              <span>ERC-6551 Token Bound Account</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <Bot className="w-3 h-3 text-purple-400" />
              <span>Haven Agent Registry</span>
            </div>
          </div>
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
              <p className="text-white font-medium">
                {clawdbotCalled ? 'Processing Clawdbot Data...' : 'Connecting wallet...'}
              </p>
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
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mt-1">
                <Clock className="w-4 h-4" />
                <span>This may take 15-30 seconds</span>
              </div>
              {txHash && (
                <a
                  href={`${NETWORK_CONFIG.FUJI.EXPLORER_URL}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-400 hover:text-indigo-300 mt-2 inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  View on Explorer
                </a>
              )}
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
                {clawdbotCalled && (
                  <p className="text-sm text-cyan-400 mt-1 flex items-center justify-center gap-1">
                    <Server className="w-3 h-3" />
                    Registered via Clawdbot
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <ResultRow label="Token ID" value={`#${result.tokenId}`} />
                <ResultRow label="TBA Address" value={result.tbaAddress} isAddress />
                {result.clawdbotAgentId && (
                  <ResultRow label="Clawdbot Agent ID" value={result.clawdbotAgentId} />
                )}
                <div className="flex gap-2">
                  <a
                    href={`${NETWORK_CONFIG.FUJI.EXPLORER_URL}/tx/${result.txHash}`}
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
                  setClawdbotCalled(false)
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
