// src/types.ts
var ObservationType = /* @__PURE__ */ ((ObservationType2) => {
  ObservationType2["BLOCKCHAIN"] = "blockchain";
  ObservationType2["GOVERNANCE"] = "governance";
  ObservationType2["TASK"] = "task";
  ObservationType2["REPUTATION"] = "reputation";
  ObservationType2["EXTERNAL"] = "external";
  return ObservationType2;
})(ObservationType || {});
var ActionType = /* @__PURE__ */ ((ActionType2) => {
  ActionType2["VOTE"] = "vote";
  ActionType2["ACCEPT_TASK"] = "accept_task";
  ActionType2["COMPLETE_TASK"] = "complete_task";
  ActionType2["STAKE"] = "stake";
  ActionType2["UNSTAKE"] = "unstake";
  ActionType2["TRANSFER"] = "transfer";
  ActionType2["CUSTOM"] = "custom";
  return ActionType2;
})(ActionType || {});
var DEFAULT_OODA_CONFIG = {
  observationInterval: 5e3,
  maxObservations: 100,
  contextWindow: 20,
  minConfidence: 0.6,
  maxAlternatives: 5,
  decisionTimeout: 3e4,
  maxActionsPerCycle: 3,
  requireConfirmation: false,
  recordExperiences: true
};

// src/OODALoop.ts
var OODALoop = class {
  config;
  eventEmitter;
  logger;
  client;
  // State
  running = false;
  observationBuffer = [];
  experiences = [];
  currentContext;
  currentDecision;
  // Observers
  blockchainObserver;
  governanceObserver;
  taskObserver;
  constructor(client, eventEmitter, logger, config = {}) {
    this.client = client;
    this.eventEmitter = eventEmitter;
    this.logger = logger.child({ module: "OODALoop" });
    this.config = { ...DEFAULT_OODA_CONFIG, ...config };
  }
  /**
   * Start the OODA loop
   */
  async start() {
    if (this.running) {
      return;
    }
    this.logger.info("Starting OODA loop...");
    this.running = true;
    this.blockchainObserver = setInterval(
      () => this.observeBlockchain(),
      this.config.observationInterval
    );
    this.governanceObserver = setInterval(
      () => this.observeGovernance(),
      this.config.observationInterval * 2
    );
    this.taskObserver = setInterval(
      () => this.observeTasks(),
      this.config.observationInterval * 2
    );
    await this.runCycle();
    this.logger.info("OODA loop started");
  }
  /**
   * Stop the OODA loop
   */
  async stop() {
    if (!this.running) {
      return;
    }
    this.logger.info("Stopping OODA loop...");
    this.running = false;
    if (this.blockchainObserver) clearInterval(this.blockchainObserver);
    if (this.governanceObserver) clearInterval(this.governanceObserver);
    if (this.taskObserver) clearInterval(this.taskObserver);
    this.logger.info("OODA loop stopped");
  }
  /**
   * Get current status
   */
  getStatus() {
    return {
      running: this.running,
      observations: this.observationBuffer.length,
      experiences: this.experiences.length,
      currentContext: this.currentContext,
      currentDecision: this.currentDecision
    };
  }
  /**
   * Run one complete OODA cycle
   */
  async runCycle() {
    try {
      const observations = await this.observe();
      const context = await this.orient(observations);
      const decision = await this.decide(context);
      const results = await this.act(decision);
      if (this.config.recordExperiences) {
        await this.recordExperience(context, decision, results);
      }
    } catch (error) {
      this.logger.error("OODA cycle failed", error);
      this.eventEmitter.emit("custom:*", { type: "reasoning:error", error });
    }
  }
  // ==================== OBSERVE ====================
  /**
   * Gather observations from all sources
   */
  async observe() {
    this.logger.debug("Gathering observations...");
    const observations = [];
    const blockchainObs = await this.observeBlockchain();
    observations.push(...blockchainObs);
    const governanceObs = await this.observeGovernance();
    observations.push(...governanceObs);
    const taskObs = await this.observeTasks();
    observations.push(...taskObs);
    observations.sort((a, b) => b.priority - a.priority);
    this.observationBuffer = [
      ...this.observationBuffer,
      ...observations
    ].slice(-this.config.maxObservations);
    this.logger.debug("Collected " + observations.length + " observations");
    return observations;
  }
  async observeBlockchain() {
    try {
      const blockNumber = await this.client.getBlockNumber();
      const feeData = await this.client.getFeeData();
      const gasPrice = feeData.maxFeePerGas || 0n;
      const networkCongestion = this.assessNetworkCongestion(gasPrice);
      const observation = {
        type: "blockchain" /* BLOCKCHAIN */,
        timestamp: Date.now(),
        priority: 5,
        source: "blockchain",
        data: {
          blockNumber,
          gasPrice,
          networkCongestion
        }
      };
      this.logger.debug("Blockchain observation: block " + blockNumber + ", gas " + gasPrice);
      return [observation];
    } catch (error) {
      this.logger.warn("Failed to observe blockchain", error);
      return [];
    }
  }
  async observeGovernance() {
    try {
      const proposals = await this.getActiveProposals();
      const observations = [];
      for (const proposal of proposals) {
        const timeRemaining = proposal.endBlock - BigInt(Math.floor(Date.now() / 1e3 / 12));
        const voteDist = await this.getVoteDistribution(proposal.proposalId.toString());
        const urgency = this.calculateProposalUrgency(timeRemaining);
        const observation = {
          type: "governance" /* GOVERNANCE */,
          timestamp: Date.now(),
          priority: urgency,
          source: "governance",
          data: {
            proposal,
            timeRemaining,
            currentQuorum: voteDist.for + voteDist.against + voteDist.abstain,
            voteDistribution: voteDist
          }
        };
        observations.push(observation);
      }
      this.logger.debug("Observed " + observations.length + " active proposals");
      return observations;
    } catch (error) {
      this.logger.warn("Failed to observe governance", error);
      return [];
    }
  }
  async observeTasks() {
    try {
      const tasks = await this.getOpenTasks();
      const observations = [];
      for (const task of tasks) {
        const difficulty = this.assessTaskDifficulty(task);
        const expectedReward = BigInt(task.reward);
        const competition = await this.estimateTaskCompetition(task);
        const valueScore = this.calculateTaskValueScore(expectedReward, difficulty, competition);
        const observation = {
          type: "task" /* TASK */,
          timestamp: Date.now(),
          priority: Math.min(10, Math.floor(valueScore / 20)),
          source: "task_marketplace",
          data: {
            task,
            competition,
            estimatedDifficulty: difficulty,
            expectedReward
          }
        };
        observations.push(observation);
      }
      this.logger.debug("Observed " + observations.length + " open tasks");
      return observations;
    } catch (error) {
      this.logger.warn("Failed to observe tasks", error);
      return [];
    }
  }
  // ==================== ORIENT ====================
  /**
   * Analyze observations and build context
   */
  async orient(observations) {
    this.logger.debug("Orienting...");
    const recentObs = this.getRecentObservations(this.config.contextWindow);
    const allObs = [...recentObs, ...observations];
    const situation = this.analyzeSituation(allObs);
    const relevantHistory = this.findRelevantExperiences(situation);
    const agentState = await this.getAgentState();
    const constraints = this.identifyConstraints(allObs, agentState);
    const opportunities = this.identifyOpportunities(allObs, agentState);
    const context = {
      timestamp: Date.now(),
      observations: allObs,
      situation,
      relevantHistory,
      agentState,
      constraints,
      opportunities
    };
    this.currentContext = context;
    this.logger.info("Situation: " + situation.type + " - " + situation.description);
    return context;
  }
  analyzeSituation(observations) {
    if (observations.length === 0) {
      return {
        type: "normal",
        description: "No significant observations",
        confidence: 0.9
      };
    }
    const criticalObs = observations.filter((o) => o.priority >= 8);
    if (criticalObs.length > 0) {
      return {
        type: "critical",
        description: criticalObs.length + " high-priority observations",
        confidence: 0.85
      };
    }
    const opportunities = observations.filter(
      (o) => o.type === "governance" /* GOVERNANCE */ || o.type === "task" /* TASK */
    );
    if (opportunities.length > 0) {
      return {
        type: "opportunity",
        description: opportunities.length + " opportunities detected",
        confidence: 0.8
      };
    }
    const blockchainObs = observations.filter((o) => o.type === "blockchain" /* BLOCKCHAIN */);
    const highGas = blockchainObs.some((o) => o.data.networkCongestion === "high");
    if (highGas) {
      return {
        type: "threat",
        description: "High network congestion detected",
        confidence: 0.75
      };
    }
    return {
      type: "normal",
      description: "Normal operating conditions",
      confidence: 0.9
    };
  }
  identifyOpportunities(observations, _agentState) {
    const opportunities = [];
    const governanceObs = observations.filter((o) => o.type === "governance" /* GOVERNANCE */);
    for (const obs of governanceObs) {
      const proposal = obs.data.proposal;
      const urgency = this.calculateProposalUrgency(obs.data.timeRemaining);
      opportunities.push({
        type: "governance",
        description: "Vote on proposal #" + proposal.proposalId,
        expectedValue: 100n,
        // Reputation gain from voting
        risk: "low",
        urgency
      });
    }
    const taskObs = observations.filter((o) => o.type === "task" /* TASK */);
    for (const obs of taskObs) {
      const reward = obs.data.expectedReward;
      const difficulty = obs.data.estimatedDifficulty;
      opportunities.push({
        type: "task",
        description: "Complete task #" + obs.data.task.taskId,
        expectedValue: reward,
        risk: difficulty === "hard" ? "high" : difficulty === "medium" ? "medium" : "low",
        urgency: obs.priority
      });
    }
    return opportunities;
  }
  identifyConstraints(observations, agentState) {
    const constraints = [];
    const blockchainObs = observations.filter((o) => o.type === "blockchain" /* BLOCKCHAIN */);
    const highGasObs = blockchainObs.find((o) => o.data.networkCongestion === "high");
    if (highGasObs) {
      constraints.push("High gas prices - limit transactions");
    }
    if (agentState.activeTasks >= 3) {
      constraints.push("Maximum active tasks reached");
    }
    return constraints;
  }
  // ==================== DECIDE ====================
  /**
   * Make decision based on context
   */
  async decide(context) {
    this.logger.debug("Deciding...");
    const alternatives = await this.generateAlternatives(context);
    const selected = this.selectAlternative(alternatives, context);
    const actions = this.generateActions(selected, context);
    const expectedOutcomes = this.calculateExpectedOutcomes(actions, context);
    const decision = {
      id: "decision-" + Date.now(),
      timestamp: Date.now(),
      context,
      reasoning: {
        analysis: this.generateAnalysis(context, alternatives),
        alternatives,
        selectedAlternative: selected.id,
        confidence: selected.confidence
      },
      actions,
      expectedOutcomes
    };
    this.currentDecision = decision;
    this.logger.info("Decision made: " + selected.id + " (confidence: " + (selected.confidence * 100).toFixed(0) + "%)");
    return decision;
  }
  async generateAlternatives(context) {
    const alternatives = [];
    if (context.opportunities.length > 0) {
      const topOpp = context.opportunities.sort((a, b) => b.urgency - a.urgency)[0];
      alternatives.push({
        id: "act_on_opportunity",
        description: "Act on " + topOpp.type + " opportunity: " + topOpp.description,
        expectedValue: topOpp.expectedValue,
        risk: topOpp.risk === "high" ? 0.8 : topOpp.risk === "medium" ? 0.5 : 0.2,
        confidence: 0.7
      });
    }
    alternatives.push({
      id: "wait_and_observe",
      description: "Wait for more information before acting",
      expectedValue: 0n,
      risk: 0.1,
      confidence: 0.9
    });
    const governanceOpps = context.opportunities.filter((o) => o.type === "governance");
    if (governanceOpps.length > 0) {
      alternatives.push({
        id: "conservative_action",
        description: "Vote on proposals only, skip tasks",
        expectedValue: BigInt(governanceOpps.length) * 50n,
        risk: 0.15,
        confidence: 0.85
      });
    }
    return alternatives.slice(0, this.config.maxAlternatives);
  }
  selectAlternative(alternatives, context) {
    if (alternatives.length === 0) {
      return {
        id: "do_nothing",
        description: "No viable alternatives",
        expectedValue: 0n,
        risk: 0,
        confidence: 1
      };
    }
    let bestAlternative = alternatives[0];
    let bestScore = -Infinity;
    for (const alt of alternatives) {
      if (alt.confidence < this.config.minConfidence) {
        continue;
      }
      const valueScore = Number(alt.expectedValue) / 1e18;
      const riskPenalty = alt.risk * 100;
      const confidenceBonus = alt.confidence * 50;
      const score = valueScore - riskPenalty + confidenceBonus;
      if (score > bestScore) {
        bestScore = score;
        bestAlternative = alt;
      }
    }
    return bestAlternative;
  }
  generateActions(alternative, context) {
    const actions = [];
    if (alternative.id === "act_on_opportunity") {
      const topOpp = context.opportunities[0];
      if (topOpp.type === "governance") {
        const match = topOpp.description.match(/#(\d+)/);
        actions.push({
          id: "vote-" + Date.now(),
          type: "vote" /* VOTE */,
          priority: topOpp.urgency,
          params: {
            proposalId: match ? match[1] : "0",
            support: 1
            // Default to FOR
          },
          metadata: {
            estimatedGas: 100000n
          }
        });
      } else if (topOpp.type === "task") {
        const match = topOpp.description.match(/#(\d+)/);
        actions.push({
          id: "accept-task-" + Date.now(),
          type: "accept_task" /* ACCEPT_TASK */,
          priority: topOpp.urgency,
          params: {
            taskId: match ? match[1] : "0"
          },
          metadata: {
            estimatedGas: 150000n
          }
        });
      }
    } else if (alternative.id === "conservative_action") {
      const govOpps = context.opportunities.filter((o) => o.type === "governance");
      for (const opp of govOpps) {
        const match = opp.description.match(/#(\d+)/);
        actions.push({
          id: "vote-" + Date.now() + "-" + opp.description,
          type: "vote" /* VOTE */,
          priority: opp.urgency,
          params: {
            proposalId: match ? match[1] : "0",
            support: 1
          },
          metadata: {
            estimatedGas: 100000n
          }
        });
      }
    }
    return actions.slice(0, this.config.maxActionsPerCycle);
  }
  calculateExpectedOutcomes(actions, context) {
    let reputationChange = 0n;
    let balanceChange = 0n;
    let totalRisk = 0;
    for (const action of actions) {
      if (action.type === "vote" /* VOTE */) {
        reputationChange += 10n;
      } else if (action.type === "accept_task" /* ACCEPT_TASK */) {
        const taskOpp = context.opportunities.find((o) => o.type === "task");
        if (taskOpp) {
          balanceChange += taskOpp.expectedValue;
          reputationChange += 50n;
          totalRisk += 0.3;
        }
      }
    }
    const riskLevel = totalRisk > 0.6 ? "high" : totalRisk > 0.3 ? "medium" : "low";
    return {
      reputationChange,
      balanceChange,
      riskLevel
    };
  }
  generateAnalysis(context, alternatives) {
    const parts = [];
    parts.push("Situation: " + context.situation.type + " - " + context.situation.description);
    parts.push("Opportunities: " + context.opportunities.length);
    parts.push("Constraints: " + context.constraints.length);
    parts.push("Alternatives considered: " + alternatives.length);
    if (alternatives.length > 0) {
      const conf = (alternatives[0].confidence * 100).toFixed(0);
      parts.push("Best alternative: " + alternatives[0].id + " (confidence: " + conf + "%)");
    }
    return parts.join("; ");
  }
  // ==================== ACT ====================
  /**
   * Execute decision actions
   */
  async act(decision) {
    this.logger.info("Executing " + decision.actions.length + " actions...");
    const results = [];
    for (const action of decision.actions) {
      try {
        const result = await this.executeAction(action);
        results.push(result);
        const status = result.success ? "success" : "failed";
        this.logger.info("Action " + action.id + " completed: " + status);
        this.eventEmitter.emit("custom:*", { type: "reasoning:action", result });
      } catch (error) {
        const failedResult = {
          actionId: action.id,
          success: false,
          timestamp: Date.now(),
          error: error.message,
          actualOutcome: {
            reputationChange: 0n,
            balanceChange: 0n,
            gasUsed: 0n
          }
        };
        results.push(failedResult);
        this.logger.error("Action " + action.id + " failed", error);
      }
    }
    return results;
  }
  async executeAction(action) {
    return new Promise((resolve) => {
      this.eventEmitter.emit("custom:*", { type: "reasoning:execute", action });
      setTimeout(() => {
        resolve({
          actionId: action.id,
          success: true,
          timestamp: Date.now(),
          txHash: "0x simulated",
          actualOutcome: {
            reputationChange: 10n,
            balanceChange: -1000000000000000n,
            // Gas cost
            gasUsed: action.metadata.estimatedGas
          }
        });
      }, 100);
    });
  }
  // ==================== EXPERIENCE ====================
  /**
   * Record experience for learning
   */
  async recordExperience(context, decision, actions) {
    const experience = {
      id: "exp-" + Date.now(),
      timestamp: Date.now(),
      context,
      decision,
      actions,
      outcome: {
        success: actions.every((a) => a.success),
        reputationChange: actions.reduce((sum, a) => sum + a.actualOutcome.reputationChange, 0n),
        balanceChange: actions.reduce((sum, a) => sum + a.actualOutcome.balanceChange, 0n),
        lessonsLearned: this.extractLessons(actions)
      }
    };
    this.experiences.push(experience);
    this.logger.debug("Recorded experience: " + experience.id);
    this.eventEmitter.emit("custom:*", { type: "reasoning:experience", experience });
  }
  extractLessons(actions) {
    const lessons = [];
    const successRate = actions.filter((a) => a.success).length / actions.length;
    if (successRate === 1) {
      lessons.push("All actions succeeded - strategy effective");
    } else if (successRate < 0.5) {
      lessons.push("Low success rate - reconsider strategy");
    }
    const failedActions = actions.filter((a) => !a.success);
    for (const action of failedActions) {
      if (action.error) {
        lessons.push("Action failed: " + action.error);
      }
    }
    return lessons;
  }
  // ==================== HELPERS ====================
  getRecentObservations(limit) {
    return this.observationBuffer.slice(-limit);
  }
  async getAgentState() {
    return {
      reputation: 1000n,
      balance: 1000000000000000000n,
      // 1 AVAX
      activeTasks: 0,
      votingPower: 1000n
    };
  }
  findRelevantExperiences(_situation) {
    return this.experiences.slice(-5);
  }
  assessNetworkCongestion(gasPrice) {
    const threshold = 50000000000n;
    if (gasPrice > threshold * 2n) return "high";
    if (gasPrice > threshold) return "medium";
    return "low";
  }
  calculateProposalUrgency(timeRemaining) {
    const hoursRemaining = Number(timeRemaining) / 3600;
    if (hoursRemaining < 2) return 9;
    if (hoursRemaining < 6) return 7;
    if (hoursRemaining < 24) return 5;
    return 3;
  }
  assessTaskDifficulty(task) {
    const reward = BigInt(task.reward);
    if (reward > 10000000000000000000n) return "hard";
    if (reward > 1000000000000000000n) return "medium";
    return "easy";
  }
  async estimateTaskCompetition(_task) {
    return Math.floor(Math.random() * 5);
  }
  calculateTaskValueScore(reward, difficulty, competition) {
    const baseScore = Number(reward) / 1e18;
    const difficultyMultiplier = difficulty === "hard" ? 0.5 : difficulty === "medium" ? 0.8 : 1;
    const competitionPenalty = competition * 0.1;
    return baseScore * difficultyMultiplier * (1 - competitionPenalty);
  }
  async getActiveProposals() {
    return [];
  }
  async getOpenTasks() {
    return [];
  }
  async getVoteDistribution(_proposalId) {
    return { for: 0n, against: 0n, abstain: 0n };
  }
};

// src/ReasoningEngine.ts
var DEFAULT_REASONING_CONFIG = {
  enableGovernanceAnalysis: true,
  enableTaskAnalysis: true,
  enableLearning: true,
  minConfidenceForAction: 0.6
};
var ReasoningEngine = class {
  config;
  eventEmitter;
  logger;
  client;
  oodaLoop;
  running = false;
  // Analysis cache
  proposalCache = /* @__PURE__ */ new Map();
  taskCache = /* @__PURE__ */ new Map();
  constructor(client, eventEmitter, logger, config = {}) {
    this.client = client;
    this.eventEmitter = eventEmitter;
    this.logger = logger.child({ module: "ReasoningEngine" });
    this.config = { ...DEFAULT_REASONING_CONFIG, ...config };
    this.oodaLoop = new OODALoop(client, eventEmitter, logger, config);
  }
  /**
   * Start the reasoning engine
   */
  async start() {
    if (this.running) {
      return;
    }
    this.logger.info("Starting reasoning engine...");
    this.running = true;
    await this.oodaLoop.start();
    this.logger.info("Reasoning engine started");
  }
  /**
   * Stop the reasoning engine
   */
  async stop() {
    if (!this.running) {
      return;
    }
    this.logger.info("Stopping reasoning engine...");
    this.running = false;
    await this.oodaLoop.stop();
    this.logger.info("Reasoning engine stopped");
  }
  /**
   * Get engine status
   */
  getStatus() {
    return {
      running: this.running,
      ooda: this.oodaLoop.getStatus(),
      proposalCache: this.proposalCache.size,
      taskCache: this.taskCache.size
    };
  }
  // ==================== GOVERNANCE ANALYSIS ====================
  /**
   * Analyze a governance proposal
   */
  async analyzeProposal(proposal) {
    const proposalIdStr = proposal.proposalId.toString();
    this.logger.info("Analyzing proposal #" + proposalIdStr);
    const cached = this.proposalCache.get(proposal.proposalId);
    if (cached) {
      return cached;
    }
    const impactScore = this.calculateProposalImpact(proposal);
    const risks = this.identifyProposalRisks(proposal);
    const benefits = this.identifyProposalBenefits(proposal);
    const recommendation = this.generateProposalRecommendation(proposal, impactScore, risks, benefits);
    const confidence = this.calculateConfidence(proposal, risks, benefits);
    const analysis = {
      proposal,
      impactScore,
      recommendation,
      confidence,
      reasoning: this.generateProposalReasoning(proposal, recommendation, impactScore),
      risks,
      benefits
    };
    this.proposalCache.set(proposal.proposalId, analysis);
    const confPercent = (confidence * 100).toFixed(0);
    this.logger.info("Proposal analysis: " + recommendation + " (confidence: " + confPercent + "%)");
    return analysis;
  }
  calculateProposalImpact(_proposal) {
    return 5;
  }
  identifyProposalRisks(_proposal) {
    const risks = [];
    risks.push("Unknown implementation details");
    risks.push("Potential unintended consequences");
    return risks;
  }
  identifyProposalBenefits(_proposal) {
    const benefits = [];
    benefits.push("Protocol improvement");
    benefits.push("Community engagement");
    return benefits;
  }
  generateProposalRecommendation(_proposal, impactScore, risks, benefits) {
    if (benefits.length > risks.length && impactScore >= 5) {
      return "for";
    }
    if (risks.length > benefits.length) {
      return "against";
    }
    return "abstain";
  }
  calculateConfidence(_proposal, risks, benefits) {
    const totalFactors = risks.length + benefits.length;
    if (totalFactors === 0) return 0.5;
    return Math.min(0.9, 0.5 + totalFactors * 0.1);
  }
  generateProposalReasoning(proposal, recommendation, impactScore) {
    const proposalIdStr = proposal.proposalId.toString();
    return "Proposal #" + proposalIdStr + " has " + impactScore + "/10 impact. Recommendation: " + recommendation + ". Based on risk-benefit analysis and alignment with protocol goals.";
  }
  // ==================== TASK ANALYSIS ====================
  /**
   * Analyze a task opportunity
   */
  async analyzeTask(task, agentCapabilities) {
    const taskIdStr = task.taskId.toString();
    this.logger.info("Analyzing task #" + taskIdStr);
    const cached = this.taskCache.get(task.taskId);
    if (cached) {
      return cached;
    }
    const valueScore = this.calculateTaskValue(task);
    const estimatedROI = this.calculateTaskROI(task);
    const risks = this.identifyTaskRisks(task);
    const requiredCapabilities = this.extractRequiredCapabilities(task);
    const capabilityMatch = this.checkCapabilityMatch(agentCapabilities, requiredCapabilities);
    const recommendation = this.generateTaskRecommendation(valueScore, capabilityMatch, risks);
    const confidence = this.calculateTaskConfidence(valueScore, capabilityMatch);
    const analysis = {
      task,
      valueScore,
      recommendation,
      confidence,
      estimatedROI,
      risks,
      requiredCapabilities
    };
    this.taskCache.set(task.taskId, analysis);
    this.logger.info("Task analysis: " + recommendation + " (value: " + valueScore + "/10)");
    return analysis;
  }
  calculateTaskValue(task) {
    const reward = BigInt(task.reward);
    const baseValue = Number(reward) / 1e18;
    return Math.min(10, baseValue);
  }
  calculateTaskROI(task) {
    const reward = BigInt(task.reward);
    const estimatedGasCost = 10000000000000000n;
    if (reward <= estimatedGasCost) return -100;
    return Number((reward - estimatedGasCost) * 100n / reward);
  }
  identifyTaskRisks(_task) {
    const risks = [];
    risks.push("Task completion uncertainty");
    risks.push("Potential for dispute");
    return risks;
  }
  extractRequiredCapabilities(task) {
    return ["execution", "reporting"];
  }
  checkCapabilityMatch(agent, required) {
    if (required.length === 0) return 1;
    const matched = required.filter((cap) => agent.includes(cap)).length;
    return matched / required.length;
  }
  generateTaskRecommendation(valueScore, capabilityMatch, risks) {
    if (valueScore >= 6 && capabilityMatch >= 0.7 && risks.length <= 2) {
      return "accept";
    }
    return "decline";
  }
  calculateTaskConfidence(valueScore, capabilityMatch) {
    return Math.min(0.9, valueScore / 10 * 0.5 + capabilityMatch * 0.5);
  }
  // ==================== DECISION SUPPORT ====================
  /**
   * Get current decision context
   */
  getCurrentContext() {
    return this.oodaLoop.getStatus().currentContext;
  }
  /**
   * Get latest decision
   */
  getCurrentDecision() {
    return this.oodaLoop.getStatus().currentDecision;
  }
  /**
   * Get recent experiences
   */
  getRecentExperiences(_limit = 10) {
    return [];
  }
  /**
   * Clear analysis caches
   */
  clearCache() {
    this.proposalCache.clear();
    this.taskCache.clear();
    this.logger.debug("Analysis cache cleared");
  }
  /**
   * Get reasoning metrics
   */
  getMetrics() {
    return {
      totalDecisions: 0,
      averageConfidence: 0,
      successRate: 0,
      averageCycleTime: 0
    };
  }
};
export {
  ActionType,
  DEFAULT_OODA_CONFIG,
  DEFAULT_REASONING_CONFIG,
  OODALoop,
  ObservationType,
  ReasoningEngine
};
