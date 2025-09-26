/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import type { ValidationFramework, ValidationContext } from './ValidationFramework.js';
import type { ValidationWorkflow, TaskExecutionStage, TaskExecutionContext } from './ValidationWorkflow.js';
import type { ValidationFailureHandler } from './ValidationFailureHandler.js';
import type { ValidationReporting } from './ValidationReporting.js';
/**
 * Monitoring trigger types
 */
export declare enum MonitoringTrigger {
    FILE_CHANGE = "file-change",
    TIME_BASED = "time-based",
    THRESHOLD_BREACH = "threshold-breach",
    EXTERNAL_EVENT = "external-event",
    MANUAL = "manual",
    GIT_HOOK = "git-hook",
    CI_CD_PIPELINE = "ci-cd-pipeline"
}
/**
 * Monitoring scope
 */
export declare enum MonitoringScope {
    PROJECT = "project",
    WORKSPACE = "workspace",
    FILE = "file",
    DIRECTORY = "directory",
    DEPENDENCY = "dependency"
}
/**
 * Health status
 */
export declare enum HealthStatus {
    HEALTHY = "healthy",
    DEGRADED = "degraded",
    UNHEALTHY = "unhealthy",
    CRITICAL = "critical"
}
/**
 * Monitoring rule configuration
 */
export interface MonitoringRule {
    id: string;
    name: string;
    enabled: boolean;
    triggers: MonitoringTrigger[];
    scope: MonitoringScope;
    patterns: string[];
    excludePatterns?: string[];
    schedule?: {
        interval: number;
        cron?: string;
    };
    thresholds?: {
        errorRate: number;
        responseTime: number;
        failureCount: number;
    };
    actions: {
        validate: boolean;
        notify: boolean;
        report: boolean;
        recover: boolean;
    };
    metadata?: Record<string, unknown>;
}
/**
 * Health check configuration
 */
export interface HealthCheck {
    id: string;
    name: string;
    type: 'validation' | 'performance' | 'resource' | 'dependency';
    interval: number;
    timeout: number;
    retries: number;
    checker: () => Promise<{
        status: HealthStatus;
        metrics: Record<string, unknown>;
        message?: string;
    }>;
}
/**
 * Monitoring alert
 */
export interface MonitoringAlert {
    id: string;
    timestamp: Date;
    severity: 'info' | 'warning' | 'error' | 'critical';
    type: string;
    message: string;
    source: string;
    metadata: Record<string, unknown>;
    resolved?: Date;
    resolvedBy?: string;
}
/**
 * System health metrics
 */
export interface SystemHealthMetrics {
    overall: HealthStatus;
    timestamp: Date;
    components: {
        validation: HealthStatus;
        workflow: HealthStatus;
        reporting: HealthStatus;
        fileSystem: HealthStatus;
    };
    metrics: {
        validationsPerHour: number;
        averageResponseTime: number;
        errorRate: number;
        queueSize: number;
        memoryUsage: number;
        diskUsage: number;
    };
    alerts: MonitoringAlert[];
    uptime: number;
}
/**
 * Continuous validation monitoring configuration
 */
export interface ContinuousValidationMonitorConfig {
    enabled: boolean;
    watchPatterns: string[];
    excludePatterns: string[];
    monitoringRules: MonitoringRule[];
    healthChecks: HealthCheck[];
    alerting: {
        enabled: boolean;
        channels: Array<{
            type: 'console' | 'file' | 'webhook' | 'email';
            config: Record<string, unknown>;
        }>;
        throttling: {
            enabled: boolean;
            maxAlertsPerHour: number;
            cooldownPeriod: number;
        };
    };
    recovery: {
        autoRecovery: boolean;
        maxRecoveryAttempts: number;
        recoveryStrategies: string[];
    };
    performance: {
        maxConcurrentValidations: number;
        queueMaxSize: number;
        validationTimeout: number;
    };
    persistence: {
        enabled: boolean;
        retentionDays: number;
        storageBackend: 'file' | 'database' | 'memory';
    };
}
/**
 * Continuous validation monitoring system (stub implementation)
 * Provides real-time monitoring, health checks, and automated validation triggers
 */
export declare class ContinuousValidationMonitor extends EventEmitter {
    private readonly logger;
    constructor(_config: Partial<ContinuousValidationMonitorConfig>, _validationFramework: ValidationFramework, _validationWorkflow: ValidationWorkflow, _failureHandler: ValidationFailureHandler, _reporting: ValidationReporting);
    startMonitoring(): Promise<void>;
    stopMonitoring(): Promise<void>;
    queueValidation(_context: ValidationContext | TaskExecutionContext, _trigger: MonitoringTrigger, _priority?: number): string;
    triggerValidation(_context: ValidationContext | TaskExecutionContext): Promise<string>;
    getSystemHealth(): SystemHealthMetrics;
    addMonitoringRule(rule: MonitoringRule): void;
    addHealthCheck(healthCheck: HealthCheck): void;
    isWorkflowRunning(_taskId: string, _stage: TaskExecutionStage): boolean;
    cancelWorkflow(_taskId: string, _stage: TaskExecutionStage): Promise<boolean>;
    getStatistics(): {
        enabled: boolean;
        queueSize: number;
        activeValidations: number;
        totalAlerts: number;
        unresolvedAlerts: number;
        monitoringRules: number;
        healthChecks: number;
        systemHealth: HealthStatus;
    };
}
