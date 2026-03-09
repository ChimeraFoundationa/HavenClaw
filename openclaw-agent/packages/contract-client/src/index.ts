/**
 * @havenclaw/contract-client - Smart contract clients for OpenClaw Agent
 *
 * @packageDocumentation
 */

import { ethers, Wallet, JsonRpcProvider, Contract, ContractTransactionResponse } from 'ethers';

// ============ Types ============

export interface AgentInfo {
  agentAddress: string;
  nftTokenId: bigint;
  metadataUri: string;
  capabilities: string[];
  registeredAt: bigint;
  active: boolean;
}

export interface RegisterAgentParams {
  agentAddress: string;
  nftTokenId: bigint;
  metadataUri: string;
  capabilities: string[];
}

export enum TaskStatus {
  Open = 0,
  Accepted = 1,
  InProgress = 2,
  Completed = 3,
  Disputed = 4,
  Cancelled = 5,
}

export interface TaskInfo {
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

export interface CreateTaskParams {
  description: string;
  requiredCapability: string;
  reward: bigint;
  rewardToken: string;
  deadline: bigint;
}

export enum ProposalState {
  Pending = 0,
  Active = 1,
  Succeeded = 2,
  Defeated = 3,
  Queued = 4,
  Executed = 5,
}

export interface ProposalInfo {
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

export enum VoteSupport {
  Against = 0,
  For = 1,
  Abstain = 2,
}

export interface CastVoteParams {
  proposalId: bigint;
  support: VoteSupport;
  reason?: string;
}

export interface ReputationInfo {
  agent: string;
  score: bigint;
  tasksCompleted: bigint;
  tasksFailed: bigint;
  stakedAmount: bigint;
  unlockTime: bigint;
}

export interface StakeParams {
  amount: bigint;
  lockPeriod: bigint;
}

export interface ContractAddresses {
  registry: string;
  taskMarketplace: string;
  governance: string;
  reputation: string;
}

export interface ClientConfig {
  rpcUrl: string;
  contracts: ContractAddresses;
  privateKey?: string;
}

// ============ ABI Imports ============

import RegistryABI from './abi/Registry.json' with { type: 'json' };
import TaskMarketplaceABI from './abi/TaskMarketplace.json' with { type: 'json' };
import GovernanceABI from './abi/Governance.json' with { type: 'json' };
import ReputationABI from './abi/Reputation.json' with { type: 'json' };

// ============ RegistryClient ============

export class RegistryClient {
  public contract: Contract;
  private signer?: Wallet;

  constructor(address: string, providerOrSigner: JsonRpcProvider | Wallet) {
    try {
      this.signer = providerOrSigner as Wallet;
      this.contract = new Contract(address, RegistryABI, this.signer);
    } catch {
      this.contract = new Contract(address, RegistryABI, providerOrSigner as JsonRpcProvider);
    }
  }

  async connect(signer: Wallet): Promise<RegistryClient> {
    return new RegistryClient(await this.getAddress(), signer);
  }

  async getAddress(): Promise<string> {
    return this.contract.getAddress();
  }

  async registerAgent(params: RegisterAgentParams): Promise<ContractTransactionResponse> {
    if (!this.signer) throw new Error('Signer not connected');
    const capabilityHashes = params.capabilities.map((c: string) => ethers.id(c));
    return this.contract.registerAgent(params.agentAddress, params.nftTokenId, params.metadataUri, capabilityHashes);
  }

  async isAgent(agentAddress: string): Promise<boolean> {
    return this.contract.isAgent(agentAddress);
  }

  async getAgent(agentAddress: string): Promise<AgentInfo | null> {
    try {
      const agent = await this.contract.getAgent(agentAddress);
      return {
        agentAddress: agent.agentAddress,
        nftTokenId: agent.nftTokenId,
        metadataUri: agent.metadataUri,
        capabilities: agent.capabilities,
        registeredAt: agent.registeredAt,
        active: agent.active,
      };
    } catch {
      return null;
    }
  }

  async hasCapability(agentAddress: string, capability: string): Promise<boolean> {
    return this.contract.hasCapability(agentAddress, ethers.id(capability));
  }
}

// ============ TaskClient ============

export class TaskClient {
  public contract: Contract;
  private signer?: Wallet;

  constructor(address: string, providerOrSigner: JsonRpcProvider | Wallet) {
    try {
      this.signer = providerOrSigner as Wallet;
      this.contract = new Contract(address, TaskMarketplaceABI, this.signer);
    } catch {
      this.contract = new Contract(address, TaskMarketplaceABI, providerOrSigner as JsonRpcProvider);
    }
  }

  async connect(signer: Wallet): Promise<TaskClient> {
    return new TaskClient(await this.getAddress(), signer);
  }

  async getAddress(): Promise<string> {
    return this.contract.getAddress();
  }

  async createTask(params: CreateTaskParams): Promise<ContractTransactionResponse> {
    if (!this.signer) throw new Error('Signer not connected');
    const capabilityHash = ethers.id(params.requiredCapability);
    if (params.rewardToken === ethers.ZeroAddress) {
      return this.contract.createTask(params.description, capabilityHash, params.reward, params.rewardToken, params.deadline, { value: params.reward });
    }
    return this.contract.createTask(params.description, capabilityHash, params.reward, params.rewardToken, params.deadline);
  }

  async acceptTask(taskId: bigint): Promise<ContractTransactionResponse> {
    if (!this.signer) throw new Error('Signer not connected');
    return this.contract.acceptTask(taskId);
  }

  async completeTask(taskId: bigint, resultUri: string, proof?: string): Promise<ContractTransactionResponse> {
    if (!this.signer) throw new Error('Signer not connected');
    return this.contract.completeTask(taskId, resultUri, proof || '0x');
  }

  async getTask(taskId: bigint): Promise<TaskInfo | null> {
    try {
      const task = await this.contract.getTask(taskId);
      return {
        taskId: task.taskId,
        creator: task.creator,
        solver: task.solver,
        description: task.description,
        requiredCapability: task.requiredCapability,
        reward: task.reward,
        rewardToken: task.rewardToken,
        status: task.status,
        createdAt: task.createdAt,
        deadline: task.deadline,
        resultUri: task.resultUri,
        completedAt: task.completedAt,
      };
    } catch {
      return null;
    }
  }

  async getOpenTasks(): Promise<bigint[]> {
    return this.contract.getOpenTasks();
  }
}

// ============ GovernanceClient ============

export class GovernanceClient {
  public contract: Contract;
  private signer?: Wallet;

  constructor(address: string, providerOrSigner: JsonRpcProvider | Wallet) {
    try {
      this.signer = providerOrSigner as Wallet;
      this.contract = new Contract(address, GovernanceABI, this.signer);
    } catch {
      this.contract = new Contract(address, GovernanceABI, providerOrSigner as JsonRpcProvider);
    }
  }

  async connect(signer: Wallet): Promise<GovernanceClient> {
    return new GovernanceClient(await this.getAddress(), signer);
  }

  async getAddress(): Promise<string> {
    return this.contract.getAddress();
  }

  async createProposal(description: string, metadataUri: string): Promise<ContractTransactionResponse> {
    if (!this.signer) throw new Error('Signer not connected');
    return this.contract.createProposal(description, metadataUri, []);
  }

  async castVote(proposalId: bigint, support: VoteSupport, reason: string = ''): Promise<ContractTransactionResponse> {
    if (!this.signer) throw new Error('Signer not connected');
    return this.contract.castVote(proposalId, support, reason);
  }

  async getProposal(proposalId: bigint): Promise<ProposalInfo | null> {
    try {
      const proposal = await this.contract.getProposal(proposalId);
      return {
        proposalId: proposal.proposalId,
        proposer: proposal.proposer,
        description: proposal.description,
        metadataUri: proposal.metadataURI,
        startBlock: proposal.startBlock,
        endBlock: proposal.endBlock,
        forVotes: proposal.forVotes,
        againstVotes: proposal.againstVotes,
        abstainVotes: proposal.abstainVotes,
        state: proposal.state,
        createdAt: proposal.createdAt,
        capabilityHashes: proposal.capabilityHashes,
      };
    } catch {
      return null;
    }
  }

  async getProposalState(proposalId: bigint): Promise<ProposalState> {
    return this.contract.getProposalState(proposalId);
  }

  async getActiveProposals(): Promise<bigint[]> {
    return this.contract.getActiveProposals();
  }

  async getVotingPower(voter: string): Promise<bigint> {
    return this.contract.getVotingPower(voter, 0);
  }
}

// ============ ReputationClient ============

export class ReputationClient {
  public contract: Contract;
  private signer?: Wallet;

  constructor(address: string, providerOrSigner: JsonRpcProvider | Wallet) {
    try {
      this.signer = providerOrSigner as Wallet;
      this.contract = new Contract(address, ReputationABI, this.signer);
    } catch {
      this.contract = new Contract(address, ReputationABI, providerOrSigner as JsonRpcProvider);
    }
  }

  async connect(signer: Wallet): Promise<ReputationClient> {
    return new ReputationClient(await this.getAddress(), signer);
  }

  async getAddress(): Promise<string> {
    return this.contract.getAddress();
  }

  async initializeReputation(agent: string): Promise<ContractTransactionResponse> {
    if (!this.signer) throw new Error('Signer not connected');
    return this.contract.initializeReputation(agent);
  }

  async getReputation(agent: string): Promise<ReputationInfo | null> {
    try {
      const rep = await this.contract.getReputation(agent);
      return {
        agent: rep.agent,
        score: rep.score,
        tasksCompleted: rep.tasksCompleted,
        tasksFailed: rep.tasksFailed,
        stakedAmount: rep.stakedAmount,
        unlockTime: rep.unlockTime,
      };
    } catch {
      return null;
    }
  }

  async stake(amount: bigint, lockPeriod: bigint): Promise<ContractTransactionResponse> {
    if (!this.signer) throw new Error('Signer not connected');
    return this.contract.stake(amount, lockPeriod);
  }

  async getVotingPower(agent: string): Promise<bigint> {
    return this.contract.getVotingPower(agent);
  }
}

// ============ OpenClawContractClient ============

export class OpenClawContractClient {
  public registry: RegistryClient;
  public task: TaskClient;
  public governance: GovernanceClient;
  public reputation: ReputationClient;

  private constructor(registry: RegistryClient, task: TaskClient, governance: GovernanceClient, reputation: ReputationClient) {
    this.registry = registry;
    this.task = task;
    this.governance = governance;
    this.reputation = reputation;
  }

  static createReadOnly(config: ClientConfig): OpenClawContractClient {
    const provider = new JsonRpcProvider(config.rpcUrl);
    return new OpenClawContractClient(
      new RegistryClient(config.contracts.registry, provider),
      new TaskClient(config.contracts.taskMarketplace, provider),
      new GovernanceClient(config.contracts.governance, provider),
      new ReputationClient(config.contracts.reputation, provider)
    );
  }

  static create(config: ClientConfig): OpenClawContractClient {
    if (!config.privateKey) throw new Error('Private key required');
    const provider = new JsonRpcProvider(config.rpcUrl);
    const signer = new Wallet(config.privateKey, provider);
    return new OpenClawContractClient(
      new RegistryClient(config.contracts.registry, signer),
      new TaskClient(config.contracts.taskMarketplace, signer),
      new GovernanceClient(config.contracts.governance, signer),
      new ReputationClient(config.contracts.reputation, signer)
    );
  }

  getContractAddresses(): ContractAddresses {
    return {
      registry: this.registry.contract.target as string,
      taskMarketplace: this.task.contract.target as string,
      governance: this.governance.contract.target as string,
      reputation: this.reputation.contract.target as string,
    };
  }
}

// Export HPP Client
export { HPPClient } from './HPPClient';
export type { HPPConfig, PaymentInfo, AgentInfo as HPPAgentInfo } from './HPPClient';
