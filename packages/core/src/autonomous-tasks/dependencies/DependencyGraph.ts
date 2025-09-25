import { Task } from '../types/TaskTypes';
import { DetectedDependency } from './DependencyAnalyzer';

/**
 * Graph node representing a task in the dependency graph
 */
export interface GraphNode {
  /** Task ID */
  id: string;
  /** Associated task */
  task: Task;
  /** Incoming edges (dependencies) */
  inEdges: GraphEdge[];
  /** Outgoing edges (dependents) */
  outEdges: GraphEdge[];
  /** Node level in the graph (0 = no dependencies) */
  level: number;
  /** Critical path indicator */
  onCriticalPath: boolean;
  /** Earliest start time */
  earliestStart: number;
  /** Latest start time */
  latestStart: number;
  /** Float/slack time */
  float: number;
}

/**
 * Graph edge representing a dependency relationship
 */
export interface GraphEdge {
  /** Source node ID */
  from: string;
  /** Target node ID */
  to: string;
  /** Dependency information */
  dependency: DetectedDependency;
  /** Edge weight for optimization */
  weight: number;
  /** Critical path indicator */
  onCriticalPath: boolean;
}

/**
 * Circular dependency cycle information
 */
export interface DependencyCycle {
  /** Nodes involved in the cycle */
  nodes: string[];
  /** Total cycle weight */
  weight: number;
  /** Cycle breaking recommendations */
  breakingOptions: CycleBreakingOption[];
}

/**
 * Options for breaking dependency cycles
 */
export interface CycleBreakingOption {
  /** Edge to remove to break the cycle */
  edgeToRemove: GraphEdge;
  /** Impact score of removing this edge */
  impactScore: number;
  /** Reason for this breaking option */
  reason: string;
  /** Alternative approaches */
  alternatives: string[];
}

/**
 * Graph validation results
 */
export interface GraphValidationResult {
  /** Whether the graph is valid */
  isValid: boolean;
  /** Detected issues */
  issues: GraphIssue[];
  /** Performance metrics */
  metrics: GraphMetrics;
  /** Validation recommendations */
  recommendations: string[];
}

/**
 * Graph validation issue
 */
export interface GraphIssue {
  /** Issue type */
  type: 'circular_dependency' | 'orphaned_node' | 'excessive_fan_out' | 'long_path' | 'resource_conflict';
  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Issue description */
  description: string;
  /** Affected nodes */
  affectedNodes: string[];
  /** Suggested fixes */
  suggestedFixes: string[];
}

/**
 * Graph performance metrics
 */
export interface GraphMetrics {
  /** Total number of nodes */
  nodeCount: number;
  /** Total number of edges */
  edgeCount: number;
  /** Average fan-out per node */
  averageFanOut: number;
  /** Maximum path length */
  maxPathLength: number;
  /** Graph density */
  density: number;
  /** Critical path length */
  criticalPathLength: number;
  /** Number of strongly connected components */
  stronglyConnectedComponents: number;
}

/**
 * Dependency graph for task management
 * Provides graph construction, validation, and analysis capabilities
 */
export class DependencyGraph {
  private nodes: Map&lt;string, GraphNode&gt;;
  private edges: Map&lt;string, GraphEdge&gt;;
  private adjacencyList: Map&lt;string, Set&lt;string&gt;&gt;;
  private reverseAdjacencyList: Map&lt;string, Set&lt;string&gt;&gt;;
  private criticalPath: string[];

  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
    this.adjacencyList = new Map();
    this.reverseAdjacencyList = new Map();
    this.criticalPath = [];
  }

  /**
   * Build dependency graph from tasks and dependencies
   */
  async buildGraph(tasks: Task[], dependencies: DetectedDependency[]): Promise&lt;void&gt; {
    const logger = this.getLogger();

    logger.info(`Building dependency graph with ${tasks.length} tasks and ${dependencies.length} dependencies`);

    // Clear existing graph
    this.clear();

    // Create nodes for all tasks
    for (const task of tasks) {
      this.addNode(task);
    }

    // Add edges for all dependencies
    for (const dependency of dependencies) {
      this.addEdge(dependency);
    }

    // Calculate graph properties
    await this.calculateLevels();
    await this.calculateCriticalPath();
    await this.calculateFloatTimes();

    logger.info('Dependency graph built successfully', {
      nodes: this.nodes.size,
      edges: this.edges.size,
      criticalPathLength: this.criticalPath.length
    });
  }

  /**
   * Add a task node to the graph
   */
  addNode(task: Task): void {
    if (this.nodes.has(task.id)) {
      return; // Node already exists
    }

    const node: GraphNode = {
      id: task.id,
      task,
      inEdges: [],
      outEdges: [],
      level: 0,
      onCriticalPath: false,
      earliestStart: 0,
      latestStart: 0,
      float: 0,
    };

    this.nodes.set(task.id, node);
    this.adjacencyList.set(task.id, new Set());
    this.reverseAdjacencyList.set(task.id, new Set());
  }

  /**
   * Add a dependency edge to the graph
   */
  addEdge(dependency: DetectedDependency): void {
    const fromNode = this.nodes.get(dependency.from);
    const toNode = this.nodes.get(dependency.to);

    if (!fromNode || !toNode) {
      console.warn(`Cannot add edge: missing node(s) ${dependency.from} → ${dependency.to}`);
      return;
    }

    const edgeId = `${dependency.from}-${dependency.to}`;

    if (this.edges.has(edgeId)) {
      return; // Edge already exists
    }

    const edge: GraphEdge = {
      from: dependency.from,
      to: dependency.to,
      dependency,
      weight: this.calculateEdgeWeight(dependency),
      onCriticalPath: false,
    };

    this.edges.set(edgeId, edge);
    fromNode.outEdges.push(edge);
    toNode.inEdges.push(edge);

    this.adjacencyList.get(dependency.from)!.add(dependency.to);
    this.reverseAdjacencyList.get(dependency.to)!.add(dependency.from);
  }

  /**
   * Remove a dependency edge from the graph
   */
  removeEdge(from: string, to: string): boolean {
    const edgeId = `${from}-${to}`;
    const edge = this.edges.get(edgeId);

    if (!edge) {
      return false;
    }

    const fromNode = this.nodes.get(from);
    const toNode = this.nodes.get(to);

    if (fromNode && toNode) {
      fromNode.outEdges = fromNode.outEdges.filter(e =&gt; e !== edge);
      toNode.inEdges = toNode.inEdges.filter(e =&gt; e !== edge);
    }

    this.edges.delete(edgeId);
    this.adjacencyList.get(from)?.delete(to);
    this.reverseAdjacencyList.get(to)?.delete(from);

    return true;
  }

  /**
   * Validate the dependency graph
   */
  async validateGraph(): Promise&lt;GraphValidationResult&gt; {
    const logger = this.getLogger();
    const issues: GraphIssue[] = [];
    const startTime = Date.now();

    logger.info('Starting graph validation');

    // Check for circular dependencies
    const cycles = await this.detectStronglyConnectedComponents();
    for (const cycle of cycles) {
      if (cycle.nodes.length &gt; 1) {
        issues.push({
          type: 'circular_dependency',
          severity: 'critical',
          description: `Circular dependency detected involving ${cycle.nodes.length} tasks`,
          affectedNodes: cycle.nodes,
          suggestedFixes: cycle.breakingOptions.map(option =&gt; option.reason),
        });
      }
    }

    // Check for orphaned nodes
    const orphanedNodes = this.findOrphanedNodes();
    if (orphanedNodes.length &gt; 0) {
      issues.push({
        type: 'orphaned_node',
        severity: 'medium',
        description: `Found ${orphanedNodes.length} orphaned nodes with no connections`,
        affectedNodes: orphanedNodes,
        suggestedFixes: ['Review task relationships', 'Add explicit dependencies', 'Remove unnecessary tasks'],
      });
    }

    // Check for excessive fan-out
    const highFanOutNodes = this.findHighFanOutNodes(5);
    for (const nodeId of highFanOutNodes) {
      const node = this.nodes.get(nodeId);
      if (node) {
        issues.push({
          type: 'excessive_fan_out',
          severity: 'medium',
          description: `Task has excessive dependencies (${node.outEdges.length})`,
          affectedNodes: [nodeId],
          suggestedFixes: ['Break down into smaller tasks', 'Reduce coupling', 'Review task granularity'],
        });
      }
    }

    // Check for excessively long dependency paths
    const longPaths = this.findLongPaths(10);
    for (const path of longPaths) {
      issues.push({
        type: 'long_path',
        severity: 'low',
        description: `Dependency chain is very long (${path.length} tasks)`,
        affectedNodes: path,
        suggestedFixes: ['Parallelize independent tasks', 'Review dependency necessity', 'Break down complex tasks'],
      });
    }

    const metrics = this.calculateMetrics();
    const recommendations = this.generateRecommendations(issues, metrics);

    const validationTime = Date.now() - startTime;

    logger.info(`Graph validation completed in ${validationTime}ms`, {
      issueCount: issues.length,
      criticalIssues: issues.filter(i =&gt; i.severity === 'critical').length,
      recommendations: recommendations.length
    });

    return {
      isValid: issues.filter(i =&gt; i.severity === 'critical').length === 0,
      issues,
      metrics,
      recommendations,
    };
  }

  /**
   * Detect circular dependencies using Tarjan's algorithm
   */
  async detectStronglyConnectedComponents(): Promise&lt;DependencyCycle[]&gt; {
    const index = new Map&lt;string, number&gt;();
    const lowLink = new Map&lt;string, number&gt;();
    const onStack = new Set&lt;string&gt;();
    const stack: string[] = [];
    const components: string[][] = [];
    let currentIndex = 0;

    const strongConnect = (nodeId: string): void =&gt; {
      index.set(nodeId, currentIndex);
      lowLink.set(nodeId, currentIndex);
      currentIndex++;
      stack.push(nodeId);
      onStack.add(nodeId);

      const neighbors = this.adjacencyList.get(nodeId) || new Set();
      for (const neighborId of neighbors) {
        if (!index.has(neighborId)) {
          strongConnect(neighborId);
          lowLink.set(nodeId, Math.min(lowLink.get(nodeId)!, lowLink.get(neighborId)!));
        } else if (onStack.has(neighborId)) {
          lowLink.set(nodeId, Math.min(lowLink.get(nodeId)!, index.get(neighborId)!));
        }
      }

      if (lowLink.get(nodeId) === index.get(nodeId)) {
        const component: string[] = [];
        let w: string;
        do {
          w = stack.pop()!;
          onStack.delete(w);
          component.push(w);
        } while (w !== nodeId);
        components.push(component);
      }
    };

    for (const nodeId of this.nodes.keys()) {
      if (!index.has(nodeId)) {
        strongConnect(nodeId);
      }
    }

    // Convert components to cycles and generate breaking options
    const cycles: DependencyCycle[] = [];
    for (const component of components) {
      if (component.length &gt; 1) {
        const cycle: DependencyCycle = {
          nodes: component,
          weight: this.calculateCycleWeight(component),
          breakingOptions: this.generateCycleBreakingOptions(component),
        };
        cycles.push(cycle);
      }
    }

    return cycles;
  }

  /**
   * Calculate node levels (topological ordering)
   */
  private async calculateLevels(): Promise&lt;void&gt; {
    const inDegree = new Map&lt;string, number&gt;();
    const queue: string[] = [];

    // Initialize in-degrees
    for (const nodeId of this.nodes.keys()) {
      inDegree.set(nodeId, this.nodes.get(nodeId)!.inEdges.length);
      if (inDegree.get(nodeId) === 0) {
        queue.push(nodeId);
        this.nodes.get(nodeId)!.level = 0;
      }
    }

    // Process nodes in topological order
    while (queue.length &gt; 0) {
      const currentId = queue.shift()!;
      const currentNode = this.nodes.get(currentId)!;

      for (const edge of currentNode.outEdges) {
        const neighborId = edge.to;
        const neighborNode = this.nodes.get(neighborId)!;
        const newInDegree = inDegree.get(neighborId)! - 1;
        inDegree.set(neighborId, newInDegree);

        neighborNode.level = Math.max(neighborNode.level, currentNode.level + 1);

        if (newInDegree === 0) {
          queue.push(neighborId);
        }
      }
    }
  }

  /**
   * Calculate critical path through the graph
   */
  private async calculateCriticalPath(): Promise&lt;void&gt; {
    // Forward pass: calculate earliest start times
    const sortedNodes = Array.from(this.nodes.values()).sort((a, b) =&gt; a.level - b.level);

    for (const node of sortedNodes) {
      node.earliestStart = 0;
      for (const edge of node.inEdges) {
        const predNode = this.nodes.get(edge.from)!;
        const predFinish = predNode.earliestStart + (predNode.task.estimated_effort || 1);
        node.earliestStart = Math.max(node.earliestStart, predFinish);
      }
    }

    // Find project completion time
    const projectCompletion = Math.max(...sortedNodes.map(node =&gt;
      node.earliestStart + (node.task.estimated_effort || 1)
    ));

    // Backward pass: calculate latest start times
    const reverseSortedNodes = [...sortedNodes].reverse();

    for (const node of reverseSortedNodes) {
      if (node.outEdges.length === 0) {
        node.latestStart = projectCompletion - (node.task.estimated_effort || 1);
      } else {
        node.latestStart = Math.min(...node.outEdges.map(edge =&gt; {
          const succNode = this.nodes.get(edge.to)!;
          return succNode.latestStart;
        }));
      }
    }

    // Identify critical path
    this.criticalPath = [];
    for (const node of this.nodes.values()) {
      node.onCriticalPath = Math.abs(node.earliestStart - node.latestStart) &lt; 0.01;
      if (node.onCriticalPath) {
        this.criticalPath.push(node.id);
      }

      // Mark critical edges
      for (const edge of node.outEdges) {
        const toNode = this.nodes.get(edge.to)!;
        edge.onCriticalPath = node.onCriticalPath && toNode.onCriticalPath &&
          Math.abs((node.earliestStart + (node.task.estimated_effort || 1)) - toNode.earliestStart) &lt; 0.01;
      }
    }
  }

  /**
   * Calculate float times for all nodes
   */
  private async calculateFloatTimes(): Promise&lt;void&gt; {
    for (const node of this.nodes.values()) {
      node.float = node.latestStart - node.earliestStart;
    }
  }

  /**
   * Find orphaned nodes (nodes with no incoming or outgoing edges)
   */
  private findOrphanedNodes(): string[] {
    const orphaned: string[] = [];
    for (const node of this.nodes.values()) {
      if (node.inEdges.length === 0 && node.outEdges.length === 0) {
        orphaned.push(node.id);
      }
    }
    return orphaned;
  }

  /**
   * Find nodes with high fan-out
   */
  private findHighFanOutNodes(threshold: number): string[] {
    const highFanOut: string[] = [];
    for (const node of this.nodes.values()) {
      if (node.outEdges.length &gt; threshold) {
        highFanOut.push(node.id);
      }
    }
    return highFanOut;
  }

  /**
   * Find long dependency paths
   */
  private findLongPaths(maxLength: number): string[][] {
    const longPaths: string[][] = [];
    const visited = new Set&lt;string&gt;();

    const dfs = (nodeId: string, path: string[]): void =&gt; {
      if (path.length &gt; maxLength) {
        longPaths.push([...path]);
        return;
      }

      visited.add(nodeId);
      const neighbors = this.adjacencyList.get(nodeId) || new Set();

      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          dfs(neighborId, [...path, neighborId]);
        }
      }

      visited.delete(nodeId);
    };

    for (const nodeId of this.nodes.keys()) {
      if (this.nodes.get(nodeId)!.inEdges.length === 0) {
        dfs(nodeId, [nodeId]);
      }
    }

    return longPaths.filter(path =&gt; path.length &gt; maxLength);
  }

  /**
   * Calculate graph metrics
   */
  private calculateMetrics(): GraphMetrics {
    const nodeCount = this.nodes.size;
    const edgeCount = this.edges.size;
    const maxPossibleEdges = nodeCount * (nodeCount - 1);
    const density = maxPossibleEdges &gt; 0 ? edgeCount / maxPossibleEdges : 0;

    const fanOuts = Array.from(this.nodes.values()).map(node =&gt; node.outEdges.length);
    const averageFanOut = fanOuts.length &gt; 0 ? fanOuts.reduce((sum, fo) =&gt; sum + fo, 0) / fanOuts.length : 0;

    const levels = Array.from(this.nodes.values()).map(node =&gt; node.level);
    const maxPathLength = levels.length &gt; 0 ? Math.max(...levels) : 0;

    return {
      nodeCount,
      edgeCount,
      averageFanOut,
      maxPathLength,
      density,
      criticalPathLength: this.criticalPath.length,
      stronglyConnectedComponents: 0, // Will be calculated separately if needed
    };
  }

  /**
   * Generate recommendations based on issues and metrics
   */
  private generateRecommendations(issues: GraphIssue[], metrics: GraphMetrics): string[] {
    const recommendations: string[] = [];

    if (issues.some(i =&gt; i.type === 'circular_dependency')) {
      recommendations.push('Break circular dependencies by removing least critical dependency edges');
    }

    if (metrics.averageFanOut &gt; 4) {
      recommendations.push('Consider breaking down tasks with high fan-out to reduce complexity');
    }

    if (metrics.maxPathLength &gt; 8) {
      recommendations.push('Look for opportunities to parallelize tasks in long dependency chains');
    }

    if (metrics.density &lt; 0.1) {
      recommendations.push('Graph appears sparse - consider if more dependencies should be explicitly defined');
    }

    if (metrics.density &gt; 0.5) {
      recommendations.push('Graph appears dense - review if all dependencies are necessary');
    }

    return recommendations;
  }

  /**
   * Calculate cycle weight
   */
  private calculateCycleWeight(cycle: string[]): number {
    let weight = 0;
    for (let i = 0; i &lt; cycle.length; i++) {
      const from = cycle[i];
      const to = cycle[(i + 1) % cycle.length];
      const edge = this.edges.get(`${from}-${to}`);
      if (edge) {
        weight += edge.weight;
      }
    }
    return weight;
  }

  /**
   * Generate cycle breaking options
   */
  private generateCycleBreakingOptions(cycle: string[]): CycleBreakingOption[] {
    const options: CycleBreakingOption[] = [];

    for (let i = 0; i &lt; cycle.length; i++) {
      const from = cycle[i];
      const to = cycle[(i + 1) % cycle.length];
      const edge = this.edges.get(`${from}-${to}`);

      if (edge) {
        const impactScore = this.calculateRemovalImpact(edge);
        options.push({
          edgeToRemove: edge,
          impactScore,
          reason: `Remove ${edge.dependency.type} dependency from ${from} to ${to}`,
          alternatives: [
            'Make dependency soft/optional',
            'Introduce intermediate task',
            'Redesign task relationships',
          ],
        });
      }
    }

    // Sort by impact score (lower is better)
    return options.sort((a, b) =&gt; a.impactScore - b.impactScore);
  }

  /**
   * Calculate impact of removing an edge
   */
  private calculateRemovalImpact(edge: GraphEdge): number {
    let impact = 0;

    // Higher confidence dependencies have higher removal impact
    impact += edge.dependency.confidence * 10;

    // Blocking dependencies have higher removal impact
    if (edge.dependency.blocking) {
      impact += 5;
    }

    // Critical path edges have higher removal impact
    if (edge.onCriticalPath) {
      impact += 3;
    }

    return impact;
  }

  /**
   * Calculate edge weight
   */
  private calculateEdgeWeight(dependency: DetectedDependency): number {
    let weight = dependency.confidence;

    // Adjust weight based on dependency type
    const typeWeights = {
      'explicit': 1.0,
      'implicit': 0.7,
      'resource': 0.8,
      'temporal': 0.6,
      'priority': 0.4,
    };

    weight *= typeWeights[dependency.type] || 0.5;

    // Blocking dependencies have higher weight
    if (dependency.blocking) {
      weight *= 1.2;
    }

    return Math.min(weight, 1.0);
  }

  /**
   * Clear the graph
   */
  private clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.adjacencyList.clear();
    this.reverseAdjacencyList.clear();
    this.criticalPath = [];
  }

  /**
   * Get all nodes
   */
  getNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get all edges
   */
  getEdges(): GraphEdge[] {
    return Array.from(this.edges.values());
  }

  /**
   * Get critical path
   */
  getCriticalPath(): string[] {
    return [...this.criticalPath];
  }

  /**
   * Get node by ID
   */
  getNode(nodeId: string): GraphNode | undefined {
    return this.nodes.get(nodeId);
  }

  /**
   * Get logger instance
   */
  private getLogger() {
    return {
      info: (message: string, data?: any) =&gt; {
        console.log(`[DependencyGraph] INFO: ${message}`, data || '');
      },
      debug: (message: string, data?: any) =&gt; {
        console.log(`[DependencyGraph] DEBUG: ${message}`, data || '');
      },
      warn: (message: string, data?: any) =&gt; {
        console.warn(`[DependencyGraph] WARN: ${message}`, data || '');
      },
      error: (message: string, data?: any) =&gt; {
        console.error(`[DependencyGraph] ERROR: ${message}`, data || '');
      },
    };
  }
}