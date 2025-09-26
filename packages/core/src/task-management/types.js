/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Re-export enums from TaskQueue and TaskExecutionEngine for backward compatibility
export { TaskPriority, TaskStatus, TaskCategory } from './TaskQueue.js';
export { TaskType } from './TaskExecutionEngine.js';
export var TaskComplexity;
(function (TaskComplexity) {
    TaskComplexity["TRIVIAL"] = "trivial";
    TaskComplexity["SIMPLE"] = "simple";
    TaskComplexity["MODERATE"] = "moderate";
    TaskComplexity["COMPLEX"] = "complex";
    TaskComplexity["ENTERPRISE"] = "enterprise";
})(TaskComplexity || (TaskComplexity = {}));
//# sourceMappingURL=types.js.map