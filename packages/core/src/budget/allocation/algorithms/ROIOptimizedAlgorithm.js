/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseAllocationAlgorithm, } from './BaseAllocationAlgorithm.js';
/**
 * @fileoverview ROI-optimized allocation algorithm implementation
 * Maximizes return on investment by allocating budget to highest ROI resources
 *
 * @author Claude Code - Budget Allocation Agent
 * @version 1.0.0
 */
/**
 * ROI-optimized allocation algorithm that maximizes returns by:
 * - Prioritizing high ROI resources
 * - Considering risk-adjusted returns
 * - Balancing short-term and long-term ROI
 * - Optimizing marginal ROI improvements
 */
export class ROIOptimizedAlgorithm extends BaseAllocationAlgorithm {
    candidatesMap = new Map();
    roiAnalysis = new Map();
    /**
     * Create ROI-optimized allocation algorithm
     * @param config - Algorithm configuration
     * @param logger - Logger instance
     */
    constructor(config, logger) {
        super('roi_optimized', config, logger);
    }
    /**
     * Execute ROI-optimized allocation optimization
     * @param candidates - Array of allocation candidates
     * @returns Array of allocation recommendations
     */
    async executeOptimization(candidates) {
        this.logger.info('Starting ROI-optimized allocation optimization', {
            candidateCount: candidates.length,
            strategy: 'roi_optimized',
        });
        // Build candidate lookup map
        this.candidatesMap.clear();
        candidates.forEach((candidate) => {
            this.candidatesMap.set(candidate.resourceId, candidate);
        });
        // Analyze ROI potential for each candidate
        this.analyzeROIPotential(candidates);
        // Calculate optimal allocation distribution
        const optimalDistribution = this.calculateOptimalROIDistribution(candidates);
        // Generate ROI-optimized recommendations
        const recommendations = this.generateROIRecommendations(candidates, optimalDistribution);
        // Validate and balance recommendations
        const balancedRecommendations = this.balanceROIAllocations(candidates, recommendations);
        this.logger.info('ROI-optimized optimization completed', {
            recommendationCount: balancedRecommendations.length,
            totalROIImprovement: this.calculateTotalROIImprovement(candidates, balancedRecommendations),
        });
        return balancedRecommendations;
    }
    /**
     * Analyze ROI potential for all candidates
     * @param candidates - Allocation candidates
     */
    analyzeROIPotential(candidates) {
        this.roiAnalysis.clear();
        for (const candidate of candidates) {
            const analysis = this.calculateROIAnalysis(candidate);
            this.roiAnalysis.set(candidate.resourceId, analysis);
            this.logger.debug('ROI analysis completed', {
                resourceId: candidate.resourceId,
                currentROI: analysis.currentROI,
                potentialROI: analysis.potentialROI,
                riskAdjustedROI: analysis.riskAdjustedROI,
            });
        }
    }
    /**
     * Calculate comprehensive ROI analysis for a candidate
     * @param candidate - Allocation candidate
     * @returns ROI analysis data
     */
    calculateROIAnalysis(candidate) {
        const costAnalysis = candidate.costAnalysis;
        const currentROI = costAnalysis.roi;
        // Calculate potential ROI with increased allocation
        const potentialROI = this.calculatePotentialROI(candidate);
        // Calculate risk-adjusted ROI
        const riskFactor = this.calculateRiskFactor(candidate);
        const riskAdjustedROI = potentialROI * (1 - riskFactor);
        // Calculate marginal ROI improvement
        const marginalROI = this.calculateMarginalROI(candidate, potentialROI);
        // Calculate ROI stability score
        const roiStability = this.calculateROIStability(candidate);
        // Calculate time to ROI realization
        const timeToROI = this.calculateTimeToROI(candidate);
        return {
            resourceId: candidate.resourceId,
            currentROI,
            potentialROI,
            riskAdjustedROI,
            marginalROI,
            roiStability,
            timeToROI,
            roiTrend: this.determineROITrend(candidate),
            competitiveAdvantage: this.calculateCompetitiveAdvantage(candidate),
            scalabilityFactor: this.calculateScalabilityFactor(candidate),
        };
    }
    /**
     * Calculate potential ROI with optimized allocation
     * @param candidate - Allocation candidate
     * @returns Potential ROI value
     */
    calculatePotentialROI(candidate) {
        const currentROI = candidate.costAnalysis.roi;
        const businessImpact = candidate.businessImpact / 100;
        const utilizationRate = candidate.costAnalysis.utilizationRate;
        // Model ROI improvement based on business impact and current utilization
        let potentialImprovement = 1.0;
        // Higher business impact suggests more ROI potential
        potentialImprovement += businessImpact * 0.5;
        // Lower utilization suggests room for ROI improvement
        if (utilizationRate < 0.7) {
            potentialImprovement += (0.7 - utilizationRate) * 0.8;
        }
        // Factor in projected growth
        const projectedGrowth = candidate.projectedUsage / Math.max(1, candidate.currentAllocation);
        potentialImprovement += Math.min(0.4, projectedGrowth * 0.2);
        return Math.max(currentROI, currentROI * potentialImprovement);
    }
    /**
     * Calculate risk factor for ROI adjustment
     * @param candidate - Allocation candidate
     * @returns Risk factor (0-1, higher = more risk)
     */
    calculateRiskFactor(candidate) {
        let riskFactor = 0.1; // Base risk
        // Technical complexity risk
        const complexityRisk = candidate.technicalComplexity / 200; // 0-0.5
        riskFactor += complexityRisk;
        // Cost trend volatility risk
        if (candidate.costAnalysis.costTrend === 'volatile') {
            riskFactor += 0.2;
        }
        else if (candidate.costAnalysis.costTrend === 'increasing') {
            riskFactor += 0.1;
        }
        // Priority-based risk (lower priority = higher risk)
        const priorityWeights = {
            critical: 0,
            high: 0.05,
            medium: 0.1,
            low: 0.2,
            deferred: 0.3,
        };
        riskFactor += priorityWeights[candidate.priority];
        return Math.max(0.05, Math.min(0.5, riskFactor));
    }
    /**
     * Calculate marginal ROI improvement potential
     * @param candidate - Allocation candidate
     * @param potentialROI - Potential ROI value
     * @returns Marginal ROI improvement
     */
    calculateMarginalROI(candidate, potentialROI) {
        const currentROI = candidate.costAnalysis.roi;
        const currentAllocation = candidate.currentAllocation;
        if (currentAllocation <= 0)
            return 0;
        // Estimate marginal ROI for additional allocation
        const marginalAllocation = currentAllocation * 0.1; // 10% increase
        const marginalReturn = (potentialROI - currentROI) * marginalAllocation;
        return marginalReturn / marginalAllocation;
    }
    /**
     * Calculate ROI stability score
     * @param candidate - Allocation candidate
     * @returns Stability score (0-1, higher = more stable)
     */
    calculateROIStability(candidate) {
        const costTrend = candidate.costAnalysis.costTrend;
        const utilizationRate = candidate.costAnalysis.utilizationRate;
        let stability = 0.5; // Base stability
        // Cost trend affects stability
        switch (costTrend) {
            case 'stable':
                stability = 0.9;
                break;
            case 'increasing':
            case 'decreasing':
                stability = 0.7;
                break;
            case 'volatile':
                stability = 0.3;
                break;
            default:
                // Handle unexpected cost trend values, use base stability
                stability = 0.5;
                break;
        }
        // High utilization suggests stability
        if (utilizationRate > 0.8) {
            stability += 0.1;
        }
        return Math.max(0.1, Math.min(1.0, stability));
    }
    /**
     * Calculate time to ROI realization
     * @param candidate - Allocation candidate
     * @returns Time to ROI in days
     */
    calculateTimeToROI(candidate) {
        const complexity = candidate.technicalComplexity / 100;
        const businessImpact = candidate.businessImpact / 100;
        // Higher complexity = longer time to ROI
        // Higher business impact = shorter time to ROI
        const baseTime = 30; // 30 days base
        const complexityAdjustment = complexity * 60; // Up to 60 days for complexity
        const impactAdjustment = businessImpact * -20; // Up to 20 days reduction for impact
        return Math.max(7, baseTime + complexityAdjustment + impactAdjustment);
    }
    /**
     * Determine ROI trend direction
     * @param candidate - Allocation candidate
     * @returns ROI trend
     */
    determineROITrend(candidate) {
        const costTrend = candidate.costAnalysis.costTrend;
        const businessImpact = candidate.businessImpact;
        if (costTrend === 'decreasing' && businessImpact > 70) {
            return 'increasing'; // Decreasing costs with high business value
        }
        else if (costTrend === 'increasing' && businessImpact < 40) {
            return 'decreasing'; // Increasing costs with low business value
        }
        else {
            return 'stable';
        }
    }
    /**
     * Calculate competitive advantage factor
     * @param candidate - Allocation candidate
     * @returns Competitive advantage score (0-1)
     */
    calculateCompetitiveAdvantage(candidate) {
        const businessImpact = candidate.businessImpact / 100;
        const roi = candidate.costAnalysis.roi;
        const uniqueness = this.calculateResourceUniqueness(candidate);
        return (businessImpact * 0.4 + Math.min(1, roi / 10) * 0.4 + uniqueness * 0.2);
    }
    /**
     * Calculate resource uniqueness factor
     * @param candidate - Allocation candidate
     * @returns Uniqueness score (0-1)
     */
    calculateResourceUniqueness(candidate) {
        // This would ideally analyze against other resources in the system
        // For now, use technical complexity as a proxy for uniqueness
        return Math.min(1, candidate.technicalComplexity / 100);
    }
    /**
     * Calculate scalability factor for resource
     * @param candidate - Allocation candidate
     * @returns Scalability factor (0-2)
     */
    calculateScalabilityFactor(candidate) {
        const utilizationRate = candidate.costAnalysis.utilizationRate;
        const projectedGrowth = candidate.projectedUsage / Math.max(1, candidate.currentAllocation);
        // Low utilization with high projected growth = high scalability
        const utilizationFactor = 1 - utilizationRate;
        const growthFactor = Math.min(1, projectedGrowth);
        return Math.min(2, 1 + utilizationFactor * 0.5 + growthFactor * 0.5);
    }
    /**
     * Calculate optimal ROI-based distribution
     * @param candidates - Allocation candidates
     * @returns Optimal allocation distribution
     */
    calculateOptimalROIDistribution(candidates) {
        const distribution = new Map();
        const totalBudget = this.calculateTotalCurrentBudget(candidates);
        // Sort candidates by risk-adjusted ROI
        const sortedCandidates = candidates
            .map((candidate) => ({
            candidate,
            analysis: this.roiAnalysis.get(candidate.resourceId),
        }))
            .sort((a, b) => b.analysis.riskAdjustedROI - a.analysis.riskAdjustedROI);
        // Allocate budget using efficient frontier approach
        this.allocateUsingEfficientFrontier(sortedCandidates, totalBudget, distribution);
        return distribution;
    }
    /**
     * Allocate budget using efficient frontier optimization
     * @param sortedCandidates - Candidates sorted by ROI
     * @param totalBudget - Total budget to allocate
     * @param distribution - Distribution map to populate
     */
    allocateUsingEfficientFrontier(sortedCandidates, totalBudget, distribution) {
        let remainingBudget = totalBudget;
        // First pass: Ensure minimum allocations
        for (const { candidate } of sortedCandidates) {
            const minAllocation = candidate.constraints.minAllocation;
            distribution.set(candidate.resourceId, minAllocation);
            remainingBudget -= minAllocation;
        }
        // Second pass: Allocate remaining budget based on marginal ROI
        while (remainingBudget > 0 && sortedCandidates.length > 0) {
            let bestCandidate = null;
            let bestMarginalROI = 0;
            for (const candidateData of sortedCandidates) {
                const { candidate, analysis } = candidateData;
                const currentAllocation = distribution.get(candidate.resourceId) || 0;
                // Check if we can allocate more to this candidate
                if (currentAllocation >= candidate.constraints.maxAllocation) {
                    continue;
                }
                // Calculate marginal ROI for additional allocation
                const marginalROI = this.calculateMarginalROIForAdditionalBudget(candidate, analysis, currentAllocation);
                if (marginalROI > bestMarginalROI) {
                    bestMarginalROI = marginalROI;
                    bestCandidate = candidateData;
                }
            }
            if (!bestCandidate)
                break;
            // Allocate to best marginal ROI candidate
            const { candidate } = bestCandidate;
            const currentAllocation = distribution.get(candidate.resourceId) || 0;
            const maxAdditionalAllocation = Math.min(remainingBudget, candidate.constraints.maxAllocation - currentAllocation, currentAllocation * 0.1);
            const newAllocation = currentAllocation + maxAdditionalAllocation;
            distribution.set(candidate.resourceId, newAllocation);
            remainingBudget -= maxAdditionalAllocation;
            // Prevent infinite loops
            if (maxAdditionalAllocation < 0.01)
                break;
        }
        // Third pass: Handle any remaining budget proportionally
        if (remainingBudget > 0.01) {
            this.distributeRemainingBudget(sortedCandidates, remainingBudget, distribution);
        }
    }
    /**
     * Calculate marginal ROI for additional budget allocation
     * @param candidate - Allocation candidate
     * @param analysis - ROI analysis
     * @param currentAllocation - Current allocation amount
     * @returns Marginal ROI value
     */
    calculateMarginalROIForAdditionalBudget(candidate, analysis, currentAllocation) {
        // Use diminishing returns model for marginal ROI
        const allocationRatio = currentAllocation / candidate.constraints.maxAllocation;
        const diminishingFactor = Math.max(0.1, 1 - allocationRatio * 0.5);
        return analysis.marginalROI * diminishingFactor;
    }
    /**
     * Distribute remaining budget proportionally
     * @param sortedCandidates - Sorted candidates
     * @param remainingBudget - Remaining budget to distribute
     * @param distribution - Current distribution
     */
    distributeRemainingBudget(sortedCandidates, remainingBudget, distribution) {
        const totalROI = sortedCandidates.reduce((sum, { analysis }) => sum + analysis.riskAdjustedROI, 0);
        for (const { candidate, analysis } of sortedCandidates) {
            const currentAllocation = distribution.get(candidate.resourceId) || 0;
            const maxAdditional = candidate.constraints.maxAllocation - currentAllocation;
            if (maxAdditional <= 0)
                continue;
            const roiWeight = analysis.riskAdjustedROI / totalROI;
            const additionalAllocation = Math.min(maxAdditional, remainingBudget * roiWeight);
            distribution.set(candidate.resourceId, currentAllocation + additionalAllocation);
        }
    }
    /**
     * Generate ROI-optimized recommendations
     * @param candidates - Original candidates
     * @param distribution - Optimal distribution
     * @returns Array of recommendations
     */
    generateROIRecommendations(candidates, distribution) {
        const recommendations = [];
        for (const candidate of candidates) {
            const analysis = this.roiAnalysis.get(candidate.resourceId);
            const recommendedAllocation = distribution.get(candidate.resourceId) || candidate.currentAllocation;
            const allocationChange = recommendedAllocation - candidate.currentAllocation;
            if (Math.abs(allocationChange) < 0.01) {
                // Skip minimal changes
                continue;
            }
            const recommendation = {
                id: `roi_${candidate.resourceId}_${Date.now()}`,
                resourceId: candidate.resourceId,
                type: 'budget_reallocation',
                title: `ROI-optimized allocation for ${candidate.resourceName}`,
                description: this.generateROIRecommendationDescription(candidate, analysis, allocationChange),
                currentAllocation: candidate.currentAllocation,
                recommendedAllocation,
                allocationChange,
                potentialSavings: Math.max(0, -allocationChange),
                savingsPercentage: candidate.currentAllocation > 0
                    ? (Math.max(0, -allocationChange) / candidate.currentAllocation) *
                        100
                    : 0,
                implementationComplexity: this.determineImplementationComplexity(candidate, analysis),
                strategy: 'roi_optimized',
                confidence: this.calculateROIConfidence(candidate, analysis),
                expectedImpact: this.calculateROIExpectedImpact(candidate, analysis, allocationChange),
                riskAssessment: this.assessROIRisk(candidate, analysis, allocationChange),
                dependencies: [],
                priority: candidate.priority,
                estimatedTimeToImplement: `${Math.ceil(analysis.timeToROI / 7)}-${Math.ceil(analysis.timeToROI / 7) + 1} weeks`,
                category: 'roi_optimization',
                tags: ['roi-optimized', 'efficient-frontier', 'data-driven'],
            };
            recommendations.push(recommendation);
        }
        return recommendations;
    }
    /**
     * Generate description for ROI recommendation
     * @param candidate - Allocation candidate
     * @param analysis - ROI analysis
     * @param allocationChange - Allocation change amount
     * @returns Description text
     */
    generateROIRecommendationDescription(candidate, analysis, allocationChange) {
        const changeDirection = allocationChange > 0 ? 'increase' : 'decrease';
        const changePct = Math.round((Math.abs(allocationChange) / candidate.currentAllocation) * 100);
        const currentROI = Math.round(analysis.currentROI * 100) / 100;
        const potentialROI = Math.round(analysis.potentialROI * 100) / 100;
        let description = `${changeDirection} allocation by ${changePct}% to optimize ROI. `;
        description += `Current ROI: ${currentROI}, Potential ROI: ${potentialROI}. `;
        description += `Risk-adjusted ROI: ${Math.round(analysis.riskAdjustedROI * 100) / 100}. `;
        if (analysis.roiTrend === 'increasing') {
            description += 'ROI trend is positive. ';
        }
        else if (analysis.roiTrend === 'decreasing') {
            description += 'ROI optimization needed to reverse declining trend. ';
        }
        description += `Expected ROI realization: ${analysis.timeToROI} days.`;
        return description;
    }
    /**
     * Determine implementation complexity for ROI optimization
     * @param candidate - Allocation candidate
     * @param analysis - ROI analysis
     * @returns Implementation complexity
     */
    determineImplementationComplexity(candidate, analysis) {
        const complexityScore = candidate.technicalComplexity;
        const roiStability = analysis.roiStability;
        if (complexityScore < 30 && roiStability > 0.7)
            return 'low';
        if (complexityScore < 70 && roiStability > 0.5)
            return 'medium';
        return 'high';
    }
    /**
     * Calculate confidence for ROI recommendation
     * @param candidate - Allocation candidate
     * @param analysis - ROI analysis
     * @returns Confidence score (0-100)
     */
    calculateROIConfidence(candidate, analysis) {
        let confidence = 60; // Base confidence
        // Higher confidence for stable ROI
        confidence += analysis.roiStability * 20;
        // Higher confidence for positive ROI trend
        if (analysis.roiTrend === 'increasing') {
            confidence += 15;
        }
        else if (analysis.roiTrend === 'decreasing') {
            confidence -= 10;
        }
        // Higher confidence for competitive advantage
        confidence += analysis.competitiveAdvantage * 10;
        // Lower confidence for high complexity
        confidence -= (candidate.technicalComplexity / 100) * 15;
        return Math.max(40, Math.min(95, confidence));
    }
    /**
     * Calculate expected impact from ROI optimization
     * @param candidate - Allocation candidate
     * @param analysis - ROI analysis
     * @param allocationChange - Allocation change amount
     * @returns Expected impact metrics
     */
    calculateROIExpectedImpact(candidate, analysis, allocationChange) {
        const changeRatio = candidate.currentAllocation > 0
            ? allocationChange / candidate.currentAllocation
            : 0;
        const roiImprovement = (analysis.potentialROI - analysis.currentROI) * Math.abs(changeRatio);
        return {
            costImpact: allocationChange,
            performanceImpact: Math.max(0, changeRatio * 15),
            utilizationImpact: changeRatio * 0.2,
            businessValueImpact: roiImprovement * candidate.businessImpact * 0.1,
            roiImpact: roiImprovement,
            impactTimeline: analysis.timeToROI <= 30 ? 'short_term' : 'medium_term',
        };
    }
    /**
     * Assess risk for ROI optimization
     * @param candidate - Allocation candidate
     * @param analysis - ROI analysis
     * @param allocationChange - Allocation change amount
     * @returns Risk assessment
     */
    assessROIRisk(candidate, analysis, allocationChange) {
        const changeRatio = Math.abs(allocationChange) / candidate.currentAllocation;
        let riskLevel = 'low';
        const riskFactors = [];
        const mitigationStrategies = [];
        // Assess change magnitude risk
        if (changeRatio > 0.5) {
            riskLevel = 'high';
            riskFactors.push('Large allocation change may impact ROI predictability');
            mitigationStrategies.push('Phase implementation over multiple periods');
        }
        else if (changeRatio > 0.25) {
            riskLevel = 'medium';
            riskFactors.push('Moderate allocation change requires monitoring');
            mitigationStrategies.push('Monitor ROI metrics closely during transition');
        }
        // Assess ROI stability risk
        if (analysis.roiStability < 0.5) {
            riskLevel = 'high';
            riskFactors.push('Low ROI stability increases uncertainty');
            mitigationStrategies.push('Implement additional monitoring and adjustment mechanisms');
        }
        // Assess time to realization risk
        if (analysis.timeToROI > 90) {
            riskLevel = 'medium';
            riskFactors.push('Long time to ROI realization');
            mitigationStrategies.push('Establish interim milestones and checkpoints');
        }
        if (riskFactors.length === 0) {
            riskFactors.push('Standard ROI optimization with manageable risk profile');
            mitigationStrategies.push('Regular ROI performance monitoring');
        }
        return {
            riskLevel,
            riskFactors,
            mitigationStrategies,
            maxNegativeImpact: Math.abs(allocationChange) * (1 - analysis.roiStability),
            negativeProbability: riskLevel === 'high' ? 25 : riskLevel === 'medium' ? 15 : 8,
        };
    }
    /**
     * Balance ROI allocations to ensure budget constraints
     * @param originalCandidates - Original candidates
     * @param recommendations - Initial recommendations
     * @returns Balanced recommendations
     */
    balanceROIAllocations(originalCandidates, recommendations) {
        if (recommendations.length === 0) {
            // No changes needed, create identity recommendations
            return originalCandidates.map((candidate) => this.createIdentityRecommendation(candidate));
        }
        return this.ensureBudgetBalance(originalCandidates, recommendations);
    }
    /**
     * Create identity recommendation (no change)
     * @param candidate - Allocation candidate
     * @returns Identity recommendation
     */
    createIdentityRecommendation(candidate) {
        return {
            id: `roi_identity_${candidate.resourceId}_${Date.now()}`,
            resourceId: candidate.resourceId,
            type: 'budget_reallocation',
            title: `Maintain current allocation for ${candidate.resourceName}`,
            description: 'Current allocation is optimal for ROI maximization',
            currentAllocation: candidate.currentAllocation,
            recommendedAllocation: candidate.currentAllocation,
            allocationChange: 0,
            potentialSavings: 0,
            savingsPercentage: 0,
            implementationComplexity: 'low',
            strategy: 'roi_optimized',
            confidence: 85,
            expectedImpact: {
                costImpact: 0,
                performanceImpact: 0,
                utilizationImpact: 0,
                businessValueImpact: 0,
                roiImpact: 0,
                impactTimeline: 'immediate',
            },
            riskAssessment: {
                riskLevel: 'low',
                riskFactors: ['No change, minimal risk'],
                mitigationStrategies: ['Continue regular monitoring'],
                maxNegativeImpact: 0,
                negativeProbability: 0,
            },
            dependencies: [],
            priority: candidate.priority,
            estimatedTimeToImplement: 'immediate',
            category: 'roi_optimization',
            tags: ['roi-optimized', 'no-change', 'stable'],
        };
    }
    /**
     * Calculate total ROI improvement from recommendations
     * @param originalCandidates - Original candidates
     * @param recommendations - Generated recommendations
     * @returns Total ROI improvement
     */
    calculateTotalROIImprovement(originalCandidates, recommendations) {
        return recommendations.reduce((total, rec) => total + rec.expectedImpact.roiImpact, 0);
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
 * Create ROI-optimized allocation algorithm instance
 * @param config - Algorithm configuration
 * @param logger - Logger instance
 * @returns ROIOptimizedAlgorithm instance
 */
export function createROIOptimizedAlgorithm(config, logger) {
    return new ROIOptimizedAlgorithm(config, logger);
}
//# sourceMappingURL=ROIOptimizedAlgorithm.js.map