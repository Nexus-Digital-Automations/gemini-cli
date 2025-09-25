/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  BudgetAlertConfig,
  BudgetAlert,
  CostDataPoint,
  CostProjection,
  VarianceDetection,
  TrendAnalysis,
} from '../types.js';
import { MathematicalAlgorithms } from '../algorithms/mathematical-algorithms.js';
import { CostForecastingEngine } from '../forecasting/cost-forecasting-engine.js';

/**
 * Alert suppression tracking
 */
interface AlertSuppression {
  configId: string;
  lastAlertTime: Date;
  alertCountInLastHour: number;
  hourWindowStart: Date;
}

/**
 * Comprehensive budget alert system with threshold monitoring and proactive alerting
 * Provides intelligent alerting with escalation, suppression, and contextual recommendations
 */
export class BudgetAlertSystem {
  private static readonly logger = console; // Will be replaced with proper logger
  private static alertSuppressions = new Map<string, AlertSuppression>();
  private static activeAlerts = new Map<string, BudgetAlert>();

  /**
   * Monitor cost data and trigger alerts based on configured thresholds
   */
  static async monitorAndAlert(
    costData: CostDataPoint[],
    alertConfigs: BudgetAlertConfig[],
    currentBudget: {
      total: number;
      used: number;
      remaining: number;
    },
  ): Promise<BudgetAlert[]> {
    const startTime = Date.now();
    this.logger.info('Monitoring cost data for alerts', {
      dataPoints: costData.length,
      alertConfigs: alertConfigs.length,
      currentBudget,
    });

    try {
      const triggeredAlerts: BudgetAlert[] = [];

      // Analyze current cost data
      const recentTrend = MathematicalAlgorithms.performTrendAnalysis(costData);
      const varianceDetection =
        MathematicalAlgorithms.detectVariances(costData);
      const costProjection = await CostForecastingEngine.generateProjections(
        costData,
        30,
      );

      // Process each alert configuration
      for (const config of alertConfigs) {
        const alert = await this.evaluateAlertCondition(
          config,
          costData,
          currentBudget,
          recentTrend,
          varianceDetection,
          costProjection,
        );

        if (alert && this.shouldTriggerAlert(config, alert)) {
          triggeredAlerts.push(alert);
          this.activeAlerts.set(alert.id, alert);
          this.updateAlertSuppression(config.id);
        }
      }

      this.logger.info('Alert monitoring completed', {
        duration: Date.now() - startTime,
        triggeredAlerts: triggeredAlerts.length,
      });

      return triggeredAlerts;
    } catch (error) {
      this.logger.error('Failed to monitor and alert', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Evaluate specific alert condition
   */
  private static async evaluateAlertCondition(
    config: BudgetAlertConfig,
    costData: CostDataPoint[],
    currentBudget: { total: number; used: number; remaining: number },
    recentTrend: TrendAnalysis,
    varianceDetection: VarianceDetection,
    costProjection: CostProjection,
  ): Promise<BudgetAlert | null> {
    const startTime = Date.now();

    try {
      let currentValue = 0;
      let thresholdMet = false;

      // Calculate current value based on threshold type
      switch (config.threshold.type) {
        case 'percentage':
          currentValue = (currentBudget.used / currentBudget.total) * 100;
          break;

        case 'absolute':
          currentValue = currentBudget.used;
          break;

        case 'rate':
          // Daily burn rate
          const burnRate = this.calculateCurrentBurnRate(costData);
          currentValue = burnRate;
          break;

        case 'projection':
          // Projected budget exhaustion in days
          const projectedExhaustionDays =
            costProjection.summary.budgetRunwayDays;
          currentValue = projectedExhaustionDays;
          break;

        default:
          this.logger.error('Unknown threshold type', {
            type: config.threshold.type,
          });
          return null;
      }

      // Evaluate threshold condition
      switch (config.threshold.operator) {
        case 'greater_than':
          thresholdMet = currentValue > config.threshold.value;
          break;
        case 'less_than':
          thresholdMet = currentValue < config.threshold.value;
          break;
        case 'equals':
          thresholdMet =
            Math.abs(currentValue - config.threshold.value) < 0.001;
          break;
        case 'greater_than_or_equal':
          thresholdMet = currentValue >= config.threshold.value;
          break;
        case 'less_than_or_equal':
          thresholdMet = currentValue <= config.threshold.value;
          break;
      }

      if (!thresholdMet) {
        return null;
      }

      // Generate alert
      const alert = this.createAlert(
        config,
        currentValue,
        currentBudget,
        recentTrend,
        varianceDetection,
        costProjection,
      );

      this.logger.info('Alert condition evaluated', {
        duration: Date.now() - startTime,
        configId: config.id,
        currentValue: currentValue.toFixed(4),
        thresholdMet,
      });

      return alert;
    } catch (error) {
      this.logger.error('Failed to evaluate alert condition', {
        configId: config.id,
        error: error.message,
      });
      return null;
        default:
          // Handle unexpected values
          break;
    }
  }

  /**
   * Create alert with comprehensive context and recommendations
   */
  private static createAlert(
    config: BudgetAlertConfig,
    currentValue: number,
    currentBudget: { total: number; used: number; remaining: number },
    recentTrend: TrendAnalysis,
    varianceDetection: VarianceDetection,
    costProjection: CostProjection,
  ): BudgetAlert {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const thresholdPercentage = (currentValue / config.threshold.value) * 100;

    // Generate contextual message
    const { title, message } = this.generateAlertMessage(
      config,
      currentValue,
      thresholdPercentage,
    );

    // Calculate projected impact
    const projectedImpact = this.calculateProjectedImpact(
      currentBudget,
      costProjection,
      config.threshold.type,
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      config,
      currentValue,
      currentBudget,
      recentTrend,
      varianceDetection,
      costProjection,
    );

    return {
      id: alertId,
      alertConfigId: config.id,
      timestamp: new Date(),
      severity: config.severity,
      title,
      message,
      triggerData: {
        currentValue,
        threshold: config.threshold.value,
        thresholdPercentage,
        relatedProjection: costProjection,
      },
      context: {
        budget: {
          total: currentBudget.total,
          used: currentBudget.used,
          remaining: currentBudget.remaining,
          percentageUsed: (currentBudget.used / currentBudget.total) * 100,
        },
        recentTrend,
        projectedImpact,
      },
      recommendations,
      status: 'active',
    };
  }

  /**
   * Generate contextual alert messages
   */
  private static generateAlertMessage(
    config: BudgetAlertConfig,
    currentValue: number,
    thresholdPercentage: number,
  ): { title: string; message: string } {
    const formatValue = (value: number, type: string): string => {
      switch (type) {
        case 'percentage':
          return `${value.toFixed(1)}%`;
        case 'absolute':
          return `$${value.toFixed(2)}`;
        case 'rate':
          return `$${value.toFixed(2)}/day`;
        case 'projection':
          return `${Math.floor(value)} days`;
        default:
          return value.toFixed(2);
      }
    };

    const formattedCurrentValue = formatValue(
      currentValue,
      config.threshold.type,
    );
    const formattedThreshold = formatValue(
      config.threshold.value,
      config.threshold.type,
    );

    let title: string;
    let message: string;

    switch (config.threshold.type) {
      case 'percentage':
        title = `Budget Usage Alert: ${formattedCurrentValue} of budget consumed`;
        message = `Your budget usage has ${config.threshold.operator.replace('_', ' ')} the configured threshold of ${formattedThreshold}. Current usage: ${formattedCurrentValue} (${thresholdPercentage.toFixed(1)}% of threshold).`;
        break;

      case 'absolute':
        title = `Budget Spending Alert: $${currentValue.toFixed(2)} spent`;
        message = `Absolute spending has ${config.threshold.operator.replace('_', ' ')} the threshold of ${formattedThreshold}. Current spending: ${formattedCurrentValue}.`;
        break;

      case 'rate':
        title = `Burn Rate Alert: High daily spending detected`;
        message = `Daily burn rate has ${config.threshold.operator.replace('_', ' ')} the threshold of ${formattedThreshold}. Current burn rate: ${formattedCurrentValue}.`;
        break;

      case 'projection':
        title = `Budget Runway Alert: ${Math.floor(currentValue)} days remaining`;
        message = `Projected budget exhaustion is ${config.threshold.operator.replace('_', ' ')} ${formattedThreshold}. Estimated runway: ${formattedCurrentValue}.`;
        break;

      default:
        title = `${config.name}: Threshold exceeded`;
        message = `${config.description} Current value: ${formattedCurrentValue}, Threshold: ${formattedThreshold}`;
    }

    return { title, message };
  }

  /**
   * Calculate projected impact of current trends
   */
  private static calculateProjectedImpact(
    currentBudget: { total: number; used: number; remaining: number },
    costProjection: CostProjection,
    thresholdType: string,
  ): { estimatedOverage: number; daysUntilBudgetExhaustion: number } {
    const projectedTotalCost = costProjection.summary.totalProjectedCost;
    const estimatedOverage = Math.max(
      0,
      currentBudget.used + projectedTotalCost - currentBudget.total,
    );

    let daysUntilBudgetExhaustion = Infinity;
    if (costProjection.summary.burnRatePerDay > 0) {
      daysUntilBudgetExhaustion =
        currentBudget.remaining / costProjection.summary.burnRatePerDay;
    }

    return {
      estimatedOverage,
      daysUntilBudgetExhaustion: Math.floor(daysUntilBudgetExhaustion),
    };
  }

  /**
   * Generate contextual recommendations based on alert conditions
   */
  private static generateRecommendations(
    config: BudgetAlertConfig,
    currentValue: number,
    currentBudget: { total: number; used: number; remaining: number },
    recentTrend: TrendAnalysis,
    varianceDetection: VarianceDetection,
    costProjection: CostProjection,
  ): BudgetAlert['recommendations'] {
    const recommendations: BudgetAlert['recommendations'] = [];

    // Budget-specific recommendations
    const usagePercentage = (currentBudget.used / currentBudget.total) * 100;

    if (usagePercentage > 80) {
      recommendations.push({
        action: 'Implement immediate cost controls and review usage patterns',
        impact: 'Prevent budget overrun and optimize remaining funds',
        urgency: 'critical',
      });
    }

    if (usagePercentage > 60) {
      recommendations.push({
        action: 'Review and prioritize essential vs. non-essential features',
        impact: 'Focus spending on high-value activities',
        urgency: 'high',
      });
    }

    // Trend-based recommendations
    if (
      recentTrend.direction === 'increasing' &&
      recentTrend.confidence > 0.7
    ) {
      recommendations.push({
        action:
          'Investigate the cause of increasing costs and implement optimization strategies',
        impact: 'Reduce cost acceleration and extend budget runway',
        urgency: recentTrend.slope > 1 ? 'critical' : 'high',
      });
    }

    // Variance-based recommendations
    if (varianceDetection.summary.significantVariances > 0) {
      recommendations.push({
        action:
          'Investigate cost spikes and implement monitoring for unusual usage patterns',
        impact: 'Prevent unexpected cost surges and improve predictability',
        urgency:
          varianceDetection.summary.maxVarianceScore > 0.8 ? 'high' : 'medium',
      });
    }

    // Projection-based recommendations
    const runwayDays = costProjection.summary.budgetRunwayDays;
    if (runwayDays < 30) {
      recommendations.push({
        action: 'Extend budget or implement immediate cost reduction measures',
        impact: 'Prevent service disruption due to budget exhaustion',
        urgency: runwayDays < 7 ? 'critical' : 'high',
      });
    }

    // Burn rate recommendations
    if (config.threshold.type === 'rate') {
      recommendations.push({
        action: 'Implement rate limiting and optimize high-cost operations',
        impact: 'Reduce daily spending and extend budget lifecycle',
        urgency:
          currentValue > config.threshold.value * 2 ? 'critical' : 'medium',
      });
    }

    // Default recommendations if none generated
    if (recommendations.length === 0) {
      recommendations.push({
        action: 'Monitor usage patterns and consider budget optimization',
        impact: 'Maintain cost visibility and prevent future issues',
        urgency: 'low',
      });
    }

    return recommendations;
  }

  /**
   * Check if alert should be triggered based on suppression rules
   */
  private static shouldTriggerAlert(
    config: BudgetAlertConfig,
    alert: BudgetAlert,
  ): boolean {
    const suppression = this.alertSuppressions.get(config.id);
    const now = new Date();

    if (!suppression) {
      // No previous alerts, trigger this one
      return true;
    }

    // Check cooldown period
    const minutesSinceLastAlert =
      (now.getTime() - suppression.lastAlertTime.getTime()) / (60 * 1000);
    if (minutesSinceLastAlert < config.suppression.cooldownMinutes) {
      this.logger.info('Alert suppressed due to cooldown', {
        configId: config.id,
        minutesSinceLastAlert: minutesSinceLastAlert.toFixed(1),
        cooldownMinutes: config.suppression.cooldownMinutes,
      });
      return false;
    }

    // Check hourly rate limit
    const hoursElapsed =
      (now.getTime() - suppression.hourWindowStart.getTime()) /
      (60 * 60 * 1000);
    if (hoursElapsed >= 1) {
      // Reset hourly window
      suppression.hourWindowStart = now;
      suppression.alertCountInLastHour = 0;
    }

    if (
      suppression.alertCountInLastHour >= config.suppression.maxAlertsPerHour
    ) {
      this.logger.info('Alert suppressed due to rate limit', {
        configId: config.id,
        alertCountInLastHour: suppression.alertCountInLastHour,
        maxAlertsPerHour: config.suppression.maxAlertsPerHour,
      });
      return false;
    }

    return true;
  }

  /**
   * Update alert suppression tracking
   */
  private static updateAlertSuppression(configId: string): void {
    const now = new Date();
    const suppression = this.alertSuppressions.get(configId);

    if (!suppression) {
      this.alertSuppressions.set(configId, {
        configId,
        lastAlertTime: now,
        alertCountInLastHour: 1,
        hourWindowStart: now,
      });
    } else {
      suppression.lastAlertTime = now;
      suppression.alertCountInLastHour += 1;
    }
  }

  /**
   * Calculate current burn rate from recent data
   */
  private static calculateCurrentBurnRate(costData: CostDataPoint[]): number {
    if (costData.length === 0) return 0;

    const sortedData = [...costData].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );

    // Use last 24 hours of data if available
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentData = sortedData.filter(
      (point) => point.timestamp >= oneDayAgo,
    );

    if (recentData.length === 0) {
      // Fallback to all data
      const totalCost = sortedData.reduce((sum, point) => sum + point.cost, 0);
      const timeSpanDays =
        (sortedData[sortedData.length - 1].timestamp.getTime() -
          sortedData[0].timestamp.getTime()) /
        (24 * 60 * 60 * 1000);
      return timeSpanDays > 0 ? totalCost / timeSpanDays : 0;
    }

    // Calculate burn rate from recent data
    const totalRecentCost = recentData.reduce(
      (sum, point) => sum + point.cost,
      0,
    );
    const timeSpanHours =
      (recentData[recentData.length - 1].timestamp.getTime() -
        recentData[0].timestamp.getTime()) /
      (60 * 60 * 1000);
    const dailyBurnRate =
      timeSpanHours > 0 ? (totalRecentCost / timeSpanHours) * 24 : 0;

    return dailyBurnRate;
  }

  /**
   * Get all active alerts
   */
  static getActiveAlerts(): BudgetAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Acknowledge an alert
   */
  static acknowledgeAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.status = 'acknowledged';
      alert.acknowledgedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Resolve an alert
   */
  static resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.status = 'resolved';
      alert.resolvedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Clean up old suppression records
   */
  static cleanupSuppressions(): void {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    this.alertSuppressions.forEach((suppression, configId) => {
      const age = now.getTime() - suppression.lastAlertTime.getTime();
      if (age > maxAge) {
        this.alertSuppressions.delete(configId);
      }
    });
  }

  /**
   * Create default alert configurations for common scenarios
   */
  static createDefaultAlertConfigs(): BudgetAlertConfig[] {
    return [
      {
        id: 'budget_warning_80',
        name: 'Budget Warning - 80%',
        description: 'Alert when 80% of budget is consumed',
        threshold: {
          type: 'percentage',
          value: 80,
          operator: 'greater_than_or_equal',
          timeWindow: 'daily',
        },
        severity: 'warning',
        channels: ['console', 'email'],
        suppression: {
          cooldownMinutes: 60,
          maxAlertsPerHour: 2,
        },
      },
      {
        id: 'budget_critical_95',
        name: 'Budget Critical - 95%',
        description: 'Critical alert when 95% of budget is consumed',
        threshold: {
          type: 'percentage',
          value: 95,
          operator: 'greater_than_or_equal',
          timeWindow: 'daily',
        },
        severity: 'critical',
        channels: ['console', 'email', 'slack'],
        escalation: {
          escalateAfterMinutes: 30,
          escalatedSeverity: 'emergency',
          escalatedChannels: ['console', 'email', 'slack', 'webhook'],
        },
        suppression: {
          cooldownMinutes: 30,
          maxAlertsPerHour: 4,
        },
      },
      {
        id: 'high_burn_rate',
        name: 'High Burn Rate',
        description: 'Alert when daily burn rate exceeds threshold',
        threshold: {
          type: 'rate',
          value: 50, // $50 per day
          operator: 'greater_than',
          timeWindow: 'daily',
        },
        severity: 'warning',
        channels: ['console', 'email'],
        suppression: {
          cooldownMinutes: 120,
          maxAlertsPerHour: 1,
        },
      },
      {
        id: 'budget_runway_warning',
        name: 'Budget Runway Warning',
        description: 'Alert when projected budget exhaustion is within 7 days',
        threshold: {
          type: 'projection',
          value: 7,
          operator: 'less_than_or_equal',
          timeWindow: 'daily',
        },
        severity: 'critical',
        channels: ['console', 'email', 'slack'],
        suppression: {
          cooldownMinutes: 240,
          maxAlertsPerHour: 1,
        },
      },
    ];
  }
}
