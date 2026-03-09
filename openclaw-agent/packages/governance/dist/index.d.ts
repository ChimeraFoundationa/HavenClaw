import { Logger } from '@havenclaw/tools';
import { HavenClient, ProposalInfo } from '@havenclaw/haven-interface';

/**
 * Governance Analysis Types
 */
/**
 * Proposal impact assessment dimensions
 */
interface ImpactAssessment {
    proposalId: bigint;
    overallScore: number;
    protocolImpact: DimensionScore;
    communityImpact: DimensionScore;
    technicalImpact: DimensionScore;
    economicImpact: DimensionScore;
    risks: RiskAssessment[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    recommendation: VoteRecommendation;
    confidence: number;
    reasoning: string;
}
interface DimensionScore {
    score: number;
    factors: string[];
    weight: number;
}
interface RiskAssessment {
    category: 'technical' | 'economic' | 'governance' | 'security' | 'operational';
    description: string;
    probability: number;
    severity: number;
    mitigation?: string;
}
type VoteRecommendation = 'for' | 'against' | 'abstain';
/**
 * Proposal simulation result
 */
interface SimulationResult {
    proposalId: bigint;
    predictedOutcome: {
        for: bigint;
        against: bigint;
        abstain: bigint;
        quorumReached: boolean;
        passes: boolean;
    };
    impactScenarios: ImpactScenario[];
    confidence: number;
    assumptions: string[];
}
interface ImpactScenario {
    name: string;
    probability: number;
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
interface VotingPattern {
    totalProposals: number;
    passRate: number;
    averageTurnout: number;
    forRate: number;
    againstRate: number;
    abstainRate: number;
    votingDuration: {
        average: number;
        median: number;
    };
    byType: Record<string, {
        count: number;
        passRate: number;
        averageSupport: number;
    }>;
    trustedProposerSuccessRate: number;
}
/**
 * Proposal classification
 */
interface ProposalClassification {
    proposalId: bigint;
    category: ProposalCategory;
    subcategory?: string;
    complexity: 'simple' | 'moderate' | 'complex';
    controversyLevel: 'low' | 'medium' | 'high';
    predictedDisagreement: number;
    tags: string[];
}
type ProposalCategory = 'treasury' | 'parameter_change' | 'protocol_upgrade' | 'governance' | 'community' | 'partnership' | 'emergency' | 'other';
/**
 * Governance analysis configuration
 */
interface GovernanceConfig {
    protocolImpactWeight: number;
    communityImpactWeight: number;
    technicalImpactWeight: number;
    economicImpactWeight: number;
    highRiskThreshold: number;
    criticalRiskThreshold: number;
    recommendForThreshold: number;
    recommendAgainstThreshold: number;
    simulationSamples: number;
    trustedProposers: string[];
    cacheTTL: number;
}
declare const DEFAULT_GOVERNANCE_CONFIG: GovernanceConfig;

/**
 * GovernanceAnalyzer - Advanced AI-powered proposal analysis
 */

/**
 * GovernanceAnalyzer provides sophisticated proposal analysis
 */
declare class GovernanceAnalyzer {
    private config;
    private logger;
    private client;
    private analysisCache;
    private simulationCache;
    private votingHistory;
    constructor(client: HavenClient, logger: Logger, config?: Partial<GovernanceConfig>);
    /**
     * Analyze a governance proposal
     */
    analyzeProposal(proposal: ProposalInfo): Promise<ImpactAssessment>;
    /**
     * Simulate proposal outcomes
     */
    simulateOutcomes(proposal: ProposalInfo): Promise<SimulationResult>;
    /**
     * Get historical voting patterns
     */
    getVotingPatterns(): Promise<VotingPattern>;
    /**
     * Classify proposal type and characteristics
     */
    classifyProposal(proposal: ProposalInfo): Promise<ProposalClassification>;
    /**
     * Clear analysis caches
     */
    clearCache(): void;
    private assessProtocolImpact;
    private assessCommunityImpact;
    private assessTechnicalImpact;
    private assessEconomicImpact;
    private calculateOverallScore;
    private identifyRisks;
    private calculateRiskLevel;
    private generateRecommendation;
    private calculateConfidence;
    private generateReasoning;
    private runVotingSimulation;
    private generateImpactScenarios;
    private calculateSimulationConfidence;
    private determineCategory;
    private assessComplexity;
    private predictControversy;
    private generateTags;
}

export { DEFAULT_GOVERNANCE_CONFIG, type DimensionScore, GovernanceAnalyzer, type GovernanceConfig, type ImpactAssessment, type ImpactScenario, type ProposalCategory, type ProposalClassification, type RiskAssessment, type SimulationResult, type VoteRecommendation, type VotingPattern };
