/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import type { ValidationReport } from './ValidationFramework.js';
import type { WorkflowExecutionResult } from './ValidationWorkflow.js';
/**
 * Report format types
 */
export declare enum ReportFormat {
    JSON = "json",
    XML = "xml",
    HTML = "html",
    CSV = "csv",
    JUNIT = "junit",
    SARIF = "sarif"
}
/**
 * Analytics time period
 */
export declare enum AnalyticsPeriod {
    HOUR = "hour",
    DAY = "day",
    WEEK = "week",
    MONTH = "month",
    YEAR = "year"
}
/**
 * Reporting configuration
 */
export interface ValidationReportingConfig {
    outputDirectory: string;
    formats: ReportFormat[];
    includeDetails: boolean;
    includeMetadata: boolean;
    aggregateReports: boolean;
    archiveOldReports: boolean;
    archiveAfterDays: number;
    analytics: {
        enabled: boolean;
        retentionPeriod: number;
        trackingMetrics: string[];
        alertThresholds: {
            failureRate: number;
            avgDuration: number;
            errorCount: number;
        };
    };
    dashboard: {
        enabled: boolean;
        port?: number;
        updateInterval: number;
        widgets: string[];
    };
    notifications: {
        enabled: boolean;
        channels: Array<{
            type: 'webhook' | 'email' | 'slack';
            config: Record<string, unknown>;
            triggers: string[];
        }>;
    };
}
/**
 * Comprehensive validation reporting and analytics system
 */
export declare class ValidationReporting extends EventEmitter {
    private readonly logger;
    private readonly config;
    private readonly metricsStore;
    private readonly reportHistory;
    private readonly dashboardWidgets;
    private dashboardServer?;
    private metricsCollectionInterval?;
    constructor(config?: Partial<ValidationReportingConfig>);
    /**
     * Initialize reporting system
     */
    private initializeReporting;
    /**
     * Generate report for validation results
     */
    generateReport(data: ValidationReport | WorkflowExecutionResult, customMetadata?: Record<string, unknown>): Promise<{
        [format: string]: string;
    }>;
    /**
     * Generate report in specific format
     */
    private generateReportFormat;
    /**
     * Generate JSON report
     */
    private generateJSONReport;
    /**
     * Generate XML report
     */
    private generateXMLReport;
    /**
     * Generate HTML report
     */
    private generateHTMLReport;
    /**
     * Generate CSV report
     */
    private generateCSVReport;
    /**
     * Generate JUnit XML report
     */
    private generateJUnitReport;
    /**
     * Generate SARIF report for security findings
     */
    private generateSARIFReport;
    /**
     * Prepare template data for report generation
     */
    private prepareTemplateData;
    /**
     * Initialize analytics collection
     */
    private initializeAnalytics;
    /**
     * Initialize dashboard
     */
    private initializeDashboard;
    /**
     * Initialize dashboard widgets
     */
    private initializeDashboardWidgets;
    /**
     * Update analytics with new data
     */
    private updateAnalytics;
    /**
     * Collect current metrics
     */
    private collectMetrics;
    /**
     * Get current metrics
     */
    private getCurrentMetrics;
    /**
     * Update aggregated reports
     */
    private updateAggregatedReports;
    /**
     * Send report notifications
     */
    private sendReportNotifications;
    /**
     * Archive old reports
     */
    private archiveOldReports;
    /**
     * Get reporting statistics
     */
    getStatistics(): {
        totalReports: number;
        recentReports: number;
        activeWidgets: number;
        supportedFormats: ReportFormat[];
    };
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
