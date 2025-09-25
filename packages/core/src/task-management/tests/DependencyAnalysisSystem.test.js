/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  DependencyAnalyzer,
  DependencySequencer,
  IntelligentDependencyManager,
  SequencingStrategy,
  createIntelligentDependencySystem,
  DependencyConfigurations,
} from '../../autonomous-tasks/dependencies/index.js';
import {
  TaskPriority as Priority,
  TaskStatus as Status,
  TaskType as Type,
} from '../../autonomous-tasks/interfaces/TaskInterfaces.js';
// Mock task factory for testing
function createMockTask(
  id,
  name,
  type = Type.FEATURE,
  priority = Priority.MEDIUM,
  dependencies = [],
  description = `Test task: ${name}`,
) {
  const mockContext = {
    sessionId: 'test-session',
    workingDirectory: '/test',
    environment: {},
    config: {},
    timeout: 300000,
    maxRetries: 3,
    userPreferences: {},
  };
  return {
    id,
    name,
    description,
    type,
    priority,
    status: Status.PENDING,
    dependencies: dependencies.map((depId) => ({
      taskId: depId,
      type: 'prerequisite',
      optional: false,
    })),
    createdAt: new Date(),
    updatedAt: new Date(),
    context: mockContext,
    parameters: { testParam: true },
    subtasks: [],
    tags: ['test'],
    async execute(context) {
      return {
        success: true,
        metrics: {
          startTime: new Date(),
          endTime: new Date(),
          duration: 1000,
          memoryUsage: 1000000,
          cpuUsage: 50,
          retryCount: 0,
          performanceScore: 85,
        },
        messages: [`Executed task ${this.name}`],
      };
    },
    validate(context) {
      return true;
    },
    async cancel() {
      this.status = Status.CANCELLED;
      return true;
    },
    clone(overrides = {}) {
      return { ...this, ...overrides };
    },
    getProgress() {
      return this.status === Status.COMPLETED ? 100 : 0;
    },
    getEstimatedCompletion() {
      return 3600000; // 1 hour
    },
  };
}
describe('DependencyAnalyzer', () => {
  let analyzer;
  beforeEach(() => {
    analyzer = new DependencyAnalyzer();
  });
  describe('Basic dependency analysis', () => {
    it('should analyze explicit dependencies correctly', async () => {
      const tasks = [
        createMockTask('task1', 'Setup Database'),
        createMockTask(
          'task2',
          'Create Schema',
          Type.FEATURE,
          Priority.MEDIUM,
          ['task1'],
        ),
        createMockTask('task3', 'Insert Data', Type.FEATURE, Priority.MEDIUM, [
          'task2',
        ]),
      ];
      const result = await analyzer.analyzeDependencies(tasks);
      expect(result.dependencies).toHaveLength(2);
      expect(result.dependencies[0].from).toBe('task1');
      expect(result.dependencies[0].to).toBe('task2');
      expect(result.dependencies[0].type).toBe('explicit');
      expect(result.dependencies[0].confidence).toBe(1.0);
    });
    it('should detect independent tasks', async () => {
      const tasks = [
        createMockTask('task1', 'Setup Database'),
        createMockTask('task2', 'Setup Web Server'),
        createMockTask('task3', 'Configure Logging'),
      ];
      const result = await analyzer.analyzeDependencies(tasks);
      expect(result.independentTasks).toHaveLength(3);
      expect(result.independentTasks).toContain('task1');
      expect(result.independentTasks).toContain('task2');
      expect(result.independentTasks).toContain('task3');
    });
    it('should identify critical tasks', async () => {
      const tasks = [
        createMockTask('critical', 'Setup Foundation'),
        createMockTask(
          'task1',
          'Build Feature A',
          Type.FEATURE,
          Priority.MEDIUM,
          ['critical'],
        ),
        createMockTask(
          'task2',
          'Build Feature B',
          Type.FEATURE,
          Priority.MEDIUM,
          ['critical'],
        ),
        createMockTask(
          'task3',
          'Test Features',
          Type.TESTING,
          Priority.MEDIUM,
          ['task1', 'task2'],
        ),
      ];
      const result = await analyzer.analyzeDependencies(tasks);
      expect(result.criticalTasks).toContain('critical');
    });
  });
  describe('Implicit dependency detection', () => {
    it('should detect keyword-based implicit dependencies', async () => {
      const tasks = [
        createMockTask('setup', 'Initialize database setup'),
        createMockTask('migrate', 'Run database migration setup'),
      ];
      const result = await analyzer.analyzeDependencies(tasks);
      // Should detect implicit dependency based on 'setup' keyword
      const implicitDeps = result.dependencies.filter(
        (d) => d.type === 'implicit',
      );
      expect(implicitDeps.length).toBeGreaterThan(0);
    });
    it('should detect structural dependencies based on task types', async () => {
      const tasks = [
        createMockTask('analyze', 'Analyze requirements', Type.CODE_ANALYSIS),
        createMockTask('implement', 'Implement feature', Type.FEATURE),
        createMockTask('test', 'Test implementation', Type.TESTING),
        createMockTask('deploy', 'Deploy to production', Type.DEPLOYMENT),
      ];
      const result = await analyzer.analyzeDependencies(tasks);
      // Should detect structural dependencies based on type ordering
      const structuralDeps = result.dependencies.filter(
        (d) => d.type === 'implicit',
      );
      expect(structuralDeps.length).toBeGreaterThanOrEqual(2);
    });
  });
  describe('Resource and temporal dependencies', () => {
    it('should detect resource-based dependencies', async () => {
      const tasks = [
        createMockTask('db1', 'Database Task 1'),
        createMockTask('db2', 'Database Task 2'),
        createMockTask('web1', 'Web Task 1'),
      ];
      // Mock required capabilities to simulate resource usage
      tasks[0].parameters = { required_capabilities: ['database'] };
      tasks[1].parameters = { required_capabilities: ['database'] };
      tasks[2].parameters = { required_capabilities: ['web_server'] };
      const result = await analyzer.analyzeDependencies(tasks);
      const resourceDeps = result.dependencies.filter(
        (d) => d.type === 'resource',
      );
      // Should create resource dependencies for tasks using same resource
      expect(resourceDeps.length).toBeGreaterThanOrEqual(1);
    });
    it('should detect temporal dependencies', async () => {
      const now = new Date();
      const tasks = [
        createMockTask('early', 'Early Task'),
        createMockTask('close', 'Close Task'),
      ];
      // Set close deadlines
      tasks[0].parameters = { metadata: { deadline: now.toISOString() } };
      tasks[1].parameters = {
        metadata: {
          deadline: new Date(now.getTime() + 1000 * 60 * 30).toISOString(),
        },
      }; // 30 min later
      const result = await analyzer.analyzeDependencies(tasks);
      const temporalDeps = result.dependencies.filter(
        (d) => d.type === 'temporal',
      );
      expect(temporalDeps.length).toBeGreaterThanOrEqual(1);
    });
  });
  describe('Circular dependency detection', () => {
    it('should detect circular dependencies', async () => {
      const tasks = [
        createMockTask('task1', 'Task 1', Type.FEATURE, Priority.MEDIUM, [
          'task3',
        ]),
        createMockTask('task2', 'Task 2', Type.FEATURE, Priority.MEDIUM, [
          'task1',
        ]),
        createMockTask('task3', 'Task 3', Type.FEATURE, Priority.MEDIUM, [
          'task2',
        ]),
      ];
      const result = await analyzer.analyzeDependencies(tasks);
      expect(result.potentialCircular).toHaveLength(1);
      expect(result.potentialCircular[0]).toEqual([
        'task1',
        'task2',
        'task3',
        'task1',
      ]);
    });
  });
});
describe('DependencySequencer', () => {
  let sequencer;
  beforeEach(() => {
    sequencer = new DependencySequencer();
  });
  afterEach(() => {
    sequencer.removeAllListeners();
  });
  describe('Execution order resolution', () => {
    it('should resolve simple linear dependencies', async () => {
      const tasks = [
        createMockTask('task3', 'Task 3', Type.FEATURE, Priority.MEDIUM, [
          'task2',
        ]),
        createMockTask('task1', 'Task 1'),
        createMockTask('task2', 'Task 2', Type.FEATURE, Priority.MEDIUM, [
          'task1',
        ]),
      ];
      const orderedTasks = await sequencer.resolveExecutionOrder(tasks);
      expect(orderedTasks[0].id).toBe('task1');
      expect(orderedTasks[1].id).toBe('task2');
      expect(orderedTasks[2].id).toBe('task3');
    });
    it('should handle parallel execution opportunities', async () => {
      const tasks = [
        createMockTask('base', 'Base Task'),
        createMockTask(
          'parallel1',
          'Parallel Task 1',
          Type.FEATURE,
          Priority.MEDIUM,
          ['base'],
        ),
        createMockTask(
          'parallel2',
          'Parallel Task 2',
          Type.FEATURE,
          Priority.MEDIUM,
          ['base'],
        ),
        createMockTask('final', 'Final Task', Type.FEATURE, Priority.MEDIUM, [
          'parallel1',
          'parallel2',
        ]),
      ];
      const groups = await sequencer.getParallelExecutionGroups(tasks);
      expect(groups).toHaveLength(3);
      expect(groups[0]).toHaveLength(1); // base task
      expect(groups[1]).toHaveLength(2); // parallel tasks
      expect(groups[2]).toHaveLength(1); // final task
    });
  });
  describe('Sequencing strategies', () => {
    it('should apply priority-first strategy', async () => {
      const sequencer = new DependencySequencer({
        strategy: SequencingStrategy.PRIORITY_FIRST,
      });
      const tasks = [
        createMockTask('low', 'Low Priority', Type.FEATURE, Priority.LOW),
        createMockTask(
          'critical',
          'Critical Priority',
          Type.FEATURE,
          Priority.CRITICAL,
        ),
        createMockTask('high', 'High Priority', Type.FEATURE, Priority.HIGH),
      ];
      const sequence = await sequencer.generateExecutionSequence(tasks);
      expect(sequence.strategy).toBe(SequencingStrategy.PRIORITY_FIRST);
      // Critical should come first in the sequence
      const criticalGroup = sequence.groups.find((g) =>
        g.tasks.some((t) => t.id === 'critical'),
      );
      expect(criticalGroup?.priority).toBe(Priority.CRITICAL);
      sequencer.removeAllListeners();
    });
    it('should apply critical path strategy', async () => {
      const sequencer = new DependencySequencer({
        strategy: SequencingStrategy.CRITICAL_PATH,
      });
      const tasks = [
        createMockTask('critical1', 'Critical Path 1'),
        createMockTask(
          'critical2',
          'Critical Path 2',
          Type.FEATURE,
          Priority.MEDIUM,
          ['critical1'],
        ),
        createMockTask('side', 'Side Task', Type.FEATURE, Priority.HIGH), // High priority but not on critical path
      ];
      const sequence = await sequencer.generateExecutionSequence(tasks);
      expect(sequence.strategy).toBe(SequencingStrategy.CRITICAL_PATH);
      expect(sequence.criticalPath).toContain('critical1');
      expect(sequence.criticalPath).toContain('critical2');
      sequencer.removeAllListeners();
    });
  });
  describe('Conflict detection and resolution', () => {
    it('should detect resource contention conflicts', async () => {
      const tasks = [
        createMockTask('db1', 'Database Operation 1'),
        createMockTask('db2', 'Database Operation 2'),
      ];
      // Simulate both tasks requiring the same resource
      vi.spyOn(sequencer, 'extractTaskResources').mockImplementation((task) => {
        if (task.id.startsWith('db')) {
          return ['database'];
        }
        return ['cpu'];
      });
      const conflicts = await sequencer.detectConflicts(tasks);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe('resource_contention');
      expect(conflicts[0].taskIds).toContain('db1');
      expect(conflicts[0].taskIds).toContain('db2');
    });
    it('should detect priority inversion conflicts', async () => {
      const tasks = [
        createMockTask(
          'low',
          'Low Priority Blocking',
          Type.FEATURE,
          Priority.LOW,
        ),
        createMockTask(
          'high',
          'High Priority Blocked',
          Type.FEATURE,
          Priority.HIGH,
          ['low'],
        ),
      ];
      const conflicts = await sequencer.detectConflicts(tasks);
      const priorityInversions = conflicts.filter(
        (c) => c.type === 'priority_inversion',
      );
      expect(priorityInversions).toHaveLength(1);
      expect(priorityInversions[0].taskIds).toContain('low');
      expect(priorityInversions[0].taskIds).toContain('high');
    });
  });
  describe('Dependency validation', () => {
    it('should validate correct dependencies', async () => {
      const tasks = [
        createMockTask('task1', 'Task 1'),
        createMockTask('task2', 'Task 2', Type.FEATURE, Priority.MEDIUM, [
          'task1',
        ]),
      ];
      const validation = await sequencer.validateDependencies(tasks);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
    it('should detect missing dependencies', async () => {
      const tasks = [
        createMockTask('task1', 'Task 1', Type.FEATURE, Priority.MEDIUM, [
          'missing-task',
        ]),
      ];
      const validation = await sequencer.validateDependencies(tasks);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(1);
      expect(validation.errors[0].type).toBe('missing_dependency');
      expect(validation.missingDependencies).toContain('missing-task');
    });
    it('should detect circular dependencies', async () => {
      const tasks = [
        createMockTask('task1', 'Task 1', Type.FEATURE, Priority.MEDIUM, [
          'task2',
        ]),
        createMockTask('task2', 'Task 2', Type.FEATURE, Priority.MEDIUM, [
          'task1',
        ]),
      ];
      const validation = await sequencer.validateDependencies(tasks);
      expect(validation.isValid).toBe(false);
      expect(
        validation.errors.some((e) => e.type === 'circular_dependency'),
      ).toBe(true);
      expect(validation.circularDependencies).toHaveLength(1);
    });
  });
});
describe('IntelligentDependencyManager', () => {
  let manager;
  beforeEach(() => {
    manager = new IntelligentDependencyManager();
  });
  afterEach(() => {
    manager.dispose();
  });
  describe('Integrated dependency management', () => {
    it('should provide comprehensive dependency analysis', async () => {
      const tasks = [
        createMockTask('setup', 'Setup Environment'),
        createMockTask(
          'build',
          'Build Application',
          Type.BUILD,
          Priority.MEDIUM,
          ['setup'],
        ),
        createMockTask('test', 'Run Tests', Type.TESTING, Priority.MEDIUM, [
          'build',
        ]),
        createMockTask(
          'deploy',
          'Deploy Application',
          Type.DEPLOYMENT,
          Priority.CRITICAL,
          ['test'],
        ),
      ];
      const graph = await manager.analyzeDependencies(tasks);
      expect(graph.nodes).toHaveLength(4);
      expect(graph.edges.length).toBeGreaterThanOrEqual(3);
      expect(graph.levels).toHaveLength(4);
      expect(graph.criticalPath).toContain('deploy');
    });
    it('should generate optimized execution sequences', async () => {
      const tasks = [
        createMockTask('parallel1', 'Parallel Task 1'),
        createMockTask('parallel2', 'Parallel Task 2'),
        createMockTask('final', 'Final Task', Type.FEATURE, Priority.MEDIUM, [
          'parallel1',
          'parallel2',
        ]),
      ];
      const sequence = await manager.generateIntelligentSequence(tasks);
      expect(sequence.groups).toHaveLength(2);
      expect(sequence.groups[0].tasks).toHaveLength(2); // Parallel tasks
      expect(sequence.groups[1].tasks).toHaveLength(1); // Final task
      expect(sequence.maxConcurrency).toBe(2);
    });
    it('should cache analysis results for performance', async () => {
      const tasks = [
        createMockTask('task1', 'Task 1'),
        createMockTask('task2', 'Task 2'),
      ];
      // First analysis
      const start1 = Date.now();
      await manager.analyzeDependencies(tasks);
      const time1 = Date.now() - start1;
      // Second analysis (should use cache)
      const start2 = Date.now();
      await manager.analyzeDependencies(tasks);
      const time2 = Date.now() - start2;
      // Cache hit should be significantly faster
      expect(time2).toBeLessThan(time1);
    });
  });
  describe('Real-time monitoring and updates', () => {
    it('should handle dependency updates', async () => {
      const taskId = 'test-task';
      const newDependencies = [
        { taskId: 'new-dep', type: 'prerequisite', optional: false },
      ];
      await expect(
        manager.updateTaskDependencies(taskId, newDependencies),
      ).resolves.not.toThrow();
    });
    it('should provide comprehensive metrics', () => {
      const metrics = manager.getMetrics();
      expect(metrics).toHaveProperty('totalTasksAnalyzed');
      expect(metrics).toHaveProperty('totalDependenciesDetected');
      expect(metrics).toHaveProperty('averageAnalysisTime');
      expect(metrics).toHaveProperty('averageSequencingTime');
      expect(metrics).toHaveProperty('conflictsDetected');
      expect(metrics).toHaveProperty('conflictsResolved');
      expect(metrics).toHaveProperty('averageSequenceConfidence');
      expect(metrics).toHaveProperty('cacheHitRate');
      expect(metrics).toHaveProperty('optimizationSuccessRate');
    });
  });
  describe('Adaptive learning capabilities', () => {
    it('should collect learning insights', async () => {
      const insights = await manager.getLearningInsights();
      expect(Array.isArray(insights)).toBe(true);
      // New system may not have insights yet
    });
    it('should optimize performance over time', async () => {
      const initialMetrics = manager.getMetrics();
      await manager.optimize();
      const optimizedMetrics = manager.getMetrics();
      // Optimization should maintain or improve metrics
      expect(optimizedMetrics.optimizationSuccessRate).toBeGreaterThanOrEqual(
        initialMetrics.optimizationSuccessRate,
      );
    });
  });
});
describe('Factory functions and configurations', () => {
  it('should create intelligent dependency system with factory', () => {
    const system = createIntelligentDependencySystem();
    expect(system).toBeInstanceOf(IntelligentDependencyManager);
    system.dispose();
  });
  it('should apply predefined configurations correctly', () => {
    const highPerf = createIntelligentDependencySystem(
      DependencyConfigurations.HIGH_PERFORMANCE,
    );
    const comprehensive = createIntelligentDependencySystem(
      DependencyConfigurations.COMPREHENSIVE,
    );
    const resourceOpt = createIntelligentDependencySystem(
      DependencyConfigurations.RESOURCE_OPTIMIZED,
    );
    const qualityFocused = createIntelligentDependencySystem(
      DependencyConfigurations.QUALITY_FOCUSED,
    );
    expect(highPerf).toBeInstanceOf(IntelligentDependencyManager);
    expect(comprehensive).toBeInstanceOf(IntelligentDependencyManager);
    expect(resourceOpt).toBeInstanceOf(IntelligentDependencyManager);
    expect(qualityFocused).toBeInstanceOf(IntelligentDependencyManager);
    // Cleanup
    [highPerf, comprehensive, resourceOpt, qualityFocused].forEach((system) => {
      system.dispose();
    });
  });
});
describe('Performance and scalability', () => {
  it('should handle large numbers of tasks efficiently', async () => {
    const manager = createIntelligentDependencySystem(
      DependencyConfigurations.HIGH_PERFORMANCE,
    );
    // Create 100 tasks with random dependencies
    const tasks = [];
    for (let i = 0; i < 100; i++) {
      const deps = i > 0 ? [`task${Math.floor(Math.random() * i)}`] : [];
      tasks.push(
        createMockTask(
          `task${i}`,
          `Task ${i}`,
          Type.FEATURE,
          Priority.MEDIUM,
          deps,
        ),
      );
    }
    const startTime = Date.now();
    const graph = await manager.analyzeDependencies(tasks);
    const analysisTime = Date.now() - startTime;
    expect(graph.nodes).toHaveLength(100);
    expect(analysisTime).toBeLessThan(5000); // Should complete within 5 seconds
    const sequenceStart = Date.now();
    const sequence = await manager.generateIntelligentSequence(tasks);
    const sequenceTime = Date.now() - sequenceStart;
    expect(sequence.groups.length).toBeGreaterThan(0);
    expect(sequenceTime).toBeLessThan(3000); // Should complete within 3 seconds
    manager.dispose();
  });
  it('should maintain performance with repeated operations', async () => {
    const manager = createIntelligentDependencySystem();
    const tasks = [
      createMockTask('task1', 'Task 1'),
      createMockTask('task2', 'Task 2', Type.FEATURE, Priority.MEDIUM, [
        'task1',
      ]),
      createMockTask('task3', 'Task 3', Type.FEATURE, Priority.MEDIUM, [
        'task2',
      ]),
    ];
    const times = [];
    // Perform 10 analysis operations
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      await manager.analyzeDependencies(tasks);
      times.push(Date.now() - start);
    }
    // After caching kicks in, times should stabilize or improve
    const avgEarly = (times[0] + times[1] + times[2]) / 3;
    const avgLate = (times[7] + times[8] + times[9]) / 3;
    expect(avgLate).toBeLessThanOrEqual(avgEarly * 2); // Should not degrade significantly
    manager.dispose();
  });
});
describe('Error handling and edge cases', () => {
  it('should handle empty task arrays gracefully', async () => {
    const manager = createIntelligentDependencySystem();
    const graph = await manager.analyzeDependencies([]);
    expect(graph.nodes).toHaveLength(0);
    expect(graph.edges).toHaveLength(0);
    const sequence = await manager.generateIntelligentSequence([]);
    expect(sequence.groups).toHaveLength(0);
    manager.dispose();
  });
  it('should handle invalid dependencies gracefully', async () => {
    const manager = createIntelligentDependencySystem();
    const tasks = [
      createMockTask('task1', 'Task 1', Type.FEATURE, Priority.MEDIUM, [
        'nonexistent',
      ]),
    ];
    const validation = await manager.validateDependencies(tasks);
    expect(validation.isValid).toBe(false);
    expect(validation.missingDependencies).toContain('nonexistent');
    manager.dispose();
  });
  it('should recover from analysis errors', async () => {
    const manager = createIntelligentDependencySystem();
    // Create a task with malformed data
    const badTask = createMockTask('bad', 'Bad Task');
    badTask.dependencies = null; // Malform the dependencies
    const tasks = [createMockTask('good', 'Good Task'), badTask];
    // Should not throw, but handle gracefully
    await expect(manager.analyzeDependencies(tasks)).resolves.not.toThrow();
    manager.dispose();
  });
});
//# sourceMappingURL=DependencyAnalysisSystem.test.js.map
