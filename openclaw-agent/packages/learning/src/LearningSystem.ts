/**
 * LearningSystem - Continuous improvement from experience
 */

import { Logger } from '@havenclaw/tools';
import { MemorySystem, MemoryType } from '@havenclaw/memory';
import {
  LearningExperience,
  Lesson,
  LessonType,
  LearningMetrics,
  LearningConfig,
  DEFAULT_LEARNING_CONFIG,
  ExperienceDomain,
  DomainMetrics,
  PerformanceSnapshot,
  ModelUpdate,
  OutcomeMetrics,
} from './types.js';

/**
 * LearningSystem tracks experiences and extracts lessons
 */
export class LearningSystem {
  private config: LearningConfig;
  private logger: Logger;
  private memory: MemorySystem;

  // State
  private experiences: Map<string, LearningExperience> = new Map();
  private lessons: Map<string, Lesson> = new Map();
  private modelUpdates: Map<string, ModelUpdate> = new Map();

  // Metrics tracking
  private metricsCache: LearningMetrics | null = null;
  private lastMetricsUpdate: number = 0;

  constructor(
    logger: Logger,
    memory: MemorySystem,
    config: Partial<LearningConfig> = {}
  ) {
    this.logger = logger.child({ module: 'LearningSystem' });
    this.memory = memory;
    this.config = { ...DEFAULT_LEARNING_CONFIG, ...config };

    this.logger.info('Learning system initialized');
  }

  /**
   * Record a learning experience
   */
  async recordExperience(experience: LearningExperience): Promise<string> {
    this.logger.info('Recording experience: ' + experience.id);

    // Store in memory
    this.experiences.set(experience.id, experience);

    // Also store in memory system for long-term retention
    await this.memory.store({
      id: 'exp-' + experience.id,
      type: MemoryType.EPISODIC,
      content: JSON.stringify({
        situation: experience.context.situation,
        decision: experience.decision.action,
        outcome: experience.outcome.success ? 'Success' : 'Failure',
        actualResult: experience.outcome.actualResult,
      }),
      metadata: {
        source: 'learning_system',
        tags: [experience.domain, experience.outcome.success ? 'success' : 'failure'],
        importance: experience.outcome.success ? 0.7 : 0.9, // Failures are more important
        relatedIds: [],
      },
      createdAt: Date.now(),
      accessCount: 0,
    } as any);

    // Extract lessons
    const lessons = await this.extractLessons(experience);

    // Update metrics cache
    this.invalidateMetrics();

    this.logger.info('Recorded experience with ' + lessons.length + ' lessons');
    return experience.id;
  }

  /**
   * Extract lessons from an experience
   */
  async extractLessons(experience: LearningExperience): Promise<Lesson[]> {
    const lessons: Lesson[] = [];

    // Extract success patterns
    if (experience.outcome.success) {
      const successLesson = this.extractSuccessPattern(experience);
      if (successLesson) {
        lessons.push(successLesson);
      }
    } else {
      // Extract failure patterns
      const failureLesson = this.extractFailurePattern(experience);
      if (failureLesson) {
        lessons.push(failureLesson);
      }

      // Extract risk awareness
      const riskLesson = this.extractRiskAwareness(experience);
      if (riskLesson) {
        lessons.push(riskLesson);
      }
    }

    // Extract optimization opportunities
    const optimizationLesson = this.extractOptimization(experience);
    if (optimizationLesson) {
      lessons.push(optimizationLesson);
    }

    // Store lessons
    for (const lesson of lessons) {
      this.lessons.set(lesson.id, lesson);

      // Also store in memory system
      await this.memory.store({
        id: 'lesson-' + lesson.id,
        type: MemoryType.PROCEDURAL,
        content: lesson.description,
        metadata: {
          source: 'learning_system',
          tags: [lesson.type, ...lesson.applicability],
          importance: lesson.confidence,
          relatedIds: ['exp-' + experience.id],
        },
        createdAt: Date.now(),
        accessCount: 0,
      });
    }

    return lessons;
  }

  /**
   * Get lessons applicable to a situation
   */
  async getRelevantLessons(situation: string, domain?: ExperienceDomain): Promise<Lesson[]> {
    // Search memory for relevant lessons
    const results = await this.memory.search({
      type: MemoryType.PROCEDURAL,
      limit: 10,
    });

    // Filter by domain if specified
    let filtered = results;
    if (domain) {
      filtered = results.filter(r => {
        const tags = r.memory.metadata.tags || [];
        return tags.includes(domain);
      });
    }

    // Simple text matching (Phase 2 MVP)
    const textLower = situation.toLowerCase();
    const matched = filtered.filter(r =>
      r.memory.content.toLowerCase().includes(textLower)
    );

    // Convert to lessons
    const lessonIds = matched.map(r => r.memory.id.replace('lesson-', ''));
    const relevantLessons: Lesson[] = [];

    for (const id of lessonIds) {
      const lesson = this.lessons.get(id);
      if (lesson) {
        relevantLessons.push(lesson);
      }
    }

    return relevantLessons;
  }

  /**
   * Get learning metrics
   */
  getMetrics(): LearningMetrics {
    // Return cached metrics if recent
    const now = Date.now();
    if (this.metricsCache && now - this.lastMetricsUpdate < 60000) { // 1 minute cache
      return this.metricsCache;
    }

    this.metricsCache = this.calculateMetrics();
    this.lastMetricsUpdate = now;

    return this.metricsCache;
  }

  /**
   * Update model based on accumulated learning
   */
  async updateModel(): Promise<ModelUpdate | null> {
    // Check if we have enough experiences
    if (this.experiences.size < this.config.updateThreshold) {
      this.logger.debug('Not enough experiences for model update');
      return null;
    }

    this.logger.info('Updating learning model...');

    // Analyze patterns
    const patterns = this.analyzePatterns();

    // Generate model update
    const update: ModelUpdate = {
      id: 'update-' + Date.now(),
      timestamp: Date.now(),
      type: 'strategy_update',
      changes: {
        added: patterns.newStrategies,
        modified: patterns.modifiedStrategies,
        deprecated: patterns.deprecatedStrategies,
      },
      affectedDecisions: ['governance_voting', 'task_selection'],
      expectedImprovement: 0.1, // 10% expected improvement
    };

    // Store update
    this.modelUpdates.set(update.id, update);

    this.logger.info('Model updated: ' + update.id);
    return update;
  }

  /**
   * Get recent experiences
   */
  getRecentExperiences(limit: number = 10): LearningExperience[] {
    const all = Array.from(this.experiences.values());
    all.sort((a, b) => b.timestamp - a.timestamp);
    return all.slice(0, limit);
  }

  /**
   * Get lessons by type
   */
  getLessonsByType(type: LessonType): Lesson[] {
    const all = Array.from(this.lessons.values());
    return all.filter(l => l.type === type);
  }

  /**
   * Clear learning data
   */
  clear(): void {
    this.experiences.clear();
    this.lessons.clear();
    this.modelUpdates.clear();
    this.metricsCache = null;
    this.logger.info('Learning data cleared');
  }

  // ==================== INTERNAL METHODS ====================

  private extractSuccessPattern(experience: LearningExperience): Lesson | null {
    // Identify what led to success
    const keyFactors = this.identifySuccessFactors(experience);

    if (keyFactors.length === 0) {
      return null;
    }

    return {
      id: 'lesson-' + Date.now() + '-success',
      experienceId: experience.id,
      type: 'success_pattern',
      description: 'Success pattern: ' + keyFactors.join(', '),
      applicability: [experience.domain],
      confidence: 0.7,
      createdAt: Date.now(),
      validationCount: 1,
    };
  }

  private extractFailurePattern(experience: LearningExperience): Lesson | null {
    // Identify what led to failure
    const keyFactors = this.identifyFailureFactors(experience);

    if (keyFactors.length === 0) {
      return null;
    }

    return {
      id: 'lesson-' + Date.now() + '-failure',
      experienceId: experience.id,
      type: 'failure_pattern',
      description: 'Failure pattern: ' + keyFactors.join(', '),
      applicability: [experience.domain],
      confidence: 0.8, // Higher confidence for failures
      createdAt: Date.now(),
      validationCount: 1,
    };
  }

  private extractRiskAwareness(experience: LearningExperience): Lesson | null {
    // Identify risks that materialized
    const risks = this.identifyMaterializedRisks(experience);

    if (risks.length === 0) {
      return null;
    }

    return {
      id: 'lesson-' + Date.now() + '-risk',
      experienceId: experience.id,
      type: 'risk_awareness',
      description: 'Risk awareness: ' + risks.join(', '),
      applicability: [experience.domain, 'general'],
      confidence: 0.9,
      createdAt: Date.now(),
      validationCount: 1,
    };
  }

  private extractOptimization(experience: LearningExperience): Lesson | null {
    // Identify optimization opportunities
    const optimizations = this.identifyOptimizations(experience);

    if (optimizations.length === 0) {
      return null;
    }

    return {
      id: 'lesson-' + Date.now() + '-opt',
      experienceId: experience.id,
      type: 'optimization',
      description: 'Optimization: ' + optimizations.join(', '),
      applicability: [experience.domain],
      confidence: 0.6,
      createdAt: Date.now(),
      validationCount: 1,
    };
  }

  private identifySuccessFactors(experience: LearningExperience): string[] {
    const factors: string[] = [];

    // Analyze decision reasoning
    if (experience.decision.reasoning.includes('timely')) {
      factors.push('timely execution');
    }

    // Analyze metrics
    const metrics = experience.outcome.metrics;
    if (metrics.gasUsed && BigInt(metrics.gasUsed) < 100000n) {
      factors.push('efficient gas usage');
    }

    if (factors.length === 0) {
      factors.push('correct decision making');
    }

    return factors;
  }

  private identifyFailureFactors(experience: LearningExperience): string[] {
    const factors: string[] = [];

    // Analyze outcome
    if (experience.outcome.actualResult.includes('timeout')) {
      factors.push('timing issues');
    }

    if (experience.outcome.actualResult.includes('gas')) {
      factors.push('gas estimation error');
    }

    if (factors.length === 0) {
      factors.push('incorrect assessment');
    }

    return factors;
  }

  private identifyMaterializedRisks(experience: LearningExperience): string[] {
    const risks: string[] = [];

    // Check for common risk indicators
    if (!experience.outcome.success) {
      risks.push('execution risk');
    }

    const metrics = experience.outcome.metrics;
    if (metrics.balanceChange && metrics.balanceChange.startsWith('-')) {
      risks.push('financial loss');
    }

    return risks;
  }

  private identifyOptimizations(experience: LearningExperience): string[] {
    const optimizations: string[] = [];

    // Check for optimization opportunities
    const metrics = experience.outcome.metrics;

    if (metrics.timeSpent > 300) { // 5 minutes
      optimizations.push('reduce decision time');
    }

    if (metrics.gasUsed && BigInt(metrics.gasUsed) > 200000n) {
      optimizations.push('optimize gas usage');
    }

    return optimizations;
  }

  private analyzePatterns(): {
    newStrategies: string[];
    modifiedStrategies: string[];
    deprecatedStrategies: string[];
  } {
    // Analyze experience patterns
    const experiences = Array.from(this.experiences.values());

    // Group by domain
    const byDomain: Record<string, LearningExperience[]> = {};
    for (const exp of experiences) {
      if (!byDomain[exp.domain]) {
        byDomain[exp.domain] = [];
      }
      byDomain[exp.domain].push(exp);
    }

    const newStrategies: string[] = [];
    const modifiedStrategies: string[] = [];
    const deprecatedStrategies: string[] = [];

    // Analyze each domain
    for (const [domain, domainExps] of Object.entries(byDomain)) {
      const successRate = domainExps.filter(e => e.outcome.success).length / domainExps.length;

      if (successRate > 0.8) {
        newStrategies.push('Effective strategy in ' + domain);
      } else if (successRate < 0.4) {
        deprecatedStrategies.push('Ineffective strategy in ' + domain);
      }
    }

    return { newStrategies, modifiedStrategies, deprecatedStrategies };
  }

  private calculateMetrics(): LearningMetrics {
    const experiences = Array.from(this.experiences.values());
    const lessons = Array.from(this.lessons.values());

    // Calculate overall success rate
    const successCount = experiences.filter(e => e.outcome.success).length;
    const successRate = experiences.length > 0 ? successCount / experiences.length : 0;

    // Calculate learning rate (lessons per day)
    const oldestExp = experiences.reduce((min, e) => Math.min(min, e.timestamp), Date.now());
    const daysActive = Math.max(1, (Date.now() - oldestExp) / (1000 * 60 * 60 * 24));
    const learningRate = lessons.length / daysActive;

    // Determine improvement trend
    const recentExps = experiences.filter(e => Date.now() - e.timestamp < 7 * 24 * 60 * 60 * 1000);
    const olderExps = experiences.filter(e => Date.now() - e.timestamp >= 7 * 24 * 60 * 60 * 1000 && Date.now() - e.timestamp < 14 * 24 * 60 * 60 * 1000);

    const recentSuccessRate = recentExps.length > 0
      ? recentExps.filter(e => e.outcome.success).length / recentExps.length
      : 0;
    const olderSuccessRate = olderExps.length > 0
      ? olderExps.filter(e => e.outcome.success).length / olderExps.length
      : 0;

    let improvementTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentSuccessRate > olderSuccessRate + 0.1) {
      improvementTrend = 'improving';
    } else if (recentSuccessRate < olderSuccessRate - 0.1) {
      improvementTrend = 'declining';
    }

    // Domain breakdown
    const byDomain: Record<ExperienceDomain, DomainMetrics> = {
      governance: this.calculateDomainMetrics('governance', experiences),
      task: this.calculateDomainMetrics('task', experiences),
      reputation: this.calculateDomainMetrics('reputation', experiences),
      transaction: this.calculateDomainMetrics('transaction', experiences),
      general: this.calculateDomainMetrics('general', experiences),
    };

    // Recent performance snapshots
    const last24h = this.calculateSnapshot(experiences, 1);
    const last7d = this.calculateSnapshot(experiences, 7);
    const last30d = this.calculateSnapshot(experiences, 30);

    return {
      totalExperiences: experiences.length,
      totalLessons: lessons.length,
      learningRate,
      successRate,
      improvementTrend,
      byDomain,
      recentPerformance: {
        last24h,
        last7d,
        last30d,
      },
      modelQuality: {
        coverage: Math.min(1, experiences.length / 100),
        confidence: 0.7 + (lessons.length * 0.01),
        lastUpdate: this.modelUpdates.size > 0
          ? Math.max(...Array.from(this.modelUpdates.values()).map(u => u.timestamp))
          : 0,
      },
    };
  }

  private calculateDomainMetrics(domain: ExperienceDomain, experiences: LearningExperience[]): DomainMetrics {
    const domainExps = experiences.filter(e => e.domain === domain);
    const successCount = domainExps.filter(e => e.outcome.success).length;
    const domainLessons = Array.from(this.lessons.values()).filter(l => l.applicability.includes(domain));

    // Calculate average reward
    let totalReward = 0n;
    for (const exp of domainExps) {
      if (exp.outcome.metrics.reputationChange) {
        totalReward += BigInt(exp.outcome.metrics.reputationChange);
      }
    }
    const avgReward = domainExps.length > 0 ? (totalReward / BigInt(domainExps.length)).toString() : '0';

    return {
      experiences: domainExps.length,
      successRate: domainExps.length > 0 ? successCount / domainExps.length : 0,
      averageReward: avgReward,
      lessonsLearned: domainLessons.length,
    };
  }

  private calculateSnapshot(experiences: LearningExperience[], days: number): PerformanceSnapshot {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const periodExps = experiences.filter(e => e.timestamp >= cutoff);

    const successCount = periodExps.filter(e => e.outcome.success).length;
    const successRate = periodExps.length > 0 ? successCount / periodExps.length : 0;

    // Calculate average confidence (from lessons)
    const periodLessons = Array.from(this.lessons.values()).filter(l =>
      periodExps.some(e => e.id === l.experienceId)
    );
    const avgConfidence = periodLessons.length > 0
      ? periodLessons.reduce((sum, l) => sum + l.confidence, 0) / periodLessons.length
      : 0;

    // Calculate total value
    let totalValue = 0n;
    for (const exp of periodExps) {
      if (exp.outcome.metrics.reputationChange) {
        totalValue += BigInt(exp.outcome.metrics.reputationChange);
      }
    }

    return {
      decisions: periodExps.length,
      successRate,
      averageConfidence: avgConfidence,
      totalValue: totalValue.toString(),
    };
  }

  private invalidateMetrics(): void {
    this.metricsCache = null;
  }
}
