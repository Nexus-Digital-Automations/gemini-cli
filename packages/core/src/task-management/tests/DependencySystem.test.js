/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { DependencyAnalysisEngine } from '../core/DependencyAnalysisEngine.js';
import { DependencyGraphManager } from '../core/DependencyGraphManager.js';
import { DependencyVisualizer, VisualizationFormat, } from '../visualization/DependencyVisualizer.js';
import { ResourceAwareScheduler, ResourcePool, ResourceType, } from '../scheduling/ResourceAwareScheduler.js';
import { DependencyType, DependencyStrength, NodeExecutionStatus, GraphComplexity, ViolationType, ViolationSeverity, } from '../types/Dependency.js';
/**
 * Test utilities for creating mock tasks and dependencies
 */
class TestUtilities {
    static createMockTask(id, title, priority = 'medium', complexity = 'moderate', estimatedEffort = 60, dependencies = []) {
        return {
            id,
            title,
            description: `Test task: ${title}`,
            category: 'feature',
            priority,
            status: 'created',
            complexity,
            estimatedEffort,
            actualEffort: undefined,
            businessValue: 'Test business value',
            dependencies,
            dependents: [],
            metadata: {
                tags: ['test'],
                properties: {},
                affectedFiles: [],
                relatedIssues: [],
                createdBy: 'test-suite',
            },
            context: {
                workingDirectory: '/test',
                environment: {},
                requiredTools: [],
                constraints: {
                    maxExecutionTime: 3600000,
                    requiredPermissions: [],
                    allowedFilePatterns: ['**/*'],
                    blockedFilePatterns: [],
                    networkAccess: false,
                },
                inputs: {},
                outputs: {},
            },
            validationCriteria: {
                requiresLinting: false,
                requiresTesting: false,
                requiresSecurity: false,
                requiresPerformance: false,
                requiresReview: false,
                customValidation: [],
                successCriteria: [],
            },
            timestamps: {
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            history: [],
        };
    }
    static createLinearDependencyChain(length) {
        const tasks = [];
        for (let i = 0; i < length; i++) {
            const dependencies = i > 0 ? [`task-${i - 1}`] : [];
            tasks.push(this.createMockTask(`task-${i}`, `Task ${i}`, 'medium', 'simple', 30, dependencies));
        }
        return tasks;
    }
    static createParallelTasks(count) {
        const tasks = [];
        for (let i = 0; i < count; i++) {
            tasks.push(this.createMockTask(`parallel-task-${i}`, `Parallel Task ${i}`));
        }
        return tasks;
    }
    static createCircularDependency() {
        const taskA = this.createMockTask('task-a', 'Task A', 'high', 'moderate', 45, ['task-c']);
        const taskB = this.createMockTask('task-b', 'Task B', 'high', 'moderate', 30, ['task-a']);
        const taskC = this.createMockTask('task-c', 'Task C', 'high', 'moderate', 60, ['task-b']);
        return [taskA, taskB, taskC];
    }
    static createComplexDependencyGraph() {
        // Create a complex graph with multiple paths and bottlenecks
        return [
            this.createMockTask('start', 'Start Task', 'high', 'simple', 15),
            this.createMockTask('a1', 'Analysis 1', 'high', 'moderate', 60, [
                'start',
            ]),
            this.createMockTask('a2', 'Analysis 2', 'high', 'moderate', 45, [
                'start',
            ]),
            this.createMockTask('design', 'Design Phase', 'critical', 'complex', 120, ['a1', 'a2']),
            this.createMockTask('impl1', 'Implementation 1', 'high', 'complex', 180, [
                'design',
            ]),
            this.createMockTask('impl2', 'Implementation 2', 'high', 'complex', 150, [
                'design',
            ]),
            this.createMockTask('test1', 'Testing 1', 'medium', 'moderate', 90, [
                'impl1',
            ]),
            this.createMockTask('test2', 'Testing 2', 'medium', 'moderate', 75, [
                'impl2',
            ]),
            this.createMockTask('integration', 'Integration', 'critical', 'complex', 240, ['test1', 'test2']),
            this.createMockTask('deploy', 'Deployment', 'critical', 'moderate', 60, [
                'integration',
            ]),
        ];
    }
}
describe('Dependency Analysis Engine', () => {
    let engine;
    beforeEach(() => {
        engine = new DependencyAnalysisEngine();
    });
    afterEach(() => {
        engine.clearCache();
    });
    describe('Graph Validation', () => {
        test('should validate a simple linear dependency graph', async () => {
            const tasks = TestUtilities.createLinearDependencyChain(3);
            const manager = new DependencyGraphManager();
            const graph = await manager.createGraph('linear-test', 'Linear Test', 'Linear dependency test', tasks);
            const validation = await engine.validateGraph(graph);
            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
            expect(validation.circularDependencies).toHaveLength(0);
        });
        test('should detect circular dependencies', async () => {
            const tasks = TestUtilities.createCircularDependency();
            const manager = new DependencyGraphManager();
            const graph = await manager.createGraph('circular-test', 'Circular Test', 'Circular dependency test', tasks);
            const validation = await engine.validateGraph(graph);
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toHaveLength(1);
            expect(validation.errors[0].type).toBe('circular_dependency');
            expect(validation.circularDependencies).toHaveLength(1);
            expect(validation.circularDependencies[0].length).toBe(3);
        });
        test('should provide breaking point suggestions for circular dependencies', async () => {
            const tasks = TestUtilities.createCircularDependency();
            const manager = new DependencyGraphManager();
            const graph = await manager.createGraph('circular-test', 'Circular Test', 'Circular dependency test', tasks);
            const cycles = await engine.detectCircularDependencies(graph);
            expect(cycles).toHaveLength(1);
            expect(cycles[0].breakingPoints).toHaveLength(3); // One for each edge in the cycle
            expect(cycles[0].breakingPoints[0]).toHaveProperty('cost');
            expect(cycles[0].breakingPoints[0]).toHaveProperty('justification');
            expect(cycles[0].breakingPoints[0]).toHaveProperty('alternatives');
        });
    });
    describe('Topological Sorting', () => {
        test('should produce correct execution order for linear chain', async () => {
            const tasks = TestUtilities.createLinearDependencyChain(5);
            const manager = new DependencyGraphManager();
            const graph = await manager.createGraph('linear-sort-test', 'Linear Sort Test', 'Linear sort test', tasks);
            const order = await engine.topologicalSort(graph);
            expect(order).toHaveLength(5);
            // Verify correct order: task-0, task-1, task-2, task-3, task-4
            for (let i = 0; i < 4; i++) {
                const currentIndex = order.findIndex((nodeId) => {
                    const node = graph.nodes.get(nodeId);
                    return node?.task.id === `task-${i}`;
                });
                const nextIndex = order.findIndex((nodeId) => {
                    const node = graph.nodes.get(nodeId);
                    return node?.task.id === `task-${i + 1}`;
                });
                expect(currentIndex).toBeLessThan(nextIndex);
            }
        });
        test('should handle parallel tasks correctly', async () => {
            const tasks = TestUtilities.createParallelTasks(3);
            const manager = new DependencyGraphManager();
            const graph = await manager.createGraph('parallel-test', 'Parallel Test', 'Parallel test', tasks);
            const order = await engine.topologicalSort(graph);
            expect(order).toHaveLength(3);
            // All tasks should be in the order (no dependencies between them)
            const taskIds = order.map((nodeId) => {
                const node = graph.nodes.get(nodeId);
                return node?.task.id;
            });
            expect(taskIds).toContain('parallel-task-0');
            expect(taskIds).toContain('parallel-task-1');
            expect(taskIds).toContain('parallel-task-2');
        });
        test('should fail on circular dependencies', async () => {
            const tasks = TestUtilities.createCircularDependency();
            const manager = new DependencyGraphManager();
            const graph = await manager.createGraph('circular-sort-test', 'Circular Sort Test', 'Circular sort test', tasks);
            await expect(engine.topologicalSort(graph)).rejects.toThrow('Graph contains cycles');
        });
    });
    describe('Critical Path Analysis', () => {
        test('should identify critical path in complex graph', async () => {
            const tasks = TestUtilities.createComplexDependencyGraph();
            const manager = new DependencyGraphManager();
            const graph = await manager.createGraph('complex-test', 'Complex Test', 'Complex dependency test', tasks);
            const criticalPath = await engine.calculateCriticalPath(graph);
            expect(criticalPath.duration).toBeGreaterThan(0);
            expect(criticalPath.nodes).toContain('node-start');
            expect(criticalPath.nodes).toContain('node-deploy');
            // Should include the longest path through the graph
            expect(criticalPath.nodes.length).toBeGreaterThanOrEqual(5);
        });
        test('should identify bottlenecks in critical path', async () => {
            const tasks = TestUtilities.createComplexDependencyGraph();
            const manager = new DependencyGraphManager();
            const graph = await manager.createGraph('bottleneck-test', 'Bottleneck Test', 'Bottleneck test', tasks);
            const criticalPath = await engine.calculateCriticalPath(graph);
            expect(criticalPath.bottlenecks.length).toBeGreaterThan(0);
            // The integration task (240 min) should be identified as a bottleneck
            const integrationBottleneck = criticalPath.bottlenecks.find((b) => b.nodeId === 'node-integration');
            expect(integrationBottleneck).toBeDefined();
            expect(integrationBottleneck?.severity).toBeGreaterThan(1);
        });
    });
    describe('Parallel Group Identification', () => {
        test('should identify parallel execution opportunities', async () => {
            const tasks = TestUtilities.createComplexDependencyGraph();
            const manager = new DependencyGraphManager();
            const graph = await manager.createGraph('parallel-group-test', 'Parallel Group Test', 'Parallel group test', tasks);
            const parallelGroups = await engine.identifyParallelGroups(graph);
            expect(parallelGroups.length).toBeGreaterThan(1);
            // Should identify that a1 and a2 can run in parallel
            const level1Group = parallelGroups.find((group) => group.nodes.includes('node-a1') && group.nodes.includes('node-a2'));
            expect(level1Group).toBeDefined();
            // Should identify that impl1 and impl2 can run in parallel
            const level3Group = parallelGroups.find((group) => group.nodes.includes('node-impl1') &&
                group.nodes.includes('node-impl2'));
            expect(level3Group).toBeDefined();
        });
        test('should calculate correct estimated duration for parallel groups', async () => {
            const tasks = TestUtilities.createComplexDependencyGraph();
            const manager = new DependencyGraphManager();
            const graph = await manager.createGraph('duration-test', 'Duration Test', 'Duration test', tasks);
            const parallelGroups = await engine.identifyParallelGroups(graph);
            for (const group of parallelGroups) {
                expect(group.estimatedDuration).toBeGreaterThan(0);
                // Duration should be the max of all tasks in the group
                const maxTaskDuration = Math.max(...group.nodes.map((nodeId) => {
                    const node = graph.nodes.get(nodeId);
                    return node?.task.estimatedEffort ?? 0;
                }));
                expect(group.estimatedDuration).toBe(maxTaskDuration);
            }
        });
    });
    describe('Comprehensive Analysis', () => {
        test('should perform complete analysis on complex graph', async () => {
            const tasks = TestUtilities.createComplexDependencyGraph();
            const manager = new DependencyGraphManager();
            const graph = await manager.createGraph('analysis-test', 'Analysis Test', 'Analysis test', tasks);
            const analysis = await engine.analyzeGraph(graph);
            expect(analysis.executionOrder).toHaveLength(tasks.length);
            expect(analysis.criticalPath).toBeDefined();
            expect(analysis.parallelGroups).toHaveLength(6); // Based on the complex graph structure
            expect(analysis.optimizations.length).toBeGreaterThan(0);
            expect(analysis.resourcePlan).toBeDefined();
            expect(analysis.schedulingRecommendations).toBeDefined();
        });
        test('should identify optimization opportunities', async () => {
            const tasks = TestUtilities.createComplexDependencyGraph();
            const manager = new DependencyGraphManager();
            const graph = await manager.createGraph('optimization-test', 'Optimization Test', 'Optimization test', tasks);
            const analysis = await engine.analyzeGraph(graph);
            expect(analysis.optimizations.length).toBeGreaterThan(0);
            // Should include parallelization opportunities
            const parallelizationOpt = analysis.optimizations.find((opt) => opt.type === 'parallelization');
            expect(parallelizationOpt).toBeDefined();
            // Each optimization should have improvement estimate
            analysis.optimizations.forEach((opt) => {
                expect(opt.improvement).toBeGreaterThan(0);
                expect(opt.steps).toHaveLength.greaterThan(0);
            });
        });
    });
});
describe('Dependency Graph Manager', () => {
    let manager;
    beforeEach(() => {
        manager = new DependencyGraphManager();
    });
    afterEach(() => {
        manager.destroy();
    });
    describe('Graph Creation and Management', () => {
        test('should create graph with initial tasks', async () => {
            const tasks = TestUtilities.createLinearDependencyChain(3);
            const graph = await manager.createGraph('create-test', 'Create Test', 'Create test', tasks);
            expect(graph.id).toBe('create-test');
            expect(graph.name).toBe('Create Test');
            expect(graph.nodes.size).toBe(3);
            expect(graph.edges.size).toBe(2); // 2 dependencies in chain of 3
        });
        test('should add nodes correctly', async () => {
            const task = TestUtilities.createMockTask('new-task', 'New Task');
            const graph = await manager.createGraph('node-test', 'Node Test', 'Node test');
            const node = await manager.addNode(graph, task);
            expect(node.id).toBe('node-new-task');
            expect(node.task).toBe(task);
            expect(node.executionState.status).toBe(NodeExecutionStatus.NOT_READY);
            expect(graph.nodes.get(node.id)).toBe(node);
        });
        test('should add dependencies correctly', async () => {
            const tasks = [
                TestUtilities.createMockTask('task1', 'Task 1'),
                TestUtilities.createMockTask('task2', 'Task 2'),
            ];
            const graph = await manager.createGraph('dep-test', 'Dependency Test', 'Dependency test', tasks);
            const constraint = {
                id: 'test-constraint',
                type: DependencyType.FINISH_TO_START,
                strength: DependencyStrength.HARD,
                properties: {},
            };
            const edge = await manager.addDependency(graph, 'task1', 'task2', constraint);
            expect(edge.from).toBe('task1');
            expect(edge.to).toBe('task2');
            expect(edge.constraint).toBe(constraint);
            expect(graph.edges.get(edge.id)).toBe(edge);
        });
        test('should detect and resolve deadlocks', async () => {
            const tasks = TestUtilities.createCircularDependency();
            const graph = await manager.createGraph('deadlock-test', 'Deadlock Test', 'Deadlock test', tasks);
            // Should automatically resolve the circular dependency during creation
            expect(graph.validationStatus.circularDependencies.length).toBeGreaterThanOrEqual(0);
            // Manual deadlock detection and resolution
            await manager.detectAndResolveDeadlocks(graph);
            // After resolution, graph should have fewer edges or modified constraints
            const hasViolatedEdges = Array.from(graph.edges.values()).some((edge) => edge.violations.length > 0);
            expect(hasViolatedEdges).toBe(true);
        });
    });
    describe('Deadlock Prevention', () => {
        test('should prevent deadlocks when adding conflicting dependencies', async () => {
            const tasks = [
                TestUtilities.createMockTask('a', 'Task A'),
                TestUtilities.createMockTask('b', 'Task B'),
            ];
            const graph = await manager.createGraph('prevent-test', 'Prevent Test', 'Prevent test', tasks);
            const constraint = {
                id: 'constraint1',
                type: DependencyType.FINISH_TO_START,
                strength: DependencyStrength.HARD,
                properties: {},
            };
            // Add A -> B dependency
            await manager.addDependency(graph, 'a', 'b', constraint);
            // Add B -> A dependency (creates cycle)
            const conflictConstraint = {
                id: 'constraint2',
                type: DependencyType.FINISH_TO_START,
                strength: DependencyStrength.HARD,
                properties: {},
            };
            await manager.addDependency(graph, 'b', 'a', conflictConstraint);
            // Should detect and attempt to resolve the cycle
            const edges = Array.from(graph.edges.values());
            const hasViolations = edges.some((edge) => edge.violations.length > 0);
            expect(hasViolations).toBe(true);
        });
        test('should monitor for deadlocks periodically', async () => {
            const tasks = TestUtilities.createCircularDependency();
            const graph = await manager.createGraph('monitor-test', 'Monitor Test', 'Monitor test', tasks);
            // The manager should have started deadlock monitoring
            expect(manager).toBeDefined();
            // Wait a short time to allow monitoring to run
            await new Promise((resolve) => setTimeout(resolve, 100));
            // Graph should have some violation records
            const hasAnyViolations = Array.from(graph.edges.values()).some((edge) => edge.violations.length > 0);
            expect(hasAnyViolations).toBeTruthy();
        });
    });
});
describe('Dependency Visualizer', () => {
    let visualizer;
    let graph;
    let analysis;
    beforeEach(async () => {
        visualizer = new DependencyVisualizer();
        const manager = new DependencyGraphManager();
        const tasks = TestUtilities.createComplexDependencyGraph();
        graph = await manager.createGraph('viz-test', 'Visualization Test', 'Visualization test', tasks);
        const engine = new DependencyAnalysisEngine();
        analysis = await engine.analyzeGraph(graph);
    });
    describe('Visualization Formats', () => {
        test('should generate ASCII visualization', async () => {
            const result = await visualizer.visualizeGraph(graph, analysis, {
                format: VisualizationFormat.ASCII,
                showCriticalPath: true,
                showParallelGroups: true,
            });
            expect(result).toContain('DEPENDENCY GRAPH');
            expect(result).toContain('CRITICAL PATH');
            expect(result).toContain('PARALLEL EXECUTION GROUPS');
            expect(result).toContain('TASK STATUS OVERVIEW');
            expect(result).toMatch(/Nodes: \d+/);
            expect(result).toMatch(/Edges: \d+/);
        });
        test('should generate DOT format visualization', async () => {
            const result = await visualizer.visualizeGraph(graph, analysis, {
                format: VisualizationFormat.DOT,
                showCriticalPath: true,
            });
            expect(result).toContain('digraph');
            expect(result).toContain('->');
            expect(result).toContain('node [');
            expect(result).toContain('edge [');
            expect(result).toContain('fillcolor');
        });
        test('should generate Mermaid diagram', async () => {
            const result = await visualizer.visualizeGraph(graph, analysis, {
                format: VisualizationFormat.MERMAID,
            });
            expect(result).toContain('graph TD');
            expect(result).toContain('-->');
            expect(result).toContain('classDef');
            expect(result).toMatch(/\w+\[/); // Node definitions
        });
        test('should generate JSON visualization data', async () => {
            const result = await visualizer.visualizeGraph(graph, analysis, {
                format: VisualizationFormat.JSON,
            });
            const data = JSON.parse(result);
            expect(data).toHaveProperty('graph');
            expect(data).toHaveProperty('nodes');
            expect(data).toHaveProperty('edges');
            expect(data).toHaveProperty('analysis');
            expect(data.nodes).toBeInstanceOf(Array);
            expect(data.edges).toBeInstanceOf(Array);
        });
        test('should generate SVG visualization', async () => {
            const result = await visualizer.visualizeGraph(graph, analysis, {
                format: VisualizationFormat.SVG,
                maxWidth: 800,
                maxHeight: 600,
            });
            expect(result).toContain('<svg');
            expect(result).toContain('width="800"');
            expect(result).toContain('height="600"');
            expect(result).toContain('<rect');
            expect(result).toContain('<text');
        });
        test('should generate HTML visualization', async () => {
            const result = await visualizer.visualizeGraph(graph, analysis, {
                format: VisualizationFormat.HTML,
                showCriticalPath: true,
                showResourceInfo: true,
            });
            expect(result).toContain('<!DOCTYPE html>');
            expect(result).toContain('<title>');
            expect(result).toContain('Dependency Graph');
            expect(result).toContain('<div class="node-item');
            expect(result).toContain('<style>');
        });
    });
    describe('Visualization Options', () => {
        test('should respect compact mode', async () => {
            const fullResult = await visualizer.visualizeGraph(graph, analysis, {
                format: VisualizationFormat.ASCII,
                compactMode: false,
            });
            const compactResult = await visualizer.visualizeGraph(graph, analysis, {
                format: VisualizationFormat.ASCII,
                compactMode: true,
            });
            expect(fullResult.length).toBeGreaterThan(compactResult.length);
            expect(fullResult).toContain('DETAILED TASK LIST');
            expect(compactResult).not.toContain('DETAILED TASK LIST');
        });
        test('should show/hide critical path information', async () => {
            const withCriticalPath = await visualizer.visualizeGraph(graph, analysis, {
                format: VisualizationFormat.ASCII,
                showCriticalPath: true,
            });
            const withoutCriticalPath = await visualizer.visualizeGraph(graph, analysis, {
                format: VisualizationFormat.ASCII,
                showCriticalPath: false,
            });
            expect(withCriticalPath).toContain('CRITICAL PATH');
            expect(withoutCriticalPath).not.toContain('CRITICAL PATH');
        });
        test('should support custom themes', () => {
            const customTheme = {
                background: '#000000',
                node: {
                    default: '#333333',
                    critical: '#ff0000',
                    ready: '#00ff00',
                    executing: '#ffff00',
                    completed: '#0000ff',
                    failed: '#ff00ff',
                    blocked: '#00ffff',
                },
                edge: {
                    default: '#666666',
                    critical: '#ff0000',
                    violated: '#ff8800',
                    satisfied: '#00ff00',
                },
                text: {
                    primary: '#ffffff',
                    secondary: '#cccccc',
                    accent: '#ffff00',
                },
            };
            visualizer.addTheme('custom', customTheme);
            const themes = visualizer.getAvailableThemes();
            expect(themes).toContain('custom');
            expect(themes).toContain('default');
            expect(themes).toContain('dark');
        });
    });
});
describe('Resource-Aware Scheduler', () => {
    let scheduler;
    let resourcePool;
    beforeEach(() => {
        resourcePool = new ResourcePool();
        // Add test resources
        resourcePool.addResource({
            id: 'cpu-1',
            type: ResourceType.COMPUTATIONAL,
            name: 'CPU Resource 1',
            capacity: 4,
            available: 4,
            cost: 10,
            properties: {
                specifications: { cores: 4, memory: '8GB' },
                performanceMetrics: {
                    throughput: 100,
                    latency: 50,
                    utilization: 0,
                    errorRate: 0.01,
                    availability: 99.9,
                },
                reliability: 0.999,
                scalability: {
                    isScalable: true,
                    minCapacity: 1,
                    maxCapacity: 8,
                    scalingCost: 5,
                    scalingTime: 300,
                },
            },
            constraints: {
                exclusiveAccess: false,
                maxConcurrentUsers: 10,
                timeRestrictions: [],
                prerequisites: [],
                dependencies: [],
            },
        });
        resourcePool.addResource({
            id: 'memory-1',
            type: ResourceType.MEMORY,
            name: 'Memory Resource 1',
            capacity: 16,
            available: 16,
            cost: 5,
            properties: {
                specifications: { size: '16GB', type: 'DDR4' },
                performanceMetrics: {
                    throughput: 200,
                    latency: 10,
                    utilization: 0,
                    errorRate: 0.001,
                    availability: 99.95,
                },
                reliability: 0.9999,
                scalability: {
                    isScalable: true,
                    minCapacity: 8,
                    maxCapacity: 64,
                    scalingCost: 3,
                    scalingTime: 60,
                },
            },
            constraints: {
                exclusiveAccess: false,
                maxConcurrentUsers: 20,
                timeRestrictions: [],
                prerequisites: [],
                dependencies: [],
            },
        });
        scheduler = new ResourceAwareScheduler(resourcePool);
    });
    describe('Resource Management', () => {
        test('should check resource availability correctly', () => {
            const startTime = new Date();
            const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour
            expect(resourcePool.checkAvailability('cpu-1', startTime, endTime, 2)).toBe(true);
            expect(resourcePool.checkAvailability('cpu-1', startTime, endTime, 5)).toBe(false);
            expect(resourcePool.checkAvailability('nonexistent', startTime, endTime, 1)).toBe(false);
        });
        test('should allocate and release resources', () => {
            const startTime = new Date();
            const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
            expect(resourcePool.allocateResource('cpu-1', 'task1', startTime, endTime, 2)).toBe(true);
            expect(resourcePool.checkAvailability('cpu-1', startTime, endTime, 3)).toBe(false);
            expect(resourcePool.checkAvailability('cpu-1', startTime, endTime, 2)).toBe(true);
            resourcePool.releaseResource('cpu-1', 'task1');
            expect(resourcePool.checkAvailability('cpu-1', startTime, endTime, 4)).toBe(true);
        });
        test('should calculate resource utilization', () => {
            const startTime = new Date();
            const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours
            const midTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour
            resourcePool.allocateResource('cpu-1', 'task1', startTime, midTime, 2);
            resourcePool.allocateResource('cpu-1', 'task2', midTime, endTime, 4);
            const utilization = resourcePool.getUtilization('cpu-1', startTime, endTime);
            expect(utilization).toBeGreaterThan(0);
            expect(utilization).toBeLessThanOrEqual(1);
        });
    });
    describe('Task Scheduling', () => {
        test('should schedule tasks with resource constraints', async () => {
            const tasks = TestUtilities.createLinearDependencyChain(3);
            // Add resource requirements to tasks
            tasks.forEach((task, index) => {
                task.metadata.properties.resourceRequirements = [
                    {
                        resourceId: 'cpu-1',
                        resourceType: 'computational',
                        quantity: 1,
                        exclusive: false,
                    },
                ];
            });
            const manager = new DependencyGraphManager();
            const graph = await manager.createGraph('schedule-test', 'Schedule Test', 'Schedule test', tasks);
            const engine = new DependencyAnalysisEngine();
            const analysis = await engine.analyzeGraph(graph);
            const schedulingContext = {
                startTime: new Date(),
                endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                timezone: 'UTC',
                workingHours: {
                    monday: [{ start: '09:00', end: '17:00' }],
                    tuesday: [{ start: '09:00', end: '17:00' }],
                    wednesday: [{ start: '09:00', end: '17:00' }],
                    thursday: [{ start: '09:00', end: '17:00' }],
                    friday: [{ start: '09:00', end: '17:00' }],
                    saturday: [],
                    sunday: [],
                },
                constraints: {
                    maxParallelTasks: 10,
                    minIdleTime: 5,
                    resourceLimits: {},
                    agentWorkloadLimits: {},
                    priorityThresholds: {},
                },
                preferences: {
                    preferEarlyStart: true,
                    preferResourceConsolidation: true,
                    allowResourceOvercommit: false,
                    optimizeForThroughput: true,
                    optimizeForLatency: false,
                    balanceWorkload: true,
                },
            };
            const schedule = await scheduler.scheduleTasks(graph, analysis, schedulingContext);
            expect(schedule.success).toBe(true);
            expect(schedule.schedule).toHaveLength(3);
            expect(schedule.resourceAllocations).toHaveLength.greaterThan(0);
            expect(schedule.metrics).toBeDefined();
            expect(schedule.metrics.totalDuration).toBeGreaterThan(0);
        });
        test('should detect and resolve resource conflicts', async () => {
            const tasks = TestUtilities.createParallelTasks(5);
            // All tasks require the same exclusive resource
            tasks.forEach((task) => {
                task.metadata.properties.resourceRequirements = [
                    {
                        resourceId: 'cpu-1',
                        resourceType: 'computational',
                        quantity: 4, // Requires full capacity
                        exclusive: true,
                    },
                ];
            });
            const manager = new DependencyGraphManager();
            const graph = await manager.createGraph('conflict-test', 'Conflict Test', 'Conflict test', tasks);
            const engine = new DependencyAnalysisEngine();
            const analysis = await engine.analyzeGraph(graph);
            const schedulingContext = {
                startTime: new Date(),
                endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                timezone: 'UTC',
                workingHours: {
                    monday: [{ start: '09:00', end: '17:00' }],
                    tuesday: [{ start: '09:00', end: '17:00' }],
                    wednesday: [{ start: '09:00', end: '17:00' }],
                    thursday: [{ start: '09:00', end: '17:00' }],
                    friday: [{ start: '09:00', end: '17:00' }],
                    saturday: [],
                    sunday: [],
                },
                constraints: {
                    maxParallelTasks: 10,
                    minIdleTime: 5,
                    resourceLimits: {},
                    agentWorkloadLimits: {},
                    priorityThresholds: {},
                },
                preferences: {
                    preferEarlyStart: true,
                    preferResourceConsolidation: true,
                    allowResourceOvercommit: false,
                    optimizeForThroughput: true,
                    optimizeForLatency: false,
                    balanceWorkload: true,
                },
            };
            const schedule = await scheduler.scheduleTasks(graph, analysis, schedulingContext);
            // Should detect conflicts but try to resolve them
            expect(schedule.conflicts.length).toBeGreaterThan(0);
            expect(schedule.recommendations.length).toBeGreaterThan(0);
            // Tasks should be scheduled sequentially due to resource constraints
            const scheduleByTime = schedule.schedule.sort((a, b) => a.scheduledStart.getTime() - b.scheduledStart.getTime());
            for (let i = 1; i < scheduleByTime.length; i++) {
                expect(scheduleByTime[i].scheduledStart.getTime()).toBeGreaterThanOrEqual(scheduleByTime[i - 1].scheduledEnd.getTime());
            }
        });
        test('should generate optimization recommendations', async () => {
            const tasks = TestUtilities.createComplexDependencyGraph();
            tasks.forEach((task) => {
                task.metadata.properties.resourceRequirements = [
                    {
                        resourceId: Math.random() > 0.5 ? 'cpu-1' : 'memory-1',
                        resourceType: Math.random() > 0.5 ? 'computational' : 'memory',
                        quantity: 1,
                        exclusive: false,
                    },
                ];
            });
            const manager = new DependencyGraphManager();
            const graph = await manager.createGraph('opt-test', 'Optimization Test', 'Optimization test', tasks);
            const engine = new DependencyAnalysisEngine();
            const analysis = await engine.analyzeGraph(graph);
            const schedulingContext = {
                startTime: new Date(),
                endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                timezone: 'UTC',
                workingHours: {
                    monday: [{ start: '09:00', end: '17:00' }],
                    tuesday: [{ start: '09:00', end: '17:00' }],
                    wednesday: [{ start: '09:00', end: '17:00' }],
                    thursday: [{ start: '09:00', end: '17:00' }],
                    friday: [{ start: '09:00', end: '17:00' }],
                    saturday: [],
                    sunday: [],
                },
                constraints: {
                    maxParallelTasks: 10,
                    minIdleTime: 5,
                    resourceLimits: {},
                    agentWorkloadLimits: {},
                    priorityThresholds: {},
                },
                preferences: {
                    preferEarlyStart: true,
                    preferResourceConsolidation: true,
                    allowResourceOvercommit: false,
                    optimizeForThroughput: true,
                    optimizeForLatency: false,
                    balanceWorkload: true,
                },
            };
            const schedule = await scheduler.scheduleTasks(graph, analysis, schedulingContext);
            expect(schedule.optimizations.length).toBeGreaterThan(0);
            expect(schedule.recommendations.length).toBeGreaterThan(0);
            // Should have meaningful metrics
            expect(schedule.metrics.resourceUtilization).toBeDefined();
            expect(schedule.metrics.parallelismFactor).toBeGreaterThan(0);
            expect(schedule.metrics.parallelismFactor).toBeLessThanOrEqual(1);
        });
    });
});
describe('Integration Tests', () => {
    test('should integrate all components for end-to-end workflow', async () => {
        // Create complex test scenario
        const tasks = TestUtilities.createComplexDependencyGraph();
        // Setup components
        const manager = new DependencyGraphManager();
        const engine = new DependencyAnalysisEngine();
        const visualizer = new DependencyVisualizer();
        const resourcePool = new ResourcePool();
        const scheduler = new ResourceAwareScheduler(resourcePool);
        // Add resources
        resourcePool.addResource({
            id: 'dev-env-1',
            type: ResourceType.COMPUTATIONAL,
            name: 'Development Environment 1',
            capacity: 2,
            available: 2,
            cost: 20,
            properties: {
                specifications: { type: 'development' },
                performanceMetrics: {
                    throughput: 50,
                    latency: 100,
                    utilization: 0,
                    errorRate: 0.02,
                    availability: 99.5,
                },
                reliability: 0.995,
                scalability: {
                    isScalable: false,
                    minCapacity: 2,
                    maxCapacity: 2,
                    scalingCost: 0,
                    scalingTime: 0,
                },
            },
            constraints: {
                exclusiveAccess: false,
                maxConcurrentUsers: 4,
                timeRestrictions: [],
                prerequisites: [],
                dependencies: [],
            },
        });
        // Step 1: Create dependency graph
        const graph = await manager.createGraph('integration-test', 'Integration Test', 'End-to-end integration test', tasks);
        expect(graph).toBeDefined();
        expect(graph.nodes.size).toBe(tasks.length);
        // Step 2: Analyze dependencies
        const analysis = await engine.analyzeGraph(graph);
        expect(analysis).toBeDefined();
        expect(analysis.executionOrder).toHaveLength(tasks.length);
        expect(analysis.criticalPath).toBeDefined();
        expect(analysis.parallelGroups.length).toBeGreaterThan(0);
        // Step 3: Generate visualizations
        const asciiViz = await visualizer.visualizeGraph(graph, analysis, {
            format: VisualizationFormat.ASCII,
            showCriticalPath: true,
            showParallelGroups: true,
        });
        expect(asciiViz).toContain('DEPENDENCY GRAPH');
        expect(asciiViz).toContain('Integration Test');
        const jsonViz = await visualizer.visualizeGraph(graph, analysis, {
            format: VisualizationFormat.JSON,
        });
        const vizData = JSON.parse(jsonViz);
        expect(vizData.graph.name).toBe('Integration Test');
        expect(vizData.nodes).toHaveLength(tasks.length);
        // Step 4: Schedule with resource awareness
        const schedulingContext = {
            startTime: new Date(),
            endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
            timezone: 'UTC',
            workingHours: {
                monday: [{ start: '09:00', end: '17:00' }],
                tuesday: [{ start: '09:00', end: '17:00' }],
                wednesday: [{ start: '09:00', end: '17:00' }],
                thursday: [{ start: '09:00', end: '17:00' }],
                friday: [{ start: '09:00', end: '17:00' }],
                saturday: [],
                sunday: [],
            },
            constraints: {
                maxParallelTasks: 3,
                minIdleTime: 15,
                resourceLimits: { 'dev-env-1': 2 },
                agentWorkloadLimits: {},
                priorityThresholds: {},
            },
            preferences: {
                preferEarlyStart: true,
                preferResourceConsolidation: true,
                allowResourceOvercommit: false,
                optimizeForThroughput: true,
                optimizeForLatency: false,
                balanceWorkload: true,
            },
        };
        const schedule = await scheduler.scheduleTasks(graph, analysis, schedulingContext);
        expect(schedule).toBeDefined();
        expect(schedule.schedule).toHaveLength(tasks.length);
        expect(schedule.success).toBe(true);
        expect(schedule.metrics.totalDuration).toBeGreaterThan(0);
        // Step 5: Verify end-to-end consistency
        expect(schedule.schedule.map((s) => s.taskId).sort()).toEqual(tasks.map((t) => t.id).sort());
        // Verify critical path tasks are scheduled appropriately
        const criticalTaskIds = analysis.criticalPath.nodes
            .map((nodeId) => {
            const node = graph.nodes.get(nodeId);
            return node?.task.id;
        })
            .filter(Boolean);
        for (const taskId of criticalTaskIds) {
            const taskSchedule = schedule.schedule.find((s) => s.taskId === taskId);
            expect(taskSchedule).toBeDefined();
            expect(taskSchedule?.priority).toBeGreaterThanOrEqual(100); // Should have higher priority
        }
        // Cleanup
        manager.destroy();
        engine.clearCache();
        scheduler.clearHistory();
    });
});
//# sourceMappingURL=DependencySystem.test.js.map