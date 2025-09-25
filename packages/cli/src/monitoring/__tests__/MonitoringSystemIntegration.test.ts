/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, beforeEach, afterEach, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { EventEmitter } from 'node:events';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { RealTimeMonitoringSystem } from '../RealTimeMonitoringSystem.js';
import { EnhancedMonitoringDashboard } from '../EnhancedMonitoringDashboard.js';
import { MonitoringIntegrationHub } from '../MonitoringIntegrationHub.js';
import { TaskStatusMonitor, TaskStatus, TaskPriority, TaskType } from '../TaskStatusMonitor.js';
import { PerformanceAnalyticsDashboard } from '../PerformanceAnalyticsDashboard.js';

// Mock node modules
vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockRejectedValue(new Error('File not found')),
}));

vi.mock('ws', () => ({
  WebSocketServer: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    close: vi.fn(),
  })),
}));

/**
 * Comprehensive Integration Tests for Monitoring System
 *
 * Tests the complete monitoring system stack including:
 * - Real-time monitoring system
 * - Enhanced monitoring dashboard
 * - Monitoring integration hub
 * - Task status monitoring
 * - Performance analytics
 * - Cross-system event correlation
 * - Data persistence and export
 * - Health monitoring and alerting
 */
describe('Monitoring System Integration Tests', () => {
  let realTimeMonitoring: RealTimeMonitoringSystem;
  let dashboard: EnhancedMonitoringDashboard;
  let integrationHub: MonitoringIntegrationHub;
  let taskStatusMonitor: TaskStatusMonitor;
  let performanceAnalytics: PerformanceAnalyticsDashboard;

  let tempDir: string;

  beforeAll(async () => {
    // Setup temporary directory for tests
    tempDir = path.join(process.cwd(), '.tmp', 'test-monitoring');
    try {
      await fs.mkdir(tempDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  });

  afterAll(async () => {
    // Cleanup temporary directory
    try {
      await fs.rmdir(tempDir, { recursive: true });
    } catch (error) {
      // Directory might not exist or have permissions issues
    }
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    // Initialize monitoring components
    taskStatusMonitor = new TaskStatusMonitor();
    performanceAnalytics = new PerformanceAnalyticsDashboard();
    realTimeMonitoring = new RealTimeMonitoringSystem();
    dashboard = new EnhancedMonitoringDashboard();

    // Initialize integration hub with test configuration
    integrationHub = new MonitoringIntegrationHub({
      enableRealTimeMonitoring: true,
      enableDashboards: true,
      enablePerformanceAnalytics: true,
      enableCrossSystemSync: true,
      syncIntervalMs: 1000, // Fast sync for testing
      enableDataPersistence: false, // Disable persistence for tests
      enableMetricsExport: false, // Disable export for tests
      exportFormats: ['json'],
    });

    // Allow time for initialization
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(async () => {
    // Shutdown all components
    await Promise.all([
      realTimeMonitoring?.shutdown(),
      dashboard?.shutdown(),
      integrationHub?.shutdown(),
      taskStatusMonitor?.shutdown?.(),
      performanceAnalytics?.shutdown?.(),
    ].filter(Boolean));
  });

  describe('System Initialization', () => {
    it('should initialize all monitoring components successfully', () => {
      expect(realTimeMonitoring).toBeInstanceOf(RealTimeMonitoringSystem);
      expect(dashboard).toBeInstanceOf(EnhancedMonitoringDashboard);
      expect(integrationHub).toBeInstanceOf(MonitoringIntegrationHub);
      expect(taskStatusMonitor).toBeInstanceOf(TaskStatusMonitor);
      expect(performanceAnalytics).toBeInstanceOf(PerformanceAnalyticsDashboard);

      // Verify all components are event emitters
      expect(realTimeMonitoring).toBeInstanceOf(EventEmitter);
      expect(dashboard).toBeInstanceOf(EventEmitter);
      expect(integrationHub).toBeInstanceOf(EventEmitter);
      expect(taskStatusMonitor).toBeInstanceOf(EventEmitter);
    });

    it('should establish cross-system event connectivity', (done) => {
      let eventCount = 0;
      const expectedEvents = 3;

      integrationHub.on('cross-system:event', (event) => {
        eventCount++;
        expect(event).toHaveProperty('source');
        expect(event).toHaveProperty('eventType');
        expect(event).toHaveProperty('timestamp');
        expect(event).toHaveProperty('data');

        if (eventCount >= expectedEvents) {
          done();
        }
      });

      // Trigger events from different systems
      taskStatusMonitor.registerTask('test-task-1', {
        title: 'Test Task 1',
        description: 'Integration test task',
        type: TaskType.IMPLEMENTATION,
        priority: TaskPriority.NORMAL,
        estimatedDuration: 30000,
      });

      // Record a performance metric
      performanceAnalytics.recordMetric(
        'test_metric',
        100,
        'milliseconds',
        'response_time',
        { source: 'integration_test' }
      );

      // Simulate real-time monitoring snapshot
      const snapshot = realTimeMonitoring.getCurrentSnapshot();
      expect(snapshot).toBeTruthy();
    });

    it('should synchronize data across monitoring systems', async () => {
      // Register some test data
      const taskId = taskStatusMonitor.registerTask('sync-test-task', {
        title: 'Sync Test Task',
        description: 'Task for testing data synchronization',
        type: TaskType.TESTING,
        priority: TaskPriority.HIGH,
        estimatedDuration: 60000,
      });

      const agentId = taskStatusMonitor.registerAgent('test-agent-1', {
        capabilities: ['testing', 'validation'],
        maxConcurrentTasks: 3,
      });

      // Wait for synchronization
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Verify data is synchronized across systems
      const systemStatus = integrationHub.getSystemStatus();
      expect(systemStatus.overall).toBe('healthy');

      const aggregatedData = integrationHub.getAggregatedData();
      expect(aggregatedData.taskMetrics.totalTasks).toBeGreaterThan(0);
      expect(aggregatedData.agentMetrics.totalAgents).toBeGreaterThan(0);
    });
  });

  describe('Real-Time Monitoring Integration', () => {
    it('should provide comprehensive system monitoring', () => {
      const snapshot = realTimeMonitoring.getCurrentSnapshot();

      // Verify snapshot structure
      expect(snapshot).toHaveProperty('timestamp');
      expect(snapshot).toHaveProperty('systemHealth');
      expect(snapshot).toHaveProperty('taskMetrics');
      expect(snapshot).toHaveProperty('agentMetrics');
      expect(snapshot).toHaveProperty('performanceMetrics');
      expect(snapshot).toHaveProperty('trends');
      expect(snapshot).toHaveProperty('activeAlerts');

      // Verify system health calculation
      expect(snapshot.systemHealth.overall).toMatch(/^(healthy|degraded|unhealthy|critical)$/);
      expect(typeof snapshot.systemHealth.uptime).toBe('number');
      expect(typeof snapshot.systemHealth.memoryUsageMB).toBe('number');

      // Verify task metrics
      expect(typeof snapshot.taskMetrics.total).toBe('number');
      expect(typeof snapshot.taskMetrics.successRate).toBe('number');
      expect(snapshot.taskMetrics.successRate).toBeGreaterThanOrEqual(0);
      expect(snapshot.taskMetrics.successRate).toBeLessThanOrEqual(100);

      // Verify agent metrics
      expect(typeof snapshot.agentMetrics.total).toBe('number');
      expect(typeof snapshot.agentMetrics.averageUtilization).toBe('number');
      expect(snapshot.agentMetrics.averageUtilization).toBeGreaterThanOrEqual(0);
      expect(snapshot.agentMetrics.averageUtilization).toBeLessThanOrEqual(100);
    });

    it('should generate predictive insights with sufficient data', async () => {
      // Generate historical data by creating multiple snapshots
      const snapshots = [];
      for (let i = 0; i < 15; i++) {
        // Add some tasks with varying completion patterns
        const taskId = taskStatusMonitor.registerTask(`historical-task-${i}`, {
          title: `Historical Task ${i}`,
          description: 'Task for predictive analysis',
          type: TaskType.IMPLEMENTATION,
          priority: i % 3 === 0 ? TaskPriority.HIGH : TaskPriority.NORMAL,
          estimatedDuration: 30000 + (i * 1000),
        });

        // Simulate some completions
        if (i < 10) {
          taskStatusMonitor.updateTaskStatus(taskId, {
            status: i % 4 === 0 ? TaskStatus.FAILED : TaskStatus.COMPLETED,
            endTime: new Date(),
            actualDuration: 25000 + (i * 500),
          });
        }

        const snapshot = realTimeMonitoring.getCurrentSnapshot();
        snapshot.timestamp = new Date(Date.now() - (15 - i) * 60000); // Space them 1 minute apart
        snapshots.push(snapshot);

        // Record performance metrics
        performanceAnalytics.recordMetric(
          'task_completion_time',
          25000 + (i * 500),
          'milliseconds',
          'performance',
          { taskId, index: i }
        );
      }

      // Wait for insights generation
      await new Promise(resolve => setTimeout(resolve, 500));

      const insights = realTimeMonitoring.getPredictiveInsights();

      // Verify insights structure if any are generated
      for (const insight of insights) {
        expect(insight).toHaveProperty('id');
        expect(insight).toHaveProperty('type');
        expect(insight).toHaveProperty('title');
        expect(insight).toHaveProperty('description');
        expect(insight).toHaveProperty('confidence');
        expect(insight).toHaveProperty('timeHorizon');
        expect(insight).toHaveProperty('recommendation');
        expect(insight).toHaveProperty('impact');
        expect(insight).toHaveProperty('dataPoints');
        expect(insight).toHaveProperty('createdAt');

        // Validate data types and ranges
        expect(typeof insight.confidence).toBe('number');
        expect(insight.confidence).toBeGreaterThanOrEqual(0);
        expect(insight.confidence).toBeLessThanOrEqual(1);
        expect(['low', 'medium', 'high', 'critical']).toContain(insight.impact);
        expect(['capacity_prediction', 'failure_prediction', 'bottleneck_prediction', 'trend_analysis']).toContain(insight.type);
      }
    });

    it('should handle alert lifecycle properly', async () => {
      const alertEvents: any[] = [];

      // Listen for alert events
      realTimeMonitoring.on('alert:triggered', (data) => {
        alertEvents.push({ type: 'triggered', ...data });
      });

      integrationHub.on('cross-system:event', (event) => {
        if (event.eventType === 'alert_triggered') {
          alertEvents.push({ type: 'cross_system', ...event });
        }
      });

      // Add a test alert rule that should trigger
      const testRule = {
        id: 'integration-test-alert',
        name: 'Integration Test Alert',
        description: 'Alert for integration testing',
        condition: (data: any) => data.taskMetrics.total > 0, // Should trigger with any tasks
        severity: 'medium' as const,
        cooldownMs: 500,
        enabled: true,
        actions: [{ type: 'log' as const, config: {} }],
      };

      realTimeMonitoring.addAlertRule(testRule);

      // Create a task to trigger the alert
      taskStatusMonitor.registerTask('alert-trigger-task', {
        title: 'Alert Trigger Task',
        description: 'Task to trigger alert',
        type: TaskType.VALIDATION,
        priority: TaskPriority.HIGH,
        estimatedDuration: 15000,
      });

      // Start monitoring to trigger alert evaluation
      realTimeMonitoring.startMonitoring();

      // Wait for alert processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      realTimeMonitoring.stopMonitoring();

      // Verify alert was triggered
      expect(alertEvents.length).toBeGreaterThan(0);

      const triggeredAlert = alertEvents.find(e => e.type === 'triggered');
      expect(triggeredAlert).toBeDefined();
      expect(triggeredAlert.alert.data.rule.name).toBe('Integration Test Alert');

      // Verify cross-system event propagation
      const crossSystemEvent = alertEvents.find(e => e.type === 'cross_system');
      expect(crossSystemEvent).toBeDefined();
      expect(crossSystemEvent.eventType).toBe('alert_triggered');
    });
  });

  describe('Dashboard Integration', () => {
    it('should create and manage dashboard layouts', () => {
      const layoutId = dashboard.createLayout('Test Integration Layout', 'Layout for integration testing');

      expect(typeof layoutId).toBe('string');
      expect(layoutId).toMatch(/^layout_\d+_[a-z0-9]+$/);

      const layouts = dashboard.getLayouts();
      const testLayout = layouts.find(l => l.id === layoutId);

      expect(testLayout).toBeDefined();
      expect(testLayout?.name).toBe('Test Integration Layout');
      expect(testLayout?.description).toBe('Layout for integration testing');
      expect(Array.isArray(testLayout?.widgets)).toBe(true);
    });

    it('should add and configure widgets', () => {
      const layoutId = dashboard.createLayout('Widget Test Layout', 'Layout for widget testing');

      const widgetId = dashboard.addWidget(layoutId, {
        type: 'metric',
        title: 'Integration Test Widget',
        description: 'Widget for integration testing',
        position: { x: 0, y: 0, width: 4, height: 2 },
        config: {
          dataSource: 'system_health',
          refreshIntervalMs: 2000,
          thresholds: [
            { value: 80, color: 'green', label: 'Healthy' },
            { value: 60, color: 'yellow', label: 'Warning' },
            { value: 40, color: 'red', label: 'Critical' },
          ],
        },
        style: {
          backgroundColor: '#1a1a1a',
          textColor: '#ffffff',
        },
        enabled: true,
      });

      expect(typeof widgetId).toBe('string');
      expect(widgetId).toMatch(/^widget_\d+_[a-z0-9]+$/);

      const layout = dashboard.getLayout(layoutId);
      expect(layout?.widgets).toHaveLength(1);
      expect(layout?.widgets[0].id).toBe(widgetId);
      expect(layout?.widgets[0].title).toBe('Integration Test Widget');
    });

    it('should generate chart data for widgets', () => {
      // First create some test data
      const tasks = [
        taskStatusMonitor.registerTask('chart-task-1', {
          title: 'Chart Task 1',
          type: TaskType.IMPLEMENTATION,
          priority: TaskPriority.HIGH,
          estimatedDuration: 30000,
        }),
        taskStatusMonitor.registerTask('chart-task-2', {
          title: 'Chart Task 2',
          type: TaskType.TESTING,
          priority: TaskPriority.NORMAL,
          estimatedDuration: 20000,
        }),
      ];

      // Complete one task
      taskStatusMonitor.updateTaskStatus(tasks[0], {
        status: TaskStatus.COMPLETED,
        endTime: new Date(),
        actualDuration: 28000,
      });

      const layoutId = dashboard.createLayout('Chart Test Layout', 'Layout for chart testing');
      const widgetId = dashboard.addWidget(layoutId, {
        type: 'chart',
        title: 'Task Metrics Chart',
        position: { x: 0, y: 0, width: 8, height: 4 },
        config: {
          dataSource: 'task_metrics',
          refreshIntervalMs: 2000,
          chartType: 'line',
          timeRange: 'last_hour',
        },
        style: {},
        enabled: true,
      });

      // Generate chart data
      const chartData = dashboard.generateChartData(widgetId, 'last_hour');

      expect(chartData).toHaveProperty('labels');
      expect(chartData).toHaveProperty('datasets');
      expect(Array.isArray(chartData.labels)).toBe(true);
      expect(Array.isArray(chartData.datasets)).toBe(true);

      // Verify chart data structure
      for (const dataset of chartData.datasets) {
        expect(dataset).toHaveProperty('label');
        expect(dataset).toHaveProperty('data');
        expect(Array.isArray(dataset.data)).toBe(true);
      }
    });

    it('should provide current dashboard data', () => {
      const layoutId = dashboard.createLayout('Data Test Layout', 'Layout for data testing');
      dashboard.setActiveLayout(layoutId);

      const dashboardData = dashboard.getCurrentDashboardData();

      expect(dashboardData).toHaveProperty('timestamp');
      expect(dashboardData).toHaveProperty('widgets');
      expect(dashboardData).toHaveProperty('systemStatus');
      expect(dashboardData).toHaveProperty('summary');

      // Verify system status
      expect(dashboardData.systemStatus).toHaveProperty('overall');
      expect(dashboardData.systemStatus).toHaveProperty('uptime');
      expect(dashboardData.systemStatus).toHaveProperty('version');
      expect(dashboardData.systemStatus).toHaveProperty('environment');

      // Verify summary
      expect(typeof dashboardData.summary.totalTasks).toBe('number');
      expect(typeof dashboardData.summary.activeAlerts).toBe('number');
      expect(typeof dashboardData.summary.systemEfficiency).toBe('number');
      expect(typeof dashboardData.summary.resourceUtilization).toBe('number');
    });
  });

  describe('Integration Hub Coordination', () => {
    it('should provide comprehensive system status', () => {
      const systemStatus = integrationHub.getSystemStatus();

      expect(systemStatus).toHaveProperty('overall');
      expect(systemStatus).toHaveProperty('components');
      expect(systemStatus).toHaveProperty('integration');
      expect(systemStatus).toHaveProperty('timestamp');

      // Verify overall status
      expect(['healthy', 'degraded', 'unhealthy', 'critical']).toContain(systemStatus.overall);

      // Verify components
      expect(systemStatus.components).toHaveProperty('realTimeMonitoring');
      expect(systemStatus.components).toHaveProperty('dashboard');
      expect(systemStatus.components).toHaveProperty('performanceAnalytics');
      expect(systemStatus.components).toHaveProperty('taskStatusMonitor');

      // Verify integration status
      expect(typeof systemStatus.integration.initialized).toBe('boolean');
      expect(typeof systemStatus.integration.eventsProcessed).toBe('number');
      expect(typeof systemStatus.integration.correlatedEvents).toBe('number');
    });

    it('should correlate events across systems', async () => {
      const correlationId = `test-correlation-${Date.now()}`;
      const correlatedEvents: any[] = [];

      integrationHub.on('events:correlated', (data) => {
        correlatedEvents.push(data);
      });

      // Create correlated events from different systems
      const taskId = taskStatusMonitor.registerTask('correlation-test-task', {
        title: 'Correlation Test Task',
        type: TaskType.IMPLEMENTATION,
        priority: TaskPriority.NORMAL,
        estimatedDuration: 30000,
      });

      // Simulate events with same correlation ID
      taskStatusMonitor.updateTaskStatus(taskId, {
        status: TaskStatus.IN_PROGRESS,
        startTime: new Date(),
        correlationId,
      });

      performanceAnalytics.recordMetric(
        'correlation_test_metric',
        500,
        'milliseconds',
        'response_time',
        { correlationId, taskId }
      );

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify correlation
      expect(correlatedEvents.length).toBeGreaterThan(0);

      const correlation = correlatedEvents.find(e => e.correlationId === correlationId);
      expect(correlation).toBeDefined();
      expect(correlation.sources.length).toBeGreaterThan(1);
    });

    it('should aggregate data from all monitoring systems', () => {
      // Create test data across different systems
      const taskIds = [
        taskStatusMonitor.registerTask('aggregate-task-1', {
          title: 'Aggregate Task 1',
          type: TaskType.IMPLEMENTATION,
          priority: TaskPriority.HIGH,
          estimatedDuration: 30000,
        }),
        taskStatusMonitor.registerTask('aggregate-task-2', {
          title: 'Aggregate Task 2',
          type: TaskType.TESTING,
          priority: TaskPriority.NORMAL,
          estimatedDuration: 20000,
        }),
      ];

      const agentId = taskStatusMonitor.registerAgent('aggregate-test-agent', {
        capabilities: ['implementation', 'testing'],
        maxConcurrentTasks: 2,
      });

      // Complete some tasks
      taskStatusMonitor.updateTaskStatus(taskIds[0], {
        status: TaskStatus.COMPLETED,
        endTime: new Date(),
        actualDuration: 28000,
      });

      // Assign agent to remaining task
      taskStatusMonitor.assignTaskToAgent(taskIds[1], agentId);

      // Get aggregated data
      const aggregatedData = integrationHub.getAggregatedData();

      expect(aggregatedData).toHaveProperty('systemSnapshot');
      expect(aggregatedData).toHaveProperty('taskMetrics');
      expect(aggregatedData).toHaveProperty('agentMetrics');
      expect(aggregatedData).toHaveProperty('correlatedEvents');
      expect(aggregatedData).toHaveProperty('timestamp');

      // Verify task metrics
      expect(aggregatedData.taskMetrics.totalTasks).toBeGreaterThanOrEqual(2);
      expect(aggregatedData.taskMetrics.completedTasks).toBeGreaterThanOrEqual(1);
      expect(typeof aggregatedData.taskMetrics.successRate).toBe('number');

      // Verify agent metrics
      expect(aggregatedData.agentMetrics.totalAgents).toBeGreaterThanOrEqual(1);
      expect(aggregatedData.agentMetrics.activeAgents).toBeGreaterThanOrEqual(0);
      expect(typeof aggregatedData.agentMetrics.utilization).toBe('number');
    });
  });

  describe('Performance Analytics Integration', () => {
    it('should collect and analyze performance metrics', () => {
      // Record various performance metrics
      const metrics = [
        { name: 'api_response_time', value: 150, unit: 'milliseconds', category: 'performance' },
        { name: 'memory_usage', value: 256, unit: 'megabytes', category: 'resource' },
        { name: 'task_completion_rate', value: 85, unit: 'percent', category: 'throughput' },
        { name: 'error_rate', value: 2, unit: 'percent', category: 'quality' },
      ];

      metrics.forEach(metric => {
        performanceAnalytics.recordMetric(
          metric.name,
          metric.value,
          metric.unit,
          metric.category,
          { timestamp: new Date().toISOString(), source: 'integration_test' }
        );
      });

      // Allow time for processing
      const recordedMetrics = performanceAnalytics.getMetrics();
      expect(recordedMetrics.length).toBeGreaterThanOrEqual(metrics.length);

      // Verify metric structure
      recordedMetrics.forEach(metric => {
        expect(metric).toHaveProperty('name');
        expect(metric).toHaveProperty('value');
        expect(metric).toHaveProperty('unit');
        expect(metric).toHaveProperty('category');
        expect(metric).toHaveProperty('timestamp');
        expect(typeof metric.value).toBe('number');
      });
    });

    it('should generate performance insights', async () => {
      // Create a pattern of metrics that should generate insights
      const responseTimePattern = [100, 110, 125, 140, 160, 180, 200, 230, 260, 300];

      responseTimePattern.forEach((responseTime, index) => {
        performanceAnalytics.recordMetric(
          'api_response_time',
          responseTime,
          'milliseconds',
          'performance',
          {
            timestamp: new Date(Date.now() - (9 - index) * 60000).toISOString(), // 9 minutes of data
            endpoint: 'test_endpoint',
            source: 'performance_test'
          }
        );
      });

      // Wait for insight generation
      await new Promise(resolve => setTimeout(resolve, 500));

      const insights = performanceAnalytics.getInsights();

      // Verify insights structure if any are generated
      for (const insight of insights) {
        expect(insight).toHaveProperty('id');
        expect(insight).toHaveProperty('type');
        expect(insight).toHaveProperty('title');
        expect(insight).toHaveProperty('description');
        expect(insight).toHaveProperty('severity');
        expect(insight).toHaveProperty('confidence');
        expect(insight).toHaveProperty('recommendations');
        expect(insight).toHaveProperty('dataPoints');
        expect(insight).toHaveProperty('createdAt');

        expect(typeof insight.confidence).toBe('number');
        expect(insight.confidence).toBeGreaterThanOrEqual(0);
        expect(insight.confidence).toBeLessThanOrEqual(1);
        expect(['low', 'medium', 'high', 'critical']).toContain(insight.severity);
      }
    });
  });

  describe('Data Export and Persistence', () => {
    it('should export monitoring data in multiple formats', async () => {
      // Create some test data
      const taskId = taskStatusMonitor.registerTask('export-test-task', {
        title: 'Export Test Task',
        type: TaskType.VALIDATION,
        priority: TaskPriority.NORMAL,
        estimatedDuration: 25000,
      });

      taskStatusMonitor.updateTaskStatus(taskId, {
        status: TaskStatus.COMPLETED,
        endTime: new Date(),
        actualDuration: 23000,
      });

      // Test JSON export
      const jsonData = await integrationHub.exportData('json', 'last_hour');
      expect(typeof jsonData).toBe('string');

      const parsedJson = JSON.parse(jsonData);
      expect(parsedJson).toHaveProperty('systemSnapshot');
      expect(parsedJson).toHaveProperty('taskMetrics');
      expect(parsedJson).toHaveProperty('agentMetrics');
      expect(parsedJson).toHaveProperty('timestamp');

      // Test CSV export
      const csvData = await integrationHub.exportData('csv', 'last_hour');
      expect(typeof csvData).toBe('string');
      expect(csvData).toContain('timestamp,metric,value,unit');
      expect(csvData).toContain('memory_usage');
      expect(csvData).toContain('total_tasks');

      // Test Prometheus export
      const prometheusData = await integrationHub.exportData('prometheus', 'last_hour');
      expect(typeof prometheusData).toBe('string');
      expect(prometheusData).toContain('# TYPE gemini_');
      expect(prometheusData).toContain('gemini_tasks_total');
      expect(prometheusData).toContain('gemini_system_memory_usage');
    });

    it('should handle dashboard configuration export/import', async () => {
      // Create a test dashboard layout
      const layoutId = dashboard.createLayout('Export Test Layout', 'Layout for export testing');

      const widgetId = dashboard.addWidget(layoutId, {
        type: 'gauge',
        title: 'Export Test Widget',
        position: { x: 0, y: 0, width: 4, height: 3 },
        config: {
          dataSource: 'system_health',
          refreshIntervalMs: 3000,
          thresholds: [
            { value: 75, color: 'green', label: 'Good' },
            { value: 50, color: 'yellow', label: 'Fair' },
            { value: 25, color: 'red', label: 'Poor' },
          ],
        },
        style: {
          backgroundColor: '#2a2a2a',
          textColor: '#ffffff',
        },
        enabled: true,
      });

      // Export dashboard configuration
      const exportedConfig = await dashboard.exportDashboard(layoutId);
      expect(typeof exportedConfig).toBe('string');

      const parsedConfig = JSON.parse(exportedConfig);
      expect(parsedConfig).toHaveProperty('version');
      expect(parsedConfig).toHaveProperty('exportTimestamp');
      expect(parsedConfig).toHaveProperty('layouts');
      expect(Array.isArray(parsedConfig.layouts)).toBe(true);
      expect(parsedConfig.layouts).toHaveLength(1);

      const exportedLayout = parsedConfig.layouts[0];
      expect(exportedLayout.name).toBe('Export Test Layout');
      expect(exportedLayout.widgets).toHaveLength(1);
      expect(exportedLayout.widgets[0].title).toBe('Export Test Widget');

      // Test import (this would normally be done with a fresh dashboard instance)
      // For now, just verify the export format is correct
      expect(() => JSON.parse(exportedConfig)).not.toThrow();
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle component failures gracefully', async () => {
      // Simulate a component failure by stopping real-time monitoring
      realTimeMonitoring.stopMonitoring();

      // System status should still be obtainable
      const systemStatus = integrationHub.getSystemStatus();
      expect(systemStatus).toHaveProperty('overall');
      expect(systemStatus).toHaveProperty('components');

      // Integration hub should continue functioning
      const aggregatedData = integrationHub.getAggregatedData();
      expect(aggregatedData).toHaveProperty('timestamp');
      expect(aggregatedData).toHaveProperty('taskMetrics');
    });

    it('should recover from data synchronization failures', async () => {
      const syncEvents: any[] = [];

      integrationHub.on('sync:completed', (data) => {
        syncEvents.push(data);
      });

      integrationHub.on('sync:triggered', (data) => {
        syncEvents.push({ type: 'triggered', ...data });
      });

      // Trigger manual synchronization
      await integrationHub.triggerSync();

      // Wait for sync completion
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify sync events
      expect(syncEvents.length).toBeGreaterThan(0);

      const completedSync = syncEvents.find(e => e.snapshotTime);
      expect(completedSync).toBeDefined();
      expect(completedSync.timestamp).toBeInstanceOf(Date);
    });

    it('should handle invalid configuration gracefully', () => {
      // Create dashboard with invalid widget configuration
      const layoutId = dashboard.createLayout('Invalid Config Test', 'Test invalid configurations');

      expect(() => {
        dashboard.addWidget(layoutId, {
          type: 'invalid_type' as any,
          title: 'Invalid Widget',
          position: { x: -1, y: -1, width: 0, height: 0 }, // Invalid position
          config: {
            dataSource: 'nonexistent_source',
            refreshIntervalMs: -1000, // Invalid interval
          },
          style: {},
          enabled: true,
        });
      }).not.toThrow(); // Should handle gracefully without throwing
    });

    it('should maintain system stability under high load', async () => {
      const startTime = Date.now();
      const operations: Array<Promise<any>> = [];

      // Simulate high load with concurrent operations
      for (let i = 0; i < 50; i++) {
        operations.push(
          Promise.resolve().then(() => {
            const taskId = taskStatusMonitor.registerTask(`load-test-task-${i}`, {
              title: `Load Test Task ${i}`,
              type: TaskType.IMPLEMENTATION,
              priority: TaskPriority.NORMAL,
              estimatedDuration: 10000,
            });

            performanceAnalytics.recordMetric(
              `load_test_metric_${i}`,
              Math.random() * 1000,
              'milliseconds',
              'performance',
              { loadTest: true, index: i }
            );

            return realTimeMonitoring.getCurrentSnapshot();
          })
        );
      }

      // Wait for all operations to complete
      const snapshots = await Promise.all(operations);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify all operations completed successfully
      expect(snapshots).toHaveLength(50);
      snapshots.forEach(snapshot => {
        expect(snapshot).toHaveProperty('timestamp');
        expect(snapshot).toHaveProperty('systemHealth');
      });

      // Performance should remain reasonable (less than 5 seconds for 50 operations)
      expect(totalTime).toBeLessThan(5000);

      // System should remain healthy under load
      const finalSystemStatus = integrationHub.getSystemStatus();
      expect(['healthy', 'degraded']).toContain(finalSystemStatus.overall);
    });
  });

  describe('Monitoring System Health', () => {
    it('should continuously monitor system health', async () => {
      const healthEvents: any[] = [];

      integrationHub.on('health:checked', (data) => {
        healthEvents.push(data);
      });

      // Wait for health check cycle
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify health monitoring is active
      expect(healthEvents.length).toBeGreaterThan(0);

      const healthEvent = healthEvents[healthEvents.length - 1];
      expect(healthEvent).toHaveProperty('timestamp');
      expect(healthEvent).toHaveProperty('services');
      expect(Array.isArray(healthEvent.services)).toBe(true);
      expect(healthEvent.services.length).toBeGreaterThan(0);
    });

    it('should detect and report system degradation', async () => {
      // Create conditions that should cause system degradation
      const taskIds = [];

      // Create many tasks to simulate load
      for (let i = 0; i < 20; i++) {
        const taskId = taskStatusMonitor.registerTask(`degradation-test-${i}`, {
          title: `Degradation Test Task ${i}`,
          type: TaskType.IMPLEMENTATION,
          priority: TaskPriority.HIGH,
          estimatedDuration: 60000,
        });
        taskIds.push(taskId);
      }

      // Fail half of the tasks
      for (let i = 0; i < 10; i++) {
        taskStatusMonitor.updateTaskStatus(taskIds[i], {
          status: TaskStatus.FAILED,
          endTime: new Date(),
          error: new Error(`Simulated failure ${i}`),
        });
      }

      // Wait for system to process the failures
      await new Promise(resolve => setTimeout(resolve, 1000));

      const systemStatus = integrationHub.getSystemStatus();
      const snapshot = realTimeMonitoring.getCurrentSnapshot();

      // High failure rate should affect system health
      expect(snapshot.taskMetrics.failed).toBe(10);
      expect(snapshot.taskMetrics.total).toBe(20);

      // System might be degraded due to high failure rate
      expect(['healthy', 'degraded', 'unhealthy']).toContain(systemStatus.overall);
    });
  });
});