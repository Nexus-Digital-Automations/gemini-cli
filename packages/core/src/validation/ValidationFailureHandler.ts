/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../logger/Logger.js';
import type {
  ValidationResult,
  ValidationReport,
  ValidationContext
} from './ValidationFramework.js';
import {
  ValidationSeverity,
  ValidationStatus,
  ValidationCategory
} from './ValidationFramework.js';
import type { WorkflowExecutionResult, TaskExecutionContext } from './ValidationWorkflow.js';

/**
 * Failure handling strategy types
 */
export enum FailureHandlingStrategy {
  IMMEDIATE_RETRY = 'immediate-retry',
  EXPONENTIAL_BACKOFF = 'exponential-backoff',
  LINEAR_BACKOFF = 'linear-backoff',
  CIRCUIT_BREAKER = 'circuit-breaker',
  FALLBACK = 'fallback',
  ESCALATION = 'escalation',
  IGNORE = 'ignore'
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryableErrors: string[];
  nonRetryableErrors: string[];
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  halfOpenMaxAttempts: number;
  monitoringWindow: number;
}

/**
 * Escalation configuration
 */
export interface EscalationConfig {
  levels: Array<{
    threshold: number;
    actions: string[];
    notify: string[];
    timeout: number;
  }>;
  autoEscalation: boolean;
  escalationDelay: number;
}

/**
 * Fallback configuration
 */
export interface FallbackConfig {
  strategies: Array<{
    type: 'skip' | 'default' | 'alternative';
    config?: Record<string, unknown>;
  }>;
  conditions: Array<{
    severity: ValidationSeverity;
    category: ValidationCategory;
    pattern?: string;
  }>;
}

/**
 * Failure handling configuration
 */
export interface ValidationFailureHandlerConfig {
  globalStrategy: FailureHandlingStrategy;
  categoryStrategies: Partial<Record<ValidationCategory, FailureHandlingStrategy>>;
  severityStrategies: Partial<Record<ValidationSeverity, FailureHandlingStrategy>>;
  retryConfig: RetryConfig;
  circuitBreakerConfig: CircuitBreakerConfig;
  escalationConfig: EscalationConfig;
  fallbackConfig: FallbackConfig;
  recovery: {
    autoRecovery: boolean;
    recoveryAttempts: number;
    recoveryStrategies: string[];
  };
  monitoring: {
    trackMetrics: boolean;
    alertThresholds: {
      failureRate: number;
      errorRate: number;
      responseTime: number;
    };
  };
}

/**
 * Circuit breaker state
 */
enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half-open'
}

/**
 * Circuit breaker instance
 */
interface CircuitBreaker {
  state: CircuitBreakerState;
  failures: number;
  lastFailureTime: Date;
  halfOpenAttempts: number;
  windowStart: Date;
  windowFailures: number;
}

/**
 * Failure record for tracking and analytics
 */
interface FailureRecord {
  id: string;
  taskId: string;
  timestamp: Date;
  error: Error;
  context: ValidationContext | TaskExecutionContext;
  strategy: FailureHandlingStrategy;
  attempts: number;
  resolved: boolean;
  recoveryTime?: number;
  metadata: Record<string, unknown>;
}

/**
 * Retry attempt result
 */
interface RetryAttemptResult {
  success: boolean;
  result?: ValidationResult[] | WorkflowExecutionResult;
  error?: Error;
  attempt: number;
  duration: number;
  nextDelay?: number;
}

/**
 * Recovery operation interface
 */
interface RecoveryOperation {
  id: string;
  name: string;
  execute: (context: ValidationContext | TaskExecutionContext, error: Error) => Promise<boolean>;
  timeout: number;
}

/**
 * Validation failure handler with comprehensive retry and recovery mechanisms
 */
export class ValidationFailureHandler extends EventEmitter {
  private readonly logger: Logger;
  private readonly config: ValidationFailureHandlerConfig;
  private readonly circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private readonly failureRecords: Map<string, FailureRecord> = new Map();
  private readonly recoveryOperations: Map<string, RecoveryOperation> = new Map();
  private readonly metrics = {
    totalFailures: 0,
    totalRetries: 0,
    totalRecoveries: 0,
    avgRecoveryTime: 0,
    failuresByCategory: new Map<ValidationCategory, number>(),
    failuresBySeverity: new Map<ValidationSeverity, number>()
  };

  constructor(config: Partial<ValidationFailureHandlerConfig> = {}) {
    super();

    this.logger = new Logger('ValidationFailureHandler');
    this.config = {
      globalStrategy: FailureHandlingStrategy.EXPONENTIAL_BACKOFF,
      categoryStrategies: {
        [ValidationCategory.SYNTAX]: FailureHandlingStrategy.IMMEDIATE_RETRY,
        [ValidationCategory.SECURITY]: FailureHandlingStrategy.ESCALATION,
        [ValidationCategory.PERFORMANCE]: FailureHandlingStrategy.CIRCUIT_BREAKER
      },
      severityStrategies: {
        [ValidationSeverity.CRITICAL]: FailureHandlingStrategy.ESCALATION,
        [ValidationSeverity.ERROR]: FailureHandlingStrategy.EXPONENTIAL_BACKOFF,
        [ValidationSeverity.WARNING]: FailureHandlingStrategy.FALLBACK
      },
      retryConfig: {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        jitter: true,
        retryableErrors: ['TIMEOUT', 'NETWORK_ERROR', 'TEMPORARY_FAILURE'],
        nonRetryableErrors: ['INVALID_INPUT', 'AUTHENTICATION_ERROR', 'PERMISSION_DENIED']
      },
      circuitBreakerConfig: {
        failureThreshold: 5,
        recoveryTimeout: 60000,
        halfOpenMaxAttempts: 3,
        monitoringWindow: 300000
      },
      escalationConfig: {
        levels: [
          {
            threshold: 3,
            actions: ['notify', 'log'],
            notify: ['team-lead'],
            timeout: 300000
          },
          {
            threshold: 5,
            actions: ['notify', 'fallback'],
            notify: ['team-lead', 'manager'],
            timeout: 600000
          }
        ],
        autoEscalation: true,
        escalationDelay: 60000
      },
      fallbackConfig: {
        strategies: [
          { type: 'skip' },
          { type: 'default', config: { defaultValue: 'passed' } }
        ],
        conditions: [
          { severity: ValidationSeverity.WARNING, category: ValidationCategory.PERFORMANCE }
        ]
      },
      recovery: {
        autoRecovery: true,
        recoveryAttempts: 3,
        recoveryStrategies: ['restart', 'reset', 'cleanup']
      },
      monitoring: {
        trackMetrics: true,
        alertThresholds: {
          failureRate: 0.1, // 10%
          errorRate: 0.05, // 5%
          responseTime: 5000 // 5 seconds
        }
      },
      ...config
    };

    // Register default recovery operations
    this.registerDefaultRecoveryOperations();

    this.logger.info('ValidationFailureHandler initialized', {
      globalStrategy: this.config.globalStrategy,
      retryConfig: this.config.retryConfig,
      circuitBreakerConfig: this.config.circuitBreakerConfig
    });
  }

  /**
   * Handle validation failure with appropriate strategy
   */
  async handleValidationFailure<T = ValidationResult[] | WorkflowExecutionResult>(
    error: Error,
    context: ValidationContext | TaskExecutionContext,
    originalOperation: () => Promise<T>
  ): Promise<T> {
    const failureId = `failure-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.logger.warn(`Handling validation failure: ${failureId}`, {
      error: error.message,
      taskId: this.getTaskId(context)
    });

    // Record failure
    const failureRecord = this.recordFailure(failureId, error, context);
    this.updateMetrics(error, context);

    try {
      // Determine handling strategy
      const strategy = this.determineHandlingStrategy(error, context);
      failureRecord.strategy = strategy;

      this.emit('failureDetected', failureRecord);

      // Execute strategy
      const result = await this.executeHandlingStrategy(
        strategy,
        error,
        context,
        originalOperation,
        failureRecord
      );

      // Mark as resolved
      failureRecord.resolved = true;
      failureRecord.recoveryTime = Date.now() - failureRecord.timestamp.getTime();

      this.emit('failureResolved', failureRecord);
      this.logger.info(`Validation failure resolved: ${failureId}`, {
        strategy,
        recoveryTime: failureRecord.recoveryTime
      });

      return result;

    } catch (handlingError) {
      this.logger.error(`Failed to handle validation failure: ${failureId}`, {
        originalError: error.message,
        handlingError: (handlingError as Error).message
      });

      failureRecord.metadata.handlingError = (handlingError as Error).message;
      this.emit('failureUnresolved', failureRecord);

      throw handlingError;
    }
  }

  /**
   * Execute handling strategy
   */
  private async executeHandlingStrategy<T>(
    strategy: FailureHandlingStrategy,
    error: Error,
    context: ValidationContext | TaskExecutionContext,
    originalOperation: () => Promise<T>,
    failureRecord: FailureRecord
  ): Promise<T> {
    switch (strategy) {
      case FailureHandlingStrategy.IMMEDIATE_RETRY:
        return await this.executeImmediateRetry(originalOperation, failureRecord);

      case FailureHandlingStrategy.EXPONENTIAL_BACKOFF:
        return await this.executeExponentialBackoff(originalOperation, failureRecord);

      case FailureHandlingStrategy.LINEAR_BACKOFF:
        return await this.executeLinearBackoff(originalOperation, failureRecord);

      case FailureHandlingStrategy.CIRCUIT_BREAKER:
        return await this.executeCircuitBreaker(originalOperation, context, failureRecord);

      case FailureHandlingStrategy.FALLBACK:
        return await this.executeFallback(error, context, originalOperation, failureRecord);

      case FailureHandlingStrategy.ESCALATION:
        return await this.executeEscalation(error, context, originalOperation, failureRecord);

      case FailureHandlingStrategy.IGNORE:
        throw error; // Re-throw original error

      default:
        throw new Error(`Unknown handling strategy: ${strategy}`);
    }
  }

  /**
   * Execute immediate retry strategy
   */
  private async executeImmediateRetry<T>(
    operation: () => Promise<T>,
    failureRecord: FailureRecord
  ): Promise<T> {
    const maxAttempts = this.config.retryConfig.maxAttempts;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const startTime = Date.now();
        const result = await operation();

        this.emit('retrySuccess', {
          failureId: failureRecord.id,
          attempt,
          duration: Date.now() - startTime
        });

        return result;

      } catch (error) {
        failureRecord.attempts = attempt;

        if (attempt === maxAttempts) {
          throw error;
        }

        if (!this.isRetryable(error as Error)) {
          throw error;
        }

        this.emit('retryAttempt', {
          failureId: failureRecord.id,
          attempt,
          error: (error as Error).message
        });
      }
    }

    throw new Error('Max retry attempts exceeded');
  }

  /**
   * Execute exponential backoff retry strategy
   */
  private async executeExponentialBackoff<T>(
    operation: () => Promise<T>,
    failureRecord: FailureRecord
  ): Promise<T> {
    const { maxAttempts, initialDelay, maxDelay, backoffMultiplier, jitter } = this.config.retryConfig;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const startTime = Date.now();
        const result = await operation();

        this.emit('retrySuccess', {
          failureId: failureRecord.id,
          attempt,
          duration: Date.now() - startTime
        });

        return result;

      } catch (error) {
        failureRecord.attempts = attempt;

        if (attempt === maxAttempts) {
          throw error;
        }

        if (!this.isRetryable(error as Error)) {
          throw error;
        }

        // Calculate next delay
        const actualDelay = jitter ? delay + Math.random() * delay * 0.1 : delay;

        this.emit('retryAttempt', {
          failureId: failureRecord.id,
          attempt,
          error: (error as Error).message,
          nextDelay: actualDelay
        });

        await this.sleep(actualDelay);
        delay = Math.min(delay * backoffMultiplier, maxDelay);
      }
    }

    throw new Error('Max retry attempts exceeded');
  }

  /**
   * Execute linear backoff retry strategy
   */
  private async executeLinearBackoff<T>(
    operation: () => Promise<T>,
    failureRecord: FailureRecord
  ): Promise<T> {
    const { maxAttempts, initialDelay } = this.config.retryConfig;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const startTime = Date.now();
        const result = await operation();

        this.emit('retrySuccess', {
          failureId: failureRecord.id,
          attempt,
          duration: Date.now() - startTime
        });

        return result;

      } catch (error) {
        failureRecord.attempts = attempt;

        if (attempt === maxAttempts) {
          throw error;
        }

        if (!this.isRetryable(error as Error)) {
          throw error;
        }

        const delay = initialDelay * attempt;

        this.emit('retryAttempt', {
          failureId: failureRecord.id,
          attempt,
          error: (error as Error).message,
          nextDelay: delay
        });

        await this.sleep(delay);
      }
    }

    throw new Error('Max retry attempts exceeded');
  }

  /**
   * Execute circuit breaker strategy
   */
  private async executeCircuitBreaker<T>(
    operation: () => Promise<T>,
    context: ValidationContext | TaskExecutionContext,
    failureRecord: FailureRecord
  ): Promise<T> {
    const circuitKey = this.getCircuitBreakerKey(context);
    const circuitBreaker = this.getOrCreateCircuitBreaker(circuitKey);

    // Check circuit breaker state
    if (circuitBreaker.state === CircuitBreakerState.OPEN) {
      if (Date.now() - circuitBreaker.lastFailureTime.getTime() < this.config.circuitBreakerConfig.recoveryTimeout) {
        throw new Error('Circuit breaker is OPEN - operation blocked');
      } else {
        // Transition to half-open
        circuitBreaker.state = CircuitBreakerState.HALF_OPEN;
        circuitBreaker.halfOpenAttempts = 0;
      }
    }

    try {
      const result = await operation();

      // Success in half-open state - close circuit
      if (circuitBreaker.state === CircuitBreakerState.HALF_OPEN) {
        circuitBreaker.state = CircuitBreakerState.CLOSED;
        circuitBreaker.failures = 0;
      }

      return result;

    } catch (error) {
      circuitBreaker.failures++;
      circuitBreaker.lastFailureTime = new Date();

      // Update monitoring window
      this.updateCircuitBreakerWindow(circuitBreaker);

      // Check if should open circuit
      if (circuitBreaker.state === CircuitBreakerState.CLOSED) {
        if (circuitBreaker.windowFailures >= this.config.circuitBreakerConfig.failureThreshold) {
          circuitBreaker.state = CircuitBreakerState.OPEN;
          this.emit('circuitBreakerOpened', { circuitKey, failures: circuitBreaker.failures });
        }
      } else if (circuitBreaker.state === CircuitBreakerState.HALF_OPEN) {
        circuitBreaker.halfOpenAttempts++;
        if (circuitBreaker.halfOpenAttempts >= this.config.circuitBreakerConfig.halfOpenMaxAttempts) {
          circuitBreaker.state = CircuitBreakerState.OPEN;
          this.emit('circuitBreakerOpened', { circuitKey, failures: circuitBreaker.failures });
        }
      }

      throw error;
    }
  }

  /**
   * Execute fallback strategy
   */
  private async executeFallback<T>(
    error: Error,
    context: ValidationContext | TaskExecutionContext,
    originalOperation: () => Promise<T>,
    failureRecord: FailureRecord
  ): Promise<T> {
    // Check if fallback conditions are met
    const shouldFallback = this.shouldUseFallback(error, context);

    if (!shouldFallback) {
      throw error;
    }

    for (const strategy of this.config.fallbackConfig.strategies) {
      try {
        this.emit('fallbackAttempt', {
          failureId: failureRecord.id,
          strategy: strategy.type
        });

        switch (strategy.type) {
          case 'skip':
            return this.createSkipResult<T>();

          case 'default':
            return this.createDefaultResult<T>(strategy.config);

          case 'alternative':
            return await this.executeAlternative<T>(context, strategy.config);
        }
      } catch (fallbackError) {
        this.logger.warn(`Fallback strategy ${strategy.type} failed`, {
          error: (fallbackError as Error).message
        });
      }
    }

    throw error; // All fallback strategies failed
  }

  /**
   * Execute escalation strategy
   */
  private async executeEscalation<T>(
    error: Error,
    context: ValidationContext | TaskExecutionContext,
    originalOperation: () => Promise<T>,
    failureRecord: FailureRecord
  ): Promise<T> {
    const taskId = this.getTaskId(context);
    const existingFailures = Array.from(this.failureRecords.values())
      .filter(record => this.getTaskId(record.context) === taskId && !record.resolved)
      .length;

    // Find appropriate escalation level
    const escalationLevel = this.config.escalationConfig.levels
      .reverse()
      .find(level => existingFailures >= level.threshold);

    if (escalationLevel) {
      this.emit('escalationTriggered', {
        failureId: failureRecord.id,
        level: escalationLevel,
        existingFailures
      });

      // Execute escalation actions
      await this.executeEscalationActions(escalationLevel, error, context, failureRecord);
    }

    // Try original operation one more time after escalation
    try {
      return await originalOperation();
    } catch (escalationError) {
      // If escalation doesn't resolve, continue with exponential backoff
      return await this.executeExponentialBackoff(originalOperation, failureRecord);
    }
  }

  /**
   * Determine appropriate handling strategy
   */
  private determineHandlingStrategy(
    error: Error,
    context: ValidationContext | TaskExecutionContext
  ): FailureHandlingStrategy {
    // Check severity-based strategy
    if ('severity' in error && error.severity) {
      const severityStrategy = this.config.severityStrategies[error.severity as ValidationSeverity];
      if (severityStrategy) {
        return severityStrategy;
      }
    }

    // Check category-based strategy
    if ('category' in error && error.category) {
      const categoryStrategy = this.config.categoryStrategies[error.category as ValidationCategory];
      if (categoryStrategy) {
        return categoryStrategy;
      }
    }

    // Use global strategy
    return this.config.globalStrategy;
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(error: Error): boolean {
    const errorType = error.name || error.constructor.name;

    // Check non-retryable errors first
    if (this.config.retryConfig.nonRetryableErrors.includes(errorType)) {
      return false;
    }

    // Check explicitly retryable errors
    if (this.config.retryConfig.retryableErrors.includes(errorType)) {
      return true;
    }

    // Default retryable errors
    const defaultRetryableErrors = ['TimeoutError', 'NetworkError', 'ConnectionError'];
    return defaultRetryableErrors.includes(errorType);
  }

  /**
   * Record failure for tracking and analytics
   */
  private recordFailure(
    failureId: string,
    error: Error,
    context: ValidationContext | TaskExecutionContext
  ): FailureRecord {
    const record: FailureRecord = {
      id: failureId,
      taskId: this.getTaskId(context),
      timestamp: new Date(),
      error,
      context,
      strategy: this.config.globalStrategy, // Will be updated
      attempts: 0,
      resolved: false,
      metadata: {}
    };

    this.failureRecords.set(failureId, record);
    return record;
  }

  /**
   * Update failure metrics
   */
  private updateMetrics(error: Error, context: ValidationContext | TaskExecutionContext): void {
    if (!this.config.monitoring.trackMetrics) {
      return;
    }

    this.metrics.totalFailures++;

    // Update category metrics
    if ('category' in error && error.category) {
      const category = error.category as ValidationCategory;
      this.metrics.failuresByCategory.set(
        category,
        (this.metrics.failuresByCategory.get(category) || 0) + 1
      );
    }

    // Update severity metrics
    if ('severity' in error && error.severity) {
      const severity = error.severity as ValidationSeverity;
      this.metrics.failuresBySeverity.set(
        severity,
        (this.metrics.failuresBySeverity.get(severity) || 0) + 1
      );
    }
  }

  /**
   * Get or create circuit breaker
   */
  private getOrCreateCircuitBreaker(key: string): CircuitBreaker {
    if (!this.circuitBreakers.has(key)) {
      this.circuitBreakers.set(key, {
        state: CircuitBreakerState.CLOSED,
        failures: 0,
        lastFailureTime: new Date(),
        halfOpenAttempts: 0,
        windowStart: new Date(),
        windowFailures: 0
      });
    }
    return this.circuitBreakers.get(key)!;
  }

  /**
   * Get circuit breaker key from context
   */
  private getCircuitBreakerKey(context: ValidationContext | TaskExecutionContext): string {
    const taskId = this.getTaskId(context);
    return `circuit-${taskId}`;
  }

  /**
   * Update circuit breaker monitoring window
   */
  private updateCircuitBreakerWindow(circuitBreaker: CircuitBreaker): void {
    const now = Date.now();
    const windowDuration = this.config.circuitBreakerConfig.monitoringWindow;

    if (now - circuitBreaker.windowStart.getTime() > windowDuration) {
      // Reset window
      circuitBreaker.windowStart = new Date();
      circuitBreaker.windowFailures = 1;
    } else {
      circuitBreaker.windowFailures++;
    }
  }

  /**
   * Check if fallback should be used
   */
  private shouldUseFallback(error: Error, context: ValidationContext | TaskExecutionContext): boolean {
    return this.config.fallbackConfig.conditions.some(condition => {
      if ('severity' in error && error.severity !== condition.severity) {
        return false;
      }
      if ('category' in error && error.category !== condition.category) {
        return false;
      }
      if (condition.pattern && !new RegExp(condition.pattern).test(error.message)) {
        return false;
      }
      return true;
    });
  }

  /**
   * Create skip result for fallback
   */
  private createSkipResult<T>(): T {
    // This is a placeholder - actual implementation would depend on result type
    return {
      status: ValidationStatus.SKIPPED,
      message: 'Validation skipped due to fallback strategy'
    } as unknown as T;
  }

  /**
   * Create default result for fallback
   */
  private createDefaultResult<T>(config?: Record<string, unknown>): T {
    const defaultValue = config?.defaultValue || 'passed';
    return {
      status: ValidationStatus.PASSED,
      message: `Default result applied: ${defaultValue}`
    } as unknown as T;
  }

  /**
   * Execute alternative operation for fallback
   */
  private async executeAlternative<T>(
    context: ValidationContext | TaskExecutionContext,
    config?: Record<string, unknown>
  ): Promise<T> {
    // This would execute an alternative validation method
    throw new Error('Alternative execution not implemented');
  }

  /**
   * Execute escalation actions
   */
  private async executeEscalationActions(
    level: EscalationConfig['levels'][0],
    error: Error,
    context: ValidationContext | TaskExecutionContext,
    failureRecord: FailureRecord
  ): Promise<void> {
    for (const action of level.actions) {
      try {
        switch (action) {
          case 'notify':
            await this.sendNotifications(level.notify, error, context, failureRecord);
            break;
          case 'log':
            this.logger.error('Escalation triggered', {
              level,
              error: error.message,
              failureRecord
            });
            break;
          case 'fallback':
            // Trigger fallback strategy
            break;
        }
      } catch (actionError) {
        this.logger.error(`Escalation action ${action} failed`, {
          error: (actionError as Error).message
        });
      }
    }
  }

  /**
   * Send escalation notifications
   */
  private async sendNotifications(
    recipients: string[],
    error: Error,
    context: ValidationContext | TaskExecutionContext,
    failureRecord: FailureRecord
  ): Promise<void> {
    this.logger.info('Sending escalation notifications', {
      recipients,
      failureId: failureRecord.id,
      error: error.message
    });
    // Implementation would send actual notifications
  }

  /**
   * Register default recovery operations
   */
  private registerDefaultRecoveryOperations(): void {
    this.recoveryOperations.set('restart', {
      id: 'restart',
      name: 'Restart Operation',
      execute: async (context, error) => {
        this.logger.info('Executing restart recovery operation');
        // Implementation would restart the operation
        return true;
      },
      timeout: 30000
    });

    this.recoveryOperations.set('reset', {
      id: 'reset',
      name: 'Reset State',
      execute: async (context, error) => {
        this.logger.info('Executing reset recovery operation');
        // Implementation would reset validation state
        return true;
      },
      timeout: 10000
    });

    this.recoveryOperations.set('cleanup', {
      id: 'cleanup',
      name: 'Cleanup Resources',
      execute: async (context, error) => {
        this.logger.info('Executing cleanup recovery operation');
        // Implementation would cleanup resources
        return true;
      },
      timeout: 15000
    });
  }

  /**
   * Get task ID from context
   */
  private getTaskId(context: ValidationContext | TaskExecutionContext): string {
    return context.taskId;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get failure handler statistics
   */
  getStatistics(): {
    totalFailures: number;
    totalRetries: number;
    totalRecoveries: number;
    avgRecoveryTime: number;
    activeCircuitBreakers: number;
    failuresByCategory: Record<string, number>;
    failuresBySeverity: Record<string, number>;
  } {
    const failuresByCategory: Record<string, number> = {};
    const failuresBySeverity: Record<string, number> = {};

    this.metrics.failuresByCategory.forEach((count, category) => {
      failuresByCategory[category] = count;
    });

    this.metrics.failuresBySeverity.forEach((count, severity) => {
      failuresBySeverity[severity] = count;
    });

    return {
      ...this.metrics,
      activeCircuitBreakers: this.circuitBreakers.size,
      failuresByCategory,
      failuresBySeverity
    };
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(key: string): boolean {
    const circuitBreaker = this.circuitBreakers.get(key);
    if (circuitBreaker) {
      circuitBreaker.state = CircuitBreakerState.CLOSED;
      circuitBreaker.failures = 0;
      circuitBreaker.halfOpenAttempts = 0;
      circuitBreaker.windowFailures = 0;
      circuitBreaker.windowStart = new Date();
      this.logger.info(`Circuit breaker reset: ${key}`);
      return true;
    }
    return false;
  }

  /**
   * Add recovery operation
   */
  addRecoveryOperation(operation: RecoveryOperation): void {
    this.recoveryOperations.set(operation.id, operation);
    this.logger.info(`Added recovery operation: ${operation.id}`);
  }
}