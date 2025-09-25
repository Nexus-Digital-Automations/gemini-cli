/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PartUnion } from '@google/genai';
import type { FileSystemService } from '../services/fileSystemService.js';
import type { ToolErrorType } from '../tools/tool-error.js';
export declare const DEFAULT_ENCODING: BufferEncoding;
type UnicodeEncoding = 'utf8' | 'utf16le' | 'utf16be' | 'utf32le' | 'utf32be';
interface BOMInfo {
  encoding: UnicodeEncoding;
  bomLength: number;
}
/**
 * Detects a Unicode Byte Order Mark (BOM) at the beginning of a buffer.
 *
 * BOMs are special byte sequences that indicate the encoding and byte order of Unicode text files.
 * This function checks for UTF-8, UTF-16 (both little and big endian), and UTF-32 BOMs.
 *
 * @param buf - The buffer to check for a BOM (must contain at least the BOM bytes)
 * @returns An object with encoding type and BOM length, or null if no BOM is detected
 *
 * @example
 * ```typescript
 * const utf8Buffer = Buffer.from([0xEF, 0xBB, 0xBF, 0x48, 0x65, 0x6C, 0x6C, 0x6F]);
 * const bom = detectBOM(utf8Buffer);
 * console.log(bom); // { encoding: 'utf8', bomLength: 3 }
 *
 * const noBomBuffer = Buffer.from('Hello', 'ascii');
 * console.log(detectBOM(noBomBuffer)); // null
 * ```
 */
export declare function detectBOM(buf: Buffer): BOMInfo | null;
/**
 * Reads a file as text with automatic encoding detection based on BOM.
 *
 * This function reads the entire file, detects any Unicode Byte Order Mark (BOM),
 * strips the BOM from the content, and decodes the remaining bytes using the
 * appropriate encoding. If no BOM is detected, it defaults to UTF-8.
 *
 * Supported encodings:
 * - UTF-8 (with or without BOM)
 * - UTF-16 Little Endian
 * - UTF-16 Big Endian
 * - UTF-32 Little Endian
 * - UTF-32 Big Endian
 *
 * @param filePath - Absolute path to the file to read
 * @returns Promise resolving to the decoded text content
 * @throws Will throw an error if the file cannot be read
 *
 * @example
 * ```typescript
 * // Reads a UTF-8 file with BOM
 * const content1 = await readFileWithEncoding('/path/to/utf8-with-bom.txt');
 *
 * // Reads a UTF-16 file
 * const content2 = await readFileWithEncoding('/path/to/utf16-file.txt');
 *
 * // Reads a plain ASCII/UTF-8 file (no BOM)
 * const content3 = await readFileWithEncoding('/path/to/plain.txt');
 * ```
 */
export declare function readFileWithEncoding(filePath: string): Promise<string>;
/**
 * Determines the MIME type of a file based on its file extension.
 *
 * Uses the 'mime' library to look up the MIME type associated with the file's extension.
 * This is useful for determining how to handle different file types (text, image, binary, etc.).
 *
 * @param filePath - Path to the file (can be relative or absolute)
 * @returns The MIME type string if found, undefined if the extension is not recognized
 *
 * @example
 * ```typescript
 * console.log(getSpecificMimeType('script.js')); // 'application/javascript'
 * console.log(getSpecificMimeType('image.png')); // 'image/png'
 * console.log(getSpecificMimeType('data.json')); // 'application/json'
 * console.log(getSpecificMimeType('unknown.xyz')); // undefined
 * ```
 */
export declare function getSpecificMimeType(
  filePath: string,
): string | undefined;
/**
 * Validates that a path is within the bounds of a specified root directory.
 *
 * This function is essential for security, preventing path traversal attacks by ensuring
 * that file operations stay within allowed directories. Both paths are normalized and
 * resolved to absolute paths before comparison.
 *
 * @param pathToCheck - The path to validate (will be resolved to absolute)
 * @param rootDirectory - The root directory boundary (will be resolved to absolute)
 * @returns True if pathToCheck is within or equal to rootDirectory, false otherwise
 *
 * @example
 * ```typescript
 * // Safe path within root
 * isWithinRoot('/home/user/docs/file.txt', '/home/user'); // true
 *
 * // Path traversal attempt
 * isWithinRoot('/home/user/../etc/passwd', '/home/user'); // false
 *
 * // Exact match with root
 * isWithinRoot('/home/user', '/home/user'); // true
 *
 * // Subdirectory
 * isWithinRoot('/home/user/subdir', '/home/user'); // true
 * ```
 */
export declare function isWithinRoot(
  pathToCheck: string,
  rootDirectory: string,
): boolean;
/**
 * Determines if a file contains binary data using heuristic analysis.
 *
 * This function uses multiple strategies to detect binary files:
 * 1. BOM Detection: Files with Unicode BOMs are considered text
 * 2. NULL Byte Detection: Presence of NULL bytes strongly indicates binary data
 * 3. Non-printable Character Ratio: High ratio of non-printable characters suggests binary
 *
 * The function samples up to 4KB from the beginning of the file for performance.
 *
 * @param filePath - Absolute path to the file to analyze
 * @returns Promise resolving to true if the file appears to be binary, false if text
 *
 * @example
 * ```typescript
 * const isImageBinary = await isBinaryFile('/path/to/image.jpg'); // true
 * const isTextFile = await isBinaryFile('/path/to/document.txt'); // false
 * const isUTF16File = await isBinaryFile('/path/to/unicode.txt'); // false (BOM detected)
 * ```
 */
export declare function isBinaryFile(filePath: string): Promise<boolean>;
/**
 * Determines the file type through extension analysis and content inspection.
 *
 * This function categorizes files into types that are relevant for processing by the application.
 * It uses both MIME type lookup and content analysis to make accurate determinations.
 *
 * Special handling:
 * - TypeScript files (.ts, .mts, .cts) are treated as text (MIME lookup may return video types)
 * - SVG files get their own category for special processing
 * - Binary extensions are checked before content analysis for performance
 * - Content-based binary detection is used as a fallback
 *
 * @param filePath - Path to the file to analyze
 * @returns Promise resolving to one of: 'text', 'image', 'pdf', 'audio', 'video', 'binary', 'svg'
 *
 * @example
 * ```typescript
 * console.log(await detectFileType('script.ts')); // 'text'
 * console.log(await detectFileType('photo.jpg')); // 'image'
 * console.log(await detectFileType('icon.svg')); // 'svg'
 * console.log(await detectFileType('doc.pdf')); // 'pdf'
 * console.log(await detectFileType('app.exe')); // 'binary'
 * ```
 */
export declare function detectFileType(
  filePath: string,
): Promise<'text' | 'image' | 'pdf' | 'audio' | 'video' | 'binary' | 'svg'>;
/**
 * Represents the complete result of processing a file for LLM consumption.
 *
 * This interface encapsulates all the information needed when reading files for AI processing,
 * including the content in the appropriate format, user-facing display messages, error handling,
 * and metadata about text file processing (truncation, line ranges, etc.).
 *
 * The `llmContent` field varies by file type:
 * - Text files: string content (possibly truncated)
 * - Images/PDFs/Audio/Video: Part object with base64 data and MIME type
 * - Errors: string error message
 */
export interface ProcessedFileReadResult {
  /** Content formatted for LLM consumption - string for text, Part for image/pdf/binary */
  llmContent: PartUnion;
  /** Human-readable display string showing file content summary */
  returnDisplay: string;
  /** Optional error message for the LLM if file processing failed */
  error?: string;
  /** Structured error type for programmatic handling */
  errorType?: ToolErrorType;
  /** For text files, indicates if content was truncated due to size limits */
  isTruncated?: boolean;
  /** For text files, the total number of lines in the original file */
  originalLineCount?: number;
  /** For text files, the range of lines shown [startLine, endLine] (1-based for display) */
  linesShown?: [number, number];
}
/**
 * Reads and processes a file into a format suitable for LLM consumption.
 *
 * This function handles multiple file types and provides comprehensive error handling,
 * size limits, and content formatting. It's the primary interface for reading files
 * in the application.
 *
 * Features:
 * - Automatic file type detection and appropriate processing
 * - Size limits (20MB max) with clear error messages
 * - Text file line-based reading with offset/limit support
 * - Binary file encoding to base64 for LLM consumption
 * - Comprehensive error handling with structured error types
 * - Relative path display for user-friendly output
 *
 * @param filePath - Absolute path to the file to read
 * @param rootDirectory - Absolute path to project root (for relative path display)
 * @param fileSystemService - Service for file system operations
 * @param offset - Starting line number for text files (0-based, optional)
 * @param limit - Maximum number of lines to read for text files (optional)
 * @returns Promise resolving to a ProcessedFileReadResult with content and metadata
 *
 * @example
 * ```typescript
 * // Read entire text file
 * const result1 = await processSingleFileContent(
 *   '/project/src/main.ts',
 *   '/project',
 *   fileService
 * );
 *
 * // Read specific lines from text file
 * const result2 = await processSingleFileContent(
 *   '/project/large-file.txt',
 *   '/project',
 *   fileService,
 *   100, // Start at line 100
 *   50   // Read 50 lines
 * );
 * ```
 */
export declare function processSingleFileContent(
  filePath: string,
  rootDirectory: string,
  fileSystemService: FileSystemService,
  offset?: number,
  limit?: number,
): Promise<ProcessedFileReadResult>;
/**
 * Checks if a file exists at the specified path.
 *
 * This function provides a simple async interface for checking file existence
 * without throwing errors. It uses fs.access() with F_OK flag to test for existence.
 *
 * @param filePath - The path to check for file existence
 * @returns Promise resolving to true if the file exists, false otherwise
 *
 * @example
 * ```typescript
 * if (await fileExists('/path/to/config.json')) {
 *   const config = await readFileWithEncoding('/path/to/config.json');
 *   // Process config...
 * } else {
 *   console.log('Config file not found, using defaults');
 * }
 * ```
 */
export declare function fileExists(filePath: string): Promise<boolean>;
export {};
