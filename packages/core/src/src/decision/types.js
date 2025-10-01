/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { z } from 'zod';
/**
 * Priority levels for autonomous decision-making.
 * Higher numbers indicate higher priority.
 */
export var DecisionPriority;
(function (DecisionPriority) {
    DecisionPriority[DecisionPriority["LOW"] = 1] = "LOW";
    DecisionPriority[DecisionPriority["NORMAL"] = 2] = "NORMAL";
    DecisionPriority[DecisionPriority["HIGH"] = 3] = "HIGH";
    DecisionPriority[DecisionPriority["CRITICAL"] = 4] = "CRITICAL";
    DecisionPriority[DecisionPriority["URGENT"] = 5] = "URGENT";
})(DecisionPriority || (DecisionPriority = {}));
/**
 * Categories of decisions the system can make autonomously.
 */
export var DecisionType;
(function (DecisionType) {
    DecisionType["TASK_PRIORITIZATION"] = "task_prioritization";
    DecisionType["RESOURCE_ALLOCATION"] = "resource_allocation";
    DecisionType["AGENT_ASSIGNMENT"] = "agent_assignment";
    DecisionType["CONFLICT_RESOLUTION"] = "conflict_resolution";
    DecisionType["ESCALATION"] = "escalation";
    DecisionType["OPTIMIZATION"] = "optimization";
    DecisionType["SCHEDULING"] = "scheduling";
    DecisionType["LOAD_BALANCING"] = "load_balancing";
    DecisionType["FAILURE_RECOVERY"] = "failure_recovery";
    DecisionType["CAPACITY_PLANNING"] = "capacity_planning";
})(DecisionType || (DecisionType = {}));
/**
 * Zod schemas for runtime validation.
 */
export const DecisionContextSchema = z.object({
    systemLoad: z.object({
        cpu: z.number().min(0).max(1),
        memory: z.number().min(0).max(1),
        diskIO: z.number().min(0).max(1),
        networkIO: z.number().min(0).max(1),
    }),
    taskQueueState: z.object({
        totalTasks: z.number().min(0),
        pendingTasks: z.number().min(0),
        runningTasks: z.number().min(0),
        failedTasks: z.number().min(0),
        avgProcessingTime: z.number().min(0),
    }),
    agentContext: z.object({
        activeAgents: z.number().min(0),
        maxConcurrentAgents: z.number().min(1),
        agentCapabilities: z.record(z.array(z.string())),
        agentWorkloads: z.record(z.number()),
    }),
    projectState: z.object({
        lastBuildTime: z.number().optional(),
        buildStatus: z.enum(['success', 'failed', 'in-progress', 'unknown']),
        testStatus: z.enum(['passing', 'failing', 'in-progress', 'unknown']),
        lintStatus: z.enum([
            'clean',
            'warnings',
            'errors',
            'in-progress',
            'unknown',
        ]),
        gitStatus: z.enum(['clean', 'modified', 'conflicted', 'unknown']),
    }),
    budgetContext: z.object({
        remainingTokens: z.number().optional(),
        dailyLimit: z.number().optional(),
        currentUsage: z.number().min(0),
        costPerToken: z.number().min(0),
        estimatedCostForTask: z.number().min(0),
    }),
    performanceHistory: z.object({
        avgSuccessRate: z.number().min(0).max(1),
        avgCompletionTime: z.number().min(0),
        commonFailureReasons: z.array(z.string()),
        peakUsageHours: z.array(z.number().min(0).max(23)),
    }),
    userPreferences: z.object({
        allowAutonomousDecisions: z.boolean(),
        maxConcurrentTasks: z.number().min(1),
        preferredWorkingHours: z
            .object({
            start: z.number().min(0).max(23),
            end: z.number().min(0).max(23),
        })
            .optional(),
        criticalTaskNotification: z.boolean(),
    }),
    timestamp: z.number(),
});
export const DecisionSchema = z.object({
    id: z.string(),
    timestamp: z.number(),
    type: z.nativeEnum(DecisionType),
    choice: z.string(),
    priority: z.nativeEnum(DecisionPriority),
    confidence: z.number().min(0).max(1),
    reasoning: z.string(),
    evidence: z.record(z.unknown()),
    expectedOutcome: z.object({
        successProbability: z.number().min(0).max(1),
        estimatedDuration: z.number().min(0),
        requiredResources: z.array(z.string()),
    }),
    context: DecisionContextSchema,
    requiresApproval: z.boolean(),
    alternatives: z.array(z.object({
        choice: z.string(),
        score: z.number(),
        reasoning: z.string(),
    })),
});
export const DecisionOutcomeSchema = z.object({
    decisionId: z.string(),
    timestamp: z.number(),
    success: z.boolean(),
    actualDuration: z.number().min(0),
    actualResources: z.record(z.number()),
    metrics: z.record(z.number()),
    userSatisfaction: z.number().min(0).max(10).optional(),
    insights: z.array(z.string()),
    errors: z.array(z.string()),
});
//# sourceMappingURL=types.js.map