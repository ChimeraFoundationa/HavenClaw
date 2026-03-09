// src/types.ts
var MemoryType = /* @__PURE__ */ ((MemoryType2) => {
  MemoryType2["SEMANTIC"] = "semantic";
  MemoryType2["EPISODIC"] = "episodic";
  MemoryType2["PROCEDURAL"] = "procedural";
  return MemoryType2;
})(MemoryType || {});
var DEFAULT_MEMORY_CONFIG = {
  workingMemoryCapacity: 7,
  // Miller's number
  longTermMemoryLimit: 1e3,
  forgettingCurve: "exponential",
  decayRate: 0.1,
  minRetentionThreshold: 0.2,
  defaultSearchLimit: 10,
  minSimilarityScore: 0.7,
  persistencePath: void 0
};

// src/MemorySystem.ts
var MemorySystem = class {
  config;
  logger;
  // Memory stores
  workingMemory;
  semanticMemory;
  episodicMemory;
  proceduralMemory;
  // Index for tagging
  tagIndex = /* @__PURE__ */ new Map();
  constructor(logger, config = {}) {
    this.logger = logger.child({ module: "MemorySystem" });
    this.config = { ...DEFAULT_MEMORY_CONFIG, ...config };
    this.workingMemory = {
      currentContext: [],
      attention: [],
      capacity: this.config.workingMemoryCapacity
    };
    this.semanticMemory = /* @__PURE__ */ new Map();
    this.episodicMemory = /* @__PURE__ */ new Map();
    this.proceduralMemory = /* @__PURE__ */ new Map();
    this.logger.info("Memory system initialized");
  }
  /**
   * Store a memory
   */
  async store(memory) {
    const store = this.getStore(memory.type);
    store.set(memory.id, memory);
    if (memory.metadata.tags) {
      for (const tag of memory.metadata.tags) {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, /* @__PURE__ */ new Set());
        }
        this.tagIndex.get(tag).add(memory.id);
      }
    }
    await this.applyForgetting();
    this.logger.debug("Stored memory: " + memory.id + " (type: " + memory.type + ")");
    return memory.id;
  }
  /**
   * Search memories
   */
  async search(query) {
    const results = [];
    let candidates = [];
    if (query.type) {
      const store = this.getStore(query.type);
      candidates = Array.from(store.values());
    } else {
      candidates = [
        ...Array.from(this.semanticMemory.values()),
        ...Array.from(this.episodicMemory.values()),
        ...Array.from(this.proceduralMemory.values())
      ];
    }
    if (query.tags && query.tags.length > 0) {
      const taggedIds = /* @__PURE__ */ new Set();
      for (const tag of query.tags) {
        const ids = this.tagIndex.get(tag);
        if (ids) {
          ids.forEach((id) => taggedIds.add(id));
        }
      }
      candidates = candidates.filter((m) => taggedIds.has(m.id));
    }
    if (query.minImportance !== void 0) {
      candidates = candidates.filter(
        (m) => (m.metadata.importance ?? 0) >= query.minImportance
      );
    }
    for (const memory of candidates) {
      let score = this.calculateRelevance(memory, query);
      const importanceBoost = (memory.metadata.importance ?? 0.5) * 0.2;
      score += importanceBoost;
      const recencyBoost = this.calculateRecencyBoost(memory);
      score += recencyBoost;
      if (score >= this.config.minSimilarityScore) {
        results.push({
          memory,
          score: Math.min(1, score)
        });
      }
    }
    results.sort((a, b) => b.score - a.score);
    const limit = query.limit ?? this.config.defaultSearchLimit;
    return results.slice(0, limit);
  }
  /**
   * Simple text-based search (Phase 2 MVP)
   * In production, use vector similarity with embeddings
   */
  async searchByText(text, limit = 10) {
    const query = { text, limit };
    return this.search(query);
  }
  /**
   * Search for similar experiences
   */
  async findSimilarExperiences(situation, domain) {
    const results = await this.search({
      type: "episodic" /* EPISODIC */,
      limit: 5
    });
    let experiences = results.filter(
      (r) => r.memory.type === "episodic" /* EPISODIC */
    );
    if (domain) {
      experiences = experiences.filter((r) => {
        const meta = r.memory.metadata;
        return meta.domain === domain;
      });
    }
    const textLower = situation.toLowerCase();
    const filtered = experiences.filter(
      (r) => r.memory.content.toLowerCase().includes(textLower)
    );
    return filtered.map((r) => r.memory);
  }
  /**
   * Add to working memory
   */
  addToWorkingMemory(item) {
    const idx = this.workingMemory.currentContext.indexOf(item);
    if (idx !== -1) {
      this.workingMemory.currentContext.splice(idx, 1);
    }
    this.workingMemory.currentContext.unshift(item);
    if (this.workingMemory.currentContext.length > this.workingMemory.capacity) {
      this.workingMemory.currentContext.pop();
    }
    this.logger.debug("Added to working memory: " + item);
  }
  /**
   * Focus attention on item
   */
  focusAttention(item) {
    if (!this.workingMemory.attention.includes(item)) {
      this.workingMemory.attention.push(item);
    }
  }
  /**
   * Clear working memory
   */
  clearWorkingMemory() {
    this.workingMemory.currentContext = [];
    this.workingMemory.attention = [];
    this.logger.debug("Working memory cleared");
  }
  /**
   * Get working memory contents
   */
  getWorkingMemory() {
    return { ...this.workingMemory };
  }
  /**
   * Update memory access time
   */
  async touchMemory(memoryId) {
    const allStores = [
      this.semanticMemory,
      this.episodicMemory,
      this.proceduralMemory
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
  async delete(memoryId) {
    const allStores = [
      this.semanticMemory,
      this.episodicMemory,
      this.proceduralMemory
    ];
    for (const store of allStores) {
      if (store.has(memoryId)) {
        const memory = store.get(memoryId);
        if (memory.metadata.tags) {
          for (const tag of memory.metadata.tags) {
            const ids = this.tagIndex.get(tag);
            if (ids) {
              ids.delete(memoryId);
            }
          }
        }
        store.delete(memoryId);
        this.logger.debug("Deleted memory: " + memoryId);
        return true;
      }
    }
    return false;
  }
  /**
   * Get memory statistics
   */
  getStats() {
    return {
      semantic: this.semanticMemory.size,
      episodic: this.episodicMemory.size,
      procedural: this.proceduralMemory.size,
      working: this.workingMemory.currentContext.length,
      totalTags: this.tagIndex.size
    };
  }
  /**
   * Clear all memories
   */
  clear() {
    this.semanticMemory.clear();
    this.episodicMemory.clear();
    this.proceduralMemory.clear();
    this.tagIndex.clear();
    this.clearWorkingMemory();
    this.logger.info("All memories cleared");
  }
  // ==================== INTERNAL ====================
  getStore(type) {
    switch (type) {
      case "semantic" /* SEMANTIC */:
        return this.semanticMemory;
      case "episodic" /* EPISODIC */:
        return this.episodicMemory;
      case "procedural" /* PROCEDURAL */:
        return this.proceduralMemory;
      default:
        throw new Error("Unknown memory type: " + type);
    }
  }
  calculateRelevance(memory, query) {
    let score = 0.5;
    if (query.text) {
      const textLower = query.text.toLowerCase();
      const contentLower = memory.content.toLowerCase();
      if (contentLower.includes(textLower)) {
        score += 0.3;
      }
      if (memory.metadata.source?.toLowerCase().includes(textLower)) {
        score += 0.1;
      }
    }
    return score;
  }
  calculateRecencyBoost(memory) {
    if (!memory.accessedAt) {
      return 0;
    }
    const ageInHours = (Date.now() - memory.accessedAt) / (1e3 * 60 * 60);
    const hoursPerDay = 24;
    if (ageInHours < hoursPerDay) {
      return 0.1;
    } else if (ageInHours < hoursPerDay * 7) {
      return 0.05;
    }
    return 0;
  }
  async applyForgetting() {
    const allStores = [
      this.semanticMemory,
      this.episodicMemory,
      this.proceduralMemory
    ];
    const now = Date.now();
    const hoursPerDay = 24;
    for (const store of allStores) {
      const toDelete = [];
      for (const [id, memory] of store.entries()) {
        if (memory.metadata.expiresAt && now > memory.metadata.expiresAt) {
          toDelete.push(id);
          continue;
        }
        const importance = memory.metadata.importance ?? 0.5;
        const ageInDays = (now - memory.createdAt) / (1e3 * 60 * 60 * hoursPerDay);
        let retention;
        if (this.config.forgettingCurve === "exponential") {
          retention = Math.exp(-this.config.decayRate * ageInDays);
        } else {
          retention = Math.max(0, 1 - this.config.decayRate * ageInDays);
        }
        retention *= 0.5 + importance;
        if (retention < this.config.minRetentionThreshold) {
          toDelete.push(id);
        }
      }
      for (const id of toDelete) {
        await this.delete(id);
      }
      if (toDelete.length > 0) {
        this.logger.debug("Forgotten " + toDelete.length + " memories");
      }
    }
    await this.enforceMemoryLimit();
  }
  async enforceMemoryLimit() {
    const allStores = [
      { store: this.semanticMemory, name: "semantic" },
      { store: this.episodicMemory, name: "episodic" },
      { store: this.proceduralMemory, name: "procedural" }
    ];
    for (const { store, name } of allStores) {
      if (store.size > this.config.longTermMemoryLimit) {
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
        this.logger.info("Enforced " + name + " memory limit, removed " + toRemove + " memories");
      }
    }
  }
};
export {
  DEFAULT_MEMORY_CONFIG,
  MemorySystem,
  MemoryType
};
