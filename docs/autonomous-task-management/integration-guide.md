# Integration Guide - Autonomous Task Management System

## Overview

This guide provides comprehensive instructions for integrating the Autonomous Task Management System with existing development workflows, CI/CD pipelines, and third-party tools. It covers configuration options, deployment strategies, and best practices for seamless integration.

## System Requirements

### Runtime Requirements

- **Node.js**: Version 18.0.0 or higher
- **Operating System**: Linux, macOS, or Windows
- **Disk Space**: Minimum 100MB available space
- **Memory**: Minimum 512MB RAM available
- **File System**: Read/write access to project directory

### Network Requirements

- **Outbound Access**: None required for core functionality
- **Inbound Access**: Optional for monitoring endpoints
- **DNS Resolution**: Not required for core operations
- **Proxy Support**: Honors system proxy settings

### Development Environment

```bash
# Verify Node.js version
node --version  # Should be 18.0.0 or higher

# Verify npm version
npm --version   # Should be 8.0.0 or higher

# Check system resources
df -h           # Verify disk space
free -h         # Check available memory
```

## Installation and Setup

### Quick Start Installation

```bash
# 1. Navigate to your project directory
cd /path/to/your/project

# 2. Verify TaskManager API access
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" guide

# 3. Initialize the system
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" initialize MAIN_AGENT

# 4. Create your first feature
node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" suggest-feature '{
  "title": "Integration Test Feature",
  "description": "Test feature to validate system integration",
  "business_value": "Ensures the autonomous task management system is properly integrated",
  "category": "enhancement"
}'
```

### Multi-Project Configuration

For organizations managing multiple projects:

```bash
# Project A setup
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" initialize PROJECT_A_AGENT --project-root /path/to/project-a

# Project B setup
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" initialize PROJECT_B_AGENT --project-root /path/to/project-b

# Verify project isolation
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" feature-stats --project-root /path/to/project-a
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" feature-stats --project-root /path/to/project-b
```

## CI/CD Integration

### GitHub Actions Integration

Create `.github/workflows/task-management.yml`:

```yaml
name: Autonomous Task Management

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  task-validation:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Initialize Task Management System
        run: |
          timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" initialize CI_AGENT

      - name: Generate Tasks from Approved Features
        run: |
          timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" generate-tasks-from-features

      - name: Validate Task Queue
        run: |
          timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" get-task-queue

      - name: Run Quality Gates
        run: |
          # Linting
          npm run lint || exit 1

          # Type checking
          npm run typecheck || exit 1

          # Testing
          npm test || exit 1

          # Build validation
          npm run build || exit 1

      - name: Update Task Progress
        if: success()
        run: |
          timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" update-task-status CI_VALIDATION completed

      - name: Generate Task Report
        run: |
          timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" feature-stats > task-report.json
          cat task-report.json

      - name: Archive Task Report
        uses: actions/upload-artifact@v3
        with:
          name: task-management-report
          path: task-report.json
```

### GitLab CI Integration

Create `.gitlab-ci.yml`:

```yaml
stages:
  - initialize
  - validate
  - report

variables:
  NODE_VERSION: '18'

before_script:
  - node --version
  - npm --version

initialize-tasks:
  stage: initialize
  script:
    - timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" initialize GITLAB_CI_AGENT
    - timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" generate-tasks-from-features
  artifacts:
    paths:
      - FEATURES.json
    expire_in: 1 day

validate-quality:
  stage: validate
  dependencies:
    - initialize-tasks
  script:
    - npm run lint
    - npm run typecheck
    - npm test
    - npm run build
    - timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" update-task-status CI_VALIDATION completed
  artifacts:
    when: always
    reports:
      junit: test-results.xml
    paths:
      - coverage/
    expire_in: 1 week

generate-report:
  stage: report
  dependencies:
    - validate-quality
  script:
    - timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" feature-stats > task-report.json
    - timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" get-initialization-stats > usage-stats.json
  artifacts:
    paths:
      - task-report.json
      - usage-stats.json
    expire_in: 1 month
```

### Jenkins Pipeline Integration

Create `Jenkinsfile`:

```groovy
pipeline {
    agent any

    environment {
        NODE_VERSION = '18'
    }

    stages {
        stage('Setup') {
            steps {
                script {
                    // Install Node.js
                    sh 'nvm use ${NODE_VERSION}'

                    // Initialize task management
                    sh 'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" initialize JENKINS_AGENT'
                }
            }
        }

        stage('Task Generation') {
            steps {
                script {
                    // Generate tasks from approved features
                    sh 'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" generate-tasks-from-features'

                    // Get task queue status
                    def taskQueue = sh(
                        script: 'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" get-task-queue',
                        returnStdout: true
                    )

                    echo "Current task queue: ${taskQueue}"
                }
            }
        }

        stage('Quality Gates') {
            parallel {
                stage('Linting') {
                    steps {
                        sh 'npm run lint'
                    }
                }

                stage('Type Checking') {
                    steps {
                        sh 'npm run typecheck'
                    }
                }

                stage('Testing') {
                    steps {
                        sh 'npm test'
                        publishTestResults testResultsPattern: 'test-results.xml'
                    }
                }

                stage('Build') {
                    steps {
                        sh 'npm run build'
                        archiveArtifacts artifacts: 'dist/**/*'
                    }
                }
            }
        }

        stage('Task Completion') {
            steps {
                script {
                    // Mark tasks as completed
                    sh 'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" update-task-status CI_VALIDATION completed'

                    // Generate final report
                    sh 'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" feature-stats > task-report.json'

                    archiveArtifacts artifacts: 'task-report.json'
                }
            }
        }
    }

    post {
        always {
            script {
                // Cleanup and final reporting
                sh 'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" get-initialization-stats > usage-stats.json'
                archiveArtifacts artifacts: 'usage-stats.json'
            }
        }

        failure {
            script {
                // Mark tasks as failed if pipeline fails
                sh 'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" update-task-status CI_VALIDATION failed'
            }
        }
    }
}
```

## IDE Integration

### VS Code Integration

Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Initialize Task Management",
      "type": "shell",
      "command": "timeout 10s node \"/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js\" initialize VSCODE_AGENT",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      },
      "problemMatcher": []
    },
    {
      "label": "Create Feature",
      "type": "shell",
      "command": "node \"/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js\" suggest-feature",
      "args": ["${input:featureData}"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "List Features",
      "type": "shell",
      "command": "timeout 10s node \"/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js\" list-features",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "Feature Stats",
      "type": "shell",
      "command": "timeout 10s node \"/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js\" feature-stats",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    }
  ],
  "inputs": [
    {
      "id": "featureData",
      "description": "Feature JSON data",
      "default": "{\"title\":\"New Feature\", \"description\":\"Feature description\", \"business_value\":\"Business justification\", \"category\":\"enhancement\"}"
    }
  ]
}
```

Create `.vscode/settings.json`:

```json
{
  "taskManager.apiPath": "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js",
  "taskManager.defaultTimeout": 10000,
  "taskManager.autoInitialize": true,
  "taskManager.defaultAgentId": "VSCODE_AGENT",
  "files.watcherExclude": {
    "**/FEATURES.json.lock": true
  },
  "terminal.integrated.env.osx": {
    "TASK_MANAGER_API": "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js"
  }
}
```

### IntelliJ IDEA Integration

Create `.idea/runConfigurations/TaskManager_Init.xml`:

```xml
<component name="ProjectRunConfigurationManager">
  <configuration default="false" name="TaskManager Init" type="ShConfigurationType">
    <option name="SCRIPT_TEXT" value="timeout 10s node &quot;/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js&quot; initialize INTELLIJ_AGENT" />
    <option name="INDEPENDENT_SCRIPT_PATH" value="true" />
    <option name="SCRIPT_PATH" value="" />
    <option name="SCRIPT_OPTIONS" value="" />
    <option name="INDEPENDENT_SCRIPT_WORKING_DIRECTORY" value="false" />
    <option name="SCRIPT_WORKING_DIRECTORY" value="$PROJECT_DIR$" />
    <option name="INDEPENDENT_INTERPRETER_PATH" value="true" />
    <option name="INTERPRETER_PATH" value="/bin/bash" />
    <option name="INTERPRETER_OPTIONS" value="" />
    <option name="EXECUTE_IN_TERMINAL" value="true" />
    <method v="2" />
  </configuration>
</component>
```

## Package Manager Integration

### npm Scripts Integration

Add to `package.json`:

```json
{
  "scripts": {
    "task:init": "timeout 10s node \"/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js\" initialize NPM_AGENT",
    "task:suggest": "node \"/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js\" suggest-feature",
    "task:list": "timeout 10s node \"/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js\" list-features",
    "task:stats": "timeout 10s node \"/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js\" feature-stats",
    "task:approve": "timeout 10s node \"/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js\" approve-feature",
    "task:generate": "timeout 10s node \"/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js\" generate-tasks-from-features",
    "task:queue": "timeout 10s node \"/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js\" get-task-queue",
    "task:guide": "timeout 10s node \"/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js\" guide",
    "pretest": "npm run task:init",
    "postbuild": "npm run task:stats"
  }
}
```

Usage examples:

```bash
# Initialize task management
npm run task:init

# Suggest a new feature
npm run task:suggest -- '{"title":"Add Testing", "description":"Comprehensive test suite", "business_value":"Improves code quality", "category":"enhancement"}'

# List all features
npm run task:list

# Get feature statistics
npm run task:stats

# Approve a feature
npm run task:approve FEATURE_ID

# Generate tasks from approved features
npm run task:generate

# View task queue
npm run task:queue
```

### Yarn Integration

Add to `package.json` for Yarn:

```json
{
  "scripts": {
    "task:init": "timeout 10s node \"/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js\" initialize YARN_AGENT",
    "task:workflow": "yarn task:init && yarn task:generate && yarn task:stats"
  }
}
```

### pnpm Integration

Create `.pnpmfile.cjs`:

```javascript
function readPackage(pkg, context) {
  // Add task management scripts to all packages
  if (!pkg.scripts) pkg.scripts = {};

  pkg.scripts['task:init'] =
    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" initialize PNPM_AGENT';
  pkg.scripts['task:stats'] =
    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" feature-stats';

  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
```

## Git Integration

### Git Hooks Integration

Create `.git/hooks/pre-commit`:

```bash
#!/bin/sh
# Pre-commit hook for task management integration

echo "Running pre-commit task management validation..."

# Initialize task management for pre-commit
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" initialize PRE_COMMIT_AGENT

# Check for approved features requiring implementation
APPROVED_FEATURES=$(timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" list-features '{"status":"approved"}' | jq '.total')

if [ "$APPROVED_FEATURES" -gt 0 ]; then
    echo "Found $APPROVED_FEATURES approved features."

    # Generate tasks if none exist
    timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" generate-tasks-from-features

    echo "Tasks generated from approved features."
fi

# Run quality checks
npm run lint || {
    echo "Linting failed. Please fix errors before committing."
    exit 1
}

npm run typecheck || {
    echo "Type checking failed. Please fix errors before committing."
    exit 1
}

npm test || {
    echo "Tests failed. Please fix failing tests before committing."
    exit 1
}

echo "Pre-commit task management validation completed successfully."
```

Create `.git/hooks/post-commit`:

```bash
#!/bin/sh
# Post-commit hook for task progress tracking

echo "Updating task progress after commit..."

# Get current commit hash and message
COMMIT_HASH=$(git rev-parse HEAD)
COMMIT_MESSAGE=$(git log -1 --pretty=format:'%s')

# Update task progress
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" update-task-progress POST_COMMIT_UPDATE '{
  "status": "in_progress",
  "progress_percentage": 75,
  "notes": "Commit '"$COMMIT_HASH"' - '"$COMMIT_MESSAGE"'",
  "updated_by": "git-post-commit-hook",
  "metadata": {
    "commit_hash": "'"$COMMIT_HASH"'",
    "commit_message": "'"$COMMIT_MESSAGE"'"
  }
}'

echo "Task progress updated."
```

Make hooks executable:

```bash
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/post-commit
```

### Conventional Commits Integration

Create `.gitmessage` template:

```
<type>[optional scope]: <description>

[optional body]

Task-ID: <task-id>
Feature-ID: <feature-id>
Agent-ID: <agent-id>

[optional footer(s)]
```

Configure Git to use the template:

```bash
git config commit.template .gitmessage
```

Create commit message validation script `scripts/validate-commit-msg.js`:

```javascript
#!/usr/bin/env node

const fs = require('fs');
const commitMsgFile = process.argv[2];
const commitMsg = fs.readFileSync(commitMsgFile, 'utf8').trim();

// Conventional commit pattern
const conventionalCommitRegex =
  /^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .{1,50}/;

// Task management patterns
const taskIdRegex = /Task-ID: (task_\d+_[a-f0-9]+)/;
const featureIdRegex = /Feature-ID: (feature_\d+_[a-f0-9]+)/;

if (!conventionalCommitRegex.test(commitMsg)) {
  console.error(
    '❌ Invalid commit message format. Please use conventional commits.',
  );
  console.error('Format: <type>[optional scope]: <description>');
  console.error('Types: feat, fix, docs, style, refactor, test, chore');
  process.exit(1);
}

// Optional: Validate task ID if present
const taskMatch = commitMsg.match(taskIdRegex);
if (taskMatch) {
  console.log(`✅ Task ID found: ${taskMatch[1]}`);

  // Optional: Validate task exists in system
  // This could make an API call to verify the task ID
}

console.log('✅ Commit message validation passed');
```

Configure the validator:

```bash
chmod +x scripts/validate-commit-msg.js
git config core.hooksPath .githooks

# Create .githooks/commit-msg
echo '#!/bin/sh
node scripts/validate-commit-msg.js "$1"' > .githooks/commit-msg

chmod +x .githooks/commit-msg
```

## Monitoring and Observability Integration

### Prometheus Metrics Integration

Create `monitoring/prometheus-exporter.js`:

```javascript
const promClient = require('prom-client');
const express = require('express');
const TaskManagerAPI = require('/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js');

// Create metrics
const featuresTotal = new promClient.Gauge({
  name: 'taskmanager_features_total',
  help: 'Total number of features by status',
  labelNames: ['status'],
});

const agentsActive = new promClient.Gauge({
  name: 'taskmanager_agents_active_total',
  help: 'Total number of active agents',
});

const tasksInQueue = new promClient.Gauge({
  name: 'taskmanager_tasks_queue_total',
  help: 'Total number of tasks in queue by status',
  labelNames: ['status'],
});

const initializationsTotal = new promClient.Counter({
  name: 'taskmanager_initializations_total',
  help: 'Total number of agent initializations',
  labelNames: ['type'],
});

// Update metrics function
async function updateMetrics() {
  const api = new TaskManagerAPI();

  try {
    // Get feature stats
    const featureStats = await api.getFeatureStats();
    if (featureStats.success) {
      Object.entries(featureStats.stats.by_status).forEach(
        ([status, count]) => {
          featuresTotal.set({ status }, count);
        },
      );
    }

    // Get initialization stats
    const initStats = await api.getInitializationStats();
    if (initStats.success) {
      initializationsTotal.inc(
        { type: 'initialization' },
        initStats.stats.total_initializations,
      );
      initializationsTotal.inc(
        { type: 'reinitialization' },
        initStats.stats.total_reinitializations,
      );
    }

    // Get task queue stats
    const taskQueue = await api.getTaskQueue();
    if (taskQueue.success) {
      const statusCounts = taskQueue.tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {});

      Object.entries(statusCounts).forEach(([status, count]) => {
        tasksInQueue.set({ status }, count);
      });
    }
  } catch (error) {
    console.error('Error updating metrics:', error);
  }
}

// Express server for metrics endpoint
const app = express();
const port = process.env.METRICS_PORT || 9090;

app.get('/metrics', async (req, res) => {
  await updateMetrics();
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Task Manager metrics server running on port ${port}`);

  // Update metrics every 30 seconds
  setInterval(updateMetrics, 30000);
  updateMetrics(); // Initial update
});
```

Create `monitoring/grafana-dashboard.json`:

```json
{
  "dashboard": {
    "title": "Autonomous Task Management System",
    "panels": [
      {
        "title": "Features by Status",
        "type": "stat",
        "targets": [
          {
            "expr": "taskmanager_features_total",
            "legendFormat": "{{status}}"
          }
        ]
      },
      {
        "title": "Active Agents",
        "type": "stat",
        "targets": [
          {
            "expr": "taskmanager_agents_active_total"
          }
        ]
      },
      {
        "title": "Task Queue Status",
        "type": "piechart",
        "targets": [
          {
            "expr": "taskmanager_tasks_queue_total",
            "legendFormat": "{{status}}"
          }
        ]
      },
      {
        "title": "Initialization Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(taskmanager_initializations_total[5m])",
            "legendFormat": "{{type}}"
          }
        ]
      }
    ]
  }
}
```

### Logging Integration

Create `monitoring/structured-logging.js`:

```javascript
const winston = require('winston');
const TaskManagerAPI = require('/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js');

// Create structured logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: 'autonomous-task-manager' },
  transports: [
    new winston.transports.File({
      filename: 'logs/taskmanager-error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/taskmanager.log',
    }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Proxy class with logging
class LoggedTaskManagerAPI extends TaskManagerAPI {
  async suggestFeature(featureData) {
    const startTime = Date.now();

    logger.info('Feature suggestion initiated', {
      operation: 'suggest_feature',
      title: featureData.title,
      category: featureData.category,
      timestamp: new Date().toISOString(),
    });

    try {
      const result = await super.suggestFeature(featureData);

      logger.info('Feature suggestion completed', {
        operation: 'suggest_feature',
        success: result.success,
        featureId: result.feature?.id,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      logger.error('Feature suggestion failed', {
        operation: 'suggest_feature',
        error: error.message,
        stack: error.stack,
        duration: Date.now() - startTime,
      });

      throw error;
    }
  }

  async approveFeature(featureId, approvalData) {
    logger.info('Feature approval initiated', {
      operation: 'approve_feature',
      featureId,
      approvedBy: approvalData?.approved_by,
    });

    try {
      const result = await super.approveFeature(featureId, approvalData);

      logger.info('Feature approval completed', {
        operation: 'approve_feature',
        featureId,
        success: result.success,
      });

      return result;
    } catch (error) {
      logger.error('Feature approval failed', {
        operation: 'approve_feature',
        featureId,
        error: error.message,
      });

      throw error;
    }
  }
}

module.exports = LoggedTaskManagerAPI;
```

## Configuration Management

### Environment Configuration

Create `config/environment.js`:

```javascript
const path = require('path');

const environments = {
  development: {
    taskManager: {
      apiPath:
        '/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js',
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      enableDebugLogging: true,
      enableMetrics: false,
    },
    features: {
      autoApproval: false,
      autoTaskGeneration: true,
      requireBusinessValue: true,
      maxConcurrentAgents: 5,
    },
    quality: {
      requireLinting: true,
      requireTesting: true,
      requireTypeCheck: true,
      requireBuild: false,
    },
  },

  staging: {
    taskManager: {
      apiPath:
        '/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js',
      timeout: 10000,
      retryAttempts: 5,
      retryDelay: 2000,
      enableDebugLogging: false,
      enableMetrics: true,
    },
    features: {
      autoApproval: false,
      autoTaskGeneration: true,
      requireBusinessValue: true,
      maxConcurrentAgents: 8,
    },
    quality: {
      requireLinting: true,
      requireTesting: true,
      requireTypeCheck: true,
      requireBuild: true,
    },
  },

  production: {
    taskManager: {
      apiPath:
        '/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js',
      timeout: 10000,
      retryAttempts: 10,
      retryDelay: 3000,
      enableDebugLogging: false,
      enableMetrics: true,
    },
    features: {
      autoApproval: false,
      autoTaskGeneration: false,
      requireBusinessValue: true,
      maxConcurrentAgents: 10,
    },
    quality: {
      requireLinting: true,
      requireTesting: true,
      requireTypeCheck: true,
      requireBuild: true,
      requireSecurityScan: true,
    },
  },
};

const environment = process.env.NODE_ENV || 'development';
const config = environments[environment];

if (!config) {
  throw new Error(`Unknown environment: ${environment}`);
}

module.exports = {
  environment,
  config,

  // Helper functions
  getApiCommand: (command, args = []) => {
    const timeout = config.taskManager.timeout;
    const apiPath = config.taskManager.apiPath;
    const timeoutCmd = timeout ? `timeout ${timeout / 1000}s` : '';

    return `${timeoutCmd} node "${apiPath}" ${command} ${args.join(' ')}`;
  },

  shouldRetry: (attempt) => {
    return attempt < config.taskManager.retryAttempts;
  },

  getRetryDelay: () => {
    return config.taskManager.retryDelay;
  },
};
```

### Docker Integration

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache git bash

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Set environment variables
ENV NODE_ENV=production
ENV TASK_MANAGER_API_PATH=/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js

# Expose metrics port
EXPOSE 9090

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "
        const api = require('./taskmanager-api.js');
        const instance = new api();
        instance.performHealthCheck()
            .then(result => {
                if (result.status !== 'healthy') {
                    process.exit(1);
                }
            })
            .catch(() => process.exit(1));
    "

# Start application
CMD ["node", "monitoring/prometheus-exporter.js"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  taskmanager:
    build: .
    container_name: autonomous-task-manager
    restart: unless-stopped
    ports:
      - '9090:9090'
    volumes:
      - ./FEATURES.json:/app/FEATURES.json
      - ./logs:/app/logs
      - /Users/jeremyparker/infinite-continue-stop-hook:/taskmanager-api:ro
    environment:
      - NODE_ENV=production
      - METRICS_PORT=9090
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:9090/health']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  prometheus:
    image: prom/prometheus:latest
    container_name: taskmanager-prometheus
    ports:
      - '9091:9090'
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
    depends_on:
      - taskmanager

  grafana:
    image: grafana/grafana:latest
    container_name: taskmanager-grafana
    ports:
      - '3001:3000'
    volumes:
      - ./monitoring/grafana-dashboard.json:/var/lib/grafana/dashboards/taskmanager.json:ro
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    depends_on:
      - prometheus
```

Create `monitoring/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'taskmanager'
    static_configs:
      - targets: ['taskmanager:9090']
    scrape_interval: 30s
    metrics_path: /metrics
```

## Integration Testing

### End-to-End Integration Test

Create `tests/integration/full-workflow.test.js`:

```javascript
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

describe('Full Workflow Integration Test', () => {
  let testProjectPath;

  beforeAll(async () => {
    // Create temporary test project
    testProjectPath = `/tmp/taskmanager-integration-test-${Date.now()}`;
    await fs.mkdir(testProjectPath, { recursive: true });
    process.chdir(testProjectPath);
  });

  afterAll(async () => {
    // Cleanup
    await fs.rmdir(testProjectPath, { recursive: true });
  });

  test('Complete feature lifecycle with multiple agents', async () => {
    const apiPath =
      '/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js';

    // 1. Initialize multiple agents
    const agents = [
      'INTEGRATION_TEST_MAIN',
      'INTEGRATION_TEST_DEV',
      'INTEGRATION_TEST_QA',
    ];

    for (const agentId of agents) {
      const result = await runCommand(
        `timeout 10s node "${apiPath}" initialize ${agentId}`,
      );
      expect(result.exitCode).toBe(0);
    }

    // 2. Suggest multiple features
    const features = [
      {
        title: 'Integration Test Feature 1',
        description: 'First test feature for integration testing',
        business_value: 'Validates feature suggestion workflow',
        category: 'enhancement',
      },
      {
        title: 'Integration Test Feature 2',
        description: 'Second test feature for integration testing',
        business_value: 'Validates concurrent feature management',
        category: 'new-feature',
      },
    ];

    const featureIds = [];
    for (const feature of features) {
      const result = await runCommand(
        `node "${apiPath}" suggest-feature '${JSON.stringify(feature)}'`,
      );
      expect(result.exitCode).toBe(0);

      const output = JSON.parse(result.stdout);
      expect(output.success).toBe(true);
      featureIds.push(output.feature.id);
    }

    // 3. Approve features
    for (const featureId of featureIds) {
      const result = await runCommand(
        `timeout 10s node "${apiPath}" approve-feature ${featureId}`,
      );
      expect(result.exitCode).toBe(0);

      const output = JSON.parse(result.stdout);
      expect(output.success).toBe(true);
      expect(output.feature.status).toBe('approved');
    }

    // 4. Generate tasks from approved features
    const taskGenResult = await runCommand(
      `timeout 10s node "${apiPath}" generate-tasks-from-features`,
    );
    expect(taskGenResult.exitCode).toBe(0);

    const taskGenOutput = JSON.parse(taskGenResult.stdout);
    expect(taskGenOutput.success).toBe(true);
    expect(taskGenOutput.generated_tasks.length).toBeGreaterThan(0);

    // 5. Get task queue and verify tasks
    const queueResult = await runCommand(
      `timeout 10s node "${apiPath}" get-task-queue`,
    );
    expect(queueResult.exitCode).toBe(0);

    const queueOutput = JSON.parse(queueResult.stdout);
    expect(queueOutput.success).toBe(true);
    expect(queueOutput.tasks.length).toBeGreaterThan(0);

    // 6. Assign tasks to agents
    const taskId = queueOutput.tasks[0].id;
    const assignResult = await runCommand(
      `timeout 10s node "${apiPath}" assign-task ${taskId} ${agents[1]}`,
    );
    expect(assignResult.exitCode).toBe(0);

    const assignOutput = JSON.parse(assignResult.stdout);
    expect(assignOutput.success).toBe(true);

    // 7. Update task progress
    const progressUpdate = {
      status: 'in_progress',
      progress_percentage: 50,
      notes: 'Integration test progress update',
      updated_by: agents[1],
    };

    const progressResult = await runCommand(
      `timeout 10s node "${apiPath}" update-task-progress ${taskId} '${JSON.stringify(progressUpdate)}'`,
    );
    expect(progressResult.exitCode).toBe(0);

    const progressOutput = JSON.parse(progressResult.stdout);
    expect(progressOutput.success).toBe(true);

    // 8. Get final statistics
    const statsResult = await runCommand(
      `timeout 10s node "${apiPath}" feature-stats`,
    );
    expect(statsResult.exitCode).toBe(0);

    const statsOutput = JSON.parse(statsResult.stdout);
    expect(statsOutput.success).toBe(true);
    expect(statsOutput.stats.total).toBe(features.length);
    expect(statsOutput.stats.by_status.approved).toBe(features.length);

    // 9. Verify initialization stats
    const initStatsResult = await runCommand(
      `timeout 10s node "${apiPath}" get-initialization-stats`,
    );
    expect(initStatsResult.exitCode).toBe(0);

    const initStatsOutput = JSON.parse(initStatsResult.stdout);
    expect(initStatsOutput.success).toBe(true);
    expect(initStatsOutput.stats.total_initializations).toBeGreaterThanOrEqual(
      agents.length,
    );
  }, 60000); // 60 second timeout for full workflow

  async function runCommand(command) {
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(' ');
      const child = spawn(cmd, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: testProjectPath,
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          exitCode: code,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
        });
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }
});
```

This comprehensive integration guide provides all the necessary information for integrating the Autonomous Task Management System with various development tools, CI/CD pipelines, and monitoring systems. The configurations and examples shown are production-ready and follow industry best practices.

---

_This integration guide should be customized based on your specific development environment and toolchain requirements._
