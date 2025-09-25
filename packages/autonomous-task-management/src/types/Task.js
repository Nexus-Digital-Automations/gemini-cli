/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Task priority levels
 */
export var TaskPriority;
(function (TaskPriority) {
    TaskPriority["CRITICAL"] = "critical";
    TaskPriority["HIGH"] = "high";
    TaskPriority["MEDIUM"] = "medium";
    TaskPriority["LOW"] = "low";
    TaskPriority["BACKGROUND"] = "background";
})(TaskPriority || (TaskPriority = {}));
/**
 * Task status enumeration
 */
export var TaskStatus;
(function (TaskStatus) {
    TaskStatus["CREATED"] = "created";
    TaskStatus["QUEUED"] = "queued";
    TaskStatus["ASSIGNED"] = "assigned";
    TaskStatus["IN_PROGRESS"] = "in_progress";
    TaskStatus["BLOCKED"] = "blocked";
    TaskStatus["REVIEW"] = "review";
    TaskStatus["COMPLETED"] = "completed";
    TaskStatus["FAILED"] = "failed";
    TaskStatus["CANCELLED"] = "cancelled";
    TaskStatus["ARCHIVED"] = "archived";
})(TaskStatus || (TaskStatus = {}));
/**
 * Task categories for organization and routing
 */
export var TaskCategory;
(function (TaskCategory) {
    TaskCategory["FEATURE"] = "feature";
    TaskCategory["BUG_FIX"] = "bug_fix";
    TaskCategory["ENHANCEMENT"] = "enhancement";
    TaskCategory["REFACTORING"] = "refactoring";
    TaskCategory["TESTING"] = "testing";
    TaskCategory["DOCUMENTATION"] = "documentation";
    TaskCategory["SECURITY"] = "security";
    TaskCategory["PERFORMANCE"] = "performance";
    TaskCategory["MAINTENANCE"] = "maintenance";
    TaskCategory["RESEARCH"] = "research";
})(TaskCategory || (TaskCategory = {}));
/**
 * Task complexity levels for resource allocation
 */
export var TaskComplexity;
(function (TaskComplexity) {
    TaskComplexity["TRIVIAL"] = "trivial";
    TaskComplexity["SIMPLE"] = "simple";
    TaskComplexity["MODERATE"] = "moderate";
    TaskComplexity["COMPLEX"] = "complex";
    TaskComplexity["CRITICAL"] = "critical";
})(TaskComplexity || (TaskComplexity = {}));
/**
 * Task actions for history tracking
 */
export var TaskAction;
(function (TaskAction) {
    TaskAction["CREATED"] = "created";
    TaskAction["QUEUED"] = "queued";
    TaskAction["ASSIGNED"] = "assigned";
    TaskAction["STARTED"] = "started";
    TaskAction["UPDATED"] = "updated";
    TaskAction["BLOCKED"] = "blocked";
    TaskAction["UNBLOCKED"] = "unblocked";
    TaskAction["PAUSED"] = "paused";
    TaskAction["RESUMED"] = "resumed";
    TaskAction["COMPLETED"] = "completed";
    TaskAction["FAILED"] = "failed";
    TaskAction["CANCELLED"] = "cancelled";
    TaskAction["ARCHIVED"] = "archived";
    TaskAction["COMMENT_ADDED"] = "comment_added";
})(TaskAction || (TaskAction = {}));
/**
 * Artifact types
 */
export var ArtifactType;
(function (ArtifactType) {
    ArtifactType["SOURCE_CODE"] = "source_code";
    ArtifactType["TEST_REPORT"] = "test_report";
    ArtifactType["COVERAGE_REPORT"] = "coverage_report";
    ArtifactType["LINT_REPORT"] = "lint_report";
    ArtifactType["SECURITY_REPORT"] = "security_report";
    ArtifactType["PERFORMANCE_REPORT"] = "performance_report";
    ArtifactType["BUILD_ARTIFACT"] = "build_artifact";
    ArtifactType["DOCUMENTATION"] = "documentation";
    ArtifactType["LOG_FILE"] = "log_file";
    ArtifactType["SCREENSHOT"] = "screenshot";
    ArtifactType["OTHER"] = "other";
})(ArtifactType || (ArtifactType = {}));
/**
 * Task sort fields
 */
export var TaskSortField;
(function (TaskSortField) {
    TaskSortField["CREATED_AT"] = "createdAt";
    TaskSortField["UPDATED_AT"] = "updatedAt";
    TaskSortField["PRIORITY"] = "priority";
    TaskSortField["STATUS"] = "status";
    TaskSortField["TITLE"] = "title";
    TaskSortField["ESTIMATED_EFFORT"] = "estimatedEffort";
    TaskSortField["ACTUAL_EFFORT"] = "actualEffort";
})(TaskSortField || (TaskSortField = {}));
//# sourceMappingURL=Task.js.map