/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Test suite configuration
 */
export interface TestSuiteConfig {
    /** Enable performance benchmarking */
    enablePerformanceTests: boolean;
    /** Enable stress testing */
    enableStressTests: boolean;
    /** Enable integration tests */
    enableIntegrationTests: boolean;
    /** Maximum test execution time in milliseconds */
    maxTestDuration: number;
    /** Number of concurrent tasks for stress testing */
    stressTestTaskCount: number;
    /** Performance benchmark thresholds */
    performanceThresholds: {
        taskCreationTimeMs: number;
        systemResponseTimeMs: number;
        memoryUsageMB: number;
        maxConcurrentTasks: number;
    };
}
/**
 * Test result interface
 */
export interface TestResult {
    name: string;
    passed: boolean;
    duration: number;
    error?: string;
    metrics?: Record<string, number>;
    details?: Record<string, unknown>;
}
/**
 * Test suite result
 */
export interface TestSuiteResult {
    suiteName: string;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    totalDuration: number;
    results: TestResult[];
    summary: {
        successRate: number;
        averageTestDuration: number;
        performanceScore: number;
        qualityGatesPassed: number;
    };
}
/**
 * Comprehensive Test Runner
 */
export declare class TaskManagementTestRunner {
    private readonly config;
    private taskManager?;
    private cliIntegration?;
    constructor(config?: Partial<TestSuiteConfig>);
    /**
     * Run complete test suite
     */
    runAllTests(): Promise<TestSuiteResult>;
    /**
     * Core functionality tests
     */
    private runCoreFunctionalityTests;
    /**
     * Performance tests
     */
    private runPerformanceTests;
    /**
     * Stress tests
     */
    private runStressTests;
    /**
     * Integration tests
     */
    private runIntegrationTests;
    /**
     * Validation tests
     */
    private runValidationTests;
    /**
     * Individual test implementations
     */
    private testTaskCreation;
    private testTaskExecution;
    private testTaskStateManagement;
    private testErrorHandling;
    private testAutonomousBreakdown;
    private testPriorityScheduling;
    private testTaskCreationPerformance;
    private testSystemResponseTime;
    private testMemoryUsage;
    private testConcurrentTaskHandling;
    private testThroughput;
    private testHighVolumeTasks;
    private testSystemStability;
    private testResourceLimits;
    private testLongRunningOperations;
    private testErrorRecoveryUnderLoad;
    private testCLIIntegration;
    private testMonitoringIntegration;
    private testPersistenceIntegration;
    private testHookIntegration;
    private testEndToEndWorkflow;
    private testSystemConsistency;
    private testDataIntegrity;
    private testSecurityValidation;
    private testComplianceChecks;
    private testQualityGates;
    /**
     * Helper methods
     */
    private executeTests;
    private createTimeoutPromise;
    private calculatePerformanceScore;
    private countQualityGatesPassed;
    private setupTestEnvironment;
    private cleanupTestEnvironment;
}
/**
 * Factory function for creating test runner
 */
export declare function createTestRunner(config?: Partial<TestSuiteConfig>): TaskManagementTestRunner;
/**
 * Quick test execution function
 */
export declare function runQuickTests(): Promise<TestSuiteResult>;
/**
 * Comprehensive test execution function
 */
export declare function runComprehensiveTests(): Promise<TestSuiteResult>;
