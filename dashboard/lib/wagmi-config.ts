import { http, createConfig } from 'wagmi';
import { avalancheFuji, mainnet } from 'wagmi/chains';
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';

// OpenClaw Contract Addresses (Fuji Testnet)
// Source: /root/soft/openclaw-agent/agent-config-fuji.yaml (Latest Deployment March 8, 2026)
export const HAVENCLAW_CONTRACTS = {
  // ERC-8004 Official AI Agent Identity
  erc8004Registry: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
  erc8004Reputation: '0x8004B663056A597Dffe9eCcC1965A193B7388713',
  
  // HavenClaw Protocol (OpenClaw)
  registry: '0xe97f0c1378A75a4761f20220d64c31787FC9e321', // AgentRegistry
  reputation: '0x5964119472d9dEA5B73B7A9a911a6B2Af870dE19', // AgentReputation
  governance: '0xCa2494A2725DeCf613628a2a70600c6495dB9369', // HavenGovernance
  havenToken: '0x0f847172d1C496dd847d893A0318dBF4B826ef63',
  taskMarketplace: '0x582fa485d560ec4c2E4DC50D14B1f29C29240e3a',
  
  // Optional
  gat: '0xa91393D9f9A770e70E02128BCF6b2413Ca391212',
  escrow: '0xC4Bb287c74FF92cD4B0c62D51523a03FD0F0C543',
  paymentProtocol: '0xef925Ff5F5e41498c4CC26DC006E21F1fdB40816',
} as const;

// Contract ABIs from /root/soft/openclaw-agent/packages/contract-client/src/abi/
export const REGISTRY_ABI = [
  {
    inputs: [{ name: 'tbaAddress', type: 'address' }],
    name: 'isAgent',
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tbaAddress', type: 'address' }],
    name: 'getAgent',
    outputs: [{
      type: 'tuple',
      components: [
        { name: 'tbaAddress', type: 'address' },
        { name: 'nftTokenId', type: 'uint256' },
        { name: 'metadataUri', type: 'string' },
        { name: 'capabilities', type: 'bytes32[]' },
        { name: 'registeredAt', type: 'uint256' },
        { name: 'active', type: 'bool' },
      ],
    }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'tbaAddress', type: 'address' },
      { name: 'nftTokenId', type: 'uint256' },
      { name: 'metadataUri', type: 'string' },
      { name: 'capabilities', type: 'bytes32[]' },
    ],
    name: 'registerAgent',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export const TASK_MARKETPLACE_ABI = [
  {
    inputs: [],
    name: 'getOpenTasks',
    outputs: [{ type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'taskId', type: 'uint256' }],
    name: 'getTask',
    outputs: [{
      type: 'tuple',
      components: [
        { name: 'taskId', type: 'uint256' },
        { name: 'creator', type: 'address' },
        { name: 'solver', type: 'address' },
        { name: 'description', type: 'string' },
        { name: 'requiredCapability', type: 'bytes32' },
        { name: 'reward', type: 'uint256' },
        { name: 'rewardToken', type: 'address' },
        { name: 'status', type: 'uint8' },
        { name: 'createdAt', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
        { name: 'resultURI', type: 'string' },
        { name: 'completedAt', type: 'uint256' },
      ],
    }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'taskId', type: 'uint256' }],
    name: 'acceptTask',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export const GOVERNANCE_ABI = [
  {
    inputs: [],
    name: 'getActiveProposals',
    outputs: [{ type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    name: 'getProposal',
    outputs: [{
      type: 'tuple',
      components: [
        { name: 'proposalId', type: 'uint256' },
        { name: 'proposer', type: 'address' },
        { name: 'description', type: 'string' },
        { name: 'metadataURI', type: 'string' },
        { name: 'startBlock', type: 'uint256' },
        { name: 'endBlock', type: 'uint256' },
        { name: 'forVotes', type: 'uint256' },
        { name: 'againstVotes', type: 'uint256' },
        { name: 'abstainVotes', type: 'uint256' },
        { name: 'state', type: 'uint8' },
        { name: 'createdAt', type: 'uint256' },
        { name: 'capabilityHashes', type: 'bytes32[]' },
      ],
    }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'support', type: 'uint8' },
      { name: 'reason', type: 'string' },
    ],
    name: 'castVote',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export const REPUTATION_ABI = [
  {
    inputs: [{ name: 'agent', type: 'address' }],
    name: 'getReputation',
    outputs: [{
      type: 'tuple',
      components: [
        { name: 'agent', type: 'address' },
        { name: 'score', type: 'uint256' },
        { name: 'tasksCompleted', type: 'uint256' },
        { name: 'tasksFailed', type: 'uint256' },
        { name: 'proposalsVoted', type: 'uint256' },
        { name: 'correctVotes', type: 'uint256' },
        { name: 'stakedAmount', type: 'uint256' },
        { name: 'unlockTime', type: 'uint256' },
        { name: 'lastUpdated', type: 'uint256' },
      ],
    }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'lockPeriod', type: 'uint256' },
    ],
    name: 'stake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// wagmi config
export const config = createConfig({
  chains: [avalancheFuji, mainnet],
  connectors: [
    injected(),
    coinbaseWallet({
      appName: 'HavenClaw Dashboard',
    }),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo',
    }),
  ],
  transports: {
    [avalancheFuji.id]: http(),
    [mainnet.id]: http(),
  },
});

// Helper functions
export function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatEther(wei: bigint): string {
  return (Number(wei) / 1e18).toFixed(4);
}

export function formatTimestamp(timestamp: number | bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString();
}

export function getTimeRemaining(deadline: number | bigint): string {
  const now = Date.now() / 1000;
  const remaining = Number(deadline) - now;
  
  if (remaining <= 0) return 'Expired';
  
  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  
  return `${hours}h ${minutes}m`;
}
