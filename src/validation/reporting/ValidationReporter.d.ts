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
import type { ValidationReport } from '../core/ValidationEngine.js';
/**
 * Report storage configuration
 */
export interface ReportStorageConfig {
    maxReports: number;
    retentionDays: number;
    compressionEnabled: boolean;
    backupEnabled: boolean;
    exportFormats: ('json' | 'csv' | 'html' | 'pdf')[];
}
/**
 * Report query filters
 */
export interface ReportFilters {
    taskId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    status?: string;
    minScore?: number;
    maxScore?: number;
    categories?: string[];
    limit?: number;
    offset?: number;
}
/**
 * Report analytics data
 */
export interface ReportAnalytics {
    totalReports: number;
    avgScore: number;
    successRate: number;
    failureRate: number;
    trends: {
        scoresTrend: 'improving' | 'stable' | 'declining';
        performanceTrend: 'improving' | 'stable' | 'declining';
        reliabilityTrend: 'improving' | 'stable' | 'declining';
    };
    distribution: {
        scoreRanges: Record<string, number>;
        categories: Record<string, number>;
        statuses: Record<string, number>;
    };
    insights: string[];
    recommendations: string[];
}
/**
 * Report export options
 */
export interface ReportExportOptions {
    format: 'json' | 'csv' | 'html' | 'pdf';
    filters?: ReportFilters;
    includeCharts?: boolean;
    includeAnalytics?: boolean;
    template?: string;
}
/**
 * Stored report with metadata
 */
export interface StoredReport extends ValidationReport {
    storedAt: Date;
    compressed: boolean;
    version: string;
    checksum: string;
}
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
export declare class ValidationReporter extends EventEmitter {
    private readonly logger;
    private readonly config;
    private readonly reports;
    private readonly reportIndex;
    constructor(config?: Partial<ReportStorageConfig>);
    /**
     * Store validation report
     */
    storeReport(report: ValidationReport): Promise<void>;
    /**
     * Retrieve validation report by ID
     */
    getReport(reportId: string): Promise<StoredReport | null>;
    /**
     * Query reports with filters
     */
    queryReports(filters?: ReportFilters): Promise<StoredReport[]>;
    /**
     * Get reports for specific task
     */
    getTaskReports(taskId: string): Promise<StoredReport[]>;
    /**
     * Generate comprehensive analytics
     */
    generateAnalytics(filters?: ReportFilters): Promise<ReportAnalytics>;
    /**
     * Export reports in specified format
     */
    exportReports(options: ReportExportOptions): Promise<string>;
    /**
     * Get storage statistics
     */
    getStorageStats(): {
        totalReports: number;
        totalSize: number;
        compressionEnabled: boolean;
        retentionDays: number;
        oldestReport: Date | undefined;
        newestReport: Date | undefined;
        memoryUsage: {
            reports: number;
            indexEntries: number;
            estimatedBytes: number;
        };
    };
    /**
     * Clear all reports (for testing or reset)
     */
    clearAllReports(): Promise<void>;
    /**
     * Generate checksum for report integrity
     */
    private generateChecksum;
    /**
     * Calculate average score
     */
    private calculateAverageScore;
    /**
     * Calculate success rate
     */
    private calculateSuccessRate;
    /**
     * Calculate failure rate
     */
    private calculateFailureRate;
    /**
     * Calculate trends analysis
     */
    private calculateTrends;
    /**
     * Calculate score trend
     */
    private calculateScoreTrend;
    /**
     * Calculate performance trend
     */
    private calculatePerformanceTrend;
    /**
     * Calculate reliability trend
     */
    private calculateReliabilityTrend;
    /**
     * Calculate data distribution
     */
    private calculateDistribution;
    /**
     * Calculate score distribution
     */
    private calculateScoreDistribution;
    /**
     * Calculate category distribution
     */
    private calculateCategoryDistribution;
    /**
     * Calculate status distribution
     */
    private calculateStatusDistribution;
    /**
     * Generate insights from data
     */
    private generateInsights;
    /**
     * Generate recommendations
     */
    private generateRecommendations;
    /**
     * Export reports as JSON
     */
    private exportAsJson;
    /**
     * Export reports as CSV
     */
    private exportAsCsv;
    /**
     * Export reports as HTML
     */
    private exportAsHtml;
    /**
     * Export reports as PDF (placeholder - would need PDF library)
     */
    private exportAsPdf;
    /**
     * Get empty analytics for when no data available
     */
    private getEmptyAnalytics;
    /**
     * Setup cleanup interval for old reports
     */
    private setupCleanupInterval;
    /**
     * Perform cleanup of old reports
     */
    private performCleanup;
}
