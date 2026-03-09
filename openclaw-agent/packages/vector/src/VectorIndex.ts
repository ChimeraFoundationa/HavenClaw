/**
 * VectorIndex - In-memory vector similarity search
 */

import { Logger } from '@havenclaw/tools';
import {
  VectorItem,
  SearchResult,
  VectorIndexConfig,
  DEFAULT_VECTOR_CONFIG,
} from './types.js';

/**
 * VectorIndex provides in-memory vector similarity search
 * 
 * For production use, replace with pgvector, Weaviate, or Pinecone
 */
export class VectorIndex {
  private config: VectorIndexConfig;
  private logger: Logger;
  private items: Map<string, VectorItem>;

  constructor(
    logger: Logger,
    config: Partial<VectorIndexConfig> = {}
  ) {
    this.logger = logger.child({ module: 'VectorIndex' });
    this.config = { ...DEFAULT_VECTOR_CONFIG, ...config };
    this.items = new Map();

    this.logger.info('VectorIndex initialized (' + this.config.dimensions + ' dimensions, ' + this.config.similarityMetric + ' similarity)');
  }

  /**
   * Add an item to the index
   */
  async add(item: VectorItem): Promise<void> {
    // Validate embedding dimensions
    if (item.embedding.length !== this.config.dimensions) {
      throw new Error(
        'Embedding dimension mismatch: expected ' + this.config.dimensions + 
        ', got ' + item.embedding.length
      );
    }

    // Enforce max items
    if (this.items.size >= this.config.maxItems) {
      await this.removeOldest();
    }

    this.items.set(item.id, item);
    this.logger.debug('Added vector item: ' + item.id);
  }

  /**
   * Add multiple items
   */
  async addBatch(items: VectorItem[]): Promise<void> {
    for (const item of items) {
      await this.add(item);
    }
    this.logger.info('Added ' + items.length + ' items in batch');
  }

  /**
   * Search for similar items
   */
  async search(
    queryEmbedding: number[],
    limit: number = 10,
    filter?: (metadata: Record<string, unknown>) => boolean
  ): Promise<SearchResult[]> {
    if (queryEmbedding.length !== this.config.dimensions) {
      throw new Error(
        'Query embedding dimension mismatch: expected ' + this.config.dimensions + 
        ', got ' + queryEmbedding.length
      );
    }

    const results: SearchResult[] = [];

    for (const item of this.items.values()) {
      // Apply filter if provided
      if (filter && !filter(item.metadata)) {
        continue;
      }

      // Calculate similarity
      const similarity = this.calculateSimilarity(queryEmbedding, item.embedding);
      const distance = 1 - similarity;

      results.push({
        item,
        score: similarity,
        distance,
      });
    }

    // Sort by score (descending)
    results.sort((a, b) => b.score - a.score);

    // Return top results
    return results.slice(0, limit);
  }

  /**
   * Search by text (requires embedding function)
   */
  async searchByText(
    text: string,
    embedFn: (text: string) => Promise<number[]>,
    limit: number = 10,
    filter?: (metadata: Record<string, unknown>) => boolean
  ): Promise<SearchResult[]> {
    const embedding = await embedFn(text);
    return this.search(embedding, limit, filter);
  }

  /**
   * Get an item by ID
   */
  get(id: string): VectorItem | undefined {
    return this.items.get(id);
  }

  /**
   * Remove an item
   */
  remove(id: string): boolean {
    const deleted = this.items.delete(id);
    if (deleted) {
      this.logger.debug('Removed vector item: ' + id);
    }
    return deleted;
  }

  /**
   * Clear all items
   */
  clear(): void {
    this.items.clear();
    this.logger.info('VectorIndex cleared');
  }

  /**
   * Get index statistics
   */
  getStats(): {
    itemCount: number;
    dimensions: number;
    similarityMetric: string;
    memoryUsage: number; // Approximate bytes
  } {
    const item = this.items.values().next().value;
    const bytesPerItem = item ? (item.embedding.length * 8) + 100 : 0; // Float64 + overhead

    return {
      itemCount: this.items.size,
      dimensions: this.config.dimensions,
      similarityMetric: this.config.similarityMetric,
      memoryUsage: this.items.size * bytesPerItem,
    };
  }

  /**
   * Get all items (for export/persistence)
   */
  getAll(): VectorItem[] {
    return Array.from(this.items.values());
  }

  // ==================== INTERNAL METHODS ====================

  private calculateSimilarity(a: number[], b: number[]): number {
    switch (this.config.similarityMetric) {
      case 'cosine':
        return this.cosineSimilarity(a, b);
      case 'dot':
        return this.dotProduct(a, b);
      case 'euclidean':
        return this.euclideanSimilarity(a, b);
      default:
        return this.cosineSimilarity(a, b);
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
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

  private dotProduct(a: number[], b: number[]): number {
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result += a[i] * b[i];
    }
    return result;
  }

  private euclideanSimilarity(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }
    // Convert distance to similarity (0-1 range)
    return 1 / (1 + Math.sqrt(sum));
  }

  private async removeOldest(): Promise<void> {
    // Find oldest item
    let oldestId: string | null = null;
    let oldestTime = Infinity;

    for (const [id, item] of this.items.entries()) {
      if (item.createdAt < oldestTime) {
        oldestTime = item.createdAt;
        oldestId = id;
      }
    }

    if (oldestId) {
      this.items.delete(oldestId);
      this.logger.debug('Removed oldest item to make room: ' + oldestId);
    }
  }
}

/**
 * Utility functions for vector operations
 */
export function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (magnitude === 0) {
    return vector;
  }
  return vector.map(v => v / magnitude);
}

export function cosineSimilarity(a: number[], b: number[]): number {
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

export function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}
