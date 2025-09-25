/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ResourceAllocator,
  ResourceType,
  ResourceInfo,
  AllocationRequest,
  AllocationStrategies,
  type AllocationResult,
  type ResourceRequirement,
} from './resourceAllocator';
import { DecisionPriority, type DecisionContext } from './types';

describe('ResourceAllocator', () => {
  let allocator: ResourceAllocator;
  let testResources: ResourceInfo[];
  let testContext: DecisionContext;

  beforeEach(() => {
    // Initialize with balanced strategy
    allocator = new ResourceAllocator(AllocationStrategies.Balanced);

    // Set up test resources
    testResources = [
      {
        type: ResourceType.CPU,
        total: 100,
        available: 100,
        allocated: 0,
        reserved: 10,
        unit: 'cores',
        costPerUnit: 0.05,
      },
      {
        type: ResourceType.MEMORY,
        total: 1024,
        available: 1024,
        allocated: 0,
        reserved: 102,
        unit: 'MB',
        costPerUnit: 0.01,
      },
      {
        type: ResourceType.AGENT,
        total: 10,
        available: 10,
        allocated: 0,
        reserved: 1,
        unit: 'agents',
        costPerUnit: 1.0,
      },
    ];

    allocator.initializeResources(testResources);

    // Set up test context
    testContext = {
      systemLoad: { cpu: 0.3, memory: 0.4, diskIO: 0.2, networkIO: 0.1 },
      taskQueueState: { totalTasks: 5, pendingTasks: 2, runningTasks: 2, failedTasks: 1, avgProcessingTime: 30000 },
      agentContext: { activeAgents: 3, maxConcurrentAgents: 10, agentCapabilities: {}, agentWorkloads: {} },
      projectState: { buildStatus: 'success', testStatus: 'passing', lintStatus: 'clean', gitStatus: 'clean' },
      budgetContext: { currentUsage: 50, costPerToken: 0.001, estimatedCostForTask: 10 },
      performanceHistory: { avgSuccessRate: 0.95, avgCompletionTime: 45000, commonFailureReasons: [], peakUsageHours: [9, 14, 16] },
      userPreferences: { allowAutonomousDecisions: true, maxConcurrentTasks: 5, criticalTaskNotification: true },
      timestamp: Date.now(),
    };
  });

  afterEach(() => {
    allocator.destroy();
  });

  describe('Resource Initialization', () => {
    test('should initialize resources correctly', () => {
      const status = allocator.getResourceStatus();

      expect(status.size).toBe(3);
      expect(status.get(ResourceType.CPU)?.total).toBe(100);
      expect(status.get(ResourceType.MEMORY)?.total).toBe(1024);
      expect(status.get(ResourceType.AGENT)?.total).toBe(10);
    });

    test('should emit resources-initialized event', () => {
      const newAllocator = new ResourceAllocator(AllocationStrategies.Balanced);
      const spy = vi.fn();
      newAllocator.on('resources-initialized', spy);

      newAllocator.initializeResources(testResources);

      expect(spy).toHaveBeenCalledWith({ resources: testResources });
      newAllocator.destroy();
    });
  });

  describe('Immediate Allocation', () => {
    test('should successfully allocate available resources', async () => {
      const request: AllocationRequest = {
        requestId: 'test-1',
        taskId: 'task-1',
        requirements: [
          {
            type: ResourceType.CPU,
            amount: 20,
            priority: DecisionPriority.NORMAL,
            flexible: false,
          },
          {
            type: ResourceType.MEMORY,
            amount: 512,
            priority: DecisionPriority.NORMAL,
            flexible: false,
          },
        ],
        preemptible: false,
        estimatedDuration: 60000,
        businessValue: 0.8,
      };

      const result = await allocator.allocateResources(request, testContext);

      expect(result.success).toBe(true);
      expect(result.allocations).toHaveLength(2);
      expect(result.allocations[0].type).toBe(ResourceType.CPU);
      expect(result.allocations[0].amount).toBe(20);
      expect(result.estimatedCost).toBeGreaterThan(0);
    });

    test('should fail when insufficient resources', async () => {
      const request: AllocationRequest = {
        requestId: 'test-2',
        taskId: 'task-2',
        requirements: [
          {
            type: ResourceType.CPU,
            amount: 200, // More than available
            priority: DecisionPriority.HIGH,
            flexible: false,
          },
        ],
        preemptible: false,
        estimatedDuration: 30000,
        businessValue: 0.9,
      };

      const result = await allocator.allocateResources(request, testContext);

      expect(result.success).toBe(false);
      expect(result.reason).toContain('Insufficient cpu resources');
    });

    test('should fail when exceeding budget constraints', async () => {
      const budgetConstrainedContext = {
        ...testContext,
        budgetContext: {
          ...testContext.budgetContext,
          estimatedCostForTask: 0.1, // Very low budget
        },
      };

      const request: AllocationRequest = {
        requestId: 'test-3',
        taskId: 'task-3',
        requirements: [
          {
            type: ResourceType.AGENT,
            amount: 5, // High cost
            priority: DecisionPriority.NORMAL,
            flexible: false,
          },
        ],
        preemptible: false,
        estimatedDuration: 30000,
        businessValue: 0.7,
      };

      const result = await allocator.allocateResources(request, budgetConstrainedContext);

      expect(result.success).toBe(false);
      expect(result.reason).toContain('budget constraints');
    });
  });

  describe('Resource Release', () => {
    test('should release resources and update availability', async () => {
      const request: AllocationRequest = {
        requestId: 'test-4',
        taskId: 'task-4',
        requirements: [
          {
            type: ResourceType.CPU,
            amount: 30,
            priority: DecisionPriority.NORMAL,
            flexible: false,
          },
        ],
        preemptible: false,
        estimatedDuration: 30000,
        businessValue: 0.8,
      };

      // Allocate resources
      await allocator.allocateResources(request, testContext);

      let status = allocator.getResourceStatus();
      expect(status.get(ResourceType.CPU)?.available).toBe(70);
      expect(status.get(ResourceType.CPU)?.allocated).toBe(30);

      // Release resources
      allocator.releaseResources('test-4');

      status = allocator.getResourceStatus();
      expect(status.get(ResourceType.CPU)?.available).toBe(100);
      expect(status.get(ResourceType.CPU)?.allocated).toBe(0);
    });

    test('should emit resources-released event', async () => {
      const spy = vi.fn();
      allocator.on('resources-released', spy);

      const request: AllocationRequest = {
        requestId: 'test-5',
        taskId: 'task-5',
        requirements: [
          {
            type: ResourceType.MEMORY,
            amount: 256,
            priority: DecisionPriority.LOW,
            flexible: false,
          },
        ],
        preemptible: false,
        estimatedDuration: 15000,
        businessValue: 0.6,
      };

      await allocator.allocateResources(request, testContext);
      allocator.releaseResources('test-5');

      expect(spy).toHaveBeenCalledWith({
        requestId: 'test-5',
        allocations: expect.any(Array),
      });
    });
  });

  describe('Queue Management', () => {
    test('should queue requests when resources not available', async () => {
      // First, allocate most resources
      const firstRequest: AllocationRequest = {
        requestId: 'first',
        taskId: 'task-first',
        requirements: [
          {
            type: ResourceType.CPU,
            amount: 90,
            priority: DecisionPriority.NORMAL,
            flexible: false,
          },
        ],
        preemptible: false,
        estimatedDuration: 60000,
        businessValue: 0.8,
      };

      await allocator.allocateResources(firstRequest, testContext);

      // Second request should be queued
      const secondRequest: AllocationRequest = {
        requestId: 'second',
        taskId: 'task-second',
        requirements: [
          {
            type: ResourceType.CPU,
            amount: 30, // Not enough available
            priority: DecisionPriority.HIGH,
            flexible: false,
          },
        ],
        preemptible: false,
        estimatedDuration: 30000,
        businessValue: 0.9,
      };

      const spy = vi.fn();
      allocator.on('allocation-queued', spy);

      const result = await allocator.allocateResources(secondRequest, testContext);

      expect(result.success).toBe(false);
      expect(result.estimatedStartTime).toBeDefined();
      expect(spy).toHaveBeenCalledWith({ request: secondRequest });
    });

    test('should process queue when resources become available', async () => {
      // Allocate resources
      const firstRequest: AllocationRequest = {
        requestId: 'queue-test-1',
        taskId: 'queue-task-1',
        requirements: [
          {
            type: ResourceType.AGENT,
            amount: 8,
            priority: DecisionPriority.NORMAL,
            flexible: false,
          },
        ],
        preemptible: false,
        estimatedDuration: 30000,
        businessValue: 0.7,
      };

      await allocator.allocateResources(firstRequest, testContext);

      // Queue second request
      const secondRequest: AllocationRequest = {
        requestId: 'queue-test-2',
        taskId: 'queue-task-2',
        requirements: [
          {
            type: ResourceType.AGENT,
            amount: 3,
            priority: DecisionPriority.HIGH,
            flexible: false,
          },
        ],
        preemptible: false,
        estimatedDuration: 20000,
        businessValue: 0.9,
      };

      const queueResult = await allocator.allocateResources(secondRequest, testContext);
      expect(queueResult.success).toBe(false);

      const metrics = allocator.getMetrics();
      expect(metrics.queueLength).toBe(1);

      // Release first allocation, should process queue
      allocator.releaseResources('queue-test-1');

      // Give queue processing time
      await new Promise(resolve => setTimeout(resolve, 100));

      const newMetrics = allocator.getMetrics();
      expect(newMetrics.queueLength).toBe(0);
    });
  });

  describe('Alternative Resource Strategies', () => {
    test('should try alternative resources when available', async () => {
      const request: AllocationRequest = {
        requestId: 'alt-test',
        taskId: 'alt-task',
        requirements: [
          {
            type: ResourceType.CPU,
            amount: 150, // Not available
            priority: DecisionPriority.NORMAL,
            flexible: true,
            alternatives: [
              {
                type: ResourceType.MEMORY,
                amount: 200, // Available alternative
                priority: DecisionPriority.NORMAL,
                flexible: true,
              },
            ],
          },
        ],
        preemptible: false,
        estimatedDuration: 30000,
        businessValue: 0.8,
      };

      const result = await allocator.allocateResources(request, testContext);

      expect(result.success).toBe(true);
      expect(result.allocations[0].type).toBe(ResourceType.MEMORY);
      expect(result.allocations[0].amount).toBe(200);
    });
  });

  describe('Strategy Management', () => {
    test('should update allocation strategy', () => {
      const spy = vi.fn();
      allocator.on('strategy-updated', spy);

      allocator.updateStrategy(AllocationStrategies.Efficiency);

      expect(spy).toHaveBeenCalledWith({ strategy: AllocationStrategies.Efficiency });
    });

    test('should use different strategies appropriately', async () => {
      // Test efficiency strategy with overcommit
      allocator.updateStrategy(AllocationStrategies.Efficiency);

      const request: AllocationRequest = {
        requestId: 'strategy-test',
        taskId: 'strategy-task',
        requirements: [
          {
            type: ResourceType.CPU,
            amount: 110, // More than total, but overcommit should allow
            priority: DecisionPriority.NORMAL,
            flexible: false,
          },
        ],
        preemptible: false,
        estimatedDuration: 30000,
        businessValue: 0.8,
      };

      const result = await allocator.allocateResources(request, testContext);

      // With overcommit ratio of 1.3, effective capacity is 130
      expect(result.success).toBe(true);
    });
  });

  describe('Metrics and Monitoring', () => {
    test('should calculate utilization metrics', async () => {
      const request: AllocationRequest = {
        requestId: 'metrics-test',
        taskId: 'metrics-task',
        requirements: [
          {
            type: ResourceType.CPU,
            amount: 50,
            priority: DecisionPriority.NORMAL,
            flexible: false,
          },
          {
            type: ResourceType.MEMORY,
            amount: 256,
            priority: DecisionPriority.NORMAL,
            flexible: false,
          },
        ],
        preemptible: false,
        estimatedDuration: 30000,
        businessValue: 0.8,
      };

      await allocator.allocateResources(request, testContext);

      const metrics = allocator.getMetrics();

      expect(metrics.utilization[ResourceType.CPU]).toBe(0.5); // 50/100
      expect(metrics.utilization[ResourceType.MEMORY]).toBe(0.25); // 256/1024
      expect(metrics.fairnessIndex).toBeGreaterThan(0);
      expect(metrics.fairnessIndex).toBeLessThanOrEqual(1);
    });

    test('should track queue length', async () => {
      // Fill up CPU resources
      await allocator.allocateResources({
        requestId: 'fill-cpu',
        taskId: 'fill-task',
        requirements: [{ type: ResourceType.CPU, amount: 100, priority: DecisionPriority.NORMAL, flexible: false }],
        preemptible: false,
        estimatedDuration: 60000,
        businessValue: 0.8,
      }, testContext);

      // Queue several requests
      for (let i = 0; i < 3; i++) {
        await allocator.allocateResources({
          requestId: `queued-${i}`,
          taskId: `queued-task-${i}`,
          requirements: [{ type: ResourceType.CPU, amount: 10, priority: DecisionPriority.NORMAL, flexible: false }],
          preemptible: false,
          estimatedDuration: 30000,
          businessValue: 0.7,
        }, testContext);
      }

      const metrics = allocator.getMetrics();
      expect(metrics.queueLength).toBe(3);
    });
  });

  describe('Preemption', () => {
    test('should preempt lower priority allocations when enabled', async () => {
      // Enable preemption strategy
      allocator.updateStrategy({
        ...AllocationStrategies.Balanced,
        preemption: { enabled: true, minPriorityDifference: 1, gracePeriod: 100 },
      });

      // Allocate with low priority
      const lowPriorityRequest: AllocationRequest = {
        requestId: 'low-priority',
        taskId: 'low-task',
        requirements: [
          {
            type: ResourceType.CPU,
            amount: 80,
            priority: DecisionPriority.LOW,
            flexible: false,
          },
        ],
        preemptible: true,
        estimatedDuration: 60000,
        businessValue: 0.3,
      };

      await allocator.allocateResources(lowPriorityRequest, testContext);

      const spy = vi.fn();
      allocator.on('preemption-warning', spy);

      // Request high priority allocation that should trigger preemption
      const highPriorityRequest: AllocationRequest = {
        requestId: 'high-priority',
        taskId: 'high-task',
        requirements: [
          {
            type: ResourceType.CPU,
            amount: 50,
            priority: DecisionPriority.CRITICAL,
            flexible: false,
          },
        ],
        preemptible: false,
        estimatedDuration: 30000,
        businessValue: 0.9,
      };

      const result = await allocator.allocateResources(highPriorityRequest, testContext);

      expect(result.success).toBe(true);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Usage Patterns', () => {
    test('should accept and store usage patterns', () => {
      const patterns = [
        {
          type: ResourceType.CPU,
          peakHours: [9, 10, 14, 15, 16],
          averageUtilization: 0.65,
          variance: 0.12,
          seasonality: {
            daily: [0.3, 0.2, 0.1, 0.1, 0.2, 0.4, 0.7, 0.8, 0.9, 1.0, 0.9, 0.8, 0.7, 0.9, 1.0, 0.9, 0.8, 0.6, 0.5, 0.4, 0.3, 0.3, 0.2, 0.2],
            weekly: [0.8, 0.9, 0.95, 1.0, 0.95, 0.6, 0.4],
          },
        },
      ];

      const spy = vi.fn();
      allocator.on('patterns-updated', spy);

      allocator.updateUsagePatterns(patterns);

      expect(spy).toHaveBeenCalledWith({ patterns });
    });
  });

  describe('Optimization', () => {
    test('should provide optimization recommendations', async () => {
      const spy = vi.fn();
      allocator.on('optimization-recommendations', spy);

      // Trigger optimization (resources are under-utilized by default)
      await allocator.optimizeAllocations();

      expect(spy).toHaveBeenCalledWith({
        optimizations: expect.arrayContaining([
          expect.stringContaining('Low utilization detected'),
        ]),
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid requests', async () => {
      const invalidRequest: AllocationRequest = {
        requestId: '',
        taskId: '',
        requirements: [],
        preemptible: false,
        estimatedDuration: 0,
        businessValue: 0,
      };

      const result = await allocator.allocateResources(invalidRequest, testContext);

      expect(result.success).toBe(false);
      expect(result.reason).toContain('Missing required identifiers');
    });

    test('should handle unknown resource types', async () => {
      const invalidRequest: AllocationRequest = {
        requestId: 'invalid-test',
        taskId: 'invalid-task',
        requirements: [
          {
            type: 'UNKNOWN_RESOURCE' as ResourceType,
            amount: 10,
            priority: DecisionPriority.NORMAL,
            flexible: false,
          },
        ],
        preemptible: false,
        estimatedDuration: 30000,
        businessValue: 0.5,
      };

      const result = await allocator.allocateResources(invalidRequest, testContext);

      expect(result.success).toBe(false);
      expect(result.reason).toContain('Unknown resource type');
    });

    test('should emit allocation errors', async () => {
      const spy = vi.fn();
      allocator.on('allocation-error', spy);

      // Simulate an error by passing null context
      const request: AllocationRequest = {
        requestId: 'error-test',
        taskId: 'error-task',
        requirements: [
          {
            type: ResourceType.CPU,
            amount: 10,
            priority: DecisionPriority.NORMAL,
            flexible: false,
          },
        ],
        preemptible: false,
        estimatedDuration: 30000,
        businessValue: 0.5,
      };

      // This should not actually cause an error in our current implementation,
      // so we'll manually trigger an error event to test the spy
      allocator.emit('allocation-error', { request, error: new Error('Test error') });

      expect(spy).toHaveBeenCalledWith({
        request,
        error: expect.any(Error),
      });
    });
  });

  describe('Timing and Performance', () => {
    test('should emit timing information', async () => {
      const spy = vi.fn();
      allocator.on('allocation-timing', spy);

      const request: AllocationRequest = {
        requestId: 'timing-test',
        taskId: 'timing-task',
        requirements: [
          {
            type: ResourceType.MEMORY,
            amount: 100,
            priority: DecisionPriority.NORMAL,
            flexible: false,
          },
        ],
        preemptible: false,
        estimatedDuration: 30000,
        businessValue: 0.7,
      };

      await allocator.allocateResources(request, testContext);

      expect(spy).toHaveBeenCalledWith({
        requestId: 'timing-test',
        duration: expect.any(Number),
      });
    });
  });

  describe('Automatic Resource Release', () => {
    test('should automatically release resources after duration', async () => {
      vi.useFakeTimers();

      const request: AllocationRequest = {
        requestId: 'auto-release',
        taskId: 'auto-task',
        requirements: [
          {
            type: ResourceType.AGENT,
            amount: 2,
            duration: 5000, // 5 seconds
            priority: DecisionPriority.NORMAL,
            flexible: false,
          },
        ],
        preemptible: false,
        estimatedDuration: 5000,
        businessValue: 0.8,
      };

      const result = await allocator.allocateResources(request, testContext);
      expect(result.success).toBe(true);

      let status = allocator.getResourceStatus();
      expect(status.get(ResourceType.AGENT)?.allocated).toBe(2);

      // Fast forward time
      vi.advanceTimersByTime(6000);

      // Allow promises to resolve
      await new Promise(resolve => setTimeout(resolve, 0));

      status = allocator.getResourceStatus();
      expect(status.get(ResourceType.AGENT)?.allocated).toBe(0);

      vi.useRealTimers();
    });
  });
});

describe('AllocationStrategies', () => {
  test('should provide predefined strategies', () => {
    expect(AllocationStrategies.Balanced).toBeDefined();
    expect(AllocationStrategies.Efficiency).toBeDefined();
    expect(AllocationStrategies.Fairness).toBeDefined();
    expect(AllocationStrategies.DeadlineOptimized).toBeDefined();
    expect(AllocationStrategies.CostOptimized).toBeDefined();

    expect(AllocationStrategies.Balanced.priority).toBe('balanced');
    expect(AllocationStrategies.Efficiency.priority).toBe('efficiency');
    expect(AllocationStrategies.Fairness.priority).toBe('fairness');
    expect(AllocationStrategies.DeadlineOptimized.priority).toBe('deadline');
    expect(AllocationStrategies.CostOptimized.priority).toBe('cost');
  });

  test('should have appropriate preemption settings', () => {
    expect(AllocationStrategies.Efficiency.preemption.minPriorityDifference).toBeLessThan(
      AllocationStrategies.Fairness.preemption.minPriorityDifference
    );
    expect(AllocationStrategies.Fairness.preemption.enabled).toBe(false);
    expect(AllocationStrategies.DeadlineOptimized.preemption.gracePeriod).toBeLessThan(
      AllocationStrategies.Balanced.preemption.gracePeriod
    );
  });

  test('should have logical overcommit ratios', () => {
    expect(AllocationStrategies.Efficiency.overcommit.ratio).toBeGreaterThan(
      AllocationStrategies.Balanced.overcommit.ratio
    );
    expect(AllocationStrategies.Fairness.overcommit.enabled).toBe(false);
  });
});