/**
 * Integration Tests for OpenClaw Agent
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { ethers } from 'ethers';
import { HavenClient, FUJI_CONTRACTS } from '@havenclaw/haven-interface';

describe('HAVEN Interface Integration', () => {
  let client: HavenClient;

  beforeAll(() => {
    client = new HavenClient({
      rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
      contracts: FUJI_CONTRACTS,
    });
  });

  it('should connect to Fuji testnet', async () => {
    const network = await client.getNetworkInfo();
    expect(network.chainId).toBe(43113n);
    expect(network.name).toBe('Avalanche Fuji Testnet');
  });

  it('should get current block number', async () => {
    const blockNumber = await client.getBlockNumber();
    expect(blockNumber).toBeGreaterThan(0n);
  });

  it('should query agent registry', async () => {
    // Query a known agent address (or zero address for testing)
    const isRegistered = await client.agentRegistry.isRegistered(
      '0x0000000000000000000000000000000000000000'
    );
    expect(typeof isRegistered).toBe('boolean');
  });

  it('should query HAVEN token', async () => {
    const name = await client.havenToken.name();
    const symbol = await client.havenToken.symbol();
    
    expect(name).toBe('Haven');
    expect(symbol).toBe('HAVEN');
  });

  it('should get fee data', async () => {
    const feeData = await client.getFeeData();
    
    expect(feeData.gasPrice).toBeDefined();
    expect(feeData.maxFeePerGas).toBeDefined();
    expect(feeData.maxPriorityFeePerGas).toBeDefined();
  });
});

describe('Contract ABI Compatibility', () => {
  it('should have valid contract addresses', () => {
    // All addresses should be valid hex
    const addresses = Object.values(FUJI_CONTRACTS);
    
    for (const addr of addresses) {
      if (addr) {
        expect(addr).toMatch(/^0x[a-fA-F0-9]{40}$/);
      }
    }
  });

  it('should have consistent address format', () => {
    // All addresses should be 42 characters (0x + 40 hex)
    const addresses = Object.values(FUJI_CONTRACTS).filter(Boolean) as string[];
    
    for (const addr of addresses) {
      expect(addr.length).toBe(42);
    }
  });
});
