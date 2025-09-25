/**
 * Infinite Loop Detection and Prevention Test Suite
 *
 * Critical safety tests to ensure the task management system cannot
 * enter infinite loops or unbounded recursive operations that could
 * crash or hang the system.
 *
 * Safety mechanisms tested:
 * - Circular dependency detection
 * - Recursive operation limits
 * - Runaway process prevention
 * - Memory leak protection
 * - Timeout enforcement
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  TaskFactories,
  MockTaskStore,
  TestUtilities,
  PerformanceMetrics,
  SafetyMonitor,
} from './utils/TestFactories';
describe('Infinite Loop Protection System', () => {
  let taskStore;
  let performanceMetrics;
  let safetyMonitor;
  beforeEach(() => {
    taskStore = new MockTaskStore();
    performanceMetrics = new PerformanceMetrics();
    safetyMonitor = new SafetyMonitor();
    vi.clearAllMocks();
  });
  afterEach(() => {
    performanceMetrics.stop();
    safetyMonitor.shutdown();
  });
  describe('Circular Dependency Detection', () => {
    it('should detect simple circular dependencies', async () => {
      // A -> B -> A
      const taskA = TaskFactories.createTask({
        id: 'task-a',
        dependencies: ['task-b'],
      });
      const taskB = TaskFactories.createTask({
        id: 'task-b',
        dependencies: ['task-a'],
      });
      await taskStore.addTask(taskA);
      await taskStore.addTask(taskB);
      const circularCheck = taskStore.detectCircularDependencies();
      expect(circularCheck.hasCircularDependencies).toBe(true);
      expect(circularCheck.cycles).toHaveLength(1);
      expect(circularCheck.cycles[0].path).toEqual([
        'task-a',
        'task-b',
        'task-a',
      ]);
    });
    it('should detect complex multi-node circular dependencies', async () => {
      // A -> B -> C -> D -> E -> B (5-node cycle)
      const tasks = [
        { id: 'task-a', deps: ['task-b'] },
        { id: 'task-b', deps: ['task-c'] },
        { id: 'task-c', deps: ['task-d'] },
        { id: 'task-d', deps: ['task-e'] },
        { id: 'task-e', deps: ['task-b'] }, // Creates cycle
      ].map(({ id, deps }) =>
        TaskFactories.createTask({ id, dependencies: deps }),
      );
      await Promise.all(tasks.map((task) => taskStore.addTask(task)));
      const circularCheck = taskStore.detectCircularDependencies();
      expect(circularCheck.hasCircularDependencies).toBe(true);
      expect(circularCheck.cycles[0].path).toContain('task-b');
      expect(circularCheck.cycles[0].path).toContain('task-e');
      expect(circularCheck.cycles[0].length).toBe(4); // B -> C -> D -> E -> B
    });
    it('should detect self-referencing tasks', async () => {
      const selfReferencingTask = TaskFactories.createTask({
        id: 'self-ref-task',
        dependencies: ['self-ref-task'], // References itself
      });
      await taskStore.addTask(selfReferencingTask);
      const circularCheck = taskStore.detectCircularDependencies();
      expect(circularCheck.hasCircularDependencies).toBe(true);
      expect(circularCheck.cycles[0].path).toEqual([
        'self-ref-task',
        'self-ref-task',
      ]);
      expect(circularCheck.cycles[0].type).toBe('self_reference');
    });
    it('should handle multiple independent cycles', async () => {
      // Cycle 1: A -> B -> A
      // Cycle 2: C -> D -> E -> C
      const cycle1Tasks = [
        TaskFactories.createTask({ id: 'a1', dependencies: ['b1'] }),
        TaskFactories.createTask({ id: 'b1', dependencies: ['a1'] }),
      ];
      const cycle2Tasks = [
        TaskFactories.createTask({ id: 'c2', dependencies: ['d2'] }),
        TaskFactories.createTask({ id: 'd2', dependencies: ['e2'] }),
        TaskFactories.createTask({ id: 'e2', dependencies: ['c2'] }),
      ];
      const allTasks = [...cycle1Tasks, ...cycle2Tasks];
      await Promise.all(allTasks.map((task) => taskStore.addTask(task)));
      const circularCheck = taskStore.detectCircularDependencies();
      expect(circularCheck.hasCircularDependencies).toBe(true);
      expect(circularCheck.cycles).toHaveLength(2);
      expect(circularCheck.totalCycleNodes).toBe(5);
    });
    it('should prevent execution of tasks with circular dependencies', async () => {
      const taskA = TaskFactories.createTask({
        id: 'circular-a',
        dependencies: ['circular-b'],
      });
      const taskB = TaskFactories.createTask({
        id: 'circular-b',
        dependencies: ['circular-a'],
      });
      await taskStore.addTask(taskA);
      await taskStore.addTask(taskB);
      // Attempt to execute should fail with circular dependency error
      await expect(taskStore.executeTask('circular-a')).rejects.toThrow(
        'Cannot execute task with circular dependencies',
      );
      const taskStatus = await taskStore.getTask('circular-a');
      expect(taskStatus?.status).toBe('blocked');
      expect(taskStatus?.blockingReason).toBe('circular_dependency');
    });
  });
  describe('Recursive Operation Limits', () => {
    it('should limit maximum recursion depth in dependency resolution', async () => {
      // Create deep chain exceeding recursion limit
      const maxDepth = taskStore.getMaxRecursionDepth();
      const deepChainTasks = [];
      for (let i = 0; i <= maxDepth + 10; i++) {
        const dependencies = i > 0 ? [`deep-task-${i - 1}`] : [];
        deepChainTasks.push(
          TaskFactories.createTask({
            id: `deep-task-${i}`,
            dependencies,
          }),
        );
      }
      await Promise.all(deepChainTasks.map((task) => taskStore.addTask(task)));
      const resolutionResult = await taskStore.resolveDependencies(
        `deep-task-${maxDepth + 10}`,
      );
      expect(resolutionResult.success).toBe(false);
      expect(resolutionResult.error).toContain(
        'Maximum recursion depth exceeded',
      );
      expect(resolutionResult.maxDepthReached).toBe(maxDepth);
    });
    it('should limit recursive task spawning', async () => {
      let spawnCount = 0;
      const maxSpawnLimit = 100;
      const recursiveTask = TaskFactories.createTask({
        id: 'recursive-spawner',
        executionConfig: {
          onComplete: () => {
            spawnCount++;
            if (spawnCount < 1000) {
              // Try to create 1000 tasks
              return TaskFactories.createTask({
                id: `spawned-task-${spawnCount}`,
                executionConfig: {
                  onComplete: recursiveTask.executionConfig?.onComplete,
                },
              });
            }
            return null;
          },
        },
      });
      safetyMonitor.setSpawnLimit(maxSpawnLimit);
      await taskStore.addTask(recursiveTask);
      const executionResult = await taskStore.executeTask('recursive-spawner');
      expect(executionResult.success).toBe(true);
      expect(spawnCount).toBeLessThanOrEqual(maxSpawnLimit);
      expect(executionResult.spawnLimitReached).toBe(true);
    });
    it('should prevent infinite retry loops', async () => {
      const flakyTask = TaskFactories.createTask({
        id: 'always-failing-task',
        executionConfig: {
          shouldFail: true,
          autoRetry: true,
          maxRetries: Number.MAX_SAFE_INTEGER, // Attempt infinite retries
        },
      });
      await taskStore.addTask(flakyTask);
      const maxRetries = taskStore.getMaxRetryLimit();
      const executionResult = await taskStore.executeTask(
        'always-failing-task',
      );
      expect(executionResult.success).toBe(false);
      expect(executionResult.retryAttempts).toBe(maxRetries);
      expect(executionResult.terminationReason).toBe('max_retries_exceeded');
    });
    it('should limit callback chain depth', async () => {
      let callbackDepth = 0;
      const maxCallbackDepth = 50;
      const createNestedCallback = (depth) => {
        return () => {
          callbackDepth = Math.max(callbackDepth, depth);
          if (depth < 1000) {
            // Try to create deep callback chain
            return createNestedCallback(depth + 1)();
          }
        };
      };
      const callbackTask = TaskFactories.createTask({
        id: 'callback-chain-task',
        executionConfig: {
          onComplete: createNestedCallback(1),
        },
      });
      safetyMonitor.setCallbackDepthLimit(maxCallbackDepth);
      await taskStore.addTask(callbackTask);
      const executionResult = await taskStore.executeTask(
        'callback-chain-task',
      );
      expect(executionResult.success).toBe(true);
      expect(callbackDepth).toBeLessThanOrEqual(maxCallbackDepth);
      expect(executionResult.callbackDepthLimitReached).toBe(true);
    });
  });
  describe('Runaway Process Prevention', () => {
    it('should detect and terminate infinite loops in task execution', async () => {
      const infiniteLoopTask = TaskFactories.createTask({
        id: 'infinite-loop-task',
        executionConfig: {
          simulateInfiniteLoop: true,
          loopDetection: true,
        },
        maxExecutionTime: 5000, // 5 seconds max
      });
      await taskStore.addTask(infiniteLoopTask);
      const executionStart = Date.now();
      const executionResult = await taskStore.executeTask('infinite-loop-task');
      const executionTime = Date.now() - executionStart;
      expect(executionResult.success).toBe(false);
      expect(executionResult.terminationReason).toBe('infinite_loop_detected');
      expect(executionTime).toBeLessThan(10000); // Should terminate quickly
    });
    it('should prevent CPU-bound infinite loops', async () => {
      const cpuInfiniteTask = TaskFactories.createTask({
        id: 'cpu-infinite-task',
        executionConfig: {
          cpuIntensive: true,
          simulateInfiniteLoop: true,
        },
      });
      await taskStore.addTask(cpuInfiniteTask);
      safetyMonitor.enableCPUMonitoring({
        maxCPUTime: 3000, // 3 seconds max CPU time
        samplingInterval: 100, // Check every 100ms
      });
      const executionResult = await taskStore.executeTask('cpu-infinite-task');
      expect(executionResult.success).toBe(false);
      expect(executionResult.terminationReason).toBe('cpu_time_exceeded');
      expect(safetyMonitor.getCPUUsage()).toBeLessThan(100); // Should be terminated
    });
    it('should detect memory-consuming infinite loops', async () => {
      const memoryLeakTask = TaskFactories.createTask({
        id: 'memory-leak-task',
        executionConfig: {
          simulateMemoryLeak: true,
          leakRate: 1024 * 1024, // 1MB per iteration
        },
      });
      await taskStore.addTask(memoryLeakTask);
      safetyMonitor.enableMemoryMonitoring({
        maxMemoryIncrease: 100 * 1024 * 1024, // 100MB max increase
        monitoringInterval: 500,
      });
      const executionResult = await taskStore.executeTask('memory-leak-task');
      expect(executionResult.success).toBe(false);
      expect(executionResult.terminationReason).toBe('memory_limit_exceeded');
    });
    it('should handle I/O-bound infinite loops', async () => {
      const ioInfiniteTask = TaskFactories.createTask({
        id: 'io-infinite-task',
        executionConfig: {
          ioIntensive: true,
          simulateInfiniteLoop: true,
        },
      });
      await taskStore.addTask(ioInfiniteTask);
      safetyMonitor.enableIOMonitoring({
        maxIOOperations: 10000,
        timeWindow: 5000, // 5 seconds
      });
      const executionResult = await taskStore.executeTask('io-infinite-task');
      expect(executionResult.success).toBe(false);
      expect(executionResult.terminationReason).toMatch(
        /io_(operations|time)_exceeded/,
      );
    });
  });
  describe('Timeout Enforcement', () => {
    it('should enforce global execution timeouts', async () => {
      const longRunningTask = TaskFactories.createTask({
        id: 'long-running-task',
        estimatedDuration: 30000, // 30 seconds estimated
        maxExecutionTime: 2000, // 2 seconds max allowed
      });
      await taskStore.addTask(longRunningTask);
      const executionStart = Date.now();
      const executionResult = await taskStore.executeTask('long-running-task');
      const executionTime = Date.now() - executionStart;
      expect(executionResult.success).toBe(false);
      expect(executionResult.terminationReason).toBe('execution_timeout');
      expect(executionTime).toBeLessThan(3000); // Should timeout around 2 seconds
      expect(executionTime).toBeGreaterThan(1800); // Should run for almost full timeout
    });
    it('should enforce cascading timeout limits', async () => {
      // Parent task with 5-second timeout spawns subtasks
      const parentTask = TaskFactories.createTask({
        id: 'parent-timeout-task',
        maxExecutionTime: 5000,
        executionConfig: {
          spawnSubtasks: [
            { id: 'subtask-1', duration: 2000 },
            { id: 'subtask-2', duration: 2000 },
            { id: 'subtask-3', duration: 2000 }, // Total > parent timeout
          ],
        },
      });
      await taskStore.addTask(parentTask);
      const executionResult = await taskStore.executeTask(
        'parent-timeout-task',
      );
      expect(executionResult.success).toBe(false);
      expect(executionResult.terminationReason).toBe('parent_timeout_cascade');
      expect(executionResult.completedSubtasks).toBeLessThan(3);
    });
    it('should handle timeout in cleanup operations', async () => {
      const cleanupTask = TaskFactories.createTask({
        id: 'cleanup-timeout-task',
        maxExecutionTime: 3000,
        executionConfig: {
          hasCleanup: true,
          cleanupDuration: 10000, // Cleanup takes longer than main timeout
        },
      });
      await taskStore.addTask(cleanupTask);
      const executionResult = await taskStore.executeTask(
        'cleanup-timeout-task',
      );
      expect(executionResult.success).toBe(false);
      expect(executionResult.mainTaskCompleted).toBe(true);
      expect(executionResult.cleanupCompleted).toBe(false);
      expect(executionResult.terminationReason).toBe('cleanup_timeout');
    });
  });
  describe('Memory Leak Protection', () => {
    it('should detect gradual memory leaks in long-running tasks', async () => {
      const leakyTask = TaskFactories.createTask({
        id: 'gradual-leak-task',
        executionConfig: {
          duration: 10000, // 10 seconds
          memoryLeakRate: 1024 * 1024, // 1MB per second
        },
      });
      await taskStore.addTask(leakyTask);
      const initialMemory = process.memoryUsage().heapUsed;
      safetyMonitor.enableGradualLeakDetection({
        maxMemoryGrowthRate: 2 * 1024 * 1024, // 2MB per second max
        measurementInterval: 1000,
      });
      const executionResult = await taskStore.executeTask('gradual-leak-task');
      expect(executionResult.terminationReason).toBe(
        'memory_growth_rate_exceeded',
      );
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryGrowth = finalMemory - initialMemory;
      expect(memoryGrowth).toBeLessThan(20 * 1024 * 1024); // Less than 20MB growth
    });
    it('should prevent reference cycles in task data structures', async () => {
      const circularRefTask = TaskFactories.createTask({
        id: 'circular-ref-task',
        metadata: {},
      });
      // Create circular reference in metadata
      circularRefTask.metadata.self = circularRefTask;
      circularRefTask.metadata.parent = { child: circularRefTask };
      const addResult = await taskStore.addTask(circularRefTask);
      if (addResult.success) {
        // System cleaned circular references
        expect(addResult.warnings).toContain('circular_references_cleaned');
        const storedTask = await taskStore.getTask('circular-ref-task');
        expect(storedTask?.metadata.self).toBeUndefined();
      } else {
        // System rejected task with circular references
        expect(addResult.error).toContain('circular_reference');
      }
    });
    it('should clean up abandoned task resources', async () => {
      const resourceTask = TaskFactories.createTask({
        id: 'resource-abandon-task',
        executionConfig: {
          allocateResources: true,
          resourceTypes: ['memory', 'files', 'network'],
          abandonResources: true, // Simulate resource abandonment
        },
      });
      await taskStore.addTask(resourceTask);
      const executionResult = await taskStore.executeTask(
        'resource-abandon-task',
      );
      // Even if task fails to clean up, system should handle it
      const resourceCleanup = await taskStore.cleanupAbandonedResources();
      expect(resourceCleanup.resourcesCleaned).toBeGreaterThan(0);
      expect(resourceCleanup.memoryReclaimed).toBeGreaterThan(0);
      expect(resourceCleanup.filesDeleted).toBeGreaterThan(0);
    });
  });
  describe('System State Protection', () => {
    it('should prevent system-wide state corruption from infinite loops', async () => {
      const stateCorruptionTask = TaskFactories.createTask({
        id: 'state-corruption-task',
        executionConfig: {
          corruptSystemState: true,
          infiniteStateModification: true,
        },
      });
      await taskStore.addTask(stateCorruptionTask);
      const initialState = taskStore.getSystemStateSnapshot();
      safetyMonitor.enableStateIntegrityMonitoring({
        maxStateChangesPerSecond: 1000,
        integrityCheckInterval: 500,
      });
      const executionResult = await taskStore.executeTask(
        'state-corruption-task',
      );
      expect(executionResult.success).toBe(false);
      expect(executionResult.terminationReason).toBe(
        'state_integrity_violation',
      );
      const finalState = taskStore.getSystemStateSnapshot();
      const stateIntegrity = taskStore.validateStateIntegrity(
        initialState,
        finalState,
      );
      expect(stateIntegrity.isValid).toBe(true);
      expect(stateIntegrity.corruptionPrevented).toBe(true);
    });
    it('should isolate infinite loops from affecting other tasks', async () => {
      const infiniteTask = TaskFactories.createTask({
        id: 'isolated-infinite-task',
        executionConfig: {
          simulateInfiniteLoop: true,
          resourceIsolation: true,
        },
      });
      const normalTask = TaskFactories.createTask({
        id: 'normal-task-during-infinite',
        estimatedDuration: 1000,
      });
      await taskStore.addTask(infiniteTask);
      await taskStore.addTask(normalTask);
      // Execute both tasks concurrently
      const infinitePromise = taskStore.executeTask('isolated-infinite-task');
      const normalPromise = taskStore.executeTask(
        'normal-task-during-infinite',
      );
      const [infiniteResult, normalResult] = await Promise.allSettled([
        infinitePromise,
        normalPromise,
      ]);
      // Normal task should complete successfully
      expect(normalResult.status).toBe('fulfilled');
      expect(normalResult.value.success).toBe(true);
      // Infinite task should be terminated
      expect(infiniteResult.status).toBe('fulfilled');
      expect(infiniteResult.value.success).toBe(false);
      expect(infiniteResult.value.terminationReason).toContain('infinite');
    });
    it('should recover system stability after infinite loop detection', async () => {
      const multipleInfiniteLoops = Array.from({ length: 5 }, (_, i) =>
        TaskFactories.createTask({
          id: `infinite-loop-${i}`,
          executionConfig: {
            simulateInfiniteLoop: true,
            loopType: ['cpu', 'memory', 'io', 'callback', 'recursive'][i],
          },
        }),
      );
      await Promise.all(
        multipleInfiniteLoops.map((task) => taskStore.addTask(task)),
      );
      // Execute all infinite loop tasks
      const executionResults = await Promise.allSettled(
        multipleInfiniteLoops.map((task) => taskStore.executeTask(task.id)),
      );
      // All should be terminated
      executionResults.forEach((result) => {
        expect(result.status).toBe('fulfilled');
        expect(result.value.success).toBe(false);
        expect(result.value.terminationReason).toMatch(
          /infinite|exceeded|limit/,
        );
      });
      // System should remain stable
      const systemHealth = taskStore.getSystemHealthMetrics();
      expect(systemHealth.overallHealth).toBe('healthy');
      expect(systemHealth.infiniteLoopProtection.active).toBe(true);
      expect(systemHealth.infiniteLoopProtection.detectedLoops).toBe(5);
      expect(systemHealth.infiniteLoopProtection.successfulTerminations).toBe(
        5,
      );
      // Should be able to execute normal tasks after cleanup
      const recoveryTask = TaskFactories.createTask({
        id: 'recovery-validation-task',
        estimatedDuration: 1000,
      });
      await taskStore.addTask(recoveryTask);
      const recoveryResult = await taskStore.executeTask(
        'recovery-validation-task',
      );
      expect(recoveryResult.success).toBe(true);
      expect(recoveryResult.executionTime).toBeLessThan(2000);
    });
  });
});
//# sourceMappingURL=InfiniteLoopProtection.test.js.map
