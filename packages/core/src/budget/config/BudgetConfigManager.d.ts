/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BudgetSettings, BudgetSecurityContext } from '../types.js';
import type { BudgetPermission } from '../types.js';
/**
 * Configuration validation errors
 */
export declare class BudgetConfigValidationError extends Error {
  readonly field: string;
  readonly value: any;
  constructor(message: string, field: string, value: any);
}
/**
 * Configuration access errors
 */
export declare class BudgetConfigAccessError extends Error {
  readonly requiredPermission: BudgetPermission;
  constructor(message: string, requiredPermission: BudgetPermission);
}
/**
 * Default budget configuration
 */
export declare const DEFAULT_BUDGET_SETTINGS: Required<BudgetSettings>;
/**
 * Budget configuration manager with validation and security
 */
export declare class BudgetConfigManager {
  private readonly logger;
  private settings;
  private readonly securityContext?;
  /**
   * Create new budget configuration manager
   * @param initialSettings - Initial configuration settings
   * @param securityContext - Security context for access control
   */
  constructor(
    initialSettings?: Partial<BudgetSettings>,
    securityContext?: BudgetSecurityContext,
  );
  /**
   * Get current budget settings (read-only copy)
   * @returns Current budget settings
   */
  getSettings(): Readonly<BudgetSettings>;
  /**
   * Update budget settings with validation
   * @param updates - Partial settings to update
   * @returns Updated settings
   */
  updateSettings(updates: Partial<BudgetSettings>): Promise<BudgetSettings>;
  /**
   * Reset settings to defaults
   */
  resetToDefaults(): Promise<BudgetSettings>;
  /**
   * Validate individual setting values
   * @param settings - Settings to validate
   * @throws BudgetConfigValidationError if validation fails
   */
  validateSettings(settings: Partial<BudgetSettings>): void;
  /**
   * Get setting by key with type safety
   * @param key - Setting key
   * @returns Setting value
   */
  getSetting<K extends keyof BudgetSettings>(key: K): BudgetSettings[K];
  /**
   * Check if budget tracking is properly configured
   * @returns True if configuration is valid for tracking
   */
  isConfigurationValid(): boolean;
  /**
   * Get configuration summary for diagnostics
   * @returns Configuration summary
   */
  getConfigurationSummary(): Record<string, any>;
  /**
   * Merge user settings with defaults
   * @param userSettings - User-provided settings
   * @returns Merged settings
   */
  private mergeWithDefaults;
  /**
   * Validate numeric limit values
   * @param field - Field name
   * @param value - Value to validate
   * @param min - Minimum allowed value
   * @param max - Maximum allowed value
   */
  private validateNumericLimit;
  /**
   * Validate time format (HH:MM)
   * @param field - Field name
   * @param value - Time string to validate
   */
  private validateTimeFormat;
  /**
   * Validate warning thresholds
   * @param field - Field name
   * @param value - Thresholds array to validate
   */
  private validateWarningThresholds;
  /**
   * Validate currency code
   * @param field - Field name
   * @param value - Currency code to validate
   */
  private validateCurrencyCode;
  /**
   * Validate enforcement level
   * @param field - Field name
   * @param value - Enforcement level to validate
   */
  private validateEnforcementLevel;
  /**
   * Validate notification settings
   * @param field - Field name
   * @param value - Notification settings to validate
   */
  private validateNotificationSettings;
  /**
   * Validate user permissions for operation
   * @param requiredPermission - Required permission
   * @throws BudgetConfigAccessError if permission denied
   */
  private validatePermission;
}
/**
 * Factory function to create budget configuration manager
 * @param settings - Initial settings
 * @param securityContext - Security context
 * @returns New configuration manager instance
 */
export declare function createBudgetConfigManager(
  settings?: Partial<BudgetSettings>,
  securityContext?: BudgetSecurityContext,
): BudgetConfigManager;
