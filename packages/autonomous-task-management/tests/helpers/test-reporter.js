/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
export class TestReporter {
    outputDir;
    results = [];
    suites = [];
    startTime = 0;
    performanceData = [];
    constructor(outputDir = './test-results') {
        this.outputDir = outputDir;
    }
    /**
     * Start measuring test execution
     */
    startSuite(suiteName) {
        this.startTime = Date.now();
        console.log(`🧪 Starting test suite: ${suiteName}`);
    }
    /**
     * Record individual test result
     */
    recordTest(result) {
        this.results.push(result);
        // Collect performance data
        this.performanceData.push({
            test: result.name,
            duration: result.duration,
            memory: process.memoryUsage().heapUsed
        });
        const status = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⏭️';
        console.log(`  ${status} ${result.name} (${result.duration}ms)`);
        if (result.error) {
            console.error(`    Error: ${result.error}`);
        }
    }
    /**
     * Finish test suite and generate report
     */
    async finishSuite(suiteName) {
        const endTime = Date.now();
        const duration = endTime - this.startTime;
        const metrics = this.calculateMetrics(duration);
        const environment = {
            nodeVersion: process.version,
            platform: process.platform,
            memoryLimit: this.getMemoryLimit()
        };
        const suite = {
            name: suiteName,
            results: [...this.results],
            metrics,
            timestamp: new Date().toISOString(),
            environment
        };
        this.suites.push(suite);
        // Generate reports
        await this.generateReports(suite);
        console.log(`📊 Test suite completed: ${suiteName}`);
        console.log(`   Total: ${metrics.totalTests}, Passed: ${metrics.passedTests}, Failed: ${metrics.failedTests}, Skipped: ${metrics.skippedTests}`);
        console.log(`   Duration: ${duration}ms`);
        // Reset for next suite
        this.results = [];
        this.performanceData = [];
        return suite;
    }
    /**
     * Calculate comprehensive test metrics
     */
    calculateMetrics(duration) {
        const totalTests = this.results.length;
        const passedTests = this.results.filter(r => r.status === 'passed').length;
        const failedTests = this.results.filter(r => r.status === 'failed').length;
        const skippedTests = this.results.filter(r => r.status === 'skipped').length;
        // Performance metrics
        const durations = this.performanceData.map(p => p.duration);
        const averageTestTime = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
        const sortedByDuration = [...this.performanceData].sort((a, b) => b.duration - a.duration);
        const slowestTests = sortedByDuration.slice(0, 5).map(p => ({ name: p.test, duration: p.duration }));
        const fastestTests = sortedByDuration.slice(-5).reverse().map(p => ({ name: p.test, duration: p.duration }));
        const memoryUsage = process.memoryUsage();
        return {
            totalTests,
            passedTests,
            failedTests,
            skippedTests,
            duration,
            performance: {
                averageTestTime,
                slowestTests,
                fastestTests,
                memoryUsage: memoryUsage.heapUsed
            },
            memory: {
                heapUsed: memoryUsage.heapUsed,
                heapTotal: memoryUsage.heapTotal,
                rss: memoryUsage.rss,
                external: memoryUsage.external
            }
        };
    }
    /**
     * Generate comprehensive test reports
     */
    async generateReports(suite) {
        try {
            await fs.mkdir(this.outputDir, { recursive: true });
            // JSON report for programmatic consumption
            await this.generateJSONReport(suite);
            // HTML report for human consumption
            await this.generateHTMLReport(suite);
            // JUnit XML for CI/CD integration
            await this.generateJUnitReport(suite);
            // Performance CSV for analysis
            await this.generatePerformanceCSV(suite);
            // Summary for quick overview
            await this.generateSummaryReport(suite);
        }
        catch (error) {
            console.error('Failed to generate test reports:', error);
        }
    }
    /**
     * Generate JSON report
     */
    async generateJSONReport(suite) {
        const reportPath = path.join(this.outputDir, `${this.sanitizeName(suite.name)}-report.json`);
        await fs.writeFile(reportPath, JSON.stringify(suite, null, 2));
    }
    /**
     * Generate HTML report
     */
    async generateHTMLReport(suite) {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Report: ${suite.name}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .metric-card { background: white; border: 1px solid #e1e5e9; padding: 15px; border-radius: 6px; }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .results { margin-top: 20px; }
        .test-result { display: flex; align-items: center; padding: 10px; border-bottom: 1px solid #eee; }
        .test-name { flex: 1; }
        .test-duration { color: #666; margin-right: 10px; }
        .status-icon { width: 20px; text-align: center; margin-right: 10px; }
        .performance { margin-top: 30px; }
        .performance-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .performance-table th, .performance-table td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
        .error { color: #dc3545; font-size: 0.9em; margin-left: 30px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Test Report: ${suite.name}</h1>
        <p><strong>Timestamp:</strong> ${suite.timestamp}</p>
        <p><strong>Duration:</strong> ${suite.metrics.duration}ms</p>
        <p><strong>Environment:</strong> Node.js ${suite.environment.nodeVersion} on ${suite.environment.platform}</p>
    </div>

    <div class="metrics">
        <div class="metric-card">
            <div class="metric-value">${suite.metrics.totalTests}</div>
            <div>Total Tests</div>
        </div>
        <div class="metric-card">
            <div class="metric-value passed">${suite.metrics.passedTests}</div>
            <div>Passed</div>
        </div>
        <div class="metric-card">
            <div class="metric-value failed">${suite.metrics.failedTests}</div>
            <div>Failed</div>
        </div>
        <div class="metric-card">
            <div class="metric-value skipped">${suite.metrics.skippedTests}</div>
            <div>Skipped</div>
        </div>
    </div>

    <div class="results">
        <h2>Test Results</h2>
        ${suite.results.map(result => `
            <div class="test-result">
                <div class="status-icon">${result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⏭️'}</div>
                <div class="test-name">${result.name}</div>
                <div class="test-duration">${result.duration}ms</div>
            </div>
            ${result.error ? `<div class="error">Error: ${result.error}</div>` : ''}
        `).join('')}
    </div>

    ${suite.metrics.performance ? `
    <div class="performance">
        <h2>Performance Analysis</h2>
        <p><strong>Average Test Time:</strong> ${suite.metrics.performance.averageTestTime.toFixed(2)}ms</p>

        <h3>Slowest Tests</h3>
        <table class="performance-table">
            <thead>
                <tr><th>Test</th><th>Duration</th></tr>
            </thead>
            <tbody>
                ${suite.metrics.performance.slowestTests.map(test => `<tr><td>${test.name}</td><td>${test.duration}ms</td></tr>`).join('')}
            </tbody>
        </table>

        <h3>Memory Usage</h3>
        <p><strong>Heap Used:</strong> ${this.formatBytes(suite.metrics.memory?.heapUsed || 0)}</p>
        <p><strong>Heap Total:</strong> ${this.formatBytes(suite.metrics.memory?.heapTotal || 0)}</p>
        <p><strong>RSS:</strong> ${this.formatBytes(suite.metrics.memory?.rss || 0)}</p>
    </div>
    ` : ''}
</body>
</html>`;
        const reportPath = path.join(this.outputDir, `${this.sanitizeName(suite.name)}-report.html`);
        await fs.writeFile(reportPath, html);
    }
    /**
     * Generate JUnit XML report for CI/CD integration
     */
    async generateJUnitReport(suite) {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
    <testsuite
        name="${suite.name}"
        tests="${suite.metrics.totalTests}"
        failures="${suite.metrics.failedTests}"
        skipped="${suite.metrics.skippedTests}"
        time="${suite.metrics.duration / 1000}"
        timestamp="${suite.timestamp}">
        ${suite.results.map(result => `
        <testcase
            name="${result.name}"
            time="${result.duration / 1000}"
            ${result.status === 'failed' ? 'status="failed"' : ''}
            ${result.status === 'skipped' ? 'status="skipped"' : ''}>
            ${result.error ? `<failure message="${result.error}">${result.stack || result.error}</failure>` : ''}
        </testcase>`).join('')}
    </testsuite>
</testsuites>`;
        const reportPath = path.join(this.outputDir, `${this.sanitizeName(suite.name)}-junit.xml`);
        await fs.writeFile(reportPath, xml);
    }
    /**
     * Generate performance CSV for analysis
     */
    async generatePerformanceCSV(suite) {
        const csvHeader = 'Test Name,Status,Duration (ms),Memory (bytes)\n';
        const csvData = suite.results.map(result => {
            const memoryData = this.performanceData.find(p => p.test === result.name);
            return `"${result.name}","${result.status}",${result.duration},${memoryData?.memory || 0}`;
        }).join('\n');
        const csv = csvHeader + csvData;
        const reportPath = path.join(this.outputDir, `${this.sanitizeName(suite.name)}-performance.csv`);
        await fs.writeFile(reportPath, csv);
    }
    /**
     * Generate summary report
     */
    async generateSummaryReport(suite) {
        const passRate = suite.metrics.totalTests > 0 ? (suite.metrics.passedTests / suite.metrics.totalTests * 100).toFixed(1) : '0';
        const summary = `
# Test Summary Report: ${suite.name}

## Overview
- **Timestamp:** ${suite.timestamp}
- **Duration:** ${suite.metrics.duration}ms
- **Pass Rate:** ${passRate}%

## Results
- **Total Tests:** ${suite.metrics.totalTests}
- **Passed:** ${suite.metrics.passedTests} ✅
- **Failed:** ${suite.metrics.failedTests} ❌
- **Skipped:** ${suite.metrics.skippedTests} ⏭️

## Performance
- **Average Test Time:** ${suite.metrics.performance?.averageTestTime.toFixed(2) || 0}ms
- **Memory Usage:** ${this.formatBytes(suite.metrics.memory?.heapUsed || 0)}

## Environment
- **Node.js Version:** ${suite.environment.nodeVersion}
- **Platform:** ${suite.environment.platform}

${suite.metrics.failedTests > 0 ? `
## Failed Tests
${suite.results.filter(r => r.status === 'failed').map(r => `- ${r.name}: ${r.error}`).join('\n')}
` : ''}

## Files Generated
- JSON Report: \`${this.sanitizeName(suite.name)}-report.json\`
- HTML Report: \`${this.sanitizeName(suite.name)}-report.html\`
- JUnit XML: \`${this.sanitizeName(suite.name)}-junit.xml\`
- Performance CSV: \`${this.sanitizeName(suite.name)}-performance.csv\`
`;
        const reportPath = path.join(this.outputDir, `${this.sanitizeName(suite.name)}-summary.md`);
        await fs.writeFile(reportPath, summary.trim());
    }
    /**
     * Get memory limit for the current process
     */
    getMemoryLimit() {
        // Default Node.js heap limit is approximately 1.4GB on 64-bit systems
        return 1.4 * 1024 * 1024 * 1024; // bytes
    }
    /**
     * Format bytes to human readable format
     */
    formatBytes(bytes) {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    /**
     * Sanitize suite name for file system
     */
    sanitizeName(name) {
        return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    }
    /**
     * Get all test suites results
     */
    getAllSuites() {
        return [...this.suites];
    }
    /**
     * Generate aggregate report across multiple suites
     */
    async generateAggregateReport() {
        if (this.suites.length === 0) {
            return;
        }
        const totalMetrics = this.suites.reduce((acc, suite) => ({
            totalTests: acc.totalTests + suite.metrics.totalTests,
            passedTests: acc.passedTests + suite.metrics.passedTests,
            failedTests: acc.failedTests + suite.metrics.failedTests,
            skippedTests: acc.skippedTests + suite.metrics.skippedTests,
            duration: acc.duration + suite.metrics.duration
        }), { totalTests: 0, passedTests: 0, failedTests: 0, skippedTests: 0, duration: 0 });
        const aggregateReport = {
            timestamp: new Date().toISOString(),
            suites: this.suites.length,
            totalMetrics,
            suiteResults: this.suites.map(s => ({
                name: s.name,
                passed: s.metrics.passedTests,
                failed: s.metrics.failedTests,
                duration: s.metrics.duration
            }))
        };
        const reportPath = path.join(this.outputDir, 'aggregate-report.json');
        await fs.writeFile(reportPath, JSON.stringify(aggregateReport, null, 2));
        console.log('📊 Aggregate report generated');
        console.log(`   Suites: ${this.suites.length}`);
        console.log(`   Total Tests: ${totalMetrics.totalTests}`);
        console.log(`   Overall Pass Rate: ${totalMetrics.totalTests > 0 ? (totalMetrics.passedTests / totalMetrics.totalTests * 100).toFixed(1) : 0}%`);
    }
}
//# sourceMappingURL=test-reporter.js.map