/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { getLogger } from '../../../logging/index.js';

/**
 * Advanced cost efficiency analysis engine for calculating ROI, efficiency metrics,
 * and identifying optimization opportunities in budget usage data
 */
export class CostEfficiencyEngine {
  /**
   * Logger instance for comprehensive debugging and monitoring
   * @type {import('../../../logging/index.js').Logger}
   */
  logger;

  /**
   * Configuration for cost efficiency analysis parameters
   * @type {Object}
   */
  config;

  /**
   * Historical efficiency baselines for comparison
   * @type {Map<string, Object>}
   */
  efficiencyBaselines = new Map();

  /**
   * Constructor for CostEfficiencyEngine
   * @param {Object} config - Configuration options for cost efficiency analysis
   */
  constructor(config = {}) {
    this.logger = getLogger('CostEfficiencyEngine');
    this.config = {
      // Efficiency thresholds
      minEfficiencyScore: 0.6, // Below this is considered inefficient
      excellentEfficiencyScore: 0.9, // Above this is excellent

      // ROI calculation parameters
      standardOperationCost: 0.001, // $0.001 per operation baseline
      targetROIPercentage: 200, // 200% ROI target

      // Business value parameters
      valuePerUser: 1.0, // $1 value per user interaction
      valuePerFeatureUsage: 0.5, // $0.5 value per feature usage
      valueDecayFactor: 0.95, // Value decreases over time

      // Cost optimization parameters
      wasteThreshold: 0.1, // 10% waste threshold
      opportunityThreshold: 0.2, // 20% opportunity threshold

      // Time-based analysis
      peakHoursPremium: 1.5, // Peak hours cost 1.5x
      offPeakDiscount: 0.7, // Off-peak hours cost 0.7x

      // Performance metrics
      enablePerformanceCorrelation: true,
      enableBenchmarking: true,
      enablePredictiveROI: true,

      ...config
    };

    this.logger.info('CostEfficiencyEngine initialized', {
      config: this.config,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Analyze cost efficiency across all dimensions
   * @param {Array} metrics - Array of usage metrics with costs, timestamps, features, users
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Comprehensive efficiency analysis
   */
  async analyzeCostEfficiency(metrics, options = {}) {
    const startTime = Date.now();
    this.logger.info('Starting cost efficiency analysis', {
      metricsCount: metrics.length,
      dateRange: this.getDateRange(metrics)
    });

    try {
      // Validate and prepare data
      const validatedMetrics = this.validateMetrics(metrics);
      if (validatedMetrics.length === 0) {
        this.logger.warn('No valid metrics for efficiency analysis');
        return this.createEmptyEfficiencyAnalysis();
      }

      // Perform comprehensive efficiency analysis
      const analysisResults = await Promise.all([
        this.calculateOverallEfficiency(validatedMetrics),
        this.analyzeFeatureEfficiency(validatedMetrics),
        this.analyzeUserEfficiency(validatedMetrics),
        this.analyzeTimeBasedEfficiency(validatedMetrics),
        this.calculateROIMetrics(validatedMetrics),
        this.identifyEfficiencyOpportunities(validatedMetrics),
        this.calculateWasteAnalysis(validatedMetrics),
        this.performBenchmarkAnalysis(validatedMetrics)
      ]);

      // Consolidate results
      const [
        overallEfficiency,
        featureEfficiency,
        userEfficiency,
        timeBasedEfficiency,
        roiMetrics,
        opportunities,
        wasteAnalysis,
        benchmarks
      ] = analysisResults;

      // Generate efficiency recommendations
      const recommendations = await this.generateEfficiencyRecommendations({
        overallEfficiency,
        featureEfficiency,
        userEfficiency,
        timeBasedEfficiency,
        roiMetrics,
        opportunities,
        wasteAnalysis,
        benchmarks
      });

      // Calculate potential savings
      const potentialSavings = this.calculatePotentialSavings(recommendations);

      const executionTime = Date.now() - startTime;
      this.logger.info('Cost efficiency analysis completed', {
        executionTime: `${executionTime}ms`,
        overallEfficiencyScore: overallEfficiency.score,
        potentialSavings: potentialSavings.total
      });

      return {
        analysisTimestamp: new Date().toISOString(),
        executionTimeMs: executionTime,
        metricsAnalyzed: validatedMetrics.length,
        dateRange: this.getDateRange(validatedMetrics),
        overallEfficiency,
        featureEfficiency,
        userEfficiency,
        timeBasedEfficiency,
        roiMetrics,
        opportunities,
        wasteAnalysis,
        benchmarks,
        recommendations,
        potentialSavings,
        summary: this.createEfficiencySummary({
          overallEfficiency,
          featureEfficiency,
          userEfficiency,
          roiMetrics,
          opportunities,
          wasteAnalysis
        })
      };
    } catch (error) {
      this.logger.error('Cost efficiency analysis failed', {
        error: error.message,
        stack: error.stack,
        executionTime: `${Date.now() - startTime}ms`
      });
      throw new Error(`Cost efficiency analysis failed: ${error.message}`);
    }
  }

  /**
   * Calculate overall efficiency metrics
   * @param {Array} metrics - Validated metrics
   * @returns {Promise<Object>} Overall efficiency analysis
   */
  async calculateOverallEfficiency(metrics) {
    this.logger.debug('Calculating overall efficiency metrics');

    const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0);
    const totalRequests = metrics.length;
    const averageCostPerRequest = totalCost / totalRequests;

    // Calculate efficiency score based on cost per value delivered
    const totalValue = await this.calculateTotalBusinessValue(metrics);
    const costEfficiencyRatio = totalValue / Math.max(totalCost, 0.001);

    // Normalize to 0-1 scale
    const efficiencyScore = Math.min(1, costEfficiencyRatio / 10); // Assuming 10:1 value:cost is perfect

    // Calculate various efficiency dimensions
    const dimensionalEfficiency = {
      cost: this.calculateCostEfficiency(metrics),
      value: this.calculateValueEfficiency(metrics, totalValue),
      utilization: this.calculateUtilizationEfficiency(metrics),
      performance: await this.calculatePerformanceEfficiency(metrics)
    };

    // Time-based efficiency trends
    const efficiencyTrend = await this.calculateEfficiencyTrend(metrics);

    // Efficiency distribution analysis
    const efficiencyDistribution = this.analyzeEfficiencyDistribution(metrics);

    return {
      score: efficiencyScore,
      grade: this.getEfficiencyGrade(efficiencyScore),
      totalCost,
      totalValue,
      costEfficiencyRatio,
      averageCostPerRequest,
      totalRequests,
      dimensionalEfficiency,
      efficiencyTrend,
      efficiencyDistribution,
      improvementPotential: Math.max(0, this.config.excellentEfficiencyScore - efficiencyScore)
    };
  }

  /**
   * Analyze efficiency by feature
   * @param {Array} metrics - Validated metrics
   * @returns {Promise<Array>} Feature efficiency analysis
   */
  async analyzeFeatureEfficiency(metrics) {
    this.logger.debug('Analyzing feature efficiency');

    const featureGroups = this.groupMetricsByDimension(metrics, 'feature');
    const efficiencyAnalysis = [];

    for (const [featureId, featureMetrics] of featureGroups.entries()) {
      if (!featureId || featureId === 'unknown') continue;

      const featureCost = featureMetrics.reduce((sum, m) => sum + m.cost, 0);
      const featureRequests = featureMetrics.length;
      const avgCostPerRequest = featureCost / featureRequests;

      // Calculate feature-specific business value
      const featureValue = await this.calculateFeatureBusinessValue(featureId, featureMetrics);
      const featureROI = featureValue > 0 ? ((featureValue - featureCost) / featureCost) * 100 : -100;

      // Calculate efficiency score
      const efficiencyRatio = featureValue / Math.max(featureCost, 0.001);
      const efficiencyScore = Math.min(1, efficiencyRatio / 5);

      // Usage patterns
      const usagePatterns = this.analyzeFeatureUsagePatterns(featureMetrics);

      // Peak usage analysis
      const peakUsage = this.analyzeFeaturePeakUsage(featureMetrics);

      // Cost trend
      const costTrend = this.analyzeCostTrend(featureMetrics);

      // Identify optimization opportunities
      const optimizationOpportunities = await this.identifyFeatureOptimizationOpportunities(
        featureId,
        featureMetrics,
        {
          cost: featureCost,
          value: featureValue,
          efficiency: efficiencyScore,
          roi: featureROI
        }
      );

      efficiencyAnalysis.push({
        featureId,
        featureName: featureId, // Could be enhanced with feature registry
        cost: featureCost,
        value: featureValue,
        requests: featureRequests,
        avgCostPerRequest,
        efficiencyScore,
        efficiencyGrade: this.getEfficiencyGrade(efficiencyScore),
        roi: featureROI,
        usagePatterns,
        peakUsage,
        costTrend,
        optimizationOpportunities
      });
    }

    return efficiencyAnalysis.sort((a, b) => b.efficiencyScore - a.efficiencyScore);
  }

  /**
   * Calculate ROI metrics with comprehensive analysis
   * @param {Array} metrics - Validated metrics
   * @returns {Promise<Object>} ROI analysis results
   */
  async calculateROIMetrics(metrics) {
    this.logger.debug('Calculating ROI metrics');

    const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0);
    const totalValue = await this.calculateTotalBusinessValue(metrics);
    const overallROI = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

    // Time-based ROI analysis
    const dailyROI = await this.calculateTimeBasedROI(metrics, 'daily');
    const weeklyROI = await this.calculateTimeBasedROI(metrics, 'weekly');
    const monthlyROI = await this.calculateTimeBasedROI(metrics, 'monthly');

    // Feature ROI breakdown
    const featureROIBreakdown = await this.calculateFeatureROI(metrics);

    // User segment ROI
    const userROIAnalysis = await this.calculateUserROI(metrics);

    // ROI trends and predictions
    const roiTrend = await this.calculateROITrend(metrics);
    const predictedROI = this.config.enablePredictiveROI
      ? await this.predictFutureROI(metrics, roiTrend)
      : null;

    // Risk-adjusted ROI
    const riskAdjustedROI = this.calculateRiskAdjustedROI(overallROI, metrics);

    // Marginal ROI analysis
    const marginalROI = await this.calculateMarginalROI(metrics);

    return {
      overallROI,
      riskAdjustedROI,
      totalInvestment: totalCost,
      totalReturn: totalValue,
      netValue: totalValue - totalCost,
      roiGrade: this.getROIGrade(overallROI),
      timeBasedROI: {
        daily: dailyROI,
        weekly: weeklyROI,
        monthly: monthlyROI
      },
      featureROIBreakdown,
      userROIAnalysis,
      roiTrend,
      predictedROI,
      marginalROI,
      targetAchievement: (overallROI / this.config.targetROIPercentage) * 100
    };
  }

  /**
   * Identify efficiency improvement opportunities
   * @param {Array} metrics - Validated metrics
   * @returns {Promise<Array>} Efficiency opportunities
   */
  async identifyEfficiencyOpportunities(metrics) {
    this.logger.debug('Identifying efficiency opportunities');

    const opportunities = [];

    // Cost reduction opportunities
    const costReductionOps = await this.identifyCostReductionOpportunities(metrics);
    opportunities.push(...costReductionOps);

    // Value enhancement opportunities
    const valueEnhancementOps = await this.identifyValueEnhancementOpportunities(metrics);
    opportunities.push(...valueEnhancementOps);

    // Utilization improvement opportunities
    const utilizationOps = await this.identifyUtilizationOpportunities(metrics);
    opportunities.push(...utilizationOps);

    // Timing optimization opportunities
    const timingOps = await this.identifyTimingOptimizationOpportunities(metrics);
    opportunities.push(...timingOps);

    // Resource allocation opportunities
    const allocationOps = await this.identifyAllocationOpportunities(metrics);
    opportunities.push(...allocationOps);

    return opportunities
      .filter(op => op.impact > this.config.opportunityThreshold)
      .sort((a, b) => b.impact - a.impact);
  }

  /**
   * Calculate comprehensive waste analysis
   * @param {Array} metrics - Validated metrics
   * @returns {Promise<Object>} Waste analysis results
   */
  async calculateWasteAnalysis(metrics) {
    this.logger.debug('Calculating waste analysis');

    // Different types of waste
    const wasteTypes = {
      duplicateRequests: this.calculateDuplicateRequestWaste(metrics),
      offPeakUnderutilization: this.calculateOffPeakWaste(metrics),
      inefficientFeatures: await this.calculateIneffcientFeatureWaste(metrics),
      oversizeOperations: this.calculateOversizeWaste(metrics),
      underutilizedCapacity: this.calculateCapacityWaste(metrics)
    };

    // Total waste calculation
    const totalWaste = Object.values(wasteTypes).reduce((sum, waste) => sum + waste.cost, 0);
    const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0);
    const wastePercentage = totalCost > 0 ? (totalWaste / totalCost) * 100 : 0;

    // Waste trend analysis
    const wasteTrend = await this.analyzeWasteTrend(metrics);

    // Actionable waste reduction items
    const wasteReductionActions = await this.generateWasteReductionActions(wasteTypes);

    return {
      totalWaste,
      wastePercentage,
      wasteTypes,
      wasteTrend,
      wasteReductionActions,
      wasteGrade: this.getWasteGrade(wastePercentage),
      potentialSavings: totalWaste * 0.8 // Assume 80% of waste can be eliminated
    };
  }

  /**
   * Helper methods for calculations and analysis
   */

  validateMetrics(metrics) {
    if (!Array.isArray(metrics)) return [];

    return metrics.filter(metric => {
      return (
        metric &&
        typeof metric.timestamp === 'string' &&
        !isNaN(new Date(metric.timestamp).getTime()) &&
        typeof metric.cost === 'number' &&
        !isNaN(metric.cost) &&
        metric.cost >= 0
      );
    });
  }

  getDateRange(metrics) {
    if (!metrics || metrics.length === 0) {
      return { start: null, end: null, days: 0 };
    }

    const timestamps = metrics
      .map(m => new Date(m.timestamp).getTime())
      .filter(t => !isNaN(t));

    if (timestamps.length === 0) {
      return { start: null, end: null, days: 0 };
    }

    const start = new Date(Math.min(...timestamps));
    const end = new Date(Math.max(...timestamps));
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return {
      start: start.toISOString(),
      end: end.toISOString(),
      days
    };
  }

  groupMetricsByDimension(metrics, dimension) {
    const groups = new Map();
    for (const metric of metrics) {
      const key = metric[dimension] || 'unknown';
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(metric);
    }
    return groups;
  }

  async calculateTotalBusinessValue(metrics) {
    // Complex business value calculation based on multiple factors
    let totalValue = 0;

    const uniqueUsers = new Set(metrics.map(m => m.user).filter(u => u)).size;
    const uniqueFeatures = new Set(metrics.map(m => m.feature).filter(f => f)).size;
    const totalInteractions = metrics.length;

    // User value contribution
    totalValue += uniqueUsers * this.config.valuePerUser;

    // Feature usage value
    totalValue += totalInteractions * this.config.valuePerFeatureUsage;

    // Time decay consideration
    const timeWeight = this.calculateTimeWeight(metrics);
    totalValue *= timeWeight;

    return totalValue;
  }

  calculateTimeWeight(metrics) {
    if (metrics.length === 0) return 1;

    const now = Date.now();
    const weights = metrics.map(m => {
      const age = (now - new Date(m.timestamp).getTime()) / (1000 * 60 * 60 * 24); // days
      return Math.pow(this.config.valueDecayFactor, age);
    });

    return weights.reduce((sum, w) => sum + w, 0) / weights.length;
  }

  calculateCostEfficiency(metrics) {
    const costs = metrics.map(m => m.cost);
    const avgCost = costs.reduce((sum, c) => sum + c, 0) / costs.length;

    // Compare to standard operation cost
    return Math.max(0, Math.min(1, this.config.standardOperationCost / avgCost));
  }

  calculateValueEfficiency(metrics, totalValue) {
    const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0);
    if (totalCost === 0) return 1;

    const valuePerDollar = totalValue / totalCost;
    // Normalize assuming 5:1 value:cost ratio is excellent
    return Math.min(1, valuePerDollar / 5);
  }

  calculateUtilizationEfficiency(metrics) {
    if (metrics.length === 0) return 0;

    // Calculate utilization based on time distribution
    const timeGroups = this.groupByTimeWindow(metrics, 'hour');
    const hoursWithActivity = timeGroups.size;
    const totalHours = this.getTotalHoursInPeriod(metrics);

    return hoursWithActivity / Math.max(totalHours, 1);
  }

  async calculatePerformanceEfficiency(metrics) {
    // Placeholder for performance correlation analysis
    // In real implementation, this would correlate with performance metrics
    return 0.75; // Default moderate efficiency
  }

  getEfficiencyGrade(score) {
    if (score >= this.config.excellentEfficiencyScore) return 'A';
    if (score >= 0.8) return 'B';
    if (score >= this.config.minEfficiencyScore) return 'C';
    if (score >= 0.4) return 'D';
    return 'F';
  }

  getROIGrade(roi) {
    if (roi >= this.config.targetROIPercentage) return 'A';
    if (roi >= this.config.targetROIPercentage * 0.8) return 'B';
    if (roi >= this.config.targetROIPercentage * 0.6) return 'C';
    if (roi >= this.config.targetROIPercentage * 0.4) return 'D';
    return 'F';
  }

  getWasteGrade(wastePercentage) {
    if (wastePercentage <= 5) return 'A';
    if (wastePercentage <= 10) return 'B';
    if (wastePercentage <= 20) return 'C';
    if (wastePercentage <= 30) return 'D';
    return 'F';
  }

  createEmptyEfficiencyAnalysis() {
    return {
      analysisTimestamp: new Date().toISOString(),
      executionTimeMs: 0,
      metricsAnalyzed: 0,
      dateRange: { start: null, end: null, days: 0 },
      overallEfficiency: { score: 0, grade: 'F' },
      featureEfficiency: [],
      userEfficiency: [],
      timeBasedEfficiency: {},
      roiMetrics: { overallROI: 0 },
      opportunities: [],
      wasteAnalysis: { totalWaste: 0, wastePercentage: 0 },
      benchmarks: {},
      recommendations: [],
      potentialSavings: { total: 0 }
    };
  }

  // Placeholder implementations for complex calculations
  // These would be fully implemented in a production system

  async calculateEfficiencyTrend(metrics) {
    // Time-based efficiency trend calculation
    return { trend: 'stable', confidence: 0.7 };
  }

  analyzeEfficiencyDistribution(metrics) {
    // Statistical distribution of efficiency across different dimensions
    return { mean: 0.7, stdDev: 0.2, percentiles: { p50: 0.7, p90: 0.9, p10: 0.5 } };
  }

  analyzeFeatureUsagePatterns(metrics) {
    // Analyze usage patterns for specific feature
    return { pattern: 'regular', frequency: 'daily', consistency: 0.8 };
  }

  analyzeFeaturePeakUsage(metrics) {
    // Identify peak usage times for feature
    return { peakHours: ['09:00', '14:00'], peakDays: ['Monday', 'Tuesday'] };
  }

  analyzeCostTrend(metrics) {
    if (metrics.length < 2) return 'stable';

    const sortedMetrics = [...metrics].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const firstHalf = sortedMetrics.slice(0, Math.floor(sortedMetrics.length / 2));
    const secondHalf = sortedMetrics.slice(Math.floor(sortedMetrics.length / 2));

    const firstAvg = firstHalf.reduce((sum, m) => sum + m.cost, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, m) => sum + m.cost, 0) / secondHalf.length;

    const change = (secondAvg - firstAvg) / firstAvg;

    if (Math.abs(change) < 0.05) return 'stable';
    return change > 0 ? 'increasing' : 'decreasing';
  }

  async identifyFeatureOptimizationOpportunities(featureId, metrics, analysis) {
    // Identify specific optimization opportunities for a feature
    const opportunities = [];

    if (analysis.efficiency < this.config.minEfficiencyScore) {
      opportunities.push({
        type: 'efficiency_improvement',
        description: `Feature ${featureId} efficiency below threshold`,
        impact: 0.3,
        effort: 'medium'
      });
    }

    return opportunities;
  }

  // Additional placeholder methods for comprehensive analysis
  async analyzeUserEfficiency(metrics) { return []; }
  async analyzeTimeBasedEfficiency(metrics) { return {}; }
  async calculateTimeBasedROI(metrics, period) { return 0; }
  async calculateFeatureROI(metrics) { return []; }
  async calculateUserROI(metrics) { return []; }
  async calculateROITrend(metrics) { return { trend: 'stable' }; }
  async predictFutureROI(metrics, trend) { return { predicted: 0 }; }
  calculateRiskAdjustedROI(roi, metrics) { return roi * 0.9; }
  async calculateMarginalROI(metrics) { return { marginal: 0 }; }
  async identifyCostReductionOpportunities(metrics) { return []; }
  async identifyValueEnhancementOpportunities(metrics) { return []; }
  async identifyUtilizationOpportunities(metrics) { return []; }
  async identifyTimingOptimizationOpportunities(metrics) { return []; }
  async identifyAllocationOpportunities(metrics) { return []; }
  calculateDuplicateRequestWaste(metrics) { return { cost: 0, count: 0 }; }
  calculateOffPeakWaste(metrics) { return { cost: 0, hours: 0 }; }
  async calculateIneffcientFeatureWaste(metrics) { return { cost: 0, features: [] }; }
  calculateOversizeWaste(metrics) { return { cost: 0, operations: 0 }; }
  calculateCapacityWaste(metrics) { return { cost: 0, utilization: 0 }; }
  async analyzeWasteTrend(metrics) { return { trend: 'stable' }; }
  async generateWasteReductionActions(wasteTypes) { return []; }
  async performBenchmarkAnalysis(metrics) { return {}; }
  async generateEfficiencyRecommendations(analysis) { return []; }
  calculatePotentialSavings(recommendations) {
    return {
      total: recommendations.reduce((sum, r) => sum + (r.savings || 0), 0),
      immediate: 0,
      shortTerm: 0,
      longTerm: 0
    };
  }
  createEfficiencySummary(analysis) {
    return {
      overallGrade: 'C',
      topOpportunities: 3,
      potentialImprovement: '25%'
    };
  }

  async calculateFeatureBusinessValue(featureId, metrics) {
    // Feature-specific business value calculation
    return metrics.length * this.config.valuePerFeatureUsage * 2;
  }

  groupByTimeWindow(metrics, window) {
    const groups = new Map();
    // Implementation would group metrics by specified time window
    return groups;
  }

  getTotalHoursInPeriod(metrics) {
    const dateRange = this.getDateRange(metrics);
    return dateRange.days * 24;
  }
}

/**
 * Factory function to create a CostEfficiencyEngine instance
 * @param {Object} config - Configuration options
 * @returns {CostEfficiencyEngine} New engine instance
 */
export function createCostEfficiencyEngine(config) {
  return new CostEfficiencyEngine(config);
}