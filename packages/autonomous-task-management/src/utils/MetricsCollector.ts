/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * MetricsCollector utility for the Autonomous Task Management System
 */
export class MetricsCollector {
  private readonly config: MonitoringConfig;
  private readonly metrics: Map<string, Metric> = new Map();
  private isStarted = false;
  private collectionInterval: NodeJS.Timeout | null = null;

  constructor(config: MonitoringConfig) {
    this.config = config;
  }

  start(): void {
    if (this.isStarted) return;

    this.isStarted = true;
    if (this.config.metricsInterval) {
      this.collectionInterval = setInterval(() => {
        this.collectSystemMetrics();
      }, this.config.metricsInterval);
    }
  }

  stop(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
    this.isStarted = false;
  }

  incrementCounter(name: string, tags?: Record<string, string>): void {
    const key = this.getMetricKey(name, tags);
    const existing = this.metrics.get(key);

    if (existing) {
      existing.value += 1;
      existing.timestamp = new Date();
    } else {
      this.metrics.set(key, {
        name,
        type: 'counter',
        value: 1,
        timestamp: new Date(),
        tags: tags || {}
      });
    }
  }

  setGauge(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.getMetricKey(name, tags);
    this.metrics.set(key, {
      name,
      type: 'gauge',
      value,
      timestamp: new Date(),
      tags: tags || {}
    });
  }

  recordTimer(name: string, duration: number, tags?: Record<string, string>): void {
    const key = this.getMetricKey(name, tags);
    this.metrics.set(key, {
      name,
      type: 'timer',
      value: duration,
      timestamp: new Date(),
      tags: tags || {}
    });
  }

  getMetrics(): Metric[] {
    return Array.from(this.metrics.values());
  }

  private getMetricKey(name: string, tags?: Record<string, string>): string {
    const tagString = tags ? JSON.stringify(tags) : '';
    return `${name}:${tagString}`;
  }

  private collectSystemMetrics(): void {
    // Collect basic system metrics
    const memoryUsage = process.memoryUsage();
    this.setGauge('system.memory.heap_used', memoryUsage.heapUsed);
    this.setGauge('system.memory.heap_total', memoryUsage.heapTotal);
    this.setGauge('system.uptime', process.uptime());
  }
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