/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { TaskId, Task } from './Task';
/**
 * Unique identifier for dependency nodes
 */
export type DependencyNodeId = string;
/**
 * Unique identifier for dependency edges
 */
export type DependencyEdgeId = string;
/**
 * Dependency relationship types
 */
export declare enum DependencyType {
    /** Task B must complete before Task A can start */
    FINISH_TO_START = "finish_to_start",
    /** Task B must start before Task A can start */
    START_TO_START = "start_to_start",
    /** Task B must complete before Task A can complete */
    FINISH_TO_FINISH = "finish_to_finish",
    /** Task B must start before Task A can complete */
    START_TO_FINISH = "start_to_finish",
    /** Resource dependency - shared resource constraint */
    RESOURCE = "resource",
    /** Data dependency - output of B is input to A */
    DATA = "data",
    /** Control dependency - conditional execution */
    CONTROL = "control",
    /** Anti-dependency - false dependency for optimization */
    ANTI = "anti"
}
/**
 * Dependency strength levels for conflict resolution
 */
export declare enum DependencyStrength {
    /** Cannot be violated under any circumstances */
    HARD = "hard",
    /** Strong preference but can be violated for optimization */
    SOFT = "soft",
    /** Optimization hint that can be ignored */
    HINT = "hint",
    /** User-defined custom strength */
    CUSTOM = "custom"
}
/**
 * Dependency violation resolution strategies
 */
export declare enum ViolationResolution {
    /** Fail immediately on violation */
    FAIL_FAST = "fail_fast",
    /** Queue task until dependencies are satisfied */
    QUEUE_WAIT = "queue_wait",
    /** Execute with warning but log violation */
    WARN_AND_CONTINUE = "warn_and_continue",
    /** Attempt automatic resolution */
    AUTO_RESOLVE = "auto_resolve",
    /** Request manual intervention */
    MANUAL_RESOLVE = "manual_resolve"
}
/**
 * Dependency constraint interface
 */
export interface DependencyConstraint {
    /** Constraint identifier */
    id: string;
    /** Constraint type */
    type: DependencyType;
    /** Constraint strength */
    strength: DependencyStrength;
    /** Minimum delay between tasks in milliseconds */
    minDelay?: number;
    /** Maximum delay between tasks in milliseconds */
    maxDelay?: number;
    /** Resource requirements */
    resourceRequirements?: ResourceRequirement[];
    /** Data requirements */
    dataRequirements?: DataRequirement[];
    /** Conditional logic for control dependencies */
    condition?: DependencyCondition;
    /** Custom constraint properties */
    properties: Record<string, any>;
}
/**
 * Resource requirement specification
 */
export interface ResourceRequirement {
    /** Resource identifier */
    resourceId: string;
    /** Resource type */
    resourceType: string;
    /** Required quantity */
    quantity: number;
    /** Exclusive access required */
    exclusive: boolean;
    /** Duration of resource usage in milliseconds */
    duration?: number;
}
/**
 * Data requirement specification
 */
export interface DataRequirement {
    /** Data identifier */
    dataId: string;
    /** Data type */
    dataType: string;
    /** Data format */
    format: string;
    /** Minimum data size in bytes */
    minSize?: number;
    /** Maximum data age in milliseconds */
    maxAge?: number;
    /** Data validation rules */
    validationRules: DataValidationRule[];
}
/**
 * Data validation rule
 */
export interface DataValidationRule {
    /** Rule identifier */
    id: string;
    /** Rule type */
    type: 'schema' | 'checksum' | 'signature' | 'custom';
    /** Rule expression */
    expression: string;
    /** Rule priority */
    priority: number;
}
/**
 * Dependency condition for control dependencies
 */
export interface DependencyCondition {
    /** Condition expression */
    expression: string;
    /** Condition variables */
    variables: Record<string, any>;
    /** Evaluation context */
    context?: Record<string, any>;
}
/**
 * Dependency edge representing relationship between tasks
 */
export interface DependencyEdge {
    /** Unique edge identifier */
    id: DependencyEdgeId;
    /** Source task (dependency) */
    from: TaskId;
    /** Target task (dependent) */
    to: TaskId;
    /** Dependency constraint */
    constraint: DependencyConstraint;
    /** Edge weight for optimization */
    weight: number;
    /** Edge metadata */
    metadata: DependencyEdgeMetadata;
    /** Edge status */
    status: DependencyStatus;
    /** Edge timestamps */
    timestamps: DependencyTimestamps;
    /** Violation history */
    violations: DependencyViolation[];
}
/**
 * Dependency edge metadata
 */
export interface DependencyEdgeMetadata {
    /** Edge creator */
    createdBy: string;
    /** Edge source system */
    source: string;
    /** Edge tags */
    tags: string[];
    /** Edge description */
    description?: string;
    /** Custom properties */
    properties: Record<string, any>;
}
/**
 * Dependency status enumeration
 */
export declare enum DependencyStatus {
    /** Dependency is active and enforced */
    ACTIVE = "active",
    /** Dependency is satisfied */
    SATISFIED = "satisfied",
    /** Dependency is violated */
    VIOLATED = "violated",
    /** Dependency is suspended temporarily */
    SUSPENDED = "suspended",
    /** Dependency is disabled */
    DISABLED = "disabled",
    /** Dependency is pending evaluation */
    PENDING = "pending"
}
/**
 * Dependency timestamps
 */
export interface DependencyTimestamps {
    /** Creation timestamp */
    createdAt: Date;
    /** Last update timestamp */
    updatedAt: Date;
    /** Last evaluation timestamp */
    lastEvaluatedAt?: Date;
    /** Last satisfaction timestamp */
    lastSatisfiedAt?: Date;
    /** Last violation timestamp */
    lastViolatedAt?: Date;
}
/**
 * Dependency violation record
 */
export interface DependencyViolation {
    /** Violation identifier */
    id: string;
    /** Violation timestamp */
    timestamp: Date;
    /** Violation type */
    type: ViolationType;
    /** Violation severity */
    severity: ViolationSeverity;
    /** Violation description */
    description: string;
    /** Resolution action taken */
    resolution?: ViolationResolution;
    /** Resolution details */
    resolutionDetails?: string;
    /** Violation context */
    context: Record<string, any>;
}
/**
 * Violation types
 */
export declare enum ViolationType {
    /** Circular dependency detected */
    CIRCULAR_DEPENDENCY = "circular_dependency",
    /** Timing constraint violated */
    TIMING_VIOLATION = "timing_violation",
    /** Resource conflict */
    RESOURCE_CONFLICT = "resource_conflict",
    /** Data consistency violation */
    DATA_VIOLATION = "data_violation",
    /** Control condition not met */
    CONTROL_VIOLATION = "control_violation",
    /** Custom violation */
    CUSTOM = "custom"
}
/**
 * Violation severity levels
 */
export declare enum ViolationSeverity {
    /** Critical violation that must be resolved immediately */
    CRITICAL = "critical",
    /** High severity violation */
    HIGH = "high",
    /** Medium severity violation */
    MEDIUM = "medium",
    /** Low severity violation */
    LOW = "low",
    /** Informational violation */
    INFO = "info"
}
/**
 * Dependency node representing a task in the graph
 */
export interface DependencyNode {
    /** Node identifier (maps to TaskId) */
    id: DependencyNodeId;
    /** Associated task reference */
    task: Task;
    /** Incoming edges (dependencies) */
    incomingEdges: DependencyEdgeId[];
    /** Outgoing edges (dependents) */
    outgoingEdges: DependencyEdgeId[];
    /** Node metadata */
    metadata: DependencyNodeMetadata;
    /** Node execution state */
    executionState: NodeExecutionState;
    /** Node scheduling information */
    schedulingInfo: NodeSchedulingInfo;
}
/**
 * Dependency node metadata
 */
export interface DependencyNodeMetadata {
    /** Node level in the dependency hierarchy */
    level: number;
    /** Critical path indicator */
    onCriticalPath: boolean;
    /** Parallel execution group */
    parallelGroup?: string;
    /** Resource requirements */
    resourceRequirements: ResourceRequirement[];
    /** Execution priority override */
    priorityOverride?: number;
    /** Custom properties */
    properties: Record<string, any>;
}
/**
 * Node execution state
 */
export interface NodeExecutionState {
    /** Current execution status */
    status: NodeExecutionStatus;
    /** Execution attempts */
    attempts: number;
    /** Last execution timestamp */
    lastExecutionAt?: Date;
    /** Execution duration */
    executionDuration?: number;
    /** Execution errors */
    errors: ExecutionError[];
}
/**
 * Node execution status
 */
export declare enum NodeExecutionStatus {
    /** Not ready to execute (dependencies not satisfied) */
    NOT_READY = "not_ready",
    /** Ready to execute */
    READY = "ready",
    /** Currently executing */
    EXECUTING = "executing",
    /** Completed successfully */
    COMPLETED = "completed",
    /** Failed execution */
    FAILED = "failed",
    /** Execution cancelled */
    CANCELLED = "cancelled",
    /** Blocked by violation */
    BLOCKED = "blocked"
}
/**
 * Execution error information
 */
export interface ExecutionError {
    /** Error timestamp */
    timestamp: Date;
    /** Error code */
    code: string;
    /** Error message */
    message: string;
    /** Error context */
    context: Record<string, any>;
    /** Stack trace */
    stack?: string;
}
/**
 * Node scheduling information
 */
export interface NodeSchedulingInfo {
    /** Earliest start time */
    earliestStart: Date;
    /** Latest start time */
    latestStart: Date;
    /** Earliest finish time */
    earliestFinish: Date;
    /** Latest finish time */
    latestFinish: Date;
    /** Total slack time in milliseconds */
    totalSlack: number;
    /** Free slack time in milliseconds */
    freeSlack: number;
    /** Scheduled start time */
    scheduledStart?: Date;
    /** Scheduled finish time */
    scheduledFinish?: Date;
}
/**
 * Dependency graph interface
 */
export interface DependencyGraph {
    /** Graph identifier */
    id: string;
    /** Graph name */
    name: string;
    /** Graph description */
    description: string;
    /** All nodes in the graph */
    nodes: Map<DependencyNodeId, DependencyNode>;
    /** All edges in the graph */
    edges: Map<DependencyEdgeId, DependencyEdge>;
    /** Graph metadata */
    metadata: DependencyGraphMetadata;
    /** Graph validation status */
    validationStatus: GraphValidationStatus;
    /** Graph statistics */
    statistics: DependencyGraphStatistics;
    /** Graph timestamps */
    timestamps: DependencyTimestamps;
}
/**
 * Dependency graph metadata
 */
export interface DependencyGraphMetadata {
    /** Graph version */
    version: string;
    /** Graph creator */
    createdBy: string;
    /** Graph tags */
    tags: string[];
    /** Graph complexity level */
    complexity: GraphComplexity;
    /** Custom properties */
    properties: Record<string, any>;
}
/**
 * Graph complexity levels
 */
export declare enum GraphComplexity {
    /** Simple linear dependencies */
    SIMPLE = "simple",
    /** Moderate branching */
    MODERATE = "moderate",
    /** Complex with multiple paths */
    COMPLEX = "complex",
    /** Highly complex with optimization challenges */
    CRITICAL = "critical"
}
/**
 * Graph validation status
 */
export interface GraphValidationStatus {
    /** Overall validation result */
    isValid: boolean;
    /** Validation timestamp */
    validatedAt: Date;
    /** Validation errors */
    errors: GraphValidationError[];
    /** Validation warnings */
    warnings: GraphValidationWarning[];
    /** Circular dependencies detected */
    circularDependencies: CircularDependency[];
}
/**
 * Graph validation error
 */
export interface GraphValidationError {
    /** Error identifier */
    id: string;
    /** Error type */
    type: GraphErrorType;
    /** Error message */
    message: string;
    /** Affected nodes */
    affectedNodes: DependencyNodeId[];
    /** Affected edges */
    affectedEdges: DependencyEdgeId[];
    /** Suggested resolution */
    suggestedResolution?: string;
}
/**
 * Graph validation warning
 */
export interface GraphValidationWarning {
    /** Warning identifier */
    id: string;
    /** Warning type */
    type: GraphWarningType;
    /** Warning message */
    message: string;
    /** Warning severity */
    severity: ViolationSeverity;
    /** Affected nodes */
    affectedNodes: DependencyNodeId[];
}
/**
 * Graph error types
 */
export declare enum GraphErrorType {
    /** Circular dependency cycle */
    CIRCULAR_DEPENDENCY = "circular_dependency",
    /** Orphaned node */
    ORPHANED_NODE = "orphaned_node",
    /** Invalid edge reference */
    INVALID_EDGE = "invalid_edge",
    /** Resource conflict */
    RESOURCE_CONFLICT = "resource_conflict",
    /** Timing inconsistency */
    TIMING_INCONSISTENCY = "timing_inconsistency",
    /** Data flow violation */
    DATA_FLOW_VIOLATION = "data_flow_violation"
}
/**
 * Graph warning types
 */
export declare enum GraphWarningType {
    /** Long dependency chain */
    LONG_CHAIN = "long_chain",
    /** Potential bottleneck */
    BOTTLENECK = "bottleneck",
    /** Inefficient structure */
    INEFFICIENT_STRUCTURE = "inefficient_structure",
    /** Resource underutilization */
    UNDERUTILIZATION = "underutilization"
}
/**
 * Circular dependency representation
 */
export interface CircularDependency {
    /** Cycle identifier */
    id: string;
    /** Nodes in the cycle */
    cycle: DependencyNodeId[];
    /** Edges forming the cycle */
    edges: DependencyEdgeId[];
    /** Cycle length */
    length: number;
    /** Cycle detection timestamp */
    detectedAt: Date;
    /** Suggested breaking points */
    breakingPoints: BreakingPoint[];
}
/**
 * Cycle breaking point suggestion
 */
export interface BreakingPoint {
    /** Edge to break */
    edgeId: DependencyEdgeId;
    /** Break cost (impact score) */
    cost: number;
    /** Break justification */
    justification: string;
    /** Alternative solutions */
    alternatives: string[];
}
/**
 * Dependency graph statistics
 */
export interface DependencyGraphStatistics {
    /** Total number of nodes */
    nodeCount: number;
    /** Total number of edges */
    edgeCount: number;
    /** Graph density (edges/max_possible_edges) */
    density: number;
    /** Maximum dependency depth */
    maxDepth: number;
    /** Average dependency depth */
    averageDepth: number;
    /** Critical path length */
    criticalPathLength: number;
    /** Parallel execution opportunities */
    parallelOpportunities: number;
    /** Resource utilization efficiency */
    resourceEfficiency: number;
    /** Graph complexity score */
    complexityScore: number;
}
/**
 * Dependency analysis result
 */
export interface DependencyAnalysisResult {
    /** Analysis timestamp */
    analyzedAt: Date;
    /** Execution order (topological sort) */
    executionOrder: DependencyNodeId[];
    /** Critical path */
    criticalPath: CriticalPath;
    /** Parallel execution groups */
    parallelGroups: ParallelGroup[];
    /** Optimization opportunities */
    optimizations: OptimizationOpportunity[];
    /** Resource allocation plan */
    resourcePlan: ResourceAllocation[];
    /** Scheduling recommendations */
    schedulingRecommendations: SchedulingRecommendation[];
}
/**
 * Critical path information
 */
export interface CriticalPath {
    /** Nodes on critical path */
    nodes: DependencyNodeId[];
    /** Total duration in milliseconds */
    duration: number;
    /** Path bottlenecks */
    bottlenecks: Bottleneck[];
    /** Optimization potential */
    optimizationPotential: number;
}
/**
 * Bottleneck information
 */
export interface Bottleneck {
    /** Bottleneck node */
    nodeId: DependencyNodeId;
    /** Bottleneck severity */
    severity: number;
    /** Bottleneck description */
    description: string;
    /** Resolution suggestions */
    suggestions: string[];
}
/**
 * Parallel execution group
 */
export interface ParallelGroup {
    /** Group identifier */
    id: string;
    /** Nodes in parallel group */
    nodes: DependencyNodeId[];
    /** Group execution level */
    level: number;
    /** Resource requirements */
    resourceRequirements: ResourceRequirement[];
    /** Estimated execution time */
    estimatedDuration: number;
}
/**
 * Optimization opportunity
 */
export interface OptimizationOpportunity {
    /** Opportunity identifier */
    id: string;
    /** Opportunity type */
    type: OptimizationType;
    /** Potential improvement percentage */
    improvement: number;
    /** Implementation complexity */
    complexity: OptimizationComplexity;
    /** Description */
    description: string;
    /** Implementation steps */
    steps: string[];
}
/**
 * Optimization types
 */
export declare enum OptimizationType {
    /** Parallel execution opportunity */
    PARALLELIZATION = "parallelization",
    /** Resource optimization */
    RESOURCE_OPTIMIZATION = "resource_optimization",
    /** Dependency reduction */
    DEPENDENCY_REDUCTION = "dependency_reduction",
    /** Task merging opportunity */
    TASK_MERGING = "task_merging",
    /** Caching opportunity */
    CACHING = "caching",
    /** Pipeline optimization */
    PIPELINE_OPTIMIZATION = "pipeline_optimization"
}
/**
 * Optimization complexity levels
 */
export declare enum OptimizationComplexity {
    /** Simple to implement */
    LOW = "low",
    /** Moderate implementation effort */
    MEDIUM = "medium",
    /** Complex implementation */
    HIGH = "high",
    /** Very complex, may not be worth it */
    CRITICAL = "critical"
}
/**
 * Resource allocation plan
 */
export interface ResourceAllocation {
    /** Resource identifier */
    resourceId: string;
    /** Allocation timeline */
    timeline: AllocationSlot[];
    /** Utilization percentage */
    utilization: number;
    /** Conflicts detected */
    conflicts: ResourceConflict[];
}
/**
 * Resource allocation slot
 */
export interface AllocationSlot {
    /** Slot start time */
    startTime: Date;
    /** Slot end time */
    endTime: Date;
    /** Allocated task */
    taskId: TaskId;
    /** Resource quantity allocated */
    quantity: number;
}
/**
 * Resource conflict
 */
export interface ResourceConflict {
    /** Conflict timestamp */
    timestamp: Date;
    /** Conflicting tasks */
    conflictingTasks: TaskId[];
    /** Conflict severity */
    severity: ViolationSeverity;
    /** Resolution suggestions */
    resolutionSuggestions: string[];
}
/**
 * Scheduling recommendation
 */
export interface SchedulingRecommendation {
    /** Recommendation identifier */
    id: string;
    /** Recommendation type */
    type: RecommendationType;
    /** Target task */
    taskId: TaskId;
    /** Recommended action */
    action: string;
    /** Expected benefit */
    benefit: string;
    /** Implementation priority */
    priority: number;
}
/**
 * Recommendation types
 */
export declare enum RecommendationType {
    /** Adjust task priority */
    PRIORITY_ADJUSTMENT = "priority_adjustment",
    /** Change execution timing */
    TIMING_ADJUSTMENT = "timing_adjustment",
    /** Resource reallocation */
    RESOURCE_REALLOCATION = "resource_reallocation",
    /** Dependency modification */
    DEPENDENCY_MODIFICATION = "dependency_modification",
    /** Agent assignment change */
    AGENT_REASSIGNMENT = "agent_reassignment"
}
