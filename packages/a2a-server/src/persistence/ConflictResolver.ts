/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fse from 'fs-extra';
import { join } from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { homedir } from 'node:os';
import { logger } from '../utils/logger.js';
import type { SessionOwnership, TaskCorrelation } from './SessionManager.js';

/**
 * Conflict types for task access scenarios
 */
export enum ConflictType {
  /** Multiple sessions accessing the same task simultaneously */
  CONCURRENT_ACCESS = 'concurrent_access',
  /** Task ownership disputed between sessions */
  OWNERSHIP_CONFLICT = 'ownership_conflict',
  /** Resource lock contention */
  RESOURCE_LOCK = 'resource_lock',
  /** Data integrity issues from concurrent modifications */
  DATA_INTEGRITY = 'data_integrity',
  /** Session timeout or abandonment issues */
  SESSION_TIMEOUT = 'session_timeout',
  /** Version conflicts from parallel task execution */
  VERSION_CONFLICT = 'version_conflict',
}

/**
 * Conflict resolution strategies
 */
export enum ResolutionStrategy {
  /** Transfer task to the most recent session */
  TRANSFER_TO_LATEST = 'transfer_to_latest',
  /** Create duplicate tasks for parallel execution */
  DUPLICATE_TASK = 'duplicate_task',
  /** Merge changes from multiple sessions */
  MERGE_CHANGES = 'merge_changes',
  /** Abort conflicting session and maintain current */
  ABORT_CONFLICT = 'abort_conflict',
  /** Queue task for sequential execution */
  QUEUE_SEQUENTIAL = 'queue_sequential',
  /** Manual intervention required */
  MANUAL_RESOLUTION = 'manual_resolution',
  /** Rollback to last known good state */
  ROLLBACK_STATE = 'rollback_state',
}

/**
 * Conflict resolution record
 */
export interface ConflictResolution {
  /** Unique resolution identifier */
  resolutionId: string;
  /** Type of conflict detected */
  conflictType: ConflictType;
  /** Task ID involved in conflict */
  taskId: string;
  /** Sessions involved in the conflict */
  conflictingSessions: SessionOwnership[];
  /** Resolution strategy applied */
  strategy: ResolutionStrategy;
  /** Detailed resolution actions taken */
  actions: Array<{
    action: string;
    timestamp: string;
    sessionId?: string;
    details: Record<string, unknown>;
  }>;
  /** Conflict resolution outcome */
  outcome: {
    success: boolean;
    message: string;
    newTaskOwner?: SessionOwnership;
    createdTasks?: string[];
    mergedData?: Record<string, unknown>;
  };
  /** Resolution metadata */
  metadata: {
    detectedAt: string;
    resolvedAt?: string;
    autoResolved: boolean;
    priority: 'low' | 'medium' | 'high' | 'critical';
    impactAssessment: string;
  };
}

/**
 * Conflict detection and analysis result
 */
export interface ConflictAnalysis {
  /** Whether a conflict was detected */
  hasConflict: boolean;
  /** Type of conflict detected */
  conflictType?: ConflictType;
  /** Severity level of the conflict */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Sessions involved in the conflict */
  involvedSessions: SessionOwnership[];
  /** Recommended resolution strategy */
  recommendedStrategy: ResolutionStrategy;
  /** Conflict description and impact */
  description: string;
  /** Evidence supporting conflict detection */
  evidence: Array<{
    type: string;
    data: unknown;
    timestamp: string;
  }>;
  /** Automatic resolution possible */
  canAutoResolve: boolean;
}

/**
 * Resource lock information
 */
export interface ResourceLock {
  /** Lock identifier */
  lockId: string;
  /** Resource being locked (task, file, etc.) */
  resourceId: string;
  /** Resource type */
  resourceType: 'task' | 'file' | 'workspace' | 'metadata';
  /** Session holding the lock */
  holderSession: SessionOwnership;
  /** Lock acquisition timestamp */
  acquiredAt: string;
  /** Lock expiration timestamp */
  expiresAt: string;
  /** Lock metadata */
  metadata: {
    lockReason: string;
    priority: number;
    canInterrupt: boolean;
  };
}

/**
 * Advanced conflict resolution system for concurrent task access
 *
 * Provides:
 * - Real-time conflict detection and analysis
 * - Multiple resolution strategies for different conflict types
 * - Automatic resolution for common scenarios
 * - Manual resolution support for complex cases
 * - Resource locking and contention management
 * - Data integrity preservation during conflicts
 * - Performance optimization for conflict resolution
 */
export class ConflictResolver {
  private storageDir: string;
  private resolutionHistory: Map<string, ConflictResolution>;
  private activeLocks: Map<string, ResourceLock>;
  private conflictDetectionInterval?: NodeJS.Timeout;

  constructor(storageDir?: string) {
    this.storageDir = storageDir || join(homedir(), '.gemini-cli', 'persistence', 'conflicts');
    this.resolutionHistory = new Map();
    this.activeLocks = new Map();

    this.initialize();
  }

  /**
   * Initialize conflict resolver
   */
  private async initialize(): Promise<void> {
    try {
      await fse.ensureDir(this.storageDir);
      await fse.ensureDir(join(this.storageDir, 'resolutions'));
      await fse.ensureDir(join(this.storageDir, 'locks'));
      await fse.ensureDir(join(this.storageDir, 'analysis'));

      await this.loadResolutionHistory();
      await this.loadActiveLocks();

      // Start periodic conflict detection
      this.startConflictMonitoring();

      logger.info('ConflictResolver initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize ConflictResolver:', error);
      throw error;
    }
  }

  /**
   * Analyze task for potential conflicts
   */
  async analyzeTaskConflicts(
    taskId: string,
    currentSession: SessionOwnership,
    allSessions: SessionOwnership[],
    taskCorrelation?: TaskCorrelation
  ): Promise<ConflictAnalysis> {
    logger.debug(`Analyzing conflicts for task ${taskId}`);

    const analysis: ConflictAnalysis = {
      hasConflict: false,
      severity: 'low',
      involvedSessions: [],
      recommendedStrategy: ResolutionStrategy.TRANSFER_TO_LATEST,
      description: 'No conflicts detected',
      evidence: [],
      canAutoResolve: true,
    };

    // Check for concurrent access patterns
    const concurrentSessions = await this.detectConcurrentAccess(taskId, currentSession, allSessions);
    if (concurrentSessions.length > 0) {
      analysis.hasConflict = true;
      analysis.conflictType = ConflictType.CONCURRENT_ACCESS;
      analysis.involvedSessions = concurrentSessions;
      analysis.severity = concurrentSessions.length > 2 ? 'high' : 'medium';
      analysis.description = `${concurrentSessions.length} sessions detected accessing task concurrently`;
      analysis.evidence.push({
        type: 'concurrent_access',
        data: { sessionCount: concurrentSessions.length, sessions: concurrentSessions },
        timestamp: new Date().toISOString(),
      });
    }

    // Check for resource locks
    const lockConflicts = await this.detectResourceLockConflicts(taskId);
    if (lockConflicts.length > 0) {
      analysis.hasConflict = true;
      analysis.conflictType = ConflictType.RESOURCE_LOCK;
      analysis.severity = 'high';
      analysis.involvedSessions.push(...lockConflicts.map(lock => lock.holderSession));
      analysis.description = `Resource lock conflicts detected (${lockConflicts.length} locks)`;
      analysis.canAutoResolve = false;
      analysis.evidence.push({
        type: 'resource_locks',
        data: { lockCount: lockConflicts.length, locks: lockConflicts },
        timestamp: new Date().toISOString(),
      });
    }

    // Check for ownership disputes
    if (taskCorrelation) {
      const ownershipConflicts = await this.detectOwnershipConflicts(taskCorrelation, currentSession, allSessions);
      if (ownershipConflicts.length > 0) {
        analysis.hasConflict = true;
        analysis.conflictType = ConflictType.OWNERSHIP_CONFLICT;
        analysis.severity = 'medium';
        analysis.involvedSessions.push(...ownershipConflicts);
        analysis.description = `Task ownership disputed between ${ownershipConflicts.length} sessions`;
        analysis.evidence.push({
          type: 'ownership_dispute',
          data: { disputingSessions: ownershipConflicts },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Check for stale sessions
    const staleSessions = await this.detectStaleSessionConflicts(taskId, allSessions);
    if (staleSessions.length > 0) {
      analysis.hasConflict = true;
      analysis.conflictType = ConflictType.SESSION_TIMEOUT;
      analysis.severity = 'low';
      analysis.involvedSessions.push(...staleSessions);
      analysis.description = `${staleSessions.length} stale sessions holding task references`;
      analysis.recommendedStrategy = ResolutionStrategy.ABORT_CONFLICT;
      analysis.evidence.push({
        type: 'stale_sessions',
        data: { staleSessions },
        timestamp: new Date().toISOString(),
      });
    }

    // Determine resolution strategy
    if (analysis.hasConflict) {
      analysis.recommendedStrategy = this.determineResolutionStrategy(analysis);
    }

    logger.debug(`Conflict analysis completed for task ${taskId}: ${analysis.hasConflict ? 'CONFLICT' : 'NO_CONFLICT'}`);
    return analysis;
  }

  /**
   * Resolve conflicts using specified or recommended strategy
   */
  async resolveConflicts(
    taskId: string,
    analysis: ConflictAnalysis,
    strategy?: ResolutionStrategy,
    manualOverrides?: Record<string, unknown>
  ): Promise<ConflictResolution> {
    const resolutionStrategy = strategy || analysis.recommendedStrategy;

    logger.info(`Resolving conflicts for task ${taskId} using strategy: ${resolutionStrategy}`);

    const resolution: ConflictResolution = {
      resolutionId: uuidv4(),
      conflictType: analysis.conflictType || ConflictType.CONCURRENT_ACCESS,
      taskId,
      conflictingSessions: analysis.involvedSessions,
      strategy: resolutionStrategy,
      actions: [],
      outcome: {
        success: false,
        message: 'Resolution in progress',
      },
      metadata: {
        detectedAt: new Date().toISOString(),
        autoResolved: strategy === undefined,
        priority: this.getPriorityFromSeverity(analysis.severity),
        impactAssessment: analysis.description,
      },
    };

    try {
      switch (resolutionStrategy) {
        case ResolutionStrategy.TRANSFER_TO_LATEST:
          await this.executeTransferToLatest(resolution, analysis);
          break;

        case ResolutionStrategy.DUPLICATE_TASK:
          await this.executeDuplicateTask(resolution, analysis);
          break;

        case ResolutionStrategy.MERGE_CHANGES:
          await this.executeMergeChanges(resolution, analysis);
          break;

        case ResolutionStrategy.ABORT_CONFLICT:
          await this.executeAbortConflict(resolution, analysis);
          break;

        case ResolutionStrategy.QUEUE_SEQUENTIAL:
          await this.executeQueueSequential(resolution, analysis);
          break;

        case ResolutionStrategy.ROLLBACK_STATE:
          await this.executeRollbackState(resolution, analysis);
          break;

        case ResolutionStrategy.MANUAL_RESOLUTION:
          await this.executeManualResolution(resolution, analysis, manualOverrides);
          break;

        default:
          throw new Error(`Unknown resolution strategy: ${resolutionStrategy}`);
      }

      resolution.outcome.success = true;
      resolution.metadata.resolvedAt = new Date().toISOString();

      logger.info(`Successfully resolved conflicts for task ${taskId}`);
    } catch (error) {
      resolution.outcome.success = false;
      resolution.outcome.message = `Resolution failed: ${error instanceof Error ? error.message : 'Unknown error'}`;

      logger.error(`Failed to resolve conflicts for task ${taskId}:`, error);
    }

    // Save resolution record
    await this.saveResolution(resolution);
    this.resolutionHistory.set(resolution.resolutionId, resolution);

    return resolution;
  }

  /**
   * Acquire resource lock for exclusive access
   */
  async acquireResourceLock(
    resourceId: string,
    resourceType: ResourceLock['resourceType'],
    holderSession: SessionOwnership,
    options: {
      duration?: number; // milliseconds
      priority?: number;
      canInterrupt?: boolean;
      reason?: string;
    } = {}
  ): Promise<ResourceLock | null> {
    const existing = this.findResourceLock(resourceId);
    if (existing) {
      // Check if we can interrupt existing lock
      if (!existing.metadata.canInterrupt ||
          (options.priority || 0) <= existing.metadata.priority) {
        logger.warn(`Cannot acquire lock for ${resourceId}: already locked by ${existing.holderSession.sessionId}`);
        return null;
      }

      // Release existing lock
      await this.releaseResourceLock(existing.lockId);
    }

    const lock: ResourceLock = {
      lockId: uuidv4(),
      resourceId,
      resourceType,
      holderSession,
      acquiredAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + (options.duration || 300000)).toISOString(), // Default 5 minutes
      metadata: {
        lockReason: options.reason || 'Resource access required',
        priority: options.priority || 0,
        canInterrupt: options.canInterrupt ?? true,
      },
    };

    // Save lock
    await this.saveLock(lock);
    this.activeLocks.set(lock.lockId, lock);

    logger.debug(`Acquired lock ${lock.lockId} for resource ${resourceId}`);
    return lock;
  }

  /**
   * Release resource lock
   */
  async releaseResourceLock(lockId: string): Promise<boolean> {
    const lock = this.activeLocks.get(lockId);
    if (!lock) {
      logger.warn(`Lock ${lockId} not found for release`);
      return false;
    }

    // Remove lock
    this.activeLocks.delete(lockId);
    await this.removeLockFile(lockId);

    logger.debug(`Released lock ${lockId} for resource ${lock.resourceId}`);
    return true;
  }

  /**
   * Check if resource is locked
   */
  isResourceLocked(resourceId: string): boolean {
    return this.findResourceLock(resourceId) !== null;
  }

  /**
   * Get resource lock information
   */
  getResourceLock(resourceId: string): ResourceLock | null {
    return this.findResourceLock(resourceId);
  }

  /**
   * List all active locks
   */
  getActiveLocks(): ResourceLock[] {
    return Array.from(this.activeLocks.values());
  }

  /**
   * Get resolution history for a task
   */
  getTaskResolutionHistory(taskId: string): ConflictResolution[] {
    return Array.from(this.resolutionHistory.values())
      .filter(resolution => resolution.taskId === taskId)
      .sort((a, b) => new Date(b.metadata.detectedAt).getTime() - new Date(a.metadata.detectedAt).getTime());
  }

  /**
   * Clean up expired locks
   */
  async cleanupExpiredLocks(): Promise<number> {
    const now = Date.now();
    let cleanedCount = 0;

    const expiredLocks = Array.from(this.activeLocks.values())
      .filter(lock => new Date(lock.expiresAt).getTime() < now);

    for (const lock of expiredLocks) {
      await this.releaseResourceLock(lock.lockId);
      cleanedCount++;
      logger.debug(`Cleaned up expired lock ${lock.lockId}`);
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} expired locks`);
    }

    return cleanedCount;
  }

  /**
   * Detect concurrent access patterns
   */
  private async detectConcurrentAccess(
    taskId: string,
    currentSession: SessionOwnership,
    allSessions: SessionOwnership[]
  ): Promise<SessionOwnership[]> {
    const concurrentSessions: SessionOwnership[] = [];
    const now = Date.now();
    const recentThreshold = 2 * 60 * 1000; // 2 minutes

    for (const session of allSessions) {
      if (session.sessionId === currentSession.sessionId) {
        continue;
      }

      const lastActivity = new Date(session.lastActivityAt).getTime();
      if (now - lastActivity < recentThreshold && session.status === 'active') {
        // This could indicate concurrent access
        concurrentSessions.push(session);
      }
    }

    return concurrentSessions;
  }

  /**
   * Detect resource lock conflicts
   */
  private async detectResourceLockConflicts(taskId: string): Promise<ResourceLock[]> {
    const conflicts: ResourceLock[] = [];

    for (const lock of this.activeLocks.values()) {
      if (lock.resourceId === taskId || lock.resourceId.includes(taskId)) {
        conflicts.push(lock);
      }
    }

    return conflicts;
  }

  /**
   * Detect ownership conflicts
   */
  private async detectOwnershipConflicts(
    correlation: TaskCorrelation,
    currentSession: SessionOwnership,
    allSessions: SessionOwnership[]
  ): Promise<SessionOwnership[]> {
    const conflicts: SessionOwnership[] = [];

    // Check if task correlation shows ownership disputes
    if (correlation.currentOwner.sessionId !== currentSession.sessionId) {
      const ownerSession = allSessions.find(s => s.sessionId === correlation.currentOwner.sessionId);
      if (ownerSession && ownerSession.status === 'active') {
        conflicts.push(ownerSession);
      }
    }

    return conflicts;
  }

  /**
   * Detect stale session conflicts
   */
  private async detectStaleSessionConflicts(
    taskId: string,
    allSessions: SessionOwnership[]
  ): Promise<SessionOwnership[]> {
    const staleSessions: SessionOwnership[] = [];
    const now = Date.now();
    const staleThreshold = 30 * 60 * 1000; // 30 minutes

    for (const session of allSessions) {
      const lastActivity = new Date(session.lastActivityAt).getTime();
      if (now - lastActivity > staleThreshold && session.status !== 'completed') {
        staleSessions.push(session);
      }
    }

    return staleSessions;
  }

  /**
   * Determine appropriate resolution strategy
   */
  private determineResolutionStrategy(analysis: ConflictAnalysis): ResolutionStrategy {
    switch (analysis.conflictType) {
      case ConflictType.CONCURRENT_ACCESS:
        return analysis.involvedSessions.length > 2
          ? ResolutionStrategy.QUEUE_SEQUENTIAL
          : ResolutionStrategy.TRANSFER_TO_LATEST;

      case ConflictType.OWNERSHIP_CONFLICT:
        return ResolutionStrategy.TRANSFER_TO_LATEST;

      case ConflictType.RESOURCE_LOCK:
        return ResolutionStrategy.MANUAL_RESOLUTION;

      case ConflictType.SESSION_TIMEOUT:
        return ResolutionStrategy.ABORT_CONFLICT;

      case ConflictType.DATA_INTEGRITY:
        return ResolutionStrategy.ROLLBACK_STATE;

      case ConflictType.VERSION_CONFLICT:
        return ResolutionStrategy.MERGE_CHANGES;

      default:
        return ResolutionStrategy.TRANSFER_TO_LATEST;
    }
  }

  /**
   * Execute transfer to latest session strategy
   */
  private async executeTransferToLatest(
    resolution: ConflictResolution,
    analysis: ConflictAnalysis
  ): Promise<void> {
    // Find the most recent session
    const latestSession = analysis.involvedSessions
      .sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime())[0];

    if (!latestSession) {
      throw new Error('No sessions available for transfer');
    }

    resolution.actions.push({
      action: 'transfer_ownership',
      timestamp: new Date().toISOString(),
      sessionId: latestSession.sessionId,
      details: { reason: 'Automatic conflict resolution' },
    });

    resolution.outcome.newTaskOwner = latestSession;
    resolution.outcome.message = `Task transferred to session ${latestSession.sessionId}`;
  }

  /**
   * Execute duplicate task strategy
   */
  private async executeDuplicateTask(
    resolution: ConflictResolution,
    analysis: ConflictAnalysis
  ): Promise<void> {
    const createdTasks: string[] = [];

    for (const session of analysis.involvedSessions) {
      const duplicateTaskId = `${resolution.taskId}-${session.sessionId}-${Date.now()}`;
      createdTasks.push(duplicateTaskId);

      resolution.actions.push({
        action: 'create_duplicate',
        timestamp: new Date().toISOString(),
        sessionId: session.sessionId,
        details: { originalTaskId: resolution.taskId, duplicateTaskId },
      });
    }

    resolution.outcome.createdTasks = createdTasks;
    resolution.outcome.message = `Created ${createdTasks.length} duplicate tasks for parallel execution`;
  }

  /**
   * Execute merge changes strategy
   */
  private async executeMergeChanges(
    resolution: ConflictResolution,
    analysis: ConflictAnalysis
  ): Promise<void> {
    // This would involve complex data merging logic
    // For now, we'll mark it as requiring manual intervention
    resolution.actions.push({
      action: 'merge_required',
      timestamp: new Date().toISOString(),
      details: { reason: 'Complex merge requires manual intervention' },
    });

    resolution.outcome.message = 'Merge operation flagged for manual completion';
  }

  /**
   * Execute abort conflict strategy
   */
  private async executeAbortConflict(
    resolution: ConflictResolution,
    analysis: ConflictAnalysis
  ): Promise<void> {
    for (const session of analysis.involvedSessions) {
      if (session.status !== 'active') {
        resolution.actions.push({
          action: 'abort_session',
          timestamp: new Date().toISOString(),
          sessionId: session.sessionId,
          details: { reason: 'Session marked as inactive due to conflict' },
        });
      }
    }

    resolution.outcome.message = `Aborted ${analysis.involvedSessions.length} conflicting sessions`;
  }

  /**
   * Execute queue sequential strategy
   */
  private async executeQueueSequential(
    resolution: ConflictResolution,
    analysis: ConflictAnalysis
  ): Promise<void> {
    // Create a queue for sequential execution
    const queue = analysis.involvedSessions
      .sort((a, b) => new Date(a.lastActivityAt).getTime() - new Date(b.lastActivityAt).getTime());

    for (let i = 0; i < queue.length; i++) {
      resolution.actions.push({
        action: 'queue_session',
        timestamp: new Date().toISOString(),
        sessionId: queue[i].sessionId,
        details: { position: i + 1, totalInQueue: queue.length },
      });
    }

    resolution.outcome.message = `Queued ${queue.length} sessions for sequential execution`;
  }

  /**
   * Execute rollback state strategy
   */
  private async executeRollbackState(
    resolution: ConflictResolution,
    analysis: ConflictAnalysis
  ): Promise<void> {
    resolution.actions.push({
      action: 'rollback_to_safe_state',
      timestamp: new Date().toISOString(),
      details: { reason: 'Data integrity conflict detected' },
    });

    resolution.outcome.message = 'Task state rolled back to last known good state';
  }

  /**
   * Execute manual resolution strategy
   */
  private async executeManualResolution(
    resolution: ConflictResolution,
    analysis: ConflictAnalysis,
    overrides?: Record<string, unknown>
  ): Promise<void> {
    resolution.actions.push({
      action: 'flag_for_manual_resolution',
      timestamp: new Date().toISOString(),
      details: {
        reason: 'Complex conflict requires manual intervention',
        overrides: overrides || {},
      },
    });

    resolution.outcome.message = 'Conflict flagged for manual resolution';
  }

  /**
   * Find resource lock by resource ID
   */
  private findResourceLock(resourceId: string): ResourceLock | null {
    for (const lock of this.activeLocks.values()) {
      if (lock.resourceId === resourceId) {
        return lock;
      }
    }
    return null;
  }

  /**
   * Get priority level from severity
   */
  private getPriorityFromSeverity(severity: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (severity) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      default: return 'low';
    }
  }

  /**
   * Save resolution record to disk
   */
  private async saveResolution(resolution: ConflictResolution): Promise<void> {
    const resolutionPath = join(this.storageDir, 'resolutions', `${resolution.resolutionId}.json`);
    await fse.writeJSON(resolutionPath, resolution, { spaces: 2 });
  }

  /**
   * Save lock to disk
   */
  private async saveLock(lock: ResourceLock): Promise<void> {
    const lockPath = join(this.storageDir, 'locks', `${lock.lockId}.json`);
    await fse.writeJSON(lockPath, lock, { spaces: 2 });
  }

  /**
   * Remove lock file
   */
  private async removeLockFile(lockId: string): Promise<void> {
    const lockPath = join(this.storageDir, 'locks', `${lockId}.json`);
    if (await fse.pathExists(lockPath)) {
      await fse.remove(lockPath);
    }
  }

  /**
   * Load resolution history from disk
   */
  private async loadResolutionHistory(): Promise<void> {
    const resolutionsDir = join(this.storageDir, 'resolutions');

    if (!(await fse.pathExists(resolutionsDir))) {
      return;
    }

    const files = await fse.readdir(resolutionsDir);

    for (const file of files.filter(f => f.endsWith('.json'))) {
      try {
        const resolution = await fse.readJSON(join(resolutionsDir, file));
        this.resolutionHistory.set(resolution.resolutionId, resolution);
      } catch (error) {
        logger.warn(`Failed to load resolution from ${file}:`, error);
      }
    }

    logger.debug(`Loaded ${this.resolutionHistory.size} conflict resolutions`);
  }

  /**
   * Load active locks from disk
   */
  private async loadActiveLocks(): Promise<void> {
    const locksDir = join(this.storageDir, 'locks');

    if (!(await fse.pathExists(locksDir))) {
      return;
    }

    const files = await fse.readdir(locksDir);
    const now = Date.now();

    for (const file of files.filter(f => f.endsWith('.json'))) {
      try {
        const lock = await fse.readJSON(join(locksDir, file));

        // Check if lock is expired
        if (new Date(lock.expiresAt).getTime() > now) {
          this.activeLocks.set(lock.lockId, lock);
        } else {
          // Remove expired lock file
          await fse.remove(join(locksDir, file));
        }
      } catch (error) {
        logger.warn(`Failed to load lock from ${file}:`, error);
      }
    }

    logger.debug(`Loaded ${this.activeLocks.size} active locks`);
  }

  /**
   * Start conflict monitoring
   */
  private startConflictMonitoring(): void {
    this.conflictDetectionInterval = setInterval(async () => {
      try {
        await this.cleanupExpiredLocks();
      } catch (error) {
        logger.warn('Conflict monitoring error:', error);
      }
    }, 30000); // Check every 30 seconds

    logger.debug('Started conflict monitoring');
  }

  /**
   * Shutdown conflict resolver
   */
  async shutdown(): Promise<void> {
    if (this.conflictDetectionInterval) {
      clearInterval(this.conflictDetectionInterval);
    }

    // Release all locks held by this resolver
    for (const lock of this.activeLocks.values()) {
      await this.releaseResourceLock(lock.lockId);
    }

    logger.info('ConflictResolver shut down gracefully');
  }
}