/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Task } from './types.js';
export declare class TaskStore {
    private tasksFilePath;
    constructor(projectRoot: string);
    private ensureTasksFileExists;
    loadTasks(): Promise<Task[]>;
    saveTasks(tasks: Task[]): Promise<void>;
    getTask(id: string): Promise<Task | undefined>;
    addTask(task: Task): Promise<void>;
    updateTask(updatedTask: Task): Promise<void>;
    deleteTask(id: string): Promise<void>;
}
