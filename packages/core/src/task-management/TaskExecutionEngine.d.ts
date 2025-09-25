/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Config } from '../config/config.js';
import type { ToolRegistry } from '../tools/tool-registry.js';
import type { TaskPriority, Task as BaseTask } from './types.js';
import type { TaskComplexity } from './types.js';
import type { ContextState } from '../core/subagent.js';
/**
 * @fileoverview Comprehensive Task Execution Engine with Intelligent Breakdown
 *
 * This system provides autonomous task breakdown, dependency analysis, execution orchestration,
 * cross-session persistence, and real-time monitoring for complex multi-agent workflows.
 */
/**
 * Task complexity levels determine breakdown strategy and resource allocation
 * (using TaskComplexity enum from types.ts)
 */
/**
 * Task execution status lifecycle (using canonical TaskStatus from types.ts)
 */
/**
 * Task priority levels for execution scheduling (using canonical TaskPriority from types.ts)
 */
/**
 * Task types for specialized handling and agent assignment
 */
export declare enum TaskType {
  IMPLEMENTATION = 'implementation', // Code implementation
  TESTING = 'testing', // Test creation/execution
  VALIDATION = 'validation', // Quality assurance
  DOCUMENTATION = 'documentation', // Documentation creation
  ANALYSIS = 'analysis', // Research and analysis
  DEPLOYMENT = 'deployment', // Deployment and operations
  SECURITY = 'security', // Security assessment/fixes
  PERFORMANCE = 'performance',
}
/**
 * Dependency types for task orchestration
 */
export declare enum DependencyType {
  HARD = 'hard', // Must complete before dependent task starts
  SOFT = 'soft', // Preferred order, can run in parallel if needed
  RESOURCE = 'resource', // Shared resource dependency
  DATA = 'data', // Data flow dependency
  VALIDATION = 'validation',
}
/**
 * Agent capabilities for task assignment
 */
export declare enum AgentCapability {
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  TESTING = 'testing',
  DOCUMENTATION = 'documentation',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  ANALYSIS = 'analysis',
  VALIDATION = 'validation',
  DEPLOYMENT = 'deployment',
}
/**
 * Task dependency relationship
 */
export interface TaskDependency {
  taskId: string;
  dependsOnTaskId: string;
  type: DependencyType;
  description?: string;
}
/**
 * Task breakdown result with subtasks
 */
export interface TaskBreakdown {
  subtasks: Task[];
  dependencies: TaskDependency[];
  estimatedDurationMinutes: number;
  requiredCapabilities: AgentCapability[];
  risksAndMitigation: string[];
}
/**
 * Task execution metrics
 */
export interface TaskMetrics {
  startTime: Date;
  endTime?: Date;
  durationMs?: number;
  tokenUsage: number;
  toolCallsCount: number;
  subAgentCount: number;
  errorCount: number;
  retryCount: number;
}
/**
 * Executable Task interface extending the canonical Task with execution-specific properties
 */
export interface Task extends BaseTask {
  type: TaskType;
  complexity: TaskComplexity;
  progress: number;
  assignedAgent?: string;
  requiredCapabilities: AgentCapability[];
  parentTaskId?: string;
  subtaskIds: string[];
  dependencies: string[];
  maxExecutionTimeMinutes: number;
  maxRetries: number;
  context: Record<string, unknown>;
  expectedOutputs: Record<string, string>;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  metrics?: TaskMetrics;
  retryCount: number;
  outputs?: Record<string, string>;
}
/**
 * Task execution context for agents
 */
export interface TaskExecutionContext {
  task: Task;
  toolRegistry: ToolRegistry;
  config: Config;
  parentContext?: ContextState;
  dependencies: Task[];
  availableAgents: string[];
}
/**
 * Intelligent Task Breakdown Algorithms
 */
export declare class TaskBreakdownAnalyzer {
  private readonly config;
  private readonly toolRegistry;
  constructor(config: Config);
  /**
   * Analyzes task complexity using multiple heuristics
   */
  analyzeComplexity(
    title: string,
    description: string,
  ): Promise<TaskComplexity>;
  /**
   * Breaks down complex tasks into manageable subtasks using AI-assisted analysis
   */
  breakdownTask(task: Task): Promise<TaskBreakdown>;
  /**
   * Identifies task dependencies using graph analysis
   */
  identifyDependencies(tasks: Task[]): Promise<TaskDependency[]>;
  /**
   * Generates AI prompt for task breakdown based on complexity and type
   */
  private generateBreakdownPrompt;
  /**
   * Gets complexity-specific breakdown guidelines
   */
  private getComplexityGuidelines;
  /**
   * Gets type-specific breakdown guidelines
   */
  private getTypeGuidelines;
  /**
   * Parses subtasks from JSON string with error handling
   */
  private parseSubtasks;
  /**
   * Parses dependencies from JSON string with error handling
   */
  private parseDependencies;
  /**
   * Creates a Task object from parsed data
   */
  private createTaskFromData;
  /**
   * Analyzes potential dependency between two tasks
   */
  private analyzeDependency;
}
/**
 * Core Task Execution Engine with autonomous orchestration
 */
export declare class TaskExecutionEngine {
  private readonly config;
  private readonly toolRegistry;
  private readonly breakdownAnalyzer;
  private readonly taskQueue;
  private readonly runningTasks;
  private readonly completedTasks;
  private readonly taskDependencies;
  private onTaskStatusChange?;
  private onTaskComplete?;
  private onTaskFailed?;
  constructor(
    config: Config,
    handlers?: {
      onTaskStatusChange?: (task: Task) => void;
      onTaskComplete?: (task: Task) => void;
      onTaskFailed?: (task: Task, error: string) => void;
    },
  );
  /**
   * Queues a new task for execution with intelligent breakdown
   */
  queueTask(
    title: string,
    description: string,
    options?: Partial<{
      type: TaskType;
      priority: TaskPriority;
      expectedOutputs: Record<string, string>;
      context: Record<string, unknown>;
      maxExecutionTimeMinutes: number;
    }>,
  ): Promise<string>;
  /**
   * Analyzes and breaks down a task asynchronously
   */
  private analyzeAndBreakdownTask;
  /**
   * Schedules task execution based on dependencies and resource availability
   */
  private scheduleTaskExecution;
  /**
   * Executes a task using SubAgentScope with comprehensive monitoring
   */
  private executeTask;
  /**
   * Handles task execution failures with retry logic
   */
  private handleTaskFailure;
  /**
   * Gets default execution time based on complexity
   */
  private getDefaultExecutionTime;
  /**
   * Updates task status and triggers event handlers
   */
  private updateTaskStatus;
}
