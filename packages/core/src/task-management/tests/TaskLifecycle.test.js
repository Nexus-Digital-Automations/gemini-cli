/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TaskLifecycle } from '../TaskLifecycle.js';
/**
 * @fileoverview Comprehensive test suite for TaskLifecycle
 *
 * Tests task state transitions, lifecycle events, validation,
 * recovery mechanisms, and audit trails with >95% coverage.
 */
describe('TaskLifecycle', () => {
    let lifecycle;
    let mockTask;
    let mockEventHandlers;
    beforeEach(() => {
        mockEventHandlers = {
            onStatusChange: vi.fn(),
            onValidation: vi.fn(),
            onError: vi.fn(),
            onComplete: vi.fn(),
        };
        lifecycle = new TaskLifecycle({
            onStatusChange: mockEventHandlers.onStatusChange,
            onValidation: mockEventHandlers.onValidation,
            onError: mockEventHandlers.onError,
            onComplete: mockEventHandlers.onComplete,
        });
        mockTask = createMockTask('test-task-123');
    });
    afterEach(() => {
        vi.clearAllMocks();
    });
    describe('Task State Transitions', () => {
        it('should initialize task in pending state', () => {
            const task = lifecycle.initializeTask({
                title: 'New Task',
                description: 'Task description',
                priority: 'medium',
                category: 'implementation',
            });
            expect(task.status).toBe('pending');
            expect(task.id).toBeTruthy();
            expect(task.metadata.createdAt).toBeInstanceOf(Date);
            expect(task.metadata.updatedAt).toBeInstanceOf(Date);
        });
        it('should transition from pending to ready', async () => {
            const result = await lifecycle.transitionTo(mockTask, 'ready');
            expect(result.success).toBe(true);
            expect(mockTask.status).toBe('ready');
            expect(mockEventHandlers.onStatusChange).toHaveBeenCalledWith(mockTask, 'pending', 'ready');
        });
        it('should transition from ready to in_progress', async () => {
            mockTask.status = 'ready';
            const result = await lifecycle.transitionTo(mockTask, 'in_progress');
            expect(result.success).toBe(true);
            expect(mockTask.status).toBe('in_progress');
            expect(mockTask.metadata.startTime).toBeInstanceOf(Date);
            expect(mockEventHandlers.onStatusChange).toHaveBeenCalled();
        });
        it('should transition from in_progress to completed', async () => {
            mockTask.status = 'in_progress';
            mockTask.metadata.startTime = new Date();
            const result = await lifecycle.transitionTo(mockTask, 'completed');
            expect(result.success).toBe(true);
            expect(mockTask.status).toBe('completed');
            expect(mockTask.metadata.endTime).toBeInstanceOf(Date);
            expect(mockTask.metadata.actualDuration).toBeGreaterThan(0);
            expect(mockEventHandlers.onComplete).toHaveBeenCalledWith(mockTask);
        });
        it('should transition from in_progress to failed', async () => {
            mockTask.status = 'in_progress';
            mockTask.metadata.startTime = new Date();
            const result = await lifecycle.transitionTo(mockTask, 'failed', 'Task execution error');
            expect(result.success).toBe(true);
            expect(mockTask.status).toBe('failed');
            expect(mockTask.metadata.endTime).toBeInstanceOf(Date);
            expect(mockEventHandlers.onError).toHaveBeenCalledWith(mockTask, 'Task execution error');
        });
        it('should block invalid state transitions', async () => {
            // Try to go from pending directly to completed
            const result = await lifecycle.transitionTo(mockTask, 'completed');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid transition');
            expect(mockTask.status).toBe('pending'); // Unchanged
            expect(mockEventHandlers.onStatusChange).not.toHaveBeenCalled();
        });
        it('should allow transition to cancelled from any state', async () => {
            const states = [
                'pending',
                'ready',
                'in_progress',
                'blocked',
            ];
            for (const state of states) {
                const task = createMockTask(`task-${state}`);
                task.status = state;
                const result = await lifecycle.transitionTo(task, 'cancelled');
                expect(result.success).toBe(true);
                expect(task.status).toBe('cancelled');
            }
        });
        it('should handle blocked to ready transition', async () => {
            mockTask.status = 'blocked';
            const result = await lifecycle.transitionTo(mockTask, 'ready', 'Dependencies resolved');
            expect(result.success).toBe(true);
            expect(mockTask.status).toBe('ready');
        });
    });
    describe('State Validation', () => {
        it('should validate pending state requirements', async () => {
            const validationResult = await lifecycle.validateState(mockTask);
            expect(validationResult.isValid).toBe(true);
            expect(validationResult.issues).toHaveLength(0);
        });
        it('should detect invalid task configuration', async () => {
            const invalidTask = createMockTask('invalid');
            invalidTask.title = ''; // Invalid: empty title
            const validationResult = await lifecycle.validateState(invalidTask);
            expect(validationResult.isValid).toBe(false);
            expect(validationResult.issues).toEqual(expect.arrayContaining([
                expect.stringMatching(/title.*required|empty/i),
            ]));
        });
        it('should validate resource constraints for ready tasks', async () => {
            mockTask.status = 'ready';
            mockTask.executionContext = {
                resourceConstraints: [
                    { resourceType: 'cpu', maxUnits: 100 }, // Unrealistic constraint
                ],
            };
            const validationResult = await lifecycle.validateState(mockTask);
            expect(validationResult.isValid).toBe(false);
            expect(validationResult.issues).toEqual(expect.arrayContaining([
                expect.stringMatching(/resource.*constraint/i),
            ]));
        });
        it('should validate task dependencies', async () => {
            mockTask.status = 'ready';
            lifecycle.setTaskDependencies(mockTask.id, ['non-existent-task']);
            const validationResult = await lifecycle.validateState(mockTask);
            expect(validationResult.isValid).toBe(false);
            expect(validationResult.issues).toEqual(expect.arrayContaining([
                expect.stringMatching(/dependency.*not.*found/i),
            ]));
        });
        it('should validate execution context for in_progress tasks', async () => {
            mockTask.status = 'in_progress';
            mockTask.metadata.startTime = undefined; // Should have start time
            const validationResult = await lifecycle.validateState(mockTask);
            expect(validationResult.isValid).toBe(false);
            expect(validationResult.issues).toEqual(expect.arrayContaining([
                expect.stringMatching(/start.*time.*required/i),
            ]));
        });
    });
    describe('Lifecycle Events', () => {
        it('should emit lifecycle events for all transitions', async () => {
            const transitions = [
                { from: 'pending', to: 'ready' },
                { from: 'ready', to: 'in_progress' },
                { from: 'in_progress', to: 'completed' },
            ];
            for (let i = 0; i < transitions.length; i++) {
                const { to } = transitions[i];
                await lifecycle.transitionTo(mockTask, to);
                expect(mockEventHandlers.onStatusChange).toHaveBeenCalledTimes(i + 1);
            }
        });
        it('should emit validation events', async () => {
            await lifecycle.validateState(mockTask);
            expect(mockEventHandlers.onValidation).toHaveBeenCalledWith(mockTask, expect.objectContaining({
                isValid: expect.any(Boolean),
                issues: expect.any(Array),
            }));
        });
        it('should emit error events on failures', async () => {
            mockTask.status = 'in_progress';
            await lifecycle.transitionTo(mockTask, 'failed', 'Critical error occurred');
            expect(mockEventHandlers.onError).toHaveBeenCalledWith(mockTask, 'Critical error occurred');
        });
        it('should emit completion events', async () => {
            mockTask.status = 'in_progress';
            await lifecycle.transitionTo(mockTask, 'completed');
            expect(mockEventHandlers.onComplete).toHaveBeenCalledWith(mockTask);
        });
    });
    describe('Task Retry Mechanism', () => {
        it('should handle task retry within limits', async () => {
            mockTask.status = 'failed';
            mockTask.metadata.retryCount = 1;
            mockTask.maxRetries = 3;
            const result = await lifecycle.retryTask(mockTask);
            expect(result.success).toBe(true);
            expect(mockTask.status).toBe('ready'); // Reset for retry
            expect(mockTask.metadata.retryCount).toBe(2);
        });
        it('should prevent retry when limit exceeded', async () => {
            mockTask.status = 'failed';
            mockTask.metadata.retryCount = 3;
            mockTask.maxRetries = 3;
            const result = await lifecycle.retryTask(mockTask);
            expect(result.success).toBe(false);
            expect(result.error).toContain('retry limit');
            expect(mockTask.status).toBe('failed'); // Unchanged
        });
        it('should apply exponential backoff for retries', async () => {
            mockTask.status = 'failed';
            mockTask.metadata.retryCount = 2;
            mockTask.maxRetries = 5;
            const result = await lifecycle.retryTask(mockTask);
            expect(result.success).toBe(true);
            expect(result.retryDelay).toBeGreaterThan(0);
            expect(result.retryDelay).toBe(4000); // 2^2 * 1000ms base delay
        });
        it('should reset retry count on successful completion', async () => {
            mockTask.status = 'in_progress';
            mockTask.metadata.retryCount = 2;
            await lifecycle.transitionTo(mockTask, 'completed');
            expect(mockTask.metadata.retryCount).toBe(0);
        });
    });
    describe('Task Recovery', () => {
        it('should recover stalled tasks', async () => {
            mockTask.status = 'in_progress';
            mockTask.metadata.startTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
            mockTask.executionContext = { timeout: 60 * 60 * 1000 }; // 1 hour timeout
            const recovered = await lifecycle.recoverStalledTasks([mockTask]);
            expect(recovered).toHaveLength(1);
            expect(mockTask.status).toBe('failed');
            expect(mockEventHandlers.onError).toHaveBeenCalledWith(mockTask, expect.stringMatching(/timeout|stalled/i));
        });
        it('should not recover tasks within timeout window', async () => {
            mockTask.status = 'in_progress';
            mockTask.metadata.startTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
            mockTask.executionContext = { timeout: 60 * 60 * 1000 }; // 1 hour timeout
            const recovered = await lifecycle.recoverStalledTasks([mockTask]);
            expect(recovered).toHaveLength(0);
            expect(mockTask.status).toBe('in_progress'); // Unchanged
        });
        it('should recover tasks with missing start time', async () => {
            mockTask.status = 'in_progress';
            mockTask.metadata.startTime = undefined;
            mockTask.metadata.updatedAt = new Date(Date.now() - 2 * 60 * 60 * 1000);
            const recovered = await lifecycle.recoverStalledTasks([mockTask]);
            expect(recovered).toHaveLength(1);
            expect(mockTask.status).toBe('ready'); // Reset to ready
        });
    });
    describe('Task Metrics and History', () => {
        it('should calculate execution duration correctly', async () => {
            const startTime = new Date(Date.now() - 120000); // 2 minutes ago
            mockTask.status = 'in_progress';
            mockTask.metadata.startTime = startTime;
            await lifecycle.transitionTo(mockTask, 'completed');
            expect(mockTask.metadata.actualDuration).toBeGreaterThanOrEqual(120000);
            expect(mockTask.metadata.actualDuration).toBeLessThan(125000); // Allow small variance
        });
        it('should track task history and state changes', () => {
            const history = lifecycle.getTaskHistory(mockTask.id);
            expect(history).toEqual([]);
            lifecycle.transitionTo(mockTask, 'ready');
            const updatedHistory = lifecycle.getTaskHistory(mockTask.id);
            expect(updatedHistory).toHaveLength(1);
            expect(updatedHistory[0]).toEqual(expect.objectContaining({
                from: 'pending',
                to: 'ready',
                timestamp: expect.any(Date),
            }));
        });
        it('should provide task execution metrics', async () => {
            mockTask.status = 'in_progress';
            mockTask.metadata.startTime = new Date(Date.now() - 60000);
            await lifecycle.transitionTo(mockTask, 'completed');
            const metrics = lifecycle.getTaskMetrics(mockTask);
            expect(metrics).toEqual(expect.objectContaining({
                duration: expect.any(Number),
                retryCount: expect.any(Number),
                statusChanges: expect.any(Number),
                successRate: expect.any(Number),
            }));
        });
        it('should calculate success rate from task history', () => {
            // Simulate multiple task executions
            const taskId = mockTask.id;
            lifecycle.recordTaskResult(taskId, { success: true });
            lifecycle.recordTaskResult(taskId, { success: false });
            lifecycle.recordTaskResult(taskId, { success: true });
            const metrics = lifecycle.getTaskMetrics(mockTask);
            expect(metrics.successRate).toBe(2 / 3); // 2 successes out of 3 attempts
        });
    });
    describe('Batch Operations', () => {
        it('should transition multiple tasks in batch', async () => {
            const tasks = [
                createMockTask('task1'),
                createMockTask('task2'),
                createMockTask('task3'),
            ];
            const results = await lifecycle.batchTransition(tasks, 'ready');
            expect(results.successful).toHaveLength(3);
            expect(results.failed).toHaveLength(0);
            tasks.forEach((task) => {
                expect(task.status).toBe('ready');
            });
        });
        it('should handle partial batch failures', async () => {
            const tasks = [
                createMockTask('valid-task'),
                { ...createMockTask('invalid-task'), title: '' }, // Invalid
                createMockTask('another-valid-task'),
            ];
            const results = await lifecycle.batchTransition(tasks, 'ready');
            expect(results.successful).toHaveLength(2);
            expect(results.failed).toHaveLength(1);
            expect(results.failed[0].error).toContain('validation');
        });
        it('should validate multiple tasks in batch', async () => {
            const tasks = [
                createMockTask('task1'),
                { ...createMockTask('task2'), description: '' }, // Invalid
                createMockTask('task3'),
            ];
            const results = await lifecycle.batchValidation(tasks);
            expect(results.valid).toHaveLength(2);
            expect(results.invalid).toHaveLength(1);
            expect(results.invalid[0].issues.length).toBeGreaterThan(0);
        });
    });
    describe('State Persistence', () => {
        it('should create task snapshots', () => {
            const snapshot = lifecycle.createSnapshot(mockTask);
            expect(snapshot).toEqual(expect.objectContaining({
                id: mockTask.id,
                status: mockTask.status,
                title: mockTask.title,
                metadata: expect.objectContaining({
                    createdAt: mockTask.metadata.createdAt,
                    updatedAt: mockTask.metadata.updatedAt,
                }),
            }));
        });
        it('should restore tasks from snapshots', () => {
            const snapshot = lifecycle.createSnapshot(mockTask);
            snapshot.status = 'completed'; // Modify snapshot
            const restored = lifecycle.restoreFromSnapshot(snapshot);
            expect(restored.id).toBe(mockTask.id);
            expect(restored.status).toBe('completed');
            expect(restored.title).toBe(mockTask.title);
        });
        it('should track state change audit trail', async () => {
            await lifecycle.transitionTo(mockTask, 'ready');
            await lifecycle.transitionTo(mockTask, 'in_progress');
            await lifecycle.transitionTo(mockTask, 'completed');
            const auditTrail = lifecycle.getAuditTrail(mockTask.id);
            expect(auditTrail).toHaveLength(3);
            expect(auditTrail[0].from).toBe('pending');
            expect(auditTrail[0].to).toBe('ready');
            expect(auditTrail[2].to).toBe('completed');
        });
    });
    describe('Error Handling and Edge Cases', () => {
        it('should handle concurrent state transitions gracefully', async () => {
            const promises = [
                lifecycle.transitionTo(mockTask, 'ready'),
                lifecycle.transitionTo(mockTask, 'ready'),
                lifecycle.transitionTo(mockTask, 'ready'),
            ];
            const results = await Promise.all(promises);
            // Only one should succeed, others should be handled gracefully
            const successful = results.filter((r) => r.success);
            expect(successful).toHaveLength(1);
            expect(mockTask.status).toBe('ready');
        });
        it('should handle missing task data gracefully', async () => {
            const incompleteTask = {
                id: 'incomplete',
                status: 'pending',
                priority: 'medium',
                category: 'implementation',
                // Missing required fields
            };
            const result = await lifecycle.validateState(incompleteTask);
            expect(result.isValid).toBe(false);
            expect(result.issues.length).toBeGreaterThan(0);
        });
        it('should handle null/undefined task references', async () => {
            await expect(() => {
                lifecycle.transitionTo(null, 'ready');
            }).rejects.toThrow();
            await expect(() => {
                lifecycle.validateState(undefined);
            }).rejects.toThrow();
        });
        it('should handle invalid status values', async () => {
            const result = await lifecycle.transitionTo(mockTask, 'invalid-status');
            expect(result.success).toBe(false);
            expect(result.error).toContain('invalid status');
            expect(mockTask.status).toBe('pending'); // Unchanged
        });
        it('should cleanup resources on task cancellation', async () => {
            mockTask.status = 'in_progress';
            const cleanupSpy = vi.fn();
            lifecycle.onTaskCleanup(mockTask.id, cleanupSpy);
            await lifecycle.transitionTo(mockTask, 'cancelled');
            expect(cleanupSpy).toHaveBeenCalledWith(mockTask);
        });
    });
});
// Helper functions
function createMockTask(id) {
    return {
        id,
        title: `Task ${id}`,
        description: `Description for ${id}`,
        status: 'pending',
        priority: 'medium',
        category: 'implementation',
        metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'test',
            estimatedDuration: 60000,
            retryCount: 0,
            tags: ['test'],
        },
        executionContext: {
            timeout: 300000,
            maxRetries: 3,
        },
        maxRetries: 3,
    };
}
//# sourceMappingURL=TaskLifecycle.test.js.map