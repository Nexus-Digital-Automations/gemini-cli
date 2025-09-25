/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { ValidationResult } from './AutomaticValidationSystem';
/**
 * Integration utilities for the Automatic Validation System.
 *
 * This module provides:
 * - TodoWrite task completion validation
 * - CI/CD pipeline integration
 * - Feature completion verification
 * - Git workflow integration
 */
export declare class ValidationIntegration {
    private readonly validationSystem;
    private readonly projectRoot;
    constructor(projectRoot: string);
    /**
     * Validate TodoWrite task completion with comprehensive quality gates.
     *
     * @param taskDescription - Description of the completed task
     * @param taskCategory - Category/type of task for appropriate validation
     * @returns Promise resolving to validation result
     */
    validateTaskCompletion(taskDescription: string, taskCategory?: 'feature' | 'bug-fix' | 'refactoring' | 'testing' | 'documentation'): Promise<ValidationResult>;
    /**
     * Validate feature implementation completion from FEATURES.json.
     *
     * @param featureId - ID of the completed feature
     * @returns Promise resolving to validation result
     */
    validateFeatureCompletion(featureId: string): Promise<ValidationResult>;
    /**
     * Validate project completion readiness with comprehensive checks.
     *
     * @returns Promise resolving to validation result
     */
    validateProjectCompletion(): Promise<ValidationResult>;
    /**
     * Validate commit readiness before git operations.
     *
     * @param commitMessage - Planned commit message
     * @returns Promise resolving to validation result
     */
    validateCommitReadiness(commitMessage: string): Promise<ValidationResult>;
    /**
     * Generate validation report for CI/CD integration.
     *
     * @param validationResult - Result from validation system
     * @returns Formatted report for CI/CD consumption
     */
    generateCICDReport(validationResult: ValidationResult): CICDReport;
    /**
     * Check if validation should block continuation based on results.
     *
     * @param validationResult - Result from validation system
     * @returns True if validation should block, false if can proceed
     */
    shouldBlockContinuation(validationResult: ValidationResult): boolean;
    /**
     * Generate stop authorization recommendation based on validation.
     *
     * @param validationResult - Result from validation system
     * @returns Stop authorization recommendation
     */
    generateStopAuthorizationRecommendation(validationResult: ValidationResult): StopAuthorizationRecommendation;
    /**
     * Map task category to internal TaskType enum.
     */
    private mapTaskCategoryToType;
    /**
     * Infer task type from git commit message patterns.
     */
    private inferTaskTypeFromCommitMessage;
}
/**
 * Command-line interface for the validation system.
 */
export declare class ValidationCLI {
    private readonly integration;
    constructor(projectRoot: string);
    /**
     * Execute validation command with formatted output.
     *
     * @param command - Validation command to execute
     * @param args - Command arguments
     */
    executeCommand(command: ValidationCommand, args: ValidationCommandArgs): Promise<void>;
    /**
     * Output validation result in formatted manner.
     */
    private outputResult;
    /**
     * Get colored severity badge for output.
     */
    private getSeverityBadge;
    /**
     * Get colored priority badge for output.
     */
    private getPriorityBadge;
}
export interface CICDReport {
    success: boolean;
    status: string;
    summary: string;
    duration: number;
    gates: Array<{
        name: string;
        passed: boolean;
        message: string;
        duration: number;
        severity: string;
    }>;
    recommendations: Array<{
        type: string;
        priority: string;
        title: string;
        description: string;
        actionItems: string[];
    }>;
    artifacts: Array<{
        name: string;
        type: string;
        size: number;
    }>;
    timestamp: string;
    sessionId: string;
}
export interface StopAuthorizationRecommendation {
    canAuthorizeStop: boolean;
    reason: string;
    issues: string[];
    nextActions: string[];
    validationSummary: string;
}
export type ValidationCommand = 'validate-task' | 'validate-feature' | 'validate-project' | 'validate-commit';
export interface ValidationCommandArgs {
    description?: string;
    category?: string;
    featureId?: string;
    commitMessage?: string;
    [key: string]: string | undefined;
}
/**
 * Factory function to create validation integration instance.
 */
export declare function createValidationIntegration(projectRoot: string): ValidationIntegration;
/**
 * Factory function to create validation CLI instance.
 */
export declare function createValidationCLI(projectRoot: string): ValidationCLI;
/**
 * Main validation entry point for programmatic use.
 */
export declare function validateTaskCompletion(projectRoot: string, taskDescription: string, taskCategory?: 'feature' | 'bug-fix' | 'refactoring' | 'testing' | 'documentation'): Promise<ValidationResult>;
/**
 * Utility function to check if project is ready for completion.
 */
export declare function isProjectReadyForCompletion(projectRoot: string): Promise<boolean>;
/**
 * Utility function to get stop authorization status.
 */
export declare function getStopAuthorizationStatus(projectRoot: string, taskDescription?: string): Promise<StopAuthorizationRecommendation>;
