/**
 * LLM Client - Unified interface for LLM providers using official SDKs
 *
 * Supports:
 * - OpenAI (GPT-4, GPT-4o, GPT-3.5)
 * - Anthropic (Claude 3 family)
 * - Google (Gemini 1.5)
 * - Local models (Ollama, vLLM, etc.)
 */

import { Logger } from '@havenclaw/tools';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  LLMConfig,
  DEFAULT_LLM_CONFIG,
  LLMProvider,
  ChatMessage,
  CompletionRequest,
  CompletionResponse,
  TokenUsage,
  EmbeddingRequest,
  EmbeddingResponse,
  ProposalAnalysis,
  TaskAnalysis,
} from './types.js';

/**
 * LLMClient provides unified access to multiple LLM providers using official SDKs
 */
export class LLMClient {
  private config: LLMConfig;
  private logger: Logger;

  // SDK clients (lazy initialized)
  private openaiClient?: OpenAI;
  private anthropicClient?: Anthropic;
  private googleClient?: GoogleGenerativeAI;

  constructor(
    logger: Logger,
    config: Partial<LLMConfig>
  ) {
    this.logger = logger.child({ module: 'LLMClient' });

    // Merge with defaults based on provider
    const provider = config.provider || 'openai';
    const defaults = DEFAULT_LLM_CONFIG[provider];
    this.config = { ...defaults, ...config };

    // Validate API key
    if (this.config.provider !== 'local' && !this.config.apiKey) {
      this.logger.warn('LLM API key not configured. Some features may not work.');
    }

    // Initialize SDK clients
    this.initializeClients();

    this.logger.info('LLM Client initialized with provider: ' + this.config.provider);
  }

  /**
   * Initialize SDK clients based on provider
   */
  private initializeClients(): void {
    // OpenAI client
    if (this.config.provider === 'openai' && this.config.apiKey) {
      this.openaiClient = new OpenAI({
        apiKey: this.config.apiKey,
        timeout: this.config.timeout,
        maxRetries: this.config.maxRetries,
      });
      this.logger.debug('OpenAI SDK client initialized');
    }

    // Anthropic client
    if (this.config.provider === 'anthropic' && this.config.apiKey) {
      this.anthropicClient = new Anthropic({
        apiKey: this.config.apiKey,
        timeout: this.config.timeout,
        maxRetries: this.config.maxRetries,
      });
      this.logger.debug('Anthropic SDK client initialized');
    }

    // Google client
    if (this.config.provider === 'google' && this.config.apiKey) {
      this.googleClient = new GoogleGenerativeAI(this.config.apiKey);
      this.logger.debug('Google Generative AI client initialized');
    }
  }

  /**
   * Generate a completion
   */
  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const messages = request.messages;
    const model = request.model || this.config.model;
    const temperature = request.temperature ?? this.config.defaultTemperature;
    const maxTokens = request.maxTokens ?? this.config.defaultMaxTokens;

    this.logger.debug('Generating completion with ' + messages.length + ' messages');

    try {
      let response: CompletionResponse;

      switch (this.config.provider) {
        case 'openai':
          response = await this.completeOpenAI(messages, model, temperature, maxTokens);
          break;
        case 'anthropic':
          response = await this.completeAnthropic(messages, model, temperature, maxTokens);
          break;
        case 'google':
          response = await this.completeGoogle(messages, model, temperature, maxTokens);
          break;
        case 'local':
          response = await this.completeLocal(messages, model, temperature, maxTokens);
          break;
        default:
          throw new Error('Unknown provider: ' + this.config.provider);
      }

      this.logger.debug('Completion generated: ' + response.content.length + ' chars');
      return response;
    } catch (error) {
      this.logger.error('Completion failed', error as Error);
      throw error;
    }
  }

  /**
   * Generate embeddings for text
   */
  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    this.logger.debug('Generating embedding for text');

    try {
      switch (this.config.provider) {
        case 'openai':
          return this.embedOpenAI(request.text, request.model);
        default:
          throw new Error('Embeddings not supported for provider: ' + this.config.provider);
      }
    } catch (error) {
      this.logger.error('Embedding generation failed', error as Error);
      throw error;
    }
  }

  /**
   * Analyze a governance proposal
   */
  async analyzeProposal(proposalText: string): Promise<ProposalAnalysis> {
    const systemPrompt = `You are an expert governance analyst for a decentralized autonomous organization (DAO).
Analyze the following proposal and provide a structured assessment.

Your analysis should include:
1. A concise summary
2. Key points of the proposal
3. Arguments in favor (pros)
4. Arguments against (cons)
5. Potential risks
6. A clear recommendation (for/against/abstain)
7. Your confidence level (0-1)
8. Detailed reasoning for your recommendation

Be objective, thorough, and consider both short-term and long-term impacts.`;

    const response = await this.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Please analyze this governance proposal:\n\n' + proposalText },
      ],
      temperature: 0.2,
      maxTokens: 2500,
    });

    return this.parseProposalAnalysis(response.content);
  }

  /**
   * Analyze a task opportunity
   */
  async analyzeTask(taskDescription: string, agentCapabilities: string[]): Promise<TaskAnalysis> {
    const systemPrompt = `You are an expert task analyst for an autonomous AI agent.
Analyze the following task opportunity and determine if the agent should accept it.

Consider:
1. Task complexity and requirements
2. Agent's capabilities match
3. Estimated effort and reward
4. Potential risks
5. Strategic value

Provide a clear recommendation and confidence level.`;

    const capabilitiesStr = agentCapabilities.join(', ');

    const response = await this.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: 'Task: ' + taskDescription + '\n\nAgent capabilities: ' + capabilitiesStr,
        },
      ],
      temperature: 0.2,
      maxTokens: 1500,
    });

    return this.parseTaskAnalysis(response.content);
  }

  /**
   * Extract structured data from text
   */
  async extractStructured(text: string, schema: string): Promise<Record<string, unknown>> {
    const systemPrompt = `Extract the following information from the text and return as JSON.
Schema: ` + schema + '\n\nReturn only valid JSON, no other text.';

    const response = await this.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      temperature: 0,
      maxTokens: 1000,
    });

    // Parse JSON from response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Failed to extract structured data');
  }

  /**
   * Summarize text
   */
  async summarize(text: string, maxLength: number = 200): Promise<string> {
    const response = await this.complete({
      messages: [
        { role: 'system', content: 'Summarize the following text concisely in at most ' + maxLength + ' words.' },
        { role: 'user', content: text },
      ],
      temperature: 0.3,
      maxTokens: 300,
    });

    return response.content.trim();
  }

  /**
   * Classify text into categories
   */
  async classify(text: string, categories: string[]): Promise<{ category: string; confidence: number }> {
    const categoriesStr = categories.join(', ');

    const response = await this.complete({
      messages: [
        {
          role: 'system',
          content: 'Classify the text into one of these categories: ' + categoriesStr + '. Return JSON: {"category": "...", "confidence": 0.X}',
        },
        { role: 'user', content: text },
      ],
      temperature: 0,
      maxTokens: 100,
    });

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Failed to classify text');
  }

  // ==================== OPENAI PROVIDER ====================

  private async completeOpenAI(
    messages: ChatMessage[],
    model: string,
    temperature: number,
    maxTokens: number
  ): Promise<CompletionResponse> {
    if (!this.openaiClient) {
      // Return mock response for development
      return this.mockCompletion(model);
    }

    const response = await this.openaiClient.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    });

    return {
      id: response.id,
      model: response.model,
      content: response.choices[0]?.message?.content || '',
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      finishReason: response.choices[0]?.finish_reason || 'stop',
    };
  }

  private async embedOpenAI(text: string, model?: string): Promise<EmbeddingResponse> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized. Check API key configuration.');
    }

    const response = await this.openaiClient.embeddings.create({
      model: model || 'text-embedding-3-small',
      input: text,
    });

    return {
      embedding: response.data[0]?.embedding || [],
      model: model || 'text-embedding-3-small',
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
    };
  }

  // ==================== ANTHROPIC PROVIDER ====================

  private async completeAnthropic(
    messages: ChatMessage[],
    model: string,
    temperature: number,
    maxTokens: number
  ): Promise<CompletionResponse> {
    if (!this.anthropicClient) {
      return this.mockCompletion(model);
    }

    // Convert messages to Anthropic format
    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

    const formattedMessages: Anthropic.MessageParam[] = userMessages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

    const response = await this.anthropicClient.messages.create({
      model,
      system: systemMessage?.content,
      messages: formattedMessages,
      max_tokens: maxTokens,
      temperature,
    });

    const textContent = response.content.find(c => c.type === 'text');

    return {
      id: response.id,
      model: response.model,
      content: textContent?.text || '',
      usage: {
        promptTokens: response.usage?.input_tokens || 0,
        completionTokens: response.usage?.output_tokens || 0,
        totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
      },
      finishReason: response.stop_reason || 'end_turn',
    };
  }

  // ==================== GOOGLE PROVIDER ====================

  private async completeGoogle(
    messages: ChatMessage[],
    model: string,
    temperature: number,
    maxTokens: number
  ): Promise<CompletionResponse> {
    if (!this.googleClient) {
      return this.mockCompletion(model);
    }

    // Google uses a different message format
    // Model name should be just the model identifier (e.g., 'gemini-1.5-flash')
    const geminiModel = this.googleClient.getGenerativeModel({
      model: model.replace('models/', ''),
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    });

    // Convert messages to Gemini format
    // Gemini uses a conversation history format
    const chat = geminiModel.startChat();

    // Process messages (Gemini doesn't have system messages, so we prepend to first user message)
    let systemPrompt = '';
    const userMessages: string[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemPrompt = msg.content + '\n\n';
      } else if (msg.role === 'user') {
        userMessages.push(systemPrompt + msg.content);
        systemPrompt = ''; // Clear after first user message
      } else if (msg.role === 'assistant') {
        // Skip assistant messages for simple completion
      }
    }

    // Send the last user message
    const result = await chat.sendMessage(userMessages[userMessages.length - 1] || '');
    const response = await result.response;

    return {
      id: 'gemini-' + Date.now().toString(),
      model,
      content: response.text(),
      usage: {
        promptTokens: 0, // Google doesn't provide token usage in this API version
        completionTokens: 0,
        totalTokens: 0,
      },
      finishReason: response.candidates?.[0]?.finishReason?.toString() || 'stop',
    };
  }

  // ==================== LOCAL PROVIDER ====================

  private async completeLocal(
    messages: ChatMessage[],
    _model: string,
    temperature: number,
    maxTokens: number
  ): Promise<CompletionResponse> {
    const baseUrl = this.config.baseUrl || 'http://localhost:11434';

    // Ollama API format
    const response = await fetch(baseUrl + '/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        prompt: messages.map(m => m.content).join('\n'),
        stream: false,
        options: {
          temperature,
          num_predict: maxTokens,
        },
      }),
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error('Local LLM error: ' + error);
    }

    const data = await response.json() as {
      response: string;
      total_duration: number;
    };

    return {
      id: 'local-' + Date.now().toString(),
      model: this.config.model,
      content: data.response,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
      finishReason: 'stop',
    };
  }

  // ==================== UTILITIES ====================

  private mockCompletion(model: string): CompletionResponse {
    this.logger.warn('Using mock completion (no API key configured)');

    return {
      id: 'mock-' + Date.now().toString(),
      model,
      content: 'This is a mock response. Configure an API key for real LLM responses.\n\nTo enable:\n- OpenAI: Set OPENAI_API_KEY environment variable\n- Anthropic: Set ANTHROPIC_API_KEY\n- Google: Set GOOGLE_API_KEY\n- Local: Run Ollama at http://localhost:11434',
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
      finishReason: 'stop',
    };
  }

  private parseProposalAnalysis(content: string): ProposalAnalysis {
    // Simple parsing - in production, use structured output
    const lines = content.split('\n').filter(l => l.trim());

    return {
      summary: lines[0] || 'No summary available',
      keyPoints: lines.slice(1, 4).map(l => l.replace(/^[*-]\s*/, '')),
      pros: [],
      cons: [],
      risks: [],
      recommendation: 'abstain',
      confidence: 0.5,
      reasoning: content,
    };
  }

  private parseTaskAnalysis(content: string): TaskAnalysis {
    return {
      summary: content.split('\n')[0] || 'No summary available',
      complexity: 'medium',
      requiredSkills: [],
      estimatedEffort: 'Unknown',
      risks: [],
      recommendation: 'decline',
      confidence: 0.5,
      reasoning: content,
    };
  }
}
