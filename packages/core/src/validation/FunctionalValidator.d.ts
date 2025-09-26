/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ValidationContext, ValidationResult } from './ValidationFramework.js';
/**
 * Functional validation configuration
 */
export interface FunctionalValidationConfig {
    testFrameworks: string[];
    coverageThreshold: {
        lines: number;
        functions: number;
        branches: number;
        statements: number;
    };
    testPatterns: string[];
    behaviorValidation: {
        enabled: boolean;
        scenarios: BehaviorScenario[];
    };
    performanceThresholds: {
        maxExecutionTime: number;
        maxMemoryUsage: number;
    };
}
/**
 * Behavior validation scenario
 */
export interface BehaviorScenario {
    id: string;
    description: string;
    setup?: () => Promise<void>;
    execute: () => Promise<any>;
    validate: (result: any) => Promise<boolean>;
    cleanup?: () => Promise<void>;
}
/**
 * Functional validation automation system
 * Handles testing, behavior verification, and functional correctness
 */
export declare class FunctionalValidator {
    private readonly logger;
    private readonly config;
    constructor(config: FunctionalValidationConfig);
    /**
     * Main validation executor for functional testing
     */
    validateFunctionality(context: ValidationContext): Promise<ValidationResult[]>;
    /**
     * Run tests using specified framework
     */
    private runTests;
    /**
     * Analyze test coverage
     */
    private analyzeCoverage;
    /**
     * Run behavior validation scenarios
     */
    private runBehaviorValidation;
    /**
     * Run performance validation
     */
    private runPerformanceValidation;
    /**
     * Check if test framework is available
     */
    private checkFrameworkAvailability;
    /**
     * Build test command for framework
     */
    private buildTestCommand;
    /**
     * Parse test results from framework output
     */
    private parseTestResults;
    /**
     * Parse coverage report from output
     */
    private parseCoverageReport;
    /**
     * Add behavior validation scenario
     */
    addBehaviorScenario(scenario: BehaviorScenario): void;
    /**
     * Get supported test frameworks
     */
    getSupportedFrameworks(): string[];
}
