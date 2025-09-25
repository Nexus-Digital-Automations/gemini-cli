/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// packages/core/src/task/types.ts
export enum TaskStatus {
  Todo = 'todo',
  InProgress = 'in_progress',
  Done = 'done',
  Failed = 'failed',
  Blocked = 'blocked',
}

export enum TaskPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export interface ToolCall {
  toolName: string;
  args: Record<string, unknown>;
  result?: unknown; // To store the result of the tool call after execution
  error?: string; // To store any error during tool call execution
}

export interface TaskMetadata {
  toolCalls: ToolCall[];
  context: Record<string, unknown>; // Arbitrary data relevant to the task
  // Add any other metadata needed for autonomy, e.g., 'agentInstructions'
}

export interface Task {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string; // ISO date string
  assignee?: string;
  dependencies: string[]; // Array of task IDs
  subtasks: string[]; // Array of task IDs
  metadata: TaskMetadata;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
