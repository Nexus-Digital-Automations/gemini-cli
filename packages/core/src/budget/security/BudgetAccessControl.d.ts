/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

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
 * Budget access control and security manager
 */
export declare class BudgetAccessControl {
  private readonly logger;
  private readonly config;
  private readonly auditLog;
  private readonly accessRules;
  private readonly permissionCache;
  private readonly rateLimitTracker;
  private auditCounter;
  /**
   * Create new budget access control manager
   * @param config - Security configuration
   */
  constructor(config?: Partial<SecurityConfig>);
  /**
   * Check if user has required permissions for operation
   * @param context - Security context
   * @param requiredPermissions - Required permissions
   * @param resource - Resource being accessed
   * @param action - Action being performed
   * @returns Permission check result
   */
  checkPermissions(
    context: BudgetSecurityContext,
    requiredPermissions: BudgetPermission[],
    resource: string,
    action: string,
  ): Promise<PermissionCheckResult>;
  /**
   * Register a new access control rule
   * @param rule - Access control rule
   */
  registerRule(rule: AccessControlRule): void;
  /**
   * Remove an access control rule
   * @param ruleId - Rule ID to remove
   */
  removeRule(ruleId: string): boolean;
  /**
   * Get audit log entries
   * @param limit - Maximum number of entries
   * @param offset - Offset for pagination
   * @returns Array of audit log entries
   */
  getAuditLog(limit?: number, offset?: number): SecurityAuditEntry[];
  /**
   * Clear audit log
   */
  clearAuditLog(): void;
  /**
   * Get security statistics
   */
  getSecurityStatistics(): {
    totalAuditEntries: number;
    grantedRequests: number;
    deniedRequests: number;
    topDenialReasons: Array<{
      reason: string;
      count: number;
    }>;
    activeRules: number;
    cacheHitRate?: number;
  };
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
  private logSecurityEvent;
  /**
   * Get user permissions with caching
   * @param context - Security context
   * @returns User permissions array
   */
  private getUserPermissions;
  /**
   * Find matching access control rules
   * @param context - Security context
   * @param resource - Resource being accessed
   * @param action - Action being performed
   * @returns Matching rules
   */
  private findMatchingRules;
  /**
   * Evaluate access condition
   * @param condition - Access condition
   * @param context - Security context
   * @returns Whether condition is met
   */
  private evaluateCondition;
  /**
   * Check rate limit for session
   * @param sessionId - Session identifier
   * @returns Whether request is within rate limit
   */
  private checkRateLimit;
  /**
   * Validate IP address against allowed ranges
   * @param ipAddress - IP address to validate
   * @returns Whether IP is allowed
   */
  private validateIpAddress;
  /**
   * Register default access control rules
   */
  private registerDefaultRules;
  /**
   * Cleanup expired permission cache entries
   */
  private cleanupPermissionCache;
  /**
   * Evaluate IP range condition
   */
  private evaluateIpRangeCondition;
  /**
   * Evaluate time window condition
   */
  private evaluateTimeWindowCondition;
  /**
   * Evaluate user attribute condition
   */
  private evaluateUserAttributeCondition;
  /**
   * Evaluate session age condition
   */
  private evaluateSessionAgeCondition;
}
/**
 * Factory function to create budget access control manager
 * @param config - Security configuration
 * @returns New access control manager
 */
export declare function createBudgetAccessControl(
  config?: Partial<SecurityConfig>,
): BudgetAccessControl;
