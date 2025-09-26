/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Code Context Analysis Engine
 * Deep understanding of project structure and code relationships for intelligent context management
 *
 * @author Claude Code - Advanced Context Retention Agent
 * @version 1.0.0
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getComponentLogger } from '../utils/logger.js';
const logger = getComponentLogger('code-context-analyzer');
/**
 * Default configuration for code analysis
 */
export const DEFAULT_CODE_ANALYSIS_CONFIG = {
    maxFileTreeDepth: 10,
    supportedExtensions: ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.rs', '.c', '.cpp'],
    excludedDirectories: ['node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.cache'],
    excludedFiles: ['package-lock.json', 'yarn.lock', '.DS_Store'],
    maxFileSize: 1024 * 1024, // 1MB
    enableAstParsing: false, // Simple regex-based parsing by default
    maxFunctionsPerFile: 50,
    enableTestCorrelation: true,
};
/**
 * Code Context Analysis Engine
 *
 * The CodeContextAnalyzer provides deep understanding of project structure and code relationships.
 * It maps dependencies, summarizes functions/classes, tracks code changes, and correlates tests
 * with implementation for intelligent context management.
 *
 * Key Features:
 * - Dependency Graph Analysis: Maps code relationships and imports
 * - Function/Class Summarization: Generates concise summaries of code structures
 * - Change Impact Analysis: Tracks how modifications affect related code
 * - Test-Code Correlation: Links test files with implementation files
 * - Documentation Integration: Identifies and includes relevant documentation
 *
 * @example
 * ```typescript
 * const analyzer = new CodeContextAnalyzer('/path/to/project');
 * const snapshot = await analyzer.analyzeProject();
 * console.log(`Found ${snapshot.activeFunctions.length} functions`);
 * console.log(`Mapped ${Object.keys(snapshot.dependencies).length} dependencies`);
 * ```
 */
export class CodeContextAnalyzer {
    config;
    projectPath;
    fileChangeCache = new Map();
    dependencyCache = new Map();
    functionCache = new Map();
    constructor(projectPath, config = {}) {
        this.config = { ...DEFAULT_CODE_ANALYSIS_CONFIG, ...config };
        this.projectPath = path.resolve(projectPath);
        logger.info('CodeContextAnalyzer initialized', {
            projectPath: this.projectPath,
            supportedExtensions: this.config.supportedExtensions,
            enableAstParsing: this.config.enableAstParsing,
        });
    }
    /**
     * Analyze the entire project and create a code context snapshot
     */
    async analyzeProject() {
        const startTime = performance.now();
        logger.info('Starting comprehensive project analysis');
        try {
            // Build project file structure
            const projectStructure = await this.buildFileTree(this.projectPath);
            // Analyze functions and classes
            const activeFunctions = await this.extractFunctions(projectStructure);
            // Map dependencies between files
            const dependencies = await this.analyzeDependencies(projectStructure);
            // Track recent code changes
            const recentChanges = await this.trackRecentChanges();
            // Correlate tests with source code
            const testCoverage = this.config.enableTestCorrelation
                ? await this.correlateTestFiles(projectStructure)
                : { testToSource: {}, sourceToTest: {}, coverage: {} };
            // Find active/recently accessed files
            const activeFiles = await this.identifyActiveFiles(recentChanges);
            const duration = performance.now() - startTime;
            logger.info(`Project analysis completed in ${duration.toFixed(2)}ms`, {
                totalFunctions: activeFunctions.length,
                dependencyEntries: Object.keys(dependencies).length,
                recentChanges: recentChanges.length,
                activeFiles: activeFiles.length,
            });
            return {
                projectStructure,
                activeFunctions,
                recentChanges,
                dependencies,
                testCoverage,
                activeFiles,
            };
        }
        catch (error) {
            logger.error('Failed to analyze project', { error });
            throw error;
        }
    }
    /**
     * Build file tree structure recursively
     */
    async buildFileTree(dirPath, depth = 0, maxDepth = this.config.maxFileTreeDepth) {
        const relativePath = path.relative(this.projectPath, dirPath);
        const name = path.basename(dirPath);
        try {
            const stats = await fs.promises.stat(dirPath);
            if (stats.isFile()) {
                return {
                    name,
                    path: relativePath,
                    isDirectory: false,
                    size: stats.size,
                    lastModified: stats.mtime,
                    relevance: this.calculateFileRelevance(dirPath, stats),
                };
            }
            // Handle directory
            if (depth >= maxDepth) {
                logger.debug(`Reached max depth at ${relativePath}`);
                return {
                    name,
                    path: relativePath,
                    isDirectory: true,
                    children: [],
                    lastModified: stats.mtime,
                    relevance: 0,
                };
            }
            // Skip excluded directories
            if (this.config.excludedDirectories.includes(name)) {
                logger.debug(`Skipping excluded directory: ${name}`);
                return {
                    name,
                    path: relativePath,
                    isDirectory: true,
                    children: [],
                    lastModified: stats.mtime,
                    relevance: 0,
                };
            }
            const entries = await fs.promises.readdir(dirPath);
            const children = [];
            for (const entry of entries) {
                const entryPath = path.join(dirPath, entry);
                try {
                    const childTree = await this.buildFileTree(entryPath, depth + 1, maxDepth);
                    children.push(childTree);
                }
                catch (error) {
                    logger.debug(`Skipping inaccessible entry: ${entry}`, { error: error.message });
                }
            }
            // Sort children: directories first, then files
            children.sort((a, b) => {
                if (a.isDirectory === b.isDirectory) {
                    return a.name.localeCompare(b.name);
                }
                return a.isDirectory ? -1 : 1;
            });
            return {
                name,
                path: relativePath,
                isDirectory: true,
                children,
                lastModified: stats.mtime,
                relevance: Math.max(...children.map((child) => child.relevance || 0)),
            };
        }
        catch (error) {
            logger.warn(`Failed to analyze path: ${dirPath}`, { error: error.message });
            throw error;
        }
    }
    /**
     * Calculate file relevance score based on various factors
     */
    calculateFileRelevance(filePath, stats) {
        let relevance = 0;
        // Base relevance for supported file types
        const ext = path.extname(filePath);
        if (this.config.supportedExtensions.includes(ext)) {
            relevance += 0.3;
        }
        // Boost for commonly important files
        const basename = path.basename(filePath);
        const importantPatterns = [
            /^(index|main|app)\.(js|ts|jsx|tsx)$/,
            /^package\.json$/,
            /^readme\.md$/i,
            /^config\./,
            /\.config\./,
        ];
        for (const pattern of importantPatterns) {
            if (pattern.test(basename)) {
                relevance += 0.4;
                break;
            }
        }
        // Boost for recently modified files
        const daysSinceModified = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceModified < 7) {
            relevance += 0.3 * Math.exp(-daysSinceModified / 3); // Exponential decay
        }
        // Boost for reasonable file size (not too small, not too large)
        if (stats.size > 100 && stats.size < this.config.maxFileSize) {
            const sizeScore = Math.min(stats.size / 10000, 1) * 0.2; // Up to 0.2 boost for files up to 10KB
            relevance += sizeScore;
        }
        return Math.min(relevance, 1); // Cap at 1.0
    }
    /**
     * Extract functions and classes from the project
     */
    async extractFunctions(fileTree) {
        const functions = [];
        await this.traverseTreeForFunctions(fileTree, functions);
        // Sort by relevance and limit count
        return functions
            .sort((a, b) => b.complexity - a.complexity || b.usageCount - a.usageCount)
            .slice(0, this.config.maxFunctionsPerFile * 20); // Reasonable limit for large projects
    }
    /**
     * Recursively traverse file tree to extract functions
     */
    async traverseTreeForFunctions(node, functions) {
        if (node.isDirectory) {
            if (node.children) {
                for (const child of node.children) {
                    await this.traverseTreeForFunctions(child, functions);
                }
            }
            return;
        }
        // Analyze file for functions
        const filePath = path.join(this.projectPath, node.path);
        const ext = path.extname(node.path);
        if (!this.config.supportedExtensions.includes(ext)) {
            return;
        }
        if (node.size && node.size > this.config.maxFileSize) {
            logger.debug(`Skipping large file: ${node.path} (${node.size} bytes)`);
            return;
        }
        try {
            // Check cache first
            const cached = this.functionCache.get(filePath);
            if (cached) {
                functions.push(...cached);
                return;
            }
            const fileFunctions = await this.analyzeFunctionsInFile(filePath);
            this.functionCache.set(filePath, fileFunctions);
            functions.push(...fileFunctions);
        }
        catch (error) {
            logger.debug(`Failed to analyze functions in ${node.path}`, {
                error: error.message,
            });
        }
    }
    /**
     * Analyze functions in a specific file
     */
    async analyzeFunctionsInFile(filePath) {
        try {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            const functions = [];
            const relativePath = path.relative(this.projectPath, filePath);
            const ext = path.extname(filePath);
            // Use different parsing strategies based on file type
            if (['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
                functions.push(...this.parseJavaScriptFunctions(content, relativePath));
            }
            else if (ext === '.py') {
                functions.push(...this.parsePythonFunctions(content, relativePath));
            }
            else if (['.java'].includes(ext)) {
                functions.push(...this.parseJavaFunctions(content, relativePath));
            }
            else if (['.go'].includes(ext)) {
                functions.push(...this.parseGoFunctions(content, relativePath));
            }
            // Limit functions per file
            return functions.slice(0, this.config.maxFunctionsPerFile);
        }
        catch (error) {
            logger.debug(`Failed to read file for function analysis: ${filePath}`, {
                error: error.message,
            });
            return [];
        }
    }
    /**
     * Parse JavaScript/TypeScript functions and classes
     */
    parseJavaScriptFunctions(content, filePath) {
        const functions = [];
        // Function declarations
        const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)/g;
        let match;
        while ((match = functionRegex.exec(content)) !== null) {
            const [fullMatch, name] = match;
            functions.push({
                name,
                filePath,
                signature: fullMatch,
                description: this.extractNearbyComment(content, match.index),
                parameters: this.extractParameters(fullMatch),
                dependencies: this.extractDependenciesFromFunction(content, match.index),
                usageCount: this.estimateUsageCount(content, name),
                lineCount: this.estimateLineCount(content, match.index),
                complexity: this.calculateComplexity(content, match.index),
            });
        }
        // Arrow functions
        const arrowRegex = /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)\s*=>|[^=]*=>\s*)/g;
        while ((match = arrowRegex.exec(content)) !== null) {
            const [fullMatch, name] = match;
            functions.push({
                name,
                filePath,
                signature: fullMatch,
                description: this.extractNearbyComment(content, match.index),
                parameters: this.extractParameters(fullMatch),
                dependencies: this.extractDependenciesFromFunction(content, match.index),
                usageCount: this.estimateUsageCount(content, name),
                lineCount: this.estimateLineCount(content, match.index),
                complexity: this.calculateComplexity(content, match.index),
            });
        }
        // Class declarations
        const classRegex = /(?:export\s+)?class\s+(\w+)(?:\s+extends\s+\w+)?/g;
        while ((match = classRegex.exec(content)) !== null) {
            const [fullMatch, name] = match;
            functions.push({
                name,
                filePath,
                signature: fullMatch,
                description: this.extractNearbyComment(content, match.index),
                parameters: [],
                dependencies: this.extractDependenciesFromClass(content, match.index),
                usageCount: this.estimateUsageCount(content, name),
                lineCount: this.estimateClassLineCount(content, match.index),
                complexity: this.calculateComplexity(content, match.index),
            });
        }
        return functions;
    }
    /**
     * Parse Python functions and classes
     */
    parsePythonFunctions(content, filePath) {
        const functions = [];
        // Function definitions
        const functionRegex = /def\s+(\w+)\s*\([^)]*\)(?:\s*->\s*[^:]+)?:/g;
        let match;
        while ((match = functionRegex.exec(content)) !== null) {
            const [fullMatch, name] = match;
            functions.push({
                name,
                filePath,
                signature: fullMatch,
                description: this.extractNearbyComment(content, match.index),
                parameters: this.extractPythonParameters(fullMatch),
                dependencies: this.extractDependenciesFromFunction(content, match.index),
                usageCount: this.estimateUsageCount(content, name),
                lineCount: this.estimateLineCount(content, match.index),
                complexity: this.calculateComplexity(content, match.index),
            });
        }
        // Class definitions
        const classRegex = /class\s+(\w+)(?:\([^)]*\))?:/g;
        while ((match = classRegex.exec(content)) !== null) {
            const [fullMatch, name] = match;
            functions.push({
                name,
                filePath,
                signature: fullMatch,
                description: this.extractNearbyComment(content, match.index),
                parameters: [],
                dependencies: this.extractDependenciesFromClass(content, match.index),
                usageCount: this.estimateUsageCount(content, name),
                lineCount: this.estimateClassLineCount(content, match.index),
                complexity: this.calculateComplexity(content, match.index),
            });
        }
        return functions;
    }
    /**
     * Parse Java functions and classes (simplified)
     */
    parseJavaFunctions(content, filePath) {
        const functions = [];
        // Method declarations
        const methodRegex = /(?:public|private|protected)?\s*(?:static)?\s*\w+\s+(\w+)\s*\([^)]*\)/g;
        let match;
        while ((match = methodRegex.exec(content)) !== null) {
            const [fullMatch, name] = match;
            functions.push({
                name,
                filePath,
                signature: fullMatch,
                description: this.extractNearbyComment(content, match.index),
                parameters: this.extractParameters(fullMatch),
                dependencies: [],
                usageCount: this.estimateUsageCount(content, name),
                lineCount: this.estimateLineCount(content, match.index),
                complexity: this.calculateComplexity(content, match.index),
            });
        }
        return functions;
    }
    /**
     * Parse Go functions (simplified)
     */
    parseGoFunctions(content, filePath) {
        const functions = [];
        // Function declarations
        const functionRegex = /func\s+(\w+)\s*\([^)]*\)(?:\s*\([^)]*\))?/g;
        let match;
        while ((match = functionRegex.exec(content)) !== null) {
            const [fullMatch, name] = match;
            functions.push({
                name,
                filePath,
                signature: fullMatch,
                description: this.extractNearbyComment(content, match.index),
                parameters: this.extractGoParameters(fullMatch),
                dependencies: [],
                usageCount: this.estimateUsageCount(content, name),
                lineCount: this.estimateLineCount(content, match.index),
                complexity: this.calculateComplexity(content, match.index),
            });
        }
        return functions;
    }
    /**
     * Extract parameters from function signature
     */
    extractParameters(signature) {
        const parameters = [];
        // Simple parameter extraction (would be more sophisticated with AST)
        const paramMatch = signature.match(/\(([^)]*)\)/);
        if (!paramMatch || !paramMatch[1])
            return parameters;
        const paramStr = paramMatch[1].trim();
        if (!paramStr)
            return parameters;
        const params = paramStr.split(',').map((p) => p.trim());
        for (const param of params) {
            const parts = param.split(':').map((p) => p.trim());
            const name = parts[0].replace(/^\.\.\./, ''); // Remove spread operator
            const type = parts[1] || 'unknown';
            const optional = param.includes('?') || param.includes('=');
            const defaultValue = param.includes('=') ? param.split('=')[1].trim() : undefined;
            parameters.push({
                name,
                type,
                optional,
                defaultValue,
                description: undefined,
            });
        }
        return parameters;
    }
    /**
     * Extract Python parameters from function signature
     */
    extractPythonParameters(signature) {
        const parameters = [];
        const paramMatch = signature.match(/\(([^)]*)\)/);
        if (!paramMatch || !paramMatch[1])
            return parameters;
        const paramStr = paramMatch[1].trim();
        if (!paramStr)
            return parameters;
        const params = paramStr.split(',').map((p) => p.trim());
        for (const param of params) {
            if (param === 'self' || param === 'cls')
                continue;
            const parts = param.split(':');
            const nameWithDefault = parts[0].trim();
            const type = parts[1]?.trim() || 'Any';
            const hasDefault = nameWithDefault.includes('=');
            const name = hasDefault ? nameWithDefault.split('=')[0].trim() : nameWithDefault;
            const defaultValue = hasDefault ? nameWithDefault.split('=')[1].trim() : undefined;
            parameters.push({
                name,
                type,
                optional: hasDefault,
                defaultValue,
                description: undefined,
            });
        }
        return parameters;
    }
    /**
     * Extract Go parameters from function signature
     */
    extractGoParameters(signature) {
        const parameters = [];
        const paramMatch = signature.match(/\(([^)]*)\)/);
        if (!paramMatch || !paramMatch[1])
            return parameters;
        const paramStr = paramMatch[1].trim();
        if (!paramStr)
            return parameters;
        // Simplified Go parameter parsing
        const params = paramStr.split(',').map((p) => p.trim());
        for (const param of params) {
            const parts = param.trim().split(/\s+/);
            if (parts.length >= 2) {
                const name = parts[0];
                const type = parts[1];
                parameters.push({
                    name,
                    type,
                    optional: false,
                    description: undefined,
                });
            }
        }
        return parameters;
    }
    /**
     * Extract nearby comments for documentation
     */
    extractNearbyComment(content, index) {
        const lines = content.substring(0, index).split('\n');
        const startLine = Math.max(0, lines.length - 5); // Look 5 lines back
        for (let i = lines.length - 1; i >= startLine; i--) {
            const line = lines[i].trim();
            // Look for JSDoc, Python docstrings, or regular comments
            if (line.startsWith('/**') || line.startsWith('/*')) {
                return line.replace(/^\/\*+|\*+\/$/g, '').trim();
            }
            if (line.startsWith('//') || line.startsWith('#')) {
                return line.replace(/^(\/\/|#)\s*/, '').trim();
            }
            if (line.startsWith('"""') || line.startsWith("'''")) {
                return line.replace(/^("""|''')\s*/, '').trim();
            }
        }
        return '';
    }
    /**
     * Extract dependencies from function context
     */
    extractDependenciesFromFunction(content, index) {
        const dependencies = [];
        const functionEnd = this.findFunctionEnd(content, index);
        const functionContent = content.substring(index, functionEnd);
        // Look for imports/requires within function scope
        const importPatterns = [
            /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g,
            /require\(['"`]([^'"`]+)['"`]\)/g,
            /from\s+(\w+)\s+import/g,
        ];
        for (const pattern of importPatterns) {
            let match;
            while ((match = pattern.exec(functionContent)) !== null) {
                dependencies.push(match[1]);
            }
        }
        return Array.from(new Set(dependencies)); // Remove duplicates
    }
    /**
     * Extract dependencies from class context
     */
    extractDependenciesFromClass(content, index) {
        // Similar to function dependencies but look for class-level imports
        return this.extractDependenciesFromFunction(content, index);
    }
    /**
     * Find the end of a function/class block
     */
    findFunctionEnd(content, startIndex) {
        // Simplified - find next function/class declaration or end of file
        const nextFunctionMatch = content.substring(startIndex + 1).search(/(function\s+\w+|class\s+\w+|def\s+\w+)/);
        return nextFunctionMatch === -1
            ? content.length
            : startIndex + nextFunctionMatch + 1;
    }
    /**
     * Estimate usage count of a function/class by counting references
     */
    estimateUsageCount(content, name) {
        const regex = new RegExp(`\\b${name}\\b`, 'g');
        const matches = content.match(regex);
        return matches ? Math.max(0, matches.length - 1) : 0; // Subtract 1 for declaration
    }
    /**
     * Estimate line count of a function
     */
    estimateLineCount(content, startIndex) {
        const functionEnd = this.findFunctionEnd(content, startIndex);
        const functionContent = content.substring(startIndex, functionEnd);
        return functionContent.split('\n').length;
    }
    /**
     * Estimate line count of a class
     */
    estimateClassLineCount(content, startIndex) {
        // For classes, look for the closing brace or next class/function
        return this.estimateLineCount(content, startIndex);
    }
    /**
     * Calculate complexity score based on code patterns
     */
    calculateComplexity(content, startIndex) {
        const functionEnd = this.findFunctionEnd(content, startIndex);
        const functionContent = content.substring(startIndex, functionEnd);
        let complexity = 1; // Base complexity
        // Count complexity indicators
        const complexityPatterns = [
            /if\s*\(/g,
            /else\s*if\s*\(/g,
            /while\s*\(/g,
            /for\s*\(/g,
            /switch\s*\(/g,
            /case\s+.*?:/g,
            /catch\s*\(/g,
            /\?\s*.*?:/g, // Ternary operators
            /&&|\|\|/g, // Logical operators
        ];
        for (const pattern of complexityPatterns) {
            const matches = functionContent.match(pattern);
            if (matches) {
                complexity += matches.length;
            }
        }
        return Math.min(complexity, 20); // Cap at 20 for reasonableness
    }
    /**
     * Analyze dependencies between files
     */
    async analyzeDependencies(fileTree) {
        const dependencies = {};
        await this.traverseTreeForDependencies(fileTree, dependencies);
        logger.info(`Analyzed dependencies for ${Object.keys(dependencies).length} files`);
        return dependencies;
    }
    /**
     * Traverse file tree to extract dependencies
     */
    async traverseTreeForDependencies(node, dependencies) {
        if (node.isDirectory) {
            if (node.children) {
                for (const child of node.children) {
                    await this.traverseTreeForDependencies(child, dependencies);
                }
            }
            return;
        }
        const filePath = path.join(this.projectPath, node.path);
        const ext = path.extname(node.path);
        if (!this.config.supportedExtensions.includes(ext)) {
            return;
        }
        try {
            // Check cache first
            const cached = this.dependencyCache.get(filePath);
            if (cached) {
                dependencies[node.path] = cached;
                return;
            }
            const fileDependencies = await this.extractFileDependencies(filePath);
            this.dependencyCache.set(filePath, fileDependencies);
            dependencies[node.path] = fileDependencies;
        }
        catch (error) {
            logger.debug(`Failed to analyze dependencies for ${node.path}`, {
                error: error.message,
            });
            dependencies[node.path] = [];
        }
    }
    /**
     * Extract dependencies from a specific file
     */
    async extractFileDependencies(filePath) {
        try {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            const dependencies = [];
            const ext = path.extname(filePath);
            // Different patterns for different file types
            let patterns = [];
            if (['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
                patterns = [
                    /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g,
                    /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
                    /require\(['"`]([^'"`]+)['"`]\)/g,
                    /export\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g,
                ];
            }
            else if (ext === '.py') {
                patterns = [
                    /from\s+([^\s]+)\s+import/g,
                    /import\s+([^\s,]+)/g,
                ];
            }
            else if (ext === '.java') {
                patterns = [
                    /import\s+([^;]+);/g,
                ];
            }
            else if (ext === '.go') {
                patterns = [
                    /import\s+"([^"]+)"/g,
                    /import\s+\(\s*"([^"]+)"/g,
                ];
            }
            for (const pattern of patterns) {
                let match;
                while ((match = pattern.exec(content)) !== null) {
                    const dependency = match[1].trim();
                    if (dependency && !dependency.startsWith('.')) {
                        // Only track external dependencies
                        dependencies.push(dependency);
                    }
                }
            }
            return Array.from(new Set(dependencies)); // Remove duplicates
        }
        catch (error) {
            logger.debug(`Failed to read file for dependency analysis: ${filePath}`, {
                error: error.message,
            });
            return [];
        }
    }
    /**
     * Track recent code changes using git or file system
     */
    async trackRecentChanges() {
        // For now, implement a simple file modification tracking
        // In production, this would integrate with git history
        const changes = [];
        try {
            // Simple implementation: track files modified in last 24 hours
            await this.findRecentlyModifiedFiles(this.projectPath, changes);
            return changes.slice(0, 50); // Limit to recent 50 changes
        }
        catch (error) {
            logger.debug('Failed to track recent changes', { error: error.message });
            return [];
        }
    }
    /**
     * Find recently modified files
     */
    async findRecentlyModifiedFiles(dirPath, changes) {
        try {
            const entries = await fs.promises.readdir(dirPath);
            for (const entry of entries) {
                const entryPath = path.join(dirPath, entry);
                const relativePath = path.relative(this.projectPath, entryPath);
                // Skip excluded directories
                if (this.config.excludedDirectories.some((excluded) => relativePath.includes(excluded))) {
                    continue;
                }
                try {
                    const stats = await fs.promises.stat(entryPath);
                    if (stats.isDirectory()) {
                        await this.findRecentlyModifiedFiles(entryPath, changes);
                    }
                    else if (stats.isFile()) {
                        const daysSinceModified = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
                        if (daysSinceModified < 1) {
                            // File modified in last 24 hours
                            const ext = path.extname(entryPath);
                            if (this.config.supportedExtensions.includes(ext)) {
                                changes.push({
                                    filePath: relativePath,
                                    changeType: 'modify',
                                    timestamp: stats.mtime,
                                    description: `Modified ${path.basename(entryPath)}`,
                                    linesAdded: 0, // Would need git integration for accurate counts
                                    linesRemoved: 0,
                                    affectedItems: [], // Would need detailed diff analysis
                                });
                            }
                        }
                    }
                }
                catch (error) {
                    logger.debug(`Skipping inaccessible entry: ${entry}`, {
                        error: error.message,
                    });
                }
            }
        }
        catch (error) {
            logger.debug(`Failed to read directory: ${dirPath}`, {
                error: error.message,
            });
        }
    }
    /**
     * Correlate test files with source files
     */
    async correlateTestFiles(fileTree) {
        const testToSource = {};
        const sourceToTest = {};
        const coverage = {};
        const testFiles = [];
        const sourceFiles = [];
        // Find test and source files
        this.collectFilesByType(fileTree, testFiles, sourceFiles);
        // Simple correlation based on naming patterns
        for (const testFile of testFiles) {
            const correlatedSources = this.findCorrelatedSourceFiles(testFile, sourceFiles);
            if (correlatedSources.length > 0) {
                testToSource[testFile] = correlatedSources;
                // Add reverse mapping
                for (const sourceFile of correlatedSources) {
                    if (!sourceToTest[sourceFile]) {
                        sourceToTest[sourceFile] = [];
                    }
                    sourceToTest[sourceFile].push(testFile);
                }
            }
        }
        // Assign placeholder coverage values (would integrate with actual coverage tools)
        for (const sourceFile of sourceFiles) {
            coverage[sourceFile] = sourceToTest[sourceFile] ? 0.8 : 0.0; // 80% if has tests, 0% otherwise
        }
        logger.info(`Correlated ${testFiles.length} test files with ${sourceFiles.length} source files`);
        return {
            testToSource,
            sourceToTest,
            coverage,
        };
    }
    /**
     * Collect files by type (test vs source)
     */
    collectFilesByType(node, testFiles, sourceFiles) {
        if (node.isDirectory) {
            if (node.children) {
                for (const child of node.children) {
                    this.collectFilesByType(child, testFiles, sourceFiles);
                }
            }
            return;
        }
        const ext = path.extname(node.path);
        if (!this.config.supportedExtensions.includes(ext)) {
            return;
        }
        const filename = path.basename(node.path).toLowerCase();
        const isTest = filename.includes('test') ||
            filename.includes('spec') ||
            node.path.includes('/test/') ||
            node.path.includes('/tests/') ||
            node.path.includes('/__tests__/');
        if (isTest) {
            testFiles.push(node.path);
        }
        else {
            sourceFiles.push(node.path);
        }
    }
    /**
     * Find source files that correlate with a test file
     */
    findCorrelatedSourceFiles(testFile, sourceFiles) {
        const correlatedFiles = [];
        const testBasename = path.basename(testFile)
            .replace(/\.(test|spec)\.(js|ts|jsx|tsx|py|java|go)$/i, '')
            .toLowerCase();
        for (const sourceFile of sourceFiles) {
            const sourceBasename = path.basename(sourceFile, path.extname(sourceFile)).toLowerCase();
            // Simple correlation: test file name contains source file name or vice versa
            if (testBasename.includes(sourceBasename) || sourceBasename.includes(testBasename)) {
                correlatedFiles.push(sourceFile);
            }
        }
        return correlatedFiles;
    }
    /**
     * Identify currently active/relevant files
     */
    async identifyActiveFiles(recentChanges) {
        const activeFiles = new Set();
        // Add recently changed files
        for (const change of recentChanges) {
            activeFiles.add(change.filePath);
        }
        // Add important project files
        const importantPatterns = [
            /^package\.json$/,
            /^readme\.md$/i,
            /^(index|main|app)\.(js|ts|jsx|tsx)$/,
            /\.config\.(js|ts|json)$/,
        ];
        // Simple traversal to find important files (could be optimized)
        await this.findImportantFiles(this.projectPath, activeFiles, importantPatterns);
        return Array.from(activeFiles).slice(0, 20); // Limit to 20 most active files
    }
    /**
     * Find important files matching patterns
     */
    async findImportantFiles(dirPath, activeFiles, patterns) {
        try {
            const entries = await fs.promises.readdir(dirPath);
            for (const entry of entries) {
                const entryPath = path.join(dirPath, entry);
                const relativePath = path.relative(this.projectPath, entryPath);
                // Skip excluded directories
                if (this.config.excludedDirectories.some((excluded) => relativePath.includes(excluded))) {
                    continue;
                }
                try {
                    const stats = await fs.promises.stat(entryPath);
                    if (stats.isFile()) {
                        for (const pattern of patterns) {
                            if (pattern.test(entry)) {
                                activeFiles.add(relativePath);
                                break;
                            }
                        }
                    }
                    else if (stats.isDirectory() && activeFiles.size < 15) {
                        // Recursive search, but limit depth to prevent performance issues
                        await this.findImportantFiles(entryPath, activeFiles, patterns);
                    }
                }
                catch (error) {
                    logger.debug(`Skipping inaccessible entry: ${entry}`, {
                        error: error.message,
                    });
                }
            }
        }
        catch (error) {
            logger.debug(`Failed to read directory: ${dirPath}`, {
                error: error.message,
            });
        }
    }
    /**
     * Analyze changes that affect other parts of the codebase
     */
    async analyzeChangeImpact(changedFiles) {
        const affectedFiles = new Set();
        const impactAnalysis = {};
        // For each changed file, find files that import it
        for (const changedFile of changedFiles) {
            const impacts = [];
            // Check cached dependencies
            for (const [filePath, deps] of this.dependencyCache.entries()) {
                const relativePath = path.relative(this.projectPath, filePath);
                if (deps.some((dep) => this.isRelatedDependency(dep, changedFile))) {
                    affectedFiles.add(relativePath);
                    impacts.push(relativePath);
                }
            }
            impactAnalysis[changedFile] = impacts;
        }
        logger.info(`Change impact analysis: ${changedFiles.length} changed files affect ${affectedFiles.size} other files`);
        return {
            affectedFiles: Array.from(affectedFiles),
            impactAnalysis,
        };
    }
    /**
     * Check if a dependency is related to a changed file
     */
    isRelatedDependency(dependency, changedFile) {
        // Simple check - in production would have more sophisticated matching
        const changedBasename = path.basename(changedFile, path.extname(changedFile));
        return dependency.includes(changedBasename) || changedBasename.includes(dependency);
    }
    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        // Clear caches if significant config changes
        if (newConfig.supportedExtensions || newConfig.maxFileSize || newConfig.excludedDirectories) {
            this.clearCaches();
        }
        logger.info('Code analysis configuration updated', { config: this.config });
    }
    /**
     * Clear analysis caches
     */
    clearCaches() {
        this.fileChangeCache.clear();
        this.dependencyCache.clear();
        this.functionCache.clear();
        logger.debug('Code analysis caches cleared');
    }
    /**
     * Get analysis statistics
     */
    getAnalysisStats() {
        const totalFiles = this.functionCache.size;
        const byExtension = {};
        let totalFunctions = 0;
        for (const functions of this.functionCache.values()) {
            totalFunctions += functions.length;
        }
        // Count files by extension from cache keys
        for (const filePath of this.functionCache.keys()) {
            const ext = path.extname(filePath);
            byExtension[ext] = (byExtension[ext] || 0) + 1;
        }
        return {
            totalFiles,
            byExtension,
            totalFunctions,
            dependencyCount: this.dependencyCache.size,
            testFilesCorrelated: 0, // Would track during correlation
            analysisDuration: 0, // Would track during analysis
            memoryUsage: process.memoryUsage().heapUsed,
        };
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
}
/**
 * Create a code context analyzer instance
 */
export function createCodeContextAnalyzer(projectPath, config) {
    return new CodeContextAnalyzer(projectPath, config);
}
//# sourceMappingURL=CodeContextAnalyzer.js.map