/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Enhanced autonomous task management system types
 * Builds on existing TaskInterfaces.ts to provide comprehensive autonomous capabilities
 */
export * from './interfaces/TaskInterfaces.js';
/**
 * Autonomous task execution modes
 */
export var AutonomousMode;
(function (AutonomousMode) {
    /** Manual approval required for each task */
    AutonomousMode["MANUAL"] = "manual";
    /** Semi-autonomous with human oversight */
    AutonomousMode["SEMI_AUTONOMOUS"] = "semi_autonomous";
    /** Fully autonomous execution */
    AutonomousMode["FULLY_AUTONOMOUS"] = "fully_autonomous";
    /** Learning mode to observe patterns */
    AutonomousMode["LEARNING"] = "learning";
})(AutonomousMode || (AutonomousMode = {}));
/**
 * Task complexity levels for autonomous handling
 */
export var TaskComplexity;
(function (TaskComplexity) {
    /** Simple, atomic operations */
    TaskComplexity["SIMPLE"] = "simple";
    /** Medium complexity requiring multiple steps */
    TaskComplexity["MEDIUM"] = "medium";
    /** Complex tasks requiring breakdown */
    TaskComplexity["COMPLEX"] = "complex";
    /** High complexity requiring human oversight */
    TaskComplexity["HIGH"] = "high";
    /** Critical tasks requiring manual approval */
    TaskComplexity["CRITICAL"] = "critical";
})(TaskComplexity || (TaskComplexity = {}));
/**
 * Event types for autonomous system monitoring
 */
export var AutonomousSystemEvent;
(function (AutonomousSystemEvent) {
    AutonomousSystemEvent["SYSTEM_INITIALIZED"] = "system_initialized";
    AutonomousSystemEvent["SYSTEM_STARTED"] = "system_started";
    AutonomousSystemEvent["SYSTEM_STOPPED"] = "system_stopped";
    AutonomousSystemEvent["TASK_SUBMITTED"] = "task_submitted";
    AutonomousSystemEvent["TASK_STARTED"] = "task_started";
    AutonomousSystemEvent["TASK_COMPLETED"] = "task_completed";
    AutonomousSystemEvent["TASK_FAILED"] = "task_failed";
    AutonomousSystemEvent["LEARNING_INSIGHT"] = "learning_insight";
    AutonomousSystemEvent["OPTIMIZATION_FOUND"] = "optimization_found";
    AutonomousSystemEvent["SYSTEM_ERROR"] = "system_error";
    AutonomousSystemEvent["SYSTEM_WARNING"] = "system_warning";
    AutonomousSystemEvent["HEALTH_CHECK"] = "health_check";
    AutonomousSystemEvent["PERFORMANCE_ALERT"] = "performance_alert";
    AutonomousSystemEvent["SESSION_STARTED"] = "session_started";
    AutonomousSystemEvent["SESSION_ENDED"] = "session_ended";
    AutonomousSystemEvent["CROSS_SESSION_CONTINUATION"] = "cross_session_continuation";
})(AutonomousSystemEvent || (AutonomousSystemEvent = {}));
//# sourceMappingURL=types.js.map