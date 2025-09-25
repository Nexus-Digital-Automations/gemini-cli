/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ITask } from '../interfaces/TaskInterfaces.js';
/**
 * Task analysis metrics for understanding task characteristics
 */
export interface TaskAnalysisMetrics {
    /** Textual complexity indicators */
    textualComplexity: TextualComplexity;
    /** Structural complexity indicators */
    structuralComplexity: StructuralComplexity;
    /** Contextual complexity indicators */
    contextualComplexity: ContextualComplexity;
    /** Overall complexity score */
    overallComplexity: number;
    /** Analysis confidence level */
    confidence: number;
}
/**
 * Textual complexity analysis
 */
export interface TextualComplexity {
    /** Character count */
    characterCount: number;
    /** Word count */
    wordCount: number;
    /** Sentence count */
    sentenceCount: number;
    /** Technical terms count */
    technicalTermsCount: number;
    /** Readability score */
    readabilityScore: number;
    /** Complexity keywords present */
    complexityKeywords: string[];
}
/**
 * Structural complexity analysis
 */
export interface StructuralComplexity {
    /** Parameter count */
    parameterCount: number;
    /** Dependency count */
    dependencyCount: number;
    /** Tag count */
    tagCount: number;
    /** Nested structure depth */
    nestingDepth: number;
    /** Type-specific complexity */
    typeComplexity: number;
}
/**
 * Contextual complexity analysis
 */
export interface ContextualComplexity {
    /** Environment variables count */
    environmentVariablesCount: number;
    /** Configuration keys count */
    configurationKeysCount: number;
    /** Timeout requirements */
    timeoutComplexity: number;
    /** Retry complexity */
    retryComplexity: number;
    /** Resource requirements complexity */
    resourceComplexity: number;
}
/**
 * Task similarity measurement
 */
export interface TaskSimilarity {
    /** Similarity score (0-1) */
    score: number;
    /** Matching factors */
    matchingFactors: string[];
    /** Differing factors */
    differingFactors: string[];
    /** Similarity breakdown */
    breakdown: SimilarityBreakdown;
}
/**
 * Similarity breakdown by category
 */
export interface SimilarityBreakdown {
    /** Name similarity */
    nameSimilarity: number;
    /** Type similarity */
    typeSimilarity: number;
    /** Parameter similarity */
    parameterSimilarity: number;
    /** Priority similarity */
    prioritySimilarity: number;
    /** Dependency similarity */
    dependencySimilarity: number;
}
/**
 * Task relationship analysis
 */
export interface TaskRelationship {
    /** Relationship type */
    type: 'parent-child' | 'sibling' | 'dependent' | 'independent' | 'conflicting';
    /** Relationship strength (0-1) */
    strength: number;
    /** Relationship description */
    description: string;
    /** Supporting evidence */
    evidence: string[];
}
/**
 * Task pattern recognition result
 */
export interface TaskPattern {
    /** Pattern name */
    name: string;
    /** Pattern description */
    description: string;
    /** Pattern confidence */
    confidence: number;
    /** Pattern attributes */
    attributes: Record<string, unknown>;
    /** Matching tasks */
    matchingTasks: string[];
}
/**
 * Comprehensive utility class for task analysis and assessment
 */
export declare class TaskAnalysisUtils {
    private static readonly COMPLEXITY_KEYWORDS;
    private static readonly TECHNICAL_TERMS;
    /**
     * Perform comprehensive task analysis
     */
    static analyzeTask(task: ITask): TaskAnalysisMetrics;
    /**
     * Analyze textual complexity of task description and name
     */
    static analyzeTextualComplexity(task: ITask): TextualComplexity;
    /**
     * Analyze structural complexity of task elements
     */
    static analyzeStructuralComplexity(task: ITask): StructuralComplexity;
    /**
     * Analyze contextual complexity from task context
     */
    static analyzeContextualComplexity(task: ITask): ContextualComplexity;
    /**
     * Calculate overall complexity using weighted factors
     */
    private static calculateOverallComplexity;
    /**
     * Normalize textual complexity to 0-10 scale
     */
    private static normalizeTextualScore;
    /**
     * Normalize structural complexity to 0-10 scale
     */
    private static normalizeStructuralScore;
    /**
     * Normalize contextual complexity to 0-10 scale
     */
    private static normalizeContextualScore;
    /**
     * Calculate analysis confidence based on available data
     */
    private static calculateAnalysisConfidence;
    /**
     * Calculate nesting depth in object
     */
    private static calculateNestingDepth;
    /**
     * Get complexity score for task type
     */
    private static getTypeComplexity;
    /**
     * Compare two tasks for similarity
     */
    static calculateTaskSimilarity(taskA: ITask, taskB: ITask): TaskSimilarity;
    /**
     * Analyze relationship between two tasks
     */
    static analyzeTaskRelationship(taskA: ITask, taskB: ITask): TaskRelationship;
    /**
     * Detect patterns in a collection of tasks
     */
    static detectTaskPatterns(tasks: ITask[]): TaskPattern[];
    /**
     * Generate task hash for deduplication
     */
    static generateTaskHash(task: ITask): string;
    /**
     * Check if two tasks are duplicates
     */
    static areTasksDuplicates(taskA: ITask, taskB: ITask): boolean;
    /**
     * Calculate string similarity using Levenshtein distance
     */
    private static calculateStringSimilarity;
    /**
     * Calculate Levenshtein distance between two strings
     */
    private static levenshteinDistance;
    /**
     * Calculate object similarity
     */
    private static calculateObjectSimilarity;
    /**
     * Calculate priority similarity
     */
    private static calculatePrioritySimilarity;
    /**
     * Calculate dependency similarity
     */
    private static calculateDependencySimilarity;
    /**
     * Group tasks by type
     */
    private static groupTasksByType;
    /**
     * Group tasks by priority
     */
    private static groupTasksByPriority;
    /**
     * Detect naming patterns in tasks
     */
    private static detectNamingPatterns;
    /**
     * Normalize parameters for consistent hashing
     */
    private static normalizeParameters;
}
