/**
 * HavenClaw Main Index
 */

export * from './plugin-sdk/index.js'
export * from './config/contracts.js'
export { getProvider, getSigner, getNetworkInfo, connectToNetwork } from './lib/provider.js'

export const VERSION = '1.0.0'

export interface HavenClawAPI {
  connect: (privateKey: string, rpcUrl?: string) => Promise<void>
  disconnect: () => void
  getNetwork: () => Promise<{ chainId: number; name: string }>
  getContracts: () => Record<string, string>
}

export function createHavenClaw(): HavenClawAPI {
  return {
    async connect(privateKey: string, rpcUrl?: string) {
      process.env.HAVENCLAW_PRIVATE_KEY = privateKey
      if (rpcUrl) {
        process.env.HAVENCLAW_RPC_URL = rpcUrl
      }
      const { getProvider } = await import('./lib/provider.js')
      getProvider()
    },
    
    disconnect() {
      const { resetConnection } = require('./lib/provider.js')
      resetConnection()
    },
    
    async getNetwork() {
      const { getNetworkInfo } = await import('./lib/provider.js')
      const network = await getNetworkInfo()
      return { chainId: Number(network.chainId), name: network.name }
    },
    
    getContracts() {
      const { getContractAddresses } = require('./config/contracts.js')
      return getContractAddresses()
    }
  }
}

export default createHavenClaw
