/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import fs from 'node:fs/promises';
/**
 * Standard file system implementation using Node.js fs/promises API.
 *
 * This is the default production implementation that provides direct access
 * to the local file system through Node.js built-in file system APIs.
 * It uses UTF-8 encoding for all text operations and follows standard
 * Node.js error handling patterns.
 *
 * @example
 * ```typescript
 * const fileService = new StandardFileSystemService();
 * const content = await fileService.readTextFile('./package.json');
 * ```
 *
 * @remarks
 * This implementation is suitable for most production use cases where
 * direct file system access is required. For testing scenarios, consider
 * using a mock implementation that implements the FileSystemService interface.
 */
export class StandardFileSystemService {
    /**
     * {@inheritDoc FileSystemService.readTextFile}
     */
    async readTextFile(filePath) {
        return fs.readFile(filePath, 'utf-8');
    }
    /**
     * {@inheritDoc FileSystemService.writeTextFile}
     */
    async writeTextFile(filePath, content) {
        await fs.writeFile(filePath, content, 'utf-8');
    }
}
//# sourceMappingURL=fileSystemService.js.map