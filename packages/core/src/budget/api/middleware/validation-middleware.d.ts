/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Request Validation Middleware
 * Provides comprehensive input validation for all Budget API endpoints
 * Uses schema validators with detailed error reporting and sanitization
 *
 * @author Claude Code - Budget Management API Endpoints Agent
 * @version 1.0.0
 */
import type { Request, Response, NextFunction } from 'express';
import type {
  SchemaValidator,
  ValidationResult,
} from '../schemas/request-schemas.js';
/**
 * Request validation location type
 */
type ValidationLocation = 'body' | 'query' | 'params' | 'headers';
/**
 * Validation configuration interface
 */
interface ValidationConfig {
  location: ValidationLocation;
  validator: SchemaValidator;
  optional?: boolean;
  sanitize?: boolean;
  strict?: boolean;
}
/**
 * Enhanced request interface with validation metadata
 */
interface ValidatedRequest extends Request {
  validationResults?: {
    [key in ValidationLocation]?: ValidationResult;
  };
  sanitized?: {
    [key in ValidationLocation]?: any;
  };
}
/**
 * Main validation middleware factory
 */
export declare function validateRequest(
  validator: SchemaValidator,
  location?: ValidationLocation,
  options?: {
    optional?: boolean;
    sanitize?: boolean;
    strict?: boolean;
  },
): (req: ValidatedRequest, res: Response, next: NextFunction) => void;
/**
 * Multi-location validation middleware
 */
export declare function validateMultiple(
  validationConfigs: ValidationConfig[],
): (req: ValidatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Content-Type validation middleware
 */
export declare function validateContentType(
  expectedTypes: string[],
): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Request size validation middleware
 */
export declare function validateRequestSize(
  maxSize?: number,
): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Custom field validation middleware
 */
export declare function validateCustomFields(
  fieldValidators: Record<string, (value: any) => boolean>,
): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Security validation middleware
 */
export declare function validateSecurity(options?: {
  preventXSS?: boolean;
  preventSQLInjection?: boolean;
  sanitizeHtml?: boolean;
  maxStringLength?: number;
}): (req: ValidatedRequest, res: Response, next: NextFunction) => void;
export {};
