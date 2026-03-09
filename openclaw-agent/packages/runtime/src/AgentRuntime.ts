/**
 * Agent Runtime - Core orchestration for autonomous agent
 */

import { EventEmitter } from './EventEmitter.js';
import { AgentState, AgentStatus, createInitialMetrics } from './AgentState.js';
import type { AgentConfig } from './AgentConfig.js';

export interface RuntimeComponent {
  name: string;
  start?: () => Promise<void>;
  stop?: () => Promise<void>;
  healthCheck?: () => Promise<boolean>;
}

export class AgentRuntime {
  private config: AgentConfig;
  private state: AgentState;
  private eventEmitter: EventEmitter;
  private components: Map<string, RuntimeComponent>;
  private startTime: number | null;
  private metrics: ReturnType<typeof createInitialMetrics>;
  
  constructor(config: AgentConfig) {
    this.config = config;
    this.state = AgentState.Stopped;
    this.eventEmitter = new EventEmitter();
    this.components = new Map();
    this.startTime = null;
    this.metrics = createInitialMetrics();
  }
  
  /**
   * Get the event emitter for subscribing to agent events
   */
  get events(): EventEmitter {
    return this.eventEmitter;
  }
  
  /**
   * Get the agent configuration
   */
  getConfig(): AgentConfig {
    return this.config;
  }
  
  /**
   * Get current agent status
   */
  getStatus(): AgentStatus {
    return {
      state: this.state,
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      metrics: { ...this.metrics },
    };
  }
  
  /**
   * Register a runtime component
   */
  registerComponent(component: RuntimeComponent): void {
    if (this.state !== AgentState.Stopped) {
      throw new Error('Cannot register components while runtime is running');
    }
    this.components.set(component.name, component);
  }
  
  /**
   * Start the agent runtime
   */
  async start(): Promise<void> {
    if (this.state !== AgentState.Stopped) {
      throw new Error(`Cannot start runtime in state: ${this.state}`);
    }
    
    this.setState(AgentState.Starting);
    
    try {
      // Start all components in sequence
      for (const [, component] of this.components.entries()) {
        if (component.start) {
          await component.start();
        }
      }
      
      this.startTime = Date.now();
      this.setState(AgentState.Running);
      this.eventEmitter.emit('runtime:started');
      
    } catch (error) {
      this.setState(AgentState.Error);
      this.eventEmitter.emit('runtime:error', error as Error);
      throw error;
    }
  }
  
  /**
   * Stop the agent runtime
   */
  async stop(): Promise<void> {
    if (this.state !== AgentState.Running && this.state !== AgentState.Error) {
      return;
    }
    
    this.setState(AgentState.Stopping);
    
    try {
      // Stop all components in reverse order
      const components = Array.from(this.components.values()).reverse();
      for (const component of components) {
        if (component.stop) {
          await component.stop();
        }
      }
      
      this.setState(AgentState.Stopped);
      this.startTime = null;
      this.eventEmitter.emit('runtime:stopped');
      
    } catch (error) {
      this.setState(AgentState.Error);
      this.eventEmitter.emit('runtime:error', error as Error);
      throw error;
    }
  }
  
  /**
   * Perform health check on all components
   */
  async healthCheck(): Promise<boolean> {
    for (const [, component] of this.components.entries()) {
      if (component.healthCheck) {
        const healthy = await component.healthCheck();
        if (!healthy) {
          return false;
        }
      }
    }
    return true;
  }
  
  /**
   * Update metrics
   */
  updateMetrics(updates: Partial<ReturnType<typeof createInitialMetrics>>): void {
    Object.assign(this.metrics, updates);
  }
  
  private setState(newState: AgentState): void {
    const oldState = this.state;
    this.state = newState;
    this.eventEmitter.emit('runtime:state-change', oldState, newState);
  }
}

export { AgentState };
export type { AgentConfig };
