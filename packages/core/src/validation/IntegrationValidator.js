/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { execAsync } from '../utils/ProcessUtils.js';
import { Logger } from '../logger/Logger.js';
import { ValidationSeverity, ValidationStatus, ValidationCategory } from './ValidationFramework.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
/**
 * Integration validation automation system
 * Handles system compatibility, performance, and integration testing
 */
export class IntegrationValidator {
    logger;
    config;
    constructor(config) {
        this.logger = new Logger('IntegrationValidator');
        this.config = {
            systemCompatibility: {
                nodeVersions: ['18.x', '20.x', '22.x'],
                operatingSystems: ['linux', 'darwin', 'win32'],
                architectures: ['x64', 'arm64'],
                dependencies: []
            },
            performanceBenchmarks: [],
            integrationTests: {
                enabled: true,
                testCommand: 'npm run test:integration',
                timeout: 300000
            },
            e2eTests: {
                enabled: true,
                testCommand: 'npm run test:e2e',
                timeout: 600000
            },
            loadTesting: {
                enabled: false,
                concurrent: 10,
                duration: 60000,
                targetRps: 100
            },
            monitoringChecks: {
                healthEndpoints: [],
                resourceLimits: {
                    maxMemory: 1024 * 1024 * 1024, // 1GB
                    maxCpu: 80, // 80%
                    maxDiskUsage: 90 // 90%
                }
            },
            ...config
        };
        this.logger.info('IntegrationValidator initialized', {
            systemCompatibility: this.config.systemCompatibility,
            performanceBenchmarks: this.config.performanceBenchmarks.length
        });
    }
    /**
     * Main validation executor for integration testing
     */
    async validateIntegration(context) {
        const results = [];
        this.logger.info('Starting integration validation', {
            taskId: context.taskId
        });
        try {
            // System compatibility validation
            const compatibilityResults = await this.validateSystemCompatibility(context);
            results.push(...compatibilityResults);
            // Performance benchmarks
            const performanceResults = await this.runPerformanceBenchmarks(context);
            results.push(...performanceResults);
            // Integration tests
            if (this.config.integrationTests.enabled) {
                const integrationResults = await this.runIntegrationTests(context);
                results.push(...integrationResults);
            }
            // End-to-end tests
            if (this.config.e2eTests.enabled) {
                const e2eResults = await this.runE2ETests(context);
                results.push(...e2eResults);
            }
            // Load testing
            if (this.config.loadTesting.enabled) {
                const loadResults = await this.runLoadTests(context);
                results.push(...loadResults);
            }
            // Monitoring and health checks
            const monitoringResults = await this.runMonitoringChecks(context);
            results.push(...monitoringResults);
            this.logger.info('Integration validation completed', {
                taskId: context.taskId,
                totalResults: results.length,
                errors: results.filter(r => r.severity === ValidationSeverity.ERROR).length
            });
            return results;
        }
        catch (error) {
            this.logger.error('Integration validation failed', { error, taskId: context.taskId });
            return [{
                    id: `integration-validation-error-${Date.now()}`,
                    category: ValidationCategory.INTEGRATION,
                    severity: ValidationSeverity.ERROR,
                    status: ValidationStatus.FAILED,
                    message: `Integration validation failed: ${error.message}`,
                    timestamp: new Date(),
                    metadata: { error: error.stack }
                }];
        }
    }
    /**
     * Validate system compatibility
     */
    async validateSystemCompatibility(context) {
        const startTime = Date.now();
        const results = [];
        try {
            this.logger.debug('Validating system compatibility');
            // Get current system information
            const systemInfo = await this.getSystemInfo();
            // Check Node.js version compatibility
            const nodeVersionResult = this.checkNodeVersionCompatibility(systemInfo);
            results.push(nodeVersionResult);
            // Check platform compatibility
            const platformResult = this.checkPlatformCompatibility(systemInfo);
            results.push(platformResult);
            // Check architecture compatibility
            const architectureResult = this.checkArchitectureCompatibility(systemInfo);
            results.push(architectureResult);
            // Check dependency compatibility
            const dependencyResults = await this.checkDependencyCompatibility(context);
            results.push(...dependencyResults);
            return results.map(result => ({
                ...result,
                duration: result.duration || (Date.now() - startTime)
            }));
        }
        catch (error) {
            this.logger.error('System compatibility check failed', { error });
            return [{
                    id: `compatibility-error-${Date.now()}`,
                    category: ValidationCategory.INTEGRATION,
                    severity: ValidationSeverity.ERROR,
                    status: ValidationStatus.FAILED,
                    message: `System compatibility check failed: ${error.message}`,
                    timestamp: new Date(),
                    duration: Date.now() - startTime
                }];
        }
    }
    /**
     * Run performance benchmarks
     */
    async runPerformanceBenchmarks(context) {
        if (this.config.performanceBenchmarks.length === 0) {
            return [{
                    id: `performance-no-benchmarks-${Date.now()}`,
                    category: ValidationCategory.PERFORMANCE,
                    severity: ValidationSeverity.INFO,
                    status: ValidationStatus.SKIPPED,
                    message: 'No performance benchmarks configured',
                    timestamp: new Date()
                }];
        }
        const results = [];
        for (const benchmark of this.config.performanceBenchmarks) {
            const startTime = Date.now();
            try {
                this.logger.debug(`Running performance benchmark: ${benchmark.id}`);
                // Run benchmark
                const metrics = await this.executeBenchmark(benchmark, context);
                // Validate against thresholds
                const benchmarkResults = this.validateBenchmarkMetrics(benchmark, metrics);
                results.push(...benchmarkResults.map(result => ({
                    ...result,
                    duration: Date.now() - startTime
                })));
            }
            catch (error) {
                results.push({
                    id: `benchmark-${benchmark.id}-error-${Date.now()}`,
                    category: ValidationCategory.PERFORMANCE,
                    severity: ValidationSeverity.ERROR,
                    status: ValidationStatus.FAILED,
                    message: `Benchmark ${benchmark.name} failed: ${error.message}`,
                    timestamp: new Date(),
                    duration: Date.now() - startTime,
                    metadata: {
                        benchmarkId: benchmark.id,
                        benchmarkName: benchmark.name
                    }
                });
            }
        }
        return results;
    }
    /**
     * Run integration tests
     */
    async runIntegrationTests(context) {
        const startTime = Date.now();
        try {
            this.logger.debug('Running integration tests');
            const command = this.config.integrationTests.testCommand;
            const { stdout, stderr } = await execAsync(command, {
                timeout: this.config.integrationTests.timeout,
                env: { ...process.env, ...this.config.integrationTests.environment }
            });
            // Parse test results
            const testResults = this.parseTestOutput(stdout, stderr);
            return [{
                    id: `integration-tests-${Date.now()}`,
                    category: ValidationCategory.INTEGRATION,
                    severity: testResults.failed > 0 ? ValidationSeverity.ERROR : ValidationSeverity.INFO,
                    status: testResults.failed > 0 ? ValidationStatus.FAILED : ValidationStatus.PASSED,
                    message: `Integration tests: ${testResults.passed} passed, ${testResults.failed} failed, ${testResults.skipped} skipped`,
                    timestamp: new Date(),
                    duration: Date.now() - startTime,
                    metadata: {
                        testResults,
                        command
                    }
                }];
        }
        catch (error) {
            this.logger.error('Integration tests failed', { error });
            return [{
                    id: `integration-tests-error-${Date.now()}`,
                    category: ValidationCategory.INTEGRATION,
                    severity: ValidationSeverity.ERROR,
                    status: ValidationStatus.FAILED,
                    message: `Integration tests failed: ${error.message}`,
                    timestamp: new Date(),
                    duration: Date.now() - startTime
                }];
        }
    }
    /**
     * Run end-to-end tests
     */
    async runE2ETests(context) {
        const startTime = Date.now();
        try {
            this.logger.debug('Running end-to-end tests');
            const command = this.config.e2eTests.testCommand;
            const { stdout, stderr } = await execAsync(command, {
                timeout: this.config.e2eTests.timeout,
                env: { ...process.env, ...this.config.e2eTests.environment }
            });
            // Parse test results
            const testResults = this.parseTestOutput(stdout, stderr);
            return [{
                    id: `e2e-tests-${Date.now()}`,
                    category: ValidationCategory.INTEGRATION,
                    severity: testResults.failed > 0 ? ValidationSeverity.ERROR : ValidationSeverity.INFO,
                    status: testResults.failed > 0 ? ValidationStatus.FAILED : ValidationStatus.PASSED,
                    message: `E2E tests: ${testResults.passed} passed, ${testResults.failed} failed, ${testResults.skipped} skipped`,
                    timestamp: new Date(),
                    duration: Date.now() - startTime,
                    metadata: {
                        testResults,
                        command
                    }
                }];
        }
        catch (error) {
            this.logger.error('E2E tests failed', { error });
            return [{
                    id: `e2e-tests-error-${Date.now()}`,
                    category: ValidationCategory.INTEGRATION,
                    severity: ValidationSeverity.ERROR,
                    status: ValidationStatus.FAILED,
                    message: `E2E tests failed: ${error.message}`,
                    timestamp: new Date(),
                    duration: Date.now() - startTime
                }];
        }
    }
    /**
     * Run load tests
     */
    async runLoadTests(context) {
        const startTime = Date.now();
        try {
            this.logger.debug('Running load tests');
            // Simulate load testing - in practice, this would use tools like Artillery, k6, etc.
            const loadMetrics = await this.simulateLoadTest();
            const rpsThresholdMet = loadMetrics.actualRps >= this.config.loadTesting.targetRps;
            return [{
                    id: `load-tests-${Date.now()}`,
                    category: ValidationCategory.PERFORMANCE,
                    severity: rpsThresholdMet ? ValidationSeverity.INFO : ValidationSeverity.WARNING,
                    status: rpsThresholdMet ? ValidationStatus.PASSED : ValidationStatus.FAILED,
                    message: `Load test: ${loadMetrics.actualRps} RPS (target: ${this.config.loadTesting.targetRps} RPS)`,
                    timestamp: new Date(),
                    duration: Date.now() - startTime,
                    metadata: {
                        loadMetrics,
                        config: this.config.loadTesting
                    }
                }];
        }
        catch (error) {
            this.logger.error('Load tests failed', { error });
            return [{
                    id: `load-tests-error-${Date.now()}`,
                    category: ValidationCategory.PERFORMANCE,
                    severity: ValidationSeverity.ERROR,
                    status: ValidationStatus.FAILED,
                    message: `Load tests failed: ${error.message}`,
                    timestamp: new Date(),
                    duration: Date.now() - startTime
                }];
        }
    }
    /**
     * Run monitoring and health checks
     */
    async runMonitoringChecks(context) {
        const results = [];
        const startTime = Date.now();
        try {
            this.logger.debug('Running monitoring checks');
            // Check resource usage
            const resourceResults = await this.checkResourceUsage();
            results.push(...resourceResults);
            // Check health endpoints
            const healthResults = await this.checkHealthEndpoints();
            results.push(...healthResults);
            return results.map(result => ({
                ...result,
                duration: result.duration || (Date.now() - startTime)
            }));
        }
        catch (error) {
            this.logger.error('Monitoring checks failed', { error });
            return [{
                    id: `monitoring-error-${Date.now()}`,
                    category: ValidationCategory.INTEGRATION,
                    severity: ValidationSeverity.ERROR,
                    status: ValidationStatus.FAILED,
                    message: `Monitoring checks failed: ${error.message}`,
                    timestamp: new Date(),
                    duration: Date.now() - startTime
                }];
        }
    }
    /**
     * Get system information
     */
    async getSystemInfo() {
        return {
            nodeVersion: process.version,
            platform: os.platform(),
            architecture: os.arch(),
            memory: {
                total: os.totalmem(),
                free: os.freemem(),
                used: os.totalmem() - os.freemem()
            },
            cpu: {
                cores: os.cpus().length,
                model: os.cpus()[0]?.model || 'Unknown'
            }
        };
    }
    /**
     * Check Node.js version compatibility
     */
    checkNodeVersionCompatibility(systemInfo) {
        const currentVersion = systemInfo.nodeVersion;
        const majorVersion = parseInt(currentVersion.replace('v', '').split('.')[0]);
        const isCompatible = this.config.systemCompatibility.nodeVersions.some(version => {
            const targetMajor = parseInt(version.replace('x', '').replace('.', ''));
            return majorVersion === targetMajor;
        });
        return {
            id: `node-version-compatibility-${Date.now()}`,
            category: ValidationCategory.INTEGRATION,
            severity: isCompatible ? ValidationSeverity.INFO : ValidationSeverity.ERROR,
            status: isCompatible ? ValidationStatus.PASSED : ValidationStatus.FAILED,
            message: `Node.js version ${currentVersion} ${isCompatible ? 'is compatible' : 'is not compatible'}`,
            timestamp: new Date(),
            metadata: {
                currentVersion,
                supportedVersions: this.config.systemCompatibility.nodeVersions
            }
        };
    }
    /**
     * Check platform compatibility
     */
    checkPlatformCompatibility(systemInfo) {
        const isCompatible = this.config.systemCompatibility.operatingSystems.includes(systemInfo.platform);
        return {
            id: `platform-compatibility-${Date.now()}`,
            category: ValidationCategory.INTEGRATION,
            severity: isCompatible ? ValidationSeverity.INFO : ValidationSeverity.ERROR,
            status: isCompatible ? ValidationStatus.PASSED : ValidationStatus.FAILED,
            message: `Platform ${systemInfo.platform} ${isCompatible ? 'is supported' : 'is not supported'}`,
            timestamp: new Date(),
            metadata: {
                currentPlatform: systemInfo.platform,
                supportedPlatforms: this.config.systemCompatibility.operatingSystems
            }
        };
    }
    /**
     * Check architecture compatibility
     */
    checkArchitectureCompatibility(systemInfo) {
        const isCompatible = this.config.systemCompatibility.architectures.includes(systemInfo.architecture);
        return {
            id: `architecture-compatibility-${Date.now()}`,
            category: ValidationCategory.INTEGRATION,
            severity: isCompatible ? ValidationSeverity.INFO : ValidationSeverity.ERROR,
            status: isCompatible ? ValidationStatus.PASSED : ValidationStatus.FAILED,
            message: `Architecture ${systemInfo.architecture} ${isCompatible ? 'is supported' : 'is not supported'}`,
            timestamp: new Date(),
            metadata: {
                currentArchitecture: systemInfo.architecture,
                supportedArchitectures: this.config.systemCompatibility.architectures
            }
        };
    }
    /**
     * Check dependency compatibility
     */
    async checkDependencyCompatibility(context) {
        const results = [];
        for (const dependency of this.config.systemCompatibility.dependencies) {
            try {
                const command = `npm list ${dependency.name}@${dependency.version} --depth=0`;
                await execAsync(command, { timeout: 10000 });
                results.push({
                    id: `dependency-${dependency.name}-${Date.now()}`,
                    category: ValidationCategory.INTEGRATION,
                    severity: ValidationSeverity.INFO,
                    status: ValidationStatus.PASSED,
                    message: `Dependency ${dependency.name}@${dependency.version} is available`,
                    timestamp: new Date(),
                    metadata: { dependency }
                });
            }
            catch (error) {
                const severity = dependency.optional ? ValidationSeverity.WARNING : ValidationSeverity.ERROR;
                const status = dependency.optional ? ValidationStatus.PASSED : ValidationStatus.FAILED;
                results.push({
                    id: `dependency-${dependency.name}-${Date.now()}`,
                    category: ValidationCategory.INTEGRATION,
                    severity,
                    status,
                    message: `Dependency ${dependency.name}@${dependency.version} is ${dependency.optional ? 'optionally' : ''} missing`,
                    timestamp: new Date(),
                    metadata: { dependency, error: error.message }
                });
            }
        }
        return results;
    }
    /**
     * Execute performance benchmark
     */
    async executeBenchmark(benchmark, context) {
        const startTime = Date.now();
        if (benchmark.testCommand) {
            // Execute custom benchmark command
            await execAsync(benchmark.testCommand, { timeout: 60000 });
        }
        // Get current metrics
        const memoryUsage = process.memoryUsage();
        const endTime = Date.now();
        return {
            responseTime: endTime - startTime,
            throughput: 1000 / (endTime - startTime), // Simplified calculation
            memoryUsage: memoryUsage.heapUsed,
            cpuUsage: 0, // Would need additional monitoring for accurate CPU usage
            timestamp: new Date()
        };
    }
    /**
     * Validate benchmark metrics against thresholds
     */
    validateBenchmarkMetrics(benchmark, metrics) {
        const results = [];
        // Check response time threshold
        if (benchmark.threshold.responseTime) {
            const passed = metrics.responseTime <= benchmark.threshold.responseTime;
            results.push({
                id: `benchmark-${benchmark.id}-response-time-${Date.now()}`,
                category: ValidationCategory.PERFORMANCE,
                severity: passed ? ValidationSeverity.INFO : ValidationSeverity.WARNING,
                status: passed ? ValidationStatus.PASSED : ValidationStatus.FAILED,
                message: `Response time: ${metrics.responseTime}ms (threshold: ${benchmark.threshold.responseTime}ms)`,
                timestamp: new Date(),
                metadata: {
                    benchmarkId: benchmark.id,
                    metric: 'responseTime',
                    actual: metrics.responseTime,
                    threshold: benchmark.threshold.responseTime
                }
            });
        }
        // Check memory usage threshold
        if (benchmark.threshold.memoryUsage) {
            const passed = metrics.memoryUsage <= benchmark.threshold.memoryUsage;
            results.push({
                id: `benchmark-${benchmark.id}-memory-${Date.now()}`,
                category: ValidationCategory.PERFORMANCE,
                severity: passed ? ValidationSeverity.INFO : ValidationSeverity.WARNING,
                status: passed ? ValidationStatus.PASSED : ValidationStatus.FAILED,
                message: `Memory usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB (threshold: ${(benchmark.threshold.memoryUsage / 1024 / 1024).toFixed(2)}MB)`,
                timestamp: new Date(),
                metadata: {
                    benchmarkId: benchmark.id,
                    metric: 'memoryUsage',
                    actual: metrics.memoryUsage,
                    threshold: benchmark.threshold.memoryUsage
                }
            });
        }
        return results;
    }
    /**
     * Parse test output to extract results
     */
    parseTestOutput(stdout, stderr) {
        // Generic test result parsing - would need to be adapted for specific test runners
        const output = stdout + stderr;
        const passedMatch = output.match(/(\d+) passed/i);
        const failedMatch = output.match(/(\d+) failed/i);
        const skippedMatch = output.match(/(\d+) skipped/i);
        return {
            passed: passedMatch ? parseInt(passedMatch[1]) : 0,
            failed: failedMatch ? parseInt(failedMatch[1]) : 0,
            skipped: skippedMatch ? parseInt(skippedMatch[1]) : 0
        };
    }
    /**
     * Simulate load test (placeholder implementation)
     */
    async simulateLoadTest() {
        // This is a simplified simulation - real implementation would use load testing tools
        const duration = this.config.loadTesting.duration;
        const concurrent = this.config.loadTesting.concurrent;
        // Simulate some load
        await new Promise(resolve => setTimeout(resolve, Math.min(duration, 5000)));
        return {
            actualRps: Math.floor(Math.random() * this.config.loadTesting.targetRps * 1.2),
            averageResponseTime: Math.floor(Math.random() * 200) + 50
        };
    }
    /**
     * Check resource usage
     */
    async checkResourceUsage() {
        const results = [];
        const memoryUsage = process.memoryUsage();
        const limits = this.config.monitoringChecks.resourceLimits;
        // Check memory usage
        const memoryPercentage = (memoryUsage.heapUsed / os.totalmem()) * 100;
        const memoryExceeded = memoryUsage.heapUsed > limits.maxMemory;
        results.push({
            id: `resource-memory-${Date.now()}`,
            category: ValidationCategory.INTEGRATION,
            severity: memoryExceeded ? ValidationSeverity.WARNING : ValidationSeverity.INFO,
            status: memoryExceeded ? ValidationStatus.FAILED : ValidationStatus.PASSED,
            message: `Memory usage: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB (${memoryPercentage.toFixed(2)}%)`,
            timestamp: new Date(),
            metadata: {
                memoryUsage: memoryUsage.heapUsed,
                limit: limits.maxMemory,
                percentage: memoryPercentage
            }
        });
        return results;
    }
    /**
     * Check health endpoints
     */
    async checkHealthEndpoints() {
        const results = [];
        for (const endpoint of this.config.monitoringChecks.healthEndpoints) {
            try {
                // Simple HTTP check - would use actual HTTP client in real implementation
                const response = await fetch(endpoint);
                const isHealthy = response.ok;
                results.push({
                    id: `health-${endpoint.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`,
                    category: ValidationCategory.INTEGRATION,
                    severity: isHealthy ? ValidationSeverity.INFO : ValidationSeverity.ERROR,
                    status: isHealthy ? ValidationStatus.PASSED : ValidationStatus.FAILED,
                    message: `Health endpoint ${endpoint}: ${isHealthy ? 'healthy' : 'unhealthy'}`,
                    timestamp: new Date(),
                    metadata: {
                        endpoint,
                        statusCode: response.status,
                        statusText: response.statusText
                    }
                });
            }
            catch (error) {
                results.push({
                    id: `health-${endpoint.replace(/[^a-zA-Z0-9]/g, '-')}-error-${Date.now()}`,
                    category: ValidationCategory.INTEGRATION,
                    severity: ValidationSeverity.ERROR,
                    status: ValidationStatus.FAILED,
                    message: `Health endpoint ${endpoint} check failed: ${error.message}`,
                    timestamp: new Date(),
                    metadata: {
                        endpoint,
                        error: error.message
                    }
                });
            }
        }
        return results;
    }
    /**
     * Add performance benchmark
     */
    addPerformanceBenchmark(benchmark) {
        this.config.performanceBenchmarks.push(benchmark);
        this.logger.info(`Added performance benchmark: ${benchmark.id}`);
    }
    /**
     * Get supported validation types
     */
    getSupportedValidationTypes() {
        return [
            'system-compatibility',
            'performance-benchmarks',
            'integration-tests',
            'e2e-tests',
            'load-testing',
            'monitoring-checks'
        ];
    }
}
//# sourceMappingURL=IntegrationValidator.js.map