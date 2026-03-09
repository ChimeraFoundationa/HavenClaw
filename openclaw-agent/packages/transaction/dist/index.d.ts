import { HavenClient } from '@havenclaw/haven-interface';
import { Logger } from '@havenclaw/tools';
import { TransactionRequest, ethers, Signer } from 'ethers';
import { EventEmitter } from '@havenclaw/runtime';

/**
 * GasOracle - Manage gas price estimation and limits
 */

interface GasOracleConfig {
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
    gasPriceBufferPercent?: number;
}
interface GasEstimate {
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
    gasLimit: bigint;
    estimatedAt: number;
}
/**
 * GasOracle provides gas price estimation with configurable limits
 */
declare class GasOracle {
    private client;
    private logger;
    private config;
    private lastEstimate?;
    private estimateTTL;
    constructor(client: HavenClient, logger: Logger, config?: GasOracleConfig);
    /**
     * Get current gas estimate
     */
    getGasEstimate(): Promise<GasEstimate>;
    /**
     * Get maximum fee per gas from config
     */
    getMaxFeePerGas(): bigint | undefined;
    /**
     * Get maximum priority fee per gas from config
     */
    getMaxPriorityFeePerGas(): bigint | undefined;
    /**
     * Estimate gas for a transaction
     */
    estimateGas(to: string, data: string, value?: bigint): Promise<bigint>;
    /**
     * Calculate total gas cost
     */
    estimateTotalCost(to: string, data: string, value?: bigint): Promise<bigint>;
    private fetchGasEstimate;
    private applyBuffer;
    private getDefaultPriorityFee;
}
declare class GasEstimationError extends Error {
    constructor(target: string, cause: Error);
}

/**
 * NonceManager - Manage transaction nonces
 */

interface NonceManagerConfig {
    syncInterval?: number;
}
/**
 * NonceManager tracks and allocates nonces for transactions
 */
declare class NonceManager {
    private client;
    private logger;
    private address;
    private config;
    private confirmedNonce;
    private pendingNonces;
    private nextNonce;
    private syncInterval?;
    constructor(client: HavenClient, logger: Logger, address: string, config?: NonceManagerConfig);
    /**
     * Initialize nonce manager
     */
    initialize(): Promise<void>;
    /**
     * Get next available nonce
     */
    getNextNonce(): Promise<number>;
    /**
     * Mark a nonce as confirmed
     */
    confirmNonce(nonce: number): void;
    /**
     * Reset a nonce (for failed transactions)
     */
    resetNonce(nonce: number): void;
    /**
     * Sync nonce state with blockchain
     */
    syncWithChain(): Promise<void>;
    /**
     * Get pending transaction count
     */
    getPendingCount(): number;
    /**
     * Get current nonce state
     */
    getState(): {
        confirmed: number | null;
        next: number | null;
        pending: number;
    };
    /**
     * Stop the nonce manager
     */
    stop(): void;
    private startSync;
}

/**
 * TransactionBuilder - Build transactions for HAVEN protocol
 */

interface TransactionParams {
    target: string;
    calldata: string;
    value?: bigint;
    gasLimit?: bigint;
}
interface PreparedTransaction extends TransactionRequest {
    preparedAt: number;
    expiresAt: number;
    metadata?: Record<string, any>;
}
interface TransactionMetadata {
    action: string;
    description?: string;
    priority?: number;
}
/**
 * TransactionBuilder prepares transactions with proper gas and nonce
 */
declare class TransactionBuilder {
    private client;
    private gasOracle;
    private nonceManager;
    constructor(client: HavenClient, gasOracle: GasOracle, nonceManager: NonceManager);
    /**
     * Build a transaction
     */
    build(params: TransactionParams, metadata?: TransactionMetadata): Promise<PreparedTransaction>;
    /**
     * Build a contract call transaction
     */
    buildContractCall(contractAddress: string, abi: readonly string[], functionName: string, args?: any[], value?: bigint): Promise<PreparedTransaction>;
    /**
     * Check if transaction is still valid
     */
    isTransactionValid(tx: PreparedTransaction): boolean;
    /**
     * Refresh transaction with new gas prices and nonce
     */
    refresh(tx: PreparedTransaction): Promise<PreparedTransaction>;
}

/**
 * TransactionSigner - Sign transactions with TBA keys
 */

interface SignedTransaction extends PreparedTransaction {
    hash: string;
    signature: ethers.Signature;
    rawTransaction: string;
}
/**
 * TransactionSigner signs transactions with a private key
 */
declare class TransactionSigner {
    private signer;
    constructor(signer: Signer);
    /**
     * Sign a prepared transaction
     */
    sign(tx: PreparedTransaction): Promise<SignedTransaction>;
    /**
     * Get the signer's address
     */
    getAddress(): Promise<string>;
    /**
     * Sign a message (for non-transaction signing)
     */
    signMessage(message: string | Uint8Array): Promise<string>;
    /**
     * Sign typed data (EIP-712)
     */
    signTypedData(domain: ethers.TypedDataDomain, types: Record<string, ethers.TypedDataField[]>, value: Record<string, any>): Promise<string>;
}
declare class TransactionExpiredError extends Error {
    constructor(preparedAt: number);
}

/**
 * TransactionSubmitter - Submit and monitor transactions
 */

interface SubmissionResult {
    hash: string;
    status: 'pending' | 'confirmed' | 'failed';
    receipt?: ethers.TransactionReceipt;
    error?: string;
}
/**
 * TransactionSubmitter broadcasts transactions and monitors confirmations
 */
declare class TransactionSubmitter {
    private client;
    private eventEmitter;
    private logger;
    private nonceManager;
    private confirmationsRequired;
    constructor(client: HavenClient, eventEmitter: EventEmitter, logger: Logger, nonceManager: NonceManager, confirmationsRequired?: number);
    /**
     * Submit a signed transaction
     */
    submit(signedTx: SignedTransaction): Promise<string>;
    /**
     * Wait for transaction confirmation
     */
    waitForConfirmation(txHash: string, confirmations?: number): Promise<ethers.TransactionReceipt>;
    /**
     * Submit and wait for confirmation
     */
    submitAndWait(signedTx: SignedTransaction, confirmations?: number): Promise<SubmissionResult>;
    /**
     * Get transaction status
     */
    getTransactionStatus(txHash: string): Promise<SubmissionResult>;
}
declare class TransactionSubmissionError extends Error {
    constructor(hash: string, cause: Error);
}
declare class TransactionRevertedError extends Error {
    constructor(hash: string, _receipt: ethers.TransactionReceipt);
}
declare class ConfirmationError extends Error {
    constructor(hash: string, cause: Error);
}

export { ConfirmationError, type GasEstimate, GasEstimationError, GasOracle, type GasOracleConfig, NonceManager, type NonceManagerConfig, type PreparedTransaction, type SignedTransaction, type SubmissionResult, TransactionBuilder, TransactionExpiredError, type TransactionMetadata, type TransactionParams, TransactionRevertedError, TransactionSigner, TransactionSubmissionError, TransactionSubmitter };
