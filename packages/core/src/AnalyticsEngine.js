/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
/**
 * Advanced analytics engine providing comprehensive usage insights and optimization recommendations
 */
export class AnalyticsEngine {
    projectRoot;
    config;
    budgetTracker;
    analyticsDataPath;
    metricsCache = new Map();
    constructor(projectRoot, budgetTracker, config = {}) {
        this.projectRoot = projectRoot;
        this.budgetTracker = budgetTracker;
        this.analyticsDataPath = path.join(projectRoot, '.gemini', 'analytics');
        this.config = {
            enabled: true,
            dataRetentionDays: 90,
            analysisIntervalMinutes: 60,
            anomalyDetection: {
                enabled: true,
                sensitivityLevel: 'medium',
                lookbackDays: 14,
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
            ...config,
        };
    }
    /**
     * Record usage metrics with multi-dimensional data
     */
    async recordUsage(metrics) {
        if (!this.config.enabled)
            return;
        const usageRecord = {
            timestamp: new Date().toISOString(),
            requestCount: 0, // Default values
            cost: 0,
            ...metrics, // Override with actual values
        };
        await this.saveMetrics(usageRecord);
        await this.budgetTracker.recordRequest();
        // Trigger real-time analysis for critical patterns
        if (typeof metrics.cost === 'number' && metrics.cost > (await this.getAverageCostPerRequest()) * 3) {
            await this.checkForAnomalies([usageRecord]);
        }
    }
    /**
     * Generate comprehensive analytics report
     */
    async generateReport(startDate = this.getDateDaysAgo(30), endDate = new Date().toISOString()) {
        const metrics = await this.getMetricsInRange(startDate, endDate);
        const summary = await this.calculateSummary(metrics);
        const featureAnalysis = await this.analyzeFeatureCosts(metrics);
        const patternAnalysis = await this.recognizePatterns(metrics);
        const anomalies = await this.detectAnomalies(metrics);
        const optimizationRecommendations = await this.generateOptimizationRecommendations(metrics, featureAnalysis, patternAnalysis, anomalies);
        const potentialSavings = this.calculatePotentialSavings(optimizationRecommendations);
        const actionPlan = this.prioritizeRecommendations(optimizationRecommendations);
        return {
            generatedAt: new Date().toISOString(),
            period: { start: startDate, end: endDate },
            summary,
            featureAnalysis,
            patternAnalysis,
            anomalies,
            optimizationRecommendations,
            potentialSavings,
            actionPlan,
        };
    }
    /**
     * Analyze costs by feature with ROI calculations
     */
    async analyzeFeatureCosts(metrics) {
        const featureGroups = this.groupMetricsByDimension(metrics, 'feature');
        const analyses = [];
        for (const [featureId, featureMetrics] of Array.from(featureGroups.entries())) {
            if (!featureId || featureId === 'undefined')
                continue;
            const totalCost = featureMetrics.reduce((sum, m) => sum + m.cost, 0);
            const requestCount = featureMetrics.length;
            const averageCostPerRequest = totalCost / requestCount;
            // Calculate business value and ROI (simplified heuristic)
            const businessValue = await this.calculateBusinessValue(featureId, featureMetrics);
            const roi = businessValue > 0 ? (businessValue - totalCost) / totalCost : -1;
            const costTrend = this.analyzeCostTrend(featureMetrics);
            const utilizationRate = this.calculateUtilizationRate(featureMetrics);
            const peakUsageHours = this.identifyPeakUsageHours(featureMetrics);
            const recommendations = await this.generateFeatureRecommendations(featureId, featureMetrics, { totalCost, roi, utilizationRate });
            analyses.push({
                featureId,
                featureName: featureId, // Could be enhanced with feature registry
                totalCost,
                requestCount,
                averageCostPerRequest,
                usageFrequency: this.calculateUsageFrequency(featureMetrics),
                businessValue,
                roi,
                costTrend,
                utilizationRate,
                peakUsageHours,
                recommendations,
            });
        }
        return analyses.sort((a, b) => b.totalCost - a.totalCost);
    }
    /**
     * Advanced pattern recognition system
     */
    async recognizePatterns(metrics) {
        if (!this.config.patternRecognition.enabled ||
            metrics.length < this.config.patternRecognition.minimumDataPoints) {
            return [];
        }
        const patterns = [];
        const timeGrouped = this.groupMetricsByTimeWindow(metrics, 'hour');
        // Detect usage spikes
        const spikes = this.detectSpikes(timeGrouped);
        patterns.push(...spikes);
        // Detect periodic patterns
        const periodic = this.detectPeriodicPatterns(timeGrouped);
        patterns.push(...periodic);
        // Detect business hours patterns
        const businessHours = this.detectBusinessHoursPattern(timeGrouped);
        if (businessHours)
            patterns.push(businessHours);
        // Detect weekend patterns
        const weekendPattern = this.detectWeekendPattern(timeGrouped);
        if (weekendPattern)
            patterns.push(weekendPattern);
        return patterns.filter((p) => p.confidence >= this.config.patternRecognition.confidenceThreshold);
    }
    /**
     * Anomaly detection system
     */
    async detectAnomalies(metrics) {
        if (!this.config.anomalyDetection.enabled)
            return [];
        const anomalies = [];
        const recentMetrics = this.getRecentMetrics(metrics, this.config.anomalyDetection.lookbackDays);
        // Cost spike detection
        const costAnomalies = this.detectCostAnomalies(recentMetrics);
        anomalies.push(...costAnomalies);
        // Volume anomalies
        const volumeAnomalies = this.detectVolumeAnomalies(recentMetrics);
        anomalies.push(...volumeAnomalies);
        // Efficiency drops
        const efficiencyAnomalies = this.detectEfficiencyAnomalies(recentMetrics);
        anomalies.push(...efficiencyAnomalies);
        return anomalies;
    }
    /**
     * Generate intelligent optimization recommendations
     */
    async generateOptimizationRecommendations(metrics, featureAnalysis, patternAnalysis, anomalies) {
        const recommendations = [];
        // Generate recommendations from feature analysis
        for (const feature of featureAnalysis) {
            recommendations.push(...feature.recommendations);
        }
        // Generate recommendations from pattern analysis
        for (const pattern of patternAnalysis) {
            recommendations.push(...pattern.recommendations);
        }
        // Generate recommendations from anomalies
        for (const anomaly of anomalies) {
            recommendations.push(...anomaly.recommendations);
        }
        // Generate system-wide recommendations
        const systemRecommendations = await this.generateSystemWideRecommendations(metrics, featureAnalysis);
        recommendations.push(...systemRecommendations);
        // Deduplicate and rank recommendations
        return this.deduplicateAndRankRecommendations(recommendations);
    }
    // Helper methods for analytics calculations and data processing
    async saveMetrics(metrics) {
        const date = metrics.timestamp.split('T')[0];
        const filePath = path.join(this.analyticsDataPath, `${date}.json`);
        await fs.mkdir(this.analyticsDataPath, { recursive: true });
        let existingMetrics = [];
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            existingMetrics = JSON.parse(data);
        }
        catch {
            // File doesn't exist, start fresh
        }
        existingMetrics.push(metrics);
        await fs.writeFile(filePath, JSON.stringify(existingMetrics, null, 2));
    }
    async getMetricsInRange(startDate, endDate) {
        const metrics = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            const dateStr = date.toISOString().split('T')[0];
            const filePath = path.join(this.analyticsDataPath, `${dateStr}.json`);
            try {
                const data = await fs.readFile(filePath, 'utf-8');
                const dayMetrics = JSON.parse(data);
                metrics.push(...dayMetrics);
            }
            catch {
                // File doesn't exist, continue
            }
        }
        return metrics;
    }
    async calculateSummary(metrics) {
        const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0);
        const totalRequests = metrics.length;
        const averageCostPerRequest = totalRequests > 0 ? totalCost / totalRequests : 0;
        const budgetStats = await this.budgetTracker.getUsageStats();
        const budgetUtilization = budgetStats.usagePercentage / 100;
        // Project monthly spend based on current usage
        const daysInPeriod = Math.max(1, this.calculateDaysInPeriod(metrics));
        const dailyAverageCost = totalCost / daysInPeriod;
        const projectedMonthlySpend = dailyAverageCost * 30;
        const costTrend = this.analyzeCostTrend(metrics);
        return {
            totalCost,
            totalRequests,
            averageCostPerRequest,
            costTrend,
            budgetUtilization,
            projectedMonthlySpend,
        };
    }
    // Additional helper methods would be implemented here...
    // (Pattern detection, anomaly detection, recommendation generation, etc.)
    groupMetricsByDimension(metrics, dimension) {
        const groups = new Map();
        for (const metric of metrics) {
            const key = String(metric[dimension] || 'unknown');
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(metric);
        }
        return groups;
    }
    async getAverageCostPerRequest() {
        // Implementation would calculate average cost from recent data
        return 0.01; // Placeholder
    }
    getDateDaysAgo(days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date.toISOString();
    }
    // Additional methods for pattern detection, anomaly detection, etc. would be implemented here
    calculateDaysInPeriod(metrics) {
        if (metrics.length === 0)
            return 1;
        const timestamps = metrics.map((m) => new Date(m.timestamp).getTime());
        const minTime = Math.min(...timestamps);
        const maxTime = Math.max(...timestamps);
        return Math.max(1, Math.ceil((maxTime - minTime) / (1000 * 60 * 60 * 24)));
    }
    analyzeCostTrend(metrics) {
        if (metrics.length < 2)
            return 'stable';
        const sortedMetrics = [...metrics].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const firstHalf = sortedMetrics.slice(0, Math.floor(sortedMetrics.length / 2));
        const secondHalf = sortedMetrics.slice(Math.floor(sortedMetrics.length / 2));
        const firstHalfAvg = firstHalf.reduce((sum, m) => sum + m.cost, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, m) => sum + m.cost, 0) / secondHalf.length;
        const changePercentage = Math.abs((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
        if (changePercentage < 5)
            return 'stable';
        return secondHalfAvg > firstHalfAvg ? 'increasing' : 'decreasing';
    }
    calculatePotentialSavings(recommendations) {
        const immediate = recommendations
            .filter((r) => r.implementationComplexity === 'low')
            .reduce((sum, r) => sum + r.potentialSavings, 0);
        const shortTerm = recommendations
            .filter((r) => r.implementationComplexity === 'medium')
            .reduce((sum, r) => sum + r.potentialSavings, 0);
        const longTerm = recommendations
            .filter((r) => r.implementationComplexity === 'high')
            .reduce((sum, r) => sum + r.potentialSavings, 0);
        const total = immediate + shortTerm + longTerm;
        return {
            immediate,
            shortTerm,
            longTerm,
            total,
            percentage: total > 0 ? (total / (total + 1000)) * 100 : 0, // Placeholder calculation
        };
    }
    prioritizeRecommendations(recommendations) {
        const critical = recommendations.filter((r) => r.priority === 'critical');
        const highPriority = recommendations.filter((r) => r.priority === 'high');
        const quickWins = recommendations.filter((r) => r.implementationComplexity === 'low' && r.potentialSavings > 0);
        return { critical, highPriority, quickWins };
    }
    deduplicateAndRankRecommendations(recommendations) {
        const seen = new Set();
        const unique = recommendations.filter((r) => {
            const key = `${r.type}-${r.title}`;
            if (seen.has(key))
                return false;
            seen.add(key);
            return true;
        });
        return unique.sort((a, b) => {
            if (a.priority !== b.priority) {
                const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            return b.potentialSavings - a.potentialSavings;
        });
    }
    // Placeholder methods that would need full implementation
    async calculateBusinessValue(featureId, metrics) {
        // This would implement business value calculation logic
        // For now, return a simple heuristic based on usage frequency
        return metrics.length * 0.5;
    }
    calculateUtilizationRate(metrics) {
        // Calculate how efficiently the feature is being used
        // This is a placeholder implementation
        return Math.min(1, metrics.length / 100);
    }
    calculateUsageFrequency(metrics) {
        // Calculate usage frequency score
        if (metrics.length === 0)
            return 0;
        const uniqueDays = new Set(metrics.map((m) => m.timestamp.split('T')[0]))
            .size;
        return metrics.length / Math.max(1, uniqueDays);
    }
    identifyPeakUsageHours(metrics) {
        const hourCounts = new Map();
        for (const metric of metrics) {
            const hour = new Date(metric.timestamp)
                .getHours()
                .toString()
                .padStart(2, '0');
            hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
        }
        const maxCount = Math.max(...Array.from(hourCounts.values()));
        return Array.from(hourCounts.entries())
            .filter(([_, count]) => count >= maxCount * 0.8)
            .map(([hour]) => `${hour}:00`)
            .sort();
    }
    async generateFeatureRecommendations(featureId, metrics, analysis) {
        const recommendations = [];
        // Low ROI recommendation
        if (analysis.roi < 0.1) {
            recommendations.push({
                id: `feature-${featureId}-low-roi`,
                type: 'feature_optimization',
                title: `Optimize low-ROI feature: ${featureId}`,
                description: `Feature ${featureId} has low ROI (${(analysis.roi * 100).toFixed(1)}%). Consider optimization or deprecation.`,
                potentialSavings: analysis.totalCost * 0.3,
                savingsPercentage: 30,
                implementationComplexity: 'medium',
                timeToImplement: '2-4 weeks',
                priority: 'medium',
                confidenceScore: 0.8,
                applicableFeatures: [featureId],
                actionItems: [
                    'Review feature usage patterns',
                    'Analyze user feedback and business value',
                    'Consider feature optimization or deprecation',
                    'Implement more efficient algorithms if keeping',
                ],
                metrics: {
                    currentCost: analysis.totalCost,
                    projectedCost: analysis.totalCost * 0.7,
                    expectedReduction: analysis.totalCost * 0.3,
                },
            });
        }
        return recommendations;
    }
    async generateSystemWideRecommendations(metrics, featureAnalysis) {
        const recommendations = [];
        // Batch processing recommendation
        const totalRequests = metrics.length;
        if (totalRequests > 1000) {
            recommendations.push({
                id: 'system-batch-processing',
                type: 'batch_processing',
                title: 'Implement batch processing for high-volume operations',
                description: 'High request volume detected. Batch processing could reduce costs significantly.',
                potentialSavings: totalRequests * 0.01 * 0.25, // 25% savings on cost per request
                savingsPercentage: 25,
                implementationComplexity: 'high',
                timeToImplement: '4-8 weeks',
                priority: 'high',
                confidenceScore: 0.9,
                applicableFeatures: featureAnalysis.slice(0, 3).map((f) => f.featureId),
                actionItems: [
                    'Identify operations suitable for batching',
                    'Implement batch processing infrastructure',
                    'Update client code to use batch APIs',
                    'Monitor performance and cost impact',
                ],
                metrics: {
                    currentCost: totalRequests * 0.01,
                    projectedCost: totalRequests * 0.01 * 0.75,
                    expectedReduction: totalRequests * 0.01 * 0.25,
                },
            });
        }
        return recommendations;
    }
    // Additional placeholder methods for pattern detection
    groupMetricsByTimeWindow(_metrics, _window) {
        return new Map(); // Placeholder
    }
    detectSpikes(_timeGrouped) {
        return []; // Placeholder
    }
    detectPeriodicPatterns(_timeGrouped) {
        return []; // Placeholder
    }
    detectBusinessHoursPattern(_timeGrouped) {
        return null; // Placeholder
    }
    detectWeekendPattern(_timeGrouped) {
        return null; // Placeholder
    }
    getRecentMetrics(metrics, days) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return metrics.filter((m) => new Date(m.timestamp) >= cutoff);
    }
    detectCostAnomalies(_metrics) {
        return []; // Placeholder
    }
    detectVolumeAnomalies(_metrics) {
        return []; // Placeholder
    }
    detectEfficiencyAnomalies(_metrics) {
        return []; // Placeholder
    }
    async checkForAnomalies(_metrics) {
        // Real-time anomaly checking logic would go here
    }
    /**
     * Generate comprehensive analytics data
     */
    async generateAnalytics(params) {
        try {
            const metrics = await this.getMetricsInRange(params.startDate, params.endDate);
            const filteredMetrics = this.applyFilters(metrics, params.filters || {});
            const analytics = {
                dataPoints: this.groupByGranularity(filteredMetrics, params.granularity),
                summary: this.calculateSummaryStats(filteredMetrics),
                patterns: await this.recognizePatterns(filteredMetrics),
                recommendations: await this.generateRecommendations(filteredMetrics),
            };
            return analytics;
        }
        catch (error) {
            console.error('Failed to generate analytics:', error);
            return {
                dataPoints: [],
                summary: {
                    totalCost: 0,
                    totalRequests: 0,
                    averageCost: 0,
                    costRange: { min: 0, max: 0 },
                },
                patterns: [],
                recommendations: [],
            };
        }
    }
    /**
     * Analyze trends and patterns
     */
    async analyzeTrends(params) {
        try {
            const metrics = await this.getMetricsInRange(params.startDate, params.endDate);
            const trends = this.calculateTrends(metrics);
            const patterns = await this.recognizePatterns(metrics);
            return {
                trends,
                patterns,
                volatility: this.calculateVolatility(metrics),
                forecast: this.generateSimpleForecast(metrics),
            };
        }
        catch (error) {
            console.error('Failed to analyze trends:', error);
            return { trends: [], patterns: [], volatility: 'stable', forecast: [] };
        }
    }
    /**
     * Generate cost breakdown by specified grouping
     */
    async generateCostBreakdown(params) {
        try {
            const metrics = await this.getMetricsInRange(params.startDate, params.endDate);
            const filteredMetrics = this.applyFilters(metrics, params.filters || {});
            const breakdown = this.groupMetricsByField(filteredMetrics, params.groupBy);
            const categories = this.calculateCategoryStats(breakdown);
            return {
                categories,
                totalCost: categories.reduce((sum, cat) => sum + cat.cost, 0),
                totalRequests: categories.reduce((sum, cat) => sum + cat.requests, 0),
            };
        }
        catch (error) {
            console.error('Failed to generate cost breakdown:', error);
            return { categories: [], totalCost: 0, totalRequests: 0 };
        }
    }
    /**
     * Execute custom analytics query
     */
    async executeCustomQuery(params) {
        try {
            // Basic implementation for custom queries
            const allMetrics = await this.loadMetrics();
            const filteredMetrics = this.applyFilters(allMetrics || [], params.filters);
            // Apply custom aggregations
            const results = this.applyAggregations(filteredMetrics || [], params.aggregations);
            return {
                results,
                totalRecords: filteredMetrics.length,
                appliedFilters: params.filters,
                executionTime: Date.now(),
            };
        }
        catch (error) {
            console.error('Failed to execute custom query:', error);
            return {
                results: {},
                totalRecords: 0,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    // Helper methods for the new analytics functions
    async loadMetrics() {
        const thirtyDaysAgo = this.getDateDaysAgo(30);
        const today = new Date().toISOString();
        return await this.getMetricsInRange(thirtyDaysAgo, today);
    }
    applyFilters(metrics, filters) {
        return metrics.filter((metric) => {
            for (const [key, value] of Object.entries(filters)) {
                const metricRecord = metric;
                if (metricRecord[key] !== value) {
                    return false;
                }
            }
            return true;
        });
    }
    groupByGranularity(metrics, granularity) {
        const groups = new Map();
        for (const metric of metrics) {
            const date = new Date(metric.timestamp);
            let key;
            switch (granularity) {
                case 'hour':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
                    break;
                case 'day':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    break;
                case 'week': {
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    key = `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
                    break;
                }
                case 'month':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    break;
                default:
                    key = metric.timestamp;
            }
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(metric);
        }
        return Array.from(groups.entries()).map(([period, periodMetrics]) => ({
            period,
            cost: periodMetrics.reduce((sum, m) => sum + m.cost, 0),
            requests: periodMetrics.length,
            averageCost: periodMetrics.reduce((sum, m) => sum + m.cost, 0) /
                periodMetrics.length || 0,
        }));
    }
    calculateSummaryStats(metrics) {
        if (metrics.length === 0) {
            return { totalCost: 0, totalRequests: 0, averageCost: 0 };
        }
        const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0);
        const totalRequests = metrics.length;
        const averageCost = totalCost / totalRequests;
        return {
            totalCost,
            totalRequests,
            averageCost,
            costRange: {
                min: Math.min(...metrics.map((m) => m.cost)),
                max: Math.max(...metrics.map((m) => m.cost)),
            },
        };
    }
    async generateRecommendations(metrics) {
        // Simple implementation using existing feature analysis
        const featureAnalysis = await this.analyzeFeatureCosts(metrics);
        const recommendations = [];
        for (const feature of featureAnalysis) {
            recommendations.push(...feature.recommendations);
        }
        return recommendations;
    }
    calculateTrends(metrics) {
        if (metrics.length < 2)
            return [];
        // Simple linear trend calculation
        const sortedMetrics = metrics.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const halfwayPoint = Math.floor(sortedMetrics.length / 2);
        const firstHalf = sortedMetrics.slice(0, halfwayPoint);
        const secondHalf = sortedMetrics.slice(halfwayPoint);
        const firstHalfAvg = firstHalf.reduce((sum, m) => sum + m.cost, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, m) => sum + m.cost, 0) / secondHalf.length;
        const change = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
        return [
            {
                metric: 'cost',
                direction: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable',
                changePercentage: Math.abs(change),
                confidence: Math.min(0.9, metrics.length / 100), // Higher confidence with more data
            },
        ];
    }
    calculateVolatility(metrics) {
        if (metrics.length < 3)
            return 'insufficient_data';
        const costs = metrics.map((m) => m.cost);
        const mean = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
        const variance = costs.reduce((sum, cost) => sum + Math.pow(cost - mean, 2), 0) /
            costs.length;
        const standardDeviation = Math.sqrt(variance);
        const coefficientOfVariation = standardDeviation / mean;
        if (coefficientOfVariation > 0.5)
            return 'high';
        if (coefficientOfVariation > 0.2)
            return 'medium';
        return 'low';
    }
    generateSimpleForecast(metrics) {
        if (metrics.length < 5)
            return [];
        // Simple moving average forecast
        const recentMetrics = metrics.slice(-5);
        const avgCost = recentMetrics.reduce((sum, m) => sum + m.cost, 0) / recentMetrics.length;
        const forecast = [];
        const now = new Date();
        for (let i = 1; i <= 7; i++) {
            const forecastDate = new Date(now);
            forecastDate.setDate(now.getDate() + i);
            forecast.push({
                date: forecastDate.toISOString(),
                predictedCost: avgCost * (0.9 + Math.random() * 0.2), // Add some variation
                confidence: Math.max(0.5, 1 - i * 0.1), // Decreasing confidence over time
            });
        }
        return forecast;
    }
    groupMetricsByField(metrics, field) {
        const groups = new Map();
        for (const metric of metrics) {
            const metricRecord = metric;
            const key = String(metricRecord[field] || 'unknown');
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(metric);
        }
        return groups;
    }
    calculateCategoryStats(breakdown) {
        return Array.from(breakdown.entries())
            .map(([category, categoryMetrics]) => ({
            category,
            cost: categoryMetrics.reduce((sum, m) => sum + m.cost, 0),
            requests: categoryMetrics.length,
            averageCost: categoryMetrics.reduce((sum, m) => sum + m.cost, 0) /
                categoryMetrics.length || 0,
        }))
            .sort((a, b) => b.cost - a.cost);
    }
    applyAggregations(metrics, aggregations) {
        const results = {};
        for (const [field, aggType] of Object.entries(aggregations)) {
            const values = metrics
                .map((m) => m[field])
                .filter((v) => v !== undefined);
            switch (aggType) {
                case 'sum':
                    results[field] = values.reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0);
                    break;
                case 'avg': {
                    const sum = values.reduce((acc, v) => acc + (typeof v === 'number' ? v : 0), 0);
                    results[field] = values.length > 0 ? sum / values.length : 0;
                    break;
                }
                case 'count':
                    results[field] = values.length;
                    break;
                case 'min':
                    results[field] =
                        values.length > 0
                            ? Math.min(...values.filter((v) => typeof v === 'number'))
                            : 0;
                    break;
                case 'max':
                    results[field] =
                        values.length > 0
                            ? Math.max(...values.filter((v) => typeof v === 'number'))
                            : 0;
                    break;
                default:
                    results[field] = values;
            }
        }
        return results;
    }
}
/**
 * Create a new AnalyticsEngine instance
 */
export function createAnalyticsEngine(projectRoot, budgetTracker, config) {
    return new AnalyticsEngine(projectRoot, budgetTracker, config);
}
//# sourceMappingURL=AnalyticsEngine.js.map