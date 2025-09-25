/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../logger/Logger.js';
import { ValidationSeverity, ValidationStatus, ValidationCategory } from './ValidationFramework.js';
/**
 * Failure handling strategy types
 */
export var FailureHandlingStrategy;
(function (FailureHandlingStrategy) {
    FailureHandlingStrategy["IMMEDIATE_RETRY"] = "immediate-retry";
    FailureHandlingStrategy["EXPONENTIAL_BACKOFF"] = "exponential-backoff";
    FailureHandlingStrategy["LINEAR_BACKOFF"] = "linear-backoff";
    FailureHandlingStrategy["CIRCUIT_BREAKER"] = "circuit-breaker";
    FailureHandlingStrategy["FALLBACK"] = "fallback";
    FailureHandlingStrategy["ESCALATION"] = "escalation";
    FailureHandlingStrategy["IGNORE"] = "ignore";
})(FailureHandlingStrategy || (FailureHandlingStrategy = {}));
/**
 * Circuit breaker state
 */
var CircuitBreakerState;
(function (CircuitBreakerState) {
    CircuitBreakerState["CLOSED"] = "closed";
    CircuitBreakerState["OPEN"] = "open";
    CircuitBreakerState["HALF_OPEN"] = "half-open";
})(CircuitBreakerState || (CircuitBreakerState = {}));
/**
 * Validation failure handler with comprehensive retry and recovery mechanisms
 */
export class ValidationFailureHandler extends EventEmitter {
    logger;
    config;
    circuitBreakers = new Map();
    failureRecords = new Map();
    recoveryOperations = new Map();
    metrics = {
        totalFailures: 0,
        totalRetries: 0,
        totalRecoveries: 0,
        avgRecoveryTime: 0,
        failuresByCategory: new Map(),
        failuresBySeverity: new Map()
    };
    constructor(config = {}) {
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
    async handleValidationFailure(error, context, originalOperation) {
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
            const result = await this.executeHandlingStrategy(strategy, error, context, originalOperation, failureRecord);
            // Mark as resolved
            failureRecord.resolved = true;
            failureRecord.recoveryTime = Date.now() - failureRecord.timestamp.getTime();
            this.emit('failureResolved', failureRecord);
            this.logger.info(`Validation failure resolved: ${failureId}`, {
                strategy,
                recoveryTime: failureRecord.recoveryTime
            });
            return result;
        }
        catch (handlingError) {
            this.logger.error(`Failed to handle validation failure: ${failureId}`, {
                originalError: error.message,
                handlingError: handlingError.message
            });
            failureRecord.metadata.handlingError = handlingError.message;
            this.emit('failureUnresolved', failureRecord);
            throw handlingError;
        }
    }
    /**
     * Execute handling strategy
     */
    async executeHandlingStrategy(strategy, error, context, originalOperation, failureRecord) {
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
    async executeImmediateRetry(operation, failureRecord) {
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
            }
            catch (error) {
                failureRecord.attempts = attempt;
                if (attempt === maxAttempts) {
                    throw error;
                }
                if (!this.isRetryable(error)) {
                    throw error;
                }
                this.emit('retryAttempt', {
                    failureId: failureRecord.id,
                    attempt,
                    error: error.message
                });
            }
        }
        throw new Error('Max retry attempts exceeded');
    }
    /**
     * Execute exponential backoff retry strategy
     */
    async executeExponentialBackoff(operation, failureRecord) {
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
            }
            catch (error) {
                failureRecord.attempts = attempt;
                if (attempt === maxAttempts) {
                    throw error;
                }
                if (!this.isRetryable(error)) {
                    throw error;
                }
                // Calculate next delay
                const actualDelay = jitter ? delay + Math.random() * delay * 0.1 : delay;
                this.emit('retryAttempt', {
                    failureId: failureRecord.id,
                    attempt,
                    error: error.message,
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
    async executeLinearBackoff(operation, failureRecord) {
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
            }
            catch (error) {
                failureRecord.attempts = attempt;
                if (attempt === maxAttempts) {
                    throw error;
                }
                if (!this.isRetryable(error)) {
                    throw error;
                }
                const delay = initialDelay * attempt;
                this.emit('retryAttempt', {
                    failureId: failureRecord.id,
                    attempt,
                    error: error.message,
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
    async executeCircuitBreaker(operation, context, failureRecord) {
        const circuitKey = this.getCircuitBreakerKey(context);
        const circuitBreaker = this.getOrCreateCircuitBreaker(circuitKey);
        // Check circuit breaker state
        if (circuitBreaker.state === CircuitBreakerState.OPEN) {
            if (Date.now() - circuitBreaker.lastFailureTime.getTime() < this.config.circuitBreakerConfig.recoveryTimeout) {
                throw new Error('Circuit breaker is OPEN - operation blocked');
            }
            else {
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
        }
        catch (error) {
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
            }
            else if (circuitBreaker.state === CircuitBreakerState.HALF_OPEN) {
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
    async executeFallback(error, context, originalOperation, failureRecord) {
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
                        return this.createSkipResult();
                    case 'default':
                        return this.createDefaultResult(strategy.config);
                    case 'alternative':
                        return await this.executeAlternative(context, strategy.config);
                }
            }
            catch (fallbackError) {
                this.logger.warn(`Fallback strategy ${strategy.type} failed`, {
                    error: fallbackError.message
                });
            }
        }
        throw error; // All fallback strategies failed
    }
    /**
     * Execute escalation strategy
     */
    async executeEscalation(error, context, originalOperation, failureRecord) {
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
        }
        catch (escalationError) {
            // If escalation doesn't resolve, continue with exponential backoff
            return await this.executeExponentialBackoff(originalOperation, failureRecord);
        }
    }
    /**
     * Determine appropriate handling strategy
     */
    determineHandlingStrategy(error, context) {
        // Check severity-based strategy
        if ('severity' in error && error.severity) {
            const severityStrategy = this.config.severityStrategies[error.severity];
            if (severityStrategy) {
                return severityStrategy;
            }
        }
        // Check category-based strategy
        if ('category' in error && error.category) {
            const categoryStrategy = this.config.categoryStrategies[error.category];
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
    isRetryable(error) {
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
    recordFailure(failureId, error, context) {
        const record = {
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
    updateMetrics(error, context) {
        if (!this.config.monitoring.trackMetrics) {
            return;
        }
        this.metrics.totalFailures++;
        // Update category metrics
        if ('category' in error && error.category) {
            const category = error.category;
            this.metrics.failuresByCategory.set(category, (this.metrics.failuresByCategory.get(category) || 0) + 1);
        }
        // Update severity metrics
        if ('severity' in error && error.severity) {
            const severity = error.severity;
            this.metrics.failuresBySeverity.set(severity, (this.metrics.failuresBySeverity.get(severity) || 0) + 1);
        }
    }
    /**
     * Get or create circuit breaker
     */
    getOrCreateCircuitBreaker(key) {
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
        return this.circuitBreakers.get(key);
    }
    /**
     * Get circuit breaker key from context
     */
    getCircuitBreakerKey(context) {
        const taskId = this.getTaskId(context);
        return `circuit-${taskId}`;
    }
    /**
     * Update circuit breaker monitoring window
     */
    updateCircuitBreakerWindow(circuitBreaker) {
        const now = Date.now();
        const windowDuration = this.config.circuitBreakerConfig.monitoringWindow;
        if (now - circuitBreaker.windowStart.getTime() > windowDuration) {
            // Reset window
            circuitBreaker.windowStart = new Date();
            circuitBreaker.windowFailures = 1;
        }
        else {
            circuitBreaker.windowFailures++;
        }
    }
    /**
     * Check if fallback should be used
     */
    shouldUseFallback(error, context) {
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
    createSkipResult() {
        // This is a placeholder - actual implementation would depend on result type
        return {
            status: ValidationStatus.SKIPPED,
            message: 'Validation skipped due to fallback strategy'
        };
    }
    /**
     * Create default result for fallback
     */
    createDefaultResult(config) {
        const defaultValue = config?.defaultValue || 'passed';
        return {
            status: ValidationStatus.PASSED,
            message: `Default result applied: ${defaultValue}`
        };
    }
    /**
     * Execute alternative operation for fallback
     */
    async executeAlternative(context, config) {
        // This would execute an alternative validation method
        throw new Error('Alternative execution not implemented');
    }
    /**
     * Execute escalation actions
     */
    async executeEscalationActions(level, error, context, failureRecord) {
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
            }
            catch (actionError) {
                this.logger.error(`Escalation action ${action} failed`, {
                    error: actionError.message
                });
            }
        }
    }
    /**
     * Send escalation notifications
     */
    async sendNotifications(recipients, error, context, failureRecord) {
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
    registerDefaultRecoveryOperations() {
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
    getTaskId(context) {
        return context.taskId;
    }
    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Get failure handler statistics
     */
    getStatistics() {
        const failuresByCategory = {};
        const failuresBySeverity = {};
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
    resetCircuitBreaker(key) {
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
    addRecoveryOperation(operation) {
        this.recoveryOperations.set(operation.id, operation);
        this.logger.info(`Added recovery operation: ${operation.id}`);
    }
}
//# sourceMappingURL=ValidationFailureHandler.js.map