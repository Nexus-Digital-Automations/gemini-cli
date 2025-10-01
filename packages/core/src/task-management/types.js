/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
// Define enums locally for task management types compatibility
export var TaskPriority;
(function (TaskPriority) {
    TaskPriority[TaskPriority["CRITICAL"] = 1000] = "CRITICAL";
    TaskPriority[TaskPriority["HIGH"] = 800] = "HIGH";
    TaskPriority[TaskPriority["NORMAL"] = 500] = "NORMAL";
    TaskPriority[TaskPriority["MEDIUM"] = 400] = "MEDIUM";
    TaskPriority[TaskPriority["LOW"] = 200] = "LOW";
    TaskPriority[TaskPriority["BACKGROUND"] = 50] = "BACKGROUND";
})(TaskPriority || (TaskPriority = {}));
export var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "pending";
    TaskStatus["QUEUED"] = "queued";
    TaskStatus["ANALYZED"] = "analyzed";
    TaskStatus["ASSIGNED"] = "assigned";
    TaskStatus["IN_PROGRESS"] = "in_progress";
    TaskStatus["RUNNING"] = "running";
    TaskStatus["BLOCKED"] = "blocked";
    TaskStatus["VALIDATION"] = "validation";
    TaskStatus["COMPLETED"] = "completed";
    TaskStatus["FAILED"] = "failed";
    TaskStatus["CANCELLED"] = "cancelled";
})(TaskStatus || (TaskStatus = {}));
export var TaskCategory;
(function (TaskCategory) {
    TaskCategory["FEATURE"] = "feature";
    TaskCategory["BUG_FIX"] = "bug_fix";
    TaskCategory["TEST"] = "test";
    TaskCategory["DOCUMENTATION"] = "documentation";
    TaskCategory["REFACTOR"] = "refactor";
    TaskCategory["SECURITY"] = "security";
    TaskCategory["PERFORMANCE"] = "performance";
    TaskCategory["INFRASTRUCTURE"] = "infrastructure";
})(TaskCategory || (TaskCategory = {}));
export var TaskType;
(function (TaskType) {
    TaskType["IMPLEMENTATION"] = "implementation";
    TaskType["TESTING"] = "testing";
    TaskType["VALIDATION"] = "validation";
    TaskType["DOCUMENTATION"] = "documentation";
    TaskType["ANALYSIS"] = "analysis";
    TaskType["DEPLOYMENT"] = "deployment";
    TaskType["SECURITY"] = "security";
    TaskType["PERFORMANCE"] = "performance";
})(TaskType || (TaskType = {}));
export var TaskComplexity;
(function (TaskComplexity) {
    TaskComplexity["TRIVIAL"] = "trivial";
    TaskComplexity["SIMPLE"] = "simple";
    TaskComplexity["MODERATE"] = "moderate";
    TaskComplexity["COMPLEX"] = "complex";
    TaskComplexity["ENTERPRISE"] = "enterprise";
})(TaskComplexity || (TaskComplexity = {}));
//# sourceMappingURL=types.js.map