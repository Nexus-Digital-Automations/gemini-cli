/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Budget security and access control framework
 * Provides comprehensive security controls for budget operations and data access
 *
 * @author Claude Code - Budget Core Infrastructure Agent
 * @version 1.0.0
 */

import { getComponentLogger, type StructuredLogger } from '../../utils/logger.js';
import type { BudgetSecurityContext, BudgetPermission } from '../types.js';

/**
 * Security audit log entry
 */
export interface SecurityAuditEntry {
  /** Unique entry ID */
  id: string;
  /** Timestamp of the event */
  timestamp: Date;
  /** User identifier */
  userId?: string;
  /** Session identifier */
  sessionId: string;
  /** Action attempted */
  action: string;
  /** Resource accessed */
  resource: string;
  /** Permissions required */
  requiredPermissions: BudgetPermission[];
  /** User permissions at time of access */
  userPermissions: BudgetPermission[];
  /** Whether access was granted */
  accessGranted: boolean;
  /** Reason for denial (if applicable) */
  denialReason?: string;
  /** IP address */
  ipAddress?: string;
  /** User agent */
  userAgent?: string;
  /** Additional context */
  metadata?: Record<string, any>;
}

/**
 * Access control rule
 */
export interface AccessControlRule {
  /** Rule identifier */
  id: string;
  /** Rule name */
  name: string;
  /** Rule description */
  description: string;
  /** Required permissions */
  requiredPermissions: BudgetPermission[];
  /** Optional conditions */
  conditions?: AccessCondition[];
  /** Whether rule is enabled */
  enabled: boolean;
  /** Rule priority (higher = more important) */
  priority: number;
}

/**
 * Access condition for dynamic permission checking
 */
export interface AccessCondition {
  /** Condition type */
  type:
    | 'ip_range'
    | 'time_window'
    | 'user_attribute'
    | 'session_age'
    | 'custom';
  /** Condition parameters */
  params: Record<string, any>;
  /** Condition evaluator function (for custom conditions) */
  evaluator?: (context: BudgetSecurityContext) => boolean | Promise<boolean>;
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  /** Whether access is granted */
  granted: boolean;
  /** Required permissions */
  requiredPermissions: BudgetPermission[];
  /** Missing permissions */
  missingPermissions: BudgetPermission[];
  /** Matched access control rules */
  matchedRules: string[];
  /** Reason for denial */
  denialReason?: string;
  /** Security audit entry ID */
  auditEntryId: string;
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  /** Enable audit logging */
  auditLogging: boolean;
  /** Maximum audit log entries */
  maxAuditEntries: number;
  /** Enable IP address validation */
  ipValidation: boolean;
  /** Allowed IP ranges (CIDR notation) */
  allowedIpRanges?: string[];
  /** Session timeout in minutes */
  sessionTimeout: number;
  /** Enable rate limiting */
  rateLimiting: boolean;
  /** Rate limit (requests per minute) */
  rateLimit: number;
  /** Enable permission caching */
  permissionCaching: boolean;
  /** Permission cache TTL in seconds */
  permissionCacheTTL: number;
}

/**
 * Default security configuration
 */
const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  auditLogging: true,
  maxAuditEntries: 10000,
  ipValidation: false,
  sessionTimeout: 120, // 2 hours
  rateLimiting: true,
  rateLimit: 100, // requests per minute
  permissionCaching: true,
  permissionCacheTTL: 300, // 5 minutes
};

/**
 * Budget access control and security manager
 */
export class BudgetAccessControl {
  private readonly logger: StructuredLogger;
  private readonly config: SecurityConfig;
  private readonly auditLog: SecurityAuditEntry[] = [];
  private readonly accessRules = new Map<string, AccessControlRule>();
  private readonly permissionCache = new Map<
    string,
    { permissions: BudgetPermission[]; expiresAt: number }
  >();
  private readonly rateLimitTracker = new Map<
    string,
    { count: number; windowStart: number }
  >();
  private auditCounter = 0;

  /**
   * Create new budget access control manager
   * @param config - Security configuration
   */
  constructor(config: Partial<SecurityConfig> = {}) {
    this.logger = getComponentLogger('BudgetAccessControl');
    this.config = { ...DEFAULT_SECURITY_CONFIG, ...config };

    // Register default access control rules
    this.registerDefaultRules();

    this.logger.info('Budget access control initialized', {
      auditLogging: this.config.auditLogging,
      rateLimiting: this.config.rateLimiting,
      ipValidation: this.config.ipValidation,
    });
  }

  /**
   * Check if user has required permissions for operation
   * @param context - Security context
   * @param requiredPermissions - Required permissions
   * @param resource - Resource being accessed
   * @param action - Action being performed
   * @returns Permission check result
   */
  async checkPermissions(
    context: BudgetSecurityContext,
    requiredPermissions: BudgetPermission[],
    resource: string,
    action: string,
  ): Promise<PermissionCheckResult> {
    const start = Date.now();

    try {
      // Check rate limiting first
      if (this.config.rateLimiting && !this.checkRateLimit(context.sessionId)) {
        const auditEntryId = await this.logSecurityEvent(
          context,
          action,
          resource,
          requiredPermissions,
          false,
          'Rate limit exceeded',
        );

        return {
          granted: false,
          requiredPermissions,
          missingPermissions: requiredPermissions,
          matchedRules: [],
          denialReason: 'Rate limit exceeded',
          auditEntryId,
        };
      }

      // Check IP validation if enabled
      if (
        this.config.ipValidation &&
        !this.validateIpAddress(context.ipAddress)
      ) {
        const auditEntryId = await this.logSecurityEvent(
          context,
          action,
          resource,
          requiredPermissions,
          false,
          'IP address not allowed',
        );

        return {
          granted: false,
          requiredPermissions,
          missingPermissions: requiredPermissions,
          matchedRules: [],
          denialReason: 'IP address not allowed',
          auditEntryId,
        };
      }

      // Get user permissions (with caching if enabled)
      const userPermissions = await this.getUserPermissions(context);

      // Check for admin permission (grants all access)
      if (userPermissions.includes(BudgetPermission.ADMIN)) {
        const auditEntryId = await this.logSecurityEvent(
          context,
          action,
          resource,
          requiredPermissions,
          true,
          'Admin permission granted',
        );

        return {
          granted: true,
          requiredPermissions,
          missingPermissions: [],
          matchedRules: ['admin-override'],
          auditEntryId,
        };
      }

      // Find matching access control rules
      const matchedRules = await this.findMatchingRules(
        context,
        resource,
        action,
      );

      // Combine required permissions from all matched rules
      const allRequiredPermissions = new Set<BudgetPermission>();
      requiredPermissions.forEach((perm) => allRequiredPermissions.add(perm));

      for (const rule of matchedRules) {
        rule.requiredPermissions.forEach((perm) =>
          allRequiredPermissions.add(perm),
        );
      }

      const finalRequiredPermissions = Array.from(allRequiredPermissions);

      // Check if user has all required permissions
      const missingPermissions = finalRequiredPermissions.filter(
        (perm) => !userPermissions.includes(perm),
      );

      const granted = missingPermissions.length === 0;

      const auditEntryId = await this.logSecurityEvent(
        context,
        action,
        resource,
        finalRequiredPermissions,
        granted,
        granted
          ? undefined
          : `Missing permissions: ${missingPermissions.join(', ')}`,
      );

      this.logger.debug('Permission check completed', {
        granted,
        requiredPermissions: finalRequiredPermissions.length,
        missingPermissions: missingPermissions.length,
        matchedRules: matchedRules.length,
        executionTime: Date.now() - start,
      });

      return {
        granted,
        requiredPermissions: finalRequiredPermissions,
        missingPermissions,
        matchedRules: matchedRules.map((rule) => rule.id),
        denialReason: granted
          ? undefined
          : `Missing permissions: ${missingPermissions.join(', ')}`,
        auditEntryId,
      };
    } catch (error) {
      this.logger.error('Permission check failed', {
        error: error as Error,
        action,
        resource,
      });

      const auditEntryId = await this.logSecurityEvent(
        context,
        action,
        resource,
        requiredPermissions,
        false,
        `Permission check error: ${(error as Error).message}`,
      );

      return {
        granted: false,
        requiredPermissions,
        missingPermissions: requiredPermissions,
        matchedRules: [],
        denialReason: 'Security system error',
        auditEntryId,
      };
    }
  }

  /**
   * Register a new access control rule
   * @param rule - Access control rule
   */
  registerRule(rule: AccessControlRule): void {
    this.accessRules.set(rule.id, rule);
    this.logger.debug('Access control rule registered', {
      ruleId: rule.id,
      name: rule.name,
      requiredPermissions: rule.requiredPermissions,
    });
  }

  /**
   * Remove an access control rule
   * @param ruleId - Rule ID to remove
   */
  removeRule(ruleId: string): boolean {
    const removed = this.accessRules.delete(ruleId);
    if (removed) {
      this.logger.debug('Access control rule removed', { ruleId });
    }
    return removed;
  }

  /**
   * Get audit log entries
   * @param limit - Maximum number of entries
   * @param offset - Offset for pagination
   * @returns Array of audit log entries
   */
  getAuditLog(limit: number = 100, offset: number = 0): SecurityAuditEntry[] {
    return this.auditLog
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);
  }

  /**
   * Clear audit log
   */
  clearAuditLog(): void {
    this.auditLog.length = 0;
    this.logger.info('Audit log cleared');
  }

  /**
   * Get security statistics
   */
  getSecurityStatistics(): {
    totalAuditEntries: number;
    grantedRequests: number;
    deniedRequests: number;
    topDenialReasons: Array<{ reason: string; count: number }>;
    activeRules: number;
    cacheHitRate?: number;
  } {
    const grantedRequests = this.auditLog.filter(
      (entry) => entry.accessGranted,
    ).length;
    const deniedRequests = this.auditLog.filter(
      (entry) => !entry.accessGranted,
    ).length;

    // Count denial reasons
    const denialReasons = new Map<string, number>();
    for (const entry of this.auditLog) {
      if (!entry.accessGranted && entry.denialReason) {
        const count = denialReasons.get(entry.denialReason) || 0;
        denialReasons.set(entry.denialReason, count + 1);
      }
    }

    const topDenialReasons = Array.from(denialReasons.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalAuditEntries: this.auditLog.length,
      grantedRequests,
      deniedRequests,
      topDenialReasons,
      activeRules: Array.from(this.accessRules.values()).filter(
        (rule) => rule.enabled,
      ).length,
    };
  }

  /**
   * Log security event to audit log
   * @param context - Security context
   * @param action - Action performed
   * @param resource - Resource accessed
   * @param requiredPermissions - Required permissions
   * @param accessGranted - Whether access was granted
   * @param denialReason - Reason for denial (if applicable)
   * @returns Audit entry ID
   */
  private async logSecurityEvent(
    context: BudgetSecurityContext,
    action: string,
    resource: string,
    requiredPermissions: BudgetPermission[],
    accessGranted: boolean,
    denialReason?: string,
  ): Promise<string> {
    if (!this.config.auditLogging) {
      return 'audit-disabled';
    }

    const entryId = `audit_${++this.auditCounter}_${Date.now()}`;

    const entry: SecurityAuditEntry = {
      id: entryId,
      timestamp: new Date(),
      userId: context.userId,
      sessionId: context.sessionId,
      action,
      resource,
      requiredPermissions,
      userPermissions: context.userPermissions,
      accessGranted,
      denialReason,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    };

    this.auditLog.push(entry);

    // Trim audit log if too large
    if (this.auditLog.length > this.config.maxAuditEntries) {
      this.auditLog.splice(
        0,
        this.auditLog.length - this.config.maxAuditEntries,
      );
    }

    if (!accessGranted) {
      this.logger.warn('Access denied', {
        action,
        resource,
        userId: context.userId,
        denialReason,
      });
    }

    return entryId;
  }

  /**
   * Get user permissions with caching
   * @param context - Security context
   * @returns User permissions array
   */
  private async getUserPermissions(
    context: BudgetSecurityContext,
  ): Promise<BudgetPermission[]> {
    const cacheKey = `${context.userId || 'anonymous'}_${context.sessionId}`;

    // Check cache if enabled
    if (this.config.permissionCaching) {
      const cached = this.permissionCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.permissions;
      }
    }

    // Use permissions from context
    const permissions = context.userPermissions;

    // Cache permissions if enabled
    if (this.config.permissionCaching) {
      const expiresAt = Date.now() + this.config.permissionCacheTTL * 1000;
      this.permissionCache.set(cacheKey, { permissions, expiresAt });

      // Cleanup expired cache entries
      this.cleanupPermissionCache();
    }

    return permissions;
  }

  /**
   * Find matching access control rules
   * @param context - Security context
   * @param resource - Resource being accessed
   * @param action - Action being performed
   * @returns Matching rules
   */
  private async findMatchingRules(
    context: BudgetSecurityContext,
    resource: string,
    action: string,
  ): Promise<AccessControlRule[]> {
    const matchingRules: AccessControlRule[] = [];

    for (const rule of this.accessRules.values()) {
      if (!rule.enabled) continue;

      // Check conditions
      let conditionsMet = true;
      if (rule.conditions) {
        for (const condition of rule.conditions) {
          const result = await this.evaluateCondition(condition, context);
          if (!result) {
            conditionsMet = false;
            break;
          }
        }
      }

      if (conditionsMet) {
        matchingRules.push(rule);
      }
    }

    // Sort by priority (higher priority first)
    return matchingRules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Evaluate access condition
   * @param condition - Access condition
   * @param context - Security context
   * @returns Whether condition is met
   */
  private async evaluateCondition(
    condition: AccessCondition,
    context: BudgetSecurityContext,
  ): Promise<boolean> {
    switch (condition.type) {
      case 'ip_range':
        return this.evaluateIpRangeCondition(
          condition.params,
          context.ipAddress,
        );

      case 'time_window':
        return this.evaluateTimeWindowCondition(condition.params);

      case 'user_attribute':
        return this.evaluateUserAttributeCondition(condition.params, context);

      case 'session_age':
        return this.evaluateSessionAgeCondition(condition.params, context);

      case 'custom':
        return condition.evaluator ? await condition.evaluator(context) : false;

      default:
        this.logger.warn('Unknown condition type', { type: condition.type });
        return false;
    }
  }

  /**
   * Check rate limit for session
   * @param sessionId - Session identifier
   * @returns Whether request is within rate limit
   */
  private checkRateLimit(sessionId: string): boolean {
    const now = Date.now();
    const windowSize = 60 * 1000; // 1 minute
    const limit = this.config.rateLimit;

    const tracker = this.rateLimitTracker.get(sessionId);

    if (!tracker || now - tracker.windowStart >= windowSize) {
      // New window
      this.rateLimitTracker.set(sessionId, { count: 1, windowStart: now });
      return true;
    }

    if (tracker.count >= limit) {
      return false;
    }

    tracker.count++;
    return true;
  }

  /**
   * Validate IP address against allowed ranges
   * @param ipAddress - IP address to validate
   * @returns Whether IP is allowed
   */
  private validateIpAddress(ipAddress?: string): boolean {
    if (!ipAddress || !this.config.allowedIpRanges) {
      return true; // Allow if no IP validation configured
    }

    // Simplified IP range validation (should use proper CIDR library in production)
    for (const range of this.config.allowedIpRanges) {
      if (ipAddress.startsWith(range.replace('/24', ''))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Register default access control rules
   */
  private registerDefaultRules(): void {
    // View budget rule
    this.registerRule({
      id: 'view-budget',
      name: 'View Budget Information',
      description: 'Allows viewing budget information',
      requiredPermissions: [BudgetPermission.VIEW_BUDGET],
      enabled: true,
      priority: 100,
    });

    // Modify settings rule
    this.registerRule({
      id: 'modify-settings',
      name: 'Modify Budget Settings',
      description: 'Allows modifying budget settings',
      requiredPermissions: [BudgetPermission.MODIFY_SETTINGS],
      enabled: true,
      priority: 200,
    });

    // Admin rule
    this.registerRule({
      id: 'admin-access',
      name: 'Administrative Access',
      description: 'Grants full administrative access',
      requiredPermissions: [BudgetPermission.ADMIN],
      enabled: true,
      priority: 1000,
    });
  }

  /**
   * Cleanup expired permission cache entries
   */
  private cleanupPermissionCache(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, cached] of this.permissionCache.entries()) {
      if (cached.expiresAt <= now) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      this.permissionCache.delete(key);
    }
  }

  /**
   * Evaluate IP range condition
   */
  private evaluateIpRangeCondition(
    params: Record<string, any>,
    ipAddress?: string,
  ): boolean {
    if (!ipAddress || !params.ranges) return false;

    for (const range of params.ranges) {
      if (ipAddress.startsWith(range.replace('/24', ''))) {
        return true;
      }
    }
    return false;
  }

  /**
   * Evaluate time window condition
   */
  private evaluateTimeWindowCondition(params: Record<string, any>): boolean {
    const now = new Date();
    const currentHour = now.getHours();

    const startHour = params.startHour || 0;
    const endHour = params.endHour || 23;

    return currentHour >= startHour && currentHour <= endHour;
  }

  /**
   * Evaluate user attribute condition
   */
  private evaluateUserAttributeCondition(
    params: Record<string, any>,
    context: BudgetSecurityContext,
  ): boolean {
    if (!params.attribute || !params.value) return false;

    // This would typically check against user attributes from a user store
    // For now, just return true as a placeholder
    return true;
  }

  /**
   * Evaluate session age condition
   */
  private evaluateSessionAgeCondition(
    params: Record<string, any>,
    context: BudgetSecurityContext,
  ): boolean {
    const maxAge = params.maxAgeMinutes || this.config.sessionTimeout;

    // This would typically check session creation time
    // For now, assume sessions are valid
    return true;
  }
}

/**
 * Factory function to create budget access control manager
 * @param config - Security configuration
 * @returns New access control manager
 */
export function createBudgetAccessControl(
  config?: Partial<SecurityConfig>,
): BudgetAccessControl {
  return new BudgetAccessControl(config);
}
