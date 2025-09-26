/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import type { StructuredLogger } from '@google/gemini-cli-core/src/utils/logger.js';
import { WinstonStructuredLogger } from '@google/gemini-cli-core/src/utils/logger.js';
import type {
  TaskType,
  TaskMetadata,
} from '../../monitoring/TaskStatusMonitor.js';
import {
  TaskStatus,
  TaskPriority,
  taskStatusMonitor,
} from '../../monitoring/TaskStatusMonitor.js';
import { statusUpdateBroker } from '../../monitoring/StatusUpdateBroker.js';

/**
 * Task scheduling options for intelligent queue management
 */
export interface TaskSchedulingOptions {
  priority?: TaskPriority;
  dependencies?: string[];
  estimatedDuration?: number;
  maxRetries?: number;
  retryDelay?: number;
  timeoutMs?: number;
  tags?: string[];
  constraints?: {
    requiresAgent?: string;
    requiresCapabilities?: string[];
    resourceRequirements?: {
      memory?: number;
      cpu?: number;
      disk?: number;
    };
  };
  scheduling?: {
    earliestStartTime?: Date;
    deadline?: Date;
    parallelism?: 'sequential' | 'parallel' | 'exclusive';
  };
}

/**
 * Task definition for queue submission
 */
export interface TaskDefinition {
  title: string;
  description: string;
  type: TaskType;
  executor: string; // Function name or command to execute
  params?: Record<string, unknown>;
  options?: TaskSchedulingOptions;
}

/**
 * Agent capability definition for task assignment
 */
export interface AgentCapability {
  agentId: string;
  capabilities: string[];
  performance: {
    averageCompletionTime: number;
    successRate: number;
    currentLoad: number;
    maxConcurrentTasks: number;
  };
  resourceCapacity: {
    memory: number;
    cpu: number;
    disk: number;
  };
  status: 'available' | 'busy' | 'offline' | 'maintenance';
}

/**
 * Task assignment result
 */
export interface TaskAssignment {
  taskId: string;
  agentId: string;
  assignedAt: Date;
  estimatedCompletion: Date;
  priority: TaskPriority;
}

/**
 * Priority queue node for efficient sorting
 */
class PriorityQueueNode {
  constructor(
    public task: TaskMetadata,
    public priority: number,
    public insertionTime: number,
  ) {}
}

/**
 * Self-Managing Task Queue with Intelligent Priority Scheduling
 *
 * Features:
 * - Priority-based scheduling with dynamic rebalancing
 * - Intelligent agent assignment based on capabilities and performance
 * - Dependency management and resolution
 * - Cross-session persistence and recovery
 * - Real-time monitoring and optimization
 * - Automatic retry and error handling
 * - Resource-aware scheduling
 * - Performance analytics and optimization
 */
export class TaskQueue extends EventEmitter {
  private readonly logger: StructuredLogger;
  private readonly queuesByPriority: Map<TaskPriority, PriorityQueueNode[]>;
  private readonly taskRegistry: Map<string, TaskMetadata>;
  private readonly agentRegistry: Map<string, AgentCapability>;
  private readonly taskAssignments: Map<string, TaskAssignment>;
  private readonly dependencyGraph: Map<string, Set<string>>;
  private readonly activeTasks: Set<string>;
  private readonly completedTasks: Set<string>;
  private readonly failedTasks: Map<string, number>; // Task ID -> failure count

  private processingInterval?: NodeJS.Timeout;
  private rebalancingInterval?: NodeJS.Timeout;
  private persistenceInterval?: NodeJS.Timeout;

  private readonly priorityWeights: Record<TaskPriority, number> = {
    [TaskPriority.CRITICAL]: 1000,
    [TaskPriority.HIGH]: 100,
    [TaskPriority.NORMAL]: 10,
    [TaskPriority.LOW]: 1,
  };

  private performanceMetrics = {
    totalTasksProcessed: 0,
    averageQueueTime: 0,
    averageExecutionTime: 0,
    throughputPerMinute: 0,
    systemEfficiency: 100,
    rebalanceCount: 0,
    optimizationCount: 0,
    lastOptimization: new Date(),
  };

  constructor() {
    super();
    this.logger = new WinstonStructuredLogger().child({ component: 'TaskQueue' });
    this.queuesByPriority = new Map();
    this.taskRegistry = new Map();
    this.agentRegistry = new Map();
    this.taskAssignments = new Map();
    this.dependencyGraph = new Map();
    this.activeTasks = new Set();
    this.completedTasks = new Set();
    this.failedTasks = new Map();

    // Initialize priority queues
    Object.values(TaskPriority).forEach((priority) => {
      this.queuesByPriority.set(priority, []);
    });

    this.setupProcessingPipeline();
    this.setupRealtimeIntegration();

    this.logger.info(
      'TaskQueue initialized with intelligent priority scheduling',
      {
        priorityLevels: Object.values(TaskPriority),
        timestamp: new Date().toISOString(),
      },
    );
  }

  /**
   * Submit a task to the queue with intelligent scheduling
   */
  async submitTask(definition: TaskDefinition): Promise<string> {
    const startTime = Date.now();

    // Create task metadata
    const taskId = await taskStatusMonitor.registerTask({
      title: definition.title,
      description: definition.description,
      type: definition.type,
      priority: definition.options?.priority || TaskPriority.NORMAL,
      dependencies: definition.options?.dependencies || [],
      tags: definition.options?.tags || [],
      status: 'pending' as any,
      errorCount: 0,
      progress: 0,
      retryCount: 0,
      metadata: {
        executor: definition.executor,
        params: definition.params,
        options: definition.options,
        submittedAt: new Date(),
        submissionLatency: 0,
      },
    });

    const task = taskStatusMonitor.getTaskStatus(taskId);
    if (!task) {
      throw new Error(`Failed to create task: ${taskId}`);
    }

    // Register task in internal registry
    this.taskRegistry.set(taskId, task);

    // Build dependency graph
    if (definition.options?.dependencies) {
      this.updateDependencyGraph(taskId, definition.options.dependencies);
    }

    // Calculate scheduling priority with multiple factors
    const schedulingPriority = this.calculateSchedulingPriority(
      task,
      definition.options,
    );

    // Add to appropriate priority queue
    const priorityQueue = this.queuesByPriority.get(task.priority) || [];
    const queueNode = new PriorityQueueNode(
      task,
      schedulingPriority,
      Date.now(),
    );

    // Insert in priority order
    this.insertInPriorityOrder(priorityQueue, queueNode);
    this.queuesByPriority.set(task.priority, priorityQueue);

    // Update submission metrics
    const submissionLatency = Date.now() - startTime;
    task.metadata['submissionLatency'] = submissionLatency;

    // Emit events
    this.emit('task:submitted', { task, submissionLatency });

    // Trigger immediate processing attempt
    setImmediate(() => this.processQueue());

    this.logger.info('Task submitted to queue', {
      taskId,
      title: definition.title,
      type: definition.type,
      priority: task.priority,
      schedulingPriority,
      queueSize: this.getTotalQueueSize(),
      submissionLatency,
    });

    return taskId;
  }

  /**
   * Register an agent with the queue system
   */
  async registerAgent(agentCapability: AgentCapability): Promise<void> {
    this.agentRegistry.set(agentCapability.agentId, agentCapability);

    // Register with monitoring system
    await taskStatusMonitor.registerAgent(
      agentCapability.agentId,
      agentCapability.capabilities,
    );

    this.emit('agent:registered', { agent: agentCapability });

    this.logger.info('Agent registered with task queue', {
      agentId: agentCapability.agentId,
      capabilities: agentCapability.capabilities,
      resourceCapacity: agentCapability.resourceCapacity,
      status: agentCapability.status,
    });

    // Trigger queue processing in case tasks are waiting
    setImmediate(() => this.processQueue());
  }

  /**
   * Update agent status and capabilities
   */
  async updateAgentStatus(
    agentId: string,
    updates: Partial<AgentCapability>,
  ): Promise<void> {
    const agent = this.agentRegistry.get(agentId);
    if (!agent) {
      this.logger.warn('Attempted to update unknown agent', { agentId });
      return;
    }

    // Merge updates
    Object.assign(agent, updates);

    // Update monitoring system
    await taskStatusMonitor.updateAgentHeartbeat(agentId);

    this.emit('agent:updated', { agentId, agent, updates });

    this.logger.debug('Agent status updated', { agentId, updates });

    // Reprocess queue if agent became available or capabilities changed
    if (updates.status === 'available' || updates.capabilities) {
      setImmediate(() => this.processQueue());
    }
  }

  /**
   * Get current queue status and metrics
   */
  getQueueStatus(): {
    queueSizes: Record<TaskPriority, number>;
    totalQueued: number;
    totalActive: number;
    totalCompleted: number;
    totalFailed: number;
    availableAgents: number;
    busyAgents: number;
    performance: {
      totalTasksProcessed: number;
      averageQueueTime: number;
      averageExecutionTime: number;
      throughputPerMinute: number;
      systemEfficiency: number;
      rebalanceCount: number;
      optimizationCount: number;
      lastOptimization: Date;
    };
    nextScheduledTask?: {
      taskId: string;
      title: string;
      priority: TaskPriority;
      estimatedStartTime: Date;
    };
  } {
    const queueSizes = {} as Record<TaskPriority, number>;
    let totalQueued = 0;

    for (const [priority, queue] of this.queuesByPriority) {
      queueSizes[priority] = queue.length;
      totalQueued += queue.length;
    }

    const availableAgents = Array.from(this.agentRegistry.values()).filter(
      (agent) => agent.status === 'available',
    ).length;

    const busyAgents = Array.from(this.agentRegistry.values()).filter(
      (agent) => agent.status === 'busy',
    ).length;

    // Find next scheduled task
    let nextScheduledTask:
      | {
          taskId: string;
          title: string;
          priority: TaskPriority;
          estimatedStartTime: Date;
        }
      | undefined = undefined;
    for (const priority of [
      TaskPriority.CRITICAL,
      TaskPriority.HIGH,
      TaskPriority.NORMAL,
      TaskPriority.LOW,
    ]) {
      const queue = this.queuesByPriority.get(priority);
      if (queue && queue.length > 0) {
        const nextTask = queue[0].task;
        nextScheduledTask = {
          taskId: nextTask.id,
          title: nextTask.title,
          priority: nextTask.priority,
          estimatedStartTime: new Date(Date.now() + 1000), // Rough estimate
        };
        break;
      }
    }

    return {
      queueSizes,
      totalQueued,
      totalActive: this.activeTasks.size,
      totalCompleted: this.completedTasks.size,
      totalFailed: this.failedTasks.size,
      availableAgents,
      busyAgents,
      performance: { ...this.performanceMetrics },
      nextScheduledTask,
    };
  }

  /**
   * Get detailed task information
   */
  getTaskInfo(taskId: string): {
    task?: TaskMetadata;
    assignment?: TaskAssignment;
    queuePosition?: number;
    dependencies?: string[];
    dependents?: string[];
  } {
    const task = this.taskRegistry.get(taskId);
    const assignment = this.taskAssignments.get(taskId);
    const dependencies = Array.from(this.dependencyGraph.get(taskId) || []);

    // Find tasks that depend on this one
    const dependents: string[] = [];
    for (const [dependentId, deps] of this.dependencyGraph) {
      if (deps.has(taskId)) {
        dependents.push(dependentId);
      }
    }

    // Find queue position if task is queued
    let queuePosition: number | undefined = undefined;
    if (task) {
      for (const [_priority, queue] of this.queuesByPriority) {
        const position = queue.findIndex((node) => node.task.id === taskId);
        if (position !== -1) {
          queuePosition = position + 1; // 1-based indexing
          break;
        }
      }
    }

    return {
      task,
      assignment,
      queuePosition,
      dependencies,
      dependents,
    };
  }

  /**
   * Cancel a queued or active task
   */
  async cancelTask(taskId: string, reason?: string): Promise<boolean> {
    const task = this.taskRegistry.get(taskId);
    if (!task) {
      return false;
    }

    // Remove from queue if present
    for (const [_priority, queue] of this.queuesByPriority) {
      const index = queue.findIndex((node) => node.task.id === taskId);
      if (index !== -1) {
        queue.splice(index, 1);
        break;
      }
    }

    // Remove from active tasks
    this.activeTasks.delete(taskId);

    // Update task status
    await taskStatusMonitor.updateTaskStatus(taskId, TaskStatus.CANCELLED, {
      message: reason || 'Task cancelled by request',
    });

    // Remove assignment
    const assignment = this.taskAssignments.get(taskId);
    if (assignment) {
      this.taskAssignments.delete(taskId);

      // Update agent status
      const agent = this.agentRegistry.get(assignment.agentId);
      if (agent && agent.performance.currentLoad > 0) {
        agent.performance.currentLoad--;
        if (agent.performance.currentLoad === 0 && agent.status === 'busy') {
          agent.status = 'available';
        }
      }
    }

    this.emit('task:cancelled', { task, reason });

    this.logger.info('Task cancelled', {
      taskId,
      title: task.title,
      reason,
      wasActive: this.activeTasks.has(taskId),
    });

    return true;
  }

  /**
   * Trigger manual queue rebalancing and optimization
   */
  async rebalanceQueue(): Promise<void> {
    const startTime = Date.now();

    // Collect all queued tasks for reordering
    const allQueuedTasks: PriorityQueueNode[] = [];
    for (const queue of this.queuesByPriority.values()) {
      allQueuedTasks.push(...queue);
      queue.length = 0; // Clear existing queues
    }

    // Recalculate priorities and redistribute
    for (const node of allQueuedTasks) {
      const task = node.task;
      const options = task.metadata['options'] as TaskSchedulingOptions;

      // Recalculate scheduling priority
      node.priority = this.calculateSchedulingPriority(task, options);

      // Place back in appropriate queue
      const priorityQueue = this.queuesByPriority.get(task.priority) || [];
      this.insertInPriorityOrder(priorityQueue, node);
      this.queuesByPriority.set(task.priority, priorityQueue);
    }

    const rebalanceTime = Date.now() - startTime;
    this.performanceMetrics.rebalanceCount++;

    this.emit('queue:rebalanced', {
      tasksRebalanced: allQueuedTasks.length,
      rebalanceTime,
      queueSizes: this.getQueueSizes(),
    });

    this.logger.info('Queue rebalanced', {
      tasksRebalanced: allQueuedTasks.length,
      rebalanceTime,
      newQueueSizes: this.getQueueSizes(),
    });

    // Trigger immediate processing
    setImmediate(() => this.processQueue());
  }

  // Private methods for internal queue management

  private setupProcessingPipeline(): void {
    // Process queue every 100ms for responsive task scheduling
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 100);

    // Auto-rebalance every 30 seconds for optimization
    this.rebalancingInterval = setInterval(() => {
      this.rebalanceQueue();
    }, 30000);

    // Persist state every 10 seconds
    this.persistenceInterval = setInterval(() => {
      this.persistQueueState();
    }, 10000);
  }

  private setupRealtimeIntegration(): void {
    // Listen to monitoring system events
    taskStatusMonitor.on('task:status-changed', (event) => {
      this.handleTaskStatusChange(event.task, event.update);
    });

    // Listen to broker events for coordination
    statusUpdateBroker.on('task:completed', (event) => {
      const taskId = event.data.taskId as string;
      this.completedTasks.add(taskId);
      this.activeTasks.delete(taskId);
      this.updateTaskCompletion(taskId);
    });

    statusUpdateBroker.on('task:failed', (event) => {
      const taskId = event.data.taskId as string;
      const error = event.data.error || 'Unknown error';
      this.handleTaskFailure(taskId, error);
    });
  }

  private async processQueue(): Promise<void> {
    // Process tasks in priority order
    for (const priority of [
      TaskPriority.CRITICAL,
      TaskPriority.HIGH,
      TaskPriority.NORMAL,
      TaskPriority.LOW,
    ]) {
      const queue = this.queuesByPriority.get(priority);
      if (!queue || queue.length === 0) continue;

      // Try to assign tasks from this priority level
      const assignedCount = await this.assignTasksFromQueue(queue);
      if (assignedCount > 0) {
        this.logger.debug('Tasks assigned from queue', {
          priority,
          assignedCount,
          remainingInQueue: queue.length,
        });
      }
    }
  }

  private async assignTasksFromQueue(
    queue: PriorityQueueNode[],
  ): Promise<number> {
    let assignedCount = 0;
    const availableAgents = this.getAvailableAgents();

    // Process queue in priority order
    for (let i = 0; i < queue.length && availableAgents.length > 0; i++) {
      const node = queue[i];
      const task = node.task;

      // Check if dependencies are satisfied
      if (!this.areDependenciesSatisfied(task.id)) {
        continue;
      }

      // Find best agent for this task
      const bestAgent = this.findBestAgentForTask(task, availableAgents);
      if (!bestAgent) {
        continue;
      }

      // Assign task to agent
      const assignment = await this.assignTaskToAgent(task, bestAgent);
      if (assignment) {
        // Remove from queue
        queue.splice(i, 1);
        i--; // Adjust index after removal

        assignedCount++;

        // Remove agent from available list
        const agentIndex = availableAgents.findIndex(
          (a) => a.agentId === bestAgent.agentId,
        );
        if (agentIndex !== -1) {
          availableAgents.splice(agentIndex, 1);
        }
      }
    }

    return assignedCount;
  }

  private calculateSchedulingPriority(
    task: TaskMetadata,
    options?: TaskSchedulingOptions,
  ): number {
    let priority = this.priorityWeights[task.priority];

    // Age factor - older tasks get higher priority
    const ageMinutes = (Date.now() - task.lastUpdate.getTime()) / (1000 * 60);
    priority += Math.min(ageMinutes * 0.1, 50); // Cap age bonus at 50

    // Deadline urgency
    if (options?.scheduling?.deadline) {
      const deadlineMinutes =
        (options.scheduling.deadline.getTime() - Date.now()) / (1000 * 60);
      if (deadlineMinutes > 0) {
        priority += Math.max(0, (60 - deadlineMinutes) * 2); // Higher priority as deadline approaches
      } else {
        priority += 200; // Overdue tasks get very high priority
      }
    }

    // Dependency factor - tasks with fewer dependents get higher priority
    const dependents = this.getDependentTasks(task.id);
    priority += dependents.length * 5;

    // Resource efficiency factor
    if (options?.constraints?.resourceRequirements) {
      const resourceScore = this.calculateResourceEfficiencyScore(
        options.constraints.resourceRequirements,
      );
      priority += resourceScore;
    }

    // Retry penalty - failed tasks get lower priority
    const failureCount = this.failedTasks.get(task.id) || 0;
    priority -= failureCount * 10;

    return Math.max(0, priority);
  }

  private insertInPriorityOrder(
    queue: PriorityQueueNode[],
    node: PriorityQueueNode,
  ): void {
    // Binary search for insertion point
    let left = 0;
    let right = queue.length;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (queue[mid].priority > node.priority) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    queue.splice(left, 0, node);
  }

  private areDependenciesSatisfied(taskId: string): boolean {
    const dependencies = this.dependencyGraph.get(taskId);
    if (!dependencies) return true;

    for (const depId of dependencies) {
      if (!this.completedTasks.has(depId)) {
        return false;
      }
    }
    return true;
  }

  private getAvailableAgents(): AgentCapability[] {
    return Array.from(this.agentRegistry.values()).filter(
      (agent) =>
        agent.status === 'available' &&
        agent.performance.currentLoad < agent.performance.maxConcurrentTasks,
    );
  }

  private findBestAgentForTask(
    task: TaskMetadata,
    availableAgents: AgentCapability[],
  ): AgentCapability | null {
    if (availableAgents.length === 0) return null;

    const options = task.metadata['options'] as TaskSchedulingOptions;

    // Filter by required agent if specified
    if (options?.constraints?.requiresAgent) {
      const specificAgent = availableAgents.find(
        (a) => a.agentId === options.constraints!.requiresAgent,
      );
      return specificAgent || null;
    }

    // Filter by required capabilities
    let candidateAgents = availableAgents;
    if (options?.constraints?.requiresCapabilities) {
      candidateAgents = availableAgents.filter((agent) =>
        options.constraints!.requiresCapabilities!.every((cap) =>
          agent.capabilities.includes(cap),
        ),
      );
    }

    if (candidateAgents.length === 0) return null;

    // Score agents based on multiple factors
    const agentScores = candidateAgents.map((agent) => ({
      agent,
      score: this.calculateAgentScore(agent, task, options),
    }));

    // Return agent with highest score
    agentScores.sort((a, b) => b.score - a.score);
    return agentScores[0].agent;
  }

  private calculateAgentScore(
    agent: AgentCapability,
    task: TaskMetadata,
    options?: TaskSchedulingOptions,
  ): number {
    let score = 0;

    // Success rate factor (0-100)
    score += agent.performance.successRate;

    // Load balancing factor
    const loadFactor =
      1 - agent.performance.currentLoad / agent.performance.maxConcurrentTasks;
    score += loadFactor * 50;

    // Performance factor (faster agents get higher scores)
    if (agent.performance.averageCompletionTime > 0) {
      score += Math.max(0, 60 - agent.performance.averageCompletionTime / 1000); // Bonus for faster completion
    }

    // Resource availability factor
    if (options?.constraints?.resourceRequirements) {
      const resourceAvailability = this.calculateResourceAvailability(
        agent,
        options.constraints.resourceRequirements,
      );
      score += resourceAvailability * 20;
    }

    // Capability match factor
    const requiredCaps = options?.constraints?.requiresCapabilities || [];
    const capabilityMatch =
      requiredCaps.length === 0
        ? 10
        : (requiredCaps.filter((cap) => agent.capabilities.includes(cap))
            .length /
            requiredCaps.length) *
          30;
    score += capabilityMatch;

    return score;
  }

  private async assignTaskToAgent(
    task: TaskMetadata,
    agent: AgentCapability,
  ): Promise<TaskAssignment | null> {
    try {
      // Create assignment
      const assignment: TaskAssignment = {
        taskId: task.id,
        agentId: agent.agentId,
        assignedAt: new Date(),
        estimatedCompletion: new Date(
          Date.now() + (agent.performance.averageCompletionTime || 60000),
        ),
        priority: task.priority,
      };

      // Update task status
      await taskStatusMonitor.updateTaskStatus(task.id, TaskStatus.ASSIGNED, {
        agentId: agent.agentId,
        message: 'Task assigned to agent',
      });

      // Update internal state
      this.taskAssignments.set(task.id, assignment);
      this.activeTasks.add(task.id);

      // Update agent state
      agent.performance.currentLoad++;
      if (
        agent.performance.currentLoad >= agent.performance.maxConcurrentTasks
      ) {
        agent.status = 'busy';
      }

      // Emit assignment event
      this.emit('task:assigned', { task, agent, assignment });

      this.logger.info('Task assigned to agent', {
        taskId: task.id,
        taskTitle: task.title,
        agentId: agent.agentId,
        agentLoad: agent.performance.currentLoad,
        estimatedCompletion: assignment.estimatedCompletion,
      });

      return assignment;
    } catch (error) {
      this.logger.error('Failed to assign task to agent', {
        taskId: task.id,
        agentId: agent.agentId,
        error,
      });
      return null;
    }
  }

  private updateDependencyGraph(taskId: string, dependencies: string[]): void {
    this.dependencyGraph.set(taskId, new Set(dependencies));
  }

  private getDependentTasks(taskId: string): string[] {
    const dependents: string[] = [];
    for (const [dependentId, deps] of this.dependencyGraph) {
      if (deps.has(taskId)) {
        dependents.push(dependentId);
      }
    }
    return dependents;
  }

  private calculateResourceEfficiencyScore(requirements: {
    memory?: number;
    cpu?: number;
    disk?: number;
  }): number {
    // Simple scoring based on resource requirements
    // Lower requirements get higher scores for better scheduling
    let score = 0;
    if (requirements.memory) score -= Math.min(requirements.memory / 1000, 20);
    if (requirements.cpu) score -= Math.min(requirements.cpu * 10, 20);
    if (requirements.disk) score -= Math.min(requirements.disk / 1000000, 10);
    return score;
  }

  private calculateResourceAvailability(
    agent: AgentCapability,
    requirements: { memory?: number; cpu?: number; disk?: number },
  ): number {
    let availability = 1.0;

    if (requirements.memory && agent.resourceCapacity.memory > 0) {
      availability *= Math.min(
        1,
        agent.resourceCapacity.memory / requirements.memory,
      );
    }
    if (requirements.cpu && agent.resourceCapacity.cpu > 0) {
      availability *= Math.min(
        1,
        agent.resourceCapacity.cpu / requirements.cpu,
      );
    }
    if (requirements.disk && agent.resourceCapacity.disk > 0) {
      availability *= Math.min(
        1,
        agent.resourceCapacity.disk / requirements.disk,
      );
    }

    return availability;
  }

  private getTotalQueueSize(): number {
    let total = 0;
    for (const queue of this.queuesByPriority.values()) {
      total += queue.length;
    }
    return total;
  }

  private getQueueSizes(): Record<TaskPriority, number> {
    const sizes = {} as Record<TaskPriority, number>;
    for (const [priority, queue] of this.queuesByPriority) {
      sizes[priority] = queue.length;
    }
    return sizes;
  }

  private handleTaskStatusChange(
    task: TaskMetadata,
    update: {
      newStatus: TaskStatus;
      error?: Error;
    },
  ): void {
    // Handle task status changes from monitoring system
    if (update.newStatus === TaskStatus.COMPLETED) {
      this.updateTaskCompletion(task.id);
    } else if (update.newStatus === TaskStatus.FAILED) {
      this.handleTaskFailure(task.id, update.error?.message || 'Unknown error');
    }
  }

  private updateTaskCompletion(taskId: string): void {
    const assignment = this.taskAssignments.get(taskId);
    if (assignment) {
      // Update agent status
      const agent = this.agentRegistry.get(assignment.agentId);
      if (agent) {
        agent.performance.currentLoad = Math.max(
          0,
          agent.performance.currentLoad - 1,
        );
        if (agent.performance.currentLoad === 0 && agent.status === 'busy') {
          agent.status = 'available';
        }
      }
      this.taskAssignments.delete(taskId);
    }

    this.completedTasks.add(taskId);
    this.activeTasks.delete(taskId);
    this.failedTasks.delete(taskId);

    // Process dependent tasks
    setImmediate(() => this.processQueue());
  }

  private handleTaskFailure(taskId: string, error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const currentFailures = this.failedTasks.get(taskId) || 0;
    this.failedTasks.set(taskId, currentFailures + 1);

    const task = this.taskRegistry.get(taskId);
    const options = task?.metadata['options'] as TaskSchedulingOptions;
    const maxRetries = options?.maxRetries || 3;

    if (currentFailures < maxRetries) {
      // Retry task - add back to appropriate queue
      if (task) {
        const schedulingPriority = this.calculateSchedulingPriority(
          task,
          options,
        );
        const priorityQueue = this.queuesByPriority.get(task.priority) || [];
        const queueNode = new PriorityQueueNode(
          task,
          schedulingPriority,
          Date.now(),
        );

        // Insert with lower priority due to failure
        queueNode.priority -= 50;
        this.insertInPriorityOrder(priorityQueue, queueNode);
        this.queuesByPriority.set(task.priority, priorityQueue);

        this.logger.info('Task queued for retry', {
          taskId,
          failureCount: currentFailures + 1,
          maxRetries,
          error: errorMessage,
        });
      }
    } else {
      // Max retries reached - mark as permanently failed
      this.logger.error('Task permanently failed after max retries', {
        taskId,
        failureCount: currentFailures + 1,
        maxRetries,
        error: errorMessage,
      });
    }

    // Update agent status
    const assignment = this.taskAssignments.get(taskId);
    if (assignment) {
      const agent = this.agentRegistry.get(assignment.agentId);
      if (agent) {
        agent.performance.currentLoad = Math.max(
          0,
          agent.performance.currentLoad - 1,
        );
        if (agent.performance.currentLoad === 0 && agent.status === 'busy') {
          agent.status = 'available';
        }
      }
      this.taskAssignments.delete(taskId);
    }

    this.activeTasks.delete(taskId);
  }

  private async persistQueueState(): Promise<void> {
    try {
      const queueState = {
        queueSizes: this.getQueueSizes(),
        totalTasks: this.taskRegistry.size,
        activeTasks: this.activeTasks.size,
        completedTasks: this.completedTasks.size,
        failedTasks: this.failedTasks.size,
        agents: this.agentRegistry.size,
        performanceMetrics: this.performanceMetrics,
        timestamp: new Date().toISOString(),
      };

      // Emit persistence event for external systems to handle
      this.emit('queue:state-persisted', { queueState });
    } catch (error) {
      this.logger.error('Failed to persist queue state', { error });
    }
  }

  /**
   * Clean up resources and stop processing
   */
  destroy(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    if (this.rebalancingInterval) {
      clearInterval(this.rebalancingInterval);
    }
    if (this.persistenceInterval) {
      clearInterval(this.persistenceInterval);
    }

    this.removeAllListeners();

    // Clear all internal state
    for (const queue of this.queuesByPriority.values()) {
      queue.length = 0;
    }
    this.queuesByPriority.clear();
    this.taskRegistry.clear();
    this.agentRegistry.clear();
    this.taskAssignments.clear();
    this.dependencyGraph.clear();
    this.activeTasks.clear();
    this.completedTasks.clear();
    this.failedTasks.clear();

    this.logger.info('TaskQueue destroyed and resources cleaned up');
  }
}

/**
 * Singleton instance for global access
 */
export const taskQueue = new TaskQueue();
