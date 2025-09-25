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
export enum DecisionPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  CRITICAL = 4,
  URGENT = 5,
}

/**
 * Context information for decision-making processes.
 * Provides comprehensive system state for informed decisions.
 */
export interface DecisionContext {
  /** Current system resource utilization */
  systemLoad: {
    cpu: number; // 0-1 representing CPU usage percentage
    memory: number; // 0-1 representing memory usage percentage
    diskIO: number; // 0-1 representing disk I/O usage
    networkIO: number; // 0-1 representing network I/O usage
  };

  /** Current task queue state */
  taskQueueState: {
    totalTasks: number;
    pendingTasks: number;
    runningTasks: number;
    failedTasks: number;
    avgProcessingTime: number; // milliseconds
  };

  /** Active agent information */
  agentContext: {
    activeAgents: number;
    maxConcurrentAgents: number;
    agentCapabilities: Record<string, string[]>;
    agentWorkloads: Record<string, number>; // tasks per agent
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
    avgSuccessRate: number; // 0-1
    avgCompletionTime: number; // milliseconds
    commonFailureReasons: string[];
    peakUsageHours: number[];
  };

  /** User preferences and overrides */
  userPreferences: {
    allowAutonomousDecisions: boolean;
    maxConcurrentTasks: number;
    preferredWorkingHours?: { start: number; end: number }; // 0-23 hour format
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
export enum DecisionType {
  TASK_PRIORITIZATION = 'task_prioritization',
  RESOURCE_ALLOCATION = 'resource_allocation',
  AGENT_ASSIGNMENT = 'agent_assignment',
  CONFLICT_RESOLUTION = 'conflict_resolution',
  ESCALATION = 'escalation',
  OPTIMIZATION = 'optimization',
  SCHEDULING = 'scheduling',
  LOAD_BALANCING = 'load_balancing',
  FAILURE_RECOVERY = 'failure_recovery',
  CAPACITY_PLANNING = 'capacity_planning',
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
  userSatisfaction?: number; // 0-10 scale

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
    maxMemoryUsage: number; // MB
    maxCpuUsage: number; // 0-1
    timeoutMs: number;
  };

  /** Learning and adaptation settings */
  learning: {
    enabled: boolean;
    adaptationRate: number; // 0-1, how quickly to adapt to outcomes
    minSamplesForLearning: number;
    maxHistorySize: number;
  };

  /** Monitoring and alerting settings */
  monitoring: {
    logAllDecisions: boolean;
    alertOnFailures: boolean;
    performanceMetricsInterval: number; // milliseconds
  };
}

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
    lintStatus: z.enum(['clean', 'warnings', 'errors', 'in-progress', 'unknown']),
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
    preferredWorkingHours: z.object({
      start: z.number().min(0).max(23),
      end: z.number().min(0).max(23),
    }).optional(),
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