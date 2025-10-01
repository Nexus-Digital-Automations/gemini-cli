/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { BudgetSettings, BudgetUsageData } from '../types.js';
import type { StorageOperationResult, StorageHealthCheck, StorageMetrics, ObservableStorage, StorageEvent, StorageEventListener } from './BudgetStorageInterface.js';
import { StorageEventType } from './BudgetStorageInterface.js';
/**
 * File storage configuration
 */
interface FileStorageConfig {
    /** Base directory for storage */
    baseDir: string;
    /** Settings file name */
    settingsFile?: string;
    /** Usage data file name */
    usageFile?: string;
    /** Backup directory */
    backupDir?: string;
    /** Enable atomic writes */
    atomicWrites?: boolean;
    /** File permissions (octal) */
    fileMode?: number;
    /** Directory permissions (octal) */
    dirMode?: number;
    /** Backup retention days */
    backupRetentionDays?: number;
}
/**
 * File-based storage implementation with event support
 */
export declare class FileStorage implements ObservableStorage {
    private readonly logger;
    private readonly config;
    private readonly eventListeners;
    private readonly metrics;
    private initialized;
    private readonly startTime;
    /**
     * Create new file storage instance
     * @param projectRoot - Project root directory
     * @param config - Storage configuration
     */
    constructor(projectRoot: string, config?: Partial<FileStorageConfig>);
    /**
     * Initialize storage system
     */
    initialize(): Promise<StorageOperationResult>;
    /**
     * Check storage health
     */
    healthCheck(): Promise<StorageHealthCheck>;
    /**
     * Read usage data from file
     */
    readUsageData(): Promise<StorageOperationResult<BudgetUsageData>>;
    /**
     * Write usage data to file with atomic operation
     */
    writeUsageData(data: BudgetUsageData): Promise<StorageOperationResult>;
    /**
     * Read settings from file
     */
    readSettings(): Promise<StorageOperationResult<BudgetSettings>>;
    /**
     * Write settings to file
     */
    writeSettings(settings: BudgetSettings): Promise<StorageOperationResult>;
    /**
     * Clear all budget data
     */
    clearAllData(confirmationToken: string): Promise<StorageOperationResult>;
    /**
     * Create backup of current data
     */
    createBackup(): Promise<StorageOperationResult<string>>;
    /**
     * Restore data from backup
     */
    restoreFromBackup(backupId: string): Promise<StorageOperationResult>;
    /**
     * Get storage metrics
     */
    getMetrics(): Promise<StorageOperationResult<StorageMetrics>>;
    /**
     * Close storage connections
     */
    close(): Promise<StorageOperationResult>;
    /**
     * Subscribe to storage events
     */
    on(eventType: StorageEventType | 'all', listener: StorageEventListener): void;
    /**
     * Unsubscribe from storage events
     */
    off(eventType: StorageEventType | 'all', listener: StorageEventListener): void;
    /**
     * Emit storage event to listeners
     */
    emit(event: StorageEvent): void;
    /**
     * Get settings file path
     */
    private getSettingsPath;
    /**
     * Get usage data file path
     */
    private getUsagePath;
    /**
     * Check if file exists
     */
    private fileExists;
    /**
     * Check if directory is writable
     */
    private isWritable;
    /**
     * Perform atomic write operation
     */
    private atomicWrite;
    /**
     * Create default usage data
     */
    private createDefaultUsageData;
    /**
     * Validate and migrate usage data
     */
    private validateUsageData;
    /**
     * Calculate total storage space used
     */
    private calculateSpaceUsed;
    /**
     * Update read latency metrics
     */
    private updateReadLatency;
    /**
     * Update write latency metrics
     */
    private updateWriteLatency;
    /**
     * Increment error rate
     */
    private incrementErrorRate;
    /**
     * Cleanup old backups based on retention policy
     */
    private cleanupOldBackups;
}
/**
 * Factory function to create file storage instance
 * @param projectRoot - Project root directory
 * @param config - Storage configuration
 * @returns File storage instance
 */
export declare function createFileStorage(projectRoot: string, config?: Partial<FileStorageConfig>): FileStorage;
export {};
