/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ValidationContext, ValidationResult } from './ValidationFramework.js';
/**
 * Integration test configuration
 */
export interface IntegrationTestConfig {
    enabled: boolean;
    testCommand: string;
    timeout: number;
    environment?: Record<string, string>;
}
/**
 * Performance benchmark configuration
 */
export interface PerformanceBenchmark {
    id: string;
    name: string;
    threshold: {
        responseTime?: number;
        throughput?: number;
        memoryUsage?: number;
        cpuUsage?: number;
    };
    testCommand?: string;
}
/**
 * System compatibility configuration
 */
export interface CompatibilityConfig {
    nodeVersions: string[];
    operatingSystems: string[];
    architectures: string[];
    dependencies: Array<{
        name: string;
        version: string;
        optional?: boolean;
    }>;
}
/**
 * Integration validation configuration
 */
export interface IntegrationValidationConfig {
    systemCompatibility: CompatibilityConfig;
    performanceBenchmarks: PerformanceBenchmark[];
    integrationTests: IntegrationTestConfig;
    e2eTests: IntegrationTestConfig;
    loadTesting: {
        enabled: boolean;
        concurrent: number;
        duration: number;
        targetRps: number;
    };
    monitoringChecks: {
        healthEndpoints: string[];
        resourceLimits: {
            maxMemory: number;
            maxCpu: number;
            maxDiskUsage: number;
        };
    };
}
/**
 * Integration validation automation system
 * Handles system compatibility, performance, and integration testing
 */
export declare class IntegrationValidator {
    private readonly logger;
    private readonly config;
    constructor(config: IntegrationValidationConfig);
    /**
     * Main validation executor for integration testing
     */
    validateIntegration(context: ValidationContext): Promise<ValidationResult[]>;
    /**
     * Validate system compatibility
     */
    private validateSystemCompatibility;
    /**
     * Run performance benchmarks
     */
    private runPerformanceBenchmarks;
    /**
     * Run integration tests
     */
    private runIntegrationTests;
    /**
     * Run end-to-end tests
     */
    private runE2ETests;
    /**
     * Run load tests
     */
    private runLoadTests;
    /**
     * Run monitoring and health checks
     */
    private runMonitoringChecks;
    /**
     * Get system information
     */
    private getSystemInfo;
    /**
     * Check Node.js version compatibility
     */
    private checkNodeVersionCompatibility;
    /**
     * Check platform compatibility
     */
    private checkPlatformCompatibility;
    /**
     * Check architecture compatibility
     */
    private checkArchitectureCompatibility;
    /**
     * Check dependency compatibility
     */
    private checkDependencyCompatibility;
    /**
     * Execute performance benchmark
     */
    private executeBenchmark;
    /**
     * Validate benchmark metrics against thresholds
     */
    private validateBenchmarkMetrics;
    /**
     * Parse test output to extract results
     */
    private parseTestOutput;
    /**
     * Simulate load test (placeholder implementation)
     */
    private simulateLoadTest;
    /**
     * Check resource usage
     */
    private checkResourceUsage;
    /**
     * Check health endpoints
     */
    private checkHealthEndpoints;
    /**
     * Add performance benchmark
     */
    addPerformanceBenchmark(benchmark: PerformanceBenchmark): void;
    /**
     * Get supported validation types
     */
    getSupportedValidationTypes(): string[];
}
