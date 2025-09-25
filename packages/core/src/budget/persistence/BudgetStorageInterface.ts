/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Budget storage interface and abstractions
 * Defines the contract for budget data persistence with multiple storage backends
 *
 * @author Claude Code - Budget Core Infrastructure Agent
 * @version 1.0.0
 */

import type { BudgetSettings, BudgetUsageData } from '../types.js';

/**
 * Storage operation result
 */
export interface StorageOperationResult<T = void> {
  /** Whether the operation succeeded */
  success: boolean;
  /** Result data (if applicable) */
  data?: T;
  /** Error message (if failed) */
  error?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Storage health check result
 */
export interface StorageHealthCheck {
  /** Overall health status */
  healthy: boolean;
  /** Storage type identifier */
  storageType: string;
  /** Last successful operation timestamp */
  lastOperation?: Date;
  /** Health check details */
  details: Record<string, any>;
  /** Performance metrics */
  metrics?: {
    averageReadTime?: number;
    averageWriteTime?: number;
    errorRate?: number;
    totalOperations?: number;
  };
}

/**
 * Storage configuration options
 */
export interface StorageConfig {
  /** Storage type */
  type: 'file' | 'memory' | 'database' | 'cloud';
  /** Storage-specific options */
  options: Record<string, any>;
  /** Encryption settings */
  encryption?: {
    enabled: boolean;
    algorithm?: string;
    keyId?: string;
  };
  /** Backup configuration */
  backup?: {
    enabled: boolean;
    frequency?: string;
    retentionDays?: number;
  };
  /** Performance settings */
  performance?: {
    cacheEnabled?: boolean;
    maxCacheSize?: number;
    compressionEnabled?: boolean;
  };
}

/**
 * Abstract storage interface for budget data
 */
export interface BudgetStorage {
  /**
   * Initialize the storage system
   * @returns Promise resolving to operation result
   */
  initialize(): Promise<StorageOperationResult>;

  /**
   * Check if storage system is available and healthy
   * @returns Promise resolving to health check result
   */
  healthCheck(): Promise<StorageHealthCheck>;

  /**
   * Read current usage data
   * @returns Promise resolving to usage data
   */
  readUsageData(): Promise<StorageOperationResult<BudgetUsageData>>;

  /**
   * Write usage data with atomic operation
   * @param data - Usage data to save
   * @returns Promise resolving to operation result
   */
  writeUsageData(data: BudgetUsageData): Promise<StorageOperationResult>;

  /**
   * Read budget settings
   * @returns Promise resolving to settings
   */
  readSettings(): Promise<StorageOperationResult<BudgetSettings>>;

  /**
   * Write budget settings with validation
   * @param settings - Settings to save
   * @returns Promise resolving to operation result
   */
  writeSettings(settings: BudgetSettings): Promise<StorageOperationResult>;

  /**
   * Clear all budget data (with confirmation)
   * @param confirmationToken - Security token to confirm destructive operation
   * @returns Promise resolving to operation result
   */
  clearAllData(confirmationToken: string): Promise<StorageOperationResult>;

  /**
   * Create backup of current data
   * @returns Promise resolving to backup location/identifier
   */
  createBackup(): Promise<StorageOperationResult<string>>;

  /**
   * Restore data from backup
   * @param backupId - Backup identifier
   * @returns Promise resolving to operation result
   */
  restoreFromBackup(backupId: string): Promise<StorageOperationResult>;

  /**
   * Get storage statistics and metrics
   * @returns Promise resolving to storage metrics
   */
  getMetrics(): Promise<StorageOperationResult<StorageMetrics>>;

  /**
   * Close storage connections and cleanup
   * @returns Promise resolving to operation result
   */
  close(): Promise<StorageOperationResult>;
}

/**
 * Storage performance and usage metrics
 */
export interface StorageMetrics {
  /** Total storage space used (in bytes) */
  spaceUsed: number;
  /** Available storage space (in bytes) */
  spaceAvailable?: number;
  /** Number of read operations */
  readOperations: number;
  /** Number of write operations */
  writeOperations: number;
  /** Average read latency (milliseconds) */
  averageReadLatency: number;
  /** Average write latency (milliseconds) */
  averageWriteLatency: number;
  /** Error rate (percentage) */
  errorRate: number;
  /** Uptime (milliseconds) */
  uptime: number;
  /** Last backup timestamp */
  lastBackup?: Date;
}

/**
 * Storage event types for monitoring
 */
export enum StorageEventType {
  /** Storage initialized successfully */
  INITIALIZED = 'initialized',
  /** Storage initialization failed */
  INIT_FAILED = 'init_failed',
  /** Data read operation */
  DATA_READ = 'data_read',
  /** Data write operation */
  DATA_WRITE = 'data_write',
  /** Storage error occurred */
  ERROR = 'error',
  /** Backup created */
  BACKUP_CREATED = 'backup_created',
  /** Data restored from backup */
  BACKUP_RESTORED = 'backup_restored',
  /** Storage health check */
  HEALTH_CHECK = 'health_check',
  /** Storage connection closed */
  CLOSED = 'closed'
}

/**
 * Storage event data
 */
export interface StorageEvent {
  /** Event type */
  type: StorageEventType;
  /** Event timestamp */
  timestamp: Date;
  /** Storage identifier */
  storageId: string;
  /** Operation duration (milliseconds) */
  duration?: number;
  /** Data size (bytes) */
  dataSize?: number;
  /** Success status */
  success: boolean;
  /** Error details (if failed) */
  error?: Error;
  /** Additional event metadata */
  metadata?: Record<string, any>;
}

/**
 * Storage event listener interface
 */
export interface StorageEventListener {
  (event: StorageEvent): void | Promise<void>;
}

/**
 * Observable storage interface with event monitoring
 */
export interface ObservableStorage extends BudgetStorage {
  /**
   * Subscribe to storage events
   * @param eventType - Event type to listen for (or 'all')
   * @param listener - Event listener function
   */
  on(eventType: StorageEventType | 'all', listener: StorageEventListener): void;

  /**
   * Unsubscribe from storage events
   * @param eventType - Event type to stop listening for
   * @param listener - Event listener function to remove
   */
  off(eventType: StorageEventType | 'all', listener: StorageEventListener): void;

  /**
   * Emit storage event to all listeners
   * @param event - Storage event to emit
   */
  emit(event: StorageEvent): void;
}

/**
 * Storage factory interface for creating storage instances
 */
export interface StorageFactory {
  /**
   * Create storage instance with configuration
   * @param config - Storage configuration
   * @returns Storage instance
   */
  createStorage(config: StorageConfig): BudgetStorage;

  /**
   * Get available storage types
   * @returns Array of supported storage types
   */
  getSupportedTypes(): string[];

  /**
   * Validate storage configuration
   * @param config - Configuration to validate
   * @returns Validation result
   */
  validateConfig(config: StorageConfig): {
    valid: boolean;
    errors?: string[];
  };
}

/**
 * Migration interface for storage schema updates
 */
export interface StorageMigration {
  /** Migration version */
  version: string;
  /** Migration description */
  description: string;

  /**
   * Apply migration to data
   * @param data - Data to migrate
   * @returns Migrated data
   */
  up(data: any): Promise<any>;

  /**
   * Rollback migration from data
   * @param data - Data to rollback
   * @returns Rollback data
   */
  down(data: any): Promise<any>;
}

/**
 * Storage with migration support
 */
export interface MigratableStorage extends BudgetStorage {
  /**
   * Get current schema version
   * @returns Current version
   */
  getCurrentVersion(): Promise<string>;

  /**
   * Apply migrations to bring storage up to latest version
   * @param targetVersion - Target version (optional, defaults to latest)
   * @returns Migration result
   */
  migrate(targetVersion?: string): Promise<StorageOperationResult<{
    fromVersion: string;
    toVersion: string;
    migrationsApplied: string[];
  }>>;

  /**
   * Register migration
   * @param migration - Migration to register
   */
  registerMigration(migration: StorageMigration): void;
}