/**
 * Event Listener - Subscribe to HAVEN protocol events
 */

import { EventEmitter } from '@havenclaw/runtime';
import type { HavenClient } from '../HavenClient.js';

export interface EventListenerConfig {
  pollingInterval?: number;
  fromBlock?: bigint;
  enabled?: {
    governance?: boolean;
    tasks?: boolean;
    reputation?: boolean;
    agentRegistry?: boolean;
  };
}

export interface EventSubscription {
  name: string;
  remove: () => void;
}

/**
 * EventListener subscribes to HAVEN protocol events
 */
export class EventListener {
  private client: HavenClient;
  private eventEmitter: EventEmitter;
  private config: EventListenerConfig;
  private subscriptions: Map<string, EventSubscription>;
  private running: boolean = false;

  constructor(
    client: HavenClient,
    eventEmitter: EventEmitter,
    config: EventListenerConfig = {}
  ) {
    this.client = client;
    this.eventEmitter = eventEmitter;
    this.config = {
      pollingInterval: config.pollingInterval || 5000,
      fromBlock: config.fromBlock,
      enabled: {
        governance: true,
        tasks: true,
        reputation: true,
        agentRegistry: true,
        ...config.enabled,
      },
    };
    this.subscriptions = new Map();
  }

  /**
   * Start listening for events
   */
  async start(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;

    // Determine starting block
    const fromBlock =
      this.config.fromBlock ?? (await this.client.getBlockNumber());

    // Subscribe to all enabled event types
    if (this.config.enabled?.governance) {
      await this.subscribeToGovernance(fromBlock);
    }

    if (this.config.enabled?.tasks) {
      await this.subscribeToTasks(fromBlock);
    }

    if (this.config.enabled?.reputation) {
      await this.subscribeToReputation(fromBlock);
    }

    if (this.config.enabled?.agentRegistry) {
      await this.subscribeToAgentRegistry(fromBlock);
    }
  }

  /**
   * Stop listening for events
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    this.running = false;

    // Remove all subscriptions
    for (const [, sub] of this.subscriptions.entries()) {
      sub.remove();
    }
    this.subscriptions.clear();
  }

  /**
   * Subscribe to governance events
   */
  private async subscribeToGovernance(_fromBlock: bigint): Promise<void> {
    const filter = this.client.havenGovernance.filters.ProposalCreated();

    const listener = async (...args: any[]) => {
      const event = args[args.length - 1];
      const proposalEvent = {
        proposalId: event.args.proposalId as bigint,
        proposer: event.args.proposer as string,
        description: event.args.description as string,
        targets: [], // Would need to query full proposal details
        calldatas: [],
        startBlock: 0n,
        endBlock: 0n,
      };

      this.eventEmitter.emit('governance:proposal', proposalEvent);
    };

    // For ethers v6, we need to use the provider's listener
    const provider = this.client.provider as any;
    await provider.on(filter, listener);

    this.subscriptions.set('governance', {
      name: 'governance',
      remove: () => {
        provider.off(filter, listener);
      },
    });

    // Also listen for VoteCast events
    const voteFilter = this.client.havenGovernance.filters.VoteCast();
    const voteListener = async (...args: any[]) => {
      const event = args[args.length - 1];
      const voteEvent = {
        proposalId: event.args.proposalId as bigint,
        voter: event.args.voter as string,
        support: event.args.support as number,
        votingPower: event.args.weight as bigint,
        reason: event.args.reason as string,
      };

      this.eventEmitter.emit('governance:vote', voteEvent);
    };

    await provider.on(voteFilter, voteListener);

    this.subscriptions.set('governance-vote', {
      name: 'governance-vote',
      remove: () => {
        provider.off(voteFilter, voteListener);
      },
    });
  }

  /**
   * Subscribe to task events
   */
  private async subscribeToTasks(_fromBlock: bigint): Promise<void> {
    const provider = this.client.provider as any;

    // TaskCreated
    const taskFilter = this.client.taskMarketplace.filters.TaskCreated();
    const taskListener = async (...args: any[]) => {
      const event = args[args.length - 1];
      const taskId = event.args.taskId as bigint;

      // Fetch full task details
      const task = await this.client.taskMarketplace.getTask(taskId);

      const taskEvent = {
        taskId,
        creator: task.creator as string,
        description: task.description as string,
        requiredCapability: this._bytes32ToString(
          task.requiredCapability as string
        ),
        reward: task.reward as bigint,
        rewardToken: task.rewardToken as string,
        deadline: task.deadline as bigint,
      };

      this.eventEmitter.emit('task:created', taskEvent);
    };

    await provider.on(taskFilter, taskListener);

    this.subscriptions.set('task-created', {
      name: 'task-created',
      remove: () => {
        provider.off(taskFilter, taskListener);
      },
    });

    // TaskCompleted
    const completeFilter = this.client.taskMarketplace.filters.TaskCompleted();
    const completeListener = async (...args: any[]) => {
      const event = args[args.length - 1];
      const taskId = event.args.taskId as bigint;
      const task = await this.client.taskMarketplace.getTask(taskId);

      const taskEvent = {
        taskId,
        creator: task.creator as string,
        description: task.description as string,
        requiredCapability: this._bytes32ToString(
          task.requiredCapability as string
        ),
        reward: task.reward as bigint,
        rewardToken: task.rewardToken as string,
        deadline: task.deadline as bigint,
      };

      this.eventEmitter.emit('task:completed', taskEvent);
    };

    await provider.on(completeFilter, completeListener);

    this.subscriptions.set('task-completed', {
      name: 'task-completed',
      remove: () => {
        provider.off(completeFilter, completeListener);
      },
    });
  }

  /**
   * Subscribe to reputation events
   */
  private async subscribeToReputation(_fromBlock: bigint): Promise<void> {
    const provider = this.client.provider as any;

    // TokensStaked
    const stakeFilter = this.client.agentReputation.filters.TokensStaked();
    const stakeListener = async (...args: any[]) => {
      const event = args[args.length - 1];
      // Emit custom event for staking
      this.eventEmitter.emit('runtime:state-change' as any, {
        type: 'stake',
        agent: event.args.agent as string,
        amount: event.args.amount as bigint,
        unlockTime: event.args.unlockTime as bigint,
      });
    };

    await provider.on(stakeFilter, stakeListener);

    this.subscriptions.set('reputation-stake', {
      name: 'reputation-stake',
      remove: () => {
        provider.off(stakeFilter, stakeListener);
      },
    });

    // ReputationUpdated
    const repFilter = this.client.agentReputation.filters.ReputationUpdated();
    const repListener = async (...args: any[]) => {
      const event = args[args.length - 1];
      this.eventEmitter.emit('runtime:state-change' as any, {
        type: 'reputation',
        agent: event.args.agent as string,
        delta: event.args.delta as bigint,
        newScore: event.args.newScore as bigint,
      });
    };

    await provider.on(repFilter, repListener);

    this.subscriptions.set('reputation-update', {
      name: 'reputation-update',
      remove: () => {
        provider.off(repFilter, repListener);
      },
    });
  }

  /**
   * Subscribe to agent registry events
   */
  private async subscribeToAgentRegistry(_fromBlock: bigint): Promise<void> {
    const provider = this.client.provider as any;

    // AgentRegistered
    const agentFilter = this.client.agentRegistry.filters.AgentRegistered();
    const agentListener = async (...args: any[]) => {
      const event = args[args.length - 1];
      this.eventEmitter.emit('runtime:state-change' as any, {
        type: 'agent-registered',
        agentAddress: event.args.agentAddress as string,
        metadataURI: event.args.metadataURI as string,
        capabilities: event.args.capabilities as string[],
        timestamp: event.args.timestamp as bigint,
      });
    };

    await provider.on(agentFilter, agentListener);

    this.subscriptions.set('agent-registered', {
      name: 'agent-registered',
      remove: () => {
        provider.off(agentFilter, agentListener);
      },
    });
  }

  /**
   * Get active subscription count
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Check if listener is running
   */
  isRunning(): boolean {
    return this.running;
  }

  private _bytes32ToString(bytes32: string): string {
    // Remove 0x prefix and decode as UTF-8
    const hex = bytes32.replace(/^0x/, '');
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
      const code = parseInt(hex.substr(i, 2), 16);
      if (code === 0) break; // Null terminator
      str += String.fromCharCode(code);
    }
    return str;
  }
}
