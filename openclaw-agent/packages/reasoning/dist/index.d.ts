import { EventEmitter } from '@havenclaw/runtime';
import { Logger } from '@havenclaw/tools';
import { ProposalInfo, HavenClient, TaskInfo } from '@havenclaw/haven-interface';

/**
 * OODA Loop Types - Core interfaces for Observe-Orient-Decide-Act cycle
 */

/**
 * Observation types - data collected from the environment
 */
declare enum ObservationType {
    BLOCKCHAIN = "blockchain",
    GOVERNANCE = "governance",
    TASK = "task",
    REPUTATION = "reputation",
    EXTERNAL = "external"
}
interface Observation {
    type: ObservationType;
    timestamp: number;
    data: any;
    priority: number;
    source: string;
}
/**
 * Context - Oriented understanding of the situation
 */
interface Context {
    timestamp: number;
    observations: Observation[];
    situation: {
        type: 'normal' | 'opportunity' | 'threat' | 'critical';
        description: string;
        confidence: number;
    };
    relevantHistory: Experience[];
    agentState: {
        reputation: bigint;
        balance: bigint;
        activeTasks: number;
        votingPower: bigint;
    };
    constraints: string[];
    opportunities: Opportunity[];
}
interface Opportunity {
    type: 'governance' | 'task' | 'reputation';
    description: string;
    expectedValue: bigint;
    risk: 'low' | 'medium' | 'high';
    urgency: number;
}
/**
 * Decision - Chosen course of action
 */
interface Decision {
    id: string;
    timestamp: number;
    context: Context;
    reasoning: {
        analysis: string;
        alternatives: Alternative[];
        selectedAlternative: string;
        confidence: number;
    };
    actions: Action[];
    expectedOutcomes: {
        reputationChange: bigint;
        balanceChange: bigint;
        riskLevel: 'low' | 'medium' | 'high';
    };
}
interface Alternative {
    id: string;
    description: string;
    expectedValue: bigint;
    risk: number;
    confidence: number;
}
/**
 * Action - Executable unit
 */
interface Action {
    id: string;
    type: ActionType;
    priority: number;
    params: Record<string, any>;
    metadata: {
        estimatedGas: bigint;
        timeout?: number;
        retries?: number;
    };
}
declare enum ActionType {
    VOTE = "vote",
    ACCEPT_TASK = "accept_task",
    COMPLETE_TASK = "complete_task",
    STAKE = "stake",
    UNSTAKE = "unstake",
    TRANSFER = "transfer",
    CUSTOM = "custom"
}
/**
 * Action Result - Outcome of executed action
 */
interface ActionResult {
    actionId: string;
    success: boolean;
    timestamp: number;
    txHash?: string;
    receipt?: any;
    error?: string;
    actualOutcome: {
        reputationChange: bigint;
        balanceChange: bigint;
        gasUsed: bigint;
    };
}
/**
 * Experience - Recorded decision-making episode
 */
interface Experience {
    id: string;
    timestamp: number;
    context: Context;
    decision: Decision;
    actions: ActionResult[];
    outcome: {
        success: boolean;
        reputationChange: bigint;
        balanceChange: bigint;
        lessonsLearned: string[];
    };
}
/**
 * OODA Loop Configuration
 */
interface OODAConfig {
    observationInterval: number;
    maxObservations: number;
    contextWindow: number;
    minConfidence: number;
    maxAlternatives: number;
    decisionTimeout: number;
    maxActionsPerCycle: number;
    requireConfirmation: boolean;
    recordExperiences: boolean;
}
declare const DEFAULT_OODA_CONFIG: OODAConfig;

/**
 * OODA Loop - Observe-Orient-Decide-Act implementation
 */

/**
 * Main OODA Loop implementation
 */
declare class OODALoop {
    private config;
    private eventEmitter;
    private logger;
    private client;
    private running;
    private observationBuffer;
    private experiences;
    private currentContext?;
    private currentDecision?;
    private blockchainObserver?;
    private governanceObserver?;
    private taskObserver?;
    constructor(client: HavenClient, eventEmitter: EventEmitter, logger: Logger, config?: Partial<OODAConfig>);
    /**
     * Start the OODA loop
     */
    start(): Promise<void>;
    /**
     * Stop the OODA loop
     */
    stop(): Promise<void>;
    /**
     * Get current status
     */
    getStatus(): {
        running: boolean;
        observations: number;
        experiences: number;
        currentContext?: Context;
        currentDecision?: Decision;
    };
    /**
     * Run one complete OODA cycle
     */
    private runCycle;
    /**
     * Gather observations from all sources
     */
    observe(): Promise<Observation[]>;
    private observeBlockchain;
    private observeGovernance;
    private observeTasks;
    /**
     * Analyze observations and build context
     */
    orient(observations: Observation[]): Promise<Context>;
    private analyzeSituation;
    private identifyOpportunities;
    private identifyConstraints;
    /**
     * Make decision based on context
     */
    decide(context: Context): Promise<Decision>;
    private generateAlternatives;
    private selectAlternative;
    private generateActions;
    private calculateExpectedOutcomes;
    private generateAnalysis;
    /**
     * Execute decision actions
     */
    act(decision: Decision): Promise<ActionResult[]>;
    private executeAction;
    /**
     * Record experience for learning
     */
    private recordExperience;
    private extractLessons;
    private getRecentObservations;
    private getAgentState;
    private findRelevantExperiences;
    private assessNetworkCongestion;
    private calculateProposalUrgency;
    private assessTaskDifficulty;
    private estimateTaskCompetition;
    private calculateTaskValueScore;
    private getActiveProposals;
    private getOpenTasks;
    private getVoteDistribution;
}
interface BlockchainObservation extends Observation {
    type: ObservationType.BLOCKCHAIN;
    data: {
        blockNumber: bigint;
        gasPrice: bigint;
        networkCongestion: 'low' | 'medium' | 'high';
    };
}
interface GovernanceObservation extends Observation {
    type: ObservationType.GOVERNANCE;
    data: {
        proposal: ProposalInfo;
        timeRemaining: bigint;
        currentQuorum: bigint;
        voteDistribution: {
            for: bigint;
            against: bigint;
            abstain: bigint;
        };
    };
}
interface TaskObservation extends Observation {
    type: ObservationType.TASK;
    data: {
        task: TaskInfo;
        competition: number;
        estimatedDifficulty: 'easy' | 'medium' | 'hard';
        expectedReward: bigint;
    };
}

/**
 * ReasoningEngine - Advanced reasoning with OODA loop and analysis
 */

interface ReasoningConfig extends Partial<OODAConfig> {
    enableGovernanceAnalysis: boolean;
    enableTaskAnalysis: boolean;
    enableLearning: boolean;
    minConfidenceForAction: number;
}
declare const DEFAULT_REASONING_CONFIG: ReasoningConfig;
interface GovernanceAnalysis {
    proposal: ProposalInfo;
    impactScore: number;
    recommendation: 'for' | 'against' | 'abstain';
    confidence: number;
    reasoning: string;
    risks: string[];
    benefits: string[];
}
interface TaskAnalysis {
    task: TaskInfo;
    valueScore: number;
    recommendation: 'accept' | 'decline';
    confidence: number;
    estimatedROI: number;
    risks: string[];
    requiredCapabilities: string[];
}
/**
 * ReasoningEngine provides advanced AI-powered decision making
 */
declare class ReasoningEngine {
    private config;
    private eventEmitter;
    private logger;
    private client;
    private oodaLoop;
    private running;
    private proposalCache;
    private taskCache;
    constructor(client: HavenClient, eventEmitter: EventEmitter, logger: Logger, config?: Partial<ReasoningConfig>);
    /**
     * Start the reasoning engine
     */
    start(): Promise<void>;
    /**
     * Stop the reasoning engine
     */
    stop(): Promise<void>;
    /**
     * Get engine status
     */
    getStatus(): {
        running: boolean;
        ooda: ReturnType<OODALoop['getStatus']>;
        proposalCache: number;
        taskCache: number;
    };
    /**
     * Analyze a governance proposal
     */
    analyzeProposal(proposal: ProposalInfo): Promise<GovernanceAnalysis>;
    private calculateProposalImpact;
    private identifyProposalRisks;
    private identifyProposalBenefits;
    private generateProposalRecommendation;
    private calculateConfidence;
    private generateProposalReasoning;
    /**
     * Analyze a task opportunity
     */
    analyzeTask(task: TaskInfo, agentCapabilities: string[]): Promise<TaskAnalysis>;
    private calculateTaskValue;
    private calculateTaskROI;
    private identifyTaskRisks;
    private extractRequiredCapabilities;
    private checkCapabilityMatch;
    private generateTaskRecommendation;
    private calculateTaskConfidence;
    /**
     * Get current decision context
     */
    getCurrentContext(): Context | undefined;
    /**
     * Get latest decision
     */
    getCurrentDecision(): Decision | undefined;
    /**
     * Get recent experiences
     */
    getRecentExperiences(_limit?: number): Experience[];
    /**
     * Clear analysis caches
     */
    clearCache(): void;
    /**
     * Get reasoning metrics
     */
    getMetrics(): {
        totalDecisions: number;
        averageConfidence: number;
        successRate: number;
        averageCycleTime: number;
    };
}

export { type Action, type ActionResult, ActionType, type Alternative, type BlockchainObservation, type Context, DEFAULT_OODA_CONFIG, DEFAULT_REASONING_CONFIG, type Decision, type Experience, type GovernanceAnalysis, type GovernanceObservation, type OODAConfig, OODALoop, type Observation, ObservationType, type Opportunity, type ReasoningConfig, ReasoningEngine, type TaskAnalysis, type TaskObservation };
