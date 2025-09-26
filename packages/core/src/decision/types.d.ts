/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Priority levels for autonomous decision-making.
 * Higher numbers indicate higher priority.
 */
export declare enum DecisionPriority {
    LOW = 1,
    NORMAL = 2,
    HIGH = 3,
    CRITICAL = 4,
    URGENT = 5
}
/**
 * Context information for decision-making processes.
 * Provides comprehensive system state for informed decisions.
 */
export interface DecisionContext {
    /** Current system resource utilization */
    systemLoad: {
        cpu: number;
        memory: number;
        diskIO: number;
        networkIO: number;
    };
    /** Current task queue state */
    taskQueueState: {
        totalTasks: number;
        pendingTasks: number;
        runningTasks: number;
        failedTasks: number;
        avgProcessingTime: number;
    };
    /** Active agent information */
    agentContext: {
        activeAgents: number;
        maxConcurrentAgents: number;
        agentCapabilities: Record<string, string[]>;
        agentWorkloads: Record<string, number>;
    };
    /** Project state information */
    projectState: {
        lastBuildTime?: number;
        buildStatus: 'success' | 'failed' | 'in-progress' | 'unknown';
        testStatus: 'passing' | 'failing' | 'in-progress' | 'unknown';
        lintStatus: 'clean' | 'warnings' | 'errors' | 'in-progress' | 'unknown';
        gitStatus: 'clean' | 'modified' | 'conflicted' | 'unknown';
    };
    /** Budget and cost constraints */
    budgetContext: {
        remainingTokens?: number;
        dailyLimit?: number;
        currentUsage: number;
        costPerToken: number;
        estimatedCostForTask: number;
    };
    /** Historical performance data */
    performanceHistory: {
        avgSuccessRate: number;
        avgCompletionTime: number;
        commonFailureReasons: string[];
        peakUsageHours: number[];
    };
    /** User preferences and overrides */
    userPreferences: {
        allowAutonomousDecisions: boolean;
        maxConcurrentTasks: number;
        preferredWorkingHours?: {
            start: number;
            end: number;
        };
        criticalTaskNotification: boolean;
    };
    /** Timestamp of context creation */
    timestamp: number;
}
/**
 * Represents a decision made by the autonomous system.
 * Contains both the decision and supporting metadata.
 */
export interface Decision {
    /** Unique identifier for the decision */
    id: string;
    /** Timestamp when decision was made */
    timestamp: number;
    /** Type of decision being made */
    type: DecisionType;
    /** The actual decision choice */
    choice: string;
    /** Priority level assigned to this decision */
    priority: DecisionPriority;
    /** Confidence score (0-1) in the decision */
    confidence: number;
    /** Reasoning behind the decision */
    reasoning: string;
    /** Supporting evidence and metrics */
    evidence: Record<string, unknown>;
    /** Expected outcomes and success criteria */
    expectedOutcome: {
        successProbability: number;
        estimatedDuration: number;
        requiredResources: string[];
    };
    /** Context snapshot when decision was made */
    context: DecisionContext;
    /** Whether this decision requires human approval */
    requiresApproval: boolean;
    /** Alternative choices that were considered */
    alternatives: Array<{
        choice: string;
        score: number;
        reasoning: string;
    }>;
}
/**
 * Categories of decisions the system can make autonomously.
 */
export declare enum DecisionType {
    TASK_PRIORITIZATION = "task_prioritization",
    RESOURCE_ALLOCATION = "resource_allocation",
    AGENT_ASSIGNMENT = "agent_assignment",
    CONFLICT_RESOLUTION = "conflict_resolution",
    ESCALATION = "escalation",
    OPTIMIZATION = "optimization",
    SCHEDULING = "scheduling",
    LOAD_BALANCING = "load_balancing",
    FAILURE_RECOVERY = "failure_recovery",
    CAPACITY_PLANNING = "capacity_planning"
}
/**
 * Outcome of a decision after execution.
 * Used for learning and optimization.
 */
export interface DecisionOutcome {
    /** ID of the original decision */
    decisionId: string;
    /** Timestamp when outcome was recorded */
    timestamp: number;
    /** Whether the decision was successful */
    success: boolean;
    /** Actual duration of execution */
    actualDuration: number;
    /** Actual resources consumed */
    actualResources: Record<string, number>;
    /** Metrics and performance data */
    metrics: Record<string, number>;
    /** User satisfaction score (if available) */
    userSatisfaction?: number;
    /** Lessons learned and insights */
    insights: string[];
    /** Errors or issues encountered */
    errors: string[];
}
/**
 * Rule definition for decision-making logic.
 * Enables flexible, configurable decision trees.
 */
export interface DecisionRule {
    /** Unique identifier for the rule */
    id: string;
    /** Human-readable name for the rule */
    name: string;
    /** Description of when this rule applies */
    description: string;
    /** Type of decisions this rule applies to */
    applicableTypes: DecisionType[];
    /** Conditions that must be met for rule to trigger */
    conditions: DecisionCondition[];
    /** Actions to take when rule is triggered */
    actions: DecisionAction[];
    /** Priority/weight of this rule (higher = more important) */
    weight: number;
    /** Whether this rule is currently active */
    enabled: boolean;
    /** Metadata for rule management */
    metadata: {
        createdAt: number;
        updatedAt: number;
        createdBy: string;
        tags: string[];
    };
}
/**
 * Condition that must be met for a decision rule to apply.
 */
export interface DecisionCondition {
    /** Field in the context to evaluate */
    field: string;
    /** Operator for comparison */
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'regex';
    /** Value to compare against */
    value: unknown;
    /** Whether this is a required condition (AND) or optional (OR) */
    required: boolean;
}
/**
 * Action to take when a decision rule is triggered.
 */
export interface DecisionAction {
    /** Type of action to perform */
    type: 'set_priority' | 'assign_agent' | 'allocate_resource' | 'escalate' | 'defer' | 'reject';
    /** Parameters for the action */
    parameters: Record<string, unknown>;
    /** Weight/importance of this action */
    weight: number;
}
/**
 * Configuration for the decision-making system.
 */
export interface DecisionConfig {
    /** Whether autonomous decisions are enabled */
    enabled: boolean;
    /** Maximum number of decisions to make per minute */
    maxDecisionsPerMinute: number;
    /** Default confidence threshold for autonomous execution */
    defaultConfidenceThreshold: number;
    /** Types of decisions that require human approval */
    requireApprovalFor: DecisionType[];
    /** Resource limits for autonomous operations */
    resourceLimits: {
        maxConcurrentDecisions: number;
        maxMemoryUsage: number;
        maxCpuUsage: number;
        timeoutMs: number;
    };
    /** Learning and adaptation settings */
    learning: {
        enabled: boolean;
        adaptationRate: number;
        minSamplesForLearning: number;
        maxHistorySize: number;
    };
    /** Monitoring and alerting settings */
    monitoring: {
        logAllDecisions: boolean;
        alertOnFailures: boolean;
        performanceMetricsInterval: number;
    };
}
/**
 * Zod schemas for runtime validation.
 */
export declare const DecisionContextSchema: any;
export declare const DecisionSchema: any;
export declare const DecisionOutcomeSchema: any;
