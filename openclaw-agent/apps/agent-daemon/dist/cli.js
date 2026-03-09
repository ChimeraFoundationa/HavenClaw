#!/usr/bin/env node
import {
  __require,
  createAgentDaemon
} from "./chunk-E7YGFKSE.js";

// src/cli.ts
import { Command } from "commander";
import { writeFileSync } from "fs";

// src/config.ts
import { z } from "zod";
var AgentDaemonConfigSchema = z.object({
  // Agent identity
  agentId: z.string().min(1),
  agentName: z.string().optional(),
  // Operator credentials
  operatorPrivateKey: z.string().startsWith("0x"),
  // Network configuration
  network: z.object({
    chainId: z.number().default(43113),
    rpcUrl: z.string().url(),
    wsUrl: z.string().url().optional(),
    explorerUrl: z.string().url().optional()
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
    paymentProtocol: z.string().optional()
    // HPP
  }),
  // Decision engine configuration (Phase 1 - rule-based)
  decision: z.object({
    autoVote: z.boolean().default(false),
    autoAcceptTasks: z.boolean().default(false),
    minTaskReward: z.string().default("0"),
    votingRules: z.object({
      minQuorum: z.string().default("0"),
      maxAgainstRatio: z.number().default(0.5),
      trustedProposers: z.array(z.string()).default([])
    }).default({})
  }).default({}),
  // Reasoning engine configuration (Phase 2 - OODA loop)
  reasoning: z.object({
    // OODA loop settings
    observationInterval: z.number().default(5e3),
    minConfidenceForAction: z.number().default(0.6),
    maxObservations: z.number().default(100),
    contextWindow: z.number().default(20),
    // Analysis settings
    enableGovernanceAnalysis: z.boolean().default(true),
    enableTaskAnalysis: z.boolean().default(true),
    // Learning settings
    enableLearning: z.boolean().default(true)
  }).default({}),
  // Memory system configuration (Phase 2)
  memory: z.object({
    // Capacity limits
    workingMemoryCapacity: z.number().default(7),
    longTermMemoryLimit: z.number().default(1e3),
    // Forgetting parameters
    forgettingCurve: z.enum(["exponential", "linear"]).default("exponential"),
    decayRate: z.number().default(0.1),
    minRetentionThreshold: z.number().default(0.2),
    // Search parameters
    defaultSearchLimit: z.number().default(10),
    minSimilarityScore: z.number().default(0.7)
  }).default({}),
  // Learning system configuration (Phase 2)
  learning: z.object({
    maxExperiences: z.number().default(1e3),
    minConfidenceForLesson: z.number().default(0.7),
    autoUpdateModel: z.boolean().default(true),
    metricsWindow: z.number().default(30)
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
    trustedProposers: z.array(z.string()).default([])
  }).default({}),
  // LLM configuration (Phase 3)
  llm: z.object({
    provider: z.enum(["openai", "anthropic", "google", "local"]).default("openai"),
    apiKey: z.string().optional(),
    model: z.string().default("gpt-4o-mini"),
    baseUrl: z.string().optional(),
    // For local models
    defaultTemperature: z.number().default(0.3),
    defaultMaxTokens: z.number().default(2e3),
    timeout: z.number().default(3e4),
    maxRetries: z.number().default(3)
  }).default({}),
  // Vector index configuration (Phase 3)
  vector: z.object({
    dimensions: z.number().default(1536),
    // OpenAI embedding size
    similarityMetric: z.enum(["cosine", "dotproduct", "euclidean"]).default("cosine"),
    maxItems: z.number().default(1e4)
  }).default({}),
  // A2A communication configuration (Phase 3)
  a2a: z.object({
    enabled: z.boolean().default(false),
    broadcastEnabled: z.boolean().default(false),
    trustedAgents: z.array(z.string()).default([]),
    discoveryInterval: z.number().default(6e4)
  }).default({}),
  // Transaction configuration
  transactions: z.object({
    maxFeePerGas: z.string().optional(),
    maxPriorityFeePerGas: z.string().optional(),
    gasPriceBufferPercent: z.number().default(20),
    confirmationsRequired: z.number().default(1)
  }).default({}),
  // Logging configuration
  logging: z.object({
    level: z.enum(["debug", "info", "warn", "error"]).default("info"),
    format: z.enum(["json", "text"]).default("text"),
    file: z.string().optional()
  }).default({}),
  // Identity (optional - will be created if not exists)
  identity: z.object({
    erc8004TokenId: z.string().optional(),
    agentAddress: z.string().optional(),
    metadataUri: z.string().optional(),
    capabilities: z.array(z.string()).default([])
  }).optional()
});
function loadConfigFromFile(path) {
  const fs = __require("fs");
  const yaml = __require("yaml");
  const content = fs.readFileSync(path, "utf-8");
  const config = yaml.parse(content);
  return AgentDaemonConfigSchema.parse(config);
}
function loadConfigFromEnv() {
  const llmProvider = process.env.LLM_PROVIDER || "openai";
  return AgentDaemonConfigSchema.parse({
    agentId: process.env.AGENT_ID || "default-agent",
    agentName: process.env.AGENT_NAME || "OpenClaw Agent",
    operatorPrivateKey: process.env.OPERATOR_PRIVATE_KEY,
    network: {
      chainId: parseInt(process.env.CHAIN_ID || "43113"),
      rpcUrl: process.env.RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc"
    },
    contracts: {
      erc8004Registry: process.env.ERC8004_REGISTRY,
      agentRegistry: process.env.AGENT_REGISTRY,
      agentReputation: process.env.AGENT_REPUTATION,
      havenGovernance: process.env.HAVEN_GOVERNANCE,
      havenToken: process.env.HAVEN_TOKEN,
      taskMarketplace: process.env.TASK_MARKETPLACE,
      paymentProtocol: process.env.PAYMENT_PROTOCOL
    },
    logging: {
      level: process.env.LOG_LEVEL || "info",
      format: process.env.LOG_FORMAT || "text"
    },
    llm: {
      provider: llmProvider,
      apiKey: llmProvider === "openai" ? process.env.OPENAI_API_KEY : llmProvider === "anthropic" ? process.env.ANTHROPIC_API_KEY : llmProvider === "google" ? process.env.GOOGLE_API_KEY : void 0,
      model: process.env.LLM_MODEL || void 0,
      baseUrl: process.env.LLM_BASE_URL || void 0,
      defaultTemperature: process.env.LLM_TEMPERATURE ? parseFloat(process.env.LLM_TEMPERATURE) : void 0,
      defaultMaxTokens: process.env.LLM_MAX_TOKENS ? parseInt(process.env.LLM_MAX_TOKENS, 10) : void 0
    }
  });
}
function getFujiContracts() {
  return {
    // ERC-8004 Official AI Agent Identity (Already deployed on Fuji)
    erc8004Registry: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
    erc8004Reputation: "0x8004B663056A597Dffe9eCcC1965A193B7388713",
    // HavenClaw Protocol Contracts (Deployed by us)
    agentRegistry: "0xe97f0c1378A75a4761f20220d64c31787FC9e321",
    agentReputation: "0x5964119472d9dEA5B73B7A9a911a6B2Af870dE19",
    havenGovernance: "0x51B6B1F13A42336f015357b8648A969cf025193C",
    havenToken: "0x0f847172d1C496dd847d893A0318dBF4B826ef63",
    taskMarketplace: "0x5B8DE12CDB6156dC1F5370B275CBf70E2d0A77AA",
    // HPP: HavenClaw Payment Protocol
    paymentProtocol: "0xef925Ff5F5e41498c4CC26DC006E21F1fdB40816",
    // Optional
    gat: "0xa91393D9f9A770e70E02128BCF6b2413Ca391212",
    escrow: "0xC4Bb287c74FF92cD4B0c62D51523a03FD0F0C543"
  };
}

// src/cli.ts
import { ethers } from "ethers";
var program = new Command();
program.name("openclaw-agent").description("OpenClaw Autonomous AI Agent CLI").version("0.1.0");
program.command("start").description("Start the agent daemon").option("-c, --config <path>", "Path to config file (YAML/JSON)").option("--env", "Load config from environment variables").action(async (options) => {
  try {
    let config;
    if (options.config) {
      config = loadConfigFromFile(options.config);
    } else if (options.env) {
      config = loadConfigFromEnv();
    } else {
      console.error("Error: Please specify --config or --env");
      process.exit(1);
    }
    const daemon = createAgentDaemon(config);
    process.on("SIGINT", async () => {
      console.log("\n\u{1F6D1} Shutting down...");
      await daemon.stop();
      process.exit(0);
    });
    process.on("SIGTERM", async () => {
      console.log("\n\u{1F6D1} Shutting down...");
      await daemon.stop();
      process.exit(0);
    });
    await daemon.start();
    await new Promise(() => {
    });
  } catch (error) {
    console.error("\u274C Failed to start daemon:", error.message);
    process.exit(1);
  }
});
program.command("create-identity").description("Create a new agent identity").requiredOption("--name <name>", "Agent name").requiredOption("--capabilities <caps>", "Comma-separated capabilities").option("--metadata-uri <uri>", "Metadata URI (IPFS/Arweave)").option("-c, --config <path>", "Path to config file").option("--stake <amount>", "Amount of HAVEN to stake").option("--lock-period <seconds>", "Stake lock period in seconds", "604800").action(async (options) => {
  try {
    let config;
    if (options.config) {
      config = loadConfigFromFile(options.config);
    } else {
      config = loadConfigFromEnv();
    }
    const signer = new ethers.Wallet(
      config.operatorPrivateKey,
      new ethers.JsonRpcProvider(config.network.rpcUrl)
    );
    console.log("\u{1F194} Creating agent identity...");
    console.log(`   Name: ${options.name}`);
    console.log(`   Capabilities: ${options.capabilities}`);
    const { IdentityManager } = await import("@havenclaw/identity");
    const { HavenClient } = await import("@havenclaw/haven-interface");
    const { Logger } = await import("@havenclaw/tools");
    const { EventEmitter } = await import("@havenclaw/runtime");
    const client = new HavenClient({
      rpcUrl: config.network.rpcUrl,
      contracts: config.contracts
    });
    await client.connectSigner(signer);
    const logger = new Logger({ level: "info", format: "text" });
    const eventEmitter = new EventEmitter();
    const identityManager = new IdentityManager(
      client,
      logger,
      eventEmitter,
      {
        operatorPrivateKey: config.operatorPrivateKey,
        erc8004Contract: config.contracts.erc8004Registry,
        agentRegistry: config.contracts.agentRegistry,
        chainId: config.network.chainId
      }
    );
    const capabilities = options.capabilities.split(",").map((c) => c.trim());
    const metadataUri = options.metadataUri || `ipfs://agent-${options.name.toLowerCase().replace(/\s+/g, "-")}`;
    const identity = await identityManager.createIdentity({
      metadataUri,
      capabilities,
      stakeAmount: options.stake ? ethers.parseUnits(options.stake, 18) : void 0,
      stakeLockPeriod: BigInt(options.lockPeriod)
    });
    console.log("\n\u2705 Identity created successfully!");
    console.log("\n\u{1F4CB} Identity Details:");
    console.log(`   Operator: ${identity.operator}`);
    console.log(`   NFT Token ID: ${identity.nft.tokenId}`);
    console.log(`   Agent Address: ${identity.haven.agentAddress}`);
    console.log(`   Registered: ${identity.haven.registered}`);
    console.log(`   Capabilities: ${identity.haven.capabilities.join(", ")}`);
    console.log(`   Staked: ${ethers.formatEther(identity.haven.staked)} HAVEN`);
    const yaml = await import("yaml");
    const updatedConfig = {
      ...config,
      identity: {
        erc8004TokenId: identity.nft.tokenId.toString(),
        agentAddress: identity.haven.agentAddress,
        metadataUri: identity.nft.metadataUri,
        capabilities: identity.haven.capabilities
      }
    };
    writeFileSync(options.config || "agent-config.yaml", yaml.default.stringify(updatedConfig));
    console.log("\n\u{1F4BE} Identity saved to configuration");
  } catch (error) {
    console.error("\u274C Failed to create identity:", error.message);
    process.exit(1);
  }
});
program.command("status").description("Show agent status").option("-c, --config <path>", "Path to config file").option("--env", "Load config from environment variables").action(async (options) => {
  try {
    let config;
    if (options.config) {
      config = loadConfigFromFile(options.config);
    } else if (options.env) {
      config = loadConfigFromEnv();
    } else {
      console.error("Error: Please specify --config or --env");
      process.exit(1);
    }
    const daemon = createAgentDaemon(config);
    const status = daemon.getStatus();
    console.log("\n\u{1F4CA} OpenClaw Agent Status\n");
    console.log(`Agent ID:     ${status.agentId}`);
    console.log(`Running:      ${status.running ? "\u2705 Yes" : "\u274C No"}`);
    if (status.identity) {
      console.log("\n\u{1F194} Identity:");
      console.log(`   Agent Address:  ${status.identity.agentAddress || "Not set"}`);
      console.log(`   Token ID:     ${status.identity.tokenId || "Not set"}`);
      console.log(`   Registered:   ${status.identity.registered ? "\u2705 Yes" : "\u274C No"}`);
    }
    console.log("\n\u{1F9E0} Decision Engine:");
    console.log(`   Running:      ${status.decision.running ? "\u2705 Yes" : "\u274C No"}`);
    console.log(`   Rules:        ${status.decision.rules}`);
    console.log("");
  } catch (error) {
    console.error("\u274C Error:", error.message);
    process.exit(1);
  }
});
program.command("init").description("Initialize a new agent configuration").option("--name <name>", "Agent name").option("--output <path>", "Output path for config file", "agent-config.yaml").option("--fuji", "Use Fuji testnet (default)", true).action((options) => {
  try {
    const config = {
      agentId: options.name ? options.name.toLowerCase().replace(/\s+/g, "-") : "my-agent",
      agentName: options.name || "My Agent",
      operatorPrivateKey: "0xYOUR_PRIVATE_KEY_HERE",
      network: {
        chainId: 43113,
        rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
        wsUrl: "wss://api.avax-test.network/ext/bc/C/ws",
        explorerUrl: "https://testnet.snowscan.xyz"
      },
      contracts: getFujiContracts(),
      decision: {
        autoVote: false,
        autoAcceptTasks: false,
        minTaskReward: "1000000000000000000",
        // 1 HAVEN
        votingRules: {
          trustedProposers: []
        }
      },
      transactions: {
        gasPriceBufferPercent: 20,
        confirmationsRequired: 1
      },
      logging: {
        level: "info",
        format: "text"
      },
      identity: void 0
    };
    const yamlContent = generateYamlConfig(config);
    writeFileSync(options.output, yamlContent);
    console.log(`
\u2705 Configuration file created: ${options.output}`);
    console.log("\n\u{1F4DD} Next steps:");
    console.log("   1. Edit the config file and add your private key");
    console.log('   2. Run: openclaw-agent create-identity --config agent-config.yaml --name "My Bot" --capabilities trading,analysis');
    console.log("   3. Run: openclaw-agent start --config agent-config.yaml");
    console.log("");
  } catch (error) {
    console.error("\u274C Error:", error.message);
    process.exit(1);
  }
});
program.parse();
function generateYamlConfig(config) {
  return `# OpenClaw Agent Configuration
# \u26A0\uFE0F SECURITY: Never commit this file with real private key!

agentId: "${config.agentId}"
agentName: "${config.agentName}"
operatorPrivateKey: "${config.operatorPrivateKey}"

network:
  chainId: ${config.network.chainId}
  rpcUrl: "${config.network.rpcUrl}"
  wsUrl: "${config.network.wsUrl}"
  explorerUrl: "${config.network.explorerUrl}"

contracts:
  erc8004Registry: "${config.contracts.erc8004Registry}"
  agentRegistry: "${config.contracts.agentRegistry}"
  agentReputation: "${config.contracts.agentReputation}"
  havenGovernance: "${config.contracts.havenGovernance}"
  havenToken: "${config.contracts.havenToken}"
  taskMarketplace: "${config.contracts.taskMarketplace}"
  gat: "${config.contracts.gat}"
  escrow: "${config.contracts.escrow}"

decision:
  autoVote: ${config.decision.autoVote}
  autoAcceptTasks: ${config.decision.autoAcceptTasks}
  minTaskReward: "${config.decision.minTaskReward}"
  votingRules:
    trustedProposers: ${JSON.stringify(config.decision.votingRules.trustedProposers)}

transactions:
  gasPriceBufferPercent: ${config.transactions.gasPriceBufferPercent}
  confirmationsRequired: ${config.transactions.confirmationsRequired}

logging:
  level: "${config.logging.level}"
  format: "${config.logging.format}"
`;
}
