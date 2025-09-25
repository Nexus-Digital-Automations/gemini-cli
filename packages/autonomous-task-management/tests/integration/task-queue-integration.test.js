/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { vol } from 'memfs';
import { fsHelper } from '../helpers/fs-helper';
import { sampleFeatures, sampleTasks, sampleAgents } from '../fixtures/sample-features';
describe('Task Queue Integration Tests', () => {
    let mockAPI;
    const projectRoot = '/integration-test-project-1';
    beforeEach(async () => {
        // Reset file system
        vol.reset();
        fsHelper.createBasicProjectStructure(projectRoot);
        // Mock process environment
        process.cwd = vi.fn(() => projectRoot);
        // Create mock TaskManager API for integration tests
        mockAPI = {
            // Feature Management
            async suggestFeature(featureData) {
                const features = JSON.parse(fsHelper.readFile(`${projectRoot}/FEATURES.json`));
                const feature = {
                    id: `feature_${Date.now()}_${Math.random().toString(36).substring(2)}`,
                    ...featureData,
                    status: 'suggested',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    suggested_by: 'system'
                };
                features.features.push(feature);
                features.metadata.total_features = features.features.length;
                fsHelper.writeFile(`${projectRoot}/FEATURES.json`, JSON.stringify(features, null, 2));
                return { success: true, feature };
            },
            async approveFeature(featureId) {
                const features = JSON.parse(fsHelper.readFile(`${projectRoot}/FEATURES.json`));
                const feature = features.features.find((f) => f.id === featureId);
                if (!feature) {
                    return { success: false, error: 'Feature not found' };
                }
                feature.status = 'approved';
                feature.approved_by = 'integration-test';
                feature.approval_date = new Date().toISOString();
                fsHelper.writeFile(`${projectRoot}/FEATURES.json`, JSON.stringify(features, null, 2));
                return { success: true, feature };
            },
            // Task Management
            async createTaskFromFeature(featureId) {
                const features = JSON.parse(fsHelper.readFile(`${projectRoot}/FEATURES.json`));
                const feature = features.features.find((f) => f.id === featureId);
                if (!feature || feature.status !== 'approved') {
                    return { success: false, error: 'Feature not approved' };
                }
                const task = {
                    id: `task_${Date.now()}_${Math.random().toString(36).substring(2)}`,
                    feature_id: featureId,
                    title: `Implement: ${feature.title}`,
                    description: feature.description,
                    type: 'implementation',
                    priority: 'normal',
                    status: 'queued',
                    dependencies: [],
                    estimated_effort: 'medium',
                    required_capabilities: ['general'],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    created_by: 'autonomous_system'
                };
                if (!features.tasks) {
                    features.tasks = [];
                }
                features.tasks.push(task);
                fsHelper.writeFile(`${projectRoot}/FEATURES.json`, JSON.stringify(features, null, 2));
                return { success: true, task };
            },
            async getTaskQueue(filters = {}) {
                const features = JSON.parse(fsHelper.readFile(`${projectRoot}/FEATURES.json`));
                let tasks = features.tasks || [];
                // Apply filters
                if (filters.status) {
                    tasks = tasks.filter((task) => task.status === filters.status);
                }
                if (filters.priority) {
                    tasks = tasks.filter((task) => task.priority === filters.priority);
                }
                // Sort by priority
                const priorityOrder = { 'critical': 4, 'high': 3, 'normal': 2, 'low': 1 };
                tasks.sort((a, b) => {
                    return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
                });
                return {
                    success: true,
                    tasks,
                    total: tasks.length
                };
            },
            async assignTask(taskId, agentId) {
                const features = JSON.parse(fsHelper.readFile(`${projectRoot}/FEATURES.json`));
                const task = features.tasks?.find((t) => t.id === taskId);
                if (!task) {
                    return { success: false, error: 'Task not found' };
                }
                if (!features.agents) {
                    features.agents = {};
                }
                if (!features.agents[agentId]) {
                    return { success: false, error: 'Agent not found' };
                }
                task.assigned_to = agentId;
                task.status = 'assigned';
                task.assigned_at = new Date().toISOString();
                fsHelper.writeFile(`${projectRoot}/FEATURES.json`, JSON.stringify(features, null, 2));
                return { success: true, task };
            },
            async updateTaskProgress(taskId, progressUpdate) {
                const features = JSON.parse(fsHelper.readFile(`${projectRoot}/FEATURES.json`));
                const task = features.tasks?.find((t) => t.id === taskId);
                if (!task) {
                    return { success: false, error: 'Task not found' };
                }
                if (!task.progress_history) {
                    task.progress_history = [];
                }
                const progressEntry = {
                    timestamp: new Date().toISOString(),
                    status: progressUpdate.status || task.status,
                    progress_percentage: progressUpdate.progress_percentage || 0,
                    notes: progressUpdate.notes || '',
                    updated_by: progressUpdate.updated_by || 'integration-test'
                };
                task.progress_history.push(progressEntry);
                if (progressUpdate.status) {
                    task.status = progressUpdate.status;
                }
                if (progressUpdate.status === 'completed') {
                    task.completed_at = new Date().toISOString();
                    task.progress_percentage = 100;
                }
                fsHelper.writeFile(`${projectRoot}/FEATURES.json`, JSON.stringify(features, null, 2));
                return { success: true, task, progress_entry: progressEntry };
            },
            // Agent Management
            async initializeAgent(agentId) {
                const features = JSON.parse(fsHelper.readFile(`${projectRoot}/FEATURES.json`));
                if (!features.agents) {
                    features.agents = {};
                }
                const agent = {
                    lastHeartbeat: new Date().toISOString(),
                    status: 'active',
                    initialized: new Date().toISOString(),
                    sessionId: Math.random().toString(36).substring(2)
                };
                features.agents[agentId] = agent;
                fsHelper.writeFile(`${projectRoot}/FEATURES.json`, JSON.stringify(features, null, 2));
                return { success: true, agent: { id: agentId, ...agent } };
            },
            async registerAgentCapabilities(agentId, capabilities) {
                const features = JSON.parse(fsHelper.readFile(`${projectRoot}/FEATURES.json`));
                if (!features.agents?.[agentId]) {
                    return { success: false, error: 'Agent not found' };
                }
                features.agents[agentId].capabilities = capabilities;
                features.agents[agentId].capabilities_registered_at = new Date().toISOString();
                fsHelper.writeFile(`${projectRoot}/FEATURES.json`, JSON.stringify(features, null, 2));
                return { success: true, agent_id: agentId, capabilities };
            }
        };
    });
    afterEach(() => {
        vol.reset();
        vi.restoreAllMocks();
    });
    describe('End-to-End Task Flow', () => {
        it('should complete a full task lifecycle from feature to completion', async () => {
            // 1. Create a feature suggestion
            const featureData = {
                title: 'Integration Test Feature',
                description: 'A feature to test the complete task lifecycle integration',
                business_value: 'Validates the entire autonomous task management workflow',
                category: 'enhancement'
            };
            const featureResult = await mockAPI.suggestFeature(featureData);
            expect(featureResult.success).toBe(true);
            const featureId = featureResult.feature.id;
            // 2. Approve the feature
            const approvalResult = await mockAPI.approveFeature(featureId);
            expect(approvalResult.success).toBe(true);
            expect(approvalResult.feature.status).toBe('approved');
            // 3. Create task from approved feature
            const taskResult = await mockAPI.createTaskFromFeature(featureId);
            expect(taskResult.success).toBe(true);
            const taskId = taskResult.task.id;
            // 4. Initialize an agent
            const agentId = 'INTEGRATION_TEST_AGENT';
            const agentResult = await mockAPI.initializeAgent(agentId);
            expect(agentResult.success).toBe(true);
            // 5. Register agent capabilities
            const capabilitiesResult = await mockAPI.registerAgentCapabilities(agentId, ['general', 'testing']);
            expect(capabilitiesResult.success).toBe(true);
            // 6. Assign task to agent
            const assignmentResult = await mockAPI.assignTask(taskId, agentId);
            expect(assignmentResult.success).toBe(true);
            expect(assignmentResult.task.status).toBe('assigned');
            expect(assignmentResult.task.assigned_to).toBe(agentId);
            // 7. Update task progress - start work
            const startProgressResult = await mockAPI.updateTaskProgress(taskId, {
                status: 'in_progress',
                progress_percentage: 25,
                notes: 'Started implementation'
            });
            expect(startProgressResult.success).toBe(true);
            expect(startProgressResult.task.status).toBe('in_progress');
            // 8. Update task progress - complete work
            const completeProgressResult = await mockAPI.updateTaskProgress(taskId, {
                status: 'completed',
                progress_percentage: 100,
                notes: 'Implementation completed successfully'
            });
            expect(completeProgressResult.success).toBe(true);
            expect(completeProgressResult.task.status).toBe('completed');
            expect(completeProgressResult.task.completed_at).toBeDefined();
            // 9. Verify final state
            const queueResult = await mockAPI.getTaskQueue({ status: 'completed' });
            expect(queueResult.success).toBe(true);
            expect(queueResult.tasks).toHaveLength(1);
            expect(queueResult.tasks[0].id).toBe(taskId);
            expect(queueResult.tasks[0].progress_history).toHaveLength(2);
        });
        it('should handle multiple concurrent tasks with different priorities', async () => {
            // Create multiple features with different priorities
            const features = [
                {
                    title: 'Critical Security Fix',
                    description: 'Fix critical security vulnerability',
                    business_value: 'Prevents data breaches',
                    category: 'security',
                    priority: 'critical'
                },
                {
                    title: 'Performance Enhancement',
                    description: 'Optimize database queries',
                    business_value: 'Improves user experience',
                    category: 'performance',
                    priority: 'high'
                },
                {
                    title: 'UI Polish',
                    description: 'Polish user interface elements',
                    business_value: 'Better visual appeal',
                    category: 'enhancement',
                    priority: 'normal'
                }
            ];
            const taskIds = [];
            // Create and process all features
            for (const featureData of features) {
                const featureResult = await mockAPI.suggestFeature(featureData);
                expect(featureResult.success).toBe(true);
                const approvalResult = await mockAPI.approveFeature(featureResult.feature.id);
                expect(approvalResult.success).toBe(true);
                const taskResult = await mockAPI.createTaskFromFeature(featureResult.feature.id);
                expect(taskResult.success).toBe(true);
                taskIds.push(taskResult.task.id);
            }
            // Verify task queue ordering (should be priority-based)
            const queueResult = await mockAPI.getTaskQueue();
            expect(queueResult.success).toBe(true);
            expect(queueResult.tasks).toHaveLength(3);
            // Initialize multiple agents
            const agents = ['SECURITY_AGENT', 'PERFORMANCE_AGENT', 'UI_AGENT'];
            for (const agentId of agents) {
                await mockAPI.initializeAgent(agentId);
                await mockAPI.registerAgentCapabilities(agentId, ['general']);
            }
            // Assign tasks to agents
            for (let i = 0; i < taskIds.length; i++) {
                const assignResult = await mockAPI.assignTask(taskIds[i], agents[i]);
                expect(assignResult.success).toBe(true);
            }
            // Verify all tasks are assigned
            const assignedQueueResult = await mockAPI.getTaskQueue({ status: 'assigned' });
            expect(assignedQueueResult.success).toBe(true);
            expect(assignedQueueResult.tasks).toHaveLength(3);
        });
        it('should handle task dependencies correctly', async () => {
            // Create dependent features
            const parentFeature = {
                title: 'Database Migration',
                description: 'Migrate database schema',
                business_value: 'Supports new features',
                category: 'enhancement'
            };
            const childFeature = {
                title: 'Feature Using New Schema',
                description: 'Feature that depends on new database schema',
                business_value: 'Provides user functionality',
                category: 'new-feature'
            };
            // Create parent feature and task
            const parentFeatureResult = await mockAPI.suggestFeature(parentFeature);
            await mockAPI.approveFeature(parentFeatureResult.feature.id);
            const parentTaskResult = await mockAPI.createTaskFromFeature(parentFeatureResult.feature.id);
            // Create child feature and task
            const childFeatureResult = await mockAPI.suggestFeature(childFeature);
            await mockAPI.approveFeature(childFeatureResult.feature.id);
            const childTaskResult = await mockAPI.createTaskFromFeature(childFeatureResult.feature.id);
            // Simulate dependency by updating child task
            const features = JSON.parse(fsHelper.readFile(`${projectRoot}/FEATURES.json`));
            const childTask = features.tasks.find((t) => t.id === childTaskResult.task.id);
            childTask.dependencies = [parentTaskResult.task.id];
            fsHelper.writeFile(`${projectRoot}/FEATURES.json`, JSON.stringify(features, null, 2));
            // Initialize agent
            await mockAPI.initializeAgent('DEPENDENCY_AGENT');
            await mockAPI.registerAgentCapabilities('DEPENDENCY_AGENT', ['general']);
            // Should be able to assign parent task
            const parentAssignResult = await mockAPI.assignTask(parentTaskResult.task.id, 'DEPENDENCY_AGENT');
            expect(parentAssignResult.success).toBe(true);
            // Complete parent task
            await mockAPI.updateTaskProgress(parentTaskResult.task.id, {
                status: 'completed',
                progress_percentage: 100
            });
            // Now should be able to work on child task
            const childAssignResult = await mockAPI.assignTask(childTaskResult.task.id, 'DEPENDENCY_AGENT');
            expect(childAssignResult.success).toBe(true);
            // Verify task dependency handling
            const completedTasks = await mockAPI.getTaskQueue({ status: 'completed' });
            expect(completedTasks.tasks).toHaveLength(1);
            const assignedTasks = await mockAPI.getTaskQueue({ status: 'assigned' });
            expect(assignedTasks.tasks).toHaveLength(1);
        });
    });
    describe('Error Handling and Recovery', () => {
        it('should handle task assignment failures gracefully', async () => {
            // Create feature and task
            const featureData = {
                title: 'Error Handling Test',
                description: 'Test error handling in task assignment',
                business_value: 'Validates error recovery',
                category: 'enhancement'
            };
            const featureResult = await mockAPI.suggestFeature(featureData);
            await mockAPI.approveFeature(featureResult.feature.id);
            const taskResult = await mockAPI.createTaskFromFeature(featureResult.feature.id);
            // Try to assign to non-existent agent
            const assignResult = await mockAPI.assignTask(taskResult.task.id, 'NON_EXISTENT_AGENT');
            expect(assignResult.success).toBe(false);
            expect(assignResult.error).toContain('Agent not found');
            // Task should remain in queued state
            const queueResult = await mockAPI.getTaskQueue({ status: 'queued' });
            expect(queueResult.tasks).toHaveLength(1);
            expect(queueResult.tasks[0].id).toBe(taskResult.task.id);
        });
        it('should handle concurrent task updates safely', async () => {
            // Create feature and task
            const featureData = {
                title: 'Concurrency Test',
                description: 'Test concurrent task updates',
                business_value: 'Validates concurrency handling',
                category: 'enhancement'
            };
            const featureResult = await mockAPI.suggestFeature(featureData);
            await mockAPI.approveFeature(featureResult.feature.id);
            const taskResult = await mockAPI.createTaskFromFeature(featureResult.feature.id);
            await mockAPI.initializeAgent('CONCURRENT_AGENT');
            await mockAPI.registerAgentCapabilities('CONCURRENT_AGENT', ['general']);
            await mockAPI.assignTask(taskResult.task.id, 'CONCURRENT_AGENT');
            // Simulate concurrent progress updates
            const updatePromises = [
                mockAPI.updateTaskProgress(taskResult.task.id, {
                    progress_percentage: 25,
                    notes: 'Update 1'
                }),
                mockAPI.updateTaskProgress(taskResult.task.id, {
                    progress_percentage: 50,
                    notes: 'Update 2'
                }),
                mockAPI.updateTaskProgress(taskResult.task.id, {
                    progress_percentage: 75,
                    notes: 'Update 3'
                })
            ];
            const results = await Promise.all(updatePromises);
            // All updates should succeed
            results.forEach(result => {
                expect(result.success).toBe(true);
            });
            // Verify final task state
            const queueResult = await mockAPI.getTaskQueue();
            const updatedTask = queueResult.tasks.find((t) => t.id === taskResult.task.id);
            expect(updatedTask.progress_history).toHaveLength(3);
        });
    });
    describe('Performance and Scalability', () => {
        it('should handle large task queues efficiently', async () => {
            const startTime = Date.now();
            // Create a large number of features and tasks
            const taskPromises = [];
            for (let i = 0; i < 50; i++) {
                const featureData = {
                    title: `Performance Test Feature ${i}`,
                    description: `Description for feature ${i}`,
                    business_value: `Business value for feature ${i}`,
                    category: 'enhancement'
                };
                taskPromises.push(mockAPI.suggestFeature(featureData)
                    .then((result) => mockAPI.approveFeature(result.feature.id))
                    .then((result) => mockAPI.createTaskFromFeature(result.feature.id)));
            }
            await Promise.all(taskPromises);
            const queueResult = await mockAPI.getTaskQueue();
            const endTime = Date.now();
            expect(queueResult.success).toBe(true);
            expect(queueResult.tasks).toHaveLength(50);
            // Performance assertion: should complete within reasonable time
            const executionTime = endTime - startTime;
            expect(executionTime).toBeLessThan(5000); // Less than 5 seconds
        });
        it('should maintain data integrity under stress', async () => {
            // Create baseline data
            const featureData = {
                title: 'Stress Test Feature',
                description: 'Feature for stress testing data integrity',
                business_value: 'Validates system stability',
                category: 'enhancement'
            };
            const featureResult = await mockAPI.suggestFeature(featureData);
            await mockAPI.approveFeature(featureResult.feature.id);
            const taskResult = await mockAPI.createTaskFromFeature(featureResult.feature.id);
            // Perform many concurrent operations
            const operations = [];
            for (let i = 0; i < 20; i++) {
                operations.push(mockAPI.initializeAgent(`STRESS_AGENT_${i}`), mockAPI.registerAgentCapabilities(`STRESS_AGENT_${i}`, ['general']));
            }
            await Promise.all(operations);
            // Verify data integrity
            const queueResult = await mockAPI.getTaskQueue();
            expect(queueResult.success).toBe(true);
            expect(queueResult.tasks).toHaveLength(1);
            const features = JSON.parse(fsHelper.readFile(`${projectRoot}/FEATURES.json`));
            expect(Object.keys(features.agents)).toHaveLength(20);
            expect(features.features).toHaveLength(1);
            expect(features.tasks).toHaveLength(1);
        });
    });
});
//# sourceMappingURL=task-queue-integration.test.js.map