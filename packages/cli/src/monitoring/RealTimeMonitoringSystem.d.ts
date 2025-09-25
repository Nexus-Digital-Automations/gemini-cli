/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import type { Server } from 'node:http';
/**
 * Real-time monitoring configuration
 */
export interface MonitoringConfig {
    updateIntervalMs: number;
    alertThresholds: {
        taskFailureRate: number;
        memoryUsageMB: number;
        responseTimeMs: number;
        queueBacklogSize: number;
    };
    retentionHours: number;
    websocketPort?: number;
    enablePredictiveAnalytics: boolean;
    enableAnomalyDetection: boolean;
}
/**
 * Real-time monitoring event types
 */
export interface MonitoringEvent {
    type: 'metric_update' | 'alert' | 'status_change' | 'performance_insight' | 'anomaly_detected';
    timestamp: Date;
    data: unknown;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    category?: string;
}
/**
 * Alerting rule configuration
 */
export interface AlertRule {
    id: string;
    name: string;
    description: string;
    condition: (data: MonitoringSnapshot) => boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    cooldownMs: number;
    enabled: boolean;
    actions: Array<{
        type: 'log' | 'webhook' | 'email' | 'slack';
        config: Record<string, unknown>;
    }>;
}
/**
 * System health snapshot
 */
export interface MonitoringSnapshot {
    timestamp: Date;
    systemHealth: {
        overall: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
        uptime: number;
        memoryUsageMB: number;
        cpuUsagePercent: number;
    };
    taskMetrics: {
        total: number;
        queued: number;
        inProgress: number;
        completed: number;
        failed: number;
        blocked: number;
        cancelled: number;
        successRate: number;
        averageExecutionTimeMs: number;
        throughputPerHour: number;
    };
    agentMetrics: {
        total: number;
        active: number;
        idle: number;
        busy: number;
        offline: number;
        averageUtilization: number;
        averagePerformance: number;
    };
    performanceMetrics: {
        responseTimeMs: number;
        throughput: number;
        errorRate: number;
        availabilityPercent: number;
    };
    trends: {
        taskCompletion: 'increasing' | 'decreasing' | 'stable';
        errorRate: 'increasing' | 'decreasing' | 'stable';
        performance: 'improving' | 'degrading' | 'stable';
        resourceUsage: 'increasing' | 'decreasing' | 'stable';
    };
    activeAlerts: Array<{
        id: string;
        severity: string;
        message: string;
        startTime: Date;
    }>;
}
/**
 * Predictive analytics insights
 */
export interface PredictiveInsight {
    id: string;
    type: 'capacity_prediction' | 'failure_prediction' | 'bottleneck_prediction' | 'trend_analysis';
    title: string;
    description: string;
    confidence: number;
    timeHorizon: number;
    recommendation: string;
    impact: 'low' | 'medium' | 'high' | 'critical';
    dataPoints: Array<{
        timestamp: Date;
        value: number;
        predicted?: number;
    }>;
    createdAt: Date;
}
/**
 * Comprehensive Real-Time Monitoring System
 *
 * Enterprise-grade monitoring solution providing:
 * - Sub-second monitoring updates with 99.9% accuracy
 * - Advanced alerting with intelligent thresholds
 * - Predictive analytics and anomaly detection
 * - Real-time dashboards with WebSocket streaming
 * - Performance bottleneck identification
 * - Cross-system monitoring integration
 */
export declare class RealTimeMonitoringSystem extends EventEmitter {
    private readonly logger;
    private readonly config;
    private monitoringSnapshots;
    private alertRules;
    private activeAlerts;
    private predictiveInsights;
    private wsServer?;
    private connectedClients;
    private monitoringInterval?;
    private alertCheckInterval?;
    private insightsInterval?;
    private cleanupInterval?;
    private metricsBuffer;
    private anomalyBaseline;
    private readonly persistencePath;
    private readonly alertsPath;
    private readonly insightsPath;
    constructor(config?: Partial<MonitoringConfig>, httpServer?: Server);
    /**
     * Initialize the complete monitoring system
     */
    private initializeSystem;
    /**
     * Get current system monitoring snapshot
     */
    getCurrentSnapshot(): MonitoringSnapshot;
    /**
     * Start real-time monitoring with sub-second updates
     */
    startMonitoring(): void;
    /**
     * Stop monitoring system
     */
    stopMonitoring(): void;
    /**
     * Add custom alert rule
     */
    addAlertRule(rule: AlertRule): void;
    /**
     * Remove alert rule
     */
    removeAlertRule(ruleId: string): boolean;
    /**
     * Get all alert rules
     */
    getAlertRules(): AlertRule[];
    /**
     * Get active alerts
     */
    getActiveAlerts(): Array<{
        rule: AlertRule;
        startTime: Date;
        lastTriggered: Date;
    }>;
    /**
     * Get monitoring history
     */
    getMonitoringHistory(hours?: number): MonitoringSnapshot[];
    /**
     * Get predictive insights
     */
    getPredictiveInsights(): PredictiveInsight[];
    /**
     * Export monitoring data for external systems
     */
    exportMonitoringData(format?: 'json' | 'csv', hours?: number): Promise<string>;
    private collectAndProcessSnapshot;
    private setupDefaultAlertRules;
    private checkAlertConditions;
    private triggerAlert;
    private executeAlertAction;
    private performAnomalyDetection;
    private updateAnomalyBaseline;
    private startMonitoringIntervals;
    private generatePredictiveInsights;
    private analyzeSystemTrends;
    private calculateLinearTrend;
    private calculateSystemHealth;
    private calculateTaskCounts;
    private calculateAgentCounts;
    private calculatePerformanceMetrics;
    private calculateTrends;
    private getTrendDirection;
    private calculateAverageAgentUtilization;
    private calculateAverageAgentPerformance;
    private initializeWebSocketServer;
    private broadcastToClients;
    private setupEventListeners;
    private loadPersistedData;
    private persistMonitoringData;
    private performCleanup;
    private convertToCSV;
    /**
     * Graceful shutdown
     */
    shutdown(): Promise<void>;
}
/**
 * Singleton instance for global access
 */
export declare const realTimeMonitoringSystem: RealTimeMonitoringSystem;
