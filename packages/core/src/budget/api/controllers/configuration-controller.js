/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from '../../../../../src/utils/logger.js';
import { getBudgetTracker } from '../../budget-tracker.js';
const logger = new Logger('ConfigurationController');
/**
 * Controller for budget configuration management endpoints
 */
export class ConfigurationController {
    /**
     * Initialize configuration controller with logging
     */
    constructor() {
        logger.info('Initializing Configuration Controller', {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
        });
    }
    /**
     * Get current budget configuration
     * GET /api/budget/config
     */
    async getConfiguration(req, res) {
        const startTime = Date.now();
        logger.info('Configuration retrieval requested', {
            userId: req.user?.id,
            timestamp: new Date().toISOString(),
        });
        try {
            const budgetTracker = await getBudgetTracker();
            if (!budgetTracker) {
                logger.warn('Budget tracker unavailable for configuration retrieval');
                res.status(503).json({
                    success: false,
                    error: 'Budget configuration service unavailable',
                });
                return;
            }
            // Get current settings
            const settings = await budgetTracker.getSettings();
            const responseTime = Date.now() - startTime;
            const response = {
                success: true,
                data: {
                    configuration: settings,
                    metadata: {
                        timestamp: new Date().toISOString(),
                        responseTime,
                        version: '1.0.0',
                        lastModified: await budgetTracker.getLastConfigUpdate(),
                    },
                },
            };
            logger.info('Configuration retrieved successfully', {
                responseTime,
                enabled: settings.enabled,
                dailyLimit: settings.dailyLimit,
            });
            res.status(200).json(response);
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            logger.error('Failed to get configuration', {
                error: error instanceof Error ? error.message : 'Unknown error',
                responseTime,
                userId: req.user?.id,
            });
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve configuration',
                timestamp: new Date().toISOString(),
                responseTime,
            });
        }
    }
    /**
     * Update budget configuration
     * POST /api/budget/config
     */
    async updateConfiguration(req, res) {
        const startTime = Date.now();
        const newSettings = req.body;
        logger.info('Configuration update requested', {
            userId: req.user?.id,
            settings: newSettings,
            timestamp: new Date().toISOString(),
        });
        try {
            const budgetTracker = await getBudgetTracker();
            if (!budgetTracker) {
                logger.warn('Budget tracker unavailable for configuration update');
                res.status(503).json({
                    success: false,
                    error: 'Budget configuration service unavailable',
                });
                return;
            }
            // Get current settings for validation
            const currentSettings = await budgetTracker.getSettings();
            // Merge and validate new settings
            const updatedSettings = {
                ...currentSettings,
                ...newSettings,
            };
            // Perform validation
            const validationResult = this.validateConfiguration(updatedSettings);
            if (!validationResult.valid) {
                logger.warn('Configuration validation failed', {
                    errors: validationResult.errors,
                    userId: req.user?.id,
                });
                res.status(400).json({
                    success: false,
                    error: 'Configuration validation failed',
                    details: validationResult.errors,
                });
                return;
            }
            // Apply the new settings
            await budgetTracker.updateSettings(updatedSettings);
            const responseTime = Date.now() - startTime;
            const response = {
                success: true,
                data: {
                    configuration: updatedSettings,
                    changes: this.getConfigurationChanges(currentSettings, updatedSettings),
                    metadata: {
                        timestamp: new Date().toISOString(),
                        responseTime,
                        updatedBy: req.user?.id,
                        previousVersion: currentSettings,
                    },
                },
            };
            logger.info('Configuration updated successfully', {
                responseTime,
                changesCount: Object.keys(newSettings).length,
                userId: req.user?.id,
            });
            res.status(200).json(response);
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            logger.error('Failed to update configuration', {
                error: error instanceof Error ? error.message : 'Unknown error',
                responseTime,
                userId: req.user?.id,
            });
            res.status(500).json({
                success: false,
                error: 'Failed to update configuration',
                timestamp: new Date().toISOString(),
                responseTime,
            });
        }
    }
    /**
     * Reset configuration to defaults
     * POST /api/budget/config/reset
     */
    async resetConfiguration(req, res) {
        const startTime = Date.now();
        logger.warn('Configuration reset requested', {
            userId: req.user?.id,
            timestamp: new Date().toISOString(),
        });
        try {
            const budgetTracker = await getBudgetTracker();
            if (!budgetTracker) {
                res.status(503).json({
                    success: false,
                    error: 'Budget configuration service unavailable',
                });
                return;
            }
            // Get current settings for backup
            const previousSettings = await budgetTracker.getSettings();
            // Reset to default settings
            const defaultSettings = {
                enabled: true,
                dailyLimit: 10.0,
                resetTime: '00:00',
                warningThresholds: [50, 75, 90],
            };
            await budgetTracker.updateSettings(defaultSettings);
            const responseTime = Date.now() - startTime;
            const response = {
                success: true,
                data: {
                    configuration: defaultSettings,
                    previousConfiguration: previousSettings,
                    metadata: {
                        timestamp: new Date().toISOString(),
                        responseTime,
                        resetBy: req.user?.id,
                        operation: 'reset-to-defaults',
                    },
                },
            };
            logger.warn('Configuration reset completed', {
                responseTime,
                resetBy: req.user?.id,
            });
            res.status(200).json(response);
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            logger.error('Failed to reset configuration', {
                error: error instanceof Error ? error.message : 'Unknown error',
                responseTime,
                userId: req.user?.id,
            });
            res.status(500).json({
                success: false,
                error: 'Failed to reset configuration',
                timestamp: new Date().toISOString(),
                responseTime,
            });
        }
    }
    /**
     * Validate configuration without applying changes
     * GET /api/budget/config/validate
     */
    async validateConfiguration(req, res) {
        const startTime = Date.now();
        const settingsToValidate = req.query;
        logger.info('Configuration validation requested', {
            userId: req.user?.id,
            settings: settingsToValidate,
            timestamp: new Date().toISOString(),
        });
        try {
            // Convert string parameters to appropriate types
            const parsedSettings = this.parseQueryParameters(settingsToValidate);
            // Perform validation
            const validationResult = this.validateConfiguration(parsedSettings);
            const responseTime = Date.now() - startTime;
            const response = {
                success: true,
                data: {
                    valid: validationResult.valid,
                    errors: validationResult.errors,
                    warnings: validationResult.warnings || [],
                    recommendations: validationResult.recommendations || [],
                    metadata: {
                        timestamp: new Date().toISOString(),
                        responseTime,
                        validatedBy: req.user?.id,
                    },
                },
            };
            logger.info('Configuration validation completed', {
                responseTime,
                valid: validationResult.valid,
                errorsCount: validationResult.errors.length,
            });
            res.status(200).json(response);
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            logger.error('Configuration validation failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                responseTime,
                userId: req.user?.id,
            });
            res.status(500).json({
                success: false,
                error: 'Configuration validation failed',
                timestamp: new Date().toISOString(),
                responseTime,
            });
        }
    }
    /**
     * Validate configuration settings
     */
    validateConfiguration(settings) {
        const errors = [];
        const warnings = [];
        const recommendations = [];
        // Validate daily limit
        if (settings.dailyLimit !== undefined) {
            if (typeof settings.dailyLimit !== 'number') {
                errors.push('dailyLimit must be a number');
            }
            else if (settings.dailyLimit < 0) {
                errors.push('dailyLimit cannot be negative');
            }
            else if (settings.dailyLimit > 10000) {
                warnings.push('dailyLimit is unusually high (>$10,000)');
            }
            else if (settings.dailyLimit < 1) {
                warnings.push('dailyLimit is very low (<$1)');
            }
        }
        // Validate reset time format
        if (settings.resetTime !== undefined) {
            if (typeof settings.resetTime !== 'string') {
                errors.push('resetTime must be a string');
            }
            else if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(settings.resetTime)) {
                errors.push('resetTime must be in HH:MM format (24-hour)');
            }
        }
        // Validate warning thresholds
        if (settings.warningThresholds !== undefined) {
            if (!Array.isArray(settings.warningThresholds)) {
                errors.push('warningThresholds must be an array');
            }
            else {
                for (const threshold of settings.warningThresholds) {
                    if (typeof threshold !== 'number') {
                        errors.push('All warning thresholds must be numbers');
                        break;
                    }
                    if (threshold < 0 || threshold > 100) {
                        errors.push('Warning thresholds must be between 0 and 100');
                        break;
                    }
                }
                // Check for reasonable thresholds
                if (settings.warningThresholds.length === 0) {
                    recommendations.push('Consider adding warning thresholds for better budget monitoring');
                }
            }
        }
        // Validate enabled flag
        if (settings.enabled !== undefined &&
            typeof settings.enabled !== 'boolean') {
            errors.push('enabled must be a boolean');
        }
        // Provide recommendations
        if (settings.dailyLimit && settings.warningThresholds) {
            const highestThreshold = Math.max(...settings.warningThresholds);
            if (highestThreshold < 80) {
                recommendations.push('Consider adding a warning threshold above 80% for better budget control');
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings: warnings.length > 0 ? warnings : undefined,
            recommendations: recommendations.length > 0 ? recommendations : undefined,
        };
    }
    /**
     * Parse query parameters to appropriate types
     */
    parseQueryParameters(params) {
        const parsed = {};
        if (params.enabled !== undefined) {
            parsed.enabled = params.enabled === 'true';
        }
        if (params.dailyLimit !== undefined) {
            const limit = parseFloat(params.dailyLimit);
            if (!isNaN(limit)) {
                parsed.dailyLimit = limit;
            }
        }
        if (params.resetTime !== undefined) {
            parsed.resetTime = params.resetTime;
        }
        if (params.warningThresholds !== undefined) {
            try {
                parsed.warningThresholds = JSON.parse(params.warningThresholds);
            }
            catch {
                // Invalid JSON, will be caught in validation
            }
        }
        return parsed;
    }
    /**
     * Compare configurations and identify changes
     */
    getConfigurationChanges(previous, current) {
        const changes = [];
        const allKeys = new Set([
            ...Object.keys(previous),
            ...Object.keys(current),
        ]);
        for (const key of allKeys) {
            const prevValue = previous[key];
            const currValue = current[key];
            if (prevValue === undefined && currValue !== undefined) {
                changes.push({
                    field: key,
                    previousValue: undefined,
                    newValue: currValue,
                    type: 'added',
                });
            }
            else if (prevValue !== undefined && currValue === undefined) {
                changes.push({
                    field: key,
                    previousValue: prevValue,
                    newValue: undefined,
                    type: 'removed',
                });
            }
            else if (prevValue !== currValue) {
                changes.push({
                    field: key,
                    previousValue: prevValue,
                    newValue: currValue,
                    type: 'modified',
                });
            }
        }
        return changes;
    }
}
//# sourceMappingURL=configuration-controller.js.map