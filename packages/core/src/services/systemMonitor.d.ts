/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * System Monitor and Alerting Service
 *
 * Provides comprehensive monitoring and alerting for the autonomous task management system:
 * - Real-time performance metrics collection
 * - Health monitoring of all system components
 * - Intelligent alerting based on configurable thresholds
 * - Historical data tracking and trend analysis
 * - Dashboard data for system observability
 */
import { EventEmitter } from 'node:events';
import type { Config } from '../index.js';
import type { AutonomousTaskIntegrator } from './autonomousTaskIntegrator.js';
import type { IntegrationBridge } from './integrationBridge.js';
export interface SystemMetrics {
    timestamp: Date;
    system: {
        uptime: number;
        cpu: {
            usage: number;
            cores: number;
        };
        memory: {
            used: number;
            total: number;
            percentage: number;
        };
        process: {
            pid: number;
            memory: number;
            cpu: number;
        };
    };
    tasks: {
        total: number;
        queued: number;
        assigned: number;
        in_progress: number;
        completed: number;
        failed: number;
        cancelled: number;
        avgWaitTime: number;
        avgExecutionTime: number;
        throughput: number;
    };
    agents: {
        total: number;
        active: number;
        busy: number;
        idle: number;
        offline: number;
        avgLoadPerAgent: number;
        responseTime: number;
    };
    integrator: {
        queueDepth: number;
        processingRate: number;
        errorRate: number;
        successRate: number;
    };
    bridge: {
        apiCalls: number;
        apiErrors: number;
        apiLatency: number;
        syncStatus: 'healthy' | 'degraded' | 'failed';
    };
}
export interface Alert {
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    category: 'performance' | 'availability' | 'capacity' | 'security' | 'integration';
    title: string;
    description: string;
    metrics: Record<string, number>;
    threshold: Record<string, number>;
    timestamp: Date;
    resolved?: Date;
    source: string;
    tags: string[];
}
export interface MonitoringConfig {
    enabled: boolean;
    metricsInterval: number;
    alertingEnabled: boolean;
    retentionDays: number;
    thresholds: {
        cpu: {
            warning: number;
            critical: number;
        };
        memory: {
            warning: number;
            critical: number;
        };
        queueDepth: {
            warning: number;
            critical: number;
        };
        errorRate: {
            warning: number;
            critical: number;
        };
        responseTime: {
            warning: number;
            critical: number;
        };
        agentAvailability: {
            warning: number;
            critical: number;
        };
    };
    dashboardConfig: {
        refreshInterval: number;
        historyPeriod: number;
    };
}
/**
 * Comprehensive system monitoring and alerting service
 */
export declare class SystemMonitor extends EventEmitter {
    private config;
    private monitoringConfig;
    private taskIntegrator?;
    private integrationBridge?;
    private metricsHistory;
    private activeAlerts;
    private alertHistory;
    private monitoringTimer?;
    private isMonitoring;
    private startTime;
    private metricsCache;
    private cacheTTL;
    constructor(config: Config, monitoringConfig?: Partial<MonitoringConfig>);
    /**
     * Initialize the monitoring system
     */
    initialize(taskIntegrator?: AutonomousTaskIntegrator, integrationBridge?: IntegrationBridge): Promise<void>;
    /**
     * Start continuous system monitoring
     */
    startMonitoring(): Promise<void>;
    /**
     * Stop system monitoring
     */
    stopMonitoring(): void;
    /**
     * Get current system status and metrics
     */
    getCurrentMetrics(): Promise<SystemMetrics>;
    /**
     * Get historical metrics for dashboard
     */
    getHistoricalMetrics(period?: number): SystemMetrics[];
    /**
     * Get active alerts
     */
    getActiveAlerts(): Alert[];
    /**
     * Get alert history
     */
    getAlertHistory(limit?: number): Alert[];
    /**
     * Get system health summary
     */
    getHealthSummary(): {
        status: 'healthy' | 'warning' | 'critical';
        score: number;
        issues: string[];
        uptime: number;
        lastCheck: Date;
    };
    /**
     * Create custom alert
     */
    createAlert(alertConfig: Omit<Alert, 'id' | 'timestamp'>): Alert;
    /**
     * Resolve an active alert
     */
    resolveAlert(alertId: string): boolean;
    private collectMetrics;
    private collectSystemMetrics;
    private collectTaskMetrics;
    private collectAgentMetrics;
    private collectIntegratorMetrics;
    private collectBridgeMetrics;
    private getSystemMemory;
    private evaluateAlerts;
    private cleanupOldData;
    private generateAlertId;
}
