/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import type { DecisionContext, DecisionPriority } from './types';
/**
 * Types of conflicts that can occur in the system
 */
export declare enum ConflictType {
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
export declare enum ConflictSeverity {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4,
  BLOCKING = 5,
}
/**
 * Conflict resolution strategies
 */
export declare enum ResolutionStrategy {
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
  participants: ConflictParticipant[];
  context: DecisionContext;
  constraints: ConflictConstraint[];
  status: 'open' | 'resolving' | 'resolved' | 'escalated';
  resolution?: ConflictResolution;
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
    tradeoffs: Array<{
      give: string;
      get: string;
      ratio: number;
    }>;
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
  weight: number;
  violationCost: number;
}
/**
 * Resolution of a conflict
 */
export interface ConflictResolution {
  id: string;
  conflictId: string;
  strategy: ResolutionStrategy;
  timestamp: number;
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
  metrics: {
    fairnessScore: number;
    efficiencyScore: number;
    satisfactionScore: number;
    stabilityScore: number;
  };
  reasoning: string;
  tradeoffs: Array<{
    participant: string;
    gave: string;
    received: string;
    satisfaction: number;
  }>;
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
  defaultStrategy: ResolutionStrategy;
  allowNegotiation: boolean;
  maxNegotiationRounds: number;
  escalationThreshold: ConflictSeverity;
  maxResolutionTime: number;
  conflictTimeout: number;
  minFairnessScore: number;
  minSatisfactionScore: number;
  strategyWeights: Record<ResolutionStrategy, number>;
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
export declare class ConflictResolver extends EventEmitter {
  private config;
  private activeConflicts;
  private resolutionHistory;
  private negotiationSessions;
  private readonly maxHistorySize;
  constructor(config: ConflictResolverConfig);
  /**
   * Detect and register a new conflict
   */
  detectConflict(
    type: ConflictType,
    participants: ConflictParticipant[],
    context: DecisionContext,
    constraints?: ConflictConstraint[],
  ): Promise<Conflict>;
  /**
   * Resolve a conflict using the best available strategy
   */
  resolveConflict(conflictId: string): Promise<ConflictResolution>;
  /**
   * Get current active conflicts
   */
  getActiveConflicts(): Conflict[];
  /**
   * Get conflict resolution history
   */
  getResolutionHistory(limit?: number): ConflictResolution[];
  /**
   * Update configuration
   */
  updateConfig(config: Partial<ConflictResolverConfig>): void;
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
  };
  private selectResolutionStrategy;
  private selectAlternativeStrategy;
  private applyResolutionStrategy;
  private resolvePriorityBased;
  private resolveRoundRobin;
  private resolveWeightedFair;
  private resolveFirstComeFirstServed;
  private resolveDeadlineEarliest;
  private resolveCostOptimal;
  private resolvePreemption;
  private resolveNegotiation;
  private resolveEscalation;
  private createResolution;
  private calculateResolutionMetrics;
  private calculateConflictSeverity;
  private generateConflictDescription;
  private generateConflictId;
  private generateResolutionId;
  private inferDomain;
  private generateTags;
  private generateResolutionReasoning;
  private calculateTradeoffs;
  private generateFollowUpActions;
  private distributeEvenly;
  private distributeByWeight;
  private compareResolutions;
  private applyResolution;
  private escalateConflict;
  private startNegotiation;
  private runNegotiation;
  private trimHistory;
}
/**
 * Default conflict resolver configurations
 */
export declare const ConflictResolverConfigs: {
  Balanced: ConflictResolverConfig;
  Aggressive: ConflictResolverConfig;
  Fair: ConflictResolverConfig;
};
