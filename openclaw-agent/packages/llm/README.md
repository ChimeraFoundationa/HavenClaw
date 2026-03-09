# @havenclaw/llm

**Unified LLM Integration for OpenClaw Agents**

[![npm](https://img.shields.io/npm/v/@havenclaw/llm)](npm)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

---

## 🎯 Overview

The `@havenclaw/llm` package provides a unified interface for integrating Large Language Models into your OpenClaw agent. It supports multiple AI providers through their official SDKs:

- ✅ **OpenAI** - GPT-4, GPT-4o, GPT-3.5
- ✅ **Anthropic** - Claude 3 family (Opus, Sonnet, Haiku)
- ✅ **Google** - Gemini 1.5 Pro, Flash
- ✅ **Local** - Ollama, vLLM, and other compatible servers

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd packages/llm
pnpm install
```

### 2. Configure API Keys

Copy the example environment file and add your API key:

```bash
cp .env.example .env
```

Edit `.env`:

```bash
# For OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-api-key-here

# For Anthropic
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-api-key-here

# For Google
LLM_PROVIDER=google
GOOGLE_API_KEY=your-api-key-here

# For Local (Ollama)
LLM_PROVIDER=local
LLM_BASE_URL=http://localhost:11434
LLM_MODEL=llama2
```

### 3. Basic Usage

```typescript
import { Logger } from '@havenclaw/tools';
import { LLMClient, loadLLMConfigFromEnv } from '@havenclaw/llm';

// Create logger
const logger = new Logger({ level: 'info' });

// Load config from environment variables
const config = loadLLMConfigFromEnv();

// Create LLM client
const llm = new LLMClient(logger, config);

// Generate a completion
const response = await llm.complete({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is the capital of France?' },
  ],
});

console.log(response.content);
// Output: "The capital of France is Paris."
```

---

## 📖 API Reference

### LLMClient

The main class for interacting with LLM providers.

#### Constructor

```typescript
const llm = new LLMClient(logger: Logger, config: Partial<LLMConfig>);
```

#### Methods

##### `complete(request)` - Generate a completion

```typescript
const response = await llm.complete({
  messages: [
    { role: 'system', content: 'You are helpful.' },
    { role: 'user', content: 'Hello!' },
  ],
  temperature: 0.7,
  maxTokens: 1000,
});

console.log(response.content);
```

##### `embed(request)` - Generate embeddings (OpenAI only)

```typescript
const embedding = await llm.embed({
  text: 'This is a sample text for embedding.',
});

console.log(embedding.embedding); // [0.123, -0.456, ...]
```

##### `analyzeProposal(proposalText)` - Analyze a governance proposal

```typescript
const analysis = await llm.analyzeProposal(proposalText);

console.log(analysis.summary);
console.log(analysis.recommendation); // 'for' | 'against' | 'abstain'
console.log(analysis.confidence); // 0-1
```

##### `analyzeTask(taskDescription, capabilities)` - Analyze a task

```typescript
const analysis = await llm.analyzeTask(
  'Build a trading bot for DEX arbitrage',
  ['trading', 'defi', 'analysis']
);

console.log(analysis.recommendation); // 'accept' | 'decline'
console.log(analysis.complexity); // 'low' | 'medium' | 'high'
```

##### `summarize(text, maxLength)` - Summarize text

```typescript
const summary = await llm.summarize(longText, 200);
console.log(summary);
```

##### `classify(text, categories)` - Classify text

```typescript
const result = await llm.classify(
  'This proposal increases the treasury allocation to marketing.',
  ['governance', 'treasury', 'marketing', 'technical']
);

console.log(result.category); // 'marketing'
console.log(result.confidence); // 0.92
```

##### `extractStructured(text, schema)` - Extract structured data

```typescript
const data = await llm.extractStructured(
  proposalText,
  'title: string, description: string, budget: number'
);

console.log(data.title);
console.log(data.budget);
```

---

## 🔧 Configuration

### LLMConfig Interface

```typescript
interface LLMConfig {
  provider: LLMProvider; // 'openai' | 'anthropic' | 'google' | 'local'
  apiKey?: string;
  baseUrl?: string;
  model: string;
  defaultTemperature: number;
  defaultMaxTokens: number;
  timeout: number; // ms
  maxRetries: number;
}
```

### Default Models by Provider

| Provider | Default Model | Description |
|----------|---------------|-------------|
| OpenAI | `gpt-4o-mini` | Fast, cost-effective |
| Anthropic | `claude-3-haiku-20240307` | Fast, efficient |
| Google | `gemini-1.5-flash` | Fast, multimodal |
| Local | `llama2` | Self-hosted |

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LLM_PROVIDER` | Provider to use | `openai` |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `ANTHROPIC_API_KEY` | Anthropic API key | - |
| `GOOGLE_API_KEY` | Google API key | - |
| `LLM_MODEL` | Custom model name | Provider default |
| `LLM_BASE_URL` | Custom base URL | - |
| `LLM_TEMPERATURE` | Default temperature | `0.3` |
| `LLM_MAX_TOKENS` | Default max tokens | `2000` |

---

## 📋 Provider-Specific Setup

### OpenAI

1. Get API key: https://platform.openai.com/api-keys
2. Set `LLM_PROVIDER=openai`
3. Set `OPENAI_API_KEY=sk-...`

**Available Models:**
- `gpt-4o` - Most capable, multimodal
- `gpt-4o-mini` - Fast, cost-effective (default)
- `gpt-4-turbo` - Previous generation
- `gpt-3.5-turbo` - Legacy, cheapest

### Anthropic

1. Get API key: https://console.anthropic.com/settings/keys
2. Set `LLM_PROVIDER=anthropic`
3. Set `ANTHROPIC_API_KEY=sk-ant-...`

**Available Models:**
- `claude-3-opus-20240229` - Most powerful
- `claude-3-sonnet-20240229` - Balanced
- `claude-3-haiku-20240307` - Fast, efficient (default)

### Google

1. Get API key: https://makersuite.google.com/app/apikey
2. Set `LLM_PROVIDER=google`
3. Set `GOOGLE_API_KEY=...`

**Available Models:**
- `gemini-1.5-pro` - Most capable
- `gemini-1.5-flash` - Fast, efficient (default)

### Local (Ollama)

1. Install Ollama: https://ollama.ai
2. Pull a model: `ollama pull llama2`
3. Set `LLM_PROVIDER=local`
4. Set `LLM_BASE_URL=http://localhost:11434`
5. Set `LLM_MODEL=llama2`

**No API key required!**

---

## 🧪 Examples

### Governance Proposal Analysis

```typescript
import { LLMClient } from '@havenclaw/llm';

const llm = new LLMClient(logger, { provider: 'openai', apiKey: process.env.OPENAI_API_KEY });

// Get active proposals from governance contract
const proposals = await governanceClient.getActiveProposals();

for (const proposal of proposals) {
  const analysis = await llm.analyzeProposal(proposal.description);
  
  console.log('Proposal:', proposal.proposalId);
  console.log('Recommendation:', analysis.recommendation);
  console.log('Confidence:', analysis.confidence);
  
  // Vote based on analysis
  if (analysis.confidence > 0.8) {
    await governanceClient.castVote(
      proposal.proposalId,
      analysis.recommendation === 'for' ? VoteSupport.For : VoteSupport.Against,
      analysis.reasoning
    );
  }
}
```

### Task Evaluation

```typescript
const llm = new LLMClient(logger, { provider: 'anthropic', apiKey: process.env.ANTHROPIC_API_KEY });

// Get open tasks
const tasks = await taskClient.getOpenTasks();

for (const taskId of tasks) {
  const task = await taskClient.getTask(taskId);
  
  const analysis = await llm.analyzeTask(
    task.description,
    ['trading', 'defi', 'smart-contracts']
  );
  
  if (analysis.recommendation === 'accept' && analysis.confidence > 0.7) {
    await taskClient.acceptTask(taskId);
    console.log('Accepted task:', taskId);
  }
}
```

### Embedding Generation (for Memory System)

```typescript
const llm = new LLMClient(logger, { provider: 'openai', apiKey: process.env.OPENAI_API_KEY });

// Generate embedding for memory storage
const embedding = await llm.embed({
  text: 'Agent completed task #123: DEX arbitrage analysis',
});

// Store in vector database
await memorySystem.store({
  type: 'episodic',
  content: 'Completed DEX arbitrage task',
  embedding: embedding.embedding,
  timestamp: Date.now(),
});
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      LLMClient                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   OpenAI     │  │  Anthropic   │  │    Google    │       │
│  │   SDK        │  │  SDK         │  │  SDK         │       │
│  │  (official)  │  │ (official)   │  │ (official)   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
│  ┌──────────────┐                                           │
│  │   Local      │                                           │
│  │   (Ollama)   │                                           │
│  │  REST API    │                                           │
│  └──────────────┘                                           │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                    Unified Interface                         │
│  - complete()  - embed()  - analyzeProposal()               │
│  - summarize() - classify() - analyzeTask()                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔒 Security Best Practices

1. **Never commit API keys** - Use `.env` files (gitignored)
2. **Use environment variables** - Load via `loadLLMConfigFromEnv()`
3. **Rotate keys regularly** - Update API keys periodically
4. **Monitor usage** - Check provider dashboards for unusual activity
5. **Set rate limits** - Configure appropriate timeouts and retries

---

## 📊 Token Usage & Costs

### OpenAI (approximate)

| Model | Input (per 1K tokens) | Output (per 1K tokens) |
|-------|----------------------|------------------------|
| gpt-4o | $0.005 | $0.015 |
| gpt-4o-mini | $0.00015 | $0.0006 |
| gpt-3.5-turbo | $0.0005 | $0.0015 |

### Anthropic (approximate)

| Model | Input (per 1K tokens) | Output (per 1K tokens) |
|-------|----------------------|------------------------|
| claude-3-opus | $0.015 | $0.075 |
| claude-3-sonnet | $0.003 | $0.015 |
| claude-3-haiku | $0.00025 | $0.00125 |

### Google (approximate)

| Model | Input (per 1K tokens) | Output (per 1K tokens) |
|-------|----------------------|------------------------|
| gemini-1.5-pro | $0.00125 | $0.005 |
| gemini-1.5-flash | $0.000075 | $0.0003 |

---

## 🐛 Troubleshooting

### "API key not configured"

Ensure your `.env` file has the correct API key:
```bash
OPENAI_API_KEY=sk-...
```

### "Rate limit exceeded"

- Reduce request frequency
- Increase `timeout` and `maxRetries` in config
- Consider upgrading your API tier

### "Model not found"

Check the model name is correct for your provider:
```typescript
// OpenAI
model: 'gpt-4o-mini'

// Anthropic
model: 'claude-3-haiku-20240307'

// Google
model: 'gemini-1.5-flash'
```

### Local model connection issues

1. Ensure Ollama is running: `ollama serve`
2. Check the model is pulled: `ollama list`
3. Verify the URL: `LLM_BASE_URL=http://localhost:11434`

---

## 📄 License

MIT License

---

<div align="center">

**Built with ❤️ for the OpenClaw Agent System**

</div>
