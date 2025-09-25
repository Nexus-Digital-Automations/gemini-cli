/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Dynamic budget rebalancing system
 * Provides intelligent budget redistribution based on real-time performance and changing conditions
 *
 * @author Claude Code - Budget Allocation Agent
 * @version 1.0.0
 */
import type {
  AllocationCandidate,
  AllocationConstraints,
  FeatureCostAnalysis,
  AllocationLogger,
} from '../types.js';
/**
 * Dynamic rebalancing configuration
 */
export interface DynamicRebalancingConfig {
  /** Rebalancing strategy */
  strategy: RebalancingStrategy;
  /** Rebalancing triggers */
  triggers: RebalancingTrigger[];
  /** Rebalancing constraints */
  constraints: RebalancingConstraints;
  /** Performance monitoring configuration */
  monitoring: MonitoringConfig;
  /** Risk management settings */
  riskManagement: RiskManagementConfig;
  /** Automation settings */
  automation: AutomationConfig;
}
/**
 * Rebalancing strategies
 */
export type RebalancingStrategy =
  | 'reactive'
  | 'proactive'
  | 'adaptive'
  | 'threshold_based'
  | 'machine_learning'
  | 'hybrid';
/**
 * Rebalancing trigger configuration
 */
export interface RebalancingTrigger {
  /** Trigger identifier */
  id: string;
  /** Trigger type */
  type: 'performance' | 'utilization' | 'cost' | 'time' | 'external';
  /** Trigger condition */
  condition: TriggerCondition;
  /** Trigger sensitivity */
  sensitivity: number;
  /** Minimum trigger interval */
  cooldownPeriod: string;
  /** Trigger enabled status */
  enabled: boolean;
}
/**
 * Trigger condition definition
 */
export interface TriggerCondition {
  /** Metric to monitor */
  metric: string;
  /** Comparison operator */
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  /** Threshold value */
  threshold: number;
  /** Time window for evaluation */
  timeWindow: string;
  /** Required consecutive occurrences */
  consecutiveOccurrences: number;
}
/**
 * Rebalancing constraints
 */
export interface RebalancingConstraints {
  /** Maximum rebalancing frequency */
  maxFrequency: string;
  /** Maximum allocation change per rebalancing */
  maxAllocationChange: number;
  /** Minimum stability period between changes */
  minStabilityPeriod: string;
  /** Resource-specific constraints */
  resourceConstraints: Record<string, AllocationConstraints>;
  /** Global budget constraints */
  budgetConstraints: {
    /** Total budget limit */
    totalLimit: number;
    /** Reserved budget percentage */
    reservedPercentage: number;
    /** Emergency buffer */
    emergencyBuffer: number;
  };
  /** Performance constraints */
  performanceConstraints: {
    /** Minimum acceptable performance threshold */
    minPerformanceThreshold: number;
    /** Maximum performance degradation allowed */
    maxDegradationAllowed: number;
  };
}
/**
 * Monitoring configuration
 */
export interface MonitoringConfig {
  /** Enable real-time monitoring */
  realTimeMonitoring: boolean;
  /** Monitoring frequency */
  monitoringFrequency: string;
  /** Metrics to monitor */
  metricsToMonitor: string[];
  /** Data retention period */
  dataRetentionPeriod: string;
  /** Alert thresholds */
  alertThresholds: Record<string, number>;
  /** Notification settings */
  notifications: {
    /** Enable notifications */
    enabled: boolean;
    /** Notification channels */
    channels: string[];
    /** Notification recipients */
    recipients: string[];
  };
}
/**
 * Risk management configuration
 */
export interface RiskManagementConfig {
  /** Enable risk assessment */
  enabled: boolean;
  /** Risk tolerance level */
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  /** Risk metrics to evaluate */
  riskMetrics: string[];
  /** Maximum acceptable risk score */
  maxRiskScore: number;
  /** Risk mitigation strategies */
  mitigationStrategies: string[];
  /** Rollback configuration */
  rollback: {
    /** Enable automatic rollback */
    enabled: boolean;
    /** Rollback conditions */
    conditions: string[];
    /** Rollback timeout */
    timeout: string;
  };
}
/**
 * Automation configuration
 */
export interface AutomationConfig {
  /** Enable automated rebalancing */
  enabled: boolean;
  /** Approval requirements */
  approvalRequired: boolean;
  /** Approval timeout */
  approvalTimeout: string;
  /** Automation scope */
  scope: {
    /** Maximum allocation change without approval */
    maxChangeWithoutApproval: number;
    /** Resources that can be automatically rebalanced */
    autoRebalanceableResources: string[];
    /** Resources requiring manual approval */
    manualApprovalResources: string[];
  };
  /** Execution settings */
  execution: {
    /** Execution strategy */
    strategy: 'immediate' | 'staged' | 'gradual';
    /** Staging configuration for staged execution */
    staging?: {
      /** Number of stages */
      stages: number;
      /** Delay between stages */
      stageDelay: string;
    };
    /** Gradual configuration for gradual execution */
    gradual?: {
      /** Change rate per period */
      changeRatePerPeriod: number;
      /** Execution period duration */
      periodDuration: string;
    };
  };
}
/**
 * Rebalancing analysis result
 */
export interface RebalancingAnalysis {
  /** Analysis timestamp */
  timestamp: Date;
  /** Rebalancing required indicator */
  rebalancingRequired: boolean;
  /** Triggered conditions */
  triggeredConditions: RebalancingTrigger[];
  /** Current resource states */
  resourceStates: ResourceState[];
  /** Recommended rebalancing actions */
  recommendedActions: RebalancingAction[];
  /** Risk assessment */
  riskAssessment: RebalancingRiskAssessment;
  /** Expected outcomes */
  expectedOutcomes: RebalancingOutcome;
  /** Analysis confidence */
  confidence: number;
}
/**
 * Resource state information
 */
export interface ResourceState {
  /** Resource identifier */
  resourceId: string;
  /** Current allocation */
  currentAllocation: number;
  /** Current utilization */
  currentUtilization: number;
  /** Performance metrics */
  performanceMetrics: Record<string, number>;
  /** Recent trends */
  trends: {
    /** Allocation trend */
    allocation: 'increasing' | 'decreasing' | 'stable';
    /** Utilization trend */
    utilization: 'increasing' | 'decreasing' | 'stable';
    /** Performance trend */
    performance: 'improving' | 'degrading' | 'stable';
  };
  /** State health */
  health: 'healthy' | 'warning' | 'critical';
  /** Last rebalancing timestamp */
  lastRebalanced: Date;
}
/**
 * Rebalancing action recommendation
 */
export interface RebalancingAction {
  /** Action type */
  type: 'increase' | 'decrease' | 'maintain' | 'redistribute';
  /** Target resource */
  resourceId: string;
  /** Current allocation */
  currentAllocation: number;
  /** Recommended allocation */
  recommendedAllocation: number;
  /** Change amount */
  changeAmount: number;
  /** Change percentage */
  changePercentage: number;
  /** Action priority */
  priority: 'immediate' | 'high' | 'medium' | 'low';
  /** Action rationale */
  rationale: string;
  /** Expected impact */
  expectedImpact: {
    /** Performance impact */
    performance: number;
    /** Cost impact */
    cost: number;
    /** Risk impact */
    risk: number;
  };
  /** Implementation timeline */
  timeline: string;
  /** Prerequisites */
  prerequisites: string[];
}
/**
 * Rebalancing risk assessment
 */
export interface RebalancingRiskAssessment {
  /** Overall risk level */
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  /** Risk score (0-100) */
  riskScore: number;
  /** Individual risk factors */
  riskFactors: RiskFactor[];
  /** Mitigation recommendations */
  mitigationRecommendations: string[];
  /** Rollback plan */
  rollbackPlan: {
    /** Rollback feasible */
    feasible: boolean;
    /** Rollback steps */
    steps: string[];
    /** Rollback timeline */
    timeline: string;
  };
}
/**
 * Risk factor assessment
 */
export interface RiskFactor {
  /** Risk factor name */
  name: string;
  /** Risk level */
  level: 'low' | 'medium' | 'high' | 'critical';
  /** Risk probability */
  probability: number;
  /** Risk impact */
  impact: number;
  /** Risk description */
  description: string;
  /** Mitigation strategies */
  mitigations: string[];
}
/**
 * Rebalancing outcome prediction
 */
export interface RebalancingOutcome {
  /** Expected performance improvement */
  performanceImprovement: number;
  /** Expected cost savings */
  costSavings: number;
  /** Expected efficiency gain */
  efficiencyGain: number;
  /** Resource utilization changes */
  utilizationChanges: Record<string, number>;
  /** Implementation success probability */
  successProbability: number;
  /** Time to realize benefits */
  timeToRealizeBenefits: string;
}
/**
 * Rebalancing execution result
 */
export interface RebalancingExecutionResult {
  /** Execution identifier */
  executionId: string;
  /** Execution timestamp */
  executedAt: Date;
  /** Executed actions */
  executedActions: RebalancingAction[];
  /** Execution status */
  status: 'successful' | 'partial' | 'failed' | 'rolled_back';
  /** Execution metrics */
  metrics: {
    /** Total execution time */
    executionTime: number;
    /** Number of successful actions */
    successfulActions: number;
    /** Number of failed actions */
    failedActions: number;
  };
  /** Actual outcomes */
  actualOutcomes: {
    /** Actual performance change */
    performanceChange: number;
    /** Actual cost change */
    costChange: number;
    /** Actual efficiency change */
    efficiencyChange: number;
  };
  /** Issues encountered */
  issues: string[];
  /** Lessons learned */
  lessonsLearned: string[];
}
/**
 * Default dynamic rebalancing configuration
 */
export declare const DEFAULT_REBALANCING_CONFIG: DynamicRebalancingConfig;
/**
 * Dynamic budget rebalancer
 * Provides intelligent budget rebalancing based on real-time conditions
 */
export declare class DynamicRebalancer {
  private readonly config;
  private readonly logger;
  private executionHistory;
  private lastAnalysis?;
  /**
   * Create dynamic rebalancer instance
   * @param config - Rebalancing configuration
   * @param logger - Logger instance
   */
  constructor(
    config: Partial<DynamicRebalancingConfig> | undefined,
    logger: AllocationLogger,
  );
  /**
   * Analyze current allocation state and determine rebalancing needs
   * @param candidates - Current allocation candidates
   * @param historicalData - Historical performance data
   * @returns Rebalancing analysis
   */
  analyzeRebalancingNeeds(
    candidates: AllocationCandidate[],
    historicalData: Record<string, FeatureCostAnalysis[]>,
  ): RebalancingAnalysis;
  /**
   * Execute rebalancing actions
   * @param analysis - Rebalancing analysis with recommended actions
   * @returns Execution result
   */
  executeRebalancing(
    analysis: RebalancingAnalysis,
  ): Promise<RebalancingExecutionResult>;
  default: break;
}
/**
 * Create dynamic rebalancer instance
 * @param config - Rebalancing configuration
 * @param logger - Logger instance
 * @returns DynamicRebalancer instance
 */
export declare function createDynamicRebalancer(
  config?: Partial<DynamicRebalancingConfig>,
  logger?: AllocationLogger,
): DynamicRebalancer;
