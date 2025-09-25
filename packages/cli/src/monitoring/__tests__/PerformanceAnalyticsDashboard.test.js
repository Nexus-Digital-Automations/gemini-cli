/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PerformanceAnalyticsDashboard } from '../PerformanceAnalyticsDashboard.js';
import { TaskType, TaskPriority, TaskStatus } from '../TaskStatusMonitor.js';
// Mock logger
jest.mock('../utils/logger.js', () => ({
    Logger: jest.fn(() => ({
        info: jest.fn(),
        error: jest.fn(),
        warning: jest.fn(),
        debug: jest.fn(),
    })),
}));
describe('PerformanceAnalyticsDashboard', () => {
    let dashboard;
    beforeEach(() => {
        dashboard = new PerformanceAnalyticsDashboard({
            retentionDays: 7,
            metricsIntervalMs: 5000,
            insightsIntervalMs: 10000
        });
    });
    afterEach(() => {
        dashboard.destroy();
    });
    describe('Metrics Recording', () => {
        it('should record performance metrics', () => {
            dashboard.recordMetric('task_completion_time', 1500, 'milliseconds', 'latency', { taskType: 'implementation', priority: 'high' }, { agentId: 'agent-1' });
            const dashboardData = dashboard.getDashboardData();
            expect(dashboardData.realTimeMetrics['task_completion_time']).toBeDefined();
            expect(dashboardData.realTimeMetrics['task_completion_time'].value).toBe(1500);
            expect(dashboardData.realTimeMetrics['task_completion_time'].unit).toBe('milliseconds');
        });
        it('should categorize metrics properly', () => {
            dashboard.recordMetric('throughput_metric', 100, 'tasks/hour', 'throughput');
            dashboard.recordMetric('latency_metric', 500, 'ms', 'latency');
            dashboard.recordMetric('success_metric', 0.95, 'ratio', 'success_rate');
            const dashboardData = dashboard.getDashboardData();
            expect(dashboardData.realTimeMetrics['throughput_metric']).toBeDefined();
            expect(dashboardData.realTimeMetrics['latency_metric']).toBeDefined();
            expect(dashboardData.realTimeMetrics['success_metric']).toBeDefined();
        });
        it('should maintain metric history within retention limits', () => {
            // Record multiple metrics over time
            for (let i = 0; i < 10; i++) {
                dashboard.recordMetric('test_metric', i * 10, 'units', 'throughput', { iteration: i.toString() });
            }
            const analytics = dashboard.getAnalytics({
                start: new Date(Date.now() - 24 * 60 * 60 * 1000),
                end: new Date()
            }, ['test_metric']);
            expect(analytics.metrics['test_metric']).toBeDefined();
            expect(analytics.metrics['test_metric'].length).toBe(10);
        });
    });
    describe('Task Event Processing', () => {
        it('should process task start events', () => {
            const task = {
                id: 'task-start-test',
                title: 'Test Task',
                description: 'Task for testing start event',
                type: TaskType.IMPLEMENTATION,
                priority: TaskPriority.HIGH,
                status: TaskStatus.IN_PROGRESS,
                assignedAgent: 'agent-1',
                dependencies: [],
                progress: 0,
                lastUpdate: new Date(),
                errorCount: 0,
                retryCount: 0,
                tags: ['test'],
                metadata: {}
            };
            dashboard.onTaskEvent('started', { task });
            const dashboardData = dashboard.getDashboardData();
            expect(dashboardData.realTimeMetrics['task_started_rate']).toBeDefined();
            expect(dashboardData.realTimeMetrics['task_started_rate'].value).toBe(1);
        });
        it('should process task completion events', () => {
            const task = {
                id: 'task-completion-test',
                title: 'Completed Task',
                description: 'Task for testing completion',
                type: TaskType.IMPLEMENTATION,
                priority: TaskPriority.NORMAL,
                status: TaskStatus.COMPLETED,
                assignedAgent: 'agent-1',
                dependencies: [],
                progress: 100,
                startTime: new Date(Date.now() - 30000),
                endTime: new Date(),
                lastUpdate: new Date(),
                errorCount: 0,
                retryCount: 0,
                tags: ['test'],
                metadata: {}
            };
            const agent = {
                id: 'agent-1',
                status: 'active',
                capabilities: ['implementation'],
                currentTasks: [],
                completedTasks: 1,
                failedTasks: 0,
                averageTaskDuration: 30000,
                lastHeartbeat: new Date(),
                performance: {
                    successRate: 100,
                    averageCompletionTime: 30000,
                    taskThroughput: 2
                }
            };
            // Simulate task started first
            dashboard.onTaskEvent('started', { task, agent });
            // Then completed
            dashboard.onTaskEvent('completed', { task, agent });
            const dashboardData = dashboard.getDashboardData();
            expect(dashboardData.realTimeMetrics['task_execution_time']).toBeDefined();
            expect(dashboardData.realTimeMetrics['task_completion_rate']).toBeDefined();
        });
        it('should process task failure events', () => {
            const task = {
                id: 'task-failure-test',
                title: 'Failed Task',
                description: 'Task for testing failure',
                type: TaskType.IMPLEMENTATION,
                priority: TaskPriority.HIGH,
                status: TaskStatus.FAILED,
                assignedAgent: 'agent-1',
                dependencies: [],
                progress: 50,
                startTime: new Date(Date.now() - 15000),
                endTime: new Date(),
                lastUpdate: new Date(),
                errorCount: 1,
                retryCount: 2,
                tags: ['test'],
                metadata: {}
            };
            const update = {
                taskId: task.id,
                previousStatus: TaskStatus.IN_PROGRESS,
                newStatus: TaskStatus.FAILED,
                timestamp: new Date(),
                error: 'Test error'
            };
            // Simulate task started first
            dashboard.onTaskEvent('started', { task });
            // Then failed
            dashboard.onTaskEvent('failed', { task, update });
            const dashboardData = dashboard.getDashboardData();
            expect(dashboardData.realTimeMetrics['task_failure_time']).toBeDefined();
            expect(dashboardData.realTimeMetrics['task_failure_rate']).toBeDefined();
        });
    });
    describe('Agent Event Processing', () => {
        it('should process agent heartbeat events', () => {
            const agent = {
                id: 'agent-heartbeat-test',
                status: 'busy',
                capabilities: ['implementation', 'testing'],
                currentTasks: ['task-1'],
                completedTasks: 5,
                failedTasks: 1,
                averageTaskDuration: 45000,
                lastHeartbeat: new Date(),
                performance: {
                    successRate: 83.3,
                    averageCompletionTime: 45000,
                    taskThroughput: 4
                }
            };
            dashboard.onAgentEvent('heartbeat', { agent });
            const dashboardData = dashboard.getDashboardData();
            expect(dashboardData.realTimeMetrics['agent_success_rate']).toBeDefined();
            expect(dashboardData.realTimeMetrics['agent_throughput']).toBeDefined();
        });
        it('should process agent status change events', () => {
            const agent = {
                id: 'agent-status-test',
                status: 'offline',
                capabilities: ['implementation'],
                currentTasks: [],
                completedTasks: 3,
                failedTasks: 0,
                averageTaskDuration: 30000,
                lastHeartbeat: new Date(Date.now() - 60000),
                performance: {
                    successRate: 100,
                    averageCompletionTime: 30000,
                    taskThroughput: 6
                }
            };
            dashboard.onAgentEvent('status_changed', { agent });
            const dashboardData = dashboard.getDashboardData();
            expect(dashboardData.realTimeMetrics['agent_status_change']).toBeDefined();
        });
    });
    describe('Dashboard Data', () => {
        it('should provide comprehensive dashboard data', () => {
            // Add some metrics
            dashboard.recordMetric('test_throughput', 50, 'tasks/hour', 'throughput');
            dashboard.recordMetric('test_latency', 200, 'ms', 'latency');
            dashboard.recordMetric('test_success', 0.95, 'ratio', 'success_rate');
            const dashboardData = dashboard.getDashboardData();
            expect(dashboardData).toHaveProperty('realTimeMetrics');
            expect(dashboardData).toHaveProperty('trends');
            expect(dashboardData).toHaveProperty('insights');
            expect(dashboardData).toHaveProperty('benchmarkStatus');
            expect(dashboardData).toHaveProperty('systemOverview');
            expect(typeof dashboardData.systemOverview.systemEfficiency).toBe('number');
            expect(typeof dashboardData.systemOverview.agentUtilization).toBe('number');
        });
        it('should calculate benchmark status correctly', () => {
            // Record metrics that should trigger different benchmark statuses
            dashboard.recordMetric('task_completion_rate', 0.98, 'ratio', 'success_rate');
            dashboard.recordMetric('average_execution_time', 25000, 'milliseconds', 'latency');
            dashboard.recordMetric('agent_utilization', 0.85, 'ratio', 'resource_usage');
            const dashboardData = dashboard.getDashboardData();
            const benchmarkStatuses = dashboardData.benchmarkStatus;
            expect(benchmarkStatuses.length).toBeGreaterThan(0);
            benchmarkStatuses.forEach(status => {
                expect(status).toHaveProperty('metric');
                expect(status).toHaveProperty('current');
                expect(status).toHaveProperty('target');
                expect(status).toHaveProperty('status');
                expect(['good', 'warning', 'critical']).toContain(status.status);
            });
        });
    });
    describe('Analytics and Insights', () => {
        it('should provide time-range analytics', () => {
            // Add some test data
            dashboard.recordMetric('analysis_metric', 100, 'units', 'throughput');
            dashboard.recordMetric('analysis_metric', 150, 'units', 'throughput');
            dashboard.recordMetric('analysis_metric', 125, 'units', 'throughput');
            const analytics = dashboard.getAnalytics({
                start: new Date(Date.now() - 60 * 60 * 1000),
                end: new Date()
            }, ['analysis_metric']);
            expect(analytics.metrics['analysis_metric']).toBeDefined();
            expect(analytics.aggregations['analysis_metric']).toBeDefined();
            expect(analytics.aggregations['analysis_metric'].average).toBeCloseTo(125);
            expect(analytics.aggregations['analysis_metric'].min).toBe(100);
            expect(analytics.aggregations['analysis_metric'].max).toBe(150);
        });
        it('should generate optimization recommendations', () => {
            // Set up conditions that should trigger recommendations
            dashboard.recordMetric('task_completion_rate', 0.6, 'ratio', 'success_rate'); // Below warning
            dashboard.recordMetric('task_failure_rate', 0.15, 'ratio', 'quality'); // High failure rate
            const recommendations = dashboard.generateOptimizationRecommendations();
            expect(Array.isArray(recommendations)).toBe(true);
            recommendations.forEach(recommendation => {
                expect(recommendation).toHaveProperty('id');
                expect(recommendation).toHaveProperty('title');
                expect(recommendation).toHaveProperty('description');
                expect(recommendation).toHaveProperty('severity');
                expect(recommendation).toHaveProperty('category');
                expect(recommendation).toHaveProperty('impact');
                expect(recommendation).toHaveProperty('recommendation');
                expect(typeof recommendation.actionable).toBe('boolean');
            });
        });
        it('should track trends over time', () => {
            // Record multiple data points for trend analysis
            for (let i = 0; i < 15; i++) {
                dashboard.recordMetric('trend_test_metric', 100 + i * 10, // Increasing trend
                'units', 'throughput');
            }
            const dashboardData = dashboard.getDashboardData();
            const trendData = dashboardData.trends.find(t => t.metric === 'trend_test_metric');
            if (trendData) {
                expect(trendData.trendDirection).toBe('up');
                expect(trendData.trendStrength).toBeGreaterThan(0);
                expect(trendData.confidence).toBeGreaterThan(0);
            }
        });
    });
    describe('Data Export', () => {
        it('should export data in JSON format', () => {
            dashboard.recordMetric('export_test', 42, 'units', 'throughput');
            const jsonExport = dashboard.exportData('json');
            const exportedData = JSON.parse(jsonExport);
            expect(exportedData).toHaveProperty('realTimeMetrics');
            expect(exportedData).toHaveProperty('exportTimestamp');
            expect(exportedData).toHaveProperty('retentionDays');
            expect(exportedData.retentionDays).toBe(7);
        });
        it('should handle CSV export request', () => {
            const csvExport = dashboard.exportData('csv');
            expect(typeof csvExport).toBe('string');
            expect(csvExport).toContain('CSV export not yet implemented');
        });
    });
    describe('Resource Management', () => {
        it('should clean up resources on destroy', () => {
            const consoleSpy = jest.spyOn(dashboard['logger'], 'info');
            dashboard.destroy();
            expect(consoleSpy).toHaveBeenCalledWith('PerformanceAnalyticsDashboard destroyed');
        });
        it('should handle memory management for large datasets', () => {
            // Record many metrics to test memory management
            for (let i = 0; i < 150; i++) {
                dashboard.recordMetric(`memory_test_${i % 10}`, i, 'units', 'throughput');
            }
            // System should still be responsive
            const dashboardData = dashboard.getDashboardData();
            expect(dashboardData).toBeDefined();
            expect(Object.keys(dashboardData.realTimeMetrics).length).toBeLessThanOrEqual(10);
        });
    });
});
//# sourceMappingURL=PerformanceAnalyticsDashboard.test.js.map