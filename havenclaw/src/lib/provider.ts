/**
 * Provider and Wallet Management
 */

import { ethers } from 'ethers'
import { NETWORKS, getNetworkConfig } from '../config/contracts.js'

let provider: ethers.Provider | null = null
let signer: ethers.Signer | null = null

/**
 * Get or create provider
 */
export function getProvider(): ethers.Provider {
  if (!provider) {
    const rpcUrl = process.env.HAVENCLAW_RPC_URL || NETWORKS.fuji.rpcUrl
    provider = new ethers.JsonRpcProvider(rpcUrl)
  }
  return provider
}

/**
 * Get signer (creates one if needed)
 */
export async function getSigner(): Promise<ethers.Signer> {
  if (!signer) {
    const privateKey = process.env.HAVENCLAW_PRIVATE_KEY
    
    if (!privateKey) {
      throw new Error(
        'No private key found. Please set HAVENCLAW_PRIVATE_KEY environment variable.'
      )
    }
    
    const provider = getProvider()
    signer = new ethers.Wallet(privateKey, provider)
  }
  return signer
}

/**
 * Get network information
 */
export async function getNetworkInfo() {
  const prov = getProvider()
  const network = await prov.getNetwork()
  return getNetworkConfig(Number(network.chainId))
}

/**
 * Reset provider and signer (useful for testing)
 */
export function resetConnection() {
  provider = null
  signer = null
}

/**
 * Connect to specific network
 */
export async function connectToNetwork(networkName: string) {
  const network = NETWORKS[networkName]
  if (!network) {
    throw new Error(`Unknown network: ${networkName}`)
  }
  
  resetConnection()
  provider = new ethers.JsonRpcProvider(network.rpcUrl)
  
  if (process.env.HAVENCLAW_PRIVATE_KEY) {
    signer = new ethers.Wallet(process.env.HAVENCLAW_PRIVATE_KEY, provider)
  }
  
  return network
}
