#!/usr/bin/env node

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Security and Performance Monitoring System
 *
 * Comprehensive monitoring and alerting system for the autonomous task management system.
 * Provides real-time security monitoring, performance metrics collection, and automated
 * alerting for security incidents and performance degradation.
 *
 * @version 1.0.0
 * @author Security Performance Analysis Team
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

/**
 * SecurityPerformanceMonitor - Real-time monitoring and alerting system
 */
class SecurityPerformanceMonitor {
  constructor() {
    this.metricsHistory = new Map();
    this.securityEvents = [];
    this.performanceThresholds = {
      memoryUsage: 100 * 1024 * 1024, // 100MB
      cpuUsage: 80, // 80%
      responseTime: 1000, // 1 second
      errorRate: 5, // 5%
    };
    this.securityThresholds = {
      failedAuthAttempts: 5,
      suspiciousFileAccess: 3,
      unusualNetworkActivity: 10,
    };
    this.alertCallbacks = new Set();
    this.isMonitoring = false;
    this.monitoringInterval = null;
  }

  /**
   * Start monitoring system
   */
  async startMonitoring() {
    if (this.isMonitoring) {
      throw new Error('Monitoring already active');
    }

    console.log('🔒 Starting Security and Performance Monitoring System...');
    this.isMonitoring = true;

    // Start periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.analyzeSecurityEvents();
      this.checkThresholds();
    }, 5000); // Monitor every 5 seconds

    await this.initializeBaseline();
    console.log('✅ Monitoring system active');
  }

  /**
   * Stop monitoring system
   */
  async stopMonitoring() {
    if (!this.isMonitoring) return;

    console.log('🛑 Stopping monitoring system...');
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    await this.generateReport();
    console.log('✅ Monitoring stopped, report generated');
  }

  /**
   * Initialize performance baseline
   */
  async initializeBaseline() {
    const baseline = {
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      cpu: this.getCPUUsage(),
      systemInfo: {
        platform: process.platform,
        nodeVersion: process.version,
        architecture: process.arch,
      },
    };

    await this.writeMetricsFile('baseline.json', baseline);
    console.log('📊 Performance baseline established');
  }

  /**
   * Collect real-time metrics
   */
  collectMetrics() {
    const timestamp = Date.now();
    const metrics = {
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      cpu: this.getCPUUsage(),
      uptime: process.uptime(),
      pid: process.pid,
    };

    this.metricsHistory.set(timestamp, metrics);

    // Keep only last 1000 metrics
    if (this.metricsHistory.size > 1000) {
      const oldestKey = Math.min(...this.metricsHistory.keys());
      this.metricsHistory.delete(oldestKey);
    }

    return metrics;
  }

  /**
   * Get CPU usage percentage
   */
  getCPUUsage() {
    const cpuUsage = process.cpuUsage();
    return {
      user: cpuUsage.user,
      system: cpuUsage.system,
      total: cpuUsage.user + cpuUsage.system,
    };
  }

  /**
   * Log security event
   */
  logSecurityEvent(type, severity, details) {
    const event = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type,
      severity, // 'low', 'medium', 'high', 'critical'
      details,
      source: 'autonomous-task-system',
    };

    this.securityEvents.push(event);

    // Keep only last 1000 events
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }

    // Trigger immediate alert for high/critical events
    if (severity === 'high' || severity === 'critical') {
      this.triggerAlert('security', event);
    }

    return event.id;
  }

  /**
   * Analyze security events for patterns
   */
  analyzeSecurityEvents() {
    const recentEvents = this.securityEvents.filter(
      (event) => Date.now() - new Date(event.timestamp).getTime() < 60000, // Last minute
    );

    // Check for suspicious patterns
    const eventTypes = {};
    recentEvents.forEach((event) => {
      eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;
    });

    // Alert on unusual activity patterns
    Object.entries(eventTypes).forEach(([type, count]) => {
      const threshold = this.securityThresholds[type] || 10;
      if (count > threshold) {
        this.triggerAlert('security_pattern', {
          type: `Unusual ${type} activity`,
          count,
          threshold,
          timeframe: '1 minute',
        });
      }
    });
  }

  /**
   * Check performance and security thresholds
   */
  checkThresholds() {
    const currentMetrics = this.collectMetrics();
    const alerts = [];

    // Memory threshold check
    if (currentMetrics.memory.rss > this.performanceThresholds.memoryUsage) {
      alerts.push({
        type: 'memory_high',
        severity: 'medium',
        value: currentMetrics.memory.rss,
        threshold: this.performanceThresholds.memoryUsage,
      });
    }

    // Heap usage check
    const heapUsagePercent =
      (currentMetrics.memory.heapUsed / currentMetrics.memory.heapTotal) * 100;
    if (heapUsagePercent > 90) {
      alerts.push({
        type: 'heap_usage_critical',
        severity: 'high',
        value: heapUsagePercent,
        threshold: 90,
      });
    }

    // Trigger alerts
    alerts.forEach((alert) => this.triggerAlert('performance', alert));
  }

  /**
   * Trigger alert to all registered callbacks
   */
  triggerAlert(category, data) {
    const alert = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      category,
      data,
      level: data.severity || 'medium',
    };

    console.warn(
      `🚨 ALERT [${category.toUpperCase()}]:`,
      JSON.stringify(alert, null, 2),
    );

    this.alertCallbacks.forEach((callback) => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Alert callback error:', error);
      }
    });
  }

  /**
   * Register alert callback
   */
  onAlert(callback) {
    this.alertCallbacks.add(callback);
    return () => this.alertCallbacks.delete(callback);
  }

  /**
   * Get current system health status
   */
  getHealthStatus() {
    const currentMetrics = this.collectMetrics();
    const recentAlerts = this.getRecentAlerts();

    let status = 'healthy';
    if (recentAlerts.filter((a) => a.level === 'critical').length > 0) {
      status = 'critical';
    } else if (recentAlerts.filter((a) => a.level === 'high').length > 0) {
      status = 'warning';
    } else if (recentAlerts.length > 0) {
      status = 'caution';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      metrics: currentMetrics,
      recentAlerts: recentAlerts.length,
      uptime: process.uptime(),
    };
  }

  /**
   * Get recent alerts (last 10 minutes)
   */
  getRecentAlerts() {
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    return this.securityEvents.filter(
      (event) => new Date(event.timestamp).getTime() > tenMinutesAgo,
    );
  }

  /**
   * Generate comprehensive monitoring report
   */
  async generateReport() {
    const report = {
      reportId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      duration: process.uptime(),
      summary: {
        totalMetricsCollected: this.metricsHistory.size,
        totalSecurityEvents: this.securityEvents.length,
        healthStatus: this.getHealthStatus(),
        alertsSummary: this.generateAlertsSummary(),
      },
      performance: {
        averageMemoryUsage: this.calculateAverageMemoryUsage(),
        peakMemoryUsage: this.calculatePeakMemoryUsage(),
        memoryTrend: this.analyzeMemoryTrend(),
        cpuAnalysis: this.analyzeCPUUsage(),
      },
      security: {
        eventsByType: this.groupSecurityEventsByType(),
        severityDistribution: this.calculateSeverityDistribution(),
        topSecurityConcerns: this.identifyTopSecurityConcerns(),
      },
      recommendations: this.generateRecommendations(),
    };

    await this.writeReportFile('security-performance-report.json', report);
    return report;
  }

  /**
   * Calculate average memory usage
   */
  calculateAverageMemoryUsage() {
    if (this.metricsHistory.size === 0) return 0;

    const totalMemory = Array.from(this.metricsHistory.values()).reduce(
      (sum, metrics) => sum + metrics.memory.rss,
      0,
    );

    return Math.round(totalMemory / this.metricsHistory.size);
  }

  /**
   * Calculate peak memory usage
   */
  calculatePeakMemoryUsage() {
    if (this.metricsHistory.size === 0) return 0;

    return Math.max(
      ...Array.from(this.metricsHistory.values()).map(
        (metrics) => metrics.memory.rss,
      ),
    );
  }

  /**
   * Analyze memory trend
   */
  analyzeMemoryTrend() {
    const metrics = Array.from(this.metricsHistory.values());
    if (metrics.length < 2) return 'insufficient_data';

    const first = metrics[0].memory.rss;
    const last = metrics[metrics.length - 1].memory.rss;
    const change = ((last - first) / first) * 100;

    if (change > 20) return 'increasing_significantly';
    if (change > 5) return 'increasing_moderately';
    if (change < -20) return 'decreasing_significantly';
    if (change < -5) return 'decreasing_moderately';
    return 'stable';
  }

  /**
   * Analyze CPU usage patterns
   */
  analyzeCPUUsage() {
    const metrics = Array.from(this.metricsHistory.values());
    if (metrics.length === 0) return { average: 0, peak: 0, trend: 'stable' };

    const cpuValues = metrics.map((m) => m.cpu.total);
    const average =
      cpuValues.reduce((sum, val) => sum + val, 0) / cpuValues.length;
    const peak = Math.max(...cpuValues);

    return {
      average: Math.round(average),
      peak,
      trend: this.analyzeTrend(cpuValues),
    };
  }

  /**
   * Analyze trend of numeric values
   */
  analyzeTrend(values) {
    if (values.length < 2) return 'stable';

    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / Math.max(first, 1)) * 100;

    if (change > 20) return 'increasing_significantly';
    if (change > 5) return 'increasing_moderately';
    if (change < -20) return 'decreasing_significantly';
    if (change < -5) return 'decreasing_moderately';
    return 'stable';
  }

  /**
   * Group security events by type
   */
  groupSecurityEventsByType() {
    const groups = {};
    this.securityEvents.forEach((event) => {
      groups[event.type] = (groups[event.type] || 0) + 1;
    });
    return groups;
  }

  /**
   * Calculate security event severity distribution
   */
  calculateSeverityDistribution() {
    const distribution = { low: 0, medium: 0, high: 0, critical: 0 };
    this.securityEvents.forEach((event) => {
      distribution[event.severity] = (distribution[event.severity] || 0) + 1;
    });
    return distribution;
  }

  /**
   * Identify top security concerns
   */
  identifyTopSecurityConcerns() {
    const concerns = [];
    const eventsByType = this.groupSecurityEventsByType();

    Object.entries(eventsByType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .forEach(([type, count]) => {
        concerns.push({ type, count });
      });

    return concerns;
  }

  /**
   * Generate alerts summary
   */
  generateAlertsSummary() {
    const recentAlerts = this.getRecentAlerts();
    const distribution = {};

    recentAlerts.forEach((alert) => {
      const level = alert.severity || 'medium';
      distribution[level] = (distribution[level] || 0) + 1;
    });

    return {
      total: recentAlerts.length,
      distribution,
      lastAlert:
        recentAlerts.length > 0 ? recentAlerts[recentAlerts.length - 1] : null,
    };
  }

  /**
   * Generate security and performance recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    const memoryTrend = this.analyzeMemoryTrend();
    const securityEvents = this.calculateSeverityDistribution();

    // Memory recommendations
    if (memoryTrend === 'increasing_significantly') {
      recommendations.push({
        category: 'performance',
        priority: 'high',
        title: 'Memory Usage Optimization',
        description:
          'Memory usage is increasing significantly. Implement memory leak detection and optimize data structures.',
        actions: [
          'Enable garbage collection monitoring',
          'Implement object pooling for frequently created objects',
          'Add memory profiling in development',
          'Set up automated memory alerts',
        ],
      });
    }

    // Security recommendations
    if (securityEvents.high > 0 || securityEvents.critical > 0) {
      recommendations.push({
        category: 'security',
        priority: 'critical',
        title: 'Security Event Response',
        description:
          'High or critical security events detected. Immediate investigation required.',
        actions: [
          'Review security event logs immediately',
          'Check for unauthorized access attempts',
          'Verify system integrity',
          'Update security policies if needed',
        ],
      });
    }

    // Task management recommendations
    recommendations.push({
      category: 'reliability',
      priority: 'medium',
      title: 'Task Queue Optimization',
      description: 'Optimize task queue performance and add redundancy.',
      actions: [
        'Implement task queue persistence',
        'Add task retry mechanisms',
        'Monitor task execution times',
        'Set up task failure notifications',
      ],
    });

    // File locking recommendations
    recommendations.push({
      category: 'concurrency',
      priority: 'medium',
      title: 'File Locking Enhancement',
      description: 'Improve file locking mechanism for better concurrency.',
      actions: [
        'Add deadlock detection',
        'Implement lock timeout mechanisms',
        'Monitor lock contention',
        'Optimize lock granularity',
      ],
    });

    return recommendations;
  }

  /**
   * Write metrics file
   */
  async writeMetricsFile(filename, data) {
    const filePath = path.join(process.cwd(), 'monitoring', filename);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  /**
   * Write report file
   */
  async writeReportFile(filename, data) {
    const filePath = path.join(process.cwd(), filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`📋 Report saved to: ${filePath}`);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'start';

  const monitor = new SecurityPerformanceMonitor();

  // Set up alert logging
  monitor.onAlert((alert) => {
    console.log(`📢 Alert: ${alert.category} - ${alert.level}`);
  });

  try {
    switch (command) {
      case 'start':
        await monitor.startMonitoring();

        // Run for 30 seconds as demonstration
        setTimeout(async () => {
          await monitor.stopMonitoring();
          process.exit(0);
        }, 30000);
        break;

      case 'status': {
        const health = monitor.getHealthStatus();
        console.log('System Health:', JSON.stringify(health, null, 2));
        break;
      }

      case 'report': {
        const report = await monitor.generateReport();
        console.log('Report generated:', report.reportId);
        break;
      }

      default:
        console.log(
          'Usage: node security-performance-monitor.js [start|status|report]',
        );
    }
  } catch (error) {
    console.error('Monitor error:', error);
    process.exit(1);
  }
}

// Export for programmatic use
module.Exports = SecurityPerformanceMonitor;

// Run CLI if called directly
if (require.main === module) {
  main().catch(console.error);
}
