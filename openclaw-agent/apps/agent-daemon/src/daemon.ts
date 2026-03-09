/**
 * Agent Daemon - Main Entry Point
 *
 * Orchestrates all OpenClaw agent components (Phase 1-3)
 */

import { EventEmitter } from '@havenclaw/runtime';
import { Logger } from '@havenclaw/tools';
import { HavenClient } from '@havenclaw/haven-interface';
import { GasOracle, NonceManager, TransactionBuilder, TransactionSigner, TransactionSubmitter } from '@havenclaw/transaction';
import { IdentityManager } from '@havenclaw/identity';
import { DecisionEngine } from '@havenclaw/decision';
import { ReasoningEngine } from '@havenclaw/reasoning';
import { MemorySystem } from '@havenclaw/memory';
import { LearningSystem } from '@havenclaw/learning';
import { GovernanceAnalyzer } from '@havenclaw/governance';
import { ContractActionExecutor } from './ContractActionExecutor.js';
import { ethers } from 'ethers';
import type { AgentDaemonConfig } from './config.js';

export interface AgentDaemon {
  start(): Promise<void>;
  stop(): Promise<void>;
  getStatus(): DaemonStatus;
}

export interface DaemonStatus {
  running: boolean;
  agentId: string;
  identity?: {
    registered: boolean;
    agentAddress?: string;
    tokenId?: string;
  };
  decision: {
    running: boolean;
    queue: any;
    rules: number;
  };
  reasoning?: {
    running: boolean;
    ooda: any;
    proposalCache: number;
    taskCache: number;
  };
  memory?: {
    workingMemory: number;
    longTermMemory: number;
  };
  learning?: {
    experiences: number;
    lessons: number;
    successRate: number;
  };
  transactions: {
    pending: number;
    confirmed: number;
    failed: number;
  };
}

export class OpenClawDaemon implements AgentDaemon {
  private config: AgentDaemonConfig;
  private eventEmitter: EventEmitter;
  private logger?: Logger;

  // Phase 1 Components
  private havenClient?: HavenClient;
  private identityManager?: IdentityManager;
  private decisionEngine?: DecisionEngine;
  private contractExecutor?: ContractActionExecutor;

  // Phase 2 Components
  private reasoningEngine?: ReasoningEngine;
  private memorySystem?: MemorySystem;
  private learningSystem?: LearningSystem;
  private governanceAnalyzer?: GovernanceAnalyzer;

  // State
  private running: boolean = false;

  constructor(config: AgentDaemonConfig) {
    this.config = config;
    this.eventEmitter = new EventEmitter();
  }

  /**
   * Start the agent daemon
   */
  async start(): Promise<void> {
    if (this.running) {
      throw new Error('Daemon already running');
    }

    console.log('🚀 Starting OpenClaw Agent Daemon...');
    
    try {
      // Step 1: Initialize logger
      this.logger = new Logger({
        level: this.config.logging.level,
        format: this.config.logging.format,
        agentId: this.config.agentId,
      });
      this.logger.info('Logger initialized');

      // Step 2: Initialize HAVEN client
      this.havenClient = new HavenClient({
        rpcUrl: this.config.network.rpcUrl,
        contracts: this.config.contracts,
      });
      this.logger.info('HAVEN client initialized');

      // Step 3: Create signer
      const signer = new ethers.Wallet(
        this.config.operatorPrivateKey,
        this.havenClient.provider
      );
      await this.havenClient.connectSigner(signer);
      this.logger.info('Signer connected');

      // Step 4: Initialize transaction components
      const gasOracle = new GasOracle(
        this.havenClient,
        this.logger,
        {
          maxFeePerGas: this.config.transactions.maxFeePerGas ? 
            ethers.parseUnits(this.config.transactions.maxFeePerGas, 'gwei') : undefined,
          gasPriceBufferPercent: this.config.transactions.gasPriceBufferPercent,
        }
      );

      const nonceManager = new NonceManager(
        this.havenClient,
        this.logger,
        await signer.getAddress()
      );
      await nonceManager.initialize();

      new TransactionBuilder(
        this.havenClient,
        gasOracle,
        nonceManager
      );

      new TransactionSigner(signer);

      new TransactionSubmitter(
        this.havenClient,
        this.eventEmitter,
        this.logger,
        nonceManager,
        this.config.transactions.confirmationsRequired
      );
      this.logger.info('Transaction layer initialized');

      // Step 5: Initialize identity manager
      this.identityManager = new IdentityManager(
        this.havenClient,
        this.logger,
        this.eventEmitter,
        {
          operatorPrivateKey: this.config.operatorPrivateKey,
          erc8004Contract: this.config.contracts.erc8004Registry,
          agentRegistry: this.config.contracts.agentRegistry,
          chainId: this.config.network.chainId,
        }
      );
      this.logger.info('Identity manager initialized');

      // Step 6: Load or create identity
      await this.initializeIdentity();

      // Step 7: Initialize decision engine
      this.decisionEngine = new DecisionEngine(
        {
          autoVote: this.config.decision.autoVote,
          autoAcceptTasks: this.config.decision.autoAcceptTasks,
          minTaskReward: BigInt(this.config.decision.minTaskReward),
          votingRules: {
            minQuorum: BigInt(this.config.decision.votingRules.minQuorum),
            maxAgainstRatio: this.config.decision.votingRules.maxAgainstRatio,
            trustedProposers: this.config.decision.votingRules.trustedProposers,
          },
        },
        this.eventEmitter,
        this.logger
      );
      await this.decisionEngine.start();
      this.logger.info('Decision engine started');

      // Step 8: Initialize contract action executor
      this.contractExecutor = new ContractActionExecutor(
        this.logger,
        this.eventEmitter,
        {
          rpcUrl: this.config.network.rpcUrl,
          contracts: {
            registry: this.config.contracts.agentRegistry,
            taskMarketplace: this.config.contracts.taskMarketplace,
            governance: this.config.contracts.havenGovernance,
            reputation: this.config.contracts.agentReputation,
            paymentProtocol: this.config.contracts.paymentProtocol || '0xef925Ff5F5e41498c4CC26DC006E21F1fdB40816',
          },
          privateKey: this.config.operatorPrivateKey,
        }
      );
      await this.contractExecutor.initialize();
      this.logger.info('Contract action executor initialized');

      // Step 9: Setup action event listeners
      this.setupActionListeners();

      // Step 10: Initialize Phase 2 components (AI-powered reasoning)
      await this.initializePhase2Components();

      // Mark as running
      this.running = true;

      this.logger.info('✅ OpenClaw Agent Daemon started successfully');
      this.printStatus();

    } catch (error) {
      this.logger?.error('Failed to start daemon', error as Error);
      await this.stop();
      throw error;
    }
  }

  /**
   * Setup listeners for action execution events
   */
  private setupActionListeners(): void {
    if (!this.contractExecutor) return;

    this.eventEmitter.on('custom:*', async (event: any) => {
      if (event.type === 'reasoning:execute') {
        await this.handleActionExecution(event.action);
      }
    });
  }

  /**
   * Initialize Phase 2 components (AI-powered reasoning)
   */
  private async initializePhase2Components(): Promise<void> {
    this.logger?.info('Initializing Phase 2 components...');

    // Initialize Memory System
    this.memorySystem = new MemorySystem(this.logger!, {
      workingMemoryCapacity: this.config.memory.workingMemoryCapacity,
      longTermMemoryLimit: this.config.memory.longTermMemoryLimit,
      forgettingCurve: this.config.memory.forgettingCurve,
      decayRate: this.config.memory.decayRate,
      minRetentionThreshold: this.config.memory.minRetentionThreshold,
      defaultSearchLimit: this.config.memory.defaultSearchLimit,
      minSimilarityScore: this.config.memory.minSimilarityScore,
    });
    this.logger?.info('Memory system initialized');

    // Initialize Learning System
    this.learningSystem = new LearningSystem(this.logger!, this.memorySystem, {
      maxExperiences: this.config.learning.maxExperiences,
      minConfidenceForLesson: this.config.learning.minConfidenceForLesson,
      autoUpdateModel: this.config.learning.autoUpdateModel,
      metricsWindow: this.config.learning.metricsWindow,
    });
    this.logger?.info('Learning system initialized');

    // Initialize Governance Analyzer
    this.governanceAnalyzer = new GovernanceAnalyzer(this.havenClient!, this.logger!, {
      protocolImpactWeight: this.config.governance.protocolImpactWeight,
      communityImpactWeight: this.config.governance.communityImpactWeight,
      technicalImpactWeight: this.config.governance.technicalImpactWeight,
      economicImpactWeight: this.config.governance.economicImpactWeight,
      highRiskThreshold: this.config.governance.highRiskThreshold,
      criticalRiskThreshold: this.config.governance.criticalRiskThreshold,
      recommendForThreshold: this.config.governance.recommendForThreshold,
      recommendAgainstThreshold: this.config.governance.recommendAgainstThreshold,
      simulationSamples: this.config.governance.simulationSamples,
      trustedProposers: this.config.governance.trustedProposers,
    });
    this.logger?.info('Governance analyzer initialized');

    // Initialize Reasoning Engine
    this.reasoningEngine = new ReasoningEngine(
      this.havenClient!,
      this.eventEmitter,
      this.logger!,
      {
        observationInterval: this.config.reasoning.observationInterval,
        minConfidenceForAction: this.config.reasoning.minConfidenceForAction,
        maxObservations: this.config.reasoning.maxObservations,
        contextWindow: this.config.reasoning.contextWindow,
        enableGovernanceAnalysis: this.config.reasoning.enableGovernanceAnalysis,
        enableTaskAnalysis: this.config.reasoning.enableTaskAnalysis,
        enableLearning: this.config.reasoning.enableLearning,
      }
    );
    await this.reasoningEngine.start();
    this.logger?.info('Reasoning engine started');

    // Setup reasoning event listeners
    this.setupReasoningListeners();

    this.logger?.info('✅ Phase 2 components initialized successfully');
  }

  /**
   * Setup listeners for reasoning engine events
   */
  private setupReasoningListeners(): void {
    if (!this.reasoningEngine) return;

    // Listen for governance proposals and analyze them
    this.eventEmitter.on('governance:proposal' as any, async (proposal: any) => {
      this.logger?.debug('Analyzing proposal:', proposal.proposalId);
      
      if (this.governanceAnalyzer) {
        const analysis = await this.governanceAnalyzer.analyzeProposal(proposal);
        this.logger?.info('Proposal analysis:', {
          proposalId: proposal.proposalId,
          recommendation: analysis.recommendation,
          confidence: analysis.confidence,
        });
      }
    });

    // Listen for task events and analyze opportunities
    this.eventEmitter.on('task:created' as any, async (task: any) => {
      this.logger?.debug('Analyzing task:', task.taskId);
      
      if (this.reasoningEngine) {
        const capabilities = this.config.identity?.capabilities || [];
        const analysis = await this.reasoningEngine.analyzeTask(task, capabilities);
        this.logger?.info('Task analysis:', {
          taskId: task.taskId,
          recommendation: analysis.recommendation,
          valueScore: analysis.valueScore,
        });
      }
    });
  }

  /**
   * Handle action execution from reasoning engine
   */
  private async handleActionExecution(action: any): Promise<void> {
    if (!this.contractExecutor) {
      this.logger?.warn('Contract executor not initialized');
      return;
    }

    this.logger?.info('Executing action:', action.type);

    let result;

    switch (action.type) {
      case 'governance_vote':
        result = await this.contractExecutor.executeVote(
          BigInt(action.params.proposalId),
          action.params.support,
          action.params.reason
        );
        break;

      case 'task_accept':
        result = await this.contractExecutor.executeAcceptTask(
          BigInt(action.params.taskId)
        );
        break;

      case 'task_complete':
        result = await this.contractExecutor.executeCompleteTask(
          BigInt(action.params.taskId),
          action.params.resultUri
        );
        break;

      case 'agent_register':
        result = await this.contractExecutor.executeRegisterAgent(
          action.params.agentAddress,
          BigInt(action.params.nftTokenId),
          action.params.metadataUri,
          action.params.capabilities
        );
        break;

      case 'stake':
        result = await this.contractExecutor.executeStake(
          BigInt(action.params.amount),
          BigInt(action.params.lockPeriod)
        );
        break;

      default:
        this.logger?.warn('Unknown action type:', action.type);
        return;
    }

    if (result?.success) {
      this.logger?.info('Action executed successfully: ' + String(result.txHash));
    } else {
      this.logger?.error('Action execution failed: ' + String(result?.error));
    }
  }

  /**
   * Stop the agent daemon
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    this.logger?.info('Stopping OpenClaw Agent Daemon...');

    // Stop Phase 2 components first
    if (this.reasoningEngine) {
      await this.reasoningEngine.stop();
      this.logger?.info('Reasoning engine stopped');
    }

    // Stop Phase 1 components
    if (this.decisionEngine) {
      await this.decisionEngine.stop();
      this.logger?.info('Decision engine stopped');
    }

    // Clear event listeners
    this.eventEmitter.removeAllListeners();

    this.running = false;

    this.logger?.info('Daemon stopped');
  }

  /**
   * Get daemon status
   */
  getStatus(): DaemonStatus {
    const identity = this.identityManager?.getIdentity();
    const memoryStats = this.memorySystem?.getStats();
    const learningMetrics = this.learningSystem?.getMetrics();

    return {
      running: this.running,
      agentId: this.config.agentId,
      identity: identity ? {
        registered: identity.haven.registered,
        agentAddress: identity.haven.agentAddress,
        tokenId: identity.nft.tokenId.toString(),
      } : undefined,
      decision: this.decisionEngine?.getStatus() || {
        running: false,
        queue: {},
        rules: 0,
      },
      reasoning: this.reasoningEngine?.getStatus() || {
        running: false,
        ooda: {},
        proposalCache: 0,
        taskCache: 0,
      },
      memory: memoryStats ? {
        workingMemory: memoryStats.working,
        longTermMemory: memoryStats.semantic + memoryStats.episodic + memoryStats.procedural,
      } : undefined,
      learning: learningMetrics ? {
        experiences: learningMetrics.totalExperiences,
        lessons: learningMetrics.totalLessons,
        successRate: learningMetrics.successRate,
      } : undefined,
      transactions: {
        pending: 0,
        confirmed: 0,
        failed: 0,
      },
    };
  }

  /**
   * Print current status
   */
  private printStatus(): void {
    const status = this.getStatus();

    console.log('\n📊 Agent Status:');
    console.log(`   Agent ID: ${status.agentId}`);
    console.log(`   Running: ${status.running}`);

    if (status.identity) {
      console.log(`   Agent Address: ${status.identity.agentAddress}`);
      console.log(`   Token ID: ${status.identity.tokenId}`);
      console.log(`   Registered: ${status.identity.registered}`);
    }

    console.log(`   Decision Rules: ${status.decision.rules}`);

    // Phase 2 status
    if (status.reasoning?.running) {
      console.log(`   Reasoning: ✅ Running`);
      console.log(`   Proposal Cache: ${status.reasoning.proposalCache}`);
      console.log(`   Task Cache: ${status.reasoning.taskCache}`);
    }

    if (status.memory) {
      console.log(`   Memory: ${status.memory.workingMemory}/${status.memory.longTermMemory} items`);
    }

    if (status.learning) {
      console.log(`   Learning: ${status.learning.experiences} experiences, ${status.learning.lessons} lessons`);
    }

    console.log('');
  }

  /**
   * Initialize identity (load existing or create new)
   */
  private async initializeIdentity(): Promise<void> {
    const existingIdentity = this.config.identity;

    if (existingIdentity?.erc8004TokenId) {
      // Load existing identity
      this.logger?.info('Loading existing identity...');
      const identity = await this.identityManager!.loadIdentity(
        BigInt(existingIdentity.erc8004TokenId)
      );
      this.logger?.info(`Loaded identity: Agent ${identity.haven.agentAddress}`);
    } else if (existingIdentity?.metadataUri) {
      // Create new identity with provided metadata
      this.logger?.info('Creating new identity...');
      const identity = await this.identityManager!.createIdentity({
        metadataUri: existingIdentity.metadataUri,
        capabilities: existingIdentity.capabilities || [],
        stakeAmount: undefined, // Can be added later
        stakeLockPeriod: undefined,
      });
      this.logger?.info(`Created identity: Agent ${identity.haven.agentAddress}`);
    } else {
      this.logger?.warn('No identity configured. Use CLI to create one.');
    }
  }
}

/**
 * Create agent daemon from config
 */
export function createAgentDaemon(config: AgentDaemonConfig): AgentDaemon {
  return new OpenClawDaemon(config);
}
