/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
// packages/core/src/task/types.ts
export var TaskStatus;
(function (TaskStatus) {
    TaskStatus["Todo"] = "todo";
    TaskStatus["InProgress"] = "in_progress";
    TaskStatus["Done"] = "done";
    TaskStatus["Failed"] = "failed";
    TaskStatus["Blocked"] = "blocked";
})(TaskStatus || (TaskStatus = {}));
export var TaskPriority;
(function (TaskPriority) {
    TaskPriority["Low"] = "low";
    TaskPriority["Medium"] = "medium";
    TaskPriority["High"] = "high";
    TaskPriority["Critical"] = "critical";
})(TaskPriority || (TaskPriority = {}));
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
    TaskType["REFACTORING"] = "refactoring";
    TaskType["CRITICAL"] = "critical";
    TaskType["QUALITY"] = "quality";
})(TaskType || (TaskType = {}));
//# sourceMappingURL=types.js.map