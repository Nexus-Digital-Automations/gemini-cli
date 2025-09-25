/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Intelligent Task Scheduler for Dependency-Based Execution
 * Advanced scheduling system that optimizes task execution based on dependencies,
 * resource constraints, and real-time system conditions
 *
 * === CORE CAPABILITIES ===
 * • Dynamic priority-based task scheduling with dependency awareness
 * • Resource-constrained parallel execution optimization
 * • Adaptive scheduling based on real-time performance metrics
 * • Intelligent load balancing and resource allocation
 * • Predictive scheduling with failure recovery mechanisms
 * • Multi-agent coordination for distributed task execution
 *
 * === SCHEDULING ALGORITHMS ===
 * 1. Critical Path Method (CPM) for timeline optimization
 * 2. Shortest Processing Time (SPT) for quick wins
 * 3. Earliest Deadline First (EDF) for deadline-sensitive tasks
 * 4. Resource-Constrained Project Scheduling (RCPS)
 * 5. Adaptive Priority Scheduling with machine learning insights
 *
 * @author DEPENDENCY_ANALYST
 * @version 1.0.0
 * @since 2025-09-25
 */
import { EventEmitter } from 'node:events';
import {
  DependencyAnalyzer,
  TaskNode,
  TaskDependency,
} from './DependencyAnalyzer.js';
/**
 * Resource allocation limits and constraints
 */
export interface ResourceConstraints {
  maxConcurrentTasks: number;
  maxCpuCores: number;
  maxMemoryMB: number;
  maxDiskSpaceGB: number;
  maxNetworkBandwidthMbps: number;
  reservedResources: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
}
/**
 * Task execution context with resource tracking
 */
export interface ExecutionContext {
  taskId: string;
  startTime: Date;
  estimatedEndTime: Date;
  actualEndTime?: Date;
  allocatedResources: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  executionAgent?: string;
  priority: number;
  dependencies: string[];
  status: 'queued' | 'running' | 'completed' | 'failed' | 'paused';
  retryCount: number;
  maxRetries: number;
  metrics: {
    queueTime: number;
    executionTime: number;
    resourceUtilization: Record<string, number>;
  };
}
/**
 * Scheduling strategy configuration
 */
export interface SchedulingStrategy {
  algorithm:
    | 'critical_path'
    | 'shortest_first'
    | 'deadline_first'
    | 'priority_first'
    | 'adaptive';
  parallelizationEnabled: boolean;
  resourceOptimization: boolean;
  failureRecovery: boolean;
  dynamicPriorityAdjustment: boolean;
  loadBalancing: boolean;
  predictiveScheduling: boolean;
  reschedulingThreshold: number;
}
/**
 * Real-time system performance metrics
 */
export interface SystemMetrics {
  currentLoad: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  taskThroughput: number;
  averageExecutionTime: number;
  successRate: number;
  resourceEfficiency: number;
  queueLength: number;
  activeTaskCount: number;
  timestamp: Date;
}
/**
 * Scheduling event for monitoring and analytics
 */
export interface SchedulingEvent {
  type:
    | 'task_scheduled'
    | 'task_started'
    | 'task_completed'
    | 'task_failed'
    | 'schedule_optimized'
    | 'resource_allocated';
  taskId?: string;
  timestamp: Date;
  data: Record<string, any>;
  impact: 'low' | 'medium' | 'high' | 'critical';
}
/**
 * Intelligent Task Scheduler Implementation
 */
export declare class IntelligentTaskScheduler extends EventEmitter {
  private readonly logger;
  private readonly dependencyAnalyzer;
  private resourceConstraints;
  private schedulingStrategy;
  private executionQueue;
  private runningTasks;
  private completedTasks;
  private failedTasks;
  private systemMetrics;
  private performanceHistory;
  private schedulingEvents;
  private schedulingTimer?;
  private metricsCollectionTimer?;
  private readonly maxHistorySize;
  private readonly schedulingInterval;
  private readonly metricsInterval;
  constructor(
    dependencyAnalyzer: DependencyAnalyzer,
    resourceConstraints?: Partial<ResourceConstraints>,
    schedulingStrategy?: Partial<SchedulingStrategy>,
  );
  /**
   * Submit task for intelligent scheduling
   */
  scheduleTask(task: TaskNode, dependencies?: TaskDependency[]): Promise<void>;
  /**
   * Update scheduling strategy dynamically
   */
  updateSchedulingStrategy(strategy: Partial<SchedulingStrategy>): void;
  /**
   * Update resource constraints
   */
  updateResourceConstraints(constraints: Partial<ResourceConstraints>): void;
  /**
   * Get current scheduler status
   */
  getSchedulerStatus(): {
    queuedTasks: number;
    runningTasks: number;
    completedTasks: number;
    failedTasks: number;
    resourceUtilization: Record<string, number>;
    systemMetrics: SystemMetrics;
    strategy: SchedulingStrategy;
  };
  /**
   * Get detailed task execution status
   */
  getTaskStatus(taskId: string): ExecutionContext | null;
  /**
   * Cancel queued task
   */
  cancelTask(taskId: string): boolean;
  /**
   * Get performance analytics
   */
  getPerformanceAnalytics(): {
    averageQueueTime: number;
    averageExecutionTime: number;
    successRate: number;
    resourceEfficiency: number;
    throughput: number;
    bottlenecks: string[];
    recommendations: string[];
  };
  /**
   * Start the intelligent scheduling engine
   */
  private startScheduler;
  /**
   * Schedule next available tasks based on current strategy
   */
  private scheduleNextTasks;
  /**
   * Get tasks that are ready for execution
   */
  private getReadyTasks;
  /**
   * Select tasks for execution based on scheduling algorithm
   */
  private selectTasksForExecution;
  /**
   * Start task execution
   */
  private startTaskExecution;
  /**
   * Handle task completion or failure
   */
  private handleTaskCompletion;
  /**
   * Optimize execution queue based on current strategy
   */
  private optimizeExecutionQueue;
  private calculateEstimatedEndTime;
  private calculateResourceAllocation;
  private calculateDynamicPriority;
  private getMaxRetries;
  private canAllocateResources;
  private calculateAvailableResources;
  private calculateUsedResources;
  private calculateCurrentResourceUtilization;
  private initializeSystemMetrics;
  private selectByCriticalPath;
  private selectByShortestFirst;
  private selectByDeadlineFirst;
  private selectByPriority;
  private selectAdaptively;
  private compareByCriticalPath;
  private compareByDuration;
  private compareByDeadline;
  private compareAdaptively;
  private calculateAdaptiveScore;
  private calculateResourceEfficiencyScore;
  private updateMetrics;
  private collectSystemMetrics;
  private adaptiveOptimization;
  private calculateThroughput;
  private calculateAverageExecutionTime;
  private calculateSuccessRate;
  private calculateResourceEfficiency;
  private identifyBottlenecks;
  private generateRecommendations;
  private validateResourceAllocations;
  private simulateTaskExecution;
  private emitSchedulingEvent;
  private determineEventImpact;
  /**
   * Graceful shutdown of the scheduler
   */
  shutdown(): Promise<void>;
}
