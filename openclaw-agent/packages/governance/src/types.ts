/**
 * Governance Analysis Types
 */

import type { ProposalInfo } from '@havenclaw/haven-interface';

/**
 * Proposal impact assessment dimensions
 */
export interface ImpactAssessment {
  proposalId: bigint;
  overallScore: number; // 0-10
  
  // Dimension scores
  protocolImpact: DimensionScore;
  communityImpact: DimensionScore;
  technicalImpact: DimensionScore;
  economicImpact: DimensionScore;
  
  // Risk assessment
  risks: RiskAssessment[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  // Recommendation
  recommendation: VoteRecommendation;
  confidence: number; // 0-1
  reasoning: string;
}

export interface DimensionScore {
  score: number; // 0-10
  factors: string[];
  weight: number; // 0-1
}

export interface RiskAssessment {
  category: 'technical' | 'economic' | 'governance' | 'security' | 'operational';
  description: string;
  probability: number; // 0-1
  severity: number; // 0-10
  mitigation?: string;
}

export type VoteRecommendation = 'for' | 'against' | 'abstain';

/**
 * Proposal simulation result
 */
export interface SimulationResult {
  proposalId: bigint;
  
  // Voting simulation
  predictedOutcome: {
    for: bigint;
    against: bigint;
    abstain: bigint;
    quorumReached: boolean;
    passes: boolean;
  };
  
  // Impact simulation
  impactScenarios: ImpactScenario[];
  
  // Confidence
  confidence: number; // 0-1
  assumptions: string[];
}

export interface ImpactScenario {
  name: string;
  probability: number; // 0-1
  outcomes: {
    treasuryImpact: string;
    protocolChanges: string[];
    communitySentiment: 'positive' | 'neutral' | 'negative';
    longTermEffects: string[];
  };
}

/**
 * Historical voting pattern
 */
export interface VotingPattern {
  // Aggregate stats
  totalProposals: number;
  passRate: number; // 0-1
  averageTurnout: number; // 0-1
  
  // Voting behavior
  forRate: number; // 0-1
  againstRate: number; // 0-1
  abstainRate: number; // 0-1
  
  // Temporal patterns
  votingDuration: {
    average: number; // seconds
    median: number;
  };
  
  // Proposal type breakdown
  byType: Record<string, {
    count: number;
    passRate: number;
    averageSupport: number;
  }>;
  
  // Trusted proposers success rate
  trustedProposerSuccessRate: number;
}

/**
 * Proposal classification
 */
export interface ProposalClassification {
  proposalId: bigint;
  
  // Category
  category: ProposalCategory;
  subcategory?: string;
  
  // Complexity
  complexity: 'simple' | 'moderate' | 'complex';
  
  // Controversy prediction
  controversyLevel: 'low' | 'medium' | 'high';
  predictedDisagreement: number; // 0-1
  
  // Tags
  tags: string[];
}

export type ProposalCategory = 
  | 'treasury'
  | 'parameter_change'
  | 'protocol_upgrade'
  | 'governance'
  | 'community'
  | 'partnership'
  | 'emergency'
  | 'other';

/**
 * Governance analysis configuration
 */
export interface GovernanceConfig {
  // Analysis weights
  protocolImpactWeight: number;
  communityImpactWeight: number;
  technicalImpactWeight: number;
  economicImpactWeight: number;
  
  // Risk thresholds
  highRiskThreshold: number;
  criticalRiskThreshold: number;
  
  // Recommendation thresholds
  recommendForThreshold: number;
  recommendAgainstThreshold: number;
  
  // Simulation settings
  simulationSamples: number;
  
  // Trusted proposers
  trustedProposers: string[];
  
  // Analysis cache TTL
  cacheTTL: number; // seconds
}

export const DEFAULT_GOVERNANCE_CONFIG: GovernanceConfig = {
  protocolImpactWeight: 0.3,
  communityImpactWeight: 0.2,
  technicalImpactWeight: 0.25,
  economicImpactWeight: 0.25,
  
  highRiskThreshold: 0.6,
  criticalRiskThreshold: 0.8,
  
  recommendForThreshold: 7,
  recommendAgainstThreshold: 4,
  
  simulationSamples: 100,
  
  trustedProposers: [],
  
  cacheTTL: 3600, // 1 hour
};
