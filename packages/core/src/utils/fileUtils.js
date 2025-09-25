/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import mime from 'mime';
import { ToolErrorType } from '../tools/tool-error.js';
import { BINARY_EXTENSIONS } from './ignorePatterns.js';
// Constants for text file processing
const DEFAULT_MAX_LINES_TEXT_FILE = 2000;
const MAX_LINE_LENGTH_TEXT_FILE = 2000;
// Default values for encoding and separator format
export const DEFAULT_ENCODING = 'utf-8';
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
export function detectBOM(buf) {
    if (buf.length >= 4) {
        // UTF-32 LE: FF FE 00 00
        if (buf[0] === 0xff &&
            buf[1] === 0xfe &&
            buf[2] === 0x00 &&
            buf[3] === 0x00) {
            return { encoding: 'utf32le', bomLength: 4 };
        }
        // UTF-32 BE: 00 00 FE FF
        if (buf[0] === 0x00 &&
            buf[1] === 0x00 &&
            buf[2] === 0xfe &&
            buf[3] === 0xff) {
            return { encoding: 'utf32be', bomLength: 4 };
        }
    }
    if (buf.length >= 3) {
        // UTF-8: EF BB BF
        if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
            return { encoding: 'utf8', bomLength: 3 };
        }
    }
    if (buf.length >= 2) {
        // UTF-16 LE: FF FE  (but not UTF-32 LE already matched above)
        if (buf[0] === 0xff &&
            buf[1] === 0xfe &&
            (buf.length < 4 || buf[2] !== 0x00 || buf[3] !== 0x00)) {
            return { encoding: 'utf16le', bomLength: 2 };
        }
        // UTF-16 BE: FE FF
        if (buf[0] === 0xfe && buf[1] === 0xff) {
            return { encoding: 'utf16be', bomLength: 2 };
        }
    }
    return null;
}
/**
 * Converts a UTF-16 Big Endian buffer to a JavaScript string.
 *
 * Node.js natively supports UTF-16 Little Endian ('utf16le') but not Big Endian.
 * This function swaps the byte order from big endian to little endian and then
 * uses Node's built-in decoder.
 *
 * @param buf - The UTF-16 BE buffer to decode
 * @returns The decoded string
 *
 * @example
 * ```typescript
 * // UTF-16 BE bytes for "Hi"
 * const utf16BEBuffer = Buffer.from([0x00, 0x48, 0x00, 0x69]);
 * const text = decodeUTF16BE(utf16BEBuffer);
 * console.log(text); // "Hi"
 * ```
 */
function decodeUTF16BE(buf) {
    if (buf.length === 0)
        return '';
    const swapped = Buffer.from(buf); // swap16 mutates in place, so copy
    swapped.swap16();
    return swapped.toString('utf16le');
}
/**
 * Decodes a UTF-32 buffer (Little Endian or Big Endian) into a JavaScript string.
 *
 * UTF-32 uses 4 bytes per character. This function reads 4-byte sequences and converts
 * them to Unicode code points. Invalid code points (surrogates, out of range) are
 * replaced with the Unicode replacement character (U+FFFD). Partial trailing bytes
 * that don't form a complete 4-byte sequence are ignored.
 *
 * @param buf - The UTF-32 buffer to decode
 * @param littleEndian - True for little endian byte order, false for big endian
 * @returns The decoded string with invalid code points replaced by U+FFFD
 *
 * @example
 * ```typescript
 * // UTF-32 LE bytes for "Hi" (0x48 = 'H', 0x69 = 'i')
 * const utf32LEBuffer = Buffer.from([0x48, 0x00, 0x00, 0x00, 0x69, 0x00, 0x00, 0x00]);
 * const text = decodeUTF32(utf32LEBuffer, true);
 * console.log(text); // "Hi"
 * ```
 */
function decodeUTF32(buf, littleEndian) {
    if (buf.length < 4)
        return '';
    const usable = buf.length - (buf.length % 4);
    let out = '';
    for (let i = 0; i < usable; i += 4) {
        const cp = littleEndian
            ? (buf[i] |
                (buf[i + 1] << 8) |
                (buf[i + 2] << 16) |
                (buf[i + 3] << 24)) >>>
                0
            : (buf[i + 3] |
                (buf[i + 2] << 8) |
                (buf[i + 1] << 16) |
                (buf[i] << 24)) >>>
                0;
        // Valid planes: 0x0000..0x10FFFF excluding surrogates
        if (cp <= 0x10ffff && !(cp >= 0xd800 && cp <= 0xdfff)) {
            out += String.fromCodePoint(cp);
        }
        else {
            out += '\uFFFD';
        }
    }
    return out;
}
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
export async function readFileWithEncoding(filePath) {
    // Read the file once; detect BOM and decode from the single buffer.
    const full = await fs.promises.readFile(filePath);
    if (full.length === 0)
        return '';
    const bom = detectBOM(full);
    if (!bom) {
        // No BOM → treat as UTF‑8
        return full.toString('utf8');
    }
    // Strip BOM and decode per encoding
    const content = full.subarray(bom.bomLength);
    switch (bom.encoding) {
        case 'utf8':
            return content.toString('utf8');
        case 'utf16le':
            return content.toString('utf16le');
        case 'utf16be':
            return decodeUTF16BE(content);
        case 'utf32le':
            return decodeUTF32(content, true);
        case 'utf32be':
            return decodeUTF32(content, false);
        default:
            // Defensive fallback; should be unreachable
            return content.toString('utf8');
    }
}
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
export function getSpecificMimeType(filePath) {
    const lookedUpMime = mime.getType(filePath);
    return typeof lookedUpMime === 'string' ? lookedUpMime : undefined;
}
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
export function isWithinRoot(pathToCheck, rootDirectory) {
    const normalizedPathToCheck = path.resolve(pathToCheck);
    const normalizedRootDirectory = path.resolve(rootDirectory);
    // Ensure the rootDirectory path ends with a separator for correct startsWith comparison,
    // unless it's the root path itself (e.g., '/' or 'C:\').
    const rootWithSeparator = normalizedRootDirectory === path.sep ||
        normalizedRootDirectory.endsWith(path.sep)
        ? normalizedRootDirectory
        : normalizedRootDirectory + path.sep;
    return (normalizedPathToCheck === normalizedRootDirectory ||
        normalizedPathToCheck.startsWith(rootWithSeparator));
}
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
export async function isBinaryFile(filePath) {
    let fh = null;
    try {
        fh = await fs.promises.open(filePath, 'r');
        const stats = await fh.stat();
        const fileSize = stats.size;
        if (fileSize === 0)
            return false; // empty is not binary
        // Sample up to 4KB from the head (previous behavior)
        const sampleSize = Math.min(4096, fileSize);
        const buf = Buffer.alloc(sampleSize);
        const { bytesRead } = await fh.read(buf, 0, sampleSize, 0);
        if (bytesRead === 0)
            return false;
        // BOM → text (avoid false positives for UTF‑16/32 with nulls)
        const bom = detectBOM(buf.subarray(0, Math.min(4, bytesRead)));
        if (bom)
            return false;
        let nonPrintableCount = 0;
        for (let i = 0; i < bytesRead; i++) {
            if (buf[i] === 0)
                return true; // strong indicator of binary when no BOM
            if (buf[i] < 9 || (buf[i] > 13 && buf[i] < 32)) {
                nonPrintableCount++;
            }
        }
        // If >30% non-printable characters, consider it binary
        return nonPrintableCount / bytesRead > 0.3;
    }
    catch (error) {
        console.warn(`Failed to check if file is binary: ${filePath}`, error instanceof Error ? error.message : String(error));
        return false;
    }
    finally {
        if (fh) {
            try {
                await fh.close();
            }
            catch (closeError) {
                console.warn(`Failed to close file handle for: ${filePath}`, closeError instanceof Error ? closeError.message : String(closeError));
            }
        }
    }
}
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
export async function detectFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    // The mimetype for various TypeScript extensions (ts, mts, cts, tsx) can be
    // MPEG transport stream (a video format), but we want to assume these are
    // TypeScript files instead.
    if (['.ts', '.mts', '.cts'].includes(ext)) {
        return 'text';
    }
    if (ext === '.svg') {
        return 'svg';
    }
    const lookedUpMimeType = mime.getType(filePath); // Returns null if not found, or the mime type string
    if (lookedUpMimeType) {
        if (lookedUpMimeType.startsWith('image/')) {
            return 'image';
        }
        if (lookedUpMimeType.startsWith('audio/')) {
            return 'audio';
        }
        if (lookedUpMimeType.startsWith('video/')) {
            return 'video';
        }
        if (lookedUpMimeType === 'application/pdf') {
            return 'pdf';
        }
    }
    // Stricter binary check for common non-text extensions before content check
    // These are often not well-covered by mime-types or might be misidentified.
    if (BINARY_EXTENSIONS.includes(ext)) {
        return 'binary';
    }
    // Fall back to content-based check if mime type wasn't conclusive for image/pdf
    // and it's not a known binary extension.
    if (await isBinaryFile(filePath)) {
        return 'binary';
    }
    return 'text';
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
export async function processSingleFileContent(filePath, rootDirectory, fileSystemService, offset, limit) {
    try {
        if (!fs.existsSync(filePath)) {
            // Sync check is acceptable before async read
            return {
                llmContent: 'Could not read file because no file was found at the specified path.',
                returnDisplay: 'File not found.',
                error: `File not found: ${filePath}`,
                errorType: ToolErrorType.FILE_NOT_FOUND,
            };
        }
        const stats = await fs.promises.stat(filePath);
        if (stats.isDirectory()) {
            return {
                llmContent: 'Could not read file because the provided path is a directory, not a file.',
                returnDisplay: 'Path is a directory.',
                error: `Path is a directory, not a file: ${filePath}`,
                errorType: ToolErrorType.TARGET_IS_DIRECTORY,
            };
        }
        const fileSizeInMB = stats.size / (1024 * 1024);
        if (fileSizeInMB > 20) {
            return {
                llmContent: 'File size exceeds the 20MB limit.',
                returnDisplay: 'File size exceeds the 20MB limit.',
                error: `File size exceeds the 20MB limit: ${filePath} (${fileSizeInMB.toFixed(2)}MB)`,
                errorType: ToolErrorType.FILE_TOO_LARGE,
            };
        }
        const fileType = await detectFileType(filePath);
        const relativePathForDisplay = path
            .relative(rootDirectory, filePath)
            .replace(/\\/g, '/');
        switch (fileType) {
            case 'binary': {
                return {
                    llmContent: `Cannot display content of binary file: ${relativePathForDisplay}`,
                    returnDisplay: `Skipped binary file: ${relativePathForDisplay}`,
                };
            }
            case 'svg': {
                const SVG_MAX_SIZE_BYTES = 1 * 1024 * 1024;
                if (stats.size > SVG_MAX_SIZE_BYTES) {
                    return {
                        llmContent: `Cannot display content of SVG file larger than 1MB: ${relativePathForDisplay}`,
                        returnDisplay: `Skipped large SVG file (>1MB): ${relativePathForDisplay}`,
                    };
                }
                const content = await readFileWithEncoding(filePath);
                return {
                    llmContent: content,
                    returnDisplay: `Read SVG as text: ${relativePathForDisplay}`,
                };
            }
            case 'text': {
                // Use BOM-aware reader to avoid leaving a BOM character in content and to support UTF-16/32 transparently
                const content = await readFileWithEncoding(filePath);
                const lines = content.split('\n');
                const originalLineCount = lines.length;
                const startLine = offset || 0;
                const effectiveLimit = limit === undefined ? DEFAULT_MAX_LINES_TEXT_FILE : limit;
                // Ensure endLine does not exceed originalLineCount
                const endLine = Math.min(startLine + effectiveLimit, originalLineCount);
                // Ensure selectedLines doesn't try to slice beyond array bounds if startLine is too high
                const actualStartLine = Math.min(startLine, originalLineCount);
                const selectedLines = lines.slice(actualStartLine, endLine);
                let linesWereTruncatedInLength = false;
                const formattedLines = selectedLines.map((line) => {
                    if (line.length > MAX_LINE_LENGTH_TEXT_FILE) {
                        linesWereTruncatedInLength = true;
                        return (line.substring(0, MAX_LINE_LENGTH_TEXT_FILE) + '... [truncated]');
                    }
                    return line;
                });
                const contentRangeTruncated = startLine > 0 || endLine < originalLineCount;
                const isTruncated = contentRangeTruncated || linesWereTruncatedInLength;
                const llmContent = formattedLines.join('\n');
                // By default, return nothing to streamline the common case of a successful read_file.
                let returnDisplay = '';
                if (contentRangeTruncated) {
                    returnDisplay = `Read lines ${actualStartLine + 1}-${endLine} of ${originalLineCount} from ${relativePathForDisplay}`;
                    if (linesWereTruncatedInLength) {
                        returnDisplay += ' (some lines were shortened)';
                    }
                }
                else if (linesWereTruncatedInLength) {
                    returnDisplay = `Read all ${originalLineCount} lines from ${relativePathForDisplay} (some lines were shortened)`;
                }
                return {
                    llmContent,
                    returnDisplay,
                    isTruncated,
                    originalLineCount,
                    linesShown: [actualStartLine + 1, endLine],
                };
            }
            case 'image':
            case 'pdf':
            case 'audio':
            case 'video': {
                const contentBuffer = await fs.promises.readFile(filePath);
                const base64Data = contentBuffer.toString('base64');
                return {
                    llmContent: {
                        inlineData: {
                            data: base64Data,
                            mimeType: mime.getType(filePath) || 'application/octet-stream',
                        },
                    },
                    returnDisplay: `Read ${fileType} file: ${relativePathForDisplay}`,
                };
            }
            default: {
                // Should not happen with current detectFileType logic
                const exhaustiveCheck = fileType;
                return {
                    llmContent: `Unhandled file type: ${exhaustiveCheck}`,
                    returnDisplay: `Skipped unhandled file type: ${relativePathForDisplay}`,
                    error: `Unhandled file type for ${filePath}`,
                };
            }
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const displayPath = path
            .relative(rootDirectory, filePath)
            .replace(/\\/g, '/');
        return {
            llmContent: `Error reading file ${displayPath}: ${errorMessage}`,
            returnDisplay: `Error reading file ${displayPath}: ${errorMessage}`,
            error: `Error reading file ${filePath}: ${errorMessage}`,
            errorType: ToolErrorType.READ_CONTENT_FAILURE,
        };
    }
}
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
export async function fileExists(filePath) {
    try {
        await fsPromises.access(filePath, fs.constants.F_OK);
        return true;
    }
    catch (_) {
        return false;
    }
}
//# sourceMappingURL=fileUtils.js.map