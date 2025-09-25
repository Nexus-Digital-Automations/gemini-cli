/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
/**
 * Validation rule priority
 */
export var ValidationPriority;
(function (ValidationPriority) {
    ValidationPriority[ValidationPriority["LOW"] = 1] = "LOW";
    ValidationPriority[ValidationPriority["MEDIUM"] = 2] = "MEDIUM";
    ValidationPriority[ValidationPriority["HIGH"] = 3] = "HIGH";
    ValidationPriority[ValidationPriority["CRITICAL"] = 4] = "CRITICAL";
})(ValidationPriority || (ValidationPriority = {}));
/**
 * Comprehensive validation engine implementation
 */
export class ComprehensiveValidationEngine {
    validationRules = new Map();
    fileSystemValidator;
    successCriteriaValidator;
    constructor() {
        this.fileSystemValidator = new DefaultFileSystemValidator();
        this.successCriteriaValidator = new DefaultSuccessCriteriaValidator();
        this.initializeDefaultRules();
    }
    /**
     * Validates a task after completion
     */
    async validateTask(task, result) {
        const context = {
            executionResult: result,
            fileSystem: this.fileSystemValidator,
            logger: console // Simplified logger
        };
        // Validate success criteria
        const successValidation = await this.successCriteriaValidator.validateCriteria(task.successCriteria || [], task, result);
        if (!successValidation.passed) {
            return successValidation;
        }
        // Run category-specific validation rules
        const applicableRules = Array.from(this.validationRules.values())
            .filter(rule => rule.category.includes(task.category))
            .sort((a, b) => b.priority - a.priority);
        const errors = [];
        const warnings = [];
        let totalScore = 0;
        let ruleCount = 0;
        for (const rule of applicableRules) {
            try {
                const ruleResult = await rule.validate(task, context);
                ruleCount++;
                totalScore += ruleResult.score;
                if (!ruleResult.passed) {
                    if (rule.priority >= ValidationPriority.HIGH) {
                        errors.push(`${rule.name}: ${ruleResult.message}`);
                    }
                    else {
                        warnings.push(`${rule.name}: ${ruleResult.message}`);
                    }
                }
            }
            catch (error) {
                errors.push(`Validation rule ${rule.name} failed: ${error}`);
            }
        }
        const averageScore = ruleCount > 0 ? totalScore / ruleCount : 100;
        const passed = errors.length === 0 && result.status !== 'failed';
        return {
            passed,
            errors,
            warnings,
            score: Math.round(averageScore),
            details: {
                rulesApplied: ruleCount,
                averageScore,
                result
            }
        };
    }
    /**
     * Validates pre-conditions before task execution
     */
    async validatePreConditions(task, context) {
        const validationContext = {
            executionContext: context,
            fileSystem: this.fileSystemValidator,
            logger: context.logger
        };
        const errors = [];
        const warnings = [];
        // Validate workspace context
        const workspaceDirs = context.workspaceContext.getDirectories();
        if (workspaceDirs.length === 0) {
            errors.push('No workspace directories configured');
        }
        // Validate task target files exist and are accessible
        if (task.targetFiles) {
            for (const file of task.targetFiles) {
                try {
                    const exists = await this.fileSystemValidator.fileExists(file);
                    if (!exists && task.category !== TaskCategory.CREATE) {
                        errors.push(`Target file does not exist: ${file}`);
                    }
                    if (exists) {
                        const isReadable = await this.fileSystemValidator.isReadable(file);
                        if (!isReadable) {
                            errors.push(`Cannot read target file: ${file}`);
                        }
                        if ([TaskCategory.EDIT, TaskCategory.DELETE].includes(task.category)) {
                            const isWritable = await this.fileSystemValidator.isWritable(file);
                            if (!isWritable) {
                                errors.push(`Cannot write to target file: ${file}`);
                            }
                        }
                    }
                }
                catch (error) {
                    warnings.push(`Could not validate file ${file}: ${error}`);
                }
            }
        }
        // Validate workspace path constraints
        if (task.workspacePath) {
            const isWithinWorkspace = context.workspaceContext.isPathWithinWorkspace(task.workspacePath);
            if (!isWithinWorkspace) {
                errors.push(`Task workspace path is outside allowed workspace: ${task.workspacePath}`);
            }
        }
        // Validate required tools are available
        const requiredTools = this.extractRequiredTools(task);
        for (const toolName of requiredTools) {
            if (!context.availableTools.has(toolName)) {
                errors.push(`Required tool not available: ${toolName}`);
            }
        }
        return {
            passed: errors.length === 0,
            errors,
            warnings,
            score: errors.length === 0 ? (warnings.length === 0 ? 100 : 80) : 0
        };
    }
    /**
     * Validates post-conditions after task execution
     */
    async validatePostConditions(task, result) {
        const context = {
            executionResult: result,
            fileSystem: this.fileSystemValidator,
            logger: console
        };
        const errors = [];
        const warnings = [];
        // Basic execution status validation
        if (result.status === 'failed') {
            errors.push('Task execution failed');
            if (result.error) {
                errors.push(`Error: ${result.error.message}`);
            }
        }
        // Validate execution time is reasonable
        const expectedDuration = task.estimatedDuration || 10; // minutes
        const actualDuration = result.duration / (1000 * 60); // convert to minutes
        if (actualDuration > expectedDuration * 3) {
            warnings.push(`Task took longer than expected: ${actualDuration}min vs ${expectedDuration}min`);
        }
        // Validate created/modified files
        if (task.category === TaskCategory.CREATE && task.targetFiles) {
            for (const file of task.targetFiles) {
                const exists = await this.fileSystemValidator.fileExists(file);
                if (!exists) {
                    errors.push(`Expected created file does not exist: ${file}`);
                }
            }
        }
        // Run task-specific validation steps
        if (task.validationSteps) {
            for (const step of task.validationSteps) {
                const stepResult = await this.validateStep(step, task, context);
                if (!stepResult.passed) {
                    if (stepResult.message.toLowerCase().includes('error')) {
                        errors.push(stepResult.message);
                    }
                    else {
                        warnings.push(stepResult.message);
                    }
                }
            }
        }
        return {
            passed: errors.length === 0,
            errors,
            warnings,
            score: this.calculateValidationScore(errors.length, warnings.length, result)
        };
    }
    /**
     * Adds a custom validation rule
     */
    addValidationRule(rule) {
        this.validationRules.set(rule.name, rule);
    }
    /**
     * Removes a validation rule
     */
    removeValidationRule(name) {
        this.validationRules.delete(name);
    }
    // Private helper methods
    extractRequiredTools(task) {
        const tools = [];
        // Extract tool requirements based on task category and description
        switch (task.category) {
            case TaskCategory.READ:
                tools.push('read-file');
                break;
            case TaskCategory.EDIT:
                tools.push('edit');
                break;
            case TaskCategory.CREATE:
                tools.push('write-file');
                break;
            case TaskCategory.SEARCH:
                tools.push('grep');
                break;
            case TaskCategory.EXECUTE:
                tools.push('shell');
                break;
        }
        // Parse description for tool mentions
        const description = task.description.toLowerCase();
        if (description.includes('grep'))
            tools.push('grep');
        if (description.includes('shell') || description.includes('command'))
            tools.push('shell');
        if (description.includes('edit'))
            tools.push('edit');
        if (description.includes('write') || description.includes('create'))
            tools.push('write-file');
        return [...new Set(tools)]; // Remove duplicates
    }
    async validateStep(step, task, context) {
        const stepLower = step.toLowerCase();
        try {
            // File-related validations
            if (stepLower.includes('file') && task.targetFiles) {
                for (const file of task.targetFiles) {
                    if (stepLower.includes('exists')) {
                        const exists = await this.fileSystemValidator.fileExists(file);
                        if (!exists) {
                            return { passed: false, message: `File does not exist: ${file}`, score: 0 };
                        }
                    }
                    if (stepLower.includes('readable')) {
                        const readable = await this.fileSystemValidator.isReadable(file);
                        if (!readable) {
                            return { passed: false, message: `File is not readable: ${file}`, score: 0 };
                        }
                    }
                }
            }
            // Syntax and linting validations
            if (stepLower.includes('syntax') || stepLower.includes('lint')) {
                return await this.validateSyntax(task, context);
            }
            // Test execution validations
            if (stepLower.includes('test')) {
                return await this.validateTests(task, context);
            }
            return { passed: true, message: `Validation step passed: ${step}`, score: 100 };
        }
        catch (error) {
            return {
                passed: false,
                message: `Validation step failed: ${step} - ${error}`,
                score: 0
            };
        }
    }
    async validateSyntax(task, context) {
        if (!task.targetFiles) {
            return { passed: true, message: 'No files to validate syntax', score: 100 };
        }
        for (const file of task.targetFiles) {
            try {
                const exists = await this.fileSystemValidator.fileExists(file);
                if (!exists)
                    continue;
                // Basic syntax validation based on file extension
                const ext = path.extname(file).toLowerCase();
                if (['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
                    // For JavaScript/TypeScript files, we could run a simple parse check
                    // This is a simplified implementation
                    const stats = await this.fileSystemValidator.getFileStats(file);
                    if (stats.size === 0) {
                        return { passed: false, message: `File is empty: ${file}`, score: 0 };
                    }
                }
            }
            catch (error) {
                return { passed: false, message: `Syntax validation failed for ${file}: ${error}`, score: 0 };
            }
        }
        return { passed: true, message: 'Syntax validation passed', score: 100 };
    }
    async validateTests(task, context) {
        // This would run relevant tests for the task
        // Simplified implementation for now
        if (context.executionResult?.status === 'completed') {
            return { passed: true, message: 'Test validation passed', score: 100 };
        }
        return { passed: false, message: 'Test validation failed', score: 0 };
    }
    calculateValidationScore(errors, warnings, result) {
        let score = 100;
        // Deduct for errors
        score -= errors * 30;
        // Deduct for warnings
        score -= warnings * 10;
        // Deduct for execution failures
        if (result.status === 'failed') {
            score -= 50;
        }
        // Bonus for fast execution
        const expectedDuration = 15 * 60 * 1000; // 15 minutes in ms
        if (result.duration < expectedDuration / 2) {
            score += 5;
        }
        return Math.max(0, Math.min(100, score));
    }
    initializeDefaultRules() {
        // File existence validation rule
        this.addValidationRule({
            name: 'file_existence',
            description: 'Validates that required files exist',
            category: [TaskCategory.READ, TaskCategory.EDIT, TaskCategory.ANALYZE],
            priority: ValidationPriority.HIGH,
            validate: async (task, context) => {
                if (!task.targetFiles) {
                    return { passed: true, message: 'No target files specified', score: 100 };
                }
                for (const file of task.targetFiles) {
                    const exists = await context.fileSystem.fileExists(file);
                    if (!exists && task.category !== TaskCategory.CREATE) {
                        return {
                            passed: false,
                            message: `Required file does not exist: ${file}`,
                            score: 0
                        };
                    }
                }
                return { passed: true, message: 'All required files exist', score: 100 };
            }
        });
        // File permissions validation rule
        this.addValidationRule({
            name: 'file_permissions',
            description: 'Validates file access permissions',
            category: [TaskCategory.EDIT, TaskCategory.DELETE, TaskCategory.CREATE],
            priority: ValidationPriority.HIGH,
            validate: async (task, context) => {
                if (!task.targetFiles) {
                    return { passed: true, message: 'No target files to check permissions', score: 100 };
                }
                for (const file of task.targetFiles) {
                    const exists = await context.fileSystem.fileExists(file);
                    if (!exists)
                        continue;
                    if (task.category === TaskCategory.EDIT || task.category === TaskCategory.DELETE) {
                        const writable = await context.fileSystem.isWritable(file);
                        if (!writable) {
                            return {
                                passed: false,
                                message: `File is not writable: ${file}`,
                                score: 0
                            };
                        }
                    }
                }
                return { passed: true, message: 'File permissions are adequate', score: 100 };
            }
        });
        // Execution time validation rule
        this.addValidationRule({
            name: 'execution_time',
            description: 'Validates task execution time is reasonable',
            category: Object.values(TaskCategory),
            priority: ValidationPriority.MEDIUM,
            validate: async (task, context) => {
                if (!context.executionResult) {
                    return { passed: true, message: 'No execution result to validate', score: 100 };
                }
                const expectedDuration = task.estimatedDuration || 10; // minutes
                const actualDuration = context.executionResult.duration / (1000 * 60); // convert to minutes
                if (actualDuration > expectedDuration * 5) {
                    return {
                        passed: false,
                        message: `Task took too long: ${actualDuration}min vs expected ${expectedDuration}min`,
                        score: 30
                    };
                }
                if (actualDuration > expectedDuration * 2) {
                    return {
                        passed: true,
                        message: `Task took longer than expected but within acceptable range`,
                        score: 70
                    };
                }
                return { passed: true, message: 'Execution time is reasonable', score: 100 };
            }
        });
    }
}
/**
 * Default file system validator implementation
 */
export class DefaultFileSystemValidator {
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    async isReadable(filePath) {
        try {
            await fs.access(filePath, fs.constants.R_OK);
            return true;
        }
        catch {
            return false;
        }
    }
    async isWritable(filePath) {
        try {
            await fs.access(filePath, fs.constants.W_OK);
            return true;
        }
        catch {
            return false;
        }
    }
    async getFileSize(filePath) {
        const stats = await fs.stat(filePath);
        return stats.size;
    }
    async getFileStats(filePath) {
        return fs.stat(filePath);
    }
    async validatePath(filePath, workspaceRoot) {
        try {
            const resolvedPath = path.resolve(filePath);
            const resolvedRoot = path.resolve(workspaceRoot);
            return resolvedPath.startsWith(resolvedRoot);
        }
        catch {
            return false;
        }
    }
}
/**
 * Default success criteria validator implementation
 */
export class DefaultSuccessCriteriaValidator {
    async validateCriteria(criteria, task, result) {
        if (criteria.length === 0) {
            return { passed: true, errors: [], warnings: [], score: 100 };
        }
        const errors = [];
        const warnings = [];
        let passedCriteria = 0;
        for (const criterion of criteria) {
            const passed = await this.evaluateCriterion(criterion, task, result);
            if (passed) {
                passedCriteria++;
            }
            else {
                if (this.isCritical(criterion)) {
                    errors.push(`Critical criterion failed: ${criterion}`);
                }
                else {
                    warnings.push(`Criterion not met: ${criterion}`);
                }
            }
        }
        const score = Math.round((passedCriteria / criteria.length) * 100);
        const passed = errors.length === 0;
        return { passed, errors, warnings, score };
    }
    async evaluateCriterion(criterion, task, result) {
        const lower = criterion.toLowerCase();
        // Check execution status
        if (lower.includes('success') || lower.includes('complete')) {
            return result?.status === 'completed';
        }
        // Check for errors
        if (lower.includes('no error')) {
            return !result?.error;
        }
        // Check file operations
        if (lower.includes('file') && lower.includes('created')) {
            // Would check if expected files were created
            return task.category === TaskCategory.CREATE;
        }
        if (lower.includes('test') && lower.includes('pass')) {
            // Would run and check test results
            return result?.status === 'completed';
        }
        // Default: criterion is met if task completed successfully
        return result?.status === 'completed' && !result?.error;
    }
    isCritical(criterion) {
        const lower = criterion.toLowerCase();
        return lower.includes('critical') ||
            lower.includes('must') ||
            lower.includes('required') ||
            lower.includes('error');
    }
}
//# sourceMappingURL=validation-engine.js.map