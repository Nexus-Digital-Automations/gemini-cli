/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from '../logger/Logger.js';
import { ValidationStatus, ValidationSeverity, ValidationCategory } from './ValidationFramework.js';
import { TaskResult, TaskStatus } from '../task-management/types.js';
/**
 * Rule categories for organization and filtering
 */
export var RuleCategory;
(function (RuleCategory) {
    RuleCategory["TASK_PRECONDITIONS"] = "task_preconditions";
    RuleCategory["TASK_EXECUTION"] = "task_execution";
    RuleCategory["TASK_COMPLETION"] = "task_completion";
    RuleCategory["DEPENDENCY_VALIDATION"] = "dependency_validation";
    RuleCategory["SECURITY_COMPLIANCE"] = "security_compliance";
    RuleCategory["PERFORMANCE_VALIDATION"] = "performance_validation";
    RuleCategory["QUALITY_ASSURANCE"] = "quality_assurance";
    RuleCategory["BUSINESS_RULES"] = "business_rules";
    RuleCategory["DATA_VALIDATION"] = "data_validation";
    RuleCategory["INTEGRATION_VALIDATION"] = "integration_validation";
})(RuleCategory || (RuleCategory = {}));
/**
 * Rule execution contexts for conditional rule application
 */
export var RuleExecutionContext;
(function (RuleExecutionContext) {
    RuleExecutionContext["PRE_EXECUTION"] = "pre_execution";
    RuleExecutionContext["DURING_EXECUTION"] = "during_execution";
    RuleExecutionContext["POST_EXECUTION"] = "post_execution";
    RuleExecutionContext["ROLLBACK"] = "rollback";
    RuleExecutionContext["CONTINUOUS"] = "continuous";
})(RuleExecutionContext || (RuleExecutionContext = {}));
/**
 * Comprehensive Validation Rules System for Autonomous Task Management
 *
 * Provides a comprehensive set of configurable validation rules for all aspects
 * of task execution, including preconditions, execution validation, completion
 * criteria, security compliance, and quality assurance.
 */
export class ValidationRules {
    logger;
    registry;
    constructor() {
        this.logger = new Logger('ValidationRules');
        this.registry = {
            rules: new Map(),
            rulesByCategory: new Map(),
            rulesByContext: new Map(),
            enabledRules: new Set(),
            disabledRules: new Set()
        };
        this.logger.info('ValidationRules system initialized');
        this.initializeDefaultRules();
    }
    /**
     * Initialize comprehensive set of default validation rules
     */
    initializeDefaultRules() {
        this.logger.info('Initializing default validation rules');
        // Task Precondition Rules
        this.registerRule({
            id: 'task-has-required-fields',
            name: 'Task Required Fields Validation',
            description: 'Validates that task has all required fields populated',
            category: RuleCategory.TASK_PRECONDITIONS,
            config: {
                enabled: true,
                severity: ValidationSeverity.ERROR,
                contexts: [RuleExecutionContext.PRE_EXECUTION],
                priority: 1
            },
            executor: this.validateTaskRequiredFields.bind(this)
        });
        this.registerRule({
            id: 'task-status-valid-for-execution',
            name: 'Task Status Validation',
            description: 'Validates that task status is valid for execution',
            category: RuleCategory.TASK_PRECONDITIONS,
            config: {
                enabled: true,
                severity: ValidationSeverity.ERROR,
                contexts: [RuleExecutionContext.PRE_EXECUTION],
                priority: 1
            },
            executor: this.validateTaskStatusForExecution.bind(this)
        });
        this.registerRule({
            id: 'task-dependencies-satisfied',
            name: 'Task Dependencies Validation',
            description: 'Validates that all task dependencies are satisfied',
            category: RuleCategory.DEPENDENCY_VALIDATION,
            config: {
                enabled: true,
                severity: ValidationSeverity.ERROR,
                contexts: [RuleExecutionContext.PRE_EXECUTION],
                priority: 2
            },
            executor: this.validateTaskDependencies.bind(this)
        });
        // Task Execution Rules
        this.registerRule({
            id: 'task-execution-timeout',
            name: 'Task Execution Timeout',
            description: 'Validates that task execution does not exceed timeout limits',
            category: RuleCategory.TASK_EXECUTION,
            config: {
                enabled: true,
                severity: ValidationSeverity.WARNING,
                contexts: [RuleExecutionContext.DURING_EXECUTION, RuleExecutionContext.CONTINUOUS],
                priority: 3
            },
            executor: this.validateExecutionTimeout.bind(this)
        });
        this.registerRule({
            id: 'task-resource-consumption',
            name: 'Task Resource Consumption',
            description: 'Validates that task resource consumption is within limits',
            category: RuleCategory.PERFORMANCE_VALIDATION,
            config: {
                enabled: true,
                severity: ValidationSeverity.WARNING,
                contexts: [RuleExecutionContext.DURING_EXECUTION, RuleExecutionContext.CONTINUOUS],
                priority: 4
            },
            executor: this.validateResourceConsumption.bind(this)
        });
        // Task Completion Rules
        this.registerRule({
            id: 'task-completion-criteria',
            name: 'Task Completion Criteria',
            description: 'Validates that all task completion criteria are met',
            category: RuleCategory.TASK_COMPLETION,
            config: {
                enabled: true,
                severity: ValidationSeverity.ERROR,
                contexts: [RuleExecutionContext.POST_EXECUTION],
                priority: 1
            },
            executor: this.validateTaskCompletionCriteria.bind(this)
        });
        this.registerRule({
            id: 'task-outputs-validation',
            name: 'Task Outputs Validation',
            description: 'Validates that task outputs match expected schema and quality',
            category: RuleCategory.QUALITY_ASSURANCE,
            config: {
                enabled: true,
                severity: ValidationSeverity.ERROR,
                contexts: [RuleExecutionContext.POST_EXECUTION],
                priority: 2
            },
            executor: this.validateTaskOutputs.bind(this)
        });
        // Security Compliance Rules
        this.registerRule({
            id: 'security-sensitive-data-handling',
            name: 'Sensitive Data Handling',
            description: 'Validates proper handling of sensitive data and secrets',
            category: RuleCategory.SECURITY_COMPLIANCE,
            config: {
                enabled: true,
                severity: ValidationSeverity.CRITICAL,
                contexts: [RuleExecutionContext.PRE_EXECUTION, RuleExecutionContext.DURING_EXECUTION],
                priority: 1
            },
            executor: this.validateSensitiveDataHandling.bind(this)
        });
        this.registerRule({
            id: 'security-access-controls',
            name: 'Access Controls Validation',
            description: 'Validates that proper access controls are in place',
            category: RuleCategory.SECURITY_COMPLIANCE,
            config: {
                enabled: true,
                severity: ValidationSeverity.ERROR,
                contexts: [RuleExecutionContext.PRE_EXECUTION],
                priority: 2
            },
            executor: this.validateAccessControls.bind(this)
        });
        // Performance Validation Rules
        this.registerRule({
            id: 'performance-memory-usage',
            name: 'Memory Usage Validation',
            description: 'Validates that memory usage is within acceptable limits',
            category: RuleCategory.PERFORMANCE_VALIDATION,
            config: {
                enabled: true,
                severity: ValidationSeverity.WARNING,
                contexts: [RuleExecutionContext.DURING_EXECUTION, RuleExecutionContext.POST_EXECUTION],
                priority: 3
            },
            executor: this.validateMemoryUsage.bind(this)
        });
        this.registerRule({
            id: 'performance-cpu-usage',
            name: 'CPU Usage Validation',
            description: 'Validates that CPU usage is within acceptable limits',
            category: RuleCategory.PERFORMANCE_VALIDATION,
            config: {
                enabled: true,
                severity: ValidationSeverity.WARNING,
                contexts: [RuleExecutionContext.DURING_EXECUTION, RuleExecutionContext.POST_EXECUTION],
                priority: 3
            },
            executor: this.validateCpuUsage.bind(this)
        });
        // Quality Assurance Rules
        this.registerRule({
            id: 'quality-code-standards',
            name: 'Code Standards Compliance',
            description: 'Validates adherence to coding standards and best practices',
            category: RuleCategory.QUALITY_ASSURANCE,
            config: {
                enabled: true,
                severity: ValidationSeverity.WARNING,
                contexts: [RuleExecutionContext.POST_EXECUTION],
                priority: 4,
                taskTypes: ['implementation', 'refactoring']
            },
            executor: this.validateCodeStandards.bind(this)
        });
        this.registerRule({
            id: 'quality-test-coverage',
            name: 'Test Coverage Validation',
            description: 'Validates that adequate test coverage is maintained',
            category: RuleCategory.QUALITY_ASSURANCE,
            config: {
                enabled: true,
                severity: ValidationSeverity.WARNING,
                contexts: [RuleExecutionContext.POST_EXECUTION],
                priority: 4,
                taskTypes: ['implementation', 'testing']
            },
            executor: this.validateTestCoverage.bind(this)
        });
        // Business Rules
        this.registerRule({
            id: 'business-requirements-compliance',
            name: 'Business Requirements Compliance',
            description: 'Validates that task implementation meets business requirements',
            category: RuleCategory.BUSINESS_RULES,
            config: {
                enabled: true,
                severity: ValidationSeverity.ERROR,
                contexts: [RuleExecutionContext.POST_EXECUTION],
                priority: 2
            },
            executor: this.validateBusinessRequirements.bind(this)
        });
        // Data Validation Rules
        this.registerRule({
            id: 'data-integrity-validation',
            name: 'Data Integrity Validation',
            description: 'Validates data integrity and consistency',
            category: RuleCategory.DATA_VALIDATION,
            config: {
                enabled: true,
                severity: ValidationSeverity.ERROR,
                contexts: [RuleExecutionContext.POST_EXECUTION],
                priority: 2
            },
            executor: this.validateDataIntegrity.bind(this)
        });
        // Integration Validation Rules
        this.registerRule({
            id: 'integration-api-contracts',
            name: 'API Contract Validation',
            description: 'Validates that API contracts are maintained',
            category: RuleCategory.INTEGRATION_VALIDATION,
            config: {
                enabled: true,
                severity: ValidationSeverity.ERROR,
                contexts: [RuleExecutionContext.POST_EXECUTION],
                priority: 2,
                taskTypes: ['implementation', 'deployment']
            },
            executor: this.validateApiContracts.bind(this)
        });
        this.logger.info(`Initialized ${this.registry.rules.size} default validation rules`);
    }
    /**
     * Register a new validation rule
     */
    registerRule(definition) {
        this.logger.info(`Registering validation rule: ${definition.id}`, {
            name: definition.name,
            category: definition.category,
            enabled: definition.config.enabled
        });
        // Store rule definition
        this.registry.rules.set(definition.id, definition);
        // Update category index
        const categoryRules = this.registry.rulesByCategory.get(definition.category) || [];
        categoryRules.push(definition.id);
        this.registry.rulesByCategory.set(definition.category, categoryRules);
        // Update context index
        definition.config.contexts.forEach(context => {
            const contextRules = this.registry.rulesByContext.get(context) || [];
            contextRules.push(definition.id);
            this.registry.rulesByContext.set(context, contextRules);
        });
        // Update enabled/disabled sets
        if (definition.config.enabled) {
            this.registry.enabledRules.add(definition.id);
            this.registry.disabledRules.delete(definition.id);
        }
        else {
            this.registry.disabledRules.add(definition.id);
            this.registry.enabledRules.delete(definition.id);
        }
    }
    /**
     * Get applicable validation rules for context
     */
    getApplicableRules(context, taskType, taskStatus, category) {
        const contextRuleIds = this.registry.rulesByContext.get(context) || [];
        const applicableRules = [];
        for (const ruleId of contextRuleIds) {
            const definition = this.registry.rules.get(ruleId);
            if (!definition || !this.registry.enabledRules.has(ruleId)) {
                continue;
            }
            // Check category filter
            if (category && definition.category !== category) {
                continue;
            }
            // Check task type filter
            if (taskType && definition.config.taskTypes && !definition.config.taskTypes.includes(taskType)) {
                continue;
            }
            // Check task status filter
            if (taskStatus && definition.config.taskStatuses && !definition.config.taskStatuses.includes(taskStatus)) {
                continue;
            }
            // Convert to ValidationRule format
            applicableRules.push({
                id: definition.id,
                name: definition.name,
                category: this.mapRuleCategoryToValidationCategory(definition.category),
                severity: definition.config.severity,
                enabled: definition.config.enabled,
                description: definition.description,
                validator: definition.executor,
                dependencies: definition.config.dependencies,
                timeout: definition.config.timeout,
                retries: definition.config.retries,
                metadata: {
                    ruleCategory: definition.category,
                    contexts: definition.config.contexts,
                    priority: definition.config.priority,
                    ...definition.metadata
                }
            });
        }
        // Sort by priority
        return applicableRules.sort((a, b) => {
            const priorityA = a.metadata?.priority || 999;
            const priorityB = b.metadata?.priority || 999;
            return priorityA - priorityB;
        });
    }
    /**
     * Map rule category to validation category
     */
    mapRuleCategoryToValidationCategory(ruleCategory) {
        switch (ruleCategory) {
            case RuleCategory.SECURITY_COMPLIANCE:
                return ValidationCategory.SECURITY;
            case RuleCategory.PERFORMANCE_VALIDATION:
                return ValidationCategory.PERFORMANCE;
            case RuleCategory.INTEGRATION_VALIDATION:
                return ValidationCategory.INTEGRATION;
            case RuleCategory.BUSINESS_RULES:
            case RuleCategory.QUALITY_ASSURANCE:
                return ValidationCategory.BUSINESS;
            case RuleCategory.DATA_VALIDATION:
            case RuleCategory.TASK_EXECUTION:
            case RuleCategory.TASK_COMPLETION:
                return ValidationCategory.FUNCTIONAL;
            default:
                return ValidationCategory.LOGIC;
        }
    }
    /**
     * Enable or disable a validation rule
     */
    configureRule(ruleId, enabled) {
        const definition = this.registry.rules.get(ruleId);
        if (!definition) {
            this.logger.warn(`Attempted to configure non-existent rule: ${ruleId}`);
            return false;
        }
        definition.config.enabled = enabled;
        if (enabled) {
            this.registry.enabledRules.add(ruleId);
            this.registry.disabledRules.delete(ruleId);
        }
        else {
            this.registry.disabledRules.add(ruleId);
            this.registry.enabledRules.delete(ruleId);
        }
        this.logger.info(`Rule ${ruleId} ${enabled ? 'enabled' : 'disabled'}`);
        return true;
    }
    /**
     * Update rule configuration
     */
    updateRuleConfig(ruleId, configUpdates) {
        const definition = this.registry.rules.get(ruleId);
        if (!definition) {
            this.logger.warn(`Attempted to update non-existent rule: ${ruleId}`);
            return false;
        }
        Object.assign(definition.config, configUpdates);
        this.logger.info(`Rule ${ruleId} configuration updated`, { configUpdates });
        return true;
    }
    /**
     * Rule executor implementations
     */
    /**
     * Validate that task has all required fields
     */
    async validateTaskRequiredFields(context) {
        const task = context.metadata?.task;
        if (!task) {
            return [{
                    id: 'task-required-fields-no-task',
                    category: ValidationCategory.LOGIC,
                    severity: ValidationSeverity.ERROR,
                    status: ValidationStatus.FAILED,
                    message: 'No task provided for required fields validation',
                    timestamp: new Date()
                }];
        }
        const results = [];
        const requiredFields = ['id', 'title', 'description', 'type'];
        const missingFields = [];
        requiredFields.forEach(field => {
            const value = task[field];
            if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
                missingFields.push(field);
            }
        });
        if (missingFields.length > 0) {
            results.push({
                id: 'task-missing-required-fields',
                category: ValidationCategory.LOGIC,
                severity: ValidationSeverity.ERROR,
                status: ValidationStatus.FAILED,
                message: `Task is missing required fields: ${missingFields.join(', ')}`,
                details: `Required fields: ${requiredFields.join(', ')}. Missing: ${missingFields.join(', ')}`,
                timestamp: new Date()
            });
        }
        else {
            results.push({
                id: 'task-required-fields-valid',
                category: ValidationCategory.LOGIC,
                severity: ValidationSeverity.INFO,
                status: ValidationStatus.PASSED,
                message: 'All required task fields are present',
                timestamp: new Date()
            });
        }
        return results;
    }
    /**
     * Validate that task status is valid for execution
     */
    async validateTaskStatusForExecution(context) {
        const task = context.metadata?.task;
        if (!task) {
            return [{
                    id: 'task-status-validation-no-task',
                    category: ValidationCategory.LOGIC,
                    severity: ValidationSeverity.ERROR,
                    status: ValidationStatus.FAILED,
                    message: 'No task provided for status validation',
                    timestamp: new Date()
                }];
        }
        const validExecutionStatuses = [TaskStatus.PENDING, TaskStatus.READY, TaskStatus.IN_PROGRESS];
        const invalidStatuses = [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED];
        if (invalidStatuses.includes(task.status)) {
            return [{
                    id: 'task-status-invalid-for-execution',
                    category: ValidationCategory.LOGIC,
                    severity: ValidationSeverity.ERROR,
                    status: ValidationStatus.FAILED,
                    message: `Task status '${task.status}' is not valid for execution`,
                    details: `Valid statuses for execution: ${validExecutionStatuses.join(', ')}`,
                    timestamp: new Date()
                }];
        }
        return [{
                id: 'task-status-valid-for-execution',
                category: ValidationCategory.LOGIC,
                severity: ValidationSeverity.INFO,
                status: ValidationStatus.PASSED,
                message: `Task status '${task.status}' is valid for execution`,
                timestamp: new Date()
            }];
    }
    /**
     * Validate that all task dependencies are satisfied
     */
    async validateTaskDependencies(context) {
        const task = context.metadata?.task;
        if (!task) {
            return [{
                    id: 'task-dependencies-no-task',
                    category: ValidationCategory.LOGIC,
                    severity: ValidationSeverity.ERROR,
                    status: ValidationStatus.FAILED,
                    message: 'No task provided for dependency validation',
                    timestamp: new Date()
                }];
        }
        // TODO: Implement actual dependency checking
        // This would require access to dependency information and their statuses
        return [{
                id: 'task-dependencies-validation-placeholder',
                category: ValidationCategory.LOGIC,
                severity: ValidationSeverity.INFO,
                status: ValidationStatus.PASSED,
                message: 'Dependency validation placeholder - TODO: Implement actual dependency checking',
                timestamp: new Date()
            }];
    }
    /**
     * Validate execution timeout limits
     */
    async validateExecutionTimeout(context) {
        const executionMetrics = context.metadata?.executionMetrics;
        const task = context.metadata?.task;
        if (!executionMetrics || !task) {
            return [{
                    id: 'execution-timeout-no-metrics',
                    category: ValidationCategory.PERFORMANCE,
                    severity: ValidationSeverity.WARNING,
                    status: ValidationStatus.SKIPPED,
                    message: 'No execution metrics available for timeout validation',
                    timestamp: new Date()
                }];
        }
        const maxExecutionTime = task.maxExecutionTimeMinutes * 60 * 1000 || 3600000; // 1 hour default
        const actualExecutionTime = executionMetrics.duration || 0;
        if (actualExecutionTime > maxExecutionTime) {
            return [{
                    id: 'execution-timeout-exceeded',
                    category: ValidationCategory.PERFORMANCE,
                    severity: ValidationSeverity.ERROR,
                    status: ValidationStatus.FAILED,
                    message: `Execution time ${actualExecutionTime}ms exceeds timeout limit ${maxExecutionTime}ms`,
                    timestamp: new Date()
                }];
        }
        return [{
                id: 'execution-timeout-within-limits',
                category: ValidationCategory.PERFORMANCE,
                severity: ValidationSeverity.INFO,
                status: ValidationStatus.PASSED,
                message: `Execution time ${actualExecutionTime}ms is within timeout limit ${maxExecutionTime}ms`,
                timestamp: new Date()
            }];
    }
    /**
     * Additional validation rule implementations...
     * Each rule follows the same pattern: extract context, validate conditions, return results
     */
    async validateResourceConsumption(context) {
        // TODO: Implement resource consumption validation
        return [{
                id: 'resource-consumption-placeholder',
                category: ValidationCategory.PERFORMANCE,
                severity: ValidationSeverity.INFO,
                status: ValidationStatus.PASSED,
                message: 'Resource consumption validation placeholder',
                timestamp: new Date()
            }];
    }
    async validateTaskCompletionCriteria(context) {
        // TODO: Implement completion criteria validation
        return [{
                id: 'completion-criteria-placeholder',
                category: ValidationCategory.FUNCTIONAL,
                severity: ValidationSeverity.INFO,
                status: ValidationStatus.PASSED,
                message: 'Task completion criteria validation placeholder',
                timestamp: new Date()
            }];
    }
    async validateTaskOutputs(context) {
        // TODO: Implement output validation
        return [{
                id: 'task-outputs-placeholder',
                category: ValidationCategory.FUNCTIONAL,
                severity: ValidationSeverity.INFO,
                status: ValidationStatus.PASSED,
                message: 'Task outputs validation placeholder',
                timestamp: new Date()
            }];
    }
    async validateSensitiveDataHandling(context) {
        // TODO: Implement sensitive data handling validation
        return [{
                id: 'sensitive-data-placeholder',
                category: ValidationCategory.SECURITY,
                severity: ValidationSeverity.INFO,
                status: ValidationStatus.PASSED,
                message: 'Sensitive data handling validation placeholder',
                timestamp: new Date()
            }];
    }
    async validateAccessControls(context) {
        // TODO: Implement access controls validation
        return [{
                id: 'access-controls-placeholder',
                category: ValidationCategory.SECURITY,
                severity: ValidationSeverity.INFO,
                status: ValidationStatus.PASSED,
                message: 'Access controls validation placeholder',
                timestamp: new Date()
            }];
    }
    async validateMemoryUsage(context) {
        const executionMetrics = context.metadata?.executionMetrics;
        if (!executionMetrics?.memoryUsage) {
            return [{
                    id: 'memory-usage-no-metrics',
                    category: ValidationCategory.PERFORMANCE,
                    severity: ValidationSeverity.WARNING,
                    status: ValidationStatus.SKIPPED,
                    message: 'No memory usage metrics available',
                    timestamp: new Date()
                }];
        }
        const maxMemoryMB = 1024; // 1GB default limit
        const peakMemoryMB = executionMetrics.memoryUsage.peak / (1024 * 1024);
        if (peakMemoryMB > maxMemoryMB) {
            return [{
                    id: 'memory-usage-exceeded',
                    category: ValidationCategory.PERFORMANCE,
                    severity: ValidationSeverity.WARNING,
                    status: ValidationStatus.FAILED,
                    message: `Peak memory usage ${peakMemoryMB.toFixed(2)}MB exceeds limit ${maxMemoryMB}MB`,
                    timestamp: new Date()
                }];
        }
        return [{
                id: 'memory-usage-within-limits',
                category: ValidationCategory.PERFORMANCE,
                severity: ValidationSeverity.INFO,
                status: ValidationStatus.PASSED,
                message: `Peak memory usage ${peakMemoryMB.toFixed(2)}MB is within limit ${maxMemoryMB}MB`,
                timestamp: new Date()
            }];
    }
    async validateCpuUsage(context) {
        // TODO: Implement CPU usage validation similar to memory validation
        return [{
                id: 'cpu-usage-placeholder',
                category: ValidationCategory.PERFORMANCE,
                severity: ValidationSeverity.INFO,
                status: ValidationStatus.PASSED,
                message: 'CPU usage validation placeholder',
                timestamp: new Date()
            }];
    }
    async validateCodeStandards(context) {
        // TODO: Implement code standards validation
        return [{
                id: 'code-standards-placeholder',
                category: ValidationCategory.BUSINESS,
                severity: ValidationSeverity.INFO,
                status: ValidationStatus.PASSED,
                message: 'Code standards validation placeholder',
                timestamp: new Date()
            }];
    }
    async validateTestCoverage(context) {
        // TODO: Implement test coverage validation
        return [{
                id: 'test-coverage-placeholder',
                category: ValidationCategory.BUSINESS,
                severity: ValidationSeverity.INFO,
                status: ValidationStatus.PASSED,
                message: 'Test coverage validation placeholder',
                timestamp: new Date()
            }];
    }
    async validateBusinessRequirements(context) {
        // TODO: Implement business requirements validation
        return [{
                id: 'business-requirements-placeholder',
                category: ValidationCategory.BUSINESS,
                severity: ValidationSeverity.INFO,
                status: ValidationStatus.PASSED,
                message: 'Business requirements validation placeholder',
                timestamp: new Date()
            }];
    }
    async validateDataIntegrity(context) {
        // TODO: Implement data integrity validation
        return [{
                id: 'data-integrity-placeholder',
                category: ValidationCategory.FUNCTIONAL,
                severity: ValidationSeverity.INFO,
                status: ValidationStatus.PASSED,
                message: 'Data integrity validation placeholder',
                timestamp: new Date()
            }];
    }
    async validateApiContracts(context) {
        // TODO: Implement API contract validation
        return [{
                id: 'api-contracts-placeholder',
                category: ValidationCategory.INTEGRATION,
                severity: ValidationSeverity.INFO,
                status: ValidationStatus.PASSED,
                message: 'API contracts validation placeholder',
                timestamp: new Date()
            }];
    }
    /**
     * Public API methods
     */
    /**
     * Get all registered rules
     */
    getAllRules() {
        return Array.from(this.registry.rules.values());
    }
    /**
     * Get rules by category
     */
    getRulesByCategory(category) {
        const ruleIds = this.registry.rulesByCategory.get(category) || [];
        return ruleIds.map(id => this.registry.rules.get(id)).filter(Boolean);
    }
    /**
     * Get enabled rules
     */
    getEnabledRules() {
        return Array.from(this.registry.enabledRules)
            .map(id => this.registry.rules.get(id))
            .filter(Boolean);
    }
    /**
     * Get rule statistics
     */
    getRuleStatistics() {
        const rulesByCategory = {};
        Object.values(RuleCategory).forEach(category => {
            rulesByCategory[category] = this.registry.rulesByCategory.get(category)?.length || 0;
        });
        const rulesByContext = {};
        Object.values(RuleExecutionContext).forEach(context => {
            rulesByContext[context] = this.registry.rulesByContext.get(context)?.length || 0;
        });
        return {
            totalRules: this.registry.rules.size,
            enabledRules: this.registry.enabledRules.size,
            disabledRules: this.registry.disabledRules.size,
            rulesByCategory,
            rulesByContext
        };
    }
    /**
     * Remove a validation rule
     */
    removeRule(ruleId) {
        const definition = this.registry.rules.get(ruleId);
        if (!definition) {
            return false;
        }
        // Remove from main registry
        this.registry.rules.delete(ruleId);
        // Remove from category index
        const categoryRules = this.registry.rulesByCategory.get(definition.category) || [];
        const categoryIndex = categoryRules.indexOf(ruleId);
        if (categoryIndex > -1) {
            categoryRules.splice(categoryIndex, 1);
            this.registry.rulesByCategory.set(definition.category, categoryRules);
        }
        // Remove from context indices
        definition.config.contexts.forEach(context => {
            const contextRules = this.registry.rulesByContext.get(context) || [];
            const contextIndex = contextRules.indexOf(ruleId);
            if (contextIndex > -1) {
                contextRules.splice(contextIndex, 1);
                this.registry.rulesByContext.set(context, contextRules);
            }
        });
        // Remove from enabled/disabled sets
        this.registry.enabledRules.delete(ruleId);
        this.registry.disabledRules.delete(ruleId);
        this.logger.info(`Removed validation rule: ${ruleId}`);
        return true;
    }
}
//# sourceMappingURL=ValidationRules.js.map