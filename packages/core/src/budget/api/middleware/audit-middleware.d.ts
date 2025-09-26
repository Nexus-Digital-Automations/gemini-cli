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
import { EventSeverity } from '../../types.js';
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
    details: Record<string, any>;
    tags: string[];
}
/**
 * Audit event types
 */
declare enum AuditEventType {
    API_REQUEST = "api_request",
    AUTHENTICATION = "authentication",
    AUTHORIZATION = "authorization",
    DATA_ACCESS = "data_access",
    DATA_MODIFICATION = "data_modification",
    CONFIGURATION_CHANGE = "configuration_change",
    ERROR_EVENT = "error_event",
    SECURITY_EVENT = "security_event",
    RATE_LIMIT_EVENT = "rate_limit_event",
    EXPORT_EVENT = "export_event",
    IMPORT_EVENT = "import_event"
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
declare class AuditStore {
    private events;
    private maxEvents;
    /**
     * Add audit event
     */
    add(event: AuditEvent): void;
    /**
     * Get audit events with filters
     */
    getEvents(filters?: {
        userId?: string;
        eventType?: AuditEventType;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    }): AuditEvent[];
    /**
     * Get audit statistics
     */
    getStats(): {
        totalEvents: number;
        eventsByType: Record<string, number>;
        eventsBySeverity: Record<string, number>;
        recentErrors: number;
    };
    /**
     * Log event to console
     */
    private logEvent;
    /**
     * Map severity to log level
     */
    private mapSeverityToLogLevel;
    /**
     * Clear all events
     */
    clear(): void;
}
/**
 * Main audit logging middleware
 */
export declare function auditLogMiddleware(req: AuditRequest, res: Response, next: NextFunction): void;
/**
 * Security event audit middleware
 */
export declare function auditSecurityEvent(eventType: string, severity: EventSeverity, details: Record<string, any>): (req: AuditRequest, res: Response, next: NextFunction) => void;
/**
 * Data access audit middleware
 */
export declare function auditDataAccess(dataType: string): (req: AuditRequest, res: Response, next: NextFunction) => void;
/**
 * Configuration change audit middleware
 */
export declare function auditConfigChange(req: AuditRequest, res: Response, next: NextFunction): void;
/**
 * Export/import audit middleware
 */
export declare function auditExportImport(operationType: 'export' | 'import'): (req: AuditRequest, res: Response, next: NextFunction) => void;
/**
 * Get audit logs endpoint handler
 */
export declare function getAuditLogs(req: Request, res: Response): void;
/**
 * Helper functions
 */
declare function generateRequestId(): string;
declare function isSensitiveEndpoint(path: string): boolean;
declare function generateAuditTags(req: AuditRequest): string[];
declare function filterSensitiveHeaders(headers: Record<string, any>): Record<string, any>;
declare function filterSensitiveData(data: any): any;
/**
 * Export audit utilities
 */
export declare const auditUtils: {
    store: AuditStore;
    generateRequestId: typeof generateRequestId;
    isSensitiveEndpoint: typeof isSensitiveEndpoint;
    generateAuditTags: typeof generateAuditTags;
    AuditEventType: typeof AuditEventType;
    filterSensitiveData: typeof filterSensitiveData;
    filterSensitiveHeaders: typeof filterSensitiveHeaders;
};
export {};
