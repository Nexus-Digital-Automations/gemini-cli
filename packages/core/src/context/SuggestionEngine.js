/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Context-Aware Suggestion Engine
 * Leverages historical context for intelligent suggestions and workflow optimization
 *
 * @author Claude Code - Advanced Context Retention Agent
 * @version 1.0.0
 */
import { getComponentLogger } from '../utils/logger.js';
import { ContextPrioritizer } from './ContextPrioritizer.js';
const logger = getComponentLogger('suggestion-engine');
/**
 * Default configuration for suggestion engine
 */
export const DEFAULT_SUGGESTION_CONFIG = {
    minConfidenceThreshold: 0.3,
    maxSuggestions: 10,
    enablePatternLearning: true,
    enableWorkflowOptimization: true,
    enableErrorPrevention: true,
    historicalWeight: 0.4,
    currentContextWeight: 0.4,
    userPatternWeight: 0.2,
};
/**
 * Context-Aware Suggestion Engine
 *
 * The SuggestionEngine leverages historical context to provide intelligent suggestions
 * for workflow optimization, error prevention, and task completion. It learns from
 * user interaction patterns and provides contextually relevant recommendations.
 *
 * Key Features:
 * - Pattern Recognition: Learns from past user interactions and workflows
 * - Contextual Completions: Provides suggestions based on current project context
 * - Workflow Optimization: Identifies and suggests more efficient task sequences
 * - Error Prevention: Warns about potential issues based on historical context
 * - Adaptive Learning: Continuously improves suggestions based on user feedback
 *
 * @example
 * ```typescript
 * const suggestionEngine = new SuggestionEngine();
 * await suggestionEngine.learnFromSession(sessionContext);
 * const suggestions = await suggestionEngine.getSuggestions(currentContext, 'code');
 * console.log(`Generated ${suggestions.length} suggestions`);
 * ```
 */
export class SuggestionEngine {
    config;
    interactionPatterns = new Map();
    workflowOptimizations = new Map();
    errorPatterns = new Map();
    userFeedback = new Map();
    contextPrioritizer;
    constructor(config = {}) {
        this.config = { ...DEFAULT_SUGGESTION_CONFIG, ...config };
        this.contextPrioritizer = new ContextPrioritizer();
        logger.info('SuggestionEngine initialized', {
            minConfidence: this.config.minConfidenceThreshold,
            maxSuggestions: this.config.maxSuggestions,
            features: {
                patternLearning: this.config.enablePatternLearning,
                workflowOptimization: this.config.enableWorkflowOptimization,
                errorPrevention: this.config.enableErrorPrevention,
            },
        });
    }
    /**
     * Generate contextual suggestions based on current state
     */
    async getSuggestions(currentContext, contextType = 'workflow', codeContext) {
        const startTime = performance.now();
        logger.debug(`Generating ${contextType} suggestions`, {
            contextLength: currentContext.length,
        });
        try {
            const suggestions = [];
            // Generate different types of suggestions based on context type
            switch (contextType) {
                case 'command':
                    suggestions.push(...(await this.generateCommandSuggestions(currentContext)));
                    break;
                case 'code':
                    suggestions.push(...(await this.generateCodeSuggestions(currentContext, codeContext)));
                    break;
                case 'workflow':
                    suggestions.push(...(await this.generateWorkflowSuggestions(currentContext)));
                    break;
                case 'optimization':
                    suggestions.push(...(await this.generateOptimizationSuggestions(currentContext, codeContext)));
                    break;
                case 'debug':
                    suggestions.push(...(await this.generateDebugSuggestions(currentContext, codeContext)));
                    break;
                default:
                    // Default to workflow suggestions if unknown type
                    suggestions.push(...(await this.generateWorkflowSuggestions(currentContext)));
                    break;
            }
            // Filter by confidence threshold and limit results
            const filteredSuggestions = suggestions
                .filter((suggestion) => suggestion.confidence >= this.config.minConfidenceThreshold)
                .sort((a, b) => b.confidence - a.confidence)
                .slice(0, this.config.maxSuggestions);
            const duration = performance.now() - startTime;
            logger.info(`Generated ${filteredSuggestions.length} suggestions in ${duration.toFixed(2)}ms`, {
                type: contextType,
                avgConfidence: filteredSuggestions.reduce((sum, s) => sum + s.confidence, 0) /
                    filteredSuggestions.length || 0,
            });
            return filteredSuggestions;
        }
        catch (error) {
            logger.error('Failed to generate suggestions', { error, contextType });
            return [];
        }
    }
    /**
     * Generate command suggestions based on current context
     */
    async generateCommandSuggestions(currentContext) {
        const suggestions = [];
        // Analyze current context for command patterns
        const contextLower = currentContext.toLowerCase();
        // Common CLI command patterns
        const commandPatterns = [
            {
                keywords: ['error', 'failed', 'broken'],
                suggestions: [
                    { command: 'npm run lint', reason: 'Check for code quality issues' },
                    { command: 'npm run typecheck', reason: 'Verify TypeScript types' },
                    { command: 'git status', reason: 'Check repository status' },
                ],
            },
            {
                keywords: ['test', 'testing', 'spec'],
                suggestions: [
                    { command: 'npm test', reason: 'Run test suite' },
                    { command: 'npm run test:watch', reason: 'Run tests in watch mode' },
                    {
                        command: 'npm run test:coverage',
                        reason: 'Generate coverage report',
                    },
                ],
            },
            {
                keywords: ['build', 'compile', 'bundle'],
                suggestions: [
                    { command: 'npm run build', reason: 'Build the project' },
                    { command: 'npm run start', reason: 'Start the application' },
                    { command: 'npm run dev', reason: 'Start development server' },
                ],
            },
            {
                keywords: ['install', 'dependency', 'package'],
                suggestions: [
                    { command: 'npm install', reason: 'Install dependencies' },
                    {
                        command: 'npm audit',
                        reason: 'Check for security vulnerabilities',
                    },
                    { command: 'npm outdated', reason: 'Check for outdated packages' },
                ],
            },
        ];
        for (const pattern of commandPatterns) {
            const hasKeywords = pattern.keywords.some((keyword) => contextLower.includes(keyword));
            if (hasKeywords) {
                for (const commandSuggestion of pattern.suggestions) {
                    const historicalSuccess = this.getCommandSuccessRate(commandSuggestion.command);
                    suggestions.push({
                        type: 'command',
                        suggestion: commandSuggestion.command,
                        confidence: Math.min(0.9, 0.6 + historicalSuccess * 0.3),
                        reasoning: commandSuggestion.reason,
                        historicalContext: this.getRelatedHistoricalCommands(commandSuggestion.command),
                        estimatedBenefit: this.estimateCommandBenefit(commandSuggestion.command),
                    });
                }
            }
        }
        // Add pattern-based suggestions from learned interactions
        if (this.config.enablePatternLearning) {
            suggestions.push(...this.generatePatternBasedCommandSuggestions(currentContext));
        }
        return suggestions;
    }
    /**
     * Generate code suggestions based on current context
     */
    async generateCodeSuggestions(currentContext, codeContext) {
        const suggestions = [];
        if (!codeContext) {
            return suggestions;
        }
        // Analyze current functions and suggest improvements
        const contextLower = currentContext.toLowerCase();
        // Function-level suggestions
        for (const func of codeContext.activeFunctions) {
            if (func.complexity > 10) {
                suggestions.push({
                    type: 'code',
                    suggestion: `Refactor ${func.name} to reduce complexity (current: ${func.complexity})`,
                    confidence: 0.8,
                    reasoning: 'High complexity functions are harder to maintain and test',
                    historicalContext: [
                        `Function complexity: ${func.complexity}`,
                        `Lines of code: ${func.lineCount}`,
                    ],
                    estimatedBenefit: 'Improved maintainability and reduced bug risk',
                    warnings: ['Refactoring may require updating tests'],
                });
            }
            if (func.lineCount > 100 && func.dependencies.length > 10) {
                suggestions.push({
                    type: 'code',
                    suggestion: `Break down ${func.name} into smaller, focused functions`,
                    confidence: 0.7,
                    reasoning: 'Large functions with many dependencies violate single responsibility principle',
                    historicalContext: [
                        `Function size: ${func.lineCount} lines`,
                        `Dependencies: ${func.dependencies.length}`,
                    ],
                    estimatedBenefit: 'Better code organization and testability',
                });
            }
        }
        // Project structure suggestions
        const hasTests = Object.keys(codeContext.testCoverage.sourceToTest).length > 0;
        if (!hasTests) {
            suggestions.push({
                type: 'code',
                suggestion: 'Add unit tests for core functionality',
                confidence: 0.9,
                reasoning: 'No test coverage detected - tests improve code reliability',
                historicalContext: ['Zero test files found'],
                estimatedBenefit: 'Reduced bugs and improved confidence in changes',
            });
        }
        else {
            // Check coverage for specific files
            const uncoveredFiles = Object.entries(codeContext.testCoverage.coverage)
                .filter(([, coverage]) => coverage < 0.5)
                .map(([file]) => file);
            if (uncoveredFiles.length > 0) {
                suggestions.push({
                    type: 'code',
                    suggestion: `Add tests for files with low coverage: ${uncoveredFiles.slice(0, 3).join(', ')}`,
                    confidence: 0.7,
                    reasoning: 'Low test coverage increases risk of undetected bugs',
                    historicalContext: [
                        `${uncoveredFiles.length} files under 50% coverage`,
                    ],
                    estimatedBenefit: 'Better bug detection and safer refactoring',
                });
            }
        }
        // Dependency suggestions
        const externalDeps = Object.keys(codeContext.dependencies).filter((dep) => !dep.startsWith('./'));
        if (externalDeps.length > 50) {
            suggestions.push({
                type: 'code',
                suggestion: 'Review and minimize external dependencies',
                confidence: 0.6,
                reasoning: 'Large number of dependencies increases security risk and bundle size',
                historicalContext: [`${externalDeps.length} external dependencies`],
                estimatedBenefit: 'Reduced bundle size and security surface',
                warnings: ['Carefully review dependency removal impact'],
            });
        }
        // Context-specific code suggestions
        if (contextLower.includes('performance')) {
            suggestions.push(...this.generatePerformanceSuggestions(codeContext));
        }
        if (contextLower.includes('security')) {
            suggestions.push(...this.generateSecuritySuggestions(codeContext));
        }
        return suggestions;
    }
    /**
     * Generate workflow optimization suggestions
     */
    async generateWorkflowSuggestions(currentContext) {
        const suggestions = [];
        if (!this.config.enableWorkflowOptimization) {
            return suggestions;
        }
        // Analyze for common workflow patterns
        const contextLower = currentContext.toLowerCase();
        // Development workflow suggestions
        if (contextLower.includes('development') ||
            contextLower.includes('coding')) {
            const devOptimizations = this.identifyDevelopmentWorkflowOptimizations(currentContext);
            suggestions.push(...devOptimizations);
        }
        // Testing workflow suggestions
        if (contextLower.includes('test') || contextLower.includes('quality')) {
            const testOptimizations = this.identifyTestingWorkflowOptimizations(currentContext);
            suggestions.push(...testOptimizations);
        }
        // Deployment workflow suggestions
        if (contextLower.includes('deploy') || contextLower.includes('release')) {
            const deployOptimizations = this.identifyDeploymentWorkflowOptimizations(currentContext);
            suggestions.push(...deployOptimizations);
        }
        // Add learned workflow optimizations
        for (const optimization of this.workflowOptimizations.values()) {
            const contextRelevance = this.calculateContextRelevance(currentContext, optimization.description);
            if (contextRelevance > 0.5) {
                suggestions.push({
                    type: 'workflow',
                    suggestion: optimization.description,
                    confidence: optimization.confidence * contextRelevance,
                    reasoning: `Optimized workflow can save ${optimization.timeSavings}`,
                    historicalContext: [
                        `Current: ${optimization.currentWorkflow.join(' → ')}`,
                        `Optimized: ${optimization.optimizedWorkflow.join(' → ')}`,
                    ],
                    estimatedBenefit: optimization.timeSavings,
                });
            }
        }
        return suggestions;
    }
    /**
     * Generate optimization suggestions
     */
    async generateOptimizationSuggestions(currentContext, codeContext) {
        const suggestions = [];
        if (!codeContext) {
            return suggestions;
        }
        // Code optimization suggestions
        const duplicatedLogic = this.identifyDuplicatedCode(codeContext);
        if (duplicatedLogic.length > 0) {
            suggestions.push({
                type: 'optimization',
                suggestion: `Extract common logic into shared utilities: ${duplicatedLogic.join(', ')}`,
                confidence: 0.8,
                reasoning: 'Duplicated code increases maintenance burden and bug risk',
                historicalContext: [
                    `${duplicatedLogic.length} instances of duplicated logic found`,
                ],
                estimatedBenefit: 'Reduced code duplication and easier maintenance',
            });
        }
        // Performance optimizations
        const largeFunctions = codeContext.activeFunctions.filter((f) => f.lineCount > 200);
        if (largeFunctions.length > 0) {
            suggestions.push({
                type: 'optimization',
                suggestion: `Consider lazy loading or code splitting for large functions: ${largeFunctions.map((f) => f.name).join(', ')}`,
                confidence: 0.6,
                reasoning: 'Large functions may impact initial load performance',
                historicalContext: [
                    `${largeFunctions.length} functions over 200 lines`,
                ],
                estimatedBenefit: 'Improved initial load performance',
            });
        }
        // Architecture optimizations
        const highCouplingFunctions = codeContext.activeFunctions.filter((f) => f.dependencies.length > 15);
        if (highCouplingFunctions.length > 0) {
            suggestions.push({
                type: 'optimization',
                suggestion: 'Review and reduce coupling in highly dependent functions',
                confidence: 0.7,
                reasoning: 'High coupling makes code harder to test and modify',
                historicalContext: [
                    `${highCouplingFunctions.length} functions with >15 dependencies`,
                ],
                estimatedBenefit: 'Better testability and modularity',
                warnings: ['Architectural changes may require significant refactoring'],
            });
        }
        return suggestions;
    }
    /**
     * Generate debug suggestions
     */
    async generateDebugSuggestions(currentContext, codeContext) {
        const suggestions = [];
        const contextLower = currentContext.toLowerCase();
        // Error-specific debugging suggestions
        if (contextLower.includes('error') || contextLower.includes('bug')) {
            suggestions.push({
                type: 'debug',
                suggestion: 'Enable verbose logging and check console output',
                confidence: 0.9,
                reasoning: 'Detailed logging often reveals the root cause of errors',
                historicalContext: ['Standard debugging practice'],
                estimatedBenefit: 'Faster error identification',
            });
            suggestions.push({
                type: 'debug',
                suggestion: 'Check recent code changes that might have introduced the issue',
                confidence: 0.8,
                reasoning: 'Recent changes are the most likely source of new bugs',
                historicalContext: ['Git blame analysis recommended'],
                estimatedBenefit: 'Targeted debugging approach',
            });
        }
        // Performance debugging
        if (contextLower.includes('slow') || contextLower.includes('performance')) {
            suggestions.push({
                type: 'debug',
                suggestion: 'Profile application performance to identify bottlenecks',
                confidence: 0.8,
                reasoning: 'Performance profiling reveals actual bottlenecks vs assumptions',
                historicalContext: ['Use browser dev tools or Node.js profiler'],
                estimatedBenefit: 'Data-driven performance optimization',
            });
        }
        // Code-specific debugging
        if (codeContext) {
            const recentChanges = codeContext.recentChanges.slice(0, 5);
            if (recentChanges.length > 0) {
                suggestions.push({
                    type: 'debug',
                    suggestion: `Review recent changes in: ${recentChanges.map((c) => c.filePath).join(', ')}`,
                    confidence: 0.7,
                    reasoning: 'Recent file modifications are prime suspects for new issues',
                    historicalContext: [
                        `${recentChanges.length} files modified recently`,
                    ],
                    estimatedBenefit: 'Focused investigation scope',
                });
            }
        }
        return suggestions;
    }
    /**
     * Learn from user session to improve future suggestions
     */
    async learnFromSession(session) {
        if (!this.config.enablePatternLearning) {
            return;
        }
        const startTime = performance.now();
        logger.debug('Learning from session', { sessionId: session.sessionId });
        try {
            // Extract interaction patterns from the session
            const patterns = this.extractInteractionPatterns(session);
            // Update pattern database
            for (const pattern of patterns) {
                const existing = this.interactionPatterns.get(pattern.id);
                if (existing) {
                    existing.frequency += 1;
                    existing.lastObserved = new Date();
                    // Update success rate based on session outcome
                    existing.successRate =
                        (existing.successRate + pattern.successRate) / 2;
                }
                else {
                    this.interactionPatterns.set(pattern.id, pattern);
                }
            }
            // Learn workflow optimizations
            const optimizations = this.identifyWorkflowOptimizations(session);
            for (const optimization of optimizations) {
                this.workflowOptimizations.set(optimization.id, optimization);
            }
            // Learn error patterns for prevention
            const errorPatterns = this.extractErrorPatterns(session);
            for (const errorPattern of errorPatterns) {
                const existing = this.errorPatterns.get(errorPattern.id);
                if (existing) {
                    existing.frequency += 1;
                }
                else {
                    this.errorPatterns.set(errorPattern.id, errorPattern);
                }
            }
            const duration = performance.now() - startTime;
            logger.info(`Learned from session in ${duration.toFixed(2)}ms`, {
                sessionId: session.sessionId,
                newPatterns: patterns.length,
                newOptimizations: optimizations.length,
                newErrorPatterns: errorPatterns.length,
            });
        }
        catch (error) {
            logger.error('Failed to learn from session', {
                error,
                sessionId: session.sessionId,
            });
        }
    }
    /**
     * Record user feedback on suggestions to improve future recommendations
     */
    recordFeedback(suggestionId, suggestion, accepted) {
        this.userFeedback.set(suggestionId, { suggestion, accepted });
        // Update confidence scores based on feedback
        if (accepted) {
            this.reinforcePositivePattern(suggestion);
        }
        else {
            this.reduceNegativePattern(suggestion);
        }
        logger.debug('Recorded suggestion feedback', {
            suggestionId,
            accepted,
            type: suggestion.type,
        });
    }
    /**
     * Extract interaction patterns from session
     */
    extractInteractionPatterns(session) {
        const patterns = [];
        // Analyze conversation for command sequences
        const commands = this.extractCommandSequences(session.conversationSummary);
        if (commands.length > 1) {
            const pattern = {
                id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                description: `Command sequence: ${commands.join(' → ')}`,
                actions: commands,
                frequency: 1,
                successRate: this.estimateSessionSuccess(session),
                contextConditions: this.extractContextConditions(session),
                lastObserved: new Date(),
            };
            patterns.push(pattern);
        }
        return patterns;
    }
    /**
     * Extract command sequences from conversation summary
     */
    extractCommandSequences(conversationSummary) {
        const commands = [];
        // Simple pattern matching for common commands
        const commandPatterns = [
            /npm run (\w+)/g,
            /git (\w+)/g,
            /node (\S+)/g,
            /(\w+) --(\w+)/g,
        ];
        for (const pattern of commandPatterns) {
            let match;
            while ((match = pattern.exec(conversationSummary)) !== null) {
                commands.push(match[0]);
            }
        }
        return Array.from(new Set(commands)); // Remove duplicates
    }
    /**
     * Estimate session success based on conversation content
     */
    estimateSessionSuccess(session) {
        const summary = session.conversationSummary.toLowerCase();
        // Look for success indicators
        const successIndicators = [
            'completed',
            'success',
            'fixed',
            'working',
            'resolved',
        ];
        const failureIndicators = ['failed', 'error', 'broken', 'issue', 'problem'];
        const successCount = successIndicators.filter((indicator) => summary.includes(indicator)).length;
        const failureCount = failureIndicators.filter((indicator) => summary.includes(indicator)).length;
        if (successCount === 0 && failureCount === 0)
            return 0.5; // Neutral
        return successCount / (successCount + failureCount);
    }
    /**
     * Extract context conditions from session
     */
    extractContextConditions(session) {
        const conditions = [];
        // Extract file types being worked on
        const activeFiles = session.codeContext.activeFiles;
        const fileTypes = new Set(activeFiles.map((file) => file.split('.').pop()).filter(Boolean));
        conditions.push(...Array.from(fileTypes).map((type) => `fileType:${type}`));
        // Extract project characteristics
        if (session.codeContext.testCoverage.coverage) {
            const hasTests = Object.keys(session.codeContext.testCoverage.coverage).length > 0;
            conditions.push(`hasTests:${hasTests}`);
        }
        return conditions;
    }
    /**
     * Identify workflow optimizations from session
     */
    identifyWorkflowOptimizations(session) {
        const optimizations = [];
        // Look for repetitive patterns that could be optimized
        const commands = this.extractCommandSequences(session.conversationSummary);
        if (commands.length > 3) {
            // Check if there's a more efficient way to accomplish the same goal
            const optimization = this.suggestWorkflowOptimization(commands);
            if (optimization) {
                optimizations.push(optimization);
            }
        }
        return optimizations;
    }
    /**
     * Suggest workflow optimization based on command sequence
     */
    suggestWorkflowOptimization(commands) {
        // Example: npm run lint → npm run typecheck → npm run test could be npm run ci
        if (commands.includes('npm run lint') &&
            commands.includes('npm run typecheck') &&
            commands.includes('npm run test')) {
            return {
                id: `opt_${Date.now()}`,
                description: 'Use single CI command instead of running lint, typecheck, and test separately',
                currentWorkflow: ['npm run lint', 'npm run typecheck', 'npm run test'],
                optimizedWorkflow: ['npm run ci'],
                timeSavings: '30-50% faster execution',
                confidence: 0.8,
            };
        }
        return null;
    }
    /**
     * Extract error patterns from session
     */
    extractErrorPatterns(session) {
        const patterns = [];
        const summary = session.conversationSummary.toLowerCase();
        // Look for common error patterns
        if (summary.includes('lint') && summary.includes('error')) {
            patterns.push({
                id: 'lint_error',
                description: 'Linting errors encountered',
                causes: ['Code style violations', 'Unused variables', 'Type errors'],
                errorContext: ['Code modification', 'New file creation'],
                prevention: [
                    'Run lint on save',
                    'Use pre-commit hooks',
                    'Configure IDE linting',
                ],
                frequency: 1,
            });
        }
        if (summary.includes('build') &&
            (summary.includes('failed') || summary.includes('error'))) {
            patterns.push({
                id: 'build_error',
                description: 'Build compilation errors',
                causes: ['Type errors', 'Import issues', 'Configuration problems'],
                errorContext: ['Dependency changes', 'Configuration updates'],
                prevention: [
                    'Incremental builds',
                    'Type checking',
                    'Dependency audits',
                ],
                frequency: 1,
            });
        }
        return patterns;
    }
    /**
     * Generate pattern-based command suggestions
     */
    generatePatternBasedCommandSuggestions(currentContext) {
        const suggestions = [];
        for (const pattern of this.interactionPatterns.values()) {
            const contextRelevance = this.calculatePatternRelevance(currentContext, pattern);
            if (contextRelevance > 0.5 && pattern.successRate > 0.6) {
                const nextCommand = this.predictNextCommand(currentContext, pattern);
                if (nextCommand) {
                    suggestions.push({
                        type: 'command',
                        suggestion: nextCommand,
                        confidence: pattern.successRate * contextRelevance,
                        reasoning: `Based on successful pattern: ${pattern.description}`,
                        historicalContext: [
                            `Pattern used ${pattern.frequency} times`,
                            `Success rate: ${Math.round(pattern.successRate * 100)}%`,
                        ],
                        estimatedBenefit: 'Follows proven workflow pattern',
                    });
                }
            }
        }
        return suggestions;
    }
    /**
     * Calculate pattern relevance to current context
     */
    calculatePatternRelevance(currentContext, pattern) {
        let relevance = 0;
        // Check context conditions
        for (const condition of pattern.contextConditions) {
            if (currentContext.toLowerCase().includes(condition.toLowerCase())) {
                relevance += 0.3;
            }
        }
        // Check action keywords
        for (const action of pattern.actions) {
            const actionKeywords = action.split(' ');
            for (const keyword of actionKeywords) {
                if (currentContext.toLowerCase().includes(keyword.toLowerCase())) {
                    relevance += 0.1;
                }
            }
        }
        return Math.min(relevance, 1);
    }
    /**
     * Predict next command in a pattern
     */
    predictNextCommand(currentContext, pattern) {
        // Simple implementation - in production would use more sophisticated ML
        const contextLower = currentContext.toLowerCase();
        for (let i = 0; i < pattern.actions.length - 1; i++) {
            const currentAction = pattern.actions[i];
            if (contextLower.includes(currentAction.toLowerCase())) {
                return pattern.actions[i + 1];
            }
        }
        // If no specific match, return first action
        return pattern.actions[0];
    }
    /**
     * Calculate context relevance for optimization
     */
    calculateContextRelevance(currentContext, description) {
        const contextWords = new Set(currentContext.toLowerCase().split(/\s+/));
        const descriptionWords = new Set(description.toLowerCase().split(/\s+/));
        const intersection = new Set([...contextWords].filter((word) => descriptionWords.has(word)));
        const union = new Set([...contextWords, ...descriptionWords]);
        return intersection.size / union.size;
    }
    /**
     * Get command success rate from historical data
     */
    getCommandSuccessRate(command) {
        const feedback = Array.from(this.userFeedback.values());
        const commandFeedback = feedback.filter((f) => f.suggestion.suggestion.includes(command));
        if (commandFeedback.length === 0)
            return 0.5; // Neutral if no data
        const acceptedCount = commandFeedback.filter((f) => f.accepted).length;
        return acceptedCount / commandFeedback.length;
    }
    /**
     * Get related historical commands
     */
    getRelatedHistoricalCommands(command) {
        const related = [];
        for (const pattern of this.interactionPatterns.values()) {
            if (pattern.actions.includes(command)) {
                related.push(pattern.description);
            }
        }
        return related.slice(0, 3); // Limit to 3 most relevant
    }
    /**
     * Estimate command benefit
     */
    estimateCommandBenefit(command) {
        const benefits = {
            'npm run lint': 'Code quality improvement',
            'npm run typecheck': 'Type safety verification',
            'npm test': 'Bug prevention and confidence',
            'npm run build': 'Production readiness check',
            'git status': 'Repository state awareness',
            'npm install': 'Dependency resolution',
        };
        return benefits[command] || 'Workflow improvement';
    }
    /**
     * Generate performance suggestions
     */
    generatePerformanceSuggestions(codeContext) {
        const suggestions = [];
        // Check for potential performance issues
        const largeFunctions = codeContext.activeFunctions.filter((f) => f.lineCount > 100);
        if (largeFunctions.length > 0) {
            suggestions.push({
                type: 'code',
                suggestion: 'Consider code splitting for large functions to improve load performance',
                confidence: 0.7,
                reasoning: 'Large functions can impact initial page load and memory usage',
                historicalContext: [
                    `${largeFunctions.length} functions over 100 lines`,
                ],
                estimatedBenefit: 'Improved initial load time and memory efficiency',
            });
        }
        return suggestions;
    }
    /**
     * Generate security suggestions
     */
    generateSecuritySuggestions(codeContext) {
        const suggestions = [];
        // Check for potential security concerns
        const hasManyDependencies = Object.keys(codeContext.dependencies).length > 30;
        if (hasManyDependencies) {
            suggestions.push({
                type: 'code',
                suggestion: 'Audit dependencies for security vulnerabilities',
                confidence: 0.8,
                reasoning: 'Large dependency trees increase security attack surface',
                historicalContext: [
                    `${Object.keys(codeContext.dependencies).length} dependencies`,
                ],
                estimatedBenefit: 'Reduced security risk and vulnerability exposure',
            });
        }
        return suggestions;
    }
    /**
     * Identify development workflow optimizations
     */
    identifyDevelopmentWorkflowOptimizations(_currentContext) {
        const suggestions = [];
        suggestions.push({
            type: 'workflow',
            suggestion: 'Set up pre-commit hooks for automated code quality checks',
            confidence: 0.8,
            reasoning: 'Automated quality checks prevent issues from entering the repository',
            historicalContext: ['Best practice for development workflows'],
            estimatedBenefit: 'Reduced manual review time and higher code quality',
        });
        return suggestions;
    }
    /**
     * Identify testing workflow optimizations
     */
    identifyTestingWorkflowOptimizations(_currentContext) {
        const suggestions = [];
        suggestions.push({
            type: 'workflow',
            suggestion: 'Set up test automation with watch mode for faster feedback',
            confidence: 0.7,
            reasoning: 'Automated test execution provides immediate feedback on changes',
            historicalContext: ['Test-driven development best practice'],
            estimatedBenefit: 'Faster development cycles and bug detection',
        });
        return suggestions;
    }
    /**
     * Identify deployment workflow optimizations
     */
    identifyDeploymentWorkflowOptimizations(_currentContext) {
        const suggestions = [];
        suggestions.push({
            type: 'workflow',
            suggestion: 'Implement CI/CD pipeline for automated testing and deployment',
            confidence: 0.9,
            reasoning: 'Automated pipelines reduce manual errors and deployment time',
            historicalContext: ['Industry standard deployment practice'],
            estimatedBenefit: 'Reduced deployment time and increased reliability',
        });
        return suggestions;
    }
    /**
     * Identify duplicated code patterns
     */
    identifyDuplicatedCode(codeContext) {
        const duplicates = [];
        // Simple heuristic: functions with similar names or high similarity
        const functionNames = codeContext.activeFunctions.map((f) => f.name);
        const patterns = new Map();
        for (const name of functionNames) {
            const baseName = name
                .replace(/\d+$/, '')
                .replace(/(Create|Get|Set|Update|Delete)/, '');
            if (!patterns.has(baseName)) {
                patterns.set(baseName, []);
            }
            patterns.get(baseName).push(name);
        }
        for (const [baseName, names] of patterns.entries()) {
            if (names.length > 2) {
                duplicates.push(baseName);
            }
        }
        return duplicates;
    }
    /**
     * Reinforce positive patterns based on user acceptance
     */
    reinforcePositivePattern(suggestion) {
        // Find and strengthen related patterns
        for (const pattern of this.interactionPatterns.values()) {
            if (pattern.actions.some((action) => suggestion.suggestion.includes(action))) {
                pattern.successRate = Math.min(1, pattern.successRate * 1.1);
            }
        }
    }
    /**
     * Reduce negative patterns based on user rejection
     */
    reduceNegativePattern(suggestion) {
        // Find and weaken related patterns
        for (const pattern of this.interactionPatterns.values()) {
            if (pattern.actions.some((action) => suggestion.suggestion.includes(action))) {
                pattern.successRate = Math.max(0, pattern.successRate * 0.9);
            }
        }
    }
    /**
     * Get learning statistics
     */
    getLearningStats() {
        const totalFeedback = this.userFeedback.size;
        const successfulSuggestions = Array.from(this.userFeedback.values()).filter((f) => f.accepted).length;
        return {
            totalPatterns: this.interactionPatterns.size,
            successfulSuggestions,
            totalSuggestions: totalFeedback,
            successRate: totalFeedback > 0 ? successfulSuggestions / totalFeedback : 0,
            activeOptimizations: this.workflowOptimizations.size,
            preventedErrors: Array.from(this.errorPatterns.values()).reduce((sum, pattern) => sum + pattern.frequency, 0),
        };
    }
    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        logger.info('Suggestion engine configuration updated', {
            config: this.config,
        });
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Clear all learned data (useful for testing or reset)
     */
    clearLearning() {
        this.interactionPatterns.clear();
        this.workflowOptimizations.clear();
        this.errorPatterns.clear();
        this.userFeedback.clear();
        logger.info('All learned data cleared');
    }
    /**
     * Export learning data for backup or analysis
     */
    exportLearningData() {
        return {
            patterns: Array.from(this.interactionPatterns.entries()),
            optimizations: Array.from(this.workflowOptimizations.entries()),
            errorPatterns: Array.from(this.errorPatterns.entries()),
            feedback: Array.from(this.userFeedback.entries()),
            stats: this.getLearningStats(),
        };
    }
    /**
     * Import learning data from backup
     */
    importLearningData(data) {
        try {
            if (data.patterns) {
                this.interactionPatterns = new Map(data.patterns);
            }
            if (data.optimizations) {
                this.workflowOptimizations = new Map(data.optimizations);
            }
            if (data.errorPatterns) {
                this.errorPatterns = new Map(data.errorPatterns);
            }
            if (data.feedback) {
                this.userFeedback = new Map(data.feedback);
            }
            logger.info('Learning data imported successfully', {
                patterns: this.interactionPatterns.size,
                optimizations: this.workflowOptimizations.size,
                errorPatterns: this.errorPatterns.size,
            });
        }
        catch (error) {
            logger.error('Failed to import learning data', { error });
            throw error;
        }
    }
}
/**
 * Create a suggestion engine instance with optional configuration
 */
export function createSuggestionEngine(config) {
    return new SuggestionEngine(config);
}
//# sourceMappingURL=SuggestionEngine.js.map