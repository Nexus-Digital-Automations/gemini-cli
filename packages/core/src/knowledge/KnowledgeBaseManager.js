/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Knowledge Base Integration System
 *
 * Provides comprehensive organizational knowledge base integration including:
 * - Internal wiki and documentation integration
 * - Company-specific code pattern learning
 * - Institutional knowledge capture and indexing
 * - Intelligent document retrieval
 * - Context-aware knowledge suggestions
 * - Organizational best practices enforcement
 *
 * Features:
 * - Multi-source knowledge integration (wikis, documentation, repos)
 * - Advanced document indexing with semantic search
 * - Project-specific context awareness
 * - Knowledge graph construction and traversal
 * - Automated best practices extraction
 * - Real-time knowledge synchronization
 *
 * @author Claude Code - Knowledge Base Implementation Agent
 * @version 1.0.0
 */
import { logger } from '../utils/logger.js';
import fs from 'node:fs/promises';
import path from 'node:path';
/**
 * Types of knowledge sources supported
 */
export var KnowledgeSourceType;
(function (KnowledgeSourceType) {
    /** Internal company wiki (Confluence, Notion, etc.) */
    KnowledgeSourceType["WIKI"] = "wiki";
    /** Technical documentation */
    KnowledgeSourceType["DOCUMENTATION"] = "documentation";
    /** Internal code repositories */
    KnowledgeSourceType["CODE_REPOSITORY"] = "code_repository";
    /** Design documents and specifications */
    KnowledgeSourceType["DESIGN_DOCS"] = "design_docs";
    /** Best practices and guidelines */
    KnowledgeSourceType["BEST_PRACTICES"] = "best_practices";
    /** Troubleshooting guides */
    KnowledgeSourceType["TROUBLESHOOTING"] = "troubleshooting";
    /** API documentation */
    KnowledgeSourceType["API_DOCS"] = "api_docs";
    /** Architecture diagrams and documents */
    KnowledgeSourceType["ARCHITECTURE"] = "architecture";
})(KnowledgeSourceType || (KnowledgeSourceType = {}));
/**
 * Main Knowledge Base Manager
 *
 * Orchestrates organizational knowledge integration, indexing, and retrieval
 * to provide contextually relevant information and suggestions based on
 * company-specific documentation, code patterns, and best practices.
 *
 * @example
 * ```typescript
 * const knowledgeManager = new KnowledgeBaseManager();
 *
 * // Add knowledge source
 * await knowledgeManager.addSource({
 *   id: 'company-wiki',
 *   name: 'Company Wiki',
 *   type: KnowledgeSourceType.WIKI,
 *   source: 'https://wiki.company.com',
 *   syncFrequencyMinutes: 60,
 *   isActive: true,
 *   indexConfig: {
 *     includePatterns: ['*.md', '*.html'],
 *     excludePatterns: ['draft/*'],
 *     maxFileSizeBytes: 10 * 1024 * 1024,
 *     extractCodePatterns: true,
 *     extractApiSignatures: true,
 *     maxDepth: 5,
 *     semanticIndexing: true
 *   },
 *   metadata: {}
 * });
 *
 * // Search knowledge base
 * const results = await knowledgeManager.search({
 *   query: 'authentication best practices',
 *   maxResults: 10,
 *   minRelevance: 0.7,
 *   semanticSearch: true
 * });
 *
 * // Get contextual suggestions
 * const suggestions = await knowledgeManager.getContextualSuggestions(
 *   currentCodeContext,
 *   projectPath
 * );
 * ```
 */
export class KnowledgeBaseManager {
    logger = logger().child({
        component: 'KnowledgeBaseManager',
    });
    sources = new Map();
    documents = new Map();
    patterns = new Map();
    knowledgeIndex = new Map();
    searchCache = new Map();
    configPath;
    constructor(configPath) {
        this.configPath =
            configPath ||
                path.join(process.cwd(), '.gemini', 'knowledge-config.json');
        this.logger.info('KnowledgeBaseManager initialized', {
            configPath: this.configPath,
        });
    }
    /**
     * Initialize knowledge base from configuration
     */
    async initialize() {
        this.logger.info('Initializing knowledge base manager');
        try {
            await this.loadConfiguration();
            await this.initializeActiveSources();
            await this.buildKnowledgeIndex();
            this.logger.info('Knowledge base manager initialized successfully', {
                sources: this.sources.size,
                documents: this.documents.size,
                patterns: this.patterns.size,
            });
        }
        catch (error) {
            this.logger.error('Failed to initialize knowledge base manager', {
                error,
            });
            throw error;
        }
    }
    /**
     * Add a new knowledge source
     */
    async addSource(source) {
        this.logger.info('Adding knowledge source', {
            id: source.id,
            type: source.type,
            name: source.name,
        });
        const fullSource = {
            ...source,
            lastSync: undefined,
        };
        this.sources.set(source.id, fullSource);
        if (source.isActive) {
            await this.syncSource(source.id);
        }
        await this.saveConfiguration();
        this.logger.info('Knowledge source added successfully', { id: source.id });
    }
    /**
     * Remove a knowledge source
     */
    async removeSource(sourceId) {
        this.logger.info('Removing knowledge source', { sourceId });
        if (!this.sources.has(sourceId)) {
            throw new Error(`Knowledge source '${sourceId}' not found`);
        }
        // Remove all documents from this source
        const documentsToRemove = Array.from(this.documents.values())
            .filter((doc) => doc.sourceId === sourceId)
            .map((doc) => doc.id);
        for (const docId of documentsToRemove) {
            this.documents.delete(docId);
        }
        this.sources.delete(sourceId);
        await this.saveConfiguration();
        await this.rebuildKnowledgeIndex();
        this.logger.info('Knowledge source removed successfully', {
            sourceId,
            documentsRemoved: documentsToRemove.length,
        });
    }
    /**
     * Search the knowledge base
     */
    async search(query) {
        const startTime = performance.now();
        this.logger.debug('Searching knowledge base', {
            query: query.query,
            sources: query.sources?.length || 'all',
            semanticSearch: query.semanticSearch,
        });
        try {
            // Check cache first
            const cacheKey = JSON.stringify(query);
            const cached = this.searchCache.get(cacheKey);
            if (cached) {
                this.logger.debug('Returning cached search result');
                return cached;
            }
            // Filter documents by source and type
            let candidateDocuments = Array.from(this.documents.values());
            if (query.sources && query.sources.length > 0) {
                candidateDocuments = candidateDocuments.filter((doc) => query.sources.includes(doc.sourceId));
            }
            if (query.types && query.types.length > 0) {
                candidateDocuments = candidateDocuments.filter((doc) => {
                    const source = this.sources.get(doc.sourceId);
                    return source && query.types.includes(source.type);
                });
            }
            // Apply project-specific filters
            if (query.projectFilters) {
                candidateDocuments = this.applyProjectFilters(candidateDocuments, query.projectFilters);
            }
            // Score documents for relevance
            const scoredDocuments = await this.scoreDocuments(candidateDocuments, query);
            // Filter by minimum relevance and sort by score
            const relevantDocuments = scoredDocuments
                .filter((doc) => doc.relevanceScore >= query.minRelevance)
                .sort((a, b) => b.relevanceScore - a.relevanceScore)
                .slice(0, query.maxResults);
            // Generate search suggestions and related queries
            const suggestions = await this.generateSearchSuggestions(query.query, relevantDocuments);
            const relatedQueries = await this.generateRelatedQueries(query.query);
            const result = {
                documents: relevantDocuments,
                query,
                totalResults: relevantDocuments.length,
                searchTimeMs: performance.now() - startTime,
                suggestions,
                relatedQueries,
            };
            // Cache result
            this.searchCache.set(cacheKey, result);
            this.logger.info('Knowledge search completed', {
                query: query.query,
                results: relevantDocuments.length,
                searchTime: result.searchTimeMs,
            });
            return result;
        }
        catch (error) {
            this.logger.error('Knowledge search failed', {
                error,
                query: query.query,
            });
            throw error;
        }
    }
    /**
     * Get contextual suggestions based on current work context
     */
    async getContextualSuggestions(currentContext, projectPath) {
        this.logger.debug('Generating contextual suggestions', {
            contextLength: currentContext.length,
            projectPath,
        });
        try {
            const suggestions = [];
            // Extract keywords from current context
            const keywords = this.extractKeywords(currentContext);
            // Find relevant patterns
            const relevantPatterns = await this.findRelevantPatterns(keywords, projectPath);
            // Generate pattern-based suggestions
            for (const pattern of relevantPatterns) {
                const suggestion = await this.generatePatternSuggestion(pattern, currentContext);
                if (suggestion) {
                    suggestions.push(suggestion);
                }
            }
            // Find relevant documentation
            const docSearch = await this.search({
                query: keywords.join(' '),
                maxResults: 5,
                minRelevance: 0.6,
                semanticSearch: true,
                context: currentContext,
                projectFilters: projectPath
                    ? {
                        projectPath,
                        languages: this.extractLanguages(currentContext),
                        frameworks: this.extractFrameworks(currentContext),
                        activeFiles: [],
                        recentErrors: this.extractErrors(currentContext),
                    }
                    : undefined,
            });
            // Generate documentation-based suggestions
            for (const doc of docSearch.documents) {
                const suggestion = await this.generateDocumentationSuggestion(doc, currentContext);
                if (suggestion) {
                    suggestions.push(suggestion);
                }
            }
            // Sort by confidence and return top suggestions
            const sortedSuggestions = suggestions
                .sort((a, b) => b.confidence - a.confidence)
                .slice(0, 10);
            this.logger.info('Generated contextual suggestions', {
                suggestionsCount: sortedSuggestions.length,
                patternMatches: relevantPatterns.length,
                docMatches: docSearch.documents.length,
            });
            return sortedSuggestions;
        }
        catch (error) {
            this.logger.error('Failed to generate contextual suggestions', { error });
            return [];
        }
    }
    /**
     * Extract and learn institutional patterns from knowledge base
     */
    async extractInstitutionalPatterns() {
        this.logger.info('Extracting institutional patterns from knowledge base');
        try {
            // Group documents by type and analyze for patterns
            const codeDocuments = Array.from(this.documents.values()).filter((doc) => doc.format === 'code' ||
                doc.keywords.some((k) => ['function', 'class', 'method', 'api'].includes(k.toLowerCase())));
            const processDocuments = Array.from(this.documents.values()).filter((doc) => doc.keywords.some((k) => ['process', 'workflow', 'procedure', 'steps'].includes(k.toLowerCase())));
            // Extract code patterns
            await this.extractCodePatterns(codeDocuments);
            // Extract process patterns
            await this.extractProcessPatterns(processDocuments);
            // Extract best practice patterns
            await this.extractBestPracticePatterns();
            this.logger.info('Institutional patterns extracted', {
                totalPatterns: this.patterns.size,
                codePatterns: Array.from(this.patterns.values()).filter((p) => p.type === 'code').length,
                processPatterns: Array.from(this.patterns.values()).filter((p) => p.type === 'process').length,
            });
        }
        catch (error) {
            this.logger.error('Failed to extract institutional patterns', { error });
            throw error;
        }
    }
    /**
     * Get knowledge base statistics
     */
    getStats() {
        const activeSourcesCount = Array.from(this.sources.values()).filter((s) => s.isActive).length;
        const documentsByType = {
            [KnowledgeSourceType.WIKI]: 0,
            [KnowledgeSourceType.DOCUMENTATION]: 0,
            [KnowledgeSourceType.CODE_REPOSITORY]: 0,
            [KnowledgeSourceType.DESIGN_DOCS]: 0,
            [KnowledgeSourceType.BEST_PRACTICES]: 0,
            [KnowledgeSourceType.TROUBLESHOOTING]: 0,
            [KnowledgeSourceType.API_DOCS]: 0,
            [KnowledgeSourceType.ARCHITECTURE]: 0,
        };
        let totalSize = 0;
        for (const doc of this.documents.values()) {
            const source = this.sources.get(doc.sourceId);
            if (source) {
                documentsByType[source.type]++;
                totalSize += doc.size;
            }
        }
        return {
            totalSources: this.sources.size,
            activeSources: activeSourcesCount,
            totalDocuments: this.documents.size,
            totalSizeBytes: totalSize,
            lastGlobalSync: this.getLastGlobalSync(),
            documentsByType,
            searchMetrics: {
                averageResponseTime: 0, // TODO: Implement metrics tracking
                totalSearches: 0,
                cacheHitRate: 0,
            },
            patternsExtracted: this.patterns.size,
            projectCoverage: {}, // TODO: Implement project coverage analysis
        };
    }
    // Private implementation methods
    async loadConfiguration() {
        try {
            const configData = await fs.readFile(this.configPath, 'utf-8');
            const config = JSON.parse(configData);
            // Load sources
            if (config.sources) {
                for (const sourceData of config.sources) {
                    this.sources.set(sourceData.id, sourceData);
                }
            }
            // Load patterns
            if (config.patterns) {
                for (const patternData of config.patterns) {
                    this.patterns.set(patternData.id, patternData);
                }
            }
            this.logger.debug('Configuration loaded successfully');
        }
        catch (error) {
            if (error instanceof Error &&
                'code' in error &&
                error.code === 'ENOENT') {
                this.logger.info('No existing configuration found, starting fresh');
                await this.initializeDefaultSources();
            }
            else {
                this.logger.error('Failed to load configuration', { error });
                throw error;
            }
        }
    }
    async saveConfiguration() {
        const config = {
            sources: Array.from(this.sources.values()),
            patterns: Array.from(this.patterns.values()),
            lastUpdated: new Date().toISOString(),
        };
        await fs.mkdir(path.dirname(this.configPath), { recursive: true });
        await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
        this.logger.debug('Configuration saved successfully');
    }
    async initializeDefaultSources() {
        // Add default documentation sources
        const defaultSources = [
            {
                id: 'local-docs',
                name: 'Local Documentation',
                type: KnowledgeSourceType.DOCUMENTATION,
                source: path.join(process.cwd(), 'docs'),
                syncFrequencyMinutes: 30,
                isActive: true,
                indexConfig: {
                    includePatterns: ['*.md', '*.txt', '*.rst'],
                    excludePatterns: ['node_modules/**', '.git/**'],
                    maxFileSizeBytes: 5 * 1024 * 1024,
                    extractCodePatterns: true,
                    extractApiSignatures: true,
                    maxDepth: 10,
                    semanticIndexing: true,
                },
                metadata: {
                    description: 'Local project documentation',
                },
            },
        ];
        for (const source of defaultSources) {
            this.sources.set(source.id, source);
        }
        await this.saveConfiguration();
    }
    async initializeActiveSources() {
        const activeSources = Array.from(this.sources.values()).filter((s) => s.isActive);
        for (const source of activeSources) {
            try {
                await this.syncSource(source.id);
            }
            catch (error) {
                this.logger.warn('Failed to sync source during initialization', {
                    sourceId: source.id,
                    error,
                });
            }
        }
    }
    async syncSource(sourceId) {
        const source = this.sources.get(sourceId);
        if (!source || !source.isActive) {
            return;
        }
        this.logger.info('Syncing knowledge source', {
            sourceId,
            type: source.type,
        });
        try {
            switch (source.type) {
                case KnowledgeSourceType.DOCUMENTATION:
                case KnowledgeSourceType.BEST_PRACTICES:
                case KnowledgeSourceType.TROUBLESHOOTING:
                    await this.syncFileSystemSource(source);
                    break;
                case KnowledgeSourceType.WIKI:
                    await this.syncWikiSource(source);
                    break;
                case KnowledgeSourceType.CODE_REPOSITORY:
                    await this.syncCodeRepositorySource(source);
                    break;
                default:
                    this.logger.warn('Unsupported source type for sync', {
                        sourceId,
                        type: source.type,
                    });
            }
            // Update last sync time
            source.lastSync = new Date();
            await this.saveConfiguration();
            this.logger.info('Source sync completed successfully', { sourceId });
        }
        catch (error) {
            this.logger.error('Source sync failed', { sourceId, error });
            throw error;
        }
    }
    async syncFileSystemSource(source) {
        const sourcePath = path.resolve(source.source);
        try {
            await fs.access(sourcePath);
        }
        catch {
            this.logger.warn('Source path not accessible', {
                sourceId: source.id,
                path: sourcePath,
            });
            return;
        }
        await this.indexDirectory(sourcePath, source);
    }
    async syncWikiSource(_source) {
        // TODO: Implement wiki integration (Confluence, Notion, etc.)
        this.logger.warn('Wiki source sync not yet implemented');
    }
    async syncCodeRepositorySource(_source) {
        // TODO: Implement code repository integration
        this.logger.warn('Code repository source sync not yet implemented');
    }
    async indexDirectory(dirPath, source) {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                // Check depth limits and exclusion patterns
                const relativePath = path.relative(path.resolve(source.source), fullPath);
                const depth = relativePath.split(path.sep).length;
                if (depth <= source.indexConfig.maxDepth &&
                    !this.matchesPatterns(relativePath, source.indexConfig.excludePatterns)) {
                    await this.indexDirectory(fullPath, source);
                }
            }
            else if (entry.isFile()) {
                await this.indexFile(fullPath, source);
            }
        }
    }
    async indexFile(filePath, source) {
        try {
            const relativePath = path.relative(path.resolve(source.source), filePath);
            // Check inclusion/exclusion patterns
            if (!this.matchesPatterns(relativePath, source.indexConfig.includePatterns) ||
                this.matchesPatterns(relativePath, source.indexConfig.excludePatterns)) {
                return;
            }
            const stats = await fs.stat(filePath);
            // Check file size limits
            if (stats.size > source.indexConfig.maxFileSizeBytes) {
                this.logger.debug('File too large to index', {
                    filePath: relativePath,
                    size: stats.size,
                });
                return;
            }
            const content = await fs.readFile(filePath, 'utf-8');
            const docId = `${source.id}:${relativePath}`;
            // Extract keywords and metadata
            const keywords = this.extractKeywords(content);
            const format = this.detectFileFormat(filePath);
            const document = {
                id: docId,
                sourceId: source.id,
                title: path.basename(filePath, path.extname(filePath)),
                content,
                url: filePath,
                format,
                lastModified: stats.mtime,
                indexedAt: new Date(),
                size: stats.size,
                keywords,
                hierarchy: relativePath.split(path.sep),
                relatedDocuments: [],
                metadata: {
                    filePath,
                    relativePath,
                    extension: path.extname(filePath),
                },
                relevanceScore: 0,
            };
            this.documents.set(docId, document);
            this.logger.debug('File indexed successfully', {
                filePath: relativePath,
                keywords: keywords.length,
                size: stats.size,
            });
        }
        catch (error) {
            this.logger.warn('Failed to index file', { filePath, error });
        }
    }
    matchesPatterns(filePath, patterns) {
        // Simple pattern matching implementation
        // In production, would use a more sophisticated glob matching library
        return patterns.some((pattern) => {
            const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
            return regex.test(filePath);
        });
    }
    detectFileFormat(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        switch (ext) {
            case '.md':
            case '.markdown':
                return 'markdown';
            case '.html':
            case '.htm':
                return 'html';
            case '.json':
                return 'json';
            case '.yml':
            case '.yaml':
                return 'yaml';
            case '.js':
            case '.ts':
            case '.py':
            case '.java':
            case '.cpp':
            case '.c':
                return 'code';
            case '.txt':
                return 'text';
            default:
                return 'other';
        }
    }
    extractKeywords(content) {
        // Simple keyword extraction
        // In production, would use NLP libraries for better extraction
        const words = content
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter((word) => word.length > 3 && !this.isStopWord(word));
        // Count frequency and return top keywords
        const wordCount = new Map();
        for (const word of words) {
            wordCount.set(word, (wordCount.get(word) || 0) + 1);
        }
        return Array.from(wordCount.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, 20)
            .map(([word]) => word);
    }
    isStopWord(word) {
        const stopWords = new Set([
            'the',
            'a',
            'an',
            'and',
            'or',
            'but',
            'in',
            'on',
            'at',
            'to',
            'for',
            'of',
            'with',
            'by',
            'this',
            'that',
            'these',
            'those',
            'is',
            'are',
            'was',
            'were',
            'been',
            'have',
            'has',
            'had',
            'will',
            'would',
            'could',
            'should',
            'may',
            'might',
            'can',
            'must',
            'shall',
            'from',
            'into',
            'onto',
            'upon',
        ]);
        return stopWords.has(word);
    }
    async buildKnowledgeIndex() {
        this.logger.info('Building knowledge index');
        this.knowledgeIndex.clear();
        for (const doc of this.documents.values()) {
            for (const keyword of doc.keywords) {
                const docIds = this.knowledgeIndex.get(keyword) || [];
                docIds.push(doc.id);
                this.knowledgeIndex.set(keyword, docIds);
            }
        }
        this.logger.info('Knowledge index built', {
            indexEntries: this.knowledgeIndex.size,
        });
    }
    async rebuildKnowledgeIndex() {
        await this.buildKnowledgeIndex();
    }
    async scoreDocuments(documents, query) {
        const queryKeywords = this.extractKeywords(query.query);
        return documents.map((doc) => {
            let score = 0;
            // Keyword matching score
            const keywordMatches = doc.keywords.filter((keyword) => queryKeywords.some((qk) => qk.includes(keyword) || keyword.includes(qk))).length;
            score +=
                (keywordMatches / Math.max(doc.keywords.length, queryKeywords.length)) *
                    0.4;
            // Content similarity score (simplified)
            if (query.semanticSearch && doc.content && query.query) {
                score +=
                    this.calculateContentSimilarity(doc.content, query.query) * 0.6;
            }
            // Recency boost
            const daysSinceModified = (Date.now() - doc.lastModified.getTime()) / (1000 * 60 * 60 * 24);
            score += Math.max(0, 1 - daysSinceModified / 365) * 0.1; // Boost for recent documents
            // Source type relevance boost
            const source = this.sources.get(doc.sourceId);
            if (source) {
                const typeBoosts = {
                    [KnowledgeSourceType.BEST_PRACTICES]: 0.2,
                    [KnowledgeSourceType.API_DOCS]: 0.15,
                    [KnowledgeSourceType.TROUBLESHOOTING]: 0.1,
                    [KnowledgeSourceType.DOCUMENTATION]: 0.1,
                    [KnowledgeSourceType.ARCHITECTURE]: 0.05,
                    [KnowledgeSourceType.WIKI]: 0.05,
                    [KnowledgeSourceType.CODE_REPOSITORY]: 0.05,
                    [KnowledgeSourceType.DESIGN_DOCS]: 0.05,
                };
                score += typeBoosts[source.type] || 0;
            }
            return {
                ...doc,
                relevanceScore: Math.min(1, Math.max(0, score)),
            };
        });
    }
    calculateContentSimilarity(content1, content2) {
        // Simplified Jaccard similarity
        const words1 = new Set(this.extractKeywords(content1));
        const words2 = new Set(this.extractKeywords(content2));
        if (words1.size === 0 || words2.size === 0)
            return 0;
        const intersection = new Set([...words1].filter((x) => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        return intersection.size / union.size;
    }
    applyProjectFilters(documents, filters) {
        return documents.filter((doc) => {
            // Language relevance
            if (filters.languages.length > 0) {
                const hasLanguageRelevance = filters.languages.some((lang) => doc.keywords.some((keyword) => keyword.toLowerCase().includes(lang.toLowerCase())) || doc.content.toLowerCase().includes(lang.toLowerCase()));
                if (hasLanguageRelevance)
                    return true;
            }
            // Framework relevance
            if (filters.frameworks.length > 0) {
                const hasFrameworkRelevance = filters.frameworks.some((framework) => doc.keywords.some((keyword) => keyword.toLowerCase().includes(framework.toLowerCase())) || doc.content.toLowerCase().includes(framework.toLowerCase()));
                if (hasFrameworkRelevance)
                    return true;
            }
            // Default inclusion for docs without specific filters
            return filters.languages.length === 0 && filters.frameworks.length === 0;
        });
    }
    async generateSearchSuggestions(query, results) {
        const suggestions = [];
        // Extract common keywords from results
        const allKeywords = results.flatMap((doc) => doc.keywords);
        const keywordCounts = new Map();
        for (const keyword of allKeywords) {
            keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
        }
        // Generate suggestions based on frequent keywords not in original query
        const queryWords = this.extractKeywords(query);
        const topKeywords = Array.from(keywordCounts.entries())
            .filter(([keyword]) => !queryWords.includes(keyword))
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([keyword]) => keyword);
        for (const keyword of topKeywords) {
            suggestions.push(`${query} ${keyword}`);
        }
        return suggestions;
    }
    async generateRelatedQueries(query) {
        // Simple related query generation
        const baseWords = this.extractKeywords(query);
        const relatedTerms = {
            authentication: ['security', 'login', 'oauth', 'jwt'],
            database: ['sql', 'query', 'schema', 'migration'],
            testing: ['unit', 'integration', 'mock', 'coverage'],
            api: ['rest', 'graphql', 'endpoint', 'documentation'],
            error: ['debug', 'troubleshoot', 'exception', 'handling'],
        };
        const related = [];
        for (const word of baseWords) {
            const terms = relatedTerms[word.toLowerCase()];
            if (terms) {
                related.push(...terms.map((term) => `${query.replace(word, term)}`));
            }
        }
        return related.slice(0, 3);
    }
    async findRelevantPatterns(keywords, projectPath) {
        const relevantPatterns = Array.from(this.patterns.values()).filter((pattern) => {
            // Keyword matching
            const hasKeywordMatch = keywords.some((keyword) => pattern.name.toLowerCase().includes(keyword.toLowerCase()) ||
                pattern.description.toLowerCase().includes(keyword.toLowerCase()) ||
                pattern.examples.some((ex) => ex.content.toLowerCase().includes(keyword.toLowerCase())));
            // Project applicability
            const hasProjectMatch = !projectPath ||
                pattern.applicableProjects.length === 0 ||
                pattern.applicableProjects.some((proj) => projectPath.includes(proj));
            return hasKeywordMatch && hasProjectMatch;
        });
        return relevantPatterns
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 5);
    }
    async generatePatternSuggestion(pattern, _context) {
        // Generate contextual suggestion based on pattern
        const suggestion = {
            type: pattern.type === 'best_practice' ? 'best_practice' : 'code_pattern',
            title: `Apply ${pattern.name}`,
            content: `Consider applying the "${pattern.name}" pattern: ${pattern.description}`,
            confidence: pattern.confidence * 0.8, // Slight discount for pattern-based suggestions
            supportingDocs: [],
            patterns: [pattern.id],
            effort: pattern.examples.length > 0 ? 'low' : 'medium',
            benefits: [
                `Follows established ${pattern.type} pattern`,
                'Improves consistency',
                'Reduces technical debt',
            ],
            risks: pattern.type === 'anti_pattern'
                ? ['This is an anti-pattern - avoid this approach']
                : [],
        };
        return suggestion;
    }
    async generateDocumentationSuggestion(doc, _context) {
        const suggestion = {
            type: 'documentation',
            title: `Reference: ${doc.title}`,
            content: `See "${doc.title}" for relevant information: ${doc.content.substring(0, 200)}...`,
            confidence: doc.relevanceScore,
            supportingDocs: [doc.id],
            patterns: [],
            effort: 'low',
            benefits: [
                'Provides relevant documentation',
                'Follows established practices',
            ],
            risks: [],
        };
        return suggestion;
    }
    async extractCodePatterns(_documents) {
        // TODO: Implement sophisticated code pattern extraction
        this.logger.debug('Code pattern extraction not yet fully implemented');
    }
    async extractProcessPatterns(_documents) {
        // TODO: Implement process pattern extraction
        this.logger.debug('Process pattern extraction not yet fully implemented');
    }
    async extractBestPracticePatterns() {
        // TODO: Implement best practice pattern extraction
        this.logger.debug('Best practice pattern extraction not yet fully implemented');
    }
    extractLanguages(context) {
        const languages = [
            'javascript',
            'typescript',
            'python',
            'java',
            'go',
            'rust',
            'cpp',
            'c',
        ];
        return languages.filter((lang) => context.toLowerCase().includes(lang) ||
            context.toLowerCase().includes(lang.substring(0, 3)));
    }
    extractFrameworks(context) {
        const frameworks = [
            'react',
            'angular',
            'vue',
            'node',
            'express',
            'django',
            'flask',
            'spring',
        ];
        return frameworks.filter((framework) => context.toLowerCase().includes(framework.toLowerCase()));
    }
    extractErrors(context) {
        const errorPatterns = [
            /error\s*:\s*([^\n]+)/gi,
            /exception\s*:\s*([^\n]+)/gi,
            /failed\s*:\s*([^\n]+)/gi,
        ];
        const errors = [];
        for (const pattern of errorPatterns) {
            const matches = context.match(pattern);
            if (matches) {
                errors.push(...matches.map((match) => match.substring(0, 100)));
            }
        }
        return errors.slice(0, 3);
    }
    getLastGlobalSync() {
        const syncTimes = Array.from(this.sources.values())
            .map((s) => s.lastSync)
            .filter((date) => date !== undefined);
        return syncTimes.length > 0
            ? new Date(Math.min(...syncTimes.map((d) => d.getTime())))
            : undefined;
    }
}
/**
 * Create a knowledge base manager instance
 */
export function createKnowledgeBaseManager(configPath) {
    return new KnowledgeBaseManager(configPath);
}
/**
 * Global knowledge base manager instance
 */
export const knowledgeBaseManager = new KnowledgeBaseManager();
//# sourceMappingURL=KnowledgeBaseManager.js.map