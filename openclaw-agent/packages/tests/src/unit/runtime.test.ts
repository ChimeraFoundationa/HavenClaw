/**
 * Unit Tests for @havenclaw/runtime
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AgentRuntime, AgentState, EventEmitter, loadConfig } from '../src/index.js';

describe('AgentRuntime', () => {
  let runtime: AgentRuntime;

  const mockConfig = {
    agentId: 'test-agent',
    identity: {
      operatorPrivateKey: '0x' + '00'.repeat(32),
    },
    network: {
      chainId: 43113,
      rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    },
    contracts: {
      agentRegistry: '0x' + '11'.repeat(20),
      agentReputation: '0x' + '22'.repeat(20),
      havenGovernance: '0x' + '33'.repeat(20),
      taskMarketplace: '0x' + '44'.repeat(20),
      havenToken: '0x' + '55'.repeat(20),
    },
    decision: {
      autoVote: false,
      autoAcceptTasks: false,
    },
    logging: {
      level: 'debug' as const,
      format: 'text' as const,
    },
  };

  beforeEach(() => {
    runtime = new AgentRuntime(mockConfig);
  });

  it('should initialize in stopped state', () => {
    const status = runtime.getStatus();
    expect(status.state).toBe(AgentState.Stopped);
  });

  it('should start and stop successfully', async () => {
    await runtime.start();
    expect(runtime.getStatus().state).toBe(AgentState.Running);

    await runtime.stop();
    expect(runtime.getStatus().state).toBe(AgentState.Stopped);
  });

  it('should throw error when starting while already running', async () => {
    await runtime.start();
    await expect(runtime.start()).rejects.toThrow();
    await runtime.stop();
  });

  it('should emit events on state changes', async () => {
    const events: string[] = [];
    
    runtime.events.on('runtime:started', () => events.push('started'));
    runtime.events.on('runtime:stopped', () => events.push('stopped'));

    await runtime.start();
    await runtime.stop();

    expect(events).toEqual(['started', 'stopped']);
  });

  it('should track metrics', async () => {
    runtime.updateMetrics({
      transactionsSubmitted: 5,
      transactionsConfirmed: 3,
    });

    const status = runtime.getStatus();
    expect(status.metrics.transactionsSubmitted).toBe(5);
    expect(status.metrics.transactionsConfirmed).toBe(3);
  });
});

describe('EventEmitter', () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  it('should emit and listen to events', () => {
    const listener = vi.fn();
    emitter.on('test:event', listener);
    
    emitter.emit('test:event' as any, { data: 'test' });
    
    expect(listener).toHaveBeenCalledWith({ data: 'test' });
  });

  it('should remove listeners', () => {
    const listener = vi.fn();
    emitter.on('test:event' as any, listener);
    emitter.off('test:event' as any, listener);
    
    emitter.emit('test:event' as any, {});
    
    expect(listener).not.toHaveBeenCalled();
  });

  it('should count listeners', () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    
    emitter.on('test:event' as any, listener1);
    emitter.on('test:event' as any, listener2);
    
    expect(emitter.listenerCount('test:event' as any)).toBe(2);
  });
});

describe('Config', () => {
  it('should validate valid config', () => {
    const config = {
      agentId: 'test',
      identity: {
        operatorPrivateKey: '0x' + '00'.repeat(32),
      },
      network: {
        chainId: 43113,
        rpcUrl: 'https://example.com',
      },
      contracts: {
        agentRegistry: '0x' + '11'.repeat(20),
        agentReputation: '0x' + '22'.repeat(20),
        havenGovernance: '0x' + '33'.repeat(20),
        taskMarketplace: '0x' + '44'.repeat(20),
        havenToken: '0x' + '55'.repeat(20),
      },
    };

    expect(() => loadConfig(config)).not.toThrow();
  });

  it('should reject invalid config', () => {
    const config = {
      agentId: '', // Invalid: empty
      identity: {
        operatorPrivateKey: 'invalid', // Invalid: doesn't start with 0x
      },
    };

    expect(() => loadConfig(config)).toThrow();
  });
});
