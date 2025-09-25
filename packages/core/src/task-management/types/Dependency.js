/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Dependency relationship types
 */
export var DependencyType;
(function (DependencyType) {
    /** Task B must complete before Task A can start */
    DependencyType["FINISH_TO_START"] = "finish_to_start";
    /** Task B must start before Task A can start */
    DependencyType["START_TO_START"] = "start_to_start";
    /** Task B must complete before Task A can complete */
    DependencyType["FINISH_TO_FINISH"] = "finish_to_finish";
    /** Task B must start before Task A can complete */
    DependencyType["START_TO_FINISH"] = "start_to_finish";
    /** Resource dependency - shared resource constraint */
    DependencyType["RESOURCE"] = "resource";
    /** Data dependency - output of B is input to A */
    DependencyType["DATA"] = "data";
    /** Control dependency - conditional execution */
    DependencyType["CONTROL"] = "control";
    /** Anti-dependency - false dependency for optimization */
    DependencyType["ANTI"] = "anti";
})(DependencyType || (DependencyType = {}));
/**
 * Dependency strength levels for conflict resolution
 */
export var DependencyStrength;
(function (DependencyStrength) {
    /** Cannot be violated under any circumstances */
    DependencyStrength["HARD"] = "hard";
    /** Strong preference but can be violated for optimization */
    DependencyStrength["SOFT"] = "soft";
    /** Optimization hint that can be ignored */
    DependencyStrength["HINT"] = "hint";
    /** User-defined custom strength */
    DependencyStrength["CUSTOM"] = "custom";
})(DependencyStrength || (DependencyStrength = {}));
/**
 * Dependency violation resolution strategies
 */
export var ViolationResolution;
(function (ViolationResolution) {
    /** Fail immediately on violation */
    ViolationResolution["FAIL_FAST"] = "fail_fast";
    /** Queue task until dependencies are satisfied */
    ViolationResolution["QUEUE_WAIT"] = "queue_wait";
    /** Execute with warning but log violation */
    ViolationResolution["WARN_AND_CONTINUE"] = "warn_and_continue";
    /** Attempt automatic resolution */
    ViolationResolution["AUTO_RESOLVE"] = "auto_resolve";
    /** Request manual intervention */
    ViolationResolution["MANUAL_RESOLVE"] = "manual_resolve";
})(ViolationResolution || (ViolationResolution = {}));
/**
 * Dependency status enumeration
 */
export var DependencyStatus;
(function (DependencyStatus) {
    /** Dependency is active and enforced */
    DependencyStatus["ACTIVE"] = "active";
    /** Dependency is satisfied */
    DependencyStatus["SATISFIED"] = "satisfied";
    /** Dependency is violated */
    DependencyStatus["VIOLATED"] = "violated";
    /** Dependency is suspended temporarily */
    DependencyStatus["SUSPENDED"] = "suspended";
    /** Dependency is disabled */
    DependencyStatus["DISABLED"] = "disabled";
    /** Dependency is pending evaluation */
    DependencyStatus["PENDING"] = "pending";
})(DependencyStatus || (DependencyStatus = {}));
/**
 * Violation types
 */
export var ViolationType;
(function (ViolationType) {
    /** Circular dependency detected */
    ViolationType["CIRCULAR_DEPENDENCY"] = "circular_dependency";
    /** Timing constraint violated */
    ViolationType["TIMING_VIOLATION"] = "timing_violation";
    /** Resource conflict */
    ViolationType["RESOURCE_CONFLICT"] = "resource_conflict";
    /** Data consistency violation */
    ViolationType["DATA_VIOLATION"] = "data_violation";
    /** Control condition not met */
    ViolationType["CONTROL_VIOLATION"] = "control_violation";
    /** Custom violation */
    ViolationType["CUSTOM"] = "custom";
})(ViolationType || (ViolationType = {}));
/**
 * Violation severity levels
 */
export var ViolationSeverity;
(function (ViolationSeverity) {
    /** Critical violation that must be resolved immediately */
    ViolationSeverity["CRITICAL"] = "critical";
    /** High severity violation */
    ViolationSeverity["HIGH"] = "high";
    /** Medium severity violation */
    ViolationSeverity["MEDIUM"] = "medium";
    /** Low severity violation */
    ViolationSeverity["LOW"] = "low";
    /** Informational violation */
    ViolationSeverity["INFO"] = "info";
})(ViolationSeverity || (ViolationSeverity = {}));
/**
 * Node execution status
 */
export var NodeExecutionStatus;
(function (NodeExecutionStatus) {
    /** Not ready to execute (dependencies not satisfied) */
    NodeExecutionStatus["NOT_READY"] = "not_ready";
    /** Ready to execute */
    NodeExecutionStatus["READY"] = "ready";
    /** Currently executing */
    NodeExecutionStatus["EXECUTING"] = "executing";
    /** Completed successfully */
    NodeExecutionStatus["COMPLETED"] = "completed";
    /** Failed execution */
    NodeExecutionStatus["FAILED"] = "failed";
    /** Execution cancelled */
    NodeExecutionStatus["CANCELLED"] = "cancelled";
    /** Blocked by violation */
    NodeExecutionStatus["BLOCKED"] = "blocked";
})(NodeExecutionStatus || (NodeExecutionStatus = {}));
/**
 * Graph complexity levels
 */
export var GraphComplexity;
(function (GraphComplexity) {
    /** Simple linear dependencies */
    GraphComplexity["SIMPLE"] = "simple";
    /** Moderate branching */
    GraphComplexity["MODERATE"] = "moderate";
    /** Complex with multiple paths */
    GraphComplexity["COMPLEX"] = "complex";
    /** Highly complex with optimization challenges */
    GraphComplexity["CRITICAL"] = "critical";
})(GraphComplexity || (GraphComplexity = {}));
/**
 * Graph error types
 */
export var GraphErrorType;
(function (GraphErrorType) {
    /** Circular dependency cycle */
    GraphErrorType["CIRCULAR_DEPENDENCY"] = "circular_dependency";
    /** Orphaned node */
    GraphErrorType["ORPHANED_NODE"] = "orphaned_node";
    /** Invalid edge reference */
    GraphErrorType["INVALID_EDGE"] = "invalid_edge";
    /** Resource conflict */
    GraphErrorType["RESOURCE_CONFLICT"] = "resource_conflict";
    /** Timing inconsistency */
    GraphErrorType["TIMING_INCONSISTENCY"] = "timing_inconsistency";
    /** Data flow violation */
    GraphErrorType["DATA_FLOW_VIOLATION"] = "data_flow_violation";
})(GraphErrorType || (GraphErrorType = {}));
/**
 * Graph warning types
 */
export var GraphWarningType;
(function (GraphWarningType) {
    /** Long dependency chain */
    GraphWarningType["LONG_CHAIN"] = "long_chain";
    /** Potential bottleneck */
    GraphWarningType["BOTTLENECK"] = "bottleneck";
    /** Inefficient structure */
    GraphWarningType["INEFFICIENT_STRUCTURE"] = "inefficient_structure";
    /** Resource underutilization */
    GraphWarningType["UNDERUTILIZATION"] = "underutilization";
})(GraphWarningType || (GraphWarningType = {}));
/**
 * Optimization types
 */
export var OptimizationType;
(function (OptimizationType) {
    /** Parallel execution opportunity */
    OptimizationType["PARALLELIZATION"] = "parallelization";
    /** Resource optimization */
    OptimizationType["RESOURCE_OPTIMIZATION"] = "resource_optimization";
    /** Dependency reduction */
    OptimizationType["DEPENDENCY_REDUCTION"] = "dependency_reduction";
    /** Task merging opportunity */
    OptimizationType["TASK_MERGING"] = "task_merging";
    /** Caching opportunity */
    OptimizationType["CACHING"] = "caching";
    /** Pipeline optimization */
    OptimizationType["PIPELINE_OPTIMIZATION"] = "pipeline_optimization";
})(OptimizationType || (OptimizationType = {}));
/**
 * Optimization complexity levels
 */
export var OptimizationComplexity;
(function (OptimizationComplexity) {
    /** Simple to implement */
    OptimizationComplexity["LOW"] = "low";
    /** Moderate implementation effort */
    OptimizationComplexity["MEDIUM"] = "medium";
    /** Complex implementation */
    OptimizationComplexity["HIGH"] = "high";
    /** Very complex, may not be worth it */
    OptimizationComplexity["CRITICAL"] = "critical";
})(OptimizationComplexity || (OptimizationComplexity = {}));
/**
 * Recommendation types
 */
export var RecommendationType;
(function (RecommendationType) {
    /** Adjust task priority */
    RecommendationType["PRIORITY_ADJUSTMENT"] = "priority_adjustment";
    /** Change execution timing */
    RecommendationType["TIMING_ADJUSTMENT"] = "timing_adjustment";
    /** Resource reallocation */
    RecommendationType["RESOURCE_REALLOCATION"] = "resource_reallocation";
    /** Dependency modification */
    RecommendationType["DEPENDENCY_MODIFICATION"] = "dependency_modification";
    /** Agent assignment change */
    RecommendationType["AGENT_REASSIGNMENT"] = "agent_reassignment";
})(RecommendationType || (RecommendationType = {}));
//# sourceMappingURL=Dependency.js.map