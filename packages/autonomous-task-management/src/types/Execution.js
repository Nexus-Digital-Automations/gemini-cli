/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { TaskId, TaskExecutionResult } from './Task';
/**
 * Execution status enumeration
 */
export var ExecutionStatus;
(function (ExecutionStatus) {
    ExecutionStatus["PENDING"] = "pending";
    ExecutionStatus["INITIALIZING"] = "initializing";
    ExecutionStatus["RUNNING"] = "running";
    ExecutionStatus["PAUSED"] = "paused";
    ExecutionStatus["COMPLETING"] = "completing";
    ExecutionStatus["COMPLETED"] = "completed";
    ExecutionStatus["FAILED"] = "failed";
    ExecutionStatus["CANCELLED"] = "cancelled";
    ExecutionStatus["TIMEOUT"] = "timeout";
})(ExecutionStatus || (ExecutionStatus = {}));
/**
 * Execution mode enumeration
 */
export var ExecutionMode;
(function (ExecutionMode) {
    ExecutionMode["NORMAL"] = "normal";
    ExecutionMode["DEBUG"] = "debug";
    ExecutionMode["DRY_RUN"] = "dry_run";
    ExecutionMode["SAFE_MODE"] = "safe_mode";
    ExecutionMode["ACCELERATED"] = "accelerated";
})(ExecutionMode || (ExecutionMode = {}));
/**
 * Validation rule types
 */
export var ValidationRuleType;
(function (ValidationRuleType) {
    ValidationRuleType["LINTING"] = "linting";
    ValidationRuleType["TESTING"] = "testing";
    ValidationRuleType["SECURITY"] = "security";
    ValidationRuleType["PERFORMANCE"] = "performance";
    ValidationRuleType["STYLE"] = "style";
    ValidationRuleType["SYNTAX"] = "syntax";
    ValidationRuleType["CUSTOM"] = "custom";
})(ValidationRuleType || (ValidationRuleType = {}));
/**
 * Validation severity levels
 */
export var ValidationSeverity;
(function (ValidationSeverity) {
    ValidationSeverity["INFO"] = "info";
    ValidationSeverity["WARNING"] = "warning";
    ValidationSeverity["ERROR"] = "error";
    ValidationSeverity["CRITICAL"] = "critical";
})(ValidationSeverity || (ValidationSeverity = {}));
/**
 * Recovery strategy types
 */
export var RecoveryStrategyType;
(function (RecoveryStrategyType) {
    RecoveryStrategyType["RETRY"] = "retry";
    RecoveryStrategyType["RESTART"] = "restart";
    RecoveryStrategyType["ROLLBACK"] = "rollback";
    RecoveryStrategyType["FAILOVER"] = "failover";
    RecoveryStrategyType["ESCALATE"] = "escalate";
    RecoveryStrategyType["CUSTOM"] = "custom";
})(RecoveryStrategyType || (RecoveryStrategyType = {}));
/**
 * Step status enumeration
 */
export var StepStatus;
(function (StepStatus) {
    StepStatus["PENDING"] = "pending";
    StepStatus["RUNNING"] = "running";
    StepStatus["COMPLETED"] = "completed";
    StepStatus["FAILED"] = "failed";
    StepStatus["SKIPPED"] = "skipped";
})(StepStatus || (StepStatus = {}));
/**
 * Execution actions for history tracking
 */
export var ExecutionAction;
(function (ExecutionAction) {
    ExecutionAction["CREATED"] = "created";
    ExecutionAction["STARTED"] = "started";
    ExecutionAction["PAUSED"] = "paused";
    ExecutionAction["RESUMED"] = "resumed";
    ExecutionAction["COMPLETED"] = "completed";
    ExecutionAction["FAILED"] = "failed";
    ExecutionAction["CANCELLED"] = "cancelled";
    ExecutionAction["STEP_STARTED"] = "step_started";
    ExecutionAction["STEP_COMPLETED"] = "step_completed";
    ExecutionAction["STEP_FAILED"] = "step_failed";
    ExecutionAction["VALIDATION_STARTED"] = "validation_started";
    ExecutionAction["VALIDATION_COMPLETED"] = "validation_completed";
    ExecutionAction["VALIDATION_FAILED"] = "validation_failed";
    ExecutionAction["ERROR_OCCURRED"] = "error_occurred";
    ExecutionAction["RECOVERY_STARTED"] = "recovery_started";
    ExecutionAction["RECOVERY_COMPLETED"] = "recovery_completed";
    ExecutionAction["TIMEOUT_OCCURRED"] = "timeout_occurred";
})(ExecutionAction || (ExecutionAction = {}));
//# sourceMappingURL=Execution.js.map