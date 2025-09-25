/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Default resource ranking configuration
 */
export const DEFAULT_RANKING_CONFIG = {
    criteria: {
        businessValue: 0.2,
        roi: 0.15,
        costEfficiency: 0.12,
        strategicImportance: 0.15,
        riskFactor: 0.1,
        usageTrends: 0.08,
        performanceImpact: 0.1,
        dependencies: 0.05,
        innovation: 0.03,
        compliance: 0.02,
    },
    thresholds: {
        critical: 85,
        high: 70,
        medium: 50,
        low: 30,
    },
    businessContext: {
        phase: 'growth',
        strategicFocus: ['efficiency', 'growth', 'innovation'],
        budgetConstraints: {
            total: 100000,
            reserved: 0.1,
            emergency: 0.05,
        },
        marketConditions: 'stable',
        competitivePressure: 'medium',
    },
    algorithm: {
        type: 'weighted_sum',
        normalization: 'min_max',
        aggregation: 'weighted_average',
        sensitivityAnalysis: true,
        confidenceInterval: true,
    },
    enableAdvancedFeatures: true,
};
/**
 * Resource ranking engine
 * Provides intelligent resource ranking and priority assignment
 */
export class ResourceRanking {
    config;
    logger;
    /**
     * Create resource ranking instance
     * @param config - Ranking configuration
     * @param logger - Logger instance
     */
    constructor(config = {}, logger) {
        this.config = this.mergeConfig(DEFAULT_RANKING_CONFIG, config);
        this.logger = logger;
        this.validateConfiguration();
    }
    /**
     * Rank individual resource
     * @param candidate - Resource allocation candidate
     * @param historicalData - Historical performance data
     * @returns Resource ranking result
     */
    rankResource(candidate, historicalData) {
        this.logger.info(`Starting resource ranking for ${candidate.resourceId}`, {
            resourceName: candidate.resourceName,
            currentAllocation: candidate.currentAllocation,
        });
        // Calculate individual criterion scores
        const scoreBreakdown = this.calculateScoreBreakdown(candidate, historicalData);
        // Calculate overall score
        const score = this.calculateOverallScore(scoreBreakdown);
        // Assign priority level
        const priority = this.assignPriority(score);
        // Generate ranking justification
        const justification = this.generateJustification(candidate, scoreBreakdown, historicalData);
        // Calculate ranking confidence
        const confidence = this.calculateConfidence(scoreBreakdown, historicalData);
        // Perform sensitivity analysis
        const sensitivity = this.performSensitivityAnalysis(scoreBreakdown);
        const ranking = {
            resourceId: candidate.resourceId,
            resourceName: candidate.resourceName,
            score,
            priority,
            rank: 0, // Will be set during portfolio ranking
            scoreBreakdown,
            justification,
            confidence,
            sensitivity,
        };
        this.logger.info(`Resource ranking completed for ${candidate.resourceId}`, {
            score,
            priority,
            confidence,
        });
        return ranking;
    }
    /**
     * Rank portfolio of resources
     * @param candidates - Array of resource allocation candidates
     * @param historicalData - Historical data for all resources
     * @returns Portfolio ranking result
     */
    rankPortfolio(candidates, historicalData) {
        this.logger.info('Starting portfolio ranking', {
            resourceCount: candidates.length,
        });
        // Rank individual resources
        const rankings = candidates.map(candidate => this.rankResource(candidate, historicalData[candidate.resourceId] || []));
        // Sort by score and assign ranks
        rankings.sort((a, b) => b.score - a.score);
        rankings.forEach((ranking, index) => {
            ranking.rank = index + 1;
        });
        // Group by priority
        const priorityGroups = this.groupByPriority(rankings);
        // Generate portfolio insights
        const insights = this.generatePortfolioInsights(rankings, candidates);
        // Calculate statistics
        const statistics = this.calculateRankingStatistics(rankings);
        // Recommend allocation strategy
        const recommendedStrategy = this.recommendAllocationStrategy(rankings, insights);
        const portfolioRanking = {
            rankings,
            insights,
            statistics,
            priorityGroups,
            recommendedStrategy,
        };
        this.logger.info('Portfolio ranking completed', {
            resourceCount: rankings.length,
            averageScore: statistics.averageScore,
            recommendedStrategy,
        });
        return portfolioRanking;
    }
    /**
     * Update resource priority based on changing conditions
     * @param resourceId - Resource identifier
     * @param contextChanges - Changes in business context
     * @returns Updated priority level
     */
    updatePriority(resourceId, contextChanges) {
        this.logger.info(`Updating priority for resource ${resourceId}`, {
            contextChanges,
        });
        // Update business context
        const updatedConfig = {
            ...this.config,
            businessContext: { ...this.config.businessContext, ...contextChanges },
        };
        // Recalculate priority based on new context
        // This would require re-ranking with updated context
        // Simplified implementation returns current priority
        return 'medium'; // Placeholder
    }
    /**
     * Calculate detailed score breakdown
     */
    calculateScoreBreakdown(candidate, historicalData) {
        const scores = {
            businessValue: this.calculateBusinessValueScore(candidate),
            roi: this.calculateROIScore(candidate, historicalData),
            costEfficiency: this.calculateCostEfficiencyScore(candidate, historicalData),
            strategicImportance: this.calculateStrategicImportanceScore(candidate),
            riskFactor: this.calculateRiskFactorScore(candidate),
            usageTrends: this.calculateUsageTrendsScore(candidate, historicalData),
            performanceImpact: this.calculatePerformanceImpactScore(candidate),
            dependencies: this.calculateDependenciesScore(candidate),
            innovation: this.calculateInnovationScore(candidate),
            compliance: this.calculateComplianceScore(candidate),
        };
        // Calculate weighted contributions
        const weightedContributions = {};
        for (const [criterion, score] of Object.entries(scores)) {
            const weight = this.config.criteria[criterion];
            weightedContributions[criterion] = score * weight;
        }
        return {
            ...scores,
            weightedContributions,
        };
    }
    /**
     * Calculate business value score
     */
    calculateBusinessValueScore(candidate) {
        // Base score from business impact
        let score = candidate.businessImpact;
        // Adjust based on business phase
        switch (this.config.businessContext.phase) {
            case 'startup':
                // Prioritize innovation and market entry
                if (candidate.metadata.category === 'innovation')
                    score *= 1.3;
                break;
            case 'growth':
                // Prioritize scalability and efficiency
                if (candidate.metadata.category === 'scalability')
                    score *= 1.2;
                break;
            case 'maturity':
                // Prioritize optimization and cost control
                if (candidate.metadata.category === 'optimization')
                    score *= 1.15;
                break;
            case 'transformation':
                // Prioritize strategic initiatives
                if (candidate.metadata.category === 'strategic')
                    score *= 1.25;
                break;
            default:
                // Handle unexpected business phases
                console.warn(`Unknown business phase: ${this.config.businessContext.phase}`);
                break;
        }
        // Adjust based on strategic focus
        for (const focus of this.config.businessContext.strategicFocus) {
            if (candidate.metadata.tags?.includes(focus)) {
                score *= 1.1;
            }
        }
        return Math.min(100, Math.max(0, score));
    }
    /**
     * Calculate ROI score
     */
    calculateROIScore(candidate, historicalData) {
        if (historicalData.length === 0)
            return 50; // Default score
        const avgROI = historicalData.reduce((sum, data) => sum + (data.revenue / Math.max(data.totalCost, 1)), 0) / historicalData.length;
        // Convert ROI to 0-100 score (ROI of 2.0 = 100 points)
        return Math.min(100, Math.max(0, avgROI * 50));
    }
    /**
     * Calculate cost efficiency score
     */
    calculateCostEfficiencyScore(candidate, historicalData) {
        if (historicalData.length === 0)
            return 50;
        const avgCostPerUnit = historicalData.reduce((sum, data) => sum + (data.totalCost / Math.max(data.usage, 1)), 0) / historicalData.length;
        const currentCostPerUnit = candidate.currentAllocation / Math.max(candidate.projectedUsage, 1);
        // Better efficiency (lower cost per unit) gets higher score
        const efficiency = Math.max(0.1, avgCostPerUnit / Math.max(currentCostPerUnit, 0.1));
        return Math.min(100, efficiency * 50);
    }
    /**
     * Calculate strategic importance score
     */
    calculateStrategicImportanceScore(candidate) {
        let score = 50; // Base score
        // Check alignment with strategic focus
        const focusAlignment = this.config.businessContext.strategicFocus.filter(focus => candidate.metadata.tags?.includes(focus)).length;
        score += focusAlignment * 15; // Up to 45 bonus points
        // Adjust based on priority level
        switch (candidate.priority) {
            case 'critical':
                score += 30;
                break;
            case 'high':
                score += 20;
                break;
            case 'medium':
                score += 10;
                break;
            case 'low':
                score += 0;
                break;
            case 'deferred':
                score -= 20;
                break;
            default:
                // Handle unexpected priority levels
                console.warn(`Unknown priority level: ${candidate.priority}`);
                break;
        }
        return Math.min(100, Math.max(0, score));
    }
    /**
     * Calculate risk factor score
     */
    calculateRiskFactorScore(candidate) {
        let score = 100; // Start with perfect score
        // Reduce score based on technical complexity
        score -= candidate.technicalComplexity * 0.3;
        // Adjust based on competitive pressure
        switch (this.config.businessContext.competitivePressure) {
            case 'critical':
                if (candidate.metadata.category === 'defensive')
                    score += 20;
                break;
            case 'high':
                if (candidate.metadata.category === 'competitive')
                    score += 15;
                break;
            case 'medium':
                // No adjustment
                break;
            case 'low':
                if (candidate.metadata.category === 'experimental')
                    score += 10;
                break;
            default:
                // Handle unexpected competitive pressure levels
                console.warn(`Unknown competitive pressure level: ${this.config.businessContext.competitivePressure}`);
                break;
        }
        // Factor in market conditions
        if (this.config.businessContext.marketConditions === 'volatile') {
            if (candidate.metadata.category === 'stable')
                score += 15;
        }
        return Math.min(100, Math.max(0, score));
    }
    /**
     * Calculate usage trends score
     */
    calculateUsageTrendsScore(candidate, historicalData) {
        if (historicalData.length < 3)
            return 50;
        // Calculate usage trend
        const usageValues = historicalData.map(data => data.usage);
        const trend = this.calculateTrendSlope(usageValues);
        // Positive trend gets higher score
        const trendScore = 50 + (trend * 25);
        // Factor in projected usage vs current allocation
        const projectedUtilization = candidate.projectedUsage / candidate.currentAllocation;
        const utilizationScore = Math.min(100, projectedUtilization * 100);
        return Math.min(100, Math.max(0, (trendScore + utilizationScore) / 2));
    }
    /**
     * Calculate performance impact score
     */
    calculatePerformanceImpactScore(candidate) {
        // Base score from business impact
        let score = candidate.businessImpact;
        // Adjust based on performance criticality
        if (candidate.metadata.performanceCritical === true) {
            score *= 1.2;
        }
        // Adjust based on user impact
        const userImpact = candidate.metadata.userImpact || 50;
        score = (score + userImpact) / 2;
        return Math.min(100, Math.max(0, score));
    }
    /**
     * Calculate dependencies score
     */
    calculateDependenciesScore(candidate) {
        const dependencies = candidate.metadata.dependencies || [];
        // Fewer dependencies generally better, but critical dependencies important
        let score = Math.max(20, 100 - (dependencies.length * 10));
        // Boost score for resources that many others depend on
        const dependents = candidate.metadata.dependents || [];
        if (dependents.length > 0) {
            score += Math.min(30, dependents.length * 10);
        }
        return Math.min(100, Math.max(0, score));
    }
    /**
     * Calculate innovation score
     */
    calculateInnovationScore(candidate) {
        let score = 50;
        // Boost for innovation category
        if (candidate.metadata.category === 'innovation') {
            score += 40;
        }
        // Boost for new technologies
        if (candidate.metadata.newTechnology === true) {
            score += 25;
        }
        // Boost for competitive advantage
        if (candidate.metadata.competitiveAdvantage === true) {
            score += 20;
        }
        // Adjust based on business phase
        if (this.config.businessContext.phase === 'startup') {
            score *= 1.3;
        }
        return Math.min(100, Math.max(0, score));
    }
    /**
     * Calculate compliance score
     */
    calculateComplianceScore(candidate) {
        let score = 50;
        // Boost for compliance requirements
        const complianceRequired = candidate.metadata.complianceRequired || false;
        if (complianceRequired) {
            score += 40;
        }
        // Boost for security requirements
        const securityCritical = candidate.metadata.securityCritical || false;
        if (securityCritical) {
            score += 30;
        }
        // Boost for regulatory requirements
        const regulatory = candidate.metadata.regulatory || false;
        if (regulatory) {
            score += 25;
        }
        return Math.min(100, Math.max(0, score));
    }
    /**
     * Calculate overall weighted score
     */
    calculateOverallScore(scoreBreakdown) {
        const { criteria } = this.config;
        return (scoreBreakdown.businessValue * criteria.businessValue +
            scoreBreakdown.roi * criteria.roi +
            scoreBreakdown.costEfficiency * criteria.costEfficiency +
            scoreBreakdown.strategicImportance * criteria.strategicImportance +
            scoreBreakdown.riskFactor * criteria.riskFactor +
            scoreBreakdown.usageTrends * criteria.usageTrends +
            scoreBreakdown.performanceImpact * criteria.performanceImpact +
            scoreBreakdown.dependencies * criteria.dependencies +
            scoreBreakdown.innovation * criteria.innovation +
            scoreBreakdown.compliance * criteria.compliance);
    }
    /**
     * Assign priority level based on score
     */
    assignPriority(score) {
        const { thresholds } = this.config;
        if (score >= thresholds.critical)
            return 'critical';
        if (score >= thresholds.high)
            return 'high';
        if (score >= thresholds.medium)
            return 'medium';
        if (score >= thresholds.low)
            return 'low';
        return 'deferred';
    }
    /**
     * Generate ranking justification
     */
    generateJustification(candidate, scoreBreakdown, historicalData) {
        const primaryFactors = [];
        const supportingFactors = [];
        const riskConsiderations = [];
        const businessContext = [];
        const differentiators = [];
        const recommendedActions = [];
        // Identify primary factors (highest weighted contributions)
        const contributions = Object.entries(scoreBreakdown.weightedContributions)
            .sort(([, a], [, b]) => b - a);
        primaryFactors.push(`Strong ${contributions[0][0].replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        primaryFactors.push(`Above average ${contributions[1][0].replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        // Add business context factors
        if (this.config.businessContext.strategicFocus.some(focus => candidate.metadata.tags?.includes(focus))) {
            businessContext.push('Aligns with strategic focus areas');
        }
        // Add risk considerations
        if (candidate.technicalComplexity > 70) {
            riskConsiderations.push('High technical complexity');
        }
        // Add recommendations
        if (scoreBreakdown.roi > 80) {
            recommendedActions.push('Prioritize for immediate implementation');
        }
        else if (scoreBreakdown.roi < 40) {
            recommendedActions.push('Review ROI projections before proceeding');
        }
        return {
            primaryFactors,
            supportingFactors,
            riskConsiderations,
            businessContext,
            differentiators,
            recommendedActions,
        };
    }
    /**
     * Calculate ranking confidence
     */
    calculateConfidence(scoreBreakdown, historicalData) {
        let confidence = 80; // Base confidence
        // Reduce confidence for limited historical data
        if (historicalData.length < 5) {
            confidence -= 20;
        }
        // Reduce confidence for high score variance
        const scores = Object.values(scoreBreakdown).slice(0, -1); // Exclude weightedContributions
        const variance = this.calculateVariance(scores);
        if (variance > 400) { // High variance
            confidence -= 15;
        }
        // Increase confidence for consistent high performance
        if (historicalData.length > 10) {
            const avgPerformance = historicalData.reduce((sum, data) => sum + (data.performance || 50), 0) / historicalData.length;
            if (avgPerformance > 80) {
                confidence += 10;
            }
        }
        return Math.min(95, Math.max(30, confidence));
    }
    /**
     * Perform sensitivity analysis
     */
    performSensitivityAnalysis(scoreBreakdown) {
        const influentialCriteria = Object.entries(scoreBreakdown.weightedContributions)
            .map(([criterion, contribution]) => ({
            criterion,
            influence: contribution,
        }))
            .sort((a, b) => b.influence - a.influence)
            .slice(0, 3);
        // Calculate score range by varying top criteria
        const currentScore = Object.values(scoreBreakdown.weightedContributions)
            .reduce((sum, contrib) => sum + contrib, 0);
        const best = currentScore * 1.15; // 15% increase
        const worst = currentScore * 0.85; // 15% decrease
        const likely = currentScore;
        // Determine stability based on influence distribution
        const topInfluence = influentialCriteria[0]?.influence || 0;
        const totalInfluence = influentialCriteria.reduce((sum, item) => sum + item.influence, 0);
        const concentration = topInfluence / totalInfluence;
        let stability = 'stable';
        if (concentration > 0.6)
            stability = 'volatile';
        else if (concentration > 0.4)
            stability = 'moderate';
        return {
            influentialCriteria,
            scoreRange: { best, worst, likely },
            stability,
            dependencies: [], // Simplified - would analyze criterion correlations
        };
    }
    /**
     * Group rankings by priority
     */
    groupByPriority(rankings) {
        const groups = {
            critical: [],
            high: [],
            medium: [],
            low: [],
            deferred: [],
        };
        for (const ranking of rankings) {
            groups[ranking.priority].push(ranking);
        }
        return groups;
    }
    /**
     * Generate portfolio insights
     */
    generatePortfolioInsights(rankings, candidates) {
        // Calculate priority distribution
        const priorityDistribution = {
            critical: rankings.filter(r => r.priority === 'critical').length,
            high: rankings.filter(r => r.priority === 'high').length,
            medium: rankings.filter(r => r.priority === 'medium').length,
            low: rankings.filter(r => r.priority === 'low').length,
            deferred: rankings.filter(r => r.priority === 'deferred').length,
        };
        // Calculate risk-reward balance
        const avgRisk = rankings.reduce((sum, r) => sum + (100 - r.scoreBreakdown.riskFactor), 0) / rankings.length;
        const avgReward = rankings.reduce((sum, r) => sum + r.scoreBreakdown.roi, 0) / rankings.length;
        const riskRewardBalance = avgReward / Math.max(avgRisk, 1);
        // Calculate strategic alignment
        const strategicAlignment = rankings.reduce((sum, r) => sum + r.scoreBreakdown.strategicImportance, 0) / rankings.length;
        const strengths = [];
        const vulnerabilities = [];
        const opportunities = [];
        // Identify strengths
        if (priorityDistribution.critical + priorityDistribution.high > rankings.length * 0.4) {
            strengths.push('Strong portfolio of high-priority resources');
        }
        if (avgReward > 70) {
            strengths.push('Excellent ROI potential across resources');
        }
        // Identify vulnerabilities
        if (priorityDistribution.deferred > rankings.length * 0.2) {
            vulnerabilities.push('High percentage of deferred resources');
        }
        if (avgRisk > 60) {
            vulnerabilities.push('Portfolio carries significant risk');
        }
        // Identify opportunities
        if (strategicAlignment < 60) {
            opportunities.push('Better align resources with strategic focus');
        }
        return {
            balance: {
                priorityDistribution,
                riskRewardBalance,
                strategicAlignment,
            },
            strengths,
            vulnerabilities,
            opportunities,
            interdependencies: [], // Simplified implementation
        };
    }
    /**
     * Calculate ranking statistics
     */
    calculateRankingStatistics(rankings) {
        const scores = rankings.map(r => r.score);
        const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const sortedScores = [...scores].sort((a, b) => a - b);
        const medianScore = sortedScores[Math.floor(sortedScores.length / 2)];
        const variance = scores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / scores.length;
        const standardDeviation = Math.sqrt(variance);
        // Calculate quartiles
        const q1Index = Math.floor(scores.length * 0.25);
        const q3Index = Math.floor(scores.length * 0.75);
        const quartiles = [
            sortedScores[q1Index],
            medianScore,
            sortedScores[q3Index],
        ];
        // Identify outliers (simplified)
        const outliers = [];
        const threshold = averageScore + (2 * standardDeviation);
        rankings.forEach(ranking => {
            if (Math.abs(ranking.score - averageScore) > threshold) {
                outliers.push(ranking.resourceId);
            }
        });
        // Calculate consensus (simplified)
        const highConfidence = rankings.filter(r => r.confidence > 80).length;
        const agreement = highConfidence / rankings.length;
        const controversial = rankings
            .filter(r => r.sensitivity.stability === 'volatile')
            .map(r => r.resourceId);
        return {
            averageScore,
            medianScore,
            standardDeviation,
            distribution: { quartiles, outliers },
            consensus: { agreement, controversial },
        };
    }
    /**
     * Recommend allocation strategy based on rankings
     */
    recommendAllocationStrategy(rankings, insights) {
        const highPriorityCount = insights.balance.priorityDistribution.critical +
            insights.balance.priorityDistribution.high;
        const totalResources = rankings.length;
        const highPriorityRatio = highPriorityCount / totalResources;
        // Determine strategy based on portfolio characteristics
        if (insights.balance.riskRewardBalance > 1.5 && highPriorityRatio > 0.5) {
            return 'roi_optimized';
        }
        if (insights.balance.strategicAlignment > 75) {
            return 'priority_weighted';
        }
        if (rankings.some(r => r.scoreBreakdown.costEfficiency > 80)) {
            return 'usage_based';
        }
        return 'priority_weighted'; // Default strategy
    }
    /**
     * Calculate trend slope from data points
     */
    calculateTrendSlope(values) {
        if (values.length < 2)
            return 0;
        const n = values.length;
        const sumX = values.reduce((sum, _, index) => sum + index, 0);
        const sumY = values.reduce((sum, value) => sum + value, 0);
        const sumXY = values.reduce((sum, value, index) => sum + (index * value), 0);
        const sumX2 = values.reduce((sum, _, index) => sum + (index * index), 0);
        return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    }
    /**
     * Calculate variance of an array
     */
    calculateVariance(values) {
        if (values.length === 0)
            return 0;
        const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
        return values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    }
    /**
     * Merge configuration with defaults
     */
    mergeConfig(defaultConfig, userConfig) {
        return {
            criteria: { ...defaultConfig.criteria, ...userConfig.criteria },
            thresholds: { ...defaultConfig.thresholds, ...userConfig.thresholds },
            businessContext: { ...defaultConfig.businessContext, ...userConfig.businessContext },
            algorithm: { ...defaultConfig.algorithm, ...userConfig.algorithm },
            enableAdvancedFeatures: userConfig.enableAdvancedFeatures ?? defaultConfig.enableAdvancedFeatures,
        };
    }
    /**
     * Validate configuration
     */
    validateConfiguration() {
        const { criteria, thresholds } = this.config;
        // Validate criteria weights sum to 1.0
        const totalWeight = Object.values(criteria).reduce((sum, weight) => sum + weight, 0);
        if (Math.abs(totalWeight - 1.0) > 0.01) {
            throw new Error('Ranking criteria weights must sum to 1.0');
        }
        // Validate individual weights
        for (const [criterion, weight] of Object.entries(criteria)) {
            if (weight < 0 || weight > 1) {
                throw new Error(`Criterion weight ${criterion} must be between 0 and 1`);
            }
        }
        // Validate thresholds
        if (thresholds.critical <= thresholds.high ||
            thresholds.high <= thresholds.medium ||
            thresholds.medium <= thresholds.low) {
            throw new Error('Priority thresholds must be in descending order');
        }
        // Validate threshold ranges
        for (const [level, threshold] of Object.entries(thresholds)) {
            if (threshold < 0 || threshold > 100) {
                throw new Error(`Threshold ${level} must be between 0 and 100`);
            }
        }
    }
}
/**
 * Create resource ranking instance
 * @param config - Ranking configuration
 * @param logger - Logger instance
 * @returns ResourceRanking instance
 */
export function createResourceRanking(config, logger) {
    const defaultLogger = {
        info: () => { },
        warn: () => { },
        error: () => { },
        debug: () => { },
    };
    return new ResourceRanking(config, logger || defaultLogger);
}
//# sourceMappingURL=ResourceRanking.js.map