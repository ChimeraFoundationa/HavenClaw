import { Signer, Contract, JsonRpcProvider, Wallet, ContractTransactionResponse } from 'ethers';

/**
 * HPP Client - HavenClaw Payment Protocol Client
 *
 * TypeScript client for interacting with HPP contracts
 */

interface HPPConfig {
    rpcUrl: string;
    hppAddress: string;
    privateKey?: string;
    signer?: Signer;
}
interface PaymentInfo {
    id: bigint;
    payer: string;
    agent: string;
    amount: bigint;
    token: string;
    conditionHash: string;
    deadline: bigint;
    released: boolean;
    disputed: boolean;
    createdAt: bigint;
}
interface AgentInfo$1 {
    wallet: string;
    registered: boolean;
    totalEarned: bigint;
    completedTasks: bigint;
    metadataURI: string;
}
declare class HPPClient {
    private contract;
    private signer?;
    constructor(config: HPPConfig);
    /**
     * Create HPP client from config
     */
    static create(config: HPPConfig): HPPClient;
    /**
     * Register as an agent
     */
    registerAgent(metadataURI: string): Promise<any>;
    /**
     * Get agent information
     */
    getAgent(address: string): Promise<AgentInfo$1>;
    /**
     * Check if address is registered agent
     */
    isAgent(address: string): Promise<boolean>;
    /**
     * Create a payment (native token)
     */
    createPayment(agent: string, conditionHash: string | Uint8Array, deadline: number | bigint, metadataURI: string, amount: bigint): Promise<{
        paymentId: any;
        receipt: any;
    }>;
    /**
     * Create a payment (ERC20 token)
     */
    createPaymentERC20(agent: string, token: string, amount: bigint, conditionHash: string | Uint8Array, deadline: number | bigint, metadataURI: string): Promise<{
        paymentId: any;
        receipt: any;
    }>;
    /**
     * Release payment (agent claims with proof)
     */
    releasePayment(paymentId: bigint | number, proof: string | Uint8Array): Promise<any>;
    /**
     * Refund payment (after deadline)
     */
    refundPayment(paymentId: bigint | number): Promise<any>;
    /**
     * Dispute payment
     */
    disputePayment(paymentId: bigint | number, reason: string): Promise<any>;
    /**
     * Get payment information
     */
    getPayment(paymentId: bigint | number): Promise<PaymentInfo>;
    /**
     * Get all payments for an agent
     */
    getAgentPayments(agent: string): Promise<bigint[]>;
    /**
     * Check if payment condition is met
     */
    isConditionMet(paymentId: bigint | number): Promise<boolean>;
}

/**
 * @havenclaw/contract-client - Smart contract clients for OpenClaw Agent
 *
 * @packageDocumentation
 */

interface AgentInfo {
    agentAddress: string;
    nftTokenId: bigint;
    metadataUri: string;
    capabilities: string[];
    registeredAt: bigint;
    active: boolean;
}
interface RegisterAgentParams {
    agentAddress: string;
    nftTokenId: bigint;
    metadataUri: string;
    capabilities: string[];
}
declare enum TaskStatus {
    Open = 0,
    Accepted = 1,
    InProgress = 2,
    Completed = 3,
    Disputed = 4,
    Cancelled = 5
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
    resultUri: string;
    completedAt: bigint;
}
interface CreateTaskParams {
    description: string;
    requiredCapability: string;
    reward: bigint;
    rewardToken: string;
    deadline: bigint;
}
declare enum ProposalState {
    Pending = 0,
    Active = 1,
    Succeeded = 2,
    Defeated = 3,
    Queued = 4,
    Executed = 5
}
interface ProposalInfo {
    proposalId: bigint;
    proposer: string;
    description: string;
    metadataUri: string;
    startBlock: bigint;
    endBlock: bigint;
    forVotes: bigint;
    againstVotes: bigint;
    abstainVotes: bigint;
    state: ProposalState;
    createdAt: bigint;
    capabilityHashes: string[];
}
declare enum VoteSupport {
    Against = 0,
    For = 1,
    Abstain = 2
}
interface CastVoteParams {
    proposalId: bigint;
    support: VoteSupport;
    reason?: string;
}
interface ReputationInfo {
    agent: string;
    score: bigint;
    tasksCompleted: bigint;
    tasksFailed: bigint;
    stakedAmount: bigint;
    unlockTime: bigint;
}
interface StakeParams {
    amount: bigint;
    lockPeriod: bigint;
}
interface ContractAddresses {
    registry: string;
    taskMarketplace: string;
    governance: string;
    reputation: string;
}
interface ClientConfig {
    rpcUrl: string;
    contracts: ContractAddresses;
    privateKey?: string;
}
declare class RegistryClient {
    contract: Contract;
    private signer?;
    constructor(address: string, providerOrSigner: JsonRpcProvider | Wallet);
    connect(signer: Wallet): Promise<RegistryClient>;
    getAddress(): Promise<string>;
    registerAgent(params: RegisterAgentParams): Promise<ContractTransactionResponse>;
    isAgent(agentAddress: string): Promise<boolean>;
    getAgent(agentAddress: string): Promise<AgentInfo | null>;
    hasCapability(agentAddress: string, capability: string): Promise<boolean>;
}
declare class TaskClient {
    contract: Contract;
    private signer?;
    constructor(address: string, providerOrSigner: JsonRpcProvider | Wallet);
    connect(signer: Wallet): Promise<TaskClient>;
    getAddress(): Promise<string>;
    createTask(params: CreateTaskParams): Promise<ContractTransactionResponse>;
    acceptTask(taskId: bigint): Promise<ContractTransactionResponse>;
    completeTask(taskId: bigint, resultUri: string, proof?: string): Promise<ContractTransactionResponse>;
    getTask(taskId: bigint): Promise<TaskInfo | null>;
    getOpenTasks(): Promise<bigint[]>;
}
declare class GovernanceClient {
    contract: Contract;
    private signer?;
    constructor(address: string, providerOrSigner: JsonRpcProvider | Wallet);
    connect(signer: Wallet): Promise<GovernanceClient>;
    getAddress(): Promise<string>;
    createProposal(description: string, metadataUri: string): Promise<ContractTransactionResponse>;
    castVote(proposalId: bigint, support: VoteSupport, reason?: string): Promise<ContractTransactionResponse>;
    getProposal(proposalId: bigint): Promise<ProposalInfo | null>;
    getProposalState(proposalId: bigint): Promise<ProposalState>;
    getActiveProposals(): Promise<bigint[]>;
    getVotingPower(voter: string): Promise<bigint>;
}
declare class ReputationClient {
    contract: Contract;
    private signer?;
    constructor(address: string, providerOrSigner: JsonRpcProvider | Wallet);
    connect(signer: Wallet): Promise<ReputationClient>;
    getAddress(): Promise<string>;
    initializeReputation(agent: string): Promise<ContractTransactionResponse>;
    getReputation(agent: string): Promise<ReputationInfo | null>;
    stake(amount: bigint, lockPeriod: bigint): Promise<ContractTransactionResponse>;
    getVotingPower(agent: string): Promise<bigint>;
}
declare class OpenClawContractClient {
    registry: RegistryClient;
    task: TaskClient;
    governance: GovernanceClient;
    reputation: ReputationClient;
    private constructor();
    static createReadOnly(config: ClientConfig): OpenClawContractClient;
    static create(config: ClientConfig): OpenClawContractClient;
    getContractAddresses(): ContractAddresses;
}

export { type AgentInfo, type CastVoteParams, type ClientConfig, type ContractAddresses, type CreateTaskParams, GovernanceClient, type AgentInfo$1 as HPPAgentInfo, HPPClient, type HPPConfig, OpenClawContractClient, type PaymentInfo, type ProposalInfo, ProposalState, type RegisterAgentParams, RegistryClient, ReputationClient, type ReputationInfo, type StakeParams, TaskClient, type TaskInfo, TaskStatus, VoteSupport };
