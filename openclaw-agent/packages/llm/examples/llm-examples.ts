/**
 * LLM Integration Examples for OpenClaw Agent
 *
 * This file demonstrates how to use the @havenclaw/llm package
 * with different AI providers.
 */

import { Logger } from '@havenclaw/tools';
import { LLMClient, loadLLMConfigFromEnv } from '@havenclaw/llm';

// Initialize logger
const logger = new Logger({ level: 'info', agentId: 'example-agent' });

/**
 * Example 1: Basic Setup with Environment Variables
 */
async function exampleBasicSetup(): Promise<void> {
  // Load configuration from environment variables
  const config = loadLLMConfigFromEnv();

  // Create LLM client
  const llm = new LLMClient(logger, config);

  // Generate a simple completion
  const response = await llm.complete({
    messages: [
      { role: 'system', content: 'You are a helpful AI assistant.' },
      { role: 'user', content: 'What is the capital of France?' },
    ],
  });

  console.log('Response:', response.content);
  console.log('Tokens used:', response.usage.totalTokens);
}

/**
 * Example 2: OpenAI Configuration
 */
async function exampleOpenAI(): Promise<void> {
  const llm = new LLMClient(logger, {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o', // Use most capable model
    defaultTemperature: 0.7,
    defaultMaxTokens: 2000,
  });

  const response = await llm.complete({
    messages: [
      { role: 'user', content: 'Explain quantum computing in 2 sentences.' },
    ],
  });

  console.log('OpenAI Response:', response.content);
}

/**
 * Example 3: Anthropic Claude Configuration
 */
async function exampleAnthropic(): Promise<void> {
  const llm = new LLMClient(logger, {
    provider: 'anthropic',
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-3-opus-20240229', // Most powerful Claude
    defaultTemperature: 0.5,
    defaultMaxTokens: 3000,
  });

  const response = await llm.complete({
    messages: [
      {
        role: 'system',
        content: 'You are an expert blockchain developer.',
      },
      {
        role: 'user',
        content: 'How do I implement a reentrancy guard in Solidity?',
      },
    ],
  });

  console.log('Anthropic Response:', response.content);
}

/**
 * Example 4: Google Gemini Configuration
 */
async function exampleGoogle(): Promise<void> {
  const llm = new LLMClient(logger, {
    provider: 'google',
    apiKey: process.env.GOOGLE_API_KEY,
    model: 'gemini-1.5-pro', // Most capable Gemini
    defaultTemperature: 0.6,
    defaultMaxTokens: 2048,
  });

  const response = await llm.complete({
    messages: [
      { role: 'user', content: 'What are the benefits of decentralized governance?' },
    ],
  });

  console.log('Google Response:', response.content);
}

/**
 * Example 5: Local Model (Ollama)
 */
async function exampleLocal(): Promise<void> {
  const llm = new LLMClient(logger, {
    provider: 'local',
    baseUrl: 'http://localhost:11434',
    model: 'llama2', // Or any model you have installed
    defaultTemperature: 0.7,
    defaultMaxTokens: 1000,
  });

  const response = await llm.complete({
    messages: [
      { role: 'user', content: 'What is blockchain technology?' },
    ],
  });

  console.log('Local Response:', response.content);
}

/**
 * Example 6: Governance Proposal Analysis
 */
async function exampleGovernanceAnalysis(): Promise<void> {
  const llm = new LLMClient(logger, loadLLMConfigFromEnv());

  const proposalText = `
    Proposal #42: Increase Treasury Allocation to Marketing

    This proposal seeks to allocate 500,000 HAVEN tokens from the treasury
    to fund marketing initiatives over the next 6 months. The funds will be
    used for:
    - Social media campaigns
    - Influencer partnerships
    - Conference sponsorships
    - Content creation

    Expected outcomes:
    - 50% increase in community size
    - 30% increase in protocol TVL
    - Enhanced brand recognition
  `;

  const analysis = await llm.analyzeProposal(proposalText);

  console.log('=== Proposal Analysis ===');
  console.log('Summary:', analysis.summary);
  console.log('Key Points:', analysis.keyPoints);
  console.log('Recommendation:', analysis.recommendation);
  console.log('Confidence:', analysis.confidence);
  console.log('Reasoning:', analysis.reasoning);
}

/**
 * Example 7: Task Evaluation
 */
async function exampleTaskAnalysis(): Promise<void> {
  const llm = new LLMClient(logger, loadLLMConfigFromEnv());

  const taskDescription = `
    Build an automated market maker (AMM) arbitrage bot that:
    - Monitors price differences across 3 DEXes
    - Executes arbitrage trades when spread > 2%
    - Manages gas costs and slippage
    - Includes stop-loss mechanisms
    - Runs 24/7 on cloud infrastructure

    Reward: 5 ETH
    Deadline: 30 days
  `;

  const agentCapabilities = ['trading', 'defi', 'smart-contracts', 'typescript'];

  const analysis = await llm.analyzeTask(taskDescription, agentCapabilities);

  console.log('=== Task Analysis ===');
  console.log('Summary:', analysis.summary);
  console.log('Complexity:', analysis.complexity);
  console.log('Recommendation:', analysis.recommendation);
  console.log('Confidence:', analysis.confidence);
  console.log('Risks:', analysis.risks);
}

/**
 * Example 8: Text Summarization
 */
async function exampleSummarization(): Promise<void> {
  const llm = new LLMClient(logger, loadLLMConfigFromEnv());

  const longText = `
    The HAVEN Protocol governance system enables token holders to participate
    in decentralized decision-making. Key features include:

    1. Proposal Submission: Any token holder with minimum 10,000 HAVEN can
       submit a proposal for community consideration.

    2. Voting Period: Proposals are open for voting for 7 days, allowing
       sufficient time for community discussion and analysis.

    3. Quorum Requirements: Proposals require minimum 10% participation to
       pass, ensuring broad community support.

    4. Execution Delay: Approved proposals have a 48-hour timelock before
       execution, providing a security buffer.

    5. Delegation: Token holders can delegate their voting power to trusted
       representatives who specialize in governance analysis.

    The system has successfully processed over 100 proposals with an average
    participation rate of 25%, demonstrating strong community engagement.
  `;

  const summary = await llm.summarize(longText, 50);
  console.log('Summary:', summary);
}

/**
 * Example 9: Text Classification
 */
async function exampleClassification(): Promise<void> {
  const llm = new LLMClient(logger, loadLLMConfigFromEnv());

  const text = 'This proposal requests funding for a security audit of the core smart contracts.';

  const categories = [
    'governance',
    'treasury',
    'security',
    'marketing',
    'development',
    'partnership',
  ];

  const result = await llm.classify(text, categories);
  console.log('Category:', result.category);
  console.log('Confidence:', result.confidence);
}

/**
 * Example 10: Embedding Generation (for Memory System)
 */
async function exampleEmbeddings(): Promise<void> {
  const llm = new LLMClient(logger, {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
  });

  const text = 'Agent successfully completed task #123: DEX arbitrage analysis';

  const embedding = await llm.embed({ text });

  console.log('Embedding dimension:', embedding.embedding.length);
  console.log('First 10 values:', embedding.embedding.slice(0, 10));
  console.log('Tokens used:', embedding.usage.totalTokens);
}

/**
 * Example 11: Multi-turn Conversation
 */
async function exampleConversation(): Promise<void> {
  const llm = new LLMClient(logger, loadLLMConfigFromEnv());

  const conversation = [
    { role: 'system', content: 'You are a helpful blockchain assistant.' },
    { role: 'user', content: 'What is Ethereum?' },
    { role: 'assistant', content: 'Ethereum is a decentralized blockchain platform...' },
    { role: 'user', content: 'How does it differ from Bitcoin?' },
  ];

  const response = await llm.complete({
    messages: conversation,
    temperature: 0.7,
  });

  console.log('Response:', response.content);
}

/**
 * Example 12: Structured Data Extraction
 */
async function exampleStructuredExtraction(): Promise<void> {
  const llm = new LLMClient(logger, loadLLMConfigFromEnv());

  const proposalText = `
    Title: Liquidity Mining Program Phase 2
    Author: @governance_lead
    Budget: 250,000 HAVEN tokens
    Duration: 3 months
    Description: Continue the successful liquidity mining program...
  `;

  const schema = 'title: string, author: string, budget: string, duration: string';

  const data = await llm.extractStructured(proposalText, schema);

  console.log('Extracted Data:', data);
  console.log('Title:', data.title);
  console.log('Budget:', data.budget);
}

/**
 * Run all examples
 */
async function runExamples(): Promise<void> {
  console.log('=== OpenClaw LLM Integration Examples ===\n');

  try {
    // Uncomment the examples you want to run:

    // await exampleBasicSetup();
    // await exampleOpenAI();
    // await exampleAnthropic();
    // await exampleGoogle();
    // await exampleLocal();
    // await exampleGovernanceAnalysis();
    // await exampleTaskAnalysis();
    // await exampleSummarization();
    // await exampleClassification();
    // await exampleEmbeddings();
    // await exampleConversation();
    // await exampleStructuredExtraction();

    console.log('\n✅ Examples completed!');
    console.log('Note: Uncomment examples to run them.');
    console.log('Make sure to set your API keys in .env first.');
  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

// Run if executed directly
runExamples().catch(console.error);
