/**
 * A2A (Agent-to-Agent) Communication Types
 */

/**
 * Message types for agent communication
 */
export enum MessageType {
  // Discovery
  DISCOVER = 'discover',
  DISCOVER_RESPONSE = 'discover_response',
  
  // Coordination
  PROPOSE_COLLABORATION = 'propose_collaboration',
  ACCEPT_COLLABORATION = 'accept_collaboration',
  REJECT_COLLABORATION = 'reject_collaboration',
  
  // Task coordination
  TASK_ANNOUNCEMENT = 'task_announcement',
  TASK_BID = 'task_bid',
  TASK_AWARD = 'task_award',
  
  // Information sharing
  INFORMATION_SHARE = 'information_share',
  INFORMATION_REQUEST = 'information_request',
  INFORMATION_RESPONSE = 'information_response',
  
  // Governance coordination
  GOVERNANCE_ALERT = 'governance_alert',
  VOTE_COORDINATION = 'vote_coordination',
  
  // Status
  HEARTBEAT = 'heartbeat',
  STATUS_REQUEST = 'status_request',
  STATUS_RESPONSE = 'status_response',
}

/**
 * Agent identity for A2A communication
 */
export interface AgentIdentity {
  agentId: string;
  agentName: string;
  capabilities: string[];
  reputation: bigint;
  endpoint?: string; // For direct communication
  publicKey?: string; // For message verification
}

/**
 * A2A Message structure
 */
export interface A2AMessage {
  id: string;
  type: MessageType;
  from: AgentIdentity;
  to?: AgentIdentity; // Undefined for broadcast
  timestamp: number;
  payload: unknown;
  signature?: string; // Message signature
  ttl: number; // Time to live (seconds)
}

/**
 * Collaboration proposal
 */
export interface CollaborationProposal {
  proposalId: string;
  initiator: AgentIdentity;
  type: 'task_sharing' | 'voting_pool' | 'information_exchange' | 'joint_execution';
  description: string;
  terms: {
    duration?: number; // seconds
    revenueShare?: number; // 0-1
    responsibilities: string[];
  };
  expiresAt: number;
}

/**
 * Task bid for coordination
 */
export interface TaskBid {
  taskId: string;
  bidder: AgentIdentity;
  proposedReward: bigint;
  estimatedCompletionTime: number; // seconds
  confidence: number; // 0-1
  relevantCapabilities: string[];
}

/**
 * Governance coordination message
 */
export interface GovernanceAlert {
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
export interface A2AConfig {
  // Identity
  agentId: string;
  agentName: string;
  capabilities: string[];
  
  // Network
  broadcastEnabled: boolean;
  discoveryEndpoint?: string;
  messageEndpoint?: string;
  
  // Message handling
  maxMessageAge: number; // seconds
  maxPendingMessages: number;
  defaultTTL: number; // seconds
  
  // Trust
  trustedAgents: string[]; // Agent IDs
  requireSignature: boolean;
  
  // Coordination
  autoRespondToDiscovery: boolean;
  autoAcceptCollaboration: boolean;
}

export const DEFAULT_A2A_CONFIG: A2AConfig = {
  agentId: 'unknown',
  agentName: 'Unknown Agent',
  capabilities: [],
  broadcastEnabled: true,
  discoveryEndpoint: undefined,
  messageEndpoint: undefined,
  maxMessageAge: 3600,
  maxPendingMessages: 1000,
  defaultTTL: 300,
  trustedAgents: [],
  requireSignature: false,
  autoRespondToDiscovery: true,
  autoAcceptCollaboration: false,
};

/**
 * Discovery response
 */
export interface DiscoveryResponse {
  agent: AgentIdentity;
  status: 'available' | 'busy' | 'offline';
  capabilities: string[];
  reputation: bigint;
  recentCollaborations: number;
}
