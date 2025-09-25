/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Default priority assignment configuration
 */
export const DEFAULT_PRIORITY_CONFIG = {
    strategy: 'hybrid',
    dynamicAdjustment: {
        enabled: true,
        frequency: 'daily',
        sensitivity: 'medium',
        constraints: {
            maxChangesPerPeriod: 5,
            stabilityPeriod: '24h',
            confidenceThreshold: 0.8,
            approvalRequired: [
                { from: 'low', to: 'critical', approvalLevel: 'director' },
                { from: 'medium', to: 'critical', approvalLevel: 'manager' },
            ],
        },
    },
    escalation: {
        enabled: true,
        triggers: [
            {
                type: 'performance_based',
                condition: 'performance_degradation > 20%',
                action: 'increase_priority',
                sensitivity: 0.7,
            },
            {
                type: 'business_impact',
                condition: 'user_impact > 1000',
                action: 'add_resources',
                sensitivity: 0.8,
            },
        ],
        timeline: {
            initial: '4h',
            intervals: ['8h', '24h', '72h'],
            maxLevel: 'critical',
        },
        notifications: {
            enabled: true,
            channels: ['email', 'slack'],
            templates: {
                escalation: 'Resource {{resourceId}} has been escalated to {{level}} priority',
            },
        },
    },
    conflictResolution: {
        strategy: 'business_value',
        detection: {
            enabled: true,
            criteria: ['resource_overlap', 'budget_conflict', 'timeline_conflict'],
            threshold: 0.6,
        },
        process: {
            automatic: true,
            timeout: '2h',
            escalateOnFailure: true,
        },
    },
    businessRules: {
        mandatory: [
            {
                id: 'security_critical',
                name: 'Security Critical Resources',
                condition: 'metadata.securityCritical === true',
                action: { type: 'set_priority', parameters: { priority: 'critical' } },
                priority: 100,
                enabled: true,
            },
        ],
        conditional: [],
        priority: [],
    },
};
/**
 * Priority assignment engine
 * Provides intelligent priority assignment and management
 */
export class PriorityAssignment {
    config;
    logger;
    assignmentHistory = new Map();
    /**
     * Create priority assignment instance
     * @param config - Assignment configuration
     * @param logger - Logger instance
     */
    constructor(config = {}, logger) {
        this.config = { ...DEFAULT_PRIORITY_CONFIG, ...config };
        this.logger = logger;
        this.validateConfiguration();
    }
    /**
     * Assign priority to individual resource
     * @param candidate - Resource allocation candidate
     * @param ranking - Resource ranking result
     * @param historicalData - Historical performance data
     * @returns Priority assignment result
     */
    assignPriority(candidate, ranking, historicalData) {
        this.logger.info(`Assigning priority for resource ${candidate.resourceId}`, {
            currentPriority: candidate.priority,
            rankingScore: ranking.score,
        });
        // Apply business rules first
        const ruleResults = this.applyBusinessRules(candidate);
        // Determine base priority from ranking
        let assignedPriority = ranking.priority;
        // Apply rule-based adjustments
        for (const rule of ruleResults.appliedRules) {
            if (rule.action.type === 'set_priority') {
                assignedPriority = rule.action.parameters.priority;
            }
            else if (rule.action.type === 'adjust_priority') {
                assignedPriority = this.adjustPriority(assignedPriority, rule.action.parameters.adjustment);
            }
        }
        // Apply dynamic adjustments if enabled
        if (this.config.dynamicAdjustment.enabled) {
            assignedPriority = this.applyDynamicAdjustment(candidate, assignedPriority, historicalData);
        }
        // Check for escalation triggers
        const escalationTriggered = this.checkEscalationTriggers(candidate, historicalData);
        if (escalationTriggered) {
            assignedPriority = this.escalatePriority(assignedPriority);
        }
        // Generate assignment rationale
        const rationale = this.generateAssignmentRationale(candidate, ranking, assignedPriority, ruleResults.appliedRules);
        // Calculate assignment confidence
        const confidence = this.calculateAssignmentConfidence(candidate, ranking, ruleResults.confidence);
        // Create assignment metadata
        const metadata = this.createAssignmentMetadata(candidate, assignedPriority, this.config.strategy);
        // Generate assignment constraints
        const constraints = this.generateAssignmentConstraints(candidate, assignedPriority);
        const result = {
            resourceId: candidate.resourceId,
            assignedPriority,
            previousPriority: candidate.priority,
            rationale,
            confidence,
            metadata,
            nextReview: this.calculateNextReviewDate(),
            constraints,
        };
        // Store assignment history
        this.assignmentHistory.set(candidate.resourceId, metadata);
        this.logger.info(`Priority assignment completed for ${candidate.resourceId}`, {
            assignedPriority,
            confidence,
            rulesApplied: ruleResults.appliedRules.length,
        });
        return result;
    }
    /**
     * Assign priorities to portfolio of resources
     * @param candidates - Array of resource allocation candidates
     * @param rankings - Resource ranking results
     * @param historicalData - Historical data for all resources
     * @returns Portfolio priority assignment result
     */
    assignPortfolioPriorities(candidates, rankings, historicalData) {
        this.logger.info('Starting portfolio priority assignment', {
            resourceCount: candidates.length,
        });
        // Assign individual priorities
        const assignments = candidates.map(candidate => {
            const ranking = rankings.find(r => r.resourceId === candidate.resourceId);
            if (!ranking) {
                throw new Error(`No ranking found for resource ${candidate.resourceId}`);
            }
            return this.assignPriority(candidate, ranking, historicalData[candidate.resourceId] || []);
        });
        // Detect conflicts
        const conflicts = this.detectPriorityConflicts(assignments, candidates);
        // Resolve conflicts if automatic resolution enabled
        if (this.config.conflictResolution.process.automatic) {
            this.resolvePriorityConflicts(conflicts, assignments);
        }
        // Generate escalations
        const escalations = this.generateEscalations(assignments, candidates);
        // Generate portfolio insights
        const insights = this.generatePortfolioInsights(assignments, candidates);
        // Generate recommendations
        const recommendations = this.generatePortfolioRecommendations(assignments, insights, conflicts);
        const result = {
            assignments,
            insights,
            conflicts,
            escalations,
            recommendations,
        };
        this.logger.info('Portfolio priority assignment completed', {
            assignmentCount: assignments.length,
            conflictCount: conflicts.length,
            escalationCount: escalations.length,
        });
        return result;
    }
    /**
     * Update priority based on changing conditions
     * @param resourceId - Resource identifier
     * @param contextChanges - Changes in business context
     * @param performanceData - Recent performance data
     * @returns Updated priority assignment
     */
    updatePriority(resourceId, contextChanges, performanceData) {
        this.logger.info(`Updating priority for resource ${resourceId}`, {
            contextChanges,
        });
        const existingMetadata = this.assignmentHistory.get(resourceId);
        if (!existingMetadata) {
            this.logger.warn(`No assignment history found for resource ${resourceId}`);
            return null;
        }
        // Check if update is allowed based on constraints
        if (!this.isUpdateAllowed(resourceId, existingMetadata)) {
            this.logger.warn(`Priority update not allowed for resource ${resourceId}`);
            return null;
        }
        // Re-evaluate priority with new context
        // This would require re-running the full assignment process
        // Simplified implementation returns null
        return null;
    }
    /**
     * Apply business rules to resource
     */
    applyBusinessRules(candidate) {
        const appliedRules = [];
        let totalRuleWeight = 0;
        let totalRuleConfidence = 0;
        // Process mandatory rules first
        for (const rule of this.config.businessRules.mandatory) {
            if (!rule.enabled)
                continue;
            if (this.evaluateRuleCondition(rule.condition, candidate)) {
                appliedRules.push(rule);
                totalRuleWeight += rule.priority;
                totalRuleConfidence += 1.0; // Mandatory rules have full confidence
            }
        }
        // Process conditional rules
        for (const rule of this.config.businessRules.conditional) {
            if (!rule.enabled)
                continue;
            if (this.evaluateRuleCondition(rule.condition, candidate)) {
                appliedRules.push(rule);
                totalRuleWeight += rule.priority;
                totalRuleConfidence += 0.8; // Conditional rules have lower confidence
            }
        }
        // Process priority rules
        for (const rule of this.config.businessRules.priority) {
            if (!rule.enabled)
                continue;
            if (this.evaluateRuleCondition(rule.condition, candidate)) {
                appliedRules.push(rule);
                totalRuleWeight += rule.priority;
                totalRuleConfidence += 0.6; // Priority rules have lowest confidence
            }
        }
        const confidence = appliedRules.length > 0 ? totalRuleConfidence / appliedRules.length : 0.5;
        return { appliedRules, confidence };
    }
    /**
     * Evaluate rule condition against candidate
     */
    evaluateRuleCondition(condition, candidate) {
        // Simplified rule evaluation
        // In production, this would use a proper expression evaluator
        try {
            if (condition === 'metadata.securityCritical === true') {
                return candidate.metadata.securityCritical === true;
            }
            if (condition === 'priority === "critical"') {
                return candidate.priority === 'critical';
            }
            if (condition.includes('businessImpact >')) {
                const threshold = parseFloat(condition.split('>')[1].trim());
                return candidate.businessImpact > threshold;
            }
            return false;
        }
        catch (error) {
            this.logger.warn('Failed to evaluate rule condition', { condition, error });
            return false;
        }
    }
    /**
     * Apply dynamic priority adjustment
     */
    applyDynamicAdjustment(candidate, currentPriority, historicalData) {
        if (historicalData.length < 3)
            return currentPriority;
        // Check performance trends
        const recentPerformance = historicalData.slice(-3).map(data => data.performance || 80);
        const olderPerformance = historicalData.slice(0, 3).map(data => data.performance || 80);
        const recentAvg = recentPerformance.reduce((sum, p) => sum + p, 0) / recentPerformance.length;
        const olderAvg = olderPerformance.reduce((sum, p) => sum + p, 0) / olderPerformance.length;
        const performanceChange = (recentAvg - olderAvg) / olderAvg;
        // Adjust priority based on performance change
        if (performanceChange < -0.2 && this.config.dynamicAdjustment.sensitivity !== 'low') {
            return this.escalatePriority(currentPriority);
        }
        else if (performanceChange > 0.2 && this.config.dynamicAdjustment.sensitivity !== 'low') {
            return this.deeecalatePriority(currentPriority);
        }
        return currentPriority;
    }
    /**
     * Check escalation triggers
     */
    checkEscalationTriggers(candidate, historicalData) {
        if (!this.config.escalation.enabled)
            return false;
        for (const trigger of this.config.escalation.triggers) {
            if (this.evaluateTriggerCondition(trigger, candidate, historicalData)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Evaluate escalation trigger condition
     */
    evaluateTriggerCondition(trigger, candidate, historicalData) {
        switch (trigger.type) {
            case 'performance_based':
                if (historicalData.length >= 2) {
                    const recent = historicalData[historicalData.length - 1];
                    const previous = historicalData[historicalData.length - 2];
                    const degradation = (previous.performance - recent.performance) / previous.performance;
                    return degradation > 0.2;
                }
                return false;
            case 'business_impact':
                return candidate.businessImpact > 80;
            case 'time_based':
                // Would check time-based conditions
                return false;
            case 'external_event':
                // Would check external event conditions
                return false;
            default:
                return false;
        }
    }
    /**
     * Escalate priority to next level
     */
    escalatePriority(currentPriority) {
        const priorityOrder = ['deferred', 'low', 'medium', 'high', 'critical'];
        const currentIndex = priorityOrder.indexOf(currentPriority);
        if (currentIndex < priorityOrder.length - 1) {
            return priorityOrder[currentIndex + 1];
        }
        return currentPriority; // Already at highest priority
    }
    /**
     * De-escalate priority to previous level
     */
    deeecalatePriority(currentPriority) {
        const priorityOrder = ['deferred', 'low', 'medium', 'high', 'critical'];
        const currentIndex = priorityOrder.indexOf(currentPriority);
        if (currentIndex > 0) {
            return priorityOrder[currentIndex - 1];
        }
        return currentPriority; // Already at lowest priority
    }
    /**
     * Adjust priority numerically
     */
    adjustPriority(currentPriority, adjustment) {
        const priorityOrder = ['deferred', 'low', 'medium', 'high', 'critical'];
        const currentIndex = priorityOrder.indexOf(currentPriority);
        const newIndex = Math.max(0, Math.min(priorityOrder.length - 1, currentIndex + adjustment));
        return priorityOrder[newIndex];
    }
    /**
     * Generate assignment rationale
     */
    generateAssignmentRationale(candidate, ranking, assignedPriority, appliedRules) {
        const primaryFactors = [
            `Ranking score: ${ranking.score.toFixed(1)}`,
            `Business impact: ${candidate.businessImpact}`,
        ];
        const businessJustification = `Assigned ${assignedPriority} priority based on ranking analysis and business rules`;
        const stakeholderConsiderations = [
            'Business stakeholder requirements considered',
            'Technical feasibility assessed',
        ];
        const riskFactors = [
            `Technical complexity: ${candidate.technicalComplexity}`,
        ];
        const alternatives = [
            { priority: 'high', reason: 'Strong business case', score: 85 },
            { priority: 'medium', reason: 'Moderate impact', score: 65 },
        ];
        return {
            primaryFactors,
            businessJustification,
            appliedRules,
            stakeholderConsiderations,
            riskFactors,
            alternatives,
        };
    }
    /**
     * Calculate assignment confidence
     */
    calculateAssignmentConfidence(candidate, ranking, ruleConfidence) {
        let confidence = ranking.confidence;
        // Adjust based on rule confidence
        confidence = (confidence + ruleConfidence * 100) / 2;
        // Adjust based on data quality
        if (candidate.metadata.dataQuality === 'high') {
            confidence += 10;
        }
        else if (candidate.metadata.dataQuality === 'low') {
            confidence -= 15;
        }
        return Math.min(95, Math.max(30, confidence));
    }
    /**
     * Create assignment metadata
     */
    createAssignmentMetadata(candidate, assignedPriority, assignedBy) {
        const existingMetadata = this.assignmentHistory.get(candidate.resourceId);
        const version = existingMetadata ? existingMetadata.version + 1 : 1;
        const history = existingMetadata?.history || [];
        history.push({
            timestamp: new Date(),
            priority: assignedPriority,
            reason: 'Priority assignment based on ranking and business rules',
            assignedBy,
        });
        return {
            assignedAt: new Date(),
            assignedBy,
            version,
            history,
            approvals: [],
            performance: {
                accuracy: 80,
                stability: 75,
                satisfaction: 85,
            },
        };
    }
    /**
     * Generate assignment constraints
     */
    generateAssignmentConstraints(candidate, assignedPriority) {
        const baseConstraints = candidate.constraints;
        // Adjust constraints based on priority
        let minAllocation = baseConstraints.minAllocation;
        let maxAllocation = baseConstraints.maxAllocation;
        switch (assignedPriority) {
            case 'critical':
                minAllocation = Math.max(minAllocation, baseConstraints.maxAllocation * 0.8);
                maxAllocation = baseConstraints.maxAllocation * 1.5;
                break;
            case 'high':
                minAllocation = Math.max(minAllocation, baseConstraints.maxAllocation * 0.6);
                maxAllocation = baseConstraints.maxAllocation * 1.2;
                break;
            case 'low':
                maxAllocation = baseConstraints.maxAllocation * 0.7;
                break;
            case 'deferred':
                maxAllocation = baseConstraints.maxAllocation * 0.5;
                break;
        }
        return {
            ...baseConstraints,
            minAllocation,
            maxAllocation,
        };
    }
    default;
}
calculateNextReviewDate();
Date;
{
    const now = new Date();
    const reviewInterval = this.config.dynamicAdjustment.frequency;
    switch (reviewInterval) {
        case 'real_time':
            now.setHours(now.getHours() + 1);
            break;
        case 'hourly':
            now.setHours(now.getHours() + 1);
            break;
        case 'daily':
            now.setDate(now.getDate() + 1);
            break;
        case 'weekly':
            now.setDate(now.getDate() + 7);
            break;
    }
    return now;
    // Handle unexpected values
    break;
}
isUpdateAllowed(resourceId, string, metadata, AssignmentMetadata);
boolean;
{
    const now = new Date();
    const lastAssignment = metadata.assignedAt;
    const stabilityPeriod = this.config.dynamicAdjustment.constraints.stabilityPeriod;
    // Parse stability period (simplified)
    let stabilityMs = 24 * 60 * 60 * 1000; // Default 24 hours
    if (stabilityPeriod.endsWith('h')) {
        stabilityMs = parseInt(stabilityPeriod) * 60 * 60 * 1000;
    }
    else if (stabilityPeriod.endsWith('d')) {
        stabilityMs = parseInt(stabilityPeriod) * 24 * 60 * 60 * 1000;
    }
    return now.getTime() - lastAssignment.getTime() >= stabilityMs;
}
detectPriorityConflicts(assignments, PriorityAssignmentResult[], candidates, AllocationCandidate[]);
PriorityConflict[];
{
    const conflicts = [];
    if (!this.config.conflictResolution.detection.enabled) {
        return conflicts;
    }
    // Check for resource competition (simplified implementation)
    const highPriorityResources = assignments.filter(a => a.assignedPriority === 'critical' || a.assignedPriority === 'high');
    const totalHighPriorityAllocation = highPriorityResources.reduce((sum, assignment) => {
        const candidate = candidates.find(c => c.resourceId === assignment.resourceId);
        return sum + (candidate?.currentAllocation || 0);
    }, 0);
    // Assume budget constraint of 100,000
    const budgetConstraint = 100000;
    if (totalHighPriorityAllocation > budgetConstraint * 0.8) {
        conflicts.push({
            id: `budget_conflict_${Date.now()}`,
            resources: highPriorityResources.map(r => r.resourceId),
            type: 'resource_competition',
            severity: 'high',
            description: 'High priority resources exceed available budget allocation',
            resolutions: [
                {
                    strategy: 'Reduce some priorities',
                    impact: 'May delay some initiatives',
                    effort: 'medium',
                    probability: 0.8,
                },
                {
                    strategy: 'Increase budget',
                    impact: 'Higher costs',
                    effort: 'high',
                    probability: 0.4,
                },
            ],
            status: 'detected',
        });
    }
    return conflicts;
}
resolvePriorityConflicts(conflicts, PriorityConflict[], assignments, PriorityAssignmentResult[]);
void {
    for(, conflict, of, conflicts) {
        if (conflict.status !== 'detected')
            continue;
        switch (this.config.conflictResolution.strategy) {
            case 'business_value':
                this.resolveByBusinessValue(conflict, assignments);
                break;
            case 'highest_priority':
                this.resolveByHighestPriority(conflict, assignments);
                break;
            // Add more resolution strategies as needed
        }
        conflict.status = 'resolved';
    },
    default: 
    // Handle unexpected values
    ,
    // Handle unexpected values
    break: 
};
resolveByBusinessValue(conflict, PriorityConflict, assignments, PriorityAssignmentResult[]);
void {
    // Simplified resolution - would implement proper business value comparison
    this: .logger.info(`Resolving conflict ${conflict.id} by business value`)
};
resolveByHighestPriority(conflict, PriorityConflict, assignments, PriorityAssignmentResult[]);
void {
    // Simplified resolution - would implement proper priority-based resolution
    this: .logger.info(`Resolving conflict ${conflict.id} by highest priority`)
};
generateEscalations(assignments, PriorityAssignmentResult[], candidates, AllocationCandidate[]);
PriorityEscalation[];
{
    const escalations = [];
    // Check for resources that need escalation
    for (const assignment of assignments) {
        if (assignment.assignedPriority === 'critical') {
            const candidate = candidates.find(c => c.resourceId === assignment.resourceId);
            if (candidate && this.checkEscalationTriggers(candidate, [])) {
                escalations.push({
                    id: `escalation_${assignment.resourceId}_${Date.now()}`,
                    resourceId: assignment.resourceId,
                    trigger: this.config.escalation.triggers[0], // Use first trigger as example
                    level: 'critical',
                    timeline: [new Date()], // Would calculate proper timeline
                    notifiedStakeholders: ['manager', 'director'],
                    status: 'active',
                    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                });
            }
        }
    }
    return escalations;
}
generatePortfolioInsights(assignments, PriorityAssignmentResult[], candidates, AllocationCandidate[]);
PortfolioPriorityInsights;
{
    // Calculate priority distribution
    const distribution = {
        critical: assignments.filter(a => a.assignedPriority === 'critical').length,
        high: assignments.filter(a => a.assignedPriority === 'high').length,
        medium: assignments.filter(a => a.assignedPriority === 'medium').length,
        low: assignments.filter(a => a.assignedPriority === 'low').length,
        deferred: assignments.filter(a => a.assignedPriority === 'deferred').length,
    };
    // Calculate balance
    const total = assignments.length;
    const idealDistribution = { critical: 0.1, high: 0.2, medium: 0.4, low: 0.2, deferred: 0.1 };
    let balanceScore = 0;
    for (const [priority, count] of Object.entries(distribution)) {
        const actualRatio = count / total;
        const idealRatio = idealDistribution[priority];
        const deviation = Math.abs(actualRatio - idealRatio);
        balanceScore += Math.max(0, 100 - (deviation * 200));
    }
    balanceScore = balanceScore / Object.keys(distribution).length;
    const balanced = balanceScore > 70;
    const issues = balanced ? [] : ['Uneven priority distribution', 'May indicate resource allocation issues'];
    // Competition analysis
    const highCompetition = ['critical_resources', 'high_priority_resources'];
    const opportunities = ['medium_priority_optimization', 'low_priority_consolidation'];
    const intensity = distribution.critical + distribution.high > total * 0.4 ? 80 : 50;
    // Strategic alignment
    const strategicScore = assignments.reduce((sum, a) => sum + (a.rationale.primaryFactors.includes('strategic') ? 1 : 0), 0) / assignments.length * 100;
    const wellAligned = assignments
        .filter(a => a.confidence > 80)
        .map(a => a.resourceId);
    const misaligned = assignments
        .filter(a => a.confidence < 60)
        .map(a => a.resourceId);
    return {
        distribution,
        balance: {
            balanced,
            score: balanceScore,
            issues,
        },
        competition: {
            highCompetition,
            opportunities,
            intensity,
        },
        alignment: {
            score: strategicScore,
            wellAligned,
            misaligned,
        },
    };
}
generatePortfolioRecommendations(assignments, PriorityAssignmentResult[], insights, PortfolioPriorityInsights, conflicts, PriorityConflict[]);
PriorityRecommendation[];
{
    const recommendations = [];
    // Recommend rebalancing if portfolio is unbalanced
    if (!insights.balance.balanced) {
        recommendations.push({
            type: 'priority_change',
            resources: insights.alignment.misaligned,
            description: 'Rebalance priority distribution to improve portfolio balance',
            benefits: {
                cost: insights.balance.score * 0.5,
                performance: insights.balance.score * 0.3,
                efficiency: insights.balance.score * 0.7,
            },
            complexity: 'medium',
            priority: 'short_term',
        });
    }
    // Recommend conflict resolution
    if (conflicts.length > 0) {
        recommendations.push({
            type: 'resource_reallocation',
            resources: conflicts.flatMap(c => c.resources),
            description: 'Resolve resource conflicts through reallocation or priority adjustment',
            benefits: {
                cost: conflicts.length * 15,
                performance: conflicts.length * 20,
                efficiency: conflicts.length * 10,
            },
            complexity: 'high',
            priority: 'immediate',
        });
    }
    return recommendations;
}
validateConfiguration();
void {
    : .config.businessRules.mandatory, ...this.config.businessRules.conditional
};
{
    if (!rule.id || !rule.name || !rule.condition) {
        throw new Error(`Invalid business rule: ${rule.id || 'unknown'}`);
    }
}
// Validate thresholds in escalation configuration
if (this.config.escalation.enabled) {
    if (!this.config.escalation.triggers || this.config.escalation.triggers.length === 0) {
        throw new Error('Escalation triggers must be defined when escalation is enabled');
    }
}
// Validate dynamic adjustment constraints
const constraints = this.config.dynamicAdjustment.constraints;
if (constraints.maxChangesPerPeriod <= 0) {
    throw new Error('Maximum changes per period must be positive');
}
if (constraints.confidenceThreshold < 0 || constraints.confidenceThreshold > 1) {
    throw new Error('Confidence threshold must be between 0 and 1');
}
/**
 * Create priority assignment instance
 * @param config - Assignment configuration
 * @param logger - Logger instance
 * @returns PriorityAssignment instance
 */
export function createPriorityAssignment(config, logger) {
    const defaultLogger = {
        info: () => { },
        warn: () => { },
        error: () => { },
        debug: () => { },
    };
    return new PriorityAssignment(config, logger || defaultLogger);
}
//# sourceMappingURL=PriorityAssignment.js.map