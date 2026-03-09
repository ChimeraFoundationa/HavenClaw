var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/daemon.ts
import { EventEmitter } from "@openclaw/runtime";
import { Logger } from "@openclaw/tools";
import { HavenClient } from "@openclaw/haven-interface";
import { GasOracle, NonceManager, TransactionBuilder, TransactionSigner, TransactionSubmitter } from "@openclaw/transaction";
import { IdentityManager } from "@openclaw/identity";
import { DecisionEngine } from "@openclaw/decision";

// src/ContractActionExecutor.ts
import { OpenClawContractClient, VoteSupport } from "@openclaw/contract-client";
var ContractActionExecutor = class {
  config;
  logger;
  eventEmitter;
  client;
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
    this.logger.info("Contract action executor initialized");
    this.logger.info("Contract addresses:", this.config.contracts);
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
};

// src/daemon.ts
import { ethers } from "ethers";
var OpenClawDaemon = class {
  config;
  eventEmitter;
  logger;
  // Components
  havenClient;
  identityManager;
  decisionEngine;
  contractExecutor;
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
          erc6551Registry: this.config.contracts.erc6551Registry,
          erc6551Implementation: this.config.contracts.erc6551Implementation,
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
            reputation: this.config.contracts.agentReputation
          },
          privateKey: this.config.operatorPrivateKey
        }
      );
      await this.contractExecutor.initialize();
      this.logger.info("Contract action executor initialized");
      this.setupActionListeners();
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
          action.params.tbaAddress,
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
      this.logger?.info("Action executed successfully:", result.txHash);
    } else {
      this.logger?.error(new Error("Action execution failed: " + String(result?.error)));
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
    if (this.decisionEngine) {
      await this.decisionEngine.stop();
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
    return {
      running: this.running,
      agentId: this.config.agentId,
      identity: identity ? {
        registered: identity.haven.registered,
        tbaAddress: identity.tba.address,
        tokenId: identity.nft.tokenId.toString()
      } : void 0,
      decision: this.decisionEngine?.getStatus() || {
        running: false,
        queue: {},
        rules: 0
      },
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
      console.log(`   TBA Address: ${status.identity.tbaAddress}`);
      console.log(`   Token ID: ${status.identity.tokenId}`);
      console.log(`   Registered: ${status.identity.registered}`);
    }
    console.log(`   Decision Rules: ${status.decision.rules}`);
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
      this.logger?.info(`Loaded identity: TBA ${identity.tba.address}`);
    } else if (existingIdentity?.metadataUri) {
      this.logger?.info("Creating new identity...");
      const identity = await this.identityManager.createIdentity({
        metadataUri: existingIdentity.metadataUri,
        capabilities: existingIdentity.capabilities || [],
        stakeAmount: void 0,
        // Can be added later
        stakeLockPeriod: void 0
      });
      this.logger?.info(`Created identity: TBA ${identity.tba.address}`);
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
