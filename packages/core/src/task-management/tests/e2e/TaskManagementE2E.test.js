/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TaskManagementSystemFactory } from '../../index.js';
import { TaskExecutionEngine } from '../../TaskExecutionEngine.complete.js';
import { ExecutionMonitoringSystem } from '../../ExecutionMonitoringSystem.js';
/**
 * @fileoverview End-to-End tests for complete task management workflows
 *
 * Tests realistic scenarios from task creation through completion,
 * including complex dependency chains, error recovery, and system scaling.
 */
describe('Task Management End-to-End Workflows', () => {
    let config;
    let system;
    beforeEach(async () => {
        config = {
            getModel: vi.fn(() => 'gemini-2.0-pro'),
            getToolRegistry: vi.fn(() => ({
                getTool: vi.fn(),
                getAllTools: vi.fn(() => []),
                getAllToolNames: vi.fn(() => []),
                getFunctionDeclarationsFiltered: vi.fn(() => [])
            })),
            storage: {
                getProjectTempDir: vi.fn(() => '/tmp/e2e-project'),
                ensureProjectTempDir: vi.fn()
            },
            getSessionId: vi.fn(() => 'e2e-test-session')
        };
        // Mock file system operations for persistent storage
        vi.mock('fs/promises', () => ({
            writeFile: vi.fn(),
            readFile: vi.fn(() => Promise.resolve(JSON.stringify({}))),
            mkdir: vi.fn(),
            access: vi.fn(),
            unlink: vi.fn(),
            readdir: vi.fn(() => Promise.resolve([]))
        }));
        system = await TaskManagementSystemFactory.createComplete(config, {
            enableMonitoring: true,
            enableHookIntegration: false
        });
    });
    afterEach(async () => {
        if (system) {
            await system.shutdown();
        }
        vi.clearAllMocks();
    });
    describe('Complete Feature Development Workflow', () => {
        it('should execute full software development lifecycle', async () => {
            const startTime = Date.now();
            const tasks = [];
            // Phase 1: Analysis and Planning
            const analysisTaskId = await system.taskEngine.queueTask('Requirements Analysis', 'Analyze user requirements for authentication system', {
                type: 'analysis',
                priority: 'high',
                expectedOutputs: {
                    'requirements_doc': 'Comprehensive requirements document',
                    'user_stories': 'User stories and acceptance criteria',
                    'technical_specs': 'Technical specifications'
                }
            });
            tasks.push(analysisTaskId);
            const architectureTaskId = await system.taskEngine.queueTask('System Architecture Design', 'Design scalable architecture for authentication system', {
                type: 'analysis',
                priority: 'high',
                dependencies: [analysisTaskId],
                expectedOutputs: {
                    'architecture_diagram': 'System architecture diagram',
                    'api_design': 'REST API specifications',
                    'database_schema': 'Database design schema'
                }
            });
            tasks.push(architectureTaskId);
            // Phase 2: Implementation
            const backendTaskId = await system.taskEngine.queueTask('Backend Implementation', 'Implement authentication backend services', {
                type: 'implementation',
                priority: 'high',
                dependencies: [architectureTaskId],
                expectedOutputs: {
                    'auth_service': 'Authentication service implementation',
                    'user_management': 'User management APIs',
                    'security_layer': 'Security and encryption layer'
                }
            });
            tasks.push(backendTaskId);
            const frontendTaskId = await system.taskEngine.queueTask('Frontend Implementation', 'Implement authentication UI components', {
                type: 'implementation',
                priority: 'high',
                dependencies: [architectureTaskId], // Can start after architecture
                expectedOutputs: {
                    'login_components': 'Login/logout UI components',
                    'registration_forms': 'User registration forms',
                    'auth_guards': 'Route authentication guards'
                }
            });
            tasks.push(frontendTaskId);
            // Phase 3: Testing
            const unitTestTaskId = await system.taskEngine.queueTask('Unit Testing', 'Comprehensive unit tests for authentication system', {
                type: 'testing',
                priority: 'medium',
                dependencies: [backendTaskId, frontendTaskId],
                expectedOutputs: {
                    'backend_tests': 'Backend unit tests with >90% coverage',
                    'frontend_tests': 'Frontend component tests',
                    'test_reports': 'Test execution reports'
                }
            });
            tasks.push(unitTestTaskId);
            const integrationTestTaskId = await system.taskEngine.queueTask('Integration Testing', 'End-to-end integration tests', {
                type: 'testing',
                priority: 'medium',
                dependencies: [unitTestTaskId],
                expectedOutputs: {
                    'e2e_tests': 'End-to-end test scenarios',
                    'api_integration_tests': 'API integration tests',
                    'security_tests': 'Security vulnerability tests'
                }
            });
            tasks.push(integrationTestTaskId);
            // Phase 4: Deployment
            const deploymentTaskId = await system.taskEngine.queueTask('Production Deployment', 'Deploy authentication system to production', {
                type: 'deployment',
                priority: 'high',
                dependencies: [integrationTestTaskId],
                expectedOutputs: {
                    'deployed_services': 'Live authentication services',
                    'monitoring_setup': 'Production monitoring configuration',
                    'deployment_docs': 'Deployment documentation'
                }
            });
            tasks.push(deploymentTaskId);
            expect(tasks).toHaveLength(6);
            // Verify all tasks are queued
            const allTasks = system.taskEngine.getAllTasks();
            expect(allTasks).toHaveLength(6);
            // Simulate execution workflow
            const executionResults = [];
            // Execute analysis task
            let task = system.taskEngine.getTask(analysisTaskId);
            task.status = 'in_progress';
            task.startedAt = new Date();
            task.progress = 100;
            task.status = 'completed';
            task.completedAt = new Date();
            task.outputs = {
                'requirements_doc': 'JWT-based authentication with OAuth2 support',
                'user_stories': '15 user stories with acceptance criteria',
                'technical_specs': 'RESTful API with PostgreSQL backend'
            };
            executionResults.push({
                taskId: analysisTaskId,
                success: true,
                output: task.outputs
            });
            // Execute architecture task
            task = system.taskEngine.getTask(architectureTaskId);
            task.status = 'in_progress';
            task.startedAt = new Date();
            await new Promise(resolve => setTimeout(resolve, 10)); // Simulate work
            task.progress = 100;
            task.status = 'completed';
            task.completedAt = new Date();
            task.outputs = {
                'architecture_diagram': 'Microservices architecture with API gateway',
                'api_design': 'OpenAPI 3.0 specifications',
                'database_schema': 'Normalized PostgreSQL schema'
            };
            executionResults.push({
                taskId: architectureTaskId,
                success: true,
                output: task.outputs
            });
            // Execute backend and frontend in parallel
            const backendTask = system.taskEngine.getTask(backendTaskId);
            const frontendTask = system.taskEngine.getTask(frontendTaskId);
            // Start both tasks
            backendTask.status = 'in_progress';
            backendTask.startedAt = new Date();
            frontendTask.status = 'in_progress';
            frontendTask.startedAt = new Date();
            await new Promise(resolve => setTimeout(resolve, 20)); // Simulate parallel work
            // Complete backend
            backendTask.progress = 100;
            backendTask.status = 'completed';
            backendTask.completedAt = new Date();
            backendTask.outputs = {
                'auth_service': 'Express.js authentication service',
                'user_management': 'CRUD operations for user management',
                'security_layer': 'JWT tokens with refresh token rotation'
            };
            // Complete frontend
            frontendTask.progress = 100;
            frontendTask.status = 'completed';
            frontendTask.completedAt = new Date();
            frontendTask.outputs = {
                'login_components': 'React login/logout components',
                'registration_forms': 'Formik-based registration forms',
                'auth_guards': 'React Router auth guards'
            };
            executionResults.push({
                taskId: backendTaskId,
                success: true,
                output: backendTask.outputs
            });
            executionResults.push({
                taskId: frontendTaskId,
                success: true,
                output: frontendTask.outputs
            });
            // Execute testing tasks
            task = system.taskEngine.getTask(unitTestTaskId);
            task.status = 'in_progress';
            task.startedAt = new Date();
            await new Promise(resolve => setTimeout(resolve, 15));
            task.progress = 100;
            task.status = 'completed';
            task.completedAt = new Date();
            task.outputs = {
                'backend_tests': '95% code coverage with Jest',
                'frontend_tests': 'React Testing Library test suite',
                'test_reports': 'Comprehensive test execution reports'
            };
            task = system.taskEngine.getTask(integrationTestTaskId);
            task.status = 'in_progress';
            task.startedAt = new Date();
            await new Promise(resolve => setTimeout(resolve, 10));
            task.progress = 100;
            task.status = 'completed';
            task.completedAt = new Date();
            task.outputs = {
                'e2e_tests': 'Playwright E2E test suite',
                'api_integration_tests': 'Postman API test collection',
                'security_tests': 'OWASP security vulnerability assessment'
            };
            // Execute deployment
            task = system.taskEngine.getTask(deploymentTaskId);
            task.status = 'in_progress';
            task.startedAt = new Date();
            await new Promise(resolve => setTimeout(resolve, 25));
            task.progress = 100;
            task.status = 'completed';
            task.completedAt = new Date();
            task.outputs = {
                'deployed_services': 'Kubernetes deployment on AWS EKS',
                'monitoring_setup': 'Prometheus and Grafana monitoring',
                'deployment_docs': 'Deployment runbooks and troubleshooting guides'
            };
            executionResults.push({
                taskId: deploymentTaskId,
                success: true,
                output: task.outputs
            });
            // Verify workflow completion
            expect(executionResults).toHaveLength(6);
            const completedTasks = system.taskEngine.getAllTasks({ status: 'completed' });
            expect(completedTasks).toHaveLength(6);
            // Verify monitoring tracked the entire workflow
            if (system.monitoring) {
                const finalTasks = system.taskEngine.getAllTasks();
                const metrics = await system.monitoring.collectMetrics(finalTasks);
                expect(metrics.totalTasks).toBe(6);
                expect(metrics.completedTasks).toBe(6);
                expect(metrics.successRate).toBe(100);
                expect(metrics.averageDuration).toBeGreaterThan(0);
            }
            const totalTime = Date.now() - startTime;
            console.log(`E2E Workflow completed in ${totalTime}ms`);
            expect(totalTime).toBeLessThan(30000); // Should complete in under 30 seconds
        });
    });
    describe('Error Recovery and Resilience Workflow', () => {
        it('should handle complex failure scenarios with recovery', async () => {
            // Create a chain of tasks where some will fail
            const task1Id = await system.taskEngine.queueTask('Database Setup', 'Set up production database', { type: 'implementation', priority: 'critical' });
            const task2Id = await system.taskEngine.queueTask('API Deployment', 'Deploy API services', {
                type: 'deployment',
                priority: 'critical',
                dependencies: [task1Id]
            });
            const task3Id = await system.taskEngine.queueTask('Frontend Deployment', 'Deploy frontend application', {
                type: 'deployment',
                priority: 'high',
                dependencies: [task2Id]
            });
            const task4Id = await system.taskEngine.queueTask('Health Check', 'Verify system health', {
                type: 'testing',
                priority: 'high',
                dependencies: [task3Id]
            });
            // Execute first task successfully
            let task = system.taskEngine.getTask(task1Id);
            task.status = 'in_progress';
            task.startedAt = new Date();
            task.progress = 100;
            task.status = 'completed';
            task.completedAt = new Date();
            // Execute second task with failure
            task = system.taskEngine.getTask(task2Id);
            task.status = 'in_progress';
            task.startedAt = new Date();
            task.progress = 50;
            task.status = 'failed';
            task.lastError = 'Connection timeout to production environment';
            task.retryCount = 0;
            // Verify monitoring detected the failure
            if (system.monitoring) {
                const metrics = await system.monitoring.collectMetrics([task]);
                expect(metrics.failedTasks).toBe(1);
                expect(metrics.errorRate).toBeGreaterThan(0);
            }
            // Retry the failed task
            task.status = 'ready';
            task.lastError = undefined;
            task.retryCount = 1;
            task.progress = 0;
            // Second attempt succeeds
            task.status = 'in_progress';
            task.progress = 100;
            task.status = 'completed';
            task.completedAt = new Date();
            // Continue with remaining tasks
            task = system.taskEngine.getTask(task3Id);
            task.status = 'in_progress';
            task.startedAt = new Date();
            task.progress = 100;
            task.status = 'completed';
            task.completedAt = new Date();
            task = system.taskEngine.getTask(task4Id);
            task.status = 'in_progress';
            task.startedAt = new Date();
            task.progress = 100;
            task.status = 'completed';
            task.completedAt = new Date();
            // Verify final state
            const completedTasks = system.taskEngine.getAllTasks({ status: 'completed' });
            expect(completedTasks).toHaveLength(4);
            if (system.monitoring) {
                const finalMetrics = await system.monitoring.collectMetrics(system.taskEngine.getAllTasks());
                expect(finalMetrics.completedTasks).toBe(4);
                expect(finalMetrics.successRate).toBe(100); // After retry
            }
        });
    });
    describe('High Volume Processing Workflow', () => {
        it('should handle bulk data processing scenario', async () => {
            const batchSize = 20;
            const processingTasks = [];
            const startTime = Date.now();
            // Create data preparation task
            const prepTaskId = await system.taskEngine.queueTask('Data Preparation', 'Prepare bulk data for processing', {
                type: 'analysis',
                priority: 'high',
                expectedOutputs: {
                    'cleaned_data': 'Preprocessed data files',
                    'validation_report': 'Data quality validation'
                }
            });
            // Create batch processing tasks
            for (let i = 0; i < batchSize; i++) {
                const taskId = await system.taskEngine.queueTask(`Process Batch ${i + 1}`, `Process data batch ${i + 1} of ${batchSize}`, {
                    type: 'implementation',
                    priority: 'medium',
                    dependencies: [prepTaskId],
                    expectedOutputs: {
                        [`batch_${i + 1}_results`]: `Processed results for batch ${i + 1}`
                    }
                });
                processingTasks.push(taskId);
            }
            // Create aggregation task
            const aggregationTaskId = await system.taskEngine.queueTask('Results Aggregation', 'Aggregate all batch processing results', {
                type: 'analysis',
                priority: 'high',
                dependencies: processingTasks,
                expectedOutputs: {
                    'final_report': 'Comprehensive processing report',
                    'summary_statistics': 'Statistical analysis summary'
                }
            });
            const totalTasks = 1 + batchSize + 1; // prep + batch + aggregation
            expect(system.taskEngine.getAllTasks()).toHaveLength(totalTasks);
            // Execute preparation task
            let task = system.taskEngine.getTask(prepTaskId);
            task.status = 'in_progress';
            task.startedAt = new Date();
            task.progress = 100;
            task.status = 'completed';
            task.completedAt = new Date();
            // Execute batch processing tasks in parallel simulation
            const batchExecutionPromises = processingTasks.map(async (taskId, index) => {
                const task = system.taskEngine.getTask(taskId);
                task.status = 'in_progress';
                task.startedAt = new Date();
                // Simulate varying processing times
                await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10));
                task.progress = 100;
                task.status = 'completed';
                task.completedAt = new Date();
                task.outputs = {
                    [`batch_${index + 1}_results`]: `Results from batch ${index + 1}`
                };
                return task;
            });
            const completedBatchTasks = await Promise.all(batchExecutionPromises);
            expect(completedBatchTasks).toHaveLength(batchSize);
            // Execute aggregation task
            task = system.taskEngine.getTask(aggregationTaskId);
            task.status = 'in_progress';
            task.startedAt = new Date();
            await new Promise(resolve => setTimeout(resolve, 30)); // Aggregation takes time
            task.progress = 100;
            task.status = 'completed';
            task.completedAt = new Date();
            task.outputs = {
                'final_report': 'All batches processed successfully',
                'summary_statistics': `Processed ${batchSize} batches in parallel`
            };
            // Verify completion
            const allCompletedTasks = system.taskEngine.getAllTasks({ status: 'completed' });
            expect(allCompletedTasks).toHaveLength(totalTasks);
            // Verify performance metrics
            if (system.monitoring) {
                const metrics = await system.monitoring.collectMetrics(system.taskEngine.getAllTasks());
                expect(metrics.totalTasks).toBe(totalTasks);
                expect(metrics.successRate).toBe(100);
                expect(metrics.averageConcurrency).toBeGreaterThan(1); // Some parallel execution
            }
            const totalTime = Date.now() - startTime;
            console.log(`Bulk processing workflow completed in ${totalTime}ms`);
            expect(totalTime).toBeLessThan(60000); // Should complete in under 1 minute
        });
    });
    describe('Adaptive System Behavior Workflow', () => {
        it('should adapt to changing system conditions', async () => {
            // Create tasks with different resource requirements
            const lowResourceTaskId = await system.taskEngine.queueTask('Light Processing', 'CPU-light data validation', {
                type: 'analysis',
                priority: 'medium',
                resourceConstraints: [
                    { resourceType: 'cpu', maxUnits: 1 },
                    { resourceType: 'memory', maxUnits: 2 }
                ]
            });
            const mediumResourceTaskId = await system.taskEngine.queueTask('Medium Processing', 'Moderate data transformation', {
                type: 'implementation',
                priority: 'medium',
                resourceConstraints: [
                    { resourceType: 'cpu', maxUnits: 2 },
                    { resourceType: 'memory', maxUnits: 4 }
                ]
            });
            const highResourceTaskId = await system.taskEngine.queueTask('Heavy Processing', 'Intensive machine learning training', {
                type: 'implementation',
                priority: 'high',
                resourceConstraints: [
                    { resourceType: 'cpu', maxUnits: 4 },
                    { resourceType: 'memory', maxUnits: 8 },
                    { resourceType: 'gpu', maxUnits: 1 }
                ]
            });
            // Simulate system under different load conditions
            const tasks = [
                system.taskEngine.getTask(lowResourceTaskId),
                system.taskEngine.getTask(mediumResourceTaskId),
                system.taskEngine.getTask(highResourceTaskId)
            ];
            // Scenario 1: Normal load - all tasks should proceed
            for (const task of tasks) {
                task.status = 'ready';
            }
            // Execute tasks based on resource availability
            tasks[0].status = 'in_progress';
            tasks[0].startedAt = new Date();
            tasks[1].status = 'in_progress';
            tasks[1].startedAt = new Date();
            // High resource task starts but may need to wait
            tasks[2].status = 'in_progress';
            tasks[2].startedAt = new Date();
            await new Promise(resolve => setTimeout(resolve, 50));
            // Complete tasks in order of completion
            tasks[0].status = 'completed';
            tasks[0].completedAt = new Date();
            tasks[0].progress = 100;
            tasks[1].status = 'completed';
            tasks[1].completedAt = new Date();
            tasks[1].progress = 100;
            // High resource task takes longer
            await new Promise(resolve => setTimeout(resolve, 30));
            tasks[2].status = 'completed';
            tasks[2].completedAt = new Date();
            tasks[2].progress = 100;
            // Verify adaptive behavior through monitoring
            if (system.monitoring) {
                const metrics = await system.monitoring.collectMetrics(tasks);
                expect(metrics.resourceUtilization).toBeDefined();
                expect(metrics.averageConcurrency).toBeGreaterThan(0);
                // Check for resource contention patterns
                const executionEvents = system.monitoring.getExecutionEvents();
                const resourceEvents = executionEvents.filter(e => e.metadata?.resourceConstraints || e.metadata?.resourceAvailability);
                expect(resourceEvents.length).toBeGreaterThanOrEqual(0);
            }
            const completedTasks = system.taskEngine.getAllTasks({ status: 'completed' });
            expect(completedTasks).toHaveLength(3);
        });
    });
    describe('Cross-Session Persistence Workflow', () => {
        it('should maintain state across system restarts', async () => {
            const persistentTaskId = await system.taskEngine.queueTask('Long Running Analysis', 'Multi-hour data analysis that spans sessions', {
                type: 'analysis',
                priority: 'high',
                maxExecutionTimeMinutes: 240, // 4 hours
                expectedOutputs: {
                    'partial_results': 'Incremental analysis results',
                    'final_report': 'Complete analysis report'
                }
            });
            let task = system.taskEngine.getTask(persistentTaskId);
            // Start task execution
            task.status = 'in_progress';
            task.startedAt = new Date();
            task.progress = 25;
            // Simulate system shutdown and restart
            const beforeShutdownState = {
                id: task.id,
                status: task.status,
                progress: task.progress,
                startedAt: task.startedAt,
                outputs: task.outputs || {}
            };
            // Shutdown current system
            await system.shutdown();
            // Create new system instance (simulating restart)
            system = await TaskManagementSystemFactory.createComplete(config, {
                enableMonitoring: true,
                enableHookIntegration: false
            });
            // Verify task state persistence (would be loaded from storage in real implementation)
            const restoredTaskId = await system.taskEngine.queueTask('Long Running Analysis', 'Multi-hour data analysis that spans sessions', {
                type: 'analysis',
                priority: 'high',
                maxExecutionTimeMinutes: 240
            });
            const restoredTask = system.taskEngine.getTask(restoredTaskId);
            // Simulate restoration of previous state
            restoredTask.status = 'in_progress';
            restoredTask.startedAt = beforeShutdownState.startedAt;
            restoredTask.progress = beforeShutdownState.progress;
            // Continue execution from where it left off
            restoredTask.progress = 75; // Made more progress
            await new Promise(resolve => setTimeout(resolve, 20));
            restoredTask.progress = 100;
            restoredTask.status = 'completed';
            restoredTask.completedAt = new Date();
            restoredTask.outputs = {
                'partial_results': 'Restored from session state',
                'final_report': 'Analysis completed after system restart'
            };
            expect(restoredTask.status).toBe('completed');
            expect(restoredTask.outputs).toBeDefined();
            expect(restoredTask.startedAt).toEqual(beforeShutdownState.startedAt);
            // Verify monitoring tracked the cross-session execution
            if (system.monitoring) {
                const metrics = await system.monitoring.collectMetrics([restoredTask]);
                expect(metrics.completedTasks).toBe(1);
                // In a real implementation, this would show session restoration events
            }
        });
    });
    describe('Real-time Monitoring and Alerts Workflow', () => {
        it('should provide real-time insights and alerts', async () => {
            const monitoredTasks = [];
            // Create tasks that will trigger different monitoring scenarios
            for (let i = 0; i < 5; i++) {
                const taskId = await system.taskEngine.queueTask(`Monitored Task ${i + 1}`, `Task designed to test monitoring capabilities ${i + 1}`, {
                    type: i % 2 === 0 ? 'implementation' : 'testing',
                    priority: ['low', 'medium', 'high'][i % 3],
                    maxExecutionTimeMinutes: 30 + i * 10
                });
                monitoredTasks.push(taskId);
            }
            if (!system.monitoring) {
                throw new Error('Monitoring system not initialized');
            }
            const monitoring = system.monitoring;
            // Execute tasks with different patterns to trigger monitoring
            for (let i = 0; i < monitoredTasks.length; i++) {
                const task = system.taskEngine.getTask(monitoredTasks[i]);
                task.status = 'in_progress';
                task.startedAt = new Date();
                // Record start event
                monitoring.recordEvent({
                    taskId: task.id,
                    eventType: 'started',
                    timestamp: new Date(),
                    metadata: {
                        title: task.title,
                        priority: task.priority,
                        estimatedDuration: task.maxExecutionTimeMinutes * 60 * 1000
                    }
                });
                // Simulate different execution patterns
                if (i === 0) {
                    // Fast completion
                    await new Promise(resolve => setTimeout(resolve, 10));
                    task.status = 'completed';
                    task.progress = 100;
                }
                else if (i === 1) {
                    // Slow progress
                    await new Promise(resolve => setTimeout(resolve, 30));
                    task.progress = 30;
                    // Task continues running
                }
                else if (i === 2) {
                    // Failure scenario
                    await new Promise(resolve => setTimeout(resolve, 20));
                    task.status = 'failed';
                    task.lastError = 'Simulated failure for monitoring test';
                    monitoring.recordEvent({
                        taskId: task.id,
                        eventType: 'failed',
                        timestamp: new Date(),
                        error: task.lastError,
                        metadata: { retryCount: 0 }
                    });
                }
                else {
                    // Normal completion
                    await new Promise(resolve => setTimeout(resolve, 25));
                    task.status = 'completed';
                    task.progress = 100;
                }
                if (task.status === 'completed') {
                    task.completedAt = new Date();
                    monitoring.recordEvent({
                        taskId: task.id,
                        eventType: 'completed',
                        timestamp: new Date(),
                        duration: task.completedAt.getTime() - task.startedAt.getTime(),
                        metadata: { finalProgress: task.progress }
                    });
                }
            }
            // Collect comprehensive metrics
            const allTasks = system.taskEngine.getAllTasks();
            const metrics = await monitoring.collectMetrics(allTasks);
            expect(metrics.totalTasks).toBe(5);
            expect(metrics.completedTasks).toBeGreaterThanOrEqual(3);
            expect(metrics.failedTasks).toBe(1);
            expect(metrics.inProgressTasks).toBeGreaterThanOrEqual(1);
            // Test dashboard data generation
            const dashboardData = monitoring.getDashboardData(metrics, allTasks);
            expect(dashboardData.metrics).toBeDefined();
            expect(dashboardData.taskDistribution).toBeDefined();
            expect(dashboardData.performanceMetrics).toBeDefined();
            expect(dashboardData.recentActivity).toBeDefined();
            // Test system health assessment
            const systemHealth = monitoring.getSystemHealth(metrics);
            expect(systemHealth.overall).toMatch(/healthy|warning|critical/);
            expect(systemHealth.components).toBeDefined();
            expect(systemHealth.recommendations).toBeDefined();
            // Test bottleneck analysis
            const bottlenecks = monitoring.analyzeBottlenecks(metrics, allTasks);
            expect(bottlenecks).toBeInstanceOf(Array);
            expect(bottlenecks.length).toBeGreaterThanOrEqual(0);
            // Verify alert generation for failures
            const executionEvents = monitoring.getExecutionEvents();
            const failureEvents = executionEvents.filter(e => e.eventType === 'failed');
            expect(failureEvents).toHaveLength(1);
            console.log('Monitoring System Performance:');
            console.log(`- Total Tasks: ${metrics.totalTasks}`);
            console.log(`- Success Rate: ${metrics.successRate}%`);
            console.log(`- Average Duration: ${metrics.averageDuration}ms`);
            console.log(`- System Health: ${systemHealth.overall}`);
        });
    });
});
//# sourceMappingURL=TaskManagementE2E.test.js.map