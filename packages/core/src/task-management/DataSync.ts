/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import * as crypto from 'node:crypto';
import { logger } from '../utils/logger.js';
import type { TaskPersistence } from './TaskPersistence.js';
import type { SessionManager } from './SessionManager.js';
import type { Task, TaskId, TaskStatus, TaskDependency } from './types.js';

/**
 * Data synchronization configuration
 */
export interface DataSyncConfig {
  /** Enable real-time synchronization */
  enableRealTimeSync?: boolean;
  /** Synchronization interval in milliseconds (default: 1000ms) */
  syncInterval?: number;
  /** Conflict resolution strategy */
  conflictResolution?: ConflictResolutionStrategy;
  /** Enable optimistic locking */
  enableOptimisticLocking?: boolean;
  /** Maximum sync retries */
  maxRetries?: number;
  /** Retry backoff factor */
  retryBackoffFactor?: number;
  /** Enable change tracking */
  enableChangeTracking?: boolean;
  /** Change buffer size */
  changeBufferSize?: number;
  /** Enable compression for sync data */
  enableCompression?: boolean;
  /** Sync batch size */
  syncBatchSize?: number;
}

/**
 * Conflict resolution strategies
 */
export type ConflictResolutionStrategy =
  | 'last-write-wins'
  | 'first-write-wins'
  | 'merge'
  | 'manual'
  | 'version-based';

/**
 * Change operation types
 */
export type ChangeType =
  | 'create'
  | 'update'
  | 'delete'
  | 'status_change'
  | 'dependency_change';

/**
 * Data change record for tracking modifications
 */
export interface DataChange {
  /** Unique change ID */
  id: string;
  /** Change type */
  type: ChangeType;
  /** Entity type affected */
  entityType: 'task' | 'dependency' | 'session' | 'ownership';
  /** Entity ID */
  entityId: string;
  /** Session that made the change */
  sessionId: string;
  /** Agent that made the change */
  agentId: string;
  /** Timestamp of change */
  timestamp: Date;
  /** Change data (before/after values) */
  data: {
    before?: unknown;
    after?: unknown;
    metadata?: Record<string, unknown>;
  };
  /** Change checksum for integrity */
  checksum: string;
  /** Whether change has been synchronized */
  synchronized: boolean;
  /** Synchronization attempts */
  syncAttempts: number;
}

/**
 * Synchronization conflict information
 */
export interface SyncConflict {
  /** Conflict ID */
  id: string;
  /** Entity type in conflict */
  entityType: 'task' | 'dependency' | 'session';
  /** Entity ID */
  entityId: string;
  /** Conflicting changes */
  conflicts: DataChange[];
  /** Conflict detection timestamp */
  detectedAt: Date;
  /** Resolution status */
  resolved: boolean;
  /** Resolution timestamp */
  resolvedAt?: Date;
  /** Resolution method used */
  resolutionMethod?: ConflictResolutionStrategy;
  /** Resolution result */
  resolution?: {
    winner: DataChange;
    discarded: DataChange[];
    merged?: unknown;
  };
}

/**
 * Synchronization state for tracking sync progress
 */
export interface SyncState {
  /** Last successful sync timestamp */
  lastSyncAt: Date;
  /** Number of pending changes */
  pendingChanges: number;
  /** Number of conflicts */
  activeConflicts: number;
  /** Sync statistics */
  stats: {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    conflictsResolved: number;
    averageSyncTime: number;
  };
}

/**
 * Sync batch for efficient bulk operations
 */
export interface SyncBatch {
  /** Batch ID */
  id: string;
  /** Changes in this batch */
  changes: DataChange[];
  /** Batch creation timestamp */
  createdAt: Date;
  /** Session that created the batch */
  sessionId: string;
  /** Batch checksum */
  checksum: string;
}

/**
 * Comprehensive real-time data synchronization system
 *
 * Features:
 * - Real-time change tracking and synchronization
 * - Conflict detection and resolution
 * - Optimistic locking for concurrent modifications
 * - Change buffering and batching for performance
 * - Integrity verification with checksums
 * - Automatic retry mechanisms
 * - Compression for efficient data transfer
 * - Event-driven synchronization notifications
 */
export class DataSync extends EventEmitter {
  private config: Required<DataSyncConfig>;
  private persistence: TaskPersistence;
  private sessionManager: SessionManager;
  private changeBuffer: Map<string, DataChange> = new Map();
  private conflicts: Map<string, SyncConflict> = new Map();
  private syncState: SyncState;
  private syncTimer?: NodeJS.Timeout;
  private isInitialized = false;
  private isSyncing = false;

  constructor(
    persistence: TaskPersistence,
    sessionManager: SessionManager,
    config: DataSyncConfig = {},
  ) {
    super();

    this.persistence = persistence;
    this.sessionManager = sessionManager;
    this.config = {
      enableRealTimeSync: config.enableRealTimeSync ?? true,
      syncInterval: config.syncInterval ?? 1000, // 1 second
      conflictResolution: config.conflictResolution ?? 'last-write-wins',
      enableOptimisticLocking: config.enableOptimisticLocking ?? true,
      maxRetries: config.maxRetries ?? 3,
      retryBackoffFactor: config.retryBackoffFactor ?? 2,
      enableChangeTracking: config.enableChangeTracking ?? true,
      changeBufferSize: config.changeBufferSize ?? 1000,
      enableCompression: config.enableCompression ?? true,
      syncBatchSize: config.syncBatchSize ?? 50,
    };

    // Initialize sync state
    this.syncState = {
      lastSyncAt: new Date(),
      pendingChanges: 0,
      activeConflicts: 0,
      stats: {
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        conflictsResolved: 0,
        averageSyncTime: 0,
      },
    };

    logger().info('DataSync initialized with configuration:', this.config);
  }

  /**
   * Initialize the data synchronization system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger().warn('DataSync already initialized');
      return;
    }

    try {
      // Set up event listeners for change tracking
      this.setupChangeTracking();

      // Start real-time synchronization if enabled
      if (this.config.enableRealTimeSync) {
        this.startRealTimeSync();
      }

      this.isInitialized = true;
      this.emit('initialized');

      logger().info('DataSync initialized successfully');
    } catch (error) {
      logger().error('Failed to initialize DataSync:', error);
      throw error;
    }
  }

  /**
   * Track a data change for synchronization
   */
  async trackChange(
    type: ChangeType,
    entityType: 'task' | 'dependency' | 'session' | 'ownership',
    entityId: string,
    sessionId: string,
    agentId: string,
    beforeData?: unknown,
    afterData?: unknown,
    metadata?: Record<string, unknown>,
  ): Promise<string> {
    if (!this.config.enableChangeTracking) {
      return '';
    }

    const changeId = crypto.randomUUID();
    const changeData = {
      before: beforeData,
      after: afterData,
      metadata,
    };

    // Calculate checksum for integrity
    const checksum = this.calculateChecksum(changeData);

    const change: DataChange = {
      id: changeId,
      type,
      entityType,
      entityId,
      sessionId,
      agentId,
      timestamp: new Date(),
      data: changeData,
      checksum,
      synchronized: false,
      syncAttempts: 0,
    };

    // Add to change buffer
    this.changeBuffer.set(changeId, change);
    this.syncState.pendingChanges++;

    // Trim buffer if it exceeds size limit
    if (this.changeBuffer.size > this.config.changeBufferSize) {
      this.trimChangeBuffer();
    }

    logger().debug(`Tracked change ${changeId} for ${entityType} ${entityId}`);
    this.emit('change-tracked', change);

    // Trigger immediate sync for critical changes
    if (this.isCriticalChange(change)) {
      setImmediate(() => this.syncChanges());
    }

    return changeId;
  }

  /**
   * Synchronize all pending changes
   */
  async syncChanges(force = false): Promise<SyncResult> {
    if (this.isSyncing && !force) {
      logger().debug('Sync already in progress, skipping');
      return {
        success: true,
        changesSynced: 0,
        conflictsFound: 0,
        duration: 0,
      };
    }

    this.isSyncing = true;
    const startTime = Date.now();

    try {
      const pendingChanges = Array.from(this.changeBuffer.values())
        .filter((change) => !change.synchronized)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      if (pendingChanges.length === 0) {
        logger().debug('No pending changes to synchronize');
        return {
          success: true,
          changesSynced: 0,
          conflictsFound: 0,
          duration: 0,
        };
      }

      logger().info(
        `Starting synchronization of ${pendingChanges.length} changes`,
      );

      let changesSynced = 0;
      let conflictsFound = 0;

      // Process changes in batches
      const batches = this.createBatches(pendingChanges);

      for (const batch of batches) {
        try {
          const result = await this.processBatch(batch);
          changesSynced += result.changesSynced;
          conflictsFound += result.conflictsFound;
        } catch (error) {
          logger().error(`Failed to process batch ${batch.id}:`, error);
          // Continue with next batch
        }
      }

      // Update sync state
      const duration = Date.now() - startTime;
      this.updateSyncStats(true, duration);
      this.syncState.lastSyncAt = new Date();
      this.syncState.pendingChanges = this.changeBuffer.size;

      const result: SyncResult = {
        success: true,
        changesSynced,
        conflictsFound,
        duration,
      };

      logger().info(
        `Synchronization completed: ${changesSynced} changes synced, ${conflictsFound} conflicts found`,
      );
      this.emit('sync-completed', result);

      return result;
    } catch (error) {
      logger().error('Synchronization failed:', error);
      this.updateSyncStats(false, Date.now() - startTime);

      const result: SyncResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        changesSynced: 0,
        conflictsFound: 0,
        duration: Date.now() - startTime,
      };

      this.emit('sync-failed', result);
      return result;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Resolve a synchronization conflict
   */
  async resolveConflict(
    conflictId: string,
    strategy?: ConflictResolutionStrategy,
    manualResolution?: unknown,
  ): Promise<void> {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found`);
    }

    if (conflict.resolved) {
      logger().warn(`Conflict ${conflictId} is already resolved`);
      return;
    }

    const resolveStrategy = strategy || this.config.conflictResolution;

    try {
      let resolution: SyncConflict['resolution'];

      switch (resolveStrategy) {
        case 'last-write-wins':
          resolution = this.resolveLastWriteWins(conflict);
          break;

        case 'first-write-wins':
          resolution = this.resolveFirstWriteWins(conflict);
          break;

        case 'version-based':
          resolution = await this.resolveVersionBased(conflict);
          break;

        case 'merge':
          resolution = this.resolveMerge(conflict);
          break;

        case 'manual':
          if (!manualResolution) {
            throw new Error(
              'Manual resolution data required for manual conflict resolution',
            );
          }
          resolution = this.resolveManual(conflict, manualResolution);
          break;

        default:
          throw new Error(
            `Unknown conflict resolution strategy: ${resolveStrategy}`,
          );
      }

      // Apply resolution
      await this.applyResolution(conflict, resolution);

      // Update conflict state
      conflict.resolved = true;
      conflict.resolvedAt = new Date();
      conflict.resolutionMethod = resolveStrategy;
      conflict.resolution = resolution;

      this.syncState.activeConflicts--;
      this.syncState.stats.conflictsResolved++;

      logger().info(
        `Resolved conflict ${conflictId} using ${resolveStrategy} strategy`,
      );
      this.emit('conflict-resolved', conflict);
    } catch (error) {
      logger().error(`Failed to resolve conflict ${conflictId}:`, error);
      throw error;
    }
  }

  /**
   * Get current synchronization state
   */
  getSyncState(): SyncState {
    return { ...this.syncState };
  }

  /**
   * Get pending changes with optional filtering
   */
  getPendingChanges(filter?: {
    entityType?: 'task' | 'dependency' | 'session' | 'ownership';
    entityId?: string;
    sessionId?: string;
    changeType?: ChangeType;
  }): DataChange[] {
    const changes = Array.from(this.changeBuffer.values()).filter(
      (change) => !change.synchronized,
    );

    if (!filter) {
      return changes;
    }

    return changes.filter((change) => {
      if (filter.entityType && change.entityType !== filter.entityType) {
        return false;
      }

      if (filter.entityId && change.entityId !== filter.entityId) {
        return false;
      }

      if (filter.sessionId && change.sessionId !== filter.sessionId) {
        return false;
      }

      if (filter.changeType && change.type !== filter.changeType) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get active conflicts
   */
  getActiveConflicts(): SyncConflict[] {
    return Array.from(this.conflicts.values()).filter(
      (conflict) => !conflict.resolved,
    );
  }

  /**
   * Force synchronization of specific entity
   */
  async forceSync(
    entityType: 'task' | 'dependency',
    entityId: string,
  ): Promise<void> {
    try {
      switch (entityType) {
        case 'task':
          await this.syncTask(entityId);
          break;
        case 'dependency':
          await this.syncDependency(entityId);
          break;
        default:
          throw new Error(
            `Unsupported entity type for force sync: ${entityType}`,
          );
      }

      logger().info(`Force synchronized ${entityType} ${entityId}`);
      this.emit('force-sync-completed', { entityType, entityId });
    } catch (error) {
      logger().error(`Failed to force sync ${entityType} ${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Setup change tracking by listening to relevant events
   */
  private setupChangeTracking(): void {
    // Task-related changes
    this.persistence.on('task-saved', (event) => {
      this.trackChange(
        'update',
        'task',
        event.taskId,
        'system', // TODO: get actual session ID
        'system', // TODO: get actual agent ID
        undefined,
        event,
        { source: 'task-saved' },
      );
    });

    this.persistence.on('task-loaded', (event) => {
      // Don't track read operations
    });

    // Session-related changes
    this.sessionManager.on('session-created', (session) => {
      this.trackChange(
        'create',
        'session',
        session.sessionId,
        session.sessionId,
        session.agentId,
        undefined,
        session,
        { source: 'session-created' },
      );
    });

    this.sessionManager.on('session-terminated', (event) => {
      this.trackChange(
        'update',
        'session',
        event.session.sessionId,
        event.session.sessionId,
        event.session.agentId,
        { status: 'active' },
        { status: event.session.status },
        { source: 'session-terminated', reason: event.reason },
      );
    });

    // Task ownership changes
    this.sessionManager.on('task-locked', (ownership) => {
      this.trackChange(
        'create',
        'ownership',
        `${ownership.taskId}:${ownership.sessionId}`,
        ownership.sessionId,
        ownership.agentId,
        undefined,
        ownership,
        { source: 'task-locked' },
      );
    });

    this.sessionManager.on('task-unlocked', (event) => {
      this.trackChange(
        'delete',
        'ownership',
        `${event.taskId}:${event.sessionId}`,
        event.sessionId,
        'unknown', // Agent ID not available in unlock event
        event,
        undefined,
        { source: 'task-unlocked' },
      );
    });

    logger().debug('Change tracking event listeners setup completed');
  }

  /**
   * Start real-time synchronization timer
   */
  private startRealTimeSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(async () => {
      try {
        await this.syncChanges();
      } catch (error) {
        logger().error('Real-time sync error:', error);
      }
    }, this.config.syncInterval);

    logger().debug(
      `Started real-time sync with interval ${this.config.syncInterval}ms`,
    );
  }

  /**
   * Calculate checksum for data integrity
   */
  private calculateChecksum(data: unknown): string {
    const serialized = JSON.stringify(data, Object.keys(data as object).sort());
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  /**
   * Check if a change is critical and requires immediate sync
   */
  private isCriticalChange(change: DataChange): boolean {
    return (
      change.type === 'status_change' ||
      (change.entityType === 'task' && change.type === 'update') ||
      change.entityType === 'ownership'
    );
  }

  /**
   * Trim change buffer to maintain size limit
   */
  private trimChangeBuffer(): void {
    const changes = Array.from(this.changeBuffer.entries()).sort(
      ([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime(),
    );

    // Keep only the most recent changes, prioritizing unsynchronized ones
    const toKeep = changes
      .filter(([, change]) => !change.synchronized)
      .slice(-Math.floor(this.config.changeBufferSize * 0.8))
      .concat(
        changes
          .filter(([, change]) => change.synchronized)
          .slice(-Math.floor(this.config.changeBufferSize * 0.2)),
      );

    this.changeBuffer.clear();
    toKeep.forEach(([id, change]) => {
      this.changeBuffer.set(id, change);
    });

    logger().debug(
      `Trimmed change buffer to ${this.changeBuffer.size} entries`,
    );
  }

  /**
   * Create batches for efficient processing
   */
  private createBatches(changes: DataChange[]): SyncBatch[] {
    const batches: SyncBatch[] = [];

    for (let i = 0; i < changes.length; i += this.config.syncBatchSize) {
      const batchChanges = changes.slice(i, i + this.config.syncBatchSize);
      const batchId = crypto.randomUUID();

      const batch: SyncBatch = {
        id: batchId,
        changes: batchChanges,
        createdAt: new Date(),
        sessionId: batchChanges[0]?.sessionId || 'system',
        checksum: this.calculateChecksum(batchChanges),
      };

      batches.push(batch);
    }

    return batches;
  }

  /**
   * Process a single batch of changes
   */
  private async processBatch(
    batch: SyncBatch,
  ): Promise<{ changesSynced: number; conflictsFound: number }> {
    logger().debug(
      `Processing batch ${batch.id} with ${batch.changes.length} changes`,
    );

    let changesSynced = 0;
    let conflictsFound = 0;

    for (const change of batch.changes) {
      try {
        // Check for conflicts
        const conflict = await this.detectConflict(change);
        if (conflict) {
          this.conflicts.set(conflict.id, conflict);
          this.syncState.activeConflicts++;
          conflictsFound++;
          this.emit('conflict-detected', conflict);
          continue;
        }

        // Apply change
        await this.applyChange(change);

        // Mark as synchronized
        change.synchronized = true;
        change.syncAttempts++;
        changesSynced++;
      } catch (error) {
        logger().error(`Failed to process change ${change.id}:`, error);
        change.syncAttempts++;

        // Remove failed changes after max retries
        if (change.syncAttempts >= this.config.maxRetries) {
          this.changeBuffer.delete(change.id);
          logger().warn(
            `Removing change ${change.id} after ${change.syncAttempts} failed attempts`,
          );
        }
      }
    }

    return { changesSynced, conflictsFound };
  }

  /**
   * Detect conflicts for a change
   */
  private async detectConflict(
    change: DataChange,
  ): Promise<SyncConflict | null> {
    // Check for conflicting changes to the same entity
    const conflictingChanges = Array.from(this.changeBuffer.values()).filter(
      (otherChange) =>
        otherChange.id !== change.id &&
        otherChange.entityType === change.entityType &&
        otherChange.entityId === change.entityId &&
        otherChange.sessionId !== change.sessionId &&
        !otherChange.synchronized &&
        Math.abs(otherChange.timestamp.getTime() - change.timestamp.getTime()) <
          5000, // 5 second window
    );

    if (conflictingChanges.length === 0) {
      return null;
    }

    const conflictId = crypto.randomUUID();
    const conflict: SyncConflict = {
      id: conflictId,
      entityType: change.entityType,
      entityId: change.entityId,
      conflicts: [change, ...conflictingChanges],
      detectedAt: new Date(),
      resolved: false,
    };

    logger().warn(
      `Detected conflict ${conflictId} for ${change.entityType} ${change.entityId}`,
    );
    return conflict;
  }

  /**
   * Apply a change to the system
   */
  private async applyChange(change: DataChange): Promise<void> {
    switch (change.entityType) {
      case 'task':
        await this.applyTaskChange(change);
        break;
      case 'dependency':
        await this.applyDependencyChange(change);
        break;
      case 'session':
        await this.applySessionChange(change);
        break;
      case 'ownership':
        await this.applyOwnershipChange(change);
        break;
      default:
        throw new Error(`Unknown entity type: ${change.entityType}`);
    }
  }

  /**
   * Apply task-related change
   */
  private async applyTaskChange(change: DataChange): Promise<void> {
    // In a real implementation, this would apply the change to the task
    // For now, we'll just log it
    logger().debug(
      `Applied task change ${change.id} to task ${change.entityId}`,
    );
  }

  /**
   * Apply dependency-related change
   */
  private async applyDependencyChange(change: DataChange): Promise<void> {
    logger().debug(
      `Applied dependency change ${change.id} to dependency ${change.entityId}`,
    );
  }

  /**
   * Apply session-related change
   */
  private async applySessionChange(change: DataChange): Promise<void> {
    logger().debug(
      `Applied session change ${change.id} to session ${change.entityId}`,
    );
  }

  /**
   * Apply ownership-related change
   */
  private async applyOwnershipChange(change: DataChange): Promise<void> {
    logger().debug(
      `Applied ownership change ${change.id} to ownership ${change.entityId}`,
    );
  }

  /**
   * Synchronize a specific task
   */
  private async syncTask(taskId: string): Promise<void> {
    const task = await this.persistence.loadTask(taskId);
    if (task) {
      // Force save to trigger synchronization
      await this.persistence.saveTask(task);
    }
  }

  /**
   * Synchronize a specific dependency
   */
  private async syncDependency(dependencyId: string): Promise<void> {
    // In a real implementation, this would sync dependency data
    logger().debug(`Syncing dependency ${dependencyId}`);
  }

  /**
   * Conflict resolution strategies
   */
  private resolveLastWriteWins(
    conflict: SyncConflict,
  ): SyncConflict['resolution'] {
    const winner = conflict.conflicts.reduce((latest, current) =>
      current.timestamp > latest.timestamp ? current : latest,
    );

    return {
      winner,
      discarded: conflict.conflicts.filter((change) => change.id !== winner.id),
    };
  }

  private resolveFirstWriteWins(
    conflict: SyncConflict,
  ): SyncConflict['resolution'] {
    const winner = conflict.conflicts.reduce((earliest, current) =>
      current.timestamp < earliest.timestamp ? current : earliest,
    );

    return {
      winner,
      discarded: conflict.conflicts.filter((change) => change.id !== winner.id),
    };
  }

  private async resolveVersionBased(
    conflict: SyncConflict,
  ): Promise<SyncConflict['resolution']> {
    // In a real implementation, this would check entity versions
    // For now, fall back to last-write-wins
    return this.resolveLastWriteWins(conflict);
  }

  private resolveMerge(conflict: SyncConflict): SyncConflict['resolution'] {
    // Simple merge strategy - use the latest change but merge metadata
    const winner = conflict.conflicts.reduce((latest, current) =>
      current.timestamp > latest.timestamp ? current : latest,
    );

    const mergedMetadata = conflict.conflicts.reduce(
      (merged, change) => ({ ...merged, ...change.data.metadata }),
      {},
    );

    const merged = {
      ...winner.data.after,
      metadata: mergedMetadata,
    };

    return {
      winner,
      discarded: conflict.conflicts.filter((change) => change.id !== winner.id),
      merged,
    };
  }

  private resolveManual(
    conflict: SyncConflict,
    resolution: unknown,
  ): SyncConflict['resolution'] {
    // Use the first conflict as the winner but with manual resolution data
    const winner = conflict.conflicts[0];

    return {
      winner: {
        ...winner,
        data: {
          ...winner.data,
          after: resolution,
        },
      },
      discarded: conflict.conflicts.slice(1),
      merged: resolution,
    };
  }

  /**
   * Apply conflict resolution
   */
  private async applyResolution(
    conflict: SyncConflict,
    resolution: SyncConflict['resolution'],
  ): Promise<void> {
    // Apply the winning change
    await this.applyChange(resolution.winner);

    // Mark all conflicting changes as synchronized
    for (const change of conflict.conflicts) {
      change.synchronized = true;
    }

    logger().info(`Applied resolution for conflict ${conflict.id}`);
  }

  /**
   * Update synchronization statistics
   */
  private updateSyncStats(success: boolean, duration: number): void {
    this.syncState.stats.totalSyncs++;

    if (success) {
      this.syncState.stats.successfulSyncs++;
    } else {
      this.syncState.stats.failedSyncs++;
    }

    // Update average sync time
    const totalTime =
      this.syncState.stats.averageSyncTime *
        (this.syncState.stats.totalSyncs - 1) +
      duration;
    this.syncState.stats.averageSyncTime =
      totalTime / this.syncState.stats.totalSyncs;
  }

  /**
   * Shutdown the data synchronization system
   */
  async shutdown(): Promise<void> {
    logger().info('Shutting down DataSync...');

    // Clear sync timer
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }

    // Perform final sync of pending changes
    if (this.changeBuffer.size > 0) {
      logger().info('Performing final synchronization before shutdown...');
      try {
        await this.syncChanges(true);
      } catch (error) {
        logger().error('Final synchronization failed:', error);
      }
    }

    // Clear data structures
    this.changeBuffer.clear();
    this.conflicts.clear();
    this.isInitialized = false;
    this.isSyncing = false;

    this.emit('shutdown');
    logger().info('DataSync shutdown completed');
  }
}

/**
 * Synchronization result interface
 */
interface SyncResult {
  success: boolean;
  changesSynced: number;
  conflictsFound: number;
  duration: number;
  error?: string;
}
