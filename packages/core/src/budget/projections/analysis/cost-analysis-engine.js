/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { MathematicalAlgorithms } from '../algorithms/mathematical-algorithms.js';
import { CostForecastingEngine } from '../forecasting/cost-forecasting-engine.js';
import { BudgetAlertSystem } from '../alerts/budget-alert-system.js';
/**
 * Comprehensive cost analysis engine for usage pattern recognition and budget health assessment
 * Provides deep insights into spending patterns, budget runway, and optimization opportunities
 */
export class CostAnalysisEngine {
  static logger = console; // Will be replaced with proper logger
  /**
   * Perform comprehensive cost analysis
   */
  static async performComprehensiveAnalysis(
    costData,
    currentBudget,
    alertConfigs = [],
  ) {
    const startTime = Date.now();
    this.logger.info('Starting comprehensive cost analysis', {
      dataPoints: costData.length,
      budget: currentBudget,
      alertConfigs: alertConfigs.length,
    });
    try {
      if (costData.length === 0) {
        throw new Error('No cost data provided for analysis');
      }
      // Perform core statistical and trend analysis
      const statistical = MathematicalAlgorithms.calculateStatistics(costData);
      const trend = MathematicalAlgorithms.performTrendAnalysis(costData);
      const seasonal = MathematicalAlgorithms.analyzeSeasonality(costData);
      const variance = MathematicalAlgorithms.detectVariances(costData);
      // Calculate moving averages for trend smoothing
      const movingAverage = MathematicalAlgorithms.calculateMovingAverage(
        costData,
        {
          windowSize: Math.min(7, Math.floor(costData.length / 2)),
          type: 'exponential',
          alpha: 0.3,
        },
      );
      // Generate cost projections
      const projection = await CostForecastingEngine.generateProjections(
        costData,
        30,
        0.95,
      );
      // Calculate burn rate analysis
      const burnRate = CostForecastingEngine.calculateBurnRateAnalysis(
        costData,
        currentBudget.total,
      );
      // Monitor for active alerts
      const activeAlerts =
        alertConfigs.length > 0
          ? await BudgetAlertSystem.monitorAndAlert(
              costData,
              alertConfigs.map((config) => ({
                ...config,
                description: `Auto-generated alert: ${config.name}`,
                channels: ['console'],
                suppression: { cooldownMinutes: 60, maxAlertsPerHour: 2 },
              })),
              currentBudget,
            )
          : [];
      // Generate optimization recommendations
      const recommendations = this.generateOptimizationRecommendations(
        costData,
        currentBudget,
        trend,
        projection,
        burnRate,
        variance,
      );
      // Calculate health scores
      const healthScore = this.calculateHealthScore(
        currentBudget,
        trend,
        projection,
        burnRate,
        variance,
      );
      // Create analysis result
      const result = {
        metadata: {
          analysisDate: new Date(),
          dataRange: {
            start: new Date(
              Math.min(...costData.map((d) => d.timestamp.getTime())),
            ),
            end: new Date(
              Math.max(...costData.map((d) => d.timestamp.getTime())),
            ),
          },
          dataPoints: costData.length,
          analysisVersion: '1.0.0',
        },
        statistical,
        trend,
        movingAverage,
        seasonal,
        projection,
        burnRate,
        variance,
        activeAlerts,
        recommendations,
        healthScore,
      };
      this.logger.info('Comprehensive cost analysis completed', {
        duration: Date.now() - startTime,
        healthScore: result.healthScore.overall,
        recommendations: result.recommendations.length,
        activeAlerts: result.activeAlerts.length,
      });
      return result;
    } catch (error) {
      this.logger.error('Failed to perform comprehensive analysis', {
        error: error.message,
      });
      throw error;
    }
  }
  /**
   * Identify usage patterns in cost data
   */
  static identifyUsagePattern(costData, trend, variance, seasonal) {
    const startTime = Date.now();
    try {
      const characteristics = [];
      let primaryPattern = 'steady_state';
      let confidence = 0.5;
      // Analyze trend characteristics
      if (trend.confidence > 0.7) {
        if (trend.direction === 'increasing' && trend.slope > 0.1) {
          primaryPattern = 'growth_phase';
          confidence = trend.confidence;
          characteristics.push('Strong upward trend in spending');
        } else if (trend.direction === 'decreasing' && trend.slope < -0.1) {
          primaryPattern = 'decline_phase';
          confidence = trend.confidence;
          characteristics.push('Consistent downward trend in spending');
        }
      }
      // Analyze variance characteristics
      const coefficientOfVariation = variance.summary.averageVarianceScore;
      if (coefficientOfVariation > 0.5) {
        if (primaryPattern === 'steady_state') {
          primaryPattern = 'volatile';
          confidence = Math.min(0.9, coefficientOfVariation);
        }
        characteristics.push('High variability in spending patterns');
      }
      // Analyze seasonal characteristics
      if (seasonal.seasonalityStrength > 0.3) {
        if (
          primaryPattern === 'steady_state' ||
          primaryPattern === 'volatile'
        ) {
          primaryPattern = 'seasonal';
          confidence = seasonal.seasonalityStrength;
        }
        characteristics.push(
          `Seasonal patterns detected (strength: ${seasonal.seasonalityStrength.toFixed(2)})`,
        );
      }
      // Analyze burst patterns
      const significantSpikes = variance.variances.filter(
        (v) => v.varianceType === 'spike' && v.varianceScore > 0.7,
      ).length;
      if (significantSpikes > 0) {
        const spikeRatio = significantSpikes / costData.length;
        if (spikeRatio > 0.1) {
          if (primaryPattern === 'steady_state') {
            primaryPattern = 'burst_intensive';
            confidence = Math.min(0.9, spikeRatio * 2);
          }
          characteristics.push('Frequent cost spikes detected');
        } else if (spikeRatio > 0.05) {
          characteristics.push('Occasional cost spikes');
        }
      }
      // Analyze sporadic patterns
      const dataGaps = this.analyzeDataContinuity(costData);
      if (dataGaps.gapRatio > 0.3) {
        if (primaryPattern === 'steady_state') {
          primaryPattern = 'sporadic';
          confidence = Math.min(0.8, dataGaps.gapRatio);
        }
        characteristics.push('Irregular usage patterns with gaps');
      }
      // Check for cost optimization patterns
      if (
        trend.direction === 'decreasing' &&
        variance.summary.averageVarianceScore < 0.3
      ) {
        primaryPattern = 'cost_optimized';
        confidence = 0.8;
        characteristics.push('Evidence of cost optimization efforts');
      }
      // Generate description
      const description = this.generateUsagePatternDescription(
        primaryPattern,
        characteristics,
      );
      this.logger.info('Usage pattern identified', {
        duration: Date.now() - startTime,
        pattern: primaryPattern,
        confidence: confidence.toFixed(3),
        characteristics: characteristics.length,
      });
      return {
        primaryPattern,
        confidence,
        description,
        characteristics,
      };
    } catch (error) {
      this.logger.error('Failed to identify usage pattern', {
        error: error.message,
      });
      return {
        primaryPattern: 'steady_state',
        confidence: 0.3,
        description: 'Unable to determine usage pattern due to analysis error',
        characteristics: ['Analysis error occurred'],
      };
    }
  }
  /**
   * Calculate budget runway with multiple scenarios
   */
  static calculateBudgetRunway(currentBudget, projection, burnRate) {
    const startTime = Date.now();
    try {
      const scenarios = [];
      const recommendations = [];
      // Current rate scenario
      scenarios.push({
        name: 'Current Rate',
        description: 'Based on current daily burn rate',
        runwayDays: burnRate.runway.currentRateDays,
        exhaustionDate: new Date(
          Date.now() + burnRate.runway.currentRateDays * 24 * 60 * 60 * 1000,
        ),
        confidence: 0.7,
      });
      // Average rate scenario
      scenarios.push({
        name: 'Average Rate',
        description: 'Based on historical average burn rate',
        runwayDays: burnRate.runway.averageRateDays,
        exhaustionDate: new Date(
          Date.now() + burnRate.runway.averageRateDays * 24 * 60 * 60 * 1000,
        ),
        confidence: 0.8,
      });
      // Projected rate scenario
      scenarios.push({
        name: 'Projected Rate',
        description: 'Based on trend-adjusted projected burn rate',
        runwayDays: burnRate.runway.projectedRateDays,
        exhaustionDate: burnRate.runway.exhaustionDate,
        confidence: 0.6,
      });
      // Conservative scenario (10% higher burn rate)
      const conservativeRate = burnRate.currentBurnRate * 1.1;
      const conservativeDays =
        conservativeRate > 0
          ? currentBudget.remaining / conservativeRate
          : Infinity;
      scenarios.push({
        name: 'Conservative',
        description: 'Assumes 10% higher burn rate for safety margin',
        runwayDays: Math.floor(conservativeDays),
        exhaustionDate: new Date(
          Date.now() + conservativeDays * 24 * 60 * 60 * 1000,
        ),
        confidence: 0.9,
      });
      // Optimistic scenario (10% lower burn rate)
      const optimisticRate = burnRate.currentBurnRate * 0.9;
      const optimisticDays =
        optimisticRate > 0
          ? currentBudget.remaining / optimisticRate
          : Infinity;
      scenarios.push({
        name: 'Optimistic',
        description: 'Assumes 10% lower burn rate with optimization',
        runwayDays: Math.floor(optimisticDays),
        exhaustionDate: new Date(
          Date.now() + optimisticDays * 24 * 60 * 60 * 1000,
        ),
        confidence: 0.5,
      });
      // Generate recommendations based on runway
      const minRunway = Math.min(...scenarios.map((s) => s.runwayDays));
      const maxRunway = Math.max(
        ...scenarios
          .filter((s) => s.runwayDays !== Infinity)
          .map((s) => s.runwayDays),
      );
      if (minRunway < 7) {
        recommendations.push(
          'Critical: Budget may be exhausted within a week. Implement immediate cost controls.',
        );
      } else if (minRunway < 30) {
        recommendations.push(
          'Warning: Budget runway is less than 30 days. Consider extending budget or optimizing costs.',
        );
      }
      if (maxRunway - minRunway > 30) {
        recommendations.push(
          'High uncertainty in projections. Monitor spending closely and update forecasts frequently.',
        );
      }
      if (burnRate.burnRateTrend.direction === 'increasing') {
        recommendations.push(
          'Burn rate is increasing. Investigate causes and implement cost optimization measures.',
        );
      }
      this.logger.info('Budget runway calculated', {
        duration: Date.now() - startTime,
        scenarios: scenarios.length,
        minRunway: minRunway === Infinity ? 'unlimited' : minRunway,
        maxRunway: maxRunway === Infinity ? 'unlimited' : maxRunway,
      });
      return { scenarios, recommendations };
    } catch (error) {
      this.logger.error('Failed to calculate budget runway', {
        error: error.message,
      });
      return {
        scenarios: [
          {
            name: 'Error',
            description: 'Unable to calculate runway due to error',
            runwayDays: 0,
            exhaustionDate: new Date(),
            confidence: 0,
          },
        ],
        recommendations: ['Error occurred during runway calculation'],
      };
    }
  }
  /**
   * Generate optimization recommendations based on analysis
   */
  static generateOptimizationRecommendations(
    costData,
    currentBudget,
    trend,
    projection,
    burnRate,
    variance,
  ) {
    const recommendations = [];
    let recommendationCounter = 0;
    // Budget utilization recommendations
    const utilizationPercentage =
      (currentBudget.used / currentBudget.total) * 100;
    if (utilizationPercentage > 85) {
      recommendations.push({
        id: `opt_${++recommendationCounter}`,
        title: 'Implement Immediate Cost Controls',
        description:
          'Budget utilization is approaching critical levels. Implement strict cost controls and review all non-essential spending.',
        category: 'cost_reduction',
        impact: {
          estimatedSavings: currentBudget.remaining * 0.2,
          savingsPercentage: 20,
          timeToRealizeDays: 1,
          implementationEffort: 'high',
        },
        implementation: {
          steps: [
            'Review all current spending and identify non-essential items',
            'Implement approval workflow for all new spending',
            'Set up real-time spending alerts',
            'Create emergency cost reduction plan',
          ],
          estimatedTimeHours: 8,
          requiredResources: [
            'Budget manager',
            'Technical team',
            'Management approval',
          ],
          risks: [
            'Potential service disruption',
            'Reduced feature development velocity',
          ],
        },
        priority: 'critical',
        urgency: 'immediate',
        supportingData: {
          historicalEvidence: `Budget utilization at ${utilizationPercentage.toFixed(1)}%`,
          confidence: 0.9,
        },
      });
    }
    // Trend-based recommendations
    if (trend.direction === 'increasing' && trend.confidence > 0.7) {
      const projectedIncrease = trend.slope * 30; // 30-day projection
      recommendations.push({
        id: `opt_${++recommendationCounter}`,
        title: 'Address Cost Growth Trend',
        description:
          'Costs are trending upward significantly. Investigate root causes and implement optimization strategies.',
        category: 'usage_optimization',
        impact: {
          estimatedSavings: Math.abs(projectedIncrease) * 0.5,
          savingsPercentage: 15,
          timeToRealizeDays: 7,
          implementationEffort: 'medium',
        },
        implementation: {
          steps: [
            'Analyze cost drivers causing the upward trend',
            'Implement monitoring for high-cost operations',
            'Optimize resource utilization',
            'Review and adjust usage patterns',
          ],
          estimatedTimeHours: 16,
          requiredResources: [
            'Data analyst',
            'DevOps engineer',
            'Product manager',
          ],
          risks: [
            'Temporary monitoring overhead',
            'Initial analysis time investment',
          ],
        },
        priority: trend.slope > 1 ? 'high' : 'medium',
        urgency: trend.slope > 2 ? 'this_week' : 'this_month',
        supportingData: {
          historicalEvidence: `Cost trend increasing at ${trend.slope.toFixed(4)} per day with ${(trend.confidence * 100).toFixed(1)}% confidence`,
          confidence: trend.confidence,
        },
      });
    }
    // Variance-based recommendations
    if (variance.summary.significantVariances > 0) {
      recommendations.push({
        id: `opt_${++recommendationCounter}`,
        title: 'Stabilize Cost Variance',
        description:
          'Significant cost spikes detected. Implement measures to reduce cost volatility and improve predictability.',
        category: 'process_improvement',
        impact: {
          estimatedSavings:
            variance.summary.maxVarianceScore * currentBudget.used * 0.1,
          savingsPercentage: 10,
          timeToRealizeDays: 14,
          implementationEffort: 'medium',
        },
        implementation: {
          steps: [
            'Investigate root causes of cost spikes',
            'Implement rate limiting for high-cost operations',
            'Set up proactive monitoring and alerts',
            'Create cost spike response procedures',
          ],
          estimatedTimeHours: 12,
          requiredResources: [
            'DevOps engineer',
            'Monitoring specialist',
            'Development team',
          ],
          risks: [
            'Potential service limitations during optimization',
            'Learning curve for new procedures',
          ],
        },
        priority: variance.summary.maxVarianceScore > 0.8 ? 'high' : 'medium',
        urgency: 'this_week',
        supportingData: {
          historicalEvidence: `${variance.summary.significantVariances} significant cost variances detected with max score of ${variance.summary.maxVarianceScore.toFixed(3)}`,
          confidence: 0.8,
        },
      });
    }
    // Burn rate recommendations
    if (burnRate.runway.currentRateDays < 30) {
      recommendations.push({
        id: `opt_${++recommendationCounter}`,
        title: 'Extend Budget Runway',
        description:
          'Current burn rate will exhaust budget quickly. Implement strategies to extend budget runway.',
        category: 'budget_reallocation',
        impact: {
          estimatedSavings: burnRate.currentBurnRate * 7, // One week of savings
          savingsPercentage: 25,
          timeToRealizeDays: 3,
          implementationEffort: 'high',
        },
        implementation: {
          steps: [
            'Prioritize essential vs. non-essential features',
            'Implement cost-per-feature analysis',
            'Negotiate better pricing or resource allocation',
            'Consider budget extension or reallocation',
          ],
          estimatedTimeHours: 20,
          requiredResources: [
            'Budget manager',
            'Product manager',
            'Executive approval',
            'Finance team',
          ],
          risks: [
            'Reduced feature scope',
            'Potential project delays',
            'Budget approval dependencies',
          ],
        },
        priority: 'critical',
        urgency:
          burnRate.runway.currentRateDays < 7 ? 'immediate' : 'this_week',
        supportingData: {
          historicalEvidence: `Budget runway: ${burnRate.runway.currentRateDays} days at current burn rate of $${burnRate.currentBurnRate.toFixed(2)}/day`,
          confidence: 0.85,
        },
      });
    }
    // Category-specific recommendations
    if (burnRate.categoryBreakdown && burnRate.categoryBreakdown.length > 0) {
      const highestCostCategory = burnRate.categoryBreakdown[0];
      if (highestCostCategory.percentage > 50) {
        recommendations.push({
          id: `opt_${++recommendationCounter}`,
          title: `Optimize ${highestCostCategory.category} Usage`,
          description: `The ${highestCostCategory.category} category accounts for ${highestCostCategory.percentage.toFixed(1)}% of costs. Focus optimization efforts here for maximum impact.`,
          category: 'usage_optimization',
          impact: {
            estimatedSavings: highestCostCategory.burnRate * 7 * 0.3, // 30% reduction for a week
            savingsPercentage: 30,
            timeToRealizeDays: 10,
            implementationEffort: 'medium',
          },
          implementation: {
            steps: [
              `Analyze ${highestCostCategory.category} usage patterns`,
              'Identify optimization opportunities',
              'Implement category-specific cost controls',
              'Monitor and measure optimization impact',
            ],
            estimatedTimeHours: 14,
            requiredResources: [
              'Category specialist',
              'Data analyst',
              'Development team',
            ],
            risks: [
              'Category-specific service limitations',
              'Learning curve for optimization',
            ],
          },
          priority: 'high',
          urgency: 'this_week',
          supportingData: {
            historicalEvidence: `${highestCostCategory.category} category: $${highestCostCategory.burnRate.toFixed(2)}/day (${highestCostCategory.percentage.toFixed(1)}% of total)`,
            confidence: 0.75,
          },
        });
      }
    }
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const urgencyOrder = {
        immediate: 4,
        this_week: 3,
        this_month: 2,
        when_convenient: 1,
      };
      const scoreA = priorityOrder[a.priority] * 10 + urgencyOrder[a.urgency];
      const scoreB = priorityOrder[b.priority] * 10 + urgencyOrder[b.urgency];
      return scoreB - scoreA;
    });
  }
  /**
   * Calculate overall health score and component scores
   */
  static calculateHealthScore(
    currentBudget,
    trend,
    projection,
    burnRate,
    variance,
  ) {
    // Calculate component scores (0-100)
    // Trend health: positive trends are bad for budget health
    const trendHealth =
      trend.direction === 'decreasing'
        ? 90
        : trend.direction === 'stable'
          ? 75
          : trend.confidence > 0.7
            ? Math.max(20, 60 - trend.slope * 100)
            : 60;
    // Variance health: lower variance is better
    const varianceHealth = Math.max(
      10,
      100 - variance.summary.averageVarianceScore * 80,
    );
    // Projection health: based on data quality and confidence
    const projectionHealth = Math.min(
      95,
      projection.metadata.dataQualityScore * 100,
    );
    // Burn rate health: based on runway and trend
    const runwayDays = burnRate.runway.currentRateDays;
    const burnRateHealth =
      runwayDays > 90
        ? 95
        : runwayDays > 60
          ? 80
          : runwayDays > 30
            ? 60
            : runwayDays > 14
              ? 40
              : runwayDays > 7
                ? 20
                : 10;
    // Calculate overall health score (weighted average)
    const overall = Math.round(
      trendHealth * 0.25 +
        varianceHealth * 0.2 +
        projectionHealth * 0.15 +
        burnRateHealth * 0.4,
    );
    return {
      overall,
      components: {
        trendHealth: Math.round(trendHealth),
        varianceHealth: Math.round(varianceHealth),
        projectionHealth: Math.round(projectionHealth),
        burnRateHealth: Math.round(burnRateHealth),
      },
    };
  }
  /**
   * Analyze data continuity and identify gaps
   */
  static analyzeDataContinuity(costData) {
    if (costData.length < 2) {
      return { gapRatio: 0, largestGapHours: 0, averageGapHours: 0 };
    }
    const sortedData = [...costData].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );
    const gaps = [];
    for (let i = 1; i < sortedData.length; i++) {
      const gap =
        (sortedData[i].timestamp.getTime() -
          sortedData[i - 1].timestamp.getTime()) /
        (60 * 60 * 1000); // Gap in hours
      gaps.push(gap);
    }
    const totalTimespan =
      (sortedData[sortedData.length - 1].timestamp.getTime() -
        sortedData[0].timestamp.getTime()) /
      (60 * 60 * 1000);
    const expectedGap = totalTimespan / (sortedData.length - 1);
    const significantGaps = gaps.filter((gap) => gap > expectedGap * 3);
    return {
      gapRatio: significantGaps.length / gaps.length,
      largestGapHours: Math.max(...gaps),
      averageGapHours: gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length,
    };
  }
  /**
   * Generate human-readable description of usage pattern
   */
  static generateUsagePatternDescription(pattern, characteristics) {
    const baseDescriptions = {
      steady_state:
        'Your spending follows a consistent, predictable pattern with minimal fluctuations.',
      growth_phase:
        'Your costs are steadily increasing, indicating expansion or increased usage.',
      decline_phase:
        'Your spending is decreasing over time, suggesting optimization or reduced usage.',
      volatile:
        'Your costs fluctuate significantly, making budget prediction challenging.',
      seasonal:
        'Your spending follows predictable seasonal or cyclical patterns.',
      sporadic:
        'Your usage is irregular with periods of activity followed by gaps.',
      burst_intensive:
        'Your spending is characterized by occasional high-cost spikes.',
      cost_optimized:
        'Your spending shows evidence of successful cost optimization efforts.',
    };
    let description = baseDescriptions[pattern];
    if (characteristics.length > 0) {
      description += ` Key characteristics include: ${characteristics.slice(0, 3).join(', ')}.`;
    }
    return description;
  }
  /**
   * Get health level description from numeric score
   */
  static getHealthLevel(score) {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 55) return 'fair';
    if (score >= 35) return 'poor';
    return 'critical';
  }
  /**
   * Get health level color for UI display
   */
  static getHealthLevelColor(level) {
    const colors = {
      excellent: '#22c55e', // Green
      good: '#84cc16', // Light green
      fair: '#f59e0b', // Orange
      poor: '#f97316', // Dark orange
      critical: '#ef4444', // Red
    };
    return colors[level];
  }
}
//# sourceMappingURL=cost-analysis-engine.js.map
