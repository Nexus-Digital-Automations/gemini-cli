/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { MigrationEngine, SchemaMigration, SchemaVersion, MigrationDirection, MigrationResult, MigrationRegistry } from './types.js';
/**
 * Migration execution engine with comprehensive schema evolution support
 * Handles forward and backward migrations with safety guarantees
 */
export declare class MigrationEngineImpl implements MigrationEngine {
    private readonly logger;
    private readonly dataSource;
    private readonly migrationsPath;
    private readonly registryLocation;
    private readonly defaultBatchSize;
    private registry;
    private availableMigrations;
    private versionInfo;
    /**
     * Create a new migration engine
     */
    constructor(config: {
        dataSource: {
            type: 'file' | 'database' | 'memory';
            config: Record<string, any>;
        };
        migrationsPath: string;
        registryLocation: string;
        defaultBatchSize?: number;
    });
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
    getMigrationPath(fromVersion: SchemaVersion, toVersion: SchemaVersion): Promise<SchemaMigration[]>;
    /**
     * Execute migration
     */
    executeMigration(migrationId: string, direction: MigrationDirection, options?: {
        batchSize?: number;
        backup?: boolean;
        dryRun?: boolean;
        continueOnError?: boolean;
    }): Promise<MigrationResult>;
    /**
     * Execute multiple migrations in sequence
     */
    executeMigrationPath(migrations: SchemaMigration[], direction: MigrationDirection, options?: {
        batchSize?: number;
        backup?: boolean;
        stopOnError?: boolean;
    }): Promise<MigrationResult[]>;
    /**
     * Migrate to specific version
     */
    migrateToVersion(targetVersion: SchemaVersion, options?: {
        batchSize?: number;
        backup?: boolean;
        dryRun?: boolean;
    }): Promise<MigrationResult[]>;
    /**
     * Rollback migration
     */
    rollbackMigration(migrationId: string, options?: {
        batchSize?: number;
        backup?: boolean;
    }): Promise<MigrationResult>;
    /**
     * Validate data against schema version
     */
    validateData(data: any[], version: SchemaVersion): Promise<{
        valid: boolean;
        errors: Array<{
            record: number;
            field: string;
            error: string;
            value: any;
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
    /**
     * Initialize migration engine
     */
    private initialize;
    /**
     * Ensure required directories exist
     */
    private ensureDirectories;
    /**
     * Create empty registry
     */
    private createEmptyRegistry;
    /**
     * Load migration registry
     */
    private loadRegistry;
    /**
     * Save migration registry
     */
    private saveRegistry;
    /**
     * Load available migrations from filesystem
     */
    private loadMigrations;
    /**
     * Load schema version information
     */
    private loadVersionInfo;
    /**
     * Find migration path between versions
     */
    private findMigrationPath;
    /**
     * Compare schema versions
     */
    private compareVersions;
    /**
     * Create execution context for migration
     */
    private createExecutionContext;
    /**
     * Validate migration preconditions
     */
    private validatePreconditions;
    /**
     * Perform the actual migration
     */
    private performMigration;
    /**
     * Update registry after successful migration
     */
    private updateRegistry;
    /**
     * Calculate migration checksum
     */
    private calculateMigrationChecksum;
    /**
     * Validate migration definition
     */
    private validateMigration;
    /**
     * Load current data based on data source type
     */
    private loadCurrentData;
    /**
     * Save data based on data source type
     */
    private saveData;
    /**
     * Restore data based on data source type
     */
    private restoreData;
    /**
     * Load data from file
     */
    private loadFileData;
    /**
     * Save data to file
     */
    private saveFileData;
    /**
     * Load data from database (placeholder)
     */
    private loadDatabaseData;
    /**
     * Save data to database (placeholder)
     */
    private saveDatabaseData;
    /**
     * Save migration to filesystem
     */
    private saveMigration;
    /**
     * Validate field type (basic validation)
     */
    private validateFieldType;
}
/**
 * Factory function to create a migration engine
 */
export declare function createMigrationEngine(config: {
    dataSource: {
        type: 'file' | 'database' | 'memory';
        config: Record<string, any>;
    };
    migrationsPath: string;
    registryLocation: string;
    defaultBatchSize?: number;
}): MigrationEngine;
