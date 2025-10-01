/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
/**
 * File-based storage backend for state persistence
 */
export class FileStateStorageBackend {
    basePath;
    constructor(basePath) {
        this.basePath = basePath;
    }
    async save(key, data) {
        try {
            await fs.mkdir(this.basePath, { recursive: true });
            const filePath = join(this.basePath, `${key}.json`);
            await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
        }
        catch (error) {
            throw new Error(`Failed to save state ${key}: ${error.message}`);
        }
    }
    async load(key) {
        try {
            const filePath = join(this.basePath, `${key}.json`);
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return null;
            }
            throw new Error(`Failed to load state ${key}: ${error.message}`);
        }
    }
    async delete(key) {
        try {
            const filePath = join(this.basePath, `${key}.json`);
            await fs.unlink(filePath);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return; // Already deleted
            }
            throw new Error(`Failed to delete state ${key}: ${error.message}`);
        }
    }
    async list() {
        try {
            await fs.mkdir(this.basePath, { recursive: true });
            const files = await fs.readdir(this.basePath);
            return files
                .filter((f) => f.endsWith('.json'))
                .map((f) => f.replace('.json', ''));
        }
        catch (error) {
            throw new Error(`Failed to list states: ${error.message}`);
        }
    }
}
/**
 * Comprehensive state manager implementation
 */
export class ComprehensiveStateManager {
    backend;
    config;
    logger;
    stateCache = new Map();
    constructor(backend, config = {}, logger) {
        this.backend = backend;
        this.config = {
            checkpointInterval: 30000, // 30 seconds
            maxStates: 1000,
            compressionEnabled: false,
            ...config,
        };
        this.logger = logger;
    }
    async saveState(state) {
        try {
            const stateData = this.serializeState(state);
            await this.backend.save(state.taskId, stateData);
            this.stateCache.set(state.taskId, state);
            this.logger.debug(`State saved for task: ${state.taskId}`);
        }
        catch (error) {
            this.logger.error(`Failed to save state for task ${state.taskId}`, error);
            throw error;
        }
    }
    async loadState(taskId) {
        try {
            // Check cache first
            if (this.stateCache.has(taskId)) {
                return this.stateCache.get(taskId);
            }
            const stateData = await this.backend.load(taskId);
            if (!stateData) {
                return null;
            }
            const state = this.deserializeState(stateData);
            this.stateCache.set(taskId, state);
            this.logger.debug(`State loaded for task: ${taskId}`);
            return state;
        }
        catch (error) {
            this.logger.error(`Failed to load state for task ${taskId}`, error);
            throw error;
        }
    }
    async deleteState(taskId) {
        try {
            await this.backend.delete(taskId);
            this.stateCache.delete(taskId);
            this.logger.debug(`State deleted for task: ${taskId}`);
        }
        catch (error) {
            this.logger.error(`Failed to delete state for task ${taskId}`, error);
            throw error;
        }
    }
    async listStates() {
        try {
            const stateKeys = await this.backend.list();
            const states = [];
            for (const key of stateKeys) {
                const state = await this.loadState(key);
                if (state) {
                    states.push(state);
                }
            }
            return states;
        }
        catch (error) {
            this.logger.error('Failed to list states', error);
            throw error;
        }
    }
    /**
     * Create a checkpoint of the current execution state
     */
    async createCheckpoint(taskId, currentStep, metadata) {
        const state = await this.loadState(taskId);
        if (state) {
            state.currentStep = currentStep;
            state.lastUpdate = new Date();
            if (metadata) {
                state.metadata = { ...state.metadata, ...metadata };
            }
            await this.saveState(state);
        }
    }
    /**
     * Restore execution from a checkpoint
     */
    async restoreFromCheckpoint(taskId) {
        return this.loadState(taskId);
    }
    /**
     * Clean up old states based on configuration
     */
    async cleanupOldStates() {
        try {
            const states = await this.listStates();
            if (states.length > (this.config.maxStates || 1000)) {
                // Sort by last update date and remove oldest
                states.sort((a, b) => a.lastUpdate.getTime() - b.lastUpdate.getTime());
                const toDelete = states.slice(0, states.length - (this.config.maxStates || 1000));
                for (const state of toDelete) {
                    await this.deleteState(state.taskId);
                }
                this.logger.info(`Cleaned up ${toDelete.length} old states`);
            }
        }
        catch (error) {
            this.logger.error('Failed to cleanup old states', error);
        }
    }
    serializeState(state) {
        return {
            taskId: state.taskId,
            status: state.status,
            currentStep: state.currentStep,
            stepIndex: state.stepIndex,
            totalSteps: state.totalSteps,
            startTime: state.startTime.toISOString(),
            lastUpdate: state.lastUpdate.toISOString(),
            metadata: state.metadata || {},
            checkpoints: state.checkpoints || [],
            error: state.error
                ? {
                    name: state.error.name,
                    message: state.error.message,
                    stack: state.error.stack,
                }
                : undefined,
        };
    }
    deserializeState(data) {
        const errorData = data.error;
        return {
            taskId: data.taskId,
            status: data.status,
            progress: data.progress || 0,
            currentStep: data.currentStep,
            stepIndex: data.stepIndex,
            totalSteps: data.totalSteps,
            completedSteps: data.completedSteps || [],
            failedSteps: data.failedSteps || [],
            startTime: new Date(data.startTime),
            lastUpdate: new Date(data.lastUpdate),
            metadata: data.metadata || {},
            checkpoints: data.checkpoints || [],
            error: errorData
                ? {
                    name: errorData.name,
                    message: errorData.message,
                    stack: errorData.stack,
                }
                : undefined,
        };
    }
}
// Export alias for backward compatibility
export { ComprehensiveStateManager as StateManager };
//# sourceMappingURL=state-manager.js.map