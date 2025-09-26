/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Budget Notification Controller
 * Handles budget alerts, notifications, and alert configuration management
 * Provides endpoints for creating, managing, and testing notification systems
 *
 * @author Claude Code - Budget Management API Endpoints Agent
 * @version 1.0.0
 */
import type { Request, Response } from 'express';
/**
 * Enhanced request interface with user context
 */
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        permissions: string[];
    };
    sessionId?: string;
}
/**
 * Controller for budget notification and alerting endpoints
 */
export declare class NotificationController {
    private alertConfigs;
    private notificationHistory;
    /**
     * Initialize notification controller
     */
    constructor();
    /**
     * Get active budget alerts
     * GET /api/budget/alerts
     */
    getAlerts(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Configure budget alerts
     * POST /api/budget/alerts
     */
    configureAlerts(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Remove specific alert
     * DELETE /api/budget/alerts/:alertId
     */
    removeAlert(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Test notification delivery
     * POST /api/budget/alerts/test
     */
    testNotification(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Validate alert configuration
     */
    private validateAlertConfig;
    /**
     * Send test notification
     */
    private sendTestNotification;
    /**
     * Send notification to specific channel
     */
    private sendNotificationToChannel;
    /**
     * Send email notification (mock implementation)
     */
    private sendEmailNotification;
    /**
     * Send webhook notification (mock implementation)
     */
    private sendWebhookNotification;
    /**
     * Send desktop notification (mock implementation)
     */
    private sendDesktopNotification;
    /**
     * Send SMS notification (mock implementation)
     */
    private sendSMSNotification;
    /**
     * Load default alert configurations
     */
    private loadDefaultAlerts;
    /**
     * Generate unique alert ID
     */
    private generateAlertId;
}
export {};
