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

import { getComponentLogger } from '../../../utils/logger.js';
import { BudgetEnforcementLevel, NotificationFrequency } from '../../types.js';

const logger = getComponentLogger('BudgetRequestSchemas');

/**
 * Base validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  data?: unknown;
}

/**
 * Base validator function type
 */
export type SchemaValidator = (data: unknown) => ValidationResult;

/**
 * Utility function to validate required fields
 */
function validateRequired(data: Record<string, unknown>, requiredFields: string[]): string[] {
  const errors: string[] = [];

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
function validateTypes(
  data: Record<string, unknown>,
  fieldTypes: Record<string, string>,
): string[] {
  const errors: string[] = [];

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
function validateEnum(
  data: Record<string, unknown>,
  field: string,
  enumValues: string[],
): string[] {
  const errors: string[] = [];

  if (data[field] !== undefined && !enumValues.includes(data[field] as string)) {
    errors.push(`Field '${field}' must be one of: ${enumValues.join(', ')}`);
  }

  return errors;
}

/**
 * Usage request schema validator
 */
export const usageRequestSchema: SchemaValidator = (
  data: unknown,
): ValidationResult => {
  logger.debug('Validating usage request', { data });

  const errors: string[] = [];
  const typedData = data as Record<string, unknown>;

  // Optional fields with type validation
  const typeValidation = validateTypes(typedData, {
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
  if (typedData.startDate && !isValidDateString(typedData.startDate as string)) {
    errors.push('startDate must be a valid ISO date string');
  }

  if (typedData.endDate && !isValidDateString(typedData.endDate as string)) {
    errors.push('endDate must be a valid ISO date string');
  }

  // Validate pagination
  if (typedData.limit && ((typedData.limit as number) < 1 || (typedData.limit as number) > 1000)) {
    errors.push('limit must be between 1 and 1000');
  }

  if (typedData.offset && (typedData.offset as number) < 0) {
    errors.push('offset must be non-negative');
  }

  const valid = errors.length === 0;
  logger.debug('Usage request validation result', { valid, errors });

  return { valid, errors, data: valid ? data : undefined };
};

/**
 * Configuration request schema validator
 */
export const configurationRequestSchema: SchemaValidator = (
  data: unknown,
): ValidationResult => {
  logger.debug('Validating configuration request', { data });

  const errors: string[] = [];
  const typedData = data as Record<string, unknown>;

  // Type validation for optional fields
  const typeValidation = validateTypes(typedData, {
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
  if (typedData.enforcement) {
    const enumValidation = validateEnum(
      typedData,
      'enforcement',
      Object.values(BudgetEnforcementLevel),
    );
    errors.push(...enumValidation);
  }

  // Validate warning thresholds
  if (typedData.warningThresholds) {
    if (!Array.isArray(typedData.warningThresholds)) {
      errors.push('warningThresholds must be an array');
    } else {
      for (const threshold of typedData.warningThresholds) {
        if (typeof threshold !== 'number' || threshold < 0 || threshold > 100) {
          errors.push('warning thresholds must be numbers between 0 and 100');
          break;
        }
      }
    }
  }

  // Validate limits
  if (typedData.dailyLimit && (typedData.dailyLimit as number) <= 0) {
    errors.push('dailyLimit must be positive');
  }

  if (typedData.weeklyLimit && (typedData.weeklyLimit as number) <= 0) {
    errors.push('weeklyLimit must be positive');
  }

  if (typedData.monthlyLimit && (typedData.monthlyLimit as number) <= 0) {
    errors.push('monthlyLimit must be positive');
  }

  // Validate reset time format (HH:MM)
  if (
    typedData.resetTime &&
    !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(typedData.resetTime as string)
  ) {
    errors.push('resetTime must be in HH:MM format');
  }

  // Validate notifications settings
  if (typedData.notifications) {
    const notificationErrors = validateNotificationSettings(typedData.notifications as Record<string, unknown>);
    errors.push(...notificationErrors);
  }

  const valid = errors.length === 0;
  logger.debug('Configuration request validation result', { valid, errors });

  return { valid, errors, data: valid ? data : undefined };
};

/**
 * Analytics request schema validator
 */
export const analyticsRequestSchema: SchemaValidator = (
  data: unknown,
): ValidationResult => {
  logger.debug('Validating analytics request', { data });

  const errors: string[] = [];
  const typedData = data as Record<string, unknown>;

  // Type validation
  const typeValidation = validateTypes(typedData, {
    startDate: 'string',
    endDate: 'string',
    granularity: 'string',
    metrics: 'object',
    filters: 'object',
    groupBy: 'string',
  });

  errors.push(...typeValidation);

  // Validate granularity
  if (typedData.granularity) {
    const validGranularities = ['hour', 'day', 'week', 'month'];
    if (!validGranularities.includes(typedData.granularity as string)) {
      errors.push(
        `granularity must be one of: ${validGranularities.join(', ')}`,
      );
    }
  }

  // Validate date range
  if (typedData.startDate && typedData.endDate) {
    const start = new Date(typedData.startDate as string);
    const end = new Date(typedData.endDate as string);

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
export const exportRequestSchema: SchemaValidator = (
  data: unknown,
): ValidationResult => {
  logger.debug('Validating export request', { data });

  const errors: string[] = [];

  // Required fields
  const requiredValidation = validateRequired(data as Record<string, unknown>, ['format']);
  errors.push(...requiredValidation);

  // Type validation
  const typeValidation = validateTypes(data as Record<string, unknown>, {
    format: 'string',
    startDate: 'string',
    endDate: 'string',
    includeHistory: 'boolean',
    includeAnalytics: 'boolean',
    compression: 'string',
  });

  errors.push(...typeValidation);

  // Validate format
  if ((data as Record<string, unknown>).format) {
    const typedData = data as Record<string, unknown>;
    const validFormats = ['json', 'csv', 'xlsx', 'pdf'];
    if (!validFormats.includes(typedData.format as string)) {
      errors.push(`format must be one of: ${validFormats.join(', ')}`);
    }
  }

  // Validate compression
  if ((data as Record<string, unknown>).compression) {
    const typedData = data as Record<string, unknown>;
    const validCompressions = ['none', 'gzip', 'zip'];
    if (!validCompressions.includes(typedData.compression as string)) {
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
export const notificationRequestSchema: SchemaValidator = (
  data: unknown,
): ValidationResult => {
  logger.debug('Validating notification request', { data });

  const errors: string[] = [];
  const typedData = data as Record<string, unknown>;

  // Type validation
  const typeValidation = validateTypes(typedData, {
    type: 'string',
    threshold: 'number',
    enabled: 'boolean',
    message: 'string',
  });

  errors.push(...typeValidation);

  // Validate notification type
  if (typedData.type) {
    const validTypes = ['email', 'webhook', 'desktop', 'sms'];
    if (!validTypes.includes(typedData.type as string)) {
      errors.push(`type must be one of: ${validTypes.join(', ')}`);
    }
  }

  // Validate threshold
  if (
    typedData.threshold !== undefined &&
    ((typedData.threshold as number) < 0 || (typedData.threshold as number) > 100)
  ) {
    errors.push('threshold must be between 0 and 100');
  }

  // Validate notification settings
  if (typedData.settings) {
    const notificationErrors = validateNotificationSettings(typedData.settings as Record<string, unknown>);
    errors.push(...notificationErrors);
  }

  const valid = errors.length === 0;
  logger.debug('Notification request validation result', { valid, errors });

  return { valid, errors, data: valid ? data : undefined };
};

/**
 * Helper function to validate notification settings
 */
function validateNotificationSettings(notifications: Record<string, unknown>): string[] {
  const errors: string[] = [];

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
  if (notifications.emailAddress && !isValidEmail(notifications.emailAddress as string)) {
    errors.push('emailAddress must be a valid email address');
  }

  // Validate webhook URL
  if (notifications.webhookUrl && !isValidUrl(notifications.webhookUrl as string)) {
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
function isValidDateString(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString.includes('T');
}

/**
 * Helper function to validate email addresses
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Helper function to validate URLs
 */
function isValidUrl(url: string): boolean {
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
