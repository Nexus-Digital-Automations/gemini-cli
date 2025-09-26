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
import type { AllocationCandidate, AllocationScenario, AllocationLogger } from '../types.js';
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
    budgetRange: {
        min: number;
        max: number;
    };
    /** Performance target variations */
    performanceTargets: Record<string, {
        min: number;
        max: number;
    }>;
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
        impactRange: {
            min: number;
            max: number;
        };
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
export declare const DEFAULT_SCENARIO_CONFIG: ScenarioPlanningConfig;
/**
 * Scenario-based budget allocation planner
 * Provides comprehensive scenario planning and impact analysis
 */
export declare class ScenarioPlanner {
    private readonly config;
    private readonly logger;
    /**
     * Create scenario planner instance
     * @param config - Planning configuration
     * @param logger - Logger instance
     */
    constructor(config: Partial<ScenarioPlanningConfig> | undefined, logger: AllocationLogger);
    /**
     * Generate allocation scenarios
     * @param candidates - Resource allocation candidates
     * @param parameters - Scenario generation parameters
     * @returns Generated scenarios
     */
    generateScenarios(candidates: AllocationCandidate[], parameters: ScenarioParameters): AllocationScenario[];
    /**
     * Analyze scenarios and provide comparative analysis
     * @param scenarios - Generated scenarios
     * @param candidates - Original candidates
     * @returns Scenario analysis result
     */
    analyzeScenarios(scenarios: AllocationScenario[], candidates: AllocationCandidate[]): ScenarioAnalysisResult;
    /**
     * Generate what-if analysis for specific parameters
     * @param baseScenario - Base scenario for comparison
     * @param parameterChanges - Parameters to vary
     * @returns What-if analysis results
     */
    generateWhatIfAnalysis(baseScenario: AllocationScenario, parameterChanges: Record<string, Array<{
        parameter: string;
        value: number;
    }>>): Array<{
        changeDescription: string;
        modifiedScenario: AllocationScenario;
        impact: {
            costDelta: number;
            performanceDelta: number;
            roiDelta: number;
            riskDelta: number;
        };
    }>;
    /**
     * Generate base scenario (current state optimized)
     */
    private generateBaseScenario;
    /**
     * Generate optimistic scenario
     */
    private generateOptimisticScenario;
    /**
     * Generate pessimistic scenario
     */
    private generatePessimisticScenario;
    /**
     * Generate balanced scenario
     */
    private generateBalancedScenario;
    /**
     * Generate constraint-focused scenario
     */
    private generateConstraintScenario;
    /**
     * Generate custom scenario
     */
    private generateCustomScenario;
    /**
     * Calculate expected outcomes for scenario
     */
    private calculateExpectedOutcomes;
    /**
     * Perform comparative analysis
     */
    private performComparativeAnalysis;
    /**
     * Select recommended scenario
     */
    private selectRecommendedScenario;
    /**
     * Analyze scenario risks
     */
    private analyzeScenarioRisks;
    /**
     * Perform sensitivity analysis
     */
    private performSensitivityAnalysis;
    /**
     * Generate implementation roadmap
     */
    private generateImplementationRoadmap;
    /**
     * Apply parameter change to scenario
     */
    private applyParameterChange;
    /**
     * Calculate impact delta between scenarios
     */
    private calculateImpactDelta;
    /**
     * Calculate variance of array values
     */
    private calculateVariance;
    /**
     * Validate configuration
     */
    private validateConfiguration;
}
/**
 * Create scenario planner instance
 * @param config - Planning configuration
 * @param logger - Logger instance
 * @returns ScenarioPlanner instance
 */
export declare function createScenarioPlanner(config?: Partial<ScenarioPlanningConfig>, logger?: AllocationLogger): ScenarioPlanner;
