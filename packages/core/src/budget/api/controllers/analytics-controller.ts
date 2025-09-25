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

import { Request, Response } from 'express';
import { Logger } from '../../../../../src/utils/logger.js';
import { BudgetSettings } from '../../types.js';
import { getBudgetTracker } from '../../budget-tracker.js';
import { getMLBudgetAPI } from '../../api/ml-budget-api.js';
import { AnalyticsEngine } from '../../analytics/AnalyticsEngine.js';

const logger = new Logger('AnalyticsController');

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
 * Analytics query interface
 */
interface AnalyticsQuery {
  startDate?: string;
  endDate?: string;
  granularity?: 'hour' | 'day' | 'week' | 'month';
  metrics?: string[];
  filters?: Record<string, any>;
  groupBy?: string;
}

/**
 * Controller for budget analytics and reporting endpoints
 */
export class AnalyticsController {
  private analyticsEngine: AnalyticsEngine;

  /**
   * Initialize analytics controller with dependencies
   */
  constructor() {
    logger.info('Initializing Analytics Controller', {
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });

    this.analyticsEngine = new AnalyticsEngine();
  }

  /**
   * Get comprehensive usage analytics
   * GET /api/budget/analytics
   */
  async getAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    const startTime = Date.now();
    const query: AnalyticsQuery = req.query;

    logger.info('Analytics data requested', {
      userId: req.user?.id,
      query,
      timestamp: new Date().toISOString()
    });

    try {
      const budgetTracker = await getBudgetTracker();
      if (!budgetTracker) {
        res.status(503).json({
          success: false,
          error: 'Analytics service unavailable'
        });
        return;
      }

      // Set default time range if not provided
      const endDate = query.endDate || new Date().toISOString();
      const startDate = query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Generate analytics data
      const analyticsData = await this.analyticsEngine.generateAnalytics({
        startDate,
        endDate,
        granularity: query.granularity || 'day',
        filters: query.filters || {},
        groupBy: query.groupBy
      });

      // Get ML-enhanced predictions if available
      const mlAPI = getMLBudgetAPI();
      let mlAnalytics = null;

      try {
        const [mlForecast, mlOptimization] = await Promise.all([
          mlAPI.generateForecast({
            projectRoot: process.cwd(),
            settings: await budgetTracker.getSettings(),
            forecastHours: 24
          }),
          mlAPI.getOptimizationSuggestions({
            projectRoot: process.cwd(),
            settings: await budgetTracker.getSettings()
          })
        ]);

        if (mlForecast.success && mlOptimization.success) {
          mlAnalytics = {
            forecast: mlForecast.data,
            optimization: mlOptimization.data
          };
        }
      } catch (mlError) {
        logger.warn('ML analytics unavailable', {
          error: mlError instanceof Error ? mlError.message : 'Unknown ML error'
        });
      }

      const responseTime = Date.now() - startTime;
      const response = {
        success: true,
        data: {
          analytics: analyticsData,
          mlEnhancedAnalytics: mlAnalytics,
          timeRange: {
            startDate,
            endDate,
            granularity: query.granularity || 'day'
          },
          metadata: {
            timestamp: new Date().toISOString(),
            responseTime,
            dataPoints: analyticsData.dataPoints?.length || 0
          }
        }
      };

      logger.info('Analytics data generated successfully', {
        responseTime,
        dataPoints: analyticsData.dataPoints?.length || 0,
        hasMlData: mlAnalytics !== null
      });

      res.status(200).json(response);

    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Failed to generate analytics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to generate analytics',
        timestamp: new Date().toISOString(),
        responseTime
      });
    }
  }

  /**
   * Get usage trends and patterns
   * GET /api/budget/analytics/trends
   */
  async getTrends(req: AuthenticatedRequest, res: Response): Promise<void> {
    const startTime = Date.now();
    const query: AnalyticsQuery = req.query;

    logger.info('Trends analysis requested', {
      userId: req.user?.id,
      query,
      timestamp: new Date().toISOString()
    });

    try {
      const budgetTracker = await getBudgetTracker();
      if (!budgetTracker) {
        res.status(503).json({
          success: false,
          error: 'Trends analysis service unavailable'
        });
        return;
      }

      // Analyze trends using ML API
      const mlAPI = getMLBudgetAPI();
      const anomalies = await mlAPI.detectAnomalies({
        projectRoot: process.cwd(),
        settings: await budgetTracker.getSettings()
      });

      // Generate trend analytics
      const trendData = await this.analyticsEngine.analyzeTrends({
        startDate: query.startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: query.endDate || new Date().toISOString(),
        granularity: query.granularity || 'day'
      });

      const responseTime = Date.now() - startTime;
      const response = {
        success: true,
        data: {
          trends: trendData,
          patterns: anomalies.success ? anomalies.data?.patterns : null,
          anomalies: anomalies.success ? anomalies.data?.anomalies : null,
          insights: this.generateTrendInsights(trendData, anomalies.data),
          metadata: {
            timestamp: new Date().toISOString(),
            responseTime,
            analysisRange: {
              startDate: query.startDate,
              endDate: query.endDate
            }
          }
        }
      };

      logger.info('Trends analysis completed successfully', {
        responseTime,
        trendsCount: trendData?.trends?.length || 0,
        anomaliesCount: anomalies.data?.anomalies?.length || 0
      });

      res.status(200).json(response);

    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Failed to analyze trends', {
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to analyze trends',
        timestamp: new Date().toISOString(),
        responseTime
      });
    }
  }

  /**
   * Get cost predictions and forecasts
   * GET /api/budget/analytics/predictions
   */
  async getPredictions(req: AuthenticatedRequest, res: Response): Promise<void> {
    const startTime = Date.now();
    const { forecastHours = 24, confidenceLevel = 0.95 } = req.query;

    logger.info('Cost predictions requested', {
      userId: req.user?.id,
      forecastHours,
      confidenceLevel,
      timestamp: new Date().toISOString()
    });

    try {
      const budgetTracker = await getBudgetTracker();
      if (!budgetTracker) {
        res.status(503).json({
          success: false,
          error: 'Predictions service unavailable'
        });
        return;
      }

      // Generate ML-based predictions
      const mlAPI = getMLBudgetAPI();
      const forecast = await mlAPI.generateForecast({
        projectRoot: process.cwd(),
        settings: await budgetTracker.getSettings(),
        forecastHours: parseInt(forecastHours as string)
      });

      // Generate optimization recommendations
      const optimization = await mlAPI.getOptimizationSuggestions({
        projectRoot: process.cwd(),
        settings: await budgetTracker.getSettings()
      });

      // Get model performance metrics
      const modelMetrics = await mlAPI.getModelMetrics({
        projectRoot: process.cwd(),
        settings: await budgetTracker.getSettings()
      });

      const responseTime = Date.now() - startTime;
      const response = {
        success: true,
        data: {
          forecast: forecast.data,
          optimization: optimization.data,
          modelMetrics: modelMetrics.data,
          predictionQuality: {
            accuracy: modelMetrics.data?.overallAccuracy || 0,
            confidenceLevel: parseFloat(confidenceLevel as string),
            dataQuality: modelMetrics.data?.dataQuality
          },
          metadata: {
            timestamp: new Date().toISOString(),
            responseTime,
            forecastHorizon: parseInt(forecastHours as string)
          }
        }
      };

      logger.info('Cost predictions generated successfully', {
        responseTime,
        forecastPoints: forecast.data?.forecast?.length || 0,
        modelAccuracy: modelMetrics.data?.overallAccuracy || 0
      });

      res.status(200).json(response);

    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Failed to generate predictions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to generate predictions',
        timestamp: new Date().toISOString(),
        responseTime
      });
    }
  }

  /**
   * Get detailed cost breakdown
   * GET /api/budget/analytics/breakdown
   */
  async getCostBreakdown(req: AuthenticatedRequest, res: Response): Promise<void> {
    const startTime = Date.now();
    const query: AnalyticsQuery = req.query;

    logger.info('Cost breakdown requested', {
      userId: req.user?.id,
      query,
      timestamp: new Date().toISOString()
    });

    try {
      const budgetTracker = await getBudgetTracker();
      if (!budgetTracker) {
        res.status(503).json({
          success: false,
          error: 'Cost breakdown service unavailable'
        });
        return;
      }

      // Generate detailed cost breakdown
      const breakdown = await this.analyticsEngine.generateCostBreakdown({
        startDate: query.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: query.endDate || new Date().toISOString(),
        groupBy: query.groupBy || 'feature',
        filters: query.filters || {}
      });

      // Calculate percentages and rankings
      const enrichedBreakdown = this.enrichBreakdownData(breakdown);

      const responseTime = Date.now() - startTime;
      const response = {
        success: true,
        data: {
          breakdown: enrichedBreakdown,
          summary: {
            totalCost: enrichedBreakdown.totalCost,
            totalRequests: enrichedBreakdown.totalRequests,
            averageCostPerRequest: enrichedBreakdown.totalCost / Math.max(enrichedBreakdown.totalRequests, 1),
            topCostDrivers: enrichedBreakdown.categories?.slice(0, 5) || []
          },
          metadata: {
            timestamp: new Date().toISOString(),
            responseTime,
            groupBy: query.groupBy || 'feature',
            categoriesCount: enrichedBreakdown.categories?.length || 0
          }
        }
      };

      logger.info('Cost breakdown generated successfully', {
        responseTime,
        totalCost: enrichedBreakdown.totalCost,
        categoriesCount: enrichedBreakdown.categories?.length || 0
      });

      res.status(200).json(response);

    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Failed to generate cost breakdown', {
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to generate cost breakdown',
        timestamp: new Date().toISOString(),
        responseTime
      });
    }
  }

  /**
   * Run custom analytics query
   * POST /api/budget/analytics/custom
   */
  async runCustomAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    const startTime = Date.now();
    const { query, aggregations, filters, customMetrics } = req.body;

    logger.info('Custom analytics requested', {
      userId: req.user?.id,
      queryType: typeof query,
      hasAggregations: !!aggregations,
      timestamp: new Date().toISOString()
    });

    try {
      const budgetTracker = await getBudgetTracker();
      if (!budgetTracker) {
        res.status(503).json({
          success: false,
          error: 'Custom analytics service unavailable'
        });
        return;
      }

      // Execute custom analytics query
      const results = await this.analyticsEngine.executeCustomQuery({
        query,
        aggregations: aggregations || {},
        filters: filters || {},
        customMetrics: customMetrics || []
      });

      const responseTime = Date.now() - startTime;
      const response = {
        success: true,
        data: {
          results,
          query: {
            originalQuery: query,
            appliedFilters: filters,
            aggregations,
            customMetrics
          },
          metadata: {
            timestamp: new Date().toISOString(),
            responseTime,
            resultCount: Array.isArray(results) ? results.length : 1,
            executedBy: req.user?.id
          }
        }
      };

      logger.info('Custom analytics completed successfully', {
        responseTime,
        resultCount: Array.isArray(results) ? results.length : 1
      });

      res.status(200).json(response);

    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Failed to execute custom analytics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to execute custom analytics',
        timestamp: new Date().toISOString(),
        responseTime
      });
    }
  }

  /**
   * Generate insights from trend data
   */
  private generateTrendInsights(trendData: any, anomalyData: any): string[] {
    const insights: string[] = [];

    if (trendData?.trends) {
      for (const trend of trendData.trends) {
        if (trend.direction === 'increasing' && trend.confidence > 0.8) {
          insights.push(`Cost trend is increasing with ${Math.round(trend.confidence * 100)}% confidence`);
        } else if (trend.direction === 'decreasing' && trend.confidence > 0.8) {
          insights.push(`Cost trend is decreasing with ${Math.round(trend.confidence * 100)}% confidence`);
        }
      }
    }

    if (anomalyData?.patterns?.seasonality?.detected) {
      insights.push(`Seasonal usage pattern detected with ${anomalyData.patterns.seasonality.period} period`);
    }

    if (anomalyData?.patterns?.volatility?.level === 'high') {
      insights.push('High cost volatility detected - consider implementing stronger budget controls');
    }

    return insights;
  }

  /**
   * Enrich breakdown data with percentages and rankings
   */
  private enrichBreakdownData(breakdown: any): any {
    if (!breakdown.categories || !Array.isArray(breakdown.categories)) {
      return breakdown;
    }

    const totalCost = breakdown.categories.reduce((sum: number, cat: any) => sum + (cat.cost || 0), 0);
    const totalRequests = breakdown.categories.reduce((sum: number, cat: any) => sum + (cat.requests || 0), 0);

    const enrichedCategories = breakdown.categories
      .map((category: any, index: number) => ({
        ...category,
        percentage: totalCost > 0 ? (category.cost / totalCost) * 100 : 0,
        rank: index + 1,
        averageCostPerRequest: category.requests > 0 ? category.cost / category.requests : 0
      }))
      .sort((a: any, b: any) => b.cost - a.cost) // Sort by cost descending
      .map((category: any, index: number) => ({
        ...category,
        rank: index + 1
      }));

    return {
      ...breakdown,
      categories: enrichedCategories,
      totalCost,
      totalRequests
    };
  }
}