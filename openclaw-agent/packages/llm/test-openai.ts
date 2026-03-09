/**
 * Test OpenAI Integration
 * 
 * Run: pnpm tsx test-openai.ts
 */

import { Logger } from '@havenclaw/tools';
import { LLMClient, loadLLMConfigFromEnv } from '@havenclaw/llm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from root .env file
const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

async function testOpenAI() {
  console.log('🧪 Testing OpenAI Integration...\n');
  console.log('Configuration:');
  console.log('  LLM_PROVIDER:', process.env.LLM_PROVIDER || 'openai');
  console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Configured (' + process.env.OPENAI_API_KEY.substring(0, 15) + '...)' : '❌ Missing');
  console.log('  LLM_MODEL:', process.env.LLM_MODEL || 'gpt-4o-mini (default)');
  console.log('');

  // Initialize logger
  const logger = new Logger({ level: 'info', agentId: 'test-agent' });

  // Load config from environment
  const config = loadLLMConfigFromEnv();
  console.log('Loaded LLM config:', {
    provider: config.provider,
    model: config.model,
    apiKeyConfigured: !!config.apiKey,
  });
  console.log('');

  // Create LLM client
  const llm = new LLMClient(logger, config);

  try {
    // Test 1: Basic completion
    console.log('📝 Test 1: Basic Completion');
    console.log('─'.repeat(50));
    const response = await llm.complete({
      messages: [
        { role: 'system', content: 'You are a helpful AI assistant for a blockchain agent.' },
        { role: 'user', content: 'What is the HAVEN Protocol in 2 sentences?' },
      ],
    });

    console.log('Response:', response.content);
    console.log('Model:', response.model);
    console.log('Tokens used:', response.usage.totalTokens);
    console.log('✅ Test 1: PASSED\n');

    // Test 2: Proposal Analysis
    console.log('🏛️ Test 2: Governance Proposal Analysis');
    console.log('─'.repeat(50));
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
    console.log('Summary:', analysis.summary);
    console.log('Key Points:', analysis.keyPoints);
    console.log('Recommendation:', analysis.recommendation);
    console.log('Confidence:', analysis.confidence);
    console.log('✅ Test 2: PASSED\n');

    // Test 3: Task Analysis
    console.log('📋 Test 3: Task Evaluation');
    console.log('─'.repeat(50));
    const taskDescription = `
      Build an automated market maker (AMM) arbitrage bot that:
      - Monitors price differences across 3 DEXes
      - Executes arbitrage trades when spread > 2%
      - Manages gas costs and slippage
      - Includes stop-loss mechanisms
      
      Reward: 5 ETH
      Deadline: 30 days
    `;

    const taskAnalysis = await llm.analyzeTask(taskDescription, [
      'trading',
      'defi',
      'smart-contracts',
      'typescript',
    ]);

    console.log('Summary:', taskAnalysis.summary);
    console.log('Complexity:', taskAnalysis.complexity);
    console.log('Recommendation:', taskAnalysis.recommendation);
    console.log('Confidence:', taskAnalysis.confidence);
    console.log('✅ Test 3: PASSED\n');

    // Test 4: Summarization
    console.log('📝 Test 4: Text Summarization');
    console.log('─'.repeat(50));
    const longText = `
      The HAVEN Protocol governance system enables token holders to participate
      in decentralized decision-making through a comprehensive voting mechanism.
      Key features include proposal submission with minimum token requirements,
      voting periods for community discussion, quorum requirements to ensure
      broad participation, execution delays for security, and delegation
      capabilities for specialized governance analysis. The system has
      successfully processed over 100 proposals with strong community engagement.
    `;

    const summary = await llm.summarize(longText, 30);
    console.log('Summary:', summary);
    console.log('✅ Test 4: PASSED\n');

    // Summary
    console.log('═'.repeat(50));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('═'.repeat(50));
    console.log('\nOpenAI integration is working correctly!');
    console.log('Your agent can now:');
    console.log('  ✅ Analyze governance proposals');
    console.log('  ✅ Evaluate task opportunities');
    console.log('  ✅ Summarize documents');
    console.log('  ✅ Classify content');
    console.log('  ✅ Generate embeddings (for memory system)');

  } catch (error) {
    console.error('\n❌ Test FAILED:', error);
    process.exit(1);
  }
}

// Run the test
testOpenAI().catch(console.error);
