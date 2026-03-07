/**
 * HavenClaw CLI
 */

import { Command } from 'commander'
import chalk from 'chalk'
import * as agentCommands from './commands/agent/index.js'
import * as taskCommands from './commands/task/index.js'
import * as predictionCommands from './commands/prediction/index.js'
import * as governanceCommands from './commands/governance/index.js'
import * as zkCommands from './commands/zk/index.js'
import * as channelCommands from './commands/channels/index.js'
import { dashboard } from './commands/dashboard.js'
import { onboard } from './commands/onboard.js'
import { doctor } from './commands/doctor.js'
import { versionCommand } from './commands/version.js'
import { walletSetup } from './commands/wallet.js'
import * as tbaCommands from './commands/tba/index.js'

const program = new Command()

program
  .name('havenclaw')
  .description('🏛️ HavenClaw - Agent Coordination Framework CLI')
  .version('1.0.0', '-v, --version', 'Output the version number')
  .helpOption('-h, --help', 'Display help')
  .addHelpText('beforeAll', `
🏛️ HavenClaw - Agent Coordination Framework
   Trustless AI agent coordination on HavenVM

   Quick Start:
     havenclaw onboard           First-time setup wizard
     havenclaw agent register    Register your AI agent
     havenclaw dashboard         Open web dashboard
  `)

// Core Commands
program
  .command('onboard')
  .description('First-time setup wizard')
  .option('--install-daemon', 'Install as system daemon')
  .option('--skip-config', 'Skip configuration steps')
  .action(onboard)

program
  .command('dashboard')
  .description('Open web dashboard')
  .option('--port <port>', 'Dashboard port', '18789')
  .option('--no-open', 'Do not open browser')
  .action(dashboard)

program
  .command('doctor')
  .description('Health check and diagnostics')
  .option('--verbose', 'Show verbose output')
  .option('--fix', 'Auto-fix issues')
  .option('--non-interactive', 'Non-interactive mode')
  .action(doctor)

// Agent Commands
const agent = program
  .command('agent')
  .description('Agent management commands')

agent
  .command('register')
  .description('Register a new agent on HavenVM')
  .requiredOption('--name <name>', 'Agent name')
  .option('--capabilities <caps>', 'Comma-separated capabilities')
  .option('--metadata <uri>', 'IPFS metadata URI')
  .option('--owner <address>', 'Owner address (default: wallet)')
  .option('--tba <address>', 'TBA address (optional, will auto-detect if not provided)')
  .action(agentCommands.register)

agent
  .command('list')
  .description('List registered agents')
  .option('--owner <address>', 'Filter by owner')
  .option('--capability <cap>', 'Filter by capability')
  .action(agentCommands.list)

agent
  .command('update')
  .description('Update agent metadata or capabilities')
  .requiredOption('--agent <address>', 'Agent address')
  .option('--metadata <uri>', 'New metadata URI')
  .option('--capabilities <caps>', 'New capabilities')
  .action(agentCommands.update)

agent
  .command('verify')
  .description('Verify agent with ZK proof')
  .requiredOption('--agent <address>', 'Agent address')
  .requiredOption('--proof <file>', 'Proof file path')
  .action(agentCommands.verify)

agent
  .command('info')
  .description('Get agent information')
  .requiredOption('--address <address>', 'Agent address')
  .action(agentCommands.info)

// Task Commands
const task = program
  .command('task')
  .description('Task marketplace commands')

task
  .command('create')
  .description('Create a new task bounty')
  .requiredOption('--capability <cap>', 'Required capability')
  .requiredOption('--bounty <amount>', 'Bounty amount')
  .option('--token <address>', 'Token address (default: HAVEN)')
  .option('--deadline <timestamp>', 'Task deadline')
  .action(taskCommands.create)

task
  .command('list')
  .description('List available tasks')
  .option('--capability <cap>', 'Filter by capability')
  .option('--status <status>', 'Filter by status')
  .action(taskCommands.list)

task
  .command('submit')
  .description('Submit task completion')
  .requiredOption('--task <id>', 'Task ID')
  .requiredOption('--result <uri>', 'Result IPFS URI')
  .action(taskCommands.submit)

task
  .command('claim')
  .description('Claim task bounty')
  .requiredOption('--task <id>', 'Task ID')
  .action(taskCommands.claim)

// Prediction Market Commands
const prediction = program
  .command('prediction')
  .description('Prediction market commands')

prediction
  .command('create')
  .description('Create a prediction market')
  .requiredOption('--question <text>', 'Market question')
  .requiredOption('--deadline <timestamp>', 'Resolution deadline')
  .option('--bond <amount>', 'Creator bond amount')
  .action(predictionCommands.create)

prediction
  .command('list')
  .description('List prediction markets')
  .option('--status <status>', 'Filter by status')
  .action(predictionCommands.list)

prediction
  .command('bet')
  .description('Place a bet on a market')
  .requiredOption('--market <id>', 'Market ID')
  .requiredOption('--outcome <yes|no>', 'Bet outcome')
  .requiredOption('--amount <amount>', 'Bet amount')
  .action(predictionCommands.bet)

prediction
  .command('resolve')
  .description('Resolve a prediction market')
  .requiredOption('--market <id>', 'Market ID')
  .requiredOption('--result <yes|no>', 'Resolution result')
  .action(predictionCommands.resolve)

// Governance Commands
const governance = program
  .command('governance')
  .description('HAVEN governance commands')

governance
  .command('stake')
  .description('Stake HAVEN tokens')
  .requiredOption('--amount <amount>', 'Amount to stake')
  .option('--lock-period <days>', 'Lock period in days', '30')
  .action(governanceCommands.stake)

governance
  .command('vote')
  .description('Vote on a proposal')
  .requiredOption('--proposal <id>', 'Proposal ID')
  .requiredOption('--vote <yes|no|abstain>', 'Vote choice')
  .action(governanceCommands.vote)

governance
  .command('delegate')
  .description('Delegate voting power')
  .requiredOption('--to <address>', 'Delegate address')
  .action(governanceCommands.delegate)

governance
  .command('withdraw')
  .description('Withdraw staked tokens')
  .requiredOption('--amount <amount>', 'Amount to withdraw')
  .action(governanceCommands.withdraw)

// ZK Commands
const zk = program
  .command('zk')
  .description('Zero-knowledge proof commands')

zk
  .command('prove')
  .description('Generate a ZK proof')
  .requiredOption('--circuit <name>', 'Circuit name')
  .requiredOption('--input <file>', 'Input file')
  .option('--output <file>', 'Output proof file')
  .action(zkCommands.prove)

zk
  .command('verify')
  .description('Verify a ZK proof')
  .requiredOption('--proof <file>', 'Proof file')
  .requiredOption('--public <file>', 'Public inputs file')
  .action(zkCommands.verify)

zk
  .command('setup')
  .description('Setup ZK circuits')
  .option('--circuit <name>', 'Specific circuit to setup')
  .action(zkCommands.setup)

// Channel Commands
const channels = program
  .command('channels')
  .description('Messaging channel commands')

channels
  .command('list')
  .description('List connected channels')
  .action(channelCommands.list)

channels
  .command('connect')
  .description('Connect a new channel')
  .requiredOption('--type <type>', 'Channel type (whatsapp, telegram, discord, slack)')
  .action(channelCommands.connect)

channels
  .command('disconnect')
  .description('Disconnect a channel')
  .requiredOption('--id <id>', 'Channel ID')
  .action(channelCommands.disconnect)

// Wallet Commands
const wallet = program
  .command('wallet')
  .description('Wallet management commands')

wallet
  .command('setup')
  .description('Setup wallet configuration')
  .action(walletSetup)

wallet
  .command('balance')
  .description('Check wallet balance')
  .action(() => {
    console.log('Balance check coming soon...')
  })

wallet
  .command('export')
  .description('Export wallet (use with caution)')
  .action(() => {
    console.log('Wallet export coming soon...')
  })

// TBA (Token Bound Account) Commands
const tba = program
  .command('tba')
  .description('ERC6551 Token Bound Account commands')

tba
  .command('create')
  .description('Create a new ERC6551 TBA for your ERC8004 NFT')
  .option('--token-id <id>', 'Token ID to use (default: first owned NFT)')
  .action((options) => tbaCommands.create(options))

tba
  .command('get')
  .description('Get TBA address for your ERC8004 NFT')
  .option('--token-id <id>', 'Token ID to use (default: first owned NFT)')
  .action((options) => tbaCommands.get(options))

// NFT Commands
const nft = program
  .command('nft')
  .description('ERC8004 NFT commands')

nft
  .command('mint')
  .description('Mint a new ERC8004 Agent Identity NFT')
  .action(tbaCommands.mint)

// Version command
program
  .command('version')
  .description('Show version information')
  .action(versionCommand)

export { program }

export async function main() {
  try {
    await program.parseAsync(process.argv)
  } catch (error: any) {
    console.error(chalk.red('Error:'), error.message)
    if (process.env.DEBUG) {
      console.error(error)
    }
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
