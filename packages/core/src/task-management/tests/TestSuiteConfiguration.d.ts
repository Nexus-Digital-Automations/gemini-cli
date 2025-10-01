/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Master Test Suite Configuration
 * Ensures comprehensive testing of all autonomous task management components
 */
export declare const testSuiteConfig: import("vite").UserConfig & Promise<import("vite").UserConfig> & (import("vitest/config").UserConfigFnObject & import("vitest/config").UserConfigExport);
/**
 * Test Suite Categories and Organization
 * Defines the structure and execution order of test suites
 */
export declare const testSuiteCategories: {
    unit: {
        description: string;
        timeout: number;
        parallel: boolean;
        suites: string[];
        coverageTarget: number;
        criticalFailureThreshold: number;
    };
    integration: {
        description: string;
        timeout: number;
        parallel: boolean;
        suites: string[];
        coverageTarget: number;
        criticalFailureThreshold: number;
    };
    e2e: {
        description: string;
        timeout: number;
        parallel: boolean;
        suites: string[];
        coverageTarget: number;
        criticalFailureThreshold: number;
    };
    performance: {
        description: string;
        timeout: number;
        parallel: boolean;
        suites: string[];
        coverageTarget: number;
        criticalFailureThreshold: number;
    };
    security: {
        description: string;
        timeout: number;
        parallel: boolean;
        suites: string[];
        coverageTarget: number;
        criticalFailureThreshold: number;
    };
    errorHandling: {
        description: string;
        timeout: number;
        parallel: boolean;
        suites: string[];
        coverageTarget: number;
        criticalFailureThreshold: number;
    };
    coverage: {
        description: string;
        timeout: number;
        parallel: boolean;
        suites: string[];
        coverageTarget: number;
        criticalFailureThreshold: number;
    };
};
/**
 * Test Execution Configuration
 * Defines how tests should be executed for different environments
 */
export declare const executionConfigurations: {
    development: {
        watch: boolean;
        coverage: boolean;
        parallel: boolean;
        timeout: number;
        reporter: string;
        bail: boolean;
        maxConcurrency: number;
    };
    ci: {
        watch: boolean;
        coverage: boolean;
        parallel: boolean;
        timeout: number;
        reporter: string[];
        bail: boolean;
        maxConcurrency: number;
        retries: number;
    };
    production: {
        watch: boolean;
        coverage: boolean;
        parallel: boolean;
        timeout: number;
        reporter: string[];
        bail: boolean;
        maxConcurrency: number;
        retries: number;
    };
    benchmark: {
        watch: boolean;
        coverage: boolean;
        parallel: boolean;
        timeout: number;
        reporter: string[];
        bail: boolean;
        maxConcurrency: number;
    };
};
/**
 * Quality Gates Configuration
 * Defines quality requirements that must be met for deployment
 */
export declare const qualityGates: {
    coverage: {
        line: {
            minimum: number;
            target: number;
        };
        branch: {
            minimum: number;
            target: number;
        };
        function: {
            minimum: number;
            target: number;
        };
        statement: {
            minimum: number;
            target: number;
        };
    };
    testQuality: {
        passRate: {
            minimum: number;
            target: number;
        };
        reliability: {
            minimum: number;
            target: number;
        };
        maintainability: {
            minimum: number;
            target: number;
        };
        performance: {
            minimum: number;
            target: number;
        };
    };
    security: {
        vulnerabilities: {
            maximum: number;
            target: number;
        };
        securityTests: {
            minimum: number;
            target: number;
        };
        penetrationTests: {
            minimum: number;
            target: number;
        };
    };
    performance: {
        executionTime: {
            maximum: number;
            target: number;
        };
        memoryUsage: {
            maximum: number;
            target: number;
        };
        cpuUtilization: {
            maximum: number;
            target: number;
        };
    };
    documentation: {
        apiDocumentation: {
            minimum: number;
            target: number;
        };
        testDocumentation: {
            minimum: number;
            target: number;
        };
        codeComments: {
            minimum: number;
            target: number;
        };
    };
};
/**
 * Test Suite Orchestration
 * Controls the execution flow and dependencies between test suites
 */
export declare class TestSuiteOrchestrator {
    private static readonly EXECUTION_ORDER;
    /**
     * Execute all test suites in the correct order
     */
    static executeFullSuite(): Promise<TestSuiteResults>;
    /**
     * Execute tests for a specific category
     */
    private static executeCategoryTests;
    /**
     * Validate quality gates after test execution
     */
    private static validateQualityGates;
    /**
     * Generate comprehensive test report
     */
    static generateTestReport(results: TestSuiteResults): Promise<string>;
    /**
     * Generate improvement recommendations based on results
     */
    private static generateRecommendations;
}
export interface TestSuiteResults {
    overallSuccess: boolean;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    suiteResults: Record<string, CategoryTestResult>;
    coverageMetrics: Record<string, number>;
    qualityGates: QualityGateResults;
    executionTime: number;
    timestamp: Date;
}
export interface CategoryTestResult {
    category: string;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    criticalFailures: number;
    coveragePercentage: number;
    executionTime: number;
    suiteDetails: SuiteDetail[];
}
export interface SuiteDetail {
    name: string;
    passed: boolean;
    coverage: number;
}
export interface QualityGateResults {
    allGatesPassed: boolean;
    coverage: Record<string, {
        value: number;
        passed: boolean;
    }>;
    testQuality: Record<string, {
        value: number;
        passed: boolean;
    }>;
    security: Record<string, {
        value: number;
        passed: boolean;
    }>;
    performance: Record<string, {
        value: number;
        passed: boolean;
    }>;
    documentation: Record<string, {
        value: number;
        passed: boolean;
    }>;
}
export default testSuiteConfig;
