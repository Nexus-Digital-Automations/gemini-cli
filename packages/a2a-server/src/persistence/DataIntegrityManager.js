/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fse from 'fs-extra';
import * as crypto from 'node:crypto';
import { promises as fsPromises } from 'node:fs';
import { join, dirname } from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { gzipSync, gunzipSync } from 'node:zlib';
import { homedir } from 'node:os';
import { logger } from '../utils/logger.js';
/**
 * Advanced data integrity and backup management system
 *
 * Provides:
 * - Comprehensive data integrity verification
 * - Automated backup creation and management
 * - Intelligent recovery protocols
 * - Corruption detection and repair
 * - Version control for critical data
 * - Performance-optimized integrity checks
 */
export class DataIntegrityManager {
    config;
    backupRegistry;
    recoveryHistory;
    integrityCheckInterval;
    constructor(config = {}) {
        this.config = {
            enablePeriodicChecks: config.enablePeriodicChecks ?? true,
            checkInterval: config.checkInterval ?? 60 * 60 * 1000, // 1 hour
            enableAutoBackup: config.enableAutoBackup ?? true,
            retentionPolicy: {
                maxVersions: config.retentionPolicy?.maxVersions ?? 10,
                maxAge: config.retentionPolicy?.maxAge ?? 7 * 24 * 60 * 60 * 1000, // 7 days
                compressionEnabled: config.retentionPolicy?.compressionEnabled ?? true,
            },
            enableAutoRecovery: config.enableAutoRecovery ?? true,
            checksumAlgorithm: config.checksumAlgorithm ?? 'sha256',
            paths: {
                backups: config.paths?.backups ||
                    join(homedir(), '.gemini-cli', 'persistence', 'backups'),
                integrity: config.paths?.integrity ||
                    join(homedir(), '.gemini-cli', 'persistence', 'integrity'),
                recovery: config.paths?.recovery ||
                    join(homedir(), '.gemini-cli', 'persistence', 'recovery'),
            },
        };
        this.backupRegistry = new Map();
        this.recoveryHistory = new Map();
        this.initialize();
    }
    /**
     * Initialize data integrity manager
     */
    async initialize() {
        try {
            // Create directory structure
            await fse.ensureDir(this.config.paths.backups);
            await fse.ensureDir(this.config.paths.integrity);
            await fse.ensureDir(this.config.paths.recovery);
            await fse.ensureDir(join(this.config.paths.backups, 'metadata'));
            // Load existing backup registry
            await this.loadBackupRegistry();
            // Load recovery history
            await this.loadRecoveryHistory();
            // Start periodic integrity checks
            if (this.config.enablePeriodicChecks) {
                this.startPeriodicIntegrityChecks();
            }
            // Perform initial cleanup
            await this.cleanupOldBackups();
            logger.info('DataIntegrityManager initialized successfully');
        }
        catch (error) {
            logger.error('Failed to initialize DataIntegrityManager:', error);
            throw error;
        }
    }
    /**
     * Verify integrity of a file
     */
    async verifyFileIntegrity(filePath, expectedChecksum) {
        logger.debug(`Verifying integrity of ${filePath}`);
        const result = {
            isValid: false,
            filePath,
            checkedAt: new Date().toISOString(),
            errors: [],
            warnings: [],
            recommendations: [],
        };
        try {
            // Check if file exists
            if (!(await fse.pathExists(filePath))) {
                result.errors.push('File does not exist');
                result.recommendations.push('Restore from backup if available');
                return result;
            }
            // Calculate checksum
            const actualChecksum = await this.calculateChecksum(filePath);
            result.actualChecksum = actualChecksum;
            if (expectedChecksum) {
                result.expectedChecksum = expectedChecksum;
                result.isValid = actualChecksum === expectedChecksum;
                if (!result.isValid) {
                    result.errors.push(`Checksum mismatch: expected ${expectedChecksum}, got ${actualChecksum}`);
                    result.recommendations.push('File may be corrupted, consider restoring from backup');
                }
            }
            else {
                // If no expected checksum provided, perform basic file validation
                const stats = await fsPromises.stat(filePath);
                // Check if file is empty when it shouldn't be
                if (stats.size === 0) {
                    result.warnings.push('File is empty');
                    result.recommendations.push('Check if file should contain data');
                }
                // For JSON files, try to parse
                if (filePath.endsWith('.json')) {
                    try {
                        await fse.readJSON(filePath);
                        result.isValid = true;
                    }
                    catch (parseError) {
                        result.errors.push(`Invalid JSON format: ${parseError}`);
                        result.recommendations.push('Restore from backup or repair JSON structure');
                    }
                }
                else {
                    // Basic file readability check
                    try {
                        await fsPromises.access(filePath, fsPromises.constants.R_OK);
                        result.isValid = true;
                    }
                    catch (accessError) {
                        result.errors.push(`File not readable: ${accessError}`);
                        result.recommendations.push('Check file permissions or restore from backup');
                    }
                }
            }
            // Save integrity check result
            await this.saveIntegrityCheckResult(result);
        }
        catch (error) {
            result.errors.push(`Integrity check failed: ${error}`);
            result.recommendations.push('Investigate file system issues');
        }
        logger.debug(`Integrity check for ${filePath}: ${result.isValid ? 'PASS' : 'FAIL'}`);
        return result;
    }
    /**
     * Create backup of a file or directory
     */
    async createBackup(originalPath, options = {}) {
        logger.info(`Creating backup of ${originalPath}`);
        const backupId = uuidv4();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = originalPath.split('/').pop() || 'unknown';
        const backupFileName = `${fileName}-${timestamp}-${backupId.substring(0, 8)}`;
        const backupPath = join(this.config.paths.backups, backupFileName);
        try {
            // Ensure source exists
            if (!(await fse.pathExists(originalPath))) {
                throw new Error(`Source path does not exist: ${originalPath}`);
            }
            // Create backup
            let finalBackupPath = backupPath;
            const shouldCompress = options.compress ?? this.config.retentionPolicy.compressionEnabled;
            if (shouldCompress) {
                finalBackupPath = `${backupPath}.gz`;
                await this.createCompressedBackup(originalPath, finalBackupPath);
            }
            else {
                await fse.copy(originalPath, finalBackupPath);
            }
            // Get file size and checksum
            const stats = await fsPromises.stat(finalBackupPath);
            const checksum = await this.calculateChecksum(finalBackupPath);
            // Create backup metadata
            const metadata = {
                backupId,
                originalPath,
                backupPath: finalBackupPath,
                createdAt: new Date().toISOString(),
                type: options.type || 'auto',
                fileSize: stats.size,
                checksum,
                compressed: shouldCompress,
                retentionPolicy: {
                    maxAge: this.config.retentionPolicy.maxAge,
                    maxVersions: this.config.retentionPolicy.maxVersions,
                    priority: options.priority || 'medium',
                },
                metadata: {
                    version: '1.0.0',
                    ...(options.metadata || {}),
                },
            };
            // Register backup
            this.backupRegistry.set(backupId, metadata);
            await this.saveBackupMetadata(metadata);
            logger.info(`Backup created successfully: ${backupId}`);
            return metadata;
        }
        catch (error) {
            logger.error(`Failed to create backup of ${originalPath}:`, error);
            throw error;
        }
    }
    /**
     * Restore file from backup
     */
    async restoreFromBackup(backupId, targetPath, options = {}) {
        const backup = this.backupRegistry.get(backupId);
        if (!backup) {
            throw new Error(`Backup not found: ${backupId}`);
        }
        logger.info(`Restoring from backup ${backupId}`);
        const recoveryId = uuidv4();
        const restoreTarget = targetPath || backup.originalPath;
        const recovery = {
            recoveryId,
            type: 'restore_from_backup',
            affectedFiles: [restoreTarget],
            backupUsed: backup,
            status: 'initiated',
            timestamps: {
                initiated: new Date().toISOString(),
            },
            metadata: {
                reason: `Restore from backup ${backupId}`,
                triggeredBy: 'manual',
                priority: 'medium',
            },
        };
        try {
            recovery.status = 'in_progress';
            // Create recovery point if requested
            if (options.createRecoveryPoint &&
                (await fse.pathExists(restoreTarget))) {
                await this.createBackup(restoreTarget, {
                    type: 'recovery',
                    metadata: { recoveryId, originalBackupId: backupId },
                    priority: 'high',
                });
            }
            // Verify backup integrity first
            if (options.verifyIntegrity !== false) {
                const integrityResult = await this.verifyFileIntegrity(backup.backupPath, backup.checksum);
                if (!integrityResult.isValid) {
                    throw new Error(`Backup integrity check failed: ${integrityResult.errors.join(', ')}`);
                }
            }
            // Ensure target directory exists
            await fse.ensureDir(dirname(restoreTarget));
            // Restore file
            if (backup.compressed) {
                await this.restoreCompressedBackup(backup.backupPath, restoreTarget);
            }
            else {
                await fse.copy(backup.backupPath, restoreTarget, { overwrite: true });
            }
            // Verify restoration
            if (options.verifyIntegrity !== false) {
                const originalChecksum = await this.calculateOriginalChecksum(backup);
                const restoredChecksum = await this.calculateChecksum(restoreTarget);
                if (originalChecksum !== restoredChecksum) {
                    throw new Error('Restored file checksum does not match original');
                }
            }
            recovery.status = 'completed';
            recovery.timestamps.completed = new Date().toISOString();
            recovery.outcome = {
                success: true,
                message: 'File successfully restored from backup',
                restoredFiles: [restoreTarget],
                failedFiles: [],
            };
            logger.info(`Successfully restored ${restoreTarget} from backup ${backupId}`);
        }
        catch (error) {
            recovery.status = 'failed';
            recovery.timestamps.completed = new Date().toISOString();
            recovery.outcome = {
                success: false,
                message: `Restoration failed: ${error}`,
                restoredFiles: [],
                failedFiles: [restoreTarget],
            };
            logger.error(`Failed to restore from backup ${backupId}:`, error);
            throw error;
        }
        finally {
            // Save recovery operation
            this.recoveryHistory.set(recoveryId, recovery);
            await this.saveRecoveryOperation(recovery);
        }
        return recovery;
    }
    /**
     * Perform automatic recovery for corrupted files
     */
    async performAutoRecovery(filePath) {
        if (!this.config.enableAutoRecovery) {
            logger.debug('Auto recovery is disabled');
            return null;
        }
        logger.info(`Attempting auto recovery for ${filePath}`);
        // Find the most recent backup
        const backups = this.getFileBackups(filePath).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (backups.length === 0) {
            logger.warn(`No backups available for auto recovery of ${filePath}`);
            return null;
        }
        const mostRecentBackup = backups[0];
        try {
            const recovery = await this.restoreFromBackup(mostRecentBackup.backupId, filePath, {
                verifyIntegrity: true,
                createRecoveryPoint: true,
            });
            recovery.metadata.triggeredBy = 'auto';
            recovery.metadata.reason =
                'Automatic recovery due to corruption detection';
            logger.info(`Auto recovery successful for ${filePath}`);
            return recovery;
        }
        catch (error) {
            logger.error(`Auto recovery failed for ${filePath}:`, error);
            return null;
        }
    }
    /**
     * Get all backups for a specific file
     */
    getFileBackups(filePath) {
        return Array.from(this.backupRegistry.values())
            .filter((backup) => backup.originalPath === filePath)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    /**
     * Get backup by ID
     */
    getBackup(backupId) {
        return this.backupRegistry.get(backupId);
    }
    /**
     * List all backups with filtering options
     */
    listBackups(options = {}) {
        let backups = Array.from(this.backupRegistry.values());
        // Apply filters
        if (options.type) {
            backups = backups.filter((backup) => backup.type === options.type);
        }
        if (options.priority) {
            backups = backups.filter((backup) => backup.retentionPolicy.priority === options.priority);
        }
        if (options.olderThan) {
            backups = backups.filter((backup) => new Date(backup.createdAt) < options.olderThan);
        }
        if (options.newerThan) {
            backups = backups.filter((backup) => new Date(backup.createdAt) > options.newerThan);
        }
        // Sort by creation date (newest first)
        backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        // Apply limit
        if (options.limit) {
            backups = backups.slice(0, options.limit);
        }
        return backups;
    }
    /**
     * Get recovery operation history
     */
    getRecoveryHistory(options = {}) {
        let operations = Array.from(this.recoveryHistory.values());
        // Apply filters
        if (options.type) {
            operations = operations.filter((op) => op.type === options.type);
        }
        if (options.status) {
            operations = operations.filter((op) => op.status === options.status);
        }
        // Sort by initiation date (newest first)
        operations.sort((a, b) => new Date(b.timestamps.initiated).getTime() -
            new Date(a.timestamps.initiated).getTime());
        // Apply limit
        if (options.limit) {
            operations = operations.slice(0, options.limit);
        }
        return operations;
    }
    /**
     * Clean up old backups according to retention policy
     */
    async cleanupOldBackups() {
        logger.info('Starting backup cleanup process');
        const result = {
            deletedCount: 0,
            freedSpace: 0,
            errors: [],
        };
        const now = Date.now();
        const backupsToDelete = [];
        // Group backups by original file path
        const backupGroups = new Map();
        for (const backup of this.backupRegistry.values()) {
            const group = backupGroups.get(backup.originalPath) || [];
            group.push(backup);
            backupGroups.set(backup.originalPath, group);
        }
        // Apply retention policies
        for (const [, backups] of backupGroups) {
            // Sort by creation date (newest first)
            backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            for (let i = 0; i < backups.length; i++) {
                const backup = backups[i];
                const age = now - new Date(backup.createdAt).getTime();
                // Apply age policy
                if (backup.retentionPolicy.maxAge &&
                    age > backup.retentionPolicy.maxAge) {
                    backupsToDelete.push(backup);
                    continue;
                }
                // Apply max versions policy (keep only the newest N versions)
                if (backup.retentionPolicy.maxVersions &&
                    i >= backup.retentionPolicy.maxVersions) {
                    // Don't delete critical priority backups
                    if (backup.retentionPolicy.priority !== 'critical') {
                        backupsToDelete.push(backup);
                    }
                }
            }
        }
        // Delete selected backups
        for (const backup of backupsToDelete) {
            try {
                const stats = await fsPromises.stat(backup.backupPath);
                await fse.remove(backup.backupPath);
                await this.removeBackupMetadata(backup.backupId);
                this.backupRegistry.delete(backup.backupId);
                result.deletedCount++;
                result.freedSpace += stats.size;
                logger.debug(`Deleted backup ${backup.backupId}`);
            }
            catch (error) {
                result.errors.push(`Failed to delete backup ${backup.backupId}: ${String(error)}`);
            }
        }
        if (result.deletedCount > 0) {
            logger.info(`Cleanup completed: deleted ${result.deletedCount} backups, freed ${Math.round(result.freedSpace / 1024 / 1024)}MB`);
        }
        return result;
    }
    /**
     * Calculate checksum for a file
     */
    async calculateChecksum(filePath) {
        const hash = crypto.createHash(this.config.checksumAlgorithm);
        const data = await fsPromises.readFile(filePath);
        hash.update(data);
        return hash.digest('hex');
    }
    /**
     * Calculate original checksum from backup metadata
     */
    async calculateOriginalChecksum(backup) {
        if (!backup.compressed) {
            return backup.checksum;
        }
        // For compressed backups, we need to decompress and calculate original checksum
        const compressedData = await fsPromises.readFile(backup.backupPath);
        const originalData = gunzipSync(compressedData);
        const hash = crypto.createHash(this.config.checksumAlgorithm);
        hash.update(originalData);
        return hash.digest('hex');
    }
    /**
     * Create compressed backup
     */
    async createCompressedBackup(sourcePath, targetPath) {
        const sourceData = await fsPromises.readFile(sourcePath);
        const compressedData = gzipSync(sourceData);
        await fsPromises.writeFile(targetPath, compressedData);
    }
    /**
     * Restore from compressed backup
     */
    async restoreCompressedBackup(backupPath, targetPath) {
        const compressedData = await fsPromises.readFile(backupPath);
        const originalData = gunzipSync(compressedData);
        await fsPromises.writeFile(targetPath, originalData);
    }
    /**
     * Save integrity check result
     */
    async saveIntegrityCheckResult(result) {
        const filename = `integrity-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.json`;
        const filePath = join(this.config.paths.integrity, filename);
        await fse.writeJSON(filePath, result, { spaces: 2 });
    }
    /**
     * Save backup metadata
     */
    async saveBackupMetadata(metadata) {
        const metadataPath = join(this.config.paths.backups, 'metadata', `${metadata.backupId}.json`);
        await fse.writeJSON(metadataPath, metadata, { spaces: 2 });
    }
    /**
     * Remove backup metadata
     */
    async removeBackupMetadata(backupId) {
        const metadataPath = join(this.config.paths.backups, 'metadata', `${backupId}.json`);
        if (await fse.pathExists(metadataPath)) {
            await fse.remove(metadataPath);
        }
    }
    /**
     * Save recovery operation
     */
    async saveRecoveryOperation(operation) {
        const operationPath = join(this.config.paths.recovery, `${operation.recoveryId}.json`);
        await fse.writeJSON(operationPath, operation, { spaces: 2 });
    }
    /**
     * Load backup registry from disk
     */
    async loadBackupRegistry() {
        const metadataDir = join(this.config.paths.backups, 'metadata');
        if (!(await fse.pathExists(metadataDir))) {
            return;
        }
        const files = await fsPromises.readdir(metadataDir);
        for (const file of files.filter((f) => f.endsWith('.json'))) {
            try {
                const metadata = await fse.readJSON(join(metadataDir, file));
                this.backupRegistry.set(metadata.backupId, metadata);
            }
            catch (error) {
                logger.warn(`Failed to load backup metadata from ${file}:`, error);
            }
        }
        logger.debug(`Loaded ${this.backupRegistry.size} backup records`);
    }
    /**
     * Load recovery history from disk
     */
    async loadRecoveryHistory() {
        const recoveryDir = this.config.paths.recovery;
        if (!(await fse.pathExists(recoveryDir))) {
            return;
        }
        const files = await fsPromises.readdir(recoveryDir);
        for (const file of files.filter((f) => f.endsWith('.json'))) {
            try {
                const operation = await fse.readJSON(join(recoveryDir, file));
                this.recoveryHistory.set(operation.recoveryId, operation);
            }
            catch (error) {
                logger.warn(`Failed to load recovery operation from ${file}:`, error);
            }
        }
        logger.debug(`Loaded ${this.recoveryHistory.size} recovery operations`);
    }
    /**
     * Start periodic integrity checks
     */
    startPeriodicIntegrityChecks() {
        this.integrityCheckInterval = setInterval(async () => {
            try {
                await this.performPeriodicIntegrityCheck();
            }
            catch (error) {
                logger.warn('Periodic integrity check failed:', error);
            }
        }, this.config.checkInterval);
        logger.debug('Started periodic integrity checks');
    }
    /**
     * Perform periodic integrity check on all registered files
     */
    async performPeriodicIntegrityCheck() {
        logger.debug('Performing periodic integrity check');
        const uniqueFiles = new Set(Array.from(this.backupRegistry.values()).map((backup) => backup.originalPath));
        let checkedCount = 0;
        let failedCount = 0;
        for (const filePath of uniqueFiles) {
            try {
                if (await fse.pathExists(filePath)) {
                    const result = await this.verifyFileIntegrity(filePath);
                    checkedCount++;
                    if (!result.isValid) {
                        failedCount++;
                        logger.warn(`Integrity check failed for ${filePath}: ${result.errors.join(', ')}`);
                        // Attempt auto recovery if enabled
                        if (this.config.enableAutoRecovery) {
                            await this.performAutoRecovery(filePath);
                        }
                    }
                }
            }
            catch (error) {
                logger.warn(`Failed to check integrity of ${filePath}:`, error);
            }
        }
        if (checkedCount > 0) {
            logger.debug(`Periodic integrity check completed: ${checkedCount} files checked, ${failedCount} failed`);
        }
        // Perform backup cleanup
        await this.cleanupOldBackups();
    }
    /**
     * Get integrity manager statistics
     */
    async getStatistics() {
        const backups = Array.from(this.backupRegistry.values());
        const recoveries = Array.from(this.recoveryHistory.values());
        // Calculate statistics
        const stats = {
            totalBackups: backups.length,
            totalBackupSize: backups.reduce((total, backup) => total + backup.fileSize, 0),
            backupsByType: backups.reduce((counts, backup) => {
                counts[backup.type] = (counts[backup.type] || 0) + 1;
                return counts;
            }, {}),
            recentRecoveries: recoveries.filter((recovery) => new Date(recovery.timestamps.initiated).getTime() >
                Date.now() - 24 * 60 * 60 * 1000).length,
            failedIntegrityChecks: 0, // Would need to scan integrity check files
            storageUtilization: {
                backups: await this.calculateDirectorySize(this.config.paths.backups),
                integrity: await this.calculateDirectorySize(this.config.paths.integrity),
                recovery: await this.calculateDirectorySize(this.config.paths.recovery),
            },
        };
        return stats;
    }
    /**
     * Calculate directory size in bytes
     */
    async calculateDirectorySize(dirPath) {
        if (!(await fse.pathExists(dirPath))) {
            return 0;
        }
        let size = 0;
        const files = await fsPromises.readdir(dirPath, { withFileTypes: true });
        for (const file of files) {
            const filePath = join(dirPath, file.name);
            if (file.isDirectory()) {
                size += await this.calculateDirectorySize(filePath);
            }
            else {
                const stats = await fsPromises.stat(filePath);
                size += stats.size;
            }
        }
        return size;
    }
    /**
     * Shutdown data integrity manager
     */
    async shutdown() {
        if (this.integrityCheckInterval) {
            clearInterval(this.integrityCheckInterval);
        }
        logger.info('DataIntegrityManager shut down gracefully');
    }
}
//# sourceMappingURL=DataIntegrityManager.js.map