/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Quota management and rate limiting system
 * Provides comprehensive quota tracking, rate limiting, and usage control
 *
 * @author Claude Code - Real-Time Token Usage Monitoring Agent
 * @version 1.0.0
 */
import { EventEmitter } from 'node:events';
import { getComponentLogger } from '../../utils/logger.js';
/**
 * Token bucket for rate limiting
 */
class TokenBucket {
  maxTokens;
  refillRate;
  tokens;
  lastRefill;
  constructor(maxTokens, refillRate) {
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }
  /**
   * Try to consume tokens from bucket
   */
  consume(tokensRequested = 1) {
    this.refill();
    if (this.tokens >= tokensRequested) {
      this.tokens -= tokensRequested;
      return true;
    }
    return false;
  }
  /**
   * Get current token count
   */
  getTokenCount() {
    this.refill();
    return this.tokens;
  }
  /**
   * Refill tokens based on elapsed time
   */
  refill() {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000; // seconds
    const tokensToAdd = timePassed * this.refillRate;
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}
/**
 * Sliding window rate limiter
 */
class SlidingWindowLimiter {
  maxRequests;
  windowMs;
  requests = [];
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  /**
   * Check if request is allowed
   */
  isAllowed() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    // Remove old requests
    this.requests = this.requests.filter((time) => time > windowStart);
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    return false;
  }
  /**
   * Get current request count in window
   */
  getCurrentCount() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    this.requests = this.requests.filter((time) => time > windowStart);
    return this.requests.length;
  }
}
/**
 * Comprehensive quota management and rate limiting system
 *
 * This class provides advanced quota management capabilities including
 * multiple rate limiting strategies, dynamic quota adjustment, violation
 * tracking, and intelligent throttling. It integrates with the budget
 * system to enforce spending limits and usage controls.
 *
 * Features:
 * - Multiple rate limiting strategies (token bucket, sliding window, etc.)
 * - Dynamic quota limits based on usage patterns
 * - Intelligent throttling with backoff strategies
 * - Quota violation tracking and recovery
 * - Integration with budget enforcement
 * - Real-time usage monitoring and alerts
 */
export class QuotaManager extends EventEmitter {
  logger = getComponentLogger('QuotaManager');
  config;
  quotaLimits = new Map();
  quotaUsage = new Map();
  rateLimiters = new Map();
  violations = new Map();
  throttleActive = false;
  currentThrottleDelay = 0;
  constructor(config = {}) {
    super();
    this.config = {
      defaultLimits: config.defaultLimits ?? this.getDefaultLimits(),
      rateLimitConfig:
        config.rateLimitConfig ?? this.getDefaultRateLimitConfig(),
      throttleConfig: config.throttleConfig ?? this.getDefaultThrottleConfig(),
      enableAutoAdjustment: config.enableAutoAdjustment ?? true,
      gracePeriodMs: config.gracePeriodMs ?? 60000, // 1 minute
      enableViolationLogging: config.enableViolationLogging ?? true,
    };
    this.initializeQuotaLimits();
    this.initializeRateLimiters();
    this.logger.info('QuotaManager initialized', {
      limitsCount: this.quotaLimits.size,
      rateLimitConfig: this.config.rateLimitConfig,
      enableAutoAdjustment: this.config.enableAutoAdjustment,
    });
  }
  /**
   * Check if a request is allowed based on all quota limits
   */
  async checkRequestAllowed(requestType, value, context) {
    try {
      // Check rate limits first
      const rateLimitResult = this.checkRateLimit(requestType, context);
      if (!rateLimitResult.allowed) {
        return rateLimitResult;
      }
      // Check quota limits
      for (const [limitId, limit] of this.quotaLimits.entries()) {
        if (!limit.enabled) continue;
        const quotaResult = await this.checkQuotaLimit(
          limitId,
          requestType,
          value,
        );
        if (!quotaResult.allowed) {
          await this.handleQuotaViolation(limitId, limit, quotaResult);
          return quotaResult;
        }
      }
      // Apply throttling if active
      if (this.throttleActive) {
        const throttleResult = this.applyThrottling();
        if (!throttleResult.allowed) {
          return throttleResult;
        }
      }
      return {
        allowed: true,
        currentUsage: value,
        limit: 0, // Would need to calculate aggregate limit
        usagePercentage: 0,
        message: 'Request allowed',
      };
    } catch (error) {
      this.logger.error('Failed to check request allowance', {
        requestType,
        value,
        context,
        error: error instanceof Error ? error.message : String(error),
      });
      // Fail open in case of errors
      return {
        allowed: true,
        currentUsage: value,
        limit: 0,
        usagePercentage: 0,
        message: 'Request allowed (error in quota check)',
      };
    }
  }
  /**
   * Record usage against quota limits
   */
  async recordUsage(requestType, value, context) {
    const timestamp = new Date();
    // Update quota usage for all applicable limits
    for (const [limitId, limit] of this.quotaLimits.entries()) {
      if (!limit.enabled) continue;
      if (this.isLimitApplicable(limit, requestType)) {
        await this.updateQuotaUsage(limitId, value, timestamp);
      }
    }
    // Emit usage event
    this.emitBudgetEvent('usage_updated', {
      requestType,
      value,
      context,
      timestamp: timestamp.toISOString(),
    });
    this.logger.debug('Usage recorded', {
      requestType,
      value,
      context,
    });
  }
  /**
   * Add or update a quota limit
   */
  addQuotaLimit(limit) {
    this.quotaLimits.set(limit.id, limit);
    // Initialize usage tracking for this limit
    this.initializeQuotaUsage(limit.id, limit);
    this.logger.info('Quota limit added', {
      limitId: limit.id,
      name: limit.name,
      type: limit.type,
      maxValue: limit.maxValue,
      windowMs: limit.windowMs,
    });
    this.emitBudgetEvent('settings_changed', {
      action: 'quota_limit_added',
      limitId: limit.id,
      limit,
    });
  }
  /**
   * Remove a quota limit
   */
  removeQuotaLimit(limitId) {
    const removed = this.quotaLimits.delete(limitId);
    if (removed) {
      this.quotaUsage.delete(limitId);
      this.violations.delete(limitId);
      this.logger.info('Quota limit removed', { limitId });
      this.emitBudgetEvent('settings_changed', {
        action: 'quota_limit_removed',
        limitId,
      });
    }
    return removed;
  }
  /**
   * Get current quota usage for all limits
   */
  getQuotaUsage() {
    const usage = {};
    for (const [limitId, quotaUsage] of this.quotaUsage.entries()) {
      usage[limitId] = { ...quotaUsage };
    }
    return usage;
  }
  /**
   * Get quota violations
   */
  getViolations() {
    return Array.from(this.violations.values());
  }
  /**
   * Reset quota usage for a specific limit
   */
  async resetQuotaUsage(limitId) {
    const limit = this.quotaLimits.get(limitId);
    if (!limit) return false;
    this.initializeQuotaUsage(limitId, limit);
    this.logger.info('Quota usage reset', { limitId });
    this.emitBudgetEvent('budget_reset', {
      limitId,
      resetTime: new Date().toISOString(),
    });
    return true;
  }
  /**
   * Enable or disable throttling
   */
  setThrottling(enabled, config) {
    this.throttleActive = enabled;
    if (config) {
      this.config.throttleConfig = { ...this.config.throttleConfig, ...config };
    }
    this.logger.info('Throttling updated', {
      enabled,
      config: this.config.throttleConfig,
    });
  }
  /**
   * Get current throttling status
   */
  getThrottlingStatus() {
    return {
      active: this.throttleActive,
      currentDelay: this.currentThrottleDelay,
      config: { ...this.config.throttleConfig },
    };
  }
  /**
   * Check rate limiting
   */
  checkRateLimit(requestType, context) {
    const key = `${requestType}:${context?.userId || 'global'}`;
    const limiter = this.rateLimiters.get(key);
    if (!limiter) {
      return {
        allowed: true,
        currentUsage: 0,
        limit: this.config.rateLimitConfig.maxRequests,
        usagePercentage: 0,
      };
    }
    if (limiter instanceof SlidingWindowLimiter) {
      const allowed = limiter.isAllowed();
      const currentCount = limiter.getCurrentCount();
      const limit = this.config.rateLimitConfig.maxRequests;
      return {
        allowed,
        currentUsage: currentCount,
        limit,
        usagePercentage: (currentCount / limit) * 100,
        message: allowed ? 'Rate limit OK' : 'Rate limit exceeded',
      };
    } else if (limiter instanceof TokenBucket) {
      const allowed = limiter.consume(1);
      const currentTokens = limiter.getTokenCount();
      const limit = this.config.rateLimitConfig.maxRequests;
      return {
        allowed,
        currentUsage: limit - currentTokens,
        limit,
        usagePercentage: ((limit - currentTokens) / limit) * 100,
        message: allowed ? 'Token bucket OK' : 'Token bucket exhausted',
      };
    }
    return {
      allowed: true,
      currentUsage: 0,
      limit: 0,
      usagePercentage: 0,
    };
  }
  /**
   * Check specific quota limit
   */
  async checkQuotaLimit(limitId, requestType, value) {
    const limit = this.quotaLimits.get(limitId);
    const usage = this.quotaUsage.get(limitId);
    if (!limit || !usage) {
      return {
        allowed: true,
        currentUsage: 0,
        limit: 0,
        usagePercentage: 0,
      };
    }
    // Update usage window if needed
    this.updateUsageWindow(limitId, limit);
    const newUsage = usage.currentUsage + value;
    const usagePercentage = (newUsage / limit.maxValue) * 100;
    const allowed = newUsage <= limit.maxValue;
    return {
      allowed,
      currentUsage: newUsage,
      limit: limit.maxValue,
      usagePercentage,
      message: allowed
        ? 'Quota limit OK'
        : `Quota limit exceeded for ${limit.name}`,
      recommendations: allowed
        ? []
        : [`Reduce usage or increase limit for ${limit.name}`],
    };
  }
  /**
   * Apply throttling logic
   */
  applyThrottling() {
    const config = this.config.throttleConfig;
    let delay = this.currentThrottleDelay;
    if (delay === 0) {
      delay = config.minDelay;
    } else {
      switch (config.backoffStrategy) {
        case 'linear':
          delay += config.minDelay;
          break;
        case 'exponential':
          delay *= 2;
          break;
        case 'random':
          delay =
            config.minDelay +
            Math.random() * (config.maxDelay - config.minDelay);
          break;
      }
        default:
          // Handle unexpected values
          break;
    }
    delay = Math.min(delay, config.maxDelay);
    this.currentThrottleDelay = delay;
    const shouldThrottle = Math.random() > config.factor;
    return {
      allowed: !shouldThrottle,
      currentUsage: delay,
      limit: config.maxDelay,
      usagePercentage: (delay / config.maxDelay) * 100,
      message: shouldThrottle
        ? `Throttled for ${delay}ms`
        : 'Throttling passed',
    };
  }
  /**
   * Handle quota violation
   */
  async handleQuotaViolation(limitId, limit, validation) {
    const usage = this.quotaUsage.get(limitId);
    if (!usage) return;
    const violation = {
      id: `${limitId}_${Date.now()}`,
      limit,
      usage,
      timestamp: new Date(),
      severity: validation.usagePercentage > 150 ? 'critical' : 'warning',
      actionTaken: limit.action,
    };
    this.violations.set(violation.id, violation);
    // Take action based on limit configuration
    switch (limit.action) {
      case 'block':
        // Request will be blocked (already handled by returning allowed: false)
        break;
      case 'throttle':
        this.setThrottling(true);
        break;
      case 'warn':
        this.logger.warn('Quota limit exceeded', violation);
        break;
      case 'log':
        this.logger.info('Quota limit exceeded', violation);
        break;
    }
    this.emitBudgetEvent('limit_exceeded', {
      violation,
      limitId,
      usage: usage.currentUsage,
      limit: limit.maxValue,
    });
      default:
        // Handle unexpected values
        break;
  }
  /**
   * Initialize default quota limits
   */
  initializeQuotaLimits() {
    for (const limit of this.config.defaultLimits) {
      this.quotaLimits.set(limit.id, limit);
      this.initializeQuotaUsage(limit.id, limit);
    }
  }
  /**
   * Initialize rate limiters
   */
  initializeRateLimiters() {
    const config = this.config.rateLimitConfig;
    // Create global rate limiter
    switch (config.strategy) {
      case 'sliding_window':
        this.rateLimiters.set(
          'global',
          new SlidingWindowLimiter(config.maxRequests, config.windowMs),
        );
        break;
      case 'token_bucket':
        const refillRate =
          config.recoveryRate || config.maxRequests / (config.windowMs / 1000);
        this.rateLimiters.set(
          'global',
          new TokenBucket(config.maxRequests, refillRate),
        );
        break;
      // Add other strategies as needed
    }
      default:
        // Handle unexpected values
        break;
  }
  /**
   * Initialize quota usage tracking
   */
  initializeQuotaUsage(limitId, limit) {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + limit.windowMs);
    this.quotaUsage.set(limitId, {
      limitId,
      currentUsage: 0,
      maxValue: limit.maxValue,
      usagePercentage: 0,
      windowStart: now,
      windowEnd,
      isExceeded: false,
      timeToReset: limit.windowMs,
      recentUsage: [],
    });
  }
  /**
   * Update quota usage for a limit
   */
  async updateQuotaUsage(limitId, value, timestamp) {
    const usage = this.quotaUsage.get(limitId);
    if (!usage) return;
    // Add to recent usage history
    usage.recentUsage.push({ timestamp, value });
    // Keep only recent usage (last 100 entries or 1 hour)
    const oneHourAgo = new Date(timestamp.getTime() - 60 * 60 * 1000);
    usage.recentUsage = usage.recentUsage
      .filter((entry) => entry.timestamp > oneHourAgo)
      .slice(-100);
    // Update current usage
    usage.currentUsage += value;
    usage.usagePercentage = (usage.currentUsage / usage.maxValue) * 100;
    usage.isExceeded = usage.currentUsage > usage.maxValue;
  }
  /**
   * Update usage window based on reset behavior
   */
  updateUsageWindow(limitId, limit) {
    const usage = this.quotaUsage.get(limitId);
    if (!usage) return;
    const now = new Date();
    if (limit.resetBehavior === 'fixed' && now > usage.windowEnd) {
      // Reset for fixed window
      usage.currentUsage = 0;
      usage.windowStart = now;
      usage.windowEnd = new Date(now.getTime() + limit.windowMs);
      usage.usagePercentage = 0;
      usage.isExceeded = false;
      usage.recentUsage = [];
    } else if (limit.resetBehavior === 'sliding') {
      // For sliding window, remove old usage
      const windowStart = new Date(now.getTime() - limit.windowMs);
      const validUsage = usage.recentUsage.filter(
        (entry) => entry.timestamp > windowStart,
      );
      usage.recentUsage = validUsage;
      usage.currentUsage = validUsage.reduce(
        (sum, entry) => sum + entry.value,
        0,
      );
      usage.usagePercentage = (usage.currentUsage / usage.maxValue) * 100;
      usage.isExceeded = usage.currentUsage > usage.maxValue;
      usage.windowStart = windowStart;
      usage.windowEnd = now;
    }
    usage.timeToReset = usage.windowEnd.getTime() - now.getTime();
  }
  /**
   * Check if limit applies to request type
   */
  isLimitApplicable(limit, requestType) {
    switch (limit.type) {
      case 'requests':
        return requestType === 'api_call';
      case 'tokens':
        return requestType === 'token_usage';
      case 'cost':
        return requestType === 'cost';
      case 'custom':
        return true; // Custom limits apply to all types
      default:
        return false;
    }
  }
  /**
   * Get default quota limits
   */
  getDefaultLimits() {
    return [
      {
        id: 'daily_requests',
        name: 'Daily API Requests',
        type: 'requests',
        maxValue: 1000,
        windowMs: 24 * 60 * 60 * 1000, // 24 hours
        resetBehavior: 'fixed',
        enabled: true,
        priority: 1,
        action: 'warn',
      },
      {
        id: 'hourly_cost',
        name: 'Hourly Cost Limit',
        type: 'cost',
        maxValue: 10, // $10 per hour
        windowMs: 60 * 60 * 1000, // 1 hour
        resetBehavior: 'sliding',
        enabled: true,
        priority: 2,
        action: 'throttle',
      },
    ];
  }
  /**
   * Get default rate limit configuration
   */
  getDefaultRateLimitConfig() {
    return {
      maxRequests: 100,
      windowMs: 60 * 1000, // 1 minute
      strategy: 'sliding_window',
      recoveryRate: 2, // 2 requests per second
    };
  }
  /**
   * Get default throttle configuration
   */
  getDefaultThrottleConfig() {
    return {
      factor: 0.5, // 50% throttling
      minDelay: 100, // 100ms minimum delay
      maxDelay: 5000, // 5s maximum delay
      backoffStrategy: 'exponential',
    };
  }
  /**
   * Emit budget event
   */
  emitBudgetEvent(type, data) {
    const event = {
      type,
      timestamp: new Date(),
      data,
      source: 'QuotaManager',
      severity: this.getEventSeverity(type),
    };
    this.emit('budget_event', event);
  }
  /**
   * Get event severity based on type
   */
  getEventSeverity(type) {
    switch (type) {
      case 'limit_exceeded':
        return 'critical';
      case 'warning_threshold':
        return 'warning';
      case 'usage_updated':
      case 'settings_changed':
      case 'budget_reset':
        return 'info';
      default:
        return 'info';
    }
  }
}
/**
 * Create a new QuotaManager instance
 */
export function createQuotaManager(config) {
  return new QuotaManager(config);
}
/**
 * Global quota manager instance
 */
let globalQuotaManager = null;
/**
 * Get or create the global quota manager instance
 */
export function getGlobalQuotaManager(config) {
  if (!globalQuotaManager) {
    globalQuotaManager = createQuotaManager(config);
  }
  return globalQuotaManager;
}
/**
 * Reset the global quota manager instance
 */
export function resetGlobalQuotaManager() {
  globalQuotaManager = null;
}
//# sourceMappingURL=quota-manager.js.map
