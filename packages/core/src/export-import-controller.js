/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { getBudgetTracker } from '../../budget-tracker.js';
// Simple console-based logging for now
const logger = {
    info: (message, meta) => console.info(`[ExportImportController] ${message}`, meta),
    warn: (message, meta) => console.warn(`[ExportImportController] ${message}`, meta),
    error: (message, meta) => console.error(`[ExportImportController] ${message}`, meta),
    debug: (message, meta) => console.debug(`[ExportImportController] ${message}`, meta),
};
/**
 * Controller for budget data export and import operations
 */
export class ExportImportController {
    exportTemplates = new Map();
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
    async exportData(req, res) {
        const startTime = Date.now();
        // Validate and cast format parameter
        const formatParam = req.query.format;
        const validFormats = ['json', 'csv', 'xlsx', 'pdf'];
        const format = validFormats.includes(formatParam) ? formatParam : 'json';
        // Validate and cast compression parameter
        const compressionParam = req.query.compression;
        const validCompressions = ['none', 'gzip', 'zip'];
        const compression = validCompressions.includes(compressionParam) ? compressionParam : 'none';
        const config = {
            format,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            includeHistory: req.query.includeHistory === 'true',
            includeAnalytics: req.query.includeAnalytics === 'true',
            includeSettings: req.query.includeSettings === 'true',
            compression,
            template: req.query.template,
            filters: req.query.filters ? JSON.parse(req.query.filters) : {},
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
            }
            else {
                logger.info('Export data generated successfully', {
                    responseTime,
                    format: config.format,
                    size: exportResult.data?.length || 0,
                });
                res.send(exportResult.data);
            }
        }
        catch (error) {
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
    async importData(req, res) {
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
        }
        catch (error) {
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
    async getExportTemplates(req, res) {
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
        }
        catch (error) {
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
    async collectExportData(config) {
        const budgetTracker = await getBudgetTracker();
        if (!budgetTracker) {
            throw new Error('Budget tracker unavailable');
        }
        const exportData = {
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
            tokenUsage: {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
                tokenCosts: {
                    input: 0,
                    output: 0
                }
            },
            lastResetTime: new Date().toISOString(),
            warningsShown: []
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
    async generateExport(data, config) {
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
    generateCSVExport(data) {
        const rows = [];
        // Add header
        rows.push('Date,Request Count,Total Cost,Daily Limit,Usage Percentage');
        // Add current usage
        if (data.currentUsage) {
            const usage = data.currentUsage;
            // Type guard for usage properties
            const hasRequiredProps = typeof usage === 'object' && usage !== null &&
                'date' in usage && 'requestCount' in usage && 'totalCost' in usage;
            if (hasRequiredProps) {
                const usageRecord = usage;
                const dailyLimit = Number(usageRecord.dailyLimit) || 0;
                const totalCost = Number(usageRecord.totalCost) || 0;
                const usagePercentage = dailyLimit > 0 ? (totalCost / dailyLimit) * 100 : 0;
                rows.push(`${String(usageRecord.date)},${String(usageRecord.requestCount)},${totalCost},${dailyLimit},${usagePercentage.toFixed(2)}`);
            }
        }
        // Add historical data
        if (data.history && Array.isArray(data.history)) {
            for (const record of data.history) {
                // Type guard for record properties
                const hasRequiredProps = typeof record === 'object' && record !== null &&
                    'date' in record && 'requestCount' in record && 'totalCost' in record;
                if (hasRequiredProps) {
                    const recordData = record;
                    const dailyLimit = Number(recordData.dailyLimit) || 0;
                    const totalCost = Number(recordData.totalCost) || 0;
                    const usagePercentage = dailyLimit > 0 ? (totalCost / dailyLimit) * 100 : 0;
                    rows.push(`${String(recordData.date)},${String(recordData.requestCount)},${totalCost},${dailyLimit},${usagePercentage.toFixed(2)}`);
                }
            }
        }
        return rows.join('\n');
    }
    /**
     * Generate Excel export (mock implementation)
     */
    async generateExcelExport(data, filename) {
        // Mock Excel generation - replace with actual Excel library like ExcelJS
        logger.info('Generating Excel export (mock)', { filename });
        const mockExcelData = Buffer.from(`Excel export data for ${filename}\n${JSON.stringify(data, null, 2)}`);
        return {
            data: mockExcelData,
            filename,
        };
    }
    /**
     * Generate PDF export (mock implementation)
     */
    async generatePDFExport(data, filename) {
        // Mock PDF generation - replace with actual PDF library like PDFKit
        logger.info('Generating PDF export (mock)', { filename });
        const mockPDFData = Buffer.from(`PDF export data for ${filename}\n${JSON.stringify(data, null, 2)}`);
        return {
            data: mockPDFData,
            filename,
        };
    }
    /**
     * Generate analytics data for export
     */
    async generateAnalyticsForExport(_config) {
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
    async parseImportData(req) {
        const contentType = req.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
            return req.body;
        }
        else if (contentType.includes('text/csv')) {
            return this.parseCSVData(req.body);
        }
        else {
            throw new Error(`Unsupported import content type: ${contentType}`);
        }
    }
    /**
     * Parse CSV import data
     */
    parseCSVData(csvText) {
        const lines = csvText.split('\n').filter((line) => line.trim());
        if (lines.length < 2) {
            throw new Error('Invalid CSV data: missing header or data rows');
        }
        const headers = lines[0].split(',').map((h) => h.trim());
        const records = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map((v) => v.trim());
            const record = {};
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
    validateImportData(data) {
        const errors = [];
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
    async processImportData(data) {
        let recordsProcessed = 0;
        let recordsImported = 0;
        let recordsSkipped = 0;
        const errors = [];
        if (data.type === 'csv') {
            const records = Array.isArray(data.records) ? data.records : [];
            for (const record of records) {
                recordsProcessed++;
                try {
                    // Process individual record
                    await this.importRecord(record);
                    recordsImported++;
                }
                catch (error) {
                    recordsSkipped++;
                    errors.push(`Row ${recordsProcessed}: ${error instanceof Error ? error.message : 'Import error'}`);
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
    async importRecord(record) {
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
    setExportHeaders(res, config, filename) {
        const mimeTypes = {
            json: 'application/json',
            csv: 'text/csv',
            xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            pdf: 'application/pdf',
        };
        res.setHeader('Content-Type', mimeTypes[config.format] || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        if (config.compression === 'gzip') {
            res.setHeader('Content-Encoding', 'gzip');
        }
    }
    /**
     * Load default export templates
     */
    loadExportTemplates() {
        const templates = [
            {
                id: 'default_json',
                name: 'Complete JSON Export',
                description: 'Full data export in JSON format with all available fields',
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
//# sourceMappingURL=export-import-controller.js.map