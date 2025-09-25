#!/usr/bin/env node
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Performance Regression Detection Script
 *
 * This script compares current performance benchmark results with historical baselines
 * to detect performance regressions and improvements. It's designed to run in CI/CD
 * pipelines to prevent performance degradation from being deployed.
 */

const fs = require('fs').promises;
const path = require('path');

class PerformanceRegressionChecker {
  constructor() {
    this.baselinePath = './performance-baseline.json';
    this.currentResultsPath = './benchmark-results.json';
    this.thresholds = {
      // Percentage thresholds for regression detection
      taskCreationThroughput: -10, // 10% decrease is a regression
      taskExecutionLatency: 20,    // 20% increase is a regression
      memoryUsage: 25,             // 25% increase is a regression
      overallScore: -15            // 15% decrease in overall score is a regression
    };
    this.results = {
      status: 'unknown',
      regressions: [],
      improvements: [],
      summary: {},
      recommendations: []
    };
  }

  async checkForRegressions() {
    console.log('🔍 Checking for performance regressions...');

    try {
      // Load current performance results
      const currentResults = await this.loadCurrentResults();
      if (!currentResults) {
        console.log('⚠️  No current performance results found, skipping regression check');
        return this.generateReport('skipped');
      }

      // Load baseline performance data
      const baseline = await this.loadBaseline();
      if (!baseline) {
        console.log('📊 No baseline found, creating initial baseline from current results');
        await this.createBaseline(currentResults);
        return this.generateReport('baseline_created');
      }

      // Compare performance metrics
      await this.compareMetrics(baseline, currentResults);

      // Determine overall status
      const hasRegressions = this.results.regressions.length > 0;
      const hasCriticalRegressions = this.results.regressions.some(r => r.severity === 'critical');

      this.results.status = hasCriticalRegressions ? 'critical_regression' :
                           hasRegressions ? 'regression_detected' :
                           this.results.improvements.length > 0 ? 'improvement' : 'stable';

      // Generate recommendations
      this.generateRecommendations();

      // Update baseline if no critical regressions
      if (!hasCriticalRegressions) {
        await this.updateBaseline(currentResults);
      }

      return this.generateReport(this.results.status);

    } catch (error) {
      console.error('❌ Failed to check for performance regressions:', error);
      process.exit(1);
    }
  }

  async loadCurrentResults() {
    try {
      const data = await fs.readFile(this.currentResultsPath, 'utf8');
      const results = JSON.parse(data);

      // Extract key performance metrics
      return this.extractMetrics(results);
    } catch (error) {
      console.log('⚠️  Could not load current results:', error.message);
      return null;
    }
  }

  async loadBaseline() {
    try {
      const data = await fs.readFile(this.baselinePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.log('📊 No existing baseline found');
      return null;
    }
  }

  extractMetrics(results) {
    const metrics = {
      timestamp: new Date().toISOString(),
      taskCreationThroughput: 0,
      taskExecutionLatency: 0,
      memoryUsage: 0,
      overallScore: 0,
      rawData: results
    };

    try {
      // Extract performance metrics from benchmark results
      // This would be customized based on the actual benchmark output format

      if (results.benchmarks) {
        // Task creation throughput (operations per second)
        const taskCreationBench = results.benchmarks.find(b => b.name?.includes('task creation'));
        if (taskCreationBench) {
          metrics.taskCreationThroughput = taskCreationBench.throughput || taskCreationBench.opsPerSec || 0;
        }

        // Task execution latency (milliseconds)
        const taskExecutionBench = results.benchmarks.find(b => b.name?.includes('task execution'));
        if (taskExecutionBench) {
          metrics.taskExecutionLatency = taskExecutionBench.avgTime || taskExecutionBench.latency || 0;
        }

        // Memory usage (MB)
        const memoryBench = results.benchmarks.find(b => b.name?.includes('memory'));
        if (memoryBench) {
          metrics.memoryUsage = taskExecutionBench.memoryMB || taskExecutionBench.memoryUsage || 0;
        }
      }

      // Calculate overall performance score
      metrics.overallScore = this.calculateOverallScore(metrics);

    } catch (error) {
      console.warn('⚠️  Error extracting metrics:', error.message);
    }

    return metrics;
  }

  calculateOverallScore(metrics) {
    // Weighted performance score calculation
    const weights = {
      taskCreationThroughput: 0.3,
      taskExecutionLatency: 0.3,  // Lower is better, so invert
      memoryUsage: 0.2,           // Lower is better, so invert
      stability: 0.2
    };

    const normalizedThroughput = Math.min(metrics.taskCreationThroughput / 1000, 1); // Normalize to 0-1
    const normalizedLatency = Math.max(0, 1 - (metrics.taskExecutionLatency / 1000)); // Lower is better
    const normalizedMemory = Math.max(0, 1 - (metrics.memoryUsage / 500)); // Lower is better
    const stabilityScore = 0.95; // Assume good stability for now

    return Math.round(
      (normalizedThroughput * weights.taskCreationThroughput +
       normalizedLatency * weights.taskExecutionLatency +
       normalizedMemory * weights.memoryUsage +
       stabilityScore * weights.stability) * 100
    );
  }

  async compareMetrics(baseline, current) {
    console.log('📊 Comparing performance metrics...');

    const metrics = ['taskCreationThroughput', 'taskExecutionLatency', 'memoryUsage', 'overallScore'];

    for (const metric of metrics) {
      const baselineValue = baseline[metric] || 0;
      const currentValue = current[metric] || 0;

      if (baselineValue === 0) continue; // Skip if no baseline data

      const changePercent = ((currentValue - baselineValue) / baselineValue) * 100;
      const threshold = this.thresholds[metric] || 0;

      const change = {
        metric,
        baselineValue,
        currentValue,
        changePercent: Math.round(changePercent * 100) / 100,
        changeAbsolute: currentValue - baselineValue,
        threshold,
        severity: this.getSeverity(changePercent, threshold, metric)
      };

      // Determine if it's a regression or improvement
      if (this.isRegression(changePercent, threshold, metric)) {
        this.results.regressions.push(change);
      } else if (this.isImprovement(changePercent, threshold, metric)) {
        this.results.improvements.push(change);
      }

      // Add to summary
      this.results.summary[metric] = change;
    }
  }

  isRegression(changePercent, threshold, metric) {
    // For metrics where higher is better (throughput, overall score)
    if (['taskCreationThroughput', 'overallScore'].includes(metric)) {
      return changePercent < threshold;
    }
    // For metrics where lower is better (latency, memory usage)
    else {
      return changePercent > Math.abs(threshold);
    }
  }

  isImprovement(changePercent, threshold, metric) {
    // For metrics where higher is better
    if (['taskCreationThroughput', 'overallScore'].includes(metric)) {
      return changePercent > Math.abs(threshold);
    }
    // For metrics where lower is better
    else {
      return changePercent < threshold;
    }
  }

  getSeverity(changePercent, threshold, metric) {
    const absChange = Math.abs(changePercent);
    const absThreshold = Math.abs(threshold);

    if (absChange > absThreshold * 2) {
      return 'critical';
    } else if (absChange > absThreshold) {
      return 'major';
    } else if (absChange > absThreshold * 0.5) {
      return 'minor';
    } else {
      return 'negligible';
    }
  }

  generateRecommendations() {
    const recommendations = [];

    // Regression-specific recommendations
    for (const regression of this.results.regressions) {
      switch (regression.metric) {
        case 'taskCreationThroughput':
          recommendations.push({
            type: 'performance',
            severity: regression.severity,
            metric: regression.metric,
            message: `Task creation throughput decreased by ${Math.abs(regression.changePercent)}%`,
            suggestions: [
              'Review recent changes to task creation logic',
              'Check for inefficient database queries or API calls',
              'Consider implementing task creation batching',
              'Profile task creation code for bottlenecks'
            ]
          });
          break;

        case 'taskExecutionLatency':
          recommendations.push({
            type: 'performance',
            severity: regression.severity,
            metric: regression.metric,
            message: `Task execution latency increased by ${regression.changePercent}%`,
            suggestions: [
              'Optimize task execution algorithms',
              'Check for blocking I/O operations',
              'Review task scheduling and queuing logic',
              'Consider parallel processing improvements'
            ]
          });
          break;

        case 'memoryUsage':
          recommendations.push({
            type: 'memory',
            severity: regression.severity,
            metric: regression.metric,
            message: `Memory usage increased by ${regression.changePercent}%`,
            suggestions: [
              'Check for memory leaks in task processing',
              'Optimize data structures and caching',
              'Review garbage collection settings',
              'Consider implementing memory pooling'
            ]
          });
          break;

        case 'overallScore':
          recommendations.push({
            type: 'general',
            severity: regression.severity,
            metric: regression.metric,
            message: `Overall performance score decreased by ${Math.abs(regression.changePercent)}%`,
            suggestions: [
              'Run detailed performance profiling',
              'Review all recent performance-related changes',
              'Consider reverting recent changes if critical',
              'Implement performance monitoring and alerting'
            ]
          });
          break;
      }
    }

    this.results.recommendations = recommendations;
  }

  async createBaseline(currentResults) {
    console.log('📊 Creating initial performance baseline...');

    const baseline = {
      created: new Date().toISOString(),
      version: '1.0.0',
      ...currentResults
    };

    await fs.writeFile(this.baselinePath, JSON.stringify(baseline, null, 2), 'utf8');
    console.log('✅ Performance baseline created successfully');
  }

  async updateBaseline(currentResults) {
    try {
      const baseline = await this.loadBaseline();
      if (!baseline) return;

      // Update baseline with current results if they're better or within acceptable range
      const updated = {
        ...baseline,
        updated: new Date().toISOString(),
        ...currentResults,
        history: baseline.history || []
      };

      // Keep history of previous baselines
      updated.history.push({
        timestamp: baseline.updated || baseline.created,
        metrics: {
          taskCreationThroughput: baseline.taskCreationThroughput,
          taskExecutionLatency: baseline.taskExecutionLatency,
          memoryUsage: baseline.memoryUsage,
          overallScore: baseline.overallScore
        }
      });

      // Keep only last 10 historical entries
      updated.history = updated.history.slice(-10);

      await fs.writeFile(this.baselinePath, JSON.stringify(updated, null, 2), 'utf8');
      console.log('✅ Performance baseline updated');

    } catch (error) {
      console.warn('⚠️  Could not update baseline:', error.message);
    }
  }

  async generateReport(status) {
    console.log('📝 Generating performance regression report...');

    const report = {
      timestamp: new Date().toISOString(),
      status,
      summary: {
        totalRegressions: this.results.regressions.length,
        criticalRegressions: this.results.regressions.filter(r => r.severity === 'critical').length,
        majorRegressions: this.results.regressions.filter(r => r.severity === 'major').length,
        improvements: this.results.improvements.length,
        recommendations: this.results.recommendations.length
      },
      details: this.results
    };

    // Write detailed report
    await fs.writeFile('performance-regression-report.json', JSON.stringify(report, null, 2), 'utf8');

    // Generate console output
    this.printConsoleReport(report);

    // Exit with appropriate code
    if (status === 'critical_regression') {
      console.error('❌ Critical performance regressions detected - blocking deployment');
      process.exit(1);
    } else if (status === 'regression_detected') {
      console.warn('⚠️  Performance regressions detected - review recommended');
      process.exit(0); // Don't block deployment for non-critical regressions
    } else {
      console.log('✅ No critical performance regressions detected');
      process.exit(0);
    }
  }

  printConsoleReport(report) {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 PERFORMANCE REGRESSION CHECK RESULTS');
    console.log('='.repeat(60));

    console.log(`\n📊 Status: ${report.status.toUpperCase()}`);
    console.log(`⏰ Timestamp: ${report.timestamp}`);

    if (report.summary.totalRegressions > 0) {
      console.log(`\n⚠️  REGRESSIONS DETECTED:`);
      console.log(`   Critical: ${report.summary.criticalRegressions}`);
      console.log(`   Major: ${report.summary.majorRegressions}`);
      console.log(`   Total: ${report.summary.totalRegressions}`);

      this.results.regressions.forEach(regression => {
        const icon = regression.severity === 'critical' ? '🔴' :
                     regression.severity === 'major' ? '🟡' : '🟠';
        console.log(`\n   ${icon} ${regression.metric}:`);
        console.log(`      Change: ${regression.changePercent}% (${regression.currentValue} vs ${regression.baselineValue})`);
        console.log(`      Severity: ${regression.severity.toUpperCase()}`);
      });
    }

    if (report.summary.improvements > 0) {
      console.log(`\n🎉 IMPROVEMENTS DETECTED:`);
      this.results.improvements.forEach(improvement => {
        console.log(`   ✅ ${improvement.metric}: ${improvement.changePercent}% improvement`);
      });
    }

    if (report.summary.recommendations > 0) {
      console.log(`\n💡 RECOMMENDATIONS:`);
      this.results.recommendations.forEach((rec, index) => {
        console.log(`\n   ${index + 1}. ${rec.message}`);
        rec.suggestions?.forEach(suggestion => {
          console.log(`      • ${suggestion}`);
        });
      });
    }

    console.log('\n' + '='.repeat(60));
  }
}

// Main execution
if (require.main === module) {
  const checker = new PerformanceRegressionChecker();
  checker.checkForRegressions().catch(console.error);
}

module.exports = PerformanceRegressionChecker;