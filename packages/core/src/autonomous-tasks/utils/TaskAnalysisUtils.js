/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import crypto from 'node:crypto';
import { TaskType, TaskPriority, TaskContext, } from '../interfaces/TaskInterfaces.js';
/**
 * Comprehensive utility class for task analysis and assessment
 */
export class TaskAnalysisUtils {
    static COMPLEXITY_KEYWORDS = [
        'complex', 'intricate', 'sophisticated', 'advanced', 'comprehensive',
        'multi-step', 'multi-phase', 'integration', 'optimization', 'refactoring',
        'architecture', 'framework', 'system-wide', 'cross-platform', 'distributed',
        'async', 'concurrent', 'parallel', 'enterprise', 'scalable', 'resilient',
    ];
    static TECHNICAL_TERMS = [
        'api', 'database', 'microservice', 'deployment', 'ci/cd', 'docker',
        'kubernetes', 'authentication', 'authorization', 'encryption', 'algorithm',
        'data structure', 'performance', 'scalability', 'reliability', 'security',
    ];
    /**
     * Perform comprehensive task analysis
     */
    static analyzeTask(task) {
        const textualComplexity = this.analyzeTextualComplexity(task);
        const structuralComplexity = this.analyzeStructuralComplexity(task);
        const contextualComplexity = this.analyzeContextualComplexity(task);
        // Calculate overall complexity using weighted average
        const overallComplexity = this.calculateOverallComplexity(textualComplexity, structuralComplexity, contextualComplexity);
        // Calculate analysis confidence
        const confidence = this.calculateAnalysisConfidence(task, {
            textualComplexity,
            structuralComplexity,
            contextualComplexity,
        });
        return {
            textualComplexity,
            structuralComplexity,
            contextualComplexity,
            overallComplexity,
            confidence,
        };
    }
    /**
     * Analyze textual complexity of task description and name
     */
    static analyzeTextualComplexity(task) {
        const text = `${task.name} ${task.description}`.toLowerCase();
        const characterCount = text.length;
        const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
        const sentenceCount = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length;
        // Count technical terms
        const technicalTermsCount = this.TECHNICAL_TERMS.filter(term => text.includes(term.toLowerCase())).length;
        // Find complexity keywords
        const complexityKeywords = this.COMPLEXITY_KEYWORDS.filter(keyword => text.includes(keyword.toLowerCase()));
        // Simple readability score (Flesch-like approximation)
        const averageWordsPerSentence = wordCount / Math.max(sentenceCount, 1);
        const averageCharactersPerWord = characterCount / Math.max(wordCount, 1);
        const readabilityScore = Math.max(0, Math.min(100, 206.835 - (1.015 * averageWordsPerSentence) - (84.6 * averageCharactersPerWord / 4.7)));
        return {
            characterCount,
            wordCount,
            sentenceCount,
            technicalTermsCount,
            readabilityScore,
            complexityKeywords,
        };
    }
    /**
     * Analyze structural complexity of task elements
     */
    static analyzeStructuralComplexity(task) {
        const parameterCount = Object.keys(task.parameters).length;
        const dependencyCount = task.dependencies.length;
        const tagCount = task.tags.length;
        // Calculate nesting depth in parameters
        const nestingDepth = this.calculateNestingDepth(task.parameters);
        // Get type-specific complexity
        const typeComplexity = this.getTypeComplexity(task.type);
        return {
            parameterCount,
            dependencyCount,
            tagCount,
            nestingDepth,
            typeComplexity,
        };
    }
    /**
     * Analyze contextual complexity from task context
     */
    static analyzeContextualComplexity(task) {
        const context = task.context;
        const environmentVariablesCount = Object.keys(context?.environment || {}).length;
        const configurationKeysCount = Object.keys(context?.config || {}).length;
        // Timeout complexity (higher timeout = more complex operation)
        const timeoutComplexity = Math.min(10, Math.max(1, Math.log10((context?.timeout || 30000) / 1000)));
        // Retry complexity
        const retryComplexity = Math.min(10, (context?.maxRetries || 1) * 2);
        // Resource complexity (estimated from context size)
        const contextSize = JSON.stringify(context || {}).length;
        const resourceComplexity = Math.min(10, Math.max(1, contextSize / 1000));
        return {
            environmentVariablesCount,
            configurationKeysCount,
            timeoutComplexity,
            retryComplexity,
            resourceComplexity,
        };
    }
    /**
     * Calculate overall complexity using weighted factors
     */
    static calculateOverallComplexity(textual, structural, contextual) {
        // Normalize individual scores to 0-10 scale
        const textualScore = this.normalizeTextualScore(textual);
        const structuralScore = this.normalizeStructuralScore(structural);
        const contextualScore = this.normalizeContextualScore(contextual);
        // Weighted average (textual: 30%, structural: 50%, contextual: 20%)
        const weightedScore = (textualScore * 0.3 +
            structuralScore * 0.5 +
            contextualScore * 0.2);
        return Math.max(1, Math.min(10, Math.round(weightedScore)));
    }
    /**
     * Normalize textual complexity to 0-10 scale
     */
    static normalizeTextualScore(textual) {
        let score = 0;
        // Word count contribution (0-3 points)
        score += Math.min(3, textual.wordCount / 50);
        // Technical terms contribution (0-3 points)
        score += Math.min(3, textual.technicalTermsCount);
        // Complexity keywords contribution (0-2 points)
        score += Math.min(2, textual.complexityKeywords.length * 0.5);
        // Readability contribution (0-2 points, inverted - lower readability = higher complexity)
        score += Math.min(2, (100 - textual.readabilityScore) / 50);
        return score;
    }
    /**
     * Normalize structural complexity to 0-10 scale
     */
    static normalizeStructuralScore(structural) {
        let score = 0;
        // Parameter count contribution (0-3 points)
        score += Math.min(3, structural.parameterCount * 0.3);
        // Dependency count contribution (0-3 points)
        score += Math.min(3, structural.dependencyCount);
        // Nesting depth contribution (0-2 points)
        score += Math.min(2, structural.nestingDepth * 0.5);
        // Type complexity contribution (0-2 points)
        score += Math.min(2, structural.typeComplexity / 5);
        return score;
    }
    /**
     * Normalize contextual complexity to 0-10 scale
     */
    static normalizeContextualScore(contextual) {
        let score = 0;
        // Environment variables contribution (0-2 points)
        score += Math.min(2, contextual.environmentVariablesCount * 0.2);
        // Configuration keys contribution (0-2 points)
        score += Math.min(2, contextual.configurationKeysCount * 0.2);
        // Timeout complexity contribution (0-2 points)
        score += Math.min(2, contextual.timeoutComplexity / 5);
        // Retry complexity contribution (0-2 points)
        score += Math.min(2, contextual.retryComplexity / 5);
        // Resource complexity contribution (0-2 points)
        score += Math.min(2, contextual.resourceComplexity / 5);
        return score;
    }
    /**
     * Calculate analysis confidence based on available data
     */
    static calculateAnalysisConfidence(task, analysis) {
        let confidence = 0.5; // Base confidence
        // Increase confidence based on available information
        if (task.description.length > 50)
            confidence += 0.1;
        if (task.parameters && Object.keys(task.parameters).length > 0)
            confidence += 0.1;
        if (task.dependencies.length > 0)
            confidence += 0.1;
        if (task.context)
            confidence += 0.1;
        if (analysis.textualComplexity.technicalTermsCount > 0)
            confidence += 0.1;
        return Math.min(1.0, confidence);
    }
    /**
     * Calculate nesting depth in object
     */
    static calculateNestingDepth(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return 0;
        }
        let maxDepth = 1;
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const depth = 1 + this.calculateNestingDepth(obj[key]);
                maxDepth = Math.max(maxDepth, depth);
            }
        }
        return maxDepth;
    }
    /**
     * Get complexity score for task type
     */
    static getTypeComplexity(type) {
        const complexityMap = {
            [TaskType.CODE_GENERATION]: 8,
            [TaskType.CODE_ANALYSIS]: 6,
            [TaskType.TESTING]: 7,
            [TaskType.DOCUMENTATION]: 4,
            [TaskType.BUILD]: 5,
            [TaskType.DEPLOYMENT]: 9,
            [TaskType.REFACTORING]: 7,
            [TaskType.BUG_FIX]: 6,
            [TaskType.FEATURE]: 9,
            [TaskType.MAINTENANCE]: 5,
            [TaskType.SECURITY]: 8,
            [TaskType.PERFORMANCE]: 7,
        };
        return complexityMap[type] || 5;
    }
    /**
     * Compare two tasks for similarity
     */
    static calculateTaskSimilarity(taskA, taskB) {
        const breakdown = {
            nameSimilarity: this.calculateStringSimilarity(taskA.name, taskB.name),
            typeSimilarity: taskA.type === taskB.type ? 1.0 : 0.0,
            parameterSimilarity: this.calculateObjectSimilarity(taskA.parameters, taskB.parameters),
            prioritySimilarity: this.calculatePrioritySimilarity(taskA.priority, taskB.priority),
            dependencySimilarity: this.calculateDependencySimilarity(taskA.dependencies, taskB.dependencies),
        };
        // Calculate overall similarity (weighted average)
        const score = (breakdown.nameSimilarity * 0.3 +
            breakdown.typeSimilarity * 0.2 +
            breakdown.parameterSimilarity * 0.2 +
            breakdown.prioritySimilarity * 0.15 +
            breakdown.dependencySimilarity * 0.15);
        // Identify matching and differing factors
        const matchingFactors = [];
        const differingFactors = [];
        Object.entries(breakdown).forEach(([factor, similarity]) => {
            if (similarity > 0.7) {
                matchingFactors.push(factor);
            }
            else if (similarity < 0.3) {
                differingFactors.push(factor);
            }
        });
        return {
            score,
            matchingFactors,
            differingFactors,
            breakdown,
        };
    }
    /**
     * Analyze relationship between two tasks
     */
    static analyzeTaskRelationship(taskA, taskB) {
        const evidence = [];
        // Check for parent-child relationship
        if (taskA.parentTaskId === taskB.id) {
            return {
                type: 'parent-child',
                strength: 1.0,
                description: `Task ${taskA.id} is a child of task ${taskB.id}`,
                evidence: ['parentTaskId match'],
            };
        }
        if (taskB.parentTaskId === taskA.id) {
            return {
                type: 'parent-child',
                strength: 1.0,
                description: `Task ${taskB.id} is a child of task ${taskA.id}`,
                evidence: ['parentTaskId match'],
            };
        }
        // Check for sibling relationship
        if (taskA.parentTaskId === taskB.parentTaskId && taskA.parentTaskId) {
            return {
                type: 'sibling',
                strength: 0.9,
                description: `Tasks ${taskA.id} and ${taskB.id} are siblings`,
                evidence: ['same parent task'],
            };
        }
        // Check for dependency relationship
        const aDependent = taskA.dependencies.some(dep => dep.taskId === taskB.id);
        const bDependent = taskB.dependencies.some(dep => dep.taskId === taskA.id);
        if (aDependent || bDependent) {
            const strength = aDependent && bDependent ? 1.0 : 0.8;
            evidence.push(aDependent ? 'A depends on B' : 'B depends on A');
            return {
                type: 'dependent',
                strength,
                description: `Tasks have dependency relationship`,
                evidence,
            };
        }
        // Check for resource conflicts
        const similarity = this.calculateTaskSimilarity(taskA, taskB);
        if (similarity.score > 0.8 && taskA.type === taskB.type) {
            return {
                type: 'conflicting',
                strength: similarity.score,
                description: 'Tasks may conflict due to high similarity',
                evidence: ['high similarity', 'same task type'],
            };
        }
        // Default to independent
        return {
            type: 'independent',
            strength: 1.0 - similarity.score,
            description: 'Tasks appear to be independent',
            evidence: ['no direct relationships found'],
        };
    }
    /**
     * Detect patterns in a collection of tasks
     */
    static detectTaskPatterns(tasks) {
        const patterns = [];
        // Detect common type patterns
        const typeGroups = this.groupTasksByType(tasks);
        for (const [type, typeTasks] of typeGroups.entries()) {
            if (typeTasks.length >= 3) {
                patterns.push({
                    name: `${type}_pattern`,
                    description: `Pattern of ${type} tasks`,
                    confidence: Math.min(1.0, typeTasks.length / 10),
                    attributes: { taskType: type, count: typeTasks.length },
                    matchingTasks: typeTasks.map(t => t.id),
                });
            }
        }
        // Detect priority patterns
        const priorityGroups = this.groupTasksByPriority(tasks);
        for (const [priority, priorityTasks] of priorityGroups.entries()) {
            if (priorityTasks.length >= 5) {
                patterns.push({
                    name: `${priority}_priority_pattern`,
                    description: `Pattern of ${priority} priority tasks`,
                    confidence: Math.min(1.0, priorityTasks.length / 20),
                    attributes: { priority, count: priorityTasks.length },
                    matchingTasks: priorityTasks.map(t => t.id),
                });
            }
        }
        // Detect naming patterns
        const namingPatterns = this.detectNamingPatterns(tasks);
        patterns.push(...namingPatterns);
        return patterns;
    }
    /**
     * Generate task hash for deduplication
     */
    static generateTaskHash(task) {
        const hashData = {
            name: task.name.toLowerCase().trim(),
            type: task.type,
            description: task.description.toLowerCase().trim(),
            parameters: this.normalizeParameters(task.parameters),
        };
        const hashString = JSON.stringify(hashData, Object.keys(hashData).sort());
        return crypto.createHash('sha256').update(hashString).digest('hex').substring(0, 16);
    }
    /**
     * Check if two tasks are duplicates
     */
    static areTasksDuplicates(taskA, taskB) {
        const hashA = this.generateTaskHash(taskA);
        const hashB = this.generateTaskHash(taskB);
        return hashA === hashB;
    }
    /**
     * Calculate string similarity using Levenshtein distance
     */
    static calculateStringSimilarity(strA, strB) {
        if (strA === strB)
            return 1.0;
        if (strA.length === 0 || strB.length === 0)
            return 0.0;
        const maxLength = Math.max(strA.length, strB.length);
        const distance = this.levenshteinDistance(strA.toLowerCase(), strB.toLowerCase());
        return 1.0 - (distance / maxLength);
    }
    /**
     * Calculate Levenshtein distance between two strings
     */
    static levenshteinDistance(strA, strB) {
        const matrix = Array(strB.length + 1).fill(null).map(() => Array(strA.length + 1).fill(null));
        for (let i = 0; i <= strA.length; i++)
            matrix[0][i] = i;
        for (let j = 0; j <= strB.length; j++)
            matrix[j][0] = j;
        for (let j = 1; j <= strB.length; j++) {
            for (let i = 1; i <= strA.length; i++) {
                const indicator = strA[i - 1] === strB[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + indicator);
            }
        }
        return matrix[strB.length][strA.length];
    }
    /**
     * Calculate object similarity
     */
    static calculateObjectSimilarity(objA, objB) {
        const keysA = Object.keys(objA);
        const keysB = Object.keys(objB);
        const allKeys = [...new Set([...keysA, ...keysB])];
        if (allKeys.length === 0)
            return 1.0;
        let matches = 0;
        for (const key of allKeys) {
            if (key in objA && key in objB) {
                if (JSON.stringify(objA[key]) === JSON.stringify(objB[key])) {
                    matches++;
                }
            }
        }
        return matches / allKeys.length;
    }
    /**
     * Calculate priority similarity
     */
    static calculatePrioritySimilarity(priorityA, priorityB) {
        const maxDifference = TaskPriority.BACKGROUND - TaskPriority.CRITICAL;
        const difference = Math.abs(priorityA - priorityB);
        return 1.0 - (difference / maxDifference);
    }
    /**
     * Calculate dependency similarity
     */
    static calculateDependencySimilarity(depsA, depsB) {
        if (depsA.length === 0 && depsB.length === 0)
            return 1.0;
        if (depsA.length === 0 || depsB.length === 0)
            return 0.0;
        const taskIdsA = new Set(depsA.map(d => d.taskId));
        const taskIdsB = new Set(depsB.map(d => d.taskId));
        const intersection = [...taskIdsA].filter(id => taskIdsB.has(id));
        const union = [...new Set([...taskIdsA, ...taskIdsB])];
        return intersection.length / union.length;
    }
    /**
     * Group tasks by type
     */
    static groupTasksByType(tasks) {
        const groups = new Map();
        for (const task of tasks) {
            const group = groups.get(task.type) || [];
            group.push(task);
            groups.set(task.type, group);
        }
        return groups;
    }
    /**
     * Group tasks by priority
     */
    static groupTasksByPriority(tasks) {
        const groups = new Map();
        for (const task of tasks) {
            const group = groups.get(task.priority) || [];
            group.push(task);
            groups.set(task.priority, group);
        }
        return groups;
    }
    /**
     * Detect naming patterns in tasks
     */
    static detectNamingPatterns(tasks) {
        const patterns = [];
        const prefixGroups = new Map();
        const suffixGroups = new Map();
        // Group by common prefixes and suffixes
        for (const task of tasks) {
            const words = task.name.toLowerCase().split(/[\s\-_]+/);
            if (words.length > 1) {
                const prefix = words[0];
                const suffix = words[words.length - 1];
                // Group by prefix
                const prefixGroup = prefixGroups.get(prefix) || [];
                prefixGroup.push(task);
                prefixGroups.set(prefix, prefixGroup);
                // Group by suffix
                const suffixGroup = suffixGroups.get(suffix) || [];
                suffixGroup.push(task);
                suffixGroups.set(suffix, suffixGroup);
            }
        }
        // Create patterns for significant groups
        for (const [prefix, prefixTasks] of prefixGroups.entries()) {
            if (prefixTasks.length >= 3) {
                patterns.push({
                    name: `${prefix}_prefix_pattern`,
                    description: `Tasks with "${prefix}" prefix`,
                    confidence: Math.min(1.0, prefixTasks.length / 10),
                    attributes: { prefix, count: prefixTasks.length },
                    matchingTasks: prefixTasks.map(t => t.id),
                });
            }
        }
        for (const [suffix, suffixTasks] of suffixGroups.entries()) {
            if (suffixTasks.length >= 3) {
                patterns.push({
                    name: `${suffix}_suffix_pattern`,
                    description: `Tasks with "${suffix}" suffix`,
                    confidence: Math.min(1.0, suffixTasks.length / 10),
                    attributes: { suffix, count: suffixTasks.length },
                    matchingTasks: suffixTasks.map(t => t.id),
                });
            }
        }
        return patterns;
    }
    /**
     * Normalize parameters for consistent hashing
     */
    static normalizeParameters(parameters) {
        const normalized = {};
        for (const [key, value] of Object.entries(parameters)) {
            if (typeof value === 'string') {
                normalized[key] = value.toLowerCase().trim();
            }
            else if (typeof value === 'object' && value !== null) {
                normalized[key] = this.normalizeParameters(value);
            }
            else {
                normalized[key] = value;
            }
        }
        return normalized;
    }
}
//# sourceMappingURL=TaskAnalysisUtils.js.map