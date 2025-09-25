/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
const TASKS_FILE_NAME = '.gemini/tasks.json';
export class TaskStore {
  tasksFilePath;
  constructor(projectRoot) {
    this.tasksFilePath = path.join(projectRoot, TASKS_FILE_NAME);
  }
  async ensureTasksFileExists() {
    const dir = path.dirname(this.tasksFilePath);
    await fs.mkdir(dir, { recursive: true });
    try {
      await fs.access(this.tasksFilePath);
    } catch (_error) {
      await fs.writeFile(this.tasksFilePath, JSON.stringify([]), 'utf8');
    }
  }
  async loadTasks() {
    await this.ensureTasksFileExists();
    const data = await fs.readFile(this.tasksFilePath, 'utf8');
    return JSON.parse(data);
  }
  async saveTasks(tasks) {
    await this.ensureTasksFileExists();
    await fs.writeFile(
      this.tasksFilePath,
      JSON.stringify(tasks, null, 2),
      'utf8',
    );
  }
  async getTask(id) {
    const tasks = await this.loadTasks();
    return tasks.find((task) => task.id === id);
  }
  async addTask(task) {
    const tasks = await this.loadTasks();
    tasks.push(task);
    await this.saveTasks(tasks);
  }
  async updateTask(updatedTask) {
    const tasks = await this.loadTasks();
    const index = tasks.findIndex((task) => task.id === updatedTask.id);
    if (index !== -1) {
      tasks[index] = updatedTask;
      await this.saveTasks(tasks);
    } else {
      throw new Error(`Task with ID ${updatedTask.id} not found.`);
    }
  }
  async deleteTask(id) {
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
//# sourceMappingURL=taskStore.js.map
