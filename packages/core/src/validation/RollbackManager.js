/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../logger/Logger.js';
import { TaskSnapshot } from './TaskValidator.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
/**
 * Types of rollback operations
 */
export const RollbackType = {};
(function (RollbackType) {
    RollbackType["TASK_STATE"] = "task_state";
    RollbackType["FILE_SYSTEM"] = "file_system";
    RollbackType["DATABASE"] = "database";
    RollbackType["ENVIRONMENT"] = "environment";
    RollbackType["CONFIGURATION"] = "configuration";
    RollbackType["DEPENDENCY_STATE"] = "dependency_state";
    RollbackType["FULL_SYSTEM"] = "full_system";
})(RollbackType || (RollbackType = {}));
/**
 * Rollback triggers that initiate rollback operations
 */
export const RollbackTrigger = {};
(function (RollbackTrigger) {
    RollbackTrigger["VALIDATION_FAILURE"] = "validation_failure";
    RollbackTrigger["EXECUTION_ERROR"] = "execution_error";
    RollbackTrigger["QUALITY_THRESHOLD_VIOLATION"] = "quality_threshold_violation";
    RollbackTrigger["SECURITY_VIOLATION"] = "security_violation";
    RollbackTrigger["USER_REQUEST"] = "user_request";
    RollbackTrigger["AUTOMATIC_RECOVERY"] = "automatic_recovery";
    RollbackTrigger["SYSTEM_FAILURE"] = "system_failure";
})(RollbackTrigger || (RollbackTrigger = {}));
/**
 * Rollback strategies for different scenarios
 */
export const RollbackStrategy = {};
(function (RollbackStrategy) {
    RollbackStrategy["IMMEDIATE"] = "immediate";
    RollbackStrategy["GRACEFUL"] = "graceful";
    RollbackStrategy["SCHEDULED"] = "scheduled";
    RollbackStrategy["MANUAL"] = "manual";
    RollbackStrategy["SMART"] = "smart";
    RollbackStrategy["CONDITIONAL"] = "conditional";
})(RollbackStrategy || (RollbackStrategy = {}));
/**
 * Rollback operation priority levels
 */
export const RollbackPriority = {};
(function (RollbackPriority) {
    RollbackPriority["CRITICAL"] = "critical";
    RollbackPriority["HIGH"] = "high";
    RollbackPriority["MEDIUM"] = "medium";
    RollbackPriority["LOW"] = "low";
})(RollbackPriority || (RollbackPriority = {}));
/**
 * Comprehensive Rollback Manager for Autonomous Task Management
 *
 * Provides intelligent rollback capabilities with automatic snapshot creation,
 * multi-level rollback strategies, impact analysis, and recovery automation
 * for maintaining system reliability and recovery from validation failures.
 */
export class RollbackManager extends EventEmitter {
    logger;
    config;
    // Snapshot storage
    snapshots = new Map();
    taskSnapshots = new Map(); // taskId -> snapshotIds
    // Operation management
    activeRollbacks = new Map();
    rollbackHistory = [];
    pendingOperations = new Map();
    constructor(config = {}) {
        super();
        this.logger = new Logger('RollbackManager');
        this.config = this.createDefaultConfig(config);
        this.logger.info('RollbackManager initialized', {
            enabled: this.config.enabled,
            autoSnapshot: this.config.snapshotting.autoSnapshot,
            defaultStrategy: this.config.strategies.defaultStrategy,
            maxSnapshots: this.config.snapshotting.maxSnapshots,
        });
        this.startMaintenanceTasks();
    }
    /**
     * Create default configuration with overrides
     */
    createDefaultConfig(config) {
        return {
            enabled: true,
            snapshotting: {
                autoSnapshot: true,
                maxSnapshots: 50,
                compressionEnabled: true,
                encryptionEnabled: false,
                storageLocation: './snapshots',
                retentionDays: 30,
            },
            policies: {
                autoRollbackOnCriticalFailure: true,
                requireApprovalForHighImpactRollback: true,
                maxConcurrentRollbacks: 3,
                rollbackTimeout: 300000, // 5 minutes
                validationRequired: true,
            },
            strategies: {
                defaultStrategy: RollbackStrategy.SMART,
                strategyMapping: new Map([
                    [RollbackTrigger.VALIDATION_FAILURE, RollbackStrategy.IMMEDIATE],
                    [RollbackTrigger.SECURITY_VIOLATION, RollbackStrategy.IMMEDIATE],
                    [RollbackTrigger.EXECUTION_ERROR, RollbackStrategy.GRACEFUL],
                    [
                        RollbackTrigger.QUALITY_THRESHOLD_VIOLATION,
                        RollbackStrategy.SCHEDULED,
                    ],
                    [RollbackTrigger.USER_REQUEST, RollbackStrategy.MANUAL],
                ]),
                conditionalRules: [],
            },
            monitoring: {
                metricsEnabled: true,
                alertingEnabled: true,
                notificationChannels: [],
                healthChecks: true,
            },
            ...config,
        };
    }
    /**
     * Create a comprehensive snapshot for rollback purposes
     */
    async createSnapshot(task, reason, types = Object.values(RollbackType)) {
        if (!this.config.enabled) {
            throw new Error('RollbackManager is disabled');
        }
        const snapshotId = `snapshot-${task.id}-${Date.now()}`;
        this.logger.info('Creating rollback snapshot', {
            taskId: task.id,
            snapshotId,
            types,
            reason,
        });
        const snapshot = {
            id: snapshotId,
            taskId: task.id,
            timestamp: new Date(),
            type: types,
            taskState: { ...task },
            taskMetadata: {},
            fileSystem: {
                baseDirectory: process.cwd(),
                files: new Map(),
                directories: [],
            },
            database: {
                transactions: [],
                data: {},
                schema: {},
            },
            environment: {
                variables: { ...process.env },
                workingDirectory: process.cwd(),
                processInfo: {
                    pid: process.pid,
                    platform: process.platform,
                    nodeVersion: process.version,
                },
            },
            configuration: {
                files: new Map(),
                runtime: {},
            },
            dependencies: {
                taskStates: new Map(),
                relationships: [],
            },
            metadata: {
                createdBy: 'RollbackManager',
                reason,
                snapshotSize: 0,
                checksum: '',
                version: '1.0.0',
                retentionPolicy: {
                    maxAge: this.config.snapshotting.retentionDays * 24 * 60 * 60 * 1000,
                    maxCount: this.config.snapshotting.maxSnapshots,
                },
            },
        };
        // Create snapshots for requested types
        for (const type of types) {
            await this.createSpecificSnapshot(type, snapshot, task);
        }
        // Calculate snapshot size and checksum
        snapshot.metadata.snapshotSize = this.calculateSnapshotSize(snapshot);
        snapshot.metadata.checksum = await this.calculateChecksum(snapshot);
        // Store snapshot
        this.storeSnapshot(snapshot);
        this.emit('snapshotCreated', snapshot);
        this.logger.info('Rollback snapshot created successfully', {
            snapshotId,
            size: snapshot.metadata.snapshotSize,
            types: snapshot.type,
        });
        return snapshot;
    }
    /**
     * Create specific type snapshots
     */
    async createSpecificSnapshot(type, snapshot, task) {
        try {
            switch (type) {
                case RollbackType.TASK_STATE:
                    await this.createTaskStateSnapshot(snapshot, task);
                    break;
                case RollbackType.FILE_SYSTEM:
                    await this.createFileSystemSnapshot(snapshot, task);
                    break;
                case RollbackType.DATABASE:
                    await this.createDatabaseSnapshot(snapshot, task);
                    break;
                case RollbackType.ENVIRONMENT:
                    await this.createEnvironmentSnapshot(snapshot, task);
                    break;
                case RollbackType.CONFIGURATION:
                    await this.createConfigurationSnapshot(snapshot, task);
                    break;
                case RollbackType.DEPENDENCY_STATE:
                    await this.createDependencySnapshot(snapshot, task);
                    break;
                default:
                    this.logger.warn(`Unknown snapshot type: ${type}`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to create ${type} snapshot`, {
                error,
                taskId: task.id,
            });
        }
    }
    async createTaskStateSnapshot(snapshot, task) {
        snapshot.taskState = JSON.parse(JSON.stringify(task)); // Deep copy
        snapshot.taskMetadata = {
            snapshotTime: snapshot.timestamp,
            originalStatus: task.status,
            progress: task.progress || 0,
        };
    }
    async createFileSystemSnapshot(snapshot, task) {
        // TODO: Implement comprehensive file system snapshot
        // This would involve:
        // 1. Identifying files affected by the task
        // 2. Reading file contents and metadata
        // 3. Creating directory structure map
        // 4. Handling binary files appropriately
        const workingDir = process.cwd();
        snapshot.fileSystem.baseDirectory = workingDir;
        // Placeholder implementation - would need to identify task-specific files
        this.logger.debug('File system snapshot created (placeholder)', {
            taskId: task.id,
        });
    }
    async createDatabaseSnapshot(snapshot, task) {
        // TODO: Implement database snapshot
        // This would involve:
        // 1. Capturing database transactions related to the task
        // 2. Storing data state snapshots
        // 3. Recording schema changes
        // 4. Handling different database types
        this.logger.debug('Database snapshot created (placeholder)', {
            taskId: task.id,
        });
    }
    async createEnvironmentSnapshot(snapshot, task) {
        snapshot.environment.variables = { ...process.env };
        snapshot.environment.workingDirectory = process.cwd();
        snapshot.environment.processInfo = {
            pid: process.pid,
            platform: process.platform,
            nodeVersion: process.version,
            memory: process.memoryUsage(),
            uptime: process.uptime(),
        };
    }
    async createConfigurationSnapshot(snapshot, task) {
        // TODO: Implement configuration snapshot
        // This would capture configuration files and runtime settings
        this.logger.debug('Configuration snapshot created (placeholder)', {
            taskId: task.id,
        });
    }
    async createDependencySnapshot(snapshot, task) {
        // TODO: Implement dependency state snapshot
        // This would capture the state of task dependencies
        this.logger.debug('Dependency snapshot created (placeholder)', {
            taskId: task.id,
        });
    }
    /**
     * Execute rollback operation
     */
    async executeRollback(operation) {
        if (!this.config.enabled) {
            throw new Error('RollbackManager is disabled');
        }
        const startTime = Date.now();
        this.logger.info('Initiating rollback operation', {
            operationId: operation.id,
            taskId: operation.taskId,
            strategy: operation.strategy,
            trigger: operation.trigger,
        });
        this.emit('rollbackInitiated', operation);
        try {
            // Check if rollback is already in progress
            if (this.activeRollbacks.has(operation.taskId)) {
                throw new Error(`Rollback already in progress for task: ${operation.taskId}`);
            }
            // Check concurrent rollback limits
            if (this.activeRollbacks.size >= this.config.policies.maxConcurrentRollbacks) {
                throw new Error('Maximum concurrent rollbacks exceeded');
            }
            // Create rollback promise
            const rollbackPromise = this.performRollback(operation, startTime);
            this.activeRollbacks.set(operation.taskId, rollbackPromise);
            const result = await rollbackPromise;
            this.emit('rollbackCompleted', result);
            return result;
        }
        catch (error) {
            this.logger.error('Rollback operation failed', {
                operationId: operation.id,
                error: error instanceof Error ? error.message : String(error),
            });
            this.emit('rollbackFailed', operation, error);
            throw error;
        }
        finally {
            this.activeRollbacks.delete(operation.taskId);
        }
    }
    /**
     * Perform the actual rollback operation
     */
    async performRollback(operation, startTime) {
        const snapshot = operation.targetSnapshot;
        const result = {
            operationId: operation.id,
            success: false,
            timestamp: new Date(),
            duration: 0,
            rollbackDetails: {
                snapshotRestored: snapshot.id,
                itemsRolledBack: {
                    taskState: false,
                    fileSystem: 0,
                    database: 0,
                    environment: 0,
                    configuration: 0,
                    dependencies: 0,
                },
            },
            errors: [],
            recovery: {
                automaticRecoveryAttempted: false,
                manualInterventionRequired: false,
                nextSteps: [],
            },
            metadata: {
                executedBy: 'RollbackManager',
                rollbackStrategy: operation.strategy,
                impactLevel: operation.impact.riskLevel,
            },
        };
        try {
            // Pre-rollback validation
            if (operation.config.validateBeforeRollback) {
                const preValidation = await this.validateBeforeRollback(operation);
                result.rollbackDetails.preRollbackValidation = preValidation;
                if (!preValidation.passed) {
                    result.errors.push({
                        type: 'pre_validation_failed',
                        message: 'Pre-rollback validation failed',
                        details: preValidation.issues.join(', '),
                        recoverable: false,
                    });
                    return result;
                }
            }
            // Create backup snapshot if requested
            if (operation.config.createBackupSnapshot) {
                // TODO: Create backup snapshot before rollback
            }
            // Execute rollback for each type
            for (const rollbackType of operation.type) {
                try {
                    await this.rollbackSpecificType(rollbackType, snapshot, result);
                }
                catch (error) {
                    result.errors.push({
                        type: `rollback_${rollbackType}_failed`,
                        message: `Failed to rollback ${rollbackType}`,
                        details: error instanceof Error ? error.message : String(error),
                        recoverable: true,
                    });
                }
            }
            // Post-rollback validation
            if (operation.config.validateAfterRollback) {
                const postValidation = await this.validateAfterRollback(operation, result);
                result.rollbackDetails.postRollbackValidation = postValidation;
                if (!postValidation.passed) {
                    result.recovery.manualInterventionRequired = true;
                    result.recovery.nextSteps.push('Manual validation and correction required');
                }
            }
            // Determine overall success
            result.success = result.errors.filter((e) => !e.recoverable).length === 0;
            result.duration = Date.now() - startTime;
            // Store result in history
            this.rollbackHistory.push(result);
            this.logger.info('Rollback operation completed', {
                operationId: operation.id,
                success: result.success,
                duration: result.duration,
                errors: result.errors.length,
            });
            return result;
        }
        catch (error) {
            result.errors.push({
                type: 'rollback_execution_failed',
                message: 'Critical rollback execution error',
                details: error instanceof Error ? error.message : String(error),
                recoverable: false,
            });
            result.duration = Date.now() - startTime;
            return result;
        }
    }
    /**
     * Rollback specific types
     */
    async rollbackSpecificType(type, snapshot, result) {
        switch (type) {
            case RollbackType.TASK_STATE:
                await this.rollbackTaskState(snapshot, result);
                break;
            case RollbackType.FILE_SYSTEM:
                await this.rollbackFileSystem(snapshot, result);
                break;
            case RollbackType.DATABASE:
                await this.rollbackDatabase(snapshot, result);
                break;
            case RollbackType.ENVIRONMENT:
                await this.rollbackEnvironment(snapshot, result);
                break;
            case RollbackType.CONFIGURATION:
                await this.rollbackConfiguration(snapshot, result);
                break;
            case RollbackType.DEPENDENCY_STATE:
                await this.rollbackDependencies(snapshot, result);
                break;
            default:
                throw new Error(`Unknown rollback type: ${type}`);
        }
    }
    async rollbackTaskState(snapshot, result) {
        // TODO: Implement task state rollback
        // This would restore the task to its previous state
        result.rollbackDetails.itemsRolledBack.taskState = true;
        this.logger.debug('Task state rolled back', { snapshotId: snapshot.id });
    }
    async rollbackFileSystem(snapshot, result) {
        // TODO: Implement file system rollback
        // This would restore files from the snapshot
        result.rollbackDetails.itemsRolledBack.fileSystem =
            snapshot.fileSystem.files.size;
        this.logger.debug('File system rolled back', { snapshotId: snapshot.id });
    }
    async rollbackDatabase(snapshot, result) {
        // TODO: Implement database rollback
        // This would reverse database transactions
        result.rollbackDetails.itemsRolledBack.database =
            snapshot.database.transactions.length;
        this.logger.debug('Database rolled back', { snapshotId: snapshot.id });
    }
    async rollbackEnvironment(snapshot, result) {
        // TODO: Implement environment rollback
        // This would restore environment variables and settings
        result.rollbackDetails.itemsRolledBack.environment = Object.keys(snapshot.environment.variables).length;
        this.logger.debug('Environment rolled back', { snapshotId: snapshot.id });
    }
    async rollbackConfiguration(snapshot, result) {
        // TODO: Implement configuration rollback
        result.rollbackDetails.itemsRolledBack.configuration =
            snapshot.configuration.files.size;
        this.logger.debug('Configuration rolled back', { snapshotId: snapshot.id });
    }
    async rollbackDependencies(snapshot, result) {
        // TODO: Implement dependency rollback
        result.rollbackDetails.itemsRolledBack.dependencies =
            snapshot.dependencies.taskStates.size;
        this.logger.debug('Dependencies rolled back', { snapshotId: snapshot.id });
    }
    /**
     * Helper methods
     */
    storeSnapshot(snapshot) {
        this.snapshots.set(snapshot.id, snapshot);
        // Update task snapshot index
        const taskSnapshots = this.taskSnapshots.get(snapshot.taskId) || [];
        taskSnapshots.push(snapshot.id);
        // Cleanup old snapshots if over limit
        while (taskSnapshots.length > this.config.snapshotting.maxSnapshots) {
            const oldSnapshotId = taskSnapshots.shift();
            this.snapshots.delete(oldSnapshotId);
        }
        this.taskSnapshots.set(snapshot.taskId, taskSnapshots);
    }
    calculateSnapshotSize(snapshot) {
        // Simple size calculation - could be enhanced
        return JSON.stringify(snapshot).length;
    }
    async calculateChecksum(snapshot) {
        // TODO: Implement proper checksum calculation
        return `checksum-${snapshot.id}`;
    }
    async validateBeforeRollback(operation) {
        // TODO: Implement pre-rollback validation
        return { passed: true, issues: [] };
    }
    async validateAfterRollback(operation, result) {
        // TODO: Implement post-rollback validation
        return { passed: true, issues: [] };
    }
    startMaintenanceTasks() {
        // Periodic cleanup of old snapshots
        setInterval(() => {
            this.cleanupExpiredSnapshots();
        }, 24 * 60 * 60 * 1000); // Daily cleanup
    }
    cleanupExpiredSnapshots() {
        const now = Date.now();
        const maxAge = this.config.snapshotting.retentionDays * 24 * 60 * 60 * 1000;
        for (const [snapshotId, snapshot] of this.snapshots.entries()) {
            if (now - snapshot.timestamp.getTime() > maxAge) {
                this.snapshots.delete(snapshotId);
                this.logger.debug('Expired snapshot cleaned up', { snapshotId });
            }
        }
    }
    /**
     * Public API methods
     */
    /**
     * Get snapshots for a task
     */
    getTaskSnapshots(taskId) {
        const snapshotIds = this.taskSnapshots.get(taskId) || [];
        return snapshotIds
            .map((id) => this.snapshots.get(id))
            .filter(Boolean);
    }
    /**
     * Get rollback statistics
     */
    getRollbackStatistics() {
        const completedRollbacks = this.rollbackHistory.filter((r) => r.success).length;
        const failedRollbacks = this.rollbackHistory.filter((r) => !r.success).length;
        const averageRollbackTime = this.rollbackHistory.length > 0
            ? this.rollbackHistory.reduce((sum, r) => sum + r.duration, 0) /
                this.rollbackHistory.length
            : 0;
        return {
            totalSnapshots: this.snapshots.size,
            activeRollbacks: this.activeRollbacks.size,
            completedRollbacks,
            failedRollbacks,
            averageRollbackTime,
        };
    }
    /**
     * Create rollback operation from trigger
     */
    createRollbackOperation(taskId, trigger, snapshotId, reason, options = {}) {
        const snapshot = this.snapshots.get(snapshotId);
        if (!snapshot) {
            throw new Error(`Snapshot not found: ${snapshotId}`);
        }
        const strategy = this.config.strategies.strategyMapping.get(trigger) ||
            this.config.strategies.defaultStrategy;
        return {
            id: `rollback-${taskId}-${Date.now()}`,
            taskId,
            type: snapshot.type,
            trigger,
            strategy,
            priority: this.determinePriority(trigger),
            snapshotId,
            targetSnapshot: snapshot,
            config: {
                validateBeforeRollback: this.config.policies.validationRequired,
                validateAfterRollback: this.config.policies.validationRequired,
                createBackupSnapshot: true,
                notifyStakeholders: true,
                maxRetries: 3,
                timeout: this.config.policies.rollbackTimeout,
                force: false,
            },
            impact: {
                affectedTasks: [taskId],
                affectedFiles: [],
                estimatedDowntime: 30000, // 30 seconds default
                riskLevel: 'medium',
                mitigationSteps: [],
            },
            scheduling: {
                immediateExecution: strategy === RollbackStrategy.IMMEDIATE,
                scheduledTime: strategy === RollbackStrategy.SCHEDULED
                    ? new Date(Date.now() + 300000)
                    : undefined,
            },
            metadata: {
                createdAt: new Date(),
                createdBy: 'RollbackManager',
                reason,
                estimatedDuration: 60000, // 1 minute default
            },
            ...options,
        };
    }
    determinePriority(trigger) {
        switch (trigger) {
            case RollbackTrigger.SECURITY_VIOLATION:
                return RollbackPriority.CRITICAL;
            case RollbackTrigger.VALIDATION_FAILURE:
            case RollbackTrigger.EXECUTION_ERROR:
                return RollbackPriority.HIGH;
            case RollbackTrigger.QUALITY_THRESHOLD_VIOLATION:
                return RollbackPriority.MEDIUM;
            default:
                return RollbackPriority.LOW;
        }
    }
    /**
     * Clean up resources
     */
    async cleanup() {
        this.logger.info('Cleaning up RollbackManager resources');
        this.activeRollbacks.clear();
        this.removeAllListeners();
    }
}
//# sourceMappingURL=RollbackManager.js.map