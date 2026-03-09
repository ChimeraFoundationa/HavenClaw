/**
 * @havenclaw/vector - Vector search for OpenClaw agents
 *
 * @packageDocumentation
 */

export {
  // Core
  VectorIndex,
  normalizeVector,
  cosineSimilarity,
  euclideanDistance,
} from './VectorIndex.js';
export {
  // Types
  DEFAULT_VECTOR_CONFIG,
} from './types.js';
export type {
  VectorItem,
  SearchResult,
  VectorIndexConfig,
  BatchEmbedRequest,
  BatchEmbedResponse,
} from './types.js';
