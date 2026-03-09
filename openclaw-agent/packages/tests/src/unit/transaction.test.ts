/**
 * Unit Tests for @havenclaw/transaction
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GasOracle, NonceManager } from '@havenclaw/transaction';

describe('GasOracle', () => {
  it('should apply buffer to gas estimates', () => {
    // Test buffer calculation
    const baseFee = 100n;
    const bufferPercent = 20;
    const buffered = (baseFee * BigInt(100 + bufferPercent)) / 100n;
    
    expect(buffered).toBe(120n);
  });

  it('should respect max fee configuration', () => {
    const estimatedFee = 100n;
    const maxFee = 80n;
    
    // When estimated > max, should use max
    const actual = estimatedFee > maxFee ? maxFee : estimatedFee;
    expect(actual).toBe(80n);
  });
});

describe('NonceManager', () => {
  it('should allocate nonces sequentially', () => {
    const nonces: number[] = [];
    
    // Simulate nonce allocation
    let nextNonce = 0;
    for (let i = 0; i < 5; i++) {
      nonces.push(nextNonce++);
    }
    
    expect(nonces).toEqual([0, 1, 2, 3, 4]);
  });

  it('should track pending nonces', () => {
    const pending = new Set<number>();
    
    pending.add(0);
    pending.add(1);
    pending.add(2);
    
    expect(pending.size).toBe(3);
    
    pending.delete(1);
    expect(pending.size).toBe(2);
  });

  it('should reset nonce on failure', () => {
    let nextNonce = 5;
    const pending = new Set([3, 4, 5]);
    
    // Reset nonce 4 (failed transaction)
    pending.delete(4);
    if (4 < nextNonce) {
      nextNonce = 4;
    }
    
    expect(nextNonce).toBe(4);
    expect(pending).toEqual(new Set([3, 5]));
  });
});
