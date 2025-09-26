/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TaskStatus } from '../task-management/types.js';
import type { ValidationRule, ValidationExecutor, ValidationResult } from './ValidationFramework.js';
import type { ValidationSeverity } from './ValidationFramework.js';
/**
 * Rule categories for organization and filtering
 */
export declare enum RuleCategory {
    TASK_PRECONDITIONS = "task_preconditions",
    TASK_EXECUTION = "task_execution",
    TASK_COMPLETION = "task_completion",
    DEPENDENCY_VALIDATION = "dependency_validation",
    SECURITY_COMPLIANCE = "security_compliance",
    PERFORMANCE_VALIDATION = "performance_validation",
    QUALITY_ASSURANCE = "quality_assurance",
    BUSINESS_RULES = "business_rules",
    DATA_VALIDATION = "data_validation",
    INTEGRATION_VALIDATION = "integration_validation"
}
/**
 * Rule execution contexts for conditional rule application
 */
export declare enum RuleExecutionContext {
    PRE_EXECUTION = "pre_execution",
    DURING_EXECUTION = "during_execution",
    POST_EXECUTION = "post_execution",
    ROLLBACK = "rollback",
    CONTINUOUS = "continuous"
}
/**
 * Rule configuration parameters
 */
export interface RuleConfig {
    enabled: boolean;
    severity: ValidationSeverity;
    contexts: RuleExecutionContext[];
    taskTypes?: string[];
    taskStatuses?: TaskStatus[];
    priority?: number;
    timeout?: number;
    retries?: number;
    dependencies?: string[];
    customParameters?: Record<string, unknown>;
}
/**
 * Rule definition with metadata
 */
export interface ValidationRuleDefinition {
    id: string;
    name: string;
    description: string;
    category: RuleCategory;
    config: RuleConfig;
    executor: ValidationExecutor;
    metadata?: Record<string, unknown>;
}
/**
 * Rule execution result with enhanced context
 */
export interface RuleExecutionResult extends ValidationResult {
    ruleId: string;
    ruleName: string;
    executionContext: RuleExecutionContext;
    taskContext?: {
        taskId: string;
        taskType: string;
        taskStatus: TaskStatus;
    };
    performanceMetrics?: {
        executionTime: number;
        memoryUsage?: number;
        resourceConsumption?: Record<string, number>;
    };
}
/**
 * Rule registry for managing validation rules
 */
export interface RuleRegistry {
    rules: Map<string, ValidationRuleDefinition>;
    rulesByCategory: Map<RuleCategory, string[]>;
    rulesByContext: Map<RuleExecutionContext, string[]>;
    enabledRules: Set<string>;
    disabledRules: Set<string>;
}
/**
 * Comprehensive Validation Rules System for Autonomous Task Management
 *
 * Provides a comprehensive set of configurable validation rules for all aspects
 * of task execution, including preconditions, execution validation, completion
 * criteria, security compliance, and quality assurance.
 */
export declare class ValidationRules {
    private readonly logger;
    private readonly registry;
    constructor();
    /**
     * Initialize comprehensive set of default validation rules
     */
    private initializeDefaultRules;
    /**
     * Register a new validation rule
     */
    registerRule(definition: ValidationRuleDefinition): void;
    /**
     * Get applicable validation rules for context
     */
    getApplicableRules(context: RuleExecutionContext, taskType?: string, taskStatus?: TaskStatus, category?: RuleCategory): ValidationRule[];
    /**
     * Map rule category to validation category
     */
    private mapRuleCategoryToValidationCategory;
    /**
     * Enable or disable a validation rule
     */
    configureRule(ruleId: string, enabled: boolean): boolean;
    /**
     * Update rule configuration
     */
    updateRuleConfig(ruleId: string, configUpdates: Partial<RuleConfig>): boolean;
    /**
     * Rule executor implementations
     */
    /**
     * Validate that task has all required fields
     */
    private validateTaskRequiredFields;
    /**
     * Validate that task status is valid for execution
     */
    private validateTaskStatusForExecution;
    /**
     * Validate that all task dependencies are satisfied
     */
    private validateTaskDependencies;
    /**
     * Validate execution timeout limits
     */
    private validateExecutionTimeout;
    /**
     * Additional validation rule implementations...
     * Each rule follows the same pattern: extract context, validate conditions, return results
     */
    private validateResourceConsumption;
    private validateTaskCompletionCriteria;
    private validateTaskOutputs;
    private validateSensitiveDataHandling;
    private validateAccessControls;
    private validateMemoryUsage;
    private validateCpuUsage;
    private validateCodeStandards;
    private validateTestCoverage;
    private validateBusinessRequirements;
    private validateDataIntegrity;
    private validateApiContracts;
    /**
     * Public API methods
     */
    /**
     * Get all registered rules
     */
    getAllRules(): ValidationRuleDefinition[];
    /**
     * Get rules by category
     */
    getRulesByCategory(category: RuleCategory): ValidationRuleDefinition[];
    /**
     * Get enabled rules
     */
    getEnabledRules(): ValidationRuleDefinition[];
    /**
     * Get rule statistics
     */
    getRuleStatistics(): {
        totalRules: number;
        enabledRules: number;
        disabledRules: number;
        rulesByCategory: Record<string, number>;
        rulesByContext: Record<string, number>;
    };
    /**
     * Remove a validation rule
     */
    removeRule(ruleId: string): boolean;
}
