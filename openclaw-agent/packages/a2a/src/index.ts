/**
 * @havenclaw/a2a - Agent-to-Agent communication for OpenClaw agents
 *
 * @packageDocumentation
 */

export {
  // Core
  A2ACommunication,
} from './A2ACommunication.js';
export {
  // Types
  MessageType,
  DEFAULT_A2A_CONFIG,
} from './types.js';
export type {
  A2AConfig,
  AgentIdentity,
  A2AMessage,
  CollaborationProposal,
  TaskBid,
  GovernanceAlert,
  DiscoveryResponse,
} from './types.js';
