/**
 * HavenClient - Main interface for HAVEN protocol interaction
 */

import { ethers, Provider, Signer, Contract } from 'ethers';
import {
  AgentRegistryABI,
  AgentReputationABI,
  HavenGovernanceABI,
  TaskMarketplaceABI,
  HAVENABI,
  ERC6551RegistryABI,
  ERC8004RegistryABI,
} from './contracts/abi.js';
import type { ContractAddresses } from './contracts/addresses.js';

// Type-safe contract types
type AgentRegistryContract = Contract;
type AgentReputationContract = Contract;
type HavenGovernanceContract = Contract;
type TaskMarketplaceContract = Contract;
type HAVENContract = Contract;
type ERC6551RegistryContract = Contract;
type ERC8004RegistryContract = Contract;

export interface HavenClientConfig {
  rpcUrl: string;
  contracts: ContractAddresses;
}

export interface NetworkInfo {
  chainId: bigint;
  name: string;
}

/**
 * HavenClient provides read/write access to HAVEN protocol contracts
 */
export class HavenClient {
  public provider: Provider;
  public signer?: Signer;
  public readonly contracts: ContractAddresses;

  // Contract instances (read-only by default)
  public agentRegistry: AgentRegistryContract;
  public agentReputation: AgentReputationContract;
  public havenGovernance: HavenGovernanceContract;
  public taskMarketplace: TaskMarketplaceContract;
  public havenToken: HAVENContract;
  public erc6551Registry?: ERC6551RegistryContract;
  public erc8004Registry?: ERC8004RegistryContract;

  constructor(config: HavenClientConfig) {
    this.contracts = config.contracts;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);

    // Initialize read-only contract instances
    this.agentRegistry = this._createContract(
      config.contracts.agentRegistry,
      AgentRegistryABI
    );
    this.agentReputation = this._createContract(
      config.contracts.agentReputation,
      AgentReputationABI
    );
    this.havenGovernance = this._createContract(
      config.contracts.havenGovernance,
      HavenGovernanceABI
    );
    this.taskMarketplace = this._createContract(
      config.contracts.taskMarketplace,
      TaskMarketplaceABI
    );
    this.havenToken = this._createContract(
      config.contracts.havenToken,
      HAVENABI
    );

    // Optional contracts
    if (config.contracts.erc6551Registry) {
      this.erc6551Registry = this._createContract(
        config.contracts.erc6551Registry,
        ERC6551RegistryABI
      );
    }

    if (config.contracts.erc8004Registry) {
      this.erc8004Registry = this._createContract(
        config.contracts.erc8004Registry,
        ERC8004RegistryABI
      );
    }
  }

  /**
   * Connect a signer to enable write operations
   */
  async connectSigner(signer: Signer): Promise<void> {
    this.signer = signer;

    // Reconnect all contracts with signer
    this.agentRegistry = this._createContract(
      this.contracts.agentRegistry,
      AgentRegistryABI,
      signer
    );
    this.agentReputation = this._createContract(
      this.contracts.agentReputation,
      AgentReputationABI,
      signer
    );
    this.havenGovernance = this._createContract(
      this.contracts.havenGovernance,
      HavenGovernanceABI,
      signer
    );
    this.taskMarketplace = this._createContract(
      this.contracts.taskMarketplace,
      TaskMarketplaceABI,
      signer
    );
    this.havenToken = this._createContract(
      this.contracts.havenToken,
      HAVENABI,
      signer
    );

    if (this.erc6551Registry && this.contracts.erc6551Registry) {
      this.erc6551Registry = this._createContract(
        this.contracts.erc6551Registry,
        ERC6551RegistryABI,
        signer
      );
    }

    if (this.erc8004Registry && this.contracts.erc8004Registry) {
      this.erc8004Registry = this._createContract(
        this.contracts.erc8004Registry,
        ERC8004RegistryABI,
        signer
      );
    }
  }

  /**
   * Get network information
   */
  async getNetworkInfo(): Promise<NetworkInfo> {
    const network = await this.provider.getNetwork();
    return {
      chainId: network.chainId,
      name: this._getNetworkName(Number(network.chainId)),
    };
  }

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<bigint> {
    return BigInt(await this.provider.getBlockNumber());
  }

  /**
   * Get balance of an address (ETH/AVAX)
   */
  async getBalance(address: string): Promise<bigint> {
    return this.provider.getBalance(address);
  }

  /**
   * Get HAVEN token balance
   */
  async getHAVENBalance(address: string): Promise<bigint> {
    return this.havenToken.balanceOf(address);
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(
    txHash: string,
    confirmations: number = 1
  ): Promise<ethers.TransactionReceipt> {
    const receipt = await this.provider.waitForTransaction(txHash, confirmations);
    if (!receipt) {
      throw new Error(`Transaction receipt not found for ${txHash}`);
    }
    return receipt;
  }

  /**
   * Get gas price data
   */
  async getFeeData(): Promise<ethers.FeeData> {
    return this.provider.getFeeData();
  }

  /**
   * Get nonce for an address
   */
  async getTransactionCount(address: string): Promise<number> {
    return this.provider.getTransactionCount(address);
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(
    to: string,
    data: string,
    value?: bigint
  ): Promise<bigint> {
    return this.provider.estimateGas({ to, data, value });
  }

  /**
   * Call a contract read function
   */
  async callContract(
    contractAddress: string,
    abi: readonly string[],
    functionName: string,
    args?: any[]
  ): Promise<any> {
    const contract = this._createContract(contractAddress, abi);
    return contract[functionName](...(args || []));
  }

  private _createContract(
    address: string,
    abi: readonly string[],
    signerOrProvider?: Signer | Provider
  ): Contract {
    return new Contract(address, abi, signerOrProvider || this.provider);
  }

  private _getNetworkName(chainId: number): string {
    const networks: Record<number, string> = {
      43113: 'Avalanche Fuji Testnet',
      43114: 'Avalanche C-Chain',
      1: 'Ethereum Mainnet',
      5: 'Goerli Testnet',
    };
    return networks[chainId] || `Unknown (${chainId})`;
  }
}
