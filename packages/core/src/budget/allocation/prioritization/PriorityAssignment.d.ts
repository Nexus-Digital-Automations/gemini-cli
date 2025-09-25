/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Priority assignment algorithms and management system
 * Provides intelligent priority assignment based on dynamic business conditions and resource constraints
 *
 * @author Claude Code - Budget Allocation Agent
 * @version 1.0.0
 */
import type { AllocationCandidate, AllocationPriority, AllocationConstraints, FeatureCostAnalysis, AllocationLogger } from '../types.js';
import type { BusinessContextConfig, ResourceRankingResult } from './ResourceRanking.js';
/**
 * Priority assignment configuration
 */
export interface PriorityAssignmentConfig {
    /** Assignment strategy */
    strategy: PriorityAssignmentStrategy;
    /** Dynamic priority adjustment settings */
    dynamicAdjustment: {
        /** Enable dynamic priority adjustment */
        enabled: boolean;
        /** Adjustment frequency */
        frequency: 'real_time' | 'hourly' | 'daily' | 'weekly';
        /** Sensitivity to changes */
        sensitivity: 'low' | 'medium' | 'high';
        /** Adjustment constraints */
        constraints: PriorityAdjustmentConstraints;
    };
    /** Priority escalation rules */
    escalation: PriorityEscalationConfig;
    /** Priority conflicts resolution */
    conflictResolution: ConflictResolutionConfig;
    /** Business rules for priority assignment */
    businessRules: BusinessRulesConfig;
}
/**
 * Priority assignment strategies
 */
export type PriorityAssignmentStrategy = 'static' | 'dynamic' | 'hybrid' | 'machine_learning' | 'rule_based' | 'consensus';
/**
 * Priority adjustment constraints
 */
export interface PriorityAdjustmentConstraints {
    /** Maximum priority changes per period */
    maxChangesPerPeriod: number;
    /** Minimum stability period before changes */
    stabilityPeriod: string;
    /** Required confidence threshold for changes */
    confidenceThreshold: number;
    /** Stakeholder approval requirements */
    approvalRequired: Array<{
        /** Priority transition that requires approval */
        from: AllocationPriority;
        /** Target priority */
        to: AllocationPriority;
        /** Required approval level */
        approvalLevel: 'automatic' | 'manager' | 'director' | 'c_level';
    }>;
}
/**
 * Priority escalation configuration
 */
export interface PriorityEscalationConfig {
    /** Enable automatic escalation */
    enabled: boolean;
    /** Escalation triggers */
    triggers: EscalationTrigger[];
    /** Escalation timeline */
    timeline: {
        /** Initial escalation delay */
        initial: string;
        /** Escalation intervals */
        intervals: string[];
        /** Maximum escalation level */
        maxLevel: AllocationPriority;
    };
    /** Notification settings */
    notifications: {
        /** Enable notifications */
        enabled: boolean;
        /** Notification channels */
        channels: string[];
        /** Notification templates */
        templates: Record<string, string>;
    };
}
/**
 * Escalation trigger
 */
export interface EscalationTrigger {
    /** Trigger type */
    type: 'time_based' | 'performance_based' | 'business_impact' | 'external_event';
    /** Trigger condition */
    condition: string;
    /** Escalation action */
    action: 'increase_priority' | 'add_resources' | 'notify_stakeholders' | 'reassign';
    /** Trigger sensitivity */
    sensitivity: number;
}
/**
 * Conflict resolution configuration
 */
export interface ConflictResolutionConfig {
    /** Resolution strategy */
    strategy: 'first_come_first_served' | 'highest_priority' | 'business_value' | 'stakeholder_vote';
    /** Conflict detection settings */
    detection: {
        /** Enable conflict detection */
        enabled: boolean;
        /** Detection criteria */
        criteria: string[];
        /** Detection threshold */
        threshold: number;
    };
    /** Resolution process */
    process: {
        /** Automatic resolution enabled */
        automatic: boolean;
        /** Resolution timeout */
        timeout: string;
        /** Escalation on failure */
        escalateOnFailure: boolean;
    };
}
/**
 * Business rules configuration
 */
export interface BusinessRulesConfig {
    /** Mandatory rules (cannot be overridden) */
    mandatory: BusinessRule[];
    /** Conditional rules (can be overridden with approval) */
    conditional: BusinessRule[];
    /** Priority rules (preferences, not requirements) */
    priority: BusinessRule[];
}
/**
 * Business rule definition
 */
export interface BusinessRule {
    /** Rule identifier */
    id: string;
    /** Rule name */
    name: string;
    /** Rule condition */
    condition: string;
    /** Rule action */
    action: {
        /** Action type */
        type: 'set_priority' | 'adjust_priority' | 'add_constraint' | 'require_approval';
        /** Action parameters */
        parameters: Record<string, unknown>;
    };
    /** Rule priority (for conflict resolution) */
    priority: number;
    /** Rule enabled status */
    enabled: boolean;
}
/**
 * Priority assignment result
 */
export interface PriorityAssignmentResult {
    /** Resource identifier */
    resourceId: string;
    /** Assigned priority */
    assignedPriority: AllocationPriority;
    /** Previous priority (if changed) */
    previousPriority?: AllocationPriority;
    /** Assignment rationale */
    rationale: AssignmentRationale;
    /** Assignment confidence */
    confidence: number;
    /** Assignment metadata */
    metadata: AssignmentMetadata;
    /** Next review date */
    nextReview: Date;
    /** Assignment constraints */
    constraints: AllocationConstraints;
}
/**
 * Assignment rationale
 */
export interface AssignmentRationale {
    /** Primary assignment factors */
    primaryFactors: string[];
    /** Business justification */
    businessJustification: string;
    /** Applied business rules */
    appliedRules: BusinessRule[];
    /** Stakeholder considerations */
    stakeholderConsiderations: string[];
    /** Risk factors */
    riskFactors: string[];
    /** Alternative priorities considered */
    alternatives: Array<{
        priority: AllocationPriority;
        reason: string;
        score: number;
    }>;
}
/**
 * Assignment metadata
 */
export interface AssignmentMetadata {
    /** Assignment timestamp */
    assignedAt: Date;
    /** Assignment method */
    assignedBy: PriorityAssignmentStrategy;
    /** Assignment version */
    version: number;
    /** Assignment history */
    history: Array<{
        timestamp: Date;
        priority: AllocationPriority;
        reason: string;
        assignedBy: string;
    }>;
    /** Stakeholder approvals */
    approvals: Array<{
        stakeholder: string;
        approved: boolean;
        timestamp: Date;
        comment?: string;
    }>;
    /** Performance tracking */
    performance: {
        /** Assignment accuracy */
        accuracy: number;
        /** Assignment stability */
        stability: number;
        /** Stakeholder satisfaction */
        satisfaction: number;
    };
}
/**
 * Portfolio priority assignment result
 */
export interface PortfolioPriorityAssignmentResult {
    /** Individual resource assignments */
    assignments: PriorityAssignmentResult[];
    /** Portfolio-level insights */
    insights: PortfolioPriorityInsights;
    /** Assignment conflicts detected */
    conflicts: PriorityConflict[];
    /** Escalations triggered */
    escalations: PriorityEscalation[];
    /** Resource allocation recommendations */
    recommendations: PriorityRecommendation[];
}
/**
 * Portfolio priority insights
 */
export interface PortfolioPriorityInsights {
    /** Priority distribution */
    distribution: Record<AllocationPriority, number>;
    /** Priority balance assessment */
    balance: {
        /** Is portfolio balanced */
        balanced: boolean;
        /** Balance score (0-100) */
        score: number;
        /** Balance issues */
        issues: string[];
    };
    /** Resource competition analysis */
    competition: {
        /** High competition areas */
        highCompetition: string[];
        /** Low competition opportunities */
        opportunities: string[];
        /** Competition intensity */
        intensity: number;
    };
    /** Strategic alignment */
    alignment: {
        /** Overall alignment score */
        score: number;
        /** Well-aligned resources */
        wellAligned: string[];
        /** Misaligned resources */
        misaligned: string[];
    };
}
/**
 * Priority conflict
 */
export interface PriorityConflict {
    /** Conflict identifier */
    id: string;
    /** Conflicting resources */
    resources: string[];
    /** Conflict type */
    type: 'resource_competition' | 'priority_overlap' | 'constraint_violation' | 'stakeholder_disagreement';
    /** Conflict severity */
    severity: 'low' | 'medium' | 'high' | 'critical';
    /** Conflict description */
    description: string;
    /** Potential resolutions */
    resolutions: Array<{
        /** Resolution strategy */
        strategy: string;
        /** Impact assessment */
        impact: string;
        /** Implementation effort */
        effort: 'low' | 'medium' | 'high';
        /** Success probability */
        probability: number;
    }>;
    /** Conflict status */
    status: 'detected' | 'in_progress' | 'resolved' | 'escalated';
}
/**
 * Priority escalation
 */
export interface PriorityEscalation {
    /** Escalation identifier */
    id: string;
    /** Resource being escalated */
    resourceId: string;
    /** Escalation trigger */
    trigger: EscalationTrigger;
    /** Current escalation level */
    level: AllocationPriority;
    /** Escalation timeline */
    timeline: Date[];
    /** Stakeholders notified */
    notifiedStakeholders: string[];
    /** Escalation status */
    status: 'active' | 'resolved' | 'cancelled';
    /** Resolution deadline */
    deadline: Date;
}
/**
 * Priority recommendation
 */
export interface PriorityRecommendation {
    /** Recommendation type */
    type: 'priority_change' | 'resource_reallocation' | 'constraint_adjustment' | 'strategy_change';
    /** Target resources */
    resources: string[];
    /** Recommendation description */
    description: string;
    /** Expected benefits */
    benefits: {
        /** Cost impact */
        cost: number;
        /** Performance impact */
        performance: number;
        /** Efficiency impact */
        efficiency: number;
    };
    /** Implementation complexity */
    complexity: 'low' | 'medium' | 'high';
    /** Recommendation priority */
    priority: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
}
/**
 * Default priority assignment configuration
 */
export declare const DEFAULT_PRIORITY_CONFIG: PriorityAssignmentConfig;
/**
 * Priority assignment engine
 * Provides intelligent priority assignment and management
 */
export declare class PriorityAssignment {
    private readonly config;
    private readonly logger;
    private assignmentHistory;
    /**
     * Create priority assignment instance
     * @param config - Assignment configuration
     * @param logger - Logger instance
     */
    constructor(config: Partial<PriorityAssignmentConfig> | undefined, logger: AllocationLogger);
    /**
     * Assign priority to individual resource
     * @param candidate - Resource allocation candidate
     * @param ranking - Resource ranking result
     * @param historicalData - Historical performance data
     * @returns Priority assignment result
     */
    assignPriority(candidate: AllocationCandidate, ranking: ResourceRanking, historicalData: FeatureCostAnalysis[]): PriorityAssignmentResult;
    /**
     * Assign priorities to portfolio of resources
     * @param candidates - Array of resource allocation candidates
     * @param rankings - Resource ranking results
     * @param historicalData - Historical data for all resources
     * @returns Portfolio priority assignment result
     */
    assignPortfolioPriorities(candidates: AllocationCandidate[], rankings: ResourceRankingResult[], historicalData: Record<string, FeatureCostAnalysis[]>): PortfolioPriorityAssignmentResult;
    /**
     * Update priority based on changing conditions
     * @param resourceId - Resource identifier
     * @param contextChanges - Changes in business context
     * @param performanceData - Recent performance data
     * @returns Updated priority assignment
     */
    updatePriority(resourceId: string, contextChanges: Partial<BusinessContextConfig>, performanceData: FeatureCostAnalysis[]): PriorityAssignmentResult | null;
    /**
     * Apply business rules to resource
     */
    private applyBusinessRules;
    /**
     * Evaluate rule condition against candidate
     */
    private evaluateRuleCondition;
    /**
     * Apply dynamic priority adjustment
     */
    private applyDynamicAdjustment;
    /**
     * Check escalation triggers
     */
    private checkEscalationTriggers;
    /**
     * Evaluate escalation trigger condition
     */
    private evaluateTriggerCondition;
    /**
     * Escalate priority to next level
     */
    private escalatePriority;
    /**
     * De-escalate priority to previous level
     */
    private deeecalatePriority;
    /**
     * Adjust priority numerically
     */
    private adjustPriority;
    /**
     * Generate assignment rationale
     */
    private generateAssignmentRationale;
    /**
     * Calculate assignment confidence
     */
    private calculateAssignmentConfidence;
    /**
     * Create assignment metadata
     */
    private createAssignmentMetadata;
    /**
     * Generate assignment constraints
     */
    private generateAssignmentConstraints;
    default: break;
}
/**
 * Create priority assignment instance
 * @param config - Assignment configuration
 * @param logger - Logger instance
 * @returns PriorityAssignment instance
 */
export declare function createPriorityAssignment(config?: Partial<PriorityAssignmentConfig>, logger?: AllocationLogger): PriorityAssignment;
