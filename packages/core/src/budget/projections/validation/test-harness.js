/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlgorithmValidator } from './algorithm-validator.js';
import { PerformanceMonitor } from './performance-monitor.js';
import { Logger } from '../../utils/logger.js';
/**
 * Comprehensive test harness for cost projection algorithms
 * Provides automated testing, validation, and performance monitoring
 */
export class TestHarness {
    logger;
    validator;
    performanceMonitor;
    testDataCache = new Map();
    constructor() {
        this.logger = new Logger('TestHarness');
        this.validator = new AlgorithmValidator();
        this.performanceMonitor = new PerformanceMonitor();
        this.logger.info('Test harness initialized');
    }
    /**
     * Execute comprehensive test suite for an algorithm
     */
    async executeTestSuite(algorithmSpec, config) {
        const startTime = Date.now();
        this.logger.info(`Executing test suite: ${config.name}`, {
            algorithm: algorithmSpec.name,
            categories: config.categories,
            performanceBenchmarking: config.enablePerformanceBenchmarking,
            continuousMonitoring: config.enableContinuousMonitoring,
        });
        try {
            const result = await this.runTestSuite(algorithmSpec, config);
            const duration = Date.now() - startTime;
            this.logger.info(`Test suite execution completed: ${config.name}`, {
                algorithm: algorithmSpec.name,
                success: result.success,
                executionTime: duration,
                validationTests: result.validationReport.metadata.totalTests,
                performanceBenchmarks: result.performanceBenchmarks.length,
                degradationIssues: result.degradationDetection.reduce((sum, d) => sum + d.issues.length, 0),
            });
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error(`Test suite execution failed: ${config.name}`, {
                algorithm: algorithmSpec.name,
                error: error.message,
                executionTime: duration,
            });
            return {
                config,
                timestamp: new Date(),
                executionTimeMs: duration,
                validationReport: {
                    metadata: {
                        timestamp: new Date(),
                        totalTests: 0,
                        testsPassed: 0,
                        testsFailed: 0,
                        successRate: 0,
                        frameworkVersion: '1.0.0',
                    },
                    results: [],
                    aggregatedMetrics: {
                        averageAccuracy: {
                            mape: 100,
                            rmse: Infinity,
                            mae: Infinity,
                            mse: Infinity,
                            rSquared: 0,
                            smape: 100,
                            medianAPE: 100,
                        },
                        performanceBenchmarks: {
                            executionTimeMs: 0,
                            memoryUsageMB: 0,
                            cpuUsagePercent: 0,
                            complexityScore: 0,
                        },
                        robustnessAssessment: {
                            noiseResistance: 0,
                            outlierSensitivity: 1,
                            edgeCaseHandling: 0,
                            patternConsistency: 0,
                        },
                    },
                    qualityAssessment: {
                        overallScore: 0,
                        categoryScores: {
                            accuracy: 0,
                            performance: 0,
                            robustness: 0,
                            reliability: 0,
                        },
                        recommendations: ['Test suite execution failed'],
                    },
                },
                performanceBenchmarks: [],
                degradationDetection: [],
                success: false,
                error: {
                    message: error.message,
                    stack: error.stack,
                },
            };
        }
    }
    /**
     * Generate comprehensive test data sets
     */
    generateTestData(configs) {
        const startTime = Date.now();
        this.logger.info('Generating test data sets', {
            configCount: configs.length,
        });
        const testDataSets = new Map();
        try {
            configs.forEach((config) => {
                const cacheKey = this.createCacheKey(config);
                // Check cache first
                if (this.testDataCache.has(cacheKey)) {
                    testDataSets.set(config.type, this.testDataCache.get(cacheKey));
                    return;
                }
                // Generate new data
                const data = this.generateDataByType(config);
                testDataSets.set(config.type, data);
                this.testDataCache.set(cacheKey, data);
                this.logger.info(`Generated ${config.type} test data`, {
                    dataPoints: data.length,
                    baseValue: config.baseValue,
                });
            });
            const duration = Date.now() - startTime;
            this.logger.info('Test data generation completed', {
                dataSetCount: testDataSets.size,
                generationTime: duration,
            });
            return testDataSets;
        }
        catch (error) {
            this.logger.error('Test data generation failed', {
                error: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }
    /**
     * Run batch validation across multiple algorithms
     */
    async runBatchValidation(algorithmSpecs, testSuiteConfig) {
        const startTime = Date.now();
        this.logger.info('Running batch validation', {
            algorithmCount: algorithmSpecs.length,
            testSuite: testSuiteConfig.name,
        });
        const results = new Map();
        try {
            // Execute tests for each algorithm
            for (const algorithmSpec of algorithmSpecs) {
                this.logger.info(`Testing algorithm: ${algorithmSpec.name}`);
                try {
                    const result = await this.executeTestSuite(algorithmSpec, testSuiteConfig);
                    results.set(algorithmSpec.id, result);
                    // Log immediate feedback
                    if (result.success) {
                        this.logger.info(`✓ ${algorithmSpec.name} passed validation`);
                    }
                    else {
                        this.logger.warn(`✗ ${algorithmSpec.name} failed validation`, {
                            failureCount: result.validationReport.metadata.testsFailed,
                        });
                    }
                }
                catch (error) {
                    this.logger.error(`Algorithm validation failed: ${algorithmSpec.name}`, {
                        error: error.message,
                    });
                    // Continue with other algorithms
                }
            }
            const duration = Date.now() - startTime;
            const successCount = Array.from(results.values()).filter((r) => r.success).length;
            this.logger.info('Batch validation completed', {
                totalAlgorithms: algorithmSpecs.length,
                successfulAlgorithms: successCount,
                failedAlgorithms: algorithmSpecs.length - successCount,
                batchExecutionTime: duration,
            });
            return results;
        }
        catch (error) {
            this.logger.error('Batch validation failed', {
                error: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }
    /**
     * Generate comprehensive test report
     */
    generateComprehensiveReport(results) {
        this.logger.info('Generating comprehensive test report', {
            resultCount: results.size,
        });
        const totalAlgorithms = results.size;
        const successfulResults = Array.from(results.values()).filter((r) => r.success);
        const successfulAlgorithms = successfulResults.length;
        const failedAlgorithms = totalAlgorithms - successfulAlgorithms;
        const overallSuccessRate = totalAlgorithms > 0 ? (successfulAlgorithms / totalAlgorithms) * 100 : 0;
        // Calculate average quality score
        const qualityScores = Array.from(results.values()).map((r) => r.validationReport.qualityAssessment.overallScore);
        const averageQualityScore = qualityScores.length > 0
            ? qualityScores.reduce((sum, score) => sum + score, 0) /
                qualityScores.length
            : 0;
        // Generate algorithm-specific results
        const algorithmResults = Array.from(results.entries()).map(([algorithmId, result]) => ({
            algorithm: algorithmId,
            success: result.success,
            qualityScore: result.validationReport.qualityAssessment.overallScore,
            performanceScore: this.calculatePerformanceScore(result.performanceBenchmarks),
            issues: this.extractIssues(result),
            recommendations: result.validationReport.qualityAssessment.recommendations,
        }));
        // Find best and worst performing algorithms
        const sortedByQuality = algorithmResults
            .slice()
            .sort((a, b) => b.qualityScore - a.qualityScore);
        const bestPerformingAlgorithm = sortedByQuality[0]?.algorithm || 'None';
        const worstPerformingAlgorithm = sortedByQuality[sortedByQuality.length - 1]?.algorithm || 'None';
        // Identify common issues
        const allIssues = algorithmResults.flatMap((r) => r.issues);
        const issueFrequency = new Map();
        allIssues.forEach((issue) => {
            issueFrequency.set(issue, (issueFrequency.get(issue) || 0) + 1);
        });
        const commonIssues = Array.from(issueFrequency.entries())
            .filter(([, frequency]) => frequency > 1)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([issue]) => issue);
        // Generate overall recommendations
        const overallRecommendations = this.generateOverallRecommendations(algorithmResults, commonIssues);
        this.logger.info('Comprehensive test report generated', {
            totalAlgorithms,
            successfulAlgorithms,
            overallSuccessRate,
            averageQualityScore,
            bestPerformingAlgorithm,
        });
        return {
            summary: {
                totalAlgorithms,
                successfulAlgorithms,
                failedAlgorithms,
                overallSuccessRate,
                averageQualityScore,
            },
            algorithmResults,
            qualityAssessment: {
                bestPerformingAlgorithm,
                worstPerformingAlgorithm,
                commonIssues,
                overallRecommendations,
            },
        };
    }
    /**
     * Start continuous testing mode
     */
    startContinuousTesting(algorithmSpecs, config, intervalMs = 3600000) {
        this.logger.info('Starting continuous testing mode', {
            algorithmCount: algorithmSpecs.length,
            intervalMs,
        });
        if (config.enableContinuousMonitoring) {
            this.performanceMonitor.startContinuousMonitoring();
        }
        return setInterval(async () => {
            try {
                this.logger.info('Running scheduled continuous testing');
                const results = await this.runBatchValidation(algorithmSpecs, config);
                const report = this.generateComprehensiveReport(results);
                // Log summary of continuous testing results
                this.logger.info('Continuous testing cycle completed', {
                    successRate: report.summary.overallSuccessRate,
                    averageQuality: report.summary.averageQualityScore,
                    issuesFound: report.qualityAssessment.commonIssues.length,
                });
                // Alert on significant quality degradation
                if (report.summary.averageQualityScore < 70) {
                    this.logger.warn('Quality degradation detected in continuous testing', {
                        averageQualityScore: report.summary.averageQualityScore,
                        failedAlgorithms: report.summary.failedAlgorithms,
                    });
                }
            }
            catch (error) {
                this.logger.error('Continuous testing cycle failed', {
                    error: error.message,
                });
            }
        }, intervalMs);
    }
    // Private helper methods
    async runTestSuite(algorithmSpec, config) {
        const timestamp = new Date();
        // Add custom test cases if provided
        if (algorithmSpec.customTestCases) {
            algorithmSpec.customTestCases.forEach((testCase) => {
                this.validator.addTestCase(testCase);
            });
        }
        // Run validation suite
        const validationReport = await this.validator.runValidationSuite(algorithmSpec.algorithm, config.categories);
        // Run performance benchmarking if enabled
        const performanceBenchmarks = [];
        if (config.enablePerformanceBenchmarking) {
            const testDataConfigs = [
                { type: 'random', dataPoints: 100, baseValue: 50, parameters: {} },
                { type: 'random', dataPoints: 1000, baseValue: 50, parameters: {} },
                { type: 'random', dataPoints: 10000, baseValue: 50, parameters: {} },
            ];
            const testDataSets = this.generateTestData(testDataConfigs);
            for (const [dataType, testData] of testDataSets) {
                const benchmark = await this.performanceMonitor.benchmarkAlgorithm(`${algorithmSpec.name}_${dataType}`, algorithmSpec.algorithm, testData);
                performanceBenchmarks.push(benchmark);
            }
        }
        // Run degradation detection if continuous monitoring is enabled
        const degradationDetection = [];
        if (config.enableContinuousMonitoring) {
            try {
                const degradation = await this.performanceMonitor.detectPerformanceDegradation(algorithmSpec.name);
                if (degradation) {
                    degradationDetection.push(degradation);
                }
            }
            catch (error) {
                this.logger.warn('Degradation detection failed', {
                    algorithm: algorithmSpec.name,
                    error: error.message,
                });
            }
        }
        // Determine overall success
        const success = validationReport.metadata.successRate >= 80 &&
            validationReport.qualityAssessment.overallScore >= 70 &&
            degradationDetection.every((d) => d.issues.every((i) => i.severity !== 'critical'));
        return {
            config,
            timestamp,
            executionTimeMs: Date.now() - timestamp.getTime(),
            validationReport,
            performanceBenchmarks,
            degradationDetection,
            success,
        };
    }
    generateDataByType(config) {
        const data = [];
        const startDate = new Date();
        switch (config.type) {
            case 'linear':
                return this.generateLinearData(config, startDate);
            case 'seasonal':
                return this.generateSeasonalData(config, startDate);
            case 'random':
                return this.generateRandomData(config, startDate);
            case 'noisy':
                return this.generateNoisyData(config, startDate);
            case 'outliers':
                return this.generateOutlierData(config, startDate);
            case 'mixed':
                return this.generateMixedData(config, startDate);
            default:
                return this.generateRandomData(config, startDate);
        }
    }
    generateLinearData(config, startDate) {
        const slope = config.parameters.slope || 1;
        const data = [];
        for (let i = 0; i < config.dataPoints; i++) {
            const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            const cost = config.baseValue + slope * i + (Math.random() - 0.5) * 2;
            data.push(this.createDataPoint(date, Math.max(0, cost), cost * 100));
        }
        return data;
    }
    generateSeasonalData(config, startDate) {
        const amplitude = config.parameters.amplitude || config.baseValue * 0.3;
        const period = config.parameters.period || 365;
        const data = [];
        for (let i = 0; i < config.dataPoints; i++) {
            const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            const seasonal = Math.sin((i / period) * 2 * Math.PI) * amplitude;
            const cost = config.baseValue + seasonal + (Math.random() - 0.5) * 2;
            data.push(this.createDataPoint(date, Math.max(0, cost), cost * 100));
        }
        return data;
    }
    generateRandomData(config, startDate) {
        const variance = config.parameters.variance || config.baseValue * 0.2;
        const data = [];
        for (let i = 0; i < config.dataPoints; i++) {
            const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            const cost = config.baseValue + (Math.random() - 0.5) * variance * 2;
            data.push(this.createDataPoint(date, Math.max(0, cost), cost * 100));
        }
        return data;
    }
    generateNoisyData(config, startDate) {
        const noiseLevel = config.parameters.noiseLevel || 0.3;
        const baseData = this.generateLinearData(config, startDate);
        return baseData.map((point) => ({
            ...point,
            cost: point.cost * (1 + (Math.random() - 0.5) * noiseLevel),
        }));
    }
    generateOutlierData(config, startDate) {
        const outlierCount = config.parameters.outlierCount || Math.floor(config.dataPoints * 0.05);
        const baseData = this.generateRandomData(config, startDate);
        // Add outliers
        for (let i = 0; i < outlierCount; i++) {
            const index = Math.floor(Math.random() * baseData.length);
            baseData[index].cost *= 5 + Math.random() * 5; // Make it a significant outlier
        }
        return baseData;
    }
    generateMixedData(config, startDate) {
        const quarterSize = Math.floor(config.dataPoints / 4);
        const mixedData = [];
        // Quarter 1: Linear trend
        const linearData = this.generateLinearData({ ...config, dataPoints: quarterSize }, startDate);
        mixedData.push(...linearData);
        // Quarter 2: Seasonal pattern
        const seasonalData = this.generateSeasonalData({ ...config, dataPoints: quarterSize }, new Date(startDate.getTime() + quarterSize * 24 * 60 * 60 * 1000));
        mixedData.push(...seasonalData);
        // Quarter 3: Random data
        const randomData = this.generateRandomData({ ...config, dataPoints: quarterSize }, new Date(startDate.getTime() + quarterSize * 2 * 24 * 60 * 60 * 1000));
        mixedData.push(...randomData);
        // Quarter 4: Data with outliers
        const outlierData = this.generateOutlierData({ ...config, dataPoints: config.dataPoints - quarterSize * 3 }, new Date(startDate.getTime() + quarterSize * 3 * 24 * 60 * 60 * 1000));
        mixedData.push(...outlierData);
        return mixedData;
    }
    createDataPoint(timestamp, cost, tokens) {
        return {
            timestamp,
            cost,
            tokens,
            context: {
                feature: 'test-harness',
                user: 'test-user',
                model: 'test-model',
                session: `test-${Date.now()}`,
            },
        };
    }
    createCacheKey(config) {
        return JSON.stringify({
            type: config.type,
            dataPoints: config.dataPoints,
            baseValue: config.baseValue,
            parameters: config.parameters,
        });
    }
    calculatePerformanceScore(benchmarks) {
        if (benchmarks.length === 0)
            return 0;
        const scores = benchmarks.map((benchmark) => {
            // Simple scoring based on execution time and memory usage
            const timeScore = Math.max(0, 100 - benchmark.metrics.executionTime / 100);
            const memoryScore = Math.max(0, 100 - benchmark.metrics.memoryUsage);
            const throughputScore = Math.min(100, benchmark.metrics.throughput / 10);
            return (timeScore + memoryScore + throughputScore) / 3;
        });
        return scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }
    extractIssues(result) {
        const issues = [];
        // Extract validation issues
        const failedTests = result.validationReport.results.filter((r) => !r.success);
        failedTests.forEach((test) => {
            if (test.error) {
                issues.push(`Validation failed: ${test.testCase.description} - ${test.error.message}`);
            }
        });
        // Extract degradation issues
        result.degradationDetection.forEach((degradation) => {
            degradation.issues.forEach((issue) => {
                issues.push(`Performance ${issue.type}: ${issue.description}`);
            });
        });
        // Extract quality issues
        const qualityScore = result.validationReport.qualityAssessment.overallScore;
        if (qualityScore < 70) {
            issues.push(`Low overall quality score: ${qualityScore}`);
        }
        return issues;
    }
    generateOverallRecommendations(algorithmResults, commonIssues) {
        const recommendations = [];
        // Address common issues
        if (commonIssues.length > 0) {
            recommendations.push('Address common issues across multiple algorithms:');
            commonIssues.forEach((issue) => {
                recommendations.push(`  • ${issue}`);
            });
        }
        // Performance recommendations
        const performanceIssues = commonIssues.filter((issue) => issue.includes('performance') ||
            issue.includes('execution') ||
            issue.includes('memory'));
        if (performanceIssues.length > 0) {
            recommendations.push('Optimize algorithm performance across the board');
            recommendations.push('Consider implementing caching and memoization strategies');
        }
        // Quality recommendations
        const failedAlgorithms = algorithmResults.filter((r) => !r.success);
        if (failedAlgorithms.length > 0) {
            recommendations.push(`Review and fix ${failedAlgorithms.length} failed algorithm(s)`);
            recommendations.push('Implement additional error handling and edge case management');
        }
        // Testing recommendations
        recommendations.push('Maintain regular testing schedule with continuous monitoring');
        recommendations.push('Expand test coverage for edge cases and error conditions');
        return recommendations;
    }
}
//# sourceMappingURL=test-harness.js.map