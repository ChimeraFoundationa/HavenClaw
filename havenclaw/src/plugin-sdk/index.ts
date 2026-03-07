/**
 * HavenClaw Plugin SDK
 */

import type { Provider } from 'ethers'
import type { ContractAddresses } from '../config/contracts.js'

export interface PluginContext {
  provider: Provider
  contracts: ContractAddresses
  config: Record<string, any>
  log: (message: string, ...args: any[]) => void
  executeCommand: (command: string, args: any[]) => Promise<any>
}

export interface Command {
  description: string
  args?: Array<{
    name: string
    type: 'string' | 'number' | 'boolean' | 'address'
    required?: boolean
    description?: string
  }>
  execute: (args: any) => Promise<any>
}

export interface Plugin {
  name: string
  version: string
  description?: string
  author?: string
  activate?: (context: PluginContext) => Promise<void>
  deactivate?: () => Promise<void>
  commands?: Record<string, Command>
  skills?: Skill[]
}

export interface Skill {
  name: string
  description: string
  capabilities: string[]
  configSchema?: any
  execute: (context: PluginContext, input: any) => Promise<any>
}

export function definePlugin(plugin: Plugin): Plugin {
  return plugin
}

export function defineSkill(skill: Skill): Skill {
  return skill
}

export function createPluginContext(options: {
  provider: Provider
  contracts: ContractAddresses
  config: Record<string, any>
}): PluginContext {
  return {
    provider: options.provider,
    contracts: options.contracts,
    config: options.config,
    log: (message, ...args) => {
      console.log(`[${options.config.pluginName || 'plugin'}] ${message}`, ...args)
    },
    executeCommand: async () => {
      throw new Error('Command not implemented')
    }
  }
}

export const contracts = {
  getAgentRegistry: async (context: PluginContext) => {
    const { ethers } = await import('ethers')
    const { AgentRegistryABI } = await import('../config/abi/AgentRegistry.js')
    return new ethers.Contract(context.contracts.AgentRegistry, AgentRegistryABI, context.provider)
  },
  getEscrow: async (context: PluginContext) => {
    const { ethers } = await import('ethers')
    const { NonCustodialEscrowABI } = await import('../config/abi/NonCustodialEscrow.js')
    return new ethers.Contract(context.contracts.NonCustodialEscrow, NonCustodialEscrowABI, context.provider)
  },
  getPredictionMarket: async (context: PluginContext) => {
    const { ethers } = await import('ethers')
    const { PredictionMarketABI } = await import('../config/abi/PredictionMarket.js')
    // Use index signature since PredictionMarket is not in ContractAddresses
    const address = (context.contracts as any)['PredictionMarket'] || context.contracts.GAT
    return new ethers.Contract(address, PredictionMarketABI, context.provider)
  }
}

export const utils = {
  isValidAddress: (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  },
  parseEther: (amount: string | number) => {
    const { ethers } = require('ethers')
    return ethers.parseEther(String(amount))
  },
  formatEther: (amount: bigint) => {
    const { ethers } = require('ethers')
    return ethers.formatEther(amount)
  },
  hash: (data: string) => {
    const { ethers } = require('ethers')
    return ethers.id(data)
  },
  sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
}

export default {
  definePlugin,
  defineSkill,
  createPluginContext,
  contracts,
  utils
}
