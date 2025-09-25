# Developer Guide - Autonomous Task Management System

## Overview

This guide provides comprehensive technical documentation for developers maintaining and extending the Autonomous Task Management System. It covers architecture details, code organization, extension patterns, and maintenance procedures.

## System Architecture

### Core Components Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Autonomous Task Manager API               │
│                        (v4.0.0)                           │
├─────────────────────────────────────────────────────────────┤
│  Feature Lifecycle    │  Task Orchestration  │  Agent Mgmt │
│  ┌─────────────────┐  │  ┌─────────────────┐ │ ┌─────────┐  │
│  │ suggest-feature │  │  │ task-generation │ │ │ agents  │  │
│  │ approve-feature │  │  │ task-assignment │ │ │ sessions│  │
│  │ reject-feature  │  │  │ progress-track  │ │ │ heartbeat│ │
│  │ list-features   │  │  │ dependency-mgmt │ │ │ reinit  │  │
│  └─────────────────┘  │  └─────────────────┘ │ └─────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Data Persistence Layer                  │
│  ┌─────────────────┐  │  ┌─────────────────┐ │ ┌─────────┐  │
│  │   FEATURES.json │  │  │   File Locking  │ │ │ Atomic  │  │
│  │   └─features    │  │  │   Race Prevent  │ │ │ Ops     │  │
│  │   └─agents      │  │  │   Retry Logic   │ │ │ Rollback│  │
│  │   └─tasks       │  │  │   PID Tracking  │ │ │ Backup  │  │
│  └─────────────────┘  │  └─────────────────┘ │ └─────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Class Structure

#### AutonomousTaskManagerAPI Class

The main class implementing all system functionality:

```javascript
class AutonomousTaskManagerAPI {
  constructor() {
    // Core data persistence
    this.featuresPath = FEATURES_PATH;
    this.timeout = 10000;

    // Validation schemas
    this.validStatuses = FEATURE_STATUSES;
    this.validCategories = FEATURE_CATEGORIES;
    this.validTaskStatuses = TASK_STATUSES;
    this.validTaskPriorities = TASK_PRIORITIES;

    // Runtime state management
    this.taskQueue = [];
    this.activeAgents = new Map();
    this.taskAssignments = new Map();
  }
}
```

#### Key Method Categories

1. **Feature Management Methods**
   - `suggestFeature(featureData)`
   - `approveFeature(featureId, approvalData)`
   - `rejectFeature(featureId, rejectionData)`
   - `bulkApproveFeatures(featureIds, approvalData)`
   - `listFeatures(filter)`
   - `getFeatureStats()`

2. **Agent Management Methods**
   - `initializeAgent(agentId)`
   - `reinitializeAgent(agentId)`
   - `authorizeStop(agentId, reason)`
   - `registerAgentCapabilities(agentId, capabilities)`

3. **Task Orchestration Methods (v4.0.0+)**
   - `createTaskFromFeature(featureId, taskOptions)`
   - `generateTasksFromApprovedFeatures(options)`
   - `getTaskQueue(filters)`
   - `assignTask(taskId, agentId, assignmentOptions)`
   - `updateTaskProgress(taskId, progressUpdate)`

4. **Analytics Methods**
   - `getInitializationStats()`
   - `getComprehensiveGuide()`
   - `getApiMethods()`

## Data Structures

### Feature Object Schema

```javascript
const featureSchema = {
  id: 'feature_${timestamp}_${randomHex}',
  title: 'string(10-200)', // Required
  description: 'string(20-2000)', // Required
  business_value: 'string(10-1000)', // Required
  category:
    'enhancement|bug-fix|new-feature|performance|security|documentation', // Required
  status: 'suggested|approved|rejected|implemented',
  created_at: 'ISO8601 timestamp',
  updated_at: 'ISO8601 timestamp',
  suggested_by: 'string',
  metadata: {}, // Optional additional data
};
```

### Agent Object Schema

```javascript
const agentSchema = {
  id: 'AGENT_ID',
  status: 'active|inactive',
  sessionId: "crypto.randomBytes(8).toString('hex')",
  lastHeartbeat: 'ISO8601 timestamp',
  initialized: 'ISO8601 timestamp',
  reinitialized: 'ISO8601 timestamp', // For reinitialized agents
  previousSessions: ['sessionId1', 'sessionId2'], // Session history
  capabilities: ['frontend', 'backend', 'testing', '...'], // Agent capabilities
  assigned_tasks: ['taskId1', 'taskId2'], // Currently assigned task IDs
};
```

### Task Object Schema (v4.0.0+)

```javascript
const taskSchema = {
  id: 'task_${timestamp}_${randomHex}',
  feature_id: 'feature_id', // Reference to source feature
  title: 'string',
  description: 'string',
  type: 'implementation|testing|documentation|validation|deployment|analysis',
  priority: 'critical|high|normal|low',
  status: 'queued|assigned|in_progress|blocked|completed|failed|cancelled',
  assigned_to: 'AGENT_ID',
  dependencies: ['task_id_1', 'task_id_2'], // Task dependencies
  estimated_effort: 3600, // Seconds
  required_capabilities: ['frontend', 'testing'], // Required agent capabilities
  created_at: 'ISO8601 timestamp',
  updated_at: 'ISO8601 timestamp',
  assigned_at: 'ISO8601 timestamp',
  completed_at: 'ISO8601 timestamp',
  progress_history: [
    {
      timestamp: 'ISO8601 timestamp',
      status: 'in_progress',
      progress_percentage: 75,
      notes: 'Making good progress on UI components',
      updated_by: 'AGENT_ID',
      metadata: {},
    },
  ],
  metadata: {
    auto_generated: true,
    feature_category: 'enhancement',
    business_value: 'Improves user experience',
  },
};
```

## File System Organization

### Project Structure

```
/project-root/
├── FEATURES.json                 # Main data file
├── .stop-allowed                # Temporary stop authorization flag
├── docs/
│   └── autonomous-task-management/
│       ├── README.md
│       ├── api-reference.md
│       ├── user-guide.md
│       ├── developer-guide.md   # This file
│       ├── integration-guide.md
│       ├── quality-assurance.md
│       ├── security-compliance.md
│       └── troubleshooting.md
└── /Users/jeremyparker/infinite-continue-stop-hook/
    └── taskmanager-api.js       # Core API implementation
```

### FEATURES.json Structure

```json
{
  "project": "project-name",
  "features": [
    /* Feature objects */
  ],
  "metadata": {
    "version": "1.0.0",
    "created": "2025-09-25T00:00:00.000Z",
    "updated": "2025-09-25T00:00:00.000Z",
    "total_features": 14,
    "approval_history": [
      /* Approval records */
    ],
    "initialization_stats": {
      /* Usage analytics */
    }
  },
  "workflow_config": {
    "require_approval": true,
    "auto_reject_timeout_hours": 168,
    "allowed_statuses": [
      /* Valid statuses */
    ],
    "required_fields": [
      /* Required feature fields */
    ]
  },
  "agents": {
    /* Agent objects keyed by agent ID */
  },
  "tasks": [
    /* Task objects */
  ],
  "completed_tasks": [
    /* Completed task references */
  ]
}
```

## Core Implementation Details

### File Locking Mechanism

The system uses a robust file locking mechanism to prevent race conditions:

```javascript
class FileLock {
  constructor() {
    this.maxRetries = 200;
    this.retryDelay = 5; // milliseconds
  }

  async acquire(filePath) {
    const lockPath = `${filePath}.lock`;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        // Try to create lock file exclusively
        await fs.writeFile(lockPath, process.pid.toString(), { flag: 'wx' });

        // Return unlock function
        return async () => {
          try {
            await fs.unlink(lockPath);
          } catch {
            // Lock file already removed
          }
        };
      } catch (error) {
        // Handle lock contention and stale locks
        if (error.code === 'EEXIST') {
          // Check if locking process is still alive
          const lockContent = await fs.readFile(lockPath, 'utf8');
          const lockPid = parseInt(lockContent);

          try {
            process.kill(lockPid, 0); // Check if process exists
            // Process exists, wait and retry
            await new Promise((resolve) =>
              setTimeout(resolve, this.retryDelay),
            );
          } catch {
            // Process doesn't exist, remove stale lock
            await fs.unlink(lockPath);
          }
        }
      }
    }

    throw new Error(
      `Could not acquire lock for ${filePath} after ${this.maxRetries} attempts`,
    );
  }
}
```

### Atomic Operations Pattern

All data modifications use atomic operations:

```javascript
async _atomicFeatureOperation(modifier) {
  const releaseLock = await fileLock.acquire(this.featuresPath);

  try {
    await this._ensureFeaturesFile();
    const features = await this._loadFeatures();
    const result = await modifier(features);
    await this._saveFeatures(features);
    return result;
  } finally {
    releaseLock();
  }
}
```

### ID Generation

Unique IDs are generated using timestamps and cryptographic randomness:

```javascript
_generateFeatureId() {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(6).toString('hex');
  return `feature_${timestamp}_${randomString}`;
}

_generateTaskId() {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(6).toString('hex');
  return `task_${timestamp}_${randomString}`;
}
```

### Time Bucket System

The initialization statistics use a rotating time bucket system:

```javascript
_getCurrentTimeBucket() {
  const now = new Date();
  const currentHour = now.getHours();

  // Use September 23, 2025 as reference date when start time was 7am
  const referenceDate = new Date('2025-09-23');
  const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Calculate days since reference date
  const daysSinceReference = Math.floor((currentDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));

  // Starting hour advances by 1 each day, starting from 7am on reference date
  const todayStartHour = (7 + daysSinceReference) % 24;

  // Calculate which 5-hour bucket we're in (0-4)
  const hourOffset = (currentHour - todayStartHour + 24) % 24;
  const bucketIndex = Math.floor(hourOffset / 5);

  // Generate bucket label
  const startHour = (todayStartHour + (bucketIndex * 5)) % 24;
  const endHour = (startHour + 4) % 24;

  return `${startHour.toString().padStart(2, '0')}:00-${endHour.toString().padStart(2, '0')}:59`;
}
```

## Extension Patterns

### Adding New Commands

To add a new command to the API:

1. **Define Command Handler**

   ```javascript
   async newCommand(parameters) {
     try {
       const result = await this._atomicFeatureOperation((features) => {
         // Implement command logic here
         return { success: true, data: result };
       });
       return result;
     } catch (error) {
       return { success: false, error: error.message };
     }
   }
   ```

2. **Add to CLI Interface**

   ```javascript
   case 'new-command':
     if (!args[1]) {
       throw new Error('Parameters required. Usage: new-command <params>');
     }
     result = await api.newCommand(JSON.parse(args[1]));
     break;
   ```

3. **Update Documentation**
   - Add to API reference
   - Update user guide examples
   - Include in comprehensive guide

### Adding New Validation

To add new validation schemas:

1. **Define Schema Constants**

   ```javascript
   const NEW_FIELD_VALUES = ['value1', 'value2', 'value3'];
   const NEW_REQUIRED_FIELDS = ['field1', 'field2'];
   ```

2. **Create Validation Method**

   ```javascript
   _validateNewData(data) {
     if (!data || typeof data !== 'object') {
       throw new Error('Data must be a valid object');
     }

     for (const field of NEW_REQUIRED_FIELDS) {
       if (!data[field]) {
         throw new Error(`Required field '${field}' is missing`);
       }
     }
   }
   ```

3. **Integrate into Operations**
   ```javascript
   async newOperation(data) {
     this._validateNewData(data); // Add validation
     // Continue with operation
   }
   ```

### Adding New Analytics

To add new analytics capabilities:

1. **Define Data Collection Points**

   ```javascript
   async collectAnalyticsData(operation, metadata) {
     const timestamp = new Date().toISOString();
     // Store analytics data in features.metadata.analytics
   }
   ```

2. **Create Reporting Methods**

   ```javascript
   async getNewAnalytics(timeRange, filters) {
     const features = await this._loadFeatures();
     // Process and return analytics data
   }
   ```

3. **Add to Periodic Updates**
   ```javascript
   // Update analytics during atomic operations
   features.metadata.analytics.push({
     operation: 'feature_approval',
     timestamp: new Date().toISOString(),
     metadata: analyticsData,
   });
   ```

## Testing Strategies

### Unit Testing Approach

```javascript
// Test file: taskmanager-api.test.js
const AutonomousTaskManagerAPI = require('./taskmanager-api.js');

describe('AutonomousTaskManagerAPI', () => {
  let api;
  let tempFeaturesPath;

  beforeEach(() => {
    // Set up temporary test environment
    tempFeaturesPath = `/tmp/test-features-${Date.now()}.json`;
    api = new AutonomousTaskManagerAPI();
    api.featuresPath = tempFeaturesPath;
  });

  afterEach(async () => {
    // Clean up test files
    try {
      await fs.unlink(tempFeaturesPath);
    } catch {}
  });

  describe('Feature Management', () => {
    test('should create feature suggestion', async () => {
      const featureData = {
        title: 'Test Feature',
        description: 'This is a test feature for unit testing',
        business_value: 'Validates the system works correctly',
        category: 'enhancement',
      };

      const result = await api.suggestFeature(featureData);

      expect(result.success).toBe(true);
      expect(result.feature.title).toBe('Test Feature');
      expect(result.feature.status).toBe('suggested');
    });
  });
});
```

### Integration Testing

```javascript
describe('Integration Tests', () => {
  test('should handle complete feature lifecycle', async () => {
    // 1. Create feature
    const createResult = await api.suggestFeature(testFeatureData);
    expect(createResult.success).toBe(true);

    // 2. Approve feature
    const approveResult = await api.approveFeature(createResult.feature.id);
    expect(approveResult.success).toBe(true);
    expect(approveResult.feature.status).toBe('approved');

    // 3. Generate tasks
    const taskResult = await api.generateTasksFromApprovedFeatures();
    expect(taskResult.success).toBe(true);
    expect(taskResult.generated_tasks.length).toBeGreaterThan(0);

    // 4. Assign tasks to agents
    const assignResult = await api.assignTask(
      taskResult.generated_tasks[0].id,
      'TEST_AGENT',
    );
    expect(assignResult.success).toBe(true);
  });
});
```

### Load Testing

```javascript
describe('Load Tests', () => {
  test('should handle concurrent operations', async () => {
    const concurrentOperations = Array(50)
      .fill()
      .map((_, index) =>
        api.suggestFeature({
          title: `Concurrent Feature ${index}`,
          description: `Feature created during concurrent load test ${index}`,
          business_value: `Testing concurrent operation handling ${index}`,
          category: 'enhancement',
        }),
      );

    const results = await Promise.all(concurrentOperations);

    // All operations should succeed
    results.forEach((result) => {
      expect(result.success).toBe(true);
    });

    // No duplicate IDs should be generated
    const ids = results.map((r) => r.feature.id);
    const uniqueIds = [...new Set(ids)];
    expect(uniqueIds.length).toBe(ids.length);
  });
});
```

## Performance Optimization

### Memory Management

1. **Large Dataset Handling**

   ```javascript
   // Stream large datasets instead of loading all into memory
   async processLargeFeatureSet(batchSize = 100) {
     const features = await this._loadFeatures();

     for (let i = 0; i < features.features.length; i += batchSize) {
       const batch = features.features.slice(i, i + batchSize);
       await this.processBatch(batch);

       // Allow garbage collection between batches
       if (global.gc) global.gc();
     }
   }
   ```

2. **Caching Strategy**

   ```javascript
   class PerformanceOptimizedAPI extends AutonomousTaskManagerAPI {
     constructor() {
       super();
       this.cache = new Map();
       this.cacheTimeout = 30000; // 30 seconds
     }

     async getCachedData(key) {
       const cached = this.cache.get(key);
       if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
         return cached.data;
       }
       return null;
     }
   }
   ```

### I/O Optimization

1. **Batch Operations**

   ```javascript
   async batchFeatureOperations(operations) {
     return await this._atomicFeatureOperation((features) => {
       const results = [];

       for (const operation of operations) {
         try {
           const result = this.executeOperation(features, operation);
           results.push({ success: true, result });
         } catch (error) {
           results.push({ success: false, error: error.message });
         }
       }

       return { success: true, results };
     });
   }
   ```

2. **Connection Pooling** (for future database integration)
   ```javascript
   class DatabaseIntegratedAPI extends AutonomousTaskManagerAPI {
     constructor() {
       super();
       this.connectionPool = new Pool({
         host: 'localhost',
         database: 'taskmanager',
         max: 20, // Maximum number of clients
         idleTimeoutMillis: 30000,
         connectionTimeoutMillis: 2000,
       });
     }
   }
   ```

## Monitoring and Debugging

### Logging Strategy

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({
      filename: 'taskmanager-error.log',
      level: 'error',
    }),
    new winston.transports.File({ filename: 'taskmanager.log' }),
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
});

class LoggingEnabledAPI extends AutonomousTaskManagerAPI {
  async suggestFeature(featureData) {
    logger.info('Feature suggestion started', {
      title: featureData.title,
      category: featureData.category,
    });

    try {
      const result = await super.suggestFeature(featureData);
      logger.info('Feature suggestion completed', {
        featureId: result.feature?.id,
        success: result.success,
      });
      return result;
    } catch (error) {
      logger.error('Feature suggestion failed', {
        error: error.message,
        stack: error.stack,
        featureData,
      });
      throw error;
    }
  }
}
```

### Health Checks

```javascript
async performHealthCheck() {
  const healthStatus = {
    timestamp: new Date().toISOString(),
    system: 'autonomous-task-manager',
    version: '4.0.0',
    status: 'healthy',
    checks: {}
  };

  try {
    // File system access check
    await fs.access(this.featuresPath, fs.constants.R_OK | fs.constants.W_OK);
    healthStatus.checks.filesystem = 'healthy';
  } catch (error) {
    healthStatus.checks.filesystem = 'unhealthy';
    healthStatus.status = 'degraded';
  }

  try {
    // Data integrity check
    const features = await this._loadFeatures();
    healthStatus.checks.dataIntegrity = 'healthy';
    healthStatus.statistics = {
      totalFeatures: features.features.length,
      totalAgents: Object.keys(features.agents || {}).length,
      totalTasks: (features.tasks || []).length
    };
  } catch (error) {
    healthStatus.checks.dataIntegrity = 'unhealthy';
    healthStatus.status = 'unhealthy';
  }

  return healthStatus;
}
```

## Security Considerations

### Input Validation

```javascript
_validateAndSanitizeInput(data, schema) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid input: data must be an object');
  }

  const sanitized = {};

  for (const [key, validator] of Object.entries(schema)) {
    if (validator.required && !(key in data)) {
      throw new Error(`Missing required field: ${key}`);
    }

    if (key in data) {
      const value = data[key];

      // Type validation
      if (validator.type && typeof value !== validator.type) {
        throw new Error(`Invalid type for ${key}: expected ${validator.type}`);
      }

      // Length validation
      if (validator.minLength && value.length < validator.minLength) {
        throw new Error(`${key} too short: minimum ${validator.minLength} characters`);
      }

      if (validator.maxLength && value.length > validator.maxLength) {
        throw new Error(`${key} too long: maximum ${validator.maxLength} characters`);
      }

      // Enum validation
      if (validator.enum && !validator.enum.includes(value)) {
        throw new Error(`Invalid value for ${key}: must be one of ${validator.enum.join(', ')}`);
      }

      // Sanitization
      if (typeof value === 'string') {
        sanitized[key] = value.trim().replace(/[<>]/g, ''); // Basic XSS prevention
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}
```

### Path Traversal Prevention

```javascript
_validateFilePath(filePath) {
  const resolvedPath = path.resolve(filePath);
  const projectRoot = path.resolve(PROJECT_ROOT);

  if (!resolvedPath.startsWith(projectRoot)) {
    throw new Error('Path traversal attempt detected');
  }

  return resolvedPath;
}
```

## Deployment and Operations

### Environment Configuration

```javascript
// environment.js
module.exports = {
  development: {
    timeout: 10000,
    maxRetries: 200,
    retryDelay: 5,
    logLevel: 'debug',
    enableHealthChecks: true,
  },
  production: {
    timeout: 10000,
    maxRetries: 500,
    retryDelay: 2,
    logLevel: 'info',
    enableHealthChecks: true,
    enableMetrics: true,
  },
  testing: {
    timeout: 5000,
    maxRetries: 50,
    retryDelay: 1,
    logLevel: 'error',
    enableHealthChecks: false,
  },
};
```

### Backup and Recovery

```javascript
async createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${this.featuresPath}.backup.${timestamp}`;

  try {
    const features = await this._loadFeatures();
    await fs.writeFile(backupPath, JSON.stringify(features, null, 2));

    logger.info('Backup created successfully', { backupPath });
    return { success: true, backupPath };
  } catch (error) {
    logger.error('Backup creation failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

async restoreFromBackup(backupPath) {
  try {
    const backupData = await fs.readFile(backupPath, 'utf8');
    const features = JSON.parse(backupData);

    // Validate backup data integrity
    this._validateFeaturesStructure(features);

    await this._saveFeatures(features);

    logger.info('Restore completed successfully', { backupPath });
    return { success: true, message: 'Restore completed successfully' };
  } catch (error) {
    logger.error('Restore failed', { error: error.message, backupPath });
    return { success: false, error: error.message };
  }
}
```

## Migration and Upgrades

### Version Migration

```javascript
async migrateToVersion(targetVersion) {
  const features = await this._loadFeatures();
  const currentVersion = features.metadata.version || '1.0.0';

  if (currentVersion === targetVersion) {
    return { success: true, message: 'Already at target version' };
  }

  try {
    // Create backup before migration
    await this.createBackup();

    // Apply migrations in sequence
    const migrations = this._getMigrationsToApply(currentVersion, targetVersion);

    for (const migration of migrations) {
      logger.info(`Applying migration: ${migration.version}`);
      await migration.apply(features);
      features.metadata.version = migration.version;
    }

    features.metadata.migrated_at = new Date().toISOString();
    await this._saveFeatures(features);

    logger.info('Migration completed successfully', {
      from: currentVersion,
      to: targetVersion
    });

    return {
      success: true,
      message: `Migrated from ${currentVersion} to ${targetVersion}`
    };
  } catch (error) {
    logger.error('Migration failed', {
      error: error.message,
      currentVersion,
      targetVersion
    });

    return { success: false, error: error.message };
  }
}
```

This developer guide provides comprehensive technical documentation for maintaining and extending the Autonomous Task Management System. It covers all aspects from architecture and implementation details to testing, performance optimization, and operational procedures.

---

_This guide is maintained alongside the codebase and should be updated whenever significant changes are made to the system architecture or implementation._
