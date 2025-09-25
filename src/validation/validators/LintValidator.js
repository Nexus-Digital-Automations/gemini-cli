/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Lint validation implementation for code quality validation
 * Executes linting rules and validates code quality standards
 *
 * @author Claude Code - Validation Agent
 * @version 1.0.0
 */
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { Logger } from '../../utils/logger.js';
/**
 * Comprehensive lint validation system
 *
 * Features:
 * - ESLint integration with TypeScript support
 * - Prettier formatting validation
 * - Custom rule configuration
 * - Fixable issue detection
 * - Performance optimization
 * - Detailed error reporting
 */
export class LintValidator {
    logger;
    config;
    constructor(config = {}) {
        this.logger = new Logger('LintValidator');
        this.config = {
            maxWarnings: 0,
            enableTypeCheck: true,
            ignorePatterns: ['node_modules/**', 'dist/**', 'build/**', '*.d.ts'],
            ...config
        };
    }
    /**
     * Validate code quality using lint tools
     */
    async validate(context) {
        const startTime = Date.now();
        this.logger.info(`Starting lint validation for task: ${context.taskId}`);
        try {
            // Check if linting tools are available
            await this.checkLintToolsAvailable();
            // Get files to lint from artifacts
            const filesToLint = this.getFilesToLint(context.artifacts);
            if (filesToLint.length === 0) {
                return {
                    criteriaId: 'lint_check',
                    status: 'skipped',
                    score: 100,
                    severity: 'info',
                    message: 'No lintable files found',
                    details: 'No JavaScript/TypeScript files were found in the artifacts',
                    suggestions: ['Add lintable files to enable code quality validation'],
                    evidence: [],
                    timestamp: new Date(),
                    duration: Date.now() - startTime
                };
            }
            // Run ESLint validation
            const eslintResults = await this.runESLint(filesToLint);
            // Run Prettier validation
            const prettierResults = await this.runPrettier(filesToLint);
            // Analyze results and generate report
            const summary = this.analyzeLintResults(eslintResults);
            const score = this.calculateLintScore(summary);
            const status = this.determineLintStatus(summary);
            const result = {
                criteriaId: 'lint_check',
                status,
                score,
                severity: summary.errorCount > 0 ? 'high' : summary.warningCount > (this.config.maxWarnings || 0) ? 'medium' : 'info',
                message: this.generateLintMessage(summary),
                details: this.generateLintDetails(summary, eslintResults, prettierResults),
                suggestions: this.generateLintSuggestions(summary, eslintResults),
                evidence: [
                    {
                        type: 'report',
                        path: 'eslint-results.json',
                        content: JSON.stringify(eslintResults, null, 2),
                        metadata: { tool: 'eslint', fileCount: filesToLint.length }
                    },
                    {
                        type: 'report',
                        path: 'prettier-results.json',
                        content: JSON.stringify(prettierResults, null, 2),
                        metadata: { tool: 'prettier', fileCount: filesToLint.length }
                    }
                ],
                timestamp: new Date(),
                duration: Date.now() - startTime
            };
            this.logger.info(`Lint validation completed`, {
                taskId: context.taskId,
                score,
                status,
                errors: summary.errorCount,
                warnings: summary.warningCount,
                duration: result.duration
            });
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown lint validation error';
            this.logger.error(`Lint validation failed for task: ${context.taskId}`, { error });
            return {
                criteriaId: 'lint_check',
                status: 'failed',
                score: 0,
                severity: 'critical',
                message: 'Lint validation execution failed',
                details: `Error: ${errorMessage}`,
                suggestions: [
                    'Check that ESLint and Prettier are properly installed',
                    'Verify lint configuration files are valid',
                    'Ensure target files are accessible'
                ],
                evidence: [],
                timestamp: new Date(),
                duration: Date.now() - startTime
            };
        }
    }
    /**
     * Check if linting tools are available
     */
    async checkLintToolsAvailable() {
        const toolsToCheck = ['eslint'];
        for (const tool of toolsToCheck) {
            try {
                await this.runCommand(tool, ['--version']);
            }
            catch (error) {
                throw new Error(`Linting tool '${tool}' is not available. Please install it: npm install -D ${tool}`);
            }
        }
    }
    /**
     * Get files to lint from artifacts
     */
    getFilesToLint(artifacts) {
        const lintableExtensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
        return artifacts
            .filter(artifact => artifact.type === 'file')
            .map(artifact => artifact.path)
            .filter(path => lintableExtensions.some(ext => path.endsWith(ext)))
            .filter(path => !this.isIgnored(path));
    }
    /**
     * Check if file path should be ignored
     */
    isIgnored(filePath) {
        const ignorePatterns = this.config.ignorePatterns || [];
        return ignorePatterns.some(pattern => {
            // Simple glob pattern matching
            const regex = new RegExp(pattern
                .replace(/\*\*/g, '.*')
                .replace(/\*/g, '[^/]*')
                .replace(/\?/g, '[^/]'));
            return regex.test(filePath);
        });
    }
    /**
     * Run ESLint on specified files
     */
    async runESLint(filePaths) {
        this.logger.debug(`Running ESLint on ${filePaths.length} files`);
        const eslintArgs = [
            '--format', 'json',
            '--no-eslintrc', // Use only provided config
            '--max-warnings', String(this.config.maxWarnings || 0)
        ];
        // Add config file if specified
        if (this.config.eslintConfigPath) {
            eslintArgs.push('--config', this.config.eslintConfigPath);
        }
        // Add type checking if enabled
        if (this.config.enableTypeCheck) {
            eslintArgs.push('--parser-options', '{"project": "./tsconfig.json"}');
        }
        // Add file paths
        eslintArgs.push(...filePaths);
        try {
            const output = await this.runCommand('eslint', eslintArgs);
            return JSON.parse(output);
        }
        catch (error) {
            // ESLint exits with non-zero code when issues are found
            if (error instanceof Error && 'stdout' in error) {
                try {
                    const results = JSON.parse(error.stdout);
                    return results;
                }
                catch (parseError) {
                    throw new Error(`Failed to parse ESLint output: ${parseError}`);
                }
            }
            throw error;
        }
    }
    /**
     * Run Prettier validation on specified files
     */
    async runPrettier(filePaths) {
        this.logger.debug(`Running Prettier validation on ${filePaths.length} files`);
        const prettierArgs = ['--check'];
        // Add config file if specified
        if (this.config.prettierConfigPath) {
            prettierArgs.push('--config', this.config.prettierConfigPath);
        }
        // Add file paths
        prettierArgs.push(...filePaths);
        try {
            await this.runCommand('prettier', prettierArgs);
            return { formatted: true, errors: [] };
        }
        catch (error) {
            // Prettier exits with non-zero code when files need formatting
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                formatted: false,
                errors: [errorMessage]
            };
        }
    }
    /**
     * Analyze ESLint results and generate summary
     */
    analyzeLintResults(eslintResults) {
        const summary = {
            totalFiles: eslintResults.length,
            errorCount: 0,
            warningCount: 0,
            fixableErrorCount: 0,
            fixableWarningCount: 0,
            passedFiles: 0,
            failedFiles: 0,
            topIssues: []
        };
        const ruleIssues = new Map();
        for (const result of eslintResults) {
            summary.errorCount += result.errorCount;
            summary.warningCount += result.warningCount;
            summary.fixableErrorCount += result.fixableErrorCount;
            summary.fixableWarningCount += result.fixableWarningCount;
            if (result.errorCount > 0) {
                summary.failedFiles++;
            }
            else {
                summary.passedFiles++;
            }
            // Track rule issues
            for (const message of result.messages) {
                if (message.ruleId) {
                    const severity = message.severity === 2 ? 'error' : 'warning';
                    const existing = ruleIssues.get(message.ruleId) || { count: 0, severity };
                    existing.count++;
                    // Upgrade severity if we encounter an error
                    if (severity === 'error') {
                        existing.severity = 'error';
                    }
                    ruleIssues.set(message.ruleId, existing);
                }
            }
        }
        // Get top issues
        summary.topIssues = Array.from(ruleIssues.entries())
            .sort(([, a], [, b]) => b.count - a.count)
            .slice(0, 10)
            .map(([rule, data]) => ({
            rule,
            count: data.count,
            severity: data.severity
        }));
        return summary;
    }
    /**
     * Calculate lint score based on results
     */
    calculateLintScore(summary) {
        if (summary.totalFiles === 0)
            return 100;
        let score = 100;
        // Deduct points for errors (critical)
        score -= (summary.errorCount * 10);
        // Deduct points for warnings (less critical)
        score -= (summary.warningCount * 2);
        // Bonus for fixable issues (easier to resolve)
        const fixableRatio = (summary.fixableErrorCount + summary.fixableWarningCount) /
            Math.max(1, summary.errorCount + summary.warningCount);
        score += (fixableRatio * 5);
        // File-based scoring
        const passedRatio = summary.passedFiles / summary.totalFiles;
        score = Math.max(score * passedRatio, score * 0.1); // At least 10% of calculated score
        return Math.max(0, Math.min(100, Math.round(score * 100) / 100));
    }
    /**
     * Determine validation status based on lint results
     */
    determineLintStatus(summary) {
        if (summary.errorCount > 0) {
            return 'failed';
        }
        else if (summary.warningCount > (this.config.maxWarnings || 0)) {
            return 'requires_review';
        }
        else {
            return 'passed';
        }
    }
    /**
     * Generate lint message
     */
    generateLintMessage(summary) {
        if (summary.errorCount === 0 && summary.warningCount === 0) {
            return `All ${summary.totalFiles} files passed lint validation`;
        }
        const errorMsg = summary.errorCount > 0 ? `${summary.errorCount} errors` : '';
        const warningMsg = summary.warningCount > 0 ? `${summary.warningCount} warnings` : '';
        const issues = [errorMsg, warningMsg].filter(Boolean).join(', ');
        return `Lint validation found ${issues} across ${summary.totalFiles} files`;
    }
    /**
     * Generate detailed lint report
     */
    generateLintDetails(summary, eslintResults, prettierResults) {
        let details = `## Lint Validation Report\n\n`;
        details += `### Summary\n`;
        details += `- Total Files: ${summary.totalFiles}\n`;
        details += `- Passed Files: ${summary.passedFiles}\n`;
        details += `- Failed Files: ${summary.failedFiles}\n`;
        details += `- Errors: ${summary.errorCount}\n`;
        details += `- Warnings: ${summary.warningCount}\n`;
        details += `- Fixable Errors: ${summary.fixableErrorCount}\n`;
        details += `- Fixable Warnings: ${summary.fixableWarningCount}\n\n`;
        if (summary.topIssues.length > 0) {
            details += `### Top Issues\n`;
            for (const issue of summary.topIssues) {
                details += `- **${issue.rule}** (${issue.severity}): ${issue.count} occurrences\n`;
            }
            details += `\n`;
        }
        if (!prettierResults.formatted) {
            details += `### Formatting Issues\n`;
            details += `Files require formatting with Prettier\n`;
            if (prettierResults.errors.length > 0) {
                details += `Errors: ${prettierResults.errors.join(', ')}\n`;
            }
            details += `\n`;
        }
        // Add file-specific details for files with errors
        const filesWithErrors = eslintResults.filter(result => result.errorCount > 0);
        if (filesWithErrors.length > 0) {
            details += `### Files with Errors\n`;
            for (const result of filesWithErrors.slice(0, 10)) { // Limit to top 10
                details += `**${result.filePath}**: ${result.errorCount} errors, ${result.warningCount} warnings\n`;
            }
        }
        return details;
    }
    /**
     * Generate lint improvement suggestions
     */
    generateLintSuggestions(summary, eslintResults) {
        const suggestions = [];
        if (summary.errorCount > 0) {
            suggestions.push('Fix all ESLint errors to improve code quality');
        }
        if (summary.fixableErrorCount > 0 || summary.fixableWarningCount > 0) {
            suggestions.push('Run `eslint --fix` to automatically fix fixable issues');
        }
        if (summary.warningCount > 0) {
            suggestions.push('Address ESLint warnings to maintain code standards');
        }
        // Suggest specific improvements based on common issues
        const topRules = summary.topIssues.slice(0, 3);
        for (const issue of topRules) {
            suggestions.push(`Focus on resolving '${issue.rule}' issues (${issue.count} occurrences)`);
        }
        if (summary.failedFiles > summary.totalFiles * 0.5) {
            suggestions.push('Consider updating ESLint configuration for better project fit');
        }
        if (suggestions.length === 0) {
            suggestions.push('Maintain current code quality standards');
        }
        return suggestions.slice(0, 5); // Limit to top 5 suggestions
    }
    /**
     * Run external command and return output
     */
    runCommand(command, args) {
        return new Promise((resolve, reject) => {
            const child = spawn(command, args, {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            let stdout = '';
            let stderr = '';
            child.stdout?.on('data', (data) => {
                stdout += data.toString();
            });
            child.stderr?.on('data', (data) => {
                stderr += data.toString();
            });
            child.on('close', (code) => {
                if (code === 0) {
                    resolve(stdout);
                }
                else {
                    const error = new Error(`Command '${command}' exited with code ${code}: ${stderr}`);
                    error.stdout = stdout;
                    error.stderr = stderr;
                    error.code = code;
                    reject(error);
                }
            });
            child.on('error', (error) => {
                reject(new Error(`Failed to start command '${command}': ${error.message}`));
            });
        });
    }
}
//# sourceMappingURL=LintValidator.js.map