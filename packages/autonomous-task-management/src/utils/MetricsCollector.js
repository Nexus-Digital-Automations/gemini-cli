/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * MetricsCollector utility for the Autonomous Task Management System
 */
export class MetricsCollector {
    config;
    metrics = new Map();
    isStarted = false;
    collectionInterval = null;
    constructor(config) {
        this.config = config;
    }
    start() {
        if (this.isStarted)
            return;
        this.isStarted = true;
        if (this.config.metricsInterval) {
            this.collectionInterval = setInterval(() => {
                this.collectSystemMetrics();
            }, this.config.metricsInterval);
        }
    }
    stop() {
        if (this.collectionInterval) {
            clearInterval(this.collectionInterval);
            this.collectionInterval = null;
        }
        this.isStarted = false;
    }
    incrementCounter(name, tags) {
        const key = this.getMetricKey(name, tags);
        const existing = this.metrics.get(key);
        if (existing) {
            existing.value += 1;
            existing.timestamp = new Date();
        }
        else {
            this.metrics.set(key, {
                name,
                type: 'counter',
                value: 1,
                timestamp: new Date(),
                tags: tags || {}
            });
        }
    }
    setGauge(name, value, tags) {
        const key = this.getMetricKey(name, tags);
        this.metrics.set(key, {
            name,
            type: 'gauge',
            value,
            timestamp: new Date(),
            tags: tags || {}
        });
    }
    recordTimer(name, duration, tags) {
        const key = this.getMetricKey(name, tags);
        this.metrics.set(key, {
            name,
            type: 'timer',
            value: duration,
            timestamp: new Date(),
            tags: tags || {}
        });
    }
    getMetrics() {
        return Array.from(this.metrics.values());
    }
    getMetricKey(name, tags) {
        const tagString = tags ? JSON.stringify(tags) : '';
        return `${name}:${tagString}`;
    }
    collectSystemMetrics() {
        // Collect basic system metrics
        const memoryUsage = process.memoryUsage();
        this.setGauge('system.memory.heap_used', memoryUsage.heapUsed);
        this.setGauge('system.memory.heap_total', memoryUsage.heapTotal);
        this.setGauge('system.uptime', process.uptime());
    }
}
//# sourceMappingURL=MetricsCollector.js.map