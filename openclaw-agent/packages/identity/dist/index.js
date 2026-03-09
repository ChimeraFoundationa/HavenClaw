// src/ERC8004Client.ts
import { ethers } from "ethers";
var ERC8004Client = class {
  logger;
  contractAddress;
  contract;
  constructor(logger, provider, config) {
    this.logger = logger.child({ module: "ERC8004Client" });
    this.contractAddress = config.contractAddress;
    const abi = [
      "function mint(address to, string metadataURI) external returns (uint256)",
      "function tokenURI(uint256 tokenId) external view returns (string)",
      "function ownerOf(uint256 tokenId) external view returns (address)",
      "function isRegistered(uint256 tokenId) external view returns (bool)",
      "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
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
  connectSigner(signer) {
    this.contract = this.contract.connect(signer);
  }
  /**
   * Mint a new ERC-8004 Identity NFT
   */
  async mint(params) {
    this.logger.info(`Minting ERC-8004 NFT with metadata: ${params.metadataUri}`);
    try {
      const tx = await this.contract.mint(
        await this.contract.signer.getAddress(),
        params.metadataUri
      );
      this.logger.debug(`Mint transaction sent: ${tx.hash}`);
      return tx;
    } catch (error) {
      this.logger.error("Mint failed", error);
      throw new MintError(params.metadataUri, error);
    }
  }
  /**
   * Get token info
   */
  async getTokenInfo(tokenId) {
    try {
      const [owner, metadataUri, isRegistered] = await Promise.all([
        this.contract.ownerOf(tokenId),
        this.contract.tokenURI(tokenId),
        this.contract.isRegistered(tokenId)
      ]);
      return {
        tokenId,
        owner,
        metadataUri,
        isRegistered
      };
    } catch (error) {
      this.logger.error(`Failed to get token info for ${tokenId}`, error);
      throw new TokenInfoError(tokenId, error);
    }
  }
  /**
   * Check if token exists
   */
  async tokenExists(tokenId) {
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
  async extractTokenId(receipt) {
    const transferEvent = this.contract.interface.parseLog(
      receipt.logs.find((log) => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed?.name === "Transfer";
        } catch {
          return false;
        }
      })
    );
    if (!transferEvent) {
      throw new Error("Transfer event not found in receipt");
    }
    return transferEvent.args[2];
  }
};
var MintError = class extends Error {
  constructor(metadataUri, cause) {
    super(`Failed to mint NFT with metadata ${metadataUri}: ${cause.message}`);
    this.name = "MintError";
  }
};
var TokenInfoError = class extends Error {
  constructor(tokenId, cause) {
    super(`Failed to get token info for ${tokenId}: ${cause.message}`);
    this.name = "TokenInfoError";
  }
};

// src/IdentityManager.ts
import { ethers as ethers2, Contract } from "ethers";
var IdentityManager = class {
  config;
  client;
  logger;
  eventEmitter;
  signer;
  erc8004;
  currentIdentity;
  constructor(client, logger, eventEmitter, config) {
    this.client = client;
    this.logger = logger.child({ module: "IdentityManager" });
    this.eventEmitter = eventEmitter;
    this.config = config;
    this.signer = new ethers2.Wallet(config.operatorPrivateKey, client.provider);
    this.erc8004 = new ERC8004Client(logger, client.provider, {
      contractAddress: config.erc8004Contract
    });
    this.erc8004.connectSigner(this.signer);
  }
  /**
   * Get current identity
   */
  getIdentity() {
    return this.currentIdentity;
  }
  /**
   * Create agent identity with ERC-8004 NFT
   */
  async createIdentity(params) {
    this.logger.info("Creating new agent identity");
    this.logger.info("Step 1: Minting ERC-8004 Identity NFT");
    const mintTx = await this.erc8004.mint({ metadataUri: params.metadataUri });
    const mintReceipt = await mintTx.wait();
    if (!mintReceipt) {
      throw new Error("Mint transaction receipt not found");
    }
    const tokenId = await this.erc8004.extractTokenId(mintReceipt);
    this.logger.info(`Minted ERC-8004 NFT with token ID ${tokenId}`);
    this.logger.info("Step 2: Registering in HAVEN AgentRegistry");
    const capabilityHashes = params.capabilities.map(
      (c) => ethers2.id(c)
    );
    const registryContract = new Contract(
      this.config.agentRegistry,
      ["function registerAgent(string metadataURI, bytes32[] capabilities) external"],
      this.signer
    );
    const registerTx = await registryContract.registerAgent(params.metadataUri, capabilityHashes);
    await registerTx.wait();
    const operatorAddress = await this.signer.getAddress();
    this.logger.info(`Registered agent in HAVEN at ${operatorAddress}`);
    if (params.stakeAmount && params.stakeLockPeriod) {
      this.logger.info("Step 3: Staking HAVEN tokens");
      const reputationContract = new Contract(
        this.client.agentReputation.target,
        ["function stake(uint256 amount, uint256 lockPeriod) external"],
        this.signer
      );
      const tokenContract = new Contract(
        this.client.havenToken.target,
        ["function approve(address spender, uint256 amount) external returns (bool)"],
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
    const identity = {
      operator: await this.signer.getAddress(),
      nft: {
        tokenId,
        contract: this.config.erc8004Contract,
        metadataUri: params.metadataUri
      },
      haven: {
        registered: true,
        agentAddress: operatorAddress,
        capabilities: params.capabilities,
        reputation: 0n,
        staked: params.stakeAmount || 0n
      }
    };
    this.currentIdentity = identity;
    this.eventEmitter.emit("runtime:state-change", "identity", "created");
    this.logger.info("Agent identity creation complete");
    return identity;
  }
  /**
   * Load existing identity from on-chain state
   */
  async loadIdentity(tokenId) {
    this.logger.info(`Loading existing identity for token ${tokenId}`);
    const nftInfo = await this.erc8004.getTokenInfo(tokenId);
    const operatorAddress = await this.signer.getAddress();
    const isRegistered = await this.client.agentRegistry.isRegistered(operatorAddress);
    let havenInfo = {
      registered: false,
      agentAddress: operatorAddress,
      capabilities: [],
      reputation: 0n,
      staked: 0n
    };
    if (isRegistered) {
      const agentInfo = await this.client.agentRegistry.getAgent(operatorAddress);
      const reputationInfo = await this.client.agentReputation.getReputation(operatorAddress);
      havenInfo = {
        registered: true,
        agentAddress: operatorAddress,
        capabilities: agentInfo.capabilities.map((c) => {
          try {
            return ethers2.toUtf8String(c);
          } catch {
            return c;
          }
        }),
        reputation: reputationInfo.score,
        staked: reputationInfo.stakedAmount
      };
    }
    const identity = {
      operator: operatorAddress,
      nft: {
        tokenId,
        contract: this.config.erc8004Contract,
        metadataUri: nftInfo.metadataUri
      },
      haven: havenInfo
    };
    this.currentIdentity = identity;
    return identity;
  }
  /**
   * Get the operator signer
   */
  getSigner() {
    return this.signer;
  }
};
export {
  ERC8004Client,
  IdentityManager,
  MintError,
  TokenInfoError
};
