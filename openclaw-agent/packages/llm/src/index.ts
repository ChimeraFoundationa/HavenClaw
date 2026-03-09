/**
 * @havenclaw/llm - LLM integration for OpenClaw agents
 *
 * Supports:
 * - OpenAI (GPT-4, GPT-4o, GPT-3.5)
 * - Anthropic (Claude 3 family)
 * - Google (Gemini 1.5)
 * - Local models (Ollama, vLLM, etc.)
 *
 * @packageDocumentation
 */

export {
  // Core
  LLMClient,
} from './LLMClient.js';
export {
  // Types and utilities
  DEFAULT_LLM_CONFIG,
  loadLLMConfigFromEnv,
} from './types.js';
export type {
  LLMConfig,
  LLMProvider,
  ChatMessage,
  CompletionRequest,
  CompletionResponse,
  TokenUsage,
  EmbeddingRequest,
  EmbeddingResponse,
  ProposalAnalysis,
  TaskAnalysis,
  SchemaField,
  StructuredOutputRequest,
} from './types.js';
