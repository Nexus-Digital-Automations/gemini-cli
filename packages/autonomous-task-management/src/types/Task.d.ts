/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Unique identifier for tasks
 */
export type TaskId = string;
/**
 * Unique identifier for agents
 */
export type AgentId = string;
/**
 * Unique identifier for features
 */
export type FeatureId = string;
/**
 * Task priority levels
 */
export declare enum TaskPriority {
    CRITICAL = "critical",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low",
    BACKGROUND = "background"
}
/**
 * Task status enumeration
 */
export declare enum TaskStatus {
    CREATED = "created",
    QUEUED = "queued",
    ASSIGNED = "assigned",
    IN_PROGRESS = "in_progress",
    BLOCKED = "blocked",
    REVIEW = "review",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled",
    ARCHIVED = "archived"
}
/**
 * Task categories for organization and routing
 */
export declare enum TaskCategory {
    FEATURE = "feature",
    BUG_FIX = "bug_fix",
    ENHANCEMENT = "enhancement",
    REFACTORING = "refactoring",
    TESTING = "testing",
    DOCUMENTATION = "documentation",
    SECURITY = "security",
    PERFORMANCE = "performance",
    MAINTENANCE = "maintenance",
    RESEARCH = "research"
}
/**
 * Task complexity levels for resource allocation
 */
export declare enum TaskComplexity {
    TRIVIAL = "trivial",
    SIMPLE = "simple",
    MODERATE = "moderate",
    COMPLEX = "complex",
    CRITICAL = "critical"
}
/**
 * Core task interface
 */
export interface Task {
    /** Unique task identifier */
    id: TaskId;
    /** Human-readable task title */
    title: string;
    /** Detailed task description */
    description: string;
    /** Task category for organization */
    category: TaskCategory;
    /** Task priority level */
    priority: TaskPriority;
    /** Current task status */
    status: TaskStatus;
    /** Task complexity assessment */
    complexity: TaskComplexity;
    /** Estimated effort in minutes */
    estimatedEffort: number;
    /** Actual effort spent in minutes */
    actualEffort?: number;
    /** Business value justification */
    businessValue: string;
    /** Task dependencies */
    dependencies: TaskId[];
    /** Dependent tasks (blocked by this task) */
    dependents: TaskId[];
    /** Assigned agent ID */
    assignedAgent?: AgentId;
    /** Related feature ID */
    featureId?: FeatureId;
    /** Task metadata */
    metadata: TaskMetadata;
    /** Task execution context */
    context: TaskContext;
    /** Validation requirements */
    validationCriteria: ValidationCriteria;
    /** Task timestamps */
    timestamps: TaskTimestamps;
    /** Task history and audit trail */
    history: TaskHistoryEntry[];
}
/**
 * Task metadata interface
 */
export interface TaskMetadata {
    /** Task tags for filtering and searching */
    tags: string[];
    /** Custom properties */
    properties: Record<string, any>;
    /** File paths affected by this task */
    affectedFiles: string[];
    /** Related issue/ticket numbers */
    relatedIssues: string[];
    /** Task creator information */
    createdBy: string;
    /** Task approval information */
    approvedBy?: string;
    /** Approval timestamp */
    approvedAt?: Date;
}
/**
 * Task execution context
 */
export interface TaskContext {
    /** Working directory */
    workingDirectory: string;
    /** Environment variables */
    environment: Record<string, string>;
    /** Required tools and dependencies */
    requiredTools: string[];
    /** Execution constraints */
    constraints: ExecutionConstraints;
    /** Input parameters */
    inputs: Record<string, any>;
    /** Expected outputs */
    outputs: Record<string, any>;
}
/**
 * Execution constraints
 */
export interface ExecutionConstraints {
    /** Maximum execution time in milliseconds */
    maxExecutionTime: number;
    /** Maximum memory usage in MB */
    maxMemoryUsage?: number;
    /** Required permissions */
    requiredPermissions: string[];
    /** Allowed file patterns */
    allowedFilePatterns: string[];
    /** Blocked file patterns */
    blockedFilePatterns: string[];
    /** Network access requirements */
    networkAccess: boolean;
}
/**
 * Validation criteria for task completion
 */
export interface ValidationCriteria {
    /** Linting must pass */
    requiresLinting: boolean;
    /** Tests must pass */
    requiresTesting: boolean;
    /** Security scan must pass */
    requiresSecurity: boolean;
    /** Performance benchmarks must pass */
    requiresPerformance: boolean;
    /** Code review required */
    requiresReview: boolean;
    /** Custom validation commands */
    customValidation: ValidationCommand[];
    /** Success criteria */
    successCriteria: SuccessCriteria[];
}
/**
 * Custom validation command
 */
export interface ValidationCommand {
    /** Command name */
    name: string;
    /** Command to execute */
    command: string;
    /** Expected exit code */
    expectedExitCode: number;
    /** Required output patterns */
    outputPatterns: string[];
    /** Timeout in milliseconds */
    timeout: number;
}
/**
 * Success criteria definition
 */
export interface SuccessCriteria {
    /** Criteria name */
    name: string;
    /** Criteria description */
    description: string;
    /** Validation function */
    validator: (task: Task, result: TaskExecutionResult) => Promise<boolean>;
    /** Whether this criteria is mandatory */
    mandatory: boolean;
}
/**
 * Task timestamps
 */
export interface TaskTimestamps {
    /** Task creation timestamp */
    createdAt: Date;
    /** Task update timestamp */
    updatedAt: Date;
    /** Task queue timestamp */
    queuedAt?: Date;
    /** Task assignment timestamp */
    assignedAt?: Date;
    /** Task start timestamp */
    startedAt?: Date;
    /** Task completion timestamp */
    completedAt?: Date;
    /** Task failure timestamp */
    failedAt?: Date;
    /** Task cancellation timestamp */
    cancelledAt?: Date;
}
/**
 * Task history entry
 */
export interface TaskHistoryEntry {
    /** Entry timestamp */
    timestamp: Date;
    /** Action performed */
    action: TaskAction;
    /** Agent that performed the action */
    agentId: AgentId;
    /** Previous status */
    previousStatus?: TaskStatus;
    /** New status */
    newStatus?: TaskStatus;
    /** Action details */
    details: string;
    /** Additional metadata */
    metadata?: Record<string, any>;
}
/**
 * Task actions for history tracking
 */
export declare enum TaskAction {
    CREATED = "created",
    QUEUED = "queued",
    ASSIGNED = "assigned",
    STARTED = "started",
    UPDATED = "updated",
    BLOCKED = "blocked",
    UNBLOCKED = "unblocked",
    PAUSED = "paused",
    RESUMED = "resumed",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled",
    ARCHIVED = "archived",
    COMMENT_ADDED = "comment_added"
}
/**
 * Task execution result
 */
export interface TaskExecutionResult {
    /** Execution success status */
    success: boolean;
    /** Exit code */
    exitCode: number;
    /** Execution output */
    output: string;
    /** Error output */
    error?: string;
    /** Execution start time */
    startTime: Date;
    /** Execution end time */
    endTime: Date;
    /** Execution duration in milliseconds */
    duration: number;
    /** Memory usage statistics */
    memoryUsage?: MemoryUsage;
    /** Performance metrics */
    metrics: PerformanceMetrics;
    /** Generated artifacts */
    artifacts: TaskArtifact[];
    /** Validation results */
    validationResults: ValidationResult[];
}
/**
 * Memory usage statistics
 */
export interface MemoryUsage {
    /** Peak memory usage in MB */
    peak: number;
    /** Average memory usage in MB */
    average: number;
    /** Memory usage samples */
    samples: MemorySample[];
}
/**
 * Memory usage sample
 */
export interface MemorySample {
    /** Sample timestamp */
    timestamp: Date;
    /** Memory usage in MB */
    usage: number;
}
/**
 * Performance metrics
 */
export interface PerformanceMetrics {
    /** CPU time in milliseconds */
    cpuTime: number;
    /** I/O operations count */
    ioOperations: number;
    /** Network requests count */
    networkRequests: number;
    /** Files modified count */
    filesModified: number;
    /** Lines of code changed */
    linesChanged: number;
    /** Custom metrics */
    customMetrics: Record<string, number>;
}
/**
 * Task artifact (files, reports, etc.)
 */
export interface TaskArtifact {
    /** Artifact name */
    name: string;
    /** Artifact type */
    type: ArtifactType;
    /** File path */
    path: string;
    /** File size in bytes */
    size: number;
    /** Creation timestamp */
    createdAt: Date;
    /** Artifact metadata */
    metadata: Record<string, any>;
}
/**
 * Artifact types
 */
export declare enum ArtifactType {
    SOURCE_CODE = "source_code",
    TEST_REPORT = "test_report",
    COVERAGE_REPORT = "coverage_report",
    LINT_REPORT = "lint_report",
    SECURITY_REPORT = "security_report",
    PERFORMANCE_REPORT = "performance_report",
    BUILD_ARTIFACT = "build_artifact",
    DOCUMENTATION = "documentation",
    LOG_FILE = "log_file",
    SCREENSHOT = "screenshot",
    OTHER = "other"
}
/**
 * Validation result
 */
export interface ValidationResult {
    /** Validation rule name */
    rule: string;
    /** Validation passed */
    passed: boolean;
    /** Validation message */
    message: string;
    /** Validation details */
    details?: Record<string, any>;
    /** Validation timestamp */
    timestamp: Date;
}
/**
 * Task creation request
 */
export interface CreateTaskRequest {
    /** Task title */
    title: string;
    /** Task description */
    description: string;
    /** Task category */
    category: TaskCategory;
    /** Task priority */
    priority: TaskPriority;
    /** Business value justification */
    businessValue: string;
    /** Task dependencies */
    dependencies?: TaskId[];
    /** Related feature ID */
    featureId?: FeatureId;
    /** Task metadata */
    metadata?: Partial<TaskMetadata>;
    /** Task context */
    context?: Partial<TaskContext>;
    /** Validation criteria */
    validationCriteria?: Partial<ValidationCriteria>;
}
/**
 * Task update request
 */
export interface UpdateTaskRequest {
    /** Task ID */
    id: TaskId;
    /** Fields to update */
    updates: Partial<Task>;
    /** Update reason */
    reason: string;
    /** Agent performing update */
    agentId: AgentId;
}
/**
 * Task query interface
 */
export interface TaskQuery {
    /** Filter by IDs */
    ids?: TaskId[];
    /** Filter by status */
    status?: TaskStatus[];
    /** Filter by category */
    category?: TaskCategory[];
    /** Filter by priority */
    priority?: TaskPriority[];
    /** Filter by assigned agent */
    assignedAgent?: AgentId;
    /** Filter by feature */
    featureId?: FeatureId;
    /** Filter by tags */
    tags?: string[];
    /** Filter by date range */
    dateRange?: {
        from: Date;
        to: Date;
    };
    /** Text search */
    search?: string;
    /** Sort order */
    sortBy?: TaskSortField;
    /** Sort direction */
    sortDirection?: 'asc' | 'desc';
    /** Result limit */
    limit?: number;
    /** Result offset */
    offset?: number;
}
/**
 * Task sort fields
 */
export declare enum TaskSortField {
    CREATED_AT = "createdAt",
    UPDATED_AT = "updatedAt",
    PRIORITY = "priority",
    STATUS = "status",
    TITLE = "title",
    ESTIMATED_EFFORT = "estimatedEffort",
    ACTUAL_EFFORT = "actualEffort"
}
