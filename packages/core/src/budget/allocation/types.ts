/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  OptimizationType,
  FeatureCostAnalysis,
} from '../analytics/AnalyticsEngine.js';

export type { FeatureCostAnalysis, OptimizationType };

/**
 * Budget allocation priority levels for resource ranking
 */
export type AllocationPriority =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'deferred';

/**
 * Budget allocation strategy types for different optimization approaches
 */
export type AllocationStrategy =
  | 'usage_based'
  | 'roi_optimized'
  | 'priority_weighted'
  | 'cost_minimized'
  | 'performance_balanced'
  | 'risk_adjusted'
  | 'capacity_constrained';

/**
 * Resource allocation constraints for optimization boundaries
 */
export interface AllocationConstraints {
  /** Minimum budget allocation (prevents starving critical resources) */
  minAllocation: number;
  /** Maximum budget allocation (prevents resource hoarding) */
  maxAllocation: number;
  /** Budget allocation must be multiple of this amount */
  allocationGranularity?: number;
  /** Resource cannot exceed this utilization percentage */
  maxUtilizationRate?: number;
  /** Minimum ROI threshold for allocation */
  minROIThreshold?: number;
  /** Required service level agreement constraints */
  slaRequirements?: SLARequirements;
}

/**
 * Service Level Agreement requirements for allocation decisions
 */
export interface SLARequirements {
  /** Maximum acceptable response time in milliseconds */
  maxResponseTime: number;
  /** Minimum required availability percentage (0-100) */
  minAvailability: number;
  /** Maximum acceptable error rate percentage (0-100) */
  maxErrorRate: number;
  /** Minimum required throughput (requests per second) */
  minThroughput: number;
}

/**
 * Resource allocation candidate for optimization algorithms
 */
export interface AllocationCandidate {
  /** Unique identifier for the resource (feature, user, project, etc.) */
  resourceId: string;
  /** Human-readable name for the resource */
  resourceName: string;
  /** Current budget allocation amount */
  currentAllocation: number;
  /** Historical usage data and cost analysis */
  costAnalysis: FeatureCostAnalysis;
  /** Business priority level for resource ranking */
  priority: AllocationPriority;
  /** Resource-specific allocation constraints */
  constraints: AllocationConstraints;
  /** Projected future usage based on trends */
  projectedUsage: number;
  /** Business impact score (0-100) */
  businessImpact: number;
  /** Technical complexity score (0-100) for implementation */
  technicalComplexity: number;
  /** Additional metadata for decision making */
  metadata: Record<string, unknown>;
}

/**
 * Budget allocation recommendation with optimization rationale
 */
export interface AllocationRecommendation {
  // From OptimizationRecommendation
  /** Unique identifier for the recommendation */
  id: string;
  /** Type of optimization recommendation */
  type: OptimizationType;
  /** Recommendation title */
  title: string;
  /** Detailed description of the recommendation */
  description: string;
  /** Potential cost savings amount */
  potentialSavings: number;
  /** Savings percentage */
  savingsPercentage: number;
  /** Implementation complexity level */
  implementationComplexity: 'low' | 'medium' | 'high';
  /** Time estimate to implement */
  timeToImplement?: string;
  /** Priority level */
  priority: 'critical' | 'high' | 'medium' | 'low';
  /** Confidence score (0-100) */
  confidenceScore?: number;
  /** Features applicable to this recommendation */
  applicableFeatures?: string[];
  /** Action items for implementation */
  actionItems?: string[];
  /** Metrics for tracking success */
  metrics?: {
    currentCost: number;
    projectedCost: number;
    expectedReduction: number;
  };

  // Allocation-specific properties
  /** Target resource for allocation change */
  resourceId: string;
  /** Current allocation amount */
  currentAllocation: number;
  /** Recommended allocation amount */
  recommendedAllocation: number;
  /** Allocation change amount (positive = increase, negative = decrease) */
  allocationChange: number;
  /** Strategy used for this allocation decision */
  strategy: AllocationStrategy;
  /** Confidence score in recommendation (0-100) */
  confidence: number;
  /** Expected impact metrics from allocation change */
  expectedImpact: AllocationImpact;
  /** Risk assessment for the allocation change */
  riskAssessment: RiskAssessment;
  /** Dependencies on other allocation decisions */
  dependencies: string[];
  /** Estimated time to implement in hours */
  estimatedTimeToImplement: number;
  /** Category of the allocation recommendation */
  category: string;
  /** Expected savings amount (for compatibility with optimization engine) */
  expectedSavings?: number;
  /** Validation criteria for the recommendation */
  validationCriteria?: string[];
  /** Rollback plan for the recommendation */
  rollbackPlan?: string;
  /** Tags for categorization and filtering */
  tags?: string[];
}

/**
 * Expected impact metrics from budget allocation changes
 */
export interface AllocationImpact {
  /** Expected cost change (positive = increase, negative = savings) */
  costImpact: number;
  /** Expected performance improvement percentage */
  performanceImpact: number;
  /** Expected utilization rate change */
  utilizationImpact: number;
  /** Expected business value increase */
  businessValueImpact: number;
  /** Expected ROI change */
  roiImpact: number;
  /** Timeline for expected impact realization */
  impactTimeline: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
}

/**
 * Risk assessment for allocation changes
 */
export interface RiskAssessment {
  /** Overall risk level */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  /** Identified risk factors */
  riskFactors: string[];
  /** Mitigation strategies */
  mitigationStrategies: string[];
  /** Maximum potential negative impact */
  maxNegativeImpact: number;
  /** Probability of negative outcome (0-100) */
  negativeProbability: number;
}

/**
 * Budget allocation scenario for planning and simulation
 */
export interface AllocationScenario {
  /** Unique scenario identifier */
  scenarioId: string;
  /** Descriptive name for the scenario */
  scenarioName: string;
  /** Scenario description and objectives */
  description: string;
  /** Total budget available for allocation */
  totalBudget: number;
  /** List of allocation recommendations in this scenario */
  allocations: AllocationRecommendation[];
  /** Expected scenario outcomes */
  expectedOutcomes: ScenarioOutcome;
  /** Scenario execution timeline */
  timeline: string;
  /** Scenario assumptions and constraints */
  assumptions: string[];
}

/**
 * Expected outcomes from executing an allocation scenario
 */
export interface ScenarioOutcome {
  /** Total expected cost */
  totalCost: number;
  /** Overall expected ROI */
  overallROI: number;
  /** Expected utilization efficiency */
  utilizationEfficiency: number;
  /** Expected business value creation */
  businessValue: number;
  /** Risk-adjusted return */
  riskAdjustedReturn: number;
  /** Scenario success probability (0-100) */
  successProbability: number;
}

/**
 * Allocation algorithm configuration
 */
export interface AllocationAlgorithmConfig {
  /** Algorithm strategy to use */
  strategy: AllocationStrategy;
  /** Weight given to different factors (0-1) */
  weights: {
    cost: number;
    performance: number;
    roi: number;
    businessValue: number;
    risk: number;
  };
  /** Global allocation constraints */
  globalConstraints: AllocationConstraints;
  /** Optimization objectives in order of priority */
  objectives: string[];
  /** Algorithm-specific parameters */
  parameters: Record<string, unknown>;
}

/**
 * Allocation optimization result
 */
export interface AllocationOptimizationResult {
  /** Original candidates before optimization */
  originalCandidates: AllocationCandidate[];
  /** Optimized allocation recommendations */
  recommendations: AllocationRecommendation[];
  /** Total budget allocated */
  totalAllocated: number;
  /** Overall optimization score */
  optimizationScore: number;
  /** Algorithm performance metrics */
  algorithmMetrics: {
    executionTime: number;
    convergenceIterations: number;
    optimizationEfficiency: number;
  };
  /** Validation results */
  validation: {
    constraintsSatisfied: boolean;
    budgetBalanced: boolean;
    improvementAchieved: boolean;
  };
}

/**
 * Logger interface for allocation system
 */
export interface AllocationLogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}
