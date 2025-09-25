/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { createBudgetTracker } from './budget-tracker.js';
import { createHistoricalBudgetAnalyzer, } from './historical-analysis.js';
import { BudgetForecastingEngine, } from './forecasting-models.js';
import { createHistoricalVisualizationEngine, } from './historical-visualization.js';
/**
 * Comprehensive historical data analysis integration service
 */
export class HistoricalBudgetService {
    projectRoot;
    config;
    budgetTracker;
    historicalAnalyzer;
    forecastingEngine;
    visualizationEngine;
    cacheDir;
    schedulesDir;
    cache = new Map();
    constructor(projectRoot, budgetSettings, config = {}) {
        this.projectRoot = projectRoot;
        this.config = {
            // Default configuration
            autoRecord: true,
            recordingInterval: 60, // 1 hour
            dataRetentionDays: 365,
            trendAnalysisDays: 30,
            anomalyThreshold: 2.0,
            forecastHorizonDays: 7,
            forecastingModel: {
                modelType: 'ensemble',
                confidenceLevel: 0.95,
                seasonalPeriods: [7, 30],
            },
            enableEnsembleForecasting: true,
            monteCarloIterations: 1000,
            generateDashboard: true,
            dashboardRefreshInterval: 30, // 30 minutes
            exportReports: true,
            reportFormats: ['html', 'json'],
            batchProcessingSize: 1000,
            enableCaching: true,
            cacheExpirationMinutes: 15,
            ...config,
        };
        // Initialize components
        this.budgetTracker = createBudgetTracker(projectRoot, budgetSettings);
        this.historicalAnalyzer = createHistoricalBudgetAnalyzer(projectRoot, {
            maxHistoryDays: this.config.dataRetentionDays,
            anomalyThreshold: this.config.anomalyThreshold,
        });
        this.forecastingEngine = new BudgetForecastingEngine(this.config.forecastingModel);
        this.visualizationEngine = createHistoricalVisualizationEngine(projectRoot);
        // Initialize directories
        this.cacheDir = path.join(projectRoot, '.gemini', 'historical-cache');
        this.schedulesDir = path.join(projectRoot, '.gemini', 'analysis-schedules');
        this.initializeService();
    }
    /**
     * Record budget usage and trigger historical analysis if configured
     */
    async recordUsage(requestCount) {
        // Record in budget tracker first
        if (requestCount) {
            // For manual recording with specific count
            const currentUsage = await this.budgetTracker.getCurrentUsageData();
            currentUsage.requestCount = requestCount;
            await this.budgetTracker.saveUsageData(currentUsage);
        }
        else {
            // For normal API request recording
            await this.budgetTracker.recordRequest();
        }
        // Auto-record in historical analysis if enabled
        if (this.config.autoRecord) {
            await this.updateHistoricalData();
        }
    }
    /**
     * Update historical data from current budget tracker
     */
    async updateHistoricalData() {
        const usageData = await this.budgetTracker.getCurrentUsageData();
        const budgetSettings = this.budgetTracker.getBudgetSettings();
        await this.historicalAnalyzer.recordDailyUsage(usageData, budgetSettings);
        // Clear relevant cache entries
        this.clearCache(['trends', 'forecasts', 'insights']);
    }
    /**
     * Perform comprehensive historical analysis
     */
    async performAnalysis(options = {}) {
        const startTime = Date.now();
        const opts = {
            includeTrends: true,
            includeForecasts: true,
            includeAnomalies: true,
            includeVisualizations: this.config.generateDashboard,
            useEnsembleForecasting: this.config.enableEnsembleForecasting,
            scenarios: [],
            ...options,
        };
        // Check cache first
        const cacheKey = `analysis-${JSON.stringify(opts)}`;
        if (this.config.enableCaching) {
            const cached = this.getCachedData(cacheKey);
            if (cached) {
                return {
                    ...cached,
                    performance: {
                        ...cached.performance,
                        cacheHit: true,
                    },
                };
            }
        }
        // Load historical records
        const historicalRecords = await this.loadHistoricalRecords();
        if (historicalRecords.length === 0) {
            throw new Error('No historical data available for analysis');
        }
        // Initialize results structure
        const results = {
            summary: {
                dataRange: {
                    start: historicalRecords[0]?.date || '',
                    end: historicalRecords[historicalRecords.length - 1]?.date || '',
                },
                recordCount: historicalRecords.length,
                lastUpdate: new Date().toISOString(),
                dataQuality: 0,
            },
            trends: {},
            forecasts: { simple: [] },
            anomalies: [],
            insights: {
                recommendations: [],
                keyFindings: [],
                alerts: [],
            },
            performance: {
                analysisTime: 0,
                cacheHit: false,
                modelAccuracy: 0,
            },
        };
        // Perform trend analysis
        if (opts.includeTrends) {
            try {
                results.trends = await this.historicalAnalyzer.analyzeTrends(this.config.trendAnalysisDays);
                // Extract key findings from trends
                results.insights.keyFindings.push(`Usage trend: ${results.trends.trend} with ${Math.round(results.trends.confidence * 100)}% confidence`, `Average daily usage: ${Math.round(results.trends.averageDailyUsage)} requests`, `Volatility: ${Math.round(results.trends.volatility)} requests/day standard deviation`);
                // Generate trend-based alerts
                if (results.trends.trend === 'increasing' &&
                    results.trends.trendStrength > 0.5) {
                    results.insights.alerts.push({
                        type: 'warning',
                        message: 'Strong upward usage trend detected - consider budget adjustments',
                        priority: 2,
                    });
                }
            }
            catch (error) {
                console.warn('Failed to analyze trends:', error);
                results.insights.alerts.push({
                    type: 'warning',
                    message: 'Trend analysis failed due to insufficient data',
                    priority: 1,
                });
            }
        }
        // Perform forecasting
        if (opts.includeForecasts) {
            try {
                const forecastDates = this.generateForecastDates(this.config.forecastHorizonDays);
                const budgetSettings = this.budgetTracker.getBudgetSettings();
                // Simple forecasting
                for (const date of forecastDates) {
                    const forecast = await this.historicalAnalyzer.generateForecast(date, 0.95, budgetSettings);
                    results.forecasts.simple.push(forecast);
                }
                // Ensemble forecasting
                if (opts.useEnsembleForecasting && historicalRecords.length >= 14) {
                    results.forecasts.ensemble = [];
                    for (const date of forecastDates.slice(0, 3)) {
                        // Limit ensemble forecasts for performance
                        try {
                            const ensembleForecast = await this.forecastingEngine.generateEnsembleForecast(historicalRecords, date, opts.scenarios, { iterations: this.config.monteCarloIterations });
                            results.forecasts.ensemble.push(ensembleForecast);
                            // Update model accuracy from ensemble validation
                            results.performance.modelAccuracy =
                                ensembleForecast.modelValidation.accuracy;
                        }
                        catch (error) {
                            console.warn(`Failed to generate ensemble forecast for ${date}:`, error);
                        }
                    }
                }
                // Generate forecast insights
                const avgForecast = results.forecasts.simple.reduce((sum, f) => sum + f.forecastUsage, 0) / results.forecasts.simple.length;
                const currentAvg = results.trends.averageDailyUsage || avgForecast;
                if (avgForecast > currentAvg * 1.2) {
                    results.insights.alerts.push({
                        type: 'critical',
                        message: `Forecasts predict 20%+ usage increase (${Math.round(avgForecast)} vs ${Math.round(currentAvg)} current avg)`,
                        priority: 3,
                    });
                }
            }
            catch (error) {
                console.warn('Failed to generate forecasts:', error);
                results.insights.alerts.push({
                    type: 'warning',
                    message: 'Forecasting failed due to insufficient data',
                    priority: 1,
                });
            }
        }
        // Perform anomaly detection
        if (opts.includeAnomalies) {
            try {
                results.anomalies = await this.historicalAnalyzer.detectAnomalies(this.config.trendAnalysisDays);
                // Generate anomaly alerts
                const criticalAnomalies = results.anomalies.filter((a) => a.severity === 'critical');
                if (criticalAnomalies.length > 0) {
                    results.insights.alerts.push({
                        type: 'critical',
                        message: `${criticalAnomalies.length} critical usage anomalies detected`,
                        priority: 3,
                    });
                }
                const majorAnomalies = results.anomalies.filter((a) => a.severity === 'major');
                if (majorAnomalies.length > 2) {
                    results.insights.alerts.push({
                        type: 'warning',
                        message: `${majorAnomalies.length} major anomalies in recent period`,
                        priority: 2,
                    });
                }
            }
            catch (error) {
                console.warn('Failed to detect anomalies:', error);
            }
        }
        // Generate comprehensive insights
        try {
            const historicalInsights = await this.historicalAnalyzer.getHistoricalInsights(this.config.trendAnalysisDays);
            results.insights.recommendations = historicalInsights.recommendations;
            results.summary.dataQuality = historicalInsights.dataQuality.reliability;
            // Add data quality alerts
            if (historicalInsights.dataQuality.reliability < 0.7) {
                results.insights.alerts.push({
                    type: 'warning',
                    message: 'Data quality issues detected - consider improving data collection',
                    priority: 2,
                });
            }
        }
        catch (error) {
            console.warn('Failed to generate insights:', error);
        }
        // Generate visualizations
        if (opts.includeVisualizations) {
            try {
                const artifacts = [];
                // Usage charts
                const usageCharts = await this.visualizationEngine.generateUsageCharts(historicalRecords);
                artifacts.push(...usageCharts);
                // Trend analysis charts
                if (results.trends.trend) {
                    const trendCharts = await this.visualizationEngine.generateTrendAnalysisCharts(historicalRecords, results.trends);
                    artifacts.push(...trendCharts);
                }
                // Forecast charts
                if (results.forecasts.simple.length > 0) {
                    const forecastCharts = await this.visualizationEngine.generateForecastCharts(historicalRecords, results.forecasts.simple);
                    artifacts.push(...forecastCharts);
                }
                // Anomaly charts
                if (results.anomalies.length > 0) {
                    const anomalyCharts = await this.visualizationEngine.generateAnomalyCharts(historicalRecords, results.anomalies);
                    artifacts.push(...anomalyCharts);
                }
                // Dashboard
                const dashboard = await this.visualizationEngine.createDashboard(historicalRecords, results.trends, results.forecasts.simple, results.anomalies);
                artifacts.push(dashboard);
                results.visualizations = artifacts;
            }
            catch (error) {
                console.warn('Failed to generate visualizations:', error);
                results.insights.alerts.push({
                    type: 'info',
                    message: 'Some visualizations could not be generated',
                    priority: 1,
                });
            }
        }
        // Finalize performance metrics
        results.performance.analysisTime = Date.now() - startTime;
        results.performance.cacheHit = false;
        // Cache results
        if (this.config.enableCaching) {
            this.setCachedData(cacheKey, results);
        }
        return results;
    }
    /**
     * Generate comprehensive reports
     */
    async generateReports(results, customConfig) {
        const reports = [];
        const historicalRecords = await this.loadHistoricalRecords();
        const baseConfig = {
            title: 'Budget Usage Historical Analysis Report',
            description: 'Comprehensive analysis of budget usage patterns, trends, and forecasts',
            period: {
                start: results.summary.dataRange.start,
                end: results.summary.dataRange.end,
            },
            sections: [
                { type: 'summary', title: 'Executive Summary' },
                { type: 'trends', title: 'Usage Trends Analysis' },
                { type: 'forecasts', title: 'Budget Forecasts' },
                { type: 'anomalies', title: 'Anomaly Detection Results' },
                { type: 'recommendations', title: 'Recommendations' },
            ],
            format: 'html',
            includeCharts: true,
            includeRawData: false,
            ...customConfig,
        };
        // Generate reports in all configured formats
        for (const format of this.config.reportFormats) {
            const reportConfig = { ...baseConfig, format };
            try {
                const report = await this.visualizationEngine.generateHistoricalReport(historicalRecords, results.trends, results.forecasts.simple, results.anomalies, reportConfig);
                reports.push(report);
            }
            catch (error) {
                console.warn(`Failed to generate ${format} report:`, error);
            }
        }
        return reports;
    }
    /**
     * Get real-time historical metrics
     */
    async getRealTimeMetrics() {
        // Current metrics from budget tracker
        const usageStats = await this.budgetTracker.getUsageStats();
        // Historical metrics from analyzer
        let historicalMetrics = {
            averageUsage: 0,
            peakUsage: 0,
            efficiency: 0,
            trendDirection: 'stable',
        };
        try {
            const insights = await this.historicalAnalyzer.getHistoricalInsights(7); // Last week
            historicalMetrics = {
                averageUsage: insights.summary.averageUsage,
                peakUsage: insights.summary.peakUsage,
                efficiency: insights.summary.efficiency * 100,
                trendDirection: insights.trends.trend,
            };
        }
        catch (error) {
            console.warn('Failed to get historical metrics:', error);
        }
        // Recent alerts
        const alerts = await this.getRecentAlerts();
        return {
            current: {
                todayUsage: usageStats.requestCount,
                todayLimit: usageStats.dailyLimit,
                todayPercentage: usageStats.usagePercentage,
                timeUntilReset: usageStats.timeUntilReset,
            },
            historical: historicalMetrics,
            alerts: alerts.map((alert) => ({
                type: alert.type,
                message: alert.message,
                timestamp: new Date().toISOString(),
            })),
        };
    }
    /**
     * Schedule automatic analysis jobs
     */
    async scheduleAnalysis(schedule) {
        const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const fullSchedule = {
            id: scheduleId,
            nextRun: this.calculateNextRun(schedule.frequency),
            ...schedule,
        };
        await this.saveSchedule(fullSchedule);
        return scheduleId;
    }
    /**
     * Execute scheduled analysis jobs
     */
    async executeScheduledJobs() {
        let executed = 0;
        let failed = 0;
        try {
            const schedules = await this.loadSchedules();
            const now = new Date();
            for (const schedule of schedules) {
                if (!schedule.enabled)
                    continue;
                const nextRun = new Date(schedule.nextRun || 0);
                if (now >= nextRun) {
                    try {
                        await this.executeScheduledJob(schedule);
                        // Update schedule for next run
                        schedule.lastRun = now.toISOString();
                        schedule.nextRun = this.calculateNextRun(schedule.frequency);
                        await this.saveSchedule(schedule);
                        executed++;
                    }
                    catch (error) {
                        console.error(`Failed to execute scheduled job ${schedule.id}:`, error);
                        failed++;
                    }
                }
            }
        }
        catch (error) {
            console.error('Failed to execute scheduled jobs:', error);
        }
        return { executed, failed };
    }
    /**
     * Clean up old data and cache
     */
    async cleanup(options = {}) {
        const opts = {
            cleanHistoricalData: true,
            cleanCache: true,
            cleanVisualizations: true,
            daysToKeep: this.config.dataRetentionDays,
            ...options,
        };
        if (opts.cleanCache) {
            await this.clearAllCache();
        }
        if (opts.cleanHistoricalData) {
            // Cleanup is handled automatically by the historical analyzer
            console.log('Historical data cleanup handled by retention policy');
        }
        if (opts.cleanVisualizations) {
            await this.cleanupVisualizations(opts.daysToKeep);
        }
    }
    // Private helper methods
    async initializeService() {
        try {
            await fs.mkdir(this.cacheDir, { recursive: true });
            await fs.mkdir(this.schedulesDir, { recursive: true });
        }
        catch (error) {
            console.warn('Failed to initialize historical service directories:', error);
        }
    }
    async loadHistoricalRecords() {
        // This would normally be loaded from the historical analyzer
        // For now, we'll return an empty array as a placeholder
        try {
            const dataPath = path.join(this.projectRoot, '.gemini', 'budget-history.json');
            const data = await fs.readFile(dataPath, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            return [];
        }
    }
    generateForecastDates(horizonDays) {
        const dates = [];
        const today = new Date();
        for (let i = 1; i <= horizonDays; i++) {
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + i);
            dates.push(futureDate.toISOString().split('T')[0]);
        }
        return dates;
    }
    getCachedData(key) {
        if (!this.config.enableCaching)
            return null;
        const cached = this.cache.get(key);
        if (!cached)
            return null;
        const expirationTime = cached.timestamp + this.config.cacheExpirationMinutes * 60 * 1000;
        if (Date.now() > expirationTime) {
            this.cache.delete(key);
            return null;
        }
        return cached.data;
    }
    setCachedData(key, data) {
        if (!this.config.enableCaching)
            return;
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
        });
        // Cleanup old cache entries
        if (this.cache.size > 100) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
    }
    clearCache(keys) {
        if (!keys) {
            this.cache.clear();
            return;
        }
        for (const key of keys) {
            // Clear all cache entries that start with any of the specified keys
            for (const cacheKey of this.cache.keys()) {
                if (keys.some((k) => cacheKey.startsWith(k))) {
                    this.cache.delete(cacheKey);
                }
            }
        }
    }
    async clearAllCache() {
        this.cache.clear();
        try {
            const files = await fs.readdir(this.cacheDir);
            await Promise.all(files.map((file) => fs.unlink(path.join(this.cacheDir, file)).catch(() => { })));
        }
        catch (error) {
            // Directory might not exist
        }
    }
    async getRecentAlerts() {
        // This would integrate with the alert system
        // For now, return empty array
        return [];
    }
    calculateNextRun(frequency) {
        const now = new Date();
        switch (frequency) {
            case 'hourly':
                now.setHours(now.getHours() + 1);
                break;
            case 'daily':
                now.setDate(now.getDate() + 1);
                break;
            case 'weekly':
                now.setDate(now.getDate() + 7);
                break;
            case 'monthly':
                now.setMonth(now.getMonth() + 1);
                break;
        }
        return now.toISOString();
    }
    async saveSchedule(schedule) {
        try {
            const schedulePath = path.join(this.schedulesDir, `${schedule.id}.json`);
            await fs.writeFile(schedulePath, JSON.stringify(schedule, null, 2));
        }
        catch (error) {
            console.error(`Failed to save schedule ${schedule.id}:`, error);
        }
    }
    async loadSchedules() {
        try {
            const files = await fs.readdir(this.schedulesDir);
            const schedules = [];
            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const data = await fs.readFile(path.join(this.schedulesDir, file), 'utf-8');
                        schedules.push(JSON.parse(data));
                    }
                    catch (error) {
                        console.warn(`Failed to load schedule from ${file}:`, error);
                    }
                }
            }
            return schedules;
        }
        catch (error) {
            return [];
        }
    }
    async executeScheduledJob(schedule) {
        switch (schedule.type) {
            case 'trend_analysis':
                await this.performAnalysis({
                    includeTrends: true,
                    includeForecasts: false,
                    includeAnomalies: false,
                    includeVisualizations: false,
                });
                break;
            case 'forecast_update':
                await this.performAnalysis({
                    includeTrends: false,
                    includeForecasts: true,
                    includeAnomalies: false,
                    includeVisualizations: false,
                });
                break;
            case 'anomaly_detection':
                await this.performAnalysis({
                    includeTrends: false,
                    includeForecasts: false,
                    includeAnomalies: true,
                    includeVisualizations: false,
                });
                break;
            case 'report_generation':
                const results = await this.performAnalysis();
                await this.generateReports(results);
                break;
            default:
                throw new Error(`Unknown scheduled job type: ${schedule.type}`);
        }
    }
    async cleanupVisualizations(daysToKeep) {
        try {
            const visualizationDir = path.join(this.projectRoot, '.gemini', 'visualizations');
            const files = await fs.readdir(visualizationDir);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            for (const file of files) {
                try {
                    const filePath = path.join(visualizationDir, file);
                    const stats = await fs.stat(filePath);
                    if (stats.mtime < cutoffDate) {
                        await fs.unlink(filePath);
                    }
                }
                catch (error) {
                    // File might have been deleted already
                }
            }
        }
        catch (error) {
            // Directory might not exist
        }
    }
}
/**
 * Create a new HistoricalBudgetService instance
 */
export function createHistoricalBudgetService(projectRoot, budgetSettings, config) {
    return new HistoricalBudgetService(projectRoot, budgetSettings, config);
}
//# sourceMappingURL=historical-integration.js.map