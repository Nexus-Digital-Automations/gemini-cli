/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StateStorageBackend {
  saveState(taskId: string, state: unknown): Promise<void>;
  loadState(taskId: string): Promise<unknown>;
  deleteState(taskId: string): Promise<void>;
  listStates(): Promise<unknown[]>;
}

export class FileStateStorageBackend implements StateStorageBackend {
  basePath: string;

  constructor(basePath: string);

  saveState(taskId: string, state: unknown): Promise<void>;
  loadState(taskId: string): Promise<unknown>;
  deleteState(taskId: string): Promise<void>;
  listStates(): Promise<unknown[]>;
}

export class ComprehensiveStateManager {
  backend: StateStorageBackend;

  constructor(backend: StateStorageBackend, config?: unknown, logger?: unknown);

  saveState(taskId: string, state: unknown): Promise<void>;
  loadState(taskId: string): Promise<unknown>;
  deleteState(taskId: string): Promise<void>;
  listStates(): Promise<unknown[]>;
  restoreFromCheckpoint(taskId: string): Promise<unknown>;
  createCheckpoint(taskId: string, state: unknown): Promise<void>;
}
