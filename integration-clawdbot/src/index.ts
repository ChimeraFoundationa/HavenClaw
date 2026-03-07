/**
 * @haven-framework/clawdbot-integration
 * 
 * SDK untuk integrasi Clawdbot dengan Haven Framework
 * Memungkinkan registrasi AI agent ke ERC-8004 + ERC-6551 dengan satu fungsi
 */

import { ethers } from 'ethers'

// ============================================================================
// Configuration
// ============================================================================
export const HAVEN_CONFIG = {
  // OneClick Agent Registrar - Deployed on Avalanche Fuji
  ONE_CLICK_ADDRESS: '0xE5fB1158B69933d215c99adfd23D16d6e6293294',
  
  // ERC-8004 Agent Registry
  ERC8004_ADDRESS: '0x187A01e251dF08D5908d61673EeF1157306F974C',
  
  // ERC-6551 Registry
  TBA_REGISTRY_ADDRESS: '0xaCA0fA40b2eaAdcdF1c72cB36e88aBd76C0EA464',
  
  // Network
  FUJI_CHAIN_ID: 43113,
  FUJI_RPC: 'https://api.avax-test.network/ext/bc/C/rpc',
  EXPLORER_URL: 'https://testnet.snowscan.xyz',
  
  // ABI Minimal
  ONE_CLICK_ABI: [
    'function registerAgentWithStrings(string memory metadataURI, string[] memory capabilities) external returns (uint256, address)',
    'function getLatestAgent(address user) external view returns (tuple(uint256 erc8004TokenId, address tbaAddress, string metadataURI, uint256 registeredAt))',
    'function getUserAgents(address user) external view returns (tuple(uint256 erc8004TokenId, address tbaAddress, string metadataURI, uint256 registeredAt)[])',
    'event AgentOneClickRegistered(address indexed owner, uint256 indexed erc8004TokenId, address indexed tbaAddress, string metadataURI, bytes32[] capabilities)'
  ]
}

// ============================================================================
// Types
// ============================================================================

/**
 * Agent data untuk registrasi
 */
export interface AgentData {
  /** ID unik agent di Clawdbot */
  id: string
  /** Nama agent */
  name: string
  /** Capabilities array */
  capabilities: string[]
  /** Owner wallet address */
  ownerAddress?: string
  /** Additional metadata */
  metadata?: Record<string, any>
}

/**
 * Result dari registrasi
 */
export interface RegistrationResult {
  /** ERC-8004 Token ID */
  tokenId: string
  /** Token Bound Account address */
  tbaAddress: string
  /** Transaction hash */
  txHash: string
  /** Metadata URI */
  metadataURI: string
  /** Clawdbot agent ID */
  clawdbotAgentId: string
}

/**
 * Agent info dari query
 */
export interface AgentInfo {
  tokenId: string
  tbaAddress: string
  metadataURI: string
  registeredAt: number
}

// ============================================================================
// HavenAgent Class
// ============================================================================

export class HavenAgent {
  private provider: ethers.Provider
  private signer?: ethers.Signer
  private contract: ethers.Contract

  constructor(providerOrSigner: ethers.Provider | ethers.Signer) {
    if (ethers.Signer.isSigner(providerOrSigner)) {
      this.signer = providerOrSigner
      this.provider = providerOrSigner.provider!
    } else {
      this.provider = providerOrSigner
    }

    this.contract = new ethers.Contract(
      HAVEN_CONFIG.ONE_CLICK_ADDRESS,
      HAVEN_CONFIG.ONE_CLICK_ABI,
      this.signer || this.provider
    )
  }

  /**
   * Register AI agent ke Haven Framework
   * 
   * @param agentData - Data agent untuk registrasi
   * @returns Registration result
   * 
   * @example
   * ```typescript
   * const provider = new ethers.BrowserProvider(window.ethereum)
   * const signer = await provider.getSigner()
   * const haven = new HavenAgent(signer)
   * 
   * const result = await haven.registerAgent({
   *   id: 'agent_001',
   *   name: 'Trading Bot',
   *   capabilities: ['trading', 'analysis']
   * })
   * 
   * console.log('Token ID:', result.tokenId)
   * console.log('TBA:', result.tbaAddress)
   * ```
   */
  async registerAgent(agentData: AgentData): Promise<RegistrationResult> {
    if (!this.signer) {
      throw new Error('Signer required for registration. Please provide a Signer instead of Provider.')
    }

    // Create metadata dengan Clawdbot integration
    const metadata = this.createMetadata(agentData)
    const metadataURI = this.createMetadataURI(metadata)

    // Execute registration
    const tx = await this.contract.registerAgentWithStrings(
      metadataURI,
      agentData.capabilities
    )

    const receipt = await tx.wait()

    // Parse event
    const result = this.parseRegistrationResult(receipt)

    return {
      ...result,
      clawdbotAgentId: agentData.id
    }
  }

  /**
   * Check apakah user sudah punya agent
   * 
   * @param address - User address
   * @returns Agent info atau null jika tidak ada
   */
  async getAgent(address: string): Promise<AgentInfo | null> {
    try {
      const agent = await this.contract.getLatestAgent(address)
      
      if (agent.erc8004TokenId === BigInt(0)) {
        return null
      }

      return {
        tokenId: agent.erc8004TokenId.toString(),
        tbaAddress: agent.tbaAddress,
        metadataURI: agent.metadataURI,
        registeredAt: Number(agent.registeredAt)
      }
    } catch {
      return null
    }
  }

  /**
   * Get semua agent yang dimiliki user
   * 
   * @param address - User address
   * @returns Array of agent info
   */
  async getAllAgents(address: string): Promise<AgentInfo[]> {
    try {
      const agents = await this.contract.getUserAgents(address)
      
      return agents.map((agent: any) => ({
        tokenId: agent.erc8004TokenId.toString(),
        tbaAddress: agent.tbaAddress,
        metadataURI: agent.metadataURI,
        registeredAt: Number(agent.registeredAt)
      }))
    } catch {
      return []
    }
  }

  /**
   * Check network dan switch ke Fuji jika perlu
   */
  async checkNetwork(): Promise<boolean> {
    if (!this.signer) return false

    try {
      const network = await this.provider.getNetwork()
      
      if (network.chainId === BigInt(HAVEN_CONFIG.FUJI_CHAIN_ID)) {
        return true
      }

      // Try to switch
      await this.switchNetwork()
      return true
    } catch {
      return false
    }
  }

  /**
   * Switch ke Avalanche Fuji network
   */
  async switchNetwork(): Promise<void> {
    if (!this.signer) throw new Error('Signer required')

    const provider = (this.signer.provider as any)
    if (!provider) throw new Error('Provider not found')

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${HAVEN_CONFIG.FUJI_CHAIN_ID.toString(16)}` }],
      })
    } catch (error: any) {
      // Network not added, add it
      if (error.code === 4902) {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${HAVEN_CONFIG.FUJI_CHAIN_ID.toString(16)}`,
            chainName: 'Avalanche Fuji Testnet',
            nativeCurrency: {
              name: 'AVAX',
              symbol: 'AVAX',
              decimals: 18
            },
            rpcUrls: [HAVEN_CONFIG.FUJI_RPC],
            blockExplorerUrls: [HAVEN_CONFIG.EXPLORER_URL]
          }]
        })
      } else {
        throw new Error('Failed to switch network')
      }
    }
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private createMetadata(agentData: AgentData): Record<string, any> {
    return {
      name: agentData.name,
      clawdbot_agent_id: agentData.id,
      owner: agentData.ownerAddress || 'unknown',
      capabilities: agentData.capabilities,
      registeredAt: new Date().toISOString(),
      source: 'clawdbot',
      version: '1.0.0',
      ...agentData.metadata
    }
  }

  private createMetadataURI(metadata: Record<string, any>): string {
    const json = JSON.stringify(metadata, null, 2)
    const encoder = new TextEncoder()
    const encoded = encoder.encode(json)
    
    let binary = ''
    for (let i = 0; i < encoded.length; i++) {
      binary += String.fromCharCode(encoded[i])
    }
    const base64 = btoa(binary)
    
    return `data:application/json;base64,${base64}`
  }

  private parseRegistrationResult(receipt: ethers.TransactionReceipt): Omit<RegistrationResult, 'clawdbotAgentId'> {
    const event = receipt.logs?.find((log: any) => {
      try {
        const parsed = this.contract.interface.parseLog(log)
        return parsed?.name === 'AgentOneClickRegistered'
      } catch {
        return false
      }
    })

    if (!event) {
      throw new Error('Could not parse registration event')
    }

    const parsed = this.contract.interface.parseLog(event)

    if (!parsed || !parsed.args) {
      throw new Error('Could not parse event args')
    }

    return {
      tokenId: parsed.args[1].toString(),
      tbaAddress: parsed.args[2],
      txHash: receipt.hash,
      metadataURI: parsed.args[3]
    }
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create HavenAgent instance dari window.ethereum
 */
export async function createHavenAgent(): Promise<HavenAgent> {
  if (!window.ethereum) {
    throw new Error('Please install MetaMask or another Web3 wallet')
  }

  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  
  return new HavenAgent(signer)
}

/**
 * Check apakah wallet sudah punya agent
 */
export async function checkAgentStatus(address?: string): Promise<{ hasAgent: boolean; agent?: AgentInfo }> {
  if (!window.ethereum) {
    return { hasAgent: false }
  }

  const provider = new ethers.BrowserProvider(window.ethereum)
  const haven = new HavenAgent(provider)

  const targetAddress = address || (await provider.getSigner().then(s => s.getAddress()))
  const agent = await haven.getAgent(targetAddress)

  if (agent) {
    return { hasAgent: true, agent }
  }

  return { hasAgent: false }
}

/**
 * Get explorer URL untuk transaction
 */
export function getExplorerUrl(txHash: string, type: 'tx' | 'token' | 'address' = 'tx'): string {
  const base = HAVEN_CONFIG.EXPLORER_URL
  
  switch (type) {
    case 'tx':
      return `${base}/tx/${txHash}`
    case 'token':
      return `${base}/token/${HAVEN_CONFIG.ERC8004_ADDRESS}?a=${txHash}`
    case 'address':
      return `${base}/address/${txHash}`
  }
}

// ============================================================================
// Window type augmentation
// ============================================================================
declare global {
  interface Window {
    ethereum?: any
  }
}
