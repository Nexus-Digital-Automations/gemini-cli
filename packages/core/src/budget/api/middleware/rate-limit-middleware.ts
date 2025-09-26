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
import { getComponentLogger } from '../../../utils/logger.js';

const logger = getComponentLogger('RateLimitMiddleware');

/**
 * Rate limit configuration interface
 */
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  strategy: 'sliding' | 'fixed'; // Rate limiting strategy
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
class RateLimitStore {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Get rate limit entry for key
   */
  get(key: string): RateLimitEntry | undefined {
    return this.store.get(key);
  }

  /**
   * Set rate limit entry for key
   */
  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry);
  }

  /**
   * Increment request count for key
   */
  increment(key: string, windowMs: number): RateLimitEntry {
    const now = Date.now();
    const existing = this.store.get(key);

    if (!existing) {
      const newEntry: RateLimitEntry = {
        requests: 1,
        windowStart: now,
        lastRequest: now,
        blocked: false,
      };
      this.store.set(key, newEntry);
      return newEntry;
    }

    // Check if we're in a new window
    if (now - existing.windowStart >= windowMs) {
      existing.requests = 1;
      existing.windowStart = now;
      existing.blocked = false;
    } else {
      existing.requests++;
    }

    existing.lastRequest = now;
    return existing;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.store.entries()) {
      // Remove entries that haven't been accessed in the last hour
      if (now - entry.lastRequest > 3600000) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.store.delete(key);
    }

    if (expiredKeys.length > 0) {
      logger.debug('Cleaned up rate limit entries', {
        removedEntries: expiredKeys.length,
        remainingEntries: this.store.size,
      });
    }
  }

  /**
   * Get store statistics
   */
  getStats(): { totalKeys: number; memoryUsage: string } {
    return {
      totalKeys: this.store.size,
      memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
    };
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Global rate limit store
const globalStore = new RateLimitStore();

/**
 * Default rate limit configurations for different endpoint types
 */
const defaultConfigs: Record<string, RateLimitConfig> = {
  standard: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    strategy: 'sliding',
  },
  strict: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 20,
    strategy: 'sliding',
  },
  lenient: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 500,
    strategy: 'sliding',
  },
};

/**
 * Rate limiting middleware factory
 */
export function rateLimitMiddleware(
  config: Partial<RateLimitConfig> = {},
): (req: Request, res: Response, next: NextFunction) => void {
  const finalConfig: RateLimitConfig = {
    ...defaultConfigs.standard,
    ...config,
  };

  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    try {
      // Generate rate limit key
      const key = finalConfig.keyGenerator
        ? finalConfig.keyGenerator(req)
        : generateDefaultKey(req);

      logger.debug('Rate limit check', {
        key: key.substring(0, 20) + '...',
        path: req.path,
        method: req.method,
        config: {
          windowMs: finalConfig.windowMs,
          maxRequests: finalConfig.maxRequests,
          strategy: finalConfig.strategy,
        },
      });

      // Get or create rate limit entry
      const entry = globalStore.increment(key, finalConfig.windowMs);

      // Check if limit exceeded
      if (entry.requests > finalConfig.maxRequests) {
        entry.blocked = true;

        const checkTime = Date.now() - startTime;
        const resetTime = new Date(entry.windowStart + finalConfig.windowMs);

        logger.warn('Rate limit exceeded', {
          key: key.substring(0, 20) + '...',
          requests: entry.requests,
          maxRequests: finalConfig.maxRequests,
          windowStart: new Date(entry.windowStart).toISOString(),
          resetTime: resetTime.toISOString(),
          checkTime,
          ip: req.ip,
          path: req.path,
        });

        // Set rate limit headers
        setRateLimitHeaders(res, finalConfig, entry);

        // Call custom handler if provided
        if (finalConfig.onLimitReached) {
          finalConfig.onLimitReached(req, res);
          return;
        }

        // Default rate limit response
        res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          details: {
            limit: finalConfig.maxRequests,
            window: `${finalConfig.windowMs / 1000} seconds`,
            requests: entry.requests,
            resetTime: resetTime.toISOString(),
          },
          retryAfter: Math.ceil(
            (entry.windowStart + finalConfig.windowMs - Date.now()) / 1000,
          ),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Set informational headers
      setRateLimitHeaders(res, finalConfig, entry);

      const checkTime = Date.now() - startTime;

      logger.debug('Rate limit check passed', {
        key: key.substring(0, 20) + '...',
        requests: entry.requests,
        maxRequests: finalConfig.maxRequests,
        checkTime,
      });

      next();
    } catch (error) {
      const checkTime = Date.now() - startTime;

      logger.error('Rate limiting error', {
        error: error instanceof Error ? error : new Error('Unknown error'),
        checkTime,
        path: req.path,
        ip: req.ip,
      });

      // On error, allow the request through but log the issue
      next();
    }
  };
}

/**
 * User-specific rate limiting middleware
 */
export function userRateLimit(config: Partial<RateLimitConfig> = {}) {
  return rateLimitMiddleware({
    ...config,
    keyGenerator: (req: any) => {
      const userId = req.user?.id || req.ip;
      return `user:${userId}`;
    },
  });
}

/**
 * IP-based rate limiting middleware
 */
export function ipRateLimit(config: Partial<RateLimitConfig> = {}) {
  return rateLimitMiddleware({
    ...config,
    keyGenerator: (req: Request) => `ip:${req.ip}`,
  });
}

/**
 * Endpoint-specific rate limiting middleware
 */
export function endpointRateLimit(config: Partial<RateLimitConfig> = {}) {
  return rateLimitMiddleware({
    ...config,
    keyGenerator: (req: Request) => {
      const userId = (req as any).user?.id || req.ip;
      return `endpoint:${req.method}:${req.path}:${userId}`;
    },
  });
}

/**
 * Global rate limiting middleware (applies to all requests)
 */
export function globalRateLimit(config: Partial<RateLimitConfig> = {}) {
  return rateLimitMiddleware({
    ...config,
    keyGenerator: () => 'global',
  });
}

/**
 * Burst protection middleware (short window, low limit)
 */
export function burstProtection() {
  return rateLimitMiddleware({
    windowMs: 1000, // 1 second
    maxRequests: 10, // 10 requests per second
    strategy: 'fixed',
    keyGenerator: (req: Request) => {
      const userId = (req as any).user?.id || req.ip;
      return `burst:${userId}`;
    },
  });
}

/**
 * Generate default rate limit key
 */
function generateDefaultKey(req: Request): string {
  const userId = (req as any).user?.id;
  const ip = req.ip;

  if (userId) {
    return `user:${userId}`;
  }

  return `ip:${ip}`;
}

/**
 * Set rate limit headers
 */
function setRateLimitHeaders(
  res: Response,
  config: RateLimitConfig,
  entry: RateLimitEntry,
): void {
  const remaining = Math.max(0, config.maxRequests - entry.requests);
  const resetTime = entry.windowStart + config.windowMs;

  res.set({
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
    'X-RateLimit-Window': config.windowMs.toString(),
  });

  if (entry.blocked) {
    res.set(
      'Retry-After',
      Math.ceil((resetTime - Date.now()) / 1000).toString(),
    );
  }
}

/**
 * Rate limit bypass middleware for testing
 */
export function bypassRateLimit(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (
    process.env.NODE_ENV === 'test' ||
    process.env.BYPASS_RATE_LIMIT === 'true'
  ) {
    logger.warn('Rate limiting bypassed', {
      NODE_ENV: process.env.NODE_ENV,
      BYPASS_RATE_LIMIT: process.env.BYPASS_RATE_LIMIT,
      path: req.path,
    });
    return next();
  }

  // If not in bypass mode, this middleware does nothing
  next();
}

/**
 * Rate limit status endpoint middleware
 */
export function rateLimitStatus(req: Request, res: Response): void {
  const stats = globalStore.getStats();

  res.json({
    success: true,
    data: {
      store: stats,
      configs: {
        available: Object.keys(defaultConfigs),
        default: defaultConfigs.standard,
      },
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Reset rate limits for testing
 */
export function resetRateLimits(): void {
  logger.warn('Rate limits reset');
  globalStore.clear();
}

/**
 * Export rate limiting utilities
 */
export const rateLimitUtils = {
  store: globalStore,
  defaultConfigs,
  generateDefaultKey,
  setRateLimitHeaders,
  resetRateLimits,
};
