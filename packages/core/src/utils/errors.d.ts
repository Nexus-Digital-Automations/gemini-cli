/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Type guard to check if an error is a Node.js errno exception.
 * Node.js errno exceptions have a 'code' property that indicates the type of system error.
 *
 * @param error - The error object to check
 * @returns True if the error is a NodeJS.ErrnoException, false otherwise
 *
 * @example
 * ```typescript
 * try {
 *   fs.readFileSync('nonexistent.txt');
 * } catch (error) {
 *   if (isNodeError(error) && error.code === 'ENOENT') {
 *     console.log('File not found');
 *   }
 * }
 * ```
 */
export declare function isNodeError(error: unknown): error is NodeJS.ErrnoException;
/**
 * Safely extracts a human-readable error message from any error object.
 * Handles various error types and provides fallback for non-Error objects.
 *
 * @param error - The error object to extract a message from
 * @returns A string representation of the error message
 *
 * @example
 * ```typescript
 * try {
 *   throw new Error('Something went wrong');
 * } catch (error) {
 *   console.log(getErrorMessage(error)); // 'Something went wrong'
 * }
 *
 * console.log(getErrorMessage('string error')); // 'string error'
 * console.log(getErrorMessage(null)); // 'null'
 * ```
 */
export declare function getErrorMessage(error: unknown): string;
/**
 * Base class for fatal errors that should cause the application to exit.
 * These errors represent unrecoverable conditions that prevent the application from continuing.
 *
 * @example
 * ```typescript
 * throw new FatalError('Critical system failure', 1);
 * ```
 */
export declare class FatalError extends Error {
    readonly exitCode: number;
    /**
     * Creates a new FatalError instance.
     *
     * @param message - The error message describing what went wrong
     * @param exitCode - The exit code that should be used when the process terminates
     */
    constructor(message: string, exitCode: number);
}
/**
 * Fatal error for authentication failures that prevent the application from functioning.
 * Uses exit code 41 to indicate authentication-related failures.
 *
 * @example
 * ```typescript
 * throw new FatalAuthenticationError('Invalid API key provided');
 * ```
 */
export declare class FatalAuthenticationError extends FatalError {
    /**
     * Creates a new FatalAuthenticationError instance.
     *
     * @param message - The error message describing the authentication failure
     */
    constructor(message: string);
}
/**
 * Fatal error for invalid input that prevents the application from proceeding.
 * Uses exit code 42 to indicate input validation failures.
 *
 * @example
 * ```typescript
 * throw new FatalInputError('Required configuration file not found');
 * ```
 */
export declare class FatalInputError extends FatalError {
    /**
     * Creates a new FatalInputError instance.
     *
     * @param message - The error message describing the input validation failure
     */
    constructor(message: string);
}
/**
 * Fatal error for sandbox environment failures that prevent secure execution.
 * Uses exit code 44 to indicate sandbox-related failures.
 *
 * @example
 * ```typescript
 * throw new FatalSandboxError('Failed to initialize secure execution environment');
 * ```
 */
export declare class FatalSandboxError extends FatalError {
    /**
     * Creates a new FatalSandboxError instance.
     *
     * @param message - The error message describing the sandbox failure
     */
    constructor(message: string);
}
/**
 * Fatal error for configuration problems that prevent the application from starting.
 * Uses exit code 52 to indicate configuration-related failures.
 *
 * @example
 * ```typescript
 * throw new FatalConfigError('Invalid configuration file format');
 * ```
 */
export declare class FatalConfigError extends FatalError {
    /**
     * Creates a new FatalConfigError instance.
     *
     * @param message - The error message describing the configuration failure
     */
    constructor(message: string);
}
/**
 * Fatal error for when conversation turn limits are exceeded.
 * Uses exit code 53 to indicate turn limit violations.
 *
 * @example
 * ```typescript
 * throw new FatalTurnLimitedError('Maximum conversation turns exceeded');
 * ```
 */
export declare class FatalTurnLimitedError extends FatalError {
    /**
     * Creates a new FatalTurnLimitedError instance.
     *
     * @param message - The error message describing the turn limit violation
     */
    constructor(message: string);
}
/**
 * Fatal error for tool execution failures that cannot be recovered from.
 * Uses exit code 54 to indicate tool execution failures.
 *
 * @example
 * ```typescript
 * throw new FatalToolExecutionError('Critical tool execution failure');
 * ```
 */
export declare class FatalToolExecutionError extends FatalError {
    /**
     * Creates a new FatalToolExecutionError instance.
     *
     * @param message - The error message describing the tool execution failure
     */
    constructor(message: string);
}
/**
 * Fatal error for operation cancellations (e.g., user interruption via Ctrl+C).
 * Uses exit code 130, which is the standard exit code for SIGINT (interrupt signal).
 *
 * @example
 * ```typescript
 * throw new FatalCancellationError('Operation cancelled by user');
 * ```
 */
export declare class FatalCancellationError extends FatalError {
    /**
     * Creates a new FatalCancellationError instance.
     *
     * @param message - The error message describing the cancellation
     */
    constructor(message: string);
}
/**
 * Error for HTTP 403 Forbidden responses.
 * Indicates that the server understood the request but refuses to authorize it.
 *
 * @example
 * ```typescript
 * throw new ForbiddenError('Access denied to this resource');
 * ```
 */
export declare class ForbiddenError extends Error {
}
/**
 * Error for HTTP 401 Unauthorized responses.
 * Indicates that the request has not been applied because it lacks valid authentication credentials.
 *
 * @example
 * ```typescript
 * throw new UnauthorizedError('Authentication required');
 * ```
 */
export declare class UnauthorizedError extends Error {
}
/**
 * Error for HTTP 400 Bad Request responses.
 * Indicates that the server cannot or will not process the request due to client error.
 *
 * @example
 * ```typescript
 * throw new BadRequestError('Invalid request parameters');
 * ```
 */
export declare class BadRequestError extends Error {
}
/**
 * Converts HTTP errors to user-friendly error types based on status codes.
 * Transforms generic HTTP errors into specific error classes that provide better context.
 *
 * @param error - The original error object to transform
 * @returns A user-friendly error instance or the original error if no transformation is needed
 *
 * @example
 * ```typescript
 * try {
 *   await apiCall();
 * } catch (error) {
 *   const friendlyError = toFriendlyError(error);
 *   if (friendlyError instanceof UnauthorizedError) {
 *     console.log('Please check your authentication credentials');
 *   }
 * }
 * ```
 */
export declare function toFriendlyError(error: unknown): unknown;
