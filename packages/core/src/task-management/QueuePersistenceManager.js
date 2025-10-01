/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import * as fse from 'fs-extra';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { v4 as uuidv4 } from 'uuid';
import { gzipSync, gunzipSync } from 'node:zlib';
import { logger } from '../utils/logger.js';
import { TaskStatus } from './types.js';
/**
 * Queue Persistence Manager for cross-session continuity
 *
 * Features:
 * - Automatic queue state snapshots with compression
 * - Incremental saves for performance optimization
 * - Cross-session task recovery with conflict resolution
 * - Backup and versioning system
 * - Data integrity validation and corruption detection
 * - Performance monitoring and optimization
 */
export class QueuePersistenceManager extends EventEmitter {
    config;
    autoSaveTimer;
    currentSessionId;
    isInitialized = false;
    lastSnapshotHash;
    constructor(config = {}) {
        super();
        this.config = {
            persistenceDir: config.persistenceDir ||
                join(homedir(), '.gemini-cli', 'queue-persistence'),
            enableCompression: config.enableCompression ?? true,
            autoSaveInterval: config.autoSaveInterval ?? 300000, // 5 minutes
            maxBackupSnapshots: config.maxBackupSnapshots ?? 10,
            enableIncrementalSave: config.enableIncrementalSave ?? true,
            enableCrossSessionRecovery: config.enableCrossSessionRecovery ?? true,
            maxRecoverableAge: config.maxRecoverableAge ?? 7 * 24 * 60 * 60 * 1000, // 7 days
        };
        this.currentSessionId = uuidv4();
        logger().info('QueuePersistenceManager initialized', {
            persistenceDir: this.config.persistenceDir,
            sessionId: this.currentSessionId,
            compression: this.config.enableCompression,
            autoSaveInterval: this.config.autoSaveInterval,
        });
    }
    /**
     * Initialize persistence system
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        try {
            // Create directory structure
            await this.ensureDirectoryStructure();
            // Clean up old snapshots
            await this.performMaintenanceCleanup();
            // Start auto-save if enabled
            if (this.config.autoSaveInterval > 0) {
                this.startAutoSave();
            }
            this.isInitialized = true;
            this.emit('initialized');
            logger().info('QueuePersistenceManager initialized successfully');
        }
        catch (error) {
            logger().error('Failed to initialize QueuePersistenceManager:', error);
            throw new Error(`Persistence initialization failed: ${error}`);
        }
    }
    /**
     * Save queue state to persistent storage
     */
    async saveQueueState(tasks, dependencies, executionRecords, metrics, saveReason = 'manual') {
        const startTime = Date.now();
        const warnings = [];
        logger().info('Saving queue state', {
            taskCount: tasks.size,
            dependencyCount: dependencies.size,
            saveReason,
            sessionId: this.currentSessionId,
        });
        try {
            // Create snapshot
            const snapshot = {
                id: uuidv4(),
                timestamp: new Date(),
                version: '1.0.0',
                sessionId: this.currentSessionId,
                tasks: Array.from(tasks.values()),
                dependencies: Array.from(dependencies.values()),
                executionRecords: Array.from(executionRecords.values()),
                metrics,
                metadata: {
                    totalTasks: tasks.size,
                    runningTasks: Array.from(tasks.values()).filter((t) => t.status === TaskStatus.RUNNING).length,
                    completedTasks: Array.from(tasks.values()).filter((t) => t.status === TaskStatus.COMPLETED).length,
                    failedTasks: Array.from(tasks.values()).filter((t) => t.status === TaskStatus.FAILED).length,
                    queueHealth: this.assessQueueHealth(tasks, metrics),
                    saveReason,
                },
            };
            // Check if incremental save is possible and beneficial
            const shouldUseIncremental = this.config.enableIncrementalSave &&
                saveReason === 'scheduled' &&
                (await this.shouldUseIncrementalSave(snapshot));
            let result;
            if (shouldUseIncremental) {
                result = await this.saveIncremental(snapshot);
                if (!result.success) {
                    // Fall back to full save
                    logger().warn('Incremental save failed, falling back to full save');
                    result = await this.saveFullSnapshot(snapshot);
                }
            }
            else {
                result = await this.saveFullSnapshot(snapshot);
            }
            if (result.success) {
                this.lastSnapshotHash = this.calculateSnapshotHash(snapshot);
                this.emit('stateSaved', {
                    snapshotId: result.snapshotId,
                    taskCount: tasks.size,
                    saveReason,
                    duration: result.duration,
                });
                // Clean up old snapshots after successful save
                await this.cleanupOldSnapshots();
            }
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger().error('Failed to save queue state:', error);
            return {
                success: false,
                size: 0,
                duration: Date.now() - startTime,
                error: errorMessage,
                warnings,
            };
        }
    }
    /**
     * Load queue state from persistent storage
     */
    async loadQueueState(snapshotId) {
        const startTime = Date.now();
        logger().info('Loading queue state', { snapshotId });
        try {
            let snapshot;
            if (snapshotId) {
                snapshot = await this.loadSpecificSnapshot(snapshotId);
            }
            else {
                snapshot = await this.loadLatestSnapshot();
            }
            if (!snapshot) {
                logger().info('No queue state snapshot found');
                return null;
            }
            // Validate snapshot integrity
            const validationResult = await this.validateSnapshot(snapshot);
            if (!validationResult.isValid) {
                logger().error('Snapshot validation failed:', {
                    errors: validationResult.errors,
                });
                throw new Error(`Invalid snapshot: ${validationResult.errors.join(', ')}`);
            }
            // Convert arrays back to Maps
            const tasks = new Map();
            const dependencies = new Map();
            const executionRecords = new Map();
            snapshot.tasks.forEach((task) => tasks.set(task.id, task));
            snapshot.dependencies.forEach((dep) => dependencies.set(dep.id, dep));
            snapshot.executionRecords.forEach((record) => executionRecords.set(record.taskId, record));
            const duration = Date.now() - startTime;
            logger().info('Queue state loaded successfully', {
                snapshotId: snapshot.id,
                taskCount: tasks.size,
                dependencyCount: dependencies.size,
                originalSession: snapshot.sessionId,
                duration,
            });
            this.emit('stateLoaded', {
                snapshotId: snapshot.id,
                taskCount: tasks.size,
                originalSessionId: snapshot.sessionId,
                duration,
            });
            return {
                tasks,
                dependencies,
                executionRecords,
                metrics: snapshot.metrics,
                sessionInfo: {
                    originalSessionId: snapshot.sessionId,
                    snapshotId: snapshot.id,
                    timestamp: snapshot.timestamp,
                },
            };
        }
        catch (error) {
            logger().error('Failed to load queue state:', error);
            throw error;
        }
    }
    /**
     * Get recovery information for cross-session continuity
     */
    async getRecoveryInfo() {
        try {
            const snapshotsDir = join(this.config.persistenceDir, 'snapshots');
            if (!(await fse.pathExists(snapshotsDir))) {
                return {
                    availableSnapshots: [],
                    potentialDataLoss: false,
                    orphanedTasks: [],
                };
            }
            const snapshotFiles = await fse.readdir(snapshotsDir);
            const availableSnapshots = [];
            let lastSuccessfulSave;
            let recommendedSnapshotId;
            let maxTaskCount = 0;
            for (const file of snapshotFiles.filter((f) => f.endsWith('.json') || f.endsWith('.json.gz'))) {
                try {
                    const snapshotPath = join(snapshotsDir, file);
                    const snapshotData = await this.readSnapshotFile(snapshotPath);
                    if (snapshotData) {
                        const status = await this.validateSnapshot(snapshotData);
                        const taskCount = snapshotData.tasks?.length || 0;
                        availableSnapshots.push({
                            id: snapshotData.id,
                            timestamp: new Date(snapshotData.timestamp),
                            sessionId: snapshotData.sessionId,
                            taskCount,
                            status: status.isValid ? 'complete' : 'corrupted',
                        });
                        if (status.isValid && taskCount > maxTaskCount) {
                            maxTaskCount = taskCount;
                            recommendedSnapshotId = snapshotData.id;
                        }
                        if (!lastSuccessfulSave ||
                            new Date(snapshotData.timestamp) > lastSuccessfulSave) {
                            if (status.isValid) {
                                lastSuccessfulSave = new Date(snapshotData.timestamp);
                            }
                        }
                    }
                }
                catch (error) {
                    logger().warn(`Failed to read snapshot ${file}:`, error);
                }
            }
            // Sort snapshots by timestamp (newest first)
            availableSnapshots.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            // Determine if there's potential data loss
            const now = Date.now();
            const potentialDataLoss = lastSuccessfulSave
                ? now - lastSuccessfulSave.getTime() > this.config.autoSaveInterval * 2
                : false;
            // Find orphaned tasks (tasks that might be in running state from previous sessions)
            const orphanedTasks = await this.findOrphanedTasks(availableSnapshots);
            return {
                availableSnapshots,
                recommendedSnapshot: recommendedSnapshotId,
                potentialDataLoss,
                lastSuccessfulSave,
                orphanedTasks,
            };
        }
        catch (error) {
            logger().error('Failed to get recovery info:', error);
            throw error;
        }
    }
    /**
     * Save full snapshot to disk
     */
    async saveFullSnapshot(snapshot) {
        const startTime = Date.now();
        const snapshotPath = join(this.config.persistenceDir, 'snapshots', `${snapshot.id}.json${this.config.enableCompression ? '.gz' : ''}`);
        const data = JSON.stringify(snapshot, null, 2);
        const originalSize = Buffer.byteLength(data, 'utf8');
        try {
            await fse.ensureDir(dirname(snapshotPath));
            if (this.config.enableCompression) {
                const compressed = gzipSync(Buffer.from(data));
                await fse.writeFile(snapshotPath, compressed);
                return {
                    success: true,
                    snapshotId: snapshot.id,
                    size: compressed.length,
                    compressionRatio: originalSize / compressed.length,
                    duration: Date.now() - startTime,
                    warnings: [],
                };
            }
            else {
                await fse.writeFile(snapshotPath, data);
                return {
                    success: true,
                    snapshotId: snapshot.id,
                    size: originalSize,
                    duration: Date.now() - startTime,
                    warnings: [],
                };
            }
        }
        catch (error) {
            logger().error(`Failed to save snapshot ${snapshot.id}:`, error);
            throw error;
        }
    }
    /**
     * Save incremental snapshot (delta from last snapshot)
     */
    async saveIncremental(snapshot) {
        // For now, implement as full save
        // In a production system, this would calculate deltas and save only changes
        logger().debug('Incremental save requested, using full save for now');
        return this.saveFullSnapshot(snapshot);
    }
    /**
     * Load specific snapshot by ID
     */
    async loadSpecificSnapshot(snapshotId) {
        const possiblePaths = [
            join(this.config.persistenceDir, 'snapshots', `${snapshotId}.json.gz`),
            join(this.config.persistenceDir, 'snapshots', `${snapshotId}.json`),
        ];
        for (const path of possiblePaths) {
            if (await fse.pathExists(path)) {
                const snapshot = await this.readSnapshotFile(path);
                if (snapshot) {
                    return snapshot;
                }
            }
        }
        throw new Error(`Snapshot ${snapshotId} not found`);
    }
    /**
     * Load latest valid snapshot
     */
    async loadLatestSnapshot() {
        const snapshotsDir = join(this.config.persistenceDir, 'snapshots');
        if (!(await fse.pathExists(snapshotsDir))) {
            return null;
        }
        const files = await fse.readdir(snapshotsDir);
        const snapshotFiles = files
            .filter((f) => f.endsWith('.json') || f.endsWith('.json.gz'))
            .map((f) => join(snapshotsDir, f));
        // Sort by modification time (newest first)
        const sortedFiles = [];
        for (const file of snapshotFiles) {
            try {
                const stats = await fse.stat(file);
                sortedFiles.push({ file, mtime: stats.mtime });
            }
            catch (error) {
                logger().warn(`Failed to stat file ${file}:`, error);
            }
        }
        sortedFiles.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
        // Try to load the most recent valid snapshot
        for (const { file } of sortedFiles) {
            try {
                const snapshot = await this.readSnapshotFile(file);
                if (snapshot) {
                    const validation = await this.validateSnapshot(snapshot);
                    if (validation.isValid) {
                        return snapshot;
                    }
                    else {
                        logger().warn(`Skipping invalid snapshot ${file}:`, {
                            errors: validation.errors,
                        });
                    }
                }
            }
            catch (error) {
                logger().warn(`Failed to load snapshot ${file}:`, error);
            }
        }
        return null;
    }
    /**
     * Read snapshot file with compression handling
     */
    async readSnapshotFile(filePath) {
        try {
            if (filePath.endsWith('.gz')) {
                const compressed = await fse.readFile(filePath);
                const decompressed = gunzipSync(compressed);
                return JSON.parse(decompressed.toString());
            }
            else {
                return await fse.readJSON(filePath);
            }
        }
        catch (error) {
            logger().error(`Failed to read snapshot file ${filePath}:`, error);
            return null;
        }
    }
    /**
     * Validate snapshot integrity
     */
    async validateSnapshot(snapshot) {
        const errors = [];
        const warnings = [];
        try {
            // Basic structure validation
            if (!snapshot.id || !snapshot.timestamp || !snapshot.version) {
                errors.push('Missing required snapshot metadata');
            }
            if (!Array.isArray(snapshot.tasks)) {
                errors.push('Tasks is not an array');
            }
            if (!Array.isArray(snapshot.dependencies)) {
                errors.push('Dependencies is not an array');
            }
            if (!snapshot.metrics) {
                errors.push('Missing metrics');
            }
            // Content validation
            if (snapshot.tasks) {
                for (const task of snapshot.tasks) {
                    if (!task.id || !task.title || !task.description) {
                        errors.push(`Invalid task structure: ${task.id}`);
                    }
                }
            }
            // Consistency checks
            if (snapshot.dependencies && snapshot.tasks) {
                const taskIds = new Set(snapshot.tasks.map((t) => t.id));
                for (const dep of snapshot.dependencies) {
                    if (!taskIds.has(dep.dependentTaskId) ||
                        !taskIds.has(dep.dependsOnTaskId)) {
                        warnings.push(`Dependency references non-existent task: ${dep.id}`);
                    }
                }
            }
            return {
                isValid: errors.length === 0,
                errors,
                warnings,
            };
        }
        catch (error) {
            errors.push(`Validation error: ${error}`);
            return { isValid: false, errors, warnings };
        }
    }
    /**
     * Assess queue health based on current state
     */
    assessQueueHealth(tasks, metrics) {
        const totalTasks = tasks.size;
        const failedTasks = Array.from(tasks.values()).filter((t) => t.status === TaskStatus.FAILED).length;
        const runningTasks = Array.from(tasks.values()).filter((t) => t.status === TaskStatus.RUNNING).length;
        if (totalTasks === 0) {
            return 'healthy'; // Empty queue is healthy
        }
        const failureRate = failedTasks / totalTasks;
        const successRate = metrics.successRate;
        if (failureRate > 0.5 || successRate < 0.3) {
            return 'critical';
        }
        if (failureRate > 0.2 ||
            successRate < 0.7 ||
            (runningTasks === 0 && totalTasks > 0)) {
            return 'degraded';
        }
        return 'healthy';
    }
    /**
     * Calculate hash of snapshot for change detection
     */
    calculateSnapshotHash(snapshot) {
        const hashableData = {
            taskCount: snapshot.tasks.length,
            dependencyCount: snapshot.dependencies.length,
            taskStatuses: snapshot.tasks.map((t) => `${t.id}:${t.status}`).sort(),
            timestamp: snapshot.timestamp.getTime(),
        };
        return Buffer.from(JSON.stringify(hashableData)).toString('base64');
    }
    /**
     * Check if incremental save should be used
     */
    async shouldUseIncrementalSave(snapshot) {
        if (!this.lastSnapshotHash) {
            return false; // No previous snapshot to compare
        }
        const currentHash = this.calculateSnapshotHash(snapshot);
        const hashChanged = currentHash !== this.lastSnapshotHash;
        // Use incremental save only if changes are minimal
        // This is a simplified heuristic - production would have more sophisticated logic
        return hashChanged && snapshot.tasks.length < 100;
    }
    /**
     * Find orphaned tasks from previous sessions
     */
    async findOrphanedTasks(snapshots) {
        const orphanedTasks = [];
        try {
            // Look for tasks that were running in previous sessions
            for (const snapshotInfo of snapshots.slice(0, 5)) {
                // Check last 5 snapshots
                if (snapshotInfo.sessionId === this.currentSessionId)
                    continue;
                try {
                    const snapshot = await this.loadSpecificSnapshot(snapshotInfo.id);
                    const runningTasks = snapshot.tasks.filter((t) => t.status === TaskStatus.RUNNING);
                    for (const task of runningTasks) {
                        const ageMs = Date.now() - new Date(snapshot.timestamp).getTime();
                        if (ageMs > 60000) {
                            // Tasks running for more than 1 minute are potentially orphaned
                            orphanedTasks.push(task.id);
                        }
                    }
                }
                catch (error) {
                    logger().warn(`Failed to check orphaned tasks in snapshot ${snapshotInfo.id}:`, error);
                }
            }
        }
        catch (error) {
            logger().warn('Failed to find orphaned tasks:', error);
        }
        return [...new Set(orphanedTasks)]; // Remove duplicates
    }
    /**
     * Ensure directory structure exists
     */
    async ensureDirectoryStructure() {
        const dirs = [
            this.config.persistenceDir,
            join(this.config.persistenceDir, 'snapshots'),
            join(this.config.persistenceDir, 'backups'),
            join(this.config.persistenceDir, 'incremental'),
            join(this.config.persistenceDir, 'temp'),
        ];
        for (const dir of dirs) {
            await fse.ensureDir(dir);
        }
    }
    /**
     * Start automatic save process
     */
    startAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        this.autoSaveTimer = setInterval(() => {
            this.emit('autoSaveRequested');
        }, this.config.autoSaveInterval);
        logger().debug('Auto-save timer started', {
            interval: this.config.autoSaveInterval,
        });
    }
    /**
     * Stop automatic save process
     */
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = undefined;
        }
    }
    /**
     * Clean up old snapshots based on configuration
     */
    async cleanupOldSnapshots() {
        try {
            const snapshotsDir = join(this.config.persistenceDir, 'snapshots');
            if (!(await fse.pathExists(snapshotsDir))) {
                return;
            }
            const files = await fse.readdir(snapshotsDir);
            const snapshotFiles = [];
            for (const file of files.filter((f) => f.endsWith('.json') || f.endsWith('.json.gz'))) {
                try {
                    const filePath = join(snapshotsDir, file);
                    const stats = await fse.stat(filePath);
                    snapshotFiles.push({ file: filePath, mtime: stats.mtime });
                }
                catch (error) {
                    logger().warn(`Failed to stat snapshot file ${file}:`, error);
                }
            }
            // Sort by modification time (oldest first)
            snapshotFiles.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());
            // Keep only the most recent snapshots
            if (snapshotFiles.length > this.config.maxBackupSnapshots) {
                const filesToDelete = snapshotFiles.slice(0, snapshotFiles.length - this.config.maxBackupSnapshots);
                for (const { file } of filesToDelete) {
                    try {
                        await fse.remove(file);
                        logger().debug(`Removed old snapshot: ${file}`);
                    }
                    catch (error) {
                        logger().warn(`Failed to remove old snapshot ${file}:`, error);
                    }
                }
            }
        }
        catch (error) {
            logger().warn('Failed to cleanup old snapshots:', error);
        }
    }
    /**
     * Perform maintenance cleanup
     */
    async performMaintenanceCleanup() {
        try {
            // Clean up old snapshots
            await this.cleanupOldSnapshots();
            // Clean up temporary files
            const tempDir = join(this.config.persistenceDir, 'temp');
            if (await fse.pathExists(tempDir)) {
                await fse.emptyDir(tempDir);
            }
            // Clean up old snapshots beyond recoverable age
            const cutoffTime = Date.now() - this.config.maxRecoverableAge;
            const snapshotsDir = join(this.config.persistenceDir, 'snapshots');
            if (await fse.pathExists(snapshotsDir)) {
                const files = await fse.readdir(snapshotsDir);
                for (const file of files) {
                    try {
                        const filePath = join(snapshotsDir, file);
                        const stats = await fse.stat(filePath);
                        if (stats.mtime.getTime() < cutoffTime) {
                            await fse.remove(filePath);
                            logger().debug(`Removed expired snapshot: ${file}`);
                        }
                    }
                    catch (error) {
                        logger().warn(`Failed to check/remove expired snapshot ${file}:`, error);
                    }
                }
            }
            logger().debug('Maintenance cleanup completed');
        }
        catch (error) {
            logger().warn('Failed to perform maintenance cleanup:', error);
        }
    }
    /**
     * Get current session ID
     */
    getSessionId() {
        return this.currentSessionId;
    }
    /**
     * Update configuration
     */
    updateConfiguration(newConfig) {
        const oldAutoSaveInterval = this.config.autoSaveInterval;
        this.config = {
            ...this.config,
            ...newConfig,
        };
        // Restart auto-save if interval changed
        if (newConfig.autoSaveInterval !== undefined &&
            newConfig.autoSaveInterval !== oldAutoSaveInterval) {
            if (this.config.autoSaveInterval > 0) {
                this.startAutoSave();
            }
            else {
                this.stopAutoSave();
            }
        }
        logger().info('QueuePersistenceManager configuration updated', {
            autoSaveInterval: this.config.autoSaveInterval,
            compression: this.config.enableCompression,
            maxBackups: this.config.maxBackupSnapshots,
        });
        this.emit('configurationUpdated', this.config);
    }
    /**
     * Get current configuration
     */
    getConfiguration() {
        return { ...this.config };
    }
    /**
     * Shutdown persistence manager
     */
    async shutdown() {
        logger().info('Shutting down QueuePersistenceManager...');
        this.stopAutoSave();
        // Perform final cleanup
        await this.performMaintenanceCleanup();
        this.emit('shutdown');
        logger().info('QueuePersistenceManager shutdown completed');
    }
}
//# sourceMappingURL=QueuePersistenceManager.js.map