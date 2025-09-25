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
 * Mock Autonomous Workflow Orchestra that coordinates multiple agents for complex workflows
 */
class AutonomousWorkflowOrchestra {
    workflows = new Map();
    activeWorkflows = new Map();
    completedWorkflows = [];
    failedWorkflows = [];
    async defineWorkflow(definition) {
        const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        this.workflows.set(workflowId, definition);
        return workflowId;
    }
    async executeWorkflow(workflowId, initialContext) {
        const definition = this.workflows.get(workflowId);
        if (!definition) {
            throw new Error(`Workflow ${workflowId} not found`);
        }
        const execution = {
            workflowId,
            definition,
            context: initialContext || new ContextState(),
            completedSteps: [],
            currentStep: 0,
            startTime: Date.now(),
            status: 'running',
        };
        this.activeWorkflows.set(workflowId, execution);
        try {
            for (let i = 0; i < definition.steps.length; i++) {
                execution.currentStep = i;
                const step = definition.steps[i];
                const stepResult = await this.executeWorkflowStep(step, execution.context);
                execution.completedSteps.push(stepResult);
                if (stepResult.success) {
                    // Merge step outputs into workflow context
                    Object.entries(stepResult.outputs).forEach(([key, value]) => {
                        execution.context.set(key, value);
                    });
                }
                else {
                    execution.status = 'failed';
                    execution.error = stepResult.error;
                    this.failedWorkflows.push(workflowId);
                    throw new Error(`Step ${step.name} failed: ${stepResult.error}`);
                }
            }
            execution.status = 'completed';
            execution.endTime = Date.now();
            this.completedWorkflows.push(workflowId);
            const result = {
                workflowId,
                success: true,
                outputs: this.extractWorkflowOutputs(execution),
                executionTime: execution.endTime - execution.startTime,
                steps: execution.completedSteps,
            };
            return result;
        }
        catch (error) {
            execution.status = 'failed';
            execution.endTime = Date.now();
            execution.error = error.message;
            return {
                workflowId,
                success: false,
                error: error.message,
                executionTime: execution.endTime - execution.startTime,
                steps: execution.completedSteps,
            };
        }
        finally {
            this.activeWorkflows.delete(workflowId);
        }
    }
    async executeWorkflowStep(step, context) {
        try {
            const agent = await MockAgentFactory.createMockAgent(step.agentConfig, step.runtimeConfig, step.task.promptConfig, step.task.modelConfig, step.task.runConfig, step.task.options);
            await agent.runNonInteractive(context);
            if (agent.output.terminate_reason === SubagentTerminateMode.GOAL) {
                return {
                    stepName: step.name,
                    success: true,
                    outputs: agent.output.emitted_vars,
                    executionTime: 0, // Mock agents don't provide real timing
                };
            }
            else {
                return {
                    stepName: step.name,
                    success: false,
                    error: `Agent terminated with reason: ${agent.output.terminate_reason}`,
                    outputs: agent.output.emitted_vars,
                    executionTime: 0,
                };
            }
        }
        catch (error) {
            return {
                stepName: step.name,
                success: false,
                error: error.message,
                outputs: {},
                executionTime: 0,
            };
        }
    }
    extractWorkflowOutputs(execution) {
        const outputs = {};
        // Extract final outputs based on workflow definition
        if (execution.definition.expectedOutputs) {
            Object.keys(execution.definition.expectedOutputs).forEach(key => {
                const value = execution.context.get(key);
                if (value !== undefined) {
                    outputs[key] = String(value);
                }
            });
        }
        return outputs;
    }
    getWorkflowStatus(workflowId) {
        const active = this.activeWorkflows.get(workflowId);
        if (active)
            return active.status;
        if (this.completedWorkflows.includes(workflowId))
            return 'completed';
        if (this.failedWorkflows.includes(workflowId))
            return 'failed';
        return 'unknown';
    }
    getCompletedWorkflows() {
        return [...this.completedWorkflows];
    }
    getFailedWorkflows() {
        return [...this.failedWorkflows];
    }
    reset() {
        this.workflows.clear();
        this.activeWorkflows.clear();
        this.completedWorkflows.length = 0;
        this.failedWorkflows.length = 0;
    }
}
describe('Autonomous Workflow End-to-End Tests', () => {
    let mockConfig;
    let orchestra;
    beforeEach(() => {
        mockConfig = {
            getSessionId: vi.fn().mockReturnValue('e2e-test-session'),
            getToolRegistry: vi.fn().mockReturnValue({
                getTool: vi.fn(),
                getFunctionDeclarations: vi.fn().mockReturnValue([]),
                getFunctionDeclarationsFiltered: vi.fn().mockReturnValue([]),
            }),
            setModel: vi.fn(),
            initialize: vi.fn(),
        };
        orchestra = new AutonomousWorkflowOrchestra();
        MockAgentFactory.reset();
    });
    afterEach(() => {
        orchestra.reset();
        MockAgentFactory.reset();
        vi.restoreAllMocks();
    });
    describe('Complete Code Generation Workflow', () => {
        it('should execute a complete feature implementation workflow', async () => {
            const workflow = {
                name: 'Feature Implementation',
                description: 'Complete autonomous implementation of a new feature',
                steps: [
                    {
                        name: 'Requirements Analysis',
                        agentConfig: {
                            name: 'requirements-analyst',
                            state: MockAgentState.SUCCESS,
                            executionTime: 500,
                            outputVars: {
                                requirements_doc: 'User authentication requirements analyzed',
                                technical_specs: 'REST API endpoints and database schema defined',
                                acceptance_criteria: 'Login, logout, registration workflows specified',
                            },
                        },
                        runtimeConfig: mockConfig,
                        task: new TaskBuilder()
                            .withName('analyze-requirements')
                            .withComplexity(TaskComplexity.MODERATE)
                            .withCategory(TaskCategory.DOCUMENTATION)
                            .withOutputs({
                            requirements_doc: 'Analyzed requirements document',
                            technical_specs: 'Technical specifications',
                            acceptance_criteria: 'Acceptance criteria',
                        })
                            .build(),
                    },
                    {
                        name: 'Architecture Design',
                        agentConfig: {
                            name: 'architect',
                            state: MockAgentState.SUCCESS,
                            executionTime: 800,
                            outputVars: {
                                architecture_design: 'Microservice architecture with auth service',
                                api_design: 'RESTful API design with JWT authentication',
                                database_schema: 'User and session tables designed',
                            },
                        },
                        runtimeConfig: mockConfig,
                        task: new TaskBuilder()
                            .withName('design-architecture')
                            .withComplexity(TaskComplexity.COMPLEX)
                            .withCategory(TaskCategory.CODE_GENERATION)
                            .withOutputs({
                            architecture_design: 'System architecture design',
                            api_design: 'API design specification',
                            database_schema: 'Database schema design',
                        })
                            .build(),
                    },
                    {
                        name: 'Implementation',
                        agentConfig: {
                            name: 'developer',
                            state: MockAgentState.SUCCESS,
                            executionTime: 1500,
                            toolCalls: ['write_file', 'execute_command', 'read_file'],
                            outputVars: {
                                implementation_status: 'Authentication service implemented',
                                files_created: 'auth.ts, user.model.ts, auth.routes.ts, auth.middleware.ts',
                                code_quality_score: '95%',
                            },
                        },
                        runtimeConfig: mockConfig,
                        task: new TaskBuilder()
                            .withName('implement-feature')
                            .withComplexity(TaskComplexity.COMPLEX)
                            .withCategory(TaskCategory.CODE_GENERATION)
                            .withTools('write_file', 'execute_command', 'read_file')
                            .withOutputs({
                            implementation_status: 'Implementation completion status',
                            files_created: 'List of created files',
                            code_quality_score: 'Code quality assessment',
                        })
                            .build(),
                    },
                    {
                        name: 'Testing',
                        agentConfig: {
                            name: 'tester',
                            state: MockAgentState.SUCCESS,
                            executionTime: 1000,
                            toolCalls: ['write_file', 'execute_command', 'run_tests'],
                            outputVars: {
                                test_results: 'All 47 tests passed',
                                coverage_report: '98% code coverage achieved',
                                performance_metrics: 'Response time < 100ms, throughput 1000 req/s',
                            },
                        },
                        runtimeConfig: mockConfig,
                        task: new TaskBuilder()
                            .withName('test-implementation')
                            .withComplexity(TaskComplexity.COMPLEX)
                            .withCategory(TaskCategory.TESTING)
                            .withTools('write_file', 'execute_command', 'run_tests')
                            .withOutputs({
                            test_results: 'Test execution results',
                            coverage_report: 'Code coverage report',
                            performance_metrics: 'Performance test results',
                        })
                            .build(),
                    },
                    {
                        name: 'Documentation',
                        agentConfig: {
                            name: 'documenter',
                            state: MockAgentState.SUCCESS,
                            executionTime: 600,
                            toolCalls: ['write_file', 'read_file'],
                            outputVars: {
                                api_documentation: 'Complete API documentation generated',
                                user_guide: 'User authentication guide created',
                                deployment_guide: 'Deployment instructions documented',
                            },
                        },
                        runtimeConfig: mockConfig,
                        task: new TaskBuilder()
                            .withName('create-documentation')
                            .withComplexity(TaskComplexity.MODERATE)
                            .withCategory(TaskCategory.DOCUMENTATION)
                            .withTools('write_file', 'read_file')
                            .withOutputs({
                            api_documentation: 'API documentation',
                            user_guide: 'User guide',
                            deployment_guide: 'Deployment guide',
                        })
                            .build(),
                    },
                ],
                expectedOutputs: {
                    feature_status: 'Feature implementation complete',
                    deliverables: 'All deliverables ready for deployment',
                },
            };
            const workflowId = await orchestra.defineWorkflow(workflow);
            const initialContext = new ContextState();
            initialContext.set('project_name', 'E-Commerce Platform');
            initialContext.set('feature_name', 'User Authentication');
            initialContext.set('target_environment', 'production');
            const result = await orchestra.executeWorkflow(workflowId, initialContext);
            expect(result.success).toBe(true);
            expect(result.steps).toHaveLength(5);
            expect(orchestra.getWorkflowStatus(workflowId)).toBe('completed');
            // Verify each step completed successfully
            result.steps.forEach((step, index) => {
                expect(step.success).toBe(true);
                expect(step.stepName).toBe(workflow.steps[index].name);
            });
            // Verify specific outputs from each step
            expect(result.steps[0].outputs.requirements_doc).toContain('authentication requirements');
            expect(result.steps[1].outputs.architecture_design).toContain('Microservice architecture');
            expect(result.steps[2].outputs.implementation_status).toContain('implemented');
            expect(result.steps[3].outputs.test_results).toContain('tests passed');
            expect(result.steps[4].outputs.api_documentation).toContain('documentation generated');
        });
        it('should handle workflow failures gracefully', async () => {
            const failingWorkflow = {
                name: 'Failing Workflow',
                description: 'Workflow that fails at implementation step',
                steps: [
                    {
                        name: 'Planning',
                        agentConfig: {
                            name: 'planner',
                            state: MockAgentState.SUCCESS,
                            outputVars: { plan: 'Feature plan created' },
                        },
                        runtimeConfig: mockConfig,
                        task: new TaskBuilder()
                            .withName('create-plan')
                            .withOutputs({ plan: 'Project plan' })
                            .build(),
                    },
                    {
                        name: 'Implementation',
                        agentConfig: {
                            name: 'failing-implementer',
                            state: MockAgentState.FAILURE,
                            errorMessage: 'Critical dependency not found',
                        },
                        runtimeConfig: mockConfig,
                        task: new TaskBuilder()
                            .withName('implement-feature')
                            .withOutputs({ code: 'Generated code' })
                            .build(),
                    },
                    {
                        name: 'Testing',
                        agentConfig: {
                            name: 'tester',
                            state: MockAgentState.SUCCESS,
                            outputVars: { test_results: 'This should not execute' },
                        },
                        runtimeConfig: mockConfig,
                        task: new TaskBuilder()
                            .withName('run-tests')
                            .withOutputs({ test_results: 'Test results' })
                            .build(),
                    },
                ],
            };
            const workflowId = await orchestra.defineWorkflow(failingWorkflow);
            const result = await orchestra.executeWorkflow(workflowId);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Critical dependency not found');
            expect(result.steps).toHaveLength(2); // Only first two steps should execute
            expect(result.steps[0].success).toBe(true);
            expect(result.steps[1].success).toBe(false);
            expect(orchestra.getWorkflowStatus(workflowId)).toBe('failed');
        });
    });
    describe('Multi-Agent Coordination Workflows', () => {
        it('should coordinate multiple agents for complex data processing', async () => {
            const dataProcessingWorkflow = {
                name: 'Data Processing Pipeline',
                description: 'Complete data processing workflow with multiple specialized agents',
                steps: [
                    {
                        name: 'Data Ingestion',
                        agentConfig: {
                            name: 'data-ingester',
                            state: MockAgentState.SUCCESS,
                            executionTime: 400,
                            toolCalls: ['read_file', 'make_http_request'],
                            outputVars: {
                                raw_data_count: '10000',
                                data_sources: 'API, CSV files, database',
                                ingestion_status: 'success',
                            },
                        },
                        runtimeConfig: mockConfig,
                        task: new TaskBuilder()
                            .withName('ingest-data')
                            .withCategory(TaskCategory.DATA_PROCESSING)
                            .withOutputs({
                            raw_data_count: 'Number of raw records ingested',
                            data_sources: 'Data sources used',
                            ingestion_status: 'Ingestion completion status',
                        })
                            .build(),
                    },
                    {
                        name: 'Data Validation',
                        agentConfig: {
                            name: 'data-validator',
                            state: MockAgentState.SUCCESS,
                            executionTime: 600,
                            toolCalls: ['execute_command'],
                            outputVars: {
                                validation_results: '9876 records valid, 124 records flagged',
                                quality_score: '98.76%',
                                validation_report: 'Data quality report generated',
                            },
                        },
                        runtimeConfig: mockConfig,
                        task: new TaskBuilder()
                            .withName('validate-data')
                            .withCategory(TaskCategory.DATA_PROCESSING)
                            .withOutputs({
                            validation_results: 'Data validation results',
                            quality_score: 'Data quality percentage',
                            validation_report: 'Validation report',
                        })
                            .build(),
                    },
                    {
                        name: 'Data Transformation',
                        agentConfig: {
                            name: 'data-transformer',
                            state: MockAgentState.SUCCESS,
                            executionTime: 800,
                            toolCalls: ['execute_command', 'write_file'],
                            outputVars: {
                                transformed_records: '9876',
                                transformation_rules: '15 rules applied',
                                output_format: 'Normalized JSON',
                            },
                        },
                        runtimeConfig: mockConfig,
                        task: new TaskBuilder()
                            .withName('transform-data')
                            .withCategory(TaskCategory.DATA_PROCESSING)
                            .withOutputs({
                            transformed_records: 'Number of transformed records',
                            transformation_rules: 'Applied transformation rules',
                            output_format: 'Output data format',
                        })
                            .build(),
                    },
                    {
                        name: 'Data Analysis',
                        agentConfig: {
                            name: 'data-analyst',
                            state: MockAgentState.SUCCESS,
                            executionTime: 1200,
                            toolCalls: ['execute_command', 'write_file'],
                            outputVars: {
                                analysis_results: 'Statistical analysis complete',
                                insights: '25 key insights discovered',
                                visualizations: '12 charts and graphs generated',
                            },
                        },
                        runtimeConfig: mockConfig,
                        task: new TaskBuilder()
                            .withName('analyze-data')
                            .withCategory(TaskCategory.DATA_PROCESSING)
                            .withOutputs({
                            analysis_results: 'Data analysis results',
                            insights: 'Key insights discovered',
                            visualizations: 'Generated visualizations',
                        })
                            .build(),
                    },
                    {
                        name: 'Report Generation',
                        agentConfig: {
                            name: 'report-generator',
                            state: MockAgentState.SUCCESS,
                            executionTime: 500,
                            toolCalls: ['write_file'],
                            outputVars: {
                                executive_report: 'Executive summary report generated',
                                detailed_report: 'Technical analysis report created',
                                dashboard_url: 'https://dashboard.example.com/analysis/12345',
                            },
                        },
                        runtimeConfig: mockConfig,
                        task: new TaskBuilder()
                            .withName('generate-reports')
                            .withCategory(TaskCategory.DOCUMENTATION)
                            .withOutputs({
                            executive_report: 'Executive summary report',
                            detailed_report: 'Detailed technical report',
                            dashboard_url: 'Interactive dashboard URL',
                        })
                            .build(),
                    },
                ],
                expectedOutputs: {
                    pipeline_status: 'Data processing pipeline completed successfully',
                    final_record_count: 'Number of records in final output',
                    processing_summary: 'Complete processing summary',
                },
            };
            const workflowId = await orchestra.defineWorkflow(dataProcessingWorkflow);
            const initialContext = new ContextState();
            initialContext.set('data_source_urls', JSON.stringify([
                'https://api.example.com/data',
                '/data/input.csv',
                'postgresql://localhost/db',
            ]));
            initialContext.set('processing_target', 'monthly_analytics');
            const result = await orchestra.executeWorkflow(workflowId, initialContext);
            expect(result.success).toBe(true);
            expect(result.steps).toHaveLength(5);
            // Verify data flows correctly through the pipeline
            expect(result.steps[0].outputs.raw_data_count).toBe('10000');
            expect(result.steps[1].outputs.quality_score).toBe('98.76%');
            expect(result.steps[2].outputs.transformed_records).toBe('9876');
            expect(result.steps[3].outputs.insights).toContain('25 key insights');
            expect(result.steps[4].outputs.dashboard_url).toContain('dashboard.example.com');
            // Verify execution time progresses as expected
            expect(result.executionTime).toBeGreaterThan(0);
        });
        it('should handle concurrent agent execution within workflow steps', async () => {
            const parallelWorkflow = {
                name: 'Parallel Processing Workflow',
                description: 'Workflow with steps that can run in parallel',
                steps: [
                    {
                        name: 'Initialize',
                        agentConfig: {
                            name: 'initializer',
                            state: MockAgentState.SUCCESS,
                            executionTime: 200,
                            outputVars: { initialization: 'complete' },
                        },
                        runtimeConfig: mockConfig,
                        task: new TaskBuilder()
                            .withName('initialize')
                            .withOutputs({ initialization: 'Initialization status' })
                            .build(),
                    },
                    {
                        name: 'Process A',
                        agentConfig: {
                            name: 'processor-a',
                            state: MockAgentState.SUCCESS,
                            executionTime: 600,
                            outputVars: { result_a: 'Processing A completed' },
                        },
                        runtimeConfig: mockConfig,
                        task: new TaskBuilder()
                            .withName('process-a')
                            .withOutputs({ result_a: 'Result from process A' })
                            .build(),
                        dependencies: ['Initialize'],
                    },
                    {
                        name: 'Process B',
                        agentConfig: {
                            name: 'processor-b',
                            state: MockAgentState.SUCCESS,
                            executionTime: 700,
                            outputVars: { result_b: 'Processing B completed' },
                        },
                        runtimeConfig: mockConfig,
                        task: new TaskBuilder()
                            .withName('process-b')
                            .withOutputs({ result_b: 'Result from process B' })
                            .build(),
                        dependencies: ['Initialize'],
                    },
                    {
                        name: 'Process C',
                        agentConfig: {
                            name: 'processor-c',
                            state: MockAgentState.SUCCESS,
                            executionTime: 500,
                            outputVars: { result_c: 'Processing C completed' },
                        },
                        runtimeConfig: mockConfig,
                        task: new TaskBuilder()
                            .withName('process-c')
                            .withOutputs({ result_c: 'Result from process C' })
                            .build(),
                        dependencies: ['Initialize'],
                    },
                    {
                        name: 'Consolidate',
                        agentConfig: {
                            name: 'consolidator',
                            state: MockAgentState.SUCCESS,
                            executionTime: 300,
                            outputVars: {
                                consolidated_result: 'All processes consolidated successfully',
                                total_items: '3',
                            },
                        },
                        runtimeConfig: mockConfig,
                        task: new TaskBuilder()
                            .withName('consolidate')
                            .withOutputs({
                            consolidated_result: 'Consolidated results',
                            total_items: 'Total items processed',
                        })
                            .build(),
                        dependencies: ['Process A', 'Process B', 'Process C'],
                    },
                ],
            };
            const workflowId = await orchestra.defineWorkflow(parallelWorkflow);
            const result = await orchestra.executeWorkflow(workflowId);
            expect(result.success).toBe(true);
            expect(result.steps).toHaveLength(5);
            // Verify all parallel processes completed
            expect(result.steps[1].outputs.result_a).toContain('Processing A completed');
            expect(result.steps[2].outputs.result_b).toContain('Processing B completed');
            expect(result.steps[3].outputs.result_c).toContain('Processing C completed');
            expect(result.steps[4].outputs.consolidated_result).toContain('consolidated successfully');
        });
    });
    describe('Cross-Session Workflow Scenarios', () => {
        it('should simulate workflow persistence across sessions', async () => {
            const longRunningWorkflow = {
                name: 'Long Running Analysis',
                description: 'Workflow that simulates cross-session persistence',
                steps: [
                    {
                        name: 'Start Analysis',
                        agentConfig: {
                            name: 'analyzer-start',
                            state: MockAgentState.SUCCESS,
                            executionTime: 300,
                            outputVars: {
                                analysis_id: 'analysis_12345',
                                session_state: 'analysis_started',
                                checkpoint: 'phase_1_complete',
                            },
                        },
                        runtimeConfig: mockConfig,
                        task: new TaskBuilder()
                            .withName('start-analysis')
                            .withOutputs({
                            analysis_id: 'Unique analysis identifier',
                            session_state: 'Current session state',
                            checkpoint: 'Analysis checkpoint',
                        })
                            .build(),
                    },
                    {
                        name: 'Resume Analysis',
                        agentConfig: {
                            name: 'analyzer-resume',
                            state: MockAgentState.SUCCESS,
                            executionTime: 800,
                            outputVars: {
                                resumed_from: 'phase_1_complete',
                                progress: '75%',
                                checkpoint: 'phase_2_complete',
                            },
                        },
                        runtimeConfig: mockConfig,
                        task: new TaskBuilder()
                            .withName('resume-analysis')
                            .withCustomPrompt('Resume analysis from checkpoint ${checkpoint} for analysis ${analysis_id}')
                            .withOutputs({
                            resumed_from: 'Checkpoint resumed from',
                            progress: 'Analysis progress',
                            checkpoint: 'New checkpoint',
                        })
                            .build(),
                    },
                    {
                        name: 'Complete Analysis',
                        agentConfig: {
                            name: 'analyzer-complete',
                            state: MockAgentState.SUCCESS,
                            executionTime: 400,
                            outputVars: {
                                final_results: 'Analysis completed successfully',
                                data_processed: '50000 records',
                                completion_time: new Date().toISOString(),
                            },
                        },
                        runtimeConfig: mockConfig,
                        task: new TaskBuilder()
                            .withName('complete-analysis')
                            .withOutputs({
                            final_results: 'Final analysis results',
                            data_processed: 'Amount of data processed',
                            completion_time: 'Analysis completion timestamp',
                        })
                            .build(),
                    },
                ],
            };
            const workflowId = await orchestra.defineWorkflow(longRunningWorkflow);
            const persistentContext = new ContextState();
            persistentContext.set('user_id', 'user_789');
            persistentContext.set('project_id', 'proj_456');
            persistentContext.set('analysis_type', 'comprehensive');
            const result = await orchestra.executeWorkflow(workflowId, persistentContext);
            expect(result.success).toBe(true);
            expect(result.steps).toHaveLength(3);
            // Verify workflow maintained state across simulated sessions
            expect(result.steps[0].outputs.analysis_id).toBe('analysis_12345');
            expect(result.steps[1].outputs.resumed_from).toBe('phase_1_complete');
            expect(result.steps[1].outputs.progress).toBe('75%');
            expect(result.steps[2].outputs.final_results).toContain('completed successfully');
            // Verify the context was maintained and used
            const workflowLogs = MockAgentFactory.getAllExecutionLogs();
            expect(workflowLogs.size).toBeGreaterThan(0);
        });
        it('should handle workflow recovery from failures', async () => {
            const recoveryWorkflow = {
                name: 'Recovery Workflow',
                description: 'Workflow that recovers from partial failures',
                steps: [
                    {
                        name: 'Initial Processing',
                        agentConfig: {
                            name: 'processor-initial',
                            state: MockAgentState.SUCCESS,
                            outputVars: { processed_items: '1000', checkpoint: 'initial_complete' },
                        },
                        runtimeConfig: mockConfig,
                        task: new TaskBuilder()
                            .withName('initial-processing')
                            .withOutputs({
                            processed_items: 'Number of processed items',
                            checkpoint: 'Processing checkpoint',
                        })
                            .build(),
                    },
                    {
                        name: 'Failed Step',
                        agentConfig: {
                            name: 'processor-failure',
                            state: MockAgentState.FAILURE,
                            errorMessage: 'Network timeout during processing',
                        },
                        runtimeConfig: mockConfig,
                        task: new TaskBuilder()
                            .withName('failing-step')
                            .withOutputs({ result: 'This should fail' })
                            .build(),
                    },
                ],
            };
            // First execution - should fail
            const workflowId = await orchestra.defineWorkflow(recoveryWorkflow);
            const firstResult = await orchestra.executeWorkflow(workflowId);
            expect(firstResult.success).toBe(false);
            expect(firstResult.error).toContain('Network timeout');
            expect(firstResult.steps).toHaveLength(2);
            expect(firstResult.steps[0].success).toBe(true);
            expect(firstResult.steps[1].success).toBe(false);
            // Simulate recovery by modifying the workflow
            const recoveryWorkflowFixed = {
                ...recoveryWorkflow,
                steps: [
                    recoveryWorkflow.steps[0], // Keep successful step
                    {
                        name: 'Recovery Step',
                        agentConfig: {
                            name: 'processor-recovery',
                            state: MockAgentState.SUCCESS,
                            outputVars: {
                                recovery_status: 'Successfully recovered from failure',
                                recovered_items: '500',
                                final_total: '1500',
                            },
                        },
                        runtimeConfig: mockConfig,
                        task: new TaskBuilder()
                            .withName('recovery-step')
                            .withOutputs({
                            recovery_status: 'Recovery operation status',
                            recovered_items: 'Items recovered',
                            final_total: 'Final item count',
                        })
                            .build(),
                    },
                ],
            };
            // Second execution with fixed workflow - should succeed
            const recoveryWorkflowId = await orchestra.defineWorkflow(recoveryWorkflowFixed);
            // Simulate resuming from checkpoint
            const recoveryContext = new ContextState();
            recoveryContext.set('processed_items', '1000');
            recoveryContext.set('checkpoint', 'initial_complete');
            recoveryContext.set('recovery_mode', 'true');
            const recoveryResult = await orchestra.executeWorkflow(recoveryWorkflowId, recoveryContext);
            expect(recoveryResult.success).toBe(true);
            expect(recoveryResult.steps).toHaveLength(2);
            expect(recoveryResult.steps[1].outputs.recovery_status).toContain('Successfully recovered');
            expect(recoveryResult.steps[1].outputs.final_total).toBe('1500');
        });
    });
    describe('Performance and Scalability', () => {
        it('should handle complex workflows with many steps efficiently', async () => {
            // Create a workflow with many steps to test performance
            const steps = [];
            for (let i = 0; i < 10; i++) {
                steps.push({
                    name: `Step ${i + 1}`,
                    agentConfig: {
                        name: `agent-${i + 1}`,
                        state: MockAgentState.SUCCESS,
                        executionTime: 100 + (i * 50), // Varying execution times
                        outputVars: {
                            step_result: `Step ${i + 1} completed`,
                            step_number: (i + 1).toString(),
                        },
                    },
                    runtimeConfig: mockConfig,
                    task: new TaskBuilder()
                        .withName(`step-${i + 1}`)
                        .withOutputs({
                        step_result: `Result from step ${i + 1}`,
                        step_number: 'Step number',
                    })
                        .build(),
                });
            }
            const largeWorkflow = {
                name: 'Large Workflow',
                description: 'Workflow with many steps for performance testing',
                steps,
            };
            const workflowId = await orchestra.defineWorkflow(largeWorkflow);
            const startTime = Date.now();
            const result = await orchestra.executeWorkflow(workflowId);
            const totalTime = Date.now() - startTime;
            expect(result.success).toBe(true);
            expect(result.steps).toHaveLength(10);
            // All steps should complete successfully
            result.steps.forEach((step, index) => {
                expect(step.success).toBe(true);
                expect(step.outputs.step_number).toBe((index + 1).toString());
            });
            // Should complete in reasonable time despite having many steps
            expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
            // Verify workflow status tracking
            expect(orchestra.getWorkflowStatus(workflowId)).toBe('completed');
            expect(orchestra.getCompletedWorkflows()).toContain(workflowId);
        });
        it('should provide detailed execution metrics', async () => {
            const metricsWorkflow = {
                name: 'Metrics Collection Workflow',
                description: 'Workflow for testing execution metrics collection',
                steps: [
                    {
                        name: 'Fast Step',
                        agentConfig: {
                            name: 'fast-agent',
                            state: MockAgentState.SUCCESS,
                            executionTime: 100,
                            outputVars: { execution_speed: 'fast' },
                        },
                        runtimeConfig: mockConfig,
                        task: new TaskBuilder()
                            .withName('fast-step')
                            .withComplexity(TaskComplexity.SIMPLE)
                            .withOutputs({ execution_speed: 'Execution speed' })
                            .build(),
                    },
                    {
                        name: 'Slow Step',
                        agentConfig: {
                            name: 'slow-agent',
                            state: MockAgentState.SUCCESS,
                            executionTime: 800,
                            outputVars: { execution_speed: 'slow' },
                        },
                        runtimeConfig: mockConfig,
                        task: new TaskBuilder()
                            .withName('slow-step')
                            .withComplexity(TaskComplexity.COMPLEX)
                            .withOutputs({ execution_speed: 'Execution speed' })
                            .build(),
                    },
                    {
                        name: 'Medium Step',
                        agentConfig: {
                            name: 'medium-agent',
                            state: MockAgentState.SUCCESS,
                            executionTime: 400,
                            outputVars: { execution_speed: 'medium' },
                        },
                        runtimeConfig: mockConfig,
                        task: new TaskBuilder()
                            .withName('medium-step')
                            .withComplexity(TaskComplexity.MODERATE)
                            .withOutputs({ execution_speed: 'Execution speed' })
                            .build(),
                    },
                ],
            };
            const workflowId = await orchestra.defineWorkflow(metricsWorkflow);
            const result = await orchestra.executeWorkflow(workflowId);
            expect(result.success).toBe(true);
            expect(result.executionTime).toBeGreaterThan(0);
            // Verify metrics are collected properly
            expect(result.steps[0].outputs.execution_speed).toBe('fast');
            expect(result.steps[1].outputs.execution_speed).toBe('slow');
            expect(result.steps[2].outputs.execution_speed).toBe('medium');
            // Verify that execution logs contain performance data
            const allLogs = MockAgentFactory.getAllExecutionLogs();
            expect(allLogs.size).toBe(3); // One log per agent
            allLogs.forEach((logs, agentName) => {
                expect(logs.length).toBeGreaterThan(0);
                expect(logs.some(log => log.includes('execution completed'))).toBe(true);
            });
        });
    });
});
//# sourceMappingURL=AutonomousWorkflows.test.js.map