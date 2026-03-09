import { z } from 'zod';

/**
 * Internal Event Emitter
 */
interface ProposalEvent {
    proposalId: bigint;
    proposer: string;
    description: string;
    targets: string[];
    calldatas: string[];
    startBlock: bigint;
    endBlock: bigint;
}
interface VoteEvent {
    proposalId: bigint;
    voter: string;
    support: number;
    votingPower: bigint;
    reason?: string;
}
interface TaskEvent {
    taskId: bigint;
    creator: string;
    description: string;
    requiredCapability: string;
    reward: bigint;
    rewardToken: string;
    deadline: bigint;
}
interface TransactionEvent {
    hash: string;
    nonce?: number;
    target?: string;
    submittedAt?: number;
    blockNumber?: bigint;
    gasUsed?: bigint;
    status?: 'pending' | 'confirmed' | 'failed' | 'reverted';
    error?: string;
}
interface AgentEvents {
    'runtime:started': () => void;
    'runtime:stopped': () => void;
    'runtime:error': (error: Error) => void;
    'runtime:state-change': (oldState: string, newState: string) => void;
    'governance:proposal': (proposal: ProposalEvent) => void;
    'governance:vote': (vote: VoteEvent) => void;
    'task:created': (task: TaskEvent) => void;
    'task:accepted': (task: TaskEvent) => void;
    'task:completed': (task: TaskEvent) => void;
    'task:reward-claimed': (task: TaskEvent) => void;
    'transaction:submitted': (tx: TransactionEvent) => void;
    'transaction:confirmed': (tx: TransactionEvent) => void;
    'transaction:failed': (tx: TransactionEvent) => void;
    'custom:*': (data: any) => void;
}
declare class EventEmitter {
    private emitter;
    constructor();
    on<K extends keyof AgentEvents>(event: K, listener: AgentEvents[K]): this;
    once<K extends keyof AgentEvents>(event: K, listener: AgentEvents[K]): this;
    off<K extends keyof AgentEvents>(event: K, listener: AgentEvents[K]): this;
    emit<K extends keyof AgentEvents>(event: K, ...args: Parameters<AgentEvents[K]>): boolean;
    removeAllListeners(event?: keyof AgentEvents): this;
    listenerCount(event: keyof AgentEvents): number;
}

/**
 * Agent State Management
 */
declare enum AgentState {
    Stopped = "stopped",
    Starting = "starting",
    Running = "running",
    Stopping = "stopping",
    Error = "error"
}
interface AgentStatus {
    state: AgentState;
    uptime: number;
    lastError?: string;
    metrics: AgentMetrics;
}
interface AgentMetrics {
    transactionsSubmitted: number;
    transactionsConfirmed: number;
    transactionsFailed: number;
    proposalsVoted: number;
    tasksCompleted: number;
    reputationEarned: bigint;
    gasSpent: bigint;
}
declare function createInitialMetrics(): AgentMetrics;

/**
 * Agent Runtime Configuration Schema
 */

declare const NetworkConfigSchema: z.ZodObject<{
    chainId: z.ZodNumber;
    rpcUrl: z.ZodString;
    wsUrl: z.ZodOptional<z.ZodString>;
    explorerUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    chainId: number;
    rpcUrl: string;
    wsUrl?: string | undefined;
    explorerUrl?: string | undefined;
}, {
    chainId: number;
    rpcUrl: string;
    wsUrl?: string | undefined;
    explorerUrl?: string | undefined;
}>;
declare const IdentityConfigSchema: z.ZodObject<{
    operatorPrivateKey: z.ZodString;
    erc8004TokenId: z.ZodOptional<z.ZodBigInt>;
    tbaAddress: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    operatorPrivateKey: string;
    erc8004TokenId?: bigint | undefined;
    tbaAddress?: string | undefined;
}, {
    operatorPrivateKey: string;
    erc8004TokenId?: bigint | undefined;
    tbaAddress?: string | undefined;
}>;
declare const ContractAddressesSchema: z.ZodObject<{
    agentRegistry: z.ZodString;
    agentReputation: z.ZodString;
    havenGovernance: z.ZodString;
    taskMarketplace: z.ZodString;
    havenToken: z.ZodString;
    erc8004Registry: z.ZodOptional<z.ZodString>;
    erc6551Registry: z.ZodOptional<z.ZodString>;
    gat: z.ZodOptional<z.ZodString>;
    escrow: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    agentRegistry: string;
    agentReputation: string;
    havenGovernance: string;
    taskMarketplace: string;
    havenToken: string;
    erc8004Registry?: string | undefined;
    erc6551Registry?: string | undefined;
    gat?: string | undefined;
    escrow?: string | undefined;
}, {
    agentRegistry: string;
    agentReputation: string;
    havenGovernance: string;
    taskMarketplace: string;
    havenToken: string;
    erc8004Registry?: string | undefined;
    erc6551Registry?: string | undefined;
    gat?: string | undefined;
    escrow?: string | undefined;
}>;
declare const DecisionConfigSchema: z.ZodObject<{
    pollingInterval: z.ZodDefault<z.ZodNumber>;
    maxGasPrice: z.ZodOptional<z.ZodBigInt>;
    autoVote: z.ZodDefault<z.ZodBoolean>;
    autoAcceptTasks: z.ZodDefault<z.ZodBoolean>;
    minTaskReward: z.ZodDefault<z.ZodBigInt>;
    votingRules: z.ZodDefault<z.ZodObject<{
        minQuorum: z.ZodDefault<z.ZodBigInt>;
        maxAgainstRatio: z.ZodDefault<z.ZodNumber>;
        trustedProposers: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        minQuorum: bigint;
        maxAgainstRatio: number;
        trustedProposers: string[];
    }, {
        minQuorum?: bigint | undefined;
        maxAgainstRatio?: number | undefined;
        trustedProposers?: string[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    pollingInterval: number;
    autoVote: boolean;
    autoAcceptTasks: boolean;
    minTaskReward: bigint;
    votingRules: {
        minQuorum: bigint;
        maxAgainstRatio: number;
        trustedProposers: string[];
    };
    maxGasPrice?: bigint | undefined;
}, {
    pollingInterval?: number | undefined;
    maxGasPrice?: bigint | undefined;
    autoVote?: boolean | undefined;
    autoAcceptTasks?: boolean | undefined;
    minTaskReward?: bigint | undefined;
    votingRules?: {
        minQuorum?: bigint | undefined;
        maxAgainstRatio?: number | undefined;
        trustedProposers?: string[] | undefined;
    } | undefined;
}>;
declare const LoggingConfigSchema: z.ZodObject<{
    level: z.ZodDefault<z.ZodEnum<["debug", "info", "warn", "error"]>>;
    format: z.ZodDefault<z.ZodEnum<["json", "text"]>>;
}, "strip", z.ZodTypeAny, {
    level: "error" | "debug" | "info" | "warn";
    format: "json" | "text";
}, {
    level?: "error" | "debug" | "info" | "warn" | undefined;
    format?: "json" | "text" | undefined;
}>;
declare const AgentConfigSchema: z.ZodObject<{
    agentId: z.ZodString;
    identity: z.ZodObject<{
        operatorPrivateKey: z.ZodString;
        erc8004TokenId: z.ZodOptional<z.ZodBigInt>;
        tbaAddress: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        operatorPrivateKey: string;
        erc8004TokenId?: bigint | undefined;
        tbaAddress?: string | undefined;
    }, {
        operatorPrivateKey: string;
        erc8004TokenId?: bigint | undefined;
        tbaAddress?: string | undefined;
    }>;
    network: z.ZodObject<{
        chainId: z.ZodNumber;
        rpcUrl: z.ZodString;
        wsUrl: z.ZodOptional<z.ZodString>;
        explorerUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        chainId: number;
        rpcUrl: string;
        wsUrl?: string | undefined;
        explorerUrl?: string | undefined;
    }, {
        chainId: number;
        rpcUrl: string;
        wsUrl?: string | undefined;
        explorerUrl?: string | undefined;
    }>;
    contracts: z.ZodObject<{
        agentRegistry: z.ZodString;
        agentReputation: z.ZodString;
        havenGovernance: z.ZodString;
        taskMarketplace: z.ZodString;
        havenToken: z.ZodString;
        erc8004Registry: z.ZodOptional<z.ZodString>;
        erc6551Registry: z.ZodOptional<z.ZodString>;
        gat: z.ZodOptional<z.ZodString>;
        escrow: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        agentRegistry: string;
        agentReputation: string;
        havenGovernance: string;
        taskMarketplace: string;
        havenToken: string;
        erc8004Registry?: string | undefined;
        erc6551Registry?: string | undefined;
        gat?: string | undefined;
        escrow?: string | undefined;
    }, {
        agentRegistry: string;
        agentReputation: string;
        havenGovernance: string;
        taskMarketplace: string;
        havenToken: string;
        erc8004Registry?: string | undefined;
        erc6551Registry?: string | undefined;
        gat?: string | undefined;
        escrow?: string | undefined;
    }>;
    decision: z.ZodObject<{
        pollingInterval: z.ZodDefault<z.ZodNumber>;
        maxGasPrice: z.ZodOptional<z.ZodBigInt>;
        autoVote: z.ZodDefault<z.ZodBoolean>;
        autoAcceptTasks: z.ZodDefault<z.ZodBoolean>;
        minTaskReward: z.ZodDefault<z.ZodBigInt>;
        votingRules: z.ZodDefault<z.ZodObject<{
            minQuorum: z.ZodDefault<z.ZodBigInt>;
            maxAgainstRatio: z.ZodDefault<z.ZodNumber>;
            trustedProposers: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            minQuorum: bigint;
            maxAgainstRatio: number;
            trustedProposers: string[];
        }, {
            minQuorum?: bigint | undefined;
            maxAgainstRatio?: number | undefined;
            trustedProposers?: string[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        pollingInterval: number;
        autoVote: boolean;
        autoAcceptTasks: boolean;
        minTaskReward: bigint;
        votingRules: {
            minQuorum: bigint;
            maxAgainstRatio: number;
            trustedProposers: string[];
        };
        maxGasPrice?: bigint | undefined;
    }, {
        pollingInterval?: number | undefined;
        maxGasPrice?: bigint | undefined;
        autoVote?: boolean | undefined;
        autoAcceptTasks?: boolean | undefined;
        minTaskReward?: bigint | undefined;
        votingRules?: {
            minQuorum?: bigint | undefined;
            maxAgainstRatio?: number | undefined;
            trustedProposers?: string[] | undefined;
        } | undefined;
    }>;
    logging: z.ZodObject<{
        level: z.ZodDefault<z.ZodEnum<["debug", "info", "warn", "error"]>>;
        format: z.ZodDefault<z.ZodEnum<["json", "text"]>>;
    }, "strip", z.ZodTypeAny, {
        level: "error" | "debug" | "info" | "warn";
        format: "json" | "text";
    }, {
        level?: "error" | "debug" | "info" | "warn" | undefined;
        format?: "json" | "text" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    agentId: string;
    identity: {
        operatorPrivateKey: string;
        erc8004TokenId?: bigint | undefined;
        tbaAddress?: string | undefined;
    };
    network: {
        chainId: number;
        rpcUrl: string;
        wsUrl?: string | undefined;
        explorerUrl?: string | undefined;
    };
    contracts: {
        agentRegistry: string;
        agentReputation: string;
        havenGovernance: string;
        taskMarketplace: string;
        havenToken: string;
        erc8004Registry?: string | undefined;
        erc6551Registry?: string | undefined;
        gat?: string | undefined;
        escrow?: string | undefined;
    };
    decision: {
        pollingInterval: number;
        autoVote: boolean;
        autoAcceptTasks: boolean;
        minTaskReward: bigint;
        votingRules: {
            minQuorum: bigint;
            maxAgainstRatio: number;
            trustedProposers: string[];
        };
        maxGasPrice?: bigint | undefined;
    };
    logging: {
        level: "error" | "debug" | "info" | "warn";
        format: "json" | "text";
    };
}, {
    agentId: string;
    identity: {
        operatorPrivateKey: string;
        erc8004TokenId?: bigint | undefined;
        tbaAddress?: string | undefined;
    };
    network: {
        chainId: number;
        rpcUrl: string;
        wsUrl?: string | undefined;
        explorerUrl?: string | undefined;
    };
    contracts: {
        agentRegistry: string;
        agentReputation: string;
        havenGovernance: string;
        taskMarketplace: string;
        havenToken: string;
        erc8004Registry?: string | undefined;
        erc6551Registry?: string | undefined;
        gat?: string | undefined;
        escrow?: string | undefined;
    };
    decision: {
        pollingInterval?: number | undefined;
        maxGasPrice?: bigint | undefined;
        autoVote?: boolean | undefined;
        autoAcceptTasks?: boolean | undefined;
        minTaskReward?: bigint | undefined;
        votingRules?: {
            minQuorum?: bigint | undefined;
            maxAgainstRatio?: number | undefined;
            trustedProposers?: string[] | undefined;
        } | undefined;
    };
    logging: {
        level?: "error" | "debug" | "info" | "warn" | undefined;
        format?: "json" | "text" | undefined;
    };
}>;
type AgentConfig = z.infer<typeof AgentConfigSchema>;
type NetworkConfig = z.infer<typeof NetworkConfigSchema>;
type IdentityConfig = z.infer<typeof IdentityConfigSchema>;
type ContractAddresses = z.infer<typeof ContractAddressesSchema>;
type DecisionConfig = z.infer<typeof DecisionConfigSchema>;
type LoggingConfig = z.infer<typeof LoggingConfigSchema>;
/**
 * Validate and load agent configuration
 */
declare function loadConfig(config: unknown): AgentConfig;
declare function loadConfigSafe(config: unknown): AgentConfig | null;

/**
 * Agent Runtime - Core orchestration for autonomous agent
 */

interface RuntimeComponent {
    name: string;
    start?: () => Promise<void>;
    stop?: () => Promise<void>;
    healthCheck?: () => Promise<boolean>;
}
declare class AgentRuntime {
    private config;
    private state;
    private eventEmitter;
    private components;
    private startTime;
    private metrics;
    constructor(config: AgentConfig);
    /**
     * Get the event emitter for subscribing to agent events
     */
    get events(): EventEmitter;
    /**
     * Get the agent configuration
     */
    getConfig(): AgentConfig;
    /**
     * Get current agent status
     */
    getStatus(): AgentStatus;
    /**
     * Register a runtime component
     */
    registerComponent(component: RuntimeComponent): void;
    /**
     * Start the agent runtime
     */
    start(): Promise<void>;
    /**
     * Stop the agent runtime
     */
    stop(): Promise<void>;
    /**
     * Perform health check on all components
     */
    healthCheck(): Promise<boolean>;
    /**
     * Update metrics
     */
    updateMetrics(updates: Partial<ReturnType<typeof createInitialMetrics>>): void;
    private setState;
}

export { type AgentConfig, type AgentEvents, type AgentMetrics, AgentRuntime, AgentState, type AgentStatus, type ContractAddresses, type DecisionConfig, EventEmitter, type IdentityConfig, type LoggingConfig, type NetworkConfig, type ProposalEvent, type TaskEvent, type TransactionEvent, type VoteEvent, loadConfig, loadConfigSafe };
