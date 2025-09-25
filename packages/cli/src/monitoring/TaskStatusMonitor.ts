/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import type { StructuredLogger } from '@google/gemini-cli-core/src/utils/logger.js';
import { getComponentLogger } from '@google/gemini-cli-core/src/utils/logger.js';

/**
 * Task status definitions for comprehensive monitoring
 */
export enum TaskStatus {
  QUEUED = 'queued',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  BLOCKED = 'blocked',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  NORMAL = 'normal',
  LOW = 'low',
}

export enum TaskType {
  IMPLEMENTATION = 'implementation',
  TESTING = 'testing',
  DOCUMENTATION = 'documentation',
  VALIDATION = 'validation',
  DEPLOYMENT = 'deployment',
  ANALYSIS = 'analysis',
}

export interface TaskMetadata {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  assignedAgent?: string;
  dependencies: string[];
  progress: number;
  estimatedDuration?: number;
  actualDuration?: number;
  startTime?: Date;
  endTime?: Date;
  lastUpdate: Date;
  errorCount: number;
  retryCount: number;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface TaskStatusUpdate {
  taskId: string;
  previousStatus: TaskStatus;
  newStatus: TaskStatus;
  timestamp: Date;
  agentId?: string;
  progress?: number;
  message?: string;
  error?: string;
  context?: Record<string, unknown>;
}

export interface AgentStatus {
  id: string;
  status: 'active' | 'idle' | 'busy' | 'offline';
  capabilities: string[];
  currentTasks: string[];
  completedTasks: number;
  failedTasks: number;
  averageTaskDuration: number;
  lastHeartbeat: Date;
  performance: {
    successRate: number;
    averageCompletionTime: number;
    taskThroughput: number;
  };
}

/**
 * Real-Time Task Status Monitor
 *
 * Comprehensive monitoring system for autonomous task management with:
 * - Real-time status tracking and updates
 * - Event-driven architecture for instant notifications
 * - Historical data and analytics
 * - Agent performance monitoring
 * - Task dependency management
 * - Cross-session persistence
 */
export class TaskStatusMonitor extends EventEmitter {
  private readonly logger: StructuredLogger;
  private tasks: Map<string, TaskMetadata>;
  private agents: Map<string, AgentStatus>;
  private statusHistory: TaskStatusUpdate[];
  private subscribers: Set<string>;
  private persistenceInterval?: NodeJS.Timeout;
  private performanceMetrics: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageTaskDuration: number;
    systemUptime: Date;
    throughputPerHour: number;
  };

  constructor() {
    super();
    this.logger = getComponentLogger('TaskStatusMonitor');
    this.tasks = new Map();
    this.agents = new Map();
    this.statusHistory = [];
    this.subscribers = new Set();

    this.performanceMetrics = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageTaskDuration: 0,
      systemUptime: new Date(),
      throughputPerHour: 0,
    };

    this.setupPeriodicPersistence();
    this.logger.info('TaskStatusMonitor initialized', {
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Register a new task for monitoring
   */
  async registerTask(
    task: Omit<TaskMetadata, 'id' | 'lastUpdate'>,
  ): Promise<string> {
    const taskId = this.generateTaskId();
    const fullTask: TaskMetadata = {
      ...task,
      id: taskId,
      lastUpdate: new Date(),
      progress: 0,
      errorCount: 0,
      retryCount: 0,
      status: TaskStatus.QUEUED,
    };

    this.tasks.set(taskId, fullTask);
    this.performanceMetrics.totalTasks++;

    const statusUpdate: TaskStatusUpdate = {
      taskId,
      previousStatus: TaskStatus.QUEUED,
      newStatus: TaskStatus.QUEUED,
      timestamp: new Date(),
      message: 'Task registered for monitoring',
    };

    this.recordStatusUpdate(statusUpdate);

    this.emit('task:registered', { task: fullTask, update: statusUpdate });

    this.logger.info('Task registered', {
      taskId,
      title: task.title,
      type: task.type,
      priority: task.priority,
    });

    return taskId;
  }

  /**
   * Update task status with comprehensive tracking
   */
  async updateTaskStatus(
    taskId: string,
    newStatus: TaskStatus,
    options: {
      agentId?: string;
      progress?: number;
      message?: string;
      error?: string;
      context?: Record<string, unknown>;
    } = {},
  ): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) {
      this.logger.error('Task not found for status update', { taskId });
      return false;
    }

    const previousStatus = task.status;
    const timestamp = new Date();

    // Update task metadata
    task.status = newStatus;
    task.lastUpdate = timestamp;

    if (options.progress !== undefined) {
      task.progress = Math.max(0, Math.min(100, options.progress));
    }

    if (options.agentId) {
      task.assignedAgent = options.agentId;
    }

    // Handle status-specific logic
    switch (newStatus) {
      case TaskStatus.IN_PROGRESS:
        if (!task.startTime) {
          task.startTime = timestamp;
        }
        break;

      case TaskStatus.COMPLETED:
        task.endTime = timestamp;
        task.progress = 100;
        if (task.startTime) {
          task.actualDuration = timestamp.getTime() - task.startTime.getTime();
        }
        this.performanceMetrics.completedTasks++;
        break;

      case TaskStatus.FAILED:
        task.endTime = timestamp;
        task.errorCount++;
        this.performanceMetrics.failedTasks++;
        break;

      case TaskStatus.BLOCKED:
        // Track blocking reasons in context
        break;

      default:
        break;
    }

    // Create status update record
    const statusUpdate: TaskStatusUpdate = {
      taskId,
      previousStatus,
      newStatus,
      timestamp,
      agentId: options.agentId,
      progress: options.progress,
      message: options.message,
      error: options.error,
      context: options.context,
    };

    this.recordStatusUpdate(statusUpdate);

    // Update agent status if applicable
    if (options.agentId) {
      await this.updateAgentTaskAssignment(options.agentId, taskId, newStatus);
    }

    // Emit real-time events
    this.emit('task:status-changed', { task, update: statusUpdate });
    this.emit(`task:${newStatus}`, { task, update: statusUpdate });

    this.logger.info('Task status updated', {
      taskId,
      previousStatus,
      newStatus,
      agentId: options.agentId,
      progress: options.progress,
    });

    return true;
  }

  /**
   * Register and monitor an agent
   */
  async registerAgent(agentId: string, capabilities: string[]): Promise<void> {
    const agentStatus: AgentStatus = {
      id: agentId,
      status: 'active',
      capabilities,
      currentTasks: [],
      completedTasks: 0,
      failedTasks: 0,
      averageTaskDuration: 0,
      lastHeartbeat: new Date(),
      performance: {
        successRate: 100,
        averageCompletionTime: 0,
        taskThroughput: 0,
      },
    };

    this.agents.set(agentId, agentStatus);
    this.emit('agent:registered', { agent: agentStatus });

    this.logger.info('Agent registered', {
      agentId,
      capabilities,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Update agent heartbeat and status
   */
  async updateAgentHeartbeat(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      this.logger.warn('Agent heartbeat for unknown agent', { agentId });
      return;
    }

    agent.lastHeartbeat = new Date();
    agent.status = agent.currentTasks.length > 0 ? 'busy' : 'idle';

    this.emit('agent:heartbeat', { agent });
  }

  /**
   * Get comprehensive task status information
   */
  getTaskStatus(taskId: string): TaskMetadata | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get all tasks with optional filtering
   */
  getAllTasks(filters?: {
    status?: TaskStatus;
    type?: TaskType;
    priority?: TaskPriority;
    assignedAgent?: string;
  }): TaskMetadata[] {
    let tasks = Array.from(this.tasks.values());

    if (filters) {
      if (filters.status) {
        tasks = tasks.filter((task) => task.status === filters.status);
      }
      if (filters.type) {
        tasks = tasks.filter((task) => task.type === filters.type);
      }
      if (filters.priority) {
        tasks = tasks.filter((task) => task.priority === filters.priority);
      }
      if (filters.assignedAgent) {
        tasks = tasks.filter(
          (task) => task.assignedAgent === filters.assignedAgent,
        );
      }
    }

    return tasks.sort(
      (a, b) => b.lastUpdate.getTime() - a.lastUpdate.getTime(),
    );
  }

  /**
   * Get task status history
   */
  getTaskStatusHistory(taskId?: string, limit = 100): TaskStatusUpdate[] {
    let history = [...this.statusHistory];

    if (taskId) {
      history = history.filter((update) => update.taskId === taskId);
    }

    return history
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get agent status information
   */
  getAgentStatus(agentId: string): AgentStatus | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all agent statuses
   */
  getAllAgents(): AgentStatus[] {
    return Array.from(this.agents.values()).sort(
      (a, b) => b.lastHeartbeat.getTime() - a.lastHeartbeat.getTime(),
    );
  }

  /**
   * Get comprehensive performance metrics
   */
  getPerformanceMetrics(): typeof this.performanceMetrics & {
    activeAgents: number;
    tasksInProgress: number;
    queuedTasks: number;
    blockedTasks: number;
    systemEfficiency: number;
  } {
    const activeAgents = Array.from(this.agents.values()).filter(
      (agent) => agent.status !== 'offline',
    ).length;

    const tasksByStatus = this.getTaskCountsByStatus();
    const systemEfficiency =
      this.performanceMetrics.totalTasks > 0
        ? (this.performanceMetrics.completedTasks /
            this.performanceMetrics.totalTasks) *
          100
        : 100;

    return {
      ...this.performanceMetrics,
      activeAgents,
      tasksInProgress: tasksByStatus[TaskStatus.IN_PROGRESS] || 0,
      queuedTasks: tasksByStatus[TaskStatus.QUEUED] || 0,
      blockedTasks: tasksByStatus[TaskStatus.BLOCKED] || 0,
      systemEfficiency,
    };
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(subscriberId: string): void {
    this.subscribers.add(subscriberId);
    this.emit('subscriber:added', { subscriberId });

    this.logger.info('Subscriber added', { subscriberId });
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribe(subscriberId: string): void {
    this.subscribers.delete(subscriberId);
    this.emit('subscriber:removed', { subscriberId });

    this.logger.info('Subscriber removed', { subscriberId });
  }

  // Private methods

  private generateTaskId(): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    return `task_${timestamp}_${randomString}`;
  }

  private recordStatusUpdate(update: TaskStatusUpdate): void {
    this.statusHistory.push(update);

    // Keep only last 1000 status updates to prevent memory bloat
    if (this.statusHistory.length > 1000) {
      this.statusHistory = this.statusHistory.slice(-1000);
    }
  }

  private async updateAgentTaskAssignment(
    agentId: string,
    taskId: string,
    newStatus: TaskStatus,
  ): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    // Update agent's task assignments
    if (
      newStatus === TaskStatus.IN_PROGRESS &&
      !agent.currentTasks.includes(taskId)
    ) {
      agent.currentTasks.push(taskId);
      agent.status = 'busy';
    } else if (
      [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED].includes(
        newStatus,
      )
    ) {
      agent.currentTasks = agent.currentTasks.filter((id) => id !== taskId);
      agent.status = agent.currentTasks.length > 0 ? 'busy' : 'idle';

      if (newStatus === TaskStatus.COMPLETED) {
        agent.completedTasks++;
      } else if (newStatus === TaskStatus.FAILED) {
        agent.failedTasks++;
      }

      // Update performance metrics
      const totalTasks = agent.completedTasks + agent.failedTasks;
      if (totalTasks > 0) {
        agent.performance.successRate =
          (agent.completedTasks / totalTasks) * 100;
      }
    }

    agent.lastHeartbeat = new Date();
    this.emit('agent:status-changed', { agent });
  }

  private getTaskCountsByStatus(): Record<TaskStatus, number> {
    const counts: Record<TaskStatus, number> = {
      [TaskStatus.QUEUED]: 0,
      [TaskStatus.ASSIGNED]: 0,
      [TaskStatus.IN_PROGRESS]: 0,
      [TaskStatus.BLOCKED]: 0,
      [TaskStatus.COMPLETED]: 0,
      [TaskStatus.FAILED]: 0,
      [TaskStatus.CANCELLED]: 0,
    };

    for (const task of Array.from(this.tasks.values())) {
      counts[task.status]++;
    }

    return counts;
  }

  private setupPeriodicPersistence(): void {
    // Persist status data every 30 seconds
    this.persistenceInterval = setInterval(() => {
      this.persistStatus();
    }, 30000);
  }

  private async persistStatus(): Promise<void> {
    try {
      const statusData = {
        tasks: Array.from(this.tasks.entries()),
        agents: Array.from(this.agents.entries()),
        statusHistory: this.statusHistory.slice(-500), // Keep last 500 updates
        performanceMetrics: this.performanceMetrics,
        timestamp: new Date().toISOString(),
      };

      // In a real implementation, this would persist to a database or file
      // For now, we'll emit an event that can be handled by external systems
      this.emit('status:persisted', { statusData });
    } catch (error) {
      this.logger.error('Failed to persist status data', {
        error: error as Error,
      });
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.persistenceInterval) {
      clearInterval(this.persistenceInterval);
    }

    this.removeAllListeners();
    this.tasks.clear();
    this.agents.clear();
    this.statusHistory.length = 0;
    this.subscribers.clear();

    this.logger.info('TaskStatusMonitor destroyed');
  }
}

/**
 * Singleton instance for global access
 */
export const taskStatusMonitor = new TaskStatusMonitor();
