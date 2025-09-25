/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Transaction isolation levels for concurrent access control
 */
export var TransactionIsolationLevel;
(function (TransactionIsolationLevel) {
    TransactionIsolationLevel["READ_UNCOMMITTED"] = "read_uncommitted";
    TransactionIsolationLevel["READ_COMMITTED"] = "read_committed";
    TransactionIsolationLevel["REPEATABLE_READ"] = "repeatable_read";
    TransactionIsolationLevel["SERIALIZABLE"] = "serializable";
})(TransactionIsolationLevel || (TransactionIsolationLevel = {}));
/**
 * Backup creation strategy options
 */
export var BackupStrategy;
(function (BackupStrategy) {
    BackupStrategy["INCREMENTAL"] = "incremental";
    BackupStrategy["FULL"] = "full";
    BackupStrategy["DIFFERENTIAL"] = "differential";
})(BackupStrategy || (BackupStrategy = {}));
/**
 * Storage compression algorithms
 */
export var CompressionAlgorithm;
(function (CompressionAlgorithm) {
    CompressionAlgorithm["NONE"] = "none";
    CompressionAlgorithm["GZIP"] = "gzip";
    CompressionAlgorithm["DEFLATE"] = "deflate";
    CompressionAlgorithm["BROTLI"] = "brotli";
})(CompressionAlgorithm || (CompressionAlgorithm = {}));
/**
 * Task serialization format options
 */
export var SerializationFormat;
(function (SerializationFormat) {
    SerializationFormat["JSON"] = "json";
    SerializationFormat["BSON"] = "bson";
    SerializationFormat["MESSAGEPACK"] = "messagepack";
    SerializationFormat["PROTOBUF"] = "protobuf";
})(SerializationFormat || (SerializationFormat = {}));
/**
 * Abstract base class for task storage implementations
 * Provides common functionality and enforces interface compliance
 */
export class TaskStore {
    config;
    isInitialized = false;
    isShuttingDown = false;
    // EventEmitter implementation (will be mixed in)
    emit;
    on;
    off;
    once;
    removeAllListeners;
    /**
     * Validate storage configuration
     * @param config Storage configuration to validate
     * @throws Error if configuration is invalid
     */
    validateConfig(config) {
        if (!config.connectionString) {
            throw new Error('Connection string is required');
        }
        if (config.maxStorageSize && config.maxStorageSize <= 0) {
            throw new Error('Max storage size must be positive');
        }
    }
    /**
     * Check if persistence layer is initialized
     * @throws Error if not initialized
     */
    ensureInitialized() {
        if (!this.isInitialized) {
            throw new Error('TaskStore not initialized. Call initialize() first.');
        }
        if (this.isShuttingDown) {
            throw new Error('TaskStore is shutting down. Cannot perform operations.');
        }
    }
    /**
     * Save multiple tasks atomically (default implementation)
     */
    async saveTasks(tasks, transaction) {
        const startTime = Date.now();
        let localTransaction = false;
        try {
            // Create transaction if not provided
            if (!transaction) {
                transaction = await this.beginTransaction(TransactionIsolationLevel.READ_COMMITTED);
                localTransaction = true;
            }
            // Save all tasks within transaction
            for (const task of tasks) {
                const result = await this.saveTask(task, transaction);
                if (!result.success) {
                    if (localTransaction) {
                        await this.rollbackTransaction(transaction);
                    }
                    return result;
                }
            }
            // Commit if we created the transaction
            if (localTransaction) {
                await this.commitTransaction(transaction);
            }
            return {
                success: true,
                metadata: {
                    duration: Date.now() - startTime,
                    sizeChange: 0, // Will be calculated by implementation
                    transactionId: transaction.id,
                },
            };
        }
        catch (error) {
            if (localTransaction && transaction) {
                await this.rollbackTransaction(transaction);
            }
            return {
                success: false,
                error: error,
                metadata: {
                    duration: Date.now() - startTime,
                    sizeChange: 0,
                    transactionId: transaction?.id,
                },
            };
        }
    }
    /**
     * Load multiple tasks efficiently (default implementation)
     */
    async loadTasks(taskIds, useCache = true) {
        const startTime = Date.now();
        const tasks = [];
        const errors = [];
        for (const taskId of taskIds) {
            try {
                const result = await this.loadTask(taskId, useCache);
                if (result.success && result.data) {
                    tasks.push(result.data);
                }
                else if (result.error) {
                    errors.push(result.error);
                }
            }
            catch (error) {
                errors.push(error);
            }
        }
        return {
            success: errors.length === 0,
            data: tasks,
            error: errors.length > 0 ? new Error(`Failed to load ${errors.length} tasks`) : undefined,
            metadata: {
                duration: Date.now() - startTime,
                sizeChange: 0,
            },
        };
    }
    /**
     * Update multiple tasks atomically (default implementation)
     */
    async updateTasks(updates, transaction) {
        const startTime = Date.now();
        let localTransaction = false;
        try {
            // Create transaction if not provided
            if (!transaction) {
                transaction = await this.beginTransaction(TransactionIsolationLevel.READ_COMMITTED);
                localTransaction = true;
            }
            // Update all tasks within transaction
            for (const update of updates) {
                const result = await this.updateTask(update.task, update.expectedVersion, transaction);
                if (!result.success) {
                    if (localTransaction) {
                        await this.rollbackTransaction(transaction);
                    }
                    return result;
                }
            }
            // Commit if we created the transaction
            if (localTransaction) {
                await this.commitTransaction(transaction);
            }
            return {
                success: true,
                metadata: {
                    duration: Date.now() - startTime,
                    sizeChange: 0, // Will be calculated by implementation
                    transactionId: transaction.id,
                },
            };
        }
        catch (error) {
            if (localTransaction && transaction) {
                await this.rollbackTransaction(transaction);
            }
            return {
                success: false,
                error: error,
                metadata: {
                    duration: Date.now() - startTime,
                    sizeChange: 0,
                    transactionId: transaction?.id,
                },
            };
        }
    }
    /**
     * Count tasks matching filter criteria (default implementation)
     */
    async countTasks(filter) {
        const startTime = Date.now();
        try {
            const result = await this.queryTasks({ ...filter, limit: undefined });
            return {
                success: result.success,
                data: result.data?.length || 0,
                error: result.error,
                metadata: {
                    duration: Date.now() - startTime,
                    sizeChange: 0,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error,
                metadata: {
                    duration: Date.now() - startTime,
                    sizeChange: 0,
                },
            };
        }
    }
    /**
     * Default backup implementation (to be overridden by subclasses)
     */
    async createBackup(strategy = BackupStrategy.FULL, destination) {
        throw new Error('Backup functionality not implemented in base class');
    }
    /**
     * Default restore implementation (to be overridden by subclasses)
     */
    async restoreFromBackup(backupPath, options) {
        throw new Error('Restore functionality not implemented in base class');
    }
    /**
     * Default optimization implementation (to be overridden by subclasses)
     */
    async optimize(options) {
        throw new Error('Optimization functionality not implemented in base class');
    }
    /**
     * Default cleanup implementation (to be overridden by subclasses)
     */
    async cleanup(olderThan, options) {
        throw new Error('Cleanup functionality not implemented in base class');
    }
    /**
     * Default export implementation (to be overridden by subclasses)
     */
    async exportTasks(filter, format, destination) {
        throw new Error('Export functionality not implemented in base class');
    }
    /**
     * Default import implementation (to be overridden by subclasses)
     */
    async importTasks(sourcePath, format, options) {
        throw new Error('Import functionality not implemented in base class');
    }
}
//# sourceMappingURL=TaskStore.js.map