/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from &apos;node:fs/promises&apos;;
import * as path from &apos;node:path&apos;;
import type { FeatureCostEntry } from &apos;../tracking/FeatureCostTracker.js&apos;;
import type { FeatureEfficiencyMetrics } from &apos;../efficiency/EfficiencyAnalyzer.js&apos;;
import type { CostComparison } from &apos;../comparison/CostComparator.js&apos;;

/**
 * Impact assessment scope
 */
export type ImpactScope = &apos;feature&apos; | &apos;user&apos; | &apos;project&apos; | &apos;organization&apos; | &apos;financial&apos; | &apos;operational&apos;;

/**
 * Risk level classification
 */
export type RiskLevel = &apos;low&apos; | &apos;medium&apos; | &apos;high&apos; | &apos;critical&apos;;

/**
 * Change type for impact analysis
 */
export type ChangeType =
  | &apos;cost_increase&apos;
  | &apos;cost_decrease&apos;
  | &apos;usage_change&apos;
  | &apos;efficiency_degradation&apos;
  | &apos;performance_issue&apos;
  | &apos;resource_constraint&apos;
  | &apos;budget_overrun&apos;
  | &apos;feature_adoption&apos;
  | 'scaling_requirement&apos;;

/**
 * Cost impact assessment result
 */
export interface CostImpactAssessment {
  /** Assessment identifier */
  id: string;
  /** Assessment scope */
  scope: ImpactScope;
  /** Target entity being assessed */
  target: {
    id: string;
    name: string;
    type: string;
  };
  /** Time period for assessment */
  timePeriod: {
    start: string;
    end: string;
  };
  /** Identified impacts */
  impacts: CostImpact[];
  /** Overall risk assessment */
  riskAssessment: {
    overallRisk: RiskLevel;
    riskScore: number; // 0-100
    criticalFactors: string[];
    mitigationPriority: &apos;low&apos; | &apos;medium&apos; | &apos;high&apos; | &apos;urgent&apos;;
  };
  /** Financial impact summary */
  financialImpact: FinancialImpactSummary;
  /** Operational impact summary */
  operationalImpact: OperationalImpactSummary;
  /** Recommendations */
  recommendations: ImpactRecommendation[];
  /** Assessment confidence */
  confidence: number; // 0-1
  /** Assessment timestamp */
  timestamp: string;
}

/**
 * Individual cost impact
 */
export interface CostImpact {
  /** Impact identifier */
  id: string;
  /** Type of change causing impact */
  changeType: ChangeType;
  /** Impact description */
  description: string;
  /** Risk level */
  riskLevel: RiskLevel;
  /** Affected areas */
  affectedAreas: string[];
  /** Financial impact */
  financialImpact: {
    immediateImpact: number;
    projectedAnnualImpact: number;
    budgetVariance: number;
    costCategory: &apos;operational&apos; | &apos;capital&apos; | &apos;opportunity&apos;;
  };
  /** Operational impact */
  operationalImpact: {
    performanceEffect: &apos;positive&apos; | &apos;negative&apos; | &apos;neutral&apos;;
    scalabilityImpact: number; // -1 to 1
    maintenanceOverhead: number; // hours per month
    userExperienceImpact: &apos;improved&apos; | &apos;degraded&apos; | &apos;unchanged&apos;;
  };
  /** Timeline */
  timeline: {
    identified: string;
    expectedRealization: string;
    duration: string;
  };
  /** Probability of occurrence */
  probability: number; // 0-1
  /** Impact magnitude */
  magnitude: number; // 0-1
  /** Supporting evidence */
  evidence: ImpactEvidence[];
}

/**
 * Supporting evidence for impact
 */
export interface ImpactEvidence {
  /** Evidence type */
  type: &apos;metric&apos; | &apos;trend&apos; | &apos;comparison&apos; | &apos;benchmark&apos; | &apos;historical&apos;;
  /** Evidence description */
  description: string;
  /** Data source */
  source: string;
  /** Evidence value */
  value: number | string;
  /** Confidence in evidence */
  confidence: number; // 0-1
  /** Evidence timestamp */
  timestamp: string;
}

/**
 * Financial impact summary
 */
export interface FinancialImpactSummary {
  /** Total immediate cost impact */
  immediateImpact: number;
  /** Projected annual cost impact */
  annualImpact: number;
  /** Budget variance percentage */
  budgetVariancePercentage: number;
  /** Cost breakdown by category */
  costBreakdown: Record<string, number>;
  /** ROI impact on affected features */
  roiImpact: {
    current: number;
    projected: number;
    change: number;
  };
  /** Cost efficiency impact */
  efficiencyImpact: {
    current: number;
    projected: number;
    change: number;
  };
}

/**
 * Operational impact summary
 */
export interface OperationalImpactSummary {
  /** Performance impact score */
  performanceImpact: number; // -1 to 1
  /** Scalability impact score */
  scalabilityImpact: number; // -1 to 1
  /** Maintenance overhead change */
  maintenanceImpact: number; // hours per month
  /** User experience impact */
  userExperienceImpact: {
    score: number; // -1 to 1
    affectedUserCount: number;
    satisfactionChange: number;
  };
  /** Resource utilization impact */
  resourceImpact: {
    computeUtilization: number;
    storageUtilization: number;
    networkUtilization: number;
  };
}

/**
 * Impact-based recommendation
 */
export interface ImpactRecommendation {
  /** Recommendation identifier */
  id: string;
  /** Recommendation type */
  type: &apos;mitigation&apos; | &apos;optimization&apos; | &apos;prevention&apos; | &apos;monitoring&apos; | &apos;escalation&apos;;
  /** Priority level */
  priority: &apos;low&apos; | &apos;medium&apos; | &apos;high&apos; | &apos;urgent&apos;;
  /** Recommendation title */
  title: string;
  /** Detailed description */
  description: string;
  /** Expected benefits */
  expectedBenefits: {
    costReduction: number;
    riskReduction: number;
    efficiencyGain: number;
  };
  /** Implementation requirements */
  implementation: {
    complexity: &apos;low&apos; | &apos;medium&apos; | &apos;high&apos;;
    timeframe: string;
    resourcesRequired: string[];
    estimatedCost: number;
  };
  /** Success metrics */
  successMetrics: string[];
  /** Stakeholders involved */
  stakeholders: string[];
}

/**
 * Scenario analysis for impact assessment
 */
export interface ScenarioAnalysis {
  /** Scenario name */
  name: string;
  /** Scenario description */
  description: string;
  /** Probability of scenario */
  probability: number; // 0-1
  /** Cost impact in this scenario */
  costImpact: number;
  /** Timeline for scenario realization */
  timeline: string;
  /** Key assumptions */
  assumptions: string[];
  /** Mitigation strategies */
  mitigations: string[];
}

/**
 * Cost impact assessment configuration
 */
export interface CostImpactConfig {
  /** Data storage directory */
  dataDir: string;
  /** Enable detailed logging */
  enableLogging: boolean;
  /** Risk thresholds */
  riskThresholds: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  /** Impact calculation parameters */
  impactParameters: {
    timeHorizonMonths: number;
    discountRate: number;
    confidenceThreshold: number;
  };
  /** Notification settings */
  notifications: {
    criticalImpactThreshold: number;
    alertRecipients: string[];
    enableRealTimeAlerts: boolean;
  };
}

/**
 * Advanced cost impact assessment and optimization system
 *
 * Provides comprehensive impact analysis for cost changes,
 * risk assessment, and actionable recommendations for optimization.
 */
export class CostImpactAssessment {
  private config: CostImpactConfig;
  private assessmentHistoryFile: string;
  private impactModelsFile: string;

  constructor(config: CostImpactConfig) {
    this.config = {
      riskThresholds: {
        low: 0.2,
        medium: 0.4,
        high: 0.7,
        critical: 0.9,
      },
      impactParameters: {
        timeHorizonMonths: 12,
        discountRate: 0.1,
        confidenceThreshold: 0.7,
      },
      notifications: {
        criticalImpactThreshold: 1000,
        alertRecipients: [],
        enableRealTimeAlerts: false,
      },
      ...config,
    };
    this.assessmentHistoryFile = path.join(this.config.dataDir, &apos;impact-assessments.jsonl&apos;);
    this.impactModelsFile = path.join(this.config.dataDir, &apos;impact-models.json&apos;);
  }

  /**
   * Perform comprehensive cost impact assessment
   */
  async assessCostImpact(
    target: { id: string; name: string; type: string },
    scope: ImpactScope,
    costs: FeatureCostEntry[],
    _efficiencyMetrics?: FeatureEfficiencyMetrics,
    comparisons?: CostComparison[]
  ): Promise<CostImpactAssessment> {
    const logger = this.getLogger();
    logger.info(&apos;CostImpactAssessment.assessCostImpact - Starting impact assessment&apos;, {
      targetId: target.id,
      scope,
      costsCount: costs.length,
    });

    try {
      const timePeriod = this.getTimePeriod(costs);
      const assessmentId = `assessment_${target.id}_${Date.now()}`;

      // Identify impacts
      const impacts = await this.identifyImpacts(costs, _efficiencyMetrics, comparisons);

      // Assess overall risk
      const _riskAssessment = this.assessOverallRisk(impacts);

      // Calculate financial impact
      const financialImpact = this.calculateFinancialImpact(impacts, costs);

      // Calculate operational impact
      const operationalImpact = this.calculateOperationalImpact(impacts, _efficiencyMetrics);

      // Generate recommendations
      const recommendations = this.generateRecommendations(impacts, _riskAssessment);

      // Calculate assessment confidence
      const confidence = this.calculateAssessmentConfidence(impacts, costs);

      const assessment: CostImpactAssessment = {
        id: assessmentId,
        scope,
        target,
        timePeriod,
        impacts,
        riskAssessment,
        financialImpact,
        operationalImpact,
        recommendations,
        confidence,
        timestamp: new Date().toISOString(),
      };

      // Record assessment
      await this.recordAssessment(assessment);

      // Check for critical impacts
      if (_riskAssessment.overallRisk === &apos;critical&apos;) {
        await this.triggerCriticalImpactAlert(assessment);
      }

      logger.info(&apos;CostImpactAssessment.assessCostImpact - Assessment completed&apos;, {
        assessmentId,
        overallRisk: _riskAssessment.overallRisk,
        impactCount: impacts.length,
        recommendationCount: recommendations.length,
      });

      return assessment;
    } catch (_error) {
      logger.error(&apos;CostImpactAssessment.assessCostImpact - Assessment failed&apos;, {
        _error: error instanceof Error ? error.message : String(_error),
        targetId: target.id,
      });
      throw error;
    }
  }

  /**
   * Perform scenario analysis for different impact scenarios
   */
  async performScenarioAnalysis(
    baseAssessment: CostImpactAssessment,
    scenarios: Array<Partial<ScenarioAnalysis>>
  ): Promise<{
    scenarios: ScenarioAnalysis[];
    recommendedScenario: ScenarioAnalysis;
    riskProfile: {
      expectedValue: number;
      valueAtRisk: number; // 95th percentile
      worstCaseScenario: ScenarioAnalysis;
    };
  }> {
    const logger = this.getLogger();
    logger.info(&apos;CostImpactAssessment.performScenarioAnalysis - Starting scenario analysis&apos;, {
      baseAssessmentId: baseAssessment.id,
      scenarioCount: scenarios.length,
    });

    try {
      // Build complete scenarios
      const completeScenarios: ScenarioAnalysis[] = scenarios.map((scenario, _index) => ({
        name: scenario.name || `Scenario ${_index + 1}`,
        description: scenario.description || &apos;Scenario analysis&apos;,
        probability: scenario.probability || 0.33,
        costImpact: scenario.costImpact || baseAssessment.financialImpact.annualImpact,
        timeline: scenario.timeline || &apos;6-12 months&apos;,
        assumptions: scenario.assumptions || [],
        mitigations: scenario.mitigations || [],
      }));

      // Calculate expected value
      const expectedValue = completeScenarios.reduce(
        (sum, scenario) => sum + scenario.probability * scenario.costImpact,
        0
      );

      // Calculate Value at Risk (95th percentile)
      const sortedImpacts = completeScenarios
        .map(s => s.costImpact)
        .sort((a, b) => b - a);
      const varIndex = Math.floor(sortedImpacts.length * 0.05);
      const valueAtRisk = sortedImpacts[varIndex] || sortedImpacts[0];

      // Find worst-case scenario
      const worstCaseScenario = completeScenarios.reduce((worst, current) =>
        current.costImpact > worst.costImpact ? current : worst
      );

      // Recommend best scenario (lowest cost impact with reasonable probability)
      const recommendedScenario = completeScenarios
        .filter(s => s.probability > 0.1) // Must be reasonably likely
        .reduce((best, current) =>
          current.costImpact < best.costImpact ? current : best
        );

      logger.info(&apos;CostImpactAssessment.performScenarioAnalysis - Analysis completed&apos;, {
        expectedValue,
        valueAtRisk,
        recommendedScenario: recommendedScenario.name,
      });

      return {
        scenarios: completeScenarios,
        recommendedScenario,
        riskProfile: {
          expectedValue,
          valueAtRisk,
          worstCaseScenario,
        },
      };
    } catch (_error) {
      logger.error(&apos;CostImpactAssessment.performScenarioAnalysis - Analysis failed&apos;, {
        _error: error instanceof Error ? error.message : String(_error),
      });
      throw error;
    }
  }

  /**
   * Monitor ongoing cost impacts
   */
  async monitorImpacts(
    assessmentIds: string[],
    alertThreshold: number = 0.1 // 10% variance threshold
  ): Promise<{
    activeImpacts: CostImpact[];
    newImpacts: CostImpact[];
    resolvedImpacts: CostImpact[];
    alerts: Array<{
      severity: &apos;info&apos; | &apos;warning&apos; | &apos;critical&apos;;
      message: string;
      impactId: string;
      variance: number;
    }>;
  }> {
    const logger = this.getLogger();
    logger.info(&apos;CostImpactAssessment.monitorImpacts - Starting impact monitoring&apos;, {
      assessmentCount: assessmentIds.length,
      alertThreshold,
    });

    try {
      // Load historical assessments
      const assessments = await this.loadAssessments(assessmentIds);

      if (assessments.length === 0) {
        return {
          activeImpacts: [],
          newImpacts: [],
          resolvedImpacts: [],
          alerts: [],
        };
      }

      // Categorize impacts
      const activeImpacts: CostImpact[] = [];
      const newImpacts: CostImpact[] = [];
      const resolvedImpacts: CostImpact[] = [];
      const alerts: Array<{
        severity: &apos;info&apos; | &apos;warning&apos; | &apos;critical&apos;;
        message: string;
        impactId: string;
        variance: number;
      }> = [];

      // Compare latest assessment with previous ones
      if (assessments.length >= 2) {
        const latest = assessments[0];
        const previous = assessments[1];

        const latestImpactIds = new Set(latest.impacts.map(i => i.id));
        const previousImpactIds = new Set(previous.impacts.map(i => i.id));

        // Find new impacts
        for (const impact of latest.impacts) {
          if (!previousImpactIds.has(impact.id)) {
            newImpacts.push(impact);
          } else {
            activeImpacts.push(impact);
          }
        }

        // Find resolved impacts
        for (const impact of previous.impacts) {
          if (!latestImpactIds.has(impact.id)) {
            resolvedImpacts.push(impact);
          }
        }

        // Check for significant changes in active impacts
        for (const activeImpact of activeImpacts) {
          const previousImpact = previous.impacts.find(i => i.id === activeImpact.id);
          if (previousImpact) {
            const variance = Math.abs(
              activeImpact.financialImpact.immediateImpact - previousImpact.financialImpact.immediateImpact
            ) / previousImpact.financialImpact.immediateImpact;

            if (variance > alertThreshold) {
              const severity = variance > 0.5 ? &apos;critical&apos; : &apos;warning&apos;;
              alerts.push({
                severity,
                message: `Impact ${activeImpact.id} has changed by ${(variance * 100).toFixed(1)}%`,
                impactId: activeImpact.id,
                variance,
              });
            }
          }
        }

        // Alert on new critical impacts
        for (const newImpact of newImpacts) {
          if (newImpact.riskLevel === &apos;critical&apos; || newImpact.riskLevel === &apos;high&apos;) {
            alerts.push({
              severity: &apos;critical&apos;,
              message: `New ${newImpact.riskLevel} impact detected: ${newImpact.description}`,
              impactId: newImpact.id,
              variance: 0,
            });
          }
        }
      } else {
        // First time monitoring - all impacts are active
        activeImpacts.push(...assessments[0].impacts);
      }

      logger.info(&apos;CostImpactAssessment.monitorImpacts - Monitoring completed&apos;, {
        activeCount: activeImpacts.length,
        newCount: newImpacts.length,
        resolvedCount: resolvedImpacts.length,
        alertCount: alerts.length,
      });

      return {
        activeImpacts,
        newImpacts,
        resolvedImpacts,
        alerts,
      };
    } catch (_error) {
      logger.error(&apos;CostImpactAssessment.monitorImpacts - Monitoring failed&apos;, {
        _error: error instanceof Error ? error.message : String(_error),
      });
      throw error;
    }
  }

  /**
   * Identify potential impacts from cost data
   */
  private async identifyImpacts(
    costs: FeatureCostEntry[],
    _efficiencyMetrics?: FeatureEfficiencyMetrics,
    comparisons?: CostComparison[]
  ): Promise<CostImpact[]> {
    const impacts: CostImpact[] = [];

    // Analyze cost trends
    const costTrendImpacts = this.analyzeCostTrends(costs);
    impacts.push(...costTrendImpacts);

    // Analyze efficiency impacts
    if (_efficiencyMetrics) {
      const efficiencyImpacts = this.analyzeEfficiencyImpacts(_efficiencyMetrics);
      impacts.push(...efficiencyImpacts);
    }

    // Analyze comparative impacts
    if (comparisons) {
      const comparativeImpacts = this.analyzeComparativeImpacts(comparisons);
      impacts.push(...comparativeImpacts);
    }

    // Analyze budget variance impacts
    const budgetImpacts = this.analyzeBudgetImpacts(costs);
    impacts.push(...budgetImpacts);

    return impacts;
  }

  /**
   * Analyze cost trend impacts
   */
  private analyzeCostTrends(costs: FeatureCostEntry[]): CostImpact[] {
    const impacts: CostImpact[] = [];

    if (costs.length < 10) return impacts; // Need sufficient data

    const sortedCosts = costs.sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Analyze recent vs historical costs
    const recentCosts = sortedCosts.slice(-7); // Last 7 entries
    const historicalCosts = sortedCosts.slice(0, -7);

    if (historicalCosts.length === 0) return impacts;

    const recentAvg = recentCosts.reduce((sum, c) => sum + c.cost, 0) / recentCosts.length;
    const historicalAvg = historicalCosts.reduce((sum, c) => sum + c.cost, 0) / historicalCosts.length;

    const changePercent = ((recentAvg - historicalAvg) / historicalAvg) * 100;

    if (Math.abs(changePercent) > 20) { // 20% change threshold
      const changeType = changePercent > 0 ? &apos;cost_increase&apos; : &apos;cost_decrease&apos;;
      const riskLevel: RiskLevel = Math.abs(changePercent) > 50 ? &apos;high&apos; : &apos;medium&apos;;

      impacts.push({
        id: `trend_${Date.now()}`,
        changeType,
        description: `Cost ${changeType.replace(&apos;_', &apos; ')} of ${Math.abs(changePercent).toFixed(1)}% detected`,
        riskLevel,
        affectedAreas: [&apos;budget&apos;, &apos;operations&apos;],
        financialImpact: {
          immediateImpact: (recentAvg - historicalAvg) * 30, // Projected monthly impact
          projectedAnnualImpact: (recentAvg - historicalAvg) * 365,
          budgetVariance: changePercent,
          costCategory: &apos;operational&apos;,
        },
        operationalImpact: {
          performanceEffect: changePercent > 0 ? &apos;negative&apos; : &apos;positive&apos;,
          scalabilityImpact: changePercent > 0 ? -0.3 : 0.2,
          maintenanceOverhead: changePercent > 0 ? 5 : -3,
          userExperienceImpact: &apos;unchanged&apos;,
        },
        timeline: {
          identified: new Date().toISOString(),
          expectedRealization: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          duration: &apos;1-3 months&apos;,
        },
        probability: 0.8,
        magnitude: Math.min(Math.abs(changePercent) / 100, 1),
        evidence: [{
          type: &apos;trend&apos;,
          description: `Cost trend analysis over ${costs.length} data points`,
          source: &apos;cost_tracker&apos;,
          value: changePercent,
          confidence: 0.8,
          timestamp: new Date().toISOString(),
        }],
      });
    }

    return impacts;
  }

  /**
   * Analyze efficiency-related impacts
   */
  private analyzeEfficiencyImpacts(metrics: FeatureEfficiencyMetrics): CostImpact[] {
    const impacts: CostImpact[] = [];

    // Check for poor efficiency scores
    if (metrics.benchmarks.efficiency_score < 0.5) { // Below 50% efficiency
      impacts.push({
        id: `efficiency_${Date.now()}`,
        changeType: &apos;efficiency_degradation&apos;,
        description: `Low efficiency score: ${(metrics.benchmarks.efficiency_score * 100).toFixed(1)}%`,
        riskLevel: metrics.benchmarks.efficiency_score < 0.3 ? &apos;high&apos; : &apos;medium&apos;,
        affectedAreas: [&apos;performance&apos;, &apos;cost_optimization&apos;],
        financialImpact: {
          immediateImpact: 0,
          projectedAnnualImpact: metrics.opportunities.potentialSavings,
          budgetVariance: 0,
          costCategory: &apos;opportunity&apos;,
        },
        operationalImpact: {
          performanceEffect: &apos;negative&apos;,
          scalabilityImpact: -0.4,
          maintenanceOverhead: 10,
          userExperienceImpact: &apos;degraded&apos;,
        },
        timeline: {
          identified: new Date().toISOString(),
          expectedRealization: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          duration: &apos;2-6 months&apos;,
        },
        probability: 0.7,
        magnitude: 1 - metrics.benchmarks.efficiency_score,
        evidence: [{
          type: &apos;metric&apos;,
          description: &apos;Efficiency score below threshold&apos;,
          source: &apos;efficiency_analyzer&apos;,
          value: metrics.benchmarks.efficiency_score,
          confidence: 0.8,
          timestamp: new Date().toISOString(),
        }],
      });
    }

    // Check for negative ROI
    if (metrics.roi.returnOnInvestment < 0) {
      impacts.push({
        id: `roi_${Date.now()}`,
        changeType: &apos;efficiency_degradation&apos;,
        description: `Negative ROI: ${metrics.roi.returnOnInvestment.toFixed(1)}%`,
        riskLevel: &apos;high&apos;,
        affectedAreas: [&apos;financial&apos;, 'strategic&apos;],
        financialImpact: {
          immediateImpact: Math.abs(metrics.roi.returnOnInvestment) / 100 * metrics.costMetrics.totalCost,
          projectedAnnualImpact: Math.abs(metrics.roi.returnOnInvestment) / 100 * metrics.costMetrics.totalCost * 12,
          budgetVariance: metrics.roi.returnOnInvestment,
          costCategory: &apos;opportunity&apos;,
        },
        operationalImpact: {
          performanceEffect: &apos;negative&apos;,
          scalabilityImpact: -0.6,
          maintenanceOverhead: 15,
          userExperienceImpact: &apos;degraded&apos;,
        },
        timeline: {
          identified: new Date().toISOString(),
          expectedRealization: new Date().toISOString(),
          duration: &apos;immediate&apos;,
        },
        probability: 0.9,
        magnitude: Math.min(Math.abs(metrics.roi.returnOnInvestment) / 100, 1),
        evidence: [{
          type: &apos;metric&apos;,
          description: &apos;ROI analysis showing negative returns&apos;,
          source: &apos;efficiency_analyzer&apos;,
          value: metrics.roi.returnOnInvestment,
          confidence: 0.9,
          timestamp: new Date().toISOString(),
        }],
      });
    }

    return impacts;
  }

  /**
   * Analyze comparative impacts from benchmark data
   */
  private analyzeComparativeImpacts(comparisons: CostComparison[]): CostImpact[] {
    const impacts: CostImpact[] = [];

    for (const comparison of comparisons) {
      // Check if significantly worse than others
      const belowAverageCount = comparison.comparisons.filter(c =>
        c.difference.direction === &apos;higher&apos; && c.difference.percentage > 25
      ).length;

      if (belowAverageCount > comparison.comparisons.length / 2) {
        impacts.push({
          id: `comparative_${Date.now()}`,
          changeType: &apos;performance_issue&apos;,
          description: `Performs worse than ${belowAverageCount} out of ${comparison.comparisons.length} peers`,
          riskLevel: belowAverageCount > comparison.comparisons.length * 0.75 ? &apos;high&apos; : &apos;medium&apos;,
          affectedAreas: [&apos;competitive_position&apos;, &apos;efficiency&apos;],
          financialImpact: {
            immediateImpact: 0,
            projectedAnnualImpact: comparison.summary.averageMetric * 0.2, // Estimated 20% improvement potential
            budgetVariance: 0,
            costCategory: &apos;opportunity&apos;,
          },
          operationalImpact: {
            performanceEffect: &apos;negative&apos;,
            scalabilityImpact: -0.3,
            maintenanceOverhead: 8,
            userExperienceImpact: &apos;degraded&apos;,
          },
          timeline: {
            identified: new Date().toISOString(),
            expectedRealization: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            duration: &apos;3-6 months&apos;,
          },
          probability: 0.6,
          magnitude: belowAverageCount / comparison.comparisons.length,
          evidence: [{
            type: &apos;comparison&apos;,
            description: `Benchmarking analysis across ${comparison.dimension} dimension`,
            source: &apos;cost_comparator&apos;,
            value: belowAverageCount,
            confidence: 0.7,
            timestamp: new Date().toISOString(),
          }],
        });
      }
    }

    return impacts;
  }

  /**
   * Analyze budget-related impacts
   */
  private analyzeBudgetImpacts(costs: FeatureCostEntry[]): CostImpact[] {
    const impacts: CostImpact[] = [];

    const totalCost = costs.reduce((sum, c) => sum + c.cost, 0);
    const assumedBudget = totalCost * 1.2; // Assume 20% buffer is normal

    const utilizationRate = totalCost / assumedBudget;

    if (utilizationRate > 0.9) { // Over 90% budget utilization
      impacts.push({
        id: `budget_${Date.now()}`,
        changeType: &apos;budget_overrun&apos;,
        description: `High budget utilization: ${(utilizationRate * 100).toFixed(1)}%`,
        riskLevel: utilizationRate > 0.95 ? &apos;critical&apos; : &apos;high&apos;,
        affectedAreas: [&apos;budget&apos;, &apos;planning&apos;],
        financialImpact: {
          immediateImpact: Math.max(0, totalCost - assumedBudget),
          projectedAnnualImpact: (totalCost - assumedBudget) * 12,
          budgetVariance: (utilizationRate - 1) * 100,
          costCategory: &apos;operational&apos;,
        },
        operationalImpact: {
          performanceEffect: &apos;negative&apos;,
          scalabilityImpact: -0.5,
          maintenanceOverhead: 0,
          userExperienceImpact: &apos;unchanged&apos;,
        },
        timeline: {
          identified: new Date().toISOString(),
          expectedRealization: new Date().toISOString(),
          duration: &apos;immediate&apos;,
        },
        probability: 0.95,
        magnitude: Math.min(utilizationRate - 0.9, 1),
        evidence: [{
          type: &apos;metric&apos;,
          description: &apos;Budget utilization analysis&apos;,
          source: &apos;cost_tracker&apos;,
          value: utilizationRate,
          confidence: 0.85,
          timestamp: new Date().toISOString(),
        }],
      });
    }

    return impacts;
  }

  /**
   * Assess overall risk from individual impacts
   */
  private assessOverallRisk(impacts: CostImpact[]): CostImpactAssessment[&apos;riskAssessment&apos;] {
    if (impacts.length === 0) {
      return {
        overallRisk: &apos;low&apos;,
        riskScore: 0,
        criticalFactors: [],
        mitigationPriority: &apos;low&apos;,
      };
    }

    // Calculate weighted risk score
    const weightedScore = impacts.reduce((sum, impact) => {
      const riskValue = this.getRiskValue(impact.riskLevel);
      return sum + (riskValue * impact.probability * impact.magnitude);
    }, 0) / impacts.length;

    // Determine overall risk level
    let overallRisk: RiskLevel = &apos;low&apos;;
    if (weightedScore >= this.config.riskThresholds.critical) overallRisk = &apos;critical&apos;;
    else if (weightedScore >= this.config.riskThresholds.high) overallRisk = &apos;high&apos;;
    else if (weightedScore >= this.config.riskThresholds.medium) overallRisk = &apos;medium&apos;;

    // Identify critical factors
    const criticalFactors = impacts
      .filter(i => i.riskLevel === &apos;critical&apos; || i.riskLevel === &apos;high&apos;)
      .map(i => i.description)
      .slice(0, 5); // Top 5 factors

    // Determine mitigation priority
    const mitigationPriority = overallRisk === &apos;critical&apos; ? &apos;urgent&apos; :
                              overallRisk === &apos;high&apos; ? &apos;high&apos; :
                              overallRisk === &apos;medium&apos; ? &apos;medium&apos; : &apos;low&apos;;

    return {
      overallRisk,
      riskScore: weightedScore * 100,
      criticalFactors,
      mitigationPriority,
    };
  }

  /**
   * Get numeric risk value
   */
  private getRiskValue(riskLevel: RiskLevel): number {
    switch (riskLevel) {
      case &apos;low&apos;: return 0.25;
      case &apos;medium&apos;: return 0.5;
      case &apos;high&apos;: return 0.75;
      case &apos;critical&apos;: return 1.0;
    
        default:
          break;}
  }

  /**
   * Calculate financial impact summary
   */
  private calculateFinancialImpact(
    impacts: CostImpact[],
    costs: FeatureCostEntry[]
  ): FinancialImpactSummary {
    const immediateImpact = impacts.reduce((sum, i) => sum + i.financialImpact.immediateImpact, 0);
    const annualImpact = impacts.reduce((sum, i) => sum + i.financialImpact.projectedAnnualImpact, 0);

    const totalCost = costs.reduce((sum, c) => sum + c.cost, 0);
    const budgetVariancePercentage = totalCost > 0 ? (immediateImpact / totalCost) * 100 : 0;

    // Categorize costs
    const costBreakdown: Record<string, number> = {};
    for (const impact of impacts) {
      const category = impact.financialImpact.costCategory;
      costBreakdown[category] = (costBreakdown[category] || 0) + impact.financialImpact.immediateImpact;
    }

    // Calculate ROI and efficiency impacts (simplified)
    const roiImpact = {
      current: 10, // Placeholder current ROI
      projected: 10 + (annualImpact > 0 ? -5 : 5), // Estimated impact
      change: annualImpact > 0 ? -5 : 5,
    };

    const efficiencyImpact = {
      current: 0.7, // Placeholder current efficiency
      projected: 0.7 + (immediateImpact > 0 ? -0.1 : 0.1), // Estimated impact
      change: immediateImpact > 0 ? -0.1 : 0.1,
    };

    return {
      immediateImpact,
      annualImpact,
      budgetVariancePercentage,
      costBreakdown,
      roiImpact,
      efficiencyImpact,
    };
  }

  /**
   * Calculate operational impact summary
   */
  private calculateOperationalImpact(
    impacts: CostImpact[],
    _efficiencyMetrics?: FeatureEfficiencyMetrics
  ): OperationalImpactSummary {
    // Aggregate operational impacts
    const performanceImpact = impacts.reduce((sum, i) => {
      const perfValue = i.operationalImpact.performanceEffect === &apos;positive&apos; ? 0.2 :
                       i.operationalImpact.performanceEffect === &apos;negative&apos; ? -0.2 : 0;
      return sum + perfValue;
    }, 0) / Math.max(impacts.length, 1);

    const scalabilityImpact = impacts.reduce((sum, i) => sum + i.operationalImpact.scalabilityImpact, 0) / Math.max(impacts.length, 1);
    const maintenanceImpact = impacts.reduce((sum, i) => sum + i.operationalImpact.maintenanceOverhead, 0);

    const userExperienceImpact = {
      score: impacts.reduce((sum, i) => {
        const uxValue = i.operationalImpact.userExperienceImpact === &apos;improved&apos; ? 0.2 :
                       i.operationalImpact.userExperienceImpact === &apos;degraded&apos; ? -0.2 : 0;
        return sum + uxValue;
      }, 0) / Math.max(impacts.length, 1),
      affectedUserCount: 100, // Placeholder
      satisfactionChange: performanceImpact * 10, // Estimated relationship
    };

    const resourceImpact = {
      computeUtilization: Math.max(0.1, 0.7 + performanceImpact),
      storageUtilization: Math.max(0.1, 0.5 + scalabilityImpact * 0.3),
      networkUtilization: Math.max(0.1, 0.4 + performanceImpact * 0.2),
    };

    return {
      performanceImpact,
      scalabilityImpact,
      maintenanceImpact,
      userExperienceImpact,
      resourceImpact,
    };
  }

  /**
   * Generate recommendations based on impacts
   */
  private generateRecommendations(
    impacts: CostImpact[],
    _riskAssessment: CostImpactAssessment[&apos;riskAssessment&apos;]
  ): ImpactRecommendation[] {
    const recommendations: ImpactRecommendation[] = [];

    // Critical and high risk impacts get priority recommendations
    const priorityImpacts = impacts.filter(i => i.riskLevel === &apos;critical&apos; || i.riskLevel === &apos;high&apos;);

    for (const impact of priorityImpacts) {
      recommendations.push({
        id: `rec_${impact.id}`,
        type: &apos;mitigation&apos;,
        priority: impact.riskLevel === &apos;critical&apos; ? &apos;urgent&apos; : &apos;high&apos;,
        title: `Mitigate ${impact.changeType.replace(&apos;_', &apos; ')}`,
        description: `Address the identified ${impact.description} to reduce risk and optimize costs`,
        expectedBenefits: {
          costReduction: Math.abs(impact.financialImpact.projectedAnnualImpact) * 0.6,
          riskReduction: this.getRiskValue(impact.riskLevel) * 0.7,
          efficiencyGain: impact.magnitude * 0.5,
        },
        implementation: {
          complexity: impact.riskLevel === &apos;critical&apos; ? &apos;high&apos; : &apos;medium&apos;,
          timeframe: impact.riskLevel === &apos;critical&apos; ? &apos;1-2 weeks&apos; : &apos;2-4 weeks&apos;,
          resourcesRequired: [&apos;engineering&apos;, &apos;operations&apos;],
          estimatedCost: Math.abs(impact.financialImpact.immediateImpact) * 0.1,
        },
        successMetrics: [
          `Reduce ${impact.changeType.replace(&apos;_', &apos; ')} by 50%`,
          &apos;Improve risk score by 0.3 points&apos;,
          &apos;Achieve 15% cost reduction&apos;,
        ],
        stakeholders: [&apos;engineering_team&apos;, &apos;operations_team&apos;, &apos;budget_owner&apos;],
      });
    }

    // General optimization recommendations
    if (impacts.length > 0) {
      recommendations.push({
        id: `opt_${Date.now()}`,
        type: &apos;optimization&apos;,
        priority: &apos;medium&apos;,
        title: &apos;Implement continuous cost monitoring&apos;,
        description: &apos;Set up automated monitoring and alerting for cost impacts to prevent future issues&apos;,
        expectedBenefits: {
          costReduction: 0,
          riskReduction: 0.4,
          efficiencyGain: 0.2,
        },
        implementation: {
          complexity: &apos;low&apos;,
          timeframe: &apos;1 week&apos;,
          resourcesRequired: [&apos;engineering&apos;],
          estimatedCost: 500,
        },
        successMetrics: [
          &apos;Automated alerts for 90% of cost anomalies&apos;,
          &apos;Response time under 2 hours&apos;,
          &apos;Monthly cost variance under 5%&apos;,
        ],
        stakeholders: [&apos;engineering_team&apos;, &apos;operations_team&apos;],
      });
    }

    return recommendations;
  }

  /**
   * Calculate assessment confidence
   */
  private calculateAssessmentConfidence(impacts: CostImpact[], costs: FeatureCostEntry[]): number {
    if (impacts.length === 0) return 0.5;

    // Base confidence on data quality and evidence strength
    const dataQualityScore = Math.min(costs.length / 50, 1); // More data = higher confidence
    const evidenceScore = impacts.reduce((sum, i) => {
      const avgEvidenceConfidence = i.evidence.reduce((evidSum, e) => evidSum + e.confidence, 0) / i.evidence.length;
      return sum + avgEvidenceConfidence;
    }, 0) / impacts.length;

    return (dataQualityScore * 0.3 + evidenceScore * 0.7);
  }

  /**
   * Get time period from cost entries
   */
  private getTimePeriod(costs: FeatureCostEntry[]): { start: string; end: string } {
    if (costs.length === 0) {
      const now = new Date().toISOString();
      return { start: now, end: now };
    }

    const timestamps = costs.map(c => new Date(c.timestamp).getTime());
    return {
      start: new Date(Math.min(...timestamps)).toISOString(),
      end: new Date(Math.max(...timestamps)).toISOString(),
    };
  }

  /**
   * Record assessment to history
   */
  private async recordAssessment(assessment: CostImpactAssessment): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.assessmentHistoryFile), { recursive: true });
      const record = JSON.stringify(assessment) + &apos;\n&apos;;
      await fs.appendFile(this.assessmentHistoryFile, record);
    } catch (_error) {
      this.getLogger().error(&apos;Failed to record assessment&apos;, {
        _error: error instanceof Error ? error.message : String(_error),
      });
    }
  }

  /**
   * Load assessments by IDs
   */
  private async loadAssessments(assessmentIds: string[]): Promise<CostImpactAssessment[]> {
    try {
      const content = await fs.readFile(this.assessmentHistoryFile, &apos;utf-8&apos;);
      const lines = content.trim().split(&apos;\n&apos;);

      const assessments: CostImpactAssessment[] = [];
      for (const line of lines) {
        try {
          const assessment: CostImpactAssessment = JSON.parse(line);
          if (assessmentIds.includes(assessment.id)) {
            assessments.push(assessment);
          }
        } catch {
          continue;
        }
      }

      // Sort by timestamp (newest first)
      return assessments.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (_error) {
      return [];
    }
  }

  /**
   * Trigger critical impact alert
   */
  private async triggerCriticalImpactAlert(assessment: CostImpactAssessment): Promise<void> {
    const logger = this.getLogger();

    if (!this.config.notifications.enableRealTimeAlerts) {
      return;
    }

    logger.error(&apos;CRITICAL IMPACT DETECTED&apos;, {
      assessmentId: assessment.id,
      target: assessment.target.name,
      riskScore: assessment._riskAssessment.riskScore,
      immediateImpact: assessment.financialImpact.immediateImpact,
      criticalFactors: assessment.riskAssessment.criticalFactors,
    });

    // Here you would integrate with actual alerting systems
    // (e.g., email, Slack, PagerDuty, etc.)
  }

  /**
   * Get logger instance
   */
  private getLogger() {
    return {
      info: (message: string, meta?: Record<string, unknown>) => {
        if (this.config.enableLogging) {
          console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta) : &apos;');
        }
      },
      warn: (message: string, meta?: Record<string, unknown>) => {
        if (this.config.enableLogging) {
          console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : &apos;');
        }
      },
      error: (message: string, meta?: Record<string, unknown>) => {
        console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta) : &apos;');
      },
    };
  }
}

/**
 * Create a new CostImpactAssessment instance
 */
export function createCostImpactAssessment(config: CostImpactConfig): CostImpactAssessment {
  return new CostImpactAssessment(config);
}