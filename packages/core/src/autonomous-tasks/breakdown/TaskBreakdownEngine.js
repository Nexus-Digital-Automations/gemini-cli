/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import winston from 'winston';
import { TaskType, TaskPriority, TaskStatus, } from '../interfaces/TaskInterfaces.js';
/**
 * Base implementation for task breakdown strategies
 */
export class BaseBreakdownStrategy {
    name;
    description;
    supportedTypes;
    logger;
    constructor(name, description, supportedTypes) {
        this.name = name;
        this.description = description;
        this.supportedTypes = supportedTypes;
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
            defaultMeta: { component: 'TaskBreakdownStrategy', strategy: this.name },
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
                }),
            ],
        });
    }
    /**
     * Check if this strategy can handle the given task
     */
    canBreakdown(task) {
        return this.supportedTypes.includes(task.type) && this.estimateComplexity(task) > 3;
    }
    /**
     * Estimate task complexity using various factors
     */
    estimateComplexity(task) {
        const factors = this.analyzeComplexityFactors(task);
        const weightedScore = factors.reduce((sum, factor) => sum + factor.weight * factor.value, 0);
        return Math.min(10, Math.max(1, Math.round(weightedScore)));
    }
    /**
     * Validate breakdown result
     */
    validateBreakdown(originalTask, subtasks) {
        const validation = this.performBreakdownValidation(originalTask, subtasks);
        return validation.isValid;
    }
    /**
     * Analyze complexity factors for a task
     */
    analyzeComplexityFactors(task) {
        return [
            {
                name: 'description_length',
                weight: 0.2,
                description: 'Length and detail of task description',
                value: Math.min(5, task.description.length / 200),
            },
            {
                name: 'parameter_count',
                weight: 0.15,
                description: 'Number of task parameters',
                value: Math.min(5, Object.keys(task.parameters).length / 10),
            },
            {
                name: 'dependency_count',
                weight: 0.25,
                description: 'Number of task dependencies',
                value: Math.min(5, task.dependencies.length / 3),
            },
            {
                name: 'priority_weight',
                weight: 0.1,
                description: 'Task priority indicating urgency',
                value: task.priority <= TaskPriority.HIGH ? 4 : 2,
            },
            {
                name: 'type_complexity',
                weight: 0.3,
                description: 'Inherent complexity of task type',
                value: this.getTypeComplexity(task.type),
            },
        ];
    }
    /**
     * Get inherent complexity score for task types
     */
    getTypeComplexity(type) {
        const typeComplexities = {
            [TaskType.CODE_GENERATION]: 4,
            [TaskType.CODE_ANALYSIS]: 3,
            [TaskType.TESTING]: 3,
            [TaskType.DOCUMENTATION]: 2,
            [TaskType.BUILD]: 2,
            [TaskType.DEPLOYMENT]: 4,
            [TaskType.REFACTORING]: 5,
            [TaskType.BUG_FIX]: 3,
            [TaskType.FEATURE]: 5,
            [TaskType.MAINTENANCE]: 2,
            [TaskType.SECURITY]: 4,
            [TaskType.PERFORMANCE]: 4,
        };
        return typeComplexities[type] || 3;
    }
    /**
     * Perform comprehensive breakdown validation
     */
    performBreakdownValidation(originalTask, subtasks) {
        const issues = [];
        let coverage = 0;
        let estimatedTimeRatio = 0;
        const complexityDistribution = [];
        // Validate subtask count
        if (subtasks.length === 0) {
            issues.push({
                severity: 'critical',
                type: 'empty_breakdown',
                message: 'Breakdown produced no subtasks',
                affectedTasks: [],
            });
        }
        else if (subtasks.length > 20) {
            issues.push({
                severity: 'warning',
                type: 'excessive_breakdown',
                message: `Breakdown produced too many subtasks (${subtasks.length})`,
                affectedTasks: subtasks.map(t => t.id),
            });
        }
        // Validate subtask complexity
        for (const subtask of subtasks) {
            const complexity = this.estimateComplexity(subtask);
            complexityDistribution.push(complexity);
            if (complexity > 7) {
                issues.push({
                    severity: 'warning',
                    type: 'high_subtask_complexity',
                    message: `Subtask "${subtask.name}" has high complexity (${complexity})`,
                    affectedTasks: [subtask.id],
                });
            }
        }
        // Calculate coverage (simplified heuristic)
        const originalComplexity = this.estimateComplexity(originalTask);
        const totalSubtaskComplexity = complexityDistribution.reduce((sum, c) => sum + c, 0);
        coverage = Math.min(100, (totalSubtaskComplexity / Math.max(1, originalComplexity)) * 100);
        if (coverage < 80) {
            issues.push({
                severity: 'warning',
                type: 'low_coverage',
                message: `Breakdown coverage is low (${coverage.toFixed(1)}%)`,
                affectedTasks: subtasks.map(t => t.id),
            });
        }
        // Estimate time ratio (simplified)
        estimatedTimeRatio = subtasks.length > 0 ? totalSubtaskComplexity / originalComplexity : 0;
        return {
            isValid: !issues.some(issue => issue.severity === 'critical'),
            issues,
            coverage,
            estimatedTimeRatio,
            complexityDistribution,
        };
    }
    /**
     * Generate subtask with inherited properties
     */
    createSubtask(originalTask, name, description, parameters = {}, priority = originalTask.priority) {
        return {
            id: `${originalTask.id}_sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            name,
            description,
            type: originalTask.type,
            priority,
            status: TaskStatus.PENDING,
            dependencies: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            context: { ...originalTask.context },
            parameters: { ...originalTask.parameters, ...parameters },
            parentTaskId: originalTask.id,
            subtasks: [],
            tags: [...originalTask.tags, 'auto-generated', 'subtask'],
            execute: async (context) => {
                throw new Error('Subtask execution not implemented');
            },
            validate: (context) => true,
            cancel: async () => false,
            clone: (overrides) => ({ ...this, ...overrides }),
            getProgress: () => 0,
            getEstimatedCompletion: () => 0,
        };
    }
}
/**
 * Code generation task breakdown strategy
 */
export class CodeGenerationBreakdownStrategy extends BaseBreakdownStrategy {
    constructor() {
        super('code_generation', 'Breaks down code generation tasks into design, implementation, and validation phases', [TaskType.CODE_GENERATION, TaskType.FEATURE]);
    }
    async breakdownTask(task, context) {
        const subtasks = [];
        const complexity = this.estimateComplexity(task);
        // Design phase
        subtasks.push(this.createSubtask(task, `Design: ${task.name}`, `Design architecture and approach for ${task.description}`, { phase: 'design', original_task: task.id }, TaskPriority.HIGH));
        // Implementation phases based on complexity
        if (complexity >= 6) {
            // High complexity - break into multiple implementation phases
            subtasks.push(this.createSubtask(task, `Core Implementation: ${task.name}`, `Implement core functionality for ${task.description}`, { phase: 'core_implementation', original_task: task.id }));
            subtasks.push(this.createSubtask(task, `Extended Implementation: ${task.name}`, `Implement extended features for ${task.description}`, { phase: 'extended_implementation', original_task: task.id }));
        }
        else {
            // Medium complexity - single implementation phase
            subtasks.push(this.createSubtask(task, `Implementation: ${task.name}`, `Implement functionality for ${task.description}`, { phase: 'implementation', original_task: task.id }));
        }
        // Testing phase
        subtasks.push(this.createSubtask(task, `Testing: ${task.name}`, `Create and execute tests for ${task.description}`, { phase: 'testing', original_task: task.id }, TaskPriority.MEDIUM));
        // Documentation phase
        if (complexity >= 5) {
            subtasks.push(this.createSubtask(task, `Documentation: ${task.name}`, `Create documentation for ${task.description}`, { phase: 'documentation', original_task: task.id }, TaskPriority.LOW));
        }
        this.logger.info('Code generation task broken down', {
            originalTask: task.id,
            subtaskCount: subtasks.length,
            complexity,
        });
        return subtasks;
    }
}
/**
 * Analysis task breakdown strategy
 */
export class AnalysisBreakdownStrategy extends BaseBreakdownStrategy {
    constructor() {
        super('analysis', 'Breaks down analysis tasks into data collection, processing, and reporting phases', [TaskType.CODE_ANALYSIS, TaskType.SECURITY, TaskType.PERFORMANCE]);
    }
    async breakdownTask(task, context) {
        const subtasks = [];
        const complexity = this.estimateComplexity(task);
        // Data collection phase
        subtasks.push(this.createSubtask(task, `Data Collection: ${task.name}`, `Collect data and information for ${task.description}`, { phase: 'data_collection', original_task: task.id }, TaskPriority.HIGH));
        // Analysis phases based on complexity
        if (complexity >= 7) {
            // High complexity - multiple analysis phases
            subtasks.push(this.createSubtask(task, `Initial Analysis: ${task.name}`, `Perform initial analysis for ${task.description}`, { phase: 'initial_analysis', original_task: task.id }));
            subtasks.push(this.createSubtask(task, `Deep Analysis: ${task.name}`, `Perform detailed analysis for ${task.description}`, { phase: 'deep_analysis', original_task: task.id }));
        }
        else {
            // Medium complexity - single analysis phase
            subtasks.push(this.createSubtask(task, `Analysis: ${task.name}`, `Perform analysis for ${task.description}`, { phase: 'analysis', original_task: task.id }));
        }
        // Reporting phase
        subtasks.push(this.createSubtask(task, `Reporting: ${task.name}`, `Generate report and recommendations for ${task.description}`, { phase: 'reporting', original_task: task.id }, TaskPriority.MEDIUM));
        // Validation phase for high complexity
        if (complexity >= 6) {
            subtasks.push(this.createSubtask(task, `Validation: ${task.name}`, `Validate analysis results for ${task.description}`, { phase: 'validation', original_task: task.id }, TaskPriority.MEDIUM));
        }
        this.logger.info('Analysis task broken down', {
            originalTask: task.id,
            subtaskCount: subtasks.length,
            complexity,
        });
        return subtasks;
    }
}
/**
 * Testing task breakdown strategy
 */
export class TestingBreakdownStrategy extends BaseBreakdownStrategy {
    constructor() {
        super('testing', 'Breaks down testing tasks into test design, implementation, and execution phases', [TaskType.TESTING]);
    }
    async breakdownTask(task, context) {
        const subtasks = [];
        const complexity = this.estimateComplexity(task);
        // Test design phase
        subtasks.push(this.createSubtask(task, `Test Design: ${task.name}`, `Design test strategy and cases for ${task.description}`, { phase: 'test_design', original_task: task.id }, TaskPriority.HIGH));
        // Test implementation phases
        if (complexity >= 6) {
            // Unit tests
            subtasks.push(this.createSubtask(task, `Unit Tests: ${task.name}`, `Implement unit tests for ${task.description}`, { phase: 'unit_tests', original_task: task.id }));
            // Integration tests
            subtasks.push(this.createSubtask(task, `Integration Tests: ${task.name}`, `Implement integration tests for ${task.description}`, { phase: 'integration_tests', original_task: task.id }));
            // End-to-end tests
            if (complexity >= 8) {
                subtasks.push(this.createSubtask(task, `E2E Tests: ${task.name}`, `Implement end-to-end tests for ${task.description}`, { phase: 'e2e_tests', original_task: task.id }));
            }
        }
        else {
            // Single test implementation phase
            subtasks.push(this.createSubtask(task, `Test Implementation: ${task.name}`, `Implement tests for ${task.description}`, { phase: 'test_implementation', original_task: task.id }));
        }
        // Test execution phase
        subtasks.push(this.createSubtask(task, `Test Execution: ${task.name}`, `Execute tests and validate results for ${task.description}`, { phase: 'test_execution', original_task: task.id }, TaskPriority.MEDIUM));
        this.logger.info('Testing task broken down', {
            originalTask: task.id,
            subtaskCount: subtasks.length,
            complexity,
        });
        return subtasks;
    }
}
/**
 * Main task breakdown engine that coordinates multiple strategies
 */
export class TaskBreakdownEngine {
    logger;
    strategies = new Map();
    constructor() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
            defaultMeta: { component: 'TaskBreakdownEngine' },
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
                }),
            ],
        });
        this.initializeStrategies();
    }
    /**
     * Initialize built-in breakdown strategies
     */
    initializeStrategies() {
        const strategies = [
            new CodeGenerationBreakdownStrategy(),
            new AnalysisBreakdownStrategy(),
            new TestingBreakdownStrategy(),
        ];
        for (const strategy of strategies) {
            this.strategies.set(strategy.name, strategy);
            this.logger.info('Registered breakdown strategy', {
                name: strategy.name,
                supportedTypes: strategy.supportedTypes,
            });
        }
    }
    /**
     * Register custom breakdown strategy
     */
    registerStrategy(strategy) {
        this.strategies.set(strategy.name, strategy);
        this.logger.info('Custom breakdown strategy registered', {
            name: strategy.name,
            supportedTypes: strategy.supportedTypes,
        });
    }
    /**
     * Remove registered strategy
     */
    unregisterStrategy(name) {
        const removed = this.strategies.delete(name);
        if (removed) {
            this.logger.info('Strategy unregistered', { name });
        }
        return removed;
    }
    /**
     * Get all registered strategies
     */
    getStrategies() {
        return Array.from(this.strategies.values());
    }
    /**
     * Analyze task complexity using all available strategies
     */
    analyzeComplexity(task) {
        const startTime = performance.now();
        const applicableStrategies = this.findApplicableStrategies(task);
        if (applicableStrategies.length === 0) {
            return {
                score: 1,
                factors: [],
                recommendedStrategy: null,
                estimatedSubtasks: 0,
                confidence: 0,
            };
        }
        // Use the first applicable strategy for complexity analysis
        const strategy = applicableStrategies[0];
        const complexity = strategy.estimateComplexity(task);
        // Estimate subtask count based on complexity
        let estimatedSubtasks = 0;
        if (complexity >= 8)
            estimatedSubtasks = 5 + Math.floor(complexity / 2);
        else if (complexity >= 5)
            estimatedSubtasks = 3 + Math.floor(complexity / 3);
        else if (complexity >= 3)
            estimatedSubtasks = 2;
        const factors = [];
        if ('analyzeComplexityFactors' in strategy) {
            // Access protected method if available (TypeScript limitation workaround)
            const baseStrategy = strategy;
            if (typeof baseStrategy.analyzeComplexityFactors === 'function') {
                factors.push(...baseStrategy.analyzeComplexityFactors(task));
            }
        }
        const analysisTime = performance.now() - startTime;
        this.logger.info('Task complexity analyzed', {
            taskId: task.id,
            complexity,
            recommendedStrategy: strategy.name,
            estimatedSubtasks,
            analysisTime: `${analysisTime.toFixed(2)}ms`,
        });
        return {
            score: complexity,
            factors,
            recommendedStrategy: strategy.name,
            estimatedSubtasks,
            confidence: applicableStrategies.length / this.strategies.size,
        };
    }
    /**
     * Break down task using appropriate strategy
     */
    async breakdownTask(task, context) {
        const startTime = performance.now();
        try {
            const applicableStrategies = this.findApplicableStrategies(task);
            if (applicableStrategies.length === 0) {
                const error = 'No applicable breakdown strategy found for task';
                this.logger.warn(error, {
                    taskId: task.id,
                    taskType: task.type,
                    availableStrategies: Array.from(this.strategies.keys()),
                });
                return {
                    success: false,
                    subtasks: [],
                    strategy: '',
                    executionTime: performance.now() - startTime,
                    validation: {
                        isValid: false,
                        issues: [{
                                severity: 'critical',
                                type: 'no_strategy',
                                message: error,
                                affectedTasks: [task.id],
                            }],
                        coverage: 0,
                        estimatedTimeRatio: 0,
                        complexityDistribution: [],
                    },
                    dependencies: [],
                    error,
                };
            }
            // Use the first applicable strategy
            const strategy = applicableStrategies[0];
            const subtasks = await strategy.breakdownTask(task, context);
            // Generate dependencies between subtasks
            const dependencies = this.generateTaskDependencies(subtasks);
            // Update parent task with subtask references
            task.subtasks.push(...subtasks.map(st => st.id));
            // Validate breakdown
            const validation = strategy.performBreakdownValidation
                ? strategy.performBreakdownValidation(task, subtasks)
                : { isValid: true, issues: [], coverage: 100, estimatedTimeRatio: 1, complexityDistribution: [] };
            const executionTime = performance.now() - startTime;
            this.logger.info('Task breakdown completed', {
                taskId: task.id,
                strategy: strategy.name,
                subtaskCount: subtasks.length,
                dependencyCount: dependencies.length,
                isValid: validation.isValid,
                executionTime: `${executionTime.toFixed(2)}ms`,
            });
            return {
                success: true,
                subtasks,
                strategy: strategy.name,
                executionTime,
                validation,
                dependencies,
            };
        }
        catch (error) {
            const executionTime = performance.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('Task breakdown failed', {
                taskId: task.id,
                error: errorMessage,
                executionTime: `${executionTime.toFixed(2)}ms`,
            });
            return {
                success: false,
                subtasks: [],
                strategy: '',
                executionTime,
                validation: {
                    isValid: false,
                    issues: [{
                            severity: 'critical',
                            type: 'breakdown_error',
                            message: errorMessage,
                            affectedTasks: [task.id],
                        }],
                    coverage: 0,
                    estimatedTimeRatio: 0,
                    complexityDistribution: [],
                },
                dependencies: [],
                error: errorMessage,
            };
        }
    }
    /**
     * Find strategies that can handle the given task
     */
    findApplicableStrategies(task) {
        return Array.from(this.strategies.values()).filter(strategy => strategy.canBreakdown(task));
    }
    /**
     * Generate dependencies between subtasks based on their phases
     */
    generateTaskDependencies(subtasks) {
        const dependencies = [];
        // Sort subtasks by their phase to determine natural dependencies
        const phasedTasks = subtasks.map(task => ({
            task,
            phase: task.parameters.phase || '',
        }));
        const phaseOrder = [
            'design', 'data_collection', 'test_design',
            'core_implementation', 'implementation', 'extended_implementation',
            'initial_analysis', 'analysis', 'deep_analysis',
            'unit_tests', 'integration_tests', 'test_implementation',
            'e2e_tests', 'test_execution', 'testing',
            'validation', 'reporting', 'documentation'
        ];
        // Create sequential dependencies based on phase order
        for (let i = 0; i < phasedTasks.length - 1; i++) {
            const currentTask = phasedTasks[i];
            const nextTasks = phasedTasks.slice(i + 1);
            const currentPhaseIndex = phaseOrder.indexOf(currentTask.phase);
            for (const nextTask of nextTasks) {
                const nextPhaseIndex = phaseOrder.indexOf(nextTask.phase);
                // Create dependency if phases are in logical order
                if (currentPhaseIndex !== -1 && nextPhaseIndex !== -1 && currentPhaseIndex < nextPhaseIndex) {
                    dependencies.push({
                        from: currentTask.task.id,
                        to: nextTask.task.id,
                        type: 'sequential',
                        strength: 0.8,
                        reason: `${currentTask.phase} must complete before ${nextTask.phase}`,
                    });
                    break; // Only depend on immediate next phase
                }
            }
        }
        return dependencies;
    }
    /**
     * Get breakdown statistics
     */
    getStats() {
        const strategyStats = Array.from(this.strategies.entries()).map(([name, strategy]) => ({
            name,
            supportedTypes: strategy.supportedTypes,
            description: strategy.description,
        }));
        return {
            totalStrategies: this.strategies.size,
            strategies: strategyStats,
        };
    }
    /**
     * Dispose of the breakdown engine
     */
    dispose() {
        this.strategies.clear();
        this.logger.info('Task breakdown engine disposed');
    }
}
//# sourceMappingURL=TaskBreakdownEngine.js.map