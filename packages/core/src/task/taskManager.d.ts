/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Task, TaskMetadata } from './types';
import { TaskStatus, TaskPriority } from './types';
import type { TaskStore } from './taskStore.js';
export declare class TaskManager {
    private taskStore;
    constructor(taskStore: TaskStore);
    createTask(name: string, description: string, priority?: TaskPriority, dueDate?: string, assignee?: string, dependencies?: string[], subtasks?: string[], metadata?: TaskMetadata): Promise<Task>;
    getTask(id: string): Promise<Task | undefined>;
    listTasks(filter?: {
        status?: TaskStatus;
        assignee?: string;
    }): Promise<Task[]>;
    updateTaskStatus(id: string, newStatus: TaskStatus): Promise<Task>;
    addDependency(taskId: string, dependencyId: string): Promise<Task>;
    removeDependency(taskId: string, dependencyId: string): Promise<Task>;
    addSubtask(parentTaskId: string, subtaskId: string): Promise<Task>;
    updateTaskMetadata(taskId: string, metadata: Partial<TaskMetadata>): Promise<Task>;
    getRunnableTasks(): Promise<Task[]>;
}
