/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { TaskStore } from '../taskStore';
import type { Task} from '../types';
import { TaskStatus, TaskPriority } from '../types';
import { promises as _fs } from 'node:fs';
import * as path from 'node:path';
import { homedir } from 'node:os';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

const MOCK_TASKS_DIR = path.join(homedir(), '.gemini_test_tasks');
const MOCK_TASKS_FILE = path.join(MOCK_TASKS_DIR, 'tasks.json');

// Mock fs.promises
const mockMkdir = vi.fn();
const mockWriteFile = vi.fn();
const mockReadFile = vi.fn();
const mockRm = vi.fn();

vi.mock('fs/promises', () => ({
  mkdir: mockMkdir,
  writeFile: mockWriteFile,
  readFile: mockReadFile,
  rm: mockRm,
}));

describe('TaskStore', () => {
  let taskStore: TaskStore;

  beforeEach(async () => {
    vi.resetAllMocks();

    // Reset mock implementations for each test
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    mockReadFile.mockResolvedValue('[]'); // Default to empty array
    mockRm.mockResolvedValue(undefined);

    taskStore = new TaskStore(MOCK_TASKS_DIR);
    await taskStore.ensureTasksFileExists();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should load tasks from file', async () => {
    const mockTasks: Task[] = [
      {
        id: '1',
        name: 'Test Task 1',
        description: 'Desc 1',
        status: TaskStatus.Todo,
        priority: TaskPriority.Medium,
        dependencies: [],
        subtasks: [],
        metadata: { toolCalls: [], context: {} },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    mockedFs.readFile.mockResolvedValue(JSON.stringify(mockTasks));

    const loadedTasks = await taskStore.loadTasks();
    expect(loadedTasks).toEqual(mockTasks);
    expect(mockedFs.readFile).toHaveBeenCalledWith(MOCK_TASKS_FILE, 'utf8');
  });

  it('should return empty array if file does not exist', async () => {
    mockedFs.readFile.mockRejectedValue({ code: 'ENOENT' });

    const loadedTasks = await taskStore.loadTasks();
    expect(loadedTasks).toEqual([]);
    expect(mockedFs.readFile).toHaveBeenCalledWith(MOCK_TASKS_FILE, 'utf8');
  });

  it('should save tasks to file', async () => {
    const mockTasks: Task[] = [
      {
        id: '1',
        name: 'Test Task 1',
        description: 'Desc 1',
        status: TaskStatus.Todo,
        priority: TaskPriority.Medium,
        dependencies: [],
        subtasks: [],
        metadata: { toolCalls: [], context: {} },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    await taskStore.saveTasks(mockTasks);
    expect(mockedFs.writeFile).toHaveBeenCalledWith(
      MOCK_TASKS_FILE,
      JSON.stringify(mockTasks, null, 2),
      'utf8',
    );
  });

  it('should add a task', async () => {
    const existingTasks: Task[] = [];
    mockedFs.readFile.mockResolvedValue(JSON.stringify(existingTasks));

    const newTask: Task = {
      id: '2',
      name: 'New Task',
      description: 'New Desc',
      status: TaskStatus.Todo,
      priority: TaskPriority.High,
      dependencies: [],
      subtasks: [],
      metadata: { toolCalls: [], context: {} },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await taskStore.addTask(newTask);

    expect(mockedFs.writeFile).toHaveBeenCalledWith(
      MOCK_TASKS_FILE,
      JSON.stringify([newTask], null, 2),
      'utf8',
    );
  });

  it('should get a task by ID', async () => {
    const mockTasks: Task[] = [
      {
        id: '3',
        name: 'Task 3',
        description: 'Desc 3',
        status: TaskStatus.Todo,
        priority: TaskPriority.Low,
        dependencies: [],
        subtasks: [],
        metadata: { toolCalls: [], context: {} },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    mockedFs.readFile.mockResolvedValue(JSON.stringify(mockTasks));

    const task = await taskStore.getTask('3');
    expect(task).toEqual(mockTasks[0]);
  });

  it('should update an existing task', async () => {
    const existingTask: Task = {
      id: '4',
      name: 'Update Task',
      description: 'Old Desc',
      status: TaskStatus.Todo,
      priority: TaskPriority.Medium,
      dependencies: [],
      subtasks: [],
      metadata: { toolCalls: [], context: {} },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockedFs.readFile.mockResolvedValue(JSON.stringify([existingTask]));

    const updatedTask = { ...existingTask, status: TaskStatus.Done, description: 'New Desc' };
    await taskStore.updateTask(updatedTask);

    expect(mockedFs.writeFile).toHaveBeenCalledWith(
      MOCK_TASKS_FILE,
      JSON.stringify([updatedTask], null, 2),
      'utf8',
    );
  });

  it('should throw error if task to update is not found', async () => {
    mockedFs.readFile.mockResolvedValue(JSON.stringify([]));
    const nonExistentTask: Task = {
      id: 'non-existent',
      name: 'Non Existent',
      description: 'Desc',
      status: TaskStatus.Todo,
      priority: TaskPriority.Medium,
      dependencies: [],
      subtasks: [],
      metadata: { toolCalls: [], context: {} },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await expect(taskStore.updateTask(nonExistentTask)).rejects.toThrow(
      'Task with ID non-existent not found.',
    );
  });

  it('should delete a task', async () => {
    const existingTask: Task = {
      id: '5',
      name: 'Delete Task',
      description: 'Desc',
      status: TaskStatus.Todo,
      priority: TaskPriority.Medium,
      dependencies: [],
      subtasks: [],
      metadata: { toolCalls: [], context: {} },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockedFs.readFile.mockResolvedValue(JSON.stringify([existingTask]));

    await taskStore.deleteTask('5');

    expect(mockedFs.writeFile).toHaveBeenCalledWith(
      MOCK_TASKS_FILE,
      JSON.stringify([], null, 2),
      'utf8',
    );
  });

  it('should throw error if task to delete is not found', async () => {
    mockedFs.readFile.mockResolvedValue(JSON.stringify([]));
    await expect(taskStore.deleteTask('non-existent')).rejects.toThrow(
      'Task with ID non-existent not found.',
    );
  });
});
