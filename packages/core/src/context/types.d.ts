/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Advanced Context Retention System - Core Types
 * Comprehensive type definitions for intelligent context management
 *
 * @author Claude Code - Advanced Context Retention Agent
 * @version 1.0.0
 */
/**
 * Types of context items in the system
 */
export declare enum ContextType {
    CONVERSATION = "conversation",
    CODE = "code",
    FILE = "file",
    PROJECT_STATE = "project-state",
    ERROR = "error",
    SYSTEM = "system",
    USER_PREFERENCE = "user-preference"
}
/**
 * Priority levels for context items
 */
export declare enum ContextPriority {
    CRITICAL = "critical",// Never compress or remove
    HIGH = "high",// Compress lightly, remove only if necessary
    MEDIUM = "medium",// Standard compression and removal
    LOW = "low",// Aggressive compression, remove first
    CACHED = "cached"
}
/**
 * Core context item representation
 */
export interface ContextItem {
    /** Unique identifier for the context item */
    id: string;
    /** The actual content of the context item */
    content: string;
    /** When this context was created */
    timestamp: Date;
    /** Last time this context was accessed or updated */
    lastAccessed: Date;
    /** Type of context item */
    type: ContextType;
    /** Current priority level */
    priority: ContextPriority;
    /** Calculated relevance score (0-1) */
    relevanceScore: number;
    /** Token count for this context item */
    tokenCount: number;
    /** IDs of related context items */
    dependencies: string[];
    /** Additional metadata */
    metadata: Record<string, unknown>;
    /** Tags for categorization and search */
    tags: string[];
}
/**
 * Context prioritization configuration
 */
export interface PrioritizationConfig {
    /** Weight for recency in scoring (0-1) */
    recencyWeight: number;
    /** Weight for relevance in scoring (0-1) */
    relevanceWeight: number;
    /** Weight for user interaction in scoring (0-1) */
    interactionWeight: number;
    /** Weight for dependencies in scoring (0-1) */
    dependencyWeight: number;
    /** Maximum age before context becomes candidate for removal */
    maxAgeHours: number;
    /** Minimum relevance score to keep context */
    minRelevanceThreshold: number;
}
/**
 * Context scoring factors
 */
export interface ContextScoring {
    /** Recency score (newer = higher) */
    recency: number;
    /** Relevance to current work */
    relevance: number;
    /** User interaction frequency */
    interaction: number;
    /** Dependency importance */
    dependency: number;
    /** Final combined score */
    finalScore: number;
}
/**
 * Context prioritization result
 */
export interface PrioritizationResult {
    /** Context items sorted by priority */
    prioritized: ContextItem[];
    /** Items marked for compression */
    toCompress: ContextItem[];
    /** Items marked for removal */
    toRemove: ContextItem[];
    /** Items marked as critical (never remove) */
    critical: ContextItem[];
    /** Summary statistics */
    stats: PrioritizationStats;
}
/**
 * Prioritization statistics
 */
export interface PrioritizationStats {
    /** Total context items processed */
    totalItems: number;
    /** Items by priority level */
    byPriority: Record<ContextPriority, number>;
    /** Items by type */
    byType: Record<ContextType, number>;
    /** Average relevance score */
    averageRelevance: number;
    /** Total token count */
    totalTokens: number;
    /** Estimated compression savings */
    estimatedSavings: number;
}
/**
 * Semantic compression configuration
 */
export interface CompressionConfig {
    /** Target compression ratio (0-1) */
    targetRatio: number;
    /** Preserve important concepts */
    preserveConcepts: boolean;
    /** Compression strategy */
    strategy: CompressionStrategy;
    /** Maximum information loss tolerance */
    maxInformationLoss: number;
}
/**
 * Compression strategies
 */
export declare enum CompressionStrategy {
    SUMMARIZATION = "summarization",
    KEYWORD_EXTRACTION = "keyword_extraction",
    SEMANTIC_CLUSTERING = "semantic_clustering",
    PROGRESSIVE_DETAIL = "progressive_detail"
}
/**
 * Compression result
 */
export interface CompressionResult {
    /** Whether compression was successful */
    success: boolean;
    /** Original content */
    original: string;
    /** Compressed content */
    compressed: string;
    /** Original token count */
    originalTokens: number;
    /** Compressed token count */
    compressedTokens: number;
    /** Compression ratio achieved */
    compressionRatio: number;
    /** Key concepts preserved */
    preservedConcepts: string[];
    /** Estimated information loss */
    informationLoss: number;
    /** Compression strategy used */
    strategy: CompressionStrategy;
}
/**
 * Session context information
 */
export interface SessionContext {
    /** Unique session identifier */
    sessionId: string;
    /** Project path this session is associated with */
    projectPath: string;
    /** Session start time */
    startTime: Date;
    /** Session end time (if ended) */
    endTime?: Date;
    /** Summary of conversation in this session */
    conversationSummary: string;
    /** Code context snapshot */
    codeContext: CodeContextSnapshot;
    /** User preferences during session */
    userPreferences: Record<string, unknown>;
    /** Context items from this session */
    contextItems: ContextItem[];
}
/**
 * Code context snapshot
 */
export interface CodeContextSnapshot {
    /** Project file structure */
    projectStructure: FileTree;
    /** Currently relevant functions/classes */
    activeFunctions: FunctionSummary[];
    /** Recent code changes */
    recentChanges: CodeChange[];
    /** Dependency relationships */
    dependencies: DependencyMap;
    /** Test coverage context */
    testCoverage: TestContextMap;
    /** Open files or recently accessed files */
    activeFiles: string[];
}
/**
 * File tree structure
 */
export interface FileTree {
    /** File/directory name */
    name: string;
    /** Full path */
    path: string;
    /** Is this a directory? */
    isDirectory: boolean;
    /** Child files/directories */
    children?: FileTree[];
    /** File size in bytes */
    size?: number;
    /** Last modified time */
    lastModified?: Date;
    /** File relevance score */
    relevance?: number;
}
/**
 * Function/class summary
 */
export interface FunctionSummary {
    /** Function/class name */
    name: string;
    /** File path */
    filePath: string;
    /** Function signature or class definition */
    signature: string;
    /** Brief description of purpose */
    description: string;
    /** Parameters (for functions) */
    parameters?: ParameterInfo[];
    /** Return type */
    returnType?: string;
    /** Dependencies on other functions/classes */
    dependencies: string[];
    /** How often this is referenced */
    usageCount: number;
    /** Lines of code */
    lineCount: number;
    /** Complexity score */
    complexity: number;
}
/**
 * Parameter information
 */
export interface ParameterInfo {
    /** Parameter name */
    name: string;
    /** Parameter type */
    type: string;
    /** Is optional? */
    optional: boolean;
    /** Default value if any */
    defaultValue?: string;
    /** Parameter description */
    description?: string;
}
/**
 * Code change information
 */
export interface CodeChange {
    /** File that changed */
    filePath: string;
    /** Type of change */
    changeType: 'add' | 'modify' | 'delete' | 'rename';
    /** Timestamp of change */
    timestamp: Date;
    /** Brief description */
    description: string;
    /** Lines added */
    linesAdded: number;
    /** Lines removed */
    linesRemoved: number;
    /** Functions/classes affected */
    affectedItems: string[];
}
/**
 * Dependency mapping
 */
export type DependencyMap = Record<string, string[]>;
/**
 * Test context mapping
 */
export interface TestContextMap {
    /** Test file to source file mapping */
    testToSource: Record<string, string[]>;
    /** Source file to test file mapping */
    sourceToTest: Record<string, string[]>;
    /** Coverage percentages */
    coverage: Record<string, number>;
}
/**
 * Context window allocation
 */
export interface ContextWindow {
    /** Total available tokens */
    totalTokens: number;
    /** Currently used tokens */
    usedTokens: number;
    /** Available tokens remaining */
    availableTokens: number;
    /** Context sections */
    sections: ContextSections;
}
/**
 * Context window sections
 */
export interface ContextSections {
    /** System prompts and instructions */
    system: ContextSection;
    /** Conversation history */
    conversation: ContextSection;
    /** Code context */
    code: ContextSection;
    /** Project context */
    project: ContextSection;
    /** Long-term memory */
    memory: ContextSection;
}
/**
 * Individual context section
 */
export interface ContextSection {
    /** Section name */
    name: string;
    /** Current token usage */
    tokens: number;
    /** Maximum allowed tokens */
    maxTokens: number;
    /** Content in this section */
    content: string;
    /** Context items in this section */
    items: ContextItem[];
    /** Priority of this section */
    priority: ContextPriority;
}
/**
 * Context-aware suggestion
 */
export interface ContextSuggestion {
    /** Type of suggestion */
    type: 'command' | 'code' | 'workflow' | 'optimization' | 'debug';
    /** The suggestion text */
    suggestion: string;
    /** Confidence level (0-1) */
    confidence: number;
    /** Explanation of why this is suggested */
    reasoning: string;
    /** Historical context that supports this suggestion */
    historicalContext: string[];
    /** Estimated time/effort savings */
    estimatedBenefit?: string;
    /** Potential risks or considerations */
    warnings?: string[];
}
/**
 * Context analysis result
 */
export interface ContextAnalysis {
    /** Patterns identified in context */
    patterns: ContextPattern[];
    /** Anomalies or issues detected */
    anomalies: ContextAnomaly[];
    /** Optimization opportunities */
    optimizations: ContextOptimization[];
    /** Usage statistics */
    stats: ContextUsageStats;
}
/**
 * Identified context patterns
 */
export interface ContextPattern {
    /** Pattern name */
    name: string;
    /** Pattern description */
    description: string;
    /** Frequency of occurrence */
    frequency: number;
    /** Context items that match this pattern */
    matchingItems: string[];
    /** Confidence in pattern detection */
    confidence: number;
}
/**
 * Context anomalies
 */
export interface ContextAnomaly {
    /** Anomaly type */
    type: 'inconsistency' | 'outdated' | 'redundant' | 'missing';
    /** Description of the anomaly */
    description: string;
    /** Severity level */
    severity: 'low' | 'medium' | 'high' | 'critical';
    /** Affected context items */
    affectedItems: string[];
    /** Suggested resolution */
    resolution?: string;
}
/**
 * Context optimization opportunity
 */
export interface ContextOptimization {
    /** Optimization type */
    type: 'compression' | 'removal' | 'reorganization' | 'caching';
    /** Description of optimization */
    description: string;
    /** Estimated token savings */
    estimatedSavings: number;
    /** Implementation effort */
    effort: 'low' | 'medium' | 'high';
    /** Items to optimize */
    targetItems: string[];
}
/**
 * Context usage statistics
 */
export interface ContextUsageStats {
    /** Total context items */
    totalItems: number;
    /** Total tokens used */
    totalTokens: number;
    /** Average item size */
    averageItemSize: number;
    /** Most frequently accessed items */
    frequentItems: string[];
    /** Least recently used items */
    lruItems: string[];
    /** Context utilization rate */
    utilizationRate: number;
    /** Cache hit rate */
    cacheHitRate: number;
}
/**
 * User interaction tracking
 */
export interface UserInteraction {
    /** Interaction timestamp */
    timestamp: Date;
    /** Type of interaction */
    type: 'command' | 'file_access' | 'edit' | 'search' | 'suggestion_accepted' | 'suggestion_rejected';
    /** Context or description of the interaction */
    context: string;
    /** Files involved in the interaction */
    files?: string[];
    /** Command executed (if applicable) */
    command?: string;
    /** Success status of the interaction */
    success: boolean;
    /** Additional metadata */
    metadata?: Record<string, unknown>;
}
