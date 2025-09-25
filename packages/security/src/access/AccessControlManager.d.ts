/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
export interface User {
    readonly id: string;
    readonly username: string;
    readonly email: string;
    readonly roles: Role[];
    readonly permissions: Permission[];
    readonly metadata: Record<string, unknown>;
    readonly createdAt: Date;
    readonly lastLoginAt?: Date;
    readonly isActive: boolean;
}
export interface Role {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly permissions: Permission[];
    readonly inheritsFrom?: string[];
    readonly metadata: Record<string, unknown>;
}
export interface Permission {
    readonly id: string;
    readonly resource: string;
    readonly action: string;
    readonly conditions?: AccessCondition[];
    readonly metadata: Record<string, unknown>;
}
export interface AccessCondition {
    readonly field: string;
    readonly operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'regex';
    readonly value: unknown;
}
export interface AccessRequest {
    readonly user: User;
    readonly resource: string;
    readonly action: string;
    readonly context?: Record<string, unknown>;
    readonly timestamp: Date;
}
export interface AccessResult {
    readonly granted: boolean;
    readonly reason: string;
    readonly permissions: Permission[];
    readonly conditions: AccessCondition[];
    readonly auditLog: AccessAuditEntry;
}
export interface AccessAuditEntry {
    readonly id: string;
    readonly userId: string;
    readonly resource: string;
    readonly action: string;
    readonly granted: boolean;
    readonly reason: string;
    readonly timestamp: Date;
    readonly sessionId?: string;
    readonly clientInfo?: ClientInfo;
    readonly riskScore: number;
}
export interface ClientInfo {
    readonly ipAddress: string;
    readonly userAgent: string;
    readonly location?: string;
    readonly deviceFingerprint?: string;
}
export interface SecurityPolicy {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly rules: PolicyRule[];
    readonly isActive: boolean;
    readonly priority: number;
}
export interface PolicyRule {
    readonly id: string;
    readonly condition: string;
    readonly action: 'allow' | 'deny' | 'require_mfa' | 'log_only';
    readonly severity: 'low' | 'medium' | 'high' | 'critical';
}
/**
 * Comprehensive Role-Based Access Control (RBAC) and Attribute-Based Access Control (ABAC)
 * system with advanced security features.
 *
 * Features:
 * - Fine-grained role and permission management
 * - Attribute-based access control with dynamic conditions
 * - Real-time access monitoring and threat detection
 * - Comprehensive audit logging with tamper protection
 * - Multi-factor authentication integration
 * - Risk-based access control with behavior analysis
 * - Policy-driven security controls
 * - Session management with anomaly detection
 */
export declare class AccessControlManager extends EventEmitter {
    private readonly configPath?;
    private users;
    private roles;
    private sessions;
    private policies;
    private auditLog;
    private readonly auditLogger;
    private readonly riskAnalyzer;
    constructor(configPath?: string | undefined);
    /**
     * Initialize the access control system with default configurations.
     */
    initialize(): Promise<void>;
    /**
     * Create a new user with specified roles and permissions.
     */
    createUser(userData: Partial<User> & {
        username: string;
        email: string;
    }): Promise<User>;
    /**
     * Create a new role with specified permissions.
     */
    createRole(roleData: Partial<Role> & {
        name: string;
    }): Promise<Role>;
    /**
     * Check if a user has access to a specific resource and action.
     */
    checkAccess(request: AccessRequest): Promise<AccessResult>;
    /**
     * Grant additional permissions to a user.
     */
    grantPermission(userId: string, permission: Permission): Promise<void>;
    /**
     * Revoke permissions from a user.
     */
    revokePermission(userId: string, permissionId: string): Promise<void>;
    /**
     * Assign a role to a user.
     */
    assignRole(userId: string, roleId: string): Promise<void>;
    /**
     * Remove a role from a user.
     */
    removeRole(userId: string, roleId: string): Promise<void>;
    /**
     * Get comprehensive access audit trail.
     */
    getAccessAuditTrail(userId?: string, resource?: string, timeRange?: {
        start: Date;
        end: Date;
    }): AccessAuditEntry[];
    /**
     * Get security metrics and analytics.
     */
    getSecurityMetrics(): SecurityMetrics;
    /**
     * Private helper methods
     */
    private initializeDefaults;
    private loadConfiguration;
    private getUserPermissions;
    private findApplicablePermissions;
    private evaluateConditions;
    private evaluateCondition;
    private evaluatePolicies;
    private evaluatePolicyRule;
    private createAccessResult;
    private startPeriodicTasks;
}
interface SecurityMetrics {
    totalUsers: number;
    totalRoles: number;
    totalAccessAttempts24h: number;
    deniedAccess24h: number;
    highRiskAccess24h: number;
    successRate: number;
    averageRiskScore: number;
}
export {};
