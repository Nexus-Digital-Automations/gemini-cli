/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { TaskType, TaskPriority, TaskStatus, TaskDependency, TaskMetrics, } from './interfaces/TaskInterfaces.js';
/**
 * Default breakdown configuration
 */
const DEFAULT_CONFIG = {
    enabled: true,
    maxDepth: 5,
    complexityThreshold: 7,
    maxSubtasks: 20,
    enableDependencyAnalysis: true,
    enableParallelOptimization: true,
};
/**
 * Intelligent task breakdown system
 *
 * Provides sophisticated algorithms for decomposing complex tasks into
 * manageable subtasks with optimal execution strategies:
 * - Complexity analysis and breakdown decision making
 * - Task type-specific decomposition strategies
 * - Automatic dependency analysis and resolution
 * - Parallel execution opportunity identification
 * - Resource optimization and load balancing
 */
export class TaskBreakdown {
    config;
    strategies = new Map();
    breakdownHistory = new Map();
    subtaskCounter = { value: 0 };
    constructor(config) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        // Initialize built-in breakdown strategies
        this.initializeStrategies();
        this.config.logger.info('TaskBreakdown initialized', {
            enabled: this.config.enabled,
            strategiesCount: this.strategies.size,
        });
    }
    /**
     * Analyze if a task should be broken down
     */
    async shouldBreakdown(task) {
        if (!this.config.enabled) {
            return false;
        }
        // Check if task already has subtasks (avoid recursive breakdown)
        if (task.subtasks.length > 0) {
            return false;
        }
        // Check breakdown depth to prevent infinite recursion
        const depth = this.getTaskDepth(task);
        if (depth >= this.config.maxDepth) {
            this.config.logger.warn('Task breakdown depth limit reached', {
                taskId: task.id,
                depth,
                maxDepth: this.config.maxDepth,
            });
            return false;
        }
        // Analyze task complexity
        const analysis = await this.analyzeComplexity(task);
        this.breakdownHistory.set(task.id, analysis);
        this.config.logger.debug('Task complexity analysis completed', {
            taskId: task.id,
            complexity: analysis.score,
            recommended: analysis.breakdownRecommended,
            strategy: analysis.suggestedStrategy,
        });
        return analysis.breakdownRecommended;
    }
    /**
     * Break down a complex task into subtasks
     */
    async breakdownTask(task, context) {
        const startTime = Date.now();
        try {
            // Get appropriate breakdown strategy
            const strategy = this.strategies.get(task.type);
            if (!strategy) {
                throw new Error(`No breakdown strategy found for task type: ${task.type}`);
            }
            this.config.logger.info('Starting task breakdown', {
                taskId: task.id,
                taskType: task.type,
                strategy: strategy.name,
            });
            // Generate subtasks using strategy
            const subtasks = await strategy.breakdownTask(task, context);
            // Validate breakdown result
            if (!strategy.validateBreakdown(task, subtasks)) {
                throw new Error('Invalid breakdown result');
            }
            // Limit number of subtasks
            if (subtasks.length > this.config.maxSubtasks) {
                this.config.logger.warn('Too many subtasks generated, truncating', {
                    taskId: task.id,
                    generated: subtasks.length,
                    limit: this.config.maxSubtasks,
                });
                subtasks.splice(this.config.maxSubtasks);
            }
            // Enhance subtasks with metadata
            const enhancedSubtasks = await this.enhanceSubtasks(task, subtasks, context);
            // Analyze and optimize dependencies
            if (this.config.enableDependencyAnalysis) {
                await this.analyzeDependencies(enhancedSubtasks);
            }
            // Optimize for parallel execution
            if (this.config.enableParallelOptimization) {
                await this.optimizeForParallelExecution(enhancedSubtasks);
            }
            // Update parent task
            task.subtasks = enhancedSubtasks.map(subtask => subtask.id);
            const duration = Date.now() - startTime;
            this.config.logger.info('Task breakdown completed', {
                taskId: task.id,
                subtasksCreated: enhancedSubtasks.length,
                duration: `${duration}ms`,
            });
            return enhancedSubtasks;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.config.logger.error('Task breakdown failed', {
                taskId: task.id,
                error: errorMessage,
            });
            throw error;
        }
    }
    /**
     * Get optimal execution order for subtasks considering dependencies
     */
    getExecutionOrder(subtasks) {
        if (subtasks.length === 0) {
            return [];
        }
        const executionGroups = [];
        const remaining = new Set(subtasks);
        const completed = new Set();
        // Build dependency graph
        const dependencyMap = new Map();
        for (const task of subtasks) {
            dependencyMap.set(task.id, new Set());
            for (const dep of task.dependencies) {
                if (dep.type === 'prerequisite' && !dep.optional) {
                    dependencyMap.get(task.id).add(dep.taskId);
                }
            }
        }
        // Create execution groups using topological sort
        while (remaining.size > 0) {
            const currentGroup = [];
            // Find tasks with no unresolved dependencies
            for (const task of remaining) {
                const dependencies = dependencyMap.get(task.id) || new Set();
                const unresolvedDeps = [...dependencies].filter(depId => !completed.has(depId));
                if (unresolvedDeps.length === 0) {
                    currentGroup.push(task);
                }
            }
            // If no tasks can be executed, we have a circular dependency
            if (currentGroup.length === 0) {
                this.config.logger.warn('Circular dependency detected, breaking with remaining tasks', {
                    remainingTasks: Array.from(remaining).map(t => t.id),
                });
                // Add remaining tasks to force execution
                currentGroup.push(...remaining);
            }
            // Add current group to execution order
            if (currentGroup.length > 0) {
                executionGroups.push(currentGroup);
                // Mark tasks as completed and remove from remaining
                for (const task of currentGroup) {
                    completed.add(task.id);
                    remaining.delete(task);
                }
            }
        }
        this.config.logger.debug('Execution order determined', {
            totalTasks: subtasks.length,
            executionGroups: executionGroups.length,
            groupSizes: executionGroups.map(group => group.length),
        });
        return executionGroups;
    }
    /**
     * Register a custom breakdown strategy
     */
    registerStrategy(strategy) {
        for (const taskType of strategy.supportedTypes) {
            this.strategies.set(taskType, strategy);
        }
        this.config.logger.info('Breakdown strategy registered', {
            name: strategy.name,
            supportedTypes: strategy.supportedTypes,
        });
    }
    /**
     * Get breakdown statistics
     */
    getStats() {
        const analyses = Array.from(this.breakdownHistory.values());
        return {
            totalBreakdowns: analyses.length,
            averageComplexity: analyses.length > 0
                ? analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length
                : 0,
            strategiesUsed: analyses.reduce((acc, a) => {
                acc[a.suggestedStrategy] = (acc[a.suggestedStrategy] || 0) + 1;
                return acc;
            }, {}),
            averageSubtasks: analyses.length > 0
                ? analyses.reduce((sum, a) => sum + a.estimatedSubtasks, 0) / analyses.length
                : 0,
        };
    }
    /**
     * Analyze task complexity to determine if breakdown is beneficial
     */
    async analyzeComplexity(task) {
        const factors = {};
        // Parameter complexity
        factors.parameterComplexity = this.analyzeParameterComplexity(task.parameters);
        // Task type complexity
        factors.typeComplexity = this.getTaskTypeComplexity(task.type);
        // Description complexity
        factors.descriptionComplexity = this.analyzeDescriptionComplexity(task.description);
        // Priority impact (higher priority tasks may benefit from breakdown)
        factors.priorityImpact = (6 - task.priority) * 0.5;
        // Context complexity
        factors.contextComplexity = this.analyzeContextComplexity(task.context);
        // Existing subtasks penalty (avoid re-breakdown)
        factors.subtaskPenalty = task.subtasks.length > 0 ? -5 : 0;
        // Calculate overall complexity score
        const score = Object.values(factors).reduce((sum, value) => sum + value, 0);
        // Determine breakdown recommendation
        const breakdownRecommended = score >= this.config.complexityThreshold;
        // Suggest appropriate strategy
        const suggestedStrategy = this.suggestStrategy(task, factors);
        // Estimate number of subtasks
        const estimatedSubtasks = Math.min(Math.max(2, Math.floor(score / 2)), this.config.maxSubtasks);
        return {
            score,
            factors,
            breakdownRecommended,
            suggestedStrategy,
            estimatedSubtasks,
        };
    }
    /**
     * Analyze parameter complexity
     */
    analyzeParameterComplexity(parameters) {
        const keys = Object.keys(parameters);
        let complexity = keys.length * 0.5;
        // Check for nested objects
        for (const value of Object.values(parameters)) {
            if (typeof value === 'object' && value !== null) {
                complexity += 1;
            }
            if (Array.isArray(value)) {
                complexity += value.length * 0.1;
            }
        }
        return Math.min(complexity, 5);
    }
    /**
     * Get complexity score for task type
     */
    getTaskTypeComplexity(type) {
        const complexityMap = {
            [TaskType.CODE_GENERATION]: 4,
            [TaskType.CODE_ANALYSIS]: 3,
            [TaskType.TESTING]: 3,
            [TaskType.DOCUMENTATION]: 2,
            [TaskType.BUILD]: 2,
            [TaskType.DEPLOYMENT]: 4,
            [TaskType.REFACTORING]: 4,
            [TaskType.BUG_FIX]: 2,
            [TaskType.FEATURE]: 5,
            [TaskType.MAINTENANCE]: 2,
            [TaskType.SECURITY]: 3,
            [TaskType.PERFORMANCE]: 3,
        };
        return complexityMap[type] || 2;
    }
    /**
     * Analyze description complexity
     */
    analyzeDescriptionComplexity(description) {
        // Simple heuristics based on description content
        let complexity = 0;
        const words = description.split(/\s+/).length;
        complexity += Math.min(words / 20, 3); // Word count factor
        // Look for complexity indicators
        const complexityKeywords = [
            'integrate', 'optimize', 'refactor', 'implement', 'analyze',
            'multiple', 'complex', 'advanced', 'sophisticated'
        ];
        for (const keyword of complexityKeywords) {
            if (description.toLowerCase().includes(keyword)) {
                complexity += 0.5;
            }
        }
        return Math.min(complexity, 4);
    }
    /**
     * Analyze context complexity
     */
    analyzeContextComplexity(context) {
        let complexity = 0;
        // Configuration complexity
        complexity += Object.keys(context.config).length * 0.2;
        // Environment variables
        complexity += Object.keys(context.environment).length * 0.1;
        // Timeout indicates potentially long-running task
        if (context.timeout > 300000) { // 5 minutes
            complexity += 1;
        }
        return Math.min(complexity, 3);
    }
    /**
     * Suggest appropriate breakdown strategy
     */
    suggestStrategy(task, factors) {
        const strategy = this.strategies.get(task.type);
        return strategy?.name || 'default';
    }
    /**
     * Get task depth in breakdown hierarchy
     */
    getTaskDepth(task) {
        let depth = 0;
        const currentTask = task;
        while (currentTask.parentTaskId) {
            depth++;
            // In a real implementation, you'd look up the parent task
            // For now, we'll break to avoid infinite loops
            break;
        }
        return depth;
    }
    /**
     * Enhance subtasks with additional metadata and context
     */
    async enhanceSubtasks(parentTask, subtasks, context) {
        return subtasks.map((subtask, index) => {
            // Set parent relationship
            subtask.parentTaskId = parentTask.id;
            // Inherit context with modifications
            subtask.context = {
                ...context,
                sessionId: `${context.sessionId}-sub${index}`,
                config: {
                    ...context.config,
                    parentTaskId: parentTask.id,
                },
            };
            // Inherit tags from parent
            subtask.tags = [...new Set([...subtask.tags, ...parentTask.tags, 'subtask'])];
            // Set creation and update timestamps
            subtask.updatedAt = new Date();
            return subtask;
        });
    }
    /**
     * Analyze and set up dependencies between subtasks
     */
    async analyzeDependencies(subtasks) {
        // Simple heuristic-based dependency analysis
        for (let i = 0; i < subtasks.length; i++) {
            const currentTask = subtasks[i];
            // Analysis tasks typically depend on setup tasks
            if (currentTask.type === TaskType.CODE_ANALYSIS) {
                const setupTasks = subtasks.filter(t => t.type === TaskType.BUILD ||
                    t.name.toLowerCase().includes('setup') ||
                    t.name.toLowerCase().includes('prepare'));
                for (const setupTask of setupTasks) {
                    if (setupTask.id !== currentTask.id) {
                        currentTask.dependencies.push({
                            taskId: setupTask.id,
                            type: 'prerequisite',
                            optional: false,
                        });
                    }
                }
            }
            // Testing tasks depend on implementation tasks
            if (currentTask.type === TaskType.TESTING) {
                const implTasks = subtasks.filter(t => t.type === TaskType.CODE_GENERATION ||
                    t.type === TaskType.FEATURE ||
                    t.type === TaskType.BUG_FIX);
                for (const implTask of implTasks) {
                    if (implTask.id !== currentTask.id) {
                        currentTask.dependencies.push({
                            taskId: implTask.id,
                            type: 'prerequisite',
                            optional: false,
                        });
                    }
                }
            }
            // Documentation can run in parallel but may benefit from completed implementation
            if (currentTask.type === TaskType.DOCUMENTATION) {
                const implTasks = subtasks.filter(t => t.type === TaskType.CODE_GENERATION ||
                    t.type === TaskType.FEATURE);
                for (const implTask of implTasks) {
                    if (implTask.id !== currentTask.id) {
                        currentTask.dependencies.push({
                            taskId: implTask.id,
                            type: 'soft_dependency',
                            optional: true,
                        });
                    }
                }
            }
        }
        this.config.logger.debug('Dependency analysis completed', {
            totalDependencies: subtasks.reduce((sum, task) => sum + task.dependencies.length, 0),
        });
    }
    /**
     * Optimize subtasks for parallel execution
     */
    async optimizeForParallelExecution(subtasks) {
        // Group tasks by type for better parallel execution
        const taskGroups = new Map();
        for (const task of subtasks) {
            if (!taskGroups.has(task.type)) {
                taskGroups.set(task.type, []);
            }
            taskGroups.get(task.type).push(task);
        }
        // Adjust priorities for better parallelization
        for (const [taskType, tasks] of taskGroups.entries()) {
            if (tasks.length > 1) {
                // For multiple tasks of same type, slightly vary priorities
                // to prevent all tasks competing for same resources
                tasks.forEach((task, index) => {
                    if (index > 0) {
                        task.priority = Math.min(TaskPriority.BACKGROUND, task.priority + 1);
                    }
                });
            }
        }
        this.config.logger.debug('Parallel execution optimization completed', {
            taskGroups: Array.from(taskGroups.entries()).map(([type, tasks]) => ({
                type,
                count: tasks.length,
            })),
        });
    }
    /**
     * Initialize built-in breakdown strategies
     */
    initializeStrategies() {
        // Register default strategies for each task type
        this.registerStrategy(new CodeGenerationStrategy());
        this.registerStrategy(new CodeAnalysisStrategy());
        this.registerStrategy(new TestingStrategy());
        this.registerStrategy(new FeatureStrategy());
        this.registerStrategy(new RefactoringStrategy());
        this.registerStrategy(new DeploymentStrategy());
    }
}
/**
 * Code generation breakdown strategy
 */
class CodeGenerationStrategy {
    name = 'CodeGenerationStrategy';
    description = 'Breaks down code generation tasks into planning, implementation, and validation phases';
    supportedTypes = [TaskType.CODE_GENERATION];
    canBreakdown(task) {
        return task.type === TaskType.CODE_GENERATION &&
            (task.description.length > 100 || Object.keys(task.parameters).length > 3);
    }
    async breakdownTask(task, context) {
        const subtasks = [];
        // Planning phase
        subtasks.push(this.createSubtask({
            name: `Plan ${task.name}`,
            description: `Analyze requirements and create implementation plan for ${task.description}`,
            type: TaskType.CODE_ANALYSIS,
            priority: task.priority,
            parameters: { ...task.parameters, phase: 'planning' },
        }, task, context));
        // Implementation phase
        subtasks.push(this.createSubtask({
            name: `Implement ${task.name}`,
            description: `Generate code for ${task.description}`,
            type: TaskType.CODE_GENERATION,
            priority: task.priority,
            dependencies: [subtasks[0].id],
            parameters: { ...task.parameters, phase: 'implementation' },
        }, task, context));
        // Validation phase
        subtasks.push(this.createSubtask({
            name: `Validate ${task.name}`,
            description: `Review and validate generated code for ${task.description}`,
            type: TaskType.TESTING,
            priority: task.priority,
            dependencies: [subtasks[1].id],
            parameters: { ...task.parameters, phase: 'validation' },
        }, task, context));
        return subtasks;
    }
    estimateComplexity(task) {
        return this.getTaskTypeComplexity(task.type);
    }
    validateBreakdown(originalTask, subtasks) {
        return subtasks.length >= 2 && subtasks.length <= 5;
    }
    createSubtask(template, parentTask, context) {
        return {
            id: `${parentTask.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: template.name,
            description: template.description,
            type: template.type,
            priority: template.priority,
            status: TaskStatus.PENDING,
            dependencies: template.dependencies?.map(depId => ({
                taskId: depId,
                type: 'prerequisite',
                optional: false,
            })) || [],
            createdAt: new Date(),
            updatedAt: new Date(),
            context,
            parameters: template.parameters || {},
            parentTaskId: parentTask.id,
            subtasks: [],
            tags: [...parentTask.tags, 'generated-subtask'],
            execute: async (ctx) => 
            // Placeholder implementation - would be replaced with actual task logic
            ({
                success: true,
                messages: [`Subtask ${template.name} completed`],
                metrics: {
                    startTime: new Date(),
                    endTime: new Date(),
                    duration: 100,
                    memoryUsage: 0,
                    cpuUsage: 0,
                    retryCount: 0,
                    performanceScore: 95,
                },
            }),
            validate: (ctx) => true,
            cancel: async () => true,
            clone: (overrides) => {
                throw new Error('Clone not implemented for generated subtasks');
            },
            getProgress: () => 0,
            getEstimatedCompletion: () => template.estimatedDuration || 60000,
        };
    }
    getTaskTypeComplexity(type) {
        const complexityMap = {
            [TaskType.CODE_GENERATION]: 4,
            [TaskType.CODE_ANALYSIS]: 3,
            [TaskType.TESTING]: 3,
            [TaskType.DOCUMENTATION]: 2,
            [TaskType.BUILD]: 2,
            [TaskType.DEPLOYMENT]: 4,
            [TaskType.REFACTORING]: 4,
            [TaskType.BUG_FIX]: 2,
            [TaskType.FEATURE]: 5,
            [TaskType.MAINTENANCE]: 2,
            [TaskType.SECURITY]: 3,
            [TaskType.PERFORMANCE]: 3,
        };
        return complexityMap[type] || 2;
    }
}
// Additional strategy classes for other task types
class CodeAnalysisStrategy {
    name = 'CodeAnalysisStrategy';
    description = 'Breaks down code analysis into static analysis, complexity analysis, and reporting';
    supportedTypes = [TaskType.CODE_ANALYSIS];
    canBreakdown(task) {
        return task.type === TaskType.CODE_ANALYSIS;
    }
    async breakdownTask(task, context) {
        // Implementation would create subtasks for different analysis types
        return [];
    }
    estimateComplexity(task) {
        return 3;
    }
    validateBreakdown(originalTask, subtasks) {
        return subtasks.length > 0;
    }
}
class TestingStrategy {
    name = 'TestingStrategy';
    description = 'Breaks down testing into unit, integration, and end-to-end tests';
    supportedTypes = [TaskType.TESTING];
    canBreakdown(task) {
        return task.type === TaskType.TESTING;
    }
    async breakdownTask(task, context) {
        // Implementation would create different types of test subtasks
        return [];
    }
    estimateComplexity(task) {
        return 3;
    }
    validateBreakdown(originalTask, subtasks) {
        return subtasks.length > 0;
    }
}
class FeatureStrategy {
    name = 'FeatureStrategy';
    description = 'Breaks down feature development into design, implementation, and testing phases';
    supportedTypes = [TaskType.FEATURE];
    canBreakdown(task) {
        return task.type === TaskType.FEATURE;
    }
    async breakdownTask(task, context) {
        // Implementation would create feature development subtasks
        return [];
    }
    estimateComplexity(task) {
        return 5;
    }
    validateBreakdown(originalTask, subtasks) {
        return subtasks.length > 0;
    }
}
class RefactoringStrategy {
    name = 'RefactoringStrategy';
    description = 'Breaks down refactoring into analysis, planning, implementation, and validation';
    supportedTypes = [TaskType.REFACTORING];
    canBreakdown(task) {
        return task.type === TaskType.REFACTORING;
    }
    async breakdownTask(task, context) {
        // Implementation would create refactoring subtasks
        return [];
    }
    estimateComplexity(task) {
        return 4;
    }
    validateBreakdown(originalTask, subtasks) {
        return subtasks.length > 0;
    }
}
class DeploymentStrategy {
    name = 'DeploymentStrategy';
    description = 'Breaks down deployment into preparation, execution, and verification phases';
    supportedTypes = [TaskType.DEPLOYMENT];
    canBreakdown(task) {
        return task.type === TaskType.DEPLOYMENT;
    }
    async breakdownTask(task, context) {
        // Implementation would create deployment subtasks
        return [];
    }
    estimateComplexity(task) {
        return 4;
    }
    validateBreakdown(originalTask, subtasks) {
        return subtasks.length > 0;
    }
}
//# sourceMappingURL=TaskBreakdown.js.map