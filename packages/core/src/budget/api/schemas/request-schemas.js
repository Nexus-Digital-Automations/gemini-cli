/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Request validation schemas for Budget Management API
 * Provides comprehensive input validation schemas for all API endpoints
 * using a validation library compatible with TypeScript
 *
 * @author Claude Code - Budget Management API Endpoints Agent
 * @version 1.0.0
 */
import { Logger } from '../../../../../src/utils/logger.js';
import { BudgetEnforcementLevel, NotificationFrequency } from '../../types.js';
const logger = new Logger('BudgetRequestSchemas');
/**
 * Utility function to validate required fields
 */
function validateRequired(data, requiredFields) {
  const errors = [];
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  return errors;
}
/**
 * Utility function to validate field types
 */
function validateTypes(data, fieldTypes) {
  const errors = [];
  for (const [field, expectedType] of Object.entries(fieldTypes)) {
    if (data[field] !== undefined) {
      const actualType = typeof data[field];
      if (actualType !== expectedType) {
        errors.push(
          `Field '${field}' must be of type ${expectedType}, got ${actualType}`,
        );
      }
    }
  }
  return errors;
}
/**
 * Utility function to validate enum values
 */
function validateEnum(data, field, enumValues) {
  const errors = [];
  if (data[field] !== undefined && !enumValues.includes(data[field])) {
    errors.push(`Field '${field}' must be one of: ${enumValues.join(', ')}`);
  }
  return errors;
}
/**
 * Usage request schema validator
 */
export const usageRequestSchema = (data) => {
  logger.debug('Validating usage request', { data });
  const errors = [];
  // Optional fields with type validation
  const typeValidation = validateTypes(data, {
    projectRoot: 'string',
    startDate: 'string',
    endDate: 'string',
    limit: 'number',
    offset: 'number',
    feature: 'string',
    model: 'string',
    sessionId: 'string',
  });
  errors.push(...typeValidation);
  // Validate date formats if provided
  if (data.startDate && !isValidDateString(data.startDate)) {
    errors.push('startDate must be a valid ISO date string');
  }
  if (data.endDate && !isValidDateString(data.endDate)) {
    errors.push('endDate must be a valid ISO date string');
  }
  // Validate pagination
  if (data.limit && (data.limit < 1 || data.limit > 1000)) {
    errors.push('limit must be between 1 and 1000');
  }
  if (data.offset && data.offset < 0) {
    errors.push('offset must be non-negative');
  }
  const valid = errors.length === 0;
  logger.debug('Usage request validation result', { valid, errors });
  return { valid, errors, data: valid ? data : undefined };
};
/**
 * Configuration request schema validator
 */
export const configurationRequestSchema = (data) => {
  logger.debug('Validating configuration request', { data });
  const errors = [];
  // Type validation for optional fields
  const typeValidation = validateTypes(data, {
    enabled: 'boolean',
    dailyLimit: 'number',
    weeklyLimit: 'number',
    monthlyLimit: 'number',
    resetTime: 'string',
    currency: 'string',
    alertsEnabled: 'boolean',
  });
  errors.push(...typeValidation);
  // Validate enum values
  if (data.enforcement) {
    const enumValidation = validateEnum(
      data,
      'enforcement',
      Object.values(BudgetEnforcementLevel),
    );
    errors.push(...enumValidation);
  }
  // Validate warning thresholds
  if (data.warningThresholds) {
    if (!Array.isArray(data.warningThresholds)) {
      errors.push('warningThresholds must be an array');
    } else {
      for (const threshold of data.warningThresholds) {
        if (typeof threshold !== 'number' || threshold < 0 || threshold > 100) {
          errors.push('warning thresholds must be numbers between 0 and 100');
          break;
        }
      }
    }
  }
  // Validate limits
  if (data.dailyLimit && data.dailyLimit <= 0) {
    errors.push('dailyLimit must be positive');
  }
  if (data.weeklyLimit && data.weeklyLimit <= 0) {
    errors.push('weeklyLimit must be positive');
  }
  if (data.monthlyLimit && data.monthlyLimit <= 0) {
    errors.push('monthlyLimit must be positive');
  }
  // Validate reset time format (HH:MM)
  if (
    data.resetTime &&
    !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(data.resetTime)
  ) {
    errors.push('resetTime must be in HH:MM format');
  }
  // Validate notifications settings
  if (data.notifications) {
    const notificationErrors = validateNotificationSettings(data.notifications);
    errors.push(...notificationErrors);
  }
  const valid = errors.length === 0;
  logger.debug('Configuration request validation result', { valid, errors });
  return { valid, errors, data: valid ? data : undefined };
};
/**
 * Analytics request schema validator
 */
export const analyticsRequestSchema = (data) => {
  logger.debug('Validating analytics request', { data });
  const errors = [];
  // Type validation
  const typeValidation = validateTypes(data, {
    startDate: 'string',
    endDate: 'string',
    granularity: 'string',
    metrics: 'object',
    filters: 'object',
    groupBy: 'string',
  });
  errors.push(...typeValidation);
  // Validate granularity
  if (data.granularity) {
    const validGranularities = ['hour', 'day', 'week', 'month'];
    if (!validGranularities.includes(data.granularity)) {
      errors.push(
        `granularity must be one of: ${validGranularities.join(', ')}`,
      );
    }
  }
  // Validate date range
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (start >= end) {
      errors.push('startDate must be before endDate');
    }
    // Prevent excessive date ranges (max 1 year)
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 365) {
      errors.push('Date range cannot exceed 365 days');
    }
  }
  const valid = errors.length === 0;
  logger.debug('Analytics request validation result', { valid, errors });
  return { valid, errors, data: valid ? data : undefined };
};
/**
 * Export request schema validator
 */
export const exportRequestSchema = (data) => {
  logger.debug('Validating export request', { data });
  const errors = [];
  // Required fields
  const requiredValidation = validateRequired(data, ['format']);
  errors.push(...requiredValidation);
  // Type validation
  const typeValidation = validateTypes(data, {
    format: 'string',
    startDate: 'string',
    endDate: 'string',
    includeHistory: 'boolean',
    includeAnalytics: 'boolean',
    compression: 'string',
  });
  errors.push(...typeValidation);
  // Validate format
  if (data.format) {
    const validFormats = ['json', 'csv', 'xlsx', 'pdf'];
    if (!validFormats.includes(data.format)) {
      errors.push(`format must be one of: ${validFormats.join(', ')}`);
    }
  }
  // Validate compression
  if (data.compression) {
    const validCompressions = ['none', 'gzip', 'zip'];
    if (!validCompressions.includes(data.compression)) {
      errors.push(
        `compression must be one of: ${validCompressions.join(', ')}`,
      );
    }
  }
  const valid = errors.length === 0;
  logger.debug('Export request validation result', { valid, errors });
  return { valid, errors, data: valid ? data : undefined };
};
/**
 * Notification request schema validator
 */
export const notificationRequestSchema = (data) => {
  logger.debug('Validating notification request', { data });
  const errors = [];
  // Type validation
  const typeValidation = validateTypes(data, {
    type: 'string',
    threshold: 'number',
    enabled: 'boolean',
    message: 'string',
  });
  errors.push(...typeValidation);
  // Validate notification type
  if (data.type) {
    const validTypes = ['email', 'webhook', 'desktop', 'sms'];
    if (!validTypes.includes(data.type)) {
      errors.push(`type must be one of: ${validTypes.join(', ')}`);
    }
  }
  // Validate threshold
  if (
    data.threshold !== undefined &&
    (data.threshold < 0 || data.threshold > 100)
  ) {
    errors.push('threshold must be between 0 and 100');
  }
  // Validate notification settings
  if (data.settings) {
    const notificationErrors = validateNotificationSettings(data.settings);
    errors.push(...notificationErrors);
  }
  const valid = errors.length === 0;
  logger.debug('Notification request validation result', { valid, errors });
  return { valid, errors, data: valid ? data : undefined };
};
/**
 * Helper function to validate notification settings
 */
function validateNotificationSettings(notifications) {
  const errors = [];
  // Type validation
  const typeValidation = validateTypes(notifications, {
    email: 'boolean',
    emailAddress: 'string',
    desktop: 'boolean',
    webhook: 'boolean',
    webhookUrl: 'string',
  });
  errors.push(...typeValidation);
  // Validate email address format
  if (notifications.emailAddress && !isValidEmail(notifications.emailAddress)) {
    errors.push('emailAddress must be a valid email address');
  }
  // Validate webhook URL
  if (notifications.webhookUrl && !isValidUrl(notifications.webhookUrl)) {
    errors.push('webhookUrl must be a valid URL');
  }
  // Validate frequency
  if (notifications.frequency) {
    const enumValidation = validateEnum(
      notifications,
      'frequency',
      Object.values(NotificationFrequency),
    );
    errors.push(...enumValidation);
  }
  return errors;
}
/**
 * Helper function to validate date strings
 */
function isValidDateString(dateString) {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString.includes('T');
}
/**
 * Helper function to validate email addresses
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
/**
 * Helper function to validate URLs
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
/**
 * Export all schemas for easy importing
 */
export const schemas = {
  usageRequestSchema,
  configurationRequestSchema,
  analyticsRequestSchema,
  exportRequestSchema,
  notificationRequestSchema,
};
logger.info('Request validation schemas initialized', {
  schemasCount: Object.keys(schemas).length,
  timestamp: new Date().toISOString(),
});
//# sourceMappingURL=request-schemas.js.map
