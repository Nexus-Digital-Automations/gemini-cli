/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Historical data migration type definitions
 * Provides schema evolution and data transformation capabilities
 *
 * @author Historical Data Storage and Analysis Agent
 * @version 1.0.0
 */

import type { BudgetUsageTimeSeriesPoint } from '../storage/types.js';

/**
 * Schema version identifier
 */
export type SchemaVersion = string; // e.g., '1.0.0', '1.1.0', '2.0.0'

/**
 * Migration direction
 */
export type MigrationDirection = 'up' | 'down';

/**
 * Migration operation types
 */
export type MigrationOperation =
  | 'add_field'
  | 'remove_field'
  | 'rename_field'
  | 'change_type'
  | 'transform_data'
  | 'restructure'
  | 'custom';

/**
 * Migration execution status
 */
export type MigrationStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'rolled_back'
  | 'partial';

/**
 * Data transformation function type
 */
export type DataTransformer<TFrom = unknown, TTo = unknown> = (data: TFrom) => TTo | Promise<TTo>;

/**
 * Migration step definition
 */
export interface MigrationStep {
  /** Step identifier */
  id: string;

  /** Step description */
  description: string;

  /** Operation type */
  operation: MigrationOperation;

  /** Forward transformation */
  up: DataTransformer;

  /** Reverse transformation (for rollback) */
  down: DataTransformer;

  /** Validation function to verify transformation */
  validate?: (originalData: unknown, transformedData: unknown) => boolean | Promise<boolean>;

  /** Whether this step is reversible */
  reversible: boolean;

  /** Step dependencies (must run after these steps) */
  dependencies?: string[];

  /** Estimated processing time (for progress tracking) */
  estimatedDuration?: number;
}

/**
 * Schema migration definition
 */
export interface SchemaMigration {
  /** Migration identifier */
  id: string;

  /** Migration name */
  name: string;

  /** Description of changes */
  description: string;

  /** Source schema version */
  fromVersion: SchemaVersion;

  /** Target schema version */
  toVersion: SchemaVersion;

  /** Migration steps */
  steps: MigrationStep[];

  /** Migration metadata */
  metadata: {
    author: string;
    createdAt: number;
    category: 'schema' | 'data' | 'performance' | 'feature';
    breaking: boolean;
    experimental: boolean;
  };

  /** Pre-migration validation */
  preValidation?: DataTransformer<any, boolean>;

  /** Post-migration validation */
  postValidation?: DataTransformer<any, boolean>;

  /** Custom rollback logic (if steps aren't sufficient) */
  customRollback?: DataTransformer;
}

/**
 * Migration execution context
 */
export interface MigrationContext {
  /** Migration being executed */
  migration: SchemaMigration;

  /** Execution direction */
  direction: MigrationDirection;

  /** Batch size for processing */
  batchSize: number;

  /** Current batch being processed */
  currentBatch: number;

  /** Total batches to process */
  totalBatches: number;

  /** Execution start time */
  startTime: number;

  /** Data source configuration */
  dataSource: {
    type: 'file' | 'database' | 'memory';
    config: Record<string, any>;
  };

  /** Backup configuration */
  backup: {
    enabled: boolean;
    location?: string;
    retentionDays?: number;
  };

  /** Progress tracking */
  progress: {
    totalRecords: number;
    processedRecords: number;
    failedRecords: number;
    currentStep: number;
    totalSteps: number;
  };
}

/**
 * Migration execution result
 */
export interface MigrationResult {
  /** Migration ID */
  migrationId: string;

  /** Execution status */
  status: MigrationStatus;

  /** Execution direction */
  direction: MigrationDirection;

  /** Source version */
  fromVersion: SchemaVersion;

  /** Target version */
  toVersion: SchemaVersion;

  /** Execution timestamps */
  timing: {
    startTime: number;
    endTime: number;
    duration: number;
  };

  /** Processing statistics */
  statistics: {
    totalRecords: number;
    processedRecords: number;
    failedRecords: number;
    skippedRecords: number;
    batchesProcessed: number;
  };

  /** Step execution results */
  stepResults: Array<{
    stepId: string;
    status: 'completed' | 'failed' | 'skipped';
    duration: number;
    recordsProcessed: number;
    error?: string;
  }>;

  /** Backup information */
  backup?: {
    location: string;
    size: number;
    checksum: string;
    created: number;
  };

  /** Error information if failed */
  error?: {
    message: string;
    code: string;
    step?: string;
    batch?: number;
    record?: number;
    details: Record<string, any>;
  };

  /** Rollback information if applicable */
  rollback?: {
    performed: boolean;
    reason: string;
    timestamp: number;
    originalData?: unknown;
  };
}

/**
 * Schema version information
 */
export interface SchemaVersionInfo {
  /** Version identifier */
  version: SchemaVersion;

  /** Version description */
  description: string;

  /** Schema definition */
  schema: {
    fields: Record<string, {
      type: string;
      required: boolean;
      description: string;
      default?: unknown;
      validation?: unknown;
    }>;
    indexes: Array<{
      name: string;
      fields: string[];
      unique: boolean;
    }>;
    constraints: Array<{
      name: string;
      type: string;
      definition: string;
    }>;
  };

  /** Version metadata */
  metadata: {
    createdAt: number;
    deprecated?: boolean;
    deprecationReason?: string;
    supportedUntil?: number;
  };

  /** Compatible versions */
  compatibility: {
    backward: SchemaVersion[];
    forward: SchemaVersion[];
  };
}

/**
 * Migration registry for tracking applied migrations
 */
export interface MigrationRegistry {
  /** Current schema version */
  currentVersion: SchemaVersion;

  /** Applied migrations history */
  appliedMigrations: Array<{
    migrationId: string;
    version: SchemaVersion;
    appliedAt: number;
    appliedBy: string;
    executionTime: number;
    checksum: string;
  }>;

  /** Available schema versions */
  availableVersions: SchemaVersion[];

  /** Registry metadata */
  metadata: {
    lastUpdated: number;
    dataLocation: string;
    backupLocation?: string;
  };
}

/**
 * Migration engine interface
 */
export interface MigrationEngine {
  /**
   * Get current schema version
   */
  getCurrentVersion(): Promise<SchemaVersion>;

  /**
   * Get available migrations
   */
  getAvailableMigrations(): Promise<SchemaMigration[]>;

  /**
   * Get migration path between versions
   */
  getMigrationPath(
    fromVersion: SchemaVersion,
    toVersion: SchemaVersion
  ): Promise<SchemaMigration[]>;

  /**
   * Execute migration
   */
  executeMigration(
    migrationId: string,
    direction: MigrationDirection,
    options?: {
      batchSize?: number;
      backup?: boolean;
      dryRun?: boolean;
      continueOnError?: boolean;
    }
  ): Promise<MigrationResult>;

  /**
   * Execute multiple migrations in sequence
   */
  executeMigrationPath(
    migrations: SchemaMigration[],
    direction: MigrationDirection,
    options?: {
      batchSize?: number;
      backup?: boolean;
      stopOnError?: boolean;
    }
  ): Promise<MigrationResult[]>;

  /**
   * Migrate to specific version
   */
  migrateToVersion(
    targetVersion: SchemaVersion,
    options?: {
      batchSize?: number;
      backup?: boolean;
      dryRun?: boolean;
    }
  ): Promise<MigrationResult[]>;

  /**
   * Rollback migration
   */
  rollbackMigration(
    migrationId: string,
    options?: {
      batchSize?: number;
      backup?: boolean;
    }
  ): Promise<MigrationResult>;

  /**
   * Validate data against schema version
   */
  validateData(
    data: unknown[],
    version: SchemaVersion
  ): Promise<{
    valid: boolean;
    errors: Array<{
      record: number;
      field: string;
      error: string;
      value: unknown;
    }>;
  }>;

  /**
   * Create backup of current data
   */
  createBackup(location?: string): Promise<{
    location: string;
    size: number;
    checksum: string;
    created: number;
  }>;

  /**
   * Restore from backup
   */
  restoreFromBackup(backupLocation: string): Promise<{
    recordsRestored: number;
    version: SchemaVersion;
    restored: number;
  }>;

  /**
   * Get migration registry
   */
  getRegistry(): Promise<MigrationRegistry>;

  /**
   * Register new migration
   */
  registerMigration(migration: SchemaMigration): Promise<void>;
}

/**
 * Migration scheduler for automated migrations
 */
export interface MigrationScheduler {
  /**
   * Schedule migration execution
   */
  scheduleMigration(
    migrationId: string,
    scheduledTime: number,
    options?: {
      recurring?: boolean;
      interval?: number;
      maxRetries?: number;
    }
  ): Promise<string>;

  /**
   * Cancel scheduled migration
   */
  cancelMigration(scheduleId: string): Promise<boolean>;

  /**
   * Get scheduled migrations
   */
  getScheduledMigrations(): Promise<Array<{
    scheduleId: string;
    migrationId: string;
    scheduledTime: number;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    retryCount?: number;
    lastError?: string;
  }>>;

  /**
   * Execute pending migrations
   */
  executePendingMigrations(): Promise<void>;
}

/**
 * Data compatibility checker
 */
export interface CompatibilityChecker {
  /**
   * Check compatibility between schema versions
   */
  checkVersionCompatibility(
    fromVersion: SchemaVersion,
    toVersion: SchemaVersion
  ): Promise<{
    compatible: boolean;
    issues: Array<{
      type: 'breaking' | 'warning' | 'info';
      message: string;
      field?: string;
      impact: 'high' | 'medium' | 'low';
    }>;
    recommendations: string[];
  }>;

  /**
   * Analyze data for migration readiness
   */
  analyzeDataReadiness(
    data: unknown[],
    targetVersion: SchemaVersion
  ): Promise<{
    ready: boolean;
    statistics: {
      totalRecords: number;
      compatibleRecords: number;
      issueCount: number;
    };
    issues: Array<{
      record: number;
      field: string;
      issue: string;
      severity: 'error' | 'warning';
      suggestion?: string;
    }>;
  }>;

  /**
   * Generate data transformation preview
   */
  previewTransformation(
    sampleData: unknown[],
    migration: SchemaMigration
  ): Promise<{
    originalSample: unknown[];
    transformedSample: unknown[];
    transformationSummary: {
      fieldsAdded: string[];
      fieldsRemoved: string[];
      fieldsModified: Array<{
        field: string;
        change: string;
      }>;
    };
  }>;
}

/**
 * Migration event types for monitoring
 */
export type MigrationEventType =
  | 'migration_started'
  | 'migration_completed'
  | 'migration_failed'
  | 'migration_rolled_back'
  | 'step_started'
  | 'step_completed'
  | 'step_failed'
  | 'batch_processed'
  | 'backup_created'
  | 'validation_completed';

/**
 * Migration event data
 */
export interface MigrationEvent {
  /** Event type */
  type: MigrationEventType;

  /** Event timestamp */
  timestamp: number;

  /** Migration context */
  migrationId: string;

  /** Step ID if applicable */
  stepId?: string;

  /** Event data */
  data: Record<string, any>;

  /** Event severity */
  severity: 'info' | 'warning' | 'error';

  /** Event message */
  message: string;
}

/**
 * Migration event listener
 */
export type MigrationEventListener = (event: MigrationEvent) => void | Promise<void>;

/**
 * Factory function types
 */
export type CreateMigrationEngine = (config: {
  dataSource: {
    type: 'file' | 'database' | 'memory';
    config: Record<string, any>;
  };
  migrationsPath: string;
  registryLocation: string;
  defaultBatchSize?: number;
}) => MigrationEngine;

export type CreateMigrationScheduler = (
  migrationEngine: MigrationEngine,
  options?: {
    checkInterval?: number;
    maxConcurrentMigrations?: number;
  }
) => MigrationScheduler;