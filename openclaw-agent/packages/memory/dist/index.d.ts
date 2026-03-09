import { Logger } from '@havenclaw/tools';

/**
 * Memory System Types
 */
/**
 * Memory types for agent learning
 */
declare enum MemoryType {
    SEMANTIC = "semantic",// Protocol knowledge, facts
    EPISODIC = "episodic",// Experiences, events
    PROCEDURAL = "procedural"
}
interface Memory {
    id: string;
    type: MemoryType;
    content: string;
    embedding?: number[];
    metadata: MemoryMetadata;
    createdAt: number;
    accessedAt?: number;
    accessCount: number;
}
interface MemoryMetadata {
    source?: string;
    tags?: string[];
    importance?: number;
    expiresAt?: number;
    relatedIds?: string[];
}
/**
 * Working memory for short-term context
 */
interface WorkingMemory {
    currentContext: string[];
    attention: string[];
    capacity: number;
}
/**
 * Memory query interface
 */
interface MemoryQuery {
    text?: string;
    type?: MemoryType;
    tags?: string[];
    minImportance?: number;
    limit?: number;
}
/**
 * Memory search result
 */
interface MemoryResult {
    memory: Memory;
    score: number;
}
/**
 * Memory system configuration
 */
interface MemoryConfig {
    workingMemoryCapacity: number;
    longTermMemoryLimit: number;
    forgettingCurve: 'exponential' | 'linear';
    decayRate: number;
    minRetentionThreshold: number;
    defaultSearchLimit: number;
    minSimilarityScore: number;
    persistencePath?: string;
}
declare const DEFAULT_MEMORY_CONFIG: MemoryConfig;
/**
 * Experience memory - specialized for OODA experiences
 */
interface ExperienceMemory extends Memory {
    type: MemoryType.EPISODIC;
    content: string;
    experienceData?: {
        situation: string;
        decision: string;
        outcome: string;
        lessonsLearned: string[];
    };
    metadata: ExperienceMetadata;
}
interface ExperienceMetadata extends MemoryMetadata {
    success?: boolean;
    reward?: string;
    riskLevel?: 'low' | 'medium' | 'high';
    domain: 'governance' | 'task' | 'reputation' | 'general';
}

/**
 * MemorySystem - Long-term and short-term memory for agents
 */

/**
 * Simple in-memory vector store (Phase 2 MVP)
 * In production, replace with pgvector/Weaviate/Pinecone
 */
declare class MemorySystem {
    private config;
    private logger;
    private workingMemory;
    private semanticMemory;
    private episodicMemory;
    private proceduralMemory;
    private tagIndex;
    constructor(logger: Logger, config?: Partial<MemoryConfig>);
    /**
     * Store a memory
     */
    store(memory: Memory): Promise<string>;
    /**
     * Search memories
     */
    search(query: MemoryQuery): Promise<MemoryResult[]>;
    /**
     * Simple text-based search (Phase 2 MVP)
     * In production, use vector similarity with embeddings
     */
    searchByText(text: string, limit?: number): Promise<MemoryResult[]>;
    /**
     * Search for similar experiences
     */
    findSimilarExperiences(situation: string, domain?: 'governance' | 'task' | 'reputation'): Promise<ExperienceMemory[]>;
    /**
     * Add to working memory
     */
    addToWorkingMemory(item: string): void;
    /**
     * Focus attention on item
     */
    focusAttention(item: string): void;
    /**
     * Clear working memory
     */
    clearWorkingMemory(): void;
    /**
     * Get working memory contents
     */
    getWorkingMemory(): WorkingMemory;
    /**
     * Update memory access time
     */
    touchMemory(memoryId: string): Promise<void>;
    /**
     * Delete a memory
     */
    delete(memoryId: string): Promise<boolean>;
    /**
     * Get memory statistics
     */
    getStats(): {
        semantic: number;
        episodic: number;
        procedural: number;
        working: number;
        totalTags: number;
    };
    /**
     * Clear all memories
     */
    clear(): void;
    private getStore;
    private calculateRelevance;
    private calculateRecencyBoost;
    private applyForgetting;
    private enforceMemoryLimit;
}

export { DEFAULT_MEMORY_CONFIG, type ExperienceMemory, type ExperienceMetadata, type Memory, type MemoryConfig, type MemoryMetadata, type MemoryQuery, type MemoryResult, MemorySystem, MemoryType, type WorkingMemory };
