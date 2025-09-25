/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import type { Task } from './TaskQueue.js';
import type { TaskId } from './types.js';
/**
 * Task lifecycle states with detailed substates
 */
export declare enum LifecycleState {
  CREATED = 'created',
  VALIDATED = 'validated',
  QUEUED = 'queued',
  SCHEDULED = 'scheduled',
  PREPARING = 'preparing',
  RESOURCE_ALLOCATED = 'resource_allocated',
  STARTING = 'starting',
  RUNNING = 'running',
  PAUSED = 'paused',
  RESUMING = 'resuming',
  COMPLETING = 'completing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETRYING = 'retrying',
  ROLLING_BACK = 'rolling_back',
  CLEANED_UP = 'cleaned_up',
  BLOCKED = 'blocked',
  EXPIRED = 'expired',
  ARCHIVED = 'archived',
}
/**
 * Lifecycle transition rules
 */
export interface LifecycleTransition {
  from: LifecycleState;
  to: LifecycleState;
  conditions: string[];
  actions: string[];
  metadata?: Record<string, unknown>;
}
/**
 * Task lifecycle event
 */
export interface LifecycleEvent {
  id: string;
  taskId: TaskId;
  timestamp: Date;
  previousState: LifecycleState;
  newState: LifecycleState;
  trigger: 'manual' | 'automatic' | 'system' | 'error' | 'timeout';
  metadata: {
    triggeredBy?: string;
    reason?: string;
    context?: Record<string, unknown>;
    duration?: number;
    retryCount?: number;
    errorDetails?: {
      message: string;
      stack?: string;
      code?: string;
    };
  };
}
/**
 * Lifecycle hook definition
 */
export interface LifecycleHook {
  id: string;
  state: LifecycleState;
  timing: 'before' | 'after' | 'during';
  condition?: (task: Task, context: LifecycleContext) => Promise<boolean>;
  action: (task: Task, context: LifecycleContext) => Promise<void>;
  priority: number;
  enabled: boolean;
  metadata?: Record<string, unknown>;
}
/**
 * Lifecycle context for decision making and state management
 */
export interface LifecycleContext {
  taskId: TaskId;
  currentState: LifecycleState;
  previousStates: LifecycleState[];
  stateHistory: LifecycleEvent[];
  metadata: Record<string, unknown>;
  executionAttempts: number;
  totalDuration: number;
  resources: {
    allocated: string[];
    used: Map<string, number>;
    released: string[];
  };
  dependencies: {
    blocking: TaskId[];
    blocked: TaskId[];
    satisfied: TaskId[];
  };
  validation: {
    preConditions: Array<{
      condition: string;
      status: 'pending' | 'passed' | 'failed';
      message?: string;
    }>;
    postConditions: Array<{
      condition: string;
      status: 'pending' | 'passed' | 'failed';
      message?: string;
    }>;
  };
}
/**
 * Lifecycle statistics and metrics
 */
export interface LifecycleMetrics {
  taskId: TaskId;
  totalLifecycleDuration: number;
  stateDistribution: Map<LifecycleState, number>;
  averageStateTransitionTime: number;
  transitionCounts: Map<string, number>;
  retryCount: number;
  rollbackCount: number;
  hookExecutionCount: number;
  validationFailures: number;
  resourceAllocationTime: number;
  actualVsEstimatedDuration: number;
  anomalies: Array<{
    type: string;
    description: string;
    timestamp: Date;
  }>;
}
/**
 * Comprehensive task lifecycle manager with state machine and hooks
 */
export declare class TaskLifecycle extends EventEmitter {
  private options;
  private lifecycleContexts;
  private lifecycleEvents;
  private lifecycleHooks;
  private transitionRules;
  private metrics;
  private activeTransitions;
  private pausedTasks;
  private cleanupTimer?;
  constructor(options?: {
    enableStateValidation?: boolean;
    maxHistoryPerTask?: number;
    cleanupInterval?: number;
    transitionTimeout?: number;
    enableHooks?: boolean;
    enableMetrics?: boolean;
  });
  /**
   * Initialize a new task in the lifecycle system
   */
  initializeTask(task: Task): Promise<LifecycleContext>;
  /**
   * Transition task to a new lifecycle state
   */
  transitionTo(
    taskId: TaskId,
    newState: LifecycleState,
    trigger?: LifecycleEvent['trigger'],
    metadata?: Record<string, unknown>,
  ): Promise<boolean>;
  /**
   * Get current lifecycle context for a task
   */
  getLifecycleContext(taskId: TaskId): LifecycleContext | undefined;
  /**
   * Get lifecycle history for a task
   */
  getLifecycleHistory(taskId: TaskId): LifecycleEvent[];
  /**
   * Check if a task is in a specific state
   */
  isInState(taskId: TaskId, state: LifecycleState): boolean;
  /**
   * Check if a task can transition to a specific state
   */
  canTransitionTo(taskId: TaskId, newState: LifecycleState): boolean;
  /**
   * Pause a task (if in running state)
   */
  pauseTask(taskId: TaskId, reason?: string): Promise<boolean>;
  /**
   * Resume a paused task
   */
  resumeTask(taskId: TaskId, reason?: string): Promise<boolean>;
  /**
   * Cancel a task
   */
  cancelTask(taskId: TaskId, reason?: string): Promise<boolean>;
  /**
   * Retry a failed task
   */
  retryTask(taskId: TaskId, reason?: string): Promise<boolean>;
  /**
   * Register a lifecycle hook
   */
  registerHook(hook: LifecycleHook): void;
  /**
   * Unregister a lifecycle hook
   */
  unregisterHook(hookId: string): boolean;
  /**
   * Get lifecycle metrics for a task
   */
  getLifecycleMetrics(taskId: TaskId): LifecycleMetrics | undefined;
  /**
   * Get aggregate lifecycle metrics
   */
  getAggregateMetrics(): {
    totalTasks: number;
    stateDistribution: Map<LifecycleState, number>;
    averageLifecycleDuration: number;
    successRate: number;
    retryRate: number;
    mostCommonTransitions: Array<{
      transition: string;
      count: number;
    }>;
  };
  /**
   * Clean up completed/failed task data
   */
  cleanup(olderThanMs?: number): Promise<number>;
  /**
   * Validate pre-conditions for a task
   */
  validatePreConditions(taskId: TaskId): Promise<boolean>;
  /**
   * Validate post-conditions for a task
   */
  validatePostConditions(taskId: TaskId): Promise<boolean>;
  /**
   * Initialize default transition rules
   */
  private initializeTransitionRules;
  /**
   * Initialize default lifecycle hooks
   */
  private initializeDefaultHooks;
  /**
   * Check if a state transition is valid
   */
  private isValidTransition;
  /**
   * Perform state-specific actions during transitions
   */
  private performStateActions;
  /**
   * Execute a specific state action
   */
  private executeStateAction;
  /**
   * Execute lifecycle hooks for a state
   */
  private executeHooks;
  /**
   * Record a lifecycle event
   */
  private recordEvent;
  /**
   * Initialize metrics for a task
   */
  private initializeMetrics;
  /**
   * Update metrics based on lifecycle events
   */
  private updateMetrics;
  /**
   * Finalize metrics when task completes
   */
  private finalizeMetrics;
  /**
   * Simple condition evaluator
   */
  private evaluateCondition;
  /**
   * Get task (placeholder - would integrate with actual task store)
   */
  private getTask;
  /**
   * Get task synchronously (placeholder)
   */
  private getTaskSync;
  /**
   * Start cleanup process
   */
  private startCleanupProcess;
  /**
   * Shutdown the lifecycle manager
   */
  shutdown(): Promise<void>;
}
