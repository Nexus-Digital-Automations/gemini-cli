/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Type } from '@google/genai';
/**
 * Task complexity levels for testing different scenarios
 */
export const TaskComplexity = {};
(function (TaskComplexity) {
    TaskComplexity["SIMPLE"] = "SIMPLE";
    TaskComplexity["MODERATE"] = "MODERATE";
    TaskComplexity["COMPLEX"] = "COMPLEX";
    TaskComplexity["VERY_COMPLEX"] = "VERY_COMPLEX";
})(TaskComplexity || (TaskComplexity = {}));
/**
 * Task categories for organizational testing
 */
export const TaskCategory = {};
(function (TaskCategory) {
    TaskCategory["CODE_GENERATION"] = "CODE_GENERATION";
    TaskCategory["FILE_MANIPULATION"] = "FILE_MANIPULATION";
    TaskCategory["DATA_PROCESSING"] = "DATA_PROCESSING";
    TaskCategory["API_INTEGRATION"] = "API_INTEGRATION";
    TaskCategory["TESTING"] = "TESTING";
    TaskCategory["DOCUMENTATION"] = "DOCUMENTATION";
    TaskCategory["DEBUGGING"] = "DEBUGGING";
    TaskCategory["REFACTORING"] = "REFACTORING";
})(TaskCategory || (TaskCategory = {}));
/**
 * Priority levels for task scheduling tests
 */
export const TaskPriority = {};
(function (TaskPriority) {
    TaskPriority[TaskPriority["LOW"] = 1] = "LOW";
    TaskPriority[TaskPriority["NORMAL"] = 2] = "NORMAL";
    TaskPriority[TaskPriority["HIGH"] = 3] = "HIGH";
    TaskPriority[TaskPriority["URGENT"] = 4] = "URGENT";
    TaskPriority[TaskPriority["CRITICAL"] = 5] = "CRITICAL";
})(TaskPriority || (TaskPriority = {}));
/**
 * Builder class for creating standardized test tasks with various configurations
 */
export class TaskBuilder {
    config = {};
    constructor() {
        this.reset();
    }
    /**
     * Resets the builder to default state
     */
    reset() {
        this.config = {
            complexity: TaskComplexity.SIMPLE,
            category: TaskCategory.CODE_GENERATION,
            priority: TaskPriority.NORMAL,
            expectedDuration: 5,
            dependencies: [],
            context: {},
            tools: [],
            expectedOutputs: {},
            maxRetries: 3,
            timeoutMinutes: 10,
        };
        return this;
    }
    /**
     * Sets the task name
     */
    withName(name) {
        this.config.name = name;
        return this;
    }
    /**
     * Sets the task complexity level
     */
    withComplexity(complexity) {
        this.config.complexity = complexity;
        return this;
    }
    /**
     * Sets the task category
     */
    withCategory(category) {
        this.config.category = category;
        return this;
    }
    /**
     * Sets the task priority
     */
    withPriority(priority) {
        this.config.priority = priority;
        return this;
    }
    /**
     * Sets expected execution duration in minutes
     */
    withDuration(minutes) {
        this.config.expectedDuration = minutes;
        this.config.timeoutMinutes = minutes * 2; // Set timeout to 2x expected duration
        return this;
    }
    /**
     * Adds task dependencies
     */
    withDependencies(...dependencies) {
        this.config.dependencies = [
            ...(this.config.dependencies || []),
            ...dependencies,
        ];
        return this;
    }
    /**
     * Adds context variables for the task
     */
    withContext(context) {
        this.config.context = { ...this.config.context, ...context };
        return this;
    }
    /**
     * Adds tools that the task will use
     */
    withTools(...tools) {
        this.config.tools = [...(this.config.tools || []), ...tools];
        return this;
    }
    /**
     * Sets expected output variables
     */
    withOutputs(outputs) {
        this.config.expectedOutputs = {
            ...this.config.expectedOutputs,
            ...outputs,
        };
        return this;
    }
    /**
     * Sets maximum number of retries
     */
    withMaxRetries(retries) {
        this.config.maxRetries = retries;
        return this;
    }
    /**
     * Sets timeout in minutes
     */
    withTimeout(minutes) {
        this.config.timeoutMinutes = minutes;
        return this;
    }
    /**
     * Sets a custom prompt for the task
     */
    withCustomPrompt(prompt) {
        this.config.customPrompt = prompt;
        return this;
    }
    /**
     * Builds the prompt configuration
     */
    buildPromptConfig() {
        if (this.config.customPrompt) {
            return { systemPrompt: this.config.customPrompt };
        }
        const prompt = this.generatePromptFromConfig();
        return { systemPrompt: prompt };
    }
    /**
     * Builds the model configuration
     */
    buildModelConfig() {
        // Adjust model parameters based on complexity
        let temp = 0.3;
        let top_p = 0.9;
        switch (this.config.complexity) {
            case TaskComplexity.SIMPLE:
                temp = 0.1;
                top_p = 0.8;
                break;
            case TaskComplexity.MODERATE:
                temp = 0.3;
                top_p = 0.9;
                break;
            case TaskComplexity.COMPLEX:
                temp = 0.5;
                top_p = 0.95;
                break;
            case TaskComplexity.VERY_COMPLEX:
                temp = 0.7;
                top_p = 1.0;
                break;
        }
        return {
            model: 'gemini-1.5-flash-latest',
            temp,
            top_p,
        };
    }
    /**
     * Builds the run configuration
     */
    buildRunConfig() {
        let maxTurns;
        // Set max turns based on complexity
        switch (this.config.complexity) {
            case TaskComplexity.SIMPLE:
                maxTurns = 5;
                break;
            case TaskComplexity.MODERATE:
                maxTurns = 10;
                break;
            case TaskComplexity.COMPLEX:
                maxTurns = 20;
                break;
            case TaskComplexity.VERY_COMPLEX:
                maxTurns = 50;
                break;
            default:
                maxTurns = 10;
        }
        return {
            max_time_minutes: this.config.timeoutMinutes || 10,
            max_turns: maxTurns,
        };
    }
    /**
     * Builds the tool configuration
     */
    buildToolConfig() {
        if (!this.config.tools || this.config.tools.length === 0) {
            return undefined;
        }
        const tools = [...this.config.tools];
        // Add category-specific tools
        const categoryTools = this.getCategoryTools();
        tools.push(...categoryTools);
        return { tools };
    }
    /**
     * Builds the output configuration
     */
    buildOutputConfig() {
        if (!this.config.expectedOutputs ||
            Object.keys(this.config.expectedOutputs).length === 0) {
            return undefined;
        }
        return { outputs: this.config.expectedOutputs };
    }
    /**
     * Builds the complete SubAgent options
     */
    buildSubAgentOptions() {
        return {
            toolConfig: this.buildToolConfig(),
            outputConfig: this.buildOutputConfig(),
        };
    }
    /**
     * Builds the complete task configuration
     */
    build() {
        if (!this.config.name) {
            throw new Error('Task name is required');
        }
        return {
            name: this.config.name,
            promptConfig: this.buildPromptConfig(),
            modelConfig: this.buildModelConfig(),
            runConfig: this.buildRunConfig(),
            options: this.buildSubAgentOptions(),
            metadata: this.config,
        };
    }
    /**
     * Generates a system prompt based on configuration
     */
    generatePromptFromConfig() {
        const { name, category, complexity, context, expectedOutputs } = this.config;
        let prompt = `You are a ${complexity?.toLowerCase()} ${category?.toLowerCase().replace('_', ' ')} assistant named ${name}.

Your task is to complete the assigned work with high quality and attention to detail.

`;
        // Add context variables
        if (context && Object.keys(context).length > 0) {
            prompt += 'Context Variables:\n';
            Object.entries(context).forEach(([key, value]) => {
                prompt += `- ${key}: ${value}\n`;
            });
            prompt += '\n';
        }
        // Add task-specific instructions
        prompt += this.getTaskInstructions();
        // Add output requirements
        if (expectedOutputs && Object.keys(expectedOutputs).length > 0) {
            prompt += '\nRequired Outputs:\n';
            Object.entries(expectedOutputs).forEach(([key, description]) => {
                prompt += `- ${key}: ${description}\n`;
            });
        }
        return prompt;
    }
    /**
     * Gets task-specific instructions based on category and complexity
     */
    getTaskInstructions() {
        const { category, complexity } = this.config;
        let instructions = '';
        switch (category) {
            case TaskCategory.CODE_GENERATION:
                instructions = `Generate high-quality, well-documented code that follows best practices.
- Write clean, readable code with proper error handling
- Include comprehensive comments and documentation
- Follow coding standards and conventions
- Test the code for correctness and edge cases
`;
                break;
            case TaskCategory.FILE_MANIPULATION:
                instructions = `Perform file operations safely and efficiently.
- Validate file paths and permissions before operations
- Handle errors gracefully with appropriate messages
- Preserve data integrity during file operations
- Create backups when modifying existing files
`;
                break;
            case TaskCategory.DATA_PROCESSING:
                instructions = `Process data accurately and efficiently.
- Validate input data format and integrity
- Handle edge cases and malformed data
- Optimize processing performance for large datasets
- Provide clear progress indicators for long operations
`;
                break;
            case TaskCategory.API_INTEGRATION:
                instructions = `Integrate with APIs reliably and securely.
- Handle authentication and authorization properly
- Implement proper error handling and retry logic
- Respect rate limits and API constraints
- Validate API responses and handle edge cases
`;
                break;
            case TaskCategory.TESTING:
                instructions = `Create comprehensive tests with good coverage.
- Write both unit and integration tests
- Cover edge cases and error scenarios
- Ensure tests are maintainable and reliable
- Provide clear test descriptions and assertions
`;
                break;
            case TaskCategory.DOCUMENTATION:
                instructions = `Create clear, comprehensive documentation.
- Write in clear, concise language
- Include examples and use cases
- Structure documentation logically
- Keep documentation up-to-date with code changes
`;
                break;
            case TaskCategory.DEBUGGING:
                instructions = `Debug issues systematically and thoroughly.
- Reproduce the issue reliably
- Analyze root causes, not just symptoms
- Implement comprehensive fixes
- Add logging and monitoring to prevent recurrence
`;
                break;
            case TaskCategory.REFACTORING:
                instructions = `Refactor code while maintaining functionality.
- Preserve existing behavior and API contracts
- Improve code quality and maintainability
- Add tests to verify refactoring correctness
- Document changes and rationale
`;
                break;
        }
        // Add complexity-specific instructions
        if (complexity === TaskComplexity.COMPLEX ||
            complexity === TaskComplexity.VERY_COMPLEX) {
            instructions += `
Advanced Requirements for Complex Tasks:
- Break down complex problems into smaller, manageable parts
- Consider performance implications and optimization opportunities
- Think through multiple approaches and choose the best solution
- Document architectural decisions and trade-offs
- Plan for future extensibility and maintenance
`;
        }
        return instructions;
    }
    /**
     * Gets tools commonly used by each category
     */
    getCategoryTools() {
        switch (this.config.category) {
            case TaskCategory.CODE_GENERATION:
                return ['write_file', 'read_file', 'execute_command'];
            case TaskCategory.FILE_MANIPULATION:
                return [
                    'read_file',
                    'write_file',
                    'list_directory',
                    'move_file',
                    'delete_file',
                ];
            case TaskCategory.DATA_PROCESSING:
                return ['read_file', 'write_file', 'execute_command'];
            case TaskCategory.API_INTEGRATION:
                return ['make_http_request', 'write_file', 'read_file'];
            case TaskCategory.TESTING:
                return ['write_file', 'read_file', 'execute_command', 'run_tests'];
            case TaskCategory.DOCUMENTATION:
                return ['write_file', 'read_file', 'list_directory'];
            case TaskCategory.DEBUGGING:
                return ['read_file', 'write_file', 'execute_command', 'search_code'];
            case TaskCategory.REFACTORING:
                return ['read_file', 'write_file', 'search_code', 'execute_command'];
            default:
                return ['read_file', 'write_file'];
        }
    }
    /**
     * Creates predefined task templates for common scenarios
     */
    static createTemplates() {
        return {
            simpleFileRead: new TaskBuilder()
                .withName('simple-file-read')
                .withComplexity(TaskComplexity.SIMPLE)
                .withCategory(TaskCategory.FILE_MANIPULATION)
                .withTools('read_file')
                .withOutputs({ file_content: 'The content of the read file' })
                .withDuration(1),
            codeGeneration: new TaskBuilder()
                .withName('code-generation')
                .withComplexity(TaskComplexity.MODERATE)
                .withCategory(TaskCategory.CODE_GENERATION)
                .withTools('write_file', 'read_file', 'execute_command')
                .withOutputs({
                generated_code: 'The generated code implementation',
                test_results: 'Results from testing the generated code',
            })
                .withDuration(5),
            complexDataProcessing: new TaskBuilder()
                .withName('complex-data-processing')
                .withComplexity(TaskComplexity.COMPLEX)
                .withCategory(TaskCategory.DATA_PROCESSING)
                .withTools('read_file', 'write_file', 'execute_command')
                .withOutputs({
                processed_data: 'The processed and transformed data',
                processing_stats: 'Statistics about the processing operation',
                error_report: 'Any errors encountered during processing',
            })
                .withDuration(10),
            apiIntegrationTask: new TaskBuilder()
                .withName('api-integration')
                .withComplexity(TaskComplexity.MODERATE)
                .withCategory(TaskCategory.API_INTEGRATION)
                .withTools('make_http_request', 'write_file')
                .withOutputs({
                api_response: 'Response data from the API call',
                integration_status: 'Status of the integration',
            })
                .withDuration(7),
            comprehensiveTesting: new TaskBuilder()
                .withName('comprehensive-testing')
                .withComplexity(TaskComplexity.COMPLEX)
                .withCategory(TaskCategory.TESTING)
                .withTools('write_file', 'read_file', 'execute_command', 'run_tests')
                .withOutputs({
                test_coverage: 'Code coverage percentage achieved',
                test_results: 'Summary of test execution results',
                performance_metrics: 'Performance benchmarks from tests',
            })
                .withDuration(15),
        };
    }
    /**
     * Creates tasks for performance testing with varying loads
     */
    static createPerformanceTestTasks(count) {
        const tasks = [];
        const templates = this.createTemplates();
        const templateKeys = Object.keys(templates);
        for (let i = 0; i < count; i++) {
            const template = templates[templateKeys[i % templateKeys.length]];
            const taskBuilder = new TaskBuilder();
            // Copy configuration from template
            const builtTemplate = template.build();
            taskBuilder.config = { ...builtTemplate.metadata };
            // Customize for performance testing
            taskBuilder
                .withName(`${builtTemplate.name}-perf-${i}`)
                .withContext({
                performance_test_id: i.toString(),
                concurrent_tasks: count.toString(),
                test_iteration: i.toString(),
            })
                .withOutputs({
                ...builtTemplate.metadata.expectedOutputs,
                execution_time: 'Time taken to complete the task',
                memory_usage: 'Peak memory usage during execution',
                task_id: i.toString(),
            });
            tasks.push(taskBuilder);
        }
        return tasks;
    }
}
//# sourceMappingURL=TaskBuilder.js.map