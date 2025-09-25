/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Comprehensive Test Runner Configuration for Autonomous Task Management
 *
 * This configuration orchestrates all integration testing suites including:
 * - Multi-agent coordination testing
 * - End-to-end workflow validation
 * - Performance benchmarking and optimization
 * - CI/CD automation and deployment testing
 * - System reliability and stress testing
 * - Cross-session persistence validation
 */
declare const _default: import("vite").UserConfig & Promise<import("vite").UserConfig> & (import("vitest/config").UserConfigFnObject & import("vitest/config").UserConfigExport);
export default _default;
/**
 * Test Suite Configuration and Orchestration
 */
export interface TestSuiteConfig {
    name: string;
    description: string;
    timeout: number;
    priority: 'critical' | 'high' | 'normal' | 'low';
    dependencies: string[];
    tags: string[];
    parallel: boolean;
    retries: number;
}
export declare const TEST_SUITES: Record<string, TestSuiteConfig>;
/**
 * Test Execution Orchestration Functions
 */
export declare class TestOrchestrator {
    private suites;
    private results;
    constructor();
    /**
     * Get test execution order based on dependencies and priorities
     */
    getExecutionOrder(): string[];
    /**
     * Get test suite configuration
     */
    getSuiteConfig(suiteId: string): TestSuiteConfig | undefined;
    /**
     * Record test result
     */
    recordResult(suiteId: string, result: TestResult): void;
    /**
     * Get test results summary
     */
    getResultsSummary(): TestSummary;
}
export interface TestResult {
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    error?: string;
    details?: Record<string, any>;
}
export interface TestSummary {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    totalDuration: number;
    results: Record<string, TestResult>;
}
/**
 * Test Environment Validation
 */
export declare function validateTestEnvironment(): Promise<boolean>;
/**
 * Test Performance Monitoring
 */
export declare class TestPerformanceMonitor {
    private metrics;
    recordMetric(testSuite: string, metric: PerformanceMetric): void;
    getMetrics(testSuite?: string): PerformanceMetric[];
    generateReport(): PerformanceReport;
}
export interface PerformanceMetric {
    testName: string;
    duration: number;
    memoryUsage?: number;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface SuitePerformanceReport {
    testCount: number;
    avgDuration: number;
    maxDuration: number;
    minDuration: number;
    avgMemoryMB: number;
    maxMemoryMB: number;
}
export interface PerformanceReport {
    totalTests: number;
    overallDuration: number;
    suites: Record<string, SuitePerformanceReport>;
    generatedAt: string;
}
/**
 * Default orchestrator instance
 */
export declare const testOrchestrator: TestOrchestrator;
export declare const performanceMonitor: TestPerformanceMonitor;
