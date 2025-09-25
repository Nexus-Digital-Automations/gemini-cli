/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { TaskPriority, TaskStatus, Task } from './Task';
/**
 * Queue types enumeration
 */
export var QueueType;
(function (QueueType) {
    QueueType["PRIORITY"] = "priority";
    QueueType["FIFO"] = "fifo";
    QueueType["LIFO"] = "lifo";
    QueueType["DEPENDENCY"] = "dependency";
    QueueType["ROUND_ROBIN"] = "round_robin";
    QueueType["FAIR_SHARE"] = "fair_share";
    QueueType["CUSTOM"] = "custom";
})(QueueType || (QueueType = {}));
/**
 * Queue status enumeration
 */
export var QueueStatus;
(function (QueueStatus) {
    QueueStatus["ACTIVE"] = "active";
    QueueStatus["PAUSED"] = "paused";
    QueueStatus["DRAINING"] = "draining";
    QueueStatus["STOPPED"] = "stopped";
    QueueStatus["ERROR"] = "error";
})(QueueStatus || (QueueStatus = {}));
/**
 * Attempt status enumeration
 */
export var AttemptStatus;
(function (AttemptStatus) {
    AttemptStatus["PENDING"] = "pending";
    AttemptStatus["ASSIGNED"] = "assigned";
    AttemptStatus["IN_PROGRESS"] = "in_progress";
    AttemptStatus["COMPLETED"] = "completed";
    AttemptStatus["FAILED"] = "failed";
    AttemptStatus["CANCELLED"] = "cancelled";
    AttemptStatus["TIMEOUT"] = "timeout";
})(AttemptStatus || (AttemptStatus = {}));
/**
 * Processing mode enumeration
 */
export var ProcessingMode;
(function (ProcessingMode) {
    ProcessingMode["PARALLEL"] = "parallel";
    ProcessingMode["SEQUENTIAL"] = "sequential";
    ProcessingMode["BATCH"] = "batch";
    ProcessingMode["STREAMING"] = "streaming";
})(ProcessingMode || (ProcessingMode = {}));
/**
 * Boost condition types
 */
export var BoostConditionType;
(function (BoostConditionType) {
    BoostConditionType["WAIT_TIME"] = "wait_time";
    BoostConditionType["RETRY_COUNT"] = "retry_count";
    BoostConditionType["DEADLINE_PROXIMITY"] = "deadline_proximity";
    BoostConditionType["AGENT_AVAILABILITY"] = "agent_availability";
    BoostConditionType["DEPENDENCY_STATUS"] = "dependency_status";
    BoostConditionType["CUSTOM"] = "custom";
})(BoostConditionType || (BoostConditionType = {}));
/**
 * Comparison operators
 */
export var ComparisonOperator;
(function (ComparisonOperator) {
    ComparisonOperator["EQUALS"] = "equals";
    ComparisonOperator["NOT_EQUALS"] = "not_equals";
    ComparisonOperator["GREATER_THAN"] = "greater_than";
    ComparisonOperator["LESS_THAN"] = "less_than";
    ComparisonOperator["GREATER_THAN_OR_EQUAL"] = "greater_than_or_equal";
    ComparisonOperator["LESS_THAN_OR_EQUAL"] = "less_than_or_equal";
    ComparisonOperator["CONTAINS"] = "contains";
    ComparisonOperator["MATCHES"] = "matches";
})(ComparisonOperator || (ComparisonOperator = {}));
/**
 * Dependency resolution strategy
 */
export var DependencyResolutionStrategy;
(function (DependencyResolutionStrategy) {
    DependencyResolutionStrategy["STRICT"] = "strict";
    DependencyResolutionStrategy["LENIENT"] = "lenient";
    DependencyResolutionStrategy["BEST_EFFORT"] = "best_effort";
    DependencyResolutionStrategy["PARALLEL"] = "parallel";
})(DependencyResolutionStrategy || (DependencyResolutionStrategy = {}));
/**
 * Circular dependency handling
 */
export var CircularDependencyHandling;
(function (CircularDependencyHandling) {
    CircularDependencyHandling["ERROR"] = "error";
    CircularDependencyHandling["WARNING"] = "warning";
    CircularDependencyHandling["IGNORE"] = "ignore";
    CircularDependencyHandling["AUTO_RESOLVE"] = "auto_resolve";
})(CircularDependencyHandling || (CircularDependencyHandling = {}));
/**
 * Scheduling algorithms
 */
export var SchedulingAlgorithm;
(function (SchedulingAlgorithm) {
    SchedulingAlgorithm["FIRST_COME_FIRST_SERVED"] = "fcfs";
    SchedulingAlgorithm["SHORTEST_JOB_FIRST"] = "sjf";
    SchedulingAlgorithm["PRIORITY_SCHEDULING"] = "priority";
    SchedulingAlgorithm["ROUND_ROBIN"] = "round_robin";
    SchedulingAlgorithm["MULTILEVEL_FEEDBACK"] = "multilevel_feedback";
    SchedulingAlgorithm["FAIR_SHARE"] = "fair_share";
    SchedulingAlgorithm["LOTTERY"] = "lottery";
})(SchedulingAlgorithm || (SchedulingAlgorithm = {}));
/**
 * Load balancing strategies
 */
export var LoadBalancingStrategy;
(function (LoadBalancingStrategy) {
    LoadBalancingStrategy["ROUND_ROBIN"] = "round_robin";
    LoadBalancingStrategy["LEAST_CONNECTIONS"] = "least_connections";
    LoadBalancingStrategy["LEAST_LOAD"] = "least_load";
    LoadBalancingStrategy["WEIGHTED_ROUND_ROBIN"] = "weighted_round_robin";
    LoadBalancingStrategy["CONSISTENT_HASH"] = "consistent_hash";
    LoadBalancingStrategy["RANDOM"] = "random";
})(LoadBalancingStrategy || (LoadBalancingStrategy = {}));
/**
 * Preemption strategies
 */
export var PreemptionStrategy;
(function (PreemptionStrategy) {
    PreemptionStrategy["PRIORITY_BASED"] = "priority_based";
    PreemptionStrategy["DEADLINE_BASED"] = "deadline_based";
    PreemptionStrategy["RESOURCE_BASED"] = "resource_based";
    PreemptionStrategy["CUSTOM"] = "custom";
})(PreemptionStrategy || (PreemptionStrategy = {}));
/**
 * Throttling strategies
 */
export var ThrottlingStrategy;
(function (ThrottlingStrategy) {
    ThrottlingStrategy["TOKEN_BUCKET"] = "token_bucket";
    ThrottlingStrategy["LEAKY_BUCKET"] = "leaky_bucket";
    ThrottlingStrategy["SLIDING_WINDOW"] = "sliding_window";
    ThrottlingStrategy["FIXED_WINDOW"] = "fixed_window";
})(ThrottlingStrategy || (ThrottlingStrategy = {}));
/**
 * Queue actions for history tracking
 */
export var QueueAction;
(function (QueueAction) {
    QueueAction["CREATED"] = "created";
    QueueAction["STARTED"] = "started";
    QueueAction["PAUSED"] = "paused";
    QueueAction["RESUMED"] = "resumed";
    QueueAction["STOPPED"] = "stopped";
    QueueAction["TASK_ENQUEUED"] = "task_enqueued";
    QueueAction["TASK_DEQUEUED"] = "task_dequeued";
    QueueAction["TASK_ASSIGNED"] = "task_assigned";
    QueueAction["TASK_COMPLETED"] = "task_completed";
    QueueAction["TASK_FAILED"] = "task_failed";
    QueueAction["TASK_RETRIED"] = "task_retried";
    QueueAction["CONFIGURATION_CHANGED"] = "configuration_changed";
    QueueAction["SIZE_LIMIT_REACHED"] = "size_limit_reached";
    QueueAction["THROTTLING_ACTIVATED"] = "throttling_activated";
})(QueueAction || (QueueAction = {}));
//# sourceMappingURL=Queue.js.map