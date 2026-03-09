/**
 * OODA Loop Types - Core interfaces for Observe-Orient-Decide-Act cycle
 */

import type { ProposalInfo, TaskInfo } from '@havenclaw/haven-interface';

/**
 * Observation types - data collected from the environment
 */
export enum ObservationType {
  BLOCKCHAIN = 'blockchain',
  GOVERNANCE = 'governance',
  TASK = 'task',
  REPUTATION = 'reputation',
  EXTERNAL = 'external',
}

export interface Observation {
  type: ObservationType;
  timestamp: number;
  data: any;
  priority: number; // 1-10, higher = more urgent
  source: string;
}

export interface BlockchainObservation extends Observation {
  type: ObservationType.BLOCKCHAIN;
  data: {
    blockNumber: bigint;
    gasPrice: bigint;
    networkCongestion: 'low' | 'medium' | 'high';
  };
}

export interface GovernanceObservation extends Observation {
  type: ObservationType.GOVERNANCE;
  data: {
    proposal: ProposalInfo;
    timeRemaining: bigint;
    currentQuorum: bigint;
    voteDistribution: { for: bigint; against: bigint; abstain: bigint };
  };
}

export interface TaskObservation extends Observation {
  type: ObservationType.TASK;
  data: {
    task: TaskInfo;
    competition: number; // Number of agents competing
    estimatedDifficulty: 'easy' | 'medium' | 'hard';
    expectedReward: bigint;
  };
}

/**
 * Context - Oriented understanding of the situation
 */
export interface Context {
  timestamp: number;
  observations: Observation[];

  // Situational awareness
  situation: {
    type: 'normal' | 'opportunity' | 'threat' | 'critical';
    description: string;
    confidence: number; // 0-1
  };

  // Relevant memories/experiences
  relevantHistory: Experience[];

  // Current agent state
  agentState: {
    reputation: bigint;
    balance: bigint;
    activeTasks: number;
    votingPower: bigint;
  };

  // Constraints and opportunities
  constraints: string[];
  opportunities: Opportunity[];
}

export interface Opportunity {
  type: 'governance' | 'task' | 'reputation';
  description: string;
  expectedValue: bigint;
  risk: 'low' | 'medium' | 'high';
  urgency: number; // 1-10
}

/**
 * Decision - Chosen course of action
 */
export interface Decision {
  id: string;
  timestamp: number;
  context: Context;

  // Decision metadata
  reasoning: {
    analysis: string;
    alternatives: Alternative[];
    selectedAlternative: string;
    confidence: number; // 0-1
  };

  // Actions to execute
  actions: Action[];

  // Expected outcomes
  expectedOutcomes: {
    reputationChange: bigint;
    balanceChange: bigint;
    riskLevel: 'low' | 'medium' | 'high';
  };
}

export interface Alternative {
  id: string;
  description: string;
  expectedValue: bigint;
  risk: number; // 0-1
  confidence: number; // 0-1
}

/**
 * Action - Executable unit
 */
export interface Action {
  id: string;
  type: ActionType;
  priority: number; // 1-10
  params: Record<string, any>;
  metadata: {
    estimatedGas: bigint;
    timeout?: number;
    retries?: number;
  };
}

export enum ActionType {
  VOTE = 'vote',
  ACCEPT_TASK = 'accept_task',
  COMPLETE_TASK = 'complete_task',
  STAKE = 'stake',
  UNSTAKE = 'unstake',
  TRANSFER = 'transfer',
  CUSTOM = 'custom',
}

/**
 * Action Result - Outcome of executed action
 */
export interface ActionResult {
  actionId: string;
  success: boolean;
  timestamp: number;
  txHash?: string;
  receipt?: any;
  error?: string;
  actualOutcome: {
    reputationChange: bigint;
    balanceChange: bigint;
    gasUsed: bigint;
  };
}

/**
 * Experience - Recorded decision-making episode
 */
export interface Experience {
  id: string;
  timestamp: number;
  context: Context;
  decision: Decision;
  actions: ActionResult[];
  outcome: {
    success: boolean;
    reputationChange: bigint;
    balanceChange: bigint;
    lessonsLearned: string[];
  };
}

/**
 * OODA Loop Configuration
 */
export interface OODAConfig {
  // Observation settings
  observationInterval: number; // ms between observation cycles
  maxObservations: number; // Max observations to keep in context

  // Orientation settings
  contextWindow: number; // Number of past observations to consider
  minConfidence: number; // Minimum confidence to make decision

  // Decision settings
  maxAlternatives: number; // Max alternatives to generate
  decisionTimeout: number; // Max time for decision making

  // Action settings
  maxActionsPerCycle: number;
  requireConfirmation: boolean; // Require manual confirmation for actions

  // Learning settings
  recordExperiences: boolean;
}

export const DEFAULT_OODA_CONFIG: OODAConfig = {
  observationInterval: 5000,
  maxObservations: 100,
  contextWindow: 20,
  minConfidence: 0.6,
  maxAlternatives: 5,
  decisionTimeout: 30000,
  maxActionsPerCycle: 3,
  requireConfirmation: false,
  recordExperiences: true,
};
