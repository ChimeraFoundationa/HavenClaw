import { Logger } from '@havenclaw/tools';

/**
 * Vector Search Types
 */
/**
 * Vector index item
 */
interface VectorItem {
    id: string;
    embedding: number[];
    metadata: Record<string, unknown>;
    createdAt: number;
}
/**
 * Search result with similarity score
 */
interface SearchResult {
    item: VectorItem;
    score: number;
    distance: number;
}
/**
 * Vector index configuration
 */
interface VectorIndexConfig {
    dimensions: number;
    similarityMetric: 'cosine' | 'dot' | 'euclidean';
    maxItems: number;
    persistencePath?: string;
}
declare const DEFAULT_VECTOR_CONFIG: VectorIndexConfig;
/**
 * Batch embedding request
 */
interface BatchEmbedRequest {
    texts: string[];
    model?: string;
}
interface BatchEmbedResponse {
    embeddings: number[][];
    model: string;
    usage: {
        totalTokens: number;
    };
}

/**
 * VectorIndex - In-memory vector similarity search
 */

/**
 * VectorIndex provides in-memory vector similarity search
 *
 * For production use, replace with pgvector, Weaviate, or Pinecone
 */
declare class VectorIndex {
    private config;
    private logger;
    private items;
    constructor(logger: Logger, config?: Partial<VectorIndexConfig>);
    /**
     * Add an item to the index
     */
    add(item: VectorItem): Promise<void>;
    /**
     * Add multiple items
     */
    addBatch(items: VectorItem[]): Promise<void>;
    /**
     * Search for similar items
     */
    search(queryEmbedding: number[], limit?: number, filter?: (metadata: Record<string, unknown>) => boolean): Promise<SearchResult[]>;
    /**
     * Search by text (requires embedding function)
     */
    searchByText(text: string, embedFn: (text: string) => Promise<number[]>, limit?: number, filter?: (metadata: Record<string, unknown>) => boolean): Promise<SearchResult[]>;
    /**
     * Get an item by ID
     */
    get(id: string): VectorItem | undefined;
    /**
     * Remove an item
     */
    remove(id: string): boolean;
    /**
     * Clear all items
     */
    clear(): void;
    /**
     * Get index statistics
     */
    getStats(): {
        itemCount: number;
        dimensions: number;
        similarityMetric: string;
        memoryUsage: number;
    };
    /**
     * Get all items (for export/persistence)
     */
    getAll(): VectorItem[];
    private calculateSimilarity;
    private cosineSimilarity;
    private dotProduct;
    private euclideanSimilarity;
    private removeOldest;
}
/**
 * Utility functions for vector operations
 */
declare function normalizeVector(vector: number[]): number[];
declare function cosineSimilarity(a: number[], b: number[]): number;
declare function euclideanDistance(a: number[], b: number[]): number;

export { type BatchEmbedRequest, type BatchEmbedResponse, DEFAULT_VECTOR_CONFIG, type SearchResult, VectorIndex, type VectorIndexConfig, type VectorItem, cosineSimilarity, euclideanDistance, normalizeVector };
