// src/EventEmitter.ts
import { EventEmitter as BaseEmitter } from "events";
var EventEmitter = class {
  emitter;
  constructor() {
    this.emitter = new BaseEmitter();
  }
  on(event, listener) {
    this.emitter.on(event, listener);
    return this;
  }
  once(event, listener) {
    this.emitter.once(event, listener);
    return this;
  }
  off(event, listener) {
    this.emitter.off(event, listener);
    return this;
  }
  emit(event, ...args) {
    return this.emitter.emit(event, ...args);
  }
  removeAllListeners(event) {
    this.emitter.removeAllListeners(event);
    return this;
  }
  listenerCount(event) {
    return this.emitter.listenerCount(event);
  }
};

// src/AgentState.ts
var AgentState = /* @__PURE__ */ ((AgentState2) => {
  AgentState2["Stopped"] = "stopped";
  AgentState2["Starting"] = "starting";
  AgentState2["Running"] = "running";
  AgentState2["Stopping"] = "stopping";
  AgentState2["Error"] = "error";
  return AgentState2;
})(AgentState || {});
function createInitialMetrics() {
  return {
    transactionsSubmitted: 0,
    transactionsConfirmed: 0,
    transactionsFailed: 0,
    proposalsVoted: 0,
    tasksCompleted: 0,
    reputationEarned: 0n,
    gasSpent: 0n
  };
}

// src/AgentRuntime.ts
var AgentRuntime = class {
  config;
  state;
  eventEmitter;
  components;
  startTime;
  metrics;
  constructor(config) {
    this.config = config;
    this.state = "stopped" /* Stopped */;
    this.eventEmitter = new EventEmitter();
    this.components = /* @__PURE__ */ new Map();
    this.startTime = null;
    this.metrics = createInitialMetrics();
  }
  /**
   * Get the event emitter for subscribing to agent events
   */
  get events() {
    return this.eventEmitter;
  }
  /**
   * Get the agent configuration
   */
  getConfig() {
    return this.config;
  }
  /**
   * Get current agent status
   */
  getStatus() {
    return {
      state: this.state,
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      metrics: { ...this.metrics }
    };
  }
  /**
   * Register a runtime component
   */
  registerComponent(component) {
    if (this.state !== "stopped" /* Stopped */) {
      throw new Error("Cannot register components while runtime is running");
    }
    this.components.set(component.name, component);
  }
  /**
   * Start the agent runtime
   */
  async start() {
    if (this.state !== "stopped" /* Stopped */) {
      throw new Error(`Cannot start runtime in state: ${this.state}`);
    }
    this.setState("starting" /* Starting */);
    try {
      for (const [, component] of this.components.entries()) {
        if (component.start) {
          await component.start();
        }
      }
      this.startTime = Date.now();
      this.setState("running" /* Running */);
      this.eventEmitter.emit("runtime:started");
    } catch (error) {
      this.setState("error" /* Error */);
      this.eventEmitter.emit("runtime:error", error);
      throw error;
    }
  }
  /**
   * Stop the agent runtime
   */
  async stop() {
    if (this.state !== "running" /* Running */ && this.state !== "error" /* Error */) {
      return;
    }
    this.setState("stopping" /* Stopping */);
    try {
      const components = Array.from(this.components.values()).reverse();
      for (const component of components) {
        if (component.stop) {
          await component.stop();
        }
      }
      this.setState("stopped" /* Stopped */);
      this.startTime = null;
      this.eventEmitter.emit("runtime:stopped");
    } catch (error) {
      this.setState("error" /* Error */);
      this.eventEmitter.emit("runtime:error", error);
      throw error;
    }
  }
  /**
   * Perform health check on all components
   */
  async healthCheck() {
    for (const [, component] of this.components.entries()) {
      if (component.healthCheck) {
        const healthy = await component.healthCheck();
        if (!healthy) {
          return false;
        }
      }
    }
    return true;
  }
  /**
   * Update metrics
   */
  updateMetrics(updates) {
    Object.assign(this.metrics, updates);
  }
  setState(newState) {
    const oldState = this.state;
    this.state = newState;
    this.eventEmitter.emit("runtime:state-change", oldState, newState);
  }
};

// src/AgentConfig.ts
import { z } from "zod";
var NetworkConfigSchema = z.object({
  chainId: z.number(),
  rpcUrl: z.string().url(),
  wsUrl: z.string().url().optional(),
  explorerUrl: z.string().url().optional()
});
var IdentityConfigSchema = z.object({
  operatorPrivateKey: z.string().startsWith("0x"),
  erc8004TokenId: z.bigint().optional(),
  tbaAddress: z.string().optional()
});
var ContractAddressesSchema = z.object({
  agentRegistry: z.string(),
  agentReputation: z.string(),
  havenGovernance: z.string(),
  taskMarketplace: z.string(),
  havenToken: z.string(),
  erc8004Registry: z.string().optional(),
  erc6551Registry: z.string().optional(),
  gat: z.string().optional(),
  escrow: z.string().optional()
});
var DecisionConfigSchema = z.object({
  pollingInterval: z.number().default(5e3),
  maxGasPrice: z.bigint().optional(),
  autoVote: z.boolean().default(false),
  autoAcceptTasks: z.boolean().default(false),
  minTaskReward: z.bigint().default(0n),
  votingRules: z.object({
    minQuorum: z.bigint().default(0n),
    maxAgainstRatio: z.number().default(0.5),
    trustedProposers: z.array(z.string()).default([])
  }).default({})
});
var LoggingConfigSchema = z.object({
  level: z.enum(["debug", "info", "warn", "error"]).default("info"),
  format: z.enum(["json", "text"]).default("json")
});
var AgentConfigSchema = z.object({
  agentId: z.string().min(1),
  identity: IdentityConfigSchema,
  network: NetworkConfigSchema,
  contracts: ContractAddressesSchema,
  decision: DecisionConfigSchema,
  logging: LoggingConfigSchema
});
function loadConfig(config) {
  return AgentConfigSchema.parse(config);
}
function loadConfigSafe(config) {
  const result = AgentConfigSchema.safeParse(config);
  return result.success ? result.data : null;
}
export {
  AgentRuntime,
  AgentState,
  EventEmitter,
  loadConfig,
  loadConfigSafe
};
