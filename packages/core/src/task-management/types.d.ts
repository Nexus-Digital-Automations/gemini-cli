/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Core types for the autonomous task management system
 */
export type TaskId = string;
export { TaskPriority, TaskStatus, TaskCategory } from './TaskQueue.js';
export { TaskType } from './TaskExecutionEngine.js';
export type DependencyType = 'hard' | 'soft' | 'resource' | 'temporal';
export declare enum TaskComplexity {
    TRIVIAL = "trivial",
    SIMPLE = "simple",
    MODERATE = "moderate",
    COMPLEX = "complex",
    ENTERPRISE = "enterprise"
}
/**
 * Represents a task dependency relationship
 */
export interface TaskDependency {
    /** The task that depends on another */
    dependentTaskId: TaskId;
    /** The task that must complete first */
    dependsOnTaskId: TaskId;
    /** Type of dependency relationship */
    type: DependencyType;
    /** Optional reason for the dependency */
    reason?: string;
    /** Whether this dependency can be parallelized under certain conditions */
    parallelizable?: boolean;
    /** Minimum delay between dependency completion and dependent task start (ms) */
    minDelay?: number;
}
/**
 * Resource constraints for task execution
 */
export interface ResourceConstraint {
    /** Type of resource (cpu, memory, network, etc.) */
    resourceType: string;
    /** Maximum units of this resource the task can consume */
    maxUnits: number;
    /** Whether this resource is exclusive (only one task can use it at a time) */
    exclusive?: boolean;
    /** Tags for resource pools */
    tags?: string[];
}
/**
 * Execution context for a task
 */
export interface TaskExecutionContext {
    /** Working directory for the task */
    workingDirectory?: string;
    /** Environment variables */
    environment?: Record<string, string>;
    /** Timeout in milliseconds */
    timeout?: number;
    /** Maximum retry attempts */
    maxRetries?: number;
    /** Resource constraints */
    resourceConstraints?: ResourceConstraint[];
}
/**
 * Task metadata and execution tracking
 */
export interface TaskMetadata {
    /** When the task was created */
    createdAt: Date;
    /** When the task was last updated */
    updatedAt: Date;
    /** Who/what created the task */
    createdBy: string;
    /** Estimated duration in milliseconds */
    estimatedDuration?: number;
    /** Actual start time */
    startTime?: Date;
    /** Actual end time */
    endTime?: Date;
    /** Actual duration in milliseconds */
    actualDuration?: number;
    /** Number of retry attempts */
    retryCount?: number;
    /** Tags for categorization */
    tags?: string[];
    /** Custom metadata */
    custom?: Record<string, unknown>;
}
/**
 * Task execution metrics
 */
export interface TaskExecutionMetrics {
    /** When task execution started */
    startTime: Date;
    /** When task execution ended */
    endTime?: Date;
    /** Execution duration in milliseconds */
    durationMs?: number;
    /** Token usage during execution */
    tokenUsage?: number;
    /** Number of tool calls made */
    toolCallsCount?: number;
    /** Number of sub-agents used */
    subAgentCount?: number;
    /** Error count during execution */
    errorCount?: number;
    /** Retry count during execution */
    retryCount?: number;
    /** Memory usage in bytes */
    memoryUsage?: number;
    /** CPU usage percentage */
    cpuUsage?: number;
}
/**
 * Core task definition
 */
export interface Task {
    /** Unique task identifier */
    id: TaskId;
    /** Human-readable task title */
    title: string;
    /** Detailed task description */
    description: string;
    /** Current task status */
    status: TaskStatus;
    /** Task priority level */
    priority: TaskPriority;
    /** Task type for specialized handling */
    type?: TaskType;
    /** Task category */
    category: TaskCategory;
    /** Execution context */
    executionContext?: TaskExecutionContext;
    /** Task metadata */
    metadata: TaskMetadata;
    /** Task-specific parameters */
    parameters?: Record<string, unknown>;
    /** Expected output schema */
    expectedOutput?: Record<string, unknown>;
    /** Validation criteria */
    validationCriteria?: string[];
    /** Task execution results */
    results?: Record<string, unknown>;
    /** Last error encountered during execution */
    lastError?: string;
    /** Execution metrics */
    metrics?: TaskExecutionMetrics;
}
/**
 * Task execution result
 */
export interface TaskResult {
    /** Task ID */
    taskId: TaskId;
    /** Whether the task succeeded */
    success: boolean;
    /** Task output data */
    output?: unknown;
    /** Error information if failed */
    error?: {
        message: string;
        code?: string;
        stack?: string;
        details?: Record<string, unknown>;
    };
    /** Execution metrics */
    metrics?: {
        startTime: Date;
        endTime: Date;
        duration: number;
        memoryUsage?: number;
        cpuUsage?: number;
    };
    /** Generated artifacts */
    artifacts?: string[];
    /** Validation results */
    validationResults?: Array<{
        criterion: string;
        passed: boolean;
        message?: string;
    }>;
}
/**
 * Dependency graph node
 */
export interface DependencyNode {
    /** Task ID */
    taskId: TaskId;
    /** Direct dependencies (tasks this task depends on) */
    dependencies: TaskId[];
    /** Direct dependents (tasks that depend on this task) */
    dependents: TaskId[];
    /** Dependency relationships */
    dependencyRelations: TaskDependency[];
    /** Graph traversal metadata */
    traversalMetadata?: {
        visited?: boolean;
        processing?: boolean;
        depth?: number;
        topologicalOrder?: number;
    };
}
/**
 * Dependency graph representation
 */
export interface DependencyGraph {
    /** Map of task ID to dependency node */
    nodes: Map<TaskId, DependencyNode>;
    /** All dependency relationships */
    edges: TaskDependency[];
    /** Graph metadata */
    metadata: {
        nodeCount: number;
        edgeCount: number;
        hasCycles: boolean;
        maxDepth: number;
        createdAt: Date;
        updatedAt: Date;
    };
}
/**
 * Circular dependency information
 */
export interface CircularDependency {
    /** Tasks involved in the cycle */
    cycle: TaskId[];
    /** Dependency relationships forming the cycle */
    edges: TaskDependency[];
    /** Suggested resolution strategies */
    resolutionStrategies: Array<{
        strategy: 'remove_edge' | 'split_task' | 'merge_tasks' | 'reorder';
        description: string;
        impact: 'low' | 'medium' | 'high';
        edges?: TaskDependency[];
        tasks?: TaskId[];
    }>;
}
/**
 * Task scheduling priority factors
 */
export interface SchedulingFactors {
    /** Base priority score */
    basePriority: number;
    /** Urgency factor (0-1) */
    urgency: number;
    /** Impact factor (0-1) */
    impact: number;
    /** Dependency weight (higher = more tasks depend on this) */
    dependencyWeight: number;
    /** Resource availability factor (0-1) */
    resourceAvailability: number;
    /** Historical execution success rate (0-1) */
    successRate?: number;
    /** Estimated execution time factor */
    durationFactor: number;
}
/**
 * Task execution sequence
 */
export interface ExecutionSequence {
    /** Ordered list of task IDs */
    sequence: TaskId[];
    /** Parallel execution groups */
    parallelGroups: TaskId[][];
    /** Critical path tasks */
    criticalPath: TaskId[];
    /** Estimated total execution time */
    estimatedDuration: number;
    /** Sequence metadata */
    metadata: {
        algorithm: string;
        generatedAt: Date;
        factors: string[];
        constraints: string[];
    };
}
/**
 * Resource allocation for tasks
 */
export interface ResourceAllocation {
    /** Task ID */
    taskId: TaskId;
    /** Allocated resources */
    allocatedResources: Map<string, number>;
    /** Resource pool assignments */
    poolAssignments: string[];
    /** Allocation timestamp */
    allocatedAt: Date;
    /** Expected release time */
    expectedReleaseAt?: Date;
}
/**
 * Task execution plan
 */
export interface ExecutionPlan {
    /** Execution sequence */
    sequence: ExecutionSequence;
    /** Resource allocations */
    resourceAllocations: ResourceAllocation[];
    /** Dependency resolution strategy */
    dependencyResolution?: {
        circularDependencies: CircularDependency[];
        resolutionActions: Array<{
            type: 'remove_dependency' | 'split_task' | 'merge_tasks';
            taskIds: TaskId[];
            dependencies?: TaskDependency[];
            reason: string;
        }>;
    };
    /** Plan metadata */
    metadata: {
        generatedAt: Date;
        algorithm: string;
        constraints: string[];
        assumptions: string[];
        riskFactors: string[];
    };
}
/**
 * Task queue configuration
 */
export interface TaskQueueConfig {
    /** Maximum concurrent tasks */
    maxConcurrentTasks: number;
    /** Task timeout in milliseconds */
    defaultTimeout: number;
    /** Maximum retry attempts */
    defaultMaxRetries: number;
    /** Resource pools */
    resourcePools: Map<string, number>;
    /** Priority thresholds */
    priorityThresholds: Record<TaskPriority, number>;
    /** Scheduling algorithm to use */
    schedulingAlgorithm: 'fifo' | 'priority' | 'dependency_aware' | 'resource_optimal';
    /** Auto-dependency learning enabled */
    autoDependencyLearning: boolean;
    /** Performance monitoring enabled */
    performanceMonitoring: boolean;
}
