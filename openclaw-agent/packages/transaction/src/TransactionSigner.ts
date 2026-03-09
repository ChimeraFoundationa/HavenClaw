/**
 * TransactionSigner - Sign transactions with TBA keys
 */

import { ethers, Signer } from 'ethers';
import { PreparedTransaction } from './TransactionBuilder.js';

export interface SignedTransaction extends PreparedTransaction {
  hash: string;
  signature: ethers.Signature;
  rawTransaction: string;
}

/**
 * TransactionSigner signs transactions with a private key
 */
export class TransactionSigner {
  private signer: Signer;

  constructor(signer: Signer) {
    this.signer = signer;
  }

  /**
   * Sign a prepared transaction
   */
  async sign(tx: PreparedTransaction): Promise<SignedTransaction> {
    // Validate transaction not expired
    if (Date.now() > tx.expiresAt) {
      throw new TransactionExpiredError(tx.preparedAt);
    }

    // Populate transaction for signing
    const populatedTx = await this.signer.populateTransaction({
      to: tx.to,
      data: tx.data,
      value: tx.value,
      gasLimit: tx.gasLimit,
      maxFeePerGas: tx.maxFeePerGas,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
      nonce: tx.nonce,
      chainId: tx.chainId,
      type: 2, // EIP-1559 transaction
    });

    // Sign the transaction
    const signedTx = await this.signer.signTransaction(populatedTx);

    // Parse the signed transaction to get hash and signature
    const txDetails = ethers.Transaction.from(signedTx);

    if (!txDetails.hash || !txDetails.signature) {
      throw new Error('Failed to parse signed transaction');
    }

    return {
      ...tx,
      hash: txDetails.hash,
      signature: txDetails.signature,
      rawTransaction: signedTx,
    };
  }

  /**
   * Get the signer's address
   */
  async getAddress(): Promise<string> {
    return this.signer.getAddress();
  }

  /**
   * Sign a message (for non-transaction signing)
   */
  async signMessage(message: string | Uint8Array): Promise<string> {
    return this.signer.signMessage(message);
  }

  /**
   * Sign typed data (EIP-712)
   */
  async signTypedData(
    domain: ethers.TypedDataDomain,
    types: Record<string, ethers.TypedDataField[]>,
    value: Record<string, any>
  ): Promise<string> {
    return this.signer.signTypedData(domain, types, value);
  }
}

export class TransactionExpiredError extends Error {
  constructor(preparedAt: number) {
    super(
      `Transaction expired (prepared at ${new Date(preparedAt).toISOString()})`
    );
    this.name = 'TransactionExpiredError';
  }
}
