/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fse from 'fs-extra';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { logger } from '../utils/logger.js';
import { FileBasedTaskStore } from './FileBasedTaskStore.js';
import { SessionManager } from './SessionManager.js';
import { ConflictResolver } from './ConflictResolver.js';
import { DataIntegrityManager } from './DataIntegrityManager.js';
/**
 * Comprehensive persistence storage management API
 *
 * Integrates all persistence components:
 * - File-based task storage with efficient serialization
 * - Cross-session task correlation and ownership tracking
 * - Conflict resolution for concurrent access
 * - Data integrity with backup and recovery
 * - Performance monitoring and optimization
 *
 * Provides a unified interface for all persistence operations with:
 * - Automatic conflict detection and resolution
 * - Transparent backup and integrity management
 * - Cross-session task continuity
 * - Performance optimization
 * - Comprehensive monitoring and alerting
 */
export class PersistenceStorageAPI {
    config;
    fileStorage;
    sessionManager;
    conflictResolver;
    dataIntegrity;
    // Performance tracking
    operationMetrics;
    lastHealthCheck;
    constructor(config = {}) {
        // Initialize configuration with defaults
        this.config = {
            baseDir: config.baseDir || join(homedir(), '.gemini-cli', 'persistence'),
            fileStorage: {
                storageDir: join(config.baseDir || join(homedir(), '.gemini-cli', 'persistence'), 'tasks'),
                compressMetadata: true,
                compressWorkspace: true,
                maxBackupVersions: 10,
                enableAutoCleanup: true,
                maxSessionAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                enableMetrics: true,
                ...config.fileStorage,
            },
            enableSessionManagement: config.enableSessionManagement ?? true,
            enableConflictResolution: config.enableConflictResolution ?? true,
            enableDataIntegrity: config.enableDataIntegrity ?? true,
            ownerId: config.ownerId || process.env.USER || process.env.USERNAME || 'unknown',
            performance: {
                enableCaching: config.performance?.enableCaching ?? true,
                cacheSize: config.performance?.cacheSize ?? 100,
                enableCompression: config.performance?.enableCompression ?? true,
                enableIndexing: config.performance?.enableIndexing ?? true,
            },
            monitoring: {
                enableMetrics: config.monitoring?.enableMetrics ?? true,
                alertThresholds: {
                    diskUsage: config.monitoring?.alertThresholds?.diskUsage ?? 80,
                    failureRate: config.monitoring?.alertThresholds?.failureRate ?? 5,
                    responseTime: config.monitoring?.alertThresholds?.responseTime ?? 5000,
                },
            },
        };
        this.operationMetrics = new Map();
        this.lastHealthCheck = new Date();
        this.initialize();
    }
    /**
     * Initialize all persistence components
     */
    async initialize() {
        try {
            logger.info('Initializing PersistenceStorageAPI');
            // Ensure base directory exists
            await fse.ensureDir(this.config.baseDir);
            // Initialize file storage (always enabled)
            this.fileStorage = new FileBasedTaskStore(this.config.fileStorage);
            // Initialize optional components
            if (this.config.enableSessionManagement) {
                this.sessionManager = new SessionManager(join(this.config.baseDir, 'sessions'), this.config.ownerId);
            }
            if (this.config.enableConflictResolution) {
                this.conflictResolver = new ConflictResolver(join(this.config.baseDir, 'conflicts'));
            }
            if (this.config.enableDataIntegrity) {
                this.dataIntegrity = new DataIntegrityManager({
                    enablePeriodicChecks: true,
                    enableAutoBackup: true,
                    enableAutoRecovery: true,
                    paths: {
                        backups: join(this.config.baseDir, 'backups'),
                        integrity: join(this.config.baseDir, 'integrity'),
                        recovery: join(this.config.baseDir, 'recovery'),
                    },
                });
            }
            logger.info('PersistenceStorageAPI initialized successfully');
        }
        catch (error) {
            logger.error('Failed to initialize PersistenceStorageAPI:', error);
            throw error;
        }
    }
    /**
     * Save task with comprehensive persistence features
     */
    async save(task) {
        const startTime = Date.now();
        const operation = 'save';
        try {
            logger.info(`Saving task ${task.id} with comprehensive persistence`);
            // Create backup if data integrity is enabled
            if (this.dataIntegrity) {
                const existingTaskPath = this.getTaskMetadataPath(task.id);
                if (await fse.pathExists(existingTaskPath)) {
                    await this.dataIntegrity.createBackup(existingTaskPath, {
                        type: 'auto',
                        metadata: {
                            taskId: task.id,
                            operation: 'pre-save-backup',
                        },
                    });
                }
            }
            // Update session correlation if session management is enabled
            if (this.sessionManager) {
                const existingCorrelation = await this.sessionManager.getTaskCorrelation(task.id);
                if (existingCorrelation) {
                    // Update existing correlation
                    await this.sessionManager.updateTaskCorrelation(task.id, {
                        continuationData: {
                            ...existingCorrelation.continuationData,
                            resumePoint: task.status.state,
                            contextSummary: `Task updated: ${task.status.state}`,
                            preservedState: { lastSaved: new Date().toISOString() },
                        },
                    });
                }
                else {
                    // Create new correlation
                    await this.sessionManager.createTaskCorrelation(task.id);
                }
            }
            // Check for conflicts if conflict resolution is enabled
            if (this.conflictResolver && this.sessionManager) {
                const currentSession = this.sessionManager.getCurrentSession();
                const activeSessions = await this.sessionManager.getActiveSessions();
                const taskCorrelation = await this.sessionManager.getTaskCorrelation(task.id);
                const conflictAnalysis = await this.conflictResolver.analyzeTaskConflicts(task.id, currentSession, activeSessions, taskCorrelation);
                if (conflictAnalysis.hasConflict && conflictAnalysis.canAutoResolve) {
                    logger.info(`Auto-resolving conflicts for task ${task.id}`);
                    await this.conflictResolver.resolveConflicts(task.id, conflictAnalysis);
                }
            }
            // Perform the actual save
            await this.fileStorage.save(task);
            // Verify integrity after save
            if (this.dataIntegrity) {
                const taskPath = this.getTaskMetadataPath(task.id);
                const integrityResult = await this.dataIntegrity.verifyFileIntegrity(taskPath);
                if (!integrityResult.isValid) {
                    logger.warn(`Integrity check failed after saving task ${task.id}`);
                    // Attempt auto-recovery
                    await this.dataIntegrity.performAutoRecovery(taskPath);
                }
            }
            // Record metrics
            this.recordOperationMetrics(operation, Date.now() - startTime);
            logger.info(`Task ${task.id} saved successfully in ${Date.now() - startTime}ms`);
        }
        catch (error) {
            logger.error(`Failed to save task ${task.id}:`, error);
            this.recordOperationMetrics(`${operation}_failed`, Date.now() - startTime);
            throw error;
        }
    }
    /**
     * Load task with cross-session continuity support
     */
    async load(taskId) {
        const startTime = Date.now();
        const operation = 'load';
        try {
            logger.info(`Loading task ${taskId} with cross-session continuity`);
            // Check for conflicts before loading
            if (this.conflictResolver && this.sessionManager) {
                const currentSession = this.sessionManager.getCurrentSession();
                const activeSessions = await this.sessionManager.getActiveSessions();
                const taskCorrelation = await this.sessionManager.getTaskCorrelation(taskId);
                const conflictAnalysis = await this.conflictResolver.analyzeTaskConflicts(taskId, currentSession, activeSessions, taskCorrelation);
                if (conflictAnalysis.hasConflict) {
                    if (conflictAnalysis.canAutoResolve) {
                        logger.info(`Auto-resolving conflicts for task ${taskId}`);
                        await this.conflictResolver.resolveConflicts(taskId, conflictAnalysis);
                    }
                    else {
                        logger.warn(`Manual conflict resolution required for task ${taskId}`);
                    }
                }
            }
            // Verify integrity before loading
            if (this.dataIntegrity) {
                const taskPath = this.getTaskMetadataPath(taskId);
                if (await fse.pathExists(taskPath)) {
                    const integrityResult = await this.dataIntegrity.verifyFileIntegrity(taskPath);
                    if (!integrityResult.isValid) {
                        logger.warn(`Integrity check failed for task ${taskId}, attempting recovery`);
                        const recovery = await this.dataIntegrity.performAutoRecovery(taskPath);
                        if (!recovery || !recovery.outcome?.success) {
                            throw new Error(`Task ${taskId} failed integrity check and recovery failed`);
                        }
                    }
                }
            }
            // Perform the actual load
            const task = await this.fileStorage.load(taskId);
            if (task && this.sessionManager) {
                // Resume task in current session
                await this.sessionManager.resumeTask(taskId, `Task resumed in session ${this.sessionManager.getCurrentSession().sessionId}`);
            }
            // Record metrics
            this.recordOperationMetrics(operation, Date.now() - startTime);
            if (task) {
                logger.info(`Task ${taskId} loaded successfully in ${Date.now() - startTime}ms`);
            }
            else {
                logger.debug(`Task ${taskId} not found`);
            }
            return task;
        }
        catch (error) {
            logger.error(`Failed to load task ${taskId}:`, error);
            this.recordOperationMetrics(`${operation}_failed`, Date.now() - startTime);
            throw error;
        }
    }
    /**
     * Complete task with comprehensive cleanup
     */
    async completeTask(taskId, completionSummary, preservedState) {
        const startTime = Date.now();
        try {
            logger.info(`Completing task ${taskId}`);
            let correlation;
            // Update session correlation
            if (this.sessionManager) {
                correlation = await this.sessionManager.completeTask(taskId, completionSummary, preservedState);
            }
            // Create completion backup
            if (this.dataIntegrity) {
                const taskPath = this.getTaskMetadataPath(taskId);
                if (await fse.pathExists(taskPath)) {
                    await this.dataIntegrity.createBackup(taskPath, {
                        type: 'manual',
                        metadata: {
                            taskId,
                            operation: 'task-completion',
                            completionSummary,
                        },
                        priority: 'high',
                    });
                }
            }
            const duration = Date.now() - startTime;
            this.recordOperationMetrics('complete', duration);
            return {
                success: true,
                data: correlation,
                metadata: {
                    operation: 'complete',
                    duration,
                    timestamp: new Date().toISOString(),
                    sessionId: this.sessionManager?.getCurrentSession().sessionId,
                },
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.recordOperationMetrics('complete_failed', duration);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                metadata: {
                    operation: 'complete',
                    duration,
                    timestamp: new Date().toISOString(),
                },
            };
        }
    }
    /**
     * Transfer task ownership between sessions
     */
    async transferTask(taskId, targetSessionId, reason = 'Manual transfer') {
        const startTime = Date.now();
        try {
            if (!this.sessionManager) {
                throw new Error('Session management is not enabled');
            }
            const handoff = await this.sessionManager.transferTaskOwnership(taskId, targetSessionId, reason);
            const duration = Date.now() - startTime;
            return {
                success: true,
                data: handoff,
                metadata: {
                    operation: 'transfer',
                    duration,
                    timestamp: new Date().toISOString(),
                    sessionId: this.sessionManager.getCurrentSession().sessionId,
                },
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                metadata: {
                    operation: 'transfer',
                    duration,
                    timestamp: new Date().toISOString(),
                },
            };
        }
    }
    /**
     * Resolve conflicts for a specific task
     */
    async resolveTaskConflicts(taskId, strategy) {
        const startTime = Date.now();
        try {
            if (!this.conflictResolver || !this.sessionManager) {
                throw new Error('Conflict resolution or session management is not enabled');
            }
            const currentSession = this.sessionManager.getCurrentSession();
            const activeSessions = await this.sessionManager.getActiveSessions();
            const taskCorrelation = await this.sessionManager.getTaskCorrelation(taskId);
            // Analyze conflicts
            const analysis = await this.conflictResolver.analyzeTaskConflicts(taskId, currentSession, activeSessions, taskCorrelation);
            let conflictsResolved = 0;
            // Resolve if conflicts exist
            if (analysis.hasConflict) {
                const resolution = await this.conflictResolver.resolveConflicts(taskId, analysis, strategy);
                conflictsResolved = resolution.outcome.success ? 1 : 0;
            }
            const duration = Date.now() - startTime;
            return {
                success: true,
                data: analysis,
                metadata: {
                    operation: 'resolve_conflicts',
                    duration,
                    timestamp: new Date().toISOString(),
                    sessionId: currentSession.sessionId,
                    conflictsResolved,
                },
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                metadata: {
                    operation: 'resolve_conflicts',
                    duration,
                    timestamp: new Date().toISOString(),
                },
            };
        }
    }
    /**
     * Perform data recovery for a task
     */
    async recoverTask(taskId, backupId) {
        const startTime = Date.now();
        try {
            if (!this.dataIntegrity) {
                throw new Error('Data integrity management is not enabled');
            }
            let recovery;
            if (backupId) {
                // Recover from specific backup
                recovery = await this.dataIntegrity.restoreFromBackup(backupId);
            }
            else {
                // Attempt auto-recovery
                const taskPath = this.getTaskMetadataPath(taskId);
                const autoRecovery = await this.dataIntegrity.performAutoRecovery(taskPath);
                if (!autoRecovery) {
                    throw new Error('No suitable backup found for auto-recovery');
                }
                recovery = autoRecovery;
            }
            const duration = Date.now() - startTime;
            return {
                success: recovery.outcome?.success ?? false,
                data: recovery,
                metadata: {
                    operation: 'recover',
                    duration,
                    timestamp: new Date().toISOString(),
                },
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                metadata: {
                    operation: 'recover',
                    duration,
                    timestamp: new Date().toISOString(),
                },
            };
        }
    }
    /**
     * Get comprehensive storage statistics
     */
    async getStorageStatistics() {
        const fileStats = await this.fileStorage.getMetrics();
        const sessionStats = this.sessionManager ? await this.sessionManager.getSessionStatistics() : {
            totalSessions: 0,
            activeSessions: 0,
            completedSessions: 0,
            totalTasks: 0,
            activeTasks: 0,
            completedTasks: 0,
            averageSessionDuration: 0,
        };
        const integrityStats = this.dataIntegrity ? await this.dataIntegrity.getStatistics() : {
            totalBackups: 0,
            totalBackupSize: 0,
            backupsByType: {},
            recentRecoveries: 0,
            failedIntegrityChecks: 0,
            storageUtilization: { backups: 0, integrity: 0, recovery: 0 },
        };
        // Calculate performance metrics
        const saveMetrics = this.operationMetrics.get('save') || { count: 0, totalTime: 0 };
        const loadMetrics = this.operationMetrics.get('load') || { count: 0, totalTime: 0 };
        const avgSaveTime = saveMetrics.count > 0 ? saveMetrics.totalTime / saveMetrics.count : 0;
        const avgLoadTime = loadMetrics.count > 0 ? loadMetrics.totalTime / loadMetrics.count : 0;
        // Determine health status
        const failureRate = this.calculateFailureRate();
        const diskUsage = await this.calculateDiskUsage();
        let healthStatus = 'healthy';
        if (failureRate > this.config.monitoring.alertThresholds.failureRate ||
            diskUsage > this.config.monitoring.alertThresholds.diskUsage) {
            healthStatus = 'warning';
        }
        if (failureRate > 15 || diskUsage > 95) {
            healthStatus = 'critical';
        }
        return {
            healthStatus,
            tasks: {
                total: fileStats.totalTasks,
                active: fileStats.activeTasks,
                completed: fileStats.completedTasks,
                failed: 0, // Would need to track this separately
                avgProcessingTime: (avgSaveTime + avgLoadTime) / 2,
            },
            sessions: {
                active: sessionStats.activeSessions,
                total: sessionStats.totalSessions,
                avgDuration: sessionStats.averageSessionDuration,
                handoffs: 0, // Would need to track from session manager
            },
            conflicts: {
                total: 0, // Would get from conflict resolver
                resolved: 0,
                pending: 0,
                autoResolvedRate: 0,
            },
            integrity: {
                totalChecks: 0, // Would track separately
                failedChecks: integrityStats.failedIntegrityChecks,
                backups: integrityStats.totalBackups,
                recoveries: integrityStats.recentRecoveries,
            },
            storage: {
                totalSize: fileStats.storageSize + integrityStats.totalBackupSize,
                usedSpace: fileStats.storageSize,
                availableSpace: 0, // Would calculate from filesystem
                compressionRatio: fileStats.compressionRatio,
            },
            performance: {
                avgSaveTime,
                avgLoadTime,
                throughput: this.calculateThroughput(),
            },
        };
    }
    /**
     * Perform comprehensive maintenance
     */
    async performMaintenance() {
        const startTime = Date.now();
        try {
            logger.info('Performing comprehensive storage maintenance');
            const results = {
                cleanupResults: null,
                integrityResults: null,
                sessionResults: null,
            };
            // File storage cleanup
            results.cleanupResults = await this.fileStorage.performCleanup();
            // Data integrity maintenance
            if (this.dataIntegrity) {
                results.integrityResults = await this.dataIntegrity.cleanupOldBackups();
            }
            // Session management cleanup (would implement in session manager)
            if (this.sessionManager) {
                // results.sessionResults = await this.sessionManager.performMaintenance();
            }
            const duration = Date.now() - startTime;
            return {
                success: true,
                data: results,
                metadata: {
                    operation: 'maintenance',
                    duration,
                    timestamp: new Date().toISOString(),
                },
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                metadata: {
                    operation: 'maintenance',
                    duration,
                    timestamp: new Date().toISOString(),
                },
            };
        }
    }
    /**
     * Get active sessions
     */
    async getActiveSessions() {
        if (!this.sessionManager) {
            return [];
        }
        return await this.sessionManager.getActiveSessions();
    }
    /**
     * Get task backups
     */
    getTaskBackups(taskId) {
        if (!this.dataIntegrity) {
            return [];
        }
        return this.dataIntegrity.getFileBackups(this.getTaskMetadataPath(taskId));
    }
    /**
     * Get session task correlations
     */
    async getSessionTasks(sessionId) {
        if (!this.sessionManager) {
            return [];
        }
        return await this.sessionManager.getSessionTasks(sessionId);
    }
    /**
     * Shutdown persistence storage API
     */
    async shutdown() {
        logger.info('Shutting down PersistenceStorageAPI');
        // Shutdown all components
        if (this.sessionManager) {
            await this.sessionManager.shutdown();
        }
        if (this.conflictResolver) {
            await this.conflictResolver.shutdown();
        }
        if (this.dataIntegrity) {
            await this.dataIntegrity.shutdown();
        }
        logger.info('PersistenceStorageAPI shut down gracefully');
    }
    // Private helper methods
    getTaskMetadataPath(taskId) {
        const compress = this.config.fileStorage.compressMetadata;
        return join(this.config.fileStorage.storageDir, 'tasks', `${taskId}.json${compress ? '.gz' : ''}`);
    }
    recordOperationMetrics(operation, duration) {
        if (!this.config.monitoring.enableMetrics) {
            return;
        }
        const existing = this.operationMetrics.get(operation) || { count: 0, totalTime: 0 };
        existing.count++;
        existing.totalTime += duration;
        this.operationMetrics.set(operation, existing);
    }
    calculateFailureRate() {
        let totalOps = 0;
        let failedOps = 0;
        for (const [operation, metrics] of this.operationMetrics) {
            totalOps += metrics.count;
            if (operation.endsWith('_failed')) {
                failedOps += metrics.count;
            }
        }
        return totalOps > 0 ? (failedOps / totalOps) * 100 : 0;
    }
    async calculateDiskUsage() {
        // This would calculate actual disk usage percentage
        // For now, return a placeholder
        return 0;
    }
    calculateThroughput() {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        // Calculate operations per second over the last hour
        let recentOps = 0;
        for (const metrics of this.operationMetrics.values()) {
            // This is a simplified calculation
            // In a real implementation, you'd track timestamps
            recentOps += metrics.count;
        }
        return recentOps / (3600); // ops per second
    }
}
//# sourceMappingURL=PersistenceStorageAPI.js.map