/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { WinstonStructuredLogger as Logger } from '../utils/logger.js';

// Import validation system components
import {
  ValidationFramework,
  ValidationCategory,
} from './ValidationFramework.js';
import { ValidationRules, RuleCategory } from './ValidationRules.js';
import type {
  TaskValidationContext,
  TaskExecutionMetrics,
} from './TaskValidator.js';
import {
  TaskValidator,
  TaskValidationType,
  TaskValidationLevel,
} from './TaskValidator.js';
import { QualityAssurance, QualityCheckType } from './QualityAssurance.js';
import { RollbackManager, RollbackTrigger } from './RollbackManager.js';

// Import task management types (using our types as they are compatible)
import type { Task, TaskResult } from '../task-management/types.js';
import { TaskStatus } from '../task-management/TaskQueue.js';

// Import existing task execution engine types
import type { TaskExecutionContext } from '../task-management/TaskExecutionEngine.js';

/**
 * Validation integration events for system-wide monitoring
 */
export interface ValidationIntegrationEvents {
  validationSystemInitialized: [config: ValidationIntegrationConfig];
  taskValidationStarted: [taskId: string, phase: TaskValidationPhase];
  taskValidationCompleted: [
    taskId: string,
    phase: TaskValidationPhase,
    passed: boolean,
  ];
  qualityAssuranceTriggered: [taskId: string, trigger: QualityTrigger];
  rollbackInitiated: [taskId: string, reason: string];
  rollbackCompleted: [taskId: string, success: boolean];
  validationSystemError: [
    taskId: string,
    error: Error,
    phase: TaskValidationPhase,
  ];
  systemHealthCheck: [health: SystemHealthReport];
}

/**
 * Task validation phases in the execution lifecycle
 */
export enum TaskValidationPhase {
  PRE_EXECUTION = 'pre_execution',
  DURING_EXECUTION = 'during_execution',
  POST_EXECUTION = 'post_execution',
  QUALITY_ASSURANCE = 'quality_assurance',
  ROLLBACK_VALIDATION = 'rollback_validation',
}

/**
 * Quality assurance triggers
 */
export enum QualityTrigger {
  TASK_COMPLETION = 'task_completion',
  SCHEDULED_CHECK = 'scheduled_check',
  THRESHOLD_VIOLATION = 'threshold_violation',
  USER_REQUEST = 'user_request',
  SYSTEM_ANOMALY = 'system_anomaly',
}

/**
 * Integration configuration for validation system
 */
export interface ValidationIntegrationConfig {
  enabled: boolean;

  // Phase configuration
  phases: {
    preExecution: {
      enabled: boolean;
      validationLevel: TaskValidationLevel;
      blockOnFailure: boolean;
      createSnapshot: boolean;
    };
    duringExecution: {
      enabled: boolean;
      monitoringInterval: number;
      thresholdChecks: boolean;
      realTimeValidation: boolean;
    };
    postExecution: {
      enabled: boolean;
      validationLevel: TaskValidationLevel;
      qualityAssurance: boolean;
      autoRollbackOnFailure: boolean;
    };
  };

  // Quality assurance configuration
  qualityAssurance: {
    enabled: boolean;
    triggers: QualityTrigger[];
    checkTypes: QualityCheckType[];
    scheduledInterval?: number;
  };

  // Rollback configuration
  rollback: {
    enabled: boolean;
    autoTriggers: RollbackTrigger[];
    requireApproval: boolean;
    snapshotRetention: number;
  };

  // Performance configuration
  performance: {
    maxConcurrentValidations: number;
    validationTimeout: number;
    cacheEnabled: boolean;
    batchProcessing: boolean;
  };

  // Error handling
  errorHandling: {
    retryAttempts: number;
    fallbackBehavior: 'skip' | 'warn' | 'fail';
    errorEscalation: boolean;
  };
}

/**
 * Enhanced task execution context with validation integration
 */
export interface ValidatedTaskExecutionContext extends TaskExecutionContext {
  validationConfig?: ValidationIntegrationConfig;
  validationPhase?: TaskValidationPhase;
  qualityRequirements?: string[];
  rollbackEnabled?: boolean;
  customValidators?: string[];
}

/**
 * Comprehensive validation result for task execution
 */
export interface TaskExecutionValidationResult {
  taskId: string;
  phase: TaskValidationPhase;
  timestamp: Date;
  duration: number;

  // Validation results
  preExecution?: {
    passed: boolean;
    qualityScore: number;
    issues: string[];
    recommendations: string[];
  };

  duringExecution?: {
    monitoring: boolean;
    thresholds: Array<{
      metric: string;
      status: 'ok' | 'warning' | 'critical';
      value: number;
      threshold: number;
    }>;
    interventions: string[];
  };

  postExecution?: {
    passed: boolean;
    qualityScore: number;
    completionCriteria: Array<{
      criterion: string;
      satisfied: boolean;
      evidence?: string;
    }>;
  };

  qualityAssurance?: {
    overallScore: number;
    passed: boolean;
    violations: Array<{
      type: string;
      severity: string;
      description: string;
    }>;
    recommendations: string[];
  };

  rollback?: {
    recommended: boolean;
    reason?: string;
    snapshotId?: string;
    executed?: boolean;
    success?: boolean;
  };

  // Overall assessment
  overallPassed: boolean;
  overallQualityScore: number;
  executionAllowed: boolean;
  requiresIntervention: boolean;
  metadata: Record<string, unknown>;
}

/**
 * System health report for monitoring
 */
export interface SystemHealthReport {
  timestamp: Date;
  overallHealth: 'healthy' | 'degraded' | 'critical';

  components: {
    validationFramework: {
      status: 'healthy' | 'degraded' | 'error';
      activeValidations: number;
      averageResponseTime: number;
    };
    qualityAssurance: {
      status: 'healthy' | 'degraded' | 'error';
      activeChecks: number;
      averageScore: number;
    };
    rollbackManager: {
      status: 'healthy' | 'degraded' | 'error';
      activeRollbacks: number;
      totalSnapshots: number;
    };
  };

  metrics: {
    totalValidations: number;
    successRate: number;
    averageValidationTime: number;
    rollbackRate: number;
  };

  alerts: Array<{
    severity: 'info' | 'warning' | 'critical';
    component: string;
    message: string;
    timestamp: Date;
  }>;
}

/**
 * Comprehensive Validation Integration System
 *
 * Provides seamless integration between the validation system components
 * and the existing task execution engine, enabling automated validation
 * throughout the task lifecycle with intelligent quality assurance and
 * rollback capabilities.
 */
export class ValidationIntegration extends EventEmitter {
  private readonly logger: Logger;
  private readonly config: ValidationIntegrationConfig;

  // Core validation system components
  private readonly validationFramework: ValidationFramework;
  private readonly validationRules: ValidationRules;
  private readonly taskValidator: TaskValidator;
  private readonly qualityAssurance: QualityAssurance;
  private readonly rollbackManager: RollbackManager;

  // Integration state
  private readonly activeValidations: Map<
    string,
    Promise<TaskExecutionValidationResult>
  > = new Map();
  private readonly monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();
  private readonly validationCache: Map<string, TaskExecutionValidationResult> =
    new Map();

  // Statistics and monitoring
  private readonly validationStats = {
    totalValidations: 0,
    successfulValidations: 0,
    failedValidations: 0,
    rollbacksTriggered: 0,
    averageValidationTime: 0,
  };

  constructor(config: Partial<ValidationIntegrationConfig> = {}) {
    super();

    this.logger = new Logger({
      defaultMeta: { component: 'ValidationIntegration' },
    });
    this.config = this.createDefaultConfig(config);

    // Initialize validation system components
    this.validationFramework = new ValidationFramework();
    this.validationRules = new ValidationRules();
    this.taskValidator = new TaskValidator(this.validationFramework);
    this.qualityAssurance = new QualityAssurance(
      this.validationFramework,
      this.taskValidator,
    );
    this.rollbackManager = new RollbackManager();

    this.logger.info('ValidationIntegration initialized', {
      enabled: this.config.enabled,
      phases: this.config.phases,
      qualityAssurance: this.config.qualityAssurance.enabled,
      rollback: this.config.rollback.enabled,
    });

    this.setupIntegration();
    this.startMonitoring();
  }

  /**
   * Create default configuration with overrides
   */
  private createDefaultConfig(
    config: Partial<ValidationIntegrationConfig>,
  ): ValidationIntegrationConfig {
    return {
      enabled: true,

      phases: {
        preExecution: {
          enabled: true,
          validationLevel: TaskValidationLevel.MODERATE,
          blockOnFailure: true,
          createSnapshot: true,
        },
        duringExecution: {
          enabled: true,
          monitoringInterval: 10000, // 10 seconds
          thresholdChecks: true,
          realTimeValidation: false,
        },
        postExecution: {
          enabled: true,
          validationLevel: TaskValidationLevel.MODERATE,
          qualityAssurance: true,
          autoRollbackOnFailure: false,
        },
      },

      qualityAssurance: {
        enabled: true,
        triggers: [
          QualityTrigger.TASK_COMPLETION,
          QualityTrigger.THRESHOLD_VIOLATION,
        ],
        checkTypes: Object.values(QualityCheckType),
        scheduledInterval: 3600000, // 1 hour
      },

      rollback: {
        enabled: true,
        autoTriggers: [
          RollbackTrigger.VALIDATION_FAILURE,
          RollbackTrigger.SECURITY_VIOLATION,
        ],
        requireApproval: false,
        snapshotRetention: 10,
      },

      performance: {
        maxConcurrentValidations: 5,
        validationTimeout: 300000, // 5 minutes
        cacheEnabled: true,
        batchProcessing: false,
      },

      errorHandling: {
        retryAttempts: 3,
        fallbackBehavior: 'warn',
        errorEscalation: true,
      },

      ...config,
    };
  }

  /**
   * Setup integration between validation components and task execution
   */
  private setupIntegration(): void {
    // Register validation rules with framework
    const allRules = this.validationRules.getEnabledRules();
    allRules.forEach((rule) => {
      const frameworkRule = {
        id: rule.id,
        name: rule.name,
        category: this.mapRuleCategoryToValidationCategory(rule.category),
        severity: rule.config.severity,
        enabled: rule.config.enabled,
        description: rule.description,
        validator: rule.executor,
        dependencies: rule.config.dependencies,
        timeout: rule.config.timeout,
        retries: rule.config.retries,
        metadata: rule.metadata,
      };
      this.validationFramework.registerRule(frameworkRule);
    });

    // Setup event listeners for integration
    this.setupEventListeners();

    this.emit('validationSystemInitialized', this.config);
  }

  /**
   * Setup event listeners for cross-component communication
   */
  private setupEventListeners(): void {
    // Task validator events
    this.taskValidator.on('taskValidationStarted', (taskId, validationType) => {
      const phase = this.mapValidationTypeToPhase(validationType);
      this.emit('taskValidationStarted', taskId, phase);
    });

    this.taskValidator.on('taskValidationCompleted', (taskId, result) => {
      const phase = this.mapValidationTypeToPhase(result.validationType);
      this.emit('taskValidationCompleted', taskId, phase, result.passed);
    });

    this.taskValidator.on('taskValidationFailed', (taskId, error, context) => {
      const phase = this.mapValidationTypeToPhase(context.validationType);
      this.emit('validationSystemError', taskId, error, phase);
    });

    // Quality assurance events
    this.qualityAssurance.on('qualityCheckCompleted', (result) => {
      this.emit(
        'qualityAssuranceTriggered',
        result.taskId,
        QualityTrigger.TASK_COMPLETION,
      );
    });

    // Rollback manager events
    this.rollbackManager.on('rollbackInitiated', (operation) => {
      this.emit(
        'rollbackInitiated',
        operation.taskId,
        operation.metadata.reason,
      );
    });

    this.rollbackManager.on('rollbackCompleted', (result) => {
      this.emit('rollbackCompleted', result.operationId, result.success);
    });
  }

  /**
   * Main integration method for task execution validation
   */
  async validateTaskExecution(
    task: Task,
    context: ValidatedTaskExecutionContext,
    executionMetrics?: TaskExecutionMetrics,
  ): Promise<TaskExecutionValidationResult> {
    if (!this.config.enabled) {
      return this.createPassthroughResult(task);
    }

    const startTime = Date.now();
    this.validationStats.totalValidations++;

    this.logger.info('Starting comprehensive task validation', {
      taskId: task.id,
      phases: Object.keys(this.config.phases).filter(
        (p) =>
          (this.config.phases as Record<string, { enabled: boolean }>)[p]
            .enabled,
      ),
    });

    try {
      // Check for active validation
      if (this.activeValidations.has(task.id)) {
        this.logger.warn(`Validation already running for task: ${task.id}`);
        return await this.activeValidations.get(task.id)!;
      }

      // Create validation promise
      const validationPromise = this.executeComprehensiveValidation(
        task,
        context,
        executionMetrics,
        startTime,
      );
      this.activeValidations.set(task.id, validationPromise);

      const result = await validationPromise;

      // Update statistics
      if (result.overallPassed) {
        this.validationStats.successfulValidations++;
      } else {
        this.validationStats.failedValidations++;
      }

      const duration = Date.now() - startTime;
      this.validationStats.averageValidationTime =
        (this.validationStats.averageValidationTime *
          (this.validationStats.totalValidations - 1) +
          duration) /
        this.validationStats.totalValidations;

      // Cache result if enabled
      if (this.config.performance.cacheEnabled) {
        this.validationCache.set(task.id, result);
      }

      return result;
    } catch (error) {
      this.logger.error(`Task validation failed: ${task.id}`, {
        error: error as Error | undefined,
      });
      this.emit(
        'validationSystemError',
        task.id,
        error as Error | undefined,
        TaskValidationPhase.PRE_EXECUTION,
      );
      throw error;
    } finally {
      this.activeValidations.delete(task.id);
    }
  }

  /**
   * Execute comprehensive validation across all phases
   */
  private async executeComprehensiveValidation(
    task: Task,
    context: ValidatedTaskExecutionContext,
    executionMetrics: TaskExecutionMetrics | undefined,
    startTime: number,
  ): Promise<TaskExecutionValidationResult> {
    const result: TaskExecutionValidationResult = {
      taskId: task.id,
      phase: TaskValidationPhase.PRE_EXECUTION,
      timestamp: new Date(),
      duration: 0,
      overallPassed: true,
      overallQualityScore: 1.0,
      executionAllowed: true,
      requiresIntervention: false,
      metadata: {
        integrationVersion: '1.0.0',
        configSnapshot: { ...this.config },
      },
    };

    // Phase 1: Pre-execution validation
    if (this.config.phases.preExecution.enabled) {
      result.preExecution = await this.executePreExecutionValidation(
        task,
        context,
      );
      result.overallPassed = result.overallPassed && result.preExecution.passed;

      if (
        !result.preExecution.passed &&
        this.config.phases.preExecution.blockOnFailure
      ) {
        result.executionAllowed = false;
        result.requiresIntervention = true;
        result.phase = TaskValidationPhase.PRE_EXECUTION;
      }
    }

    // Phase 2: During execution monitoring (if task is running)
    if (
      this.config.phases.duringExecution.enabled &&
      task.status === TaskStatus.RUNNING
    ) {
      result.duringExecution = await this.executeDuringExecutionMonitoring(
        task,
        executionMetrics,
      );
      // Note: During execution doesn't affect overall pass/fail, just monitoring
    }

    // Phase 3: Post-execution validation (if task completed)
    if (
      this.config.phases.postExecution.enabled &&
      (task.status === TaskStatus.COMPLETED ||
        task.status === TaskStatus.FAILED)
    ) {
      result.postExecution = await this.executePostExecutionValidation(
        task,
        context,
        executionMetrics,
      );
      result.overallPassed =
        result.overallPassed && result.postExecution.passed;
    }

    // Phase 4: Quality assurance
    if (this.config.qualityAssurance.enabled && result.postExecution) {
      result.qualityAssurance = await this.executeQualityAssurance(
        task,
        context,
        executionMetrics,
      );
      result.overallPassed =
        result.overallPassed && result.qualityAssurance.passed;
      result.overallQualityScore = result.qualityAssurance.overallScore;
    }

    // Phase 5: Rollback evaluation
    if (this.config.rollback.enabled) {
      result.rollback = await this.evaluateRollbackNeed(task, result, context);
      if (result.rollback.recommended && result.rollback.executed) {
        this.validationStats.rollbacksTriggered++;
      }
    }

    // Finalize result
    result.duration = Date.now() - startTime;
    result.phase = TaskValidationPhase.POST_EXECUTION;

    return result;
  }

  /**
   * Execute pre-execution validation phase
   */
  private async executePreExecutionValidation(
    task: Task,
    context: ValidatedTaskExecutionContext,
  ): Promise<NonNullable<TaskExecutionValidationResult['preExecution']>> {
    this.logger.debug('Executing pre-execution validation', {
      taskId: task.id,
    });

    // Create snapshot if configured
    if (this.config.phases.preExecution.createSnapshot) {
      await this.rollbackManager.createSnapshot(
        task,
        'Pre-execution validation snapshot',
      );
    }

    // Build validation context
    const validationContext: TaskValidationContext = {
      task,
      validationType: TaskValidationType.PRE_EXECUTION,
      validationLevel: this.config.phases.preExecution.validationLevel,
      dependencies: context.dependencies || [],
      dependencyResults: new Map(),
      previousSnapshots: [],
      executionMetrics: undefined,
      customValidators: context.customValidators || [],
      skipValidations: [],
      metadata: {
        phase: 'pre-execution',
        integrationContext: context,
      },
    };

    // Execute validation
    const validationResult =
      await this.taskValidator.validateTask(validationContext);

    return {
      passed: validationResult.passed,
      qualityScore: validationResult.qualityScore,
      issues: validationResult.results
        .filter((r) => r.status === 'failed')
        .map((r) => r.message),
      recommendations: validationResult.recommendations.map((r) => r.message),
    };
  }

  /**
   * Execute during-execution monitoring
   */
  private async executeDuringExecutionMonitoring(
    task: Task,
    executionMetrics?: TaskExecutionMetrics,
  ): Promise<NonNullable<TaskExecutionValidationResult['duringExecution']>> {
    this.logger.debug('Executing during-execution monitoring', {
      taskId: task.id,
    });

    const thresholds = [];
    const interventions = [];

    if (executionMetrics) {
      // Memory usage check
      if (executionMetrics.memoryUsage) {
        const memoryMB = executionMetrics.memoryUsage.peak / (1024 * 1024);
        const memoryThreshold = 1024; // 1GB default

        thresholds.push({
          metric: 'memory_usage',
          status:
            memoryMB > memoryThreshold * 1.5
              ? ('critical' as const)
              : memoryMB > memoryThreshold
                ? ('warning' as const)
                : ('ok' as const),
          value: memoryMB,
          threshold: memoryThreshold,
        });

        if (memoryMB > memoryThreshold * 1.5) {
          interventions.push(
            'Critical memory usage detected - recommend task termination',
          );
        }
      }

      // Execution time check
      if (executionMetrics.duration) {
        const durationMinutes = executionMetrics.duration / (1000 * 60);
        const timeThreshold =
          (task.metadata.estimatedDuration || 60 * 60 * 1000) / (1000 * 60);

        thresholds.push({
          metric: 'execution_time',
          status:
            durationMinutes > timeThreshold * 1.2
              ? ('critical' as const)
              : durationMinutes > timeThreshold
                ? ('warning' as const)
                : ('ok' as const),
          value: durationMinutes,
          threshold: timeThreshold,
        });

        if (durationMinutes > timeThreshold * 1.2) {
          interventions.push(
            'Execution time exceeded critical threshold - recommend intervention',
          );
        }
      }

      // Error rate check
      const errorRate =
        executionMetrics.errorCount /
        Math.max(1, executionMetrics.errorCount + 1);
      thresholds.push({
        metric: 'error_rate',
        status:
          errorRate > 0.1
            ? ('critical' as const)
            : errorRate > 0.05
              ? ('warning' as const)
              : ('ok' as const),
        value: errorRate,
        threshold: 0.05,
      });
    }

    return {
      monitoring: true,
      thresholds,
      interventions,
    };
  }

  /**
   * Execute post-execution validation phase
   */
  private async executePostExecutionValidation(
    task: Task,
    context: ValidatedTaskExecutionContext,
    executionMetrics?: TaskExecutionMetrics,
  ): Promise<NonNullable<TaskExecutionValidationResult['postExecution']>> {
    this.logger.debug('Executing post-execution validation', {
      taskId: task.id,
    });

    // Create validation context
    const validationContext: TaskValidationContext = {
      task,
      taskResult: this.createTaskResultFromContext(task, context),
      validationType: TaskValidationType.POST_EXECUTION,
      validationLevel: this.config.phases.postExecution.validationLevel,
      dependencies: context.dependencies || [],
      dependencyResults: new Map(),
      previousSnapshots: this.rollbackManager.getTaskSnapshots(task.id),
      executionMetrics,
      customValidators: context.customValidators || [],
      skipValidations: [],
      metadata: {
        phase: 'post-execution',
        integrationContext: context,
      },
    };

    const validationResult =
      await this.taskValidator.validateTask(validationContext);

    // Check completion criteria
    const completionCriteria = (task.validationCriteria || []).map(
      (criterion) => ({
        criterion,
        satisfied: this.evaluateCompletionCriterion(
          criterion,
          task,
          validationResult,
        ),
        evidence: `Validation result: ${validationResult.passed ? 'passed' : 'failed'}`,
      }),
    );

    return {
      passed: validationResult.passed,
      qualityScore: validationResult.qualityScore,
      completionCriteria,
    };
  }

  /**
   * Execute quality assurance phase
   */
  private async executeQualityAssurance(
    task: Task,
    context: ValidatedTaskExecutionContext,
    executionMetrics?: TaskExecutionMetrics,
  ): Promise<NonNullable<TaskExecutionValidationResult['qualityAssurance']>> {
    this.logger.debug('Executing quality assurance', { taskId: task.id });

    const taskResult = this.createTaskResultFromContext(task, context);
    const qaResult = await this.qualityAssurance.performQualityAssurance(
      task,
      taskResult,
      executionMetrics,
    );

    return {
      overallScore: qaResult.overallScore,
      passed: qaResult.passed,
      violations: qaResult.violations.map((v) => ({
        type: v.metric,
        severity: v.severity,
        description: v.description,
      })),
      recommendations: qaResult.recommendations.map((r) => r.description),
    };
  }

  /**
   * Evaluate rollback necessity
   */
  private async evaluateRollbackNeed(
    task: Task,
    result: TaskExecutionValidationResult,
    _context: ValidatedTaskExecutionContext,
  ): Promise<NonNullable<TaskExecutionValidationResult['rollback']>> {
    const rollbackRecommended =
      !result.overallPassed ||
      (result.qualityAssurance && result.qualityAssurance.overallScore < 0.5);

    if (!rollbackRecommended) {
      return {
        recommended: false,
      };
    }

    const snapshots = this.rollbackManager.getTaskSnapshots(task.id);
    if (snapshots.length === 0) {
      return {
        recommended: rollbackRecommended,
        reason:
          'Quality issues detected but no snapshots available for rollback',
      };
    }

    const latestSnapshot = snapshots[snapshots.length - 1];
    let executed = false;
    let success = false;

    // Execute rollback if auto-rollback is enabled
    if (this.config.phases.postExecution.autoRollbackOnFailure) {
      try {
        const rollbackOp = this.rollbackManager.createRollbackOperation(
          task.id,
          RollbackTrigger.VALIDATION_FAILURE,
          latestSnapshot.id,
          'Automatic rollback due to validation failures',
        );

        const rollbackResult =
          await this.rollbackManager.executeRollback(rollbackOp);
        executed = true;
        success = rollbackResult.success;
      } catch (error) {
        this.logger.error(`Failed to execute rollback for task: ${task.id}`, {
          error: error as Error | undefined,
        });
        executed = true;
        success = false;
      }
    }

    return {
      recommended: rollbackRecommended,
      reason: 'Validation failures detected - rollback recommended',
      snapshotId: latestSnapshot.id,
      executed,
      success: executed ? success : undefined,
    };
  }

  /**
   * Helper methods
   */

  private mapValidationTypeToPhase(
    validationType: TaskValidationType,
  ): TaskValidationPhase {
    switch (validationType) {
      case TaskValidationType.PRE_EXECUTION:
        return TaskValidationPhase.PRE_EXECUTION;
      case TaskValidationType.IN_PROGRESS:
        return TaskValidationPhase.DURING_EXECUTION;
      case TaskValidationType.POST_EXECUTION:
        return TaskValidationPhase.POST_EXECUTION;
      case TaskValidationType.QUALITY_ASSURANCE:
        return TaskValidationPhase.QUALITY_ASSURANCE;
      case TaskValidationType.ROLLBACK:
        return TaskValidationPhase.ROLLBACK_VALIDATION;
      default:
        return TaskValidationPhase.PRE_EXECUTION;
    }
  }

  private createTaskResultFromContext(
    task: Task,
    _context: ValidatedTaskExecutionContext,
  ): TaskResult {
    return {
      taskId: task.id,
      success: task.status === TaskStatus.COMPLETED,
      output: task.results,
      error: task.lastError
        ? {
            message: task.lastError,
            code: 'TASK_EXECUTION_ERROR',
          }
        : undefined,
      metrics: task.metrics
        ? {
            startTime: task.metrics.startTime,
            endTime: task.metrics.endTime || new Date(),
            duration: task.metrics.durationMs || 0,
            memoryUsage: 0, // Not available in TaskMetrics
            cpuUsage: 0, // Not available in TaskMetrics
          }
        : undefined,
      artifacts: [], // Would need to be provided by execution context
      validationResults: [],
    };
  }

  private evaluateCompletionCriterion(
    criterion: string,
    task: Task,
    validationResult: { passed: boolean; qualityScore: number },
  ): boolean {
    // Simple heuristic - in production, this would be more sophisticated
    switch (criterion.toLowerCase()) {
      case 'all required fields present':
        return Boolean(task.title && task.description);
      case 'dependencies satisfied':
        return validationResult.passed;
      case 'quality thresholds met':
        return validationResult.qualityScore > 0.7;
      case 'security compliance verified':
        return validationResult.passed;
      default:
        return validationResult.passed;
    }
  }

  private createPassthroughResult(task: Task): TaskExecutionValidationResult {
    return {
      taskId: task.id,
      phase: TaskValidationPhase.PRE_EXECUTION,
      timestamp: new Date(),
      duration: 0,
      overallPassed: true,
      overallQualityScore: 1.0,
      executionAllowed: true,
      requiresIntervention: false,
      metadata: {
        validationDisabled: true,
      },
    };
  }

  private mapRuleCategoryToValidationCategory(
    ruleCategory: RuleCategory,
  ): ValidationCategory {
    switch (ruleCategory) {
      case RuleCategory.TASK_PRECONDITIONS:
      case RuleCategory.TASK_EXECUTION:
      case RuleCategory.TASK_COMPLETION:
        return ValidationCategory.FUNCTIONAL;
      case RuleCategory.DEPENDENCY_VALIDATION:
        return ValidationCategory.INTEGRATION;
      case RuleCategory.SECURITY_COMPLIANCE:
        return ValidationCategory.SECURITY;
      case RuleCategory.PERFORMANCE_VALIDATION:
        return ValidationCategory.PERFORMANCE;
      case RuleCategory.QUALITY_ASSURANCE:
        return ValidationCategory.FUNCTIONAL;
      case RuleCategory.BUSINESS_RULES:
        return ValidationCategory.BUSINESS;
      case RuleCategory.DATA_VALIDATION:
        return ValidationCategory.SYNTAX;
      case RuleCategory.INTEGRATION_VALIDATION:
        return ValidationCategory.INTEGRATION;
      default:
        return ValidationCategory.LOGIC;
    }
  }

  private startMonitoring(): void {
    // Start periodic health checks
    setInterval(() => {
      this.performHealthCheck();
    }, 300000); // 5 minutes

    // Start quality assurance scheduled checks
    if (this.config.qualityAssurance.scheduledInterval) {
      setInterval(() => {
        this.performScheduledQualityChecks();
      }, this.config.qualityAssurance.scheduledInterval);
    }
  }

  private async performHealthCheck(): Promise<void> {
    const health: SystemHealthReport = {
      timestamp: new Date(),
      overallHealth: 'healthy',
      components: {
        validationFramework: {
          status: 'healthy',
          activeValidations: this.activeValidations.size,
          averageResponseTime: this.validationStats.averageValidationTime,
        },
        qualityAssurance: {
          status: 'healthy',
          activeChecks: 0, // Would need to track this
          averageScore: 0.8, // Would calculate from recent results
        },
        rollbackManager: {
          status: 'healthy',
          activeRollbacks: 0, // Would need to track this
          totalSnapshots: Array.from(
            this.rollbackManager['snapshots'] || new Map(),
          ).length,
        },
      },
      metrics: {
        totalValidations: this.validationStats.totalValidations,
        successRate:
          this.validationStats.totalValidations > 0
            ? this.validationStats.successfulValidations /
              this.validationStats.totalValidations
            : 1.0,
        averageValidationTime: this.validationStats.averageValidationTime,
        rollbackRate:
          this.validationStats.totalValidations > 0
            ? this.validationStats.rollbacksTriggered /
              this.validationStats.totalValidations
            : 0.0,
      },
      alerts: [],
    };

    // Determine overall health
    const componentStatuses = Object.values(health.components).map(
      (c) => c.status,
    );
    if (componentStatuses.includes('error')) {
      health.overallHealth = 'critical';
    } else if (componentStatuses.includes('degraded')) {
      health.overallHealth = 'degraded';
    }

    this.emit('systemHealthCheck', health);
  }

  private async performScheduledQualityChecks(): Promise<void> {
    this.logger.debug('Performing scheduled quality checks');
    // Implementation would check for tasks that need periodic quality assessment
  }

  /**
   * Public API methods
   */

  /**
   * Get validation system statistics
   */
  getValidationStatistics() {
    return {
      ...this.validationStats,
      activeValidations: this.activeValidations.size,
      cacheSize: this.validationCache.size,
      monitoringSessions: this.monitoringIntervals.size,
    };
  }

  /**
   * Update validation configuration
   */
  updateConfiguration(updates: Partial<ValidationIntegrationConfig>): void {
    Object.assign(this.config, updates);
    this.logger.info('Validation configuration updated', { updates });
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up ValidationIntegration resources');

    // Stop monitoring intervals
    this.monitoringIntervals.forEach((interval) => clearInterval(interval));
    this.monitoringIntervals.clear();

    // Clear caches
    this.validationCache.clear();
    this.activeValidations.clear();

    // Cleanup components
    await Promise.all([
      this.taskValidator.cleanup(),
      this.qualityAssurance.cleanup(),
      this.rollbackManager.cleanup(),
    ]);

    this.removeAllListeners();
  }
}
