/**
 * LLM Integration Types
 */

/**
 * LLM Provider types
 */
export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'local';

/**
 * Chat message structure
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

/**
 * LLM completion request
 */
export interface CompletionRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
}

/**
 * LLM completion response
 */
export interface CompletionResponse {
  id: string;
  model: string;
  content: string;
  usage: TokenUsage;
  finishReason: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * LLM Provider configuration
 */
export interface LLMConfig {
  provider: LLMProvider;
  apiKey?: string;
  baseUrl?: string;
  model: string;
  defaultTemperature: number;
  defaultMaxTokens: number;
  timeout: number; // ms
  maxRetries: number;
}

export const DEFAULT_LLM_CONFIG: Record<LLMProvider, LLMConfig> = {
  openai: {
    provider: 'openai',
    apiKey: undefined,
    model: 'gpt-4o-mini',
    defaultTemperature: 0.3,
    defaultMaxTokens: 2000,
    timeout: 30000,
    maxRetries: 3,
  },
  anthropic: {
    provider: 'anthropic',
    apiKey: undefined,
    model: 'claude-3-haiku-20240307',
    defaultTemperature: 0.3,
    defaultMaxTokens: 2000,
    timeout: 30000,
    maxRetries: 3,
  },
  google: {
    provider: 'google',
    apiKey: undefined,
    model: 'gemini-2.5-flash',
    defaultTemperature: 0.3,
    defaultMaxTokens: 2000,
    timeout: 30000,
    maxRetries: 3,
  },
  local: {
    provider: 'local',
    apiKey: undefined,
    baseUrl: 'http://localhost:11434',
    model: 'llama2',
    defaultTemperature: 0.3,
    defaultMaxTokens: 2000,
    timeout: 60000,
    maxRetries: 1,
  },
};

/**
 * Load LLM configuration from environment variables
 *
 * Environment variables:
 * - LLM_PROVIDER: openai | anthropic | google | local
 * - OPENAI_API_KEY: OpenAI API key
 * - ANTHROPIC_API_KEY: Anthropic API key
 * - GOOGLE_API_KEY: Google API key
 * - LLM_MODEL: Custom model name
 * - LLM_BASE_URL: Custom base URL (for local providers)
 * - LLM_TEMPERATURE: Default temperature
 * - LLM_MAX_TOKENS: Default max tokens
 */
export function loadLLMConfigFromEnv(): Partial<LLMConfig> {
  const provider = (process.env.LLM_PROVIDER as LLMProvider) || 'openai';
  const config: Partial<LLMConfig> = {
    provider,
  };

  // Load API keys based on provider
  if (provider === 'openai') {
    config.apiKey = process.env.OPENAI_API_KEY;
  } else if (provider === 'anthropic') {
    config.apiKey = process.env.ANTHROPIC_API_KEY;
  } else if (provider === 'google') {
    config.apiKey = process.env.GOOGLE_API_KEY;
  }

  // Load optional overrides
  if (process.env.LLM_MODEL) {
    config.model = process.env.LLM_MODEL;
  }
  if (process.env.LLM_BASE_URL) {
    config.baseUrl = process.env.LLM_BASE_URL;
  }
  if (process.env.LLM_TEMPERATURE) {
    config.defaultTemperature = parseFloat(process.env.LLM_TEMPERATURE);
  }
  if (process.env.LLM_MAX_TOKENS) {
    config.defaultMaxTokens = parseInt(process.env.LLM_MAX_TOKENS, 10);
  }

  return config;
}

/**
 * Structured output schema
 */
export interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required?: boolean;
  items?: SchemaField; // For arrays
  properties?: SchemaField[]; // For objects
}

export interface StructuredOutputRequest extends CompletionRequest {
  schema: SchemaField[];
}

/**
 * Embedding request and response
 */
export interface EmbeddingRequest {
  text: string;
  model?: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

/**
 * LLM Analysis types for governance
 */
export interface ProposalAnalysis {
  summary: string;
  keyPoints: string[];
  pros: string[];
  cons: string[];
  risks: string[];
  recommendation: 'for' | 'against' | 'abstain';
  confidence: number;
  reasoning: string;
}

export interface TaskAnalysis {
  summary: string;
  complexity: 'low' | 'medium' | 'high';
  requiredSkills: string[];
  estimatedEffort: string;
  risks: string[];
  recommendation: 'accept' | 'decline';
  confidence: number;
  reasoning?: string;
}
