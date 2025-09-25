/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Budget validation and constraint checking system
 * Provides comprehensive validation for budget operations and constraints
 *
 * @author Claude Code - Budget Core Infrastructure Agent
 * @version 1.0.0
 */
import { Logger } from '@google/gemini-cli/src/utils/logger.js';
/**
 * Budget constraint violation
 */
export class BudgetConstraintViolation extends Error {
    constraint;
    currentValue;
    limitValue;
    severity;
    constructor(message, constraint, currentValue, limitValue, severity) {
        super(message);
        this.constraint = constraint;
        this.currentValue = currentValue;
        this.limitValue = limitValue;
        this.severity = severity;
        this.name = 'BudgetConstraintViolation';
    }
}
/**
 * Daily limit validation rule
 */
class DailyLimitRule {
    id = 'daily-limit';
    description = 'Validates against daily spending limit';
    priority = 100;
    enabled = true;
    async validate(context) {
        const { settings, usageData, costCalculation } = context;
        if (!settings.dailyLimit || settings.dailyLimit <= 0) {
            return {
                ruleId: this.id,
                passed: true,
                severity: 'info',
                message: 'No daily limit configured',
            };
        }
        const currentCost = usageData.totalCost || 0;
        const proposedCost = costCalculation ? costCalculation.totalCost : 0;
        const projectedCost = currentCost + proposedCost;
        const usagePercentage = (projectedCost / settings.dailyLimit) * 100;
        if (projectedCost > settings.dailyLimit) {
            return {
                ruleId: this.id,
                passed: false,
                severity: 'critical',
                message: `Daily limit exceeded: $${projectedCost.toFixed(4)} > $${settings.dailyLimit}`,
                recommendations: [
                    'Reduce usage for today',
                    'Increase daily limit',
                    'Wait until tomorrow for budget reset',
                ],
                metadata: {
                    currentCost,
                    proposedCost,
                    projectedCost,
                    limit: settings.dailyLimit,
                    usagePercentage,
                },
            };
        }
        // Check warning thresholds
        const thresholds = settings.warningThresholds || [50, 75, 90];
        const highestThreshold = Math.max(...thresholds);
        if (usagePercentage >= highestThreshold) {
            return {
                ruleId: this.id,
                passed: true,
                severity: 'warning',
                message: `Approaching daily limit: ${usagePercentage.toFixed(1)}% of $${settings.dailyLimit}`,
                recommendations: [
                    'Monitor usage closely',
                    'Consider optimizing expensive operations',
                ],
                metadata: { usagePercentage, threshold: highestThreshold },
            };
        }
        return {
            ruleId: this.id,
            passed: true,
            severity: 'info',
            message: `Daily usage: ${usagePercentage.toFixed(1)}% of $${settings.dailyLimit}`,
            metadata: { usagePercentage },
        };
    }
}
/**
 * Weekly limit validation rule
 */
class WeeklyLimitRule {
    id = 'weekly-limit';
    description = 'Validates against weekly spending limit';
    priority = 90;
    enabled = true;
    async validate(context) {
        const { settings, usageData, costCalculation } = context;
        if (!settings.weeklyLimit || settings.weeklyLimit <= 0) {
            return {
                ruleId: this.id,
                passed: true,
                severity: 'info',
                message: 'No weekly limit configured',
            };
        }
        // Calculate weekly usage (simplified - should use actual weekly tracking)
        const dailyCost = usageData.totalCost || 0;
        const weeklyProjection = dailyCost * 7; // Simplified projection
        const usagePercentage = (weeklyProjection / settings.weeklyLimit) * 100;
        if (weeklyProjection > settings.weeklyLimit) {
            return {
                ruleId: this.id,
                passed: false,
                severity: 'error',
                message: `Weekly limit projection exceeded: $${weeklyProjection.toFixed(2)} > $${settings.weeklyLimit}`,
                recommendations: [
                    'Reduce daily usage',
                    'Increase weekly limit',
                    'Optimize expensive operations',
                ],
                metadata: {
                    weeklyProjection,
                    limit: settings.weeklyLimit,
                    usagePercentage,
                },
            };
        }
        return {
            ruleId: this.id,
            passed: true,
            severity: 'info',
            message: `Projected weekly usage: ${usagePercentage.toFixed(1)}% of $${settings.weeklyLimit}`,
            metadata: { usagePercentage },
        };
    }
}
/**
 * Token usage validation rule
 */
class TokenUsageRule {
    id = 'token-usage';
    description = 'Validates token usage patterns and efficiency';
    priority = 70;
    enabled = true;
    async validate(context) {
        const { usageData, costCalculation } = context;
        if (!costCalculation) {
            return {
                ruleId: this.id,
                passed: true,
                severity: 'info',
                message: 'No token usage to validate',
            };
        }
        const tokenUsage = usageData.tokenUsage;
        const efficiency = tokenUsage.totalTokens > 0
            ? (costCalculation.totalCost / tokenUsage.totalTokens) * 1000
            : 0;
        // Check for unusually high cost per token
        if (efficiency > 10) {
            // $10 per 1000 tokens seems high
            return {
                ruleId: this.id,
                passed: true,
                severity: 'warning',
                message: `High cost per token: $${efficiency.toFixed(4)} per 1K tokens`,
                recommendations: [
                    'Consider using a more cost-effective model',
                    'Optimize prompt length',
                    'Review token usage patterns',
                ],
                metadata: { efficiency, totalTokens: tokenUsage.totalTokens },
            };
        }
        return {
            ruleId: this.id,
            passed: true,
            severity: 'info',
            message: `Token efficiency: $${efficiency.toFixed(4)} per 1K tokens`,
            metadata: { efficiency },
        };
    }
}
/**
 * Request frequency validation rule
 */
class RequestFrequencyRule {
    id = 'request-frequency';
    description = 'Validates request frequency patterns';
    priority = 60;
    enabled = true;
    async validate(context) {
        const { usageData } = context;
        // Simple frequency check based on today's requests
        const requestCount = usageData.requestCount || 0;
        const hoursElapsed = this.getHoursElapsed(usageData.lastResetTime);
        const requestsPerHour = hoursElapsed > 0 ? requestCount / hoursElapsed : 0;
        // Flag unusually high request rates
        if (requestsPerHour > 100) {
            return {
                ruleId: this.id,
                passed: true,
                severity: 'warning',
                message: `High request frequency: ${requestsPerHour.toFixed(1)} requests/hour`,
                recommendations: [
                    'Consider batching requests',
                    'Implement request caching',
                    'Review automation scripts',
                ],
                metadata: { requestsPerHour, requestCount, hoursElapsed },
            };
        }
        return {
            ruleId: this.id,
            passed: true,
            severity: 'info',
            message: `Request frequency: ${requestsPerHour.toFixed(1)} requests/hour`,
            metadata: { requestsPerHour },
        };
    }
    getHoursElapsed(resetTime) {
        const reset = new Date(resetTime);
        const now = new Date();
        return (now.getTime() - reset.getTime()) / (1000 * 60 * 60);
    }
}
/**
 * Comprehensive budget validator with configurable rules
 */
export class BudgetValidator {
    logger;
    rules;
    /**
     * Create new budget validator
     */
    constructor() {
        this.logger = new Logger('BudgetValidator');
        this.rules = new Map();
        // Register default rules
        this.registerRule(new DailyLimitRule());
        this.registerRule(new WeeklyLimitRule());
        this.registerRule(new TokenUsageRule());
        this.registerRule(new RequestFrequencyRule());
        this.logger.info('Budget validator initialized', {
            rulesCount: this.rules.size,
        });
    }
    /**
     * Register a validation rule
     * @param rule - Validation rule to register
     */
    registerRule(rule) {
        this.rules.set(rule.id, rule);
        this.logger.debug('Registered validation rule', {
            ruleId: rule.id,
            description: rule.description,
        });
    }
    /**
     * Unregister a validation rule
     * @param ruleId - Rule ID to unregister
     */
    unregisterRule(ruleId) {
        if (this.rules.delete(ruleId)) {
            this.logger.debug('Unregistered validation rule', { ruleId });
        }
    }
    /**
     * Enable or disable a rule
     * @param ruleId - Rule ID
     * @param enabled - Whether to enable the rule
     */
    setRuleEnabled(ruleId, enabled) {
        const rule = this.rules.get(ruleId);
        if (rule) {
            rule.enabled = enabled;
            this.logger.debug('Updated rule status', { ruleId, enabled });
        }
    }
    /**
     * Validate budget constraints comprehensively
     * @param settings - Budget settings
     * @param usageData - Current usage data
     * @param costCalculation - Optional proposed cost calculation
     * @param context - Additional context
     * @returns Comprehensive validation result
     */
    async validateBudgetConstraints(settings, usageData, costCalculation, context) {
        const start = Date.now();
        const validationContext = {
            settings,
            usageData,
            costCalculation,
            context,
            timestamp: new Date(),
        };
        this.logger.debug('Starting budget validation', {
            rulesCount: this.rules.size,
            hasSettings: !!settings,
            hasUsageData: !!usageData,
            hasCostCalculation: !!costCalculation,
        });
        const ruleResults = [];
        const enabledRules = Array.from(this.rules.values())
            .filter((rule) => rule.enabled)
            .sort((a, b) => b.priority - a.priority);
        const ruleTimings = {};
        // Execute all validation rules
        for (const rule of enabledRules) {
            const ruleStart = Date.now();
            try {
                const result = await rule.validate(validationContext);
                ruleResults.push(result);
                ruleTimings[rule.id] = Date.now() - ruleStart;
                this.logger.debug('Rule validation completed', {
                    ruleId: rule.id,
                    passed: result.passed,
                    severity: result.severity,
                    duration: ruleTimings[rule.id],
                });
            }
            catch (error) {
                const errorResult = {
                    ruleId: rule.id,
                    passed: false,
                    severity: 'error',
                    message: `Rule validation failed: ${error.message}`,
                    metadata: { error: error.message },
                };
                ruleResults.push(errorResult);
                ruleTimings[rule.id] = Date.now() - ruleStart;
                this.logger.error('Rule validation failed', {
                    ruleId: rule.id,
                    error,
                });
            }
        }
        // Analyze results
        const summary = {
            totalRules: ruleResults.length,
            passedRules: ruleResults.filter((r) => r.passed).length,
            warningRules: ruleResults.filter((r) => r.severity === 'warning').length,
            failedRules: ruleResults.filter((r) => !r.passed || r.severity === 'critical').length,
        };
        // Determine overall status
        let status = 'passed';
        if (summary.failedRules > 0) {
            status = 'failed';
        }
        else if (summary.warningRules > 0) {
            status = 'warning';
        }
        // Calculate performance metrics
        const validationTime = Date.now() - start;
        const sortedTimings = Object.entries(ruleTimings).sort((a, b) => b[1] - a[1]);
        const slowestRule = sortedTimings.length > 0 ? sortedTimings[0][0] : undefined;
        const fastestRule = sortedTimings.length > 0
            ? sortedTimings[sortedTimings.length - 1][0]
            : undefined;
        // Create comprehensive result
        const result = {
            allowed: status !== 'failed',
            currentUsage: usageData.totalCost || 0,
            limit: settings.dailyLimit || 0,
            usagePercentage: settings.dailyLimit
                ? ((usageData.totalCost || 0) / settings.dailyLimit) * 100
                : 0,
            message: this.createSummaryMessage(status, summary),
            recommendations: this.extractRecommendations(ruleResults),
            ruleResults,
            status,
            summary,
            performance: {
                validationTime,
                slowestRule,
                fastestRule,
            },
        };
        this.logger.info('Budget validation completed', {
            status,
            totalRules: summary.totalRules,
            failedRules: summary.failedRules,
            validationTime,
        });
        return result;
    }
    /**
     * Quick validation for simple use cases
     * @param settings - Budget settings
     * @param usageData - Current usage data
     * @param proposedCost - Proposed additional cost
     * @returns Simple validation result
     */
    async quickValidate(settings, usageData, proposedCost = 0) {
        const currentUsage = usageData.totalCost || 0;
        const projectedUsage = currentUsage + proposedCost;
        // Check enforcement level
        if (settings.enforcement === BudgetEnforcementLevel.TRACKING_ONLY) {
            return {
                allowed: true,
                currentUsage,
                limit: settings.dailyLimit || 0,
                usagePercentage: settings.dailyLimit
                    ? (projectedUsage / settings.dailyLimit) * 100
                    : 0,
                message: 'Tracking only - no enforcement',
            };
        }
        // Check daily limit
        if (settings.dailyLimit && projectedUsage > settings.dailyLimit) {
            const allowed = settings.enforcement === BudgetEnforcementLevel.SOFT_LIMIT;
            return {
                allowed,
                currentUsage,
                limit: settings.dailyLimit,
                usagePercentage: (projectedUsage / settings.dailyLimit) * 100,
                message: allowed
                    ? `Soft limit exceeded: $${projectedUsage.toFixed(4)} > $${settings.dailyLimit}`
                    : `Daily limit exceeded: $${projectedUsage.toFixed(4)} > $${settings.dailyLimit}`,
                recommendations: [
                    'Reduce usage for today',
                    'Increase daily limit if needed',
                ],
            };
        }
        // Check warning thresholds
        const thresholds = settings.warningThresholds || [50, 75, 90];
        const usagePercentage = settings.dailyLimit
            ? (projectedUsage / settings.dailyLimit) * 100
            : 0;
        const warningThreshold = thresholds.find((threshold) => usagePercentage >= threshold);
        return {
            allowed: true,
            currentUsage,
            limit: settings.dailyLimit || 0,
            usagePercentage,
            warningLevel: warningThreshold,
            message: warningThreshold
                ? `Warning: ${usagePercentage.toFixed(1)}% of daily limit used`
                : `Usage: ${usagePercentage.toFixed(1)}% of daily limit`,
        };
    }
    /**
     * Get available validation rules
     * @returns Array of validation rules
     */
    getRules() {
        return Array.from(this.rules.values());
    }
    /**
     * Create summary message based on validation status
     * @param status - Overall validation status
     * @param summary - Validation summary
     * @returns Summary message
     */
    createSummaryMessage(status, summary) {
        switch (status) {
            case 'failed':
                return `Budget validation failed: ${summary.failedRules} rule(s) failed`;
            case 'warning':
                return `Budget validation passed with warnings: ${summary.warningRules} warning(s)`;
            case 'passed':
                return `Budget validation passed: ${summary.passedRules}/${summary.totalRules} rules passed`;
            default:
                return `Budget validation status unknown: ${status}`;
        }
    }
    /**
     * Extract recommendations from rule results
     * @param ruleResults - Rule validation results
     * @returns Array of unique recommendations
     */
    extractRecommendations(ruleResults) {
        const recommendations = new Set();
        for (const result of ruleResults) {
            if (result.recommendations) {
                result.recommendations.forEach((rec) => recommendations.add(rec));
            }
        }
        return Array.from(recommendations);
    }
}
/**
 * Factory function to create budget validator
 * @returns New budget validator instance
 */
export function createBudgetValidator() {
    return new BudgetValidator();
}
//# sourceMappingURL=BudgetValidator.js.map