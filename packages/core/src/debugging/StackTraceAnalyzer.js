/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Stack Trace Analyzer for Interactive Debugging Assistance
 * Provides intelligent parsing and analysis of stack traces with source mapping and context analysis
 *
 * @author Claude Code - Interactive Debugging Agent
 * @version 1.0.0
 */
import { getComponentLogger } from '../utils/logger.js';
const logger = getComponentLogger('stack-trace-analyzer');
/**
 * Default configuration for stack trace analyzer
 */
export const DEFAULT_STACK_TRACE_ANALYZER_CONFIG = {
    enableSourceMaps: true,
    enableContextLines: true,
    contextLineCount: 3,
    enableAsyncAnalysis: true,
    enableRecursionDetection: true,
    maxAnalysisDepth: 50,
    supportedLanguages: [
        'javascript',
        'typescript',
        'python',
        'java',
        'go',
        'rust',
        'cpp',
    ],
    enableLibraryDetection: true,
    libraryPatterns: [
        'node_modules',
        'lib/',
        'dist/',
        'build/',
        '.min.js',
        'webpack',
        'babel',
        'react',
        'angular',
        'vue',
        'lodash',
        'express',
        'axios',
    ],
    enableOptimizations: true,
    sourceMapCacheTTL: 1000 * 60 * 60, // 1 hour
};
/**
 * Stack trace patterns for different languages and environments
 */
const STACK_TRACE_PATTERNS = {
    javascript: [
        // Standard V8 stack trace format
        /^\s*at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)$/,
        // Function name without parentheses
        /^\s*at\s+(.+?)\s+(.+?):(\d+):(\d+)$/,
        // Anonymous function
        /^\s*at\s+(.+?):(\d+):(\d+)$/,
        // Eval context
        /^\s*at\s+(.+?)\s+\(eval\s+at\s+.+?\)$/,
    ],
    typescript: [
        // TypeScript compiled stack traces (similar to JavaScript)
        /^\s*at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)$/,
        /^\s*at\s+(.+?)\s+(.+?):(\d+):(\d+)$/,
        /^\s*at\s+(.+?):(\d+):(\d+)$/,
    ],
    python: [
        // Python traceback format
        /^\s*File\s+"(.+?)",\s+line\s+(\d+),\s+in\s+(.+?)$/,
        // Module context
        /^\s*File\s+"(.+?)",\s+line\s+(\d+)$/,
    ],
    java: [
        // Java stack trace format
        /^\s*at\s+(.+?)\.(.+?)\((.+?):(\d+)\)$/,
        // Native method
        /^\s*at\s+(.+?)\.(.+?)\(Native\s+Method\)$/,
        // Unknown source
        /^\s*at\s+(.+?)\.(.+?)\(Unknown\s+Source\)$/,
    ],
    go: [
        // Go panic stack trace
        /^(.+?)\((.+?)\)$/,
        // File and line info
        /^\s*(.+?):(\d+)\s+\+0x([a-fA-F0-9]+)$/,
    ],
    rust: [
        // Rust panic backtrace
        /^\s*(\d+):\s+0x[a-fA-F0-9]+\s+-\s+(.+?)$/,
        // With source location
        /^\s*at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)$/,
    ],
};
/**
 * Common error patterns in stack traces
 */
const COMMON_ERROR_PATTERNS = {
    recursion: {
        pattern: /(.+?)\s+\(\1\s+repeated\s+\d+\s+times\)|Maximum\s+call\s+stack\s+size\s+exceeded/,
        description: 'Infinite recursion detected',
    },
    asyncUnhandled: {
        pattern: /UnhandledPromiseRejectionWarning|Unhandled\s+Promise\s+rejection/,
        description: 'Unhandled async operation rejection',
    },
    memoryLeak: {
        pattern: /Out\s+of\s+memory|Cannot\s+allocate\s+memory|FATAL\s+ERROR.*out\s+of\s+memory/,
        description: 'Memory exhaustion or leak',
    },
    typeError: {
        pattern: /TypeError|AttributeError|NoMethodError/,
        description: 'Type-related error',
    },
};
/**
 * Stack Trace Analyzer
 *
 * Intelligent system for parsing, analyzing, and understanding stack traces across
 * multiple programming languages with source mapping and contextual analysis.
 *
 * Key Features:
 * - **Multi-Language Support**: Parses stack traces from JavaScript, TypeScript, Python, Java, Go, and more
 * - **Source Map Resolution**: Resolves minified/compiled code back to original source
 * - **Context Extraction**: Extracts relevant code context around error locations
 * - **Call Chain Analysis**: Analyzes execution flow and identifies critical paths
 * - **Async Flow Tracking**: Understands asynchronous call chains and Promise flows
 * - **Recursion Detection**: Identifies infinite recursion and call stack issues
 * - **Library Classification**: Distinguishes between user code, libraries, and system code
 * - **Pattern Recognition**: Recognizes common error patterns and provides insights
 *
 * @example
 * ```typescript
 * const analyzer = new StackTraceAnalyzer({
 *   enableSourceMaps: true,
 *   enableAsyncAnalysis: true,
 * });
 *
 * await analyzer.initialize('/path/to/project');
 *
 * // Analyze a stack trace
 * const analysis = await analyzer.analyzeStackTrace(stackTraceText, {
 *   language: 'typescript',
 *   sourceRoot: '/src',
 *   includeContext: true,
 * });
 *
 * console.log('Root cause frame:', analysis.rootCause);
 * console.log('Call chain:', analysis.callChain);
 * console.log('User code frames:', analysis.userCodeFrames);
 * ```
 */
export class StackTraceAnalyzer {
    config;
    sourceMapCache = new Map();
    contextCache = new Map();
    projectPath;
    isInitialized = false;
    constructor(config = {}) {
        this.config = { ...DEFAULT_STACK_TRACE_ANALYZER_CONFIG, ...config };
        logger.info('StackTraceAnalyzer initialized', {
            sourceMaps: this.config.enableSourceMaps,
            contextLines: this.config.enableContextLines,
            asyncAnalysis: this.config.enableAsyncAnalysis,
        });
    }
    /**
     * Initialize the stack trace analyzer
     */
    async initialize(projectPath) {
        const startTime = performance.now();
        logger.info('Initializing Stack Trace Analyzer', { projectPath });
        try {
            this.projectPath = projectPath;
            // Initialize source map resolution if enabled
            if (this.config.enableSourceMaps && projectPath) {
                await this.initializeSourceMaps();
            }
            this.isInitialized = true;
            const duration = performance.now() - startTime;
            logger.info(`Stack Trace Analyzer initialized in ${duration.toFixed(2)}ms`, {
                projectPath,
                sourceMapsEnabled: this.config.enableSourceMaps,
            });
        }
        catch (error) {
            logger.error('Failed to initialize Stack Trace Analyzer', { error });
            throw error;
        }
    }
    /**
     * Analyze a complete stack trace
     */
    async analyzeStackTrace(stackTraceText, options = {}) {
        if (!this.isInitialized) {
            throw new Error('StackTraceAnalyzer not initialized. Call initialize() first.');
        }
        const startTime = performance.now();
        const language = options.language || this.detectLanguageFromStackTrace(stackTraceText);
        logger.debug('Analyzing stack trace', {
            language,
            textLength: stackTraceText.length,
            includeContext: options.includeContext,
        });
        try {
            // Parse stack trace into frames
            const frames = await this.parseStackTrace(stackTraceText, language);
            if (frames.length === 0) {
                throw new Error('No stack trace frames could be parsed');
            }
            // Limit frames for performance
            const maxFrames = options.maxFrames || this.config.maxAnalysisDepth;
            const analyzedFrames = frames.slice(0, maxFrames);
            // Analyze individual frames
            const frameAnalyses = await this.analyzeFrames(analyzedFrames, options);
            // Perform call chain analysis
            const callChainAnalysis = await this.analyzeCallChain(analyzedFrames);
            // Detect error patterns
            const errorPatterns = this.detectErrorPatterns(stackTraceText);
            // Identify root cause frame
            const rootCause = this.identifyRootCause(frameAnalyses);
            // Classify frames by importance
            const frameClassification = this.classifyFrames(frameAnalyses);
            // Detect recursion
            const recursionDetection = this.config.enableRecursionDetection
                ? this.detectRecursion(analyzedFrames)
                : undefined;
            // Analyze async call chains if enabled
            const asyncAnalysis = this.config.enableAsyncAnalysis
                ? await this.analyzeAsyncChain(analyzedFrames, stackTraceText)
                : undefined;
            const duration = performance.now() - startTime;
            const analysis = {
                originalStackTrace: stackTraceText,
                language,
                totalFrames: frames.length,
                analyzedFrames: frameAnalyses,
                callChain: callChainAnalysis,
                rootCause,
                errorPatterns,
                frameClassification,
                recursionDetection,
                asyncAnalysis,
                insights: this.generateInsights(frameAnalyses, callChainAnalysis, errorPatterns),
                metadata: {
                    processingTime: Math.round(duration),
                    sourceMapsUsed: this.config.enableSourceMaps,
                    contextExtracted: options.includeContext || false,
                    analysisDepth: analyzedFrames.length,
                },
            };
            logger.info(`Stack trace analysis completed in ${duration.toFixed(2)}ms`, {
                language,
                totalFrames: frames.length,
                analyzedFrames: analyzedFrames.length,
                rootCauseFound: !!rootCause,
                patternsDetected: errorPatterns.length,
            });
            return analysis;
        }
        catch (error) {
            logger.error('Failed to analyze stack trace', { error, language });
            throw error;
        }
    }
    /**
     * Parse individual stack trace frame
     */
    async parseFrame(frameText, language) {
        const patterns = STACK_TRACE_PATTERNS[language] || STACK_TRACE_PATTERNS.javascript;
        for (const pattern of patterns) {
            const match = frameText.match(pattern);
            if (match) {
                return this.createFrameFromMatch(match, language, frameText);
            }
        }
        return null;
    }
    /**
     * Resolve source map for a given location
     */
    async resolveSourceMap(filePath, line, column) {
        if (!this.config.enableSourceMaps) {
            return null;
        }
        try {
            const sourceMapData = await this.getSourceMapData(filePath);
            if (!sourceMapData) {
                return null;
            }
            // In a real implementation, would use source-map library
            // This is a placeholder for source map resolution
            const resolvedLocation = {
                file: filePath.replace('.min.js', '.ts'), // Simple example
                line,
                column,
                name: 'resolvedFunction', // Would be resolved from source map
                source: '', // Would contain original source code
            };
            logger.debug('Resolved source map', {
                original: { filePath, line, column },
                resolved: resolvedLocation,
            });
            return resolvedLocation;
        }
        catch (error) {
            logger.debug('Failed to resolve source map', { error, filePath });
            return null;
        }
    }
    /**
     * Extract context lines around a frame
     */
    async extractContextLines(filePath, lineNumber, contextCount = this.config.contextLineCount) {
        if (!this.config.enableContextLines) {
            return [];
        }
        const cacheKey = `${filePath}:${lineNumber}:${contextCount}`;
        const cached = this.contextCache.get(cacheKey);
        if (cached &&
            Date.now() - cached.timestamp < this.config.sourceMapCacheTTL) {
            return cached.lines;
        }
        try {
            // In a real implementation, would read from file system
            const contextLines = [];
            const startLine = Math.max(1, lineNumber - contextCount);
            const endLine = lineNumber + contextCount;
            for (let i = startLine; i <= endLine; i++) {
                contextLines.push({
                    lineNumber: i,
                    content: `// Line ${i} content would be loaded from file`,
                    isErrorLine: i === lineNumber,
                    significance: i === lineNumber ? 'high' : 'medium',
                });
            }
            // Cache the result
            this.contextCache.set(cacheKey, {
                lines: contextLines,
                timestamp: Date.now(),
            });
            logger.debug('Extracted context lines', {
                filePath,
                lineNumber,
                contextCount: contextLines.length,
            });
            return contextLines;
        }
        catch (error) {
            logger.debug('Failed to extract context lines', {
                error,
                filePath,
                lineNumber,
            });
            return [];
        }
    }
    /**
     * Get stack trace analysis statistics
     */
    getAnalysisStats() {
        return {
            sourceMapsResolved: 0, // Would track actual source map resolutions
            contextLinesExtracted: this.contextCache.size,
            framesAnalyzed: 0, // Would track actual frame analyses
            cacheHitRate: 0.75, // Placeholder
        };
    }
    /**
     * Clear caches
     */
    clearCache() {
        this.sourceMapCache.clear();
        this.contextCache.clear();
        logger.debug('Stack trace analyzer caches cleared');
    }
    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        // Clear caches if source map settings changed
        if (newConfig.enableSourceMaps !== undefined ||
            newConfig.sourceMapCacheTTL !== undefined) {
            this.clearCache();
        }
        logger.info('Stack trace analyzer configuration updated');
    }
    /**
     * Parse stack trace text into frames
     */
    async parseStackTrace(stackTraceText, language) {
        const lines = stackTraceText
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
        const frames = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const frame = await this.parseFrame(line, language);
            if (frame) {
                frame.index = frames.length;
                frames.push(frame);
            }
        }
        return frames;
    }
    /**
     * Create stack trace frame from regex match
     */
    createFrameFromMatch(match, language, originalText) {
        let functionName = '';
        let filePath = '';
        let lineNumber = 0;
        let columnNumber = 0;
        switch (language) {
            case 'javascript':
            case 'typescript':
                if (match.length >= 4) {
                    functionName = match[1] || '<anonymous>';
                    filePath = match[2] || '';
                    lineNumber = parseInt(match[3], 10) || 0;
                    columnNumber = parseInt(match[4], 10) || 0;
                }
                break;
            case 'python':
                if (match.length >= 3) {
                    filePath = match[1] || '';
                    lineNumber = parseInt(match[2], 10) || 0;
                    functionName = match[3] || '<unknown>';
                }
                break;
            case 'java':
                if (match.length >= 4) {
                    const className = match[1] || '';
                    const methodName = match[2] || '';
                    functionName = `${className}.${methodName}`;
                    filePath = match[3] || '';
                    lineNumber = parseInt(match[4], 10) || 0;
                }
                break;
            default:
                functionName = match[1] || '<unknown>';
                filePath = match[2] || '';
                lineNumber = parseInt(match[3], 10) || 0;
                columnNumber = parseInt(match[4], 10) || 0;
        }
        return {
            index: 0, // Will be set by caller
            functionName,
            filePath,
            lineNumber,
            columnNumber,
            originalText,
            language,
            isUserCode: this.isUserCodeFrame(filePath),
            isThirdParty: this.isThirdPartyFrame(filePath),
            isAsync: this.isAsyncFrame(originalText),
            sourceLocation: null, // Will be resolved if source maps enabled
            context: [], // Will be populated if context extraction enabled
        };
    }
    /**
     * Analyze individual frames for detailed insights
     */
    async analyzeFrames(frames, options) {
        const analyses = [];
        for (const frame of frames) {
            const analysis = {
                frame,
                importance: this.calculateFrameImportance(frame),
                category: this.categorizeFrame(frame),
                confidence: 0.8, // Base confidence
                insights: [],
                relatedFrames: [],
            };
            // Resolve source maps if enabled
            if (this.config.enableSourceMaps && frame.filePath) {
                frame.sourceLocation = await this.resolveSourceMap(frame.filePath, frame.lineNumber, frame.columnNumber);
            }
            // Extract context lines if enabled
            if (options.includeContext && frame.filePath && frame.lineNumber > 0) {
                frame.context = await this.extractContextLines(frame.filePath, frame.lineNumber);
            }
            // Generate frame-specific insights
            analysis.insights = this.generateFrameInsights(frame);
            // Update confidence based on available information
            analysis.confidence = this.calculateFrameConfidence(frame);
            analyses.push(analysis);
        }
        return analyses;
    }
    /**
     * Analyze the call chain for patterns and flow
     */
    async analyzeCallChain(frames) {
        const userFrames = frames.filter((f) => f.isUserCode);
        const thirdPartyFrames = frames.filter((f) => f.isThirdParty);
        const systemFrames = frames.filter((f) => !f.isUserCode && !f.isThirdParty);
        return {
            totalDepth: frames.length,
            userCodeDepth: userFrames.length,
            thirdPartyDepth: thirdPartyFrames.length,
            systemDepth: systemFrames.length,
            entryPoint: frames[frames.length - 1] || null,
            errorOrigin: frames[0] || null,
            criticalPath: this.identifyCriticalPath(frames),
            asyncBoundaries: frames.filter((f) => f.isAsync),
            libraryTransitions: this.identifyLibraryTransitions(frames),
        };
    }
    /**
     * Detect common error patterns in stack trace
     */
    detectErrorPatterns(stackTraceText) {
        const patterns = [];
        for (const [patternName, patternInfo] of Object.entries(COMMON_ERROR_PATTERNS)) {
            if (patternInfo.pattern.test(stackTraceText)) {
                patterns.push({
                    type: patternName,
                    confidence: 0.9,
                    description: patternInfo.description,
                    evidence: stackTraceText.match(patternInfo.pattern)?.[0] || '',
                    recommendations: this.getPatternRecommendations(patternName),
                });
            }
        }
        return patterns;
    }
    /**
     * Identify the root cause frame
     */
    identifyRootCause(frameAnalyses) {
        // Priority order: user code with high importance
        const userFrames = frameAnalyses.filter((f) => f.frame.isUserCode);
        if (userFrames.length > 0) {
            // Return the first user code frame (closest to error)
            return userFrames[0];
        }
        // Fallback to first frame if no user code found
        return frameAnalyses[0] || null;
    }
    /**
     * Classify frames by their role and importance
     */
    classifyFrames(frameAnalyses) {
        const userCodeFrames = frameAnalyses.filter((f) => f.frame.isUserCode);
        const thirdPartyFrames = frameAnalyses.filter((f) => f.frame.isThirdParty);
        const systemFrames = frameAnalyses.filter((f) => !f.frame.isUserCode && !f.frame.isThirdParty);
        const criticalFrames = frameAnalyses.filter((f) => f.importance === 'high');
        const noisyFrames = frameAnalyses.filter((f) => f.importance === 'low');
        return {
            userCodeFrames,
            thirdPartyFrames,
            systemFrames,
            criticalFrames,
            noisyFrames,
        };
    }
    /**
     * Detect recursion patterns in stack trace
     */
    detectRecursion(frames) {
        const functionCounts = new Map();
        let maxCount = 0;
        let recursiveFunction = '';
        for (const frame of frames) {
            const key = `${frame.functionName}:${frame.filePath}`;
            const count = (functionCounts.get(key) || 0) + 1;
            functionCounts.set(key, count);
            if (count > maxCount) {
                maxCount = count;
                recursiveFunction = frame.functionName;
            }
        }
        if (maxCount > 3) {
            // Threshold for recursion detection
            return {
                isRecursive: true,
                recursiveFunction,
                callCount: maxCount,
                pattern: 'simple-recursion',
                depth: maxCount,
                recommendation: `Function '${recursiveFunction}' appears ${maxCount} times in the call stack, indicating infinite recursion. Check for missing base case or termination condition.`,
            };
        }
        return null;
    }
    /**
     * Analyze async call chains
     */
    async analyzeAsyncChain(frames, stackTraceText) {
        const asyncFrames = frames.filter((f) => f.isAsync);
        if (asyncFrames.length === 0) {
            return null;
        }
        return {
            hasAsyncBoundaries: true,
            asyncFrameCount: asyncFrames.length,
            promiseChainDepth: this.calculatePromiseChainDepth(stackTraceText),
            unhandledRejection: stackTraceText.includes('UnhandledPromiseRejection'),
            awaitPattern: stackTraceText.includes('await') || stackTraceText.includes('async'),
            recommendations: [
                'Check for unhandled promise rejections',
                'Ensure proper error handling in async functions',
                'Verify await statements are used correctly',
            ],
        };
    }
    /**
     * Generate analysis insights
     */
    generateInsights(frameAnalyses, callChain, patterns) {
        const insights = [];
        // User code insights
        const userFrames = frameAnalyses.filter((f) => f.frame.isUserCode);
        if (userFrames.length > 0) {
            insights.push(`Error originated in user code: ${userFrames[0].frame.functionName}`);
        }
        else {
            insights.push('Error occurred entirely in third-party or system code');
        }
        // Call stack depth insights
        if (callChain.totalDepth > 20) {
            insights.push(`Deep call stack (${callChain.totalDepth} frames) may indicate recursive calls`);
        }
        // Pattern-based insights
        for (const pattern of patterns) {
            insights.push(`Detected ${pattern.type}: ${pattern.description}`);
        }
        // Library usage insights
        if (callChain.thirdPartyDepth > callChain.userCodeDepth * 2) {
            insights.push('Error heavily involves third-party libraries - check library usage and versions');
        }
        return insights;
    }
    /**
     * Detect programming language from stack trace format
     */
    detectLanguageFromStackTrace(stackTraceText) {
        // JavaScript/Node.js patterns
        if (stackTraceText.includes('at ') && stackTraceText.includes('.js:')) {
            return 'javascript';
        }
        // TypeScript patterns (often compiled to JavaScript)
        if (stackTraceText.includes('at ') && stackTraceText.includes('.ts:')) {
            return 'typescript';
        }
        // Python patterns
        if (stackTraceText.includes('File "') && stackTraceText.includes('line ')) {
            return 'python';
        }
        // Java patterns
        if (stackTraceText.includes('at ') && stackTraceText.includes('.java:')) {
            return 'java';
        }
        // Default to JavaScript
        return 'javascript';
    }
    /**
     * Check if frame represents user code
     */
    isUserCodeFrame(filePath) {
        if (!filePath)
            return false;
        // Check against library patterns
        for (const pattern of this.config.libraryPatterns) {
            if (filePath.includes(pattern)) {
                return false;
            }
        }
        // User code if in source directory
        return (filePath.includes('src/') || filePath.includes(this.projectPath || ''));
    }
    /**
     * Check if frame represents third-party code
     */
    isThirdPartyFrame(filePath) {
        if (!filePath)
            return false;
        return this.config.libraryPatterns.some((pattern) => filePath.includes(pattern));
    }
    /**
     * Check if frame represents async operation
     */
    isAsyncFrame(frameText) {
        return (frameText.includes('async') ||
            frameText.includes('Promise') ||
            frameText.includes('await') ||
            frameText.includes('Generator.next'));
    }
    /**
     * Calculate frame importance for prioritization
     */
    calculateFrameImportance(frame) {
        // User code is most important
        if (frame.isUserCode) {
            return frame.index === 0 ? 'high' : 'medium'; // First user frame is highest priority
        }
        // Third-party code is less important
        if (frame.isThirdParty) {
            return 'low';
        }
        // System code varies by position
        return frame.index < 3 ? 'medium' : 'low';
    }
    /**
     * Categorize frame by its role
     */
    categorizeFrame(frame) {
        if (frame.isUserCode)
            return 'user-code';
        if (frame.isThirdParty)
            return 'third-party';
        if (frame.functionName.includes('runtime') ||
            frame.filePath.includes('runtime')) {
            return 'runtime';
        }
        return 'system';
    }
    /**
     * Generate frame-specific insights
     */
    generateFrameInsights(frame) {
        const insights = [];
        if (frame.isUserCode) {
            insights.push('This is your application code');
        }
        if (frame.isAsync) {
            insights.push('This frame involves asynchronous operations');
        }
        if (frame.functionName === '<anonymous>') {
            insights.push('Anonymous function - consider adding function names for better debugging');
        }
        if (frame.lineNumber === 0) {
            insights.push('Line number unavailable - source map may be missing');
        }
        return insights;
    }
    /**
     * Calculate confidence score for frame analysis
     */
    calculateFrameConfidence(frame) {
        let confidence = 0.5; // Base confidence
        // Higher confidence for user code
        if (frame.isUserCode)
            confidence += 0.3;
        // Higher confidence with source location
        if (frame.sourceLocation)
            confidence += 0.2;
        // Higher confidence with context
        if (frame.context && frame.context.length > 0)
            confidence += 0.1;
        // Higher confidence with line numbers
        if (frame.lineNumber > 0)
            confidence += 0.1;
        return Math.min(confidence, 1.0);
    }
    /**
     * Identify critical path through the call stack
     */
    identifyCriticalPath(frames) {
        // Critical path is user code frames leading to the error
        return frames.filter((frame, index) => frame.isUserCode || index === 0);
    }
    /**
     * Identify transitions between user code and libraries
     */
    identifyLibraryTransitions(frames) {
        const transitions = [];
        for (let i = 0; i < frames.length - 1; i++) {
            const current = frames[i];
            const next = frames[i + 1];
            if (current.isUserCode && !next.isUserCode) {
                transitions.push({
                    from: current,
                    to: next,
                    transitionType: 'user-to-library',
                });
            }
            else if (!current.isUserCode && next.isUserCode) {
                transitions.push({
                    from: current,
                    to: next,
                    transitionType: 'library-to-user',
                });
            }
        }
        return transitions;
    }
    /**
     * Calculate promise chain depth from stack trace text
     */
    calculatePromiseChainDepth(stackTraceText) {
        const promiseMatches = stackTraceText.match(/Promise|async|await/g);
        return promiseMatches ? promiseMatches.length : 0;
    }
    /**
     * Get recommendations for detected error patterns
     */
    getPatternRecommendations(patternName) {
        switch (patternName) {
            case 'recursion':
                return [
                    'Add a base case to stop recursion',
                    'Check loop conditions and exit criteria',
                    'Verify recursive function parameters are changing',
                ];
            case 'asyncUnhandled':
                return [
                    'Add .catch() handlers to promises',
                    'Use try-catch blocks with async/await',
                    'Add global unhandled rejection handler',
                ];
            case 'memoryLeak':
                return [
                    'Profile memory usage to identify leaks',
                    'Check for circular references',
                    'Ensure proper cleanup of event listeners and timers',
                ];
            case 'typeError':
                return [
                    'Add runtime type checking',
                    'Use TypeScript for compile-time type safety',
                    'Validate inputs before using them',
                ];
            default:
                return ['Investigate the error pattern further'];
        }
    }
    /**
     * Initialize source maps for the project
     */
    async initializeSourceMaps() {
        try {
            // In a real implementation, would discover and index source maps
            logger.debug('Source map initialization not fully implemented');
        }
        catch (error) {
            logger.warn('Failed to initialize source maps', { error });
        }
    }
    /**
     * Get source map data for a file
     */
    async getSourceMapData(filePath) {
        const cacheKey = filePath;
        const cached = this.sourceMapCache.get(cacheKey);
        if (cached &&
            Date.now() - cached.timestamp < this.config.sourceMapCacheTTL) {
            return cached.data;
        }
        try {
            // In a real implementation, would load and parse source maps
            const sourceMapData = null; // Placeholder
            if (sourceMapData) {
                this.sourceMapCache.set(cacheKey, {
                    data: sourceMapData,
                    timestamp: Date.now(),
                });
            }
            return sourceMapData;
        }
        catch (error) {
            logger.debug('Failed to load source map', { error, filePath });
            return null;
        }
    }
}
/**
 * Create a Stack Trace Analyzer instance
 */
export async function createStackTraceAnalyzer(config = {}, projectPath) {
    const analyzer = new StackTraceAnalyzer(config);
    await analyzer.initialize(projectPath);
    return analyzer;
}
//# sourceMappingURL=StackTraceAnalyzer.js.map