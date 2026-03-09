/**
 * NonceManager - Manage transaction nonces
 */

import type { HavenClient } from '@havenclaw/haven-interface';
import { Logger } from '@havenclaw/tools';

export interface NonceManagerConfig {
  syncInterval?: number; // How often to sync with chain (ms)
}

/**
 * NonceManager tracks and allocates nonces for transactions
 */
export class NonceManager {
  private client: HavenClient;
  private logger: Logger;
  private address: string;
  private config: NonceManagerConfig;

  private confirmedNonce: number | null = null;
  private pendingNonces: Set<number> = new Set();
  private nextNonce: number | null = null;
  private syncInterval?: NodeJS.Timeout;

  constructor(
    client: HavenClient,
    logger: Logger,
    address: string,
    config: NonceManagerConfig = {}
  ) {
    this.client = client;
    this.logger = logger.child({ module: 'NonceManager', address });
    this.address = address;
    this.config = {
      syncInterval: 30000, // 30 seconds
      ...config,
    };
  }

  /**
   * Initialize nonce manager
   */
  async initialize(): Promise<void> {
    this.confirmedNonce = await this.client.getTransactionCount(this.address);
    this.nextNonce = this.confirmedNonce;
    this.pendingNonces.clear();

    this.logger.debug(`Initialized with nonce ${this.confirmedNonce}`);

    // Start periodic sync
    this.startSync();
  }

  /**
   * Get next available nonce
   */
  async getNextNonce(): Promise<number> {
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
  confirmNonce(nonce: number): void {
    if (this.pendingNonces.has(nonce)) {
      this.pendingNonces.delete(nonce);
      this.logger.debug(`Confirmed nonce ${nonce}`);

      // Update confirmed nonce if this was the oldest pending
      if (
        this.confirmedNonce !== null &&
        nonce >= this.confirmedNonce &&
        nonce <= this.confirmedNonce + 10
      ) {
        this.confirmedNonce = nonce + 1;
      }
    }
  }

  /**
   * Reset a nonce (for failed transactions)
   */
  resetNonce(nonce: number): void {
    this.pendingNonces.delete(nonce);

    if (this.nextNonce !== null && nonce < this.nextNonce) {
      this.nextNonce = nonce;
      this.logger.debug(`Reset nonce to ${nonce}`);
    }
  }

  /**
   * Sync nonce state with blockchain
   */
  async syncWithChain(): Promise<void> {
    try {
      const chainNonce = await this.client.getTransactionCount(this.address);

      // Clear all pending nonces below confirmed
      for (const pendingNonce of this.pendingNonces) {
        if (pendingNonce < chainNonce) {
          this.pendingNonces.delete(pendingNonce);
          this.logger.debug(`Cleared pending nonce ${pendingNonce}`);
        }
      }

      // Update confirmed nonce
      if (this.confirmedNonce === null || chainNonce > this.confirmedNonce) {
        this.confirmedNonce = chainNonce;
      }

      // Reset next nonce if needed
      if (this.nextNonce === null || this.nextNonce < chainNonce) {
        this.nextNonce = chainNonce;
      }

      this.logger.debug(`Synced with chain: ${chainNonce}`);
    } catch (error) {
      this.logger.error('Failed to sync with chain', error as Error);
    }
  }

  /**
   * Get pending transaction count
   */
  getPendingCount(): number {
    return this.pendingNonces.size;
  }

  /**
   * Get current nonce state
   */
  getState(): {
    confirmed: number | null;
    next: number | null;
    pending: number;
  } {
    return {
      confirmed: this.confirmedNonce,
      next: this.nextNonce,
      pending: this.pendingNonces.size,
    };
  }

  /**
   * Stop the nonce manager
   */
  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }
  }

  private startSync(): void {
    this.syncInterval = setInterval(
      () => this.syncWithChain(),
      this.config.syncInterval
    );
  }
}
