/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type {
  ExecutionStateManager,
  ExecutionState,
  ExecutionLogger,
} from './execution-engine.js';

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
export class FileStateStorageBackend implements StateStorageBackend {
  private readonly basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  async save(key: string, data: Record<string, unknown>): Promise<void> {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
      const filePath = join(this.basePath, `${key}.json`);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(
        `Failed to save state ${key}: ${(error as Error).message}`,
      );
    }
  }

  async load(key: string): Promise<Record<string, unknown> | null> {
    try {
      const filePath = join(this.basePath, `${key}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw new Error(
        `Failed to load state ${key}: ${(error as Error).message}`,
      );
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const filePath = join(this.basePath, `${key}.json`);
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return; // Already deleted
      }
      throw new Error(
        `Failed to delete state ${key}: ${(error as Error).message}`,
      );
    }
  }

  async list(): Promise<string[]> {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
      const files = await fs.readdir(this.basePath);
      return files
        .filter((f) => f.endsWith('.json'))
        .map((f) => f.replace('.json', ''));
    } catch (error) {
      throw new Error(`Failed to list states: ${(error as Error).message}`);
    }
  }
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
export class ComprehensiveStateManager implements ExecutionStateManager {
  private readonly backend: StateStorageBackend;
  private readonly config: StateManagerConfig;
  private readonly logger: ExecutionLogger;
  private readonly stateCache = new Map<string, ExecutionState>();

  constructor(
    backend: StateStorageBackend,
    config: StateManagerConfig = {},
    logger: ExecutionLogger,
  ) {
    this.backend = backend;
    this.config = {
      checkpointInterval: 30000, // 30 seconds
      maxStates: 1000,
      compressionEnabled: false,
      ...config,
    };
    this.logger = logger;
  }

  async saveState(state: ExecutionState): Promise<void> {
    try {
      const stateData = this.serializeState(state);
      await this.backend.save(state.taskId, stateData);
      this.stateCache.set(state.taskId, state);

      this.logger.debug(`State saved for task: ${state.taskId}`);
    } catch (error) {
      this.logger.error(
        `Failed to save state for task ${state.taskId}`,
        error as Error,
      );
      throw error;
    }
  }

  async loadState(taskId: string): Promise<ExecutionState | null> {
    try {
      // Check cache first
      if (this.stateCache.has(taskId)) {
        return this.stateCache.get(taskId)!;
      }

      const stateData = await this.backend.load(taskId);
      if (!stateData) {
        return null;
      }

      const state = this.deserializeState(stateData);
      this.stateCache.set(taskId, state);

      this.logger.debug(`State loaded for task: ${taskId}`);
      return state;
    } catch (error) {
      this.logger.error(
        `Failed to load state for task ${taskId}`,
        error as Error,
      );
      throw error;
    }
  }

  async deleteState(taskId: string): Promise<void> {
    try {
      await this.backend.delete(taskId);
      this.stateCache.delete(taskId);

      this.logger.debug(`State deleted for task: ${taskId}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete state for task ${taskId}`,
        error as Error,
      );
      throw error;
    }
  }

  async listStates(): Promise<ExecutionState[]> {
    try {
      const stateKeys = await this.backend.list();
      const states: ExecutionState[] = [];

      for (const key of stateKeys) {
        const state = await this.loadState(key);
        if (state) {
          states.push(state);
        }
      }

      return states;
    } catch (error) {
      this.logger.error('Failed to list states', error as Error);
      throw error;
    }
  }

  /**
   * Create a checkpoint of the current execution state
   */
  async createCheckpoint(
    taskId: string,
    currentStep: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
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
  async restoreFromCheckpoint(taskId: string): Promise<ExecutionState | null> {
    return this.loadState(taskId);
  }

  /**
   * Clean up old states based on configuration
   */
  async cleanupOldStates(): Promise<void> {
    try {
      const states = await this.listStates();

      if (states.length > (this.config.maxStates || 1000)) {
        // Sort by last update date and remove oldest
        states.sort((a, b) => a.lastUpdate.getTime() - b.lastUpdate.getTime());
        const toDelete = states.slice(
          0,
          states.length - (this.config.maxStates || 1000),
        );

        for (const state of toDelete) {
          await this.deleteState(state.taskId);
        }

        this.logger.info(`Cleaned up ${toDelete.length} old states`);
      }
    } catch (error) {
      this.logger.error('Failed to cleanup old states', error as Error);
    }
  }

  private serializeState(state: ExecutionState): Record<string, unknown> {
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

  private deserializeState(data: Record<string, unknown>): ExecutionState {
    const errorData = data.error as
      | { name: string; message: string; stack?: string }
      | undefined;

    return {
      taskId: data.taskId as string,
      status: data.status as ExecutionState['status'],
      progress: (data.progress as number) || 0,
      currentStep: data.currentStep as string,
      stepIndex: data.stepIndex as number,
      totalSteps: data.totalSteps as number,
      completedSteps: (data.completedSteps as string[]) || [],
      failedSteps: (data.failedSteps as string[]) || [],
      startTime: new Date(data.startTime as string),
      lastUpdate: new Date(data.lastUpdate as string),
      metadata: (data.metadata as Record<string, unknown>) || {},
      checkpoints: (data.checkpoints as string[]) || [],
      error: errorData
        ? ({
            name: errorData.name,
            message: errorData.message,
            stack: errorData.stack,
          } as Error)
        : undefined,
    };
  }
}
