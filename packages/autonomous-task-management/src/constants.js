/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * System constants for the Autonomous Task Management System
 */
export const SYSTEM_VERSION = '3.0.0';
export const DEFAULT_TIMEOUTS = {
    TASK_EXECUTION: 300000, // 5 minutes
    AGENT_HEARTBEAT: 30000, // 30 seconds
    QUEUE_PROCESSING: 1000, // 1 second
    VALIDATION: 60000, // 1 minute
};
export const PRIORITY_VALUES = {
    CRITICAL: 100,
    HIGH: 80,
    MEDIUM: 60,
    LOW: 40,
    BACKGROUND: 20,
};
export const QUEUE_LIMITS = {
    MAX_SIZE: 1000,
    MAX_CONCURRENCY: 10,
    MAX_RETRIES: 3,
};
export const METRICS_CONFIG = {
    COLLECTION_INTERVAL: 60000, // 1 minute
    RETENTION_DAYS: 30,
};
//# sourceMappingURL=constants.js.map