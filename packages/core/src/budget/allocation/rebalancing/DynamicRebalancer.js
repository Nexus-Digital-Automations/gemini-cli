/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Default dynamic rebalancing configuration
 */
export const DEFAULT_REBALANCING_CONFIG = {
    strategy: 'adaptive',
    triggers: [
        {
            id: 'performance_degradation',
            type: 'performance',
            condition: {
                metric: 'performance_score',
                operator: '<',
                threshold: 70,
                timeWindow: '15m',
                consecutiveOccurrences: 3,
            },
            sensitivity: 0.8,
            cooldownPeriod: '30m',
            enabled: true,
        },
        {
            id: 'high_utilization',
            type: 'utilization',
            condition: {
                metric: 'utilization_rate',
                operator: '>',
                threshold: 0.9,
                timeWindow: '10m',
                consecutiveOccurrences: 2,
            },
            sensitivity: 0.7,
            cooldownPeriod: '20m',
            enabled: true,
        },
    ],
    constraints: {
        maxFrequency: '1h',
        maxAllocationChange: 0.3,
        minStabilityPeriod: '2h',
        resourceConstraints: {},
        budgetConstraints: {
            totalLimit: 100000,
            reservedPercentage: 0.1,
            emergencyBuffer: 0.05,
        },
        performanceConstraints: {
            minPerformanceThreshold: 60,
            maxDegradationAllowed: 0.2,
        },
    },
    monitoring: {
        realTimeMonitoring: true,
        monitoringFrequency: '5m',
        metricsToMonitor: ['performance', 'utilization', 'cost', 'error_rate'],
        dataRetentionPeriod: '30d',
        alertThresholds: {
            performance: 70,
            utilization: 90,
            cost: 10000,
            error_rate: 0.05,
        },
        notifications: {
            enabled: true,
            channels: ['email', 'slack'],
            recipients: ['ops-team', 'budget-admin'],
        },
    },
    riskManagement: {
        enabled: true,
        riskTolerance: 'moderate',
        riskMetrics: ['performance_risk', 'cost_risk', 'availability_risk'],
        maxRiskScore: 70,
        mitigationStrategies: [
            'gradual_rollout',
            'canary_testing',
            'automatic_rollback',
        ],
        rollback: {
            enabled: true,
            conditions: ['performance_degradation > 30%', 'error_rate > 10%'],
            timeout: '15m',
        },
    },
    automation: {
        enabled: true,
        approvalRequired: false,
        approvalTimeout: '1h',
        scope: {
            maxChangeWithoutApproval: 0.2,
            autoRebalanceableResources: ['non_critical'],
            manualApprovalResources: ['critical', 'production'],
        },
        execution: {
            strategy: 'gradual',
            gradual: {
                changeRatePerPeriod: 0.1,
                periodDuration: '10m',
            },
        },
    },
};
/**
 * Dynamic budget rebalancer
 * Provides intelligent budget rebalancing based on real-time conditions
 */
export class DynamicRebalancer {
    config;
    logger;
    executionHistory = [];
    lastAnalysis;
    /**
     * Create dynamic rebalancer instance
     * @param config - Rebalancing configuration
     * @param logger - Logger instance
     */
    constructor(config = {}, logger) {
        this.config = { ...DEFAULT_REBALANCING_CONFIG, ...config };
        this.logger = logger;
        this.validateConfiguration();
    }
    /**
     * Analyze current allocation state and determine rebalancing needs
     * @param candidates - Current allocation candidates
     * @param historicalData - Historical performance data
     * @returns Rebalancing analysis
     */
    analyzeRebalancingNeeds(candidates, historicalData) {
        this.logger.info('Starting rebalancing analysis', {
            resourceCount: candidates.length,
            strategy: this.config.strategy,
        });
        const timestamp = new Date();
        // Evaluate current resource states
        const resourceStates = this.evaluateResourceStates(candidates, historicalData);
        // Check for triggered conditions
        const triggeredConditions = this.evaluateTriggers(resourceStates);
        const rebalancingRequired = triggeredConditions.length > 0;
        // Generate rebalancing recommendations if needed
        const recommendedActions = rebalancingRequired
            ? this.generateRebalancingActions(candidates, resourceStates, triggeredConditions)
            : [];
        // Assess risks
        const riskAssessment = this.assessRebalancingRisks(recommendedActions, resourceStates);
        // Predict outcomes
        const expectedOutcomes = this.predictRebalancingOutcomes(recommendedActions, resourceStates);
        // Calculate analysis confidence
        const confidence = this.calculateAnalysisConfidence(resourceStates, historicalData);
        const analysis = {
            timestamp,
            rebalancingRequired,
            triggeredConditions,
            resourceStates,
            recommendedActions,
            riskAssessment,
            expectedOutcomes,
            confidence,
        };
        this.lastAnalysis = analysis;
        this.logger.info('Rebalancing analysis completed', {
            rebalancingRequired,
            triggeredConditions: triggeredConditions.length,
            recommendedActions: recommendedActions.length,
            riskLevel: riskAssessment.overallRisk,
        });
        return analysis;
    }
    /**
     * Execute rebalancing actions
     * @param analysis - Rebalancing analysis with recommended actions
     * @returns Execution result
     */
    async executeRebalancing(analysis) {
        if (!analysis.rebalancingRequired) {
            throw new Error('No rebalancing required based on analysis');
        }
        const executionId = `rebalance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.logger.info(`Starting rebalancing execution ${executionId}`, {
            actionCount: analysis.recommendedActions.length,
            strategy: this.config.automation.execution.strategy,
        });
        const executionStart = Date.now();
        const executedActions = [];
        const issues = [];
        let successfulActions = 0;
        let failedActions = 0;
        try {
            // Check if approval is required
            if (this.requiresApproval(analysis.recommendedActions)) {
                const approved = await this.requestApproval(analysis);
                if (!approved) {
                    throw new Error('Rebalancing execution not approved');
                }
            }
            // Execute actions based on strategy
            switch (this.config.automation.execution.strategy) {
                case 'immediate':
                    await this.executeImmediate(analysis.recommendedActions);
                    break;
                case 'staged':
                    await this.executeStaged(analysis.recommendedActions);
                    break;
                case 'gradual':
                    await this.executeGradual(analysis.recommendedActions);
                    break;
            }
            // Update counters (simplified - would track actual execution results)
            successfulActions = analysis.recommendedActions.length;
        }
        catch (error) {
            this.logger.error('Rebalancing execution failed', { error });
            failedActions = analysis.recommendedActions.length;
            issues.push(error instanceof Error ? error.message : 'Unknown execution error');
        }
    }
    default;
}
const executionTime = Date.now() - executionStart;
// Measure actual outcomes (simplified implementation)
const actualOutcomes = await this.measureActualOutcomes(analysis);
// Determine overall status
let status = 'successful';
if (failedActions > 0) {
    status = successfulActions > 0 ? 'partial' : 'failed';
}
// Check if rollback is needed
if (this.shouldRollback(actualOutcomes)) {
    await this.executeRollback(executedActions);
    status = 'rolled_back';
}
const result = {
    executionId,
    executedAt: new Date(),
    executedActions,
    status,
    metrics: {
        executionTime,
        successfulActions,
        failedActions,
    },
    actualOutcomes,
    issues,
    lessonsLearned: this.extractLessonsLearned(issues, actualOutcomes),
};
// Store execution history
this.executionHistory.push(result);
this.logger.info(`Rebalancing execution ${executionId} completed`, {
    status,
    successfulActions,
    failedActions,
    executionTime,
});
return result;
/**
 * Get rebalancing recommendations without execution
 * @param candidates - Current allocation candidates
 * @param historicalData - Historical performance data
 * @returns Rebalancing recommendations
 */
getRebalancingRecommendations(candidates, AllocationCandidate[], historicalData, (Record));
AllocationRecommendation[];
{
    const analysis = this.analyzeRebalancingNeeds(candidates, historicalData);
    return analysis.recommendedActions.map((action) => this.convertToAllocationRecommendation(action, candidates));
}
evaluateResourceStates(candidates, AllocationCandidate[], historicalData, (Record));
ResourceState[];
{
    return candidates.map((candidate) => {
        const resourceData = historicalData[candidate.resourceId] || [];
        const recentData = resourceData.slice(-5); // Last 5 data points
        // Calculate current metrics
        const currentUtilization = recentData.length > 0
            ? recentData[recentData.length - 1].utilizationRate
            : 0.5;
        const performanceMetrics = {
            performance: recentData.length > 0
                ? recentData[recentData.length - 1].performance || 80
                : 80,
            availability: 99.5, // Simplified
            errorRate: 0.01, // Simplified
        };
        // Calculate trends
        const trends = this.calculateResourceTrends(recentData);
        // Determine health
        const health = this.determineResourceHealth(currentUtilization, performanceMetrics);
        return {
            resourceId: candidate.resourceId,
            currentAllocation: candidate.currentAllocation,
            currentUtilization,
            performanceMetrics,
            trends,
            health,
            lastRebalanced: new Date(Date.now() - 24 * 60 * 60 * 1000), // Placeholder
        };
    });
}
calculateResourceTrends(recentData, FeatureCostAnalysis[]);
{
    allocation: 'increasing' | 'decreasing' | 'stable';
    utilization: 'increasing' | 'decreasing' | 'stable';
    performance: 'improving' | 'degrading' | 'stable';
}
{
    if (recentData.length < 3) {
        return {
            allocation: 'stable',
            utilization: 'stable',
            performance: 'stable',
        };
    }
    const utilizationTrend = this.calculateTrend(recentData.map((d) => d.utilizationRate));
    const performanceTrend = this.calculateTrend(recentData.map((d) => d.performance || 80));
    return {
        allocation: 'stable', // Simplified
        utilization: utilizationTrend > 0.1
            ? 'increasing'
            : utilizationTrend < -0.1
                ? 'decreasing'
                : 'stable',
        performance: performanceTrend > 0.1
            ? 'improving'
            : performanceTrend < -0.1
                ? 'degrading'
                : 'stable',
    };
}
calculateTrend(values, number[]);
number;
{
    if (values.length < 2)
        return 0;
    const n = values.length;
    const sumX = values.reduce((sum, _, index) => sum + index, 0);
    const sumY = values.reduce((sum, value) => sum + value, 0);
    const sumXY = values.reduce((sum, value, index) => sum + index * value, 0);
    const sumX2 = values.reduce((sum, _, index) => sum + index * index, 0);
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
}
determineResourceHealth(utilization, number, metrics, (Record));
'healthy' | 'warning' | 'critical';
{
    const performance = metrics.performance;
    if (performance < 60 || utilization > 0.95 || metrics.errorRate > 0.1) {
        return 'critical';
    }
    if (performance < 80 || utilization > 0.85 || metrics.errorRate > 0.05) {
        return 'warning';
    }
    return 'healthy';
}
evaluateTriggers(resourceStates, ResourceState[]);
RebalancingTrigger[];
{
    const triggeredConditions = [];
    for (const trigger of this.config.triggers) {
        if (!trigger.enabled)
            continue;
        const triggered = this.evaluateTriggerCondition(trigger, resourceStates);
        if (triggered) {
            triggeredConditions.push(trigger);
        }
    }
    return triggeredConditions;
}
evaluateTriggerCondition(trigger, RebalancingTrigger, resourceStates, ResourceState[]);
boolean;
{
    const condition = trigger.condition;
    for (const state of resourceStates) {
        let metricValue;
        switch (condition.metric) {
            case 'performance_score':
                metricValue = state.performanceMetrics.performance;
                break;
            case 'utilization_rate':
                metricValue = state.currentUtilization;
                break;
            default:
                continue;
        }
        if (this.checkCondition(metricValue, condition.operator, condition.threshold)) {
            return true;
        }
    }
    return false;
}
checkCondition(value, number, operator, string, threshold, number);
boolean;
{
    switch (operator) {
        case '>':
            return value > threshold;
        case '<':
            return value < threshold;
        case '>=':
            return value >= threshold;
        case '<=':
            return value <= threshold;
        case '==':
            return value === threshold;
        case '!=':
            return value !== threshold;
        default:
            return false;
    }
}
generateRebalancingActions(candidates, AllocationCandidate[], resourceStates, ResourceState[], triggeredConditions, RebalancingTrigger[]);
RebalancingAction[];
{
    const actions = [];
    for (const state of resourceStates) {
        const candidate = candidates.find((c) => c.resourceId === state.resourceId);
        if (!candidate)
            continue;
        const action = this.determineAction(state, candidate, triggeredConditions);
        if (action) {
            actions.push(action);
        }
    }
    // Sort actions by priority
    actions.sort((a, b) => {
        const priorityOrder = { immediate: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    return actions;
}
determineAction(state, ResourceState, candidate, AllocationCandidate, triggeredConditions, RebalancingTrigger[]);
RebalancingAction | null;
{
    // Determine if action is needed based on state
    let actionType = 'maintain';
    let priority = 'medium';
    let rationale = 'No action required';
    if (state.health === 'critical') {
        if (state.currentUtilization > 0.9) {
            actionType = 'increase';
            priority = 'immediate';
            rationale =
                'Critical utilization levels require immediate resource increase';
        }
        else if (state.performanceMetrics.performance < 60) {
            actionType = 'increase';
            priority = 'immediate';
            rationale =
                'Critical performance degradation requires resource increase';
        }
    }
    else if (state.health === 'warning') {
        if (state.trends.utilization === 'increasing') {
            actionType = 'increase';
            priority = 'high';
            rationale =
                'Rising utilization trend suggests need for resource increase';
        }
    }
    else if (state.health === 'healthy') {
        if (state.currentUtilization < 0.3 &&
            state.trends.utilization === 'decreasing') {
            actionType = 'decrease';
            priority = 'low';
            rationale =
                'Low and decreasing utilization suggests resource optimization opportunity';
        }
    }
    if (actionType === 'maintain') {
        return null;
    }
    // Calculate allocation changes
    const currentAllocation = state.currentAllocation;
    let changeAmount = 0;
    switch (actionType) {
        case 'increase':
            changeAmount =
                currentAllocation * (state.health === 'critical' ? 0.3 : 0.2);
            break;
        case 'decrease':
            changeAmount = -currentAllocation * 0.15;
            break;
    }
    const recommendedAllocation = Math.max(candidate.constraints.minAllocation, Math.min(candidate.constraints.maxAllocation, currentAllocation + changeAmount));
    changeAmount = recommendedAllocation - currentAllocation;
    const changePercentage = (changeAmount / currentAllocation) * 100;
    return {
        type: actionType,
        resourceId: state.resourceId,
        currentAllocation,
        recommendedAllocation,
        changeAmount,
        changePercentage,
        priority,
        rationale,
        expectedImpact: {
            performance: actionType === 'increase' ? 15 : -5,
            cost: changeAmount,
            risk: (Math.abs(changeAmount) / currentAllocation) * 50,
        },
        timeline: priority === 'immediate' ? '5m' : priority === 'high' ? '15m' : '1h',
        prerequisites: [],
    };
    // Handle unexpected values
    break;
}
assessRebalancingRisks(actions, RebalancingAction[], resourceStates, ResourceState[]);
RebalancingRiskAssessment;
{
    const riskFactors = [];
    // Assess individual risks
    for (const action of actions) {
        if (action.changePercentage > 25) {
            riskFactors.push({
                name: 'Large allocation change',
                level: 'high',
                probability: 0.7,
                impact: 0.8,
                description: `Large allocation change (${action.changePercentage.toFixed(1)}%) for ${action.resourceId}`,
                mitigations: ['Gradual rollout', 'Enhanced monitoring'],
            });
        }
        if (action.priority === 'immediate') {
            riskFactors.push({
                name: 'Immediate execution risk',
                level: 'medium',
                probability: 0.5,
                impact: 0.6,
                description: 'Immediate execution may not allow sufficient testing',
                mitigations: ['Canary deployment', 'Quick rollback capability'],
            });
        }
    }
    // Calculate overall risk score
    const riskScore = riskFactors.length > 0
        ? riskFactors.reduce((sum, factor) => sum + factor.probability * factor.impact * 100, 0) / riskFactors.length
        : 0;
    let overallRisk = 'low';
    if (riskScore > 80)
        overallRisk = 'critical';
    else if (riskScore > 60)
        overallRisk = 'high';
    else if (riskScore > 40)
        overallRisk = 'medium';
    const mitigationRecommendations = [
        'Implement gradual rollout strategy',
        'Enable automatic rollback on performance degradation',
        'Enhance monitoring during rebalancing',
    ];
    return {
        overallRisk,
        riskScore,
        riskFactors,
        mitigationRecommendations,
        rollbackPlan: {
            feasible: true,
            steps: [
                'Revert allocation changes',
                'Restore previous configuration',
                'Validate system stability',
            ],
            timeline: '5-10 minutes',
        },
    };
}
predictRebalancingOutcomes(actions, RebalancingAction[], resourceStates, ResourceState[]);
RebalancingOutcome;
{
    const performanceImprovement = actions.reduce((sum, action) => sum + action.expectedImpact.performance, 0) / actions.length;
    const costSavings = actions.reduce((sum, action) => sum + (action.changeAmount < 0 ? Math.abs(action.changeAmount) : 0), 0);
    const efficiencyGain = Math.max(0, performanceImprovement + (costSavings > 0 ? 10 : 0));
    const utilizationChanges = {};
    actions.forEach((action) => {
        utilizationChanges[action.resourceId] =
            action.expectedImpact.performance * 0.5;
    });
    // Calculate success probability based on risk assessment
    const avgRisk = actions.reduce((sum, action) => sum + action.expectedImpact.risk, 0) /
        actions.length;
    const successProbability = Math.max(0.3, Math.min(0.95, 1 - avgRisk / 100));
    return {
        performanceImprovement,
        costSavings,
        efficiencyGain,
        utilizationChanges,
        successProbability,
        timeToRealizeBenefits: '15-30 minutes',
    };
}
calculateAnalysisConfidence(resourceStates, ResourceState[], historicalData, (Record));
number;
{
    let confidence = 80; // Base confidence
    // Reduce confidence for insufficient data
    const avgDataPoints = Object.values(historicalData).reduce((sum, data) => sum + data.length, 0) / Object.keys(historicalData).length;
    if (avgDataPoints < 5) {
        confidence -= 20;
    }
    else if (avgDataPoints < 10) {
        confidence -= 10;
    }
    // Increase confidence for consistent states
    const healthyStates = resourceStates.filter((s) => s.health === 'healthy').length;
    const healthyRatio = healthyStates / resourceStates.length;
    if (healthyRatio > 0.8) {
        confidence += 10;
    }
    return Math.min(95, Math.max(30, confidence));
}
requiresApproval(actions, RebalancingAction[]);
boolean;
{
    if (!this.config.automation.approvalRequired)
        return false;
    const maxChange = Math.max(...actions.map((a) => Math.abs(a.changePercentage)));
    return (maxChange > this.config.automation.scope.maxChangeWithoutApproval * 100);
}
async;
requestApproval(analysis, RebalancingAnalysis);
Promise < boolean > {
    // Simplified implementation - would integrate with approval system
    this: .logger.info('Requesting approval for rebalancing', {
        actionCount: analysis.recommendedActions.length,
        riskLevel: analysis.riskAssessment.overallRisk,
    }),
    // Simulate approval (would be actual approval process)
    return: analysis.riskAssessment.overallRisk !== 'critical'
};
async;
executeImmediate(actions, RebalancingAction[]);
Promise < void  > {
    for(, action, of, actions) {
        await this.executeAction(action);
    }
};
async;
executeStaged(actions, RebalancingAction[]);
Promise < void  > {
    const: staging = this.config.automation.execution.staging,
    throw: new Error('Staging configuration required for staged execution'),
    const: stages = this.groupActionsIntoStages(actions, staging.stages),
    for(let, i = 0, i, , stages) { }, : .length, i
}++;
{
    await Promise.all(stages[i].map((action) => this.executeAction(action)));
    if (i < stages.length - 1) {
        await this.delay(this.parseTimeString(staging.stageDelay));
    }
}
async;
executeGradual(actions, RebalancingAction[]);
Promise < void  > {
    const: gradual = this.config.automation.execution.gradual,
    throw: new Error('Gradual configuration required for gradual execution'),
    for(, action, of, actions) {
        await this.executeGradualAction(action, gradual);
    }
};
async;
executeAction(action, RebalancingAction);
Promise < void  > {
    this: .logger.info(`Executing rebalancing action for ${action.resourceId}`, {
        type: action.type,
        changeAmount: action.changeAmount,
    }),
    // Simplified implementation - would execute actual resource changes
    await, this: .delay(1000)
};
async;
executeGradualAction(action, RebalancingAction, config, { changeRatePerPeriod: number, periodDuration: string });
Promise < void  > {
    const: totalChange = action.changeAmount,
    const: periodDuration = this.parseTimeString(config.periodDuration),
    const: changePerPeriod = totalChange * config.changeRatePerPeriod,
    const: periods = Math.ceil(Math.abs(totalChange) / Math.abs(changePerPeriod)),
    let, appliedChange = 0,
    for(let, i = 0, i, , periods, i) { }
}++;
{
    const remainingChange = totalChange - appliedChange;
    const currentPeriodChange = Math.sign(totalChange) *
        Math.min(Math.abs(changePerPeriod), Math.abs(remainingChange));
    this.logger.debug(`Applying gradual change period ${i + 1}/${periods}`, {
        resourceId: action.resourceId,
        currentPeriodChange,
        appliedChange,
    });
    // Apply incremental change (simplified)
    await this.delay(100); // Simulate change application
    appliedChange += currentPeriodChange;
    if (i < periods - 1) {
        await this.delay(periodDuration);
    }
}
groupActionsIntoStages(actions, RebalancingAction[], stageCount, number);
RebalancingAction[][];
{
    const stages = Array.from({ length: stageCount }, () => []);
    // Distribute actions across stages based on priority
    const sortedActions = [...actions].sort((a, b) => {
        const priorityOrder = { immediate: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    sortedActions.forEach((action, index) => {
        stages[index % stageCount].push(action);
    });
    return stages;
}
async;
measureActualOutcomes(analysis, RebalancingAnalysis);
Promise < {
    performanceChange: number,
    costChange: number,
    efficiencyChange: number
} > {
    // Simplified implementation - would measure actual system metrics
    await, this: .delay(5000), // Wait for metrics to stabilize
    return: {
        performanceChange: analysis.expectedOutcomes.performanceImprovement * 0.8, // 80% of expected
        costChange: analysis.expectedOutcomes.costSavings * 0.9, // 90% of expected
        efficiencyChange: analysis.expectedOutcomes.efficiencyGain * 0.85, // 85% of expected
    }
};
shouldRollback(outcomes, {
    performanceChange: number,
    costChange: number,
    efficiencyChange: number
});
boolean;
{
    if (!this.config.riskManagement.rollback.enabled)
        return false;
    // Rollback if performance degraded significantly
    return outcomes.performanceChange < -20;
}
async;
executeRollback(executedActions, RebalancingAction[]);
Promise < void  > {
    this: .logger.warn('Executing rollback due to poor outcomes'),
    // Reverse all executed actions
    for(, action, of, executedActions) { }, : .reverse()
};
{
    const rollbackAction = {
        ...action,
        changeAmount: -action.changeAmount,
        recommendedAllocation: action.currentAllocation,
        rationale: `Rollback of ${action.rationale}`,
    };
    await this.executeAction(rollbackAction);
}
extractLessonsLearned(issues, string[], outcomes, {
    performanceChange: number,
    costChange: number,
    efficiencyChange: number
});
string[];
{
    const lessons = [];
    if (issues.length > 0) {
        lessons.push('Review error handling and validation procedures');
    }
    if (outcomes.performanceChange < 0) {
        lessons.push('Consider more conservative allocation changes for performance-sensitive resources');
    }
    if (outcomes.costChange < 0) {
        lessons.push('Better cost impact prediction models needed');
    }
    return lessons;
}
convertToAllocationRecommendation(action, RebalancingAction, candidates, AllocationCandidate[]);
AllocationRecommendation;
{
    const candidate = candidates.find((c) => c.resourceId === action.resourceId);
    if (!candidate) {
        throw new Error(`Candidate not found for resource ${action.resourceId}`);
    }
    return {
        resourceId: action.resourceId,
        currentAllocation: action.currentAllocation,
        recommendedAllocation: action.recommendedAllocation,
        allocationChange: action.changeAmount,
        strategy: 'usage_based', // Default strategy
        confidence: 80,
        expectedImpact: {
            costImpact: action.expectedImpact.cost,
            performanceImpact: action.expectedImpact.performance,
            utilizationImpact: 10, // Simplified
            businessValueImpact: action.expectedImpact.performance * 0.5,
            roiImpact: action.changeAmount !== 0
                ? action.expectedImpact.performance / Math.abs(action.changeAmount)
                : 0,
            impactTimeline: 'short_term',
        },
        riskAssessment: {
            riskLevel: action.expectedImpact.risk > 70
                ? 'high'
                : action.expectedImpact.risk > 40
                    ? 'medium'
                    : 'low',
            riskFactors: ['Allocation change risk'],
            mitigationStrategies: ['Monitor closely', 'Gradual implementation'],
            maxNegativeImpact: action.expectedImpact.risk,
            negativeProbability: action.expectedImpact.risk / 2,
        },
        dependencies: [],
        // Additional fields from OptimizationRecommendation
        type: 'rebalancing',
        priority: action.priority,
        description: action.rationale,
        expectedSavings: Math.max(0, -action.changeAmount),
        implementationComplexity: 'medium',
        validationCriteria: [
            'Performance metrics',
            'Utilization rates',
            'Cost efficiency',
        ],
        rollbackPlan: 'Revert allocation to previous values',
    };
}
parseTimeString(timeString, string);
number;
{
    const match = timeString.match(/(\d+)([smhd])/);
    if (!match)
        return 60000; // Default 1 minute
    const value = parseInt(match[1]);
    const unit = match[2];
    switch (unit) {
        case 's':
            return value * 1000;
        case 'm':
            return value * 60 * 1000;
        case 'h':
            return value * 60 * 60 * 1000;
        case 'd':
            return value * 24 * 60 * 60 * 1000;
        default:
            return 60000;
    }
}
delay(ms, number);
Promise < void  > {
    return: new Promise((resolve) => setTimeout(resolve, ms))
};
validateConfiguration();
void {
    : .config.constraints.maxAllocationChange <= 0 ||
        this.config.constraints.maxAllocationChange > 1
};
{
    throw new Error('Maximum allocation change must be between 0 and 1');
}
// Validate triggers
if (this.config.triggers.length === 0) {
    throw new Error('At least one rebalancing trigger must be configured');
}
// Validate automation scope
if (this.config.automation.scope.maxChangeWithoutApproval <= 0) {
    throw new Error('Maximum change without approval must be positive');
}
/**
 * Create dynamic rebalancer instance
 * @param config - Rebalancing configuration
 * @param logger - Logger instance
 * @returns DynamicRebalancer instance
 */
export function createDynamicRebalancer(config, logger) {
    const defaultLogger = {
        info: () => { },
        warn: () => { },
        error: () => { },
        debug: () => { },
    };
    return new DynamicRebalancer(config, logger || defaultLogger);
}
//# sourceMappingURL=DynamicRebalancer.js.map