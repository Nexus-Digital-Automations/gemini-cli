/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Pair-Programming Mode - Core Types and Interfaces
 * Comprehensive type definitions for collaborative development sessions
 *
 * Features:
 * - Multi-developer session support
 * - Shared context management
 * - Collaborative code editing
 * - Real-time synchronization
 * - Conflict resolution
 * - Session recording and playback
 * - Collaborative debugging
 * - Shared workspace management
 * - Asynchronous collaboration with context handoffs
 *
 * @author Claude Code - Pair-Programming Implementation Agent
 * @version 1.0.0
 */

import type { ContextItem, ContextType } from '../context/types.js';

/**
 * Types of collaboration sessions
 */
export enum SessionType {
  /** Real-time collaborative session with multiple active participants */
  REALTIME = 'realtime',
  /** Asynchronous session with context handoffs */
  ASYNC = 'async',
  /** Mentoring session with primary developer and observer */
  MENTORING = 'mentoring',
  /** Code review session */
  REVIEW = 'review',
  /** Debugging session focused on problem-solving */
  DEBUG = 'debug',
}

/**
 * Participant roles in collaborative sessions
 */
export enum ParticipantRole {
  /** Primary driver with full edit access */
  DRIVER = 'driver',
  /** Observer/navigator providing guidance */
  NAVIGATOR = 'navigator',
  /** Session moderator managing the collaboration */
  MODERATOR = 'moderator',
  /** Read-only observer */
  OBSERVER = 'observer',
  /** Async participant who can receive/send context handoffs */
  ASYNC_PARTICIPANT = 'async_participant',
}

/**
 * Session status states
 */
export enum SessionStatus {
  /** Session is being created */
  INITIALIZING = 'initializing',
  /** Session is active and accepting participants */
  ACTIVE = 'active',
  /** Session is paused temporarily */
  PAUSED = 'paused',
  /** Session is ending gracefully */
  ENDING = 'ending',
  /** Session has completed successfully */
  COMPLETED = 'completed',
  /** Session terminated due to error or timeout */
  TERMINATED = 'terminated',
}

/**
 * Types of collaboration events
 */
export enum CollaborationEventType {
  /** Participant joined the session */
  PARTICIPANT_JOINED = 'participant_joined',
  /** Participant left the session */
  PARTICIPANT_LEFT = 'participant_left',
  /** Code edit made by participant */
  CODE_EDIT = 'code_edit',
  /** Context shared between participants */
  CONTEXT_SHARED = 'context_shared',
  /** Conflict detected requiring resolution */
  CONFLICT_DETECTED = 'conflict_detected',
  /** Conflict resolved */
  CONFLICT_RESOLVED = 'conflict_resolved',
  /** Session role changed */
  ROLE_CHANGED = 'role_changed',
  /** Message sent in session */
  MESSAGE_SENT = 'message_sent',
  /** Session status changed */
  STATUS_CHANGED = 'status_changed',
  /** Recording started/stopped */
  RECORDING_TOGGLED = 'recording_toggled',
}

/**
 * Participant in a collaboration session
 */
export interface SessionParticipant {
  /** Unique identifier for the participant */
  id: string;
  /** Display name for the participant */
  name: string;
  /** Email or unique user identifier */
  userId: string;
  /** Current role in the session */
  role: ParticipantRole;
  /** When participant joined the session */
  joinedAt: Date;
  /** Last activity timestamp */
  lastActive: Date;
  /** Whether participant is currently online */
  isOnline: boolean;
  /** Participant's preferences and settings */
  preferences: ParticipantPreferences;
  /** Current cursor/focus position */
  cursorPosition?: CursorPosition;
}

/**
 * Participant preferences for collaboration
 */
export interface ParticipantPreferences {
  /** Preferred theme/appearance */
  theme: 'light' | 'dark' | 'auto';
  /** Notification preferences */
  notifications: {
    /** Notify on code edits */
    codeEdits: boolean;
    /** Notify on messages */
    messages: boolean;
    /** Notify on role changes */
    roleChanges: boolean;
  };
  /** Editor preferences */
  editor: {
    /** Show other participants' cursors */
    showCursors: boolean;
    /** Highlight participants' selections */
    showSelections: boolean;
    /** Auto-follow active participant */
    autoFollow: boolean;
  };
}

/**
 * Cursor position for collaborative editing
 */
export interface CursorPosition {
  /** File path being edited */
  filePath: string;
  /** Line number (1-based) */
  line: number;
  /** Column number (0-based) */
  column: number;
  /** Selected text range (if any) */
  selection?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
}

/**
 * Configuration for a collaboration session
 */
export interface SessionConfig {
  /** Type of collaboration session */
  type: SessionType;
  /** Maximum number of participants */
  maxParticipants: number;
  /** Session timeout in milliseconds */
  timeoutMs: number;
  /** Whether to enable session recording */
  recordSession: boolean;
  /** Whether to enable real-time synchronization */
  realTimeSync: boolean;
  /** Conflict resolution strategy */
  conflictResolution: ConflictResolutionStrategy;
  /** Workspace settings */
  workspace: WorkspaceConfig;
}

/**
 * Workspace configuration for collaboration
 */
export interface WorkspaceConfig {
  /** Root directory for the collaborative workspace */
  rootPath: string;
  /** Files and directories to include/exclude */
  fileFilters: {
    /** File patterns to include */
    include: string[];
    /** File patterns to exclude */
    exclude: string[];
  };
  /** Shared context configuration */
  sharedContext: {
    /** Maximum context items to share */
    maxItems: number;
    /** Auto-share context items */
    autoShare: boolean;
    /** Context sharing frequency in ms */
    syncFrequencyMs: number;
  };
}

/**
 * Collaboration session representation
 */
export interface CollaborationSession {
  /** Unique session identifier */
  id: string;
  /** Human-readable session name */
  name: string;
  /** Session configuration */
  config: SessionConfig;
  /** Current session status */
  status: SessionStatus;
  /** Session creator/host */
  host: SessionParticipant;
  /** All participants in the session */
  participants: SessionParticipant[];
  /** Session creation timestamp */
  createdAt: Date;
  /** Last activity timestamp */
  lastActivity: Date;
  /** Shared context between participants */
  sharedContext: SharedContextManager;
  /** Active conflicts requiring resolution */
  activeConflicts: CollaborationConflict[];
  /** Session metadata */
  metadata: {
    /** Total edit count */
    totalEdits: number;
    /** Total messages sent */
    totalMessages: number;
    /** Session duration in milliseconds */
    durationMs: number;
  };
}

/**
 * Shared context manager for collaboration
 */
export interface SharedContextManager {
  /** Shared context items */
  items: Map<string, ContextItem>;
  /** Context synchronization state */
  syncState: ContextSyncState;
  /** Add or update context item */
  addItem(item: ContextItem, participantId: string): void;
  /** Remove context item */
  removeItem(itemId: string, participantId: string): void;
  /** Get context for participant */
  getContextForParticipant(participantId: string): ContextItem[];
  /** Synchronize context across participants */
  synchronize(): Promise<void>;
}

/**
 * Context synchronization state
 */
export interface ContextSyncState {
  /** Last synchronization timestamp */
  lastSync: Date;
  /** Pending changes to synchronize */
  pendingChanges: ContextChange[];
  /** Synchronization in progress */
  isSyncing: boolean;
  /** Sync conflicts */
  conflicts: ContextConflict[];
}

/**
 * Context change for synchronization
 */
export interface ContextChange {
  /** Change identifier */
  id: string;
  /** Type of change */
  type: 'add' | 'update' | 'remove';
  /** Context item affected */
  contextId: string;
  /** Participant who made the change */
  participantId: string;
  /** Timestamp of change */
  timestamp: Date;
  /** Change content */
  content?: ContextItem;
}

/**
 * Conflict resolution strategies
 */
export enum ConflictResolutionStrategy {
  /** Manual resolution required */
  MANUAL = 'manual',
  /** Automatic merge using last-write-wins */
  LAST_WRITE_WINS = 'last_write_wins',
  /** Automatic merge using most active participant */
  MOST_ACTIVE_WINS = 'most_active_wins',
  /** Automatic merge using role-based priority */
  ROLE_PRIORITY = 'role_priority',
  /** Create multiple versions for later resolution */
  VERSION_BRANCHING = 'version_branching',
}

/**
 * Collaboration conflict representation
 */
export interface CollaborationConflict {
  /** Unique conflict identifier */
  id: string;
  /** Type of conflict */
  type: ConflictType;
  /** Participants involved in conflict */
  participants: string[];
  /** Conflicting changes */
  changes: ConflictingChange[];
  /** Conflict detection timestamp */
  detectedAt: Date;
  /** Resolution status */
  status: ConflictStatus;
  /** Resolution details */
  resolution?: ConflictResolution;
}

/**
 * Types of collaboration conflicts
 */
export enum ConflictType {
  /** Multiple edits to same code location */
  CODE_EDIT_CONFLICT = 'code_edit_conflict',
  /** Context changes conflicting */
  CONTEXT_CONFLICT = 'context_conflict',
  /** Role assignment conflicts */
  ROLE_CONFLICT = 'role_conflict',
  /** Workspace access conflicts */
  WORKSPACE_CONFLICT = 'workspace_conflict',
  /** Synchronization conflicts */
  SYNC_CONFLICT = 'sync_conflict',
}

/**
 * Conflict status
 */
export enum ConflictStatus {
  /** Conflict detected, pending resolution */
  PENDING = 'pending',
  /** Resolution in progress */
  RESOLVING = 'resolving',
  /** Conflict resolved successfully */
  RESOLVED = 'resolved',
  /** Conflict resolution failed */
  FAILED = 'failed',
}

/**
 * Conflicting change in a collaboration conflict
 */
export interface ConflictingChange {
  /** Change identifier */
  id: string;
  /** Participant who made the change */
  participantId: string;
  /** Change timestamp */
  timestamp: Date;
  /** Description of the change */
  description: string;
  /** Change content/data */
  content: unknown;
}

/**
 * Conflict resolution details
 */
export interface ConflictResolution {
  /** How the conflict was resolved */
  strategy: ConflictResolutionStrategy;
  /** Participant who resolved (if manual) */
  resolvedBy?: string;
  /** Resolution timestamp */
  resolvedAt: Date;
  /** Final resolved content */
  resolvedContent: unknown;
  /** Resolution notes */
  notes?: string;
}

/**
 * Context conflict (specific type of collaboration conflict)
 */
export interface ContextConflict {
  /** Unique conflict identifier */
  id: string;
  /** Context item in conflict */
  contextId: string;
  /** Conflicting versions */
  versions: Array<{
    participantId: string;
    content: ContextItem;
    timestamp: Date;
  }>;
  /** Resolution status */
  status: ConflictStatus;
}

/**
 * Collaboration event for session history
 */
export interface CollaborationEvent {
  /** Event identifier */
  id: string;
  /** Event type */
  type: CollaborationEventType;
  /** Session where event occurred */
  sessionId: string;
  /** Participant who triggered event */
  participantId: string;
  /** Event timestamp */
  timestamp: Date;
  /** Event data payload */
  data: unknown;
  /** Event metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Session recording for playback
 */
export interface SessionRecording {
  /** Recording identifier */
  id: string;
  /** Session that was recorded */
  sessionId: string;
  /** Recording start time */
  startTime: Date;
  /** Recording end time */
  endTime: Date;
  /** All events in chronological order */
  events: CollaborationEvent[];
  /** Recording metadata */
  metadata: {
    /** Total participants */
    participantCount: number;
    /** Total events recorded */
    eventCount: number;
    /** Recording duration */
    durationMs: number;
    /** Reason for stopping recording */
    stoppedReason?: string;
  };
}

/**
 * Asynchronous collaboration handoff
 */
export interface AsyncHandoff {
  /** Handoff identifier */
  id: string;
  /** Participant sending the handoff */
  fromParticipant: string;
  /** Participant receiving the handoff */
  toParticipant: string;
  /** Session context at handoff time */
  context: ContextItem[];
  /** Handoff message/notes */
  message: string;
  /** Handoff timestamp */
  timestamp: Date;
  /** Current status of handoff */
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  /** Expiry time for handoff */
  expiresAt?: Date;
}

/**
 * Session metrics and analytics
 */
export interface SessionMetrics {
  /** Session identifier */
  sessionId: string;
  /** Participation statistics */
  participation: {
    /** Total unique participants */
    totalParticipants: number;
    /** Average session duration per participant */
    avgDurationPerParticipant: number;
    /** Most active participant */
    mostActiveParticipant: string;
  };
  /** Activity metrics */
  activity: {
    /** Total code edits made */
    totalEdits: number;
    /** Total messages sent */
    totalMessages: number;
    /** Total context items shared */
    totalContextShared: number;
    /** Total conflicts encountered */
    totalConflicts: number;
    /** Conflict resolution rate */
    conflictResolutionRate: number;
  };
  /** Collaboration effectiveness */
  effectiveness: {
    /** Average response time between participants */
    avgResponseTimeMs: number;
    /** Context sharing frequency */
    contextSharingRate: number;
    /** Session productivity score (0-100) */
    productivityScore: number;
  };
}