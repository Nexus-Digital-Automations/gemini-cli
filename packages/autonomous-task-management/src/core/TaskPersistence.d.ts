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
export declare class TaskPersistence {
    private readonly config;
    private readonly logger;
    private readonly storage;
    constructor(config: any, logger: Logger);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    saveTask(task: Task): Promise<void>;
    loadTask(taskId: TaskId): Promise<Task | null>;
    loadAllTasks(): Promise<Task[]>;
}
