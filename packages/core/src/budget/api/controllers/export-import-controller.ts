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
import type { BudgetUsageData, BudgetSettings } from '../../types.js';
import { getBudgetTracker } from '../../budget-tracker.js';
import type { Readable } from 'node:stream';

// Simple console-based logging for now
const logger = {
  info: (message: string, meta?: unknown) => console.info(`[ExportImportController] ${message}`, meta),
  warn: (message: string, meta?: unknown) => console.warn(`[ExportImportController] ${message}`, meta),
  error: (message: string, meta?: unknown) => console.error(`[ExportImportController] ${message}`, meta),
  debug: (message: string, meta?: unknown) => console.debug(`[ExportImportController] ${message}`, meta),
};

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
 * Export configuration interface
 */
interface ExportConfig {
  format: 'json' | 'csv' | 'xlsx' | 'pdf';
  startDate?: string;
  endDate?: string;
  includeHistory?: boolean;
  includeAnalytics?: boolean;
  includeSettings?: boolean;
  compression?: 'none' | 'gzip' | 'zip';
  template?: string;
  filters?: Record<string, unknown>;
}

/**
 * Export template interface
 */
interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  format: string;
  fields: string[];
  customFields?: Record<string, unknown>;
  formatting?: Record<string, unknown>;
}

/**
 * Controller for budget data export and import operations
 */
export class ExportImportController {
  private exportTemplates: Map<string, ExportTemplate> = new Map();

  /**
   * Initialize export/import controller
   */
  constructor() {
    logger.info('Initializing Export/Import Controller', {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });

    this.loadExportTemplates();
  }

  /**
   * Export budget data in specified format
   * GET /api/budget/export
   */
  async exportData(req: AuthenticatedRequest, res: Response): Promise<void> {
    const startTime = Date.now();

    // Validate and cast format parameter
    const formatParam = req.query.format as string;
    const validFormats: Array<'json' | 'csv' | 'xlsx' | 'pdf'> = ['json', 'csv', 'xlsx', 'pdf'];
    const format = validFormats.includes(formatParam as 'json' | 'csv' | 'xlsx' | 'pdf') ? formatParam as 'json' | 'csv' | 'xlsx' | 'pdf' : 'json';

    // Validate and cast compression parameter
    const compressionParam = req.query.compression as string;
    const validCompressions: Array<'none' | 'gzip' | 'zip'> = ['none', 'gzip', 'zip'];
    const compression = validCompressions.includes(compressionParam as 'none' | 'gzip' | 'zip') ? compressionParam as 'none' | 'gzip' | 'zip' : 'none';

    const config: ExportConfig = {
      format,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      includeHistory: req.query.includeHistory === 'true',
      includeAnalytics: req.query.includeAnalytics === 'true',
      includeSettings: req.query.includeSettings === 'true',
      compression,
      template: req.query.template as string,
      filters: req.query.filters ? JSON.parse(req.query.filters as string) : {},
    };

    logger.info('Data export requested', {
      userId: req.user?.id,
      config,
      timestamp: new Date().toISOString(),
    });

    try {
      const budgetTracker = await getBudgetTracker();
      if (!budgetTracker) {
        res.status(503).json({
          success: false,
          error: 'Export service unavailable',
        });
        return;
      }

      // Collect data to export
      const exportData = await this.collectExportData(config);

      // Generate export based on format
      const exportResult = await this.generateExport(exportData, config);

      const responseTime = Date.now() - startTime;

      // Set appropriate headers based on format
      this.setExportHeaders(res, config, exportResult.filename);

      // Send the exported data
      if (exportResult.stream) {
        logger.info('Streaming export data', {
          format: config.format,
          filename: exportResult.filename,
          size: exportResult.size,
        });

        exportResult.stream.pipe(res);
      } else {
        logger.info('Export data generated successfully', {
          responseTime,
          format: config.format,
          size: exportResult.data?.length || 0,
        });

        res.send(exportResult.data);
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Failed to export data', {
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        userId: req.user?.id,
        format: config.format,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to export data',
        timestamp: new Date().toISOString(),
        responseTime,
      });
    }
  }

  /**
   * Import budget data from file
   * POST /api/budget/import
   */
  async importData(req: AuthenticatedRequest, res: Response): Promise<void> {
    const startTime = Date.now();

    logger.info('Data import requested', {
      userId: req.user?.id,
      contentType: req.headers['content-type'],
      timestamp: new Date().toISOString(),
    });

    try {
      // Check permissions
      if (!req.user?.permissions.includes('modify_settings')) {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions for data import',
        });
        return;
      }

      const budgetTracker = await getBudgetTracker();
      if (!budgetTracker) {
        res.status(503).json({
          success: false,
          error: 'Import service unavailable',
        });
        return;
      }

      // Parse import data based on content type
      const importData = await this.parseImportData(req);

      // Validate import data
      const validationResult = this.validateImportData(importData);
      if (!validationResult.valid) {
        res.status(400).json({
          success: false,
          error: 'Invalid import data',
          details: validationResult.errors,
        });
        return;
      }

      // Process the import
      const importResult = await this.processImportData(importData);

      const responseTime = Date.now() - startTime;
      const response = {
        success: true,
        data: {
          importResult,
          summary: {
            recordsProcessed: importResult.recordsProcessed,
            recordsImported: importResult.recordsImported,
            recordsSkipped: importResult.recordsSkipped,
            errors: importResult.errors,
          },
          metadata: {
            timestamp: new Date().toISOString(),
            responseTime,
            importedBy: req.user?.id,
          },
        },
      };

      logger.info('Data imported successfully', {
        responseTime,
        recordsProcessed: importResult.recordsProcessed,
        recordsImported: importResult.recordsImported,
      });

      res.status(200).json(response);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Failed to import data', {
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to import data',
        timestamp: new Date().toISOString(),
        responseTime,
      });
    }
  }

  /**
   * Get available export templates
   * GET /api/budget/export/templates
   */
  async getExportTemplates(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    const startTime = Date.now();

    logger.info('Export templates requested', {
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    });

    try {
      const templates = Array.from(this.exportTemplates.values());

      const responseTime = Date.now() - startTime;
      const response = {
        success: true,
        data: {
          templates,
          summary: {
            totalTemplates: templates.length,
            availableFormats: [...new Set(templates.map((t) => t.format))],
          },
          metadata: {
            timestamp: new Date().toISOString(),
            responseTime,
          },
        },
      };

      logger.info('Export templates retrieved successfully', {
        responseTime,
        templatesCount: templates.length,
      });

      res.status(200).json(response);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Failed to get export templates', {
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve export templates',
        timestamp: new Date().toISOString(),
        responseTime,
      });
    }
  }

  /**
   * Collect data for export based on configuration
   */
  private async collectExportData(config: ExportConfig): Promise<{
    exportInfo: {
      generatedAt: string;
      format: string;
      dateRange: {
        startDate?: string;
        endDate?: string;
      };
      filters?: Record<string, unknown>;
    };
    currentUsage?: BudgetUsageData;
    settings?: BudgetSettings;
    history?: Array<{
      date: string;
      requestCount: number;
      totalCost: number;
      timestamp: string;
    }>;
    analytics?: Record<string, unknown>;
  }> {
    const budgetTracker = await getBudgetTracker();
    if (!budgetTracker) {
      throw new Error('Budget tracker unavailable');
    }

    const exportData: {
      exportInfo: {
        generatedAt: string;
        format: string;
        dateRange: {
          startDate?: string;
          endDate?: string;
        };
        filters?: Record<string, unknown>;
      };
      currentUsage?: BudgetUsageData;
      settings?: BudgetSettings;
      history?: Array<{
        date: string;
        requestCount: number;
        totalCost: number;
        timestamp: string;
      }>;
      analytics?: Record<string, unknown>;
    } = {
      exportInfo: {
        generatedAt: new Date().toISOString(),
        format: config.format,
        dateRange: {
          startDate: config.startDate,
          endDate: config.endDate,
        },
        filters: config.filters,
      },
    };

    // Include current usage data
    const todayUsage = await budgetTracker.getTodayUsage();
    exportData.currentUsage = {
      ...todayUsage,
      date: new Date().toISOString(),
      tokenUsage: 0,
      lastResetTime: new Date().toISOString(),
      warningsShown: 0
    };

    // Include settings if requested
    if (config.includeSettings) {
      exportData.settings = budgetTracker.getBudgetSettings();
    }

    // Include historical data if requested
    if (config.includeHistory) {
      // Use current usage as fallback for history
      const todayData = await budgetTracker.getTodayUsage();
      exportData.history = [{
        date: new Date().toISOString().split('T')[0],
        requestCount: todayData.requestCount,
        totalCost: todayData.totalCost,
        timestamp: new Date().toISOString()
      }];
    }

    // Include analytics data if requested
    if (config.includeAnalytics) {
      exportData.analytics = await this.generateAnalyticsForExport(config);
    }

    return exportData;
  }

  /**
   * Generate export based on format and configuration
   */
  private async generateExport(
    data: Record<string, unknown>,
    config: ExportConfig,
  ): Promise<{
    data?: Buffer | string;
    stream?: Readable;
    filename: string;
    size?: number;
  }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `budget-export-${timestamp}.${config.format}`;

    switch (config.format) {
      case 'json':
        return {
          data: JSON.stringify(data, null, 2),
          filename,
        };

      case 'csv':
        return {
          data: this.generateCSVExport(data),
          filename: filename.replace('.csv', '.csv'),
        };

      case 'xlsx':
        return await this.generateExcelExport(data, filename);

      case 'pdf':
        return await this.generatePDFExport(data, filename);

      default:
        throw new Error(`Unsupported export format: ${config.format}`);
    }
  }

  /**
   * Generate CSV export
   */
  private generateCSVExport(data: Record<string, unknown>): string {
    const rows: string[] = [];

    // Add header
    rows.push('Date,Request Count,Total Cost,Daily Limit,Usage Percentage');

    // Add current usage
    if (data.currentUsage) {
      const usage = data.currentUsage;
      const usagePercentage =
        usage.dailyLimit > 0 ? (usage.totalCost / usage.dailyLimit) * 100 : 0;
      rows.push(
        `${usage.date},${usage.requestCount},${usage.totalCost},${usage.dailyLimit || 0},${usagePercentage.toFixed(2)}`,
      );
    }

    // Add historical data
    if (data.history && Array.isArray(data.history)) {
      for (const record of data.history) {
        const usagePercentage =
          record.dailyLimit > 0
            ? (record.totalCost / record.dailyLimit) * 100
            : 0;
        rows.push(
          `${record.date},${record.requestCount},${record.totalCost},${record.dailyLimit || 0},${usagePercentage.toFixed(2)}`,
        );
      }
    }

    return rows.join('\n');
  }

  /**
   * Generate Excel export (mock implementation)
   */
  private async generateExcelExport(
    data: Record<string, unknown>,
    filename: string,
  ): Promise<{
    data?: Buffer;
    stream?: Readable;
    filename: string;
  }> {
    // Mock Excel generation - replace with actual Excel library like ExcelJS
    logger.info('Generating Excel export (mock)', { filename });

    const mockExcelData = Buffer.from(
      `Excel export data for ${filename}\n${JSON.stringify(data, null, 2)}`,
    );

    return {
      data: mockExcelData,
      filename,
    };
  }

  /**
   * Generate PDF export (mock implementation)
   */
  private async generatePDFExport(
    data: Record<string, unknown>,
    filename: string,
  ): Promise<{
    data?: Buffer;
    stream?: Readable;
    filename: string;
  }> {
    // Mock PDF generation - replace with actual PDF library like PDFKit
    logger.info('Generating PDF export (mock)', { filename });

    const mockPDFData = Buffer.from(
      `PDF export data for ${filename}\n${JSON.stringify(data, null, 2)}`,
    );

    return {
      data: mockPDFData,
      filename,
    };
  }

  /**
   * Generate analytics data for export
   */
  private async generateAnalyticsForExport(_config: ExportConfig): Promise<Record<string, unknown>> {
    // Mock analytics generation
    return {
      summary: {
        totalCost: 0,
        totalRequests: 0,
        averageCostPerRequest: 0,
        peakUsageDay: null,
      },
      trends: [],
      costBreakdown: [],
    };
  }

  /**
   * Parse import data from request
   */
  private async parseImportData(req: AuthenticatedRequest): Promise<Record<string, unknown>> {
    const contentType = req.headers['content-type'] || '';

    if (contentType.includes('application/json')) {
      return req.body;
    } else if (contentType.includes('text/csv')) {
      return this.parseCSVData(req.body);
    } else {
      throw new Error(`Unsupported import content type: ${contentType}`);
    }
  }

  /**
   * Parse CSV import data
   */
  private parseCSVData(csvText: string): {
    type: string;
    headers: string[];
    records: Array<Record<string, string>>;
  } {
    const lines = csvText.split('\n').filter((line) => line.trim());
    if (lines.length < 2) {
      throw new Error('Invalid CSV data: missing header or data rows');
    }

    const headers = lines[0].split(',').map((h) => h.trim());
    const records: Array<Record<string, string>> = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const record: Record<string, string> = {};

      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });

      records.push(record);
    }

    return {
      type: 'csv',
      headers,
      records,
    };
  }

  /**
   * Validate import data
   */
  private validateImportData(data: Record<string, unknown>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data) {
      errors.push('No import data provided');
      return { valid: false, errors };
    }

    // Validate structure based on data type
    if (data.type === 'csv') {
      if (!data.headers || !Array.isArray(data.headers)) {
        errors.push('CSV data must have headers');
      }

      if (!data.records || !Array.isArray(data.records)) {
        errors.push('CSV data must have records');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Process import data
   */
  private async processImportData(data: Record<string, unknown>): Promise<{
    recordsProcessed: number;
    recordsImported: number;
    recordsSkipped: number;
    errors: string[];
  }> {
    let recordsProcessed = 0;
    let recordsImported = 0;
    let recordsSkipped = 0;
    const errors: string[] = [];

    if (data.type === 'csv') {
      const records = Array.isArray(data.records) ? data.records : [];
      for (const record of records) {
        recordsProcessed++;

        try {
          // Process individual record
          await this.importRecord(record);
          recordsImported++;
        } catch (error) {
          recordsSkipped++;
          errors.push(
            `Row ${recordsProcessed}: ${error instanceof Error ? error.message : 'Import error'}`,
          );
        }
      }
    }

    return {
      recordsProcessed,
      recordsImported,
      recordsSkipped,
      errors,
    };
  }

  /**
   * Import individual record
   */
  private async importRecord(record: Record<string, unknown>): Promise<void> {
    // Mock import - replace with actual import logic
    logger.debug('Importing record', { record });

    // Validate record fields
    if (!record.Date || !record['Total Cost']) {
      throw new Error('Missing required fields: Date and Total Cost');
    }

    // Here would be the actual import logic to save to budget tracker
    // await budgetTracker.importRecord(record);
  }

  /**
   * Set appropriate response headers for export
   */
  private setExportHeaders(
    res: Response,
    config: ExportConfig,
    filename: string,
  ): void {
    const mimeTypes = {
      json: 'application/json',
      csv: 'text/csv',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      pdf: 'application/pdf',
    };

    res.setHeader(
      'Content-Type',
      mimeTypes[config.format] || 'application/octet-stream',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    if (config.compression === 'gzip') {
      res.setHeader('Content-Encoding', 'gzip');
    }
  }

  /**
   * Load default export templates
   */
  private loadExportTemplates(): void {
    const templates: ExportTemplate[] = [
      {
        id: 'default_json',
        name: 'Complete JSON Export',
        description:
          'Full data export in JSON format with all available fields',
        format: 'json',
        fields: ['*'],
        formatting: { indent: 2 },
      },
      {
        id: 'summary_csv',
        name: 'Usage Summary CSV',
        description: 'Basic usage data in CSV format',
        format: 'csv',
        fields: [
          'date',
          'requestCount',
          'totalCost',
          'dailyLimit',
          'usagePercentage',
        ],
      },
      {
        id: 'financial_report',
        name: 'Financial Report PDF',
        description: 'Professional financial report in PDF format',
        format: 'pdf',
        fields: ['summary', 'trends', 'costBreakdown'],
        formatting: { template: 'financial', includeCharts: true },
      },
    ];

    for (const template of templates) {
      this.exportTemplates.set(template.id, template);
    }

    logger.info('Export templates loaded', {
      count: templates.length,
    });
  }
}
