/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { execAsync } from '../utils/ProcessUtils.js';
import { Logger } from '../logger/Logger.js';
import { ValidationSeverity, ValidationStatus, ValidationCategory, } from './ValidationFramework.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
/**
 * Code quality validation automation system
 * Handles linting, formatting, and security scanning
 */
export class CodeQualityValidator {
    logger;
    config;
    constructor(config) {
        this.logger = new Logger('CodeQualityValidator');
        this.config = {
            enabledLinters: ['eslint', 'prettier'],
            securityScanners: ['semgrep'],
            ...config,
        };
        this.logger.info('CodeQualityValidator initialized', {
            enabledLinters: this.config.enabledLinters,
            securityScanners: this.config.securityScanners,
        });
    }
    /**
     * Main validation executor for code quality
     */
    async validateCodeQuality(context) {
        const results = [];
        this.logger.info('Starting code quality validation', {
            taskId: context.taskId,
            files: context.files?.length || 0,
        });
        try {
            // Run linting validations
            if (this.config.enabledLinters.includes('eslint')) {
                const eslintResults = await this.runESLint(context);
                results.push(...eslintResults);
            }
            if (this.config.enabledLinters.includes('prettier')) {
                const prettierResults = await this.runPrettier(context);
                results.push(...prettierResults);
            }
            if (this.config.enabledLinters.includes('typescript')) {
                const typescriptResults = await this.runTypeScript(context);
                results.push(...typescriptResults);
            }
            // Run security scans
            for (const scanner of this.config.securityScanners) {
                const securityResults = await this.runSecurityScanner(scanner, context);
                results.push(...securityResults);
            }
            // Run custom rules
            if (this.config.customRules) {
                const customResults = await this.runCustomRules(context);
                results.push(...customResults);
            }
            this.logger.info('Code quality validation completed', {
                taskId: context.taskId,
                totalResults: results.length,
                errors: results.filter((r) => r.severity === ValidationSeverity.ERROR)
                    .length,
            });
            return results;
        }
        catch (error) {
            this.logger.error('Code quality validation failed', {
                error,
                taskId: context.taskId,
            });
            return [
                {
                    id: `code-quality-error-${Date.now()}`,
                    category: ValidationCategory.SYNTAX,
                    severity: ValidationSeverity.ERROR,
                    status: ValidationStatus.FAILED,
                    message: `Code quality validation failed: ${error.message}`,
                    timestamp: new Date(),
                    metadata: { error: error.stack },
                },
            ];
        }
    }
    /**
     * Run ESLint validation
     */
    async runESLint(context) {
        const startTime = Date.now();
        const results = [];
        try {
            this.logger.debug('Running ESLint validation');
            // Determine files to lint
            const filesToLint = context.files?.filter((f) => f.endsWith('.ts') ||
                f.endsWith('.tsx') ||
                f.endsWith('.js') ||
                f.endsWith('.jsx')) || [];
            if (filesToLint.length === 0) {
                return [
                    {
                        id: `eslint-no-files-${Date.now()}`,
                        category: ValidationCategory.SYNTAX,
                        severity: ValidationSeverity.INFO,
                        status: ValidationStatus.SKIPPED,
                        message: 'No TypeScript/JavaScript files to lint',
                        timestamp: new Date(),
                        duration: Date.now() - startTime,
                    },
                ];
            }
            // Build ESLint command
            const configFlag = this.config.eslintConfigPath
                ? `--config ${this.config.eslintConfigPath}`
                : '';
            const command = `npx eslint ${configFlag} --format json ${filesToLint.join(' ')}`;
            const { stdout } = await execAsync(command, { timeout: 120000 });
            const eslintResults = JSON.parse(stdout || '[]');
            // Convert ESLint results to ValidationResults
            for (const fileResult of eslintResults) {
                for (const message of fileResult.messages) {
                    const severity = message.severity === 2
                        ? ValidationSeverity.ERROR
                        : ValidationSeverity.WARNING;
                    results.push({
                        id: `eslint-${fileResult.filePath}-${message.line}-${message.column}-${Date.now()}`,
                        category: ValidationCategory.SYNTAX,
                        severity,
                        status: ValidationStatus.FAILED,
                        message: message.message,
                        file: fileResult.filePath,
                        line: message.line,
                        column: message.column,
                        rule: message.ruleId,
                        timestamp: new Date(),
                        duration: Date.now() - startTime,
                    });
                }
            }
            // Add success result if no issues found
            if (results.length === 0) {
                results.push({
                    id: `eslint-success-${Date.now()}`,
                    category: ValidationCategory.SYNTAX,
                    severity: ValidationSeverity.INFO,
                    status: ValidationStatus.PASSED,
                    message: `ESLint validation passed for ${filesToLint.length} files`,
                    timestamp: new Date(),
                    duration: Date.now() - startTime,
                    metadata: { filesLinted: filesToLint.length },
                });
            }
            return results;
        }
        catch (error) {
            this.logger.error('ESLint validation failed', { error });
            return [
                {
                    id: `eslint-error-${Date.now()}`,
                    category: ValidationCategory.SYNTAX,
                    severity: ValidationSeverity.ERROR,
                    status: ValidationStatus.FAILED,
                    message: `ESLint execution failed: ${error.message}`,
                    timestamp: new Date(),
                    duration: Date.now() - startTime,
                },
            ];
        }
    }
    /**
     * Run Prettier validation
     */
    async runPrettier(context) {
        const startTime = Date.now();
        const results = [];
        try {
            this.logger.debug('Running Prettier validation');
            // Determine files to check
            const filesToCheck = context.files?.filter((f) => f.endsWith('.ts') ||
                f.endsWith('.tsx') ||
                f.endsWith('.js') ||
                f.endsWith('.jsx') ||
                f.endsWith('.json') ||
                f.endsWith('.md')) || [];
            if (filesToCheck.length === 0) {
                return [
                    {
                        id: `prettier-no-files-${Date.now()}`,
                        category: ValidationCategory.SYNTAX,
                        severity: ValidationSeverity.INFO,
                        status: ValidationStatus.SKIPPED,
                        message: 'No files to check with Prettier',
                        timestamp: new Date(),
                        duration: Date.now() - startTime,
                    },
                ];
            }
            // Run Prettier check
            const configFlag = this.config.prettierConfigPath
                ? `--config ${this.config.prettierConfigPath}`
                : '';
            const command = `npx prettier ${configFlag} --check ${filesToCheck.join(' ')}`;
            try {
                await execAsync(command, { timeout: 60000 });
                // Success - all files are properly formatted
                results.push({
                    id: `prettier-success-${Date.now()}`,
                    category: ValidationCategory.SYNTAX,
                    severity: ValidationSeverity.INFO,
                    status: ValidationStatus.PASSED,
                    message: `Prettier validation passed for ${filesToCheck.length} files`,
                    timestamp: new Date(),
                    duration: Date.now() - startTime,
                    metadata: { filesChecked: filesToCheck.length },
                });
            }
            catch (error) {
                // Parse Prettier output to identify unformatted files
                const stderr = error.stderr || '';
                const unformattedFiles = stderr
                    .split('\n')
                    .filter((line) => line.trim() && !line.includes('Code style issues found'));
                for (const file of unformattedFiles) {
                    if (file.trim()) {
                        results.push({
                            id: `prettier-format-${file}-${Date.now()}`,
                            category: ValidationCategory.SYNTAX,
                            severity: ValidationSeverity.WARNING,
                            status: ValidationStatus.FAILED,
                            message: 'File is not properly formatted',
                            file: file.trim(),
                            timestamp: new Date(),
                            duration: Date.now() - startTime,
                        });
                    }
                }
                if (results.length === 0) {
                    results.push({
                        id: `prettier-error-${Date.now()}`,
                        category: ValidationCategory.SYNTAX,
                        severity: ValidationSeverity.ERROR,
                        status: ValidationStatus.FAILED,
                        message: `Prettier check failed: ${error.message}`,
                        timestamp: new Date(),
                        duration: Date.now() - startTime,
                    });
                }
            }
            return results;
        }
        catch (error) {
            this.logger.error('Prettier validation failed', { error });
            return [
                {
                    id: `prettier-error-${Date.now()}`,
                    category: ValidationCategory.SYNTAX,
                    severity: ValidationSeverity.ERROR,
                    status: ValidationStatus.FAILED,
                    message: `Prettier execution failed: ${error.message}`,
                    timestamp: new Date(),
                    duration: Date.now() - startTime,
                },
            ];
        }
    }
    /**
     * Run TypeScript compiler validation
     */
    async runTypeScript(context) {
        const startTime = Date.now();
        try {
            this.logger.debug('Running TypeScript validation');
            const command = 'npx tsc --noEmit --pretty false';
            await execAsync(command, { timeout: 180000 });
            // Success - no TypeScript errors
            return [
                {
                    id: `typescript-success-${Date.now()}`,
                    category: ValidationCategory.SYNTAX,
                    severity: ValidationSeverity.INFO,
                    status: ValidationStatus.PASSED,
                    message: 'TypeScript compilation successful',
                    timestamp: new Date(),
                    duration: Date.now() - startTime,
                },
            ];
        }
        catch (error) {
            const stderr = error.stderr || '';
            const results = [];
            // Parse TypeScript errors
            const errorLines = stderr
                .split('\n')
                .filter((line) => line.includes(': error TS'));
            for (const errorLine of errorLines) {
                const match = errorLine.match(/^(.+?)\((\d+),(\d+)\): error TS(\d+): (.+)$/);
                if (match) {
                    const [, file, line, column, errorCode, message] = match;
                    results.push({
                        id: `typescript-${file}-${line}-${column}-${Date.now()}`,
                        category: ValidationCategory.SYNTAX,
                        severity: ValidationSeverity.ERROR,
                        status: ValidationStatus.FAILED,
                        message,
                        file,
                        line: parseInt(line, 10),
                        column: parseInt(column, 10),
                        rule: `TS${errorCode}`,
                        timestamp: new Date(),
                        duration: Date.now() - startTime,
                    });
                }
            }
            if (results.length === 0) {
                results.push({
                    id: `typescript-error-${Date.now()}`,
                    category: ValidationCategory.SYNTAX,
                    severity: ValidationSeverity.ERROR,
                    status: ValidationStatus.FAILED,
                    message: `TypeScript compilation failed: ${error.message}`,
                    timestamp: new Date(),
                    duration: Date.now() - startTime,
                });
            }
            return results;
        }
    }
    /**
     * Run security scanner validation
     */
    async runSecurityScanner(scanner, context) {
        const startTime = Date.now();
        try {
            this.logger.debug(`Running ${scanner} security scan`);
            let command;
            switch (scanner.toLowerCase()) {
                case 'semgrep':
                    command = 'semgrep --config=p/security-audit --json .';
                    break;
                case 'bandit':
                    command = 'bandit -r . -f json';
                    break;
                default:
                    throw new Error(`Unsupported security scanner: ${scanner}`);
            }
            const { stdout } = await execAsync(command, { timeout: 300000 });
            const scanResults = JSON.parse(stdout || '{}');
            const results = [];
            // Parse Semgrep results
            if (scanner.toLowerCase() === 'semgrep' && scanResults.results) {
                for (const result of scanResults.results) {
                    const severity = this.mapSemgrepSeverity(result.extra?.severity || 'INFO');
                    results.push({
                        id: `semgrep-${result.path}-${result.start?.line}-${Date.now()}`,
                        category: ValidationCategory.SECURITY,
                        severity,
                        status: ValidationStatus.FAILED,
                        message: result.extra?.message || 'Security issue detected',
                        file: result.path,
                        line: result.start?.line,
                        column: result.start?.col,
                        rule: result.check_id,
                        timestamp: new Date(),
                        duration: Date.now() - startTime,
                        metadata: {
                            scanner,
                            confidence: result.extra?.metadata?.confidence,
                            impact: result.extra?.metadata?.impact,
                        },
                    });
                }
            }
            // Add success result if no issues found
            if (results.length === 0) {
                results.push({
                    id: `${scanner}-success-${Date.now()}`,
                    category: ValidationCategory.SECURITY,
                    severity: ValidationSeverity.INFO,
                    status: ValidationStatus.PASSED,
                    message: `${scanner} security scan found no issues`,
                    timestamp: new Date(),
                    duration: Date.now() - startTime,
                    metadata: { scanner },
                });
            }
            return results;
        }
        catch (error) {
            this.logger.error(`${scanner} security scan failed`, { error });
            return [
                {
                    id: `${scanner}-error-${Date.now()}`,
                    category: ValidationCategory.SECURITY,
                    severity: ValidationSeverity.WARNING,
                    status: ValidationStatus.FAILED,
                    message: `${scanner} execution failed: ${error.message}`,
                    timestamp: new Date(),
                    duration: Date.now() - startTime,
                    metadata: { scanner },
                },
            ];
        }
    }
    /**
     * Run custom validation rules
     */
    async runCustomRules(context) {
        if (!this.config.customRules || !context.files) {
            return [];
        }
        const startTime = Date.now();
        const results = [];
        for (const rule of this.config.customRules) {
            for (const filePath of context.files) {
                try {
                    const content = await fs.readFile(filePath, 'utf-8');
                    const lines = content.split('\n');
                    lines.forEach((line, lineNumber) => {
                        if (rule.pattern.test(line)) {
                            results.push({
                                id: `custom-${rule.id}-${filePath}-${lineNumber}-${Date.now()}`,
                                category: ValidationCategory.LOGIC,
                                severity: rule.severity,
                                status: ValidationStatus.FAILED,
                                message: rule.message,
                                file: filePath,
                                line: lineNumber + 1,
                                rule: rule.id,
                                timestamp: new Date(),
                                duration: Date.now() - startTime,
                            });
                        }
                    });
                }
                catch (error) {
                    this.logger.warn(`Failed to read file for custom rule validation: ${filePath}`, { error });
                }
            }
        }
        return results;
    }
    /**
     * Map Semgrep severity to ValidationSeverity
     */
    mapSemgrepSeverity(semgrepSeverity) {
        switch (semgrepSeverity.toUpperCase()) {
            case 'ERROR':
                return ValidationSeverity.ERROR;
            case 'WARNING':
                return ValidationSeverity.WARNING;
            case 'INFO':
                return ValidationSeverity.INFO;
            default:
                return ValidationSeverity.WARNING;
        }
    }
    /**
     * Get supported linters
     */
    getSupportedLinters() {
        return ['eslint', 'prettier', 'typescript'];
    }
    /**
     * Get supported security scanners
     */
    getSupportedSecurityScanners() {
        return ['semgrep', 'bandit'];
    }
}
//# sourceMappingURL=CodeQualityValidator.js.map