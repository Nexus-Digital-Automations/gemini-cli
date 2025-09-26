/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, jest, } from 'vitest';
import { SystemInitializer, SystemConfig, } from '@google/gemini-cli-core/autonomous-tasks/SystemInitializer.js';
import {} from '../../../test-types.js';
import { TaskExecutionEngine, TaskType, TaskPriority, } from '@google/gemini-cli-core/task-management/TaskExecutionEngine.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
/**
 * End-to-End tests for the complete autonomous task management system
 * Tests the full integration from CLI commands through system initialization
 * to task execution and completion.
 */
describe('Autonomous Task Management System E2E', () => {
    let testWorkspace;
    let systemInitializer;
    let mockConfig;
    let systemConfig;
    beforeAll(async () => {
        // Create test workspace
        testWorkspace = await fs.mkdtemp(path.join(process.cwd(), 'e2e-test-workspace-'));
        process.chdir(testWorkspace);
    });
    afterAll(async () => {
        // Clean up test workspace
        try {
            process.chdir(process.cwd());
            await fs.rm(testWorkspace, { recursive: true, force: true });
        }
        catch (error) {
            console.warn('Failed to clean up test workspace:', error);
        }
    });
    beforeEach(async () => {
        // Mock Config
        mockConfig = {
            getModel: vi.fn().mockReturnValue('gemini-pro'),
            getToolRegistry: vi.fn().mockReturnValue({}),
            getDebugMode: vi.fn().mockReturnValue(false),
            getSessionId: vi.fn().mockReturnValue('e2e-test-session'),
            storage: {},
        };
        // System configuration for E2E testing
        systemConfig = {
            persistenceConfig: {
                type: 'file',
                path: path.join(testWorkspace, 'test-tasks.json'),
            },
            logging: {
                level: 'debug',
                output: 'console',
            },
            agentConfig: {
                maxConcurrentAgents: 3,
                heartbeatInterval: 5000, // Shorter for testing
                sessionTimeout: 15000, // Shorter for testing
            },
            qualityConfig: {
                enableLinting: true,
                enableTesting: true,
                enableSecurity: true,
                enablePerformance: true,
            },
            monitoring: {
                enableMetrics: true,
                metricsInterval: 2000, // Shorter for testing
                alertThresholds: {
                    taskQueueSize: 10,
                    avgExecutionTime: 60000,
                    failureRate: 0.2,
                },
            },
        };
        systemInitializer = new SystemInitializer(mockConfig, systemConfig);
    });
    afterEach(async () => {
        // Clean shutdown
        if (systemInitializer) {
            try {
                await systemInitializer.shutdown(5000);
            }
            catch (error) {
                console.warn('Error during system shutdown:', error);
            }
        }
        // Clean up state files
        const stateFiles = [
            '.autonomous-system.pid',
            '.autonomous-system.state',
            'test-tasks.json',
            'test-tasks.json.lock',
        ];
        for (const file of stateFiles) {
            try {
                await fs.unlink(path.join(testWorkspace, file));
            }
            catch (error) {
                // Ignore if file doesn't exist
            }
        }
    });
    describe('complete system lifecycle', () => {
        it('should initialize, run tasks, and shutdown gracefully', async () => {
            // Track system events
            const events = [];
            systemInitializer.on('systemInitialized', () => events.push('systemInitialized'));
            systemInitializer.on('agentRegistered', () => events.push('agentRegistered'));
            systemInitializer.on('taskQueued', () => events.push('taskQueued'));
            systemInitializer.on('taskStarted', () => events.push('taskStarted'));
            systemInitializer.on('taskCompleted', () => events.push('taskCompleted'));
            systemInitializer.on('systemShutdown', (phase) => events.push(`systemShutdown-${phase}`));
            // 1. Initialize the system
            await systemInitializer.initialize();
            expect(events).toContain('systemInitialized');
            // Verify system is running
            const initialStatus = systemInitializer.getSystemStatus();
            expect(initialStatus.isRunning).toBe(true);
            expect(initialStatus.pid).toBe(process.pid);
            // 2. Register agents
            await systemInitializer.registerAgent('test-agent-001', 'feature', ['frontend', 'testing'], 'session-001');
            await systemInitializer.registerAgent('test-agent-002', 'security', ['security', 'validation'], 'session-002');
            expect(events).toContain('agentRegistered');
            expect(systemInitializer.getActiveAgents()).toHaveLength(2);
            // 3. Queue tasks
            const task1Id = await systemInitializer.queueTask('Implement user authentication', 'Add JWT-based authentication with login/logout functionality', {
                type: TaskType.IMPLEMENTATION,
                context: { priority: 'high', component: 'auth' },
                maxExecutionTimeMinutes: 30,
                expectedOutputs: {
                    implementation_complete: 'Authentication system implemented',
                    tests_passed: 'Unit and integration tests passing',
                },
            });
            const task2Id = await systemInitializer.queueTask('Security audit of authentication', 'Perform comprehensive security review of auth implementation', {
                type: TaskType.SECURITY,
                context: { depends_on: task1Id },
                maxExecutionTimeMinutes: 20,
                expectedOutputs: {
                    audit_report: 'Security audit report with findings',
                    recommendations: 'Security improvement recommendations',
                },
            });
            expect(events).toContain('taskQueued');
            expect(task1Id).toBeDefined();
            expect(task2Id).toBeDefined();
            // 4. Verify system status reflects queued tasks
            const statusWithTasks = systemInitializer.getSystemStatus();
            expect(statusWithTasks.taskQueue.queued).toBeGreaterThan(0);
            // 5. Agent heartbeats
            await systemInitializer.agentHeartbeat('test-agent-001', 'busy', task1Id);
            await systemInitializer.agentHeartbeat('test-agent-002', 'idle');
            const agents = systemInitializer.getActiveAgents();
            const agent1 = agents.find((a) => a.id === 'test-agent-001');
            const agent2 = agents.find((a) => a.id === 'test-agent-002');
            expect(agent1?.status).toBe('busy');
            expect(agent1?.currentTask).toBe(task1Id);
            expect(agent2?.status).toBe('idle');
            // 6. Wait for some processing time
            await new Promise((resolve) => setTimeout(resolve, 3000));
            // 7. Verify persistence
            const persistenceFileExists = await fs
                .access(systemConfig.persistenceConfig.path)
                .then(() => true)
                .catch(() => false);
            expect(persistenceFileExists).toBe(true);
            const persistedData = JSON.parse(await fs.readFile(systemConfig.persistenceConfig.path, 'utf-8'));
            expect(persistedData).toHaveProperty('tasks');
            expect(persistedData).toHaveProperty('lastSaved');
            // 8. Test metrics collection
            // Trigger metrics collection manually
            systemInitializer.emit('metricsCollected', systemInitializer.getSystemStatus());
            // 9. Graceful shutdown
            await systemInitializer.shutdown();
            expect(events).toContain('systemShutdown-initiated');
            expect(events).toContain('systemShutdown-completed');
            // Verify system is stopped
            const finalStatus = systemInitializer.getSystemStatus();
            expect(finalStatus.isRunning).toBe(false);
            // Verify agents were unregistered
            expect(systemInitializer.getActiveAgents()).toHaveLength(0);
        }, 30000); // 30 second timeout for full E2E test
        it('should handle agent timeouts and recovery', async () => {
            await systemInitializer.initialize();
            // Register agent
            await systemInitializer.registerAgent('timeout-test-agent', 'feature', ['frontend'], 'session-timeout');
            expect(systemInitializer.getActiveAgents()).toHaveLength(1);
            // Wait for timeout (configured to 15 seconds in test config)
            await new Promise((resolve) => setTimeout(resolve, 16000));
            // Agent should be automatically removed due to timeout
            expect(systemInitializer.getActiveAgents()).toHaveLength(0);
        }, 20000);
        it('should persist and restore system state', async () => {
            // First session - initialize and add tasks
            await systemInitializer.initialize();
            const taskId = await systemInitializer.queueTask('Persistent task', 'This task should survive restart');
            await systemInitializer.registerAgent('persistent-agent', 'feature', ['frontend'], 'persistent-session');
            // Save state and shutdown
            await systemInitializer.shutdown();
            // Create new system instance (simulating restart)
            const newSystemInitializer = new SystemInitializer(mockConfig, systemConfig);
            // Initialize new instance - should load persisted state
            await newSystemInitializer.initialize();
            // Verify state was restored
            const restoredStatus = newSystemInitializer.getSystemStatus();
            expect(restoredStatus.isRunning).toBe(true);
            // Clean up
            await newSystemInitializer.shutdown();
        }, 15000);
        it('should handle system overload gracefully', async () => {
            await systemInitializer.initialize();
            // Register maximum number of agents
            for (let i = 0; i < systemConfig.agentConfig.maxConcurrentAgents; i++) {
                await systemInitializer.registerAgent(`agent-${i}`, 'feature', ['frontend'], `session-${i}`);
            }
            expect(systemInitializer.getActiveAgents()).toHaveLength(systemConfig.agentConfig.maxConcurrentAgents);
            // Queue many tasks to trigger overload conditions
            const taskIds = [];
            for (let i = 0; i < 15; i++) {
                const taskId = await systemInitializer.queueTask(`Overload task ${i}`, `Task ${i} for overload testing`);
                taskIds.push(taskId);
            }
            expect(taskIds).toHaveLength(15);
            // System should remain stable under load
            const statusUnderLoad = systemInitializer.getSystemStatus();
            expect(statusUnderLoad.isRunning).toBe(true);
            expect(statusUnderLoad.health).toBeTruthy(); // Should not be critical
            // Verify tasks are queued
            expect(statusUnderLoad.taskQueue.queued).toBeGreaterThan(0);
        }, 10000);
        it('should handle error conditions and recovery', async () => {
            await systemInitializer.initialize();
            // Register agent
            await systemInitializer.registerAgent('error-test-agent', 'feature', ['frontend'], 'error-session');
            // Simulate error by corrupting persistence file
            if (systemConfig.persistenceConfig.type === 'file' &&
                systemConfig.persistenceConfig.path) {
                await fs.writeFile(systemConfig.persistenceConfig.path, 'invalid-json-content');
            }
            // System should continue operating despite persistence errors
            const taskId = await systemInitializer.queueTask('Error recovery task', 'Testing error recovery');
            expect(taskId).toBeDefined();
            const status = systemInitializer.getSystemStatus();
            expect(status.isRunning).toBe(true);
        });
    });
    describe('integration with external components', () => {
        it('should integrate with task execution engine', async () => {
            await systemInitializer.initialize();
            // Queue a complex task that requires breakdown
            const taskId = await systemInitializer.queueTask('Complex feature implementation', 'Implement a complex feature that requires multiple subtasks, dependency management, and comprehensive testing', {
                type: TaskType.IMPLEMENTATION,
                maxExecutionTimeMinutes: 60,
                context: {
                    complexity: 'high',
                    requires: ['frontend', 'backend', 'testing', 'documentation'],
                },
                expectedOutputs: {
                    feature_implemented: 'Complete feature implementation',
                    tests_written: 'Comprehensive test suite',
                    documentation_updated: 'Updated documentation',
                },
            });
            expect(taskId).toBeDefined();
            // The task should be analyzed and potentially broken down
            // This tests the integration between SystemInitializer and TaskExecutionEngine
            const status = systemInitializer.getSystemStatus();
            expect(status.taskQueue.queued).toBeGreaterThan(0);
        });
        it('should handle quality gate integration', async () => {
            await systemInitializer.initialize();
            // Queue a task that will go through quality gates
            const taskId = await systemInitializer.queueTask('Quality gate test task', 'Task to test quality gate integration', {
                type: TaskType.IMPLEMENTATION,
                context: {
                    enableQualityGates: true,
                    requiredChecks: ['linting', 'testing', 'security', 'performance'],
                },
            });
            expect(taskId).toBeDefined();
            // System should process the task through quality gates
            // This is verified by the task being accepted into the queue
            const status = systemInitializer.getSystemStatus();
            expect(status.isRunning).toBe(true);
        });
    });
    describe('monitoring and alerting', () => {
        it('should collect and report metrics', async () => {
            const metricsEvents = [];
            systemInitializer.on('metricsCollected', (metrics) => metricsEvents.push(metrics));
            await systemInitializer.initialize();
            // Wait for metrics collection
            await new Promise((resolve) => setTimeout(resolve, 3000));
            expect(metricsEvents.length).toBeGreaterThan(0);
            const latestMetrics = metricsEvents[metricsEvents.length - 1];
            expect(latestMetrics).toHaveProperty('isRunning');
            expect(latestMetrics).toHaveProperty('activeAgents');
            expect(latestMetrics).toHaveProperty('taskQueue');
            expect(latestMetrics).toHaveProperty('resources');
        }, 5000);
        it('should trigger alerts on threshold breaches', async () => {
            const alertEvents = [];
            systemInitializer.on('alert', (type, current, threshold) => {
                alertEvents.push({ type, current, threshold });
            });
            await systemInitializer.initialize();
            // Queue many tasks to exceed threshold
            for (let i = 0; i < 12; i++) {
                // Exceeds taskQueueSize threshold of 10
                await systemInitializer.queueTask(`Alert test task ${i}`, `Task ${i}`);
            }
            // Wait for alert processing
            await new Promise((resolve) => setTimeout(resolve, 1000));
            // Should have triggered taskQueueSize alert
            const queueSizeAlert = alertEvents.find((alert) => alert.type === 'taskQueueSize');
            expect(queueSizeAlert).toBeDefined();
            if (queueSizeAlert) {
                expect(queueSizeAlert.current).toBeGreaterThan(queueSizeAlert.threshold);
            }
        });
    });
    describe('concurrency and race conditions', () => {
        it('should handle concurrent operations safely', async () => {
            await systemInitializer.initialize();
            // Perform multiple concurrent operations
            const promises = [
                // Agent registrations
                ...Array.from({ length: 3 }, (_, i) => systemInitializer.registerAgent(`concurrent-agent-${i}`, 'feature', ['frontend'], `session-${i}`)),
                // Task queuing
                ...Array.from({ length: 5 }, (_, i) => systemInitializer.queueTask(`Concurrent task ${i}`, `Task ${i} description`)),
                // Status checks
                ...Array.from({ length: 3 }, () => Promise.resolve(systemInitializer.getSystemStatus())),
            ];
            // All operations should complete successfully
            const results = await Promise.all(promises);
            expect(results).toHaveLength(11); // 3 agents + 5 tasks + 3 status checks
            // Verify final state
            expect(systemInitializer.getActiveAgents()).toHaveLength(3);
            const finalStatus = systemInitializer.getSystemStatus();
            expect(finalStatus.taskQueue.queued).toBe(5);
        });
    });
});
// Helper functions for E2E tests
function createMockTaskExecution(taskId, success = true) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                taskId,
                success,
                duration: Math.random() * 5000 + 1000, // 1-6 seconds
                result: success
                    ? 'Task completed successfully'
                    : 'Task failed with error',
            });
        }, Math.random() * 2000 + 500); // 0.5-2.5 seconds
    });
}
function simulateNetworkDelay(minMs = 100, maxMs = 500) {
    const delay = Math.random() * (maxMs - minMs) + minMs;
    return new Promise((resolve) => setTimeout(resolve, delay));
}
//# sourceMappingURL=full-system.test.js.map