/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fse from 'fs-extra';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PersistenceStorageAPI } from '../PersistenceStorageAPI.js';
// Mock fs-extra for testing
vi.mock('fs-extra');
const mockFse = vi.mocked(fse);
// Mock logger
vi.mock('../utils/logger.js', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    },
}));
describe('PersistenceStorageAPI', () => {
    let storageAPI;
    let testDir;
    let mockTask;
    beforeEach(async () => {
        // Create a temporary directory for testing
        testDir = join(tmpdir(), `persistence-test-${Date.now()}`);
        // Reset all mocks
        vi.clearAllMocks();
        // Mock fs-extra methods
        mockFse.ensureDir = vi.fn().mockResolvedValue(undefined);
        mockFse.pathExists = vi.fn().mockResolvedValue(false);
        mockFse.writeJSON = vi.fn().mockResolvedValue(undefined);
        mockFse.readJSON = vi.fn().mockResolvedValue({});
        mockFse.copy = vi.fn().mockResolvedValue(undefined);
        mockFse.move = vi.fn().mockResolvedValue(undefined);
        mockFse.remove = vi.fn().mockResolvedValue(undefined);
        mockFse.readdir = vi.fn().mockResolvedValue([]);
        // Create test task
        mockTask = {
            id: 'test-task-id',
            contextId: 'test-context-id',
            kind: 'task',
            status: {
                state: 'submitted',
                timestamp: new Date().toISOString(),
            },
            metadata: {
                __persistedState: {
                    _taskState: 'submitted',
                    _agentSettings: {
                        kind: 'agent-settings',
                        workspacePath: '/tmp/workspace',
                    },
                },
            },
            history: [],
            artifacts: [],
        };
        // Initialize storage API
        storageAPI = new PersistenceStorageAPI({
            baseDir: testDir,
            enableSessionManagement: true,
            enableConflictResolution: true,
            enableDataIntegrity: true,
        });
    });
    afterEach(async () => {
        await storageAPI.shutdown();
    });
    describe('Task Storage Operations', () => {
        test('should save task successfully', async () => {
            mockFse.pathExists.mockResolvedValue(false);
            await storageAPI.save(mockTask);
            expect(mockFse.ensureDir).toHaveBeenCalled();
            expect(mockFse.writeJSON).toHaveBeenCalled();
        });
        test('should load task successfully', async () => {
            const taskMetadata = {
                ...mockTask.metadata,
                _sessionMetadata: {
                    sessionId: 'test-session',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    ownerId: 'test-user',
                    isComplete: false,
                    version: '1.0.0',
                    properties: {},
                },
            };
            mockFse.pathExists.mockResolvedValue(true);
            mockFse.readJSON.mockResolvedValue(taskMetadata);
            const loadedTask = await storageAPI.load('test-task-id');
            expect(loadedTask).toBeDefined();
            expect(loadedTask?.id).toBe('test-task-id');
            expect(mockFse.readJSON).toHaveBeenCalled();
        });
        test('should return undefined for non-existent task', async () => {
            mockFse.pathExists.mockResolvedValue(false);
            const loadedTask = await storageAPI.load('non-existent-task');
            expect(loadedTask).toBeUndefined();
        });
        test('should handle save errors gracefully', async () => {
            mockFse.writeJSON.mockRejectedValue(new Error('Write failed'));
            await expect(storageAPI.save(mockTask)).rejects.toThrow('Write failed');
        });
        test('should handle load errors gracefully', async () => {
            mockFse.pathExists.mockResolvedValue(true);
            mockFse.readJSON.mockRejectedValue(new Error('Read failed'));
            await expect(storageAPI.load('test-task-id')).rejects.toThrow('Read failed');
        });
    });
    describe('Task Completion', () => {
        test('should complete task successfully', async () => {
            const result = await storageAPI.completeTask('test-task-id', 'Task completed successfully', { finalState: 'success' });
            expect(result.success).toBe(true);
            expect(result.metadata.operation).toBe('complete');
            expect(result.metadata.timestamp).toBeDefined();
        });
        test('should handle completion errors', async () => {
            // Mock session manager to throw error
            const result = await storageAPI.completeTask('non-existent-task', 'Task completion failed');
            // Should return error result instead of throwing
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });
    describe('Task Transfer', () => {
        test('should transfer task ownership', async () => {
            const result = await storageAPI.transferTask('test-task-id', 'target-session-id', 'Manual transfer');
            expect(result.metadata.operation).toBe('transfer');
        });
        test('should handle transfer errors when session management disabled', async () => {
            // Create storage API without session management
            const storageWithoutSessions = new PersistenceStorageAPI({
                baseDir: testDir,
                enableSessionManagement: false,
            });
            const result = await storageWithoutSessions.transferTask('test-task-id', 'target-session-id');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Session management is not enabled');
            await storageWithoutSessions.shutdown();
        });
    });
    describe('Conflict Resolution', () => {
        test('should resolve task conflicts', async () => {
            const result = await storageAPI.resolveTaskConflicts('test-task-id');
            expect(result.metadata.operation).toBe('resolve_conflicts');
        });
        test('should handle conflict resolution errors when disabled', async () => {
            const storageWithoutConflicts = new PersistenceStorageAPI({
                baseDir: testDir,
                enableConflictResolution: false,
            });
            const result = await storageWithoutConflicts.resolveTaskConflicts('test-task-id');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Conflict resolution');
            await storageWithoutConflicts.shutdown();
        });
    });
    describe('Data Recovery', () => {
        test('should recover task from backup', async () => {
            const result = await storageAPI.recoverTask('test-task-id');
            expect(result.metadata.operation).toBe('recover');
        });
        test('should handle recovery errors when data integrity disabled', async () => {
            const storageWithoutIntegrity = new PersistenceStorageAPI({
                baseDir: testDir,
                enableDataIntegrity: false,
            });
            const result = await storageWithoutIntegrity.recoverTask('test-task-id');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Data integrity management is not enabled');
            await storageWithoutIntegrity.shutdown();
        });
    });
    describe('Storage Statistics', () => {
        test('should return storage statistics', async () => {
            const stats = await storageAPI.getStorageStatistics();
            expect(stats).toBeDefined();
            expect(stats.healthStatus).toBeDefined();
            expect(stats.tasks).toBeDefined();
            expect(stats.sessions).toBeDefined();
            expect(stats.conflicts).toBeDefined();
            expect(stats.integrity).toBeDefined();
            expect(stats.storage).toBeDefined();
            expect(stats.performance).toBeDefined();
        });
        test('should calculate health status correctly', async () => {
            const stats = await storageAPI.getStorageStatistics();
            expect(['healthy', 'warning', 'critical']).toContain(stats.healthStatus);
        });
    });
    describe('Maintenance Operations', () => {
        test('should perform comprehensive maintenance', async () => {
            const result = await storageAPI.performMaintenance();
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data?.cleanupResults).toBeDefined();
            expect(result.metadata.operation).toBe('maintenance');
        });
        test('should handle maintenance errors gracefully', async () => {
            // Mock cleanup to fail
            const storageWithFailingCleanup = new PersistenceStorageAPI({
                baseDir: '/invalid/path/that/should/fail',
            });
            const result = await storageWithFailingCleanup.performMaintenance();
            // Should handle errors gracefully
            expect(result.metadata.operation).toBe('maintenance');
            await storageWithFailingCleanup.shutdown();
        });
    });
    describe('Session Management', () => {
        test('should get active sessions', async () => {
            const sessions = await storageAPI.getActiveSessions();
            expect(Array.isArray(sessions)).toBe(true);
        });
        test('should return empty array when session management disabled', async () => {
            const storageWithoutSessions = new PersistenceStorageAPI({
                baseDir: testDir,
                enableSessionManagement: false,
            });
            const sessions = await storageWithoutSessions.getActiveSessions();
            expect(sessions).toEqual([]);
            await storageWithoutSessions.shutdown();
        });
    });
    describe('Backup Management', () => {
        test('should get task backups', () => {
            const backups = storageAPI.getTaskBackups('test-task-id');
            expect(Array.isArray(backups)).toBe(true);
        });
        test('should return empty array when data integrity disabled', () => {
            const storageWithoutIntegrity = new PersistenceStorageAPI({
                baseDir: testDir,
                enableDataIntegrity: false,
            });
            const backups = storageWithoutIntegrity.getTaskBackups('test-task-id');
            expect(backups).toEqual([]);
        });
    });
    describe('Task Correlations', () => {
        test('should get session tasks', async () => {
            const tasks = await storageAPI.getSessionTasks();
            expect(Array.isArray(tasks)).toBe(true);
        });
        test('should return empty array when session management disabled', async () => {
            const storageWithoutSessions = new PersistenceStorageAPI({
                baseDir: testDir,
                enableSessionManagement: false,
            });
            const tasks = await storageWithoutSessions.getSessionTasks();
            expect(tasks).toEqual([]);
            await storageWithoutSessions.shutdown();
        });
    });
    describe('Configuration', () => {
        test('should initialize with default configuration', () => {
            const defaultStorage = new PersistenceStorageAPI();
            expect(defaultStorage).toBeDefined();
        });
        test('should initialize with custom configuration', () => {
            const customStorage = new PersistenceStorageAPI({
                baseDir: '/custom/path',
                enableSessionManagement: false,
                enableConflictResolution: false,
                enableDataIntegrity: false,
                ownerId: 'custom-user',
                performance: {
                    enableCaching: false,
                    cacheSize: 50,
                },
                monitoring: {
                    enableMetrics: false,
                },
            });
            expect(customStorage).toBeDefined();
        });
    });
    describe('Error Handling', () => {
        test('should handle filesystem errors during initialization', async () => {
            mockFse.ensureDir.mockRejectedValue(new Error('Permission denied'));
            await expect(() => new PersistenceStorageAPI({ baseDir: '/invalid/path' })).not.toThrow(); // Should not throw during construction
        });
        test('should handle invalid task data', async () => {
            const invalidTask = {
                ...mockTask,
                metadata: {}, // Missing required persisted state
            };
            await expect(storageAPI.save(invalidTask)).rejects.toThrow();
        });
        test('should handle corrupted metadata during load', async () => {
            mockFse.pathExists.mockResolvedValue(true);
            mockFse.readJSON.mockResolvedValue({
                invalid: 'data',
            });
            await expect(storageAPI.load('test-task-id')).rejects.toThrow();
        });
    });
    describe('Performance', () => {
        test('should handle multiple concurrent operations', async () => {
            const operations = Array.from({ length: 10 }, (_, i) => storageAPI.save({
                ...mockTask,
                id: `task-${i}`,
            }));
            // Should not throw errors
            await Promise.allSettled(operations);
            const results = await Promise.allSettled(operations);
            const successful = results.filter((r) => r.status === 'fulfilled').length;
            expect(successful).toBeGreaterThan(0);
        });
        test('should handle large task data efficiently', async () => {
            const largeTask = {
                ...mockTask,
                metadata: {
                    ...mockTask.metadata,
                    largeData: 'x'.repeat(100000), // 100KB of data
                },
            };
            const startTime = Date.now();
            await storageAPI.save(largeTask);
            const saveTime = Date.now() - startTime;
            // Should complete within reasonable time (< 5 seconds)
            expect(saveTime).toBeLessThan(5000);
        });
    });
    describe('Integration', () => {
        test('should maintain data consistency across save/load cycle', async () => {
            mockFse.pathExists.mockResolvedValueOnce(false); // For save
            mockFse.pathExists.mockResolvedValueOnce(true); // For load
            // Set up mock return value for load
            const expectedMetadata = {
                ...mockTask.metadata,
                _sessionMetadata: {
                    sessionId: 'test-session',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    ownerId: 'test-user',
                    isComplete: false,
                    version: '1.0.0',
                    properties: {},
                },
            };
            mockFse.readJSON.mockResolvedValue(expectedMetadata);
            // Save task
            await storageAPI.save(mockTask);
            // Load task
            const loadedTask = await storageAPI.load(mockTask.id);
            expect(loadedTask?.id).toBe(mockTask.id);
            expect(loadedTask?.contextId).toBe(mockTask.contextId);
        });
        test('should handle complete workflow: save -> transfer -> complete', async () => {
            // Save task
            await storageAPI.save(mockTask);
            // Transfer task
            await storageAPI.transferTask(mockTask.id, 'target-session', 'Test transfer');
            // Complete task
            const completeResult = await storageAPI.completeTask(mockTask.id, 'Task completed in test');
            expect(completeResult.success).toBe(true);
        });
    });
    describe('Resource Management', () => {
        test('should properly clean up resources on shutdown', async () => {
            await storageAPI.shutdown();
            // Verify shutdown was called (would normally check if resources are freed)
            // This is more of a smoke test to ensure shutdown doesn't throw
            expect(true).toBe(true);
        });
        test('should handle shutdown gracefully even with active operations', async () => {
            // Start an operation
            const savePromise = storageAPI.save(mockTask);
            // Shutdown immediately
            const shutdownPromise = storageAPI.shutdown();
            // Both should complete without throwing
            await Promise.allSettled([savePromise, shutdownPromise]);
            expect(true).toBe(true);
        });
    });
});
//# sourceMappingURL=PersistenceStorageAPI.test.js.map