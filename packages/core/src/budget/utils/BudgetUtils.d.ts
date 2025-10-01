/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Budget utility functions and data transformations
 * Provides helper functions for budget calculations, formatting, and data manipulation
 *
 * @author Claude Code - Budget Core Infrastructure Agent
 * @version 1.0.0
 */
import type { BudgetSettings, BudgetUsageData, HistoricalDataPoint } from '../types.js';
import { BudgetEnforcementLevel, NotificationFrequency } from '../types.js';
/**
 * Currency formatting options
 */
export interface CurrencyFormatOptions {
    /** Currency code (e.g., 'USD', 'EUR') */
    currency: string;
    /** Locale for formatting */
    locale?: string;
    /** Minimum fraction digits */
    minimumFractionDigits?: number;
    /** Maximum fraction digits */
    maximumFractionDigits?: number;
}
/**
 * Time period for calculations
 */
export type TimePeriod = 'hour' | 'day' | 'week' | 'month' | 'year';
/**
 * Usage statistics summary
 */
export interface UsageStatsSummary {
    /** Total cost */
    totalCost: number;
    /** Total requests */
    totalRequests: number;
    /** Total tokens */
    totalTokens: number;
    /** Average cost per request */
    avgCostPerRequest: number;
    /** Average tokens per request */
    avgTokensPerRequest: number;
    /** Most expensive model */
    mostExpensiveModel?: string;
    /** Most used model */
    mostUsedModel?: string;
    /** Usage trend */
    trend: 'increasing' | 'decreasing' | 'stable';
    /** Time period covered */
    period: {
        start: Date;
        end: Date;
        duration: number;
    };
}
/**
 * Budget projection result
 */
export interface BudgetProjection {
    /** Current usage */
    currentUsage: number;
    /** Projected usage for full period */
    projectedUsage: number;
    /** Confidence level (0-1) */
    confidence: number;
    /** Usage rate per hour */
    usageRate: number;
    /** Days until limit reached */
    daysUntilLimit?: number;
    /** Recommended actions */
    recommendations: string[];
}
/**
 * Budget utilities class with comprehensive helper functions
 */
export declare class BudgetUtils {
    /**
     * Format currency amount with proper localization
     * @param amount - Amount to format
     * @param options - Formatting options
     * @returns Formatted currency string
     */
    static formatCurrency(amount: number, options?: CurrencyFormatOptions): string;
    /**
     * Format large numbers with appropriate units (K, M, B)
     * @param value - Number to format
     * @param decimals - Number of decimal places
     * @returns Formatted number string
     */
    static formatLargeNumber(value: number, decimals?: number): string;
    /**
     * Calculate percentage with safe division
     * @param value - Current value
     * @param total - Total value
     * @param decimals - Decimal places
     * @returns Percentage value
     */
    static calculatePercentage(value: number, total: number, decimals?: number): number;
    /**
     * Format time duration in human-readable format
     * @param milliseconds - Duration in milliseconds
     * @returns Human-readable duration string
     */
    static formatDuration(milliseconds: number): string;
    /**
     * Calculate usage statistics from historical data
     * @param data - Array of historical data points
     * @returns Usage statistics summary
     */
    static calculateUsageStats(data: HistoricalDataPoint[]): UsageStatsSummary;
    /**
     * Project budget usage based on historical data
     * @param currentUsage - Current usage amount
     * @param historicalData - Historical data points
     * @param targetPeriod - Period to project to (in milliseconds)
     * @returns Budget projection
     */
    static projectBudgetUsage(currentUsage: number, historicalData: HistoricalDataPoint[], targetPeriod: number): BudgetProjection;
    /**
     * Merge multiple usage data objects
     * @param usageDataArray - Array of usage data to merge
     * @returns Merged usage data
     */
    static mergeUsageData(usageDataArray: BudgetUsageData[]): BudgetUsageData;
    /**
     * Validate budget settings
     * @param settings - Budget settings to validate
     * @returns Validation result with errors
     */
    static validateBudgetSettings(settings: BudgetSettings): {
        isValid: boolean;
        errors: string[];
        warnings: string[];
    };
    /**
     * Get time until next budget reset
     * @param resetTime - Reset time in HH:MM format
     * @returns Time until reset in milliseconds
     */
    static getTimeUntilReset(resetTime: string): number;
    /**
     * Get human-readable enforcement level description
     * @param level - Enforcement level
     * @returns Description string
     */
    static getEnforcementDescription(level: BudgetEnforcementLevel): string;
    /**
     * Get notification frequency description
     * @param frequency - Notification frequency
     * @returns Description string
     */
    static getFrequencyDescription(frequency: NotificationFrequency): string;
    /**
     * Calculate trend direction from data series
     * @param values - Array of numerical values
     * @returns Trend direction
     */
    private static calculateTrend;
    /**
     * Calculate projection confidence based on data consistency
     * @param data - Historical data points
     * @returns Confidence level (0-1)
     */
    private static calculateProjectionConfidence;
}
/**
 * Export utility functions as individual functions for convenience
 */
export declare const formatCurrency: typeof BudgetUtils.formatCurrency;
export declare const formatLargeNumber: typeof BudgetUtils.formatLargeNumber;
export declare const calculatePercentage: typeof BudgetUtils.calculatePercentage;
export declare const formatDuration: typeof BudgetUtils.formatDuration;
export declare const calculateUsageStats: typeof BudgetUtils.calculateUsageStats;
export declare const projectBudgetUsage: typeof BudgetUtils.projectBudgetUsage;
export declare const mergeUsageData: typeof BudgetUtils.mergeUsageData;
export declare const validateBudgetSettings: typeof BudgetUtils.validateBudgetSettings;
export declare const getTimeUntilReset: typeof BudgetUtils.getTimeUntilReset;
export declare const getEnforcementDescription: typeof BudgetUtils.getEnforcementDescription;
export declare const getFrequencyDescription: typeof BudgetUtils.getFrequencyDescription;
