/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from '../../../../../src/utils/logger.js';
import { BudgetEventType, EventSeverity } from '../../types.js';
const logger = new Logger('AuditMiddleware');
/**
 * Audit event types
 */
var AuditEventType;
(function (AuditEventType) {
  AuditEventType['API_REQUEST'] = 'api_request';
  AuditEventType['AUTHENTICATION'] = 'authentication';
  AuditEventType['AUTHORIZATION'] = 'authorization';
  AuditEventType['DATA_ACCESS'] = 'data_access';
  AuditEventType['DATA_MODIFICATION'] = 'data_modification';
  AuditEventType['CONFIGURATION_CHANGE'] = 'configuration_change';
  AuditEventType['ERROR_EVENT'] = 'error_event';
  AuditEventType['SECURITY_EVENT'] = 'security_event';
  AuditEventType['RATE_LIMIT_EVENT'] = 'rate_limit_event';
  AuditEventType['EXPORT_EVENT'] = 'export_event';
  AuditEventType['IMPORT_EVENT'] = 'import_event';
})(AuditEventType || (AuditEventType = {}));
/**
 * In-memory audit store (replace with persistent storage in production)
 */
class AuditStore {
  events = [];
  maxEvents = 10000;
  /**
   * Add audit event
   */
  add(event) {
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
  getEvents(filters = {}) {
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
        (e) => e.timestamp >= filters.startDate,
      );
    }
    if (filters.endDate) {
      filteredEvents = filteredEvents.filter(
        (e) => e.timestamp <= filters.endDate,
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
  getStats() {
    const eventsByType = {};
    const eventsBySeverity = {};
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
  logEvent(event) {
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
    }
  }
  /**
   * Map severity to log level
   */
  mapSeverityToLogLevel(severity) {
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
  clear() {
    this.events = [];
  }
}
// Global audit store
const auditStore = new AuditStore();
/**
 * Main audit logging middleware
 */
export function auditLogMiddleware(req, res, next) {
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
  let responseData;
  let responseSent = false;
  // Override response methods to capture data
  res.json = function (data) {
    if (!responseSent) {
      responseData = data;
      responseSent = true;
    }
    return originalJson.call(this, data);
  };
  res.send = function (data) {
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
      const auditEvent = {
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
        requestSize: parseInt(req.get('Content-Length') || '0'),
        responseSize: res.get('Content-Length')
          ? parseInt(res.get('Content-Length'))
          : undefined,
        details: createAuditDetails(req, res, responseData),
        tags: req.auditContext?.tags || [],
      };
      auditStore.add(auditEvent);
    } catch (error) {
      logger.error('Failed to create audit event', {
        error: error instanceof Error ? error.message : 'Unknown error',
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
export function auditSecurityEvent(eventType, severity, details) {
  return (req, res, next) => {
    const securityEvent = {
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
export function auditDataAccess(dataType) {
  return (req, res, next) => {
    // Override response to capture accessed data
    const originalJson = res.json;
    res.json = function (data) {
      const dataAccessEvent = {
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
          recordsAccessed: Array.isArray(data?.data) ? data.data.length : 1,
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
export function auditConfigChange(req, res, next) {
  if (req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'PATCH') {
    return next();
  }
  const originalJson = res.json;
  res.json = function (data) {
    const configChangeEvent = {
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
        previousConfig: data?.data?.previousConfiguration,
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
export function auditExportImport(operationType) {
  return (req, res, next) => {
    const originalJson = res.json;
    res.json = function (data) {
      const exportImportEvent = {
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
export function getAuditLogs(req, res) {
  const { userId, eventType, startDate, endDate, limit = 100 } = req.query;
  const filters = {
    limit: parseInt(limit),
  };
  if (userId) filters.userId = userId;
  if (eventType) filters.eventType = eventType;
  if (startDate) filters.startDate = new Date(startDate);
  if (endDate) filters.endDate = new Date(endDate);
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
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function isSensitiveEndpoint(path) {
  const sensitivePatterns = [
    '/config',
    '/admin',
    '/export',
    '/import',
    '/alerts',
  ];
  return sensitivePatterns.some((pattern) => path.includes(pattern));
}
function generateAuditTags(req) {
  const tags = [];
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
function determineEventType(req, res) {
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
function determineSeverity(req, res) {
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
function createAuditDetails(req, res, responseData) {
  const details = {
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
      message: responseData.error || 'Unknown error',
      statusCode: res.statusCode,
    };
  }
  return details;
}
function filterSensitiveHeaders(headers) {
  const filtered = { ...headers };
  const sensitiveHeaders = ['authorization', 'x-api-key', 'cookie'];
  for (const header of sensitiveHeaders) {
    if (filtered[header]) {
      filtered[header] = '[FILTERED]';
    }
  }
  return filtered;
}
function filterSensitiveData(data) {
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
//# sourceMappingURL=audit-middleware.js.map
