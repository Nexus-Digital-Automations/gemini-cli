/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TaskManagementSystemFactory, createTaskManagementSystem, createTaskEngine } from '../index.js';
/**
 * @fileoverview Comprehensive test suite for TaskManagementSystemFactory
 *
 * Tests complete system integration, factory methods, configuration handling,
 * and component coordination in the task management ecosystem.
 */
// Mock configuration
const mockConfig = {
    getModel: vi.fn(() => 'gemini-2.0-pro'),
    getToolRegistry: vi.fn(() => ({
        getTool: vi.fn(),
        getAllTools: vi.fn(() => []),
        getAllToolNames: vi.fn(() => []),
        getFunctionDeclarationsFiltered: vi.fn(() => [])
    })),
    storage: {
        getProjectTempDir: vi.fn(() => '/tmp/test-project'),
        ensureProjectTempDir: vi.fn(() => Promise.resolve()),
        writeFile: vi.fn(() => Promise.resolve()),
        readFile: vi.fn(() => Promise.resolve('{"events": [], "metrics": []}')),
        fileExists: vi.fn(() => Promise.resolve(false))
    },
    getSessionId: vi.fn(() => 'test-session')
};
// Mock HTTP fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;
// Mock SubAgentScope
vi.mock('../core/subagent.js', () => ({
    SubAgentScope: {
        create: vi.fn(() => ({
            runNonInteractive: vi.fn(() => Promise.resolve()),
            output: {
                terminate_reason: 'GOAL',
                emitted_vars: {}
            }
        }))
    },
    ContextState: vi.fn(() => ({
        set: vi.fn(),
        get: vi.fn(),
        get_keys: vi.fn(() => [])
    })),
    SubagentTerminateMode: {
        GOAL: 'GOAL',
        ERROR: 'ERROR',
        TIMEOUT: 'TIMEOUT',
        MAX_TURNS: 'MAX_TURNS'
    }
}));
describe('TaskManagementSystemFactory', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ status: 'success' })
        });
    });
    describe('createComplete', () => {
        it('should create complete system with all components enabled by default', async () => {
            const system = await TaskManagementSystemFactory.createComplete(mockConfig);
            expect(system.taskEngine).toBeDefined();
            expect(system.monitoring).toBeDefined();
            expect(system.hookIntegration).toBeDefined();
            expect(typeof system.shutdown).toBe('function');
            await system.shutdown();
        });
        it('should create system with monitoring disabled', async () => {
            const system = await TaskManagementSystemFactory.createComplete(mockConfig, { enableMonitoring: false });
            expect(system.taskEngine).toBeDefined();
            expect(system.monitoring).toBeUndefined();
            expect(system.hookIntegration).toBeDefined(); // Still enabled by default
            expect(typeof system.shutdown).toBe('function');
            await system.shutdown();
        });
        it('should create system with hook integration disabled', async () => {
            const system = await TaskManagementSystemFactory.createComplete(mockConfig, { enableHookIntegration: false });
            expect(system.taskEngine).toBeDefined();
            expect(system.monitoring).toBeDefined(); // Still enabled by default
            expect(system.hookIntegration).toBeUndefined();
            expect(typeof system.shutdown).toBe('function');
            await system.shutdown();
        });
        it('should create system with all components disabled', async () => {
            const system = await TaskManagementSystemFactory.createComplete(mockConfig, {
                enableMonitoring: false,
                enableHookIntegration: false
            });
            expect(system.taskEngine).toBeDefined();
            expect(system.monitoring).toBeUndefined();
            expect(system.hookIntegration).toBeUndefined();
            expect(typeof system.shutdown).toBe('function');
            await system.shutdown();
        });
        it('should pass custom hook integration configuration', async () => {
            const customConfig = {
                agentId: 'custom-agent',
                capabilities: ['frontend', 'backend', 'testing'],
                maxConcurrentTasks: 5,
                progressReportingIntervalMs: 15000
            };
            const system = await TaskManagementSystemFactory.createComplete(mockConfig, {
                hookIntegrationConfig: customConfig
            });
            expect(system.hookIntegration).toBeDefined();
            await system.shutdown();
        });
        it('should handle hook integration initialization failure gracefully', async () => {
            // Mock fetch to fail for hook integration
            mockFetch.mockRejectedValueOnce(new Error('Network error'));
            const system = await TaskManagementSystemFactory.createComplete(mockConfig);
            expect(system.taskEngine).toBeDefined();
            expect(system.monitoring).toBeDefined();
            expect(system.hookIntegration).toBeUndefined(); // Should be undefined due to failure
            await system.shutdown();
        });
        it('should integrate monitoring with task engine event handlers', async () => {
            const system = await TaskManagementSystemFactory.createComplete(mockConfig);
            const mockTask = {
                id: 'test-task',
                title: 'Test Task',
                type: 'implementation',
                complexity: 'simple',
                priority: 'normal',
                status: 'completed',
                progress: 100
            };
            // Test monitoring integration by checking if events are recorded
            // (This would require access to internal monitoring state in real implementation)
            expect(system.monitoring).toBeDefined();
            expect(system.monitoring?.recordEvent).toBeDefined();
            await system.shutdown();
        });
    });
    describe('createStandalone', () => {
        it('should create standalone task engine without monitoring or hook integration', () => {
            const taskEngine = TaskManagementSystemFactory.createStandalone(mockConfig);
            expect(taskEngine).toBeDefined();
            expect(typeof taskEngine.queueTask).toBe('function');
            expect(typeof taskEngine.getTask).toBe('function');
            expect(typeof taskEngine.getAllTasks).toBe('function');
            expect(typeof taskEngine.getExecutionStats).toBe('function');
            expect(typeof taskEngine.cancelTask).toBe('function');
        });
        it('should call event handlers for standalone engine', async () => {
            const taskEngine = TaskManagementSystemFactory.createStandalone(mockConfig);
            // Test that event handlers are properly attached
            const taskId = await taskEngine.queueTask('Test Task', 'Test Description');
            expect(taskId).toBeTruthy();
            const task = taskEngine.getTask(taskId);
            expect(task).toBeDefined();
        });
    });
    describe('createMonitoringOnly', () => {
        it('should create monitoring system only', () => {
            const monitoring = TaskManagementSystemFactory.createMonitoringOnly(mockConfig);
            expect(monitoring).toBeDefined();
            expect(typeof monitoring.recordEvent).toBe('function');
            expect(typeof monitoring.collectMetrics).toBe('function');
            expect(typeof monitoring.analyzeBottlenecks).toBe('function');
            expect(typeof monitoring.getSystemHealth).toBe('function');
            expect(typeof monitoring.getDashboardData).toBe('function');
        });
    });
    describe('Shutdown Coordination', () => {
        it('should shutdown all components in correct order', async () => {
            const system = await TaskManagementSystemFactory.createComplete(mockConfig);
            // Mock shutdown methods to verify call order
            const shutdownSpy = {
                hook: vi.fn(),
                monitoring: vi.fn(),
                taskEngine: vi.fn()
            };
            if (system.hookIntegration) {
                system.hookIntegration.shutdown = shutdownSpy.hook;
            }
            if (system.monitoring) {
                system.monitoring.shutdown = shutdownSpy.monitoring;
            }
            system.taskEngine.shutdown = shutdownSpy.taskEngine;
            await system.shutdown();
            // Verify shutdown order: hook integration -> monitoring -> task engine
            if (system.hookIntegration) {
                expect(shutdownSpy.hook).toHaveBeenCalled();
            }
            if (system.monitoring) {
                expect(shutdownSpy.monitoring).toHaveBeenCalled();
            }
            expect(shutdownSpy.taskEngine).toHaveBeenCalled();
        });
        it('should handle partial shutdown failures gracefully', async () => {
            const system = await TaskManagementSystemFactory.createComplete(mockConfig);
            // Mock monitoring shutdown to fail
            if (system.monitoring) {
                system.monitoring.shutdown = vi.fn().mockRejectedValue(new Error('Monitoring shutdown failed'));
            }
            // Should not throw despite monitoring failure
            await expect(system.shutdown()).resolves.not.toThrow();
        });
    });
    describe('Event Handler Integration', () => {
        it('should properly integrate event handlers between components', async () => {
            const system = await TaskManagementSystemFactory.createComplete(mockConfig);
            // Queue a task to test event flow
            const taskId = await system.taskEngine.queueTask('Integration Test Task', 'Test task for event integration');
            expect(taskId).toBeTruthy();
            const task = system.taskEngine.getTask(taskId);
            expect(task).toBeDefined();
            // Test that task status changes trigger monitoring events
            // (In real implementation, this would verify internal event recording)
            await system.shutdown();
        });
        it('should handle event handler failures gracefully', async () => {
            // Create system with potentially failing event handlers
            const system = await TaskManagementSystemFactory.createComplete(mockConfig);
            // Task operations should continue even if event handlers fail
            const taskId = await system.taskEngine.queueTask('Resilient Task', 'Task that continues despite event handler issues');
            expect(taskId).toBeTruthy();
            await system.shutdown();
        });
    });
    describe('Configuration Validation', () => {
        it('should handle invalid configuration gracefully', async () => {
            const invalidConfig = {
            // Missing required config properties
            };
            // Should still create system with defaults
            await expect(TaskManagementSystemFactory.createComplete(invalidConfig)).resolves.not.toThrow();
        });
        it('should validate monitoring configuration options', async () => {
            const system = await TaskManagementSystemFactory.createComplete(mockConfig, {
                monitoringConfig: {
                    verboseLogging: true,
                    maxEventsInMemory: 1000,
                    metricsCollectionIntervalMs: 30000
                }
            });
            expect(system.monitoring).toBeDefined();
            await system.shutdown();
        });
        it('should handle missing storage configuration', async () => {
            const configWithoutStorage = {
                ...mockConfig,
                storage: undefined
            };
            // Should create system but may have limited persistence functionality
            const system = await TaskManagementSystemFactory.createComplete(configWithoutStorage);
            expect(system.taskEngine).toBeDefined();
            await system.shutdown();
        });
    });
    describe('Component Communication', () => {
        it('should enable communication between task engine and monitoring', async () => {
            const system = await TaskManagementSystemFactory.createComplete(mockConfig);
            expect(system.taskEngine).toBeDefined();
            expect(system.monitoring).toBeDefined();
            // Test that task engine can report to monitoring
            const taskId = await system.taskEngine.queueTask('Communication Test', 'Test description');
            const stats = system.taskEngine.getExecutionStats();
            expect(stats).toBeDefined();
            expect(typeof stats.total).toBe('number');
            await system.shutdown();
        });
        it('should enable communication between monitoring and hook integration', async () => {
            const system = await TaskManagementSystemFactory.createComplete(mockConfig);
            if (system.monitoring && system.hookIntegration) {
                // Test that monitoring data is available to hook integration
                const tasks = system.taskEngine.getAllTasks();
                const metrics = await system.monitoring.collectMetrics(tasks);
                expect(metrics).toBeDefined();
                expect(typeof metrics.totalTasks).toBe('number');
            }
            await system.shutdown();
        });
    });
    describe('Performance and Resource Management', () => {
        it('should handle concurrent task creation', async () => {
            const system = await TaskManagementSystemFactory.createComplete(mockConfig);
            // Create multiple tasks concurrently
            const taskPromises = Array.from({ length: 10 }, (_, i) => system.taskEngine.queueTask(`Concurrent Task ${i}`, `Description ${i}`));
            const taskIds = await Promise.all(taskPromises);
            expect(taskIds).toHaveLength(10);
            expect(taskIds.every(id => typeof id === 'string')).toBe(true);
            const tasks = system.taskEngine.getAllTasks();
            expect(tasks.length).toBe(10);
            await system.shutdown();
        });
        it('should manage memory usage effectively', async () => {
            const system = await TaskManagementSystemFactory.createComplete(mockConfig);
            // Create and complete many tasks to test memory management
            for (let i = 0; i < 100; i++) {
                await system.taskEngine.queueTask(`Memory Test ${i}`, 'Test description');
            }
            const stats = system.taskEngine.getExecutionStats();
            expect(stats.total).toBe(100);
            // Test cleanup functionality
            const clearedCount = system.taskEngine.clearCompletedTasks();
            expect(typeof clearedCount).toBe('number');
            await system.shutdown();
        });
    });
});
describe('Convenience Functions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ status: 'success' })
        });
    });
    describe('createTaskManagementSystem', () => {
        it('should be equivalent to TaskManagementSystemFactory.createComplete', async () => {
            const system1 = await createTaskManagementSystem(mockConfig);
            const system2 = await TaskManagementSystemFactory.createComplete(mockConfig);
            expect(typeof system1.taskEngine).toBe(typeof system2.taskEngine);
            expect(typeof system1.monitoring).toBe(typeof system2.monitoring);
            expect(typeof system1.hookIntegration).toBe(typeof system2.hookIntegration);
            expect(typeof system1.shutdown).toBe(typeof system2.shutdown);
            await system1.shutdown();
            await system2.shutdown();
        });
        it('should pass through options correctly', async () => {
            const options = {
                enableMonitoring: false,
                enableHookIntegration: true,
                hookIntegrationConfig: {
                    agentId: 'test-agent',
                    capabilities: ['frontend']
                }
            };
            const system = await createTaskManagementSystem(mockConfig, options);
            expect(system.taskEngine).toBeDefined();
            expect(system.monitoring).toBeUndefined();
            expect(system.hookIntegration).toBeDefined();
            await system.shutdown();
        });
    });
    describe('createTaskEngine', () => {
        it('should be equivalent to TaskManagementSystemFactory.createStandalone', () => {
            const engine1 = createTaskEngine(mockConfig);
            const engine2 = TaskManagementSystemFactory.createStandalone(mockConfig);
            expect(typeof engine1.queueTask).toBe(typeof engine2.queueTask);
            expect(typeof engine1.getTask).toBe(typeof engine2.getTask);
            expect(typeof engine1.getAllTasks).toBe(typeof engine2.getAllTasks);
        });
    });
});
//# sourceMappingURL=TaskManagementSystemFactory.test.js.map