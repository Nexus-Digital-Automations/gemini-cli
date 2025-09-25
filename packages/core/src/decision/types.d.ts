/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { z } from 'zod';
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
export declare const DecisionContextSchema: z.ZodObject<{
    systemLoad: z.ZodObject<{
        cpu: z.ZodNumber;
        memory: z.ZodNumber;
        diskIO: z.ZodNumber;
        networkIO: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        memory: number;
        cpu: number;
        diskIO: number;
        networkIO: number;
    }, {
        memory: number;
        cpu: number;
        diskIO: number;
        networkIO: number;
    }>;
    taskQueueState: z.ZodObject<{
        totalTasks: z.ZodNumber;
        pendingTasks: z.ZodNumber;
        runningTasks: z.ZodNumber;
        failedTasks: z.ZodNumber;
        avgProcessingTime: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        totalTasks: number;
        failedTasks: number;
        pendingTasks: number;
        runningTasks: number;
        avgProcessingTime: number;
    }, {
        totalTasks: number;
        failedTasks: number;
        pendingTasks: number;
        runningTasks: number;
        avgProcessingTime: number;
    }>;
    agentContext: z.ZodObject<{
        activeAgents: z.ZodNumber;
        maxConcurrentAgents: z.ZodNumber;
        agentCapabilities: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>;
        agentWorkloads: z.ZodRecord<z.ZodString, z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        agentCapabilities: Record<string, string[]>;
        maxConcurrentAgents: number;
        activeAgents: number;
        agentWorkloads: Record<string, number>;
    }, {
        agentCapabilities: Record<string, string[]>;
        maxConcurrentAgents: number;
        activeAgents: number;
        agentWorkloads: Record<string, number>;
    }>;
    projectState: z.ZodObject<{
        lastBuildTime: z.ZodOptional<z.ZodNumber>;
        buildStatus: z.ZodEnum<["success", "failed", "in-progress", "unknown"]>;
        testStatus: z.ZodEnum<["passing", "failing", "in-progress", "unknown"]>;
        lintStatus: z.ZodEnum<["clean", "warnings", "errors", "in-progress", "unknown"]>;
        gitStatus: z.ZodEnum<["clean", "modified", "conflicted", "unknown"]>;
    }, "strip", z.ZodTypeAny, {
        buildStatus: "failed" | "success" | "unknown" | "in-progress";
        testStatus: "unknown" | "in-progress" | "passing" | "failing";
        lintStatus: "errors" | "warnings" | "unknown" | "clean" | "in-progress";
        gitStatus: "unknown" | "clean" | "modified" | "conflicted";
        lastBuildTime?: number | undefined;
    }, {
        buildStatus: "failed" | "success" | "unknown" | "in-progress";
        testStatus: "unknown" | "in-progress" | "passing" | "failing";
        lintStatus: "errors" | "warnings" | "unknown" | "clean" | "in-progress";
        gitStatus: "unknown" | "clean" | "modified" | "conflicted";
        lastBuildTime?: number | undefined;
    }>;
    budgetContext: z.ZodObject<{
        remainingTokens: z.ZodOptional<z.ZodNumber>;
        dailyLimit: z.ZodOptional<z.ZodNumber>;
        currentUsage: z.ZodNumber;
        costPerToken: z.ZodNumber;
        estimatedCostForTask: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        currentUsage: number;
        costPerToken: number;
        estimatedCostForTask: number;
        dailyLimit?: number | undefined;
        remainingTokens?: number | undefined;
    }, {
        currentUsage: number;
        costPerToken: number;
        estimatedCostForTask: number;
        dailyLimit?: number | undefined;
        remainingTokens?: number | undefined;
    }>;
    performanceHistory: z.ZodObject<{
        avgSuccessRate: z.ZodNumber;
        avgCompletionTime: z.ZodNumber;
        commonFailureReasons: z.ZodArray<z.ZodString, "many">;
        peakUsageHours: z.ZodArray<z.ZodNumber, "many">;
    }, "strip", z.ZodTypeAny, {
        avgSuccessRate: number;
        avgCompletionTime: number;
        commonFailureReasons: string[];
        peakUsageHours: number[];
    }, {
        avgSuccessRate: number;
        avgCompletionTime: number;
        commonFailureReasons: string[];
        peakUsageHours: number[];
    }>;
    userPreferences: z.ZodObject<{
        allowAutonomousDecisions: z.ZodBoolean;
        maxConcurrentTasks: z.ZodNumber;
        preferredWorkingHours: z.ZodOptional<z.ZodObject<{
            start: z.ZodNumber;
            end: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            end: number;
            start: number;
        }, {
            end: number;
            start: number;
        }>>;
        criticalTaskNotification: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        maxConcurrentTasks: number;
        allowAutonomousDecisions: boolean;
        criticalTaskNotification: boolean;
        preferredWorkingHours?: {
            end: number;
            start: number;
        } | undefined;
    }, {
        maxConcurrentTasks: number;
        allowAutonomousDecisions: boolean;
        criticalTaskNotification: boolean;
        preferredWorkingHours?: {
            end: number;
            start: number;
        } | undefined;
    }>;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    systemLoad: {
        memory: number;
        cpu: number;
        diskIO: number;
        networkIO: number;
    };
    taskQueueState: {
        totalTasks: number;
        failedTasks: number;
        pendingTasks: number;
        runningTasks: number;
        avgProcessingTime: number;
    };
    agentContext: {
        agentCapabilities: Record<string, string[]>;
        maxConcurrentAgents: number;
        activeAgents: number;
        agentWorkloads: Record<string, number>;
    };
    projectState: {
        buildStatus: "failed" | "success" | "unknown" | "in-progress";
        testStatus: "unknown" | "in-progress" | "passing" | "failing";
        lintStatus: "errors" | "warnings" | "unknown" | "clean" | "in-progress";
        gitStatus: "unknown" | "clean" | "modified" | "conflicted";
        lastBuildTime?: number | undefined;
    };
    budgetContext: {
        currentUsage: number;
        costPerToken: number;
        estimatedCostForTask: number;
        dailyLimit?: number | undefined;
        remainingTokens?: number | undefined;
    };
    performanceHistory: {
        avgSuccessRate: number;
        avgCompletionTime: number;
        commonFailureReasons: string[];
        peakUsageHours: number[];
    };
    userPreferences: {
        maxConcurrentTasks: number;
        allowAutonomousDecisions: boolean;
        criticalTaskNotification: boolean;
        preferredWorkingHours?: {
            end: number;
            start: number;
        } | undefined;
    };
}, {
    timestamp: number;
    systemLoad: {
        memory: number;
        cpu: number;
        diskIO: number;
        networkIO: number;
    };
    taskQueueState: {
        totalTasks: number;
        failedTasks: number;
        pendingTasks: number;
        runningTasks: number;
        avgProcessingTime: number;
    };
    agentContext: {
        agentCapabilities: Record<string, string[]>;
        maxConcurrentAgents: number;
        activeAgents: number;
        agentWorkloads: Record<string, number>;
    };
    projectState: {
        buildStatus: "failed" | "success" | "unknown" | "in-progress";
        testStatus: "unknown" | "in-progress" | "passing" | "failing";
        lintStatus: "errors" | "warnings" | "unknown" | "clean" | "in-progress";
        gitStatus: "unknown" | "clean" | "modified" | "conflicted";
        lastBuildTime?: number | undefined;
    };
    budgetContext: {
        currentUsage: number;
        costPerToken: number;
        estimatedCostForTask: number;
        dailyLimit?: number | undefined;
        remainingTokens?: number | undefined;
    };
    performanceHistory: {
        avgSuccessRate: number;
        avgCompletionTime: number;
        commonFailureReasons: string[];
        peakUsageHours: number[];
    };
    userPreferences: {
        maxConcurrentTasks: number;
        allowAutonomousDecisions: boolean;
        criticalTaskNotification: boolean;
        preferredWorkingHours?: {
            end: number;
            start: number;
        } | undefined;
    };
}>;
export declare const DecisionSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodNumber;
    type: z.ZodNativeEnum<typeof DecisionType>;
    choice: z.ZodString;
    priority: z.ZodNativeEnum<typeof DecisionPriority>;
    confidence: z.ZodNumber;
    reasoning: z.ZodString;
    evidence: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    expectedOutcome: z.ZodObject<{
        successProbability: z.ZodNumber;
        estimatedDuration: z.ZodNumber;
        requiredResources: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        estimatedDuration: number;
        requiredResources: string[];
        successProbability: number;
    }, {
        estimatedDuration: number;
        requiredResources: string[];
        successProbability: number;
    }>;
    context: z.ZodObject<{
        systemLoad: z.ZodObject<{
            cpu: z.ZodNumber;
            memory: z.ZodNumber;
            diskIO: z.ZodNumber;
            networkIO: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            memory: number;
            cpu: number;
            diskIO: number;
            networkIO: number;
        }, {
            memory: number;
            cpu: number;
            diskIO: number;
            networkIO: number;
        }>;
        taskQueueState: z.ZodObject<{
            totalTasks: z.ZodNumber;
            pendingTasks: z.ZodNumber;
            runningTasks: z.ZodNumber;
            failedTasks: z.ZodNumber;
            avgProcessingTime: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            totalTasks: number;
            failedTasks: number;
            pendingTasks: number;
            runningTasks: number;
            avgProcessingTime: number;
        }, {
            totalTasks: number;
            failedTasks: number;
            pendingTasks: number;
            runningTasks: number;
            avgProcessingTime: number;
        }>;
        agentContext: z.ZodObject<{
            activeAgents: z.ZodNumber;
            maxConcurrentAgents: z.ZodNumber;
            agentCapabilities: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>;
            agentWorkloads: z.ZodRecord<z.ZodString, z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            agentCapabilities: Record<string, string[]>;
            maxConcurrentAgents: number;
            activeAgents: number;
            agentWorkloads: Record<string, number>;
        }, {
            agentCapabilities: Record<string, string[]>;
            maxConcurrentAgents: number;
            activeAgents: number;
            agentWorkloads: Record<string, number>;
        }>;
        projectState: z.ZodObject<{
            lastBuildTime: z.ZodOptional<z.ZodNumber>;
            buildStatus: z.ZodEnum<["success", "failed", "in-progress", "unknown"]>;
            testStatus: z.ZodEnum<["passing", "failing", "in-progress", "unknown"]>;
            lintStatus: z.ZodEnum<["clean", "warnings", "errors", "in-progress", "unknown"]>;
            gitStatus: z.ZodEnum<["clean", "modified", "conflicted", "unknown"]>;
        }, "strip", z.ZodTypeAny, {
            buildStatus: "failed" | "success" | "unknown" | "in-progress";
            testStatus: "unknown" | "in-progress" | "passing" | "failing";
            lintStatus: "errors" | "warnings" | "unknown" | "clean" | "in-progress";
            gitStatus: "unknown" | "clean" | "modified" | "conflicted";
            lastBuildTime?: number | undefined;
        }, {
            buildStatus: "failed" | "success" | "unknown" | "in-progress";
            testStatus: "unknown" | "in-progress" | "passing" | "failing";
            lintStatus: "errors" | "warnings" | "unknown" | "clean" | "in-progress";
            gitStatus: "unknown" | "clean" | "modified" | "conflicted";
            lastBuildTime?: number | undefined;
        }>;
        budgetContext: z.ZodObject<{
            remainingTokens: z.ZodOptional<z.ZodNumber>;
            dailyLimit: z.ZodOptional<z.ZodNumber>;
            currentUsage: z.ZodNumber;
            costPerToken: z.ZodNumber;
            estimatedCostForTask: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            currentUsage: number;
            costPerToken: number;
            estimatedCostForTask: number;
            dailyLimit?: number | undefined;
            remainingTokens?: number | undefined;
        }, {
            currentUsage: number;
            costPerToken: number;
            estimatedCostForTask: number;
            dailyLimit?: number | undefined;
            remainingTokens?: number | undefined;
        }>;
        performanceHistory: z.ZodObject<{
            avgSuccessRate: z.ZodNumber;
            avgCompletionTime: z.ZodNumber;
            commonFailureReasons: z.ZodArray<z.ZodString, "many">;
            peakUsageHours: z.ZodArray<z.ZodNumber, "many">;
        }, "strip", z.ZodTypeAny, {
            avgSuccessRate: number;
            avgCompletionTime: number;
            commonFailureReasons: string[];
            peakUsageHours: number[];
        }, {
            avgSuccessRate: number;
            avgCompletionTime: number;
            commonFailureReasons: string[];
            peakUsageHours: number[];
        }>;
        userPreferences: z.ZodObject<{
            allowAutonomousDecisions: z.ZodBoolean;
            maxConcurrentTasks: z.ZodNumber;
            preferredWorkingHours: z.ZodOptional<z.ZodObject<{
                start: z.ZodNumber;
                end: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                end: number;
                start: number;
            }, {
                end: number;
                start: number;
            }>>;
            criticalTaskNotification: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            maxConcurrentTasks: number;
            allowAutonomousDecisions: boolean;
            criticalTaskNotification: boolean;
            preferredWorkingHours?: {
                end: number;
                start: number;
            } | undefined;
        }, {
            maxConcurrentTasks: number;
            allowAutonomousDecisions: boolean;
            criticalTaskNotification: boolean;
            preferredWorkingHours?: {
                end: number;
                start: number;
            } | undefined;
        }>;
        timestamp: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        timestamp: number;
        systemLoad: {
            memory: number;
            cpu: number;
            diskIO: number;
            networkIO: number;
        };
        taskQueueState: {
            totalTasks: number;
            failedTasks: number;
            pendingTasks: number;
            runningTasks: number;
            avgProcessingTime: number;
        };
        agentContext: {
            agentCapabilities: Record<string, string[]>;
            maxConcurrentAgents: number;
            activeAgents: number;
            agentWorkloads: Record<string, number>;
        };
        projectState: {
            buildStatus: "failed" | "success" | "unknown" | "in-progress";
            testStatus: "unknown" | "in-progress" | "passing" | "failing";
            lintStatus: "errors" | "warnings" | "unknown" | "clean" | "in-progress";
            gitStatus: "unknown" | "clean" | "modified" | "conflicted";
            lastBuildTime?: number | undefined;
        };
        budgetContext: {
            currentUsage: number;
            costPerToken: number;
            estimatedCostForTask: number;
            dailyLimit?: number | undefined;
            remainingTokens?: number | undefined;
        };
        performanceHistory: {
            avgSuccessRate: number;
            avgCompletionTime: number;
            commonFailureReasons: string[];
            peakUsageHours: number[];
        };
        userPreferences: {
            maxConcurrentTasks: number;
            allowAutonomousDecisions: boolean;
            criticalTaskNotification: boolean;
            preferredWorkingHours?: {
                end: number;
                start: number;
            } | undefined;
        };
    }, {
        timestamp: number;
        systemLoad: {
            memory: number;
            cpu: number;
            diskIO: number;
            networkIO: number;
        };
        taskQueueState: {
            totalTasks: number;
            failedTasks: number;
            pendingTasks: number;
            runningTasks: number;
            avgProcessingTime: number;
        };
        agentContext: {
            agentCapabilities: Record<string, string[]>;
            maxConcurrentAgents: number;
            activeAgents: number;
            agentWorkloads: Record<string, number>;
        };
        projectState: {
            buildStatus: "failed" | "success" | "unknown" | "in-progress";
            testStatus: "unknown" | "in-progress" | "passing" | "failing";
            lintStatus: "errors" | "warnings" | "unknown" | "clean" | "in-progress";
            gitStatus: "unknown" | "clean" | "modified" | "conflicted";
            lastBuildTime?: number | undefined;
        };
        budgetContext: {
            currentUsage: number;
            costPerToken: number;
            estimatedCostForTask: number;
            dailyLimit?: number | undefined;
            remainingTokens?: number | undefined;
        };
        performanceHistory: {
            avgSuccessRate: number;
            avgCompletionTime: number;
            commonFailureReasons: string[];
            peakUsageHours: number[];
        };
        userPreferences: {
            maxConcurrentTasks: number;
            allowAutonomousDecisions: boolean;
            criticalTaskNotification: boolean;
            preferredWorkingHours?: {
                end: number;
                start: number;
            } | undefined;
        };
    }>;
    requiresApproval: z.ZodBoolean;
    alternatives: z.ZodArray<z.ZodObject<{
        choice: z.ZodString;
        score: z.ZodNumber;
        reasoning: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        score: number;
        reasoning: string;
        choice: string;
    }, {
        score: number;
        reasoning: string;
        choice: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    type: DecisionType;
    priority: DecisionPriority;
    context: {
        timestamp: number;
        systemLoad: {
            memory: number;
            cpu: number;
            diskIO: number;
            networkIO: number;
        };
        taskQueueState: {
            totalTasks: number;
            failedTasks: number;
            pendingTasks: number;
            runningTasks: number;
            avgProcessingTime: number;
        };
        agentContext: {
            agentCapabilities: Record<string, string[]>;
            maxConcurrentAgents: number;
            activeAgents: number;
            agentWorkloads: Record<string, number>;
        };
        projectState: {
            buildStatus: "failed" | "success" | "unknown" | "in-progress";
            testStatus: "unknown" | "in-progress" | "passing" | "failing";
            lintStatus: "errors" | "warnings" | "unknown" | "clean" | "in-progress";
            gitStatus: "unknown" | "clean" | "modified" | "conflicted";
            lastBuildTime?: number | undefined;
        };
        budgetContext: {
            currentUsage: number;
            costPerToken: number;
            estimatedCostForTask: number;
            dailyLimit?: number | undefined;
            remainingTokens?: number | undefined;
        };
        performanceHistory: {
            avgSuccessRate: number;
            avgCompletionTime: number;
            commonFailureReasons: string[];
            peakUsageHours: number[];
        };
        userPreferences: {
            maxConcurrentTasks: number;
            allowAutonomousDecisions: boolean;
            criticalTaskNotification: boolean;
            preferredWorkingHours?: {
                end: number;
                start: number;
            } | undefined;
        };
    };
    id: string;
    confidence: number;
    evidence: Record<string, unknown>;
    reasoning: string;
    choice: string;
    expectedOutcome: {
        estimatedDuration: number;
        requiredResources: string[];
        successProbability: number;
    };
    requiresApproval: boolean;
    alternatives: Array<{
        score: number;
        reasoning: string;
        choice: string;
    }>;
}, {
    timestamp: number;
    type: DecisionType;
    priority: DecisionPriority;
    context: {
        timestamp: number;
        systemLoad: {
            memory: number;
            cpu: number;
            diskIO: number;
            networkIO: number;
        };
        taskQueueState: {
            totalTasks: number;
            failedTasks: number;
            pendingTasks: number;
            runningTasks: number;
            avgProcessingTime: number;
        };
        agentContext: {
            agentCapabilities: Record<string, string[]>;
            maxConcurrentAgents: number;
            activeAgents: number;
            agentWorkloads: Record<string, number>;
        };
        projectState: {
            buildStatus: "failed" | "success" | "unknown" | "in-progress";
            testStatus: "unknown" | "in-progress" | "passing" | "failing";
            lintStatus: "errors" | "warnings" | "unknown" | "clean" | "in-progress";
            gitStatus: "unknown" | "clean" | "modified" | "conflicted";
            lastBuildTime?: number | undefined;
        };
        budgetContext: {
            currentUsage: number;
            costPerToken: number;
            estimatedCostForTask: number;
            dailyLimit?: number | undefined;
            remainingTokens?: number | undefined;
        };
        performanceHistory: {
            avgSuccessRate: number;
            avgCompletionTime: number;
            commonFailureReasons: string[];
            peakUsageHours: number[];
        };
        userPreferences: {
            maxConcurrentTasks: number;
            allowAutonomousDecisions: boolean;
            criticalTaskNotification: boolean;
            preferredWorkingHours?: {
                end: number;
                start: number;
            } | undefined;
        };
    };
    id: string;
    confidence: number;
    evidence: Record<string, unknown>;
    reasoning: string;
    choice: string;
    expectedOutcome: {
        estimatedDuration: number;
        requiredResources: string[];
        successProbability: number;
    };
    requiresApproval: boolean;
    alternatives: Array<{
        score: number;
        reasoning: string;
        choice: string;
    }>;
}>;
export declare const DecisionOutcomeSchema: z.ZodObject<{
    decisionId: z.ZodString;
    timestamp: z.ZodNumber;
    success: z.ZodBoolean;
    actualDuration: z.ZodNumber;
    actualResources: z.ZodRecord<z.ZodString, z.ZodNumber>;
    metrics: z.ZodRecord<z.ZodString, z.ZodNumber>;
    userSatisfaction: z.ZodOptional<z.ZodNumber>;
    insights: z.ZodArray<z.ZodString, "many">;
    errors: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    success: boolean;
    errors: string[];
    metrics: Record<string, number>;
    actualDuration: number;
    insights: string[];
    decisionId: string;
    actualResources: Record<string, number>;
    userSatisfaction?: number | undefined;
}, {
    timestamp: number;
    success: boolean;
    errors: string[];
    metrics: Record<string, number>;
    actualDuration: number;
    insights: string[];
    decisionId: string;
    actualResources: Record<string, number>;
    userSatisfaction?: number | undefined;
}>;
