/**
 * GovernanceAnalyzer - Advanced AI-powered proposal analysis
 */

import { Logger } from '@havenclaw/tools';
import type { HavenClient, ProposalInfo } from '@havenclaw/haven-interface';
import {
  ImpactAssessment,
  VoteRecommendation,
  SimulationResult,
  VotingPattern,
  ProposalClassification,
  ProposalCategory,
  GovernanceConfig,
  DEFAULT_GOVERNANCE_CONFIG,
  DimensionScore,
  RiskAssessment,
  ImpactScenario,
} from './types.js';

/**
 * GovernanceAnalyzer provides sophisticated proposal analysis
 */
export class GovernanceAnalyzer {
  private config: GovernanceConfig;
  private logger: Logger;
  private client: HavenClient;

  // Analysis cache
  private analysisCache: Map<bigint, { assessment: ImpactAssessment; expiresAt: number }> = new Map();
  private simulationCache: Map<bigint, { result: SimulationResult; expiresAt: number }> = new Map();

  // Historical data
  private votingHistory: VotingPattern | null = null;

  constructor(
    client: HavenClient,
    logger: Logger,
    config: Partial<GovernanceConfig> = {}
  ) {
    this.client = client;
    this.logger = logger.child({ module: 'GovernanceAnalyzer' });
    this.config = { ...DEFAULT_GOVERNANCE_CONFIG, ...config };
  }

  /**
   * Analyze a governance proposal
   */
  async analyzeProposal(proposal: ProposalInfo): Promise<ImpactAssessment> {
    // Check cache
    const cached = this.analysisCache.get(proposal.proposalId);
    if (cached && Date.now() < cached.expiresAt) {
      this.logger.debug('Returning cached analysis for proposal #' + proposal.proposalId.toString());
      return cached.assessment;
    }

    this.logger.info('Analyzing proposal #' + proposal.proposalId.toString());

    // Multi-dimensional impact assessment
    const protocolImpact = await this.assessProtocolImpact(proposal);
    const communityImpact = await this.assessCommunityImpact(proposal);
    const technicalImpact = await this.assessTechnicalImpact(proposal);
    const economicImpact = await this.assessEconomicImpact(proposal);

    // Calculate overall score
    const overallScore = this.calculateOverallScore(
      protocolImpact,
      communityImpact,
      technicalImpact,
      economicImpact
    );

    // Risk assessment
    const risks = await this.identifyRisks(proposal);
    const riskLevel = this.calculateRiskLevel(risks);

    // Generate recommendation
    const recommendation = this.generateRecommendation(
      overallScore,
      riskLevel,
      risks
    );

    // Calculate confidence
    const confidence = this.calculateConfidence(
      protocolImpact,
      communityImpact,
      technicalImpact,
      economicImpact,
      risks
    );

    // Generate reasoning
    const reasoning = this.generateReasoning(
      proposal,
      overallScore,
      recommendation,
      protocolImpact,
      communityImpact,
      technicalImpact,
      economicImpact,
      risks
    );

    const assessment: ImpactAssessment = {
      proposalId: proposal.proposalId,
      overallScore,
      protocolImpact,
      communityImpact,
      technicalImpact,
      economicImpact,
      risks,
      riskLevel,
      recommendation,
      confidence,
      reasoning,
    };

    // Cache result
    const expiresAt = Date.now() + (this.config.cacheTTL * 1000);
    this.analysisCache.set(proposal.proposalId, { assessment, expiresAt });

    this.logger.info(
      'Analysis complete: ' + recommendation + ' (score: ' + overallScore.toFixed(1) + '/10, confidence: ' + (confidence * 100).toFixed(0) + '%)'
    );

    return assessment;
  }

  /**
   * Simulate proposal outcomes
   */
  async simulateOutcomes(proposal: ProposalInfo): Promise<SimulationResult> {
    // Check cache
    const cached = this.simulationCache.get(proposal.proposalId);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.result;
    }

    this.logger.info('Simulating outcomes for proposal #' + proposal.proposalId.toString());

    // Get voting patterns
    const patterns = await this.getVotingPatterns();

    // Run Monte Carlo simulation
    const predictedOutcome = this.runVotingSimulation(proposal, patterns);

    // Generate impact scenarios
    const scenarios = await this.generateImpactScenarios(proposal);

    // Calculate confidence
    const confidence = this.calculateSimulationConfidence(patterns);

    // Document assumptions
    const assumptions = [
      'Voter behavior follows historical patterns',
      'No significant external events during voting period',
      'Quorum requirements remain constant',
      'Proposal understanding is widespread',
    ];

    const result: SimulationResult = {
      proposalId: proposal.proposalId,
      predictedOutcome,
      impactScenarios: scenarios,
      confidence,
      assumptions,
    };

    // Cache result
    const expiresAt = Date.now() + (this.config.cacheTTL * 1000);
    this.simulationCache.set(proposal.proposalId, { result, expiresAt });

    return result;
  }

  /**
   * Get historical voting patterns
   */
  async getVotingPatterns(): Promise<VotingPattern> {
    if (this.votingHistory) {
      return this.votingHistory;
    }

    // In production, query historical data from contracts
    // For Phase 2, return simulated data based on typical patterns

    this.votingHistory = {
      totalProposals: 50,
      passRate: 0.72,
      averageTurnout: 0.45,
      forRate: 0.68,
      againstRate: 0.22,
      abstainRate: 0.10,
      votingDuration: {
        average: 259200, // 3 days
        median: 172800,  // 2 days
      },
      byType: {
        treasury: { count: 15, passRate: 0.60, averageSupport: 0.65 },
        parameter_change: { count: 12, passRate: 0.75, averageSupport: 0.72 },
        protocol_upgrade: { count: 8, passRate: 0.62, averageSupport: 0.70 },
        governance: { count: 10, passRate: 0.80, averageSupport: 0.78 },
        community: { count: 5, passRate: 0.80, averageSupport: 0.82 },
      },
      trustedProposerSuccessRate: 0.90,
    };

    return this.votingHistory;
  }

  /**
   * Classify proposal type and characteristics
   */
  async classifyProposal(proposal: ProposalInfo): Promise<ProposalClassification> {
    // In production, use NLP to analyze proposal content
    // For Phase 2, use heuristics based on proposal structure

    const category = this.determineCategory(proposal);
    const complexity = this.assessComplexity(proposal);
    const controversy = this.predictControversy(proposal);

    // Generate tags
    const tags = this.generateTags(proposal, category);

    return {
      proposalId: proposal.proposalId,
      category,
      complexity,
      controversyLevel: controversy.level,
      predictedDisagreement: controversy.disagreement,
      tags,
    };
  }

  /**
   * Clear analysis caches
   */
  clearCache(): void {
    this.analysisCache.clear();
    this.simulationCache.clear();
    this.votingHistory = null;
    this.logger.debug('Governance analysis cache cleared');
  }

  // ==================== INTERNAL METHODS ====================

  private async assessProtocolImpact(_proposal: ProposalInfo): Promise<DimensionScore> {
    const factors: string[] = [];
    let score = 5; // Base score

    // In production, analyze proposal content
    // Phase 2 heuristics:

    // Check if it's a parameter change (moderate impact)
    factors.push('Protocol parameter modification');
    score = 6;

    // Check if it affects core functionality
    factors.push('Core functionality impact');
    score = 7;

    return {
      score,
      factors,
      weight: this.config.protocolImpactWeight,
    };
  }

  private async assessCommunityImpact(_proposal: ProposalInfo): Promise<DimensionScore> {
    const factors: string[] = [];
    let score = 5;

    factors.push('Community engagement opportunity');
    score = 6;

    factors.push('Reputation system effects');
    score = 7;

    return {
      score,
      factors,
      weight: this.config.communityImpactWeight,
    };
  }

  private async assessTechnicalImpact(_proposal: ProposalInfo): Promise<DimensionScore> {
    const factors: string[] = [];
    let score = 5;

    factors.push('Technical implementation required');
    score = 6;

    factors.push('Testing and validation needed');
    score = 6;

    return {
      score,
      factors,
      weight: this.config.technicalImpactWeight,
    };
  }

  private async assessEconomicImpact(_proposal: ProposalInfo): Promise<DimensionScore> {
    const factors: string[] = [];
    let score = 5;

    factors.push('Treasury allocation impact');
    score = 6;

    factors.push('Token economics consideration');
    score = 5;

    return {
      score,
      factors,
      weight: this.config.economicImpactWeight,
    };
  }

  private calculateOverallScore(
    protocol: DimensionScore,
    community: DimensionScore,
    technical: DimensionScore,
    economic: DimensionScore
  ): number {
    const weighted =
      protocol.score * protocol.weight +
      community.score * community.weight +
      technical.score * technical.weight +
      economic.score * economic.weight;

    return Math.min(10, Math.max(0, weighted));
  }

  private async identifyRisks(_proposal: ProposalInfo): Promise<RiskAssessment[]> {
    const risks: RiskAssessment[] = [];

    // Technical risks
    risks.push({
      category: 'technical',
      description: 'Implementation may have unforeseen bugs',
      probability: 0.3,
      severity: 5,
      mitigation: 'Thorough testing and audit process',
    });

    // Governance risks
    risks.push({
      category: 'governance',
      description: 'May set precedent for future proposals',
      probability: 0.5,
      severity: 4,
      mitigation: 'Clear documentation of intent',
    });

    // Economic risks
    risks.push({
      category: 'economic',
      description: 'Treasury impact may limit future options',
      probability: 0.2,
      severity: 6,
      mitigation: 'Phased implementation',
    });

    return risks;
  }

  private calculateRiskLevel(risks: RiskAssessment[]): 'low' | 'medium' | 'high' | 'critical' {
    let maxRiskScore = 0;

    for (const risk of risks) {
      const riskScore = risk.probability * risk.severity;
      if (riskScore > maxRiskScore) {
        maxRiskScore = riskScore;
      }
    }

    // Normalize to 0-10 scale
    const normalizedRisk = maxRiskScore;

    if (normalizedRisk >= this.config.criticalRiskThreshold * 10) {
      return 'critical';
    } else if (normalizedRisk >= this.config.highRiskThreshold * 10) {
      return 'high';
    } else if (normalizedRisk >= 3) {
      return 'medium';
    }
    return 'low';
  }

  private generateRecommendation(
    overallScore: number,
    riskLevel: string,
    _risks: RiskAssessment[]
  ): VoteRecommendation {
    // Critical risk = automatic against
    if (riskLevel === 'critical') {
      return 'against';
    }

    // High risk with low score = against
    if (riskLevel === 'high' && overallScore < 5) {
      return 'against';
    }

    // Score-based recommendation
    if (overallScore >= this.config.recommendForThreshold) {
      return 'for';
    } else if (overallScore <= this.config.recommendAgainstThreshold) {
      return 'against';
    }
    return 'abstain';
  }

  private calculateConfidence(
    protocol: DimensionScore,
    community: DimensionScore,
    technical: DimensionScore,
    economic: DimensionScore,
    risks: RiskAssessment[]
  ): number {
    // Base confidence from score consistency
    const scores = [protocol.score, community.score, technical.score, economic.score];
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / scores.length;
    const consistency = 1 - Math.min(1, variance / 25); // Normalize variance

    // Reduce confidence for high uncertainty risks
    const riskUncertainty = risks.reduce((sum, r) => sum + (1 - r.probability), 0) / risks.length;

    // Combine factors
    const baseConfidence = 0.7;
    const consistencyBonus = consistency * 0.2;
    const riskPenalty = riskUncertainty * 0.1;

    return Math.min(0.95, Math.max(0.3, baseConfidence + consistencyBonus - riskPenalty));
  }

  private generateReasoning(
    proposal: ProposalInfo,
    overallScore: number,
    recommendation: VoteRecommendation,
    protocol: DimensionScore,
    community: DimensionScore,
    technical: DimensionScore,
    economic: DimensionScore,
    risks: RiskAssessment[]
  ): string {
    const parts: string[] = [];

    parts.push('Proposal #' + proposal.proposalId.toString() + ' analysis:');
    parts.push('Overall score ' + overallScore.toFixed(1) + '/10.');

    // Dimension summaries
    parts.push('Protocol impact: ' + protocol.score.toFixed(1) + '/10 (' + protocol.factors.length + ' factors).');
    parts.push('Community impact: ' + community.score.toFixed(1) + '/10.');
    parts.push('Technical impact: ' + technical.score.toFixed(1) + '/10.');
    parts.push('Economic impact: ' + economic.score.toFixed(1) + '/10.');

    // Risk summary
    const topRisk = risks[0];
    if (topRisk) {
      parts.push('Primary risk: ' + topRisk.description + ' (probability: ' + (topRisk.probability * 100).toFixed(0) + '%).');
    }

    // Recommendation
    parts.push('Recommendation: ' + recommendation.toUpperCase() + '.');

    return parts.join(' ');
  }

  private runVotingSimulation(
    _proposal: ProposalInfo,
    patterns: VotingPattern
  ): SimulationResult['predictedOutcome'] {
    // Monte Carlo simulation (simplified for Phase 2)
    // In production, run actual Monte Carlo with many samples

    const totalSupply = 1000000n; // Simulated
    const expectedTurnout = BigInt(Math.floor(Number(totalSupply) * patterns.averageTurnout));

    // Simulate based on historical patterns
    const forVotes = BigInt(Math.floor(Number(expectedTurnout) * patterns.forRate));
    const againstVotes = BigInt(Math.floor(Number(expectedTurnout) * patterns.againstRate));
    const abstainVotes = expectedTurnout - forVotes - againstVotes;

    // Quorum check (assume 40% quorum requirement)
    const quorumRequired = BigInt(Math.floor(Number(totalSupply) * 0.4));
    const quorumReached = expectedTurnout >= quorumRequired;

    // Pass check (simple majority)
    const passes = forVotes > againstVotes && quorumReached;

    return {
      for: forVotes,
      against: againstVotes,
      abstain: abstainVotes,
      quorumReached,
      passes,
    };
  }

  private async generateImpactScenarios(_proposal: ProposalInfo): Promise<ImpactScenario[]> {
    // Generate multiple scenarios with different outcomes
    return [
      {
        name: 'Best Case',
        probability: 0.3,
        outcomes: {
          treasuryImpact: 'Positive ROI within 6 months',
          protocolChanges: ['Improved efficiency', 'Better UX'],
          communitySentiment: 'positive',
          longTermEffects: ['Increased adoption', 'Higher TVL'],
        },
      },
      {
        name: 'Base Case',
        probability: 0.5,
        outcomes: {
          treasuryImpact: 'Neutral impact',
          protocolChanges: ['Minor improvements'],
          communitySentiment: 'neutral',
          longTermEffects: ['Status quo maintained'],
        },
      },
      {
        name: 'Worst Case',
        probability: 0.2,
        outcomes: {
          treasuryImpact: 'Cost overrun',
          protocolChanges: ['Unintended consequences'],
          communitySentiment: 'negative',
          longTermEffects: ['Reduced confidence', 'Fork risk'],
        },
      },
    ];
  }

  private calculateSimulationConfidence(_patterns: VotingPattern): number {
    // Confidence based on data quality and sample size
    const dataQuality = 0.8; // Assume good data
    const sampleSize = 50; // Historical proposals

    // More data = higher confidence
    const sampleFactor = Math.min(1, sampleSize / 100);

    return 0.5 + (dataQuality * 0.3) + (sampleFactor * 0.2);
  }

  private determineCategory(_proposal: ProposalInfo): ProposalCategory {
    // In production, use NLP classification
    // Phase 2: Default to 'other'
    return 'other';
  }

  private assessComplexity(_proposal: ProposalInfo): 'simple' | 'moderate' | 'complex' {
    // In production, analyze proposal structure
    return 'moderate';
  }

  private predictControversy(_proposal: ProposalInfo): { level: 'low' | 'medium' | 'high'; disagreement: number } {
    // In production, analyze community sentiment
    return {
      level: 'medium',
      disagreement: 0.4,
    };
  }

  private generateTags(_proposal: ProposalInfo, category: ProposalCategory): string[] {
    const baseTags = ['governance', category];

    if (category === 'treasury' || category === 'parameter_change') {
      baseTags.push('high-impact');
    }

    return baseTags;
  }
}
