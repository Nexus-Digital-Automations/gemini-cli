/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview File-based storage implementation for budget data
 * Provides robust file-based persistence with atomic operations and backup support
 *
 * @author Claude Code - Budget Core Infrastructure Agent
 * @version 1.0.0
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Logger } from '../../../../../src/utils/logger.js';
import type { BudgetSettings, BudgetUsageData } from '../types.js';
import type {
  BudgetStorage,
  StorageOperationResult,
  StorageHealthCheck,
  StorageMetrics,
  StorageConfig,
  ObservableStorage,
  StorageEvent,
  StorageEventType,
  StorageEventListener
} from './BudgetStorageInterface.js';

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
 * Default file storage configuration
 */
const DEFAULT_CONFIG: Required<FileStorageConfig> = {
  baseDir: '.gemini',
  settingsFile: 'budget-settings.json',
  usageFile: 'budget-usage.json',
  backupDir: 'backups',
  atomicWrites: true,
  fileMode: 0o644,
  dirMode: 0o755,
  backupRetentionDays: 30
};

/**
 * File-based storage implementation with event support
 */
export class FileStorage implements ObservableStorage {
  private readonly logger: Logger;
  private readonly config: Required<FileStorageConfig>;
  private readonly eventListeners = new Map<string, StorageEventListener[]>();
  private readonly metrics: StorageMetrics;
  private initialized = false;
  private readonly startTime = Date.now();

  /**
   * Create new file storage instance
   * @param projectRoot - Project root directory
   * @param config - Storage configuration
   */
  constructor(projectRoot: string, config: Partial<FileStorageConfig> = {}) {
    this.logger = new Logger('BudgetFileStorage');
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      baseDir: path.resolve(projectRoot, config.baseDir || DEFAULT_CONFIG.baseDir)
    };

    this.metrics = {
      spaceUsed: 0,
      readOperations: 0,
      writeOperations: 0,
      averageReadLatency: 0,
      averageWriteLatency: 0,
      errorRate: 0,
      uptime: 0
    };

    this.logger.info('File storage initialized', {
      baseDir: this.config.baseDir,
      atomicWrites: this.config.atomicWrites
    });
  }

  /**
   * Initialize storage system
   */
  public async initialize(): Promise<StorageOperationResult> {
    const start = Date.now();

    try {
      // Ensure base directory exists
      await fs.mkdir(this.config.baseDir, {
        recursive: true,
        mode: this.config.dirMode
      });

      // Ensure backup directory exists
      const backupPath = path.join(this.config.baseDir, this.config.backupDir);
      await fs.mkdir(backupPath, {
        recursive: true,
        mode: this.config.dirMode
      });

      // Verify write permissions
      const testFile = path.join(this.config.baseDir, '.write-test');
      await fs.writeFile(testFile, 'test', { mode: this.config.fileMode });
      await fs.unlink(testFile);

      this.initialized = true;

      this.emit({
        type: StorageEventType.INITIALIZED,
        timestamp: new Date(),
        storageId: 'file-storage',
        duration: Date.now() - start,
        success: true,
        metadata: { baseDir: this.config.baseDir }
      });

      this.logger.info('File storage initialized successfully', {
        baseDir: this.config.baseDir,
        duration: Date.now() - start
      });

      return { success: true };
    } catch (error) {
      this.emit({
        type: StorageEventType.INIT_FAILED,
        timestamp: new Date(),
        storageId: 'file-storage',
        duration: Date.now() - start,
        success: false,
        error: error as Error
      });

      this.logger.error('Failed to initialize file storage', error as Error);

      return {
        success: false,
        error: `Storage initialization failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Check storage health
   */
  public async healthCheck(): Promise<StorageHealthCheck> {
    const start = Date.now();
    let healthy = true;
    const details: Record<string, any> = {};

    try {
      // Check base directory accessibility
      const stats = await fs.stat(this.config.baseDir);
      details.baseDirectoryExists = stats.isDirectory();
      details.baseDirectoryWritable = await this.isWritable(this.config.baseDir);

      // Check backup directory
      const backupPath = path.join(this.config.baseDir, this.config.backupDir);
      const backupStats = await fs.stat(backupPath);
      details.backupDirectoryExists = backupStats.isDirectory();

      // Check file permissions
      details.settingsFileExists = await this.fileExists(this.getSettingsPath());
      details.usageFileExists = await this.fileExists(this.getUsagePath());

      // Update metrics
      this.metrics.uptime = Date.now() - this.startTime;

      healthy = details.baseDirectoryExists && details.baseDirectoryWritable;

    } catch (error) {
      healthy = false;
      details.error = (error as Error).message;
    }

    this.emit({
      type: StorageEventType.HEALTH_CHECK,
      timestamp: new Date(),
      storageId: 'file-storage',
      duration: Date.now() - start,
      success: healthy
    });

    return {
      healthy,
      storageType: 'file',
      details,
      metrics: { ...this.metrics }
    };
  }

  /**
   * Read usage data from file
   */
  public async readUsageData(): Promise<StorageOperationResult<BudgetUsageData>> {
    const start = Date.now();
    this.metrics.readOperations++;

    try {
      const filePath = this.getUsagePath();
      const exists = await this.fileExists(filePath);

      if (!exists) {
        // Return default usage data if file doesn't exist
        const defaultData = this.createDefaultUsageData();

        this.emit({
          type: StorageEventType.DATA_READ,
          timestamp: new Date(),
          storageId: 'file-storage',
          duration: Date.now() - start,
          dataSize: JSON.stringify(defaultData).length,
          success: true,
          metadata: { isDefault: true }
        });

        return {
          success: true,
          data: defaultData,
          metadata: { isDefault: true }
        };
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content) as BudgetUsageData;

      // Validate and migrate data if necessary
      const validatedData = this.validateUsageData(data);

      const duration = Date.now() - start;
      this.updateReadLatency(duration);

      this.emit({
        type: StorageEventType.DATA_READ,
        timestamp: new Date(),
        storageId: 'file-storage',
        duration,
        dataSize: content.length,
        success: true
      });

      this.logger.debug('Successfully read usage data', {
        fileSize: content.length,
        duration
      });

      return {
        success: true,
        data: validatedData
      };

    } catch (error) {
      const duration = Date.now() - start;
      this.updateReadLatency(duration);
      this.incrementErrorRate();

      this.emit({
        type: StorageEventType.ERROR,
        timestamp: new Date(),
        storageId: 'file-storage',
        duration,
        success: false,
        error: error as Error
      });

      this.logger.error('Failed to read usage data', error as Error);

      return {
        success: false,
        error: `Failed to read usage data: ${(error as Error).message}`
      };
    }
  }

  /**
   * Write usage data to file with atomic operation
   */
  public async writeUsageData(data: BudgetUsageData): Promise<StorageOperationResult> {
    const start = Date.now();
    this.metrics.writeOperations++;

    try {
      // Validate data before writing
      this.validateUsageData(data);

      const filePath = this.getUsagePath();
      const content = JSON.stringify(data, null, 2);

      if (this.config.atomicWrites) {
        await this.atomicWrite(filePath, content);
      } else {
        await fs.writeFile(filePath, content, { mode: this.config.fileMode });
      }

      const duration = Date.now() - start;
      this.updateWriteLatency(duration);
      this.metrics.spaceUsed = await this.calculateSpaceUsed();

      this.emit({
        type: StorageEventType.DATA_WRITE,
        timestamp: new Date(),
        storageId: 'file-storage',
        duration,
        dataSize: content.length,
        success: true
      });

      this.logger.debug('Successfully wrote usage data', {
        dataSize: content.length,
        duration
      });

      return { success: true };

    } catch (error) {
      const duration = Date.now() - start;
      this.updateWriteLatency(duration);
      this.incrementErrorRate();

      this.emit({
        type: StorageEventType.ERROR,
        timestamp: new Date(),
        storageId: 'file-storage',
        duration,
        success: false,
        error: error as Error
      });

      this.logger.error('Failed to write usage data', error as Error);

      return {
        success: false,
        error: `Failed to write usage data: ${(error as Error).message}`
      };
    }
  }

  /**
   * Read settings from file
   */
  public async readSettings(): Promise<StorageOperationResult<BudgetSettings>> {
    const start = Date.now();
    this.metrics.readOperations++;

    try {
      const filePath = this.getSettingsPath();
      const exists = await this.fileExists(filePath);

      if (!exists) {
        const defaultSettings: BudgetSettings = {
          enabled: false,
          dailyLimit: 100,
          resetTime: '00:00',
          warningThresholds: [50, 75, 90]
        };

        this.emit({
          type: StorageEventType.DATA_READ,
          timestamp: new Date(),
          storageId: 'file-storage',
          duration: Date.now() - start,
          success: true,
          metadata: { isDefault: true }
        });

        return {
          success: true,
          data: defaultSettings,
          metadata: { isDefault: true }
        };
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const settings = JSON.parse(content) as BudgetSettings;

      const duration = Date.now() - start;
      this.updateReadLatency(duration);

      this.emit({
        type: StorageEventType.DATA_READ,
        timestamp: new Date(),
        storageId: 'file-storage',
        duration,
        dataSize: content.length,
        success: true
      });

      return { success: true, data: settings };

    } catch (error) {
      const duration = Date.now() - start;
      this.updateReadLatency(duration);
      this.incrementErrorRate();

      this.emit({
        type: StorageEventType.ERROR,
        timestamp: new Date(),
        storageId: 'file-storage',
        duration,
        success: false,
        error: error as Error
      });

      return {
        success: false,
        error: `Failed to read settings: ${(error as Error).message}`
      };
    }
  }

  /**
   * Write settings to file
   */
  public async writeSettings(settings: BudgetSettings): Promise<StorageOperationResult> {
    const start = Date.now();
    this.metrics.writeOperations++;

    try {
      const filePath = this.getSettingsPath();
      const content = JSON.stringify(settings, null, 2);

      if (this.config.atomicWrites) {
        await this.atomicWrite(filePath, content);
      } else {
        await fs.writeFile(filePath, content, { mode: this.config.fileMode });
      }

      const duration = Date.now() - start;
      this.updateWriteLatency(duration);

      this.emit({
        type: StorageEventType.DATA_WRITE,
        timestamp: new Date(),
        storageId: 'file-storage',
        duration,
        dataSize: content.length,
        success: true
      });

      return { success: true };

    } catch (error) {
      const duration = Date.now() - start;
      this.updateWriteLatency(duration);
      this.incrementErrorRate();

      this.emit({
        type: StorageEventType.ERROR,
        timestamp: new Date(),
        storageId: 'file-storage',
        duration,
        success: false,
        error: error as Error
      });

      return {
        success: false,
        error: `Failed to write settings: ${(error as Error).message}`
      };
    }
  }

  /**
   * Clear all budget data
   */
  public async clearAllData(confirmationToken: string): Promise<StorageOperationResult> {
    if (confirmationToken !== 'CONFIRM_CLEAR_ALL') {
      return {
        success: false,
        error: 'Invalid confirmation token'
      };
    }

    const start = Date.now();

    try {
      const settingsPath = this.getSettingsPath();
      const usagePath = this.getUsagePath();

      // Remove files if they exist
      if (await this.fileExists(settingsPath)) {
        await fs.unlink(settingsPath);
      }

      if (await this.fileExists(usagePath)) {
        await fs.unlink(usagePath);
      }

      this.logger.info('All budget data cleared');

      return { success: true };

    } catch (error) {
      this.logger.error('Failed to clear budget data', error as Error);

      return {
        success: false,
        error: `Failed to clear data: ${(error as Error).message}`
      };
    }
  }

  /**
   * Create backup of current data
   */
  public async createBackup(): Promise<StorageOperationResult<string>> {
    const start = Date.now();

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupId = `backup-${timestamp}`;
      const backupPath = path.join(this.config.baseDir, this.config.backupDir, backupId);

      await fs.mkdir(backupPath, { recursive: true, mode: this.config.dirMode });

      // Backup settings if exists
      const settingsPath = this.getSettingsPath();
      if (await this.fileExists(settingsPath)) {
        const settingsBackupPath = path.join(backupPath, this.config.settingsFile);
        await fs.copyFile(settingsPath, settingsBackupPath);
      }

      // Backup usage data if exists
      const usagePath = this.getUsagePath();
      if (await this.fileExists(usagePath)) {
        const usageBackupPath = path.join(backupPath, this.config.usageFile);
        await fs.copyFile(usagePath, usageBackupPath);
      }

      // Cleanup old backups
      await this.cleanupOldBackups();

      this.metrics.lastBackup = new Date();

      this.emit({
        type: StorageEventType.BACKUP_CREATED,
        timestamp: new Date(),
        storageId: 'file-storage',
        duration: Date.now() - start,
        success: true,
        metadata: { backupId }
      });

      return {
        success: true,
        data: backupId
      };

    } catch (error) {
      this.logger.error('Failed to create backup', error as Error);

      return {
        success: false,
        error: `Failed to create backup: ${(error as Error).message}`
      };
    }
  }

  /**
   * Restore data from backup
   */
  public async restoreFromBackup(backupId: string): Promise<StorageOperationResult> {
    const start = Date.now();

    try {
      const backupPath = path.join(this.config.baseDir, this.config.backupDir, backupId);

      // Verify backup exists
      const backupStats = await fs.stat(backupPath);
      if (!backupStats.isDirectory()) {
        return {
          success: false,
          error: 'Backup not found'
        };
      }

      // Restore settings if backup contains it
      const settingsBackupPath = path.join(backupPath, this.config.settingsFile);
      if (await this.fileExists(settingsBackupPath)) {
        await fs.copyFile(settingsBackupPath, this.getSettingsPath());
      }

      // Restore usage data if backup contains it
      const usageBackupPath = path.join(backupPath, this.config.usageFile);
      if (await this.fileExists(usageBackupPath)) {
        await fs.copyFile(usageBackupPath, this.getUsagePath());
      }

      this.emit({
        type: StorageEventType.BACKUP_RESTORED,
        timestamp: new Date(),
        storageId: 'file-storage',
        duration: Date.now() - start,
        success: true,
        metadata: { backupId }
      });

      return { success: true };

    } catch (error) {
      this.logger.error('Failed to restore from backup', error as Error);

      return {
        success: false,
        error: `Failed to restore backup: ${(error as Error).message}`
      };
    }
  }

  /**
   * Get storage metrics
   */
  public async getMetrics(): Promise<StorageOperationResult<StorageMetrics>> {
    try {
      this.metrics.spaceUsed = await this.calculateSpaceUsed();
      this.metrics.uptime = Date.now() - this.startTime;

      return {
        success: true,
        data: { ...this.metrics }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get metrics: ${(error as Error).message}`
      };
    }
  }

  /**
   * Close storage connections
   */
  public async close(): Promise<StorageOperationResult> {
    this.logger.info('File storage closed');

    this.emit({
      type: StorageEventType.CLOSED,
      timestamp: new Date(),
      storageId: 'file-storage',
      success: true
    });

    return { success: true };
  }

  /**
   * Subscribe to storage events
   */
  public on(eventType: StorageEventType | 'all', listener: StorageEventListener): void {
    const key = eventType.toString();
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, []);
    }
    this.eventListeners.get(key)!.push(listener);
  }

  /**
   * Unsubscribe from storage events
   */
  public off(eventType: StorageEventType | 'all', listener: StorageEventListener): void {
    const key = eventType.toString();
    const listeners = this.eventListeners.get(key);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index >= 0) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit storage event to listeners
   */
  public emit(event: StorageEvent): void {
    // Emit to specific event type listeners
    const typeListeners = this.eventListeners.get(event.type);
    if (typeListeners) {
      for (const listener of typeListeners) {
        try {
          listener(event);
        } catch (error) {
          this.logger.warn('Event listener error', error as Error);
        }
      }
    }

    // Emit to 'all' listeners
    const allListeners = this.eventListeners.get('all');
    if (allListeners) {
      for (const listener of allListeners) {
        try {
          listener(event);
        } catch (error) {
          this.logger.warn('Event listener error', error as Error);
        }
      }
    }
  }

  /**
   * Get settings file path
   */
  private getSettingsPath(): string {
    return path.join(this.config.baseDir, this.config.settingsFile);
  }

  /**
   * Get usage data file path
   */
  private getUsagePath(): string {
    return path.join(this.config.baseDir, this.config.usageFile);
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if directory is writable
   */
  private async isWritable(dirPath: string): Promise<boolean> {
    try {
      const testFile = path.join(dirPath, '.write-test');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Perform atomic write operation
   */
  private async atomicWrite(filePath: string, content: string): Promise<void> {
    const tempPath = `${filePath}.tmp`;
    await fs.writeFile(tempPath, content, { mode: this.config.fileMode });
    await fs.rename(tempPath, filePath);
  }

  /**
   * Create default usage data
   */
  private createDefaultUsageData(): BudgetUsageData {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    return {
      date: today,
      requestCount: 0,
      totalCost: 0,
      tokenUsage: {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        tokenCosts: { input: 0, output: 0 }
      },
      lastResetTime: now,
      warningsShown: [],
      featureCosts: {},
      sessionUsage: [],
      history: []
    };
  }

  /**
   * Validate and migrate usage data
   */
  private validateUsageData(data: BudgetUsageData): BudgetUsageData {
    // Ensure required fields exist with defaults
    return {
      date: data.date || new Date().toISOString().split('T')[0],
      requestCount: data.requestCount || 0,
      totalCost: data.totalCost || 0,
      tokenUsage: data.tokenUsage || {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        tokenCosts: { input: 0, output: 0 }
      },
      lastResetTime: data.lastResetTime || new Date().toISOString(),
      warningsShown: data.warningsShown || [],
      featureCosts: data.featureCosts || {},
      sessionUsage: data.sessionUsage || [],
      history: data.history || []
    };
  }

  /**
   * Calculate total storage space used
   */
  private async calculateSpaceUsed(): Promise<number> {
    let totalSize = 0;

    try {
      const settingsPath = this.getSettingsPath();
      if (await this.fileExists(settingsPath)) {
        const stats = await fs.stat(settingsPath);
        totalSize += stats.size;
      }

      const usagePath = this.getUsagePath();
      if (await this.fileExists(usagePath)) {
        const stats = await fs.stat(usagePath);
        totalSize += stats.size;
      }
    } catch {
      // Ignore errors in size calculation
    }

    return totalSize;
  }

  /**
   * Update read latency metrics
   */
  private updateReadLatency(duration: number): void {
    const total = this.metrics.averageReadLatency * (this.metrics.readOperations - 1);
    this.metrics.averageReadLatency = (total + duration) / this.metrics.readOperations;
  }

  /**
   * Update write latency metrics
   */
  private updateWriteLatency(duration: number): void {
    const total = this.metrics.averageWriteLatency * (this.metrics.writeOperations - 1);
    this.metrics.averageWriteLatency = (total + duration) / this.metrics.writeOperations;
  }

  /**
   * Increment error rate
   */
  private incrementErrorRate(): void {
    const totalOps = this.metrics.readOperations + this.metrics.writeOperations;
    const currentErrors = Math.floor((this.metrics.errorRate / 100) * totalOps);
    this.metrics.errorRate = ((currentErrors + 1) / totalOps) * 100;
  }

  /**
   * Cleanup old backups based on retention policy
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const backupDir = path.join(this.config.baseDir, this.config.backupDir);
      const entries = await fs.readdir(backupDir);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.backupRetentionDays);

      for (const entry of entries) {
        if (!entry.startsWith('backup-')) continue;

        const entryPath = path.join(backupDir, entry);
        const stats = await fs.stat(entryPath);

        if (stats.isDirectory() && stats.mtime < cutoffDate) {
          await fs.rm(entryPath, { recursive: true });
          this.logger.debug('Removed old backup', { backup: entry });
        }
      }
    } catch (error) {
      this.logger.warn('Failed to cleanup old backups', error as Error);
    }
  }
}

/**
 * Factory function to create file storage instance
 * @param projectRoot - Project root directory
 * @param config - Storage configuration
 * @returns File storage instance
 */
export function createFileStorage(
  projectRoot: string,
  config: Partial<FileStorageConfig> = {}
): FileStorage {
  return new FileStorage(projectRoot, config);
}