/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { createRealTimeTracker, } from './RealTimeTracker.js';
import { DashboardFormatter } from './DashboardFormatter.js';
import { ChartRenderer } from './ChartRenderer.js';
/**
 * Main Budget Usage Visualizer and Analytics Dashboard
 *
 * Coordinates all budget components to provide comprehensive cost tracking,
 * analytics, visualizations, and optimization recommendations.
 */
export class BudgetDashboard {
    budgetTracker;
    analytics;
    realTimeTracker;
    formatter;
    chartRenderer;
    config;
    isRunning = false;
    refreshTimer;
    currentData;
    constructor(budgetTracker, analytics, config = {}) {
        this.budgetTracker = budgetTracker;
        this.analytics = analytics;
        this.realTimeTracker = createRealTimeTracker(budgetTracker, analytics);
        // Set default configuration
        this.config = {
            refreshInterval: config.refreshInterval ?? 5000,
            maxHistoryDays: config.maxHistoryDays ?? 30,
            showRealTime: config.showRealTime ?? true,
            enableInteractivity: config.enableInteractivity ?? true,
            theme: config.theme ?? 'auto',
            chartType: config.chartType ?? 'mixed',
        };
        this.formatter = new DashboardFormatter(this.config);
        this.chartRenderer = new ChartRenderer({
            theme: this.config.theme,
            width: 80,
            height: 15,
        });
    }
    /**
     * Start the interactive dashboard
     */
    async startDashboard(sections = {}) {
        if (this.isRunning) {
            return;
        }
        this.isRunning = true;
        // Start real-time tracking if enabled
        if (this.config.showRealTime) {
            this.realTimeTracker.startTracking();
        }
        // Initial data load and display
        await this.refreshDashboard(sections);
        // Setup periodic refresh if interactive
        if (this.config.enableInteractivity) {
            this.setupPeriodicRefresh(sections);
            this.setupKeyboardHandlers();
        }
    }
    /**
     * Stop the dashboard
     */
    stopDashboard() {
        if (!this.isRunning) {
            return;
        }
        this.isRunning = false;
        this.realTimeTracker.stopTracking();
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = undefined;
        }
    }
    /**
     * Generate a static dashboard report
     */
    async generateReport(sections = {}) {
        const data = await this.collectDashboardData();
        const fullSections = {
            summary: true,
            realTimeUsage: true,
            historicalTrends: true,
            featureAnalysis: true,
            costProjections: true,
            optimizationRecommendations: true,
            budgetAlerts: true,
            ...sections,
        };
        return this.formatter.formatDashboard(data, fullSections);
    }
    /**
     * Get current dashboard data snapshot
     */
    async getDashboardData() {
        return this.collectDashboardData();
    }
    /**
     * Refresh dashboard display
     */
    async refreshDashboard(sections) {
        try {
            // Collect latest data
            this.currentData = await this.collectDashboardData();
            // Format and display
            const fullSections = {
                summary: true,
                realTimeUsage: this.config.showRealTime,
                historicalTrends: true,
                featureAnalysis: true,
                costProjections: true,
                optimizationRecommendations: true,
                budgetAlerts: true,
                ...sections,
            };
            const output = this.formatter.formatDashboard(this.currentData, fullSections);
            // Clear console and display updated dashboard
            if (this.config.enableInteractivity) {
                console.clear();
            }
            console.log(output);
        }
        catch (error) {
            console.error('Dashboard refresh failed:', error);
        }
    }
    /**
     * Collect all dashboard data from various sources
     */
    async collectDashboardData() {
        // Get budget settings and current usage
        const settings = this.budgetTracker.getBudgetSettings();
        const todayUsage = await this.budgetTracker.getTodayUsage();
        // Calculate current usage metrics
        const currentUsage = {
            todayRequests: todayUsage.requestCount,
            todayCost: todayUsage.totalCost,
            budgetRemaining: Math.max(0, (settings.dailyLimit || 0) - todayUsage.totalCost),
            budgetUtilization: settings.dailyLimit
                ? (todayUsage.totalCost / settings.dailyLimit) * 100
                : 0,
        };
        // Generate cost projections
        const projections = this.generateCostProjections(currentUsage, settings.dailyLimit || 0);
        // Generate trends data (mock data for now - would integrate with historical tracking)
        const trends = this.generateTrendsData();
        // Get real-time data if available
        const realTimeData = this.config.showRealTime
            ? this.realTimeTracker.getRealTimeData()
            : undefined;
        // Generate budget alerts
        const alerts = this.generateBudgetAlerts(currentUsage, settings);
        // Get analytics data (mock for now - would integrate with actual analytics engine)
        const features = this.generateFeatureAnalysis();
        const recommendations = this.generateOptimizationRecommendations(currentUsage);
        return {
            currentUsage,
            projections,
            trends,
            features,
            recommendations,
            alerts,
            realTimeData,
        };
    }
    /**
     * Generate cost projections based on current usage
     */
    generateCostProjections(usage, dailyLimit) {
        const hourOfDay = new Date().getHours();
        const dailyProgress = hourOfDay / 24;
        // Simple linear projection based on current usage
        const dailyProjection = dailyProgress > 0 ? usage.todayCost / dailyProgress : usage.todayCost;
        const weeklyProjection = dailyProjection * 7;
        const monthlyProjection = dailyProjection * 30;
        return {
            dailyProjection,
            weeklyProjection,
            monthlyProjection,
            exceedsDaily: dailyProjection > dailyLimit,
            exceedsWeekly: weeklyProjection > dailyLimit * 7,
            exceedsMonthly: monthlyProjection > dailyLimit * 30,
        };
    }
    /**
     * Generate historical trends data
     */
    generateTrendsData() {
        // Generate mock data - in real implementation would pull from historical storage
        return {
            hourlyUsage: Array.from({ length: 24 }, () => Math.floor(Math.random() * 100)),
            dailyUsage: Array.from({ length: 30 }, () => Math.floor(Math.random() * 500)),
            weeklyUsage: Array.from({ length: 12 }, () => Math.floor(Math.random() * 2000)),
        };
    }
    /**
     * Generate budget alerts based on current status
     */
    generateBudgetAlerts(usage, _settings) {
        const alerts = [];
        // Budget utilization alerts
        if (usage.budgetUtilization > 90) {
            alerts.push({
                id: 'budget_critical',
                type: 'critical',
                title: 'Budget Critical',
                message: 'Daily budget 90% utilized - immediate action required',
                timestamp: new Date().toISOString(),
                threshold: 90,
                currentValue: usage.budgetUtilization,
                actionable: true,
            });
        }
        else if (usage.budgetUtilization > 75) {
            alerts.push({
                id: 'budget_warning',
                type: 'warning',
                title: 'Budget Warning',
                message: 'Daily budget 75% utilized - monitor usage closely',
                timestamp: new Date().toISOString(),
                threshold: 75,
                currentValue: usage.budgetUtilization,
                actionable: true,
            });
        }
        return alerts;
    }
    /**
     * Generate feature cost analysis (mock data)
     */
    generateFeatureAnalysis() {
        const features = [
            'chat',
            'code-analysis',
            'documentation',
            'debugging',
            'testing',
        ];
        return features.map((feature, index) => ({
            featureId: `feature_${index}`,
            featureName: feature,
            totalCost: Math.random() * 10,
            requestCount: Math.floor(Math.random() * 100),
            averageCostPerRequest: Math.random() * 0.1,
            usageFrequency: Math.random(),
            businessValue: Math.random() * 10,
            roi: Math.random() * 5,
            costTrend: ['increasing', 'decreasing', 'stable', 'volatile'][Math.floor(Math.random() * 4)],
            utilizationRate: Math.random(),
            peakUsageHours: [`${9 + Math.floor(Math.random() * 8)}:00`],
            recommendations: [],
        }));
    }
    /**
     * Generate optimization recommendations
     */
    generateOptimizationRecommendations(usage) {
        const recommendations = [];
        if (usage.budgetUtilization > 80) {
            recommendations.push({
                id: 'reduce_frequency',
                type: 'cost_reduction',
                title: 'Optimize Request Frequency',
                description: 'Implement request batching to reduce API calls by 20-30%',
                potentialSavings: usage.todayCost * 0.25,
                savingsPercentage: 25,
                implementationComplexity: 'medium',
                timeToImplement: '2-3 hours',
                priority: 'high',
                confidenceScore: 0.85,
                applicableFeatures: ['chat', 'code-analysis'],
                actionItems: [
                    'Implement request batching logic',
                    'Add local caching for frequently accessed data',
                    'Optimize context window usage',
                ],
                metrics: {
                    currentCost: usage.todayCost,
                    projectedCost: usage.todayCost * 0.75,
                    expectedReduction: usage.todayCost * 0.25,
                },
            });
        }
        return recommendations;
    }
    /**
     * Setup periodic dashboard refresh
     */
    setupPeriodicRefresh(sections) {
        this.refreshTimer = setInterval(async () => {
            if (this.isRunning) {
                await this.refreshDashboard(sections);
            }
        }, this.config.refreshInterval);
    }
    /**
     * Setup keyboard handlers for interactive mode
     */
    setupKeyboardHandlers() {
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
            process.stdin.setEncoding('utf8');
            process.stdin.resume();
            process.stdin.on('data', (key) => {
                const keyStr = key.toString();
                switch (keyStr) {
                    case 'q':
                    case '\u0003': // Ctrl+C
                        this.stopDashboard();
                        process.exit(0);
                        break;
                    case 'r':
                        // Manual refresh
                        if (this.currentData) {
                            this.refreshDashboard({});
                        }
                        break;
                    case 'h':
                        // Show help
                        console.log('\nDashboard Controls:');
                        console.log('q - Quit dashboard');
                        console.log('r - Refresh dashboard');
                        console.log('h - Show this help');
                        break;
                    default:
                        // Ignore other keys
                        break;
                }
            });
        }
    }
}
/**
 * Create a budget dashboard instance
 */
export function createBudgetDashboard(budgetTracker, analytics, config) {
    return new BudgetDashboard(budgetTracker, analytics, config);
}
//# sourceMappingURL=BudgetDashboard.js.map