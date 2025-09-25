# Task Management System API Reference

## Overview

This document provides comprehensive API documentation for the Gemini CLI Task Management System. The system provides both programmatic APIs for integration and REST endpoints for external access.

## Table of Contents

1. [Core APIs](#core-apis)
2. [Configuration APIs](#configuration-apis)
3. [Monitoring APIs](#monitoring-apis)
4. [REST Endpoints](#rest-endpoints)
5. [WebSocket APIs](#websocket-apis)
6. [Error Handling](#error-handling)
7. [Examples](#examples)

## Core APIs

### TaskManagementSystemIntegrator

The main entry point for the integrated task management system.

#### Constructor

```typescript
new TaskManagementSystemIntegrator(config: IntegratedSystemConfig)
```

**Parameters:**
- `config` - Integrated system configuration

#### Methods

##### initialize()

Initializes the complete integrated system.

```typescript
async initialize(): Promise<SystemOperationResult>
```

**Returns:** `Promise<SystemOperationResult>`
- `success: boolean` - Whether initialization succeeded
- `message: string` - Human-readable status message
- `details?: any` - Additional details about the operation
- `timestamp: Date` - When the operation completed

**Example:**
```typescript
const integrator = new TaskManagementSystemIntegrator(config);
const result = await integrator.initialize();

if (result.success) {
  console.log('System initialized:', result.message);
} else {
  console.error('Initialization failed:', result.message);
}
```

##### queueTask()

Queues a new task for execution.

```typescript
async queueTask(
  title: string,
  description: string,
  options?: TaskOptions
): Promise<SystemOperationResult>
```

**Parameters:**
- `title: string` - Task title (required)
- `description: string` - Task description (required)
- `options?: TaskOptions` - Optional task configuration

**TaskOptions Interface:**
```typescript
interface TaskOptions {
  type?: 'implementation' | 'analysis' | 'testing' | 'documentation' | 'maintenance';
  priority?: 'low' | 'normal' | 'high' | 'critical';
  complexity?: 'low' | 'medium' | 'high';
  useAutonomousQueue?: boolean;
  dependencies?: string[];
  tags?: string[];
  estimatedDuration?: number;
  expectedOutputs?: Record<string, string>;
  metadata?: Record<string, any>;
}
```

**Example:**
```typescript
const result = await integrator.queueTask(
  'Implement user authentication',
  'Add JWT-based authentication system',
  {
    type: 'implementation',
    priority: 'high',
    complexity: 'medium',
    useAutonomousQueue: true,
    expectedOutputs: {
      'auth_service': 'Authentication service implementation',
      'tests': 'Comprehensive test suite'
    }
  }
);
```

##### getSystemHealth()

Gets comprehensive system health information.

```typescript
getSystemHealth(): SystemHealth
```

**Returns:** `SystemHealth`
```typescript
interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  components: {
    taskEngine: 'healthy' | 'warning' | 'critical' | 'disabled';
    autonomousQueue: 'healthy' | 'warning' | 'critical' | 'disabled';
    monitoring: 'healthy' | 'warning' | 'critical' | 'disabled';
    persistence: 'healthy' | 'warning' | 'critical' | 'disabled';
    hookIntegration: 'healthy' | 'warning' | 'critical' | 'disabled';
    dependencies: 'healthy' | 'warning' | 'critical' | 'disabled';
  };
  metrics: {
    tasksInQueue: number;
    tasksInProgress: number;
    tasksCompleted: number;
    tasksFailed: number;
    systemUptime: number;
    memoryUsage: number;
    cpuUsage: number;
    avgTaskDuration: number;
    taskThroughput: number;
  };
  lastHealthCheck: Date;
}
```

**Example:**
```typescript
const health = integrator.getSystemHealth();
console.log('System Status:', health.overall);
console.log('Active Tasks:', health.metrics.tasksInProgress);

if (health.components.taskEngine === 'critical') {
  console.error('Task engine needs attention');
}
```

##### getSystemStatus()

Gets detailed system status including all component information.

```typescript
getSystemStatus(): SystemStatusInfo
```

**Returns:** Comprehensive system status information including health, component stats, and timestamps.

##### getComponents()

Provides direct access to individual system components for advanced usage.

```typescript
getComponents(): {
  taskEngine?: TaskExecutionEngine;
  autonomousQueue?: EnhancedAutonomousTaskQueue;
  monitoring?: ExecutionMonitoringSystem;
  persistence?: CrossSessionPersistenceEngine;
  hookIntegration?: InfiniteHookIntegration;
  dependencyResolver?: DependencyResolver;
}
```

**Example:**
```typescript
const components = integrator.getComponents();

// Access task engine directly
if (components.taskEngine) {
  const stats = components.taskEngine.getExecutionStats();
  console.log('Engine Stats:', stats);
}

// Access monitoring system
if (components.monitoring) {
  const dashboardData = components.monitoring.getDashboardData();
  console.log('Dashboard:', dashboardData);
}
```

##### shutdown()

Gracefully shuts down the entire system.

```typescript
async shutdown(): Promise<SystemOperationResult>
```

**Returns:** `Promise<SystemOperationResult>` indicating shutdown success.

### System Factory Methods

#### createIntegratedTaskManagementSystem()

Convenience function to create and initialize the system in one call.

```typescript
async function createIntegratedTaskManagementSystem(
  config: IntegratedSystemConfig
): Promise<{
  system: TaskManagementSystemIntegrator;
  result: SystemOperationResult;
}>
```

**Example:**
```typescript
const config = SystemConfigFactory.createDevelopment(coreConfig);
const { system, result } = await createIntegratedTaskManagementSystem(config);

if (result.success) {
  // System is ready to use
  await system.queueTask('Test Task', 'Test description');
}
```

#### SystemConfigFactory

Factory methods for creating standard configurations.

##### createMinimal()

```typescript
static createMinimal(coreConfig: Config): IntegratedSystemConfig
```

Creates minimal configuration suitable for basic task execution.

##### createDevelopment()

```typescript
static createDevelopment(coreConfig: Config): IntegratedSystemConfig
```

Creates development configuration with debugging and monitoring enabled.

##### createProduction()

```typescript
static createProduction(coreConfig: Config): IntegratedSystemConfig
```

Creates production configuration with security, encryption, and enterprise features.

## Configuration APIs

### TaskManagementConfigManager

Manages system configuration with validation and runtime updates.

#### Constructor

```typescript
new TaskManagementConfigManager()
```

#### Methods

##### loadConfig()

Loads configuration from file or creates default.

```typescript
async loadConfig(
  filePath: string,
  coreConfig: Config
): Promise<TaskManagementConfiguration>
```

**Parameters:**
- `filePath: string` - Path to configuration file
- `coreConfig: Config` - Core Gemini CLI configuration

**Example:**
```typescript
const configManager = new TaskManagementConfigManager();
const config = await configManager.loadConfig('./config/task-config.json', coreConfig);
```

##### saveConfig()

Saves current configuration to file.

```typescript
async saveConfig(): Promise<void>
```

##### updateConfig()

Updates configuration at runtime.

```typescript
async updateConfig(updates: Partial<TaskManagementConfiguration>): Promise<void>
```

**Example:**
```typescript
await configManager.updateConfig({
  taskEngine: {
    maxConcurrentTasks: 8,
    timeoutMs: 600000
  },
  monitoring: {
    enableAlerts: true,
    alertThresholds: {
      taskFailureRate: 0.1,
      systemMemoryUsage: 0.8
    }
  }
});
```

##### validateConfig()

Validates configuration and provides feedback.

```typescript
validateConfig(config: TaskManagementConfiguration): ConfigValidationResult
```

**ConfigValidationResult Interface:**
```typescript
interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}
```

**Example:**
```typescript
const validation = configManager.validateConfig(config);

if (!validation.isValid) {
  console.error('Configuration errors:', validation.errors);
  console.log('Suggestions:', validation.suggestions);
}
```

##### onConfigChange()

Watches for configuration changes.

```typescript
onConfigChange(callback: (config: TaskManagementConfiguration) => void): () => void
```

**Returns:** Unsubscribe function

**Example:**
```typescript
const unsubscribe = configManager.onConfigChange((newConfig) => {
  console.log('Configuration updated:', newConfig.version);
});

// Later...
unsubscribe();
```

#### Static Methods

##### generateTemplate()

Generates configuration templates for specific use cases.

```typescript
static generateTemplate(
  useCase: 'minimal' | 'development' | 'production' | 'enterprise'
): TaskManagementConfiguration
```

**Example:**
```typescript
const prodTemplate = TaskManagementConfigManager.generateTemplate('production');
const enterpriseTemplate = TaskManagementConfigManager.generateTemplate('enterprise');
```

##### createDefaultConfig()

Creates default configuration for specified environment.

```typescript
static createDefaultConfig(
  environment: 'development' | 'staging' | 'production'
): TaskManagementConfiguration
```

### ConfigUtils

Utility functions for configuration management.

#### exportConfig()

Exports configuration to different formats.

```typescript
static exportConfig(
  config: TaskManagementConfiguration,
  format: 'json' | 'yaml' | 'env'
): string
```

**Example:**
```typescript
const jsonConfig = ConfigUtils.exportConfig(config, 'json');
const envConfig = ConfigUtils.exportConfig(config, 'env');
```

#### importConfig()

Imports configuration from different formats.

```typescript
static importConfig(
  data: string,
  format: 'json' | 'yaml' | 'env'
): Partial<TaskManagementConfiguration>
```

#### validateSchema()

Validates configuration schema.

```typescript
static validateSchema(config: any): boolean
```

## Monitoring APIs

### Real-time Monitoring

#### TaskStatusMonitor

Monitors task status and system health in real-time.

```typescript
// Get all active tasks
const tasks = taskStatusMonitor.getAllTasks();

// Register a new task for monitoring
const taskId = await taskStatusMonitor.registerTask({
  title: 'Monitor Test',
  description: 'Test task for monitoring',
  type: TaskType.IMPLEMENTATION,
  priority: TaskPriority.HIGH,
  assignedAgent: 'test-agent'
});

// Update task status
await taskStatusMonitor.updateTaskStatus(taskId, TaskStatus.IN_PROGRESS, {
  progress: 50,
  message: 'Half way complete'
});

// Get performance metrics
const metrics = taskStatusMonitor.getPerformanceMetrics();
```

#### StatusUpdateBroker

Event-driven status updates and notifications.

```typescript
// Subscribe to status events
statusUpdateBroker.subscribe({
  subscriberId: 'my-app',
  eventTypes: [StatusEventType.TASK_STATUS_CHANGED, StatusEventType.SYSTEM_ALERT],
  deliveryMethod: 'realtime'
});

// Listen for events
statusUpdateBroker.on('delivery:my-app', ({ event }) => {
  console.log('Received event:', event.type, event.data);
});

// Publish custom events
statusUpdateBroker.publish({
  type: StatusEventType.CUSTOM_EVENT,
  source: 'my-app',
  data: { message: 'Custom notification' },
  timestamp: new Date()
});
```

#### StatusHistoryAnalytics

Historical data analysis and insights.

```typescript
// Get task analytics for last 7 days
const analytics = await statusHistoryAnalytics.getTaskAnalytics({
  timeframe: AnalyticsTimeframe.LAST_7_DAYS,
  taskTypes: [TaskType.IMPLEMENTATION, TaskType.TESTING]
});

// Get agent performance metrics
const agentAnalytics = await statusHistoryAnalytics.getAgentAnalytics({
  timeframe: AnalyticsTimeframe.LAST_30_DAYS,
  agentIds: ['dev-agent-1', 'test-agent-1']
});

// Query historical data
const history = await statusHistoryAnalytics.queryHistory({
  startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
  endTime: new Date(),
  eventTypes: [StatusEventType.TASK_COMPLETED, StatusEventType.TASK_FAILED],
  limit: 100
});
```

## REST Endpoints

When the API server is enabled, the system exposes REST endpoints for external integration.

### Base URL

```
http://localhost:8080/api/v1
```

### Authentication

Production deployments support JWT authentication:

```bash
# Get access token
curl -X POST /api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "secure_password"}'

# Use token in requests
curl -H "Authorization: Bearer <token>" /api/v1/tasks
```

### Endpoints

#### System Health

```http
GET /api/v1/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "components": {
    "taskEngine": "healthy",
    "autonomousQueue": "healthy",
    "monitoring": "healthy"
  },
  "metrics": {
    "tasksInQueue": 5,
    "tasksInProgress": 2,
    "memoryUsage": 256.5
  }
}
```

#### System Status

```http
GET /api/v1/status
```

**Response:** Detailed system status including all component information.

#### Queue Task

```http
POST /api/v1/tasks
```

**Request Body:**
```json
{
  "title": "Implement feature X",
  "description": "Add new functionality for feature X",
  "options": {
    "type": "implementation",
    "priority": "high",
    "useAutonomousQueue": true,
    "expectedOutputs": {
      "code": "Implementation code",
      "tests": "Test suite"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Task queued successfully",
  "details": {
    "taskId": "task-123456789",
    "title": "Implement feature X",
    "useAutonomousQueue": true
  },
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

#### Get Task Status

```http
GET /api/v1/tasks/{taskId}
```

**Response:**
```json
{
  "id": "task-123456789",
  "title": "Implement feature X",
  "status": "in_progress",
  "progress": 75,
  "createdAt": "2025-01-01T11:00:00.000Z",
  "lastUpdate": "2025-01-01T11:45:00.000Z",
  "outputs": {
    "code": "Partial implementation completed"
  }
}
```

#### List Tasks

```http
GET /api/v1/tasks?status=active&limit=20&offset=0
```

**Query Parameters:**
- `status` - Filter by status (active, completed, failed, all)
- `type` - Filter by task type
- `priority` - Filter by priority
- `limit` - Number of results to return (default: 50)
- `offset` - Offset for pagination (default: 0)

#### System Metrics

```http
GET /api/v1/metrics
```

**Response:** Prometheus-compatible metrics format.

#### Configuration

```http
GET /api/v1/config
```

**Response:** Current system configuration (sensitive fields redacted).

```http
PUT /api/v1/config
```

**Request Body:** Partial configuration updates.

#### Administrative Endpoints

```http
POST /api/v1/admin/restart-processing
POST /api/v1/admin/clear-queue
POST /api/v1/admin/force-gc
GET  /api/v1/admin/system-info
```

## WebSocket APIs

Real-time updates via WebSocket connections.

### Connection

```javascript
const ws = new WebSocket('ws://localhost:8080/ws');

ws.onopen = () => {
  console.log('Connected to task management system');

  // Subscribe to specific events
  ws.send(JSON.stringify({
    action: 'subscribe',
    events: ['task_status_changed', 'system_alert', 'agent_status_changed']
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

### Message Types

#### Subscribe to Events

```json
{
  "action": "subscribe",
  "events": ["task_status_changed", "system_alert"],
  "filters": {
    "taskTypes": ["implementation", "testing"],
    "priorities": ["high", "critical"]
  }
}
```

#### Unsubscribe

```json
{
  "action": "unsubscribe",
  "events": ["task_status_changed"]
}
```

#### Real-time Updates

```json
{
  "type": "task_status_changed",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "data": {
    "taskId": "task-123456789",
    "status": "completed",
    "progress": 100,
    "message": "Task completed successfully"
  }
}
```

## Error Handling

### Error Types

All API methods return structured error information:

```typescript
interface SystemOperationResult {
  success: boolean;
  message: string;
  details?: {
    error?: Error;
    code?: string;
    recoverable?: boolean;
    suggestions?: string[];
  };
  timestamp: Date;
}
```

### HTTP Error Codes

| Code | Description | Example |
|------|-------------|---------|
| 400 | Bad Request | Invalid task parameters |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Task ID not found |
| 409 | Conflict | Duplicate task title |
| 429 | Rate Limited | Too many requests |
| 500 | Internal Error | System component failure |
| 503 | Service Unavailable | System initializing |

### Error Response Format

```json
{
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Task with ID 'task-123' not found",
    "details": {
      "taskId": "task-123",
      "suggestions": [
        "Check the task ID spelling",
        "Verify the task hasn't been deleted"
      ]
    },
    "timestamp": "2025-01-01T12:00:00.000Z"
  }
}
```

### Error Recovery

```typescript
// Automatic retry with exponential backoff
async function queueTaskWithRetry(system, title, description, options, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await system.queueTask(title, description, options);

      if (result.success) {
        return result;
      }

      // Check if error is recoverable
      if (result.details?.recoverable === false) {
        throw new Error(`Non-recoverable error: ${result.message}`);
      }

      if (attempt === maxRetries) {
        throw new Error(`Failed after ${maxRetries} attempts: ${result.message}`);
      }

      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));

    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      console.warn(`Attempt ${attempt} failed:`, error.message);
    }
  }
}
```

## Examples

### Basic Integration

```typescript
import {
  createIntegratedTaskManagementSystem,
  SystemConfigFactory
} from '@google/gemini-cli/task-management';

async function basicExample() {
  // 1. Create configuration
  const config = SystemConfigFactory.createDevelopment(coreConfig);

  // 2. Initialize system
  const { system, result } = await createIntegratedTaskManagementSystem(config);

  if (!result.success) {
    console.error('Initialization failed:', result.message);
    return;
  }

  // 3. Queue a task
  const taskResult = await system.queueTask(
    'Build user dashboard',
    'Create a responsive user dashboard with charts and metrics',
    {
      type: 'implementation',
      priority: 'high',
      expectedOutputs: {
        'frontend': 'React dashboard components',
        'api': 'Dashboard API endpoints',
        'tests': 'Component and API tests'
      }
    }
  );

  console.log('Task queued:', taskResult.success);

  // 4. Monitor system health
  const health = system.getSystemHealth();
  console.log('System health:', health.overall);

  // 5. Graceful shutdown
  await system.shutdown();
}
```

### Advanced Configuration

```typescript
import {
  TaskManagementSystemIntegrator,
  TaskManagementConfigManager,
  type IntegratedSystemConfig
} from '@google/gemini-cli/task-management';

async function advancedExample() {
  // 1. Load and validate configuration
  const configManager = new TaskManagementConfigManager();
  const config = await configManager.loadConfig('./custom-config.json', coreConfig);

  const validation = configManager.validateConfig(config);
  if (!validation.isValid) {
    console.error('Configuration errors:', validation.errors);
    return;
  }

  // 2. Apply runtime customizations
  await configManager.updateConfig({
    autonomousQueue: {
      maxConcurrentTasks: 12,
      breakdownThreshold: 0.6,
      learningEnabled: true
    },
    monitoring: {
      enablePredictiveAnalytics: true,
      alertThresholds: {
        taskFailureRate: 0.05,
        systemMemoryUsage: 0.75
      }
    }
  });

  // 3. Initialize with custom configuration
  const system = new TaskManagementSystemIntegrator(configManager.getConfig());
  const initResult = await system.initialize();

  if (initResult.success) {
    console.log('Advanced system initialized');

    // 4. Access individual components
    const components = system.getComponents();
    if (components.autonomousQueue) {
      const queueStatus = components.autonomousQueue.getAutonomousQueueStatus();
      console.log('Autonomy level:', queueStatus.autonomyLevel);
    }
  }

  await system.shutdown();
}
```

### Real-time Monitoring

```typescript
import {
  taskStatusMonitor,
  statusUpdateBroker,
  StatusEventType
} from '@google/gemini-cli/task-management';

async function monitoringExample() {
  // 1. Subscribe to all task events
  const subscriberId = 'monitoring-dashboard';

  statusUpdateBroker.subscribe({
    subscriberId,
    eventTypes: [
      StatusEventType.TASK_STATUS_CHANGED,
      StatusEventType.TASK_COMPLETED,
      StatusEventType.TASK_FAILED,
      StatusEventType.SYSTEM_ALERT
    ],
    deliveryMethod: 'realtime'
  });

  // 2. Handle events
  statusUpdateBroker.on(`delivery:${subscriberId}`, ({ event }) => {
    switch (event.type) {
      case StatusEventType.TASK_STATUS_CHANGED:
        console.log(`Task ${event.data.taskId}: ${event.data.status}`);
        break;

      case StatusEventType.TASK_COMPLETED:
        console.log(`✅ Completed: ${event.data.title}`);
        break;

      case StatusEventType.TASK_FAILED:
        console.error(`❌ Failed: ${event.data.title} - ${event.data.error}`);
        break;

      case StatusEventType.SYSTEM_ALERT:
        console.warn(`🚨 Alert: ${event.data.message}`);
        break;
    }
  });

  // 3. Monitor system metrics
  setInterval(() => {
    const metrics = taskStatusMonitor.getPerformanceMetrics();
    console.log('Performance:', {
      efficiency: metrics.systemEfficiency,
      throughput: metrics.taskThroughput,
      memoryUsage: metrics.memoryUsage
    });
  }, 30000);
}
```

### REST API Client

```typescript
class TaskManagementClient {
  constructor(private baseUrl: string, private token?: string) {}

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}/api/v1${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
      ...options.headers
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.message}`);
    }

    return response.json();
  }

  async getHealth() {
    return this.request('/health');
  }

  async queueTask(title: string, description: string, options: any = {}) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title, description, options })
    });
  }

  async getTask(taskId: string) {
    return this.request(`/tasks/${taskId}`);
  }

  async listTasks(filters: any = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/tasks?${params}`);
  }

  async getMetrics() {
    return this.request('/metrics');
  }
}

// Usage
const client = new TaskManagementClient('http://localhost:8080', 'your-token');

const health = await client.getHealth();
console.log('System Status:', health.status);

const taskResult = await client.queueTask(
  'Process user data',
  'Clean and validate user data imports',
  { type: 'processing', priority: 'normal' }
);
```

## Type Definitions

### Core Types

```typescript
// System configuration
interface IntegratedSystemConfig {
  core: Config;
  taskEngine?: TaskEngineConfig;
  autonomousQueue?: AutonomousQueueConfig;
  monitoring?: MonitoringConfig;
  persistence?: PersistenceConfig;
  hookIntegration?: HookIntegrationConfig;
  dependencies?: DependencyConfig;
  security?: SecurityConfig;
  development?: DevelopmentConfig;
  runtime?: RuntimeConfig;
  integrations?: IntegrationsConfig;
}

// System health
interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  components: ComponentHealthMap;
  metrics: SystemMetrics;
  lastHealthCheck: Date;
}

// Operation result
interface SystemOperationResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp: Date;
}
```

### Task Types

```typescript
enum TaskType {
  IMPLEMENTATION = 'implementation',
  ANALYSIS = 'analysis',
  TESTING = 'testing',
  DOCUMENTATION = 'documentation',
  MAINTENANCE = 'maintenance',
  SECURITY = 'security',
  PERFORMANCE = 'performance'
}

enum TaskPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical'
}

enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}
```

This API reference provides comprehensive documentation for all aspects of the Task Management System. For additional examples and advanced usage patterns, see the [Integration Guide](./INTEGRATION_GUIDE.md) and [Deployment Guide](./DEPLOYMENT_GUIDE.md).