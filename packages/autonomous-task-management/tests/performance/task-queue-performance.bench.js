/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { bench, describe } from 'vitest';
import { vol } from 'memfs';
import { fsHelper } from '../helpers/fs-helper';
import { mockProcess } from '../helpers/process-mock';
import { testEnvironment, MockTaskManagerAPI, TestUtils, PerformanceTestUtils } from '../index';
/**
 * Performance Benchmarks for Task Queue Management
 *
 * This file contains Vitest benchmarks for measuring and monitoring
 * the performance characteristics of the task queue system over time.
 * These benchmarks help detect performance regressions and establish
 * performance baselines.
 */
describe('Task Queue Performance Benchmarks', () => {
    let mockApi;
    let logger;
    beforeEach(async () => {
        await testEnvironment.setup();
        mockApi = testEnvironment.getMockAPI();
        logger = testEnvironment.getLogger();
        fsHelper.createBasicProjectStructure('/benchmark-project');
        mockProcess.mockEnv({
            NODE_ENV: 'benchmark',
            GEMINI_CLI_BENCHMARK_TEST: 'true'
        });
    });
    afterEach(async () => {
        await testEnvironment.teardown();
        vol.reset();
        mockProcess.restore();
    });
    describe('Task Creation Benchmarks', () => {
        bench('single task creation', async () => {
            await mockApi.createTask({
                title: 'Benchmark Task',
                description: 'Single task creation benchmark',
                type: 'benchmark',
                priority: 'medium'
            });
        });
        bench('batch task creation - 10 tasks', async () => {
            const taskBatch = [];
            for (let i = 0; i < 10; i++) {
                taskBatch.push(mockApi.createTask({
                    title: `Batch Task ${i}`,
                    description: `Batch creation benchmark task ${i}`,
                    type: 'benchmark',
                    priority: 'medium'
                }));
            }
            await Promise.all(taskBatch);
        });
        bench('batch task creation - 50 tasks', async () => {
            const taskBatch = [];
            for (let i = 0; i < 50; i++) {
                taskBatch.push(mockApi.createTask({
                    title: `Batch Task ${i}`,
                    description: `Batch creation benchmark task ${i}`,
                    type: 'benchmark',
                    priority: 'medium'
                }));
            }
            await Promise.all(taskBatch);
        });
        bench('batch task creation - 100 tasks', async () => {
            const taskBatch = [];
            for (let i = 0; i < 100; i++) {
                taskBatch.push(mockApi.createTask({
                    title: `Batch Task ${i}`,
                    description: `Batch creation benchmark task ${i}`,
                    type: 'benchmark',
                    priority: 'medium'
                }));
            }
            await Promise.all(taskBatch);
        });
        bench('complex task creation with large payload', async () => {
            await mockApi.createTask({
                title: 'Complex Benchmark Task',
                description: 'Complex task with large payload for benchmarking',
                type: 'benchmark',
                priority: 'high',
                metadata: {
                    complexity: 'high',
                    estimatedHours: 8,
                    skills: ['frontend', 'backend', 'database', 'devops'],
                    dependencies: ['task1', 'task2', 'task3'],
                    acceptanceCriteria: new Array(20).fill(0).map((_, i) => `Criteria ${i + 1}`),
                    additionalData: new Array(100).fill(0).map((_, i) => ({
                        id: i,
                        value: `benchmark-data-${i}`,
                        timestamp: new Date().toISOString(),
                        metadata: { index: i, type: 'benchmark' }
                    }))
                }
            });
        });
    });
    describe('Task Status Update Benchmarks', () => {
        let testTaskIds = [];
        beforeEach(async () => {
            // Create test tasks for status update benchmarks
            const taskPromises = [];
            for (let i = 0; i < 50; i++) {
                taskPromises.push(mockApi.createTask({
                    title: `Status Update Test Task ${i}`,
                    description: `Task for status update benchmarking`,
                    type: 'benchmark'
                }));
            }
            const results = await Promise.all(taskPromises);
            testTaskIds = results.map(r => r.taskId);
        });
        bench('single task status update', async () => {
            const taskId = testTaskIds[Math.floor(Math.random() * testTaskIds.length)];
            await mockApi.updateTaskStatus(taskId, 'in_progress');
        });
        bench('batch task status updates - 10 tasks', async () => {
            const updateBatch = [];
            for (let i = 0; i < 10; i++) {
                const taskId = testTaskIds[i % testTaskIds.length];
                updateBatch.push(mockApi.updateTaskStatus(taskId, 'in_progress'));
            }
            await Promise.all(updateBatch);
        });
        bench('task status workflow - pending to completed', async () => {
            const taskId = testTaskIds[Math.floor(Math.random() * testTaskIds.length)];
            await mockApi.updateTaskStatus(taskId, 'in_progress');
            await mockApi.updateTaskStatus(taskId, 'completed');
        });
    });
    describe('Task Query Benchmarks', () => {
        beforeEach(async () => {
            // Create a large dataset for query benchmarks
            const taskPromises = [];
            for (let i = 0; i < 500; i++) {
                taskPromises.push(mockApi.createTask({
                    title: `Query Test Task ${i}`,
                    description: `Task ${i} for query benchmarking`,
                    type: ['frontend', 'backend', 'database', 'testing'][i % 4],
                    priority: ['high', 'medium', 'low'][i % 3],
                    status: ['pending', 'in_progress', 'completed'][i % 3]
                }));
            }
            await Promise.all(taskPromises);
        });
        bench('list all tasks', async () => {
            await mockApi.listTasks();
        });
        bench('get single task by ID', async () => {
            const allTasks = await mockApi.listTasks();
            const randomTask = allTasks[Math.floor(Math.random() * allTasks.length)];
            await mockApi.getTask(randomTask.id);
        });
        bench('filter tasks by status', async () => {
            const allTasks = await mockApi.listTasks();
            const completedTasks = allTasks.filter(task => task.status === 'completed');
            return completedTasks.length;
        });
        bench('filter tasks by type and priority', async () => {
            const allTasks = await mockApi.listTasks();
            const filteredTasks = allTasks.filter(task => task.type === 'frontend' && task.priority === 'high');
            return filteredTasks.length;
        });
    });
    describe('Agent Management Benchmarks', () => {
        bench('single agent registration', async () => {
            await mockApi.registerAgent({
                type: 'benchmark_agent',
                capabilities: ['general'],
                status: 'available',
                maxConcurrentTasks: 5
            });
        });
        bench('batch agent registration - 10 agents', async () => {
            const agentBatch = [];
            for (let i = 0; i < 10; i++) {
                agentBatch.push(mockApi.registerAgent({
                    type: `benchmark_agent_${i}`,
                    capabilities: ['general', 'specialized'],
                    status: 'available',
                    maxConcurrentTasks: 3
                }));
            }
            await Promise.all(agentBatch);
        });
        bench('complex agent registration with full capabilities', async () => {
            await mockApi.registerAgent({
                type: 'complex_benchmark_agent',
                capabilities: [
                    'frontend',
                    'backend',
                    'database',
                    'devops',
                    'testing',
                    'security',
                    'performance',
                    'documentation'
                ],
                status: 'available',
                maxConcurrentTasks: 10,
                specializations: {
                    languages: ['typescript', 'python', 'go', 'rust'],
                    frameworks: ['react', 'vue', 'angular', 'express', 'fastapi'],
                    tools: ['docker', 'kubernetes', 'aws', 'gcp', 'terraform'],
                    databases: ['postgresql', 'mongodb', 'redis', 'elasticsearch']
                },
                performance: {
                    avgTaskCompletionTime: 1500,
                    successRate: 0.95,
                    qualityScore: 0.92
                }
            });
        });
    });
    describe('Feature Management Benchmarks', () => {
        bench('single feature suggestion', async () => {
            await mockApi.suggestFeature({
                title: 'Benchmark Feature',
                description: 'Feature for benchmarking purposes',
                category: 'benchmark',
                priority: 'medium'
            });
        });
        bench('batch feature suggestions - 20 features', async () => {
            const featureBatch = [];
            for (let i = 0; i < 20; i++) {
                featureBatch.push(mockApi.suggestFeature({
                    title: `Batch Feature ${i}`,
                    description: `Feature ${i} for batch benchmarking`,
                    category: 'benchmark',
                    priority: ['high', 'medium', 'low'][i % 3]
                }));
            }
            await Promise.all(featureBatch);
        });
        bench('feature approval workflow', async () => {
            const { featureId } = await mockApi.suggestFeature({
                title: 'Workflow Benchmark Feature',
                description: 'Feature for workflow benchmarking',
                category: 'benchmark',
                priority: 'medium'
            });
            await mockApi.approveFeature(featureId);
        });
        bench('complex feature with detailed specification', async () => {
            await mockApi.suggestFeature({
                title: 'Complex Benchmark Feature',
                description: 'Comprehensive feature with detailed specification for benchmarking',
                category: 'feature',
                priority: 'high',
                estimatedComplexity: 9,
                requiredSkills: ['frontend', 'backend', 'database', 'devops', 'testing'],
                userStory: 'As a user, I want comprehensive functionality that demonstrates system capabilities',
                acceptanceCriteria: new Array(15).fill(0).map((_, i) => `Detailed criteria ${i + 1}`),
                technicalRequirements: {
                    performance: {
                        loadTime: '< 200ms',
                        throughput: '> 1000 rps',
                        availability: '99.9%'
                    },
                    security: {
                        authentication: 'OAuth 2.0',
                        encryption: 'AES-256',
                        compliance: ['GDPR', 'CCPA']
                    },
                    scalability: {
                        horizontal: true,
                        vertical: true,
                        autoScaling: true
                    }
                },
                dependencies: new Array(10).fill(0).map((_, i) => `dependency-${i + 1}`),
                risks: new Array(5).fill(0).map((_, i) => ({
                    risk: `Risk ${i + 1}`,
                    impact: 'medium',
                    probability: 'low',
                    mitigation: `Mitigation strategy ${i + 1}`
                }))
            });
        });
    });
    describe('End-to-End Workflow Benchmarks', () => {
        bench('complete feature lifecycle - small', async () => {
            // Suggest feature
            const { featureId } = await mockApi.suggestFeature({
                title: 'E2E Benchmark Feature Small',
                description: 'Small feature for end-to-end benchmarking',
                category: 'benchmark'
            });
            // Approve feature
            await mockApi.approveFeature(featureId);
            // Create tasks
            const taskPromises = [];
            for (let i = 0; i < 3; i++) {
                taskPromises.push(mockApi.createTask({
                    title: `E2E Task ${i}`,
                    description: `End-to-end benchmark task ${i}`,
                    featureId,
                    type: 'benchmark'
                }));
            }
            const taskResults = await Promise.all(taskPromises);
            // Execute tasks
            for (const { taskId } of taskResults) {
                await mockApi.updateTaskStatus(taskId, 'in_progress');
                await mockApi.updateTaskStatus(taskId, 'completed');
            }
        });
        bench('complete feature lifecycle - medium', async () => {
            // Suggest feature
            const { featureId } = await mockApi.suggestFeature({
                title: 'E2E Benchmark Feature Medium',
                description: 'Medium feature for end-to-end benchmarking',
                category: 'benchmark',
                priority: 'high'
            });
            // Approve feature
            await mockApi.approveFeature(featureId);
            // Register agents
            const agentPromises = [];
            for (let i = 0; i < 3; i++) {
                agentPromises.push(mockApi.registerAgent({
                    type: `e2e_agent_${i}`,
                    capabilities: ['general'],
                    status: 'available'
                }));
            }
            await Promise.all(agentPromises);
            // Create tasks
            const taskPromises = [];
            for (let i = 0; i < 8; i++) {
                taskPromises.push(mockApi.createTask({
                    title: `E2E Medium Task ${i}`,
                    description: `End-to-end medium benchmark task ${i}`,
                    featureId,
                    type: ['frontend', 'backend', 'testing'][i % 3],
                    priority: ['high', 'medium'][i % 2]
                }));
            }
            const taskResults = await Promise.all(taskPromises);
            // Execute tasks
            for (const { taskId } of taskResults) {
                await mockApi.updateTaskStatus(taskId, 'in_progress');
                await mockApi.updateTaskStatus(taskId, 'completed');
            }
        });
    });
    describe('Concurrent Operations Benchmarks', () => {
        bench('concurrent task creation and execution - 25 operations', async () => {
            const operations = [];
            // Mix of task creation and execution operations
            for (let i = 0; i < 25; i++) {
                if (i % 2 === 0) {
                    // Task creation
                    operations.push(mockApi.createTask({
                        title: `Concurrent Task ${i}`,
                        description: 'Concurrent operation benchmark task',
                        type: 'benchmark'
                    }));
                }
                else {
                    // For execution, create a task first then execute
                    operations.push((async () => {
                        const { taskId } = await mockApi.createTask({
                            title: `Concurrent Exec Task ${i}`,
                            description: 'Concurrent execution benchmark task',
                            type: 'benchmark'
                        });
                        await mockApi.updateTaskStatus(taskId, 'in_progress');
                        await mockApi.updateTaskStatus(taskId, 'completed');
                        return taskId;
                    })());
                }
            }
            await Promise.all(operations);
        });
        bench('mixed operations - tasks, agents, features', async () => {
            const operations = [];
            // Create features
            for (let i = 0; i < 5; i++) {
                operations.push(mockApi.suggestFeature({
                    title: `Mixed Benchmark Feature ${i}`,
                    description: 'Mixed operations benchmark feature',
                    category: 'benchmark'
                }));
            }
            // Register agents
            for (let i = 0; i < 3; i++) {
                operations.push(mockApi.registerAgent({
                    type: `mixed_agent_${i}`,
                    capabilities: ['general'],
                    status: 'available'
                }));
            }
            // Create tasks
            for (let i = 0; i < 10; i++) {
                operations.push(mockApi.createTask({
                    title: `Mixed Benchmark Task ${i}`,
                    description: 'Mixed operations benchmark task',
                    type: 'benchmark'
                }));
            }
            await Promise.all(operations);
        });
    });
    describe('Memory Efficiency Benchmarks', () => {
        bench('memory efficient task processing', async () => {
            const { result } = await PerformanceTestUtils.measureMemoryUsage(async () => {
                // Create tasks
                const taskPromises = [];
                for (let i = 0; i < 100; i++) {
                    taskPromises.push(mockApi.createTask({
                        title: `Memory Efficient Task ${i}`,
                        description: 'Memory efficiency benchmark task',
                        type: 'benchmark'
                    }));
                }
                const taskResults = await Promise.all(taskPromises);
                // Process tasks
                for (const { taskId } of taskResults) {
                    await mockApi.updateTaskStatus(taskId, 'in_progress');
                    await mockApi.updateTaskStatus(taskId, 'completed');
                }
                return taskResults.length;
            });
            return result;
        });
        bench('large payload handling', async () => {
            const largePayload = {
                metadata: new Array(1000).fill(0).map((_, i) => ({
                    id: i,
                    data: `large-data-chunk-${i}`,
                    timestamp: new Date().toISOString(),
                    details: new Array(10).fill(0).map((_, j) => `detail-${i}-${j}`)
                }))
            };
            await mockApi.createTask({
                title: 'Large Payload Task',
                description: 'Task with large payload for memory benchmarking',
                type: 'benchmark',
                payload: largePayload
            });
        });
    });
});
//# sourceMappingURL=task-queue-performance.bench.js.map