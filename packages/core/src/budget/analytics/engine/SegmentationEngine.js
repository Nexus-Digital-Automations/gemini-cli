/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { getLogger } from '../../../logging/index.js';

/**
 * Advanced Usage Segmentation and Categorization Engine
 *
 * Provides comprehensive data segmentation capabilities for usage analytics including:
 * - User behavior segmentation
 * - Feature usage categorization
 * - Geographic and temporal segmentation
 * - Cost-based segmentation
 * - Custom segment analysis
 */
export class SegmentationEngine {
  /**
   * Creates a new SegmentationEngine instance
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.logger = getLogger('SegmentationEngine');
    this.config = {
      // Segmentation thresholds
      highUsageThreshold: 100,
      lowUsageThreshold: 10,
      highCostThreshold: 50.0,
      lowCostThreshold: 1.0,

      // Time-based segmentation
      businessHours: {
        start: 9,  // 9 AM
        end: 17    // 5 PM
      },

      // Geographic segmentation
      regionMapping: {
        'US': ['united states', 'usa', 'us'],
        'EU': ['europe', 'eu', 'germany', 'france', 'uk'],
        'ASIA': ['asia', 'japan', 'china', 'india', 'singapore']
      },

      // User behavior patterns
      behaviorPatterns: {
        power_user: { minRequests: 50, minFeatures: 5 },
        regular_user: { minRequests: 10, minFeatures: 2 },
        occasional_user: { minRequests: 1, minFeatures: 1 }
      },

      ...config
    };

    this.logger.info('SegmentationEngine initialized', { config: this.config });
  }

  /**
   * Perform comprehensive usage segmentation analysis
   * @param {Array} metrics - Usage metrics data
   * @param {Object} options - Segmentation options
   * @returns {Promise<Object>} Segmentation analysis results
   */
  async performSegmentation(metrics, options = {}) {
    const startTime = Date.now();
    this.logger.info('Starting comprehensive usage segmentation', {
      metricsCount: metrics.length,
      options
    });

    try {
      // Validate input metrics
      const validatedMetrics = this.validateMetrics(metrics);
      if (validatedMetrics.length === 0) {
        throw new Error('No valid metrics provided for segmentation analysis');
      }

      // Perform all segmentation analyses
      const segmentationResults = await Promise.all([
        this.segmentByUserBehavior(validatedMetrics),
        this.segmentByFeatureUsage(validatedMetrics),
        this.segmentByGeographic(validatedMetrics),
        this.segmentByTemporal(validatedMetrics),
        this.segmentByCostLevel(validatedMetrics),
        this.segmentByUsageFrequency(validatedMetrics),
        this.segmentBySessionDuration(validatedMetrics),
        this.segmentByDeviceType(validatedMetrics),
        this.performCustomSegmentation(validatedMetrics, options)
      ]);

      const results = {
        timestamp: new Date().toISOString(),
        totalMetrics: validatedMetrics.length,
        segmentations: {
          userBehavior: segmentationResults[0],
          featureUsage: segmentationResults[1],
          geographic: segmentationResults[2],
          temporal: segmentationResults[3],
          costLevel: segmentationResults[4],
          usageFrequency: segmentationResults[5],
          sessionDuration: segmentationResults[6],
          deviceType: segmentationResults[7],
          custom: segmentationResults[8]
        },
        crossSegmentAnalysis: await this.performCrossSegmentAnalysis(segmentationResults),
        segmentInsights: await this.generateSegmentInsights(segmentationResults),
        processingTime: Date.now() - startTime
      };

      this.logger.info('Segmentation analysis completed', {
        totalSegments: this.countTotalSegments(results.segmentations),
        processingTime: results.processingTime
      });

      return results;

    } catch (error) {
      this.logger.error('Segmentation analysis failed', {
        error: error.message,
        stack: error.stack,
        metricsCount: metrics.length
      });
      throw error;
    }
  }

  /**
   * Segment users by their behavior patterns
   * @param {Array} metrics - Usage metrics
   * @returns {Promise<Object>} User behavior segmentation
   */
  async segmentByUserBehavior(metrics) {
    this.logger.info('Performing user behavior segmentation');

    try {
      const userActivity = new Map();

      // Aggregate user activity
      metrics.forEach(metric => {
        const userId = metric.userId || 'anonymous';
        if (!userActivity.has(userId)) {
          userActivity.set(userId, {
            userId,
            totalRequests: 0,
            totalCost: 0,
            uniqueFeatures: new Set(),
            sessions: new Set(),
            firstSeen: metric.timestamp,
            lastSeen: metric.timestamp,
            averageSessionDuration: 0,
            peakUsageHour: null
          });
        }

        const user = userActivity.get(userId);
        user.totalRequests++;
        user.totalCost += (metric.cost || 0);
        if (metric.feature) user.uniqueFeatures.add(metric.feature);
        if (metric.sessionId) user.sessions.add(metric.sessionId);

        if (new Date(metric.timestamp) > new Date(user.lastSeen)) {
          user.lastSeen = metric.timestamp;
        }
        if (new Date(metric.timestamp) < new Date(user.firstSeen)) {
          user.firstSeen = metric.timestamp;
        }
      });

      // Categorize users by behavior
      const segments = {
        power_users: [],
        regular_users: [],
        occasional_users: [],
        dormant_users: [],
        new_users: []
      };

      const now = new Date();
      const daysSinceEpoch = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));

      userActivity.forEach(user => {
        user.uniqueFeatures = user.uniqueFeatures.size;
        user.sessions = user.sessions.size;

        const daysSinceLastSeen = Math.floor((now - new Date(user.lastSeen)) / (1000 * 60 * 60 * 24));
        const daysSinceFirstSeen = Math.floor((now - new Date(user.firstSeen)) / (1000 * 60 * 60 * 24));

        // Categorize based on usage patterns
        if (daysSinceLastSeen > 30) {
          segments.dormant_users.push(user);
        } else if (daysSinceFirstSeen <= 7) {
          segments.new_users.push(user);
        } else if (user.totalRequests >= this.config.behaviorPatterns.power_user.minRequests &&
                   user.uniqueFeatures >= this.config.behaviorPatterns.power_user.minFeatures) {
          segments.power_users.push(user);
        } else if (user.totalRequests >= this.config.behaviorPatterns.regular_user.minRequests &&
                   user.uniqueFeatures >= this.config.behaviorPatterns.regular_user.minFeatures) {
          segments.regular_users.push(user);
        } else {
          segments.occasional_users.push(user);
        }
      });

      // Calculate segment statistics
      const segmentStats = {};
      Object.keys(segments).forEach(segmentName => {
        const users = segments[segmentName];
        segmentStats[segmentName] = {
          count: users.length,
          percentage: users.length / userActivity.size * 100,
          avgRequests: users.reduce((sum, u) => sum + u.totalRequests, 0) / Math.max(users.length, 1),
          avgCost: users.reduce((sum, u) => sum + u.totalCost, 0) / Math.max(users.length, 1),
          avgFeatures: users.reduce((sum, u) => sum + u.uniqueFeatures, 0) / Math.max(users.length, 1)
        };
      });

      return {
        totalUsers: userActivity.size,
        segments,
        segmentStats,
        insights: this.generateBehaviorInsights(segmentStats)
      };

    } catch (error) {
      this.logger.error('User behavior segmentation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Segment usage by feature categories
   * @param {Array} metrics - Usage metrics
   * @returns {Promise<Object>} Feature usage segmentation
   */
  async segmentByFeatureUsage(metrics) {
    this.logger.info('Performing feature usage segmentation');

    try {
      const featureUsage = new Map();
      const featureCategories = {
        core: ['auth', 'login', 'user', 'profile'],
        analytics: ['report', 'dashboard', 'chart', 'analytics'],
        integration: ['api', 'webhook', 'sync', 'import', 'export'],
        admin: ['admin', 'config', 'settings', 'manage'],
        experimental: ['beta', 'preview', 'experimental', 'test']
      };

      // Aggregate feature usage
      metrics.forEach(metric => {
        const feature = metric.feature || 'unknown';
        if (!featureUsage.has(feature)) {
          featureUsage.set(feature, {
            feature,
            totalRequests: 0,
            uniqueUsers: new Set(),
            totalCost: 0,
            averageResponseTime: 0,
            errorRate: 0,
            category: this.categorizeFeature(feature, featureCategories)
          });
        }

        const usage = featureUsage.get(feature);
        usage.totalRequests++;
        usage.totalCost += (metric.cost || 0);
        if (metric.userId) usage.uniqueUsers.add(metric.userId);
        if (metric.error) usage.errorRate++;
        if (metric.responseTime) {
          usage.averageResponseTime = (usage.averageResponseTime + metric.responseTime) / 2;
        }
      });

      // Calculate error rates and finalize metrics
      featureUsage.forEach(usage => {
        usage.uniqueUsers = usage.uniqueUsers.size;
        usage.errorRate = usage.errorRate / usage.totalRequests * 100;
        usage.avgCostPerRequest = usage.totalCost / usage.totalRequests;
        usage.popularity = usage.totalRequests / metrics.length * 100;
      });

      // Group by categories
      const categoryStats = {};
      Object.keys(featureCategories).forEach(category => {
        categoryStats[category] = {
          features: [],
          totalRequests: 0,
          totalCost: 0,
          uniqueUsers: new Set(),
          avgErrorRate: 0
        };
      });
      categoryStats.uncategorized = {
        features: [],
        totalRequests: 0,
        totalCost: 0,
        uniqueUsers: new Set(),
        avgErrorRate: 0
      };

      featureUsage.forEach(usage => {
        const category = usage.category || 'uncategorized';
        categoryStats[category].features.push(usage);
        categoryStats[category].totalRequests += usage.totalRequests;
        categoryStats[category].totalCost += usage.totalCost;
        // Note: uniqueUsers would need to be recalculated from original metrics for accuracy
      });

      // Calculate category averages
      Object.keys(categoryStats).forEach(category => {
        const stats = categoryStats[category];
        stats.avgErrorRate = stats.features.reduce((sum, f) => sum + f.errorRate, 0) / Math.max(stats.features.length, 1);
        stats.featureCount = stats.features.length;
      });

      return {
        totalFeatures: featureUsage.size,
        featureUsage: Array.from(featureUsage.values()),
        categoryStats,
        topFeatures: this.getTopFeatures(Array.from(featureUsage.values())),
        insights: this.generateFeatureInsights(categoryStats)
      };

    } catch (error) {
      this.logger.error('Feature usage segmentation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Segment usage by geographic location
   * @param {Array} metrics - Usage metrics
   * @returns {Promise<Object>} Geographic segmentation
   */
  async segmentByGeographic(metrics) {
    this.logger.info('Performing geographic segmentation');

    try {
      const geoData = new Map();

      metrics.forEach(metric => {
        const location = this.normalizeLocation(metric.location || metric.country || 'Unknown');
        const region = this.mapToRegion(location);

        if (!geoData.has(region)) {
          geoData.set(region, {
            region,
            locations: new Set(),
            totalRequests: 0,
            uniqueUsers: new Set(),
            totalCost: 0,
            avgResponseTime: 0,
            peakHours: new Map()
          });
        }

        const geo = geoData.get(region);
        geo.totalRequests++;
        geo.totalCost += (metric.cost || 0);
        geo.locations.add(location);
        if (metric.userId) geo.uniqueUsers.add(metric.userId);

        if (metric.responseTime) {
          geo.avgResponseTime = (geo.avgResponseTime + metric.responseTime) / 2;
        }

        // Track peak hours by region
        const hour = new Date(metric.timestamp).getHours();
        geo.peakHours.set(hour, (geo.peakHours.get(hour) || 0) + 1);
      });

      // Finalize geographic data
      geoData.forEach(geo => {
        geo.locations = Array.from(geo.locations);
        geo.uniqueUsers = geo.uniqueUsers.size;
        geo.avgCostPerRequest = geo.totalCost / geo.totalRequests;
        geo.marketShare = geo.totalRequests / metrics.length * 100;

        // Find peak hour
        let maxHour = 0;
        let maxCount = 0;
        geo.peakHours.forEach((count, hour) => {
          if (count > maxCount) {
            maxHour = hour;
            maxCount = count;
          }
        });
        geo.peakHour = maxHour;
        geo.peakHours = Object.fromEntries(geo.peakHours);
      });

      return {
        totalRegions: geoData.size,
        geoSegments: Object.fromEntries(geoData),
        insights: this.generateGeographicInsights(Object.fromEntries(geoData))
      };

    } catch (error) {
      this.logger.error('Geographic segmentation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Segment usage by temporal patterns
   * @param {Array} metrics - Usage metrics
   * @returns {Promise<Object>} Temporal segmentation
   */
  async segmentByTemporal(metrics) {
    this.logger.info('Performing temporal segmentation');

    try {
      const temporalData = {
        hourly: new Array(24).fill(0).map(() => ({ requests: 0, cost: 0, users: new Set() })),
        daily: new Map(), // day of week
        monthly: new Map(), // month
        businessHours: { requests: 0, cost: 0, users: new Set() },
        afterHours: { requests: 0, cost: 0, users: new Set() }
      };

      metrics.forEach(metric => {
        const date = new Date(metric.timestamp);
        const hour = date.getHours();
        const dayOfWeek = date.getDay(); // 0 = Sunday
        const month = date.getMonth(); // 0 = January

        // Hourly distribution
        temporalData.hourly[hour].requests++;
        temporalData.hourly[hour].cost += (metric.cost || 0);
        if (metric.userId) temporalData.hourly[hour].users.add(metric.userId);

        // Daily distribution
        if (!temporalData.daily.has(dayOfWeek)) {
          temporalData.daily.set(dayOfWeek, { requests: 0, cost: 0, users: new Set() });
        }
        temporalData.daily.get(dayOfWeek).requests++;
        temporalData.daily.get(dayOfWeek).cost += (metric.cost || 0);
        if (metric.userId) temporalData.daily.get(dayOfWeek).users.add(metric.userId);

        // Monthly distribution
        if (!temporalData.monthly.has(month)) {
          temporalData.monthly.set(month, { requests: 0, cost: 0, users: new Set() });
        }
        temporalData.monthly.get(month).requests++;
        temporalData.monthly.get(month).cost += (metric.cost || 0);
        if (metric.userId) temporalData.monthly.get(month).users.add(metric.userId);

        // Business hours vs after hours
        const isBusinessHours = hour >= this.config.businessHours.start &&
                               hour < this.config.businessHours.end &&
                               dayOfWeek >= 1 && dayOfWeek <= 5; // Mon-Fri

        if (isBusinessHours) {
          temporalData.businessHours.requests++;
          temporalData.businessHours.cost += (metric.cost || 0);
          if (metric.userId) temporalData.businessHours.users.add(metric.userId);
        } else {
          temporalData.afterHours.requests++;
          temporalData.afterHours.cost += (metric.cost || 0);
          if (metric.userId) temporalData.afterHours.users.add(metric.userId);
        }
      });

      // Convert Sets to counts and add metadata
      temporalData.hourly.forEach((data, hour) => {
        data.users = data.users.size;
        data.hour = hour;
        data.timeSlot = this.getTimeSlotName(hour);
      });

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dailyData = {};
      temporalData.daily.forEach((data, day) => {
        data.users = data.users.size;
        data.dayName = dayNames[day];
        dailyData[dayNames[day]] = data;
      });
      temporalData.daily = dailyData;

      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];
      const monthlyData = {};
      temporalData.monthly.forEach((data, month) => {
        data.users = data.users.size;
        data.monthName = monthNames[month];
        monthlyData[monthNames[month]] = data;
      });
      temporalData.monthly = monthlyData;

      temporalData.businessHours.users = temporalData.businessHours.users.size;
      temporalData.afterHours.users = temporalData.afterHours.users.size;

      // Find peak patterns
      const peakHour = temporalData.hourly.reduce((max, curr, idx) =>
        curr.requests > temporalData.hourly[max].requests ? idx : max, 0);

      const peakDay = Object.keys(temporalData.daily).reduce((max, day) =>
        temporalData.daily[day].requests > temporalData.daily[max].requests ? day : max,
        Object.keys(temporalData.daily)[0]);

      return {
        temporalData,
        peakHour: { hour: peakHour, name: this.getTimeSlotName(peakHour) },
        peakDay,
        businessHoursRatio: temporalData.businessHours.requests / metrics.length * 100,
        insights: this.generateTemporalInsights(temporalData, peakHour, peakDay)
      };

    } catch (error) {
      this.logger.error('Temporal segmentation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Segment users by cost levels
   * @param {Array} metrics - Usage metrics
   * @returns {Promise<Object>} Cost-level segmentation
   */
  async segmentByCostLevel(metrics) {
    this.logger.info('Performing cost level segmentation');

    try {
      const userCosts = new Map();

      // Aggregate costs by user
      metrics.forEach(metric => {
        const userId = metric.userId || 'anonymous';
        const cost = metric.cost || 0;

        if (!userCosts.has(userId)) {
          userCosts.set(userId, {
            userId,
            totalCost: 0,
            requestCount: 0,
            avgCostPerRequest: 0
          });
        }

        const userCost = userCosts.get(userId);
        userCost.totalCost += cost;
        userCost.requestCount++;
      });

      // Calculate average cost per request
      userCosts.forEach(user => {
        user.avgCostPerRequest = user.totalCost / user.requestCount;
      });

      // Segment by cost levels
      const costSegments = {
        high_cost: [],
        medium_cost: [],
        low_cost: [],
        free_tier: []
      };

      userCosts.forEach(user => {
        if (user.totalCost >= this.config.highCostThreshold) {
          costSegments.high_cost.push(user);
        } else if (user.totalCost >= this.config.lowCostThreshold) {
          costSegments.medium_cost.push(user);
        } else if (user.totalCost > 0) {
          costSegments.low_cost.push(user);
        } else {
          costSegments.free_tier.push(user);
        }
      });

      // Calculate segment statistics
      const totalRevenue = Array.from(userCosts.values()).reduce((sum, user) => sum + user.totalCost, 0);
      const segmentStats = {};

      Object.keys(costSegments).forEach(segmentName => {
        const users = costSegments[segmentName];
        const segmentRevenue = users.reduce((sum, u) => sum + u.totalCost, 0);

        segmentStats[segmentName] = {
          userCount: users.length,
          percentage: users.length / userCosts.size * 100,
          totalRevenue: segmentRevenue,
          revenueShare: segmentRevenue / totalRevenue * 100,
          avgCostPerUser: segmentRevenue / Math.max(users.length, 1),
          avgRequestsPerUser: users.reduce((sum, u) => sum + u.requestCount, 0) / Math.max(users.length, 1)
        };
      });

      return {
        totalUsers: userCosts.size,
        totalRevenue,
        costSegments,
        segmentStats,
        insights: this.generateCostLevelInsights(segmentStats)
      };

    } catch (error) {
      this.logger.error('Cost level segmentation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Segment users by usage frequency
   * @param {Array} metrics - Usage metrics
   * @returns {Promise<Object>} Usage frequency segmentation
   */
  async segmentByUsageFrequency(metrics) {
    this.logger.info('Performing usage frequency segmentation');

    try {
      const userFrequency = new Map();
      const now = new Date();

      // Calculate usage frequency by user
      metrics.forEach(metric => {
        const userId = metric.userId || 'anonymous';

        if (!userFrequency.has(userId)) {
          userFrequency.set(userId, {
            userId,
            totalRequests: 0,
            uniqueDays: new Set(),
            firstRequest: metric.timestamp,
            lastRequest: metric.timestamp,
            sessionsPerDay: 0,
            frequency: 'unknown'
          });
        }

        const user = userFrequency.get(userId);
        user.totalRequests++;

        const requestDate = new Date(metric.timestamp).toISOString().split('T')[0];
        user.uniqueDays.add(requestDate);

        if (new Date(metric.timestamp) > new Date(user.lastRequest)) {
          user.lastRequest = metric.timestamp;
        }
        if (new Date(metric.timestamp) < new Date(user.firstRequest)) {
          user.firstRequest = metric.timestamp;
        }
      });

      // Calculate frequency metrics and categorize
      const frequencySegments = {
        daily_users: [],
        weekly_users: [],
        monthly_users: [],
        occasional_users: []
      };

      userFrequency.forEach(user => {
        user.uniqueDays = user.uniqueDays.size;

        const daysSinceFirst = Math.ceil((now - new Date(user.firstRequest)) / (1000 * 60 * 60 * 24));
        user.avgRequestsPerDay = user.totalRequests / Math.max(daysSinceFirst, 1);
        user.daysSinceFirst = daysSinceFirst;

        // Categorize by frequency
        if (user.avgRequestsPerDay >= 1) {
          user.frequency = 'daily';
          frequencySegments.daily_users.push(user);
        } else if (user.avgRequestsPerDay >= 0.14) { // ~1 per week
          user.frequency = 'weekly';
          frequencySegments.weekly_users.push(user);
        } else if (user.avgRequestsPerDay >= 0.033) { // ~1 per month
          user.frequency = 'monthly';
          frequencySegments.monthly_users.push(user);
        } else {
          user.frequency = 'occasional';
          frequencySegments.occasional_users.push(user);
        }
      });

      // Calculate segment statistics
      const segmentStats = {};
      Object.keys(frequencySegments).forEach(segmentName => {
        const users = frequencySegments[segmentName];
        segmentStats[segmentName] = {
          userCount: users.length,
          percentage: users.length / userFrequency.size * 100,
          avgRequestsPerDay: users.reduce((sum, u) => sum + u.avgRequestsPerDay, 0) / Math.max(users.length, 1),
          avgTotalRequests: users.reduce((sum, u) => sum + u.totalRequests, 0) / Math.max(users.length, 1),
          retention: this.calculateRetentionRate(users)
        };
      });

      return {
        totalUsers: userFrequency.size,
        frequencySegments,
        segmentStats,
        insights: this.generateFrequencyInsights(segmentStats)
      };

    } catch (error) {
      this.logger.error('Usage frequency segmentation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Segment users by session duration patterns
   * @param {Array} metrics - Usage metrics
   * @returns {Promise<Object>} Session duration segmentation
   */
  async segmentBySessionDuration(metrics) {
    this.logger.info('Performing session duration segmentation');

    try {
      const sessionData = new Map();

      // Group metrics by session
      metrics.forEach(metric => {
        const sessionId = metric.sessionId || `${metric.userId || 'anon'}_${new Date(metric.timestamp).toISOString().split('T')[0]}`;

        if (!sessionData.has(sessionId)) {
          sessionData.set(sessionId, {
            sessionId,
            userId: metric.userId || 'anonymous',
            startTime: metric.timestamp,
            endTime: metric.timestamp,
            requestCount: 0,
            features: new Set(),
            totalCost: 0
          });
        }

        const session = sessionData.get(sessionId);
        session.requestCount++;
        session.totalCost += (metric.cost || 0);
        if (metric.feature) session.features.add(metric.feature);

        if (new Date(metric.timestamp) > new Date(session.endTime)) {
          session.endTime = metric.timestamp;
        }
        if (new Date(metric.timestamp) < new Date(session.startTime)) {
          session.startTime = metric.timestamp;
        }
      });

      // Calculate session durations and categorize
      const durationSegments = {
        short_sessions: [], // < 5 minutes
        medium_sessions: [], // 5-30 minutes
        long_sessions: [], // 30-120 minutes
        extended_sessions: [] // > 2 hours
      };

      sessionData.forEach(session => {
        const durationMs = new Date(session.endTime) - new Date(session.startTime);
        session.durationMinutes = Math.max(1, Math.round(durationMs / (1000 * 60))); // Minimum 1 minute
        session.features = session.features.size;
        session.avgCostPerRequest = session.totalCost / session.requestCount;

        if (session.durationMinutes < 5) {
          durationSegments.short_sessions.push(session);
        } else if (session.durationMinutes < 30) {
          durationSegments.medium_sessions.push(session);
        } else if (session.durationMinutes < 120) {
          durationSegments.long_sessions.push(session);
        } else {
          durationSegments.extended_sessions.push(session);
        }
      });

      // Calculate segment statistics
      const segmentStats = {};
      Object.keys(durationSegments).forEach(segmentName => {
        const sessions = durationSegments[segmentName];
        segmentStats[segmentName] = {
          sessionCount: sessions.length,
          percentage: sessions.length / sessionData.size * 100,
          avgDuration: sessions.reduce((sum, s) => sum + s.durationMinutes, 0) / Math.max(sessions.length, 1),
          avgRequests: sessions.reduce((sum, s) => sum + s.requestCount, 0) / Math.max(sessions.length, 1),
          avgFeatures: sessions.reduce((sum, s) => sum + s.features, 0) / Math.max(sessions.length, 1),
          avgCost: sessions.reduce((sum, s) => sum + s.totalCost, 0) / Math.max(sessions.length, 1)
        };
      });

      return {
        totalSessions: sessionData.size,
        durationSegments,
        segmentStats,
        insights: this.generateSessionDurationInsights(segmentStats)
      };

    } catch (error) {
      this.logger.error('Session duration segmentation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Segment users by device/platform type
   * @param {Array} metrics - Usage metrics
   * @returns {Promise<Object>} Device type segmentation
   */
  async segmentByDeviceType(metrics) {
    this.logger.info('Performing device type segmentation');

    try {
      const deviceData = new Map();

      metrics.forEach(metric => {
        const deviceInfo = this.parseDeviceInfo(metric.userAgent || metric.device || 'Unknown');
        const deviceKey = `${deviceInfo.platform}_${deviceInfo.deviceType}`;

        if (!deviceData.has(deviceKey)) {
          deviceData.set(deviceKey, {
            platform: deviceInfo.platform,
            deviceType: deviceInfo.deviceType,
            browser: deviceInfo.browser,
            requests: 0,
            uniqueUsers: new Set(),
            totalCost: 0,
            avgResponseTime: 0,
            features: new Set()
          });
        }

        const device = deviceData.get(deviceKey);
        device.requests++;
        device.totalCost += (metric.cost || 0);
        if (metric.userId) device.uniqueUsers.add(metric.userId);
        if (metric.feature) device.features.add(metric.feature);
        if (metric.responseTime) {
          device.avgResponseTime = (device.avgResponseTime + metric.responseTime) / 2;
        }
      });

      // Finalize device data
      deviceData.forEach(device => {
        device.uniqueUsers = device.uniqueUsers.size;
        device.features = device.features.size;
        device.avgCostPerRequest = device.totalCost / device.requests;
        device.marketShare = device.requests / metrics.length * 100;
      });

      // Group by categories
      const platformStats = new Map();
      const deviceTypeStats = new Map();

      deviceData.forEach(device => {
        // Platform statistics
        if (!platformStats.has(device.platform)) {
          platformStats.set(device.platform, {
            platform: device.platform,
            requests: 0,
            users: 0,
            cost: 0,
            devices: []
          });
        }
        const platform = platformStats.get(device.platform);
        platform.requests += device.requests;
        platform.users += device.uniqueUsers;
        platform.cost += device.totalCost;
        platform.devices.push(device);

        // Device type statistics
        if (!deviceTypeStats.has(device.deviceType)) {
          deviceTypeStats.set(device.deviceType, {
            deviceType: device.deviceType,
            requests: 0,
            users: 0,
            cost: 0,
            platforms: new Set()
          });
        }
        const deviceType = deviceTypeStats.get(device.deviceType);
        deviceType.requests += device.requests;
        deviceType.users += device.uniqueUsers;
        deviceType.cost += device.totalCost;
        deviceType.platforms.add(device.platform);
      });

      // Convert platform sets to arrays
      deviceTypeStats.forEach(deviceType => {
        deviceType.platforms = Array.from(deviceType.platforms);
      });

      return {
        totalDevices: deviceData.size,
        deviceSegments: Object.fromEntries(deviceData),
        platformStats: Object.fromEntries(platformStats),
        deviceTypeStats: Object.fromEntries(deviceTypeStats),
        insights: this.generateDeviceTypeInsights(Object.fromEntries(platformStats), Object.fromEntries(deviceTypeStats))
      };

    } catch (error) {
      this.logger.error('Device type segmentation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Perform custom segmentation based on provided criteria
   * @param {Array} metrics - Usage metrics
   * @param {Object} options - Custom segmentation options
   * @returns {Promise<Object>} Custom segmentation results
   */
  async performCustomSegmentation(metrics, options) {
    this.logger.info('Performing custom segmentation', { options });

    try {
      if (!options.customSegments || options.customSegments.length === 0) {
        return { message: 'No custom segmentation criteria provided' };
      }

      const customResults = {};

      for (const segment of options.customSegments) {
        const segmentName = segment.name;
        const criteria = segment.criteria;
        const matchingMetrics = [];

        metrics.forEach(metric => {
          let matches = true;

          for (const [field, condition] of Object.entries(criteria)) {
            const value = metric[field];

            if (condition.equals !== undefined && value !== condition.equals) {
              matches = false;
              break;
            }
            if (condition.greaterThan !== undefined && (value === undefined || value <= condition.greaterThan)) {
              matches = false;
              break;
            }
            if (condition.lessThan !== undefined && (value === undefined || value >= condition.lessThan)) {
              matches = false;
              break;
            }
            if (condition.contains !== undefined && (!value || !value.toString().toLowerCase().includes(condition.contains.toLowerCase()))) {
              matches = false;
              break;
            }
            if (condition.in !== undefined && !condition.in.includes(value)) {
              matches = false;
              break;
            }
          }

          if (matches) {
            matchingMetrics.push(metric);
          }
        });

        // Calculate segment statistics
        const uniqueUsers = new Set(matchingMetrics.map(m => m.userId).filter(Boolean));
        const totalCost = matchingMetrics.reduce((sum, m) => sum + (m.cost || 0), 0);
        const uniqueFeatures = new Set(matchingMetrics.map(m => m.feature).filter(Boolean));

        customResults[segmentName] = {
          name: segmentName,
          criteria,
          matchingCount: matchingMetrics.length,
          percentage: matchingMetrics.length / metrics.length * 100,
          uniqueUsers: uniqueUsers.size,
          totalCost,
          avgCostPerRequest: totalCost / Math.max(matchingMetrics.length, 1),
          uniqueFeatures: uniqueFeatures.size,
          metrics: segment.includeMetrics ? matchingMetrics : undefined
        };
      }

      return {
        totalCustomSegments: options.customSegments.length,
        customResults,
        insights: this.generateCustomInsights(customResults)
      };

    } catch (error) {
      this.logger.error('Custom segmentation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Perform cross-segment analysis to find overlaps and patterns
   * @param {Array} segmentationResults - All segmentation results
   * @returns {Promise<Object>} Cross-segment analysis
   */
  async performCrossSegmentAnalysis(segmentationResults) {
    this.logger.info('Performing cross-segment analysis');

    try {
      const crossAnalysis = {
        correlations: {},
        overlaps: {},
        insights: []
      };

      // Analyze correlations between different segmentation types
      // This would require more complex analysis based on user overlap
      crossAnalysis.insights.push({
        type: 'cross_segment',
        message: 'Cross-segment analysis completed - detailed correlation analysis would require user-level data mapping',
        timestamp: new Date().toISOString()
      });

      return crossAnalysis;

    } catch (error) {
      this.logger.error('Cross-segment analysis failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate actionable insights from segmentation results
   * @param {Array} segmentationResults - All segmentation results
   * @returns {Promise<Object>} Generated insights
   */
  async generateSegmentInsights(segmentationResults) {
    this.logger.info('Generating segment insights');

    try {
      const insights = [];

      // Analyze each segmentation type for insights
      if (segmentationResults[0]) { // User behavior
        const powerUsers = segmentationResults[0].segments?.power_users || [];
        if (powerUsers.length > 0) {
          insights.push({
            type: 'opportunity',
            priority: 'high',
            message: `${powerUsers.length} power users identified - consider premium features or dedicated support`,
            impact: 'revenue_growth',
            actionable: true
          });
        }
      }

      if (segmentationResults[3]) { // Temporal
        const businessHoursRatio = segmentationResults[3].businessHoursRatio || 0;
        if (businessHoursRatio < 60) {
          insights.push({
            type: 'optimization',
            priority: 'medium',
            message: `${Math.round(100 - businessHoursRatio)}% of usage occurs outside business hours - consider off-hours pricing or support`,
            impact: 'operational_efficiency',
            actionable: true
          });
        }
      }

      if (segmentationResults[4]) { // Cost level
        const freeUsers = segmentationResults[4].segmentStats?.free_tier?.userCount || 0;
        const totalUsers = segmentationResults[4].totalUsers || 1;
        if (freeUsers / totalUsers > 0.8) {
          insights.push({
            type: 'conversion',
            priority: 'high',
            message: `${Math.round(freeUsers / totalUsers * 100)}% of users are on free tier - focus on conversion strategies`,
            impact: 'revenue_growth',
            actionable: true
          });
        }
      }

      return {
        totalInsights: insights.length,
        insights,
        summary: this.summarizeInsights(insights)
      };

    } catch (error) {
      this.logger.error('Segment insights generation failed', { error: error.message });
      throw error;
    }
  }

  // Helper methods

  /**
   * Validate and clean metrics data
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

    this.logger.info('Metrics validated', {
      original: metrics.length,
      valid: validatedMetrics.length
    });

    return validatedMetrics;
  }

  /**
   * Categorize feature by name patterns
   * @param {string} feature - Feature name
   * @param {Object} categories - Category mapping
   * @returns {string} Category name
   */
  categorizeFeature(feature, categories) {
    const featureLower = feature.toLowerCase();

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => featureLower.includes(keyword))) {
        return category;
      }
    }

    return 'uncategorized';
  }

  /**
   * Normalize location string
   * @param {string} location - Raw location
   * @returns {string} Normalized location
   */
  normalizeLocation(location) {
    if (!location || typeof location !== 'string') return 'Unknown';
    return location.toLowerCase().trim();
  }

  /**
   * Map location to region
   * @param {string} location - Normalized location
   * @returns {string} Region code
   */
  mapToRegion(location) {
    for (const [region, locations] of Object.entries(this.config.regionMapping)) {
      if (locations.some(loc => location.includes(loc))) {
        return region;
      }
    }
    return 'OTHER';
  }

  /**
   * Get time slot name from hour
   * @param {number} hour - Hour (0-23)
   * @returns {string} Time slot name
   */
  getTimeSlotName(hour) {
    if (hour >= 6 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 18) return 'Afternoon';
    if (hour >= 18 && hour < 24) return 'Evening';
    return 'Night';
  }

  /**
   * Parse device information from user agent
   * @param {string} userAgent - User agent string
   * @returns {Object} Device information
   */
  parseDeviceInfo(userAgent) {
    const ua = userAgent.toLowerCase();

    let platform = 'Unknown';
    let deviceType = 'Unknown';
    let browser = 'Unknown';

    // Platform detection
    if (ua.includes('windows')) platform = 'Windows';
    else if (ua.includes('macintosh') || ua.includes('mac os')) platform = 'macOS';
    else if (ua.includes('linux')) platform = 'Linux';
    else if (ua.includes('android')) platform = 'Android';
    else if (ua.includes('iphone') || ua.includes('ipad')) platform = 'iOS';

    // Device type detection
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) deviceType = 'Mobile';
    else if (ua.includes('tablet') || ua.includes('ipad')) deviceType = 'Tablet';
    else deviceType = 'Desktop';

    // Browser detection
    if (ua.includes('chrome')) browser = 'Chrome';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('safari')) browser = 'Safari';
    else if (ua.includes('edge')) browser = 'Edge';

    return { platform, deviceType, browser };
  }

  /**
   * Calculate retention rate for user segment
   * @param {Array} users - User data
   * @returns {number} Retention rate percentage
   */
  calculateRetentionRate(users) {
    if (users.length === 0) return 0;

    const now = new Date();
    const activeUsers = users.filter(user => {
      const daysSinceLastRequest = (now - new Date(user.lastRequest)) / (1000 * 60 * 60 * 24);
      return daysSinceLastRequest <= 30; // Active within last 30 days
    });

    return (activeUsers.length / users.length) * 100;
  }

  /**
   * Get top features by usage
   * @param {Array} features - Feature usage data
   * @returns {Array} Top 10 features
   */
  getTopFeatures(features) {
    return features
      .sort((a, b) => b.totalRequests - a.totalRequests)
      .slice(0, 10)
      .map(feature => ({
        name: feature.feature,
        requests: feature.totalRequests,
        users: feature.uniqueUsers,
        cost: feature.totalCost,
        popularity: feature.popularity
      }));
  }

  /**
   * Count total segments across all segmentation types
   * @param {Object} segmentations - All segmentation results
   * @returns {number} Total segment count
   */
  countTotalSegments(segmentations) {
    let total = 0;
    Object.values(segmentations).forEach(segmentation => {
      if (segmentation.segments) total += Object.keys(segmentation.segments).length;
      if (segmentation.geoSegments) total += Object.keys(segmentation.geoSegments).length;
      if (segmentation.costSegments) total += Object.keys(segmentation.costSegments).length;
    });
    return total;
  }

  /**
   * Generate insights for behavior segmentation
   * @param {Object} segmentStats - Segment statistics
   * @returns {Array} Generated insights
   */
  generateBehaviorInsights(segmentStats) {
    const insights = [];

    if (segmentStats.power_users?.percentage > 10) {
      insights.push({
        type: 'opportunity',
        message: `High percentage of power users (${segmentStats.power_users.percentage.toFixed(1)}%) - consider premium features`
      });
    }

    if (segmentStats.dormant_users?.percentage > 20) {
      insights.push({
        type: 'risk',
        message: `${segmentStats.dormant_users.percentage.toFixed(1)}% of users are dormant - implement re-engagement campaigns`
      });
    }

    return insights;
  }

  /**
   * Generate insights for feature usage segmentation
   * @param {Object} categoryStats - Category statistics
   * @returns {Array} Generated insights
   */
  generateFeatureInsights(categoryStats) {
    const insights = [];

    Object.entries(categoryStats).forEach(([category, stats]) => {
      if (stats.avgErrorRate > 5) {
        insights.push({
          type: 'quality',
          message: `High error rate in ${category} features (${stats.avgErrorRate.toFixed(1)}%) - needs attention`
        });
      }
    });

    return insights;
  }

  /**
   * Generate insights for geographic segmentation
   * @param {Object} geoSegments - Geographic segments
   * @returns {Array} Generated insights
   */
  generateGeographicInsights(geoSegments) {
    const insights = [];

    const segments = Object.values(geoSegments);
    const topRegion = segments.reduce((max, region) =>
      region.marketShare > max.marketShare ? region : max, segments[0]);

    if (topRegion) {
      insights.push({
        type: 'market',
        message: `${topRegion.region} dominates with ${topRegion.marketShare.toFixed(1)}% market share`
      });
    }

    return insights;
  }

  /**
   * Generate insights for temporal segmentation
   * @param {Object} temporalData - Temporal data
   * @param {number} peakHour - Peak hour
   * @param {string} peakDay - Peak day
   * @returns {Array} Generated insights
   */
  generateTemporalInsights(temporalData, peakHour, peakDay) {
    const insights = [];

    insights.push({
      type: 'usage_pattern',
      message: `Peak usage occurs at ${peakHour}:00 on ${peakDay}s`
    });

    const businessHoursPercentage = temporalData.businessHours.requests /
      (temporalData.businessHours.requests + temporalData.afterHours.requests) * 100;

    if (businessHoursPercentage < 70) {
      insights.push({
        type: 'operational',
        message: `${(100 - businessHoursPercentage).toFixed(1)}% usage outside business hours - consider 24/7 support`
      });
    }

    return insights;
  }

  /**
   * Generate insights for cost level segmentation
   * @param {Object} segmentStats - Segment statistics
   * @returns {Array} Generated insights
   */
  generateCostLevelInsights(segmentStats) {
    const insights = [];

    if (segmentStats.high_cost?.revenueShare > 50) {
      insights.push({
        type: 'revenue',
        message: `High-cost users generate ${segmentStats.high_cost.revenueShare.toFixed(1)}% of revenue with only ${segmentStats.high_cost.percentage.toFixed(1)}% of users`
      });
    }

    return insights;
  }

  /**
   * Generate insights for frequency segmentation
   * @param {Object} segmentStats - Segment statistics
   * @returns {Array} Generated insights
   */
  generateFrequencyInsights(segmentStats) {
    const insights = [];

    if (segmentStats.daily_users?.percentage > 20) {
      insights.push({
        type: 'engagement',
        message: `Strong daily user base (${segmentStats.daily_users.percentage.toFixed(1)}%) indicates high product stickiness`
      });
    }

    return insights;
  }

  /**
   * Generate insights for session duration segmentation
   * @param {Object} segmentStats - Segment statistics
   * @returns {Array} Generated insights
   */
  generateSessionDurationInsights(segmentStats) {
    const insights = [];

    if (segmentStats.short_sessions?.percentage > 60) {
      insights.push({
        type: 'user_experience',
        message: `${segmentStats.short_sessions.percentage.toFixed(1)}% of sessions are short - may indicate UX issues or task efficiency`
      });
    }

    return insights;
  }

  /**
   * Generate insights for device type segmentation
   * @param {Object} platformStats - Platform statistics
   * @param {Object} deviceTypeStats - Device type statistics
   * @returns {Array} Generated insights
   */
  generateDeviceTypeInsights(platformStats, deviceTypeStats) {
    const insights = [];

    const mobilePercentage = deviceTypeStats.Mobile?.requests /
      Object.values(deviceTypeStats).reduce((sum, dt) => sum + dt.requests, 1) * 100;

    if (mobilePercentage > 50) {
      insights.push({
        type: 'platform',
        message: `Mobile-first usage pattern (${mobilePercentage.toFixed(1)}%) - prioritize mobile optimization`
      });
    }

    return insights;
  }

  /**
   * Generate insights for custom segmentation
   * @param {Object} customResults - Custom segmentation results
   * @returns {Array} Generated insights
   */
  generateCustomInsights(customResults) {
    const insights = [];

    Object.values(customResults).forEach(result => {
      if (result.percentage > 25) {
        insights.push({
          type: 'custom',
          message: `Custom segment "${result.name}" represents ${result.percentage.toFixed(1)}% of usage`
        });
      }
    });

    return insights;
  }

  /**
   * Summarize all insights
   * @param {Array} insights - All generated insights
   * @returns {Object} Insight summary
   */
  summarizeInsights(insights) {
    const summary = {
      total: insights.length,
      byType: {},
      byPriority: {},
      actionableCount: 0
    };

    insights.forEach(insight => {
      summary.byType[insight.type] = (summary.byType[insight.type] || 0) + 1;
      if (insight.priority) {
        summary.byPriority[insight.priority] = (summary.byPriority[insight.priority] || 0) + 1;
      }
      if (insight.actionable) {
        summary.actionableCount++;
      }
    });

    return summary;
  }
}

/**
 * Create a new SegmentationEngine instance
 * @param {Object} config - Configuration options
 * @returns {SegmentationEngine} New segmentation engine instance
 */
export function createSegmentationEngine(config = {}) {
  return new SegmentationEngine(config);
}