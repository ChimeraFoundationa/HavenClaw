/**
 * State Reader - Query HAVEN protocol state with caching
 */

import type { HavenClient } from '../HavenClient.js';

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of entries
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

/**
 * Simple in-memory cache with TTL
 */
export class Cache {
  private cache: Map<string, CacheEntry<any>>;
  public readonly ttl: number;
  public readonly maxSize: number;

  constructor(config: CacheConfig = { ttl: 30000, maxSize: 1000 }) {
    this.cache = new Map();
    this.ttl = config.ttl;
    this.maxSize = config.maxSize;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T): void {
    // Evict oldest if at max size
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  /**
   * Get or compute value
   */
  async getOrCompute<T>(key: string, compute: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await compute();
    this.set(key, value);
    return value;
  }
}

/**
 * StateReader provides cached read access to HAVEN protocol state
 */
export class StateReader {
  private client: HavenClient;
  private cache: Cache;

  constructor(client: HavenClient, cacheConfig?: CacheConfig) {
    this.client = client;
    this.cache = new Cache(cacheConfig);
  }

  /**
   * Get agent registration info
   */
  async getAgentInfo(agentAddress: string): Promise<AgentInfo | null> {
    const cacheKey = `agent:${agentAddress.toLowerCase()}`;

    return this.cache.getOrCompute(cacheKey, async () => {
      const isRegistered = await this.client.agentRegistry.isRegistered(
        agentAddress
      );

      if (!isRegistered) {
        return null;
      }

      const info = await this.client.agentRegistry.getAgent(agentAddress);
      return {
        agentAddress: info.agentAddress as string,
        metadataURI: info.metadataURI as string,
        capabilities: (info.capabilities as string[]).map((c) =>
          this._bytes32ToString(c)
        ),
        registeredAt: info.registeredAt as bigint,
        verifiedAt: info.verifiedAt as bigint,
        exists: info.exists as boolean,
      };
    });
  }

  /**
   * Get agent reputation info
   */
  async getReputationInfo(agentAddress: string): Promise<ReputationInfo> {
    const cacheKey = `reputation:${agentAddress.toLowerCase()}`;

    return this.cache.getOrCompute(cacheKey, async () => {
      const info = await this.client.agentReputation.getReputation(agentAddress);
      return {
        score: info.score as bigint,
        tasksCompleted: info.tasksCompleted as bigint,
        tasksFailed: info.tasksFailed as bigint,
        totalEarnings: info.totalEarnings as bigint,
        stakedAmount: info.stakedAmount as bigint,
        unlockTime: info.unlockTime as bigint,
      };
    });
  }

  /**
   * Get proposal info
   */
  async getProposalInfo(proposalId: bigint): Promise<ProposalInfo> {
    const cacheKey = `proposal:${proposalId}`;

    return this.cache.getOrCompute(cacheKey, async () => {
      const state = await this.client.havenGovernance.state(proposalId);
      const startBlock = await this.client.havenGovernance.proposalSnapshot(
        proposalId
      );
      const endBlock = await this.client.havenGovernance.proposalDeadline(
        proposalId
      );

      return {
        proposalId,
        state: Number(state) as ProposalState,
        startBlock: startBlock as bigint,
        endBlock: endBlock as bigint,
      };
    });
  }

  /**
   * Get task info
   */
  async getTaskInfo(taskId: bigint): Promise<TaskInfo | null> {
    const cacheKey = `task:${taskId}`;

    return this.cache.getOrCompute(cacheKey, async () => {
      try {
        const task = await this.client.taskMarketplace.getTask(taskId);
        return {
          taskId: task.taskId as bigint,
          creator: task.creator as string,
          solver: task.solver as string,
          description: task.description as string,
          requiredCapability: this._bytes32ToString(
            task.requiredCapability as string
          ),
          reward: task.reward as bigint,
          rewardToken: task.rewardToken as string,
          status: Number(task.status) as TaskStatus,
          createdAt: task.createdAt as bigint,
          deadline: task.deadline as bigint,
          resultURI: task.resultURI as string,
        };
      } catch {
        return null;
      }
    });
  }

  /**
   * Get all active proposals
   */
  async getActiveProposals(): Promise<ProposalInfo[]> {
    const proposalCount = await this.client.havenGovernance.proposalCount();
    const active: ProposalInfo[] = [];

    for (let i = 1n; i <= proposalCount; i++) {
      const state = await this.client.havenGovernance.state(i);
      if (state === 1n) {
        // Active state
        active.push(await this.getProposalInfo(i));
      }
    }

    return active;
  }

  /**
   * Get all open tasks
   */
  async getOpenTasks(): Promise<TaskInfo[]> {
    const taskCount = await this.client.taskMarketplace.getTaskCount();
    const open: TaskInfo[] = [];

    for (let i = 1n; i <= taskCount; i++) {
      const task = await this.getTaskInfo(i);
      if (task && task.status === 0) {
        // Open status
        open.push(task);
      }
    }

    return open;
  }

  /**
   * Get agent voting power
   */
  async getVotingPower(agentAddress: string): Promise<bigint> {
    return this.client.agentReputation.getVotingPower(agentAddress);
  }

  /**
   * Get HAVEN token balance
   */
  async getHAVENBalance(address: string): Promise<bigint> {
    return this.client.getHAVENBalance(address);
  }

  /**
   * Invalidate cache for a specific key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear entire cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size(),
      maxSize: this.cache.maxSize,
    };
  }

  private _bytes32ToString(bytes32: string): string {
    const hex = bytes32.replace(/^0x/, '');
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
      const code = parseInt(hex.substr(i, 2), 16);
      if (code === 0) break;
      str += String.fromCharCode(code);
    }
    return str;
  }
}

// Type definitions
export type ProposalState =
  | 0 // Pending
  | 1 // Active
  | 2 // Canceled
  | 3 // Defeated
  | 4 // Succeeded
  | 5 // Queued
  | 6 // Expired
  | 7; // Executed

export type TaskStatus =
  | 0 // Open
  | 1 // InProgress
  | 2 // Completed
  | 3; // Cancelled

export interface AgentInfo {
  agentAddress: string;
  metadataURI: string;
  capabilities: string[];
  registeredAt: bigint;
  verifiedAt: bigint;
  exists: boolean;
}

export interface ReputationInfo {
  score: bigint;
  tasksCompleted: bigint;
  tasksFailed: bigint;
  totalEarnings: bigint;
  stakedAmount: bigint;
  unlockTime: bigint;
}

export interface ProposalInfo {
  proposalId: bigint;
  state: ProposalState;
  startBlock: bigint;
  endBlock: bigint;
}

export interface TaskInfo {
  taskId: bigint;
  creator: string;
  solver: string;
  description: string;
  requiredCapability: string;
  reward: bigint;
  rewardToken: string;
  status: TaskStatus;
  createdAt: bigint;
  deadline: bigint;
  resultURI: string;
}
