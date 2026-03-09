import { Logger } from '@havenclaw/tools';
import { EventEmitter } from '@havenclaw/runtime';

/**
 * Rule Engine - Evaluate rules against context
 */

interface RuleContext {
    type: string;
    [key: string]: any;
}
interface Rule {
    name: string;
    condition: (context: RuleContext) => boolean | Promise<boolean>;
    action: (context: RuleContext) => Promise<any>;
    priority?: number;
}
/**
 * RuleEngine evaluates rules against contexts
 */
declare class RuleEngine {
    private rules;
    private logger;
    constructor(logger: Logger);
    /**
     * Add a rule
     */
    addRule(rule: Rule): void;
    /**
     * Remove a rule
     */
    removeRule(name: string): boolean;
    /**
     * Evaluate all rules against context
     */
    evaluate(context: RuleContext): Promise<any[]>;
    /**
     * Evaluate first matching rule only
     */
    evaluateFirst(context: RuleContext): Promise<any>;
    /**
     * Get all rules
     */
    getRules(): Rule[];
    /**
     * Get rule count
     */
    getRuleCount(): number;
    /**
     * Clear all rules
     */
    clearRules(): void;
}

/**
 * Action Queue - Queue and process actions
 */

interface QueuedAction {
    id: string;
    type: string;
    params: Record<string, any>;
    priority: number;
    createdAt: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error?: string;
}
type ActionHandler = (action: QueuedAction) => Promise<any>;
/**
 * ActionQueue manages a priority queue of actions
 */
declare class ActionQueue {
    private queue;
    private handlers;
    private logger;
    private processing;
    private actionCounter;
    constructor(logger: Logger);
    /**
     * Enqueue an action
     */
    enqueue(params: {
        type: string;
        params: Record<string, any>;
        priority?: number;
    }): string;
    /**
     * Register an action handler
     */
    registerHandler(type: string, handler: ActionHandler): void;
    /**
     * Start processing the queue
     */
    start(): void;
    /**
     * Stop processing the queue
     */
    stop(): void;
    /**
     * Get queue status
     */
    getStatus(): {
        pending: number;
        processing: number;
        completed: number;
        failed: number;
    };
    /**
     * Clear the queue
     */
    clear(): void;
    private processQueue;
}

/**
 * Decision Engine - Main decision making component
 */

interface DecisionConfig {
    autoVote: boolean;
    autoAcceptTasks: boolean;
    minTaskReward: bigint;
    votingRules: VotingRules;
}
interface VotingRules {
    minQuorum: bigint;
    maxAgainstRatio: number;
    trustedProposers: string[];
}
/**
 * DecisionEngine makes autonomous decisions for the agent
 */
declare class DecisionEngine {
    private config;
    private eventEmitter;
    private logger;
    private ruleEngine;
    private actionQueue;
    private running;
    constructor(config: DecisionConfig, eventEmitter: EventEmitter, logger: Logger);
    /**
     * Start the decision engine
     */
    start(): Promise<void>;
    /**
     * Stop the decision engine
     */
    stop(): Promise<void>;
    /**
     * Get queue status
     */
    getStatus(): {
        running: boolean;
        queue: ReturnType<ActionQueue['getStatus']>;
        rules: number;
    };
    private setupRules;
    private setupHandlers;
    private setupEventListeners;
    private evaluateProposal;
    private evaluateTask;
    private handleProposal;
    private handleTask;
    private calculateVote;
}

export { type ActionHandler, ActionQueue, type DecisionConfig, DecisionEngine, type QueuedAction, type Rule, type RuleContext, RuleEngine, type VotingRules };
