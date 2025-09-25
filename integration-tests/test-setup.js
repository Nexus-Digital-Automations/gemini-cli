/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
/**
 * Test Setup Configuration
 *
 * This file runs for each test file and provides common setup/teardown
 * functionality for all integration tests. It handles test isolation,
 * resource management, and environment preparation.
 */
const TASK_MANAGER_API = process.env.TASK_MANAGER_API_PATH ||
    '/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js';
const TEST_DIR = process.env.INTEGRATION_TEST_FILE_DIR || '/tmp/autonomous-tests';
// Test isolation and cleanup utilities
let testStartTime;
let testMemoryBaseline;
let currentTestFile = 'unknown';
// Track test-specific resources for cleanup
const testResources = {
    agentIds: new Set(),
    tempFiles: new Set(),
    tempDirs: new Set(),
    processes: new Set()
};
/**
 * Setup that runs before each test file
 */
beforeAll(async () => {
    // Detect current test file from stack trace or environment
    const stack = new Error().stack;
    const testFileMatch = stack?.match(/([^/\\]+\.test\.ts)/);
    currentTestFile = testFileMatch?.[1] || 'unknown-test';
    console.log(`🧪 Setting up test file: ${currentTestFile}`);
    // Create test-specific directory
    const testSpecificDir = join(TEST_DIR, currentTestFile.replace('.test.ts', ''));
    await fs.mkdir(testSpecificDir, { recursive: true });
    testResources.tempDirs.add(testSpecificDir);
    // Set test file environment variable
    process.env.CURRENT_TEST_FILE = currentTestFile;
    process.env.CURRENT_TEST_DIR = testSpecificDir;
    console.log(`📁 Test directory: ${testSpecificDir}`);
});
/**
 * Cleanup that runs after each test file
 */
afterAll(async () => {
    console.log(`🧹 Cleaning up test file: ${currentTestFile}`);
    // Clean up any lingering agents
    for (const agentId of testResources.agentIds) {
        try {
            execSync(`timeout 5s node "${TASK_MANAGER_API}" terminate ${agentId}`, { stdio: 'ignore', timeout: 5000 });
        }
        catch (error) {
            // Ignore cleanup errors
        }
    }
    // Clean up temporary files
    for (const filePath of testResources.tempFiles) {
        try {
            await fs.unlink(filePath);
        }
        catch (error) {
            // Ignore cleanup errors
        }
    }
    // Clean up temporary directories
    for (const dirPath of testResources.tempDirs) {
        try {
            await fs.rmdir(dirPath, { recursive: true });
        }
        catch (error) {
            // Ignore cleanup errors
        }
    }
    // Clean up any orphaned processes
    for (const pid of testResources.processes) {
        try {
            process.kill(pid, 'SIGTERM');
        }
        catch (error) {
            // Ignore cleanup errors
        }
    }
    // Clear resource tracking
    testResources.agentIds.clear();
    testResources.tempFiles.clear();
    testResources.tempDirs.clear();
    testResources.processes.clear();
    console.log(`✅ Cleanup complete for: ${currentTestFile}`);
});
/**
 * Setup that runs before each individual test
 */
beforeEach(async () => {
    // Record test start metrics
    testStartTime = performance.now();
    testMemoryBaseline = process.memoryUsage();
    // Force garbage collection if available
    if (global.gc) {
        global.gc();
    }
    // Brief pause for system stability
    await new Promise(resolve => setTimeout(resolve, 100));
});
/**
 * Cleanup that runs after each individual test
 */
afterEach(async () => {
    // Calculate test metrics
    const testDuration = performance.now() - testStartTime;
    const finalMemory = process.memoryUsage();
    const memoryDelta = {
        heap: finalMemory.heapUsed - testMemoryBaseline.heapUsed,
        external: finalMemory.external - testMemoryBaseline.external,
        rss: finalMemory.rss - testMemoryBaseline.rss
    };
    // Log test performance metrics
    const metrics = {
        duration: Math.round(testDuration),
        memoryDelta: {
            heap: Math.round(memoryDelta.heap / 1024 / 1024),
            external: Math.round(memoryDelta.external / 1024 / 1024),
            rss: Math.round(memoryDelta.rss / 1024 / 1024)
        }
    };
    if (process.env.VERBOSE === 'true') {
        console.log(`📊 Test metrics: ${JSON.stringify(metrics)}`);
    }
    // Check for potential memory leaks
    if (memoryDelta.heap > 50 * 1024 * 1024) { // 50MB threshold
        console.warn(`⚠️ High memory delta detected: ${metrics.memoryDelta.heap}MB heap increase`);
    }
    // Brief pause for system cleanup
    await new Promise(resolve => setTimeout(resolve, 50));
});
/**
 * Utility functions for test resource management
 */
/**
 * Register an agent ID for automatic cleanup
 */
export function registerTestAgent(agentId) {
    testResources.agentIds.add(agentId);
}
/**
 * Register a temporary file for automatic cleanup
 */
export function registerTestFile(filePath) {
    testResources.tempFiles.add(filePath);
}
/**
 * Register a temporary directory for automatic cleanup
 */
export function registerTestDirectory(dirPath) {
    testResources.tempDirs.add(dirPath);
}
/**
 * Register a process ID for automatic cleanup
 */
export function registerTestProcess(pid) {
    testResources.processes.add(pid);
}
/**
 * Create a unique test identifier
 */
export function createTestId(testName) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${currentTestFile}_${testName}_${timestamp}_${random}`.replace(/[^a-zA-Z0-9_]/g, '_');
}
/**
 * Get current test directory
 */
export function getTestDirectory() {
    return process.env.CURRENT_TEST_DIR || join(TEST_DIR, 'default');
}
/**
 * Execute task manager command with automatic agent registration
 */
export async function executeTaskManagerCommand(command, args = [], options = {}) {
    const timeout = options.timeout || 10000;
    try {
        const output = execSync(`timeout ${timeout / 1000}s node "${TASK_MANAGER_API}" ${command} ${args.join(' ')}`, {
            encoding: 'utf8',
            timeout,
            stdio: 'pipe'
        });
        // Auto-register agents for cleanup
        if (options.registerAgent && (command === 'initialize' || command === 'reinitialize') && args[0]) {
            registerTestAgent(args[0]);
        }
        return { success: true, output };
    }
    catch (error) {
        return { success: false, output: '', error: error };
    }
}
/**
 * Create temporary test file with automatic registration
 */
export async function createTestFile(fileName, content) {
    const testDir = getTestDirectory();
    const filePath = join(testDir, fileName);
    await fs.writeFile(filePath, content);
    registerTestFile(filePath);
    return filePath;
}
/**
 * Create temporary test directory with automatic registration
 */
export async function createTestDirectory(dirName) {
    const testDir = getTestDirectory();
    const dirPath = join(testDir, dirName);
    await fs.mkdir(dirPath, { recursive: true });
    registerTestDirectory(dirPath);
    return dirPath;
}
/**
 * Performance monitoring utilities
 */
export class TestPerformanceMonitor {
    startTime = 0;
    checkpoints = [];
    start() {
        this.startTime = performance.now();
        this.checkpoints = [];
    }
    checkpoint(name) {
        this.checkpoints.push({
            name,
            time: performance.now() - this.startTime
        });
    }
    getResults() {
        const totalTime = performance.now() - this.startTime;
        const enhancedCheckpoints = this.checkpoints.map((checkpoint, index) => ({
            name: checkpoint.name,
            time: checkpoint.time,
            delta: index > 0 ? checkpoint.time - this.checkpoints[index - 1].time : checkpoint.time
        }));
        return { totalTime, checkpoints: enhancedCheckpoints };
    }
}
// Export constants for test files
export const TEST_CONSTANTS = {
    TASK_MANAGER_API,
    TEST_DIR,
    DEFAULT_TIMEOUT: 10000,
    PERFORMANCE_THRESHOLDS: {
        latency: {
            avg: 1000,
            p95: 2000,
            p99: 5000
        },
        memory: {
            maxHeapMB: 500,
            maxRSSMB: 1000
        }
    }
};
console.log('⚙️ Integration test setup configured');
//# sourceMappingURL=test-setup.js.map