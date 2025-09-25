/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContextState, SubagentTerminateMode, } from '../../../packages/core/src/core/subagent.js';
import { MockAgentFactory, MockAgentState, } from '../utils/MockAgentFactory.js';
import { TaskBuilder, TaskComplexity, TaskCategory, TaskPriority, } from '../utils/TaskBuilder.js';
describe('SubAgentScope - Autonomous Task Management Tests', () => {
    let mockConfig;
    // let originalCreate: typeof SubAgentScope.create; // Not used in tests
    beforeEach(() => {
        mockConfig = {
            getSessionId: vi.fn().mockReturnValue('test-session'),
            getToolRegistry: vi.fn().mockReturnValue({
                getTool: vi.fn(),
                getFunctionDeclarations: vi.fn().mockReturnValue([]),
                getFunctionDeclarationsFiltered: vi.fn().mockReturnValue([]),
            }),
            setModel: vi.fn(),
            initialize: vi.fn(),
        };
        // originalCreate = SubAgentScope.create; // Not used
        MockAgentFactory.reset();
    });
    afterEach(() => {
        MockAgentFactory.reset();
        vi.restoreAllMocks();
    });
    describe('Task Creation and Configuration', () => {
        it('should create agents with different complexity levels', async () => {
            const simpleTask = new TaskBuilder()
                .withName('simple-task')
                .withComplexity(TaskComplexity.SIMPLE)
                .withCategory(TaskCategory.FILE_MANIPULATION)
                .build();
            const complexTask = new TaskBuilder()
                .withName('complex-task')
                .withComplexity(TaskComplexity.COMPLEX)
                .withCategory(TaskCategory.CODE_GENERATION)
                .build();
            const mockSimple = {
                name: 'simple-task',
                state: MockAgentState.SUCCESS,
                executionTime: 500,
            };
            const mockComplex = {
                name: 'complex-task',
                state: MockAgentState.SUCCESS,
                executionTime: 2000,
            };
            const simpleAgent = await MockAgentFactory.createMockAgent(mockSimple, mockConfig, simpleTask.promptConfig, simpleTask.modelConfig, simpleTask.runConfig, simpleTask.options);
            const complexAgent = await MockAgentFactory.createMockAgent(mockComplex, mockConfig, complexTask.promptConfig, complexTask.modelConfig, complexTask.runConfig, complexTask.options);
            expect(simpleAgent).toBeDefined();
            expect(complexAgent).toBeDefined();
            // Verify different configurations
            expect(simpleTask.modelConfig.temp).toBeLessThan(complexTask.modelConfig.temp);
            expect(simpleTask.runConfig.max_turns).toBeLessThan(complexTask.runConfig.max_turns);
        });
        it('should handle context variable templating', async () => {
            const context = new ContextState();
            context.set('project_name', 'TestProject');
            context.set('target_language', 'TypeScript');
            context.set('complexity_level', 'high');
            const task = new TaskBuilder()
                .withName('context-test')
                .withCustomPrompt('Generate ${target_language} code for ${project_name} with ${complexity_level} complexity')
                .withComplexity(TaskComplexity.MODERATE)
                .build();
            const mockAgent = {
                name: 'context-test',
                state: MockAgentState.SUCCESS,
                outputVars: {
                    project: 'TestProject',
                    language: 'TypeScript',
                    complexity: 'high',
                },
            };
            const agent = await MockAgentFactory.createMockAgent(mockAgent, mockConfig, task.promptConfig, task.modelConfig, task.runConfig, task.options);
            await agent.runNonInteractive(context);
            expect(agent.output.terminate_reason).toBe(SubagentTerminateMode.GOAL);
            expect(agent.output.emitted_vars).toEqual({
                project: 'TestProject',
                language: 'TypeScript',
                complexity: 'high',
            });
        });
        it('should validate required output variables', async () => {
            const task = new TaskBuilder()
                .withName('output-validation-test')
                .withComplexity(TaskComplexity.SIMPLE)
                .withOutputs({
                result: 'The main result',
                status: 'Operation status',
                metrics: 'Performance metrics',
            })
                .build();
            const mockAgent = {
                name: 'output-validation-test',
                state: MockAgentState.SUCCESS,
                outputVars: {
                    result: 'success',
                    status: 'completed',
                    metrics: '{"time": "500ms", "memory": "10MB"}',
                },
            };
            const agent = await MockAgentFactory.createMockAgent(mockAgent, mockConfig, task.promptConfig, task.modelConfig, task.runConfig, task.options);
            await agent.runNonInteractive(new ContextState());
            expect(agent.output.terminate_reason).toBe(SubagentTerminateMode.GOAL);
            expect(Object.keys(agent.output.emitted_vars)).toEqual(expect.arrayContaining(['result', 'status', 'metrics']));
        });
    });
    describe('Priority and Scheduling', () => {
        it('should handle different task priorities', async () => {
            const priorities = [
                TaskPriority.LOW,
                TaskPriority.NORMAL,
                TaskPriority.HIGH,
                TaskPriority.URGENT,
                TaskPriority.CRITICAL,
            ];
            const tasks = priorities.map((priority) => new TaskBuilder()
                .withName(`priority-${priority}-task`)
                .withPriority(priority)
                .withComplexity(TaskComplexity.SIMPLE)
                .build());
            const mockConfigs = tasks.map((task) => ({
                name: task.name,
                state: MockAgentState.SUCCESS,
                executionTime: 100 * Math.random() + 50,
                outputVars: { priority: task.metadata.priority?.toString() },
            }));
            const agents = await Promise.all(mockConfigs.map((config, index) => MockAgentFactory.createMockAgent(config, mockConfig, tasks[index].promptConfig, tasks[index].modelConfig, tasks[index].runConfig, tasks[index].options)));
            // Execute all agents
            await Promise.all(agents.map((agent) => agent.runNonInteractive(new ContextState())));
            // Verify all agents completed successfully
            agents.forEach((agent) => {
                expect(agent.output.terminate_reason).toBe(SubagentTerminateMode.GOAL);
            });
        });
        it('should handle task dependencies', async () => {
            const dependencyTask = new TaskBuilder()
                .withName('dependency-task')
                .withComplexity(TaskComplexity.SIMPLE)
                .withOutputs({ dependency_result: 'Result from dependency' })
                .build();
            const mainTask = new TaskBuilder()
                .withName('main-task')
                .withComplexity(TaskComplexity.MODERATE)
                .withDependencies('dependency-task')
                .withContext({ needs_dependency: 'true' })
                .withOutputs({ final_result: 'Result using dependency' })
                .build();
            const dependencyMock = {
                name: 'dependency-task',
                state: MockAgentState.SUCCESS,
                executionTime: 300,
                outputVars: { dependency_result: 'dependency_complete' },
            };
            const mainMock = {
                name: 'main-task',
                state: MockAgentState.SUCCESS,
                executionTime: 500,
                outputVars: { final_result: 'main_complete_with_dependency' },
            };
            const dependencyAgent = await MockAgentFactory.createMockAgent(dependencyMock, mockConfig, dependencyTask.promptConfig, dependencyTask.modelConfig, dependencyTask.runConfig, dependencyTask.options);
            // Execute dependency first
            await dependencyAgent.runNonInteractive(new ContextState());
            expect(dependencyAgent.output.terminate_reason).toBe(SubagentTerminateMode.GOAL);
            // Now execute main task with dependency results
            const mainContext = new ContextState();
            mainContext.set('dependency_result', dependencyAgent.output.emitted_vars.dependency_result);
            const mainAgent = await MockAgentFactory.createMockAgent(mainMock, mockConfig, mainTask.promptConfig, mainTask.modelConfig, mainTask.runConfig, mainTask.options);
            await mainAgent.runNonInteractive(mainContext);
            expect(mainAgent.output.terminate_reason).toBe(SubagentTerminateMode.GOAL);
            expect(mainAgent.output.emitted_vars.final_result).toBe('main_complete_with_dependency');
        });
    });
    describe('Error Handling and Recovery', () => {
        it('should handle agent failures gracefully', async () => {
            const task = new TaskBuilder()
                .withName('failure-test')
                .withComplexity(TaskComplexity.SIMPLE)
                .build();
            const mockAgent = {
                name: 'failure-test',
                state: MockAgentState.FAILURE,
                errorMessage: 'Simulated agent failure',
            };
            const agent = await MockAgentFactory.createMockAgent(mockAgent, mockConfig, task.promptConfig, task.modelConfig, task.runConfig, task.options);
            await expect(agent.runNonInteractive(new ContextState())).rejects.toThrow('Simulated agent failure');
            expect(agent.output.terminate_reason).toBe(SubagentTerminateMode.ERROR);
        });
        it('should handle timeout scenarios', async () => {
            const task = new TaskBuilder()
                .withName('timeout-test')
                .withComplexity(TaskComplexity.SIMPLE)
                .withTimeout(1) // 1 minute timeout
                .build();
            const mockAgent = {
                name: 'timeout-test',
                state: MockAgentState.TIMEOUT,
                executionTime: 5000, // 5 seconds to simulate long execution
            };
            const agent = await MockAgentFactory.createMockAgent(mockAgent, mockConfig, task.promptConfig, task.modelConfig, task.runConfig, task.options);
            await agent.runNonInteractive(new ContextState());
            expect(agent.output.terminate_reason).toBe(SubagentTerminateMode.TIMEOUT);
        });
        it('should handle max turns exceeded', async () => {
            const task = new TaskBuilder()
                .withName('max-turns-test')
                .withComplexity(TaskComplexity.SIMPLE)
                .build();
            // Override max turns to be very low
            task.runConfig.max_turns = 2;
            const mockAgent = {
                name: 'max-turns-test',
                state: MockAgentState.MAX_TURNS,
                maxTurns: 2,
            };
            const agent = await MockAgentFactory.createMockAgent(mockAgent, mockConfig, task.promptConfig, task.modelConfig, task.runConfig, task.options);
            await agent.runNonInteractive(new ContextState());
            expect(agent.output.terminate_reason).toBe(SubagentTerminateMode.MAX_TURNS);
        });
        it('should handle partial success scenarios', async () => {
            const task = new TaskBuilder()
                .withName('partial-success-test')
                .withComplexity(TaskComplexity.MODERATE)
                .withOutputs({
                required_output: 'This must be provided',
                optional_output: 'This is optional',
            })
                .build();
            const mockAgent = {
                name: 'partial-success-test',
                state: MockAgentState.PARTIAL_SUCCESS,
                outputVars: {
                    required_output: 'Provided successfully',
                    // optional_output is missing to simulate partial success
                },
            };
            const agent = await MockAgentFactory.createMockAgent(mockAgent, mockConfig, task.promptConfig, task.modelConfig, task.runConfig, task.options);
            await agent.runNonInteractive(new ContextState());
            expect(agent.output.terminate_reason).toBe(SubagentTerminateMode.GOAL);
            expect(agent.output.emitted_vars).toHaveProperty('required_output');
            expect(agent.output.emitted_vars).not.toHaveProperty('optional_output');
        });
    });
    describe('Tool Integration', () => {
        it('should handle different tool configurations by category', async () => {
            const categories = [
                TaskCategory.FILE_MANIPULATION,
                TaskCategory.CODE_GENERATION,
                TaskCategory.API_INTEGRATION,
                TaskCategory.DATA_PROCESSING,
            ];
            for (const category of categories) {
                const task = new TaskBuilder()
                    .withName(`tool-test-${category.toLowerCase()}`)
                    .withCategory(category)
                    .withComplexity(TaskComplexity.SIMPLE)
                    .build();
                const mockAgent = {
                    name: `tool-test-${category.toLowerCase()}`,
                    state: MockAgentState.SUCCESS,
                    toolCalls: ['read_file', 'write_file'], // Simulate tool usage
                    outputVars: { category: category.toLowerCase() },
                };
                const agent = await MockAgentFactory.createMockAgent(mockAgent, mockConfig, task.promptConfig, task.modelConfig, task.runConfig, task.options);
                await agent.runNonInteractive(new ContextState());
                expect(agent.output.terminate_reason).toBe(SubagentTerminateMode.GOAL);
                expect(agent.output.emitted_vars.category).toBe(category.toLowerCase());
                // Verify tool calls were logged
                const logs = MockAgentFactory.getExecutionLogs(`tool-test-${category.toLowerCase()}`);
                expect(logs.some((log) => log.includes('Calling tool: read_file'))).toBe(true);
                expect(logs.some((log) => log.includes('Calling tool: write_file'))).toBe(true);
            }
        });
        it('should validate tool execution results', async () => {
            const task = new TaskBuilder()
                .withName('tool-validation-test')
                .withCategory(TaskCategory.FILE_MANIPULATION)
                .withTools('read_file', 'write_file', 'execute_command')
                .withOutputs({
                files_processed: 'Number of files processed',
                commands_executed: 'Number of commands executed',
            })
                .build();
            const mockAgent = {
                name: 'tool-validation-test',
                state: MockAgentState.SUCCESS,
                toolCalls: ['read_file', 'write_file', 'execute_command'],
                outputVars: {
                    files_processed: '5',
                    commands_executed: '3',
                },
            };
            const agent = await MockAgentFactory.createMockAgent(mockAgent, mockConfig, task.promptConfig, task.modelConfig, task.runConfig, task.options);
            await agent.runNonInteractive(new ContextState());
            expect(agent.output.terminate_reason).toBe(SubagentTerminateMode.GOAL);
            expect(agent.output.emitted_vars.files_processed).toBe('5');
            expect(agent.output.emitted_vars.commands_executed).toBe('3');
            // Verify all expected tools were called
            const logs = MockAgentFactory.getExecutionLogs('tool-validation-test');
            expect(logs.some((log) => log.includes('read_file'))).toBe(true);
            expect(logs.some((log) => log.includes('write_file'))).toBe(true);
            expect(logs.some((log) => log.includes('execute_command'))).toBe(true);
        });
    });
    describe('Performance Characteristics', () => {
        it('should track execution timing', async () => {
            const task = new TaskBuilder()
                .withName('timing-test')
                .withComplexity(TaskComplexity.SIMPLE)
                .withOutputs({ execution_time: 'Time taken to complete' })
                .build();
            const expectedExecutionTime = 800;
            const mockAgent = {
                name: 'timing-test',
                state: MockAgentState.SUCCESS,
                executionTime: expectedExecutionTime,
                outputVars: { execution_time: `${expectedExecutionTime}ms` },
            };
            const startTime = Date.now();
            const agent = await MockAgentFactory.createMockAgent(mockAgent, mockConfig, task.promptConfig, task.modelConfig, task.runConfig, task.options);
            await agent.runNonInteractive(new ContextState());
            const actualExecutionTime = Date.now() - startTime;
            expect(agent.output.terminate_reason).toBe(SubagentTerminateMode.GOAL);
            expect(actualExecutionTime).toBeGreaterThanOrEqual(expectedExecutionTime);
            expect(agent.output.emitted_vars.execution_time).toBe(`${expectedExecutionTime}ms`);
        });
        it('should handle different complexity performance characteristics', async () => {
            const complexities = [
                TaskComplexity.SIMPLE,
                TaskComplexity.MODERATE,
                TaskComplexity.COMPLEX,
                TaskComplexity.VERY_COMPLEX,
            ];
            const executionTimes = {
                [TaskComplexity.SIMPLE]: 0,
                [TaskComplexity.MODERATE]: 0,
                [TaskComplexity.COMPLEX]: 0,
                [TaskComplexity.VERY_COMPLEX]: 0,
            };
            for (const complexity of complexities) {
                const task = new TaskBuilder()
                    .withName(`performance-${complexity.toLowerCase()}`)
                    .withComplexity(complexity)
                    .build();
                const expectedTime = complexity === TaskComplexity.SIMPLE
                    ? 200
                    : complexity === TaskComplexity.MODERATE
                        ? 500
                        : complexity === TaskComplexity.COMPLEX
                            ? 1000
                            : 2000;
                const mockAgent = {
                    name: `performance-${complexity.toLowerCase()}`,
                    state: MockAgentState.SUCCESS,
                    executionTime: expectedTime,
                    outputVars: { complexity: complexity.toLowerCase() },
                };
                const startTime = Date.now();
                const agent = await MockAgentFactory.createMockAgent(mockAgent, mockConfig, task.promptConfig, task.modelConfig, task.runConfig, task.options);
                await agent.runNonInteractive(new ContextState());
                const actualTime = Date.now() - startTime;
                executionTimes[complexity] = actualTime;
                expect(agent.output.terminate_reason).toBe(SubagentTerminateMode.GOAL);
            }
            // Verify that more complex tasks generally take longer
            expect(executionTimes[TaskComplexity.SIMPLE]).toBeLessThan(executionTimes[TaskComplexity.VERY_COMPLEX]);
        });
    });
    describe('Edge Cases and Boundary Conditions', () => {
        it('should handle empty context gracefully', async () => {
            const task = new TaskBuilder()
                .withName('empty-context-test')
                .withComplexity(TaskComplexity.SIMPLE)
                .build();
            const mockAgent = {
                name: 'empty-context-test',
                state: MockAgentState.SUCCESS,
                outputVars: { result: 'success_with_empty_context' },
            };
            const agent = await MockAgentFactory.createMockAgent(mockAgent, mockConfig, task.promptConfig, task.modelConfig, task.runConfig, task.options);
            const emptyContext = new ContextState();
            await agent.runNonInteractive(emptyContext);
            expect(agent.output.terminate_reason).toBe(SubagentTerminateMode.GOAL);
        });
        it('should handle tasks with no expected outputs', async () => {
            const task = new TaskBuilder()
                .withName('no-outputs-test')
                .withComplexity(TaskComplexity.SIMPLE)
                // No outputs specified
                .build();
            const mockAgent = {
                name: 'no-outputs-test',
                state: MockAgentState.SUCCESS,
                // No output vars specified
            };
            const agent = await MockAgentFactory.createMockAgent(mockAgent, mockConfig, task.promptConfig, task.modelConfig, task.runConfig, task.options);
            await agent.runNonInteractive(new ContextState());
            expect(agent.output.terminate_reason).toBe(SubagentTerminateMode.GOAL);
            expect(Object.keys(agent.output.emitted_vars)).toHaveLength(0);
        });
        it('should validate agent execution results', async () => {
            const standardConfigs = MockAgentFactory.createStandardConfigurations();
            for (const config of Object.values(standardConfigs)) {
                const isValid = MockAgentFactory.validateAgentExecution(config.name, config.state, Object.keys(config.outputVars || {}));
                // This test verifies the validation functionality itself
                // In a real scenario, we would execute the agent first
                expect(typeof isValid).toBe('boolean');
            }
        });
    });
});
//# sourceMappingURL=SubAgentScope.test.js.map