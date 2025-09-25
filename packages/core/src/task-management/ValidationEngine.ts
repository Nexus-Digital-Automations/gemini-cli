/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Comprehensive Automatic Task Completion Validation Engine
 *
 * Enterprise-grade validation system for task completion with configurable
 * quality gates, intelligent validation rules, and automatic recovery mechanisms.
 */

import type { Config } from '../config/config.js';
import type {
  Task,
  TaskId,
  TaskResult,
  TaskStatus,
  TaskPriority,
  TaskCategory
} from './types.js';
import type { ExecutionMetrics } from './ExecutionMonitoringSystem.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { EventEmitter } from 'node:events';

/**
 * Validation checkpoint types
 */
export type ValidationCheckpointType =
  | 'code_quality'
  | 'functional_testing'
  | 'performance'
  | 'security'
  | 'integration'
  | 'business_rules'
  | 'compliance'
  | 'documentation';

/**
 * Validation severity levels
 */
export type ValidationSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * Validation status
 */
export type ValidationStatus = 'passed' | 'failed' | 'warning' | 'skipped' | 'error';

/**
 * Quality gate configuration
 */
export interface QualityGateConfig {
  /** Unique identifier for the quality gate */
  id: string;
  /** Human-readable name */
  name: string;
  /** Type of validation checkpoint */
  type: ValidationCheckpointType;
  /** Whether this gate is blocking (must pass to proceed) */
  blocking: boolean;
  /** Minimum severity level required to pass */
  minimumSeverity: ValidationSeverity;
  /** Timeout for validation in milliseconds */
  timeoutMs: number;
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Custom validation parameters */
  parameters: Record<string, unknown>;
  /** Validation rules to execute */
  rules: ValidationRule[];
  /** Tasks that this gate applies to */
  applicableTasks?: {
    categories?: TaskCategory[];
    priorities?: TaskPriority[];
    tags?: string[];
  };
}

/**
 * Validation rule definition
 */
export interface ValidationRule {
  /** Unique rule identifier */
  id: string;
  /** Rule name */
  name: string;
  /** Rule description */
  description: string;
  /** Severity of violations */
  severity: ValidationSeverity;
  /** Rule implementation function */
  validator: (task: Task, result: TaskResult, context: ValidationContext) => Promise<ValidationRuleResult>;
  /** Whether this rule is enabled */
  enabled: boolean;
  /** Rule-specific configuration */
  config?: Record<string, unknown>;
}

/**
 * Validation context for rules
 */
export interface ValidationContext {
  /** Task being validated */
  task: Task;
  /** Task execution result */
  result: TaskResult;
  /** Project configuration */
  config: Config;
  /** Current execution metrics */
  metrics: ExecutionMetrics;
  /** Validation history for this task */
  history: ValidationResult[];
  /** Additional context data */
  data: Record<string, unknown>;
}

/**
 * Result of a single validation rule
 */
export interface ValidationRuleResult {
  /** Whether the rule passed */
  passed: boolean;
  /** Validation status */
  status: ValidationStatus;
  /** Human-readable message */
  message: string;
  /** Detailed findings */
  details?: string;
  /** Metrics collected during validation */
  metrics?: Record<string, number>;
  /** Evidence or artifacts */
  evidence?: string[];
  /** Suggested fixes */
  suggestions?: string[];
  /** Execution time in milliseconds */
  executionTimeMs: number;
}

/**
 * Result of a quality gate validation
 */
export interface QualityGateResult {
  /** Quality gate configuration */
  gate: QualityGateConfig;
  /** Overall gate status */
  status: ValidationStatus;
  /** Whether the gate passed */
  passed: boolean;
  /** Individual rule results */
  ruleResults: ValidationRuleResult[];
  /** Gate execution time */
  executionTimeMs: number;
  /** Timestamp when validation occurred */
  timestamp: Date;
  /** Error information if gate failed to execute */
  error?: {
    message: string;
    stack?: string;
  };
}

/**
 * Complete validation result for a task
 */
export interface ValidationResult {
  /** Task ID that was validated */
  taskId: TaskId;
  /** Overall validation status */
  status: ValidationStatus;
  /** Whether all blocking gates passed */
  passed: boolean;
  /** Individual gate results */
  gateResults: QualityGateResult[];
  /** Overall execution time */
  executionTimeMs: number;
  /** Validation timestamp */
  timestamp: Date;
  /** Summary statistics */
  summary: {
    totalGates: number;
    passedGates: number;
    failedGates: number;
    warningGates: number;
    skippedGates: number;
    criticalViolations: number;
    highViolations: number;
    mediumViolations: number;
    lowViolations: number;
  };
  /** Next actions recommended */
  recommendations: string[];
  /** Whether automatic recovery was attempted */
  recoveryAttempted: boolean;
  /** Recovery results if attempted */
  recoveryResults?: {
    success: boolean;
    actions: string[];
    details: string;
  };
}

/**
 * Performance benchmark configuration
 */
export interface PerformanceBenchmark {
  /** Benchmark name */
  name: string;
  /** Maximum execution time in milliseconds */
  maxExecutionTime: number;
  /** Maximum memory usage in MB */
  maxMemoryUsage: number;
  /** Maximum CPU usage percentage */
  maxCpuUsage: number;
  /** Minimum throughput (operations per second) */
  minThroughput?: number;
  /** Custom performance metrics */
  customMetrics?: Record<string, {
    threshold: number;
    comparison: 'less_than' | 'greater_than' | 'equals';
  }>;
}

/**
 * Security scan configuration
 */
export interface SecurityScanConfig {
  /** SAST scanner to use */
  scanner: 'semgrep' | 'bandit' | 'eslint-security' | 'custom';
  /** Rules to apply */
  rules: string[];
  /** Severity levels to report */
  reportSeverities: ValidationSeverity[];
  /** Whether to fail on any findings */
  failOnFindings: boolean;
  /** Custom scanner command */
  customCommand?: string;
  /** Additional scanner arguments */
  arguments?: string[];
}

/**
 * Comprehensive automatic task completion validation engine
 */
export class ValidationEngine extends EventEmitter {
  private readonly config: Config;
  private readonly qualityGates: Map<string, QualityGateConfig> = new Map();
  private readonly validationRules: Map<string, ValidationRule> = new Map();
  private readonly validationHistory: ValidationResult[] = [];
  private readonly performanceBenchmarks: Map<string, PerformanceBenchmark> = new Map();
  private readonly securityScans: Map<string, SecurityScanConfig> = new Map();

  // Validation state
  private readonly activeValidations: Map<TaskId, Promise<ValidationResult>> = new Map();
  private readonly recoveryStrategies: Map<string, (task: Task, result: TaskResult) => Promise<boolean>> = new Map();

  // Persistence
  private readonly validationResultsPath: string;
  private readonly benchmarkResultsPath: string;
  private readonly securityResultsPath: string;

  constructor(config: Config) {
    super();
    this.config = config;

    const tempDir = config.storage.getProjectTempDir();
    this.validationResultsPath = path.join(tempDir, 'validation-results.json');
    this.benchmarkResultsPath = path.join(tempDir, 'benchmark-results.json');
    this.securityResultsPath = path.join(tempDir, 'security-results.json');

    // Initialize default quality gates and rules
    this.initializeDefaultQualityGates();
    this.initializeDefaultValidationRules();
    this.initializeDefaultBenchmarks();
    this.initializeDefaultSecurityScans();
    this.initializeRecoveryStrategies();
  }

  /**
   * Validates task completion with all configured quality gates
   */
  async validateTaskCompletion(
    task: Task,
    result: TaskResult,
    metrics: ExecutionMetrics
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    const validationId = `${task.id}_${startTime}`;

    // Check if validation is already in progress
    if (this.activeValidations.has(task.id)) {
      return await this.activeValidations.get(task.id)!;
    }

    // Start validation
    const validationPromise = this.executeValidation(task, result, metrics);
    this.activeValidations.set(task.id, validationPromise);

    try {
      const validationResult = await validationPromise;

      // Store validation result
      this.validationHistory.push(validationResult);
      this.trimValidationHistory();

      // Persist results
      await this.persistValidationResults();

      // Emit validation events
      this.emit('validationCompleted', validationResult);

      if (!validationResult.passed) {
        this.emit('validationFailed', validationResult);
      }

      return validationResult;
    } finally {
      this.activeValidations.delete(task.id);
    }
  }

  /**
   * Executes validation with all applicable quality gates
   */
  private async executeValidation(
    task: Task,
    result: TaskResult,
    metrics: ExecutionMetrics
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    const gateResults: QualityGateResult[] = [];

    // Get applicable quality gates for this task
    const applicableGates = this.getApplicableQualityGates(task);

    // Create validation context
    const context: ValidationContext = {
      task,
      result,
      config: this.config,
      metrics,
      history: this.validationHistory.filter(v => v.taskId === task.id),
      data: {}
    };

    // Execute quality gates in parallel for non-blocking gates, sequentially for blocking
    const blockingGates = applicableGates.filter(gate => gate.blocking);
    const nonBlockingGates = applicableGates.filter(gate => !gate.blocking);

    // Execute blocking gates first (sequentially)
    for (const gate of blockingGates) {
      const gateResult = await this.executeQualityGate(gate, context);
      gateResults.push(gateResult);

      // If blocking gate fails, stop execution
      if (gateResult.status === 'failed' && gate.blocking) {
        break;
      }
    }

    // Execute non-blocking gates in parallel
    if (nonBlockingGates.length > 0) {
      const nonBlockingResults = await Promise.all(
        nonBlockingGates.map(gate => this.executeQualityGate(gate, context))
      );
      gateResults.push(...nonBlockingResults);
    }

    // Calculate overall validation result
    const executionTimeMs = Date.now() - startTime;
    const passed = this.calculateOverallValidationStatus(gateResults);
    const summary = this.calculateValidationSummary(gateResults);
    const recommendations = this.generateRecommendations(gateResults);

    // Attempt automatic recovery if validation failed
    let recoveryAttempted = false;
    let recoveryResults;

    if (!passed && result.success) {
      recoveryAttempted = true;
      recoveryResults = await this.attemptAutomaticRecovery(task, result, gateResults);
    }

    const validationResult: ValidationResult = {
      taskId: task.id,
      status: passed ? 'passed' : 'failed',
      passed,
      gateResults,
      executionTimeMs,
      timestamp: new Date(),
      summary,
      recommendations,
      recoveryAttempted,
      recoveryResults
    };

    return validationResult;
  }

  /**
   * Executes a single quality gate
   */
  private async executeQualityGate(
    gate: QualityGateConfig,
    context: ValidationContext
  ): Promise<QualityGateResult> {
    const startTime = Date.now();

    try {
      // Execute all rules for this gate
      const ruleResults = await Promise.all(
        gate.rules
          .filter(rule => rule.enabled)
          .map(rule => this.executeValidationRule(rule, context))
      );

      // Determine gate status based on rule results
      const status = this.calculateGateStatus(ruleResults, gate.minimumSeverity);
      const passed = status === 'passed';

      return {
        gate,
        status,
        passed,
        ruleResults,
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        gate,
        status: 'error',
        passed: false,
        ruleResults: [],
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date(),
        error: {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        }
      };
    }
  }

  /**
   * Executes a single validation rule
   */
  private async executeValidationRule(
    rule: ValidationRule,
    context: ValidationContext
  ): Promise<ValidationRuleResult> {
    const startTime = Date.now();

    try {
      const result = await Promise.race([
        rule.validator(context.task, context.result, context),
        new Promise<ValidationRuleResult>((_, reject) =>
          setTimeout(() => reject(new Error('Validation rule timeout')), 30000)
        )
      ]);

      return {
        ...result,
        executionTimeMs: Date.now() - startTime
      };
    } catch (error) {
      return {
        passed: false,
        status: 'error',
        message: `Rule execution failed: ${error instanceof Error ? error.message : String(error)}`,
        executionTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * Gets quality gates applicable to a specific task
   */
  private getApplicableQualityGates(task: Task): QualityGateConfig[] {
    return Array.from(this.qualityGates.values()).filter(gate => {
      // Check if gate applies to this task
      if (!gate.applicableTasks) {
        return true; // Apply to all tasks if no restrictions
      }

      const { categories, priorities, tags } = gate.applicableTasks;

      // Check category match
      if (categories && !categories.includes(task.category)) {
        return false;
      }

      // Check priority match
      if (priorities && !priorities.includes(task.priority)) {
        return false;
      }

      // Check tags match
      if (tags && task.metadata.tags) {
        const hasMatchingTag = tags.some(tag => task.metadata.tags!.includes(tag));
        if (!hasMatchingTag) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Calculates overall validation status from gate results
   */
  private calculateOverallValidationStatus(gateResults: QualityGateResult[]): boolean {
    // All blocking gates must pass
    const blockingGates = gateResults.filter(result => result.gate.blocking);
    const allBlockingGatesPassed = blockingGates.every(result => result.passed);

    return allBlockingGatesPassed;
  }

  /**
   * Calculates gate status from rule results
   */
  private calculateGateStatus(
    ruleResults: ValidationRuleResult[],
    minimumSeverity: ValidationSeverity
  ): ValidationStatus {
    const failedResults = ruleResults.filter(result => !result.passed);

    if (failedResults.length === 0) {
      return 'passed';
    }

    // Check if any failed results meet the minimum severity threshold
    const severityOrder: ValidationSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];
    const minSeverityIndex = severityOrder.indexOf(minimumSeverity);

    const criticalFailures = failedResults.some(result => {
      const rule = ruleResults.find(r => r === result);
      return rule && severityOrder.indexOf(rule.status as ValidationSeverity) <= minSeverityIndex;
    });

    if (criticalFailures) {
      return 'failed';
    }

    return 'warning';
  }

  /**
   * Calculates validation summary statistics
   */
  private calculateValidationSummary(gateResults: QualityGateResult[]) {
    const summary = {
      totalGates: gateResults.length,
      passedGates: 0,
      failedGates: 0,
      warningGates: 0,
      skippedGates: 0,
      criticalViolations: 0,
      highViolations: 0,
      mediumViolations: 0,
      lowViolations: 0
    };

    for (const gateResult of gateResults) {
      switch (gateResult.status) {
        case 'passed':
          summary.passedGates++;
          break;
        case 'failed':
          summary.failedGates++;
          break;
        case 'warning':
          summary.warningGates++;
          break;
        case 'skipped':
          summary.skippedGates++;
          break;
      }

      // Count violations by severity
      for (const ruleResult of gateResult.ruleResults) {
        if (!ruleResult.passed) {
          const rule = this.validationRules.get(ruleResult.message); // This is simplified
          if (rule) {
            switch (rule.severity) {
              case 'critical':
                summary.criticalViolations++;
                break;
              case 'high':
                summary.highViolations++;
                break;
              case 'medium':
                summary.mediumViolations++;
                break;
              case 'low':
                summary.lowViolations++;
                break;
            }
          }
        }
      }
    }

    return summary;
  }

  /**
   * Generates recommendations based on validation results
   */
  private generateRecommendations(gateResults: QualityGateResult[]): string[] {
    const recommendations: string[] = [];

    for (const gateResult of gateResults) {
      if (!gateResult.passed) {
        // Add gate-specific recommendations
        switch (gateResult.gate.type) {
          case 'code_quality':
            recommendations.push('Review code quality issues and fix linting violations');
            break;
          case 'performance':
            recommendations.push('Optimize performance bottlenecks identified in validation');
            break;
          case 'security':
            recommendations.push('Address security vulnerabilities found during scan');
            break;
          case 'functional_testing':
            recommendations.push('Fix failing tests and ensure proper test coverage');
            break;
        }

        // Add rule-specific suggestions
        for (const ruleResult of gateResult.ruleResults) {
          if (ruleResult.suggestions) {
            recommendations.push(...ruleResult.suggestions);
          }
        }
      }
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Attempts automatic recovery for failed validations
   */
  private async attemptAutomaticRecovery(
    task: Task,
    result: TaskResult,
    gateResults: QualityGateResult[]
  ): Promise<{ success: boolean; actions: string[]; details: string }> {
    const actions: string[] = [];
    let overallSuccess = true;
    const details: string[] = [];

    // Attempt recovery for each failed gate
    for (const gateResult of gateResults) {
      if (!gateResult.passed && this.recoveryStrategies.has(gateResult.gate.type)) {
        const recoveryStrategy = this.recoveryStrategies.get(gateResult.gate.type)!;

        try {
          const success = await recoveryStrategy(task, result);
          actions.push(`Attempted recovery for ${gateResult.gate.name}`);

          if (success) {
            details.push(`Successfully recovered ${gateResult.gate.name}`);
          } else {
            details.push(`Recovery failed for ${gateResult.gate.name}`);
            overallSuccess = false;
          }
        } catch (error) {
          details.push(`Recovery error for ${gateResult.gate.name}: ${error}`);
          overallSuccess = false;
        }
      }
    }

    return {
      success: overallSuccess,
      actions,
      details: details.join('; ')
    };
  }

  /**
   * Adds a custom quality gate
   */
  addQualityGate(gate: QualityGateConfig): void {
    this.qualityGates.set(gate.id, gate);
    this.emit('qualityGateAdded', gate);
  }

  /**
   * Adds a custom validation rule
   */
  addValidationRule(rule: ValidationRule): void {
    this.validationRules.set(rule.id, rule);
    this.emit('validationRuleAdded', rule);
  }

  /**
   * Gets validation history for a task
   */
  getValidationHistory(taskId: TaskId): ValidationResult[] {
    return this.validationHistory.filter(result => result.taskId === taskId);
  }

  /**
   * Gets overall validation statistics
   */
  getValidationStatistics(): {
    totalValidations: number;
    successRate: number;
    averageExecutionTime: number;
    gateStatistics: Record<string, { passed: number; failed: number; successRate: number }>;
  } {
    const total = this.validationHistory.length;
    const passed = this.validationHistory.filter(v => v.passed).length;
    const successRate = total > 0 ? (passed / total) * 100 : 0;

    const totalExecutionTime = this.validationHistory.reduce(
      (sum, v) => sum + v.executionTimeMs,
      0
    );
    const averageExecutionTime = total > 0 ? totalExecutionTime / total : 0;

    // Calculate gate statistics
    const gateStatistics: Record<string, { passed: number; failed: number; successRate: number }> = {};

    for (const validation of this.validationHistory) {
      for (const gateResult of validation.gateResults) {
        const gateName = gateResult.gate.name;
        if (!gateStatistics[gateName]) {
          gateStatistics[gateName] = { passed: 0, failed: 0, successRate: 0 };
        }

        if (gateResult.passed) {
          gateStatistics[gateName].passed++;
        } else {
          gateStatistics[gateName].failed++;
        }
      }
    }

    // Calculate success rates for gates
    for (const gateName in gateStatistics) {
      const stats = gateStatistics[gateName];
      const total = stats.passed + stats.failed;
      stats.successRate = total > 0 ? (stats.passed / total) * 100 : 0;
    }

    return {
      totalValidations: total,
      successRate,
      averageExecutionTime,
      gateStatistics
    };
  }

  /**
   * Initializes default quality gates
   */
  private initializeDefaultQualityGates(): void {
    // Code Quality Gate
    this.addQualityGate({
      id: 'code_quality_gate',
      name: 'Code Quality Gate',
      type: 'code_quality',
      blocking: true,
      minimumSeverity: 'medium',
      timeoutMs: 60000,
      maxRetries: 2,
      parameters: {
        lintingEnabled: true,
        formattingCheck: true,
        complexityCheck: true
      },
      rules: []
    });

    // Performance Gate
    this.addQualityGate({
      id: 'performance_gate',
      name: 'Performance Gate',
      type: 'performance',
      blocking: false,
      minimumSeverity: 'high',
      timeoutMs: 120000,
      maxRetries: 1,
      parameters: {
        benchmarkRequired: true,
        memoryThreshold: 512,
        executionTimeThreshold: 30000
      },
      rules: []
    });

    // Security Gate
    this.addQualityGate({
      id: 'security_gate',
      name: 'Security Gate',
      type: 'security',
      blocking: true,
      minimumSeverity: 'critical',
      timeoutMs: 180000,
      maxRetries: 1,
      parameters: {
        sastRequired: true,
        dependencyCheck: true,
        secretsCheck: true
      },
      rules: []
    });
  }

  /**
   * Initializes default validation rules
   */
  private initializeDefaultValidationRules(): void {
    // Implementation will be added in the next part
  }

  /**
   * Initializes default performance benchmarks
   */
  private initializeDefaultBenchmarks(): void {
    // Implementation will be added in the next part
  }

  /**
   * Initializes default security scans
   */
  private initializeDefaultSecurityScans(): void {
    // Implementation will be added in the next part
  }

  /**
   * Initializes recovery strategies
   */
  private initializeRecoveryStrategies(): void {
    // Implementation will be added in the next part
  }

  /**
   * Trims validation history to prevent memory issues
   */
  private trimValidationHistory(): void {
    if (this.validationHistory.length > 1000) {
      this.validationHistory.splice(0, this.validationHistory.length - 500);
    }
  }

  /**
   * Persists validation results to disk
   */
  private async persistValidationResults(): Promise<void> {
    try {
      const data = {
        validationHistory: this.validationHistory.slice(-100),
        statistics: this.getValidationStatistics(),
        lastUpdated: new Date().toISOString()
      };

      await fs.writeFile(this.validationResultsPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error persisting validation results:', error);
    }
  }

  /**
   * Shuts down the validation engine
   */
  async shutdown(): Promise<void> {
    // Wait for all active validations to complete
    const activeValidations = Array.from(this.activeValidations.values());
    if (activeValidations.length > 0) {
      await Promise.allSettled(activeValidations);
    }

    // Persist final results
    await this.persistValidationResults();

    this.emit('shutdown');
    console.log('ValidationEngine shut down gracefully');
  }
}