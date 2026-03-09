/**
 * ERC8004Client - ERC-8004 Identity NFT operations
 */

import { Logger } from '@havenclaw/tools';
import { ethers, Provider } from 'ethers';

export interface ERC8004Config {
  contractAddress: string;
}

export interface MintParams {
  metadataUri: string;
}

export interface TokenInfo {
  tokenId: bigint;
  owner: string;
  metadataUri: string;
  isRegistered: boolean;
}

/**
 * ERC8004Client handles ERC-8004 Identity NFT operations
 */
export class ERC8004Client {
  private logger: Logger;
  public readonly contractAddress: string;

  private contract: any;

  constructor(logger: Logger, provider: Provider, config: ERC8004Config) {
    this.logger = logger.child({ module: 'ERC8004Client' });
    this.contractAddress = config.contractAddress;

    // Create contract instance
    const abi = [
      'function mint(address to, string metadataURI) external returns (uint256)',
      'function tokenURI(uint256 tokenId) external view returns (string)',
      'function ownerOf(uint256 tokenId) external view returns (address)',
      'function isRegistered(uint256 tokenId) external view returns (bool)',
      'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
    ];

    this.contract = new ethers.Contract(
      config.contractAddress,
      abi,
      provider
    );
  }

  /**
   * Connect signer for write operations
   */
  connectSigner(signer: ethers.Signer): void {
    this.contract = this.contract.connect(signer);
  }

  /**
   * Mint a new ERC-8004 Identity NFT
   */
  async mint(params: MintParams): Promise<ethers.TransactionResponse> {
    this.logger.info(`Minting ERC-8004 NFT with metadata: ${params.metadataUri}`);

    try {
      // For mint, we need a signer - this should be called after connectSigner
      const tx = await this.contract.mint(
        await this.contract.signer.getAddress(),
        params.metadataUri
      );

      this.logger.debug(`Mint transaction sent: ${tx.hash}`);
      return tx;
    } catch (error) {
      this.logger.error('Mint failed', error as Error);
      throw new MintError(params.metadataUri, error as Error);
    }
  }

  /**
   * Get token info
   */
  async getTokenInfo(tokenId: bigint): Promise<TokenInfo> {
    try {
      const [owner, metadataUri, isRegistered] = await Promise.all([
        this.contract.ownerOf(tokenId),
        this.contract.tokenURI(tokenId),
        this.contract.isRegistered(tokenId),
      ]);

      return {
        tokenId,
        owner: owner as string,
        metadataUri: metadataUri as string,
        isRegistered: isRegistered as boolean,
      };
    } catch (error) {
      this.logger.error(`Failed to get token info for ${tokenId}`, error as Error);
      throw new TokenInfoError(tokenId, error as Error);
    }
  }

  /**
   * Check if token exists
   */
  async tokenExists(tokenId: bigint): Promise<boolean> {
    try {
      await this.contract.ownerOf(tokenId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extract token ID from mint transaction receipt
   */
  async extractTokenId(receipt: ethers.TransactionReceipt): Promise<bigint> {
    const transferEvent = this.contract.interface.parseLog(
      receipt.logs.find((log) => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed?.name === 'Transfer';
        } catch {
          return false;
        }
      })!
    );

    if (!transferEvent) {
      throw new Error('Transfer event not found in receipt');
    }

    return transferEvent.args[2] as bigint;
  }
}

export class MintError extends Error {
  constructor(metadataUri: string, cause: Error) {
    super(`Failed to mint NFT with metadata ${metadataUri}: ${cause.message}`);
    this.name = 'MintError';
  }
}

export class TokenInfoError extends Error {
  constructor(tokenId: bigint, cause: Error) {
    super(`Failed to get token info for ${tokenId}: ${cause.message}`);
    this.name = 'TokenInfoError';
  }
}
