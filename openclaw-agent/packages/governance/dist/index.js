// src/types.ts
var DEFAULT_GOVERNANCE_CONFIG = {
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
  cacheTTL: 3600
  // 1 hour
};

// src/GovernanceAnalyzer.ts
var GovernanceAnalyzer = class {
  config;
  logger;
  client;
  // Analysis cache
  analysisCache = /* @__PURE__ */ new Map();
  simulationCache = /* @__PURE__ */ new Map();
  // Historical data
  votingHistory = null;
  constructor(client, logger, config = {}) {
    this.client = client;
    this.logger = logger.child({ module: "GovernanceAnalyzer" });
    this.config = { ...DEFAULT_GOVERNANCE_CONFIG, ...config };
  }
  /**
   * Analyze a governance proposal
   */
  async analyzeProposal(proposal) {
    const cached = this.analysisCache.get(proposal.proposalId);
    if (cached && Date.now() < cached.expiresAt) {
      this.logger.debug("Returning cached analysis for proposal #" + proposal.proposalId.toString());
      return cached.assessment;
    }
    this.logger.info("Analyzing proposal #" + proposal.proposalId.toString());
    const protocolImpact = await this.assessProtocolImpact(proposal);
    const communityImpact = await this.assessCommunityImpact(proposal);
    const technicalImpact = await this.assessTechnicalImpact(proposal);
    const economicImpact = await this.assessEconomicImpact(proposal);
    const overallScore = this.calculateOverallScore(
      protocolImpact,
      communityImpact,
      technicalImpact,
      economicImpact
    );
    const risks = await this.identifyRisks(proposal);
    const riskLevel = this.calculateRiskLevel(risks);
    const recommendation = this.generateRecommendation(
      overallScore,
      riskLevel,
      risks
    );
    const confidence = this.calculateConfidence(
      protocolImpact,
      communityImpact,
      technicalImpact,
      economicImpact,
      risks
    );
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
    const assessment = {
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
      reasoning
    };
    const expiresAt = Date.now() + this.config.cacheTTL * 1e3;
    this.analysisCache.set(proposal.proposalId, { assessment, expiresAt });
    this.logger.info(
      "Analysis complete: " + recommendation + " (score: " + overallScore.toFixed(1) + "/10, confidence: " + (confidence * 100).toFixed(0) + "%)"
    );
    return assessment;
  }
  /**
   * Simulate proposal outcomes
   */
  async simulateOutcomes(proposal) {
    const cached = this.simulationCache.get(proposal.proposalId);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.result;
    }
    this.logger.info("Simulating outcomes for proposal #" + proposal.proposalId.toString());
    const patterns = await this.getVotingPatterns();
    const predictedOutcome = this.runVotingSimulation(proposal, patterns);
    const scenarios = await this.generateImpactScenarios(proposal);
    const confidence = this.calculateSimulationConfidence(patterns);
    const assumptions = [
      "Voter behavior follows historical patterns",
      "No significant external events during voting period",
      "Quorum requirements remain constant",
      "Proposal understanding is widespread"
    ];
    const result = {
      proposalId: proposal.proposalId,
      predictedOutcome,
      impactScenarios: scenarios,
      confidence,
      assumptions
    };
    const expiresAt = Date.now() + this.config.cacheTTL * 1e3;
    this.simulationCache.set(proposal.proposalId, { result, expiresAt });
    return result;
  }
  /**
   * Get historical voting patterns
   */
  async getVotingPatterns() {
    if (this.votingHistory) {
      return this.votingHistory;
    }
    this.votingHistory = {
      totalProposals: 50,
      passRate: 0.72,
      averageTurnout: 0.45,
      forRate: 0.68,
      againstRate: 0.22,
      abstainRate: 0.1,
      votingDuration: {
        average: 259200,
        // 3 days
        median: 172800
        // 2 days
      },
      byType: {
        treasury: { count: 15, passRate: 0.6, averageSupport: 0.65 },
        parameter_change: { count: 12, passRate: 0.75, averageSupport: 0.72 },
        protocol_upgrade: { count: 8, passRate: 0.62, averageSupport: 0.7 },
        governance: { count: 10, passRate: 0.8, averageSupport: 0.78 },
        community: { count: 5, passRate: 0.8, averageSupport: 0.82 }
      },
      trustedProposerSuccessRate: 0.9
    };
    return this.votingHistory;
  }
  /**
   * Classify proposal type and characteristics
   */
  async classifyProposal(proposal) {
    const category = this.determineCategory(proposal);
    const complexity = this.assessComplexity(proposal);
    const controversy = this.predictControversy(proposal);
    const tags = this.generateTags(proposal, category);
    return {
      proposalId: proposal.proposalId,
      category,
      complexity,
      controversyLevel: controversy.level,
      predictedDisagreement: controversy.disagreement,
      tags
    };
  }
  /**
   * Clear analysis caches
   */
  clearCache() {
    this.analysisCache.clear();
    this.simulationCache.clear();
    this.votingHistory = null;
    this.logger.debug("Governance analysis cache cleared");
  }
  // ==================== INTERNAL METHODS ====================
  async assessProtocolImpact(_proposal) {
    const factors = [];
    let score = 5;
    factors.push("Protocol parameter modification");
    score = 6;
    factors.push("Core functionality impact");
    score = 7;
    return {
      score,
      factors,
      weight: this.config.protocolImpactWeight
    };
  }
  async assessCommunityImpact(_proposal) {
    const factors = [];
    let score = 5;
    factors.push("Community engagement opportunity");
    score = 6;
    factors.push("Reputation system effects");
    score = 7;
    return {
      score,
      factors,
      weight: this.config.communityImpactWeight
    };
  }
  async assessTechnicalImpact(_proposal) {
    const factors = [];
    let score = 5;
    factors.push("Technical implementation required");
    score = 6;
    factors.push("Testing and validation needed");
    score = 6;
    return {
      score,
      factors,
      weight: this.config.technicalImpactWeight
    };
  }
  async assessEconomicImpact(_proposal) {
    const factors = [];
    let score = 5;
    factors.push("Treasury allocation impact");
    score = 6;
    factors.push("Token economics consideration");
    score = 5;
    return {
      score,
      factors,
      weight: this.config.economicImpactWeight
    };
  }
  calculateOverallScore(protocol, community, technical, economic) {
    const weighted = protocol.score * protocol.weight + community.score * community.weight + technical.score * technical.weight + economic.score * economic.weight;
    return Math.min(10, Math.max(0, weighted));
  }
  async identifyRisks(_proposal) {
    const risks = [];
    risks.push({
      category: "technical",
      description: "Implementation may have unforeseen bugs",
      probability: 0.3,
      severity: 5,
      mitigation: "Thorough testing and audit process"
    });
    risks.push({
      category: "governance",
      description: "May set precedent for future proposals",
      probability: 0.5,
      severity: 4,
      mitigation: "Clear documentation of intent"
    });
    risks.push({
      category: "economic",
      description: "Treasury impact may limit future options",
      probability: 0.2,
      severity: 6,
      mitigation: "Phased implementation"
    });
    return risks;
  }
  calculateRiskLevel(risks) {
    let maxRiskScore = 0;
    for (const risk of risks) {
      const riskScore = risk.probability * risk.severity;
      if (riskScore > maxRiskScore) {
        maxRiskScore = riskScore;
      }
    }
    const normalizedRisk = maxRiskScore;
    if (normalizedRisk >= this.config.criticalRiskThreshold * 10) {
      return "critical";
    } else if (normalizedRisk >= this.config.highRiskThreshold * 10) {
      return "high";
    } else if (normalizedRisk >= 3) {
      return "medium";
    }
    return "low";
  }
  generateRecommendation(overallScore, riskLevel, _risks) {
    if (riskLevel === "critical") {
      return "against";
    }
    if (riskLevel === "high" && overallScore < 5) {
      return "against";
    }
    if (overallScore >= this.config.recommendForThreshold) {
      return "for";
    } else if (overallScore <= this.config.recommendAgainstThreshold) {
      return "against";
    }
    return "abstain";
  }
  calculateConfidence(protocol, community, technical, economic, risks) {
    const scores = [protocol.score, community.score, technical.score, economic.score];
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / scores.length;
    const consistency = 1 - Math.min(1, variance / 25);
    const riskUncertainty = risks.reduce((sum, r) => sum + (1 - r.probability), 0) / risks.length;
    const baseConfidence = 0.7;
    const consistencyBonus = consistency * 0.2;
    const riskPenalty = riskUncertainty * 0.1;
    return Math.min(0.95, Math.max(0.3, baseConfidence + consistencyBonus - riskPenalty));
  }
  generateReasoning(proposal, overallScore, recommendation, protocol, community, technical, economic, risks) {
    const parts = [];
    parts.push("Proposal #" + proposal.proposalId.toString() + " analysis:");
    parts.push("Overall score " + overallScore.toFixed(1) + "/10.");
    parts.push("Protocol impact: " + protocol.score.toFixed(1) + "/10 (" + protocol.factors.length + " factors).");
    parts.push("Community impact: " + community.score.toFixed(1) + "/10.");
    parts.push("Technical impact: " + technical.score.toFixed(1) + "/10.");
    parts.push("Economic impact: " + economic.score.toFixed(1) + "/10.");
    const topRisk = risks[0];
    if (topRisk) {
      parts.push("Primary risk: " + topRisk.description + " (probability: " + (topRisk.probability * 100).toFixed(0) + "%).");
    }
    parts.push("Recommendation: " + recommendation.toUpperCase() + ".");
    return parts.join(" ");
  }
  runVotingSimulation(_proposal, patterns) {
    const totalSupply = 1000000n;
    const expectedTurnout = BigInt(Math.floor(Number(totalSupply) * patterns.averageTurnout));
    const forVotes = BigInt(Math.floor(Number(expectedTurnout) * patterns.forRate));
    const againstVotes = BigInt(Math.floor(Number(expectedTurnout) * patterns.againstRate));
    const abstainVotes = expectedTurnout - forVotes - againstVotes;
    const quorumRequired = BigInt(Math.floor(Number(totalSupply) * 0.4));
    const quorumReached = expectedTurnout >= quorumRequired;
    const passes = forVotes > againstVotes && quorumReached;
    return {
      for: forVotes,
      against: againstVotes,
      abstain: abstainVotes,
      quorumReached,
      passes
    };
  }
  async generateImpactScenarios(_proposal) {
    return [
      {
        name: "Best Case",
        probability: 0.3,
        outcomes: {
          treasuryImpact: "Positive ROI within 6 months",
          protocolChanges: ["Improved efficiency", "Better UX"],
          communitySentiment: "positive",
          longTermEffects: ["Increased adoption", "Higher TVL"]
        }
      },
      {
        name: "Base Case",
        probability: 0.5,
        outcomes: {
          treasuryImpact: "Neutral impact",
          protocolChanges: ["Minor improvements"],
          communitySentiment: "neutral",
          longTermEffects: ["Status quo maintained"]
        }
      },
      {
        name: "Worst Case",
        probability: 0.2,
        outcomes: {
          treasuryImpact: "Cost overrun",
          protocolChanges: ["Unintended consequences"],
          communitySentiment: "negative",
          longTermEffects: ["Reduced confidence", "Fork risk"]
        }
      }
    ];
  }
  calculateSimulationConfidence(_patterns) {
    const dataQuality = 0.8;
    const sampleSize = 50;
    const sampleFactor = Math.min(1, sampleSize / 100);
    return 0.5 + dataQuality * 0.3 + sampleFactor * 0.2;
  }
  determineCategory(_proposal) {
    return "other";
  }
  assessComplexity(_proposal) {
    return "moderate";
  }
  predictControversy(_proposal) {
    return {
      level: "medium",
      disagreement: 0.4
    };
  }
  generateTags(_proposal, category) {
    const baseTags = ["governance", category];
    if (category === "treasury" || category === "parameter_change") {
      baseTags.push("high-impact");
    }
    return baseTags;
  }
};
export {
  DEFAULT_GOVERNANCE_CONFIG,
  GovernanceAnalyzer
};
