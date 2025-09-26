/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Type definitions for monitoring test utilities
 * These types replace explicit 'any' types in test files
 */
export interface MockRealTimeMonitoring {
    getCurrentSnapshot: jest.MockedFunction<() => MonitoringSnapshot>;
    startMonitoring: jest.MockedFunction<() => void>;
    stopMonitoring: jest.MockedFunction<() => void>;
    on: jest.MockedFunction<(event: string, handler: (data: unknown) => void) => void>;
    emit: jest.MockedFunction<(event: string, data: unknown) => void>;
    getAlertHistory: jest.MockedFunction<() => AlertEvent[]>;
    getPerformanceMetrics: jest.MockedFunction<() => PerformanceMetrics>;
    updateConfiguration: jest.MockedFunction<(config: Record<string, unknown>) => void>;
    getActiveAlerts: jest.MockedFunction<() => AlertSummary[]>;
    getPredictiveInsights: jest.MockedFunction<() => Record<string, unknown>[]>;
    getMonitoringHistory: jest.MockedFunction<() => Record<string, unknown>[]>;
}
export interface MockTaskStatusMonitor {
    getPerformanceMetrics: jest.MockedFunction<() => TaskPerformanceMetrics>;
    getCurrentStatus: jest.MockedFunction<() => TaskStatus>;
    getTaskHistory: jest.MockedFunction<() => TaskHistoryItem[]>;
    on: jest.MockedFunction<(event: string, handler: (data: unknown) => void) => void>;
    shutdown: jest.MockedFunction<() => void>;
}
export interface MockPerformanceAnalytics {
    getSystemMetrics: jest.MockedFunction<() => SystemMetrics>;
    getResourceUsage: jest.MockedFunction<() => ResourceUsage>;
    getCPUMetrics: jest.MockedFunction<() => CPUMetrics>;
    getMemoryMetrics: jest.MockedFunction<() => MemoryMetrics>;
    shutdown: jest.MockedFunction<() => void>;
}
export interface AlertEvent {
    type: 'triggered' | 'resolved' | 'escalated';
    alertId: string;
    timestamp: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    conditions?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}
export interface MetricEvent {
    type: 'metric' | 'performance' | 'resource';
    timestamp: number;
    value: number | Record<string, unknown>;
    metric: string;
    tags?: Record<string, string>;
}
export interface CorrelatedEvent {
    correlationId: string;
    events: EventBase[];
    timestamp: number;
    type: 'correlation';
}
export interface SyncEvent {
    type: 'sync' | 'state-change' | 'configuration-update';
    timestamp: number;
    source: string;
    data: Record<string, unknown>;
}
export interface HealthEvent {
    type: 'health-check' | 'status-update' | 'component-status';
    timestamp: number;
    component: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    details?: Record<string, unknown>;
}
export interface EventBase {
    type: string;
    timestamp: number;
    [key: string]: unknown;
}
export interface MonitoringSnapshot {
    timestamp: number;
    taskMetrics: TaskMetrics;
    performanceMetrics: PerformanceMetrics;
    systemHealth: SystemHealth;
    alerts: AlertSummary[];
}
export interface TaskMetrics {
    total: number;
    completed: number;
    failed: number;
    running: number;
    queued: number;
    averageExecutionTime: number;
}
export interface PerformanceMetrics {
    cpu: {
        usage: number;
        cores: number;
        loadAverage: number[];
    };
    memory: {
        used: number;
        total: number;
        percentage: number;
    };
    disk: {
        used: number;
        total: number;
        percentage: number;
    };
}
export interface TaskPerformanceMetrics extends PerformanceMetrics {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageTaskDuration: number;
    throughput: number;
}
export interface SystemHealth {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    components: ComponentHealth[];
    uptime: number;
}
export interface ComponentHealth {
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastCheck: number;
    details?: Record<string, unknown>;
}
export interface AlertSummary {
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: number;
    active: boolean;
}
export interface TaskStatus {
    id: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startTime?: number;
    endTime?: number;
    progress?: number;
}
export interface TaskHistoryItem {
    taskId: string;
    name: string;
    status: 'completed' | 'failed';
    startTime: number;
    endTime: number;
    duration: number;
    result?: Record<string, unknown>;
    error?: string;
}
export interface SystemMetrics {
    uptime: number;
    load: number[];
    processes: number;
    threads: number;
    openFiles: number;
    networkConnections: number;
}
export interface ResourceUsage {
    cpu: CPUMetrics;
    memory: MemoryMetrics;
    disk: DiskMetrics;
    network: NetworkMetrics;
}
export interface CPUMetrics {
    usage: number;
    cores: number;
    frequency: number;
    temperature?: number;
}
export interface MemoryMetrics {
    total: number;
    used: number;
    free: number;
    available: number;
    percentage: number;
    cached?: number;
    buffers?: number;
}
export interface DiskMetrics {
    total: number;
    used: number;
    free: number;
    percentage: number;
    readOperations: number;
    writeOperations: number;
    readBytes: number;
    writeBytes: number;
}
export interface NetworkMetrics {
    bytesReceived: number;
    bytesSent: number;
    packetsReceived: number;
    packetsSent: number;
    errors: number;
    dropped: number;
}
export interface AlertCondition {
    condition: (data: MonitoringSnapshot) => boolean;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}
export interface TestAlertCondition {
    condition: (data: Record<string, unknown>) => boolean;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}
export interface TestEventData extends Record<string, unknown> {
    type: string;
    timestamp?: number;
}
export interface TestMetricData extends Record<string, unknown> {
    value: number;
    timestamp: number;
    metric: string;
}
export interface TestConfigData extends Record<string, unknown> {
    [key: string]: string | number | boolean | Record<string, unknown>;
}
