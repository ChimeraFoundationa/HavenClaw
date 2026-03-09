/**
 * TransactionSubmitter - Submit and monitor transactions
 */

import type { HavenClient } from '@havenclaw/haven-interface';
import { EventEmitter } from '@havenclaw/runtime';
import { Logger } from '@havenclaw/tools';
import { SignedTransaction } from './TransactionSigner.js';
import { NonceManager } from './NonceManager.js';
import { ethers } from 'ethers';

export interface SubmissionResult {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  receipt?: ethers.TransactionReceipt;
  error?: string;
}

/**
 * TransactionSubmitter broadcasts transactions and monitors confirmations
 */
export class TransactionSubmitter {
  private client: HavenClient;
  private eventEmitter: EventEmitter;
  private logger: Logger;
  private nonceManager: NonceManager;
  private confirmationsRequired: number;

  constructor(
    client: HavenClient,
    eventEmitter: EventEmitter,
    logger: Logger,
    nonceManager: NonceManager,
    confirmationsRequired: number = 1
  ) {
    this.client = client;
    this.eventEmitter = eventEmitter;
    this.logger = logger.child({ module: 'TransactionSubmitter' });
    this.nonceManager = nonceManager;
    this.confirmationsRequired = confirmationsRequired;
  }

  /**
   * Submit a signed transaction
   */
  async submit(signedTx: SignedTransaction): Promise<string> {
    this.logger.info(
      `Submitting transaction ${signedTx.hash} (nonce: ${signedTx.nonce})`
    );

    try {
      // Broadcast to network
      const txResponse = await this.client.provider.broadcastTransaction(
        signedTx.rawTransaction
      );

      this.logger.debug(`Transaction broadcast: ${txResponse.hash}`);

      // Emit submission event
      this.eventEmitter.emit('transaction:submitted', {
        hash: txResponse.hash,
        nonce: Number(signedTx.nonce),
        submittedAt: Date.now(),
      } as any);

      return txResponse.hash;
    } catch (error) {
      this.logger.error('Transaction submission failed', error as Error);

      // Reset nonce for failed submission
      this.nonceManager.resetNonce(signedTx.nonce as number);

      throw new TransactionSubmissionError(signedTx.hash, error as Error);
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForConfirmation(
    txHash: string,
    confirmations?: number
  ): Promise<ethers.TransactionReceipt> {
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

        this.eventEmitter.emit('transaction:failed', {
          hash: txHash,
          status: 'reverted',
          gasUsed: receipt.gasUsed,
          error: 'Transaction reverted',
        });

        throw new TransactionRevertedError(txHash, receipt);
      }

      this.logger.info(
        `Transaction confirmed: ${txHash} (block: ${receipt.blockNumber}, gas: ${receipt.gasUsed})`
      );

      // Emit confirmation event
      this.eventEmitter.emit('transaction:confirmed', {
        hash: txHash,
        blockNumber: BigInt(receipt.blockNumber),
        gasUsed: BigInt(receipt.gasUsed),
      } as any);

      return receipt;
    } catch (error) {
      if (error instanceof TransactionRevertedError) {
        throw error;
      }

      this.logger.error('Confirmation wait failed', error as Error);
      throw new ConfirmationError(txHash, error as Error);
    }
  }

  /**
   * Submit and wait for confirmation
   */
  async submitAndWait(
    signedTx: SignedTransaction,
    confirmations?: number
  ): Promise<SubmissionResult> {
    try {
      // Submit transaction
      const hash = await this.submit(signedTx);

      // Wait for confirmation
      const receipt = await this.waitForConfirmation(hash, confirmations);

      return {
        hash,
        status: 'confirmed',
        receipt,
      };
    } catch (error) {
      return {
        hash: signedTx.hash,
        status: 'failed',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(txHash: string): Promise<SubmissionResult> {
    try {
      const receipt = await this.client.provider.getTransactionReceipt(txHash);

      if (!receipt) {
        const tx = await this.client.provider.getTransaction(txHash);
        if (tx) {
          return {
            hash: txHash,
            status: 'pending',
          };
        }

        return {
          hash: txHash,
          status: 'failed',
          error: 'Transaction not found',
        };
      }

      return {
        hash: txHash,
        status: 'confirmed',
        receipt,
      };
    } catch (error) {
      return {
        hash: txHash,
        status: 'failed',
        error: (error as Error).message,
      };
    }
  }
}

export class TransactionSubmissionError extends Error {
  constructor(hash: string, cause: Error) {
    super(`Failed to submit transaction ${hash}: ${cause.message}`);
    this.name = 'TransactionSubmissionError';
  }
}

export class TransactionRevertedError extends Error {
  constructor(hash: string, _receipt: ethers.TransactionReceipt) {
    super(`Transaction reverted: ${hash}`);
    this.name = 'TransactionRevertedError';
  }
}

export class ConfirmationError extends Error {
  constructor(hash: string, cause: Error) {
    super(`Failed to confirm transaction ${hash}: ${cause.message}`);
    this.name = 'ConfirmationError';
  }
}
