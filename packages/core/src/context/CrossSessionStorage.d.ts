/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SessionContext } from './types.js';
/**
 * Storage configuration for cross-session persistence
 */
export interface StorageConfig {
    /** Base directory for context storage */
    baseDir: string;
    /** Maximum number of sessions to keep */
    maxSessions: number;
    /** Maximum age of sessions in days */
    maxSessionAgeDays: number;
    /** Whether to compress stored context */
    useCompression: boolean;
    /** Enable encryption for sensitive data */
    enableEncryption: boolean;
    /** Maximum storage size in MB */
    maxStorageSizeMB: number;
}
/**
 * Cross-Session Storage Manager
 *
 * Manages persistent storage and retrieval of context across CLI sessions.
 * Provides efficient project-scoped context storage with automatic cleanup
 * and optimization.
 *
 * Features:
 * - Session continuity across CLI restarts
 * - Project-scoped context organization
 * - Automatic cleanup of old sessions
 * - Fast context retrieval with indexing
 * - Optional compression and encryption
 * - Storage quota management
 *
 * Storage Structure:
 * ```
 * ~/.gemini/context/
 * ├── index.json              # Storage index
 * ├── sessions/               # Individual session files
 * │   ├── session_123.json
 * │   └── session_124.json
 * ├── projects/               # Project-specific context
 * │   ├── project_abc.json
 * │   └── project_def.json
 * └── compressed/             # Compressed context cache
 *     └── compressed_data.db
 * ```
 *
 * @example
 * ```typescript
 * const storage = new CrossSessionStorage();
 * await storage.initialize();
 *
 * // Save session context
 * await storage.saveSession(sessionContext);
 *
 * // Load related sessions for project
 * const related = await storage.getRelatedSessions('/path/to/project');
 * ```
 */
export declare class CrossSessionStorage {
    private config;
    private index;
    private initialized;
    constructor(config?: Partial<StorageConfig>);
    /**
     * Initialize the storage system
     */
    initialize(): Promise<void>;
    /**
     * Save a session context to persistent storage
     */
    saveSession(session: SessionContext): Promise<void>;
    /**
     * Load a specific session by ID
     */
    loadSession(sessionId: string): Promise<SessionContext | null>;
    /**
     * Get sessions related to a specific project
     */
    getRelatedSessions(projectPath: string, maxSessions?: number): Promise<SessionContext[]>;
    /**
     * Get the most recent session for a project
     */
    getLatestSessionForProject(projectPath: string): Promise<SessionContext | null>;
    /**
     * Search sessions by content or metadata
     */
    searchSessions(query: string, limit?: number): Promise<SessionContext[]>;
    /**
     * Clean up old or unused sessions
     */
    cleanup(): Promise<void>;
    /**
     * Get storage statistics
     */
    getStorageStats(): Promise<{
        totalSessions: number;
        totalProjects: number;
        totalSizeBytes: number;
        oldestSession: Date | null;
        newestSession: Date | null;
    }>;
    private ensureInitialized;
    private createStorageDirectories;
    private loadStorageIndex;
    private saveStorageIndex;
    private prepareSessionForStorage;
    private updateIndexWithSession;
    private updateProjectIndex;
    private hashProjectPath;
    private calculateSearchScore;
    private removeSession;
    private getFileSize;
    private calculateStorageSize;
    private performMaintenanceIfNeeded;
}
/**
 * Create a cross-session storage instance with optional configuration
 */
export declare function createCrossSessionStorage(config?: Partial<StorageConfig>): CrossSessionStorage;
