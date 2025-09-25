/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../logger/Logger.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
/**
 * Report format types
 */
export let ReportFormat = {};
(function (ReportFormat) {
  ReportFormat['JSON'] = 'json';
  ReportFormat['XML'] = 'xml';
  ReportFormat['HTML'] = 'html';
  ReportFormat['CSV'] = 'csv';
  ReportFormat['JUNIT'] = 'junit';
  ReportFormat['SARIF'] = 'sarif';
})(ReportFormat || (ReportFormat = {}));
/**
 * Analytics time period
 */
export let AnalyticsPeriod = {};
(function (AnalyticsPeriod) {
  AnalyticsPeriod['HOUR'] = 'hour';
  AnalyticsPeriod['DAY'] = 'day';
  AnalyticsPeriod['WEEK'] = 'week';
  AnalyticsPeriod['MONTH'] = 'month';
  AnalyticsPeriod['YEAR'] = 'year';
})(AnalyticsPeriod || (AnalyticsPeriod = {}));
/**
 * Comprehensive validation reporting and analytics system
 */
export class ValidationReporting extends EventEmitter {
  logger;
  config;
  metricsStore = new Map();
  reportHistory = [];
  dashboardWidgets = new Map();
  dashboardServer; // HTTP server for dashboard
  metricsCollectionInterval;
  constructor(config = {}) {
    super();
    this.logger = new Logger('ValidationReporting');
    this.config = {
      outputDirectory: './validation-reports',
      formats: [ReportFormat.JSON, ReportFormat.HTML],
      includeDetails: true,
      includeMetadata: true,
      aggregateReports: true,
      archiveOldReports: true,
      archiveAfterDays: 30,
      analytics: {
        enabled: true,
        retentionPeriod: 90,
        trackingMetrics: ['duration', 'success_rate', 'failure_types'],
        alertThresholds: {
          failureRate: 0.1,
          avgDuration: 5000,
          errorCount: 10,
        },
      },
      dashboard: {
        enabled: false,
        port: 8080,
        updateInterval: 30000,
        widgets: ['metrics', 'trends', 'alerts', 'failures'],
      },
      notifications: {
        enabled: false,
        channels: [],
      },
      ...config,
    };
    this.initializeReporting();
  }
  /**
   * Initialize reporting system
   */
  async initializeReporting() {
    try {
      // Create output directory
      await fs.mkdir(this.config.outputDirectory, { recursive: true });
      // Initialize analytics if enabled
      if (this.config.analytics.enabled) {
        this.initializeAnalytics();
      }
      // Initialize dashboard if enabled
      if (this.config.dashboard.enabled) {
        await this.initializeDashboard();
      }
      this.logger.info('ValidationReporting initialized', {
        outputDirectory: this.config.outputDirectory,
        formats: this.config.formats,
        analyticsEnabled: this.config.analytics.enabled,
        dashboardEnabled: this.config.dashboard.enabled,
      });
    } catch (error) {
      this.logger.error('Failed to initialize validation reporting', { error });
      throw error;
    }
  }
  /**
   * Generate report for validation results
   */
  async generateReport(data, customMetadata) {
    const reportId = `report-${data.taskId}-${Date.now()}`;
    const generatedPaths = {};
    this.logger.info(`Generating validation report: ${reportId}`, {
      taskId: data.taskId,
      formats: this.config.formats,
    });
    try {
      // Add to report history
      this.reportHistory.push(data);
      // Update analytics
      if (this.config.analytics.enabled) {
        await this.updateAnalytics(data);
      }
      // Prepare template data
      const templateData = await this.prepareTemplateData(data, customMetadata);
      // Generate reports in all configured formats
      for (const format of this.config.formats) {
        try {
          const filePath = await this.generateReportFormat(
            reportId,
            format,
            templateData,
          );
          generatedPaths[format] = filePath;
        } catch (formatError) {
          this.logger.error(`Failed to generate ${format} report`, {
            error: formatError,
          });
        }
      }
      // Generate aggregated reports if enabled
      if (this.config.aggregateReports) {
        await this.updateAggregatedReports();
      }
      // Send notifications if configured
      if (this.config.notifications.enabled) {
        await this.sendReportNotifications(data, generatedPaths);
      }
      // Archive old reports if configured
      if (this.config.archiveOldReports) {
        await this.archiveOldReports();
      }
      this.emit('reportGenerated', {
        reportId,
        taskId: data.taskId,
        paths: generatedPaths,
        timestamp: new Date(),
      });
      return generatedPaths;
    } catch (error) {
      this.logger.error(`Failed to generate report: ${reportId}`, { error });
      this.emit('reportGenerationFailed', {
        reportId,
        taskId: data.taskId,
        error: error.message,
      });
      throw error;
    }
  }
  /**
   * Generate report in specific format
   */
  async generateReportFormat(reportId, format, templateData) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${reportId}-${timestamp}.${format}`;
    const filePath = path.join(this.config.outputDirectory, filename);
    let content;
    switch (format) {
      case ReportFormat.JSON:
        content = await this.generateJSONReport(templateData);
        break;
      case ReportFormat.XML:
        content = await this.generateXMLReport(templateData);
        break;
      case ReportFormat.HTML:
        content = await this.generateHTMLReport(templateData);
        break;
      case ReportFormat.CSV:
        content = await this.generateCSVReport(templateData);
        break;
      case ReportFormat.JUNIT:
        content = await this.generateJUnitReport(templateData);
        break;
      case ReportFormat.SARIF:
        content = await this.generateSARIFReport(templateData);
        break;
      default:
        throw new Error(`Unsupported report format: ${format}`);
    }
    await fs.writeFile(filePath, content, 'utf-8');
    this.logger.debug(`Generated ${format} report: ${filePath}`);
    return filePath;
  }
  /**
   * Generate JSON report
   */
  async generateJSONReport(templateData) {
    const jsonReport = {
      version: '1.0.0',
      generatedAt: templateData.generatedAt.toISOString(),
      report: templateData.report,
      summary: templateData.summary,
      ...(this.config.includeMetadata && { metadata: templateData.metadata }),
      ...(this.config.analytics.enabled && { metrics: templateData.metrics }),
    };
    return JSON.stringify(jsonReport, null, 2);
  }
  /**
   * Generate XML report
   */
  async generateXMLReport(templateData) {
    const escapeXml = (str) =>
      str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    const report = templateData.report;
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<ValidationReport>\n';
    xml += `  <GeneratedAt>${templateData.generatedAt.toISOString()}</GeneratedAt>\n`;
    xml += `  <TaskId>${escapeXml(report.taskId)}</TaskId>\n`;
    xml += `  <Timestamp>${report.timestamp.toISOString()}</Timestamp>\n`;
    xml += `  <Duration>${report.duration}</Duration>\n`;
    // Add summary
    xml += '  <Summary>\n';
    xml += `    <TotalIssues>${templateData.summary.totalIssues}</TotalIssues>\n`;
    xml += `    <CriticalIssues>${templateData.summary.criticalIssues}</CriticalIssues>\n`;
    xml += `    <ErrorIssues>${templateData.summary.errorIssues}</ErrorIssues>\n`;
    xml += `    <WarningIssues>${templateData.summary.warningIssues}</WarningIssues>\n`;
    xml += `    <PassRate>${templateData.summary.passRate}</PassRate>\n`;
    xml += '  </Summary>\n';
    // Add results if available
    if ('results' in report && this.config.includeDetails) {
      xml += '  <Results>\n';
      for (const result of report.results) {
        xml += '    <Result>\n';
        xml += `      <Id>${escapeXml(result.id)}</Id>\n`;
        xml += `      <Category>${escapeXml(result.category)}</Category>\n`;
        xml += `      <Severity>${escapeXml(result.severity)}</Severity>\n`;
        xml += `      <Status>${escapeXml(result.status)}</Status>\n`;
        xml += `      <Message>${escapeXml(result.message)}</Message>\n`;
        if (result.file)
          xml += `      <File>${escapeXml(result.file)}</File>\n`;
        if (result.line) xml += `      <Line>${result.line}</Line>\n`;
        xml += '    </Result>\n';
      }
      xml += '  </Results>\n';
    }
    xml += '</ValidationReport>\n';
    return xml;
  }
  /**
   * Generate HTML report
   */
  async generateHTMLReport(templateData) {
    const report = templateData.report;
    const summary = templateData.summary;
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Validation Report - ${report.taskId}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: #e8f4fd; padding: 15px; border-radius: 5px; text-align: center; }
        .metric.error { background: #fee; }
        .metric.warning { background: #fff3cd; }
        .metric.success { background: #d1f2eb; }
        .results { margin: 20px 0; }
        .result { border: 1px solid #ddd; margin: 10px 0; padding: 10px; border-radius: 3px; }
        .result.error { border-color: #dc3545; }
        .result.warning { border-color: #ffc107; }
        .result.passed { border-color: #28a745; }
        .severity { font-weight: bold; padding: 2px 6px; border-radius: 3px; color: white; }
        .severity.critical { background: #dc3545; }
        .severity.error { background: #fd7e14; }
        .severity.warning { background: #ffc107; color: black; }
        .severity.info { background: #17a2b8; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Validation Report</h1>
        <p><strong>Task ID:</strong> ${report.taskId}</p>
        <p><strong>Generated:</strong> ${templateData.generatedAt.toISOString()}</p>
        <p><strong>Duration:</strong> ${report.duration}ms</p>
    </div>

    <div class="summary">
        <div class="metric success">
            <h3>Pass Rate</h3>
            <p>${summary.passRate.toFixed(1)}%</p>
        </div>
        <div class="metric error">
            <h3>Critical Issues</h3>
            <p>${summary.criticalIssues}</p>
        </div>
        <div class="metric error">
            <h3>Error Issues</h3>
            <p>${summary.errorIssues}</p>
        </div>
        <div class="metric warning">
            <h3>Warning Issues</h3>
            <p>${summary.warningIssues}</p>
        </div>
    </div>`;
    // Add results if available
    if (
      'results' in report &&
      this.config.includeDetails &&
      report.results.length > 0
    ) {
      html += '<div class="results"><h2>Validation Results</h2>';
      for (const result of report.results) {
        const statusClass =
          result.status === 'passed'
            ? 'passed'
            : result.status === 'failed'
              ? 'error'
              : 'warning';
        html += `
        <div class="result ${statusClass}">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span class="severity ${result.severity}">${result.severity.toUpperCase()}</span>
                <span>${result.category}</span>
            </div>
            <p><strong>Message:</strong> ${result.message}</p>`;
        if (result.file) {
          html += `<p><strong>File:</strong> ${result.file}`;
          if (result.line) html += `:${result.line}`;
          html += '</p>';
        }
        html += '</div>';
      }
      html += '</div>';
    }
    html += '</body></html>';
    return html;
  }
  /**
   * Generate CSV report
   */
  async generateCSVReport(templateData) {
    const report = templateData.report;
    let csv = 'ID,Category,Severity,Status,Message,File,Line,Timestamp\n';
    if ('results' in report) {
      for (const result of report.results) {
        const escapeCsv = (str) => {
          if (!str) return '';
          return `"${str.replace(/"/g, '""')}"`;
        };
        csv +=
          [
            escapeCsv(result.id),
            escapeCsv(result.category),
            escapeCsv(result.severity),
            escapeCsv(result.status),
            escapeCsv(result.message),
            escapeCsv(result.file),
            result.line || '',
            result.timestamp.toISOString(),
          ].join(',') + '\n';
      }
    }
    return csv;
  }
  /**
   * Generate JUnit XML report
   */
  async generateJUnitReport(templateData) {
    const report = templateData.report;
    const escapeXml = (str) =>
      str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    if ('results' in report) {
      const totalTests = report.results.length;
      const failures = report.results.filter(
        (r) => r.status === 'failed',
      ).length;
      const errors = report.results.filter(
        (r) => r.severity === 'error' || r.severity === 'critical',
      ).length;
      xml += `<testsuite name="${escapeXml(report.taskId)}" `;
      xml += `tests="${totalTests}" failures="${failures}" errors="${errors}" `;
      xml += `time="${(report.duration / 1000).toFixed(3)}" `;
      xml += `timestamp="${report.timestamp.toISOString()}">\n`;
      for (const result of report.results) {
        xml += `  <testcase name="${escapeXml(result.id)}" `;
        xml += `classname="${escapeXml(result.category)}" `;
        xml += `time="${((result.duration || 0) / 1000).toFixed(3)}">\n`;
        if (result.status === 'failed') {
          xml += `    <failure message="${escapeXml(result.message)}" `;
          xml += `type="${escapeXml(result.severity)}">\n`;
          xml += `      ${escapeXml(result.message)}\n`;
          if (result.details) xml += `      ${escapeXml(result.details)}\n`;
          xml += '    </failure>\n';
        }
        xml += '  </testcase>\n';
      }
      xml += '</testsuite>\n';
    } else {
      xml +=
        '<testsuite name="ValidationWorkflow" tests="0" failures="0" errors="0" time="0"/>\n';
    }
    return xml;
  }
  /**
   * Generate SARIF report for security findings
   */
  async generateSARIFReport(templateData) {
    const report = templateData.report;
    const sarif = {
      version: '2.1.0',
      $schema:
        'https://schemastore.azurewebsites.net/schemas/json/sarif-2.1.0.json',
      runs: [
        {
          tool: {
            driver: {
              name: 'GeminiCLI Validation',
              version: '1.0.0',
              informationUri: 'https://github.com/google-gemini/gemini-cli',
            },
          },
          results: [],
        },
      ],
    };
    if ('results' in report) {
      for (const result of report.results) {
        if (result.category === 'security') {
          sarif.runs[0].results.push({
            ruleId: result.rule || result.id,
            level:
              result.severity === 'critical'
                ? 'error'
                : result.severity === 'error'
                  ? 'error'
                  : result.severity === 'warning'
                    ? 'warning'
                    : 'note',
            message: {
              text: result.message,
            },
            locations: result.file
              ? [
                  {
                    physicalLocation: {
                      artifactLocation: {
                        uri: result.file,
                      },
                      region: result.line
                        ? {
                            startLine: result.line,
                            startColumn: result.column || 1,
                          }
                        : undefined,
                    },
                  },
                ]
              : undefined,
          });
        }
      }
    }
    return JSON.stringify(sarif, null, 2);
  }
  /**
   * Prepare template data for report generation
   */
  async prepareTemplateData(data, customMetadata) {
    let totalIssues = 0;
    let criticalIssues = 0;
    let errorIssues = 0;
    let warningIssues = 0;
    if ('results' in data) {
      totalIssues = data.results.filter((r) => r.status === 'failed').length;
      criticalIssues = data.results.filter(
        (r) => r.severity === 'critical',
      ).length;
      errorIssues = data.results.filter((r) => r.severity === 'error').length;
      warningIssues = data.results.filter(
        (r) => r.severity === 'warning',
      ).length;
    } else {
      totalIssues = data.summary.totalIssues;
      criticalIssues = data.summary.criticalIssues;
      errorIssues = data.summary.errorIssues;
      warningIssues = data.summary.warningIssues;
    }
    const totalValidations =
      'totalRules' in data ? data.totalRules : data.summary.totalValidators;
    const passedValidations =
      'passedRules' in data ? data.passedRules : data.summary.passedValidators;
    const passRate =
      totalValidations > 0 ? (passedValidations / totalValidations) * 100 : 0;
    const failureRate = 100 - passRate;
    return {
      report: data,
      summary: {
        totalIssues,
        criticalIssues,
        errorIssues,
        warningIssues,
        passRate,
        failureRate,
      },
      metrics: await this.getCurrentMetrics(),
      generatedAt: new Date(),
      metadata: {
        ...data.metadata,
        ...customMetadata,
        reportingConfig: {
          formats: this.config.formats,
          includeDetails: this.config.includeDetails,
        },
      },
    };
  }
  /**
   * Initialize analytics collection
   */
  initializeAnalytics() {
    // Start metrics collection interval
    this.metricsCollectionInterval = setInterval(() => {
      this.collectMetrics();
    }, 60000); // Collect metrics every minute
    this.logger.debug('Analytics collection initialized');
  }
  /**
   * Initialize dashboard
   */
  async initializeDashboard() {
    // This would initialize a web dashboard for real-time metrics
    // For now, just initialize widgets
    this.initializeDashboardWidgets();
    this.logger.debug('Dashboard initialized');
  }
  /**
   * Initialize dashboard widgets
   */
  initializeDashboardWidgets() {
    this.dashboardWidgets.set('metrics', {
      id: 'metrics',
      title: 'Validation Metrics',
      type: 'metric',
      data: {},
      lastUpdated: new Date(),
    });
    this.dashboardWidgets.set('trends', {
      id: 'trends',
      title: 'Validation Trends',
      type: 'chart',
      data: {},
      lastUpdated: new Date(),
    });
  }
  /**
   * Update analytics with new data
   */
  async updateAnalytics(data) {
    // This would update analytics database or storage
    // For now, just update in-memory metrics
    await this.collectMetrics();
  }
  /**
   * Collect current metrics
   */
  async collectMetrics() {
    // Implementation would collect and aggregate metrics from report history
    this.logger.debug('Collecting validation metrics');
  }
  /**
   * Get current metrics
   */
  async getCurrentMetrics() {
    // Placeholder implementation - would calculate actual metrics from stored data
    return {
      totalValidations: this.reportHistory.length,
      successfulValidations: 0,
      failedValidations: 0,
      averageDuration: 0,
      validationsByCategory: {},
      validationsBySeverity: {},
      validationsByStatus: {},
      trendsOverTime: [],
      topFailures: [],
      performanceMetrics: {
        p50Duration: 0,
        p90Duration: 0,
        p99Duration: 0,
        slowestValidations: [],
      },
    };
  }
  /**
   * Update aggregated reports
   */
  async updateAggregatedReports() {
    // This would generate aggregated reports for different time periods
    this.logger.debug('Updating aggregated reports');
  }
  /**
   * Send report notifications
   */
  async sendReportNotifications(data, paths) {
    // Implementation would send notifications via configured channels
    this.logger.debug('Sending report notifications');
  }
  /**
   * Archive old reports
   */
  async archiveOldReports() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.archiveAfterDays);
    try {
      const files = await fs.readdir(this.config.outputDirectory);
      for (const file of files) {
        const filePath = path.join(this.config.outputDirectory, file);
        const stats = await fs.stat(filePath);
        if (stats.mtime < cutoffDate) {
          // Archive or delete old file
          await fs.unlink(filePath);
          this.logger.debug(`Archived old report: ${file}`);
        }
      }
    } catch (error) {
      this.logger.warn('Failed to archive old reports', { error });
    }
  }
  /**
   * Get reporting statistics
   */
  getStatistics() {
    const recentReports = this.reportHistory.filter(
      (report) => Date.now() - report.timestamp.getTime() < 24 * 60 * 60 * 1000,
    ).length;
    return {
      totalReports: this.reportHistory.length,
      recentReports,
      activeWidgets: this.dashboardWidgets.size,
      supportedFormats: Object.values(ReportFormat),
    };
  }
  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.metricsCollectionInterval) {
      clearInterval(this.metricsCollectionInterval);
    }
    if (this.dashboardServer) {
      this.dashboardServer.close();
    }
    this.logger.info('ValidationReporting cleanup completed');
  }
}
//# sourceMappingURL=ValidationReporting.js.map
