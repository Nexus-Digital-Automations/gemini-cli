/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Advanced budget optimization engine for intelligent cost management and allocation
 * Provides AI-driven recommendations for cost reduction and budget optimization
 */
export class BudgetOptimizationEngine {
  static logger = console; // Will be replaced with proper logger
  /**
   * Generate comprehensive optimization recommendations
   */
  static async generateOptimizationPlan(
    costData,
    currentBudget,
    projection,
    burnRate,
    trend,
    variance,
    targetSavings,
  ) {
    const startTime = Date.now();
    this.logger.info('Generating optimization plan', {
      dataPoints: costData.length,
      budget: currentBudget,
      targetSavings: targetSavings || 'auto-calculated',
    });
    try {
      // Calculate target savings if not provided
      const calculatedTargetSavings =
        targetSavings ||
        Math.max(
          currentBudget.remaining * 0.2, // 20% of remaining budget
          burnRate.currentBurnRate * 7,
        );
      // Generate recommendations
      const recommendations = await this.generateDetailedRecommendations(
        costData,
        currentBudget,
        projection,
        burnRate,
        trend,
        variance,
        calculatedTargetSavings,
      );
      // Identify optimization opportunities
      const opportunities = this.identifyOptimizationOpportunities(
        costData,
        burnRate,
        variance,
        calculatedTargetSavings,
      );
      // Create budget allocation strategies
      const allocationStrategies = this.createAllocationStrategies(
        costData,
        currentBudget,
        burnRate,
        calculatedTargetSavings,
      );
      // Calculate summary metrics
      const totalPotentialSavings =
        recommendations.reduce(
          (sum, rec) => sum + rec.impact.estimatedSavings,
          0,
        ) +
        opportunities.reduce(
          (sum, opp) => sum + opp.potentialSavings.amount,
          0,
        );
      const implementationScore = this.calculateImplementationScore(
        recommendations,
        opportunities,
      );
      const prioritizedActions = this.prioritizeActions(
        recommendations,
        opportunities,
      );
      const result = {
        recommendations,
        opportunities,
        allocationStrategies,
        summary: {
          totalPotentialSavings,
          implementationScore,
          prioritizedActions,
        },
      };
      this.logger.info('Optimization plan generated', {
        duration: Date.now() - startTime,
        recommendations: recommendations.length,
        opportunities: opportunities.length,
        allocationStrategies: allocationStrategies.length,
        totalPotentialSavings: totalPotentialSavings.toFixed(2),
      });
      return result;
    } catch (error) {
      this.logger.error('Failed to generate optimization plan', {
        error: error.message,
      });
      throw error;
    }
  }
  /**
   * Analyze cost efficiency across different categories
   */
  static analyzeCostEfficiency(costData, burnRate) {
    const startTime = Date.now();
    this.logger.info('Analyzing cost efficiency', {
      dataPoints: costData.length,
      categories: burnRate.categoryBreakdown?.length || 0,
    });
    try {
      const efficiency = [];
      const recommendations = [];
      // Analyze each category
      if (burnRate.categoryBreakdown) {
        for (const category of burnRate.categoryBreakdown) {
          // Calculate efficiency metrics
          const categoryData = costData.filter(
            (point) => point.context?.feature === category.category,
          );
          const costPerUnit =
            category.burnRate / Math.max(1, categoryData.length);
          const utilizationRate = this.calculateUtilizationRate(categoryData);
          const optimizationPotential = this.calculateOptimizationPotential(
            categoryData,
            category.trend,
          );
          const efficiencyScore = this.calculateEfficiencyScore(
            costPerUnit,
            utilizationRate,
            category.percentage,
          );
          efficiency.push({
            category: category.category,
            efficiency: efficiencyScore,
            costPerUnit,
            utilizationRate,
            optimizationPotential,
          });
          // Generate category-specific recommendations
          if (efficiencyScore < 60) {
            recommendations.push(
              `${category.category} shows low efficiency (${efficiencyScore.toFixed(1)}%). Consider optimization strategies.`,
            );
          }
          if (optimizationPotential > 30) {
            recommendations.push(
              `${category.category} has high optimization potential (${optimizationPotential.toFixed(1)}%). Prioritize for cost reduction.`,
            );
          }
        }
      }
      // Calculate overall efficiency
      const overallEfficiency =
        efficiency.length > 0
          ? efficiency.reduce(
              (sum, e) =>
                sum +
                e.efficiency *
                  (burnRate.categoryBreakdown?.find(
                    (c) => c.category === e.category,
                  )?.percentage || 0),
              0,
            ) / 100
          : 50;
      this.logger.info('Cost efficiency analysis completed', {
        duration: Date.now() - startTime,
        overallEfficiency: overallEfficiency.toFixed(1),
        categories: efficiency.length,
        recommendations: recommendations.length,
      });
      return {
        efficiency,
        overallEfficiency,
        recommendations,
      };
    } catch (error) {
      this.logger.error('Failed to analyze cost efficiency', {
        error: error.message,
      });
      return {
        efficiency: [],
        overallEfficiency: 0,
        recommendations: ['Error occurred during efficiency analysis'],
      };
    }
  }
  /**
   * Create scenario-based optimization plans
   */
  static createOptimizationScenarios(costData, currentBudget, projection) {
    const scenarios = [];
    // Conservative scenario (10% reduction)
    const conservativeReduction = currentBudget.used * 0.1;
    scenarios.push({
      scenario: 'Conservative Optimization',
      description: 'Low-risk optimizations with minimal operational impact',
      targetReduction: conservativeReduction,
      actions: this.createConservativeActions(costData, conservativeReduction),
      expectedOutcome: {
        costReduction: conservativeReduction,
        budgetExtension:
          conservativeReduction / projection.summary.burnRatePerDay,
        riskLevel: 'low',
        implementationTime: 3,
      },
    });
    // Moderate scenario (20% reduction)
    const moderateReduction = currentBudget.used * 0.2;
    scenarios.push({
      scenario: 'Moderate Optimization',
      description: 'Balanced approach with moderate operational changes',
      targetReduction: moderateReduction,
      actions: this.createModerateActions(costData, moderateReduction),
      expectedOutcome: {
        costReduction: moderateReduction,
        budgetExtension: moderateReduction / projection.summary.burnRatePerDay,
        riskLevel: 'medium',
        implementationTime: 7,
      },
    });
    // Aggressive scenario (35% reduction)
    const aggressiveReduction = currentBudget.used * 0.35;
    scenarios.push({
      scenario: 'Aggressive Optimization',
      description:
        'Maximum cost reduction with significant operational changes',
      targetReduction: aggressiveReduction,
      actions: this.createAggressiveActions(costData, aggressiveReduction),
      expectedOutcome: {
        costReduction: aggressiveReduction,
        budgetExtension:
          aggressiveReduction / projection.summary.burnRatePerDay,
        riskLevel: 'high',
        implementationTime: 14,
      },
    });
    return scenarios;
  }
  // Private helper methods
  static async generateDetailedRecommendations(
    costData,
    currentBudget,
    projection,
    burnRate,
    trend,
    variance,
    targetSavings,
  ) {
    const recommendations = [];
    let recId = 0;
    // Cost spike reduction recommendations
    if (variance.summary.significantVariances > 0) {
      const spikeReduction =
        variance.summary.maxVarianceScore * currentBudget.used * 0.15;
      recommendations.push({
        id: `opt_${++recId}`,
        title: 'Implement Cost Spike Prevention',
        description:
          'Deploy automated monitoring and circuit breakers to prevent cost spikes before they occur.',
        category: 'cost_reduction',
        impact: {
          estimatedSavings: spikeReduction,
          savingsPercentage: (spikeReduction / currentBudget.used) * 100,
          timeToRealizeDays: 5,
          implementationEffort: 'medium',
        },
        implementation: {
          steps: [
            'Analyze historical cost spike patterns',
            'Implement real-time cost monitoring with thresholds',
            'Deploy automated circuit breakers for high-cost operations',
            'Create cost spike response procedures',
            'Set up proactive alerting system',
          ],
          estimatedTimeHours: 20,
          requiredResources: [
            'DevOps engineer',
            'Monitoring specialist',
            'Budget manager',
          ],
          risks: [
            'Potential service limitations during spike prevention',
            'Learning curve for new monitoring tools',
          ],
        },
        priority: 'high',
        urgency:
          variance.summary.significantVariances > 5
            ? 'this_week'
            : 'this_month',
        supportingData: {
          historicalEvidence: `${variance.summary.significantVariances} cost spikes detected with max score ${variance.summary.maxVarianceScore.toFixed(3)}`,
          confidence: 0.85,
        },
      });
    }
    // Burn rate optimization
    if (burnRate.runway.currentRateDays < 60) {
      const burnRateReduction = burnRate.currentBurnRate * 7 * 0.25; // 25% reduction for a week
      recommendations.push({
        id: `opt_${++recId}`,
        title: 'Optimize Daily Burn Rate',
        description:
          'Implement systematic burn rate reduction through usage optimization and resource rightsizing.',
        category: 'usage_optimization',
        impact: {
          estimatedSavings: burnRateReduction,
          savingsPercentage: 25,
          timeToRealizeDays: 10,
          implementationEffort: 'medium',
        },
        implementation: {
          steps: [
            'Conduct detailed burn rate analysis by feature and time period',
            'Identify highest-impact optimization opportunities',
            'Implement resource rightsizing and scheduling optimization',
            'Deploy usage-based cost controls',
            'Monitor and adjust optimization strategies',
          ],
          estimatedTimeHours: 24,
          requiredResources: [
            'Cost optimization specialist',
            'Technical architect',
            'Data analyst',
          ],
          risks: [
            'Potential performance impact during optimization',
            'Complexity in measuring optimization impact',
          ],
        },
        priority: burnRate.runway.currentRateDays < 30 ? 'critical' : 'high',
        urgency:
          burnRate.runway.currentRateDays < 14 ? 'immediate' : 'this_week',
        supportingData: {
          historicalEvidence: `Current burn rate: $${burnRate.currentBurnRate.toFixed(2)}/day, runway: ${burnRate.runway.currentRateDays} days`,
          confidence: 0.8,
        },
      });
    }
    // Budget reallocation recommendations
    if (burnRate.categoryBreakdown && burnRate.categoryBreakdown.length > 1) {
      const topCategory = burnRate.categoryBreakdown[0];
      if (topCategory.percentage > 60) {
        const reallocationSavings = topCategory.burnRate * 7 * 0.2; // 20% reallocation
        recommendations.push({
          id: `opt_${++recId}`,
          title: `Rebalance Budget Allocation from ${topCategory.category}`,
          description: `The ${topCategory.category} category dominates spending. Redistribute budget for better ROI.`,
          category: 'budget_reallocation',
          impact: {
            estimatedSavings: reallocationSavings,
            savingsPercentage: 20,
            timeToRealizeDays: 14,
            implementationEffort: 'high',
          },
          implementation: {
            steps: [
              `Analyze ROI and value delivery for ${topCategory.category} spending`,
              'Identify lower-value activities within the category',
              'Reallocate budget to higher-value activities',
              'Implement governance for budget allocation decisions',
              'Monitor impact of reallocation on business outcomes',
            ],
            estimatedTimeHours: 32,
            requiredResources: [
              'Budget manager',
              'Business analyst',
              'Product manager',
              'Finance team',
            ],
            risks: [
              'Potential disruption to existing operations',
              'Difficulty in measuring value delivery',
              'Organizational resistance to change',
            ],
          },
          priority: 'medium',
          urgency: 'this_month',
          supportingData: {
            historicalEvidence: `${topCategory.category} accounts for ${topCategory.percentage.toFixed(1)}% of total spending`,
            confidence: 0.7,
          },
        });
      }
    }
    // Trend-based recommendations
    if (trend.direction === 'increasing' && trend.confidence > 0.7) {
      const trendReduction = Math.abs(trend.slope) * 30 * 0.6; // 60% reduction of 30-day trend impact
      recommendations.push({
        id: `opt_${++recId}`,
        title: 'Address Upward Cost Trend',
        description:
          'Implement measures to flatten or reverse the current upward cost trend.',
        category: 'process_improvement',
        impact: {
          estimatedSavings: trendReduction,
          savingsPercentage: (trendReduction / currentBudget.used) * 100,
          timeToRealizeDays: 21,
          implementationEffort: 'high',
        },
        implementation: {
          steps: [
            'Investigate root causes of cost trend increase',
            'Implement cost trend monitoring dashboard',
            'Deploy predictive alerting for trend changes',
            'Create trend reversal action plans',
            'Establish regular trend review processes',
          ],
          estimatedTimeHours: 28,
          requiredResources: [
            'Data analyst',
            'Process improvement specialist',
            'Management team',
          ],
          risks: [
            'Difficulty in identifying trend causes',
            'Time required for trend reversal',
            'Potential need for operational changes',
          ],
        },
        priority: 'high',
        urgency: trend.slope > 1 ? 'this_week' : 'this_month',
        supportingData: {
          historicalEvidence: `Cost trend increasing at $${trend.slope.toFixed(4)}/day with ${(trend.confidence * 100).toFixed(1)}% confidence`,
          confidence: trend.confidence,
        },
      });
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
  static identifyOptimizationOpportunities(
    costData,
    burnRate,
    variance,
    targetSavings,
  ) {
    const opportunities = [];
    let oppId = 0;
    // Immediate opportunities
    if (variance.summary.significantVariances > 0) {
      opportunities.push({
        id: `imm_opp_${++oppId}`,
        title: 'Eliminate Cost Anomalies',
        category: 'immediate',
        description:
          'Address identified cost spikes and anomalies for immediate savings.',
        potentialSavings: {
          amount: variance.summary.maxVarianceScore * targetSavings * 0.3,
          percentage: 15,
          timeframe: 'daily',
        },
        implementation: {
          effort: 'low',
          timeToImplement: 4,
          dependencies: ['Cost monitoring access', 'Historical data analysis'],
          risks: ['Potential false positives in anomaly detection'],
        },
        measurability: {
          kpis: [
            'Daily cost reduction',
            'Anomaly detection accuracy',
            'Alert response time',
          ],
          successMetrics: [
            'Cost spikes reduced by 80%',
            'False alert rate below 5%',
          ],
          monitoringPeriod: 14,
        },
      });
    }
    // Short-term opportunities
    if (burnRate.categoryBreakdown && burnRate.categoryBreakdown.length > 0) {
      const highestCategory = burnRate.categoryBreakdown[0];
      opportunities.push({
        id: `st_opp_${++oppId}`,
        title: `Optimize ${highestCategory.category} Usage`,
        category: 'short_term',
        description: `Focus optimization efforts on the highest-cost category for maximum impact.`,
        potentialSavings: {
          amount: highestCategory.burnRate * 7 * 0.25,
          percentage: 25,
          timeframe: 'weekly',
        },
        implementation: {
          effort: 'medium',
          timeToImplement: 16,
          dependencies: [
            'Category usage data',
            'Technical team availability',
            'Business stakeholder alignment',
          ],
          risks: [
            'Potential impact on service quality',
            'User experience changes',
          ],
        },
        measurability: {
          kpis: [
            'Category cost reduction',
            'Usage efficiency',
            'User satisfaction',
          ],
          successMetrics: [
            'Cost per unit reduced by 25%',
            'User satisfaction maintained above 85%',
          ],
          monitoringPeriod: 30,
        },
      });
    }
    // Long-term opportunities
    opportunities.push({
      id: `lt_opp_${++oppId}`,
      title: 'Implement Predictive Cost Management',
      category: 'long_term',
      description:
        'Deploy machine learning-based cost prediction and automatic optimization.',
      potentialSavings: {
        amount: targetSavings * 0.4,
        percentage: 40,
        timeframe: 'monthly',
      },
      implementation: {
        effort: 'high',
        timeToImplement: 80,
        dependencies: [
          'ML infrastructure',
          'Historical data quality',
          'Technical expertise',
          'Budget for tooling',
        ],
        risks: [
          'Model accuracy uncertainties',
          'Implementation complexity',
          'Change management challenges',
        ],
      },
      measurability: {
        kpis: [
          'Prediction accuracy',
          'Automated optimization effectiveness',
          'Cost trend improvement',
        ],
        successMetrics: [
          'Prediction accuracy above 85%',
          'Monthly cost reduced by 40%',
          'Manual interventions reduced by 70%',
        ],
        monitoringPeriod: 90,
      },
    });
    // Strategic opportunities
    opportunities.push({
      id: `str_opp_${++oppId}`,
      title: 'Establish Cost Excellence Center',
      category: 'strategic',
      description:
        'Create dedicated team and processes for continuous cost optimization.',
      potentialSavings: {
        amount: targetSavings * 0.6,
        percentage: 60,
        timeframe: 'annually',
      },
      implementation: {
        effort: 'high',
        timeToImplement: 160,
        dependencies: [
          'Executive sponsorship',
          'Dedicated team budget',
          'Process development',
          'Training programs',
        ],
        risks: [
          'Resource allocation challenges',
          'Organizational buy-in',
          'Long-term sustainability',
        ],
      },
      measurability: {
        kpis: [
          'Cost optimization initiatives launched',
          'Savings realized',
          'Team productivity',
          'Knowledge sharing',
        ],
        successMetrics: [
          'Annual savings target achieved',
          'Cost optimization maturity score above 80%',
          'ROI on cost center above 300%',
        ],
        monitoringPeriod: 365,
      },
    });
    return opportunities;
  }
  static createAllocationStrategies(
    costData,
    currentBudget,
    burnRate,
    targetSavings,
  ) {
    const strategies = [];
    if (!burnRate.categoryBreakdown || burnRate.categoryBreakdown.length < 2) {
      return strategies;
    }
    // Balanced allocation strategy
    const balancedAllocations = burnRate.categoryBreakdown.map((category) => ({
      category: category.category,
      currentAllocation: category.percentage,
      recommendedAllocation: Math.min(category.percentage, 35), // Cap at 35%
      rationale:
        category.percentage > 35
          ? 'Reduce over-concentration to minimize risk'
          : 'Maintain current balanced allocation',
    }));
    strategies.push({
      strategyId: 'balanced_allocation',
      name: 'Balanced Portfolio Allocation',
      description:
        'Distribute budget more evenly across categories to reduce concentration risk.',
      allocations: balancedAllocations,
      expectedSavings:
        (balancedAllocations.reduce(
          (sum, alloc) =>
            sum +
            Math.max(0, alloc.currentAllocation - alloc.recommendedAllocation),
          0,
        ) *
          currentBudget.total) /
        100,
      implementationComplexity: 'medium',
      riskLevel: 'low',
    });
    // Performance-based allocation
    const performanceAllocations = burnRate.categoryBreakdown.map(
      (category) => {
        const performanceScore =
          category.trend === 'decreasing'
            ? 1.2
            : category.trend === 'stable'
              ? 1.0
              : 0.8;
        const recommendedPercentage = Math.max(
          5, // Minimum 5%
          Math.min(50, category.percentage * performanceScore),
        );
        return {
          category: category.category,
          currentAllocation: category.percentage,
          recommendedAllocation: recommendedPercentage,
          rationale:
            category.trend === 'decreasing'
              ? 'Increase allocation for cost-efficient category'
              : category.trend === 'increasing'
                ? 'Reduce allocation for cost-inefficient category'
                : 'Maintain current allocation for stable category',
        };
      },
    );
    strategies.push({
      strategyId: 'performance_based_allocation',
      name: 'Performance-Based Allocation',
      description:
        'Allocate budget based on cost efficiency trends of each category.',
      allocations: performanceAllocations,
      expectedSavings: targetSavings * 0.3,
      implementationComplexity: 'high',
      riskLevel: 'medium',
    });
    return strategies;
  }
  static calculateImplementationScore(recommendations, opportunities) {
    const recScore = recommendations.reduce((sum, rec) => {
      const effortScore = { low: 3, medium: 2, high: 1 }[
        rec.impact.implementationEffort
      ];
      const priorityScore = { critical: 4, high: 3, medium: 2, low: 1 }[
        rec.priority
      ];
      return sum + effortScore * priorityScore;
    }, 0);
    const oppScore = opportunities.reduce((sum, opp) => {
      const effortScore = { low: 3, medium: 2, high: 1 }[
        opp.implementation.effort
      ];
      const categoryScore = {
        immediate: 4,
        short_term: 3,
        long_term: 2,
        strategic: 1,
      }[opp.category];
      return sum + effortScore * categoryScore;
    }, 0);
    const totalPossible =
      recommendations.length * 12 + opportunities.length * 12;
    return totalPossible > 0
      ? Math.round(((recScore + oppScore) / totalPossible) * 100)
      : 0;
  }
  static prioritizeActions(recommendations, opportunities) {
    const actions = [];
    // Add recommendations
    recommendations.forEach((rec) => {
      const priorityScore = { critical: 4, high: 3, medium: 2, low: 1 }[
        rec.priority
      ];
      const impactScore = rec.impact.savingsPercentage;
      actions.push({
        action: rec.title,
        priority: priorityScore,
        impact: impactScore,
      });
    });
    // Add opportunities
    opportunities.forEach((opp) => {
      const categoryScore = {
        immediate: 4,
        short_term: 3,
        long_term: 2,
        strategic: 1,
      }[opp.category];
      const impactScore = opp.potentialSavings.percentage;
      actions.push({
        action: opp.title,
        priority: categoryScore,
        impact: impactScore,
      });
    });
    // Sort by combined priority and impact score
    return actions
      .sort((a, b) => b.priority * 10 + b.impact - (a.priority * 10 + a.impact))
      .slice(0, 5) // Top 5 actions
      .map((action) => action.action);
  }
  // Helper methods for scenario creation
  static createConservativeActions(costData, targetReduction) {
    return [
      {
        id: 'conservative_1',
        title: 'Basic Cost Monitoring',
        description: 'Implement basic cost tracking and alerting',
        category: 'cost_reduction',
        impact: {
          estimatedSavings: targetReduction,
          savingsPercentage: 10,
          timeToRealizeDays: 3,
          implementationEffort: 'low',
        },
        implementation: {
          steps: ['Set up cost alerts', 'Review daily spending'],
          estimatedTimeHours: 4,
          requiredResources: ['Budget manager'],
          risks: ['Limited impact on actual costs'],
        },
        priority: 'medium',
        urgency: 'this_week',
        supportingData: {
          historicalEvidence: 'Conservative optimization approach',
          confidence: 0.9,
        },
      },
    ];
  }
  static createModerateActions(costData, targetReduction) {
    return [
      {
        id: 'moderate_1',
        title: 'Usage Pattern Optimization',
        description:
          'Optimize usage patterns and implement resource scheduling',
        category: 'usage_optimization',
        impact: {
          estimatedSavings: targetReduction,
          savingsPercentage: 20,
          timeToRealizeDays: 7,
          implementationEffort: 'medium',
        },
        implementation: {
          steps: [
            'Analyze usage patterns',
            'Implement scheduling',
            'Monitor results',
          ],
          estimatedTimeHours: 16,
          requiredResources: ['Technical team', 'Budget manager'],
          risks: ['Temporary service adjustments', 'Learning curve'],
        },
        priority: 'high',
        urgency: 'this_week',
        supportingData: {
          historicalEvidence: 'Moderate optimization approach',
          confidence: 0.8,
        },
      },
    ];
  }
  static createAggressiveActions(costData, targetReduction) {
    return [
      {
        id: 'aggressive_1',
        title: 'Comprehensive Cost Restructuring',
        description:
          'Major restructuring of cost allocation and usage patterns',
        category: 'budget_reallocation',
        impact: {
          estimatedSavings: targetReduction,
          savingsPercentage: 35,
          timeToRealizeDays: 14,
          implementationEffort: 'high',
        },
        implementation: {
          steps: [
            'Complete cost analysis',
            'Restructure allocations',
            'Implement new processes',
            'Monitor and adjust',
          ],
          estimatedTimeHours: 40,
          requiredResources: [
            'Full technical team',
            'Management',
            'External consultants',
          ],
          risks: [
            'Significant operational changes',
            'Potential service disruption',
            'High implementation complexity',
          ],
        },
        priority: 'critical',
        urgency: 'immediate',
        supportingData: {
          historicalEvidence: 'Aggressive optimization approach',
          confidence: 0.6,
        },
      },
    ];
  }
  // Helper methods for efficiency analysis
  static calculateUtilizationRate(categoryData) {
    if (categoryData.length === 0) return 0;
    // Simple utilization calculation based on data density
    const sortedData = categoryData.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );
    const timeSpan =
      sortedData[sortedData.length - 1].timestamp.getTime() -
      sortedData[0].timestamp.getTime();
    const expectedDataPoints = timeSpan / (60 * 60 * 1000); // Hourly data points
    return Math.min(100, (categoryData.length / expectedDataPoints) * 100);
  }
  static calculateOptimizationPotential(categoryData, trend) {
    const basePotential =
      trend === 'increasing' ? 40 : trend === 'stable' ? 20 : 10;
    // Adjust based on data variance
    if (categoryData.length > 0) {
      const costs = categoryData.map((d) => d.cost);
      const mean = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
      const variance =
        costs.reduce((sum, cost) => sum + Math.pow(cost - mean, 2), 0) /
        costs.length;
      const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
      return Math.min(70, basePotential + cv * 30);
    }
    return basePotential;
  }
  static calculateEfficiencyScore(
    costPerUnit,
    utilizationRate,
    categoryPercentage,
  ) {
    // Weight factors for efficiency calculation
    const utilizationWeight = 0.4;
    const costWeight = 0.4;
    const concentrationWeight = 0.2;
    // Normalize utilization rate (0-100)
    const normalizedUtilization = Math.min(100, utilizationRate);
    // Normalize cost efficiency (inverse relationship - lower cost is better)
    const normalizedCostEfficiency = Math.max(0, 100 - costPerUnit * 10);
    // Normalize concentration (moderate concentration is best)
    const idealConcentration = 20; // 20% is considered ideal
    const concentrationPenalty =
      Math.abs(categoryPercentage - idealConcentration) * 2;
    const normalizedConcentration = Math.max(0, 100 - concentrationPenalty);
    const efficiencyScore =
      normalizedUtilization * utilizationWeight +
      normalizedCostEfficiency * costWeight +
      normalizedConcentration * concentrationWeight;
    return Math.min(100, Math.max(0, efficiencyScore));
  }
}
//# sourceMappingURL=budget-optimization-engine.js.map
