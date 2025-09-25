/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Task} from './Task';
import { TaskId, TaskExecutionResult } from './Task';
import type { AgentId } from './Agent';

/**
 * Unique identifier for execution contexts
 */
export type ExecutionId = string;

/**
 * Execution status enumeration
 */
export enum ExecutionStatus {
  PENDING = 'pending',
  INITIALIZING = 'initializing',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETING = 'completing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout'
}

/**
 * Execution mode enumeration
 */
export enum ExecutionMode {
  NORMAL = 'normal',
  DEBUG = 'debug',
  DRY_RUN = 'dry_run',
  SAFE_MODE = 'safe_mode',
  ACCELERATED = 'accelerated'
}

/**
 * Execution context interface
 */
export interface ExecutionContext {
  /** Unique execution identifier */
  id: ExecutionId;

  /** Task being executed */
  task: Task;

  /** Executing agent */
  agent: AgentId;

  /** Execution status */
  status: ExecutionStatus;

  /** Execution mode */
  mode: ExecutionMode;

  /** Execution configuration */
  config: ExecutionConfiguration;

  /** Execution environment */
  environment: ExecutionEnvironment;

  /** Execution state */
  state: ExecutionState;

  /** Execution metrics */
  metrics: ExecutionMetrics;

  /** Execution timestamps */
  timestamps: ExecutionTimestamps;

  /** Execution history */
  history: ExecutionHistoryEntry[];
}

/**
 * Execution configuration
 */
export interface ExecutionConfiguration {
  /** Maximum execution time in milliseconds */
  maxExecutionTime: number;

  /** Maximum memory usage in MB */
  maxMemoryUsage: number;

  /** Maximum CPU usage percentage */
  maxCpuUsage: number;

  /** Timeout settings */
  timeouts: ExecutionTimeouts;

  /** Resource limits */
  resourceLimits: ResourceLimits;

  /** Validation settings */
  validationSettings: ValidationSettings;

  /** Monitoring settings */
  monitoringSettings: MonitoringSettings;

  /** Recovery settings */
  recoverySettings: RecoverySettings;
}

/**
 * Execution timeouts
 */
export interface ExecutionTimeouts {
  /** Initial setup timeout */
  setupTimeout: number;

  /** Command execution timeout */
  commandTimeout: number;

  /** Validation timeout */
  validationTimeout: number;

  /** Cleanup timeout */
  cleanupTimeout: number;

  /** Heartbeat timeout */
  heartbeatTimeout: number;
}

/**
 * Resource limits
 */
export interface ResourceLimits {
  /** Maximum file operations per minute */
  maxFileOperations: number;

  /** Maximum network requests per minute */
  maxNetworkRequests: number;

  /** Maximum process count */
  maxProcesses: number;

  /** Maximum disk space usage in MB */
  maxDiskUsage: number;

  /** Maximum open file descriptors */
  maxFileDescriptors: number;
}

/**
 * Validation settings
 */
export interface ValidationSettings {
  /** Enable pre-execution validation */
  preExecutionValidation: boolean;

  /** Enable post-execution validation */
  postExecutionValidation: boolean;

  /** Enable real-time validation */
  realTimeValidation: boolean;

  /** Validation rules */
  rules: ValidationRule[];

  /** Custom validators */
  customValidators: CustomValidator[];
}

/**
 * Validation rule
 */
export interface ValidationRule {
  /** Rule name */
  name: string;

  /** Rule type */
  type: ValidationRuleType;

  /** Rule configuration */
  config: Record<string, any>;

  /** Rule enabled */
  enabled: boolean;

  /** Rule severity */
  severity: ValidationSeverity;
}

/**
 * Validation rule types
 */
export enum ValidationRuleType {
  LINTING = 'linting',
  TESTING = 'testing',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  STYLE = 'style',
  SYNTAX = 'syntax',
  CUSTOM = 'custom'
}

/**
 * Validation severity levels
 */
export enum ValidationSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Custom validator
 */
export interface CustomValidator {
  /** Validator name */
  name: string;

  /** Validator function */
  validator: (context: ExecutionContext) => Promise<ValidationResult>;

  /** Validator configuration */
  config: Record<string, any>;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Validation passed */
  passed: boolean;

  /** Validation message */
  message: string;

  /** Validation severity */
  severity: ValidationSeverity;

  /** Validation details */
  details?: Record<string, any>;

  /** Validation timestamp */
  timestamp: Date;
}

/**
 * Monitoring settings
 */
export interface MonitoringSettings {
  /** Enable resource monitoring */
  resourceMonitoring: boolean;

  /** Enable performance monitoring */
  performanceMonitoring: boolean;

  /** Enable error monitoring */
  errorMonitoring: boolean;

  /** Monitoring interval in milliseconds */
  monitoringInterval: number;

  /** Metrics collection */
  metricsCollection: MetricsCollection;

  /** Alert settings */
  alertSettings: AlertSettings;
}

/**
 * Metrics collection settings
 */
export interface MetricsCollection {
  /** Enable CPU metrics */
  cpu: boolean;

  /** Enable memory metrics */
  memory: boolean;

  /** Enable disk metrics */
  disk: boolean;

  /** Enable network metrics */
  network: boolean;

  /** Enable custom metrics */
  custom: boolean;

  /** Metrics retention period in days */
  retentionPeriod: number;
}

/**
 * Alert settings
 */
export interface AlertSettings {
  /** CPU usage threshold for alerts */
  cpuThreshold: number;

  /** Memory usage threshold for alerts */
  memoryThreshold: number;

  /** Error rate threshold for alerts */
  errorRateThreshold: number;

  /** Response time threshold for alerts */
  responseTimeThreshold: number;

  /** Alert channels */
  channels: string[];
}

/**
 * Recovery settings
 */
export interface RecoverySettings {
  /** Enable automatic recovery */
  autoRecovery: boolean;

  /** Maximum recovery attempts */
  maxRecoveryAttempts: number;

  /** Recovery strategies */
  strategies: RecoveryStrategy[];

  /** Recovery timeout in milliseconds */
  recoveryTimeout: number;
}

/**
 * Recovery strategy
 */
export interface RecoveryStrategy {
  /** Strategy name */
  name: string;

  /** Strategy type */
  type: RecoveryStrategyType;

  /** Strategy configuration */
  config: Record<string, any>;

  /** Strategy priority */
  priority: number;
}

/**
 * Recovery strategy types
 */
export enum RecoveryStrategyType {
  RETRY = 'retry',
  RESTART = 'restart',
  ROLLBACK = 'rollback',
  FAILOVER = 'failover',
  ESCALATE = 'escalate',
  CUSTOM = 'custom'
}

/**
 * Execution environment
 */
export interface ExecutionEnvironment {
  /** Working directory */
  workingDirectory: string;

  /** Environment variables */
  variables: Record<string, string>;

  /** Path variables */
  pathVariables: string[];

  /** Available tools */
  availableTools: AvailableTool[];

  /** System information */
  systemInfo: SystemInfo;

  /** Security context */
  securityContext: SecurityContext;
}

/**
 * Available tool
 */
export interface AvailableTool {
  /** Tool name */
  name: string;

  /** Tool path */
  path: string;

  /** Tool version */
  version: string;

  /** Tool capabilities */
  capabilities: string[];
}

/**
 * System information
 */
export interface SystemInfo {
  /** Operating system */
  os: string;

  /** Architecture */
  arch: string;

  /** Node.js version */
  nodeVersion: string;

  /** Available memory in MB */
  availableMemory: number;

  /** CPU count */
  cpuCount: number;

  /** Platform information */
  platform: Record<string, any>;
}

/**
 * Security context
 */
export interface SecurityContext {
  /** User permissions */
  permissions: string[];

  /** Access restrictions */
  restrictions: string[];

  /** Audit logging enabled */
  auditLogging: boolean;

  /** Secure mode enabled */
  secureMode: boolean;
}

/**
 * Execution state
 */
export interface ExecutionState {
  /** Current execution step */
  currentStep: ExecutionStep;

  /** Completed steps */
  completedSteps: ExecutionStep[];

  /** Execution progress percentage */
  progress: number;

  /** Current operation */
  currentOperation?: string;

  /** State variables */
  variables: Record<string, any>;

  /** Execution artifacts */
  artifacts: ExecutionArtifact[];

  /** Active processes */
  activeProcesses: ProcessInfo[];
}

/**
 * Execution step
 */
export interface ExecutionStep {
  /** Step name */
  name: string;

  /** Step description */
  description: string;

  /** Step status */
  status: StepStatus;

  /** Step start time */
  startTime?: Date;

  /** Step end time */
  endTime?: Date;

  /** Step duration in milliseconds */
  duration?: number;

  /** Step result */
  result?: StepResult;

  /** Step error */
  error?: string;
}

/**
 * Step status enumeration
 */
export enum StepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped'
}

/**
 * Step result
 */
export interface StepResult {
  /** Success status */
  success: boolean;

  /** Result data */
  data?: any;

  /** Result message */
  message?: string;

  /** Exit code */
  exitCode?: number;
}

/**
 * Execution artifact
 */
export interface ExecutionArtifact {
  /** Artifact name */
  name: string;

  /** Artifact type */
  type: string;

  /** File path */
  path: string;

  /** Creation timestamp */
  createdAt: Date;

  /** Artifact size in bytes */
  size: number;

  /** Artifact metadata */
  metadata: Record<string, any>;
}

/**
 * Process information
 */
export interface ProcessInfo {
  /** Process ID */
  pid: number;

  /** Process name */
  name: string;

  /** Process command */
  command: string;

  /** Process start time */
  startTime: Date;

  /** CPU usage percentage */
  cpuUsage: number;

  /** Memory usage in MB */
  memoryUsage: number;
}

/**
 * Execution metrics
 */
export interface ExecutionMetrics {
  /** Performance metrics */
  performance: PerformanceMetrics;

  /** Resource metrics */
  resources: ResourceMetrics;

  /** Quality metrics */
  quality: QualityMetrics;

  /** Error metrics */
  errors: ErrorMetrics;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  /** Total execution time in milliseconds */
  totalTime: number;

  /** Setup time in milliseconds */
  setupTime: number;

  /** Processing time in milliseconds */
  processingTime: number;

  /** Validation time in milliseconds */
  validationTime: number;

  /** Cleanup time in milliseconds */
  cleanupTime: number;

  /** Throughput metrics */
  throughput: ThroughputMetrics;
}

/**
 * Throughput metrics
 */
export interface ThroughputMetrics {
  /** Operations per second */
  operationsPerSecond: number;

  /** Files processed per minute */
  filesPerMinute: number;

  /** Lines processed per minute */
  linesPerMinute: number;

  /** Commands executed per minute */
  commandsPerMinute: number;
}

/**
 * Resource metrics
 */
export interface ResourceMetrics {
  /** CPU usage statistics */
  cpu: CpuMetrics;

  /** Memory usage statistics */
  memory: MemoryMetrics;

  /** Disk usage statistics */
  disk: DiskMetrics;

  /** Network usage statistics */
  network: NetworkMetrics;
}

/**
 * CPU metrics
 */
export interface CpuMetrics {
  /** Average CPU usage percentage */
  average: number;

  /** Peak CPU usage percentage */
  peak: number;

  /** CPU time in milliseconds */
  totalTime: number;

  /** CPU usage samples */
  samples: MetricSample[];
}

/**
 * Memory metrics
 */
export interface MemoryMetrics {
  /** Average memory usage in MB */
  average: number;

  /** Peak memory usage in MB */
  peak: number;

  /** Memory growth rate in MB/minute */
  growthRate: number;

  /** Memory usage samples */
  samples: MetricSample[];
}

/**
 * Disk metrics
 */
export interface DiskMetrics {
  /** Disk space used in MB */
  spaceUsed: number;

  /** Files created */
  filesCreated: number;

  /** Files modified */
  filesModified: number;

  /** Files deleted */
  filesDeleted: number;

  /** Read operations */
  readOperations: number;

  /** Write operations */
  writeOperations: number;
}

/**
 * Network metrics
 */
export interface NetworkMetrics {
  /** Bytes sent */
  bytesSent: number;

  /** Bytes received */
  bytesReceived: number;

  /** Requests made */
  requestsMade: number;

  /** Average response time in milliseconds */
  averageResponseTime: number;

  /** Network errors */
  errors: number;
}

/**
 * Metric sample
 */
export interface MetricSample {
  /** Sample timestamp */
  timestamp: Date;

  /** Sample value */
  value: number;
}

/**
 * Quality metrics
 */
export interface QualityMetrics {
  /** Code quality score */
  codeQuality: number;

  /** Test coverage percentage */
  testCoverage: number;

  /** Linting score */
  lintingScore: number;

  /** Security score */
  securityScore: number;

  /** Documentation coverage */
  documentationCoverage: number;
}

/**
 * Error metrics
 */
export interface ErrorMetrics {
  /** Total errors */
  totalErrors: number;

  /** Critical errors */
  criticalErrors: number;

  /** Warning count */
  warnings: number;

  /** Error rate percentage */
  errorRate: number;

  /** Mean time to recovery in milliseconds */
  meanTimeToRecovery: number;

  /** Error categories */
  categories: Record<string, number>;
}

/**
 * Execution timestamps
 */
export interface ExecutionTimestamps {
  /** Execution creation time */
  createdAt: Date;

  /** Execution start time */
  startedAt?: Date;

  /** Execution end time */
  endedAt?: Date;

  /** Last update time */
  updatedAt: Date;

  /** Last heartbeat time */
  lastHeartbeat?: Date;
}

/**
 * Execution history entry
 */
export interface ExecutionHistoryEntry {
  /** Entry timestamp */
  timestamp: Date;

  /** Action performed */
  action: ExecutionAction;

  /** Action details */
  details: string;

  /** Previous status */
  previousStatus?: ExecutionStatus;

  /** New status */
  newStatus?: ExecutionStatus;

  /** Action metadata */
  metadata?: Record<string, any>;
}

/**
 * Execution actions for history tracking
 */
export enum ExecutionAction {
  CREATED = 'created',
  STARTED = 'started',
  PAUSED = 'paused',
  RESUMED = 'resumed',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  STEP_STARTED = 'step_started',
  STEP_COMPLETED = 'step_completed',
  STEP_FAILED = 'step_failed',
  VALIDATION_STARTED = 'validation_started',
  VALIDATION_COMPLETED = 'validation_completed',
  VALIDATION_FAILED = 'validation_failed',
  ERROR_OCCURRED = 'error_occurred',
  RECOVERY_STARTED = 'recovery_started',
  RECOVERY_COMPLETED = 'recovery_completed',
  TIMEOUT_OCCURRED = 'timeout_occurred'
}