/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Rate Limiting Middleware
 * Implements sophisticated rate limiting for Budget API endpoints
 * Supports per-user, per-IP, and global rate limiting with different strategies
 *
 * @author Claude Code - Budget Management API Endpoints Agent
 * @version 1.0.0
 */
import type { Request, Response, NextFunction } from 'express';
/**
 * Rate limit configuration interface
 */
interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    strategy: 'sliding' | 'fixed';
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyGenerator?: (req: Request) => string;
    onLimitReached?: (req: Request, res: Response) => void;
}
/**
 * Rate limit entry interface
 */
interface RateLimitEntry {
    requests: number;
    windowStart: number;
    lastRequest: number;
    blocked: boolean;
}
/**
 * In-memory rate limit store
 */
declare class RateLimitStore {
    private store;
    private cleanupInterval?;
    constructor();
    /**
     * Get rate limit entry for key
     */
    get(key: string): RateLimitEntry | undefined;
    /**
     * Set rate limit entry for key
     */
    set(key: string, entry: RateLimitEntry): void;
    /**
     * Increment request count for key
     */
    increment(key: string, windowMs: number): RateLimitEntry;
    /**
     * Clean up expired entries
     */
    private cleanup;
    /**
     * Get store statistics
     */
    getStats(): {
        totalKeys: number;
        memoryUsage: string;
    };
    /**
     * Clear all entries
     */
    clear(): void;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
/**
 * Rate limiting middleware factory
 */
export declare function rateLimitMiddleware(config?: Partial<RateLimitConfig>): (req: Request, res: Response, next: NextFunction) => void;
/**
 * User-specific rate limiting middleware
 */
export declare function userRateLimit(config?: Partial<RateLimitConfig>): (req: Request, res: Response, next: NextFunction) => void;
/**
 * IP-based rate limiting middleware
 */
export declare function ipRateLimit(config?: Partial<RateLimitConfig>): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Endpoint-specific rate limiting middleware
 */
export declare function endpointRateLimit(config?: Partial<RateLimitConfig>): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Global rate limiting middleware (applies to all requests)
 */
export declare function globalRateLimit(config?: Partial<RateLimitConfig>): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Burst protection middleware (short window, low limit)
 */
export declare function burstProtection(): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Generate default rate limit key
 */
declare function generateDefaultKey(req: Request): string;
/**
 * Set rate limit headers
 */
declare function setRateLimitHeaders(res: Response, config: RateLimitConfig, entry: RateLimitEntry): void;
/**
 * Rate limit bypass middleware for testing
 */
export declare function bypassRateLimit(req: Request, res: Response, next: NextFunction): void;
/**
 * Rate limit status endpoint middleware
 */
export declare function rateLimitStatus(req: Request, res: Response): void;
/**
 * Reset rate limits for testing
 */
export declare function resetRateLimits(): void;
/**
 * Export rate limiting utilities
 */
export declare const rateLimitUtils: {
    store: RateLimitStore;
    defaultConfigs: Record<string, RateLimitConfig>;
    generateDefaultKey: typeof generateDefaultKey;
    setRateLimitHeaders: typeof setRateLimitHeaders;
    resetRateLimits: typeof resetRateLimits;
};
export {};
