/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import type {
  Task,
  TaskExecutionResult,
  TaskContext,
  QueueMetrics
} from './TaskQueue.js';
import type { TaskId } from './types.js';
import type { LifecycleContext, LifecycleState } from './TaskLifecycle.js';
import type { SchedulingDecision, SchedulingContext, SchedulingAlgorithm } from './PriorityScheduler.js';
import type { QueueSnapshot, PersistenceOperation } from './QueuePersistence.js';

/**
 * Execution engine capabilities and features
 */
export interface ExecutionEngineCapabilities {
  maxConcurrentTasks: number;
  supportedTaskTypes: string[];
  availableResources: Map<string, number>;
  enabledFeatures: {
    parallelExecution: boolean;
    taskBatching: boolean;
    smartScheduling: boolean;
    persistentStorage: boolean;
    realTimeMonitoring: boolean;
    automaticRetries: boolean;
    dependencyResolution: boolean;
    resourceManagement: boolean;
  };
  performanceProfile: {
    averageTaskDuration: number;
    throughputPerHour: number;
    successRate: number;
    resourceUtilization: number;
  };
}

/**
 * Execution engine configuration
 */
export interface ExecutionEngineConfig {
  // Core settings
  maxConcurrentTasks: number;
  defaultTimeout: number;
  maxRetries: number;
  retryDelay: number;

  // Scheduling configuration
  schedulingAlgorithm: SchedulingAlgorithm;
  enableSmartScheduling: boolean;
  priorityAdjustmentInterval: number;

  // Persistence settings
  enablePersistence: boolean;
  persistenceInterval: number;
  snapshotRetention: number;

  // Monitoring configuration
  enableRealTimeMetrics: boolean;
  metricsCollectionInterval: number;
  performanceThresholds: {
    maxAverageWaitTime: number;
    minSuccessRate: number;
    maxResourceUtilization: number;
  };

  // Resource management
  resourcePools: Map<string, number>;
  resourceAllocationStrategy: 'greedy' | 'balanced' | 'optimized';

  // Advanced features
  enableTaskBatching: boolean;
  enableDependencyOptimization: boolean;
  enableAutomaticScaling: boolean;
  enableAnomalyDetection: boolean;
}

/**
 * Task submission request
 */
export interface TaskSubmissionRequest {
  task: Omit<Task, 'id' | 'createdAt' | 'status' | 'currentRetries'>;
  priority?: 'immediate' | 'high' | 'normal' | 'low';
  schedulingHints?: {
    preferredExecutionTime?: Date;
    resourcePreference?: string[];
    batchGroup?: string;
    dependencyOptimization?: boolean;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Task submission response
 */
export interface TaskSubmissionResponse {
  taskId: TaskId;
  estimatedStartTime: Date;
  estimatedCompletionTime: Date;
  assignedResources: string[];
  queuePosition: number;
  scheduleConfidence: number;
}

/**
 * Task execution request
 */
export interface TaskExecutionRequest {
  taskId: TaskId;
  executionContext: TaskContext;
  resources: string[];
  timeout: number;
  retryAttempt: number;
}

/**
 * Task status query
 */
export interface TaskStatusQuery {
  taskIds?: TaskId[];
  states?: LifecycleState[];
  categories?: string[];
  priorities?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  limit?: number;
  offset?: number;
  includeHistory?: boolean;
  includeMetrics?: boolean;
}

/**
 * Task status response
 */
export interface TaskStatusResponse {
  tasks: Array<{
    taskId: TaskId;
    currentState: LifecycleState;
    progress: number;
    startTime?: Date;
    estimatedCompletionTime?: Date;
    actualCompletionTime?: Date;
    result?: TaskExecutionResult;
    lifecycle: LifecycleContext;
    metrics?: {
      executionDuration: number;
      waitTime: number;
      retryCount: number;
      resourceUsage: Record<string, number>;
    };
  }>;
  pagination?: {
    total: number;
    offset: number;
    limit: number;
    hasNext: boolean;
  };
}

/**
 * Real-time task progress update
 */
export interface TaskProgressUpdate {
  taskId: TaskId;
  timestamp: Date;
  progress: number; // 0-100
  currentPhase: string;
  message?: string;
  data?: unknown;
  estimatedTimeRemaining?: number;
}

/**
 * Resource allocation request
 */
export interface ResourceAllocationRequest {
  taskId: TaskId;
  requiredResources: Array<{
    type: string;
    quantity: number;
    priority: 'required' | 'preferred' | 'optional';
    constraints?: Record<string, unknown>;
  }>;
  duration: number;
  fallbackOptions?: Array<{
    resources: string[];
    qualityImpact: number; // 0-1 scale
  }>;
}

/**
 * Resource allocation response
 */
export interface ResourceAllocationResponse {
  allocationId: string;
  allocatedResources: Array<{
    type: string;
    quantity: number;
    poolId: string;
    expiryTime: Date;
  }>;
  partialAllocation: boolean;
  retryRecommendation?: Date;
}

/**
 * Queue management command
 */
export interface QueueManagementCommand {
  command: 'pause' | 'resume' | 'drain' | 'clear' | 'optimize' | 'rebalance' | 'compact';
  parameters?: Record<string, unknown>;
  targetTasks?: TaskId[];
  reason?: string;
}

/**
 * Queue management response
 */
export interface QueueManagementResponse {
  success: boolean;
  message: string;
  affectedTasks: number;
  estimatedCompletion?: Date;
  details?: Record<string, unknown>;
}

/**
 * Performance analytics request
 */
export interface PerformanceAnalyticsRequest {
  timeRange: {
    from: Date;
    to: Date;
  };
  granularity: 'minute' | 'hour' | 'day' | 'week';
  metrics: Array<
    'throughput' | 'latency' | 'success_rate' | 'resource_utilization' |
    'queue_depth' | 'execution_time' | 'wait_time' | 'retry_rate'
  >;
  groupBy?: Array<'category' | 'priority' | 'resource' | 'algorithm'>;
  filters?: {
    categories?: string[];
    priorities?: string[];
    states?: LifecycleState[];
  };
}

/**
 * Performance analytics response
 */
export interface PerformanceAnalyticsResponse {
  data: Array<{
    timestamp: Date;
    metrics: Record<string, number>;
    dimensions?: Record<string, string>;
  }>;
  summary: {
    totalTasks: number;
    avgThroughput: number;
    avgLatency: number;
    overallSuccessRate: number;
    resourceUtilization: Record<string, number>;
  };
  trends: Array<{
    metric: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercent: number;
  }>;
  recommendations?: Array<{
    type: 'optimization' | 'scaling' | 'configuration';
    priority: 'high' | 'medium' | 'low';
    description: string;
    expectedImpact: string;
    implementationEffort: 'low' | 'medium' | 'high';
  }>;
}

/**
 * Main execution engine interface
 */
export interface IExecutionEngine {
  // Engine management
  initialize(config: ExecutionEngineConfig): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  getCapabilities(): ExecutionEngineCapabilities;
  updateConfiguration(config: Partial<ExecutionEngineConfig>): Promise<void>;

  // Task lifecycle management
  submitTask(request: TaskSubmissionRequest): Promise<TaskSubmissionResponse>;
  cancelTask(taskId: TaskId, reason?: string): Promise<boolean>;
  retryTask(taskId: TaskId): Promise<boolean>;
  pauseTask(taskId: TaskId): Promise<boolean>;
  resumeTask(taskId: TaskId): Promise<boolean>;

  // Status and monitoring
  getTaskStatus(query: TaskStatusQuery): Promise<TaskStatusResponse>;
  getTaskProgress(taskId: TaskId): Promise<TaskProgressUpdate | null>;
  subscribeToTaskUpdates(taskId: TaskId, callback: (update: TaskProgressUpdate) => void): string;
  unsubscribeFromTaskUpdates(subscriptionId: string): boolean;

  // Queue management
  getQueueMetrics(): Promise<QueueMetrics>;
  manageQueue(command: QueueManagementCommand): Promise<QueueManagementResponse>;
  optimizeQueue(): Promise<{ optimizationsApplied: string[]; expectedImpact: number }>;

  // Resource management
  allocateResources(request: ResourceAllocationRequest): Promise<ResourceAllocationResponse>;
  releaseResources(allocationId: string): Promise<boolean>;
  getResourceUtilization(): Promise<Record<string, { used: number; total: number; utilization: number }>>;

  // Analytics and performance
  getPerformanceAnalytics(request: PerformanceAnalyticsRequest): Promise<PerformanceAnalyticsResponse>;
  getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    issues: Array<{ severity: 'warning' | 'error'; message: string; component: string }>;
    uptime: number;
    lastHealthCheck: Date;
  }>;

  // Persistence and recovery
  createSnapshot(description?: string): Promise<string>;
  restoreFromSnapshot(snapshotId: string): Promise<void>;
  listSnapshots(): Promise<Array<{ id: string; timestamp: Date; description: string; taskCount: number }>>;

  // Events
  on(event: 'taskSubmitted', listener: (taskId: TaskId, request: TaskSubmissionRequest) => void): this;
  on(event: 'taskStarted', listener: (taskId: TaskId, context: TaskContext) => void): this;
  on(event: 'taskProgress', listener: (update: TaskProgressUpdate) => void): this;
  on(event: 'taskCompleted', listener: (taskId: TaskId, result: TaskExecutionResult) => void): this;
  on(event: 'taskFailed', listener: (taskId: TaskId, error: Error, retryScheduled: boolean) => void): this;
  on(event: 'queueOptimized', listener: (metrics: { before: QueueMetrics; after: QueueMetrics }) => void): this;
  on(event: 'resourcesAllocated', listener: (allocation: ResourceAllocationResponse) => void): this;
  on(event: 'performanceAlert', listener: (alert: { type: string; message: string; severity: 'info' | 'warning' | 'error' }) => void): this;
}

/**
 * Task queue integration interface
 */
export interface ITaskQueueIntegration {
  // Task management integration
  onTaskAdded(task: Task): Promise<void>;
  onTaskUpdated(task: Task, previousState: LifecycleState): Promise<void>;
  onTaskCompleted(task: Task, result: TaskExecutionResult): Promise<void>;
  onTaskFailed(task: Task, error: Error): Promise<void>;

  // Scheduling integration
  requestScheduling(
    eligibleTasks: Task[],
    availableSlots: number,
    context: SchedulingContext
  ): Promise<SchedulingDecision>;
  applySchedulingDecision(decision: SchedulingDecision): Promise<void>;

  // Lifecycle integration
  onLifecycleTransition(
    taskId: TaskId,
    fromState: LifecycleState,
    toState: LifecycleState,
    context: LifecycleContext
  ): Promise<void>;

  // Persistence integration
  onSnapshotCreated(snapshot: QueueSnapshot): Promise<void>;
  onSnapshotRestored(snapshot: QueueSnapshot): Promise<void>;
  onPersistenceOperation(operation: PersistenceOperation): Promise<void>;
}

/**
 * Priority scheduler integration interface
 */
export interface IPrioritySchedulerIntegration {
  // Algorithm management
  selectSchedulingAlgorithm(
    tasks: Task[],
    context: SchedulingContext
  ): Promise<SchedulingAlgorithm>;

  configureAlgorithm(
    algorithm: SchedulingAlgorithm,
    configuration: Record<string, unknown>
  ): Promise<void>;

  // Learning and adaptation
  recordExecutionOutcome(
    decision: SchedulingDecision,
    outcomes: TaskExecutionResult[]
  ): Promise<void>;

  // Performance monitoring
  getSchedulingPerformance(): Promise<{
    algorithmPerformance: Map<SchedulingAlgorithm, number>;
    decisionAccuracy: number;
    adaptationRate: number;
  }>;
}

/**
 * Lifecycle manager integration interface
 */
export interface ILifecycleManagerIntegration {
  // Lifecycle control
  initializeTaskLifecycle(task: Task): Promise<LifecycleContext>;
  transitionTaskState(
    taskId: TaskId,
    newState: LifecycleState,
    metadata?: Record<string, unknown>
  ): Promise<boolean>;

  // Hook management
  registerLifecycleHook(
    state: LifecycleState,
    timing: 'before' | 'after' | 'during',
    handler: (task: Task, context: LifecycleContext) => Promise<void>
  ): string;
  unregisterLifecycleHook(hookId: string): boolean;

  // Validation
  validateTaskPreConditions(taskId: TaskId): Promise<boolean>;
  validateTaskPostConditions(taskId: TaskId): Promise<boolean>;

  // Metrics and analysis
  getLifecycleMetrics(taskId?: TaskId): Promise<{
    taskSpecific?: any;
    aggregate: {
      averageLifecycleDuration: number;
      stateDistribution: Map<LifecycleState, number>;
      transitionPatterns: Array<{ from: LifecycleState; to: LifecycleState; frequency: number }>;
    };
  }>;
}

/**
 * Persistence manager integration interface
 */
export interface IPersistenceManagerIntegration {
  // Persistence operations
  saveQueueState(): Promise<string>;
  loadQueueState(snapshotId?: string): Promise<QueueSnapshot | null>;
  createBackup(description?: string): Promise<string>;
  restoreFromBackup(backupId: string): Promise<QueueSnapshot>;

  // Transaction logging
  recordTransaction(
    operation: 'create' | 'update' | 'delete' | 'transition',
    entityType: 'task' | 'dependency' | 'record' | 'context',
    entityId: string,
    beforeState?: unknown,
    afterState?: unknown
  ): void;

  // Data integrity
  verifyDataIntegrity(): Promise<{
    valid: boolean;
    issues: Array<{ type: string; description: string; severity: 'warning' | 'error' }>;
  }>;

  // Storage management
  optimizeStorage(): Promise<void>;
  getStorageStats(): Promise<{
    totalSize: number;
    snapshotCount: number;
    backupCount: number;
    transactionLogSize: number;
    lastOptimization: Date;
  }>;
}

/**
 * Integration event types for type safety
 */
export interface IntegrationEvents {
  // Task events
  'task:submitted': { taskId: TaskId; request: TaskSubmissionRequest };
  'task:scheduled': { taskId: TaskId; decision: SchedulingDecision };
  'task:started': { taskId: TaskId; context: TaskContext };
  'task:progress': { update: TaskProgressUpdate };
  'task:paused': { taskId: TaskId; reason: string };
  'task:resumed': { taskId: TaskId };
  'task:completed': { taskId: TaskId; result: TaskExecutionResult };
  'task:failed': { taskId: TaskId; error: Error; willRetry: boolean };
  'task:cancelled': { taskId: TaskId; reason: string };

  // Queue events
  'queue:optimized': { metrics: QueueMetrics; optimizations: string[] };
  'queue:paused': { reason: string };
  'queue:resumed': {};
  'queue:drained': { completedTasks: number; cancelledTasks: number };

  // Scheduling events
  'scheduling:algorithmChanged': { from: SchedulingAlgorithm; to: SchedulingAlgorithm };
  'scheduling:decisionMade': { decision: SchedulingDecision; context: SchedulingContext };
  'scheduling:performanceUpdated': { algorithm: SchedulingAlgorithm; metrics: Record<string, number> };

  // Lifecycle events
  'lifecycle:stateTransition': { taskId: TaskId; from: LifecycleState; to: LifecycleState };
  'lifecycle:hookExecuted': { taskId: TaskId; hookId: string; state: LifecycleState };
  'lifecycle:validationFailed': { taskId: TaskId; type: 'precondition' | 'postcondition'; details: string };

  // Persistence events
  'persistence:snapshotCreated': { snapshotId: string; taskCount: number; size: number };
  'persistence:snapshotLoaded': { snapshotId: string; taskCount: number };
  'persistence:backupCreated': { backupId: string; description: string };
  'persistence:integrityCheck': { valid: boolean; issues: number };

  // Resource events
  'resources:allocated': { allocation: ResourceAllocationResponse };
  'resources:released': { allocationId: string };
  'resources:utilizationThreshold': { resource: string; utilization: number; threshold: number };

  // Performance events
  'performance:thresholdExceeded': { metric: string; value: number; threshold: number };
  'performance:anomalyDetected': { type: string; description: string; severity: 'low' | 'medium' | 'high' };
  'performance:optimizationSuggestion': { suggestion: string; expectedImpact: number };

  // System events
  'system:healthCheck': { status: 'healthy' | 'degraded' | 'critical'; issues: string[] };
  'system:configurationUpdated': { changes: Record<string, unknown> };
  'system:shutdown': { reason: string };
  'system:emergency': { type: string; message: string };
}

/**
 * Event emitter with typed events for integration
 */
export interface IIntegrationEventEmitter {
  emit<K extends keyof IntegrationEvents>(event: K, data: IntegrationEvents[K]): boolean;
  on<K extends keyof IntegrationEvents>(event: K, listener: (data: IntegrationEvents[K]) => void): this;
  once<K extends keyof IntegrationEvents>(event: K, listener: (data: IntegrationEvents[K]) => void): this;
  off<K extends keyof IntegrationEvents>(event: K, listener: (data: IntegrationEvents[K]) => void): this;
  removeAllListeners<K extends keyof IntegrationEvents>(event?: K): this;
}