// src/types.ts
var MessageType = /* @__PURE__ */ ((MessageType2) => {
  MessageType2["DISCOVER"] = "discover";
  MessageType2["DISCOVER_RESPONSE"] = "discover_response";
  MessageType2["PROPOSE_COLLABORATION"] = "propose_collaboration";
  MessageType2["ACCEPT_COLLABORATION"] = "accept_collaboration";
  MessageType2["REJECT_COLLABORATION"] = "reject_collaboration";
  MessageType2["TASK_ANNOUNCEMENT"] = "task_announcement";
  MessageType2["TASK_BID"] = "task_bid";
  MessageType2["TASK_AWARD"] = "task_award";
  MessageType2["INFORMATION_SHARE"] = "information_share";
  MessageType2["INFORMATION_REQUEST"] = "information_request";
  MessageType2["INFORMATION_RESPONSE"] = "information_response";
  MessageType2["GOVERNANCE_ALERT"] = "governance_alert";
  MessageType2["VOTE_COORDINATION"] = "vote_coordination";
  MessageType2["HEARTBEAT"] = "heartbeat";
  MessageType2["STATUS_REQUEST"] = "status_request";
  MessageType2["STATUS_RESPONSE"] = "status_response";
  return MessageType2;
})(MessageType || {});
var DEFAULT_A2A_CONFIG = {
  agentId: "unknown",
  agentName: "Unknown Agent",
  capabilities: [],
  broadcastEnabled: true,
  discoveryEndpoint: void 0,
  messageEndpoint: void 0,
  maxMessageAge: 3600,
  maxPendingMessages: 1e3,
  defaultTTL: 300,
  trustedAgents: [],
  requireSignature: false,
  autoRespondToDiscovery: true,
  autoAcceptCollaboration: false
};

// src/A2ACommunication.ts
var A2ACommunication = class {
  config;
  logger;
  eventEmitter;
  identity;
  // State
  knownAgents = /* @__PURE__ */ new Map();
  pendingMessages = /* @__PURE__ */ new Map();
  activeCollaborations = /* @__PURE__ */ new Map();
  running = false;
  constructor(logger, eventEmitter, config) {
    this.logger = logger.child({ module: "A2ACommunication" });
    this.eventEmitter = eventEmitter;
    this.config = { ...DEFAULT_A2A_CONFIG, ...config };
    this.identity = {
      agentId: this.config.agentId,
      agentName: this.config.agentName,
      capabilities: this.config.capabilities,
      reputation: 0n,
      endpoint: this.config.messageEndpoint
    };
    this.logger.info("A2A Communication initialized for agent: " + this.identity.agentId);
  }
  /**
   * Start the A2A communication system
   */
  async start() {
    if (this.running) {
      return;
    }
    this.logger.info("Starting A2A communication...");
    this.running = true;
    if (this.config.broadcastEnabled) {
      await this.broadcastDiscovery();
    }
    this.startHeartbeat();
    this.logger.info("A2A communication started");
  }
  /**
   * Stop the A2A communication system
   */
  async stop() {
    if (!this.running) {
      return;
    }
    this.logger.info("Stopping A2A communication...");
    this.running = false;
    this.stopHeartbeat();
    this.logger.info("A2A communication stopped");
  }
  /**
   * Broadcast discovery message
   */
  async broadcastDiscovery() {
    this.logger.info("Broadcasting discovery message");
    const message = {
      id: "msg-" + Date.now().toString(),
      type: "discover" /* DISCOVER */,
      from: this.identity,
      timestamp: Date.now(),
      payload: {
        capabilities: this.identity.capabilities,
        seekingCollaboration: true
      },
      ttl: this.config.defaultTTL
    };
    await this.broadcast(message);
  }
  /**
   * Send a message to a specific agent
   */
  async send(to, message) {
    message.to = to;
    message.timestamp = Date.now();
    this.logger.debug("Sending message to " + to.agentId + ": " + message.type);
    this.pendingMessages.set(message.id, message);
    this.eventEmitter.emit("custom:*", { type: "a2a:send", message });
    this.cleanupMessages();
  }
  /**
   * Broadcast a message to all known agents
   */
  async broadcast(message) {
    this.logger.debug("Broadcasting message: " + message.type);
    for (const agent of this.knownAgents.values()) {
      if (agent.agentId !== this.identity.agentId) {
        await this.send(agent, { ...message });
      }
    }
    this.eventEmitter.emit("custom:*", { type: "a2a:broadcast", message });
  }
  /**
   * Handle incoming message
   */
  async handleMessage(message) {
    this.logger.debug("Received message from " + message.from.agentId + ": " + message.type);
    if (!this.validateMessage(message)) {
      this.logger.warn("Invalid message received");
      return;
    }
    this.knownAgents.set(message.from.agentId, message.from);
    switch (message.type) {
      case "discover" /* DISCOVER */:
        await this.handleDiscovery(message);
        break;
      case "discover_response" /* DISCOVER_RESPONSE */:
        await this.handleDiscoveryResponse(message);
        break;
      case "propose_collaboration" /* PROPOSE_COLLABORATION */:
        await this.handleCollaborationProposal(message);
        break;
      case "task_announcement" /* TASK_ANNOUNCEMENT */:
        await this.handleTaskAnnouncement(message);
        break;
      case "governance_alert" /* GOVERNANCE_ALERT */:
        await this.handleGovernanceAlert(message);
        break;
      case "heartbeat" /* HEARTBEAT */:
        await this.handleHeartbeat(message);
        break;
      default:
        this.logger.debug("Unhandled message type: " + message.type);
    }
    this.eventEmitter.emit("custom:*", { type: "a2a:message", message });
  }
  /**
   * Propose collaboration to another agent
   */
  async proposeCollaboration(to, proposal) {
    const message = {
      id: "msg-" + Date.now().toString(),
      type: "propose_collaboration" /* PROPOSE_COLLABORATION */,
      from: this.identity,
      to,
      timestamp: Date.now(),
      payload: proposal,
      ttl: this.config.defaultTTL
    };
    this.activeCollaborations.set(proposal.proposalId, proposal);
    await this.send(to, message);
    this.logger.info("Sent collaboration proposal to " + to.agentId);
  }
  /**
   * Submit a bid for a task
   */
  async submitTaskBid(announcement, bid) {
    const message = {
      id: "msg-" + Date.now().toString(),
      type: "task_bid" /* TASK_BID */,
      from: this.identity,
      to: announcement.from,
      timestamp: Date.now(),
      payload: bid,
      ttl: this.config.defaultTTL
    };
    await this.send(announcement.from, message);
    this.logger.info("Submitted task bid for " + bid.taskId);
  }
  /**
   * Broadcast governance alert
   */
  async broadcastGovernanceAlert(alert) {
    const message = {
      id: "msg-" + Date.now().toString(),
      type: "governance_alert" /* GOVERNANCE_ALERT */,
      from: this.identity,
      timestamp: Date.now(),
      payload: alert,
      ttl: this.config.defaultTTL
    };
    await this.broadcast(message);
    this.logger.info("Broadcast governance alert for proposal #" + alert.proposalId.toString());
  }
  /**
   * Get known agents
   */
  getKnownAgents() {
    return Array.from(this.knownAgents.values());
  }
  /**
   * Get active collaborations
   */
  getActiveCollaborations() {
    return Array.from(this.activeCollaborations.values());
  }
  /**
   * Get status
   */
  getStatus() {
    return {
      running: this.running,
      knownAgents: this.knownAgents.size,
      pendingMessages: this.pendingMessages.size,
      activeCollaborations: this.activeCollaborations.size
    };
  }
  // ==================== MESSAGE HANDLERS ====================
  async handleDiscovery(message) {
    this.logger.info("Received discovery from " + message.from.agentId);
    if (this.config.autoRespondToDiscovery) {
      const response = {
        id: "msg-" + Date.now().toString(),
        type: "discover_response" /* DISCOVER_RESPONSE */,
        from: this.identity,
        to: message.from,
        timestamp: Date.now(),
        payload: {
          agent: this.identity,
          status: "available",
          capabilities: this.identity.capabilities,
          reputation: this.identity.reputation,
          recentCollaborations: this.activeCollaborations.size
        },
        ttl: this.config.defaultTTL
      };
      await this.send(message.from, response);
    }
  }
  async handleDiscoveryResponse(message) {
    const response = message.payload;
    this.logger.info("Discovery response from " + response.agent.agentId);
    this.knownAgents.set(response.agent.agentId, response.agent);
  }
  async handleCollaborationProposal(message) {
    const proposal = message.payload;
    this.logger.info("Received collaboration proposal: " + proposal.type);
    this.eventEmitter.emit("custom:*", { type: "a2a:collaboration_proposal", proposal });
    if (this.config.autoAcceptCollaboration) {
      const acceptMessage = {
        id: "msg-" + Date.now().toString(),
        type: "accept_collaboration" /* ACCEPT_COLLABORATION */,
        from: this.identity,
        to: message.from,
        timestamp: Date.now(),
        payload: { proposalId: proposal.proposalId },
        ttl: this.config.defaultTTL
      };
      await this.send(message.from, acceptMessage);
    }
  }
  async handleTaskAnnouncement(message) {
    this.logger.info("Received task announcement");
    this.eventEmitter.emit("custom:*", { type: "a2a:task_announcement", payload: message.payload });
  }
  async handleGovernanceAlert(message) {
    const alert = message.payload;
    this.logger.info("Received governance alert for proposal #" + alert.proposalId.toString());
    this.eventEmitter.emit("custom:*", { type: "a2a:governance_alert", alert });
  }
  async handleHeartbeat(message) {
    this.knownAgents.set(message.from.agentId, message.from);
  }
  // ==================== INTERNAL METHODS ====================
  validateMessage(message) {
    const age = Date.now() - message.timestamp;
    if (age > this.config.maxMessageAge * 1e3) {
      this.logger.warn("Message too old: " + age + "ms");
      return false;
    }
    const ttlMs = message.ttl * 1e3;
    if (Date.now() - message.timestamp > ttlMs) {
      this.logger.warn("Message TTL expired");
      return false;
    }
    if (this.config.requireSignature && !message.signature) {
      this.logger.warn("Message missing required signature");
      return false;
    }
    return true;
  }
  cleanupMessages() {
    const now = Date.now();
    for (const [id, message] of this.pendingMessages.entries()) {
      const age = now - message.timestamp;
      if (age > this.config.maxMessageAge * 1e3) {
        this.pendingMessages.delete(id);
      }
    }
  }
  heartbeatInterval;
  startHeartbeat() {
    this.heartbeatInterval = setInterval(async () => {
      const message = {
        id: "hb-" + Date.now().toString(),
        type: "heartbeat" /* HEARTBEAT */,
        from: this.identity,
        timestamp: Date.now(),
        payload: {
          status: "healthy",
          uptime: process.uptime()
        },
        ttl: 60
      };
      await this.broadcast(message);
    }, 3e4);
  }
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = void 0;
    }
  }
};
export {
  A2ACommunication,
  DEFAULT_A2A_CONFIG,
  MessageType
};
