/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Comprehensive examples demonstrating the Automatic Validation System usage.
 *
 * These examples show how to integrate the validation system into various
 * development workflows and automation scenarios.
 */
/**
 * Example 1: Basic Task Completion Validation
 *
 * Use case: Validate that a feature implementation task is complete
 * and meets all quality standards before marking as done.
 */
export declare function exampleBasicTaskValidation(): Promise<void>;
/**
 * Example 2: Feature Implementation Validation
 *
 * Use case: Validate a specific feature from FEATURES.json is complete
 * and ready to be marked as implemented.
 */
export declare function exampleFeatureValidation(): Promise<void>;
/**
 * Example 3: Project Completion Readiness Check
 *
 * Use case: Before authorizing agent stop, ensure the entire project
 * meets completion criteria with comprehensive validation.
 */
export declare function exampleProjectCompletionCheck(): Promise<void>;
/**
 * Example 4: Advanced Validation with Custom Context
 *
 * Use case: Validate a complex refactoring task with custom validation
 * parameters and comprehensive quality gates.
 */
export declare function exampleAdvancedValidation(): Promise<void>;
/**
 * Example 5: CI/CD Integration
 *
 * Use case: Generate validation reports for CI/CD pipeline consumption
 * with structured output for automated decision making.
 */
export declare function exampleCICDIntegration(): Promise<void>;
/**
 * Example 6: TodoWrite Integration
 *
 * Use case: Integrate with TodoWrite task management system to
 * automatically validate task completion before marking as done.
 */
export declare function exampleTodoWriteIntegration(): Promise<void>;
/**
 * Example 7: Performance and Metrics Analysis
 *
 * Use case: Analyze validation system performance and collect metrics
 * for continuous improvement and optimization.
 */
export declare function examplePerformanceAnalysis(): Promise<void>;
/**
 * Main function to run all examples.
 *
 * Execute with: npx tsx src/validation/examples.ts
 */
export declare function runAllExamples(): Promise<void>;
export declare const examples: {
    basicTaskValidation: typeof exampleBasicTaskValidation;
    featureValidation: typeof exampleFeatureValidation;
    projectCompletionCheck: typeof exampleProjectCompletionCheck;
    advancedValidation: typeof exampleAdvancedValidation;
    cicdIntegration: typeof exampleCICDIntegration;
    todoWriteIntegration: typeof exampleTodoWriteIntegration;
    performanceAnalysis: typeof examplePerformanceAnalysis;
};
