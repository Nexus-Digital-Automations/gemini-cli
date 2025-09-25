/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as path from 'node:path';
import { mlBudgetAPI } from '../api/ml-budget-api.js';
/**
 * CLI utility for ML budget operations
 */
export class MLBudgetCLI {
  projectRoot;
  defaultSettings;
  constructor(projectRoot, settings) {
    this.projectRoot = projectRoot || process.cwd();
    this.defaultSettings = settings || {
      enabled: true,
      dailyLimit: 1000,
      resetTime: '00:00',
      warningThresholds: [50, 75, 90],
    };
  }
  /**
   * Generate and display budget forecast
   */
  async forecast(hours = 24, settings) {
    console.log(`🔮 Generating ${hours}-hour budget forecast...\n`);
    try {
      const result = await mlBudgetAPI.generateForecast({
        projectRoot: this.projectRoot,
        settings: settings || this.defaultSettings,
        forecastHours: hours,
      });
      if (!result.success || !result.data) {
        console.error('❌ Failed to generate forecast:', result.error);
        return;
      }
      const { forecast, riskAssessment, confidence, recommendations } =
        result.data;
      // Display forecast summary
      console.log('📊 Forecast Summary:');
      console.log('─'.repeat(50));
      if (forecast.length > 0) {
        const totalPredicted = forecast.reduce(
          (sum, point) => sum + point.predictedValue,
          0,
        );
        const avgConfidence =
          forecast.reduce((sum, point) => sum + point.confidence, 0) /
          forecast.length;
        console.log(`⏱️  Forecast Horizon: ${hours} hours`);
        console.log(
          `📈 Total Predicted Usage: ${Math.round(totalPredicted)} requests`,
        );
        console.log(
          `📉 Hourly Average: ${Math.round(totalPredicted / hours)} requests`,
        );
        console.log(
          `🎯 Overall Confidence: ${(avgConfidence * 100).toFixed(1)}% (${confidence})`,
        );
        console.log(
          `⚠️  Risk Level: ${riskAssessment.riskLevel.toUpperCase()}`,
        );
        console.log(
          `🎲 Budget Exceed Probability: ${(riskAssessment.budgetExceedProbability * 100).toFixed(1)}%`,
        );
        if (riskAssessment.timeToExceedBudget) {
          console.log(
            `⏰ Time to Budget Exceed: ${riskAssessment.timeToExceedBudget.toFixed(1)} hours`,
          );
        }
      }
      // Display recommendations
      if (recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        console.log('─'.repeat(50));
        for (const rec of recommendations.slice(0, 5)) {
          const icon = this.getRecommendationIcon(rec.type, rec.priority);
          console.log(`${icon} [${rec.priority.toUpperCase()}] ${rec.message}`);
          if (rec.suggestedAction) {
            console.log(`   💡 Action: ${rec.suggestedAction}`);
          }
        }
      }
      // Display risk thresholds
      if (riskAssessment.criticalThresholds.length > 0) {
        console.log('\n⚠️  Critical Thresholds:');
        console.log('─'.repeat(50));
        for (const threshold of riskAssessment.criticalThresholds) {
          const risk =
            threshold.probability > 0.7
              ? '🔴'
              : threshold.probability > 0.4
                ? '🟡'
                : '🟢';
          console.log(
            `${risk} ${(threshold.threshold * 100).toFixed(0)}% threshold: ${(threshold.probability * 100).toFixed(1)}% probability (${threshold.estimatedTime.toFixed(1)}h)`,
          );
        }
      }
    } catch (error) {
      console.error('❌ Error generating forecast:', error);
    }
  }
  /**
   * Display optimization suggestions
   */
  async optimize(settings) {
    console.log(
      '🔧 Analyzing usage patterns for optimization opportunities...\n',
    );
    try {
      const result = await mlBudgetAPI.getOptimizationSuggestions({
        projectRoot: this.projectRoot,
        settings: settings || this.defaultSettings,
      });
      if (!result.success || !result.data) {
        console.error(
          '❌ Failed to get optimization suggestions:',
          result.error,
        );
        return;
      }
      const { immediate, shortTerm, longTerm, potentialSavings } = result.data;
      // Display potential savings
      console.log('💰 Optimization Potential:');
      console.log('─'.repeat(50));
      console.log(
        `📊 Potential Savings: ${potentialSavings.percentage.toFixed(1)}% (${potentialSavings.estimatedRequests} requests)`,
      );
      console.log(
        `🎯 Confidence: ${potentialSavings.confidence.toUpperCase()}`,
      );
      // Display categorized recommendations
      this.displayRecommendationCategory('🚨 Immediate Actions', immediate);
      this.displayRecommendationCategory(
        '📅 Short-term Improvements',
        shortTerm,
      );
      this.displayRecommendationCategory('🗓️  Long-term Strategy', longTerm);
    } catch (error) {
      console.error('❌ Error getting optimization suggestions:', error);
    }
  }
  /**
   * Detect and display anomalies
   */
  async anomalies(settings) {
    console.log('🔍 Detecting usage anomalies and patterns...\n');
    try {
      const result = await mlBudgetAPI.detectAnomalies({
        projectRoot: this.projectRoot,
        settings: settings || this.defaultSettings,
      });
      if (!result.success || !result.data) {
        console.error('❌ Failed to detect anomalies:', result.error);
        return;
      }
      const { anomalies, patterns } = result.data;
      // Display pattern analysis
      console.log('🔄 Usage Patterns:');
      console.log('─'.repeat(50));
      console.log(`📈 Trend: ${patterns.trends.description}`);
      console.log(`🔄 Seasonality: ${patterns.seasonality.description}`);
      console.log(`📊 Volatility: ${patterns.volatility.description}`);
      // Display anomalies
      if (anomalies.length > 0) {
        console.log('\n🚨 Detected Anomalies:');
        console.log('─'.repeat(50));
        const recentAnomalies = anomalies
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10);
        for (const anomaly of recentAnomalies) {
          const icon =
            anomaly.severity === 'high'
              ? '🔴'
              : anomaly.severity === 'medium'
                ? '🟡'
                : '🟢';
          const date = new Date(anomaly.timestamp).toLocaleString();
          console.log(
            `${icon} ${date}: ${anomaly.value} requests (${anomaly.severity})`,
          );
          console.log(`   📝 Reason: ${anomaly.reason}`);
          console.log(`   📊 Impact: ${anomaly.impact}`);
          console.log(`   💡 Action: ${anomaly.suggestedAction}`);
          console.log();
        }
      } else {
        console.log(
          '\n✅ No significant anomalies detected in recent usage patterns.',
        );
      }
    } catch (error) {
      console.error('❌ Error detecting anomalies:', error);
    }
  }
  /**
   * Display ML model performance metrics
   */
  async metrics(settings) {
    console.log('📈 ML Model Performance Metrics...\n');
    try {
      const result = await mlBudgetAPI.getModelMetrics({
        projectRoot: this.projectRoot,
        settings: settings || this.defaultSettings,
      });
      if (!result.success || !result.data) {
        console.error('❌ Failed to get model metrics:', result.error);
        return;
      }
      const { models, overallAccuracy, dataQuality, recommendations } =
        result.data;
      // Display overall performance
      console.log('🎯 Overall Performance:');
      console.log('─'.repeat(50));
      console.log(
        `📊 Average Model Accuracy: ${(overallAccuracy * 100).toFixed(1)}%`,
      );
      const performanceLevel =
        overallAccuracy >= 0.9
          ? '🟢 Excellent'
          : overallAccuracy >= 0.8
            ? '🟡 Good'
            : overallAccuracy >= 0.6
              ? '🟠 Fair'
              : '🔴 Poor';
      console.log(`⭐ Performance Level: ${performanceLevel}`);
      // Display individual model metrics
      if (models.length > 0) {
        console.log('\n🤖 Individual Models:');
        console.log('─'.repeat(50));
        for (const model of models) {
          const performanceIcon = this.getPerformanceIcon(model.performance);
          console.log(`${performanceIcon} ${model.name}:`);
          console.log(`   📊 Accuracy: ${(model.accuracy * 100).toFixed(1)}%`);
          console.log(
            `   📅 Last Training: ${new Date(model.lastTraining).toLocaleString()}`,
          );
          console.log(
            `   📈 Training Data: ${model.trainingDataPoints} points`,
          );
          console.log(`   ⭐ Performance: ${model.performance.toUpperCase()}`);
          console.log();
        }
      }
      // Display data quality metrics
      console.log('📊 Data Quality Assessment:');
      console.log('─'.repeat(50));
      console.log(
        `✅ Completeness: ${(dataQuality.completeness * 100).toFixed(1)}%`,
      );
      console.log(
        `🔄 Consistency: ${(dataQuality.consistency * 100).toFixed(1)}%`,
      );
      console.log(`⏰ Recency: ${(dataQuality.recency * 100).toFixed(1)}%`);
      console.log(`📦 Volume: ${(dataQuality.volume * 100).toFixed(1)}%`);
      // Display improvement recommendations
      if (recommendations.length > 0) {
        console.log('\n💡 Improvement Recommendations:');
        console.log('─'.repeat(50));
        for (const recommendation of recommendations) {
          console.log(`• ${recommendation}`);
        }
      }
    } catch (error) {
      console.error('❌ Error getting model metrics:', error);
    }
  }
  /**
   * Display enhanced usage statistics
   */
  async stats(settings) {
    console.log('📊 Enhanced Usage Statistics...\n');
    try {
      const result = await mlBudgetAPI.getUsageStats({
        projectRoot: this.projectRoot,
        settings: settings || this.defaultSettings,
      });
      if (!result.success || !result.data) {
        console.error('❌ Failed to get usage statistics:', result.error);
        return;
      }
      const { current, mlPredictions } = result.data;
      // Display current usage
      console.log('📈 Current Usage:');
      console.log('─'.repeat(50));
      console.log(
        `🔢 Requests Today: ${current.requestCount}/${current.dailyLimit}`,
      );
      console.log(
        `📊 Usage Percentage: ${current.usagePercentage.toFixed(1)}%`,
      );
      console.log(`⏳ Remaining Requests: ${current.remainingRequests}`);
      console.log(`⏰ Time Until Reset: ${current.timeUntilReset}`);
      // Display ML predictions if available
      if (mlPredictions) {
        console.log('\n🔮 ML Predictions:');
        console.log('─'.repeat(50));
        console.log(
          `📊 Model Accuracy: ${(mlPredictions.modelAccuracy * 100).toFixed(1)}%`,
        );
        if (mlPredictions.trendAnalysis) {
          const trendIcon =
            mlPredictions.trendAnalysis.direction === 'increasing'
              ? '📈'
              : mlPredictions.trendAnalysis.direction === 'decreasing'
                ? '📉'
                : '📊';
          console.log(
            `${trendIcon} Trend: ${mlPredictions.trendAnalysis.direction.toUpperCase()} (${(mlPredictions.trendAnalysis.confidence * 100).toFixed(1)}% confidence)`,
          );
          console.log(
            `🔄 Seasonality: ${mlPredictions.trendAnalysis.seasonalityDetected ? 'Detected' : 'Not detected'}`,
          );
        }
        // Display recent predictions
        if (mlPredictions.dailyForecast.length > 0) {
          const nextHours = mlPredictions.dailyForecast.slice(0, 6);
          console.log('\n⏱️  Next 6 Hours Forecast:');
          console.log('─'.repeat(50));
          for (const [index, forecast] of nextHours.entries()) {
            const time = new Date(forecast.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            const confidence = (forecast.confidence * 100).toFixed(0);
            console.log(
              `${time}: ${Math.round(forecast.predictedValue)} requests (${confidence}% confidence)`,
            );
          }
        }
        // Display risk assessment
        if (mlPredictions.riskAssessment) {
          const risk = mlPredictions.riskAssessment;
          const riskIcon =
            risk.riskLevel === 'critical'
              ? '🔴'
              : risk.riskLevel === 'high'
                ? '🟠'
                : risk.riskLevel === 'medium'
                  ? '🟡'
                  : '🟢';
          console.log('\n⚠️  Risk Assessment:');
          console.log('─'.repeat(50));
          console.log(
            `${riskIcon} Risk Level: ${risk.riskLevel.toUpperCase()}`,
          );
          console.log(
            `🎲 Exceed Probability: ${(risk.budgetExceedProbability * 100).toFixed(1)}%`,
          );
          if (risk.timeToExceedBudget) {
            console.log(
              `⏰ Time to Exceed: ${risk.timeToExceedBudget.toFixed(1)} hours`,
            );
          }
        }
        // Display top recommendations
        if (mlPredictions.recommendations.length > 0) {
          console.log('\n💡 Top Recommendations:');
          console.log('─'.repeat(50));
          const topRecs = mlPredictions.recommendations
            .filter(
              (rec) => rec.priority === 'high' || rec.priority === 'medium',
            )
            .slice(0, 3);
          for (const rec of topRecs) {
            const icon = this.getRecommendationIcon(rec.type, rec.priority);
            console.log(
              `${icon} [${rec.priority.toUpperCase()}] ${rec.message}`,
            );
          }
        }
      }
    } catch (error) {
      console.error('❌ Error getting usage statistics:', error);
    }
  }
  /**
   * Health check for ML system
   */
  async health(settings) {
    console.log('🏥 ML Budget System Health Check...\n');
    try {
      const result = await mlBudgetAPI.healthCheck(
        this.projectRoot,
        settings || this.defaultSettings,
      );
      console.log('📊 System Status:');
      console.log('─'.repeat(50));
      const statusIcon =
        result.status === 'healthy'
          ? '🟢'
          : result.status === 'degraded'
            ? '🟡'
            : '🔴';
      console.log(
        `${statusIcon} Overall Status: ${result.status.toUpperCase()}`,
      );
      if (result.success && result.details) {
        console.log(
          `✅ Tracker Initialized: ${result.details.trackerInitialized ? 'Yes' : 'No'}`,
        );
        console.log(
          `📊 Data Available: ${result.details.dataAvailable ? 'Yes' : 'No'}`,
        );
        console.log(
          `🤖 Models Trained: ${result.details.modelsTrained ? 'Yes' : 'No'}`,
        );
        if (result.details.lastUpdate) {
          const lastUpdate = new Date(
            result.details.lastUpdate,
          ).toLocaleString();
          console.log(`⏰ Last Update: ${lastUpdate}`);
        }
      }
      if (result.error) {
        console.log(`❌ Error: ${result.error}`);
      }
      // Display cache statistics
      const cacheStats = mlBudgetAPI.getCacheStats();
      console.log('\n🗄️  Cache Statistics:');
      console.log('─'.repeat(50));
      console.log(`📦 Active Trackers: ${cacheStats.trackerCount}`);
      console.log(`💾 Memory Usage: ${cacheStats.memoryUsage}`);
    } catch (error) {
      console.error('❌ Error performing health check:', error);
    }
  }
  // Helper methods
  displayRecommendationCategory(title, recommendations) {
    if (recommendations.length > 0) {
      console.log(`\n${title}:`);
      console.log('─'.repeat(50));
      for (const rec of recommendations) {
        const icon = this.getRecommendationIcon(rec.type, rec.priority);
        console.log(`${icon} [${rec.impact.toUpperCase()}] ${rec.message}`);
        if (rec.suggestedAction) {
          console.log(`   💡 Action: ${rec.suggestedAction}`);
        }
      }
    }
  }
  getRecommendationIcon(type, priority) {
    if (priority === 'high') {
      return type === 'alert' ? '🚨' : type === 'optimization' ? '🔧' : '⚙️';
    } else if (priority === 'medium') {
      return type === 'alert' ? '⚠️' : type === 'optimization' ? '🔧' : '⚙️';
    } else {
      return type === 'alert' ? 'ℹ️' : type === 'optimization' ? '💡' : '📋';
    }
  }
  getPerformanceIcon(performance) {
    switch (performance) {
      case 'excellent':
        return '🟢';
      case 'good':
        return '🟡';
      case 'fair':
        return '🟠';
      case 'poor':
        return '🔴';
      default:
        return '⚪';
    }
  }
}
/**
 * Factory function to create CLI instance
 */
export function createMLBudgetCLI(projectRoot, settings) {
  return new MLBudgetCLI(projectRoot, settings);
}
/**
 * Command-line interface functions for direct usage
 */
export const mlBudgetCLI = {
  /**
   * Display budget forecast
   */
  forecast: async (hours, projectRoot, settings) => {
    const cli = new MLBudgetCLI(projectRoot, settings);
    await cli.forecast(hours);
  },
  /**
   * Display optimization suggestions
   */
  optimize: async (projectRoot, settings) => {
    const cli = new MLBudgetCLI(projectRoot, settings);
    await cli.optimize();
  },
  /**
   * Display anomaly detection results
   */
  anomalies: async (projectRoot, settings) => {
    const cli = new MLBudgetCLI(projectRoot, settings);
    await cli.anomalies();
  },
  /**
   * Display ML model metrics
   */
  metrics: async (projectRoot, settings) => {
    const cli = new MLBudgetCLI(projectRoot, settings);
    await cli.metrics();
  },
  /**
   * Display usage statistics
   */
  stats: async (projectRoot, settings) => {
    const cli = new MLBudgetCLI(projectRoot, settings);
    await cli.stats();
  },
  /**
   * Perform health check
   */
  health: async (projectRoot, settings) => {
    const cli = new MLBudgetCLI(projectRoot, settings);
    await cli.health();
  },
};
// Export for programmatic usage
export default MLBudgetCLI;
//# sourceMappingURL=ml-budget-cli.js.map
