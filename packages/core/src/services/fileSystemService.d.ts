/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Interface for file system operations that may be delegated to different implementations.
 *
 * This interface provides a clean abstraction layer for file system operations,
 * enabling dependency injection and testing through mock implementations.
 * It supports different execution environments and storage backends while
 * maintaining a consistent API for text file operations.
 *
 * @remarks
 * The interface is designed to be simple yet extensible, focusing on common
 * text file operations. Implementations should handle proper encoding,
 * error handling, and path resolution according to their specific requirements.
 */
export interface FileSystemService {
  /**
   * Read text content from a file using UTF-8 encoding.
   *
   * @param filePath - The absolute or relative path to the file to read
   * @returns A promise that resolves to the file content as a string
   * @throws Error if the file cannot be read or does not exist
   *
   * @example
   * ```typescript
   * const content = await fileService.readTextFile('./config.json');
   * const config = JSON.parse(content);
   * ```
   */
  readTextFile(filePath: string): Promise<string>;
  /**
   * Write text content to a file using UTF-8 encoding.
   *
   * @param filePath - The absolute or relative path to the file to write
   * @param content - The text content to write to the file
   * @returns A promise that resolves when the write operation completes
   * @throws Error if the file cannot be written or the directory does not exist
   *
   * @remarks
   * This method will create the file if it doesn't exist and overwrite
   * existing content. Parent directories must exist prior to writing.
   *
   * @example
   * ```typescript
   * const config = { setting: 'value' };
   * await fileService.writeTextFile('./config.json', JSON.stringify(config, null, 2));
   * ```
   */
  writeTextFile(filePath: string, content: string): Promise<void>;
}
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
export declare class StandardFileSystemService implements FileSystemService {
  /**
   * {@inheritDoc FileSystemService.readTextFile}
   */
  readTextFile(filePath: string): Promise<string>;
  /**
   * {@inheritDoc FileSystemService.writeTextFile}
   */
  writeTextFile(filePath: string, content: string): Promise<void>;
}
