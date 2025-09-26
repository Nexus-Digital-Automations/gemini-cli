/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseAllocationAlgorithm, } from './BaseAllocationAlgorithm.js';
/**
 * @fileoverview Usage-based allocation algorithm implementation
 * Allocates budget based on historical usage patterns and demand trends
 *
 * @author Claude Code - Budget Allocation Agent
 * @version 1.0.0
 */
/**
 * Usage-based allocation algorithm that distributes budget based on:
 * - Historical usage patterns
 * - Current utilization rates
 * - Usage trend projections
 * - Demand elasticity analysis
 */
export class UsageBasedAlgorithm extends BaseAllocationAlgorithm {
    candidatesMap = new Map();
    /**
     * Create usage-based allocation algorithm
     * @param config - Algorithm configuration
     * @param logger - Logger instance
     */
    constructor(config, logger) {
        super('usage_based', config, logger);
    }
    /**
     * Execute usage-based allocation optimization
     * @param candidates - Array of allocation candidates
     * @returns Array of allocation recommendations
     */
    async executeOptimization(candidates) {
        this.logger.info('Starting usage-based allocation optimization', {
            candidateCount: candidates.length,
            strategy: 'usage_based',
        });
        // Build candidate lookup map
        this.candidatesMap.clear();
        candidates.forEach((candidate) => {
            this.candidatesMap.set(candidate.resourceId, candidate);
        });
        // Calculate usage metrics for each candidate
        const usageMetrics = this.calculateUsageMetrics(candidates);
        // Determine allocation adjustments based on usage patterns
        const allocationAdjustments = this.calculateUsageBasedAdjustments(candidates, usageMetrics);
        // Apply constraints and generate recommendations
        const recommendations = this.generateRecommendations(candidates, usageMetrics, allocationAdjustments);
        // Ensure budget balance while respecting usage patterns
        const balancedRecommendations = this.ensureBudgetBalance(candidates, recommendations);
        this.logger.info('Usage-based optimization completed', {
            recommendationCount: balancedRecommendations.length,
            totalRebalanced: balancedRecommendations.reduce((sum, r) => sum + Math.abs(r.allocationChange), 0),
        });
        return balancedRecommendations;
    }
    /**
     * Calculate comprehensive usage metrics for allocation decisions
     * @param candidates - Allocation candidates
     * @returns Usage metrics for each candidate
     */
    calculateUsageMetrics(candidates) {
        const metrics = new Map();
        for (const candidate of candidates) {
            const costAnalysis = candidate.costAnalysis;
            const currentUtilization = this.calculateUtilizationRate(candidate);
            const usageTrend = this.calculateUsageTrend(candidate);
            const demandElasticity = this.calculateDemandElasticity(candidate);
            const seasonalityFactor = this.calculateSeasonalityFactor(candidate);
            const usageMetric = {
                resourceId: candidate.resourceId,
                currentUtilization,
                usageTrend,
                demandElasticity,
                seasonalityFactor,
                averageCostPerRequest: costAnalysis.averageCostPerRequest,
                requestVelocity: this.calculateRequestVelocity(candidate),
                peakUsageRatio: this.calculatePeakUsageRatio(candidate),
                usageVolatility: this.calculateUsageVolatility(candidate),
                predictedGrowth: this.predictUsageGrowth(candidate),
            };
            metrics.set(candidate.resourceId, usageMetric);
            this.logger.debug('Usage metrics calculated', {
                resourceId: candidate.resourceId,
                utilization: currentUtilization,
                trend: usageTrend,
                growth: usageMetric.predictedGrowth,
            });
        }
        return metrics;
    }
    /**
     * Calculate usage-based allocation adjustments
     * @param candidates - Allocation candidates
     * @param usageMetrics - Calculated usage metrics
     * @returns Allocation adjustment factors for each candidate
     */
    calculateUsageBasedAdjustments(candidates, usageMetrics) {
        const adjustments = new Map();
        const _totalCurrentBudget = this.calculateTotalCurrentBudget(candidates);
        for (const candidate of candidates) {
            const metrics = usageMetrics.get(candidate.resourceId);
            if (!metrics)
                continue;
            // Base adjustment on utilization rate
            let adjustmentFactor = this.calculateUtilizationAdjustment(metrics);
            // Apply usage trend adjustment
            adjustmentFactor *= this.calculateTrendAdjustment(metrics);
            // Apply demand elasticity adjustment
            adjustmentFactor *= this.calculateElasticityAdjustment(metrics);
            // Apply seasonal adjustment
            adjustmentFactor *= this.calculateSeasonalAdjustment(metrics);
            // Apply predicted growth adjustment
            adjustmentFactor *= this.calculateGrowthAdjustment(metrics);
            // Constrain adjustment factor to reasonable bounds
            adjustmentFactor = Math.max(0.5, Math.min(2.0, adjustmentFactor));
            adjustments.set(candidate.resourceId, adjustmentFactor);
            this.logger.debug('Calculated usage-based adjustment', {
                resourceId: candidate.resourceId,
                adjustmentFactor,
                currentAllocation: candidate.currentAllocation,
            });
        }
        return adjustments;
    }
    /**
     * Calculate utilization rate for a candidate
     * @param candidate - Allocation candidate
     * @returns Utilization rate (0-1)
     */
    calculateUtilizationRate(candidate) {
        const costAnalysis = candidate.costAnalysis;
        return Math.min(1.0, costAnalysis.utilizationRate || 0);
    }
    /**
     * Calculate usage trend direction and strength
     * @param candidate - Allocation candidate
     * @returns Usage trend (-1 to 1, where 1 = strong upward trend)
     */
    calculateUsageTrend(candidate) {
        const costTrend = candidate.costAnalysis.costTrend;
        switch (costTrend) {
            case 'increasing':
                return 0.8;
            case 'decreasing':
                return -0.6;
            case 'stable':
                return 0;
            case 'volatile':
                return 0.2; // Slight positive for volatility accommodation
            default:
                return 0;
        }
    }
    /**
     * Calculate demand elasticity for resource allocation
     * @param candidate - Allocation candidate
     * @returns Demand elasticity factor (0-2, where >1 = elastic)
     */
    calculateDemandElasticity(candidate) {
        // Estimate elasticity based on business impact and technical complexity
        const businessImpact = candidate.businessImpact / 100;
        const complexity = candidate.technicalComplexity / 100;
        // High business impact with low complexity = more elastic
        // Low business impact with high complexity = less elastic
        const elasticity = (businessImpact * 1.5) / Math.max(0.1, complexity);
        return Math.max(0.2, Math.min(2.0, elasticity));
    }
    /**
     * Calculate seasonality factor for usage patterns
     * @param candidate - Allocation candidate
     * @returns Seasonality factor (0.5-1.5)
     */
    calculateSeasonalityFactor(candidate) {
        // Simplified seasonality based on peak usage hours
        const peakHours = candidate.costAnalysis.peakUsageHours;
        if (peakHours.length > 12) {
            return 1.2; // High usage spread suggests higher demand
        }
        else if (peakHours.length > 6) {
            return 1.0; // Moderate usage pattern
        }
        else {
            return 0.8; // Concentrated usage pattern
        }
    }
    /**
     * Calculate request velocity (requests per unit time)
     * @param candidate - Allocation candidate
     * @returns Request velocity score
     */
    calculateRequestVelocity(candidate) {
        const requests = candidate.costAnalysis.requestCount;
        const frequency = candidate.costAnalysis.usageFrequency;
        return (requests * frequency) / 24; // Approximate requests per hour
    }
    /**
     * Calculate peak to average usage ratio
     * @param candidate - Allocation candidate
     * @returns Peak usage ratio (1+)
     */
    calculatePeakUsageRatio(candidate) {
        const peakHours = candidate.costAnalysis.peakUsageHours.length;
        const _totalHours = 24;
        // Estimate peak ratio based on concentration of usage
        if (peakHours <= 4) {
            return 3.0; // High peak concentration
        }
        else if (peakHours <= 8) {
            return 2.0; // Moderate peak concentration
        }
        else {
            return 1.2; // Low peak concentration
        }
    }
    /**
     * Calculate usage volatility measure
     * @param candidate - Allocation candidate
     * @returns Volatility score (0-1)
     */
    calculateUsageVolatility(candidate) {
        return candidate.costAnalysis.costTrend === 'volatile' ? 0.8 : 0.2;
    }
    /**
     * Predict future usage growth
     * @param candidate - Allocation candidate
     * @returns Predicted growth factor (0-2+)
     */
    predictUsageGrowth(candidate) {
        const trend = this.calculateUsageTrend(candidate);
        const businessImpact = candidate.businessImpact / 100;
        const roi = Math.max(0, candidate.costAnalysis.roi);
        // Combine trend, business impact, and ROI for growth prediction
        const growthFactor = 1 + trend * 0.3 + businessImpact * 0.2 + roi * 0.1;
        return Math.max(0.5, Math.min(3.0, growthFactor));
    }
    /**
     * Calculate utilization-based adjustment factor
     * @param metrics - Usage metrics
     * @returns Adjustment factor
     */
    calculateUtilizationAdjustment(metrics) {
        const utilization = metrics.currentUtilization;
        if (utilization > 0.9) {
            return 1.4; // High utilization, increase allocation
        }
        else if (utilization > 0.7) {
            return 1.2; // Moderate-high utilization
        }
        else if (utilization > 0.5) {
            return 1.0; // Normal utilization
        }
        else if (utilization > 0.2) {
            return 0.8; // Low utilization, decrease allocation
        }
        else {
            return 0.6; // Very low utilization
        }
    }
    /**
     * Calculate trend-based adjustment factor
     * @param metrics - Usage metrics
     * @returns Adjustment factor
     */
    calculateTrendAdjustment(metrics) {
        const trend = metrics.usageTrend;
        return 1.0 + trend * 0.3; // ±30% adjustment based on trend
    }
    /**
     * Calculate elasticity-based adjustment factor
     * @param metrics - Usage metrics
     * @returns Adjustment factor
     */
    calculateElasticityAdjustment(metrics) {
        const elasticity = metrics.demandElasticity;
        // More elastic resources get more budget to respond to demand
        return Math.min(1.3, Math.max(0.8, elasticity));
    }
    /**
     * Calculate seasonal adjustment factor
     * @param metrics - Usage metrics
     * @returns Adjustment factor
     */
    calculateSeasonalAdjustment(metrics) {
        return metrics.seasonalityFactor;
    }
    /**
     * Calculate growth-based adjustment factor
     * @param metrics - Usage metrics
     * @returns Adjustment factor
     */
    calculateGrowthAdjustment(metrics) {
        const growth = metrics.predictedGrowth;
        // Adjust for predicted growth, but cap the adjustment
        return Math.min(1.5, Math.max(0.7, growth));
    }
    /**
     * Generate allocation recommendations based on usage analysis
     * @param candidates - Original candidates
     * @param usageMetrics - Calculated usage metrics
     * @param adjustments - Calculated adjustments
     * @returns Initial recommendations
     */
    generateRecommendations(candidates, usageMetrics, adjustments) {
        const recommendations = [];
        for (const candidate of candidates) {
            const adjustmentFactor = adjustments.get(candidate.resourceId) || 1.0;
            const metrics = usageMetrics.get(candidate.resourceId);
            if (!metrics)
                continue;
            const newAllocation = Math.max(candidate.constraints.minAllocation, Math.min(candidate.constraints.maxAllocation, candidate.currentAllocation * adjustmentFactor));
            const allocationChange = newAllocation - candidate.currentAllocation;
            const potentialSavings = Math.max(0, -allocationChange);
            const recommendation = {
                id: `usage_${candidate.resourceId}_${Date.now()}`,
                resourceId: candidate.resourceId,
                type: 'budget_reallocation',
                title: `Usage-based allocation adjustment for ${candidate.resourceName}`,
                description: this.generateRecommendationDescription(candidate, metrics, adjustmentFactor),
                currentAllocation: candidate.currentAllocation,
                recommendedAllocation: newAllocation,
                allocationChange,
                potentialSavings,
                savingsPercentage: candidate.currentAllocation > 0
                    ? (potentialSavings / candidate.currentAllocation) * 100
                    : 0,
                implementationComplexity: 'low',
                strategy: 'usage_based',
                confidence: this.calculateConfidence(candidate, metrics),
                expectedImpact: this.calculateExpectedImpact(candidate, metrics, allocationChange),
                riskAssessment: this.assessRisk(candidate, metrics, allocationChange),
                dependencies: [],
                priority: candidate.priority,
                estimatedTimeToImplement: '1-2 days',
                category: 'cost_optimization',
                tags: ['usage-based', 'automatic', 'data-driven'],
            };
            recommendations.push(recommendation);
        }
        return recommendations;
    }
    /**
     * Generate human-readable recommendation description
     * @param candidate - Allocation candidate
     * @param metrics - Usage metrics
     * @param adjustmentFactor - Applied adjustment factor
     * @returns Description text
     */
    generateRecommendationDescription(candidate, metrics, adjustmentFactor) {
        const utilizationPct = Math.round(metrics.currentUtilization * 100);
        const changeDirection = adjustmentFactor > 1.0 ? 'increase' : 'decrease';
        const changePct = Math.round(Math.abs(adjustmentFactor - 1.0) * 100);
        let description = `${changeDirection} allocation by ${changePct}% based on usage analysis. `;
        description += `Current utilization: ${utilizationPct}%. `;
        if (metrics.usageTrend > 0.3) {
            description += 'Strong upward usage trend detected. ';
        }
        else if (metrics.usageTrend < -0.3) {
            description += 'Downward usage trend observed. ';
        }
        if (metrics.predictedGrowth > 1.2) {
            description += 'Predicted growth requires additional capacity. ';
        }
        else if (metrics.predictedGrowth < 0.8) {
            description += 'Declining usage suggests optimization opportunity. ';
        }
        return description;
    }
    /**
     * Calculate confidence level for recommendation
     * @param candidate - Allocation candidate
     * @param metrics - Usage metrics
     * @returns Confidence score (0-100)
     */
    calculateConfidence(candidate, metrics) {
        let confidence = 70; // Base confidence
        // Higher confidence for stable patterns
        if (metrics.usageVolatility < 0.3) {
            confidence += 15;
        }
        else if (metrics.usageVolatility > 0.7) {
            confidence -= 10;
        }
        // Higher confidence for strong trends
        const trendStrength = Math.abs(metrics.usageTrend);
        confidence += trendStrength * 15;
        // Higher confidence for high utilization resources
        if (metrics.currentUtilization > 0.8) {
            confidence += 10;
        }
        return Math.max(50, Math.min(95, confidence));
    }
    /**
     * Calculate expected impact from allocation change
     * @param candidate - Allocation candidate
     * @param metrics - Usage metrics
     * @param allocationChange - Allocation change amount
     * @returns Expected impact metrics
     */
    calculateExpectedImpact(candidate, metrics, allocationChange) {
        const changeRatio = candidate.currentAllocation > 0
            ? allocationChange / candidate.currentAllocation
            : 0;
        return {
            costImpact: allocationChange,
            performanceImpact: Math.max(0, changeRatio * 20), // Up to 20% performance improvement
            utilizationImpact: changeRatio * 0.3, // Utilization change
            businessValueImpact: changeRatio * candidate.businessImpact * 0.1,
            roiImpact: changeRatio * candidate.costAnalysis.roi * 0.2,
            impactTimeline: 'short_term',
        };
    }
    /**
     * Assess risk for allocation change
     * @param candidate - Allocation candidate
     * @param metrics - Usage metrics
     * @param allocationChange - Allocation change amount
     * @returns Risk assessment
     */
    assessRisk(candidate, metrics, allocationChange) {
        let riskLevel = 'low';
        const riskFactors = [];
        const mitigationStrategies = [];
        const changeRatio = Math.abs(allocationChange) / candidate.currentAllocation;
        // Assess risk based on change magnitude
        if (changeRatio > 0.5) {
            riskLevel = 'high';
            riskFactors.push('Large allocation change (>50%)');
            mitigationStrategies.push('Implement change gradually over multiple cycles');
        }
        else if (changeRatio > 0.25) {
            riskLevel = 'medium';
            riskFactors.push('Moderate allocation change (>25%)');
            mitigationStrategies.push('Monitor usage closely after implementation');
        }
        // Assess volatility risk
        if (metrics.usageVolatility > 0.6) {
            if (riskLevel === 'low')
                riskLevel = 'medium';
            riskFactors.push('High usage volatility');
            mitigationStrategies.push('Maintain buffer allocation for volatility');
        }
        // Assess business impact risk
        if (candidate.businessImpact > 80 && allocationChange < 0) {
            riskLevel = 'high';
            riskFactors.push('Reducing allocation for high business impact resource');
            mitigationStrategies.push('Ensure SLA requirements remain met');
        }
        if (riskFactors.length === 0) {
            riskFactors.push('Standard allocation adjustment based on usage patterns');
            mitigationStrategies.push('Regular monitoring and adjustment');
        }
        return {
            riskLevel,
            riskFactors,
            mitigationStrategies,
            maxNegativeImpact: Math.abs(allocationChange) * 1.2,
            negativeProbability: riskLevel === 'high' ? 30 : riskLevel === 'medium' ? 15 : 5,
        };
    }
    /**
     * Ensure budget balance across all recommendations
     * @param originalCandidates - Original candidates
     * @param recommendations - Initial recommendations
     * @returns Balanced recommendations
     */
    ensureBudgetBalance(originalCandidates, recommendations) {
        const originalTotal = this.calculateTotalCurrentBudget(originalCandidates);
        const recommendedTotal = recommendations.reduce((sum, r) => sum + r.recommendedAllocation, 0);
        const difference = recommendedTotal - originalTotal;
        if (Math.abs(difference) < originalTotal * 0.001) {
            return recommendations; // Already balanced within tolerance
        }
        this.logger.info('Balancing budget allocations', {
            originalTotal,
            recommendedTotal,
            difference,
        });
        // Apply proportional adjustment to balance budget
        const balancedRecommendations = recommendations.map((recommendation) => {
            const candidate = this.candidatesMap.get(recommendation.resourceId);
            if (!candidate)
                return recommendation;
            const adjustment = -difference / recommendations.length;
            const newRecommendedAllocation = Math.max(candidate.constraints.minAllocation, Math.min(candidate.constraints.maxAllocation, recommendation.recommendedAllocation + adjustment));
            return {
                ...recommendation,
                recommendedAllocation: newRecommendedAllocation,
                allocationChange: newRecommendedAllocation - candidate.currentAllocation,
                potentialSavings: Math.max(0, candidate.currentAllocation - newRecommendedAllocation),
            };
        });
        return balancedRecommendations;
    }
    /**
     * Find candidate by resource ID (implementation for base class)
     * @param resourceId - Resource identifier
     * @returns Matching candidate or undefined
     */
    findCandidateById(resourceId) {
        return this.candidatesMap.get(resourceId);
    }
}
/**
 * Create usage-based allocation algorithm instance
 * @param config - Algorithm configuration
 * @param logger - Logger instance
 * @returns UsageBasedAlgorithm instance
 */
export function createUsageBasedAlgorithm(config, logger) {
    return new UsageBasedAlgorithm(config, logger);
}
//# sourceMappingURL=UsageBasedAlgorithm.js.map