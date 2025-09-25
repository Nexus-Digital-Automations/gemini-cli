/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TaskId} from './Task';
import { TaskPriority, TaskStatus, Task } from './Task';
import type { AgentId } from './Agent';

/**
 * Unique identifier for queues
 */
export type QueueId = string;

/**
 * Queue types enumeration
 */
export enum QueueType {
  PRIORITY = 'priority',
  FIFO = 'fifo',
  LIFO = 'lifo',
  DEPENDENCY = 'dependency',
  ROUND_ROBIN = 'round_robin',
  FAIR_SHARE = 'fair_share',
  CUSTOM = 'custom'
}

/**
 * Queue status enumeration
 */
export enum QueueStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  DRAINING = 'draining',
  STOPPED = 'stopped',
  ERROR = 'error'
}

/**
 * Queue entry interface
 */
export interface QueueEntry {
  /** Entry identifier */
  id: string;

  /** Task identifier */
  taskId: TaskId;

  /** Queue entry priority */
  priority: number;

  /** Queue entry weight */
  weight: number;

  /** Queue entry timestamp */
  enqueuedAt: Date;

  /** Queue entry deadline */
  deadline?: Date;

  /** Queue entry dependencies */
  dependencies: TaskId[];

  /** Queue entry metadata */
  metadata: QueueEntryMetadata;

  /** Queue entry attempts */
  attempts: QueueAttempt[];
}

/**
 * Queue entry metadata
 */
export interface QueueEntryMetadata {
  /** Entry source */
  source: string;

  /** Entry creator */
  createdBy: AgentId;

  /** Entry tags */
  tags: string[];

  /** Custom properties */
  properties: Record<string, any>;

  /** Retry policy */
  retryPolicy?: RetryPolicy;

  /** Timeout settings */
  timeout?: TimeoutSettings;
}

/**
 * Queue attempt record
 */
export interface QueueAttempt {
  /** Attempt number */
  attemptNumber: number;

  /** Attempt timestamp */
  attemptedAt: Date;

  /** Assigned agent */
  assignedAgent: AgentId;

  /** Attempt status */
  status: AttemptStatus;

  /** Attempt result */
  result?: AttemptResult;

  /** Attempt error */
  error?: string;

  /** Attempt duration in milliseconds */
  duration?: number;
}

/**
 * Attempt status enumeration
 */
export enum AttemptStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout'
}

/**
 * Attempt result
 */
export interface AttemptResult {
  /** Success status */
  success: boolean;

  /** Result data */
  data?: Record<string, any>;

  /** Result artifacts */
  artifacts?: string[];

  /** Performance metrics */
  metrics?: Record<string, number>;
}

/**
 * Retry policy
 */
export interface RetryPolicy {
  /** Maximum number of retries */
  maxRetries: number;

  /** Initial retry delay in milliseconds */
  initialDelay: number;

  /** Retry delay multiplier */
  delayMultiplier: number;

  /** Maximum retry delay in milliseconds */
  maxDelay: number;

  /** Jitter enabled */
  jitterEnabled: boolean;

  /** Retry on specific errors */
  retryOnErrors: string[];

  /** Don't retry on specific errors */
  noRetryOnErrors: string[];
}

/**
 * Timeout settings
 */
export interface TimeoutSettings {
  /** Queue timeout in milliseconds */
  queueTimeout: number;

  /** Execution timeout in milliseconds */
  executionTimeout: number;

  /** Heartbeat timeout in milliseconds */
  heartbeatTimeout: number;

  /** Idle timeout in milliseconds */
  idleTimeout: number;
}

/**
 * Core queue interface
 */
export interface TaskQueue {
  /** Unique queue identifier */
  id: QueueId;

  /** Queue name */
  name: string;

  /** Queue description */
  description: string;

  /** Queue type */
  type: QueueType;

  /** Queue status */
  status: QueueStatus;

  /** Queue configuration */
  config: QueueConfiguration;

  /** Queue entries */
  entries: QueueEntry[];

  /** Queue statistics */
  stats: QueueStatistics;

  /** Queue timestamps */
  timestamps: QueueTimestamps;

  /** Queue history */
  history: QueueHistoryEntry[];
}

/**
 * Queue configuration
 */
export interface QueueConfiguration {
  /** Maximum queue size */
  maxSize: number;

  /** Queue concurrency limit */
  concurrency: number;

  /** Queue processing mode */
  processingMode: ProcessingMode;

  /** Priority settings */
  prioritySettings: PrioritySettings;

  /** Dependency settings */
  dependencySettings: DependencySettings;

  /** Scheduling settings */
  schedulingSettings: SchedulingSettings;

  /** Throttling settings */
  throttlingSettings: ThrottlingSettings;
}

/**
 * Processing mode enumeration
 */
export enum ProcessingMode {
  PARALLEL = 'parallel',
  SEQUENTIAL = 'sequential',
  BATCH = 'batch',
  STREAMING = 'streaming'
}

/**
 * Priority settings
 */
export interface PrioritySettings {
  /** Enable priority processing */
  enabled: boolean;

  /** Priority levels */
  levels: PriorityLevel[];

  /** Priority aging enabled */
  agingEnabled: boolean;

  /** Priority aging rate */
  agingRate: number;

  /** Priority boost settings */
  boostSettings: PriorityBoostSettings;
}

/**
 * Priority level configuration
 */
export interface PriorityLevel {
  /** Priority name */
  name: string;

  /** Priority value */
  value: number;

  /** Priority weight */
  weight: number;

  /** Priority threshold */
  threshold: number;

  /** Priority color for visualization */
  color: string;
}

/**
 * Priority boost settings
 */
export interface PriorityBoostSettings {
  /** Enable priority boost */
  enabled: boolean;

  /** Boost conditions */
  conditions: BoostCondition[];

  /** Boost multiplier */
  multiplier: number;

  /** Boost duration in milliseconds */
  duration: number;
}

/**
 * Boost condition
 */
export interface BoostCondition {
  /** Condition type */
  type: BoostConditionType;

  /** Condition value */
  value: any;

  /** Condition operator */
  operator: ComparisonOperator;
}

/**
 * Boost condition types
 */
export enum BoostConditionType {
  WAIT_TIME = 'wait_time',
  RETRY_COUNT = 'retry_count',
  DEADLINE_PROXIMITY = 'deadline_proximity',
  AGENT_AVAILABILITY = 'agent_availability',
  DEPENDENCY_STATUS = 'dependency_status',
  CUSTOM = 'custom'
}

/**
 * Comparison operators
 */
export enum ComparisonOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
  LESS_THAN_OR_EQUAL = 'less_than_or_equal',
  CONTAINS = 'contains',
  MATCHES = 'matches'
}

/**
 * Dependency settings
 */
export interface DependencySettings {
  /** Enable dependency checking */
  enabled: boolean;

  /** Dependency resolution strategy */
  resolutionStrategy: DependencyResolutionStrategy;

  /** Circular dependency handling */
  circularDependencyHandling: CircularDependencyHandling;

  /** Dependency timeout in milliseconds */
  timeout: number;
}

/**
 * Dependency resolution strategy
 */
export enum DependencyResolutionStrategy {
  STRICT = 'strict',
  LENIENT = 'lenient',
  BEST_EFFORT = 'best_effort',
  PARALLEL = 'parallel'
}

/**
 * Circular dependency handling
 */
export enum CircularDependencyHandling {
  ERROR = 'error',
  WARNING = 'warning',
  IGNORE = 'ignore',
  AUTO_RESOLVE = 'auto_resolve'
}

/**
 * Scheduling settings
 */
export interface SchedulingSettings {
  /** Scheduling algorithm */
  algorithm: SchedulingAlgorithm;

  /** Load balancing strategy */
  loadBalancing: LoadBalancingStrategy;

  /** Agent selection criteria */
  agentSelection: AgentSelectionCriteria;

  /** Preemption settings */
  preemption: PreemptionSettings;
}

/**
 * Scheduling algorithms
 */
export enum SchedulingAlgorithm {
  FIRST_COME_FIRST_SERVED = 'fcfs',
  SHORTEST_JOB_FIRST = 'sjf',
  PRIORITY_SCHEDULING = 'priority',
  ROUND_ROBIN = 'round_robin',
  MULTILEVEL_FEEDBACK = 'multilevel_feedback',
  FAIR_SHARE = 'fair_share',
  LOTTERY = 'lottery'
}

/**
 * Load balancing strategies
 */
export enum LoadBalancingStrategy {
  ROUND_ROBIN = 'round_robin',
  LEAST_CONNECTIONS = 'least_connections',
  LEAST_LOAD = 'least_load',
  WEIGHTED_ROUND_ROBIN = 'weighted_round_robin',
  CONSISTENT_HASH = 'consistent_hash',
  RANDOM = 'random'
}

/**
 * Agent selection criteria
 */
export interface AgentSelectionCriteria {
  /** Required specializations */
  requiredSpecializations: string[];

  /** Preferred specializations */
  preferredSpecializations: string[];

  /** Minimum capability level */
  minCapabilityLevel: number;

  /** Performance threshold */
  performanceThreshold: number;

  /** Availability requirement */
  availabilityRequirement: number;

  /** Custom selection rules */
  customRules: SelectionRule[];
}

/**
 * Selection rule
 */
export interface SelectionRule {
  /** Rule name */
  name: string;

  /** Rule expression */
  expression: string;

  /** Rule weight */
  weight: number;

  /** Rule priority */
  priority: number;
}

/**
 * Preemption settings
 */
export interface PreemptionSettings {
  /** Enable preemption */
  enabled: boolean;

  /** Preemption strategy */
  strategy: PreemptionStrategy;

  /** Priority threshold for preemption */
  priorityThreshold: number;

  /** Grace period in milliseconds */
  gracePeriod: number;
}

/**
 * Preemption strategies
 */
export enum PreemptionStrategy {
  PRIORITY_BASED = 'priority_based',
  DEADLINE_BASED = 'deadline_based',
  RESOURCE_BASED = 'resource_based',
  CUSTOM = 'custom'
}

/**
 * Throttling settings
 */
export interface ThrottlingSettings {
  /** Enable throttling */
  enabled: boolean;

  /** Rate limit per second */
  rateLimit: number;

  /** Burst size */
  burstSize: number;

  /** Throttling window in milliseconds */
  window: number;

  /** Throttling strategy */
  strategy: ThrottlingStrategy;
}

/**
 * Throttling strategies
 */
export enum ThrottlingStrategy {
  TOKEN_BUCKET = 'token_bucket',
  LEAKY_BUCKET = 'leaky_bucket',
  SLIDING_WINDOW = 'sliding_window',
  FIXED_WINDOW = 'fixed_window'
}

/**
 * Queue statistics
 */
export interface QueueStatistics {
  /** Current queue size */
  currentSize: number;

  /** Maximum queue size reached */
  maxSizeReached: number;

  /** Total entries processed */
  totalProcessed: number;

  /** Total entries failed */
  totalFailed: number;

  /** Success rate percentage */
  successRate: number;

  /** Average wait time in milliseconds */
  averageWaitTime: number;

  /** Average processing time in milliseconds */
  averageProcessingTime: number;

  /** Throughput per minute */
  throughput: number;

  /** Current load percentage */
  currentLoad: number;

  /** Processing rate statistics */
  processingRates: ProcessingRateStats;
}

/**
 * Processing rate statistics
 */
export interface ProcessingRateStats {
  /** Last minute rate */
  lastMinute: number;

  /** Last hour rate */
  lastHour: number;

  /** Last day rate */
  lastDay: number;

  /** Peak rate */
  peak: number;

  /** Average rate */
  average: number;
}

/**
 * Queue timestamps
 */
export interface QueueTimestamps {
  /** Queue creation timestamp */
  createdAt: Date;

  /** Queue last update timestamp */
  updatedAt: Date;

  /** Queue last processing timestamp */
  lastProcessedAt?: Date;

  /** Queue last pause timestamp */
  lastPausedAt?: Date;

  /** Queue last resume timestamp */
  lastResumedAt?: Date;
}

/**
 * Queue history entry
 */
export interface QueueHistoryEntry {
  /** Entry timestamp */
  timestamp: Date;

  /** Action performed */
  action: QueueAction;

  /** Action details */
  details: string;

  /** Related task ID */
  taskId?: TaskId;

  /** Related agent ID */
  agentId?: AgentId;

  /** Action metadata */
  metadata?: Record<string, any>;
}

/**
 * Queue actions for history tracking
 */
export enum QueueAction {
  CREATED = 'created',
  STARTED = 'started',
  PAUSED = 'paused',
  RESUMED = 'resumed',
  STOPPED = 'stopped',
  TASK_ENQUEUED = 'task_enqueued',
  TASK_DEQUEUED = 'task_dequeued',
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMPLETED = 'task_completed',
  TASK_FAILED = 'task_failed',
  TASK_RETRIED = 'task_retried',
  CONFIGURATION_CHANGED = 'configuration_changed',
  SIZE_LIMIT_REACHED = 'size_limit_reached',
  THROTTLING_ACTIVATED = 'throttling_activated'
}