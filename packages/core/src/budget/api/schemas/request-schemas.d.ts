/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Base validation result interface
 */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    data?: any;
}
/**
 * Base validator function type
 */
export type SchemaValidator = (data: any) => ValidationResult;
/**
 * Usage request schema validator
 */
export declare const usageRequestSchema: SchemaValidator;
/**
 * Configuration request schema validator
 */
export declare const configurationRequestSchema: SchemaValidator;
/**
 * Analytics request schema validator
 */
export declare const analyticsRequestSchema: SchemaValidator;
/**
 * Export request schema validator
 */
export declare const exportRequestSchema: SchemaValidator;
/**
 * Notification request schema validator
 */
export declare const notificationRequestSchema: SchemaValidator;
/**
 * Export all schemas for easy importing
 */
export declare const schemas: {
    usageRequestSchema: SchemaValidator;
    configurationRequestSchema: SchemaValidator;
    analyticsRequestSchema: SchemaValidator;
    exportRequestSchema: SchemaValidator;
    notificationRequestSchema: SchemaValidator;
};
