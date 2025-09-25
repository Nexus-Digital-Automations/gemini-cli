/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InfiniteHookIntegration } from '../InfiniteHookIntegration.js';
import { TaskExecutionEngine } from '../TaskExecutionEngine.complete.js';
import { ExecutionMonitoringSystem } from '../ExecutionMonitoringSystem.js';
/**
 * @fileoverview Comprehensive test suite for InfiniteHookIntegration
 *
 * Tests integration with infinite-continue-stop-hook system, automatic
 * task creation from FEATURES.json, progress reporting, and stop authorization.
 */
// Mock configuration
const mockConfig = {
    storage: {
        getProjectTempDir: vi.fn(() => '/tmp/test-project'),
        ensureProjectTempDir: vi.fn(() => Promise.resolve()),
        writeFile: vi.fn(() => Promise.resolve()),
        readFile: vi.fn(() => Promise.resolve('{"features": []}')),
        fileExists: vi.fn(() => Promise.resolve(true))
    },
    getSessionId: vi.fn(() => 'test-session')
};
// Mock HTTP fetch for TaskManager API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;
describe('InfiniteHookIntegration', () => {
    let integration;
    let taskEngine;
    let monitoring;
    beforeEach(() => {
        vi.clearAllMocks();
        // Create mock task engine
        taskEngine = {
            queueTask: vi.fn(() => Promise.resolve('task-123')),
            getAllTasks: vi.fn(() => []),
            getExecutionStats: vi.fn(() => ({
                total: 0,
                completed: 0,
                failed: 0,
                inProgress: 0,
                successRate: 0
            }))
        };
        // Create mock monitoring system
        monitoring = {
            collectMetrics: vi.fn(() => Promise.resolve({})),
            recordEvent: vi.fn()
        };
        integration = new InfiniteHookIntegration(mockConfig, taskEngine, monitoring, {
            agentId: 'test-agent',
            capabilities: ['frontend', 'backend', 'testing'],
            maxConcurrentTasks: 3
        });
    });
    afterEach(async () => {
        await integration.shutdown();
    });
    describe('Initialization', () => {
        it('should initialize successfully with valid configuration', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ status: 'success', agentId: 'test-agent' })
            });
            await integration.initialize();
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/register-agent'), expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: expect.stringContaining('"agentId":"test-agent"')
            }));
        });
        it('should handle initialization failure gracefully', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));
            await expect(integration.initialize()).rejects.toThrow('Network error');
        });
    });
    describe('FEATURES.json Monitoring', () => {
        it('should create tasks from approved features', async () => {
            const mockFeatures = {
                features: [
                    {
                        id: 'feature-1',
                        title: 'User Authentication',
                        description: 'Implement secure login system',
                        status: 'approved',
                        category: 'new-feature',
                        business_value: 'Essential for security'
                    },
                    {
                        id: 'feature-2',
                        title: 'Dashboard UI',
                        description: 'Create user dashboard interface',
                        status: 'suggested',
                        category: 'enhancement'
                    }
                ]
            };
            mockConfig.storage.readFile.mockResolvedValueOnce(JSON.stringify(mockFeatures));
            await integration.checkAndCreateTasksFromFeatures();
            // Should only create task for approved feature
            expect(taskEngine.queueTask).toHaveBeenCalledTimes(1);
            expect(taskEngine.queueTask).toHaveBeenCalledWith('Implement: User Authentication', 'Implement secure login system', expect.objectContaining({
                type: 'implementation',
                priority: 'high',
                context: {
                    featureId: 'feature-1',
                    category: 'new-feature'
                }
            }));
        });
        it('should handle missing FEATURES.json gracefully', async () => {
            mockConfig.storage.fileExists.mockResolvedValueOnce(false);
            await integration.checkAndCreateTasksFromFeatures();
            expect(taskEngine.queueTask).not.toHaveBeenCalled();
        });
        it('should handle malformed FEATURES.json gracefully', async () => {
            mockConfig.storage.readFile.mockResolvedValueOnce('invalid json');
            await integration.checkAndCreateTasksFromFeatures();
            expect(taskEngine.queueTask).not.toHaveBeenCalled();
        });
    });
    describe('Progress Reporting', () => {
        it('should report progress to task manager API', async () => {
            const mockTasks = [
                { id: 'task-1', status: 'completed', progress: 100 },
                { id: 'task-2', status: 'in_progress', progress: 50 },
                { id: 'task-3', status: 'queued', progress: 0 }
            ];
            taskEngine.getAllTasks.mockReturnValueOnce(mockTasks);
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ status: 'success' })
            });
            await integration.reportProgress();
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/report-progress'), expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: expect.stringContaining('"totalTasks":3')
            }));
        });
        it('should handle progress reporting failure gracefully', async () => {
            taskEngine.getAllTasks.mockReturnValueOnce([]);
            mockFetch.mockRejectedValueOnce(new Error('API error'));
            // Should not throw
            await expect(integration.reportProgress()).resolves.not.toThrow();
        });
    });
    describe('Stop Authorization', () => {
        it('should authorize stop when all tasks are complete', async () => {
            const completedTasks = [
                { id: 'task-1', status: 'completed', progress: 100 },
                { id: 'task-2', status: 'completed', progress: 100 }
            ];
            taskEngine.getAllTasks.mockReturnValueOnce(completedTasks);
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ status: 'success' })
            });
            await integration.checkAndAuthorizeStop();
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/authorize-stop'), expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: expect.stringContaining('"reason":"All tasks completed successfully"')
            }));
        });
        it('should not authorize stop when tasks are pending', async () => {
            const mixedTasks = [
                { id: 'task-1', status: 'completed', progress: 100 },
                { id: 'task-2', status: 'in_progress', progress: 50 }
            ];
            taskEngine.getAllTasks.mockReturnValueOnce(mixedTasks);
            await integration.checkAndAuthorizeStop();
            expect(mockFetch).not.toHaveBeenCalledWith(expect.stringContaining('/authorize-stop'), expect.any(Object));
        });
        it('should handle stop authorization failure gracefully', async () => {
            const completedTasks = [
                { id: 'task-1', status: 'completed', progress: 100 }
            ];
            taskEngine.getAllTasks.mockReturnValueOnce(completedTasks);
            mockFetch.mockRejectedValueOnce(new Error('Authorization failed'));
            // Should not throw
            await expect(integration.checkAndAuthorizeStop()).resolves.not.toThrow();
        });
    });
    describe('Feature Category Mapping', () => {
        it('should map feature categories to task types correctly', async () => {
            const testCases = [
                { category: 'new-feature', expectedType: 'implementation' },
                { category: 'enhancement', expectedType: 'implementation' },
                { category: 'bug-fix', expectedType: 'implementation' },
                { category: 'testing', expectedType: 'testing' },
                { category: 'documentation', expectedType: 'documentation' },
                { category: 'security', expectedType: 'security' },
                { category: 'performance', expectedType: 'performance' },
                { category: 'unknown-category', expectedType: 'implementation' } // Default
            ];
            for (const testCase of testCases) {
                const mockFeatures = {
                    features: [
                        {
                            id: `feature-${testCase.category}`,
                            title: 'Test Feature',
                            description: 'Test description',
                            status: 'approved',
                            category: testCase.category
                        }
                    ]
                };
                mockConfig.storage.readFile.mockResolvedValueOnce(JSON.stringify(mockFeatures));
                await integration.checkAndCreateTasksFromFeatures();
                expect(taskEngine.queueTask).toHaveBeenCalledWith(expect.any(String), expect.any(String), expect.objectContaining({
                    type: testCase.expectedType
                }));
                vi.clearAllMocks();
            }
        });
    });
    describe('Error Handling', () => {
        it('should handle network errors gracefully', async () => {
            mockFetch.mockRejectedValue(new Error('Network error'));
            // These should not throw
            await expect(integration.reportProgress()).resolves.not.toThrow();
            await expect(integration.checkAndAuthorizeStop()).resolves.not.toThrow();
        });
        it('should handle API response errors gracefully', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            });
            await expect(integration.reportProgress()).resolves.not.toThrow();
            await expect(integration.checkAndAuthorizeStop()).resolves.not.toThrow();
        });
    });
});
//# sourceMappingURL=InfiniteHookIntegration.test.js.map