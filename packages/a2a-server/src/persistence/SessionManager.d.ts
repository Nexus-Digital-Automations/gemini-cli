/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Session ownership and tracking information
 */
export interface SessionOwnership {
  /** Unique session identifier */
  sessionId: string;
  /** Agent/user identifier */
  ownerId: string;
  /** Hostname where session originated */
  hostname: string;
  /** Process ID of the owning process */
  processId: number;
  /** Session start timestamp */
  startedAt: string;
  /** Last activity timestamp */
  lastActivityAt: string;
  /** Session status */
  status: 'active' | 'inactive' | 'completed' | 'failed';
  /** Session type (agent, user, system) */
  type: 'agent' | 'user' | 'system';
  /** Additional session metadata */
  metadata: Record<string, unknown>;
}
/**
 * Task correlation data for cross-session tracking
 */
export interface TaskCorrelation {
  /** Primary task ID */
  taskId: string;
  /** Parent task ID if this is a subtask */
  parentTaskId?: string;
  /** Related task IDs */
  relatedTaskIds: string[];
  /** Session chain showing task hand-offs */
  sessionChain: Array<{
    sessionId: string;
    ownerId: string;
    startedAt: string;
    endedAt?: string;
    action: 'created' | 'resumed' | 'transferred' | 'completed' | 'abandoned';
    reason?: string;
  }>;
  /** Current task owner */
  currentOwner: SessionOwnership;
  /** Task dependency information */
  dependencies: {
    dependsOn: string[];
    blockedBy: string[];
    blocking: string[];
  };
  /** Cross-session continuation data */
  continuationData: {
    resumePoint?: string;
    contextSummary?: string;
    nextActions?: string[];
    preservedState?: Record<string, unknown>;
  };
}
/**
 * Session handoff data for transferring tasks between sessions
 */
export interface SessionHandoff {
  /** Unique handoff identifier */
  handoffId: string;
  /** Source session information */
  fromSession: {
    sessionId: string;
    ownerId: string;
    endedAt: string;
    reason: string;
  };
  /** Target session information */
  toSession: {
    sessionId: string;
    ownerId: string;
    startedAt: string;
    accepted: boolean;
  };
  /** Tasks being transferred */
  taskIds: string[];
  /** Handoff metadata */
  metadata: {
    transferReason: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    expectedDuration?: number;
    specialInstructions?: string;
  };
  /** Handoff status */
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'expired';
  /** Creation and completion timestamps */
  createdAt: string;
  completedAt?: string;
}
/**
 * Cross-session task management and correlation system
 *
 * Provides:
 * - Session ownership tracking and management
 * - Task correlation across multiple sessions
 * - Automatic session handoff and continuation
 * - Conflict resolution for concurrent task access
 * - Session health monitoring and recovery
 */
export declare class SessionManager {
  private storageDir;
  private currentSession;
  private activeSessions;
  private taskCorrelations;
  private healthCheckInterval?;
  constructor(storageDir?: string, ownerId?: string);
  /**
   * Initialize session manager and start monitoring
   */
  private initialize;
  /**
   * Register a new session
   */
  private registerSession;
  /**
   * Update session activity timestamp
   */
  updateSessionActivity(sessionId?: string): Promise<void>;
  /**
   * Create task correlation for cross-session tracking
   */
  createTaskCorrelation(
    taskId: string,
    parentTaskId?: string,
    relatedTaskIds?: string[],
  ): Promise<TaskCorrelation>;
  /**
   * Update task correlation with new session information
   */
  updateTaskCorrelation(
    taskId: string,
    updates: Partial<TaskCorrelation>,
  ): Promise<TaskCorrelation>;
  /**
   * Transfer task ownership to another session
   */
  transferTaskOwnership(
    taskId: string,
    targetSessionId: string,
    reason?: string,
  ): Promise<SessionHandoff>;
  /**
   * Resume task from previous session
   */
  resumeTask(taskId: string, contextSummary?: string): Promise<TaskCorrelation>;
  /**
   * Complete task and update correlation
   */
  completeTask(
    taskId: string,
    completionSummary: string,
    preservedState?: Record<string, unknown>,
  ): Promise<TaskCorrelation>;
  /**
   * Get task correlation information
   */
  getTaskCorrelation(taskId: string): Promise<TaskCorrelation | undefined>;
  /**
   * List all tasks for current session
   */
  getSessionTasks(sessionId?: string): Promise<TaskCorrelation[]>;
  /**
   * List all active sessions
   */
  getActiveSessions(): Promise<SessionOwnership[]>;
  /**
   * Detect and resolve conflicts for concurrent task access
   */
  resolveTaskConflicts(taskId: string): Promise<{
    hasConflict: boolean;
    conflictingSessions: SessionOwnership[];
    resolution?: 'transfer' | 'duplicate' | 'merge' | 'abort';
    message: string;
  }>;
  /**
   * Save task correlation to disk
   */
  private saveTaskCorrelation;
  /**
   * Load task correlation from disk
   */
  private loadTaskCorrelationFromDisk;
  /**
   * Load all task correlations from disk
   */
  private loadTaskCorrelations;
  /**
   * Load active sessions from disk
   */
  private loadActiveSessions;
  /**
   * Save session handoff record
   */
  private saveSessionHandoff;
  /**
   * Archive completed task correlation
   */
  private archiveTaskCorrelation;
  /**
   * Start health monitoring for sessions
   */
  private startHealthMonitoring;
  /**
   * Perform health check on active sessions
   */
  private performHealthCheck;
  /**
   * Clean up stale sessions
   */
  private cleanupStaleSessions;
  /**
   * Shutdown session manager
   */
  shutdown(): Promise<void>;
  /**
   * Get current session information
   */
  getCurrentSession(): SessionOwnership;
  /**
   * Get session statistics
   */
  getSessionStatistics(): Promise<{
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
    averageSessionDuration: number;
  }>;
}
