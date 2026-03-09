#!/usr/bin/env node

/**
 * OpenClaw Agent CLI
 */

import { Command } from 'commander';
import { writeFileSync } from 'fs';
import { createAgentDaemon } from './daemon.js';
import { loadConfigFromFile, loadConfigFromEnv, getFujiContracts } from './config.js';
import { ethers } from 'ethers';

const program = new Command();

program
  .name('openclaw-agent')
  .description('OpenClaw Autonomous AI Agent CLI')
  .version('0.1.0');

// Start command
program
  .command('start')
  .description('Start the agent daemon')
  .option('-c, --config <path>', 'Path to config file (YAML/JSON)')
  .option('--env', 'Load config from environment variables')
  .action(async (options) => {
    try {
      let config;
      
      if (options.config) {
        config = loadConfigFromFile(options.config);
      } else if (options.env) {
        config = loadConfigFromEnv();
      } else {
        console.error('Error: Please specify --config or --env');
        process.exit(1);
      }

      const daemon = createAgentDaemon(config);
      
      // Handle shutdown signals
      process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down...');
        await daemon.stop();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        console.log('\n🛑 Shutting down...');
        await daemon.stop();
        process.exit(0);
      });

      await daemon.start();

      // Keep process running
      await new Promise(() => {});
      
    } catch (error) {
      console.error('❌ Failed to start daemon:', (error as Error).message);
      process.exit(1);
    }
  });

// Create identity command
program
  .command('create-identity')
  .description('Create a new agent identity')
  .requiredOption('--name <name>', 'Agent name')
  .requiredOption('--capabilities <caps>', 'Comma-separated capabilities')
  .option('--metadata-uri <uri>', 'Metadata URI (IPFS/Arweave)')
  .option('-c, --config <path>', 'Path to config file')
  .option('--stake <amount>', 'Amount of HAVEN to stake')
  .option('--lock-period <seconds>', 'Stake lock period in seconds', '604800')
  .action(async (options) => {
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

      console.log('🆔 Creating agent identity...');
      console.log(`   Name: ${options.name}`);
      console.log(`   Capabilities: ${options.capabilities}`);

      // Import required modules
      const { IdentityManager } = await import('@havenclaw/identity');
      const { HavenClient } = await import('@havenclaw/haven-interface');
      const { Logger } = await import('@havenclaw/tools');
      const { EventEmitter } = await import('@havenclaw/runtime');

      // Initialize components
      const client = new HavenClient({
        rpcUrl: config.network.rpcUrl,
        contracts: config.contracts,
      });
      await client.connectSigner(signer);

      const logger = new Logger({ level: 'info', format: 'text' });
      const eventEmitter = new EventEmitter();

      const identityManager = new IdentityManager(
        client,
        logger,
        eventEmitter,
        {
          operatorPrivateKey: config.operatorPrivateKey,
          erc8004Contract: config.contracts.erc8004Registry,
          agentRegistry: config.contracts.agentRegistry,
          chainId: config.network.chainId,
        }
      );

      // Create identity
      const capabilities = options.capabilities.split(',').map((c: string) => c.trim());
      const metadataUri = options.metadataUri || `ipfs://agent-${options.name.toLowerCase().replace(/\s+/g, '-')}`;

      const identity = await identityManager.createIdentity({
        metadataUri,
        capabilities,
        stakeAmount: options.stake ? ethers.parseUnits(options.stake, 18) : undefined,
        stakeLockPeriod: BigInt(options.lockPeriod),
      });

      console.log('\n✅ Identity created successfully!');
      console.log('\n📋 Identity Details:');
      console.log(`   Operator: ${identity.operator}`);
      console.log(`   NFT Token ID: ${identity.nft.tokenId}`);
      console.log(`   Agent Address: ${identity.haven.agentAddress}`);
      console.log(`   Registered: ${identity.haven.registered}`);
      console.log(`   Capabilities: ${identity.haven.capabilities.join(', ')}`);
      console.log(`   Staked: ${ethers.formatEther(identity.haven.staked)} HAVEN`);

      // Save identity to config
      const yaml = await import('yaml');
      const updatedConfig = {
        ...config,
        identity: {
          erc8004TokenId: identity.nft.tokenId.toString(),
          agentAddress: identity.haven.agentAddress,
          metadataUri: identity.nft.metadataUri,
          capabilities: identity.haven.capabilities,
        },
      };

      writeFileSync(options.config || 'agent-config.yaml', yaml.default.stringify(updatedConfig));

      console.log('\n💾 Identity saved to configuration');
      
    } catch (error) {
      console.error('❌ Failed to create identity:', (error as Error).message);
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Show agent status')
  .option('-c, --config <path>', 'Path to config file')
  .option('--env', 'Load config from environment variables')
  .action(async (options) => {
    try {
      let config;
      
      if (options.config) {
        config = loadConfigFromFile(options.config);
      } else if (options.env) {
        config = loadConfigFromEnv();
      } else {
        console.error('Error: Please specify --config or --env');
        process.exit(1);
      }

      const daemon = createAgentDaemon(config);
      const status = daemon.getStatus();

      console.log('\n📊 OpenClaw Agent Status\n');
      console.log(`Agent ID:     ${status.agentId}`);
      console.log(`Running:      ${status.running ? '✅ Yes' : '❌ No'}`);
      
      if (status.identity) {
        console.log('\n🆔 Identity:');
        console.log(`   Agent Address:  ${status.identity.agentAddress || 'Not set'}`);
        console.log(`   Token ID:     ${status.identity.tokenId || 'Not set'}`);
        console.log(`   Registered:   ${status.identity.registered ? '✅ Yes' : '❌ No'}`);
      }

      console.log('\n🧠 Decision Engine:');
      console.log(`   Running:      ${status.decision.running ? '✅ Yes' : '❌ No'}`);
      console.log(`   Rules:        ${status.decision.rules}`);

      console.log('');
      
    } catch (error) {
      console.error('❌ Error:', (error as Error).message);
      process.exit(1);
    }
  });

// Init command - create config file
program
  .command('init')
  .description('Initialize a new agent configuration')
  .option('--name <name>', 'Agent name')
  .option('--output <path>', 'Output path for config file', 'agent-config.yaml')
  .option('--fuji', 'Use Fuji testnet (default)', true)
  .action((options) => {
    try {
      const config = {
        agentId: options.name ? options.name.toLowerCase().replace(/\s+/g, '-') : 'my-agent',
        agentName: options.name || 'My Agent',
        operatorPrivateKey: '0xYOUR_PRIVATE_KEY_HERE',
        network: {
          chainId: 43113,
          rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
          wsUrl: 'wss://api.avax-test.network/ext/bc/C/ws',
          explorerUrl: 'https://testnet.snowscan.xyz',
        },
        contracts: getFujiContracts(),
        decision: {
          autoVote: false,
          autoAcceptTasks: false,
          minTaskReward: '1000000000000000000', // 1 HAVEN
          votingRules: {
            trustedProposers: [],
          },
        },
        transactions: {
          gasPriceBufferPercent: 20,
          confirmationsRequired: 1,
        },
        logging: {
          level: 'info',
          format: 'text',
        },
        identity: undefined,
      };

      // Use simple YAML formatting manually
      const yamlContent = generateYamlConfig(config);
      writeFileSync(options.output, yamlContent);
      
      console.log(`\n✅ Configuration file created: ${options.output}`);
      console.log('\n📝 Next steps:');
      console.log('   1. Edit the config file and add your private key');
      console.log('   2. Run: openclaw-agent create-identity --config agent-config.yaml --name "My Bot" --capabilities trading,analysis');
      console.log('   3. Run: openclaw-agent start --config agent-config.yaml');
      console.log('');
      
    } catch (error) {
      console.error('❌ Error:', (error as Error).message);
      process.exit(1);
    }
  });

// Parse and run
program.parse();

/**
 * Generate YAML config string manually (avoid dynamic require)
 */
function generateYamlConfig(config: any): string {
  return `# OpenClaw Agent Configuration
# ⚠️ SECURITY: Never commit this file with real private key!

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
