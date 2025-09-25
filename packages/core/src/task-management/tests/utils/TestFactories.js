/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { vi } from 'vitest';
/**
 * @fileoverview Test factories and utilities for task management testing
 *
 * Provides factory functions to create mock objects, test data generators,
 * and utility functions for comprehensive testing scenarios.
 */
/**
 * Factory class for creating test objects with realistic data
 */
export class TestFactories {
  static taskIdCounter = 0;
  static dependencyIdCounter = 0;
  /**
   * Creates a mock task with customizable properties
   */
  static createMockTask(overrides = {}) {
    const id = overrides.id || `task_${Date.now()}_${this.taskIdCounter++}`;
    const createdAt = overrides.metadata?.createdAt || new Date();
    const baseTask = {
      id,
      title: `Test Task ${this.taskIdCounter}`,
      description: 'A test task created by the test factory',
      status: 'pending',
      priority: 'medium',
      category: 'implementation',
      metadata: {
        createdAt,
        updatedAt: createdAt,
        createdBy: 'test-factory',
        estimatedDuration: 60000, // 1 minute
        tags: ['test', 'generated'],
      },
      executionContext: {
        timeout: 300000,
        maxRetries: 3,
      },
    };
    // Recursively merge overrides
    return this.deepMerge(baseTask, overrides);
  }
  /**
   * Creates multiple mock tasks with varied properties
   */
  static createMockTasks(count, baseOverrides = {}) {
    const tasks = [];
    const priorities = ['low', 'medium', 'high', 'critical'];
    const categories = [
      'implementation',
      'testing',
      'documentation',
      'analysis',
      'refactoring',
      'deployment',
    ];
    const statuses = [
      'pending',
      'ready',
      'in_progress',
      'completed',
      'failed',
      'blocked',
    ];
    for (let i = 0; i < count; i++) {
      const overrides = {
        ...baseOverrides,
        title: baseOverrides.title || `Generated Task ${i + 1}`,
        description:
          baseOverrides.description ||
          `Generated task number ${i + 1} for testing purposes`,
        priority: baseOverrides.priority || priorities[i % priorities.length],
        category: baseOverrides.category || categories[i % categories.length],
        status: baseOverrides.status || statuses[i % statuses.length],
        metadata: {
          ...baseOverrides.metadata,
          createdAt: new Date(Date.now() - Math.random() * 86400000), // Random time in last 24 hours
          estimatedDuration: (30 + Math.random() * 300) * 1000, // 30 seconds to 5 minutes
          tags: baseOverrides.metadata?.tags || [
            `batch-${Math.floor(i / 10)}`,
            'generated',
          ],
        },
      };
      tasks.push(this.createMockTask(overrides));
    }
    return tasks;
  }
  /**
   * Creates a mock task dependency
   */
  static createMockDependency(
    dependentTaskId,
    dependsOnTaskId,
    overrides = {},
  ) {
    return {
      dependentTaskId,
      dependsOnTaskId,
      type: 'hard',
      reason: 'Generated test dependency',
      parallelizable: false,
      ...overrides,
    };
  }
  /**
   * Creates a dependency graph from tasks
   */
  static createMockDependencyGraph(tasks, dependencies, overrides = {}) {
    const nodes = new Map();
    // Create nodes
    for (const task of tasks) {
      nodes.set(task.id, {
        taskId: task.id,
        dependencies: dependencies
          .filter((dep) => dep.dependentTaskId === task.id)
          .map((dep) => dep.dependsOnTaskId),
        dependents: dependencies
          .filter((dep) => dep.dependsOnTaskId === task.id)
          .map((dep) => dep.dependentTaskId),
        dependencyRelations: dependencies.filter(
          (dep) =>
            dep.dependentTaskId === task.id || dep.dependsOnTaskId === task.id,
        ),
      });
    }
    const baseGraph = {
      nodes,
      edges: dependencies,
      metadata: {
        nodeCount: tasks.length,
        edgeCount: dependencies.length,
        hasCycles: false, // Would need actual cycle detection
        maxDepth: 0, // Would need actual depth calculation
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
    return this.deepMerge(baseGraph, overrides);
  }
  /**
   * Creates a mock task result
   */
  static createMockTaskResult(taskId, success = true, overrides = {}) {
    const now = new Date();
    const startTime = new Date(now.getTime() - 60000); // 1 minute ago
    const baseResult = {
      taskId,
      success,
      output: success
        ? { result: 'Task completed successfully', data: 'mock output' }
        : undefined,
      error: success
        ? undefined
        : {
            message: 'Mock task failure',
            code: 'MOCK_ERROR',
            details: { reason: 'Simulated failure for testing' },
          },
      metrics: {
        startTime,
        endTime: now,
        duration: now.getTime() - startTime.getTime(),
        memoryUsage: Math.floor(Math.random() * 50) + 10, // 10-60 MB
        cpuUsage: Math.floor(Math.random() * 80) + 5, // 5-85%
      },
      artifacts: success ? [`output_${taskId}.json`, `log_${taskId}.txt`] : [],
      validationResults: success
        ? [
            { criterion: 'output_format', passed: true },
            { criterion: 'execution_time', passed: true },
          ]
        : [
            {
              criterion: 'basic_validation',
              passed: false,
              message: 'Task failed validation',
            },
          ],
    };
    return this.deepMerge(baseResult, overrides);
  }
  /**
   * Creates mock resource constraints
   */
  static createMockResourceConstraints(count = 3) {
    const resourceTypes = ['cpu', 'memory', 'network', 'disk', 'gpu'];
    const constraints = [];
    for (let i = 0; i < count; i++) {
      const resourceType = resourceTypes[i % resourceTypes.length];
      constraints.push({
        resourceType,
        maxUnits: Math.floor(Math.random() * 8) + 1, // 1-8 units
        exclusive: Math.random() > 0.8, // 20% chance of being exclusive
        tags: [`pool-${Math.floor(Math.random() * 3)}`, resourceType],
      });
    }
    return constraints;
  }
  /**
   * Creates mock execution sequence
   */
  static createMockExecutionSequence(tasks, overrides = {}) {
    const sequence = tasks.map((t) => t.id);
    const parallelGroups = this.createRandomParallelGroups(sequence);
    const criticalPath = sequence.slice(0, Math.min(3, sequence.length));
    const baseSequence = {
      sequence,
      parallelGroups,
      criticalPath,
      estimatedDuration: tasks.reduce(
        (sum, task) => sum + (task.metadata.estimatedDuration || 60000),
        0,
      ),
      metadata: {
        algorithm: 'mock_scheduler',
        generatedAt: new Date(),
        factors: ['priority', 'dependencies', 'resources'],
        constraints: ['resource_limits', 'deadlines'],
      },
    };
    return this.deepMerge(baseSequence, overrides);
  }
  /**
   * Creates mock resource allocation
   */
  static createMockResourceAllocation(taskId, resources, overrides = {}) {
    const allocatedResources = new Map();
    const poolAssignments = [];
    for (const resource of resources) {
      allocatedResources.set(resource.resourceType, resource.maxUnits);
      poolAssignments.push(...(resource.tags || []));
    }
    const baseAllocation = {
      taskId,
      allocatedResources,
      poolAssignments,
      allocatedAt: new Date(),
      expectedReleaseAt: new Date(Date.now() + 300000), // 5 minutes from now
    };
    return this.deepMerge(baseAllocation, overrides);
  }
  /**
   * Creates a mock Config object for testing
   */
  static createMockConfig(overrides = {}) {
    const baseConfig = {
      getModel: vi.fn(() => 'gemini-2.0-pro'),
      getToolRegistry: vi.fn(() => ({
        getTool: vi.fn(),
        getAllTools: vi.fn(() => []),
        getAllToolNames: vi.fn(() => []),
        getFunctionDeclarationsFiltered: vi.fn(() => []),
      })),
      storage: {
        getProjectTempDir: vi.fn(() => '/tmp/test-project'),
        ensureProjectTempDir: vi.fn(),
      },
      getSessionId: vi.fn(() => 'test-session-id'),
      settings: {
        get: vi.fn((key) => {
          const defaults = {
            'taskManagement.maxConcurrentTasks': 5,
            'taskManagement.defaultTimeout': 300000,
            'taskManagement.maxRetries': 3,
            'monitoring.enabled': true,
          };
          return defaults[key];
        }),
      },
    };
    return this.deepMerge(baseConfig, overrides);
  }
  /**
   * Creates complex task scenarios for testing
   */
  static createComplexTaskScenarios() {
    return {
      /**
       * Linear dependency chain: A -> B -> C -> D
       */
      linearChain: () => {
        const tasks = this.createMockTasks(4, { category: 'implementation' });
        const dependencies = [
          this.createMockDependency(tasks[1].id, tasks[0].id),
          this.createMockDependency(tasks[2].id, tasks[1].id),
          this.createMockDependency(tasks[3].id, tasks[2].id),
        ];
        return { tasks, dependencies };
      },
      /**
       * Fan-out pattern: A -> [B, C, D]
       */
      fanOut: () => {
        const tasks = this.createMockTasks(4, { category: 'analysis' });
        const dependencies = [
          this.createMockDependency(tasks[1].id, tasks[0].id),
          this.createMockDependency(tasks[2].id, tasks[0].id),
          this.createMockDependency(tasks[3].id, tasks[0].id),
        ];
        return { tasks, dependencies };
      },
      /**
       * Fan-in pattern: [A, B, C] -> D
       */
      fanIn: () => {
        const tasks = this.createMockTasks(4, { category: 'testing' });
        const dependencies = [
          this.createMockDependency(tasks[3].id, tasks[0].id),
          this.createMockDependency(tasks[3].id, tasks[1].id),
          this.createMockDependency(tasks[3].id, tasks[2].id),
        ];
        return { tasks, dependencies };
      },
      /**
       * Diamond pattern: A -> [B, C] -> D
       */
      diamond: () => {
        const tasks = this.createMockTasks(4, { category: 'implementation' });
        const dependencies = [
          this.createMockDependency(tasks[1].id, tasks[0].id),
          this.createMockDependency(tasks[2].id, tasks[0].id),
          this.createMockDependency(tasks[3].id, tasks[1].id),
          this.createMockDependency(tasks[3].id, tasks[2].id),
        ];
        return { tasks, dependencies };
      },
      /**
       * Complex multi-layer hierarchy
       */
      multiLayer: () => {
        const tasks = this.createMockTasks(8);
        const dependencies = [
          // Layer 1 -> Layer 2
          this.createMockDependency(tasks[2].id, tasks[0].id),
          this.createMockDependency(tasks[3].id, tasks[0].id),
          this.createMockDependency(tasks[4].id, tasks[1].id),
          // Layer 2 -> Layer 3
          this.createMockDependency(tasks[5].id, tasks[2].id),
          this.createMockDependency(tasks[5].id, tasks[3].id),
          this.createMockDependency(tasks[6].id, tasks[3].id),
          this.createMockDependency(tasks[6].id, tasks[4].id),
          // Layer 3 -> Layer 4
          this.createMockDependency(tasks[7].id, tasks[5].id),
          this.createMockDependency(tasks[7].id, tasks[6].id),
        ];
        return { tasks, dependencies };
      },
      /**
       * Circular dependency for testing cycle detection
       */
      circular: () => {
        const tasks = this.createMockTasks(3);
        const dependencies = [
          this.createMockDependency(tasks[1].id, tasks[0].id),
          this.createMockDependency(tasks[2].id, tasks[1].id),
          this.createMockDependency(tasks[0].id, tasks[2].id), // Creates cycle
        ];
        return { tasks, dependencies };
      },
    };
  }
  /**
   * Creates performance testing scenarios
   */
  static createPerformanceScenarios() {
    return {
      /**
       * High-volume task creation scenario
       */
      highVolume: (count = 1000) =>
        this.createMockTasks(count, {
          category: 'implementation',
          priority: 'medium',
          metadata: {
            estimatedDuration: 60000, // 1 minute each
            tags: ['performance-test', 'high-volume'],
          },
        }),
      /**
       * Resource-intensive tasks
       */
      resourceIntensive: (count = 50) =>
        this.createMockTasks(count).map((task) => ({
          ...task,
          executionContext: {
            ...task.executionContext,
            resourceConstraints: this.createMockResourceConstraints(5),
            timeout: 600000, // 10 minutes
          },
        })),
      /**
       * Mixed priority workload
       */
      mixedPriority: (count = 200) => {
        const priorities = ['critical', 'high', 'medium', 'low'];
        return this.createMockTasks(count).map((task, index) => ({
          ...task,
          priority: priorities[index % priorities.length],
          metadata: {
            ...task.metadata,
            estimatedDuration:
              task.priority === 'critical'
                ? 30000
                : task.priority === 'high'
                  ? 120000
                  : task.priority === 'medium'
                    ? 300000
                    : 600000,
          },
        }));
      },
      /**
       * Long-running tasks
       */
      longRunning: (count = 20) =>
        this.createMockTasks(count).map((task) => ({
          ...task,
          category: 'analysis',
          metadata: {
            ...task.metadata,
            estimatedDuration: (60 + Math.random() * 300) * 60 * 1000, // 1-6 hours
          },
          executionContext: {
            ...task.executionContext,
            timeout: 8 * 60 * 60 * 1000, // 8 hours
            maxRetries: 1,
          },
        })),
    };
  }
  /**
   * Creates error scenarios for testing error handling
   */
  static createErrorScenarios() {
    return {
      /**
       * Tasks that will fail validation
       */
      invalidTasks: () => [
        this.createMockTask({ title: '', description: 'Missing title' }),
        this.createMockTask({ title: 'Valid title', description: '' }),
        this.createMockTask({
          title: 'Resource error',
          description: 'Invalid resource constraints',
          executionContext: {
            resourceConstraints: [
              { resourceType: '', maxUnits: -1 }, // Invalid constraint
            ],
          },
        }),
        this.createMockTask({
          title: 'Timeout error',
          description: 'Invalid timeout',
          executionContext: {
            timeout: -1000, // Negative timeout
          },
        }),
      ],
      /**
       * Tasks with circular dependencies
       */
      circularDependencies: () => {
        const tasks = this.createMockTasks(3);
        const dependencies = [
          this.createMockDependency(tasks[1].id, tasks[0].id),
          this.createMockDependency(tasks[2].id, tasks[1].id),
          this.createMockDependency(tasks[0].id, tasks[2].id),
        ];
        return { tasks, dependencies };
      },
      /**
       * Tasks that will timeout during execution
       */
      timeoutTasks: () =>
        this.createMockTasks(5).map((task) => ({
          ...task,
          executionContext: {
            ...task.executionContext,
            timeout: 100, // Very short timeout
          },
          metadata: {
            ...task.metadata,
            estimatedDuration: 10000, // Much longer than timeout
          },
        })),
      /**
       * Tasks with missing dependencies
       */
      missingDependencies: () => {
        const tasks = this.createMockTasks(3);
        const dependencies = [
          this.createMockDependency(tasks[0].id, 'non-existent-task-id'),
          this.createMockDependency('another-non-existent-id', tasks[1].id),
        ];
        return { tasks, dependencies };
      },
    };
  }
  /**
   * Utility method to create random parallel execution groups
   */
  static createRandomParallelGroups(sequence) {
    const groups = [];
    let currentGroup = [];
    for (let i = 0; i < sequence.length; i++) {
      currentGroup.push(sequence[i]);
      // Randomly decide to start a new group (33% chance)
      if (Math.random() > 0.67 || i === sequence.length - 1) {
        groups.push([...currentGroup]);
        currentGroup = [];
      }
    }
    return groups.filter((group) => group.length > 0);
  }
  /**
   * Deep merge utility for combining objects
   */
  static deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
      const sourceValue = source[key];
      const targetValue = target[key];
      if (sourceValue !== undefined) {
        if (this.isObject(sourceValue) && this.isObject(targetValue)) {
          result[key] = this.deepMerge(targetValue, sourceValue);
        } else {
          result[key] = sourceValue;
        }
      }
    }
    return result;
  }
  /**
   * Check if value is a plain object
   */
  static isObject(value) {
    return (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    );
  }
}
/**
 * Test utilities for common testing operations
 */
export class TestUtils {
  /**
   * Wait for a condition to be true with timeout
   */
  static async waitFor(condition, timeoutMs = 5000, intervalMs = 100) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      if (await condition()) {
        return;
      }
      await this.sleep(intervalMs);
    }
    throw new Error(`Condition not met within ${timeoutMs}ms`);
  }
  /**
   * Sleep for specified milliseconds
   */
  static async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  /**
   * Generate random string of specified length
   */
  static randomString(length = 10) {
    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  /**
   * Generate random number within range
   */
  static randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  /**
   * Pick random element from array
   */
  static randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
  /**
   * Shuffle array in place
   */
  static shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  /**
   * Create a mock timer for testing time-based operations
   */
  static createMockTimer() {
    let currentTime = Date.now();
    const timers = [];
    let nextId = 1;
    return {
      getCurrentTime: () => currentTime,
      setTimeout: (callback, delay) => {
        const id = nextId++;
        timers.push({ callback, time: currentTime + delay, id });
        return id;
      },
      clearTimeout: (id) => {
        const index = timers.findIndex((timer) => timer.id === id);
        if (index !== -1) {
          timers.splice(index, 1);
        }
      },
      tick: (ms) => {
        currentTime += ms;
        const readyTimers = timers.filter((timer) => timer.time <= currentTime);
        readyTimers.forEach((timer) => {
          timer.callback();
          const index = timers.indexOf(timer);
          if (index !== -1) {
            timers.splice(index, 1);
          }
        });
      },
      hasTimers: () => timers.length > 0,
      getTimerCount: () => timers.length,
    };
  }
  /**
   * Create a performance measurement utility
   */
  static createPerformanceMeasurer() {
    const measurements = {};
    return {
      start: (name) => {
        measurements[name] = { start: performance.now() };
      },
      end: (name) => {
        const measurement = measurements[name];
        if (measurement) {
          measurement.end = performance.now();
          measurement.duration = measurement.end - measurement.start;
        }
      },
      getDuration: (name) => measurements[name]?.duration,
      getAllMeasurements: () => ({ ...measurements }),
      clear: () => {
        Object.keys(measurements).forEach((key) => delete measurements[key]);
      },
    };
  }
  /**
   * Memory usage tracker
   */
  static createMemoryTracker() {
    const snapshots = [];
    return {
      snapshot: (label) => {
        snapshots.push({
          timestamp: Date.now(),
          usage: process.memoryUsage(),
          label,
        });
      },
      getSnapshots: () => snapshots,
      getMemoryIncrease: (fromLabel, toLabel) => {
        const fromSnapshot = fromLabel
          ? snapshots.find((s) => s.label === fromLabel)
          : snapshots[0];
        const toSnapshot = toLabel
          ? snapshots.find((s) => s.label === toLabel)
          : snapshots[snapshots.length - 1];
        if (fromSnapshot && toSnapshot) {
          return {
            heapUsed: toSnapshot.usage.heapUsed - fromSnapshot.usage.heapUsed,
            heapTotal:
              toSnapshot.usage.heapTotal - fromSnapshot.usage.heapTotal,
            rss: toSnapshot.usage.rss - fromSnapshot.usage.rss,
          };
        }
        return null;
      },
      clear: () => {
        snapshots.length = 0;
      },
    };
  }
}
/**
 * Mock data generators for various testing scenarios
 */
export class MockDataGenerators {
  /**
   * Generate realistic task titles
   */
  static generateTaskTitles(count) {
    const prefixes = [
      'Implement',
      'Fix',
      'Update',
      'Create',
      'Refactor',
      'Test',
      'Deploy',
      'Optimize',
    ];
    const subjects = [
      'authentication',
      'database',
      'API',
      'UI component',
      'validation',
      'caching',
      'monitoring',
    ];
    const suffixes = [
      'system',
      'functionality',
      'integration',
      'service',
      'module',
      'interface',
    ];
    const titles = [];
    for (let i = 0; i < count; i++) {
      const prefix = TestUtils.randomElement(prefixes);
      const subject = TestUtils.randomElement(subjects);
      const suffix = TestUtils.randomElement(suffixes);
      titles.push(`${prefix} ${subject} ${suffix}`);
    }
    return titles;
  }
  /**
   * Generate realistic task descriptions
   */
  static generateTaskDescriptions(count) {
    const templates = [
      'This task involves {action} the {component} to {outcome}. Priority: {priority}',
      'Need to {action} {component} for {reason}. Expected completion: {timeline}',
      '{component} requires {action} to address {issue}. Dependencies: {deps}',
      'Implement {feature} in {component} to support {requirement}',
    ];
    const actions = [
      'implementing',
      'updating',
      'refactoring',
      'testing',
      'deploying',
    ];
    const components = [
      'user management',
      'payment system',
      'notification service',
      'data pipeline',
    ];
    const outcomes = [
      'better performance',
      'enhanced security',
      'improved usability',
      'bug fixes',
    ];
    const reasons = [
      'compliance requirements',
      'user feedback',
      'security audit',
      'performance issues',
    ];
    const descriptions = [];
    for (let i = 0; i < count; i++) {
      let template = TestUtils.randomElement(templates);
      template = template.replace('{action}', TestUtils.randomElement(actions));
      template = template.replace(
        '{component}',
        TestUtils.randomElement(components),
      );
      template = template.replace(
        '{outcome}',
        TestUtils.randomElement(outcomes),
      );
      template = template.replace('{reason}', TestUtils.randomElement(reasons));
      template = template.replace(
        '{priority}',
        TestUtils.randomElement(['high', 'medium', 'low']),
      );
      template = template.replace(
        '{timeline}',
        TestUtils.randomElement(['this week', 'next sprint', 'end of month']),
      );
      template = template.replace(
        '{issue}',
        TestUtils.randomElement([
          'performance bottleneck',
          'security vulnerability',
          'user complaints',
        ]),
      );
      template = template.replace(
        '{deps}',
        TestUtils.randomElement([
          'database migration',
          'API changes',
          'frontend updates',
        ]),
      );
      template = template.replace(
        '{feature}',
        TestUtils.randomElement([
          'authentication',
          'search',
          'reporting',
          'analytics',
        ]),
      );
      template = template.replace(
        '{requirement}',
        TestUtils.randomElement([
          'mobile support',
          'real-time updates',
          'batch processing',
        ]),
      );
      descriptions.push(template);
    }
    return descriptions;
  }
  /**
   * Generate realistic execution contexts
   */
  static generateExecutionContexts(count) {
    const contexts = [];
    for (let i = 0; i < count; i++) {
      contexts.push({
        workingDirectory: `/tmp/task-${i}`,
        environment: {
          NODE_ENV: TestUtils.randomElement([
            'development',
            'staging',
            'production',
          ]),
          LOG_LEVEL: TestUtils.randomElement([
            'debug',
            'info',
            'warn',
            'error',
          ]),
          DATABASE_URL: `postgres://localhost:5432/test_${i}`,
        },
        timeout: TestUtils.randomInt(30000, 600000), // 30 seconds to 10 minutes
        maxRetries: TestUtils.randomInt(1, 5),
        resourceConstraints: TestFactories.createMockResourceConstraints(
          TestUtils.randomInt(1, 4),
        ),
      });
    }
    return contexts;
  }
}
//# sourceMappingURL=TestFactories.js.map
