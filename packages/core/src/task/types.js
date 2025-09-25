/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// packages/core/src/task/types.ts
export let TaskStatus = {};
(function (TaskStatus) {
    TaskStatus["Todo"] = "todo";
    TaskStatus["InProgress"] = "in_progress";
    TaskStatus["Done"] = "done";
    TaskStatus["Failed"] = "failed";
    TaskStatus["Blocked"] = "blocked";
})(TaskStatus || (TaskStatus = {}));
export let TaskPriority = {};
(function (TaskPriority) {
    TaskPriority["Low"] = "low";
    TaskPriority["Medium"] = "medium";
    TaskPriority["High"] = "high";
    TaskPriority["Critical"] = "critical";
})(TaskPriority || (TaskPriority = {}));
//# sourceMappingURL=types.js.map