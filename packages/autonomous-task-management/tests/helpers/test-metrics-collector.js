/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
/**
 * Advanced Test Metrics Collector
 *
 * This class provides comprehensive test metrics collection capabilities including:
 * - Test execution metrics (duration, success rate, failure patterns)
 * - Performance metrics (memory usage, CPU utilization, throughput)
 * - Quality metrics (coverage, code complexity, maintainability)
 * - Trend analysis over time
 * - Anomaly detection
 * - Automated insights and recommendations
 */
export class TestMetricsCollector {
    outputDir;
    metrics = {
        timestamp: new Date().toISOString(),
        environment: this.getEnvironmentInfo(),
        execution: {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            skippedTests: 0,
            totalDuration: 0,
            averageDuration: 0,
            slowestTest: null,
            fastestTest: null
        },
        performance: {
            memoryUsage: {
                initial: 0,
                peak: 0,
                final: 0,
                average: 0
            },
            cpuUsage: {
                average: 0,
                peak: 0
            },
            throughput: {
                testsPerSecond: 0,
                operationsPerSecond: 0
            }
        },
        quality: {
            coverage: {
                statements: 0,
                branches: 0,
                functions: 0,
                lines: 0
            },
            complexity: {
                average: 0,
                highest: 0,
                distribution: {}
            },
            maintainability: {
                score: 0,
                issues: []
            }
        },
        trends: {
            historical: [],
            predictions: null
        },
        anomalies: [],
        insights: [],
        recommendations: []
    };
    startTime = Date.now();
    memorySnapshots = [];
    performanceMarkers = new Map();
    testResults = new Map();
    constructor(outputDir = './test-metrics') {
        this.outputDir = outputDir;
        this.ensureOutputDirectory();
        this.startMonitoring();
    }
    async ensureOutputDirectory() {
        if (!existsSync(this.outputDir)) {
            await mkdir(this.outputDir, { recursive: true });
        }
    }
    getEnvironmentInfo() {
        return {
            nodeVersion: process.version,
            platform: process.platform,
            architecture: process.arch,
            cpuCount: require('node:os').cpus().length,
            totalMemory: require('node:os').totalmem(),
            freeMemory: require('node:os').freemem(),
            ci: process.env.CI === 'true',
            testEnvironment: process.env.NODE_ENV || 'development'
        };
    }
    startMonitoring() {
        // Initial memory snapshot
        this.metrics.performance.memoryUsage.initial = process.memoryUsage().heapUsed;
        this.memorySnapshots.push(this.metrics.performance.memoryUsage.initial);
        // Monitor memory usage during test execution
        const memoryInterval = setInterval(() => {
            const currentMemory = process.memoryUsage().heapUsed;
            this.memorySnapshots.push(currentMemory);
            // Update peak memory usage
            if (currentMemory > this.metrics.performance.memoryUsage.peak) {
                this.metrics.performance.memoryUsage.peak = currentMemory;
            }
        }, 1000); // Every second
        // Clean up interval when process exits
        process.on('beforeExit', () => {
            clearInterval(memoryInterval);
            this.finalizeMetrics();
        });
    }
    /**
     * Mark the start of a test execution
     */
    markTestStart(testName, metadata) {
        const startTime = Date.now();
        this.performanceMarkers.set(`${testName}_start`, startTime);
        this.testResults.set(testName, {
            name: testName,
            startTime,
            endTime: 0,
            duration: 0,
            status: 'running',
            memoryBefore: process.memoryUsage().heapUsed,
            memoryAfter: 0,
            metadata: metadata || {}
        });
    }
    /**
     * Mark the end of a test execution
     */
    markTestEnd(testName, status, error) {
        const endTime = Date.now();
        const startTime = this.performanceMarkers.get(`${testName}_start`) || endTime;
        const duration = endTime - startTime;
        const testResult = this.testResults.get(testName);
        if (testResult) {
            testResult.endTime = endTime;
            testResult.duration = duration;
            testResult.status = status;
            testResult.memoryAfter = process.memoryUsage().heapUsed;
            testResult.error = error;
        }
        // Update execution metrics
        this.metrics.execution.totalTests++;
        this.metrics.execution.totalDuration += duration;
        switch (status) {
            case 'passed':
                this.metrics.execution.passedTests++;
                break;
            case 'failed':
                this.metrics.execution.failedTests++;
                break;
            case 'skipped':
                this.metrics.execution.skippedTests++;
                break;
        }
        // Update slowest/fastest tests
        if (!this.metrics.execution.slowestTest || duration > this.metrics.execution.slowestTest.duration) {
            this.metrics.execution.slowestTest = { name: testName, duration };
        }
        if (!this.metrics.execution.fastestTest || duration < this.metrics.execution.fastestTest.duration) {
            this.metrics.execution.fastestTest = { name: testName, duration };
        }
    }
    /**
     * Record performance benchmark results
     */
    recordBenchmark(name, results) {
        if (!this.metrics.benchmarks) {
            this.metrics.benchmarks = {};
        }
        this.metrics.benchmarks[name] = {
            ...results,
            timestamp: new Date().toISOString()
        };
        // Update throughput metrics
        if (results.throughput) {
            this.metrics.performance.throughput.testsPerSecond = Math.max(this.metrics.performance.throughput.testsPerSecond, results.throughput);
        }
    }
    /**
     * Record coverage information
     */
    recordCoverage(coverage) {
        this.metrics.quality.coverage = {
            statements: coverage.statements?.pct || 0,
            branches: coverage.branches?.pct || 0,
            functions: coverage.functions?.pct || 0,
            lines: coverage.lines?.pct || 0
        };
    }
    /**
     * Record code complexity metrics
     */
    recordComplexity(complexity) {
        this.metrics.quality.complexity = {
            average: complexity.average || 0,
            highest: complexity.highest || 0,
            distribution: complexity.distribution || {}
        };
    }
    /**
     * Add custom insight or observation
     */
    addInsight(insight) {
        this.metrics.insights.push({
            ...insight,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Add performance anomaly
     */
    addAnomaly(anomaly) {
        this.metrics.anomalies.push({
            ...anomaly,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Generate automated recommendations based on collected metrics
     */
    generateRecommendations() {
        const recommendations = [];
        // Performance recommendations
        const avgDuration = this.metrics.execution.averageDuration;
        if (avgDuration > 5000) { // More than 5 seconds average
            recommendations.push({
                type: 'performance',
                severity: 'high',
                category: 'test_duration',
                message: `Average test duration is ${avgDuration}ms, which is quite slow`,
                suggestion: 'Consider optimizing slow tests or running them in parallel',
                impact: 'CI/CD pipeline efficiency'
            });
        }
        // Memory recommendations
        const memoryIncrease = this.metrics.performance.memoryUsage.peak - this.metrics.performance.memoryUsage.initial;
        const memoryIncreaseMB = memoryIncrease / (1024 * 1024);
        if (memoryIncreaseMB > 100) { // More than 100MB increase
            recommendations.push({
                type: 'memory',
                severity: 'medium',
                category: 'memory_usage',
                message: `Memory usage increased by ${Math.round(memoryIncreaseMB)}MB during tests`,
                suggestion: 'Investigate potential memory leaks or optimize data structures',
                impact: 'Resource consumption and system stability'
            });
        }
        // Coverage recommendations
        const avgCoverage = (this.metrics.quality.coverage.statements +
            this.metrics.quality.coverage.branches +
            this.metrics.quality.coverage.functions +
            this.metrics.quality.coverage.lines) / 4;
        if (avgCoverage < 80) {
            recommendations.push({
                type: 'quality',
                severity: 'high',
                category: 'test_coverage',
                message: `Test coverage is ${Math.round(avgCoverage)}%, below recommended 80%`,
                suggestion: 'Add more unit tests to increase coverage, especially for edge cases',
                impact: 'Code quality and bug detection'
            });
        }
        // Failure rate recommendations
        const failureRate = (this.metrics.execution.failedTests / this.metrics.execution.totalTests) * 100;
        if (failureRate > 5) { // More than 5% failure rate
            recommendations.push({
                type: 'reliability',
                severity: 'critical',
                category: 'test_reliability',
                message: `Test failure rate is ${Math.round(failureRate)}%, indicating instability`,
                suggestion: 'Fix failing tests and improve test reliability',
                impact: 'CI/CD pipeline reliability and deployment confidence'
            });
        }
        this.metrics.recommendations = recommendations;
    }
    /**
     * Detect performance anomalies
     */
    detectAnomalies() {
        const anomalies = [];
        // Detect unusually slow tests (more than 3 standard deviations from mean)
        const durations = Array.from(this.testResults.values()).map(test => test.duration);
        if (durations.length > 0) {
            const mean = durations.reduce((sum, d) => sum + d, 0) / durations.length;
            const variance = durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / durations.length;
            const stdDev = Math.sqrt(variance);
            durations.forEach((duration, index) => {
                if (duration > mean + (3 * stdDev)) {
                    const testName = Array.from(this.testResults.keys())[index];
                    anomalies.push({
                        type: 'performance',
                        severity: 'medium',
                        category: 'slow_test',
                        description: `Test "${testName}" took ${duration}ms, which is unusually slow`,
                        value: duration,
                        threshold: mean + (3 * stdDev),
                        timestamp: new Date().toISOString()
                    });
                }
            });
        }
        // Detect memory spikes
        const memorySpikes = this.memorySnapshots.filter((snapshot, index) => {
            if (index === 0)
                return false;
            const previousSnapshot = this.memorySnapshots[index - 1];
            const increase = snapshot - previousSnapshot;
            return increase > 50 * 1024 * 1024; // 50MB spike
        });
        if (memorySpikes.length > 0) {
            anomalies.push({
                type: 'memory',
                severity: 'medium',
                category: 'memory_spike',
                description: `Detected ${memorySpikes.length} memory spike(s) during test execution`,
                value: Math.max(...memorySpikes),
                threshold: 50 * 1024 * 1024,
                timestamp: new Date().toISOString()
            });
        }
        this.metrics.anomalies = anomalies;
    }
    /**
     * Load historical metrics for trend analysis
     */
    async loadHistoricalMetrics() {
        const historicalFiles = [
            'metrics-history-1.json',
            'metrics-history-2.json',
            'metrics-history-3.json'
        ];
        const historical = [];
        for (const file of historicalFiles) {
            try {
                const filePath = join(this.outputDir, file);
                if (existsSync(filePath)) {
                    const data = await readFile(filePath, 'utf8');
                    const metrics = JSON.parse(data);
                    historical.push(metrics);
                }
            }
            catch (error) {
                // Ignore files that can't be read
            }
        }
        return historical.slice(-10); // Keep last 10 entries
    }
    /**
     * Analyze trends in metrics over time
     */
    analyzeTrends(historical) {
        if (historical.length < 2) {
            this.metrics.trends.predictions = null;
            return;
        }
        const trends = {
            testCount: this.calculateTrend(historical.map(h => h.execution.totalTests)),
            averageDuration: this.calculateTrend(historical.map(h => h.execution.averageDuration)),
            failureRate: this.calculateTrend(historical.map(h => (h.execution.failedTests / Math.max(h.execution.totalTests, 1)) * 100)),
            coverage: this.calculateTrend(historical.map(h => {
                const cov = h.quality.coverage;
                return (cov.statements + cov.branches + cov.functions + cov.lines) / 4;
            }))
        };
        this.metrics.trends.predictions = trends;
    }
    /**
     * Calculate trend (positive = improving, negative = degrading)
     */
    calculateTrend(values) {
        if (values.length < 2) {
            return { direction: 'stable', confidence: 0, change: 0 };
        }
        const recent = values.slice(-3); // Last 3 values
        const older = values.slice(0, -3);
        if (older.length === 0) {
            return { direction: 'stable', confidence: 0, change: 0 };
        }
        const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length;
        const olderAvg = older.reduce((sum, v) => sum + v, 0) / older.length;
        const change = ((recentAvg - olderAvg) / olderAvg) * 100;
        const direction = Math.abs(change) < 5 ? 'stable' :
            change > 0 ? 'improving' : 'degrading';
        const confidence = Math.min(Math.abs(change) / 10, 1); // 0-1 confidence
        return { direction, confidence, change };
    }
    /**
     * Finalize metrics collection and generate insights
     */
    finalizeMetrics() {
        // Calculate final metrics
        this.metrics.execution.averageDuration = this.metrics.execution.totalTests > 0 ?
            this.metrics.execution.totalDuration / this.metrics.execution.totalTests : 0;
        this.metrics.performance.memoryUsage.final = process.memoryUsage().heapUsed;
        this.metrics.performance.memoryUsage.average = this.memorySnapshots.length > 0 ?
            this.memorySnapshots.reduce((sum, mem) => sum + mem, 0) / this.memorySnapshots.length : 0;
        const totalDurationSeconds = (Date.now() - this.startTime) / 1000;
        this.metrics.performance.throughput.testsPerSecond = totalDurationSeconds > 0 ?
            this.metrics.execution.totalTests / totalDurationSeconds : 0;
        // Generate automated insights
        this.generateRecommendations();
        this.detectAnomalies();
    }
    /**
     * Save metrics to file
     */
    async saveMetrics(filename) {
        this.finalizeMetrics();
        const outputFile = filename || `test-metrics-${Date.now()}.json`;
        const filePath = join(this.outputDir, outputFile);
        // Load and analyze historical data
        const historical = await this.loadHistoricalMetrics();
        this.metrics.trends.historical = historical;
        this.analyzeTrends(historical);
        await writeFile(filePath, JSON.stringify(this.metrics, null, 2), 'utf8');
        // Also save as latest for easy access
        await writeFile(join(this.outputDir, 'latest-metrics.json'), JSON.stringify(this.metrics, null, 2), 'utf8');
        console.log(`✅ Test metrics saved to ${filePath}`);
    }
    /**
     * Generate comprehensive metrics dashboard HTML
     */
    async generateDashboard() {
        const dashboardHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Metrics Dashboard - Autonomous Task Management</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; background: #f5f7fa; }
        .dashboard { max-width: 1400px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
        .metric-card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .metric-value { font-size: 2rem; font-weight: bold; color: #2d3748; }
        .metric-label { color: #718096; font-size: 0.9rem; margin-top: 0.5rem; }
        .chart-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(500px, 1fr)); gap: 2rem; margin-bottom: 2rem; }
        .chart-container { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .recommendations { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .recommendation { padding: 1rem; border-left: 4px solid #3182ce; background: #ebf8ff; margin-bottom: 1rem; border-radius: 0 8px 8px 0; }
        .recommendation.high { border-color: #e53e3e; background: #fed7d7; }
        .recommendation.critical { border-color: #9f7aea; background: #faf5ff; }
        .status-good { color: #38a169; }
        .status-warning { color: #d69e2e; }
        .status-error { color: #e53e3e; }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>📊 Test Metrics Dashboard</h1>
            <p>Comprehensive testing analytics for Autonomous Task Management System</p>
            <p>Generated: ${new Date(this.metrics.timestamp).toLocaleString()}</p>
        </div>

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value status-${this.metrics.execution.failedTests === 0 ? 'good' : 'error'}">
                    ${this.metrics.execution.totalTests}
                </div>
                <div class="metric-label">Total Tests Executed</div>
            </div>

            <div class="metric-card">
                <div class="metric-value status-${this.metrics.execution.passedTests === this.metrics.execution.totalTests ? 'good' : 'warning'}">
                    ${Math.round((this.metrics.execution.passedTests / Math.max(this.metrics.execution.totalTests, 1)) * 100)}%
                </div>
                <div class="metric-label">Success Rate</div>
            </div>

            <div class="metric-card">
                <div class="metric-value">
                    ${Math.round(this.metrics.execution.averageDuration)}ms
                </div>
                <div class="metric-label">Average Test Duration</div>
            </div>

            <div class="metric-card">
                <div class="metric-value status-${Math.round((this.metrics.quality.coverage.statements + this.metrics.quality.coverage.branches + this.metrics.quality.coverage.functions + this.metrics.quality.coverage.lines) / 4) >= 80 ? 'good' : 'warning'}">
                    ${Math.round((this.metrics.quality.coverage.statements + this.metrics.quality.coverage.branches + this.metrics.quality.coverage.functions + this.metrics.quality.coverage.lines) / 4)}%
                </div>
                <div class="metric-label">Test Coverage</div>
            </div>

            <div class="metric-card">
                <div class="metric-value">
                    ${Math.round(this.metrics.performance.throughput.testsPerSecond * 10) / 10}
                </div>
                <div class="metric-label">Tests per Second</div>
            </div>

            <div class="metric-card">
                <div class="metric-value">
                    ${Math.round((this.metrics.performance.memoryUsage.peak - this.metrics.performance.memoryUsage.initial) / (1024 * 1024))}MB
                </div>
                <div class="metric-label">Memory Usage Increase</div>
            </div>
        </div>

        <div class="chart-grid">
            <div class="chart-container">
                <h3>Test Results Breakdown</h3>
                <canvas id="testResultsChart"></canvas>
            </div>

            <div class="chart-container">
                <h3>Coverage by Type</h3>
                <canvas id="coverageChart"></canvas>
            </div>

            <div class="chart-container">
                <h3>Performance Trends</h3>
                <canvas id="performanceChart"></canvas>
            </div>

            <div class="chart-container">
                <h3>Memory Usage Over Time</h3>
                <canvas id="memoryChart"></canvas>
            </div>
        </div>

        ${this.metrics.recommendations.length > 0 ? `
        <div class="recommendations">
            <h2>💡 Recommendations</h2>
            ${this.metrics.recommendations.map(rec => `
                <div class="recommendation ${rec.severity}">
                    <h4>${rec.category.toUpperCase()}: ${rec.message}</h4>
                    <p><strong>Suggestion:</strong> ${rec.suggestion}</p>
                    <p><small><strong>Impact:</strong> ${rec.impact}</small></p>
                </div>
            `).join('')}
        </div>
        ` : ''}
    </div>

    <script>
        // Test Results Chart
        new Chart(document.getElementById('testResultsChart'), {
            type: 'doughnut',
            data: {
                labels: ['Passed', 'Failed', 'Skipped'],
                datasets: [{
                    data: [${this.metrics.execution.passedTests}, ${this.metrics.execution.failedTests}, ${this.metrics.execution.skippedTests}],
                    backgroundColor: ['#38a169', '#e53e3e', '#d69e2e']
                }]
            },
            options: { responsive: true, maintainAspectRatio: true }
        });

        // Coverage Chart
        new Chart(document.getElementById('coverageChart'), {
            type: 'bar',
            data: {
                labels: ['Statements', 'Branches', 'Functions', 'Lines'],
                datasets: [{
                    label: 'Coverage %',
                    data: [${this.metrics.quality.coverage.statements}, ${this.metrics.quality.coverage.branches}, ${this.metrics.quality.coverage.functions}, ${this.metrics.quality.coverage.lines}],
                    backgroundColor: '#3182ce'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: { y: { beginAtZero: true, max: 100 } }
            }
        });

        // Memory Usage Chart
        new Chart(document.getElementById('memoryChart'), {
            type: 'line',
            data: {
                labels: ${JSON.stringify(this.memorySnapshots.map((_, i) => `${i}s`))},
                datasets: [{
                    label: 'Memory Usage (MB)',
                    data: ${JSON.stringify(this.memorySnapshots.map(mem => Math.round(mem / (1024 * 1024))))},
                    borderColor: '#9f7aea',
                    backgroundColor: 'rgba(159, 122, 234, 0.1)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: { y: { beginAtZero: true } }
            }
        });
    </script>
</body>
</html>
    `;
        const dashboardPath = join(this.outputDir, 'metrics-dashboard.html');
        await writeFile(dashboardPath, dashboardHTML, 'utf8');
        console.log(`📊 Test metrics dashboard generated: ${dashboardPath}`);
    }
    /**
     * Get current metrics snapshot
     */
    getMetrics() {
        this.finalizeMetrics();
        return { ...this.metrics };
    }
}
//# sourceMappingURL=test-metrics-collector.js.map