/**
 * Doctor Command - Health Check
 */

import chalk from 'chalk'
import { existsSync } from 'fs'

export async function doctor(options: {
  verbose?: boolean
  fix?: boolean
  nonInteractive?: boolean
}) {
  console.log(chalk.blue('\n🔍 HavenClaw Health Check\n'))
  
  const checks: Array<{ name: string; status: 'pass' | 'warn' | 'fail'; message: string }> = []
  
  const nodeVersion = process.version
  const major = parseInt(nodeVersion.slice(1).split('.')[0])
  if (major >= 22) {
    checks.push({ name: 'Node.js', status: 'pass', message: `v${nodeVersion}` })
  } else {
    checks.push({ name: 'Node.js', status: 'fail', message: `v${nodeVersion} (requires v22+)` })
  }
  
  const configDir = process.env.HOME ? `${process.env.HOME}/.havenclaw` : null
  if (configDir) {
    if (existsSync(configDir)) {
      checks.push({ name: 'Config Directory', status: 'pass', message: configDir })
    } else {
      checks.push({ name: 'Config Directory', status: 'warn', message: 'Not created yet' })
    }
  }
  
  const hasPrivateKey = !!process.env.HAVENCLAW_PRIVATE_KEY
  checks.push({ 
    name: 'Private Key', 
    status: hasPrivateKey ? 'pass' : 'warn', 
    message: hasPrivateKey ? 'Configured' : 'Not set (will use interactive mode)' 
  })
  
  const hasRpcUrl = !!process.env.HAVENCLAW_RPC_URL
  checks.push({ 
    name: 'RPC URL', 
    status: hasRpcUrl ? 'pass' : 'warn', 
    message: hasRpcUrl ? 'Configured' : 'Using default' 
  })
  
  console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  
  for (const check of checks) {
    const icon = check.status === 'pass' ? chalk.green('✓') : check.status === 'warn' ? chalk.yellow('!') : chalk.red('✗')
    console.log(`${icon} ${chalk.bold(check.name)}: ${check.message}`)
  }
  
  console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))
  
  const failures = checks.filter(c => c.status === 'fail').length
  const warnings = checks.filter(c => c.status === 'warn').length
  
  if (failures === 0 && warnings === 0) {
    console.log(chalk.green('✓ All checks passed! HavenClaw is ready.\n'))
  } else if (failures === 0) {
    console.log(chalk.yellow(`! ${warnings} warning(s). HavenClaw can run but some features may be limited.\n`))
  } else {
    console.log(chalk.red(`✗ ${failures} failure(s). Please fix the issues above.\n`))
  }
}
