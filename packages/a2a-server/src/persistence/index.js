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
// Main API - Comprehensive persistence storage
export { PersistenceStorageAPI } from './PersistenceStorageAPI.js';
// Core Storage Engine
export { FileBasedTaskStore } from './FileBasedTaskStore.js';
// Session Management
export { SessionManager } from './SessionManager.js';
// Conflict Resolution
export { ConflictResolver } from './ConflictResolver.js';
// Data Integrity Management
export { DataIntegrityManager } from './DataIntegrityManager.js';
// Performance Optimization - TODO: Add PerformanceOptimizer when implemented
// Utilities and Helpers - TODO: Add types when implemented
//# sourceMappingURL=index.js.map