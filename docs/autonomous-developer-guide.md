# Autonomous Task Management Developer Guide

## Overview

This guide provides developers with comprehensive information on extending, customizing, and integrating with the Autonomous Task Management system in Gemini CLI. Whether you're building custom tools, creating specialized agents, or integrating with external systems, this guide covers all the technical details you need.

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Creating Custom SubAgents](#creating-custom-subagents)
3. [Developing Custom Tools](#developing-custom-tools)
4. [Task Management Integration](#task-management-integration)
5. [Plugin Development](#plugin-development)
6. [API Integration](#api-integration)
7. [Testing and Validation](#testing-and-validation)
8. [Performance Optimization](#performance-optimization)

---

## Development Environment Setup

### Prerequisites

```bash
# Required dependencies
npm install @gemini-cli/core @gemini-cli/autonomous
npm install --dev @types/node typescript vitest

# Development tools
npm install --global @gemini-cli/dev-tools
```

### Project Structure

```
your-extension/
├── src/
│   ├── agents/          # Custom SubAgent implementations
│   ├── tools/           # Custom tool definitions
│   ├── tasks/           # Task processors and handlers
│   └── integration/     # External system integrations
├── tests/
│   ├── agents/          # Agent tests
│   ├── tools/           # Tool tests
│   └── integration/     # Integration tests
├── examples/            # Usage examples
└── docs/               # Additional documentation
```

### Configuration Files

```typescript
// gemini.config.ts
import { defineConfig } from '@gemini-cli/core';

export default defineConfig({
  autonomous: {
    agents: {
      registry: './src/agents',
      autoLoad: true
    },
    tools: {
      registry: './src/tools',
      permissions: 'strict'
    },
    tasks: {
      maxConcurrent: 10,
      defaultTimeout: 30000
    }
  }
});
```

---

## Creating Custom SubAgents

### Basic SubAgent Structure

```typescript
import { SubAgentScope, PromptConfig, ModelConfig, RunConfig } from '@gemini-cli/core';

export class SecurityAnalysisAgent {
  private static readonly SYSTEM_PROMPT = `
    You are a specialized security analysis agent focused on:
    - Vulnerability detection and classification
    - Security best practices enforcement
    - Risk assessment and mitigation strategies
    - Compliance validation

    Always prioritize security over convenience and provide detailed explanations.
  `;

  static async create(context: Config, options: SecurityAnalysisOptions = {}): Promise<SubAgentScope> {
    const promptConfig: PromptConfig = {
      systemPrompt: this.SYSTEM_PROMPT
    };

    const modelConfig: ModelConfig = {
      model: options.model || 'gemini-2.5-pro',
      temp: 0.2,  // Low temperature for consistent security analysis
      top_p: 0.8
    };

    const runConfig: RunConfig = {
      max_time_minutes: options.maxTime || 30,
      max_turns: options.maxTurns || 50
    };

    const toolConfig = {
      tools: [
        'Read',
        'Grep',
        'Bash',
        'SecurityScan',  // Custom security scanning tool
        'VulnerabilityDB'  // Custom vulnerability database tool
      ]
    };

    const outputConfig = {
      outputs: {
        vulnerability_report: 'Detailed vulnerability analysis with CVSS scores',
        security_recommendations: 'Prioritized security improvement recommendations',
        compliance_status: 'Compliance assessment against security standards'
      }
    };

    return SubAgentScope.create(
      'security-analyzer',
      context,
      promptConfig,
      modelConfig,
      runConfig,
      { toolConfig, outputConfig }
    );
  }
}
```

### Advanced Agent Features

#### Context-Aware Behavior

```typescript
export class ContextAwareAgent {
  async executeWithContext(task: TaskDefinition, context: ProjectContext): Promise<void> {
    // Analyze project context
    const projectType = this.detectProjectType(context);
    const techStack = this.identifyTechStack(context);

    // Adapt behavior based on context
    const adaptedPrompt = this.adaptPromptForContext(projectType, techStack);
    const specializedTools = this.selectToolsForTechStack(techStack);

    // Create context-specific agent
    const agent = await this.createSpecializedAgent(adaptedPrompt, specializedTools);
    await agent.runNonInteractive(this.buildContextState(context));
  }

  private detectProjectType(context: ProjectContext): ProjectType {
    const indicators = {
      'web-app': ['package.json', 'src/components/', 'public/'],
      'api': ['routes/', 'controllers/', 'middleware/'],
      'library': ['index.ts', 'lib/', 'dist/'],
      'mobile': ['ios/', 'android/', 'mobile/']
    };

    return this.analyzeFilePatterns(context.files, indicators);
  }
}
```

#### Multi-Phase Execution

```typescript
export class MultiPhaseAgent {
  async executePhases(phases: ExecutionPhase[]): Promise<CombinedResult> {
    const results: PhaseResult[] = [];
    let currentContext = new ContextState();

    for (const phase of phases) {
      console.log(`Executing phase: ${phase.name}`);

      const agent = await this.createPhaseAgent(phase, currentContext);
      await agent.runNonInteractive(currentContext);

      const result = this.extractPhaseResult(agent.output);
      results.push(result);

      // Pass results to next phase
      currentContext = this.mergeContexts(currentContext, result.context);
    }

    return this.combineResults(results);
  }
}
```

---

## Developing Custom Tools

### Tool Definition Structure

```typescript
import { DeclarativeTool } from '@gemini-cli/core';
import { Type } from '@google/genai';

export class SecurityScanTool extends DeclarativeTool {
  schema = {
    name: 'security_scan',
    description: 'Performs comprehensive security scanning of source code files',
    parameters: {
      type: Type.OBJECT,
      properties: {
        target_path: {
          type: Type.STRING,
          description: 'Path to scan (file or directory)'
        },
        scan_type: {
          type: Type.STRING,
          enum: ['quick', 'comprehensive', 'focused'],
          description: 'Type of security scan to perform'
        },
        rules: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Specific security rules to apply'
        },
        format: {
          type: Type.STRING,
          enum: ['json', 'sarif', 'text'],
          description: 'Output format for scan results'
        }
      },
      required: ['target_path']
    }
  };

  async build(params: SecurityScanParams) {
    return {
      async execute(signal?: AbortSignal): Promise<SecurityScanResult> {
        const scanner = new SecurityScanner({
          type: params.scan_type || 'quick',
          rules: params.rules || DEFAULT_SECURITY_RULES,
          format: params.format || 'json'
        });

        const results = await scanner.scanPath(params.target_path, { signal });

        return {
          vulnerabilities: results.vulnerabilities,
          summary: results.summary,
          recommendations: results.recommendations,
          metadata: {
            scanTime: results.duration,
            rulesApplied: results.rulesCount,
            filesScanned: results.fileCount
          }
        };
      },

      async shouldConfirmExecute(): Promise<ConfirmationDetails | null> {
        // Security scans are safe to run without confirmation
        return null;
      }
    };
  }
}
```

### Tool Registration and Management

```typescript
export class CustomToolRegistry {
  private tools: Map<string, DeclarativeTool> = new Map();

  registerTool(tool: DeclarativeTool): void {
    this.validateTool(tool);
    this.tools.set(tool.schema.name, tool);
    console.log(`Registered tool: ${tool.schema.name}`);
  }

  registerToolsFromDirectory(directory: string): void {
    const toolFiles = this.findToolFiles(directory);

    for (const file of toolFiles) {
      const toolClass = this.loadToolClass(file);
      const tool = new toolClass();
      this.registerTool(tool);
    }
  }

  createToolConfig(toolNames: string[]): ToolConfig {
    const availableTools = toolNames.filter(name => this.tools.has(name));
    const missing = toolNames.filter(name => !this.tools.has(name));

    if (missing.length > 0) {
      console.warn(`Missing tools: ${missing.join(', ')}`);
    }

    return {
      tools: availableTools.map(name => this.tools.get(name)!)
    };
  }

  private validateTool(tool: DeclarativeTool): void {
    // Validate tool schema
    if (!tool.schema.name) {
      throw new Error('Tool must have a name');
    }

    // Check for naming conflicts
    if (this.tools.has(tool.schema.name)) {
      throw new Error(`Tool ${tool.schema.name} is already registered`);
    }

    // Validate parameters
    if (!tool.schema.parameters) {
      throw new Error(`Tool ${tool.schema.name} must define parameters`);
    }
  }
}
```

### Tool Categories and Specializations

```typescript
// File system tools
export class EnhancedReadTool extends DeclarativeTool {
  // Implementation with advanced file reading capabilities
}

// Network tools
export class WebScrapeTool extends DeclarativeTool {
  // Implementation for web scraping and API calls
}

// Analysis tools
export class CodeMetricsTool extends DeclarativeTool {
  // Implementation for code quality analysis
}

// Integration tools
export class DatabaseQueryTool extends DeclarativeTool {
  // Implementation for database operations
}
```

---

## Task Management Integration

### Custom Task Processors

```typescript
export interface TaskProcessor {
  canHandle(task: TaskDefinition): boolean;
  process(task: TaskDefinition): Promise<TaskResult>;
  estimateTime(task: TaskDefinition): number;
  estimateResources(task: TaskDefinition): ResourceEstimate;
}

export class SecurityTaskProcessor implements TaskProcessor {
  canHandle(task: TaskDefinition): boolean {
    return task.category === 'security' ||
           task.title.toLowerCase().includes('security') ||
           task.tags?.includes('security');
  }

  async process(task: TaskDefinition): Promise<TaskResult> {
    // Create specialized security analysis workflow
    const phases = this.createSecurityPhases(task);
    const agent = await SecurityAnalysisAgent.create(this.context);

    let results: SecurityResult[] = [];

    for (const phase of phases) {
      const phaseContext = this.buildPhaseContext(task, phase);
      await agent.runNonInteractive(phaseContext);

      const result = this.extractSecurityResult(agent.output);
      results.push(result);
    }

    return this.consolidateResults(results);
  }

  estimateTime(task: TaskDefinition): number {
    const complexity = this.assessComplexity(task);
    const baseTime = 15; // minutes
    const complexityMultiplier = {
      'simple': 1,
      'moderate': 2,
      'complex': 4
    };

    return baseTime * complexityMultiplier[complexity];
  }
}
```

### Task Queue Management

```typescript
export class AdvancedTaskQueue {
  private queue: PriorityQueue<TaskDefinition>;
  private processors: Map<string, TaskProcessor>;
  private executors: Map<string, Promise<TaskResult>>;

  constructor() {
    this.queue = new PriorityQueue((a, b) => this.comparePriority(a, b));
    this.processors = new Map();
    this.executors = new Map();
  }

  registerProcessor(name: string, processor: TaskProcessor): void {
    this.processors.set(name, processor);
  }

  async addTask(task: TaskDefinition): Promise<void> {
    // Find appropriate processor
    const processor = this.findProcessor(task);
    if (!processor) {
      throw new Error(`No processor available for task: ${task.id}`);
    }

    // Estimate resources and validate availability
    const estimate = processor.estimateResources(task);
    await this.validateResourceAvailability(estimate);

    // Add to queue with priority
    task.priority = this.calculatePriority(task, estimate);
    this.queue.enqueue(task);

    // Trigger processing if resources available
    this.processNext();
  }

  private async processNext(): Promise<void> {
    if (this.queue.isEmpty() || this.isResourcesExhausted()) {
      return;
    }

    const task = this.queue.dequeue()!;
    const processor = this.findProcessor(task)!;

    console.log(`Starting task: ${task.title}`);

    const execution = processor.process(task);
    this.executors.set(task.id, execution);

    try {
      const result = await execution;
      await this.handleTaskCompletion(task, result);
    } catch (error) {
      await this.handleTaskError(task, error);
    } finally {
      this.executors.delete(task.id);
      this.processNext(); // Process next task
    }
  }
}
```

### Dependency Management

```typescript
export class TaskDependencyResolver {
  private graph: DependencyGraph<TaskDefinition>;

  constructor() {
    this.graph = new DependencyGraph();
  }

  addTaskWithDependencies(task: TaskDefinition, dependencies: string[]): void {
    this.graph.addNode(task.id, task);

    for (const depId of dependencies) {
      this.graph.addDependency(task.id, depId);
    }
  }

  getExecutionOrder(): TaskDefinition[] {
    return this.graph.topologicalSort();
  }

  canExecute(taskId: string): boolean {
    return this.graph.getDependencies(taskId).every(dep =>
      this.isTaskCompleted(dep)
    );
  }

  async executeWithDependencies(rootTaskId: string): Promise<Map<string, TaskResult>> {
    const executionOrder = this.getExecutionOrder();
    const results = new Map<string, TaskResult>();

    for (const task of executionOrder) {
      if (this.canExecute(task.id)) {
        console.log(`Executing task: ${task.title}`);
        const result = await this.executeTask(task);
        results.set(task.id, result);
      } else {
        console.warn(`Skipping task due to unmet dependencies: ${task.title}`);
      }
    }

    return results;
  }
}
```

---

## Plugin Development

### Plugin Architecture

```typescript
export interface AutonomousPlugin {
  name: string;
  version: string;
  description: string;

  // Lifecycle hooks
  initialize(context: PluginContext): Promise<void>;
  activate(): Promise<void>;
  deactivate(): Promise<void>;
  dispose(): Promise<void>;

  // Feature registration
  registerAgents(): SubAgentDefinition[];
  registerTools(): DeclarativeTool[];
  registerTaskProcessors(): TaskProcessor[];
  registerCommands(): CommandDefinition[];

  // Integration points
  handleTask?(task: TaskDefinition): Promise<boolean>;
  processResult?(result: TaskResult): Promise<TaskResult>;
  validateConfiguration?(config: unknown): ValidationResult;
}

export abstract class BasePlugin implements AutonomousPlugin {
  abstract name: string;
  abstract version: string;
  abstract description: string;

  protected context!: PluginContext;
  protected logger!: Logger;

  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    this.logger = context.createLogger(this.name);

    // Initialize plugin-specific resources
    await this.onInitialize();
  }

  async activate(): Promise<void> {
    this.logger.info('Activating plugin');

    // Register components
    const agents = this.registerAgents();
    const tools = this.registerTools();
    const processors = this.registerTaskProcessors();

    for (const agent of agents) {
      this.context.registerAgent(agent);
    }

    for (const tool of tools) {
      this.context.registerTool(tool);
    }

    for (const processor of processors) {
      this.context.registerTaskProcessor(processor);
    }

    await this.onActivate();
  }

  // Template methods for subclasses
  protected abstract onInitialize(): Promise<void>;
  protected abstract onActivate(): Promise<void>;

  // Default implementations
  registerAgents(): SubAgentDefinition[] { return []; }
  registerTools(): DeclarativeTool[] { return []; }
  registerTaskProcessors(): TaskProcessor[] { return []; }
  registerCommands(): CommandDefinition[] { return []; }
}
```

### Example Plugin Implementation

```typescript
export class GitIntegrationPlugin extends BasePlugin {
  name = 'git-integration';
  version = '1.0.0';
  description = 'Git integration for autonomous task management';

  protected async onInitialize(): Promise<void> {
    // Initialize Git service
    this.gitService = new GitService(this.context.workspacePath);
  }

  protected async onActivate(): Promise<void> {
    // Set up Git hooks for task tracking
    await this.setupGitHooks();
  }

  registerAgents(): SubAgentDefinition[] {
    return [
      {
        name: 'git-commit-analyzer',
        factory: (context) => GitCommitAnalyzer.create(context),
        description: 'Analyzes commit history for task insights'
      },
      {
        name: 'merge-conflict-resolver',
        factory: (context) => MergeConflictResolver.create(context),
        description: 'Automatically resolves simple merge conflicts'
      }
    ];
  }

  registerTools(): DeclarativeTool[] {
    return [
      new GitCommitTool(),
      new GitBranchTool(),
      new GitMergeTool(),
      new GitStatusTool()
    ];
  }

  registerTaskProcessors(): TaskProcessor[] {
    return [
      new GitTaskProcessor(this.gitService)
    ];
  }

  async handleTask(task: TaskDefinition): Promise<boolean> {
    // Handle git-related tasks
    if (task.category === 'version-control' || task.tags?.includes('git')) {
      await this.processGitTask(task);
      return true;
    }

    return false;
  }
}
```

### Plugin Registry and Lifecycle

```typescript
export class PluginManager {
  private plugins: Map<string, AutonomousPlugin> = new Map();
  private activePlugins: Set<string> = new Set();

  async loadPlugin(pluginPath: string): Promise<void> {
    const PluginClass = await this.importPlugin(pluginPath);
    const plugin = new PluginClass();

    await this.validatePlugin(plugin);
    await plugin.initialize(this.createPluginContext(plugin));

    this.plugins.set(plugin.name, plugin);
    console.log(`Loaded plugin: ${plugin.name} v${plugin.version}`);
  }

  async activatePlugin(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginName}`);
    }

    if (this.activePlugins.has(pluginName)) {
      throw new Error(`Plugin already active: ${pluginName}`);
    }

    await plugin.activate();
    this.activePlugins.add(pluginName);
    console.log(`Activated plugin: ${pluginName}`);
  }

  async deactivatePlugin(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin || !this.activePlugins.has(pluginName)) {
      return;
    }

    await plugin.deactivate();
    this.activePlugins.delete(pluginName);
    console.log(`Deactivated plugin: ${pluginName}`);
  }

  getActivePlugins(): AutonomousPlugin[] {
    return Array.from(this.activePlugins)
      .map(name => this.plugins.get(name)!)
      .filter(Boolean);
  }
}
```

---

## API Integration

### REST API Endpoints

```typescript
// Task Management API
export class TaskManagementAPI {
  private router = express.Router();

  constructor(private taskManager: TaskManager) {
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Create task
    this.router.post('/tasks', async (req, res) => {
      try {
        const task = await this.taskManager.createTask(req.body);
        res.status(201).json(task);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Get task status
    this.router.get('/tasks/:id', async (req, res) => {
      try {
        const task = await this.taskManager.getTask(req.params.id);
        if (!task) {
          return res.status(404).json({ error: 'Task not found' });
        }
        res.json(task);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // List tasks with filters
    this.router.get('/tasks', async (req, res) => {
      try {
        const filters = this.parseTaskFilters(req.query);
        const tasks = await this.taskManager.listTasks(filters);
        res.json(tasks);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Cancel task
    this.router.delete('/tasks/:id', async (req, res) => {
      try {
        await this.taskManager.cancelTask(req.params.id);
        res.status(204).send();
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }
}
```

### WebSocket Integration

```typescript
export class TaskWebSocketHandler {
  private connections: Set<WebSocket> = new Set();

  constructor(private taskManager: TaskManager) {
    this.setupEventHandlers();
  }

  handleConnection(ws: WebSocket): void {
    this.connections.add(ws);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch (error) {
        ws.send(JSON.stringify({ error: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      this.connections.delete(ws);
    });

    // Send current status
    this.sendTaskList(ws);
  }

  private handleMessage(ws: WebSocket, message: any): void {
    switch (message.type) {
      case 'subscribe':
        this.subscribeToTask(ws, message.taskId);
        break;
      case 'unsubscribe':
        this.unsubscribeFromTask(ws, message.taskId);
        break;
      default:
        ws.send(JSON.stringify({ error: 'Unknown message type' }));
    }
  }

  private setupEventHandlers(): void {
    this.taskManager.on('taskCreated', (task) => {
      this.broadcast({ type: 'taskCreated', task });
    });

    this.taskManager.on('taskStarted', (task) => {
      this.broadcast({ type: 'taskStarted', task });
    });

    this.taskManager.on('taskProgress', (taskId, progress) => {
      this.broadcast({ type: 'taskProgress', taskId, progress });
    });

    this.taskManager.on('taskCompleted', (task, result) => {
      this.broadcast({ type: 'taskCompleted', task, result });
    });
  }

  private broadcast(message: any): void {
    const data = JSON.stringify(message);
    this.connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  }
}
```

### GraphQL Integration

```typescript
import { gql, createSchema } from 'graphql-yoga';

const typeDefs = gql`
  type Task {
    id: ID!
    title: String!
    description: String
    category: String!
    status: TaskStatus!
    priority: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
    estimatedDuration: Int
    actualDuration: Int
    result: TaskResult
    agents: [Agent!]!
  }

  type TaskResult {
    success: Boolean!
    outputs: JSON
    errors: [String!]
    metrics: TaskMetrics
  }

  type Agent {
    id: ID!
    name: String!
    status: AgentStatus!
    startedAt: DateTime
    completedAt: DateTime
  }

  enum TaskStatus {
    PENDING
    APPROVED
    QUEUED
    EXECUTING
    COMPLETED
    FAILED
    CANCELLED
  }

  type Query {
    tasks(
      status: TaskStatus
      category: String
      limit: Int = 10
      offset: Int = 0
    ): [Task!]!

    task(id: ID!): Task

    agents: [Agent!]!

    systemStatus: SystemStatus!
  }

  type Mutation {
    createTask(input: CreateTaskInput!): Task!
    approveTask(id: ID!): Task!
    cancelTask(id: ID!): Task!
    pauseSystem: Boolean!
    resumeSystem: Boolean!
  }

  type Subscription {
    taskUpdates(taskId: ID): Task!
    systemUpdates: SystemStatus!
  }
`;

const resolvers = {
  Query: {
    tasks: async (_, { status, category, limit, offset }) => {
      return taskManager.listTasks({ status, category, limit, offset });
    },

    task: async (_, { id }) => {
      return taskManager.getTask(id);
    },

    agents: async () => {
      return agentManager.listAgents();
    },

    systemStatus: async () => {
      return systemMonitor.getStatus();
    }
  },

  Mutation: {
    createTask: async (_, { input }) => {
      return taskManager.createTask(input);
    },

    approveTask: async (_, { id }) => {
      return taskManager.approveTask(id);
    }
  },

  Subscription: {
    taskUpdates: {
      subscribe: async function* (_, { taskId }) {
        const eventStream = taskManager.createEventStream(taskId);

        for await (const event of eventStream) {
          yield { taskUpdates: event.task };
        }
      }
    }
  }
};
```

---

## Testing and Validation

### Unit Testing SubAgents

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('SecurityAnalysisAgent', () => {
  let mockContext: Config;
  let agent: SubAgentScope;

  beforeEach(async () => {
    mockContext = createMockConfig();
    agent = await SecurityAnalysisAgent.create(mockContext);
  });

  it('should analyze security vulnerabilities', async () => {
    // Arrange
    const context = new ContextState();
    context.set('target_directory', './test-fixtures/vulnerable-code');

    // Mock tool responses
    mockTool('Read', { content: 'vulnerable code sample' });
    mockTool('SecurityScan', {
      vulnerabilities: [
        { type: 'SQL_INJECTION', severity: 'HIGH', file: 'db.js' }
      ]
    });

    // Act
    await agent.runNonInteractive(context);

    // Assert
    expect(agent.output.terminate_reason).toBe(SubagentTerminateMode.GOAL);
    expect(agent.output.emitted_vars).toHaveProperty('vulnerability_report');

    const report = JSON.parse(agent.output.emitted_vars.vulnerability_report);
    expect(report.vulnerabilities).toHaveLength(1);
    expect(report.vulnerabilities[0].type).toBe('SQL_INJECTION');
  });

  it('should handle timeout gracefully', async () => {
    // Arrange
    const shortTimeoutAgent = await SecurityAnalysisAgent.create(mockContext, {
      maxTime: 0.1 // 6 seconds
    });

    const context = new ContextState();
    context.set('target_directory', './test-fixtures/large-codebase');

    // Act
    await shortTimeoutAgent.runNonInteractive(context);

    // Assert
    expect(shortTimeoutAgent.output.terminate_reason).toBe(SubagentTerminateMode.TIMEOUT);
  });
});
```

### Integration Testing

```typescript
describe('Task Management Integration', () => {
  let taskManager: TaskManager;
  let agentManager: AgentManager;

  beforeEach(async () => {
    taskManager = new TaskManager(createTestConfig());
    agentManager = new AgentManager(createTestConfig());

    // Set up test database
    await setupTestDatabase();
  });

  it('should complete security analysis task end-to-end', async () => {
    // Create task
    const task = await taskManager.createTask({
      title: 'Security Analysis',
      description: 'Analyze test codebase for security issues',
      category: 'security',
      metadata: {
        target_path: './test-fixtures/security-test-app'
      }
    });

    // Approve task
    await taskManager.approveTask(task.id);

    // Wait for completion
    await waitForTaskCompletion(task.id, 30000);

    // Verify results
    const completedTask = await taskManager.getTask(task.id);
    expect(completedTask.status).toBe('completed');
    expect(completedTask.result).toBeDefined();
    expect(completedTask.result.outputs).toHaveProperty('vulnerability_report');
  });
});
```

### Performance Testing

```typescript
describe('Performance Tests', () => {
  it('should handle multiple concurrent agents', async () => {
    const startTime = Date.now();
    const taskCount = 10;

    // Create multiple tasks
    const tasks = await Promise.all(
      Array.from({ length: taskCount }, (_, i) =>
        taskManager.createTask({
          title: `Performance Test Task ${i}`,
          description: 'Simple analysis task for performance testing',
          category: 'analysis'
        })
      )
    );

    // Approve all tasks
    await Promise.all(tasks.map(task => taskManager.approveTask(task.id)));

    // Wait for all to complete
    await Promise.all(tasks.map(task =>
      waitForTaskCompletion(task.id, 60000)
    ));

    const totalTime = Date.now() - startTime;
    const avgTimePerTask = totalTime / taskCount;

    // Performance assertions
    expect(avgTimePerTask).toBeLessThan(10000); // Less than 10 seconds average
    expect(totalTime).toBeLessThan(30000); // All tasks complete within 30 seconds
  });

  it('should manage memory efficiently with many agents', async () => {
    const initialMemory = process.memoryUsage();

    // Create many short-lived agents
    for (let i = 0; i < 50; i++) {
      const agent = await TestAgent.create(mockContext);
      await agent.runNonInteractive(new ContextState());
    }

    // Force garbage collection
    if (global.gc) global.gc();

    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

    // Memory should not increase significantly
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
  });
});
```

---

## Performance Optimization

### Agent Pool Management

```typescript
export class AgentPool {
  private available: SubAgentScope[] = [];
  private inUse: Map<string, SubAgentScope> = new Map();
  private factory: AgentFactory;

  constructor(
    factory: AgentFactory,
    private maxSize: number = 10,
    private idleTimeout: number = 300000 // 5 minutes
  ) {
    this.factory = factory;
    this.startCleanupTimer();
  }

  async acquire(type: string): Promise<SubAgentScope> {
    // Try to reuse available agent
    const available = this.available.find(agent =>
      agent.name === type && this.isAgentHealthy(agent)
    );

    if (available) {
      this.available = this.available.filter(a => a !== available);
      this.inUse.set(available.name, available);
      return available;
    }

    // Create new agent if under limit
    if (this.inUse.size < this.maxSize) {
      const agent = await this.factory.createAgent(type);
      this.inUse.set(agent.name, agent);
      return agent;
    }

    // Wait for agent to become available
    return this.waitForAvailableAgent(type);
  }

  release(agent: SubAgentScope): void {
    this.inUse.delete(agent.name);

    if (this.isAgentHealthy(agent) && this.available.length < this.maxSize / 2) {
      // Reset agent state
      this.resetAgent(agent);
      this.available.push(agent);
    }
  }

  private async waitForAvailableAgent(type: string): Promise<SubAgentScope> {
    return new Promise((resolve) => {
      const checkForAvailable = () => {
        const available = this.available.find(a => a.name === type);
        if (available) {
          resolve(this.acquire(type));
        } else {
          setTimeout(checkForAvailable, 100);
        }
      };
      checkForAvailable();
    });
  }
}
```

### Caching and Memoization

```typescript
export class ResultCache {
  private cache: LRUCache<string, TaskResult>;
  private readonly TTL = 3600000; // 1 hour

  constructor(maxSize: number = 1000) {
    this.cache = new LRUCache({
      max: maxSize,
      maxAge: this.TTL
    });
  }

  getCacheKey(task: TaskDefinition): string {
    // Create deterministic cache key based on task properties
    const hashInput = {
      title: task.title,
      description: task.description,
      category: task.category,
      // Include content hash for file-based tasks
      contentHash: this.calculateContentHash(task.metadata?.target_path)
    };

    return hashObject(hashInput);
  }

  async get(task: TaskDefinition): Promise<TaskResult | null> {
    const key = this.getCacheKey(task);
    const cached = this.cache.get(key);

    if (cached && this.isCacheValid(cached, task)) {
      console.log(`Cache hit for task: ${task.title}`);
      return cached;
    }

    return null;
  }

  set(task: TaskDefinition, result: TaskResult): void {
    const key = this.getCacheKey(task);
    this.cache.set(key, {
      ...result,
      cached: true,
      cacheTime: Date.now()
    });
  }

  private isCacheValid(result: TaskResult, task: TaskDefinition): boolean {
    // Check if cached result is still valid
    const age = Date.now() - (result.cacheTime || 0);

    if (age > this.TTL) return false;

    // For file-based tasks, check if files have changed
    if (task.metadata?.target_path) {
      const currentHash = this.calculateContentHash(task.metadata.target_path);
      return currentHash === result.contentHash;
    }

    return true;
  }
}
```

### Resource Monitoring

```typescript
export class ResourceMonitor {
  private metrics: Map<string, ResourceMetric[]> = new Map();

  startMonitoring(agentId: string): void {
    const interval = setInterval(() => {
      const metric = this.collectMetrics(agentId);
      this.recordMetric(agentId, metric);

      if (this.shouldThrottle(agentId, metric)) {
        this.throttleAgent(agentId);
      }
    }, 5000); // Check every 5 seconds

    // Store interval for cleanup
    this.intervals.set(agentId, interval);
  }

  private collectMetrics(agentId: string): ResourceMetric {
    const process = this.getAgentProcess(agentId);

    return {
      timestamp: Date.now(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      handles: process._getActiveHandles().length,
      requests: process._getActiveRequests().length
    };
  }

  private shouldThrottle(agentId: string, metric: ResourceMetric): boolean {
    const history = this.metrics.get(agentId) || [];

    // Check memory growth trend
    const memoryTrend = this.calculateTrend(
      history.slice(-5).map(m => m.memory.heapUsed)
    );

    // Throttle if memory is growing rapidly
    if (memoryTrend > 0.1 && metric.memory.heapUsed > 100 * 1024 * 1024) {
      return true;
    }

    // Throttle if too many active handles
    if (metric.handles > 1000) {
      return true;
    }

    return false;
  }

  private throttleAgent(agentId: string): void {
    console.warn(`Throttling agent due to high resource usage: ${agentId}`);
    // Implement throttling logic (delay between operations, reduce concurrency, etc.)
  }
}
```

---

## Best Practices and Patterns

### Error Handling and Recovery

```typescript
export class RobustTaskExecutor {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt === this.MAX_RETRIES) {
          console.error(`Failed after ${this.MAX_RETRIES} attempts: ${context}`);
          throw error;
        }

        const delay = this.calculateBackoffDelay(attempt);
        console.warn(`Attempt ${attempt} failed: ${context}. Retrying in ${delay}ms`);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private calculateBackoffDelay(attempt: number): number {
    return this.RETRY_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Logging and Observability

```typescript
export class StructuredLogger {
  constructor(
    private context: LogContext,
    private transport: LogTransport
  ) {}

  info(message: string, metadata?: object): void {
    this.log('INFO', message, metadata);
  }

  warn(message: string, metadata?: object): void {
    this.log('WARN', message, metadata);
  }

  error(message: string, error?: Error, metadata?: object): void {
    this.log('ERROR', message, {
      ...metadata,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined
    });
  }

  private log(level: LogLevel, message: string, metadata?: object): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
      metadata,
      traceId: this.generateTraceId()
    };

    this.transport.write(logEntry);
  }

  createChildLogger(additionalContext: Partial<LogContext>): StructuredLogger {
    return new StructuredLogger(
      { ...this.context, ...additionalContext },
      this.transport
    );
  }
}
```

This comprehensive developer guide provides all the technical details needed to extend and integrate with the Autonomous Task Management system. For additional examples and advanced patterns, refer to the main technical documentation and the codebase examples.