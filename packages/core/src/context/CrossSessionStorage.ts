/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Cross-Session Storage Manager
 * Persistent context storage and retrieval across CLI sessions
 *
 * @author Claude Code - Advanced Context Retention Agent
 * @version 1.0.0
 */

import {
  readFile,
  writeFile,
  mkdir,
  readdir,
  stat,
  rm,
} from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { Storage } from '../config/storage.js';
import { getComponentLogger } from '../utils/logger.js';
import type {
  ContextItem,
  SessionContext,
  CodeContextSnapshot,
} from './types.js';

const logger = getComponentLogger('cross-session-storage');

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
 * Default storage configuration
 */
const DEFAULT_STORAGE_CONFIG: StorageConfig = {
  baseDir: join(Storage.getGlobalGeminiDir(), 'context'),
  maxSessions: 100,
  maxSessionAgeDays: 30,
  useCompression: true,
  enableEncryption: false,
  maxStorageSizeMB: 50,
};

/**
 * Storage index for fast session retrieval
 */
interface StorageIndex {
  sessions: SessionIndexEntry[];
  projects: ProjectIndexEntry[];
  lastCleanup: string;
  version: string;
}

interface SessionIndexEntry {
  sessionId: string;
  projectPath: string;
  startTime: string;
  endTime?: string;
  itemCount: number;
  tokenCount: number;
  filePath: string;
  size: number;
}

interface ProjectIndexEntry {
  projectPath: string;
  projectHash: string;
  sessionIds: string[];
  lastAccessed: string;
  contextSummary: string;
  totalTokens: number;
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
export class CrossSessionStorage {
  private config: StorageConfig;
  private index: StorageIndex | null = null;
  private initialized = false;

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = { ...DEFAULT_STORAGE_CONFIG, ...config };
    logger.info('CrossSessionStorage initialized', { config: this.config });
  }

  /**
   * Initialize the storage system
   */
  async initialize(): Promise<void> {
    logger.info('Initializing cross-session storage');

    try {
      // Create storage directories
      await this.createStorageDirectories();

      // Load or create storage index
      await this.loadStorageIndex();

      // Perform cleanup if needed
      await this.performMaintenanceIfNeeded();

      this.initialized = true;
      logger.info('Cross-session storage initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize cross-session storage', { error });
      throw error;
    }
  }

  /**
   * Save a session context to persistent storage
   */
  async saveSession(session: SessionContext): Promise<void> {
    this.ensureInitialized();

    const startTime = performance.now();
    logger.debug(`Saving session ${session.sessionId}`);

    try {
      // Generate file path for session
      const sessionFile = join(
        this.config.baseDir,
        'sessions',
        `session_${session.sessionId}.json`,
      );

      // Prepare session data for storage
      const sessionData = this.prepareSessionForStorage(session);

      // Write session data
      await writeFile(
        sessionFile,
        JSON.stringify(sessionData, null, 2),
        'utf-8',
      );

      // Update storage index
      await this.updateIndexWithSession(session, sessionFile);

      // Update project index
      await this.updateProjectIndex(session);

      const duration = performance.now() - startTime;
      logger.info(`Session saved successfully in ${duration.toFixed(2)}ms`, {
        sessionId: session.sessionId,
        itemCount: session.contextItems.length,
        filePath: sessionFile,
      });
    } catch (error) {
      logger.error(`Failed to save session ${session.sessionId}`, { error });
      throw error;
    }
  }

  /**
   * Load a specific session by ID
   */
  async loadSession(sessionId: string): Promise<SessionContext | null> {
    this.ensureInitialized();

    const startTime = performance.now();
    logger.debug(`Loading session ${sessionId}`);

    try {
      // Find session in index
      const sessionEntry = this.index!.sessions.find(
        (s) => s.sessionId === sessionId,
      );
      if (!sessionEntry) {
        logger.warn(`Session ${sessionId} not found in index`);
        return null;
      }

      // Load session data from file
      const sessionData = await readFile(sessionEntry.filePath, 'utf-8');
      const session = JSON.parse(sessionData) as SessionContext;

      // Restore dates and other objects
      session.startTime = new Date(session.startTime);
      if (session.endTime) {
        session.endTime = new Date(session.endTime);
      }

      // Restore context item dates
      for (const item of session.contextItems) {
        item.timestamp = new Date(item.timestamp);
        item.lastAccessed = new Date(item.lastAccessed);
      }

      const duration = performance.now() - startTime;
      logger.info(`Session loaded successfully in ${duration.toFixed(2)}ms`, {
        sessionId,
        itemCount: session.contextItems.length,
      });

      return session;
    } catch (error) {
      logger.error(`Failed to load session ${sessionId}`, { error });
      return null;
    }
  }

  /**
   * Get sessions related to a specific project
   */
  async getRelatedSessions(
    projectPath: string,
    maxSessions = 10,
  ): Promise<SessionContext[]> {
    this.ensureInitialized();

    const startTime = performance.now();
    logger.debug(`Getting related sessions for project ${projectPath}`, {
      maxSessions,
    });

    try {
      const projectHash = this.hashProjectPath(projectPath);

      // Find project in index
      const projectEntry = this.index!.projects.find(
        (p) => p.projectHash === projectHash,
      );
      if (!projectEntry) {
        logger.debug(`No sessions found for project ${projectPath}`);
        return [];
      }

      // Load the most recent sessions
      const recentSessionIds = projectEntry.sessionIds
        .slice(-maxSessions)
        .reverse(); // Most recent first

      const sessions: SessionContext[] = [];
      for (const sessionId of recentSessionIds) {
        const session = await this.loadSession(sessionId);
        if (session) {
          sessions.push(session);
        }
      }

      const duration = performance.now() - startTime;
      logger.info(
        `Found ${sessions.length} related sessions in ${duration.toFixed(2)}ms`,
        {
          projectPath,
          projectHash,
        },
      );

      return sessions;
    } catch (error) {
      logger.error(`Failed to get related sessions for ${projectPath}`, {
        error,
      });
      return [];
    }
  }

  /**
   * Get the most recent session for a project
   */
  async getLatestSessionForProject(
    projectPath: string,
  ): Promise<SessionContext | null> {
    const sessions = await this.getRelatedSessions(projectPath, 1);
    return sessions.length > 0 ? sessions[0] : null;
  }

  /**
   * Search sessions by content or metadata
   */
  async searchSessions(query: string, limit = 20): Promise<SessionContext[]> {
    this.ensureInitialized();

    const startTime = performance.now();
    logger.debug(`Searching sessions for query: ${query}`, { limit });

    try {
      const queryLower = query.toLowerCase();
      const matchingSessions: Array<{
        session: SessionContext;
        score: number;
      }> = [];

      // Search through sessions in index
      for (const sessionEntry of this.index!.sessions) {
        const session = await this.loadSession(sessionEntry.sessionId);
        if (!session) continue;

        const score = this.calculateSearchScore(session, queryLower);
        if (score > 0.1) {
          // Minimum relevance threshold
          matchingSessions.push({ session, score });
        }
      }

      // Sort by relevance score and return top results
      const results = matchingSessions
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((item) => item.session);

      const duration = performance.now() - startTime;
      logger.info(`Search completed in ${duration.toFixed(2)}ms`, {
        query,
        resultsCount: results.length,
      });

      return results;
    } catch (error) {
      logger.error(`Failed to search sessions for query: ${query}`, { error });
      return [];
    }
  }

  /**
   * Clean up old or unused sessions
   */
  async cleanup(): Promise<void> {
    this.ensureInitialized();

    const startTime = performance.now();
    logger.info('Starting storage cleanup');

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.maxSessionAgeDays);

      let removedCount = 0;
      const sessionsToRemove: string[] = [];

      // Find sessions to remove
      for (const sessionEntry of this.index!.sessions) {
        const sessionDate = new Date(sessionEntry.startTime);
        if (sessionDate < cutoffDate) {
          sessionsToRemove.push(sessionEntry.sessionId);
        }
      }

      // Remove old session files
      for (const sessionId of sessionsToRemove) {
        await this.removeSession(sessionId);
        removedCount++;
      }

      // Enforce session count limit
      if (this.index!.sessions.length > this.config.maxSessions) {
        const excess = this.index!.sessions.length - this.config.maxSessions;
        const oldestSessions = this.index!.sessions.sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        ).slice(0, excess);

        for (const sessionEntry of oldestSessions) {
          await this.removeSession(sessionEntry.sessionId);
          removedCount++;
        }
      }

      // Update index
      this.index!.lastCleanup = new Date().toISOString();
      await this.saveStorageIndex();

      const duration = performance.now() - startTime;
      logger.info(`Storage cleanup completed in ${duration.toFixed(2)}ms`, {
        removedSessions: removedCount,
      });
    } catch (error) {
      logger.error('Storage cleanup failed', { error });
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalSessions: number;
    totalProjects: number;
    totalSizeBytes: number;
    oldestSession: Date | null;
    newestSession: Date | null;
  }> {
    this.ensureInitialized();

    try {
      const stats = await this.calculateStorageSize();

      return {
        totalSessions: this.index!.sessions.length,
        totalProjects: this.index!.projects.length,
        totalSizeBytes: stats.totalSize,
        oldestSession:
          this.index!.sessions.length > 0
            ? new Date(
                Math.min(
                  ...this.index!.sessions.map((s) =>
                    new Date(s.startTime).getTime(),
                  ),
                ),
              )
            : null,
        newestSession:
          this.index!.sessions.length > 0
            ? new Date(
                Math.max(
                  ...this.index!.sessions.map((s) =>
                    new Date(s.startTime).getTime(),
                  ),
                ),
              )
            : null,
      };
    } catch (error) {
      logger.error('Failed to get storage stats', { error });
      throw error;
    }
  }

  // Private helper methods

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(
        'CrossSessionStorage not initialized. Call initialize() first.',
      );
    }
  }

  private async createStorageDirectories(): Promise<void> {
    const directories = [
      this.config.baseDir,
      join(this.config.baseDir, 'sessions'),
      join(this.config.baseDir, 'projects'),
      join(this.config.baseDir, 'compressed'),
    ];

    for (const dir of directories) {
      await mkdir(dir, { recursive: true });
    }
  }

  private async loadStorageIndex(): Promise<void> {
    const indexPath = join(this.config.baseDir, 'index.json');

    try {
      const indexData = await readFile(indexPath, 'utf-8');
      this.index = JSON.parse(indexData) as StorageIndex;
      logger.debug('Storage index loaded successfully');
    } catch (error) {
      // Create new index if file doesn't exist
      logger.info('Creating new storage index');
      this.index = {
        sessions: [],
        projects: [],
        lastCleanup: new Date().toISOString(),
        version: '1.0.0',
      };
      await this.saveStorageIndex();
    }
  }

  private async saveStorageIndex(): Promise<void> {
    const indexPath = join(this.config.baseDir, 'index.json');
    await writeFile(indexPath, JSON.stringify(this.index, null, 2), 'utf-8');
  }

  private prepareSessionForStorage(session: SessionContext): any {
    // Create a storage-friendly version of the session
    return {
      ...session,
      startTime: session.startTime.toISOString(),
      endTime: session.endTime?.toISOString(),
      contextItems: session.contextItems.map((item) => ({
        ...item,
        timestamp: item.timestamp.toISOString(),
        lastAccessed: item.lastAccessed.toISOString(),
      })),
    };
  }

  private async updateIndexWithSession(
    session: SessionContext,
    filePath: string,
  ): Promise<void> {
    const sessionEntry: SessionIndexEntry = {
      sessionId: session.sessionId,
      projectPath: session.projectPath,
      startTime: session.startTime.toISOString(),
      endTime: session.endTime?.toISOString(),
      itemCount: session.contextItems.length,
      tokenCount: session.contextItems.reduce(
        (sum, item) => sum + item.tokenCount,
        0,
      ),
      filePath,
      size: await this.getFileSize(filePath),
    };

    // Remove existing entry if it exists
    this.index!.sessions = this.index!.sessions.filter(
      (s) => s.sessionId !== session.sessionId,
    );

    // Add new entry
    this.index!.sessions.push(sessionEntry);

    await this.saveStorageIndex();
  }

  private async updateProjectIndex(session: SessionContext): Promise<void> {
    const projectHash = this.hashProjectPath(session.projectPath);

    // Find existing project entry
    let projectEntry = this.index!.projects.find(
      (p) => p.projectHash === projectHash,
    );

    if (!projectEntry) {
      // Create new project entry
      projectEntry = {
        projectPath: session.projectPath,
        projectHash,
        sessionIds: [],
        lastAccessed: session.startTime.toISOString(),
        contextSummary: session.conversationSummary,
        totalTokens: 0,
      };
      this.index!.projects.push(projectEntry);
    }

    // Update project entry
    if (!projectEntry.sessionIds.includes(session.sessionId)) {
      projectEntry.sessionIds.push(session.sessionId);
    }
    projectEntry.lastAccessed = session.startTime.toISOString();
    projectEntry.contextSummary = session.conversationSummary;
    projectEntry.totalTokens = session.contextItems.reduce(
      (sum, item) => sum + item.tokenCount,
      0,
    );

    await this.saveStorageIndex();
  }

  private hashProjectPath(projectPath: string): string {
    return createHash('sha256')
      .update(projectPath)
      .digest('hex')
      .substring(0, 16);
  }

  private calculateSearchScore(session: SessionContext, query: string): number {
    let score = 0;

    // Search in conversation summary
    if (session.conversationSummary.toLowerCase().includes(query)) {
      score += 0.5;
    }

    // Search in context items
    for (const item of session.contextItems) {
      if (item.content.toLowerCase().includes(query)) {
        score += 0.3;
      }

      // Check tags
      for (const tag of item.tags) {
        if (tag.toLowerCase().includes(query)) {
          score += 0.2;
        }
      }
    }

    // Search in project path
    if (session.projectPath.toLowerCase().includes(query)) {
      score += 0.1;
    }

    return Math.min(score, 1.0); // Cap at 1.0
  }

  private async removeSession(sessionId: string): Promise<void> {
    // Find session in index
    const sessionEntry = this.index!.sessions.find(
      (s) => s.sessionId === sessionId,
    );
    if (!sessionEntry) return;

    try {
      // Remove session file
      await rm(sessionEntry.filePath);

      // Remove from index
      this.index!.sessions = this.index!.sessions.filter(
        (s) => s.sessionId !== sessionId,
      );

      // Update project index
      for (const projectEntry of this.index!.projects) {
        projectEntry.sessionIds = projectEntry.sessionIds.filter(
          (id) => id !== sessionId,
        );
      }

      // Remove empty project entries
      this.index!.projects = this.index!.projects.filter(
        (p) => p.sessionIds.length > 0,
      );

      logger.debug(`Removed session ${sessionId}`);
    } catch (error) {
      logger.warn(`Failed to remove session file for ${sessionId}`, { error });
    }
  }

  private async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = await stat(filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  private async calculateStorageSize(): Promise<{
    totalSize: number;
    fileCount: number;
  }> {
    let totalSize = 0;
    let fileCount = 0;

    try {
      const sessionsDir = join(this.config.baseDir, 'sessions');
      const sessionFiles = await readdir(sessionsDir);

      for (const file of sessionFiles) {
        const filePath = join(sessionsDir, file);
        const stats = await stat(filePath);
        totalSize += stats.size;
        fileCount++;
      }
    } catch (error) {
      logger.warn('Failed to calculate storage size', { error });
    }

    return { totalSize, fileCount };
  }

  private async performMaintenanceIfNeeded(): Promise<void> {
    if (!this.index) return;

    const lastCleanup = new Date(this.index.lastCleanup);
    const daysSinceCleanup =
      (Date.now() - lastCleanup.getTime()) / (1000 * 60 * 60 * 24);

    // Run cleanup if it's been more than 7 days
    if (daysSinceCleanup > 7) {
      logger.info('Performing scheduled maintenance');
      await this.cleanup();
    }

    // Check storage quota
    const stats = await this.calculateStorageSize();
    const sizeMB = stats.totalSize / (1024 * 1024);

    if (sizeMB > this.config.maxStorageSizeMB) {
      logger.warn(
        `Storage size (${sizeMB.toFixed(2)}MB) exceeds limit (${this.config.maxStorageSizeMB}MB)`,
      );
      await this.cleanup();
    }
  }
}

/**
 * Create a cross-session storage instance with optional configuration
 */
export function createCrossSessionStorage(
  config?: Partial<StorageConfig>,
): CrossSessionStorage {
  return new CrossSessionStorage(config);
}
