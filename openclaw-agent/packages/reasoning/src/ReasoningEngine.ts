/**
 * ReasoningEngine - Advanced reasoning with OODA loop and analysis
 */

import { EventEmitter } from '@havenclaw/runtime';
import { Logger } from '@havenclaw/tools';
import type { HavenClient, ProposalInfo, TaskInfo } from '@havenclaw/haven-interface';
import { OODALoop, DEFAULT_OODA_CONFIG } from './OODALoop.js';
import type { OODAConfig, Decision, Action, Experience, Context } from './types.js';

export interface ReasoningConfig extends Partial<OODAConfig> {
  // Analysis settings
  enableGovernanceAnalysis: boolean;
  enableTaskAnalysis: boolean;

  // Learning settings
  enableLearning: boolean;
  minConfidenceForAction: number;
}

export const DEFAULT_REASONING_CONFIG: ReasoningConfig = {
  enableGovernanceAnalysis: true,
  enableTaskAnalysis: true,
  enableLearning: true,
  minConfidenceForAction: 0.6,
};

export interface GovernanceAnalysis {
  proposal: ProposalInfo;
  impactScore: number; // 0-10
  recommendation: 'for' | 'against' | 'abstain';
  confidence: number; // 0-1
  reasoning: string;
  risks: string[];
  benefits: string[];
}

export interface TaskAnalysis {
  task: TaskInfo;
  valueScore: number; // 0-10
  recommendation: 'accept' | 'decline';
  confidence: number; // 0-1
  estimatedROI: number;
  risks: string[];
  requiredCapabilities: string[];
}

/**
 * ReasoningEngine provides advanced AI-powered decision making
 */
export class ReasoningEngine {
  private config: ReasoningConfig;
  private eventEmitter: EventEmitter;
  private logger: Logger;
  private client: HavenClient;

  private oodaLoop: OODALoop;
  private running: boolean = false;

  // Analysis cache
  private proposalCache: Map<bigint, GovernanceAnalysis> = new Map();
  private taskCache: Map<bigint, TaskAnalysis> = new Map();

  constructor(
    client: HavenClient,
    eventEmitter: EventEmitter,
    logger: Logger,
    config: Partial<ReasoningConfig> = {}
  ) {
    this.client = client;
    this.eventEmitter = eventEmitter;
    this.logger = logger.child({ module: 'ReasoningEngine' });
    this.config = { ...DEFAULT_REASONING_CONFIG, ...config };

    // Initialize OODA loop
    this.oodaLoop = new OODALoop(client, eventEmitter, logger, config);
  }

  /**
   * Start the reasoning engine
   */
  async start(): Promise<void> {
    if (this.running) {
      return;
    }

    this.logger.info('Starting reasoning engine...');
    this.running = true;

    await this.oodaLoop.start();

    this.logger.info('Reasoning engine started');
  }

  /**
   * Stop the reasoning engine
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    this.logger.info('Stopping reasoning engine...');
    this.running = false;

    await this.oodaLoop.stop();

    this.logger.info('Reasoning engine stopped');
  }

  /**
   * Get engine status
   */
  getStatus(): {
    running: boolean;
    ooda: ReturnType<OODALoop['getStatus']>;
    proposalCache: number;
    taskCache: number;
  } {
    return {
      running: this.running,
      ooda: this.oodaLoop.getStatus(),
      proposalCache: this.proposalCache.size,
      taskCache: this.taskCache.size,
    };
  }

  // ==================== GOVERNANCE ANALYSIS ====================

  /**
   * Analyze a governance proposal
   */
  async analyzeProposal(proposal: ProposalInfo): Promise<GovernanceAnalysis> {
    const proposalIdStr = proposal.proposalId.toString();
    this.logger.info('Analyzing proposal #' + proposalIdStr);

    // Check cache
    const cached = this.proposalCache.get(proposal.proposalId);
    if (cached) {
      return cached;
    }

    // Multi-dimensional analysis
    const impactScore = this.calculateProposalImpact(proposal);
    const risks = this.identifyProposalRisks(proposal);
    const benefits = this.identifyProposalBenefits(proposal);
    const recommendation = this.generateProposalRecommendation(proposal, impactScore, risks, benefits);
    const confidence = this.calculateConfidence(proposal, risks, benefits);

    const analysis: GovernanceAnalysis = {
      proposal,
      impactScore,
      recommendation,
      confidence,
      reasoning: this.generateProposalReasoning(proposal, recommendation, impactScore),
      risks,
      benefits,
    };

    // Cache result
    this.proposalCache.set(proposal.proposalId, analysis);

    const confPercent = (confidence * 100).toFixed(0);
    this.logger.info('Proposal analysis: ' + recommendation + ' (confidence: ' + confPercent + '%)');
    return analysis;
  }

  private calculateProposalImpact(_proposal: ProposalInfo): number {
    // Multi-dimensional impact scoring
    // In production, analyze:
    // - Protocol impact (treasury, parameters, upgrades)
    // - Community impact (reputation, incentives)
    // - Technical impact (complexity, risk)

    // Simplified scoring
    return 5; // Medium impact by default
  }

  private identifyProposalRisks(_proposal: ProposalInfo): string[] {
    const risks: string[] = [];

    // In production, analyze proposal content
    risks.push('Unknown implementation details');
    risks.push('Potential unintended consequences');

    return risks;
  }

  private identifyProposalBenefits(_proposal: ProposalInfo): string[] {
    const benefits: string[] = [];

    // In production, analyze proposal content
    benefits.push('Protocol improvement');
    benefits.push('Community engagement');

    return benefits;
  }

  private generateProposalRecommendation(
    _proposal: ProposalInfo,
    impactScore: number,
    risks: string[],
    benefits: string[]
  ): 'for' | 'against' | 'abstain' {
    // Simple heuristic: more benefits than risks = FOR
    if (benefits.length > risks.length && impactScore >= 5) {
      return 'for';
    }
    if (risks.length > benefits.length) {
      return 'against';
    }
    return 'abstain';
  }

  private calculateConfidence(_proposal: ProposalInfo, risks: string[], benefits: string[]): number {
    // Confidence based on available information
    const totalFactors = risks.length + benefits.length;
    if (totalFactors === 0) return 0.5;
    return Math.min(0.9, 0.5 + (totalFactors * 0.1));
  }

  private generateProposalReasoning(
    proposal: ProposalInfo,
    recommendation: string,
    impactScore: number
  ): string {
    const proposalIdStr = proposal.proposalId.toString();
    return 'Proposal #' + proposalIdStr + ' has ' + impactScore + '/10 impact. Recommendation: ' + recommendation + '. ' +
      'Based on risk-benefit analysis and alignment with protocol goals.';
  }

  // ==================== TASK ANALYSIS ====================

  /**
   * Analyze a task opportunity
   */
  async analyzeTask(task: TaskInfo, agentCapabilities: string[]): Promise<TaskAnalysis> {
    const taskIdStr = task.taskId.toString();
    this.logger.info('Analyzing task #' + taskIdStr);

    // Check cache
    const cached = this.taskCache.get(task.taskId);
    if (cached) {
      return cached;
    }

    const valueScore = this.calculateTaskValue(task);
    const estimatedROI = this.calculateTaskROI(task);
    const risks = this.identifyTaskRisks(task);
    const requiredCapabilities = this.extractRequiredCapabilities(task);
    const capabilityMatch = this.checkCapabilityMatch(agentCapabilities, requiredCapabilities);
    const recommendation = this.generateTaskRecommendation(valueScore, capabilityMatch, risks);
    const confidence = this.calculateTaskConfidence(valueScore, capabilityMatch);

    const analysis: TaskAnalysis = {
      task,
      valueScore,
      recommendation,
      confidence,
      estimatedROI,
      risks,
      requiredCapabilities,
    };

    // Cache result
    this.taskCache.set(task.taskId, analysis);

    this.logger.info('Task analysis: ' + recommendation + ' (value: ' + valueScore + '/10)');
    return analysis;
  }

  private calculateTaskValue(task: TaskInfo): number {
    const reward = BigInt(task.reward);
    const baseValue = Number(reward) / 1e18; // Normalize to HAVEN

    // Cap at 10
    return Math.min(10, baseValue);
  }

  private calculateTaskROI(task: TaskInfo): number {
    // Simplified ROI calculation
    // In production, consider:
    // - Gas costs
    // - Time investment
    // - Opportunity cost
    // - Reputation rewards

    const reward = BigInt(task.reward);
    const estimatedGasCost = 10000000000000000n; // 0.01 AVAX estimate

    if (reward <= estimatedGasCost) return -100;

    return Number((reward - estimatedGasCost) * 100n / reward);
  }

  private identifyTaskRisks(_task: TaskInfo): string[] {
    const risks: string[] = [];

    risks.push('Task completion uncertainty');
    risks.push('Potential for dispute');

    return risks;
  }

  private extractRequiredCapabilities(task: TaskInfo): string[] {
    // In production, parse task requirements
    // For now, return generic capabilities
    return ['execution', 'reporting'];
  }

  private checkCapabilityMatch(agent: string[], required: string[]): number {
    if (required.length === 0) return 1.0;

    const matched = required.filter(cap => agent.includes(cap)).length;
    return matched / required.length;
  }

  private generateTaskRecommendation(
    valueScore: number,
    capabilityMatch: number,
    risks: string[]
  ): 'accept' | 'decline' {
    if (valueScore >= 6 && capabilityMatch >= 0.7 && risks.length <= 2) {
      return 'accept';
    }
    return 'decline';
  }

  private calculateTaskConfidence(valueScore: number, capabilityMatch: number): number {
    return Math.min(0.9, (valueScore / 10) * 0.5 + capabilityMatch * 0.5);
  }

  // ==================== DECISION SUPPORT ====================

  /**
   * Get current decision context
   */
  getCurrentContext(): Context | undefined {
    return this.oodaLoop.getStatus().currentContext;
  }

  /**
   * Get latest decision
   */
  getCurrentDecision(): Decision | undefined {
    return this.oodaLoop.getStatus().currentDecision;
  }

  /**
   * Get recent experiences
   */
  getRecentExperiences(_limit: number = 10): Experience[] {
    // In production, query experience store
    return [];
  }

  /**
   * Clear analysis caches
   */
  clearCache(): void {
    this.proposalCache.clear();
    this.taskCache.clear();
    this.logger.debug('Analysis cache cleared');
  }

  /**
   * Get reasoning metrics
   */
  getMetrics(): {
    totalDecisions: number;
    averageConfidence: number;
    successRate: number;
    averageCycleTime: number;
  } {
    // In production, track and calculate real metrics
    return {
      totalDecisions: 0,
      averageConfidence: 0,
      successRate: 0,
      averageCycleTime: 0,
    };
  }
}
