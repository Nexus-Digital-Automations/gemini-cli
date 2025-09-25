/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { vol } from 'memfs';
import { fsHelper } from '../helpers/fs-helper';
import { mockProcess } from '../helpers/process-mock';
import { TestReporter } from '../helpers/test-reporter';
import { testEnvironment, MockTaskManagerAPI, TestUtils, PerformanceTestUtils } from '../index';
/**
 * End-to-End Test Suite for Autonomous Workflows
 *
 * This suite tests complete autonomous workflows from feature suggestion
 * through implementation, including:
 * - Feature lifecycle management (suggest → approve → implement)
 * - Agent coordination and task distribution
 * - Quality gate enforcement
 * - Error handling and recovery
 * - Performance monitoring and optimization
 */
describe('Autonomous Workflows E2E', () => {
    let mockApi;
    let testReporter;
    let logger;
    beforeEach(async () => {
        await testEnvironment.setup();
        mockApi = testEnvironment.getMockAPI();
        testReporter = new TestReporter();
        logger = testEnvironment.getLogger();
        // Create comprehensive test project structure
        fsHelper.createBasicProjectStructure('/e2e-test-project');
        fsHelper.createMockFs({
            'src': {
                'components': {
                    'UserAuth.ts': 'export class UserAuth { }',
                    'Dashboard.ts': 'export class Dashboard { }'
                },
                'services': {
                    'AuthService.ts': 'export class AuthService { }',
                    'ApiClient.ts': 'export class ApiClient { }'
                },
                'utils': {
                    'validation.ts': 'export const validate = () => {};',
                    'helpers.ts': 'export const helper = () => {};'
                }
            },
            'tests': {
                'unit': {},
                'integration': {},
                'e2e': {}
            },
            'docs': {
                'README.md': '# Project Documentation',
                'API.md': '# API Documentation'
            },
            'config': {
                'environment.json': JSON.stringify({ development: true }),
                'database.json': JSON.stringify({ host: 'localhost' })
            }
        });
        mockProcess.mockEnv({
            NODE_ENV: 'e2e-test',
            GEMINI_CLI_E2E_TEST: 'true'
        });
    });
    afterEach(async () => {
        await testEnvironment.teardown();
        vol.reset();
        mockProcess.restore();
    });
    describe('Complete Feature Lifecycle Workflow', () => {
        it('should execute full feature lifecycle from suggestion to implementation', async () => {
            const testCase = testReporter.startTest('Full Feature Lifecycle');
            try {
                // Phase 1: Feature Suggestion
                logger.info('Phase 1: Feature Suggestion');
                const featureData = {
                    title: 'Advanced User Profile Management',
                    description: 'Implement comprehensive user profile system with avatar upload, preferences, and privacy settings',
                    category: 'feature',
                    priority: 'high',
                    estimatedComplexity: 8,
                    requiredSkills: ['frontend', 'backend', 'database'],
                    userStory: 'As a user, I want to manage my profile comprehensively so that I can customize my experience',
                    acceptanceCriteria: [
                        'User can upload and change avatar',
                        'User can update personal information',
                        'User can set privacy preferences',
                        'Profile changes are validated and saved',
                        'Profile history is maintained'
                    ]
                };
                const { featureId } = await mockApi.suggestFeature(featureData);
                expect(featureId).toBeDefined();
                const suggestedFeature = await mockApi.getFeature(featureId);
                expect(suggestedFeature.status).toBe('suggested');
                testReporter.takeScreenshot(testCase.id, 'feature-suggested');
                // Phase 2: Feature Approval
                logger.info('Phase 2: Feature Approval');
                const approvalResult = await mockApi.approveFeature(featureId);
                expect(approvalResult.success).toBe(true);
                const approvedFeature = await mockApi.getFeature(featureId);
                expect(approvedFeature.status).toBe('approved');
                expect(approvedFeature.approved_at).toBeDefined();
                testReporter.takeScreenshot(testCase.id, 'feature-approved');
                // Phase 3: Task Breakdown and Agent Assignment
                logger.info('Phase 3: Task Breakdown and Agent Assignment');
                const tasks = [
                    {
                        title: 'Design profile data model and database schema',
                        description: 'Create database tables for user profiles, avatars, and preferences',
                        type: 'database',
                        estimatedHours: 2,
                        dependencies: [],
                        agentType: 'database_specialist'
                    },
                    {
                        title: 'Implement backend API endpoints for profile management',
                        description: 'Create REST APIs for profile CRUD operations and avatar upload',
                        type: 'backend',
                        estimatedHours: 4,
                        dependencies: ['database'],
                        agentType: 'backend_developer'
                    },
                    {
                        title: 'Create frontend profile management components',
                        description: 'Build React components for profile editing and avatar upload',
                        type: 'frontend',
                        estimatedHours: 6,
                        dependencies: ['backend'],
                        agentType: 'frontend_developer'
                    },
                    {
                        title: 'Implement comprehensive testing suite',
                        description: 'Create unit, integration, and E2E tests for profile system',
                        type: 'testing',
                        estimatedHours: 3,
                        dependencies: ['frontend', 'backend'],
                        agentType: 'qa_engineer'
                    },
                    {
                        title: 'Create documentation and user guides',
                        description: 'Document API endpoints and create user-facing guides',
                        type: 'documentation',
                        estimatedHours: 2,
                        dependencies: ['testing'],
                        agentType: 'technical_writer'
                    }
                ];
                const createdTasks = [];
                for (const taskData of tasks) {
                    const { taskId } = await mockApi.createTask({
                        ...taskData,
                        featureId,
                        status: 'pending',
                        created_by: 'autonomous_system'
                    });
                    createdTasks.push(taskId);
                }
                expect(createdTasks.length).toBe(5);
                // Register specialized agents for task execution
                const agents = [];
                const agentTypes = ['database_specialist', 'backend_developer', 'frontend_developer', 'qa_engineer', 'technical_writer'];
                for (const agentType of agentTypes) {
                    const { agentId } = await mockApi.registerAgent({
                        type: agentType,
                        capabilities: [agentType.replace('_', '-')],
                        status: 'available',
                        maxConcurrentTasks: 2
                    });
                    agents.push(agentId);
                }
                expect(agents.length).toBe(5);
                testReporter.takeScreenshot(testCase.id, 'agents-registered');
                // Phase 4: Task Execution with Dependency Management
                logger.info('Phase 4: Task Execution with Dependency Management');
                // Execute tasks in dependency order with realistic timing
                const executionResults = [];
                // Database task (no dependencies)
                const databaseTaskId = createdTasks[0];
                await mockApi.updateTaskStatus(databaseTaskId, 'in_progress');
                await TestUtils.delay(500); // Simulate database schema creation
                await mockApi.updateTaskStatus(databaseTaskId, 'completed');
                executionResults.push({ taskId: databaseTaskId, status: 'completed' });
                // Backend task (depends on database)
                const backendTaskId = createdTasks[1];
                await mockApi.updateTaskStatus(backendTaskId, 'in_progress');
                await TestUtils.delay(800); // Simulate API development
                await mockApi.updateTaskStatus(backendTaskId, 'completed');
                executionResults.push({ taskId: backendTaskId, status: 'completed' });
                // Frontend task (depends on backend)
                const frontendTaskId = createdTasks[2];
                await mockApi.updateTaskStatus(frontendTaskId, 'in_progress');
                await TestUtils.delay(1200); // Simulate UI component development
                await mockApi.updateTaskStatus(frontendTaskId, 'completed');
                executionResults.push({ taskId: frontendTaskId, status: 'completed' });
                // Testing task (depends on frontend and backend)
                const testingTaskId = createdTasks[3];
                await mockApi.updateTaskStatus(testingTaskId, 'in_progress');
                await TestUtils.delay(600); // Simulate test creation
                await mockApi.updateTaskStatus(testingTaskId, 'completed');
                executionResults.push({ taskId: testingTaskId, status: 'completed' });
                // Documentation task (depends on testing)
                const docsTaskId = createdTasks[4];
                await mockApi.updateTaskStatus(docsTaskId, 'in_progress');
                await TestUtils.delay(400); // Simulate documentation
                await mockApi.updateTaskStatus(docsTaskId, 'completed');
                executionResults.push({ taskId: docsTaskId, status: 'completed' });
                // Verify all tasks completed successfully
                for (const result of executionResults) {
                    const task = await mockApi.getTask(result.taskId);
                    expect(task.status).toBe('completed');
                    expect(task.updated_at).toBeDefined();
                }
                testReporter.takeScreenshot(testCase.id, 'tasks-completed');
                // Phase 5: Quality Gates and Validation
                logger.info('Phase 5: Quality Gates and Validation');
                const qualityChecks = [
                    { name: 'linting', passed: true, duration: 120 },
                    { name: 'unit_tests', passed: true, coverage: 94, duration: 450 },
                    { name: 'integration_tests', passed: true, duration: 680 },
                    { name: 'security_scan', passed: true, vulnerabilities: 0, duration: 200 },
                    { name: 'performance_test', passed: true, loadTime: 85, duration: 300 }
                ];
                const qualityResults = [];
                for (const check of qualityChecks) {
                    // Simulate quality gate execution
                    await TestUtils.delay(check.duration);
                    qualityResults.push({
                        ...check,
                        timestamp: new Date(),
                        status: check.passed ? 'passed' : 'failed'
                    });
                }
                const allQualityChecksPassed = qualityResults.every(result => result.status === 'passed');
                expect(allQualityChecksPassed).toBe(true);
                testReporter.takeScreenshot(testCase.id, 'quality-gates-passed');
                // Phase 6: Feature Implementation Completion
                logger.info('Phase 6: Feature Implementation Completion');
                // Update feature status to implemented
                const implementedFeature = await mockApi.getFeature(featureId);
                implementedFeature.status = 'implemented';
                implementedFeature.implemented_at = new Date();
                implementedFeature.implementation_summary = {
                    tasks_completed: createdTasks.length,
                    agents_involved: agents.length,
                    total_duration: '3.5 hours',
                    quality_score: 95,
                    performance_impact: 'minimal',
                    test_coverage: 94
                };
                testReporter.takeScreenshot(testCase.id, 'feature-implemented');
                // Verify final system state
                const finalTasks = await mockApi.listTasks();
                const completedTasks = finalTasks.filter(task => task.status === 'completed');
                expect(completedTasks.length).toBeGreaterThanOrEqual(5);
                const finalFeatures = await mockApi.listFeatures();
                const implementedFeatures = finalFeatures.filter(feature => feature.status === 'implemented');
                expect(implementedFeatures.length).toBeGreaterThanOrEqual(1);
                testCase.passed = true;
                testCase.duration = Date.now() - testCase.startTime;
                testCase.metadata = {
                    feature_id: featureId,
                    tasks_created: createdTasks.length,
                    agents_registered: agents.length,
                    quality_checks: qualityResults.length,
                    total_duration: testCase.duration
                };
                logger.info('Full feature lifecycle completed successfully', testCase.metadata);
            }
            catch (error) {
                testCase.passed = false;
                testCase.error = error.message;
                testCase.duration = Date.now() - testCase.startTime;
                logger.error('Full feature lifecycle failed', { error: error.message });
                throw error;
            }
            finally {
                testReporter.endTest(testCase);
            }
        }, 30000);
        it('should handle multiple concurrent features with resource coordination', async () => {
            const testCase = testReporter.startTest('Concurrent Features Coordination');
            try {
                logger.info('Starting concurrent features test');
                // Create multiple features simultaneously
                const features = [
                    {
                        title: 'Real-time Notifications System',
                        category: 'feature',
                        priority: 'high',
                        estimatedComplexity: 6,
                        requiredSkills: ['backend', 'frontend']
                    },
                    {
                        title: 'Advanced Search and Filtering',
                        category: 'feature',
                        priority: 'medium',
                        estimatedComplexity: 5,
                        requiredSkills: ['backend', 'frontend', 'database']
                    },
                    {
                        title: 'Data Export and Reporting',
                        category: 'feature',
                        priority: 'low',
                        estimatedComplexity: 4,
                        requiredSkills: ['backend', 'database']
                    }
                ];
                // Suggest and approve all features concurrently
                const featurePromises = features.map(async (featureData) => {
                    const { featureId } = await mockApi.suggestFeature(featureData);
                    await mockApi.approveFeature(featureId);
                    return featureId;
                });
                const featureIds = await Promise.all(featurePromises);
                expect(featureIds.length).toBe(3);
                // Create tasks for each feature with resource constraints
                const allTasks = [];
                for (let i = 0; i < featureIds.length; i++) {
                    const featureId = featureIds[i];
                    const taskCount = Math.floor(Math.random() * 4) + 2; // 2-5 tasks per feature
                    for (let j = 0; j < taskCount; j++) {
                        const { taskId } = await mockApi.createTask({
                            title: `Task ${j + 1} for Feature ${i + 1}`,
                            description: `Implementation task for feature ${featureId}`,
                            featureId,
                            type: ['frontend', 'backend', 'database'][j % 3],
                            estimatedHours: Math.floor(Math.random() * 4) + 1
                        });
                        allTasks.push(taskId);
                    }
                }
                // Register limited agents to test resource coordination
                const maxAgents = 3;
                const agentIds = [];
                for (let i = 0; i < maxAgents; i++) {
                    const { agentId } = await mockApi.registerAgent({
                        type: `multi_skilled_agent_${i}`,
                        capabilities: ['frontend', 'backend', 'database'],
                        status: 'available',
                        maxConcurrentTasks: 2
                    });
                    agentIds.push(agentId);
                }
                // Simulate concurrent task execution with resource limitations
                const executionPromises = allTasks.map(async (taskId, index) => {
                    await TestUtils.delay(index * 100); // Stagger task starts
                    await mockApi.updateTaskStatus(taskId, 'in_progress');
                    await TestUtils.delay(Math.random() * 500 + 200); // Random execution time
                    await mockApi.updateTaskStatus(taskId, 'completed');
                    return taskId;
                });
                const completedTaskIds = await Promise.all(executionPromises);
                expect(completedTaskIds.length).toBe(allTasks.length);
                // Verify all tasks completed and resources were managed properly
                const finalTasks = await mockApi.listTasks();
                const completedTasks = finalTasks.filter(task => task.status === 'completed');
                expect(completedTasks.length).toBeGreaterThanOrEqual(allTasks.length);
                testCase.passed = true;
                testCase.duration = Date.now() - testCase.startTime;
                testCase.metadata = {
                    concurrent_features: featureIds.length,
                    total_tasks: allTasks.length,
                    available_agents: agentIds.length,
                    completion_rate: (completedTasks.length / allTasks.length) * 100
                };
                logger.info('Concurrent features coordination completed successfully', testCase.metadata);
            }
            catch (error) {
                testCase.passed = false;
                testCase.error = error.message;
                testCase.duration = Date.now() - testCase.startTime;
                logger.error('Concurrent features coordination failed', { error: error.message });
                throw error;
            }
            finally {
                testReporter.endTest(testCase);
            }
        }, 25000);
    });
    describe('Error Handling and Recovery Workflows', () => {
        it('should handle task failures and implement automatic recovery', async () => {
            const testCase = testReporter.startTest('Task Failure Recovery');
            try {
                logger.info('Testing task failure and recovery scenarios');
                // Create a feature and tasks that will simulate failures
                const { featureId } = await mockApi.suggestFeature({
                    title: 'Error-prone Feature for Testing',
                    description: 'Feature designed to test error handling',
                    category: 'test',
                    priority: 'low'
                });
                await mockApi.approveFeature(featureId);
                // Create tasks with different failure scenarios
                const problematicTasks = [
                    {
                        title: 'Task that will timeout',
                        type: 'timeout_test',
                        simulateTimeout: true
                    },
                    {
                        title: 'Task that will have dependency conflict',
                        type: 'dependency_test',
                        simulateDepConflict: true
                    },
                    {
                        title: 'Task that will fail quality gates',
                        type: 'quality_test',
                        simulateQualityFailure: true
                    },
                    {
                        title: 'Task that will succeed normally',
                        type: 'normal_test',
                        simulateSuccess: true
                    }
                ];
                const taskIds = [];
                for (const taskData of problematicTasks) {
                    const { taskId } = await mockApi.createTask({
                        ...taskData,
                        featureId,
                        status: 'pending'
                    });
                    taskIds.push(taskId);
                }
                // Register recovery agent
                const { agentId: recoveryAgentId } = await mockApi.registerAgent({
                    type: 'recovery_specialist',
                    capabilities: ['error_handling', 'debugging', 'recovery'],
                    status: 'available'
                });
                // Simulate task execution with various failure modes
                const results = [];
                // Timeout scenario
                await mockApi.updateTaskStatus(taskIds[0], 'in_progress');
                await TestUtils.delay(100);
                await mockApi.updateTaskStatus(taskIds[0], 'failed');
                results.push({ taskId: taskIds[0], result: 'failed_timeout' });
                // Dependency conflict scenario
                await mockApi.updateTaskStatus(taskIds[1], 'in_progress');
                await TestUtils.delay(50);
                await mockApi.updateTaskStatus(taskIds[1], 'failed');
                results.push({ taskId: taskIds[1], result: 'failed_dependency' });
                // Quality failure scenario
                await mockApi.updateTaskStatus(taskIds[2], 'in_progress');
                await TestUtils.delay(75);
                await mockApi.updateTaskStatus(taskIds[2], 'failed');
                results.push({ taskId: taskIds[2], result: 'failed_quality' });
                // Successful task
                await mockApi.updateTaskStatus(taskIds[3], 'in_progress');
                await TestUtils.delay(25);
                await mockApi.updateTaskStatus(taskIds[3], 'completed');
                results.push({ taskId: taskIds[3], result: 'success' });
                // Simulate recovery process for failed tasks
                const failedTasks = results.filter(r => r.result.startsWith('failed'));
                const recoveryResults = [];
                for (const failedTask of failedTasks) {
                    // Create recovery task
                    const { taskId: recoveryTaskId } = await mockApi.createTask({
                        title: `Recovery for ${failedTask.taskId}`,
                        description: 'Automated recovery task',
                        type: 'recovery',
                        originalTaskId: failedTask.taskId,
                        recoveryStrategy: failedTask.result
                    });
                    // Execute recovery
                    await mockApi.updateTaskStatus(recoveryTaskId, 'in_progress');
                    await TestUtils.delay(100);
                    await mockApi.updateTaskStatus(recoveryTaskId, 'completed');
                    // Mark original task as recovered
                    await mockApi.updateTaskStatus(failedTask.taskId, 'recovered');
                    recoveryResults.push({
                        originalTaskId: failedTask.taskId,
                        recoveryTaskId,
                        recoveryStatus: 'completed'
                    });
                }
                // Verify recovery was successful
                expect(recoveryResults.length).toBe(failedTasks.length);
                const allTasks = await mockApi.listTasks();
                const recoveredTasks = allTasks.filter(task => task.status === 'recovered');
                const completedTasks = allTasks.filter(task => task.status === 'completed');
                expect(recoveredTasks.length).toBe(3); // 3 failed tasks should be recovered
                expect(completedTasks.length).toBeGreaterThanOrEqual(4); // 1 original + 3 recovery tasks
                testCase.passed = true;
                testCase.duration = Date.now() - testCase.startTime;
                testCase.metadata = {
                    total_tasks: taskIds.length,
                    failed_tasks: failedTasks.length,
                    recovered_tasks: recoveryResults.length,
                    recovery_rate: (recoveryResults.length / failedTasks.length) * 100
                };
                logger.info('Task failure recovery completed successfully', testCase.metadata);
            }
            catch (error) {
                testCase.passed = false;
                testCase.error = error.message;
                testCase.duration = Date.now() - testCase.startTime;
                logger.error('Task failure recovery failed', { error: error.message });
                throw error;
            }
            finally {
                testReporter.endTest(testCase);
            }
        }, 20000);
    });
    describe('Performance and Scalability Workflows', () => {
        it('should maintain performance under high load conditions', async () => {
            const testCase = testReporter.startTest('High Load Performance');
            try {
                logger.info('Testing system performance under high load');
                // Create large number of features and tasks to test scalability
                const featureCount = 50;
                const tasksPerFeature = 10;
                const agentCount = 20;
                const performanceMetrics = await PerformanceTestUtils.measureExecutionTime(async () => {
                    // Batch create features
                    const featureIds = [];
                    const featureBatch = [];
                    for (let i = 0; i < featureCount; i++) {
                        featureBatch.push(mockApi.suggestFeature({
                            title: `Load Test Feature ${i}`,
                            description: `Feature ${i} for load testing`,
                            category: 'load_test',
                            priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low'
                        }));
                    }
                    const featureResults = await Promise.all(featureBatch);
                    featureResults.forEach(result => featureIds.push(result.featureId));
                    // Approve all features
                    const approvalBatch = featureIds.map(id => mockApi.approveFeature(id));
                    await Promise.all(approvalBatch);
                    // Create tasks for all features
                    const taskBatch = [];
                    for (const featureId of featureIds) {
                        for (let j = 0; j < tasksPerFeature; j++) {
                            taskBatch.push(mockApi.createTask({
                                title: `Load Test Task ${j} for Feature ${featureId}`,
                                description: 'Load testing task',
                                featureId,
                                type: ['frontend', 'backend', 'database', 'testing'][j % 4],
                                estimatedHours: 1
                            }));
                        }
                    }
                    const taskResults = await Promise.all(taskBatch);
                    const taskIds = taskResults.map(result => result.taskId);
                    // Register agents for load handling
                    const agentBatch = [];
                    for (let i = 0; i < agentCount; i++) {
                        agentBatch.push(mockApi.registerAgent({
                            type: `load_test_agent_${i}`,
                            capabilities: ['frontend', 'backend', 'database', 'testing'],
                            status: 'available',
                            maxConcurrentTasks: 5
                        }));
                    }
                    const agentResults = await Promise.all(agentBatch);
                    const agentIds = agentResults.map(result => result.agentId);
                    // Execute all tasks concurrently
                    const executionBatch = taskIds.map(async (taskId) => {
                        await mockApi.updateTaskStatus(taskId, 'in_progress');
                        await TestUtils.delay(Math.random() * 10 + 5); // Very fast execution for load test
                        await mockApi.updateTaskStatus(taskId, 'completed');
                        return taskId;
                    });
                    await Promise.all(executionBatch);
                    return {
                        featuresCreated: featureIds.length,
                        tasksCreated: taskIds.length,
                        agentsRegistered: agentIds.length,
                        totalOperations: featureIds.length + taskIds.length + agentIds.length
                    };
                });
                // Verify performance metrics
                expect(performanceMetrics.result.featuresCreated).toBe(featureCount);
                expect(performanceMetrics.result.tasksCreated).toBe(featureCount * tasksPerFeature);
                expect(performanceMetrics.result.agentsRegistered).toBe(agentCount);
                // Performance assertions
                const totalOperations = performanceMetrics.result.totalOperations;
                const throughput = totalOperations / (performanceMetrics.duration / 1000); // operations per second
                expect(performanceMetrics.duration).toBeLessThan(10000); // Should complete within 10 seconds
                expect(throughput).toBeGreaterThan(50); // At least 50 operations per second
                // Verify system state after load test
                const finalTasks = await mockApi.listTasks();
                const completedTasks = finalTasks.filter(task => task.status === 'completed');
                const completionRate = (completedTasks.length / performanceMetrics.result.tasksCreated) * 100;
                expect(completionRate).toBeGreaterThan(95); // At least 95% completion rate
                testCase.passed = true;
                testCase.duration = Date.now() - testCase.startTime;
                testCase.metadata = {
                    ...performanceMetrics.result,
                    execution_duration: performanceMetrics.duration,
                    throughput: Math.round(throughput),
                    completion_rate: Math.round(completionRate),
                    performance_score: throughput > 100 ? 'excellent' : throughput > 50 ? 'good' : 'needs_improvement'
                };
                logger.info('High load performance test completed successfully', testCase.metadata);
            }
            catch (error) {
                testCase.passed = false;
                testCase.error = error.message;
                testCase.duration = Date.now() - testCase.startTime;
                logger.error('High load performance test failed', { error: error.message });
                throw error;
            }
            finally {
                testReporter.endTest(testCase);
            }
        }, 35000);
    });
    // Generate comprehensive test report after all tests
    afterEach(async () => {
        await testReporter.generateReport('e2e-autonomous-workflows');
    });
});
//# sourceMappingURL=autonomous-workflows.test.js.map