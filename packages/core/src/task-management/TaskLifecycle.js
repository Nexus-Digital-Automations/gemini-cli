/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import {
  TaskStatus,
  TaskExecutionRecord,
  TaskExecutionResult,
} from './TaskQueue.js';
/**
 * Task lifecycle states with detailed substates
 */
export var LifecycleState;
(function (LifecycleState) {
  // Creation and initialization
  LifecycleState['CREATED'] = 'created';
  LifecycleState['VALIDATED'] = 'validated';
  LifecycleState['QUEUED'] = 'queued';
  // Pre-execution
  LifecycleState['SCHEDULED'] = 'scheduled';
  LifecycleState['PREPARING'] = 'preparing';
  LifecycleState['RESOURCE_ALLOCATED'] = 'resource_allocated';
  // Execution
  LifecycleState['STARTING'] = 'starting';
  LifecycleState['RUNNING'] = 'running';
  LifecycleState['PAUSED'] = 'paused';
  LifecycleState['RESUMING'] = 'resuming';
  // Post-execution
  LifecycleState['COMPLETING'] = 'completing';
  LifecycleState['COMPLETED'] = 'completed';
  LifecycleState['FAILED'] = 'failed';
  LifecycleState['CANCELLED'] = 'cancelled';
  // Recovery and cleanup
  LifecycleState['RETRYING'] = 'retrying';
  LifecycleState['ROLLING_BACK'] = 'rolling_back';
  LifecycleState['CLEANED_UP'] = 'cleaned_up';
  // Special states
  LifecycleState['BLOCKED'] = 'blocked';
  LifecycleState['EXPIRED'] = 'expired';
  LifecycleState['ARCHIVED'] = 'archived';
})(LifecycleState || (LifecycleState = {}));
/**
 * Comprehensive task lifecycle manager with state machine and hooks
 */
export class TaskLifecycle extends EventEmitter {
  options;
  lifecycleContexts = new Map();
  lifecycleEvents = new Map();
  lifecycleHooks = new Map();
  transitionRules = new Map();
  metrics = new Map();
  // State management
  activeTransitions = new Set();
  pausedTasks = new Set();
  cleanupTimer;
  constructor(options = {}) {
    super();
    this.options = options;
    this.options = {
      enableStateValidation: true,
      maxHistoryPerTask: 100,
      cleanupInterval: 300000, // 5 minutes
      transitionTimeout: 30000, // 30 seconds
      enableHooks: true,
      enableMetrics: true,
      ...options,
    };
    this.initializeTransitionRules();
    this.initializeDefaultHooks();
    this.startCleanupProcess();
    logger.info('TaskLifecycle manager initialized', {
      options: this.options,
    });
  }
  /**
   * Initialize a new task in the lifecycle system
   */
  async initializeTask(task) {
    const context = {
      taskId: task.id,
      currentState: LifecycleState.CREATED,
      previousStates: [],
      stateHistory: [],
      metadata: { ...task.metadata },
      executionAttempts: 0,
      totalDuration: 0,
      resources: {
        allocated: [],
        used: new Map(),
        released: [],
      },
      dependencies: {
        blocking: [...task.dependencies],
        blocked: [...task.dependents],
        satisfied: [],
      },
      validation: {
        preConditions: task.preConditions.map((condition) => ({
          condition,
          status: 'pending',
        })),
        postConditions: task.postConditions.map((condition) => ({
          condition,
          status: 'pending',
        })),
      },
    };
    this.lifecycleContexts.set(task.id, context);
    this.lifecycleEvents.set(task.id, []);
    if (this.options.enableMetrics) {
      this.initializeMetrics(task.id);
    }
    // Create initial lifecycle event
    const event = {
      id: uuidv4(),
      taskId: task.id,
      timestamp: new Date(),
      previousState: LifecycleState.CREATED,
      newState: LifecycleState.CREATED,
      trigger: 'system',
      metadata: {
        triggeredBy: 'TaskLifecycle.initializeTask',
        reason: 'Task lifecycle initialization',
      },
    };
    await this.recordEvent(event);
    logger.debug(`Task lifecycle initialized: ${task.title}`, {
      taskId: task.id,
      initialState: context.currentState,
    });
    this.emit('taskInitialized', task, context);
    // Execute initialization hooks
    if (this.options.enableHooks) {
      await this.executeHooks(LifecycleState.CREATED, 'after', task, context);
    }
    return context;
  }
  /**
   * Transition task to a new lifecycle state
   */
  async transitionTo(taskId, newState, trigger = 'manual', metadata = {}) {
    const context = this.lifecycleContexts.get(taskId);
    if (!context) {
      logger.warn(`Cannot transition unknown task: ${taskId}`);
      return false;
    }
    const currentState = context.currentState;
    // Prevent concurrent transitions
    if (this.activeTransitions.has(taskId)) {
      logger.warn(`Task ${taskId} already in transition, skipping`);
      return false;
    }
    try {
      this.activeTransitions.add(taskId);
      // Validate transition
      if (
        this.options.enableStateValidation &&
        !this.isValidTransition(currentState, newState)
      ) {
        logger.warn(
          `Invalid state transition: ${currentState} -> ${newState}`,
          { taskId },
        );
        return false;
      }
      const transitionStart = Date.now();
      // Execute before hooks
      if (this.options.enableHooks) {
        await this.executeHooks(
          newState,
          'before',
          await this.getTask(taskId),
          context,
        );
      }
      // Perform state-specific actions
      await this.performStateActions(taskId, currentState, newState, context);
      // Update context
      context.previousStates.push(currentState);
      context.currentState = newState;
      context.metadata = { ...context.metadata, ...metadata };
      // Create transition event
      const event = {
        id: uuidv4(),
        taskId,
        timestamp: new Date(),
        previousState: currentState,
        newState,
        trigger,
        metadata: {
          ...metadata,
          duration: Date.now() - transitionStart,
        },
      };
      await this.recordEvent(event);
      // Update metrics
      if (this.options.enableMetrics) {
        this.updateMetrics(taskId, event);
      }
      logger.info(`Task state transition: ${currentState} -> ${newState}`, {
        taskId,
        trigger,
        duration: Date.now() - transitionStart,
      });
      this.emit('stateTransition', taskId, currentState, newState, event);
      // Execute after hooks
      if (this.options.enableHooks) {
        await this.executeHooks(
          newState,
          'after',
          await this.getTask(taskId),
          context,
        );
      }
      return true;
    } catch (error) {
      logger.error(`State transition failed: ${currentState} -> ${newState}`, {
        taskId,
        error: error instanceof Error ? error.message : String(error),
      });
      this.emit('transitionError', taskId, currentState, newState, error);
      return false;
    } finally {
      this.activeTransitions.delete(taskId);
    }
  }
  /**
   * Get current lifecycle context for a task
   */
  getLifecycleContext(taskId) {
    return this.lifecycleContexts.get(taskId);
  }
  /**
   * Get lifecycle history for a task
   */
  getLifecycleHistory(taskId) {
    return this.lifecycleEvents.get(taskId) || [];
  }
  /**
   * Check if a task is in a specific state
   */
  isInState(taskId, state) {
    const context = this.lifecycleContexts.get(taskId);
    return context?.currentState === state;
  }
  /**
   * Check if a task can transition to a specific state
   */
  canTransitionTo(taskId, newState) {
    const context = this.lifecycleContexts.get(taskId);
    if (!context) return false;
    return this.isValidTransition(context.currentState, newState);
  }
  /**
   * Pause a task (if in running state)
   */
  async pauseTask(taskId, reason = 'Manual pause') {
    const context = this.lifecycleContexts.get(taskId);
    if (!context || context.currentState !== LifecycleState.RUNNING) {
      return false;
    }
    this.pausedTasks.add(taskId);
    return this.transitionTo(taskId, LifecycleState.PAUSED, 'manual', {
      reason,
      pausedAt: new Date().toISOString(),
    });
  }
  /**
   * Resume a paused task
   */
  async resumeTask(taskId, reason = 'Manual resume') {
    const context = this.lifecycleContexts.get(taskId);
    if (!context || context.currentState !== LifecycleState.PAUSED) {
      return false;
    }
    this.pausedTasks.delete(taskId);
    // First transition to resuming, then to running
    await this.transitionTo(taskId, LifecycleState.RESUMING, 'manual', {
      reason,
    });
    // Short delay to allow resume preparation
    setTimeout(() => {
      this.transitionTo(taskId, LifecycleState.RUNNING, 'automatic', {
        resumedAt: new Date().toISOString(),
      });
    }, 100);
    return true;
  }
  /**
   * Cancel a task
   */
  async cancelTask(taskId, reason = 'Manual cancellation') {
    const context = this.lifecycleContexts.get(taskId);
    if (!context) return false;
    // Can cancel from most states except completed/failed/already cancelled
    const nonCancellableStates = [
      LifecycleState.COMPLETED,
      LifecycleState.FAILED,
      LifecycleState.CANCELLED,
      LifecycleState.ARCHIVED,
    ];
    if (nonCancellableStates.includes(context.currentState)) {
      return false;
    }
    return this.transitionTo(taskId, LifecycleState.CANCELLED, 'manual', {
      reason,
      cancelledAt: new Date().toISOString(),
    });
  }
  /**
   * Retry a failed task
   */
  async retryTask(taskId, reason = 'Manual retry') {
    const context = this.lifecycleContexts.get(taskId);
    if (!context || context.currentState !== LifecycleState.FAILED) {
      return false;
    }
    context.executionAttempts += 1;
    // Transition through retrying state back to queued
    await this.transitionTo(taskId, LifecycleState.RETRYING, 'manual', {
      reason,
      attempt: context.executionAttempts,
    });
    // After brief delay, move to queued for re-execution
    setTimeout(() => {
      this.transitionTo(taskId, LifecycleState.QUEUED, 'automatic', {
        requeued: true,
        attempt: context.executionAttempts,
      });
    }, 1000);
    return true;
  }
  /**
   * Register a lifecycle hook
   */
  registerHook(hook) {
    const stateHooks = this.lifecycleHooks.get(hook.state) || [];
    stateHooks.push(hook);
    stateHooks.sort((a, b) => b.priority - a.priority);
    this.lifecycleHooks.set(hook.state, stateHooks);
    logger.debug(`Lifecycle hook registered: ${hook.id}`, {
      state: hook.state,
      timing: hook.timing,
      priority: hook.priority,
    });
  }
  /**
   * Unregister a lifecycle hook
   */
  unregisterHook(hookId) {
    for (const [state, hooks] of this.lifecycleHooks.entries()) {
      const index = hooks.findIndex((h) => h.id === hookId);
      if (index > -1) {
        hooks.splice(index, 1);
        logger.debug(`Lifecycle hook unregistered: ${hookId}`, { state });
        return true;
      }
    }
    return false;
  }
  /**
   * Get lifecycle metrics for a task
   */
  getLifecycleMetrics(taskId) {
    if (!this.options.enableMetrics) return undefined;
    return this.metrics.get(taskId);
  }
  /**
   * Get aggregate lifecycle metrics
   */
  getAggregateMetrics() {
    const totalTasks = this.lifecycleContexts.size;
    const stateDistribution = new Map();
    const transitionCounts = new Map();
    let totalDuration = 0;
    let completedTasks = 0;
    let failedTasks = 0;
    let totalRetries = 0;
    for (const context of this.lifecycleContexts.values()) {
      // State distribution
      const currentCount = stateDistribution.get(context.currentState) || 0;
      stateDistribution.set(context.currentState, currentCount + 1);
      // Duration
      totalDuration += context.totalDuration;
      // Success/failure counts
      if (context.currentState === LifecycleState.COMPLETED) completedTasks++;
      if (context.currentState === LifecycleState.FAILED) failedTasks++;
      // Retry count
      totalRetries += context.executionAttempts;
      // Transitions
      const events = this.lifecycleEvents.get(context.taskId) || [];
      for (const event of events) {
        const transition = `${event.previousState}->${event.newState}`;
        const count = transitionCounts.get(transition) || 0;
        transitionCounts.set(transition, count + 1);
      }
    }
    const mostCommonTransitions = Array.from(transitionCounts.entries())
      .map(([transition, count]) => ({ transition, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    return {
      totalTasks,
      stateDistribution,
      averageLifecycleDuration: totalTasks > 0 ? totalDuration / totalTasks : 0,
      successRate:
        completedTasks + failedTasks > 0
          ? completedTasks / (completedTasks + failedTasks)
          : 0,
      retryRate: totalTasks > 0 ? totalRetries / totalTasks : 0,
      mostCommonTransitions,
    };
  }
  /**
   * Clean up completed/failed task data
   */
  async cleanup(olderThanMs = 24 * 60 * 60 * 1000) {
    const cutoff = Date.now() - olderThanMs;
    const tasksToClean = [];
    for (const [taskId, context] of this.lifecycleContexts.entries()) {
      const finalStates = [
        LifecycleState.COMPLETED,
        LifecycleState.FAILED,
        LifecycleState.CANCELLED,
        LifecycleState.ARCHIVED,
      ];
      if (finalStates.includes(context.currentState)) {
        const events = this.lifecycleEvents.get(taskId) || [];
        const lastEvent = events[events.length - 1];
        if (lastEvent && lastEvent.timestamp.getTime() < cutoff) {
          tasksToClean.push(taskId);
        }
      }
    }
    // Transition to archived before cleanup
    for (const taskId of tasksToClean) {
      if (!this.isInState(taskId, LifecycleState.ARCHIVED)) {
        await this.transitionTo(taskId, LifecycleState.ARCHIVED, 'system', {
          reason: 'Automated cleanup',
          cleanupTimestamp: new Date().toISOString(),
        });
      }
      // Wait a bit then remove from memory
      setTimeout(() => {
        this.lifecycleContexts.delete(taskId);
        this.lifecycleEvents.delete(taskId);
        this.metrics.delete(taskId);
      }, 5000);
    }
    logger.info(`Lifecycle cleanup completed`, {
      tasksCleaned: tasksToClean.length,
      cutoffTime: new Date(cutoff),
    });
    return tasksToClean.length;
  }
  /**
   * Validate pre-conditions for a task
   */
  async validatePreConditions(taskId) {
    const context = this.lifecycleContexts.get(taskId);
    if (!context) return false;
    let allPassed = true;
    for (const preCondition of context.validation.preConditions) {
      try {
        // Simple condition evaluation - would need proper expression evaluator in production
        const passed = await this.evaluateCondition(
          preCondition.condition,
          context,
        );
        preCondition.status = passed ? 'passed' : 'failed';
        if (!passed) {
          allPassed = false;
          preCondition.message = `Pre-condition failed: ${preCondition.condition}`;
        }
      } catch (error) {
        preCondition.status = 'failed';
        preCondition.message = `Error evaluating condition: ${error instanceof Error ? error.message : String(error)}`;
        allPassed = false;
      }
    }
    return allPassed;
  }
  /**
   * Validate post-conditions for a task
   */
  async validatePostConditions(taskId) {
    const context = this.lifecycleContexts.get(taskId);
    if (!context) return false;
    let allPassed = true;
    for (const postCondition of context.validation.postConditions) {
      try {
        const passed = await this.evaluateCondition(
          postCondition.condition,
          context,
        );
        postCondition.status = passed ? 'passed' : 'failed';
        if (!passed) {
          allPassed = false;
          postCondition.message = `Post-condition failed: ${postCondition.condition}`;
        }
      } catch (error) {
        postCondition.status = 'failed';
        postCondition.message = `Error evaluating condition: ${error instanceof Error ? error.message : String(error)}`;
        allPassed = false;
      }
    }
    return allPassed;
  }
  /**
   * Initialize default transition rules
   */
  initializeTransitionRules() {
    const rules = [
      // Creation flow
      {
        from: LifecycleState.CREATED,
        to: LifecycleState.VALIDATED,
        conditions: [],
        actions: ['validate'],
      },
      {
        from: LifecycleState.VALIDATED,
        to: LifecycleState.QUEUED,
        conditions: [],
        actions: ['queue'],
      },
      // Execution preparation
      {
        from: LifecycleState.QUEUED,
        to: LifecycleState.SCHEDULED,
        conditions: [],
        actions: ['schedule'],
      },
      {
        from: LifecycleState.SCHEDULED,
        to: LifecycleState.PREPARING,
        conditions: [],
        actions: ['prepare'],
      },
      {
        from: LifecycleState.PREPARING,
        to: LifecycleState.RESOURCE_ALLOCATED,
        conditions: [],
        actions: ['allocateResources'],
      },
      // Execution
      {
        from: LifecycleState.RESOURCE_ALLOCATED,
        to: LifecycleState.STARTING,
        conditions: [],
        actions: ['start'],
      },
      {
        from: LifecycleState.STARTING,
        to: LifecycleState.RUNNING,
        conditions: [],
        actions: ['run'],
      },
      {
        from: LifecycleState.RUNNING,
        to: LifecycleState.PAUSED,
        conditions: [],
        actions: ['pause'],
      },
      {
        from: LifecycleState.PAUSED,
        to: LifecycleState.RESUMING,
        conditions: [],
        actions: ['resume'],
      },
      {
        from: LifecycleState.RESUMING,
        to: LifecycleState.RUNNING,
        conditions: [],
        actions: ['run'],
      },
      // Completion
      {
        from: LifecycleState.RUNNING,
        to: LifecycleState.COMPLETING,
        conditions: [],
        actions: ['complete'],
      },
      {
        from: LifecycleState.COMPLETING,
        to: LifecycleState.COMPLETED,
        conditions: [],
        actions: ['finalize'],
      },
      // Failure and recovery
      {
        from: LifecycleState.RUNNING,
        to: LifecycleState.FAILED,
        conditions: [],
        actions: ['handleFailure'],
      },
      {
        from: LifecycleState.FAILED,
        to: LifecycleState.RETRYING,
        conditions: [],
        actions: ['retry'],
      },
      {
        from: LifecycleState.RETRYING,
        to: LifecycleState.QUEUED,
        conditions: [],
        actions: ['requeue'],
      },
      {
        from: LifecycleState.FAILED,
        to: LifecycleState.ROLLING_BACK,
        conditions: [],
        actions: ['rollback'],
      },
      {
        from: LifecycleState.ROLLING_BACK,
        to: LifecycleState.FAILED,
        conditions: [],
        actions: ['markFailed'],
      },
      // Cancellation
      {
        from: LifecycleState.QUEUED,
        to: LifecycleState.CANCELLED,
        conditions: [],
        actions: ['cancel'],
      },
      {
        from: LifecycleState.SCHEDULED,
        to: LifecycleState.CANCELLED,
        conditions: [],
        actions: ['cancel'],
      },
      {
        from: LifecycleState.PREPARING,
        to: LifecycleState.CANCELLED,
        conditions: [],
        actions: ['cancel'],
      },
      {
        from: LifecycleState.RUNNING,
        to: LifecycleState.CANCELLED,
        conditions: [],
        actions: ['cancel'],
      },
      {
        from: LifecycleState.PAUSED,
        to: LifecycleState.CANCELLED,
        conditions: [],
        actions: ['cancel'],
      },
      // Cleanup and archival
      {
        from: LifecycleState.COMPLETED,
        to: LifecycleState.ARCHIVED,
        conditions: [],
        actions: ['archive'],
      },
      {
        from: LifecycleState.FAILED,
        to: LifecycleState.ARCHIVED,
        conditions: [],
        actions: ['archive'],
      },
      {
        from: LifecycleState.CANCELLED,
        to: LifecycleState.ARCHIVED,
        conditions: [],
        actions: ['archive'],
      },
    ];
    for (const rule of rules) {
      const key = `${rule.from}->${rule.to}`;
      this.transitionRules.set(key, rule);
    }
  }
  /**
   * Initialize default lifecycle hooks
   */
  initializeDefaultHooks() {
    // Resource allocation hook
    this.registerHook({
      id: 'allocate-resources',
      state: LifecycleState.RESOURCE_ALLOCATED,
      timing: 'before',
      action: async (task, context) => {
        // Simulate resource allocation
        context.resources.allocated = [...task.requiredResources];
        logger.debug(`Resources allocated for task: ${task.id}`, {
          resources: context.resources.allocated,
        });
      },
      priority: 100,
      enabled: true,
    });
    // Resource cleanup hook
    this.registerHook({
      id: 'release-resources',
      state: LifecycleState.COMPLETED,
      timing: 'after',
      action: async (task, context) => {
        context.resources.released = [...context.resources.allocated];
        context.resources.allocated = [];
        logger.debug(`Resources released for task: ${task.id}`, {
          resources: context.resources.released,
        });
      },
      priority: 100,
      enabled: true,
    });
    // Pre-condition validation hook
    this.registerHook({
      id: 'validate-preconditions',
      state: LifecycleState.STARTING,
      timing: 'before',
      condition: async (task, context) => task.preConditions.length > 0,
      action: async (task, context) => {
        const valid = await this.validatePreConditions(task.id);
        if (!valid) {
          throw new Error('Pre-conditions validation failed');
        }
      },
      priority: 200,
      enabled: true,
    });
    // Post-condition validation hook
    this.registerHook({
      id: 'validate-postconditions',
      state: LifecycleState.COMPLETING,
      timing: 'before',
      condition: async (task, context) => task.postConditions.length > 0,
      action: async (task, context) => {
        const valid = await this.validatePostConditions(task.id);
        if (!valid) {
          throw new Error('Post-conditions validation failed');
        }
      },
      priority: 200,
      enabled: true,
    });
    // Metrics collection hook
    this.registerHook({
      id: 'collect-metrics',
      state: LifecycleState.COMPLETED,
      timing: 'after',
      action: async (task, context) => {
        if (this.options.enableMetrics) {
          this.finalizeMetrics(task.id);
        }
      },
      priority: 50,
      enabled: this.options.enableMetrics || false,
    });
  }
  /**
   * Check if a state transition is valid
   */
  isValidTransition(from, to) {
    const key = `${from}->${to}`;
    return this.transitionRules.has(key);
  }
  /**
   * Perform state-specific actions during transitions
   */
  async performStateActions(taskId, from, to, context) {
    const key = `${from}->${to}`;
    const rule = this.transitionRules.get(key);
    if (!rule) return;
    // Execute rule-defined actions
    for (const action of rule.actions) {
      await this.executeStateAction(action, taskId, context);
    }
    // Update timing
    const now = Date.now();
    if (to === LifecycleState.RUNNING && context.executionAttempts === 0) {
      context.metadata.executionStartTime = now;
    }
    if (
      [
        LifecycleState.COMPLETED,
        LifecycleState.FAILED,
        LifecycleState.CANCELLED,
      ].includes(to)
    ) {
      const startTime = context.metadata.executionStartTime;
      if (startTime) {
        context.totalDuration = now - startTime;
      }
    }
  }
  /**
   * Execute a specific state action
   */
  async executeStateAction(action, taskId, context) {
    logger.debug(`Executing state action: ${action}`, { taskId });
    switch (action) {
      case 'validate':
        // Basic validation - can be extended
        break;
      case 'queue':
        // Add to execution queue
        break;
      case 'allocateResources':
        // Resource allocation handled by hook
        break;
      case 'start':
        context.metadata.startTime = Date.now();
        break;
      case 'complete':
        context.metadata.endTime = Date.now();
        break;
      case 'handleFailure':
        context.metadata.failureTime = Date.now();
        break;
      case 'cancel':
        context.metadata.cancelTime = Date.now();
        break;
      default:
        logger.debug(`Unknown state action: ${action}`, { taskId });
    }
  }
  /**
   * Execute lifecycle hooks for a state
   */
  async executeHooks(state, timing, task, context) {
    const hooks = this.lifecycleHooks.get(state) || [];
    const applicableHooks = hooks.filter(
      (h) => h.timing === timing && h.enabled,
    );
    for (const hook of applicableHooks) {
      try {
        // Check condition if defined
        if (hook.condition && !(await hook.condition(task, context))) {
          continue;
        }
        // Execute hook action
        await hook.action(task, context);
        logger.debug(`Lifecycle hook executed: ${hook.id}`, {
          taskId: task.id,
          state,
          timing,
        });
      } catch (error) {
        logger.error(`Lifecycle hook failed: ${hook.id}`, {
          taskId: task.id,
          state,
          timing,
          error: error instanceof Error ? error.message : String(error),
        });
        this.emit('hookError', hook, task, context, error);
      }
    }
  }
  /**
   * Record a lifecycle event
   */
  async recordEvent(event) {
    const events = this.lifecycleEvents.get(event.taskId) || [];
    events.push(event);
    // Maintain history limit
    if (events.length > (this.options.maxHistoryPerTask || 100)) {
      events.shift();
    }
    this.lifecycleEvents.set(event.taskId, events);
    this.emit('lifecycleEvent', event);
  }
  /**
   * Initialize metrics for a task
   */
  initializeMetrics(taskId) {
    const metrics = {
      taskId,
      totalLifecycleDuration: 0,
      stateDistribution: new Map(),
      averageStateTransitionTime: 0,
      transitionCounts: new Map(),
      retryCount: 0,
      rollbackCount: 0,
      hookExecutionCount: 0,
      validationFailures: 0,
      resourceAllocationTime: 0,
      actualVsEstimatedDuration: 0,
      anomalies: [],
    };
    this.metrics.set(taskId, metrics);
  }
  /**
   * Update metrics based on lifecycle events
   */
  updateMetrics(taskId, event) {
    const metrics = this.metrics.get(taskId);
    if (!metrics) return;
    // Update transition counts
    const transition = `${event.previousState}->${event.newState}`;
    const count = metrics.transitionCounts.get(transition) || 0;
    metrics.transitionCounts.set(transition, count + 1);
    // Update state distribution
    const stateCount = metrics.stateDistribution.get(event.newState) || 0;
    metrics.stateDistribution.set(event.newState, stateCount + 1);
    // Track special events
    if (event.newState === LifecycleState.RETRYING) {
      metrics.retryCount++;
    }
    if (event.newState === LifecycleState.ROLLING_BACK) {
      metrics.rollbackCount++;
    }
    // Calculate average transition time
    if (event.metadata.duration) {
      const totalTransitions = Array.from(
        metrics.transitionCounts.values(),
      ).reduce((sum, count) => sum + count, 0);
      const totalTime =
        metrics.averageStateTransitionTime * (totalTransitions - 1) +
        event.metadata.duration;
      metrics.averageStateTransitionTime = totalTime / totalTransitions;
    }
  }
  /**
   * Finalize metrics when task completes
   */
  finalizeMetrics(taskId) {
    const metrics = this.metrics.get(taskId);
    const context = this.lifecycleContexts.get(taskId);
    if (!metrics || !context) return;
    metrics.totalLifecycleDuration = context.totalDuration;
    // Calculate actual vs estimated duration ratio
    const task = this.getTaskSync(taskId);
    if (task && task.estimatedDuration) {
      metrics.actualVsEstimatedDuration =
        context.totalDuration / task.estimatedDuration;
    }
  }
  /**
   * Simple condition evaluator
   */
  async evaluateCondition(condition, context) {
    // Basic implementation - would need proper expression evaluator in production
    // For now, assume conditions are always true
    return true;
  }
  /**
   * Get task (placeholder - would integrate with actual task store)
   */
  async getTask(taskId) {
    // Placeholder implementation
    return {};
  }
  /**
   * Get task synchronously (placeholder)
   */
  getTaskSync(taskId) {
    // Placeholder implementation
    return undefined;
  }
  /**
   * Start cleanup process
   */
  startCleanupProcess() {
    if (this.options.cleanupInterval && this.options.cleanupInterval > 0) {
      this.cleanupTimer = setInterval(() => {
        this.cleanup().catch((error) => {
          logger.error('Cleanup process failed', {
            error: error instanceof Error ? error.message : String(error),
          });
        });
      }, this.options.cleanupInterval);
    }
  }
  /**
   * Shutdown the lifecycle manager
   */
  async shutdown() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    // Perform final cleanup
    await this.cleanup(0); // Clean all
    logger.info('TaskLifecycle manager shutdown completed');
    this.emit('shutdown');
  }
}
//# sourceMappingURL=TaskLifecycle.js.map
