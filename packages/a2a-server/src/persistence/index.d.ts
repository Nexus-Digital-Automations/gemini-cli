/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Comprehensive Persistence Storage System
 *
 * A robust, enterprise-grade persistence storage system providing:
 * - Cross-session task continuity
 * - Intelligent conflict resolution
 * - Data integrity and backup management
 * - Performance optimization
 * - Comprehensive monitoring and analytics
 *
 * @example Basic Usage
 * ```typescript
 * import { PersistenceStorageAPI } from '@a2a-js/server/persistence';
 *
 * const storage = new PersistenceStorageAPI();
 * await storage.save(task);
 * const loadedTask = await storage.load('task-id');
 * ```
 *
 * @example Advanced Configuration
 * ```typescript
 * const storage = new PersistenceStorageAPI({
 *   enableSessionManagement: true,
 *   enableConflictResolution: true,
 *   enableDataIntegrity: true,
 *   performance: {
 *     enableCaching: true,
 *     cacheSize: 200,
 *   },
 * });
 * ```
 */
export { PersistenceStorageAPI } from './PersistenceStorageAPI.js';
export type { PersistenceConfig, StorageStatistics, StorageOperationResult, } from './PersistenceStorageAPI.js';
export { FileBasedTaskStore } from './FileBasedTaskStore.js';
export type { FileBasedStorageConfig, TaskSessionMetadata, StorageMetrics, } from './FileBasedTaskStore.js';
export { SessionManager } from './SessionManager.js';
export type { SessionOwnership, TaskCorrelation, SessionHandoff, } from './SessionManager.js';
export { ConflictResolver } from './ConflictResolver.js';
export type { ConflictType, ResolutionStrategy, ConflictAnalysis, ConflictResolution, ResourceLock, } from './ConflictResolver.js';
export { DataIntegrityManager } from './DataIntegrityManager.js';
export type { IntegrityCheckResult, BackupMetadata, RecoveryOperation, IntegrityConfig, } from './DataIntegrityManager.js';
export { GCSTaskStore, NoOpTaskStore } from './gcs.js';
