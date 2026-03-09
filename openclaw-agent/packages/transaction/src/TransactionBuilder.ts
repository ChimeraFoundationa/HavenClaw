/**
 * TransactionBuilder - Build transactions for HAVEN protocol
 */

import type { HavenClient } from '@havenclaw/haven-interface';
import { GasOracle } from './GasOracle.js';
import { NonceManager } from './NonceManager.js';
import { ethers, TransactionRequest } from 'ethers';

export interface TransactionParams {
  target: string;
  calldata: string;
  value?: bigint;
  gasLimit?: bigint;
}

export interface PreparedTransaction extends TransactionRequest {
  preparedAt: number;
  expiresAt: number;
  metadata?: Record<string, any>;
}

export interface TransactionMetadata {
  action: string;
  description?: string;
  priority?: number;
}

/**
 * TransactionBuilder prepares transactions with proper gas and nonce
 */
export class TransactionBuilder {
  private client: HavenClient;
  private gasOracle: GasOracle;
  private nonceManager: NonceManager;

  constructor(
    client: HavenClient,
    gasOracle: GasOracle,
    nonceManager: NonceManager
  ) {
    this.client = client;
    this.gasOracle = gasOracle;
    this.nonceManager = nonceManager;
  }

  /**
   * Build a transaction
   */
  async build(
    params: TransactionParams,
    metadata?: TransactionMetadata
  ): Promise<PreparedTransaction> {
    // Estimate gas if not provided
    const gasLimit =
      params.gasLimit ??
      (await this.gasOracle.estimateGas(
        params.target,
        params.calldata,
        params.value
      ));

    // Get current gas prices
    const gasEstimate = await this.gasOracle.getGasEstimate();

    // Get next nonce
    const nonce = await this.nonceManager.getNextNonce();

    // Get network info
    const network = await this.client.getNetworkInfo();

    const tx: PreparedTransaction = {
      to: params.target,
      data: params.calldata,
      value: params.value || 0n,
      gasLimit,
      maxFeePerGas: gasEstimate.maxFeePerGas,
      maxPriorityFeePerGas: gasEstimate.maxPriorityFeePerGas,
      nonce,
      chainId: Number(network.chainId),
      preparedAt: Date.now(),
      expiresAt: Date.now() + 300000, // 5 minute expiry
      metadata,
    };

    return tx;
  }

  /**
   * Build a contract call transaction
   */
  async buildContractCall(
    contractAddress: string,
    abi: readonly string[],
    functionName: string,
    args: any[] = [],
    value?: bigint
  ): Promise<PreparedTransaction> {
    // Create contract interface
    const iface = new ethers.Interface(abi);

    // Encode function call
    const calldata = iface.encodeFunctionData(functionName, args);

    return this.build({
      target: contractAddress,
      calldata,
      value,
    });
  }

  /**
   * Check if transaction is still valid
   */
  isTransactionValid(tx: PreparedTransaction): boolean {
    return Date.now() < tx.expiresAt;
  }

  /**
   * Refresh transaction with new gas prices and nonce
   */
  async refresh(tx: PreparedTransaction): Promise<PreparedTransaction> {
    if (!this.isTransactionValid(tx)) {
      throw new Error('Transaction expired');
    }

    // Get new gas estimate
    const gasEstimate = await this.gasOracle.getGasEstimate();

    // Keep the same nonce
    // nonce is already in tx, no need to reassign

    const network = await this.client.getNetworkInfo();

    return {
      ...tx,
      maxFeePerGas: gasEstimate.maxFeePerGas,
      maxPriorityFeePerGas: gasEstimate.maxPriorityFeePerGas,
      chainId: Number(network.chainId),
      preparedAt: Date.now(),
      expiresAt: Date.now() + 300000,
    };
  }
}
