/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { defineConfig } from 'vitest/config';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIRNAME = dirname(fileURLToPath(import.meta.url));

/**
 * Comprehensive Test Runner Configuration for Autonomous Task Management
 *
 * This configuration orchestrates all integration testing suites including:
 * - Multi-agent coordination testing
 * - End-to-end workflow validation
 * - Performance benchmarking and optimization
 * - CI/CD automation and deployment testing
 * - System reliability and stress testing
 * - Cross-session persistence validation
 */
export default defineConfig({
  test: {
    // Test execution configuration
    testTimeout: 300000, // 5 minutes for comprehensive integration tests
    globalSetup: './test-global-setup.ts',
    setupFiles: ['./test-setup.ts'],

    // Test file patterns and organization
    include: [
      '**/autonomous-task-management.test.ts',
      '**/e2e-autonomous-workflows.test.ts',
      '**/performance-benchmarks.test.ts',
      '**/ci-cd-automation.test.ts',
      '**/reliability-stress-testing.test.ts',
    ],

    // Exclude patterns for files that shouldn't be tested
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
    ],

    // Reporter configuration for comprehensive test results
    reporters: [
      'default',
      'verbose',
      ['junit', { outputFile: './test-results/junit.xml' }],
      ['json', { outputFile: './test-results/results.json' }],
      ['html', { outputFile: './test-results/index.html' }],
    ],

    // Test retry and parallel execution
    retry: 3, // Retry failed tests up to 3 times due to potential race conditions
    fileParallelism: false, // Run test files sequentially to avoid resource conflicts
    maxConcurrency: 1, // Ensure only one test suite runs at a time

    // Thread pool configuration
    poolOptions: {
      threads: {
        minThreads: 1,
        maxThreads: 2, // Limited threads to prevent resource exhaustion
        isolate: true,
        useAtomics: true,
      },
    },

    // Environment variables for testing
    env: {
      // Test environment configuration
      NODE_ENV: 'test',
      VITEST_ENVIRONMENT: 'autonomous-testing',

      // Task Manager configuration
      TASK_MANAGER_TIMEOUT: '10000',
      TASK_MANAGER_API_PATH:
        '/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js',

      // Integration test configuration
      INTEGRATION_TEST_FILE_DIR:
        process.env.INTEGRATION_TEST_FILE_DIR || '/tmp/autonomous-tests',
      GEMINI_SANDBOX: process.env.GEMINI_SANDBOX || 'false',

      // CI/CD integration flags
      AUTONOMOUS_CI_MODE: process.env.CI || 'false',
      PERFORMANCE_BENCHMARKS_ENABLED: 'true',
      STRESS_TESTING_ENABLED: 'true',
      RELIABILITY_TESTING_ENABLED: 'true',

      // Test output configuration
      KEEP_OUTPUT: process.env.KEEP_OUTPUT || 'false',
      VERBOSE: process.env.VERBOSE || 'false',
      DEBUG_AUTONOMOUS_TESTS: process.env.DEBUG || 'false',
    },

    // Coverage configuration
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './test-results/coverage',

      // Include patterns for coverage
      include: [
        '**/autonomous-task-management.test.ts',
        '**/e2e-autonomous-workflows.test.ts',
        '**/performance-benchmarks.test.ts',
        '**/ci-cd-automation.test.ts',
        '**/reliability-stress-testing.test.ts',
      ],

      // Exclude patterns from coverage
      exclude: [
        '**/node_modules/**',
        '**/test-helper.ts',
        '**/test-setup.ts',
        '**/test-global-setup.ts',
      ],

      // Coverage thresholds
      thresholds: {
        global: {
          branches: 70,
          functions: 75,
          lines: 80,
          statements: 80,
        },
      },
    },

    // Test isolation and cleanup
    isolate: true,
    passWithNoTests: false,
    allowOnly: false, // Prevent accidental test.only in CI

    // Watch mode configuration (disabled for autonomous testing)
    watch: false,
    watchExclude: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
  },

  // Build configuration for test dependencies
  build: {
    target: 'node20',
    outDir: './test-dist',
    sourcemap: true,
    minify: false,
    rollupOptions: {
      external: ['node:*', 'vitest', '@vitest/*'],
    },
  },

  // Resolve configuration for test modules
  resolve: {
    alias: {
      '@': join(DIRNAME, '..'),
      '@tests': DIRNAME,
      '@helpers': join(DIRNAME, 'helpers'),
      '@fixtures': join(DIRNAME, 'fixtures'),
    },
  },

  // Define global constants for tests
  define: {
    __AUTONOMOUS_TEST_MODE__: true,
    __TASK_MANAGER_PATH__: JSON.stringify(
      '/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js',
    ),
    __TEST_TIMEOUT__: 300000,
    __PERFORMANCE_THRESHOLDS__: JSON.stringify({
      latency: {
        avg: 1000, // 1 second average
        p95: 2000, // 2 seconds 95th percentile
        p99: 5000, // 5 seconds 99th percentile
      },
      throughput: {
        minRPS: 10, // Minimum 10 requests per second
        targetRPS: 50, // Target 50 requests per second
      },
      memory: {
        maxHeapMB: 500, // Maximum 500MB heap usage
        maxRSSMB: 1000, // Maximum 1GB RSS usage
      },
    }),
  },
});

/**
 * Test Suite Configuration and Orchestration
 */
export interface TestSuiteConfig {
  name: string;
  description: string;
  timeout: number;
  priority: 'critical' | 'high' | 'normal' | 'low';
  dependencies: string[];
  tags: string[];
  parallel: boolean;
  retries: number;
}

export const TEST_SUITES: Record<string, TestSuiteConfig> = {
  'autonomous-task-management': {
    name: 'Autonomous Task Management Integration Tests',
    description:
      'Core multi-agent coordination and task management functionality',
    timeout: 180000, // 3 minutes
    priority: 'critical',
    dependencies: [],
    tags: ['integration', 'multi-agent', 'coordination'],
    parallel: false,
    retries: 2,
  },

  'e2e-autonomous-workflows': {
    name: 'End-to-End Autonomous Workflows',
    description:
      'Complete workflow scenarios from feature suggestion to implementation',
    timeout: 240000, // 4 minutes
    priority: 'critical',
    dependencies: ['autonomous-task-management'],
    tags: ['e2e', 'workflows', 'integration'],
    parallel: false,
    retries: 2,
  },

  'performance-benchmarks': {
    name: 'Performance Benchmarks & Optimization',
    description: 'System performance, scalability, and optimization validation',
    timeout: 300000, // 5 minutes
    priority: 'high',
    dependencies: ['autonomous-task-management'],
    tags: ['performance', 'benchmarks', 'optimization'],
    parallel: false,
    retries: 1,
  },

  'ci-cd-automation': {
    name: 'CI/CD Integration & Test Automation',
    description: 'Continuous integration pipelines and deployment automation',
    timeout: 180000, // 3 minutes
    priority: 'high',
    dependencies: ['e2e-autonomous-workflows'],
    tags: ['ci-cd', 'automation', 'deployment'],
    parallel: false,
    retries: 2,
  },

  'reliability-stress-testing': {
    name: 'System Reliability & Stress Testing',
    description:
      'High-load stress testing, fault tolerance, and chaos engineering',
    timeout: 600000, // 10 minutes
    priority: 'normal',
    dependencies: ['performance-benchmarks'],
    tags: ['reliability', 'stress', 'chaos-engineering'],
    parallel: false,
    retries: 1,
  },
};

/**
 * Test Execution Orchestration Functions
 */
export class TestOrchestrator {
  private suites: Map<string, TestSuiteConfig> = new Map();
  private results: Map<string, TestResult> = new Map();

  constructor() {
    Object.entries(TEST_SUITES).forEach(([key, config]) => {
      this.suites.set(key, config);
    });
  }

  /**
   * Get test execution order based on dependencies and priorities
   */
  getExecutionOrder(): string[] {
    const executed = new Set<string>();
    const order: string[] = [];

    const canExecute = (suiteId: string): boolean => {
      const suite = this.suites.get(suiteId);
      if (!suite) return false;
      return suite.dependencies.every((dep) => executed.has(dep));
    };

    while (executed.size < this.suites.size) {
      const available = Array.from(this.suites.keys())
        .filter((id) => !executed.has(id) && canExecute(id))
        .sort((a, b) => {
          const suiteA = this.suites.get(a)!;
          const suiteB = this.suites.get(b)!;

          // Sort by priority (critical > high > normal > low)
          const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
          return (
            priorityOrder[suiteB.priority] - priorityOrder[suiteA.priority]
          );
        });

      if (available.length === 0) {
        // Circular dependency or other issue
        const remaining = Array.from(this.suites.keys()).filter(
          (id) => !executed.has(id),
        );
        throw new Error(
          `Cannot resolve dependencies for test suites: ${remaining.join(', ')}`,
        );
      }

      const next = available[0];
      order.push(next);
      executed.add(next);
    }

    return order;
  }

  /**
   * Get test suite configuration
   */
  getSuiteConfig(suiteId: string): TestSuiteConfig | undefined {
    return this.suites.get(suiteId);
  }

  /**
   * Record test result
   */
  recordResult(suiteId: string, result: TestResult): void {
    this.results.set(suiteId, result);
  }

  /**
   * Get test results summary
   */
  getResultsSummary(): TestSummary {
    const results = Array.from(this.results.values());
    return {
      total: results.length,
      passed: results.filter((r) => r.status === 'passed').length,
      failed: results.filter((r) => r.status === 'failed').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
      results: Object.fromEntries(this.results.entries()),
    };
  }
}

export interface TestResult {
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  details?: Record<string, unknown>;
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  totalDuration: number;
  results: Record<string, TestResult>;
}

/**
 * Test Environment Validation
 */
export async function validateTestEnvironment(): Promise<boolean> {
  const requiredEnvVars = [
    'TASK_MANAGER_API_PATH',
    'INTEGRATION_TEST_FILE_DIR',
  ];

  const missing = requiredEnvVars.filter((env) => !process.env[env]);
  if (missing.length > 0) {
    console.error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
    return false;
  }

  // Validate task manager API exists
  const taskManagerPath = process.env.TASK_MANAGER_API_PATH!;
  try {
    const fs = await import('node:fs');
    await fs.promises.access(taskManagerPath);
  } catch {
    console.error(`Task Manager API not found at: ${taskManagerPath}`);
    return false;
  }

  // Ensure test directory exists
  const testDir = process.env.INTEGRATION_TEST_FILE_DIR!;
  try {
    const fs = await import('node:fs');
    await fs.promises.mkdir(testDir, { recursive: true });
  } catch {
    console.error(`Cannot create test directory: ${testDir}`);
    return false;
  }

  return true;
}

/**
 * Test Performance Monitoring
 */
export class TestPerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();

  recordMetric(testSuite: string, metric: PerformanceMetric): void {
    if (!this.metrics.has(testSuite)) {
      this.metrics.set(testSuite, []);
    }
    this.metrics.get(testSuite)!.push(metric);
  }

  getMetrics(testSuite?: string): PerformanceMetric[] {
    if (testSuite) {
      return this.metrics.get(testSuite) || [];
    }
    return Array.from(this.metrics.values()).flat();
  }

  generateReport(): PerformanceReport {
    const allMetrics = this.getMetrics();
    const suiteReports: Record<string, SuitePerformanceReport> = {};

    this.metrics.forEach((metrics, suite) => {
      const durations = metrics.map((m) => m.duration);
      const memoryUsage = metrics.map((m) => m.memoryUsage).filter(Boolean);

      suiteReports[suite] = {
        testCount: metrics.length,
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        maxDuration: Math.max(...durations),
        minDuration: Math.min(...durations),
        avgMemoryMB:
          memoryUsage.length > 0
            ? memoryUsage.reduce((a, b) => a! + b!, 0)! / memoryUsage.length
            : 0,
        maxMemoryMB:
          memoryUsage.length > 0
            ? Math.max(...(memoryUsage.filter(Boolean) as number[]))
            : 0,
      };
    });

    return {
      totalTests: allMetrics.length,
      overallDuration: allMetrics.reduce((sum, m) => sum + m.duration, 0),
      suites: suiteReports,
      generatedAt: new Date().toISOString(),
    };
  }
}

export interface PerformanceMetric {
  testName: string;
  duration: number;
  memoryUsage?: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface SuitePerformanceReport {
  testCount: number;
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
  avgMemoryMB: number;
  maxMemoryMB: number;
}

export interface PerformanceReport {
  totalTests: number;
  overallDuration: number;
  suites: Record<string, SuitePerformanceReport>;
  generatedAt: string;
}

/**
 * Default orchestrator instance
 */
export const testOrchestrator = new TestOrchestrator();
export const performanceMonitor = new TestPerformanceMonitor();
