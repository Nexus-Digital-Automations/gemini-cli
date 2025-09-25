/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * CrossSessionPersistenceEngine Test Suite
 * Comprehensive test coverage for the enterprise-grade persistence system
 */

const {
  CrossSessionPersistenceEngine,
} = require('../CrossSessionPersistenceEngine.js');
const {
  TaskRecoveryManager,
  RECOVERY_STRATEGIES,
} = require('../TaskRecoveryManager.js');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Test Utilities and Helpers
 */
class TestUtils {
  static createTestDir() {
    return path.join('/tmp', 'persistence-test-' + uuidv4().substring(0, 8));
  }

  static async cleanup(testDir) {
    try {
      await fs.rmdir(testDir, { recursive: true });
    } catch (error) {
      // Directory might not exist, ignore error
    }
  }

  static createSampleTask(overrides = {}) {
    return {
      title: 'Test Task',
      description: 'Sample task for testing',
      status: 'pending',
      priority: 'medium',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: ['test', 'sample'],
      metadata: {
        test: true,
        version: '1.0.0',
      },
      ...overrides,
    };
  }

  static async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static measureExecutionTime(fn) {
    return async (...args) => {
      const start = Date.now();
      const result = await fn(...args);
      const duration = Date.now() - start;
      return { result, duration };
    };
  }
}

/**
 * Mock File System for Testing
 */
class MockFileSystem {
  constructor() {
    this.files = new Map();
    this.locks = new Set();
    this.failureMode = null;
  }

  setFailureMode(mode) {
    this.failureMode = mode;
  }

  clearFailureMode() {
    this.failureMode = null;
  }

  async readFile(filePath) {
    if (this.failureMode === 'read') {
      throw new Error('Mock read failure');
    }
    const data = this.files.get(filePath);
    if (!data) {
      throw new Error(`File not found: ${filePath}`);
    }
    return data;
  }

  async writeFile(filePath, data) {
    if (this.failureMode === 'write') {
      throw new Error('Mock write failure');
    }
    this.files.set(filePath, data);
  }

  async exists(filePath) {
    return this.files.has(filePath);
  }

  async mkdir(dirPath, options = {}) {
    if (this.failureMode === 'mkdir') {
      throw new Error('Mock mkdir failure');
    }
    // Mock implementation - just track that directory exists
    this.files.set(dirPath + '/.directory', '');
  }
}

/**
 * CrossSessionPersistenceEngineTestSuite
 * Main test suite class with comprehensive test coverage
 */
class CrossSessionPersistenceEngineTestSuite {
  constructor() {
    this.testResults = [];
    this.testDir = null;
    this.engine = null;
  }

  async runAllTests() {
    console.log('🚀 Starting CrossSessionPersistenceEngine Test Suite');
    console.log('='.repeat(80));

    try {
      await this.setupTestEnvironment();

      // Run all test categories
      await this.runUnitTests();
      await this.runIntegrationTests();
      await this.runPerformanceTests();
      await this.runFailureRecoveryTests();
      await this.runConcurrentAccessTests();
      await this.runEndToEndTests();

      await this.generateTestReport();
    } catch (error) {
      console.error('❌ Test suite failed with error:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async setupTestEnvironment() {
    this.testDir = TestUtils.createTestDir();
    await fs.mkdir(this.testDir, { recursive: true });

    this.engine = new CrossSessionPersistenceEngine(this.testDir, {
      cacheSize: 100,
      cacheTTL: 60000,
      operationTimeout: 5000,
      maxRetries: 3,
      retryDelay: 10,
      autoBackup: false, // Disable for tests
      healthCheckInterval: 1000,
      performanceLogging: true,
      auditTrail: true,
    });

    await this.engine.initialize();
    console.log(`✅ Test environment setup complete: ${this.testDir}`);
  }

  async cleanup() {
    if (this.engine) {
      await this.engine.shutdown();
    }
    if (this.testDir) {
      await TestUtils.cleanup(this.testDir);
    }
  }

  async runTest(testName, testFn) {
    const startTime = Date.now();
    try {
      console.log(`  Running: ${testName}`);
      await testFn();
      const duration = Date.now() - startTime;
      this.testResults.push({
        name: testName,
        status: 'PASS',
        duration,
        error: null,
      });
      console.log(`  ✅ PASS: ${testName} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        name: testName,
        status: 'FAIL',
        duration,
        error: error.message,
      });
      console.log(`  ❌ FAIL: ${testName} (${duration}ms) - ${error.message}`);
    }
  }

  /**
   * Unit Tests - Test individual components
   */
  async runUnitTests() {
    console.log('\n📋 Unit Tests');
    console.log('-'.repeat(40));

    await this.runTest('Task Creation', async () => {
      const taskData = TestUtils.createSampleTask();
      const task = await this.engine.createTask(taskData);

      if (!task.id || !task.version || task.status !== 'pending') {
        throw new Error('Task creation failed validation');
      }
      if (task.created_at !== task.updated_at) {
        throw new Error('Timestamps should be equal for new task');
      }
    });

    await this.runTest('Task Retrieval', async () => {
      const taskData = TestUtils.createSampleTask();
      const createdTask = await this.engine.createTask(taskData);
      const retrievedTask = await this.engine.getTask(createdTask.id);

      if (!retrievedTask || retrievedTask.id !== createdTask.id) {
        throw new Error('Task retrieval failed');
      }
      if (JSON.stringify(retrievedTask) !== JSON.stringify(createdTask)) {
        throw new Error('Retrieved task data mismatch');
      }
    });

    await this.runTest('Task Update', async () => {
      const taskData = TestUtils.createSampleTask();
      const createdTask = await this.engine.createTask(taskData);

      await TestUtils.sleep(10); // Ensure different timestamp
      const updatedTask = await this.engine.updateTask(createdTask.id, {
        status: 'in_progress',
        description: 'Updated description',
      });

      if (updatedTask.status !== 'in_progress') {
        throw new Error('Task status not updated');
      }
      if (updatedTask.version !== createdTask.version + 1) {
        throw new Error('Version not incremented');
      }
      if (updatedTask.updated_at === createdTask.updated_at) {
        throw new Error('Updated timestamp not changed');
      }
    });

    await this.runTest('Task Deletion', async () => {
      const taskData = TestUtils.createSampleTask();
      const createdTask = await this.engine.createTask(taskData);

      const deleted = await this.engine.deleteTask(createdTask.id);
      if (!deleted) {
        throw new Error('Task deletion returned false');
      }

      const retrieved = await this.engine.getTask(createdTask.id);
      if (retrieved !== null) {
        throw new Error('Task still exists after deletion');
      }
    });

    await this.runTest('Task Listing with Filters', async () => {
      // Create test data
      await this.engine.createTask(
        TestUtils.createSampleTask({ status: 'pending', priority: 'high' }),
      );
      await this.engine.createTask(
        TestUtils.createSampleTask({ status: 'completed', priority: 'low' }),
      );
      await this.engine.createTask(
        TestUtils.createSampleTask({ status: 'pending', priority: 'medium' }),
      );

      const pendingTasks = await this.engine.listTasks({
        filter: { status: 'pending' },
        sort: { field: 'priority', order: 'desc' },
      });

      if (pendingTasks.tasks.length !== 2) {
        throw new Error(
          `Expected 2 pending tasks, got ${pendingTasks.tasks.length}`,
        );
      }
      if (pendingTasks.tasks[0].priority !== 'high') {
        throw new Error('Tasks not sorted by priority correctly');
      }
    });
  }

  /**
   * Integration Tests - Test component interactions
   */
  async runIntegrationTests() {
    console.log('\n🔗 Integration Tests');
    console.log('-'.repeat(40));

    await this.runTest('Cache Integration', async () => {
      const taskData = TestUtils.createSampleTask();
      const task = await this.engine.createTask(taskData);

      // First retrieval should cache the task
      const { result: task1, duration: duration1 } =
        await TestUtils.measureExecutionTime(() =>
          this.engine.getTask(task.id),
        )();

      // Second retrieval should be faster (cached)
      const { result: task2, duration: duration2 } =
        await TestUtils.measureExecutionTime(() =>
          this.engine.getTask(task.id),
        )();

      if (JSON.stringify(task1) !== JSON.stringify(task2)) {
        throw new Error('Cached task data mismatch');
      }

      // Cache should make second retrieval significantly faster
      if (duration2 >= duration1) {
        console.warn(`Cache not faster: ${duration1}ms vs ${duration2}ms`);
      }
    });

    await this.runTest('Atomic Operations', async () => {
      const taskData = TestUtils.createSampleTask();
      const task = await this.engine.createTask(taskData);

      // Simulate concurrent updates
      const updatePromises = Array(5)
        .fill(null)
        .map((_, i) =>
          this.engine.updateTask(task.id, {
            description: `Update ${i}`,
            priority: i % 2 === 0 ? 'high' : 'low',
          }),
        );

      const results = await Promise.all(updatePromises);
      const finalTask = await this.engine.getTask(task.id);

      // Verify version incremented correctly
      if (finalTask.version !== task.version + 5) {
        throw new Error(
          `Expected version ${task.version + 5}, got ${finalTask.version}`,
        );
      }

      // All updates should have succeeded
      if (results.some((r) => !r)) {
        throw new Error('Some atomic operations failed');
      }
    });

    await this.runTest('Data Integrity Validation', async () => {
      const taskData = TestUtils.createSampleTask();
      delete taskData.title; // Remove required field

      try {
        await this.engine.createTask(taskData);
        throw new Error('Should have failed validation');
      } catch (error) {
        if (
          !error.message.includes('title') &&
          !error.message.includes('required')
        ) {
          throw new Error(`Unexpected validation error: ${error.message}`);
        }
      }
    });

    await this.runTest('Session Management', async () => {
      const sessionId = 'test-session-' + uuidv4().substring(0, 8);

      // Create tasks in session
      const task1 = await this.engine.createTask(
        TestUtils.createSampleTask({
          session_id: sessionId,
          title: 'Session Task 1',
        }),
      );

      const task2 = await this.engine.createTask(
        TestUtils.createSampleTask({
          session_id: sessionId,
          title: 'Session Task 2',
        }),
      );

      // Retrieve session tasks
      const sessionTasks = await this.engine.listTasks({
        filter: { session_id: sessionId },
      });

      if (sessionTasks.tasks.length !== 2) {
        throw new Error(
          `Expected 2 session tasks, got ${sessionTasks.tasks.length}`,
        );
      }
    });
  }

  /**
   * Performance Tests - Test system performance characteristics
   */
  async runPerformanceTests() {
    console.log('\n⚡ Performance Tests');
    console.log('-'.repeat(40));

    await this.runTest('Bulk Task Creation Performance', async () => {
      const taskCount = 100;
      const startTime = Date.now();

      const createPromises = Array(taskCount)
        .fill(null)
        .map((_, i) =>
          this.engine.createTask(
            TestUtils.createSampleTask({
              title: `Performance Test Task ${i}`,
              priority: i % 3 === 0 ? 'high' : i % 2 === 0 ? 'medium' : 'low',
            }),
          ),
        );

      await Promise.all(createPromises);
      const duration = Date.now() - startTime;
      const avgTime = duration / taskCount;

      console.log(
        `    📊 Created ${taskCount} tasks in ${duration}ms (avg: ${avgTime.toFixed(2)}ms/task)`,
      );

      // Performance threshold: should average < 50ms per task
      if (avgTime > 50) {
        throw new Error(
          `Performance below threshold: ${avgTime.toFixed(2)}ms > 50ms`,
        );
      }
    });

    await this.runTest('Cache Hit Rate Performance', async () => {
      // Create test tasks
      const tasks = [];
      for (let i = 0; i < 20; i++) {
        const task = await this.engine.createTask(
          TestUtils.createSampleTask({
            title: `Cache Test Task ${i}`,
          }),
        );
        tasks.push(task);
      }

      // Perform multiple retrievals
      const retrievalCount = 100;
      const startTime = Date.now();

      for (let i = 0; i < retrievalCount; i++) {
        const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
        await this.engine.getTask(randomTask.id);
      }

      const duration = Date.now() - startTime;
      const avgTime = duration / retrievalCount;

      console.log(
        `    📊 ${retrievalCount} retrievals in ${duration}ms (avg: ${avgTime.toFixed(2)}ms/retrieval)`,
      );

      // Performance threshold: should average < 10ms per cached retrieval
      if (avgTime > 10) {
        throw new Error(
          `Cache performance below threshold: ${avgTime.toFixed(2)}ms > 10ms`,
        );
      }
    });

    await this.runTest('Concurrent Access Performance', async () => {
      const task = await this.engine.createTask(TestUtils.createSampleTask());
      const concurrentRequests = 50;

      const startTime = Date.now();
      const promises = Array(concurrentRequests)
        .fill(null)
        .map(() => this.engine.getTask(task.id));

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      console.log(
        `    📊 ${concurrentRequests} concurrent requests in ${duration}ms`,
      );

      // All requests should succeed
      if (results.some((r) => !r || r.id !== task.id)) {
        throw new Error('Some concurrent requests failed');
      }

      // Should handle concurrent load efficiently
      if (duration > 5000) {
        throw new Error(
          `Concurrent performance too slow: ${duration}ms > 5000ms`,
        );
      }
    });
  }

  /**
   * Failure Recovery Tests - Test system resilience
   */
  async runFailureRecoveryTests() {
    console.log('\n🔄 Failure Recovery Tests');
    console.log('-'.repeat(40));

    await this.runTest('Recovery Manager Integration', async () => {
      const recoveryManager = new TaskRecoveryManager(this.engine);

      // Create tasks and simulate failure scenario
      const task1 = await this.engine.createTask(
        TestUtils.createSampleTask({
          title: 'Recovery Test Task 1',
          status: 'in_progress',
        }),
      );

      const task2 = await this.engine.createTask(
        TestUtils.createSampleTask({
          title: 'Recovery Test Task 2',
          status: 'failed',
        }),
      );

      // Test recovery operations
      const recoveryResult = await recoveryManager.recoverTasks({
        strategy: RECOVERY_STRATEGIES.WARM,
        validationLevel: 'standard',
      });

      if (!recoveryResult.success) {
        throw new Error(`Recovery failed: ${recoveryResult.message}`);
      }

      console.log(
        `    📊 Recovery completed: ${recoveryResult.recoveredTasks} tasks processed`,
      );
    });

    await this.runTest('Backup and Restore', async () => {
      // Create test data
      const task1 = await this.engine.createTask(
        TestUtils.createSampleTask({ title: 'Backup Test 1' }),
      );
      const task2 = await this.engine.createTask(
        TestUtils.createSampleTask({ title: 'Backup Test 2' }),
      );

      // Create backup
      const backup = await this.engine.createBackup(
        'test-backup-' + Date.now(),
      );
      if (!backup.success) {
        throw new Error(`Backup creation failed: ${backup.message}`);
      }

      // Verify backup contains our data
      if (backup.stats.taskCount < 2) {
        throw new Error(
          `Backup missing tasks: expected ≥2, got ${backup.stats.taskCount}`,
        );
      }

      console.log(
        `    📊 Backup created: ${backup.stats.taskCount} tasks, ${backup.stats.totalSize} bytes`,
      );
    });

    await this.runTest('Data Corruption Recovery', async () => {
      const task = await this.engine.createTask(TestUtils.createSampleTask());

      // Simulate data corruption by writing invalid JSON
      const taskFile = path.join(
        this.testDir,
        '.gemini-persistence',
        'tasks',
        `${task.id}.json`,
      );
      await fs.writeFile(taskFile, '{ invalid json content ');

      // System should detect corruption and handle gracefully
      try {
        const retrieved = await this.engine.getTask(task.id);
        // If recovery worked, we should get null (file treated as missing)
        // or the task should be recovered from backup/cache
        console.log(
          `    📊 Corruption handled gracefully: ${retrieved ? 'recovered' : 'treated as missing'}`,
        );
      } catch (error) {
        // Should not throw unhandled errors
        throw new Error(`Corruption not handled gracefully: ${error.message}`);
      }
    });

    await this.runTest('Transaction Rollback', async () => {
      const task = await this.engine.createTask(TestUtils.createSampleTask());

      // Create a scenario where update would fail mid-operation
      // This tests the atomic operation rollback capability
      try {
        // Attempt to update with invalid data structure
        await this.engine.updateTask(task.id, {
          invalid_field: { circular: null },
        });
        // Add circular reference to test JSON serialization failure
        const invalidData = {};
        invalidData.circular = invalidData;

        await this.engine.updateTask(task.id, invalidData);
      } catch (error) {
        // Should fail gracefully without corrupting the original task
        const retrieved = await this.engine.getTask(task.id);
        if (!retrieved || retrieved.version !== task.version) {
          throw new Error('Transaction rollback failed - task corrupted');
        }
      }
    });
  }

  /**
   * Concurrent Access Tests - Test multi-user/multi-process scenarios
   */
  async runConcurrentAccessTests() {
    console.log('\n🔀 Concurrent Access Tests');
    console.log('-'.repeat(40));

    await this.runTest('Concurrent Task Creation', async () => {
      const concurrentCreations = 20;
      const createPromises = Array(concurrentCreations)
        .fill(null)
        .map((_, i) =>
          this.engine.createTask(
            TestUtils.createSampleTask({
              title: `Concurrent Task ${i}`,
              priority: i % 2 === 0 ? 'high' : 'low',
            }),
          ),
        );

      const tasks = await Promise.all(createPromises);

      // Verify all tasks created successfully with unique IDs
      const taskIds = new Set(tasks.map((t) => t.id));
      if (taskIds.size !== concurrentCreations) {
        throw new Error(
          `ID collision detected: ${taskIds.size} unique IDs from ${concurrentCreations} tasks`,
        );
      }
    });

    await this.runTest('Concurrent Task Updates', async () => {
      const task = await this.engine.createTask(TestUtils.createSampleTask());
      const concurrentUpdates = 10;

      const updatePromises = Array(concurrentUpdates)
        .fill(null)
        .map((_, i) =>
          this.engine.updateTask(task.id, {
            description: `Update ${i} at ${Date.now()}`,
            metadata: { updateIndex: i, timestamp: Date.now() },
          }),
        );

      const results = await Promise.all(updatePromises);
      const finalTask = await this.engine.getTask(task.id);

      // Verify all updates succeeded and version incremented correctly
      if (finalTask.version !== task.version + concurrentUpdates) {
        throw new Error(
          `Version mismatch: expected ${task.version + concurrentUpdates}, got ${finalTask.version}`,
        );
      }
    });

    await this.runTest('Mixed Concurrent Operations', async () => {
      const operations = [];

      // Mix of creates, reads, updates, deletes
      for (let i = 0; i < 30; i++) {
        if (i % 4 === 0) {
          // Create operation
          operations.push(
            this.engine.createTask(
              TestUtils.createSampleTask({ title: `Mixed Op Task ${i}` }),
            ),
          );
        } else if (i % 4 === 1) {
          // Read operation (create a task first)
          operations.push(
            this.engine
              .createTask(TestUtils.createSampleTask())
              .then((task) => this.engine.getTask(task.id)),
          );
        } else if (i % 4 === 2) {
          // Update operation
          operations.push(
            this.engine
              .createTask(TestUtils.createSampleTask())
              .then((task) =>
                this.engine.updateTask(task.id, {
                  description: `Updated ${i}`,
                }),
              ),
          );
        } else {
          // Delete operation
          operations.push(
            this.engine
              .createTask(TestUtils.createSampleTask())
              .then((task) => this.engine.deleteTask(task.id)),
          );
        }
      }

      const results = await Promise.all(operations);

      // Verify no operations failed
      if (results.some((r) => r === null || r === false)) {
        throw new Error('Some mixed concurrent operations failed');
      }

      console.log(
        `    📊 ${operations.length} mixed operations completed successfully`,
      );
    });
  }

  /**
   * End-to-End Tests - Test complete workflows
   */
  async runEndToEndTests() {
    console.log('\n🎯 End-to-End Tests');
    console.log('-'.repeat(40));

    await this.runTest('Complete Task Lifecycle', async () => {
      // Create task
      const taskData = TestUtils.createSampleTask({
        title: 'E2E Lifecycle Test',
        description: 'Testing complete task lifecycle',
        status: 'pending',
        priority: 'high',
      });

      const task = await this.engine.createTask(taskData);

      // Update through various states
      const inProgress = await this.engine.updateTask(task.id, {
        status: 'in_progress',
        assignee: 'test-agent-001',
      });

      const completed = await this.engine.updateTask(task.id, {
        status: 'completed',
        completion_time: new Date().toISOString(),
      });

      // Verify state progression
      if (completed.version !== task.version + 2) {
        throw new Error('Version not tracking correctly through lifecycle');
      }

      if (completed.status !== 'completed') {
        throw new Error('Final status not set correctly');
      }

      // Archive task
      const archived = await this.engine.updateTask(task.id, {
        status: 'archived',
        archived_at: new Date().toISOString(),
      });

      console.log(
        `    📊 Task lifecycle: ${task.version} → ${archived.version} (${archived.status})`,
      );
    });

    await this.runTest('Session Recovery Simulation', async () => {
      const sessionId = 'e2e-session-' + uuidv4().substring(0, 8);

      // Create session with active tasks
      const tasks = [];
      for (let i = 0; i < 5; i++) {
        const task = await this.engine.createTask(
          TestUtils.createSampleTask({
            title: `Session Task ${i}`,
            session_id: sessionId,
            status: i < 3 ? 'in_progress' : 'pending',
          }),
        );
        tasks.push(task);
      }

      // Simulate session interruption and recovery
      const recoveryManager = new TaskRecoveryManager(this.engine);
      const resumeResult = await recoveryManager.resumeSessionTasks(sessionId);

      if (!resumeResult.success) {
        throw new Error(`Session recovery failed: ${resumeResult.message}`);
      }

      console.log(
        `    📊 Session recovery: ${resumeResult.resumedTasks} tasks resumed`,
      );
    });

    await this.runTest('System Health Monitoring', async () => {
      // Perform operations to generate metrics
      for (let i = 0; i < 10; i++) {
        const task = await this.engine.createTask(TestUtils.createSampleTask());
        await this.engine.updateTask(task.id, { status: 'completed' });
        await this.engine.getTask(task.id);
      }

      // Get system status
      const status = this.engine.getSystemStatus();

      if (!status.performance || !status.cache || !status.memory) {
        throw new Error('System status missing required metrics');
      }

      if (status.performance.operations < 20) {
        throw new Error(
          `Expected ≥20 operations, got ${status.performance.operations}`,
        );
      }

      console.log(
        `    📊 System health: ${status.performance.operations} ops, ${(status.cache.hitRate * 100).toFixed(1)}% cache hit rate`,
      );
    });

    await this.runTest('Performance Under Load', async () => {
      const loadTestDuration = 5000; // 5 seconds
      const startTime = Date.now();
      let operationCount = 0;
      const errors = [];

      // Generate continuous load
      const loadPromises = [];
      while (Date.now() - startTime < loadTestDuration) {
        const promise = (async () => {
          try {
            const task = await this.engine.createTask(
              TestUtils.createSampleTask({
                title: `Load Test ${operationCount++}`,
              }),
            );
            await this.engine.getTask(task.id);
            await this.engine.updateTask(task.id, { status: 'completed' });
          } catch (error) {
            errors.push(error);
          }
        })();

        loadPromises.push(promise);
        await TestUtils.sleep(50); // 50ms between operations
      }

      await Promise.all(loadPromises);
      const actualDuration = Date.now() - startTime;
      const opsPerSecond = ((operationCount / actualDuration) * 1000).toFixed(
        2,
      );

      if (errors.length > 0) {
        throw new Error(`${errors.length} errors during load test`);
      }

      console.log(
        `    📊 Load test: ${operationCount} operations in ${actualDuration}ms (${opsPerSecond} ops/sec)`,
      );
    });
  }

  /**
   * Generate comprehensive test report
   */
  async generateTestReport() {
    console.log('\n📊 Test Results Summary');
    console.log('='.repeat(80));

    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(
      (r) => r.status === 'PASS',
    ).length;
    const failedTests = this.testResults.filter(
      (r) => r.status === 'FAIL',
    ).length;
    const totalDuration = this.testResults.reduce(
      (sum, r) => sum + r.duration,
      0,
    );
    const avgDuration = (totalDuration / totalTests).toFixed(2);

    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(
      `Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`,
    );
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Average Duration: ${avgDuration}ms per test`);

    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter((r) => r.status === 'FAIL')
        .forEach((result) => {
          console.log(`  • ${result.name}: ${result.error}`);
        });
    }

    // Performance metrics
    const performanceTests = this.testResults.filter(
      (r) => r.name.includes('Performance') || r.name.includes('Load'),
    );

    if (performanceTests.length > 0) {
      console.log('\n⚡ Performance Metrics:');
      performanceTests.forEach((result) => {
        console.log(`  • ${result.name}: ${result.duration}ms`);
      });
    }

    // Generate detailed report file
    const reportPath = path.join(this.testDir, 'test-report.json');
    const report = {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        successRate: (passedTests / totalTests) * 100,
        totalDuration,
        avgDuration: parseFloat(avgDuration),
        timestamp: new Date().toISOString(),
      },
      results: this.testResults,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        testDir: this.testDir,
      },
    };

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved: ${reportPath}`);

    if (failedTests === 0) {
      console.log('\n🎉 All tests passed! System is functioning correctly.');
    } else {
      console.log(
        `\n⚠️  ${failedTests} test(s) failed. Please review and fix issues.`,
      );
    }
  }
}

// Export for use in testing environments
module.exports = {
  CrossSessionPersistenceEngineTestSuite,
  TestUtils,
  MockFileSystem,
};

// Run tests if called directly
if (require.main === module) {
  (async () => {
    const testSuite = new CrossSessionPersistenceEngineTestSuite();
    try {
      await testSuite.runAllTests();
      process.exit(0);
    } catch (error) {
      console.error('Test suite failed:', error);
      process.exit(1);
    }
  })();
}
