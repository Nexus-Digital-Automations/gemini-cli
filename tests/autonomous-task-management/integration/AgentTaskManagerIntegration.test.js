/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SubAgentScope, ContextState, SubagentTerminateMode, } from '../../../packages/core/src/core/subagent.js';
import { MockAgentFactory, MockAgentState } from '../utils/MockAgentFactory.js';
import { TaskBuilder, TaskComplexity, TaskCategory, TaskPriority } from '../utils/TaskBuilder.js';
/**
 * Mock TaskManager for testing integration with SubAgent system
 */
class MockTaskManager {
    tasks = new Map();
    agents = new Map();
    executionQueue = [];
    completedTasks = [];
    failedTasks = [];
    async createTask(taskConfig) {
        const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        this.tasks.set(taskId, {
            id: taskId,
            ...taskConfig,
            status: 'created',
            createdAt: new Date(),
        });
        this.executionQueue.push(taskId);
        return taskId;
    }
    async assignAgentToTask(taskId, agent) {
        const task = this.tasks.get(taskId);
        if (!task) {
            throw new Error(`Task ${taskId} not found`);
        }
        this.agents.set(taskId, agent);
        task.status = 'assigned';
        task.assignedAgent = agent.name;
    }
    async executeTask(taskId, context) {
        const task = this.tasks.get(taskId);
        const agent = this.agents.get(taskId);
        if (!task || !agent) {
            throw new Error(`Task ${taskId} or agent not found`);
        }
        task.status = 'executing';
        task.startTime = new Date();
        try {
            await agent.runNonInteractive(context || new ContextState());
            if (agent.output.terminate_reason === SubagentTerminateMode.GOAL) {
                task.status = 'completed';
                task.result = agent.output.emitted_vars;
                this.completedTasks.push(taskId);
            }
            else {
                task.status = 'failed';
                task.error = `Agent terminated with reason: ${agent.output.terminate_reason}`;
                this.failedTasks.push(taskId);
            }
            task.endTime = new Date();
            return task;
        }
        catch (error) {
            task.status = 'failed';
            task.error = error.message;
            task.endTime = new Date();
            this.failedTasks.push(taskId);
            throw error;
        }
    }
    async executeBatch(taskIds, maxConcurrency = 3) {
        const results = [];
        const executing = [];
        for (const taskId of taskIds) {
            if (executing.length >= maxConcurrency) {
                // Wait for one to complete before starting the next
                const completed = await Promise.race(executing);
                results.push(completed);
                const index = executing.findIndex(p => p === completed);
                executing.splice(index, 1);
            }
            executing.push(this.executeTask(taskId));
        }
        // Wait for remaining tasks
        const remaining = await Promise.all(executing);
        results.push(...remaining);
        return results;
    }
    getTaskStatus(taskId) {
        return this.tasks.get(taskId)?.status;
    }
    getCompletedTasks() {
        return [...this.completedTasks];
    }
    getFailedTasks() {
        return [...this.failedTasks];
    }
    getAllTasks() {
        return new Map(this.tasks);
    }
    reset() {
        this.tasks.clear();
        this.agents.clear();
        this.executionQueue.length = 0;
        this.completedTasks.length = 0;
        this.failedTasks.length = 0;
    }
}
describe('Agent-TaskManager Integration Tests', () => {
    let mockConfig;
    let taskManager;
    beforeEach(() => {
        mockConfig = {
            getSessionId: vi.fn().mockReturnValue('integration-test-session'),
            getToolRegistry: vi.fn().mockReturnValue({
                getTool: vi.fn(),
                getFunctionDeclarations: vi.fn().mockReturnValue([]),
                getFunctionDeclarationsFiltered: vi.fn().mockReturnValue([]),
            }),
            setModel: vi.fn(),
            initialize: vi.fn(),
        };
        taskManager = new MockTaskManager();
        MockAgentFactory.reset();
    });
    afterEach(() => {
        taskManager.reset();
        MockAgentFactory.reset();
        vi.restoreAllMocks();
    });
    describe('Basic Task-Agent Integration', () => {
        it('should create and assign tasks to agents', async () => {
            const taskConfig = new TaskBuilder()
                .withName('integration-test-task')
                .withComplexity(TaskComplexity.SIMPLE)
                .withOutputs({ result: 'Task completion result' })
                .build();
            const mockAgentConfig = {
                name: 'integration-test-agent',
                state: MockAgentState.SUCCESS,
                outputVars: { result: 'Integration test successful' },
            };
            // Create task
            const taskId = await taskManager.createTask(taskConfig);
            expect(taskId).toBeTruthy();
            expect(taskManager.getTaskStatus(taskId)).toBe('created');
            // Create and assign agent
            const agent = await MockAgentFactory.createMockAgent(mockAgentConfig, mockConfig, taskConfig.promptConfig, taskConfig.modelConfig, taskConfig.runConfig, taskConfig.options);
            await taskManager.assignAgentToTask(taskId, agent);
            expect(taskManager.getTaskStatus(taskId)).toBe('assigned');
            // Execute task
            const result = await taskManager.executeTask(taskId);
            expect(result.status).toBe('completed');
            expect(result.result).toEqual({ result: 'Integration test successful' });
            expect(taskManager.getCompletedTasks()).toContain(taskId);
        });
        it('should handle task failures gracefully', async () => {
            const taskConfig = new TaskBuilder()
                .withName('failing-task')
                .withComplexity(TaskComplexity.SIMPLE)
                .build();
            const mockAgentConfig = {
                name: 'failing-agent',
                state: MockAgentState.FAILURE,
                errorMessage: 'Intentional failure for testing',
            };
            const taskId = await taskManager.createTask(taskConfig);
            const agent = await MockAgentFactory.createMockAgent(mockAgentConfig, mockConfig, taskConfig.promptConfig, taskConfig.modelConfig, taskConfig.runConfig, taskConfig.options);
            await taskManager.assignAgentToTask(taskId, agent);
            await expect(taskManager.executeTask(taskId)).rejects.toThrow('Intentional failure for testing');
            expect(taskManager.getTaskStatus(taskId)).toBe('failed');
            expect(taskManager.getFailedTasks()).toContain(taskId);
        });
        it('should handle timeout scenarios', async () => {
            const taskConfig = new TaskBuilder()
                .withName('timeout-task')
                .withComplexity(TaskComplexity.SIMPLE)
                .withTimeout(1) // Very short timeout
                .build();
            const mockAgentConfig = {
                name: 'timeout-agent',
                state: MockAgentState.TIMEOUT,
                executionTime: 2000, // 2 seconds
            };
            const taskId = await taskManager.createTask(taskConfig);
            const agent = await MockAgentFactory.createMockAgent(mockAgentConfig, mockConfig, taskConfig.promptConfig, taskConfig.modelConfig, taskConfig.runConfig, taskConfig.options);
            await taskManager.assignAgentToTask(taskId, agent);
            const result = await taskManager.executeTask(taskId);
            expect(result.status).toBe('failed');
            expect(result.error).toContain('TIMEOUT');
        });
    });
    describe('Context Passing and Data Flow', () => {
        it('should pass context between TaskManager and Agent', async () => {
            const taskConfig = new TaskBuilder()
                .withName('context-flow-task')
                .withCustomPrompt('Process the project ${project_name} with priority ${priority_level}')
                .withOutputs({
                processed_project: 'Name of processed project',
                priority_used: 'Priority level that was used',
            })
                .build();
            const mockAgentConfig = {
                name: 'context-agent',
                state: MockAgentState.SUCCESS,
                outputVars: {
                    processed_project: 'TestProject',
                    priority_used: 'high',
                },
            };
            const context = new ContextState();
            context.set('project_name', 'TestProject');
            context.set('priority_level', 'high');
            context.set('user_id', 'user_123');
            const taskId = await taskManager.createTask(taskConfig);
            const agent = await MockAgentFactory.createMockAgent(mockAgentConfig, mockConfig, taskConfig.promptConfig, taskConfig.modelConfig, taskConfig.runConfig, taskConfig.options);
            await taskManager.assignAgentToTask(taskId, agent);
            const result = await taskManager.executeTask(taskId, context);
            expect(result.status).toBe('completed');
            expect(result.result.processed_project).toBe('TestProject');
            expect(result.result.priority_used).toBe('high');
        });
        it('should handle context updates from agent execution', async () => {
            const taskConfig = new TaskBuilder()
                .withName('context-update-task')
                .withOutputs({
                new_context_var: 'Variable added by agent',
                updated_var: 'Updated existing variable',
            })
                .build();
            const mockAgentConfig = {
                name: 'context-update-agent',
                state: MockAgentState.SUCCESS,
                outputVars: {
                    new_context_var: 'Added by agent',
                    updated_var: 'Modified existing value',
                },
            };
            const context = new ContextState();
            context.set('existing_var', 'original_value');
            const taskId = await taskManager.createTask(taskConfig);
            const agent = await MockAgentFactory.createMockAgent(mockAgentConfig, mockConfig, taskConfig.promptConfig, taskConfig.modelConfig, taskConfig.runConfig, taskConfig.options);
            await taskManager.assignAgentToTask(taskId, agent);
            const result = await taskManager.executeTask(taskId, context);
            expect(result.status).toBe('completed');
            expect(result.result.new_context_var).toBe('Added by agent');
            expect(result.result.updated_var).toBe('Modified existing value');
            // Original context should remain unchanged (isolation)
            expect(context.get('existing_var')).toBe('original_value');
        });
    });
    describe('Multi-Agent Coordination', () => {
        it('should coordinate multiple agents working on related tasks', async () => {
            const preparationTask = new TaskBuilder()
                .withName('preparation-task')
                .withComplexity(TaskComplexity.SIMPLE)
                .withCategory(TaskCategory.FILE_MANIPULATION)
                .withOutputs({ prepared_data: 'Data prepared for processing' })
                .build();
            const processingTask = new TaskBuilder()
                .withName('processing-task')
                .withComplexity(TaskComplexity.MODERATE)
                .withCategory(TaskCategory.DATA_PROCESSING)
                .withDependencies('preparation-task')
                .withOutputs({ processed_result: 'Final processed result' })
                .build();
            const preparationAgent = {
                name: 'preparation-agent',
                state: MockAgentState.SUCCESS,
                executionTime: 300,
                outputVars: { prepared_data: 'data_ready_for_processing' },
            };
            const processingAgent = {
                name: 'processing-agent',
                state: MockAgentState.SUCCESS,
                executionTime: 500,
                outputVars: { processed_result: 'processing_complete' },
            };
            // Create tasks
            const prepTaskId = await taskManager.createTask(preparationTask);
            const procTaskId = await taskManager.createTask(processingTask);
            // Create agents
            const prepAgent = await MockAgentFactory.createMockAgent(preparationAgent, mockConfig, preparationTask.promptConfig, preparationTask.modelConfig, preparationTask.runConfig, preparationTask.options);
            const procAgent = await MockAgentFactory.createMockAgent(processingAgent, mockConfig, processingTask.promptConfig, processingTask.modelConfig, processingTask.runConfig, processingTask.options);
            // Assign agents
            await taskManager.assignAgentToTask(prepTaskId, prepAgent);
            await taskManager.assignAgentToTask(procTaskId, procAgent);
            // Execute preparation task first
            const prepResult = await taskManager.executeTask(prepTaskId);
            expect(prepResult.status).toBe('completed');
            // Execute processing task with preparation results
            const procContext = new ContextState();
            procContext.set('prepared_data', prepResult.result.prepared_data);
            const procResult = await taskManager.executeTask(procTaskId, procContext);
            expect(procResult.status).toBe('completed');
            expect(procResult.result.processed_result).toBe('processing_complete');
        });
        it('should handle concurrent task execution', async () => {
            const taskConfigs = ['task1', 'task2', 'task3', 'task4'].map(name => new TaskBuilder()
                .withName(name)
                .withComplexity(TaskComplexity.SIMPLE)
                .withOutputs({ result: `Result from ${name}` })
                .build());
            const agentConfigs = taskConfigs.map(config => ({
                name: `${config.name}-agent`,
                state: MockAgentState.SUCCESS,
                executionTime: Math.random() * 500 + 200, // Random execution time
                outputVars: { result: `${config.name}_completed` },
            }));
            // Create tasks and agents
            const taskIds = [];
            for (let i = 0; i < taskConfigs.length; i++) {
                const taskId = await taskManager.createTask(taskConfigs[i]);
                taskIds.push(taskId);
                const agent = await MockAgentFactory.createMockAgent(agentConfigs[i], mockConfig, taskConfigs[i].promptConfig, taskConfigs[i].modelConfig, taskConfigs[i].runConfig, taskConfigs[i].options);
                await taskManager.assignAgentToTask(taskId, agent);
            }
            // Execute tasks concurrently
            const startTime = Date.now();
            const results = await taskManager.executeBatch(taskIds, 2); // Max 2 concurrent
            const totalTime = Date.now() - startTime;
            // All tasks should complete successfully
            expect(results).toHaveLength(4);
            results.forEach(result => {
                expect(result.status).toBe('completed');
            });
            expect(taskManager.getCompletedTasks()).toHaveLength(4);
            expect(taskManager.getFailedTasks()).toHaveLength(0);
            // Should be faster than sequential execution due to concurrency
            expect(totalTime).toBeLessThan(2000); // Should complete in reasonable time
        });
    });
    describe('Error Handling and Recovery', () => {
        it('should handle partial failures in multi-agent scenarios', async () => {
            const successTask = new TaskBuilder()
                .withName('success-task')
                .withOutputs({ result: 'Success result' })
                .build();
            const failureTask = new TaskBuilder()
                .withName('failure-task')
                .withOutputs({ result: 'This will not be produced' })
                .build();
            const successAgent = {
                name: 'success-agent',
                state: MockAgentState.SUCCESS,
                outputVars: { result: 'success_achieved' },
            };
            const failureAgent = {
                name: 'failure-agent',
                state: MockAgentState.FAILURE,
                errorMessage: 'Simulated agent failure',
            };
            // Create tasks and agents
            const successTaskId = await taskManager.createTask(successTask);
            const failureTaskId = await taskManager.createTask(failureTask);
            const successAgentInstance = await MockAgentFactory.createMockAgent(successAgent, mockConfig, successTask.promptConfig, successTask.modelConfig, successTask.runConfig, successTask.options);
            const failureAgentInstance = await MockAgentFactory.createMockAgent(failureAgent, mockConfig, failureTask.promptConfig, failureTask.modelConfig, failureTask.runConfig, failureTask.options);
            await taskManager.assignAgentToTask(successTaskId, successAgentInstance);
            await taskManager.assignAgentToTask(failureTaskId, failureAgentInstance);
            // Execute both tasks
            const successResult = await taskManager.executeTask(successTaskId);
            await expect(taskManager.executeTask(failureTaskId)).rejects.toThrow('Simulated agent failure');
            // Verify partial success
            expect(successResult.status).toBe('completed');
            expect(taskManager.getCompletedTasks()).toContain(successTaskId);
            expect(taskManager.getFailedTasks()).toContain(failureTaskId);
            expect(taskManager.getCompletedTasks()).toHaveLength(1);
            expect(taskManager.getFailedTasks()).toHaveLength(1);
        });
        it('should provide detailed error information for debugging', async () => {
            const complexTask = new TaskBuilder()
                .withName('complex-failing-task')
                .withComplexity(TaskComplexity.COMPLEX)
                .withCategory(TaskCategory.CODE_GENERATION)
                .withTools('write_file', 'execute_command')
                .withOutputs({
                generated_code: 'Generated code content',
                test_results: 'Test execution results',
            })
                .build();
            const failureAgent = {
                name: 'complex-failure-agent',
                state: MockAgentState.FAILURE,
                errorMessage: 'Code generation failed: syntax error in generated TypeScript',
                toolCalls: ['write_file', 'execute_command'], // Simulate some tools were called
            };
            const taskId = await taskManager.createTask(complexTask);
            const agent = await MockAgentFactory.createMockAgent(failureAgent, mockConfig, complexTask.promptConfig, complexTask.modelConfig, complexTask.runConfig, complexTask.options);
            await taskManager.assignAgentToTask(taskId, agent);
            let caughtError;
            try {
                await taskManager.executeTask(taskId);
            }
            catch (error) {
                caughtError = error;
            }
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain('syntax error in generated TypeScript');
            const task = taskManager.getAllTasks().get(taskId);
            expect(task.status).toBe('failed');
            expect(task.error).toContain('syntax error in generated TypeScript');
            expect(task.startTime).toBeDefined();
            expect(task.endTime).toBeDefined();
            // Verify execution logs contain tool calls
            const logs = MockAgentFactory.getExecutionLogs('complex-failure-agent');
            expect(logs.some(log => log.includes('write_file'))).toBe(true);
            expect(logs.some(log => log.includes('execute_command'))).toBe(true);
        });
    });
    describe('Performance and Resource Management', () => {
        it('should track execution metrics', async () => {
            const performanceTask = new TaskBuilder()
                .withName('performance-task')
                .withComplexity(TaskComplexity.MODERATE)
                .withOutputs({ performance_metrics: 'Execution performance data' })
                .build();
            const performanceAgent = {
                name: 'performance-agent',
                state: MockAgentState.SUCCESS,
                executionTime: 750, // Controlled execution time
                outputVars: { performance_metrics: 'execution_time:750ms,memory:50MB' },
            };
            const taskId = await taskManager.createTask(performanceTask);
            const agent = await MockAgentFactory.createMockAgent(performanceAgent, mockConfig, performanceTask.promptConfig, performanceTask.modelConfig, performanceTask.runConfig, performanceTask.options);
            await taskManager.assignAgentToTask(taskId, agent);
            const startTime = Date.now();
            const result = await taskManager.executeTask(taskId);
            const actualExecutionTime = Date.now() - startTime;
            expect(result.status).toBe('completed');
            expect(result.startTime).toBeDefined();
            expect(result.endTime).toBeDefined();
            // Execution time should be approximately what we configured
            expect(actualExecutionTime).toBeGreaterThanOrEqual(750);
            expect(actualExecutionTime).toBeLessThan(1000); // Allow some overhead
        });
        it('should handle resource constraints gracefully', async () => {
            // Create multiple resource-intensive tasks
            const intensiveTasks = Array.from({ length: 5 }, (_, i) => new TaskBuilder()
                .withName(`intensive-task-${i}`)
                .withComplexity(TaskComplexity.COMPLEX)
                .withDuration(5) // 5-minute expected duration
                .withOutputs({ result: `Result from intensive task ${i}` })
                .build());
            const agentConfigs = intensiveTasks.map((task, i) => ({
                name: `intensive-agent-${i}`,
                state: MockAgentState.SUCCESS,
                executionTime: 400 + (i * 50), // Staggered execution times
                outputVars: { result: `intensive_task_${i}_completed` },
            }));
            // Create tasks and agents
            const taskIds = [];
            for (let i = 0; i < intensiveTasks.length; i++) {
                const taskId = await taskManager.createTask(intensiveTasks[i]);
                taskIds.push(taskId);
                const agent = await MockAgentFactory.createMockAgent(agentConfigs[i], mockConfig, intensiveTasks[i].promptConfig, intensiveTasks[i].modelConfig, intensiveTasks[i].runConfig, intensiveTasks[i].options);
                await taskManager.assignAgentToTask(taskId, agent);
            }
            // Execute with limited concurrency to simulate resource constraints
            const results = await taskManager.executeBatch(taskIds, 2); // Only 2 concurrent
            // All tasks should eventually complete despite resource constraints
            expect(results).toHaveLength(5);
            results.forEach((result, i) => {
                expect(result.status).toBe('completed');
                expect(result.result.result).toBe(`intensive_task_${i}_completed`);
            });
            expect(taskManager.getCompletedTasks()).toHaveLength(5);
            expect(taskManager.getFailedTasks()).toHaveLength(0);
        });
    });
});
//# sourceMappingURL=AgentTaskManagerIntegration.test.js.map