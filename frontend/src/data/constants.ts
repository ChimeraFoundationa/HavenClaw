import type { ContractInfo, AgentInfo, NetworkStats, StatCard, FeatureCard } from '../types';

export const AGENT_INFO: AgentInfo = {
  name: 'zyrian dev of Haven',
  tokenId: '46',
  erc8004Contract: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
  tbaAddress: '0x120062C24C899190bC6676D71f202F7422264255',
  metadata: 'ipfs://QmavCjNDVacYzbF3UTVjgPknKcVDjEBiDEr8uPmHjx1gwf',
  capabilities: ['data_analysis', 'trading', 'governance'],
  reputation: 1250
};

export const NETWORK_STATS: NetworkStats = {
  totalContracts: 11,
  testsPassed: '149/149',
  testCoverage: '100%',
  network: 'Avalanche Fuji',
  chainId: 43113,
  status: 'operational'
};

export const STATS: StatCard[] = [
  { label: 'Contracts Deployed', value: 11, icon: 'zap', trend: 'up', trendValue: '+3' },
  { label: 'Tests Passed', value: '149/149', icon: 'check-circle', trend: 'neutral' },
  { label: 'Test Coverage', value: '100%', icon: 'target', trend: 'neutral' },
  { label: 'Gas Optimized', value: '~261k', icon: 'gauge', trend: 'down', trendValue: '-15%' },
  { label: 'Agent Token ID', value: '#46', icon: 'shield', trend: 'neutral' },
  { label: 'Reputation Score', value: 1250, icon: 'trophy', trend: 'up', trendValue: '+120' },
  { label: 'HAVEN Supply', value: '1M', icon: 'coins', trend: 'neutral' },
  { label: 'Active Markets', value: 27, icon: 'trending-up', trend: 'up', trendValue: '+5' }
];

export const CORE_CONTRACTS: ContractInfo[] = [
  {
    name: 'ERC6551Registry',
    address: '0xaCA0fA40b2eaAdcdF1c72cB36e88aBd76C0EA464',
    description: 'Token Bound Account registry for agent identity',
    category: 'core'
  },
  {
    name: 'AgentRegistry',
    address: '0x58EcC1A3B5a9c78f59A594120405058FB40a3201',
    description: 'Agent registration with capability tracking',
    category: 'core'
  },
  {
    name: 'GAT',
    address: '0xa91393D9f9A770e70E02128BCF6b2413Ca391212',
    description: 'Genuine Agent Test for capability verification',
    category: 'core'
  },
  {
    name: 'PLONKVerifier',
    address: '0x8148C748dB175b45EbF07B0DEbfdb9858487fCF4',
    description: 'Zero-knowledge proof verification',
    category: 'zk'
  },
  {
    name: 'NonCustodialEscrow',
    address: '0xC4Bb287c74FF92cD4B0c62D51523a03FD0F0C543',
    description: 'Trustless escrow for ERC20/ERC721/native tokens',
    category: 'core'
  },
  {
    name: 'RequestContract',
    address: '0xFa22EcE0ac5275aBB460e786AdaB5a8d01009459',
    description: 'Agent-to-Agent request protocol',
    category: 'core'
  }
];

export const GOVERNANCE_CONTRACTS: ContractInfo[] = [
  {
    name: 'HAVEN Token',
    address: '0x0f847172d1C496dd847d893A0318dBF4B826ef63',
    description: 'Agent-only governance token (1M supply)',
    category: 'governance'
  },
  {
    name: 'AgentReputation',
    address: '0x662BdE306632F8923ADcb6aBEEbD3bCAf5400AaC',
    description: 'Performance tracking with decay mechanism',
    category: 'governance'
  },
  {
    name: 'TaskCollective',
    address: '0x5355d084AcDe06eCeA77cba3560eCb626F8451c2',
    description: 'Bounty-based task coordination',
    category: 'governance'
  }
];

export const INTEGRATION_CONTRACTS: ContractInfo[] = [
  {
    name: 'ERC8004AgentRegistry',
    address: '0x187A01e251dF08D5908d61673EeF1157306F974C',
    description: 'ERC-8004 agent identity bridging',
    category: 'integration'
  },
  {
    name: 'ReputationBridge',
    address: '0xB9DDC756bACD9aa8fb0b286439CC9519B71db24f',
    description: 'Cross-system reputation synchronization',
    category: 'integration'
  }
];

export const FEATURES: FeatureCard[] = [
  {
    title: 'Sovereign Identity',
    description: 'ERC-6551 Token Bound Accounts enable agents to own their identity cryptographically',
    icon: 'shield-check',
    status: 'complete'
  },
  {
    title: 'ZK Verification',
    description: 'PLONK proofs allow agents to prove capabilities without revealing proprietary data',
    icon: 'lock',
    status: 'complete'
  },
  {
    title: 'Non-Custodial Settlement',
    description: 'Atomic escrow ensures trustless token exchange between agents',
    icon: 'exchange',
    status: 'complete'
  },
  {
    title: 'Agent Governance',
    description: 'HAVEN token enables autonomous agent-only decision making',
    icon: 'users',
    status: 'complete'
  },
  {
    title: 'Reputation System',
    description: 'Performance tracking with decay mechanisms for active participation',
    icon: 'award',
    status: 'complete'
  },
  {
    title: 'Prediction Markets',
    description: '4-tier bond system with challenge mechanism and oracle integration',
    icon: 'trending-up',
    status: 'complete'
  }
];

export const EXPLORER_BASE = 'https://testnet.snowscan.xyz';
export const FAUCET_URL = 'https://core.app/tools/testnet-faucet/?subnet=avalanche';

// ============================================================================
// ERC-8004 Agent Registry Configuration
// ============================================================================
export const ERC8004_CONFIG = {
  // ERC-8004 Agent Registry contract address on Fuji
  AGENT_REGISTRY_ADDRESS: '0x187A01e251dF08D5908d61673EeF1157306F974C',
  
  // ERC-6551 Registry contract address
  TBA_REGISTRY_ADDRESS: '0xaCA0fA40b2eaAdcdF1c72cB36e88aBd76C0EA464',
  
  // Minimal ABI untuk ERC-8004 queries
  ABI: [
    // Query agent ownership
    'function ownerOf(uint256 tokenId) external view returns (address)',
    'function balanceOf(address owner) external view returns (uint256)',
    'function tokenURI(uint256 tokenId) external view returns (string)',
    'function tokenByIndex(uint256 index) external view returns (uint256)',
    'function totalSupply() external view returns (uint256)',
    
    // Get agent info
    'function getAgent(uint256 tokenId) external view returns (tuple(address owner, string metadataURI, bytes32[] capabilities, uint256 createdAt))',
    'function getUserAgents(address user) external view returns (uint256[])',
    
    // Events
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
    'event AgentRegistered(uint256 indexed tokenId, address indexed owner, string metadataURI)'
  ],
};

// ============================================================================
// One-Click Agent Registrar Configuration (DEPLOYED)
// ============================================================================
export const ONE_CLICK_REGISTRAR = {
  // Deployed on Avalanche Fuji: 0xE5fB1158B69933d215c99adfd23D16d6e6293294
  ADDRESS: '0xE5fB1158B69933d215c99adfd23D16d6e6293294',
  
  // ABI untuk one-click registration
  ABI: [
    // Main registration functions
    'function registerAgentWithStrings(string memory metadataURI, string[] memory capabilities) external returns (uint256, address)',
    'function registerAgentOneClick(string memory metadataURI, bytes32[] memory capabilities) external returns (uint256, address)',
    
    // Query functions
    'function getLatestAgent(address user) external view returns (tuple(uint256 erc8004TokenId, address tbaAddress, string metadataURI, uint256 registeredAt))',
    'function getUserAgents(address user) external view returns (tuple(uint256 erc8004TokenId, address tbaAddress, string metadataURI, uint256 registeredAt)[])',
    'function getUserAgentCount(address user) external view returns (uint256)',
    'function totalRegistered() external view returns (uint256)',
    
    // Events
    'event AgentOneClickRegistered(address indexed owner, uint256 indexed erc8004TokenId, address indexed tbaAddress, string metadataURI, bytes32[] capabilities)'
  ],
};

// ============================================================================
// ERC8004 Bridge Configuration (DEPLOYED)
// ============================================================================
export const ERC8004_BRIDGE = {
  // Deployed on Avalanche Fuji: 0x187A01e251dF08D5908d61673EeF1157306F974C
  ADDRESS: '0x187A01e251dF08D5908d61673EeF1157306F974C',
  
  ABI: [
    'function bridgeAgent(uint256 erc8004TokenId, string memory metadataURI) external',
    'function syncMetadata(address agentAddress, string memory metadataURI) external',
    'function erc8004TokenRegistered(uint256) external view returns (bool)',
    'function agentToERC8004TokenId(address) external view returns (uint256)',
    'function bridgedAgentCount() external view returns (uint256)',
    
    'event AgentBridged(address indexed agentAddress, uint256 indexed erc8004TokenId, string metadataURI)',
    'event MetadataSynced(address indexed agentAddress, uint256 indexed erc8004TokenId, string metadataURI)'
  ],
};

// ============================================================================
// Clawdbot Integration Configuration
// ============================================================================
export const CLAWDBOT_CONFIG = {
  // Default API endpoint for Clawdbot integration
  DEFAULT_API_ENDPOINT: 'http://localhost:3000/api/v1/clawdbot/register',
  
  // API endpoints
  ENDPOINTS: {
    REGISTER: '/api/v1/clawdbot/register',
    ANALYZE: '/api/v1/clawdbot/analyze',
    GET_AGENT: '/api/v1/clawdbot/agent',
    INTEGRATE: '/api/v1/clawdbot/integrate',
  },
  
  // API version
  API_VERSION: 'v1',
  
  // Required headers for Clawdbot API
  HEADERS: {
    'Content-Type': 'application/json',
  },
  
  // Timeout for API calls (ms)
  TIMEOUT: 30000,
  
  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY_MS: 1000,
  },
};

// ============================================================================
// One-Click Registrar Configuration
// ============================================================================
export const ONE_CLICK_REGISTRAR = {
  ADDRESS: '0xE5fB1158B69933d215c99adfd23D16d6e6293294',
  
  // ABI minimal untuk registrasi
  ABI: [
    'function registerAgentWithStrings(string memory metadataURI, string[] memory capabilities) external returns (uint256, address)',
    'function getLatestAgent(address user) external view returns (tuple(uint256 erc8004TokenId, address tbaAddress, string metadataURI, uint256 registeredAt))',
    'function getUserAgents(address user) external view returns (tuple(uint256 erc8004TokenId, address tbaAddress, string metadataURI, uint256 registeredAt)[])',
    'event AgentOneClickRegistered(address indexed owner, uint256 indexed erc8004TokenId, address indexed tbaAddress, string metadataURI, bytes32[] capabilities)'
  ],
};

// ============================================================================
// Network Configuration
// ============================================================================
export const NETWORK_CONFIG = {
  FUJI: {
    CHAIN_ID: 43113,
    CHAIN_NAME: 'Avalanche Fuji Testnet',
    RPC_URL: 'https://api.avax-test.network/ext/bc/C/rpc',
    EXPLORER_URL: 'https://testnet.snowscan.xyz',
    NATIVE_CURRENCY: {
      name: 'AVAX',
      symbol: 'AVAX',
      decimals: 18,
    },
  },
  AVALANCHE: {
    CHAIN_ID: 43114,
    CHAIN_NAME: 'Avalanche Mainnet',
    RPC_URL: 'https://api.avax.network/ext/bc/C/rpc',
    EXPLORER_URL: 'https://snowscan.xyz',
    NATIVE_CURRENCY: {
      name: 'AVAX',
      symbol: 'AVAX',
      decimals: 18,
    },
  },
};

// ============================================================================
// Gas Estimation
// ============================================================================
export const GAS_ESTIMATION = {
  REGISTRATION: {
    GAS_LIMIT: 500000,
    ESTIMATED_COST_AVAX: 0.002,
    ESTIMATED_COST_USD: 0.08,
  },
  INTEGRATION: {
    GAS_LIMIT: 200000,
    ESTIMATED_COST_AVAX: 0.0008,
    ESTIMATED_COST_USD: 0.03,
  },
};

// ============================================================================
// Integration Platforms
// ============================================================================
export const INTEGRATION_PLATFORMS = {
  CLAWDBOT: {
    id: 'clawdbot',
    name: 'Clawdbot',
    description: 'AI Agent platform with advanced analytics',
    icon: 'bot',
    enabled: true,
  },
  HAVEN: {
    id: 'haven',
    name: 'Haven Framework',
    description: 'Autonomous agent coordination protocol',
    icon: 'shield',
    enabled: true,
  },
  // Can add more platforms later
};
