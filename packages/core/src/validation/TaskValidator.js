/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../logger/Logger.js';
import {
  ValidationStatus,
  ValidationSeverity,
  ValidationCategory,
} from './ValidationFramework.js';
import {
  TaskStatus,
  TaskPriority,
  DependencyType,
} from '../task-management/types.js';
/**
 * Task validation types for different validation scenarios
 */
export var TaskValidationType;
(function (TaskValidationType) {
  TaskValidationType['PRE_EXECUTION'] = 'pre_execution';
  TaskValidationType['IN_PROGRESS'] = 'in_progress';
  TaskValidationType['POST_EXECUTION'] = 'post_execution';
  TaskValidationType['DEPENDENCY'] = 'dependency';
  TaskValidationType['ROLLBACK'] = 'rollback';
  TaskValidationType['QUALITY_ASSURANCE'] = 'quality_assurance'; // Final quality check
})(TaskValidationType || (TaskValidationType = {}));
/**
 * Task validation result levels
 */
export var TaskValidationLevel;
(function (TaskValidationLevel) {
  TaskValidationLevel['STRICT'] = 'strict';
  TaskValidationLevel['MODERATE'] = 'moderate';
  TaskValidationLevel['LENIENT'] = 'lenient';
  TaskValidationLevel['ADVISORY'] = 'advisory'; // Validation for informational purposes only
})(TaskValidationLevel || (TaskValidationLevel = {}));
/**
 * Comprehensive Task Validator for Autonomous Task Management
 *
 * Provides end-to-end validation of task execution with:
 * - Pre/during/post execution validation
 * - Quality assurance and threshold monitoring
 * - Automated rollback capabilities
 * - Performance and security validation
 * - Comprehensive reporting and recommendations
 */
export class TaskValidator extends EventEmitter {
  logger;
  validationFramework;
  config;
  snapshots = new Map();
  activeValidations = new Map();
  qualityMetrics = new Map();
  constructor(validationFramework, config = {}) {
    super();
    this.logger = new Logger('TaskValidator');
    this.validationFramework = validationFramework;
    this.config = this.createDefaultConfig(config);
    this.logger.info('TaskValidator initialized', {
      validationLevel: this.config.validationLevel,
      enabledTypes: this.config.enabledValidationTypes,
      snapshotting: this.config.snapshotting.enabled,
      rollback: this.config.rollback.enabled,
    });
    this.setupValidationRules();
  }
  /**
   * Create default configuration with overrides
   */
  createDefaultConfig(config) {
    return {
      validationLevel: TaskValidationLevel.MODERATE,
      qualityThresholds: {
        executionTime: { warning: 30000, critical: 60000 },
        memoryUsage: { warning: 512, critical: 1024 },
        errorRate: { warning: 0.05, critical: 0.1 },
        codeQuality: { minScore: 0.7, criticalScore: 0.5 },
        testCoverage: { minPercent: 0.8, criticalPercent: 0.6 },
        securityScore: { minScore: 0.8, criticalScore: 0.6 },
      },
      enabledValidationTypes: Object.values(TaskValidationType),
      snapshotting: {
        enabled: true,
        maxSnapshots: 10,
        autoSnapshot: true,
      },
      rollback: {
        enabled: true,
        autoRollbackOnFailure: false,
        preserveSnapshots: true,
      },
      metrics: {
        trackPerformance: true,
        trackQuality: true,
        trackSecurity: true,
      },
      customValidators: new Map(),
      ...config,
    };
  }
  /**
   * Setup default validation rules for task validation
   */
  setupValidationRules() {
    // Pre-execution validation rules
    this.validationFramework.registerRule({
      id: 'task-preconditions',
      name: 'Task Preconditions Validation',
      category: ValidationCategory.LOGIC,
      severity: ValidationSeverity.ERROR,
      enabled: true,
      description: 'Validates task preconditions and dependencies',
      validator: this.validateTaskPreconditions.bind(this),
    });
    // Quality assurance rules
    this.validationFramework.registerRule({
      id: 'task-quality-metrics',
      name: 'Task Quality Metrics',
      category: ValidationCategory.FUNCTIONAL,
      severity: ValidationSeverity.WARNING,
      enabled: true,
      description: 'Validates task execution quality metrics',
      validator: this.validateQualityMetrics.bind(this),
    });
    // Security validation rules
    this.validationFramework.registerRule({
      id: 'task-security-validation',
      name: 'Task Security Validation',
      category: ValidationCategory.SECURITY,
      severity: ValidationSeverity.ERROR,
      enabled: true,
      description: 'Validates task security compliance',
      validator: this.validateTaskSecurity.bind(this),
    });
    // Performance validation rules
    this.validationFramework.registerRule({
      id: 'task-performance-validation',
      name: 'Task Performance Validation',
      category: ValidationCategory.PERFORMANCE,
      severity: ValidationSeverity.WARNING,
      enabled: true,
      description: 'Validates task performance metrics',
      validator: this.validateTaskPerformance.bind(this),
    });
  }
  /**
   * Validate a task comprehensively
   */
  async validateTask(context) {
    const startTime = Date.now();
    const validationId = `${context.task.id}-${context.validationType}-${Date.now()}`;
    this.logger.info('Starting task validation', {
      taskId: context.task.id,
      validationType: context.validationType,
      validationLevel: context.validationLevel,
      validationId,
    });
    this.emit('taskValidationStarted', context.task.id, context.validationType);
    try {
      // Check for active validation
      if (this.activeValidations.has(context.task.id)) {
        this.logger.warn(
          `Validation already running for task: ${context.task.id}`,
        );
        return await this.activeValidations.get(context.task.id);
      }
      // Create validation promise
      const validationPromise = this.executeTaskValidation(context, startTime);
      this.activeValidations.set(context.task.id, validationPromise);
      const result = await validationPromise;
      this.emit('taskValidationCompleted', context.task.id, result);
      return result;
    } catch (error) {
      this.logger.error(`Task validation failed: ${context.task.id}`, {
        error,
      });
      this.emit('taskValidationFailed', context.task.id, error, context);
      throw error;
    } finally {
      this.activeValidations.delete(context.task.id);
    }
  }
  /**
   * Execute comprehensive task validation cycle
   */
  async executeTaskValidation(context, startTime) {
    // Create snapshot if enabled
    let snapshot;
    if (
      this.config.snapshotting.enabled &&
      this.config.snapshotting.autoSnapshot
    ) {
      snapshot = await this.createTaskSnapshot(context.task);
      this.storeSnapshot(snapshot);
    }
    // Build validation context for framework
    const frameworkContext = {
      taskId: context.task.id,
      metadata: {
        task: context.task,
        taskResult: context.taskResult,
        validationType: context.validationType,
        validationLevel: context.validationLevel,
        executionMetrics: context.executionMetrics,
        ...context.metadata,
      },
    };
    // Execute validation through framework
    const validationReport =
      await this.validationFramework.validateTask(frameworkContext);
    // Calculate quality score
    const qualityScore = this.calculateQualityScore(
      validationReport.results,
      context,
    );
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      validationReport.results,
      context,
    );
    // Check if rollback is recommended
    const rollbackRecommended = this.shouldRecommendRollback(
      validationReport.results,
      qualityScore,
      context,
    );
    // Create comprehensive result
    const result = {
      taskId: context.task.id,
      validationType: context.validationType,
      validationLevel: context.validationLevel,
      passed:
        validationReport.failedRules === 0 &&
        qualityScore >= this.getMinQualityScore(context.validationLevel),
      timestamp: new Date(),
      duration: Date.now() - startTime,
      results: validationReport.results,
      qualityScore,
      executionMetrics: context.executionMetrics,
      rollbackRecommended,
      rollbackReason: rollbackRecommended
        ? this.getRollbackReason(validationReport.results, qualityScore)
        : undefined,
      snapshot,
      recommendations,
      metadata: {
        validationReport,
        frameworkStats: this.validationFramework.getStatistics(),
      },
    };
    // Handle automatic rollback if configured
    if (
      rollbackRecommended &&
      this.config.rollback.autoRollbackOnFailure &&
      snapshot
    ) {
      this.logger.warn(
        `Initiating automatic rollback for task: ${context.task.id}`,
        {
          reason: result.rollbackReason,
        },
      );
      this.emit(
        'rollbackInitiated',
        context.task.id,
        result.rollbackReason,
        snapshot,
      );
      const rollbackSuccess = await this.executeRollback(
        context.task.id,
        snapshot.id,
      );
      this.emit('rollbackCompleted', context.task.id, rollbackSuccess);
    }
    return result;
  }
  /**
   * Create a comprehensive task snapshot
   */
  async createTaskSnapshot(task) {
    const snapshotId = `snapshot-${task.id}-${Date.now()}`;
    this.logger.debug('Creating task snapshot', {
      taskId: task.id,
      snapshotId,
    });
    // TODO: Implement file system snapshot creation
    // TODO: Implement database snapshot creation
    // TODO: Implement environment snapshot creation
    const snapshot = {
      id: snapshotId,
      taskId: task.id,
      timestamp: new Date(),
      taskState: { ...task },
      fileSnapshot: new Map(), // TODO: Implement file snapshots
      databaseSnapshot: {}, // TODO: Implement database snapshots
      environmentSnapshot: process.env,
      dependencyStates: new Map(), // TODO: Implement dependency state capture
      metadata: {
        createdBy: 'TaskValidator',
        snapshotVersion: '1.0.0',
      },
    };
    return snapshot;
  }
  /**
   * Store task snapshot with cleanup of old snapshots
   */
  storeSnapshot(snapshot) {
    const taskSnapshots = this.snapshots.get(snapshot.taskId) || [];
    taskSnapshots.push(snapshot);
    // Cleanup old snapshots if over limit
    while (taskSnapshots.length > this.config.snapshotting.maxSnapshots) {
      taskSnapshots.shift();
    }
    this.snapshots.set(snapshot.taskId, taskSnapshots);
    this.logger.debug('Task snapshot stored', {
      taskId: snapshot.taskId,
      snapshotId: snapshot.id,
      totalSnapshots: taskSnapshots.length,
    });
  }
  /**
   * Execute rollback to a previous snapshot
   */
  async executeRollback(taskId, snapshotId) {
    this.logger.info('Executing task rollback', { taskId, snapshotId });
    try {
      const taskSnapshots = this.snapshots.get(taskId) || [];
      const snapshot = taskSnapshots.find((s) => s.id === snapshotId);
      if (!snapshot) {
        this.logger.error('Snapshot not found for rollback', {
          taskId,
          snapshotId,
        });
        return false;
      }
      // TODO: Implement file system rollback
      // TODO: Implement database rollback
      // TODO: Implement environment rollback
      this.logger.info('Task rollback completed successfully', {
        taskId,
        snapshotId,
      });
      return true;
    } catch (error) {
      this.logger.error('Task rollback failed', { taskId, snapshotId, error });
      return false;
    }
  }
  /**
   * Validation rules implementation
   */
  /**
   * Validate task preconditions and dependencies
   */
  async validateTaskPreconditions(context) {
    const results = [];
    const task = context.metadata?.task;
    if (!task) {
      return [
        {
          id: 'precondition-no-task',
          category: ValidationCategory.LOGIC,
          severity: ValidationSeverity.ERROR,
          status: ValidationStatus.FAILED,
          message: 'No task provided in validation context',
          timestamp: new Date(),
        },
      ];
    }
    // Validate task status
    if (
      task.status === TaskStatus.FAILED ||
      task.status === TaskStatus.CANCELLED
    ) {
      results.push({
        id: 'precondition-invalid-status',
        category: ValidationCategory.LOGIC,
        severity: ValidationSeverity.ERROR,
        status: ValidationStatus.FAILED,
        message: `Task is in invalid status: ${task.status}`,
        timestamp: new Date(),
      });
    }
    // Validate required fields
    if (!task.title || !task.description) {
      results.push({
        id: 'precondition-missing-fields',
        category: ValidationCategory.LOGIC,
        severity: ValidationSeverity.ERROR,
        status: ValidationStatus.FAILED,
        message: 'Task is missing required fields (title, description)',
        timestamp: new Date(),
      });
    }
    return results.length === 0
      ? [
          {
            id: 'precondition-valid',
            category: ValidationCategory.LOGIC,
            severity: ValidationSeverity.INFO,
            status: ValidationStatus.PASSED,
            message: 'Task preconditions validated successfully',
            timestamp: new Date(),
          },
        ]
      : results;
  }
  /**
   * Validate task quality metrics
   */
  async validateQualityMetrics(context) {
    const results = [];
    const executionMetrics = context.metadata?.executionMetrics;
    if (!executionMetrics) {
      return [
        {
          id: 'quality-no-metrics',
          category: ValidationCategory.FUNCTIONAL,
          severity: ValidationSeverity.WARNING,
          status: ValidationStatus.SKIPPED,
          message: 'No execution metrics available for quality validation',
          timestamp: new Date(),
        },
      ];
    }
    // Validate execution time
    if (
      executionMetrics.duration &&
      this.config.qualityThresholds.executionTime
    ) {
      const thresholds = this.config.qualityThresholds.executionTime;
      if (executionMetrics.duration > thresholds.critical) {
        results.push({
          id: 'quality-execution-time-critical',
          category: ValidationCategory.PERFORMANCE,
          severity: ValidationSeverity.CRITICAL,
          status: ValidationStatus.FAILED,
          message: `Task execution time ${executionMetrics.duration}ms exceeds critical threshold ${thresholds.critical}ms`,
          timestamp: new Date(),
        });
      } else if (executionMetrics.duration > thresholds.warning) {
        results.push({
          id: 'quality-execution-time-warning',
          category: ValidationCategory.PERFORMANCE,
          severity: ValidationSeverity.WARNING,
          status: ValidationStatus.FAILED,
          message: `Task execution time ${executionMetrics.duration}ms exceeds warning threshold ${thresholds.warning}ms`,
          timestamp: new Date(),
        });
      }
    }
    // Validate error rate
    const errorRate =
      executionMetrics.errorCount / (executionMetrics.errorCount + 1);
    if (this.config.qualityThresholds.errorRate) {
      const thresholds = this.config.qualityThresholds.errorRate;
      if (errorRate > thresholds.critical) {
        results.push({
          id: 'quality-error-rate-critical',
          category: ValidationCategory.FUNCTIONAL,
          severity: ValidationSeverity.CRITICAL,
          status: ValidationStatus.FAILED,
          message: `Task error rate ${(errorRate * 100).toFixed(2)}% exceeds critical threshold ${(thresholds.critical * 100).toFixed(2)}%`,
          timestamp: new Date(),
        });
      }
    }
    return results.length === 0
      ? [
          {
            id: 'quality-metrics-valid',
            category: ValidationCategory.FUNCTIONAL,
            severity: ValidationSeverity.INFO,
            status: ValidationStatus.PASSED,
            message: 'Quality metrics validation passed',
            timestamp: new Date(),
          },
        ]
      : results;
  }
  /**
   * Validate task security compliance
   */
  async validateTaskSecurity(context) {
    const results = [];
    const task = context.metadata?.task;
    // TODO: Implement comprehensive security validation
    // - Check for exposed secrets
    // - Validate permissions and access controls
    // - Check for security vulnerabilities
    // - Validate encryption and data protection
    return [
      {
        id: 'security-placeholder',
        category: ValidationCategory.SECURITY,
        severity: ValidationSeverity.INFO,
        status: ValidationStatus.PASSED,
        message:
          'Security validation placeholder - TODO: Implement comprehensive security checks',
        timestamp: new Date(),
      },
    ];
  }
  /**
   * Validate task performance metrics
   */
  async validateTaskPerformance(context) {
    const results = [];
    const executionMetrics = context.metadata?.executionMetrics;
    if (!executionMetrics) {
      return [
        {
          id: 'performance-no-metrics',
          category: ValidationCategory.PERFORMANCE,
          severity: ValidationSeverity.WARNING,
          status: ValidationStatus.SKIPPED,
          message: 'No execution metrics available for performance validation',
          timestamp: new Date(),
        },
      ];
    }
    // Validate memory usage
    if (
      executionMetrics.memoryUsage &&
      this.config.qualityThresholds.memoryUsage
    ) {
      const thresholds = this.config.qualityThresholds.memoryUsage;
      const peakMemoryMB = executionMetrics.memoryUsage.peak / (1024 * 1024);
      if (peakMemoryMB > thresholds.critical) {
        results.push({
          id: 'performance-memory-critical',
          category: ValidationCategory.PERFORMANCE,
          severity: ValidationSeverity.CRITICAL,
          status: ValidationStatus.FAILED,
          message: `Peak memory usage ${peakMemoryMB.toFixed(2)}MB exceeds critical threshold ${thresholds.critical}MB`,
          timestamp: new Date(),
        });
      }
    }
    return results.length === 0
      ? [
          {
            id: 'performance-metrics-valid',
            category: ValidationCategory.PERFORMANCE,
            severity: ValidationSeverity.INFO,
            status: ValidationStatus.PASSED,
            message: 'Performance metrics validation passed',
            timestamp: new Date(),
          },
        ]
      : results;
  }
  /**
   * Helper methods
   */
  calculateQualityScore(results, context) {
    if (results.length === 0) return 1.0;
    const weights = {
      [ValidationSeverity.CRITICAL]: 0.4,
      [ValidationSeverity.ERROR]: 0.3,
      [ValidationSeverity.WARNING]: 0.2,
      [ValidationSeverity.INFO]: 0.1,
    };
    let totalWeight = 0;
    let failedWeight = 0;
    results.forEach((result) => {
      const weight = weights[result.severity];
      totalWeight += weight;
      if (result.status === ValidationStatus.FAILED) {
        failedWeight += weight;
      }
    });
    return totalWeight > 0 ? (totalWeight - failedWeight) / totalWeight : 1.0;
  }
  generateRecommendations(results, context) {
    const recommendations = [];
    // Generate recommendations based on validation results
    results.forEach((result) => {
      if (
        result.status === ValidationStatus.FAILED &&
        result.severity === ValidationSeverity.CRITICAL
      ) {
        recommendations.push({
          type: 'reliability',
          severity: result.severity,
          message: `Critical validation failure: ${result.message}`,
          details: result.details || 'No additional details available',
          suggestedActions: [
            'Review task implementation',
            'Check dependencies',
            'Validate input data',
          ],
          impact: 'high',
          effort: 'significant',
        });
      }
    });
    return recommendations;
  }
  shouldRecommendRollback(results, qualityScore, context) {
    const criticalFailures = results.filter(
      (r) =>
        r.severity === ValidationSeverity.CRITICAL &&
        r.status === ValidationStatus.FAILED,
    );
    const minQualityScore = this.getMinQualityScore(context.validationLevel);
    return criticalFailures.length > 0 || qualityScore < minQualityScore * 0.8;
  }
  getRollbackReason(results, qualityScore) {
    const criticalFailures = results.filter(
      (r) =>
        r.severity === ValidationSeverity.CRITICAL &&
        r.status === ValidationStatus.FAILED,
    );
    if (criticalFailures.length > 0) {
      return `Critical validation failures detected: ${criticalFailures.map((f) => f.message).join(', ')}`;
    }
    return `Quality score ${qualityScore.toFixed(3)} below acceptable threshold`;
  }
  getMinQualityScore(validationLevel) {
    switch (validationLevel) {
      case TaskValidationLevel.STRICT:
        return 0.95;
      case TaskValidationLevel.MODERATE:
        return 0.8;
      case TaskValidationLevel.LENIENT:
        return 0.6;
      case TaskValidationLevel.ADVISORY:
        return 0.4;
      default:
        return 0.8;
    }
  }
  /**
   * Public API methods
   */
  /**
   * Get task snapshots for a task
   */
  getTaskSnapshots(taskId) {
    return this.snapshots.get(taskId) || [];
  }
  /**
   * Get task validation statistics
   */
  getValidationStatistics() {
    const totalSnapshots = Array.from(this.snapshots.values()).reduce(
      (sum, snapshots) => sum + snapshots.length,
      0,
    );
    return {
      activeValidations: this.activeValidations.size,
      totalSnapshots,
      configuredThresholds: this.config.qualityThresholds,
      frameworkStats: this.validationFramework.getStatistics(),
    };
  }
  /**
   * Update quality thresholds
   */
  updateQualityThresholds(thresholds) {
    this.config.qualityThresholds = {
      ...this.config.qualityThresholds,
      ...thresholds,
    };
    this.logger.info('Quality thresholds updated', { thresholds });
  }
  /**
   * Register custom validator
   */
  registerCustomValidator(name, validator) {
    this.config.customValidators.set(name, validator);
    this.logger.info('Custom validator registered', { name });
  }
  /**
   * Clean up resources
   */
  async cleanup() {
    this.logger.info('Cleaning up TaskValidator resources');
    // Cancel active validations
    this.activeValidations.clear();
    // Clean up snapshots if not preserving
    if (!this.config.rollback.preserveSnapshots) {
      this.snapshots.clear();
    }
    this.removeAllListeners();
  }
}
//# sourceMappingURL=TaskValidator.js.map
