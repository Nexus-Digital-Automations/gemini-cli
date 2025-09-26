/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
export interface HealthCheckResult {
    component: string;
    status: 'healthy' | 'warning' | 'critical' | 'unknown';
    message: string;
    details?: Record<string, unknown>;
    lastChecked: Date;
    nextCheckDue: Date;
    checkDuration: number;
}
export interface SystemHealthSummary {
    overallStatus: 'healthy' | 'degraded' | 'critical' | 'offline';
    healthScore: number;
    lastUpdated: Date;
    components: HealthCheckResult[];
    activeIssues: {
        critical: number;
        warnings: number;
    };
    uptime: number;
    recommendations: string[];
}
export interface HealthCheckConfig {
    component: string;
    checkInterval: number;
    timeout: number;
    retryCount: number;
    criticalThreshold?: number;
    warningThreshold?: number;
    enabled: boolean;
    customChecker?: () => Promise<HealthCheckResult>;
}
export interface DiagnosticReport {
    timestamp: Date;
    systemHealth: SystemHealthSummary;
    performanceMetrics: {
        taskThroughput: number;
        averageResponseTime: number;
        errorRate: number;
        resourceUtilization: number;
    };
    componentStatus: Record<string, {
        status: string;
        metrics: Record<string, number>;
        issues: string[];
    }>;
    recommendations: {
        immediate: string[];
        shortTerm: string[];
        longTerm: string[];
    };
    trends: {
        healthScoreTrend: number[];
        performanceTrend: number[];
        errorTrend: number[];
    };
}
/**
 * Comprehensive Health Diagnostics System
 *
 * Provides system-wide health monitoring and diagnostics for the autonomous task management system.
 * Features include:
 * - Component health checks with configurable intervals
 * - System health scoring and alerting
 * - Diagnostic reporting and trend analysis
 * - Automated issue detection and resolution recommendations
 * - Integration with all monitoring subsystems
 */
export declare class HealthDiagnostics extends EventEmitter {
    private readonly logger;
    private healthChecks;
    private lastHealthResults;
    private checkTimers;
    private healthHistory;
    private systemStartTime;
    private diagnosticsInterval?;
    constructor();
    /**
     * Register a custom health check
     */
    registerHealthCheck(config: HealthCheckConfig): void;
    /**
     * Perform health check for a specific component
     */
    performHealthCheck(componentName: string): Promise<HealthCheckResult>;
    /**
     * Get current system health summary
     */
    getSystemHealthSummary(): Promise<SystemHealthSummary>;
    /**
     * Generate comprehensive diagnostic report
     */
    generateDiagnosticReport(): Promise<DiagnosticReport>;
    /**
     * Get health check history for a component
     */
    getComponentHealthHistory(componentName: string, _hours?: number): HealthCheckResult[];
    /**
     * Enable or disable a health check
     */
    setHealthCheckEnabled(componentName: string, enabled: boolean): boolean;
    /**
     * Update health check configuration
     */
    updateHealthCheckConfig(componentName: string, updates: Partial<HealthCheckConfig>): boolean;
    private initializeHealthChecks;
    private scheduleHealthCheck;
    private performDefaultHealthCheck;
    private calculateHealthScore;
    private generateHealthRecommendations;
    private categorizeRecommendations;
    private startDiagnostics;
    private withTimeout;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
/**
 * Singleton instance for global access
 */
export declare const healthDiagnostics: HealthDiagnostics;
