/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
/**
 * Task priority levels with intelligent scoring system
 */
export declare enum TaskPriority {
  CRITICAL = 1000, // Security, critical bugs, system failures
  HIGH = 800, // User-blocking issues, major features
  MEDIUM = 500, // Regular features, enhancements
  LOW = 200, // Nice-to-have, optimizations
  BACKGROUND = 50,
}
/**
 * Task execution status
 */
export declare enum TaskStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  RUNNING = 'running',
  BLOCKED = 'blocked',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}
/**
 * Task category for intelligent grouping and optimization
 */
export declare enum TaskCategory {
  FEATURE = 'feature',
  BUG_FIX = 'bug_fix',
  TEST = 'test',
  DOCUMENTATION = 'documentation',
  REFACTOR = 'refactor',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  INFRASTRUCTURE = 'infrastructure',
}
/**
 * Dependency relationship types
 */
export declare enum DependencyType {
  BLOCKS = 'blocks', // Hard dependency - must complete first
  ENABLES = 'enables', // Soft dependency - improves efficiency
  CONFLICTS = 'conflicts', // Cannot run simultaneously
  ENHANCES = 'enhances',
}
/**
 * Task execution context and metadata
 */
export interface TaskContext {
  projectId?: string;
  agentId?: string;
  sessionId?: string;
  userContext?: Record<string, unknown>;
  environmentContext?: Record<string, unknown>;
  executionHistory?: TaskExecutionRecord[];
}
/**
 * Task execution record for history tracking
 */
export interface TaskExecutionRecord {
  taskId: string;
  executionId: string;
  startTime: Date;
  endTime?: Date;
  status: TaskStatus;
  duration?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}
/**
 * Task dependency definition
 */
export interface TaskDependency {
  id: string;
  dependsOnTaskId: string;
  dependentTaskId: string;
  type: DependencyType;
  isOptional: boolean;
  metadata?: Record<string, unknown>;
}
/**
 * Priority adjustment factors for dynamic scheduling
 */
export interface PriorityFactors {
  age: number;
  userImportance: number;
  systemCriticality: number;
  dependencyWeight: number;
  resourceAvailability: number;
  executionHistory: number;
}
/**
 * Comprehensive task definition with autonomous capabilities
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  estimatedDuration: number;
  actualDuration?: number;
  maxRetries: number;
  currentRetries: number;
  createdAt: Date;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  deadline?: Date;
  dependencies: string[];
  dependents: string[];
  context: TaskContext;
  basePriority: TaskPriority;
  dynamicPriority: number;
  priorityFactors: PriorityFactors;
  executeFunction: (
    task: Task,
    context: TaskContext,
  ) => Promise<TaskExecutionResult>;
  validateFunction?: (task: Task, context: TaskContext) => Promise<boolean>;
  rollbackFunction?: (task: Task, context: TaskContext) => Promise<void>;
  tags: string[];
  metadata: Record<string, unknown>;
  requiredResources: string[];
  resourceConstraints: Record<string, unknown>;
  preConditions: string[];
  postConditions: string[];
  progressCallback?: (progress: number, message: string) => void;
  batchCompatible: boolean;
  batchGroup?: string;
  results?: Record<string, unknown>;
  lastError?: string;
  metrics?: {
    startTime: Date;
    endTime?: Date;
    durationMs?: number;
    tokenUsage?: number;
    toolCallsCount?: number;
    subAgentCount?: number;
    errorCount?: number;
    retryCount?: number;
    memoryUsage?: number;
    cpuUsage?: number;
  };
}
/**
 * Task execution result
 */
export interface TaskExecutionResult {
  success: boolean;
  result?: unknown;
  error?: Error;
  duration: number;
  metadata?: Record<string, unknown>;
  artifacts?: string[];
  nextTasks?: Array<Partial<Task>>;
}
/**
 * Queue statistics and metrics
 */
export interface QueueMetrics {
  totalTasks: number;
  pendingTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageWaitTime: number;
  averageExecutionTime: number;
  throughputPerHour: number;
  successRate: number;
  priorityDistribution: Record<TaskPriority, number>;
  categoryDistribution: Record<TaskCategory, number>;
}
/**
 * Advanced task queue options
 */
export interface TaskQueueOptions {
  maxConcurrentTasks: number;
  maxRetries: number;
  defaultTimeout: number;
  priorityAdjustmentInterval: number;
  enableBatching: boolean;
  enableParallelExecution: boolean;
  enableSmartScheduling: boolean;
  enableQueueOptimization: boolean;
  persistenceEnabled: boolean;
  metricsEnabled: boolean;
}
/**
 * Intelligent Task Queue with autonomous scheduling and execution
 */
export declare class TaskQueue extends EventEmitter {
  private tasks;
  private dependencies;
  private runningTasks;
  private completedTasks;
  private failedTasks;
  private options;
  private priorityAdjustmentTimer?;
  private queueOptimizationTimer?;
  private metrics;
  constructor(options?: Partial<TaskQueueOptions>);
  /**
   * Add a new task to the queue with intelligent priority assignment
   */
  addTask(
    taskDefinition: Partial<Task> &
      Pick<Task, 'title' | 'description' | 'executeFunction'>,
  ): Promise<string>;
  /**
   * Add a dependency between two tasks
   */
  addDependency(
    dependentId: string,
    dependsOnId: string,
    type?: DependencyType,
    isOptional?: boolean,
  ): void;
  /**
   * Intelligent task scheduling with priority and dependency resolution
   */
  private scheduleNextTasks;
  /**
   * Get tasks that are eligible for execution (dependencies satisfied)
   */
  private getEligibleTasks;
  /**
   * Select optimal tasks for execution using advanced algorithms
   */
  private selectOptimalTasks;
  /**
   * Calculate execution score for task selection optimization
   */
  private calculateExecutionScore;
  /**
   * Find tasks that can be batched with the given task
   */
  private findBatchableTasks;
  /**
   * Execute a task with comprehensive monitoring and error handling
   */
  private executeTask;
  /**
   * Dynamic priority adjustment based on queue state and execution history
   */
  private adjustTaskPriorities;
  /**
   * Validate task pre-conditions
   */
  private validatePreConditions;
  /**
   * Simple condition evaluator (can be enhanced with a proper expression parser)
   */
  private evaluateCondition;
  /**
   * Calculate dependency chain length for optimization
   */
  private calculateDependencyChainLength;
  /**
   * Count resource conflicts with already selected tasks
   */
  private countResourceConflicts;
  /**
   * Find similar completed tasks for historical analysis
   */
  private findSimilarCompletedTasks;
  /**
   * Update queue metrics
   */
  private updateMetrics;
  /**
   * Start periodic optimization processes
   */
  private startPeriodicOptimization;
  /**
   * Optimize queue order for better throughput
   */
  private optimizeQueueOrder;
  /**
   * Detect circular dependencies and deadlocks
   */
  private detectAndResolveDeadlocks;
  /**
   * Optimize dependency chains for parallel execution
   */
  private optimizeDependencyChains;
  /**
   * Identify groups of tasks that can run independently
   */
  private identifyIndependentGroups;
  /**
   * Get all tasks connected by dependencies
   */
  private getConnectedTasks;
  /**
   * Get task by ID
   */
  getTask(taskId: string): Task | undefined;
  /**
   * Get all tasks with optional filtering
   */
  getTasks(filter?: (task: Task) => boolean): Task[];
  /**
   * Cancel a task
   */
  cancelTask(taskId: string, reason?: string): Promise<boolean>;
  /**
   * Get current queue metrics
   */
  getMetrics(): QueueMetrics;
  /**
   * Clear completed and failed tasks
   */
  cleanup(olderThanMs?: number): void;
  /**
   * Pause the queue (stop scheduling new tasks)
   */
  pause(): void;
  /**
   * Resume the queue
   */
  resume(): void;
  /**
   * Shutdown the queue gracefully
   */
  shutdown(timeoutMs?: number): Promise<void>;
}
