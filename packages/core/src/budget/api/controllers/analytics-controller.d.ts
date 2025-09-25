/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Budget Analytics Controller
 * Handles all budget analytics and reporting operations including
 * usage analytics, trends analysis, cost predictions, and custom reports
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
 * Controller for budget analytics and reporting endpoints
 */
export declare class AnalyticsController {
  private analyticsEngine;
  /**
   * Initialize analytics controller with dependencies
   */
  constructor();
  /**
   * Get comprehensive usage analytics
   * GET /api/budget/analytics
   */
  getAnalytics(req: AuthenticatedRequest, res: Response): Promise<void>;
  /**
   * Get usage trends and patterns
   * GET /api/budget/analytics/trends
   */
  getTrends(req: AuthenticatedRequest, res: Response): Promise<void>;
  /**
   * Get cost predictions and forecasts
   * GET /api/budget/analytics/predictions
   */
  getPredictions(req: AuthenticatedRequest, res: Response): Promise<void>;
  /**
   * Get detailed cost breakdown
   * GET /api/budget/analytics/breakdown
   */
  getCostBreakdown(req: AuthenticatedRequest, res: Response): Promise<void>;
  /**
   * Run custom analytics query
   * POST /api/budget/analytics/custom
   */
  runCustomAnalytics(req: AuthenticatedRequest, res: Response): Promise<void>;
  /**
   * Generate insights from trend data
   */
  private generateTrendInsights;
  /**
   * Enrich breakdown data with percentages and rankings
   */
  private enrichBreakdownData;
}
export {};
