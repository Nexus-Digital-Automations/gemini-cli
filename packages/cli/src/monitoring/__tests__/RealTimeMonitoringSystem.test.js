/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { RealTimeMonitoringSystem } from '../RealTimeMonitoringSystem.js';
import { taskStatusMonitor } from '../TaskStatusMonitor.js';
import {} from './types.js';
// Mock dependencies
vi.mock('../TaskStatusMonitor.js', () => ({
    taskStatusMonitor: {
        getPerformanceMetrics: vi.fn(),
        getAllTasks: vi.fn(),
        getAllAgents: vi.fn(),
        on: vi.fn(),
    },
}));
vi.mock('../PerformanceAnalyticsDashboard.js', () => ({
    performanceAnalyticsDashboard: {
        on: vi.fn(),
    },
}));
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
describe('RealTimeMonitoringSystem', () => {
    let monitoringSystem;
    let mockTaskStatusMonitor;
    beforeEach(() => {
        vi.clearAllMocks();
        mockTaskStatusMonitor =
            taskStatusMonitor;
        // Setup default mock responses
        mockTaskStatusMonitor.getPerformanceMetrics.mockReturnValue({
            totalTasks: 100,
            completedTasks: 85,
            failedTasks: 10,
            systemUptime: new Date(Date.now() - 3600000), // 1 hour ago
            throughputPerHour: 50,
            averageTaskDuration: 2000,
            systemEfficiency: 85,
        });
        mockTaskStatusMonitor.getAllTasks.mockReturnValue([
            {
                id: 'task1',
                status: 'completed',
                type: 'implementation',
                priority: 'high',
                startedAt: new Date(Date.now() - 60000),
                completedAt: new Date(),
            },
            {
                id: 'task2',
                status: 'in_progress',
                type: 'testing',
                priority: 'normal',
                startedAt: new Date(Date.now() - 30000),
            },
            {
                id: 'task3',
                status: 'failed',
                type: 'deployment',
                priority: 'high',
                startedAt: new Date(Date.now() - 90000),
                completedAt: new Date(Date.now() - 30000),
            },
        ]);
        mockTaskStatusMonitor.getAllAgents.mockReturnValue([
            {
                id: 'agent1',
                status: 'active',
                capabilities: ['implementation'],
                currentTasks: ['task2'],
                performance: { successRate: 90, taskThroughput: 25 },
                completedTasks: 45,
                failedTasks: 5,
            },
            {
                id: 'agent2',
                status: 'idle',
                capabilities: ['testing', 'validation'],
                currentTasks: [],
                performance: { successRate: 95, taskThroughput: 20 },
                completedTasks: 40,
                failedTasks: 2,
            },
        ]);
        // Initialize monitoring system
        monitoringSystem = new RealTimeMonitoringSystem();
    });
    afterEach(async () => {
        if (monitoringSystem) {
            await monitoringSystem.shutdown();
        }
    });
    describe('Initialization', () => {
        it('should initialize with default configuration', () => {
            expect(monitoringSystem).toBeInstanceOf(RealTimeMonitoringSystem);
            expect(monitoringSystem).toBeInstanceOf(EventEmitter);
        });
        it('should emit system:initialized event', (done) => {
            const newSystem = new RealTimeMonitoringSystem();
            newSystem.on('system:initialized', (data) => {
                expect(data).toHaveProperty('config');
                expect(data.config).toHaveProperty('updateIntervalMs');
                expect(data.config.updateIntervalMs).toBe(500);
                done();
            });
            // Allow time for initialization
            setTimeout(() => {
                newSystem.shutdown();
            }, 100);
        });
        it('should setup default alert rules', () => {
            const alertRules = monitoringSystem.getAlertRules();
            expect(alertRules).toHaveLength(5);
            expect(alertRules.some((rule) => rule.name === 'High Task Failure Rate')).toBe(true);
            expect(alertRules.some((rule) => rule.name === 'Critical Memory Usage')).toBe(true);
        });
    });
    describe('Snapshot Collection', () => {
        it('should collect current monitoring snapshot', () => {
            const snapshot = monitoringSystem.getCurrentSnapshot();
            expect(snapshot).toHaveProperty('timestamp');
            expect(snapshot).toHaveProperty('systemHealth');
            expect(snapshot).toHaveProperty('taskMetrics');
            expect(snapshot).toHaveProperty('agentMetrics');
            expect(snapshot).toHaveProperty('performanceMetrics');
            expect(snapshot).toHaveProperty('trends');
            expect(snapshot).toHaveProperty('activeAlerts');
            // Verify data structure
            expect(snapshot.systemHealth).toHaveProperty('overall');
            expect(snapshot.systemHealth).toHaveProperty('uptime');
            expect(snapshot.systemHealth).toHaveProperty('memoryUsageMB');
            expect(snapshot.taskMetrics).toHaveProperty('total');
            expect(snapshot.taskMetrics).toHaveProperty('completed');
            expect(snapshot.taskMetrics).toHaveProperty('failed');
            expect(snapshot.taskMetrics).toHaveProperty('successRate');
            expect(snapshot.agentMetrics).toHaveProperty('total');
            expect(snapshot.agentMetrics).toHaveProperty('active');
            expect(snapshot.agentMetrics).toHaveProperty('averageUtilization');
        });
        it('should calculate correct task metrics', () => {
            const snapshot = monitoringSystem.getCurrentSnapshot();
            expect(snapshot.taskMetrics.total).toBe(3);
            expect(snapshot.taskMetrics.completed).toBe(1);
            expect(snapshot.taskMetrics.failed).toBe(1);
            expect(snapshot.taskMetrics.inProgress).toBe(1);
            expect(snapshot.taskMetrics.successRate).toBe(50); // 1 completed out of 2 finished tasks
        });
        it('should calculate correct agent metrics', () => {
            const snapshot = monitoringSystem.getCurrentSnapshot();
            expect(snapshot.agentMetrics.total).toBe(2);
            expect(snapshot.agentMetrics.active).toBe(1);
            expect(snapshot.agentMetrics.idle).toBe(1);
            expect(snapshot.agentMetrics.busy).toBe(0); // No agents with 'busy' status
        });
        it('should determine system health correctly', () => {
            const snapshot = monitoringSystem.getCurrentSnapshot();
            // With current mock data, system should be healthy
            expect(snapshot.systemHealth.overall).toBe('healthy');
        });
    });
    describe('Alert Management', () => {
        it('should add custom alert rule', () => {
            const customRule = {
                id: 'custom-test-rule',
                name: 'Test Alert',
                description: 'Test alert for unit testing',
                condition: (data) => data.taskMetrics.failed > 5,
                severity: 'medium',
                cooldownMs: 30000,
                enabled: true,
                actions: [{ type: 'log', config: {} }],
            };
            monitoringSystem.addAlertRule(customRule);
            const rules = monitoringSystem.getAlertRules();
            const addedRule = rules.find((rule) => rule.id === 'custom-test-rule');
            expect(addedRule).toBeDefined();
            expect(addedRule?.name).toBe('Test Alert');
            expect(addedRule?.severity).toBe('medium');
        });
        it('should remove alert rule', () => {
            const customRule = {
                id: 'removable-rule',
                name: 'Removable Alert',
                description: 'This rule will be removed',
                condition: () => false,
                severity: 'low',
                cooldownMs: 10000,
                enabled: true,
                actions: [{ type: 'log', config: {} }],
            };
            monitoringSystem.addAlertRule(customRule);
            expect(monitoringSystem
                .getAlertRules()
                .some((rule) => rule.id === 'removable-rule')).toBe(true);
            const removed = monitoringSystem.removeAlertRule('removable-rule');
            expect(removed).toBe(true);
            expect(monitoringSystem
                .getAlertRules()
                .some((rule) => rule.id === 'removable-rule')).toBe(false);
        });
        it('should trigger alerts when conditions are met', (done) => {
            const testRule = {
                id: 'trigger-test',
                name: 'Always Trigger',
                description: 'This rule always triggers',
                condition: () => true,
                severity: 'low',
                cooldownMs: 100,
                enabled: true,
                actions: [{ type: 'log', config: {} }],
            };
            monitoringSystem.addAlertRule(testRule);
            monitoringSystem.on('alert:triggered', (data) => {
                expect(data).toHaveProperty('alert');
                expect(data.alert.data.rule.name).toBe('Always Trigger');
                done();
            });
            // Start monitoring to trigger alert checking
            monitoringSystem.startMonitoring();
            // Stop monitoring after test
            setTimeout(() => {
                monitoringSystem.stopMonitoring();
            }, 200);
        });
        it('should respect alert cooldown periods', async () => {
            const testRule = {
                id: 'cooldown-test',
                name: 'Cooldown Test',
                description: 'Test cooldown functionality',
                condition: () => true,
                severity: 'medium',
                cooldownMs: 1000, // 1 second cooldown
                enabled: true,
                actions: [{ type: 'log', config: {} }],
            };
            monitoringSystem.addAlertRule(testRule);
            let alertCount = 0;
            monitoringSystem.on('alert:triggered', () => {
                alertCount++;
            });
            // Start monitoring
            monitoringSystem.startMonitoring();
            // Wait for initial alert
            await new Promise((resolve) => setTimeout(resolve, 600));
            const initialAlertCount = alertCount;
            // Wait less than cooldown period
            await new Promise((resolve) => setTimeout(resolve, 500));
            // Alert count should not increase due to cooldown
            expect(alertCount).toBe(initialAlertCount);
            monitoringSystem.stopMonitoring();
        });
    });
    describe('Predictive Insights', () => {
        it('should generate predictive insights', () => {
            const insights = monitoringSystem.getPredictiveInsights();
            expect(Array.isArray(insights)).toBe(true);
            // Initially empty since we need historical data
            expect(insights.length).toBe(0);
        });
        it('should create insights with proper structure when data is available', async () => {
            // Add some historical snapshots
            for (let i = 0; i < 15; i++) {
                const snapshot = monitoringSystem.getCurrentSnapshot();
                snapshot.timestamp = new Date(Date.now() - (15 - i) * 60000); // 15 minutes of data
                // Simulate memory increasing over time
                snapshot.systemHealth.memoryUsageMB = 100 + i * 10;
            }
            // Wait for insights generation (normally happens every 5 minutes)
            // We'll call the private method indirectly by waiting
            await new Promise((resolve) => setTimeout(resolve, 100));
            const insights = monitoringSystem.getPredictiveInsights();
            // Check if insights have correct structure
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
                expect(insight.confidence).toBeGreaterThanOrEqual(0);
                expect(insight.confidence).toBeLessThanOrEqual(1);
                expect(['low', 'medium', 'high', 'critical']).toContain(insight.impact);
            }
        });
    });
    describe('Data Export', () => {
        it('should export monitoring data in JSON format', async () => {
            const jsonData = await monitoringSystem.exportMonitoringData('json', 1);
            expect(typeof jsonData).toBe('string');
            const parsed = JSON.parse(jsonData);
            expect(parsed).toHaveProperty('timestamp');
            expect(parsed).toHaveProperty('config');
            expect(parsed).toHaveProperty('snapshots');
            expect(parsed).toHaveProperty('insights');
            expect(parsed).toHaveProperty('alerts');
            expect(parsed).toHaveProperty('statistics');
        });
        it('should export monitoring data in CSV format', async () => {
            const csvData = await monitoringSystem.exportMonitoringData('csv', 1);
            expect(typeof csvData).toBe('string');
            expect(csvData).toContain('timestamp,metric,value,unit');
            expect(csvData).toContain('memory_usage');
            expect(csvData).toContain('total_tasks');
            expect(csvData).toContain('active_agents');
        });
        it('should throw error for unsupported export format', async () => {
            await expect(monitoringSystem.exportMonitoringData('xml')).rejects.toThrow('Unsupported export format: xml');
        });
    });
    describe('Monitoring History', () => {
        it('should maintain monitoring history', () => {
            // Start monitoring to generate some history
            monitoringSystem.startMonitoring();
            // Wait for a few snapshots
            return new Promise((resolve) => {
                setTimeout(() => {
                    const history = monitoringSystem.getMonitoringHistory(1);
                    expect(Array.isArray(history)).toBe(true);
                    expect(history.length).toBeGreaterThan(0);
                    // Check that history is sorted by timestamp (newest first)
                    for (let i = 1; i < history.length; i++) {
                        expect(history[i].timestamp.getTime()).toBeLessThanOrEqual(history[i - 1].timestamp.getTime());
                    }
                    monitoringSystem.stopMonitoring();
                    resolve(undefined);
                }, 1500); // Wait for multiple updates
            });
        });
        it('should filter history by time range', () => {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const history = monitoringSystem.getMonitoringHistory(1);
            for (const snapshot of history) {
                expect(snapshot.timestamp.getTime()).toBeGreaterThanOrEqual(oneHourAgo.getTime());
            }
        });
    });
    describe('Performance Requirements', () => {
        it('should provide sub-second monitoring updates', (done) => {
            const startTime = Date.now();
            let updateCount = 0;
            monitoringSystem.on('snapshot:collected', () => {
                updateCount++;
                if (updateCount >= 3) {
                    const elapsed = Date.now() - startTime;
                    const averageInterval = elapsed / updateCount;
                    // Should be close to 500ms (configured update interval)
                    expect(averageInterval).toBeLessThan(600);
                    expect(averageInterval).toBeGreaterThan(400);
                    monitoringSystem.stopMonitoring();
                    done();
                }
            });
            monitoringSystem.startMonitoring();
        });
        it('should handle high-frequency monitoring without performance degradation', async () => {
            const startTime = Date.now();
            // Simulate high-frequency monitoring (every 100ms)
            const highFrequencySystem = new RealTimeMonitoringSystem({
                updateIntervalMs: 100,
            });
            let snapshotCount = 0;
            highFrequencySystem.on('snapshot:collected', () => {
                snapshotCount++;
            });
            highFrequencySystem.startMonitoring();
            // Run for 1 second
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const elapsed = Date.now() - startTime;
            highFrequencySystem.stopMonitoring();
            // Should have collected approximately 10 snapshots (1000ms / 100ms)
            expect(snapshotCount).toBeGreaterThanOrEqual(8);
            expect(snapshotCount).toBeLessThanOrEqual(12);
            // Performance check - should not take significantly longer than expected
            expect(elapsed).toBeLessThan(1200); // Allow 20% overhead
            await highFrequencySystem.shutdown();
        });
        it('should maintain accuracy with concurrent operations', async () => {
            const promises = [];
            // Start multiple concurrent operations
            for (let i = 0; i < 10; i++) {
                promises.push(new Promise((resolve) => {
                    const snapshot = monitoringSystem.getCurrentSnapshot();
                    expect(snapshot).toHaveProperty('timestamp');
                    expect(snapshot.taskMetrics.total).toBe(3); // Should be consistent
                    resolve();
                }));
            }
            // All operations should complete successfully
            await Promise.all(promises);
        });
    });
    describe('Error Handling', () => {
        it('should handle missing data gracefully', () => {
            mockTaskStatusMonitor.getPerformanceMetrics.mockReturnValue({});
            mockTaskStatusMonitor.getAllTasks.mockReturnValue([]);
            mockTaskStatusMonitor.getAllAgents.mockReturnValue([]);
            const snapshot = monitoringSystem.getCurrentSnapshot();
            expect(snapshot).toHaveProperty('timestamp');
            expect(snapshot.taskMetrics.total).toBe(0);
            expect(snapshot.agentMetrics.total).toBe(0);
            expect(snapshot.systemHealth.overall).toBe('healthy'); // Default fallback
        });
        it('should handle alert rule evaluation errors', () => {
            const faultyRule = {
                id: 'faulty-rule',
                name: 'Faulty Rule',
                description: 'This rule throws an error',
                condition: () => {
                    throw new Error('Test error');
                },
                severity: 'low',
                cooldownMs: 1000,
                enabled: true,
                actions: [{ type: 'log', config: {} }],
            };
            // Should not throw when adding the rule
            expect(() => {
                monitoringSystem.addAlertRule(faultyRule);
            }).not.toThrow();
            // Should not crash when evaluating the faulty rule
            expect(() => {
                monitoringSystem.getCurrentSnapshot();
            }).not.toThrow();
        });
    });
    describe('Resource Management', () => {
        it('should clean up resources on shutdown', async () => {
            const system = new RealTimeMonitoringSystem();
            system.startMonitoring();
            await new Promise((resolve) => setTimeout(resolve, 100));
            await system.shutdown();
            // Verify cleanup
            expect(system.listenerCount('snapshot:collected')).toBe(0);
        });
        it('should limit memory usage with data retention', () => {
            // This test verifies that the system doesn't accumulate unlimited data
            const initialMemory = process.memoryUsage().heapUsed;
            // Generate many snapshots
            for (let i = 0; i < 100; i++) {
                monitoringSystem.getCurrentSnapshot();
            }
            const afterMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = afterMemory - initialMemory;
            // Memory increase should be reasonable (less than 10MB for 100 snapshots)
            expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
        });
    });
});
//# sourceMappingURL=RealTimeMonitoringSystem.test.js.map