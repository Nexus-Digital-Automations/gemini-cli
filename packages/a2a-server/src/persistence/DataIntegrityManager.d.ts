/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Data integrity verification result
 */
export interface IntegrityCheckResult {
  /** Whether the data passes integrity checks */
  isValid: boolean;
  /** File path being checked */
  filePath: string;
  /** Expected checksum */
  expectedChecksum?: string;
  /** Actual checksum */
  actualChecksum?: string;
  /** Integrity check timestamp */
  checkedAt: string;
  /** Any errors encountered */
  errors: string[];
  /** Warnings about potential issues */
  warnings: string[];
  /** Recovery recommendations */
  recommendations: string[];
}
/**
 * Backup metadata information
 */
export interface BackupMetadata {
  /** Unique backup identifier */
  backupId: string;
  /** Original file path being backed up */
  originalPath: string;
  /** Backup file path */
  backupPath: string;
  /** Backup creation timestamp */
  createdAt: string;
  /** Backup type (auto, manual, recovery) */
  type: 'auto' | 'manual' | 'recovery';
  /** File size in bytes */
  fileSize: number;
  /** Checksum of the backed up data */
  checksum: string;
  /** Compression used */
  compressed: boolean;
  /** Retention policy applied */
  retentionPolicy: {
    maxAge?: number;
    maxVersions?: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
  /** Additional metadata */
  metadata: {
    taskId?: string;
    sessionId?: string;
    version?: string;
    tags?: string[];
  };
}
/**
 * Recovery operation record
 */
export interface RecoveryOperation {
  /** Unique recovery operation ID */
  recoveryId: string;
  /** Recovery operation type */
  type:
    | 'restore_from_backup'
    | 'repair_corruption'
    | 'rollback_state'
    | 'merge_duplicates';
  /** Files involved in recovery */
  affectedFiles: string[];
  /** Backup used for recovery */
  backupUsed?: BackupMetadata;
  /** Recovery operation status */
  status: 'initiated' | 'in_progress' | 'completed' | 'failed';
  /** Operation timestamps */
  timestamps: {
    initiated: string;
    completed?: string;
  };
  /** Recovery outcome */
  outcome?: {
    success: boolean;
    message: string;
    restoredFiles: string[];
    failedFiles: string[];
  };
  /** Recovery metadata */
  metadata: {
    reason: string;
    triggeredBy: 'auto' | 'manual' | 'system';
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
}
/**
 * Data integrity monitoring configuration
 */
export interface IntegrityConfig {
  /** Enable periodic integrity checks */
  enablePeriodicChecks?: boolean;
  /** Check interval in milliseconds */
  checkInterval?: number;
  /** Enable automatic backup creation */
  enableAutoBackup?: boolean;
  /** Backup retention policies */
  retentionPolicy?: {
    maxVersions: number;
    maxAge: number;
    compressionEnabled: boolean;
  };
  /** Enable automatic recovery */
  enableAutoRecovery?: boolean;
  /** Checksum algorithm to use */
  checksumAlgorithm?: 'md5' | 'sha1' | 'sha256';
  /** Storage paths */
  paths?: {
    backups: string;
    integrity: string;
    recovery: string;
  };
}
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
export declare class DataIntegrityManager {
  private config;
  private backupRegistry;
  private recoveryHistory;
  private integrityCheckInterval?;
  constructor(config?: IntegrityConfig);
  /**
   * Initialize data integrity manager
   */
  private initialize;
  /**
   * Verify integrity of a file
   */
  verifyFileIntegrity(
    filePath: string,
    expectedChecksum?: string,
  ): Promise<IntegrityCheckResult>;
  /**
   * Create backup of a file or directory
   */
  createBackup(
    originalPath: string,
    options?: {
      type?: 'auto' | 'manual' | 'recovery';
      compress?: boolean;
      metadata?: Record<string, unknown>;
      priority?: 'low' | 'medium' | 'high' | 'critical';
    },
  ): Promise<BackupMetadata>;
  /**
   * Restore file from backup
   */
  restoreFromBackup(
    backupId: string,
    targetPath?: string,
    options?: {
      verifyIntegrity?: boolean;
      createRecoveryPoint?: boolean;
    },
  ): Promise<RecoveryOperation>;
  /**
   * Perform automatic recovery for corrupted files
   */
  performAutoRecovery(filePath: string): Promise<RecoveryOperation | null>;
  /**
   * Get all backups for a specific file
   */
  getFileBackups(filePath: string): BackupMetadata[];
  /**
   * Get backup by ID
   */
  getBackup(backupId: string): BackupMetadata | undefined;
  /**
   * List all backups with filtering options
   */
  listBackups(options?: {
    type?: 'auto' | 'manual' | 'recovery';
    priority?: 'low' | 'medium' | 'high' | 'critical';
    olderThan?: Date;
    newerThan?: Date;
    limit?: number;
  }): BackupMetadata[];
  /**
   * Get recovery operation history
   */
  getRecoveryHistory(options?: {
    type?: RecoveryOperation['type'];
    status?: RecoveryOperation['status'];
    limit?: number;
  }): RecoveryOperation[];
  /**
   * Clean up old backups according to retention policy
   */
  cleanupOldBackups(): Promise<{
    deletedCount: number;
    freedSpace: number;
    errors: string[];
  }>;
  /**
   * Calculate checksum for a file
   */
  private calculateChecksum;
  /**
   * Calculate original checksum from backup metadata
   */
  private calculateOriginalChecksum;
  /**
   * Create compressed backup
   */
  private createCompressedBackup;
  /**
   * Restore from compressed backup
   */
  private restoreCompressedBackup;
  /**
   * Save integrity check result
   */
  private saveIntegrityCheckResult;
  /**
   * Save backup metadata
   */
  private saveBackupMetadata;
  /**
   * Remove backup metadata
   */
  private removeBackupMetadata;
  /**
   * Save recovery operation
   */
  private saveRecoveryOperation;
  /**
   * Load backup registry from disk
   */
  private loadBackupRegistry;
  /**
   * Load recovery history from disk
   */
  private loadRecoveryHistory;
  /**
   * Start periodic integrity checks
   */
  private startPeriodicIntegrityChecks;
  /**
   * Perform periodic integrity check on all registered files
   */
  private performPeriodicIntegrityCheck;
  /**
   * Get integrity manager statistics
   */
  getStatistics(): Promise<{
    totalBackups: number;
    totalBackupSize: number;
    backupsByType: Record<string, number>;
    recentRecoveries: number;
    failedIntegrityChecks: number;
    storageUtilization: {
      backups: number;
      integrity: number;
      recovery: number;
    };
  }>;
  /**
   * Calculate directory size in bytes
   */
  private calculateDirectorySize;
  /**
   * Shutdown data integrity manager
   */
  shutdown(): Promise<void>;
}
