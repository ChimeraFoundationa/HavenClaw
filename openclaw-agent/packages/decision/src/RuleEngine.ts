/**
 * Rule Engine - Evaluate rules against context
 */

import { Logger } from '@havenclaw/tools';

export interface RuleContext {
  type: string;
  [key: string]: any;
}

export interface Rule {
  name: string;
  condition: (context: RuleContext) => boolean | Promise<boolean>;
  action: (context: RuleContext) => Promise<any>;
  priority?: number;
}

/**
 * RuleEngine evaluates rules against contexts
 */
export class RuleEngine {
  private rules: Rule[] = [];
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger.child({ module: 'RuleEngine' });
  }

  /**
   * Add a rule
   */
  addRule(rule: Rule): void {
    this.rules.push(rule);
    // Sort by priority (higher first)
    this.rules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    this.logger.debug(`Added rule: ${rule.name}`);
  }

  /**
   * Remove a rule
   */
  removeRule(name: string): boolean {
    const index = this.rules.findIndex((r) => r.name === name);
    if (index !== -1) {
      this.rules.splice(index, 1);
      this.logger.debug(`Removed rule: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * Evaluate all rules against context
   */
  async evaluate(context: RuleContext): Promise<any[]> {
    const results: any[] = [];

    for (const rule of this.rules) {
      try {
        const matches = await rule.condition(context);

        if (matches) {
          this.logger.debug(`Rule matched: ${rule.name}`);
          const result = await rule.action(context);
          results.push({ rule: rule.name, result });
        }
      } catch (error) {
        this.logger.error(`Rule evaluation failed: ${rule.name}`, error as Error);
      }
    }

    return results;
  }

  /**
   * Evaluate first matching rule only
   */
  async evaluateFirst(context: RuleContext): Promise<any> {
    for (const rule of this.rules) {
      try {
        const matches = await rule.condition(context);

        if (matches) {
          this.logger.debug(`First match rule: ${rule.name}`);
          return await rule.action(context);
        }
      } catch (error) {
        this.logger.error(`Rule evaluation failed: ${rule.name}`, error as Error);
      }
    }

    return null;
  }

  /**
   * Get all rules
   */
  getRules(): Rule[] {
    return [...this.rules];
  }

  /**
   * Get rule count
   */
  getRuleCount(): number {
    return this.rules.length;
  }

  /**
   * Clear all rules
   */
  clearRules(): void {
    this.rules = [];
    this.logger.debug('Cleared all rules');
  }
}
