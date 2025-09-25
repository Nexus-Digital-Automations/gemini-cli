/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Task priority levels for queue management
 */
export var TaskPriority;
(function (TaskPriority) {
    TaskPriority[TaskPriority["CRITICAL"] = 1] = "CRITICAL";
    TaskPriority[TaskPriority["HIGH"] = 2] = "HIGH";
    TaskPriority[TaskPriority["MEDIUM"] = 3] = "MEDIUM";
    TaskPriority[TaskPriority["LOW"] = 4] = "LOW";
    TaskPriority[TaskPriority["BACKGROUND"] = 5] = "BACKGROUND";
})(TaskPriority || (TaskPriority = {}));
/**
 * Task status during execution lifecycle
 */
export var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "pending";
    TaskStatus["IN_PROGRESS"] = "in_progress";
    TaskStatus["COMPLETED"] = "completed";
    TaskStatus["FAILED"] = "failed";
    TaskStatus["CANCELLED"] = "cancelled";
    TaskStatus["BLOCKED"] = "blocked";
    TaskStatus["RETRYING"] = "retrying";
})(TaskStatus || (TaskStatus = {}));
/**
 * Task types for categorization and specialized handling
 */
export var TaskType;
(function (TaskType) {
    TaskType["CODE_GENERATION"] = "code_generation";
    TaskType["CODE_ANALYSIS"] = "code_analysis";
    TaskType["TESTING"] = "testing";
    TaskType["DOCUMENTATION"] = "documentation";
    TaskType["BUILD"] = "build";
    TaskType["DEPLOYMENT"] = "deployment";
    TaskType["REFACTORING"] = "refactoring";
    TaskType["BUG_FIX"] = "bug_fix";
    TaskType["FEATURE"] = "feature";
    TaskType["MAINTENANCE"] = "maintenance";
    TaskType["SECURITY"] = "security";
    TaskType["PERFORMANCE"] = "performance";
})(TaskType || (TaskType = {}));
//# sourceMappingURL=TaskInterfaces.js.map