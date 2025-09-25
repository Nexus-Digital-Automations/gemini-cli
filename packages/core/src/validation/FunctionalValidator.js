/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { execAsync } from '../utils/ProcessUtils.js';
import { Logger } from '../logger/Logger.js';
import { ValidationSeverity, ValidationStatus, ValidationCategory, } from './ValidationFramework.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
/**
 * Functional validation automation system
 * Handles testing, behavior verification, and functional correctness
 */
export class FunctionalValidator {
    logger;
    config;
    constructor(config) {
        this.logger = new Logger('FunctionalValidator');
        this.config = {
            testFrameworks: ['vitest', 'jest'],
            coverageThreshold: {
                lines: 80,
                functions: 80,
                branches: 70,
                statements: 80,
            },
            testPatterns: ['**/*.test.ts', '**/*.spec.ts'],
            behaviorValidation: {
                enabled: true,
                scenarios: [],
            },
            performanceThresholds: {
                maxExecutionTime: 30000, // 30 seconds
                maxMemoryUsage: 512 * 1024 * 1024, // 512MB
            },
            ...config,
        };
        this.logger.info('FunctionalValidator initialized', {
            testFrameworks: this.config.testFrameworks,
            coverageThreshold: this.config.coverageThreshold,
        });
    }
    /**
     * Main validation executor for functional testing
     */
    async validateFunctionality(context) {
        const results = [];
        this.logger.info('Starting functional validation', {
            taskId: context.taskId,
            testFrameworks: this.config.testFrameworks,
        });
        try {
            // Run unit tests
            for (const framework of this.config.testFrameworks) {
                const testResults = await this.runTests(framework, context);
                results.push(...testResults);
            }
            // Run coverage analysis
            const coverageResults = await this.analyzeCoverage(context);
            results.push(...coverageResults);
            // Run behavior validation
            if (this.config.behaviorValidation.enabled) {
                const behaviorResults = await this.runBehaviorValidation(context);
                results.push(...behaviorResults);
            }
            // Run performance validation
            const performanceResults = await this.runPerformanceValidation(context);
            results.push(...performanceResults);
            this.logger.info('Functional validation completed', {
                taskId: context.taskId,
                totalResults: results.length,
                errors: results.filter((r) => r.severity === ValidationSeverity.ERROR)
                    .length,
            });
            return results;
        }
        catch (error) {
            this.logger.error('Functional validation failed', {
                error,
                taskId: context.taskId,
            });
            return [
                {
                    id: `functional-validation-error-${Date.now()}`,
                    category: ValidationCategory.FUNCTIONAL,
                    severity: ValidationSeverity.ERROR,
                    status: ValidationStatus.FAILED,
                    message: `Functional validation failed: ${error.message}`,
                    timestamp: new Date(),
                    metadata: { error: error.stack },
                },
            ];
        }
    }
    /**
     * Run tests using specified framework
     */
    async runTests(framework, context) {
        const startTime = Date.now();
        const results = [];
        try {
            this.logger.debug(`Running tests with ${framework}`);
            // Check if test framework is available
            const hasFramework = await this.checkFrameworkAvailability(framework);
            if (!hasFramework) {
                return [
                    {
                        id: `${framework}-unavailable-${Date.now()}`,
                        category: ValidationCategory.FUNCTIONAL,
                        severity: ValidationSeverity.WARNING,
                        status: ValidationStatus.SKIPPED,
                        message: `Test framework ${framework} is not available`,
                        timestamp: new Date(),
                        duration: Date.now() - startTime,
                    },
                ];
            }
            // Build test command
            const command = this.buildTestCommand(framework, context);
            const { stdout, stderr } = await execAsync(command, { timeout: 300000 });
            // Parse test results
            const testResults = await this.parseTestResults(framework, stdout, stderr);
            // Convert to ValidationResults
            for (const testResult of testResults) {
                const severity = testResult.status === 'failed'
                    ? ValidationSeverity.ERROR
                    : testResult.status === 'skipped'
                        ? ValidationSeverity.WARNING
                        : ValidationSeverity.INFO;
                const status = testResult.status === 'failed'
                    ? ValidationStatus.FAILED
                    : testResult.status === 'skipped'
                        ? ValidationStatus.SKIPPED
                        : ValidationStatus.PASSED;
                results.push({
                    id: `${framework}-${testResult.name}-${Date.now()}`,
                    category: ValidationCategory.FUNCTIONAL,
                    severity,
                    status,
                    message: testResult.error || `Test ${testResult.status}`,
                    file: testResult.file,
                    line: testResult.line,
                    timestamp: new Date(),
                    duration: testResult.duration || Date.now() - startTime,
                    metadata: {
                        framework,
                        testName: testResult.name,
                    },
                });
            }
            // Add summary result
            const passed = testResults.filter((t) => t.status === 'passed').length;
            const failed = testResults.filter((t) => t.status === 'failed').length;
            const skipped = testResults.filter((t) => t.status === 'skipped').length;
            results.push({
                id: `${framework}-summary-${Date.now()}`,
                category: ValidationCategory.FUNCTIONAL,
                severity: failed > 0 ? ValidationSeverity.ERROR : ValidationSeverity.INFO,
                status: failed > 0 ? ValidationStatus.FAILED : ValidationStatus.PASSED,
                message: `Tests completed: ${passed} passed, ${failed} failed, ${skipped} skipped`,
                timestamp: new Date(),
                duration: Date.now() - startTime,
                metadata: {
                    framework,
                    totalTests: testResults.length,
                    passed,
                    failed,
                    skipped,
                },
            });
            return results;
        }
        catch (error) {
            this.logger.error(`${framework} test execution failed`, { error });
            return [
                {
                    id: `${framework}-error-${Date.now()}`,
                    category: ValidationCategory.FUNCTIONAL,
                    severity: ValidationSeverity.ERROR,
                    status: ValidationStatus.FAILED,
                    message: `${framework} execution failed: ${error.message}`,
                    timestamp: new Date(),
                    duration: Date.now() - startTime,
                    metadata: { framework },
                },
            ];
        }
    }
    /**
     * Analyze test coverage
     */
    async analyzeCoverage(context) {
        const startTime = Date.now();
        try {
            this.logger.debug('Analyzing test coverage');
            // Run coverage analysis (assuming vitest is primary framework)
            const command = 'npx vitest run --coverage --reporter=json';
            const { stdout } = await execAsync(command, { timeout: 240000 });
            // Parse coverage report
            const coverageReport = await this.parseCoverageReport(stdout);
            const results = [];
            // Check coverage thresholds
            const thresholds = this.config.coverageThreshold;
            const metrics = [
                {
                    name: 'lines',
                    actual: coverageReport.lines.percentage,
                    threshold: thresholds.lines,
                },
                {
                    name: 'functions',
                    actual: coverageReport.functions.percentage,
                    threshold: thresholds.functions,
                },
                {
                    name: 'branches',
                    actual: coverageReport.branches.percentage,
                    threshold: thresholds.branches,
                },
                {
                    name: 'statements',
                    actual: coverageReport.statements.percentage,
                    threshold: thresholds.statements,
                },
            ];
            for (const metric of metrics) {
                const severity = metric.actual < metric.threshold
                    ? ValidationSeverity.ERROR
                    : ValidationSeverity.INFO;
                const status = metric.actual < metric.threshold
                    ? ValidationStatus.FAILED
                    : ValidationStatus.PASSED;
                results.push({
                    id: `coverage-${metric.name}-${Date.now()}`,
                    category: ValidationCategory.FUNCTIONAL,
                    severity,
                    status,
                    message: `${metric.name} coverage: ${metric.actual.toFixed(2)}% (threshold: ${metric.threshold}%)`,
                    timestamp: new Date(),
                    duration: Date.now() - startTime,
                    metadata: {
                        metric: metric.name,
                        actual: metric.actual,
                        threshold: metric.threshold,
                        total: coverageReport[metric.name]?.total || 0,
                        covered: coverageReport[metric.name]?.covered || 0,
                    },
                });
            }
            return results;
        }
        catch (error) {
            this.logger.error('Coverage analysis failed', { error });
            return [
                {
                    id: `coverage-error-${Date.now()}`,
                    category: ValidationCategory.FUNCTIONAL,
                    severity: ValidationSeverity.WARNING,
                    status: ValidationStatus.FAILED,
                    message: `Coverage analysis failed: ${error.message}`,
                    timestamp: new Date(),
                    duration: Date.now() - startTime,
                },
            ];
        }
    }
    /**
     * Run behavior validation scenarios
     */
    async runBehaviorValidation(context) {
        if (!this.config.behaviorValidation.scenarios.length) {
            return [
                {
                    id: `behavior-no-scenarios-${Date.now()}`,
                    category: ValidationCategory.FUNCTIONAL,
                    severity: ValidationSeverity.INFO,
                    status: ValidationStatus.SKIPPED,
                    message: 'No behavior validation scenarios configured',
                    timestamp: new Date(),
                },
            ];
        }
        const results = [];
        for (const scenario of this.config.behaviorValidation.scenarios) {
            const startTime = Date.now();
            try {
                this.logger.debug(`Running behavior scenario: ${scenario.id}`);
                // Setup
                if (scenario.setup) {
                    await scenario.setup();
                }
                // Execute
                const result = await scenario.execute();
                // Validate
                const isValid = await scenario.validate(result);
                // Cleanup
                if (scenario.cleanup) {
                    await scenario.cleanup();
                }
                results.push({
                    id: `behavior-${scenario.id}-${Date.now()}`,
                    category: ValidationCategory.FUNCTIONAL,
                    severity: isValid
                        ? ValidationSeverity.INFO
                        : ValidationSeverity.ERROR,
                    status: isValid ? ValidationStatus.PASSED : ValidationStatus.FAILED,
                    message: `Behavior scenario ${scenario.description}: ${isValid ? 'passed' : 'failed'}`,
                    timestamp: new Date(),
                    duration: Date.now() - startTime,
                    metadata: {
                        scenarioId: scenario.id,
                        description: scenario.description,
                    },
                });
            }
            catch (error) {
                // Ensure cleanup runs even on error
                if (scenario.cleanup) {
                    try {
                        await scenario.cleanup();
                    }
                    catch (cleanupError) {
                        this.logger.warn('Scenario cleanup failed', { cleanupError });
                    }
                }
                results.push({
                    id: `behavior-${scenario.id}-error-${Date.now()}`,
                    category: ValidationCategory.FUNCTIONAL,
                    severity: ValidationSeverity.ERROR,
                    status: ValidationStatus.FAILED,
                    message: `Behavior scenario ${scenario.description} failed: ${error.message}`,
                    timestamp: new Date(),
                    duration: Date.now() - startTime,
                    metadata: {
                        scenarioId: scenario.id,
                        description: scenario.description,
                        error: error.stack,
                    },
                });
            }
        }
        return results;
    }
    /**
     * Run performance validation
     */
    async runPerformanceValidation(context) {
        const startTime = Date.now();
        const results = [];
        try {
            this.logger.debug('Running performance validation');
            // Monitor execution time
            const executionStartTime = process.hrtime.bigint();
            // Simulate task execution or run actual performance tests
            const performanceTestCommand = 'npm test -- --run --reporter=json';
            const { stdout } = await execAsync(performanceTestCommand, {
                timeout: this.config.performanceThresholds.maxExecutionTime,
            });
            const executionEndTime = process.hrtime.bigint();
            const executionTime = Number(executionEndTime - executionStartTime) / 1000000; // Convert to ms
            // Check execution time threshold
            const timeThresholdExceeded = executionTime > this.config.performanceThresholds.maxExecutionTime;
            results.push({
                id: `performance-execution-time-${Date.now()}`,
                category: ValidationCategory.PERFORMANCE,
                severity: timeThresholdExceeded
                    ? ValidationSeverity.WARNING
                    : ValidationSeverity.INFO,
                status: timeThresholdExceeded
                    ? ValidationStatus.FAILED
                    : ValidationStatus.PASSED,
                message: `Execution time: ${executionTime.toFixed(2)}ms (threshold: ${this.config.performanceThresholds.maxExecutionTime}ms)`,
                timestamp: new Date(),
                duration: Date.now() - startTime,
                metadata: {
                    executionTime,
                    threshold: this.config.performanceThresholds.maxExecutionTime,
                },
            });
            // Check memory usage
            const memoryUsage = process.memoryUsage();
            const memoryThresholdExceeded = memoryUsage.heapUsed > this.config.performanceThresholds.maxMemoryUsage;
            results.push({
                id: `performance-memory-usage-${Date.now()}`,
                category: ValidationCategory.PERFORMANCE,
                severity: memoryThresholdExceeded
                    ? ValidationSeverity.WARNING
                    : ValidationSeverity.INFO,
                status: memoryThresholdExceeded
                    ? ValidationStatus.FAILED
                    : ValidationStatus.PASSED,
                message: `Memory usage: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB (threshold: ${(this.config.performanceThresholds.maxMemoryUsage / 1024 / 1024).toFixed(2)}MB)`,
                timestamp: new Date(),
                duration: Date.now() - startTime,
                metadata: {
                    memoryUsage: memoryUsage.heapUsed,
                    threshold: this.config.performanceThresholds.maxMemoryUsage,
                },
            });
            return results;
        }
        catch (error) {
            this.logger.error('Performance validation failed', { error });
            return [
                {
                    id: `performance-error-${Date.now()}`,
                    category: ValidationCategory.PERFORMANCE,
                    severity: ValidationSeverity.WARNING,
                    status: ValidationStatus.FAILED,
                    message: `Performance validation failed: ${error.message}`,
                    timestamp: new Date(),
                    duration: Date.now() - startTime,
                },
            ];
        }
    }
    /**
     * Check if test framework is available
     */
    async checkFrameworkAvailability(framework) {
        try {
            const command = `npx ${framework} --version`;
            await execAsync(command, { timeout: 10000 });
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Build test command for framework
     */
    buildTestCommand(framework, context) {
        const baseCommand = `npx ${framework}`;
        switch (framework.toLowerCase()) {
            case 'vitest':
                return `${baseCommand} run --reporter=json`;
            case 'jest':
                return `${baseCommand} --json --testLocationInResults`;
            default:
                return `${baseCommand} --reporter json`;
        }
    }
    /**
     * Parse test results from framework output
     */
    async parseTestResults(framework, stdout, stderr) {
        const results = [];
        try {
            let testData;
            switch (framework.toLowerCase()) {
                case 'vitest':
                    // Parse Vitest JSON output
                    testData = JSON.parse(stdout);
                    if (testData.testResults) {
                        for (const suite of testData.testResults) {
                            for (const test of suite.assertionResults || []) {
                                results.push({
                                    name: test.title,
                                    status: test.status === 'passed'
                                        ? 'passed'
                                        : test.status === 'skipped'
                                            ? 'skipped'
                                            : 'failed',
                                    duration: test.duration,
                                    error: test.failureMessages?.[0],
                                    file: suite.name,
                                });
                            }
                        }
                    }
                    break;
                case 'jest':
                    // Parse Jest JSON output
                    testData = JSON.parse(stdout);
                    if (testData.testResults) {
                        for (const suite of testData.testResults) {
                            for (const test of suite.assertionResults) {
                                results.push({
                                    name: test.fullName,
                                    status: test.status,
                                    duration: test.duration,
                                    error: test.failureMessages?.[0],
                                    file: suite.testFilePath,
                                    line: test.location?.line,
                                });
                            }
                        }
                    }
                    break;
                default:
                    // Generic parsing - attempt to parse as JSON
                    testData = JSON.parse(stdout);
                    // Implementation depends on framework-specific format
                    break;
            }
        }
        catch (error) {
            this.logger.warn(`Failed to parse ${framework} results`, { error });
            // Return generic result
            results.push({
                name: 'Parse Error',
                status: 'failed',
                error: `Failed to parse ${framework} output: ${error.message}`,
            });
        }
        return results;
    }
    /**
     * Parse coverage report from output
     */
    async parseCoverageReport(output) {
        try {
            const coverageData = JSON.parse(output);
            // Default structure - adapt based on actual coverage tool output
            return {
                lines: {
                    total: coverageData.total?.lines?.total || 0,
                    covered: coverageData.total?.lines?.covered || 0,
                    percentage: coverageData.total?.lines?.pct || 0,
                },
                functions: {
                    total: coverageData.total?.functions?.total || 0,
                    covered: coverageData.total?.functions?.covered || 0,
                    percentage: coverageData.total?.functions?.pct || 0,
                },
                branches: {
                    total: coverageData.total?.branches?.total || 0,
                    covered: coverageData.total?.branches?.covered || 0,
                    percentage: coverageData.total?.branches?.pct || 0,
                },
                statements: {
                    total: coverageData.total?.statements?.total || 0,
                    covered: coverageData.total?.statements?.covered || 0,
                    percentage: coverageData.total?.statements?.pct || 0,
                },
            };
        }
        catch (error) {
            this.logger.warn('Failed to parse coverage report', { error });
            return {
                lines: { total: 0, covered: 0, percentage: 0 },
                functions: { total: 0, covered: 0, percentage: 0 },
                branches: { total: 0, covered: 0, percentage: 0 },
                statements: { total: 0, covered: 0, percentage: 0 },
            };
        }
    }
    /**
     * Add behavior validation scenario
     */
    addBehaviorScenario(scenario) {
        this.config.behaviorValidation.scenarios.push(scenario);
        this.logger.info(`Added behavior scenario: ${scenario.id}`);
    }
    /**
     * Get supported test frameworks
     */
    getSupportedFrameworks() {
        return ['vitest', 'jest', 'mocha', 'jasmine'];
    }
}
//# sourceMappingURL=FunctionalValidator.js.map