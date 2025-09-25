/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Default efficiency analysis configuration
 */
export const DEFAULT_EFFICIENCY_CONFIG = {
    analysisWindow: 30,
    minDataPoints: 10,
    thresholds: {
        high: 80,
        medium: 60,
        low: 40,
    },
    enableAdvancedAnalysis: true,
    weights: {
        cost: 0.3,
        utilization: 0.25,
        roi: 0.25,
        performance: 0.2,
    },
};
/**
 * Budget allocation efficiency analyzer
 * Provides comprehensive efficiency analysis and optimization recommendations
 */
export class EfficiencyAnalyzer {
    config;
    /**
     * Create efficiency analyzer instance
     * @param config - Analyzer configuration
     */
    constructor(config = {}) {
        this.config = { ...DEFAULT_EFFICIENCY_CONFIG, ...config };
        this.validateConfiguration();
    }
    /**
     * Analyze resource efficiency
     * @param candidate - Allocation candidate to analyze
     * @param historicalData - Historical usage and cost data
     * @returns Resource efficiency analysis
     */
    analyzeResourceEfficiency(candidate, historicalData) {
        // Calculate individual efficiency metrics
        const costEfficiency = this.calculateCostEfficiency(candidate, historicalData);
        const utilizationEfficiency = this.calculateUtilizationEfficiency(candidate, historicalData);
        const roiEfficiency = this.calculateROIEfficiency(candidate, historicalData);
        const performanceEfficiency = this.calculatePerformanceEfficiency(candidate, historicalData);
        // Calculate overall efficiency score
        const overallScore = this.calculateOverallEfficiencyScore({
            cost: costEfficiency,
            utilization: utilizationEfficiency,
            roi: roiEfficiency,
            performance: performanceEfficiency,
        });
        // Classify efficiency level
        const classification = this.classifyEfficiency(overallScore);
        // Analyze trends
        const trends = this.analyzeTrends(candidate, historicalData);
        // Identify inefficiencies
        const inefficiencies = this.identifyInefficiencies(candidate, historicalData, {
            cost: costEfficiency,
            utilization: utilizationEfficiency,
            roi: roiEfficiency,
            performance: performanceEfficiency,
        });
        // Generate improvement recommendations
        const improvements = this.generateImprovements(candidate, inefficiencies, trends);
        return {
            resourceId: candidate.resourceId,
            overallScore,
            costEfficiency,
            utilizationEfficiency,
            roiEfficiency,
            performanceEfficiency,
            classification,
            trends,
            inefficiencies,
            improvements,
        };
    }
    /**
     * Analyze portfolio efficiency
     * @param candidates - All allocation candidates
     * @param historicalData - Historical data for all resources
     * @returns Portfolio efficiency analysis
     */
    analyzePortfolioEfficiency(candidates, historicalData) {
        // Analyze individual resource efficiencies
        const resourceEfficiencies = candidates.map(candidate => this.analyzeResourceEfficiency(candidate, historicalData[candidate.resourceId] || []));
        // Calculate overall portfolio score
        const overallScore = resourceEfficiencies.reduce((sum, efficiency) => sum + efficiency.overallScore, 0) / resourceEfficiencies.length;
        // Analyze portfolio-level trends
        const portfolioTrends = this.analyzePortfolioTrends(resourceEfficiencies);
        // Identify cross-resource issues
        const crossResourceIssues = this.identifyCrossResourceIssues(resourceEfficiencies, candidates);
        // Generate optimization opportunities
        const optimizationOpportunities = this.generatePortfolioOptimizations(resourceEfficiencies, candidates);
        // Calculate distribution
        const distribution = this.calculateEfficiencyDistribution(resourceEfficiencies);
        // Calculate benchmarks
        const benchmarks = this.calculateBenchmarks(resourceEfficiencies, historicalData);
        return {
            overallScore,
            resourceEfficiencies,
            portfolioTrends,
            crossResourceIssues,
            optimizationOpportunities,
            distribution,
            benchmarks,
        };
    }
    /**
     * Analyze allocation scenario efficiency
     * @param scenario - Allocation scenario to analyze
     * @param historicalData - Historical data for analysis
     * @returns Scenario efficiency analysis
     */
    analyzeScenarioEfficiency(scenario, historicalData) {
        const efficiencyGains = {};
        const risks = [];
        const recommendations = [];
        let totalScore = 0;
        let totalImprovement = 0;
        // Analyze each allocation in the scenario
        for (const allocation of scenario.allocations) {
            const resourceData = historicalData[allocation.resourceId] || [];
            // Calculate efficiency gain from current to recommended allocation
            const currentEfficiency = this.calculateAllocationEfficiency(allocation.currentAllocation, resourceData);
            const recommendedEfficiency = this.calculateAllocationEfficiency(allocation.recommendedAllocation, resourceData);
            const gain = recommendedEfficiency - currentEfficiency;
            efficiencyGains[allocation.resourceId] = gain;
            totalScore += recommendedEfficiency;
            totalImprovement += gain;
            // Identify risks for this allocation
            if (allocation.riskAssessment.riskLevel !== 'low') {
                risks.push({
                    type: 'performance_degradation',
                    severity: allocation.riskAssessment.riskLevel,
                    description: `High risk allocation for ${allocation.resourceId}`,
                    impact: {
                        financial: allocation.expectedImpact.costImpact,
                        performance: allocation.expectedImpact.performanceImpact,
                        utilization: allocation.expectedImpact.utilizationImpact,
                    },
                    rootCause: allocation.riskAssessment.riskFactors.join(', '),
                    detectedAt: new Date(),
                });
            }
            // Generate recommendations for optimization
            if (gain < 5) { // Less than 5% efficiency gain
                recommendations.push({
                    type: 'optimization',
                    priority: 'medium',
                    description: `Consider alternative allocation strategy for ${allocation.resourceId}`,
                    expectedBenefits: {
                        costSavings: Math.abs(allocation.expectedImpact.costImpact),
                        performanceGain: allocation.expectedImpact.performanceImpact,
                        utilizationGain: allocation.expectedImpact.utilizationImpact,
                        roiGain: allocation.expectedImpact.roiImpact,
                    },
                    implementationEffort: 'medium',
                    timeline: 'short_term',
                    successMetrics: ['efficiency_score', 'cost_reduction', 'utilization_improvement'],
                });
            }
        }
        const scenarioScore = totalScore / scenario.allocations.length;
        const improvementFromCurrent = totalImprovement / scenario.allocations.length;
        return {
            scenarioScore,
            improvementFromCurrent,
            efficiencyGains,
            risks,
            recommendations,
        };
    }
    /**
     * Calculate cost efficiency score
     */
    calculateCostEfficiency(candidate, historicalData) {
        if (historicalData.length === 0)
            return 50; // Default score
        const avgCostPerUnit = historicalData.reduce((sum, data) => sum + (data.totalCost / data.usage), 0) / historicalData.length;
        const currentCostPerUnit = candidate.currentAllocation / candidate.projectedUsage;
        // Lower cost per unit is better (inverse relationship)
        const efficiency = Math.max(0, Math.min(100, 100 - ((currentCostPerUnit / avgCostPerUnit - 1) * 50)));
        return efficiency;
    }
    /**
     * Calculate utilization efficiency score
     */
    calculateUtilizationEfficiency(candidate, historicalData) {
        if (historicalData.length === 0)
            return 50; // Default score
        const avgUtilization = historicalData.reduce((sum, data) => sum + data.utilizationRate, 0) / historicalData.length;
        // Optimal utilization is around 80%
        const optimalUtilization = 0.8;
        const deviation = Math.abs(avgUtilization - optimalUtilization);
        return Math.max(0, Math.min(100, 100 - (deviation * 200)));
    }
    /**
     * Calculate ROI efficiency score
     */
    calculateROIEfficiency(candidate, historicalData) {
        if (historicalData.length === 0)
            return 50; // Default score
        const avgROI = historicalData.reduce((sum, data) => sum + (data.revenue / data.totalCost), 0) / historicalData.length;
        // ROI > 1 is good, scale to 0-100
        return Math.max(0, Math.min(100, avgROI * 50));
    }
    /**
     * Calculate performance efficiency score
     */
    calculatePerformanceEfficiency(candidate, historicalData) {
        if (historicalData.length === 0)
            return 50; // Default score
        // Use business impact as performance proxy
        const businessImpactScore = (candidate.businessImpact / 100) * 100;
        // Factor in technical complexity (lower is better for efficiency)
        const complexityPenalty = (candidate.technicalComplexity / 100) * 20;
        return Math.max(0, Math.min(100, businessImpactScore - complexityPenalty));
    }
    /**
     * Calculate overall efficiency score using weighted average
     */
    calculateOverallEfficiencyScore(scores) {
        return (scores.cost * this.config.weights.cost +
            scores.utilization * this.config.weights.utilization +
            scores.roi * this.config.weights.roi +
            scores.performance * this.config.weights.performance);
    }
    /**
     * Classify efficiency level based on score
     */
    classifyEfficiency(score) {
        if (score >= this.config.thresholds.high)
            return 'high';
        if (score >= this.config.thresholds.medium)
            return 'medium';
        if (score >= this.config.thresholds.low)
            return 'low';
        return 'critical';
    }
    /**
     * Analyze efficiency trends
     */
    analyzeTrends(candidate, historicalData) {
        if (historicalData.length < this.config.minDataPoints) {
            return [];
        }
        const trends = [];
        // Analyze cost trend
        const costTrend = this.calculateTrend(historicalData.map(data => ({
            timestamp: new Date(data.timestamp),
            value: data.totalCost / data.usage,
        })));
        trends.push({
            metric: 'cost',
            ...costTrend,
        });
        // Analyze utilization trend
        const utilizationTrend = this.calculateTrend(historicalData.map(data => ({
            timestamp: new Date(data.timestamp),
            value: data.utilizationRate * 100,
        })));
        trends.push({
            metric: 'utilization',
            ...utilizationTrend,
        });
        // Analyze ROI trend
        const roiTrend = this.calculateTrend(historicalData.map(data => ({
            timestamp: new Date(data.timestamp),
            value: (data.revenue / data.totalCost) * 100,
        })));
        trends.push({
            metric: 'roi',
            ...roiTrend,
        });
        return trends;
    }
    /**
     * Calculate trend from data points
     */
    calculateTrend(dataPoints) {
        if (dataPoints.length < 2) {
            return {
                direction: 'stable',
                strength: 0,
                changeRate: 0,
                significance: 'low',
                dataPoints,
            };
        }
        // Calculate linear regression slope
        const n = dataPoints.length;
        const sumX = dataPoints.reduce((sum, point, index) => sum + index, 0);
        const sumY = dataPoints.reduce((sum, point) => sum + point.value, 0);
        const sumXY = dataPoints.reduce((sum, point, index) => sum + (index * point.value), 0);
        const sumX2 = dataPoints.reduce((sum, point, index) => sum + (index * index), 0);
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const changeRate = slope;
        // Determine direction
        let direction = 'stable';
        if (Math.abs(slope) > 0.1) {
            direction = slope > 0 ? 'improving' : 'declining';
        }
        // Calculate strength (correlation coefficient)
        const avgX = sumX / n;
        const avgY = sumY / n;
        const numerator = dataPoints.reduce((sum, point, index) => sum + ((index - avgX) * (point.value - avgY)), 0);
        const denomX = Math.sqrt(dataPoints.reduce((sum, point, index) => sum + Math.pow(index - avgX, 2), 0));
        const denomY = Math.sqrt(dataPoints.reduce((sum, point) => sum + Math.pow(point.value - avgY, 2), 0));
        const correlation = denomX * denomY === 0 ? 0 : numerator / (denomX * denomY);
        const strength = Math.abs(correlation) * 100;
        // Determine significance
        let significance = 'low';
        if (strength > 70)
            significance = 'high';
        else if (strength > 40)
            significance = 'medium';
        return {
            direction,
            strength,
            changeRate,
            significance,
            dataPoints,
        };
    }
    /**
     * Identify inefficiencies
     */
    identifyInefficiencies(candidate, historicalData, efficiencyScores) {
        const issues = [];
        // Check for underutilization
        if (efficiencyScores.utilization < this.config.thresholds.medium) {
            issues.push({
                type: 'underutilization',
                severity: efficiencyScores.utilization < this.config.thresholds.low ? 'high' : 'medium',
                description: 'Resource is underutilized, leading to inefficient budget allocation',
                impact: {
                    financial: candidate.currentAllocation * 0.2, // Estimate 20% waste
                    performance: 100 - efficiencyScores.utilization,
                    utilization: 100 - efficiencyScores.utilization,
                },
                rootCause: 'Allocation exceeds actual usage patterns',
                detectedAt: new Date(),
            });
        }
        // Check for cost inefficiency
        if (efficiencyScores.cost < this.config.thresholds.medium) {
            issues.push({
                type: 'cost_inefficiency',
                severity: efficiencyScores.cost < this.config.thresholds.low ? 'high' : 'medium',
                description: 'Resource has poor cost efficiency compared to alternatives',
                impact: {
                    financial: candidate.currentAllocation * 0.15, // Estimate 15% excess cost
                    performance: 0,
                    utilization: 0,
                },
                rootCause: 'Suboptimal resource selection or configuration',
                detectedAt: new Date(),
            });
        }
        // Check for performance degradation
        if (efficiencyScores.performance < this.config.thresholds.medium) {
            issues.push({
                type: 'performance_degradation',
                severity: efficiencyScores.performance < this.config.thresholds.low ? 'critical' : 'medium',
                description: 'Resource performance is below expectations',
                impact: {
                    financial: 0,
                    performance: 100 - efficiencyScores.performance,
                    utilization: 0,
                },
                rootCause: 'Resource constraints or configuration issues',
                detectedAt: new Date(),
            });
        }
        return issues;
    }
    /**
     * Generate improvement recommendations
     */
    generateImprovements(candidate, inefficiencies, trends) {
        const improvements = [];
        // Address each inefficiency
        for (const issue of inefficiencies) {
            switch (issue.type) {
                case 'underutilization':
                    improvements.push({
                        type: 'reallocation',
                        priority: issue.severity,
                        description: 'Reduce allocation to match actual usage patterns',
                        expectedBenefits: {
                            costSavings: issue.impact.financial,
                            performanceGain: 0,
                            utilizationGain: issue.impact.utilization,
                            roiGain: issue.impact.financial / candidate.currentAllocation,
                        },
                        implementationEffort: 'low',
                        timeline: 'immediate',
                        successMetrics: ['utilization_rate', 'cost_per_unit', 'allocation_efficiency'],
                    });
                    break;
                case 'cost_inefficiency':
                    improvements.push({
                        type: 'optimization',
                        priority: issue.severity,
                        description: 'Optimize resource configuration for better cost efficiency',
                        expectedBenefits: {
                            costSavings: issue.impact.financial,
                            performanceGain: 10,
                            utilizationGain: 5,
                            roiGain: issue.impact.financial / candidate.currentAllocation,
                        },
                        implementationEffort: 'medium',
                        timeline: 'short_term',
                        successMetrics: ['cost_per_unit', 'total_cost', 'roi'],
                    });
                    break;
                case 'performance_degradation':
                    improvements.push({
                        type: 'scaling',
                        priority: 'high',
                        description: 'Scale resources to meet performance requirements',
                        expectedBenefits: {
                            costSavings: 0,
                            performanceGain: issue.impact.performance,
                            utilizationGain: 10,
                            roiGain: 0.05,
                        },
                        implementationEffort: 'medium',
                        timeline: 'short_term',
                        successMetrics: ['response_time', 'throughput', 'performance_score'],
                    });
                    break;
                default:
                    // Handle unexpected values
                    break;
            }
            return improvements;
        }
        /**
         * Analyze portfolio-level trends
         */
    }
    /**
     * Analyze portfolio-level trends
     */
    analyzePortfolioTrends(resourceEfficiencies) {
        // Aggregate trends across all resources
        const portfolioTrends = [];
        // Calculate overall efficiency trend
        const overallScores = resourceEfficiencies.flatMap(resource => resource.trends
            .filter(trend => trend.metric === 'overall')
            .flatMap(trend => trend.dataPoints));
        if (overallScores.length > 0) {
            const overallTrend = this.calculateTrend(overallScores);
            portfolioTrends.push({
                metric: 'overall',
                ...overallTrend,
            });
        }
        return portfolioTrends;
    }
    /**
     * Identify cross-resource issues
     */
    identifyCrossResourceIssues(resourceEfficiencies, candidates) {
        const issues = [];
        // Check for portfolio imbalances
        const highEfficiencyCount = resourceEfficiencies.filter(r => r.classification === 'high').length;
        const lowEfficiencyCount = resourceEfficiencies.filter(r => r.classification === 'low').length;
        if (lowEfficiencyCount > highEfficiencyCount) {
            issues.push({
                type: 'overallocation',
                severity: 'medium',
                description: 'Portfolio has more low-efficiency than high-efficiency resources',
                impact: {
                    financial: candidates.reduce((sum, c) => sum + c.currentAllocation, 0) * 0.1,
                    performance: 15,
                    utilization: 10,
                },
                rootCause: 'Suboptimal resource allocation across portfolio',
                detectedAt: new Date(),
            });
        }
        return issues;
    }
    /**
     * Generate portfolio optimization opportunities
     */
    generatePortfolioOptimizations(resourceEfficiencies, candidates) {
        const optimizations = [];
        // Identify rebalancing opportunities
        const lowEfficiencyResources = resourceEfficiencies.filter(r => r.classification === 'low');
        const highEfficiencyResources = resourceEfficiencies.filter(r => r.classification === 'high');
        if (lowEfficiencyResources.length > 0 && highEfficiencyResources.length > 0) {
            optimizations.push({
                type: 'reallocation',
                priority: 'high',
                description: 'Reallocate budget from low-efficiency to high-efficiency resources',
                expectedBenefits: {
                    costSavings: 0,
                    performanceGain: 20,
                    utilizationGain: 15,
                    roiGain: 0.1,
                },
                implementationEffort: 'medium',
                timeline: 'medium_term',
                successMetrics: ['portfolio_efficiency', 'overall_roi', 'resource_balance'],
            });
        }
        return optimizations;
    }
    /**
     * Calculate efficiency distribution
     */
    calculateEfficiencyDistribution(resourceEfficiencies) {
        return {
            high: resourceEfficiencies.filter(r => r.classification === 'high').length,
            medium: resourceEfficiencies.filter(r => r.classification === 'medium').length,
            low: resourceEfficiencies.filter(r => r.classification === 'low').length,
            critical: resourceEfficiencies.filter(r => r.classification === 'critical').length,
        };
    }
    /**
     * Calculate benchmark comparisons
     */
    calculateBenchmarks(resourceEfficiencies, historicalData) {
        const currentScore = resourceEfficiencies.reduce((sum, r) => sum + r.overallScore, 0) / resourceEfficiencies.length;
        // Calculate historical best (simplified)
        const historicalBest = Math.min(100, currentScore + 15); // Assume best was 15% higher
        return {
            industry: 75, // Industry benchmark assumption
            historicalBest,
            peerAverage: 65, // Peer average assumption
        };
    }
    /**
     * Calculate allocation efficiency for a given allocation amount
     */
    calculateAllocationEfficiency(allocation, historicalData) {
        if (historicalData.length === 0)
            return 50;
        // Simple efficiency calculation based on cost per unit
        const avgUsage = historicalData.reduce((sum, data) => sum + data.usage, 0) / historicalData.length;
        const costPerUnit = allocation / avgUsage;
        // Normalize to 0-100 scale (lower cost per unit is better)
        return Math.max(0, Math.min(100, 100 - (costPerUnit / 10))); // Simplified normalization
    }
    /**
     * Validate configuration
     */
    validateConfiguration() {
        const { weights, thresholds } = this.config;
        // Validate weights sum to 1.0
        const weightSum = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        if (Math.abs(weightSum - 1.0) > 0.01) {
            throw new Error('Efficiency analyzer weights must sum to 1.0');
        }
        // Validate weight ranges
        for (const [key, weight] of Object.entries(weights)) {
            if (weight < 0 || weight > 1) {
                throw new Error(`Weight ${key} must be between 0 and 1`);
            }
        }
        // Validate thresholds
        if (thresholds.high <= thresholds.medium || thresholds.medium <= thresholds.low) {
            throw new Error('Efficiency thresholds must be in descending order');
        }
    }
}
/**
 * Create efficiency analyzer instance
 * @param config - Analyzer configuration
 * @returns EfficiencyAnalyzer instance
 */
export function createEfficiencyAnalyzer(config) {
    return new EfficiencyAnalyzer(config);
}
//# sourceMappingURL=EfficiencyAnalyzer.js.map