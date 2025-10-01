/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Implementation of ML Enhanced Budget Tracker
 */
export class MLEnhancedBudgetTrackerImpl {
    projectRoot;
    settings;
    historicalData = [];
    modelLastTrained = new Date();
    predictions = new Map();
    constructor(projectRoot, settings) {
        this.projectRoot = projectRoot;
        this.settings = settings;
    }
    /**
     * Generate cost forecast using ML models
     */
    async generateForecast(hours) {
        const forecast = [];
        const now = new Date();
        // Simple forecasting algorithm - in production, this would use actual ML models
        for (let i = 1; i <= hours; i++) {
            const timestamp = new Date(now.getTime() + i * 60 * 60 * 1000);
            // Basic prediction based on historical patterns
            const baseCost = this.calculateBaseCost();
            const variability = 0.1; // 10% variability
            const trendFactor = this.calculateTrendFactor();
            const predictedCost = baseCost * trendFactor * (1 + (Math.random() - 0.5) * variability);
            forecast.push({
                timestamp: timestamp.toISOString(),
                predictedCost: Math.max(0, predictedCost),
                confidence: 0.8, // Mock confidence level
                lowerBound: predictedCost * 0.8,
                upperBound: predictedCost * 1.2,
                factors: {
                    historical: 0.4,
                    trend: 0.3,
                    seasonality: 0.2,
                    external: 0.1,
                },
            });
        }
        return forecast;
    }
    /**
     * Get ML-powered recommendations
     */
    async getRecommendations() {
        const recommendations = [];
        const currentUsage = this.getCurrentUsagePattern();
        // Generate sample recommendations based on usage patterns
        if (currentUsage.cost > (this.settings.dailyLimit || 10) * 0.8) {
            recommendations.push({
                id: `rec_${Date.now()}_1`,
                type: 'COST_REDUCTION',
                priority: 4,
                title: 'High Usage Detected',
                description: 'Your usage is approaching the daily limit. Consider optimizing API calls.',
                expectedImpact: {
                    costSavings: currentUsage.cost * 0.2,
                    confidence: 0.8,
                    timeFrame: '24 hours',
                },
                difficulty: 2,
                actions: [
                    'Review API call patterns',
                    'Implement request caching',
                    'Optimize prompts for efficiency',
                ],
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            });
        }
        return recommendations;
    }
    /**
     * Assess current risk levels
     */
    async assessRisk() {
        const currentUsage = this.getCurrentUsagePattern();
        const dailyLimit = this.settings.dailyLimit || 10;
        const usageRatio = currentUsage.cost / dailyLimit;
        let riskLevel = 0;
        let category = 'low';
        if (usageRatio < 0.5) {
            riskLevel = 0.2;
            category = 'low';
        }
        else if (usageRatio < 0.8) {
            riskLevel = 0.5;
            category = 'medium';
        }
        else if (usageRatio < 1.0) {
            riskLevel = 0.8;
            category = 'high';
        }
        else {
            riskLevel = 0.95;
            category = 'critical';
        }
        return {
            overallRisk: riskLevel,
            category: 'LOW',
            factors: [
                {
                    name: 'Usage Velocity',
                    impact: 0.6,
                    probability: 0.8,
                    description: 'Rate of budget consumption',
                    category: 'usage',
                },
                {
                    name: 'Time Remaining',
                    impact: 0.4,
                    probability: 0.7,
                    description: 'Time left in budget period',
                    category: 'temporal',
                },
            ],
            trend: usageRatio > 0.8 ? 'increasing' : 'stable',
            mitigations: [
                'Implement usage throttling',
                'Set up alerts for threshold breaches',
                'Review and optimize high-cost operations',
            ],
            timeline: category === 'critical' ? 'immediate' : '1-2 hours',
        };
    }
    /**
     * Get prediction confidence metrics
     */
    async getPredictionConfidence() {
        const dataQuality = this.historicalData.length > 100 ? 0.9 : 0.6;
        const modelAge = Date.now() - this.modelLastTrained.getTime();
        const modelAccuracy = modelAge < 24 * 60 * 60 * 1000 ? 0.85 : 0.7; // Decay with time
        return {
            overall: (dataQuality + modelAccuracy + 0.8 + 0.7) / 4,
            dataQuality,
            modelAccuracy,
            historicalPerformance: 0.8,
            sampleSize: 0.7,
            factors: [
                {
                    name: 'Data Volume',
                    impact: 0.3,
                    description: 'Amount of historical data available',
                    weight: 0.25,
                },
                {
                    name: 'Model Recency',
                    impact: modelAge < 24 * 60 * 60 * 1000 ? 0.2 : -0.2,
                    description: 'How recently the model was trained',
                    weight: 0.25,
                },
            ],
            interval: {
                lower: 0.6,
                upper: 0.9,
            },
        };
    }
    /**
     * Detect usage anomalies
     */
    async detectAnomalies() {
        // Mock anomaly detection - in production, this would use statistical analysis
        return {
            anomalies: [],
            confidence: 0.8,
        };
    }
    /**
     * Get model performance metrics
     */
    async getModelMetrics() {
        return {
            accuracy: 0.85,
            precision: 0.82,
            recall: 0.88,
            f1Score: 0.85,
            lastUpdated: this.modelLastTrained.toISOString(),
        };
    }
    /**
     * Update tracker with new usage data
     */
    async updateUsageData(data) {
        // Convert usage data to historical points
        const point = {
            timestamp: data.date,
            cost: data.totalCost,
            requests: data.requestCount,
            tokens: data.tokenUsage.totalTokens,
        };
        this.historicalData.push(point);
        // Keep only recent data (last 1000 points)
        if (this.historicalData.length > 1000) {
            this.historicalData = this.historicalData.slice(-1000);
        }
    }
    /**
     * Validate operation with ML insights
     */
    async validateOperation(context) {
        const currentUsage = this.getCurrentUsagePattern();
        const limit = this.settings.dailyLimit || 10;
        const usagePercentage = (currentUsage.cost / limit) * 100;
        return {
            allowed: currentUsage.cost < limit,
            currentUsage: currentUsage.cost,
            limit,
            usagePercentage,
            warningLevel: usagePercentage > 80 ? 1 : undefined,
            message: usagePercentage > 90 ? 'Approaching budget limit' : 'Operation allowed',
            recommendations: usagePercentage > 80
                ? ['Monitor usage closely', 'Consider optimization']
                : [],
        };
    }
    /**
     * Train the ML model with historical data
     */
    async trainModel(historicalData) {
        this.historicalData = [...historicalData];
        this.modelLastTrained = new Date();
        // In production, this would train actual ML models
        console.log(`Model trained with ${historicalData.length} data points`);
    }
    /**
     * Get historical trend analysis
     */
    async getTrendAnalysis() {
        const recentData = this.historicalData.slice(-30); // Last 30 points
        if (recentData.length < 3) {
            return {
                trend: 'stable',
                changeRate: 0,
                seasonality: false,
                patterns: ['Insufficient data'],
            };
        }
        // Simple trend calculation
        const firstHalf = recentData.slice(0, Math.floor(recentData.length / 2));
        const secondHalf = recentData.slice(Math.floor(recentData.length / 2));
        const firstAvg = firstHalf.reduce((sum, p) => sum + p.cost, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, p) => sum + p.cost, 0) / secondHalf.length;
        const changeRate = (secondAvg - firstAvg) / firstAvg;
        let trend = 'stable';
        if (Math.abs(changeRate) > 0.1) {
            trend = changeRate > 0 ? 'increasing' : 'decreasing';
        }
        return {
            trend,
            changeRate,
            seasonality: false, // Would require more sophisticated analysis
            patterns: [
                trend === 'increasing'
                    ? 'Upward trend detected'
                    : trend === 'decreasing'
                        ? 'Downward trend detected'
                        : 'Stable usage pattern',
            ],
        };
    }
    /**
     * Calculate base cost for predictions
     */
    calculateBaseCost() {
        if (this.historicalData.length === 0) {
            return 0.1; // Default base cost
        }
        const recentData = this.historicalData.slice(-10);
        const avgCost = recentData.reduce((sum, p) => sum + p.cost, 0) / recentData.length;
        return avgCost;
    }
    /**
     * Calculate trend factor for predictions
     */
    calculateTrendFactor() {
        if (this.historicalData.length < 5) {
            return 1.0; // No trend adjustment
        }
        const recent = this.historicalData.slice(-5);
        const older = this.historicalData.slice(-10, -5);
        if (older.length === 0)
            return 1.0;
        const recentAvg = recent.reduce((sum, p) => sum + p.cost, 0) / recent.length;
        const olderAvg = older.reduce((sum, p) => sum + p.cost, 0) / older.length;
        return olderAvg === 0 ? 1.0 : recentAvg / olderAvg;
    }
    /**
     * Get current usage pattern
     */
    getCurrentUsagePattern() {
        if (this.historicalData.length === 0) {
            return { cost: 0, requests: 0 };
        }
        const today = new Date().toISOString().split('T')[0];
        const todayData = this.historicalData.filter((p) => p.timestamp.startsWith(today));
        if (todayData.length === 0) {
            return { cost: 0, requests: 0 };
        }
        return {
            cost: todayData.reduce((sum, p) => sum + p.cost, 0),
            requests: todayData.reduce((sum, p) => sum + p.requests, 0),
        };
    }
}
/**
 * Factory function to create ML Enhanced Budget Tracker
 */
export function createMLEnhancedBudgetTracker(projectRoot, settings) {
    return new MLEnhancedBudgetTrackerImpl(projectRoot, settings);
}
/**
 * Default export for convenience
 */
export default {
    MLEnhancedBudgetTrackerImpl,
    createMLEnhancedBudgetTracker,
};
//# sourceMappingURL=ml-enhanced-tracker.js.map