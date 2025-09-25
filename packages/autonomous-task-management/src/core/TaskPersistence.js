/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Task, TaskId } from '../types/Task';
import { Logger } from '../utils/Logger';
/**
 * TaskPersistence class - Handles task persistence and storage
 */
export class TaskPersistence {
    config;
    logger;
    storage = new Map();
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
    }
    async initialize() {
        this.logger.info('TaskPersistence initialized');
    }
    async shutdown() {
        this.logger.info('TaskPersistence shutdown');
    }
    async saveTask(task) {
        this.storage.set(task.id, task);
        this.logger.debug('Task saved', { taskId: task.id });
    }
    async loadTask(taskId) {
        return this.storage.get(taskId) || null;
    }
    async loadAllTasks() {
        return Array.from(this.storage.values());
    }
}
//# sourceMappingURL=TaskPersistence.js.map