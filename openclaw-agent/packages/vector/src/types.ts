/**
 * Vector Search Types
 */

/**
 * Vector index item
 */
export interface VectorItem {
  id: string;
  embedding: number[];
  metadata: Record<string, unknown>;
  createdAt: number;
}

/**
 * Search result with similarity score
 */
export interface SearchResult {
  item: VectorItem;
  score: number; // 0-1, higher = more similar
  distance: number; // Actual distance metric value
}

/**
 * Vector index configuration
 */
export interface VectorIndexConfig {
  dimensions: number;
  similarityMetric: 'cosine' | 'dot' | 'euclidean';
  maxItems: number;
  persistencePath?: string;
}

export const DEFAULT_VECTOR_CONFIG: VectorIndexConfig = {
  dimensions: 1536, // OpenAI embedding size
  similarityMetric: 'cosine',
  maxItems: 10000,
  persistencePath: undefined,
};

/**
 * Batch embedding request
 */
export interface BatchEmbedRequest {
  texts: string[];
  model?: string;
}

export interface BatchEmbedResponse {
  embeddings: number[][];
  model: string;
  usage: {
    totalTokens: number;
  };
}
