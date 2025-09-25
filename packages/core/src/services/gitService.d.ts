/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Storage } from '../config/storage.js';
/**
 * Git-based checkpointing service for project state management and recovery.
 *
 * This service provides enterprise-grade project checkpointing capabilities using
 * a shadow Git repository system. It enables automatic backup and restoration
 * of project state without interfering with the user's primary Git workflow.
 * The service is designed for development tools that need reliable rollback
 * capabilities and change tracking.
 *
 * Architecture:
 * - Creates a separate shadow Git repository for checkpointing
 * - Mirrors the project's .gitignore to respect file exclusions
 * - Uses isolated Git configuration to avoid conflicts with user settings
 * - Provides atomic operations for creating and restoring snapshots
 *
 * Key Features:
 * - Non-intrusive checkpointing without affecting user's Git repository
 * - Automatic Git availability verification and error handling
 * - Isolated Git configuration to prevent user setting conflicts
 * - Support for complex project structures and .gitignore patterns
 * - Atomic snapshot creation with descriptive commit messages
 * - Complete project restoration from any checkpoint
 *
 * @example
 * ```typescript
 * const gitService = new GitService('/path/to/project', storage);
 * await gitService.initialize();
 *
 * // Create a checkpoint before making changes
 * const commitHash = await gitService.createFileSnapshot('Before refactoring');
 *
 * // Restore project to previous state if needed
 * await gitService.restoreProjectFromSnapshot(commitHash);
 * ```
 *
 * @remarks
 * This service is essential for development tools that make automated changes
 * to user projects and need to provide reliable undo/rollback functionality.
 * It operates completely independently of the user's Git workflow.
 */
export declare class GitService {
    private projectRoot;
    private storage;
    /**
     * Creates a new GitService instance for the specified project.
     *
     * @param projectRoot - Absolute path to the project root directory
     * @param storage - Storage configuration for checkpoint location
     *
     * @remarks
     * The constructor resolves the project root path and stores the storage
     * configuration but does not create the shadow repository. Call initialize()
     * to set up the checkpointing infrastructure.
     */
    constructor(projectRoot: string, storage: Storage);
    private getHistoryDir;
    /**
     * Initializes the checkpointing system by setting up the shadow Git repository.
     *
     * @returns A promise that resolves when initialization completes
     * @throws Error if Git is not available or shadow repository creation fails
     *
     * @remarks
     * This method performs the following initialization steps:
     * 1. Verifies Git is installed and accessible
     * 2. Creates the shadow Git repository infrastructure
     * 3. Sets up isolated Git configuration
     * 4. Mirrors the project's .gitignore file
     * 5. Creates initial commit for baseline
     *
     * Must be called before using any other service methods.
     */
    initialize(): Promise<void>;
    verifyGitAvailability(): Promise<boolean>;
    /**
     * Creates a hidden git repository in the project root.
     * The Git repository is used to support checkpointing.
     */
    setupShadowGitRepository(): Promise<void>;
    private get shadowGitRepository();
    getCurrentCommitHash(): Promise<string>;
    /**
     * Creates a snapshot of the current project state with a descriptive message.
     *
     * @param message - Descriptive commit message for the checkpoint
     * @returns The Git commit hash of the created snapshot
     * @throws Error if the snapshot creation fails
     *
     * @remarks
     * This method performs an atomic commit of all tracked files in the project,
     * creating a point-in-time snapshot that can be restored later. The operation:
     * 1. Stages all files respecting .gitignore patterns
     * 2. Creates a commit with the provided message
     * 3. Returns the commit hash for future restoration
     *
     * The snapshot includes all project files except those excluded by .gitignore.
     *
     * @example
     * ```typescript
     * const hash = await gitService.createFileSnapshot('Before AI refactoring');
     * console.log(`Checkpoint created: ${hash}`);
     * ```
     */
    createFileSnapshot(message: string): Promise<string>;
    /**
     * Restores the project to a previous checkpoint state.
     *
     * @param commitHash - The Git commit hash of the checkpoint to restore
     * @returns A promise that resolves when restoration completes
     * @throws Error if the commit hash is invalid or restoration fails
     *
     * @remarks
     * This method performs a complete restoration of project state to the
     * specified checkpoint. The operation:
     * 1. Restores all files from the specified commit
     * 2. Removes any untracked files created after the checkpoint
     * 3. Ensures project directory matches the snapshot exactly
     *
     * **Warning**: This operation is destructive and will overwrite any
     * changes made after the checkpoint. Ensure important work is saved
     * or committed before restoration.
     *
     * @example
     * ```typescript
     * // Restore to a previous checkpoint
     * await gitService.restoreProjectFromSnapshot('abc123def456');
     * console.log('Project restored to checkpoint');
     * ```
     */
    restoreProjectFromSnapshot(commitHash: string): Promise<void>;
}
