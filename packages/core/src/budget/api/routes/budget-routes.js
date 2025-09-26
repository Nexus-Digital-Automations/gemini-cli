/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Comprehensive Budget Management API Routes
 * Provides RESTful endpoints for all budget management operations including
 * usage tracking, configuration, analytics, real-time streaming, and notifications
 *
 * @author Claude Code - Budget Management API Endpoints Agent
 * @version 1.0.0
 */
import { Router } from 'express';
import { Logger } from '../../../../../src/utils/logger.js';
import { BudgetController } from '../controllers/budget-controller.js';
import { AnalyticsController } from '../controllers/analytics-controller.js';
import { ConfigurationController } from '../controllers/configuration-controller.js';
import { StreamingController } from '../controllers/streaming-controller.js';
import { NotificationController } from '../controllers/notification-controller.js';
import { ExportImportController } from '../controllers/export-import-controller.js';
import { validateRequest } from '../middleware/validation-middleware.js';
import { authenticateRequest } from '../middleware/auth-middleware.js';
import { rateLimitMiddleware } from '../middleware/rate-limit-middleware.js';
import { auditLogMiddleware } from '../middleware/audit-middleware.js';
import { usageRequestSchema, configurationRequestSchema, analyticsRequestSchema, exportRequestSchema, notificationRequestSchema, } from '../schemas/request-schemas.js';
const logger = new Logger('BudgetAPIRoutes');
/**
 * Create the main budget API router with all endpoints
 */
export function createBudgetRouter() {
    logger.info('Initializing Budget API routes', {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
    const router = Router();
    // Initialize controllers
    const budgetController = new BudgetController();
    const analyticsController = new AnalyticsController();
    const configurationController = new ConfigurationController();
    const streamingController = new StreamingController();
    const notificationController = new NotificationController();
    const exportImportController = new ExportImportController();
    // Apply global middleware
    router.use(auditLogMiddleware);
    router.use(rateLimitMiddleware);
    // Health check endpoint - no auth required
    router.get('/health', budgetController.healthCheck.bind(budgetController));
    // === BUDGET USAGE ENDPOINTS ===
    /**
     * GET /api/budget/usage
     * Retrieve current budget usage data with optional filtering
     */
    router.get('/usage', authenticateRequest, validateRequest(usageRequestSchema, 'query'), budgetController.getCurrentUsage.bind(budgetController));
    /**
     * GET /api/budget/usage/history
     * Get historical usage data with pagination and filters
     */
    router.get('/usage/history', authenticateRequest, validateRequest(usageRequestSchema, 'query'), budgetController.getUsageHistory.bind(budgetController));
    /**
     * GET /api/budget/usage/summary
     * Get usage summary for dashboard display
     */
    router.get('/usage/summary', authenticateRequest, budgetController.getUsageSummary.bind(budgetController));
    /**
     * POST /api/budget/usage/record
     * Record a new API usage (for manual tracking)
     */
    router.post('/usage/record', authenticateRequest, validateRequest(usageRequestSchema, 'body'), budgetController.recordUsage.bind(budgetController));
    // === BUDGET CONFIGURATION ENDPOINTS ===
    /**
     * GET /api/budget/config
     * Get current budget configuration
     */
    router.get('/config', authenticateRequest, configurationController.getConfiguration.bind(configurationController));
    /**
     * POST /api/budget/config
     * Update budget configuration
     */
    router.post('/config', authenticateRequest, validateRequest(configurationRequestSchema, 'body'), configurationController.updateConfiguration.bind(configurationController));
    /**
     * POST /api/budget/config/reset
     * Reset budget configuration to defaults
     */
    router.post('/config/reset', authenticateRequest, configurationController.resetConfiguration.bind(configurationController));
    /**
     * GET /api/budget/config/validate
     * Validate configuration without applying changes
     */
    router.get('/config/validate', authenticateRequest, validateRequest(configurationRequestSchema, 'query'), configurationController.validateConfiguration.bind(configurationController));
    // === ANALYTICS AND REPORTING ENDPOINTS ===
    /**
     * GET /api/budget/analytics
     * Get comprehensive usage analytics
     */
    router.get('/analytics', authenticateRequest, validateRequest(analyticsRequestSchema, 'query'), analyticsController.getAnalytics.bind(analyticsController));
    /**
     * GET /api/budget/analytics/trends
     * Get usage trends and patterns
     */
    router.get('/analytics/trends', authenticateRequest, validateRequest(analyticsRequestSchema, 'query'), analyticsController.getTrends.bind(analyticsController));
    /**
     * GET /api/budget/analytics/predictions
     * Get cost predictions and forecasts
     */
    router.get('/analytics/predictions', authenticateRequest, validateRequest(analyticsRequestSchema, 'query'), analyticsController.getPredictions.bind(analyticsController));
    /**
     * GET /api/budget/analytics/breakdown
     * Get detailed cost breakdown by feature/model/time
     */
    router.get('/analytics/breakdown', authenticateRequest, validateRequest(analyticsRequestSchema, 'query'), analyticsController.getCostBreakdown.bind(analyticsController));
    /**
     * POST /api/budget/analytics/custom
     * Run custom analytics query
     */
    router.post('/analytics/custom', authenticateRequest, validateRequest(analyticsRequestSchema, 'body'), analyticsController.runCustomAnalytics.bind(analyticsController));
    // === BUDGET ALERTS AND NOTIFICATIONS ===
    /**
     * GET /api/budget/alerts
     * Get active budget alerts
     */
    router.get('/alerts', authenticateRequest, notificationController.getAlerts.bind(notificationController));
    /**
     * POST /api/budget/alerts
     * Create or update alert configuration
     */
    router.post('/alerts', authenticateRequest, validateRequest(notificationRequestSchema, 'body'), notificationController.configureAlerts.bind(notificationController));
    /**
     * DELETE /api/budget/alerts/:alertId
     * Remove specific alert
     */
    router.delete('/alerts/:alertId', authenticateRequest, notificationController.removeAlert.bind(notificationController));
    /**
     * POST /api/budget/alerts/test
     * Test notification delivery
     */
    router.post('/alerts/test', authenticateRequest, validateRequest(notificationRequestSchema, 'body'), notificationController.testNotification.bind(notificationController));
    // === DATA EXPORT AND IMPORT ENDPOINTS ===
    /**
     * GET /api/budget/export
     * Export budget data in specified format
     */
    router.get('/export', authenticateRequest, validateRequest(exportRequestSchema, 'query'), exportImportController.exportData.bind(exportImportController));
    /**
     * POST /api/budget/import
     * Import budget data from file
     */
    router.post('/import', authenticateRequest, exportImportController.importData.bind(exportImportController));
    /**
     * GET /api/budget/export/templates
     * Get available export templates
     */
    router.get('/export/templates', authenticateRequest, exportImportController.getExportTemplates.bind(exportImportController));
    // === REAL-TIME STREAMING ENDPOINTS ===
    /**
     * GET /api/budget/stream
     * WebSocket endpoint for real-time budget updates
     */
    router.get('/stream', authenticateRequest, streamingController.handleStreamRequest.bind(streamingController));
    /**
     * GET /api/budget/stream/status
     * Get streaming connection status
     */
    router.get('/stream/status', authenticateRequest, streamingController.getStreamStatus.bind(streamingController));
    // === ADMINISTRATIVE ENDPOINTS ===
    /**
     * GET /api/budget/admin/stats
     * Get system-wide budget statistics
     */
    router.get('/admin/stats', authenticateRequest, budgetController.getAdminStats.bind(budgetController));
    /**
     * POST /api/budget/admin/reset-all
     * Reset all budget data (admin only)
     */
    router.post('/admin/reset-all', authenticateRequest, budgetController.resetAllBudgets.bind(budgetController));
    // Error handling middleware
    router.use((error, req, res, next) => {
        logger.error('Budget API route error', {
            error: error.message,
            path: req.path,
            method: req.method,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            timestamp: new Date().toISOString(),
            path: req.path,
        });
    });
    logger.info('Budget API routes initialized successfully', {
        routesCount: router.stack.length,
        timestamp: new Date().toISOString(),
    });
    return router;
}
/**
 * Default export for convenience
 */
export default createBudgetRouter;
//# sourceMappingURL=budget-routes.js.map