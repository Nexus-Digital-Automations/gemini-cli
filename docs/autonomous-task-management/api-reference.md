# TaskManager API Reference

## Overview

The Autonomous Task Management API (v4.0.0) provides comprehensive feature lifecycle management, autonomous task orchestration, and multi-agent coordination capabilities. This API combines feature management workflows with intelligent task execution and cross-session persistence.

## Base Configuration

### API Endpoint
```
/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js
```

### Timeout Settings
All operations have a 10-second timeout for reliable execution:
```bash
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" [command] [args]
```

### Project Root Configuration
Specify project root directory for multi-project support:
```bash
node taskmanager-api.js [command] [args] --project-root /path/to/project
```

## Core Data Structures

### Feature Object
```json
{
  "id": "feature_1234567890_abc123def456",
  "title": "Feature Title (10-200 chars)",
  "description": "Detailed description (20-2000 chars)",
  "business_value": "Business justification (10-1000 chars)",
  "category": "enhancement|bug-fix|new-feature|performance|security|documentation",
  "status": "suggested|approved|rejected|implemented",
  "created_at": "2025-09-25T00:00:00.000Z",
  "updated_at": "2025-09-25T00:00:00.000Z",
  "suggested_by": "agent-id",
  "metadata": {}
}
```

### Agent Object
```json
{
  "id": "AGENT_ID",
  "status": "active|inactive",
  "sessionId": "abc123def456",
  "lastHeartbeat": "2025-09-25T00:00:00.000Z",
  "initialized": "2025-09-25T00:00:00.000Z",
  "previousSessions": ["sessionId1", "sessionId2"]
}
```

### Task Object (Enhanced in v4.0.0)
```json
{
  "id": "task_1234567890_abc123",
  "title": "Task Title",
  "description": "Task Description",
  "type": "implementation|testing|documentation|validation|deployment|analysis",
  "priority": "critical|high|normal|low",
  "status": "queued|assigned|in_progress|blocked|completed|failed|cancelled",
  "assigned_agent": "AGENT_ID",
  "dependencies": ["task_id_1", "task_id_2"],
  "estimated_duration": 1800,
  "created_at": "2025-09-25T00:00:00.000Z",
  "metadata": {}
}
```

## Discovery Commands

### Get Comprehensive Guide
Retrieves complete API documentation with examples and workflows.

```bash
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" guide
```

**Response:**
```json
{
  "success": true,
  "featureManager": {
    "version": "4.0.0",
    "description": "Advanced feature lifecycle & task orchestration system"
  },
  "featureWorkflow": {
    "description": "Strict feature approval and implementation workflow",
    "statuses": {
      "suggested": "Initial feature suggestion - requires approval",
      "approved": "Feature approved for implementation",
      "rejected": "Feature rejected with reason",
      "implemented": "Feature successfully implemented"
    }
  },
  "coreCommands": { /* ... */ },
  "workflows": { /* ... */ },
  "examples": { /* ... */ }
}
```

### List Available Methods
Returns all available API methods with usage examples.

```bash
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" methods
```

## Feature Management Commands

### Suggest Feature
Creates a new feature suggestion requiring approval.

```bash
node taskmanager-api.js suggest-feature '{"title":"Feature Name", "description":"Detailed description", "business_value":"Clear business justification", "category":"enhancement"}'
```

**Required Fields:**
- `title` (10-200 characters): Clear, concise feature name
- `description` (20-2000 characters): Comprehensive feature description
- `business_value` (10-1000 characters): Clear business justification
- `category`: One of `enhancement`, `bug-fix`, `new-feature`, `performance`, `security`, `documentation`

**Optional Fields:**
- `suggested_by`: Agent or user identifier
- `metadata`: Additional feature metadata

**Response:**
```json
{
  "success": true,
  "feature": {
    "id": "feature_1234567890_abc123def456",
    "title": "Feature Name",
    "status": "suggested",
    "created_at": "2025-09-25T00:00:00.000Z"
  },
  "message": "Feature suggestion created successfully"
}
```

### Approve Feature
Approves a suggested feature for implementation.

```bash
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" approve-feature FEATURE_ID
```

**With Approval Data:**
```bash
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" approve-feature FEATURE_ID '{"approved_by":"product-owner", "notes":"High priority for next release"}'
```

**Response:**
```json
{
  "success": true,
  "feature": {
    "id": "feature_1234567890_abc123def456",
    "status": "approved",
    "approved_by": "product-owner",
    "approval_date": "2025-09-25T00:00:00.000Z",
    "approval_notes": "High priority for next release"
  },
  "message": "Feature approved successfully"
}
```

### Reject Feature
Rejects a suggested feature with reason.

```bash
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" reject-feature FEATURE_ID
```

**With Rejection Data:**
```bash
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" reject-feature FEATURE_ID '{"rejected_by":"architect", "reason":"Technical complexity too high"}'
```

### Bulk Approve Features
Approves multiple features simultaneously.

```bash
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" bulk-approve-features '["feature_id_1", "feature_id_2", "feature_id_3"]'
```

**Response:**
```json
{
  "success": true,
  "approved_count": 2,
  "error_count": 1,
  "approved_features": [
    {"feature_id": "feature_id_1", "title": "Feature 1", "success": true},
    {"feature_id": "feature_id_2", "title": "Feature 2", "success": true}
  ],
  "errors": ["Feature feature_id_3 not found"]
}
```

### List Features
Lists features with optional filtering.

```bash
# List all features
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" list-features

# Filter by status
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" list-features '{"status":"suggested"}'

# Filter by category
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" list-features '{"category":"enhancement"}'
```

**Response:**
```json
{
  "success": true,
  "features": [
    {
      "id": "feature_1234567890_abc123def456",
      "title": "Feature Name",
      "status": "suggested",
      "category": "enhancement"
    }
  ],
  "total": 1,
  "metadata": {
    "version": "1.0.0",
    "total_features": 14
  }
}
```

### Get Feature Statistics
Retrieves comprehensive feature analytics.

```bash
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" feature-stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 14,
    "by_status": {
      "suggested": 5,
      "approved": 7,
      "implemented": 2
    },
    "by_category": {
      "enhancement": 6,
      "new-feature": 7,
      "security": 1
    },
    "recent_activity": [
      {
        "feature_id": "feature_123",
        "action": "approved",
        "timestamp": "2025-09-25T00:00:00.000Z"
      }
    ]
  }
}
```

## Agent Management Commands

### Initialize Agent
Creates a new agent session with unique session ID.

```bash
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" initialize AGENT_ID
```

**Response:**
```json
{
  "success": true,
  "agent": {
    "id": "AGENT_ID",
    "status": "initialized",
    "sessionId": "abc123def456",
    "timestamp": "2025-09-25T00:00:00.000Z"
  },
  "message": "Agent AGENT_ID successfully initialized",
  "comprehensiveGuide": { /* Complete API guide included */ }
}
```

### Reinitialize Agent
Reinitializes existing agent with new session ID while preserving history.

```bash
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" reinitialize AGENT_ID
```

**Response:**
```json
{
  "success": true,
  "agent": {
    "id": "AGENT_ID",
    "status": "reinitialized",
    "sessionId": "new_session_id",
    "timestamp": "2025-09-25T00:00:00.000Z",
    "previousSessions": 2
  },
  "message": "Agent AGENT_ID successfully reinitialized",
  "comprehensiveGuide": { /* Complete API guide included */ }
}
```

### Authorize Stop
Self-authorizes agent stop when all tasks complete and project achieves perfection.

```bash
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" authorize-stop AGENT_ID "All tasks complete and project perfect: linter✅ build✅ start✅ tests✅"
```

**Requirements for Authorization:**
- All TodoWrite tasks completed
- Linter passes with zero errors/warnings
- Build succeeds (if build script exists)
- Application starts without errors (if start script exists)
- All tests pass with adequate coverage (if tests exist)

**Response:**
```json
{
  "success": true,
  "authorization": {
    "authorized_by": "AGENT_ID",
    "reason": "All tasks complete and project perfect",
    "timestamp": "2025-09-25T00:00:00.000Z",
    "stop_flag_created": true
  },
  "message": "Stop authorized - hook will allow termination on next trigger"
}
```

## Analytics and Monitoring Commands

### Get Initialization Statistics
Retrieves detailed initialization usage statistics with time-bucketed analytics.

```bash
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" get-initialization-stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "total_initializations": 45,
    "total_reinitializations": 123,
    "current_day": "2025-09-25",
    "current_bucket": "18:00-22:59",
    "today_totals": {
      "initializations": 12,
      "reinitializations": 18,
      "combined": 30
    },
    "time_buckets": {
      "08:00-12:59": {"initializations": 5, "reinitializations": 2, "total": 7},
      "13:00-17:59": {"initializations": 3, "reinitializations": 8, "total": 11},
      "18:00-22:59": {"initializations": 4, "reinitializations": 8, "total": 12}
    },
    "recent_activity": [
      {
        "date": "2025-09-24",
        "total_init": 15,
        "total_reinit": 25,
        "buckets": { /* Previous day buckets */ }
      }
    ],
    "last_updated": "2025-09-25T00:00:00.000Z"
  }
}
```

**Time Bucket System:**
- 5-hour time buckets with daily advancing start times
- Today starts at 8am, tomorrow at 9am, etc.
- Automatic daily reset with historical data preservation
- Up to 30 days of historical data maintained

## Task Management Commands (v4.0.0 Enhanced)

### Create Autonomous Task
Creates a new task in the autonomous task queue.

```bash
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" create-task '{"title":"Task Title", "description":"Task description", "type":"implementation", "priority":"high", "estimated_duration":3600}'
```

### Assign Task to Agent
Assigns queued task to specific agent based on capabilities.

```bash
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" assign-task TASK_ID AGENT_ID
```

### Update Task Status
Updates task status and progress information.

```bash
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" update-task-status TASK_ID completed '{"completion_notes":"Task completed successfully"}'
```

### Get Task Queue Status
Retrieves current task queue status and agent workload.

```bash
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" task-queue-status
```

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": "Error message description",
  "command": "command-name",
  "timestamp": "2025-09-25T00:00:00.000Z",
  "guide": {
    "message": "Feature Management API Guide",
    "commands": ["guide", "methods", "suggest-feature", "..."]
  }
}
```

### Common Error Types

1. **Validation Errors**
   - Missing required fields
   - Invalid field lengths
   - Invalid category/status values

2. **State Errors**
   - Feature not found
   - Invalid status transitions
   - Agent session conflicts

3. **System Errors**
   - File system access issues
   - JSON parsing errors
   - Timeout exceeded

## Data Persistence

### File Structure
- **Primary Data**: `FEATURES.json` in project root
- **File Locking**: Prevents race conditions during concurrent operations
- **Atomic Operations**: All modifications use atomic file operations
- **Backup Strategy**: Automatic backup before critical operations

### Data Integrity
- **Schema Validation**: All data validated against strict schemas
- **Audit Trail**: Complete history of all changes
- **Rollback Capability**: Ability to revert changes if needed
- **Corruption Detection**: Automatic detection and recovery

## Performance Characteristics

- **Operation Timeout**: 10 seconds for all operations
- **File Lock Timeout**: 1 second with 200 retry attempts
- **Memory Usage**: Optimized for large feature sets
- **Concurrent Access**: Full support for multiple agent access
- **Response Time**: Sub-second response for most operations

## Security Features

- **Input Validation**: Comprehensive validation of all inputs
- **SQL Injection Prevention**: No SQL dependencies
- **Path Traversal Prevention**: Restricted file access
- **Race Condition Prevention**: File locking mechanisms
- **Session Security**: Cryptographically secure session IDs

---

*This API provides the foundation for autonomous task management, enabling intelligent coordination of complex development workflows with full traceability and quality assurance.*