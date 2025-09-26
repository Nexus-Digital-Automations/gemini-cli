/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { WinstonStructuredLogger as Logger } from '../utils/logger.js';

/**
 * Validation severity levels for different types of validation failures
 */
export enum ValidationSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Validation status for tracking validation states
 */
export enum ValidationStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PASSED = 'passed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

/**
 * Validation rule category for organizing validation types
 */
export enum ValidationCategory {
  SYNTAX = 'syntax',
  LOGIC = 'logic',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  INTEGRATION = 'integration',
  FUNCTIONAL = 'functional',
  BUSINESS = 'business',
}

/**
 * Individual validation result interface
 */
export interface ValidationResult {
  id: string;
  category: ValidationCategory;
  severity: ValidationSeverity;
  status: ValidationStatus;
  message: string;
  details?: string;
  file?: string;
  line?: number;
  column?: number;
  rule?: string;
  timestamp: Date;
  duration?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Validation rule configuration interface
 */
export interface ValidationRule {
  id: string;
  name: string;
  category: ValidationCategory;
  severity: ValidationSeverity;
  enabled: boolean;
  description: string;
  validator: ValidationExecutor;
  dependencies?: string[];
  timeout?: number;
  retries?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Validation context containing input data and configuration
 */
export interface ValidationContext {
  taskId: string;
  files?: string[];
  content?: string;
  metadata?: Record<string, unknown>;
  config?: ValidationConfig;
  previousResults?: ValidationResult[];
}

/**
 * Validation executor function signature
 */
export type ValidationExecutor = (
  context: ValidationContext,
) => Promise<ValidationResult[]>;

/**
 * Validation configuration interface
 */
export interface ValidationConfig {
  enabledCategories: ValidationCategory[];
  maxConcurrentValidations?: number;
  timeout?: number;
  retries?: number;
  failOnError?: boolean;
  reportingEnabled?: boolean;
  customRules?: ValidationRule[];
}

/**
 * Validation report aggregating all results
 */
export interface ValidationReport {
  id: string;
  taskId: string;
  timestamp: Date;
  duration: number;
  totalRules: number;
  passedRules: number;
  failedRules: number;
  skippedRules: number;
  results: ValidationResult[];
  summary: {
    [key in ValidationCategory]?: {
      total: number;
      passed: number;
      failed: number;
      skipped: number;
    };
  };
  metadata?: Record<string, unknown>;
}

/**
 * Validation framework events
 */
export interface ValidationEvents {
  validationStarted: [taskId: string];
  validationCompleted: [report: ValidationReport];
  validationFailed: [taskId: string, error: Error];
  ruleStarted: [ruleId: string, taskId: string];
  ruleCompleted: [result: ValidationResult];
  ruleFailed: [ruleId: string, error: Error];
}

/**
 * Core validation framework for automatic task completion validation cycles
 * Provides comprehensive multi-level validation with automated workflows
 */
export class ValidationFramework extends EventEmitter {
  private readonly logger: Logger;
  private readonly rules: Map<string, ValidationRule> = new Map();
  private readonly activeValidations: Map<string, Promise<ValidationReport>> =
    new Map();
  private readonly config: ValidationConfig;

  constructor(
    config: ValidationConfig = {
      enabledCategories: Object.values(ValidationCategory),
    },
  ) {
    super();
    this.logger = new Logger({
      defaultMeta: { component: 'ValidationFramework' },
    });
    this.config = {
      maxConcurrentValidations: 10,
      timeout: 300000, // 5 minutes
      retries: 3,
      failOnError: true,
      reportingEnabled: true,
      ...config,
    };

    this.logger.info('ValidationFramework initialized', {
      enabledCategories: this.config.enabledCategories,
      maxConcurrent: this.config.maxConcurrentValidations,
    });
  }

  /**
   * Register a validation rule with the framework
   */
  registerRule(rule: ValidationRule): void {
    this.logger.info(`Registering validation rule: ${rule.id}`, {
      category: rule.category,
      severity: rule.severity,
      enabled: rule.enabled,
    });

    if (this.rules.has(rule.id)) {
      this.logger.warn(`Overriding existing validation rule: ${rule.id}`);
    }

    this.rules.set(rule.id, rule);
  }

  /**
   * Unregister a validation rule
   */
  unregisterRule(ruleId: string): boolean {
    const removed = this.rules.delete(ruleId);
    if (removed) {
      this.logger.info(`Unregistered validation rule: ${ruleId}`);
    } else {
      this.logger.warn(`Attempted to unregister non-existent rule: ${ruleId}`);
    }
    return removed;
  }

  /**
   * Get all registered validation rules
   */
  getRules(): ValidationRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get validation rules filtered by category
   */
  getRulesByCategory(category: ValidationCategory): ValidationRule[] {
    return this.getRules().filter((rule) => rule.category === category);
  }

  /**
   * Execute validation cycle for a task
   */
  async validateTask(context: ValidationContext): Promise<ValidationReport> {
    const startTime = Date.now();
    const reportId = `validation-${context.taskId}-${Date.now()}`;

    this.logger.info(`Starting validation cycle for task: ${context.taskId}`, {
      reportId,
      enabledCategories: this.config.enabledCategories,
    });

    this.emit('validationStarted', context.taskId);

    try {
      // Check for active validation
      if (this.activeValidations.has(context.taskId)) {
        this.logger.warn(
          `Validation already running for task: ${context.taskId}`,
        );
        return await this.activeValidations.get(context.taskId)!;
      }

      // Create validation promise
      const validationPromise = this.executeValidationCycle(
        context,
        reportId,
        startTime,
      );
      this.activeValidations.set(context.taskId, validationPromise);

      const report = await validationPromise;

      this.emit('validationCompleted', report);
      return report;
    } catch (error) {
      this.logger.error(`Validation failed for task: ${context.taskId}`, {
        error: error as Error | undefined,
      });
      this.emit('validationFailed', context.taskId, error as Error);
      throw error;
    } finally {
      this.activeValidations.delete(context.taskId);
    }
  }

  /**
   * Execute the complete validation cycle
   */
  private async executeValidationCycle(
    context: ValidationContext,
    reportId: string,
    startTime: number,
  ): Promise<ValidationReport> {
    // Get applicable rules
    const applicableRules = this.getApplicableRules(context);

    this.logger.info(`Executing ${applicableRules.length} validation rules`, {
      taskId: context.taskId,
      categories: Array.from(new Set(applicableRules.map((r) => r.category))),
    });

    // Execute rules with dependency resolution
    const results = await this.executeRulesWithDependencies(
      applicableRules,
      context,
    );

    // Generate report
    const report = this.generateValidationReport(
      reportId,
      context.taskId,
      startTime,
      applicableRules,
      results,
    );

    this.logger.info(`Validation cycle completed for task: ${context.taskId}`, {
      duration: report.duration,
      totalRules: report.totalRules,
      passedRules: report.passedRules,
      failedRules: report.failedRules,
    });

    return report;
  }

  /**
   * Get applicable validation rules for the context
   */
  private getApplicableRules(_context: ValidationContext): ValidationRule[] {
    return this.getRules().filter((rule) => {
      // Check if rule is enabled
      if (!rule.enabled) {
        return false;
      }

      // Check if category is enabled
      if (!this.config.enabledCategories.includes(rule.category)) {
        return false;
      }

      // Additional context-based filtering could be added here
      return true;
    });
  }

  /**
   * Execute validation rules with proper dependency handling
   */
  private async executeRulesWithDependencies(
    rules: ValidationRule[],
    context: ValidationContext,
  ): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    const completedRules = new Set<string>();
    const pendingRules = new Map<string, ValidationRule>();

    // Initialize pending rules
    rules.forEach((rule) => pendingRules.set(rule.id, rule));

    // Execute rules in dependency order
    while (pendingRules.size > 0) {
      const readyRules = Array.from(pendingRules.values()).filter(
        (rule) =>
          !rule.dependencies ||
          rule.dependencies.every((dep) => completedRules.has(dep)),
      );

      if (readyRules.length === 0) {
        // Circular dependency or missing dependency
        const remaining = Array.from(pendingRules.keys());
        this.logger.error('Circular or missing dependencies detected', {
          remaining,
        });

        // Execute remaining rules anyway with warnings
        for (const rule of Array.from(pendingRules.values())) {
          const result = await this.executeValidationRule(rule, context);
          results.push(...result);
          completedRules.add(rule.id);
        }
        break;
      }

      // Execute ready rules (with concurrency limit)
      const concurrencyLimit = Math.min(
        readyRules.length,
        this.config.maxConcurrentValidations || 10,
      );
      const batches = this.createBatches(readyRules, concurrencyLimit);

      for (const batch of batches) {
        const batchResults = await Promise.all(
          batch.map((rule) => this.executeValidationRule(rule, context)),
        );

        batchResults.forEach((ruleResults, index) => {
          results.push(...ruleResults);
          completedRules.add(batch[index].id);
          pendingRules.delete(batch[index].id);
        });
      }
    }

    return results;
  }

  /**
   * Execute a single validation rule
   */
  private async executeValidationRule(
    rule: ValidationRule,
    context: ValidationContext,
  ): Promise<ValidationResult[]> {
    const startTime = Date.now();

    this.logger.debug(`Executing validation rule: ${rule.id}`, {
      category: rule.category,
      taskId: context.taskId,
    });

    this.emit('ruleStarted', rule.id, context.taskId);

    try {
      // Apply timeout and retry logic
      const results = await this.executeWithRetryAndTimeout(
        rule.validator,
        context,
        rule.timeout || this.config.timeout!,
        rule.retries || this.config.retries!,
      );

      // Ensure all results have required fields
      const enrichedResults = results.map((result) => ({
        ...result,
        id: result.id || `${rule.id}-${Date.now()}`,
        category: result.category || rule.category,
        severity: result.severity || rule.severity,
        timestamp: result.timestamp || new Date(),
        duration: result.duration || Date.now() - startTime,
      }));

      enrichedResults.forEach((result) => {
        this.emit('ruleCompleted', result);
      });

      return enrichedResults;
    } catch (error) {
      this.logger.error(`Validation rule failed: ${rule.id}`, {
        error: error as Error | undefined,
      });
      this.emit('ruleFailed', rule.id, error as Error | undefined);

      // Return failure result
      return [
        {
          id: `${rule.id}-error-${Date.now()}`,
          category: rule.category,
          severity: ValidationSeverity.ERROR,
          status: ValidationStatus.FAILED,
          message: `Rule execution failed: ${(error as Error).message}`,
          details: (error as Error).stack,
          rule: rule.id,
          timestamp: new Date(),
          duration: Date.now() - startTime,
        },
      ];
    }
  }

  /**
   * Execute function with retry and timeout logic
   */
  private async executeWithRetryAndTimeout<T>(
    fn: (context: ValidationContext) => Promise<T>,
    context: ValidationContext,
    timeout: number,
    retries: number,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await Promise.race([
          fn(context),
          new Promise<never>((_, reject) => {
            setTimeout(
              () => reject(new Error(`Timeout after ${timeout}ms`)),
              timeout,
            );
          }),
        ]);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < retries) {
          this.logger.warn(
            `Validation attempt ${attempt + 1} failed, retrying...`,
            { error: error as Error | undefined },
          );
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (attempt + 1)),
          ); // Exponential backoff
        }
      }
    }

    throw lastError!;
  }

  /**
   * Create batches of rules for concurrent execution
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Generate comprehensive validation report
   */
  private generateValidationReport(
    reportId: string,
    taskId: string,
    startTime: number,
    rules: ValidationRule[],
    results: ValidationResult[],
  ): ValidationReport {
    const duration = Date.now() - startTime;

    // Calculate summary statistics
    const summary: ValidationReport['summary'] = {};
    const categoryStats = new Map<
      ValidationCategory,
      { total: number; passed: number; failed: number; skipped: number }
    >();

    rules.forEach((rule) => {
      if (!categoryStats.has(rule.category)) {
        categoryStats.set(rule.category, {
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
        });
      }
      categoryStats.get(rule.category)!.total++;
    });

    results.forEach((result) => {
      const stats = categoryStats.get(result.category)!;
      switch (result.status) {
        case ValidationStatus.PASSED:
          stats.passed++;
          break;
        case ValidationStatus.FAILED:
          stats.failed++;
          break;
        case ValidationStatus.SKIPPED:
          stats.skipped++;
          break;
        default:
          // Handle unexpected values
          break;
      }
    });

    categoryStats.forEach((stats, category) => {
      summary[category] = stats;
    });

    const totalPassed = results.filter(
      (r) => r.status === ValidationStatus.PASSED,
    ).length;
    const totalFailed = results.filter(
      (r) => r.status === ValidationStatus.FAILED,
    ).length;
    const totalSkipped = results.filter(
      (r) => r.status === ValidationStatus.SKIPPED,
    ).length;

    return {
      id: reportId,
      taskId,
      timestamp: new Date(),
      duration,
      totalRules: rules.length,
      passedRules: totalPassed,
      failedRules: totalFailed,
      skippedRules: totalSkipped,
      results,
      summary,
      metadata: {
        validationFrameworkVersion: '1.0.0',
        executionEnvironment: process.env['NODE_ENV'] || 'development',
      },
    };
  }

  /**
   * Check if a validation is currently running for a task
   */
  isValidationRunning(taskId: string): boolean {
    return this.activeValidations.has(taskId);
  }

  /**
   * Cancel a running validation
   */
  async cancelValidation(taskId: string): Promise<boolean> {
    if (!this.activeValidations.has(taskId)) {
      return false;
    }

    this.logger.info(`Cancelling validation for task: ${taskId}`);
    this.activeValidations.delete(taskId);
    return true;
  }

  /**
   * Get framework statistics
   */
  getStatistics(): {
    registeredRules: number;
    activeValidations: number;
    enabledCategories: ValidationCategory[];
  } {
    return {
      registeredRules: this.rules.size,
      activeValidations: this.activeValidations.size,
      enabledCategories: this.config.enabledCategories,
    };
  }
}
