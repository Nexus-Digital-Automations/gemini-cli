/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Advanced alert trigger system with sophisticated escalation and custom rules
 * Provides intelligent alerting with dynamic thresholds and contextual triggers
 */
export class AlertTriggerEngine {
  static logger = console; // Will be replaced with proper logger
  static escalationRules = new Map();
  static alertHistory = new Map();
  /**
   * Evaluate all configured triggers against current data
   */
  static evaluateAllTriggers(
    costData,
    alertConfigs,
    currentBudget,
    projection,
    variance,
  ) {
    const startTime = Date.now();
    this.logger.info('Evaluating all alert triggers', {
      costData: costData.length,
      alertConfigs: alertConfigs.length,
      budget: currentBudget,
    });
    try {
      const results = [];
      for (const config of alertConfigs) {
        const result = this.evaluateTrigger(
          config,
          costData,
          currentBudget,
          projection,
          variance,
        );
        results.push(result);
      }
      // Evaluate composite triggers
      const compositeTriggers = this.evaluateCompositeTriggers(
        results,
        costData,
        currentBudget,
        projection,
        variance,
      );
      results.push(...compositeTriggers);
      this.logger.info('All triggers evaluated', {
        duration: Date.now() - startTime,
        totalTriggers: results.length,
        triggeredAlerts: results.filter((r) => r.triggered).length,
      });
      return results;
    } catch (error) {
      this.logger.error('Failed to evaluate triggers', {
        error: error.message,
      });
      return [];
    }
  }
  /**
   * Evaluate a single trigger configuration
   */
  static evaluateTrigger(
    config,
    costData,
    currentBudget,
    projection,
    variance,
  ) {
    try {
      let currentValue = 0;
      let confidence = 0.8;
      const context = {};
      // Calculate current value based on threshold type
      switch (config.threshold.type) {
        case 'percentage':
          currentValue = (currentBudget.used / currentBudget.total) * 100;
          context.budgetUtilization = currentValue;
          break;
        case 'absolute':
          currentValue = currentBudget.used;
          context.absoluteSpending = currentValue;
          break;
        case 'rate':
          currentValue = this.calculateCurrentBurnRate(costData);
          confidence = costData.length > 7 ? 0.9 : 0.6;
          context.burnRate = currentValue;
          break;
        case 'projection':
          if (projection) {
            currentValue = projection.summary.budgetRunwayDays;
            confidence = projection.metadata.dataQualityScore;
            context.projectedRunway = currentValue;
          }
          break;
        default:
          // Handle unexpected values
          break;
      }
      // Apply dynamic threshold adjustments
      const adjustedThreshold = this.applyDynamicThresholdAdjustments(
        config.threshold.value,
        config.threshold.type,
        costData,
        variance,
      );
      // Evaluate threshold condition
      const triggered = this.evaluateThresholdCondition(
        currentValue,
        adjustedThreshold,
        config.threshold.operator,
      );
      // Apply temporal conditions
      const temporallyTriggered = this.applyTemporalConditions(
        triggered,
        config,
        costData,
      );
      return {
        triggerId: config.id,
        triggered: temporallyTriggered,
        severity: config.severity,
        value: currentValue,
        threshold: adjustedThreshold,
        confidence,
        context,
      };
    } catch (error) {
      this.logger.error('Failed to evaluate single trigger', {
        configId: config.id,
        error: error.message,
      });
      return {
        triggerId: config.id,
        triggered: false,
        severity: config.severity,
        value: 0,
        threshold: config.threshold.value,
        confidence: 0,
        context: { error: error.message },
      };
    }
  }
  /**
   * Evaluate composite triggers that depend on multiple conditions
   */
  static evaluateCompositeTriggers(
    basicResults,
    costData,
    currentBudget,
    projection,
    variance,
  ) {
    const compositeResults = [];
    // Budget exhaustion composite trigger
    const budgetTriggers = basicResults.filter(
      (r) =>
        r.triggerId.includes('budget') || r.triggerId.includes('percentage'),
    );
    const rateTriggers = basicResults.filter(
      (r) => r.triggerId.includes('rate') || r.triggerId.includes('burn'),
    );
    if (
      budgetTriggers.some((t) => t.triggered) &&
      rateTriggers.some((t) => t.triggered)
    ) {
      compositeResults.push({
        triggerId: 'composite_budget_exhaustion_risk',
        triggered: true,
        severity: 'critical',
        value: (currentBudget.used / currentBudget.total) * 100,
        threshold: 80,
        confidence: 0.95,
        context: {
          type: 'composite',
          description: 'High budget usage combined with high burn rate',
          triggeredAlerts: [...budgetTriggers, ...rateTriggers].map(
            (t) => t.triggerId,
          ),
        },
      });
    }
    // Cost spike cascade trigger
    if (variance && variance.summary.significantVariances > 0) {
      const recentSpikes = variance.variances.filter(
        (v) =>
          v.varianceType === 'spike' &&
          v.dataPoint.timestamp.getTime() > Date.now() - 24 * 60 * 60 * 1000,
      );
      if (recentSpikes.length >= 3) {
        compositeResults.push({
          triggerId: 'composite_cost_spike_cascade',
          triggered: true,
          severity: 'warning',
          value: recentSpikes.length,
          threshold: 3,
          confidence: 0.9,
          context: {
            type: 'composite',
            description: 'Multiple cost spikes detected within 24 hours',
            spikes: recentSpikes.length,
            maxSpikeValue: Math.max(
              ...recentSpikes.map((s) => s.varianceScore),
            ),
          },
        });
      }
    }
    // Trend deterioration trigger
    if (projection && projection.summary.burnRatePerDay > 0) {
      const projectedOverrun =
        currentBudget.used +
        projection.summary.totalProjectedCost -
        currentBudget.total;
      if (projectedOverrun > 0) {
        compositeResults.push({
          triggerId: 'composite_projected_overrun',
          triggered: true,
          severity: 'critical',
          value: projectedOverrun,
          threshold: 0,
          confidence: projection.metadata.dataQualityScore,
          context: {
            type: 'composite',
            description: 'Projected to exceed budget based on current trends',
            projectedOverrun,
            daysToOverrun: projection.summary.budgetRunwayDays,
          },
        });
      }
    }
    return compositeResults;
  }
  /**
   * Process escalation rules for active alerts
   */
  static processEscalationRules(activeAlerts) {
    const startTime = Date.now();
    this.logger.info('Processing escalation rules', {
      activeAlerts: activeAlerts.length,
    });
    try {
      const escalatedAlerts = [];
      for (const alert of activeAlerts) {
        const escalationRule = this.findApplicableEscalationRule(alert);
        if (escalationRule && this.shouldEscalate(alert, escalationRule)) {
          const escalatedAlert = this.applyEscalation(alert, escalationRule);
          escalatedAlerts.push(escalatedAlert);
        }
      }
      this.logger.info('Escalation rules processed', {
        duration: Date.now() - startTime,
        escalatedAlerts: escalatedAlerts.length,
      });
      return escalatedAlerts;
    } catch (error) {
      this.logger.error('Failed to process escalation rules', {
        error: error.message,
      });
      return [];
    }
  }
  /**
   * Register custom escalation rule
   */
  static registerEscalationRule(rule) {
    this.escalationRules.set(rule.id, rule);
    this.logger.info('Escalation rule registered', { ruleId: rule.id });
  }
  /**
   * Create intelligent trigger configurations based on usage patterns
   */
  static createIntelligentTriggers(costData, currentBudget, variance) {
    const triggers = [];
    let triggerId = 0;
    // Adaptive budget percentage triggers
    const utilizationPercentage =
      (currentBudget.used / currentBudget.total) * 100;
    const remainingPercentage = 100 - utilizationPercentage;
    // Create staged percentage alerts based on remaining budget
    if (remainingPercentage > 30) {
      triggers.push({
        id: `intelligent_budget_${++triggerId}`,
        name: 'Intelligent Budget Alert - 70%',
        description: 'Budget utilization reached 70%',
        threshold: {
          type: 'percentage',
          value: 70,
          operator: 'greater_than_or_equal',
          timeWindow: 'daily',
        },
        severity: 'info',
        channels: ['console'],
        suppression: { cooldownMinutes: 240, maxAlertsPerHour: 1 },
      });
    }
    if (remainingPercentage > 15) {
      triggers.push({
        id: `intelligent_budget_${++triggerId}`,
        name: 'Intelligent Budget Alert - 85%',
        description: 'Budget utilization reached 85%',
        threshold: {
          type: 'percentage',
          value: 85,
          operator: 'greater_than_or_equal',
          timeWindow: 'daily',
        },
        severity: 'warning',
        channels: ['console', 'email'],
        suppression: { cooldownMinutes: 120, maxAlertsPerHour: 2 },
      });
    }
    // Adaptive burn rate trigger
    const currentBurnRate = this.calculateCurrentBurnRate(costData);
    if (currentBurnRate > 0) {
      const daysRemaining = currentBudget.remaining / currentBurnRate;
      const criticalBurnRate = currentBudget.remaining / 7; // 7 days remaining at this rate
      if (daysRemaining > 7) {
        triggers.push({
          id: `intelligent_burn_rate_${++triggerId}`,
          name: 'Intelligent Burn Rate Alert',
          description: 'High burn rate detected',
          threshold: {
            type: 'rate',
            value: criticalBurnRate,
            operator: 'greater_than',
            timeWindow: 'daily',
          },
          severity: 'warning',
          channels: ['console', 'email'],
          suppression: { cooldownMinutes: 360, maxAlertsPerHour: 1 },
        });
      }
    }
    // Variance-based triggers
    if (variance && variance.summary.averageVarianceScore > 0.3) {
      const baselineVariance = variance.summary.averageVarianceScore * 1.5;
      triggers.push({
        id: `intelligent_variance_${++triggerId}`,
        name: 'Intelligent Cost Variance Alert',
        description: 'Unusual cost pattern detected',
        threshold: {
          type: 'absolute', // Will be overridden in evaluation
          value: baselineVariance,
          operator: 'greater_than',
          timeWindow: 'rolling_24h',
        },
        severity: 'info',
        channels: ['console'],
        suppression: { cooldownMinutes: 480, maxAlertsPerHour: 1 },
      });
    }
    // Runway-based triggers
    if (costData.length >= 7) {
      triggers.push({
        id: `intelligent_runway_${++triggerId}`,
        name: 'Intelligent Budget Runway Alert',
        description: 'Budget runway approaching critical threshold',
        threshold: {
          type: 'projection',
          value: 14, // 14 days
          operator: 'less_than_or_equal',
          timeWindow: 'daily',
        },
        severity: 'critical',
        channels: ['console', 'email', 'slack'],
        escalation: {
          escalateAfterMinutes: 60,
          escalatedSeverity: 'emergency',
          escalatedChannels: ['console', 'email', 'slack', 'sms'],
        },
        suppression: { cooldownMinutes: 180, maxAlertsPerHour: 2 },
      });
    }
    this.logger.info('Intelligent triggers created', {
      triggers: triggers.length,
      utilizationPercentage: utilizationPercentage.toFixed(1),
      currentBurnRate: currentBurnRate.toFixed(2),
    });
    return triggers;
  }
  // Private helper methods
  static calculateCurrentBurnRate(costData) {
    if (costData.length === 0) return 0;
    const sortedData = [...costData].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );
    // Use last 24 hours if available, otherwise use all data
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentData = sortedData.filter(
      (point) => point.timestamp >= cutoffTime,
    );
    const dataToAnalyze = recentData.length >= 3 ? recentData : sortedData;
    if (dataToAnalyze.length === 0) return 0;
    const totalCost = dataToAnalyze.reduce((sum, point) => sum + point.cost, 0);
    const timeSpanHours =
      (dataToAnalyze[dataToAnalyze.length - 1].timestamp.getTime() -
        dataToAnalyze[0].timestamp.getTime()) /
      (60 * 60 * 1000);
    return timeSpanHours > 0 ? (totalCost / timeSpanHours) * 24 : 0; // Convert to daily rate
  }
  static applyDynamicThresholdAdjustments(
    baseThreshold,
    thresholdType,
    costData,
    variance,
  ) {
    let adjustedThreshold = baseThreshold;
    // Adjust based on data quality and variance
    if (variance) {
      const volatility = variance.summary.averageVarianceScore;
      if (thresholdType === 'rate' && volatility > 0.5) {
        // Lower burn rate threshold when costs are volatile
        adjustedThreshold *= 0.9;
      } else if (thresholdType === 'percentage' && volatility > 0.7) {
        // Lower budget percentage threshold when spending is erratic
        adjustedThreshold *= 0.95;
      }
    }
    // Adjust based on data recency
    if (costData.length > 0) {
      const sortedData = [...costData].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
      );
      const latestDataAge =
        (Date.now() - sortedData[0].timestamp.getTime()) / (60 * 60 * 1000); // Hours
      if (latestDataAge > 24) {
        // Increase sensitivity when data is old
        if (thresholdType === 'percentage' || thresholdType === 'rate') {
          adjustedThreshold *= 0.9;
        }
      }
    }
    return adjustedThreshold;
  }
  static evaluateThresholdCondition(value, threshold, operator) {
    switch (operator) {
      case 'greater_than':
        return value > threshold;
      case 'less_than':
        return value < threshold;
      case 'equals':
        return Math.abs(value - threshold) < 0.001;
      case 'greater_than_or_equal':
        return value >= threshold;
      case 'less_than_or_equal':
        return value <= threshold;
      default:
        return false;
    }
  }
  static applyTemporalConditions(basicTriggered, config, costData) {
    if (!basicTriggered) return false;
    // Apply time window conditions
    if (config.threshold.timeWindow) {
      const now = new Date();
      let windowStart;
      switch (config.threshold.timeWindow) {
        case 'rolling_24h':
          windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'rolling_7d':
          windowStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'daily':
          windowStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          );
          break;
        case 'weekly':
          const dayOfWeek = now.getDay();
          windowStart = new Date(
            now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000,
          );
          windowStart.setHours(0, 0, 0, 0);
          break;
        case 'monthly':
          windowStart = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          return basicTriggered;
      }
      // Check if we have sufficient data in the time window
      const windowData = costData.filter(
        (point) => point.timestamp >= windowStart,
      );
      if (windowData.length < 2) {
        return false; // Not enough data in window
      }
    }
    return basicTriggered;
  }
  static findApplicableEscalationRule(alert) {
    for (const [ruleId, rule] of this.escalationRules) {
      if (this.isRuleApplicable(alert, rule)) {
        return rule;
      }
    }
    return null;
  }
  static isRuleApplicable(alert, rule) {
    const alertAge = (Date.now() - alert.timestamp.getTime()) / (60 * 1000); // Minutes
    // Check age condition
    if (alertAge < rule.condition.alertAge) {
      return false;
    }
    // Check acknowledgment condition
    if (rule.condition.unacknowledged && alert.status === 'acknowledged') {
      return false;
    }
    // Check severity condition
    const severityLevels = { info: 1, warning: 2, critical: 3, emergency: 4 };
    const alertSeverityLevel = severityLevels[alert.severity];
    const ruleSeverityLevel = severityLevels[rule.condition.severityLevel];
    if (alertSeverityLevel < ruleSeverityLevel) {
      return false;
    }
    // Check consecutive alerts condition
    const history = this.alertHistory.get(alert.alertConfigId) || [];
    const recentAlerts = history.filter(
      (h) =>
        h.timestamp.getTime() >
        Date.now() - rule.condition.alertAge * 60 * 1000,
    );
    if (recentAlerts.length < rule.condition.consecutiveAlerts) {
      return false;
    }
    return true;
  }
  static shouldEscalate(alert, rule) {
    // Additional logic to determine if escalation should actually proceed
    // This could include business hours, notification limits, etc.
    // For now, simple implementation
    return alert.status === 'active';
  }
  static applyEscalation(alert, rule) {
    const escalatedAlert = { ...alert };
    // Apply severity escalation
    if (rule.action.escalateSeverity) {
      escalatedAlert.severity = rule.action.escalateSeverity;
    }
    // Add escalation context
    escalatedAlert.context = {
      ...escalatedAlert.context,
      escalated: true,
      escalationRule: rule.id,
      escalationTime: new Date(),
      originalSeverity: alert.severity,
    };
    // Log escalation
    this.logger.warn('Alert escalated', {
      alertId: alert.id,
      originalSeverity: alert.severity,
      newSeverity: escalatedAlert.severity,
      escalationRule: rule.id,
    });
    return escalatedAlert;
  }
  /**
   * Update alert history for escalation tracking
   */
  static updateAlertHistory(alert) {
    const history = this.alertHistory.get(alert.alertConfigId) || [];
    history.push(alert);
    // Keep only recent history (last 24 hours)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const filteredHistory = history.filter((h) => h.timestamp >= cutoff);
    this.alertHistory.set(alert.alertConfigId, filteredHistory);
  }
  /**
   * Clear old escalation rules and alert history
   */
  static cleanup() {
    // Remove old alert history
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
    for (const [configId, history] of this.alertHistory) {
      const filteredHistory = history.filter((h) => h.timestamp >= cutoff);
      if (filteredHistory.length === 0) {
        this.alertHistory.delete(configId);
      } else {
        this.alertHistory.set(configId, filteredHistory);
      }
    }
    this.logger.info('Alert trigger engine cleanup completed');
  }
}
//# sourceMappingURL=alert-trigger-engine.js.map
