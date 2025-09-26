/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Budget Configuration Controller
 * Handles all budget configuration management operations including
 * settings retrieval, updates, validation, and reset functionality
 *
 * @author Claude Code - Budget Management API Endpoints Agent
 * @version 1.0.0
 */
import type { Request, Response } from 'express';
/**
 * Enhanced request interface with user context
 */
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        permissions: string[];
    };
    sessionId?: string;
}
/**
 * Controller for budget configuration management endpoints
 */
export declare class ConfigurationController {
    /**
     * Initialize configuration controller with logging
     */
    constructor();
    /**
     * Get current budget configuration
     * GET /api/budget/config
     */
    getConfiguration(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Update budget configuration
     * POST /api/budget/config
     */
    updateConfiguration(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Reset configuration to defaults
     * POST /api/budget/config/reset
     */
    resetConfiguration(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Validate configuration without applying changes
     * GET /api/budget/config/validate
     */
    validateConfiguration(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Parse query parameters to appropriate types
     */
    private parseQueryParameters;
    /**
     * Compare configurations and identify changes
     */
    private getConfigurationChanges;
}
export {};
