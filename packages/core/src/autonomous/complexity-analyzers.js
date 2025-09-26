/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { TaskComplexity } from '../task-management/types.js';
/**
 * Analyzes task complexity based on linguistic patterns and keywords
 */
export class LinguisticComplexityAnalyzer {
    name = 'LinguisticComplexityAnalyzer';
    async analyze(request, _context) {
        const factors = [];
        let complexity = TaskComplexity.SIMPLE;
        // Analyze request length
        if (request.length > 200) {
            factors.push({
                factor: 'Long request',
                impact: 'medium',
                description: `Request length: ${request.length} characters`,
                weight: 0.3,
            });
            complexity = TaskComplexity.MODERATE;
        }
        // Analyze sentence complexity
        const sentences = request
            .split(/[.!?]+/)
            .filter((s) => s.trim().length > 0);
        if (sentences.length > 3) {
            factors.push({
                factor: 'Multiple sentences',
                impact: 'medium',
                description: `${sentences.length} sentences detected`,
                weight: 0.4,
            });
            complexity = TaskComplexity.MODERATE;
        }
        // Detect coordination words (and, or, also, then, etc.)
        const coordinationWords = [
            'and',
            'or',
            'also',
            'then',
            'additionally',
            'furthermore',
            'moreover',
            'besides',
        ];
        const coordinationCount = coordinationWords.filter((word) => request.toLowerCase().includes(` ${word} `)).length;
        if (coordinationCount > 2) {
            factors.push({
                factor: 'Multiple coordination words',
                impact: 'high',
                description: `${coordinationCount} coordination words found`,
                weight: 0.5,
            });
            complexity = TaskComplexity.COMPLEX;
        }
        // Detect conditional language
        const conditionalWords = [
            'if',
            'when',
            'unless',
            'depending',
            'based on',
            'in case',
        ];
        const conditionalCount = conditionalWords.filter((word) => request.toLowerCase().includes(word)).length;
        if (conditionalCount > 0) {
            factors.push({
                factor: 'Conditional logic',
                impact: 'high',
                description: `${conditionalCount} conditional expressions found`,
                weight: 0.6,
            });
            complexity = TaskComplexity.COMPLEX;
        }
        // Detect technical terminology density
        const technicalWords = [
            'algorithm',
            'architecture',
            'framework',
            'database',
            'optimization',
            'refactor',
            'integration',
            'deployment',
            'configuration',
            'implementation',
            'validation',
            'authentication',
            'authorization',
            'middleware',
            'api',
        ];
        const techWordCount = technicalWords.filter((word) => request.toLowerCase().includes(word)).length;
        if (techWordCount > 3) {
            factors.push({
                factor: 'High technical density',
                impact: 'medium',
                description: `${techWordCount} technical terms found`,
                weight: 0.4,
            });
        }
        return {
            complexity,
            confidence: factors.length > 0 ? 0.8 : 0.5,
            factors,
            recommendedBreakdown: complexity !== TaskComplexity.SIMPLE,
            estimatedSubtasks: Math.max(1, Math.floor(coordinationCount * 1.5)),
            estimatedDuration: this.estimateDurationFromLinguistics(request, complexity),
        };
    }
    estimateDurationFromLinguistics(request, complexity) {
        const wordCount = request.split(/\s+/).length;
        const baseDuration = Math.max(5, wordCount / 10); // 10 words per minute reading
        switch (complexity) {
            case TaskComplexity.SIMPLE:
                return baseDuration;
            case TaskComplexity.MODERATE:
                return baseDuration * 2;
            case TaskComplexity.COMPLEX:
                return baseDuration * 4;
            case TaskComplexity.HIGHLY_COMPLEX:
                return baseDuration * 8;
            default:
                return baseDuration;
        }
    }
}
/**
 * Analyzes task complexity based on filesystem and workspace context
 */
export class WorkspaceComplexityAnalyzer {
    name = 'WorkspaceComplexityAnalyzer';
    async analyze(request, _context) {
        const factors = [];
        let complexity = TaskComplexity.SIMPLE;
        // Analyze workspace directories count
        const directories = context.workspaceContext.getDirectories();
        if (directories.length > 1) {
            factors.push({
                factor: 'Multiple workspace directories',
                impact: 'medium',
                description: `${directories.length} directories in workspace`,
                weight: 0.3,
            });
            complexity = TaskComplexity.MODERATE;
        }
        // Detect file pattern references
        const filePatterns = [
            /\*\.\w+/g, // *.js, *.ts, etc.
            /\*\*\/\*\.\w+/g, // **/*.js
            /\{[^}]+\}/g, // {src,test}/**
            /\[[^\]]+\]/g, // [0-9]*.txt
        ];
        let patternCount = 0;
        for (const pattern of filePatterns) {
            const matches = request.match(pattern);
            if (matches) {
                patternCount += matches.length;
            }
        }
        if (patternCount > 0) {
            factors.push({
                factor: 'File pattern matching',
                impact: 'medium',
                description: `${patternCount} file patterns detected`,
                weight: 0.4,
            });
            complexity = TaskComplexity.MODERATE;
        }
        // Detect multiple file references
        const fileExtensions = [
            '.js',
            '.ts',
            '.tsx',
            '.jsx',
            '.py',
            '.java',
            '.cpp',
            '.c',
            '.h',
            '.css',
            '.html',
            '.json',
            '.yaml',
            '.yml',
        ];
        const extensionCount = new Set(fileExtensions.filter((ext) => request.toLowerCase().includes(ext))).size;
        if (extensionCount > 2) {
            factors.push({
                factor: 'Multiple file types',
                impact: 'high',
                description: `${extensionCount} different file types referenced`,
                weight: 0.5,
            });
            complexity = TaskComplexity.COMPLEX;
        }
        // Detect directory traversal indicators
        const traversalIndicators = [
            'recursive',
            'subdirectory',
            'nested',
            'deep',
            'hierarchy',
        ];
        const traversalCount = traversalIndicators.filter((indicator) => request.toLowerCase().includes(indicator)).length;
        if (traversalCount > 0) {
            factors.push({
                factor: 'Directory traversal',
                impact: 'medium',
                description: `${traversalCount} traversal indicators found`,
                weight: 0.4,
            });
        }
        return {
            complexity,
            confidence: 0.7,
            factors,
            recommendedBreakdown: complexity !== TaskComplexity.SIMPLE,
            estimatedSubtasks: Math.max(1, directories.length + extensionCount),
            estimatedDuration: this.estimateDurationFromWorkspace(directories.length, extensionCount, complexity),
        };
    }
    estimateDurationFromWorkspace(dirCount, fileTypeCount, complexity) {
        const baseComplexity = dirCount * 5 + fileTypeCount * 3;
        switch (complexity) {
            case TaskComplexity.SIMPLE:
                return Math.max(5, baseComplexity);
            case TaskComplexity.MODERATE:
                return Math.max(15, baseComplexity * 2);
            case TaskComplexity.COMPLEX:
                return Math.max(30, baseComplexity * 4);
            case TaskComplexity.HIGHLY_COMPLEX:
                return Math.max(60, baseComplexity * 8);
            default:
                return Math.max(5, baseComplexity);
        }
    }
}
/**
 * Analyzes task complexity based on available tools and required operations
 */
export class ToolComplexityAnalyzer {
    name = 'ToolComplexityAnalyzer';
    async analyze(request, _context) {
        const factors = [];
        let complexity = TaskComplexity.SIMPLE;
        // Analyze tool requirements
        const toolIndicators = new Map([
            ['read', { impact: 'low', weight: 0.1 }],
            ['write', { impact: 'medium', weight: 0.3 }],
            ['edit', { impact: 'medium', weight: 0.4 }],
            ['delete', { impact: 'high', weight: 0.6 }],
            ['execute', { impact: 'high', weight: 0.7 }],
            ['shell', { impact: 'high', weight: 0.7 }],
            ['grep', { impact: 'low', weight: 0.2 }],
            ['search', { impact: 'low', weight: 0.2 }],
            ['build', { impact: 'high', weight: 0.8 }],
            ['compile', { impact: 'high', weight: 0.8 }],
            ['test', { impact: 'medium', weight: 0.5 }],
            ['deploy', { impact: 'high', weight: 0.9 }],
            ['install', { impact: 'high', weight: 0.6 }],
        ]);
        const requiredTools = new Set();
        let maxWeight = 0;
        for (const [tool, config] of toolIndicators) {
            if (request.toLowerCase().includes(tool)) {
                requiredTools.add(tool);
                maxWeight = Math.max(maxWeight, config.weight);
                factors.push({
                    factor: `Requires ${tool} operation`,
                    impact: config.impact,
                    description: `Tool operation: ${tool}`,
                    weight: config.weight,
                });
            }
        }
        // Determine complexity based on tool requirements
        if (requiredTools.size === 0) {
            complexity = TaskComplexity.SIMPLE;
        }
        else if (requiredTools.size <= 2 && maxWeight <= 0.4) {
            complexity = TaskComplexity.MODERATE;
        }
        else if (requiredTools.size <= 4 && maxWeight <= 0.7) {
            complexity = TaskComplexity.COMPLEX;
        }
        else {
            complexity = TaskComplexity.HIGHLY_COMPLEX;
        }
        // Check for tool combination complexity
        const dangerousCombinations = [
            ['delete', 'execute'],
            ['build', 'deploy'],
            ['edit', 'execute'],
            ['write', 'execute'],
        ];
        for (const [tool1, tool2] of dangerousCombinations) {
            if (requiredTools.has(tool1) && requiredTools.has(tool2)) {
                factors.push({
                    factor: `Dangerous tool combination: ${tool1} + ${tool2}`,
                    impact: 'high',
                    description: `Combination of ${tool1} and ${tool2} requires careful execution`,
                    weight: 0.8,
                });
                complexity = TaskComplexity.COMPLEX;
            }
        }
        // Check for missing tool availability
        const availableTools = new Set(context.availableTools);
        const missingTools = Array.from(requiredTools).filter((tool) => !availableTools.has(tool));
        if (missingTools.length > 0) {
            factors.push({
                factor: 'Missing required tools',
                impact: 'high',
                description: `Missing tools: ${missingTools.join(', ')}`,
                weight: 0.9,
            });
            complexity = TaskComplexity.HIGHLY_COMPLEX;
        }
        return {
            complexity,
            confidence: requiredTools.size > 0 ? 0.9 : 0.3,
            factors,
            recommendedBreakdown: complexity !== TaskComplexity.SIMPLE,
            estimatedSubtasks: Math.max(1, requiredTools.size),
            estimatedDuration: this.estimateDurationFromTools(Array.from(requiredTools), complexity),
        };
    }
    estimateDurationFromTools(tools, complexity) {
        // Base time per tool operation
        const toolTimes = {
            read: 2,
            write: 5,
            edit: 8,
            delete: 3,
            execute: 10,
            shell: 10,
            grep: 3,
            search: 5,
            build: 30,
            compile: 25,
            test: 15,
            deploy: 45,
            install: 20,
        };
        const baseDuration = tools.reduce((total, tool) => total + (toolTimes[tool] || 5), 0);
        switch (complexity) {
            case TaskComplexity.SIMPLE:
                return baseDuration;
            case TaskComplexity.MODERATE:
                return baseDuration * 1.5;
            case TaskComplexity.COMPLEX:
                return baseDuration * 3;
            case TaskComplexity.HIGHLY_COMPLEX:
                return baseDuration * 5;
            default:
                return baseDuration;
        }
    }
}
/**
 * Analyzes task complexity based on dependencies and constraints
 */
export class DependencyComplexityAnalyzer {
    name = 'DependencyComplexityAnalyzer';
    async analyze(request, _context) {
        const factors = [];
        let complexity = TaskComplexity.SIMPLE;
        // Analyze sequential dependency indicators
        const sequentialIndicators = [
            'first',
            'then',
            'after',
            'before',
            'once',
            'following',
            'subsequent',
            'next',
        ];
        const sequentialCount = sequentialIndicators.filter((indicator) => request.toLowerCase().includes(indicator)).length;
        if (sequentialCount > 0) {
            factors.push({
                factor: 'Sequential dependencies',
                impact: 'medium',
                description: `${sequentialCount} sequential indicators found`,
                weight: 0.4,
            });
            complexity = TaskComplexity.MODERATE;
        }
        // Analyze parallel dependency indicators
        const parallelIndicators = [
            'simultaneously',
            'concurrently',
            'at the same time',
            'parallel',
            'together',
        ];
        const parallelCount = parallelIndicators.filter((indicator) => request.toLowerCase().includes(indicator)).length;
        if (parallelCount > 0) {
            factors.push({
                factor: 'Parallel dependencies',
                impact: 'high',
                description: `${parallelCount} parallel indicators found`,
                weight: 0.6,
            });
            complexity = TaskComplexity.COMPLEX;
        }
        // Analyze constraint indicators
        const constraints = context.constraints || [];
        if (constraints.length > 0) {
            factors.push({
                factor: 'External constraints',
                impact: 'high',
                description: `${constraints.length} constraints specified`,
                weight: 0.5,
            });
            complexity = TaskComplexity.COMPLEX;
        }
        // Detect error handling requirements
        const errorHandlingIndicators = [
            'error',
            'exception',
            'failure',
            'fallback',
            'retry',
            'rollback',
        ];
        const errorHandlingCount = errorHandlingIndicators.filter((indicator) => request.toLowerCase().includes(indicator)).length;
        if (errorHandlingCount > 0) {
            factors.push({
                factor: 'Error handling requirements',
                impact: 'high',
                description: `${errorHandlingCount} error handling indicators found`,
                weight: 0.7,
            });
            complexity = TaskComplexity.COMPLEX;
        }
        // Detect validation requirements
        const validationIndicators = [
            'verify',
            'validate',
            'check',
            'ensure',
            'confirm',
            'test',
        ];
        const validationCount = validationIndicators.filter((indicator) => request.toLowerCase().includes(indicator)).length;
        if (validationCount > 2) {
            factors.push({
                factor: 'Complex validation requirements',
                impact: 'medium',
                description: `${validationCount} validation indicators found`,
                weight: 0.4,
            });
        }
        // Check for preference complexity
        const preferences = context.preferences || {};
        let preferenceComplexity = 0;
        if (preferences.maxTaskDepth && preferences.maxTaskDepth > 3) {
            preferenceComplexity += 1;
        }
        if (preferences.maxParallelTasks && preferences.maxParallelTasks > 5) {
            preferenceComplexity += 1;
        }
        if (preferences.preferredExecutionTime &&
            preferences.preferredExecutionTime > 60) {
            preferenceComplexity += 1;
        }
        if (preferenceComplexity > 0) {
            factors.push({
                factor: 'Complex preferences',
                impact: 'medium',
                description: `${preferenceComplexity} complex preferences set`,
                weight: 0.3,
            });
        }
        return {
            complexity,
            confidence: factors.length > 0 ? 0.8 : 0.4,
            factors,
            recommendedBreakdown: complexity !== TaskComplexity.SIMPLE,
            estimatedSubtasks: Math.max(1, sequentialCount + parallelCount + errorHandlingCount),
            estimatedDuration: this.estimateDurationFromDependencies(sequentialCount, parallelCount, errorHandlingCount, complexity),
        };
    }
    estimateDurationFromDependencies(sequential, parallel, errorHandling, complexity) {
        const dependencyComplexity = sequential * 5 + parallel * 10 + errorHandling * 8;
        switch (complexity) {
            case TaskComplexity.SIMPLE:
                return Math.max(5, dependencyComplexity);
            case TaskComplexity.MODERATE:
                return Math.max(15, dependencyComplexity * 2);
            case TaskComplexity.COMPLEX:
                return Math.max(30, dependencyComplexity * 3);
            case TaskComplexity.HIGHLY_COMPLEX:
                return Math.max(60, dependencyComplexity * 5);
            default:
                return Math.max(5, dependencyComplexity);
        }
    }
}
/**
 * Creates and configures default complexity analyzers
 */
export function createDefaultComplexityAnalyzers() {
    return [
        new LinguisticComplexityAnalyzer(),
        new WorkspaceComplexityAnalyzer(),
        new ToolComplexityAnalyzer(),
        new DependencyComplexityAnalyzer(),
    ];
}
//# sourceMappingURL=complexity-analyzers.js.map