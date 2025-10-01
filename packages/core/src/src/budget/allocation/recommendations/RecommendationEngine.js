/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { createAllocationAlgorithm, validateAlgorithmConfig, } from '../algorithms/index.js';
/**
 * Intelligent recommendation engine for budget allocation optimization
 */
export class RecommendationEngine {
    config;
    logger;
    processingStartTime = 0;
    /**
     * Create recommendation engine instance
     * @param config - Engine configuration
     * @param logger - Logger instance
     */
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.logger.info('Recommendation engine initialized', {
            defaultStrategy: config.defaultStrategy,
            multiStrategy: config.enableMultiStrategy,
            maxRecommendations: config.maxRecommendations,
        });
    }
    /**
     * Generate comprehensive budget allocation recommendations
     * @param candidates - Allocation candidates
     * @param context - Recommendation context
     * @returns Comprehensive recommendation result
     */
    async generateRecommendations(candidates, context) {
        this.processingStartTime = performance.now();
        this.logger.info('Starting recommendation generation', {
            candidateCount: candidates.length,
            strategy: this.config.defaultStrategy,
            totalBudget: context.budgetConstraints.totalBudget,
        });
        try {
            // Validate inputs
            this.validateInputs(candidates, context);
            // Prepare algorithm configurations
            const algorithmConfigs = this.prepareAlgorithmConfigs(context);
            // Generate primary recommendations
            const primaryRecommendations = await this.generatePrimaryRecommendations(candidates, context, algorithmConfigs.get(this.config.defaultStrategy));
            // Generate alternative recommendations if enabled
            const alternativeRecommendations = this.config.enableMultiStrategy
                ? await this.generateAlternativeRecommendations(candidates, context, algorithmConfigs)
                : new Map();
            // Generate scenarios if enabled
            const scenarios = this.config.enableScenarios
                ? await this.generateScenarios(candidates, context, primaryRecommendations)
                : [];
            // Collect optimization results
            const optimizationResults = new Map();
            // Generate insights and analysis
            const insights = this.generateInsights(candidates, primaryRecommendations, alternativeRecommendations, context);
            // Calculate performance metrics
            const performanceMetrics = this.calculatePerformanceMetrics(candidates, primaryRecommendations, alternativeRecommendations);
            const result = {
                primaryRecommendations,
                alternativeRecommendations,
                scenarios,
                optimizationResults,
                insights,
                performanceMetrics,
            };
            this.logger.info('Recommendation generation completed', {
                processingTime: performanceMetrics.processingTime,
                primaryCount: primaryRecommendations.length,
                alternativeStrategies: alternativeRecommendations.size,
                qualityScore: performanceMetrics.qualityScore,
            });
            return result;
        }
        catch (error) {
            this.logger.error('Recommendation generation failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                candidateCount: candidates.length,
            });
            throw error;
        }
    }
    /**
     * Validate input parameters
     * @param candidates - Allocation candidates
     * @param context - Recommendation context
     */
    validateInputs(candidates, context) {
        if (!candidates || candidates.length === 0) {
            throw new Error('No allocation candidates provided');
        }
        if (context.budgetConstraints.totalBudget <= 0) {
            throw new Error('Total budget must be positive');
        }
        if (this.config.minConfidence < 0 || this.config.minConfidence > 100) {
            throw new Error('Minimum confidence must be between 0 and 100');
        }
        // Validate candidate data completeness
        for (const candidate of candidates) {
            if (!candidate.resourceId || !candidate.resourceName) {
                throw new Error('Candidate missing required identification fields');
            }
            if (candidate.currentAllocation < 0) {
                throw new Error(`Invalid current allocation for ${candidate.resourceId}`);
            }
        }
    }
    /**
     * Prepare algorithm configurations for different strategies
     * @param context - Recommendation context
     * @returns Map of strategy to configuration
     */
    prepareAlgorithmConfigs(context) {
        const configs = new Map();
        const strategies = this.getStrategiesToEvaluate();
        for (const strategy of strategies) {
            const config = this.createStrategyConfig(strategy, context);
            validateAlgorithmConfig(config);
            configs.set(strategy, config);
        }
        return configs;
    }
    /**
     * Get list of strategies to evaluate
     * @returns Array of allocation strategies
     */
    getStrategiesToEvaluate() {
        const strategies = [this.config.defaultStrategy];
        if (this.config.enableMultiStrategy) {
            // Add complementary strategies based on default
            switch (this.config.defaultStrategy) {
                case 'usage_based':
                    strategies.push('roi_optimized', 'priority_weighted');
                    break;
                case 'roi_optimized':
                    strategies.push('usage_based', 'priority_weighted');
                    break;
                case 'priority_weighted':
                    strategies.push('usage_based', 'roi_optimized');
                    break;
                default:
                    strategies.push('usage_based', 'roi_optimized', 'priority_weighted');
            }
        }
        return [...new Set(strategies)]; // Remove duplicates
    }
    /**
     * Create algorithm configuration for specific strategy
     * @param strategy - Allocation strategy
     * @param context - Recommendation context
     * @returns Algorithm configuration
     */
    createStrategyConfig(strategy, context) {
        const baseConfig = {
            strategy,
            weights: this.calculateStrategyWeights(strategy, context),
            globalConstraints: {
                minAllocation: Math.max(100, context.budgetConstraints.totalBudget * 0.001),
                maxAllocation: Math.min(context.budgetConstraints.totalBudget * 0.5, 50000),
                allocationGranularity: 50,
                maxUtilizationRate: 0.9,
                minROIThreshold: context.preferences.riskTolerance === 'conservative' ? 0.15 : 0.05,
            },
            objectives: this.getStrategyObjectives(strategy, context),
            parameters: this.getStrategyParameters(strategy, context),
        };
        return baseConfig;
    }
    /**
     * Calculate strategy-specific weights based on context
     * @param strategy - Allocation strategy
     * @param context - Recommendation context
     * @returns Weight configuration
     */
    calculateStrategyWeights(strategy, context) {
        const { riskTolerance, priorityFocus } = context.preferences;
        const { businessCycle, marketConditions: _marketConditions } = context.businessContext;
        let baseWeights = {
            cost: 0.25,
            performance: 0.25,
            roi: 0.25,
            businessValue: 0.15,
            risk: 0.1,
        };
        // Adjust based on strategy
        switch (strategy) {
            case 'usage_based':
                baseWeights = {
                    cost: 0.4,
                    performance: 0.3,
                    roi: 0.15,
                    businessValue: 0.1,
                    risk: 0.05,
                };
                break;
            case 'roi_optimized':
                baseWeights = {
                    cost: 0.1,
                    performance: 0.2,
                    roi: 0.45,
                    businessValue: 0.2,
                    risk: 0.05,
                };
                break;
            case 'priority_weighted':
                baseWeights = {
                    cost: 0.15,
                    performance: 0.2,
                    roi: 0.2,
                    businessValue: 0.35,
                    risk: 0.1,
                };
                break;
            default:
                // Use balanced weights for unknown strategies
                baseWeights = {
                    cost: 0.25,
                    performance: 0.25,
                    roi: 0.25,
                    businessValue: 0.15,
                    risk: 0.1,
                };
                break;
        }
        // Adjust based on risk tolerance
        if (riskTolerance === 'conservative') {
            baseWeights.risk += 0.05;
            baseWeights.roi -= 0.05;
        }
        else if (riskTolerance === 'aggressive') {
            baseWeights.roi += 0.05;
            baseWeights.risk -= 0.05;
        }
        // Adjust based on priority focus
        switch (priorityFocus) {
            case 'cost':
                baseWeights.cost += 0.1;
                baseWeights.businessValue -= 0.05;
                baseWeights.performance -= 0.05;
                break;
            case 'growth':
                baseWeights.roi += 0.1;
                baseWeights.cost -= 0.05;
                baseWeights.risk -= 0.05;
                break;
            case 'innovation':
                baseWeights.businessValue += 0.1;
                baseWeights.cost -= 0.05;
                baseWeights.roi -= 0.05;
                break;
            case 'efficiency':
                baseWeights.performance += 0.1;
                baseWeights.businessValue -= 0.05;
                baseWeights.risk -= 0.05;
                break;
            default:
                // No adjustment for unknown priority focus - keep base weights
                break;
        }
        // Adjust based on business cycle
        if (businessCycle === 'optimization') {
            baseWeights.cost += 0.05;
            baseWeights.performance += 0.05;
            baseWeights.businessValue -= 0.05;
            baseWeights.roi -= 0.05;
        }
        else if (businessCycle === 'growth') {
            baseWeights.roi += 0.05;
            baseWeights.businessValue += 0.05;
            baseWeights.cost -= 0.05;
            baseWeights.risk -= 0.05;
        }
        return baseWeights;
    }
    /**
     * Get strategy-specific optimization objectives
     * @param strategy - Allocation strategy
     * @param context - Recommendation context
     * @returns Array of objectives
     */
    getStrategyObjectives(strategy, _context) {
        const baseObjectives = ['maximize_efficiency', 'minimize_risk'];
        switch (strategy) {
            case 'usage_based':
                return [...baseObjectives, 'optimize_utilization', 'balance_capacity'];
            case 'roi_optimized':
                return [...baseObjectives, 'maximize_roi', 'optimize_returns'];
            case 'priority_weighted':
                return [...baseObjectives, 'align_priorities', 'ensure_continuity'];
            default:
                return baseObjectives;
        }
    }
    /**
     * Get strategy-specific parameters
     * @param strategy - Allocation strategy
     * @param context - Recommendation context
     * @returns Parameters object
     */
    getStrategyParameters(strategy, context) {
        return {
            riskTolerance: context.preferences.riskTolerance,
            optimizationHorizon: context.preferences.optimizationHorizon,
            businessCycle: context.businessContext.businessCycle,
            enableIterativeImprovement: this.config.optimization.enableIterativeImprovement,
            maxIterations: this.config.optimization.maxIterations,
        };
    }
    /**
     * Generate primary recommendations using default strategy
     * @param candidates - Allocation candidates
     * @param context - Recommendation context
     * @param config - Algorithm configuration
     * @returns Primary recommendations
     */
    async generatePrimaryRecommendations(candidates, context, config) {
        const algorithm = createAllocationAlgorithm(this.config.defaultStrategy, config, this.logger);
        const result = await algorithm.optimize(candidates);
        return this.filterRecommendationsByConfidence(result.recommendations);
    }
    /**
     * Generate alternative recommendations using different strategies
     * @param candidates - Allocation candidates
     * @param context - Recommendation context
     * @param algorithmConfigs - Algorithm configurations
     * @returns Map of alternative recommendations
     */
    async generateAlternativeRecommendations(candidates, context, algorithmConfigs) {
        const alternatives = new Map();
        for (const [strategy, config] of algorithmConfigs) {
            if (strategy === this.config.defaultStrategy)
                continue;
            try {
                const algorithm = createAllocationAlgorithm(strategy, config, this.logger);
                const result = await algorithm.optimize(candidates);
                const filteredRecommendations = this.filterRecommendationsByConfidence(result.recommendations);
                alternatives.set(strategy, filteredRecommendations);
            }
            catch (error) {
                this.logger.warn(`Failed to generate recommendations for strategy ${strategy}`, {
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        return alternatives;
    }
    /**
     * Filter recommendations by minimum confidence threshold
     * @param recommendations - Raw recommendations
     * @returns Filtered recommendations
     */
    filterRecommendationsByConfidence(recommendations) {
        const filtered = recommendations.filter((rec) => rec.confidence >= this.config.minConfidence);
        // Sort by confidence descending, then by potential savings descending
        filtered.sort((a, b) => {
            if (b.confidence !== a.confidence) {
                return b.confidence - a.confidence;
            }
            return b.potentialSavings - a.potentialSavings;
        });
        // Limit to max recommendations
        return filtered.slice(0, this.config.maxRecommendations);
    }
    /**
     * Generate allocation scenarios for planning
     * @param candidates - Allocation candidates
     * @param context - Recommendation context
     * @param primaryRecommendations - Primary recommendations
     * @returns Array of scenarios
     */
    async generateScenarios(candidates, context, primaryRecommendations) {
        const scenarios = [];
        // Conservative scenario
        scenarios.push(this.createScenario('conservative', 'Conservative Allocation', 'Risk-averse allocation focusing on proven resources', candidates, primaryRecommendations, 0.8));
        // Aggressive scenario
        scenarios.push(this.createScenario('aggressive', 'Aggressive Optimization', 'Bold allocation changes for maximum optimization', candidates, primaryRecommendations, 1.3));
        // Balanced scenario (baseline)
        scenarios.push(this.createScenario('balanced', 'Balanced Approach', 'Moderate allocation changes balancing risk and reward', candidates, primaryRecommendations, 1.0));
        return scenarios;
    }
    /**
     * Create allocation scenario
     * @param id - Scenario identifier
     * @param name - Scenario name
     * @param description - Scenario description
     * @param candidates - Allocation candidates
     * @param recommendations - Base recommendations
     * @param multiplier - Change multiplier
     * @returns Allocation scenario
     */
    createScenario(id, name, description, candidates, recommendations, multiplier) {
        const adjustedRecommendations = recommendations.map((rec) => ({
            ...rec,
            allocationChange: rec.allocationChange * multiplier,
            recommendedAllocation: rec.currentAllocation + rec.allocationChange * multiplier,
            potentialSavings: Math.max(0, rec.potentialSavings * multiplier),
        }));
        const totalBudget = candidates.reduce((sum, c) => sum + c.currentAllocation, 0);
        const expectedOutcomes = this.calculateScenarioOutcomes(adjustedRecommendations, candidates);
        return {
            scenarioId: id,
            scenarioName: name,
            description,
            totalBudget,
            allocations: adjustedRecommendations,
            expectedOutcomes,
            timeline: 'Q1-Q2 FY2025',
            assumptions: [
                'Market conditions remain stable',
                'Resource utilization patterns continue',
                'No major strategic pivots',
                `Risk tolerance: ${multiplier > 1.1 ? 'high' : multiplier < 0.9 ? 'low' : 'moderate'}`,
            ],
        };
    }
    /**
     * Calculate expected outcomes for scenario
     * @param recommendations - Scenario recommendations
     * @param candidates - Original candidates
     * @returns Scenario outcomes
     */
    calculateScenarioOutcomes(recommendations, _candidates) {
        const totalCost = recommendations.reduce((sum, rec) => sum + rec.recommendedAllocation, 0);
        const _totalSavings = recommendations.reduce((sum, rec) => sum + rec.potentialSavings, 0);
        const averageROI = recommendations.reduce((sum, rec) => sum + rec.expectedImpact.roiImpact, 0) / recommendations.length;
        const utilizationEfficiency = recommendations.reduce((sum, rec) => sum + Math.abs(rec.expectedImpact.utilizationImpact), 0) / recommendations.length;
        const businessValue = recommendations.reduce((sum, rec) => sum + rec.expectedImpact.businessValueImpact, 0);
        const riskScore = recommendations.reduce((sum, rec) => {
            const riskWeights = { low: 0.1, medium: 0.3, high: 0.6, critical: 1.0 };
            return sum + riskWeights[rec.riskAssessment.riskLevel];
        }, 0) / recommendations.length;
        return {
            totalCost,
            overallROI: averageROI,
            utilizationEfficiency,
            businessValue,
            riskAdjustedReturn: averageROI * (1 - riskScore * 0.3),
            successProbability: Math.max(20, 90 - riskScore * 40),
        };
    }
    /**
     * Generate insights and analysis
     * @param candidates - Original candidates
     * @param primaryRecommendations - Primary recommendations
     * @param alternativeRecommendations - Alternative recommendations
     * @param context - Recommendation context
     * @returns Recommendation insights
     */
    generateInsights(candidates, primaryRecommendations, alternativeRecommendations, context) {
        const keyFindings = this.generateKeyFindings(candidates, primaryRecommendations);
        const opportunities = this.identifyOptimizationOpportunities(primaryRecommendations);
        const risks = this.identifyRisks(primaryRecommendations);
        const strategicRecommendations = this.generateStrategicRecommendations(primaryRecommendations, context);
        const implementationPriorities = this.determineImplementationPriorities(primaryRecommendations);
        return {
            keyFindings,
            opportunities,
            risks,
            strategicRecommendations,
            implementationPriorities,
        };
    }
    /**
     * Generate key findings from analysis
     * @param candidates - Original candidates
     * @param recommendations - Generated recommendations
     * @returns Array of key findings
     */
    generateKeyFindings(candidates, recommendations) {
        const findings = [];
        const totalSavings = recommendations.reduce((sum, rec) => sum + rec.potentialSavings, 0);
        const totalBudget = candidates.reduce((sum, c) => sum + c.currentAllocation, 0);
        const savingsPercentage = (totalSavings / totalBudget) * 100;
        if (savingsPercentage > 15) {
            findings.push(`Significant optimization opportunity: ${Math.round(savingsPercentage)}% potential savings identified`);
        }
        else if (savingsPercentage > 5) {
            findings.push(`Moderate optimization potential: ${Math.round(savingsPercentage)}% savings possible`);
        }
        else {
            findings.push('Current allocation is relatively optimized with minimal adjustment opportunities');
        }
        const highConfidenceCount = recommendations.filter((r) => r.confidence > 80).length;
        if (highConfidenceCount > recommendations.length * 0.7) {
            findings.push(`High confidence in ${highConfidenceCount} out of ${recommendations.length} recommendations`);
        }
        const criticalResources = candidates.filter((c) => c.priority === 'critical').length;
        if (criticalResources > 0) {
            findings.push(`${criticalResources} critical resources requiring careful allocation management`);
        }
        return findings;
    }
    /**
     * Identify optimization opportunities
     * @param recommendations - Generated recommendations
     * @returns Array of opportunities
     */
    identifyOptimizationOpportunities(recommendations) {
        const opportunities = [];
        const underutilizedResources = recommendations.filter((r) => r.allocationChange < 0 && r.confidence > 70);
        if (underutilizedResources.length > 0) {
            opportunities.push(`${underutilizedResources.length} underutilized resources identified for reallocation`);
        }
        const highROIOpportunities = recommendations.filter((r) => r.expectedImpact.roiImpact > 0.2 && r.confidence > 75);
        if (highROIOpportunities.length > 0) {
            opportunities.push(`${highROIOpportunities.length} high-ROI opportunities with significant return potential`);
        }
        const quickWins = recommendations.filter((r) => r.implementationComplexity === 'low' && r.potentialSavings > 0);
        if (quickWins.length > 0) {
            opportunities.push(`${quickWins.length} quick-win opportunities for immediate impact`);
        }
        return opportunities;
    }
    /**
     * Identify risks in recommendations
     * @param recommendations - Generated recommendations
     * @returns Array of risks
     */
    identifyRisks(recommendations) {
        const risks = [];
        const highRiskChanges = recommendations.filter((r) => r.riskAssessment.riskLevel === 'high' ||
            r.riskAssessment.riskLevel === 'critical');
        if (highRiskChanges.length > 0) {
            risks.push(`${highRiskChanges.length} recommendations carry high implementation risk`);
        }
        const largeChanges = recommendations.filter((r) => Math.abs(r.allocationChange / r.currentAllocation) > 0.3);
        if (largeChanges.length > 0) {
            risks.push(`${largeChanges.length} resources face significant allocation changes (>30%)`);
        }
        const lowConfidenceChanges = recommendations.filter((r) => r.confidence < 70);
        if (lowConfidenceChanges.length > 0) {
            risks.push(`${lowConfidenceChanges.length} recommendations have lower confidence levels`);
        }
        return risks;
    }
    /**
     * Generate strategic recommendations
     * @param recommendations - Generated recommendations
     * @param context - Recommendation context
     * @returns Array of strategic recommendations
     */
    generateStrategicRecommendations(recommendations, context) {
        const strategic = [];
        if (context.preferences.optimizationHorizon === 'long_term') {
            strategic.push('Focus on long-term ROI optimization over immediate cost savings');
        }
        if (context.businessContext.businessCycle === 'growth') {
            strategic.push('Prioritize growth-enabling resource allocation over cost optimization');
        }
        if (context.preferences.riskTolerance === 'conservative') {
            strategic.push('Implement changes gradually with careful monitoring of performance impacts');
        }
        else if (context.preferences.riskTolerance === 'aggressive') {
            strategic.push('Consider accelerated implementation timeline for maximum impact');
        }
        const criticalRecommendations = recommendations.filter((r) => r.priority === 'critical');
        if (criticalRecommendations.length > 0) {
            strategic.push('Ensure business continuity plans are in place before implementing critical resource changes');
        }
        return strategic;
    }
    /**
     * Determine implementation priorities
     * @param recommendations - Generated recommendations
     * @returns Array of implementation priorities
     */
    determineImplementationPriorities(recommendations) {
        const priorities = [];
        // Sort by combination of confidence, potential savings, and implementation complexity
        const sortedRecommendations = [...recommendations].sort((a, b) => {
            const scoreA = a.confidence * 0.4 +
                a.potentialSavings * 0.4 +
                (a.implementationComplexity === 'low'
                    ? 30
                    : a.implementationComplexity === 'medium'
                        ? 15
                        : 0) *
                    0.2;
            const scoreB = b.confidence * 0.4 +
                b.potentialSavings * 0.4 +
                (b.implementationComplexity === 'low'
                    ? 30
                    : b.implementationComplexity === 'medium'
                        ? 15
                        : 0) *
                    0.2;
            return scoreB - scoreA;
        });
        const topPriority = sortedRecommendations.slice(0, 3);
        if (topPriority.length > 0) {
            priorities.push(`Immediate: ${topPriority.map((r) => r.title).join(', ')}`);
        }
        const secondPriority = sortedRecommendations.slice(3, 6);
        if (secondPriority.length > 0) {
            priorities.push(`Short-term: ${secondPriority.map((r) => r.title).join(', ')}`);
        }
        const remainingPriority = sortedRecommendations.slice(6);
        if (remainingPriority.length > 0) {
            priorities.push(`Medium-term: ${remainingPriority.length} additional optimization opportunities`);
        }
        return priorities;
    }
    /**
     * Calculate performance metrics
     * @param candidates - Original candidates
     * @param primaryRecommendations - Primary recommendations
     * @param alternativeRecommendations - Alternative recommendations
     * @returns Performance metrics
     */
    calculatePerformanceMetrics(candidates, primaryRecommendations, alternativeRecommendations) {
        const processingTime = performance.now() - this.processingStartTime;
        const strategiesEvaluated = 1 + alternativeRecommendations.size;
        // Calculate quality score based on multiple factors
        const avgConfidence = primaryRecommendations.reduce((sum, r) => sum + r.confidence, 0) /
            primaryRecommendations.length;
        const avgPotentialSavings = primaryRecommendations.reduce((sum, r) => sum + r.potentialSavings, 0) /
            primaryRecommendations.length;
        const totalBudget = candidates.reduce((sum, c) => sum + c.currentAllocation, 0);
        const savingsRatio = avgPotentialSavings / (totalBudget / primaryRecommendations.length);
        const qualityScore = Math.min(100, avgConfidence * 0.5 + savingsRatio * 100 * 0.3 + strategiesEvaluated * 5);
        // Calculate confidence distribution
        const high = primaryRecommendations.filter((r) => r.confidence > 80).length;
        const medium = primaryRecommendations.filter((r) => r.confidence >= 60 && r.confidence <= 80).length;
        const low = primaryRecommendations.filter((r) => r.confidence < 60).length;
        return {
            processingTime,
            candidatesAnalyzed: candidates.length,
            strategiesEvaluated,
            qualityScore,
            confidenceDistribution: { high, medium, low },
        };
    }
}
/**
 * Create recommendation engine with default configuration
 * @param strategy - Default allocation strategy
 * @param logger - Logger instance
 * @returns RecommendationEngine instance
 */
export function createRecommendationEngine(strategy = 'usage_based', logger) {
    const config = {
        defaultStrategy: strategy,
        enableMultiStrategy: true,
        maxRecommendations: 20,
        minConfidence: 60,
        enableScenarios: true,
        optimization: {
            enableIterativeImprovement: true,
            maxIterations: 10,
            convergenceThreshold: 0.001,
            enableParallelProcessing: false,
        },
    };
    return new RecommendationEngine(config, logger);
}
//# sourceMappingURL=RecommendationEngine.js.map