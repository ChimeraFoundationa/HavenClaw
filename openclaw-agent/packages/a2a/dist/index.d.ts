import { Logger } from '@havenclaw/tools';
import { EventEmitter } from '@havenclaw/runtime';

/**
 * A2A (Agent-to-Agent) Communication Types
 */
/**
 * Message types for agent communication
 */
declare enum MessageType {
    DISCOVER = "discover",
    DISCOVER_RESPONSE = "discover_response",
    PROPOSE_COLLABORATION = "propose_collaboration",
    ACCEPT_COLLABORATION = "accept_collaboration",
    REJECT_COLLABORATION = "reject_collaboration",
    TASK_ANNOUNCEMENT = "task_announcement",
    TASK_BID = "task_bid",
    TASK_AWARD = "task_award",
    INFORMATION_SHARE = "information_share",
    INFORMATION_REQUEST = "information_request",
    INFORMATION_RESPONSE = "information_response",
    GOVERNANCE_ALERT = "governance_alert",
    VOTE_COORDINATION = "vote_coordination",
    HEARTBEAT = "heartbeat",
    STATUS_REQUEST = "status_request",
    STATUS_RESPONSE = "status_response"
}
/**
 * Agent identity for A2A communication
 */
interface AgentIdentity {
    agentId: string;
    agentName: string;
    capabilities: string[];
    reputation: bigint;
    endpoint?: string;
    publicKey?: string;
}
/**
 * A2A Message structure
 */
interface A2AMessage {
    id: string;
    type: MessageType;
    from: AgentIdentity;
    to?: AgentIdentity;
    timestamp: number;
    payload: unknown;
    signature?: string;
    ttl: number;
}
/**
 * Collaboration proposal
 */
interface CollaborationProposal {
    proposalId: string;
    initiator: AgentIdentity;
    type: 'task_sharing' | 'voting_pool' | 'information_exchange' | 'joint_execution';
    description: string;
    terms: {
        duration?: number;
        revenueShare?: number;
        responsibilities: string[];
    };
    expiresAt: number;
}
/**
 * Task bid for coordination
 */
interface TaskBid {
    taskId: string;
    bidder: AgentIdentity;
    proposedReward: bigint;
    estimatedCompletionTime: number;
    confidence: number;
    relevantCapabilities: string[];
}
/**
 * Governance coordination message
 */
interface GovernanceAlert {
    proposalId: bigint;
    alertType: 'urgent' | 'important' | 'routine';
    analysis: {
        summary: string;
        recommendation: 'for' | 'against' | 'abstain';
        confidence: number;
        deadline: number;
    };
    coordinationRequest?: {
        action: 'coordinate_vote' | 'share_analysis' | 'pool_resources';
        details: string;
    };
}
/**
 * A2A Communication configuration
 */
interface A2AConfig {
    agentId: string;
    agentName: string;
    capabilities: string[];
    broadcastEnabled: boolean;
    discoveryEndpoint?: string;
    messageEndpoint?: string;
    maxMessageAge: number;
    maxPendingMessages: number;
    defaultTTL: number;
    trustedAgents: string[];
    requireSignature: boolean;
    autoRespondToDiscovery: boolean;
    autoAcceptCollaboration: boolean;
}
declare const DEFAULT_A2A_CONFIG: A2AConfig;
/**
 * Discovery response
 */
interface DiscoveryResponse {
    agent: AgentIdentity;
    status: 'available' | 'busy' | 'offline';
    capabilities: string[];
    reputation: bigint;
    recentCollaborations: number;
}

/**
 * A2ACommunication - Agent-to-Agent communication protocol
 */

/**
 * A2ACommunication handles agent-to-agent messaging and coordination
 */
declare class A2ACommunication {
    private config;
    private logger;
    private eventEmitter;
    private identity;
    private knownAgents;
    private pendingMessages;
    private activeCollaborations;
    private running;
    constructor(logger: Logger, eventEmitter: EventEmitter, config: Partial<A2AConfig>);
    /**
     * Start the A2A communication system
     */
    start(): Promise<void>;
    /**
     * Stop the A2A communication system
     */
    stop(): Promise<void>;
    /**
     * Broadcast discovery message
     */
    broadcastDiscovery(): Promise<void>;
    /**
     * Send a message to a specific agent
     */
    send(to: AgentIdentity, message: A2AMessage): Promise<void>;
    /**
     * Broadcast a message to all known agents
     */
    broadcast(message: A2AMessage): Promise<void>;
    /**
     * Handle incoming message
     */
    handleMessage(message: A2AMessage): Promise<void>;
    /**
     * Propose collaboration to another agent
     */
    proposeCollaboration(to: AgentIdentity, proposal: CollaborationProposal): Promise<void>;
    /**
     * Submit a bid for a task
     */
    submitTaskBid(announcement: A2AMessage, bid: TaskBid): Promise<void>;
    /**
     * Broadcast governance alert
     */
    broadcastGovernanceAlert(alert: GovernanceAlert): Promise<void>;
    /**
     * Get known agents
     */
    getKnownAgents(): AgentIdentity[];
    /**
     * Get active collaborations
     */
    getActiveCollaborations(): CollaborationProposal[];
    /**
     * Get status
     */
    getStatus(): {
        running: boolean;
        knownAgents: number;
        pendingMessages: number;
        activeCollaborations: number;
    };
    private handleDiscovery;
    private handleDiscoveryResponse;
    private handleCollaborationProposal;
    private handleTaskAnnouncement;
    private handleGovernanceAlert;
    private handleHeartbeat;
    private validateMessage;
    private cleanupMessages;
    private heartbeatInterval?;
    private startHeartbeat;
    private stopHeartbeat;
}

export { A2ACommunication, type A2AConfig, type A2AMessage, type AgentIdentity, type CollaborationProposal, DEFAULT_A2A_CONFIG, type DiscoveryResponse, type GovernanceAlert, MessageType, type TaskBid };
