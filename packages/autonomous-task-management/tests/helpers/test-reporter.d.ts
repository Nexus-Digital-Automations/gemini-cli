/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Test reporting and metrics collection system for autonomous task management testing
 */
export interface TestMetrics {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    duration: number;
    coverage?: CoverageMetrics;
    performance?: PerformanceMetrics;
    memory?: MemoryMetrics;
}
export interface CoverageMetrics {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
}
export interface PerformanceMetrics {
    averageTestTime: number;
    slowestTests: Array<{
        name: string;
        duration: number;
    }>;
    fastestTests: Array<{
        name: string;
        duration: number;
    }>;
    memoryUsage: number;
}
export interface MemoryMetrics {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
}
export interface TestResult {
    name: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    error?: string;
    stack?: string;
    assertions?: number;
}
export interface TestSuite {
    name: string;
    results: TestResult[];
    metrics: TestMetrics;
    timestamp: string;
    environment: {
        nodeVersion: string;
        platform: string;
        memoryLimit: number;
    };
}
export declare class TestReporter {
    private outputDir;
    private results;
    private suites;
    private startTime;
    private performanceData;
    constructor(outputDir?: string);
    /**
     * Start measuring test execution
     */
    startSuite(suiteName: string): void;
    /**
     * Record individual test result
     */
    recordTest(result: TestResult): void;
    /**
     * Finish test suite and generate report
     */
    finishSuite(suiteName: string): Promise<TestSuite>;
    /**
     * Calculate comprehensive test metrics
     */
    private calculateMetrics;
    /**
     * Generate comprehensive test reports
     */
    private generateReports;
    /**
     * Generate JSON report
     */
    private generateJSONReport;
    /**
     * Generate HTML report
     */
    private generateHTMLReport;
    /**
     * Generate JUnit XML report for CI/CD integration
     */
    private generateJUnitReport;
    /**
     * Generate performance CSV for analysis
     */
    private generatePerformanceCSV;
    /**
     * Generate summary report
     */
    private generateSummaryReport;
    /**
     * Get memory limit for the current process
     */
    private getMemoryLimit;
    /**
     * Format bytes to human readable format
     */
    private formatBytes;
    /**
     * Sanitize suite name for file system
     */
    private sanitizeName;
    /**
     * Get all test suites results
     */
    getAllSuites(): TestSuite[];
    /**
     * Generate aggregate report across multiple suites
     */
    generateAggregateReport(): Promise<void>;
}
