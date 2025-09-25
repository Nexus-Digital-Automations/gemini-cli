/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Scenario-based budget allocation planning system
 * Provides scenario generation, impact prediction, and planning tools for budget allocation decisions
 *
 * @author Claude Code - Budget Allocation Agent
 * @version 1.0.0
 */

import type {
  AllocationCandidate,
  AllocationRecommendation,
  AllocationScenario,
  ScenarioOutcome,
  AllocationStrategy,
  AllocationLogger,
} from '../types.js';

/**
 * Scenario planning configuration
 */
export interface ScenarioPlanningConfig {
  /** Scenario generation settings */
  generation: {
    /** Number of scenarios to generate */
    scenarioCount: number;
    /** Scenario diversity factor */
    diversityFactor: number;
    /** Include extreme scenarios */
    includeExtremeScenarios: boolean;
    /** Scenario time horizon */
    timeHorizon: string;
  };
  /** Impact analysis settings */
  impactAnalysis: {
    /** Enable detailed impact analysis */
    enabled: boolean;
    /** Impact metrics to analyze */
    metrics: string[];
    /** Sensitivity analysis depth */
    sensitivityDepth: 'basic' | 'detailed' | 'comprehensive';
  };
  /** Risk assessment settings */
  riskAssessment: {
    /** Enable risk modeling */
    enabled: boolean;
    /** Risk factors to consider */
    riskFactors: string[];
    /** Monte Carlo simulation runs */
    simulationRuns: number;
  };
  /** Optimization settings */
  optimization: {
    /** Optimization objectives */
    objectives: string[];
    /** Constraint handling */
    constraintHandling: 'strict' | 'flexible' | 'adaptive';
    /** Multi-objective optimization method */
    method: 'weighted_sum' | 'pareto_front' | 'goal_programming';
  };
}

/**
 * Scenario generation parameters
 */
export interface ScenarioParameters {
  /** Budget variation range */
  budgetRange: { min: number; max: number };
  /** Performance target variations */
  performanceTargets: Record<string, { min: number; max: number }>;
  /** Market condition scenarios */
  marketConditions: Array<'bull' | 'bear' | 'volatile' | 'stable'>;
  /** Strategic priority shifts */
  priorityShifts: string[];
  /** External constraints */
  externalConstraints: Array<{
    type: string;
    impact: number;
    probability: number;
  }>;
}

/**
 * Scenario analysis result
 */
export interface ScenarioAnalysisResult {
  /** Generated scenarios */
  scenarios: AllocationScenario[];
  /** Comparative analysis */
  comparison: ScenarioComparison;
  /** Recommended scenario */
  recommendedScenario: AllocationScenario;
  /** Risk analysis */
  riskAnalysis: ScenarioRiskAnalysis;
  /** Sensitivity analysis */
  sensitivityAnalysis: SensitivityAnalysisResult;
  /** Implementation roadmap */
  implementationRoadmap: ImplementationRoadmap;
}

/**
 * Scenario comparison metrics
 */
export interface ScenarioComparison {
  /** Performance comparison */
  performance: {
    /** Best performing scenario */
    best: string;
    /** Worst performing scenario */
    worst: string;
    /** Average performance across scenarios */
    average: number;
    /** Performance variance */
    variance: number;
  };
  /** Cost comparison */
  cost: {
    /** Most cost-effective scenario */
    mostEffective: string;
    /** Most expensive scenario */
    mostExpensive: string;
    /** Average cost across scenarios */
    average: number;
    /** Cost variance */
    variance: number;
  };
  /** Risk comparison */
  risk: {
    /** Lowest risk scenario */
    lowest: string;
    /** Highest risk scenario */
    highest: string;
    /** Average risk level */
    average: number;
    /** Risk distribution */
    distribution: Record<string, number>;
  };
  /** ROI comparison */
  roi: {
    /** Highest ROI scenario */
    highest: string;
    /** Lowest ROI scenario */
    lowest: string;
    /** Average ROI */
    average: number;
    /** ROI spread */
    spread: number;
  };
}

/**
 * Scenario risk analysis
 */
export interface ScenarioRiskAnalysis {
  /** Overall portfolio risk */
  portfolioRisk: {
    /** Risk level */
    level: 'low' | 'medium' | 'high' | 'critical';
    /** Risk score */
    score: number;
    /** Key risk factors */
    keyFactors: string[];
  };
  /** Scenario-specific risks */
  scenarioRisks: Array<{
    /** Scenario ID */
    scenarioId: string;
    /** Risk assessment */
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    /** Risk factors */
    factors: string[];
    /** Mitigation strategies */
    mitigations: string[];
  }>;
  /** Correlation risks */
  correlationRisks: Array<{
    /** Risk description */
    description: string;
    /** Affected scenarios */
    affectedScenarios: string[];
    /** Impact severity */
    severity: number;
  }>;
  /** Black swan events */
  blackSwanEvents: Array<{
    /** Event description */
    event: string;
    /** Probability */
    probability: number;
    /** Impact magnitude */
    impact: number;
    /** Scenarios most vulnerable */
    vulnerableScenarios: string[];
  }>;
}

/**
 * Sensitivity analysis result
 */
export interface SensitivityAnalysisResult {
  /** Parameter sensitivity */
  parameterSensitivity: Array<{
    /** Parameter name */
    parameter: string;
    /** Sensitivity coefficient */
    sensitivity: number;
    /** Impact on outcomes */
    impactRange: { min: number; max: number };
    /** Critical thresholds */
    thresholds: number[];
  }>;
  /** Cross-parameter interactions */
  interactions: Array<{
    /** Parameter pair */
    parameters: [string, string];
    /** Interaction strength */
    strength: number;
    /** Interaction type */
    type: 'synergistic' | 'antagonistic' | 'neutral';
  }>;
  /** Robustness analysis */
  robustness: {
    /** Most robust scenario */
    mostRobust: string;
    /** Least robust scenario */
    leastRobust: string;
    /** Robustness scores */
    scores: Record<string, number>;
  };
}

/**
 * Implementation roadmap
 */
export interface ImplementationRoadmap {
  /** Recommended implementation phases */
  phases: ImplementationPhase[];
  /** Critical milestones */
  milestones: Milestone[];
  /** Resource requirements */
  resourceRequirements: ResourceRequirement[];
  /** Risk mitigation plan */
  riskMitigation: RiskMitigationPlan;
  /** Success metrics */
  successMetrics: SuccessMetric[];
}

/**
 * Implementation phase
 */
export interface ImplementationPhase {
  /** Phase identifier */
  id: string;
  /** Phase name */
  name: string;
  /** Phase description */
  description: string;
  /** Phase duration */
  duration: string;
  /** Phase objectives */
  objectives: string[];
  /** Phase deliverables */
  deliverables: string[];
  /** Phase dependencies */
  dependencies: string[];
  /** Phase risks */
  risks: string[];
}

/**
 * Milestone definition
 */
export interface Milestone {
  /** Milestone identifier */
  id: string;
  /** Milestone name */
  name: string;
  /** Target date */
  targetDate: Date;
  /** Success criteria */
  successCriteria: string[];
  /** Verification method */
  verificationMethod: string;
  /** Milestone owner */
  owner: string;
}

/**
 * Resource requirement
 */
export interface ResourceRequirement {
  /** Resource type */
  type: 'human' | 'financial' | 'technical' | 'infrastructure';
  /** Resource description */
  description: string;
  /** Quantity required */
  quantity: number;
  /** Duration needed */
  duration: string;
  /** Criticality */
  criticality: 'low' | 'medium' | 'high' | 'critical';
  /** Alternative options */
  alternatives: string[];
}

/**
 * Risk mitigation plan
 */
export interface RiskMitigationPlan {
  /** Risk mitigation strategies */
  strategies: Array<{
    /** Risk addressed */
    risk: string;
    /** Mitigation strategy */
    strategy: string;
    /** Implementation cost */
    cost: number;
    /** Effectiveness rating */
    effectiveness: number;
  }>;
  /** Contingency plans */
  contingencyPlans: Array<{
    /** Trigger condition */
    trigger: string;
    /** Contingency action */
    action: string;
    /** Resource requirements */
    resources: string[];
  }>;
  /** Monitoring plan */
  monitoring: {
    /** Metrics to monitor */
    metrics: string[];
    /** Monitoring frequency */
    frequency: string;
    /** Alert thresholds */
    thresholds: Record<string, number>;
  };
}

/**
 * Success metric
 */
export interface SuccessMetric {
  /** Metric name */
  name: string;
  /** Metric description */
  description: string;
  /** Target value */
  target: number;
  /** Measurement method */
  measurementMethod: string;
  /** Measurement frequency */
  frequency: string;
  /** Success threshold */
  successThreshold: number;
}

/**
 * Default scenario planning configuration
 */
export const DEFAULT_SCENARIO_CONFIG: ScenarioPlanningConfig = {
  generation: {
    scenarioCount: 5,
    diversityFactor: 0.8,
    includeExtremeScenarios: true,
    timeHorizon: '12 months',
  },
  impactAnalysis: {
    enabled: true,
    metrics: ['cost', 'performance', 'roi', 'risk', 'utilization'],
    sensitivityDepth: 'detailed',
  },
  riskAssessment: {
    enabled: true,
    riskFactors: ['market_volatility', 'technical_risk', 'resource_constraints'],
    simulationRuns: 1000,
  },
  optimization: {
    objectives: ['maximize_roi', 'minimize_cost', 'optimize_performance'],
    constraintHandling: 'adaptive',
    method: 'pareto_front',
  },
};

/**
 * Scenario-based budget allocation planner
 * Provides comprehensive scenario planning and impact analysis
 */
export class ScenarioPlanner {
  private readonly config: ScenarioPlanningConfig;
  private readonly logger: AllocationLogger;

  /**
   * Create scenario planner instance
   * @param config - Planning configuration
   * @param logger - Logger instance
   */
  constructor(
    config: Partial<ScenarioPlanningConfig> = {},
    logger: AllocationLogger
  ) {
    this.config = { ...DEFAULT_SCENARIO_CONFIG, ...config };
    this.logger = logger;
    this.validateConfiguration();
  }

  /**
   * Generate allocation scenarios
   * @param candidates - Resource allocation candidates
   * @param parameters - Scenario generation parameters
   * @returns Generated scenarios
   */
  generateScenarios(
    candidates: AllocationCandidate[],
    parameters: ScenarioParameters
  ): AllocationScenario[] {
    this.logger.info('Generating allocation scenarios', {
      candidateCount: candidates.length,
      scenarioCount: this.config.generation.scenarioCount,
    });

    const scenarios: AllocationScenario[] = [];

    // Generate base scenario (current state optimized)
    scenarios.push(this.generateBaseScenario(candidates, parameters));

    // Generate optimistic scenario
    scenarios.push(this.generateOptimisticScenario(candidates, parameters));

    // Generate pessimistic scenario
    scenarios.push(this.generatePessimisticScenario(candidates, parameters));

    // Generate balanced scenario
    scenarios.push(this.generateBalancedScenario(candidates, parameters));

    // Generate constraint-focused scenario
    scenarios.push(this.generateConstraintScenario(candidates, parameters));

    // Generate additional scenarios based on configuration
    const additionalScenarios = Math.max(0, this.config.generation.scenarioCount - 5);
    for (let i = 0; i < additionalScenarios; i++) {
      scenarios.push(this.generateCustomScenario(candidates, parameters, i));
    }

    this.logger.info('Scenario generation completed', {
      scenarioCount: scenarios.length,
    });

    return scenarios;
  }

  /**
   * Analyze scenarios and provide comparative analysis
   * @param scenarios - Generated scenarios
   * @param candidates - Original candidates
   * @returns Scenario analysis result
   */
  analyzeScenarios(
    scenarios: AllocationScenario[],
    candidates: AllocationCandidate[]
  ): ScenarioAnalysisResult {
    this.logger.info('Starting scenario analysis', {
      scenarioCount: scenarios.length,
    });

    // Perform comparative analysis
    const comparison = this.performComparativeAnalysis(scenarios);

    // Select recommended scenario
    const recommendedScenario = this.selectRecommendedScenario(scenarios, comparison);

    // Analyze risks
    const riskAnalysis = this.analyzeScenarioRisks(scenarios);

    // Perform sensitivity analysis
    const sensitivityAnalysis = this.performSensitivityAnalysis(scenarios, candidates);

    // Generate implementation roadmap
    const implementationRoadmap = this.generateImplementationRoadmap(recommendedScenario);

    const result: ScenarioAnalysisResult = {
      scenarios,
      comparison,
      recommendedScenario,
      riskAnalysis,
      sensitivityAnalysis,
      implementationRoadmap,
    };

    this.logger.info('Scenario analysis completed', {
      recommendedScenario: recommendedScenario.scenarioId,
      riskLevel: riskAnalysis.portfolioRisk.level,
    });

    return result;
  }

  /**
   * Generate what-if analysis for specific parameters
   * @param baseScenario - Base scenario for comparison
   * @param parameterChanges - Parameters to vary
   * @returns What-if analysis results
   */
  generateWhatIfAnalysis(
    baseScenario: AllocationScenario,
    parameterChanges: Record<string, Array<{ parameter: string; value: number }>>
  ): Array<{
    changeDescription: string;
    modifiedScenario: AllocationScenario;
    impact: {
      costDelta: number;
      performanceDelta: number;
      roiDelta: number;
      riskDelta: number;
    };
  }> {
    const results: Array<{
      changeDescription: string;
      modifiedScenario: AllocationScenario;
      impact: {
        costDelta: number;
        performanceDelta: number;
        roiDelta: number;
        riskDelta: number;
      };
    }> = [];

    for (const [changeType, changes] of Object.entries(parameterChanges)) {
      for (const change of changes) {
        const modifiedScenario = this.applyParameterChange(baseScenario, change);
        const impact = this.calculateImpactDelta(baseScenario, modifiedScenario);

        results.push({
          changeDescription: `${changeType}: ${change.parameter} = ${change.value}`,
          modifiedScenario,
          impact,
        });
      }
    }

    return results;
  }

  /**
   * Generate base scenario (current state optimized)
   */
  private generateBaseScenario(
    candidates: AllocationCandidate[],
    parameters: ScenarioParameters
  ): AllocationScenario {
    const allocations: AllocationRecommendation[] = candidates.map(candidate => ({
      resourceId: candidate.resourceId,
      currentAllocation: candidate.currentAllocation,
      recommendedAllocation: candidate.currentAllocation * 1.05, // 5% increase
      allocationChange: candidate.currentAllocation * 0.05,
      strategy: 'usage_based' as AllocationStrategy,
      confidence: 85,
      expectedImpact: {
        costImpact: candidate.currentAllocation * 0.05,
        performanceImpact: 5,
        utilizationImpact: 3,
        businessValueImpact: 8,
        roiImpact: 0.08,
        impactTimeline: 'short_term',
      },
      riskAssessment: {
        riskLevel: 'low',
        riskFactors: ['Minimal change risk'],
        mitigationStrategies: ['Gradual rollout'],
        maxNegativeImpact: candidate.currentAllocation * 0.02,
        negativeProbability: 10,
      },
      dependencies: [],
      type: 'optimization',
      priority: 'medium',
      description: 'Base scenario optimization',
      expectedSavings: 0,
      implementationComplexity: 'low',
      validationCriteria: ['Performance improvement', 'Cost efficiency'],
      rollbackPlan: 'Revert to current allocation',
    }));

    return {
      scenarioId: 'base_scenario',
      scenarioName: 'Base Scenario - Current State Optimized',
      description: 'Optimized version of current allocation with minimal changes',
      totalBudget: parameters.budgetRange.min + (parameters.budgetRange.max - parameters.budgetRange.min) * 0.5,
      allocations,
      expectedOutcomes: this.calculateExpectedOutcomes(allocations),
      timeline: this.config.generation.timeHorizon,
      assumptions: [
        'Current performance trends continue',
        'No major market disruptions',
        'Existing resource capabilities maintained',
      ],
    };
  }

  /**
   * Generate optimistic scenario
   */
  private generateOptimisticScenario(
    candidates: AllocationCandidate[],
    parameters: ScenarioParameters
  ): AllocationScenario {
    const allocations: AllocationRecommendation[] = candidates.map(candidate => ({
      resourceId: candidate.resourceId,
      currentAllocation: candidate.currentAllocation,
      recommendedAllocation: candidate.currentAllocation * 1.3, // 30% increase
      allocationChange: candidate.currentAllocation * 0.3,
      strategy: 'roi_optimized' as AllocationStrategy,
      confidence: 70,
      expectedImpact: {
        costImpact: candidate.currentAllocation * 0.3,
        performanceImpact: 25,
        utilizationImpact: 20,
        businessValueImpact: 35,
        roiImpact: 0.25,
        impactTimeline: 'medium_term',
      },
      riskAssessment: {
        riskLevel: 'medium',
        riskFactors: ['Higher investment risk', 'Performance uncertainty'],
        mitigationStrategies: ['Staged rollout', 'Performance monitoring'],
        maxNegativeImpact: candidate.currentAllocation * 0.15,
        negativeProbability: 25,
      },
      dependencies: [],
      type: 'growth',
      priority: 'high',
      description: 'Optimistic growth scenario',
      expectedSavings: 0,
      implementationComplexity: 'medium',
      validationCriteria: ['ROI achievement', 'Performance targets'],
      rollbackPlan: 'Gradual reduction if targets not met',
    }));

    return {
      scenarioId: 'optimistic_scenario',
      scenarioName: 'Optimistic Growth Scenario',
      description: 'Aggressive growth strategy assuming favorable conditions',
      totalBudget: parameters.budgetRange.max,
      allocations,
      expectedOutcomes: this.calculateExpectedOutcomes(allocations),
      timeline: this.config.generation.timeHorizon,
      assumptions: [
        'Market conditions remain favorable',
        'Performance improvements achieved',
        'Additional budget available',
        'Team capabilities scale effectively',
      ],
    };
  }

  /**
   * Generate pessimistic scenario
   */
  private generatePessimisticScenario(
    candidates: AllocationCandidate[],
    parameters: ScenarioParameters
  ): AllocationScenario {
    const allocations: AllocationRecommendation[] = candidates.map(candidate => ({
      resourceId: candidate.resourceId,
      currentAllocation: candidate.currentAllocation,
      recommendedAllocation: candidate.currentAllocation * 0.8, // 20% decrease
      allocationChange: -candidate.currentAllocation * 0.2,
      strategy: 'cost_minimized' as AllocationStrategy,
      confidence: 80,
      expectedImpact: {
        costImpact: -candidate.currentAllocation * 0.2,
        performanceImpact: -10,
        utilizationImpact: -5,
        businessValueImpact: -8,
        roiImpact: 0.1,
        impactTimeline: 'immediate',
      },
      riskAssessment: {
        riskLevel: 'high',
        riskFactors: ['Performance degradation risk', 'Service disruption'],
        mitigationStrategies: ['Careful prioritization', 'Enhanced efficiency'],
        maxNegativeImpact: candidate.currentAllocation * 0.3,
        negativeProbability: 40,
      },
      dependencies: [],
      type: 'cost_reduction',
      priority: 'high',
      description: 'Pessimistic constraint scenario',
      expectedSavings: candidate.currentAllocation * 0.2,
      implementationComplexity: 'high',
      validationCriteria: ['Cost reduction', 'Service level maintenance'],
      rollbackPlan: 'Emergency budget increase if critical issues',
    }));

    return {
      scenarioId: 'pessimistic_scenario',
      scenarioName: 'Pessimistic Constraint Scenario',
      description: 'Conservative approach assuming budget constraints and challenges',
      totalBudget: parameters.budgetRange.min,
      allocations,
      expectedOutcomes: this.calculateExpectedOutcomes(allocations),
      timeline: this.config.generation.timeHorizon,
      assumptions: [
        'Budget constraints enforced',
        'Market conditions challenging',
        'Focus on cost control',
        'Efficiency maximization required',
      ],
    };
  }

  /**
   * Generate balanced scenario
   */
  private generateBalancedScenario(
    candidates: AllocationCandidate[],
    parameters: ScenarioParameters
  ): AllocationScenario {
    const allocations: AllocationRecommendation[] = candidates.map(candidate => ({
      resourceId: candidate.resourceId,
      currentAllocation: candidate.currentAllocation,
      recommendedAllocation: candidate.currentAllocation * 1.1, // 10% increase
      allocationChange: candidate.currentAllocation * 0.1,
      strategy: 'priority_weighted' as AllocationStrategy,
      confidence: 90,
      expectedImpact: {
        costImpact: candidate.currentAllocation * 0.1,
        performanceImpact: 12,
        utilizationImpact: 8,
        businessValueImpact: 15,
        roiImpact: 0.15,
        impactTimeline: 'medium_term',
      },
      riskAssessment: {
        riskLevel: 'low',
        riskFactors: ['Moderate implementation risk'],
        mitigationStrategies: ['Balanced approach', 'Risk monitoring'],
        maxNegativeImpact: candidate.currentAllocation * 0.05,
        negativeProbability: 15,
      },
      dependencies: [],
      type: 'balanced',
      priority: 'medium',
      description: 'Balanced growth and efficiency scenario',
      expectedSavings: candidate.currentAllocation * 0.02,
      implementationComplexity: 'medium',
      validationCriteria: ['Balanced metrics', 'Sustainable growth'],
      rollbackPlan: 'Adjust based on performance feedback',
    }));

    return {
      scenarioId: 'balanced_scenario',
      scenarioName: 'Balanced Growth and Efficiency',
      description: 'Balanced approach optimizing for multiple objectives',
      totalBudget: (parameters.budgetRange.min + parameters.budgetRange.max) / 2,
      allocations,
      expectedOutcomes: this.calculateExpectedOutcomes(allocations),
      timeline: this.config.generation.timeHorizon,
      assumptions: [
        'Moderate budget availability',
        'Balanced risk-return profile',
        'Sustainable growth focus',
        'Multi-objective optimization',
      ],
    };
  }

  /**
   * Generate constraint-focused scenario
   */
  private generateConstraintScenario(
    candidates: AllocationCandidate[],
    parameters: ScenarioParameters
  ): AllocationScenario {
    const allocations: AllocationRecommendation[] = candidates.map(candidate => ({
      resourceId: candidate.resourceId,
      currentAllocation: candidate.currentAllocation,
      recommendedAllocation: Math.min(
        candidate.constraints.maxAllocation,
        Math.max(candidate.constraints.minAllocation, candidate.currentAllocation * 0.95)
      ),
      allocationChange: Math.min(
        candidate.constraints.maxAllocation,
        Math.max(candidate.constraints.minAllocation, candidate.currentAllocation * 0.95)
      ) - candidate.currentAllocation,
      strategy: 'usage_based' as AllocationStrategy,
      confidence: 95,
      expectedImpact: {
        costImpact: Math.min(
          candidate.constraints.maxAllocation,
          Math.max(candidate.constraints.minAllocation, candidate.currentAllocation * 0.95)
        ) - candidate.currentAllocation,
        performanceImpact: 5,
        utilizationImpact: 10,
        businessValueImpact: 8,
        roiImpact: 0.1,
        impactTimeline: 'short_term',
      },
      riskAssessment: {
        riskLevel: 'low',
        riskFactors: ['Constraint compliance'],
        mitigationStrategies: ['Strict adherence to constraints'],
        maxNegativeImpact: 0,
        negativeProbability: 5,
      },
      dependencies: [],
      type: 'constraint_optimization',
      priority: 'high',
      description: 'Constraint-compliant optimization scenario',
      expectedSavings: Math.max(0, candidate.currentAllocation - Math.min(
        candidate.constraints.maxAllocation,
        Math.max(candidate.constraints.minAllocation, candidate.currentAllocation * 0.95)
      )),
      implementationComplexity: 'low',
      validationCriteria: ['Constraint compliance', 'Efficiency within bounds'],
      rollbackPlan: 'No rollback needed - constraint compliant',
    }));

    return {
      scenarioId: 'constraint_scenario',
      scenarioName: 'Constraint-Compliant Optimization',
      description: 'Optimization within strict constraint boundaries',
      totalBudget: Math.min(parameters.budgetRange.max, candidates.reduce(
        (sum, c) => sum + c.constraints.maxAllocation, 0
      )),
      allocations,
      expectedOutcomes: this.calculateExpectedOutcomes(allocations),
      timeline: this.config.generation.timeHorizon,
      assumptions: [
        'All constraints must be satisfied',
        'Compliance is non-negotiable',
        'Optimization within bounds',
        'Risk minimization priority',
      ],
    };
  }

  /**
   * Generate custom scenario
   */
  private generateCustomScenario(
    candidates: AllocationCandidate[],
    parameters: ScenarioParameters,
    index: number
  ): AllocationScenario {
    // Generate variations based on index
    const variation = (index + 1) * 0.15; // 15%, 30%, 45% etc.
    const isGrowth = index % 2 === 0;

    const allocations: AllocationRecommendation[] = candidates.map(candidate => {
      const changeMultiplier = isGrowth ? (1 + variation) : (1 - variation * 0.5);
      const recommendedAllocation = candidate.currentAllocation * changeMultiplier;

      return {
        resourceId: candidate.resourceId,
        currentAllocation: candidate.currentAllocation,
        recommendedAllocation,
        allocationChange: recommendedAllocation - candidate.currentAllocation,
        strategy: 'priority_weighted' as AllocationStrategy,
        confidence: 75,
        expectedImpact: {
          costImpact: recommendedAllocation - candidate.currentAllocation,
          performanceImpact: isGrowth ? variation * 50 : -variation * 25,
          utilizationImpact: variation * 30,
          businessValueImpact: isGrowth ? variation * 40 : -variation * 20,
          roiImpact: variation * (isGrowth ? 1 : 0.5),
          impactTimeline: 'medium_term',
        },
        riskAssessment: {
          riskLevel: variation > 0.3 ? 'high' : variation > 0.15 ? 'medium' : 'low',
          riskFactors: ['Scenario variation risk'],
          mitigationStrategies: ['Adaptive management'],
          maxNegativeImpact: Math.abs(recommendedAllocation - candidate.currentAllocation) * 0.5,
          negativeProbability: variation * 50,
        },
        dependencies: [],
        type: 'custom',
        priority: 'medium',
        description: `Custom scenario ${index + 1}`,
        expectedSavings: isGrowth ? 0 : Math.abs(recommendedAllocation - candidate.currentAllocation),
        implementationComplexity: 'medium',
        validationCriteria: ['Custom metrics'],
        rollbackPlan: 'Standard rollback procedure',
      };
    });

    return {
      scenarioId: `custom_scenario_${index + 1}`,
      scenarioName: `Custom Scenario ${index + 1}`,
      description: `Custom scenario with ${(variation * 100).toFixed(0)}% variation`,
      totalBudget: parameters.budgetRange.min + (parameters.budgetRange.max - parameters.budgetRange.min) * (0.3 + variation),
      allocations,
      expectedOutcomes: this.calculateExpectedOutcomes(allocations),
      timeline: this.config.generation.timeHorizon,
      assumptions: [
        `Custom assumptions for scenario ${index + 1}`,
        'Variable market conditions',
        'Adaptive strategy required',
      ],
    };
  }

  /**
   * Calculate expected outcomes for scenario
   */
  private calculateExpectedOutcomes(allocations: AllocationRecommendation[]): ScenarioOutcome {
    const totalCost = allocations.reduce((sum, alloc) => sum + alloc.recommendedAllocation, 0);
    const overallROI = allocations.reduce((sum, alloc) => sum + alloc.expectedImpact.roiImpact, 0) / allocations.length;

    const utilizationEfficiency = allocations.reduce(
      (sum, alloc) => sum + alloc.expectedImpact.utilizationImpact, 0
    ) / allocations.length;

    const businessValue = allocations.reduce(
      (sum, alloc) => sum + alloc.expectedImpact.businessValueImpact, 0
    );

    const avgRisk = allocations.reduce((sum, alloc) => {
      const riskScore = alloc.riskAssessment.riskLevel === 'critical' ? 4 :
                       alloc.riskAssessment.riskLevel === 'high' ? 3 :
                       alloc.riskAssessment.riskLevel === 'medium' ? 2 : 1;
      return sum + riskScore;
    }, 0) / allocations.length;

    const riskAdjustedReturn = overallROI * (1 - (avgRisk - 1) * 0.1);

    const successProbability = Math.max(0.3, Math.min(0.95, 1 - (avgRisk - 1) * 0.15));

    return {
      totalCost,
      overallROI,
      utilizationEfficiency: Math.max(0, 50 + utilizationEfficiency),
      businessValue,
      riskAdjustedReturn,
      successProbability,
    };
  }

  /**
   * Perform comparative analysis
   */
  private performComparativeAnalysis(scenarios: AllocationScenario[]): ScenarioComparison {
    const performanceScores = scenarios.map(s => s.expectedOutcomes.overallROI);
    const costs = scenarios.map(s => s.expectedOutcomes.totalCost);
    const riskScores = scenarios.map(s => 100 - s.expectedOutcomes.successProbability * 100);
    const roiValues = scenarios.map(s => s.expectedOutcomes.riskAdjustedReturn);

    return {
      performance: {
        best: scenarios[performanceScores.indexOf(Math.max(...performanceScores))].scenarioId,
        worst: scenarios[performanceScores.indexOf(Math.min(...performanceScores))].scenarioId,
        average: performanceScores.reduce((sum, p) => sum + p, 0) / performanceScores.length,
        variance: this.calculateVariance(performanceScores),
      },
      cost: {
        mostEffective: scenarios[costs.indexOf(Math.min(...costs))].scenarioId,
        mostExpensive: scenarios[costs.indexOf(Math.max(...costs))].scenarioId,
        average: costs.reduce((sum, c) => sum + c, 0) / costs.length,
        variance: this.calculateVariance(costs),
      },
      risk: {
        lowest: scenarios[riskScores.indexOf(Math.min(...riskScores))].scenarioId,
        highest: scenarios[riskScores.indexOf(Math.max(...riskScores))].scenarioId,
        average: riskScores.reduce((sum, r) => sum + r, 0) / riskScores.length,
        distribution: scenarios.reduce((dist, scenario) => {
          dist[scenario.scenarioId] = 100 - scenario.expectedOutcomes.successProbability * 100;
          return dist;
        }, {} as Record<string, number>),
      },
      roi: {
        highest: scenarios[roiValues.indexOf(Math.max(...roiValues))].scenarioId,
        lowest: scenarios[roiValues.indexOf(Math.min(...roiValues))].scenarioId,
        average: roiValues.reduce((sum, roi) => sum + roi, 0) / roiValues.length,
        spread: Math.max(...roiValues) - Math.min(...roiValues),
      },
    };
  }

  /**
   * Select recommended scenario
   */
  private selectRecommendedScenario(scenarios: AllocationScenario[], comparison: ScenarioComparison): AllocationScenario {
    // Multi-criteria decision based on configured objectives
    const scores: Record<string, number> = {};

    for (const scenario of scenarios) {
      let score = 0;

      // ROI weight
      score += (scenario.expectedOutcomes.riskAdjustedReturn / comparison.roi.average) * 0.4;

      // Risk weight (lower risk = higher score)
      const riskScore = 100 - scenario.expectedOutcomes.successProbability * 100;
      score += ((comparison.risk.average - riskScore) / comparison.risk.average) * 0.3;

      // Cost efficiency weight
      score += ((comparison.cost.average - scenario.expectedOutcomes.totalCost) / comparison.cost.average) * 0.3;

      scores[scenario.scenarioId] = score;
    }

    const bestScenarioId = Object.keys(scores).reduce((best, current) =>
      scores[current] > scores[best] ? current : best
    );

    const recommendedScenario = scenarios.find(s => s.scenarioId === bestScenarioId);
    if (!recommendedScenario) {
      throw new Error('Failed to select recommended scenario');
    }

    return recommendedScenario;
  }

  /**
   * Analyze scenario risks
   */
  private analyzeScenarioRisks(scenarios: AllocationScenario[]): ScenarioRiskAnalysis {
    const avgRiskScore = scenarios.reduce((sum, scenario) =>
      sum + (100 - scenario.expectedOutcomes.successProbability * 100), 0
    ) / scenarios.length;

    let portfolioRiskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (avgRiskScore > 70) portfolioRiskLevel = 'critical';
    else if (avgRiskScore > 50) portfolioRiskLevel = 'high';
    else if (avgRiskScore > 30) portfolioRiskLevel = 'medium';

    const scenarioRisks = scenarios.map(scenario => {
      const riskScore = 100 - scenario.expectedOutcomes.successProbability * 100;
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (riskScore > 70) riskLevel = 'critical';
      else if (riskScore > 50) riskLevel = 'high';
      else if (riskScore > 30) riskLevel = 'medium';

      return {
        scenarioId: scenario.scenarioId,
        riskLevel,
        factors: ['Implementation complexity', 'Market uncertainty', 'Resource constraints'],
        mitigations: ['Risk monitoring', 'Contingency planning', 'Gradual rollout'],
      };
    });

    return {
      portfolioRisk: {
        level: portfolioRiskLevel,
        score: avgRiskScore,
        keyFactors: ['Market volatility', 'Implementation risk', 'Resource availability'],
      },
      scenarioRisks,
      correlationRisks: [
        {
          description: 'Market conditions affect all scenarios',
          affectedScenarios: scenarios.map(s => s.scenarioId),
          severity: 0.7,
        },
      ],
      blackSwanEvents: [
        {
          event: 'Major market disruption',
          probability: 0.05,
          impact: 0.8,
          vulnerableScenarios: scenarios.filter(s => s.expectedOutcomes.totalCost > avgRiskScore).map(s => s.scenarioId),
        },
      ],
    };
  }

  /**
   * Perform sensitivity analysis
   */
  private performSensitivityAnalysis(
    scenarios: AllocationScenario[],
    _candidates: AllocationCandidate[]
  ): SensitivityAnalysisResult {
    // Simplified sensitivity analysis
    const parameterSensitivity = [
      {
        parameter: 'budget_change',
        sensitivity: 0.8,
        impactRange: { min: -20, max: 30 },
        thresholds: [0.1, 0.2, 0.3],
      },
      {
        parameter: 'performance_target',
        sensitivity: 0.6,
        impactRange: { min: -15, max: 25 },
        thresholds: [0.05, 0.15, 0.25],
      },
    ];

    const interactions = [
      {
        parameters: ['budget_change', 'performance_target'] as [string, string],
        strength: 0.7,
        type: 'synergistic' as const,
      },
    ];

    // Calculate robustness scores
    const robustnessScores = scenarios.reduce((scores, scenario) => {
      scores[scenario.scenarioId] = scenario.expectedOutcomes.successProbability * 100;
      return scores;
    }, {} as Record<string, number>);

    const mostRobust = Object.keys(robustnessScores).reduce((best, current) =>
      robustnessScores[current] > robustnessScores[best] ? current : best
    );

    const leastRobust = Object.keys(robustnessScores).reduce((worst, current) =>
      robustnessScores[current] < robustnessScores[worst] ? current : worst
    );

    return {
      parameterSensitivity,
      interactions,
      robustness: {
        mostRobust,
        leastRobust,
        scores: robustnessScores,
      },
    };
  }

  /**
   * Generate implementation roadmap
   */
  private generateImplementationRoadmap(scenario: AllocationScenario): ImplementationRoadmap {
    const phases: ImplementationPhase[] = [
      {
        id: 'planning',
        name: 'Planning and Preparation',
        description: 'Detailed planning and resource preparation',
        duration: '2 weeks',
        objectives: ['Finalize implementation plan', 'Secure resources', 'Set up monitoring'],
        deliverables: ['Implementation plan', 'Resource allocation', 'Monitoring setup'],
        dependencies: [],
        risks: ['Resource availability', 'Planning accuracy'],
      },
      {
        id: 'pilot',
        name: 'Pilot Implementation',
        description: 'Pilot rollout with selected resources',
        duration: '4 weeks',
        objectives: ['Validate approach', 'Identify issues', 'Refine process'],
        deliverables: ['Pilot results', 'Issue log', 'Process refinements'],
        dependencies: ['planning'],
        risks: ['Pilot performance', 'Unexpected issues'],
      },
      {
        id: 'rollout',
        name: 'Full Rollout',
        description: 'Complete implementation across all resources',
        duration: '8 weeks',
        objectives: ['Full deployment', 'Monitor performance', 'Achieve targets'],
        deliverables: ['Complete deployment', 'Performance reports', 'Target achievement'],
        dependencies: ['pilot'],
        risks: ['Scaling challenges', 'Performance targets'],
      },
    ];

    const milestones: Milestone[] = [
      {
        id: 'planning_complete',
        name: 'Planning Complete',
        targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        successCriteria: ['All plans approved', 'Resources secured'],
        verificationMethod: 'Plan review and resource confirmation',
        owner: 'Project Manager',
      },
      {
        id: 'pilot_complete',
        name: 'Pilot Complete',
        targetDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000),
        successCriteria: ['Pilot targets met', 'Issues resolved'],
        verificationMethod: 'Performance metrics and issue resolution',
        owner: 'Implementation Lead',
      },
    ];

    const resourceRequirements: ResourceRequirement[] = [
      {
        type: 'human',
        description: 'Project team members',
        quantity: 5,
        duration: '3 months',
        criticality: 'high',
        alternatives: ['External consultants', 'Contractor resources'],
      },
      {
        type: 'financial',
        description: 'Implementation budget',
        quantity: scenario.expectedOutcomes.totalCost * 0.1,
        duration: '3 months',
        criticality: 'critical',
        alternatives: ['Phased funding', 'Budget reallocation'],
      },
    ];

    const riskMitigation: RiskMitigationPlan = {
      strategies: [
        {
          risk: 'Implementation delays',
          strategy: 'Staged rollout with buffer time',
          cost: 1000,
          effectiveness: 0.8,
        },
        {
          risk: 'Performance targets not met',
          strategy: 'Enhanced monitoring and rapid adjustment',
          cost: 500,
          effectiveness: 0.7,
        },
      ],
      contingencyPlans: [
        {
          trigger: 'Major performance degradation',
          action: 'Immediate rollback to previous state',
          resources: ['Rollback team', 'Emergency budget'],
        },
      ],
      monitoring: {
        metrics: ['performance', 'cost', 'utilization', 'risk_indicators'],
        frequency: 'daily',
        thresholds: {
          performance: 80,
          cost: scenario.expectedOutcomes.totalCost * 1.1,
          utilization: 90,
          risk_indicators: 70,
        },
      },
    };

    const successMetrics: SuccessMetric[] = [
      {
        name: 'ROI Achievement',
        description: 'Return on investment target achievement',
        target: scenario.expectedOutcomes.overallROI,
        measurementMethod: 'Financial analysis',
        frequency: 'monthly',
        successThreshold: scenario.expectedOutcomes.overallROI * 0.8,
      },
      {
        name: 'Performance Improvement',
        description: 'Overall performance improvement',
        target: 15,
        measurementMethod: 'Performance metrics analysis',
        frequency: 'weekly',
        successThreshold: 12,
      },
    ];

    return {
      phases,
      milestones,
      resourceRequirements,
      riskMitigation,
      successMetrics,
    };
  }

  /**
   * Apply parameter change to scenario
   */
  private applyParameterChange(
    baseScenario: AllocationScenario,
    change: { parameter: string; value: number }
  ): AllocationScenario {
    // Create modified scenario based on parameter change
    const modifiedAllocations = baseScenario.allocations.map(allocation => ({
      ...allocation,
      recommendedAllocation: allocation.recommendedAllocation * (1 + change.value),
      allocationChange: allocation.recommendedAllocation * change.value,
      expectedImpact: {
        ...allocation.expectedImpact,
        costImpact: allocation.expectedImpact.costImpact * (1 + change.value),
        performanceImpact: allocation.expectedImpact.performanceImpact * (1 + change.value * 0.5),
      },
    }));

    return {
      ...baseScenario,
      scenarioId: `${baseScenario.scenarioId}_modified_${change.parameter}`,
      scenarioName: `${baseScenario.scenarioName} (${change.parameter} modified)`,
      allocations: modifiedAllocations,
      expectedOutcomes: this.calculateExpectedOutcomes(modifiedAllocations),
    };
  }

  /**
   * Calculate impact delta between scenarios
   */
  private calculateImpactDelta(baseScenario: AllocationScenario, modifiedScenario: AllocationScenario): {
    costDelta: number;
    performanceDelta: number;
    roiDelta: number;
    riskDelta: number;
  } {
    return {
      costDelta: modifiedScenario.expectedOutcomes.totalCost - baseScenario.expectedOutcomes.totalCost,
      performanceDelta: modifiedScenario.expectedOutcomes.utilizationEfficiency - baseScenario.expectedOutcomes.utilizationEfficiency,
      roiDelta: modifiedScenario.expectedOutcomes.overallROI - baseScenario.expectedOutcomes.overallROI,
      riskDelta: (baseScenario.expectedOutcomes.successProbability - modifiedScenario.expectedOutcomes.successProbability) * 100,
    };
  }

  /**
   * Calculate variance of array values
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    return values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
  }

  /**
   * Validate configuration
   */
  private validateConfiguration(): void {
    if (this.config.generation.scenarioCount <= 0) {
      throw new Error('Scenario count must be positive');
    }

    if (this.config.generation.diversityFactor < 0 || this.config.generation.diversityFactor > 1) {
      throw new Error('Diversity factor must be between 0 and 1');
    }

    if (this.config.riskAssessment.simulationRuns <= 0) {
      throw new Error('Simulation runs must be positive');
    }
  }
}

/**
 * Create scenario planner instance
 * @param config - Planning configuration
 * @param logger - Logger instance
 * @returns ScenarioPlanner instance
 */
export function createScenarioPlanner(
  config?: Partial<ScenarioPlanningConfig>,
  logger?: AllocationLogger
): ScenarioPlanner {
  const defaultLogger: AllocationLogger = {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  };

  return new ScenarioPlanner(config, logger || defaultLogger);
}