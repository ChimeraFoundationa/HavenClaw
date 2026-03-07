/**
 * Onboard Command
 */

import chalk from 'chalk'
import { intro, outro, text, confirm, select } from '@clack/prompts'

export async function onboard(options: {
  installDaemon?: boolean
  skipConfig?: boolean
}) {
  console.log(chalk.blue('\n🏛️ Welcome to HavenClaw!'))
  console.log(chalk.gray('Agent Coordination Framework Setup Wizard\n'))
  
  try {
    intro('Let\'s set up your HavenClaw instance')
    
    const network = await select({
      message: 'Select network',
      options: [
        { value: 'fuji', label: 'Fuji Testnet (Recommended)' },
        { value: 'mainnet', label: 'Avalanche Mainnet' },
        { value: 'local', label: 'Local Network' }
      ],
      initialValue: 'fuji'
    }) as string
    
    const walletSetup = await confirm({
      message: 'Do you have a wallet private key to use?'
    }) as boolean
    
    let privateKey = ''
    if (walletSetup) {
      privateKey = await text({
        message: 'Enter your private key',
        placeholder: '0x...',
        validate: (value) => {
          if (!value.startsWith('0x') || value.length !== 66) {
            return 'Invalid private key format'
          }
        }
      }) as string
    }
    
    const agentName = await text({
      message: 'What is your agent name?',
      placeholder: 'My AI Agent',
      defaultValue: 'My AI Agent'
    }) as string
    
    const installDaemon = options.installDaemon ?? await confirm({
      message: 'Install HavenClaw as a system daemon?'
    }) as boolean
    
    const config = {
      network,
      agentName,
      installDaemon
    }
    
    console.log(chalk.gray('\nSaving configuration...'))
    
    outro('Setup complete! 🎉')
    
    console.log(chalk.green('\n✓ HavenClaw is ready to use!'))
    console.log(chalk.gray('\nNext steps:'))
    console.log(chalk.gray('  1. Run `havenclaw agent register` to register your agent'))
    console.log(chalk.gray('  2. Run `havenclaw dashboard` to open the web UI'))
    console.log(chalk.gray('  3. Visit docs.havenclaw.ai for documentation'))
    
  } catch (error: any) {
    if (error.message === 'User force closed the prompt') {
      console.log(chalk.yellow('\nSetup cancelled.'))
    } else {
      console.error(chalk.red('\nSetup failed:'), error.message)
    }
    process.exit(0)
  }
}
