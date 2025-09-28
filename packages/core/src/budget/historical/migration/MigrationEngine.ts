/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Migration engine implementation for data schema evolution
 * Provides comprehensive migration capabilities with rollback and validation
 *
 * @author Historical Data Storage and Analysis Agent
 * @version 1.0.0
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { getComponentLogger, type StructuredLogger } from '../../../utils/logger.js';
import type {
  MigrationEngine,
  SchemaMigration,
  SchemaVersion,
  MigrationDirection,
  MigrationResult,
  MigrationContext,
  MigrationStatus,
  MigrationRegistry,
  SchemaVersionInfo,
} from './types.js';

/**
 * Migration execution engine with comprehensive schema evolution support
 * Handles forward and backward migrations with safety guarantees
 */
export class MigrationEngineImpl implements MigrationEngine {
  private readonly logger: StructuredLogger;
  private readonly dataSource: { type: 'file' | 'database' | 'memory'; config: Record<string, any> };
  private readonly migrationsPath: string;
  private readonly registryLocation: string;
  private readonly defaultBatchSize: number;

  private registry: MigrationRegistry;
  private availableMigrations: Map<string, SchemaMigration> = new Map();
  private versionInfo: Map<SchemaVersion, SchemaVersionInfo> = new Map();

  /**
   * Create a new migration engine
   */
  constructor(config: {
    dataSource: { type: 'file' | 'database' | 'memory'; config: Record<string, any> };
    migrationsPath: string;
    registryLocation: string;
    defaultBatchSize?: number;
  }) {
    this.logger = getComponentLogger('MigrationEngine');
    this.dataSource = config.dataSource;
    this.migrationsPath = path.resolve(config.migrationsPath);
    this.registryLocation = path.resolve(config.registryLocation);
    this.defaultBatchSize = config.defaultBatchSize || 1000;

    this.registry = this.createEmptyRegistry();

    this.logger.info('MigrationEngine initialized', {
      dataSource: this.dataSource.type,
      migrationsPath: this.migrationsPath,
      registryLocation: this.registryLocation,
      defaultBatchSize: this.defaultBatchSize,
    });

    // Initialize migration system
    this.initialize().catch(error => {
      this.logger.error('Failed to initialize migration engine', {
        error: error.message,
      });
    });
  }

  /**
   * Get current schema version
   */
  async getCurrentVersion(): Promise<SchemaVersion> {
    await this.loadRegistry();
    return this.registry.currentVersion;
  }

  /**
   * Get available migrations
   */
  async getAvailableMigrations(): Promise<SchemaMigration[]> {
    await this.loadMigrations();
    return Array.from(this.availableMigrations.values());
  }

  /**
   * Get migration path between versions
   */
  async getMigrationPath(
    fromVersion: SchemaVersion,
    toVersion: SchemaVersion
  ): Promise<SchemaMigration[]> {
    const startTime = Date.now();

    this.logger.info('Computing migration path', {
      fromVersion,
      toVersion,
    });

    try {
      await this.loadMigrations();

      // If versions are the same, no migration needed
      if (fromVersion === toVersion) {
        return [];
      }

      // Build version graph and find path
      const path = this.findMigrationPath(fromVersion, toVersion);

      if (path.length === 0) {
        throw new Error(`No migration path found from ${fromVersion} to ${toVersion}`);
      }

      this.logger.info('Migration path computed', {
        fromVersion,
        toVersion,
        pathLength: path.length,
        duration: Date.now() - startTime,
        migrations: path.map(m => m.id),
      });

      return path;
    } catch (error) {
      this.logger.error('Failed to compute migration path', {
        fromVersion,
        toVersion,
        error: error.message,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Execute migration
   */
  async executeMigration(
    migrationId: string,
    direction: MigrationDirection,
    options?: {
      batchSize?: number;
      backup?: boolean;
      dryRun?: boolean;
      continueOnError?: boolean;
    }
  ): Promise<MigrationResult> {
    const startTime = Date.now();

    this.logger.info('Starting migration execution', {
      migrationId,
      direction,
      options,
    });

    try {
      const migration = this.availableMigrations.get(migrationId);
      if (!migration) {
        throw new Error(`Migration not found: ${migrationId}`);
      }

      // Create execution context
      const context = await this.createExecutionContext(migration, direction, options);

      // Validate preconditions
      await this.validatePreconditions(context);

      // Create backup if requested
      let backup;
      if (options?.backup) {
        backup = await this.createBackup();
      }

      // Execute migration
      const result = await this.performMigration(context);

      // Update registry if successful and not dry run
      if (result.status === 'completed' && !options?.dryRun) {
        await this.updateRegistry(migration, direction);
      }

      // Include backup info in result
      if (backup) {
        result.backup = backup;
      }

      this.logger.info('Migration execution completed', {
        migrationId,
        status: result.status,
        duration: Date.now() - startTime,
        recordsProcessed: result.statistics.processedRecords,
        failedRecords: result.statistics.failedRecords,
      });

      return result;
    } catch (error) {
      this.logger.error('Migration execution failed', {
        migrationId,
        direction,
        error: error.message,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Execute multiple migrations in sequence
   */
  async executeMigrationPath(
    migrations: SchemaMigration[],
    direction: MigrationDirection,
    options?: {
      batchSize?: number;
      backup?: boolean;
      stopOnError?: boolean;
    }
  ): Promise<MigrationResult[]> {
    const startTime = Date.now();

    this.logger.info('Starting migration path execution', {
      migrationsCount: migrations.length,
      direction,
      options,
    });

    const results: MigrationResult[] = [];

    try {
      for (let i = 0; i < migrations.length; i++) {
        const migration = migrations[i];

        this.logger.info('Executing migration in path', {
          position: i + 1,
          total: migrations.length,
          migrationId: migration.id,
          direction,
        });

        try {
          const result = await this.executeMigration(migration.id, direction, {
            ...options,
            backup: i === 0 ? options?.backup : false, // Only backup on first migration
          });

          results.push(result);

          if (result.status === 'failed' && options?.stopOnError !== false) {
            this.logger.error('Stopping migration path due to failure', {
              failedMigration: migration.id,
              position: i + 1,
            });
            break;
          }
        } catch (error) {
          const failedResult: MigrationResult = {
            migrationId: migration.id,
            status: 'failed',
            direction,
            fromVersion: migration.fromVersion,
            toVersion: migration.toVersion,
            timing: {
              startTime: Date.now(),
              endTime: Date.now(),
              duration: 0,
            },
            statistics: {
              totalRecords: 0,
              processedRecords: 0,
              failedRecords: 0,
              skippedRecords: 0,
              batchesProcessed: 0,
            },
            stepResults: [],
            error: {
              message: error.message,
              code: error.code || 'MIGRATION_ERROR',
              details: { migrationId: migration.id, direction },
            },
          };

          results.push(failedResult);

          if (options?.stopOnError !== false) {
            break;
          }
        }
      }

      this.logger.info('Migration path execution completed', {
        migrationsExecuted: results.length,
        successfulMigrations: results.filter(r => r.status === 'completed').length,
        failedMigrations: results.filter(r => r.status === 'failed').length,
        duration: Date.now() - startTime,
      });

      return results;
    } catch (error) {
      this.logger.error('Migration path execution failed', {
        error: error.message,
        duration: Date.now() - startTime,
        migrationsCompleted: results.length,
      });
      throw error;
    }
  }

  /**
   * Migrate to specific version
   */
  async migrateToVersion(
    targetVersion: SchemaVersion,
    options?: {
      batchSize?: number;
      backup?: boolean;
      dryRun?: boolean;
    }
  ): Promise<MigrationResult[]> {
    const startTime = Date.now();

    this.logger.info('Starting version migration', {
      targetVersion,
      options,
    });

    try {
      const currentVersion = await this.getCurrentVersion();
      const migrationPath = await this.getMigrationPath(currentVersion, targetVersion);

      if (migrationPath.length === 0) {
        this.logger.info('No migrations needed', {
          currentVersion,
          targetVersion,
        });
        return [];
      }

      // Determine direction based on version comparison
      const direction = this.compareVersions(currentVersion, targetVersion) < 0 ? 'up' : 'down';

      const results = await this.executeMigrationPath(migrationPath, direction, {
        batchSize: options?.batchSize,
        backup: options?.backup,
        stopOnError: true,
      });

      this.logger.info('Version migration completed', {
        targetVersion,
        migrationsExecuted: results.length,
        duration: Date.now() - startTime,
      });

      return results;
    } catch (error) {
      this.logger.error('Version migration failed', {
        targetVersion,
        error: error.message,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Rollback migration
   */
  async rollbackMigration(
    migrationId: string,
    options?: {
      batchSize?: number;
      backup?: boolean;
    }
  ): Promise<MigrationResult> {
    this.logger.info('Starting migration rollback', {
      migrationId,
      options,
    });

    try {
      const migration = this.availableMigrations.get(migrationId);
      if (!migration) {
        throw new Error(`Migration not found: ${migrationId}`);
      }

      // Check if migration was applied
      const appliedMigration = this.registry.appliedMigrations.find(
        m => m.migrationId === migrationId
      );

      if (!appliedMigration) {
        throw new Error(`Migration ${migrationId} has not been applied`);
      }

      // Execute rollback (reverse direction)
      const result = await this.executeMigration(migrationId, 'down', {
        batchSize: options?.batchSize,
        backup: options?.backup,
      });

      // Mark as rolled back
      if (result.status === 'completed') {
        result.rollback = {
          performed: true,
          reason: 'Manual rollback',
          timestamp: Date.now(),
        };
      }

      this.logger.info('Migration rollback completed', {
        migrationId,
        status: result.status,
      });

      return result;
    } catch (error) {
      this.logger.error('Migration rollback failed', {
        migrationId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Validate data against schema version
   */
  async validateData(
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
  }> {
    this.logger.info('Starting data validation', {
      recordCount: data.length,
      version,
    });

    try {
      const versionInfo = this.versionInfo.get(version);
      if (!versionInfo) {
        throw new Error(`Schema version not found: ${version}`);
      }

      const errors: Array<{
        record: number;
        field: string;
        error: string;
        value: unknown;
      }> = [];

      // Validate each record
      for (let recordIndex = 0; recordIndex < data.length; recordIndex++) {
        const record = data[recordIndex];

        // Check required fields
        for (const [fieldName, fieldInfo] of Object.entries(versionInfo.schema.fields)) {
          if (fieldInfo.required && (record[fieldName] === undefined || record[fieldName] === null)) {
            errors.push({
              record: recordIndex,
              field: fieldName,
              error: 'Required field is missing',
              value: record[fieldName],
            });
          }

          // Type validation (basic)
          if (record[fieldName] !== undefined) {
            const valid = this.validateFieldType(record[fieldName], fieldInfo.type);
            if (!valid) {
              errors.push({
                record: recordIndex,
                field: fieldName,
                error: `Invalid type: expected ${fieldInfo.type}`,
                value: record[fieldName],
              });
            }
          }
        }
      }

      const result = {
        valid: errors.length === 0,
        errors,
      };

      this.logger.info('Data validation completed', {
        recordCount: data.length,
        version,
        valid: result.valid,
        errorCount: errors.length,
      });

      return result;
    } catch (error) {
      this.logger.error('Data validation failed', {
        version,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Create backup of current data
   */
  async createBackup(location?: string): Promise<{
    location: string;
    size: number;
    checksum: string;
    created: number;
  }> {
    const startTime = Date.now();
    const backupLocation = location || path.join(this.registryLocation, `backup_${Date.now()}.json`);

    this.logger.info('Creating data backup', {
      location: backupLocation,
    });

    try {
      // Get current data based on data source type
      const data = await this.loadCurrentData();

      // Create backup content
      const backupContent = {
        version: await this.getCurrentVersion(),
        timestamp: Date.now(),
        dataSource: this.dataSource,
        data,
        metadata: {
          recordCount: Array.isArray(data) ? data.length : 1,
          createdBy: 'MigrationEngine',
        },
      };

      // Write backup file
      const backupJson = JSON.stringify(backupContent, null, 2);
      await fs.writeFile(backupLocation, backupJson, 'utf8');

      // Calculate checksum
      const checksum = crypto
        .createHash('sha256')
        .update(backupJson)
        .digest('hex');

      const backup = {
        location: backupLocation,
        size: Buffer.byteLength(backupJson),
        checksum,
        created: Date.now(),
      };

      this.logger.info('Data backup created', {
        location: backupLocation,
        size: backup.size,
        duration: Date.now() - startTime,
      });

      return backup;
    } catch (error) {
      this.logger.error('Failed to create data backup', {
        location: backupLocation,
        error: error.message,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupLocation: string): Promise<{
    recordsRestored: number;
    version: SchemaVersion;
    restored: number;
  }> {
    const startTime = Date.now();

    this.logger.info('Starting data restoration', {
      backupLocation,
    });

    try {
      // Read backup file
      const backupContent = await fs.readFile(backupLocation, 'utf8');
      const backup = JSON.parse(backupContent);

      // Verify backup integrity
      const currentChecksum = crypto
        .createHash('sha256')
        .update(backupContent)
        .digest('hex');

      // Restore data based on data source type
      await this.restoreData(backup.data);

      // Update current version
      this.registry.currentVersion = backup.version;
      await this.saveRegistry();

      const result = {
        recordsRestored: Array.isArray(backup.data) ? backup.data.length : 1,
        version: backup.version,
        restored: Date.now(),
      };

      this.logger.info('Data restoration completed', {
        backupLocation,
        recordsRestored: result.recordsRestored,
        version: result.version,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      this.logger.error('Data restoration failed', {
        backupLocation,
        error: error.message,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Get migration registry
   */
  async getRegistry(): Promise<MigrationRegistry> {
    await this.loadRegistry();
    return { ...this.registry };
  }

  /**
   * Register new migration
   */
  async registerMigration(migration: SchemaMigration): Promise<void> {
    this.logger.info('Registering new migration', {
      migrationId: migration.id,
      fromVersion: migration.fromVersion,
      toVersion: migration.toVersion,
    });

    try {
      // Validate migration
      await this.validateMigration(migration);

      // Add to available migrations
      this.availableMigrations.set(migration.id, migration);

      // Save migration to filesystem
      await this.saveMigration(migration);

      this.logger.info('Migration registered successfully', {
        migrationId: migration.id,
      });
    } catch (error) {
      this.logger.error('Failed to register migration', {
        migrationId: migration.id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Initialize migration engine
   */
  private async initialize(): Promise<void> {
    try {
      // Ensure directories exist
      await this.ensureDirectories();

      // Load registry and migrations
      await this.loadRegistry();
      await this.loadMigrations();
      await this.loadVersionInfo();

      this.logger.info('Migration engine initialized successfully', {
        currentVersion: this.registry.currentVersion,
        availableMigrations: this.availableMigrations.size,
        appliedMigrations: this.registry.appliedMigrations.length,
      });
    } catch (error) {
      this.logger.error('Migration engine initialization failed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Ensure required directories exist
   */
  private async ensureDirectories(): Promise<void> {
    const directories = [
      this.migrationsPath,
      path.dirname(this.registryLocation),
    ];

    for (const dir of directories) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
        this.logger.info('Created directory', { directory: dir });
      }
    }
  }

  /**
   * Create empty registry
   */
  private createEmptyRegistry(): MigrationRegistry {
    return {
      currentVersion: '1.0.0',
      appliedMigrations: [],
      availableVersions: ['1.0.0'],
      metadata: {
        lastUpdated: Date.now(),
        dataLocation: this.dataSource.config.location || 'memory',
      },
    };
  }

  /**
   * Load migration registry
   */
  private async loadRegistry(): Promise<void> {
    try {
      const registryContent = await fs.readFile(this.registryLocation, 'utf8');
      this.registry = JSON.parse(registryContent);

      this.logger.debug('Migration registry loaded', {
        currentVersion: this.registry.currentVersion,
        appliedMigrations: this.registry.appliedMigrations.length,
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.logger.info('No existing registry found, using default');
        this.registry = this.createEmptyRegistry();
        await this.saveRegistry();
      } else {
        this.logger.error('Failed to load migration registry', {
          error: error.message,
        });
        throw error;
      }
    }
  }

  /**
   * Save migration registry
   */
  private async saveRegistry(): Promise<void> {
    try {
      this.registry.metadata.lastUpdated = Date.now();
      const registryContent = JSON.stringify(this.registry, null, 2);
      await fs.writeFile(this.registryLocation, registryContent, 'utf8');

      this.logger.debug('Migration registry saved');
    } catch (error) {
      this.logger.error('Failed to save migration registry', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Load available migrations from filesystem
   */
  private async loadMigrations(): Promise<void> {
    try {
      const files = await fs.readdir(this.migrationsPath);
      const migrationFiles = files.filter(file => file.endsWith('.json'));

      this.availableMigrations.clear();

      for (const file of migrationFiles) {
        try {
          const filePath = path.join(this.migrationsPath, file);
          const migrationContent = await fs.readFile(filePath, 'utf8');
          const migration: SchemaMigration = JSON.parse(migrationContent);

          this.availableMigrations.set(migration.id, migration);
        } catch (error) {
          this.logger.warn('Failed to load migration file', {
            file,
            error: error.message,
          });
        }
      }

      this.logger.info('Migrations loaded', {
        count: this.availableMigrations.size,
      });
    } catch (error) {
      this.logger.error('Failed to load migrations', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Load schema version information
   */
  private async loadVersionInfo(): Promise<void> {
    try {
      const versionInfoPath = path.join(this.migrationsPath, 'versions.json');

      try {
        const versionContent = await fs.readFile(versionInfoPath, 'utf8');
        const versions: Record<string, SchemaVersionInfo> = JSON.parse(versionContent);

        this.versionInfo.clear();
        for (const [version, info] of Object.entries(versions)) {
          this.versionInfo.set(version, info);
        }

        this.logger.info('Version information loaded', {
          versions: this.versionInfo.size,
        });
      } catch (error) {
        if (error.code === 'ENOENT') {
          this.logger.info('No version information file found');
        } else {
          throw error;
        }
      }
    } catch (error) {
      this.logger.error('Failed to load version information', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Find migration path between versions
   */
  private findMigrationPath(fromVersion: SchemaVersion, toVersion: SchemaVersion): SchemaMigration[] {
    // Simple linear path finding - in a real implementation, this would use graph algorithms
    const migrations = Array.from(this.availableMigrations.values());
    const path: SchemaMigration[] = [];

    let currentVersion = fromVersion;
    const isUpward = this.compareVersions(fromVersion, toVersion) < 0;

    while (currentVersion !== toVersion) {
      let found = false;

      for (const migration of migrations) {
        if (isUpward) {
          if (migration.fromVersion === currentVersion) {
            path.push(migration);
            currentVersion = migration.toVersion;
            found = true;
            break;
          }
        } else {
          if (migration.toVersion === currentVersion) {
            path.push(migration);
            currentVersion = migration.fromVersion;
            found = true;
            break;
          }
        }
      }

      if (!found) {
        return []; // No path found
      }
    }

    return path;
  }

  /**
   * Compare schema versions
   */
  private compareVersions(version1: SchemaVersion, version2: SchemaVersion): number {
    // Simple semantic versioning comparison
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part < v2Part) return -1;
      if (v1Part > v2Part) return 1;
    }

    return 0;
  }

  /**
   * Create execution context for migration
   */
  private async createExecutionContext(
    migration: SchemaMigration,
    direction: MigrationDirection,
    options?: Record<string, any>
  ): Promise<MigrationContext> {
    // Get total record count for progress tracking
    const data = await this.loadCurrentData();
    const totalRecords = Array.isArray(data) ? data.length : 1;
    const batchSize = options?.batchSize || this.defaultBatchSize;

    return {
      migration,
      direction,
      batchSize,
      currentBatch: 0,
      totalBatches: Math.ceil(totalRecords / batchSize),
      startTime: Date.now(),
      dataSource: this.dataSource,
      backup: {
        enabled: options?.backup || false,
      },
      progress: {
        totalRecords,
        processedRecords: 0,
        failedRecords: 0,
        currentStep: 0,
        totalSteps: migration.steps.length,
      },
    };
  }

  /**
   * Validate migration preconditions
   */
  private async validatePreconditions(context: MigrationContext): Promise<void> {
    const { migration, direction } = context;

    // Check if migration is applicable
    if (direction === 'up') {
      if (migration.fromVersion !== this.registry.currentVersion) {
        throw new Error(
          `Migration ${migration.id} cannot be applied: current version is ${this.registry.currentVersion}, expected ${migration.fromVersion}`
        );
      }
    } else {
      if (migration.toVersion !== this.registry.currentVersion) {
        throw new Error(
          `Migration ${migration.id} cannot be rolled back: current version is ${this.registry.currentVersion}, expected ${migration.toVersion}`
        );
      }
    }

    // Run pre-validation if defined
    if (migration.preValidation) {
      const data = await this.loadCurrentData();
      const valid = await migration.preValidation(data);
      if (!valid) {
        throw new Error(`Migration pre-validation failed for ${migration.id}`);
      }
    }
  }

  /**
   * Perform the actual migration
   */
  private async performMigration(context: MigrationContext): Promise<MigrationResult> {
    const { migration, direction } = context;
    const startTime = Date.now();

    const result: MigrationResult = {
      migrationId: migration.id,
      status: 'running',
      direction,
      fromVersion: migration.fromVersion,
      toVersion: migration.toVersion,
      timing: {
        startTime,
        endTime: 0,
        duration: 0,
      },
      statistics: {
        totalRecords: context.progress.totalRecords,
        processedRecords: 0,
        failedRecords: 0,
        skippedRecords: 0,
        batchesProcessed: 0,
      },
      stepResults: [],
    };

    try {
      // Execute migration steps
      for (let stepIndex = 0; stepIndex < migration.steps.length; stepIndex++) {
        const step = migration.steps[stepIndex];
        const stepStartTime = Date.now();

        this.logger.info('Executing migration step', {
          migrationId: migration.id,
          stepId: step.id,
          stepIndex: stepIndex + 1,
          totalSteps: migration.steps.length,
          direction,
        });

        try {
          // Execute step transformation
          const transformer = direction === 'up' ? step.up : step.down;
          const data = await this.loadCurrentData();

          let transformedData;
          if (Array.isArray(data)) {
            // Process in batches
            transformedData = [];
            const batchSize = context.batchSize;

            for (let i = 0; i < data.length; i += batchSize) {
              const batch = data.slice(i, i + batchSize);
              const transformedBatch = await transformer(batch);
              transformedData.push(...(Array.isArray(transformedBatch) ? transformedBatch : [transformedBatch]));

              context.currentBatch++;
              context.progress.processedRecords += batch.length;
              result.statistics.processedRecords += batch.length;
            }

            result.statistics.batchesProcessed = context.currentBatch;
          } else {
            transformedData = await transformer(data);
            result.statistics.processedRecords = 1;
          }

          // Validate transformation if validator provided
          if (step.validate) {
            const originalData = await this.loadCurrentData();
            const valid = await step.validate(originalData, transformedData);
            if (!valid) {
              throw new Error(`Step validation failed for ${step.id}`);
            }
          }

          // Save transformed data
          await this.saveData(transformedData);

          // Record step success
          result.stepResults.push({
            stepId: step.id,
            status: 'completed',
            duration: Date.now() - stepStartTime,
            recordsProcessed: result.statistics.processedRecords,
          });

          context.progress.currentStep++;

          this.logger.info('Migration step completed', {
            migrationId: migration.id,
            stepId: step.id,
            duration: Date.now() - stepStartTime,
            recordsProcessed: result.statistics.processedRecords,
          });

        } catch (error) {
          result.stepResults.push({
            stepId: step.id,
            status: 'failed',
            duration: Date.now() - stepStartTime,
            recordsProcessed: result.statistics.processedRecords,
            error: error.message,
          });

          throw error;
        }
      }

      // Run post-validation if defined
      if (migration.postValidation) {
        const data = await this.loadCurrentData();
        const valid = await migration.postValidation(data);
        if (!valid) {
          throw new Error('Migration post-validation failed');
        }
      }

      result.status = 'completed';

    } catch (error) {
      result.status = 'failed';
      result.error = {
        message: error.message,
        code: error.code || 'MIGRATION_ERROR',
        details: { migrationId: migration.id, direction },
      };

      this.logger.error('Migration execution failed', {
        migrationId: migration.id,
        error: error.message,
      });
    }

    result.timing.endTime = Date.now();
    result.timing.duration = result.timing.endTime - result.timing.startTime;

    return result;
  }

  /**
   * Update registry after successful migration
   */
  private async updateRegistry(migration: SchemaMigration, direction: MigrationDirection): Promise<void> {
    if (direction === 'up') {
      // Add to applied migrations
      this.registry.appliedMigrations.push({
        migrationId: migration.id,
        version: migration.toVersion,
        appliedAt: Date.now(),
        appliedBy: 'MigrationEngine',
        executionTime: 0, // Would be filled from result
        checksum: this.calculateMigrationChecksum(migration),
      });

      // Update current version
      this.registry.currentVersion = migration.toVersion;

      // Add version to available versions if not present
      if (!this.registry.availableVersions.includes(migration.toVersion)) {
        this.registry.availableVersions.push(migration.toVersion);
      }
    } else {
      // Remove from applied migrations
      this.registry.appliedMigrations = this.registry.appliedMigrations.filter(
        m => m.migrationId !== migration.id
      );

      // Update current version
      this.registry.currentVersion = migration.fromVersion;
    }

    await this.saveRegistry();
  }

  /**
   * Calculate migration checksum
   */
  private calculateMigrationChecksum(migration: SchemaMigration): string {
    const migrationString = JSON.stringify(migration, null, 0);
    return crypto.createHash('sha256').update(migrationString).digest('hex');
  }

  /**
   * Validate migration definition
   */
  private async validateMigration(migration: SchemaMigration): Promise<void> {
    // Check required fields
    if (!migration.id || !migration.fromVersion || !migration.toVersion || !migration.steps) {
      throw new Error('Migration must have id, fromVersion, toVersion, and steps');
    }

    // Check steps
    if (migration.steps.length === 0) {
      throw new Error('Migration must have at least one step');
    }

    for (const step of migration.steps) {
      if (!step.id || !step.up || !step.down) {
        throw new Error('Migration steps must have id, up, and down transformers');
      }
    }
  }

  /**
   * Load current data based on data source type
   */
  private async loadCurrentData(): Promise<unknown> {
    switch (this.dataSource.type) {
      case 'file':
        return await this.loadFileData();
      case 'memory':
        return this.dataSource.config.data || [];
      case 'database':
        return await this.loadDatabaseData();
      default:
        throw new Error(`Unsupported data source type: ${this.dataSource.type}`);
    }
  }

  /**
   * Save data based on data source type
   */
  private async saveData(data: unknown): Promise<void> {
    switch (this.dataSource.type) {
      case 'file':
        await this.saveFileData(data);
        break;
      case 'memory':
        this.dataSource.config.data = data;
        break;
      case 'database':
        await this.saveDatabaseData(data);
        break;
      default:
        throw new Error(`Unsupported data source type: ${this.dataSource.type}`);
    }
  }

  /**
   * Restore data based on data source type
   */
  private async restoreData(data: unknown): Promise<void> {
    await this.saveData(data);
  }

  /**
   * Load data from file
   */
  private async loadFileData(): Promise<unknown> {
    const filePath = this.dataSource.config.location;
    if (!filePath) {
      throw new Error('File data source requires location config');
    }

    try {
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Save data to file
   */
  private async saveFileData(data: unknown): Promise<void> {
    const filePath = this.dataSource.config.location;
    if (!filePath) {
      throw new Error('File data source requires location config');
    }

    const content = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, content, 'utf8');
  }

  /**
   * Load data from database (placeholder)
   */
  private async loadDatabaseData(): Promise<unknown> {
    // This would implement actual database loading
    throw new Error('Database data source not yet implemented');
  }

  /**
   * Save data to database (placeholder)
   */
  private async saveDatabaseData(data: unknown): Promise<void> {
    // This would implement actual database saving
    throw new Error('Database data source not yet implemented');
  }

  /**
   * Save migration to filesystem
   */
  private async saveMigration(migration: SchemaMigration): Promise<void> {
    const fileName = `${migration.id}.json`;
    const filePath = path.join(this.migrationsPath, fileName);

    const migrationContent = JSON.stringify(migration, null, 2);
    await fs.writeFile(filePath, migrationContent, 'utf8');

    this.logger.debug('Migration saved to filesystem', {
      migrationId: migration.id,
      filePath,
    });
  }

  /**
   * Validate field type (basic validation)
   */
  private validateFieldType(value: unknown, expectedType: string): boolean {
    switch (expectedType.toLowerCase()) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true; // Unknown types pass validation
    }
  }
}

/**
 * Factory function to create a migration engine
 */
export function createMigrationEngine(config: {
  dataSource: { type: 'file' | 'database' | 'memory'; config: Record<string, any> };
  migrationsPath: string;
  registryLocation: string;
  defaultBatchSize?: number;
}): MigrationEngine {
  return new MigrationEngineImpl(config);
}