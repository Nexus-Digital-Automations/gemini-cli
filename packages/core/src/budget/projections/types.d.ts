/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Core interfaces for cost projection and budget alert system
 * Specialized component for advanced cost forecasting and proactive budget management
 */
/**
 * Time series data point for cost analysis
 */
export interface CostDataPoint {
  /** Timestamp of the data point */
  timestamp: Date;
  /** Cost value at this point */
  cost: number;
  /** Number of tokens used */
  tokens: number;
  /** Context about this usage */
  context?: {
    feature?: string;
    user?: string;
    model?: string;
    session?: string;
  };
}
/**
 * Statistical measures for cost analysis
 */
export interface StatisticalMeasures {
  /** Mean cost over the period */
  mean: number;
  /** Standard deviation */
  standardDeviation: number;
  /** Variance */
  variance: number;
  /** Median cost */
  median: number;
  /** 95th percentile */
  percentile95: number;
  /** Minimum cost */
  min: number;
  /** Maximum cost */
  max: number;
  /** Coefficient of variation (volatility measure) */
  coefficientOfVariation: number;
}
/**
 * Trend analysis results
 */
export interface TrendAnalysis {
  /** Linear regression slope (cost change per day) */
  slope: number;
  /** Y-intercept of the trend line */
  intercept: number;
  /** R-squared correlation coefficient (0-1) */
  correlation: number;
  /** Direction of the trend */
  direction: 'increasing' | 'decreasing' | 'stable';
  /** Confidence level of the trend analysis */
  confidence: number;
  /** Statistical significance */
  pValue: number;
}
/**
 * Moving average configuration and results
 */
export interface MovingAverageAnalysis {
  /** Configuration */
  config: {
    /** Window size in days */
    windowSize: number;
    /** Type of moving average */
    type: 'simple' | 'exponential' | 'weighted';
    /** Smoothing factor for exponential moving average */
    alpha?: number;
  };
  /** Moving average values */
  values: Array<{
    date: Date;
    value: number;
    rawValue: number;
  }>;
  /** Current trend based on moving average */
  currentTrend: 'up' | 'down' | 'flat';
}
/**
 * Seasonal pattern analysis
 */
export interface SeasonalAnalysis {
  /** Detected seasonal patterns */
  patterns: Array<{
    /** Pattern type */
    type: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    /** Strength of the pattern (0-1) */
    strength: number;
    /** Peak periods within the cycle */
    peaks: number[];
    /** Low periods within the cycle */
    troughs: number[];
  }>;
  /** Overall seasonality strength */
  seasonalityStrength: number;
  /** Deseasonalized trend */
  deseasonalizedTrend: TrendAnalysis;
}
/**
 * Cost projection results
 */
export interface CostProjection {
  /** Projection metadata */
  metadata: {
    /** Algorithm used for projection */
    algorithm:
      | 'linear_regression'
      | 'exponential_smoothing'
      | 'seasonal_arima'
      | 'ensemble';
    /** Projection date range */
    projectionPeriod: {
      start: Date;
      end: Date;
    };
    /** Confidence interval */
    confidenceInterval: number;
    /** Data quality score */
    dataQualityScore: number;
  };
  /** Projected cost values */
  projectedCosts: Array<{
    date: Date;
    projectedCost: number;
    lowerBound: number;
    upperBound: number;
    confidence: number;
  }>;
  /** Summary statistics */
  summary: {
    /** Total projected cost for the period */
    totalProjectedCost: number;
    /** Average daily projected cost */
    averageDailyCost: number;
    /** Expected budget burn rate */
    burnRatePerDay: number;
    /** Estimated budget runway in days */
    budgetRunwayDays: number;
  };
  /** Accuracy metrics (if historical validation data available) */
  accuracyMetrics?: {
    /** Mean Absolute Percentage Error */
    mape: number;
    /** Root Mean Square Error */
    rmse: number;
    /** Mean Absolute Error */
    mae: number;
  };
}
/**
 * Budget alert configuration
 */
export interface BudgetAlertConfig {
  /** Alert identifier */
  id: string;
  /** Alert name */
  name: string;
  /** Alert description */
  description: string;
  /** Threshold configuration */
  threshold: {
    /** Threshold type */
    type: 'percentage' | 'absolute' | 'rate' | 'projection';
    /** Threshold value */
    value: number;
    /** Comparison operator */
    operator:
      | 'greater_than'
      | 'less_than'
      | 'equals'
      | 'greater_than_or_equal'
      | 'less_than_or_equal';
    /** Time window for evaluation */
    timeWindow?: 'daily' | 'weekly' | 'monthly' | 'rolling_24h' | 'rolling_7d';
  };
  /** Alert severity */
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  /** Alert channels */
  channels: Array<'console' | 'email' | 'slack' | 'webhook' | 'file'>;
  /** Escalation rules */
  escalation?: {
    /** Time to escalate if not acknowledged */
    escalateAfterMinutes: number;
    /** Escalated severity */
    escalatedSeverity: BudgetAlertConfig['severity'];
    /** Additional channels for escalation */
    escalatedChannels: BudgetAlertConfig['channels'];
  };
  /** Suppression rules to prevent alert fatigue */
  suppression: {
    /** Minimum time between alerts of the same type */
    cooldownMinutes: number;
    /** Maximum alerts per hour */
    maxAlertsPerHour: number;
  };
}
/**
 * Budget alert event
 */
export interface BudgetAlert {
  /** Alert metadata */
  id: string;
  alertConfigId: string;
  timestamp: Date;
  severity: BudgetAlertConfig['severity'];
  /** Alert details */
  title: string;
  message: string;
  /** Triggering data */
  triggerData: {
    /** Current value that triggered the alert */
    currentValue: number;
    /** Threshold that was exceeded */
    threshold: number;
    /** Percentage of threshold exceeded */
    thresholdPercentage: number;
    /** Related cost projection if applicable */
    relatedProjection?: CostProjection;
  };
  /** Context information */
  context: {
    /** Budget information */
    budget: {
      total: number;
      used: number;
      remaining: number;
      percentageUsed: number;
    };
    /** Recent usage trend */
    recentTrend: TrendAnalysis;
    /** Projected impact */
    projectedImpact?: {
      estimatedOverage: number;
      daysUntilBudgetExhaustion: number;
    };
  };
  /** Recommended actions */
  recommendations: Array<{
    action: string;
    impact: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
  }>;
  /** Alert status */
  status: 'active' | 'acknowledged' | 'resolved' | 'suppressed';
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}
/**
 * Variance detection result
 */
export interface VarianceDetection {
  /** Detection metadata */
  timestamp: Date;
  algorithm:
    | 'z_score'
    | 'iqr'
    | 'isolation_forest'
    | 'moving_average_deviation';
  /** Detected variances */
  variances: Array<{
    /** Data point that shows variance */
    dataPoint: CostDataPoint;
    /** Variance score (higher = more anomalous) */
    varianceScore: number;
    /** Expected value based on trend/pattern */
    expectedValue: number;
    /** Actual deviation from expected */
    deviation: number;
    /** Deviation as percentage of expected */
    deviationPercentage: number;
    /** Variance type */
    varianceType: 'spike' | 'drop' | 'drift' | 'outlier';
    /** Confidence in the detection */
    confidence: number;
  }>;
  /** Overall variance summary */
  summary: {
    totalVariances: number;
    averageVarianceScore: number;
    maxVarianceScore: number;
    significantVariances: number;
  };
}
/**
 * Burn rate analysis
 */
export interface BurnRateAnalysis {
  /** Current burn rate (cost per day) */
  currentBurnRate: number;
  /** Average burn rate over analysis period */
  averageBurnRate: number;
  /** Burn rate trend */
  burnRateTrend: TrendAnalysis;
  /** Budget runway analysis */
  runway: {
    /** Days until budget exhaustion at current burn rate */
    currentRateDays: number;
    /** Days until budget exhaustion at average burn rate */
    averageRateDays: number;
    /** Days until budget exhaustion at projected burn rate */
    projectedRateDays: number;
    /** Estimated date of budget exhaustion */
    exhaustionDate: Date;
  };
  /** Burn rate by category/feature */
  categoryBreakdown?: Array<{
    category: string;
    burnRate: number;
    percentage: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }>;
}
/**
 * Optimization recommendation
 */
export interface OptimizationRecommendation {
  /** Recommendation metadata */
  id: string;
  title: string;
  description: string;
  category:
    | 'cost_reduction'
    | 'usage_optimization'
    | 'budget_reallocation'
    | 'process_improvement';
  /** Impact analysis */
  impact: {
    /** Estimated cost savings */
    estimatedSavings: number;
    /** Estimated savings percentage */
    savingsPercentage: number;
    /** Time to realize savings */
    timeToRealizeDays: number;
    /** Implementation effort */
    implementationEffort: 'low' | 'medium' | 'high';
  };
  /** Implementation details */
  implementation: {
    /** Steps to implement */
    steps: string[];
    /** Estimated implementation time */
    estimatedTimeHours: number;
    /** Required skills/resources */
    requiredResources: string[];
    /** Potential risks */
    risks: string[];
  };
  /** Priority and urgency */
  priority: 'low' | 'medium' | 'high' | 'critical';
  urgency: 'when_convenient' | 'this_week' | 'this_month' | 'immediate';
  /** Supporting data */
  supportingData: {
    /** Historical data that supports this recommendation */
    historicalEvidence: string;
    /** Confidence in the recommendation */
    confidence: number;
  };
}
/**
 * Overall cost analysis result
 */
export interface CostAnalysisResult {
  /** Analysis metadata */
  metadata: {
    analysisDate: Date;
    dataRange: {
      start: Date;
      end: Date;
    };
    dataPoints: number;
    analysisVersion: string;
  };
  /** Core analysis components */
  statistical: StatisticalMeasures;
  trend: TrendAnalysis;
  movingAverage: MovingAverageAnalysis;
  seasonal: SeasonalAnalysis;
  projection: CostProjection;
  burnRate: BurnRateAnalysis;
  variance: VarianceDetection;
  /** Active alerts */
  activeAlerts: BudgetAlert[];
  /** Optimization recommendations */
  recommendations: OptimizationRecommendation[];
  /** Overall health score */
  healthScore: {
    /** Overall budget health (0-100) */
    overall: number;
    /** Individual component scores */
    components: {
      trendHealth: number;
      varianceHealth: number;
      projectionHealth: number;
      burnRateHealth: number;
    };
  };
}
