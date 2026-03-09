// src/RuleEngine.ts
var RuleEngine = class {
  rules = [];
  logger;
  constructor(logger) {
    this.logger = logger.child({ module: "RuleEngine" });
  }
  /**
   * Add a rule
   */
  addRule(rule) {
    this.rules.push(rule);
    this.rules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    this.logger.debug(`Added rule: ${rule.name}`);
  }
  /**
   * Remove a rule
   */
  removeRule(name) {
    const index = this.rules.findIndex((r) => r.name === name);
    if (index !== -1) {
      this.rules.splice(index, 1);
      this.logger.debug(`Removed rule: ${name}`);
      return true;
    }
    return false;
  }
  /**
   * Evaluate all rules against context
   */
  async evaluate(context) {
    const results = [];
    for (const rule of this.rules) {
      try {
        const matches = await rule.condition(context);
        if (matches) {
          this.logger.debug(`Rule matched: ${rule.name}`);
          const result = await rule.action(context);
          results.push({ rule: rule.name, result });
        }
      } catch (error) {
        this.logger.error(`Rule evaluation failed: ${rule.name}`, error);
      }
    }
    return results;
  }
  /**
   * Evaluate first matching rule only
   */
  async evaluateFirst(context) {
    for (const rule of this.rules) {
      try {
        const matches = await rule.condition(context);
        if (matches) {
          this.logger.debug(`First match rule: ${rule.name}`);
          return await rule.action(context);
        }
      } catch (error) {
        this.logger.error(`Rule evaluation failed: ${rule.name}`, error);
      }
    }
    return null;
  }
  /**
   * Get all rules
   */
  getRules() {
    return [...this.rules];
  }
  /**
   * Get rule count
   */
  getRuleCount() {
    return this.rules.length;
  }
  /**
   * Clear all rules
   */
  clearRules() {
    this.rules = [];
    this.logger.debug("Cleared all rules");
  }
};

// src/ActionQueue.ts
var ActionQueue = class {
  queue = [];
  handlers = /* @__PURE__ */ new Map();
  logger;
  processing = false;
  actionCounter = 0;
  constructor(logger) {
    this.logger = logger.child({ module: "ActionQueue" });
  }
  /**
   * Enqueue an action
   */
  enqueue(params) {
    const id = `action-${++this.actionCounter}`;
    const action = {
      id,
      type: params.type,
      params: params.params,
      priority: params.priority || 5,
      createdAt: Date.now(),
      status: "pending"
    };
    this.queue.push(action);
    this.queue.sort((a, b) => b.priority - a.priority);
    this.logger.debug(`Enqueued action: ${id} (${params.type})`);
    return id;
  }
  /**
   * Register an action handler
   */
  registerHandler(type, handler) {
    this.handlers.set(type, handler);
    this.logger.debug(`Registered handler for: ${type}`);
  }
  /**
   * Start processing the queue
   */
  start() {
    if (this.processing) {
      return;
    }
    this.processing = true;
    this.processQueue();
  }
  /**
   * Stop processing the queue
   */
  stop() {
    this.processing = false;
    this.logger.debug("Stopped queue processing");
  }
  /**
   * Get queue status
   */
  getStatus() {
    return {
      pending: this.queue.filter((a) => a.status === "pending").length,
      processing: this.queue.filter((a) => a.status === "processing").length,
      completed: this.queue.filter((a) => a.status === "completed").length,
      failed: this.queue.filter((a) => a.status === "failed").length
    };
  }
  /**
   * Clear the queue
   */
  clear() {
    this.queue = [];
    this.logger.debug("Cleared queue");
  }
  async processQueue() {
    while (this.processing && this.queue.length > 0) {
      const action = this.queue.shift();
      if (!action) {
        continue;
      }
      action.status = "processing";
      this.logger.debug(`Processing action: ${action.id}`);
      try {
        const handler = this.handlers.get(action.type);
        if (!handler) {
          throw new Error(`No handler registered for action type: ${action.type}`);
        }
        await handler(action);
        action.status = "completed";
        this.logger.debug(`Action completed: ${action.id}`);
      } catch (error) {
        action.status = "failed";
        action.error = error.message;
        this.logger.error(`Action failed: ${action.id}`, error);
      }
    }
    if (this.processing) {
      setTimeout(() => this.processQueue(), 100);
    }
  }
};

// src/DecisionEngine.ts
var DecisionEngine = class {
  config;
  eventEmitter;
  logger;
  ruleEngine;
  actionQueue;
  running = false;
  constructor(config, eventEmitter, logger) {
    this.config = config;
    this.eventEmitter = eventEmitter;
    this.logger = logger.child({ module: "DecisionEngine" });
    this.ruleEngine = new RuleEngine(logger);
    this.actionQueue = new ActionQueue(logger);
    this.setupRules();
    this.setupHandlers();
  }
  /**
   * Start the decision engine
   */
  async start() {
    if (this.running) {
      return;
    }
    this.running = true;
    this.actionQueue.start();
    this.setupEventListeners();
    this.logger.info("Decision engine started");
  }
  /**
   * Stop the decision engine
   */
  async stop() {
    this.running = false;
    this.actionQueue.stop();
    this.eventEmitter.removeAllListeners();
    this.logger.info("Decision engine stopped");
  }
  /**
   * Get queue status
   */
  getStatus() {
    return {
      running: this.running,
      queue: this.actionQueue.getStatus(),
      rules: this.ruleEngine.getRuleCount()
    };
  }
  setupRules() {
    if (this.config.autoVote) {
      this.ruleEngine.addRule({
        name: "auto-vote-proposals",
        priority: 5,
        condition: (context) => context.type === "proposal",
        action: (context) => this.handleProposal(context)
      });
    }
    if (this.config.autoAcceptTasks) {
      this.ruleEngine.addRule({
        name: "auto-accept-tasks",
        priority: 3,
        condition: (context) => context.type === "task" && BigInt(context.task.reward) >= this.config.minTaskReward,
        action: (context) => this.handleTask(context)
      });
    }
  }
  setupHandlers() {
    this.actionQueue.registerHandler("governance_vote", async (action) => {
      this.logger.info(`Executing vote: proposal ${action.params.proposalId}`);
      this.eventEmitter.emit("governance:vote", action.params);
    });
    this.actionQueue.registerHandler("task_accept", async (action) => {
      this.logger.info(`Accepting task: ${action.params.taskId}`);
      this.eventEmitter.emit("task:accepted", action.params);
    });
    this.actionQueue.registerHandler("task_complete", async (action) => {
      this.logger.info(`Completing task: ${action.params.taskId}`);
      this.eventEmitter.emit("task:completed", action.params);
    });
  }
  setupEventListeners() {
    this.eventEmitter.on("governance:proposal", (proposal) => {
      this.logger.info(`New proposal detected: ${proposal.proposalId}`);
      this.evaluateProposal(proposal);
    });
    this.eventEmitter.on("task:created", (task) => {
      this.logger.info(`New task detected: ${task.taskId}`);
      this.evaluateTask(task);
    });
  }
  async evaluateProposal(proposal) {
    const context = {
      type: "proposal",
      proposal
    };
    await this.ruleEngine.evaluate(context);
  }
  async evaluateTask(task) {
    const context = {
      type: "task",
      task
    };
    await this.ruleEngine.evaluate(context);
  }
  async handleProposal(context) {
    const vote = await this.calculateVote(context.proposal);
    this.actionQueue.enqueue({
      type: "governance_vote",
      params: {
        proposalId: context.proposal.proposalId,
        support: vote
      },
      priority: 5
    });
  }
  async handleTask(context) {
    this.actionQueue.enqueue({
      type: "task_accept",
      params: {
        taskId: context.task.taskId
      },
      priority: 3
    });
  }
  async calculateVote(_proposal) {
    if (this.config.votingRules.trustedProposers.includes("any")) {
      return 1;
    }
    return 2;
  }
};
export {
  ActionQueue,
  DecisionEngine,
  RuleEngine
};
