/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
/**
 * Types of conflicts that can occur in the system
 */
export var ConflictType;
(function (ConflictType) {
    ConflictType["RESOURCE_CONTENTION"] = "resource_contention";
    ConflictType["PRIORITY_CONFLICT"] = "priority_conflict";
    ConflictType["DEPENDENCY_DEADLOCK"] = "dependency_deadlock";
    ConflictType["POLICY_VIOLATION"] = "policy_violation";
    ConflictType["TEMPORAL_CONFLICT"] = "temporal_conflict";
    ConflictType["BUDGET_CONSTRAINT"] = "budget_constraint";
    ConflictType["CAPACITY_LIMIT"] = "capacity_limit";
    ConflictType["AUTHORIZATION_CONFLICT"] = "authorization_conflict";
})(ConflictType || (ConflictType = {}));
/**
 * Severity levels for conflicts
 */
export var ConflictSeverity;
(function (ConflictSeverity) {
    ConflictSeverity[ConflictSeverity["LOW"] = 1] = "LOW";
    ConflictSeverity[ConflictSeverity["MEDIUM"] = 2] = "MEDIUM";
    ConflictSeverity[ConflictSeverity["HIGH"] = 3] = "HIGH";
    ConflictSeverity[ConflictSeverity["CRITICAL"] = 4] = "CRITICAL";
    ConflictSeverity[ConflictSeverity["BLOCKING"] = 5] = "BLOCKING";
})(ConflictSeverity || (ConflictSeverity = {}));
/**
 * Conflict resolution strategies
 */
export var ResolutionStrategy;
(function (ResolutionStrategy) {
    ResolutionStrategy["PRIORITY_BASED"] = "priority_based";
    ResolutionStrategy["ROUND_ROBIN"] = "round_robin";
    ResolutionStrategy["WEIGHTED_FAIR"] = "weighted_fair";
    ResolutionStrategy["FIRST_COME_FIRST_SERVED"] = "first_come_first_served";
    ResolutionStrategy["DEADLINE_EARLIEST"] = "deadline_earliest";
    ResolutionStrategy["COST_OPTIMAL"] = "cost_optimal";
    ResolutionStrategy["PREEMPTION"] = "preemption";
    ResolutionStrategy["NEGOTIATION"] = "negotiation";
    ResolutionStrategy["ESCALATION"] = "escalation";
})(ResolutionStrategy || (ResolutionStrategy = {}));
/**
 * Advanced conflict resolver that handles competing interests
 * and finds optimal resolutions using various strategies
 */
export class ConflictResolver extends EventEmitter {
    config;
    activeConflicts = new Map();
    resolutionHistory = new Map();
    negotiationSessions = new Map();
    maxHistorySize = 1000;
    constructor(config) {
        super();
        this.config = config;
    }
    /**
     * Detect and register a new conflict
     */
    async detectConflict(type, participants, context, constraints = []) {
        const conflict = {
            id: this.generateConflictId(),
            type,
            severity: this.calculateConflictSeverity(type, participants, constraints),
            timestamp: Date.now(),
            description: this.generateConflictDescription(type, participants),
            participants,
            context,
            constraints,
            status: 'open',
            metadata: {
                domain: this.inferDomain(participants),
                tags: this.generateTags(type, participants),
                relatedDecisions: [],
            },
        };
        this.activeConflicts.set(conflict.id, conflict);
        this.emit('conflict-detected', { conflict });
        // Start resolution process if severity is high enough
        if (conflict.severity >= ConflictSeverity.MEDIUM) {
            setImmediate(() => {
                this.resolveConflict(conflict.id).catch((error) => {
                    this.emit('resolution-error', { conflictId: conflict.id, error });
                });
            });
        }
        return conflict;
    }
    /**
     * Resolve a conflict using the best available strategy
     */
    async resolveConflict(conflictId) {
        const conflict = this.activeConflicts.get(conflictId);
        if (!conflict) {
            throw new Error(`Conflict ${conflictId} not found`);
        }
        if (conflict.status !== 'open') {
            throw new Error(`Conflict ${conflictId} is not in open state: ${conflict.status}`);
        }
        conflict.status = 'resolving';
        const startTime = Date.now();
        try {
            // Select optimal resolution strategy
            const strategy = await this.selectResolutionStrategy(conflict);
            this.emit('resolution-started', { conflictId, strategy });
            // Attempt resolution using selected strategy
            let resolution = await this.applyResolutionStrategy(conflict, strategy);
            // If initial strategy fails or produces poor results, try alternatives
            if (resolution.metrics.satisfactionScore <
                this.config.minSatisfactionScore ||
                resolution.metrics.fairnessScore < this.config.minFairnessScore) {
                const alternativeStrategy = await this.selectAlternativeStrategy(conflict, strategy);
                if (alternativeStrategy !== strategy) {
                    const alternativeResolution = await this.applyResolutionStrategy(conflict, alternativeStrategy);
                    if (this.compareResolutions(alternativeResolution, resolution) > 0) {
                        resolution = alternativeResolution;
                    }
                }
            }
            // Apply the resolution
            await this.applyResolution(conflict, resolution);
            conflict.resolution = resolution;
            conflict.status = 'resolved';
            this.resolutionHistory.set(resolution.id, resolution);
            this.trimHistory();
            this.emit('conflict-resolved', { conflict, resolution });
            return resolution;
        }
        catch (error) {
            // Handle resolution failure
            conflict.status = 'escalated';
            this.emit('resolution-failed', { conflictId, error });
            // Escalate if appropriate
            if (conflict.severity >= this.config.escalationThreshold) {
                await this.escalateConflict(conflict);
            }
            throw error;
        }
        finally {
            const duration = Date.now() - startTime;
            this.emit('resolution-timing', { conflictId, duration });
        }
    }
    /**
     * Get current active conflicts
     */
    getActiveConflicts() {
        return Array.from(this.activeConflicts.values());
    }
    /**
     * Get conflict resolution history
     */
    getResolutionHistory(limit) {
        const resolutions = Array.from(this.resolutionHistory.values());
        return limit ? resolutions.slice(-limit) : resolutions;
    }
    /**
     * Update configuration
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
        this.emit('config-updated', { config: this.config });
    }
    /**
     * Get conflict resolution statistics
     */
    getStatistics() {
        const totalConflicts = this.activeConflicts.size + this.resolutionHistory.size;
        const resolutions = Array.from(this.resolutionHistory.values());
        const strategyUsage = {
            [ResolutionStrategy.PRIORITY_BASED]: 0,
            [ResolutionStrategy.ROUND_ROBIN]: 0,
            [ResolutionStrategy.WEIGHTED_FAIR]: 0,
            [ResolutionStrategy.FIRST_COME_FIRST_SERVED]: 0,
            [ResolutionStrategy.DEADLINE_EARLIEST]: 0,
            [ResolutionStrategy.COST_OPTIMAL]: 0,
            [ResolutionStrategy.PREEMPTION]: 0,
            [ResolutionStrategy.NEGOTIATION]: 0,
            [ResolutionStrategy.ESCALATION]: 0,
        };
        const severityDistribution = {
            [ConflictSeverity.LOW]: 0,
            [ConflictSeverity.MEDIUM]: 0,
            [ConflictSeverity.HIGH]: 0,
            [ConflictSeverity.CRITICAL]: 0,
            [ConflictSeverity.BLOCKING]: 0,
        };
        const _totalResolutionTime = 0;
        let totalFairness = 0;
        let totalEfficiency = 0;
        let totalSatisfaction = 0;
        let totalStability = 0;
        for (const resolution of resolutions) {
            strategyUsage[resolution.strategy] =
                (strategyUsage[resolution.strategy] || 0) + 1;
            totalFairness += resolution.metrics.fairnessScore;
            totalEfficiency += resolution.metrics.efficiencyScore;
            totalSatisfaction += resolution.metrics.satisfactionScore;
            totalStability += resolution.metrics.stabilityScore;
        }
        // Calculate severity distribution from active conflicts
        for (const conflict of this.activeConflicts.values()) {
            severityDistribution[conflict.severity] =
                (severityDistribution[conflict.severity] || 0) + 1;
        }
        const resolutionCount = resolutions.length;
        return {
            totalConflicts,
            activeConflicts: this.activeConflicts.size,
            resolutionRate: totalConflicts > 0 ? resolutionCount / totalConflicts : 0,
            averageResolutionTime: 0, // Would need to track timing data
            strategyUsage,
            severityDistribution,
            averageMetrics: {
                fairness: resolutionCount > 0 ? totalFairness / resolutionCount : 0,
                efficiency: resolutionCount > 0 ? totalEfficiency / resolutionCount : 0,
                satisfaction: resolutionCount > 0 ? totalSatisfaction / resolutionCount : 0,
                stability: resolutionCount > 0 ? totalStability / resolutionCount : 0,
            },
        };
    }
    async selectResolutionStrategy(conflict) {
        // Use multi-criteria decision analysis to select strategy
        const strategies = Object.values(ResolutionStrategy);
        const scores = {
            [ResolutionStrategy.PRIORITY_BASED]: 0,
            [ResolutionStrategy.ROUND_ROBIN]: 0,
            [ResolutionStrategy.WEIGHTED_FAIR]: 0,
            [ResolutionStrategy.FIRST_COME_FIRST_SERVED]: 0,
            [ResolutionStrategy.DEADLINE_EARLIEST]: 0,
            [ResolutionStrategy.COST_OPTIMAL]: 0,
            [ResolutionStrategy.PREEMPTION]: 0,
            [ResolutionStrategy.NEGOTIATION]: 0,
            [ResolutionStrategy.ESCALATION]: 0,
        };
        for (const strategy of strategies) {
            let score = this.config.strategyWeights[strategy] || 1.0;
            // Adjust score based on conflict characteristics
            switch (strategy) {
                case ResolutionStrategy.PRIORITY_BASED:
                    if (conflict.participants.some((p) => p.priority >= DecisionPriority.HIGH)) {
                        score *= 1.5;
                    }
                    break;
                case ResolutionStrategy.DEADLINE_EARLIEST:
                    if (conflict.type === ConflictType.TEMPORAL_CONFLICT) {
                        score *= 2.0;
                    }
                    break;
                case ResolutionStrategy.COST_OPTIMAL:
                    if (conflict.type === ConflictType.BUDGET_CONSTRAINT) {
                        score *= 2.0;
                    }
                    break;
                case ResolutionStrategy.PREEMPTION:
                    if (conflict.severity >= ConflictSeverity.HIGH) {
                        score *= 1.8;
                    }
                    break;
                case ResolutionStrategy.NEGOTIATION:
                    if (this.config.allowNegotiation &&
                        conflict.participants.every((p) => p.negotiationCapability !== 'none')) {
                        score *= 1.3;
                    }
                    else {
                        score *= 0.1;
                    }
                    break;
                default:
                    // Use base weight for other strategies
                    break;
            }
            scores[strategy] = score;
        }
        // Select highest scoring strategy
        let bestStrategy = ResolutionStrategy.PRIORITY_BASED;
        let bestScore = 0;
        for (const [strategy, score] of Object.entries(scores)) {
            if (score > bestScore) {
                bestScore = score;
                bestStrategy = strategy;
            }
        }
        return bestStrategy;
    }
    async selectAlternativeStrategy(conflict, excludeStrategy) {
        const alternatives = Object.values(ResolutionStrategy).filter((s) => s !== excludeStrategy);
        // Simple fallback: use weighted fair if available, otherwise round robin
        if (alternatives.includes(ResolutionStrategy.WEIGHTED_FAIR)) {
            return ResolutionStrategy.WEIGHTED_FAIR;
        }
        return alternatives[0] || ResolutionStrategy.ROUND_ROBIN;
    }
    async applyResolutionStrategy(conflict, strategy) {
        switch (strategy) {
            case ResolutionStrategy.PRIORITY_BASED:
                return this.resolvePriorityBased(conflict);
            case ResolutionStrategy.ROUND_ROBIN:
                return this.resolveRoundRobin(conflict);
            case ResolutionStrategy.WEIGHTED_FAIR:
                return this.resolveWeightedFair(conflict);
            case ResolutionStrategy.FIRST_COME_FIRST_SERVED:
                return this.resolveFirstComeFirstServed(conflict);
            case ResolutionStrategy.DEADLINE_EARLIEST:
                return this.resolveDeadlineEarliest(conflict);
            case ResolutionStrategy.COST_OPTIMAL:
                return this.resolveCostOptimal(conflict);
            case ResolutionStrategy.PREEMPTION:
                return this.resolvePreemption(conflict);
            case ResolutionStrategy.NEGOTIATION:
                return this.resolveNegotiation(conflict);
            case ResolutionStrategy.ESCALATION:
                return this.resolveEscalation(conflict);
            default:
                throw new Error(`Unknown resolution strategy: ${strategy}`);
        }
    }
    async resolvePriorityBased(conflict) {
        // Sort participants by priority
        const sortedParticipants = [...conflict.participants].sort((a, b) => b.priority - a.priority);
        const allocations = sortedParticipants.map((participant, index) => ({
            participantId: participant.id,
            awarded: index === 0 ? participant.requirements : {},
            denied: index === 0 ? {} : participant.requirements,
        }));
        return this.createResolution(conflict, ResolutionStrategy.PRIORITY_BASED, 'winner_takes_all', allocations);
    }
    async resolveRoundRobin(conflict) {
        // Distribute resources evenly among participants
        const allocations = conflict.participants.map((participant) => ({
            participantId: participant.id,
            awarded: this.distributeEvenly(participant.requirements, conflict.participants.length),
            denied: {},
        }));
        return this.createResolution(conflict, ResolutionStrategy.ROUND_ROBIN, 'compromise', allocations);
    }
    async resolveWeightedFair(conflict) {
        // Weight distribution based on priority and business value
        const weights = conflict.participants.map((p) => p.priority / DecisionPriority.URGENT);
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        const allocations = conflict.participants.map((participant, index) => {
            const weight = weights[index] / totalWeight;
            return {
                participantId: participant.id,
                awarded: this.distributeByWeight(participant.requirements, weight),
                denied: {},
            };
        });
        return this.createResolution(conflict, ResolutionStrategy.WEIGHTED_FAIR, 'compromise', allocations);
    }
    async resolveFirstComeFirstServed(conflict) {
        // Award based on timestamp (assuming participants have timestamps)
        const sortedParticipants = [...conflict.participants].sort((a, b) => {
            const timeA = a.constraints.timestamp || 0;
            const timeB = b.constraints.timestamp || 0;
            return timeA - timeB;
        });
        const allocations = sortedParticipants.map((participant, index) => ({
            participantId: participant.id,
            awarded: index === 0 ? participant.requirements : {},
            denied: index === 0 ? {} : participant.requirements,
        }));
        return this.createResolution(conflict, ResolutionStrategy.FIRST_COME_FIRST_SERVED, 'winner_takes_all', allocations);
    }
    async resolveDeadlineEarliest(conflict) {
        // Award based on earliest deadline
        const sortedParticipants = [...conflict.participants].sort((a, b) => {
            const deadlineA = a.constraints.deadline || Infinity;
            const deadlineB = b.constraints.deadline || Infinity;
            return deadlineA - deadlineB;
        });
        const allocations = sortedParticipants.map((participant, index) => ({
            participantId: participant.id,
            awarded: index === 0 ? participant.requirements : {},
            denied: index === 0 ? {} : participant.requirements,
        }));
        return this.createResolution(conflict, ResolutionStrategy.DEADLINE_EARLIEST, 'winner_takes_all', allocations);
    }
    async resolveCostOptimal(conflict) {
        // Award based on cost efficiency
        const costEfficiency = conflict.participants.map((p) => {
            const cost = p.constraints.cost || 1;
            const value = p.priority / DecisionPriority.URGENT;
            return { participant: p, efficiency: value / cost };
        });
        costEfficiency.sort((a, b) => b.efficiency - a.efficiency);
        const allocations = costEfficiency.map((item, index) => ({
            participantId: item.participant.id,
            awarded: index === 0 ? item.participant.requirements : {},
            denied: index === 0 ? {} : item.participant.requirements,
        }));
        return this.createResolution(conflict, ResolutionStrategy.COST_OPTIMAL, 'winner_takes_all', allocations);
    }
    async resolvePreemption(conflict) {
        // Preempt lower priority participants for higher priority ones
        const highestPriority = Math.max(...conflict.participants.map((p) => p.priority));
        const allocations = conflict.participants.map((participant) => ({
            participantId: participant.id,
            awarded: participant.priority === highestPriority
                ? participant.requirements
                : {},
            denied: participant.priority === highestPriority
                ? {}
                : participant.requirements,
        }));
        return this.createResolution(conflict, ResolutionStrategy.PREEMPTION, 'winner_takes_all', allocations);
    }
    async resolveNegotiation(conflict) {
        if (!this.config.allowNegotiation) {
            throw new Error('Negotiation not allowed by configuration');
        }
        // Start a negotiation session
        const sessionId = this.startNegotiation(conflict);
        const session = this.negotiationSessions.get(sessionId);
        if (!session) {
            throw new Error('Failed to start negotiation session');
        }
        // Run negotiation rounds
        const result = await this.runNegotiation(session);
        return this.createResolution(conflict, ResolutionStrategy.NEGOTIATION, result.outcome, result.allocations);
    }
    async resolveEscalation(conflict) {
        // Mark for escalation - typically would involve human intervention
        const allocations = conflict.participants.map((participant) => ({
            participantId: participant.id,
            awarded: {},
            denied: participant.requirements,
            alternatives: { escalated: true },
        }));
        return this.createResolution(conflict, ResolutionStrategy.ESCALATION, 'deferred', allocations);
    }
    createResolution(conflict, strategy, outcome, allocations) {
        const metrics = this.calculateResolutionMetrics(conflict, allocations);
        return {
            id: this.generateResolutionId(),
            conflictId: conflict.id,
            strategy,
            timestamp: Date.now(),
            outcome,
            allocations,
            metrics,
            reasoning: this.generateResolutionReasoning(conflict, strategy, outcome),
            tradeoffs: this.calculateTradeoffs(conflict, allocations),
            followUpActions: this.generateFollowUpActions(conflict, allocations),
        };
    }
    calculateResolutionMetrics(conflict, allocations) {
        // Calculate fairness using Jain's fairness index
        const satisfactions = allocations.map((alloc) => {
            const participant = conflict.participants.find((p) => p.id === alloc.participantId);
            if (!participant)
                return 0;
            const awardedCount = Object.keys(alloc.awarded).length;
            const totalCount = Object.keys(participant.requirements).length;
            return totalCount > 0 ? awardedCount / totalCount : 0;
        });
        const sum = satisfactions.reduce((a, b) => a + b, 0);
        const sumSquares = satisfactions.reduce((a, b) => a + b * b, 0);
        const fairnessScore = satisfactions.length > 0
            ? (sum * sum) / (satisfactions.length * sumSquares)
            : 1.0;
        // Calculate efficiency (resource utilization)
        const totalAwarded = allocations.reduce((sum, alloc) => sum + Object.keys(alloc.awarded).length, 0);
        const totalRequested = conflict.participants.reduce((sum, p) => sum + Object.keys(p.requirements).length, 0);
        const efficiencyScore = totalRequested > 0 ? totalAwarded / totalRequested : 0;
        // Calculate average satisfaction
        const satisfactionScore = satisfactions.reduce((a, b) => a + b, 0) / satisfactions.length || 0;
        // Calculate stability (rough estimate based on fairness and satisfaction)
        const stabilityScore = (fairnessScore + satisfactionScore) / 2;
        return {
            fairnessScore: Math.min(1, Math.max(0, fairnessScore)),
            efficiencyScore: Math.min(1, Math.max(0, efficiencyScore)),
            satisfactionScore: Math.min(1, Math.max(0, satisfactionScore)),
            stabilityScore: Math.min(1, Math.max(0, stabilityScore)),
        };
    }
    calculateConflictSeverity(type, participants, constraints) {
        let severity = ConflictSeverity.LOW;
        // Base severity from conflict type
        const typeSeverity = {
            [ConflictType.RESOURCE_CONTENTION]: ConflictSeverity.MEDIUM,
            [ConflictType.PRIORITY_CONFLICT]: ConflictSeverity.MEDIUM,
            [ConflictType.DEPENDENCY_DEADLOCK]: ConflictSeverity.HIGH,
            [ConflictType.POLICY_VIOLATION]: ConflictSeverity.HIGH,
            [ConflictType.TEMPORAL_CONFLICT]: ConflictSeverity.MEDIUM,
            [ConflictType.BUDGET_CONSTRAINT]: ConflictSeverity.MEDIUM,
            [ConflictType.CAPACITY_LIMIT]: ConflictSeverity.HIGH,
            [ConflictType.AUTHORIZATION_CONFLICT]: ConflictSeverity.CRITICAL,
        };
        severity = typeSeverity[type] || ConflictSeverity.LOW;
        // Increase severity based on participant priorities
        const maxPriority = Math.max(...participants.map((p) => p.priority));
        if (maxPriority >= DecisionPriority.CRITICAL) {
            severity = Math.max(severity, ConflictSeverity.CRITICAL);
        }
        else if (maxPriority >= DecisionPriority.HIGH) {
            severity = Math.max(severity, ConflictSeverity.HIGH);
        }
        // Increase severity based on hard constraints
        const hardConstraints = constraints.filter((c) => c.type === 'hard');
        if (hardConstraints.length > 0) {
            severity = Math.max(severity, ConflictSeverity.MEDIUM);
        }
        return severity;
    }
    generateConflictDescription(type, participants) {
        const participantTypes = participants.map((p) => p.type).join(', ');
        const participantCount = participants.length;
        switch (type) {
            case ConflictType.RESOURCE_CONTENTION:
                return `${participantCount} ${participantTypes} competing for limited resources`;
            case ConflictType.PRIORITY_CONFLICT:
                return `Priority conflict between ${participantCount} ${participantTypes}`;
            case ConflictType.DEPENDENCY_DEADLOCK:
                return `Circular dependency detected between ${participantCount} ${participantTypes}`;
            default:
                return `Conflict of type ${type} between ${participantCount} participants`;
        }
    }
    generateConflictId() {
        return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateResolutionId() {
        return `resolution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    inferDomain(participants) {
        // Infer domain from participant types
        if (participants.some((p) => p.type === 'task'))
            return 'task_management';
        if (participants.some((p) => p.type === 'agent'))
            return 'agent_coordination';
        if (participants.some((p) => p.type === 'user'))
            return 'user_interaction';
        return 'system';
    }
    generateTags(type, participants) {
        const tags = [type];
        tags.push(...participants.map((p) => p.type));
        return [...new Set(tags)]; // Remove duplicates
    }
    generateResolutionReasoning(conflict, strategy, outcome) {
        return `Applied ${strategy} strategy to resolve ${conflict.type} conflict, resulting in ${outcome}`;
    }
    calculateTradeoffs(conflict, allocations) {
        return allocations.map((alloc) => {
            const participant = conflict.participants.find((p) => p.id === alloc.participantId);
            const awardedCount = Object.keys(alloc.awarded).length;
            const deniedCount = Object.keys(alloc.denied).length;
            const totalCount = participant
                ? Object.keys(participant.requirements).length
                : 0;
            return {
                participant: alloc.participantId,
                gave: deniedCount > 0 ? `${deniedCount} requirements` : 'nothing',
                received: awardedCount > 0 ? `${awardedCount} requirements` : 'nothing',
                satisfaction: totalCount > 0 ? awardedCount / totalCount : 0,
            };
        });
    }
    generateFollowUpActions(conflict, allocations) {
        const actions = [];
        // Add monitoring action
        actions.push({
            action: 'Monitor resolution stability',
            responsible: 'system',
            deadline: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
            priority: DecisionPriority.LOW,
        });
        // Add feedback collection
        const deniedParticipants = allocations.filter((alloc) => Object.keys(alloc.denied).length > 0);
        if (deniedParticipants.length > 0) {
            actions.push({
                action: 'Collect satisfaction feedback from affected participants',
                responsible: 'system',
                deadline: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
                priority: DecisionPriority.NORMAL,
            });
        }
        return actions;
    }
    distributeEvenly(requirements, participantCount) {
        const result = {};
        for (const [key, value] of Object.entries(requirements)) {
            if (typeof value === 'number') {
                result[key] = Math.floor(value / participantCount);
            }
            else {
                result[key] = value;
            }
        }
        return result;
    }
    distributeByWeight(requirements, weight) {
        const result = {};
        for (const [key, value] of Object.entries(requirements)) {
            if (typeof value === 'number') {
                result[key] = Math.floor(value * weight);
            }
            else {
                result[key] = value;
            }
        }
        return result;
    }
    compareResolutions(a, b) {
        // Simple scoring: weighted sum of metrics
        const scoreA = a.metrics.satisfactionScore * 0.4 +
            a.metrics.fairnessScore * 0.3 +
            a.metrics.efficiencyScore * 0.2 +
            a.metrics.stabilityScore * 0.1;
        const scoreB = b.metrics.satisfactionScore * 0.4 +
            b.metrics.fairnessScore * 0.3 +
            b.metrics.efficiencyScore * 0.2 +
            b.metrics.stabilityScore * 0.1;
        return scoreA - scoreB;
    }
    async applyResolution(conflict, resolution) {
        // Apply the resolution (implementation would depend on specific system)
        this.emit('resolution-applied', { conflict, resolution });
    }
    async escalateConflict(conflict) {
        this.emit('conflict-escalated', { conflict });
        // Implementation would trigger human intervention or higher-level resolution
    }
    startNegotiation(conflict) {
        // Simplified negotiation implementation
        const sessionId = `nego_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const session = {
            id: sessionId,
            conflictId: conflict.id,
            participants: conflict.participants.map((p) => p.id),
            maxRounds: this.config.maxNegotiationRounds,
            currentRound: 0,
            offers: [],
            status: 'active',
        };
        this.negotiationSessions.set(sessionId, session);
        return sessionId;
    }
    async runNegotiation(session) {
        // Simplified negotiation logic
        // In practice, this would involve multiple rounds of offers and counter-offers
        const allocations = session.participants.map((participantId) => ({
            participantId,
            awarded: { negotiated: true },
            denied: {},
        }));
        return {
            outcome: 'compromise',
            allocations,
        };
    }
    trimHistory() {
        if (this.resolutionHistory.size > this.maxHistorySize) {
            const entries = Array.from(this.resolutionHistory.entries()).sort(([, a], [, b]) => a.timestamp - b.timestamp);
            const toDelete = entries.slice(0, entries.length - this.maxHistorySize);
            for (const [id] of toDelete) {
                this.resolutionHistory.delete(id);
            }
        }
    }
}
/**
 * Default conflict resolver configurations
 */
export const ConflictResolverConfigs = {
    Balanced: {
        defaultStrategy: ResolutionStrategy.WEIGHTED_FAIR,
        allowNegotiation: true,
        maxNegotiationRounds: 3,
        escalationThreshold: ConflictSeverity.CRITICAL,
        maxResolutionTime: 30000,
        conflictTimeout: 300000,
        minFairnessScore: 0.6,
        minSatisfactionScore: 0.7,
        strategyWeights: {
            [ResolutionStrategy.PRIORITY_BASED]: 1.0,
            [ResolutionStrategy.ROUND_ROBIN]: 0.8,
            [ResolutionStrategy.WEIGHTED_FAIR]: 1.2,
            [ResolutionStrategy.FIRST_COME_FIRST_SERVED]: 0.6,
            [ResolutionStrategy.DEADLINE_EARLIEST]: 0.9,
            [ResolutionStrategy.COST_OPTIMAL]: 0.7,
            [ResolutionStrategy.PREEMPTION]: 0.5,
            [ResolutionStrategy.NEGOTIATION]: 1.1,
            [ResolutionStrategy.ESCALATION]: 0.3,
        },
        domainRules: [],
    },
    Aggressive: {
        defaultStrategy: ResolutionStrategy.PRIORITY_BASED,
        allowNegotiation: false,
        maxNegotiationRounds: 1,
        escalationThreshold: ConflictSeverity.HIGH,
        maxResolutionTime: 10000,
        conflictTimeout: 60000,
        minFairnessScore: 0.3,
        minSatisfactionScore: 0.5,
        strategyWeights: {
            [ResolutionStrategy.PRIORITY_BASED]: 2.0,
            [ResolutionStrategy.PREEMPTION]: 1.8,
            [ResolutionStrategy.DEADLINE_EARLIEST]: 1.5,
            [ResolutionStrategy.WEIGHTED_FAIR]: 0.5,
            [ResolutionStrategy.ROUND_ROBIN]: 0.3,
            [ResolutionStrategy.FIRST_COME_FIRST_SERVED]: 0.8,
            [ResolutionStrategy.COST_OPTIMAL]: 0.9,
            [ResolutionStrategy.NEGOTIATION]: 0.2,
            [ResolutionStrategy.ESCALATION]: 0.8,
        },
        domainRules: [],
    },
    Fair: {
        defaultStrategy: ResolutionStrategy.ROUND_ROBIN,
        allowNegotiation: true,
        maxNegotiationRounds: 5,
        escalationThreshold: ConflictSeverity.BLOCKING,
        maxResolutionTime: 60000,
        conflictTimeout: 600000,
        minFairnessScore: 0.8,
        minSatisfactionScore: 0.8,
        strategyWeights: {
            [ResolutionStrategy.ROUND_ROBIN]: 2.0,
            [ResolutionStrategy.WEIGHTED_FAIR]: 1.8,
            [ResolutionStrategy.NEGOTIATION]: 1.5,
            [ResolutionStrategy.PRIORITY_BASED]: 0.6,
            [ResolutionStrategy.FIRST_COME_FIRST_SERVED]: 1.2,
            [ResolutionStrategy.DEADLINE_EARLIEST]: 0.8,
            [ResolutionStrategy.COST_OPTIMAL]: 0.7,
            [ResolutionStrategy.PREEMPTION]: 0.2,
            [ResolutionStrategy.ESCALATION]: 0.5,
        },
        domainRules: [],
    },
};
//# sourceMappingURL=conflictResolver.js.map