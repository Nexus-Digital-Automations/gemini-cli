/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { BudgetEnforcementLevel, NotificationFrequency } from '../types.js';

/**
 * Budget utilities class with comprehensive helper functions
 */
export class BudgetUtils {
  /**
   * Format currency amount with proper localization
   * @param amount - Amount to format
   * @param options - Formatting options
   * @returns Formatted currency string
   */
  static formatCurrency(amount, options = { currency: 'USD' }) {
    const formatter = new Intl.NumberFormat(options.locale || 'en-US', {
      style: 'currency',
      currency: options.currency,
      minimumFractionDigits: options.minimumFractionDigits ?? 2,
      maximumFractionDigits: options.maximumFractionDigits ?? 4,
    });
    return formatter.format(amount);
  }
  /**
   * Format large numbers with appropriate units (K, M, B)
   * @param value - Number to format
   * @param decimals - Number of decimal places
   * @returns Formatted number string
   */
  static formatLargeNumber(value, decimals = 1) {
    if (value < 1000) {
      return value.toString();
    }
    const units = ['', 'K', 'M', 'B', 'T'];
    const unitIndex = Math.floor(Math.log10(Math.abs(value)) / 3);
    const scaledValue = value / Math.pow(1000, unitIndex);
    return `${scaledValue.toFixed(decimals)}${units[unitIndex]}`;
  }
  /**
   * Calculate percentage with safe division
   * @param value - Current value
   * @param total - Total value
   * @param decimals - Decimal places
   * @returns Percentage value
   */
  static calculatePercentage(value, total, decimals = 1) {
    if (total === 0) return 0;
    return Number(((value / total) * 100).toFixed(decimals));
  }
  /**
   * Format time duration in human-readable format
   * @param milliseconds - Duration in milliseconds
   * @returns Human-readable duration string
   */
  static formatDuration(milliseconds) {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    }
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }
  /**
   * Calculate usage statistics from historical data
   * @param data - Array of historical data points
   * @returns Usage statistics summary
   */
  static calculateUsageStats(data) {
    if (data.length === 0) {
      return {
        totalCost: 0,
        totalRequests: 0,
        totalTokens: 0,
        avgCostPerRequest: 0,
        avgTokensPerRequest: 0,
        trend: 'stable',
        period: {
          start: new Date(),
          end: new Date(),
          duration: 0,
        },
      };
    }
    // Sort data by timestamp
    const sortedData = [...data].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    const totalCost = sortedData.reduce((sum, point) => sum + point.cost, 0);
    const totalRequests = sortedData.reduce(
      (sum, point) => sum + point.requests,
      0,
    );
    const totalTokens = sortedData.reduce(
      (sum, point) => sum + point.tokens,
      0,
    );
    // Calculate averages
    const avgCostPerRequest = totalRequests > 0 ? totalCost / totalRequests : 0;
    const avgTokensPerRequest =
      totalRequests > 0 ? totalTokens / totalRequests : 0;
    // Find most used models
    const modelUsage = new Map();
    for (const point of sortedData) {
      if (point.model) {
        const current = modelUsage.get(point.model) || { cost: 0, requests: 0 };
        current.cost += point.cost;
        current.requests += point.requests;
        modelUsage.set(point.model, current);
      }
    }
    let mostExpensiveModel;
    let mostUsedModel;
    let maxCost = 0;
    let maxRequests = 0;
    for (const [model, usage] of modelUsage) {
      if (usage.cost > maxCost) {
        maxCost = usage.cost;
        mostExpensiveModel = model;
      }
      if (usage.requests > maxRequests) {
        maxRequests = usage.requests;
        mostUsedModel = model;
      }
    }
    // Calculate trend
    const trend = this.calculateTrend(sortedData.map((d) => d.cost));
    // Calculate period
    const startTime = new Date(sortedData[0].timestamp);
    const endTime = new Date(sortedData[sortedData.length - 1].timestamp);
    const duration = endTime.getTime() - startTime.getTime();
    return {
      totalCost,
      totalRequests,
      totalTokens,
      avgCostPerRequest,
      avgTokensPerRequest,
      mostExpensiveModel,
      mostUsedModel,
      trend,
      period: {
        start: startTime,
        end: endTime,
        duration,
      },
    };
  }
  /**
   * Project budget usage based on historical data
   * @param currentUsage - Current usage amount
   * @param historicalData - Historical data points
   * @param targetPeriod - Period to project to (in milliseconds)
   * @returns Budget projection
   */
  static projectBudgetUsage(currentUsage, historicalData, targetPeriod) {
    if (historicalData.length < 2) {
      return {
        currentUsage,
        projectedUsage: currentUsage,
        confidence: 0,
        usageRate: 0,
        recommendations: [
          'Insufficient historical data for accurate projection',
        ],
      };
    }
    // Sort data by timestamp
    const sortedData = [...historicalData].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    // Calculate usage rate (cost per hour)
    const totalDuration =
      new Date(sortedData[sortedData.length - 1].timestamp).getTime() -
      new Date(sortedData[0].timestamp).getTime();
    const totalCostInPeriod =
      sortedData[sortedData.length - 1].cost - sortedData[0].cost;
    const usageRate = totalCostInPeriod / (totalDuration / (1000 * 60 * 60)); // per hour
    // Project usage for target period
    const targetHours = targetPeriod / (1000 * 60 * 60);
    const projectedUsage = currentUsage + usageRate * targetHours;
    // Calculate confidence based on data consistency
    const confidence = this.calculateProjectionConfidence(sortedData);
    const recommendations = [];
    if (confidence < 0.5) {
      recommendations.push(
        'Low confidence projection - usage pattern is inconsistent',
      );
    }
    if (usageRate > 1) {
      // $1/hour seems high
      recommendations.push('High usage rate detected - consider optimization');
    }
    return {
      currentUsage,
      projectedUsage,
      confidence,
      usageRate,
      recommendations,
    };
  }
  /**
   * Merge multiple usage data objects
   * @param usageDataArray - Array of usage data to merge
   * @returns Merged usage data
   */
  static mergeUsageData(usageDataArray) {
    if (usageDataArray.length === 0) {
      throw new Error('Cannot merge empty array of usage data');
    }
    if (usageDataArray.length === 1) {
      return { ...usageDataArray[0] };
    }
    // Use the most recent date and reset time
    const sortedByDate = [...usageDataArray].sort(
      (a, b) =>
        new Date(b.lastResetTime).getTime() -
        new Date(a.lastResetTime).getTime(),
    );
    const merged = {
      date: sortedByDate[0].date,
      lastResetTime: sortedByDate[0].lastResetTime,
      requestCount: 0,
      totalCost: 0,
      tokenUsage: {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        tokenCosts: { input: 0, output: 0 },
      },
      warningsShown: [],
      featureCosts: {},
      sessionUsage: [],
      history: [],
    };
    // Aggregate values
    for (const data of usageDataArray) {
      merged.requestCount += data.requestCount || 0;
      merged.totalCost += data.totalCost || 0;
      // Merge token usage
      if (data.tokenUsage) {
        merged.tokenUsage.inputTokens += data.tokenUsage.inputTokens || 0;
        merged.tokenUsage.outputTokens += data.tokenUsage.outputTokens || 0;
        merged.tokenUsage.totalTokens += data.tokenUsage.totalTokens || 0;
        merged.tokenUsage.tokenCosts.input +=
          data.tokenUsage.tokenCosts?.input || 0;
        merged.tokenUsage.tokenCosts.output +=
          data.tokenUsage.tokenCosts?.output || 0;
      }
      // Merge feature costs
      if (data.featureCosts) {
        for (const [feature, cost] of Object.entries(data.featureCosts)) {
          merged.featureCosts[feature] =
            (merged.featureCosts[feature] || 0) + cost;
        }
      }
      // Merge warnings shown (union)
      if (data.warningsShown) {
        merged.warningsShown = [
          ...new Set([...merged.warningsShown, ...data.warningsShown]),
        ];
      }
      // Merge session usage
      if (data.sessionUsage) {
        merged.sessionUsage.push(...data.sessionUsage);
      }
      // Merge history
      if (data.history) {
        merged.history.push(...data.history);
      }
    }
    // Remove duplicates from session usage and history
    if (merged.sessionUsage) {
      const sessionMap = new Map();
      for (const session of merged.sessionUsage) {
        sessionMap.set(session.sessionId, session);
      }
      merged.sessionUsage = Array.from(sessionMap.values());
    }
    if (merged.history) {
      merged.history = merged.history
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        .slice(0, 1000); // Keep only last 1000 entries
    }
    return merged;
  }
  /**
   * Validate budget settings
   * @param settings - Budget settings to validate
   * @returns Validation result with errors
   */
  static validateBudgetSettings(settings) {
    const errors = [];
    const warnings = [];
    // Check daily limit
    if (settings.dailyLimit !== undefined) {
      if (settings.dailyLimit < 0) {
        errors.push('Daily limit cannot be negative');
      } else if (settings.dailyLimit === 0 && settings.enabled) {
        warnings.push('Daily limit is zero while budget tracking is enabled');
      }
    }
    // Check weekly limit
    if (settings.weeklyLimit !== undefined && settings.weeklyLimit < 0) {
      errors.push('Weekly limit cannot be negative');
    }
    // Check monthly limit
    if (settings.monthlyLimit !== undefined && settings.monthlyLimit < 0) {
      errors.push('Monthly limit cannot be negative');
    }
    // Check limit hierarchy
    if (
      settings.dailyLimit &&
      settings.weeklyLimit &&
      settings.dailyLimit > settings.weeklyLimit
    ) {
      warnings.push('Daily limit exceeds weekly limit');
    }
    if (
      settings.weeklyLimit &&
      settings.monthlyLimit &&
      settings.weeklyLimit > settings.monthlyLimit
    ) {
      warnings.push('Weekly limit exceeds monthly limit');
    }
    // Check warning thresholds
    if (settings.warningThresholds) {
      for (const threshold of settings.warningThresholds) {
        if (threshold < 0 || threshold > 100) {
          errors.push(
            `Invalid warning threshold: ${threshold}% (must be 0-100)`,
          );
        }
      }
      // Check for duplicates
      const uniqueThresholds = new Set(settings.warningThresholds);
      if (uniqueThresholds.size !== settings.warningThresholds.length) {
        warnings.push('Duplicate warning thresholds detected');
      }
    }
    // Check reset time format
    if (
      settings.resetTime &&
      !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(settings.resetTime)
    ) {
      errors.push('Invalid reset time format (use HH:MM)');
    }
    // Check notification settings
    if (settings.notifications) {
      if (
        settings.notifications.email &&
        !settings.notifications.emailAddress
      ) {
        errors.push(
          'Email notifications enabled but no email address provided',
        );
      }
      if (
        settings.notifications.webhook &&
        !settings.notifications.webhookUrl
      ) {
        errors.push(
          'Webhook notifications enabled but no webhook URL provided',
        );
      }
    }
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
  /**
   * Get time until next budget reset
   * @param resetTime - Reset time in HH:MM format
   * @returns Time until reset in milliseconds
   */
  static getTimeUntilReset(resetTime) {
    const [hours, minutes] = resetTime.split(':').map(Number);
    const now = new Date();
    const resetToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
    );
    // If reset time has passed today, calculate for tomorrow
    if (resetToday <= now) {
      resetToday.setDate(resetToday.getDate() + 1);
    }
    return resetToday.getTime() - now.getTime();
  }
  /**
   * Get human-readable enforcement level description
   * @param level - Enforcement level
   * @returns Description string
   */
  static getEnforcementDescription(level) {
    switch (level) {
      case BudgetEnforcementLevel.WARNING_ONLY:
        return 'Shows warnings but allows usage above limits';
      case BudgetEnforcementLevel.STRICT:
        return 'Blocks all usage when limits are exceeded';
      case BudgetEnforcementLevel.SOFT_LIMIT:
        return 'Allows brief overages with strong warnings';
      case BudgetEnforcementLevel.TRACKING_ONLY:
        return 'Tracks usage without any enforcement';
      default:
        return 'Unknown enforcement level';
    }
  }
  /**
   * Get notification frequency description
   * @param frequency - Notification frequency
   * @returns Description string
   */
  static getFrequencyDescription(frequency) {
    switch (frequency) {
      case NotificationFrequency.IMMEDIATE:
        return 'Send notifications immediately when events occur';
      case NotificationFrequency.HOURLY:
        return 'Send hourly digest of events';
      case NotificationFrequency.DAILY:
        return 'Send daily summary of events';
      case NotificationFrequency.WEEKLY:
        return 'Send weekly report of events';
      default:
        return 'Unknown notification frequency';
    }
  }
  /**
   * Calculate trend direction from data series
   * @param values - Array of numerical values
   * @returns Trend direction
   */
  static calculateTrend(values) {
    if (values.length < 2) return 'stable';
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg =
      firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    const change = (secondAvg - firstAvg) / firstAvg;
    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }
  /**
   * Calculate projection confidence based on data consistency
   * @param data - Historical data points
   * @returns Confidence level (0-1)
   */
  static calculateProjectionConfidence(data) {
    if (data.length < 3) return 0.3;
    // Calculate coefficient of variation for cost values
    const costs = data.map((d) => d.cost);
    const mean = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
    const variance =
      costs.reduce((sum, cost) => sum + Math.pow(cost - mean, 2), 0) /
      costs.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = mean > 0 ? stdDev / mean : 1;
    // Lower coefficient of variation = higher confidence
    // Scale to 0-1 range
    const confidence = Math.max(0, Math.min(1, 1 - coefficientOfVariation));
    return confidence;
  }
}
/**
 * Export utility functions as individual functions for convenience
 */
export const formatCurrency = BudgetUtils.formatCurrency;
export const formatLargeNumber = BudgetUtils.formatLargeNumber;
export const calculatePercentage = BudgetUtils.calculatePercentage;
export const formatDuration = BudgetUtils.formatDuration;
export const calculateUsageStats = BudgetUtils.calculateUsageStats;
export const projectBudgetUsage = BudgetUtils.projectBudgetUsage;
export const mergeUsageData = BudgetUtils.mergeUsageData;
export const validateBudgetSettings = BudgetUtils.validateBudgetSettings;
export const getTimeUntilReset = BudgetUtils.getTimeUntilReset;
export const getEnforcementDescription = BudgetUtils.getEnforcementDescription;
export const getFrequencyDescription = BudgetUtils.getFrequencyDescription;
//# sourceMappingURL=BudgetUtils.js.map
