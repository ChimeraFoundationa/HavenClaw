/**
 * Contracts Configuration Tests
 */

import { describe, it, expect } from 'vitest'
import {
  HAVEN_CONTRACTS_FUJI,
  HAVEN_CONTRACTS_MAINNET,
  CHAIN_IDS,
  NETWORKS,
  getContractAddress,
  getContractAddresses,
  getNetworkConfig,
} from '../../src/config/contracts.js'

describe('Contract Addresses', () => {
  it('should have valid Fuji contract addresses', () => {
    expect(HAVEN_CONTRACTS_FUJI).toBeDefined()
    expect(HAVEN_CONTRACTS_FUJI.ERC6551Registry).toMatch(/^0x[a-fA-F0-9]{40}$/)
    expect(HAVEN_CONTRACTS_FUJI.AgentRegistry).toMatch(/^0x[a-fA-F0-9]{40}$/)
    expect(HAVEN_CONTRACTS_FUJI.HAVEN).toMatch(/^0x[a-fA-F0-9]{40}$/)
  })

  it('should have placeholder Mainnet addresses', () => {
    expect(HAVEN_CONTRACTS_MAINNET).toBeDefined()
    expect(HAVEN_CONTRACTS_MAINNET.ERC6551Registry).toBe(
      '0x0000000000000000000000000000000000000000'
    )
  })

  it('should have all required Phase 1 contracts', () => {
    const phase1Contracts = [
      'HAVEN',
      'ERC6551Registry',
      'AgentRegistry',
      'AgentReputation',
      'TaskMarketplace',
      'HavenGovernance',
    ]

    phase1Contracts.forEach(contract => {
      expect(HAVEN_CONTRACTS_FUJI).toHaveProperty(contract)
    })
  })

  it('should have all required Phase 2 contracts', () => {
    const phase2Contracts = [
      'GAT',
      'NonCustodialEscrow',
      'RequestContract',
      'ReputationBridge',
      'PLONKVerifierWrapper',
      'PLONKVerifier',
    ]

    phase2Contracts.forEach(contract => {
      expect(HAVEN_CONTRACTS_FUJI).toHaveProperty(contract)
    })
  })

  it('should have official ERC8004 contracts', () => {
    expect(HAVEN_CONTRACTS_FUJI).toHaveProperty('ERC8004IdentityRegistry')
    expect(HAVEN_CONTRACTS_FUJI).toHaveProperty('ERC8004ReputationRegistry')
  })
})

describe('Chain IDs', () => {
  it('should have correct Fuji chain ID', () => {
    expect(CHAIN_IDS.fuji).toBe(43113)
  })

  it('should have correct Mainnet chain ID', () => {
    expect(CHAIN_IDS.mainnet).toBe(43114)
  })

  it('should have correct Local chain ID', () => {
    expect(CHAIN_IDS.local).toBe(43112)
  })
})

describe('Network Configurations', () => {
  it('should have Fuji network configuration', () => {
    expect(NETWORKS.fuji).toBeDefined()
    expect(NETWORKS.fuji.chainId).toBe(43113)
    expect(NETWORKS.fuji.rpcUrl).toContain('avax-test.network')
    expect(NETWORKS.fuji.explorerUrl).toContain('testnet.snowtrace.io')
  })

  it('should have Mainnet network configuration', () => {
    expect(NETWORKS.mainnet).toBeDefined()
    expect(NETWORKS.mainnet.chainId).toBe(43114)
    expect(NETWORKS.mainnet.rpcUrl).toContain('avax.network')
    expect(NETWORKS.mainnet.explorerUrl).toContain('snowtrace.io')
  })

  it('should have Local network configuration', () => {
    expect(NETWORKS.local).toBeDefined()
    expect(NETWORKS.local.chainId).toBe(43112)
    expect(NETWORKS.local.rpcUrl).toContain('localhost')
  })
})

describe('getContractAddress', () => {
  it('should get contract address for Fuji', () => {
    const address = getContractAddress('ERC6551Registry', CHAIN_IDS.fuji)
    expect(address).toBe(HAVEN_CONTRACTS_FUJI.ERC6551Registry)
  })

  it('should default to Fuji when chainId not specified', () => {
    const address = getContractAddress('AgentRegistry')
    expect(address).toBe(HAVEN_CONTRACTS_FUJI.AgentRegistry)
  })

  it('should get HAVEN token address', () => {
    const address = getContractAddress('HAVEN', CHAIN_IDS.fuji)
    expect(address).toBe(HAVEN_CONTRACTS_FUJI.HAVEN)
  })

  it('should get GAT address', () => {
    const address = getContractAddress('GAT', CHAIN_IDS.fuji)
    expect(address).toBe(HAVEN_CONTRACTS_FUJI.GAT)
  })
})

describe('getContractAddresses', () => {
  it('should get all Fuji contract addresses', () => {
    const addresses = getContractAddresses('fuji')
    expect(addresses).toEqual(HAVEN_CONTRACTS_FUJI)
  })

  it('should default to Fuji when network not specified', () => {
    const addresses = getContractAddresses()
    expect(addresses).toEqual(HAVEN_CONTRACTS_FUJI)
  })
})

describe('getNetworkConfig', () => {
  it('should get Fuji network config by chain ID', () => {
    const config = getNetworkConfig(CHAIN_IDS.fuji)
    expect(config.chainId).toBe(43113)
    expect(config.name).toBe('Fuji Testnet')
  })

  it('should get Mainnet network config by chain ID', () => {
    const config = getNetworkConfig(CHAIN_IDS.mainnet)
    expect(config.chainId).toBe(43114)
    expect(config.name).toBe('Avalanche Mainnet')
  })

  it('should default to Fuji when chain ID not found', () => {
    const config = getNetworkConfig(99999)
    expect(config.chainId).toBe(43113)
  })

  it('should return all network properties', () => {
    const config = getNetworkConfig(CHAIN_IDS.fuji)
    expect(config).toHaveProperty('rpcUrl')
    expect(config).toHaveProperty('explorerUrl')
    expect(config).toHaveProperty('contracts')
  })
})

describe('Address Validation', () => {
  it('should have valid Ethereum addresses for all Fuji contracts', () => {
    const addressRegex = /^0x[a-fA-F0-9]{40}$/

    Object.entries(HAVEN_CONTRACTS_FUJI).forEach(([name, address]) => {
      expect(address).toMatch(
        addressRegex,
        `${name} should be a valid Ethereum address`
      )
    })
  })

  it('should have non-zero addresses for deployed Fuji contracts', () => {
    const deployedContracts = [
      'HAVEN',
      'ERC6551Registry',
      'AgentRegistry',
      'GAT',
      'NonCustodialEscrow',
    ]

    deployedContracts.forEach(contract => {
      const address = HAVEN_CONTRACTS_FUJI[contract as keyof typeof HAVEN_CONTRACTS_FUJI]
      expect(address).not.toBe(
        '0x0000000000000000000000000000000000000000',
        `${contract} should have a deployed address`
      )
    })
  })
})
