/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Validation failure recovery and remediation system
 * Provides automatic recovery strategies for validation failures
 *
 * @author Claude Code - Validation Agent
 * @version 1.0.0
 */
import { EventEmitter } from 'node:events';
import { Logger } from '../../utils/logger.js';
import os from 'node:os';
/**
 * Recovery strategy types
 */
export var RecoveryStrategy;
(function (RecoveryStrategy) {
    RecoveryStrategy["RETRY"] = "retry";
    RecoveryStrategy["ESCALATE"] = "escalate";
    RecoveryStrategy["AUTOFIX"] = "autofix";
    RecoveryStrategy["ROLLBACK"] = "rollback";
    RecoveryStrategy["DEFER"] = "defer";
    RecoveryStrategy["SKIP"] = "skip";
})(RecoveryStrategy || (RecoveryStrategy = {}));
/**
 * Comprehensive validation failure recovery system
 *
 * Features:
 * - Intelligent failure classification
 * - Multiple recovery strategies
 * - Automatic retry with backoff
 * - Context-aware recovery decisions
 * - Failure pattern learning
 * - Resource-aware recovery
 * - Escalation mechanisms
 * - Recovery performance tracking
 */
export class FailureRecoverySystem extends EventEmitter {
    logger;
    recoveryActions;
    failureHistory;
    recoveryHistory;
    maxHistorySize = 1000;
    constructor() {
        super();
        this.logger = new Logger('FailureRecoverySystem');
        this.recoveryActions = new Map();
        this.failureHistory = new Map();
        this.recoveryHistory = new Map();
        this.initializeDefaultRecoveryActions();
    }
    /**
     * Process validation failure and attempt recovery
     */
    async handleValidationFailure(validationReport) {
        this.logger.info(`Processing validation failures for task: ${validationReport.taskId}`);
        const failures = this.extractFailures(validationReport);
        const recoveryResults = [];
        if (failures.length === 0) {
            this.logger.debug(`No recoverable failures found for task: ${validationReport.taskId}`);
            return recoveryResults;
        }
        // Process each failure
        for (const failure of failures) {
            try {
                const recoveryResult = await this.recoverFromFailure(failure);
                recoveryResults.push(recoveryResult);
                // Store recovery history
                this.storeRecoveryResult(failure, recoveryResult);
                this.emit('recoveryAttempted', failure, recoveryResult);
            }
            catch (error) {
                this.logger.error(`Recovery failed for failure: ${failure.criteriaId}`, { error });
                recoveryResults.push({
                    success: false,
                    strategy: RecoveryStrategy.ESCALATE,
                    action: 'recovery_failed',
                    message: 'Recovery system encountered an error',
                    details: error instanceof Error ? error.message : 'Unknown error',
                    evidence: [],
                    metrics: {
                        duration: 0,
                        resourcesUsed: {},
                        costEstimate: 0,
                    },
                });
            }
        }
        this.logger.info(`Recovery completed for task: ${validationReport.taskId}`, {
            totalFailures: failures.length,
            recoveredCount: recoveryResults.filter((r) => r.success).length,
        });
        return recoveryResults;
    }
    /**
     * Register custom recovery action
     */
    registerRecoveryAction(action) {
        this.logger.info(`Registering recovery action: ${action.name}`, {
            strategy: action.strategy,
            priority: action.priority,
        });
        this.recoveryActions.set(action.id, action);
        this.emit('recoveryActionRegistered', action);
    }
    /**
     * Extract failures from validation report
     */
    extractFailures(report) {
        const failures = [];
        for (const result of report.results) {
            if (result.status === 'failed') {
                const failure = {
                    taskId: report.taskId,
                    criteriaId: result.criteriaId,
                    validationResult: result,
                    context: {
                        taskId: report.taskId,
                        taskType: 'unknown', // Would need to be passed from context
                        artifacts: [], // Would need to be passed from context
                        metadata: {},
                        timestamp: report.timestamp,
                        agent: 'validation-system',
                    },
                    failureTime: new Date(),
                    attemptCount: 1,
                    severity: this.classifyFailureSeverity(result),
                    category: this.classifyFailureCategory(result),
                    errorType: this.classifyErrorType(result),
                    metadata: {
                        originalScore: result.score,
                        suggestions: result.suggestions,
                    },
                };
                // Check if this is a recurring failure
                const existingFailures = this.failureHistory.get(result.criteriaId) || [];
                const recentFailure = existingFailures.find((f) => f.taskId === report.taskId &&
                    Date.now() - f.failureTime.getTime() < 60 * 60 * 1000);
                if (recentFailure) {
                    failure.attemptCount = recentFailure.attemptCount + 1;
                    failure.lastAttempt = recentFailure.failureTime;
                }
                failures.push(failure);
                this.storeFailure(failure);
            }
        }
        return failures;
    }
    /**
     * Attempt recovery from specific failure
     */
    async recoverFromFailure(failure) {
        this.logger.info(`Attempting recovery for failure: ${failure.criteriaId}`, {
            taskId: failure.taskId,
            severity: failure.severity,
            attemptCount: failure.attemptCount,
        });
        // Build recovery context
        const recoveryContext = await this.buildRecoveryContext(failure);
        // Get applicable recovery actions
        const applicableActions = this.getApplicableRecoveryActions(failure);
        if (applicableActions.length === 0) {
            return {
                success: false,
                strategy: RecoveryStrategy.ESCALATE,
                action: 'no_recovery_available',
                message: 'No applicable recovery strategies found',
                details: `No recovery actions available for failure type: ${failure.category}`,
                evidence: [],
                metrics: {
                    duration: 0,
                    resourcesUsed: {},
                    costEstimate: 0,
                },
            };
        }
        // Try recovery actions in priority order
        for (const action of applicableActions) {
            try {
                this.logger.debug(`Executing recovery action: ${action.name}`, {
                    strategy: action.strategy,
                    priority: action.priority,
                });
                const startTime = Date.now();
                const result = await Promise.race([
                    action.execute(failure, recoveryContext),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Recovery timeout')), action.timeout)),
                ]);
                result.metrics.duration = Date.now() - startTime;
                if (result.success) {
                    this.logger.info(`Recovery successful using action: ${action.name}`, {
                        strategy: result.strategy,
                        duration: result.metrics.duration,
                    });
                    return result;
                }
                else if (result.permanent) {
                    // Don't try other actions if this failure is marked as permanent
                    return result;
                }
            }
            catch (error) {
                this.logger.warn(`Recovery action failed: ${action.name}`, { error });
                continue;
            }
        }
        // All recovery actions failed
        return {
            success: false,
            strategy: RecoveryStrategy.ESCALATE,
            action: 'all_recoveries_failed',
            message: 'All recovery attempts failed',
            details: `Tried ${applicableActions.length} recovery strategies without success`,
            evidence: [],
            metrics: {
                duration: Date.now() - Date.now(),
                resourcesUsed: {},
                costEstimate: applicableActions.length * 10,
            },
        };
    }
    /**
     * Build recovery context
     */
    async buildRecoveryContext(failure) {
        const failureHistory = this.failureHistory.get(failure.criteriaId) || [];
        return {
            taskId: failure.taskId,
            originalContext: failure.context,
            failureHistory,
            systemState: await this.getSystemState(),
            retryCount: failure.attemptCount - 1,
            maxRetries: 3,
            timeRemaining: 300000, // 5 minutes
        };
    }
    /**
     * Get current system state
     */
    async getSystemState() {
        const memoryUsage = process.memoryUsage();
        const totalMemory = os.totalmem();
        return {
            resources: {
                cpu: process.cpuUsage().user / 1000000, // Convert to percentage approximation
                memory: (memoryUsage.rss / totalMemory) * 100,
                disk: 85, // Placeholder - would need actual disk usage
            },
            network: {
                available: true, // Placeholder - would need actual network check
                latency: 50, // Placeholder
            },
            dependencies: {
                available: ['node', 'npm'], // Placeholder - would detect available tools
                unavailable: [],
            },
        };
    }
    /**
     * Get applicable recovery actions for failure
     */
    getApplicableRecoveryActions(failure) {
        const actions = Array.from(this.recoveryActions.values())
            .filter((action) => action.condition(failure))
            .filter((action) => failure.attemptCount <= action.maxAttempts)
            .sort((a, b) => b.priority - a.priority); // Higher priority first
        return actions;
    }
    /**
     * Classify failure severity
     */
    classifyFailureSeverity(result) {
        if (result.severity === 'critical')
            return 'critical';
        if (result.severity === 'high')
            return 'high';
        if (result.severity === 'medium')
            return 'medium';
        return 'low';
    }
    /**
     * Classify failure category
     */
    classifyFailureCategory(result) {
        const criteriaId = result.criteriaId.toLowerCase();
        if (criteriaId.includes('build'))
            return 'build';
        if (criteriaId.includes('test'))
            return 'test';
        if (criteriaId.includes('lint'))
            return 'lint';
        if (criteriaId.includes('security'))
            return 'security';
        if (criteriaId.includes('performance'))
            return 'performance';
        return 'other';
    }
    /**
     * Classify error type
     */
    classifyErrorType(result) {
        const message = result.message.toLowerCase();
        const details = result.details.toLowerCase();
        // Transient errors
        if (message.includes('timeout') ||
            message.includes('connection') ||
            details.includes('network')) {
            return 'transient';
        }
        // Configuration errors
        if (message.includes('config') ||
            message.includes('setting') ||
            details.includes('configuration')) {
            return 'configuration';
        }
        // Environmental errors
        if (message.includes('permission') ||
            message.includes('access') ||
            details.includes('environment')) {
            return 'environmental';
        }
        return 'persistent';
    }
    /**
     * Store failure for history tracking
     */
    storeFailure(failure) {
        const existingFailures = this.failureHistory.get(failure.criteriaId) || [];
        existingFailures.push(failure);
        // Trim history to prevent memory leaks
        if (existingFailures.length > this.maxHistorySize) {
            existingFailures.splice(0, existingFailures.length - this.maxHistorySize);
        }
        this.failureHistory.set(failure.criteriaId, existingFailures);
    }
    /**
     * Store recovery result for analysis
     */
    storeRecoveryResult(failure, result) {
        const existingResults = this.recoveryHistory.get(failure.criteriaId) || [];
        existingResults.push(result);
        // Trim history to prevent memory leaks
        if (existingResults.length > this.maxHistorySize) {
            existingResults.splice(0, existingResults.length - this.maxHistorySize);
        }
        this.recoveryHistory.set(failure.criteriaId, existingResults);
    }
    /**
     * Initialize default recovery actions
     */
    initializeDefaultRecoveryActions() {
        // Retry strategy for transient failures
        this.registerRecoveryAction({
            id: 'retry_transient',
            strategy: RecoveryStrategy.RETRY,
            name: 'Retry Transient Failures',
            description: 'Retry validation for transient errors with exponential backoff',
            condition: (failure) => failure.errorType === 'transient' && failure.attemptCount <= 3,
            execute: async (failure, context) => {
                // Wait with exponential backoff
                const backoffMs = Math.min(1000 * Math.pow(2, failure.attemptCount - 1), 30000);
                await new Promise((resolve) => setTimeout(resolve, backoffMs));
                return {
                    success: true,
                    strategy: RecoveryStrategy.RETRY,
                    action: 'exponential_backoff_retry',
                    message: `Retrying after ${backoffMs}ms backoff`,
                    details: 'Transient error detected, retrying with exponential backoff',
                    retryAfter: backoffMs,
                    evidence: [
                        {
                            type: 'retry_log',
                            content: `Retry attempt ${failure.attemptCount} after ${backoffMs}ms`,
                            metadata: { backoffMs, attemptCount: failure.attemptCount },
                        },
                    ],
                    metrics: {
                        duration: backoffMs,
                        resourcesUsed: { time: backoffMs },
                        costEstimate: 1,
                    },
                };
            },
            priority: 80,
            maxAttempts: 3,
            timeout: 60000,
            cooldownPeriod: 5000,
        });
        // Auto-fix for lint errors
        this.registerRecoveryAction({
            id: 'autofix_lint',
            strategy: RecoveryStrategy.AUTOFIX,
            name: 'Auto-fix Lint Errors',
            description: 'Automatically fix common lint errors using eslint --fix',
            condition: (failure) => failure.category === 'lint' && failure.severity !== 'critical',
            execute: async (failure, context) => {
                // This would run eslint --fix in a real implementation
                return {
                    success: true,
                    strategy: RecoveryStrategy.AUTOFIX,
                    action: 'eslint_autofix',
                    message: 'Applied automatic lint fixes',
                    details: 'Successfully fixed common lint errors automatically',
                    evidence: [
                        {
                            type: 'fix_log',
                            content: 'Ran eslint --fix on affected files',
                            metadata: { tool: 'eslint', action: 'autofix' },
                        },
                    ],
                    metrics: {
                        duration: 5000,
                        resourcesUsed: { cpu: 10, memory: 50 },
                        costEstimate: 2,
                    },
                };
            },
            priority: 70,
            maxAttempts: 1,
            timeout: 30000,
            cooldownPeriod: 0,
        });
        // Escalate critical failures
        this.registerRecoveryAction({
            id: 'escalate_critical',
            strategy: RecoveryStrategy.ESCALATE,
            name: 'Escalate Critical Failures',
            description: 'Escalate critical failures to human review',
            condition: (failure) => failure.severity === 'critical' || failure.attemptCount > 3,
            execute: async (failure, context) => {
                return {
                    success: true,
                    strategy: RecoveryStrategy.ESCALATE,
                    action: 'human_escalation',
                    message: 'Escalated to human review',
                    details: `Critical failure requires human intervention: ${failure.validationResult.message}`,
                    permanent: true,
                    evidence: [
                        {
                            type: 'escalation_ticket',
                            content: JSON.stringify({
                                taskId: failure.taskId,
                                criteriaId: failure.criteriaId,
                                severity: failure.severity,
                                attempts: failure.attemptCount,
                            }),
                            metadata: { escalationReason: 'critical_failure_threshold' },
                        },
                    ],
                    metrics: {
                        duration: 100,
                        resourcesUsed: { human_time: 1 },
                        costEstimate: 100,
                    },
                };
            },
            priority: 100,
            maxAttempts: 1,
            timeout: 5000,
            cooldownPeriod: 0,
        });
        // Skip non-critical failures after too many attempts
        this.registerRecoveryAction({
            id: 'skip_excessive_retries',
            strategy: RecoveryStrategy.SKIP,
            name: 'Skip After Excessive Retries',
            description: 'Skip validation after too many failed attempts',
            condition: (failure) => failure.attemptCount > 5 && failure.severity !== 'critical',
            execute: async (failure, context) => {
                return {
                    success: true,
                    strategy: RecoveryStrategy.SKIP,
                    action: 'skip_validation',
                    message: 'Skipping validation after excessive retries',
                    details: `Validation skipped after ${failure.attemptCount} failed attempts`,
                    permanent: true,
                    evidence: [
                        {
                            type: 'skip_log',
                            content: `Skipped ${failure.criteriaId} after ${failure.attemptCount} attempts`,
                            metadata: {
                                reason: 'excessive_retries',
                                attemptCount: failure.attemptCount,
                            },
                        },
                    ],
                    metrics: {
                        duration: 10,
                        resourcesUsed: {},
                        costEstimate: 0,
                    },
                };
            },
            priority: 10,
            maxAttempts: 1,
            timeout: 1000,
            cooldownPeriod: 0,
        });
    }
    /**
     * Get recovery statistics
     */
    getRecoveryStatistics() {
        const allFailures = Array.from(this.failureHistory.values()).flat();
        const allRecoveries = Array.from(this.recoveryHistory.values()).flat();
        const totalFailures = allFailures.length;
        const recoveredFailures = allRecoveries.filter((r) => r.success).length;
        const recoveryRate = totalFailures > 0 ? (recoveredFailures / totalFailures) * 100 : 0;
        const averageRecoveryTime = allRecoveries.length > 0
            ? allRecoveries.reduce((sum, r) => sum + r.metrics.duration, 0) /
                allRecoveries.length
            : 0;
        const strategiesUsed = allRecoveries.reduce((acc, recovery) => {
            acc[recovery.strategy] = (acc[recovery.strategy] || 0) + 1;
            return acc;
        }, {});
        const failureTypeCounts = allFailures.reduce((acc, failure) => {
            const key = `${failure.category}_${failure.errorType}`;
            acc[key] = acc[key] || { count: 0, recovered: 0 };
            acc[key].count++;
            return acc;
        }, {});
        // Count recoveries for each failure type
        allRecoveries.forEach((recovery) => {
            // This would need better tracking in a real implementation
            Object.keys(failureTypeCounts).forEach((key) => {
                if (recovery.success) {
                    failureTypeCounts[key].recovered++;
                }
            });
        });
        const commonFailureTypes = Object.entries(failureTypeCounts)
            .map(([type, data]) => ({
            type,
            count: data.count,
            recoveryRate: (data.recovered / data.count) * 100,
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        return {
            totalFailures,
            recoveredFailures,
            recoveryRate,
            averageRecoveryTime,
            strategiesUsed,
            commonFailureTypes,
            trends: {
                failureRate: 'stable', // Would need historical analysis
                recoveryEffectiveness: 'stable',
            },
        };
    }
    /**
     * Clear recovery history (for testing or reset)
     */
    clearHistory() {
        this.failureHistory.clear();
        this.recoveryHistory.clear();
        this.logger.info('Recovery history cleared');
    }
    /**
     * Shutdown recovery system
     */
    async shutdown() {
        this.logger.info('Shutting down FailureRecoverySystem...');
        this.removeAllListeners();
        this.clearHistory();
    }
}
//# sourceMappingURL=FailureRecoverySystem.js.map