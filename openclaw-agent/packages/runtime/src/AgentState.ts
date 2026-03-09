/**
 * Agent State Management
 */

export enum AgentState {
  Stopped = 'stopped',
  Starting = 'starting',
  Running = 'running',
  Stopping = 'stopping',
  Error = 'error',
}

export interface AgentStatus {
  state: AgentState;
  uptime: number;
  lastError?: string;
  metrics: AgentMetrics;
}

export interface AgentMetrics {
  transactionsSubmitted: number;
  transactionsConfirmed: number;
  transactionsFailed: number;
  proposalsVoted: number;
  tasksCompleted: number;
  reputationEarned: bigint;
  gasSpent: bigint;
}

export function createInitialMetrics(): AgentMetrics {
  return {
    transactionsSubmitted: 0,
    transactionsConfirmed: 0,
    transactionsFailed: 0,
    proposalsVoted: 0,
    tasksCompleted: 0,
    reputationEarned: 0n,
    gasSpent: 0n,
  };
}
