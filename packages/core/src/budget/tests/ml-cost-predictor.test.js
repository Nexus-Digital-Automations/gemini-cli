/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { MLCostPredictor, } from '../ml-cost-predictor.js';
describe('MLCostPredictor', () => {
    let predictor;
    let tempDir;
    beforeEach(async () => {
        // Create temporary directory for testing
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ml-predictor-test-'));
        predictor = new MLCostPredictor(tempDir);
        await predictor.initialize();
    });
    afterEach(async () => {
        // Clean up temporary directory
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        }
        catch (_error) {
            // Ignore cleanup errors
        }
    });
    describe('Initialization', () => {
        test('should initialize with empty historical data', async () => {
            const historicalData = await predictor.exportHistoricalData();
            expect(historicalData).toEqual([]);
        });
        test('should initialize model metrics map', async () => {
            const metrics = await predictor.getModelMetrics();
            expect(metrics).toBeInstanceOf(Map);
            expect(metrics.size).toBe(0);
        });
    });
    describe('Data Recording and Management', () => {
        test('should record usage data with proper feature extraction', async () => {
            const usageData = {
                date: '2025-01-15',
                requestCount: 150,
                lastResetTime: new Date().toISOString(),
                warningsShown: [],
                alertsSent: [],
            };
            await predictor.recordUsageData(usageData);
            const historicalData = await predictor.exportHistoricalData();
            expect(historicalData).toHaveLength(1);
            expect(historicalData[0]).toMatchObject({
                date: '2025-01-15',
                requestCount: 150,
                dayOfWeek: expect.any(Number),
                dayOfMonth: expect.any(Number),
                weekOfYear: expect.any(Number),
                monthOfYear: expect.any(Number),
                hour: expect.any(Number),
                minute: expect.any(Number),
                isWeekend: expect.any(Boolean),
                timestamp: expect.any(Number),
            });
        });
        test('should limit historical data to 365 days', async () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 400); // 400 days ago
            // Add old data point
            const oldUsageData = {
                date: oldDate.toISOString().split('T')[0],
                requestCount: 100,
                lastResetTime: oldDate.toISOString(),
                warningsShown: [],
                alertsSent: [],
            };
            // Mock timestamp for old data
            const originalDateNow = Date.now;
            Date.now = () => oldDate.getTime();
            await predictor.recordUsageData(oldUsageData);
            // Restore Date.now and add recent data
            Date.now = originalDateNow;
            const recentUsageData = {
                date: new Date().toISOString().split('T')[0],
                requestCount: 200,
                lastResetTime: new Date().toISOString(),
                warningsShown: [],
                alertsSent: [],
            };
            await predictor.recordUsageData(recentUsageData);
            const historicalData = await predictor.exportHistoricalData();
            expect(historicalData).toHaveLength(1); // Old data should be filtered out
            expect(historicalData[0].requestCount).toBe(200);
        });
    });
    describe('Budget Predictions', () => {
        test('should return default prediction with insufficient data', async () => {
            const prediction = await predictor.generateBudgetPrediction(1000);
            expect(prediction).toMatchObject({
                currentUsage: 0,
                predictedDailyUsage: 100, // 10% of limit
                predictedWeeklyUsage: 700,
                predictedMonthlyUsage: 3000,
                recommendations: expect.arrayContaining([
                    expect.objectContaining({
                        type: 'alert',
                        priority: 'low',
                        message: expect.stringContaining('Insufficient historical data'),
                    }),
                ]),
                riskAssessment: expect.objectContaining({
                    budgetExceedProbability: 0.1,
                }),
            });
        });
        test('should generate accurate predictions with sufficient data', async () => {
            // Add 14 days of historical data with consistent pattern
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 14);
            for (let i = 0; i < 14; i++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                const usageData = {
                    date: date.toISOString().split('T')[0],
                    requestCount: 100 + i * 5, // Increasing trend
                    lastResetTime: date.toISOString(),
                    warningsShown: [],
                    alertsSent: [],
                };
                // Mock Date.now to simulate historical timestamps
                const originalDateNow = Date.now;
                Date.now = () => date.getTime();
                await predictor.recordUsageData(usageData);
                Date.now = originalDateNow;
            }
            const prediction = await predictor.generateBudgetPrediction(1000);
            expect(prediction.predictedDailyUsage).toBeGreaterThan(100);
            expect(prediction.predictedWeeklyUsage).toBe(prediction.predictedDailyUsage * 7);
            expect(prediction.predictedMonthlyUsage).toBe(prediction.predictedDailyUsage * 30);
            expect(prediction.recommendations.length).toBeGreaterThan(0);
            expect(prediction.riskAssessment.budgetExceedProbability).toBeGreaterThanOrEqual(0);
            expect(prediction.riskAssessment.budgetExceedProbability).toBeLessThanOrEqual(1);
        });
        test('should detect high risk scenarios', async () => {
            // Add data showing rapid increase toward limit
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
            for (let i = 0; i < 7; i++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                const usageData = {
                    date: date.toISOString().split('T')[0],
                    requestCount: 800 + i * 50, // Rapid increase, approaching 1000 limit
                    lastResetTime: date.toISOString(),
                    warningsShown: [],
                    alertsSent: [],
                };
                const originalDateNow = Date.now;
                Date.now = () => date.getTime();
                await predictor.recordUsageData(usageData);
                Date.now = originalDateNow;
            }
            const prediction = await predictor.generateBudgetPrediction(1000);
            expect(prediction.riskAssessment.budgetExceedProbability).toBeGreaterThan(0.5);
            expect(prediction.recommendations).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    type: 'budget_adjustment',
                    priority: expect.stringMatching(/medium|high/),
                }),
            ]));
        });
    });
    describe('Trend Analysis', () => {
        test('should detect increasing trends', async () => {
            // Add increasing trend data
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 10);
            for (let i = 0; i < 10; i++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                const usageData = {
                    date: date.toISOString().split('T')[0],
                    requestCount: 50 + i * 10, // Clear increasing trend
                    lastResetTime: date.toISOString(),
                    warningsShown: [],
                    alertsSent: [],
                };
                const originalDateNow = Date.now;
                Date.now = () => date.getTime();
                await predictor.recordUsageData(usageData);
                Date.now = originalDateNow;
            }
            const trends = await predictor.analyzeTrends();
            expect(trends.direction).toBe('increasing');
            expect(trends.slope).toBeGreaterThan(0);
            expect(Math.abs(trends.correlation)).toBeGreaterThan(0.5); // Strong correlation
        });
        test('should detect seasonal patterns', async () => {
            // Add data with daily pattern (higher usage during certain hours)
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 3);
            for (let day = 0; day < 3; day++) {
                for (let hour = 0; hour < 24; hour++) {
                    const date = new Date(startDate);
                    date.setDate(date.getDate() + day);
                    date.setHours(hour, 0, 0, 0);
                    // Simulate higher usage during business hours (9-17)
                    const baseUsage = 20;
                    const businessHourBonus = hour >= 9 && hour <= 17 ? 30 : 0;
                    const requestCount = baseUsage + businessHourBonus + Math.random() * 10;
                    const usageData = {
                        date: date.toISOString().split('T')[0],
                        requestCount: Math.round(requestCount),
                        lastResetTime: date.toISOString(),
                        warningsShown: [],
                        alertsSent: [],
                    };
                    const originalDateNow = Date.now;
                    Date.now = () => date.getTime();
                    await predictor.recordUsageData(usageData);
                    Date.now = originalDateNow;
                }
            }
            const trends = await predictor.analyzeTrends();
            expect(trends.seasonality.detected).toBe(true);
            expect(trends.seasonality.period).toBe(24);
            expect(trends.seasonality.strength).toBeGreaterThan(0.2);
        });
        test('should identify anomalies', async () => {
            // Add normal data with one clear anomaly
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 10);
            for (let i = 0; i < 10; i++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                // Normal usage around 100, except for day 5 which has 500 (anomaly)
                const requestCount = i === 5 ? 500 : 100 + Math.random() * 20;
                const usageData = {
                    date: date.toISOString().split('T')[0],
                    requestCount: Math.round(requestCount),
                    lastResetTime: date.toISOString(),
                    warningsShown: [],
                    alertsSent: [],
                };
                const originalDateNow = Date.now;
                Date.now = () => date.getTime();
                await predictor.recordUsageData(usageData);
                Date.now = originalDateNow;
            }
            const trends = await predictor.analyzeTrends();
            expect(trends.anomalies.length).toBeGreaterThan(0);
            const highSeverityAnomalies = trends.anomalies.filter((a) => a.severity === 'high');
            expect(highSeverityAnomalies.length).toBeGreaterThan(0);
        });
    });
    describe('Model Performance and Metrics', () => {
        test('should train models with sufficient data', async () => {
            // Add sufficient training data (>7 days)
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 14);
            for (let i = 0; i < 14; i++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                const usageData = {
                    date: date.toISOString().split('T')[0],
                    requestCount: 100 + Math.sin(i * 0.5) * 20, // Some pattern with noise
                    lastResetTime: date.toISOString(),
                    warningsShown: [],
                    alertsSent: [],
                };
                const originalDateNow = Date.now;
                Date.now = () => date.getTime();
                await predictor.recordUsageData(usageData);
                Date.now = originalDateNow;
            }
            // Force model training by adding more data points
            for (let i = 0; i < 7; i++) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const usageData = {
                    date: date.toISOString().split('T')[0],
                    requestCount: 120,
                    lastResetTime: date.toISOString(),
                    warningsShown: [],
                    alertsSent: [],
                };
                await predictor.recordUsageData(usageData);
            }
            const metrics = await predictor.getModelMetrics();
            expect(metrics.size).toBeGreaterThan(0);
            for (const [algorithm, modelMetrics] of metrics) {
                expect(['linear', 'exponential', 'seasonal']).toContain(algorithm);
                expect(modelMetrics.accuracy).toBeGreaterThanOrEqual(0);
                expect(modelMetrics.accuracy).toBeLessThanOrEqual(1);
                expect(modelMetrics.mae).toBeGreaterThanOrEqual(0);
                expect(modelMetrics.rmse).toBeGreaterThanOrEqual(0);
                expect(modelMetrics.trainingDataPoints).toBeGreaterThan(0);
            }
        });
        test('should calculate accurate performance metrics', async () => {
            // Add predictable linear data for testing accuracy
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 20);
            for (let i = 0; i < 20; i++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                const usageData = {
                    date: date.toISOString().split('T')[0],
                    requestCount: 50 + i * 2, // Perfect linear progression
                    lastResetTime: date.toISOString(),
                    warningsShown: [],
                    alertsSent: [],
                };
                const originalDateNow = Date.now;
                Date.now = () => date.getTime();
                await predictor.recordUsageData(usageData);
                Date.now = originalDateNow;
            }
            // Force training
            const extraUsageData = {
                date: new Date().toISOString().split('T')[0],
                requestCount: 90,
                lastResetTime: new Date().toISOString(),
                warningsShown: [],
                alertsSent: [],
            };
            await predictor.recordUsageData(extraUsageData);
            const metrics = await predictor.getModelMetrics();
            // Linear model should perform well on linear data
            const linearMetrics = metrics.get('linear');
            expect(linearMetrics).toBeDefined();
            if (linearMetrics) {
                expect(linearMetrics.accuracy).toBeGreaterThan(0.8); // Should be high for linear data
                expect(linearMetrics.r2Score).toBeGreaterThan(0.8); // R-squared should be high
            }
        });
    });
    describe('Data Persistence', () => {
        test('should persist and load historical data', async () => {
            const usageData = {
                date: '2025-01-15',
                requestCount: 150,
                lastResetTime: new Date().toISOString(),
                warningsShown: [],
                alertsSent: [],
            };
            await predictor.recordUsageData(usageData);
            // Create new predictor instance with same directory
            const newPredictor = new MLCostPredictor(tempDir);
            await newPredictor.initialize();
            const historicalData = await newPredictor.exportHistoricalData();
            expect(historicalData).toHaveLength(1);
            expect(historicalData[0].requestCount).toBe(150);
        });
        test('should persist and load model metrics', async () => {
            // Add enough data to trigger model training
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 10);
            for (let i = 0; i < 14; i++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                const usageData = {
                    date: date.toISOString().split('T')[0],
                    requestCount: 100 + i * 2,
                    lastResetTime: date.toISOString(),
                    warningsShown: [],
                    alertsSent: [],
                };
                const originalDateNow = Date.now;
                Date.now = () => date.getTime();
                await predictor.recordUsageData(usageData);
                Date.now = originalDateNow;
            }
            const originalMetrics = await predictor.getModelMetrics();
            // Create new predictor instance with same directory
            const newPredictor = new MLCostPredictor(tempDir);
            await newPredictor.initialize();
            const loadedMetrics = await newPredictor.getModelMetrics();
            expect(loadedMetrics.size).toBe(originalMetrics.size);
            for (const [algorithm, metrics] of originalMetrics) {
                const loadedAlgorithmMetrics = loadedMetrics.get(algorithm);
                expect(loadedAlgorithmMetrics).toBeDefined();
                expect(loadedAlgorithmMetrics?.accuracy).toBe(metrics.accuracy);
            }
        });
    });
    describe('Edge Cases and Error Handling', () => {
        test('should handle empty data gracefully', async () => {
            const trends = await predictor.analyzeTrends();
            expect(trends).toMatchObject({
                direction: 'stable',
                slope: 0,
                correlation: 0,
                seasonality: { detected: false },
                anomalies: [],
            });
        });
        test('should handle corrupted data files', async () => {
            // Write corrupted data to history file
            const historyPath = path.join(tempDir, '.gemini', 'usage-history.json');
            await fs.mkdir(path.dirname(historyPath), { recursive: true });
            await fs.writeFile(historyPath, 'invalid json content');
            const newPredictor = new MLCostPredictor(tempDir);
            await newPredictor.initialize();
            // Should initialize with empty data instead of crashing
            const historicalData = await newPredictor.exportHistoricalData();
            expect(historicalData).toEqual([]);
        });
        test('should handle single data point', async () => {
            const usageData = {
                date: '2025-01-15',
                requestCount: 150,
                lastResetTime: new Date().toISOString(),
                warningsShown: [],
                alertsSent: [],
            };
            await predictor.recordUsageData(usageData);
            // Should not crash with single data point
            const prediction = await predictor.generateBudgetPrediction(1000);
            expect(prediction).toBeDefined();
            expect(prediction.currentUsage).toBe(150);
        });
        test('should handle zero request counts', async () => {
            const usageData = {
                date: '2025-01-15',
                requestCount: 0,
                lastResetTime: new Date().toISOString(),
                warningsShown: [],
                alertsSent: [],
            };
            await predictor.recordUsageData(usageData);
            const prediction = await predictor.generateBudgetPrediction(1000);
            expect(prediction).toBeDefined();
            expect(prediction.currentUsage).toBe(0);
            expect(prediction.predictedDailyUsage).toBeGreaterThanOrEqual(0);
        });
    });
    describe('Advanced ML Features', () => {
        test('should provide confidence intervals in forecasts', async () => {
            // Add some historical data
            for (let i = 0; i < 10; i++) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const usageData = {
                    date: date.toISOString().split('T')[0],
                    requestCount: 100 + Math.random() * 50,
                    lastResetTime: date.toISOString(),
                    warningsShown: [],
                    alertsSent: [],
                };
                const originalDateNow = Date.now;
                Date.now = () => date.getTime();
                await predictor.recordUsageData(usageData);
                Date.now = originalDateNow;
            }
            const prediction = await predictor.generateBudgetPrediction(1000);
            // Check that risk assessment contains meaningful thresholds
            expect(prediction.riskAssessment.criticalThresholds).toHaveLength(3);
            for (const threshold of prediction.riskAssessment.criticalThresholds) {
                expect(threshold.threshold).toBeGreaterThan(0);
                expect(threshold.probability).toBeGreaterThanOrEqual(0);
                expect(threshold.probability).toBeLessThanOrEqual(1);
                expect(threshold.estimatedTime).toBeGreaterThanOrEqual(0);
            }
        });
        test('should adapt predictions based on recent patterns', async () => {
            // Add older stable data
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 20);
            for (let i = 0; i < 10; i++) {
                const date = new Date(oldDate);
                date.setDate(date.getDate() + i);
                const usageData = {
                    date: date.toISOString().split('T')[0],
                    requestCount: 50, // Stable low usage
                    lastResetTime: date.toISOString(),
                    warningsShown: [],
                    alertsSent: [],
                };
                const originalDateNow = Date.now;
                Date.now = () => date.getTime();
                await predictor.recordUsageData(usageData);
                Date.now = originalDateNow;
            }
            const prediction1 = await predictor.generateBudgetPrediction(1000);
            // Add recent high usage data
            for (let i = 0; i < 5; i++) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const usageData = {
                    date: date.toISOString().split('T')[0],
                    requestCount: 200, // Recent high usage
                    lastResetTime: date.toISOString(),
                    warningsShown: [],
                    alertsSent: [],
                };
                const originalDateNow = Date.now;
                Date.now = () => date.getTime();
                await predictor.recordUsageData(usageData);
                Date.now = originalDateNow;
            }
            const prediction2 = await predictor.generateBudgetPrediction(1000);
            // Recent pattern should influence prediction more than old data
            expect(prediction2.predictedDailyUsage).toBeGreaterThan(prediction1.predictedDailyUsage);
        });
    });
});
//# sourceMappingURL=ml-cost-predictor.test.js.map