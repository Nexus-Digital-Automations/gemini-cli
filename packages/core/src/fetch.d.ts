/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Custom error class for HTTP fetch operations.
 * Extends the standard Error class with an optional error code for better error handling.
 *
 * @example
 * ```typescript
 * throw new FetchError('Request failed', 'NETWORK_ERROR');
 * ```
 */
export declare class FetchError extends Error {
    code?: string;
    /**
     * Creates a new FetchError instance.
     *
     * @param message - Human-readable error description
     * @param code - Optional error code for programmatic error handling
     */
    constructor(message: string, code?: string);
}
/**
 * Checks if a URL points to a private IP address or localhost.
 *
 * This function is used for security validation to prevent Server-Side Request
 * Forgery (SSRF) attacks by blocking requests to internal network resources.
 * It extracts the hostname from the URL and tests it against known private IP ranges.
 *
 * @param url - The URL to check (must be a valid URL string)
 * @returns True if the URL points to a private IP address, false otherwise
 *
 * @example
 * ```typescript
 * console.log(isPrivateIp('http://10.0.0.1/api')); // true (private)
 * console.log(isPrivateIp('http://google.com')); // false (public)
 * console.log(isPrivateIp('http://127.0.0.1:8080')); // true (localhost)
 * console.log(isPrivateIp('invalid-url')); // false (invalid URL)
 * ```
 */
export declare function isPrivateIp(url: string): boolean;
/**
 * Performs an HTTP fetch request with a specified timeout.
 *
 * This function wraps the standard fetch API to add timeout functionality using
 * AbortController. If the request doesn't complete within the specified timeout,
 * it will be aborted and a FetchError with code 'ETIMEDOUT' will be thrown.
 *
 * @param url - The URL to fetch
 * @param timeout - Timeout in milliseconds
 * @returns Promise resolving to the Response object
 * @throws {FetchError} When the request times out or encounters other errors
 *
 * @example
 * ```typescript
 * try {
 *   const response = await fetchWithTimeout('https://api.example.com/data', 5000);
 *   const data = await response.json();
 *   console.log(data);
 * } catch (error) {
 *   if (error instanceof FetchError && error.code === 'ETIMEDOUT') {
 *     console.log('Request timed out');
 *   } else {
 *     console.log('Other error:', error.message);
 *   }
 * }
 * ```
 */
export declare function fetchWithTimeout(url: string, timeout: number): Promise<Response>;
