/**
 * Learning System Types
 */

/**
 * Learning experience record
 */
export interface LearningExperience {
  id: string;
  timestamp: number;
  domain: ExperienceDomain;
  
  // Context
  context: {
    situation: string;
    options: string[];
    constraints: string[];
  };
  
  // Decision
  decision: {
    action: string;
    reasoning: string;
    expectedOutcome: string;
  };
  
  // Outcome
  outcome: {
    actualResult: string;
    success: boolean;
    metrics: OutcomeMetrics;
  };
  
  // Learning
  lessons: Lesson[];
}

export type ExperienceDomain = 'governance' | 'task' | 'reputation' | 'transaction' | 'general';

export interface OutcomeMetrics {
  reputationChange: string; // String to handle bigint
  balanceChange: string;
  gasUsed: string;
  timeSpent: number; // seconds
  opportunityCost?: string;
}

/**
 * Extracted lesson from experience
 */
export interface Lesson {
  id: string;
  experienceId: string;
  type: LessonType;
  description: string;
  applicability: string[]; // Domains where this applies
  confidence: number; // 0-1
  createdAt: number;
  validatedAt?: number;
  validationCount: number; // How many times validated
}

export type LessonType = 
  | 'success_pattern'
  | 'failure_pattern'
  | 'optimization'
  | 'risk_awareness'
  | 'timing'
  | 'strategy';

/**
 * Learning model update
 */
export interface ModelUpdate {
  id: string;
  timestamp: number;
  type: ModelUpdateType;
  
  // Changes
  changes: {
    added: string[];
    modified: string[];
    deprecated: string[];
  };
  
  // Impact
  affectedDecisions: string[];
  expectedImprovement: number; // 0-1
}

export type ModelUpdateType = 'rule_addition' | 'rule_modification' | 'weight_adjustment' | 'strategy_update';

/**
 * Performance metrics dashboard
 */
export interface LearningMetrics {
  // Overall
  totalExperiences: number;
  totalLessons: number;
  learningRate: number; // Lessons per day
  
  // Success metrics
  successRate: number; // 0-1
  improvementTrend: 'improving' | 'stable' | 'declining';
  
  // Domain breakdown
  byDomain: Record<ExperienceDomain, DomainMetrics>;
  
  // Temporal
  recentPerformance: {
    last24h: PerformanceSnapshot;
    last7d: PerformanceSnapshot;
    last30d: PerformanceSnapshot;
  };
  
  // Model quality
  modelQuality: {
    coverage: number; // 0-1
    confidence: number; // 0-1
    lastUpdate: number;
  };
}

export interface DomainMetrics {
  experiences: number;
  successRate: number;
  averageReward: string;
  lessonsLearned: number;
}

export interface PerformanceSnapshot {
  decisions: number;
  successRate: number;
  averageConfidence: number;
  totalValue: string;
}

/**
 * Learning configuration
 */
export interface LearningConfig {
  // Experience settings
  maxExperiences: number;
  experienceTTL: number; // seconds, 0 = permanent
  
  // Lesson extraction
  minConfidenceForLesson: number;
  autoValidateLessons: boolean;
  validationThreshold: number; // Number of validations to confirm
  
  // Model updates
  autoUpdateModel: boolean;
  updateThreshold: number; // Min experiences before update
  maxUpdatesPerDay: number;
  
  // Metrics
  metricsWindow: number; // Days to track
  trackImprovement: boolean;
}

export const DEFAULT_LEARNING_CONFIG: LearningConfig = {
  maxExperiences: 1000,
  experienceTTL: 0, // Permanent by default
  
  minConfidenceForLesson: 0.7,
  autoValidateLessons: true,
  validationThreshold: 3,
  
  autoUpdateModel: true,
  updateThreshold: 10,
  maxUpdatesPerDay: 5,
  
  metricsWindow: 30,
  trackImprovement: true,
};
