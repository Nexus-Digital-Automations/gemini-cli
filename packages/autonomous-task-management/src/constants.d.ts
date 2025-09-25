/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * System constants for the Autonomous Task Management System
 */
export declare const SYSTEM_VERSION = "3.0.0";
export declare const DEFAULT_TIMEOUTS: {
    TASK_EXECUTION: number;
    AGENT_HEARTBEAT: number;
    QUEUE_PROCESSING: number;
    VALIDATION: number;
};
export declare const PRIORITY_VALUES: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
    BACKGROUND: number;
};
export declare const QUEUE_LIMITS: {
    MAX_SIZE: number;
    MAX_CONCURRENCY: number;
    MAX_RETRIES: number;
};
export declare const METRICS_CONFIG: {
    COLLECTION_INTERVAL: number;
    RETENTION_DAYS: number;
};
