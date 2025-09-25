/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Budget API Authentication and Authorization Middleware
 * Provides comprehensive authentication and authorization for budget management endpoints
 * Supports JWT tokens, API keys, and role-based access control
 *
 * @author Claude Code - Budget Management API Endpoints Agent
 * @version 1.0.0
 */
import type { Request, Response, NextFunction } from 'express';
import type { BudgetSecurityContext } from '../../types.js';
import type { BudgetPermission } from '../../types.js';
/**
 * Enhanced request interface with authentication context
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    permissions: string[];
    roles: string[];
  };
  sessionId?: string;
  securityContext?: BudgetSecurityContext;
}
/**
 * User authentication data interface
 */
interface UserAuthData {
  id: string;
  email?: string;
  permissions: BudgetPermission[];
  roles: string[];
  isActive: boolean;
  lastLoginAt?: Date;
  metadata?: Record<string, any>;
}
/**
 * Authentication middleware factory
 */
export declare function authenticateRequest(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void;
/**
 * Authorization middleware factory
 */
export declare function requirePermissions(
  requiredPermissions: BudgetPermission[],
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Role-based authorization middleware
 */
export declare function requireRoles(
  requiredRoles: string[],
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Extract authentication credentials from request
 */
declare function extractAuthenticationCredentials(req: Request): {
  success: boolean;
  credentials?: string;
  type?: 'bearer' | 'apikey' | 'basic';
  error?: string;
};
/**
 * Validate authentication credentials
 */
declare function validateCredentials(
  credentials: string,
  type: 'bearer' | 'apikey' | 'basic',
): UserAuthData | null;
/**
 * Generate session ID
 */
declare function generateSessionId(): string;
/**
 * Middleware to log authentication events
 */
export declare function logAuthEvents(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void;
/**
 * Development-only middleware to bypass authentication
 * WARNING: Only use in development environment
 */
export declare function devBypassAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void;
/**
 * Export authentication utilities
 */
export declare const authUtils: {
  extractAuthenticationCredentials: typeof extractAuthenticationCredentials;
  validateCredentials: typeof validateCredentials;
  generateSessionId: typeof generateSessionId;
  mockUsers: Map<string, UserAuthData>;
  validApiKeys: Set<string>;
};
export {};
