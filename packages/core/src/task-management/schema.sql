-- Database schema for comprehensive autonomous task management system
-- @license Copyright 2025 Google LLC, SPDX-License-Identifier: Apache-2.0

-- Enable foreign key constraints globally
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = -64000;
PRAGMA temp_store = MEMORY;
PRAGMA mmap_size = 268435456;

-- ================================================================================
-- CORE TABLES
-- ================================================================================

-- Tasks table for storing comprehensive task definitions and state
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'ready', 'in_progress', 'completed', 'failed', 'blocked', 'cancelled')),
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  category TEXT NOT NULL CHECK (category IN ('implementation', 'testing', 'documentation', 'analysis', 'refactoring', 'deployment')),

  -- Metadata fields
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL,
  estimated_duration INTEGER, -- in milliseconds
  start_time DATETIME,
  end_time DATETIME,
  actual_duration INTEGER, -- in milliseconds
  retry_count INTEGER DEFAULT 0,

  -- Task configuration (JSON stored fields)
  parameters TEXT, -- JSON: task-specific parameters
  expected_output TEXT, -- JSON: expected output schema
  validation_criteria TEXT, -- JSON: array of validation criteria
  execution_context TEXT, -- JSON: ExecutionContext
  metadata TEXT, -- JSON: TaskMetadata with tags, custom fields, etc.

  -- Task execution state
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  last_error TEXT, -- JSON: last error information

  -- Version control for optimistic locking
  version INTEGER DEFAULT 1,

  -- Soft delete support
  deleted_at DATETIME,
  deleted_by TEXT
);

-- Sessions table for cross-session coordination and agent tracking
CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_heartbeat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME,

  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated', 'crashed')),

  -- Session configuration
  working_directory TEXT,
  environment TEXT, -- JSON: environment variables
  configuration TEXT, -- JSON: session-specific configuration

  -- Session metadata
  metadata TEXT, -- JSON: session metadata

  -- Session tracking
  task_count INTEGER DEFAULT 0,
  completed_task_count INTEGER DEFAULT 0,
  failed_task_count INTEGER DEFAULT 0,

  -- Resource usage tracking
  cpu_time INTEGER DEFAULT 0, -- in milliseconds
  memory_usage INTEGER DEFAULT 0, -- in bytes
  disk_usage INTEGER DEFAULT 0, -- in bytes

  -- Performance metrics
  average_task_duration INTEGER DEFAULT 0, -- in milliseconds
  success_rate REAL DEFAULT 0.0 CHECK (success_rate >= 0.0 AND success_rate <= 1.0)
);

-- Task dependencies table for complex dependency management
CREATE TABLE IF NOT EXISTS task_dependencies (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  dependent_task_id TEXT NOT NULL,
  depends_on_task_id TEXT NOT NULL,

  type TEXT NOT NULL CHECK (type IN ('hard', 'soft', 'resource', 'temporal')),
  reason TEXT,
  parallelizable BOOLEAN DEFAULT FALSE,
  min_delay INTEGER DEFAULT 0, -- minimum delay in milliseconds

  -- Dependency metadata
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL,

  -- Conditional dependencies
  condition_expression TEXT, -- SQL-like condition expression
  condition_parameters TEXT, -- JSON: parameters for condition evaluation

  -- Foreign key constraints
  FOREIGN KEY (dependent_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id) ON DELETE CASCADE,

  -- Ensure no duplicate dependencies
  UNIQUE(dependent_task_id, depends_on_task_id, type)
);

-- Task ownership/locks table for safe concurrent execution
CREATE TABLE IF NOT EXISTS task_ownership (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  task_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,

  acquired_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  renewed_at DATETIME,

  type TEXT NOT NULL DEFAULT 'exclusive' CHECK (type IN ('exclusive', 'shared', 'read-only')),

  -- Lock metadata
  lock_reason TEXT,
  metadata TEXT, -- JSON: additional lock metadata

  -- Lock hierarchy for nested locks
  parent_lock_id TEXT,

  -- Foreign key constraints
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE,
  FOREIGN KEY (parent_lock_id) REFERENCES task_ownership(id) ON DELETE CASCADE,

  -- Ensure one exclusive lock per task
  UNIQUE(task_id, session_id) DEFERRABLE INITIALLY DEFERRED
);

-- Execution history table for comprehensive audit trail
CREATE TABLE IF NOT EXISTS execution_history (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  task_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,

  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME,
  duration INTEGER, -- in milliseconds

  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'completed', 'failed', 'cancelled', 'timeout')),

  -- State transitions
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,

  -- Execution results
  result TEXT, -- JSON: TaskResult
  output TEXT, -- JSON: task output data
  error TEXT, -- JSON: error information

  -- Execution metadata
  metadata TEXT, -- JSON: execution metadata

  -- Performance metrics
  cpu_time INTEGER DEFAULT 0, -- in milliseconds
  memory_usage INTEGER DEFAULT 0, -- in bytes
  disk_io INTEGER DEFAULT 0, -- in bytes
  network_io INTEGER DEFAULT 0, -- in bytes

  -- Retry information
  retry_attempt INTEGER DEFAULT 0,
  is_retry BOOLEAN DEFAULT FALSE,
  original_execution_id TEXT,

  -- Foreign key constraints
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE,
  FOREIGN KEY (original_execution_id) REFERENCES execution_history(id) ON DELETE SET NULL
);

-- Execution plans table for task scheduling and resource allocation
CREATE TABLE IF NOT EXISTS execution_plans (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL,

  -- Plan status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'executing', 'completed', 'cancelled')),

  -- Execution data (JSON stored)
  sequence TEXT NOT NULL, -- JSON: ExecutionSequence
  resource_allocations TEXT, -- JSON: ResourceAllocation[]
  dependency_resolution TEXT, -- JSON: dependency resolution strategy

  -- Plan metadata
  metadata TEXT, -- JSON: plan metadata including algorithm, constraints, assumptions

  -- Execution tracking
  started_at DATETIME,
  completed_at DATETIME,
  estimated_duration INTEGER, -- in milliseconds
  actual_duration INTEGER, -- in milliseconds

  -- Statistics
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  failed_tasks INTEGER DEFAULT 0,
  success_rate REAL DEFAULT 0.0 CHECK (success_rate >= 0.0 AND success_rate <= 1.0),

  -- Version control
  version INTEGER DEFAULT 1,
  parent_plan_id TEXT,

  FOREIGN KEY (parent_plan_id) REFERENCES execution_plans(id) ON DELETE SET NULL
);

-- Task-plan associations for tracking which tasks belong to which plans
CREATE TABLE IF NOT EXISTS plan_tasks (
  plan_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  sequence_order INTEGER NOT NULL,
  parallel_group INTEGER DEFAULT 0,
  is_critical_path BOOLEAN DEFAULT FALSE,
  estimated_start DATETIME,
  estimated_end DATETIME,
  actual_start DATETIME,
  actual_end DATETIME,

  PRIMARY KEY (plan_id, task_id),
  FOREIGN KEY (plan_id) REFERENCES execution_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Resource pools table for resource management
CREATE TABLE IF NOT EXISTS resource_pools (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL, -- cpu, memory, network, storage, etc.
  total_capacity INTEGER NOT NULL,
  available_capacity INTEGER NOT NULL,
  reserved_capacity INTEGER DEFAULT 0,

  -- Resource configuration
  configuration TEXT, -- JSON: resource-specific configuration

  -- Monitoring
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CHECK (available_capacity >= 0),
  CHECK (reserved_capacity >= 0),
  CHECK (available_capacity + reserved_capacity <= total_capacity)
);

-- Resource allocations table for tracking resource usage
CREATE TABLE IF NOT EXISTS resource_allocations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  task_id TEXT NOT NULL,
  resource_pool_id TEXT NOT NULL,
  session_id TEXT NOT NULL,

  allocated_units INTEGER NOT NULL,
  allocated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  released_at DATETIME,
  expected_release_at DATETIME,

  -- Allocation metadata
  allocation_reason TEXT,
  metadata TEXT, -- JSON

  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (resource_pool_id) REFERENCES resource_pools(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
);

-- ================================================================================
-- MONITORING AND ANALYTICS TABLES
-- ================================================================================

-- Task metrics table for performance analytics
CREATE TABLE IF NOT EXISTS task_metrics (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  task_id TEXT NOT NULL,
  session_id TEXT NOT NULL,

  collected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Performance metrics
  execution_time INTEGER, -- in milliseconds
  cpu_usage REAL, -- percentage
  memory_usage INTEGER, -- in bytes
  disk_io INTEGER, -- in bytes
  network_io INTEGER, -- in bytes

  -- Quality metrics
  success_rate REAL CHECK (success_rate >= 0.0 AND success_rate <= 1.0),
  error_rate REAL CHECK (error_rate >= 0.0 AND error_rate <= 1.0),
  retry_rate REAL CHECK (retry_rate >= 0.0 AND retry_rate <= 1.0),

  -- Custom metrics (JSON)
  custom_metrics TEXT,

  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
);

-- System metrics table for overall system monitoring
CREATE TABLE IF NOT EXISTS system_metrics (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  collected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- System statistics
  active_sessions INTEGER DEFAULT 0,
  total_tasks INTEGER DEFAULT 0,
  active_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  failed_tasks INTEGER DEFAULT 0,

  -- Performance statistics
  average_execution_time REAL DEFAULT 0.0,
  system_cpu_usage REAL DEFAULT 0.0,
  system_memory_usage INTEGER DEFAULT 0,
  database_size INTEGER DEFAULT 0,

  -- Queue statistics
  queue_depth INTEGER DEFAULT 0,
  queue_wait_time REAL DEFAULT 0.0,
  throughput REAL DEFAULT 0.0, -- tasks per minute

  -- Custom system metrics (JSON)
  custom_metrics TEXT
);

-- Event log table for system events and debugging
CREATE TABLE IF NOT EXISTS event_log (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Event classification
  level TEXT NOT NULL CHECK (level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL')),
  category TEXT NOT NULL, -- task, session, system, database, etc.
  event_type TEXT NOT NULL,

  -- Event context
  session_id TEXT,
  task_id TEXT,
  agent_id TEXT,

  -- Event data
  message TEXT NOT NULL,
  details TEXT, -- JSON: detailed event information
  stack_trace TEXT,

  -- Event metadata
  source_file TEXT,
  source_line INTEGER,
  thread_id TEXT,
  process_id INTEGER,

  FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE SET NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

-- ================================================================================
-- BACKUP AND RECOVERY TABLES
-- ================================================================================

-- Backup metadata table
CREATE TABLE IF NOT EXISTS backup_metadata (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'incremental', 'differential')),

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL,

  -- Backup file information
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  compression_ratio REAL,
  checksum TEXT,

  -- Backup content metadata
  task_count INTEGER DEFAULT 0,
  session_count INTEGER DEFAULT 0,
  execution_count INTEGER DEFAULT 0,

  -- Backup validity
  is_valid BOOLEAN DEFAULT TRUE,
  verified_at DATETIME,

  -- Retention information
  expires_at DATETIME,

  -- Recovery information
  recovery_tested BOOLEAN DEFAULT FALSE,
  last_recovery_test DATETIME
);

-- ================================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ================================================================================

-- Task table indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_status_priority ON tasks(status, priority) WHERE deleted_at IS NULL;

-- Session table indexes
CREATE INDEX IF NOT EXISTS idx_sessions_agent_id ON sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_last_heartbeat ON sessions(last_heartbeat);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);

-- Dependency table indexes
CREATE INDEX IF NOT EXISTS idx_dependencies_dependent ON task_dependencies(dependent_task_id);
CREATE INDEX IF NOT EXISTS idx_dependencies_depends_on ON task_dependencies(depends_on_task_id);
CREATE INDEX IF NOT EXISTS idx_dependencies_type ON task_dependencies(type);
CREATE INDEX IF NOT EXISTS idx_dependencies_created_at ON task_dependencies(created_at);

-- Ownership table indexes
CREATE INDEX IF NOT EXISTS idx_ownership_task_id ON task_ownership(task_id);
CREATE INDEX IF NOT EXISTS idx_ownership_session_id ON task_ownership(session_id);
CREATE INDEX IF NOT EXISTS idx_ownership_agent_id ON task_ownership(agent_id);
CREATE INDEX IF NOT EXISTS idx_ownership_expires_at ON task_ownership(expires_at);
CREATE INDEX IF NOT EXISTS idx_ownership_type ON task_ownership(type);

-- Execution history indexes
CREATE INDEX IF NOT EXISTS idx_history_task_id ON execution_history(task_id);
CREATE INDEX IF NOT EXISTS idx_history_session_id ON execution_history(session_id);
CREATE INDEX IF NOT EXISTS idx_history_agent_id ON execution_history(agent_id);
CREATE INDEX IF NOT EXISTS idx_history_started_at ON execution_history(started_at);
CREATE INDEX IF NOT EXISTS idx_history_status ON execution_history(status);
CREATE INDEX IF NOT EXISTS idx_history_duration ON execution_history(duration);

-- Execution plan indexes
CREATE INDEX IF NOT EXISTS idx_plans_status ON execution_plans(status);
CREATE INDEX IF NOT EXISTS idx_plans_created_at ON execution_plans(created_at);
CREATE INDEX IF NOT EXISTS idx_plans_created_by ON execution_plans(created_by);

-- Resource management indexes
CREATE INDEX IF NOT EXISTS idx_resource_pools_type ON resource_pools(type);
CREATE INDEX IF NOT EXISTS idx_resource_allocations_task ON resource_allocations(task_id);
CREATE INDEX IF NOT EXISTS idx_resource_allocations_pool ON resource_allocations(resource_pool_id);
CREATE INDEX IF NOT EXISTS idx_resource_allocations_active ON resource_allocations(allocated_at) WHERE released_at IS NULL;

-- Monitoring indexes
CREATE INDEX IF NOT EXISTS idx_task_metrics_collected ON task_metrics(collected_at);
CREATE INDEX IF NOT EXISTS idx_system_metrics_collected ON system_metrics(collected_at);
CREATE INDEX IF NOT EXISTS idx_event_log_timestamp ON event_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_event_log_level ON event_log(level);
CREATE INDEX IF NOT EXISTS idx_event_log_category ON event_log(category);

-- ================================================================================
-- TRIGGERS FOR AUTOMATED MAINTENANCE
-- ================================================================================

-- Update timestamp triggers
CREATE TRIGGER IF NOT EXISTS update_tasks_timestamp
  AFTER UPDATE ON tasks
  WHEN NEW.updated_at = OLD.updated_at
  BEGIN
    UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_sessions_heartbeat
  AFTER UPDATE ON sessions
  WHEN NEW.last_heartbeat = OLD.last_heartbeat
  BEGIN
    UPDATE sessions SET last_heartbeat = CURRENT_TIMESTAMP WHERE session_id = NEW.session_id;
  END;

CREATE TRIGGER IF NOT EXISTS update_execution_plans_timestamp
  AFTER UPDATE ON execution_plans
  WHEN NEW.updated_at = OLD.updated_at
  BEGIN
    UPDATE execution_plans SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_resource_pools_timestamp
  AFTER UPDATE ON resource_pools
  WHEN NEW.updated_at = OLD.updated_at
  BEGIN
    UPDATE resource_pools SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

-- Task version increment trigger for optimistic locking
CREATE TRIGGER IF NOT EXISTS increment_task_version
  AFTER UPDATE ON tasks
  WHEN NEW.version = OLD.version
  BEGIN
    UPDATE tasks SET version = version + 1 WHERE id = NEW.id;
  END;

-- Execution plan version increment trigger
CREATE TRIGGER IF NOT EXISTS increment_plan_version
  AFTER UPDATE ON execution_plans
  WHEN NEW.version = OLD.version
  BEGIN
    UPDATE execution_plans SET version = version + 1 WHERE id = NEW.id;
  END;

-- Session statistics update triggers
CREATE TRIGGER IF NOT EXISTS update_session_stats_on_task_complete
  AFTER UPDATE ON tasks
  WHEN OLD.status != 'completed' AND NEW.status = 'completed'
  BEGIN
    UPDATE sessions SET
      completed_task_count = completed_task_count + 1,
      success_rate = CAST(completed_task_count AS REAL) / CAST(task_count AS REAL)
    WHERE session_id IN (
      SELECT DISTINCT session_id FROM execution_history WHERE task_id = NEW.id
    );
  END;

CREATE TRIGGER IF NOT EXISTS update_session_stats_on_task_fail
  AFTER UPDATE ON tasks
  WHEN OLD.status != 'failed' AND NEW.status = 'failed'
  BEGIN
    UPDATE sessions SET
      failed_task_count = failed_task_count + 1,
      success_rate = CAST(completed_task_count AS REAL) / CAST(task_count AS REAL)
    WHERE session_id IN (
      SELECT DISTINCT session_id FROM execution_history WHERE task_id = NEW.id
    );
  END;

-- Resource capacity management triggers
CREATE TRIGGER IF NOT EXISTS update_resource_capacity_on_allocation
  AFTER INSERT ON resource_allocations
  BEGIN
    UPDATE resource_pools
    SET available_capacity = available_capacity - NEW.allocated_units
    WHERE id = NEW.resource_pool_id;
  END;

CREATE TRIGGER IF NOT EXISTS update_resource_capacity_on_release
  AFTER UPDATE ON resource_allocations
  WHEN OLD.released_at IS NULL AND NEW.released_at IS NOT NULL
  BEGIN
    UPDATE resource_pools
    SET available_capacity = available_capacity + NEW.allocated_units
    WHERE id = NEW.resource_pool_id;
  END;

-- Event logging triggers for critical events
CREATE TRIGGER IF NOT EXISTS log_task_status_change
  AFTER UPDATE ON tasks
  WHEN OLD.status != NEW.status
  BEGIN
    INSERT INTO event_log (level, category, event_type, task_id, message, details)
    VALUES (
      'INFO',
      'task',
      'status_change',
      NEW.id,
      'Task status changed from ' || OLD.status || ' to ' || NEW.status,
      json_object(
        'task_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'task_title', NEW.title
      )
    );
  END;

CREATE TRIGGER IF NOT EXISTS log_session_status_change
  AFTER UPDATE ON sessions
  WHEN OLD.status != NEW.status
  BEGIN
    INSERT INTO event_log (level, category, event_type, session_id, agent_id, message, details)
    VALUES (
      'INFO',
      'session',
      'status_change',
      NEW.session_id,
      NEW.agent_id,
      'Session status changed from ' || OLD.status || ' to ' || NEW.status,
      json_object(
        'session_id', NEW.session_id,
        'agent_id', NEW.agent_id,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END;

-- ================================================================================
-- VIEWS FOR COMMON QUERIES
-- ================================================================================

-- Active tasks view with enriched information
CREATE VIEW IF NOT EXISTS active_tasks AS
SELECT
  t.*,
  s.agent_id as current_agent,
  s.session_id as current_session,
  eh.started_at as execution_started_at,
  COUNT(td.depends_on_task_id) as dependency_count,
  COUNT(td_blocked.dependent_task_id) as blocking_count
FROM tasks t
LEFT JOIN task_ownership to_active ON t.id = to_active.task_id AND to_active.expires_at > CURRENT_TIMESTAMP
LEFT JOIN sessions s ON to_active.session_id = s.session_id
LEFT JOIN execution_history eh ON t.id = eh.task_id AND eh.status = 'started'
LEFT JOIN task_dependencies td ON t.id = td.dependent_task_id
LEFT JOIN task_dependencies td_blocked ON t.id = td_blocked.depends_on_task_id
WHERE t.status IN ('pending', 'ready', 'in_progress', 'blocked')
  AND t.deleted_at IS NULL
GROUP BY t.id;

-- Session performance view
CREATE VIEW IF NOT EXISTS session_performance AS
SELECT
  s.session_id,
  s.agent_id,
  s.status,
  s.started_at,
  s.last_heartbeat,
  s.task_count,
  s.completed_task_count,
  s.failed_task_count,
  s.success_rate,
  AVG(eh.duration) as avg_task_duration,
  COUNT(DISTINCT eh.task_id) as executed_tasks,
  MAX(eh.ended_at) as last_task_completion,
  SUM(eh.cpu_time) as total_cpu_time,
  MAX(eh.memory_usage) as peak_memory_usage
FROM sessions s
LEFT JOIN execution_history eh ON s.session_id = eh.session_id
GROUP BY s.session_id;

-- Task dependency graph view
CREATE VIEW IF NOT EXISTS task_dependency_graph AS
SELECT
  td.dependent_task_id,
  td.depends_on_task_id,
  td.type,
  td.reason,
  td.parallelizable,
  t_dep.title as dependent_task_title,
  t_dep.status as dependent_task_status,
  t_dep.priority as dependent_task_priority,
  t_on.title as depends_on_task_title,
  t_on.status as depends_on_task_status,
  t_on.priority as depends_on_task_priority
FROM task_dependencies td
JOIN tasks t_dep ON td.dependent_task_id = t_dep.id
JOIN tasks t_on ON td.depends_on_task_id = t_on.id
WHERE t_dep.deleted_at IS NULL AND t_on.deleted_at IS NULL;

-- Resource utilization view
CREATE VIEW IF NOT EXISTS resource_utilization AS
SELECT
  rp.id as pool_id,
  rp.name as pool_name,
  rp.type as resource_type,
  rp.total_capacity,
  rp.available_capacity,
  rp.reserved_capacity,
  COUNT(ra.id) as active_allocations,
  SUM(ra.allocated_units) as allocated_units,
  CAST(SUM(ra.allocated_units) AS REAL) / CAST(rp.total_capacity AS REAL) as utilization_ratio
FROM resource_pools rp
LEFT JOIN resource_allocations ra ON rp.id = ra.resource_pool_id AND ra.released_at IS NULL
GROUP BY rp.id;

-- System health view
CREATE VIEW IF NOT EXISTS system_health AS
SELECT
  COUNT(CASE WHEN s.status = 'active' THEN 1 END) as active_sessions,
  COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as running_tasks,
  COUNT(CASE WHEN t.status = 'pending' OR t.status = 'ready' THEN 1 END) as queued_tasks,
  COUNT(CASE WHEN t.status = 'blocked' THEN 1 END) as blocked_tasks,
  COUNT(CASE WHEN t.status = 'failed' THEN 1 END) as failed_tasks,
  COUNT(CASE WHEN to_exp.expires_at < CURRENT_TIMESTAMP THEN 1 END) as expired_locks,
  AVG(CAST(t.progress_percentage AS REAL)) as avg_progress,
  COUNT(CASE WHEN eh.status = 'failed' AND eh.started_at > datetime('now', '-1 hour') THEN 1 END) as recent_failures
FROM sessions s
CROSS JOIN tasks t
LEFT JOIN task_ownership to_exp ON t.id = to_exp.task_id
LEFT JOIN execution_history eh ON t.id = eh.task_id
WHERE t.deleted_at IS NULL;

-- ================================================================================
-- INITIALIZATION AND MAINTENANCE
-- ================================================================================

-- Insert default resource pools
INSERT OR IGNORE INTO resource_pools (name, type, total_capacity, available_capacity) VALUES
  ('cpu_pool', 'cpu', 100, 100),
  ('memory_pool', 'memory', 8192, 8192), -- 8GB in MB
  ('disk_pool', 'storage', 102400, 102400), -- 100GB in MB
  ('network_pool', 'network', 1000, 1000); -- 1Gbps in Mbps

-- Create initial system metrics entry
INSERT OR IGNORE INTO system_metrics (id, collected_at, active_sessions, total_tasks, active_tasks, completed_tasks, failed_tasks)
VALUES ('initial', CURRENT_TIMESTAMP, 0, 0, 0, 0, 0);

-- Log schema creation event
INSERT INTO event_log (level, category, event_type, message, details)
VALUES (
  'INFO',
  'system',
  'schema_initialization',
  'Task management database schema initialized',
  json_object(
    'version', '1.0.0',
    'tables_created', json_array(
      'tasks', 'sessions', 'task_dependencies', 'task_ownership',
      'execution_history', 'execution_plans', 'plan_tasks',
      'resource_pools', 'resource_allocations', 'task_metrics',
      'system_metrics', 'event_log', 'backup_metadata'
    ),
    'views_created', json_array(
      'active_tasks', 'session_performance', 'task_dependency_graph',
      'resource_utilization', 'system_health'
    ),
    'timestamp', CURRENT_TIMESTAMP
  )
);