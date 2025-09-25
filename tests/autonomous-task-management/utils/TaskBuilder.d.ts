/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PromptConfig, ModelConfig, RunConfig, ToolConfig, OutputConfig, SubAgentOptions } from '../../../packages/core/src/core/subagent.js';
/**
 * Task complexity levels for testing different scenarios
 */
export declare enum TaskComplexity {
    SIMPLE = "SIMPLE",
    MODERATE = "MODERATE",
    COMPLEX = "COMPLEX",
    VERY_COMPLEX = "VERY_COMPLEX"
}
/**
 * Task categories for organizational testing
 */
export declare enum TaskCategory {
    CODE_GENERATION = "CODE_GENERATION",
    FILE_MANIPULATION = "FILE_MANIPULATION",
    DATA_PROCESSING = "DATA_PROCESSING",
    API_INTEGRATION = "API_INTEGRATION",
    TESTING = "TESTING",
    DOCUMENTATION = "DOCUMENTATION",
    DEBUGGING = "DEBUGGING",
    REFACTORING = "REFACTORING"
}
/**
 * Priority levels for task scheduling tests
 */
export declare enum TaskPriority {
    LOW = 1,
    NORMAL = 2,
    HIGH = 3,
    URGENT = 4,
    CRITICAL = 5
}
/**
 * Configuration for building test tasks
 */
export interface TaskBuilderConfig {
    name: string;
    complexity: TaskComplexity;
    category: TaskCategory;
    priority: TaskPriority;
    expectedDuration?: number;
    dependencies?: string[];
    context?: Record<string, string>;
    tools?: string[];
    expectedOutputs?: Record<string, string>;
    maxRetries?: number;
    timeoutMinutes?: number;
    customPrompt?: string;
}
/**
 * Builder class for creating standardized test tasks with various configurations
 */
export declare class TaskBuilder {
    private config;
    constructor();
    /**
     * Resets the builder to default state
     */
    reset(): TaskBuilder;
    /**
     * Sets the task name
     */
    withName(name: string): TaskBuilder;
    /**
     * Sets the task complexity level
     */
    withComplexity(complexity: TaskComplexity): TaskBuilder;
    /**
     * Sets the task category
     */
    withCategory(category: TaskCategory): TaskBuilder;
    /**
     * Sets the task priority
     */
    withPriority(priority: TaskPriority): TaskBuilder;
    /**
     * Sets expected execution duration in minutes
     */
    withDuration(minutes: number): TaskBuilder;
    /**
     * Adds task dependencies
     */
    withDependencies(...dependencies: string[]): TaskBuilder;
    /**
     * Adds context variables for the task
     */
    withContext(context: Record<string, string>): TaskBuilder;
    /**
     * Adds tools that the task will use
     */
    withTools(...tools: string[]): TaskBuilder;
    /**
     * Sets expected output variables
     */
    withOutputs(outputs: Record<string, string>): TaskBuilder;
    /**
     * Sets maximum number of retries
     */
    withMaxRetries(retries: number): TaskBuilder;
    /**
     * Sets timeout in minutes
     */
    withTimeout(minutes: number): TaskBuilder;
    /**
     * Sets a custom prompt for the task
     */
    withCustomPrompt(prompt: string): TaskBuilder;
    /**
     * Builds the prompt configuration
     */
    buildPromptConfig(): PromptConfig;
    /**
     * Builds the model configuration
     */
    buildModelConfig(): ModelConfig;
    /**
     * Builds the run configuration
     */
    buildRunConfig(): RunConfig;
    /**
     * Builds the tool configuration
     */
    buildToolConfig(): ToolConfig | undefined;
    /**
     * Builds the output configuration
     */
    buildOutputConfig(): OutputConfig | undefined;
    /**
     * Builds the complete SubAgent options
     */
    buildSubAgentOptions(): SubAgentOptions;
    /**
     * Builds the complete task configuration
     */
    build(): {
        name: string;
        promptConfig: PromptConfig;
        modelConfig: ModelConfig;
        runConfig: RunConfig;
        options: SubAgentOptions;
        metadata: TaskBuilderConfig;
    };
    /**
     * Generates a system prompt based on configuration
     */
    private generatePromptFromConfig;
    /**
     * Gets task-specific instructions based on category and complexity
     */
    private getTaskInstructions;
    /**
     * Gets tools commonly used by each category
     */
    private getCategoryTools;
    /**
     * Creates predefined task templates for common scenarios
     */
    static createTemplates(): Record<string, TaskBuilder>;
    /**
     * Creates tasks for performance testing with varying loads
     */
    static createPerformanceTestTasks(count: number): TaskBuilder[];
}
