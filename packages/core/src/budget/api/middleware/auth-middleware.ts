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
import { getComponentLogger } from '../../../utils/logger.js';
import type { BudgetSecurityContext } from '../../types.js';
import { BudgetPermission } from '../../types.js';

const logger = getComponentLogger('AuthMiddleware');

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
 * Mock user database - replace with actual user service
 */
const mockUsers = new Map<string, UserAuthData>([
  [
    'user_123',
    {
      id: 'user_123',
      email: 'test@example.com',
      permissions: [
        BudgetPermission.VIEW_BUDGET,
        BudgetPermission.VIEW_USAGE,
        BudgetPermission.VIEW_HISTORY,
        BudgetPermission.MODIFY_SETTINGS,
      ],
      roles: ['user'],
      isActive: true,
      lastLoginAt: new Date(),
      metadata: { department: 'engineering' },
    },
  ],
  [
    'admin_456',
    {
      id: 'admin_456',
      email: 'admin@example.com',
      permissions: Object.values(BudgetPermission),
      roles: ['admin', 'user'],
      isActive: true,
      lastLoginAt: new Date(),
      metadata: { department: 'operations' },
    },
  ],
]);

/**
 * Valid API keys - replace with actual API key service
 */
const validApiKeys = new Set([
  'api_key_development_123',
  'api_key_production_456',
  'api_key_staging_789',
]);

/**
 * Authentication middleware factory
 */
export function authenticateRequest(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const startTime = Date.now();

  logger.info('Authentication request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });

  try {
    // Extract authentication credentials
    const authResult = extractAuthenticationCredentials(req);

    if (!authResult.success) {
      logger.warn('Authentication failed - no valid credentials', {
        path: req.path,
        ip: req.ip,
        error: new Error(authResult.error || 'Authentication error'),
      });

      res.status(401).json({
        success: false,
        error: 'Authentication required',
        details: authResult.error,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Validate credentials and get user data
    const user = validateCredentials(authResult.credentials!, authResult.type!);

    if (!user) {
      logger.warn('Authentication failed - invalid credentials', {
        path: req.path,
        ip: req.ip,
        credentialsType: authResult.type,
      });

      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!user.isActive) {
      logger.warn('Authentication failed - inactive user', {
        path: req.path,
        ip: req.ip,
        userId: user.id,
      });

      res.status(401).json({
        success: false,
        error: 'Account is inactive',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Attach user data to request
    req.user = {
      id: user.id,
      email: user.email,
      permissions: user.permissions.map((p) => p.toString()),
      roles: user.roles,
    };

    // Generate session ID
    req.sessionId = generateSessionId();

    // Create security context
    req.securityContext = {
      userId: user.id,
      sessionId: req.sessionId,
      requiredPermissions: [], // Will be set by authorization middleware
      userPermissions: user.permissions,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    };

    const authTime = Date.now() - startTime;

    logger.info('Authentication successful', {
      userId: user.id,
      authTime,
      permissions: user.permissions.length,
      roles: user.roles.length,
    });

    next();
  } catch (error) {
    const authTime = Date.now() - startTime;

    logger.error('Authentication error', {
      error: error instanceof Error ? error : new Error('Unknown error'),
      authTime,
      path: req.path,
      ip: req.ip,
    });

    res.status(500).json({
      success: false,
      error: 'Authentication service error',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Authorization middleware factory
 */
export function requirePermissions(requiredPermissions: BudgetPermission[]) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void => {
    const startTime = Date.now();

    logger.debug('Authorization check', {
      userId: req.user?.id,
      requiredPermissions,
      userPermissions: req.user?.permissions,
      path: req.path,
    });

    try {
      if (!req.user) {
        logger.warn('Authorization failed - no authenticated user', {
          path: req.path,
        });

        res.status(401).json({
          success: false,
          error: 'Authentication required for this endpoint',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Update security context with required permissions
      if (req.securityContext) {
        req.securityContext.requiredPermissions = requiredPermissions;
      }

      // Check if user has required permissions
      const hasAllPermissions = requiredPermissions.every(
        (requiredPerm) =>
          req.user!.permissions.includes(requiredPerm.toString()) ||
          req.user!.roles.includes('admin'), // Admins have all permissions
      );

      if (!hasAllPermissions) {
        const missingPermissions = requiredPermissions.filter(
          (requiredPerm) =>
            !req.user!.permissions.includes(requiredPerm.toString()) &&
            !req.user!.roles.includes('admin'),
        );

        logger.warn('Authorization failed - insufficient permissions', {
          userId: req.user.id,
          path: req.path,
          requiredPermissions,
          missingPermissions,
        });

        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          details: {
            required: requiredPermissions,
            missing: missingPermissions,
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const authTime = Date.now() - startTime;

      logger.debug('Authorization successful', {
        userId: req.user.id,
        authTime,
        permissions: requiredPermissions,
      });

      next();
    } catch (error) {
      const authTime = Date.now() - startTime;

      logger.error('Authorization error', {
        error: error instanceof Error ? error : new Error('Unknown error'),
        authTime,
        userId: req.user?.id,
        path: req.path,
      });

      res.status(500).json({
        success: false,
        error: 'Authorization service error',
        timestamp: new Date().toISOString(),
      });
    }
  };
}

/**
 * Role-based authorization middleware
 */
export function requireRoles(requiredRoles: string[]) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void => {
    logger.debug('Role authorization check', {
      userId: req.user?.id,
      requiredRoles,
      userRoles: req.user?.roles,
      path: req.path,
    });

    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const hasRequiredRole = requiredRoles.some((role) =>
      req.user!.roles.includes(role),
    );

    if (!hasRequiredRole) {
      logger.warn('Role authorization failed', {
        userId: req.user.id,
        path: req.path,
        requiredRoles,
        userRoles: req.user.roles,
      });

      res.status(403).json({
        success: false,
        error: 'Insufficient role privileges',
        details: {
          required: requiredRoles,
          current: req.user.roles,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
}

/**
 * Extract authentication credentials from request
 */
function extractAuthenticationCredentials(req: Request): {
  success: boolean;
  credentials?: string;
  type?: 'bearer' | 'apikey' | 'basic';
  error?: string;
} {
  // Check Authorization header
  const authHeader = req.get('Authorization');

  if (authHeader) {
    // Bearer token authentication
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (token) {
        return {
          success: true,
          credentials: token,
          type: 'bearer',
        };
      }
    }

    // Basic authentication
    if (authHeader.startsWith('Basic ')) {
      const credentials = authHeader.substring(6);
      if (credentials) {
        return {
          success: true,
          credentials,
          type: 'basic',
        };
      }
    }
  }

  // Check API key in headers
  const apiKey = req.get('X-API-Key') || req.get('X-Api-Key');
  if (apiKey) {
    return {
      success: true,
      credentials: apiKey,
      type: 'apikey',
    };
  }

  // Check API key in query parameters
  if (req.query.api_key && typeof req.query.api_key === 'string') {
    return {
      success: true,
      credentials: req.query.api_key,
      type: 'apikey',
    };
  }

  return {
    success: false,
    error: 'No authentication credentials provided',
  };
}

/**
 * Validate authentication credentials
 */
function validateCredentials(
  credentials: string,
  type: 'bearer' | 'apikey' | 'basic',
): UserAuthData | null {
  switch (type) {
    case 'bearer':
      return validateJWTToken(credentials);

    case 'apikey':
      return validateApiKey(credentials);

    case 'basic':
      return validateBasicAuth(credentials);

    default:
      return null;
  }
}

/**
 * Validate JWT token (mock implementation)
 */
function validateJWTToken(token: string): UserAuthData | null {
  // Mock JWT validation - replace with actual JWT library
  logger.debug('Validating JWT token (mock)', { tokenLength: token.length });

  // For demo purposes, accept a specific token format
  if (token === 'mock_jwt_token_user_123') {
    return mockUsers.get('user_123') || null;
  }

  if (token === 'mock_jwt_token_admin_456') {
    return mockUsers.get('admin_456') || null;
  }

  return null;
}

/**
 * Validate API key
 */
function validateApiKey(apiKey: string): UserAuthData | null {
  logger.debug('Validating API key', {
    apiKey: apiKey.substring(0, 10) + '...',
  });

  if (!validApiKeys.has(apiKey)) {
    return null;
  }

  // For demo purposes, map API keys to users
  if (apiKey === 'api_key_development_123') {
    return mockUsers.get('user_123') || null;
  }

  if (apiKey.includes('production') || apiKey.includes('staging')) {
    return mockUsers.get('admin_456') || null;
  }

  return null;
}

/**
 * Validate basic authentication
 */
function validateBasicAuth(credentials: string): UserAuthData | null {
  try {
    // Decode base64 credentials
    const decoded = Buffer.from(credentials, 'base64').toString('ascii');
    const [username, password] = decoded.split(':');

    logger.debug('Validating basic auth', { username });

    // Mock basic auth validation - replace with actual password verification
    if (username === 'testuser' && password === 'testpass') {
      return mockUsers.get('user_123') || null;
    }

    if (username === 'admin' && password === 'adminpass') {
      return mockUsers.get('admin_456') || null;
    }

    return null;
  } catch (error) {
    logger.warn('Basic auth decode error', {
      error: error instanceof Error ? error : new Error('Decode error'),
    });
    return null;
  }
}

/**
 * Generate session ID
 */
function generateSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return `session_${timestamp}_${random}`;
}

/**
 * Middleware to log authentication events
 */
export function logAuthEvents(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  // Log authentication events for audit trail
  const originalSend = res.send;

  res.send = function (body: any) {
    const statusCode = res.statusCode;

    if (statusCode === 401 || statusCode === 403) {
      logger.warn('Authentication/Authorization event logged', {
        userId: req.user?.id,
        statusCode,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
      });
    }

    return originalSend.call(this, body);
  };

  next();
}

/**
 * Development-only middleware to bypass authentication
 * WARNING: Only use in development environment
 */
export function devBypassAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  if (process.env.NODE_ENV !== 'development') {
    return next();
  }

  logger.warn('Development authentication bypass active', {
    path: req.path,
    NODE_ENV: process.env.NODE_ENV,
  });

  // Attach mock user for development
  req.user = {
    id: 'dev_user',
    email: 'dev@example.com',
    permissions: Object.values(BudgetPermission).map((p) => p.toString()),
    roles: ['admin', 'dev'],
  };

  req.sessionId = 'dev_session';

  next();
}

/**
 * Export authentication utilities
 */
export const authUtils = {
  extractAuthenticationCredentials,
  validateCredentials,
  generateSessionId,
  mockUsers, // For testing purposes
  validApiKeys, // For testing purposes
};
