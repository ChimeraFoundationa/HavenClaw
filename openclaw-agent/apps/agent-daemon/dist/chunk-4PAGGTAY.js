var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/daemon.ts
import { EventEmitter } from "@havenclaw/runtime";
import { Logger } from "@havenclaw/tools";
import { HavenClient } from "@havenclaw/haven-interface";
import { GasOracle, NonceManager, TransactionBuilder, TransactionSigner, TransactionSubmitter } from "@havenclaw/transaction";
import { IdentityManager } from "@havenclaw/identity";
import { DecisionEngine } from "@havenclaw/decision";
import { ReasoningEngine } from "@havenclaw/reasoning";
import { MemorySystem } from "@havenclaw/memory";
import { LearningSystem } from "@havenclaw/learning";
import { GovernanceAnalyzer } from "@havenclaw/governance";

// src/ContractActionExecutor.ts
import { OpenClawContractClient, VoteSupport, HPPClient } from "@havenclaw/contract-client";
var ContractActionExecutor = class {
  config;
  logger;
  eventEmitter;
  client;
  hppClient;
  // HPP client
  agentAddress;
  constructor(logger, eventEmitter, config) {
    this.logger = logger.child({ module: "ContractActionExecutor" });
    this.eventEmitter = eventEmitter;
    this.config = config;
  }
  /**
   * Initialize the contract client
   */
  async initialize(agentAddress) {
    this.agentAddress = agentAddress;
    this.client = OpenClawContractClient.create({
      rpcUrl: this.config.rpcUrl,
      contracts: this.config.contracts,
      privateKey: this.config.privateKey
    });
    this.hppClient = HPPClient.create({
      rpcUrl: this.config.rpcUrl,
      hppAddress: this.config.contracts.paymentProtocol,
      privateKey: this.config.privateKey
    });
    this.logger.info("Contract action executor initialized");
    this.logger.info("Contract addresses:", this.config.contracts);
    this.logger.info("HPP Payment Protocol:", this.config.contracts.paymentProtocol);
  }
  /**
   * Execute a vote action
   */
  async executeVote(proposalId, support, reason) {
    if (!this.client) {
      return { success: false, error: "Contract client not initialized" };
    }
    try {
      this.logger.info(`Executing vote on proposal #${proposalId.toString()}: ${support}`);
      const voteSupport = this.numberToVoteSupport(support);
      const tx = await this.client.governance.castVote(proposalId, voteSupport, reason || "");
      const receipt = await tx.wait();
      this.logger.info(`Vote cast successfully: ${receipt.hash}`);
      this.eventEmitter.emit("custom:*", {
        type: "contract:vote_cast",
        proposalId: proposalId.toString(),
        support,
        txHash: receipt.hash
      });
      return {
        success: true,
        txHash: receipt.hash,
        data: { proposalId, support, reason }
      };
    } catch (error) {
      this.logger.error("Failed to cast vote", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  /**
   * Execute task acceptance
   */
  async executeAcceptTask(taskId) {
    if (!this.client) {
      return { success: false, error: "Contract client not initialized" };
    }
    try {
      this.logger.info(`Accepting task #${taskId.toString()}`);
      const tx = await this.client.task.acceptTask(taskId);
      const receipt = await tx.wait();
      this.logger.info(`Task accepted successfully: ${receipt.hash}`);
      this.eventEmitter.emit("custom:*", {
        type: "contract:task_accepted",
        taskId: taskId.toString(),
        txHash: receipt.hash
      });
      return {
        success: true,
        txHash: receipt.hash,
        data: { taskId }
      };
    } catch (error) {
      this.logger.error("Failed to accept task", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  /**
   * Execute task completion
   */
  async executeCompleteTask(taskId, resultUri, proof) {
    if (!this.client) {
      return { success: false, error: "Contract client not initialized" };
    }
    try {
      this.logger.info(`Completing task #${taskId.toString()}`);
      const tx = await this.client.task.completeTask(taskId, resultUri, proof);
      const receipt = await tx.wait();
      this.logger.info(`Task completed successfully: ${receipt.hash}`);
      this.eventEmitter.emit("custom:*", {
        type: "contract:task_completed",
        taskId: taskId.toString(),
        txHash: receipt.hash
      });
      return {
        success: true,
        txHash: receipt.hash,
        data: { taskId, resultUri }
      };
    } catch (error) {
      this.logger.error("Failed to complete task", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  /**
   * Execute agent registration
   */
  async executeRegisterAgent(tbaAddress, nftTokenId, metadataUri, capabilities) {
    if (!this.client) {
      return { success: false, error: "Contract client not initialized" };
    }
    try {
      this.logger.info(`Registering agent: ${tbaAddress}`);
      const tx = await this.client.registry.registerAgent({
        tbaAddress,
        nftTokenId,
        metadataUri,
        capabilities
      });
      const receipt = await tx.wait();
      this.logger.info(`Agent registered successfully: ${receipt.hash}`);
      this.eventEmitter.emit("custom:*", {
        type: "contract:agent_registered",
        tbaAddress,
        txHash: receipt.hash
      });
      return {
        success: true,
        txHash: receipt.hash,
        data: { tbaAddress, nftTokenId, metadataUri, capabilities }
      };
    } catch (error) {
      this.logger.error("Failed to register agent", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  /**
   * Execute token staking
   */
  async executeStake(amount, lockPeriod) {
    if (!this.client) {
      return { success: false, error: "Contract client not initialized" };
    }
    try {
      this.logger.info(`Staking ${amount.toString()} tokens for ${lockPeriod.toString()} seconds`);
      const tx = await this.client.reputation.stake(amount, lockPeriod);
      const receipt = await tx.wait();
      this.logger.info(`Tokens staked successfully: ${receipt.hash}`);
      this.eventEmitter.emit("custom:*", {
        type: "contract:tokens_staked",
        amount: amount.toString(),
        lockPeriod: lockPeriod.toString(),
        txHash: receipt.hash
      });
      return {
        success: true,
        txHash: receipt.hash,
        data: { amount: amount.toString(), lockPeriod: lockPeriod.toString() }
      };
    } catch (error) {
      this.logger.error("Failed to stake tokens", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  /**
   * Get open tasks from the marketplace
   */
  async getOpenTasks() {
    if (!this.client) {
      return [];
    }
    return this.client.task.getOpenTasks();
  }
  /**
   * Get active proposals
   */
  async getActiveProposals() {
    if (!this.client) {
      return [];
    }
    return this.client.governance.getActiveProposals();
  }
  /**
   * Check if agent is registered
   */
  async isAgentRegistered(tbaAddress) {
    if (!this.client) {
      return false;
    }
    return this.client.registry.isAgent(tbaAddress);
  }
  /**
   * Get agent reputation
   */
  async getAgentReputation(agentAddress) {
    if (!this.client) {
      return null;
    }
    return this.client.reputation.getReputation(agentAddress);
  }
  /**
   * Get task details
   */
  async getTask(taskId) {
    if (!this.client) {
      return null;
    }
    return this.client.task.getTask(taskId);
  }
  /**
   * Get proposal details
   */
  async getProposal(proposalId) {
    if (!this.client) {
      return null;
    }
    return this.client.governance.getProposal(proposalId);
  }
  /**
   * Convert number to VoteSupport enum
   */
  numberToVoteSupport(support) {
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
  getClient() {
    return this.client;
  }
  // ==================== HPP PAYMENT METHODS ====================
  /**
   * Get HPP client (for payment operations)
   */
  getHPPClient() {
    return this.hppClient;
  }
  /**
   * Create HPP payment for task completion
   */
  async createHPPPayment(agent, conditionHash, deadline, metadataURI, amount) {
    if (!this.hppClient) {
      throw new Error("HPP client not initialized");
    }
    return this.hppClient.createPayment(agent, conditionHash, deadline, metadataURI, amount);
  }
  /**
   * Release HPP payment (agent claims with proof)
   */
  async releaseHPPPayment(paymentId, proof) {
    if (!this.hppClient) {
      throw new Error("HPP client not initialized");
    }
    return this.hppClient.releasePayment(paymentId, proof);
  }
  /**
   * Register as agent with HPP
   */
  async registerHPPAgent(metadataURI) {
    if (!this.hppClient) {
      throw new Error("HPP client not initialized");
    }
    return this.hppClient.registerAgent(metadataURI);
  }
};

// src/daemon.ts
import { ethers } from "ethers";
var OpenClawDaemon = class {
  config;
  eventEmitter;
  logger;
  // Phase 1 Components
  havenClient;
  identityManager;
  decisionEngine;
  contractExecutor;
  // Phase 2 Components
  reasoningEngine;
  memorySystem;
  learningSystem;
  governanceAnalyzer;
  // State
  running = false;
  constructor(config) {
    this.config = config;
    this.eventEmitter = new EventEmitter();
  }
  /**
   * Start the agent daemon
   */
  async start() {
    if (this.running) {
      throw new Error("Daemon already running");
    }
    console.log("\u{1F680} Starting OpenClaw Agent Daemon...");
    try {
      this.logger = new Logger({
        level: this.config.logging.level,
        format: this.config.logging.format,
        agentId: this.config.agentId
      });
      this.logger.info("Logger initialized");
      this.havenClient = new HavenClient({
        rpcUrl: this.config.network.rpcUrl,
        contracts: this.config.contracts
      });
      this.logger.info("HAVEN client initialized");
      const signer = new ethers.Wallet(
        this.config.operatorPrivateKey,
        this.havenClient.provider
      );
      await this.havenClient.connectSigner(signer);
      this.logger.info("Signer connected");
      const gasOracle = new GasOracle(
        this.havenClient,
        this.logger,
        {
          maxFeePerGas: this.config.transactions.maxFeePerGas ? ethers.parseUnits(this.config.transactions.maxFeePerGas, "gwei") : void 0,
          gasPriceBufferPercent: this.config.transactions.gasPriceBufferPercent
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
      this.logger.info("Transaction layer initialized");
      this.identityManager = new IdentityManager(
        this.havenClient,
        this.logger,
        this.eventEmitter,
        {
          operatorPrivateKey: this.config.operatorPrivateKey,
          erc8004Contract: this.config.contracts.erc8004Registry,
          agentRegistry: this.config.contracts.agentRegistry,
          chainId: this.config.network.chainId
        }
      );
      this.logger.info("Identity manager initialized");
      await this.initializeIdentity();
      this.decisionEngine = new DecisionEngine(
        {
          autoVote: this.config.decision.autoVote,
          autoAcceptTasks: this.config.decision.autoAcceptTasks,
          minTaskReward: BigInt(this.config.decision.minTaskReward),
          votingRules: {
            minQuorum: BigInt(this.config.decision.votingRules.minQuorum),
            maxAgainstRatio: this.config.decision.votingRules.maxAgainstRatio,
            trustedProposers: this.config.decision.votingRules.trustedProposers
          }
        },
        this.eventEmitter,
        this.logger
      );
      await this.decisionEngine.start();
      this.logger.info("Decision engine started");
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
            paymentProtocol: this.config.contracts.paymentProtocol || "0xef925Ff5F5e41498c4CC26DC006E21F1fdB40816"
          },
          privateKey: this.config.operatorPrivateKey
        }
      );
      await this.contractExecutor.initialize();
      this.logger.info("Contract action executor initialized");
      this.setupActionListeners();
      await this.initializePhase2Components();
      this.running = true;
      this.logger.info("\u2705 OpenClaw Agent Daemon started successfully");
      this.printStatus();
    } catch (error) {
      this.logger?.error("Failed to start daemon", error);
      await this.stop();
      throw error;
    }
  }
  /**
   * Setup listeners for action execution events
   */
  setupActionListeners() {
    if (!this.contractExecutor) return;
    this.eventEmitter.on("custom:*", async (event) => {
      if (event.type === "reasoning:execute") {
        await this.handleActionExecution(event.action);
      }
    });
  }
  /**
   * Initialize Phase 2 components (AI-powered reasoning)
   */
  async initializePhase2Components() {
    this.logger?.info("Initializing Phase 2 components...");
    this.memorySystem = new MemorySystem(this.logger, {
      workingMemoryCapacity: this.config.memory.workingMemoryCapacity,
      longTermMemoryLimit: this.config.memory.longTermMemoryLimit,
      forgettingCurve: this.config.memory.forgettingCurve,
      decayRate: this.config.memory.decayRate,
      minRetentionThreshold: this.config.memory.minRetentionThreshold,
      defaultSearchLimit: this.config.memory.defaultSearchLimit,
      minSimilarityScore: this.config.memory.minSimilarityScore
    });
    this.logger?.info("Memory system initialized");
    this.learningSystem = new LearningSystem(this.logger, this.memorySystem, {
      maxExperiences: this.config.learning.maxExperiences,
      minConfidenceForLesson: this.config.learning.minConfidenceForLesson,
      autoUpdateModel: this.config.learning.autoUpdateModel,
      metricsWindow: this.config.learning.metricsWindow
    });
    this.logger?.info("Learning system initialized");
    this.governanceAnalyzer = new GovernanceAnalyzer(this.havenClient, this.logger, {
      protocolImpactWeight: this.config.governance.protocolImpactWeight,
      communityImpactWeight: this.config.governance.communityImpactWeight,
      technicalImpactWeight: this.config.governance.technicalImpactWeight,
      economicImpactWeight: this.config.governance.economicImpactWeight,
      highRiskThreshold: this.config.governance.highRiskThreshold,
      criticalRiskThreshold: this.config.governance.criticalRiskThreshold,
      recommendForThreshold: this.config.governance.recommendForThreshold,
      recommendAgainstThreshold: this.config.governance.recommendAgainstThreshold,
      simulationSamples: this.config.governance.simulationSamples,
      trustedProposers: this.config.governance.trustedProposers
    });
    this.logger?.info("Governance analyzer initialized");
    this.reasoningEngine = new ReasoningEngine(
      this.havenClient,
      this.eventEmitter,
      this.logger,
      {
        observationInterval: this.config.reasoning.observationInterval,
        minConfidenceForAction: this.config.reasoning.minConfidenceForAction,
        maxObservations: this.config.reasoning.maxObservations,
        contextWindow: this.config.reasoning.contextWindow,
        enableGovernanceAnalysis: this.config.reasoning.enableGovernanceAnalysis,
        enableTaskAnalysis: this.config.reasoning.enableTaskAnalysis,
        enableLearning: this.config.reasoning.enableLearning
      }
    );
    await this.reasoningEngine.start();
    this.logger?.info("Reasoning engine started");
    this.setupReasoningListeners();
    this.logger?.info("\u2705 Phase 2 components initialized successfully");
  }
  /**
   * Setup listeners for reasoning engine events
   */
  setupReasoningListeners() {
    if (!this.reasoningEngine) return;
    this.eventEmitter.on("governance:proposal", async (proposal) => {
      this.logger?.debug("Analyzing proposal:", proposal.proposalId);
      if (this.governanceAnalyzer) {
        const analysis = await this.governanceAnalyzer.analyzeProposal(proposal);
        this.logger?.info("Proposal analysis:", {
          proposalId: proposal.proposalId,
          recommendation: analysis.recommendation,
          confidence: analysis.confidence
        });
      }
    });
    this.eventEmitter.on("task:created", async (task) => {
      this.logger?.debug("Analyzing task:", task.taskId);
      if (this.reasoningEngine) {
        const capabilities = this.config.identity?.capabilities || [];
        const analysis = await this.reasoningEngine.analyzeTask(task, capabilities);
        this.logger?.info("Task analysis:", {
          taskId: task.taskId,
          recommendation: analysis.recommendation,
          valueScore: analysis.valueScore
        });
      }
    });
  }
  /**
   * Handle action execution from reasoning engine
   */
  async handleActionExecution(action) {
    if (!this.contractExecutor) {
      this.logger?.warn("Contract executor not initialized");
      return;
    }
    this.logger?.info("Executing action:", action.type);
    let result;
    switch (action.type) {
      case "governance_vote":
        result = await this.contractExecutor.executeVote(
          BigInt(action.params.proposalId),
          action.params.support,
          action.params.reason
        );
        break;
      case "task_accept":
        result = await this.contractExecutor.executeAcceptTask(
          BigInt(action.params.taskId)
        );
        break;
      case "task_complete":
        result = await this.contractExecutor.executeCompleteTask(
          BigInt(action.params.taskId),
          action.params.resultUri
        );
        break;
      case "agent_register":
        result = await this.contractExecutor.executeRegisterAgent(
          action.params.agentAddress,
          BigInt(action.params.nftTokenId),
          action.params.metadataUri,
          action.params.capabilities
        );
        break;
      case "stake":
        result = await this.contractExecutor.executeStake(
          BigInt(action.params.amount),
          BigInt(action.params.lockPeriod)
        );
        break;
      default:
        this.logger?.warn("Unknown action type:", action.type);
        return;
    }
    if (result?.success) {
      this.logger?.info("Action executed successfully: " + String(result.txHash));
    } else {
      this.logger?.error("Action execution failed: " + String(result?.error));
    }
  }
  /**
   * Stop the agent daemon
   */
  async stop() {
    if (!this.running) {
      return;
    }
    this.logger?.info("Stopping OpenClaw Agent Daemon...");
    if (this.reasoningEngine) {
      await this.reasoningEngine.stop();
      this.logger?.info("Reasoning engine stopped");
    }
    if (this.decisionEngine) {
      await this.decisionEngine.stop();
      this.logger?.info("Decision engine stopped");
    }
    this.eventEmitter.removeAllListeners();
    this.running = false;
    this.logger?.info("Daemon stopped");
  }
  /**
   * Get daemon status
   */
  getStatus() {
    const identity = this.identityManager?.getIdentity();
    const memoryStats = this.memorySystem?.getStats();
    const learningMetrics = this.learningSystem?.getMetrics();
    return {
      running: this.running,
      agentId: this.config.agentId,
      identity: identity ? {
        registered: identity.haven.registered,
        agentAddress: identity.haven.agentAddress,
        tokenId: identity.nft.tokenId.toString()
      } : void 0,
      decision: this.decisionEngine?.getStatus() || {
        running: false,
        queue: {},
        rules: 0
      },
      reasoning: this.reasoningEngine?.getStatus() || {
        running: false,
        ooda: {},
        proposalCache: 0,
        taskCache: 0
      },
      memory: memoryStats ? {
        workingMemory: memoryStats.working,
        longTermMemory: memoryStats.semantic + memoryStats.episodic + memoryStats.procedural
      } : void 0,
      learning: learningMetrics ? {
        experiences: learningMetrics.totalExperiences,
        lessons: learningMetrics.totalLessons,
        successRate: learningMetrics.successRate
      } : void 0,
      transactions: {
        pending: 0,
        confirmed: 0,
        failed: 0
      }
    };
  }
  /**
   * Print current status
   */
  printStatus() {
    const status = this.getStatus();
    console.log("\n\u{1F4CA} Agent Status:");
    console.log(`   Agent ID: ${status.agentId}`);
    console.log(`   Running: ${status.running}`);
    if (status.identity) {
      console.log(`   Agent Address: ${status.identity.agentAddress}`);
      console.log(`   Token ID: ${status.identity.tokenId}`);
      console.log(`   Registered: ${status.identity.registered}`);
    }
    console.log(`   Decision Rules: ${status.decision.rules}`);
    if (status.reasoning?.running) {
      console.log(`   Reasoning: \u2705 Running`);
      console.log(`   Proposal Cache: ${status.reasoning.proposalCache}`);
      console.log(`   Task Cache: ${status.reasoning.taskCache}`);
    }
    if (status.memory) {
      console.log(`   Memory: ${status.memory.workingMemory}/${status.memory.longTermMemory} items`);
    }
    if (status.learning) {
      console.log(`   Learning: ${status.learning.experiences} experiences, ${status.learning.lessons} lessons`);
    }
    console.log("");
  }
  /**
   * Initialize identity (load existing or create new)
   */
  async initializeIdentity() {
    const existingIdentity = this.config.identity;
    if (existingIdentity?.erc8004TokenId) {
      this.logger?.info("Loading existing identity...");
      const identity = await this.identityManager.loadIdentity(
        BigInt(existingIdentity.erc8004TokenId)
      );
      this.logger?.info(`Loaded identity: Agent ${identity.haven.agentAddress}`);
    } else if (existingIdentity?.metadataUri) {
      this.logger?.info("Creating new identity...");
      const identity = await this.identityManager.createIdentity({
        metadataUri: existingIdentity.metadataUri,
        capabilities: existingIdentity.capabilities || [],
        stakeAmount: void 0,
        // Can be added later
        stakeLockPeriod: void 0
      });
      this.logger?.info(`Created identity: Agent ${identity.haven.agentAddress}`);
    } else {
      this.logger?.warn("No identity configured. Use CLI to create one.");
    }
  }
};
function createAgentDaemon(config) {
  return new OpenClawDaemon(config);
}

export {
  __require,
  OpenClawDaemon,
  createAgentDaemon
};
