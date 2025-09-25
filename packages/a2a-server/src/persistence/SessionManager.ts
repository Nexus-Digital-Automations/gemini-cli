/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fse from 'fs-extra';
import { promises as fsPromises } from 'node:fs';
import { join } from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { homedir, hostname } from 'node:os';
import { logger } from '../utils/logger.js';

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
export class SessionManager {
  private storageDir: string;
  private currentSession: SessionOwnership;
  private activeSessions: Map<string, SessionOwnership>;
  private taskCorrelations: Map<string, TaskCorrelation>;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(storageDir?: string, ownerId?: string) {
    this.storageDir = storageDir || join(homedir(), '.gemini-cli', 'persistence', 'sessions');
    this.activeSessions = new Map();
    this.taskCorrelations = new Map();

    // Initialize current session
    this.currentSession = {
      sessionId: uuidv4(),
      ownerId: ownerId || process.env.USER || process.env.USERNAME || 'unknown',
      hostname: hostname(),
      processId: process.pid,
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      status: 'active',
      type: 'agent',
      metadata: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    };

    this.initialize();
  }

  /**
   * Initialize session manager and start monitoring
   */
  private async initialize(): Promise<void> {
    try {
      // Ensure storage directories exist
      await fse.ensureDir(this.storageDir);
      await fse.ensureDir(join(this.storageDir, 'active'));
      await fse.ensureDir(join(this.storageDir, 'completed'));
      await fse.ensureDir(join(this.storageDir, 'correlations'));
      await fse.ensureDir(join(this.storageDir, 'handoffs'));

      // Load existing correlations
      await this.loadTaskCorrelations();

      // Register current session
      await this.registerSession(this.currentSession);

      // Load active sessions
      await this.loadActiveSessions();

      // Start health check monitoring
      this.startHealthMonitoring();

      // Clean up stale sessions
      await this.cleanupStaleSessions();

      logger.info(`SessionManager initialized with session ${this.currentSession.sessionId}`);
    } catch (error) {
      logger.error('Failed to initialize SessionManager:', error);
      throw error;
    }
  }

  /**
   * Register a new session
   */
  private async registerSession(session: SessionOwnership): Promise<void> {
    const sessionPath = join(this.storageDir, 'active', `${session.sessionId}.json`);

    await fse.writeJSON(sessionPath, session, { spaces: 2 });
    this.activeSessions.set(session.sessionId, session);

    logger.debug(`Registered session ${session.sessionId}`);
  }

  /**
   * Update session activity timestamp
   */
  async updateSessionActivity(sessionId?: string): Promise<void> {
    const session = sessionId
      ? this.activeSessions.get(sessionId) || this.currentSession
      : this.currentSession;

    session.lastActivityAt = new Date().toISOString();

    const sessionPath = join(this.storageDir, 'active', `${session.sessionId}.json`);
    await fse.writeJSON(sessionPath, session, { spaces: 2 });

    if (session.sessionId === this.currentSession.sessionId) {
      this.currentSession = session;
    } else {
      this.activeSessions.set(session.sessionId, session);
    }
  }

  /**
   * Create task correlation for cross-session tracking
   */
  async createTaskCorrelation(
    taskId: string,
    parentTaskId?: string,
    relatedTaskIds: string[] = []
  ): Promise<TaskCorrelation> {
    const correlation: TaskCorrelation = {
      taskId,
      parentTaskId,
      relatedTaskIds,
      sessionChain: [{
        sessionId: this.currentSession.sessionId,
        ownerId: this.currentSession.ownerId,
        startedAt: new Date().toISOString(),
        action: 'created',
      }],
      currentOwner: { ...this.currentSession },
      dependencies: {
        dependsOn: [],
        blockedBy: [],
        blocking: [],
      },
      continuationData: {
        resumePoint: 'initialization',
        contextSummary: 'Task created and ready for execution',
        nextActions: ['Begin task execution'],
        preservedState: {},
      },
    };

    // Save correlation
    await this.saveTaskCorrelation(correlation);
    this.taskCorrelations.set(taskId, correlation);

    logger.info(`Created task correlation for task ${taskId} in session ${this.currentSession.sessionId}`);
    return correlation;
  }

  /**
   * Update task correlation with new session information
   */
  async updateTaskCorrelation(
    taskId: string,
    updates: Partial<TaskCorrelation>
  ): Promise<TaskCorrelation> {
    const correlation = this.taskCorrelations.get(taskId);
    if (!correlation) {
      throw new Error(`Task correlation not found for task ${taskId}`);
    }

    // Update correlation data
    Object.assign(correlation, updates);

    // Update session activity
    await this.updateSessionActivity();

    // Save updated correlation
    await this.saveTaskCorrelation(correlation);
    this.taskCorrelations.set(taskId, correlation);

    logger.debug(`Updated task correlation for task ${taskId}`);
    return correlation;
  }

  /**
   * Transfer task ownership to another session
   */
  async transferTaskOwnership(
    taskId: string,
    targetSessionId: string,
    reason: string = 'Manual transfer'
  ): Promise<SessionHandoff> {
    const correlation = this.taskCorrelations.get(taskId);
    if (!correlation) {
      throw new Error(`Task correlation not found for task ${taskId}`);
    }

    const targetSession = this.activeSessions.get(targetSessionId);
    if (!targetSession) {
      throw new Error(`Target session ${targetSessionId} not found or inactive`);
    }

    // Create handoff record
    const handoff: SessionHandoff = {
      handoffId: uuidv4(),
      fromSession: {
        sessionId: this.currentSession.sessionId,
        ownerId: this.currentSession.ownerId,
        endedAt: new Date().toISOString(),
        reason,
      },
      toSession: {
        sessionId: targetSessionId,
        ownerId: targetSession.ownerId,
        startedAt: new Date().toISOString(),
        accepted: true, // Auto-accept for now
      },
      taskIds: [taskId],
      metadata: {
        transferReason: reason,
        priority: 'medium',
      },
      status: 'completed',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    // Update task correlation
    correlation.sessionChain.push({
      sessionId: this.currentSession.sessionId,
      ownerId: this.currentSession.ownerId,
      startedAt: correlation.sessionChain[correlation.sessionChain.length - 1].startedAt,
      endedAt: new Date().toISOString(),
      action: 'transferred',
      reason,
    });

    correlation.sessionChain.push({
      sessionId: targetSessionId,
      ownerId: targetSession.ownerId,
      startedAt: new Date().toISOString(),
      action: 'resumed',
      reason: 'Ownership transferred',
    });

    correlation.currentOwner = { ...targetSession };

    // Save handoff record
    await this.saveSessionHandoff(handoff);

    // Update correlation
    await this.saveTaskCorrelation(correlation);
    this.taskCorrelations.set(taskId, correlation);

    logger.info(`Transferred task ${taskId} from session ${this.currentSession.sessionId} to ${targetSessionId}`);
    return handoff;
  }

  /**
   * Resume task from previous session
   */
  async resumeTask(taskId: string, contextSummary?: string): Promise<TaskCorrelation> {
    const correlation = this.taskCorrelations.get(taskId);
    if (!correlation) {
      throw new Error(`Task correlation not found for task ${taskId}`);
    }

    // Add session chain entry
    correlation.sessionChain.push({
      sessionId: this.currentSession.sessionId,
      ownerId: this.currentSession.ownerId,
      startedAt: new Date().toISOString(),
      action: 'resumed',
      reason: 'Task resumed in new session',
    });

    // Update current owner
    correlation.currentOwner = { ...this.currentSession };

    // Update continuation data
    if (contextSummary) {
      correlation.continuationData.contextSummary = contextSummary;
    }
    correlation.continuationData.resumePoint = 'resumed';

    // Save updated correlation
    await this.saveTaskCorrelation(correlation);
    this.taskCorrelations.set(taskId, correlation);

    logger.info(`Resumed task ${taskId} in session ${this.currentSession.sessionId}`);
    return correlation;
  }

  /**
   * Complete task and update correlation
   */
  async completeTask(
    taskId: string,
    completionSummary: string,
    preservedState?: Record<string, unknown>
  ): Promise<TaskCorrelation> {
    const correlation = this.taskCorrelations.get(taskId);
    if (!correlation) {
      throw new Error(`Task correlation not found for task ${taskId}`);
    }

    // Update session chain
    const currentEntry = correlation.sessionChain[correlation.sessionChain.length - 1];
    currentEntry.endedAt = new Date().toISOString();
    currentEntry.action = 'completed';

    // Update continuation data
    correlation.continuationData.contextSummary = completionSummary;
    correlation.continuationData.resumePoint = 'completed';
    if (preservedState) {
      correlation.continuationData.preservedState = preservedState;
    }

    // Save correlation
    await this.saveTaskCorrelation(correlation);

    // Move to completed correlations
    await this.archiveTaskCorrelation(taskId);

    logger.info(`Completed task ${taskId} in session ${this.currentSession.sessionId}`);
    return correlation;
  }

  /**
   * Get task correlation information
   */
  async getTaskCorrelation(taskId: string): Promise<TaskCorrelation | undefined> {
    let correlation = this.taskCorrelations.get(taskId);

    if (!correlation) {
      // Try to load from disk
      correlation = await this.loadTaskCorrelationFromDisk(taskId);
    }

    return correlation;
  }

  /**
   * List all tasks for current session
   */
  async getSessionTasks(sessionId?: string): Promise<TaskCorrelation[]> {
    const targetSessionId = sessionId || this.currentSession.sessionId;
    const tasks: TaskCorrelation[] = [];

    for (const [taskId, correlation] of this.taskCorrelations) {
      if (correlation.currentOwner.sessionId === targetSessionId) {
        tasks.push(correlation);
      }
    }

    return tasks.sort((a, b) =>
      new Date(b.sessionChain[0].startedAt).getTime() - new Date(a.sessionChain[0].startedAt).getTime()
    );
  }

  /**
   * List all active sessions
   */
  async getActiveSessions(): Promise<SessionOwnership[]> {
    await this.loadActiveSessions();
    return Array.from(this.activeSessions.values())
      .filter(session => session.status === 'active')
      .sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime());
  }

  /**
   * Detect and resolve conflicts for concurrent task access
   */
  async resolveTaskConflicts(taskId: string): Promise<{
    hasConflict: boolean;
    conflictingSessions: SessionOwnership[];
    resolution?: 'transfer' | 'duplicate' | 'merge' | 'abort';
    message: string;
  }> {
    const correlation = await this.getTaskCorrelation(taskId);
    if (!correlation) {
      return {
        hasConflict: false,
        conflictingSessions: [],
        message: 'Task not found',
      };
    }

    // Check if multiple sessions are trying to work on the same task
    const conflictingSessions: SessionOwnership[] = [];

    for (const [sessionId, session] of this.activeSessions) {
      if (sessionId !== correlation.currentOwner.sessionId) {
        // Check if this session has any recent activity on this task
        const recentActivity = new Date(session.lastActivityAt).getTime();
        const now = Date.now();
        const fiveMinutesAgo = now - (5 * 60 * 1000);

        if (recentActivity > fiveMinutesAgo) {
          // This session might be working on the same task
          conflictingSessions.push(session);
        }
      }
    }

    if (conflictingSessions.length === 0) {
      return {
        hasConflict: false,
        conflictingSessions: [],
        message: 'No conflicts detected',
      };
    }

    // Determine resolution strategy
    let resolution: 'transfer' | 'duplicate' | 'merge' | 'abort' = 'transfer';
    let message = 'Conflict detected and resolved';

    if (conflictingSessions.length === 1) {
      resolution = 'transfer';
      message = `Task ownership transferred from ${conflictingSessions[0].ownerId}`;

      // Automatically transfer to the most recent session
      await this.transferTaskOwnership(
        taskId,
        this.currentSession.sessionId,
        'Conflict resolution: automatic transfer'
      );
    } else {
      resolution = 'abort';
      message = `Multiple sessions (${conflictingSessions.length}) detected. Manual intervention required.`;
    }

    return {
      hasConflict: true,
      conflictingSessions,
      resolution,
      message,
    };
  }

  /**
   * Save task correlation to disk
   */
  private async saveTaskCorrelation(correlation: TaskCorrelation): Promise<void> {
    const correlationPath = join(this.storageDir, 'correlations', `${correlation.taskId}.json`);
    await fse.writeJSON(correlationPath, correlation, { spaces: 2 });
  }

  /**
   * Load task correlation from disk
   */
  private async loadTaskCorrelationFromDisk(taskId: string): Promise<TaskCorrelation | undefined> {
    const correlationPath = join(this.storageDir, 'correlations', `${taskId}.json`);

    try {
      if (await fse.pathExists(correlationPath)) {
        return await fse.readJSON(correlationPath);
      }
    } catch (error) {
      logger.warn(`Failed to load task correlation for ${taskId}:`, error);
    }

    return undefined;
  }

  /**
   * Load all task correlations from disk
   */
  private async loadTaskCorrelations(): Promise<void> {
    const correlationsDir = join(this.storageDir, 'correlations');

    if (!(await fse.pathExists(correlationsDir))) {
      return;
    }

    const files = await fsPromises.readdir(correlationsDir);

    for (const file of files.filter(f => f.endsWith('.json'))) {
      try {
        const taskId = file.replace('.json', '');
        const correlation = await fse.readJSON(join(correlationsDir, file));
        this.taskCorrelations.set(taskId, correlation);
      } catch (error) {
        logger.warn(`Failed to load correlation from ${file}:`, error);
      }
    }

    logger.debug(`Loaded ${this.taskCorrelations.size} task correlations`);
  }

  /**
   * Load active sessions from disk
   */
  private async loadActiveSessions(): Promise<void> {
    const activeDir = join(this.storageDir, 'active');

    if (!(await fse.pathExists(activeDir))) {
      return;
    }

    const files = await fsPromises.readdir(activeDir);

    for (const file of files.filter(f => f.endsWith('.json'))) {
      try {
        const session = await fse.readJSON(join(activeDir, file));
        if (session.sessionId !== this.currentSession.sessionId) {
          this.activeSessions.set(session.sessionId, session);
        }
      } catch (error) {
        logger.warn(`Failed to load session from ${file}:`, error);
      }
    }

    logger.debug(`Loaded ${this.activeSessions.size} active sessions`);
  }

  /**
   * Save session handoff record
   */
  private async saveSessionHandoff(handoff: SessionHandoff): Promise<void> {
    const handoffPath = join(this.storageDir, 'handoffs', `${handoff.handoffId}.json`);
    await fse.writeJSON(handoffPath, handoff, { spaces: 2 });
  }

  /**
   * Archive completed task correlation
   */
  private async archiveTaskCorrelation(taskId: string): Promise<void> {
    const sourcePath = join(this.storageDir, 'correlations', `${taskId}.json`);
    const archivePath = join(this.storageDir, 'completed', `${taskId}.json`);

    if (await fse.pathExists(sourcePath)) {
      await fse.move(sourcePath, archivePath);
      this.taskCorrelations.delete(taskId);
      logger.debug(`Archived task correlation for ${taskId}`);
    }
  }

  /**
   * Start health monitoring for sessions
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        logger.warn('Health check failed:', error);
      }
    }, 60000); // Check every minute

    logger.debug('Started session health monitoring');
  }

  /**
   * Perform health check on active sessions
   */
  private async performHealthCheck(): Promise<void> {
    const now = Date.now();
    const staleThreshold = 10 * 60 * 1000; // 10 minutes

    for (const [sessionId, session] of this.activeSessions) {
      const lastActivity = new Date(session.lastActivityAt).getTime();

      if (now - lastActivity > staleThreshold) {
        // Mark session as inactive
        session.status = 'inactive';

        const sessionPath = join(this.storageDir, 'active', `${sessionId}.json`);
        await fse.writeJSON(sessionPath, session, { spaces: 2 });

        logger.debug(`Marked session ${sessionId} as inactive due to inactivity`);
      }
    }

    // Update current session activity
    await this.updateSessionActivity();
  }

  /**
   * Clean up stale sessions
   */
  private async cleanupStaleSessions(): Promise<void> {
    const activeDir = join(this.storageDir, 'active');
    const completedDir = join(this.storageDir, 'completed');

    await fse.ensureDir(completedDir);

    if (!(await fse.pathExists(activeDir))) {
      return;
    }

    const files = await fsPromises.readdir(activeDir);
    const now = Date.now();
    const staleThreshold = 24 * 60 * 60 * 1000; // 24 hours

    let cleanedCount = 0;

    for (const file of files.filter(f => f.endsWith('.json'))) {
      try {
        const sessionPath = join(activeDir, file);
        const session = await fse.readJSON(sessionPath);

        const lastActivity = new Date(session.lastActivityAt).getTime();

        if (now - lastActivity > staleThreshold && session.sessionId !== this.currentSession.sessionId) {
          // Move to completed directory
          session.status = 'completed';
          const completedPath = join(completedDir, file);
          await fse.writeJSON(completedPath, session, { spaces: 2 });
          await fse.remove(sessionPath);

          this.activeSessions.delete(session.sessionId);
          cleanedCount++;

          logger.debug(`Cleaned up stale session ${session.sessionId}`);
        }
      } catch (error) {
        logger.warn(`Failed to process session file ${file} during cleanup:`, error);
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} stale sessions`);
    }
  }

  /**
   * Shutdown session manager
   */
  async shutdown(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Mark current session as completed
    this.currentSession.status = 'completed';
    this.currentSession.lastActivityAt = new Date().toISOString();

    const sessionPath = join(this.storageDir, 'active', `${this.currentSession.sessionId}.json`);
    const completedPath = join(this.storageDir, 'completed', `${this.currentSession.sessionId}.json`);

    await fse.writeJSON(completedPath, this.currentSession, { spaces: 2 });

    if (await fse.pathExists(sessionPath)) {
      await fse.remove(sessionPath);
    }

    logger.info(`Session ${this.currentSession.sessionId} shut down gracefully`);
  }

  /**
   * Get current session information
   */
  getCurrentSession(): SessionOwnership {
    return { ...this.currentSession };
  }

  /**
   * Get session statistics
   */
  async getSessionStatistics(): Promise<{
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
    averageSessionDuration: number;
  }> {
    await this.loadActiveSessions();

    const completedDir = join(this.storageDir, 'completed');
    const correlationsDir = join(this.storageDir, 'correlations');

    const completedSessionsCount = await fse.pathExists(completedDir)
      ? (await fsPromises.readdir(completedDir)).filter(f => f.endsWith('.json')).length
      : 0;

    const totalTasksCount = await fse.pathExists(correlationsDir)
      ? (await fsPromises.readdir(correlationsDir)).filter(f => f.endsWith('.json')).length
      : 0;

    const completedTasksCount = await fse.pathExists(join(this.storageDir, 'completed'))
      ? (await fsPromises.readdir(join(this.storageDir, 'completed'))).filter(f => f.endsWith('.json')).length
      : 0;

    return {
      totalSessions: this.activeSessions.size + completedSessionsCount + 1, // +1 for current session
      activeSessions: this.activeSessions.size + 1, // +1 for current session
      completedSessions: completedSessionsCount,
      totalTasks: totalTasksCount + completedTasksCount,
      activeTasks: totalTasksCount,
      completedTasks: completedTasksCount,
      averageSessionDuration: 0, // TODO: Calculate from completed sessions
    };
  }
}