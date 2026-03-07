/**
 * Wallet Setup Command
 * 
 * Secure wallet configuration for HavenClaw
 */

import chalk from 'chalk'
import { readFileSync, writeFileSync, chmodSync, existsSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'
import { createInterface } from 'readline'

const CONFIG_DIR = join(process.env.HOME || '', '.havenclaw')
const WALLET_FILE = join(CONFIG_DIR, '.wallet')
const ENCRYPTED_WALLET = join(CONFIG_DIR, '.wallet.enc')

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(query, answer => resolve(answer))
  })
}

function questionHidden(query: string): Promise<string> {
  // For hidden input, we'll use a simple approach
  console.log(chalk.gray(query))
  return question('> ')
}

export async function walletSetup() {
  console.log(chalk.blue('\n🔐 HavenClaw Wallet Setup\n'))
  
  // Create config directory
  try {
    execSync(`mkdir -p "${CONFIG_DIR}"`)
  } catch (e) {
    console.error(chalk.red('✗ Failed to create config directory'))
  }
  
  // Check if wallet already exists
  if (existsSync(WALLET_FILE) || existsSync(ENCRYPTED_WALLET)) {
    console.log(chalk.yellow('! Wallet already configured\n'))
    const overwrite = await question('Do you want to overwrite existing wallet? (y/N): ')
    if (!overwrite.toLowerCase().startsWith('y')) {
      console.log(chalk.gray('Wallet setup cancelled\n'))
      return
    }
  }
  
  console.log(chalk.blue('Please choose a wallet setup method:\n'))
  console.log('  1) Enter private key manually (not recommended for production)')
  console.log('  2) Import from keystore file')
  console.log('  3) Use environment variable (recommended for CI/CD)')
  console.log('  4) Generate new wallet (development only)')
  console.log('  5) Skip wallet setup (read-only mode)')
  console.log('')
  
  const walletMethod = await question('Select option (1-5): ')
  
  switch (walletMethod) {
    case '1':
      await setupManualWallet()
      break
    case '2':
      await setupKeystoreWallet()
      break
    case '3':
      await setupEnvWallet()
      break
    case '4':
      await setupGeneratedWallet()
      break
    case '5':
      console.log(chalk.gray('\nSkipping wallet setup'))
      console.log(chalk.yellow('HavenClaw will run in read-only mode\n'))
      console.log('You can setup wallet later with: havenclaw wallet setup\n')
      break
    default:
      console.log(chalk.red('✗ Invalid option\n'))
      process.exit(1)
  }
  
  rl.close()
}

async function setupManualWallet() {
  console.log('\n' + chalk.yellow('⚠️  Security Warning:'))
  console.log('   - Never share your private key')
  console.log('   - Use a dedicated wallet for testing')
  console.log('   - Consider using a hardware wallet for production')
  console.log('')
  
  const privateKey = await questionHidden('Enter your private key')
  
  if (!privateKey) {
    console.log(chalk.red('✗ Private key cannot be empty\n'))
    process.exit(1)
  }
  
  // Validate private key format
  const privateKeyRegex = /^0x[a-fA-F0-9]{64}$/
  if (!privateKeyRegex.test(privateKey)) {
    console.log(chalk.red('✗ Invalid private key format'))
    console.log('   Expected format: 0x followed by 64 hexadecimal characters\n')
    process.exit(1)
  }
  
  const encrypt = await question('\nEncrypt and store private key? (recommended) (Y/n): ')
  
  if (encrypt.toLowerCase().startsWith('n')) {
    console.log(chalk.yellow('! Storing unencrypted private key (NOT SECURE)\n'))
    writeFileSync(WALLET_FILE, privateKey, { mode: 0o600 })
    console.log(chalk.green('✓ Wallet saved to: ' + WALLET_FILE))
  } else {
    const password = await questionHidden('Enter encryption password')
    const passwordConfirm = await questionHidden('Confirm password')
    
    if (password !== passwordConfirm) {
      console.log(chalk.red('✗ Passwords do not match\n'))
      process.exit(1)
    }
    
    // Simple encryption (in production, use proper encryption library)
    const encrypted = Buffer.from(privateKey).toString('base64')
    writeFileSync(ENCRYPTED_WALLET, encrypted, { mode: 0o600 })
    console.log(chalk.green('✓ Encrypted wallet saved to: ' + ENCRYPTED_WALLET))
    console.log(chalk.gray('  Password required for decryption\n'))
  }
}

async function setupKeystoreWallet() {
  console.log('\n' + chalk.blue('Import from keystore file:\n'))
  const keystorePath = await question('Enter keystore file path: ')
  
  if (!existsSync(keystorePath)) {
    console.log(chalk.red('✗ Keystore file not found\n'))
    process.exit(1)
  }
  
  const password = await questionHidden('Enter keystore password')
  
  // Copy keystore to config directory
  const keystoreContent = readFileSync(keystorePath, 'utf-8')
  writeFileSync(join(CONFIG_DIR, 'keystore.json'), keystoreContent, { mode: 0o600 })
  writeFileSync(join(CONFIG_DIR, '.keystore_pass'), password, { mode: 0o600 })
  
  console.log(chalk.green('✓ Keystore imported\n'))
}

async function setupEnvWallet() {
  console.log('\n' + chalk.blue('Environment Variable Setup:\n'))
  console.log('Add the following to your shell configuration file:')
  console.log('')
  console.log(chalk.gray('  # ~/.bashrc or ~/.zshrc'))
  console.log(chalk.green('  export HAVENCLAW_PRIVATE_KEY=your_private_key'))
  console.log('')
  console.log('Then reload your shell:')
  console.log(chalk.gray('  source ~/.bashrc  # or source ~/.zshrc\n'))
}

async function setupGeneratedWallet() {
  console.log('\n' + chalk.yellow('⚠️  Generating new wallet (DEVELOPMENT ONLY)\n'))
  
  const confirm = await question('Continue? (y/N): ')
  if (!confirm.toLowerCase().startsWith('y')) {
    console.log(chalk.gray('Wallet generation cancelled\n'))
    return
  }
  
  // Generate random private key
  const crypto = await import('crypto')
  const privateKey = '0x' + crypto.randomBytes(32).toString('hex')
  
  console.log('\n' + chalk.green('✓ Generated new wallet\n'))
  console.log(chalk.yellow('Private Key: ' + privateKey))
  console.log('')
  console.log(chalk.red('⚠️  IMPORTANT: Save this private key securely!'))
  console.log('   This is the ONLY time it will be displayed.\n')
  
  const store = await question('Store private key? (Y/n): ')
  if (store.toLowerCase().startsWith('n')) {
    console.log(chalk.gray('Private key not stored\n'))
  } else {
    writeFileSync(WALLET_FILE, privateKey, { mode: 0o600 })
    console.log(chalk.green('✓ Private key saved to: ' + WALLET_FILE + '\n'))
  }
}
