/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DirectoryJSON } from 'memfs';
/**
 * File system helper for testing autonomous task management components
 */
export interface TestFileSystem {
    [path: string]: string | TestFileSystem;
}
export declare const fsHelper: {
    /**
     * Create a mock file system structure
     */
    createMockFs(structure: TestFileSystem): void;
    /**
     * Convert TestFileSystem structure to DirectoryJSON format
     */
    convertToDirectoryJson(structure: TestFileSystem, basePath?: string): DirectoryJSON;
    /**
     * Create a basic project structure for testing
     */
    createBasicProjectStructure(projectRoot?: string): void;
    /**
     * Create FEATURES.json with test data
     */
    createFeaturesFile(projectRoot: string, features?: any[]): void;
    /**
     * Get the current mock file system state
     */
    getMockFs(): DirectoryJSON;
    /**
     * Reset the mock file system
     */
    resetMockFs(): void;
    /**
     * Check if a file exists in the mock file system
     */
    exists(path: string): boolean;
    /**
     * Read a file from the mock file system
     */
    readFile(path: string): string;
    /**
     * Write a file to the mock file system
     */
    writeFile(path: string, content: string): void;
    /**
     * Create a test lock file
     */
    createLockFile(filePath: string, pid?: number): void;
    /**
     * Remove a test lock file
     */
    removeLockFile(filePath: string): void;
};
