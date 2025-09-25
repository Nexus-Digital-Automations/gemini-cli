/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { WorkspaceContext } from '../utils/workspaceContext.js';
/**
 * Represents the complexity level of a task for breakdown analysis
 */
export declare enum TaskComplexity {
    SIMPLE = "simple",// Single operation, straightforward
    MODERATE = "moderate",// Multiple related operations
    COMPLEX = "complex",// Multi-step with dependencies
    HIGHLY_COMPLEX = "highly_complex"
}
/**
 * Task categories for intelligent processing
 */
export declare enum TaskCategory {
    READ = "read",
    EDIT = "edit",
    CREATE = "create",
    DELETE = "delete",
    SEARCH = "search",
    ANALYZE = "analyze",
    EXECUTE = "execute",
    REFACTOR = "refactor",
    TEST = "test",
    DEPLOY = "deploy",
    VALIDATE = "validate",
    OPTIMIZE = "optimize",
    DEBUG = "debug",
    DOCUMENT = "document"
}
/**
 * Task priority levels for execution ordering
 */
export declare enum TaskPriority {
    LOW = 1,
    NORMAL = 2,
    HIGH = 3,
    CRITICAL = 4,
    BLOCKING = 5
}
/**
 * Task execution status
 */
export declare enum TaskStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    BLOCKED = "blocked",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
/**
 * Represents a decomposed task with metadata and execution context
 */
export interface AutonomousTask {
    id: string;
    title: string;
    description: string;
    category: TaskCategory;
    complexity: TaskComplexity;
    priority: TaskPriority;
    status: TaskStatus;
    workspacePath?: string;
    targetFiles?: string[];
    dependencies?: string[];
    estimatedDuration?: number;
    parentTaskId?: string;
    childTaskIds?: string[];
    createdAt: Date;
    updatedAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    successCriteria?: string[];
    validationSteps?: string[];
    maxRetries?: number;
    currentRetries?: number;
    errorMessage?: string;
    executionStrategy?: ExecutionStrategy;
    rollbackSteps?: string[];
}
/**
 * Execution strategy configuration
 */
export interface ExecutionStrategy {
    type: 'sequential' | 'parallel' | 'conditional' | 'batch';
    maxConcurrency?: number;
    retryPolicy?: RetryPolicy;
    timeoutMinutes?: number;
    requiresConfirmation?: boolean;
    preExecutionChecks?: string[];
    postExecutionValidation?: string[];
}
/**
 * Retry policy configuration
 */
export interface RetryPolicy {
    maxRetries: number;
    backoffStrategy: 'linear' | 'exponential' | 'constant';
    baseDelayMs: number;
    maxDelayMs: number;
}
/**
 * Task breakdown context and requirements
 */
export interface TaskBreakdownContext {
    workspaceContext: WorkspaceContext;
    originalRequest: string;
    userIntent: string;
    availableTools: string[];
    constraints?: string[];
    preferences?: {
        maxTaskDepth?: number;
        maxParallelTasks?: number;
        preferredExecutionTime?: number;
    };
}
/**
 * Result of task complexity analysis
 */
export interface ComplexityAnalysisResult {
    complexity: TaskComplexity;
    confidence: number;
    factors: ComplexityFactor[];
    recommendedBreakdown: boolean;
    estimatedSubtasks: number;
    estimatedDuration: number;
}
/**
 * Factors contributing to task complexity
 */
export interface ComplexityFactor {
    factor: string;
    impact: 'low' | 'medium' | 'high';
    description: string;
    weight: number;
}
/**
 * Task breakdown strategy configuration
 */
export interface BreakdownStrategy {
    name: string;
    description: string;
    applicableCategories: TaskCategory[];
    minComplexity: TaskComplexity;
    maxDepth: number;
    decompositionRules: DecompositionRule[];
}
/**
 * Rules for task decomposition
 */
export interface DecompositionRule {
    name: string;
    condition: (task: AutonomousTask, context: TaskBreakdownContext) => boolean;
    decompose: (task: AutonomousTask, context: TaskBreakdownContext) => AutonomousTask[];
    priority: number;
}
/**
 * Autonomous Task Breakdown Engine
 *
 * This engine analyzes complex requests and intelligently decomposes them into
 * manageable, executable tasks with proper dependency management and execution strategies.
 */
export declare class TaskBreakdownEngine {
    private decompositionRules;
    private breakdownStrategies;
    private complexityAnalyzers;
    constructor();
    /**
     * Analyzes task complexity using multiple factors
     */
    analyzeComplexity(request: string, context: TaskBreakdownContext): Promise<ComplexityAnalysisResult>;
    /**
     * Breaks down a complex task into manageable subtasks
     */
    breakdownTask(request: string, context: TaskBreakdownContext, parentTaskId?: string, depth?: number): Promise<AutonomousTask[]>;
    /**
     * Creates a new autonomous task from request and context
     */
    private createTask;
    /**
     * Categorizes a task based on its content and intent
     */
    private categorizeTask;
    /**
     * Determines task priority based on category and complexity
     */
    private determinePriority;
    /**
     * Extracts a concise title from the full request
     */
    private extractTitle;
    /**
     * Generates success criteria for task validation
     */
    private generateSuccessCriteria;
    /**
     * Generates validation steps for task completion
     */
    private generateValidationSteps;
    /**
     * Determines default retry count based on complexity
     */
    private getDefaultRetries;
    /**
     * Selects appropriate execution strategy based on task characteristics
     */
    private selectExecutionStrategy;
    /**
     * Generates rollback steps for error recovery
     */
    private generateRollbackSteps;
    private getTimeoutMinutes;
    private requiresConfirmation;
    private getPreExecutionChecks;
    private getPostExecutionValidation;
    private getComplexityScore;
    private scoreToComplexity;
    private calculateConfidence;
    private estimateSubtasks;
    private estimateDuration;
    private findApplicableStrategies;
    private applyBreakdownStrategy;
    private initializeDefaultRules;
    private initializeDefaultStrategies;
    private initializeComplexityAnalyzers;
}
/**
 * Interface for complexity analyzers
 */
export interface ComplexityAnalyzer {
    name: string;
    analyze(request: string, context: TaskBreakdownContext): Promise<ComplexityAnalysisResult>;
}
