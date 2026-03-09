import { Provider, Signer, Contract, ethers } from 'ethers';
import { EventEmitter } from '@havenclaw/runtime';

/**
 * Contract Addresses Configuration
 */
interface ContractAddresses {
    agentRegistry: string;
    agentReputation: string;
    havenGovernance: string;
    taskMarketplace: string;
    havenToken: string;
    erc8004Registry?: string;
    erc6551Registry?: string;
    gat?: string;
    escrow?: string;
}
/**
 * Fuji Testnet Contract Addresses (Deployed)
 */
declare const FUJI_CONTRACTS: ContractAddresses;
/**
 * Get contract addresses for a specific network
 */
declare function getContractAddresses(chainId?: number): ContractAddresses;

/**
 * HavenClient - Main interface for HAVEN protocol interaction
 */

type AgentRegistryContract = Contract;
type AgentReputationContract = Contract;
type HavenGovernanceContract = Contract;
type TaskMarketplaceContract = Contract;
type HAVENContract = Contract;
type ERC6551RegistryContract = Contract;
type ERC8004RegistryContract = Contract;
interface HavenClientConfig {
    rpcUrl: string;
    contracts: ContractAddresses;
}
interface NetworkInfo {
    chainId: bigint;
    name: string;
}
/**
 * HavenClient provides read/write access to HAVEN protocol contracts
 */
declare class HavenClient {
    provider: Provider;
    signer?: Signer;
    readonly contracts: ContractAddresses;
    agentRegistry: AgentRegistryContract;
    agentReputation: AgentReputationContract;
    havenGovernance: HavenGovernanceContract;
    taskMarketplace: TaskMarketplaceContract;
    havenToken: HAVENContract;
    erc6551Registry?: ERC6551RegistryContract;
    erc8004Registry?: ERC8004RegistryContract;
    constructor(config: HavenClientConfig);
    /**
     * Connect a signer to enable write operations
     */
    connectSigner(signer: Signer): Promise<void>;
    /**
     * Get network information
     */
    getNetworkInfo(): Promise<NetworkInfo>;
    /**
     * Get current block number
     */
    getBlockNumber(): Promise<bigint>;
    /**
     * Get balance of an address (ETH/AVAX)
     */
    getBalance(address: string): Promise<bigint>;
    /**
     * Get HAVEN token balance
     */
    getHAVENBalance(address: string): Promise<bigint>;
    /**
     * Wait for transaction confirmation
     */
    waitForTransaction(txHash: string, confirmations?: number): Promise<ethers.TransactionReceipt>;
    /**
     * Get gas price data
     */
    getFeeData(): Promise<ethers.FeeData>;
    /**
     * Get nonce for an address
     */
    getTransactionCount(address: string): Promise<number>;
    /**
     * Estimate gas for a transaction
     */
    estimateGas(to: string, data: string, value?: bigint): Promise<bigint>;
    /**
     * Call a contract read function
     */
    callContract(contractAddress: string, abi: readonly string[], functionName: string, args?: any[]): Promise<any>;
    private _createContract;
    private _getNetworkName;
}

/**
 * Event Listener - Subscribe to HAVEN protocol events
 */

interface EventListenerConfig {
    pollingInterval?: number;
    fromBlock?: bigint;
    enabled?: {
        governance?: boolean;
        tasks?: boolean;
        reputation?: boolean;
        agentRegistry?: boolean;
    };
}
interface EventSubscription {
    name: string;
    remove: () => void;
}
/**
 * EventListener subscribes to HAVEN protocol events
 */
declare class EventListener {
    private client;
    private eventEmitter;
    private config;
    private subscriptions;
    private running;
    constructor(client: HavenClient, eventEmitter: EventEmitter, config?: EventListenerConfig);
    /**
     * Start listening for events
     */
    start(): Promise<void>;
    /**
     * Stop listening for events
     */
    stop(): Promise<void>;
    /**
     * Subscribe to governance events
     */
    private subscribeToGovernance;
    /**
     * Subscribe to task events
     */
    private subscribeToTasks;
    /**
     * Subscribe to reputation events
     */
    private subscribeToReputation;
    /**
     * Subscribe to agent registry events
     */
    private subscribeToAgentRegistry;
    /**
     * Get active subscription count
     */
    getSubscriptionCount(): number;
    /**
     * Check if listener is running
     */
    isRunning(): boolean;
    private _bytes32ToString;
}

/**
 * State Reader - Query HAVEN protocol state with caching
 */

interface CacheConfig {
    ttl: number;
    maxSize: number;
}
/**
 * Simple in-memory cache with TTL
 */
declare class Cache {
    private cache;
    readonly ttl: number;
    readonly maxSize: number;
    constructor(config?: CacheConfig);
    get<T>(key: string): T | null;
    set<T>(key: string, value: T): void;
    delete(key: string): boolean;
    clear(): void;
    size(): number;
    /**
     * Get or compute value
     */
    getOrCompute<T>(key: string, compute: () => Promise<T>): Promise<T>;
}
/**
 * StateReader provides cached read access to HAVEN protocol state
 */
declare class StateReader {
    private client;
    private cache;
    constructor(client: HavenClient, cacheConfig?: CacheConfig);
    /**
     * Get agent registration info
     */
    getAgentInfo(agentAddress: string): Promise<AgentInfo | null>;
    /**
     * Get agent reputation info
     */
    getReputationInfo(agentAddress: string): Promise<ReputationInfo>;
    /**
     * Get proposal info
     */
    getProposalInfo(proposalId: bigint): Promise<ProposalInfo>;
    /**
     * Get task info
     */
    getTaskInfo(taskId: bigint): Promise<TaskInfo | null>;
    /**
     * Get all active proposals
     */
    getActiveProposals(): Promise<ProposalInfo[]>;
    /**
     * Get all open tasks
     */
    getOpenTasks(): Promise<TaskInfo[]>;
    /**
     * Get agent voting power
     */
    getVotingPower(agentAddress: string): Promise<bigint>;
    /**
     * Get HAVEN token balance
     */
    getHAVENBalance(address: string): Promise<bigint>;
    /**
     * Invalidate cache for a specific key
     */
    invalidate(key: string): void;
    /**
     * Clear entire cache
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        maxSize: number;
    };
    private _bytes32ToString;
}
type ProposalState = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
type TaskStatus = 0 | 1 | 2 | 3;
interface AgentInfo {
    agentAddress: string;
    metadataURI: string;
    capabilities: string[];
    registeredAt: bigint;
    verifiedAt: bigint;
    exists: boolean;
}
interface ReputationInfo {
    score: bigint;
    tasksCompleted: bigint;
    tasksFailed: bigint;
    totalEarnings: bigint;
    stakedAmount: bigint;
    unlockTime: bigint;
}
interface ProposalInfo {
    proposalId: bigint;
    state: ProposalState;
    startBlock: bigint;
    endBlock: bigint;
}
interface TaskInfo {
    taskId: bigint;
    creator: string;
    solver: string;
    description: string;
    requiredCapability: string;
    reward: bigint;
    rewardToken: string;
    status: TaskStatus;
    createdAt: bigint;
    deadline: bigint;
    resultURI: string;
}

/**
 * Contract ABIs for HAVEN Protocol
 * Minimal ABI definitions for essential functions
 */
declare const AgentRegistryABI: readonly ["function registerAgent(string metadataURI, bytes32[] capabilities) external", "function updateMetadata(string newMetadataURI) external", "function updateCapabilities(bytes32[] newCapabilities) external", "function getAgent(address agent) external view returns (tuple(address agentAddress, string metadataURI, bytes32[] capabilities, uint256 registeredAt, uint256 verifiedAt, bool exists) info)", "function isRegistered(address agent) external view returns (bool)", "function isVerified(address agent) external view returns (bool)", "function getCapabilities(address agent) external view returns (bytes32[])", "event AgentRegistered(address indexed agentAddress, string metadataURI, bytes32[] capabilities, uint256 timestamp)", "event AgentMetadataUpdated(address indexed agentAddress, string oldURI, string newURI, uint256 timestamp)", "event AgentCapabilitiesUpdated(address indexed agentAddress, bytes32[] capabilities, uint256 timestamp)", "event AgentVerified(address indexed agentAddress, bytes32 proofHash, uint256 timestamp)"];
declare const AgentReputationABI: readonly ["function stake(uint256 amount, uint256 lockPeriod) external", "function withdraw(uint256 amount) external", "function getReputation(address agent) external view returns (tuple(uint256 score, uint256 tasksCompleted, uint256 tasksFailed, uint256 totalEarnings, uint256 stakedAmount, uint256 unlockTime) info)", "function getScore(address agent) external view returns (uint256)", "function getStakedAmount(address agent) external view returns (uint256)", "function getVotingPower(address account) external view returns (uint256)", "function canWithdraw(address agent) external view returns (bool)", "event ReputationUpdated(address indexed agent, int256 delta, uint256 newScore)", "event TokensStaked(address indexed agent, uint256 amount, uint256 unlockTime)", "event TokensWithdrawn(address indexed agent, uint256 amount)", "event TaskCompleted(address indexed agent, uint256 reward)", "event TaskFailed(address indexed agent, uint256 penalty)"];
declare const HavenGovernanceABI: readonly ["function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) external returns (uint256)", "function castVote(uint256 proposalId, uint8 support) external returns (uint256)", "function castVoteBySig(uint256 proposalId, uint8 support, uint8 v, bytes32 r, bytes32 s) external returns (uint256)", "function getVotes(address account) external view returns (uint256)", "function getPastVotes(address account, uint256 blockNumber) external view returns (uint256)", "function proposalCount() external view returns (uint256)", "function state(uint256 proposalId) external view returns (uint8)", "function proposalDeadline(uint256 proposalId) external view returns (uint256)", "function proposalSnapshot(uint256 proposalId) external view returns (uint256)", "function quorum(uint256 blockNumber) external view returns (uint256)", "event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description)", "event VoteCast(address indexed voter, uint256 indexed proposalId, uint8 support, uint256 weight, string reason)", "event ProposalExecuted(uint256 indexed proposalId)", "event ProposalCanceled(uint256 indexed proposalId)"];
declare const TaskMarketplaceABI: readonly ["function createTask(string description, bytes32 requiredCapability, uint256 reward, address rewardToken, uint256 deadline) external payable returns (uint256)", "function acceptTask(uint256 taskId) external", "function completeTask(uint256 taskId, string resultURI) external", "function claimReward(uint256 taskId) external", "function cancelTask(uint256 taskId) external", "function getTask(uint256 taskId) external view returns (tuple(uint256 taskId, address creator, address solver, string description, bytes32 requiredCapability, uint256 reward, address rewardToken, uint8 status, uint256 createdAt, uint256 deadline, string resultURI) task)", "function getTaskCount() external view returns (uint256)", "event TaskCreated(uint256 indexed taskId, address indexed creator, uint256 reward)", "event TaskAccepted(uint256 indexed taskId, address indexed solver)", "event TaskCompleted(uint256 indexed taskId, string resultURI)", "event TaskRewardClaimed(uint256 indexed taskId, address indexed claimer)", "event TaskCancelled(uint256 indexed taskId)"];
declare const HAVENABI: readonly ["function name() external view returns (string)", "function symbol() external view returns (string)", "function decimals() external view returns (uint8)", "function totalSupply() external view returns (uint256)", "function balanceOf(address account) external view returns (uint256)", "function transfer(address to, uint256 amount) external returns (bool)", "function approve(address spender, uint256 amount) external returns (bool)", "function allowance(address owner, address spender) external view returns (uint256)", "function mint(address to, uint256 amount) external", "function burn(uint256 amount) external", "event Transfer(address indexed from, address indexed to, uint256 value)", "event Approval(address indexed owner, address indexed spender, uint256 value)"];
declare const ERC6551RegistryABI: readonly ["function createAccount(address implementation, uint256 chainId, address tokenContract, uint256 tokenId, uint256 salt) external returns (address)", "function account(address implementation, uint256 chainId, address tokenContract, uint256 tokenId, uint256 salt) external view returns (address)", "event AccountCreated(address indexed account, address indexed implementation, uint256 chainId, address indexed tokenContract, uint256 tokenId)"];
declare const ERC8004RegistryABI: readonly ["function mint(address to, string metadataURI) external returns (uint256)", "function tokenURI(uint256 tokenId) external view returns (string)", "function ownerOf(uint256 tokenId) external view returns (address)", "function isRegistered(uint256 tokenId) external view returns (bool)", "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"];

export { type AgentInfo, AgentRegistryABI, AgentReputationABI, Cache, type CacheConfig, type ContractAddresses, ERC6551RegistryABI, ERC8004RegistryABI, EventListener, type EventListenerConfig, type EventSubscription, FUJI_CONTRACTS, HAVENABI, HavenClient, type HavenClientConfig, HavenGovernanceABI, type NetworkInfo, type ProposalInfo, type ProposalState, type ReputationInfo, StateReader, type TaskInfo, TaskMarketplaceABI, type TaskStatus, getContractAddresses };
