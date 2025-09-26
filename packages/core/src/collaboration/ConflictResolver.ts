/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Pair-Programming Mode - Conflict Resolution System
 * Advanced conflict detection and resolution for collaborative sessions
 *
 * @author Claude Code - Pair-Programming Implementation Agent
 * @version 1.0.0
 */

import { EventEmitter } from 'node:events';
import type {
  CollaborationConflict,
  ConflictType,
  ConflictStatus,
  ConflictResolutionStrategy,
  ConflictResolution,
  ConflictingChange,
  ContextConflict,
  SessionParticipant,
  ParticipantRole,
} from './types.js';
import type { ContextItem } from '../context/types.js';

/**
 * Conflict resolver for collaborative programming sessions
 */
export class ConflictResolver extends EventEmitter {
  private activeConflicts = new Map<string, CollaborationConflict>();
  private resolutionStrategies = new Map<ConflictResolutionStrategy, ConflictResolutionHandler>();

  constructor() {
    super();
    this.initializeResolutionStrategies();
  }

  /**
   * Detect conflicts in collaborative changes
   */
  async detectConflicts(
    sessionId: string,
    changes: ConflictingChange[],
    participants: SessionParticipant[]
  ): Promise<CollaborationConflict[]> {
    const conflicts: CollaborationConflict[] = [];

    // Group changes by location/resource for conflict detection
    const changeGroups = this.groupChangesByLocation(changes);

    for (const [location, locationChanges] of changeGroups) {
      if (locationChanges.length > 1) {
        // Multiple changes to same location - potential conflict
        const conflict = await this.analyzeLocationConflict(sessionId, location, locationChanges, participants);
        if (conflict) {
          conflicts.push(conflict);
          this.activeConflicts.set(conflict.id, conflict);
          this.emit('conflictDetected', { ...conflict, sessionId });
        }
      }
    }

    return conflicts;
  }

  /**
   * Resolve a conflict using specified strategy
   */
  async resolveConflict(
    conflictId: string,
    strategy: ConflictResolutionStrategy,
    resolvingParticipant?: string,
    resolutionData?: unknown
  ): Promise<ConflictResolution> {
    const conflict = this.activeConflicts.get(conflictId);
    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found`);
    }

    if (conflict.status !== ConflictStatus.PENDING) {
      throw new Error(`Conflict ${conflictId} is not in pending status`);
    }

    // Update conflict status to resolving
    conflict.status = ConflictStatus.RESOLVING;

    try {
      const handler = this.resolutionStrategies.get(strategy);
      if (!handler) {
        throw new Error(`No resolution strategy handler for ${strategy}`);
      }

      const resolvedContent = await handler(conflict, resolvingParticipant, resolutionData);

      const resolution: ConflictResolution = {
        strategy,
        resolvedBy: resolvingParticipant,
        resolvedAt: new Date(),
        resolvedContent,
        notes: `Resolved using ${strategy} strategy`,
      };

      conflict.resolution = resolution;
      conflict.status = ConflictStatus.RESOLVED;

      this.activeConflicts.delete(conflictId);
      this.emit('conflictResolved', { ...conflict, sessionId: conflict.id.split('_')[1] });

      return resolution;
    } catch (error) {
      conflict.status = ConflictStatus.FAILED;
      throw new Error(`Failed to resolve conflict ${conflictId}: ${error.message}`);
    }
  }

  /**
   * Get active conflicts for a session
   */
  getActiveConflicts(sessionId: string): CollaborationConflict[] {
    return Array.from(this.activeConflicts.values())
      .filter(conflict => conflict.id.includes(sessionId));
  }

  /**
   * Auto-resolve conflicts based on session configuration
   */
  async autoResolveConflicts(
    sessionId: string,
    strategy: ConflictResolutionStrategy,
    participants: SessionParticipant[]
  ): Promise<ConflictResolution[]> {
    const sessionConflicts = this.getActiveConflicts(sessionId);
    const resolutions: ConflictResolution[] = [];

    for (const conflict of sessionConflicts) {
      if (conflict.status === ConflictStatus.PENDING) {
        try {
          const resolution = await this.resolveConflict(
            conflict.id,
            strategy,
            this.selectAutoResolver(participants, strategy),
            { autoResolved: true }
          );
          resolutions.push(resolution);
        } catch (error) {
          console.error(`Auto-resolution failed for conflict ${conflict.id}:`, error);
        }
      }
    }

    return resolutions;
  }

  /**
   * Check if changes conflict with existing context
   */
  async checkContextConflict(
    contextId: string,
    newContent: ContextItem,
    existingVersions: Array<{ participantId: string; content: ContextItem; timestamp: Date }>
  ): Promise<ContextConflict | null> {
    // Check for simultaneous modifications
    const recentVersions = existingVersions.filter(
      version => (new Date().getTime() - version.timestamp.getTime()) < 30000 // 30 seconds
    );

    if (recentVersions.length > 1) {
      const conflictId = `context_conflict_${contextId}_${Date.now()}`;

      return {
        id: conflictId,
        contextId,
        versions: [...recentVersions, {
          participantId: 'new',
          content: newContent,
          timestamp: new Date(),
        }],
        status: ConflictStatus.PENDING,
      };
    }

    return null;
  }

  /**
   * Analyze location-based conflict
   */
  private async analyzeLocationConflict(
    sessionId: string,
    location: string,
    changes: ConflictingChange[],
    participants: SessionParticipant[]
  ): Promise<CollaborationConflict | null> {
    // Sort changes by timestamp to analyze sequence
    const sortedChanges = changes.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Check if changes are within conflict time window (e.g., 10 seconds)
    const timeWindow = 10000; // 10 seconds
    const firstChange = sortedChanges[0];
    const conflictingChanges = sortedChanges.filter(
      change => (change.timestamp.getTime() - firstChange.timestamp.getTime()) <= timeWindow
    );

    if (conflictingChanges.length < 2) {
      return null; // No real conflict
    }

    // Determine conflict type based on location and content
    let conflictType: ConflictType = ConflictType.CODE_EDIT_CONFLICT;

    if (location.startsWith('context:')) {
      conflictType = ConflictType.CONTEXT_CONFLICT;
    } else if (location.startsWith('role:')) {
      conflictType = ConflictType.ROLE_CONFLICT;
    } else if (location.startsWith('workspace:')) {
      conflictType = ConflictType.WORKSPACE_CONFLICT;
    }

    const conflictId = `${conflictType}_${sessionId}_${Date.now()}`;

    return {
      id: conflictId,
      type: conflictType,
      participants: conflictingChanges.map(change => change.participantId),
      changes: conflictingChanges,
      detectedAt: new Date(),
      status: ConflictStatus.PENDING,
    };
  }

  /**
   * Group changes by their location for conflict analysis
   */
  private groupChangesByLocation(changes: ConflictingChange[]): Map<string, ConflictingChange[]> {
    const groups = new Map<string, ConflictingChange[]>();

    for (const change of changes) {
      // Extract location from change content or description
      const location = this.extractLocation(change);

      if (!groups.has(location)) {
        groups.set(location, []);
      }
      groups.get(location)!.push(change);
    }

    return groups;
  }

  /**
   * Extract location identifier from change
   */
  private extractLocation(change: ConflictingChange): string {
    // This would be more sophisticated in a real implementation
    // For now, use description as a simple location indicator
    if (typeof change.content === 'object' && change.content !== null && 'location' in change.content) {
      return (change.content as { location: string }).location;
    }

    // Fallback to description-based location
    if (change.description.includes('file:')) {
      return change.description.split('file:')[1].split(' ')[0];
    }

    if (change.description.includes('context:')) {
      return `context:${change.description.split('context:')[1].split(' ')[0]}`;
    }

    return 'unknown';
  }

  /**
   * Initialize conflict resolution strategies
   */
  private initializeResolutionStrategies(): void {
    // Last Write Wins strategy
    this.resolutionStrategies.set(ConflictResolutionStrategy.LAST_WRITE_WINS, async (conflict) => {
      const latestChange = conflict.changes.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      )[0];
      return latestChange.content;
    });

    // Most Active Participant Wins strategy
    this.resolutionStrategies.set(ConflictResolutionStrategy.MOST_ACTIVE_WINS, async (conflict) => {
      // Would need activity tracking to implement properly
      // For now, fall back to last write wins
      const latestChange = conflict.changes.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      )[0];
      return latestChange.content;
    });

    // Role Priority strategy
    this.resolutionStrategies.set(ConflictResolutionStrategy.ROLE_PRIORITY, async (conflict, _resolvingParticipant, resolutionData) => {
      const participants = (resolutionData as { participants: SessionParticipant[] })?.participants || [];

      // Priority order: DRIVER > MODERATOR > NAVIGATOR > OBSERVER > ASYNC_PARTICIPANT
      const rolePriority = {
        [ParticipantRole.DRIVER]: 1,
        [ParticipantRole.MODERATOR]: 2,
        [ParticipantRole.NAVIGATOR]: 3,
        [ParticipantRole.OBSERVER]: 4,
        [ParticipantRole.ASYNC_PARTICIPANT]: 5,
      };

      let highestPriorityChange = conflict.changes[0];
      let highestPriority = 999;

      for (const change of conflict.changes) {
        const participant = participants.find(p => p.id === change.participantId);
        if (participant) {
          const priority = rolePriority[participant.role];
          if (priority < highestPriority) {
            highestPriority = priority;
            highestPriorityChange = change;
          }
        }
      }

      return highestPriorityChange.content;
    });

    // Version Branching strategy
    this.resolutionStrategies.set(ConflictResolutionStrategy.VERSION_BRANCHING, async (conflict) => 
      // Create a merged version containing all changes
       ({
        type: 'branched_versions',
        versions: conflict.changes.map((change, index) => ({
          branchId: `branch_${index}`,
          participantId: change.participantId,
          content: change.content,
          timestamp: change.timestamp,
        })),
        mergeRequired: true,
      })
    );

    // Manual resolution (requires external handling)
    this.resolutionStrategies.set(ConflictResolutionStrategy.MANUAL, async (conflict, _resolvingParticipant, resolutionData) => {
      if (!resolutionData) {
        throw new Error('Manual resolution requires resolution data');
      }
      return resolutionData;
    });
  }

  /**
   * Select appropriate participant for auto-resolution
   */
  private selectAutoResolver(participants: SessionParticipant[], strategy: ConflictResolutionStrategy): string {
    switch (strategy) {
      case ConflictResolutionStrategy.ROLE_PRIORITY:
        // Select driver or moderator
        const driver = participants.find(p => p.role === ParticipantRole.DRIVER);
        if (driver) return driver.id;
        const moderator = participants.find(p => p.role === ParticipantRole.MODERATOR);
        if (moderator) return moderator.id;
        break;

      case ConflictResolutionStrategy.MOST_ACTIVE_WINS:
        // Would need activity tracking - for now return first participant
        return participants[0]?.id || 'system';

      default:
        // For other strategies, use system resolver
        return 'system';
    }

    return participants[0]?.id || 'system';
  }

  /**
   * Clean up resolved conflicts (optional periodic cleanup)
   */
  cleanupResolvedConflicts(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    for (const [conflictId, conflict] of this.activeConflicts.entries()) {
      if (conflict.status === ConflictStatus.RESOLVED &&
          conflict.resolution &&
          conflict.resolution.resolvedAt < cutoffTime) {
        this.activeConflicts.delete(conflictId);
      }
    }
  }

  /**
   * Get conflict statistics
   */
  getConflictStats(): {
    total: number;
    pending: number;
    resolved: number;
    failed: number;
    byType: Record<ConflictType, number>;
  } {
    const conflicts = Array.from(this.activeConflicts.values());
    const byType: Record<ConflictType, number> = {
      [ConflictType.CODE_EDIT_CONFLICT]: 0,
      [ConflictType.CONTEXT_CONFLICT]: 0,
      [ConflictType.ROLE_CONFLICT]: 0,
      [ConflictType.WORKSPACE_CONFLICT]: 0,
      [ConflictType.SYNC_CONFLICT]: 0,
    };

    for (const conflict of conflicts) {
      byType[conflict.type]++;
    }

    return {
      total: conflicts.length,
      pending: conflicts.filter(c => c.status === ConflictStatus.PENDING).length,
      resolved: conflicts.filter(c => c.status === ConflictStatus.RESOLVED).length,
      failed: conflicts.filter(c => c.status === ConflictStatus.FAILED).length,
      byType,
    };
  }
}

/**
 * Type for conflict resolution strategy handlers
 */
type ConflictResolutionHandler = (
  conflict: CollaborationConflict,
  resolvingParticipant?: string,
  resolutionData?: unknown
) => Promise<unknown>;