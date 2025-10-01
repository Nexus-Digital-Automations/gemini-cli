/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ExecutionStateManager, ExecutionState, ExecutionLogger } from './execution-engine.js';
/**
 * Storage backend interface for state persistence
 */
export interface StateStorageBackend {
    save(key: string, data: Record<string, unknown>): Promise<void>;
    load(key: string): Promise<Record<string, unknown> | null>;
    delete(key: string): Promise<void>;
    list(): Promise<string[]>;
}
/**
 * File-based storage backend for state persistence
 */
export declare class FileStateStorageBackend implements StateStorageBackend {
    private readonly basePath;
    constructor(basePath: string);
    save(key: string, data: Record<string, unknown>): Promise<void>;
    load(key: string): Promise<Record<string, unknown> | null>;
    delete(key: string): Promise<void>;
    list(): Promise<string[]>;
}
/**
 * State manager configuration
 */
export interface StateManagerConfig {
    checkpointInterval?: number;
    maxStates?: number;
    compressionEnabled?: boolean;
}
/**
 * Comprehensive state manager implementation
 */
export declare class ComprehensiveStateManager implements ExecutionStateManager {
    private readonly backend;
    private readonly config;
    private readonly logger;
    private readonly stateCache;
    constructor(backend: StateStorageBackend, config: StateManagerConfig, logger: ExecutionLogger);
    saveState(state: ExecutionState): Promise<void>;
    loadState(taskId: string): Promise<ExecutionState | null>;
    deleteState(taskId: string): Promise<void>;
    listStates(): Promise<ExecutionState[]>;
    /**
     * Create a checkpoint of the current execution state
     */
    createCheckpoint(taskId: string, currentStep: string, metadata?: Record<string, unknown>): Promise<void>;
    /**
     * Restore execution from a checkpoint
     */
    restoreFromCheckpoint(taskId: string): Promise<ExecutionState | null>;
    /**
     * Clean up old states based on configuration
     */
    cleanupOldStates(): Promise<void>;
    private serializeState;
    private deserializeState;
}
export { ComprehensiveStateManager as StateManager };
