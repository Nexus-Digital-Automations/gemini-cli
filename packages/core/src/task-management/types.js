/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export let TaskComplexity = {};
(function (TaskComplexity) {
  TaskComplexity['TRIVIAL'] = 'trivial';
  TaskComplexity['SIMPLE'] = 'simple';
  TaskComplexity['MODERATE'] = 'moderate';
  TaskComplexity['COMPLEX'] = 'complex';
  TaskComplexity['ENTERPRISE'] = 'enterprise';
})(TaskComplexity || (TaskComplexity = {}));

export let TaskStatus = {};
(function (TaskStatus) {
  TaskStatus['PENDING'] = 'pending';
  TaskStatus['READY'] = 'ready';
  TaskStatus['IN_PROGRESS'] = 'in_progress';
  TaskStatus['COMPLETED'] = 'completed';
  TaskStatus['FAILED'] = 'failed';
  TaskStatus['BLOCKED'] = 'blocked';
  TaskStatus['CANCELLED'] = 'cancelled';
})(TaskStatus || (TaskStatus = {}));

export let TaskPriority = {};
(function (TaskPriority) {
  TaskPriority['CRITICAL'] = 'critical';
  TaskPriority['HIGH'] = 'high';
  TaskPriority['MEDIUM'] = 'medium';
  TaskPriority['LOW'] = 'low';
})(TaskPriority || (TaskPriority = {}));
//# sourceMappingURL=types.js.map
