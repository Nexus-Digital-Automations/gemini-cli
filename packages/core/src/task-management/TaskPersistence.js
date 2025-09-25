/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { EventEmitter } from 'node:events';
import { logger } from '../utils/logger.js';
/**
 * Cross-session task persistence manager with intelligent state management
 */
export class TaskPersistence extends EventEmitter {
    options;
    functionRegistry;
    autoSaveTimer;
    backupTimer;
    isInitialized = false;
    constructor(options = {}) {
        super();
        this.options = {
            storageDir: options.storageDir ??
                path.join(process.cwd(), '.gemini-cli', 'task-queue'),
            filename: options.filename ?? 'queue-state.json',
            autoSave: options.autoSave ?? true,
            autoSaveInterval: options.autoSaveInterval ?? 30000, // 30 seconds
            enableBackups: options.enableBackups ?? true,
            backupConfig: {
                enabled: true,
                interval: 300000, // 5 minutes
                maxBackups: 10,
                compressionEnabled: false,
                encryptionEnabled: false,
                ...options.backupConfig,
            },
            enableMigration: options.enableMigration ?? true,
            compressionEnabled: options.compressionEnabled ?? false,
            ...options,
        };
        this.functionRegistry = {
            executeFunctions: new Map(),
            validateFunctions: new Map(),
            rollbackFunctions: new Map(),
        };
    }
    /**
     * Initialize persistence system
     */
    async initialize() {
        if (this.isInitialized)
            return;
        try {
            // Ensure storage directory exists
            await fs.mkdir(this.options.storageDir, { recursive: true });
            // Start auto-save timer
            if (this.options.autoSave) {
                this.startAutoSave();
            }
            // Start backup timer
            if (this.options.enableBackups && this.options.backupConfig.enabled) {
                this.startBackupTimer();
            }
            this.isInitialized = true;
            logger.info('Task persistence initialized', {
                storageDir: this.options.storageDir,
                autoSave: this.options.autoSave,
                enableBackups: this.options.enableBackups,
            });
            this.emit('initialized');
        }
        catch (error) {
            logger.error('Failed to initialize task persistence', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    /**
     * Register task execution functions for reconstruction
     */
    registerExecuteFunction(name, fn) {
        this.functionRegistry.executeFunctions.set(name, fn);
        logger.debug(`Registered execute function: ${name}`);
    }
    /**
     * Register task validation functions
     */
    registerValidateFunction(name, fn) {
        this.functionRegistry.validateFunctions.set(name, fn);
        logger.debug(`Registered validate function: ${name}`);
    }
    /**
     * Register task rollback functions
     */
    registerRollbackFunction(name, fn) {
        this.functionRegistry.rollbackFunctions.set(name, fn);
        logger.debug(`Registered rollback function: ${name}`);
    }
    /**
     * Save queue state to persistent storage
     */
    async saveQueueState(tasks, dependencies, completedTasks, failedTasks, runningTasks, metrics, sessionId = 'default') {
        try {
            const state = {
                version: '1.0.0',
                timestamp: new Date(),
                sessionId,
                tasks: Array.from(tasks.values()).map((task) => this.serializeTask(task)),
                dependencies: Array.from(dependencies.values()),
                completedTasks: Array.from(completedTasks.values()),
                failedTasks: Array.from(failedTasks.values()),
                runningTasks: Array.from(runningTasks),
                metrics,
                metadata: {
                    totalTasks: tasks.size,
                    totalDependencies: dependencies.size,
                    saveTimestamp: new Date().toISOString(),
                },
            };
            const filePath = path.join(this.options.storageDir, this.options.filename);
            const data = JSON.stringify(state, null, 2);
            // Atomic write using temporary file
            const tempPath = filePath + '.tmp';
            await fs.writeFile(tempPath, data, 'utf-8');
            await fs.rename(tempPath, filePath);
            logger.info('Queue state saved successfully', {
                filePath,
                taskCount: tasks.size,
                sessionId,
            });
            this.emit('stateSaved', state);
        }
        catch (error) {
            logger.error('Failed to save queue state', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    /**
     * Load queue state from persistent storage
     */
    async loadQueueState() {
        try {
            const filePath = path.join(this.options.storageDir, this.options.filename);
            // Check if file exists
            try {
                await fs.access(filePath);
            }
            catch {
                logger.info('No existing queue state found');
                return null;
            }
            const data = await fs.readFile(filePath, 'utf-8');
            const state = JSON.parse(data);
            // Perform version migration if needed
            if (this.options.enableMigration && this.needsMigration(state)) {
                await this.migrateState(state);
            }
            // Reconstruct tasks with functions
            const tasks = new Map();
            for (const serializedTask of state.tasks) {
                const task = await this.deserializeTask(serializedTask);
                tasks.set(task.id, task);
            }
            const dependencies = new Map();
            for (const dep of state.dependencies) {
                dependencies.set(dep.id, dep);
            }
            const completedTasks = new Map();
            for (const record of state.completedTasks) {
                completedTasks.set(record.taskId, record);
            }
            const failedTasks = new Map();
            for (const record of state.failedTasks) {
                failedTasks.set(record.taskId, record);
            }
            const runningTasks = new Set(state.runningTasks);
            logger.info('Queue state loaded successfully', {
                taskCount: tasks.size,
                dependencyCount: dependencies.size,
                sessionId: state.sessionId,
            });
            this.emit('stateLoaded', state);
            return {
                tasks,
                dependencies,
                completedTasks,
                failedTasks,
                runningTasks,
                metrics: state.metrics,
                sessionId: state.sessionId,
            };
        }
        catch (error) {
            logger.error('Failed to load queue state', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    /**
     * Create a backup of the current state
     */
    async createBackup(sessionId = 'default') {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFileName = `backup-${sessionId}-${timestamp}.json`;
            const backupPath = path.join(this.options.storageDir, 'backups', backupFileName);
            // Ensure backup directory exists
            await fs.mkdir(path.dirname(backupPath), { recursive: true });
            const sourcePath = path.join(this.options.storageDir, this.options.filename);
            // Copy current state file to backup
            try {
                const data = await fs.readFile(sourcePath, 'utf-8');
                await fs.writeFile(backupPath, data);
                logger.info('Backup created successfully', {
                    backupPath,
                    sessionId,
                });
                // Clean up old backups
                await this.cleanupOldBackups();
                this.emit('backupCreated', { path: backupPath, sessionId });
                return backupPath;
            }
            catch (sourceError) {
                logger.warn('No source file found for backup, skipping', {
                    sourcePath,
                });
                return '';
            }
        }
        catch (error) {
            logger.error('Failed to create backup', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    /**
     * Restore from a backup
     */
    async restoreFromBackup(backupPath) {
        try {
            const targetPath = path.join(this.options.storageDir, this.options.filename);
            // Validate backup file exists and is readable
            const backupData = await fs.readFile(backupPath, 'utf-8');
            const state = JSON.parse(backupData);
            // Basic validation
            if (!state.version || !state.tasks || !Array.isArray(state.tasks)) {
                throw new Error('Invalid backup file format');
            }
            // Create a backup of current state before restoring
            await this.createBackup('pre-restore');
            // Restore the backup
            await fs.writeFile(targetPath, backupData);
            logger.info('Restored from backup successfully', {
                backupPath,
                taskCount: state.tasks.length,
            });
            this.emit('backupRestored', { path: backupPath, state });
        }
        catch (error) {
            logger.error('Failed to restore from backup', {
                backupPath,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    /**
     * List available backups
     */
    async listBackups() {
        try {
            const backupDir = path.join(this.options.storageDir, 'backups');
            try {
                await fs.access(backupDir);
            }
            catch {
                return []; // No backup directory exists
            }
            const files = await fs.readdir(backupDir);
            const backupFiles = files.filter((file) => file.startsWith('backup-') && file.endsWith('.json'));
            const backups = await Promise.all(backupFiles.map(async (file) => {
                const filePath = path.join(backupDir, file);
                const stats = await fs.stat(filePath);
                // Parse sessionId and timestamp from filename
                const match = file.match(/backup-(.+?)-(.+)\.json$/);
                const sessionId = match?.[1] || 'unknown';
                const timestampStr = match?.[2]?.replace(/-/g, ':') || '';
                return {
                    path: filePath,
                    timestamp: new Date(timestampStr),
                    sessionId,
                    size: stats.size,
                };
            }));
            // Sort by timestamp (newest first)
            backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            return backups;
        }
        catch (error) {
            logger.error('Failed to list backups', {
                error: error instanceof Error ? error.message : String(error),
            });
            return [];
        }
    }
    /**
     * Export queue state to external format
     */
    async exportState(format = 'json') {
        try {
            const state = await this.loadQueueState();
            if (!state) {
                throw new Error('No state to export');
            }
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            let exportPath;
            let exportData;
            if (format === 'json') {
                exportPath = path.join(this.options.storageDir, `export-${timestamp}.json`);
                exportData = JSON.stringify(state, null, 2);
            }
            else if (format === 'csv') {
                exportPath = path.join(this.options.storageDir, `export-${timestamp}.csv`);
                exportData = this.convertToCSV(state.tasks);
            }
            else {
                throw new Error(`Unsupported export format: ${format}`);
            }
            await fs.writeFile(exportPath, exportData);
            logger.info('State exported successfully', {
                exportPath,
                format,
            });
            this.emit('stateExported', { path: exportPath, format });
            return exportPath;
        }
        catch (error) {
            logger.error('Failed to export state', {
                format,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    /**
     * Import queue state from external file
     */
    async importState(filePath, merge = false) {
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            const importedState = JSON.parse(data);
            // Validate imported data
            if (!importedState.version || !importedState.tasks) {
                throw new Error('Invalid import file format');
            }
            if (!merge) {
                // Replace current state
                const targetPath = path.join(this.options.storageDir, this.options.filename);
                await fs.writeFile(targetPath, data);
            }
            else {
                // Merge with existing state
                const currentState = await this.loadQueueState();
                if (currentState) {
                    const mergedState = this.mergeStates(currentState, importedState);
                    await this.saveQueueState(mergedState.tasks, mergedState.dependencies, mergedState.completedTasks, mergedState.failedTasks, mergedState.runningTasks, mergedState.metrics, mergedState.sessionId);
                }
                else {
                    // No current state, treat as replace
                    const targetPath = path.join(this.options.storageDir, this.options.filename);
                    await fs.writeFile(targetPath, data);
                }
            }
            logger.info('State imported successfully', {
                filePath,
                merge,
                taskCount: importedState.tasks.length,
            });
            this.emit('stateImported', {
                path: filePath,
                merge,
                state: importedState,
            });
        }
        catch (error) {
            logger.error('Failed to import state', {
                filePath,
                merge,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    /**
     * Clean up old storage files and backups
     */
    async cleanup(olderThanMs = 7 * 24 * 60 * 60 * 1000) {
        // Default 7 days
        try {
            const cutoff = Date.now() - olderThanMs;
            // Clean up old backups
            await this.cleanupOldBackups(cutoff);
            // Clean up old export files
            const files = await fs.readdir(this.options.storageDir);
            const exportFiles = files.filter((file) => file.startsWith('export-'));
            for (const file of exportFiles) {
                const filePath = path.join(this.options.storageDir, file);
                const stats = await fs.stat(filePath);
                if (stats.mtime.getTime() < cutoff) {
                    await fs.unlink(filePath);
                    logger.info(`Cleaned up old export file: ${file}`);
                }
            }
            this.emit('cleanupCompleted', { cutoff: new Date(cutoff) });
        }
        catch (error) {
            logger.error('Failed to cleanup storage', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    /**
     * Get storage statistics
     */
    async getStorageStats() {
        try {
            const stats = {
                totalFiles: 0,
                totalSize: 0,
                stateFile: { exists: false, size: 0 },
                backupCount: 0,
                backupTotalSize: 0,
                exportCount: 0,
                exportTotalSize: 0,
            };
            // Check state file
            const stateFilePath = path.join(this.options.storageDir, this.options.filename);
            try {
                const stateStats = await fs.stat(stateFilePath);
                stats.stateFile.exists = true;
                stats.stateFile.size = stateStats.size;
                stats.stateFile.lastModified = stateStats.mtime;
                stats.totalFiles++;
                stats.totalSize += stateStats.size;
            }
            catch {
                // State file doesn't exist
            }
            // Check backups
            const backupDir = path.join(this.options.storageDir, 'backups');
            try {
                const backupFiles = await fs.readdir(backupDir);
                for (const file of backupFiles) {
                    if (file.startsWith('backup-')) {
                        const filePath = path.join(backupDir, file);
                        const fileStats = await fs.stat(filePath);
                        stats.backupCount++;
                        stats.backupTotalSize += fileStats.size;
                        stats.totalFiles++;
                        stats.totalSize += fileStats.size;
                    }
                }
            }
            catch {
                // Backup directory doesn't exist
            }
            // Check exports
            try {
                const files = await fs.readdir(this.options.storageDir);
                for (const file of files) {
                    if (file.startsWith('export-')) {
                        const filePath = path.join(this.options.storageDir, file);
                        const fileStats = await fs.stat(filePath);
                        stats.exportCount++;
                        stats.exportTotalSize += fileStats.size;
                        stats.totalFiles++;
                        stats.totalSize += fileStats.size;
                    }
                }
            }
            catch {
                // Directory doesn't exist
            }
            return stats;
        }
        catch (error) {
            logger.error('Failed to get storage statistics', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    /**
     * Serialize a task for persistence
     */
    serializeTask(task) {
        const serialized = {
            ...task,
            serializedContext: JSON.stringify(task.context),
        };
        // Remove non-serializable functions and store function names
        delete serialized.executeFunction;
        delete serialized.validateFunction;
        delete serialized.rollbackFunction;
        delete serialized.progressCallback;
        // Try to find function names in registry
        for (const [name, fn] of this.functionRegistry.executeFunctions) {
            if (fn === task.executeFunction) {
                serialized.executeFunctionName = name;
                break;
            }
        }
        for (const [name, fn] of this.functionRegistry.validateFunctions) {
            if (fn === task.validateFunction) {
                serialized.validateFunctionName = name;
                break;
            }
        }
        for (const [name, fn] of this.functionRegistry.rollbackFunctions) {
            if (fn === task.rollbackFunction) {
                serialized.rollbackFunctionName = name;
                break;
            }
        }
        return serialized;
    }
    /**
     * Deserialize a task from persistence
     */
    async deserializeTask(serializedTask) {
        const task = {
            ...serializedTask,
            context: serializedTask.serializedContext
                ? JSON.parse(serializedTask.serializedContext)
                : {},
            executeFunction: async () => ({
                success: false,
                duration: 0,
                error: new Error('No execute function'),
            }),
            validateFunction: undefined,
            rollbackFunction: undefined,
            progressCallback: undefined,
        };
        // Reconstruct functions from registry
        if (serializedTask.executeFunctionName) {
            const executeFunction = this.functionRegistry.executeFunctions.get(serializedTask.executeFunctionName);
            if (executeFunction) {
                task.executeFunction = executeFunction;
            }
            else {
                logger.warn(`Execute function not found in registry: ${serializedTask.executeFunctionName}`, {
                    taskId: task.id,
                });
            }
        }
        if (serializedTask.validateFunctionName) {
            const validateFunction = this.functionRegistry.validateFunctions.get(serializedTask.validateFunctionName);
            if (validateFunction) {
                task.validateFunction = validateFunction;
            }
        }
        if (serializedTask.rollbackFunctionName) {
            const rollbackFunction = this.functionRegistry.rollbackFunctions.get(serializedTask.rollbackFunctionName);
            if (rollbackFunction) {
                task.rollbackFunction = rollbackFunction;
            }
        }
        return task;
    }
    /**
     * Check if state needs migration
     */
    needsMigration(state) {
        return state.version !== '1.0.0';
    }
    /**
     * Migrate state to current version
     */
    async migrateState(state) {
        logger.info(`Migrating state from version ${state.version} to 1.0.0`);
        // Add migration logic for different versions
        if (!state.version || state.version < '1.0.0') {
            // Migration from pre-1.0.0 versions
            // Add any necessary data transformations here
        }
        state.version = '1.0.0';
        this.emit('stateMigrated', state);
    }
    /**
     * Convert tasks to CSV format
     */
    convertToCSV(tasks) {
        const headers = [
            'id',
            'title',
            'description',
            'category',
            'priority',
            'status',
            'createdAt',
            'startedAt',
            'completedAt',
            'estimatedDuration',
            'actualDuration',
        ];
        const rows = [headers.join(',')];
        for (const task of tasks.values()) {
            const row = [
                task.id,
                `"${task.title.replace(/"/g, '""')}"`,
                `"${task.description.replace(/"/g, '""')}"`,
                task.category,
                task.priority.toString(),
                task.status,
                task.createdAt.toISOString(),
                task.startedAt?.toISOString() || '',
                task.completedAt?.toISOString() || '',
                task.estimatedDuration.toString(),
                task.actualDuration?.toString() || '',
            ];
            rows.push(row.join(','));
        }
        return rows.join('\n');
    }
    /**
     * Merge two queue states
     */
    mergeStates(current, imported) {
        // Simple merge strategy - imported tasks take precedence
        const mergedTasks = new Map(current.tasks);
        // Add/update imported tasks
        for (const [id, task] of imported.tasks || []) {
            mergedTasks.set(id, task);
        }
        const mergedDependencies = new Map(current.dependencies);
        for (const [id, dep] of imported.dependencies || []) {
            mergedDependencies.set(id, dep);
        }
        const mergedCompleted = new Map(current.completedTasks);
        for (const [id, record] of imported.completedTasks || []) {
            mergedCompleted.set(id, record);
        }
        const mergedFailed = new Map(current.failedTasks);
        for (const [id, record] of imported.failedTasks || []) {
            mergedFailed.set(id, record);
        }
        const mergedRunning = new Set([
            ...current.runningTasks,
            ...(imported.runningTasks || []),
        ]);
        return {
            tasks: mergedTasks,
            dependencies: mergedDependencies,
            completedTasks: mergedCompleted,
            failedTasks: mergedFailed,
            runningTasks: mergedRunning,
            metrics: imported.metrics,
            sessionId: imported.sessionId,
        };
    }
    /**
     * Clean up old backup files
     */
    async cleanupOldBackups(cutoff) {
        const maxBackups = this.options.backupConfig.maxBackups;
        const backupDir = path.join(this.options.storageDir, 'backups');
        try {
            const files = await fs.readdir(backupDir);
            const backupFiles = files
                .filter((file) => file.startsWith('backup-'))
                .map((file) => ({
                name: file,
                path: path.join(backupDir, file),
                stat: fs.stat(path.join(backupDir, file)),
            }));
            const fileStats = await Promise.all(backupFiles.map(async (file) => ({
                ...file,
                stat: await file.stat,
            })));
            // Sort by modification time (newest first)
            fileStats.sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime());
            // Remove files beyond maxBackups limit
            if (maxBackups > 0 && fileStats.length > maxBackups) {
                const filesToRemove = fileStats.slice(maxBackups);
                for (const file of filesToRemove) {
                    await fs.unlink(file.path);
                    logger.info(`Removed old backup: ${file.name}`);
                }
            }
            // Remove files older than cutoff if specified
            if (cutoff) {
                const oldFiles = fileStats.filter((file) => file.stat.mtime.getTime() < cutoff);
                for (const file of oldFiles) {
                    await fs.unlink(file.path);
                    logger.info(`Removed old backup: ${file.name}`);
                }
            }
        }
        catch (error) {
            // Backup directory might not exist, which is fine
            if (error.code !== 'ENOENT') {
                logger.warn('Failed to cleanup old backups', {
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
    }
    /**
     * Start auto-save timer
     */
    startAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        this.autoSaveTimer = setInterval(() => {
            this.emit('autoSaveRequested');
        }, this.options.autoSaveInterval);
        logger.debug('Auto-save timer started', {
            interval: this.options.autoSaveInterval,
        });
    }
    /**
     * Start backup timer
     */
    startBackupTimer() {
        if (this.backupTimer) {
            clearInterval(this.backupTimer);
        }
        this.backupTimer = setInterval(() => {
            this.createBackup().catch((error) => {
                logger.error('Automatic backup failed', {
                    error: error instanceof Error ? error.message : String(error),
                });
            });
        }, this.options.backupConfig.interval);
        logger.debug('Backup timer started', {
            interval: this.options.backupConfig.interval,
        });
    }
    /**
     * Stop all timers
     */
    stop() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = undefined;
        }
        if (this.backupTimer) {
            clearInterval(this.backupTimer);
            this.backupTimer = undefined;
        }
        logger.info('Task persistence stopped');
        this.emit('stopped');
    }
    /**
     * Shutdown persistence system
     */
    async shutdown() {
        this.stop();
        // Emit final auto-save request
        if (this.isInitialized) {
            this.emit('autoSaveRequested');
        }
        this.isInitialized = false;
        this.emit('shutdown');
        logger.info('Task persistence shutdown completed');
    }
}
//# sourceMappingURL=TaskPersistence.js.map