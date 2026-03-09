/**
 * IdentityManager - Manage agent identity with ERC-8004
 */

import type { HavenClient } from '@havenclaw/haven-interface';
import { Logger } from '@havenclaw/tools';
import { EventEmitter } from '@havenclaw/runtime';
import { ethers, Signer, Contract } from 'ethers';
import { ERC8004Client } from './ERC8004Client.js';

export interface IdentityConfig {
  operatorPrivateKey: string;
  erc8004Contract: string;
  agentRegistry: string;
  chainId?: number;
}

export interface AgentIdentity {
  operator: string;
  nft: {
    tokenId: bigint;
    contract: string;
    metadataUri: string;
  };
  haven: {
    registered: boolean;
    agentAddress: string;
    capabilities: string[];
    reputation: bigint;
    staked: bigint;
  };
}

export interface CreateIdentityParams {
  metadataUri: string;
  capabilities: string[];
  stakeAmount?: bigint;
  stakeLockPeriod?: bigint;
}

/**
 * IdentityManager handles agent identity lifecycle using ERC-8004 NFT
 */
export class IdentityManager {
  private config: IdentityConfig;
  private client: HavenClient;
  private logger: Logger;
  private eventEmitter: EventEmitter;
  private signer: Signer;

  private erc8004: ERC8004Client;

  private currentIdentity?: AgentIdentity;

  constructor(
    client: HavenClient,
    logger: Logger,
    eventEmitter: EventEmitter,
    config: IdentityConfig
  ) {
    this.client = client;
    this.logger = logger.child({ module: 'IdentityManager' });
    this.eventEmitter = eventEmitter;
    this.config = config;

    // Create signer from private key
    this.signer = new ethers.Wallet(config.operatorPrivateKey, client.provider);

    // Initialize ERC-8004 client
    this.erc8004 = new ERC8004Client(logger, client.provider, {
      contractAddress: config.erc8004Contract,
    });

    this.erc8004.connectSigner(this.signer);
  }

  /**
   * Get current identity
   */
  getIdentity(): AgentIdentity | undefined {
    return this.currentIdentity;
  }

  /**
   * Create agent identity with ERC-8004 NFT
   */
  async createIdentity(params: CreateIdentityParams): Promise<AgentIdentity> {
    this.logger.info('Creating new agent identity');

    // Step 1: Mint ERC-8004 Identity NFT
    this.logger.info('Step 1: Minting ERC-8004 Identity NFT');
    const mintTx = await this.erc8004.mint({ metadataUri: params.metadataUri });
    const mintReceipt = await mintTx.wait();
    if (!mintReceipt) {
      throw new Error('Mint transaction receipt not found');
    }
    const tokenId = await this.erc8004.extractTokenId(mintReceipt);

    this.logger.info(`Minted ERC-8004 NFT with token ID ${tokenId}`);

    // Step 2: Register in HAVEN AgentRegistry (using operator wallet directly)
    this.logger.info('Step 2: Registering in HAVEN AgentRegistry');
    const capabilityHashes = params.capabilities.map((c) =>
      ethers.id(c)
    );

    const registryContract = new Contract(
      this.config.agentRegistry,
      ['function registerAgent(string metadataURI, bytes32[] capabilities) external'],
      this.signer
    );

    const registerTx = await registryContract.registerAgent(params.metadataUri, capabilityHashes);
    await registerTx.wait();

    const operatorAddress = await this.signer.getAddress();
    this.logger.info(`Registered agent in HAVEN at ${operatorAddress}`);

    // Step 3: Optional staking
    if (params.stakeAmount && params.stakeLockPeriod) {
      this.logger.info('Step 3: Staking HAVEN tokens');

      const reputationContract = new Contract(
        this.client.agentReputation.target as string,
        ['function stake(uint256 amount, uint256 lockPeriod) external'],
        this.signer
      );

      const tokenContract = new Contract(
        this.client.havenToken.target as string,
        ['function approve(address spender, uint256 amount) external returns (bool)'],
        this.signer
      );

      const approveTx = await tokenContract.approve(this.client.agentReputation.target, params.stakeAmount);
      await approveTx.wait();

      const stakeTx = await reputationContract.stake(params.stakeAmount, params.stakeLockPeriod);
      await stakeTx.wait();

      this.logger.info(
        `Staked ${params.stakeAmount} HAVEN for ${params.stakeLockPeriod}s`
      );
    }

    // Build identity object
    const identity: AgentIdentity = {
      operator: await this.signer.getAddress(),
      nft: {
        tokenId,
        contract: this.config.erc8004Contract,
        metadataUri: params.metadataUri,
      },
      haven: {
        registered: true,
        agentAddress: operatorAddress,
        capabilities: params.capabilities,
        reputation: 0n,
        staked: params.stakeAmount || 0n,
      },
    };

    this.currentIdentity = identity;

    // Emit event
    this.eventEmitter.emit('runtime:state-change', 'identity', 'created');

    this.logger.info('Agent identity creation complete');
    return identity;
  }

  /**
   * Load existing identity from on-chain state
   */
  async loadIdentity(tokenId: bigint): Promise<AgentIdentity> {
    this.logger.info(`Loading existing identity for token ${tokenId}`);

    // Get NFT info
    const nftInfo = await this.erc8004.getTokenInfo(tokenId);

    const operatorAddress = await this.signer.getAddress();

    // Get HAVEN registration info
    const isRegistered = await this.client.agentRegistry.isRegistered(operatorAddress);
    let havenInfo = {
      registered: false,
      agentAddress: operatorAddress,
      capabilities: [] as string[],
      reputation: 0n,
      staked: 0n,
    };

    if (isRegistered) {
      const agentInfo = await this.client.agentRegistry.getAgent(operatorAddress);
      const reputationInfo = await this.client.agentReputation.getReputation(operatorAddress);

      havenInfo = {
        registered: true,
        agentAddress: operatorAddress,
        capabilities: (agentInfo.capabilities as string[]).map((c) => {
          try {
            return ethers.toUtf8String(c);
          } catch {
            return c;
          }
        }),
        reputation: reputationInfo.score as bigint,
        staked: reputationInfo.stakedAmount as bigint,
      };
    }

    const identity: AgentIdentity = {
      operator: operatorAddress,
      nft: {
        tokenId,
        contract: this.config.erc8004Contract,
        metadataUri: nftInfo.metadataUri,
      },
      haven: havenInfo,
    };

    this.currentIdentity = identity;
    return identity;
  }

  /**
   * Get the operator signer
   */
  getSigner(): Signer {
    return this.signer;
  }
}
