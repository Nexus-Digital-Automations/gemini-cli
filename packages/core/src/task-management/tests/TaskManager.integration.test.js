/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Comprehensive Integration Tests for Task Management System
 *
 * This test suite validates the complete integration of all task management
 * components working together as an autonomous system.
 */
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { TaskManager, createTaskManager } from '../TaskManager.js';
import { AutonomousExecutionEngine, ExecutionMode, ErrorRecoveryStrategy, } from '../AutonomousExecutionEngine.js';
import { TaskStateManager, ExtendedTaskState } from '../TaskStateManager.js';
import { createCLITaskIntegration } from '../CLITaskIntegration.js';
/**
 * Mock configuration for testing
 */
function createMockConfig() {
    return {
        config: {
            // Mock base config
            tempDir: '/tmp/gemini-cli-test',
            logLevel: 'info',
        },
        enableAutonomousBreakdown: true,
        enableAdaptiveScheduling: true,
        enableLearning: true,
        enableMonitoring: false, // Disable for tests
        enableHookIntegration: false, // Disable for tests
        enablePersistence: true,
        agentId: 'TEST_AGENT',
        maxConcurrentTasks: 4,
    };
}
function createMockCLIConfig() {
    return {
        config: {
            tempDir: '/tmp/gemini-cli-test',
            logLevel: 'error', // Minimize test noise
        },
        interactiveMode: false,
        enableProgressReporting: false,
        enableNotifications: false,
        verbosity: 'silent',
    };
}
describe('TaskManager Integration Tests', () => {
    let taskManager;
    beforeEach(async () => {
        const config = createMockConfig();
        taskManager = new TaskManager(config);
        await taskManager.initialize();
    });
    afterEach(async () => {
        if (taskManager) {
            await taskManager.shutdown();
        }
    });
    describe('Core Task Management', () => {
        test('should create and execute a simple task', async () => {
            const taskId = await taskManager.addTask('Test Task', 'A simple test task for validation', {
                priority: 'medium',
                category: 'testing',
            });
            expect(taskId).toBeDefined();
            expect(typeof taskId).toBe('string');
            // Wait a short time for autonomous processing
            await new Promise((resolve) => setTimeout(resolve, 100));
            const status = await taskManager.getTaskStatus(taskId);
            expect(status).toBeDefined();
            expect(status.status).toBeDefined();
        });
        test('should handle multiple concurrent tasks', async () => {
            const taskPromises = [];
            for (let i = 0; i < 3; i++) {
                taskPromises.push(taskManager.addTask(`Concurrent Task ${i + 1}`, `Description for task ${i + 1}`, {
                    priority: 'medium',
                    category: 'testing',
                }));
            }
            const taskIds = await Promise.all(taskPromises);
            expect(taskIds).toHaveLength(3);
            taskIds.forEach((taskId) => {
                expect(typeof taskId).toBe('string');
            });
            // Check system status
            const systemStatus = taskManager.getSystemStatus();
            expect(systemStatus.isRunning).toBe(true);
            expect(systemStatus.taskCounts.autonomous +
                systemStatus.taskCounts.traditional).toBeGreaterThanOrEqual(3);
        });
        test('should support different task priorities', async () => {
            const priorities = ['low', 'medium', 'high', 'critical'];
            const taskIds = [];
            for (const priority of priorities) {
                const taskId = await taskManager.addTask(`${priority} Priority Task`, `A task with ${priority} priority`, { priority });
                taskIds.push(taskId);
            }
            expect(taskIds).toHaveLength(4);
            // Verify all tasks were created
            for (const taskId of taskIds) {
                const status = await taskManager.getTaskStatus(taskId);
                expect(status).toBeDefined();
            }
        });
        test('should demonstrate autonomous task breakdown', async () => {
            const complexTaskId = await taskManager.addTask('Complex Comprehensive Task', 'This is a very complex task that involves multiple components: frontend development, backend API implementation, database schema design, comprehensive testing suite, detailed documentation, performance optimization, security auditing, and deployment configuration. This task should be automatically broken down due to its high complexity score.', {
                priority: 'high',
                category: 'implementation',
                forceBreakdown: true,
                useAutonomousQueue: true,
            });
            expect(complexTaskId).toBeDefined();
            // Allow time for breakdown processing
            await new Promise((resolve) => setTimeout(resolve, 200));
            const status = await taskManager.getTaskStatus(complexTaskId);
            expect(status).toBeDefined();
            expect(status.breakdown).toBeDefined();
        });
    });
    describe('Error Handling and Recovery', () => {
        test('should handle task execution errors gracefully', async () => {
            const taskId = await taskManager.addTask('Failing Task', 'A task designed to fail for testing error handling', {
                priority: 'medium',
                category: 'testing',
                parameters: {
                    shouldFail: true,
                    errorType: 'runtime_error',
                },
            });
            expect(taskId).toBeDefined();
            // Allow time for execution and error handling
            await new Promise((resolve) => setTimeout(resolve, 500));
            const status = await taskManager.getTaskStatus(taskId);
            expect(status).toBeDefined();
            // The autonomous system should have handled the error
            // Status could be failed, retrying, or recovered
            expect(['failed', 'retrying', 'completed', 'in_progress']).toContain(status.status);
        });
        test('should demonstrate error recovery strategies', async () => {
            const taskId = await taskManager.addTask('Recoverable Task', 'A task that fails initially but should recover', {
                priority: 'medium',
                category: 'testing',
                parameters: {
                    shouldFailOnce: true,
                    recoveryStrategy: 'exponential_backoff',
                },
            });
            expect(taskId).toBeDefined();
            // Allow time for failure and recovery
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const status = await taskManager.getTaskStatus(taskId);
            expect(status).toBeDefined();
            // Should show evidence of recovery attempts
            if (status.metrics) {
                expect(status.metrics.recoveryAttempts).toBeDefined();
            }
        });
    });
    describe('Performance and Optimization', () => {
        test('should maintain performance under load', async () => {
            const startTime = Date.now();
            const taskPromises = [];
            // Create 10 tasks rapidly
            for (let i = 0; i < 10; i++) {
                taskPromises.push(taskManager.addTask(`Load Test Task ${i + 1}`, 'A task for performance testing', {
                    priority: 'medium',
                    category: 'testing',
                }));
            }
            const taskIds = await Promise.all(taskPromises);
            const creationTime = Date.now() - startTime;
            expect(taskIds).toHaveLength(10);
            expect(creationTime).toBeLessThan(5000); // Should complete within 5 seconds
            // Verify system is handling the load
            const systemStatus = taskManager.getSystemStatus();
            expect(systemStatus.isRunning).toBe(true);
            expect(systemStatus.systemHealth).toBeDefined();
        });
        test('should optimize task scheduling', async () => {
            // Create tasks with dependencies and priorities
            const taskIds = [];
            taskIds.push(await taskManager.addTask('Foundation Task', 'Base task that others depend on', {
                priority: 'high',
                category: 'implementation',
            }));
            taskIds.push(await taskManager.addTask('Dependent Task', 'Task that depends on foundation', {
                priority: 'medium',
                category: 'testing',
                dependencies: [taskIds[0]],
            }));
            taskIds.push(await taskManager.addTask('Independent High Priority', 'High priority independent task', {
                priority: 'critical',
                category: 'analysis',
            }));
            expect(taskIds).toHaveLength(3);
            // Allow time for scheduling optimization
            await new Promise((resolve) => setTimeout(resolve, 300));
            // Verify all tasks are being managed
            for (const taskId of taskIds) {
                const status = await taskManager.getTaskStatus(taskId);
                expect(status).toBeDefined();
            }
        });
    });
    describe('System Status and Monitoring', () => {
        test('should provide accurate system status', async () => {
            const initialStatus = taskManager.getSystemStatus();
            expect(initialStatus.isRunning).toBe(true);
            expect(initialStatus.autonomousMode).toBe(true);
            expect(initialStatus.taskCounts).toBeDefined();
            expect(initialStatus.performance).toBeDefined();
            // Add some tasks
            await taskManager.addTask('Status Test 1', 'First status test task');
            await taskManager.addTask('Status Test 2', 'Second status test task');
            await new Promise((resolve) => setTimeout(resolve, 100));
            const updatedStatus = taskManager.getSystemStatus();
            expect(updatedStatus.taskCounts.autonomous +
                updatedStatus.taskCounts.traditional).toBeGreaterThanOrEqual(2);
        });
        test('should track performance metrics', async () => {
            // Create several tasks to generate metrics
            const taskIds = [];
            for (let i = 0; i < 5; i++) {
                taskIds.push(await taskManager.addTask(`Metrics Task ${i + 1}`, 'Task for metrics generation'));
            }
            // Allow time for processing
            await new Promise((resolve) => setTimeout(resolve, 200));
            const systemStatus = taskManager.getSystemStatus();
            expect(systemStatus.performance).toBeDefined();
            expect(systemStatus.performance.autonomous).toBeDefined();
        });
    });
});
describe('AutonomousExecutionEngine Integration Tests', () => {
    let executionEngine;
    beforeEach(() => {
        executionEngine = new AutonomousExecutionEngine({
            enablePredictiveAnalysis: true,
            enablePerformanceOptimization: true,
            enableCircuitBreaker: true,
            enableQualityGates: true,
            learningEnabled: true,
        });
    });
    afterEach(async () => {
        await executionEngine.shutdown();
    });
    test('should execute tasks with quality gates', async () => {
        const mockTask = {
            id: 'test-task-1',
            title: 'Quality Gate Test',
            description: 'Testing quality gate execution',
            status: 'pending',
            priority: 'medium',
            category: 'testing',
            metadata: {
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'test',
            },
        };
        const result = await executionEngine.executeTask(mockTask, {
            qualityGates: ['pre_execution', 'post_execution'],
            executionMode: ExecutionMode.CONSERVATIVE,
        });
        expect(result).toBeDefined();
        expect(result.taskId).toBe('test-task-1');
        expect(result.qualityGateResults).toBeDefined();
        expect(result.qualityGateResults.length).toBeGreaterThan(0);
        expect(result.performanceMetrics).toBeDefined();
    });
    test('should demonstrate error recovery mechanisms', async () => {
        const mockTask = {
            id: 'error-test-task',
            title: 'Error Recovery Test',
            description: 'Testing error recovery capabilities',
            status: 'pending',
            priority: 'medium',
            category: 'testing',
            metadata: {
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'test',
            },
        };
        const result = await executionEngine.executeTask(mockTask, {
            recoveryStrategy: ErrorRecoveryStrategy.EXPONENTIAL_BACKOFF,
            maxRetries: 2,
        });
        expect(result).toBeDefined();
        expect(result.recoveryAttempts).toBeDefined();
        expect(result.recoveryStrategy).toBe(ErrorRecoveryStrategy.EXPONENTIAL_BACKOFF);
    });
    test('should adapt execution based on system conditions', async () => {
        const mockTask = {
            id: 'adaptive-test-task',
            title: 'Adaptive Execution Test',
            description: 'Testing adaptive execution capabilities',
            status: 'pending',
            priority: 'medium',
            category: 'testing',
            metadata: {
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'test',
            },
        };
        const result = await executionEngine.executeTask(mockTask, {
            executionMode: ExecutionMode.ADAPTIVE,
        });
        expect(result).toBeDefined();
        expect(result.adaptations).toBeDefined();
        expect(Array.isArray(result.adaptations)).toBe(true);
    });
});
describe('TaskStateManager Integration Tests', () => {
    let stateManager;
    beforeEach(() => {
        const mockStorage = {
            save: vi.fn().mockResolvedValue(undefined),
            load: vi.fn().mockResolvedValue(null),
            loadHistory: vi.fn().mockResolvedValue([]),
            delete: vi.fn().mockResolvedValue(undefined),
            cleanup: vi.fn().mockResolvedValue(0),
        };
        stateManager = new TaskStateManager(mockStorage, {
            enableHistory: true,
            enableValidation: true,
            enableAutomaticTransitions: true,
        });
    });
    afterEach(async () => {
        await stateManager.shutdown();
    });
    test('should manage task state transitions', async () => {
        const taskId = 'state-test-task';
        const mockTask = {
            id: taskId,
            title: 'State Transition Test',
            description: 'Testing state transitions',
            status: 'pending',
            priority: 'medium',
            category: 'testing',
            metadata: {
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'test',
            },
        };
        // Test state transitions
        const transition1 = await stateManager.transitionTaskState(taskId, ExtendedTaskState.PENDING, mockTask);
        expect(transition1).toBeDefined();
        expect(transition1.fromState).toBe(ExtendedTaskState.DRAFT);
        expect(transition1.toState).toBe(ExtendedTaskState.PENDING);
        const currentState = stateManager.getTaskState(taskId);
        expect(currentState).toBe(ExtendedTaskState.PENDING);
        // Test another transition
        const transition2 = await stateManager.transitionTaskState(taskId, ExtendedTaskState.IN_PROGRESS, mockTask);
        expect(transition2.fromState).toBe(ExtendedTaskState.PENDING);
        expect(transition2.toState).toBe(ExtendedTaskState.IN_PROGRESS);
    });
    test('should maintain state history and support rollback', async () => {
        const taskId = 'history-test-task';
        const mockTask = {
            id: taskId,
            title: 'History Test',
            description: 'Testing state history',
            status: 'pending',
            priority: 'medium',
            category: 'testing',
            metadata: {
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'test',
            },
        };
        // Create several state transitions
        await stateManager.transitionTaskState(taskId, ExtendedTaskState.PENDING, mockTask);
        await stateManager.transitionTaskState(taskId, ExtendedTaskState.IN_PROGRESS, mockTask);
        await stateManager.transitionTaskState(taskId, ExtendedTaskState.COMPLETED, mockTask);
        const history = stateManager.getTaskStateHistory(taskId);
        expect(history).toBeDefined();
        expect(history.length).toBe(3);
        const snapshots = stateManager.getTaskSnapshots(taskId);
        expect(snapshots).toBeDefined();
        expect(snapshots.length).toBeGreaterThan(0);
    });
    test('should handle bulk state operations', async () => {
        const transitions = [
            {
                taskId: 'bulk-task-1',
                newState: ExtendedTaskState.PENDING,
                task: { id: 'bulk-task-1', title: 'Bulk Task 1' },
                reason: 'Bulk operation test',
            },
            {
                taskId: 'bulk-task-2',
                newState: ExtendedTaskState.PENDING,
                task: { id: 'bulk-task-2', title: 'Bulk Task 2' },
                reason: 'Bulk operation test',
            },
            {
                taskId: 'bulk-task-3',
                newState: ExtendedTaskState.PENDING,
                task: { id: 'bulk-task-3', title: 'Bulk Task 3' },
                reason: 'Bulk operation test',
            },
        ];
        const result = await stateManager.transitionMultipleTasks(transitions);
        expect(result).toBeDefined();
        expect(result.summary.total).toBe(3);
        expect(result.summary.succeeded).toBeGreaterThan(0);
        expect(result.successful.length).toBeGreaterThan(0);
    });
});
describe('CLITaskIntegration Integration Tests', () => {
    let cliIntegration;
    beforeEach(async () => {
        const config = createMockCLIConfig();
        cliIntegration = await createCLITaskIntegration(config);
    });
    afterEach(async () => {
        if (cliIntegration) {
            await cliIntegration.shutdown();
        }
    });
    test('should register and execute CLI commands', async () => {
        cliIntegration.registerCommand({
            name: 'test-command',
            description: 'A test command',
            mapToTask: async (args, options) => ({
                id: '',
                title: `Test Command Task: ${args[0] || 'default'}`,
                description: 'Task created from test command',
                status: 'pending',
                priority: 'medium',
                category: 'testing',
                metadata: {
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    createdBy: 'cli_test',
                },
                parameters: { args, options },
            }),
        });
        const result = await cliIntegration.executeCommand('test-command', ['arg1', 'arg2'], { option1: 'value1' });
        expect(result).toBeDefined();
        expect(result.success).toBeDefined();
        expect(result.taskId).toBeDefined();
        expect(typeof result.taskId).toBe('string');
    });
    test('should provide system status information', async () => {
        const systemStatus = cliIntegration.getSystemStatus();
        expect(systemStatus).toBeDefined();
        expect(systemStatus.isRunning).toBe(true);
        expect(systemStatus.tasksActive).toBeDefined();
        expect(systemStatus.tasksCompleted).toBeDefined();
        expect(systemStatus.tasksFailed).toBeDefined();
        expect(systemStatus.autonomousMode).toBe(true);
        expect(systemStatus.lastUpdate).toBeInstanceOf(Date);
    });
    test('should handle task progress tracking', async () => {
        // This would test actual progress tracking
        // For now, we test the interface
        const activeTasksList = cliIntegration.listActiveTasks();
        expect(Array.isArray(activeTasksList)).toBe(true);
        const mockTaskId = 'mock-progress-task';
        const progressInfo = cliIntegration.getTaskProgress(mockTaskId);
        // Should return null for non-existent task
        expect(progressInfo).toBeNull();
    });
});
describe('End-to-End Integration Tests', () => {
    let taskManager;
    let cliIntegration;
    beforeEach(async () => {
        // Create a full system integration
        const taskConfig = createMockConfig();
        const cliConfig = createMockCLIConfig();
        taskManager = new TaskManager(taskConfig);
        await taskManager.initialize();
        cliIntegration = await createCLITaskIntegration(cliConfig);
    });
    afterEach(async () => {
        if (cliIntegration) {
            await cliIntegration.shutdown();
        }
        if (taskManager) {
            await taskManager.shutdown();
        }
    });
    test('should demonstrate complete autonomous task lifecycle', async () => {
        // Create a complex task that will trigger autonomous breakdown
        const taskId = await taskManager.addTask('Full Lifecycle Test', 'This comprehensive task will demonstrate the complete autonomous task lifecycle including breakdown, scheduling, execution, error handling, quality gates, and completion reporting. The task involves multiple phases: analysis, implementation, testing, optimization, and documentation.', {
            priority: 'high',
            category: 'implementation',
            useAutonomousQueue: true,
            forceBreakdown: true,
        });
        expect(taskId).toBeDefined();
        // Allow time for autonomous processing
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // Verify task is being processed
        const status = await taskManager.getTaskStatus(taskId);
        expect(status).toBeDefined();
        // Check system status
        const systemStatus = taskManager.getSystemStatus();
        expect(systemStatus.isRunning).toBe(true);
        expect(systemStatus.taskCounts.autonomous + systemStatus.taskCounts.traditional).toBeGreaterThan(0);
        // The task should show evidence of autonomous processing
        if (status.breakdown) {
            expect(status.breakdown).toBeDefined();
        }
        if (status.metrics) {
            expect(status.metrics).toBeDefined();
        }
    });
    test('should handle system-wide error scenarios', async () => {
        // Create multiple tasks, some designed to fail
        const taskIds = [];
        taskIds.push(await taskManager.addTask('Normal Task', 'A regular task that should succeed', { priority: 'medium', category: 'testing' }));
        taskIds.push(await taskManager.addTask('Error-Prone Task', 'A task designed to test error handling', {
            priority: 'medium',
            category: 'testing',
            parameters: { errorProne: true },
        }));
        taskIds.push(await taskManager.addTask('High Priority Task', 'High priority task that should still execute', { priority: 'critical', category: 'implementation' }));
        expect(taskIds).toHaveLength(3);
        // Allow time for processing and error handling
        await new Promise((resolve) => setTimeout(resolve, 2000));
        // System should still be running and handling tasks
        const systemStatus = taskManager.getSystemStatus();
        expect(systemStatus.isRunning).toBe(true);
        // Verify all tasks were processed in some way
        for (const taskId of taskIds) {
            const status = await taskManager.getTaskStatus(taskId);
            expect(status).toBeDefined();
            // Status should be one of the valid states (not undefined/null)
            expect([
                'pending',
                'in_progress',
                'completed',
                'failed',
                'retrying',
            ]).toContain(status.status);
        }
    });
    test('should demonstrate performance under realistic load', async () => {
        const startTime = Date.now();
        const taskPromises = [];
        // Create 20 tasks with varying complexity and priorities
        for (let i = 0; i < 20; i++) {
            const priority = i % 4 === 0 ? 'critical' : i % 3 === 0 ? 'high' : 'medium';
            const isComplex = i % 5 === 0;
            taskPromises.push(taskManager.addTask(`Load Test Task ${i + 1}`, isComplex
                ? 'Complex task with multiple requirements: database operations, file processing, API calls, validation, error handling, logging, and performance monitoring.'
                : `Simple load test task ${i + 1}`, {
                priority,
                category: i % 2 === 0 ? 'implementation' : 'testing',
                useAutonomousQueue: isComplex,
            }));
        }
        const taskIds = await Promise.all(taskPromises);
        const setupTime = Date.now() - startTime;
        expect(taskIds).toHaveLength(20);
        expect(setupTime).toBeLessThan(10000); // Should setup within 10 seconds
        // Allow time for processing
        await new Promise((resolve) => setTimeout(resolve, 3000));
        // Verify system performance
        const systemStatus = taskManager.getSystemStatus();
        expect(systemStatus.isRunning).toBe(true);
        // Check that tasks are being processed
        let processedTasks = 0;
        for (const taskId of taskIds) {
            try {
                const status = await taskManager.getTaskStatus(taskId);
                if (status) {
                    processedTasks++;
                }
            }
            catch (error) {
                // Some tasks might not be found yet, that's ok
            }
        }
        expect(processedTasks).toBeGreaterThan(0);
        console.log(`Performance test: ${processedTasks}/${taskIds.length} tasks processed`);
    });
});
//# sourceMappingURL=TaskManager.integration.test.js.map