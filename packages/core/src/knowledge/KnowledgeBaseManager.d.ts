/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Types of knowledge sources supported
 */
export declare enum KnowledgeSourceType {
    /** Internal company wiki (Confluence, Notion, etc.) */
    WIKI = "wiki",
    /** Technical documentation */
    DOCUMENTATION = "documentation",
    /** Internal code repositories */
    CODE_REPOSITORY = "code_repository",
    /** Design documents and specifications */
    DESIGN_DOCS = "design_docs",
    /** Best practices and guidelines */
    BEST_PRACTICES = "best_practices",
    /** Troubleshooting guides */
    TROUBLESHOOTING = "troubleshooting",
    /** API documentation */
    API_DOCS = "api_docs",
    /** Architecture diagrams and documents */
    ARCHITECTURE = "architecture"
}
/**
 * Knowledge source configuration
 */
export interface KnowledgeSource {
    /** Unique identifier for the knowledge source */
    id: string;
    /** Human-readable name */
    name: string;
    /** Type of knowledge source */
    type: KnowledgeSourceType;
    /** Source URL or path */
    source: string;
    /** Authentication configuration if needed */
    auth?: KnowledgeSourceAuth;
    /** Synchronization frequency in minutes */
    syncFrequencyMinutes: number;
    /** Whether this source is currently active */
    isActive: boolean;
    /** Indexing configuration */
    indexConfig: IndexingConfig;
    /** Last successful synchronization */
    lastSync?: Date;
    /** Source-specific metadata */
    metadata: Record<string, unknown>;
}
/**
 * Authentication configuration for knowledge sources
 */
export interface KnowledgeSourceAuth {
    /** Authentication type */
    type: 'api_key' | 'oauth' | 'basic' | 'token' | 'none';
    /** Authentication credentials (stored securely) */
    credentials: Record<string, string>;
    /** Token expiration if applicable */
    tokenExpiry?: Date;
}
/**
 * Document indexing configuration
 */
export interface IndexingConfig {
    /** Include file patterns */
    includePatterns: string[];
    /** Exclude file patterns */
    excludePatterns: string[];
    /** Maximum file size to index (bytes) */
    maxFileSizeBytes: number;
    /** Extract code patterns */
    extractCodePatterns: boolean;
    /** Extract API signatures */
    extractApiSignatures: boolean;
    /** Index depth for nested documents */
    maxDepth: number;
    /** Semantic indexing enabled */
    semanticIndexing: boolean;
}
/**
 * Indexed knowledge document
 */
export interface KnowledgeDocument {
    /** Unique document identifier */
    id: string;
    /** Source knowledge base ID */
    sourceId: string;
    /** Document title */
    title: string;
    /** Document content */
    content: string;
    /** Document URL or path */
    url: string;
    /** Document type/format */
    format: 'markdown' | 'html' | 'text' | 'code' | 'json' | 'yaml' | 'other';
    /** When document was last modified */
    lastModified: Date;
    /** When document was indexed */
    indexedAt: Date;
    /** Document size in bytes */
    size: number;
    /** Extracted keywords and tags */
    keywords: string[];
    /** Semantic embedding vector */
    embedding?: number[];
    /** Document hierarchy/path */
    hierarchy: string[];
    /** Related documents */
    relatedDocuments: string[];
    /** Document metadata */
    metadata: Record<string, unknown>;
    /** Relevance score for current context */
    relevanceScore: number;
}
/**
 * Knowledge search query
 */
export interface KnowledgeQuery {
    /** Search query text */
    query: string;
    /** Knowledge source filters */
    sources?: string[];
    /** Document type filters */
    types?: KnowledgeSourceType[];
    /** Maximum results to return */
    maxResults: number;
    /** Minimum relevance score */
    minRelevance: number;
    /** Include semantic search */
    semanticSearch: boolean;
    /** Current context for relevance boosting */
    context?: string;
    /** Project-specific filters */
    projectFilters?: ProjectKnowledgeFilters;
}
/**
 * Project-specific knowledge filters
 */
export interface ProjectKnowledgeFilters {
    /** Current project path */
    projectPath: string;
    /** Programming languages in use */
    languages: string[];
    /** Frameworks and libraries */
    frameworks: string[];
    /** Current working files */
    activeFiles: string[];
    /** Recent error patterns */
    recentErrors: string[];
}
/**
 * Knowledge search result
 */
export interface KnowledgeSearchResult {
    /** Matching documents */
    documents: KnowledgeDocument[];
    /** Search query used */
    query: KnowledgeQuery;
    /** Total results found */
    totalResults: number;
    /** Search execution time */
    searchTimeMs: number;
    /** Search suggestions for refinement */
    suggestions: string[];
    /** Related search queries */
    relatedQueries: string[];
}
/**
 * Institutional knowledge pattern
 */
export interface InstitutionalPattern {
    /** Pattern identifier */
    id: string;
    /** Pattern name */
    name: string;
    /** Pattern description */
    description: string;
    /** Pattern type */
    type: 'code' | 'process' | 'architecture' | 'best_practice' | 'anti_pattern';
    /** Pattern examples */
    examples: PatternExample[];
    /** Usage frequency */
    frequency: number;
    /** Pattern confidence score */
    confidence: number;
    /** Projects where pattern applies */
    applicableProjects: string[];
    /** Related patterns */
    relatedPatterns: string[];
    /** Last updated */
    lastUpdated: Date;
}
/**
 * Pattern example
 */
export interface PatternExample {
    /** Example title */
    title: string;
    /** Example code or process */
    content: string;
    /** Source document or file */
    source: string;
    /** Usage context */
    context: string;
    /** Example quality score */
    qualityScore: number;
}
/**
 * Knowledge-based suggestion
 */
export interface KnowledgeSuggestion {
    /** Suggestion type */
    type: 'best_practice' | 'code_pattern' | 'documentation' | 'troubleshooting' | 'optimization';
    /** Suggestion title */
    title: string;
    /** Suggestion content */
    content: string;
    /** Confidence level */
    confidence: number;
    /** Supporting knowledge documents */
    supportingDocs: string[];
    /** Institutional patterns referenced */
    patterns: string[];
    /** Implementation effort estimate */
    effort: 'low' | 'medium' | 'high';
    /** Expected benefits */
    benefits: string[];
    /** Potential risks or considerations */
    risks: string[];
}
/**
 * Knowledge base statistics
 */
export interface KnowledgeStats {
    /** Total sources configured */
    totalSources: number;
    /** Active sources */
    activeSources: number;
    /** Total indexed documents */
    totalDocuments: number;
    /** Total knowledge base size in bytes */
    totalSizeBytes: number;
    /** Last global sync */
    lastGlobalSync?: Date;
    /** Documents by source type */
    documentsByType: Record<KnowledgeSourceType, number>;
    /** Search performance metrics */
    searchMetrics: {
        averageResponseTime: number;
        totalSearches: number;
        cacheHitRate: number;
    };
    /** Institutional patterns extracted */
    patternsExtracted: number;
    /** Knowledge coverage by project */
    projectCoverage: Record<string, number>;
}
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
export declare class KnowledgeBaseManager {
    private readonly logger;
    private sources;
    private documents;
    private patterns;
    private knowledgeIndex;
    private searchCache;
    private configPath;
    constructor(configPath?: string);
    /**
     * Initialize knowledge base from configuration
     */
    initialize(): Promise<void>;
    /**
     * Add a new knowledge source
     */
    addSource(source: Omit<KnowledgeSource, 'lastSync'>): Promise<void>;
    /**
     * Remove a knowledge source
     */
    removeSource(sourceId: string): Promise<void>;
    /**
     * Search the knowledge base
     */
    search(query: KnowledgeQuery): Promise<KnowledgeSearchResult>;
    /**
     * Get contextual suggestions based on current work context
     */
    getContextualSuggestions(currentContext: string, projectPath?: string): Promise<KnowledgeSuggestion[]>;
    /**
     * Extract and learn institutional patterns from knowledge base
     */
    extractInstitutionalPatterns(): Promise<void>;
    /**
     * Get knowledge base statistics
     */
    getStats(): KnowledgeStats;
    private loadConfiguration;
    private saveConfiguration;
    private initializeDefaultSources;
    private initializeActiveSources;
    private syncSource;
    private syncFileSystemSource;
    private syncWikiSource;
    private syncCodeRepositorySource;
    private indexDirectory;
    private indexFile;
    private matchesPatterns;
    private detectFileFormat;
    private extractKeywords;
    private isStopWord;
    private buildKnowledgeIndex;
    private rebuildKnowledgeIndex;
    private scoreDocuments;
    private calculateContentSimilarity;
    private applyProjectFilters;
    private generateSearchSuggestions;
    private generateRelatedQueries;
    private findRelevantPatterns;
    private generatePatternSuggestion;
    private generateDocumentationSuggestion;
    private extractCodePatterns;
    private extractProcessPatterns;
    private extractBestPracticePatterns;
    private extractLanguages;
    private extractFrameworks;
    private extractErrors;
    private getLastGlobalSync;
}
/**
 * Create a knowledge base manager instance
 */
export declare function createKnowledgeBaseManager(configPath?: string): KnowledgeBaseManager;
/**
 * Global knowledge base manager instance
 */
export declare const knowledgeBaseManager: KnowledgeBaseManager;
