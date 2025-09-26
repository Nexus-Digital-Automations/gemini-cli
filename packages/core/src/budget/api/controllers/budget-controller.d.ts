/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Budget Usage Data Controller
 * Handles all budget usage tracking, retrieval, and management operations
 * Provides comprehensive endpoint handlers for budget usage APIs
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
 * Controller for budget usage management endpoints
 */
export declare class BudgetController {
    /**
     * Initialize budget controller with comprehensive logging
     */
    constructor();
    /**
     * Health check endpoint
     * GET /api/budget/health
     */
    healthCheck(req: Request, res: Response): Promise<void>;
    /**
     * Get current budget usage
     * GET /api/budget/usage
     */
    getCurrentUsage(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Get historical usage data with pagination
     * GET /api/budget/usage/history
     */
    getUsageHistory(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Get usage summary for dashboard
     * GET /api/budget/usage/summary
     */
    getUsageSummary(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Record new API usage
     * POST /api/budget/usage/record
     */
    recordUsage(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Get administrative statistics
     * GET /api/budget/admin/stats
     */
    getAdminStats(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Reset all budget data (admin only)
     * POST /api/budget/admin/reset-all
     */
    resetAllBudgets(req: AuthenticatedRequest, res: Response): Promise<void>;
}
export {};
