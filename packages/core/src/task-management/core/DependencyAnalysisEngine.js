/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { DependencyGraph, DependencyNode, DependencyEdge, DependencyNodeId, DependencyEdgeId, CircularDependency, DependencyAnalysisResult, CriticalPath, ParallelGroup, OptimizationOpportunity, GraphValidationStatus, GraphValidationError, GraphValidationWarning, ViolationType, ViolationSeverity, NodeExecutionStatus, DependencyStatus, GraphErrorType, GraphWarningType, OptimizationType, OptimizationComplexity, Bottleneck, BreakingPoint } from '../types/Dependency.js';
/**
 * Advanced dependency analysis engine with intelligent graph processing
 */
export class DependencyAnalysisEngine {
    cache = new Map();
    analysisHistory = new Map();
    constructor() {
        console.log('DependencyAnalysisEngine initialized with advanced graph algorithms');
    }
    /**
     * Validates dependency graph for structural integrity and logical consistency
     */
    async validateGraph(graph) {
        const startTime = performance.now();
        console.log(`Validating dependency graph: ${graph.name}`);
        const errors = [];
        const warnings = [];
        const circularDependencies = [];
        try {
            // Check for circular dependencies using Tarjan's algorithm
            const cycles = await this.detectCircularDependencies(graph);
            circularDependencies.push(...cycles);
            if (cycles.length > 0) {
                errors.push({
                    id: `circular-deps-${Date.now()}`,
                    type: GraphErrorType.CIRCULAR_DEPENDENCY,
                    message: `Detected ${cycles.length} circular dependency cycles`,
                    affectedNodes: cycles.flatMap(cycle => cycle.cycle),
                    affectedEdges: cycles.flatMap(cycle => cycle.edges),
                    suggestedResolution: 'Break cycles using suggested breaking points'
                });
            }
            // Validate node references
            await this.validateNodeReferences(graph, errors, warnings);
            // Validate edge references
            await this.validateEdgeReferences(graph, errors, warnings);
            // Check for structural issues
            await this.validateGraphStructure(graph, errors, warnings);
            // Performance and optimization warnings
            await this.analyzePerformanceWarnings(graph, warnings);
            const validationResult = {
                isValid: errors.length === 0,
                validatedAt: new Date(),
                errors,
                warnings,
                circularDependencies
            };
            const duration = performance.now() - startTime;
            console.log(`Graph validation completed in ${duration.toFixed(2)}ms - Valid: ${validationResult.isValid}`);
            return validationResult;
        }
        catch (error) {
            console.error('Graph validation failed:', error);
            throw new Error(`Graph validation error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Detects circular dependencies using Tarjan's strongly connected components algorithm
     */
    async detectCircularDependencies(graph) {
        const circularDependencies = [];
        const visited = new Set();
        const inStack = new Set();
        const stack = [];
        const indices = new Map();
        const lowLinks = new Map();
        let index = 0;
        const tarjan = async (nodeId) => {
            indices.set(nodeId, index);
            lowLinks.set(nodeId, index);
            index++;
            stack.push(nodeId);
            inStack.add(nodeId);
            visited.add(nodeId);
            const node = graph.nodes.get(nodeId);
            if (!node)
                return;
            // Visit all outgoing edges (dependencies this node depends on)
            for (const edgeId of node.outgoingEdges) {
                const edge = graph.edges.get(edgeId);
                if (!edge)
                    continue;
                const targetNodeId = edge.to;
                if (!visited.has(targetNodeId)) {
                    await tarjan(targetNodeId);
                    const currentLowLink = lowLinks.get(nodeId) ?? 0;
                    const targetLowLink = lowLinks.get(targetNodeId) ?? 0;
                    lowLinks.set(nodeId, Math.min(currentLowLink, targetLowLink));
                }
                else if (inStack.has(targetNodeId)) {
                    const currentLowLink = lowLinks.get(nodeId) ?? 0;
                    const targetIndex = indices.get(targetNodeId) ?? 0;
                    lowLinks.set(nodeId, Math.min(currentLowLink, targetIndex));
                }
            }
            // If nodeId is a root node, pop the stack and create an SCC
            if (lowLinks.get(nodeId) === indices.get(nodeId)) {
                const stronglyConnectedComponent = [];
                let w;
                do {
                    w = stack.pop();
                    inStack.delete(w);
                    stronglyConnectedComponent.push(w);
                } while (w !== nodeId);
                // If SCC has more than one node, it's a circular dependency
                if (stronglyConnectedComponent.length > 1) {
                    const cycleEdges = await this.findCycleEdges(graph, stronglyConnectedComponent);
                    const breakingPoints = await this.suggestBreakingPoints(graph, cycleEdges);
                    circularDependencies.push({
                        id: `cycle-${circularDependencies.length + 1}-${Date.now()}`,
                        cycle: stronglyConnectedComponent,
                        edges: cycleEdges,
                        length: stronglyConnectedComponent.length,
                        detectedAt: new Date(),
                        breakingPoints
                    });
                }
            }
        };
        // Run Tarjan's algorithm on all unvisited nodes
        for (const nodeId of graph.nodes.keys()) {
            if (!visited.has(nodeId)) {
                await tarjan(nodeId);
            }
        }
        console.log(`Circular dependency detection completed - Found ${circularDependencies.length} cycles`);
        return circularDependencies;
    }
    /**
     * Performs topological sorting to determine optimal execution order
     */
    async topologicalSort(graph) {
        console.log('Performing topological sort for execution order');
        const inDegree = new Map();
        const result = [];
        const queue = [];
        // Initialize in-degree count for all nodes
        for (const nodeId of graph.nodes.keys()) {
            inDegree.set(nodeId, 0);
        }
        // Calculate in-degree for each node
        for (const edge of graph.edges.values()) {
            const currentInDegree = inDegree.get(edge.to) ?? 0;
            inDegree.set(edge.to, currentInDegree + 1);
        }
        // Find nodes with no incoming edges
        for (const [nodeId, degree] of inDegree.entries()) {
            if (degree === 0) {
                queue.push(nodeId);
            }
        }
        // Process nodes in topological order
        while (queue.length > 0) {
            const currentNode = queue.shift();
            result.push(currentNode);
            const node = graph.nodes.get(currentNode);
            if (!node)
                continue;
            // Reduce in-degree of dependent nodes
            for (const edgeId of node.outgoingEdges) {
                const edge = graph.edges.get(edgeId);
                if (!edge)
                    continue;
                const targetNodeId = edge.to;
                const currentInDegree = inDegree.get(targetNodeId) ?? 0;
                const newInDegree = currentInDegree - 1;
                inDegree.set(targetNodeId, newInDegree);
                if (newInDegree === 0) {
                    queue.push(targetNodeId);
                }
            }
        }
        // Check if all nodes were processed (no cycles)
        if (result.length !== graph.nodes.size) {
            throw new Error('Graph contains cycles - topological sort impossible');
        }
        console.log(`Topological sort completed - Order: [${result.slice(0, 5).join(', ')}${result.length > 5 ? '...' : ''}]`);
        return result;
    }
    /**
     * Identifies parallel execution opportunities
     */
    async identifyParallelGroups(graph) {
        console.log('Identifying parallel execution opportunities');
        const executionOrder = await this.topologicalSort(graph);
        const parallelGroups = [];
        const processed = new Set();
        let level = 0;
        while (processed.size < executionOrder.length) {
            const currentLevelNodes = [];
            // Find nodes that can execute at this level (all dependencies satisfied)
            for (const nodeId of executionOrder) {
                if (processed.has(nodeId))
                    continue;
                const node = graph.nodes.get(nodeId);
                if (!node)
                    continue;
                // Check if all dependencies are satisfied (in processed set)
                const canExecute = node.incomingEdges.every(edgeId => {
                    const edge = graph.edges.get(edgeId);
                    return edge ? processed.has(edge.from) : true;
                });
                if (canExecute) {
                    currentLevelNodes.push(nodeId);
                }
            }
            if (currentLevelNodes.length === 0) {
                // No more nodes can be processed - should not happen with valid topological sort
                break;
            }
            // Create parallel group for this level
            const resourceRequirements = currentLevelNodes
                .map(nodeId => graph.nodes.get(nodeId)?.metadata.resourceRequirements ?? [])
                .flat();
            const estimatedDuration = Math.max(...currentLevelNodes.map(nodeId => {
                const node = graph.nodes.get(nodeId);
                return node?.task.estimatedEffort ?? 0;
            }));
            parallelGroups.push({
                id: `parallel-group-${level}`,
                nodes: currentLevelNodes,
                level,
                resourceRequirements,
                estimatedDuration
            });
            // Mark nodes as processed
            currentLevelNodes.forEach(nodeId => processed.add(nodeId));
            level++;
        }
        console.log(`Identified ${parallelGroups.length} parallel execution groups`);
        return parallelGroups;
    }
    /**
     * Calculates critical path using Forward and Backward Pass algorithms
     */
    async calculateCriticalPath(graph) {
        console.log('Calculating critical path using CPM algorithm');
        const executionOrder = await this.topologicalSort(graph);
        const earlyStart = new Map();
        const earlyFinish = new Map();
        const lateStart = new Map();
        const lateFinish = new Map();
        // Forward pass - calculate early start and early finish times
        for (const nodeId of executionOrder) {
            const node = graph.nodes.get(nodeId);
            if (!node)
                continue;
            let maxEarlyFinish = 0;
            // Find maximum early finish time of all predecessor nodes
            for (const edgeId of node.incomingEdges) {
                const edge = graph.edges.get(edgeId);
                if (!edge)
                    continue;
                const predecessorEarlyFinish = earlyFinish.get(edge.from) ?? 0;
                maxEarlyFinish = Math.max(maxEarlyFinish, predecessorEarlyFinish);
            }
            earlyStart.set(nodeId, maxEarlyFinish);
            earlyFinish.set(nodeId, maxEarlyFinish + (node.task.estimatedEffort ?? 0));
        }
        // Find project finish time
        const projectFinishTime = Math.max(...Array.from(earlyFinish.values()));
        // Backward pass - calculate late start and late finish times
        const reversedOrder = [...executionOrder].reverse();
        for (const nodeId of reversedOrder) {
            const node = graph.nodes.get(nodeId);
            if (!node)
                continue;
            let minLateStart = projectFinishTime;
            // For nodes with no successors, late finish = project finish time
            if (node.outgoingEdges.length === 0) {
                lateFinish.set(nodeId, projectFinishTime);
            }
            else {
                // Find minimum late start time of all successor nodes
                for (const edgeId of node.outgoingEdges) {
                    const edge = graph.edges.get(edgeId);
                    if (!edge)
                        continue;
                    const successorLateStart = lateStart.get(edge.to) ?? projectFinishTime;
                    minLateStart = Math.min(minLateStart, successorLateStart);
                }
                lateFinish.set(nodeId, minLateStart);
            }
            lateStart.set(nodeId, (lateFinish.get(nodeId) ?? 0) - (node.task.estimatedEffort ?? 0));
        }
        // Identify critical path nodes (where early start = late start)
        const criticalPathNodes = [];
        const bottlenecks = [];
        for (const nodeId of executionOrder) {
            const nodeEarlyStart = earlyStart.get(nodeId) ?? 0;
            const nodeLateStart = lateStart.get(nodeId) ?? 0;
            if (Math.abs(nodeEarlyStart - nodeLateStart) < 0.001) { // Consider floating point precision
                criticalPathNodes.push(nodeId);
                const node = graph.nodes.get(nodeId);
                if (node && (node.task.estimatedEffort ?? 0) > 0) {
                    // Identify bottlenecks (high duration tasks on critical path)
                    const avgDuration = projectFinishTime / executionOrder.length;
                    const taskDuration = node.task.estimatedEffort ?? 0;
                    if (taskDuration > avgDuration * 1.5) {
                        bottlenecks.push({
                            nodeId,
                            severity: taskDuration / avgDuration,
                            description: `Task duration (${taskDuration}min) significantly above average (${avgDuration.toFixed(1)}min)`,
                            suggestions: [
                                'Consider breaking down into smaller tasks',
                                'Optimize task implementation',
                                'Allocate more resources',
                                'Parallelize sub-tasks where possible'
                            ]
                        });
                    }
                }
            }
        }
        const criticalPath = {
            nodes: criticalPathNodes,
            duration: projectFinishTime,
            bottlenecks,
            optimizationPotential: bottlenecks.reduce((sum, bottleneck) => sum + (bottleneck.severity - 1), 0)
        };
        console.log(`Critical path calculated - Duration: ${projectFinishTime}min, Nodes: ${criticalPathNodes.length}`);
        return criticalPath;
    }
    /**
     * Performs comprehensive dependency analysis
     */
    async analyzeGraph(graph) {
        const startTime = performance.now();
        console.log(`Starting comprehensive analysis of graph: ${graph.name}`);
        try {
            // Validate graph first
            const validationStatus = await this.validateGraph(graph);
            if (!validationStatus.isValid) {
                throw new Error(`Graph validation failed: ${validationStatus.errors.map(e => e.message).join(', ')}`);
            }
            // Perform core analyses
            const [executionOrder, criticalPath, parallelGroups] = await Promise.all([
                this.topologicalSort(graph),
                this.calculateCriticalPath(graph),
                this.identifyParallelGroups(graph)
            ]);
            // Identify optimization opportunities
            const optimizations = await this.identifyOptimizations(graph, criticalPath, parallelGroups);
            // Generate resource allocation plan
            const resourcePlan = await this.generateResourcePlan(graph, parallelGroups);
            // Generate scheduling recommendations
            const schedulingRecommendations = await this.generateSchedulingRecommendations(graph, criticalPath, parallelGroups, optimizations);
            const result = {
                analyzedAt: new Date(),
                executionOrder,
                criticalPath,
                parallelGroups,
                optimizations,
                resourcePlan,
                schedulingRecommendations
            };
            // Cache results for future use
            const cacheKey = `analysis-${graph.id}-${graph.timestamps.updatedAt.getTime()}`;
            this.cache.set(cacheKey, result);
            // Store in history
            const history = this.analysisHistory.get(graph.id) ?? [];
            history.push(result);
            if (history.length > 10) { // Keep last 10 analyses
                history.shift();
            }
            this.analysisHistory.set(graph.id, history);
            const duration = performance.now() - startTime;
            console.log(`Graph analysis completed in ${duration.toFixed(2)}ms`);
            console.log(`  - Execution order: ${executionOrder.length} tasks`);
            console.log(`  - Critical path: ${criticalPath.duration}min duration`);
            console.log(`  - Parallel groups: ${parallelGroups.length} groups`);
            console.log(`  - Optimizations: ${optimizations.length} opportunities`);
            return result;
        }
        catch (error) {
            console.error('Graph analysis failed:', error);
            throw new Error(`Analysis error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Identifies optimization opportunities in the dependency graph
     */
    async identifyOptimizations(graph, criticalPath, parallelGroups) {
        const optimizations = [];
        // Parallelization opportunities
        for (const group of parallelGroups) {
            if (group.nodes.length === 1) {
                const node = graph.nodes.get(group.nodes[0]);
                if (node && (node.task.estimatedEffort ?? 0) > 60) { // Tasks longer than 1 hour
                    optimizations.push({
                        id: `parallel-${group.id}`,
                        type: OptimizationType.PARALLELIZATION,
                        improvement: 25,
                        complexity: OptimizationComplexity.MEDIUM,
                        description: `Single large task in parallel group could be broken down`,
                        steps: [
                            'Analyze task for sub-task opportunities',
                            'Create parallel sub-tasks',
                            'Update dependencies accordingly'
                        ]
                    });
                }
            }
        }
        // Resource optimization
        const resourceCounts = new Map();
        for (const node of graph.nodes.values()) {
            for (const resource of node.metadata.resourceRequirements) {
                resourceCounts.set(resource.resourceType, (resourceCounts.get(resource.resourceType) ?? 0) + 1);
            }
        }
        for (const [resourceType, count] of resourceCounts.entries()) {
            if (count > graph.nodes.size * 0.7) { // More than 70% of tasks use this resource
                optimizations.push({
                    id: `resource-${resourceType}`,
                    type: OptimizationType.RESOURCE_OPTIMIZATION,
                    improvement: 15,
                    complexity: OptimizationComplexity.LOW,
                    description: `High contention for ${resourceType} resource`,
                    steps: [
                        'Scale up resource availability',
                        'Implement resource pooling',
                        'Consider alternative resources'
                    ]
                });
            }
        }
        // Dependency reduction opportunities
        for (const node of graph.nodes.values()) {
            if (node.incomingEdges.length > 5) { // Highly dependent tasks
                optimizations.push({
                    id: `dep-reduction-${node.id}`,
                    type: OptimizationType.DEPENDENCY_REDUCTION,
                    improvement: 20,
                    complexity: OptimizationComplexity.HIGH,
                    description: `Task has ${node.incomingEdges.length} dependencies - consider reducing`,
                    steps: [
                        'Review dependency necessity',
                        'Combine related dependencies',
                        'Eliminate redundant dependencies'
                    ]
                });
            }
        }
        return optimizations;
    }
    /**
     * Generates resource allocation plan
     */
    async generateResourcePlan(graph, parallelGroups) {
        // Simplified resource plan generation
        // In a full implementation, this would use resource scheduling algorithms
        return [];
    }
    /**
     * Generates scheduling recommendations
     */
    async generateSchedulingRecommendations(graph, criticalPath, parallelGroups, optimizations) {
        // Simplified recommendation generation
        // In a full implementation, this would analyze current scheduling and suggest improvements
        return [];
    }
    /**
     * Helper method to validate node references
     */
    async validateNodeReferences(graph, errors, warnings) {
        for (const node of graph.nodes.values()) {
            // Check for orphaned nodes (no incoming or outgoing edges)
            if (node.incomingEdges.length === 0 && node.outgoingEdges.length === 0) {
                warnings.push({
                    id: `orphaned-${node.id}`,
                    type: GraphWarningType.INEFFICIENT_STRUCTURE,
                    message: `Node ${node.id} has no dependencies or dependents`,
                    severity: ViolationSeverity.LOW,
                    affectedNodes: [node.id]
                });
            }
        }
    }
    /**
     * Helper method to validate edge references
     */
    async validateEdgeReferences(graph, errors, warnings) {
        for (const edge of graph.edges.values()) {
            // Check if referenced nodes exist
            if (!graph.nodes.has(edge.from)) {
                errors.push({
                    id: `invalid-from-${edge.id}`,
                    type: GraphErrorType.INVALID_EDGE,
                    message: `Edge ${edge.id} references non-existent source node ${edge.from}`,
                    affectedNodes: [],
                    affectedEdges: [edge.id]
                });
            }
            if (!graph.nodes.has(edge.to)) {
                errors.push({
                    id: `invalid-to-${edge.id}`,
                    type: GraphErrorType.INVALID_EDGE,
                    message: `Edge ${edge.id} references non-existent target node ${edge.to}`,
                    affectedNodes: [],
                    affectedEdges: [edge.id]
                });
            }
        }
    }
    /**
     * Helper method to validate graph structure
     */
    async validateGraphStructure(graph, errors, warnings) {
        // Check for very long dependency chains
        const maxChainLength = await this.findLongestPath(graph);
        if (maxChainLength > 20) {
            warnings.push({
                id: `long-chain-${Date.now()}`,
                type: GraphWarningType.LONG_CHAIN,
                message: `Dependency chain length (${maxChainLength}) may cause scheduling delays`,
                severity: ViolationSeverity.MEDIUM,
                affectedNodes: []
            });
        }
    }
    /**
     * Helper method to analyze performance warnings
     */
    async analyzePerformanceWarnings(graph, warnings) {
        const nodeCount = graph.nodes.size;
        const edgeCount = graph.edges.size;
        const density = edgeCount / (nodeCount * (nodeCount - 1));
        if (density > 0.3) {
            warnings.push({
                id: `high-density-${Date.now()}`,
                type: GraphWarningType.INEFFICIENT_STRUCTURE,
                message: `Graph density (${(density * 100).toFixed(1)}%) is high - may impact performance`,
                severity: ViolationSeverity.LOW,
                affectedNodes: []
            });
        }
    }
    /**
     * Helper method to find cycle edges
     */
    async findCycleEdges(graph, cycle) {
        const cycleEdges = [];
        const cycleSet = new Set(cycle);
        for (const edge of graph.edges.values()) {
            if (cycleSet.has(edge.from) && cycleSet.has(edge.to)) {
                cycleEdges.push(edge.id);
            }
        }
        return cycleEdges;
    }
    /**
     * Helper method to suggest cycle breaking points
     */
    async suggestBreakingPoints(graph, cycleEdges) {
        const breakingPoints = [];
        for (const edgeId of cycleEdges) {
            const edge = graph.edges.get(edgeId);
            if (!edge)
                continue;
            // Calculate breaking cost based on dependency strength and impact
            let cost = 1;
            if (edge.constraint.strength === 'hard')
                cost = 10;
            else if (edge.constraint.strength === 'soft')
                cost = 5;
            else if (edge.constraint.strength === 'hint')
                cost = 1;
            breakingPoints.push({
                edgeId,
                cost,
                justification: `Breaking ${edge.constraint.strength} dependency from ${edge.from} to ${edge.to}`,
                alternatives: [
                    'Reorder task execution',
                    'Split dependent task',
                    'Add intermediate task',
                    'Change dependency type'
                ]
            });
        }
        // Sort by cost (lowest cost first)
        return breakingPoints.sort((a, b) => a.cost - b.cost);
    }
    /**
     * Helper method to find longest path in graph
     */
    async findLongestPath(graph) {
        const topologicalOrder = await this.topologicalSort(graph);
        const distances = new Map();
        // Initialize distances
        for (const nodeId of topologicalOrder) {
            distances.set(nodeId, 0);
        }
        // Calculate longest distances
        for (const nodeId of topologicalOrder) {
            const node = graph.nodes.get(nodeId);
            if (!node)
                continue;
            const currentDistance = distances.get(nodeId) ?? 0;
            for (const edgeId of node.outgoingEdges) {
                const edge = graph.edges.get(edgeId);
                if (!edge)
                    continue;
                const targetDistance = distances.get(edge.to) ?? 0;
                distances.set(edge.to, Math.max(targetDistance, currentDistance + 1));
            }
        }
        return Math.max(...Array.from(distances.values()));
    }
    /**
     * Clears analysis cache
     */
    clearCache() {
        this.cache.clear();
        console.log('Dependency analysis cache cleared');
    }
    /**
     * Gets analysis history for a graph
     */
    getAnalysisHistory(graphId) {
        return this.analysisHistory.get(graphId) ?? [];
    }
}
//# sourceMappingURL=DependencyAnalysisEngine.js.map