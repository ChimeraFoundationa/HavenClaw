/**
 * Agent Daemon Configuration
 * 
 * Supports Phase 1 (rule-based) and Phase 2-3 (AI-powered) components
 */

import { z } from 'zod';

export const AgentDaemonConfigSchema = z.object({
  // Agent identity
  agentId: z.string().min(1),
  agentName: z.string().optional(),

  // Operator credentials
  operatorPrivateKey: z.string().startsWith('0x'),

  // Network configuration
  network: z.object({
    chainId: z.number().default(43113),
    rpcUrl: z.string().url(),
    wsUrl: z.string().url().optional(),
    explorerUrl: z.string().url().optional(),
  }),

  // Contract addresses
  contracts: z.object({
    // ERC-8004 Identity
    erc8004Registry: z.string(),

    // HAVEN Protocol
    agentRegistry: z.string(),
    agentReputation: z.string(),
    havenGovernance: z.string(),
    havenToken: z.string(),
    taskMarketplace: z.string(),

    // Optional
    gat: z.string().optional(),
    escrow: z.string().optional(),
    paymentProtocol: z.string().optional(), // HPP
  }),

  // Decision engine configuration (Phase 1 - rule-based)
  decision: z.object({
    autoVote: z.boolean().default(false),
    autoAcceptTasks: z.boolean().default(false),
    minTaskReward: z.string().default('0'),
    votingRules: z.object({
      minQuorum: z.string().default('0'),
      maxAgainstRatio: z.number().default(0.5),
      trustedProposers: z.array(z.string()).default([]),
    }).default({}),
  }).default({}),

  // Reasoning engine configuration (Phase 2 - OODA loop)
  reasoning: z.object({
    // OODA loop settings
    observationInterval: z.number().default(5000),
    minConfidenceForAction: z.number().default(0.6),
    maxObservations: z.number().default(100),
    contextWindow: z.number().default(20),
    
    // Analysis settings
    enableGovernanceAnalysis: z.boolean().default(true),
    enableTaskAnalysis: z.boolean().default(true),
    
    // Learning settings
    enableLearning: z.boolean().default(true),
  }).default({}),

  // Memory system configuration (Phase 2)
  memory: z.object({
    // Capacity limits
    workingMemoryCapacity: z.number().default(7),
    longTermMemoryLimit: z.number().default(1000),
    
    // Forgetting parameters
    forgettingCurve: z.enum(['exponential', 'linear']).default('exponential'),
    decayRate: z.number().default(0.1),
    minRetentionThreshold: z.number().default(0.2),
    
    // Search parameters
    defaultSearchLimit: z.number().default(10),
    minSimilarityScore: z.number().default(0.7),
  }).default({}),

  // Learning system configuration (Phase 2)
  learning: z.object({
    maxExperiences: z.number().default(1000),
    minConfidenceForLesson: z.number().default(0.7),
    autoUpdateModel: z.boolean().default(true),
    metricsWindow: z.number().default(30),
  }).default({}),

  // Governance analyzer configuration (Phase 2)
  governance: z.object({
    // Impact scoring weights
    protocolImpactWeight: z.number().default(0.3),
    communityImpactWeight: z.number().default(0.2),
    technicalImpactWeight: z.number().default(0.25),
    economicImpactWeight: z.number().default(0.25),
    
    // Risk thresholds
    highRiskThreshold: z.number().default(0.6),
    criticalRiskThreshold: z.number().default(0.8),
    
    // Recommendation thresholds
    recommendForThreshold: z.number().default(7),
    recommendAgainstThreshold: z.number().default(4),
    
    // Simulation settings
    simulationSamples: z.number().default(100),
    
    // Trusted proposers
    trustedProposers: z.array(z.string()).default([]),
  }).default({}),

  // LLM configuration (Phase 3)
  llm: z.object({
    provider: z.enum(['openai', 'anthropic', 'google', 'local']).default('openai'),
    apiKey: z.string().optional(),
    model: z.string().default('gpt-4o-mini'),
    baseUrl: z.string().optional(), // For local models
    defaultTemperature: z.number().default(0.3),
    defaultMaxTokens: z.number().default(2000),
    timeout: z.number().default(30000),
    maxRetries: z.number().default(3),
  }).default({}),

  // Vector index configuration (Phase 3)
  vector: z.object({
    dimensions: z.number().default(1536), // OpenAI embedding size
    similarityMetric: z.enum(['cosine', 'dotproduct', 'euclidean']).default('cosine'),
    maxItems: z.number().default(10000),
  }).default({}),

  // A2A communication configuration (Phase 3)
  a2a: z.object({
    enabled: z.boolean().default(false),
    broadcastEnabled: z.boolean().default(false),
    trustedAgents: z.array(z.string()).default([]),
    discoveryInterval: z.number().default(60000),
  }).default({}),

  // Transaction configuration
  transactions: z.object({
    maxFeePerGas: z.string().optional(),
    maxPriorityFeePerGas: z.string().optional(),
    gasPriceBufferPercent: z.number().default(20),
    confirmationsRequired: z.number().default(1),
  }).default({}),

  // Logging configuration
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    format: z.enum(['json', 'text']).default('text'),
    file: z.string().optional(),
  }).default({}),

  // Identity (optional - will be created if not exists)
  identity: z.object({
    erc8004TokenId: z.string().optional(),
    agentAddress: z.string().optional(),
    metadataUri: z.string().optional(),
    capabilities: z.array(z.string()).default([]),
  }).optional(),
});

export type AgentDaemonConfig = z.infer<typeof AgentDaemonConfigSchema>;

/**
 * Load configuration from file
 */
export function loadConfigFromFile(path: string): AgentDaemonConfig {
  const fs = require('fs');
  const yaml = require('yaml');
  
  const content = fs.readFileSync(path, 'utf-8');
  const config = yaml.parse(content);
  
  return AgentDaemonConfigSchema.parse(config);
}

/**
 * Load configuration from environment variables
 */
export function loadConfigFromEnv(): AgentDaemonConfig {
  const llmProvider = (process.env.LLM_PROVIDER as 'openai' | 'anthropic' | 'google' | 'local') || 'openai';

  return AgentDaemonConfigSchema.parse({
    agentId: process.env.AGENT_ID || 'default-agent',
    agentName: process.env.AGENT_NAME || 'OpenClaw Agent',
    operatorPrivateKey: process.env.OPERATOR_PRIVATE_KEY,
    network: {
      chainId: parseInt(process.env.CHAIN_ID || '43113'),
      rpcUrl: process.env.RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc',
    },
    contracts: {
      erc8004Registry: process.env.ERC8004_REGISTRY,
      agentRegistry: process.env.AGENT_REGISTRY,
      agentReputation: process.env.AGENT_REPUTATION,
      havenGovernance: process.env.HAVEN_GOVERNANCE,
      havenToken: process.env.HAVEN_TOKEN,
      taskMarketplace: process.env.TASK_MARKETPLACE,
      paymentProtocol: process.env.PAYMENT_PROTOCOL,
    },
    logging: {
      level: process.env.LOG_LEVEL as any || 'info',
      format: process.env.LOG_FORMAT as any || 'text',
    },
    llm: {
      provider: llmProvider,
      apiKey: llmProvider === 'openai' ? process.env.OPENAI_API_KEY :
                llmProvider === 'anthropic' ? process.env.ANTHROPIC_API_KEY :
                llmProvider === 'google' ? process.env.GOOGLE_API_KEY :
                undefined,
      model: process.env.LLM_MODEL || undefined,
      baseUrl: process.env.LLM_BASE_URL || undefined,
      defaultTemperature: process.env.LLM_TEMPERATURE ? parseFloat(process.env.LLM_TEMPERATURE) : undefined,
      defaultMaxTokens: process.env.LLM_MAX_TOKENS ? parseInt(process.env.LLM_MAX_TOKENS, 10) : undefined,
    },
  });
}

/**
 * Get Fuji testnet contract addresses (Deployed March 8, 2026 - Updated with HPP)
 *
 * ERC-8004: Official AI Agent Identity NFT standard
 * - Already deployed on Avalanche Fuji Testnet
 * - Identity Registry: 0x8004A818BFB912233c491871b3d84c89A494BD9e
 * - Reputation Registry: 0x8004B663056A597Dffe9eCcC1965A193B7388713
 * 
 * HPP: HavenClaw Payment Protocol
 * - Custom payment protocol for AI agents
 * - PaymentRouter: 0xef925Ff5F5e41498c4CC26DC006E21F1fdB40816
 */
export function getFujiContracts() {
  return {
    // ERC-8004 Official AI Agent Identity (Already deployed on Fuji)
    erc8004Registry: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
    erc8004Reputation: '0x8004B663056A597Dffe9eCcC1965A193B7388713',

    // HavenClaw Protocol Contracts (Deployed by us)
    agentRegistry: '0xe97f0c1378A75a4761f20220d64c31787FC9e321',
    agentReputation: '0x5964119472d9dEA5B73B7A9a911a6B2Af870dE19',
    havenGovernance: '0x51B6B1F13A42336f015357b8648A969cf025193C',
    havenToken: '0x0f847172d1C496dd847d893A0318dBF4B826ef63',
    taskMarketplace: '0x5B8DE12CDB6156dC1F5370B275CBf70E2d0A77AA',

    // HPP: HavenClaw Payment Protocol
    paymentProtocol: '0xef925Ff5F5e41498c4CC26DC006E21F1fdB40816',

    // Optional
    gat: '0xa91393D9f9A770e70E02128BCF6b2413Ca391212',
    escrow: '0xC4Bb287c74FF92cD4B0c62D51523a03FD0F0C543',
  };
}
