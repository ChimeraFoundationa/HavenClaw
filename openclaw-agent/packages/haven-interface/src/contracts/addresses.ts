/**
 * Contract Addresses Configuration
 */

export interface ContractAddresses {
  agentRegistry: string;
  agentReputation: string;
  havenGovernance: string;
  taskMarketplace: string;
  havenToken: string;
  erc8004Registry?: string;
  erc6551Registry?: string;
  gat?: string;
  escrow?: string;
}

/**
 * Fuji Testnet Contract Addresses (Deployed)
 */
export const FUJI_CONTRACTS: ContractAddresses = {
  agentRegistry: '0x58EcC1A3B5a9c78f59A594120405058FB40a3201',
  agentReputation: '0x662BdE306632F8923ADcb6aBEEbD3bCAf5400AaC',
  havenGovernance: '0x283C8AEB114d2025A48C064eb99FEb6248c4E6f',
  taskMarketplace: '0xFbD804508Ad7C65aE5D23090018eB2eE400ea1e5',
  havenToken: '0x0f847172d1C496dd847d893A0318dBF4B826ef63',
  erc8004Registry: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
  erc6551Registry: '0xaCA0fA40b2eaAdcdF1c72cB36e88aBd76C0EA464',
  gat: '0xa91393D9f9A770e70E02128BCF6b2413Ca391212',
  escrow: '0xC4Bb287c74FF92cD4B0c62D51523a03FD0F0C543',
};

/**
 * Get contract addresses for a specific network
 */
export function getContractAddresses(chainId?: number): ContractAddresses {
  if (chainId === 43113) {
    return FUJI_CONTRACTS;
  }
  
  // Default to Fuji if no chainId specified
  return FUJI_CONTRACTS;
}
