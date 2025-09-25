/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { TaskComplexity } from './types.js';
import { SubAgentScope, ContextState, SubagentTerminateMode, } from '../core/subagent.js';
import { CoreToolScheduler } from '../core/coreToolScheduler.js';
import { Turn } from '../core/turn.js';
import { GeminiChat } from '../core/geminiChat.js';
import { getEnvironmentContext } from '../utils/environmentContext.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
/**
 * @fileoverview Comprehensive Task Execution Engine with Intelligent Breakdown
 *
 * This system provides autonomous task breakdown, dependency analysis, execution orchestration,
 * cross-session persistence, and real-time monitoring for complex multi-agent workflows.
 */
/**
 * Task complexity levels determine breakdown strategy and resource allocation
 * (using TaskComplexity enum from types.ts)
 */
/**
 * Task execution status lifecycle (using canonical TaskStatus from types.ts)
 */
/**
 * Task priority levels for execution scheduling (using canonical TaskPriority from types.ts)
 */
/**
 * Task types for specialized handling and agent assignment
 */
export const TaskType = {};
(function (TaskType) {
    TaskType["IMPLEMENTATION"] = "implementation";
    TaskType["TESTING"] = "testing";
    TaskType["VALIDATION"] = "validation";
    TaskType["DOCUMENTATION"] = "documentation";
    TaskType["ANALYSIS"] = "analysis";
    TaskType["DEPLOYMENT"] = "deployment";
    TaskType["SECURITY"] = "security";
    TaskType["PERFORMANCE"] = "performance";
})(TaskType || (TaskType = {}));
/**
 * Dependency types for task orchestration
 */
export const DependencyType = {};
(function (DependencyType) {
    DependencyType["HARD"] = "hard";
    DependencyType["SOFT"] = "soft";
    DependencyType["RESOURCE"] = "resource";
    DependencyType["DATA"] = "data";
    DependencyType["VALIDATION"] = "validation";
})(DependencyType || (DependencyType = {}));
/**
 * Agent capabilities for task assignment
 */
export const AgentCapability = {};
(function (AgentCapability) {
    AgentCapability["FRONTEND"] = "frontend";
    AgentCapability["BACKEND"] = "backend";
    AgentCapability["TESTING"] = "testing";
    AgentCapability["DOCUMENTATION"] = "documentation";
    AgentCapability["SECURITY"] = "security";
    AgentCapability["PERFORMANCE"] = "performance";
    AgentCapability["ANALYSIS"] = "analysis";
    AgentCapability["VALIDATION"] = "validation";
    AgentCapability["DEPLOYMENT"] = "deployment";
})(AgentCapability || (AgentCapability = {}));
/**
 * Intelligent Task Breakdown Algorithms
 */
export class TaskBreakdownAnalyzer {
    config;
    toolRegistry;
    constructor(config) {
        this.config = config;
        this.toolRegistry = config.getToolRegistry();
    }
    /**
     * Analyzes task complexity using multiple heuristics
     */
    async analyzeComplexity(title, description) {
        // Keyword-based complexity analysis
        const complexityKeywords = {
            [TaskComplexity.ENTERPRISE]: [
                'multi-agent',
                'distributed',
                'enterprise',
                'scalable architecture',
                'microservices',
                'orchestration',
                'comprehensive system',
            ],
            [TaskComplexity.COMPLEX]: [
                'framework',
                'architecture',
                'integration',
                'algorithm',
                'optimization',
                'real-time',
                'concurrent',
                'multi-threading',
                'distributed',
            ],
            [TaskComplexity.MODERATE]: [
                'feature',
                'component',
                'service',
                'api',
                'database',
                'frontend',
                'backend',
                'testing',
                'validation',
                'monitoring',
            ],
            [TaskComplexity.SIMPLE]: [
                'fix',
                'update',
                'modify',
                'enhance',
                'improve',
                'refactor',
                'cleanup',
            ],
            [TaskComplexity.TRIVIAL]: [
                'typo',
                'comment',
                'documentation',
                'format',
                'style',
                'lint',
            ],
        };
        const text = `${title} ${description}`.toLowerCase();
        // Score based on keyword matches
        const scores = Object.entries(complexityKeywords).map(([complexity, keywords]) => {
            const matches = keywords.filter((keyword) => text.includes(keyword.toLowerCase())).length;
            return { complexity, score: matches };
        });
        // Length-based heuristics
        const descriptionLength = description.length;
        let lengthComplexity = TaskComplexity.SIMPLE;
        if (descriptionLength > 2000)
            lengthComplexity = TaskComplexity.ENTERPRISE;
        else if (descriptionLength > 1000)
            lengthComplexity = TaskComplexity.COMPLEX;
        else if (descriptionLength > 500)
            lengthComplexity = TaskComplexity.MODERATE;
        else if (descriptionLength > 100)
            lengthComplexity = TaskComplexity.SIMPLE;
        else
            lengthComplexity = TaskComplexity.TRIVIAL;
        // Get highest scoring complexity or use length-based fallback
        const topScore = scores.reduce((max, curr) => curr.score > max.score ? curr : max);
        return topScore.score > 0 ? topScore.complexity : lengthComplexity;
    }
    /**
     * Breaks down complex tasks into manageable subtasks using AI-assisted analysis
     */
    async breakdownTask(task) {
        const { title, description, type, complexity } = task;
        // Create breakdown context
        const context = new ContextState();
        context.set('task_title', title);
        context.set('task_description', description);
        context.set('task_type', type);
        context.set('task_complexity', complexity);
        // Determine breakdown strategy based on complexity
        const breakdownPrompt = this.generateBreakdownPrompt(complexity, type);
        // Use SubAgentScope for intelligent breakdown
        const breakdownAgent = await SubAgentScope.create('task-breakdown-analyzer', this.config, {
            systemPrompt: breakdownPrompt,
        }, {
            model: this.config.getModel(),
            temp: 0.3, // Lower temperature for more structured output
            top_p: 0.9,
        }, {
            max_time_minutes: 5, // Quick analysis
            max_turns: 10,
        }, {
            toolConfig: {
                tools: ['AnalyzeComplexity', 'CreateSubtask', 'IdentifyDependencies'],
            },
            outputConfig: {
                outputs: {
                    subtasks_json: 'JSON array of subtask objects with id, title, description, type, complexity, estimated_duration_minutes',
                    dependencies_json: 'JSON array of dependency objects with taskId, dependsOnTaskId, type, description',
                    total_duration: 'Total estimated duration in minutes for all subtasks',
                    required_capabilities: 'JSON array of required agent capabilities',
                    risks: 'JSON array of potential risks and mitigation strategies',
                },
            },
        });
        await breakdownAgent.runNonInteractive(context);
        // Parse breakdown results
        const outputs = breakdownAgent.output.emitted_vars;
        const subtasks = this.parseSubtasks(outputs.subtasks_json || '[]');
        const dependencies = this.parseDependencies(outputs.dependencies_json || '[]');
        const estimatedDurationMinutes = parseInt(outputs.total_duration || '60');
        const requiredCapabilities = JSON.parse(outputs.required_capabilities || '[]');
        const risksAndMitigation = JSON.parse(outputs.risks || '[]');
        return {
            subtasks,
            dependencies,
            estimatedDurationMinutes,
            requiredCapabilities,
            risksAndMitigation,
        };
    }
    /**
     * Identifies task dependencies using graph analysis
     */
    async identifyDependencies(tasks) {
        const dependencies = [];
        // Analyze task relationships
        for (const task of tasks) {
            for (const otherTask of tasks) {
                if (task.id === otherTask.id)
                    continue;
                const dependency = this.analyzeDependency(task, otherTask);
                if (dependency) {
                    dependencies.push(dependency);
                }
            }
        }
        return dependencies;
    }
    /**
     * Generates AI prompt for task breakdown based on complexity and type
     */
    generateBreakdownPrompt(complexity, type) {
        return `You are an expert task breakdown analyst specializing in software development project management.

Your task is to analyze the given task (complexity: ${complexity}, type: ${type}) and break it down into manageable subtasks.

**TASK INFORMATION:**
- Title: \${task_title}
- Description: \${task_description}
- Type: \${task_type}
- Complexity: \${task_complexity}

**YOUR RESPONSIBILITIES:**
1. **Intelligent Subtask Creation**: Break down the task into 3-12 actionable subtasks based on complexity
2. **Dependency Analysis**: Identify hard and soft dependencies between subtasks
3. **Resource Planning**: Estimate duration and required agent capabilities
4. **Risk Assessment**: Identify potential blockers and mitigation strategies

**BREAKDOWN GUIDELINES:**
- ${this.getComplexityGuidelines(complexity)}
- ${this.getTypeGuidelines(type)}

**OUTPUT REQUIREMENTS:**
- Create subtasks with clear, actionable titles and detailed descriptions
- Identify realistic time estimates (be conservative)
- Map dependencies to enable parallel execution where possible
- Consider testing and validation requirements
- Include error handling and rollback considerations

Focus on creating a practical, executable breakdown that enables efficient autonomous execution.`;
    }
    /**
     * Gets complexity-specific breakdown guidelines
     */
    getComplexityGuidelines(complexity) {
        switch (complexity) {
            case TaskComplexity.TRIVIAL:
                return 'Create 1-3 simple subtasks, minimal dependencies, focus on quick execution';
            case TaskComplexity.SIMPLE:
                return 'Create 3-5 straightforward subtasks, basic validation, consider error handling';
            case TaskComplexity.MODERATE:
                return 'Create 5-8 subtasks, establish clear dependencies, include comprehensive testing';
            case TaskComplexity.COMPLEX:
                return 'Create 8-12 subtasks, complex dependency chains, extensive validation and monitoring';
            case TaskComplexity.ENTERPRISE:
                return 'Create 10-15+ subtasks, multi-phase execution, comprehensive quality gates and monitoring';
        }
    }
    /**
     * Gets type-specific breakdown guidelines
     */
    getTypeGuidelines(type) {
        switch (type) {
            case TaskType.IMPLEMENTATION:
                return 'Include design, implementation, unit testing, and integration phases';
            case TaskType.TESTING:
                return 'Include test planning, test creation, execution, and result analysis';
            case TaskType.VALIDATION:
                return 'Include validation criteria, automated checks, manual review, and reporting';
            case TaskType.DOCUMENTATION:
                return 'Include research, writing, review, and publication phases';
            case TaskType.ANALYSIS:
                return 'Include data collection, analysis, insights generation, and reporting';
            case TaskType.DEPLOYMENT:
                return 'Include preparation, deployment, verification, and rollback planning';
            case TaskType.SECURITY:
                return 'Include security assessment, vulnerability identification, remediation, and validation';
            case TaskType.PERFORMANCE:
                return 'Include profiling, optimization, testing, and performance validation';
        }
    }
    /**
     * Parses subtasks from JSON string with error handling
     */
    parseSubtasks(subtasksJson) {
        try {
            const subtaskData = JSON.parse(subtasksJson);
            return subtaskData.map((data) => this.createTaskFromData(data));
        }
        catch (error) {
            console.error('Error parsing subtasks JSON:', error);
            return [];
        }
    }
    /**
     * Parses dependencies from JSON string with error handling
     */
    parseDependencies(dependenciesJson) {
        try {
            return JSON.parse(dependenciesJson);
        }
        catch (error) {
            console.error('Error parsing dependencies JSON:', error);
            return [];
        }
    }
    /**
     * Creates a Task object from parsed data
     */
    createTaskFromData(data) {
        const now = new Date();
        return {
            id: data.id ||
                `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: data.title || 'Untitled Task',
            description: data.description || '',
            type: data.type || TaskType.IMPLEMENTATION,
            complexity: data.complexity || TaskComplexity.SIMPLE,
            priority: data.priority || TaskPriority.NORMAL,
            status: TaskStatus.QUEUED,
            progress: 0,
            requiredCapabilities: data.required_capabilities || [],
            subtaskIds: [],
            dependencies: [],
            maxExecutionTimeMinutes: data.estimated_duration_minutes || 60,
            maxRetries: 3,
            context: data.context || {},
            expectedOutputs: data.expected_outputs || {},
            createdAt: now,
            updatedAt: now,
            retryCount: 0,
        };
    }
    /**
     * Analyzes potential dependency between two tasks
     */
    analyzeDependency(task1, task2) {
        // Simple heuristic-based dependency analysis
        // In a real implementation, this would use more sophisticated analysis
        const task1Text = `${task1.title} ${task1.description}`.toLowerCase();
        const task2Text = `${task2.title} ${task2.description}`.toLowerCase();
        // Check for common dependency patterns
        if (task1Text.includes('test') && task2Text.includes('implement')) {
            return {
                taskId: task1.id,
                dependsOnTaskId: task2.id,
                type: DependencyType.HARD,
                description: 'Testing depends on implementation completion',
            };
        }
        if (task1Text.includes('deploy') &&
            (task2Text.includes('test') || task2Text.includes('validate'))) {
            return {
                taskId: task1.id,
                dependsOnTaskId: task2.id,
                type: DependencyType.HARD,
                description: 'Deployment depends on testing/validation',
            };
        }
        if (task1Text.includes('document') && task2Text.includes('implement')) {
            return {
                taskId: task1.id,
                dependsOnTaskId: task2.id,
                type: DependencyType.SOFT,
                description: 'Documentation should follow implementation',
            };
        }
        return null;
    }
}
/**
 * Core Task Execution Engine with autonomous orchestration
 */
export class TaskExecutionEngine {
    config;
    toolRegistry;
    breakdownAnalyzer;
    taskQueue = new Map();
    runningTasks = new Map();
    completedTasks = new Map();
    taskDependencies = new Map();
    // Event handlers
    onTaskStatusChange;
    onTaskComplete;
    onTaskFailed;
    constructor(config, handlers) {
        this.config = config;
        this.toolRegistry = config.getToolRegistry();
        this.breakdownAnalyzer = new TaskBreakdownAnalyzer(config);
        // Set up event handlers
        this.onTaskStatusChange = handlers?.onTaskStatusChange;
        this.onTaskComplete = handlers?.onTaskComplete;
        this.onTaskFailed = handlers?.onTaskFailed;
    }
    /**
     * Queues a new task for execution with intelligent breakdown
     */
    async queueTask(title, description, options = {}) {
        // Create initial task
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();
        const complexity = await this.breakdownAnalyzer.analyzeComplexity(title, description);
        const task = {
            id: taskId,
            title,
            description,
            type: options.type || TaskType.IMPLEMENTATION,
            complexity,
            priority: options.priority || TaskPriority.NORMAL,
            status: TaskStatus.QUEUED,
            progress: 0,
            requiredCapabilities: [], // Will be determined during breakdown
            subtaskIds: [],
            dependencies: [],
            maxExecutionTimeMinutes: options.maxExecutionTimeMinutes ||
                this.getDefaultExecutionTime(complexity),
            maxRetries: 3,
            context: options.context || {},
            expectedOutputs: options.expectedOutputs || {},
            createdAt: now,
            updatedAt: now,
            retryCount: 0,
        };
        this.taskQueue.set(taskId, task);
        this.updateTaskStatus(task, TaskStatus.QUEUED);
        // Trigger breakdown analysis in background
        this.analyzeAndBreakdownTask(taskId);
        return taskId;
    }
    /**
     * Analyzes and breaks down a task asynchronously
     */
    async analyzeAndBreakdownTask(taskId) {
        const task = this.taskQueue.get(taskId);
        if (!task)
            return;
        try {
            this.updateTaskStatus(task, TaskStatus.ANALYZED);
            // Perform intelligent breakdown
            const breakdown = await this.breakdownAnalyzer.breakdownTask(task);
            // Create subtasks
            for (const subtask of breakdown.subtasks) {
                subtask.parentTaskId = taskId;
                this.taskQueue.set(subtask.id, subtask);
                task.subtaskIds.push(subtask.id);
            }
            // Store dependencies
            this.taskDependencies.set(taskId, breakdown.dependencies);
            // Update task with breakdown results
            task.requiredCapabilities = breakdown.requiredCapabilities;
            task.maxExecutionTimeMinutes = Math.max(task.maxExecutionTimeMinutes, breakdown.estimatedDurationMinutes);
            this.updateTaskStatus(task, TaskStatus.ASSIGNED);
            // Schedule for execution
            await this.scheduleTaskExecution(taskId);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.handleTaskError(task, `Breakdown analysis failed: ${errorMessage}`);
        }
    }
    /**
     * Schedules task execution based on dependencies and resource availability
     */
    async scheduleTaskExecution(taskId) {
        const task = this.taskQueue.get(taskId);
        if (!task)
            return;
        // Check if all dependencies are satisfied
        if (!this.areDependenciesSatisfied(taskId)) {
            // Task will be rescheduled when dependencies complete
            return;
        }
        // Check resource availability
        if (this.runningTasks.size >= this.getMaxConcurrentTasks()) {
            // Will be rescheduled when resources become available
            return;
        }
        // Execute the task
        await this.executeTask(taskId);
    }
    /**
     * Executes a task using SubAgentScope with comprehensive monitoring
     */
    async executeTask(taskId) {
        const task = this.taskQueue.get(taskId);
        if (!task)
            return;
        try {
            this.updateTaskStatus(task, TaskStatus.IN_PROGRESS);
            const startTime = new Date();
            task.startedAt = startTime;
            task.metrics = {
                startTime,
                tokenUsage: 0,
                toolCallsCount: 0,
                subAgentCount: 1,
                errorCount: 0,
                retryCount: task.retryCount,
            };
            // Create execution context
            const context = new ContextState();
            this.populateExecutionContext(task, context);
            // Create SubAgent for task execution
            const executionAgent = await SubAgentScope.create(`task-executor-${task.type}`, this.config, {
                systemPrompt: this.generateExecutionPrompt(task),
            }, {
                model: this.config.getModel(),
                temp: 0.7,
                top_p: 0.9,
            }, {
                max_time_minutes: task.maxExecutionTimeMinutes,
                max_turns: 50,
            }, {
                toolConfig: {
                    tools: this.getToolsForTask(task),
                },
                outputConfig: {
                    outputs: task.expectedOutputs,
                },
                onMessage: (message) => {
                    // Update progress based on message analysis
                    this.updateTaskProgress(task, message);
                },
            });
            const executionContext = {
                task,
                toolRegistry: this.toolRegistry,
                config: this.config,
                parentContext: context,
                dependencies: this.getDependencyTasks(taskId),
                availableAgents: [], // TODO: Implement agent discovery
            };
            this.runningTasks.set(taskId, executionContext);
            // Execute the task
            await executionAgent.runNonInteractive(context);
            // Process results
            const result = executionAgent.output;
            const endTime = new Date();
            task.metrics.endTime = endTime;
            task.metrics.durationMs = endTime.getTime() - startTime.getTime();
            if (result.terminate_reason === SubagentTerminateMode.GOAL) {
                // Task completed successfully
                task.outputs = result.emitted_vars;
                task.completedAt = endTime;
                task.progress = 100;
                this.taskQueue.delete(taskId);
                this.completedTasks.set(taskId, task);
                this.runningTasks.delete(taskId);
                this.updateTaskStatus(task, TaskStatus.COMPLETED);
                this.onTaskComplete?.(task);
                // Schedule dependent tasks
                await this.scheduleDependentTasks(taskId);
            }
            else {
                // Task failed or timed out
                const errorMessage = `Task terminated with reason: ${result.terminate_reason}`;
                await this.handleTaskFailure(task, errorMessage);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            await this.handleTaskFailure(task, errorMessage);
        }
    }
    /**
     * Handles task execution failures with retry logic
     */
    async handleTaskFailure(task, errorMessage) {
        task.lastError = errorMessage;
        task.retryCount++;
        if (task.metrics) {
            task.metrics.errorCount++;
        }
        this.runningTasks.delete(task.id);
        if (task.retryCount <= task.maxRetries) {
            // Retry the task
            this.updateTaskStatus(task, TaskStatus.QUEUED);
            setTimeout(() => {
                this.scheduleTaskExecution(task.id);
            }, this.getRetryDelayMs(task.retryCount));
        }
        else {
            // Max retries exceeded, mark as failed
            this.updateTaskStatus(task, TaskStatus.FAILED);
            this.onTaskFailed?.(task, errorMessage);
            // Handle dependent tasks (cancel or reschedule)
            await this.handleDependentTasksOnFailure(task.id);
        }
    }
    // Utility methods and helpers...
    /**
     * Gets default execution time based on complexity
     */
    getDefaultExecutionTime(complexity) {
        switch (complexity) {
            case TaskComplexity.TRIVIAL:
                return 10;
            case TaskComplexity.SIMPLE:
                return 30;
            case TaskComplexity.MODERATE:
                return 60;
            case TaskComplexity.COMPLEX:
                return 120;
            case TaskComplexity.ENTERPRISE:
                return 300;
        }
    }
    /**
     * Updates task status and triggers event handlers
     */
    updateTaskStatus(task, status) {
        const oldStatus = task.status;
        task.status = status;
        task.updatedAt = new Date();
        if (oldStatus !== status) {
            this.onTaskStatusChange?.(task);
        }
    }
}
//# sourceMappingURL=TaskExecutionEngine.js.map