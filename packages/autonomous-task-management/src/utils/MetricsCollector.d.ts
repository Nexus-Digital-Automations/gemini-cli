/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * MetricsCollector utility for the Autonomous Task Management System
 */
export declare class MetricsCollector {
    private readonly config;
    private readonly metrics;
    private isStarted;
    private collectionInterval;
    constructor(config: MonitoringConfig);
    start(): void;
    stop(): void;
    incrementCounter(name: string, tags?: Record<string, string>): void;
    setGauge(name: string, value: number, tags?: Record<string, string>): void;
    recordTimer(name: string, duration: number, tags?: Record<string, string>): void;
    getMetrics(): Metric[];
    private getMetricKey;
    private collectSystemMetrics;
}
interface MonitoringConfig {
    enableMetrics?: boolean;
    metricsInterval?: number;
    alertThresholds?: Record<string, number>;
}
interface Metric {
    name: string;
    type: string;
    value: number;
    timestamp: Date;
    tags: Record<string, string>;
}
export {};
