/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Budget configuration management system
 * Handles loading, validation, and management of budget configuration settings
 *
 * @author Claude Code - Budget Core Infrastructure Agent
 * @version 1.0.0
 */
import { Logger } from '@google/gemini-cli/src/utils/logger.js';
import { BudgetEnforcementLevel, NotificationFrequency, BudgetPermission, } from '../types.js';
/**
 * Configuration validation errors
 */
export class BudgetConfigValidationError extends Error {
    field;
    value;
    constructor(message, field, value) {
        super(message);
        this.field = field;
        this.value = value;
        this.name = 'BudgetConfigValidationError';
    }
}
/**
 * Configuration access errors
 */
export class BudgetConfigAccessError extends Error {
    requiredPermission;
    constructor(message, requiredPermission) {
        super(message);
        this.requiredPermission = requiredPermission;
        this.name = 'BudgetConfigAccessError';
    }
}
/**
 * Default budget configuration
 */
export const DEFAULT_BUDGET_SETTINGS = {
    enabled: false,
    dailyLimit: 10.0,
    weeklyLimit: 50.0,
    monthlyLimit: 200.0,
    resetTime: '00:00',
    warningThresholds: [50, 75, 90],
    currency: 'USD',
    alertsEnabled: true,
    notifications: {
        email: false,
        desktop: true,
        webhook: false,
        frequency: NotificationFrequency.IMMEDIATE,
    },
    enforcement: BudgetEnforcementLevel.WARNING_ONLY,
};
/**
 * Budget configuration manager with validation and security
 */
export class BudgetConfigManager {
    logger;
    settings;
    securityContext;
    /**
     * Create new budget configuration manager
     * @param initialSettings - Initial configuration settings
     * @param securityContext - Security context for access control
     */
    constructor(initialSettings = {}, securityContext) {
        this.logger = new Logger('BudgetConfigManager');
        this.securityContext = securityContext;
        this.settings = this.mergeWithDefaults(initialSettings);
        this.logger.info('Budget configuration manager initialized', {
            hasSettings: Object.keys(initialSettings).length > 0,
            hasSecurityContext: !!securityContext,
        });
    }
    /**
     * Get current budget settings (read-only copy)
     * @returns Current budget settings
     */
    getSettings() {
        this.validatePermission(BudgetPermission.VIEW_BUDGET);
        const start = Date.now();
        try {
            const settings = Object.freeze({ ...this.settings });
            this.logger.debug('Retrieved budget settings', {
                enabled: settings.enabled,
                hasLimits: !!(settings.dailyLimit ||
                    settings.weeklyLimit ||
                    settings.monthlyLimit),
                executionTime: Date.now() - start,
            });
            return settings;
        }
        catch (error) {
            this.logger.error('Failed to retrieve budget settings', error);
            throw error;
        }
    }
    /**
     * Update budget settings with validation
     * @param updates - Partial settings to update
     * @returns Updated settings
     */
    async updateSettings(updates) {
        this.validatePermission(BudgetPermission.MODIFY_SETTINGS);
        const start = Date.now();
        this.logger.info('Updating budget settings', {
            updates: Object.keys(updates),
            sessionId: this.securityContext?.sessionId,
        });
        try {
            // Validate the updates
            this.validateSettings(updates);
            // Merge with current settings
            const newSettings = { ...this.settings, ...updates };
            // Validate the complete configuration
            this.validateSettings(newSettings);
            // Apply the updates
            this.settings = newSettings;
            this.logger.info('Budget settings updated successfully', {
                updatedFields: Object.keys(updates),
                executionTime: Date.now() - start,
            });
            return { ...this.settings };
        }
        catch (error) {
            this.logger.error('Failed to update budget settings', {
                error,
                updates,
            });
            throw error;
        }
    }
    /**
     * Reset settings to defaults
     */
    async resetToDefaults() {
        this.validatePermission(BudgetPermission.MODIFY_SETTINGS);
        this.logger.info('Resetting budget settings to defaults');
        this.settings = { ...DEFAULT_BUDGET_SETTINGS };
        return { ...this.settings };
    }
    /**
     * Validate individual setting values
     * @param settings - Settings to validate
     * @throws BudgetConfigValidationError if validation fails
     */
    validateSettings(settings) {
        const start = Date.now();
        try {
            // Validate daily limit
            if (settings.dailyLimit !== undefined) {
                this.validateNumericLimit('dailyLimit', settings.dailyLimit, 0, 10000);
            }
            // Validate weekly limit
            if (settings.weeklyLimit !== undefined) {
                this.validateNumericLimit('weeklyLimit', settings.weeklyLimit, 0, 50000);
            }
            // Validate monthly limit
            if (settings.monthlyLimit !== undefined) {
                this.validateNumericLimit('monthlyLimit', settings.monthlyLimit, 0, 200000);
            }
            // Validate reset time format
            if (settings.resetTime !== undefined) {
                this.validateTimeFormat('resetTime', settings.resetTime);
            }
            // Validate warning thresholds
            if (settings.warningThresholds !== undefined) {
                this.validateWarningThresholds('warningThresholds', settings.warningThresholds);
            }
            // Validate currency code
            if (settings.currency !== undefined) {
                this.validateCurrencyCode('currency', settings.currency);
            }
            // Validate enforcement level
            if (settings.enforcement !== undefined) {
                this.validateEnforcementLevel('enforcement', settings.enforcement);
            }
            // Validate notification settings
            if (settings.notifications !== undefined) {
                this.validateNotificationSettings('notifications', settings.notifications);
            }
            this.logger.debug('Budget settings validation completed', {
                validatedFields: Object.keys(settings),
                executionTime: Date.now() - start,
            });
        }
        catch (error) {
            this.logger.error('Budget settings validation failed', error);
            throw error;
        }
    }
    /**
     * Get setting by key with type safety
     * @param key - Setting key
     * @returns Setting value
     */
    getSetting(key) {
        this.validatePermission(BudgetPermission.VIEW_BUDGET);
        return this.settings[key];
    }
    /**
     * Check if budget tracking is properly configured
     * @returns True if configuration is valid for tracking
     */
    isConfigurationValid() {
        try {
            return !!(this.settings.enabled &&
                (this.settings.dailyLimit ||
                    this.settings.weeklyLimit ||
                    this.settings.monthlyLimit) &&
                this.settings.currency &&
                this.settings.resetTime);
        }
        catch {
            return false;
        }
    }
    /**
     * Get configuration summary for diagnostics
     * @returns Configuration summary
     */
    getConfigurationSummary() {
        this.validatePermission(BudgetPermission.VIEW_BUDGET);
        return {
            enabled: this.settings.enabled,
            hasLimits: !!(this.settings.dailyLimit ||
                this.settings.weeklyLimit ||
                this.settings.monthlyLimit),
            dailyLimit: this.settings.dailyLimit,
            weeklyLimit: this.settings.weeklyLimit,
            monthlyLimit: this.settings.monthlyLimit,
            currency: this.settings.currency,
            enforcement: this.settings.enforcement,
            alertsEnabled: this.settings.alertsEnabled,
            warningThresholds: this.settings.warningThresholds?.length || 0,
            notificationsEnabled: !!(this.settings.notifications?.email ||
                this.settings.notifications?.desktop ||
                this.settings.notifications?.webhook),
        };
    }
    /**
     * Merge user settings with defaults
     * @param userSettings - User-provided settings
     * @returns Merged settings
     */
    mergeWithDefaults(userSettings) {
        return {
            ...DEFAULT_BUDGET_SETTINGS,
            ...userSettings,
            notifications: {
                ...DEFAULT_BUDGET_SETTINGS.notifications,
                ...(userSettings.notifications || {}),
            },
        };
    }
    /**
     * Validate numeric limit values
     * @param field - Field name
     * @param value - Value to validate
     * @param min - Minimum allowed value
     * @param max - Maximum allowed value
     */
    validateNumericLimit(field, value, min, max) {
        if (typeof value !== 'number' || isNaN(value)) {
            throw new BudgetConfigValidationError(`${field} must be a valid number`, field, value);
        }
        if (value < min || value > max) {
            throw new BudgetConfigValidationError(`${field} must be between ${min} and ${max}`, field, value);
        }
    }
    /**
     * Validate time format (HH:MM)
     * @param field - Field name
     * @param value - Time string to validate
     */
    validateTimeFormat(field, value) {
        if (typeof value !== 'string') {
            throw new BudgetConfigValidationError(`${field} must be a string`, field, value);
        }
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(value)) {
            throw new BudgetConfigValidationError(`${field} must be in HH:MM format`, field, value);
        }
    }
    /**
     * Validate warning thresholds
     * @param field - Field name
     * @param value - Thresholds array to validate
     */
    validateWarningThresholds(field, value) {
        if (!Array.isArray(value)) {
            throw new BudgetConfigValidationError(`${field} must be an array`, field, value);
        }
        for (const threshold of value) {
            if (typeof threshold !== 'number' || threshold < 0 || threshold > 100) {
                throw new BudgetConfigValidationError(`Warning thresholds must be between 0 and 100`, field, threshold);
            }
        }
        // Check for duplicates and sort order
        const sorted = [...value].sort((a, b) => a - b);
        if (sorted.some((val, idx) => idx > 0 && val === sorted[idx - 1])) {
            throw new BudgetConfigValidationError(`Warning thresholds must not contain duplicates`, field, value);
        }
    }
    /**
     * Validate currency code
     * @param field - Field name
     * @param value - Currency code to validate
     */
    validateCurrencyCode(field, value) {
        if (typeof value !== 'string') {
            throw new BudgetConfigValidationError(`${field} must be a string`, field, value);
        }
        // ISO 4217 currency code format
        const currencyRegex = /^[A-Z]{3}$/;
        if (!currencyRegex.test(value)) {
            throw new BudgetConfigValidationError(`${field} must be a valid 3-letter ISO currency code`, field, value);
        }
    }
    /**
     * Validate enforcement level
     * @param field - Field name
     * @param value - Enforcement level to validate
     */
    validateEnforcementLevel(field, value) {
        if (!Object.values(BudgetEnforcementLevel).includes(value)) {
            throw new BudgetConfigValidationError(`${field} must be a valid enforcement level`, field, value);
        }
    }
    /**
     * Validate notification settings
     * @param field - Field name
     * @param value - Notification settings to validate
     */
    validateNotificationSettings(field, value) {
        if (typeof value !== 'object' || value === null) {
            throw new BudgetConfigValidationError(`${field} must be an object`, field, value);
        }
        // Validate email settings
        if (value.email === true && !value.emailAddress) {
            throw new BudgetConfigValidationError('Email address is required when email notifications are enabled', 'emailAddress', value.emailAddress);
        }
        // Validate webhook settings
        if (value.webhook === true && !value.webhookUrl) {
            throw new BudgetConfigValidationError('Webhook URL is required when webhook notifications are enabled', 'webhookUrl', value.webhookUrl);
        }
        // Validate frequency
        if (value.frequency &&
            !Object.values(NotificationFrequency).includes(value.frequency)) {
            throw new BudgetConfigValidationError('Invalid notification frequency', 'frequency', value.frequency);
        }
    }
    /**
     * Validate user permissions for operation
     * @param requiredPermission - Required permission
     * @throws BudgetConfigAccessError if permission denied
     */
    validatePermission(requiredPermission) {
        if (!this.securityContext) {
            return; // No security context means no restrictions
        }
        const hasPermission = this.securityContext.userPermissions.includes(requiredPermission) ||
            this.securityContext.userPermissions.includes(BudgetPermission.ADMIN);
        if (!hasPermission) {
            throw new BudgetConfigAccessError(`Operation requires ${requiredPermission} permission`, requiredPermission);
        }
    }
}
/**
 * Factory function to create budget configuration manager
 * @param settings - Initial settings
 * @param securityContext - Security context
 * @returns New configuration manager instance
 */
export function createBudgetConfigManager(settings = {}, securityContext) {
    return new BudgetConfigManager(settings, securityContext);
}
//# sourceMappingURL=BudgetConfigManager.js.map