#!/usr/bin/env node

/**
 * HavenClaw CLI Entry Point
 * 
 * Agent Coordination Framework for HavenVM
 * Trustless AI agent coordination on Avalanche
 */

import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const require = createRequire(import.meta.url)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Bootstrap the CLI
async function bootstrap() {
  try {
    // Try to load from dist first (production)
    const { main } = await import('./dist/cli/main.js')
    await main()
  } catch (error) {
    // Fallback to source (development)
    try {
      const { main } = await import('./src/cli/main.ts')
      await main()
    } catch (sourceError) {
      console.error('Failed to start HavenClaw CLI')
      console.error(sourceError)
      process.exit(1)
    }
  }
}

bootstrap()
