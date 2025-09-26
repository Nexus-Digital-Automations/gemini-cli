/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Abstract base class for all budget allocation algorithms
 * Provides common functionality and enforces consistent interface
 */
export class BaseAllocationAlgorithm {
    strategy;
    config;
    logger;
    executionTime = 0;
    iterations = 0;
    /**
     * Initialize base allocation algorithm
     * @param strategy - Allocation strategy to use
     * @param config - Algorithm configuration parameters
     * @param logger - Logger instance for debugging and monitoring
     */
    constructor(strategy, config, logger) {
        this.strategy = strategy;
        this.config = config;
        this.logger = logger;
        this.logger.info('Allocation algorithm initialized', {
            strategy,
            objectives: config.objectives,
            weights: config.weights,
        });
    }
    /**
     * Execute budget allocation optimization for given candidates
     * @param candidates - Array of allocation candidates to optimize
     * @returns Optimization result with recommendations
     */
    async optimize(candidates) {
        const startTime = performance.now();
        this.logger.info('Starting allocation optimization', {
            strategy: this.strategy,
            candidateCount: candidates.length,
            totalBudget: this.calculateTotalCurrentBudget(candidates),
        });
        try {
            // Validate input candidates
            this.validateCandidates(candidates);
            // Execute algorithm-specific optimization
            const recommendations = await this.executeOptimization(candidates);
            // Validate optimization results
            this.validateResults(candidates, recommendations);
            this.executionTime = performance.now() - startTime;
            const result = {
                originalCandidates: candidates,
                recommendations,
                totalAllocated: recommendations.reduce((sum, rec) => sum + rec.recommendedAllocation, 0),
                optimizationScore: this.calculateOptimizationScore(candidates, recommendations),
                algorithmMetrics: {
                    executionTime: this.executionTime,
                    convergenceIterations: this.iterations,
                    optimizationEfficiency: this.calculateEfficiencyScore(candidates, recommendations),
                },
                validation: {
                    constraintsSatisfied: this.validateConstraints(recommendations),
                    budgetBalanced: this.validateBudgetBalance(candidates, recommendations),
                    improvementAchieved: this.validateImprovement(candidates, recommendations),
                },
            };
            this.logger.info('Allocation optimization completed', {
                executionTime: this.executionTime,
                recommendationCount: recommendations.length,
                optimizationScore: result.optimizationScore,
            });
            return result;
        }
        catch (error) {
            this.logger.error('Allocation optimization failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                strategy: this.strategy,
                candidateCount: candidates.length,
            });
            throw error;
        }
    }
    /**
     * Calculate optimization score based on objectives achievement
     * @param originalCandidates - Original candidates before optimization
     * @param recommendations - Generated recommendations
     * @returns Optimization score (0-100)
     */
    calculateOptimizationScore(originalCandidates, recommendations) {
        const weights = this.config.weights;
        let score = 0;
        // Cost optimization score
        const costImprovement = this.calculateCostImprovement(originalCandidates, recommendations);
        score += costImprovement * weights.cost * 100;
        // ROI improvement score
        const roiImprovement = this.calculateROIImprovement(originalCandidates, recommendations);
        score += roiImprovement * weights.roi * 100;
        // Business value score
        const businessValueScore = this.calculateBusinessValueScore(recommendations);
        score += businessValueScore * weights.businessValue;
        // Performance score
        const performanceScore = this.calculatePerformanceScore(recommendations);
        score += performanceScore * weights.performance;
        // Risk adjustment
        const riskScore = this.calculateRiskScore(recommendations);
        score = score * (1 - riskScore * weights.risk);
        return Math.max(0, Math.min(100, score));
    }
    /**
     * Validate input candidates for optimization
     * @param candidates - Candidates to validate
     * @throws Error if validation fails
     */
    validateCandidates(candidates) {
        if (!candidates || candidates.length === 0) {
            throw new Error('No allocation candidates provided');
        }
        for (const candidate of candidates) {
            if (!candidate.resourceId) {
                throw new Error('Candidate missing resourceId');
            }
            if (candidate.currentAllocation < 0) {
                throw new Error(`Invalid current allocation for ${candidate.resourceId}`);
            }
            if (!candidate.constraints) {
                throw new Error(`Missing constraints for ${candidate.resourceId}`);
            }
        }
        // Check for duplicate resource IDs
        const resourceIds = new Set(candidates.map((c) => c.resourceId));
        if (resourceIds.size !== candidates.length) {
            throw new Error('Duplicate resource IDs found in candidates');
        }
    }
    /**
     * Validate optimization results
     * @param originalCandidates - Original candidates
     * @param recommendations - Generated recommendations
     * @throws Error if validation fails
     */
    validateResults(originalCandidates, recommendations) {
        if (recommendations.length !== originalCandidates.length) {
            throw new Error('Recommendation count does not match candidate count');
        }
        for (const recommendation of recommendations) {
            if (recommendation.recommendedAllocation < 0) {
                throw new Error(`Negative allocation recommended for ${recommendation.resourceId}`);
            }
        }
    }
    /**
     * Calculate total current budget allocation
     * @param candidates - Allocation candidates
     * @returns Total current budget
     */
    calculateTotalCurrentBudget(candidates) {
        return candidates.reduce((sum, candidate) => sum + candidate.currentAllocation, 0);
    }
    /**
     * Calculate cost improvement from optimization
     * @param originalCandidates - Original candidates
     * @param recommendations - Optimization recommendations
     * @returns Cost improvement ratio (0-1)
     */
    calculateCostImprovement(originalCandidates, recommendations) {
        const originalCost = originalCandidates.reduce((sum, c) => sum + c.currentAllocation, 0);
        const newCost = recommendations.reduce((sum, r) => sum + r.recommendedAllocation, 0);
        return originalCost > 0
            ? Math.max(0, (originalCost - newCost) / originalCost)
            : 0;
    }
    /**
     * Calculate ROI improvement from optimization
     * @param originalCandidates - Original candidates
     * @param recommendations - Optimization recommendations
     * @returns ROI improvement ratio (0-1)
     */
    calculateROIImprovement(originalCandidates, recommendations) {
        const originalROI = this.calculateWeightedROI(originalCandidates);
        const newROI = recommendations.reduce((sum, r) => sum + r.expectedImpact.roiImpact * r.recommendedAllocation, 0) / recommendations.reduce((sum, r) => sum + r.recommendedAllocation, 0);
        return originalROI > 0
            ? Math.max(0, (newROI - originalROI) / originalROI)
            : 0;
    }
    /**
     * Calculate weighted ROI from candidates
     * @param candidates - Allocation candidates
     * @returns Weighted average ROI
     */
    calculateWeightedROI(candidates) {
        const totalAllocation = candidates.reduce((sum, c) => sum + c.currentAllocation, 0);
        if (totalAllocation === 0)
            return 0;
        return candidates.reduce((sum, c) => sum + (c.costAnalysis.roi * c.currentAllocation) / totalAllocation, 0);
    }
    /**
     * Calculate business value score from recommendations
     * @param recommendations - Optimization recommendations
     * @returns Business value score (0-100)
     */
    calculateBusinessValueScore(recommendations) {
        const totalBusinessValue = recommendations.reduce((sum, r) => sum + (r.expectedImpact.businessValueImpact * r.confidence) / 100, 0);
        return Math.min(100, totalBusinessValue / recommendations.length);
    }
    /**
     * Calculate performance score from recommendations
     * @param recommendations - Optimization recommendations
     * @returns Performance score (0-100)
     */
    calculatePerformanceScore(recommendations) {
        const avgPerformanceImpact = recommendations.reduce((sum, r) => sum + r.expectedImpact.performanceImpact, 0) / recommendations.length;
        return Math.max(0, Math.min(100, avgPerformanceImpact));
    }
    /**
     * Calculate risk score from recommendations
     * @param recommendations - Optimization recommendations
     * @returns Risk score (0-1, higher = more risk)
     */
    calculateRiskScore(recommendations) {
        const riskLevelWeights = {
            low: 0.1,
            medium: 0.3,
            high: 0.6,
            critical: 1.0,
        };
        const avgRisk = recommendations.reduce((sum, r) => sum + riskLevelWeights[r.riskAssessment.riskLevel], 0) / recommendations.length;
        return Math.max(0, Math.min(1, avgRisk));
    }
    /**
     * Calculate efficiency score for algorithm performance
     * @param originalCandidates - Original candidates
     * @param recommendations - Generated recommendations
     * @returns Efficiency score (0-100)
     */
    calculateEfficiencyScore(originalCandidates, recommendations) {
        // Efficiency based on improvement per unit of change
        const totalChange = recommendations.reduce((sum, r) => sum + Math.abs(r.allocationChange), 0);
        const totalImprovement = recommendations.reduce((sum, r) => sum + r.potentialSavings + r.expectedImpact.businessValueImpact, 0);
        return totalChange > 0
            ? Math.min(100, (totalImprovement / totalChange) * 10)
            : 0;
    }
    /**
     * Validate that all constraints are satisfied
     * @param recommendations - Optimization recommendations
     * @returns True if all constraints satisfied
     */
    validateConstraints(recommendations) {
        return recommendations.every((r) => {
            const candidate = this.findCandidateById(r.resourceId);
            if (!candidate)
                return false;
            const constraints = candidate.constraints;
            return (r.recommendedAllocation >= constraints.minAllocation &&
                r.recommendedAllocation <= constraints.maxAllocation);
        });
    }
    /**
     * Validate budget balance in recommendations
     * @param originalCandidates - Original candidates
     * @param recommendations - Generated recommendations
     * @returns True if budget is balanced
     */
    validateBudgetBalance(originalCandidates, recommendations) {
        const originalTotal = this.calculateTotalCurrentBudget(originalCandidates);
        const newTotal = recommendations.reduce((sum, r) => sum + r.recommendedAllocation, 0);
        const tolerance = originalTotal * 0.001; // 0.1% tolerance
        return Math.abs(originalTotal - newTotal) <= tolerance;
    }
    /**
     * Validate that optimization achieved improvement
     * @param originalCandidates - Original candidates
     * @param recommendations - Generated recommendations
     * @returns True if improvement achieved
     */
    validateImprovement(originalCandidates, recommendations) {
        const totalPotentialSavings = recommendations.reduce((sum, r) => sum + r.potentialSavings, 0);
        const totalBusinessValue = recommendations.reduce((sum, r) => sum + r.expectedImpact.businessValueImpact, 0);
        return totalPotentialSavings > 0 || totalBusinessValue > 0;
    }
    /**
     * Find candidate by resource ID
     * @param resourceId - Resource identifier
     * @returns Matching candidate or undefined
     */
    findCandidateById(_resourceId) {
        // This would be set during optimization - simplified for base class
        return undefined;
    }
    /**
     * Get algorithm strategy
     * @returns Current allocation strategy
     */
    getStrategy() {
        return this.strategy;
    }
    /**
     * Get algorithm configuration
     * @returns Current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Get execution metrics
     * @returns Performance metrics from last optimization
     */
    getExecutionMetrics() {
        return {
            executionTime: this.executionTime,
            iterations: this.iterations,
        };
    }
}
//# sourceMappingURL=BaseAllocationAlgorithm.js.map