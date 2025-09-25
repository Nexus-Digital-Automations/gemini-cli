/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { v4 as uuidv4 } from 'uuid';
import type { Task, TaskMetadata } from './types';
import { TaskStatus, TaskPriority } from './types';
import type { TaskStore } from './taskStore.js';

export class TaskManager {
  private taskStore: TaskStore;

  constructor(taskStore: TaskStore) {
    this.taskStore = taskStore;
  }

  async createTask(
    name: string,
    description: string,
    priority: TaskPriority = TaskPriority.Medium,
    dueDate?: string,
    assignee?: string,
    dependencies: string[] = [],
    subtasks: string[] = [],
    metadata: TaskMetadata = { toolCalls: [], context: {} },
  ): Promise<Task> {
    const now = new Date().toISOString();
    const newTask: Task = {
      id: uuidv4(),
      name,
      description,
      status: TaskStatus.Todo,
      priority,
      dueDate,
      assignee,
      dependencies,
      subtasks,
      metadata,
      createdAt: now,
      updatedAt: now,
    };
    await this.taskStore.addTask(newTask);
    return newTask;
  }

  async getTask(id: string): Promise<Task | undefined> {
    return this.taskStore.getTask(id);
  }

  async listTasks(filter?: {
    status?: TaskStatus;
    assignee?: string;
  }): Promise<Task[]> {
    const tasks = await this.taskStore.loadTasks();
    if (!filter) {
      return tasks;
    }
    return tasks.filter((task) => {
      let matches = true;
      if (filter.status && task.status !== filter.status) {
        matches = false;
      }
      if (filter.assignee && task.assignee !== filter.assignee) {
        matches = false;
      }
      return matches;
    });
  }

  async updateTaskStatus(id: string, newStatus: TaskStatus): Promise<Task> {
    const task = await this.taskStore.getTask(id);
    if (!task) {
      throw new Error(`Task with ID ${id} not found.`);
    }
    task.status = newStatus;
    task.updatedAt = new Date().toISOString();
    await this.taskStore.updateTask(task);
    return task;
  }

  async addDependency(taskId: string, dependencyId: string): Promise<Task> {
    const task = await this.taskStore.getTask(taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found.`);
    }
    if (!task.dependencies.includes(dependencyId)) {
      task.dependencies.push(dependencyId);
      task.updatedAt = new Date().toISOString();
      await this.taskStore.updateTask(task);
    }
    return task;
  }

  async removeDependency(taskId: string, dependencyId: string): Promise<Task> {
    const task = await this.taskStore.getTask(taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found.`);
    }
    const initialLength = task.dependencies.length;
    task.dependencies = task.dependencies.filter((dep) => dep !== dependencyId);
    if (task.dependencies.length < initialLength) {
      task.updatedAt = new Date().toISOString();
      await this.taskStore.updateTask(task);
    }
    return task;
  }

  async addSubtask(parentTaskId: string, subtaskId: string): Promise<Task> {
    const task = await this.taskStore.getTask(parentTaskId);
    if (!task) {
      throw new Error(`Task with ID ${parentTaskId} not found.`);
    }
    if (!task.subtasks.includes(subtaskId)) {
      task.subtasks.push(subtaskId);
      task.updatedAt = new Date().toISOString();
      await this.taskStore.updateTask(task);
    }
    return task;
  }

  async updateTaskMetadata(
    taskId: string,
    metadata: Partial<TaskMetadata>,
  ): Promise<Task> {
    const task = await this.taskStore.getTask(taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found.`);
    }
    task.metadata = { ...task.metadata, ...metadata };
    task.updatedAt = new Date().toISOString();
    await this.taskStore.updateTask(task);
    return task;
  }

  async getRunnableTasks(): Promise<Task[]> {
    const allTasks = await this.taskStore.loadTasks();
    const runnableTasks: Task[] = [];

    for (const task of allTasks) {
      if (task.status === TaskStatus.Todo) {
        const dependenciesMet = task.dependencies.every((depId) => {
          const depTask = allTasks.find((t) => t.id === depId);
          return depTask && depTask.status === TaskStatus.Done;
        });
        if (dependenciesMet) {
          runnableTasks.push(task);
        }
      }
    }
    return runnableTasks;
  }
}
