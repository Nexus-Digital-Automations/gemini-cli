/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ErrorEvent, ErrorMetrics, MonitoringAlert, MonitoredApplication, AlertRule, SystemHealth } from './types.js';
import { type ErrorAnalysisEngineConfig } from './ErrorAnalysisEngine.js';
/**
 * Configuration for real-time error monitor
 */
export interface RealTimeErrorMonitorConfig {
    /** Error analysis engine configuration */
    errorAnalysis: Partial<ErrorAnalysisEngineConfig>;
    /** Enable real-time monitoring */
    enableRealTimeMonitoring: boolean;
    /** Enable error pattern detection */
    enablePatternDetection: boolean;
    /** Enable trend analysis */
    enableTrendAnalysis: boolean;
    /** Enable automatic alerting */
    enableAutoAlerting: boolean;
    /** Monitoring interval in milliseconds */
    monitoringInterval: number;
    /** Maximum error history to maintain */
    maxErrorHistory: number;
    /** Error rate threshold for alerts */
    errorRateThreshold: number;
    /** Memory usage threshold for health checks */
    memoryThreshold: number;
    /** CPU usage threshold for health checks */
    cpuThreshold: number;
    /** Enable health monitoring */
    enableHealthMonitoring: boolean;
    /** Health check interval in milliseconds */
    healthCheckInterval: number;
    /** Error severity thresholds */
    severityThresholds: {
        warning: number;
        error: number;
        critical: number;
    };
}
/**
 * Default configuration for real-time error monitor
 */
export declare const DEFAULT_REAL_TIME_ERROR_MONITOR_CONFIG: RealTimeErrorMonitorConfig;
/**
 * Real-Time Error Monitor
 *
 * Continuous monitoring system for detecting, analyzing, and responding to errors
 * in live applications with real-time alerting and pattern detection.
 *
 * Key Features:
 * - **Continuous Monitoring**: Real-time error detection and analysis
 * - **Pattern Recognition**: Identifies error patterns and anomalies
 * - **Trend Analysis**: Tracks error trends and predicts potential issues
 * - **Intelligent Alerting**: Context-aware alerts with severity-based thresholds
 * - **Health Monitoring**: System health checks and performance metrics
 * - **Multi-Application Support**: Monitor multiple applications simultaneously
 * - **Flexible Filtering**: Configurable error filters and rules
 * - **Performance Optimized**: Minimal overhead for production environments
 *
 * @example
 * ```typescript
 * const errorMonitor = new RealTimeErrorMonitor({
 *   enableRealTimeMonitoring: true,
 *   enableAutoAlerting: true,
 *   errorRateThreshold: 10,
 * });
 *
 * await errorMonitor.initialize();
 *
 * // Add application to monitor
 * await errorMonitor.addApplication({
 *   id: 'my-app',
 *   name: 'My Application',
 *   language: 'typescript',
 *   logSources: ['/var/log/app.log'],
 * });
 *
 * // Subscribe to error events
 * errorMonitor.subscribe('error-spike', (alert) => {
 *   console.log('Error spike detected:', alert);
 *   // Send notification, trigger scaling, etc.
 * });
 *
 * // Start monitoring
 * await errorMonitor.startMonitoring();
 * ```
 */
export declare class RealTimeErrorMonitor {
    private config;
    private errorAnalysisEngine?;
    private monitoredApps;
    private errorHistory;
    private subscribers;
    private alertRules;
    private monitoringTimer?;
    private healthCheckTimer?;
    private currentMetrics;
    private isMonitoring;
    private isInitialized;
    constructor(config?: Partial<RealTimeErrorMonitorConfig>);
    /**
     * Initialize the real-time error monitor
     */
    initialize(): Promise<void>;
    /**
     * Add an application to monitor
     */
    addApplication(application: Omit<MonitoredApplication, 'status' | 'lastSeen'>): Promise<void>;
    /**
     * Remove an application from monitoring
     */
    removeApplication(applicationId: string): Promise<void>;
    /**
     * Start real-time monitoring
     */
    startMonitoring(): Promise<void>;
    /**
     * Stop real-time monitoring
     */
    stopMonitoring(): Promise<void>;
    /**
     * Record an error event
     */
    recordError(error: {
        message: string;
        stack?: string;
        applicationId: string;
        timestamp?: Date;
        severity?: 'low' | 'medium' | 'high' | 'critical';
        context?: Record<string, unknown>;
    }): Promise<void>;
    /**
     * Subscribe to error events and alerts
     */
    subscribe(eventType: string, callback: (alert: MonitoringAlert) => void): void;
    /**
     * Unsubscribe from error events
     */
    unsubscribe(eventType: string, callback: (alert: MonitoringAlert) => void): void;
    /**
     * Add custom alert rule
     */
    addAlertRule(rule: AlertRule): void;
    /**
     * Remove alert rule
     */
    removeAlertRule(ruleId: string): boolean;
    /**
     * Get current error metrics
     */
    getCurrentMetrics(): ErrorMetrics;
    /**
     * Get error history
     */
    getErrorHistory(limit?: number, applicationId?: string): ErrorEvent[];
    /**
     * Get system health status
     */
    getSystemHealth(): SystemHealth;
    /**
     * Get monitoring statistics
     */
    getMonitoringStats(): {
        isMonitoring: boolean;
        monitoredApplications: number;
        totalErrorsRecorded: number;
        activeAlertRules: number;
        subscribers: number;
        uptime: number;
    };
    /**
     * Clear error history
     */
    clearHistory(): void;
    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<RealTimeErrorMonitorConfig>): void;
    /**
     * Perform monitoring cycle
     */
    private performMonitoringCycle;
    /**
     * Perform health check
     */
    private performHealthCheck;
    /**
     * Add error to history with size management
     */
    private addToErrorHistory;
    /**
     * Update error metrics
     */
    private updateMetrics;
    /**
     * Check for error patterns
     */
    private checkErrorPatterns;
    /**
     * Emit error event to subscribers
     */
    private emitErrorEvent;
    /**
     * Trigger pattern-based alert
     */
    private triggerPatternAlert;
    /**
     * Trigger alert and notify subscribers
     */
    private triggerAlert;
    /**
     * Update application statuses
     */
    private updateApplicationStatuses;
    /**
     * Check alert conditions
     */
    private checkAlertConditions;
    /**
     * Perform trend analysis
     */
    private performTrendAnalysis;
    /**
     * Clean up old error history
     */
    private cleanupErrorHistory;
    /**
     * Initialize built-in alert rules
     */
    private initializeAlertRules;
    /**
     * Get initial metrics object
     */
    private getInitialMetrics;
    /**
     * Get current system metrics
     */
    private getSystemMetrics;
}
/**
 * Create a Real-Time Error Monitor instance
 */
export declare function createRealTimeErrorMonitor(config?: Partial<RealTimeErrorMonitorConfig>): Promise<RealTimeErrorMonitor>;
