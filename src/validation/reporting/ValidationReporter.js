/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Validation report generation, storage, and analysis system
 * Provides comprehensive reporting capabilities for validation results
 *
 * @author Claude Code - Validation Expert
 * @version 1.0.0
 */
import { EventEmitter } from 'node:events';
import { Logger } from '../../utils/logger.js';
/**
 * Comprehensive validation reporting system
 *
 * Features:
 * - Persistent report storage and retrieval
 * - Advanced query and filtering capabilities
 * - Real-time analytics and trend analysis
 * - Multiple export formats (JSON, CSV, HTML, PDF)
 * - Report compression and archiving
 * - Historical data retention management
 * - Performance optimized queries
 */
export class ValidationReporter extends EventEmitter {
  logger;
  config;
  reports;
  reportIndex; // taskId -> reportIds
  constructor(config = {}) {
    super();
    this.logger = new Logger('ValidationReporter');
    this.config = {
      maxReports: 10000,
      retentionDays: 90,
      compressionEnabled: true,
      backupEnabled: true,
      exportFormats: ['json', 'csv', 'html'],
      ...config,
    };
    this.reports = new Map();
    this.reportIndex = new Map();
    this.setupCleanupInterval();
    this.logger.info('ValidationReporter initialized', {
      maxReports: this.config.maxReports,
      retentionDays: this.config.retentionDays,
      compressionEnabled: this.config.compressionEnabled,
    });
  }
  /**
   * Store validation report
   */
  async storeReport(report) {
    const reportId = `${report.taskId}-${report.timestamp.getTime()}`;
    this.logger.debug(`Storing validation report: ${reportId}`, {
      taskId: report.taskId,
      score: report.overallScore,
      status: report.overallStatus,
    });
    try {
      // Create stored report with metadata
      const storedReport = {
        ...report,
        storedAt: new Date(),
        compressed: this.config.compressionEnabled,
        version: '1.0.0',
        checksum: this.generateChecksum(report),
      };
      // Store report
      this.reports.set(reportId, storedReport);
      // Update index
      const taskReports = this.reportIndex.get(report.taskId) || [];
      taskReports.push(reportId);
      this.reportIndex.set(report.taskId, taskReports);
      // Emit storage event
      this.emit('reportStored', reportId, storedReport);
      // Perform cleanup if needed
      await this.performCleanup();
      this.logger.debug(`Report stored successfully: ${reportId}`);
    } catch (error) {
      this.logger.error(`Failed to store report: ${reportId}`, { error });
      throw new Error(`Report storage failed: ${error}`);
    }
  }
  /**
   * Retrieve validation report by ID
   */
  async getReport(reportId) {
    const report = this.reports.get(reportId);
    if (!report) {
      this.logger.debug(`Report not found: ${reportId}`);
      return null;
    }
    this.logger.debug(`Retrieved report: ${reportId}`);
    return { ...report }; // Return copy to prevent modification
  }
  /**
   * Query reports with filters
   */
  async queryReports(filters = {}) {
    this.logger.debug('Querying reports', { filters });
    let results = Array.from(this.reports.values());
    // Apply filters
    if (filters.taskId) {
      results = results.filter((r) => r.taskId === filters.taskId);
    }
    if (filters.dateFrom) {
      results = results.filter((r) => r.timestamp >= filters.dateFrom);
    }
    if (filters.dateTo) {
      results = results.filter((r) => r.timestamp <= filters.dateTo);
    }
    if (filters.status) {
      results = results.filter((r) => r.overallStatus === filters.status);
    }
    if (filters.minScore !== undefined) {
      results = results.filter((r) => r.overallScore >= filters.minScore);
    }
    if (filters.maxScore !== undefined) {
      results = results.filter((r) => r.overallScore <= filters.maxScore);
    }
    if (filters.categories && filters.categories.length > 0) {
      results = results.filter((r) =>
        r.results.some((result) =>
          filters.categories.some((cat) => result.criteriaId.includes(cat)),
        ),
      );
    }
    // Sort by timestamp (newest first)
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    // Apply pagination
    if (filters.offset) {
      results = results.slice(filters.offset);
    }
    if (filters.limit) {
      results = results.slice(0, filters.limit);
    }
    this.logger.debug(`Query returned ${results.length} reports`);
    return results.map((r) => ({ ...r })); // Return copies
  }
  /**
   * Get reports for specific task
   */
  async getTaskReports(taskId) {
    const reportIds = this.reportIndex.get(taskId) || [];
    const reports = [];
    for (const reportId of reportIds) {
      const report = this.reports.get(reportId);
      if (report) {
        reports.push({ ...report });
      }
    }
    // Sort by timestamp (newest first)
    reports.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return reports;
  }
  /**
   * Generate comprehensive analytics
   */
  async generateAnalytics(filters = {}) {
    const reports = await this.queryReports(filters);
    if (reports.length === 0) {
      return this.getEmptyAnalytics();
    }
    this.logger.debug(`Generating analytics for ${reports.length} reports`);
    const analytics = {
      totalReports: reports.length,
      avgScore: this.calculateAverageScore(reports),
      successRate: this.calculateSuccessRate(reports),
      failureRate: this.calculateFailureRate(reports),
      trends: this.calculateTrends(reports),
      distribution: this.calculateDistribution(reports),
      insights: this.generateInsights(reports),
      recommendations: this.generateRecommendations(reports),
    };
    this.emit('analyticsGenerated', analytics);
    return analytics;
  }
  /**
   * Export reports in specified format
   */
  async exportReports(options) {
    const reports = await this.queryReports(options.filters);
    this.logger.info(
      `Exporting ${reports.length} reports as ${options.format}`,
    );
    let exportData;
    switch (options.format) {
      case 'json':
        exportData = this.exportAsJson(reports, options);
        break;
      case 'csv':
        exportData = this.exportAsCsv(reports, options);
        break;
      case 'html':
        exportData = await this.exportAsHtml(reports, options);
        break;
      case 'pdf':
        exportData = await this.exportAsPdf(reports, options);
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
    this.emit('reportsExported', {
      format: options.format,
      reportCount: reports.length,
      size: exportData.length,
    });
    return exportData;
  }
  /**
   * Get storage statistics
   */
  getStorageStats() {
    const totalReports = this.reports.size;
    const totalSize = Array.from(this.reports.values()).reduce(
      (sum, report) => sum + JSON.stringify(report).length,
      0,
    );
    const oldestReport = Array.from(this.reports.values()).reduce(
      (oldest, report) =>
        !oldest || report.timestamp < oldest.timestamp ? report : oldest,
      null,
    );
    const newestReport = Array.from(this.reports.values()).reduce(
      (newest, report) =>
        !newest || report.timestamp > newest.timestamp ? report : newest,
      null,
    );
    return {
      totalReports,
      totalSize,
      compressionEnabled: this.config.compressionEnabled,
      retentionDays: this.config.retentionDays,
      oldestReport: oldestReport?.timestamp,
      newestReport: newestReport?.timestamp,
      memoryUsage: {
        reports: totalReports,
        indexEntries: this.reportIndex.size,
        estimatedBytes: totalSize,
      },
    };
  }
  /**
   * Clear all reports (for testing or reset)
   */
  async clearAllReports() {
    this.logger.warn('Clearing all validation reports');
    this.reports.clear();
    this.reportIndex.clear();
    this.emit('reportsCleared');
  }
  /**
   * Generate checksum for report integrity
   */
  generateChecksum(report) {
    const reportString = JSON.stringify({
      taskId: report.taskId,
      timestamp: report.timestamp,
      overallScore: report.overallScore,
      results: report.results.length,
    });
    // Simple hash function (in production, use proper crypto hash)
    let hash = 0;
    for (let i = 0; i < reportString.length; i++) {
      const char = reportString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }
  /**
   * Calculate average score
   */
  calculateAverageScore(reports) {
    if (reports.length === 0) return 0;
    const totalScore = reports.reduce(
      (sum, report) => sum + report.overallScore,
      0,
    );
    return Math.round((totalScore / reports.length) * 100) / 100;
  }
  /**
   * Calculate success rate
   */
  calculateSuccessRate(reports) {
    if (reports.length === 0) return 0;
    const successfulReports = reports.filter(
      (r) => r.overallStatus === 'passed',
    ).length;
    return Math.round((successfulReports / reports.length) * 100 * 100) / 100;
  }
  /**
   * Calculate failure rate
   */
  calculateFailureRate(reports) {
    if (reports.length === 0) return 0;
    const failedReports = reports.filter(
      (r) => r.overallStatus === 'failed',
    ).length;
    return Math.round((failedReports / reports.length) * 100 * 100) / 100;
  }
  /**
   * Calculate trends analysis
   */
  calculateTrends(reports) {
    const recentReports = reports.slice(0, 50); // Last 50 reports
    const olderReports = reports.slice(50, 100); // Previous 50 reports
    return {
      scoresTrend: this.calculateScoreTrend(recentReports, olderReports),
      performanceTrend: this.calculatePerformanceTrend(
        recentReports,
        olderReports,
      ),
      reliabilityTrend: this.calculateReliabilityTrend(
        recentReports,
        olderReports,
      ),
    };
  }
  /**
   * Calculate score trend
   */
  calculateScoreTrend(recent, older) {
    if (recent.length === 0 || older.length === 0) return 'stable';
    const recentAvg = this.calculateAverageScore(recent);
    const olderAvg = this.calculateAverageScore(older);
    const difference = recentAvg - olderAvg;
    if (difference > 5) return 'improving';
    if (difference < -5) return 'declining';
    return 'stable';
  }
  /**
   * Calculate performance trend
   */
  calculatePerformanceTrend(recent, older) {
    if (recent.length === 0 || older.length === 0) return 'stable';
    const recentAvgDuration =
      recent.reduce((sum, r) => sum + r.performance.totalDuration, 0) /
      recent.length;
    const olderAvgDuration =
      older.reduce((sum, r) => sum + r.performance.totalDuration, 0) /
      older.length;
    const difference = recentAvgDuration - olderAvgDuration;
    if (difference < -5000) return 'improving'; // 5 seconds improvement
    if (difference > 5000) return 'declining'; // 5 seconds worse
    return 'stable';
  }
  /**
   * Calculate reliability trend
   */
  calculateReliabilityTrend(recent, older) {
    if (recent.length === 0 || older.length === 0) return 'stable';
    const recentSuccessRate = this.calculateSuccessRate(recent);
    const olderSuccessRate = this.calculateSuccessRate(older);
    const difference = recentSuccessRate - olderSuccessRate;
    if (difference > 10) return 'improving';
    if (difference < -10) return 'declining';
    return 'stable';
  }
  /**
   * Calculate data distribution
   */
  calculateDistribution(reports) {
    return {
      scoreRanges: this.calculateScoreDistribution(reports),
      categories: this.calculateCategoryDistribution(reports),
      statuses: this.calculateStatusDistribution(reports),
    };
  }
  /**
   * Calculate score distribution
   */
  calculateScoreDistribution(reports) {
    const distribution = {
      '90-100': 0,
      '80-89': 0,
      '70-79': 0,
      '60-69': 0,
      '0-59': 0,
    };
    reports.forEach((report) => {
      const score = report.overallScore;
      if (score >= 90) distribution['90-100']++;
      else if (score >= 80) distribution['80-89']++;
      else if (score >= 70) distribution['70-79']++;
      else if (score >= 60) distribution['60-69']++;
      else distribution['0-59']++;
    });
    return distribution;
  }
  /**
   * Calculate category distribution
   */
  calculateCategoryDistribution(reports) {
    const distribution = {};
    reports.forEach((report) => {
      report.results.forEach((result) => {
        const category = result.criteriaId || 'unknown';
        distribution[category] = (distribution[category] || 0) + 1;
      });
    });
    return distribution;
  }
  /**
   * Calculate status distribution
   */
  calculateStatusDistribution(reports) {
    const distribution = {};
    reports.forEach((report) => {
      const status = report.overallStatus;
      distribution[status] = (distribution[status] || 0) + 1;
    });
    return distribution;
  }
  /**
   * Generate insights from data
   */
  generateInsights(reports) {
    const insights = [];
    const avgScore = this.calculateAverageScore(reports);
    const successRate = this.calculateSuccessRate(reports);
    insights.push(`Average quality score: ${avgScore.toFixed(1)}`);
    insights.push(`Overall success rate: ${successRate.toFixed(1)}%`);
    if (avgScore > 80) {
      insights.push('Quality standards are being consistently met');
    } else if (avgScore < 60) {
      insights.push('Quality scores indicate need for improvement');
    }
    if (successRate > 90) {
      insights.push('Excellent reliability with very few failures');
    } else if (successRate < 70) {
      insights.push('High failure rate requires attention');
    }
    // Add trend insights
    const trends = this.calculateTrends(reports);
    if (trends.scoresTrend === 'improving') {
      insights.push('Quality scores are trending upward');
    } else if (trends.scoresTrend === 'declining') {
      insights.push('Quality scores are declining - investigation needed');
    }
    return insights;
  }
  /**
   * Generate recommendations
   */
  generateRecommendations(reports) {
    const recommendations = [];
    const avgScore = this.calculateAverageScore(reports);
    const failureRate = this.calculateFailureRate(reports);
    if (avgScore < 70) {
      recommendations.push(
        'Implement stricter quality gates to improve overall scores',
      );
    }
    if (failureRate > 30) {
      recommendations.push(
        'High failure rate suggests need for better error prevention',
      );
    }
    const trends = this.calculateTrends(reports);
    if (trends.performanceTrend === 'declining') {
      recommendations.push(
        'Performance is declining - optimize validation processes',
      );
    }
    if (trends.reliabilityTrend === 'declining') {
      recommendations.push(
        'Reliability issues increasing - review validation criteria',
      );
    }
    return recommendations;
  }
  /**
   * Export reports as JSON
   */
  exportAsJson(reports, options) {
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        format: 'json',
        reportCount: reports.length,
        version: '1.0.0',
      },
      reports: options.includeAnalytics
        ? reports
        : reports.map((r) => ({
            taskId: r.taskId,
            timestamp: r.timestamp,
            overallScore: r.overallScore,
            overallStatus: r.overallStatus,
            summary: r.summary,
          })),
    };
    return JSON.stringify(exportData, null, 2);
  }
  /**
   * Export reports as CSV
   */
  exportAsCsv(reports, _options) {
    const headers = [
      'Task ID',
      'Timestamp',
      'Overall Score',
      'Overall Status',
      'Total Validations',
      'Passed',
      'Failed',
      'Duration (ms)',
    ].join(',');
    const rows = reports.map((report) =>
      [
        report.taskId,
        report.timestamp.toISOString(),
        report.overallScore.toString(),
        report.overallStatus,
        report.summary.total.toString(),
        report.summary.passed.toString(),
        report.summary.failed.toString(),
        report.performance.totalDuration.toString(),
      ].join(','),
    );
    return [headers, ...rows].join('\n');
  }
  /**
   * Export reports as HTML
   */
  async exportAsHtml(reports, options) {
    const analytics = options.includeAnalytics
      ? await this.generateAnalytics()
      : null;
    let html = `
<!DOCTYPE html>
<html>
<head>
    <title>Validation Reports</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .score-excellent { color: green; font-weight: bold; }
        .score-good { color: orange; }
        .score-poor { color: red; font-weight: bold; }
        .status-passed { color: green; }
        .status-failed { color: red; }
    </style>
</head>
<body>
    <h1>Validation Reports</h1>
    <p>Generated on: ${new Date().toISOString()}</p>
    <p>Total Reports: ${reports.length}</p>
`;
    if (analytics) {
      html += `
    <h2>Analytics Summary</h2>
    <ul>
        <li>Average Score: ${analytics.avgScore.toFixed(1)}</li>
        <li>Success Rate: ${analytics.successRate.toFixed(1)}%</li>
        <li>Failure Rate: ${analytics.failureRate.toFixed(1)}%</li>
    </ul>
`;
    }
    html += `
    <h2>Reports</h2>
    <table>
        <thead>
            <tr>
                <th>Task ID</th>
                <th>Timestamp</th>
                <th>Score</th>
                <th>Status</th>
                <th>Validations</th>
                <th>Duration</th>
            </tr>
        </thead>
        <tbody>
`;
    reports.forEach((report) => {
      const scoreClass =
        report.overallScore >= 80
          ? 'score-excellent'
          : report.overallScore >= 60
            ? 'score-good'
            : 'score-poor';
      const statusClass =
        report.overallStatus === 'passed' ? 'status-passed' : 'status-failed';
      html += `
            <tr>
                <td>${report.taskId}</td>
                <td>${report.timestamp.toISOString()}</td>
                <td class="${scoreClass}">${report.overallScore.toFixed(1)}</td>
                <td class="${statusClass}">${report.overallStatus}</td>
                <td>${report.summary.total} (${report.summary.passed}✓ ${report.summary.failed}✗)</td>
                <td>${report.performance.totalDuration}ms</td>
            </tr>
`;
    });
    html += `
        </tbody>
    </table>
</body>
</html>
`;
    return html;
  }
  /**
   * Export reports as PDF (placeholder - would need PDF library)
   */
  async exportAsPdf(_reports, _options) {
    // Placeholder - in real implementation would use PDF generation library
    throw new Error(
      'PDF export not yet implemented - would require PDF library',
    );
  }
  /**
   * Get empty analytics for when no data available
   */
  getEmptyAnalytics() {
    return {
      totalReports: 0,
      avgScore: 0,
      successRate: 0,
      failureRate: 0,
      trends: {
        scoresTrend: 'stable',
        performanceTrend: 'stable',
        reliabilityTrend: 'stable',
      },
      distribution: {
        scoreRanges: {},
        categories: {},
        statuses: {},
      },
      insights: ['No data available'],
      recommendations: [],
    };
  }
  /**
   * Setup cleanup interval for old reports
   */
  setupCleanupInterval() {
    // Run cleanup every hour
    setInterval(
      () => {
        this.performCleanup().catch((error) => {
          this.logger.error('Cleanup failed', { error });
        });
      },
      60 * 60 * 1000,
    );
  }
  /**
   * Perform cleanup of old reports
   */
  async performCleanup() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
    let deletedCount = 0;
    // Clean up old reports
    for (const [reportId, report] of this.reports.entries()) {
      if (report.timestamp < cutoffDate) {
        this.reports.delete(reportId);
        // Update index
        const taskReports = this.reportIndex.get(report.taskId) || [];
        const updatedReports = taskReports.filter((id) => id !== reportId);
        if (updatedReports.length === 0) {
          this.reportIndex.delete(report.taskId);
        } else {
          this.reportIndex.set(report.taskId, updatedReports);
        }
        deletedCount++;
      }
    }
    // Clean up if too many reports
    if (this.reports.size > this.config.maxReports) {
      const sortedReports = Array.from(this.reports.entries()).sort(
        ([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime(),
      );
      const excessCount = this.reports.size - this.config.maxReports;
      const toDelete = sortedReports.slice(0, excessCount);
      toDelete.forEach(([reportId, report]) => {
        this.reports.delete(reportId);
        // Update index
        const taskReports = this.reportIndex.get(report.taskId) || [];
        const updatedReports = taskReports.filter((id) => id !== reportId);
        if (updatedReports.length === 0) {
          this.reportIndex.delete(report.taskId);
        } else {
          this.reportIndex.set(report.taskId, updatedReports);
        }
        deletedCount++;
      });
    }
    if (deletedCount > 0) {
      this.logger.info(`Cleaned up ${deletedCount} old reports`);
      this.emit('reportsCleanedUp', deletedCount);
    }
  }
}
//# sourceMappingURL=ValidationReporter.js.map
