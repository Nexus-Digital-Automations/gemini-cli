/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import type { Task, TaskStatus } from '../task-management/types.js';
/**
 * Rollback events for monitoring and alerting
 */
export interface RollbackEvents {
    rollbackInitiated: [operation: RollbackOperation];
    rollbackCompleted: [result: RollbackResult];
    rollbackFailed: [operation: RollbackOperation, error: Error];
    snapshotCreated: [snapshot: RollbackSnapshot];
    snapshotRestored: [snapshotId: string, result: RollbackResult];
    rollbackStrategySelected: [strategy: RollbackStrategy];
}
/**
 * Types of rollback operations
 */
export declare enum RollbackType {
    TASK_STATE = "task_state",
    FILE_SYSTEM = "file_system",
    DATABASE = "database",
    ENVIRONMENT = "environment",
    CONFIGURATION = "configuration",
    DEPENDENCY_STATE = "dependency_state",
    FULL_SYSTEM = "full_system"
}
/**
 * Rollback triggers that initiate rollback operations
 */
export declare enum RollbackTrigger {
    VALIDATION_FAILURE = "validation_failure",
    EXECUTION_ERROR = "execution_error",
    QUALITY_THRESHOLD_VIOLATION = "quality_threshold_violation",
    SECURITY_VIOLATION = "security_violation",
    USER_REQUEST = "user_request",
    AUTOMATIC_RECOVERY = "automatic_recovery",
    SYSTEM_FAILURE = "system_failure"
}
/**
 * Rollback strategies for different scenarios
 */
export declare enum RollbackStrategy {
    IMMEDIATE = "immediate",// Rollback immediately on trigger
    GRACEFUL = "graceful",// Complete current operations then rollback
    SCHEDULED = "scheduled",// Rollback at scheduled time
    MANUAL = "manual",// Require manual confirmation
    SMART = "smart",// AI-driven decision on rollback approach
    CONDITIONAL = "conditional"
}
/**
 * Rollback operation priority levels
 */
export declare enum RollbackPriority {
    CRITICAL = "critical",// Immediate rollback required
    HIGH = "high",// Rollback ASAP
    MEDIUM = "medium",// Rollback when convenient
    LOW = "low"
}
/**
 * Comprehensive rollback snapshot
 */
export interface RollbackSnapshot {
    id: string;
    taskId: string;
    timestamp: Date;
    type: RollbackType[];
    taskState: Task;
    taskMetadata: Record<string, unknown>;
    fileSystem: {
        baseDirectory: string;
        files: Map<string, {
            content: string | Buffer;
            stats: {
                size: number;
                mtime: Date;
                permissions: string;
            };
        }>;
        directories: string[];
    };
    database: {
        transactions: Array<{
            query: string;
            parameters: unknown[];
            timestamp: Date;
        }>;
        data: Record<string, unknown>;
        schema: Record<string, unknown>;
    };
    environment: {
        variables: Record<string, string>;
        workingDirectory: string;
        processInfo: Record<string, unknown>;
    };
    configuration: {
        files: Map<string, string>;
        runtime: Record<string, unknown>;
    };
    dependencies: {
        taskStates: Map<string, TaskStatus>;
        relationships: Array<{
            sourceId: string;
            targetId: string;
            type: string;
        }>;
    };
    metadata: {
        createdBy: string;
        reason: string;
        snapshotSize: number;
        compressionRatio?: number;
        checksum: string;
        version: string;
        retentionPolicy: {
            maxAge: number;
            maxCount: number;
        };
    };
}
/**
 * Rollback operation definition
 */
export interface RollbackOperation {
    id: string;
    taskId: string;
    type: RollbackType[];
    trigger: RollbackTrigger;
    strategy: RollbackStrategy;
    priority: RollbackPriority;
    snapshotId: string;
    targetSnapshot: RollbackSnapshot;
    config: {
        validateBeforeRollback: boolean;
        validateAfterRollback: boolean;
        createBackupSnapshot: boolean;
        notifyStakeholders: boolean;
        maxRetries: number;
        timeout: number;
        force: boolean;
    };
    impact: {
        affectedTasks: string[];
        affectedFiles: string[];
        estimatedDowntime: number;
        riskLevel: 'low' | 'medium' | 'high' | 'critical';
        mitigationSteps: string[];
    };
    scheduling: {
        immediateExecution: boolean;
        scheduledTime?: Date;
        maintenanceWindow?: {
            start: Date;
            end: Date;
        };
    };
    metadata: {
        createdAt: Date;
        createdBy: string;
        reason: string;
        approvedBy?: string;
        estimatedDuration: number;
    };
}
/**
 * Rollback execution result
 */
export interface RollbackResult {
    operationId: string;
    success: boolean;
    timestamp: Date;
    duration: number;
    rollbackDetails: {
        snapshotRestored: string;
        itemsRolledBack: {
            taskState: boolean;
            fileSystem: number;
            database: number;
            environment: number;
            configuration: number;
            dependencies: number;
        };
        preRollbackValidation?: {
            passed: boolean;
            issues: string[];
        };
        postRollbackValidation?: {
            passed: boolean;
            issues: string[];
        };
    };
    errors: Array<{
        type: string;
        message: string;
        details: string;
        recoverable: boolean;
    }>;
    recovery: {
        automaticRecoveryAttempted: boolean;
        manualInterventionRequired: boolean;
        nextSteps: string[];
    };
    metadata: {
        executedBy: string;
        rollbackStrategy: RollbackStrategy;
        impactLevel: 'low' | 'medium' | 'high' | 'critical';
    };
}
/**
 * Rollback manager configuration
 */
export interface RollbackManagerConfig {
    enabled: boolean;
    snapshotting: {
        autoSnapshot: boolean;
        maxSnapshots: number;
        compressionEnabled: boolean;
        encryptionEnabled: boolean;
        storageLocation: string;
        retentionDays: number;
    };
    policies: {
        autoRollbackOnCriticalFailure: boolean;
        requireApprovalForHighImpactRollback: boolean;
        maxConcurrentRollbacks: number;
        rollbackTimeout: number;
        validationRequired: boolean;
    };
    strategies: {
        defaultStrategy: RollbackStrategy;
        strategyMapping: Map<RollbackTrigger, RollbackStrategy>;
        conditionalRules: Array<{
            condition: string;
            strategy: RollbackStrategy;
        }>;
    };
    monitoring: {
        metricsEnabled: boolean;
        alertingEnabled: boolean;
        notificationChannels: string[];
        healthChecks: boolean;
    };
}
/**
 * Comprehensive Rollback Manager for Autonomous Task Management
 *
 * Provides intelligent rollback capabilities with automatic snapshot creation,
 * multi-level rollback strategies, impact analysis, and recovery automation
 * for maintaining system reliability and recovery from validation failures.
 */
export declare class RollbackManager extends EventEmitter {
    private readonly logger;
    private readonly config;
    private readonly snapshots;
    private readonly taskSnapshots;
    private readonly activeRollbacks;
    private readonly rollbackHistory;
    constructor(config?: Partial<RollbackManagerConfig>);
    /**
     * Create default configuration with overrides
     */
    private createDefaultConfig;
    /**
     * Create a comprehensive snapshot for rollback purposes
     */
    createSnapshot(task: Task, reason: string, types?: RollbackType[]): Promise<RollbackSnapshot>;
    /**
     * Create specific type snapshots
     */
    private createSpecificSnapshot;
    private createTaskStateSnapshot;
    private createFileSystemSnapshot;
    private createDatabaseSnapshot;
    private createEnvironmentSnapshot;
    private createConfigurationSnapshot;
    private createDependencySnapshot;
    /**
     * Execute rollback operation
     */
    executeRollback(operation: RollbackOperation): Promise<RollbackResult>;
    /**
     * Perform the actual rollback operation
     */
    private performRollback;
    /**
     * Rollback specific types
     */
    private rollbackSpecificType;
    private rollbackTaskState;
    private rollbackFileSystem;
    private rollbackDatabase;
    private rollbackEnvironment;
    private rollbackConfiguration;
    private rollbackDependencies;
    /**
     * Helper methods
     */
    private storeSnapshot;
    private calculateSnapshotSize;
    private calculateChecksum;
    private validateBeforeRollback;
    private validateAfterRollback;
    private startMaintenanceTasks;
    private cleanupExpiredSnapshots;
    /**
     * Public API methods
     */
    /**
     * Get snapshots for a task
     */
    getTaskSnapshots(taskId: string): RollbackSnapshot[];
    /**
     * Get rollback statistics
     */
    getRollbackStatistics(): {
        totalSnapshots: number;
        activeRollbacks: number;
        completedRollbacks: number;
        failedRollbacks: number;
        averageRollbackTime: number;
    };
    /**
     * Create rollback operation from trigger
     */
    createRollbackOperation(taskId: string, trigger: RollbackTrigger, snapshotId: string, reason: string, options?: Partial<RollbackOperation>): RollbackOperation;
    private determinePriority;
    /**
     * Clean up resources
     */
    cleanup(): Promise<void>;
}
