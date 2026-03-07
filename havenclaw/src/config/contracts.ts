/**
 * Haven Contract Addresses
 *
 * Deployment addresses for HAVEN Framework contracts
 * 
 * NOTE: These are PLACEHOLDER addresses. Update after deployment!
 */

export interface ContractAddresses {
  // Core Framework (Phase 1 - Ready to Deploy)
  HAVEN: string
  ERC6551Registry: string
  AgentRegistry: string
  AgentReputation: string
  TaskMarketplace: string
  HavenGovernance: string
  ERC8004AgentRegistry: string
  
  // ZK System (Existing - No Redeploy)
  PLONKVerifierWrapper: string
  PLONKVerifier: string
  ZK6GVerifier: string
  
  // Phase 2 - Needs Integration
  GAT: string
  ReputationBridge: string
  OneClickRegistrar: string
  RequestContract: string
  NonCustodialEscrow: string
}

// Fuji Testnet Addresses (DEPLOYED 2026-03-07 - Phase 1 & 2 Complete)
export const HAVEN_CONTRACTS_FUJI: ContractAddresses = {
  // Phase 1 - Core (DEPLOYED & VERIFIED)
  HAVEN: '0x414b10bED95b018Aa8F3A4c027E436e4bECBf1B0',
  ERC6551Registry: '0x6bbA4040a81c779f356B487c9fcE89EE3308C54a',
  AgentRegistry: '0x913836702a423d75Ae97e439E6CBF12B7Ae3A6eC',
  AgentReputation: '0xD42b4AB9ABB5f4150b44676dF3Aa03bD65394d6e',
  TaskMarketplace: '0xFbD804508Ad7C65aE5D23090018eB2eE400ea1e5',
  HavenGovernance: '0x283C8AEB114d2025A48C064eb99FEb623281f291',
  
  // Phase 2 - ZK & Integration (DEPLOYED & VERIFIED)
  PLONKVerifierWrapper: '0x92877142d18301231DfA1fD491Aa8910B4291105',
  PLONKVerifier: '0x95E5E50CBAFBC57cBe255A8B4A83C1e2448c4E6f',
  ZK6GVerifier: '0x0000000000000000000000000000000000000000',
  
  // Phase 2 - Verification & Escrow (DEPLOYED & VERIFIED)
  GAT: '0x2f7e81b383E76060E2c1faed2428d49dA6fF2888',
  NonCustodialEscrow: '0x97414b676698584327Ad605F2F5e743C78aC1748',
  RequestContract: '0x7FE091D3d5d1302CC44b4980D381DD97AD0df131',
  
  // Phase 2 - Bridges (DEPLOYED & VERIFIED)
  ReputationBridge: '0xA7DB162768c1a760085Dc9f8d06416Ffc719c231',
  
  // ERC8004 Official Contracts (Already deployed on Fuji!)
  // Source: https://github.com/erc-8004/erc-8004-contracts
  // We use the OFFICIAL ERC8004 contracts instead of deploying our own
  ERC8004IdentityRegistry: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
  ERC8004ReputationRegistry: '0x8004B663056A597Dffe9eCcC1965A193B7388713',
  
  // Deprecated - Use official ERC8004 contracts above
  ERC8004AgentRegistry: '0x0000000000000000000000000000000000000000', // Using official instead
  OneClickRegistrar: '0x0000000000000000000000000000000000000000'
}

// Mainnet Addresses (placeholder - update after deployment)
export const HAVEN_CONTRACTS_MAINNET: ContractAddresses = {
  // Core Framework
  ERC6551Registry: '0x0000000000000000000000000000000000000000',
  AgentRegistry: '0x0000000000000000000000000000000000000000',
  GAT: '0x0000000000000000000000000000000000000000',
  PLONKVerifier: '0x0000000000000000000000000000000000000000',
  NonCustodialEscrow: '0x0000000000000000000000000000000000000000',
  RequestContract: '0x0000000000000000000000000000000000000000',
  
  // Governance
  HAVEN: '0x0000000000000000000000000000000000000000',
  AgentReputation: '0x0000000000000000000000000000000000000000',
  TaskCollective: '0x0000000000000000000000000000000000000000',
  
  // ERC-8004 Integration
  ERC8004AgentRegistry: '0x0000000000000000000000000000000000000000',
  ReputationBridge: '0x0000000000000000000000000000000000000000'
}

// Chain IDs
export const CHAIN_IDS = {
  fuji: 43113,
  mainnet: 43114,
  local: 43112
}

// Network configurations
export interface NetworkConfig {
  chainId: number
  name: string
  rpcUrl: string
  explorerUrl: string
  contracts: ContractAddresses
}

export const NETWORKS: Record<string, NetworkConfig> = {
  fuji: {
    chainId: CHAIN_IDS.fuji,
    name: 'Fuji Testnet',
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    explorerUrl: 'https://testnet.snowtrace.io',
    contracts: HAVEN_CONTRACTS_FUJI
  },
  mainnet: {
    chainId: CHAIN_IDS.mainnet,
    name: 'Avalanche Mainnet',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorerUrl: 'https://snowtrace.io',
    contracts: HAVEN_CONTRACTS_MAINNET
  },
  local: {
    chainId: CHAIN_IDS.local,
    name: 'Local Network',
    rpcUrl: 'http://localhost:9650/ext/bc/C/rpc',
    explorerUrl: '',
    contracts: HAVEN_CONTRACTS_FUJI // Use same addresses for local testing
  }
}

/**
 * Get contract address by name and chain ID
 */
export function getContractAddress(contractName: keyof ContractAddresses, chainId?: number): string {
  const network = Object.values(NETWORKS).find(n => n.chainId === chainId) || NETWORKS.fuji
  return network.contracts[contractName]
}

/**
 * Get all contract addresses for a network
 */
export function getContractAddresses(network: string = 'fuji'): ContractAddresses {
  return NETWORKS[network]?.contracts || HAVEN_CONTRACTS_FUJI
}

/**
 * Get network configuration by chain ID
 */
export function getNetworkConfig(chainId?: number): NetworkConfig {
  const network = Object.values(NETWORKS).find(n => n.chainId === chainId)
  return network || NETWORKS.fuji
}
