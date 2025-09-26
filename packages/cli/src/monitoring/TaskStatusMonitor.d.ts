/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
/**
 * Task status definitions for comprehensive monitoring
 */
export declare enum TaskStatus {
  QUEUED = 'queued',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  BLOCKED = 'blocked',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}
export declare enum TaskPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  NORMAL = 'normal',
  LOW = 'low',
}
export declare enum TaskType {
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
export declare class TaskStatusMonitor extends EventEmitter {
  private readonly logger;
  private tasks;
  private agents;
  private statusHistory;
  private subscribers;
  private persistenceInterval?;
  private performanceMetrics;
  constructor();
  /**
   * Register a new task for monitoring
   */
  registerTask(
    task: Omit<
      TaskMetadata,
      'id' | 'lastUpdate' | 'status' | 'progress' | 'errorCount' | 'retryCount'
    >,
  ): Promise<string>;
  /**
   * Update task status with comprehensive tracking
   */
  updateTaskStatus(
    taskId: string,
    newStatus: TaskStatus,
    options?: {
      agentId?: string;
      progress?: number;
      message?: string;
      error?: string;
      context?: Record<string, unknown>;
    },
  ): Promise<boolean>;
  /**
   * Register and monitor an agent
   */
  registerAgent(agentId: string, capabilities: string[]): Promise<void>;
  /**
   * Update agent heartbeat and status
   */
  updateAgentHeartbeat(agentId: string): Promise<void>;
  /**
   * Get comprehensive task status information
   */
  getTaskStatus(taskId: string): TaskMetadata | undefined;
  /**
   * Get all tasks with optional filtering
   */
  getAllTasks(filters?: {
    status?: TaskStatus;
    type?: TaskType;
    priority?: TaskPriority;
    assignedAgent?: string;
  }): TaskMetadata[];
  /**
   * Get task status history
   */
  getTaskStatusHistory(taskId?: string, limit?: number): TaskStatusUpdate[];
  /**
   * Get agent status information
   */
  getAgentStatus(agentId: string): AgentStatus | undefined;
  /**
   * Get all agent statuses
   */
  getAllAgents(): AgentStatus[];
  /**
   * Get comprehensive performance metrics
   */
  getPerformanceMetrics(): typeof this.performanceMetrics & {
    activeAgents: number;
    tasksInProgress: number;
    queuedTasks: number;
    blockedTasks: number;
    systemEfficiency: number;
  };
  /**
   * Subscribe to real-time updates
   */
  subscribe(subscriberId: string): void;
  /**
   * Unsubscribe from real-time updates
   */
  unsubscribe(subscriberId: string): void;
  private generateTaskId;
  private recordStatusUpdate;
  private updateAgentTaskAssignment;
  private getTaskCountsByStatus;
  private setupPeriodicPersistence;
  private persistStatus;
  /**
   * Cleanup resources
   */
  destroy(): void;
}
/**
 * Singleton instance for global access
 */
export declare const taskStatusMonitor: TaskStatusMonitor;
