/**
 * Decision Engine - Main decision making component
 */

import { EventEmitter } from '@havenclaw/runtime';
import { Logger } from '@havenclaw/tools';
import type { TaskInfo, ProposalInfo } from '@havenclaw/haven-interface';
import { RuleEngine, RuleContext } from './RuleEngine.js';
import { ActionQueue } from './ActionQueue.js';

export interface DecisionConfig {
  autoVote: boolean;
  autoAcceptTasks: boolean;
  minTaskReward: bigint;
  votingRules: VotingRules;
}

export interface VotingRules {
  minQuorum: bigint;
  maxAgainstRatio: number;
  trustedProposers: string[];
}

/**
 * DecisionEngine makes autonomous decisions for the agent
 */
export class DecisionEngine {
  private config: DecisionConfig;
  private eventEmitter: EventEmitter;
  private logger: Logger;
  private ruleEngine: RuleEngine;
  private actionQueue: ActionQueue;
  private running: boolean = false;

  constructor(
    config: DecisionConfig,
    eventEmitter: EventEmitter,
    logger: Logger
  ) {
    this.config = config;
    this.eventEmitter = eventEmitter;
    this.logger = logger.child({ module: 'DecisionEngine' });
    this.ruleEngine = new RuleEngine(logger);
    this.actionQueue = new ActionQueue(logger);

    this.setupRules();
    this.setupHandlers();
  }

  /**
   * Start the decision engine
   */
  async start(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;
    this.actionQueue.start();
    this.setupEventListeners();

    this.logger.info('Decision engine started');
  }

  /**
   * Stop the decision engine
   */
  async stop(): Promise<void> {
    this.running = false;
    this.actionQueue.stop();
    this.eventEmitter.removeAllListeners();

    this.logger.info('Decision engine stopped');
  }

  /**
   * Get queue status
   */
  getStatus(): {
    running: boolean;
    queue: ReturnType<ActionQueue['getStatus']>;
    rules: number;
  } {
    return {
      running: this.running,
      queue: this.actionQueue.getStatus(),
      rules: this.ruleEngine.getRuleCount(),
    };
  }

  private setupRules(): void {
    // Governance voting rule
    if (this.config.autoVote) {
      this.ruleEngine.addRule({
        name: 'auto-vote-proposals',
        priority: 5,
        condition: (context) => context.type === 'proposal',
        action: (context) => this.handleProposal(context as ProposalContext),
      });
    }

    // Task acceptance rule
    if (this.config.autoAcceptTasks) {
      this.ruleEngine.addRule({
        name: 'auto-accept-tasks',
        priority: 3,
        condition: (context) =>
          context.type === 'task' &&
          BigInt((context as TaskContext).task.reward) >= this.config.minTaskReward,
        action: (context) => this.handleTask(context as TaskContext),
      });
    }
  }

  private setupHandlers(): void {
    // Handle vote actions
    this.actionQueue.registerHandler('governance_vote', async (action) => {
      this.logger.info(`Executing vote: proposal ${action.params.proposalId}`);
      // In production, this would call HavenGovernance.castVote
      this.eventEmitter.emit('governance:vote' as any, action.params);
    });

    // Handle task accept actions
    this.actionQueue.registerHandler('task_accept', async (action) => {
      this.logger.info(`Accepting task: ${action.params.taskId}`);
      // In production, this would call TaskMarketplace.acceptTask
      this.eventEmitter.emit('task:accepted' as any, action.params);
    });

    // Handle task complete actions
    this.actionQueue.registerHandler('task_complete', async (action) => {
      this.logger.info(`Completing task: ${action.params.taskId}`);
      // In production, this would call TaskMarketplace.completeTask
      this.eventEmitter.emit('task:completed' as any, action.params);
    });
  }

  private setupEventListeners(): void {
    // Listen for new proposals
    this.eventEmitter.on('governance:proposal' as any, (proposal: any) => {
      this.logger.info(`New proposal detected: ${proposal.proposalId}`);
      this.evaluateProposal(proposal);
    });

    // Listen for new tasks
    this.eventEmitter.on('task:created' as any, (task: any) => {
      this.logger.info(`New task detected: ${task.taskId}`);
      this.evaluateTask(task);
    });
  }

  private async evaluateProposal(proposal: ProposalContext['proposal']): Promise<void> {
    const context: ProposalContext = {
      type: 'proposal',
      proposal,
    };

    await this.ruleEngine.evaluate(context);
  }

  private async evaluateTask(task: TaskContext['task']): Promise<void> {
    const context: TaskContext = {
      type: 'task',
      task,
    };

    await this.ruleEngine.evaluate(context);
  }

  private async handleProposal(context: ProposalContext): Promise<void> {
    const vote = await this.calculateVote(context.proposal);

    this.actionQueue.enqueue({
      type: 'governance_vote',
      params: {
        proposalId: context.proposal.proposalId,
        support: vote,
      },
      priority: 5,
    });
  }

  private async handleTask(context: TaskContext): Promise<void> {
    this.actionQueue.enqueue({
      type: 'task_accept',
      params: {
        taskId: context.task.taskId,
      },
      priority: 3,
    });
  }

  private async calculateVote(_proposal: ProposalInfo): Promise<number> {
    // Simple rule-based voting (Phase 2 will have advanced analysis)

    // Check if from trusted proposer
    if (this.config.votingRules.trustedProposers.includes('any')) {
      return 1; // For
    }

    // Default: abstain for unknown proposals
    return 2; // Abstain
  }
}

interface ProposalContext extends RuleContext {
  proposal: ProposalInfo;
}

interface TaskContext extends RuleContext {
  task: TaskInfo;
}
