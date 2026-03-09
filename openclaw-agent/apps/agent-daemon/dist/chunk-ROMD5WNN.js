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
import { ethers } from "ethers";
var OpenClawDaemon = class {
  config;
  eventEmitter;
  logger;
  // Components
  havenClient;
  identityManager;
  decisionEngine;
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
      const transactionSubmitter = new TransactionSubmitter(
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
    this.startTime = void 0;
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
