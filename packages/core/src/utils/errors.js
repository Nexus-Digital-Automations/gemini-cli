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
export function isNodeError(error) {
    return error instanceof Error && 'code' in error;
}
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
export function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    try {
        return String(error);
    }
    catch {
        return 'Failed to get error details';
    }
}
/**
 * Base class for fatal errors that should cause the application to exit.
 * These errors represent unrecoverable conditions that prevent the application from continuing.
 *
 * @example
 * ```typescript
 * throw new FatalError('Critical system failure', 1);
 * ```
 */
export class FatalError extends Error {
    exitCode;
    /**
     * Creates a new FatalError instance.
     *
     * @param message - The error message describing what went wrong
     * @param exitCode - The exit code that should be used when the process terminates
     */
    constructor(message, exitCode) {
        super(message);
        this.exitCode = exitCode;
    }
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
export class FatalAuthenticationError extends FatalError {
    /**
     * Creates a new FatalAuthenticationError instance.
     *
     * @param message - The error message describing the authentication failure
     */
    constructor(message) {
        super(message, 41);
    }
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
export class FatalInputError extends FatalError {
    /**
     * Creates a new FatalInputError instance.
     *
     * @param message - The error message describing the input validation failure
     */
    constructor(message) {
        super(message, 42);
    }
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
export class FatalSandboxError extends FatalError {
    /**
     * Creates a new FatalSandboxError instance.
     *
     * @param message - The error message describing the sandbox failure
     */
    constructor(message) {
        super(message, 44);
    }
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
export class FatalConfigError extends FatalError {
    /**
     * Creates a new FatalConfigError instance.
     *
     * @param message - The error message describing the configuration failure
     */
    constructor(message) {
        super(message, 52);
    }
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
export class FatalTurnLimitedError extends FatalError {
    /**
     * Creates a new FatalTurnLimitedError instance.
     *
     * @param message - The error message describing the turn limit violation
     */
    constructor(message) {
        super(message, 53);
    }
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
export class FatalToolExecutionError extends FatalError {
    /**
     * Creates a new FatalToolExecutionError instance.
     *
     * @param message - The error message describing the tool execution failure
     */
    constructor(message) {
        super(message, 54);
    }
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
export class FatalCancellationError extends FatalError {
    /**
     * Creates a new FatalCancellationError instance.
     *
     * @param message - The error message describing the cancellation
     */
    constructor(message) {
        super(message, 130); // Standard exit code for SIGINT
    }
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
export class ForbiddenError extends Error {
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
export class UnauthorizedError extends Error {
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
export class BadRequestError extends Error {
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
export function toFriendlyError(error) {
    if (error && typeof error === 'object' && 'response' in error) {
        const gaxiosError = error;
        const data = parseResponseData(gaxiosError);
        if (data.error && data.error.message && data.error.code) {
            switch (data.error.code) {
                case 400:
                    return new BadRequestError(data.error.message);
                case 401:
                    return new UnauthorizedError(data.error.message);
                case 403:
                    // It's important to pass the message here since it might
                    // explain the cause like "the cloud project you're
                    // using doesn't have code assist enabled".
                    return new ForbiddenError(data.error.message);
                default:
            }
        }
    }
    return error;
}
/**
 * Parses response data from a Gaxios error, handling both JSON objects and stringified JSON.
 * Gaxios sometimes returns response data as a string that needs to be parsed.
 *
 * @param error - The Gaxios error object containing response data
 * @returns Parsed response data with error information
 *
 * @throws Will throw an error if the JSON parsing fails for stringified response data
 */
function parseResponseData(error) {
    // Inexplicably, Gaxios sometimes doesn't JSONify the response data.
    if (typeof error.response?.data === 'string') {
        return JSON.parse(error.response?.data);
    }
    return error.response?.data;
}
//# sourceMappingURL=errors.js.map