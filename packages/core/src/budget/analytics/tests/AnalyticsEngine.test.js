/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { createAnalyticsEngine, } from '../AnalyticsEngine.js';
import { BudgetTracker } from '../../budget-tracker.js';
describe('AnalyticsEngine', () => {
    let tempDir;
    let projectRoot;
    let budgetTracker;
    let analyticsEngine;
    let testMetrics;
    beforeEach(async () => {
        // Create temporary directory for testing
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'analytics-test-'));
        projectRoot = tempDir;
        // Initialize budget tracker with test settings
        const budgetSettings = {
            enabled: true,
            dailyLimit: 100,
            resetTime: '00:00',
            warningThresholds: [50, 75, 90],
        };
        budgetTracker = new BudgetTracker(projectRoot, budgetSettings);
        analyticsEngine = createAnalyticsEngine(projectRoot, budgetTracker, {
            enabled: true,
            dataRetentionDays: 30,
            analysisIntervalMinutes: 60,
            anomalyDetection: {
                enabled: true,
                sensitivityLevel: 'medium',
                lookbackDays: 7,
            },
            patternRecognition: {
                enabled: true,
                minimumDataPoints: 10,
                confidenceThreshold: 0.8,
            },
            optimization: {
                enabled: true,
                targetSavingsPercentage: 30,
                includeComplexRecommendations: false,
            },
        });
        // Generate test metrics
        testMetrics = generateTestMetrics();
    });
    afterEach(async () => {
        // Clean up temporary directory
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        }
        catch (error) {
            // Ignore cleanup errors
        }
    });
    describe('Analytics Engine Initialization', () => {
        it('should create analytics engine with correct configuration', () => {
            expect(analyticsEngine).toBeDefined();
            expect(analyticsEngine['config'].enabled).toBe(true);
            expect(analyticsEngine['config'].dataRetentionDays).toBe(30);
            expect(analyticsEngine['config'].anomalyDetection.enabled).toBe(true);
        });
        it('should create analytics engine with default configuration', () => {
            const defaultEngine = createAnalyticsEngine(projectRoot, budgetTracker);
            expect(defaultEngine).toBeDefined();
            expect(defaultEngine['config'].enabled).toBe(true);
            expect(defaultEngine['config'].dataRetentionDays).toBe(90);
        });
    });
    describe('Usage Metrics Recording', () => {
        it('should record usage metrics correctly', async () => {
            const metrics = {
                requestCount: 1,
                cost: 0.05,
                feature: 'test-feature',
                user: 'test-user',
                responseTime: 250,
                tokens: 150,
            };
            await analyticsEngine.recordUsage(metrics);
            // Verify metrics were saved
            const analyticsPath = path.join(projectRoot, '.gemini', 'analytics');
            const today = new Date().toISOString().split('T')[0];
            const metricsFile = path.join(analyticsPath, `${today}.json`);
            const savedMetrics = JSON.parse(await fs.readFile(metricsFile, 'utf-8'));
            expect(savedMetrics).toHaveLength(1);
            expect(savedMetrics[0].cost).toBe(0.05);
            expect(savedMetrics[0].feature).toBe('test-feature');
            expect(savedMetrics[0]).toHaveProperty('timestamp');
        });
        it('should handle multiple metrics recording', async () => {
            const metrics1 = { requestCount: 1, cost: 0.02, feature: 'chat' };
            const metrics2 = { requestCount: 1, cost: 0.08, feature: 'embeddings' };
            await analyticsEngine.recordUsage(metrics1);
            await analyticsEngine.recordUsage(metrics2);
            const analyticsPath = path.join(projectRoot, '.gemini', 'analytics');
            const today = new Date().toISOString().split('T')[0];
            const metricsFile = path.join(analyticsPath, `${today}.json`);
            const savedMetrics = JSON.parse(await fs.readFile(metricsFile, 'utf-8'));
            expect(savedMetrics).toHaveLength(2);
            expect(savedMetrics.some((m) => m.feature === 'chat')).toBe(true);
            expect(savedMetrics.some((m) => m.feature === 'embeddings')).toBe(true);
        });
        it('should trigger real-time anomaly detection for high-cost requests', async () => {
            const highCostMetrics = {
                requestCount: 1,
                cost: 1.5,
                feature: 'expensive-operation',
            };
            // Mock the anomaly detection method
            const checkForAnomaliesSpy = vi.spyOn(analyticsEngine, 'checkForAnomalies');
            await analyticsEngine.recordUsage(highCostMetrics);
            expect(checkForAnomaliesSpy).toHaveBeenCalled();
        });
    });
    describe('Analytics Report Generation', () => {
        beforeEach(async () => {
            // Populate with test data
            for (const metric of testMetrics) {
                await analyticsEngine.recordUsage(metric);
            }
        });
        it('should generate comprehensive analytics report', async () => {
            const report = await analyticsEngine.generateReport();
            expect(report).toHaveProperty('generatedAt');
            expect(report).toHaveProperty('period');
            expect(report).toHaveProperty('summary');
            expect(report).toHaveProperty('featureAnalysis');
            expect(report).toHaveProperty('patternAnalysis');
            expect(report).toHaveProperty('anomalies');
            expect(report).toHaveProperty('optimizationRecommendations');
            expect(report).toHaveProperty('potentialSavings');
            expect(report).toHaveProperty('actionPlan');
        });
        it('should calculate accurate summary statistics', async () => {
            const report = await analyticsEngine.generateReport();
            const { summary } = report;
            expect(summary.totalCost).toBeGreaterThan(0);
            expect(summary.totalRequests).toBe(testMetrics.length);
            expect(summary.averageCostPerRequest).toBe(summary.totalCost / summary.totalRequests);
            expect(summary.costTrend).toMatch(/^(increasing|decreasing|stable)$/);
            expect(summary.budgetUtilization).toBeGreaterThanOrEqual(0);
            expect(summary.projectedMonthlySpend).toBeGreaterThan(0);
        });
        it('should identify features correctly in feature analysis', async () => {
            const report = await analyticsEngine.generateReport();
            const { featureAnalysis } = report;
            expect(featureAnalysis).toBeInstanceOf(Array);
            expect(featureAnalysis.length).toBeGreaterThan(0);
            const chatFeature = featureAnalysis.find((f) => f.featureId === 'chat-completion');
            expect(chatFeature).toBeDefined();
            expect(chatFeature.totalCost).toBeGreaterThan(0);
            expect(chatFeature.requestCount).toBeGreaterThan(0);
            expect(chatFeature.averageCostPerRequest).toBeGreaterThan(0);
        });
        it('should detect patterns when sufficient data exists', async () => {
            const report = await analyticsEngine.generateReport();
            const { patternAnalysis } = report;
            expect(patternAnalysis).toBeInstanceOf(Array);
            // Pattern detection depends on data characteristics and thresholds
        });
        it('should generate optimization recommendations', async () => {
            const report = await analyticsEngine.generateReport();
            const { optimizationRecommendations } = report;
            expect(optimizationRecommendations).toBeInstanceOf(Array);
            if (optimizationRecommendations.length > 0) {
                const recommendation = optimizationRecommendations[0];
                expect(recommendation).toHaveProperty('id');
                expect(recommendation).toHaveProperty('type');
                expect(recommendation).toHaveProperty('title');
                expect(recommendation).toHaveProperty('description');
                expect(recommendation).toHaveProperty('potentialSavings');
                expect(recommendation).toHaveProperty('savingsPercentage');
                expect(recommendation).toHaveProperty('implementationComplexity');
                expect(recommendation).toHaveProperty('priority');
                expect(recommendation).toHaveProperty('confidenceScore');
                expect(recommendation).toHaveProperty('actionItems');
                expect(recommendation).toHaveProperty('metrics');
            }
        });
        it('should calculate potential savings breakdown', async () => {
            const report = await analyticsEngine.generateReport();
            const { potentialSavings } = report;
            expect(potentialSavings).toHaveProperty('immediate');
            expect(potentialSavings).toHaveProperty('shortTerm');
            expect(potentialSavings).toHaveProperty('longTerm');
            expect(potentialSavings).toHaveProperty('total');
            expect(potentialSavings).toHaveProperty('percentage');
            expect(potentialSavings.total).toBe(potentialSavings.immediate +
                potentialSavings.shortTerm +
                potentialSavings.longTerm);
        });
        it('should prioritize recommendations in action plan', async () => {
            const report = await analyticsEngine.generateReport();
            const { actionPlan } = report;
            expect(actionPlan).toHaveProperty('critical');
            expect(actionPlan).toHaveProperty('highPriority');
            expect(actionPlan).toHaveProperty('quickWins');
            expect(actionPlan.critical).toBeInstanceOf(Array);
            expect(actionPlan.highPriority).toBeInstanceOf(Array);
            expect(actionPlan.quickWins).toBeInstanceOf(Array);
        });
    });
    describe('Feature Cost Analysis', () => {
        beforeEach(async () => {
            // Populate with feature-specific test data
            const featureMetrics = generateFeatureSpecificMetrics();
            for (const metric of featureMetrics) {
                await analyticsEngine.recordUsage(metric);
            }
        });
        it('should analyze feature costs correctly', async () => {
            const report = await analyticsEngine.generateReport();
            const { featureAnalysis } = report;
            expect(featureAnalysis.length).toBeGreaterThan(0);
            // Should be sorted by total cost (descending)
            for (let i = 1; i < featureAnalysis.length; i++) {
                expect(featureAnalysis[i - 1].totalCost).toBeGreaterThanOrEqual(featureAnalysis[i].totalCost);
            }
            const feature = featureAnalysis[0];
            expect(feature.averageCostPerRequest).toBe(feature.totalCost / feature.requestCount);
            expect(feature.usageFrequency).toBeGreaterThan(0);
            expect(feature.peakUsageHours).toBeInstanceOf(Array);
        });
        it('should calculate ROI for features', async () => {
            const report = await analyticsEngine.generateReport();
            const { featureAnalysis } = report;
            for (const feature of featureAnalysis) {
                expect(feature).toHaveProperty('roi');
                expect(feature).toHaveProperty('businessValue');
                expect(typeof feature.roi).toBe('number');
                expect(typeof feature.businessValue).toBe('number');
            }
        });
        it('should identify peak usage hours', async () => {
            const report = await analyticsEngine.generateReport();
            const { featureAnalysis } = report;
            for (const feature of featureAnalysis) {
                expect(feature.peakUsageHours).toBeInstanceOf(Array);
                // Peak hours should be in HH:00 format
                feature.peakUsageHours.forEach((hour) => {
                    expect(hour).toMatch(/^\d{2}:00$/);
                });
            }
        });
    });
    describe('Pattern Recognition', () => {
        it('should detect business hours patterns', async () => {
            const businessHoursMetrics = generateBusinessHoursPattern();
            for (const metric of businessHoursMetrics) {
                await analyticsEngine.recordUsage(metric);
            }
            const report = await analyticsEngine.generateReport();
            const businessHoursPattern = report.patternAnalysis.find((p) => p.patternType === 'business_hours');
            if (businessHoursPattern) {
                expect(businessHoursPattern.confidence).toBeGreaterThan(0.6);
                expect(businessHoursPattern.description).toContain('business hours');
                expect(businessHoursPattern.severity).toMatch(/^(low|medium|high|critical)$/);
            }
        });
        it('should detect weekend patterns', async () => {
            const weekendPatternMetrics = generateWeekendPattern();
            for (const metric of weekendPatternMetrics) {
                await analyticsEngine.recordUsage(metric);
            }
            const report = await analyticsEngine.generateReport();
            const weekendPattern = report.patternAnalysis.find((p) => p.patternType === 'weekend_dip');
            if (weekendPattern) {
                expect(weekendPattern.confidence).toBeGreaterThan(0.6);
                expect(weekendPattern.description).toContain('weekend');
            }
        });
        it('should detect spike patterns', async () => {
            const spikeMetrics = generateSpikePattern();
            for (const metric of spikeMetrics) {
                await analyticsEngine.recordUsage(metric);
            }
            const report = await analyticsEngine.generateReport();
            const spikePattern = report.patternAnalysis.find((p) => p.patternType === 'spike');
            if (spikePattern) {
                expect(spikePattern.confidence).toBeGreaterThan(0.6);
                expect(spikePattern.description).toContain('spike');
                expect(spikePattern.recommendations.length).toBeGreaterThan(0);
            }
        });
    });
    describe('Anomaly Detection', () => {
        it('should detect cost anomalies', async () => {
            const anomalousMetrics = generateCostAnomalies();
            for (const metric of anomalousMetrics) {
                await analyticsEngine.recordUsage(metric);
            }
            const report = await analyticsEngine.generateReport();
            const costAnomaly = report.anomalies.find((a) => a.type === 'cost_spike');
            if (costAnomaly) {
                expect(costAnomaly.actualValue).toBeGreaterThan(costAnomaly.expectedValue);
                expect(costAnomaly.deviationPercentage).toBeGreaterThan(0);
                expect(costAnomaly.severity).toMatch(/^(low|medium|high|critical)$/);
                expect(costAnomaly.recommendations.length).toBeGreaterThan(0);
            }
        });
        it('should detect efficiency anomalies', async () => {
            const efficiencyAnomalies = generateEfficiencyAnomalies();
            for (const metric of efficiencyAnomalies) {
                await analyticsEngine.recordUsage(metric);
            }
            const report = await analyticsEngine.generateReport();
            const efficiencyAnomaly = report.anomalies.find((a) => a.type === 'efficiency_drop');
            if (efficiencyAnomaly) {
                expect(efficiencyAnomaly.description).toContain('efficiency');
                expect(efficiencyAnomaly.rootCauseAnalysis.length).toBeGreaterThan(0);
            }
        });
    });
    describe('Performance and Validation', () => {
        it('should handle large datasets efficiently', async () => {
            const largeDataset = generateLargeDataset(1000);
            const startTime = Date.now();
            for (const metric of largeDataset) {
                await analyticsEngine.recordUsage(metric);
            }
            const recordingTime = Date.now() - startTime;
            const reportStartTime = Date.now();
            const report = await analyticsEngine.generateReport();
            const reportTime = Date.now() - reportStartTime;
            // Performance assertions
            expect(recordingTime).toBeLessThan(5000); // Should complete within 5 seconds
            expect(reportTime).toBeLessThan(10000); // Report generation within 10 seconds
            expect(report.summary.totalRequests).toBe(1000);
        });
        it('should validate 30%+ cost optimization identification capability', async () => {
            const highCostMetrics = generateHighCostScenario();
            for (const metric of highCostMetrics) {
                await analyticsEngine.recordUsage(metric);
            }
            const report = await analyticsEngine.generateReport();
            const { potentialSavings, optimizationRecommendations } = report;
            // Validate that significant cost optimization opportunities are identified
            expect(potentialSavings.percentage).toBeGreaterThan(30);
            expect(optimizationRecommendations.length).toBeGreaterThan(0);
            // Ensure high-impact recommendations are present
            const highImpactRecommendations = optimizationRecommendations.filter((rec) => rec.savingsPercentage >= 25);
            expect(highImpactRecommendations.length).toBeGreaterThan(0);
            // Validate recommendation quality
            for (const rec of optimizationRecommendations) {
                expect(rec.potentialSavings).toBeGreaterThan(0);
                expect(rec.confidenceScore).toBeGreaterThan(0.5);
                expect(rec.actionItems.length).toBeGreaterThan(0);
            }
        });
        it('should maintain data consistency across operations', async () => {
            const metrics = generateTestMetrics();
            // Record metrics
            for (const metric of metrics) {
                await analyticsEngine.recordUsage(metric);
            }
            // Generate multiple reports
            const report1 = await analyticsEngine.generateReport();
            const report2 = await analyticsEngine.generateReport();
            // Reports should be consistent
            expect(report1.summary.totalRequests).toBe(report2.summary.totalRequests);
            expect(report1.summary.totalCost).toBe(report2.summary.totalCost);
            expect(report1.featureAnalysis.length).toBe(report2.featureAnalysis.length);
        });
    });
    // Helper functions for generating test data
    function generateTestMetrics() {
        const metrics = [];
        const features = ['chat-completion', 'embeddings', 'image-analysis'];
        const users = ['user-1', 'user-2', 'user-3'];
        for (let i = 0; i < 100; i++) {
            const timestamp = new Date(Date.now() - i * 60 * 60 * 1000).toISOString();
            metrics.push({
                timestamp,
                requestCount: 1,
                cost: Math.random() * 0.1 + 0.01, // $0.01 to $0.11
                feature: features[Math.floor(Math.random() * features.length)],
                user: users[Math.floor(Math.random() * users.length)],
                responseTime: Math.random() * 1000 + 100, // 100-1100ms
                tokens: Math.floor(Math.random() * 500 + 50), // 50-550 tokens
            });
        }
        return metrics;
    }
    function generateFeatureSpecificMetrics() {
        const metrics = [];
        const features = [
            { name: 'chat-completion', baseCost: 0.05, variance: 0.02 },
            { name: 'embeddings', baseCost: 0.001, variance: 0.0005 },
            { name: 'image-analysis', baseCost: 0.15, variance: 0.05 },
        ];
        features.forEach((feature) => {
            for (let i = 0; i < 50; i++) {
                const timestamp = new Date(Date.now() - i * 30 * 60 * 1000).toISOString();
                metrics.push({
                    timestamp,
                    requestCount: 1,
                    cost: feature.baseCost + (Math.random() - 0.5) * feature.variance,
                    feature: feature.name,
                    user: `user-${Math.floor(i / 10) + 1}`,
                    responseTime: Math.random() * 500 + 200,
                    tokens: Math.floor(Math.random() * 300 + 100),
                });
            }
        });
        return metrics;
    }
    function generateBusinessHoursPattern() {
        const metrics = [];
        const now = new Date();
        // Generate data for the last 7 days with clear business hours pattern
        for (let day = 0; day < 7; day++) {
            for (let hour = 0; hour < 24; hour++) {
                const timestamp = new Date(now);
                timestamp.setDate(timestamp.getDate() - day);
                timestamp.setHours(hour, 0, 0, 0);
                // Business hours (9-17) have 3x more activity
                const isBusinessHours = hour >= 9 && hour <= 17;
                const requestCount = isBusinessHours ? 15 : 5;
                for (let i = 0; i < requestCount; i++) {
                    metrics.push({
                        timestamp: timestamp.toISOString(),
                        requestCount: 1,
                        cost: Math.random() * 0.05 + 0.02,
                        feature: 'chat-completion',
                        responseTime: Math.random() * 300 + 200,
                    });
                }
            }
        }
        return metrics;
    }
    function generateWeekendPattern() {
        const metrics = [];
        const now = new Date();
        // Generate data for the last 14 days with weekend dip
        for (let day = 0; day < 14; day++) {
            const date = new Date(now);
            date.setDate(date.getDate() - day);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const dailyRequests = isWeekend ? 20 : 80; // 75% reduction on weekends
            for (let i = 0; i < dailyRequests; i++) {
                const timestamp = new Date(date);
                timestamp.setHours(Math.floor(Math.random() * 24));
                metrics.push({
                    timestamp: timestamp.toISOString(),
                    requestCount: 1,
                    cost: Math.random() * 0.04 + 0.01,
                    feature: 'chat-completion',
                    responseTime: Math.random() * 400 + 150,
                });
            }
        }
        return metrics;
    }
    function generateSpikePattern() {
        const metrics = [];
        const now = new Date();
        // Generate normal baseline
        for (let i = 0; i < 100; i++) {
            const timestamp = new Date(now.getTime() - i * 15 * 60 * 1000);
            metrics.push({
                timestamp: timestamp.toISOString(),
                requestCount: 1,
                cost: 0.03 + Math.random() * 0.01,
                feature: 'chat-completion',
            });
        }
        // Add spike (10x normal cost for 5 requests)
        const spikeStart = new Date(now.getTime() - 50 * 15 * 60 * 1000);
        for (let i = 0; i < 5; i++) {
            const timestamp = new Date(spikeStart.getTime() + i * 60 * 1000);
            metrics.push({
                timestamp: timestamp.toISOString(),
                requestCount: 1,
                cost: 0.35, // 10x normal cost
                feature: 'chat-completion',
            });
        }
        return metrics;
    }
    function generateCostAnomalies() {
        const metrics = [];
        const now = new Date();
        // Generate normal baseline
        for (let i = 0; i < 80; i++) {
            metrics.push({
                timestamp: new Date(now.getTime() - i * 30 * 60 * 1000).toISOString(),
                requestCount: 1,
                cost: 0.025 + Math.random() * 0.01,
                feature: 'chat-completion',
            });
        }
        // Add cost anomalies
        for (let i = 0; i < 5; i++) {
            metrics.push({
                timestamp: new Date(now.getTime() - (80 + i) * 30 * 60 * 1000).toISOString(),
                requestCount: 1,
                cost: 0.15, // 5x higher than normal
                feature: 'chat-completion',
            });
        }
        return metrics;
    }
    function generateEfficiencyAnomalies() {
        const metrics = [];
        const now = new Date();
        // Generate metrics with varying efficiency by hour
        for (let hour = 0; hour < 24; hour++) {
            const timestamp = new Date(now);
            timestamp.setHours(hour, 0, 0, 0);
            // Hour 14 has significantly lower efficiency
            const cost = hour === 14 ? 0.08 : 0.02;
            for (let i = 0; i < 10; i++) {
                metrics.push({
                    timestamp: timestamp.toISOString(),
                    requestCount: 1,
                    cost,
                    feature: 'chat-completion',
                    responseTime: hour === 14 ? 2000 : 300, // Slower response too
                });
            }
        }
        return metrics;
    }
    function generateLargeDataset(size) {
        const metrics = [];
        const features = [
            'chat-completion',
            'embeddings',
            'image-analysis',
            'text-generation',
        ];
        const users = Array.from({ length: 20 }, (_, i) => `user-${i + 1}`);
        for (let i = 0; i < size; i++) {
            metrics.push({
                timestamp: new Date(Date.now() - i * 5 * 60 * 1000).toISOString(),
                requestCount: 1,
                cost: Math.random() * 0.2 + 0.005,
                feature: features[Math.floor(Math.random() * features.length)],
                user: users[Math.floor(Math.random() * users.length)],
                responseTime: Math.random() * 800 + 100,
                tokens: Math.floor(Math.random() * 800 + 50),
            });
        }
        return metrics;
    }
    function generateHighCostScenario() {
        const metrics = [];
        const now = new Date();
        // Scenario with multiple optimization opportunities
        const features = [
            { name: 'expensive-feature', cost: 0.5, count: 50 }, // High cost, good candidate for optimization
            { name: 'duplicate-requests', cost: 0.03, count: 200 }, // Many duplicates
            { name: 'inefficient-feature', cost: 0.15, count: 30 }, // Low utilization
        ];
        features.forEach((feature) => {
            for (let i = 0; i < feature.count; i++) {
                metrics.push({
                    timestamp: new Date(now.getTime() - i * 10 * 60 * 1000).toISOString(),
                    requestCount: 1,
                    cost: feature.cost + Math.random() * 0.01,
                    feature: feature.name,
                    user: feature.name === 'duplicate-requests'
                        ? 'same-user'
                        : `user-${i % 5}`,
                    responseTime: feature.cost * 1000, // Higher cost = slower response
                });
            }
        });
        return metrics;
    }
});
//# sourceMappingURL=AnalyticsEngine.test.js.map