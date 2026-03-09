/**
 * Memory System Types
 */

/**
 * Memory types for agent learning
 */
export enum MemoryType {
  SEMANTIC = 'semantic',   // Protocol knowledge, facts
  EPISODIC = 'episodic',   // Experiences, events
  PROCEDURAL = 'procedural', // Skills, how-to
}

export interface Memory {
  id: string;
  type: MemoryType;
  content: string;
  embedding?: number[]; // Vector embedding for similarity search
  metadata: MemoryMetadata;
  createdAt: number;
  accessedAt?: number;
  accessCount: number;
}

export interface MemoryMetadata {
  source?: string;
  tags?: string[];
  importance?: number; // 0-1, determines retention priority
  expiresAt?: number; // TTL for forgetting
  relatedIds?: string[]; // Links to other memories
}

/**
 * Working memory for short-term context
 */
export interface WorkingMemory {
  currentContext: string[]; // Current focus items
  attention: string[]; // Items in focus
  capacity: number;
}

/**
 * Memory query interface
 */
export interface MemoryQuery {
  text?: string; // For semantic search
  type?: MemoryType;
  tags?: string[];
  minImportance?: number;
  limit?: number;
}

/**
 * Memory search result
 */
export interface MemoryResult {
  memory: Memory;
  score: number; // Relevance score 0-1
}

/**
 * Memory system configuration
 */
export interface MemoryConfig {
  // Capacity limits
  workingMemoryCapacity: number;
  longTermMemoryLimit: number;

  // Forgetting parameters
  forgettingCurve: 'exponential' | 'linear';
  decayRate: number; // How fast memories decay
  minRetentionThreshold: number;

  // Search parameters
  defaultSearchLimit: number;
  minSimilarityScore: number;

  // Persistence (optional)
  persistencePath?: string; // For saving to disk
}

export const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
  workingMemoryCapacity: 7, // Miller's number
  longTermMemoryLimit: 1000,
  forgettingCurve: 'exponential',
  decayRate: 0.1,
  minRetentionThreshold: 0.2,
  defaultSearchLimit: 10,
  minSimilarityScore: 0.7,
  persistencePath: undefined,
};

/**
 * Experience memory - specialized for OODA experiences
 */
export interface ExperienceMemory extends Memory {
  type: MemoryType.EPISODIC;
  content: string; // Keep as string for base interface compatibility
  experienceData?: {
    situation: string;
    decision: string;
    outcome: string;
    lessonsLearned: string[];
  };
  metadata: ExperienceMetadata;
}

export interface ExperienceMetadata extends MemoryMetadata {
  success?: boolean;
  reward?: string; // String to handle bigint
  riskLevel?: 'low' | 'medium' | 'high';
  domain: 'governance' | 'task' | 'reputation' | 'general';
}
