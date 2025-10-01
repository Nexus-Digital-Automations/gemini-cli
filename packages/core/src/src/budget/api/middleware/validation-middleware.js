/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { getComponentLogger } from '../../../utils/logger.js';
const logger = getComponentLogger('ValidationMiddleware');
/**
 * Main validation middleware factory
 */
export function validateRequest(validator, location = 'body', options = {}) {
    return (req, res, next) => {
        const startTime = Date.now();
        logger.debug('Request validation started', {
            location,
            path: req.path,
            method: req.method,
            options,
            timestamp: new Date().toISOString(),
        });
        try {
            // Extract data to validate based on location
            const dataToValidate = extractValidationData(req, location);
            // Skip validation if data is empty and optional
            if (options.optional &&
                (!dataToValidate || Object.keys(dataToValidate).length === 0)) {
                logger.debug('Skipping validation - optional and no data', {
                    location,
                });
                return next();
            }
            // Run validation
            const validationResult = validator(dataToValidate);
            // Store validation results for audit
            if (!req.validationResults) {
                req.validationResults = {};
            }
            req.validationResults[location] = validationResult;
            if (!validationResult.valid) {
                const validationTime = Date.now() - startTime;
                logger.warn('Request validation failed', {
                    location,
                    errors: validationResult.errors,
                    validationTime,
                    path: req.path,
                    method: req.method,
                });
                const errorResponse = {
                    success: false,
                    error: 'Request validation failed',
                    details: {
                        location,
                        errors: validationResult.errors,
                        receivedData: options.strict ? undefined : dataToValidate,
                    },
                    timestamp: new Date().toISOString(),
                    validationTime,
                };
                res.status(400).json(errorResponse);
                return;
            }
            // Apply sanitization if enabled and validator provided sanitized data
            if (options.sanitize && validationResult.data) {
                if (!req.sanitized) {
                    req.sanitized = {};
                }
                req.sanitized[location] = validationResult.data;
                // Replace original data with sanitized version
                setValidationData(req, location, validationResult.data);
                logger.debug('Data sanitized', {
                    location,
                    originalKeys: Object.keys(dataToValidate || {}),
                    sanitizedKeys: Object.keys(validationResult.data),
                });
            }
            const validationTime = Date.now() - startTime;
            logger.debug('Request validation successful', {
                location,
                validationTime,
                dataKeys: Object.keys(dataToValidate || {}),
                sanitized: options.sanitize,
            });
            next();
        }
        catch (error) {
            const validationTime = Date.now() - startTime;
            logger.error('Validation middleware error', {
                error: error instanceof Error ? error : new Error('Unknown error'),
                validationTime,
                location,
                path: req.path,
                method: req.method,
            });
            res.status(500).json({
                success: false,
                error: 'Validation service error',
                timestamp: new Date().toISOString(),
                validationTime,
            });
        }
    };
}
/**
 * Multi-location validation middleware
 */
export function validateMultiple(validationConfigs) {
    return async (req, res, next) => {
        const startTime = Date.now();
        const allErrors = [];
        logger.debug('Multiple validation started', {
            configurationsCount: validationConfigs.length,
            locations: validationConfigs.map((c) => c.location),
            path: req.path,
        });
        try {
            // Run all validations
            for (const config of validationConfigs) {
                const dataToValidate = extractValidationData(req, config.location);
                // Skip if optional and no data
                if (config.optional &&
                    (!dataToValidate || Object.keys(dataToValidate).length === 0)) {
                    continue;
                }
                const validationResult = config.validator(dataToValidate);
                // Store validation result
                if (!req.validationResults) {
                    req.validationResults = {};
                }
                req.validationResults[config.location] = validationResult;
                if (!validationResult.valid) {
                    // Convert validation errors to detailed format
                    const locationErrors = validationResult.errors.map((error) => ({
                        location: config.location,
                        message: error,
                        value: dataToValidate,
                    }));
                    allErrors.push(...locationErrors);
                    // Stop on first error if strict mode
                    if (config.strict) {
                        break;
                    }
                }
                else if (config.sanitize && validationResult.data) {
                    // Apply sanitization
                    if (!req.sanitized) {
                        req.sanitized = {};
                    }
                    req.sanitized[config.location] = validationResult.data;
                    setValidationData(req, config.location, validationResult.data);
                }
            }
            const validationTime = Date.now() - startTime;
            if (allErrors.length > 0) {
                logger.warn('Multiple validation failed', {
                    errorsCount: allErrors.length,
                    validationTime,
                    path: req.path,
                });
                res.status(400).json({
                    success: false,
                    error: 'Multiple validation failures',
                    details: {
                        totalErrors: allErrors.length,
                        errors: allErrors,
                    },
                    timestamp: new Date().toISOString(),
                    validationTime,
                });
                return;
            }
            logger.debug('Multiple validation successful', {
                validationTime,
                configurationsValidated: validationConfigs.length,
            });
            next();
        }
        catch (error) {
            const validationTime = Date.now() - startTime;
            logger.error('Multiple validation error', {
                error: error instanceof Error ? error : new Error('Unknown error'),
                validationTime,
                path: req.path,
            });
            res.status(500).json({
                success: false,
                error: 'Multiple validation service error',
                timestamp: new Date().toISOString(),
                validationTime,
            });
        }
    };
}
/**
 * Content-Type validation middleware
 */
export function validateContentType(expectedTypes) {
    return (req, res, next) => {
        const contentType = req.get('Content-Type') || '';
        logger.debug('Content-Type validation', {
            received: contentType,
            expected: expectedTypes,
            path: req.path,
        });
        const isValidType = expectedTypes.some((type) => contentType.toLowerCase().includes(type.toLowerCase()));
        if (!isValidType) {
            logger.warn('Invalid Content-Type', {
                received: contentType,
                expected: expectedTypes,
                path: req.path,
            });
            res.status(415).json({
                success: false,
                error: 'Unsupported Media Type',
                details: {
                    received: contentType,
                    expected: expectedTypes,
                },
                timestamp: new Date().toISOString(),
            });
            return;
        }
        next();
    };
}
/**
 * Request size validation middleware
 */
export function validateRequestSize(maxSize = 1024 * 1024) {
    // 1MB default
    return (req, res, next) => {
        const contentLength = parseInt(req.get('Content-Length') || '0', 10);
        logger.debug('Request size validation', {
            contentLength,
            maxSize,
            path: req.path,
        });
        if (contentLength > maxSize) {
            logger.warn('Request too large', {
                contentLength,
                maxSize,
                path: req.path,
            });
            res.status(413).json({
                success: false,
                error: 'Request Entity Too Large',
                details: {
                    received: contentLength,
                    maximum: maxSize,
                },
                timestamp: new Date().toISOString(),
            });
            return;
        }
        next();
    };
}
/**
 * Custom field validation middleware
 */
export function validateCustomFields(fieldValidators) {
    return (req, res, next) => {
        const startTime = Date.now();
        const errors = [];
        logger.debug('Custom field validation', {
            fields: Object.keys(fieldValidators),
            path: req.path,
        });
        try {
            for (const [fieldName, validator] of Object.entries(fieldValidators)) {
                const fieldValue = getNestedProperty(req.body, fieldName);
                if (fieldValue !== undefined && !validator(fieldValue)) {
                    errors.push(`Invalid value for field: ${fieldName}`);
                }
            }
            const validationTime = Date.now() - startTime;
            if (errors.length > 0) {
                logger.warn('Custom field validation failed', {
                    errors,
                    validationTime,
                    path: req.path,
                });
                res.status(400).json({
                    success: false,
                    error: 'Custom field validation failed',
                    details: { errors },
                    timestamp: new Date().toISOString(),
                    validationTime,
                });
                return;
            }
            logger.debug('Custom field validation successful', {
                validationTime,
                fieldsValidated: Object.keys(fieldValidators).length,
            });
            next();
        }
        catch (error) {
            const validationTime = Date.now() - startTime;
            logger.error('Custom field validation error', {
                error: error instanceof Error ? error : new Error('Unknown error'),
                validationTime,
                path: req.path,
            });
            res.status(500).json({
                success: false,
                error: 'Custom validation service error',
                timestamp: new Date().toISOString(),
                validationTime,
            });
        }
    };
}
/**
 * Security validation middleware
 */
export function validateSecurity(options = {}) {
    return (req, res, next) => {
        const startTime = Date.now();
        logger.debug('Security validation', {
            options,
            path: req.path,
        });
        try {
            const securityIssues = [];
            // Check for potential security issues in request data
            const allData = { ...req.body, ...req.query, ...req.params };
            for (const [key, value] of Object.entries(allData)) {
                if (typeof value === 'string') {
                    // XSS prevention
                    if (options.preventXSS && containsXSS(value)) {
                        securityIssues.push(`Potential XSS detected in field: ${key}`);
                    }
                    // SQL injection prevention
                    if (options.preventSQLInjection && containsSQLInjection(value)) {
                        securityIssues.push(`Potential SQL injection detected in field: ${key}`);
                    }
                    // String length validation
                    if (options.maxStringLength &&
                        value.length > options.maxStringLength) {
                        securityIssues.push(`String too long in field: ${key} (${value.length} > ${options.maxStringLength})`);
                    }
                }
            }
            const validationTime = Date.now() - startTime;
            if (securityIssues.length > 0) {
                logger.warn('Security validation failed', {
                    issues: securityIssues,
                    validationTime,
                    path: req.path,
                    ip: req.ip,
                });
                res.status(400).json({
                    success: false,
                    error: 'Security validation failed',
                    details: { issues: securityIssues },
                    timestamp: new Date().toISOString(),
                    validationTime,
                });
                return;
            }
            logger.debug('Security validation passed', {
                validationTime,
                fieldsChecked: Object.keys(allData).length,
            });
            next();
        }
        catch (error) {
            const validationTime = Date.now() - startTime;
            logger.error('Security validation error', {
                error: error instanceof Error ? error : new Error('Unknown error'),
                validationTime,
                path: req.path,
            });
            res.status(500).json({
                success: false,
                error: 'Security validation service error',
                timestamp: new Date().toISOString(),
                validationTime,
            });
        }
    };
}
/**
 * Extract data from request based on location
 */
function extractValidationData(req, location) {
    switch (location) {
        case 'body':
            return req.body;
        case 'query':
            return req.query;
        case 'params':
            return req.params;
        case 'headers':
            return req.headers;
        default:
            return {};
    }
}
/**
 * Set data in request based on location
 */
function setValidationData(req, location, data) {
    switch (location) {
        case 'body':
            req.body = data;
            break;
        case 'query':
            req.query = data;
            break;
        case 'params':
            req.params = data;
            break;
        case 'headers':
            // Headers are read-only, skip setting
            break;
        default:
            // Handle unexpected values
            break;
    }
}
/**
 * Get nested property from object
 */
function getNestedProperty(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}
/**
 * Check for potential XSS patterns
 */
function containsXSS(input) {
    const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe/gi,
        /<object/gi,
        /<embed/gi,
    ];
    return xssPatterns.some((pattern) => pattern.test(input));
}
/**
 * Check for potential SQL injection patterns
 */
function containsSQLInjection(input) {
    const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
        /('|(\\'))|(;|\||`)/gi,
        /((%27)|(''))((%6F)|o|(%4F))((%72)|r|(%52))/gi,
        /((%27)|(''))union/gi,
    ];
    return sqlPatterns.some((pattern) => pattern.test(input));
}
/**
 * Validation middleware composition utility
 */
export function composeValidation(...middlewares) {
    return (req, res, next) => {
        let currentIndex = 0;
        function runNext() {
            if (currentIndex >= middlewares.length) {
                return next();
            }
            const middleware = middlewares[currentIndex++];
            middleware(req, res, runNext);
        }
        runNext();
    };
}
/**
 * Export validation utilities
 */
export const validationUtils = {
    extractValidationData,
    setValidationData,
    getNestedProperty,
    containsXSS,
    containsSQLInjection,
};
//# sourceMappingURL=validation-middleware.js.map