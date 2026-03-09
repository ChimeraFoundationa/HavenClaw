/**
 * Action Queue - Queue and process actions
 */

import { Logger } from '@havenclaw/tools';

export interface QueuedAction {
  id: string;
  type: string;
  params: Record<string, any>;
  priority: number;
  createdAt: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export type ActionHandler = (action: QueuedAction) => Promise<any>;

/**
 * ActionQueue manages a priority queue of actions
 */
export class ActionQueue {
  private queue: QueuedAction[] = [];
  private handlers: Map<string, ActionHandler> = new Map();
  private logger: Logger;
  private processing: boolean = false;
  private actionCounter: number = 0;

  constructor(logger: Logger) {
    this.logger = logger.child({ module: 'ActionQueue' });
  }

  /**
   * Enqueue an action
   */
  enqueue(params: {
    type: string;
    params: Record<string, any>;
    priority?: number;
  }): string {
    const id = `action-${++this.actionCounter}`;

    const action: QueuedAction = {
      id,
      type: params.type,
      params: params.params,
      priority: params.priority || 5,
      createdAt: Date.now(),
      status: 'pending',
    };

    this.queue.push(action);
    // Sort by priority (higher first)
    this.queue.sort((a, b) => b.priority - a.priority);

    this.logger.debug(`Enqueued action: ${id} (${params.type})`);
    return id;
  }

  /**
   * Register an action handler
   */
  registerHandler(type: string, handler: ActionHandler): void {
    this.handlers.set(type, handler);
    this.logger.debug(`Registered handler for: ${type}`);
  }

  /**
   * Start processing the queue
   */
  start(): void {
    if (this.processing) {
      return;
    }

    this.processing = true;
    this.processQueue();
  }

  /**
   * Stop processing the queue
   */
  stop(): void {
    this.processing = false;
    this.logger.debug('Stopped queue processing');
  }

  /**
   * Get queue status
   */
  getStatus(): {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  } {
    return {
      pending: this.queue.filter((a) => a.status === 'pending').length,
      processing: this.queue.filter((a) => a.status === 'processing').length,
      completed: this.queue.filter((a) => a.status === 'completed').length,
      failed: this.queue.filter((a) => a.status === 'failed').length,
    };
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = [];
    this.logger.debug('Cleared queue');
  }

  private async processQueue(): Promise<void> {
    while (this.processing && this.queue.length > 0) {
      const action = this.queue.shift();

      if (!action) {
        continue;
      }

      action.status = 'processing';
      this.logger.debug(`Processing action: ${action.id}`);

      try {
        const handler = this.handlers.get(action.type);

        if (!handler) {
          throw new Error(`No handler registered for action type: ${action.type}`);
        }

        await handler(action);
        action.status = 'completed';
        this.logger.debug(`Action completed: ${action.id}`);
      } catch (error) {
        action.status = 'failed';
        action.error = (error as Error).message;
        this.logger.error(`Action failed: ${action.id}`, error as Error);
      }
    }

    // Check queue again after a delay
    if (this.processing) {
      setTimeout(() => this.processQueue(), 100);
    }
  }
}
