/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
// Budget types imported for type safety
// import type { BudgetSettings, BudgetUsageData } from '../../types.js';
import { getBudgetTracker } from '../../budget-tracker.js';
import { getMLBudgetAPI } from '../../api/ml-budget-api.js';
// Simple console-based logging for now
const logger = {
    info: (message, meta) => console.info(`[BudgetController] ${message}`, meta),
    warn: (message, meta) => console.warn(`[BudgetController] ${message}`, meta),
    error: (message, meta) => console.error(`[BudgetController] ${message}`, meta),
};
/**
 * Controller for budget usage management endpoints
 */
export class BudgetController {
    /**
     * Initialize budget controller with comprehensive logging
     */
    constructor() {
        logger.info('Initializing Budget Controller', {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
        });
    }
    /**
     * Health check endpoint
     * GET /api/budget/health
     */
    async healthCheck(req, res) {
        const startTime = Date.now();
        logger.info('Budget API health check requested', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString(),
        });
        try {
            // Test budget tracker availability
            const budgetTracker = await getBudgetTracker();
            const isTrackerHealthy = budgetTracker !== null;
            // Test ML API availability
            const mlAPI = getMLBudgetAPI();
            const mlHealthResult = await mlAPI.healthCheck(process.cwd(), {
                enabled: true,
                dailyLimit: 100,
            });
            const responseTime = Date.now() - startTime;
            const healthStatus = {
                status: isTrackerHealthy && mlHealthResult.success ? 'healthy' : 'degraded',
                timestamp: new Date().toISOString(),
                responseTime,
                components: {
                    budgetTracker: {
                        status: isTrackerHealthy ? 'healthy' : 'unhealthy',
                        message: isTrackerHealthy
                            ? 'Budget tracker operational'
                            : 'Budget tracker unavailable',
                    },
                    mlAPI: {
                        status: mlHealthResult.status,
                        details: mlHealthResult.details,
                    },
                },
                version: '1.0.0',
            };
            logger.info('Budget API health check completed', {
                status: healthStatus.status,
                responseTime,
                components: Object.keys(healthStatus.components).length,
            });
            res.status(200).json({
                success: true,
                data: healthStatus,
            });
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            logger.error('Budget API health check failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                responseTime,
            });
            res.status(503).json({
                success: false,
                error: 'Health check failed',
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                responseTime,
            });
        }
    }
    /**
     * Get current budget usage
     * GET /api/budget/usage
     */
    async getCurrentUsage(req, res) {
        const startTime = Date.now();
        const { projectRoot, feature, model } = req.query;
        logger.info('Current usage requested', {
            userId: req.user?.id,
            projectRoot,
            feature,
            model,
            timestamp: new Date().toISOString(),
        });
        try {
            const budgetTracker = await getBudgetTracker();
            if (!budgetTracker) {
                logger.warn('Budget tracker not available');
                res.status(503).json({
                    success: false,
                    error: 'Budget tracking service unavailable',
                });
                return;
            }
            // Get current usage data
            const usageData = await budgetTracker.getTodayUsage();
            // Get enhanced ML predictions if available
            const mlAPI = getMLBudgetAPI();
            let mlPredictions = null;
            try {
                const mlStats = await mlAPI.getUsageStats({
                    projectRoot: projectRoot || process.cwd(),
                    settings: budgetTracker.getBudgetSettings(),
                });
                if (mlStats.success && mlStats.data?.mlPredictions) {
                    mlPredictions = mlStats.data.mlPredictions;
                }
            }
            catch (mlError) {
                logger.warn('ML predictions unavailable', {
                    error: mlError instanceof Error ? mlError.message : 'Unknown ML error',
                });
            }
            const responseTime = Date.now() - startTime;
            const response = {
                success: true,
                data: {
                    current: usageData,
                    mlPredictions,
                    metadata: {
                        timestamp: new Date().toISOString(),
                        responseTime,
                        source: 'budget-tracker',
                        filters: { projectRoot, feature, model },
                    },
                },
            };
            logger.info('Current usage retrieved successfully', {
                responseTime,
                requestCount: usageData.requestCount,
                totalCost: usageData.totalCost,
            });
            res.status(200).json(response);
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            logger.error('Failed to get current usage', {
                error: error instanceof Error ? error.message : 'Unknown error',
                responseTime,
                userId: req.user?.id,
            });
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve current usage',
                timestamp: new Date().toISOString(),
                responseTime,
            });
        }
    }
    /**
     * Get historical usage data with pagination
     * GET /api/budget/usage/history
     */
    async getUsageHistory(req, res) {
        const startTime = Date.now();
        const { startDate, endDate, limit = 50, offset = 0, granularity = 'day', } = req.query;
        logger.info('Usage history requested', {
            userId: req.user?.id,
            startDate,
            endDate,
            limit,
            offset,
            granularity,
            timestamp: new Date().toISOString(),
        });
        try {
            const budgetTracker = await getBudgetTracker();
            if (!budgetTracker) {
                res.status(503).json({
                    success: false,
                    error: 'Budget tracking service unavailable',
                });
                return;
            }
            // Get historical data based on parameters - using today's usage as fallback
            const todayUsage = await budgetTracker.getTodayUsage();
            const historyData = [{
                    date: new Date().toISOString().split('T')[0],
                    requestCount: todayUsage.requestCount,
                    totalCost: todayUsage.totalCost,
                    timestamp: new Date().toISOString()
                }];
            const responseTime = Date.now() - startTime;
            const response = {
                success: true,
                data: {
                    history: historyData,
                    pagination: {
                        limit: parseInt(limit, 10),
                        offset: parseInt(offset, 10),
                        total: historyData.length,
                    },
                    metadata: {
                        timestamp: new Date().toISOString(),
                        responseTime,
                        granularity,
                    },
                },
            };
            logger.info('Usage history retrieved successfully', {
                responseTime,
                recordsReturned: historyData.length,
            });
            res.status(200).json(response);
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            logger.error('Failed to get usage history', {
                error: error instanceof Error ? error.message : 'Unknown error',
                responseTime,
                userId: req.user?.id,
            });
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve usage history',
                timestamp: new Date().toISOString(),
                responseTime,
            });
        }
    }
    /**
     * Get usage summary for dashboard
     * GET /api/budget/usage/summary
     */
    async getUsageSummary(req, res) {
        const startTime = Date.now();
        logger.info('Usage summary requested', {
            userId: req.user?.id,
            timestamp: new Date().toISOString(),
        });
        try {
            const budgetTracker = await getBudgetTracker();
            if (!budgetTracker) {
                res.status(503).json({
                    success: false,
                    error: 'Budget tracking service unavailable',
                });
                return;
            }
            // Get current usage and settings
            const usageData = await budgetTracker.getTodayUsage();
            const settings = budgetTracker.getBudgetSettings();
            // Calculate summary metrics
            const dailyLimit = settings.dailyLimit || 0;
            const usagePercentage = dailyLimit > 0 ? (usageData.totalCost / dailyLimit) * 100 : 0;
            const remainingBudget = Math.max(0, dailyLimit - usageData.totalCost);
            // Get trend data for the last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            // Get trend data - using current day as fallback
            const todayData = await budgetTracker.getTodayUsage();
            const trendData = [{
                    date: new Date().toISOString().split('T')[0],
                    requestCount: todayData.requestCount,
                    totalCost: todayData.totalCost,
                    timestamp: new Date().toISOString()
                }];
            const responseTime = Date.now() - startTime;
            const summary = {
                current: {
                    totalCost: usageData.totalCost,
                    requestCount: usageData.requestCount,
                    dailyLimit,
                    usagePercentage: Math.round(usagePercentage * 100) / 100,
                    remainingBudget: Math.round(remainingBudget * 100) / 100,
                    status: usagePercentage > 100
                        ? 'over_limit'
                        : usagePercentage > 80
                            ? 'warning'
                            : 'normal',
                },
                trends: {
                    last7Days: trendData,
                    avgDailyCost: trendData.length > 0
                        ? trendData.reduce((sum, day) => sum + (day.totalCost || 0), 0) /
                            trendData.length
                        : 0,
                },
                metadata: {
                    timestamp: new Date().toISOString(),
                    responseTime,
                    calculatedAt: new Date().toISOString(),
                },
            };
            logger.info('Usage summary generated successfully', {
                responseTime,
                usagePercentage: summary.current.usagePercentage,
                status: summary.current.status,
            });
            res.status(200).json({
                success: true,
                data: summary,
            });
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            logger.error('Failed to generate usage summary', {
                error: error instanceof Error ? error.message : 'Unknown error',
                responseTime,
                userId: req.user?.id,
            });
            res.status(500).json({
                success: false,
                error: 'Failed to generate usage summary',
                timestamp: new Date().toISOString(),
                responseTime,
            });
        }
    }
    /**
     * Record new API usage
     * POST /api/budget/usage/record
     */
    async recordUsage(req, res) {
        const startTime = Date.now();
        const { cost, model, feature, tokens, metadata } = req.body;
        logger.info('Recording new usage', {
            userId: req.user?.id,
            cost,
            model,
            feature,
            tokens,
            timestamp: new Date().toISOString(),
        });
        try {
            const budgetTracker = await getBudgetTracker();
            if (!budgetTracker) {
                res.status(503).json({
                    success: false,
                    error: 'Budget tracking service unavailable',
                });
                return;
            }
            // Record the usage
            await budgetTracker.recordRequestWithCost(cost || 0);
            const recordResult = {
                cost,
                model,
                feature,
                tokens,
                metadata,
                timestamp: new Date().toISOString(),
                userId: req.user?.id,
            };
            const responseTime = Date.now() - startTime;
            logger.info('Usage recorded successfully', {
                responseTime,
                cost,
                model,
                feature,
            });
            res.status(201).json({
                success: true,
                data: {
                    recorded: recordResult,
                    metadata: {
                        timestamp: new Date().toISOString(),
                        responseTime,
                        userId: req.user?.id,
                    },
                },
            });
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            logger.error('Failed to record usage', {
                error: error instanceof Error ? error.message : 'Unknown error',
                responseTime,
                userId: req.user?.id,
            });
            res.status(500).json({
                success: false,
                error: 'Failed to record usage',
                timestamp: new Date().toISOString(),
                responseTime,
            });
        }
    }
    /**
     * Get administrative statistics
     * GET /api/budget/admin/stats
     */
    async getAdminStats(req, res) {
        const startTime = Date.now();
        logger.info('Admin stats requested', {
            userId: req.user?.id,
            timestamp: new Date().toISOString(),
        });
        try {
            // Check admin permissions
            if (!req.user?.permissions.includes('admin')) {
                logger.warn('Unauthorized admin stats access attempt', {
                    userId: req.user?.id,
                });
                res.status(403).json({
                    success: false,
                    error: 'Admin access required',
                });
                return;
            }
            const budgetTracker = await getBudgetTracker();
            if (!budgetTracker) {
                res.status(503).json({
                    success: false,
                    error: 'Budget tracking service unavailable',
                });
                return;
            }
            // Gather system-wide statistics
            const todayUsage = await budgetTracker.getTodayUsage();
            const stats = {
                totalUsers: 1,
                totalRequests: todayUsage.requestCount,
                totalCost: todayUsage.totalCost,
                enabled: budgetTracker.isEnabled(),
                uptime: process.uptime(),
                timestamp: new Date().toISOString()
            };
            const responseTime = Date.now() - startTime;
            logger.info('Admin stats retrieved successfully', {
                responseTime,
                totalUsers: stats.totalUsers || 0,
            });
            res.status(200).json({
                success: true,
                data: {
                    system: stats,
                    metadata: {
                        timestamp: new Date().toISOString(),
                        responseTime,
                        requestedBy: req.user?.id,
                    },
                },
            });
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            logger.error('Failed to get admin stats', {
                error: error instanceof Error ? error.message : 'Unknown error',
                responseTime,
                userId: req.user?.id,
            });
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve admin statistics',
                timestamp: new Date().toISOString(),
                responseTime,
            });
        }
    }
    /**
     * Reset all budget data (admin only)
     * POST /api/budget/admin/reset-all
     */
    async resetAllBudgets(req, res) {
        const startTime = Date.now();
        logger.warn('Admin reset all budgets requested', {
            userId: req.user?.id,
            timestamp: new Date().toISOString(),
        });
        try {
            // Check admin permissions
            if (!req.user?.permissions.includes('admin')) {
                logger.error('Unauthorized budget reset attempt', {
                    userId: req.user?.id,
                });
                res.status(403).json({
                    success: false,
                    error: 'Admin access required for budget reset',
                });
                return;
            }
            const budgetTracker = await getBudgetTracker();
            if (!budgetTracker) {
                res.status(503).json({
                    success: false,
                    error: 'Budget tracking service unavailable',
                });
                return;
            }
            // Perform the reset operation
            await budgetTracker.resetDailyUsage();
            const resetResult = {
                success: true,
                timestamp: new Date().toISOString(),
                resetBy: req.user?.id
            };
            const responseTime = Date.now() - startTime;
            logger.warn('All budgets reset completed', {
                responseTime,
                resetBy: req.user?.id,
                result: resetResult,
            });
            res.status(200).json({
                success: true,
                data: {
                    reset: resetResult,
                    metadata: {
                        timestamp: new Date().toISOString(),
                        responseTime,
                        resetBy: req.user?.id,
                        operation: 'reset-all-budgets',
                    },
                },
            });
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            logger.error('Failed to reset all budgets', {
                error: error instanceof Error ? error.message : 'Unknown error',
                responseTime,
                userId: req.user?.id,
            });
            res.status(500).json({
                success: false,
                error: 'Failed to reset budgets',
                timestamp: new Date().toISOString(),
                responseTime,
            });
        }
    }
}
//# sourceMappingURL=budget-controller.js.map