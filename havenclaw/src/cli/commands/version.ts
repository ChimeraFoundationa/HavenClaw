/**
 * Version Command
 */

import chalk from 'chalk'

const VERSION = '1.0.0'

export async function versionCommand() {
  console.log(chalk.blue('\n🏛️ HavenClaw'))
  console.log(chalk.gray('Agent Coordination Framework'))
  console.log('')
  console.log(chalk.white(`  Version: ${chalk.green(VERSION)}`))
  console.log(chalk.white(`  Node: ${chalk.green(process.version)}`))
  console.log(chalk.white(`  Platform: ${chalk.green(process.platform)} ${chalk.green(process.arch)}`))
  console.log('')
  console.log(chalk.gray('  https://havenclaw.ai'))
  console.log(chalk.gray('  https://github.com/ava-labs/havenclaw'))
  console.log('')
}
