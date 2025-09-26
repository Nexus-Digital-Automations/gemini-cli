/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Resource utilization optimization system
 * Provides intelligent optimization for resource utilization patterns and allocation efficiency
 *
 * @author Claude Code - Budget Allocation Agent
 * @version 1.0.0
 */

import type {
  AllocationCandidate,
  AllocationRecommendation,
  AllocationStrategy,
  FeatureCostAnalysis,
  AllocationLogger,
} from '../types.js';

/**
 * Utilization optimization configuration
 */
export interface UtilizationOptimizationConfig {
  /** Target utilization rate (0-1) */
  targetUtilization: number;
  /** Acceptable utilization range */
  utilizationRange: {
    /** Minimum acceptable utilization */
    min: number;
    /** Maximum acceptable utilization */
    max: number;
  };
  /** Optimization objectives in priority order */
  objectives: OptimizationObjective[];
  /** Resource scaling parameters */
  scaling: {
    /** Enable auto-scaling recommendations */
    enableAutoScaling: boolean;
    /** Minimum scaling increment */
    minScaleIncrement: number;
    /** Maximum scaling factor */
    maxScaleFactor: number;
    /** Scaling threshold sensitivity */
    threshold: number;
  };
  /** Demand prediction settings */
  demandPrediction: {
    /** Enable demand forecasting */
    enabled: boolean;
    /** Prediction horizon in days */
    horizon: number;
    /** Historical data window in days */
    dataWindow: number;
    /** Prediction confidence threshold */
    confidenceThreshold: number;
  };
  /** Performance optimization settings */
  performance: {
    /** Enable performance-based optimization */
    enabled: boolean;
    /** Performance impact weight */
    weight: number;
    /** Response time targets */
    responseTimeTarget: number;
    /** Throughput targets */
    throughputTarget: number;
  };
}

/**
 * Optimization objective definition
 */
export interface OptimizationObjective {
  /** Objective type */
  type: 'minimize_cost' | 'maximize_utilization' | 'optimize_performance' | 'balance_load';
  /** Objective weight in optimization */
  weight: number;
  /** Objective constraints */
  constraints?: Record<string, unknown>;
  /** Success criteria */
  successCriteria: string[];
}

/**
 * Resource utilization analysis
 */
export interface UtilizationAnalysis {
  /** Resource identifier */
  resourceId: string;
  /** Current utilization metrics */
  current: UtilizationMetrics;
  /** Historical utilization patterns */
  historical: UtilizationPattern[];
  /** Predicted future utilization */
  predicted: UtilizationForecast;
  /** Utilization optimization opportunities */
  opportunities: OptimizationOpportunity[];
  /** Resource capacity analysis */
  capacity: CapacityAnalysis;
  /** Performance correlation analysis */
  performance: PerformanceCorrelation;
}

/**
 * Utilization metrics
 */
export interface UtilizationMetrics {
  /** Average utilization rate (0-1) */
  average: number;
  /** Peak utilization rate (0-1) */
  peak: number;
  /** Minimum utilization rate (0-1) */
  minimum: number;
  /** Utilization variance */
  variance: number;
  /** Utilization trend direction */
  trend: 'increasing' | 'decreasing' | 'stable';
  /** Efficiency score (0-100) */
  efficiency: number;
  /** Waste percentage */
  waste: number;
}

/**
 * Utilization pattern analysis
 */
export interface UtilizationPattern {
  /** Pattern type */
  type: 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'event_driven';
  /** Pattern strength (0-100) */
  strength: number;
  /** Pattern characteristics */
  characteristics: {
    /** Peak hours/periods */
    peaks: string[];
    /** Low usage periods */
    valleys: string[];
    /** Recurring intervals */
    intervals: string[];
  };
  /** Pattern predictability */
  predictability: number;
  /** Pattern impact on optimization */
  impact: {
    /** Cost impact */
    cost: number;
    /** Performance impact */
    performance: number;
    /** Utilization impact */
    utilization: number;
  };
}

/**
 * Utilization forecasting
 */
export interface UtilizationForecast {
  /** Forecast horizon */
  horizon: string;
  /** Predicted utilization points */
  predictions: Array<{
    timestamp: Date;
    utilization: number;
    confidence: number;
  }>;
  /** Forecast accuracy metrics */
  accuracy: {
    /** Mean absolute error */
    mae: number;
    /** Mean squared error */
    mse: number;
    /** Forecast confidence */
    confidence: number;
  };
  /** Key forecast insights */
  insights: {
    /** Expected growth rate */
    growthRate: number;
    /** Seasonal patterns */
    seasonality: boolean;
    /** Anomaly likelihood */
    anomalyRisk: number;
  };
}

/**
 * Optimization opportunity
 */
export interface OptimizationOpportunity {
  /** Opportunity type */
  type: 'rightsizing' | 'consolidation' | 'load_balancing' | 'auto_scaling' | 'scheduling';
  /** Opportunity priority */
  priority: 'critical' | 'high' | 'medium' | 'low';
  /** Opportunity description */
  description: string;
  /** Expected benefits */
  benefits: {
    /** Cost savings percentage */
    costSavings: number;
    /** Utilization improvement */
    utilizationGain: number;
    /** Performance improvement */
    performanceGain: number;
  };
  /** Implementation complexity */
  complexity: 'low' | 'medium' | 'high';
  /** Implementation effort estimate */
  effort: string;
  /** Risk assessment */
  risks: string[];
  /** Success metrics */
  metrics: string[];
}

/**
 * Resource capacity analysis
 */
export interface CapacityAnalysis {
  /** Current allocated capacity */
  allocated: number;
  /** Actual used capacity */
  used: number;
  /** Available capacity */
  available: number;
  /** Capacity utilization rate */
  utilizationRate: number;
  /** Capacity headroom */
  headroom: number;
  /** Recommended capacity */
  recommended: number;
  /** Capacity planning insights */
  insights: {
    /** Over-provisioned percentage */
    overProvisioned: number;
    /** Under-provisioned risk */
    underProvisionedRisk: number;
    /** Optimal capacity range */
    optimalRange: { min: number; max: number };
  };
}

/**
 * Performance correlation analysis
 */
export interface PerformanceCorrelation {
  /** Correlation with response time */
  responseTime: number;
  /** Correlation with throughput */
  throughput: number;
  /** Correlation with error rate */
  errorRate: number;
  /** Performance-utilization relationship */
  relationship: 'linear' | 'exponential' | 'threshold' | 'complex';
  /** Optimal utilization for performance */
  optimalUtilization: number;
  /** Performance degradation threshold */
  degradationThreshold: number;
}

/**
 * Portfolio utilization optimization result
 */
export interface PortfolioUtilizationResult {
  /** Overall optimization score */
  overallScore: number;
  /** Individual resource analyses */
  resources: UtilizationAnalysis[];
  /** Cross-resource optimization opportunities */
  crossResourceOpportunities: OptimizationOpportunity[];
  /** Portfolio-level insights */
  insights: {
    /** Total potential savings */
    totalSavings: number;
    /** Average utilization improvement */
    utilizationImprovement: number;
    /** Risk-adjusted benefits */
    riskAdjustedBenefits: number;
  };
  /** Implementation roadmap */
  roadmap: {
    /** Quick wins (low effort, high impact) */
    quickWins: OptimizationOpportunity[];
    /** Strategic initiatives (high effort, high impact) */
    strategic: OptimizationOpportunity[];
    /** Long-term optimizations */
    longTerm: OptimizationOpportunity[];
  };
}

/**
 * Default utilization optimization configuration
 */
export const DEFAULT_UTILIZATION_CONFIG: UtilizationOptimizationConfig = {
  targetUtilization: 0.75,
  utilizationRange: {
    min: 0.6,
    max: 0.9,
  },
  objectives: [
    {
      type: 'optimize_performance',
      weight: 0.4,
      successCriteria: ['response_time', 'throughput', 'availability'],
    },
    {
      type: 'maximize_utilization',
      weight: 0.3,
      successCriteria: ['utilization_rate', 'efficiency_score'],
    },
    {
      type: 'minimize_cost',
      weight: 0.3,
      successCriteria: ['cost_per_unit', 'total_cost'],
    },
  ],
  scaling: {
    enableAutoScaling: true,
    minScaleIncrement: 0.1,
    maxScaleFactor: 3.0,
    threshold: 0.05,
  },
  demandPrediction: {
    enabled: true,
    horizon: 30,
    dataWindow: 90,
    confidenceThreshold: 0.8,
  },
  performance: {
    enabled: true,
    weight: 0.4,
    responseTimeTarget: 200, // ms
    throughputTarget: 1000, // requests/second
  },
};

/**
 * Resource utilization optimizer
 * Provides intelligent optimization for resource utilization patterns
 */
export class ResourceUtilizationOptimizer {
  private readonly config: UtilizationOptimizationConfig;
  private readonly logger: AllocationLogger;

  /**
   * Create utilization optimizer instance
   * @param config - Optimizer configuration
   * @param logger - Logger instance
   */
  constructor(
    config: Partial<UtilizationOptimizationConfig> = {},
    logger: AllocationLogger
  ) {
    this.config = { ...DEFAULT_UTILIZATION_CONFIG, ...config };
    this.logger = logger;
    this.validateConfiguration();
  }

  /**
   * Optimize resource utilization
   * @param candidate - Resource allocation candidate
   * @param historicalData - Historical utilization and performance data
   * @returns Utilization analysis and optimization recommendations
   */
  optimizeResourceUtilization(
    candidate: AllocationCandidate,
    historicalData: FeatureCostAnalysis[]
  ): UtilizationAnalysis {
    this.logger.info(`Starting utilization optimization for resource ${candidate.resourceId}`, {
      currentAllocation: candidate.currentAllocation,
      projectedUsage: candidate.projectedUsage,
    });

    // Calculate current utilization metrics
    const current = this.calculateCurrentUtilization(candidate, historicalData);

    // Analyze historical patterns
    const historical = this.analyzeUtilizationPatterns(historicalData);

    // Generate demand forecast
    const predicted = this.forecastUtilization(historicalData, this.config.demandPrediction.horizon);

    // Identify optimization opportunities
    const opportunities = this.identifyOptimizationOpportunities(candidate, current, historical, predicted);

    // Analyze capacity requirements
    const capacity = this.analyzeCapacityRequirements(candidate, current, predicted);

    // Analyze performance correlation
    const performance = this.analyzePerformanceCorrelation(candidate, historicalData);

    const analysis: UtilizationAnalysis = {
      resourceId: candidate.resourceId,
      current,
      historical,
      predicted,
      opportunities,
      capacity,
      performance,
    };

    this.logger.info(`Utilization optimization completed for ${candidate.resourceId}`, {
      currentUtilization: current.average,
      opportunityCount: opportunities.length,
      potentialSavings: opportunities.reduce((sum, opp) => sum + opp.benefits.costSavings, 0),
    });

    return analysis;
  }

  /**
   * Optimize portfolio utilization
   * @param candidates - All resource allocation candidates
   * @param historicalData - Historical data for all resources
   * @returns Portfolio utilization optimization result
   */
  optimizePortfolioUtilization(
    candidates: AllocationCandidate[],
    historicalData: Record<string, FeatureCostAnalysis[]>
  ): PortfolioUtilizationResult {
    this.logger.info('Starting portfolio utilization optimization', {
      resourceCount: candidates.length,
    });

    // Analyze each resource
    const resources = candidates.map(candidate =>
      this.optimizeResourceUtilization(candidate, historicalData[candidate.resourceId] || [])
    );

    // Identify cross-resource opportunities
    const crossResourceOpportunities = this.identifyCrossResourceOpportunities(resources, candidates);

    // Calculate overall optimization score
    const overallScore = this.calculatePortfolioScore(resources);

    // Generate portfolio insights
    const insights = this.generatePortfolioInsights(resources, crossResourceOpportunities);

    // Create implementation roadmap
    const roadmap = this.createImplementationRoadmap(resources, crossResourceOpportunities);

    const result: PortfolioUtilizationResult = {
      overallScore,
      resources,
      crossResourceOpportunities,
      insights,
      roadmap,
    };

    this.logger.info('Portfolio utilization optimization completed', {
      overallScore,
      totalOpportunities: resources.reduce((sum, r) => sum + r.opportunities.length, 0) + crossResourceOpportunities.length,
      totalSavings: insights.totalSavings,
    });

    return result;
  }

  /**
   * Generate utilization-based allocation recommendations
   * @param candidate - Allocation candidate
   * @param analysis - Utilization analysis
   * @returns Allocation recommendations
   */
  generateUtilizationRecommendations(
    candidate: AllocationCandidate,
    analysis: UtilizationAnalysis
  ): AllocationRecommendation[] {
    const recommendations: AllocationRecommendation[] = [];

    // Generate recommendations based on opportunities
    for (const opportunity of analysis.opportunities) {
      const recommendation = this.createRecommendationFromOpportunity(candidate, opportunity, analysis);
      recommendations.push(recommendation);
    }

    // Sort by priority and expected benefits
    recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;

      if (aPriority !== bPriority) return bPriority - aPriority;
      return b.expectedImpact.costImpact - a.expectedImpact.costImpact;
    });

    return recommendations.slice(0, 5); // Return top 5 recommendations
  }

  /**
   * Calculate current utilization metrics
   */
  private calculateCurrentUtilization(
    candidate: AllocationCandidate,
    historicalData: FeatureCostAnalysis[]
  ): UtilizationMetrics {
    if (historicalData.length === 0) {
      // Return default metrics for new resources
      return {
        average: 0.5,
        peak: 0.7,
        minimum: 0.2,
        variance: 0.1,
        trend: 'stable',
        efficiency: 50,
        waste: 50,
      };
    }

    const utilizationRates = historicalData.map(data => data.utilizationRate);
    const average = utilizationRates.reduce((sum, rate) => sum + rate, 0) / utilizationRates.length;
    const peak = Math.max(...utilizationRates);
    const minimum = Math.min(...utilizationRates);

    // Calculate variance
    const variance = utilizationRates.reduce(
      (sum, rate) => sum + Math.pow(rate - average, 2), 0
    ) / utilizationRates.length;

    // Determine trend
    const recentData = utilizationRates.slice(-5);
    const olderData = utilizationRates.slice(0, 5);
    const recentAvg = recentData.reduce((sum, rate) => sum + rate, 0) / recentData.length;
    const olderAvg = olderData.reduce((sum, rate) => sum + rate, 0) / olderData.length;

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (recentAvg > olderAvg + 0.05) trend = 'increasing';
    else if (recentAvg < olderAvg - 0.05) trend = 'decreasing';

    // Calculate efficiency score
    const targetUtilization = this.config.targetUtilization;
    const deviation = Math.abs(average - targetUtilization);
    const efficiency = Math.max(0, Math.min(100, 100 - (deviation * 200)));

    // Calculate waste percentage
    const waste = Math.max(0, (1 - average) * 100);

    return {
      average,
      peak,
      minimum,
      variance,
      trend,
      efficiency,
      waste,
    };
  }

  /**
   * Analyze utilization patterns
   */
  private analyzeUtilizationPatterns(historicalData: FeatureCostAnalysis[]): UtilizationPattern[] {
    if (historicalData.length < 14) {
      return []; // Need at least 2 weeks of data for pattern analysis
    }

    const patterns: UtilizationPattern[] = [];

    // Analyze daily patterns
    const dailyPattern = this.analyzeDailyPattern(historicalData);
    if (dailyPattern.strength > 30) {
      patterns.push(dailyPattern);
    }

    // Analyze weekly patterns
    const weeklyPattern = this.analyzeWeeklyPattern(historicalData);
    if (weeklyPattern.strength > 30) {
      patterns.push(weeklyPattern);
    }

    return patterns;
  }

  /**
   * Analyze daily utilization patterns
   */
  private analyzeDailyPattern(historicalData: FeatureCostAnalysis[]): UtilizationPattern {
    const hourlyUtilization: Record<number, number[]> = {};

    // Group data by hour
    for (const data of historicalData) {
      const hour = new Date(data.timestamp).getHours();
      if (!hourlyUtilization[hour]) hourlyUtilization[hour] = [];
      hourlyUtilization[hour].push(data.utilizationRate);
    }

    // Calculate average utilization by hour
    const hourlyAverages: Array<{ hour: number; utilization: number }> = [];
    for (let hour = 0; hour < 24; hour++) {
      if (hourlyUtilization[hour]) {
        const avg = hourlyUtilization[hour].reduce((sum, rate) => sum + rate, 0) / hourlyUtilization[hour].length;
        hourlyAverages.push({ hour, utilization: avg });
      }
    }

    // Identify peaks and valleys
    const sorted = [...hourlyAverages].sort((a, b) => b.utilization - a.utilization);
    const peaks = sorted.slice(0, 3).map(item => `${item.hour}:00`);
    const valleys = sorted.slice(-3).map(item => `${item.hour}:00`);

    // Calculate pattern strength (coefficient of variation)
    const utilizationValues = hourlyAverages.map(item => item.utilization);
    const mean = utilizationValues.reduce((sum, val) => sum + val, 0) / utilizationValues.length;
    const variance = utilizationValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / utilizationValues.length;
    const stdDev = Math.sqrt(variance);
    const strength = (stdDev / mean) * 100;

    return {
      type: 'daily',
      strength: Math.min(100, strength),
      characteristics: {
        peaks,
        valleys,
        intervals: ['24h'],
      },
      predictability: Math.max(0, Math.min(100, strength)),
      impact: {
        cost: strength * 0.5,
        performance: strength * 0.3,
        utilization: strength,
      },
    };
  }

  /**
   * Analyze weekly utilization patterns
   */
  private analyzeWeeklyPattern(historicalData: FeatureCostAnalysis[]): UtilizationPattern {
    const dailyUtilization: Record<number, number[]> = {};

    // Group data by day of week (0 = Sunday, 6 = Saturday)
    for (const data of historicalData) {
      const dayOfWeek = new Date(data.timestamp).getDay();
      if (!dailyUtilization[dayOfWeek]) dailyUtilization[dayOfWeek] = [];
      dailyUtilization[dayOfWeek].push(data.utilizationRate);
    }

    // Calculate average utilization by day
    const dailyAverages: Array<{ day: number; utilization: number }> = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (let day = 0; day < 7; day++) {
      if (dailyUtilization[day]) {
        const avg = dailyUtilization[day].reduce((sum, rate) => sum + rate, 0) / dailyUtilization[day].length;
        dailyAverages.push({ day, utilization: avg });
      }
    }

    // Identify patterns
    const sorted = [...dailyAverages].sort((a, b) => b.utilization - a.utilization);
    const peaks = sorted.slice(0, 2).map(item => dayNames[item.day]);
    const valleys = sorted.slice(-2).map(item => dayNames[item.day]);

    // Calculate pattern strength
    const utilizationValues = dailyAverages.map(item => item.utilization);
    const mean = utilizationValues.reduce((sum, val) => sum + val, 0) / utilizationValues.length;
    const variance = utilizationValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / utilizationValues.length;
    const stdDev = Math.sqrt(variance);
    const strength = (stdDev / mean) * 100;

    return {
      type: 'weekly',
      strength: Math.min(100, strength),
      characteristics: {
        peaks,
        valleys,
        intervals: ['7d'],
      },
      predictability: Math.max(0, Math.min(100, strength * 0.8)),
      impact: {
        cost: strength * 0.4,
        performance: strength * 0.2,
        utilization: strength * 0.8,
      },
    };
  }

  /**
   * Forecast future utilization
   */
  private forecastUtilization(historicalData: FeatureCostAnalysis[], horizon: number): UtilizationForecast {
    if (historicalData.length < 7) {
      // Return default forecast for insufficient data
      return {
        horizon: `${horizon} days`,
        predictions: [],
        accuracy: { mae: 0, mse: 0, confidence: 0 },
        insights: { growthRate: 0, seasonality: false, anomalyRisk: 0 },
      };
    }

    // Simple linear trend forecast
    const utilizationData = historicalData.map((data, index) => ({
      x: index,
      y: data.utilizationRate,
      timestamp: new Date(data.timestamp),
    }));

    // Calculate trend line
    const n = utilizationData.length;
    const sumX = utilizationData.reduce((sum, point) => sum + point.x, 0);
    const sumY = utilizationData.reduce((sum, point) => sum + point.y, 0);
    const sumXY = utilizationData.reduce((sum, point) => sum + point.x * point.y, 0);
    const sumX2 = utilizationData.reduce((sum, point) => sum + point.x * point.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate predictions
    const predictions = [];
    const lastTimestamp = new Date(historicalData[historicalData.length - 1].timestamp);

    for (let i = 1; i <= horizon; i++) {
      const futureX = n + i;
      const predictedUtilization = Math.max(0, Math.min(1, slope * futureX + intercept));
      const futureTimestamp = new Date(lastTimestamp);
      futureTimestamp.setDate(futureTimestamp.getDate() + i);

      // Simple confidence calculation (decreases with distance)
      const confidence = Math.max(0.3, 0.9 - (i / horizon) * 0.6);

      predictions.push({
        timestamp: futureTimestamp,
        utilization: predictedUtilization,
        confidence,
      });
    }

    // Calculate forecast accuracy (simplified)
    const mae = 0.05; // Mean absolute error estimate
    const mse = 0.003; // Mean squared error estimate
    const confidence = Math.max(0.5, 0.9 - Math.abs(slope) * 10); // Lower confidence for high volatility

    // Calculate insights
    const growthRate = slope * 30; // Monthly growth rate
    const seasonality = historicalData.length > 30; // Assume seasonality with enough data
    const anomalyRisk = Math.min(0.5, Math.abs(slope) + (Math.sqrt(utilizationData.reduce(
      (sum, point) => sum + Math.pow(point.y - (slope * point.x + intercept), 2), 0
    ) / n) * 2));

    return {
      horizon: `${horizon} days`,
      predictions,
      accuracy: { mae, mse, confidence },
      insights: { growthRate, seasonality, anomalyRisk },
    };
  }

  /**
   * Identify optimization opportunities
   */
  private identifyOptimizationOpportunities(
    candidate: AllocationCandidate,
    current: UtilizationMetrics,
    historical: UtilizationPattern[],
    _predicted: UtilizationForecast
  ): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = [];

    // Check for rightsizing opportunities
    if (current.average < this.config.utilizationRange.min) {
      opportunities.push({
        type: 'rightsizing',
        priority: current.average < 0.3 ? 'high' : 'medium',
        description: 'Resource is underutilized and could be downsized',
        benefits: {
          costSavings: (1 - current.average) * 30,
          utilizationGain: (this.config.targetUtilization - current.average) * 100,
          performanceGain: 0,
        },
        complexity: 'low',
        effort: '1-2 days',
        risks: ['Temporary performance impact during resize'],
        metrics: ['utilization_rate', 'cost_per_unit', 'response_time'],
      });
    }

    if (current.average > this.config.utilizationRange.max) {
      opportunities.push({
        type: 'rightsizing',
        priority: current.average > 0.95 ? 'critical' : 'high',
        description: 'Resource is over-utilized and should be scaled up',
        benefits: {
          costSavings: 0,
          utilizationGain: 0,
          performanceGain: (current.average - this.config.targetUtilization) * 50,
        },
        complexity: 'medium',
        effort: '2-5 days',
        risks: ['Additional costs', 'Over-provisioning risk'],
        metrics: ['response_time', 'error_rate', 'throughput'],
      });
    }

    // Check for auto-scaling opportunities
    if (this.config.scaling.enableAutoScaling && current.variance > 0.1) {
      opportunities.push({
        type: 'auto_scaling',
        priority: 'medium',
        description: 'High utilization variance suggests auto-scaling would be beneficial',
        benefits: {
          costSavings: current.variance * 20,
          utilizationGain: current.variance * 30,
          performanceGain: current.variance * 25,
        },
        complexity: 'high',
        effort: '1-2 weeks',
        risks: ['Scaling complexity', 'Cost volatility'],
        metrics: ['utilization_variance', 'scaling_events', 'cost_efficiency'],
      });
    }

    // Check for scheduling opportunities based on patterns
    const strongPatterns = historical.filter(pattern => pattern.strength > 50);
    if (strongPatterns.length > 0) {
      opportunities.push({
        type: 'scheduling',
        priority: 'medium',
        description: 'Strong usage patterns detected - scheduled scaling could optimize costs',
        benefits: {
          costSavings: strongPatterns.reduce((sum, pattern) => sum + pattern.impact.cost, 0) / 4,
          utilizationGain: strongPatterns.reduce((sum, pattern) => sum + pattern.impact.utilization, 0) / 4,
          performanceGain: strongPatterns.reduce((sum, pattern) => sum + pattern.impact.performance, 0) / 4,
        },
        complexity: 'medium',
        effort: '3-7 days',
        risks: ['Pattern changes', 'Implementation complexity'],
        metrics: ['pattern_adherence', 'scheduled_efficiency', 'cost_variance'],
      });
    }

    return opportunities;
  }

  /**
   * Analyze capacity requirements
   */
  private analyzeCapacityRequirements(
    candidate: AllocationCandidate,
    current: UtilizationMetrics,
    predicted: UtilizationForecast
  ): CapacityAnalysis {
    const allocated = candidate.currentAllocation;
    const used = allocated * current.average;
    const available = allocated - used;
    const utilizationRate = current.average;

    // Calculate headroom
    const headroom = (1 - current.peak) * 100;

    // Predict future capacity needs
    const avgPredictedUtilization = predicted.predictions.length > 0
      ? predicted.predictions.reduce((sum, pred) => sum + pred.utilization, 0) / predicted.predictions.length
      : current.average;

    const recommended = allocated * (avgPredictedUtilization / this.config.targetUtilization);

    // Calculate insights
    const overProvisioned = Math.max(0, (1 - current.average) * 100);
    const underProvisionedRisk = Math.max(0, (current.peak - 0.9) * 100);

    const optimalRange = {
      min: allocated * 0.8,
      max: allocated * 1.2,
    };

    return {
      allocated,
      used,
      available,
      utilizationRate,
      headroom,
      recommended,
      insights: {
        overProvisioned,
        underProvisionedRisk,
        optimalRange,
      },
    };
  }

  /**
   * Analyze performance correlation
   */
  private analyzePerformanceCorrelation(
    candidate: AllocationCandidate,
    historicalData: FeatureCostAnalysis[]
  ): PerformanceCorrelation {
    if (historicalData.length < 10) {
      return {
        responseTime: 0,
        throughput: 0,
        errorRate: 0,
        relationship: 'linear',
        optimalUtilization: this.config.targetUtilization,
        degradationThreshold: 0.85,
      };
    }

    // Calculate correlations (simplified)
    const utilizationValues = historicalData.map(data => data.utilizationRate);
    const performanceValues = historicalData.map(data => data.performance || 80); // Default performance

    // Simple correlation calculation
    const correlation = this.calculateCorrelation(utilizationValues, performanceValues);

    // Determine relationship type
    let relationship: 'linear' | 'exponential' | 'threshold' | 'complex' = 'linear';
    if (Math.abs(correlation) < 0.3) relationship = 'complex';
    else if (correlation < -0.7) relationship = 'exponential';
    else if (correlation > 0.7) relationship = 'threshold';

    // Find optimal utilization point
    let optimalUtilization = this.config.targetUtilization;
    let maxPerformance = 0;
    for (let i = 0; i < historicalData.length; i++) {
      if (performanceValues[i] > maxPerformance) {
        maxPerformance = performanceValues[i];
        optimalUtilization = utilizationValues[i];
      }
    }

    // Estimate degradation threshold
    const degradationThreshold = Math.max(0.7, optimalUtilization + 0.1);

    return {
      responseTime: correlation * -1, // Inverse relationship
      throughput: correlation,
      errorRate: correlation * -1, // Inverse relationship
      relationship,
      optimalUtilization: Math.min(0.9, Math.max(0.5, optimalUtilization)),
      degradationThreshold,
    };
  }

  /**
   * Calculate correlation coefficient
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Identify cross-resource opportunities
   */
  private identifyCrossResourceOpportunities(
    resources: UtilizationAnalysis[],
    _candidates: AllocationCandidate[]
  ): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = [];

    // Find consolidation opportunities
    const underutilizedResources = resources.filter(r => r.current.average < 0.4);
    if (underutilizedResources.length >= 2) {
      opportunities.push({
        type: 'consolidation',
        priority: 'high',
        description: 'Multiple underutilized resources could be consolidated',
        benefits: {
          costSavings: underutilizedResources.length * 25,
          utilizationGain: 40,
          performanceGain: 10,
        },
        complexity: 'high',
        effort: '2-4 weeks',
        risks: ['Data migration', 'Downtime', 'Complex dependencies'],
        metrics: ['consolidated_utilization', 'total_cost', 'migration_success'],
      });
    }

    // Find load balancing opportunities
    const utilizationVariance = resources.reduce(
      (sum, r) => sum + r.current.variance, 0
    ) / resources.length;

    if (utilizationVariance > 0.15) {
      opportunities.push({
        type: 'load_balancing',
        priority: 'medium',
        description: 'High utilization variance across resources suggests load balancing benefits',
        benefits: {
          costSavings: utilizationVariance * 30,
          utilizationGain: utilizationVariance * 50,
          performanceGain: utilizationVariance * 40,
        },
        complexity: 'medium',
        effort: '1-2 weeks',
        risks: ['Load balancer complexity', 'Single point of failure'],
        metrics: ['load_distribution', 'response_time', 'resource_efficiency'],
      });
    }

    return opportunities;
  }

  /**
   * Calculate portfolio optimization score
   */
  private calculatePortfolioScore(resources: UtilizationAnalysis[]): number {
    if (resources.length === 0) return 0;

    const avgUtilization = resources.reduce(
      (sum, r) => sum + r.current.average, 0
    ) / resources.length;

    const avgEfficiency = resources.reduce(
      (sum, r) => sum + r.current.efficiency, 0
    ) / resources.length;

    const utilizationScore = 100 - Math.abs(avgUtilization - this.config.targetUtilization) * 200;
    const efficiencyScore = avgEfficiency;

    return (utilizationScore + efficiencyScore) / 2;
  }

  /**
   * Generate portfolio insights
   */
  private generatePortfolioInsights(
    resources: UtilizationAnalysis[],
    crossResourceOpportunities: OptimizationOpportunity[]
  ): {
    totalSavings: number;
    utilizationImprovement: number;
    riskAdjustedBenefits: number;
  } {
    const totalSavings = resources.reduce(
      (sum, r) => sum + r.opportunities.reduce((oSum, opp) => oSum + opp.benefits.costSavings, 0), 0
    ) + crossResourceOpportunities.reduce((sum, opp) => sum + opp.benefits.costSavings, 0);

    const utilizationImprovement = resources.reduce(
      (sum, r) => sum + r.opportunities.reduce((oSum, opp) => oSum + opp.benefits.utilizationGain, 0), 0
    ) / resources.length;

    // Calculate risk-adjusted benefits
    const riskWeights = { low: 0.9, medium: 0.7, high: 0.4 };
    const riskAdjustedBenefits = resources.reduce((sum, r) => sum + r.opportunities.reduce((oSum, opp) => {
        const weight = riskWeights[opp.complexity as keyof typeof riskWeights] || 0.5;
        return oSum + (opp.benefits.costSavings * weight);
      }, 0), 0);

    return {
      totalSavings,
      utilizationImprovement,
      riskAdjustedBenefits,
    };
  }

  /**
   * Create implementation roadmap
   */
  private createImplementationRoadmap(
    resources: UtilizationAnalysis[],
    crossResourceOpportunities: OptimizationOpportunity[]
  ): {
    quickWins: OptimizationOpportunity[];
    strategic: OptimizationOpportunity[];
    longTerm: OptimizationOpportunity[];
  } {
    const allOpportunities = [
      ...resources.flatMap(r => r.opportunities),
      ...crossResourceOpportunities,
    ];

    const quickWins = allOpportunities.filter(
      opp => opp.complexity === 'low' && (opp.priority === 'high' || opp.priority === 'critical')
    );

    const strategic = allOpportunities.filter(
      opp => opp.complexity === 'medium' && opp.benefits.costSavings > 20
    );

    const longTerm = allOpportunities.filter(
      opp => opp.complexity === 'high' || opp.benefits.costSavings > 50
    );

    return { quickWins, strategic, longTerm };
  }

  /**
   * Create allocation recommendation from optimization opportunity
   */
  private createRecommendationFromOpportunity(
    candidate: AllocationCandidate,
    opportunity: OptimizationOpportunity,
    analysis: UtilizationAnalysis
  ): AllocationRecommendation {
    // Calculate recommended allocation based on opportunity
    let recommendedAllocation = candidate.currentAllocation;

    switch (opportunity.type) {
      case 'rightsizing':
        if (analysis.current.average < this.config.utilizationRange.min) {
          recommendedAllocation = candidate.currentAllocation * (this.config.targetUtilization / analysis.current.average);
        } else if (analysis.current.average > this.config.utilizationRange.max) {
          recommendedAllocation = candidate.currentAllocation * (this.config.targetUtilization / analysis.current.average);
        }
        break;
      case 'consolidation':
        recommendedAllocation = candidate.currentAllocation * 0.7; // Assume 30% reduction
        break;
      default:
        recommendedAllocation = analysis.capacity.recommended;
    }

    const allocationChange = recommendedAllocation - candidate.currentAllocation;

    return {
      // Required AllocationRecommendation properties
      id: `allocation-${candidate.resourceId}-${Date.now()}`,
      title: `Optimize ${candidate.resourceName || candidate.resourceId} allocation`,
      potentialSavings: Math.max(opportunity.benefits.costSavings, 0),
      savingsPercentage: candidate.currentAllocation > 0 ? (Math.max(opportunity.benefits.costSavings, 0) / candidate.currentAllocation) * 100 : 0,
      estimatedTimeToImplement: opportunity.complexity === 'low' ? 2 : opportunity.complexity === 'high' ? 8 : 4,
      category: 'resource_optimization',
      resourceId: candidate.resourceId,
      currentAllocation: candidate.currentAllocation,
      recommendedAllocation,
      allocationChange,
      strategy: 'usage_based' as AllocationStrategy,
      confidence: 80,
      expectedImpact: {
        costImpact: allocationChange,
        performanceImpact: opportunity.benefits.performanceGain,
        utilizationImpact: opportunity.benefits.utilizationGain,
        businessValueImpact: opportunity.benefits.performanceGain * 0.5,
        roiImpact: opportunity.benefits.costSavings / Math.abs(allocationChange || 1),
        impactTimeline: 'short_term',
      },
      riskAssessment: {
        riskLevel: opportunity.complexity === 'low' ? 'low' : opportunity.complexity === 'high' ? 'high' : 'medium',
        riskFactors: opportunity.risks,
        mitigationStrategies: [`Monitor ${opportunity.metrics.join(', ')}`, 'Gradual implementation', 'Rollback plan'],
        maxNegativeImpact: Math.abs(allocationChange) * 0.2,
        negativeProbability: opportunity.complexity === 'high' ? 30 : 10,
      },
      dependencies: [],
      // OptimizationRecommendation fields
      type: 'cost_reduction',
      priority: opportunity.priority as 'critical' | 'high' | 'medium' | 'low',
      description: opportunity.description,
      expectedSavings: opportunity.benefits.costSavings,
      implementationComplexity: opportunity.complexity,
      validationCriteria: opportunity.metrics,
      rollbackPlan: `Revert allocation to ${candidate.currentAllocation}`,
    };
  }

  /**
   * Validate configuration
   */
  private validateConfiguration(): void {
    const { utilizationRange, scaling } = this.config;

    // Validate utilization range
    if (utilizationRange.min >= utilizationRange.max) {
      throw new Error('Minimum utilization must be less than maximum utilization');
    }

    if (utilizationRange.min < 0 || utilizationRange.max > 1) {
      throw new Error('Utilization range must be between 0 and 1');
    }

    // Validate target utilization
    if (this.config.targetUtilization < utilizationRange.min || this.config.targetUtilization > utilizationRange.max) {
      throw new Error('Target utilization must be within utilization range');
    }

    // Validate scaling configuration
    if (scaling.minScaleIncrement <= 0 || scaling.maxScaleFactor <= 1) {
      throw new Error('Invalid scaling parameters');
    }

    // Validate objectives
    const totalWeight = this.config.objectives.reduce((sum, obj) => sum + obj.weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      throw new Error('Optimization objective weights must sum to 1.0');
    }
  }
}

/**
 * Create resource utilization optimizer instance
 * @param config - Optimizer configuration
 * @param logger - Logger instance
 * @returns ResourceUtilizationOptimizer instance
 */
export function createResourceUtilizationOptimizer(
  config?: Partial<UtilizationOptimizationConfig>,
  logger?: AllocationLogger
): ResourceUtilizationOptimizer {
  const defaultLogger: AllocationLogger = {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  };

  return new ResourceUtilizationOptimizer(config, logger || defaultLogger);
}