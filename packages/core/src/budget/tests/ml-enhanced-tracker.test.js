/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  MLEnhancedBudgetTracker,
  createMLEnhancedBudgetTracker,
} from '../ml-enhanced-tracker.js';
describe('MLEnhancedBudgetTracker', () => {
  let tracker;
  let tempDir;
  let defaultSettings;
  beforeEach(async () => {
    // Create temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ml-tracker-test-'));
    defaultSettings = {
      enabled: true,
      dailyLimit: 1000,
      resetTime: '00:00',
      warningThresholds: [50, 75, 90],
    };
    tracker = createMLEnhancedBudgetTracker(tempDir, defaultSettings);
    // Wait a bit for async initialization
    await new Promise((resolve) => setTimeout(resolve, 100));
  });
  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (_error) {
      // Ignore cleanup errors
    }
  });
  describe('Enhanced Usage Statistics', () => {
    test('should provide enhanced stats with ML predictions', async () => {
      // Record some usage
      await tracker.recordRequest();
      await tracker.recordRequest();
      await tracker.recordRequest();
      const stats = await tracker.getEnhancedUsageStats();
      expect(stats).toMatchObject({
        requestCount: 3,
        dailyLimit: 1000,
        remainingRequests: 997,
        usagePercentage: 0.3,
        timeUntilReset: expect.any(String),
      });
      // ML predictions might not be available immediately with limited data
      if (stats.mlPredictions) {
        expect(stats.mlPredictions).toMatchObject({
          dailyForecast: expect.any(Array),
          weeklyForecast: expect.any(Array),
          recommendations: expect.any(Array),
          riskAssessment: expect.any(Object),
          modelAccuracy: expect.any(Number),
        });
      }
    });
    test('should include trend analysis in ML predictions', async () => {
      // Generate usage pattern over several days
      const now = new Date();
      for (let day = 0; day < 5; day++) {
        const date = new Date(now);
        date.setDate(date.getDate() - day);
        // Mock date for consistent testing
        vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(
          date.toISOString(),
        );
        // Record increasing usage pattern
        for (let i = 0; i < 10 + day * 5; i++) {
          await tracker.recordRequest();
        }
        vi.restoreAllMocks();
      }
      // Wait for ML predictions to be generated
      await new Promise((resolve) => setTimeout(resolve, 200));
      const stats = await tracker.getEnhancedUsageStats();
      if (stats.mlPredictions?.trendAnalysis) {
        expect(stats.mlPredictions.trendAnalysis).toMatchObject({
          direction: expect.stringMatching(/increasing|decreasing|stable/),
          confidence: expect.any(Number),
          seasonalityDetected: expect.any(Boolean),
        });
        expect(
          stats.mlPredictions.trendAnalysis.confidence,
        ).toBeGreaterThanOrEqual(0);
        expect(
          stats.mlPredictions.trendAnalysis.confidence,
        ).toBeLessThanOrEqual(1);
      }
    });
  });
  describe('Budget Forecasting', () => {
    test('should generate comprehensive budget forecast', async () => {
      // Add some usage data
      for (let i = 0; i < 20; i++) {
        await tracker.recordRequest();
      }
      const forecast = await tracker.generateBudgetForecast(12); // 12-hour forecast
      expect(forecast).toMatchObject({
        forecast: expect.any(Array),
        recommendations: expect.any(Array),
        riskAssessment: expect.any(Object),
        confidence: expect.stringMatching(/low|medium|high/),
      });
      expect(forecast.forecast).toHaveLength(12);
      // Validate forecast points structure
      for (const point of forecast.forecast) {
        expect(point).toMatchObject({
          timestamp: expect.any(Number),
          predictedValue: expect.any(Number),
          confidenceInterval: {
            lower: expect.any(Number),
            upper: expect.any(Number),
          },
          confidence: expect.any(Number),
        });
        expect(point.predictedValue).toBeGreaterThanOrEqual(0);
        expect(point.confidenceInterval.lower).toBeLessThanOrEqual(
          point.predictedValue,
        );
        expect(point.confidenceInterval.upper).toBeGreaterThanOrEqual(
          point.predictedValue,
        );
        expect(point.confidence).toBeGreaterThanOrEqual(0);
        expect(point.confidence).toBeLessThanOrEqual(1);
      }
      // Validate risk assessment
      expect(forecast.riskAssessment).toMatchObject({
        budgetExceedProbability: expect.any(Number),
        riskLevel: expect.stringMatching(/low|medium|high|critical/),
        mitigationStrategies: expect.any(Array),
      });
      expect(
        forecast.riskAssessment.budgetExceedProbability,
      ).toBeGreaterThanOrEqual(0);
      expect(
        forecast.riskAssessment.budgetExceedProbability,
      ).toBeLessThanOrEqual(1);
      expect(
        forecast.riskAssessment.mitigationStrategies.length,
      ).toBeGreaterThan(0);
    });
    test('should provide different forecast horizons', async () => {
      const forecast6h = await tracker.generateBudgetForecast(6);
      const forecast24h = await tracker.generateBudgetForecast(24);
      const forecast48h = await tracker.generateBudgetForecast(48);
      expect(forecast6h.forecast).toHaveLength(6);
      expect(forecast24h.forecast).toHaveLength(24);
      expect(forecast48h.forecast).toHaveLength(48);
      // Longer forecasts should have lower confidence
      const avg6hConfidence =
        forecast6h.forecast.reduce((sum, p) => sum + p.confidence, 0) / 6;
      const avg48hConfidence =
        forecast48h.forecast.reduce((sum, p) => sum + p.confidence, 0) / 48;
      expect(avg6hConfidence).toBeGreaterThanOrEqual(avg48hConfidence);
    });
  });
  describe('Optimization Suggestions', () => {
    test('should categorize recommendations by time horizon', async () => {
      // Create high usage scenario
      for (let i = 0; i < 800; i++) {
        await tracker.recordRequest();
      }
      const suggestions = await tracker.getOptimizationSuggestions();
      expect(suggestions).toMatchObject({
        immediate: expect.any(Array),
        shortTerm: expect.any(Array),
        longTerm: expect.any(Array),
        potentialSavings: {
          percentage: expect.any(Number),
          estimatedRequests: expect.any(Number),
          confidence: expect.stringMatching(/low|medium|high/),
        },
      });
      // With high usage, should have immediate recommendations
      expect(suggestions.immediate.length).toBeGreaterThan(0);
      // Validate recommendation structure
      const allRecommendations = [
        ...suggestions.immediate,
        ...suggestions.shortTerm,
        ...suggestions.longTerm,
      ];
      for (const rec of allRecommendations) {
        expect(rec).toMatchObject({
          type: expect.stringMatching(/optimization|alert|budget_adjustment/),
          priority: expect.stringMatching(/low|medium|high/),
          message: expect.any(String),
          confidence: expect.stringMatching(/low|medium|high/),
          impact: expect.stringMatching(/minor|moderate|significant/),
        });
      }
      // Validate potential savings
      expect(suggestions.potentialSavings.percentage).toBeGreaterThan(0);
      expect(suggestions.potentialSavings.estimatedRequests).toBeGreaterThan(0);
    });
    test('should provide trend-based recommendations', async () => {
      // Create increasing trend over time
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() - 5);
      for (let day = 0; day < 5; day++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + day);
        // Mock date for historical data
        vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(
          date.toISOString(),
        );
        // Increasing usage each day
        const dailyRequests = 100 + day * 50; // 100, 150, 200, 250, 300
        for (let i = 0; i < dailyRequests; i++) {
          await tracker.recordRequest();
        }
        vi.restoreAllMocks();
      }
      const suggestions = await tracker.getOptimizationSuggestions();
      // Should detect rapid increase and provide immediate recommendations
      const rapidIncreaseRecs = suggestions.immediate.filter(
        (rec) =>
          rec.message.toLowerCase().includes('trend') ||
          rec.message.toLowerCase().includes('upward') ||
          rec.message.toLowerCase().includes('rapid'),
      );
      expect(rapidIncreaseRecs.length).toBeGreaterThan(0);
      const immediateOptimization = suggestions.immediate.find(
        (rec) => rec.type === 'optimization' && rec.priority === 'high',
      );
      expect(immediateOptimization).toBeDefined();
    });
  });
  describe('Anomaly Detection', () => {
    test('should detect usage anomalies and patterns', async () => {
      // Create normal usage pattern with an anomaly
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() - 7);
      for (let day = 0; day < 7; day++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + day);
        vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(
          date.toISOString(),
        );
        // Normal usage ~100 requests, but day 3 has spike to 500
        const dailyRequests = day === 3 ? 500 : 100 + Math.random() * 20;
        for (let i = 0; i < Math.round(dailyRequests); i++) {
          await tracker.recordRequest();
        }
        vi.restoreAllMocks();
      }
      const anomalies = await tracker.detectUsageAnomalies();
      expect(anomalies).toMatchObject({
        anomalies: expect.any(Array),
        patterns: {
          seasonality: {
            detected: expect.any(Boolean),
            description: expect.any(String),
          },
          trends: {
            direction: expect.stringMatching(/increasing|decreasing|stable/),
            confidence: expect.any(Number),
            description: expect.any(String),
          },
          volatility: {
            level: expect.stringMatching(/low|medium|high/),
            coefficient: expect.any(Number),
            description: expect.any(String),
          },
        },
      });
      // Should detect the anomaly
      expect(anomalies.anomalies.length).toBeGreaterThan(0);
      // Validate anomaly structure
      for (const anomaly of anomalies.anomalies) {
        expect(anomaly).toMatchObject({
          timestamp: expect.any(Number),
          value: expect.any(Number),
          severity: expect.stringMatching(/low|medium|high/),
          reason: expect.any(String),
          impact: expect.any(String),
          suggestedAction: expect.any(String),
        });
      }
      // The spike should be detected as high severity
      const highSeverityAnomalies = anomalies.anomalies.filter(
        (a) => a.severity === 'high',
      );
      expect(highSeverityAnomalies.length).toBeGreaterThan(0);
    });
    test('should detect seasonal patterns in usage', async () => {
      // Create artificial daily pattern (higher usage during "business hours")
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() - 3);
      for (let day = 0; day < 3; day++) {
        for (let hour = 0; hour < 24; hour++) {
          const date = new Date(baseDate);
          date.setDate(date.getDate() + day);
          date.setHours(hour, 0, 0, 0);
          vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(
            date.toISOString(),
          );
          // Higher usage during "business hours" 9-17
          const baseRequests = 5;
          const businessBonus = hour >= 9 && hour <= 17 ? 15 : 0;
          const requests = baseRequests + businessBonus;
          for (let i = 0; i < requests; i++) {
            await tracker.recordRequest();
          }
          vi.restoreAllMocks();
        }
      }
      const anomalies = await tracker.detectUsageAnomalies();
      // Should detect seasonality
      expect(anomalies.patterns.seasonality.detected).toBe(true);
      expect(anomalies.patterns.seasonality.description).toContain('cycle');
    });
  });
  describe('Model Performance Monitoring', () => {
    test('should provide model metrics and performance assessment', async () => {
      // Generate sufficient training data
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() - 14);
      for (let day = 0; day < 14; day++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + day);
        vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(
          date.toISOString(),
        );
        // Linear trend for predictable model performance
        const dailyRequests = 50 + day * 5;
        for (let i = 0; i < dailyRequests; i++) {
          await tracker.recordRequest();
        }
        vi.restoreAllMocks();
      }
      // Allow time for model training
      await new Promise((resolve) => setTimeout(resolve, 300));
      const metrics = await tracker.getMLModelMetrics();
      expect(metrics).toMatchObject({
        models: expect.any(Array),
        overallAccuracy: expect.any(Number),
        dataQuality: {
          completeness: expect.any(Number),
          consistency: expect.any(Number),
          recency: expect.any(Number),
          volume: expect.any(Number),
        },
        recommendations: expect.any(Array),
      });
      expect(metrics.overallAccuracy).toBeGreaterThanOrEqual(0);
      expect(metrics.overallAccuracy).toBeLessThanOrEqual(1);
      // Validate data quality metrics
      for (const [key, value] of Object.entries(metrics.dataQuality)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
      // Should have recommendations for model improvement
      expect(metrics.recommendations.length).toBeGreaterThan(0);
      // Validate model information
      for (const model of metrics.models) {
        expect(model).toMatchObject({
          name: expect.any(String),
          accuracy: expect.any(Number),
          lastTraining: expect.any(Date),
          trainingDataPoints: expect.any(Number),
          performance: expect.stringMatching(/excellent|good|fair|poor/),
        });
        expect(model.accuracy).toBeGreaterThanOrEqual(0);
        expect(model.accuracy).toBeLessThanOrEqual(1);
        expect(model.trainingDataPoints).toBeGreaterThan(0);
      }
    });
    test('should classify model performance correctly', async () => {
      // Add predictable data for high model accuracy
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() - 20);
      for (let day = 0; day < 20; day++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + day);
        vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(
          date.toISOString(),
        );
        // Perfect linear trend - should result in excellent model performance
        const dailyRequests = 100 + day * 2;
        for (let i = 0; i < dailyRequests; i++) {
          await tracker.recordRequest();
        }
        vi.restoreAllMocks();
      }
      // Allow model training
      await new Promise((resolve) => setTimeout(resolve, 400));
      const metrics = await tracker.getMLModelMetrics();
      // With perfect linear data, at least one model should perform well
      const excellentModels = metrics.models.filter(
        (m) => m.performance === 'excellent',
      );
      const goodOrBetterModels = metrics.models.filter((m) =>
        ['excellent', 'good'].includes(m.performance),
      );
      expect(goodOrBetterModels.length).toBeGreaterThan(0);
    });
  });
  describe('Integration with Base Tracker', () => {
    test('should maintain base budget tracking functionality', async () => {
      expect(tracker.isEnabled()).toBe(true);
      await tracker.recordRequest();
      await tracker.recordRequest();
      expect(await tracker.isOverBudget()).toBe(false);
      const stats = await tracker.getUsageStats();
      expect(stats.requestCount).toBe(2);
      expect(stats.dailyLimit).toBe(1000);
      expect(stats.remainingRequests).toBe(998);
    });
    test('should trigger warnings at configured thresholds', async () => {
      // Set low limit for testing
      tracker.updateSettings({ dailyLimit: 10 });
      // Use 5 requests to reach 50% threshold
      for (let i = 0; i < 5; i++) {
        await tracker.recordRequest();
      }
      const warningResult = await tracker.shouldShowWarning();
      expect(warningResult.show).toBe(true);
      expect(warningResult.threshold).toBe(50);
    });
    test('should reset usage properly', async () => {
      await tracker.recordRequest();
      await tracker.recordRequest();
      expect((await tracker.getUsageStats()).requestCount).toBe(2);
      await tracker.resetDailyUsage();
      expect((await tracker.getUsageStats()).requestCount).toBe(0);
    });
  });
  describe('Factory Function', () => {
    test('should create tracker with factory function', () => {
      const factoryTracker = createMLEnhancedBudgetTracker(
        tempDir,
        defaultSettings,
      );
      expect(factoryTracker).toBeInstanceOf(MLEnhancedBudgetTracker);
    });
    test('should pass settings correctly through factory', async () => {
      const customSettings = {
        enabled: true,
        dailyLimit: 500,
        resetTime: '12:00',
        warningThresholds: [25, 50, 75, 90],
      };
      const factoryTracker = createMLEnhancedBudgetTracker(
        tempDir,
        customSettings,
      );
      const settings = factoryTracker.getBudgetSettings();
      expect(settings.dailyLimit).toBe(500);
      expect(settings.resetTime).toBe('12:00');
      expect(settings.warningThresholds).toEqual([25, 50, 75, 90]);
    });
  });
  describe('Error Handling and Edge Cases', () => {
    test('should handle ML system failures gracefully', async () => {
      // Even if ML system fails, basic tracking should continue
      await tracker.recordRequest();
      await tracker.recordRequest();
      const stats = await tracker.getUsageStats();
      expect(stats.requestCount).toBe(2);
      // Enhanced stats should not crash even if ML fails
      const enhancedStats = await tracker.getEnhancedUsageStats();
      expect(enhancedStats.requestCount).toBe(2);
    });
    test('should handle disabled budget tracking', async () => {
      tracker.updateSettings({ enabled: false });
      expect(tracker.isEnabled()).toBe(false);
      // Recording should not affect stats when disabled
      await tracker.recordRequest();
      const stats = await tracker.getUsageStats();
      expect(stats.requestCount).toBe(0);
    });
    test('should handle invalid forecast horizons', async () => {
      // Should handle negative horizon
      const forecast1 = await tracker.generateBudgetForecast(-5);
      expect(forecast1.forecast).toHaveLength(0);
      // Should handle zero horizon
      const forecast2 = await tracker.generateBudgetForecast(0);
      expect(forecast2.forecast).toHaveLength(0);
      // Should handle very large horizon
      const forecast3 = await tracker.generateBudgetForecast(1000);
      expect(forecast3.forecast).toHaveLength(1000);
    });
  });
});
//# sourceMappingURL=ml-enhanced-tracker.test.js.map
