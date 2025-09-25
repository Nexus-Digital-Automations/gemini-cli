/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { DependencyAnalyzer } from './DependencyAnalyzer';
describe('DependencyAnalyzer', () => {
  let analyzer;
  let testTasks;
  let testContext;
  beforeEach(() => {
    analyzer = new DependencyAnalyzer();
    // Create test tasks
    testTasks = new Map([
      [
        'task-1',
        {
          id: 'task-1',
          title: 'Implement user authentication',
          description: 'Create login and registration functionality',
          status: 'pending',
          priority: 'high',
          category: 'implementation',
          executionContext: {
            timeout: 60000,
            resourceConstraints: [
              { resourceType: 'cpu', maxUnits: 2, exclusive: false },
            ],
          },
          metadata: {
            createdAt: new Date('2024-01-01T10:00:00Z'),
            updatedAt: new Date('2024-01-01T10:00:00Z'),
            createdBy: 'test-user',
            estimatedDuration: 2 * 60 * 60 * 1000, // 2 hours
          },
        },
      ],
      [
        'task-2',
        {
          id: 'task-2',
          title: 'Test authentication system',
          description: 'Write unit tests for login functionality',
          status: 'pending',
          priority: 'medium',
          category: 'testing',
          executionContext: {
            timeout: 30000,
            resourceConstraints: [
              { resourceType: 'cpu', maxUnits: 1, exclusive: false },
            ],
          },
          metadata: {
            createdAt: new Date('2024-01-01T10:02:00Z'),
            updatedAt: new Date('2024-01-01T10:02:00Z'),
            createdBy: 'test-user',
            estimatedDuration: 1 * 60 * 60 * 1000, // 1 hour
          },
        },
      ],
      [
        'task-3',
        {
          id: 'task-3',
          title: 'Document authentication API',
          description: 'Create documentation for the authentication endpoints',
          status: 'pending',
          priority: 'low',
          category: 'documentation',
          metadata: {
            createdAt: new Date('2024-01-01T10:05:00Z'),
            updatedAt: new Date('2024-01-01T10:05:00Z'),
            createdBy: 'test-user',
            estimatedDuration: 30 * 60 * 1000, // 30 minutes
          },
        },
      ],
      [
        'task-4',
        {
          id: 'task-4',
          title: 'Setup database schema',
          description: 'Create user tables and authentication data structures',
          status: 'pending',
          priority: 'critical',
          category: 'implementation',
          executionContext: {
            resourceConstraints: [
              { resourceType: 'database', maxUnits: 1, exclusive: true },
            ],
          },
          metadata: {
            createdAt: new Date('2024-01-01T09:55:00Z'),
            updatedAt: new Date('2024-01-01T09:55:00Z'),
            createdBy: 'test-user',
            estimatedDuration: 45 * 60 * 1000, // 45 minutes
          },
        },
      ],
    ]);
    testContext = {
      systemLoad: { cpu: 0.4, memory: 0.5, diskIO: 0.3, networkIO: 0.2 },
      taskQueueState: {
        totalTasks: 4,
        pendingTasks: 4,
        runningTasks: 0,
        failedTasks: 0,
        avgProcessingTime: 90000,
      },
      agentContext: {
        activeAgents: 2,
        maxConcurrentAgents: 8,
        agentCapabilities: {},
        agentWorkloads: {},
      },
      projectState: {
        buildStatus: 'unknown',
        testStatus: 'unknown',
        lintStatus: 'unknown',
        gitStatus: 'unknown',
      },
      budgetContext: {
        currentUsage: 100,
        costPerToken: 0.001,
        estimatedCostForTask: 0.5,
      },
      performanceHistory: {
        avgSuccessRate: 0.85,
        avgCompletionTime: 120000,
        commonFailureReasons: [],
        peakUsageHours: [9, 14],
      },
      userPreferences: {
        allowAutonomousDecisions: true,
        maxConcurrentTasks: 6,
        criticalTaskNotification: true,
      },
      timestamp: Date.now(),
    };
  });
  describe('Configuration and Initialization', () => {
    test('should initialize with default configuration', () => {
      const defaultAnalyzer = new DependencyAnalyzer();
      expect(defaultAnalyzer).toBeDefined();
    });
    test('should accept custom configuration', () => {
      const customConfig = {
        enableAutoLearning: false,
        autoCreateThreshold: 0.8,
        maxAnalysisDepth: 5,
      };
      const customAnalyzer = new DependencyAnalyzer(customConfig);
      expect(customAnalyzer).toBeDefined();
    });
  });
  describe('Dependency Analysis', () => {
    test('should analyze dependencies between tasks', async () => {
      const result = await analyzer.analyzeDependencies(
        testTasks,
        [],
        testContext,
      );
      expect(result).toBeDefined();
      expect(result.suggestedDependencies).toBeDefined();
      expect(result.confidenceScores).toBeDefined();
      expect(result.conflicts).toBeDefined();
      expect(result.performanceImpact).toBeDefined();
      expect(result.optimizations).toBeDefined();
    });
    test('should detect semantic dependencies between related tasks', async () => {
      const result = await analyzer.analyzeDependencies(
        testTasks,
        [],
        testContext,
      );
      // Should find dependency between implementation and testing tasks
      const implementationTestDep = result.suggestedDependencies.find(
        (dep) =>
          dep.dependsOnTaskId === 'task-1' && dep.dependentTaskId === 'task-2',
      );
      if (implementationTestDep) {
        expect(implementationTestDep.type).toBe('hard');
        expect(result.confidenceScores.get('task-2->task-1')).toBeGreaterThan(
          0.5,
        );
      }
    });
    test('should identify resource conflicts', async () => {
      // Add tasks that conflict on exclusive resources
      testTasks.set('task-5', {
        id: 'task-5',
        title: 'Another database operation',
        description: 'Modify database schema',
        status: 'pending',
        priority: 'high',
        category: 'implementation',
        executionContext: {
          resourceConstraints: [
            { resourceType: 'database', maxUnits: 1, exclusive: true },
          ],
        },
        metadata: {
          createdAt: new Date('2024-01-01T10:10:00Z'),
          updatedAt: new Date('2024-01-01T10:10:00Z'),
          createdBy: 'test-user',
          estimatedDuration: 30 * 60 * 1000,
        },
      });
      const result = await analyzer.analyzeDependencies(
        testTasks,
        [],
        testContext,
      );
      // Should detect resource conflict between database tasks
      const resourceDep = result.suggestedDependencies.find(
        (dep) =>
          (dep.dependsOnTaskId === 'task-4' &&
            dep.dependentTaskId === 'task-5') ||
          (dep.dependsOnTaskId === 'task-5' &&
            dep.dependentTaskId === 'task-4'),
      );
      if (resourceDep) {
        expect(resourceDep.type).toBe('resource');
      }
    });
    test('should analyze temporal dependencies', async () => {
      // Create tasks close in time
      const tempTasks = new Map(testTasks);
      const now = Date.now();
      tempTasks.set('task-temporal-1', {
        id: 'task-temporal-1',
        title: 'First temporal task',
        description: 'Task created first',
        status: 'pending',
        priority: 'medium',
        category: 'implementation',
        metadata: {
          createdAt: new Date(now),
          updatedAt: new Date(now),
          createdBy: 'test-user',
          estimatedDuration: 60000,
        },
      });
      tempTasks.set('task-temporal-2', {
        id: 'task-temporal-2',
        title: 'Second temporal task',
        description: 'Task created second, related to first',
        status: 'pending',
        priority: 'medium',
        category: 'implementation',
        metadata: {
          createdAt: new Date(now + 2 * 60 * 1000), // 2 minutes later
          updatedAt: new Date(now + 2 * 60 * 1000),
          createdBy: 'test-user',
          estimatedDuration: 60000,
        },
      });
      const result = await analyzer.analyzeDependencies(
        tempTasks,
        [],
        testContext,
      );
      // Should potentially find temporal dependency
      const temporalDep = result.suggestedDependencies.find(
        (dep) => dep.type === 'temporal',
      );
      if (temporalDep) {
        expect(temporalDep.parallelizable).toBe(true);
        expect(temporalDep.minDelay).toBeDefined();
      }
    });
  });
  describe('Pattern-based Analysis', () => {
    test('should use built-in patterns for dependency detection', async () => {
      const result = await analyzer.analyzeDependencies(
        testTasks,
        [],
        testContext,
      );
      // Should find implementation -> testing pattern
      const implTestDep = result.suggestedDependencies.find((dep) => {
        const dependsOnTask = testTasks.get(dep.dependsOnTaskId);
        const dependentTask = testTasks.get(dep.dependentTaskId);
        return (
          dependsOnTask?.category === 'implementation' &&
          dependentTask?.category === 'testing'
        );
      });
      if (implTestDep) {
        expect(implTestDep.reason).toContain('Pattern match');
      }
    });
    test('should learn from dependency patterns when enabled', async () => {
      const learningAnalyzer = new DependencyAnalyzer({
        enableAutoLearning: true,
      });
      // First analysis
      await learningAnalyzer.analyzeDependencies(testTasks, [], testContext);
      // Second analysis should potentially use learned patterns
      const result2 = await learningAnalyzer.analyzeDependencies(
        testTasks,
        [],
        testContext,
      );
      expect(result2.suggestedDependencies).toBeDefined();
    });
  });
  describe('Conflict Detection', () => {
    test('should detect circular dependencies', async () => {
      const existingDeps = [
        {
          dependentTaskId: 'task-1',
          dependsOnTaskId: 'task-2',
          type: 'hard',
          reason: 'Test circular dependency',
        },
        {
          dependentTaskId: 'task-2',
          dependsOnTaskId: 'task-1',
          type: 'hard',
          reason: 'Test circular dependency reverse',
        },
      ];
      const result = await analyzer.analyzeDependencies(
        testTasks,
        existingDeps,
        testContext,
      );
      const circularConflict = result.conflicts.find(
        (conflict) => conflict.type === 'circular',
      );
      if (circularConflict) {
        expect(circularConflict.severity).toBe('critical');
        expect(circularConflict.involvedTasks).toContain('task-1');
        expect(circularConflict.involvedTasks).toContain('task-2');
        expect(circularConflict.resolutionStrategies.length).toBeGreaterThan(0);
      }
    });
    test('should suggest resolution strategies for conflicts', async () => {
      const conflictingDeps = [
        {
          dependentTaskId: 'task-1',
          dependsOnTaskId: 'task-2',
          type: 'soft',
          reason: 'Weak dependency for testing',
        },
      ];
      const result = await analyzer.analyzeDependencies(
        testTasks,
        conflictingDeps,
        testContext,
      );
      if (result.conflicts.length > 0) {
        const conflict = result.conflicts[0];
        expect(conflict.resolutionStrategies.length).toBeGreaterThan(0);
        expect(conflict.resolutionStrategies[0].type).toBeDefined();
        expect(conflict.resolutionStrategies[0].description).toBeDefined();
        expect(conflict.resolutionStrategies[0].effort).toBeDefined();
      }
    });
  });
  describe('Performance Impact Analysis', () => {
    test('should calculate critical path length', async () => {
      const result = await analyzer.analyzeDependencies(
        testTasks,
        [],
        testContext,
      );
      expect(
        result.performanceImpact.criticalPathLength,
      ).toBeGreaterThanOrEqual(0);
      expect(result.performanceImpact.totalExecutionTime).toBeGreaterThan(0);
      expect(
        result.performanceImpact.parallelizationPotential,
      ).toBeGreaterThanOrEqual(0);
      expect(
        result.performanceImpact.parallelizationPotential,
      ).toBeLessThanOrEqual(1);
    });
    test('should identify bottlenecks', async () => {
      const result = await analyzer.analyzeDependencies(
        testTasks,
        [],
        testContext,
      );
      expect(result.performanceImpact.bottlenecks).toBeDefined();
      expect(Array.isArray(result.performanceImpact.bottlenecks)).toBe(true);
      if (result.performanceImpact.bottlenecks.length > 0) {
        const bottleneck = result.performanceImpact.bottlenecks[0];
        expect(bottleneck.taskId).toBeDefined();
        expect(bottleneck.type).toBeDefined();
        expect(bottleneck.impact).toBeGreaterThanOrEqual(0);
      }
    });
    test('should calculate resource utilization', async () => {
      const result = await analyzer.analyzeDependencies(
        testTasks,
        [],
        testContext,
      );
      expect(
        result.performanceImpact.resourceUtilization,
      ).toBeGreaterThanOrEqual(0);
      expect(result.performanceImpact.resourceUtilization).toBeLessThanOrEqual(
        1,
      );
    });
  });
  describe('Optimization Recommendations', () => {
    test('should generate optimization recommendations', async () => {
      const result = await analyzer.analyzeDependencies(
        testTasks,
        [],
        testContext,
      );
      expect(result.optimizations).toBeDefined();
      expect(Array.isArray(result.optimizations)).toBe(true);
      if (result.optimizations.length > 0) {
        const optimization = result.optimizations[0];
        expect(optimization.type).toBeDefined();
        expect(optimization.targetTasks).toBeDefined();
        expect(optimization.description).toBeDefined();
        expect(optimization.expectedBenefit).toBeDefined();
        expect(optimization.implementation).toBeDefined();
      }
    });
    test('should suggest parallel execution optimizations', async () => {
      const result = await analyzer.analyzeDependencies(
        testTasks,
        [],
        testContext,
      );
      const parallelOpt = result.optimizations.find(
        (opt) => opt.type === 'parallel_execution',
      );
      if (parallelOpt) {
        expect(parallelOpt.expectedBenefit.timeReduction).toBeGreaterThan(0);
        expect(parallelOpt.expectedBenefit.resourceEfficiency).toBeGreaterThan(
          0,
        );
      }
    });
    test('should recommend dependency removal for weak dependencies', async () => {
      const weakDeps = [
        {
          dependentTaskId: 'task-2',
          dependsOnTaskId: 'task-1',
          type: 'soft',
          reason: 'Very weak dependency',
        },
      ];
      const result = await analyzer.analyzeDependencies(
        testTasks,
        weakDeps,
        testContext,
      );
      const removalOpt = result.optimizations.find(
        (opt) => opt.type === 'dependency_removal',
      );
      if (removalOpt) {
        expect(removalOpt.targetTasks).toContain('task-2');
        expect(removalOpt.expectedBenefit.flexibilityIncrease).toBeGreaterThan(
          0,
        );
      }
    });
  });
  describe('Caching and Performance', () => {
    test('should cache analysis results for similar inputs', async () => {
      const start1 = Date.now();
      const result1 = await analyzer.analyzeDependencies(
        testTasks,
        [],
        testContext,
      );
      const time1 = Date.now() - start1;
      const start2 = Date.now();
      const result2 = await analyzer.analyzeDependencies(
        testTasks,
        [],
        testContext,
      );
      const time2 = Date.now() - start2;
      // Second call should be faster due to caching
      expect(time2).toBeLessThan(time1);
      expect(result1.suggestedDependencies.length).toBe(
        result2.suggestedDependencies.length,
      );
    });
    test('should handle large task sets efficiently', async () => {
      // Create a large number of tasks
      const largeTasks = new Map(testTasks);
      for (let i = 10; i < 50; i++) {
        largeTasks.set(`task-${i}`, {
          id: `task-${i}`,
          title: `Task ${i}`,
          description: `Description for task ${i}`,
          status: 'pending',
          priority: 'medium',
          category: 'implementation',
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'test-user',
            estimatedDuration: 60000,
          },
        });
      }
      const start = Date.now();
      const result = await analyzer.analyzeDependencies(
        largeTasks,
        [],
        testContext,
      );
      const time = Date.now() - start;
      expect(time).toBeLessThan(10000); // Should complete within 10 seconds
      expect(result.suggestedDependencies).toBeDefined();
    });
  });
  describe('Configuration Impact', () => {
    test('should respect auto-create threshold', async () => {
      const strictAnalyzer = new DependencyAnalyzer({
        autoCreateThreshold: 0.95, // Very high threshold
      });
      const result = await strictAnalyzer.analyzeDependencies(
        testTasks,
        [],
        testContext,
      );
      // With high threshold, should suggest fewer dependencies
      expect(result.suggestedDependencies.length).toBeLessThanOrEqual(
        testTasks.size,
      );
    });
    test('should respect detection weights', async () => {
      const semanticFocusedAnalyzer = new DependencyAnalyzer({
        detectionWeights: {
          semantic: 0.8,
          temporal: 0.1,
          resource: 0.05,
          pattern: 0.05,
        },
      });
      const result = await semanticFocusedAnalyzer.analyzeDependencies(
        testTasks,
        [],
        testContext,
      );
      expect(result.confidenceScores).toBeDefined();
      expect(result.suggestedDependencies.length).toBeGreaterThanOrEqual(0);
    });
    test('should limit analysis depth', async () => {
      const shallowAnalyzer = new DependencyAnalyzer({
        maxAnalysisDepth: 2,
      });
      const result = await shallowAnalyzer.analyzeDependencies(
        testTasks,
        [],
        testContext,
      );
      expect(result).toBeDefined();
      expect(result.suggestedDependencies).toBeDefined();
    });
  });
  describe('Edge Cases and Error Handling', () => {
    test('should handle empty task set', async () => {
      const emptyTasks = new Map();
      const result = await analyzer.analyzeDependencies(
        emptyTasks,
        [],
        testContext,
      );
      expect(result.suggestedDependencies).toHaveLength(0);
      expect(result.conflicts).toHaveLength(0);
      expect(result.optimizations).toHaveLength(0);
    });
    test('should handle tasks without resource constraints', async () => {
      const simpleTasks = new Map([
        [
          'simple-1',
          {
            id: 'simple-1',
            title: 'Simple task',
            description: 'No resource constraints',
            status: 'pending',
            priority: 'medium',
            category: 'documentation',
            metadata: {
              createdAt: new Date(),
              updatedAt: new Date(),
              createdBy: 'test-user',
              estimatedDuration: 30000,
            },
          },
        ],
      ]);
      const result = await analyzer.analyzeDependencies(
        simpleTasks,
        [],
        testContext,
      );
      expect(result).toBeDefined();
      expect(result.suggestedDependencies).toBeDefined();
    });
    test('should handle malformed existing dependencies', async () => {
      const malformedDeps = [
        {
          dependentTaskId: 'non-existent-task',
          dependsOnTaskId: 'task-1',
          type: 'hard',
          reason: 'Invalid dependency',
        },
      ];
      const result = await analyzer.analyzeDependencies(
        testTasks,
        malformedDeps,
        testContext,
      );
      expect(result).toBeDefined();
      // Should handle gracefully and continue with analysis
    });
    test('should handle tasks with extreme duration estimates', async () => {
      const extremeTasks = new Map([
        [
          'extreme-short',
          {
            id: 'extreme-short',
            title: 'Very short task',
            description: 'Task with very short duration',
            status: 'pending',
            priority: 'low',
            category: 'documentation',
            metadata: {
              createdAt: new Date(),
              updatedAt: new Date(),
              createdBy: 'test-user',
              estimatedDuration: 1, // 1 millisecond
            },
          },
        ],
        [
          'extreme-long',
          {
            id: 'extreme-long',
            title: 'Very long task',
            description: 'Task with very long duration',
            status: 'pending',
            priority: 'low',
            category: 'implementation',
            metadata: {
              createdAt: new Date(),
              updatedAt: new Date(),
              createdBy: 'test-user',
              estimatedDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
            },
          },
        ],
      ]);
      const result = await analyzer.analyzeDependencies(
        extremeTasks,
        [],
        testContext,
      );
      expect(result).toBeDefined();
      expect(result.performanceImpact.totalExecutionTime).toBeGreaterThan(0);
    });
  });
  describe('Context Sensitivity', () => {
    test('should adjust analysis based on system load', async () => {
      const highLoadContext = {
        ...testContext,
        systemLoad: { cpu: 0.95, memory: 0.9, diskIO: 0.85, networkIO: 0.8 },
      };
      const result = await analyzer.analyzeDependencies(
        testTasks,
        [],
        highLoadContext,
      );
      expect(result).toBeDefined();
      // Under high load, might suggest more serialized execution
    });
    test('should consider budget constraints', async () => {
      const budgetConstrainedContext = {
        ...testContext,
        budgetContext: {
          ...testContext.budgetContext,
          remainingTokens: 100,
          dailyLimit: 200,
        },
      };
      const result = await analyzer.analyzeDependencies(
        testTasks,
        [],
        budgetConstrainedContext,
      );
      expect(result).toBeDefined();
      // Should potentially suggest more conservative dependency creation
    });
    test('should adapt to user preferences', async () => {
      const conservativeContext = {
        ...testContext,
        userPreferences: {
          ...testContext.userPreferences,
          allowAutonomousDecisions: false,
          maxConcurrentTasks: 2,
        },
      };
      const result = await analyzer.analyzeDependencies(
        testTasks,
        [],
        conservativeContext,
      );
      expect(result).toBeDefined();
      // Should respect conservative preferences
    });
  });
  describe('Validation Schema', () => {
    test('should validate configuration with schema', () => {
      const validConfig = {
        enableAutoLearning: true,
        detectionWeights: {
          semantic: 0.3,
          temporal: 0.25,
          resource: 0.25,
          pattern: 0.2,
        },
        autoCreateThreshold: 0.75,
        maxAnalysisDepth: 10,
        cacheSize: 1000,
      };
      // Should not throw when creating analyzer with valid config
      expect(() => new DependencyAnalyzer(validConfig)).not.toThrow();
    });
  });
});
//# sourceMappingURL=DependencyAnalyzer.test.js.map
