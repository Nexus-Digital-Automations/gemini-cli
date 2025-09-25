/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { randomUUID } from 'node:crypto';
import { TaskComplexity } from '../task-management/types.js';
/**
 * Using canonical enums from types.ts:
 * - TaskComplexity: TRIVIAL, SIMPLE, MODERATE, COMPLEX, ENTERPRISE
 * - TaskCategory: implementation, testing, documentation, analysis, refactoring, deployment
 * - TaskPriority: critical, high, medium, low
 */
/**
 * Task execution status
 */
export let TaskStatus = {};
(function (TaskStatus) {
    TaskStatus["PENDING"] = "pending";
    TaskStatus["IN_PROGRESS"] = "in_progress";
    TaskStatus["BLOCKED"] = "blocked";
    TaskStatus["COMPLETED"] = "completed";
    TaskStatus["FAILED"] = "failed";
    TaskStatus["CANCELLED"] = "cancelled";
})(TaskStatus || (TaskStatus = {}));
/**
 * Autonomous Task Breakdown Engine
 *
 * This engine analyzes complex requests and intelligently decomposes them into
 * manageable, executable tasks with proper dependency management and execution strategies.
 */
export class TaskBreakdownEngine {
    decompositionRules = new Map();
    breakdownStrategies = new Map();
    complexityAnalyzers = [];
    constructor() {
        this.initializeDefaultRules();
        this.initializeDefaultStrategies();
        this.initializeComplexityAnalyzers();
    }
    /**
     * Analyzes task complexity using multiple factors
     */
    async analyzeComplexity(request, context) {
        const factors = [];
        let totalWeight = 0;
        let weightedComplexity = 0;
        // Run all complexity analyzers
        for (const analyzer of this.complexityAnalyzers) {
            const result = await analyzer.analyze(request, context);
            factors.push(...result.factors);
            for (const factor of result.factors) {
                totalWeight += factor.weight;
                weightedComplexity +=
                    this.getComplexityScore(result.complexity) * factor.weight;
            }
        }
        const averageComplexity = totalWeight > 0 ? weightedComplexity / totalWeight : 1;
        const complexity = this.scoreToComplexity(averageComplexity);
        // Calculate confidence based on factor agreement
        const confidence = this.calculateConfidence(factors);
        return {
            complexity,
            confidence,
            factors,
            recommendedBreakdown: complexity !== TaskComplexity.SIMPLE || factors.length > 3,
            estimatedSubtasks: this.estimateSubtasks(complexity, factors),
            estimatedDuration: this.estimateDuration(complexity, factors, request),
        };
    }
    /**
     * Breaks down a complex task into manageable subtasks
     */
    async breakdownTask(request, context, parentTaskId, depth = 0) {
        const maxDepth = context.preferences?.maxTaskDepth ?? 4;
        if (depth >= maxDepth) {
            console.warn(`[TaskBreakdownEngine] Maximum depth ${maxDepth} reached, stopping breakdown`);
            return [];
        }
        // Analyze complexity first
        const complexityResult = await this.analyzeComplexity(request, context);
        // Create root task
        const rootTask = this.createTask(request, context, complexityResult, parentTaskId);
        // If simple enough, return as single task
        if (!complexityResult.recommendedBreakdown) {
            return [rootTask];
        }
        // Find applicable breakdown strategies
        const strategies = this.findApplicableStrategies(rootTask, complexityResult);
        if (strategies.length === 0) {
            console.warn(`[TaskBreakdownEngine] No applicable strategies found for task: ${request}`);
            return [rootTask];
        }
        // Use the best strategy to decompose
        const bestStrategy = strategies[0]; // Strategies are sorted by priority
        const subtasks = await this.applyBreakdownStrategy(rootTask, bestStrategy, context, depth + 1);
        // Set up parent-child relationships
        rootTask.childTaskIds = subtasks.map((task) => task.id);
        subtasks.forEach((task) => {
            task.parentTaskId = rootTask.id;
        });
        // Recursively break down complex subtasks
        const allTasks = [rootTask];
        for (const subtask of subtasks) {
            if (subtask.complexity !== TaskComplexity.SIMPLE) {
                const nestedTasks = await this.breakdownTask(subtask.description, context, subtask.id, depth + 1);
                allTasks.push(...nestedTasks);
            }
            else {
                allTasks.push(subtask);
            }
        }
        return allTasks;
    }
    /**
     * Creates a new autonomous task from request and context
     */
    createTask(request, context, complexityResult, parentTaskId) {
        const category = this.categorizeTask(request);
        const priority = this.determinePriority(category, complexityResult);
        return {
            id: randomUUID(),
            title: this.extractTitle(request),
            description: request,
            category,
            complexity: complexityResult.complexity,
            priority,
            status: TaskStatus.PENDING,
            parentTaskId,
            childTaskIds: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            estimatedDuration: complexityResult.estimatedDuration,
            successCriteria: this.generateSuccessCriteria(request, category),
            validationSteps: this.generateValidationSteps(request, category),
            maxRetries: this.getDefaultRetries(complexityResult.complexity),
            currentRetries: 0,
            executionStrategy: this.selectExecutionStrategy(category, complexityResult.complexity),
            rollbackSteps: this.generateRollbackSteps(request, category),
        };
    }
    /**
     * Categorizes a task based on its content and intent
     */
    categorizeTask(request) {
        const lowerRequest = request.toLowerCase();
        // Pattern matching for task categorization
        if (lowerRequest.includes('read') ||
            lowerRequest.includes('view') ||
            lowerRequest.includes('show')) {
            return TaskCategory.READ;
        }
        if (lowerRequest.includes('edit') ||
            lowerRequest.includes('modify') ||
            lowerRequest.includes('change')) {
            return TaskCategory.EDIT;
        }
        if (lowerRequest.includes('create') ||
            lowerRequest.includes('add') ||
            lowerRequest.includes('new')) {
            return TaskCategory.CREATE;
        }
        if (lowerRequest.includes('delete') || lowerRequest.includes('remove')) {
            return TaskCategory.DELETE;
        }
        if (lowerRequest.includes('search') ||
            lowerRequest.includes('find') ||
            lowerRequest.includes('grep')) {
            return TaskCategory.SEARCH;
        }
        if (lowerRequest.includes('analyze') ||
            lowerRequest.includes('review') ||
            lowerRequest.includes('inspect')) {
            return TaskCategory.ANALYZE;
        }
        if (lowerRequest.includes('run') ||
            lowerRequest.includes('execute') ||
            lowerRequest.includes('build')) {
            return TaskCategory.EXECUTE;
        }
        if (lowerRequest.includes('refactor') ||
            lowerRequest.includes('restructure')) {
            return TaskCategory.REFACTOR;
        }
        if (lowerRequest.includes('test') || lowerRequest.includes('verify')) {
            return TaskCategory.TEST;
        }
        if (lowerRequest.includes('deploy') || lowerRequest.includes('release')) {
            return TaskCategory.DEPLOY;
        }
        if (lowerRequest.includes('validate') || lowerRequest.includes('check')) {
            return TaskCategory.VALIDATE;
        }
        if (lowerRequest.includes('optimize') ||
            lowerRequest.includes('improve') ||
            lowerRequest.includes('enhance')) {
            return TaskCategory.OPTIMIZE;
        }
        if (lowerRequest.includes('debug') ||
            lowerRequest.includes('fix') ||
            lowerRequest.includes('troubleshoot')) {
            return TaskCategory.DEBUG;
        }
        if (lowerRequest.includes('document') ||
            lowerRequest.includes('comment') ||
            lowerRequest.includes('explain')) {
            return TaskCategory.DOCUMENT;
        }
        // Default to analyze if uncertain
        return TaskCategory.ANALYZE;
    }
    /**
     * Determines task priority based on category and complexity
     */
    determinePriority(category, complexityResult) {
        // Critical categories get higher priority
        if (category === TaskCategory.DEBUG || category === TaskCategory.VALIDATE) {
            return TaskPriority.HIGH;
        }
        // Complex tasks get higher priority for early execution
        if (complexityResult.complexity === TaskComplexity.HIGHLY_COMPLEX) {
            return TaskPriority.HIGH;
        }
        if (complexityResult.complexity === TaskComplexity.COMPLEX) {
            return TaskPriority.NORMAL;
        }
        return TaskPriority.NORMAL;
    }
    /**
     * Extracts a concise title from the full request
     */
    extractTitle(request) {
        // Take first sentence or first 50 characters
        const firstSentence = request.split(/[.!?]/)[0];
        return firstSentence.length > 50
            ? firstSentence.substring(0, 50) + '...'
            : firstSentence;
    }
    /**
     * Generates success criteria for task validation
     */
    generateSuccessCriteria(request, category) {
        const criteria = [];
        switch (category) {
            case TaskCategory.CREATE:
                criteria.push('Files/resources created successfully');
                criteria.push('No compilation or syntax errors');
                break;
            case TaskCategory.EDIT:
                criteria.push('Changes applied correctly');
                criteria.push('No breaking changes introduced');
                criteria.push('Tests pass after modifications');
                break;
            case TaskCategory.EXECUTE:
                criteria.push('Command executed successfully');
                criteria.push('Expected output produced');
                criteria.push('No error codes returned');
                break;
            case TaskCategory.TEST:
                criteria.push('All tests pass');
                criteria.push('Coverage meets requirements');
                break;
            default:
                criteria.push('Task objective achieved');
                criteria.push('No errors encountered');
        }
        return criteria;
    }
    /**
     * Generates validation steps for task completion
     */
    generateValidationSteps(request, category) {
        const steps = [];
        switch (category) {
            case TaskCategory.CREATE:
            case TaskCategory.EDIT:
                steps.push('Verify file syntax and structure');
                steps.push('Run linter checks');
                steps.push('Execute relevant tests');
                break;
            case TaskCategory.EXECUTE:
                steps.push('Check exit code');
                steps.push('Verify expected output');
                steps.push('Check for error messages');
                break;
            case TaskCategory.TEST:
                steps.push('Run test suite');
                steps.push('Verify coverage metrics');
                steps.push('Check for test failures');
                break;
            default:
                steps.push('Verify task completion');
                steps.push('Check for unexpected side effects');
        }
        return steps;
    }
    /**
     * Determines default retry count based on complexity
     */
    getDefaultRetries(complexity) {
        switch (complexity) {
            case TaskComplexity.SIMPLE:
                return 1;
            case TaskComplexity.MODERATE:
                return 2;
            case TaskComplexity.COMPLEX:
                return 3;
            case TaskComplexity.HIGHLY_COMPLEX:
                return 3;
            default:
                return 2;
        }
    }
    /**
     * Selects appropriate execution strategy based on task characteristics
     */
    selectExecutionStrategy(category, complexity) {
        const baseStrategy = {
            type: 'sequential',
            maxConcurrency: 1,
            retryPolicy: {
                maxRetries: this.getDefaultRetries(complexity),
                backoffStrategy: 'exponential',
                baseDelayMs: 1000,
                maxDelayMs: 30000,
            },
            timeoutMinutes: this.getTimeoutMinutes(complexity),
            requiresConfirmation: this.requiresConfirmation(category),
            preExecutionChecks: this.getPreExecutionChecks(category),
            postExecutionValidation: this.getPostExecutionValidation(category),
        };
        // Adjust strategy based on category
        if (category === TaskCategory.SEARCH || category === TaskCategory.READ) {
            baseStrategy.type = 'parallel';
            baseStrategy.maxConcurrency = 3;
        }
        if (category === TaskCategory.EXECUTE || category === TaskCategory.DELETE) {
            baseStrategy.requiresConfirmation = true;
        }
        return baseStrategy;
    }
    /**
     * Generates rollback steps for error recovery
     */
    generateRollbackSteps(request, category) {
        const steps = [];
        switch (category) {
            case TaskCategory.CREATE:
                steps.push('Remove created files/directories');
                steps.push('Revert configuration changes');
                break;
            case TaskCategory.EDIT:
                steps.push('Restore original file content');
                steps.push('Revert related changes');
                break;
            case TaskCategory.DELETE:
                steps.push('Restore from backup if available');
                break;
            case TaskCategory.EXECUTE:
                steps.push('Stop running processes');
                steps.push('Clean up temporary resources');
                break;
            default:
                steps.push('Revert any system changes');
        }
        return steps;
    }
    // Helper methods for execution strategy configuration
    getTimeoutMinutes(complexity) {
        switch (complexity) {
            case TaskComplexity.SIMPLE:
                return 5;
            case TaskComplexity.MODERATE:
                return 15;
            case TaskComplexity.COMPLEX:
                return 30;
            case TaskComplexity.HIGHLY_COMPLEX:
                return 60;
            default:
                return 15;
        }
    }
    requiresConfirmation(category) {
        return [
            TaskCategory.DELETE,
            TaskCategory.EXECUTE,
            TaskCategory.DEPLOY,
        ].includes(category);
    }
    getPreExecutionChecks(category) {
        const checks = [
            'Verify workspace context',
            'Check file permissions',
        ];
        if (category === TaskCategory.EDIT) {
            checks.push('Backup original files');
        }
        if (category === TaskCategory.EXECUTE) {
            checks.push('Validate command syntax');
        }
        return checks;
    }
    getPostExecutionValidation(category) {
        const validation = ['Check task completion status'];
        if (category === TaskCategory.CREATE || category === TaskCategory.EDIT) {
            validation.push('Verify file integrity');
            validation.push('Run syntax validation');
        }
        return validation;
    }
    // Complexity analysis helper methods
    getComplexityScore(complexity) {
        switch (complexity) {
            case TaskComplexity.SIMPLE:
                return 1;
            case TaskComplexity.MODERATE:
                return 2;
            case TaskComplexity.COMPLEX:
                return 3;
            case TaskComplexity.HIGHLY_COMPLEX:
                return 4;
            default:
                return 1;
        }
    }
    scoreToComplexity(score) {
        if (score <= 1.5)
            return TaskComplexity.SIMPLE;
        if (score <= 2.5)
            return TaskComplexity.MODERATE;
        if (score <= 3.5)
            return TaskComplexity.COMPLEX;
        return TaskComplexity.HIGHLY_COMPLEX;
    }
    calculateConfidence(factors) {
        if (factors.length === 0)
            return 0.5;
        // Confidence based on factor agreement and total weight
        const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
        const averageWeight = totalWeight / factors.length;
        return Math.min(averageWeight, 1.0);
    }
    estimateSubtasks(complexity, factors) {
        let baseCount = 1;
        switch (complexity) {
            case TaskComplexity.SIMPLE:
                baseCount = 1;
                break;
            case TaskComplexity.MODERATE:
                baseCount = 3;
                break;
            case TaskComplexity.COMPLEX:
                baseCount = 6;
                break;
            case TaskComplexity.HIGHLY_COMPLEX:
                baseCount = 12;
                break;
        }
        // Adjust based on high-impact factors
        const highImpactFactors = factors.filter((f) => f.impact === 'high').length;
        return baseCount + Math.floor(highImpactFactors / 2);
    }
    estimateDuration(complexity, factors, request) {
        let baseDuration = 5; // minutes
        switch (complexity) {
            case TaskComplexity.SIMPLE:
                baseDuration = 5;
                break;
            case TaskComplexity.MODERATE:
                baseDuration = 15;
                break;
            case TaskComplexity.COMPLEX:
                baseDuration = 45;
                break;
            case TaskComplexity.HIGHLY_COMPLEX:
                baseDuration = 120;
                break;
        }
        // Adjust based on request length and factors
        const lengthMultiplier = Math.min(request.length / 100, 2);
        const factorMultiplier = 1 + factors.length * 0.1;
        return Math.round(baseDuration * lengthMultiplier * factorMultiplier);
    }
    // Strategy and rule management methods (to be implemented)
    findApplicableStrategies(task, complexityResult) {
        const strategies = Array.from(this.breakdownStrategies.values())
            .filter((strategy) => strategy.applicableCategories.includes(task.category) &&
            this.getComplexityScore(strategy.minComplexity) <=
                this.getComplexityScore(task.complexity))
            .sort((a, b) => b.decompositionRules.length - a.decompositionRules.length); // Prefer more comprehensive strategies
        return strategies;
    }
    async applyBreakdownStrategy(task, strategy, context, depth) {
        const subtasks = [];
        for (const rule of strategy.decompositionRules) {
            if (rule.condition(task, context)) {
                const newSubtasks = rule.decompose(task, context);
                subtasks.push(...newSubtasks);
            }
        }
        return subtasks.length > 0 ? subtasks : [task];
    }
    // Initialize default rules, strategies, and analyzers
    initializeDefaultRules() {
        // Implementation will be added in subsequent methods
    }
    initializeDefaultStrategies() {
        // Implementation will be added in subsequent methods
    }
    initializeComplexityAnalyzers() {
        // Implementation will be added in subsequent methods
    }
}
//# sourceMappingURL=task-breakdown-engine.js.map