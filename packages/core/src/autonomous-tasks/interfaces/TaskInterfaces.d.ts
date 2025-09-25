/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { EventEmitter } from 'node:events';
/**
 * Task priority levels for queue management
 */
export declare enum TaskPriority {
    CRITICAL = 1,
    HIGH = 2,
    MEDIUM = 3,
    LOW = 4,
    BACKGROUND = 5
}
/**
 * Task status during execution lifecycle
 */
export declare enum TaskStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled",
    BLOCKED = "blocked",
    RETRYING = "retrying"
}
/**
 * Task types for categorization and specialized handling
 */
export declare enum TaskType {
    CODE_GENERATION = "code_generation",
    CODE_ANALYSIS = "code_analysis",
    TESTING = "testing",
    DOCUMENTATION = "documentation",
    BUILD = "build",
    DEPLOYMENT = "deployment",
    REFACTORING = "refactoring",
    BUG_FIX = "bug_fix",
    FEATURE = "feature",
    MAINTENANCE = "maintenance",
    SECURITY = "security",
    PERFORMANCE = "performance"
}
/**
 * Task execution context containing environment and configuration
 */
export interface TaskContext {
    /** Unique session identifier */
    sessionId: string;
    /** Working directory for task execution */
    workingDirectory: string;
    /** Environment variables */
    environment: Record<string, string>;
    /** Task-specific configuration */
    config: Record<string, unknown>;
    /** Execution timeout in milliseconds */
    timeout: number;
    /** Maximum retry attempts */
    maxRetries: number;
    /** User preferences and settings */
    userPreferences: Record<string, unknown>;
}
/**
 * Task execution result containing outcomes and metadata
 */
export interface TaskResult {
    /** Whether task completed successfully */
    success: boolean;
    /** Result data if successful */
    data?: unknown;
    /** Error information if failed */
    error?: Error;
    /** Execution metrics */
    metrics: TaskMetrics;
    /** Generated artifacts or outputs */
    artifacts?: TaskArtifact[];
    /** Messages or logs from execution */
    messages: string[];
}
/**
 * Task execution metrics for performance monitoring
 */
export interface TaskMetrics {
    /** Task start timestamp */
    startTime: Date;
    /** Task completion timestamp */
    endTime?: Date;
    /** Execution duration in milliseconds */
    duration?: number;
    /** Memory usage in bytes */
    memoryUsage: number;
    /** CPU usage percentage */
    cpuUsage: number;
    /** Retry count */
    retryCount: number;
    /** Performance score (1-100) */
    performanceScore: number;
}
/**
 * Task artifact representing generated files or outputs
 */
export interface TaskArtifact {
    /** Artifact identifier */
    id: string;
    /** Artifact type */
    type: string;
    /** File path or content identifier */
    path: string;
    /** Artifact size in bytes */
    size: number;
    /** MIME type if applicable */
    mimeType?: string;
    /** Artifact metadata */
    metadata: Record<string, unknown>;
}
/**
 * Task dependency specification for sequencing
 */
export interface TaskDependency {
    /** ID of dependent task */
    taskId: string;
    /** Type of dependency relationship */
    type: 'prerequisite' | 'soft_dependency' | 'resource_dependency';
    /** Whether dependency is optional */
    optional: boolean;
    /** Condition for dependency satisfaction */
    condition?: string;
}
/**
 * Core task interface representing a unit of work
 */
export interface ITask {
    /** Unique task identifier */
    readonly id: string;
    /** Human-readable task name */
    readonly name: string;
    /** Detailed task description */
    readonly description: string;
    /** Task type for categorization */
    readonly type: TaskType;
    /** Task priority for scheduling */
    readonly priority: TaskPriority;
    /** Current task status */
    status: TaskStatus;
    /** Task dependencies */
    dependencies: TaskDependency[];
    /** Task creation timestamp */
    readonly createdAt: Date;
    /** Last status update timestamp */
    updatedAt: Date;
    /** Scheduled execution time */
    scheduledAt?: Date;
    /** Task execution context */
    context: TaskContext;
    /** Task parameters and inputs */
    parameters: Record<string, unknown>;
    /** Task execution result */
    result?: TaskResult;
    /** Parent task ID if subtask */
    parentTaskId?: string;
    /** Subtask IDs */
    subtasks: string[];
    /** Task tags for filtering and organization */
    tags: string[];
    /**
     * Execute the task with given context
     * @param context Execution context
     * @returns Promise resolving to task result
     */
    execute(context: TaskContext): Promise<TaskResult>;
    /**
     * Validate task can be executed with given context
     * @param context Execution context
     * @returns Whether task is valid for execution
     */
    validate(context: TaskContext): boolean;
    /**
     * Cancel task execution if in progress
     * @returns Whether cancellation was successful
     */
    cancel(): Promise<boolean>;
    /**
     * Clone task with optional parameter overrides
     * @param overrides Parameter overrides
     * @returns New task instance
     */
    clone(overrides?: Partial<ITask>): ITask;
    /**
     * Get task progress as percentage (0-100)
     * @returns Current progress percentage
     */
    getProgress(): number;
    /**
     * Get estimated time to completion in milliseconds
     * @returns Estimated completion time
     */
    getEstimatedCompletion(): number;
}
/**
 * Task queue interface for managing task execution order
 */
export interface ITaskQueue {
    /** Queue identifier */
    readonly id: string;
    /** Queue name */
    readonly name: string;
    /** Current queue size */
    readonly size: number;
    /** Whether queue is currently processing */
    readonly isProcessing: boolean;
    /** Queue priority (for multiple queues) */
    readonly priority: TaskPriority;
    /**
     * Add task to queue
     * @param task Task to add
     * @returns Promise resolving when task is queued
     */
    enqueue(task: ITask): Promise<void>;
    /**
     * Remove and return next task from queue
     * @returns Next task or null if queue empty
     */
    dequeue(): Promise<ITask | null>;
    /**
     * Peek at next task without removing
     * @returns Next task or null if queue empty
     */
    peek(): Promise<ITask | null>;
    /**
     * Remove specific task from queue
     * @param taskId Task ID to remove
     * @returns Whether task was removed
     */
    remove(taskId: string): Promise<boolean>;
    /**
     * Get all tasks in queue
     * @returns Array of queued tasks
     */
    getTasks(): Promise<ITask[]>;
    /**
     * Clear all tasks from queue
     * @returns Number of tasks removed
     */
    clear(): Promise<number>;
    /**
     * Get queue statistics
     * @returns Queue performance metrics
     */
    getStats(): Promise<QueueStats>;
}
/**
 * Queue statistics for monitoring and optimization
 */
export interface QueueStats {
    /** Total tasks processed */
    totalProcessed: number;
    /** Current queue size */
    currentSize: number;
    /** Average processing time */
    averageProcessingTime: number;
    /** Success rate percentage */
    successRate: number;
    /** Queue throughput (tasks per second) */
    throughput: number;
    /** Peak queue size in current session */
    peakSize: number;
    /** Last activity timestamp */
    lastActivity: Date;
}
/**
 * Task execution engine interface for autonomous processing
 */
export interface ITaskExecutionEngine extends EventEmitter {
    /** Engine identifier */
    readonly id: string;
    /** Whether engine is currently running */
    readonly isRunning: boolean;
    /** Current concurrent execution limit */
    readonly concurrencyLimit: number;
    /** Number of currently executing tasks */
    readonly activeTaskCount: number;
    /**
     * Start the execution engine
     * @returns Promise resolving when engine started
     */
    start(): Promise<void>;
    /**
     * Stop the execution engine gracefully
     * @param force Whether to force stop immediately
     * @returns Promise resolving when engine stopped
     */
    stop(force?: boolean): Promise<void>;
    /**
     * Execute a single task
     * @param task Task to execute
     * @returns Promise resolving to execution result
     */
    executeTask(task: ITask): Promise<TaskResult>;
    /**
     * Add task queue to engine
     * @param queue Task queue to manage
     * @returns Promise resolving when queue added
     */
    addQueue(queue: ITaskQueue): Promise<void>;
    /**
     * Remove task queue from engine
     * @param queueId Queue ID to remove
     * @returns Whether queue was removed
     */
    removeQueue(queueId: string): Promise<boolean>;
    /**
     * Get all managed queues
     * @returns Array of task queues
     */
    getQueues(): ITaskQueue[];
    /**
     * Get engine execution statistics
     * @returns Engine performance metrics
     */
    getStats(): Promise<ExecutionEngineStats>;
    /**
     * Set concurrency limit for parallel execution
     * @param limit Maximum concurrent tasks
     */
    setConcurrencyLimit(limit: number): void;
}
/**
 * Execution engine statistics for monitoring
 */
export interface ExecutionEngineStats {
    /** Total tasks executed */
    totalExecuted: number;
    /** Currently active tasks */
    activeTasks: number;
    /** Tasks completed successfully */
    successfulTasks: number;
    /** Tasks that failed */
    failedTasks: number;
    /** Average task execution time */
    averageExecutionTime: number;
    /** Engine uptime in milliseconds */
    uptime: number;
    /** CPU utilization percentage */
    cpuUtilization: number;
    /** Memory usage in bytes */
    memoryUsage: number;
    /** Task throughput (tasks per second) */
    throughput: number;
}
/**
 * Task breakdown strategy interface for decomposing complex tasks
 */
export interface ITaskBreakdownStrategy {
    /** Strategy identifier */
    readonly name: string;
    /** Strategy description */
    readonly description: string;
    /** Supported task types */
    readonly supportedTypes: TaskType[];
    /**
     * Analyze if task can be broken down by this strategy
     * @param task Task to analyze
     * @returns Whether task can be decomposed
     */
    canBreakdown(task: ITask): boolean;
    /**
     * Break down complex task into subtasks
     * @param task Task to decompose
     * @param context Execution context
     * @returns Array of subtasks
     */
    breakdownTask(task: ITask, context: TaskContext): Promise<ITask[]>;
    /**
     * Estimate breakdown complexity
     * @param task Task to analyze
     * @returns Complexity score (1-10)
     */
    estimateComplexity(task: ITask): number;
    /**
     * Validate breakdown result
     * @param originalTask Original task
     * @param subtasks Generated subtasks
     * @returns Whether breakdown is valid
     */
    validateBreakdown(originalTask: ITask, subtasks: ITask[]): boolean;
}
/**
 * Task persistence interface for cross-session storage
 */
export interface ITaskPersistence {
    /**
     * Save task to persistent storage
     * @param task Task to save
     * @returns Promise resolving when saved
     */
    saveTask(task: ITask): Promise<void>;
    /**
     * Load task from persistent storage
     * @param taskId Task ID to load
     * @returns Promise resolving to task or null
     */
    loadTask(taskId: string): Promise<ITask | null>;
    /**
     * Delete task from persistent storage
     * @param taskId Task ID to delete
     * @returns Promise resolving when deleted
     */
    deleteTask(taskId: string): Promise<void>;
    /**
     * List all persisted tasks with optional filtering
     * @param filter Optional task filter
     * @returns Promise resolving to task array
     */
    listTasks(filter?: TaskFilter): Promise<ITask[]>;
    /**
     * Save task queue state
     * @param queue Task queue to save
     * @returns Promise resolving when saved
     */
    saveQueue(queue: ITaskQueue): Promise<void>;
    /**
     * Load task queue state
     * @param queueId Queue ID to load
     * @returns Promise resolving to queue or null
     */
    loadQueue(queueId: string): Promise<ITaskQueue | null>;
    /**
     * Get persistence statistics
     * @returns Storage usage and performance metrics
     */
    getStats(): Promise<PersistenceStats>;
    /**
     * Clean up old or orphaned task data
     * @param olderThan Cleanup threshold date
     * @returns Number of items cleaned up
     */
    cleanup(olderThan?: Date): Promise<number>;
}
/**
 * Task filter for querying persisted tasks
 */
export interface TaskFilter {
    /** Filter by task status */
    status?: TaskStatus[];
    /** Filter by task type */
    type?: TaskType[];
    /** Filter by priority */
    priority?: TaskPriority[];
    /** Filter by creation date range */
    createdAfter?: Date;
    createdBefore?: Date;
    /** Filter by tags */
    tags?: string[];
    /** Filter by parent task */
    parentTaskId?: string;
    /** Maximum results to return */
    limit?: number;
}
/**
 * Persistence statistics for monitoring storage
 */
export interface PersistenceStats {
    /** Total stored tasks */
    totalTasks: number;
    /** Total stored queues */
    totalQueues: number;
    /** Storage size in bytes */
    storageSize: number;
    /** Average task serialization time */
    averageSerializationTime: number;
    /** Cache hit rate percentage */
    cacheHitRate: number;
    /** Last cleanup timestamp */
    lastCleanup: Date;
}
/**
 * Status monitoring system interface for real-time tracking
 */
export interface ITaskStatusMonitor extends EventEmitter {
    /**
     * Start monitoring task status changes
     * @returns Promise resolving when monitoring started
     */
    start(): Promise<void>;
    /**
     * Stop monitoring task status changes
     * @returns Promise resolving when monitoring stopped
     */
    stop(): Promise<void>;
    /**
     * Register task for monitoring
     * @param task Task to monitor
     * @returns Promise resolving when registered
     */
    registerTask(task: ITask): Promise<void>;
    /**
     * Unregister task from monitoring
     * @param taskId Task ID to unregister
     * @returns Promise resolving when unregistered
     */
    unregisterTask(taskId: string): Promise<void>;
    /**
     * Get current status of monitored task
     * @param taskId Task ID to check
     * @returns Current task status or null
     */
    getTaskStatus(taskId: string): TaskStatus | null;
    /**
     * Get real-time metrics for monitored task
     * @param taskId Task ID to check
     * @returns Current task metrics or null
     */
    getTaskMetrics(taskId: string): TaskMetrics | null;
    /**
     * Get status summary for all monitored tasks
     * @returns Status summary by task status
     */
    getStatusSummary(): Promise<StatusSummary>;
    /**
     * Set up status alerts for specific conditions
     * @param condition Alert condition
     * @param callback Alert callback function
     * @returns Alert subscription ID
     */
    setupAlert(condition: AlertCondition, callback: AlertCallback): string;
    /**
     * Remove status alert
     * @param alertId Alert subscription ID
     * @returns Whether alert was removed
     */
    removeAlert(alertId: string): boolean;
}
/**
 * Status summary for monitored tasks
 */
export interface StatusSummary {
    /** Tasks by status */
    byStatus: Record<TaskStatus, number>;
    /** Tasks by type */
    byType: Record<TaskType, number>;
    /** Tasks by priority */
    byPriority: Record<TaskPriority, number>;
    /** Total monitored tasks */
    totalTasks: number;
    /** Active tasks currently executing */
    activeTasks: number;
    /** Average task completion time */
    averageCompletionTime: number;
    /** System health score (1-100) */
    healthScore: number;
}
/**
 * Alert condition for status monitoring
 */
export interface AlertCondition {
    /** Task ID pattern (supports wildcards) */
    taskIdPattern?: string;
    /** Task status to monitor */
    status?: TaskStatus;
    /** Task type to monitor */
    type?: TaskType;
    /** Priority level to monitor */
    priority?: TaskPriority;
    /** Execution time threshold */
    executionTimeThreshold?: number;
    /** Memory usage threshold */
    memoryThreshold?: number;
    /** Custom condition function */
    customCondition?: (task: ITask, metrics: TaskMetrics) => boolean;
}
/**
 * Alert callback function signature
 */
export type AlertCallback = (taskId: string, condition: AlertCondition, task: ITask, metrics: TaskMetrics) => void;
/**
 * Dependency management interface for intelligent task sequencing
 */
export interface IDependencyManager {
    /**
     * Analyze task dependencies and create execution graph
     * @param tasks Array of tasks to analyze
     * @returns Promise resolving to dependency graph
     */
    analyzeDependencies(tasks: ITask[]): Promise<DependencyGraph>;
    /**
     * Resolve task execution order based on dependencies
     * @param tasks Array of tasks to sequence
     * @returns Promise resolving to ordered task array
     */
    resolveExecutionOrder(tasks: ITask[]): Promise<ITask[]>;
    /**
     * Detect circular dependencies
     * @param tasks Array of tasks to check
     * @returns Promise resolving to circular dependency chains
     */
    detectCircularDependencies(tasks: ITask[]): Promise<string[][]>;
    /**
     * Validate all task dependencies can be satisfied
     * @param tasks Array of tasks to validate
     * @returns Promise resolving to validation result
     */
    validateDependencies(tasks: ITask[]): Promise<DependencyValidation>;
    /**
     * Get optimal parallel execution groups
     * @param tasks Array of tasks to group
     * @returns Promise resolving to execution groups
     */
    getParallelExecutionGroups(tasks: ITask[]): Promise<ITask[][]>;
    /**
     * Update task dependencies dynamically
     * @param taskId Task ID to update
     * @param dependencies New dependencies
     * @returns Promise resolving when updated
     */
    updateTaskDependencies(taskId: string, dependencies: TaskDependency[]): Promise<void>;
}
/**
 * Dependency graph representation
 */
export interface DependencyGraph {
    /** Graph nodes (tasks) */
    nodes: DependencyNode[];
    /** Graph edges (dependencies) */
    edges: DependencyEdge[];
    /** Execution levels for parallel processing */
    levels: string[][];
    /** Critical path through graph */
    criticalPath: string[];
    /** Graph complexity metrics */
    metrics: GraphMetrics;
}
/**
 * Dependency graph node representing a task
 */
export interface DependencyNode {
    /** Task ID */
    taskId: string;
    /** Task priority */
    priority: TaskPriority;
    /** Estimated execution time */
    estimatedTime: number;
    /** Resource requirements */
    resources: string[];
    /** Node position in dependency levels */
    level: number;
}
/**
 * Dependency graph edge representing a dependency
 */
export interface DependencyEdge {
    /** Source task ID */
    from: string;
    /** Target task ID */
    to: string;
    /** Dependency type */
    type: TaskDependency['type'];
    /** Dependency weight/strength */
    weight: number;
    /** Whether dependency is optional */
    optional: boolean;
}
/**
 * Graph complexity metrics
 */
export interface GraphMetrics {
    /** Total nodes in graph */
    nodeCount: number;
    /** Total edges in graph */
    edgeCount: number;
    /** Maximum dependency depth */
    maxDepth: number;
    /** Average node degree */
    averageDegree: number;
    /** Graph density (0-1) */
    density: number;
    /** Estimated total execution time */
    estimatedTotalTime: number;
}
/**
 * Dependency validation result
 */
export interface DependencyValidation {
    /** Whether all dependencies are valid */
    isValid: boolean;
    /** Validation errors */
    errors: DependencyError[];
    /** Validation warnings */
    warnings: DependencyWarning[];
    /** Missing dependencies */
    missingDependencies: string[];
    /** Circular dependency chains */
    circularDependencies: string[][];
}
/**
 * Dependency validation error
 */
export interface DependencyError {
    /** Error type */
    type: 'missing_dependency' | 'circular_dependency' | 'invalid_dependency';
    /** Error message */
    message: string;
    /** Related task IDs */
    taskIds: string[];
    /** Severity level */
    severity: 'critical' | 'high' | 'medium' | 'low';
}
/**
 * Dependency validation warning
 */
export interface DependencyWarning {
    /** Warning type */
    type: 'soft_dependency' | 'resource_conflict' | 'performance_concern';
    /** Warning message */
    message: string;
    /** Related task IDs */
    taskIds: string[];
    /** Suggested resolution */
    suggestion?: string;
}
