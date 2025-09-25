/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fse from 'fs-extra';
import { promises as fsPromises } from 'node:fs';
import { join, dirname } from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { gzipSync, gunzipSync } from 'node:zlib';
import * as tar from 'tar';
import { tmpdir, homedir } from 'node:os';
import type { Task as SDKTask } from '@a2a-js/sdk';
import type { TaskStore } from '@a2a-js/sdk/server';
import { logger } from '../utils/logger.js';
import { setTargetDir } from '../config/config.js';
import { getPersistedState, type PersistedTaskMetadata } from '../types.js';

/**
 * File-based persistence storage configuration
 */
export interface FileBasedStorageConfig {
  /** Base directory for persistence storage (default: ~/.gemini-cli/persistence) */
  storageDir?: string;
  /** Enable compression for metadata storage */
  compressMetadata?: boolean;
  /** Enable compression for workspace archives */
  compressWorkspace?: boolean;
  /** Maximum number of backup versions to keep */
  maxBackupVersions?: number;
  /** Enable automatic cleanup of old sessions */
  enableAutoCleanup?: boolean;
  /** Maximum age of sessions to keep (in milliseconds) */
  maxSessionAge?: number;
  /** Enable performance monitoring */
  enableMetrics?: boolean;
}

/**
 * Task session metadata for cross-session tracking
 */
export interface TaskSessionMetadata {
  /** Unique session identifier */
  sessionId: string;
  /** Task creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Session owner/agent identifier */
  ownerId?: string;
  /** Task completion status */
  isComplete: boolean;
  /** Metadata format version */
  version: string;
  /** Additional session properties */
  properties: Record<string, unknown>;
}

/**
 * Storage metrics tracking
 */
export interface StorageMetrics {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  storageSize: number;
  compressionRatio: number;
  averageLoadTime: number;
  averageSaveTime: number;
  lastCleanupTime?: string;
}

/**
 * Comprehensive file-based task persistence storage system with cross-session continuity
 *
 * Features:
 * - Local file-based storage with configurable compression
 * - Cross-session task correlation and ownership tracking
 * - Concurrent access conflict resolution
 * - Data integrity with backup and recovery mechanisms
 * - Performance monitoring and optimization
 * - Automatic cleanup and maintenance
 */
export class FileBasedTaskStore implements TaskStore {
  private config: Required<FileBasedStorageConfig>;
  private metrics: StorageMetrics;
  private activeLocks: Map<string, Promise<void>>;

  constructor(config: FileBasedStorageConfig = {}) {
    // Initialize configuration with defaults
    this.config = {
      storageDir: config.storageDir || join(homedir(), '.gemini-cli', 'persistence'),
      compressMetadata: config.compressMetadata ?? true,
      compressWorkspace: config.compressWorkspace ?? true,
      maxBackupVersions: config.maxBackupVersions ?? 5,
      enableAutoCleanup: config.enableAutoCleanup ?? true,
      maxSessionAge: config.maxSessionAge ?? (7 * 24 * 60 * 60 * 1000), // 7 days
      enableMetrics: config.enableMetrics ?? true,
    };

    // Initialize metrics
    this.metrics = {
      totalTasks: 0,
      activeTasks: 0,
      completedTasks: 0,
      storageSize: 0,
      compressionRatio: 1.0,
      averageLoadTime: 0,
      averageSaveTime: 0,
    };

    // Initialize concurrency control
    this.activeLocks = new Map();

    logger.info(`FileBasedTaskStore initialized with storage dir: ${this.config.storageDir}`);
    this.initializeStorage();
  }

  /**
   * Initialize storage directory structure and load existing metrics
   */
  private async initializeStorage(): Promise<void> {
    try {
      // Create base directory structure
      await fse.ensureDir(this.config.storageDir);
      await fse.ensureDir(join(this.config.storageDir, 'tasks'));
      await fse.ensureDir(join(this.config.storageDir, 'workspaces'));
      await fse.ensureDir(join(this.config.storageDir, 'sessions'));
      await fse.ensureDir(join(this.config.storageDir, 'backups'));
      await fse.ensureDir(join(this.config.storageDir, 'metrics'));

      // Load existing metrics
      await this.loadMetrics();

      // Perform initial cleanup if enabled
      if (this.config.enableAutoCleanup) {
        await this.performMaintenanceCleanup();
      }

      logger.info('FileBasedTaskStore storage initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize FileBasedTaskStore storage:', error);
      throw new Error(`Storage initialization failed: ${error}`);
    }
  }

  /**
   * Acquire exclusive lock for task to prevent concurrent modification
   */
  private async acquireTaskLock(taskId: string): Promise<void> {
    const existingLock = this.activeLocks.get(taskId);
    if (existingLock) {
      logger.debug(`Waiting for existing lock on task ${taskId}`);
      await existingLock;
    }

    const lockPromise = this.createTaskLock(taskId);
    this.activeLocks.set(taskId, lockPromise);
    await lockPromise;
  }

  /**
   * Create task lock mechanism
   */
  private async createTaskLock(taskId: string): Promise<void> {
    const lockFile = join(this.config.storageDir, 'tasks', `${taskId}.lock`);
    const lockData = {
      pid: process.pid,
      timestamp: new Date().toISOString(),
      sessionId: uuidv4(),
    };

    let retries = 10;
    while (retries > 0) {
      try {
        // Atomic lock creation
        await fse.writeJSON(lockFile, lockData, { flag: 'wx' });
        logger.debug(`Acquired lock for task ${taskId}`);
        return;
      } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'EEXIST') {
          // Lock file exists, check if it's stale
          try {
            const existingLock = await fse.readJSON(lockFile);
            const lockAge = Date.now() - new Date(existingLock.timestamp).getTime();

            // If lock is older than 5 minutes, consider it stale
            if (lockAge > 5 * 60 * 1000) {
              logger.warn(`Removing stale lock for task ${taskId}`);
              await fse.remove(lockFile);
              continue;
            }
          } catch {
            // If we can't read the lock file, remove it
            await fse.remove(lockFile);
            continue;
          }

          // Wait and retry
          await new Promise(resolve => setTimeout(resolve, 100));
          retries--;
        } else {
          throw error;
        }
      }
    }

    throw new Error(`Failed to acquire lock for task ${taskId} after multiple retries`);
  }

  /**
   * Release task lock
   */
  private async releaseTaskLock(taskId: string): Promise<void> {
    const lockFile = join(this.config.storageDir, 'tasks', `${taskId}.lock`);
    try {
      await fse.remove(lockFile);
      this.activeLocks.delete(taskId);
      logger.debug(`Released lock for task ${taskId}`);
    } catch (error) {
      logger.warn(`Failed to release lock for task ${taskId}:`, error);
    }
  }

  /**
   * Get file paths for task storage
   */
  private getTaskPaths(taskId: string): {
    metadataPath: string;
    workspacePath: string;
    sessionPath: string;
    backupDir: string;
  } {
    const baseDir = this.config.storageDir;
    return {
      metadataPath: join(baseDir, 'tasks', `${taskId}.json${this.config.compressMetadata ? '.gz' : ''}`),
      workspacePath: join(baseDir, 'workspaces', `${taskId}.tar.gz`),
      sessionPath: join(baseDir, 'sessions', `${taskId}-session.json`),
      backupDir: join(baseDir, 'backups', taskId),
    };
  }

  /**
   * Save task with comprehensive persistence features
   */
  async save(task: SDKTask): Promise<void> {
    const startTime = Date.now();
    const taskId = task.id;

    logger.info(`Saving task ${taskId} to file-based storage`);

    try {
      // Acquire exclusive lock
      await this.acquireTaskLock(taskId);

      const persistedState = getPersistedState(task.metadata as PersistedTaskMetadata);
      if (!persistedState) {
        throw new Error(`Task ${taskId} is missing persisted state in metadata.`);
      }

      const paths = this.getTaskPaths(taskId);

      // Create session metadata
      const sessionMetadata: TaskSessionMetadata = {
        sessionId: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ownerId: process.env.USER || process.env.USERNAME || 'unknown',
        isComplete: task.status.state === 'completed' || task.status.state === 'failed',
        version: '1.0.0',
        properties: {
          taskState: persistedState._taskState,
          workspacePath: persistedState._agentSettings.workspacePath,
        },
      };

      // Create backup before saving
      await this.createBackup(taskId, paths);

      // Save metadata
      await this.saveMetadata(task, paths.metadataPath, sessionMetadata);

      // Save workspace if it exists
      await this.saveWorkspace(taskId, persistedState, paths.workspacePath);

      // Save session metadata
      await fse.writeJSON(paths.sessionPath, sessionMetadata, { spaces: 2 });

      // Update metrics
      await this.updateMetrics(taskId, Date.now() - startTime, 'save');

      logger.info(`Successfully saved task ${taskId} in ${Date.now() - startTime}ms`);
    } catch (error) {
      logger.error(`Failed to save task ${taskId}:`, error);
      throw error;
    } finally {
      await this.releaseTaskLock(taskId);
    }
  }

  /**
   * Save task metadata with optional compression
   */
  private async saveMetadata(
    task: SDKTask,
    metadataPath: string,
    sessionMetadata: TaskSessionMetadata
  ): Promise<void> {
    const dataToStore = {
      ...task.metadata,
      _sessionMetadata: sessionMetadata,
      _storageVersion: '1.0.0',
      _savedAt: new Date().toISOString(),
    };

    await fse.ensureDir(dirname(metadataPath));

    if (this.config.compressMetadata) {
      const jsonString = JSON.stringify(dataToStore, null, 2);
      const compressedData = gzipSync(Buffer.from(jsonString));
      await fse.writeFile(metadataPath, compressedData);
    } else {
      await fse.writeJSON(metadataPath, dataToStore, { spaces: 2 });
    }

    logger.debug(`Saved metadata to ${metadataPath}`);
  }

  /**
   * Save workspace archive with compression
   */
  private async saveWorkspace(
    taskId: string,
    persistedState: any,
    workspacePath: string
  ): Promise<void> {
    const workDir = process.cwd();

    if (!(await fse.pathExists(workDir))) {
      logger.debug(`Workspace directory ${workDir} not found, skipping workspace save`);
      return;
    }

    const entries = await fsPromises.readdir(workDir);
    if (entries.length === 0) {
      logger.debug(`Workspace directory ${workDir} is empty, skipping workspace save`);
      return;
    }

    await fse.ensureDir(dirname(workspacePath));

    const tmpArchiveFile = join(tmpdir(), `task-${taskId}-workspace-${uuidv4()}.tar.gz`);

    try {
      // Create compressed workspace archive
      await tar.c(
        {
          gzip: this.config.compressWorkspace,
          file: tmpArchiveFile,
          cwd: workDir,
          portable: true,
        },
        entries,
      );

      if (!(await fse.pathExists(tmpArchiveFile))) {
        throw new Error(`Failed to create workspace archive ${tmpArchiveFile}`);
      }

      // Move to final location
      await fse.move(tmpArchiveFile, workspacePath, { overwrite: true });
      logger.debug(`Saved workspace archive to ${workspacePath}`);
    } catch (error) {
      logger.error(`Error saving workspace for task ${taskId}:`, error);
      throw error;
    } finally {
      // Cleanup temporary file
      if (await fse.pathExists(tmpArchiveFile)) {
        await fse.remove(tmpArchiveFile);
      }
    }
  }

  /**
   * Load task with cross-session continuation support
   */
  async load(taskId: string): Promise<SDKTask | undefined> {
    const startTime = Date.now();

    logger.info(`Loading task ${taskId} from file-based storage`);

    try {
      const paths = this.getTaskPaths(taskId);

      // Check if metadata file exists
      if (!(await fse.pathExists(paths.metadataPath))) {
        logger.debug(`Task ${taskId} metadata not found`);
        return undefined;
      }

      // Load metadata
      const loadedMetadata = await this.loadMetadata(paths.metadataPath);

      // Load session metadata
      const sessionMetadata = await this.loadSessionMetadata(paths.sessionPath);

      // Restore workspace if it exists
      await this.restoreWorkspace(taskId, loadedMetadata, paths.workspacePath);

      // Create SDK task object
      const task = this.createSDKTask(taskId, loadedMetadata, sessionMetadata);

      // Update metrics
      await this.updateMetrics(taskId, Date.now() - startTime, 'load');

      logger.info(`Successfully loaded task ${taskId} in ${Date.now() - startTime}ms`);
      return task;
    } catch (error) {
      logger.error(`Failed to load task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Load task metadata with decompression support
   */
  private async loadMetadata(metadataPath: string): Promise<any> {
    if (this.config.compressMetadata && metadataPath.endsWith('.gz')) {
      const compressedData = await fse.readFile(metadataPath);
      const jsonString = gunzipSync(compressedData).toString();
      return JSON.parse(jsonString);
    } else {
      return await fse.readJSON(metadataPath);
    }
  }

  /**
   * Load session metadata
   */
  private async loadSessionMetadata(sessionPath: string): Promise<TaskSessionMetadata | undefined> {
    try {
      if (await fse.pathExists(sessionPath)) {
        return await fse.readJSON(sessionPath);
      }
    } catch (error) {
      logger.warn(`Failed to load session metadata from ${sessionPath}:`, error);
    }
    return undefined;
  }

  /**
   * Restore workspace from archive
   */
  private async restoreWorkspace(
    taskId: string,
    loadedMetadata: any,
    workspacePath: string
  ): Promise<void> {
    const persistedState = getPersistedState(loadedMetadata);
    if (!persistedState) {
      throw new Error(`Loaded metadata for task ${taskId} is missing persisted state`);
    }

    const workDir = setTargetDir(persistedState._agentSettings);
    await fse.ensureDir(workDir);

    if (!(await fse.pathExists(workspacePath))) {
      logger.debug(`Workspace archive not found for task ${taskId}`);
      return;
    }

    const tmpArchiveFile = join(tmpdir(), `task-${taskId}-restore-${uuidv4()}.tar.gz`);

    try {
      // Copy archive to temp location
      await fse.copy(workspacePath, tmpArchiveFile);

      // Extract workspace
      await tar.x({ file: tmpArchiveFile, cwd: workDir });

      logger.debug(`Restored workspace for task ${taskId} to ${workDir}`);
    } catch (error) {
      logger.error(`Error restoring workspace for task ${taskId}:`, error);
      throw error;
    } finally {
      // Cleanup
      if (await fse.pathExists(tmpArchiveFile)) {
        await fse.remove(tmpArchiveFile);
      }
    }
  }

  /**
   * Create SDK Task object from loaded data
   */
  private createSDKTask(
    taskId: string,
    loadedMetadata: any,
    sessionMetadata?: TaskSessionMetadata
  ): SDKTask {
    const persistedState = getPersistedState(loadedMetadata);
    if (!persistedState) {
      throw new Error(`Invalid persisted state for task ${taskId}`);
    }

    return {
      id: taskId,
      contextId: loadedMetadata._contextId || uuidv4(),
      kind: 'task',
      status: {
        state: persistedState._taskState,
        timestamp: sessionMetadata?.updatedAt || new Date().toISOString(),
      },
      metadata: loadedMetadata,
      history: [],
      artifacts: [],
    };
  }

  /**
   * Create backup of existing task data
   */
  private async createBackup(taskId: string, paths: any): Promise<void> {
    if (!this.config.maxBackupVersions || this.config.maxBackupVersions <= 0) {
      return;
    }

    const backupDir = paths.backupDir;
    await fse.ensureDir(backupDir);

    const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupSuffix = `.backup-${backupTimestamp}`;

    // Backup existing files if they exist
    const filesToBackup = [
      { source: paths.metadataPath, target: join(backupDir, `metadata${backupSuffix}.json${this.config.compressMetadata ? '.gz' : ''}`) },
      { source: paths.workspacePath, target: join(backupDir, `workspace${backupSuffix}.tar.gz`) },
      { source: paths.sessionPath, target: join(backupDir, `session${backupSuffix}.json`) },
    ];

    for (const file of filesToBackup) {
      if (await fse.pathExists(file.source)) {
        try {
          await fse.copy(file.source, file.target);
          logger.debug(`Created backup: ${file.target}`);
        } catch (error) {
          logger.warn(`Failed to create backup ${file.target}:`, error);
        }
      }
    }

    // Clean up old backups
    await this.cleanupOldBackups(backupDir);
  }

  /**
   * Clean up old backup files
   */
  private async cleanupOldBackups(backupDir: string): Promise<void> {
    try {
      const files = await fsPromises.readdir(backupDir);
      const backupFiles = files
        .filter(f => f.includes('.backup-'))
        .map(f => ({
          name: f,
          path: join(backupDir, f),
          timestamp: f.match(/\.backup-(.+)\./)?.[1] || '',
        }))
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

      // Keep only the most recent backups
      const filesToDelete = backupFiles.slice(this.config.maxBackupVersions);

      for (const file of filesToDelete) {
        await fse.remove(file.path);
        logger.debug(`Removed old backup: ${file.name}`);
      }
    } catch (error) {
      logger.warn(`Failed to cleanup old backups in ${backupDir}:`, error);
    }
  }

  /**
   * Update storage metrics
   */
  private async updateMetrics(taskId: string, operationTime: number, operation: 'save' | 'load'): Promise<void> {
    if (!this.config.enableMetrics) {
      return;
    }

    try {
      // Update operation-specific metrics
      if (operation === 'save') {
        this.metrics.averageSaveTime = (this.metrics.averageSaveTime + operationTime) / 2;
      } else {
        this.metrics.averageLoadTime = (this.metrics.averageLoadTime + operationTime) / 2;
      }

      // Update general metrics periodically
      if (Math.random() < 0.1) { // 10% chance to update general metrics
        await this.refreshMetrics();
      }

      // Save metrics to disk periodically
      if (Math.random() < 0.05) { // 5% chance to save metrics
        await this.saveMetrics();
      }
    } catch (error) {
      logger.warn('Failed to update metrics:', error);
    }
  }

  /**
   * Refresh storage metrics
   */
  private async refreshMetrics(): Promise<void> {
    try {
      const tasksDir = join(this.config.storageDir, 'tasks');
      const sessionsDir = join(this.config.storageDir, 'sessions');

      if (!(await fse.pathExists(tasksDir))) {
        return;
      }

      const taskFiles = await fsPromises.readdir(tasksDir);
      const sessionFiles = await fse.pathExists(sessionsDir)
        ? await fsPromises.readdir(sessionsDir)
        : [];

      this.metrics.totalTasks = taskFiles.filter(f => f.endsWith('.json') || f.endsWith('.json.gz')).length;

      // Count active vs completed tasks
      let activeTasks = 0;
      let completedTasks = 0;

      for (const sessionFile of sessionFiles.filter(f => f.endsWith('.json'))) {
        try {
          const sessionMetadata = await fse.readJSON(join(sessionsDir, sessionFile));
          if (sessionMetadata.isComplete) {
            completedTasks++;
          } else {
            activeTasks++;
          }
        } catch (error) {
          // Ignore errors reading individual session files
        }
      }

      this.metrics.activeTasks = activeTasks;
      this.metrics.completedTasks = completedTasks;

      // Calculate storage size
      this.metrics.storageSize = await this.calculateStorageSize();

    } catch (error) {
      logger.warn('Failed to refresh metrics:', error);
    }
  }

  /**
   * Calculate total storage size
   */
  private async calculateStorageSize(): Promise<number> {
    try {
      const calculateDirSize = async (dir: string): Promise<number> => {
        if (!(await fse.pathExists(dir))) {
          return 0;
        }

        let size = 0;
        const files = await fsPromises.readdir(dir, { withFileTypes: true });

        for (const file of files) {
          const filePath = join(dir, file.name);
          if (file.isDirectory()) {
            size += await calculateDirSize(filePath);
          } else {
            const stats = await fsPromises.stat(filePath);
            size += stats.size;
          }
        }

        return size;
      };

      return await calculateDirSize(this.config.storageDir);
    } catch (error) {
      logger.warn('Failed to calculate storage size:', error);
      return 0;
    }
  }

  /**
   * Load metrics from disk
   */
  private async loadMetrics(): Promise<void> {
    const metricsPath = join(this.config.storageDir, 'metrics', 'storage-metrics.json');

    try {
      if (await fse.pathExists(metricsPath)) {
        const savedMetrics = await fse.readJSON(metricsPath);
        this.metrics = { ...this.metrics, ...savedMetrics };
        logger.debug('Loaded storage metrics from disk');
      }
    } catch (error) {
      logger.warn('Failed to load metrics from disk:', error);
    }
  }

  /**
   * Save metrics to disk
   */
  private async saveMetrics(): Promise<void> {
    const metricsPath = join(this.config.storageDir, 'metrics', 'storage-metrics.json');

    try {
      await fse.ensureDir(dirname(metricsPath));
      await fse.writeJSON(metricsPath, this.metrics, { spaces: 2 });
      logger.debug('Saved storage metrics to disk');
    } catch (error) {
      logger.warn('Failed to save metrics to disk:', error);
    }
  }

  /**
   * Perform maintenance cleanup
   */
  private async performMaintenanceCleanup(): Promise<void> {
    if (!this.config.enableAutoCleanup) {
      return;
    }

    logger.info('Performing storage maintenance cleanup');

    try {
      const sessionsDir = join(this.config.storageDir, 'sessions');

      if (!(await fse.pathExists(sessionsDir))) {
        return;
      }

      const sessionFiles = await fsPromises.readdir(sessionsDir);
      const now = Date.now();
      let cleanedCount = 0;

      for (const sessionFile of sessionFiles.filter(f => f.endsWith('.json'))) {
        try {
          const sessionPath = join(sessionsDir, sessionFile);
          const sessionMetadata = await fse.readJSON(sessionPath);

          const sessionAge = now - new Date(sessionMetadata.updatedAt).getTime();

          // Clean up old completed sessions
          if (sessionMetadata.isComplete && sessionAge > this.config.maxSessionAge) {
            const taskId = sessionFile.replace('-session.json', '');
            await this.cleanupTaskFiles(taskId);
            cleanedCount++;
          }
        } catch (error) {
          logger.warn(`Failed to process session file ${sessionFile}:`, error);
        }
      }

      this.metrics.lastCleanupTime = new Date().toISOString();

      if (cleanedCount > 0) {
        logger.info(`Cleaned up ${cleanedCount} old task sessions`);
      }
    } catch (error) {
      logger.error('Failed to perform maintenance cleanup:', error);
    }
  }

  /**
   * Clean up all files for a specific task
   */
  private async cleanupTaskFiles(taskId: string): Promise<void> {
    const paths = this.getTaskPaths(taskId);

    const filesToCleanup = [
      paths.metadataPath,
      paths.workspacePath,
      paths.sessionPath,
      paths.backupDir,
    ];

    for (const filePath of filesToCleanup) {
      try {
        if (await fse.pathExists(filePath)) {
          await fse.remove(filePath);
          logger.debug(`Removed ${filePath}`);
        }
      } catch (error) {
        logger.warn(`Failed to remove ${filePath}:`, error);
      }
    }
  }

  /**
   * Get current storage metrics
   */
  async getMetrics(): Promise<StorageMetrics> {
    await this.refreshMetrics();
    return { ...this.metrics };
  }

  /**
   * List all active task sessions
   */
  async listActiveSessions(): Promise<TaskSessionMetadata[]> {
    const sessionsDir = join(this.config.storageDir, 'sessions');

    if (!(await fse.pathExists(sessionsDir))) {
      return [];
    }

    const sessionFiles = await fsPromises.readdir(sessionsDir);
    const sessions: TaskSessionMetadata[] = [];

    for (const sessionFile of sessionFiles.filter(f => f.endsWith('.json'))) {
      try {
        const sessionPath = join(sessionsDir, sessionFile);
        const sessionMetadata = await fse.readJSON(sessionPath);

        if (!sessionMetadata.isComplete) {
          sessions.push(sessionMetadata);
        }
      } catch (error) {
        logger.warn(`Failed to read session file ${sessionFile}:`, error);
      }
    }

    return sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  /**
   * Manually trigger cleanup
   */
  async performCleanup(): Promise<void> {
    await this.performMaintenanceCleanup();
  }

  /**
   * Get storage configuration
   */
  getConfig(): Required<FileBasedStorageConfig> {
    return { ...this.config };
  }
}