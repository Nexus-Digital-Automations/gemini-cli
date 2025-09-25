/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import type {
  DecisionContext,
  Decision,
  DecisionType,
  DecisionPriority,
} from './types';

/**
 * Types of conflicts that can occur in the system
 */
export enum ConflictType {
  RESOURCE_CONTENTION = 'resource_contention',
  PRIORITY_CONFLICT = 'priority_conflict',
  DEPENDENCY_DEADLOCK = 'dependency_deadlock',
  POLICY_VIOLATION = 'policy_violation',
  TEMPORAL_CONFLICT = 'temporal_conflict',
  BUDGET_CONSTRAINT = 'budget_constraint',
  CAPACITY_LIMIT = 'capacity_limit',
  AUTHORIZATION_CONFLICT = 'authorization_conflict',
}

/**
 * Severity levels for conflicts
 */
export enum ConflictSeverity {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4,
  BLOCKING = 5,
}

/**
 * Conflict resolution strategies
 */
export enum ResolutionStrategy {
  PRIORITY_BASED = 'priority_based',
  ROUND_ROBIN = 'round_robin',
  WEIGHTED_FAIR = 'weighted_fair',
  FIRST_COME_FIRST_SERVED = 'first_come_first_served',
  DEADLINE_EARLIEST = 'deadline_earliest',
  COST_OPTIMAL = 'cost_optimal',
  PREEMPTION = 'preemption',
  NEGOTIATION = 'negotiation',
  ESCALATION = 'escalation',
}

/**
 * Represents a conflict between competing interests
 */
export interface Conflict {
  id: string;
  type: ConflictType;
  severity: ConflictSeverity;
  timestamp: number;
  description: string;

  // Conflicting parties
  participants: ConflictParticipant[];

  // Context and constraints
  context: DecisionContext;
  constraints: ConflictConstraint[];

  // Resolution state
  status: 'open' | 'resolving' | 'resolved' | 'escalated';
  resolution?: ConflictResolution;

  // Metadata
  metadata: {
    domain: string;
    tags: string[];
    relatedDecisions: string[];
    escalationPath?: string[];
  };
}

/**
 * A party involved in a conflict
 */
export interface ConflictParticipant {
  id: string;
  type: 'task' | 'agent' | 'user' | 'system' | 'process';
  priority: DecisionPriority;
  requirements: Record<string, unknown>;
  constraints: Record<string, unknown>;
  preferences?: {
    acceptableAlternatives: string[];
    minimumRequirements: Record<string, unknown>;
    tradeoffs: Array<{ give: string; get: string; ratio: number }>;
  };
  negotiationCapability: 'none' | 'limited' | 'full';
}

/**
 * Constraint that affects conflict resolution
 */
export interface ConflictConstraint {
  type: 'hard' | 'soft' | 'preference';
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'between';
  value: unknown;
  weight: number; // For soft constraints
  violationCost: number; // Cost of violating this constraint
}

/**
 * Resolution of a conflict
 */
export interface ConflictResolution {
  id: string;
  conflictId: string;
  strategy: ResolutionStrategy;
  timestamp: number;

  // Resolution details
  outcome:
    | 'all_satisfied'
    | 'partial_satisfaction'
    | 'winner_takes_all'
    | 'compromise'
    | 'deferred';
  allocations: Array<{
    participantId: string;
    awarded: Record<string, unknown>;
    denied: Record<string, unknown>;
    alternatives?: Record<string, unknown>;
  }>;

  // Quality metrics
  metrics: {
    fairnessScore: number; // 0-1, Jain's fairness index
    efficiencyScore: number; // 0-1, resource utilization
    satisfactionScore: number; // 0-1, participant satisfaction
    stabilityScore: number; // 0-1, likelihood of resolution lasting
  };

  // Explanation and reasoning
  reasoning: string;
  tradeoffs: Array<{
    participant: string;
    gave: string;
    received: string;
    satisfaction: number;
  }>;

  // Follow-up actions
  followUpActions: Array<{
    action: string;
    responsible: string;
    deadline: number;
    priority: DecisionPriority;
  }>;
}

/**
 * Configuration for conflict resolution behavior
 */
export interface ConflictResolverConfig {
  // Resolution preferences
  defaultStrategy: ResolutionStrategy;
  allowNegotiation: boolean;
  maxNegotiationRounds: number;
  escalationThreshold: ConflictSeverity;

  // Timing constraints
  maxResolutionTime: number; // milliseconds
  conflictTimeout: number; // milliseconds before auto-escalation

  // Quality thresholds
  minFairnessScore: number;
  minSatisfactionScore: number;

  // Strategy weights for multi-criteria decisions
  strategyWeights: Record<ResolutionStrategy, number>;

  // Domain-specific rules
  domainRules: Array<{
    domain: string;
    rules: Array<{
      condition: string;
      action: string;
      priority: number;
    }>;
  }>;
}

/**
 * Advanced conflict resolver that handles competing interests
 * and finds optimal resolutions using various strategies
 */
export class ConflictResolver extends EventEmitter {
  private config: ConflictResolverConfig;
  private activeConflicts: Map<string, Conflict> = new Map();
  private resolutionHistory: Map<string, ConflictResolution> = new Map();
  private negotiationSessions: Map<string, NegotiationSession> = new Map();
  private readonly maxHistorySize = 1000;

  constructor(config: ConflictResolverConfig) {
    super();
    this.config = config;
  }

  /**
   * Detect and register a new conflict
   */
  async detectConflict(
    type: ConflictType,
    participants: ConflictParticipant[],
    context: DecisionContext,
    constraints: ConflictConstraint[] = [],
  ): Promise<Conflict> {
    const conflict: Conflict = {
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
  async resolveConflict(conflictId: string): Promise<ConflictResolution> {
    const conflict = this.activeConflicts.get(conflictId);
    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found`);
    }

    if (conflict.status !== 'open') {
      throw new Error(
        `Conflict ${conflictId} is not in open state: ${conflict.status}`,
      );
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
      if (
        resolution.metrics.satisfactionScore <
          this.config.minSatisfactionScore ||
        resolution.metrics.fairnessScore < this.config.minFairnessScore
      ) {
        const alternativeStrategy = await this.selectAlternativeStrategy(
          conflict,
          strategy,
        );
        if (alternativeStrategy !== strategy) {
          const alternativeResolution = await this.applyResolutionStrategy(
            conflict,
            alternativeStrategy,
          );

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
    } catch (error) {
      // Handle resolution failure
      conflict.status = 'escalated';

      this.emit('resolution-failed', { conflictId, error });

      // Escalate if appropriate
      if (conflict.severity >= this.config.escalationThreshold) {
        await this.escalateConflict(conflict);
      }

      throw error;
    } finally {
      const duration = Date.now() - startTime;
      this.emit('resolution-timing', { conflictId, duration });
    }
  }

  /**
   * Get current active conflicts
   */
  getActiveConflicts(): Conflict[] {
    return Array.from(this.activeConflicts.values());
  }

  /**
   * Get conflict resolution history
   */
  getResolutionHistory(limit?: number): ConflictResolution[] {
    const resolutions = Array.from(this.resolutionHistory.values());
    return limit ? resolutions.slice(-limit) : resolutions;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ConflictResolverConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('config-updated', { config: this.config });
  }

  /**
   * Get conflict resolution statistics
   */
  getStatistics(): {
    totalConflicts: number;
    activeConflicts: number;
    resolutionRate: number;
    averageResolutionTime: number;
    strategyUsage: Record<ResolutionStrategy, number>;
    severityDistribution: Record<ConflictSeverity, number>;
    averageMetrics: {
      fairness: number;
      efficiency: number;
      satisfaction: number;
      stability: number;
    };
  } {
    const totalConflicts =
      this.activeConflicts.size + this.resolutionHistory.size;
    const resolutions = Array.from(this.resolutionHistory.values());

    const strategyUsage: Record<ResolutionStrategy, number> = {} as Record<
      ResolutionStrategy,
      number
    >;
    const severityDistribution: Record<ConflictSeverity, number> = {} as Record<
      ConflictSeverity,
      number
    >;
    const totalResolutionTime = 0;
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
        satisfaction:
          resolutionCount > 0 ? totalSatisfaction / resolutionCount : 0,
        stability: resolutionCount > 0 ? totalStability / resolutionCount : 0,
      },
    };
  }

  private async selectResolutionStrategy(
    conflict: Conflict,
  ): Promise<ResolutionStrategy> {
    // Use multi-criteria decision analysis to select strategy
    const strategies = Object.values(ResolutionStrategy);
    const scores: Record<ResolutionStrategy, number> = {} as Record<
      ResolutionStrategy,
      number
    >;

    for (const strategy of strategies) {
      let score = this.config.strategyWeights[strategy] || 1.0;

      // Adjust score based on conflict characteristics
      switch (strategy) {
        case ResolutionStrategy.PRIORITY_BASED:
          if (
            conflict.participants.some(
              (p) => p.priority >= DecisionPriority.HIGH,
            )
          ) {
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
          if (
            this.config.allowNegotiation &&
            conflict.participants.every(
              (p) => p.negotiationCapability !== 'none',
            )
          ) {
            score *= 1.3;
          } else {
            score *= 0.1;
          }
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
        bestStrategy = strategy as ResolutionStrategy;
      }
    }

    return bestStrategy;
  }

  private async selectAlternativeStrategy(
    conflict: Conflict,
    excludeStrategy: ResolutionStrategy,
  ): Promise<ResolutionStrategy> {
    const alternatives = Object.values(ResolutionStrategy).filter(
      (s) => s !== excludeStrategy,
    );

    // Simple fallback: use weighted fair if available, otherwise round robin
    if (alternatives.includes(ResolutionStrategy.WEIGHTED_FAIR)) {
      return ResolutionStrategy.WEIGHTED_FAIR;
    }

    return alternatives[0] || ResolutionStrategy.ROUND_ROBIN;
  }

  private async applyResolutionStrategy(
    conflict: Conflict,
    strategy: ResolutionStrategy,
  ): Promise<ConflictResolution> {
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

  private async resolvePriorityBased(
    conflict: Conflict,
  ): Promise<ConflictResolution> {
    // Sort participants by priority
    const sortedParticipants = [...conflict.participants].sort(
      (a, b) => b.priority - a.priority,
    );

    const allocations = sortedParticipants.map((participant, index) => ({
      participantId: participant.id,
      awarded: index === 0 ? participant.requirements : {},
      denied: index === 0 ? {} : participant.requirements,
    }));

    return this.createResolution(
      conflict,
      ResolutionStrategy.PRIORITY_BASED,
      'winner_takes_all',
      allocations,
    );
  }

  private async resolveRoundRobin(
    conflict: Conflict,
  ): Promise<ConflictResolution> {
    // Distribute resources evenly among participants
    const allocations = conflict.participants.map((participant) => ({
      participantId: participant.id,
      awarded: this.distributeEvenly(
        participant.requirements,
        conflict.participants.length,
      ),
      denied: {},
    }));

    return this.createResolution(
      conflict,
      ResolutionStrategy.ROUND_ROBIN,
      'compromise',
      allocations,
    );
  }

  private async resolveWeightedFair(
    conflict: Conflict,
  ): Promise<ConflictResolution> {
    // Weight distribution based on priority and business value
    const weights = conflict.participants.map(
      (p) => p.priority / DecisionPriority.URGENT,
    );
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    const allocations = conflict.participants.map((participant, index) => {
      const weight = weights[index] / totalWeight;
      return {
        participantId: participant.id,
        awarded: this.distributeByWeight(participant.requirements, weight),
        denied: {},
      };
    });

    return this.createResolution(
      conflict,
      ResolutionStrategy.WEIGHTED_FAIR,
      'compromise',
      allocations,
    );
  }

  private async resolveFirstComeFirstServed(
    conflict: Conflict,
  ): Promise<ConflictResolution> {
    // Award based on timestamp (assuming participants have timestamps)
    const sortedParticipants = [...conflict.participants].sort((a, b) => {
      const timeA = (a as any).timestamp || 0;
      const timeB = (b as any).timestamp || 0;
      return timeA - timeB;
    });

    const allocations = sortedParticipants.map((participant, index) => ({
      participantId: participant.id,
      awarded: index === 0 ? participant.requirements : {},
      denied: index === 0 ? {} : participant.requirements,
    }));

    return this.createResolution(
      conflict,
      ResolutionStrategy.FIRST_COME_FIRST_SERVED,
      'winner_takes_all',
      allocations,
    );
  }

  private async resolveDeadlineEarliest(
    conflict: Conflict,
  ): Promise<ConflictResolution> {
    // Award based on earliest deadline
    const sortedParticipants = [...conflict.participants].sort((a, b) => {
      const deadlineA = (a.constraints as any).deadline || Infinity;
      const deadlineB = (b.constraints as any).deadline || Infinity;
      return deadlineA - deadlineB;
    });

    const allocations = sortedParticipants.map((participant, index) => ({
      participantId: participant.id,
      awarded: index === 0 ? participant.requirements : {},
      denied: index === 0 ? {} : participant.requirements,
    }));

    return this.createResolution(
      conflict,
      ResolutionStrategy.DEADLINE_EARLIEST,
      'winner_takes_all',
      allocations,
    );
  }

  private async resolveCostOptimal(
    conflict: Conflict,
  ): Promise<ConflictResolution> {
    // Award based on cost efficiency
    const costEfficiency = conflict.participants.map((p) => {
      const cost = (p.constraints as any).cost || 1;
      const value = p.priority / DecisionPriority.URGENT;
      return { participant: p, efficiency: value / cost };
    });

    costEfficiency.sort((a, b) => b.efficiency - a.efficiency);

    const allocations = costEfficiency.map((item, index) => ({
      participantId: item.participant.id,
      awarded: index === 0 ? item.participant.requirements : {},
      denied: index === 0 ? {} : item.participant.requirements,
    }));

    return this.createResolution(
      conflict,
      ResolutionStrategy.COST_OPTIMAL,
      'winner_takes_all',
      allocations,
    );
  }

  private async resolvePreemption(
    conflict: Conflict,
  ): Promise<ConflictResolution> {
    // Preempt lower priority participants for higher priority ones
    const highestPriority = Math.max(
      ...conflict.participants.map((p) => p.priority),
    );

    const allocations = conflict.participants.map((participant) => ({
      participantId: participant.id,
      awarded:
        participant.priority === highestPriority
          ? participant.requirements
          : {},
      denied:
        participant.priority === highestPriority
          ? {}
          : participant.requirements,
    }));

    return this.createResolution(
      conflict,
      ResolutionStrategy.PREEMPTION,
      'winner_takes_all',
      allocations,
    );
  }

  private async resolveNegotiation(
    conflict: Conflict,
  ): Promise<ConflictResolution> {
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

    return this.createResolution(
      conflict,
      ResolutionStrategy.NEGOTIATION,
      result.outcome,
      result.allocations,
    );
  }

  private async resolveEscalation(
    conflict: Conflict,
  ): Promise<ConflictResolution> {
    // Mark for escalation - typically would involve human intervention
    const allocations = conflict.participants.map((participant) => ({
      participantId: participant.id,
      awarded: {},
      denied: participant.requirements,
      alternatives: { escalated: true },
    }));

    return this.createResolution(
      conflict,
      ResolutionStrategy.ESCALATION,
      'deferred',
      allocations,
    );
  }

  private createResolution(
    conflict: Conflict,
    strategy: ResolutionStrategy,
    outcome: ConflictResolution['outcome'],
    allocations: ConflictResolution['allocations'],
  ): ConflictResolution {
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

  private calculateResolutionMetrics(
    conflict: Conflict,
    allocations: ConflictResolution['allocations'],
  ): ConflictResolution['metrics'] {
    // Calculate fairness using Jain's fairness index
    const satisfactions = allocations.map((alloc) => {
      const participant = conflict.participants.find(
        (p) => p.id === alloc.participantId,
      );
      if (!participant) return 0;

      const awardedCount = Object.keys(alloc.awarded).length;
      const totalCount = Object.keys(participant.requirements).length;
      return totalCount > 0 ? awardedCount / totalCount : 0;
    });

    const sum = satisfactions.reduce((a, b) => a + b, 0);
    const sumSquares = satisfactions.reduce((a, b) => a + b * b, 0);
    const fairnessScore =
      satisfactions.length > 0
        ? (sum * sum) / (satisfactions.length * sumSquares)
        : 1.0;

    // Calculate efficiency (resource utilization)
    const totalAwarded = allocations.reduce(
      (sum, alloc) => sum + Object.keys(alloc.awarded).length,
      0,
    );
    const totalRequested = conflict.participants.reduce(
      (sum, p) => sum + Object.keys(p.requirements).length,
      0,
    );
    const efficiencyScore =
      totalRequested > 0 ? totalAwarded / totalRequested : 0;

    // Calculate average satisfaction
    const satisfactionScore =
      satisfactions.reduce((a, b) => a + b, 0) / satisfactions.length || 0;

    // Calculate stability (rough estimate based on fairness and satisfaction)
    const stabilityScore = (fairnessScore + satisfactionScore) / 2;

    return {
      fairnessScore: Math.min(1, Math.max(0, fairnessScore)),
      efficiencyScore: Math.min(1, Math.max(0, efficiencyScore)),
      satisfactionScore: Math.min(1, Math.max(0, satisfactionScore)),
      stabilityScore: Math.min(1, Math.max(0, stabilityScore)),
    };
  }

  private calculateConflictSeverity(
    type: ConflictType,
    participants: ConflictParticipant[],
    constraints: ConflictConstraint[],
  ): ConflictSeverity {
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
    } else if (maxPriority >= DecisionPriority.HIGH) {
      severity = Math.max(severity, ConflictSeverity.HIGH);
    }

    // Increase severity based on hard constraints
    const hardConstraints = constraints.filter((c) => c.type === 'hard');
    if (hardConstraints.length > 0) {
      severity = Math.max(severity, ConflictSeverity.MEDIUM);
    }

    return severity;
  }

  private generateConflictDescription(
    type: ConflictType,
    participants: ConflictParticipant[],
  ): string {
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

  private generateConflictId(): string {
    return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateResolutionId(): string {
    return `resolution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private inferDomain(participants: ConflictParticipant[]): string {
    // Infer domain from participant types
    if (participants.some((p) => p.type === 'task')) return 'task_management';
    if (participants.some((p) => p.type === 'agent'))
      return 'agent_coordination';
    if (participants.some((p) => p.type === 'user')) return 'user_interaction';
    return 'system';
  }

  private generateTags(
    type: ConflictType,
    participants: ConflictParticipant[],
  ): string[] {
    const tags = [type];
    tags.push(...participants.map((p) => p.type));
    return [...new Set(tags)]; // Remove duplicates
  }

  private generateResolutionReasoning(
    conflict: Conflict,
    strategy: ResolutionStrategy,
    outcome: ConflictResolution['outcome'],
  ): string {
    return `Applied ${strategy} strategy to resolve ${conflict.type} conflict, resulting in ${outcome}`;
  }

  private calculateTradeoffs(
    conflict: Conflict,
    allocations: ConflictResolution['allocations'],
  ): ConflictResolution['tradeoffs'] {
    return allocations.map((alloc) => {
      const participant = conflict.participants.find(
        (p) => p.id === alloc.participantId,
      );
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

  private generateFollowUpActions(
    conflict: Conflict,
    allocations: ConflictResolution['allocations'],
  ): ConflictResolution['followUpActions'] {
    const actions: ConflictResolution['followUpActions'] = [];

    // Add monitoring action
    actions.push({
      action: 'Monitor resolution stability',
      responsible: 'system',
      deadline: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      priority: DecisionPriority.LOW,
    });

    // Add feedback collection
    const deniedParticipants = allocations.filter(
      (alloc) => Object.keys(alloc.denied).length > 0,
    );
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

  private distributeEvenly(
    requirements: Record<string, unknown>,
    participantCount: number,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(requirements)) {
      if (typeof value === 'number') {
        result[key] = Math.floor(value / participantCount);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  private distributeByWeight(
    requirements: Record<string, unknown>,
    weight: number,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(requirements)) {
      if (typeof value === 'number') {
        result[key] = Math.floor(value * weight);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  private compareResolutions(
    a: ConflictResolution,
    b: ConflictResolution,
  ): number {
    // Simple scoring: weighted sum of metrics
    const scoreA =
      a.metrics.satisfactionScore * 0.4 +
      a.metrics.fairnessScore * 0.3 +
      a.metrics.efficiencyScore * 0.2 +
      a.metrics.stabilityScore * 0.1;
    const scoreB =
      b.metrics.satisfactionScore * 0.4 +
      b.metrics.fairnessScore * 0.3 +
      b.metrics.efficiencyScore * 0.2 +
      b.metrics.stabilityScore * 0.1;

    return scoreA - scoreB;
  }

  private async applyResolution(
    conflict: Conflict,
    resolution: ConflictResolution,
  ): Promise<void> {
    // Apply the resolution (implementation would depend on specific system)
    this.emit('resolution-applied', { conflict, resolution });
  }

  private async escalateConflict(conflict: Conflict): Promise<void> {
    this.emit('conflict-escalated', { conflict });
    // Implementation would trigger human intervention or higher-level resolution
  }

  private startNegotiation(conflict: Conflict): string {
    // Simplified negotiation implementation
    const sessionId = `nego_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: NegotiationSession = {
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

  private async runNegotiation(session: NegotiationSession): Promise<{
    outcome: ConflictResolution['outcome'];
    allocations: ConflictResolution['allocations'];
  }> {
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

  private trimHistory(): void {
    if (this.resolutionHistory.size > this.maxHistorySize) {
      const entries = Array.from(this.resolutionHistory.entries()).sort(
        ([, a], [, b]) => a.timestamp - b.timestamp,
      );

      const toDelete = entries.slice(0, entries.length - this.maxHistorySize);
      for (const [id] of toDelete) {
        this.resolutionHistory.delete(id);
      }
    }
  }
}

/**
 * Negotiation session for conflict resolution
 */
interface NegotiationSession {
  id: string;
  conflictId: string;
  participants: string[];
  maxRounds: number;
  currentRound: number;
  offers: Array<{
    from: string;
    to: string;
    offer: Record<string, unknown>;
    timestamp: number;
  }>;
  status: 'active' | 'completed' | 'failed';
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
  } as ConflictResolverConfig,

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
  } as ConflictResolverConfig,

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
  } as ConflictResolverConfig,
};
