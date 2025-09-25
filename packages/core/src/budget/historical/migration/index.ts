/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Historical data migration system exports
 * Provides schema evolution and data transformation capabilities
 *
 * @author Historical Data Storage and Analysis Agent
 * @version 1.0.0
 */

// Export core types and interfaces
export type {
  SchemaVersion,
  MigrationDirection,
  MigrationOperation,
  MigrationStatus,
  DataTransformer,
  MigrationStep,
  SchemaMigration,
  MigrationContext,
  MigrationResult,
  SchemaVersionInfo,
  MigrationRegistry,
  MigrationEngine,
  MigrationScheduler,
  CompatibilityChecker,
  MigrationEventType,
  MigrationEvent,
  MigrationEventListener,
  CreateMigrationEngine,
  CreateMigrationScheduler,
} from './types.js';

// Export migration engine implementation
export {
  MigrationEngineImpl,
  createMigrationEngine,
} from './MigrationEngine.js';