import { Logger } from '@havenclaw/tools';
import { Provider, ethers, Signer } from 'ethers';
import { HavenClient } from '@havenclaw/haven-interface';
import { EventEmitter } from '@havenclaw/runtime';

/**
 * ERC8004Client - ERC-8004 Identity NFT operations
 */

interface ERC8004Config {
    contractAddress: string;
}
interface MintParams {
    metadataUri: string;
}
interface TokenInfo {
    tokenId: bigint;
    owner: string;
    metadataUri: string;
    isRegistered: boolean;
}
/**
 * ERC8004Client handles ERC-8004 Identity NFT operations
 */
declare class ERC8004Client {
    private logger;
    readonly contractAddress: string;
    private contract;
    constructor(logger: Logger, provider: Provider, config: ERC8004Config);
    /**
     * Connect signer for write operations
     */
    connectSigner(signer: ethers.Signer): void;
    /**
     * Mint a new ERC-8004 Identity NFT
     */
    mint(params: MintParams): Promise<ethers.TransactionResponse>;
    /**
     * Get token info
     */
    getTokenInfo(tokenId: bigint): Promise<TokenInfo>;
    /**
     * Check if token exists
     */
    tokenExists(tokenId: bigint): Promise<boolean>;
    /**
     * Extract token ID from mint transaction receipt
     */
    extractTokenId(receipt: ethers.TransactionReceipt): Promise<bigint>;
}
declare class MintError extends Error {
    constructor(metadataUri: string, cause: Error);
}
declare class TokenInfoError extends Error {
    constructor(tokenId: bigint, cause: Error);
}

/**
 * IdentityManager - Manage agent identity with ERC-8004
 */

interface IdentityConfig {
    operatorPrivateKey: string;
    erc8004Contract: string;
    agentRegistry: string;
    chainId?: number;
}
interface AgentIdentity {
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
interface CreateIdentityParams {
    metadataUri: string;
    capabilities: string[];
    stakeAmount?: bigint;
    stakeLockPeriod?: bigint;
}
/**
 * IdentityManager handles agent identity lifecycle using ERC-8004 NFT
 */
declare class IdentityManager {
    private config;
    private client;
    private logger;
    private eventEmitter;
    private signer;
    private erc8004;
    private currentIdentity?;
    constructor(client: HavenClient, logger: Logger, eventEmitter: EventEmitter, config: IdentityConfig);
    /**
     * Get current identity
     */
    getIdentity(): AgentIdentity | undefined;
    /**
     * Create agent identity with ERC-8004 NFT
     */
    createIdentity(params: CreateIdentityParams): Promise<AgentIdentity>;
    /**
     * Load existing identity from on-chain state
     */
    loadIdentity(tokenId: bigint): Promise<AgentIdentity>;
    /**
     * Get the operator signer
     */
    getSigner(): Signer;
}

export { type AgentIdentity, type CreateIdentityParams, ERC8004Client, type ERC8004Config, type IdentityConfig, IdentityManager, MintError, type MintParams, type TokenInfo, TokenInfoError };
