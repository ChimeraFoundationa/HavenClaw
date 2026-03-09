// src/types.ts
var DEFAULT_VECTOR_CONFIG = {
  dimensions: 1536,
  // OpenAI embedding size
  similarityMetric: "cosine",
  maxItems: 1e4,
  persistencePath: void 0
};

// src/VectorIndex.ts
var VectorIndex = class {
  config;
  logger;
  items;
  constructor(logger, config = {}) {
    this.logger = logger.child({ module: "VectorIndex" });
    this.config = { ...DEFAULT_VECTOR_CONFIG, ...config };
    this.items = /* @__PURE__ */ new Map();
    this.logger.info("VectorIndex initialized (" + this.config.dimensions + " dimensions, " + this.config.similarityMetric + " similarity)");
  }
  /**
   * Add an item to the index
   */
  async add(item) {
    if (item.embedding.length !== this.config.dimensions) {
      throw new Error(
        "Embedding dimension mismatch: expected " + this.config.dimensions + ", got " + item.embedding.length
      );
    }
    if (this.items.size >= this.config.maxItems) {
      await this.removeOldest();
    }
    this.items.set(item.id, item);
    this.logger.debug("Added vector item: " + item.id);
  }
  /**
   * Add multiple items
   */
  async addBatch(items) {
    for (const item of items) {
      await this.add(item);
    }
    this.logger.info("Added " + items.length + " items in batch");
  }
  /**
   * Search for similar items
   */
  async search(queryEmbedding, limit = 10, filter) {
    if (queryEmbedding.length !== this.config.dimensions) {
      throw new Error(
        "Query embedding dimension mismatch: expected " + this.config.dimensions + ", got " + queryEmbedding.length
      );
    }
    const results = [];
    for (const item of this.items.values()) {
      if (filter && !filter(item.metadata)) {
        continue;
      }
      const similarity = this.calculateSimilarity(queryEmbedding, item.embedding);
      const distance = 1 - similarity;
      results.push({
        item,
        score: similarity,
        distance
      });
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }
  /**
   * Search by text (requires embedding function)
   */
  async searchByText(text, embedFn, limit = 10, filter) {
    const embedding = await embedFn(text);
    return this.search(embedding, limit, filter);
  }
  /**
   * Get an item by ID
   */
  get(id) {
    return this.items.get(id);
  }
  /**
   * Remove an item
   */
  remove(id) {
    const deleted = this.items.delete(id);
    if (deleted) {
      this.logger.debug("Removed vector item: " + id);
    }
    return deleted;
  }
  /**
   * Clear all items
   */
  clear() {
    this.items.clear();
    this.logger.info("VectorIndex cleared");
  }
  /**
   * Get index statistics
   */
  getStats() {
    const item = this.items.values().next().value;
    const bytesPerItem = item ? item.embedding.length * 8 + 100 : 0;
    return {
      itemCount: this.items.size,
      dimensions: this.config.dimensions,
      similarityMetric: this.config.similarityMetric,
      memoryUsage: this.items.size * bytesPerItem
    };
  }
  /**
   * Get all items (for export/persistence)
   */
  getAll() {
    return Array.from(this.items.values());
  }
  // ==================== INTERNAL METHODS ====================
  calculateSimilarity(a, b) {
    switch (this.config.similarityMetric) {
      case "cosine":
        return this.cosineSimilarity(a, b);
      case "dot":
        return this.dotProduct(a, b);
      case "euclidean":
        return this.euclideanSimilarity(a, b);
      default:
        return this.cosineSimilarity(a, b);
    }
  }
  cosineSimilarity(a, b) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) {
      return 0;
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  dotProduct(a, b) {
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result += a[i] * b[i];
    }
    return result;
  }
  euclideanSimilarity(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }
    return 1 / (1 + Math.sqrt(sum));
  }
  async removeOldest() {
    let oldestId = null;
    let oldestTime = Infinity;
    for (const [id, item] of this.items.entries()) {
      if (item.createdAt < oldestTime) {
        oldestTime = item.createdAt;
        oldestId = id;
      }
    }
    if (oldestId) {
      this.items.delete(oldestId);
      this.logger.debug("Removed oldest item to make room: " + oldestId);
    }
  }
};
function normalizeVector(vector) {
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (magnitude === 0) {
    return vector;
  }
  return vector.map((v) => v / magnitude);
}
function cosineSimilarity(a, b) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) {
    return 0;
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
function euclideanDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}
export {
  DEFAULT_VECTOR_CONFIG,
  VectorIndex,
  cosineSimilarity,
  euclideanDistance,
  normalizeVector
};
