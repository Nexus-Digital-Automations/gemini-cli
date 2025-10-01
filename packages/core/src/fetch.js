/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { getErrorMessage, isNodeError } from './errors.js';
import { URL } from 'node:url';
/**
 * Regular expressions for detecting private IP address ranges.
 * Used for security validation to prevent requests to internal network resources.
 *
 * Includes IPv4 private ranges:
 * - 10.0.0.0/8 (Class A private)
 * - 127.0.0.0/8 (Loopback)
 * - 172.16.0.0/12 (Class B private)
 * - 192.168.0.0/16 (Class C private)
 *
 * And IPv6 private ranges:
 * - ::1 (Loopback)
 * - fc00::/7 (Unique local)
 * - fe80::/10 (Link-local)
 */
const PRIVATE_IP_RANGES = [
    /^10\./,
    /^127\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^::1$/,
    /^fc00:/,
    /^fe80:/,
];
/**
 * Custom error class for HTTP fetch operations.
 * Extends the standard Error class with an optional error code for better error handling.
 *
 * @example
 * ```typescript
 * throw new FetchError('Request failed', 'NETWORK_ERROR');
 * ```
 */
export class FetchError extends Error {
    code;
    /**
     * Creates a new FetchError instance.
     *
     * @param message - Human-readable error description
     * @param code - Optional error code for programmatic error handling
     */
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'FetchError';
    }
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
export function isPrivateIp(url) {
    try {
        const hostname = new URL(url).hostname;
        return PRIVATE_IP_RANGES.some((range) => range.test(hostname));
    }
    catch (_e) {
        return false;
    }
}
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
export async function fetchWithTimeout(url, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { signal: controller.signal });
        return response;
    }
    catch (error) {
        if (isNodeError(error) && error.code === 'ABORT_ERR') {
            throw new FetchError(`Request timed out after ${timeout}ms`, 'ETIMEDOUT');
        }
        throw new FetchError(getErrorMessage(error));
    }
    finally {
        clearTimeout(timeoutId);
    }
}
//# sourceMappingURL=fetch.js.map