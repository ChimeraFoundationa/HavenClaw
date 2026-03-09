/**
 * ContractActionExecutor - Execute on-chain actions via contract-client
 *
 * Bridges the reasoning engine decisions with smart contract execution
 *
 * Now integrated with HPP (HavenClaw Payment Protocol) for payments!
 */

import { OpenClawContractClient, VoteSupport, HPPClient } from '@havenclaw/contract-client';
import { Logger } from '@havenclaw/tools';
import { EventEmitter } from '@havenclaw/runtime';

export interface ContractActionExecutorConfig {
  rpcUrl: string;
  contracts: {
    registry: string;
    taskMarketplace: string;
    governance: string;
    reputation: string;
    paymentProtocol: string; // HPP
  };
  privateKey: string;
}

export interface ExecutionResult {
  success: boolean;
  txHash?: string;
  error?: string;
  data?: unknown;
}

/**
 * ContractActionExecutor executes on-chain actions based on agent decisions
 */
export class ContractActionExecutor {
  private config: ContractActionExecutorConfig;
  private logger: Logger;
  private eventEmitter: EventEmitter;
  private client?: OpenClawContractClient;
  private hppClient?: HPPClient; // HPP client

  constructor(
    logger: Logger,
    eventEmitter: EventEmitter,
    config: ContractActionExecutorConfig
  ) {
    this.logger = logger.child({ module: 'ContractActionExecutor' });
    this.eventEmitter = eventEmitter;
    this.config = config;
  }

  /**
   * Initialize the contract client
   */
  async initialize(): Promise<void> {
    this.client = OpenClawContractClient.create({
      rpcUrl: this.config.rpcUrl,
      contracts: this.config.contracts,
      privateKey: this.config.privateKey,
    });

    // Initialize HPP client
    this.hppClient = HPPClient.create({
      rpcUrl: this.config.rpcUrl,
      hppAddress: this.config.contracts.paymentProtocol,
      privateKey: this.config.privateKey,
    });

    this.logger.info('Contract action executor initialized');
    this.logger.info('Contract addresses:', this.config.contracts);
    this.logger.info('HPP Payment Protocol:', this.config.contracts.paymentProtocol);
  }

  /**
   * Execute a vote action
   */
  async executeVote(proposalId: bigint, support: number, reason?: string): Promise<ExecutionResult> {
    if (!this.client) {
      return { success: false, error: 'Contract client not initialized' };
    }

    try {
      this.logger.info(`Executing vote on proposal #${proposalId.toString()}: ${support}`);

      const voteSupport = this.numberToVoteSupport(support);
      const tx = await this.client.governance.castVote(proposalId, voteSupport, reason || '');
      const receipt = await tx.wait();

      if (!receipt) {
        return { success: false, error: 'Transaction receipt is null' };
      }

      this.logger.info(`Vote cast successfully: ${receipt.hash}`);

      this.eventEmitter.emit('custom:*', {
        type: 'contract:vote_cast',
        proposalId: proposalId.toString(),
        support,
        txHash: receipt.hash,
      });

      return {
        success: true,
        txHash: receipt.hash,
        data: { proposalId, support, reason },
      };
    } catch (error) {
      this.logger.error('Failed to cast vote', error as Error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Execute task acceptance
   */
  async executeAcceptTask(taskId: bigint): Promise<ExecutionResult> {
    if (!this.client) {
      return { success: false, error: 'Contract client not initialized' };
    }

    try {
      this.logger.info(`Accepting task #${taskId.toString()}`);

      const tx = await this.client.task.acceptTask(taskId);
      const receipt = await tx.wait();

      if (!receipt) {
        return { success: false, error: 'Transaction receipt is null' };
      }

      this.logger.info(`Task accepted successfully: ${receipt.hash}`);

      this.eventEmitter.emit('custom:*', {
        type: 'contract:task_accepted',
        taskId: taskId.toString(),
        txHash: receipt.hash,
      });

      return {
        success: true,
        txHash: receipt.hash,
        data: { taskId },
      };
    } catch (error) {
      this.logger.error('Failed to accept task', error as Error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Execute task completion
   */
  async executeCompleteTask(taskId: bigint, resultUri: string, proof?: string): Promise<ExecutionResult> {
    if (!this.client) {
      return { success: false, error: 'Contract client not initialized' };
    }

    try {
      this.logger.info(`Completing task #${taskId.toString()}`);

      const tx = await this.client.task.completeTask(taskId, resultUri, proof);
      const receipt = await tx.wait();

      if (!receipt) {
        return { success: false, error: 'Transaction receipt is null' };
      }

      this.logger.info(`Task completed successfully: ${receipt.hash}`);

      this.eventEmitter.emit('custom:*', {
        type: 'contract:task_completed',
        taskId: taskId.toString(),
        txHash: receipt.hash,
      });

      return {
        success: true,
        txHash: receipt.hash,
        data: { taskId, resultUri },
      };
    } catch (error) {
      this.logger.error('Failed to complete task', error as Error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Execute agent registration
   */
  async executeRegisterAgent(
    agentAddr: string,
    nftTokenId: bigint,
    metadataUri: string,
    capabilities: string[]
  ): Promise<ExecutionResult> {
    if (!this.client) {
      return { success: false, error: 'Contract client not initialized' };
    }

    try {
      this.logger.info(`Registering agent: ${agentAddr}`);

      const tx = await this.client.registry.registerAgent({
        agentAddress: agentAddr,
        nftTokenId,
        metadataUri,
        capabilities,
      });
      const receipt = await tx.wait();

      if (!receipt) {
        return { success: false, error: 'Transaction receipt is null' };
      }

      this.logger.info(`Agent registered successfully: ${receipt.hash}`);

      this.eventEmitter.emit('custom:*', {
        type: 'contract:agent_registered',
        agentAddress: agentAddr,
        txHash: receipt.hash,
      });

      return {
        success: true,
        txHash: receipt.hash,
        data: { agentAddress: agentAddr, nftTokenId, metadataUri, capabilities },
      };
    } catch (error) {
      this.logger.error('Failed to register agent', error as Error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Execute token staking
   */
  async executeStake(amount: bigint, lockPeriod: bigint): Promise<ExecutionResult> {
    if (!this.client) {
      return { success: false, error: 'Contract client not initialized' };
    }

    try {
      this.logger.info(`Staking ${amount.toString()} tokens for ${lockPeriod.toString()} seconds`);

      const tx = await this.client.reputation.stake(amount, lockPeriod);
      const receipt = await tx.wait();

      if (!receipt) {
        return { success: false, error: 'Transaction receipt is null' };
      }

      this.logger.info(`Tokens staked successfully: ${receipt.hash}`);

      this.eventEmitter.emit('custom:*', {
        type: 'contract:tokens_staked',
        amount: amount.toString(),
        lockPeriod: lockPeriod.toString(),
        txHash: receipt.hash,
      });

      return {
        success: true,
        txHash: receipt.hash,
        data: { amount: amount.toString(), lockPeriod: lockPeriod.toString() },
      };
    } catch (error) {
      this.logger.error('Failed to stake tokens', error as Error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Get open tasks from the marketplace
   */
  async getOpenTasks(): Promise<bigint[]> {
    if (!this.client) {
      return [];
    }
    return this.client.task.getOpenTasks();
  }

  /**
   * Get active proposals
   */
  async getActiveProposals(): Promise<bigint[]> {
    if (!this.client) {
      return [];
    }
    return this.client.governance.getActiveProposals();
  }

  /**
   * Check if agent is registered
   */
  async isAgentRegistered(agentAddr: string): Promise<boolean> {
    if (!this.client) {
      return false;
    }
    return this.client.registry.isAgent(agentAddr);
  }

  /**
   * Get agent reputation
   */
  async getAgentReputation(agentAddr: string) {
    if (!this.client) {
      return null;
    }
    return this.client.reputation.getReputation(agentAddr);
  }

  /**
   * Get task details
   */
  async getTask(taskId: bigint) {
    if (!this.client) {
      return null;
    }
    return this.client.task.getTask(taskId);
  }

  /**
   * Get proposal details
   */
  async getProposal(proposalId: bigint) {
    if (!this.client) {
      return null;
    }
    return this.client.governance.getProposal(proposalId);
  }

  /**
   * Convert number to VoteSupport enum
   */
  private numberToVoteSupport(support: number): VoteSupport {
    switch (support) {
      case 0:
        return VoteSupport.Against;
      case 1:
        return VoteSupport.For;
      case 2:
      default:
        return VoteSupport.Abstain;
    }
  }

  /**
   * Get contract client (for advanced usage)
   */
  getClient(): OpenClawContractClient | undefined {
    return this.client;
  }

  // ==================== HPP PAYMENT METHODS ====================

  /**
   * Get HPP client (for payment operations)
   */
  getHPPClient(): HPPClient | undefined {
    return this.hppClient;
  }

  /**
   * Create HPP payment for task completion
   */
  async createHPPPayment(
    agent: string,
    conditionHash: string,
    deadline: number,
    metadataURI: string,
    amount: bigint
  ) {
    if (!this.hppClient) {
      throw new Error('HPP client not initialized');
    }
    return this.hppClient.createPayment(agent, conditionHash, deadline, metadataURI, amount);
  }

  /**
   * Release HPP payment (agent claims with proof)
   */
  async releaseHPPPayment(paymentId: bigint, proof: string) {
    if (!this.hppClient) {
      throw new Error('HPP client not initialized');
    }
    return this.hppClient.releasePayment(paymentId, proof);
  }

  /**
   * Register as agent with HPP
   */
  async registerHPPAgent(metadataURI: string) {
    if (!this.hppClient) {
      throw new Error('HPP client not initialized');
    }
    return this.hppClient.registerAgent(metadataURI);
  }
}
