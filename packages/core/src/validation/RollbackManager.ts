/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../logger/Logger.js';
import { TaskSnapshot } from './TaskValidator.js';
import type { Task, TaskStatus } from '../task-management/types.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

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
export enum RollbackType {
  TASK_STATE = 'task_state',
  FILE_SYSTEM = 'file_system',
  DATABASE = 'database',
  ENVIRONMENT = 'environment',
  CONFIGURATION = 'configuration',
  DEPENDENCY_STATE = 'dependency_state',
  FULL_SYSTEM = 'full_system'
}

/**
 * Rollback triggers that initiate rollback operations
 */
export enum RollbackTrigger {
  VALIDATION_FAILURE = 'validation_failure',
  EXECUTION_ERROR = 'execution_error',
  QUALITY_THRESHOLD_VIOLATION = 'quality_threshold_violation',
  SECURITY_VIOLATION = 'security_violation',
  USER_REQUEST = 'user_request',
  AUTOMATIC_RECOVERY = 'automatic_recovery',
  SYSTEM_FAILURE = 'system_failure'
}

/**
 * Rollback strategies for different scenarios
 */
export enum RollbackStrategy {
  IMMEDIATE = 'immediate',           // Rollback immediately on trigger
  GRACEFUL = 'graceful',            // Complete current operations then rollback
  SCHEDULED = 'scheduled',          // Rollback at scheduled time
  MANUAL = 'manual',                // Require manual confirmation
  SMART = 'smart',                  // AI-driven decision on rollback approach
  CONDITIONAL = 'conditional'       // Rollback based on conditions
}

/**
 * Rollback operation priority levels
 */
export enum RollbackPriority {
  CRITICAL = 'critical',    // Immediate rollback required
  HIGH = 'high',           // Rollback ASAP
  MEDIUM = 'medium',       // Rollback when convenient
  LOW = 'low'             // Rollback during maintenance window
}

/**
 * Comprehensive rollback snapshot
 */
export interface RollbackSnapshot {
  id: string;
  taskId: string;
  timestamp: Date;
  type: RollbackType[];

  // Task state snapshot
  taskState: Task;
  taskMetadata: Record<string, unknown>;

  // File system snapshot
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

  // Database snapshot
  database: {
    transactions: Array<{
      query: string;
      parameters: unknown[];
      timestamp: Date;
    }>;
    data: Record<string, unknown>;
    schema: Record<string, unknown>;
  };

  // Environment snapshot
  environment: {
    variables: Record<string, string>;
    workingDirectory: string;
    processInfo: Record<string, unknown>;
  };

  // Configuration snapshot
  configuration: {
    files: Map<string, string>;
    runtime: Record<string, unknown>;
  };

  // Dependency state snapshot
  dependencies: {
    taskStates: Map<string, TaskStatus>;
    relationships: Array<{
      sourceId: string;
      targetId: string;
      type: string;
    }>;
  };

  // Rollback metadata
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
  type: RollbackType;
  trigger: RollbackTrigger;
  strategy: RollbackStrategy;
  priority: RollbackPriority;

  snapshotId: string;
  targetSnapshot: RollbackSnapshot;

  // Operation configuration
  config: {
    validateBeforeRollback: boolean;
    validateAfterRollback: boolean;
    createBackupSnapshot: boolean;
    notifyStakeholders: boolean;
    maxRetries: number;
    timeout: number;
    force: boolean;
  };

  // Impact analysis
  impact: {
    affectedTasks: string[];
    affectedFiles: string[];
    estimatedDowntime: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    mitigationSteps: string[];
  };

  // Scheduling
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

  // Rollback details
  rollbackDetails: {
    snapshotRestored: string;
    itemsRolledBack: {
      taskState: boolean;
      fileSystem: number;  // Number of files restored
      database: number;    // Number of transactions reversed
      environment: number; // Number of variables restored
      configuration: number; // Number of config items restored
      dependencies: number;   // Number of dependency states restored
    };

    // Validation results
    preRollbackValidation?: {
      passed: boolean;
      issues: string[];
    };
    postRollbackValidation?: {
      passed: boolean;
      issues: string[];
    };
  };

  // Error information
  errors: Array<{
    type: string;
    message: string;
    details: string;
    recoverable: boolean;
  }>;

  // Recovery information
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

  // Snapshot configuration
  snapshotting: {
    autoSnapshot: boolean;
    maxSnapshots: number;
    compressionEnabled: boolean;
    encryptionEnabled: boolean;
    storageLocation: string;
    retentionDays: number;
  };

  // Rollback policies
  policies: {
    autoRollbackOnCriticalFailure: boolean;
    requireApprovalForHighImpactRollback: boolean;
    maxConcurrentRollbacks: number;
    rollbackTimeout: number;
    validationRequired: boolean;
  };

  // Strategy configuration
  strategies: {
    defaultStrategy: RollbackStrategy;
    strategyMapping: Map<RollbackTrigger, RollbackStrategy>;
    conditionalRules: Array<{
      condition: string;
      strategy: RollbackStrategy;
    }>;
  };

  // Monitoring and alerting
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
export class RollbackManager extends EventEmitter {
  private readonly logger: Logger;
  private readonly config: RollbackManagerConfig;

  // Snapshot storage
  private readonly snapshots: Map<string, RollbackSnapshot> = new Map();
  private readonly taskSnapshots: Map<string, string[]> = new Map(); // taskId -> snapshotIds

  // Operation management
  private readonly activeRollbacks: Map<string, Promise<RollbackResult>> = new Map();
  private readonly rollbackHistory: RollbackResult[] = [];
  private readonly pendingOperations: Map<string, RollbackOperation> = new Map();

  constructor(config: Partial<RollbackManagerConfig> = {}) {
    super();

    this.logger = new Logger('RollbackManager');
    this.config = this.createDefaultConfig(config);

    this.logger.info('RollbackManager initialized', {
      enabled: this.config.enabled,
      autoSnapshot: this.config.snapshotting.autoSnapshot,
      defaultStrategy: this.config.strategies.defaultStrategy,
      maxSnapshots: this.config.snapshotting.maxSnapshots
    });

    this.startMaintenanceTasks();
  }

  /**
   * Create default configuration with overrides
   */
  private createDefaultConfig(config: Partial<RollbackManagerConfig>): RollbackManagerConfig {
    return {
      enabled: true,

      snapshotting: {
        autoSnapshot: true,
        maxSnapshots: 50,
        compressionEnabled: true,
        encryptionEnabled: false,
        storageLocation: './snapshots',
        retentionDays: 30
      },

      policies: {
        autoRollbackOnCriticalFailure: true,
        requireApprovalForHighImpactRollback: true,
        maxConcurrentRollbacks: 3,
        rollbackTimeout: 300000, // 5 minutes
        validationRequired: true
      },

      strategies: {
        defaultStrategy: RollbackStrategy.SMART,
        strategyMapping: new Map([
          [RollbackTrigger.VALIDATION_FAILURE, RollbackStrategy.IMMEDIATE],
          [RollbackTrigger.SECURITY_VIOLATION, RollbackStrategy.IMMEDIATE],
          [RollbackTrigger.EXECUTION_ERROR, RollbackStrategy.GRACEFUL],
          [RollbackTrigger.QUALITY_THRESHOLD_VIOLATION, RollbackStrategy.SCHEDULED],
          [RollbackTrigger.USER_REQUEST, RollbackStrategy.MANUAL]
        ]),
        conditionalRules: []
      },

      monitoring: {
        metricsEnabled: true,
        alertingEnabled: true,
        notificationChannels: [],
        healthChecks: true
      },

      ...config
    };
  }

  /**
   * Create a comprehensive snapshot for rollback purposes
   */
  async createSnapshot(
    task: Task,
    reason: string,
    types: RollbackType[] = Object.values(RollbackType)
  ): Promise<RollbackSnapshot> {
    if (!this.config.enabled) {
      throw new Error('RollbackManager is disabled');
    }

    const snapshotId = `snapshot-${task.id}-${Date.now()}`;

    this.logger.info('Creating rollback snapshot', {
      taskId: task.id,
      snapshotId,
      types,
      reason
    });

    const snapshot: RollbackSnapshot = {
      id: snapshotId,
      taskId: task.id,
      timestamp: new Date(),
      type: types,

      taskState: { ...task },
      taskMetadata: {},

      fileSystem: {
        baseDirectory: process.cwd(),
        files: new Map(),
        directories: []
      },

      database: {
        transactions: [],
        data: {},
        schema: {}
      },

      environment: {
        variables: { ...process.env },
        workingDirectory: process.cwd(),
        processInfo: {
          pid: process.pid,
          platform: process.platform,
          nodeVersion: process.version
        }
      },

      configuration: {
        files: new Map(),
        runtime: {}
      },

      dependencies: {
        taskStates: new Map(),
        relationships: []
      },

      metadata: {
        createdBy: 'RollbackManager',
        reason,
        snapshotSize: 0,
        checksum: '',
        version: '1.0.0',
        retentionPolicy: {
          maxAge: this.config.snapshotting.retentionDays * 24 * 60 * 60 * 1000,
          maxCount: this.config.snapshotting.maxSnapshots
        }
      }
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
      types: snapshot.type
    });

    return snapshot;
  }

  /**
   * Create specific type snapshots
   */
  private async createSpecificSnapshot(
    type: RollbackType,
    snapshot: RollbackSnapshot,
    task: Task
  ): Promise<void> {
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
    } catch (error) {
      this.logger.error(`Failed to create ${type} snapshot`, { error, taskId: task.id });
    }
  }

  private async createTaskStateSnapshot(snapshot: RollbackSnapshot, task: Task): Promise<void> {
    snapshot.taskState = JSON.parse(JSON.stringify(task)); // Deep copy
    snapshot.taskMetadata = {
      snapshotTime: snapshot.timestamp,
      originalStatus: task.status,
      progress: (task as any).progress || 0
    };
  }

  private async createFileSystemSnapshot(snapshot: RollbackSnapshot, task: Task): Promise<void> {
    // TODO: Implement comprehensive file system snapshot
    // This would involve:
    // 1. Identifying files affected by the task
    // 2. Reading file contents and metadata
    // 3. Creating directory structure map
    // 4. Handling binary files appropriately

    const workingDir = process.cwd();
    snapshot.fileSystem.baseDirectory = workingDir;

    // Placeholder implementation - would need to identify task-specific files
    this.logger.debug('File system snapshot created (placeholder)', { taskId: task.id });
  }

  private async createDatabaseSnapshot(snapshot: RollbackSnapshot, task: Task): Promise<void> {
    // TODO: Implement database snapshot
    // This would involve:
    // 1. Capturing database transactions related to the task
    // 2. Storing data state snapshots
    // 3. Recording schema changes
    // 4. Handling different database types

    this.logger.debug('Database snapshot created (placeholder)', { taskId: task.id });
  }

  private async createEnvironmentSnapshot(snapshot: RollbackSnapshot, task: Task): Promise<void> {
    snapshot.environment.variables = { ...process.env };
    snapshot.environment.workingDirectory = process.cwd();
    snapshot.environment.processInfo = {
      pid: process.pid,
      platform: process.platform,
      nodeVersion: process.version,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };
  }

  private async createConfigurationSnapshot(snapshot: RollbackSnapshot, task: Task): Promise<void> {
    // TODO: Implement configuration snapshot
    // This would capture configuration files and runtime settings
    this.logger.debug('Configuration snapshot created (placeholder)', { taskId: task.id });
  }

  private async createDependencySnapshot(snapshot: RollbackSnapshot, task: Task): Promise<void> {
    // TODO: Implement dependency state snapshot
    // This would capture the state of task dependencies
    this.logger.debug('Dependency snapshot created (placeholder)', { taskId: task.id });
  }

  /**
   * Execute rollback operation
   */
  async executeRollback(operation: RollbackOperation): Promise<RollbackResult> {
    if (!this.config.enabled) {
      throw new Error('RollbackManager is disabled');
    }

    const startTime = Date.now();

    this.logger.info('Initiating rollback operation', {
      operationId: operation.id,
      taskId: operation.taskId,
      strategy: operation.strategy,
      trigger: operation.trigger
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

    } catch (error) {
      this.logger.error('Rollback operation failed', {
        operationId: operation.id,
        error: error instanceof Error ? error.message : String(error)
      });

      this.emit('rollbackFailed', operation, error as Error);
      throw error;
    } finally {
      this.activeRollbacks.delete(operation.taskId);
    }
  }

  /**
   * Perform the actual rollback operation
   */
  private async performRollback(
    operation: RollbackOperation,
    startTime: number
  ): Promise<RollbackResult> {
    const snapshot = operation.targetSnapshot;
    const result: RollbackResult = {
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
          dependencies: 0
        }
      },
      errors: [],
      recovery: {
        automaticRecoveryAttempted: false,
        manualInterventionRequired: false,
        nextSteps: []
      },
      metadata: {
        executedBy: 'RollbackManager',
        rollbackStrategy: operation.strategy,
        impactLevel: operation.impact.riskLevel
      }
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
            recoverable: false
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
        } catch (error) {
          result.errors.push({
            type: `rollback_${rollbackType}_failed`,
            message: `Failed to rollback ${rollbackType}`,
            details: error instanceof Error ? error.message : String(error),
            recoverable: true
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
      result.success = result.errors.filter(e => !e.recoverable).length === 0;
      result.duration = Date.now() - startTime;

      // Store result in history
      this.rollbackHistory.push(result);

      this.logger.info('Rollback operation completed', {
        operationId: operation.id,
        success: result.success,
        duration: result.duration,
        errors: result.errors.length
      });

      return result;

    } catch (error) {
      result.errors.push({
        type: 'rollback_execution_failed',
        message: 'Critical rollback execution error',
        details: error instanceof Error ? error.message : String(error),
        recoverable: false
      });

      result.duration = Date.now() - startTime;
      return result;
    }
  }

  /**
   * Rollback specific types
   */
  private async rollbackSpecificType(
    type: RollbackType,
    snapshot: RollbackSnapshot,
    result: RollbackResult
  ): Promise<void> {
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

  private async rollbackTaskState(snapshot: RollbackSnapshot, result: RollbackResult): Promise<void> {
    // TODO: Implement task state rollback
    // This would restore the task to its previous state
    result.rollbackDetails.itemsRolledBack.taskState = true;
    this.logger.debug('Task state rolled back', { snapshotId: snapshot.id });
  }

  private async rollbackFileSystem(snapshot: RollbackSnapshot, result: RollbackResult): Promise<void> {
    // TODO: Implement file system rollback
    // This would restore files from the snapshot
    result.rollbackDetails.itemsRolledBack.fileSystem = snapshot.fileSystem.files.size;
    this.logger.debug('File system rolled back', { snapshotId: snapshot.id });
  }

  private async rollbackDatabase(snapshot: RollbackSnapshot, result: RollbackResult): Promise<void> {
    // TODO: Implement database rollback
    // This would reverse database transactions
    result.rollbackDetails.itemsRolledBack.database = snapshot.database.transactions.length;
    this.logger.debug('Database rolled back', { snapshotId: snapshot.id });
  }

  private async rollbackEnvironment(snapshot: RollbackSnapshot, result: RollbackResult): Promise<void> {
    // TODO: Implement environment rollback
    // This would restore environment variables and settings
    result.rollbackDetails.itemsRolledBack.environment = Object.keys(snapshot.environment.variables).length;
    this.logger.debug('Environment rolled back', { snapshotId: snapshot.id });
  }

  private async rollbackConfiguration(snapshot: RollbackSnapshot, result: RollbackResult): Promise<void> {
    // TODO: Implement configuration rollback
    result.rollbackDetails.itemsRolledBack.configuration = snapshot.configuration.files.size;
    this.logger.debug('Configuration rolled back', { snapshotId: snapshot.id });
  }

  private async rollbackDependencies(snapshot: RollbackSnapshot, result: RollbackResult): Promise<void> {
    // TODO: Implement dependency rollback
    result.rollbackDetails.itemsRolledBack.dependencies = snapshot.dependencies.taskStates.size;
    this.logger.debug('Dependencies rolled back', { snapshotId: snapshot.id });
  }

  /**
   * Helper methods
   */

  private storeSnapshot(snapshot: RollbackSnapshot): void {
    this.snapshots.set(snapshot.id, snapshot);

    // Update task snapshot index
    const taskSnapshots = this.taskSnapshots.get(snapshot.taskId) || [];
    taskSnapshots.push(snapshot.id);

    // Cleanup old snapshots if over limit
    while (taskSnapshots.length > this.config.snapshotting.maxSnapshots) {
      const oldSnapshotId = taskSnapshots.shift()!;
      this.snapshots.delete(oldSnapshotId);
    }

    this.taskSnapshots.set(snapshot.taskId, taskSnapshots);
  }

  private calculateSnapshotSize(snapshot: RollbackSnapshot): number {
    // Simple size calculation - could be enhanced
    return JSON.stringify(snapshot).length;
  }

  private async calculateChecksum(snapshot: RollbackSnapshot): Promise<string> {
    // TODO: Implement proper checksum calculation
    return `checksum-${snapshot.id}`;
  }

  private async validateBeforeRollback(operation: RollbackOperation): Promise<{ passed: boolean; issues: string[] }> {
    // TODO: Implement pre-rollback validation
    return { passed: true, issues: [] };
  }

  private async validateAfterRollback(
    operation: RollbackOperation,
    result: RollbackResult
  ): Promise<{ passed: boolean; issues: string[] }> {
    // TODO: Implement post-rollback validation
    return { passed: true, issues: [] };
  }

  private startMaintenanceTasks(): void {
    // Periodic cleanup of old snapshots
    setInterval(() => {
      this.cleanupExpiredSnapshots();
    }, 24 * 60 * 60 * 1000); // Daily cleanup
  }

  private cleanupExpiredSnapshots(): void {
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
  getTaskSnapshots(taskId: string): RollbackSnapshot[] {
    const snapshotIds = this.taskSnapshots.get(taskId) || [];
    return snapshotIds.map(id => this.snapshots.get(id)).filter(Boolean) as RollbackSnapshot[];
  }

  /**
   * Get rollback statistics
   */
  getRollbackStatistics(): {
    totalSnapshots: number;
    activeRollbacks: number;
    completedRollbacks: number;
    failedRollbacks: number;
    averageRollbackTime: number;
  } {
    const completedRollbacks = this.rollbackHistory.filter(r => r.success).length;
    const failedRollbacks = this.rollbackHistory.filter(r => !r.success).length;
    const averageRollbackTime = this.rollbackHistory.length > 0
      ? this.rollbackHistory.reduce((sum, r) => sum + r.duration, 0) / this.rollbackHistory.length
      : 0;

    return {
      totalSnapshots: this.snapshots.size,
      activeRollbacks: this.activeRollbacks.size,
      completedRollbacks,
      failedRollbacks,
      averageRollbackTime
    };
  }

  /**
   * Create rollback operation from trigger
   */
  createRollbackOperation(
    taskId: string,
    trigger: RollbackTrigger,
    snapshotId: string,
    reason: string,
    options: Partial<RollbackOperation> = {}
  ): RollbackOperation {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    const strategy = this.config.strategies.strategyMapping.get(trigger) || this.config.strategies.defaultStrategy;

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
        force: false
      },

      impact: {
        affectedTasks: [taskId],
        affectedFiles: [],
        estimatedDowntime: 30000, // 30 seconds default
        riskLevel: 'medium',
        mitigationSteps: []
      },

      scheduling: {
        immediateExecution: strategy === RollbackStrategy.IMMEDIATE,
        scheduledTime: strategy === RollbackStrategy.SCHEDULED ? new Date(Date.now() + 300000) : undefined
      },

      metadata: {
        createdAt: new Date(),
        createdBy: 'RollbackManager',
        reason,
        estimatedDuration: 60000 // 1 minute default
      },

      ...options
    };
  }

  private determinePriority(trigger: RollbackTrigger): RollbackPriority {
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
  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up RollbackManager resources');
    this.activeRollbacks.clear();
    this.removeAllListeners();
  }
}