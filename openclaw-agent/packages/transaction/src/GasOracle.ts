/**
 * GasOracle - Manage gas price estimation and limits
 */

import type { HavenClient } from '@havenclaw/haven-interface';
import { Logger } from '@havenclaw/tools';
import { ethers } from 'ethers';

export interface GasOracleConfig {
  maxFeePerGas?: bigint; // Maximum fee per gas
  maxPriorityFeePerGas?: bigint; // Maximum priority fee
  gasPriceBufferPercent?: number; // Buffer percentage for estimates
}

export interface GasEstimate {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  gasLimit: bigint;
  estimatedAt: number;
}

/**
 * GasOracle provides gas price estimation with configurable limits
 */
export class GasOracle {
  private client: HavenClient;
  private logger: Logger;
  private config: GasOracleConfig;
  private lastEstimate?: GasEstimate;
  private estimateTTL: number = 12000; // 12 seconds (1 block)

  constructor(
    client: HavenClient,
    logger: Logger,
    config: GasOracleConfig = {}
  ) {
    this.client = client;
    this.logger = logger.child({ module: 'GasOracle' });
    this.config = {
      gasPriceBufferPercent: 20, // 20% buffer
      ...config,
    };
  }

  /**
   * Get current gas estimate
   */
  async getGasEstimate(): Promise<GasEstimate> {
    // Return cached estimate if still valid
    if (this.lastEstimate) {
      const age = Date.now() - this.lastEstimate.estimatedAt;
      if (age < this.estimateTTL) {
        return this.lastEstimate;
      }
    }

    // Fetch fresh estimate
    const estimate = await this.fetchGasEstimate();
    this.lastEstimate = estimate;

    this.logger.debug(
      `Gas estimate: ${ethers.formatUnits(estimate.maxFeePerGas, 'gwei')} gwei`
    );

    return estimate;
  }

  /**
   * Get maximum fee per gas from config
   */
  getMaxFeePerGas(): bigint | undefined {
    return this.config.maxFeePerGas;
  }

  /**
   * Get maximum priority fee per gas from config
   */
  getMaxPriorityFeePerGas(): bigint | undefined {
    return this.config.maxPriorityFeePerGas;
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(
    to: string,
    data: string,
    value?: bigint
  ): Promise<bigint> {
    try {
      const estimate = await this.client.estimateGas(to, data, value);
      // Apply buffer
      const buffered = this.applyBuffer(estimate);
      this.logger.debug(`Gas limit estimate: ${buffered.toString()}`);
      return buffered;
    } catch (error) {
      this.logger.error('Gas estimation failed', error as Error);
      throw new GasEstimationError(to, error as Error);
    }
  }

  /**
   * Calculate total gas cost
   */
  async estimateTotalCost(
    to: string,
    data: string,
    value?: bigint
  ): Promise<bigint> {
    const [gasEstimate, gasLimit] = await Promise.all([
      this.getGasEstimate(),
      this.estimateGas(to, data, value),
    ]);

    return gasEstimate.maxFeePerGas * gasLimit;
  }

  private async fetchGasEstimate(): Promise<GasEstimate> {
    const feeData = await this.client.getFeeData();

    let maxFeePerGas = feeData.maxFeePerGas || feeData.gasPrice || 0n;
    let maxPriorityFeePerGas =
      feeData.maxPriorityFeePerGas || this.getDefaultPriorityFee();

    // Apply buffer to base fee
    maxFeePerGas = this.applyBuffer(maxFeePerGas);

    // Apply configured maximums
    if (this.config.maxFeePerGas && maxFeePerGas > this.config.maxFeePerGas) {
      maxFeePerGas = this.config.maxFeePerGas;
      this.logger.warn('Gas price capped at configured maximum');
    }

    if (
      this.config.maxPriorityFeePerGas &&
      maxPriorityFeePerGas > this.config.maxPriorityFeePerGas
    ) {
      maxPriorityFeePerGas = this.config.maxPriorityFeePerGas;
    }

    return {
      maxFeePerGas,
      maxPriorityFeePerGas,
      gasLimit: 21000n, // Base gas limit, will be overridden per transaction
      estimatedAt: Date.now(),
    };
  }

  private applyBuffer(value: bigint): bigint {
    const bufferPercent = this.config.gasPriceBufferPercent || 20;
    return (value * BigInt(100 + bufferPercent)) / 100n;
  }

  private getDefaultPriorityFee(): bigint {
    // Default priority fee: 1.5 gwei
    return ethers.parseUnits('1.5', 'gwei');
  }
}

export class GasEstimationError extends Error {
  constructor(target: string, cause: Error) {
    super(`Failed to estimate gas for ${target}: ${cause.message}`);
    this.name = 'GasEstimationError';
  }
}
