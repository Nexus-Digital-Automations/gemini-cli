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
// Test Helpers - Core utilities for test setup and mocking
export { fsHelper } from './helpers/fs-helper';
export { mockProcess } from './helpers/process-mock';
export { TestReporter } from './helpers/test-reporter';
// Test Fixtures - Sample data for comprehensive testing scenarios
export { sampleFeatures, sampleTasks, sampleAgents, sampleTaskQueues, sampleProjects, sampleConfigurations } from './fixtures/sample-features';
// Mock TaskManager API for testing
export class MockTaskManagerAPI {
    tasks = new Map();
    agents = new Map();
    features = new Map();
    async createTask(taskData) {
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.tasks.set(taskId, { ...taskData, id: taskId, created_at: new Date() });
        return { success: true, taskId };
    }
    async getTask(taskId) {
        return this.tasks.get(taskId);
    }
    async updateTaskStatus(taskId, status) {
        const task = this.tasks.get(taskId);
        if (task) {
            task.status = status;
            task.updated_at = new Date();
            return { success: true };
        }
        return { success: false };
    }
    async listTasks() {
        return Array.from(this.tasks.values());
    }
    async registerAgent(agentData) {
        const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.agents.set(agentId, { ...agentData, id: agentId, registered_at: new Date() });
        return { success: true, agentId };
    }
    async getAgent(agentId) {
        return this.agents.get(agentId);
    }
    async suggestFeature(featureData) {
        const featureId = `feature_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.features.set(featureId, {
            ...featureData,
            id: featureId,
            status: 'suggested',
            created_at: new Date()
        });
        return { success: true, featureId };
    }
    async approveFeature(featureId) {
        const feature = this.features.get(featureId);
        if (feature && feature.status === 'suggested') {
            feature.status = 'approved';
            feature.approved_at = new Date();
            return { success: true };
        }
        return { success: false };
    }
    async rejectFeature(featureId, reason) {
        const feature = this.features.get(featureId);
        if (feature && feature.status === 'suggested') {
            feature.status = 'rejected';
            feature.rejected_at = new Date();
            if (reason)
                feature.rejection_reason = reason;
            return { success: true };
        }
        return { success: false };
    }
    async listFeatures() {
        return Array.from(this.features.values());
    }
    // Utility methods for testing
    reset() {
        this.tasks.clear();
        this.agents.clear();
        this.features.clear();
    }
    getStats() {
        return {
            tasks: this.tasks.size,
            agents: this.agents.size,
            features: this.features.size
        };
    }
}
// Test Utilities
export class TestUtils {
    static async withTimeout(promise, timeoutMs, errorMessage = 'Operation timed out') {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
        });
        return Promise.race([promise, timeoutPromise]);
    }
    static async retry(fn, maxAttempts = 3, delayMs = 1000) {
        let lastError;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
                lastError = error;
                if (attempt === maxAttempts)
                    break;
                await this.delay(delayMs * attempt);
            }
        }
        throw lastError;
    }
    static async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    static generateRandomString(length = 10) {
        return Math.random().toString(36).substring(2, 2 + length);
    }
    static createTestLogger(prefix = 'TEST') {
        return {
            info: (message, data) => {
                console.log(`[${prefix}] INFO: ${message}`, data ? JSON.stringify(data, null, 2) : '');
            },
            warn: (message, data) => {
                console.warn(`[${prefix}] WARN: ${message}`, data ? JSON.stringify(data, null, 2) : '');
            },
            error: (message, data) => {
                console.error(`[${prefix}] ERROR: ${message}`, data ? JSON.stringify(data, null, 2) : '');
            }
        };
    }
}
// Test Environment Setup
export class TestEnvironment {
    static instance;
    config;
    mockApi;
    logger;
    constructor() {
        this.config = {
            timeout: 30000,
            maxConcurrentTasks: 10,
            agentHeartbeatInterval: 5000,
            taskQueueBatchSize: 5
        };
        this.mockApi = new MockTaskManagerAPI();
        this.logger = TestUtils.createTestLogger('TEST_ENV');
    }
    static getInstance() {
        if (!TestEnvironment.instance) {
            TestEnvironment.instance = new TestEnvironment();
        }
        return TestEnvironment.instance;
    }
    getConfig() {
        return { ...this.config };
    }
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }
    getMockAPI() {
        return this.mockApi;
    }
    getLogger() {
        return this.logger;
    }
    async setup() {
        this.logger.info('Setting up test environment');
        this.mockApi.reset();
        process.env.NODE_ENV = 'test';
        process.env.GEMINI_CLI_TEST_MODE = 'true';
    }
    async teardown() {
        this.logger.info('Tearing down test environment');
        this.mockApi.reset();
        delete process.env.GEMINI_CLI_TEST_MODE;
    }
    async createTestContext(options = {}) {
        const projectRoot = options.projectRoot || '/test-project';
        const mockFs = options.mockFs !== false;
        if (mockFs) {
            fsHelper.createBasicProjectStructure(projectRoot);
        }
        return {
            projectRoot,
            mockFs,
            cleanup: async () => {
                if (mockFs) {
                    const { vol } = await import('memfs');
                    vol.reset();
                }
            }
        };
    }
}
// Performance Testing Utilities
export class PerformanceTestUtils {
    static async measureExecutionTime(fn) {
        const start = process.hrtime.bigint();
        const result = await fn();
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1000000; // Convert to milliseconds
        return { result, duration };
    }
    static async measureMemoryUsage(fn) {
        const initialMemory = process.memoryUsage().heapUsed;
        const result = await fn();
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryDelta = finalMemory - initialMemory;
        return { result, memoryDelta };
    }
    static async benchmarkFunction(fn, iterations = 100) {
        const times = [];
        for (let i = 0; i < iterations; i++) {
            const { duration } = await this.measureExecutionTime(fn);
            times.push(duration);
        }
        const totalTime = times.reduce((sum, time) => sum + time, 0);
        const averageTime = totalTime / iterations;
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);
        const throughput = 1000 / averageTime; // Operations per second
        return {
            averageTime,
            minTime,
            maxTime,
            totalTime,
            throughput
        };
    }
}
// Export singleton instances for convenience
export const testEnvironment = TestEnvironment.getInstance();
export const performanceUtils = PerformanceTestUtils;
// Version information
export const version = '1.0.0';
export const testFrameworkInfo = {
    name: 'Autonomous Task Management Testing Framework',
    version: '1.0.0',
    description: 'Comprehensive testing utilities for autonomous task management system',
    features: [
        'Unit testing with Vitest',
        'Integration testing with real API mocking',
        'End-to-end testing scenarios',
        'Performance and load testing',
        'Test reporting and metrics',
        'File system mocking with memfs',
        'Process mocking and environment control',
        'Comprehensive test fixtures and sample data'
    ]
};
//# sourceMappingURL=index.js.map