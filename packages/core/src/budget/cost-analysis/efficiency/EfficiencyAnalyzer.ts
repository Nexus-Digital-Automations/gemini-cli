/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from &apos;node:fs/promises&apos;;
import * as path from &apos;node:path&apos;;
import type { FeatureCostEntry } from &apos;../tracking/FeatureCostTracker.js&apos;;

/**
 * Cost efficiency metric types
 */
export type EfficiencyMetricType =
  | &apos;cost_per_request&apos;
  | &apos;cost_per_token&apos;
  | &apos;cost_per_user&apos;
  | &apos;cost_per_feature&apos;
  | &apos;roi&apos;
  | &apos;value_efficiency&apos;
  | &apos;utilization_rate&apos;
  | &apos;performance_ratio&apos;
  | &apos;productivity_index&apos;
  | &apos;cost_variance&apos;;

/**
 * Business value measurement
 */
export interface BusinessValue {
  /** Revenue generated */
  revenue: number;
  /** Cost savings achieved */
  costSavings: number;
  /** Time saved in hours */
  timeSaved: number;
  /** User satisfaction score (0-10) */
  userSatisfaction: number;
  /** Features delivered */
  featuresDelivered: number;
  /** Quality improvements */
  qualityScore: number;
  /** Strategic importance (0-100) */
  strategicValue: number;
}

/**
 * ROI calculation parameters
 */
export interface ROICalculationParams {
  /** Investment cost */
  investment: number;
  /** Time period in months */
  timePeriodMonths: number;
  /** Business value generated */
  businessValue: BusinessValue;
  /** Risk factor (0-1) */
  riskFactor: number;
  /** Discount rate for NPV calculation */
  discountRate: number;
}

/**
 * Feature efficiency metrics
 */
export interface FeatureEfficiencyMetrics {
  /** Feature identifier */
  featureId: string;
  /** Feature name */
  featureName: string;
  /** Time period for analysis */
  timePeriod: {
    start: string;
    end: string;
  };
  /** Basic cost metrics */
  costMetrics: {
    totalCost: number;
    averageCostPerRequest: number;
    averageCostPerToken: number;
    costTrend: &apos;improving&apos; | 'stable&apos; | &apos;degrading&apos;;
  };
  /** Efficiency ratios */
  efficiencyRatios: {
    costPerValue: number;
    valuePerDollar: number;
    utilizationRate: number;
    performanceRatio: number;
  };
  /** ROI analysis */
  roi: {
    returnOnInvestment: number;
    paybackPeriod: number;
    netPresentValue: number;
    internalRateOfReturn: number;
  };
  /** Benchmarking scores */
  benchmarks: {
    industryPercentile: number;
    organizationPercentile: number;
    efficiency_score: number;
    grade: &apos;A' | &apos;B' | &apos;C' | &apos;D' | &apos;F';
  };
  /** Optimization opportunities */
  opportunities: {
    identifiedIssues: EfficiencyIssue[];
    potentialSavings: number;
    optimizationScore: number;
  };
}

/**
 * Efficiency issue identification
 */
export interface EfficiencyIssue {
  /** Issue identifier */
  id: string;
  /** Issue type */
  type:
    | &apos;cost_spike&apos;
    | &apos;underutilization&apos;
    | &apos;poor_roi&apos;
    | &apos;resource_waste&apos;
    | &apos;performance_degradation&apos;;
  /** Issue severity (0-1) */
  severity: number;
  /** Issue description */
  description: string;
  /** Root cause analysis */
  rootCause: string;
  /** Recommended action */
  recommendation: string;
  /** Potential cost impact */
  costImpact: number;
  /** Confidence in identification (0-1) */
  confidence: number;
  /** First detected timestamp */
  firstDetected: string;
}

/**
 * Comparative efficiency analysis
 */
export interface ComparativeEfficiency {
  /** Target feature/entity being compared */
  target: string;
  /** Comparison baseline */
  baseline: string;
  /** Efficiency comparison metrics */
  comparison: {
    costEfficiency: number; // Relative efficiency (-1 to 1)
    performanceEfficiency: number;
    valueEfficiency: number;
    overallEfficiency: number;
  };
  /** Statistical significance */
  significance: {
    pValue: number;
    confidenceInterval: [number, number];
    sampleSize: number;
  };
  /** Ranking information */
  ranking: {
    position: number;
    totalEntities: number;
    percentile: number;
  };
}

/**
 * Efficiency trend analysis
 */
export interface EfficiencyTrend {
  /** Metric being analyzed */
  metric: EfficiencyMetricType;
  /** Time series data points */
  dataPoints: Array<{
    timestamp: string;
    value: number;
    context: Record<string, unknown>;
  }>;
  /** Trend direction */
  trend: &apos;improving&apos; | 'stable&apos; | &apos;degrading&apos; | &apos;volatile&apos;;
  /** Trend strength (0-1) */
  strength: number;
  /** Seasonal patterns */
  seasonality: {
    detected: boolean;
    period: string;
    amplitude: number;
  };
  /** Forecasted values */
  forecast: Array<{
    timestamp: string;
    predicted: number;
    confidence: [number, number];
  }>;
}

/**
 * Efficiency analyzer configuration
 */
export interface EfficiencyAnalyzerConfig {
  /** Data storage directory */
  dataDir: string;
  /** Enable detailed logging */
  enableLogging: boolean;
  /** Benchmarking data sources */
  benchmarkingSources: string[];
  /** ROI calculation defaults */
  roiDefaults: {
    discountRate: number;
    riskFactor: number;
    timePeriodMonths: number;
  };
  /** Efficiency thresholds */
  thresholds: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
}

/**
 * Advanced cost efficiency and ROI analysis system
 *
 * Provides comprehensive efficiency metrics, ROI calculations, and
 * optimization recommendations for features and operations.
 */
export class EfficiencyAnalyzer {
  private config: EfficiencyAnalyzerConfig;
  private benchmarkDataFile: string;
  private efficiencyHistoryFile: string;

  constructor(config: EfficiencyAnalyzerConfig) {
    this.config = {
      benchmarkingSources: [],
      roiDefaults: {
        discountRate: 0.1, // 10%
        riskFactor: 0.15, // 15%
        timePeriodMonths: 12,
      },
      thresholds: {
        excellent: 0.9,
        good: 0.75,
        fair: 0.6,
        poor: 0.4,
      },
      ...config,
    };
    this.benchmarkDataFile = path.join(
      this.config.dataDir,
      &apos;benchmark-_data.json&apos;,
    );
    this.efficiencyHistoryFile = path.join(
      this.config.dataDir,
      &apos;efficiency-history.jsonl&apos;,
    );
  }

  /**
   * Analyze feature efficiency metrics
   */
  async analyzeFeatureEfficiency(
    featureId: string,
    costs: FeatureCostEntry[],
    _businessValue: BusinessValue,
    timePeriod: { start: string; end: string },
  ): Promise<FeatureEfficiencyMetrics> {
    const logger = this.getLogger();
    logger.info(
      &apos;EfficiencyAnalyzer.analyzeFeatureEfficiency - Analyzing feature efficiency&apos;,
      {
        featureId,
        costsCount: costs.length,
        timePeriod,
      },
    );

    try {
      const totalCost = costs.reduce((sum, cost) => sum + cost.cost, 0);
      const _totalTokens = costs.reduce(
        (sum, cost) => sum + (cost.tokens || 0),
        0,
      );
      const _requestCount = costs.length;

      const featureName = costs[0]?.featureName || featureId;

      // Calculate basic cost metrics
      const costMetrics = this.calculateCostMetrics(costs);

      // Calculate efficiency ratios
      const efficiencyRatios = this.calculateEfficiencyRatios(
        costs,
        _businessValue,
      );

      // Calculate ROI analysis
      const roi = this.calculateROI({
        investment: totalCost,
        timePeriodMonths: this.config.roiDefaults.timePeriodMonths,
        _businessValue,
        riskFactor: this.config.roiDefaults.riskFactor,
        discountRate: this.config.roiDefaults.discountRate,
      });

      // Get benchmark scores
      const benchmarks = await this.calculateBenchmarks(
        featureId,
        costMetrics,
        efficiencyRatios,
      );

      // Identify optimization opportunities
      const opportunities = await this.identifyOptimizationOpportunities(
        costs,
        _businessValue,
      );

      const metrics: FeatureEfficiencyMetrics = {
        featureId,
        featureName,
        timePeriod,
        costMetrics,
        efficiencyRatios,
        roi,
        benchmarks,
        opportunities,
      };

      // Record metrics for historical analysis
      await this.recordEfficiencyMetrics(metrics);

      logger.info(
        &apos;EfficiencyAnalyzer.analyzeFeatureEfficiency - Analysis completed&apos;,
        {
          featureId,
          totalCost,
          roiValue: roi.returnOnInvestment,
          efficiencyScore: benchmarks.efficiency_score,
        },
      );

      return metrics;
    } catch (_error) {
      logger.error(
        &apos;EfficiencyAnalyzer.analyzeFeatureEfficiency - Analysis failed&apos;,
        {
          _error: error instanceof Error ? error.message : String(_error),
          featureId,
        },
      );
      throw error;
    }
  }

  /**
   * Compare efficiency between multiple features
   */
  async compareFeatureEfficiency(
    _features: Array<{
      featureId: string;
      costs: FeatureCostEntry[];
      businessValue: BusinessValue;
    }>,
  ): Promise<ComparativeEfficiency[]> {
    const logger = this.getLogger();
    logger.info(
      &apos;EfficiencyAnalyzer.compareFeatureEfficiency - Comparing _features&apos;,
      {
        featureCount: features.length,
      },
    );

    try {
      // Calculate efficiency metrics for each feature
      const featureMetrics = await Promise.all(
        _features.map(async (feature) => {
          const timePeriod = {
            start: new Date(
              Math.min(
                ...feature.costs.map((c) => new Date(c.timestamp).getTime()),
              ),
            ).toISOString(),
            end: new Date(
              Math.max(
                ...feature.costs.map((c) => new Date(c.timestamp).getTime()),
              ),
            ).toISOString(),
          };
          return this.analyzeFeatureEfficiency(
            feature.featureId,
            feature.costs,
            feature._businessValue,
            timePeriod,
          );
        }),
      );

      // Calculate comparative efficiency
      const comparisons: ComparativeEfficiency[] = [];

      for (let i = 0; i < featureMetrics.length; i++) {
        const target = featureMetrics[i];

        // Compare against the best performing feature (baseline)
        const baseline = featureMetrics.reduce((best, current) =>
          current.benchmarks.efficiency_score > best.benchmarks.efficiency_score
            ? current
            : best,
        );

        const comparison = this.calculateComparativeEfficiency(
          target,
          baseline,
          featureMetrics,
        );
        comparisons.push(comparison);
      }

      logger.info(
        &apos;EfficiencyAnalyzer.compareFeatureEfficiency - Comparison completed&apos;,
        {
          comparisonsCount: comparisons.length,
        },
      );

      return comparisons;
    } catch (_error) {
      logger.error(
        &apos;EfficiencyAnalyzer.compareFeatureEfficiency - Comparison failed&apos;,
        {
          _error: error instanceof Error ? error.message : String(_error),
        },
      );
      throw error;
    }
  }

  /**
   * Analyze efficiency trends over time
   */
  async analyzeEfficiencyTrends(
    featureId: string,
    metric: EfficiencyMetricType,
    timeRange: { start: string; end: string },
  ): Promise<EfficiencyTrend> {
    const logger = this.getLogger();
    logger.info(
      &apos;EfficiencyAnalyzer.analyzeEfficiencyTrends - Analyzing trends&apos;,
      {
        featureId,
        metric,
        timeRange,
      },
    );

    try {
      // Load historical efficiency data
      const historicalData = await this.loadHistoricalEfficiencyData(
        featureId,
        timeRange,
      );

      // Extract metric data points
      const _dataPoints = historicalData
        .map((record) => ({
          timestamp: record.timestamp,
          value: this.extractMetricValue(record, metric),
          context: { featureId: record.featureId },
        }))
        .filter((point) => point.value !== null)
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );

      // Analyze trend direction and strength
      const trendAnalysis = this.analyzeTrendDirection(_dataPoints);

      // Detect seasonality
      const seasonality = this.detectSeasonality(_dataPoints);

      // Generate forecast
      const forecast = this.generateForecast(_dataPoints, 30); // 30 day forecast

      const trend: EfficiencyTrend = {
        metric,
        dataPoints,
        trend: trendAnalysis.direction,
        strength: trendAnalysis.strength,
        seasonality,
        forecast,
      };

      logger.info(
        &apos;EfficiencyAnalyzer.analyzeEfficiencyTrends - Trend analysis completed&apos;,
        {
          dataPointsCount: _dataPoints.length,
          trend: trendAnalysis.direction,
          strength: trendAnalysis.strength,
        },
      );

      return trend;
    } catch (_error) {
      logger.error(
        &apos;EfficiencyAnalyzer.analyzeEfficiencyTrends - Trend analysis failed&apos;,
        {
          _error: error instanceof Error ? error.message : String(_error),
          featureId,
          metric,
        },
      );
      throw error;
    }
  }

  /**
   * Calculate basic cost metrics
   */
  private calculateCostMetrics(
    costs: FeatureCostEntry[],
  ): FeatureEfficiencyMetrics[&apos;costMetrics&apos;] {
    const totalCost = costs.reduce((sum, cost) => sum + cost.cost, 0);
    const _totalTokens = costs.reduce(
      (sum, cost) => sum + (cost.tokens || 0),
      0,
    );
    const _requestCount = costs.length;

    // Calculate cost trend
    const sortedCosts = costs.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    const firstHalfCosts = sortedCosts.slice(
      0,
      Math.floor(sortedCosts.length / 2),
    );
    const secondHalfCosts = sortedCosts.slice(
      Math.floor(sortedCosts.length / 2),
    );

    const firstHalfAvg =
      firstHalfCosts.reduce((sum, c) => sum + c.cost, 0) /
      firstHalfCosts.length;
    const secondHalfAvg =
      secondHalfCosts.reduce((sum, c) => sum + c.cost, 0) /
      secondHalfCosts.length;

    let costTrend: &apos;improving&apos; | 'stable&apos; | &apos;degrading&apos;;
    if (secondHalfAvg < firstHalfAvg * 0.95) {
      costTrend = &apos;improving&apos;;
    } else if (secondHalfAvg > firstHalfAvg * 1.05) {
      costTrend = &apos;degrading&apos;;
    } else {
      costTrend = 'stable&apos;;
    }

    return {
      totalCost,
      averageCostPerRequest: totalCost / requestCount,
      averageCostPerToken: totalTokens > 0 ? totalCost / totalTokens : 0,
      costTrend,
    };
  }

  /**
   * Calculate efficiency ratios
   */
  private calculateEfficiencyRatios(
    costs: FeatureCostEntry[],
    _businessValue: BusinessValue,
  ): FeatureEfficiencyMetrics[&apos;efficiencyRatios&apos;] {
    const totalCost = costs.reduce((sum, cost) => sum + cost.cost, 0);
    const totalValue = this.calculateTotalBusinessValue(_businessValue);

    return {
      costPerValue: totalValue > 0 ? totalCost / totalValue : Infinity,
      valuePerDollar: totalCost > 0 ? totalValue / totalCost : 0,
      utilizationRate: this.calculateUtilizationRate(costs, _businessValue),
      performanceRatio: this.calculatePerformanceRatio(costs, _businessValue),
    };
  }

  /**
   * Calculate ROI metrics
   */
  private calculateROI(
    params: ROICalculationParams,
  ): FeatureEfficiencyMetrics[&apos;roi&apos;] {
    const totalValue = this.calculateTotalBusinessValue(params._businessValue);
    const adjustedValue = totalValue * (1 - params.riskFactor);

    // Return on Investment
    const roi =
      params.investment > 0
        ? ((adjustedValue - params.investment) / params.investment) * 100
        : 0;

    // Payback Period (simplified)
    const monthlyReturn = adjustedValue / params.timePeriodMonths;
    const paybackPeriod =
      monthlyReturn > 0 ? params.investment / monthlyReturn : Infinity;

    // Net Present Value
    const npv = this.calculateNPV(
      params.investment,
      adjustedValue,
      params.discountRate,
      params.timePeriodMonths,
    );

    // Internal Rate of Return (simplified approximation)
    const irr = this.calculateIRR(
      params.investment,
      adjustedValue,
      params.timePeriodMonths,
    );

    return {
      returnOnInvestment: roi,
      paybackPeriod,
      netPresentValue: npv,
      internalRateOfReturn: irr,
    };
  }

  /**
   * Calculate benchmarks against industry and organization standards
   */
  private async calculateBenchmarks(
    featureId: string,
    costMetrics: FeatureEfficiencyMetrics[&apos;costMetrics&apos;],
    efficiencyRatios: FeatureEfficiencyMetrics[&apos;efficiencyRatios&apos;],
  ): Promise<FeatureEfficiencyMetrics[&apos;benchmarks&apos;]> {
    try {
      const benchmarkData = await this.loadBenchmarkData();

      // Calculate efficiency score (0-1)
      const efficiency_score =
        (1 / (1 + costMetrics.averageCostPerRequest)) * 0.3 +
        efficiencyRatios.valuePerDollar * 0.3 +
        efficiencyRatios.utilizationRate * 0.2 +
        efficiencyRatios.performanceRatio * 0.2;

      // Determine grade
      let grade: &apos;A' | &apos;B' | &apos;C' | &apos;D' | &apos;F';
      if (efficiency_score >= this.config.thresholds.excellent) grade = &apos;A';
      else if (efficiency_score >= this.config.thresholds.good) grade = &apos;B';
      else if (efficiency_score >= this.config.thresholds.fair) grade = &apos;C';
      else if (efficiency_score >= this.config.thresholds.poor) grade = &apos;D';
      else grade = &apos;F';

      return {
        industryPercentile: this.calculatePercentile(
          efficiency_score,
          benchmarkData.industry,
        ),
        organizationPercentile: this.calculatePercentile(
          efficiency_score,
          benchmarkData.organization,
        ),
        efficiency_score,
        grade,
      };
    } catch (_error) {
      return {
        industryPercentile: 50, // Default to median
        organizationPercentile: 50,
        efficiency_score: 0.5,
        grade: &apos;C',
      };
    }
  }

  /**
   * Identify optimization opportunities
   */
  private async identifyOptimizationOpportunities(
    costs: FeatureCostEntry[],
    _businessValue: BusinessValue,
  ): Promise<FeatureEfficiencyMetrics[&apos;opportunities&apos;]> {
    const issues: EfficiencyIssue[] = [];
    let potentialSavings = 0;

    // Analyze cost spikes
    const costSpikes = this.detectCostSpikes(costs);
    for (const spike of costSpikes) {
      issues.push({
        id: `cost-spike-${Date.now()}`,
        type: &apos;cost_spike&apos;,
        severity: spike.severity,
        description: `Cost spike detected: ${spike.increase}% increase`,
        rootCause: &apos;Unusual cost pattern detected in usage data&apos;,
        recommendation: &apos;Investigate cause and implement cost controls&apos;,
        costImpact: spike.cost,
        confidence: 0.8,
        firstDetected: spike.timestamp,
      });
      potentialSavings += spike.cost * 0.3; // Assume 30% recoverable
    }

    // Analyze underutilization
    const utilizationRate = this.calculateUtilizationRate(costs, _businessValue);
    if (utilizationRate < 0.6) {
      issues.push({
        id: `underutilization-${Date.now()}`,
        type: &apos;underutilization&apos;,
        severity: 1 - utilizationRate,
        description: `Low utilization rate: ${(utilizationRate * 100).toFixed(1)}%`,
        rootCause: &apos;Feature not being used to full potential&apos;,
        recommendation:
          &apos;Improve feature adoption or reduce resource allocation&apos;,
        costImpact:
          costs.reduce((sum, c) => sum + c.cost, 0) * (1 - utilizationRate),
        confidence: 0.7,
        firstDetected: new Date().toISOString(),
      });
      potentialSavings +=
        costs.reduce((sum, c) => sum + c.cost, 0) * (1 - utilizationRate) * 0.5;
    }

    // Check ROI performance
    const roi = this.calculateROI({
      investment: costs.reduce((sum, c) => sum + c.cost, 0),
      timePeriodMonths: 1,
      businessValue,
      riskFactor: 0.15,
      discountRate: 0.1,
    });

    if (roi.returnOnInvestment < 0) {
      issues.push({
        id: `poor-roi-${Date.now()}`,
        type: &apos;poor_roi&apos;,
        severity: Math.min(Math.abs(roi.returnOnInvestment) / 100, 1),
        description: `Negative ROI: ${roi.returnOnInvestment.toFixed(1)}%`,
        rootCause: &apos;Investment costs exceed generated value&apos;,
        recommendation:
          &apos;Review feature value proposition and optimization options&apos;,
        costImpact:
          (Math.abs(roi.returnOnInvestment) / 100) *
          costs.reduce((sum, c) => sum + c.cost, 0),
        confidence: 0.6,
        firstDetected: new Date().toISOString(),
      });
    }

    const optimizationScore = Math.max(0, 1 - issues.length * 0.2); // Decrease by 20% per issue

    return {
      identifiedIssues: issues,
      potentialSavings,
      optimizationScore,
    };
  }

  /**
   * Calculate comparative efficiency between features
   */
  private calculateComparativeEfficiency(
    target: FeatureEfficiencyMetrics,
    baseline: FeatureEfficiencyMetrics,
    allFeatures: FeatureEfficiencyMetrics[],
  ): ComparativeEfficiency {
    const costEff =
      baseline.costMetrics.averageCostPerRequest > 0
        ? (baseline.costMetrics.averageCostPerRequest -
            target.costMetrics.averageCostPerRequest) /
          baseline.costMetrics.averageCostPerRequest
        : 0;

    const perfEff =
      baseline.efficiencyRatios.performanceRatio > 0
        ? (target.efficiencyRatios.performanceRatio -
            baseline.efficiencyRatios.performanceRatio) /
          baseline.efficiencyRatios.performanceRatio
        : 0;

    const valueEff =
      baseline.efficiencyRatios.valuePerDollar > 0
        ? (target.efficiencyRatios.valuePerDollar -
            baseline.efficiencyRatios.valuePerDollar) /
          baseline.efficiencyRatios.valuePerDollar
        : 0;

    const overallEff = (costEff + perfEff + valueEff) / 3;

    // Calculate ranking
    const sortedFeatures = allFeatures.sort(
      (a, b) => b.benchmarks.efficiency_score - a.benchmarks.efficiency_score,
    );
    const position =
      sortedFeatures.findIndex((f) => f.featureId === target.featureId) + 1;
    const percentile =
      ((allFeatures.length - position + 1) / allFeatures.length) * 100;

    return {
      target: target.featureId,
      baseline: baseline.featureId,
      comparison: {
        costEfficiency: costEff,
        performanceEfficiency: perfEff,
        valueEfficiency: valueEff,
        overallEfficiency: overallEff,
      },
      significance: {
        pValue: 0.05, // Placeholder
        confidenceInterval: [overallEff - 0.1, overallEff + 0.1],
        sampleSize: Math.min(
          target.costMetrics.totalCost,
          baseline.costMetrics.totalCost,
        ),
      },
      ranking: {
        position,
        totalEntities: allFeatures.length,
        percentile,
      },
    };
  }

  /**
   * Calculate total business value
   */
  private calculateTotalBusinessValue(_businessValue: BusinessValue): number {
    return (
      _businessValue.revenue +
      businessValue.costSavings +
      businessValue.timeSaved * 50 + // Assume $50/hour value
      businessValue.userSatisfaction * 100 + // Scale satisfaction
      businessValue.featuresDelivered * 1000 + // Assume $1000 per feature
      businessValue.qualityScore * 500 + // Scale quality improvements
      businessValue.strategicValue * 100 // Scale strategic value
    );
  }

  /**
   * Calculate utilization rate
   */
  private calculateUtilizationRate(
    costs: FeatureCostEntry[],
    _businessValue: BusinessValue,
  ): number {
    // Simplified utilization based on consistency of usage
    const timeSpan = this.getTimeSpan(costs);
    const expectedRequests = timeSpan * 10; // Assume 10 requests per time unit optimal
    const actualRequests = costs.length;

    return Math.min(actualRequests / expectedRequests, 1.0);
  }

  /**
   * Calculate performance ratio
   */
  private calculatePerformanceRatio(
    costs: FeatureCostEntry[],
    _businessValue: BusinessValue,
  ): number {
    const avgResponseTime =
      costs.reduce((sum, cost) => sum + (cost.responseTime || 1000), 0) /
      costs.length;
    const idealResponseTime = 500; // 500ms ideal

    return Math.max(0, Math.min(1, idealResponseTime / avgResponseTime));
  }

  /**
   * Calculate Net Present Value
   */
  private calculateNPV(
    investment: number,
    futureValue: number,
    discountRate: number,
    periods: number,
  ): number {
    const monthlyRate = discountRate / 12;
    const presentValue = futureValue / Math.pow(1 + monthlyRate, periods);
    return presentValue - investment;
  }

  /**
   * Calculate Internal Rate of Return (simplified)
   */
  private calculateIRR(
    investment: number,
    futureValue: number,
    periods: number,
  ): number {
    if (investment <= 0 || periods <= 0) return 0;
    return Math.pow(futureValue / investment, 1 / periods) - 1;
  }

  /**
   * Detect cost spikes in usage data
   */
  private detectCostSpikes(costs: FeatureCostEntry[]): Array<{
    timestamp: string;
    cost: number;
    increase: number;
    severity: number;
  }> {
    const sortedCosts = costs.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    const avgCost = costs.reduce((sum, c) => sum + c.cost, 0) / costs.length;
    const spikes: Array<{
      timestamp: string;
      cost: number;
      increase: number;
      severity: number;
    }> = [];

    for (let i = 1; i < sortedCosts.length; i++) {
      const current = sortedCosts[i];
      const previous = sortedCosts[i - 1];

      if (current.cost > previous.cost * 2 && current.cost > avgCost * 1.5) {
        const increase = ((current.cost - previous.cost) / previous.cost) * 100;
        spikes.push({
          timestamp: current.timestamp,
          cost: current.cost - previous.cost,
          increase,
          severity: Math.min(increase / 1000, 1), // Cap at 1000% increase
        });
      }
    }

    return spikes;
  }

  /**
   * Get time span of cost entries
   */
  private getTimeSpan(costs: FeatureCostEntry[]): number {
    if (costs.length < 2) return 1;

    const timestamps = costs.map((c) => new Date(c.timestamp).getTime());
    const span =
      (Math.max(...timestamps) - Math.min(...timestamps)) /
      (1000 * 60 * 60 * 24); // Days
    return Math.max(span, 1);
  }

  /**
   * Analyze trend direction from data points
   */
  private analyzeTrendDirection(
    _dataPoints: Array<{ timestamp: string; value: number }>,
  ): {
    direction: &apos;improving&apos; | 'stable&apos; | &apos;degrading&apos; | &apos;volatile&apos;;
    strength: number;
  } {
    if (_dataPoints.length < 2) {
      return { direction: 'stable&apos;, strength: 0 };
    }

    // Calculate linear regression slope
    const n = dataPoints.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = dataPoints.reduce((sum, point) => sum + point.value, 0);
    const sumXY = dataPoints.reduce(
      (sum, point, _index) => sum + index * point.value,
      0,
    );
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgValue = sumY / n;

    // Calculate R-squared for trend strength
    const yMean = avgValue;
    const ssTotal = dataPoints.reduce(
      (sum, point) => sum + Math.pow(point.value - yMean, 2),
      0,
    );
    const ssRes = dataPoints.reduce((sum, point, _index) => {
      const predicted = avgValue + slope * (_index - (n - 1) / 2);
      return sum + Math.pow(point.value - predicted, 2);
    }, 0);
    const rSquared = 1 - ssRes / ssTotal;

    // Determine direction
    const slopeThreshold = avgValue * 0.01; // 1% threshold
    let direction: &apos;improving&apos; | 'stable&apos; | &apos;degrading&apos; | &apos;volatile&apos;;

    if (Math.abs(slope) < slopeThreshold) {
      direction = rSquared < 0.5 ? &apos;volatile&apos; : 'stable&apos;;
    } else {
      direction = slope > 0 ? &apos;improving&apos; : &apos;degrading&apos;;
    }

    return {
      direction,
      strength: Math.abs(rSquared),
    };
  }

  /**
   * Detect seasonality in data
   */
  private detectSeasonality(
    _dataPoints: Array<{ timestamp: string; value: number }>,
  ): {
    detected: boolean;
    period: string;
    amplitude: number;
  } {
    // Simplified seasonality detection
    // Would need more sophisticated analysis for real implementation
    return {
      detected: false,
      period: &apos;none&apos;,
      amplitude: 0,
    };
  }

  /**
   * Generate forecast for future values
   */
  private generateForecast(
    _dataPoints: Array<{ timestamp: string; value: number }>,
    forecastDays: number,
  ): Array<{
    timestamp: string;
    predicted: number;
    confidence: [number, number];
  }> {
    const trend = this.analyzeTrendDirection(_dataPoints);
    const lastPoint = dataPoints[dataPoints.length - 1];
    const avgValue =
      dataPoints.reduce((sum, point) => sum + point.value, 0) /
      dataPoints.length;

    const forecast: Array<{
      timestamp: string;
      predicted: number;
      confidence: [number, number];
    }> = [];

    for (let i = 1; i <= forecastDays; i++) {
      const futureDate = new Date(
        new Date(lastPoint.timestamp).getTime() + i * 24 * 60 * 60 * 1000,
      );
      const predicted =
        trend.direction === &apos;improving&apos;
          ? lastPoint.value * (1 + 0.01 * i) // 1% daily improvement
          : trend.direction === &apos;degrading&apos;
            ? lastPoint.value * (1 - 0.01 * i) // 1% daily degradation
            : avgValue; // Stable

      const confidenceRange = predicted * 0.1; // 10% confidence range

      forecast.push({
        timestamp: futureDate.toISOString(),
        predicted,
        confidence: [predicted - confidenceRange, predicted + confidenceRange],
      });
    }

    return forecast;
  }

  /**
   * Extract metric value from historical record
   */
  private extractMetricValue(
    record: unknown,
    metric: EfficiencyMetricType,
  ): number | null {
    switch (metric) {
      case &apos;cost_per_request&apos;:
        return record.costMetrics?.averageCostPerRequest || null;
      case &apos;cost_per_token&apos;:
        return record.costMetrics?.averageCostPerToken || null;
      case &apos;roi&apos;:
        return record.roi?.returnOnInvestment || null;
      case &apos;value_efficiency&apos;:
        return record.efficiencyRatios?.valuePerDollar || null;
      case &apos;utilization_rate&apos;:
        return record.efficiencyRatios?.utilizationRate || null;
      case &apos;performance_ratio&apos;:
        return record.efficiencyRatios?.performanceRatio || null;
      default:
        return null;
    }
  }

  /**
   * Calculate percentile ranking
   */
  private calculatePercentile(value: number, dataset: number[]): number {
    const sorted = dataset.sort((a, b) => a - b);
    const rank = sorted.filter((x) => x <= value).length;
    return (rank / sorted.length) * 100;
  }

  /**
   * Load benchmark data
   */
  private async loadBenchmarkData(): Promise<{
    industry: number[];
    organization: number[];
  }> {
    try {
      const content = await fs.readFile(this.benchmarkDataFile, &apos;utf-8&apos;);
      return JSON.parse(content);
    } catch (_error) {
      return {
        industry: [0.3, 0.5, 0.7, 0.8, 0.9], // Default benchmark data
        organization: [0.4, 0.6, 0.75, 0.85, 0.95],
      };
    }
  }

  /**
   * Load historical efficiency data
   */
  private async loadHistoricalEfficiencyData(
    featureId: string,
    timeRange: { start: string; end: string },
  ): Promise<
    Array<{ timestamp: string; featureId: string; [key: string]: unknown }>
  > {
    try {
      const content = await fs.readFile(this.efficiencyHistoryFile, &apos;utf-8&apos;);
      const lines = content.trim().split(&apos;\n&apos;);

      const records: Array<{
        timestamp: string;
        featureId: string;
        [key: string]: unknown;
      }> = [];
      for (const line of lines) {
        try {
          const record = JSON.parse(line);
          if (record.featureId === featureId) {
            const recordTime = new Date(record.timestamp);
            const startTime = new Date(timeRange.start);
            const endTime = new Date(timeRange.end);

            if (recordTime >= startTime && recordTime <= endTime) {
              records.push(record);
            }
          }
        } catch {
          continue;
        }
      }

      return records;
    } catch (_error) {
      return [];
    }
  }

  /**
   * Record efficiency metrics for historical analysis
   */
  private async recordEfficiencyMetrics(
    metrics: FeatureEfficiencyMetrics,
  ): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.efficiencyHistoryFile), {
        recursive: true,
      });

      const record = {
        timestamp: new Date().toISOString(),
        featureId: metrics.featureId,
        costMetrics: metrics.costMetrics,
        efficiencyRatios: metrics.efficiencyRatios,
        roi: metrics.roi,
        benchmarks: metrics.benchmarks,
      };

      const line = JSON.stringify(record) + &apos;\n&apos;;
      await fs.appendFile(this.efficiencyHistoryFile, line);
    } catch (_error) {
      this.getLogger().error(&apos;Failed to record efficiency metrics&apos;, {
        _error: error instanceof Error ? error.message : String(_error),
      });
    }
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
 * Create a new EfficiencyAnalyzer instance
 */
export function createEfficiencyAnalyzer(
  config: EfficiencyAnalyzerConfig,
): EfficiencyAnalyzer {
  return new EfficiencyAnalyzer(config);
}
