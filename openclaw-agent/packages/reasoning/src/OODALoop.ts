/**
 * OODA Loop - Observe-Orient-Decide-Act implementation
 */

import { EventEmitter } from '@havenclaw/runtime';
import { Logger } from '@havenclaw/tools';
import type { HavenClient, ProposalInfo, TaskInfo } from '@havenclaw/haven-interface';
import {
  Observation,
  ObservationType,
  Context,
  Decision,
  Action,
  ActionType,
  ActionResult,
  Experience,
  OODAConfig,
  DEFAULT_OODA_CONFIG,
  Opportunity,
  Alternative,
} from './types.js';

// Re-export for package index
export { ObservationType, ActionType, DEFAULT_OODA_CONFIG };
export type { OODAConfig };

/**
 * Main OODA Loop implementation
 */
export class OODALoop {
  private config: OODAConfig;
  private eventEmitter: EventEmitter;
  private logger: Logger;
  private client: HavenClient;

  // State
  private running: boolean = false;
  private observationBuffer: Observation[] = [];
  private experiences: Experience[] = [];
  private currentContext?: Context;
  private currentDecision?: Decision;

  // Observers
  private blockchainObserver?: NodeJS.Timeout;
  private governanceObserver?: NodeJS.Timeout;
  private taskObserver?: NodeJS.Timeout;

  constructor(
    client: HavenClient,
    eventEmitter: EventEmitter,
    logger: Logger,
    config: Partial<OODAConfig> = {}
  ) {
    this.client = client;
    this.eventEmitter = eventEmitter;
    this.logger = logger.child({ module: 'OODALoop' });
    this.config = { ...DEFAULT_OODA_CONFIG, ...config };
  }

  /**
   * Start the OODA loop
   */
  async start(): Promise<void> {
    if (this.running) {
      return;
    }

    this.logger.info('Starting OODA loop...');
    this.running = true;

    // Start observation cycles
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

    // Run first orientation-decision cycle
    await this.runCycle();

    this.logger.info('OODA loop started');
  }

  /**
   * Stop the OODA loop
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    this.logger.info('Stopping OODA loop...');
    this.running = false;

    // Clear observers
    if (this.blockchainObserver) clearInterval(this.blockchainObserver);
    if (this.governanceObserver) clearInterval(this.governanceObserver);
    if (this.taskObserver) clearInterval(this.taskObserver);

    this.logger.info('OODA loop stopped');
  }

  /**
   * Get current status
   */
  getStatus(): {
    running: boolean;
    observations: number;
    experiences: number;
    currentContext?: Context;
    currentDecision?: Decision;
  } {
    return {
      running: this.running,
      observations: this.observationBuffer.length,
      experiences: this.experiences.length,
      currentContext: this.currentContext,
      currentDecision: this.currentDecision,
    };
  }

  /**
   * Run one complete OODA cycle
   */
  private async runCycle(): Promise<void> {
    try {
      // Observe
      const observations = await this.observe();

      // Orient
      const context = await this.orient(observations);

      // Decide
      const decision = await this.decide(context);

      // Act
      const results = await this.act(decision);

      // Record experience
      if (this.config.recordExperiences) {
        await this.recordExperience(context, decision, results);
      }
    } catch (error) {
      this.logger.error('OODA cycle failed', error as Error);
      this.eventEmitter.emit('custom:*', { type: 'reasoning:error', error: error as Error });
    }
  }

  // ==================== OBSERVE ====================

  /**
   * Gather observations from all sources
   */
  async observe(): Promise<Observation[]> {
    this.logger.debug('Gathering observations...');

    const observations: Observation[] = [];

    // Blockchain observations
    const blockchainObs = await this.observeBlockchain();
    observations.push(...blockchainObs);

    // Governance observations
    const governanceObs = await this.observeGovernance();
    observations.push(...governanceObs);

    // Task observations
    const taskObs = await this.observeTasks();
    observations.push(...taskObs);

    // Sort by priority
    observations.sort((a, b) => b.priority - a.priority);

    // Keep only recent observations
    this.observationBuffer = [
      ...this.observationBuffer,
      ...observations,
    ].slice(-this.config.maxObservations);

    this.logger.debug('Collected ' + observations.length + ' observations');
    return observations;
  }

  private async observeBlockchain(): Promise<Observation[]> {
    try {
      const blockNumber = await this.client.getBlockNumber();
      const feeData = await this.client.getFeeData();

      const gasPrice = feeData.maxFeePerGas || 0n;
      const networkCongestion = this.assessNetworkCongestion(gasPrice);

      const observation: BlockchainObservation = {
        type: ObservationType.BLOCKCHAIN,
        timestamp: Date.now(),
        priority: 5,
        source: 'blockchain',
        data: {
          blockNumber,
          gasPrice,
          networkCongestion,
        },
      };

      this.logger.debug('Blockchain observation: block ' + blockNumber + ', gas ' + gasPrice);
      return [observation];
    } catch (error) {
      this.logger.warn('Failed to observe blockchain', error as Error);
      return [];
    }
  }

  private async observeGovernance(): Promise<Observation[]> {
    try {
      // Get active proposals
      const proposals = await this.getActiveProposals();
      const observations: GovernanceObservation[] = [];

      for (const proposal of proposals) {
        const timeRemaining = proposal.endBlock - BigInt(Math.floor(Date.now() / 1000 / 12)); // Approximate seconds from blocks
        const voteDist = await this.getVoteDistribution(proposal.proposalId.toString());

        const urgency = this.calculateProposalUrgency(timeRemaining);

        const observation: GovernanceObservation = {
          type: ObservationType.GOVERNANCE,
          timestamp: Date.now(),
          priority: urgency,
          source: 'governance',
          data: {
            proposal,
            timeRemaining,
            currentQuorum: voteDist.for + voteDist.against + voteDist.abstain,
            voteDistribution: voteDist,
          },
        };

        observations.push(observation);
      }

      this.logger.debug('Observed ' + observations.length + ' active proposals');
      return observations;
    } catch (error) {
      this.logger.warn('Failed to observe governance', error as Error);
      return [];
    }
  }

  private async observeTasks(): Promise<Observation[]> {
    try {
      const tasks = await this.getOpenTasks();
      const observations: TaskObservation[] = [];

      for (const task of tasks) {
        const difficulty = this.assessTaskDifficulty(task);
        const expectedReward = BigInt(task.reward);
        const competition = await this.estimateTaskCompetition(task);

        const valueScore = this.calculateTaskValueScore(expectedReward, difficulty, competition);

        const observation: TaskObservation = {
          type: ObservationType.TASK,
          timestamp: Date.now(),
          priority: Math.min(10, Math.floor(valueScore / 20)),
          source: 'task_marketplace',
          data: {
            task,
            competition,
            estimatedDifficulty: difficulty,
            expectedReward,
          },
        };

        observations.push(observation);
      }

      this.logger.debug('Observed ' + observations.length + ' open tasks');
      return observations;
    } catch (error) {
      this.logger.warn('Failed to observe tasks', error as Error);
      return [];
    }
  }

  // ==================== ORIENT ====================

  /**
   * Analyze observations and build context
   */
  async orient(observations: Observation[]): Promise<Context> {
    this.logger.debug('Orienting...');

    // Get recent observations from buffer
    const recentObs = this.getRecentObservations(this.config.contextWindow);
    const allObs = [...recentObs, ...observations];

    // Analyze situation
    const situation = this.analyzeSituation(allObs);

    // Find relevant experiences
    const relevantHistory = this.findRelevantExperiences(situation);

    // Get current agent state
    const agentState = await this.getAgentState();

    // Identify constraints and opportunities
    const constraints = this.identifyConstraints(allObs, agentState);
    const opportunities = this.identifyOpportunities(allObs, agentState);

    const context: Context = {
      timestamp: Date.now(),
      observations: allObs,
      situation,
      relevantHistory,
      agentState,
      constraints,
      opportunities,
    };

    this.currentContext = context;
    this.logger.info('Situation: ' + situation.type + ' - ' + situation.description);

    return context;
  }

  private analyzeSituation(observations: Observation[]): Context['situation'] {
    if (observations.length === 0) {
      return {
        type: 'normal',
        description: 'No significant observations',
        confidence: 0.9,
      };
    }

    // Check for critical situations
    const criticalObs = observations.filter(o => o.priority >= 8);
    if (criticalObs.length > 0) {
      return {
        type: 'critical',
        description: criticalObs.length + ' high-priority observations',
        confidence: 0.85,
      };
    }

    // Check for opportunities
    const opportunities = observations.filter(o =>
      o.type === ObservationType.GOVERNANCE || o.type === ObservationType.TASK
    );
    if (opportunities.length > 0) {
      return {
        type: 'opportunity',
        description: opportunities.length + ' opportunities detected',
        confidence: 0.8,
      };
    }

    // Check for threats (e.g., high gas, low balance)
    const blockchainObs = observations.filter(o => o.type === ObservationType.BLOCKCHAIN);
    const highGas = blockchainObs.some(o => o.data.networkCongestion === 'high');
    if (highGas) {
      return {
        type: 'threat',
        description: 'High network congestion detected',
        confidence: 0.75,
      };
    }

    return {
      type: 'normal',
      description: 'Normal operating conditions',
      confidence: 0.9,
    };
  }

  private identifyOpportunities(observations: Observation[], _agentState: Context['agentState']): Opportunity[] {
    const opportunities: Opportunity[] = [];

    // Governance opportunities
    const governanceObs = observations.filter(o => o.type === ObservationType.GOVERNANCE);
    for (const obs of governanceObs) {
      const proposal = obs.data.proposal;
      const urgency = this.calculateProposalUrgency(obs.data.timeRemaining);

      opportunities.push({
        type: 'governance',
        description: 'Vote on proposal #' + proposal.proposalId,
        expectedValue: 100n, // Reputation gain from voting
        risk: 'low',
        urgency,
      });
    }

    // Task opportunities
    const taskObs = observations.filter(o => o.type === ObservationType.TASK);
    for (const obs of taskObs) {
      const reward = obs.data.expectedReward;
      const difficulty = obs.data.estimatedDifficulty;

      opportunities.push({
        type: 'task',
        description: 'Complete task #' + obs.data.task.taskId,
        expectedValue: reward,
        risk: difficulty === 'hard' ? 'high' : difficulty === 'medium' ? 'medium' : 'low',
        urgency: obs.priority,
      });
    }

    return opportunities;
  }

  private identifyConstraints(observations: Observation[], agentState: Context['agentState']): string[] {
    const constraints: string[] = [];

    // Gas constraints
    const blockchainObs = observations.filter(o => o.type === ObservationType.BLOCKCHAIN);
    const highGasObs = blockchainObs.find(o => o.data.networkCongestion === 'high');
    if (highGasObs) {
      constraints.push('High gas prices - limit transactions');
    }

    // Capacity constraints
    if (agentState.activeTasks >= 3) {
      constraints.push('Maximum active tasks reached');
    }

    return constraints;
  }

  // ==================== DECIDE ====================

  /**
   * Make decision based on context
   */
  async decide(context: Context): Promise<Decision> {
    this.logger.debug('Deciding...');

    // Generate alternatives
    const alternatives = await this.generateAlternatives(context);

    // Select best alternative
    const selected = this.selectAlternative(alternatives, context);

    // Generate actions from selected alternative
    const actions = this.generateActions(selected, context);

    // Calculate expected outcomes
    const expectedOutcomes = this.calculateExpectedOutcomes(actions, context);

    const decision: Decision = {
      id: 'decision-' + Date.now(),
      timestamp: Date.now(),
      context,
      reasoning: {
        analysis: this.generateAnalysis(context, alternatives),
        alternatives,
        selectedAlternative: selected.id,
        confidence: selected.confidence,
      },
      actions,
      expectedOutcomes,
    };

    this.currentDecision = decision;
    this.logger.info('Decision made: ' + selected.id + ' (confidence: ' + (selected.confidence * 100).toFixed(0) + '%)');

    return decision;
  }

  private async generateAlternatives(context: Context): Promise<Alternative[]> {
    const alternatives: Alternative[] = [];

    // Alternative 1: Act on highest priority opportunity
    if (context.opportunities.length > 0) {
      const topOpp = context.opportunities.sort((a, b) => b.urgency - a.urgency)[0];
      alternatives.push({
        id: 'act_on_opportunity',
        description: 'Act on ' + topOpp.type + ' opportunity: ' + topOpp.description,
        expectedValue: topOpp.expectedValue,
        risk: topOpp.risk === 'high' ? 0.8 : topOpp.risk === 'medium' ? 0.5 : 0.2,
        confidence: 0.7,
      });
    }

    // Alternative 2: Wait and observe
    alternatives.push({
      id: 'wait_and_observe',
      description: 'Wait for more information before acting',
      expectedValue: 0n,
      risk: 0.1,
      confidence: 0.9,
    });

    // Alternative 3: Conservative action (vote only, no tasks)
    const governanceOpps = context.opportunities.filter(o => o.type === 'governance');
    if (governanceOpps.length > 0) {
      alternatives.push({
        id: 'conservative_action',
        description: 'Vote on proposals only, skip tasks',
        expectedValue: BigInt(governanceOpps.length) * 50n,
        risk: 0.15,
        confidence: 0.85,
      });
    }

    return alternatives.slice(0, this.config.maxAlternatives);
  }

  private selectAlternative(alternatives: Alternative[], context: Context): Alternative {
    if (alternatives.length === 0) {
      return {
        id: 'do_nothing',
        description: 'No viable alternatives',
        expectedValue: 0n,
        risk: 0,
        confidence: 1.0,
      };
    }

    // Simple utility-based selection
    let bestAlternative = alternatives[0];
    let bestScore = -Infinity;

    for (const alt of alternatives) {
      // Skip if confidence too low
      if (alt.confidence < this.config.minConfidence) {
        continue;
      }

      // Calculate utility score
      const valueScore = Number(alt.expectedValue) / 1e18; // Normalize
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

  private generateActions(alternative: Alternative, context: Context): Action[] {
    const actions: Action[] = [];

    if (alternative.id === 'act_on_opportunity') {
      // Generate actions for top opportunity
      const topOpp = context.opportunities[0];

      if (topOpp.type === 'governance') {
        const match = topOpp.description.match(/#(\d+)/);
        actions.push({
          id: 'vote-' + Date.now(),
          type: ActionType.VOTE,
          priority: topOpp.urgency,
          params: {
            proposalId: match ? match[1] : '0',
            support: 1, // Default to FOR
          },
          metadata: {
            estimatedGas: 100000n,
          },
        });
      } else if (topOpp.type === 'task') {
        const match = topOpp.description.match(/#(\d+)/);
        actions.push({
          id: 'accept-task-' + Date.now(),
          type: ActionType.ACCEPT_TASK,
          priority: topOpp.urgency,
          params: {
            taskId: match ? match[1] : '0',
          },
          metadata: {
            estimatedGas: 150000n,
          },
        });
      }
    } else if (alternative.id === 'conservative_action') {
      // Vote on all pending proposals
      const govOpps = context.opportunities.filter(o => o.type === 'governance');
      for (const opp of govOpps) {
        const match = opp.description.match(/#(\d+)/);
        actions.push({
          id: 'vote-' + Date.now() + '-' + opp.description,
          type: ActionType.VOTE,
          priority: opp.urgency,
          params: {
            proposalId: match ? match[1] : '0',
            support: 1,
          },
          metadata: {
            estimatedGas: 100000n,
          },
        });
      }
    }

    return actions.slice(0, this.config.maxActionsPerCycle);
  }

  private calculateExpectedOutcomes(actions: Action[], context: Context): Decision['expectedOutcomes'] {
    let reputationChange = 0n;
    let balanceChange = 0n;
    let totalRisk = 0;

    for (const action of actions) {
      if (action.type === ActionType.VOTE) {
        reputationChange += 10n; // Small rep gain for voting
      } else if (action.type === ActionType.ACCEPT_TASK) {
        // Estimate task reward (simplified)
        const taskOpp = context.opportunities.find(o => o.type === 'task');
        if (taskOpp) {
          balanceChange += taskOpp.expectedValue;
          reputationChange += 50n;
          totalRisk += 0.3;
        }
      }
    }

    const riskLevel = totalRisk > 0.6 ? 'high' : totalRisk > 0.3 ? 'medium' : 'low';

    return {
      reputationChange,
      balanceChange,
      riskLevel,
    };
  }

  private generateAnalysis(context: Context, alternatives: Alternative[]): string {
    const parts: string[] = [];

    parts.push('Situation: ' + context.situation.type + ' - ' + context.situation.description);
    parts.push('Opportunities: ' + context.opportunities.length);
    parts.push('Constraints: ' + context.constraints.length);
    parts.push('Alternatives considered: ' + alternatives.length);

    if (alternatives.length > 0) {
      const conf = (alternatives[0].confidence * 100).toFixed(0);
      parts.push('Best alternative: ' + alternatives[0].id + ' (confidence: ' + conf + '%)');
    }

    return parts.join('; ');
  }

  // ==================== ACT ====================

  /**
   * Execute decision actions
   */
  async act(decision: Decision): Promise<ActionResult[]> {
    this.logger.info('Executing ' + decision.actions.length + ' actions...');

    const results: ActionResult[] = [];

    for (const action of decision.actions) {
      try {
        const result = await this.executeAction(action);
        results.push(result);

        const status = result.success ? 'success' : 'failed';
        this.logger.info('Action ' + action.id + ' completed: ' + status);
        this.eventEmitter.emit('custom:*', { type: 'reasoning:action', result });
      } catch (error) {
        const failedResult: ActionResult = {
          actionId: action.id,
          success: false,
          timestamp: Date.now(),
          error: (error as Error).message,
          actualOutcome: {
            reputationChange: 0n,
            balanceChange: 0n,
            gasUsed: 0n,
          },
        };
        results.push(failedResult);

        this.logger.error('Action ' + action.id + ' failed', error as Error);
      }
    }

    return results;
  }

  private async executeAction(action: Action): Promise<ActionResult> {
    // In Phase 2, this integrates with the transaction layer
    // For now, emit events for the decision engine to handle

    return new Promise((resolve) => {
      // Emit action event for execution by other components
      this.eventEmitter.emit('custom:*', { type: 'reasoning:execute', action });

      // Simulate async execution (in production, wait for tx confirmation)
      setTimeout(() => {
        resolve({
          actionId: action.id,
          success: true,
          timestamp: Date.now(),
          txHash: '0x simulated',
          actualOutcome: {
            reputationChange: 10n,
            balanceChange: -1000000000000000n, // Gas cost
            gasUsed: action.metadata.estimatedGas,
          },
        });
      }, 100);
    });
  }

  // ==================== EXPERIENCE ====================

  /**
   * Record experience for learning
   */
  private async recordExperience(context: Context, decision: Decision, actions: ActionResult[]): Promise<void> {
    const experience: Experience = {
      id: 'exp-' + Date.now(),
      timestamp: Date.now(),
      context,
      decision,
      actions,
      outcome: {
        success: actions.every(a => a.success),
        reputationChange: actions.reduce((sum, a) => sum + a.actualOutcome.reputationChange, 0n),
        balanceChange: actions.reduce((sum, a) => sum + a.actualOutcome.balanceChange, 0n),
        lessonsLearned: this.extractLessons(actions),
      },
    };

    this.experiences.push(experience);
    this.logger.debug('Recorded experience: ' + experience.id);

    // Emit experience event
    this.eventEmitter.emit('custom:*', { type: 'reasoning:experience', experience });
  }

  private extractLessons(actions: ActionResult[]): string[] {
    const lessons: string[] = [];

    const successRate = actions.filter(a => a.success).length / actions.length;

    if (successRate === 1) {
      lessons.push('All actions succeeded - strategy effective');
    } else if (successRate < 0.5) {
      lessons.push('Low success rate - reconsider strategy');
    }

    const failedActions = actions.filter(a => !a.success);
    for (const action of failedActions) {
      if (action.error) {
        lessons.push('Action failed: ' + action.error);
      }
    }

    return lessons;
  }

  // ==================== HELPERS ====================

  private getRecentObservations(limit: number): Observation[] {
    return this.observationBuffer.slice(-limit);
  }

  private async getAgentState(): Promise<Context['agentState']> {
    // Simplified - in production, query actual on-chain state
    return {
      reputation: 1000n,
      balance: 1000000000000000000n, // 1 AVAX
      activeTasks: 0,
      votingPower: 1000n,
    };
  }

  private findRelevantExperiences(_situation: Context['situation']): Experience[] {
    // Return recent experiences (in production, use semantic search)
    return this.experiences.slice(-5);
  }

  private assessNetworkCongestion(gasPrice: bigint): 'low' | 'medium' | 'high' {
    const threshold = 50000000000n; // 50 gwei
    if (gasPrice > threshold * 2n) return 'high';
    if (gasPrice > threshold) return 'medium';
    return 'low';
  }

  private calculateProposalUrgency(timeRemaining: bigint): number {
    const hoursRemaining = Number(timeRemaining) / 3600;
    if (hoursRemaining < 2) return 9;
    if (hoursRemaining < 6) return 7;
    if (hoursRemaining < 24) return 5;
    return 3;
  }

  private assessTaskDifficulty(task: TaskInfo): 'easy' | 'medium' | 'hard' {
    // Simplified assessment
    const reward = BigInt(task.reward);
    if (reward > 10000000000000000000n) return 'hard'; // > 10 HAVEN
    if (reward > 1000000000000000000n) return 'medium'; // > 1 HAVEN
    return 'easy';
  }

  private async estimateTaskCompetition(_task: TaskInfo): Promise<number> {
    // Simplified - in production, query marketplace
    return Math.floor(Math.random() * 5);
  }

  private calculateTaskValueScore(reward: bigint, difficulty: string, competition: number): number {
    const baseScore = Number(reward) / 1e18;
    const difficultyMultiplier = difficulty === 'hard' ? 0.5 : difficulty === 'medium' ? 0.8 : 1.0;
    const competitionPenalty = competition * 0.1;

    return baseScore * difficultyMultiplier * (1 - competitionPenalty);
  }

  private async getActiveProposals(): Promise<ProposalInfo[]> {
    // Simplified - in production, query HavenGovernance contract
    return [];
  }

  private async getOpenTasks(): Promise<TaskInfo[]> {
    // Simplified - in production, query TaskMarketplace contract
    return [];
  }

  private async getVoteDistribution(_proposalId: string): Promise<{ for: bigint; against: bigint; abstain: bigint }> {
    // Simplified - in production, query contract
    return { for: 0n, against: 0n, abstain: 0n };
  }
}

// Type declarations for extended Observation types
export interface BlockchainObservation extends Observation {
  type: ObservationType.BLOCKCHAIN;
  data: {
    blockNumber: bigint;
    gasPrice: bigint;
    networkCongestion: 'low' | 'medium' | 'high';
  };
}

export interface GovernanceObservation extends Observation {
  type: ObservationType.GOVERNANCE;
  data: {
    proposal: ProposalInfo;
    timeRemaining: bigint;
    currentQuorum: bigint;
    voteDistribution: { for: bigint; against: bigint; abstain: bigint };
  };
}

export interface TaskObservation extends Observation {
  type: ObservationType.TASK;
  data: {
    task: TaskInfo;
    competition: number;
    estimatedDifficulty: 'easy' | 'medium' | 'hard';
    expectedReward: bigint;
  };
}
