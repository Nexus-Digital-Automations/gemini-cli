/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Autonomous Task Management Testing Framework
 *
 * This module provides comprehensive testing utilities for the autonomous task management system.
 * It includes unit tests, integration tests, performance tests, test helpers, fixtures, and reporting.
 */
export { fsHelper } from './helpers/fs-helper';
export { mockProcess } from './helpers/process-mock';
export { TestReporter } from './helpers/test-reporter';
export { sampleFeatures, sampleTasks, sampleAgents, sampleTaskQueues, sampleProjects, sampleConfigurations } from './fixtures/sample-features';
export interface TestContext {
    projectRoot: string;
    mockFs: boolean;
    cleanup: () => Promise<void>;
}
export interface TestConfig {
    timeout: number;
    maxConcurrentTasks: number;
    agentHeartbeatInterval: number;
    taskQueueBatchSize: number;
}
export interface TestResults {
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    coverage: {
        statements: number;
        branches: number;
        functions: number;
        lines: number;
    };
}
export interface TestSuite {
    name: string;
    tests: TestCase[];
    setup?: () => Promise<void>;
    teardown?: () => Promise<void>;
}
export interface TestCase {
    name: string;
    fn: () => Promise<void>;
    timeout?: number;
    skip?: boolean;
}
export declare class MockTaskManagerAPI {
    private tasks;
    private agents;
    private features;
    createTask(taskData: any): Promise<{
        success: boolean;
        taskId: string;
    }>;
    getTask(taskId: string): Promise<any>;
    updateTaskStatus(taskId: string, status: string): Promise<{
        success: boolean;
    }>;
    listTasks(): Promise<any[]>;
    registerAgent(agentData: any): Promise<{
        success: boolean;
        agentId: string;
    }>;
    getAgent(agentId: string): Promise<any>;
    suggestFeature(featureData: any): Promise<{
        success: boolean;
        featureId: string;
    }>;
    approveFeature(featureId: string): Promise<{
        success: boolean;
    }>;
    rejectFeature(featureId: string, reason?: string): Promise<{
        success: boolean;
    }>;
    listFeatures(): Promise<any[]>;
    reset(): void;
    getStats(): {
        tasks: number;
        agents: number;
        features: number;
    };
}
export declare class TestUtils {
    static withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage?: string): Promise<T>;
    static retry<T>(fn: () => Promise<T>, maxAttempts?: number, delayMs?: number): Promise<T>;
    static delay(ms: number): Promise<void>;
    static generateRandomString(length?: number): string;
    static createTestLogger(prefix?: string): {
        info: (message: string, data?: any) => void;
        warn: (message: string, data?: any) => void;
        error: (message: string, data?: any) => void;
    };
}
export declare class TestEnvironment {
    private static instance;
    private config;
    private mockApi;
    private logger;
    private constructor();
    static getInstance(): TestEnvironment;
    getConfig(): TestConfig;
    setConfig(config: Partial<TestConfig>): void;
    getMockAPI(): MockTaskManagerAPI;
    getLogger(): ReturnType<typeof TestUtils.createTestLogger>;
    setup(): Promise<void>;
    teardown(): Promise<void>;
    createTestContext(options?: Partial<TestContext>): Promise<TestContext>;
}
export declare class PerformanceTestUtils {
    static measureExecutionTime<T>(fn: () => Promise<T>): Promise<{
        result: T;
        duration: number;
    }>;
    static measureMemoryUsage<T>(fn: () => Promise<T>): Promise<{
        result: T;
        memoryDelta: number;
    }>;
    static benchmarkFunction<T>(fn: () => Promise<T>, iterations?: number): Promise<{
        averageTime: number;
        minTime: number;
        maxTime: number;
        totalTime: number;
        throughput: number;
    }>;
}
export declare const testEnvironment: TestEnvironment;
export declare const performanceUtils: typeof PerformanceTestUtils;
export declare const version = "1.0.0";
export declare const testFrameworkInfo: {
    name: string;
    version: string;
    description: string;
    features: string[];
};
