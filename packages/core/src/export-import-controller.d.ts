/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Budget Export/Import Controller
 * Handles budget data export in various formats and data import functionality
 * Supports JSON, CSV, Excel, and PDF export formats with customizable templates
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
 * Controller for budget data export and import operations
 */
export declare class ExportImportController {
    private exportTemplates;
    /**
     * Initialize export/import controller
     */
    constructor();
    /**
     * Export budget data in specified format
     * GET /api/budget/export
     */
    exportData(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Import budget data from file
     * POST /api/budget/import
     */
    importData(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Get available export templates
     * GET /api/budget/export/templates
     */
    getExportTemplates(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Collect data for export based on configuration
     */
    private collectExportData;
    /**
     * Generate export based on format and configuration
     */
    private generateExport;
    /**
     * Generate CSV export
     */
    private generateCSVExport;
    /**
     * Generate Excel export (mock implementation)
     */
    private generateExcelExport;
    /**
     * Generate PDF export (mock implementation)
     */
    private generatePDFExport;
    /**
     * Generate analytics data for export
     */
    private generateAnalyticsForExport;
    /**
     * Parse import data from request
     */
    private parseImportData;
    /**
     * Parse CSV import data
     */
    private parseCSVData;
    /**
     * Validate import data
     */
    private validateImportData;
    /**
     * Process import data
     */
    private processImportData;
    /**
     * Import individual record
     */
    private importRecord;
    /**
     * Set appropriate response headers for export
     */
    private setExportHeaders;
    /**
     * Load default export templates
     */
    private loadExportTemplates;
}
export {};
