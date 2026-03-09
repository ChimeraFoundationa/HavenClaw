import { Logger } from '@havenclaw/tools';
import { MemorySystem } from '@havenclaw/memory';

/**
 * Learning System Types
 */
/**
 * Learning experience record
 */
interface LearningExperience {
    id: string;
    timestamp: number;
    domain: ExperienceDomain;
    context: {
        situation: string;
        options: string[];
        constraints: string[];
    };
    decision: {
        action: string;
        reasoning: string;
        expectedOutcome: string;
    };
    outcome: {
        actualResult: string;
        success: boolean;
        metrics: OutcomeMetrics;
    };
    lessons: Lesson[];
}
type ExperienceDomain = 'governance' | 'task' | 'reputation' | 'transaction' | 'general';
interface OutcomeMetrics {
    reputationChange: string;
    balanceChange: string;
    gasUsed: string;
    timeSpent: number;
    opportunityCost?: string;
}
/**
 * Extracted lesson from experience
 */
interface Lesson {
    id: string;
    experienceId: string;
    type: LessonType;
    description: string;
    applicability: string[];
    confidence: number;
    createdAt: number;
    validatedAt?: number;
    validationCount: number;
}
type LessonType = 'success_pattern' | 'failure_pattern' | 'optimization' | 'risk_awareness' | 'timing' | 'strategy';
/**
 * Learning model update
 */
interface ModelUpdate {
    id: string;
    timestamp: number;
    type: ModelUpdateType;
    changes: {
        added: string[];
        modified: string[];
        deprecated: string[];
    };
    affectedDecisions: string[];
    expectedImprovement: number;
}
type ModelUpdateType = 'rule_addition' | 'rule_modification' | 'weight_adjustment' | 'strategy_update';
/**
 * Performance metrics dashboard
 */
interface LearningMetrics {
    totalExperiences: number;
    totalLessons: number;
    learningRate: number;
    successRate: number;
    improvementTrend: 'improving' | 'stable' | 'declining';
    byDomain: Record<ExperienceDomain, DomainMetrics>;
    recentPerformance: {
        last24h: PerformanceSnapshot;
        last7d: PerformanceSnapshot;
        last30d: PerformanceSnapshot;
    };
    modelQuality: {
        coverage: number;
        confidence: number;
        lastUpdate: number;
    };
}
interface DomainMetrics {
    experiences: number;
    successRate: number;
    averageReward: string;
    lessonsLearned: number;
}
interface PerformanceSnapshot {
    decisions: number;
    successRate: number;
    averageConfidence: number;
    totalValue: string;
}
/**
 * Learning configuration
 */
interface LearningConfig {
    maxExperiences: number;
    experienceTTL: number;
    minConfidenceForLesson: number;
    autoValidateLessons: boolean;
    validationThreshold: number;
    autoUpdateModel: boolean;
    updateThreshold: number;
    maxUpdatesPerDay: number;
    metricsWindow: number;
    trackImprovement: boolean;
}
declare const DEFAULT_LEARNING_CONFIG: LearningConfig;

/**
 * LearningSystem - Continuous improvement from experience
 */

/**
 * LearningSystem tracks experiences and extracts lessons
 */
declare class LearningSystem {
    private config;
    private logger;
    private memory;
    private experiences;
    private lessons;
    private modelUpdates;
    private metricsCache;
    private lastMetricsUpdate;
    constructor(logger: Logger, memory: MemorySystem, config?: Partial<LearningConfig>);
    /**
     * Record a learning experience
     */
    recordExperience(experience: LearningExperience): Promise<string>;
    /**
     * Extract lessons from an experience
     */
    extractLessons(experience: LearningExperience): Promise<Lesson[]>;
    /**
     * Get lessons applicable to a situation
     */
    getRelevantLessons(situation: string, domain?: ExperienceDomain): Promise<Lesson[]>;
    /**
     * Get learning metrics
     */
    getMetrics(): LearningMetrics;
    /**
     * Update model based on accumulated learning
     */
    updateModel(): Promise<ModelUpdate | null>;
    /**
     * Get recent experiences
     */
    getRecentExperiences(limit?: number): LearningExperience[];
    /**
     * Get lessons by type
     */
    getLessonsByType(type: LessonType): Lesson[];
    /**
     * Clear learning data
     */
    clear(): void;
    private extractSuccessPattern;
    private extractFailurePattern;
    private extractRiskAwareness;
    private extractOptimization;
    private identifySuccessFactors;
    private identifyFailureFactors;
    private identifyMaterializedRisks;
    private identifyOptimizations;
    private analyzePatterns;
    private calculateMetrics;
    private calculateDomainMetrics;
    private calculateSnapshot;
    private invalidateMetrics;
}

export { DEFAULT_LEARNING_CONFIG, type DomainMetrics, type ExperienceDomain, type LearningConfig, type LearningExperience, type LearningMetrics, LearningSystem, type Lesson, type LessonType, type ModelUpdate, type ModelUpdateType, type OutcomeMetrics, type PerformanceSnapshot };
