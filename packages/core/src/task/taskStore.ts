/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import type { Task } from './types.js';

const TASKS_FILE_NAME = '.gemini/tasks.json';

export class TaskStore {
  private tasksFilePath: string;

  constructor(projectRoot: string) {
    this.tasksFilePath = path.join(projectRoot, TASKS_FILE_NAME);
  }

  private async ensureTasksFileExists(): Promise<void> {
    const dir = path.dirname(this.tasksFilePath);
    await fs.mkdir(dir, { recursive: true });
    try {
      await fs.access(this.tasksFilePath);
    } catch (_error) {
      await fs.writeFile(this.tasksFilePath, JSON.stringify([]), 'utf8');
    }
  }

  async loadTasks(): Promise<Task[]> {
    await this.ensureTasksFileExists();
    const data = await fs.readFile(this.tasksFilePath, 'utf8');
    return JSON.parse(data) as Task[];
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    await this.ensureTasksFileExists();
    await fs.writeFile(
      this.tasksFilePath,
      JSON.stringify(tasks, null, 2),
      'utf8',
    );
  }

  async getTask(id: string): Promise<Task | undefined> {
    const tasks = await this.loadTasks();
    return tasks.find((task) => task.id === id);
  }

  async addTask(task: Task): Promise<void> {
    const tasks = await this.loadTasks();
    tasks.push(task);
    await this.saveTasks(tasks);
  }

  async updateTask(updatedTask: Task): Promise<void> {
    const tasks = await this.loadTasks();
    const index = tasks.findIndex((task) => task.id === updatedTask.id);
    if (index !== -1) {
      tasks[index] = updatedTask;
      await this.saveTasks(tasks);
    } else {
      throw new Error(`Task with ID ${updatedTask.id} not found.`);
    }
  }

  async deleteTask(id: string): Promise<void> {
    let tasks = await this.loadTasks();
    const initialLength = tasks.length;
    tasks = tasks.filter((task) => task.id !== id);
    if (tasks.length < initialLength) {
      await this.saveTasks(tasks);
    } else {
      throw new Error(`Task with ID ${id} not found.`);
    }
  }
}
