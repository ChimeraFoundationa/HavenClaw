/**
 * A2ACommunication - Agent-to-Agent communication protocol
 */

import { Logger } from '@havenclaw/tools';
import { EventEmitter } from '@havenclaw/runtime';
import {
  A2AConfig,
  DEFAULT_A2A_CONFIG,
  AgentIdentity,
  A2AMessage,
  MessageType,
  CollaborationProposal,
  TaskBid,
  GovernanceAlert,
  DiscoveryResponse,
} from './types.js';

/**
 * A2ACommunication handles agent-to-agent messaging and coordination
 */
export class A2ACommunication {
  private config: A2AConfig;
  private logger: Logger;
  private eventEmitter: EventEmitter;
  private identity: AgentIdentity;

  // State
  private knownAgents: Map<string, AgentIdentity> = new Map();
  private pendingMessages: Map<string, A2AMessage> = new Map();
  private activeCollaborations: Map<string, CollaborationProposal> = new Map();
  private running: boolean = false;

  constructor(
    logger: Logger,
    eventEmitter: EventEmitter,
    config: Partial<A2AConfig>
  ) {
    this.logger = logger.child({ module: 'A2ACommunication' });
    this.eventEmitter = eventEmitter;
    this.config = { ...DEFAULT_A2A_CONFIG, ...config };
    
    this.identity = {
      agentId: this.config.agentId,
      agentName: this.config.agentName,
      capabilities: this.config.capabilities,
      reputation: 0n,
      endpoint: this.config.messageEndpoint,
    };

    this.logger.info('A2A Communication initialized for agent: ' + this.identity.agentId);
  }

  /**
   * Start the A2A communication system
   */
  async start(): Promise<void> {
    if (this.running) {
      return;
    }

    this.logger.info('Starting A2A communication...');
    this.running = true;

    // Start discovery if enabled
    if (this.config.broadcastEnabled) {
      await this.broadcastDiscovery();
    }

    // Start heartbeat
    this.startHeartbeat();

    this.logger.info('A2A communication started');
  }

  /**
   * Stop the A2A communication system
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    this.logger.info('Stopping A2A communication...');
    this.running = false;

    // Stop heartbeat
    this.stopHeartbeat();

    this.logger.info('A2A communication stopped');
  }

  /**
   * Broadcast discovery message
   */
  async broadcastDiscovery(): Promise<void> {
    this.logger.info('Broadcasting discovery message');

    const message: A2AMessage = {
      id: 'msg-' + Date.now().toString(),
      type: MessageType.DISCOVER,
      from: this.identity,
      timestamp: Date.now(),
      payload: {
        capabilities: this.identity.capabilities,
        seekingCollaboration: true,
      },
      ttl: this.config.defaultTTL,
    };

    await this.broadcast(message);
  }

  /**
   * Send a message to a specific agent
   */
  async send(to: AgentIdentity, message: A2AMessage): Promise<void> {
    message.to = to;
    message.timestamp = Date.now();

    this.logger.debug('Sending message to ' + to.agentId + ': ' + message.type);

    // Store pending message
    this.pendingMessages.set(message.id, message);

    // Emit for actual transmission (implementation depends on transport)
    this.eventEmitter.emit('custom:*', { type: 'a2a:send', message });

    // Clean up old messages
    this.cleanupMessages();
  }

  /**
   * Broadcast a message to all known agents
   */
  async broadcast(message: A2AMessage): Promise<void> {
    this.logger.debug('Broadcasting message: ' + message.type);

    // Send to all known agents
    for (const agent of this.knownAgents.values()) {
      if (agent.agentId !== this.identity.agentId) {
        await this.send(agent, { ...message });
      }
    }

    // Emit broadcast event
    this.eventEmitter.emit('custom:*', { type: 'a2a:broadcast', message });
  }

  /**
   * Handle incoming message
   */
  async handleMessage(message: A2AMessage): Promise<void> {
    this.logger.debug('Received message from ' + message.from.agentId + ': ' + message.type);

    // Validate message
    if (!this.validateMessage(message)) {
      this.logger.warn('Invalid message received');
      return;
    }

    // Update known agents
    this.knownAgents.set(message.from.agentId, message.from);

    // Route message based on type
    switch (message.type) {
      case MessageType.DISCOVER:
        await this.handleDiscovery(message);
        break;
      case MessageType.DISCOVER_RESPONSE:
        await this.handleDiscoveryResponse(message);
        break;
      case MessageType.PROPOSE_COLLABORATION:
        await this.handleCollaborationProposal(message);
        break;
      case MessageType.TASK_ANNOUNCEMENT:
        await this.handleTaskAnnouncement(message);
        break;
      case MessageType.GOVERNANCE_ALERT:
        await this.handleGovernanceAlert(message);
        break;
      case MessageType.HEARTBEAT:
        await this.handleHeartbeat(message);
        break;
      default:
        this.logger.debug('Unhandled message type: ' + message.type);
    }

    // Emit received event
    this.eventEmitter.emit('custom:*', { type: 'a2a:message', message });
  }

  /**
   * Propose collaboration to another agent
   */
  async proposeCollaboration(
    to: AgentIdentity,
    proposal: CollaborationProposal
  ): Promise<void> {
    const message: A2AMessage = {
      id: 'msg-' + Date.now().toString(),
      type: MessageType.PROPOSE_COLLABORATION,
      from: this.identity,
      to,
      timestamp: Date.now(),
      payload: proposal,
      ttl: this.config.defaultTTL,
    };

    this.activeCollaborations.set(proposal.proposalId, proposal);
    await this.send(to, message);

    this.logger.info('Sent collaboration proposal to ' + to.agentId);
  }

  /**
   * Submit a bid for a task
   */
  async submitTaskBid(announcement: A2AMessage, bid: TaskBid): Promise<void> {
    const message: A2AMessage = {
      id: 'msg-' + Date.now().toString(),
      type: MessageType.TASK_BID,
      from: this.identity,
      to: announcement.from,
      timestamp: Date.now(),
      payload: bid,
      ttl: this.config.defaultTTL,
    };

    await this.send(announcement.from, message);
    this.logger.info('Submitted task bid for ' + bid.taskId);
  }

  /**
   * Broadcast governance alert
   */
  async broadcastGovernanceAlert(alert: GovernanceAlert): Promise<void> {
    const message: A2AMessage = {
      id: 'msg-' + Date.now().toString(),
      type: MessageType.GOVERNANCE_ALERT,
      from: this.identity,
      timestamp: Date.now(),
      payload: alert,
      ttl: this.config.defaultTTL,
    };

    await this.broadcast(message);
    this.logger.info('Broadcast governance alert for proposal #' + alert.proposalId.toString());
  }

  /**
   * Get known agents
   */
  getKnownAgents(): AgentIdentity[] {
    return Array.from(this.knownAgents.values());
  }

  /**
   * Get active collaborations
   */
  getActiveCollaborations(): CollaborationProposal[] {
    return Array.from(this.activeCollaborations.values());
  }

  /**
   * Get status
   */
  getStatus(): {
    running: boolean;
    knownAgents: number;
    pendingMessages: number;
    activeCollaborations: number;
  } {
    return {
      running: this.running,
      knownAgents: this.knownAgents.size,
      pendingMessages: this.pendingMessages.size,
      activeCollaborations: this.activeCollaborations.size,
    };
  }

  // ==================== MESSAGE HANDLERS ====================

  private async handleDiscovery(message: A2AMessage): Promise<void> {
    this.logger.info('Received discovery from ' + message.from.agentId);

    if (this.config.autoRespondToDiscovery) {
      const response: A2AMessage = {
        id: 'msg-' + Date.now().toString(),
        type: MessageType.DISCOVER_RESPONSE,
        from: this.identity,
        to: message.from,
        timestamp: Date.now(),
        payload: {
          agent: this.identity,
          status: 'available',
          capabilities: this.identity.capabilities,
          reputation: this.identity.reputation,
          recentCollaborations: this.activeCollaborations.size,
        } as DiscoveryResponse,
        ttl: this.config.defaultTTL,
      };

      await this.send(message.from, response);
    }
  }

  private async handleDiscoveryResponse(message: A2AMessage): Promise<void> {
    const response = message.payload as DiscoveryResponse;
    this.logger.info('Discovery response from ' + response.agent.agentId);
    this.knownAgents.set(response.agent.agentId, response.agent);
  }

  private async handleCollaborationProposal(message: A2AMessage): Promise<void> {
    const proposal = message.payload as CollaborationProposal;
    this.logger.info('Received collaboration proposal: ' + proposal.type);

    // Emit for handling by agent
    this.eventEmitter.emit('custom:*', { type: 'a2a:collaboration_proposal', proposal });

    // Auto-accept if configured
    if (this.config.autoAcceptCollaboration) {
      const acceptMessage: A2AMessage = {
        id: 'msg-' + Date.now().toString(),
        type: MessageType.ACCEPT_COLLABORATION,
        from: this.identity,
        to: message.from,
        timestamp: Date.now(),
        payload: { proposalId: proposal.proposalId },
        ttl: this.config.defaultTTL,
      };
      await this.send(message.from, acceptMessage);
    }
  }

  private async handleTaskAnnouncement(message: A2AMessage): Promise<void> {
    this.logger.info('Received task announcement');
    this.eventEmitter.emit('custom:*', { type: 'a2a:task_announcement', payload: message.payload });
  }

  private async handleGovernanceAlert(message: A2AMessage): Promise<void> {
    const alert = message.payload as GovernanceAlert;
    this.logger.info('Received governance alert for proposal #' + alert.proposalId.toString());
    this.eventEmitter.emit('custom:*', { type: 'a2a:governance_alert', alert });
  }

  private async handleHeartbeat(message: A2AMessage): Promise<void> {
    // Update agent status
    this.knownAgents.set(message.from.agentId, message.from);
  }

  // ==================== INTERNAL METHODS ====================

  private validateMessage(message: A2AMessage): boolean {
    // Check message age
    const age = Date.now() - message.timestamp;
    if (age > this.config.maxMessageAge * 1000) {
      this.logger.warn('Message too old: ' + age + 'ms');
      return false;
    }

    // Check TTL
    const ttlMs = message.ttl * 1000;
    if (Date.now() - message.timestamp > ttlMs) {
      this.logger.warn('Message TTL expired');
      return false;
    }

    // Verify signature if required
    if (this.config.requireSignature && !message.signature) {
      this.logger.warn('Message missing required signature');
      return false;
    }

    return true;
  }

  private cleanupMessages(): void {
    const now = Date.now();
    for (const [id, message] of this.pendingMessages.entries()) {
      const age = now - message.timestamp;
      if (age > this.config.maxMessageAge * 1000) {
        this.pendingMessages.delete(id);
      }
    }
  }

  private heartbeatInterval?: NodeJS.Timeout;

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      const message: A2AMessage = {
        id: 'hb-' + Date.now().toString(),
        type: MessageType.HEARTBEAT,
        from: this.identity,
        timestamp: Date.now(),
        payload: {
          status: 'healthy',
          uptime: process.uptime(),
        },
        ttl: 60,
      };

      await this.broadcast(message);
    }, 30000); // Every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }
}
