/**
 * MemorySystem - Long-term and short-term memory for agents
 */

import { Logger } from '@havenclaw/tools';
import {
  Memory,
  MemoryType,
  MemoryQuery,
  MemoryResult,
  MemoryConfig,
  DEFAULT_MEMORY_CONFIG,
  WorkingMemory,
  ExperienceMemory,
  ExperienceMetadata,
} from './types.js';

/**
 * Simple in-memory vector store (Phase 2 MVP)
 * In production, replace with pgvector/Weaviate/Pinecone
 */
export class MemorySystem {
  private config: MemoryConfig;
  private logger: Logger;

  // Memory stores
  private workingMemory: WorkingMemory;
  private semanticMemory: Map<string, Memory>;
  private episodicMemory: Map<string, Memory>;
  private proceduralMemory: Map<string, Memory>;

  // Index for tagging
  private tagIndex: Map<string, Set<string>> = new Map();

  constructor(
    logger: Logger,
    config: Partial<MemoryConfig> = {}
  ) {
    this.logger = logger.child({ module: 'MemorySystem' });
    this.config = { ...DEFAULT_MEMORY_CONFIG, ...config };

    // Initialize memory stores
    this.workingMemory = {
      currentContext: [],
      attention: [],
      capacity: this.config.workingMemoryCapacity,
    };
    this.semanticMemory = new Map();
    this.episodicMemory = new Map();
    this.proceduralMemory = new Map();

    this.logger.info('Memory system initialized');
  }

  /**
   * Store a memory
   */
  async store(memory: Memory): Promise<string> {
    const store = this.getStore(memory.type);
    store.set(memory.id, memory);

    // Index tags
    if (memory.metadata.tags) {
      for (const tag of memory.metadata.tags) {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)!.add(memory.id);
      }
    }

    // Apply forgetting check
    await this.applyForgetting();

    this.logger.debug('Stored memory: ' + memory.id + ' (type: ' + memory.type + ')');
    return memory.id;
  }

  /**
   * Search memories
   */
  async search(query: MemoryQuery): Promise<MemoryResult[]> {
    const results: MemoryResult[] = [];

    // Get candidate memories
    let candidates: Memory[] = [];

    if (query.type) {
      const store = this.getStore(query.type);
      candidates = Array.from(store.values());
    } else {
      // Search all stores
      candidates = [
        ...Array.from(this.semanticMemory.values()),
        ...Array.from(this.episodicMemory.values()),
        ...Array.from(this.proceduralMemory.values()),
      ];
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      const taggedIds = new Set<string>();
      for (const tag of query.tags) {
        const ids = this.tagIndex.get(tag);
        if (ids) {
          ids.forEach(id => taggedIds.add(id));
        }
      }
      candidates = candidates.filter(m => taggedIds.has(m.id));
    }

    // Filter by importance
    if (query.minImportance !== undefined) {
      candidates = candidates.filter(
        m => (m.metadata.importance ?? 0) >= query.minImportance!
      );
    }

    // Score and rank
    for (const memory of candidates) {
      let score = this.calculateRelevance(memory, query);

      // Boost by importance
      const importanceBoost = (memory.metadata.importance ?? 0.5) * 0.2;
      score += importanceBoost;

      // Boost by recency
      const recencyBoost = this.calculateRecencyBoost(memory);
      score += recencyBoost;

      if (score >= this.config.minSimilarityScore) {
        results.push({
          memory,
          score: Math.min(1, score),
        });
      }
    }

    // Sort by score
    results.sort((a, b) => b.score - a.score);

    // Limit results
    const limit = query.limit ?? this.config.defaultSearchLimit;
    return results.slice(0, limit);
  }

  /**
   * Simple text-based search (Phase 2 MVP)
   * In production, use vector similarity with embeddings
   */
  async searchByText(text: string, limit: number = 10): Promise<MemoryResult[]> {
    const query: MemoryQuery = { text, limit };
    return this.search(query);
  }

  /**
   * Search for similar experiences
   */
  async findSimilarExperiences(
    situation: string,
    domain?: 'governance' | 'task' | 'reputation'
  ): Promise<ExperienceMemory[]> {
    const results = await this.search({
      type: MemoryType.EPISODIC,
      limit: 5,
    });

    // Filter by domain if specified
    let experiences = results.filter(
      r => r.memory.type === MemoryType.EPISODIC
    );

    if (domain) {
      experiences = experiences.filter(r => {
        const meta = r.memory.metadata as ExperienceMetadata;
        return meta.domain === domain;
      });
    }

    // Simple text matching (Phase 2 MVP)
    // In production, use semantic similarity
    const textLower = situation.toLowerCase();
    const filtered = experiences.filter(r =>
      r.memory.content.toLowerCase().includes(textLower)
    );

    // Cast to ExperienceMemory (we filtered by EPISODIC type)
    return filtered.map(r => r.memory as unknown as ExperienceMemory);
  }

  /**
   * Add to working memory
   */
  addToWorkingMemory(item: string): void {
    // Remove from context if already present
    const idx = this.workingMemory.currentContext.indexOf(item);
    if (idx !== -1) {
      this.workingMemory.currentContext.splice(idx, 1);
    }

    // Add to front
    this.workingMemory.currentContext.unshift(item);

    // Trim to capacity
    if (this.workingMemory.currentContext.length > this.workingMemory.capacity) {
      this.workingMemory.currentContext.pop();
    }

    this.logger.debug('Added to working memory: ' + item);
  }

  /**
   * Focus attention on item
   */
  focusAttention(item: string): void {
    if (!this.workingMemory.attention.includes(item)) {
      this.workingMemory.attention.push(item);
    }
  }

  /**
   * Clear working memory
   */
  clearWorkingMemory(): void {
    this.workingMemory.currentContext = [];
    this.workingMemory.attention = [];
    this.logger.debug('Working memory cleared');
  }

  /**
   * Get working memory contents
   */
  getWorkingMemory(): WorkingMemory {
    return { ...this.workingMemory };
  }

  /**
   * Update memory access time
   */
  async touchMemory(memoryId: string): Promise<void> {
    const allStores = [
      this.semanticMemory,
      this.episodicMemory,
      this.proceduralMemory,
    ];

    for (const store of allStores) {
      const memory = store.get(memoryId);
      if (memory) {
        memory.accessedAt = Date.now();
        memory.accessCount++;
        store.set(memoryId, memory);
        break;
      }
    }
  }

  /**
   * Delete a memory
   */
  async delete(memoryId: string): Promise<boolean> {
    const allStores = [
      this.semanticMemory,
      this.episodicMemory,
      this.proceduralMemory,
    ];

    for (const store of allStores) {
      if (store.has(memoryId)) {
        const memory = store.get(memoryId)!;

        // Remove from tag index
        if (memory.metadata.tags) {
          for (const tag of memory.metadata.tags) {
            const ids = this.tagIndex.get(tag);
            if (ids) {
              ids.delete(memoryId);
            }
          }
        }

        store.delete(memoryId);
        this.logger.debug('Deleted memory: ' + memoryId);
        return true;
      }
    }

    return false;
  }

  /**
   * Get memory statistics
   */
  getStats(): {
    semantic: number;
    episodic: number;
    procedural: number;
    working: number;
    totalTags: number;
  } {
    return {
      semantic: this.semanticMemory.size,
      episodic: this.episodicMemory.size,
      procedural: this.proceduralMemory.size,
      working: this.workingMemory.currentContext.length,
      totalTags: this.tagIndex.size,
    };
  }

  /**
   * Clear all memories
   */
  clear(): void {
    this.semanticMemory.clear();
    this.episodicMemory.clear();
    this.proceduralMemory.clear();
    this.tagIndex.clear();
    this.clearWorkingMemory();
    this.logger.info('All memories cleared');
  }

  // ==================== INTERNAL ====================

  private getStore(type: MemoryType): Map<string, Memory> {
    switch (type) {
      case MemoryType.SEMANTIC:
        return this.semanticMemory;
      case MemoryType.EPISODIC:
        return this.episodicMemory;
      case MemoryType.PROCEDURAL:
        return this.proceduralMemory;
      default:
        throw new Error('Unknown memory type: ' + type);
    }
  }

  private calculateRelevance(memory: Memory, query: MemoryQuery): number {
    // Phase 2 MVP: Simple scoring
    // In production, use vector similarity

    let score = 0.5; // Base score

    // Text matching
    if (query.text) {
      const textLower = query.text.toLowerCase();
      const contentLower = memory.content.toLowerCase();

      if (contentLower.includes(textLower)) {
        score += 0.3;
      }

      // Check metadata
      if (memory.metadata.source?.toLowerCase().includes(textLower)) {
        score += 0.1;
      }
    }

    return score;
  }

  private calculateRecencyBoost(memory: Memory): number {
    if (!memory.accessedAt) {
      return 0;
    }

    const ageInHours = (Date.now() - memory.accessedAt) / (1000 * 60 * 60);
    const hoursPerDay = 24;

    // Recent memories get boost
    if (ageInHours < hoursPerDay) {
      return 0.1;
    } else if (ageInHours < hoursPerDay * 7) {
      return 0.05;
    }

    return 0;
  }

  private async applyForgetting(): Promise<void> {
    const allStores = [
      this.semanticMemory,
      this.episodicMemory,
      this.proceduralMemory,
    ];

    const now = Date.now();
    const hoursPerDay = 24;

    for (const store of allStores) {
      const toDelete: string[] = [];

      for (const [id, memory] of store.entries()) {
        // Check expiration
        if (memory.metadata.expiresAt && now > memory.metadata.expiresAt) {
          toDelete.push(id);
          continue;
        }

        // Apply forgetting curve
        const importance = memory.metadata.importance ?? 0.5;
        const ageInDays = (now - memory.createdAt) / (1000 * 60 * 60 * hoursPerDay);

        let retention: number;
        if (this.config.forgettingCurve === 'exponential') {
          retention = Math.exp(-this.config.decayRate * ageInDays);
        } else {
          retention = Math.max(0, 1 - this.config.decayRate * ageInDays);
        }

        // Adjust by importance
        retention *= (0.5 + importance);

        if (retention < this.config.minRetentionThreshold) {
          toDelete.push(id);
        }
      }

      // Delete forgotten memories
      for (const id of toDelete) {
        await this.delete(id);
      }

      if (toDelete.length > 0) {
        this.logger.debug('Forgotten ' + toDelete.length + ' memories');
      }
    }

    // Enforce memory limit
    await this.enforceMemoryLimit();
  }

  private async enforceMemoryLimit(): Promise<void> {
    const allStores = [
      { store: this.semanticMemory, name: 'semantic' },
      { store: this.episodicMemory, name: 'episodic' },
      { store: this.proceduralMemory, name: 'procedural' },
    ];

    for (const { store, name } of allStores) {
      if (store.size > this.config.longTermMemoryLimit) {
        // Remove least important memories
        const memories = Array.from(store.values());
        memories.sort((a, b) => {
          const importanceA = a.metadata.importance ?? 0.5;
          const importanceB = b.metadata.importance ?? 0.5;
          return importanceA - importanceB;
        });

        const toRemove = store.size - this.config.longTermMemoryLimit;
        for (let i = 0; i < toRemove; i++) {
          await this.delete(memories[i].id);
        }

        this.logger.info('Enforced ' + name + ' memory limit, removed ' + toRemove + ' memories');
      }
    }
  }
}
