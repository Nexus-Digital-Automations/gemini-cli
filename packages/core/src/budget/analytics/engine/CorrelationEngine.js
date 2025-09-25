/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { getLogger } from '../../../logging/index.js';

/**
 * Advanced Correlation Analysis Engine for Usage Relationships
 *
 * Analyzes correlations and relationships between different usage metrics including:
 * - Feature usage correlations
 * - Cost vs. usage patterns
 * - Temporal correlations
 * - User behavior correlations
 * - Cross-platform relationships
 * - Predictive correlation modeling
 */
export class CorrelationEngine {
  /**
   * Creates a new CorrelationEngine instance
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.logger = getLogger('CorrelationEngine');
    this.config = {
      // Correlation thresholds
      strongCorrelationThreshold: 0.7,
      moderateCorrelationThreshold: 0.4,
      weakCorrelationThreshold: 0.2,

      // Analysis windows
      shortTermWindow: 7, // days
      mediumTermWindow: 30, // days
      longTermWindow: 90, // days

      // Statistical confidence levels
      confidenceLevel: 0.95,
      minSampleSize: 10,

      // Feature groupings for analysis
      featureGroups: {
        authentication: ['login', 'logout', 'auth', 'signin', 'signup'],
        analytics: ['report', 'dashboard', 'chart', 'analytics', 'metrics'],
        data_management: ['import', 'export', 'sync', 'backup', 'restore'],
        user_management: ['user', 'profile', 'settings', 'account'],
        admin: ['admin', 'config', 'manage', 'system'],
      },

      ...config,
    };

    this.logger.info('CorrelationEngine initialized', { config: this.config });
  }

  /**
   * Perform comprehensive correlation analysis
   * @param {Array} metrics - Usage metrics data
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Correlation analysis results
   */
  async analyzeCorrelations(metrics, options = {}) {
    const startTime = Date.now();
    this.logger.info('Starting comprehensive correlation analysis', {
      metricsCount: metrics.length,
      options,
    });

    try {
      // Validate input metrics
      const validatedMetrics = this.validateMetrics(metrics);
      if (validatedMetrics.length < this.config.minSampleSize) {
        throw new Error(
          `Insufficient sample size: ${validatedMetrics.length} < ${this.config.minSampleSize}`,
        );
      }

      // Perform all correlation analyses
      const correlationResults = await Promise.all([
        this.analyzeFeatureCorrelations(validatedMetrics),
        this.analyzeCostUsageCorrelations(validatedMetrics),
        this.analyzeTemporalCorrelations(validatedMetrics),
        this.analyzeUserBehaviorCorrelations(validatedMetrics),
        this.analyzePlatformCorrelations(validatedMetrics),
        this.analyzeSessionCorrelations(validatedMetrics),
        this.analyzeGeographicCorrelations(validatedMetrics),
        this.analyzePredictiveCorrelations(validatedMetrics),
        this.analyzeCustomCorrelations(validatedMetrics, options),
      ]);

      const results = {
        timestamp: new Date().toISOString(),
        totalMetrics: validatedMetrics.length,
        analysisWindow: this.calculateAnalysisWindow(validatedMetrics),
        correlations: {
          featureCorrelations: correlationResults[0],
          costUsageCorrelations: correlationResults[1],
          temporalCorrelations: correlationResults[2],
          userBehaviorCorrelations: correlationResults[3],
          platformCorrelations: correlationResults[4],
          sessionCorrelations: correlationResults[5],
          geographicCorrelations: correlationResults[6],
          predictiveCorrelations: correlationResults[7],
          customCorrelations: correlationResults[8],
        },
        strongCorrelations: this.extractStrongCorrelations(correlationResults),
        correlationSummary: this.generateCorrelationSummary(correlationResults),
        actionableInsights:
          await this.generateActionableInsights(correlationResults),
        processingTime: Date.now() - startTime,
      };

      this.logger.info('Correlation analysis completed', {
        totalCorrelations: this.countTotalCorrelations(results.correlations),
        strongCorrelations: results.strongCorrelations.length,
        processingTime: results.processingTime,
      });

      return results;
    } catch (error) {
      this.logger.error('Correlation analysis failed', {
        error: error.message,
        stack: error.stack,
        metricsCount: metrics.length,
      });
      throw error;
    }
  }

  /**
   * Analyze correlations between different features
   * @param {Array} metrics - Usage metrics
   * @returns {Promise<Object>} Feature correlation analysis
   */
  async analyzeFeatureCorrelations(metrics) {
    this.logger.info('Analyzing feature correlations');

    try {
      // Create feature usage matrix by user
      const userFeatureMatrix = new Map();

      metrics.forEach((metric) => {
        const userId = metric.userId || 'anonymous';
        const feature = metric.feature || 'unknown';

        if (!userFeatureMatrix.has(userId)) {
          userFeatureMatrix.set(userId, new Map());
        }

        const userFeatures = userFeatureMatrix.get(userId);
        userFeatures.set(feature, (userFeatures.get(feature) || 0) + 1);
      });

      // Get all unique features
      const allFeatures = [
        ...new Set(metrics.map((m) => m.feature || 'unknown')),
      ];

      // Calculate pairwise correlations
      const correlationMatrix = {};
      const featurePairs = [];

      for (let i = 0; i < allFeatures.length; i++) {
        for (let j = i + 1; j < allFeatures.length; j++) {
          featurePairs.push([allFeatures[i], allFeatures[j]]);
        }
      }

      // Calculate correlation coefficient for each feature pair
      for (const [featureA, featureB] of featurePairs) {
        const correlation = this.calculateFeaturePairCorrelation(
          featureA,
          featureB,
          userFeatureMatrix,
        );

        const pairKey = `${featureA}_${featureB}`;
        correlationMatrix[pairKey] = {
          featureA,
          featureB,
          correlation: correlation.coefficient,
          significance: correlation.significance,
          sampleSize: correlation.sampleSize,
          strength: this.classifyCorrelationStrength(correlation.coefficient),
        };
      }

      // Group features by correlation strength
      const strongCorrelations = Object.values(correlationMatrix).filter(
        (c) =>
          Math.abs(c.correlation) >= this.config.strongCorrelationThreshold,
      );

      const moderateCorrelations = Object.values(correlationMatrix).filter(
        (c) =>
          Math.abs(c.correlation) >= this.config.moderateCorrelationThreshold &&
          Math.abs(c.correlation) < this.config.strongCorrelationThreshold,
      );

      // Analyze feature groups
      const groupCorrelations =
        await this.analyzeFeatureGroupCorrelations(metrics);

      return {
        totalFeatures: allFeatures.length,
        totalPairs: featurePairs.length,
        correlationMatrix,
        strongCorrelations,
        moderateCorrelations,
        groupCorrelations,
        mostCorrelatedFeature:
          this.findMostCorrelatedFeature(correlationMatrix),
        insights: this.generateFeatureCorrelationInsights(
          correlationMatrix,
          strongCorrelations,
        ),
      };
    } catch (error) {
      this.logger.error('Feature correlation analysis failed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Analyze correlations between cost and usage patterns
   * @param {Array} metrics - Usage metrics
   * @returns {Promise<Object>} Cost-usage correlation analysis
   */
  async analyzeCostUsageCorrelations(metrics) {
    this.logger.info('Analyzing cost-usage correlations');

    try {
      const metricsWithCost = metrics.filter(
        (m) => m.cost !== undefined && m.cost !== null,
      );

      if (metricsWithCost.length < this.config.minSampleSize) {
        return {
          message: 'Insufficient cost data for correlation analysis',
          availableMetrics: metricsWithCost.length,
        };
      }

      // Prepare data arrays for correlation analysis
      const costs = metricsWithCost.map((m) => m.cost);
      const requestCounts = metricsWithCost.map((m) => 1); // Each metric represents one request
      const responseTimes = metricsWithCost
        .filter((m) => m.responseTime)
        .map((m) => m.responseTime);
      const timestamps = metricsWithCost.map((m) =>
        new Date(m.timestamp).getHours(),
      );

      // Calculate various cost correlations
      const correlations = {
        costVsVolume: this.calculateCorrelation(costs, requestCounts),
        costVsResponseTime:
          responseTimes.length > this.config.minSampleSize
            ? this.calculateCorrelation(
                metricsWithCost
                  .filter((m) => m.responseTime)
                  .map((m) => m.cost),
                responseTimes,
              )
            : null,
        costVsTimeOfDay: this.calculateCorrelation(costs, timestamps),
      };

      // Analyze cost distribution by feature
      const costByFeature = new Map();
      metricsWithCost.forEach((metric) => {
        const feature = metric.feature || 'unknown';
        if (!costByFeature.has(feature)) {
          costByFeature.set(feature, []);
        }
        costByFeature.get(feature).push(metric.cost);
      });

      // Calculate feature-specific cost statistics
      const featureCostAnalysis = {};
      costByFeature.forEach((costs, feature) => {
        featureCostAnalysis[feature] = {
          feature,
          totalCost: costs.reduce((sum, cost) => sum + cost, 0),
          avgCost: costs.reduce((sum, cost) => sum + cost, 0) / costs.length,
          minCost: Math.min(...costs),
          maxCost: Math.max(...costs),
          costVariation: this.calculateVariation(costs),
          requestCount: costs.length,
          costEfficiency:
            costs.length / costs.reduce((sum, cost) => sum + cost, 0),
        };
      });

      // Identify cost patterns
      const costPatterns = this.identifyCostPatterns(metricsWithCost);

      return {
        totalCostMetrics: metricsWithCost.length,
        correlations,
        featureCostAnalysis,
        costPatterns,
        highestCostFeatures: Object.values(featureCostAnalysis)
          .sort((a, b) => b.avgCost - a.avgCost)
          .slice(0, 5),
        insights: this.generateCostUsageInsights(
          correlations,
          featureCostAnalysis,
          costPatterns,
        ),
      };
    } catch (error) {
      this.logger.error('Cost-usage correlation analysis failed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Analyze temporal correlations and patterns
   * @param {Array} metrics - Usage metrics
   * @returns {Promise<Object>} Temporal correlation analysis
   */
  async analyzeTemporalCorrelations(metrics) {
    this.logger.info('Analyzing temporal correlations');

    try {
      // Group metrics by different time periods
      const hourlyUsage = new Array(24).fill(0);
      const dailyUsage = new Array(7).fill(0); // 0 = Sunday
      const monthlyUsage = new Array(12).fill(0); // 0 = January

      const hourlyFeatureUsage = new Map();
      const dailyFeatureUsage = new Map();

      metrics.forEach((metric) => {
        const date = new Date(metric.timestamp);
        const hour = date.getHours();
        const dayOfWeek = date.getDay();
        const month = date.getMonth();
        const feature = metric.feature || 'unknown';

        hourlyUsage[hour]++;
        dailyUsage[dayOfWeek]++;
        monthlyUsage[month]++;

        // Track feature usage by time
        if (!hourlyFeatureUsage.has(feature)) {
          hourlyFeatureUsage.set(feature, new Array(24).fill(0));
        }
        hourlyFeatureUsage.get(feature)[hour]++;

        if (!dailyFeatureUsage.has(feature)) {
          dailyFeatureUsage.set(feature, new Array(7).fill(0));
        }
        dailyFeatureUsage.get(feature)[dayOfWeek]++;
      });

      // Calculate temporal correlations
      const temporalCorrelations = {};

      // Hour-to-hour correlations (adjacent hours)
      const hourlyCorrelations = [];
      for (let i = 0; i < 23; i++) {
        const correlation = this.calculateCorrelation(
          hourlyUsage.slice(i, i + 2),
          hourlyUsage.slice(i + 1, i + 3),
        );
        hourlyCorrelations.push({
          hourRange: `${i}:00-${i + 2}:00`,
          correlation: correlation.coefficient,
        });
      }

      // Day-to-day correlations
      const dailyCorrelations = [];
      const dayNames = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];
      for (let i = 0; i < 6; i++) {
        const correlation = this.calculateCorrelation(
          [dailyUsage[i]],
          [dailyUsage[i + 1]],
        );
        dailyCorrelations.push({
          dayPair: `${dayNames[i]} -> ${dayNames[i + 1]}`,
          correlation: correlation.coefficient,
        });
      }

      // Feature temporal patterns
      const featureTemporalPatterns = new Map();
      hourlyFeatureUsage.forEach((usage, feature) => {
        const peakHour = usage.indexOf(Math.max(...usage));
        const lowHour = usage.indexOf(Math.min(...usage));

        featureTemporalPatterns.set(feature, {
          feature,
          peakHour,
          lowHour,
          usage,
          peakToLowRatio: usage[peakHour] / Math.max(usage[lowHour], 1),
          temporalConsistency: this.calculateTemporalConsistency(usage),
        });
      });

      // Identify time-based usage clusters
      const timeClusters = this.identifyTimeClusters(metrics);

      return {
        hourlyUsage,
        dailyUsage,
        monthlyUsage,
        hourlyCorrelations,
        dailyCorrelations,
        featureTemporalPatterns: Object.fromEntries(featureTemporalPatterns),
        timeClusters,
        peakUsageHour: hourlyUsage.indexOf(Math.max(...hourlyUsage)),
        peakUsageDay: dailyUsage.indexOf(Math.max(...dailyUsage)),
        insights: this.generateTemporalCorrelationInsights(
          hourlyCorrelations,
          dailyCorrelations,
          featureTemporalPatterns,
          timeClusters,
        ),
      };
    } catch (error) {
      this.logger.error('Temporal correlation analysis failed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Analyze user behavior correlations
   * @param {Array} metrics - Usage metrics
   * @returns {Promise<Object>} User behavior correlation analysis
   */
  async analyzeUserBehaviorCorrelations(metrics) {
    this.logger.info('Analyzing user behavior correlations');

    try {
      // Aggregate user behavior data
      const userBehaviors = new Map();

      metrics.forEach((metric) => {
        const userId = metric.userId || 'anonymous';

        if (!userBehaviors.has(userId)) {
          userBehaviors.set(userId, {
            userId,
            totalRequests: 0,
            uniqueFeatures: new Set(),
            totalCost: 0,
            sessions: new Set(),
            avgResponseTime: 0,
            responseTimeCount: 0,
            errorCount: 0,
            timeSlots: new Set(),
            platforms: new Set(),
          });
        }

        const user = userBehaviors.get(userId);
        user.totalRequests++;
        user.totalCost += metric.cost || 0;

        if (metric.feature) user.uniqueFeatures.add(metric.feature);
        if (metric.sessionId) user.sessions.add(metric.sessionId);
        if (metric.error) user.errorCount++;
        if (metric.platform) user.platforms.add(metric.platform);

        if (metric.responseTime) {
          user.avgResponseTime =
            (user.avgResponseTime * user.responseTimeCount +
              metric.responseTime) /
            (user.responseTimeCount + 1);
          user.responseTimeCount++;
        }

        const hour = new Date(metric.timestamp).getHours();
        const timeSlot = this.getTimeSlot(hour);
        user.timeSlots.add(timeSlot);
      });

      // Convert sets to numbers and calculate derived metrics
      userBehaviors.forEach((user) => {
        user.uniqueFeatures = user.uniqueFeatures.size;
        user.sessions = user.sessions.size;
        user.timeSlots = user.timeSlots.size;
        user.platforms = user.platforms.size;
        user.errorRate = user.errorCount / user.totalRequests;
        user.avgCostPerRequest = user.totalCost / user.totalRequests;
        user.featuresPerSession =
          user.uniqueFeatures / Math.max(user.sessions, 1);
      });

      const users = Array.from(userBehaviors.values());

      // Calculate behavior correlations
      const behaviorCorrelations = {
        requestsVsFeatures: this.calculateCorrelation(
          users.map((u) => u.totalRequests),
          users.map((u) => u.uniqueFeatures),
        ),
        requestsVsCost: this.calculateCorrelation(
          users.map((u) => u.totalRequests),
          users.map((u) => u.totalCost),
        ),
        featuresVsCost: this.calculateCorrelation(
          users.map((u) => u.uniqueFeatures),
          users.map((u) => u.totalCost),
        ),
        sessionsVsFeatures: this.calculateCorrelation(
          users.map((u) => u.sessions),
          users.map((u) => u.uniqueFeatures),
        ),
        responseTimeVsCost: this.calculateCorrelation(
          users
            .filter((u) => u.responseTimeCount > 0)
            .map((u) => u.avgResponseTime),
          users.filter((u) => u.responseTimeCount > 0).map((u) => u.totalCost),
        ),
      };

      // Identify user behavior clusters
      const behaviorClusters = this.identifyBehaviorClusters(users);

      // Find behavior patterns
      const behaviorPatterns = this.identifyBehaviorPatterns(users);

      return {
        totalUsers: users.length,
        behaviorCorrelations,
        behaviorClusters,
        behaviorPatterns,
        userSegmentation: this.segmentUsersByBehavior(users),
        insights: this.generateUserBehaviorInsights(
          behaviorCorrelations,
          behaviorClusters,
          behaviorPatterns,
        ),
      };
    } catch (error) {
      this.logger.error('User behavior correlation analysis failed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Analyze platform and device correlations
   * @param {Array} metrics - Usage metrics
   * @returns {Promise<Object>} Platform correlation analysis
   */
  async analyzePlatformCorrelations(metrics) {
    this.logger.info('Analyzing platform correlations');

    try {
      const platformMetrics = metrics.filter(
        (m) => m.platform || m.device || m.userAgent,
      );

      if (platformMetrics.length < this.config.minSampleSize) {
        return {
          message: 'Insufficient platform data for correlation analysis',
          availableMetrics: platformMetrics.length,
        };
      }

      // Extract platform information
      const platformData = new Map();

      platformMetrics.forEach((metric) => {
        const platform = this.extractPlatform(metric);

        if (!platformData.has(platform)) {
          platformData.set(platform, {
            platform,
            requests: 0,
            users: new Set(),
            features: new Set(),
            totalCost: 0,
            avgResponseTime: 0,
            responseTimeCount: 0,
            errorCount: 0,
            sessions: new Set(),
          });
        }

        const data = platformData.get(platform);
        data.requests++;
        data.totalCost += metric.cost || 0;

        if (metric.userId) data.users.add(metric.userId);
        if (metric.feature) data.features.add(metric.feature);
        if (metric.sessionId) data.sessions.add(metric.sessionId);
        if (metric.error) data.errorCount++;

        if (metric.responseTime) {
          data.avgResponseTime =
            (data.avgResponseTime * data.responseTimeCount +
              metric.responseTime) /
            (data.responseTimeCount + 1);
          data.responseTimeCount++;
        }
      });

      // Calculate platform statistics
      platformData.forEach((data) => {
        data.users = data.users.size;
        data.features = data.features.size;
        data.sessions = data.sessions.size;
        data.errorRate = data.errorCount / data.requests;
        data.avgCostPerRequest = data.totalCost / data.requests;
        data.marketShare = (data.requests / platformMetrics.length) * 100;
      });

      const platforms = Array.from(platformData.values());

      // Calculate platform correlations
      const platformCorrelations = {};
      const metrics = [
        'requests',
        'users',
        'features',
        'totalCost',
        'avgResponseTime',
        'errorRate',
      ];

      for (let i = 0; i < metrics.length; i++) {
        for (let j = i + 1; j < metrics.length; j++) {
          const metricA = metrics[i];
          const metricB = metrics[j];

          const valuesA = platforms
            .map((p) => p[metricA])
            .filter((v) => v !== undefined && !isNaN(v));
          const valuesB = platforms
            .map((p) => p[metricB])
            .filter((v) => v !== undefined && !isNaN(v));

          if (
            valuesA.length >= this.config.minSampleSize &&
            valuesB.length >= this.config.minSampleSize
          ) {
            platformCorrelations[`${metricA}_${metricB}`] =
              this.calculateCorrelation(valuesA, valuesB);
          }
        }
      }

      // Identify platform preferences by feature
      const featurePlatformMatrix =
        this.buildFeaturePlatformMatrix(platformMetrics);

      return {
        totalPlatforms: platforms.length,
        platformData: Object.fromEntries(platformData),
        platformCorrelations,
        featurePlatformMatrix,
        dominantPlatform: platforms.reduce(
          (max, p) => (p.marketShare > max.marketShare ? p : max),
          platforms[0],
        ),
        insights: this.generatePlatformInsights(
          platforms,
          platformCorrelations,
          featurePlatformMatrix,
        ),
      };
    } catch (error) {
      this.logger.error('Platform correlation analysis failed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Analyze session-based correlations
   * @param {Array} metrics - Usage metrics
   * @returns {Promise<Object>} Session correlation analysis
   */
  async analyzeSessionCorrelations(metrics) {
    this.logger.info('Analyzing session correlations');

    try {
      // Group metrics by session
      const sessionData = new Map();

      metrics.forEach((metric) => {
        const sessionId =
          metric.sessionId ||
          `${metric.userId || 'anon'}_${new Date(metric.timestamp).toDateString()}`;

        if (!sessionData.has(sessionId)) {
          sessionData.set(sessionId, {
            sessionId,
            userId: metric.userId,
            startTime: metric.timestamp,
            endTime: metric.timestamp,
            requests: 0,
            features: new Set(),
            totalCost: 0,
            avgResponseTime: 0,
            responseTimeCount: 0,
            errors: 0,
            platforms: new Set(),
          });
        }

        const session = sessionData.get(sessionId);
        session.requests++;
        session.totalCost += metric.cost || 0;

        if (metric.feature) session.features.add(metric.feature);
        if (metric.error) session.errors++;
        if (metric.platform) session.platforms.add(metric.platform);

        if (metric.responseTime) {
          session.avgResponseTime =
            (session.avgResponseTime * session.responseTimeCount +
              metric.responseTime) /
            (session.responseTimeCount + 1);
          session.responseTimeCount++;
        }

        if (new Date(metric.timestamp) > new Date(session.endTime)) {
          session.endTime = metric.timestamp;
        }
        if (new Date(metric.timestamp) < new Date(session.startTime)) {
          session.startTime = metric.timestamp;
        }
      });

      // Calculate session metrics
      sessionData.forEach((session) => {
        const duration =
          new Date(session.endTime) - new Date(session.startTime);
        session.durationMinutes = Math.max(
          1,
          Math.round(duration / (1000 * 60)),
        );
        session.features = session.features.size;
        session.platforms = session.platforms.size;
        session.errorRate = session.errors / session.requests;
        session.avgCostPerRequest = session.totalCost / session.requests;
        session.requestsPerMinute = session.requests / session.durationMinutes;
      });

      const sessions = Array.from(sessionData.values());

      // Calculate session correlations
      const sessionCorrelations = {
        durationVsRequests: this.calculateCorrelation(
          sessions.map((s) => s.durationMinutes),
          sessions.map((s) => s.requests),
        ),
        durationVsFeatures: this.calculateCorrelation(
          sessions.map((s) => s.durationMinutes),
          sessions.map((s) => s.features),
        ),
        requestsVsCost: this.calculateCorrelation(
          sessions.map((s) => s.requests),
          sessions.map((s) => s.totalCost),
        ),
        featuresVsCost: this.calculateCorrelation(
          sessions.map((s) => s.features),
          sessions.map((s) => s.totalCost),
        ),
        responseTimeVsDuration: this.calculateCorrelation(
          sessions
            .filter((s) => s.responseTimeCount > 0)
            .map((s) => s.avgResponseTime),
          sessions
            .filter((s) => s.responseTimeCount > 0)
            .map((s) => s.durationMinutes),
        ),
      };

      // Identify session patterns
      const sessionPatterns = this.identifySessionPatterns(sessions);

      return {
        totalSessions: sessions.length,
        sessionCorrelations,
        sessionPatterns,
        avgSessionDuration:
          sessions.reduce((sum, s) => sum + s.durationMinutes, 0) /
          sessions.length,
        mostProductiveSessionType: this.findMostProductiveSessionType(sessions),
        insights: this.generateSessionInsights(
          sessionCorrelations,
          sessionPatterns,
          sessions,
        ),
      };
    } catch (error) {
      this.logger.error('Session correlation analysis failed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Analyze geographic correlations
   * @param {Array} metrics - Usage metrics
   * @returns {Promise<Object>} Geographic correlation analysis
   */
  async analyzeGeographicCorrelations(metrics) {
    this.logger.info('Analyzing geographic correlations');

    try {
      const geoMetrics = metrics.filter(
        (m) => m.location || m.country || m.region,
      );

      if (geoMetrics.length < this.config.minSampleSize) {
        return {
          message: 'Insufficient geographic data for correlation analysis',
          availableMetrics: geoMetrics.length,
        };
      }

      // Group by geographic regions
      const geoData = new Map();

      geoMetrics.forEach((metric) => {
        const region = this.normalizeGeographicRegion(
          metric.location || metric.country || metric.region,
        );

        if (!geoData.has(region)) {
          geoData.set(region, {
            region,
            requests: 0,
            users: new Set(),
            features: new Set(),
            totalCost: 0,
            avgResponseTime: 0,
            responseTimeCount: 0,
            timeSlots: new Map(),
            platforms: new Set(),
          });
        }

        const geo = geoData.get(region);
        geo.requests++;
        geo.totalCost += metric.cost || 0;

        if (metric.userId) geo.users.add(metric.userId);
        if (metric.feature) geo.features.add(metric.feature);
        if (metric.platform) geo.platforms.add(metric.platform);

        if (metric.responseTime) {
          geo.avgResponseTime =
            (geo.avgResponseTime * geo.responseTimeCount +
              metric.responseTime) /
            (geo.responseTimeCount + 1);
          geo.responseTimeCount++;
        }

        // Track usage by time slots
        const hour = new Date(metric.timestamp).getHours();
        const timeSlot = this.getTimeSlot(hour);
        geo.timeSlots.set(timeSlot, (geo.timeSlots.get(timeSlot) || 0) + 1);
      });

      // Calculate geographic statistics
      geoData.forEach((geo) => {
        geo.users = geo.users.size;
        geo.features = geo.features.size;
        geo.platforms = geo.platforms.size;
        geo.avgCostPerRequest = geo.totalCost / geo.requests;
        geo.marketShare = (geo.requests / geoMetrics.length) * 100;
        geo.timeSlots = Object.fromEntries(geo.timeSlots);

        // Find peak time slot for region
        let maxSlot = '';
        let maxCount = 0;
        geo.timeSlots.forEach((count, slot) => {
          if (count > maxCount) {
            maxSlot = slot;
            maxCount = count;
          }
        });
        geo.peakTimeSlot = maxSlot;
      });

      const regions = Array.from(geoData.values());

      // Calculate geographic correlations
      const geoCorrelations = this.calculateGeographicCorrelations(regions);

      // Identify regional patterns
      const regionalPatterns = this.identifyRegionalPatterns(regions);

      return {
        totalRegions: regions.length,
        geoData: Object.fromEntries(geoData),
        geoCorrelations,
        regionalPatterns,
        dominantRegion: regions.reduce(
          (max, r) => (r.marketShare > max.marketShare ? r : max),
          regions[0],
        ),
        insights: this.generateGeographicInsights(
          geoCorrelations,
          regionalPatterns,
          regions,
        ),
      };
    } catch (error) {
      this.logger.error('Geographic correlation analysis failed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Analyze predictive correlations for forecasting
   * @param {Array} metrics - Usage metrics
   * @returns {Promise<Object>} Predictive correlation analysis
   */
  async analyzePredictiveCorrelations(metrics) {
    this.logger.info('Analyzing predictive correlations');

    try {
      // Sort metrics by timestamp
      const sortedMetrics = metrics
        .slice()
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      // Create time series data
      const timeSeriesData = this.createTimeSeriesData(sortedMetrics);

      // Calculate leading and lagging indicators
      const leadingIndicators = this.identifyLeadingIndicators(timeSeriesData);
      const laggingIndicators = this.identifyLaggingIndicators(timeSeriesData);

      // Trend correlations
      const trendCorrelations = this.calculateTrendCorrelations(timeSeriesData);

      // Seasonal correlations
      const seasonalCorrelations =
        this.calculateSeasonalCorrelations(sortedMetrics);

      // Usage momentum analysis
      const momentumAnalysis = this.analyzeMomentum(timeSeriesData);

      return {
        timeSeriesLength: timeSeriesData.length,
        leadingIndicators,
        laggingIndicators,
        trendCorrelations,
        seasonalCorrelations,
        momentumAnalysis,
        insights: this.generatePredictiveInsights(
          leadingIndicators,
          laggingIndicators,
          trendCorrelations,
          momentumAnalysis,
        ),
      };
    } catch (error) {
      this.logger.error('Predictive correlation analysis failed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Perform custom correlation analysis based on provided criteria
   * @param {Array} metrics - Usage metrics
   * @param {Object} options - Custom analysis options
   * @returns {Promise<Object>} Custom correlation results
   */
  async analyzeCustomCorrelations(metrics, options) {
    this.logger.info('Analyzing custom correlations', { options });

    try {
      if (
        !options.customCorrelations ||
        options.customCorrelations.length === 0
      ) {
        return { message: 'No custom correlation criteria provided' };
      }

      const customResults = {};

      for (const customCorr of options.customCorrelations) {
        const { name, fieldA, fieldB, filters } = customCorr;

        // Apply filters if provided
        let filteredMetrics = metrics;
        if (filters) {
          filteredMetrics = this.applyFilters(metrics, filters);
        }

        // Extract values for correlation
        const valuesA = filteredMetrics
          .map((m) => this.extractFieldValue(m, fieldA))
          .filter((v) => v !== undefined && v !== null && !isNaN(v));

        const valuesB = filteredMetrics
          .map((m) => this.extractFieldValue(m, fieldB))
          .filter((v) => v !== undefined && v !== null && !isNaN(v));

        if (
          valuesA.length >= this.config.minSampleSize &&
          valuesB.length >= this.config.minSampleSize
        ) {
          const correlation = this.calculateCorrelation(valuesA, valuesB);

          customResults[name] = {
            name,
            fieldA,
            fieldB,
            correlation: correlation.coefficient,
            significance: correlation.significance,
            sampleSize: Math.min(valuesA.length, valuesB.length),
            strength: this.classifyCorrelationStrength(correlation.coefficient),
            filters: filters || null,
          };
        } else {
          customResults[name] = {
            name,
            fieldA,
            fieldB,
            error: 'Insufficient data for correlation analysis',
            sampleSize: Math.min(valuesA.length, valuesB.length),
          };
        }
      }

      return {
        totalCustomCorrelations: options.customCorrelations.length,
        customResults,
        insights: this.generateCustomCorrelationInsights(customResults),
      };
    } catch (error) {
      this.logger.error('Custom correlation analysis failed', {
        error: error.message,
      });
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

    const validatedMetrics = metrics.filter((metric) => (
        metric &&
        typeof metric === 'object' &&
        metric.timestamp &&
        !isNaN(new Date(metric.timestamp).getTime())
      ));

    this.logger.info('Metrics validated for correlation analysis', {
      original: metrics.length,
      valid: validatedMetrics.length,
    });

    return validatedMetrics;
  }

  /**
   * Calculate Pearson correlation coefficient
   * @param {Array} x - First dataset
   * @param {Array} y - Second dataset
   * @returns {Object} Correlation result with coefficient and significance
   */
  calculateCorrelation(x, y) {
    if (
      !Array.isArray(x) ||
      !Array.isArray(y) ||
      x.length !== y.length ||
      x.length === 0
    ) {
      return { coefficient: 0, significance: 0, sampleSize: 0 };
    }

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY),
    );

    const coefficient = denominator === 0 ? 0 : numerator / denominator;

    // Calculate statistical significance (simplified)
    const tStatistic =
      coefficient * Math.sqrt((n - 2) / (1 - coefficient * coefficient));
    const significance = Math.min(1, Math.abs(tStatistic) / 2); // Simplified p-value estimation

    return {
      coefficient: Number.isFinite(coefficient) ? coefficient : 0,
      significance: Number.isFinite(significance) ? significance : 0,
      sampleSize: n,
    };
  }

  /**
   * Classify correlation strength
   * @param {number} coefficient - Correlation coefficient
   * @returns {string} Strength classification
   */
  classifyCorrelationStrength(coefficient) {
    const abs = Math.abs(coefficient);
    if (abs >= this.config.strongCorrelationThreshold) return 'strong';
    if (abs >= this.config.moderateCorrelationThreshold) return 'moderate';
    if (abs >= this.config.weakCorrelationThreshold) return 'weak';
    return 'negligible';
  }

  /**
   * Calculate analysis window from metrics
   * @param {Array} metrics - Metrics data
   * @returns {Object} Analysis window information
   */
  calculateAnalysisWindow(metrics) {
    const timestamps = metrics
      .map((m) => new Date(m.timestamp))
      .sort((a, b) => a - b);
    const startDate = timestamps[0];
    const endDate = timestamps[timestamps.length - 1];
    const durationDays = Math.ceil(
      (endDate - startDate) / (1000 * 60 * 60 * 24),
    );

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      durationDays,
      totalDataPoints: metrics.length,
    };
  }

  /**
   * Extract strong correlations from all results
   * @param {Array} correlationResults - All correlation analysis results
   * @returns {Array} Strong correlations
   */
  extractStrongCorrelations(correlationResults) {
    const strongCorrelations = [];

    correlationResults.forEach((result) => {
      if (result.strongCorrelations) {
        strongCorrelations.push(...result.strongCorrelations);
      }
      if (result.correlationMatrix) {
        const strong = Object.values(result.correlationMatrix).filter(
          (c) => c.strength === 'strong',
        );
        strongCorrelations.push(...strong);
      }
    });

    return strongCorrelations.sort(
      (a, b) =>
        Math.abs(b.correlation || b.coefficient || 0) -
        Math.abs(a.correlation || a.coefficient || 0),
    );
  }

  /**
   * Generate correlation summary
   * @param {Array} correlationResults - All correlation results
   * @returns {Object} Summary statistics
   */
  generateCorrelationSummary(correlationResults) {
    const summary = {
      totalAnalysisTypes: correlationResults.length,
      strongCorrelations: 0,
      moderateCorrelations: 0,
      weakCorrelations: 0,
      negligibleCorrelations: 0,
    };

    correlationResults.forEach((result) => {
      if (result.correlationMatrix) {
        Object.values(result.correlationMatrix).forEach((corr) => {
          summary[`${corr.strength}Correlations`]++;
        });
      }
    });

    return summary;
  }

  /**
   * Count total correlations across all analysis types
   * @param {Object} correlations - All correlation results
   * @returns {number} Total correlation count
   */
  countTotalCorrelations(correlations) {
    let total = 0;
    Object.values(correlations).forEach((correlation) => {
      if (correlation.correlationMatrix) {
        total += Object.keys(correlation.correlationMatrix).length;
      }
      if (correlation.correlations) {
        total += Object.keys(correlation.correlations).length;
      }
    });
    return total;
  }

  // Additional helper methods would be implemented here for specific analysis types
  // (truncated for brevity - the actual implementation would include all referenced methods)

  /**
   * Generate actionable insights from correlation analysis
   * @param {Array} correlationResults - All correlation results
   * @returns {Promise<Array>} Actionable insights
   */
  async generateActionableInsights(correlationResults) {
    this.logger.info('Generating actionable insights from correlations');

    const insights = [];

    // Extract insights from strong correlations
    const strongCorrelations =
      this.extractStrongCorrelations(correlationResults);

    strongCorrelations.slice(0, 5).forEach((corr) => {
      insights.push({
        type: 'correlation',
        priority: 'high',
        message: `Strong correlation detected between ${corr.featureA || corr.fieldA} and ${corr.featureB || corr.fieldB} (r=${(corr.correlation || corr.coefficient).toFixed(3)})`,
        actionable: true,
        impact: 'optimization_opportunity',
      });
    });

    return insights;
  }

  // Placeholder methods for specific analysis implementations
  // These would be fully implemented in the actual system

  calculateFeaturePairCorrelation(featureA, featureB, userMatrix) {
    // Implementation for feature pair correlation calculation
    return { coefficient: 0, significance: 0, sampleSize: 0 };
  }

  analyzeFeatureGroupCorrelations(metrics) {
    // Implementation for feature group correlation analysis
    return {};
  }

  findMostCorrelatedFeature(correlationMatrix) {
    // Implementation to find most correlated feature
    return null;
  }

  generateFeatureCorrelationInsights(matrix, strong) {
    return [];
  }

  calculateVariation(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      values.length;
    return Math.sqrt(variance);
  }

  identifyCostPatterns(metrics) {
    return {};
  }

  generateCostUsageInsights(correlations, featureAnalysis, patterns) {
    return [];
  }

  calculateTemporalConsistency(usage) {
    return 0;
  }

  identifyTimeClusters(metrics) {
    return {};
  }

  generateTemporalCorrelationInsights(hourly, daily, features, clusters) {
    return [];
  }

  getTimeSlot(hour) {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 24) return 'evening';
    return 'night';
  }

  identifyBehaviorClusters(users) {
    return {};
  }

  identifyBehaviorPatterns(users) {
    return {};
  }

  segmentUsersByBehavior(users) {
    return {};
  }

  generateUserBehaviorInsights(correlations, clusters, patterns) {
    return [];
  }

  extractPlatform(metric) {
    return metric.platform || metric.device || 'unknown';
  }

  buildFeaturePlatformMatrix(metrics) {
    return {};
  }

  generatePlatformInsights(platforms, correlations, matrix) {
    return [];
  }

  identifySessionPatterns(sessions) {
    return {};
  }

  findMostProductiveSessionType(sessions) {
    return null;
  }

  generateSessionInsights(correlations, patterns, sessions) {
    return [];
  }

  normalizeGeographicRegion(region) {
    return region.toLowerCase().trim();
  }

  calculateGeographicCorrelations(regions) {
    return {};
  }

  identifyRegionalPatterns(regions) {
    return {};
  }

  generateGeographicInsights(correlations, patterns, regions) {
    return [];
  }

  createTimeSeriesData(metrics) {
    return [];
  }

  identifyLeadingIndicators(data) {
    return {};
  }

  identifyLaggingIndicators(data) {
    return {};
  }

  calculateTrendCorrelations(data) {
    return {};
  }

  calculateSeasonalCorrelations(metrics) {
    return {};
  }

  analyzeMomentum(data) {
    return {};
  }

  generatePredictiveInsights(leading, lagging, trends, momentum) {
    return [];
  }

  applyFilters(metrics, filters) {
    return metrics; // Placeholder implementation
  }

  extractFieldValue(metric, field) {
    return metric[field];
  }

  generateCustomCorrelationInsights(results) {
    return [];
  }
}

/**
 * Create a new CorrelationEngine instance
 * @param {Object} config - Configuration options
 * @returns {CorrelationEngine} New correlation engine instance
 */
export function createCorrelationEngine(config = {}) {
  return new CorrelationEngine(config);
}
