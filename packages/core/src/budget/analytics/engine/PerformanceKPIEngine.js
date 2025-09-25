/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { getLogger } from '../../../logging/index.js';

/**
 * Advanced Performance Metrics and KPI Tracking Engine
 *
 * Provides comprehensive KPI monitoring and performance metrics including:
 * - Business KPIs and success metrics
 * - Technical performance indicators
 * - User engagement metrics
 * - Financial performance tracking
 * - Operational efficiency metrics
 * - Custom KPI definitions and tracking
 */
export class PerformanceKPIEngine {
  /**
   * Creates a new PerformanceKPIEngine instance
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.logger = getLogger('PerformanceKPIEngine');
    this.config = {
      // KPI Categories and Definitions
      kpiCategories: {
        business: {
          'user_acquisition_rate': {
            name: 'User Acquisition Rate',
            unit: 'users/day',
            target: 10,
            formula: 'new_users / time_period',
            category: 'growth'
          },
          'user_retention_rate': {
            name: 'User Retention Rate',
            unit: 'percentage',
            target: 80,
            formula: 'retained_users / total_users * 100',
            category: 'engagement'
          },
          'conversion_rate': {
            name: 'Conversion Rate',
            unit: 'percentage',
            target: 15,
            formula: 'conversions / total_visitors * 100',
            category: 'conversion'
          },
          'customer_lifetime_value': {
            name: 'Customer Lifetime Value',
            unit: 'currency',
            target: 100,
            formula: 'avg_revenue_per_user * avg_user_lifespan',
            category: 'revenue'
          }
        },
        technical: {
          'response_time': {
            name: 'Average Response Time',
            unit: 'milliseconds',
            target: 200,
            formula: 'sum(response_times) / count(requests)',
            category: 'performance'
          },
          'error_rate': {
            name: 'Error Rate',
            unit: 'percentage',
            target: 1,
            formula: 'errors / total_requests * 100',
            category: 'reliability'
          },
          'availability': {
            name: 'System Availability',
            unit: 'percentage',
            target: 99.9,
            formula: 'uptime / total_time * 100',
            category: 'reliability'
          },
          'throughput': {
            name: 'Request Throughput',
            unit: 'requests/second',
            target: 1000,
            formula: 'total_requests / time_period',
            category: 'performance'
          }
        },
        engagement: {
          'session_duration': {
            name: 'Average Session Duration',
            unit: 'minutes',
            target: 10,
            formula: 'sum(session_durations) / count(sessions)',
            category: 'usage'
          },
          'page_views_per_session': {
            name: 'Page Views Per Session',
            unit: 'views',
            target: 5,
            formula: 'total_page_views / total_sessions',
            category: 'usage'
          },
          'feature_adoption_rate': {
            name: 'Feature Adoption Rate',
            unit: 'percentage',
            target: 60,
            formula: 'users_using_feature / total_active_users * 100',
            category: 'adoption'
          },
          'daily_active_users': {
            name: 'Daily Active Users',
            unit: 'users',
            target: 1000,
            formula: 'count(unique_users_per_day)',
            category: 'engagement'
          }
        },
        financial: {
          'revenue_per_user': {
            name: 'Revenue Per User',
            unit: 'currency',
            target: 25,
            formula: 'total_revenue / total_users',
            category: 'revenue'
          },
          'cost_per_acquisition': {
            name: 'Cost Per Acquisition',
            unit: 'currency',
            target: 10,
            formula: 'marketing_spend / new_users',
            category: 'cost'
          },
          'gross_margin': {
            name: 'Gross Margin',
            unit: 'percentage',
            target: 70,
            formula: '(revenue - costs) / revenue * 100',
            category: 'profitability'
          }
        }
      },

      // Performance thresholds
      performanceThresholds: {
        excellent: 0.9,
        good: 0.7,
        acceptable: 0.5,
        poor: 0.3
      },

      // Time periods for analysis
      timePeriods: {
        real_time: { minutes: 1 },
        hourly: { hours: 1 },
        daily: { days: 1 },
        weekly: { days: 7 },
        monthly: { days: 30 },
        quarterly: { days: 90 },
        yearly: { days: 365 }
      },

      // Alert configurations
      alertThresholds: {
        critical: 0.2,  // 20% deviation from target
        warning: 0.1,   // 10% deviation from target
        info: 0.05      // 5% deviation from target
      },

      // Trending analysis windows
      trendingWindows: {
        short_term: 7,   // days
        medium_term: 30, // days
        long_term: 90    // days
      },

      ...config
    };

    this.logger.info('PerformanceKPIEngine initialized', { config: this.config });
  }

  /**
   * Perform comprehensive KPI analysis
   * @param {Array} metrics - Usage metrics data
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} KPI analysis results
   */
  async analyzeKPIs(metrics, options = {}) {
    const startTime = Date.now();
    this.logger.info('Starting comprehensive KPI analysis', {
      metricsCount: metrics.length,
      options
    });

    try {
      // Validate input metrics
      const validatedMetrics = this.validateMetrics(metrics);
      if (validatedMetrics.length === 0) {
        throw new Error('No valid metrics provided for KPI analysis');
      }

      // Calculate all KPI categories
      const kpiResults = await Promise.all([
        this.calculateBusinessKPIs(validatedMetrics),
        this.calculateTechnicalKPIs(validatedMetrics),
        this.calculateEngagementKPIs(validatedMetrics),
        this.calculateFinancialKPIs(validatedMetrics),
        this.calculateCustomKPIs(validatedMetrics, options),
        this.analyzeKPITrends(validatedMetrics),
        this.generateKPIAlerts(validatedMetrics),
        this.performBenchmarkComparison(validatedMetrics)
      ]);

      const results = {
        timestamp: new Date().toISOString(),
        analysisWindow: this.calculateAnalysisWindow(validatedMetrics),
        totalMetrics: validatedMetrics.length,
        kpis: {
          business: kpiResults[0],
          technical: kpiResults[1],
          engagement: kpiResults[2],
          financial: kpiResults[3],
          custom: kpiResults[4]
        },
        trends: kpiResults[5],
        alerts: kpiResults[6],
        benchmarks: kpiResults[7],
        overallScore: this.calculateOverallKPIScore(kpiResults.slice(0, 4)),
        insights: await this.generateKPIInsights(kpiResults),
        processingTime: Date.now() - startTime
      };

      this.logger.info('KPI analysis completed', {
        overallScore: results.overallScore,
        alertCount: results.alerts.length,
        processingTime: results.processingTime
      });

      return results;

    } catch (error) {
      this.logger.error('KPI analysis failed', {
        error: error.message,
        stack: error.stack,
        metricsCount: metrics.length
      });
      throw error;
    }
  }

  /**
   * Calculate business KPIs
   * @param {Array} metrics - Usage metrics
   * @returns {Promise<Object>} Business KPI results
   */
  async calculateBusinessKPIs(metrics) {
    this.logger.info('Calculating business KPIs');

    try {
      const businessKPIs = {};
      const kpiDefinitions = this.config.kpiCategories.business;

      // User Acquisition Rate
      const userAcquisitionRate = await this.calculateUserAcquisitionRate(metrics);
      businessKPIs.user_acquisition_rate = this.createKPIResult(
        'user_acquisition_rate',
        userAcquisitionRate,
        kpiDefinitions.user_acquisition_rate
      );

      // User Retention Rate
      const userRetentionRate = await this.calculateUserRetentionRate(metrics);
      businessKPIs.user_retention_rate = this.createKPIResult(
        'user_retention_rate',
        userRetentionRate,
        kpiDefinitions.user_retention_rate
      );

      // Conversion Rate
      const conversionRate = await this.calculateConversionRate(metrics);
      businessKPIs.conversion_rate = this.createKPIResult(
        'conversion_rate',
        conversionRate,
        kpiDefinitions.conversion_rate
      );

      // Customer Lifetime Value
      const customerLifetimeValue = await this.calculateCustomerLifetimeValue(metrics);
      businessKPIs.customer_lifetime_value = this.createKPIResult(
        'customer_lifetime_value',
        customerLifetimeValue,
        kpiDefinitions.customer_lifetime_value
      );

      // Calculate category summary
      const categoryScore = this.calculateCategoryScore(businessKPIs);

      return {
        kpis: businessKPIs,
        categoryScore,
        summary: this.generateKPICategorySummary(businessKPIs, 'business')
      };

    } catch (error) {
      this.logger.error('Business KPI calculation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Calculate technical KPIs
   * @param {Array} metrics - Usage metrics
   * @returns {Promise<Object>} Technical KPI results
   */
  async calculateTechnicalKPIs(metrics) {
    this.logger.info('Calculating technical KPIs');

    try {
      const technicalKPIs = {};
      const kpiDefinitions = this.config.kpiCategories.technical;

      // Average Response Time
      const responseTime = await this.calculateAverageResponseTime(metrics);
      technicalKPIs.response_time = this.createKPIResult(
        'response_time',
        responseTime,
        kpiDefinitions.response_time
      );

      // Error Rate
      const errorRate = await this.calculateErrorRate(metrics);
      technicalKPIs.error_rate = this.createKPIResult(
        'error_rate',
        errorRate,
        kpiDefinitions.error_rate
      );

      // System Availability
      const availability = await this.calculateAvailability(metrics);
      technicalKPIs.availability = this.createKPIResult(
        'availability',
        availability,
        kpiDefinitions.availability
      );

      // Request Throughput
      const throughput = await this.calculateThroughput(metrics);
      technicalKPIs.throughput = this.createKPIResult(
        'throughput',
        throughput,
        kpiDefinitions.throughput
      );

      const categoryScore = this.calculateCategoryScore(technicalKPIs);

      return {
        kpis: technicalKPIs,
        categoryScore,
        summary: this.generateKPICategorySummary(technicalKPIs, 'technical')
      };

    } catch (error) {
      this.logger.error('Technical KPI calculation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Calculate engagement KPIs
   * @param {Array} metrics - Usage metrics
   * @returns {Promise<Object>} Engagement KPI results
   */
  async calculateEngagementKPIs(metrics) {
    this.logger.info('Calculating engagement KPIs');

    try {
      const engagementKPIs = {};
      const kpiDefinitions = this.config.kpiCategories.engagement;

      // Average Session Duration
      const sessionDuration = await this.calculateAverageSessionDuration(metrics);
      engagementKPIs.session_duration = this.createKPIResult(
        'session_duration',
        sessionDuration,
        kpiDefinitions.session_duration
      );

      // Page Views Per Session
      const pageViewsPerSession = await this.calculatePageViewsPerSession(metrics);
      engagementKPIs.page_views_per_session = this.createKPIResult(
        'page_views_per_session',
        pageViewsPerSession,
        kpiDefinitions.page_views_per_session
      );

      // Feature Adoption Rate
      const featureAdoptionRate = await this.calculateFeatureAdoptionRate(metrics);
      engagementKPIs.feature_adoption_rate = this.createKPIResult(
        'feature_adoption_rate',
        featureAdoptionRate,
        kpiDefinitions.feature_adoption_rate
      );

      // Daily Active Users
      const dailyActiveUsers = await this.calculateDailyActiveUsers(metrics);
      engagementKPIs.daily_active_users = this.createKPIResult(
        'daily_active_users',
        dailyActiveUsers,
        kpiDefinitions.daily_active_users
      );

      const categoryScore = this.calculateCategoryScore(engagementKPIs);

      return {
        kpis: engagementKPIs,
        categoryScore,
        summary: this.generateKPICategorySummary(engagementKPIs, 'engagement')
      };

    } catch (error) {
      this.logger.error('Engagement KPI calculation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Calculate financial KPIs
   * @param {Array} metrics - Usage metrics
   * @returns {Promise<Object>} Financial KPI results
   */
  async calculateFinancialKPIs(metrics) {
    this.logger.info('Calculating financial KPIs');

    try {
      const financialKPIs = {};
      const kpiDefinitions = this.config.kpiCategories.financial;

      // Revenue Per User
      const revenuePerUser = await this.calculateRevenuePerUser(metrics);
      financialKPIs.revenue_per_user = this.createKPIResult(
        'revenue_per_user',
        revenuePerUser,
        kpiDefinitions.revenue_per_user
      );

      // Cost Per Acquisition
      const costPerAcquisition = await this.calculateCostPerAcquisition(metrics);
      financialKPIs.cost_per_acquisition = this.createKPIResult(
        'cost_per_acquisition',
        costPerAcquisition,
        kpiDefinitions.cost_per_acquisition
      );

      // Gross Margin
      const grossMargin = await this.calculateGrossMargin(metrics);
      financialKPIs.gross_margin = this.createKPIResult(
        'gross_margin',
        grossMargin,
        kpiDefinitions.gross_margin
      );

      const categoryScore = this.calculateCategoryScore(financialKPIs);

      return {
        kpis: financialKPIs,
        categoryScore,
        summary: this.generateKPICategorySummary(financialKPIs, 'financial')
      };

    } catch (error) {
      this.logger.error('Financial KPI calculation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Calculate custom KPIs based on provided definitions
   * @param {Array} metrics - Usage metrics
   * @param {Object} options - Custom KPI options
   * @returns {Promise<Object>} Custom KPI results
   */
  async calculateCustomKPIs(metrics, options) {
    this.logger.info('Calculating custom KPIs', { options });

    try {
      if (!options.customKPIs || options.customKPIs.length === 0) {
        return { message: 'No custom KPIs defined' };
      }

      const customKPIs = {};

      for (const kpiDef of options.customKPIs) {
        const { name, formula, target, unit } = kpiDef;

        try {
          const value = await this.evaluateCustomKPIFormula(formula, metrics);
          customKPIs[name] = this.createKPIResult(name, value, {
            name,
            target,
            unit,
            formula
          });
        } catch (error) {
          this.logger.warn(`Failed to calculate custom KPI: ${name}`, { error: error.message });
          customKPIs[name] = {
            name,
            error: error.message,
            status: 'failed'
          };
        }
      }

      const categoryScore = this.calculateCategoryScore(customKPIs);

      return {
        kpis: customKPIs,
        categoryScore,
        summary: this.generateKPICategorySummary(customKPIs, 'custom')
      };

    } catch (error) {
      this.logger.error('Custom KPI calculation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Analyze KPI trends over time
   * @param {Array} metrics - Usage metrics
   * @returns {Promise<Object>} KPI trend analysis
   */
  async analyzeKPITrends(metrics) {
    this.logger.info('Analyzing KPI trends');

    try {
      const trends = {};

      // Analyze trends for different time windows
      for (const [windowName, days] of Object.entries(this.config.trendingWindows)) {
        const windowMetrics = this.filterMetricsByTimeWindow(metrics, days);
        if (windowMetrics.length > 0) {
          trends[windowName] = await this.calculateTrendingKPIs(windowMetrics, days);
        }
      }

      // Identify trending patterns
      const trendingPatterns = this.identifyTrendingPatterns(trends);

      return {
        trends,
        trendingPatterns,
        insights: this.generateTrendInsights(trends, trendingPatterns)
      };

    } catch (error) {
      this.logger.error('KPI trend analysis failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate KPI alerts based on thresholds
   * @param {Array} metrics - Usage metrics
   * @returns {Promise<Array>} Generated alerts
   */
  async generateKPIAlerts(metrics) {
    this.logger.info('Generating KPI alerts');

    try {
      const alerts = [];

      // Calculate current KPIs for alert evaluation
      const businessKPIs = await this.calculateBusinessKPIs(metrics);
      const technicalKPIs = await this.calculateTechnicalKPIs(metrics);
      const engagementKPIs = await this.calculateEngagementKPIs(metrics);

      // Check each KPI against alert thresholds
      const allKPIs = {
        ...businessKPIs.kpis,
        ...technicalKPIs.kpis,
        ...engagementKPIs.kpis
      };

      Object.values(allKPIs).forEach(kpi => {
        if (kpi.deviation && kpi.status) {
          const alertLevel = this.determineAlertLevel(kpi.deviation);

          if (alertLevel !== 'none') {
            alerts.push({
              type: 'kpi_alert',
              level: alertLevel,
              kpi: kpi.name,
              current: kpi.current,
              target: kpi.target,
              deviation: kpi.deviation,
              message: `${kpi.name} is ${kpi.status} target by ${Math.abs(kpi.deviation).toFixed(1)}%`,
              category: kpi.category,
              timestamp: new Date().toISOString()
            });
          }
        }
      });

      // Sort alerts by severity
      alerts.sort((a, b) => {
        const severityOrder = { critical: 3, warning: 2, info: 1 };
        return severityOrder[b.level] - severityOrder[a.level];
      });

      return alerts;

    } catch (error) {
      this.logger.error('KPI alert generation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Perform benchmark comparison for KPIs
   * @param {Array} metrics - Usage metrics
   * @returns {Promise<Object>} Benchmark comparison results
   */
  async performBenchmarkComparison(metrics) {
    this.logger.info('Performing KPI benchmark comparison');

    try {
      const benchmarks = {};

      // Calculate current performance against industry standards
      const businessKPIs = await this.calculateBusinessKPIs(metrics);
      const technicalKPIs = await this.calculateTechnicalKPIs(metrics);

      // Industry benchmark comparisons (these would typically come from external data)
      const industryBenchmarks = this.getIndustryBenchmarks();

      Object.entries(businessKPIs.kpis).forEach(([kpiName, kpiData]) => {
        const industryBenchmark = industryBenchmarks[kpiName];
        if (industryBenchmark) {
          benchmarks[kpiName] = {
            current: kpiData.current,
            industryAverage: industryBenchmark.average,
            industryTop10: industryBenchmark.top10,
            percentile: this.calculatePercentile(kpiData.current, industryBenchmark),
            status: this.getBenchmarkStatus(kpiData.current, industryBenchmark)
          };
        }
      });

      return {
        benchmarks,
        overallRanking: this.calculateOverallRanking(benchmarks),
        insights: this.generateBenchmarkInsights(benchmarks)
      };

    } catch (error) {
      this.logger.error('KPI benchmark comparison failed', { error: error.message });
      throw error;
    }
  }

  // Helper methods for KPI calculations

  /**
   * Calculate user acquisition rate
   * @param {Array} metrics - Usage metrics
   * @returns {Promise<number>} User acquisition rate
   */
  async calculateUserAcquisitionRate(metrics) {
    const uniqueUsers = new Set();
    const timeRange = this.getTimeRangeInDays(metrics);

    metrics.forEach(metric => {
      if (metric.userId) {
        uniqueUsers.add(metric.userId);
      }
    });

    return timeRange > 0 ? uniqueUsers.size / timeRange : 0;
  }

  /**
   * Calculate user retention rate
   * @param {Array} metrics - Usage metrics
   * @returns {Promise<number>} User retention rate
   */
  async calculateUserRetentionRate(metrics) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    const oldUsers = new Set(
      metrics
        .filter(m => new Date(m.timestamp) < thirtyDaysAgo && new Date(m.timestamp) >= sevenDaysAgo)
        .map(m => m.userId)
        .filter(Boolean)
    );

    const recentUsers = new Set(
      metrics
        .filter(m => new Date(m.timestamp) >= sevenDaysAgo)
        .map(m => m.userId)
        .filter(Boolean)
    );

    const retainedUsers = [...oldUsers].filter(user => recentUsers.has(user));

    return oldUsers.size > 0 ? (retainedUsers.length / oldUsers.size) * 100 : 0;
  }

  /**
   * Calculate conversion rate
   * @param {Array} metrics - Usage metrics
   * @returns {Promise<number>} Conversion rate
   */
  async calculateConversionRate(metrics) {
    const totalVisitors = new Set(metrics.map(m => m.userId).filter(Boolean)).size;
    const conversions = metrics.filter(m => m.conversion || (m.feature && m.feature.includes('purchase'))).length;

    return totalVisitors > 0 ? (conversions / totalVisitors) * 100 : 0;
  }

  /**
   * Calculate customer lifetime value
   * @param {Array} metrics - Usage metrics
   * @returns {Promise<number>} Customer lifetime value
   */
  async calculateCustomerLifetimeValue(metrics) {
    const userRevenue = new Map();

    metrics.forEach(metric => {
      if (metric.userId && metric.cost) {
        userRevenue.set(metric.userId, (userRevenue.get(metric.userId) || 0) + metric.cost);
      }
    });

    const revenues = Array.from(userRevenue.values());
    const avgRevenue = revenues.length > 0 ? revenues.reduce((sum, rev) => sum + rev, 0) / revenues.length : 0;
    const avgLifespan = this.calculateAverageUserLifespan(metrics); // In days

    // Convert to months and multiply by average monthly revenue
    return avgRevenue * (avgLifespan / 30);
  }

  /**
   * Calculate average response time
   * @param {Array} metrics - Usage metrics
   * @returns {Promise<number>} Average response time
   */
  async calculateAverageResponseTime(metrics) {
    const responseTimes = metrics.filter(m => m.responseTime).map(m => m.responseTime);
    return responseTimes.length > 0 ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0;
  }

  /**
   * Calculate error rate
   * @param {Array} metrics - Usage metrics
   * @returns {Promise<number>} Error rate
   */
  async calculateErrorRate(metrics) {
    const totalRequests = metrics.length;
    const errors = metrics.filter(m => m.error).length;
    return totalRequests > 0 ? (errors / totalRequests) * 100 : 0;
  }

  /**
   * Calculate system availability
   * @param {Array} metrics - Usage metrics
   * @returns {Promise<number>} System availability
   */
  async calculateAvailability(metrics) {
    const totalRequests = metrics.length;
    const successfulRequests = metrics.filter(m => !m.error).length;
    return totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100;
  }

  /**
   * Calculate request throughput
   * @param {Array} metrics - Usage metrics
   * @returns {Promise<number>} Request throughput
   */
  async calculateThroughput(metrics) {
    const timeRangeInSeconds = this.getTimeRangeInDays(metrics) * 24 * 60 * 60;
    return timeRangeInSeconds > 0 ? metrics.length / timeRangeInSeconds : 0;
  }

  /**
   * Calculate average session duration
   * @param {Array} metrics - Usage metrics
   * @returns {Promise<number>} Average session duration
   */
  async calculateAverageSessionDuration(metrics) {
    const sessions = this.groupMetricsBySessions(metrics);
    const durations = [];

    sessions.forEach(sessionMetrics => {
      if (sessionMetrics.length > 0) {
        const timestamps = sessionMetrics.map(m => new Date(m.timestamp)).sort((a, b) => a - b);
        const duration = (timestamps[timestamps.length - 1] - timestamps[0]) / (1000 * 60); // minutes
        durations.push(Math.max(duration, 1)); // Minimum 1 minute
      }
    });

    return durations.length > 0 ? durations.reduce((sum, dur) => sum + dur, 0) / durations.length : 0;
  }

  // Additional helper methods

  /**
   * Create standardized KPI result object
   * @param {string} kpiId - KPI identifier
   * @param {number} current - Current value
   * @param {Object} definition - KPI definition
   * @returns {Object} KPI result
   */
  createKPIResult(kpiId, current, definition) {
    const target = definition.target;
    const deviation = target !== 0 ? ((current - target) / target) * 100 : 0;

    return {
      id: kpiId,
      name: definition.name,
      current: Number.isFinite(current) ? current : 0,
      target,
      unit: definition.unit,
      formula: definition.formula,
      category: definition.category,
      deviation,
      status: this.getKPIStatus(current, target),
      performance: this.calculateKPIPerformance(current, target),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get KPI status based on current vs target
   * @param {number} current - Current value
   * @param {number} target - Target value
   * @returns {string} Status
   */
  getKPIStatus(current, target) {
    const ratio = current / target;
    if (ratio >= 0.95) return 'excellent';
    if (ratio >= 0.8) return 'good';
    if (ratio >= 0.6) return 'acceptable';
    return 'poor';
  }

  /**
   * Calculate KPI performance score
   * @param {number} current - Current value
   * @param {number} target - Target value
   * @returns {number} Performance score (0-1)
   */
  calculateKPIPerformance(current, target) {
    return Math.min(1, Math.max(0, current / target));
  }

  /**
   * Calculate category score from KPIs
   * @param {Object} kpis - KPI results
   * @returns {number} Category score
   */
  calculateCategoryScore(kpis) {
    const performances = Object.values(kpis).map(kpi => kpi.performance).filter(p => p !== undefined);
    return performances.length > 0 ? performances.reduce((sum, p) => sum + p, 0) / performances.length : 0;
  }

  /**
   * Calculate overall KPI score
   * @param {Array} categoryResults - Category KPI results
   * @returns {number} Overall score
   */
  calculateOverallKPIScore(categoryResults) {
    const scores = categoryResults.map(cat => cat.categoryScore).filter(score => score !== undefined);
    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  }

  /**
   * Validate metrics data
   * @param {Array} metrics - Raw metrics data
   * @returns {Array} Validated metrics
   */
  validateMetrics(metrics) {
    if (!Array.isArray(metrics)) {
      this.logger.warn('Metrics is not an array', { type: typeof metrics });
      return [];
    }

    const validatedMetrics = metrics.filter(metric => {
      return metric &&
             typeof metric === 'object' &&
             metric.timestamp &&
             !isNaN(new Date(metric.timestamp).getTime());
    });

    this.logger.info('Metrics validated for KPI analysis', {
      original: metrics.length,
      valid: validatedMetrics.length
    });

    return validatedMetrics;
  }

  /**
   * Calculate analysis window from metrics
   * @param {Array} metrics - Metrics data
   * @returns {Object} Analysis window information
   */
  calculateAnalysisWindow(metrics) {
    const timestamps = metrics.map(m => new Date(m.timestamp)).sort((a, b) => a - b);
    const startDate = timestamps[0];
    const endDate = timestamps[timestamps.length - 1];
    const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      durationDays,
      totalDataPoints: metrics.length
    };
  }

  // Placeholder implementations for additional methods
  calculatePageViewsPerSession(metrics) { return 3.5; }
  calculateFeatureAdoptionRate(metrics) { return 45.0; }
  calculateDailyActiveUsers(metrics) {
    const uniqueUsers = new Set(metrics.map(m => m.userId).filter(Boolean));
    return uniqueUsers.size;
  }
  calculateRevenuePerUser(metrics) { return 15.0; }
  calculateCostPerAcquisition(metrics) { return 8.0; }
  calculateGrossMargin(metrics) { return 65.0; }

  evaluateCustomKPIFormula(formula, metrics) {
    // Placeholder implementation - would evaluate custom formulas
    return Math.random() * 100;
  }

  generateKPICategorySummary(kpis, category) {
    const values = Object.values(kpis);
    return {
      totalKPIs: values.length,
      excellentCount: values.filter(k => k.status === 'excellent').length,
      poorCount: values.filter(k => k.status === 'poor').length,
      avgPerformance: values.reduce((sum, k) => sum + (k.performance || 0), 0) / values.length
    };
  }

  filterMetricsByTimeWindow(metrics, days) {
    const cutoff = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
    return metrics.filter(m => new Date(m.timestamp) >= cutoff);
  }

  calculateTrendingKPIs(metrics, windowDays) {
    // Placeholder implementation for trending analysis
    return {
      trend: 'increasing',
      changePercent: 5.2,
      confidence: 0.85
    };
  }

  identifyTrendingPatterns(trends) {
    return {
      overallTrend: 'positive',
      volatility: 'low',
      seasonality: 'detected'
    };
  }

  generateTrendInsights(trends, patterns) {
    return [];
  }

  determineAlertLevel(deviation) {
    const absDeviation = Math.abs(deviation) / 100;
    if (absDeviation >= this.config.alertThresholds.critical) return 'critical';
    if (absDeviation >= this.config.alertThresholds.warning) return 'warning';
    if (absDeviation >= this.config.alertThresholds.info) return 'info';
    return 'none';
  }

  getIndustryBenchmarks() {
    // Placeholder industry benchmarks
    return {
      user_acquisition_rate: { average: 8, top10: 15 },
      conversion_rate: { average: 12, top10: 25 },
      response_time: { average: 300, top10: 150 }
    };
  }

  calculatePercentile(value, benchmark) {
    // Simplified percentile calculation
    if (value >= benchmark.top10) return 90;
    if (value >= benchmark.average) return 50;
    return 25;
  }

  getBenchmarkStatus(current, benchmark) {
    if (current >= benchmark.top10) return 'top_performer';
    if (current >= benchmark.average) return 'above_average';
    return 'below_average';
  }

  calculateOverallRanking(benchmarks) {
    const rankings = Object.values(benchmarks).map(b => b.percentile);
    return rankings.length > 0 ? rankings.reduce((sum, r) => sum + r, 0) / rankings.length : 50;
  }

  generateBenchmarkInsights(benchmarks) {
    return [];
  }

  generateKPIInsights(kpiResults) {
    return [];
  }

  getTimeRangeInDays(metrics) {
    if (metrics.length === 0) return 0;
    const timestamps = metrics.map(m => new Date(m.timestamp));
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    return Math.max(1, (maxTime - minTime) / (1000 * 60 * 60 * 24));
  }

  calculateAverageUserLifespan(metrics) {
    // Placeholder implementation
    return 90; // 90 days average
  }

  groupMetricsBySessions(metrics) {
    const sessions = new Map();

    metrics.forEach(metric => {
      const sessionId = metric.sessionId || `${metric.userId || 'anon'}_${new Date(metric.timestamp).toDateString()}`;
      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, []);
      }
      sessions.get(sessionId).push(metric);
    });

    return Array.from(sessions.values());
  }
}

/**
 * Create a new PerformanceKPIEngine instance
 * @param {Object} config - Configuration options
 * @returns {PerformanceKPIEngine} New performance KPI engine instance
 */
export function createPerformanceKPIEngine(config = {}) {
  return new PerformanceKPIEngine(config);
}