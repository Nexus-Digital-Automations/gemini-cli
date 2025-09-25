/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Task, TaskId } from '../types/Task';
import type { Logger } from '../utils/Logger';

/**
 * TaskPersistence class - Handles task persistence and storage
 */
export class TaskPersistence {
  private readonly config: any;
  private readonly logger: Logger;
  private readonly storage: Map<TaskId, Task> = new Map();

  constructor(config: any, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  async initialize(): Promise<void> {
    this.logger.info('TaskPersistence initialized');
  }

  async shutdown(): Promise<void> {
    this.logger.info('TaskPersistence shutdown');
  }

  async saveTask(task: Task): Promise<void> {
    this.storage.set(task.id, task);
    this.logger.debug('Task saved', { taskId: task.id });
  }

  async loadTask(taskId: TaskId): Promise<Task | null> {
    return this.storage.get(taskId) || null;
  }

  async loadAllTasks(): Promise<Task[]> {
    return Array.from(this.storage.values());
  }
}