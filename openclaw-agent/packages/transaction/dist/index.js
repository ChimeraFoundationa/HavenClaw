// src/GasOracle.ts
import { ethers } from "ethers";
var GasOracle = class {
  client;
  logger;
  config;
  lastEstimate;
  estimateTTL = 12e3;
  // 12 seconds (1 block)
  constructor(client, logger, config = {}) {
    this.client = client;
    this.logger = logger.child({ module: "GasOracle" });
    this.config = {
      gasPriceBufferPercent: 20,
      // 20% buffer
      ...config
    };
  }
  /**
   * Get current gas estimate
   */
  async getGasEstimate() {
    if (this.lastEstimate) {
      const age = Date.now() - this.lastEstimate.estimatedAt;
      if (age < this.estimateTTL) {
        return this.lastEstimate;
      }
    }
    const estimate = await this.fetchGasEstimate();
    this.lastEstimate = estimate;
    this.logger.debug(
      `Gas estimate: ${ethers.formatUnits(estimate.maxFeePerGas, "gwei")} gwei`
    );
    return estimate;
  }
  /**
   * Get maximum fee per gas from config
   */
  getMaxFeePerGas() {
    return this.config.maxFeePerGas;
  }
  /**
   * Get maximum priority fee per gas from config
   */
  getMaxPriorityFeePerGas() {
    return this.config.maxPriorityFeePerGas;
  }
  /**
   * Estimate gas for a transaction
   */
  async estimateGas(to, data, value) {
    try {
      const estimate = await this.client.estimateGas(to, data, value);
      const buffered = this.applyBuffer(estimate);
      this.logger.debug(`Gas limit estimate: ${buffered.toString()}`);
      return buffered;
    } catch (error) {
      this.logger.error("Gas estimation failed", error);
      throw new GasEstimationError(to, error);
    }
  }
  /**
   * Calculate total gas cost
   */
  async estimateTotalCost(to, data, value) {
    const [gasEstimate, gasLimit] = await Promise.all([
      this.getGasEstimate(),
      this.estimateGas(to, data, value)
    ]);
    return gasEstimate.maxFeePerGas * gasLimit;
  }
  async fetchGasEstimate() {
    const feeData = await this.client.getFeeData();
    let maxFeePerGas = feeData.maxFeePerGas || feeData.gasPrice || 0n;
    let maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || this.getDefaultPriorityFee();
    maxFeePerGas = this.applyBuffer(maxFeePerGas);
    if (this.config.maxFeePerGas && maxFeePerGas > this.config.maxFeePerGas) {
      maxFeePerGas = this.config.maxFeePerGas;
      this.logger.warn("Gas price capped at configured maximum");
    }
    if (this.config.maxPriorityFeePerGas && maxPriorityFeePerGas > this.config.maxPriorityFeePerGas) {
      maxPriorityFeePerGas = this.config.maxPriorityFeePerGas;
    }
    return {
      maxFeePerGas,
      maxPriorityFeePerGas,
      gasLimit: 21000n,
      // Base gas limit, will be overridden per transaction
      estimatedAt: Date.now()
    };
  }
  applyBuffer(value) {
    const bufferPercent = this.config.gasPriceBufferPercent || 20;
    return value * BigInt(100 + bufferPercent) / 100n;
  }
  getDefaultPriorityFee() {
    return ethers.parseUnits("1.5", "gwei");
  }
};
var GasEstimationError = class extends Error {
  constructor(target, cause) {
    super(`Failed to estimate gas for ${target}: ${cause.message}`);
    this.name = "GasEstimationError";
  }
};

// src/NonceManager.ts
var NonceManager = class {
  client;
  logger;
  address;
  config;
  confirmedNonce = null;
  pendingNonces = /* @__PURE__ */ new Set();
  nextNonce = null;
  syncInterval;
  constructor(client, logger, address, config = {}) {
    this.client = client;
    this.logger = logger.child({ module: "NonceManager", address });
    this.address = address;
    this.config = {
      syncInterval: 3e4,
      // 30 seconds
      ...config
    };
  }
  /**
   * Initialize nonce manager
   */
  async initialize() {
    this.confirmedNonce = await this.client.getTransactionCount(this.address);
    this.nextNonce = this.confirmedNonce;
    this.pendingNonces.clear();
    this.logger.debug(`Initialized with nonce ${this.confirmedNonce}`);
    this.startSync();
  }
  /**
   * Get next available nonce
   */
  async getNextNonce() {
    if (this.confirmedNonce === null) {
      await this.initialize();
    }
    const nonce = this.nextNonce ?? this.confirmedNonce ?? 0;
    this.pendingNonces.add(nonce);
    this.nextNonce = nonce + 1;
    this.logger.debug(`Allocated nonce ${nonce}`);
    return nonce;
  }
  /**
   * Mark a nonce as confirmed
   */
  confirmNonce(nonce) {
    if (this.pendingNonces.has(nonce)) {
      this.pendingNonces.delete(nonce);
      this.logger.debug(`Confirmed nonce ${nonce}`);
      if (this.confirmedNonce !== null && nonce >= this.confirmedNonce && nonce <= this.confirmedNonce + 10) {
        this.confirmedNonce = nonce + 1;
      }
    }
  }
  /**
   * Reset a nonce (for failed transactions)
   */
  resetNonce(nonce) {
    this.pendingNonces.delete(nonce);
    if (this.nextNonce !== null && nonce < this.nextNonce) {
      this.nextNonce = nonce;
      this.logger.debug(`Reset nonce to ${nonce}`);
    }
  }
  /**
   * Sync nonce state with blockchain
   */
  async syncWithChain() {
    try {
      const chainNonce = await this.client.getTransactionCount(this.address);
      for (const pendingNonce of this.pendingNonces) {
        if (pendingNonce < chainNonce) {
          this.pendingNonces.delete(pendingNonce);
          this.logger.debug(`Cleared pending nonce ${pendingNonce}`);
        }
      }
      if (this.confirmedNonce === null || chainNonce > this.confirmedNonce) {
        this.confirmedNonce = chainNonce;
      }
      if (this.nextNonce === null || this.nextNonce < chainNonce) {
        this.nextNonce = chainNonce;
      }
      this.logger.debug(`Synced with chain: ${chainNonce}`);
    } catch (error) {
      this.logger.error("Failed to sync with chain", error);
    }
  }
  /**
   * Get pending transaction count
   */
  getPendingCount() {
    return this.pendingNonces.size;
  }
  /**
   * Get current nonce state
   */
  getState() {
    return {
      confirmed: this.confirmedNonce,
      next: this.nextNonce,
      pending: this.pendingNonces.size
    };
  }
  /**
   * Stop the nonce manager
   */
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = void 0;
    }
  }
  startSync() {
    this.syncInterval = setInterval(
      () => this.syncWithChain(),
      this.config.syncInterval
    );
  }
};

// src/TransactionBuilder.ts
import { ethers as ethers2 } from "ethers";
var TransactionBuilder = class {
  client;
  gasOracle;
  nonceManager;
  constructor(client, gasOracle, nonceManager) {
    this.client = client;
    this.gasOracle = gasOracle;
    this.nonceManager = nonceManager;
  }
  /**
   * Build a transaction
   */
  async build(params, metadata) {
    const gasLimit = params.gasLimit ?? await this.gasOracle.estimateGas(
      params.target,
      params.calldata,
      params.value
    );
    const gasEstimate = await this.gasOracle.getGasEstimate();
    const nonce = await this.nonceManager.getNextNonce();
    const network = await this.client.getNetworkInfo();
    const tx = {
      to: params.target,
      data: params.calldata,
      value: params.value || 0n,
      gasLimit,
      maxFeePerGas: gasEstimate.maxFeePerGas,
      maxPriorityFeePerGas: gasEstimate.maxPriorityFeePerGas,
      nonce,
      chainId: Number(network.chainId),
      preparedAt: Date.now(),
      expiresAt: Date.now() + 3e5,
      // 5 minute expiry
      metadata
    };
    return tx;
  }
  /**
   * Build a contract call transaction
   */
  async buildContractCall(contractAddress, abi, functionName, args = [], value) {
    const iface = new ethers2.Interface(abi);
    const calldata = iface.encodeFunctionData(functionName, args);
    return this.build({
      target: contractAddress,
      calldata,
      value
    });
  }
  /**
   * Check if transaction is still valid
   */
  isTransactionValid(tx) {
    return Date.now() < tx.expiresAt;
  }
  /**
   * Refresh transaction with new gas prices and nonce
   */
  async refresh(tx) {
    if (!this.isTransactionValid(tx)) {
      throw new Error("Transaction expired");
    }
    const gasEstimate = await this.gasOracle.getGasEstimate();
    const network = await this.client.getNetworkInfo();
    return {
      ...tx,
      maxFeePerGas: gasEstimate.maxFeePerGas,
      maxPriorityFeePerGas: gasEstimate.maxPriorityFeePerGas,
      chainId: Number(network.chainId),
      preparedAt: Date.now(),
      expiresAt: Date.now() + 3e5
    };
  }
};

// src/TransactionSigner.ts
import { ethers as ethers3 } from "ethers";
var TransactionSigner = class {
  signer;
  constructor(signer) {
    this.signer = signer;
  }
  /**
   * Sign a prepared transaction
   */
  async sign(tx) {
    if (Date.now() > tx.expiresAt) {
      throw new TransactionExpiredError(tx.preparedAt);
    }
    const populatedTx = await this.signer.populateTransaction({
      to: tx.to,
      data: tx.data,
      value: tx.value,
      gasLimit: tx.gasLimit,
      maxFeePerGas: tx.maxFeePerGas,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
      nonce: tx.nonce,
      chainId: tx.chainId,
      type: 2
      // EIP-1559 transaction
    });
    const signedTx = await this.signer.signTransaction(populatedTx);
    const txDetails = ethers3.Transaction.from(signedTx);
    if (!txDetails.hash || !txDetails.signature) {
      throw new Error("Failed to parse signed transaction");
    }
    return {
      ...tx,
      hash: txDetails.hash,
      signature: txDetails.signature,
      rawTransaction: signedTx
    };
  }
  /**
   * Get the signer's address
   */
  async getAddress() {
    return this.signer.getAddress();
  }
  /**
   * Sign a message (for non-transaction signing)
   */
  async signMessage(message) {
    return this.signer.signMessage(message);
  }
  /**
   * Sign typed data (EIP-712)
   */
  async signTypedData(domain, types, value) {
    return this.signer.signTypedData(domain, types, value);
  }
};
var TransactionExpiredError = class extends Error {
  constructor(preparedAt) {
    super(
      `Transaction expired (prepared at ${new Date(preparedAt).toISOString()})`
    );
    this.name = "TransactionExpiredError";
  }
};

// src/TransactionSubmitter.ts
var TransactionSubmitter = class {
  client;
  eventEmitter;
  logger;
  nonceManager;
  confirmationsRequired;
  constructor(client, eventEmitter, logger, nonceManager, confirmationsRequired = 1) {
    this.client = client;
    this.eventEmitter = eventEmitter;
    this.logger = logger.child({ module: "TransactionSubmitter" });
    this.nonceManager = nonceManager;
    this.confirmationsRequired = confirmationsRequired;
  }
  /**
   * Submit a signed transaction
   */
  async submit(signedTx) {
    this.logger.info(
      `Submitting transaction ${signedTx.hash} (nonce: ${signedTx.nonce})`
    );
    try {
      const txResponse = await this.client.provider.broadcastTransaction(
        signedTx.rawTransaction
      );
      this.logger.debug(`Transaction broadcast: ${txResponse.hash}`);
      this.eventEmitter.emit("transaction:submitted", {
        hash: txResponse.hash,
        nonce: Number(signedTx.nonce),
        submittedAt: Date.now()
      });
      return txResponse.hash;
    } catch (error) {
      this.logger.error("Transaction submission failed", error);
      this.nonceManager.resetNonce(signedTx.nonce);
      throw new TransactionSubmissionError(signedTx.hash, error);
    }
  }
  /**
   * Wait for transaction confirmation
   */
  async waitForConfirmation(txHash, confirmations) {
    const requiredConfirmations = confirmations || this.confirmationsRequired;
    this.logger.debug(
      `Waiting for ${requiredConfirmations} confirmation(s) of ${txHash}`
    );
    try {
      const receipt = await this.client.waitForTransaction(
        txHash,
        requiredConfirmations
      );
      if (receipt.status === 0) {
        this.logger.error(`Transaction reverted: ${txHash}`);
        this.eventEmitter.emit("transaction:failed", {
          hash: txHash,
          status: "reverted",
          gasUsed: receipt.gasUsed,
          error: "Transaction reverted"
        });
        throw new TransactionRevertedError(txHash, receipt);
      }
      this.logger.info(
        `Transaction confirmed: ${txHash} (block: ${receipt.blockNumber}, gas: ${receipt.gasUsed})`
      );
      this.eventEmitter.emit("transaction:confirmed", {
        hash: txHash,
        blockNumber: BigInt(receipt.blockNumber),
        gasUsed: BigInt(receipt.gasUsed)
      });
      return receipt;
    } catch (error) {
      if (error instanceof TransactionRevertedError) {
        throw error;
      }
      this.logger.error("Confirmation wait failed", error);
      throw new ConfirmationError(txHash, error);
    }
  }
  /**
   * Submit and wait for confirmation
   */
  async submitAndWait(signedTx, confirmations) {
    try {
      const hash = await this.submit(signedTx);
      const receipt = await this.waitForConfirmation(hash, confirmations);
      return {
        hash,
        status: "confirmed",
        receipt
      };
    } catch (error) {
      return {
        hash: signedTx.hash,
        status: "failed",
        error: error.message
      };
    }
  }
  /**
   * Get transaction status
   */
  async getTransactionStatus(txHash) {
    try {
      const receipt = await this.client.provider.getTransactionReceipt(txHash);
      if (!receipt) {
        const tx = await this.client.provider.getTransaction(txHash);
        if (tx) {
          return {
            hash: txHash,
            status: "pending"
          };
        }
        return {
          hash: txHash,
          status: "failed",
          error: "Transaction not found"
        };
      }
      return {
        hash: txHash,
        status: "confirmed",
        receipt
      };
    } catch (error) {
      return {
        hash: txHash,
        status: "failed",
        error: error.message
      };
    }
  }
};
var TransactionSubmissionError = class extends Error {
  constructor(hash, cause) {
    super(`Failed to submit transaction ${hash}: ${cause.message}`);
    this.name = "TransactionSubmissionError";
  }
};
var TransactionRevertedError = class extends Error {
  constructor(hash, _receipt) {
    super(`Transaction reverted: ${hash}`);
    this.name = "TransactionRevertedError";
  }
};
var ConfirmationError = class extends Error {
  constructor(hash, cause) {
    super(`Failed to confirm transaction ${hash}: ${cause.message}`);
    this.name = "ConfirmationError";
  }
};
export {
  ConfirmationError,
  GasEstimationError,
  GasOracle,
  NonceManager,
  TransactionBuilder,
  TransactionExpiredError,
  TransactionRevertedError,
  TransactionSigner,
  TransactionSubmissionError,
  TransactionSubmitter
};
