// src/LearningSystem.ts
import { MemoryType } from "@havenclaw/memory";

// src/types.ts
var DEFAULT_LEARNING_CONFIG = {
  maxExperiences: 1e3,
  experienceTTL: 0,
  // Permanent by default
  minConfidenceForLesson: 0.7,
  autoValidateLessons: true,
  validationThreshold: 3,
  autoUpdateModel: true,
  updateThreshold: 10,
  maxUpdatesPerDay: 5,
  metricsWindow: 30,
  trackImprovement: true
};

// src/LearningSystem.ts
var LearningSystem = class {
  config;
  logger;
  memory;
  // State
  experiences = /* @__PURE__ */ new Map();
  lessons = /* @__PURE__ */ new Map();
  modelUpdates = /* @__PURE__ */ new Map();
  // Metrics tracking
  metricsCache = null;
  lastMetricsUpdate = 0;
  constructor(logger, memory, config = {}) {
    this.logger = logger.child({ module: "LearningSystem" });
    this.memory = memory;
    this.config = { ...DEFAULT_LEARNING_CONFIG, ...config };
    this.logger.info("Learning system initialized");
  }
  /**
   * Record a learning experience
   */
  async recordExperience(experience) {
    this.logger.info("Recording experience: " + experience.id);
    this.experiences.set(experience.id, experience);
    await this.memory.store({
      id: "exp-" + experience.id,
      type: MemoryType.EPISODIC,
      content: JSON.stringify({
        situation: experience.context.situation,
        decision: experience.decision.action,
        outcome: experience.outcome.success ? "Success" : "Failure",
        actualResult: experience.outcome.actualResult
      }),
      metadata: {
        source: "learning_system",
        tags: [experience.domain, experience.outcome.success ? "success" : "failure"],
        importance: experience.outcome.success ? 0.7 : 0.9,
        // Failures are more important
        relatedIds: []
      },
      createdAt: Date.now(),
      accessCount: 0
    });
    const lessons = await this.extractLessons(experience);
    this.invalidateMetrics();
    this.logger.info("Recorded experience with " + lessons.length + " lessons");
    return experience.id;
  }
  /**
   * Extract lessons from an experience
   */
  async extractLessons(experience) {
    const lessons = [];
    if (experience.outcome.success) {
      const successLesson = this.extractSuccessPattern(experience);
      if (successLesson) {
        lessons.push(successLesson);
      }
    } else {
      const failureLesson = this.extractFailurePattern(experience);
      if (failureLesson) {
        lessons.push(failureLesson);
      }
      const riskLesson = this.extractRiskAwareness(experience);
      if (riskLesson) {
        lessons.push(riskLesson);
      }
    }
    const optimizationLesson = this.extractOptimization(experience);
    if (optimizationLesson) {
      lessons.push(optimizationLesson);
    }
    for (const lesson of lessons) {
      this.lessons.set(lesson.id, lesson);
      await this.memory.store({
        id: "lesson-" + lesson.id,
        type: MemoryType.PROCEDURAL,
        content: lesson.description,
        metadata: {
          source: "learning_system",
          tags: [lesson.type, ...lesson.applicability],
          importance: lesson.confidence,
          relatedIds: ["exp-" + experience.id]
        },
        createdAt: Date.now(),
        accessCount: 0
      });
    }
    return lessons;
  }
  /**
   * Get lessons applicable to a situation
   */
  async getRelevantLessons(situation, domain) {
    const results = await this.memory.search({
      type: MemoryType.PROCEDURAL,
      limit: 10
    });
    let filtered = results;
    if (domain) {
      filtered = results.filter((r) => {
        const tags = r.memory.metadata.tags || [];
        return tags.includes(domain);
      });
    }
    const textLower = situation.toLowerCase();
    const matched = filtered.filter(
      (r) => r.memory.content.toLowerCase().includes(textLower)
    );
    const lessonIds = matched.map((r) => r.memory.id.replace("lesson-", ""));
    const relevantLessons = [];
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
  getMetrics() {
    const now = Date.now();
    if (this.metricsCache && now - this.lastMetricsUpdate < 6e4) {
      return this.metricsCache;
    }
    this.metricsCache = this.calculateMetrics();
    this.lastMetricsUpdate = now;
    return this.metricsCache;
  }
  /**
   * Update model based on accumulated learning
   */
  async updateModel() {
    if (this.experiences.size < this.config.updateThreshold) {
      this.logger.debug("Not enough experiences for model update");
      return null;
    }
    this.logger.info("Updating learning model...");
    const patterns = this.analyzePatterns();
    const update = {
      id: "update-" + Date.now(),
      timestamp: Date.now(),
      type: "strategy_update",
      changes: {
        added: patterns.newStrategies,
        modified: patterns.modifiedStrategies,
        deprecated: patterns.deprecatedStrategies
      },
      affectedDecisions: ["governance_voting", "task_selection"],
      expectedImprovement: 0.1
      // 10% expected improvement
    };
    this.modelUpdates.set(update.id, update);
    this.logger.info("Model updated: " + update.id);
    return update;
  }
  /**
   * Get recent experiences
   */
  getRecentExperiences(limit = 10) {
    const all = Array.from(this.experiences.values());
    all.sort((a, b) => b.timestamp - a.timestamp);
    return all.slice(0, limit);
  }
  /**
   * Get lessons by type
   */
  getLessonsByType(type) {
    const all = Array.from(this.lessons.values());
    return all.filter((l) => l.type === type);
  }
  /**
   * Clear learning data
   */
  clear() {
    this.experiences.clear();
    this.lessons.clear();
    this.modelUpdates.clear();
    this.metricsCache = null;
    this.logger.info("Learning data cleared");
  }
  // ==================== INTERNAL METHODS ====================
  extractSuccessPattern(experience) {
    const keyFactors = this.identifySuccessFactors(experience);
    if (keyFactors.length === 0) {
      return null;
    }
    return {
      id: "lesson-" + Date.now() + "-success",
      experienceId: experience.id,
      type: "success_pattern",
      description: "Success pattern: " + keyFactors.join(", "),
      applicability: [experience.domain],
      confidence: 0.7,
      createdAt: Date.now(),
      validationCount: 1
    };
  }
  extractFailurePattern(experience) {
    const keyFactors = this.identifyFailureFactors(experience);
    if (keyFactors.length === 0) {
      return null;
    }
    return {
      id: "lesson-" + Date.now() + "-failure",
      experienceId: experience.id,
      type: "failure_pattern",
      description: "Failure pattern: " + keyFactors.join(", "),
      applicability: [experience.domain],
      confidence: 0.8,
      // Higher confidence for failures
      createdAt: Date.now(),
      validationCount: 1
    };
  }
  extractRiskAwareness(experience) {
    const risks = this.identifyMaterializedRisks(experience);
    if (risks.length === 0) {
      return null;
    }
    return {
      id: "lesson-" + Date.now() + "-risk",
      experienceId: experience.id,
      type: "risk_awareness",
      description: "Risk awareness: " + risks.join(", "),
      applicability: [experience.domain, "general"],
      confidence: 0.9,
      createdAt: Date.now(),
      validationCount: 1
    };
  }
  extractOptimization(experience) {
    const optimizations = this.identifyOptimizations(experience);
    if (optimizations.length === 0) {
      return null;
    }
    return {
      id: "lesson-" + Date.now() + "-opt",
      experienceId: experience.id,
      type: "optimization",
      description: "Optimization: " + optimizations.join(", "),
      applicability: [experience.domain],
      confidence: 0.6,
      createdAt: Date.now(),
      validationCount: 1
    };
  }
  identifySuccessFactors(experience) {
    const factors = [];
    if (experience.decision.reasoning.includes("timely")) {
      factors.push("timely execution");
    }
    const metrics = experience.outcome.metrics;
    if (metrics.gasUsed && BigInt(metrics.gasUsed) < 100000n) {
      factors.push("efficient gas usage");
    }
    if (factors.length === 0) {
      factors.push("correct decision making");
    }
    return factors;
  }
  identifyFailureFactors(experience) {
    const factors = [];
    if (experience.outcome.actualResult.includes("timeout")) {
      factors.push("timing issues");
    }
    if (experience.outcome.actualResult.includes("gas")) {
      factors.push("gas estimation error");
    }
    if (factors.length === 0) {
      factors.push("incorrect assessment");
    }
    return factors;
  }
  identifyMaterializedRisks(experience) {
    const risks = [];
    if (!experience.outcome.success) {
      risks.push("execution risk");
    }
    const metrics = experience.outcome.metrics;
    if (metrics.balanceChange && metrics.balanceChange.startsWith("-")) {
      risks.push("financial loss");
    }
    return risks;
  }
  identifyOptimizations(experience) {
    const optimizations = [];
    const metrics = experience.outcome.metrics;
    if (metrics.timeSpent > 300) {
      optimizations.push("reduce decision time");
    }
    if (metrics.gasUsed && BigInt(metrics.gasUsed) > 200000n) {
      optimizations.push("optimize gas usage");
    }
    return optimizations;
  }
  analyzePatterns() {
    const experiences = Array.from(this.experiences.values());
    const byDomain = {};
    for (const exp of experiences) {
      if (!byDomain[exp.domain]) {
        byDomain[exp.domain] = [];
      }
      byDomain[exp.domain].push(exp);
    }
    const newStrategies = [];
    const modifiedStrategies = [];
    const deprecatedStrategies = [];
    for (const [domain, domainExps] of Object.entries(byDomain)) {
      const successRate = domainExps.filter((e) => e.outcome.success).length / domainExps.length;
      if (successRate > 0.8) {
        newStrategies.push("Effective strategy in " + domain);
      } else if (successRate < 0.4) {
        deprecatedStrategies.push("Ineffective strategy in " + domain);
      }
    }
    return { newStrategies, modifiedStrategies, deprecatedStrategies };
  }
  calculateMetrics() {
    const experiences = Array.from(this.experiences.values());
    const lessons = Array.from(this.lessons.values());
    const successCount = experiences.filter((e) => e.outcome.success).length;
    const successRate = experiences.length > 0 ? successCount / experiences.length : 0;
    const oldestExp = experiences.reduce((min, e) => Math.min(min, e.timestamp), Date.now());
    const daysActive = Math.max(1, (Date.now() - oldestExp) / (1e3 * 60 * 60 * 24));
    const learningRate = lessons.length / daysActive;
    const recentExps = experiences.filter((e) => Date.now() - e.timestamp < 7 * 24 * 60 * 60 * 1e3);
    const olderExps = experiences.filter((e) => Date.now() - e.timestamp >= 7 * 24 * 60 * 60 * 1e3 && Date.now() - e.timestamp < 14 * 24 * 60 * 60 * 1e3);
    const recentSuccessRate = recentExps.length > 0 ? recentExps.filter((e) => e.outcome.success).length / recentExps.length : 0;
    const olderSuccessRate = olderExps.length > 0 ? olderExps.filter((e) => e.outcome.success).length / olderExps.length : 0;
    let improvementTrend = "stable";
    if (recentSuccessRate > olderSuccessRate + 0.1) {
      improvementTrend = "improving";
    } else if (recentSuccessRate < olderSuccessRate - 0.1) {
      improvementTrend = "declining";
    }
    const byDomain = {
      governance: this.calculateDomainMetrics("governance", experiences),
      task: this.calculateDomainMetrics("task", experiences),
      reputation: this.calculateDomainMetrics("reputation", experiences),
      transaction: this.calculateDomainMetrics("transaction", experiences),
      general: this.calculateDomainMetrics("general", experiences)
    };
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
        last30d
      },
      modelQuality: {
        coverage: Math.min(1, experiences.length / 100),
        confidence: 0.7 + lessons.length * 0.01,
        lastUpdate: this.modelUpdates.size > 0 ? Math.max(...Array.from(this.modelUpdates.values()).map((u) => u.timestamp)) : 0
      }
    };
  }
  calculateDomainMetrics(domain, experiences) {
    const domainExps = experiences.filter((e) => e.domain === domain);
    const successCount = domainExps.filter((e) => e.outcome.success).length;
    const domainLessons = Array.from(this.lessons.values()).filter((l) => l.applicability.includes(domain));
    let totalReward = 0n;
    for (const exp of domainExps) {
      if (exp.outcome.metrics.reputationChange) {
        totalReward += BigInt(exp.outcome.metrics.reputationChange);
      }
    }
    const avgReward = domainExps.length > 0 ? (totalReward / BigInt(domainExps.length)).toString() : "0";
    return {
      experiences: domainExps.length,
      successRate: domainExps.length > 0 ? successCount / domainExps.length : 0,
      averageReward: avgReward,
      lessonsLearned: domainLessons.length
    };
  }
  calculateSnapshot(experiences, days) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1e3;
    const periodExps = experiences.filter((e) => e.timestamp >= cutoff);
    const successCount = periodExps.filter((e) => e.outcome.success).length;
    const successRate = periodExps.length > 0 ? successCount / periodExps.length : 0;
    const periodLessons = Array.from(this.lessons.values()).filter(
      (l) => periodExps.some((e) => e.id === l.experienceId)
    );
    const avgConfidence = periodLessons.length > 0 ? periodLessons.reduce((sum, l) => sum + l.confidence, 0) / periodLessons.length : 0;
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
      totalValue: totalValue.toString()
    };
  }
  invalidateMetrics() {
    this.metricsCache = null;
  }
};
export {
  DEFAULT_LEARNING_CONFIG,
  LearningSystem
};
