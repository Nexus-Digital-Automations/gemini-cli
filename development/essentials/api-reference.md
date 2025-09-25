# Gemini CLI API Reference

## Overview

This document provides comprehensive API reference documentation for the Gemini CLI project, covering all major APIs, interfaces, and integration points.

## Table of Contents

- [Core APIs](#core-apis)
- [Tool APIs](#tool-apis)
- [Extension APIs](#extension-apis)
- [Configuration APIs](#configuration-apis)
- [Autonomous Task Management APIs](#autonomous-task-management-apis)
- [MCP Integration APIs](#mcp-integration-apis)
- [Authentication APIs](#authentication-apis)
- [CLI Command APIs](#cli-command-apis)

## Core APIs

### Gemini API Client

The primary interface for communicating with Google's Gemini API.

#### `GeminiApiClient`

```typescript
class GeminiApiClient {
  constructor(config: ApiClientConfig);

  // Send a message and get response
  async sendMessage(message: Message): Promise<GeminiResponse>;

  // Stream responses for real-time interaction
  async streamMessage(message: Message): AsyncIterator<ResponseChunk>;

  // Get available models
  async getModels(): Promise<Model[]>;

  // Configure model parameters
  setModelConfig(config: ModelConfig): void;
}

interface ApiClientConfig {
  apiKey?: string;
  authMethod: 'oauth' | 'api-key' | 'vertex-ai';
  baseUrl?: string;
  timeout?: number;
  retryConfig?: RetryConfig;
}

interface Message {
  content: string;
  role: 'user' | 'assistant' | 'system';
  context?: ConversationContext;
  tools?: ToolDefinition[];
}

interface GeminiResponse {
  content: string;
  role: 'assistant';
  toolCalls?: ToolCall[];
  finishReason: 'stop' | 'length' | 'tool_calls';
  usage: TokenUsage;
}
```

### Context Management

Manages conversation context and memory across sessions.

#### `ContextManager`

```typescript
class ContextManager {
  // Add message to context
  addMessage(message: Message): void;

  // Get conversation history
  getHistory(limit?: number): Message[];

  // Compress context to fit token limits
  async compressContext(): Promise<void>;

  // Save context for persistence
  saveContext(sessionId: string): Promise<void>;

  // Load saved context
  loadContext(sessionId: string): Promise<void>;

  // Clear context
  clearContext(): void;
}

interface ConversationContext {
  sessionId: string;
  userId?: string;
  projectPath: string;
  metadata: Record<string, any>;
  history: Message[];
  tools: ToolDefinition[];
}
```

## Tool APIs

### Tool Execution Framework

Provides standardized interface for tool development and execution.

#### `BaseTool`

```typescript
abstract class BaseTool {
  abstract name: string;
  abstract description: string;
  abstract parameters: ToolParameters;

  // Execute the tool with given arguments
  abstract execute(args: ToolArguments): Promise<ToolResult>;

  // Validate arguments before execution
  validateArgs(args: ToolArguments): ValidationResult;

  // Check if tool requires user permission
  requiresPermission(args: ToolArguments): boolean;

  // Get help text for the tool
  getHelpText(): string;
}

interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ParameterSchema>;
    required?: string[];
  };
}

interface ToolResult {
  success: boolean;
  content?: string;
  error?: string;
  metadata?: Record<string, any>;
}
```

### Built-in Tools

#### File System Tools

```typescript
class FileSystemTool extends BaseTool {
  // Read file contents
  async readFile(path: string): Promise<string>;

  // Write file contents
  async writeFile(path: string, content: string): Promise<void>;

  // List directory contents
  async listDirectory(path: string): Promise<FileInfo[]>;

  // Search for files
  async searchFiles(pattern: string, path?: string): Promise<string[]>;

  // Get file information
  async getFileInfo(path: string): Promise<FileInfo>;
}

interface FileInfo {
  path: string;
  name: string;
  size: number;
  type: 'file' | 'directory';
  modified: Date;
  permissions: string;
}
```

#### Shell Command Tools

```typescript
class ShellTool extends BaseTool {
  // Execute shell command
  async executeCommand(
    command: string,
    options?: ShellOptions
  ): Promise<CommandResult>;

  // Execute command with streaming output
  async executeCommandStream(
    command: string,
    options?: ShellOptions
  ): AsyncIterator<CommandOutput>;
}

interface ShellOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
  shell?: string;
  input?: string;
}

interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  command: string;
  duration: number;
}
```

#### Web Tools

```typescript
class WebTool extends BaseTool {
  // Fetch web content
  async fetchUrl(url: string, options?: FetchOptions): Promise<WebContent>;

  // Search the web
  async searchWeb(query: string, options?: SearchOptions): Promise<SearchResult[]>;

  // Extract content from HTML
  async extractContent(html: string): Promise<ExtractedContent>;
}

interface WebContent {
  url: string;
  content: string;
  contentType: string;
  statusCode: number;
  headers: Record<string, string>;
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}
```

## Extension APIs

### Extension Development Framework

APIs for creating custom extensions and commands.

#### `ExtensionBase`

```typescript
abstract class ExtensionBase {
  abstract name: string;
  abstract version: string;
  abstract description: string;

  // Initialize the extension
  abstract initialize(context: ExtensionContext): Promise<void>;

  // Register commands
  abstract registerCommands(): CommandDefinition[];

  // Register tools
  registerTools?(): ToolDefinition[];

  // Cleanup on deactivation
  deactivate?(): Promise<void>;
}

interface ExtensionContext {
  extensionPath: string;
  globalStoragePath: string;
  workspaceStoragePath: string;
  subscriptions: ExtensionSubscription[];
  geminiApi: GeminiApiClient;
  toolRegistry: ToolRegistry;
}

interface CommandDefinition {
  name: string;
  description: string;
  handler: CommandHandler;
  args?: ArgumentDefinition[];
}
```

### Command Registration

```typescript
interface CommandRegistry {
  // Register a new command
  register(command: CommandDefinition): void;

  // Unregister a command
  unregister(name: string): void;

  // Execute a command
  execute(name: string, args?: string[]): Promise<CommandResult>;

  // Get all registered commands
  getCommands(): CommandDefinition[];
}

type CommandHandler = (
  args: string[],
  context: CommandContext
) => Promise<CommandResult>;

interface CommandContext {
  currentPath: string;
  user?: UserInfo;
  session: SessionInfo;
  geminiApi: GeminiApiClient;
}
```

## Configuration APIs

### Settings Management

APIs for managing application configuration at various levels.

#### `ConfigurationManager`

```typescript
class ConfigurationManager {
  // Get configuration value
  get<T>(key: string, defaultValue?: T): T;

  // Set configuration value
  set(key: string, value: any): Promise<void>;

  // Get all configuration
  getAll(): Configuration;

  // Update configuration
  update(config: Partial<Configuration>): Promise<void>;

  // Reset to defaults
  reset(): Promise<void>;

  // Watch for changes
  onDidChange(listener: ConfigChangeListener): Disposable;
}

interface Configuration {
  auth: AuthConfig;
  model: ModelConfig;
  tools: ToolConfig;
  ui: UIConfig;
  extensions: ExtensionConfig[];
  mcpServers: McpServerConfig[];
}

interface AuthConfig {
  method: 'oauth' | 'api-key' | 'vertex-ai';
  credentials?: any;
  autoLogin?: boolean;
}

interface ModelConfig {
  name: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  stopSequences?: string[];
}
```

### Project Configuration

```typescript
class ProjectConfigManager extends ConfigurationManager {
  // Load project-specific configuration
  loadProjectConfig(projectPath: string): Promise<ProjectConfig>;

  // Save project configuration
  saveProjectConfig(projectPath: string, config: ProjectConfig): Promise<void>;

  // Get effective configuration (global + project)
  getEffectiveConfig(projectPath: string): Configuration;
}

interface ProjectConfig {
  name: string;
  description?: string;
  contextFiles?: string[];
  excludePatterns?: string[];
  tools?: ToolOverrides;
  customPrompts?: Record<string, string>;
}
```

## Autonomous Task Management APIs

### Task Management System

Comprehensive APIs for the autonomous task management system.

#### `TaskManager`

```typescript
class TaskManager {
  // Create a new task
  createTask(definition: TaskDefinition): Promise<Task>;

  // Get task by ID
  getTask(taskId: string): Promise<Task | null>;

  // List all tasks
  listTasks(filter?: TaskFilter): Promise<Task[]>;

  // Execute a task
  executeTask(taskId: string): Promise<TaskResult>;

  // Cancel a task
  cancelTask(taskId: string): Promise<void>;

  // Update task status
  updateTaskStatus(taskId: string, status: TaskStatus): Promise<void>;

  // Get task statistics
  getTaskStats(): Promise<TaskStatistics>;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dependencies: string[];
  assignedAgent?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

enum TaskPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}
```

#### Task Agent APIs

```typescript
class TaskAgent {
  id: string;
  status: AgentStatus;

  // Initialize agent
  initialize(): Promise<void>;

  // Claim a task
  claimTask(taskId: string): Promise<boolean>;

  // Execute claimed task
  executeTask(task: Task): Promise<TaskResult>;

  // Report progress
  reportProgress(taskId: string, progress: TaskProgress): Promise<void>;

  // Get agent status
  getStatus(): AgentStatus;

  // Stop agent
  stop(): Promise<void>;
}

interface TaskProgress {
  percentage: number;
  currentStep: string;
  estimatedTimeRemaining?: number;
  logs: TaskLog[];
}

interface AgentStatus {
  id: string;
  status: 'active' | 'idle' | 'busy' | 'error' | 'stopped';
  currentTask?: string;
  lastHeartbeat: Date;
  performance: AgentPerformance;
}
```

### Feature Workflow API

```typescript
class FeatureManager {
  // Create feature suggestion
  suggestFeature(feature: FeatureSuggestion): Promise<Feature>;

  // Approve feature for implementation
  approveFeature(featureId: string, approvalData?: any): Promise<void>;

  // Reject feature suggestion
  rejectFeature(featureId: string, reason: string): Promise<void>;

  // List features with filtering
  listFeatures(filter?: FeatureFilter): Promise<Feature[]>;

  // Get feature statistics
  getFeatureStats(): Promise<FeatureStatistics>;

  // Update feature status
  updateFeatureStatus(featureId: string, status: FeatureStatus): Promise<void>;
}

interface Feature {
  id: string;
  title: string;
  description: string;
  businessValue: string;
  category: FeatureCategory;
  status: FeatureStatus;
  createdAt: Date;
  updatedAt: Date;
  approvedBy?: string;
  approvalDate?: Date;
  implementedDate?: Date;
  metadata: Record<string, any>;
}

enum FeatureStatus {
  SUGGESTED = 'suggested',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  IMPLEMENTED = 'implemented'
}

enum FeatureCategory {
  ENHANCEMENT = 'enhancement',
  BUG_FIX = 'bug-fix',
  NEW_FEATURE = 'new-feature',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  DOCUMENTATION = 'documentation'
}
```

## MCP Integration APIs

### MCP Server Management

APIs for integrating with Model Context Protocol servers.

#### `McpManager`

```typescript
class McpManager {
  // Register MCP server
  registerServer(config: McpServerConfig): Promise<void>;

  // Unregister MCP server
  unregisterServer(name: string): Promise<void>;

  // List registered servers
  listServers(): McpServerInfo[];

  // Get server status
  getServerStatus(name: string): McpServerStatus;

  // Execute MCP tool
  executeMcpTool(serverName: string, toolName: string, args: any): Promise<any>;
}

interface McpServerConfig {
  name: string;
  command: string[];
  args?: string[];
  env?: Record<string, string>;
  workingDirectory?: string;
  autoRestart?: boolean;
  timeout?: number;
}

interface McpServerInfo {
  name: string;
  status: 'running' | 'stopped' | 'error';
  version: string;
  tools: McpToolInfo[];
  resources: McpResourceInfo[];
}

interface McpToolInfo {
  name: string;
  description: string;
  inputSchema: any;
}
```

## Authentication APIs

### Authentication System

APIs for managing user authentication and authorization.

#### `AuthManager`

```typescript
class AuthManager {
  // Initialize authentication
  initialize(): Promise<void>;

  // Login with specified method
  login(method: AuthMethod, credentials?: any): Promise<AuthResult>;

  // Logout current user
  logout(): Promise<void>;

  // Get current authentication status
  getStatus(): AuthStatus;

  // Refresh authentication token
  refreshToken(): Promise<AuthToken>;

  // Get user info
  getCurrentUser(): Promise<UserInfo | null>;
}

interface AuthResult {
  success: boolean;
  token?: AuthToken;
  user?: UserInfo;
  error?: string;
}

interface AuthStatus {
  isAuthenticated: boolean;
  method?: AuthMethod;
  user?: UserInfo;
  tokenExpiry?: Date;
}

interface UserInfo {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  permissions: string[];
}

enum AuthMethod {
  OAUTH = 'oauth',
  API_KEY = 'api-key',
  VERTEX_AI = 'vertex-ai'
}
```

## CLI Command APIs

### Built-in Commands

API reference for built-in slash commands.

#### Core Commands

```typescript
// Help command
interface HelpCommand {
  execute(args?: string[]): Promise<HelpResult>;
}

// About command
interface AboutCommand {
  execute(): Promise<AboutInfo>;
}

// Auth command
interface AuthCommand {
  login(method?: AuthMethod): Promise<AuthResult>;
  logout(): Promise<void>;
  status(): Promise<AuthStatus>;
}

// Config command
interface ConfigCommand {
  get(key?: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  reset(): Promise<void>;
  list(): Promise<Configuration>;
}
```

#### Extension Commands

```typescript
// Extensions command
interface ExtensionsCommand {
  list(): Promise<ExtensionInfo[]>;
  install(name: string): Promise<InstallResult>;
  uninstall(name: string): Promise<UninstallResult>;
  enable(name: string): Promise<void>;
  disable(name: string): Promise<void>;
}

// MCP command
interface McpCommand {
  list(): Promise<McpServerInfo[]>;
  add(config: McpServerConfig): Promise<void>;
  remove(name: string): Promise<void>;
  status(name?: string): Promise<McpServerStatus[]>;
}
```

## Error Handling

### Standard Error Types

```typescript
class GeminiCliError extends Error {
  code: string;
  category: ErrorCategory;
  details?: any;

  constructor(message: string, code: string, category: ErrorCategory, details?: any);
}

enum ErrorCategory {
  USER_INPUT = 'user_input',
  API_ERROR = 'api_error',
  TOOL_ERROR = 'tool_error',
  SYSTEM_ERROR = 'system_error',
  NETWORK_ERROR = 'network_error',
  AUTH_ERROR = 'auth_error'
}

// Specific error types
class ApiError extends GeminiCliError {}
class ToolExecutionError extends GeminiCliError {}
class ConfigurationError extends GeminiCliError {}
class AuthenticationError extends GeminiCliError {}
```

## Event System

### Event Emitter APIs

```typescript
interface GeminiEventEmitter {
  // Subscribe to events
  on(event: string, listener: EventListener): void;

  // Unsubscribe from events
  off(event: string, listener: EventListener): void;

  // Emit events
  emit(event: string, data?: any): void;

  // One-time event listener
  once(event: string, listener: EventListener): void;
}

// Standard events
interface StandardEvents {
  'message:sent': MessageEvent;
  'message:received': MessageEvent;
  'tool:executed': ToolEvent;
  'task:created': TaskEvent;
  'task:completed': TaskEvent;
  'auth:login': AuthEvent;
  'auth:logout': AuthEvent;
  'config:changed': ConfigEvent;
}
```

## Usage Examples

### Basic API Usage

```typescript
// Initialize Gemini CLI
const gemini = new GeminiCli({
  auth: { method: 'oauth' },
  model: { name: 'gemini-2.5-pro' }
});

// Send a message
const response = await gemini.sendMessage({
  content: "Help me analyze this codebase",
  role: 'user'
});

// Use a tool
const fileContent = await gemini.tools.fileSystem.readFile('src/main.ts');

// Create a task
const task = await gemini.taskManager.createTask({
  title: 'Refactor authentication module',
  description: 'Update auth system to use OAuth 2.0',
  priority: TaskPriority.HIGH
});
```

### Extension Development

```typescript
// Create custom extension
class MyExtension extends ExtensionBase {
  name = 'my-extension';
  version = '1.0.0';
  description = 'Custom functionality for my project';

  async initialize(context: ExtensionContext) {
    // Initialize extension
  }

  registerCommands() {
    return [
      {
        name: 'my-command',
        description: 'My custom command',
        handler: this.handleMyCommand
      }
    ];
  }

  private async handleMyCommand(args: string[], context: CommandContext) {
    // Handle command execution
    return { success: true, content: 'Command executed successfully' };
  }
}
```

This API reference provides comprehensive documentation for all major APIs in the Gemini CLI system. For specific implementation details and additional examples, refer to the source code and integration tests.