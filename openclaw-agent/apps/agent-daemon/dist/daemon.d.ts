import { z } from 'zod';

/**
 * Agent Daemon Configuration
 *
 * Supports Phase 1 (rule-based) and Phase 2-3 (AI-powered) components
 */

declare const AgentDaemonConfigSchema: z.ZodObject<{
    agentId: z.ZodString;
    agentName: z.ZodOptional<z.ZodString>;
    operatorPrivateKey: z.ZodString;
    network: z.ZodObject<{
        chainId: z.ZodDefault<z.ZodNumber>;
        rpcUrl: z.ZodString;
        wsUrl: z.ZodOptional<z.ZodString>;
        explorerUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        chainId: number;
        rpcUrl: string;
        wsUrl?: string | undefined;
        explorerUrl?: string | undefined;
    }, {
        rpcUrl: string;
        chainId?: number | undefined;
        wsUrl?: string | undefined;
        explorerUrl?: string | undefined;
    }>;
    contracts: z.ZodObject<{
        erc8004Registry: z.ZodString;
        agentRegistry: z.ZodString;
        agentReputation: z.ZodString;
        havenGovernance: z.ZodString;
        havenToken: z.ZodString;
        taskMarketplace: z.ZodString;
        gat: z.ZodOptional<z.ZodString>;
        escrow: z.ZodOptional<z.ZodString>;
        paymentProtocol: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        erc8004Registry: string;
        agentRegistry: string;
        agentReputation: string;
        havenGovernance: string;
        havenToken: string;
        taskMarketplace: string;
        gat?: string | undefined;
        escrow?: string | undefined;
        paymentProtocol?: string | undefined;
    }, {
        erc8004Registry: string;
        agentRegistry: string;
        agentReputation: string;
        havenGovernance: string;
        havenToken: string;
        taskMarketplace: string;
        gat?: string | undefined;
        escrow?: string | undefined;
        paymentProtocol?: string | undefined;
    }>;
    decision: z.ZodDefault<z.ZodObject<{
        autoVote: z.ZodDefault<z.ZodBoolean>;
        autoAcceptTasks: z.ZodDefault<z.ZodBoolean>;
        minTaskReward: z.ZodDefault<z.ZodString>;
        votingRules: z.ZodDefault<z.ZodObject<{
            minQuorum: z.ZodDefault<z.ZodString>;
            maxAgainstRatio: z.ZodDefault<z.ZodNumber>;
            trustedProposers: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            minQuorum: string;
            maxAgainstRatio: number;
            trustedProposers: string[];
        }, {
            minQuorum?: string | undefined;
            maxAgainstRatio?: number | undefined;
            trustedProposers?: string[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        autoVote: boolean;
        autoAcceptTasks: boolean;
        minTaskReward: string;
        votingRules: {
            minQuorum: string;
            maxAgainstRatio: number;
            trustedProposers: string[];
        };
    }, {
        autoVote?: boolean | undefined;
        autoAcceptTasks?: boolean | undefined;
        minTaskReward?: string | undefined;
        votingRules?: {
            minQuorum?: string | undefined;
            maxAgainstRatio?: number | undefined;
            trustedProposers?: string[] | undefined;
        } | undefined;
    }>>;
    reasoning: z.ZodDefault<z.ZodObject<{
        observationInterval: z.ZodDefault<z.ZodNumber>;
        minConfidenceForAction: z.ZodDefault<z.ZodNumber>;
        maxObservations: z.ZodDefault<z.ZodNumber>;
        contextWindow: z.ZodDefault<z.ZodNumber>;
        enableGovernanceAnalysis: z.ZodDefault<z.ZodBoolean>;
        enableTaskAnalysis: z.ZodDefault<z.ZodBoolean>;
        enableLearning: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        observationInterval: number;
        minConfidenceForAction: number;
        maxObservations: number;
        contextWindow: number;
        enableGovernanceAnalysis: boolean;
        enableTaskAnalysis: boolean;
        enableLearning: boolean;
    }, {
        observationInterval?: number | undefined;
        minConfidenceForAction?: number | undefined;
        maxObservations?: number | undefined;
        contextWindow?: number | undefined;
        enableGovernanceAnalysis?: boolean | undefined;
        enableTaskAnalysis?: boolean | undefined;
        enableLearning?: boolean | undefined;
    }>>;
    memory: z.ZodDefault<z.ZodObject<{
        workingMemoryCapacity: z.ZodDefault<z.ZodNumber>;
        longTermMemoryLimit: z.ZodDefault<z.ZodNumber>;
        forgettingCurve: z.ZodDefault<z.ZodEnum<["exponential", "linear"]>>;
        decayRate: z.ZodDefault<z.ZodNumber>;
        minRetentionThreshold: z.ZodDefault<z.ZodNumber>;
        defaultSearchLimit: z.ZodDefault<z.ZodNumber>;
        minSimilarityScore: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        workingMemoryCapacity: number;
        longTermMemoryLimit: number;
        forgettingCurve: "exponential" | "linear";
        decayRate: number;
        minRetentionThreshold: number;
        defaultSearchLimit: number;
        minSimilarityScore: number;
    }, {
        workingMemoryCapacity?: number | undefined;
        longTermMemoryLimit?: number | undefined;
        forgettingCurve?: "exponential" | "linear" | undefined;
        decayRate?: number | undefined;
        minRetentionThreshold?: number | undefined;
        defaultSearchLimit?: number | undefined;
        minSimilarityScore?: number | undefined;
    }>>;
    learning: z.ZodDefault<z.ZodObject<{
        maxExperiences: z.ZodDefault<z.ZodNumber>;
        minConfidenceForLesson: z.ZodDefault<z.ZodNumber>;
        autoUpdateModel: z.ZodDefault<z.ZodBoolean>;
        metricsWindow: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        maxExperiences: number;
        minConfidenceForLesson: number;
        autoUpdateModel: boolean;
        metricsWindow: number;
    }, {
        maxExperiences?: number | undefined;
        minConfidenceForLesson?: number | undefined;
        autoUpdateModel?: boolean | undefined;
        metricsWindow?: number | undefined;
    }>>;
    governance: z.ZodDefault<z.ZodObject<{
        protocolImpactWeight: z.ZodDefault<z.ZodNumber>;
        communityImpactWeight: z.ZodDefault<z.ZodNumber>;
        technicalImpactWeight: z.ZodDefault<z.ZodNumber>;
        economicImpactWeight: z.ZodDefault<z.ZodNumber>;
        highRiskThreshold: z.ZodDefault<z.ZodNumber>;
        criticalRiskThreshold: z.ZodDefault<z.ZodNumber>;
        recommendForThreshold: z.ZodDefault<z.ZodNumber>;
        recommendAgainstThreshold: z.ZodDefault<z.ZodNumber>;
        simulationSamples: z.ZodDefault<z.ZodNumber>;
        trustedProposers: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        trustedProposers: string[];
        protocolImpactWeight: number;
        communityImpactWeight: number;
        technicalImpactWeight: number;
        economicImpactWeight: number;
        highRiskThreshold: number;
        criticalRiskThreshold: number;
        recommendForThreshold: number;
        recommendAgainstThreshold: number;
        simulationSamples: number;
    }, {
        trustedProposers?: string[] | undefined;
        protocolImpactWeight?: number | undefined;
        communityImpactWeight?: number | undefined;
        technicalImpactWeight?: number | undefined;
        economicImpactWeight?: number | undefined;
        highRiskThreshold?: number | undefined;
        criticalRiskThreshold?: number | undefined;
        recommendForThreshold?: number | undefined;
        recommendAgainstThreshold?: number | undefined;
        simulationSamples?: number | undefined;
    }>>;
    llm: z.ZodDefault<z.ZodObject<{
        provider: z.ZodDefault<z.ZodEnum<["openai", "anthropic", "google", "local"]>>;
        apiKey: z.ZodOptional<z.ZodString>;
        model: z.ZodDefault<z.ZodString>;
        baseUrl: z.ZodOptional<z.ZodString>;
        defaultTemperature: z.ZodDefault<z.ZodNumber>;
        defaultMaxTokens: z.ZodDefault<z.ZodNumber>;
        timeout: z.ZodDefault<z.ZodNumber>;
        maxRetries: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        provider: "openai" | "anthropic" | "google" | "local";
        model: string;
        defaultTemperature: number;
        defaultMaxTokens: number;
        timeout: number;
        maxRetries: number;
        apiKey?: string | undefined;
        baseUrl?: string | undefined;
    }, {
        provider?: "openai" | "anthropic" | "google" | "local" | undefined;
        apiKey?: string | undefined;
        model?: string | undefined;
        baseUrl?: string | undefined;
        defaultTemperature?: number | undefined;
        defaultMaxTokens?: number | undefined;
        timeout?: number | undefined;
        maxRetries?: number | undefined;
    }>>;
    vector: z.ZodDefault<z.ZodObject<{
        dimensions: z.ZodDefault<z.ZodNumber>;
        similarityMetric: z.ZodDefault<z.ZodEnum<["cosine", "dotproduct", "euclidean"]>>;
        maxItems: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        dimensions: number;
        similarityMetric: "cosine" | "dotproduct" | "euclidean";
        maxItems: number;
    }, {
        dimensions?: number | undefined;
        similarityMetric?: "cosine" | "dotproduct" | "euclidean" | undefined;
        maxItems?: number | undefined;
    }>>;
    a2a: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        broadcastEnabled: z.ZodDefault<z.ZodBoolean>;
        trustedAgents: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        discoveryInterval: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        broadcastEnabled: boolean;
        trustedAgents: string[];
        discoveryInterval: number;
    }, {
        enabled?: boolean | undefined;
        broadcastEnabled?: boolean | undefined;
        trustedAgents?: string[] | undefined;
        discoveryInterval?: number | undefined;
    }>>;
    transactions: z.ZodDefault<z.ZodObject<{
        maxFeePerGas: z.ZodOptional<z.ZodString>;
        maxPriorityFeePerGas: z.ZodOptional<z.ZodString>;
        gasPriceBufferPercent: z.ZodDefault<z.ZodNumber>;
        confirmationsRequired: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        gasPriceBufferPercent: number;
        confirmationsRequired: number;
        maxFeePerGas?: string | undefined;
        maxPriorityFeePerGas?: string | undefined;
    }, {
        maxFeePerGas?: string | undefined;
        maxPriorityFeePerGas?: string | undefined;
        gasPriceBufferPercent?: number | undefined;
        confirmationsRequired?: number | undefined;
    }>>;
    logging: z.ZodDefault<z.ZodObject<{
        level: z.ZodDefault<z.ZodEnum<["debug", "info", "warn", "error"]>>;
        format: z.ZodDefault<z.ZodEnum<["json", "text"]>>;
        file: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        level: "debug" | "info" | "warn" | "error";
        format: "json" | "text";
        file?: string | undefined;
    }, {
        level?: "debug" | "info" | "warn" | "error" | undefined;
        format?: "json" | "text" | undefined;
        file?: string | undefined;
    }>>;
    identity: z.ZodOptional<z.ZodObject<{
        erc8004TokenId: z.ZodOptional<z.ZodString>;
        agentAddress: z.ZodOptional<z.ZodString>;
        metadataUri: z.ZodOptional<z.ZodString>;
        capabilities: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        capabilities: string[];
        erc8004TokenId?: string | undefined;
        agentAddress?: string | undefined;
        metadataUri?: string | undefined;
    }, {
        erc8004TokenId?: string | undefined;
        agentAddress?: string | undefined;
        metadataUri?: string | undefined;
        capabilities?: string[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    agentId: string;
    operatorPrivateKey: string;
    network: {
        chainId: number;
        rpcUrl: string;
        wsUrl?: string | undefined;
        explorerUrl?: string | undefined;
    };
    contracts: {
        erc8004Registry: string;
        agentRegistry: string;
        agentReputation: string;
        havenGovernance: string;
        havenToken: string;
        taskMarketplace: string;
        gat?: string | undefined;
        escrow?: string | undefined;
        paymentProtocol?: string | undefined;
    };
    decision: {
        autoVote: boolean;
        autoAcceptTasks: boolean;
        minTaskReward: string;
        votingRules: {
            minQuorum: string;
            maxAgainstRatio: number;
            trustedProposers: string[];
        };
    };
    reasoning: {
        observationInterval: number;
        minConfidenceForAction: number;
        maxObservations: number;
        contextWindow: number;
        enableGovernanceAnalysis: boolean;
        enableTaskAnalysis: boolean;
        enableLearning: boolean;
    };
    memory: {
        workingMemoryCapacity: number;
        longTermMemoryLimit: number;
        forgettingCurve: "exponential" | "linear";
        decayRate: number;
        minRetentionThreshold: number;
        defaultSearchLimit: number;
        minSimilarityScore: number;
    };
    learning: {
        maxExperiences: number;
        minConfidenceForLesson: number;
        autoUpdateModel: boolean;
        metricsWindow: number;
    };
    governance: {
        trustedProposers: string[];
        protocolImpactWeight: number;
        communityImpactWeight: number;
        technicalImpactWeight: number;
        economicImpactWeight: number;
        highRiskThreshold: number;
        criticalRiskThreshold: number;
        recommendForThreshold: number;
        recommendAgainstThreshold: number;
        simulationSamples: number;
    };
    llm: {
        provider: "openai" | "anthropic" | "google" | "local";
        model: string;
        defaultTemperature: number;
        defaultMaxTokens: number;
        timeout: number;
        maxRetries: number;
        apiKey?: string | undefined;
        baseUrl?: string | undefined;
    };
    vector: {
        dimensions: number;
        similarityMetric: "cosine" | "dotproduct" | "euclidean";
        maxItems: number;
    };
    a2a: {
        enabled: boolean;
        broadcastEnabled: boolean;
        trustedAgents: string[];
        discoveryInterval: number;
    };
    transactions: {
        gasPriceBufferPercent: number;
        confirmationsRequired: number;
        maxFeePerGas?: string | undefined;
        maxPriorityFeePerGas?: string | undefined;
    };
    logging: {
        level: "debug" | "info" | "warn" | "error";
        format: "json" | "text";
        file?: string | undefined;
    };
    agentName?: string | undefined;
    identity?: {
        capabilities: string[];
        erc8004TokenId?: string | undefined;
        agentAddress?: string | undefined;
        metadataUri?: string | undefined;
    } | undefined;
}, {
    agentId: string;
    operatorPrivateKey: string;
    network: {
        rpcUrl: string;
        chainId?: number | undefined;
        wsUrl?: string | undefined;
        explorerUrl?: string | undefined;
    };
    contracts: {
        erc8004Registry: string;
        agentRegistry: string;
        agentReputation: string;
        havenGovernance: string;
        havenToken: string;
        taskMarketplace: string;
        gat?: string | undefined;
        escrow?: string | undefined;
        paymentProtocol?: string | undefined;
    };
    agentName?: string | undefined;
    decision?: {
        autoVote?: boolean | undefined;
        autoAcceptTasks?: boolean | undefined;
        minTaskReward?: string | undefined;
        votingRules?: {
            minQuorum?: string | undefined;
            maxAgainstRatio?: number | undefined;
            trustedProposers?: string[] | undefined;
        } | undefined;
    } | undefined;
    reasoning?: {
        observationInterval?: number | undefined;
        minConfidenceForAction?: number | undefined;
        maxObservations?: number | undefined;
        contextWindow?: number | undefined;
        enableGovernanceAnalysis?: boolean | undefined;
        enableTaskAnalysis?: boolean | undefined;
        enableLearning?: boolean | undefined;
    } | undefined;
    memory?: {
        workingMemoryCapacity?: number | undefined;
        longTermMemoryLimit?: number | undefined;
        forgettingCurve?: "exponential" | "linear" | undefined;
        decayRate?: number | undefined;
        minRetentionThreshold?: number | undefined;
        defaultSearchLimit?: number | undefined;
        minSimilarityScore?: number | undefined;
    } | undefined;
    learning?: {
        maxExperiences?: number | undefined;
        minConfidenceForLesson?: number | undefined;
        autoUpdateModel?: boolean | undefined;
        metricsWindow?: number | undefined;
    } | undefined;
    governance?: {
        trustedProposers?: string[] | undefined;
        protocolImpactWeight?: number | undefined;
        communityImpactWeight?: number | undefined;
        technicalImpactWeight?: number | undefined;
        economicImpactWeight?: number | undefined;
        highRiskThreshold?: number | undefined;
        criticalRiskThreshold?: number | undefined;
        recommendForThreshold?: number | undefined;
        recommendAgainstThreshold?: number | undefined;
        simulationSamples?: number | undefined;
    } | undefined;
    llm?: {
        provider?: "openai" | "anthropic" | "google" | "local" | undefined;
        apiKey?: string | undefined;
        model?: string | undefined;
        baseUrl?: string | undefined;
        defaultTemperature?: number | undefined;
        defaultMaxTokens?: number | undefined;
        timeout?: number | undefined;
        maxRetries?: number | undefined;
    } | undefined;
    vector?: {
        dimensions?: number | undefined;
        similarityMetric?: "cosine" | "dotproduct" | "euclidean" | undefined;
        maxItems?: number | undefined;
    } | undefined;
    a2a?: {
        enabled?: boolean | undefined;
        broadcastEnabled?: boolean | undefined;
        trustedAgents?: string[] | undefined;
        discoveryInterval?: number | undefined;
    } | undefined;
    transactions?: {
        maxFeePerGas?: string | undefined;
        maxPriorityFeePerGas?: string | undefined;
        gasPriceBufferPercent?: number | undefined;
        confirmationsRequired?: number | undefined;
    } | undefined;
    logging?: {
        level?: "debug" | "info" | "warn" | "error" | undefined;
        format?: "json" | "text" | undefined;
        file?: string | undefined;
    } | undefined;
    identity?: {
        erc8004TokenId?: string | undefined;
        agentAddress?: string | undefined;
        metadataUri?: string | undefined;
        capabilities?: string[] | undefined;
    } | undefined;
}>;
type AgentDaemonConfig = z.infer<typeof AgentDaemonConfigSchema>;

/**
 * Agent Daemon - Main Entry Point
 *
 * Orchestrates all OpenClaw agent components (Phase 1-3)
 */

interface AgentDaemon {
    start(): Promise<void>;
    stop(): Promise<void>;
    getStatus(): DaemonStatus;
}
interface DaemonStatus {
    running: boolean;
    agentId: string;
    identity?: {
        registered: boolean;
        agentAddress?: string;
        tokenId?: string;
    };
    decision: {
        running: boolean;
        queue: any;
        rules: number;
    };
    reasoning?: {
        running: boolean;
        ooda: any;
        proposalCache: number;
        taskCache: number;
    };
    memory?: {
        workingMemory: number;
        longTermMemory: number;
    };
    learning?: {
        experiences: number;
        lessons: number;
        successRate: number;
    };
    transactions: {
        pending: number;
        confirmed: number;
        failed: number;
    };
}
declare class OpenClawDaemon implements AgentDaemon {
    private config;
    private eventEmitter;
    private logger?;
    private havenClient?;
    private identityManager?;
    private decisionEngine?;
    private contractExecutor?;
    private reasoningEngine?;
    private memorySystem?;
    private learningSystem?;
    private governanceAnalyzer?;
    private running;
    constructor(config: AgentDaemonConfig);
    /**
     * Start the agent daemon
     */
    start(): Promise<void>;
    /**
     * Setup listeners for action execution events
     */
    private setupActionListeners;
    /**
     * Initialize Phase 2 components (AI-powered reasoning)
     */
    private initializePhase2Components;
    /**
     * Setup listeners for reasoning engine events
     */
    private setupReasoningListeners;
    /**
     * Handle action execution from reasoning engine
     */
    private handleActionExecution;
    /**
     * Stop the agent daemon
     */
    stop(): Promise<void>;
    /**
     * Get daemon status
     */
    getStatus(): DaemonStatus;
    /**
     * Print current status
     */
    private printStatus;
    /**
     * Initialize identity (load existing or create new)
     */
    private initializeIdentity;
}
/**
 * Create agent daemon from config
 */
declare function createAgentDaemon(config: AgentDaemonConfig): AgentDaemon;

export { type AgentDaemon, type DaemonStatus, OpenClawDaemon, createAgentDaemon };
