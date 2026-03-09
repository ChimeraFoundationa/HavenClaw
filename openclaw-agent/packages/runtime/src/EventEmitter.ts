/**
 * Internal Event Emitter
 */

import { EventEmitter as BaseEmitter } from 'events';

// Event type definitions
export interface ProposalEvent {
  proposalId: bigint;
  proposer: string;
  description: string;
  targets: string[];
  calldatas: string[];
  startBlock: bigint;
  endBlock: bigint;
}

export interface VoteEvent {
  proposalId: bigint;
  voter: string;
  support: number;
  votingPower: bigint;
  reason?: string;
}

export interface TaskEvent {
  taskId: bigint;
  creator: string;
  description: string;
  requiredCapability: string;
  reward: bigint;
  rewardToken: string;
  deadline: bigint;
}

export interface TransactionEvent {
  hash: string;
  nonce?: number;
  target?: string;
  submittedAt?: number;
  blockNumber?: bigint;
  gasUsed?: bigint;
  status?: 'pending' | 'confirmed' | 'failed' | 'reverted';
  error?: string;
}

// Agent internal events
export interface AgentEvents {
  // Runtime lifecycle
  'runtime:started': () => void;
  'runtime:stopped': () => void;
  'runtime:error': (error: Error) => void;
  'runtime:state-change': (oldState: string, newState: string) => void;
  
  // Governance events
  'governance:proposal': (proposal: ProposalEvent) => void;
  'governance:vote': (vote: VoteEvent) => void;
  
  // Task events
  'task:created': (task: TaskEvent) => void;
  'task:accepted': (task: TaskEvent) => void;
  'task:completed': (task: TaskEvent) => void;
  'task:reward-claimed': (task: TaskEvent) => void;
  
  // Transaction events
  'transaction:submitted': (tx: TransactionEvent) => void;
  'transaction:confirmed': (tx: TransactionEvent) => void;
  'transaction:failed': (tx: TransactionEvent) => void;
  
  // Custom events (for plugins/extensions)
  'custom:*': (data: any) => void;
}

export class EventEmitter {
  private emitter: BaseEmitter;
  
  constructor() {
    this.emitter = new BaseEmitter();
  }
  
  on<K extends keyof AgentEvents>(event: K, listener: AgentEvents[K]): this {
    this.emitter.on(event, listener);
    return this;
  }
  
  once<K extends keyof AgentEvents>(event: K, listener: AgentEvents[K]): this {
    this.emitter.once(event, listener);
    return this;
  }
  
  off<K extends keyof AgentEvents>(event: K, listener: AgentEvents[K]): this {
    this.emitter.off(event, listener);
    return this;
  }
  
  emit<K extends keyof AgentEvents>(event: K, ...args: Parameters<AgentEvents[K]>): boolean {
    return this.emitter.emit(event, ...args);
  }
  
  removeAllListeners(event?: keyof AgentEvents): this {
    this.emitter.removeAllListeners(event);
    return this;
  }
  
  listenerCount(event: keyof AgentEvents): number {
    return this.emitter.listenerCount(event);
  }
}
