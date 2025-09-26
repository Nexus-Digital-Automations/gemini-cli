/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Utility functions for test resource management
 */
/**
 * Register an agent ID for automatic cleanup
 */
export declare function registerTestAgent(agentId: string): void;
/**
 * Register a temporary file for automatic cleanup
 */
export declare function registerTestFile(filePath: string): void;
/**
 * Register a temporary directory for automatic cleanup
 */
export declare function registerTestDirectory(dirPath: string): void;
/**
 * Register a process ID for automatic cleanup
 */
export declare function registerTestProcess(pid: number): void;
/**
 * Create a unique test identifier
 */
export declare function createTestId(testName: string): string;
/**
 * Get current test directory
 */
export declare function getTestDirectory(): string;
/**
 * Execute task manager command with automatic agent registration
 */
export declare function executeTaskManagerCommand(command: string, args?: string[], options?: {
    timeout?: number;
    registerAgent?: boolean;
}): Promise<{
    success: boolean;
    output: string;
    error?: Error;
}>;
/**
 * Create temporary test file with automatic registration
 */
export declare function createTestFile(fileName: string, content: string): Promise<string>;
/**
 * Create temporary test directory with automatic registration
 */
export declare function createTestDirectory(dirName: string): Promise<string>;
/**
 * Performance monitoring utilities
 */
export declare class TestPerformanceMonitor {
    private startTime;
    private checkpoints;
    start(): void;
    checkpoint(name: string): void;
    getResults(): {
        totalTime: number;
        checkpoints: Array<{
            name: string;
            time: number;
            delta: number;
        }>;
    };
}
export declare const TEST_CONSTANTS: {
    TASK_MANAGER_API: string;
    TEST_DIR: string;
    DEFAULT_TIMEOUT: number;
    PERFORMANCE_THRESHOLDS: {
        latency: {
            avg: number;
            p95: number;
            p99: number;
        };
        memory: {
            maxHeapMB: number;
            maxRSSMB: number;
        };
    };
};
