/**
 * Contract ABIs for HAVEN Protocol
 * Minimal ABI definitions for essential functions
 */

export const AgentRegistryABI = [
  'function registerAgent(string metadataURI, bytes32[] capabilities) external',
  'function updateMetadata(string newMetadataURI) external',
  'function updateCapabilities(bytes32[] newCapabilities) external',
  'function getAgent(address agent) external view returns (tuple(address agentAddress, string metadataURI, bytes32[] capabilities, uint256 registeredAt, uint256 verifiedAt, bool exists) info)',
  'function isRegistered(address agent) external view returns (bool)',
  'function isVerified(address agent) external view returns (bool)',
  'function getCapabilities(address agent) external view returns (bytes32[])',
  'event AgentRegistered(address indexed agentAddress, string metadataURI, bytes32[] capabilities, uint256 timestamp)',
  'event AgentMetadataUpdated(address indexed agentAddress, string oldURI, string newURI, uint256 timestamp)',
  'event AgentCapabilitiesUpdated(address indexed agentAddress, bytes32[] capabilities, uint256 timestamp)',
  'event AgentVerified(address indexed agentAddress, bytes32 proofHash, uint256 timestamp)',
] as const;

export const AgentReputationABI = [
  'function stake(uint256 amount, uint256 lockPeriod) external',
  'function withdraw(uint256 amount) external',
  'function getReputation(address agent) external view returns (tuple(uint256 score, uint256 tasksCompleted, uint256 tasksFailed, uint256 totalEarnings, uint256 stakedAmount, uint256 unlockTime) info)',
  'function getScore(address agent) external view returns (uint256)',
  'function getStakedAmount(address agent) external view returns (uint256)',
  'function getVotingPower(address account) external view returns (uint256)',
  'function canWithdraw(address agent) external view returns (bool)',
  'event ReputationUpdated(address indexed agent, int256 delta, uint256 newScore)',
  'event TokensStaked(address indexed agent, uint256 amount, uint256 unlockTime)',
  'event TokensWithdrawn(address indexed agent, uint256 amount)',
  'event TaskCompleted(address indexed agent, uint256 reward)',
  'event TaskFailed(address indexed agent, uint256 penalty)',
] as const;

export const HavenGovernanceABI = [
  'function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) external returns (uint256)',
  'function castVote(uint256 proposalId, uint8 support) external returns (uint256)',
  'function castVoteBySig(uint256 proposalId, uint8 support, uint8 v, bytes32 r, bytes32 s) external returns (uint256)',
  'function getVotes(address account) external view returns (uint256)',
  'function getPastVotes(address account, uint256 blockNumber) external view returns (uint256)',
  'function proposalCount() external view returns (uint256)',
  'function state(uint256 proposalId) external view returns (uint8)',
  'function proposalDeadline(uint256 proposalId) external view returns (uint256)',
  'function proposalSnapshot(uint256 proposalId) external view returns (uint256)',
  'function quorum(uint256 blockNumber) external view returns (uint256)',
  'event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description)',
  'event VoteCast(address indexed voter, uint256 indexed proposalId, uint8 support, uint256 weight, string reason)',
  'event ProposalExecuted(uint256 indexed proposalId)',
  'event ProposalCanceled(uint256 indexed proposalId)',
] as const;

export const TaskMarketplaceABI = [
  'function createTask(string description, bytes32 requiredCapability, uint256 reward, address rewardToken, uint256 deadline) external payable returns (uint256)',
  'function acceptTask(uint256 taskId) external',
  'function completeTask(uint256 taskId, string resultURI) external',
  'function claimReward(uint256 taskId) external',
  'function cancelTask(uint256 taskId) external',
  'function getTask(uint256 taskId) external view returns (tuple(uint256 taskId, address creator, address solver, string description, bytes32 requiredCapability, uint256 reward, address rewardToken, uint8 status, uint256 createdAt, uint256 deadline, string resultURI) task)',
  'function getTaskCount() external view returns (uint256)',
  'event TaskCreated(uint256 indexed taskId, address indexed creator, uint256 reward)',
  'event TaskAccepted(uint256 indexed taskId, address indexed solver)',
  'event TaskCompleted(uint256 indexed taskId, string resultURI)',
  'event TaskRewardClaimed(uint256 indexed taskId, address indexed claimer)',
  'event TaskCancelled(uint256 indexed taskId)',
] as const;

export const HAVENABI = [
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function mint(address to, uint256 amount) external',
  'function burn(uint256 amount) external',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
] as const;

export const ERC6551RegistryABI = [
  'function createAccount(address implementation, uint256 chainId, address tokenContract, uint256 tokenId, uint256 salt) external returns (address)',
  'function account(address implementation, uint256 chainId, address tokenContract, uint256 tokenId, uint256 salt) external view returns (address)',
  'event AccountCreated(address indexed account, address indexed implementation, uint256 chainId, address indexed tokenContract, uint256 tokenId)',
] as const;

export const ERC8004RegistryABI = [
  'function mint(address to, string metadataURI) external returns (uint256)',
  'function tokenURI(uint256 tokenId) external view returns (string)',
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function isRegistered(uint256 tokenId) external view returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
] as const;
