/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Task, TaskDependency, TaskResult, DependencyGraph, ExecutionSequence, ResourceConstraint, TaskExecutionContext, TaskMetadata as _TaskMetadata, ResourceAllocation } from '../../types.js';
import { TaskPriority, TaskStatus, TaskCategory } from '../../types.js';
import type { Config } from '../../../config/config.js';
/**
 * @fileoverview Test factories and utilities for task management testing
 *
 * Provides factory functions to create mock objects, test data generators,
 * and utility functions for comprehensive testing scenarios.
 */
/**
 * Factory class for creating test objects with realistic data
 */
export declare class TestFactories {
    private static taskIdCounter;
    private static dependencyIdCounter;
    /**
     * Creates a mock task with customizable properties
     */
    static createMockTask(overrides?: Partial<Task>): Task;
    /**
     * Creates multiple mock tasks with varied properties
     */
    static createMockTasks(count: number, baseOverrides?: Partial<Task>): Task[];
    /**
     * Creates a mock task dependency
     */
    static createMockDependency(dependentTaskId: string, dependsOnTaskId: string, overrides?: Partial<TaskDependency>): TaskDependency;
    /**
     * Creates a dependency graph from tasks
     */
    static createMockDependencyGraph(tasks: Task[], dependencies: TaskDependency[], overrides?: Partial<DependencyGraph>): DependencyGraph;
    /**
     * Creates a mock task result
     */
    static createMockTaskResult(taskId: string, success?: boolean, overrides?: Partial<TaskResult>): TaskResult;
    /**
     * Creates mock resource constraints
     */
    static createMockResourceConstraints(count?: number): ResourceConstraint[];
    /**
     * Creates mock execution sequence
     */
    static createMockExecutionSequence(tasks: Task[], overrides?: Partial<ExecutionSequence>): ExecutionSequence;
    /**
     * Creates mock resource allocation
     */
    static createMockResourceAllocation(taskId: string, resources: ResourceConstraint[], overrides?: Partial<ResourceAllocation>): ResourceAllocation;
    /**
     * Creates a mock Config object for testing
     */
    static createMockConfig(overrides?: Partial<Config>): Partial<Config>;
    /**
     * Creates complex task scenarios for testing
     */
    static createComplexTaskScenarios(): {
        /**
         * Linear dependency chain: A -> B -> C -> D
         */
        linearChain: () => {
            tasks: Task[];
            dependencies: TaskDependency[];
        };
        /**
         * Fan-out pattern: A -> [B, C, D]
         */
        fanOut: () => {
            tasks: Task[];
            dependencies: TaskDependency[];
        };
        /**
         * Fan-in pattern: [A, B, C] -> D
         */
        fanIn: () => {
            tasks: Task[];
            dependencies: TaskDependency[];
        };
        /**
         * Diamond pattern: A -> [B, C] -> D
         */
        diamond: () => {
            tasks: Task[];
            dependencies: TaskDependency[];
        };
        /**
         * Complex multi-layer hierarchy
         */
        multiLayer: () => {
            tasks: Task[];
            dependencies: TaskDependency[];
        };
        /**
         * Circular dependency for testing cycle detection
         */
        circular: () => {
            tasks: Task[];
            dependencies: TaskDependency[];
        };
    };
    /**
     * Creates performance testing scenarios
     */
    static createPerformanceScenarios(): {
        /**
         * High-volume task creation scenario
         */
        highVolume: (count?: number) => Task[];
        /**
         * Resource-intensive tasks
         */
        resourceIntensive: (count?: number) => {
            executionContext: {
                resourceConstraints: ResourceConstraint[];
                timeout: number;
                workingDirectory?: string;
                environment?: Record<string, string>;
                maxRetries?: number;
            };
            id: import("../../types.js").TaskId;
            name: string;
            title: string;
            description: string;
            status: TaskStatus;
            priority: TaskPriority;
            type?: import("../../types.js").TaskType;
            category: TaskCategory;
            metadata: _TaskMetadata;
            parameters?: Record<string, unknown>;
            expectedOutput?: Record<string, unknown>;
            validationCriteria?: string[];
            results?: Record<string, unknown>;
            lastError?: string;
            metrics?: import("../../types.js").TaskExecutionMetrics;
            createdAt?: Date;
            updatedAt?: Date;
            estimatedEffort?: number;
            executeFunction?: (task: Task, context: Record<string, unknown>) => Promise<{
                success: boolean;
                result?: unknown;
                duration: number;
                error?: Error;
                metadata?: Record<string, unknown>;
                artifacts?: string[];
                nextTasks?: Array<Partial<Task>>;
            }>;
        }[];
        /**
         * Mixed priority workload
         */
        mixedPriority: (count?: number) => {
            priority: TaskPriority;
            metadata: {
                estimatedDuration: number;
                createdAt: Date;
                updatedAt: Date;
                createdBy: string;
                startTime?: Date;
                endTime?: Date;
                actualDuration?: number;
                retryCount?: number;
                businessValue?: number;
                estimatedResourceUsage?: number;
                tags?: string[];
                custom?: Record<string, unknown>;
                isSubtask?: boolean;
                canRunInParallel?: boolean;
                isBreakdownTracker?: boolean;
                parentTaskId?: string;
                breakdownStrategy?: string;
                sequenceOrder?: number;
                riskLevel?: string;
                qualityGates?: string[];
                validationCriteria?: string[];
                subtaskIds?: string[];
                breakdownMetadata?: Record<string, unknown>;
                originalTaskId?: string;
                autonomousAnalysis?: {
                    analyzedAt: Date;
                    queueVersion: string;
                };
                mlPredictions?: {
                    complexity: number;
                    duration: number;
                    resources: number;
                    failureRisk: number;
                    predictionTimestamp: Date;
                    modelVersion: string;
                };
                deferred?: {
                    deferredUntil: Date;
                    reason: string;
                    originalPriority: string;
                };
                parallelizable?: boolean;
                parallelGroup?: string;
                resourceRebalance?: {
                    enabled: boolean;
                    threshold: number;
                    target: string;
                };
            };
            id: import("../../types.js").TaskId;
            name: string;
            title: string;
            description: string;
            status: TaskStatus;
            type?: import("../../types.js").TaskType;
            category: TaskCategory;
            executionContext?: TaskExecutionContext;
            parameters?: Record<string, unknown>;
            expectedOutput?: Record<string, unknown>;
            validationCriteria?: string[];
            results?: Record<string, unknown>;
            lastError?: string;
            metrics?: import("../../types.js").TaskExecutionMetrics;
            createdAt?: Date;
            updatedAt?: Date;
            estimatedEffort?: number;
            executeFunction?: (task: Task, context: Record<string, unknown>) => Promise<{
                success: boolean;
                result?: unknown;
                duration: number;
                error?: Error;
                metadata?: Record<string, unknown>;
                artifacts?: string[];
                nextTasks?: Array<Partial<Task>>;
            }>;
        }[];
        /**
         * Long-running tasks
         */
        longRunning: (count?: number) => {
            category: TaskCategory;
            metadata: {
                estimatedDuration: number;
                createdAt: Date;
                updatedAt: Date;
                createdBy: string;
                startTime?: Date;
                endTime?: Date;
                actualDuration?: number;
                retryCount?: number;
                businessValue?: number;
                estimatedResourceUsage?: number;
                tags?: string[];
                custom?: Record<string, unknown>;
                isSubtask?: boolean;
                canRunInParallel?: boolean;
                isBreakdownTracker?: boolean;
                parentTaskId?: string;
                breakdownStrategy?: string;
                sequenceOrder?: number;
                riskLevel?: string;
                qualityGates?: string[];
                validationCriteria?: string[];
                subtaskIds?: string[];
                breakdownMetadata?: Record<string, unknown>;
                originalTaskId?: string;
                autonomousAnalysis?: {
                    analyzedAt: Date;
                    queueVersion: string;
                };
                mlPredictions?: {
                    complexity: number;
                    duration: number;
                    resources: number;
                    failureRisk: number;
                    predictionTimestamp: Date;
                    modelVersion: string;
                };
                deferred?: {
                    deferredUntil: Date;
                    reason: string;
                    originalPriority: string;
                };
                parallelizable?: boolean;
                parallelGroup?: string;
                resourceRebalance?: {
                    enabled: boolean;
                    threshold: number;
                    target: string;
                };
            };
            executionContext: {
                timeout: number;
                maxRetries: number;
                workingDirectory?: string;
                environment?: Record<string, string>;
                resourceConstraints?: ResourceConstraint[];
            };
            id: import("../../types.js").TaskId;
            name: string;
            title: string;
            description: string;
            status: TaskStatus;
            priority: TaskPriority;
            type?: import("../../types.js").TaskType;
            parameters?: Record<string, unknown>;
            expectedOutput?: Record<string, unknown>;
            validationCriteria?: string[];
            results?: Record<string, unknown>;
            lastError?: string;
            metrics?: import("../../types.js").TaskExecutionMetrics;
            createdAt?: Date;
            updatedAt?: Date;
            estimatedEffort?: number;
            executeFunction?: (task: Task, context: Record<string, unknown>) => Promise<{
                success: boolean;
                result?: unknown;
                duration: number;
                error?: Error;
                metadata?: Record<string, unknown>;
                artifacts?: string[];
                nextTasks?: Array<Partial<Task>>;
            }>;
        }[];
    };
    /**
     * Creates error scenarios for testing error handling
     */
    static createErrorScenarios(): {
        /**
         * Tasks that will fail validation
         */
        invalidTasks: () => Task[];
        /**
         * Tasks with circular dependencies
         */
        circularDependencies: () => {
            tasks: Task[];
            dependencies: TaskDependency[];
        };
        /**
         * Tasks that will timeout during execution
         */
        timeoutTasks: () => {
            executionContext: {
                timeout: number;
                workingDirectory?: string;
                environment?: Record<string, string>;
                maxRetries?: number;
                resourceConstraints?: ResourceConstraint[];
            };
            metadata: {
                estimatedDuration: number;
                createdAt: Date;
                updatedAt: Date;
                createdBy: string;
                startTime?: Date;
                endTime?: Date;
                actualDuration?: number;
                retryCount?: number;
                businessValue?: number;
                estimatedResourceUsage?: number;
                tags?: string[];
                custom?: Record<string, unknown>;
                isSubtask?: boolean;
                canRunInParallel?: boolean;
                isBreakdownTracker?: boolean;
                parentTaskId?: string;
                breakdownStrategy?: string;
                sequenceOrder?: number;
                riskLevel?: string;
                qualityGates?: string[];
                validationCriteria?: string[];
                subtaskIds?: string[];
                breakdownMetadata?: Record<string, unknown>;
                originalTaskId?: string;
                autonomousAnalysis?: {
                    analyzedAt: Date;
                    queueVersion: string;
                };
                mlPredictions?: {
                    complexity: number;
                    duration: number;
                    resources: number;
                    failureRisk: number;
                    predictionTimestamp: Date;
                    modelVersion: string;
                };
                deferred?: {
                    deferredUntil: Date;
                    reason: string;
                    originalPriority: string;
                };
                parallelizable?: boolean;
                parallelGroup?: string;
                resourceRebalance?: {
                    enabled: boolean;
                    threshold: number;
                    target: string;
                };
            };
            id: import("../../types.js").TaskId;
            name: string;
            title: string;
            description: string;
            status: TaskStatus;
            priority: TaskPriority;
            type?: import("../../types.js").TaskType;
            category: TaskCategory;
            parameters?: Record<string, unknown>;
            expectedOutput?: Record<string, unknown>;
            validationCriteria?: string[];
            results?: Record<string, unknown>;
            lastError?: string;
            metrics?: import("../../types.js").TaskExecutionMetrics;
            createdAt?: Date;
            updatedAt?: Date;
            estimatedEffort?: number;
            executeFunction?: (task: Task, context: Record<string, unknown>) => Promise<{
                success: boolean;
                result?: unknown;
                duration: number;
                error?: Error;
                metadata?: Record<string, unknown>;
                artifacts?: string[];
                nextTasks?: Array<Partial<Task>>;
            }>;
        }[];
        /**
         * Tasks with missing dependencies
         */
        missingDependencies: () => {
            tasks: Task[];
            dependencies: TaskDependency[];
        };
    };
    /**
     * Utility method to create random parallel execution groups
     */
    private static createRandomParallelGroups;
    /**
     * Deep merge utility for combining objects
     */
    private static deepMerge;
    /**
     * Check if value is a plain object
     */
    private static isObject;
}
/**
 * Test utilities for common testing operations
 */
export declare class TestUtils {
    /**
     * Wait for a condition to be true with timeout
     */
    static waitFor(condition: () => boolean | Promise<boolean>, timeoutMs?: number, intervalMs?: number): Promise<void>;
    /**
     * Sleep for specified milliseconds
     */
    static sleep(ms: number): Promise<void>;
    /**
     * Generate random string of specified length
     */
    static randomString(length?: number): string;
    /**
     * Generate random number within range
     */
    static randomInt(min: number, max: number): number;
    /**
     * Pick random element from array
     */
    static randomElement<T>(array: T[]): T;
    /**
     * Shuffle array in place
     */
    static shuffle<T>(array: T[]): T[];
    /**
     * Create a mock timer for testing time-based operations
     */
    static createMockTimer(): {
        getCurrentTime: () => number;
        setTimeout: (callback: () => void, delay: number) => number;
        clearTimeout: (id: number) => void;
        tick: (ms: number) => void;
        hasTimers: () => boolean;
        getTimerCount: () => number;
    };
    /**
     * Create a performance measurement utility
     */
    static createPerformanceMeasurer(): {
        start: (name: string) => void;
        end: (name: string) => void;
        getDuration: (name: string) => number;
        getAllMeasurements: () => {
            [x: string]: {
                start: number;
                end?: number;
                duration?: number;
            };
        };
        clear: () => void;
    };
    /**
     * Memory usage tracker
     */
    static createMemoryTracker(): {
        snapshot: (label?: string) => void;
        getSnapshots: () => {
            timestamp: number;
            usage: NodeJS.MemoryUsage;
            label?: string;
        }[];
        getMemoryIncrease: (fromLabel?: string, toLabel?: string) => {
            heapUsed: number;
            heapTotal: number;
            rss: number;
        };
        clear: () => void;
    };
}
/**
 * Mock data generators for various testing scenarios
 */
export declare class MockDataGenerators {
    /**
     * Generate realistic task titles
     */
    static generateTaskTitles(count: number): string[];
    /**
     * Generate realistic task descriptions
     */
    static generateTaskDescriptions(count: number): string[];
    /**
     * Generate realistic execution contexts
     */
    static generateExecutionContexts(count: number): TaskExecutionContext[];
}
export declare const TaskFactories: typeof TestFactories;
export declare const TestUtilities: typeof TestUtils;
export declare class MockTaskStore {
    private tasks;
    save(key: string, value: unknown): Promise<void>;
    load(key: string): Promise<unknown>;
    delete(key: string): Promise<void>;
    list(): Promise<string[]>;
    clear(): void;
}
export declare class PerformanceMetrics {
    private metrics;
    record(name: string, value: number): void;
    get(name: string): number | undefined;
    getAll(): Record<string, number>;
    clear(): void;
}
