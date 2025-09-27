/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Audit Logging Middleware
 * Provides comprehensive audit logging for all Budget API operations
 * Tracks user actions, system events, and security-relevant activities
 *
 * @author Claude Code - Budget Management API Endpoints Agent
 * @version 1.0.0
 */

import type { Request, Response, NextFunction } from 'express';
import { getComponentLogger } from '../../../utils/logger.js';
import { BudgetEventType as _BudgetEventType, EventSeverity } from '../../types.js';

const logger = getComponentLogger('AuditMiddleware');

/**
 * Audit event interface
 */
interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  severity: EventSeverity;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  path: string;
  method: string;
  statusCode?: number;
  duration?: number;
  requestSize?: number;
  responseSize?: number;
  details: Record<string, unknown>;
  tags: string[];
}

/**
 * Audit event types
 */
enum AuditEventType {
  API_REQUEST = 'api_request',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATA_ACCESS = 'data_access',
  DATA_MODIFICATION = 'data_modification',
  CONFIGURATION_CHANGE = 'configuration_change',
  ERROR_EVENT = 'error_event',
  SECURITY_EVENT = 'security_event',
  RATE_LIMIT_EVENT = 'rate_limit_event',
  EXPORT_EVENT = 'export_event',
  IMPORT_EVENT = 'import_event',
}

/**
 * Enhanced request interface with audit context
 */
interface AuditRequest extends Request {
  user?: {
    id: string;
    permissions: string[];
    roles: string[];
  };
  sessionId?: string;
  auditContext?: {
    requestId: string;
    startTime: number;
    sensitive: boolean;
    tags: string[];
  };
}

/**
 * In-memory audit store (replace with persistent storage in production)
 */
class AuditStore {
  private events: AuditEvent[] = [];
  private maxEvents = 10000;

  /**
   * Add audit event
   */
  add(event: AuditEvent): void {
    this.events.push(event);

    // Maintain circular buffer
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    // Log event for immediate visibility
    this.logEvent(event);
  }

  /**
   * Get audit events with filters
   */
  getEvents(
    filters: {
      userId?: string;
      eventType?: AuditEventType;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {},
  ): AuditEvent[] {
    let filteredEvents = [...this.events];

    if (filters.userId) {
      filteredEvents = filteredEvents.filter(
        (e) => e.userId === filters.userId,
      );
    }

    if (filters.eventType) {
      filteredEvents = filteredEvents.filter(
        (e) => e.eventType === filters.eventType,
      );
    }

    if (filters.startDate) {
      filteredEvents = filteredEvents.filter(
        (e) => e.timestamp >= filters.startDate!,
      );
    }

    if (filters.endDate) {
      filteredEvents = filteredEvents.filter(
        (e) => e.timestamp <= filters.endDate!,
      );
    }

    // Sort by timestamp descending (newest first)
    filteredEvents.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );

    // Apply limit
    if (filters.limit && filters.limit > 0) {
      filteredEvents = filteredEvents.slice(0, filters.limit);
    }

    return filteredEvents;
  }

  /**
   * Get audit statistics
   */
  getStats(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    recentErrors: number;
  } {
    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};

    for (const event of this.events) {
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
      eventsBySeverity[event.severity] =
        (eventsBySeverity[event.severity] || 0) + 1;
    }

    // Count errors in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentErrors = this.events.filter(
      (e) => e.severity === EventSeverity.ERROR && e.timestamp >= oneHourAgo,
    ).length;

    return {
      totalEvents: this.events.length,
      eventsByType,
      eventsBySeverity,
      recentErrors,
    };
  }

  /**
   * Log event to console
   */
  private logEvent(event: AuditEvent): void {
    const logLevel = this.mapSeverityToLogLevel(event.severity);

    const logData = {
      auditId: event.id,
      eventType: event.eventType,
      userId: event.userId,
      path: event.path,
      method: event.method,
      statusCode: event.statusCode,
      duration: event.duration,
      ip: event.ipAddress,
    };

    switch (logLevel) {
      case 'debug':
        logger.debug(`Audit: ${event.eventType}`, logData);
        break;
      case 'info':
        logger.info(`Audit: ${event.eventType}`, logData);
        break;
      case 'warn':
        logger.warn(`Audit: ${event.eventType}`, logData);
        break;
      case 'error':
        logger.error(`Audit: ${event.eventType}`, logData);
        break;
      default:
        // Handle unexpected values
        break;
    }
  }

  /**
   * Map severity to log level
   */
  private mapSeverityToLogLevel(
    severity: EventSeverity,
  ): 'debug' | 'info' | 'warn' | 'error' {
    switch (severity) {
      case EventSeverity.INFO:
        return 'info';
      case EventSeverity.WARNING:
        return 'warn';
      case EventSeverity.ERROR:
      case EventSeverity.CRITICAL:
        return 'error';
      default:
        return 'debug';
    }
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = [];
  }
}

// Global audit store
const auditStore = new AuditStore();

/**
 * Main audit logging middleware
 */
export function auditLogMiddleware(
  req: AuditRequest,
  res: Response,
  next: NextFunction,
): void {
  const requestId = generateRequestId();
  const startTime = Date.now();

  // Set up audit context
  req.auditContext = {
    requestId,
    startTime,
    sensitive: isSensitiveEndpoint(req.path),
    tags: generateAuditTags(req),
  };

  logger.debug('Audit context initialized', {
    requestId,
    path: req.path,
    method: req.method,
    sensitive: req.auditContext.sensitive,
  });

  // Capture original response methods
  const originalJson = res.json;
  const originalSend = res.send;

  let responseData: unknown;
  let responseSent = false;

  // Override response methods to capture data
  res.json = function (data: unknown) {
    if (!responseSent) {
      responseData = data;
      responseSent = true;
    }
    return originalJson.call(this, data);
  };

  res.send = function (data: unknown) {
    if (!responseSent) {
      responseData = data;
      responseSent = true;
    }
    return originalSend.call(this, data);
  };

  // Handle response completion
  res.on('finish', () => {
    try {
      const duration = Date.now() - startTime;

      const auditEvent: AuditEvent = {
        id: requestId,
        timestamp: new Date(),
        eventType: determineEventType(req, res),
        severity: determineSeverity(req, res),
        userId: req.user?.id,
        sessionId: req.sessionId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        statusCode: res.statusCode,
        duration,
        requestSize: parseInt(req.get('Content-Length') || '0', 10),
        responseSize: res.get('Content-Length')
          ? parseInt(res.get('Content-Length')!, 10)
          : undefined,
        details: createAuditDetails(req, res, responseData),
        tags: req.auditContext?.tags || [],
      };

      auditStore.add(auditEvent);
    } catch (error) {
      logger.error('Failed to create audit event', {
        error: error instanceof Error ? error : new Error('Unknown error'),
        requestId,
        path: req.path,
      });
    }
  });

  next();
}

/**
 * Security event audit middleware
 */
export function auditSecurityEvent(
  eventType: string,
  severity: EventSeverity,
  details: Record<string, unknown>,
) {
  return (req: AuditRequest, res: Response, next: NextFunction): void => {
    const securityEvent: AuditEvent = {
      id: generateRequestId(),
      timestamp: new Date(),
      eventType: AuditEventType.SECURITY_EVENT,
      severity,
      userId: req.user?.id,
      sessionId: req.sessionId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      details: {
        securityEventType: eventType,
        ...details,
      },
      tags: ['security', eventType.toLowerCase()],
    };

    auditStore.add(securityEvent);
    next();
  };
}

/**
 * Data access audit middleware
 */
export function auditDataAccess(dataType: string) {
  return (req: AuditRequest, res: Response, next: NextFunction): void => {
    // Override response to capture accessed data
    const originalJson = res.json;

    res.json = function (data: unknown) {
      const dataAccessEvent: AuditEvent = {
        id: generateRequestId(),
        timestamp: new Date(),
        eventType: AuditEventType.DATA_ACCESS,
        severity: EventSeverity.INFO,
        userId: req.user?.id,
        sessionId: req.sessionId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        statusCode: res.statusCode,
        details: {
          dataType,
          accessSuccessful: res.statusCode < 400,
          recordsAccessed: Array.isArray((data as Record<string, unknown>)?.data) ? ((data as Record<string, unknown>).data as unknown[]).length : 1,
        },
        tags: ['data-access', dataType],
      };

      auditStore.add(dataAccessEvent);
      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Configuration change audit middleware
 */
export function auditConfigChange(
  req: AuditRequest,
  res: Response,
  next: NextFunction,
): void {
  if (req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'PATCH') {
    return next();
  }

  const originalJson = res.json;

  res.json = function (data: unknown) {
    const configChangeEvent: AuditEvent = {
      id: generateRequestId(),
      timestamp: new Date(),
      eventType: AuditEventType.CONFIGURATION_CHANGE,
      severity: EventSeverity.WARNING,
      userId: req.user?.id,
      sessionId: req.sessionId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      statusCode: res.statusCode,
      details: {
        changeSuccessful: res.statusCode < 400,
        configurationData: req.body,
        previousConfig: (data as Record<string, unknown>)?.data && typeof (data as Record<string, unknown>).data === 'object' ? ((data as Record<string, unknown>).data as Record<string, unknown>)?.previousConfiguration : undefined,
      },
      tags: ['config-change', 'sensitive'],
    };

    auditStore.add(configChangeEvent);
    return originalJson.call(this, data);
  };

  next();
}

/**
 * Export/import audit middleware
 */
export function auditExportImport(operationType: 'export' | 'import') {
  return (req: AuditRequest, res: Response, next: NextFunction): void => {
    const originalJson = res.json;

    res.json = function (data: unknown) {
      const exportImportEvent: AuditEvent = {
        id: generateRequestId(),
        timestamp: new Date(),
        eventType:
          operationType === 'export'
            ? AuditEventType.EXPORT_EVENT
            : AuditEventType.IMPORT_EVENT,
        severity: EventSeverity.WARNING, // Data export/import is sensitive
        userId: req.user?.id,
        sessionId: req.sessionId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        statusCode: res.statusCode,
        details: {
          operationType,
          format: req.query.format || req.body?.format,
          dataSize: res.get('Content-Length'),
          filters: req.query.filters || req.body?.filters,
          successful: res.statusCode < 400,
        },
        tags: [operationType, 'data-transfer', 'sensitive'],
      };

      auditStore.add(exportImportEvent);
      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Get audit logs endpoint handler
 */
export function getAuditLogs(req: Request, res: Response): void {
  const { userId, eventType, startDate, endDate, limit = 100 } = req.query;

  const filters: Record<string, unknown> = {
    limit: parseInt(limit as string, 10),
  };

  if (userId) filters.userId = userId as string;
  if (eventType) filters.eventType = eventType as AuditEventType;
  if (startDate) filters.startDate = new Date(startDate as string);
  if (endDate) filters.endDate = new Date(endDate as string);

  const events = auditStore.getEvents(filters);
  const stats = auditStore.getStats();

  res.json({
    success: true,
    data: {
      events,
      statistics: stats,
      filters,
      metadata: {
        timestamp: new Date().toISOString(),
        totalReturned: events.length,
      },
    },
  });
}

/**
 * Helper functions
 */

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function isSensitiveEndpoint(path: string): boolean {
  const sensitivePatterns = [
    '/config',
    '/admin',
    '/export',
    '/import',
    '/alerts',
  ];

  return sensitivePatterns.some((pattern) => path.includes(pattern));
}

function generateAuditTags(req: AuditRequest): string[] {
  const tags: string[] = [];

  if (req.user?.roles.includes('admin')) {
    tags.push('admin-access');
  }

  if (isSensitiveEndpoint(req.path)) {
    tags.push('sensitive');
  }

  if (req.method !== 'GET') {
    tags.push('data-modification');
  }

  return tags;
}

function determineEventType(req: AuditRequest, res: Response): AuditEventType {
  if (req.path.includes('/export')) {
    return AuditEventType.EXPORT_EVENT;
  }

  if (req.path.includes('/import')) {
    return AuditEventType.IMPORT_EVENT;
  }

  if (req.path.includes('/config') && req.method !== 'GET') {
    return AuditEventType.CONFIGURATION_CHANGE;
  }

  if (req.method !== 'GET') {
    return AuditEventType.DATA_MODIFICATION;
  }

  if (req.path.includes('/usage') || req.path.includes('/analytics')) {
    return AuditEventType.DATA_ACCESS;
  }

  return AuditEventType.API_REQUEST;
}

function determineSeverity(req: AuditRequest, res: Response): EventSeverity {
  if (res.statusCode >= 500) {
    return EventSeverity.ERROR;
  }

  if (res.statusCode >= 400) {
    return EventSeverity.WARNING;
  }

  if (isSensitiveEndpoint(req.path) || req.method !== 'GET') {
    return EventSeverity.WARNING;
  }

  return EventSeverity.INFO;
}

function createAuditDetails(
  req: AuditRequest,
  res: Response,
  responseData: unknown,
): Record<string, unknown> {
  const details: Record<string, unknown> = {
    requestHeaders: filterSensitiveHeaders(req.headers),
    queryParameters: req.query,
    success: res.statusCode < 400,
  };

  // Include request body for non-GET requests (but filter sensitive data)
  if (req.method !== 'GET' && req.body) {
    details.requestBody = filterSensitiveData(req.body);
  }

  // Include error details for failed requests
  if (res.statusCode >= 400 && responseData) {
    details.error = {
      message: (responseData as Record<string, unknown>)?.error as string || 'Unknown error',
      statusCode: res.statusCode,
    };
  }

  return details;
}

function filterSensitiveHeaders(
  headers: Record<string, unknown>,
): Record<string, unknown> {
  const filtered = { ...headers };
  const sensitiveHeaders = ['authorization', 'x-api-key', 'cookie'];

  for (const header of sensitiveHeaders) {
    if (filtered[header]) {
      filtered[header] = '[FILTERED]';
    }
  }

  return filtered;
}

function filterSensitiveData(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const filtered = { ...data };
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'apiKey'];

  for (const field of sensitiveFields) {
    if (filtered[field]) {
      filtered[field] = '[FILTERED]';
    }
  }

  return filtered;
}

/**
 * Export audit utilities
 */
export const auditUtils = {
  store: auditStore,
  generateRequestId,
  isSensitiveEndpoint,
  generateAuditTags,
  AuditEventType,
  filterSensitiveData,
  filterSensitiveHeaders,
};
