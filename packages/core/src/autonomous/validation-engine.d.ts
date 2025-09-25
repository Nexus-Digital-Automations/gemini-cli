/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as fs from 'node:fs/promises';
import type { AutonomousTask, TaskCategory } from './task-breakdown-engine.js';
import type { ValidationEngine, ValidationResult, TaskExecutionContext, TaskExecutionResult, ExecutionLogger } from './execution-engine.js';
/**
 * Validation rule interface
 */
export interface ValidationRule {
    name: string;
    description: string;
    category: TaskCategory[];
    priority: ValidationPriority;
    validate(task: AutonomousTask, context: ValidationContext): Promise<ValidationRuleResult>;
}
/**
 * Validation rule priority
 */
export declare enum ValidationPriority {
    LOW = 1,
    MEDIUM = 2,
    HIGH = 3,
    CRITICAL = 4
}
/**
 * Context for validation operations
 */
export interface ValidationContext {
    executionContext?: TaskExecutionContext;
    executionResult?: TaskExecutionResult;
    fileSystem: FileSystemValidator;
    logger: ExecutionLogger;
}
/**
 * Result of individual validation rule
 */
export interface ValidationRuleResult {
    passed: boolean;
    message: string;
    details?: Record<string, unknown>;
    score: number;
}
/**
 * File system validation utilities
 */
export interface FileSystemValidator {
    fileExists(filePath: string): Promise<boolean>;
    isReadable(filePath: string): Promise<boolean>;
    isWritable(filePath: string): Promise<boolean>;
    getFileSize(filePath: string): Promise<number>;
    getFileStats(filePath: string): Promise<fs.Stats>;
    validatePath(filePath: string, workspaceRoot: string): Promise<boolean>;
}
/**
 * Success criteria validator
 */
export interface SuccessCriteriaValidator {
    validateCriteria(criteria: string[], task: AutonomousTask, result?: TaskExecutionResult): Promise<ValidationResult>;
}
/**
 * Comprehensive validation engine implementation
 */
export declare class ComprehensiveValidationEngine implements ValidationEngine {
    private readonly validationRules;
    private readonly fileSystemValidator;
    private readonly successCriteriaValidator;
    constructor();
    /**
     * Validates a task after completion
     */
    validateTask(task: AutonomousTask, result: TaskExecutionResult): Promise<ValidationResult>;
    /**
     * Validates pre-conditions before task execution
     */
    validatePreConditions(task: AutonomousTask, context: TaskExecutionContext): Promise<ValidationResult>;
    /**
     * Validates post-conditions after task execution
     */
    validatePostConditions(task: AutonomousTask, result: TaskExecutionResult): Promise<ValidationResult>;
    /**
     * Adds a custom validation rule
     */
    addValidationRule(rule: ValidationRule): void;
    /**
     * Removes a validation rule
     */
    removeValidationRule(name: string): void;
    private extractRequiredTools;
    private validateStep;
    private validateSyntax;
    private validateTests;
    private calculateValidationScore;
    private initializeDefaultRules;
}
/**
 * Default file system validator implementation
 */
export declare class DefaultFileSystemValidator implements FileSystemValidator {
    fileExists(filePath: string): Promise<boolean>;
    isReadable(filePath: string): Promise<boolean>;
    isWritable(filePath: string): Promise<boolean>;
    getFileSize(filePath: string): Promise<number>;
    getFileStats(filePath: string): Promise<fs.Stats>;
    validatePath(filePath: string, workspaceRoot: string): Promise<boolean>;
}
/**
 * Default success criteria validator implementation
 */
export declare class DefaultSuccessCriteriaValidator implements SuccessCriteriaValidator {
    validateCriteria(criteria: string[], task: AutonomousTask, result?: TaskExecutionResult): Promise<ValidationResult>;
    private evaluateCriterion;
    private isCritical;
}
