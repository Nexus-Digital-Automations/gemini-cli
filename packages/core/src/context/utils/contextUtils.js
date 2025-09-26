/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Token estimation utilities
 */
export class TokenEstimator {
    /**
     * Estimate token count for text content
     * Uses a simple heuristic - more sophisticated models would use actual tokenizer
     */
    static estimateTokens(content) {
        if (!content)
            return 0;
        // Basic estimation: ~4 characters per token for English text
        // Adjust for code content which tends to be denser
        let estimate = content.length / 4;
        // Code content adjustment
        if (this.appearsToBeCode(content)) {
            estimate *= 0.8; // Code is typically more token-dense
        }
        // Markdown/documentation adjustment
        if (this.appearsToBeMarkdown(content)) {
            estimate *= 1.2; // Markdown has more formatting tokens
        }
        return Math.ceil(estimate);
    }
    /**
     * Check if content appears to be code
     */
    static appearsToBeCode(content) {
        const codeIndicators = [
            /function\s+\w+\s*\(/,
            /class\s+\w+\s*{/,
            /import\s+.*from/,
            /const\s+\w+\s*=/,
            /let\s+\w+\s*=/,
            /var\s+\w+\s*=/,
            /if\s*\(/,
            /for\s*\(/,
            /while\s*\(/,
            /def\s+\w+\s*\(/,
            /public\s+\w+/,
            /private\s+\w+/,
        ];
        const matches = codeIndicators.filter((pattern) => pattern.test(content)).length;
        return matches >= 2; // If 2+ code patterns match, likely code
    }
    /**
     * Check if content appears to be markdown
     */
    static appearsToBeMarkdown(content) {
        const markdownIndicators = [
            /^#{1,6}\s+/m, // Headers
            /\*\*.*?\*\*/, // Bold
            /\*.*?\*/, // Italic
            /```[\s\S]*?```/, // Code blocks
            /`[^`]+`/, // Inline code
            /^\* /m, // Bullet lists
            /^\d+\. /m, // Numbered lists
            /\[.*?\]\(.*?\)/, // Links
        ];
        const matches = markdownIndicators.filter((pattern) => pattern.test(content)).length;
        return matches >= 2; // If 2+ markdown patterns match, likely markdown
    }
}
/**
 * Context item utilities
 */
export class ContextItemUtils {
    /**
     * Create a context item with smart defaults
     */
    static createContextItem(content, type, metadata = {}) {
        const now = new Date();
        const tokenCount = TokenEstimator.estimateTokens(content);
        return {
            id: this.generateContextId(),
            content,
            timestamp: now,
            lastAccessed: now,
            type,
            priority: this.inferPriority(type, content, metadata),
            relevanceScore: this.calculateInitialRelevance(type, content),
            tokenCount,
            dependencies: this.extractDependencies(content),
            metadata,
            tags: this.extractTags(content, metadata),
        };
    }
    /**
     * Generate unique context ID
     */
    static generateContextId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `ctx_${timestamp}_${random}`;
    }
    /**
     * Infer priority based on type and content
     */
    static inferPriority(type, content, metadata) {
        // Critical priority for errors and user preferences
        if (type === ContextType.ERROR || type === ContextType.USER_PREFERENCE) {
            return ContextPriority.CRITICAL;
        }
        // High priority for recent system or project state
        if (type === ContextType.SYSTEM || type === ContextType.PROJECT_STATE) {
            return ContextPriority.HIGH;
        }
        // Check content for priority indicators
        const priorityKeywords = {
            critical: ['error', 'exception', 'failed', 'crash', 'critical', 'urgent'],
            high: ['important', 'todo', 'fixme', 'warning', 'deprecated'],
            low: ['comment', 'note', 'info', 'debug'],
        };
        const contentLower = content.toLowerCase();
        if (priorityKeywords.critical.some((keyword) => contentLower.includes(keyword))) {
            return ContextPriority.HIGH;
        }
        if (priorityKeywords.high.some((keyword) => contentLower.includes(keyword))) {
            return ContextPriority.HIGH;
        }
        if (priorityKeywords.low.some((keyword) => contentLower.includes(keyword))) {
            return ContextPriority.LOW;
        }
        // Check metadata for priority hints
        if (metadata.priority) {
            return metadata.priority;
        }
        if (metadata.important === true) {
            return ContextPriority.HIGH;
        }
        // Default to medium priority
        return ContextPriority.MEDIUM;
    }
    /**
     * Calculate initial relevance score
     */
    static calculateInitialRelevance(type, content) {
        let relevance = 0.5; // Base relevance
        // Boost relevance for certain types
        const typeRelevanceBoosts = {
            [ContextType.ERROR]: 0.3,
            [ContextType.USER_PREFERENCE]: 0.4,
            [ContextType.CODE]: 0.2,
            [ContextType.PROJECT_STATE]: 0.2,
            [ContextType.CONVERSATION]: 0.1,
            [ContextType.FILE]: 0.1,
            [ContextType.SYSTEM]: 0.0,
        };
        relevance += typeRelevanceBoosts[type] || 0;
        // Boost for content with high information density
        if (content.length > 1000) {
            relevance += 0.1;
        }
        // Boost for structured content (JSON, code, etc.)
        if (this.appearsStructured(content)) {
            relevance += 0.1;
        }
        return Math.max(0, Math.min(1, relevance));
    }
    /**
     * Extract dependencies from content
     */
    static extractDependencies(content) {
        const dependencies = [];
        // Extract import dependencies
        const importPatterns = [
            /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g,
            /require\(['"`]([^'"`]+)['"`]\)/g,
            /from\s+([^\s]+)\s+import/g,
        ];
        for (const pattern of importPatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                dependencies.push(match[1]);
            }
        }
        // Extract function/class references
        const referencePatterns = [
            /(\w+)\s*\(/g, // Function calls
            /new\s+(\w+)/g, // Class instantiation
            /extends\s+(\w+)/g, // Class inheritance
            /implements\s+(\w+)/g, // Interface implementation
        ];
        const referenceCounts = new Map();
        for (const pattern of referencePatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const ref = match[1];
                if (ref.length > 2 && !this.isCommonKeyword(ref)) {
                    referenceCounts.set(ref, (referenceCounts.get(ref) || 0) + 1);
                }
            }
        }
        // Add frequently referenced items as dependencies
        for (const [ref, count] of referenceCounts.entries()) {
            if (count >= 2) {
                dependencies.push(ref);
            }
        }
        return Array.from(new Set(dependencies)); // Remove duplicates
    }
    /**
     * Extract tags from content and metadata
     */
    static extractTags(content, metadata) {
        const tags = [];
        // Extract file extension tags from metadata
        if (metadata.filePath && typeof metadata.filePath === 'string') {
            const extension = metadata.filePath.split('.').pop();
            if (extension && extension.length <= 4) {
                tags.push(extension);
            }
            // Extract directory tags
            const pathParts = metadata.filePath.split('/');
            const directories = [
                'src',
                'test',
                'tests',
                'lib',
                'utils',
                'components',
                'services',
            ];
            for (const dir of directories) {
                if (pathParts.includes(dir)) {
                    tags.push(dir);
                }
            }
        }
        // Extract programming language indicators
        const languageKeywords = {
            javascript: ['function', 'const', 'let', 'var', 'async', 'await'],
            typescript: ['interface', 'type', 'enum', 'declare', 'namespace'],
            python: ['def', 'class', 'import', 'from', '__init__', 'self'],
            java: ['public', 'private', 'protected', 'static', 'class', 'interface'],
            go: ['func', 'package', 'import', 'type', 'struct'],
            rust: ['fn', 'let', 'mut', 'impl', 'trait', 'struct'],
        };
        const contentLower = content.toLowerCase();
        for (const [lang, keywords] of Object.entries(languageKeywords)) {
            const matches = keywords.filter((keyword) => contentLower.includes(keyword)).length;
            if (matches >= 2) {
                tags.push(lang);
                break;
            }
        }
        // Extract domain-specific tags
        const domainKeywords = {
            testing: ['test', 'spec', 'expect', 'assert', 'describe', 'it'],
            database: [
                'sql',
                'query',
                'table',
                'insert',
                'select',
                'update',
                'delete',
            ],
            api: [
                'endpoint',
                'route',
                'request',
                'response',
                'http',
                'rest',
                'graphql',
            ],
            ui: ['component', 'render', 'props', 'state', 'event', 'element'],
            config: ['config', 'setting', 'option', 'environment', 'env'],
        };
        for (const [domain, keywords] of Object.entries(domainKeywords)) {
            const matches = keywords.filter((keyword) => contentLower.includes(keyword)).length;
            if (matches >= 2) {
                tags.push(domain);
            }
        }
        // Add tags from metadata
        if (metadata.tags && Array.isArray(metadata.tags)) {
            tags.push(...metadata.tags.map((tag) => String(tag)));
        }
        return Array.from(new Set(tags)); // Remove duplicates
    }
    /**
     * Check if content appears to be structured
     */
    static appearsStructured(content) {
        // Check for JSON
        try {
            JSON.parse(content);
            return true;
        }
        catch {
            // Not JSON, continue checking
        }
        // Check for code structure
        const structurePatterns = [
            /{\s*\n[\s\S]*\n\s*}/m, // Braces with newlines (code blocks)
            /\[\s*\n[\s\S]*\n\s*\]/m, // Arrays with newlines
            /^\s*[\w-]+:\s*.+$/m, // Key-value pairs
            /^#+ /m, // Markdown headers
            /^\| .* \|$/m, // Markdown tables
        ];
        return structurePatterns.some((pattern) => pattern.test(content));
    }
    /**
     * Check if a word is a common keyword
     */
    static isCommonKeyword(word) {
        const commonKeywords = [
            'the',
            'and',
            'for',
            'are',
            'but',
            'not',
            'you',
            'all',
            'can',
            'her',
            'was',
            'one',
            'our',
            'had',
            'have',
            'what',
            'were',
            'said',
            'each',
            'which',
            'she',
            'how',
            'if',
            'it',
            'is',
            'in',
            'on',
            'at',
            'to',
            'be',
            'or',
            'an',
            'as',
            'by',
            'we',
            'he',
            'do',
            'up',
            'my',
            'me',
            'no',
            'so',
            'am',
            'go',
            'us',
            'of',
            'a',
            'i',
            'get',
            'this',
            'that',
        ];
        return commonKeywords.includes(word.toLowerCase());
    }
}
/**
 * Context filtering and search utilities
 */
export class ContextSearchUtils {
    /**
     * Filter context items by criteria
     */
    static filterContextItems(items, criteria) {
        return items.filter((item) => {
            // Filter by type
            if (criteria.types && !criteria.types.includes(item.type)) {
                return false;
            }
            // Filter by priority
            if (criteria.priorities && !criteria.priorities.includes(item.priority)) {
                return false;
            }
            // Filter by tags
            if (criteria.tags &&
                !criteria.tags.some((tag) => item.tags.includes(tag))) {
                return false;
            }
            // Filter by minimum relevance
            if (criteria.minRelevance &&
                item.relevanceScore < criteria.minRelevance) {
                return false;
            }
            // Filter by age
            if (criteria.maxAge) {
                const ageHours = (Date.now() - item.lastAccessed.getTime()) / (1000 * 60 * 60);
                if (ageHours > criteria.maxAge) {
                    return false;
                }
            }
            // Filter by content
            if (criteria.hasContent &&
                !item.content.toLowerCase().includes(criteria.hasContent.toLowerCase())) {
                return false;
            }
            return true;
        });
    }
    /**
     * Search context items using fuzzy matching
     */
    static searchContextItems(items, query, limit = 10) {
        if (!query.trim()) {
            return items.slice(0, limit);
        }
        const queryLower = query.toLowerCase();
        const searchResults = items
            .map((item) => ({
            item,
            score: this.calculateSearchScore(item, queryLower),
        }))
            .filter((result) => result.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map((result) => result.item);
        return searchResults;
    }
    /**
     * Calculate search score for an item
     */
    static calculateSearchScore(item, queryLower) {
        let score = 0;
        const contentLower = item.content.toLowerCase();
        // Exact match in content (highest score)
        if (contentLower.includes(queryLower)) {
            score += 10;
            // Bonus for match at beginning
            if (contentLower.startsWith(queryLower)) {
                score += 5;
            }
        }
        // Match in tags
        if (item.tags.some((tag) => tag.toLowerCase().includes(queryLower))) {
            score += 8;
        }
        // Match in metadata
        const metadataStr = JSON.stringify(item.metadata).toLowerCase();
        if (metadataStr.includes(queryLower)) {
            score += 6;
        }
        // Fuzzy match in content (split query into words)
        const queryWords = queryLower
            .split(/\s+/)
            .filter((word) => word.length > 2);
        const matchingWords = queryWords.filter((word) => contentLower.includes(word));
        if (matchingWords.length > 0) {
            score += (matchingWords.length / queryWords.length) * 5;
        }
        // Boost based on relevance and recency
        score *= item.relevanceScore;
        const ageHours = (Date.now() - item.lastAccessed.getTime()) / (1000 * 60 * 60);
        const recencyMultiplier = Math.max(0.1, 1 - ageHours / (24 * 7)); // Decay over a week
        score *= recencyMultiplier;
        return score;
    }
    /**
     * Group context items by type
     */
    static groupByType(items) {
        const groups = new Map();
        for (const item of items) {
            if (!groups.has(item.type)) {
                groups.set(item.type, []);
            }
            groups.get(item.type).push(item);
        }
        return groups;
    }
    /**
     * Group context items by tags
     */
    static groupByTags(items) {
        const groups = new Map();
        for (const item of items) {
            for (const tag of item.tags) {
                if (!groups.has(tag)) {
                    groups.set(tag, []);
                }
                groups.get(tag).push(item);
            }
        }
        return groups;
    }
}
/**
 * Context formatting utilities
 */
export class ContextFormatUtils {
    /**
     * Format context item for display
     */
    static formatContextItem(item, options = {}) {
        const { includeMetadata = false, maxContentLength = 200, includeTimestamps = true, } = options;
        let formatted = `[${item.type.toUpperCase()}] `;
        if (includeTimestamps) {
            formatted += `${item.timestamp.toISOString()} `;
        }
        formatted += `(${item.tokenCount} tokens, relevance: ${item.relevanceScore.toFixed(2)}) `;
        if (item.tags.length > 0) {
            formatted += `#${item.tags.join(' #')} `;
        }
        formatted += '\n';
        const content = item.content.length > maxContentLength
            ? item.content.substring(0, maxContentLength) + '...'
            : item.content;
        formatted += content;
        if (includeMetadata && Object.keys(item.metadata).length > 0) {
            formatted += '\n\nMetadata: ' + JSON.stringify(item.metadata, null, 2);
        }
        return formatted;
    }
    /**
     * Format system statistics
     */
    static formatSystemStats(stats) {
        return `System Statistics:
- Total Context Items: ${stats.totalItems}
- Memory Usage: ${stats.memoryUsage.toFixed(1)} MB
- Window Utilization: ${(stats.windowUtilization * 100).toFixed(1)}%
- Compression Efficiency: ${(stats.compressionEfficiency * 100).toFixed(1)}%`;
    }
    /**
     * Format suggestions for display
     */
    static formatSuggestions(suggestions) {
        if (suggestions.length === 0) {
            return 'No suggestions available.';
        }
        return suggestions
            .map((suggestion, index) => {
            let formatted = `${index + 1}. [${suggestion.type.toUpperCase()}] ${suggestion.suggestion}`;
            formatted += `\n   Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`;
            formatted += `\n   Reasoning: ${suggestion.reasoning}`;
            if (suggestion.estimatedBenefit) {
                formatted += `\n   Benefit: ${suggestion.estimatedBenefit}`;
            }
            if (suggestion.warnings && suggestion.warnings.length > 0) {
                formatted += `\n   ⚠️ Warnings: ${suggestion.warnings.join(', ')}`;
            }
            return formatted;
        })
            .join('\n\n');
    }
}
/**
 * Session analysis utilities
 */
export class SessionAnalysisUtils {
    /**
     * Analyze session patterns
     */
    static analyzeSessionPatterns(sessions) {
        if (sessions.length === 0) {
            return {
                averageSessionLength: 0,
                commonTags: [],
                mostActiveFiles: [],
                contextTrends: {},
            };
        }
        // Calculate average session length
        const totalLength = sessions.reduce((sum, session) => {
            const start = session.startTime.getTime();
            const end = session.endTime?.getTime() || Date.now();
            return sum + (end - start);
        }, 0);
        const averageSessionLength = totalLength / sessions.length / (1000 * 60); // in minutes
        // Analyze common tags
        const tagFrequency = new Map();
        const fileFrequency = new Map();
        const typeFrequency = new Map();
        for (const session of sessions) {
            // Count tags
            for (const item of session.contextItems) {
                for (const tag of item.tags) {
                    tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
                }
                // Count file paths
                if (item.metadata.filePath &&
                    typeof item.metadata.filePath === 'string') {
                    fileFrequency.set(item.metadata.filePath, (fileFrequency.get(item.metadata.filePath) || 0) + 1);
                }
                // Count context types
                const typeStr = item.type.toString();
                typeFrequency.set(typeStr, (typeFrequency.get(typeStr) || 0) + 1);
            }
        }
        // Get top items
        const commonTags = Array.from(tagFrequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map((entry) => entry[0]);
        const mostActiveFiles = Array.from(fileFrequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map((entry) => entry[0]);
        const contextTrends = Object.fromEntries(typeFrequency.entries());
        return {
            averageSessionLength,
            commonTags,
            mostActiveFiles,
            contextTrends,
        };
    }
    /**
     * Compare sessions for similarity
     */
    static calculateSessionSimilarity(session1, session2) {
        // Compare based on overlapping context items, tags, and file paths
        const items1 = new Set(session1.contextItems.map((item) => item.content.substring(0, 100)));
        const items2 = new Set(session2.contextItems.map((item) => item.content.substring(0, 100)));
        const tags1 = new Set(session1.contextItems.flatMap((item) => item.tags));
        const tags2 = new Set(session2.contextItems.flatMap((item) => item.tags));
        const files1 = new Set(session1.contextItems
            .map((item) => item.metadata.filePath)
            .filter((path) => typeof path === 'string'));
        const files2 = new Set(session2.contextItems
            .map((item) => item.metadata.filePath)
            .filter((path) => typeof path === 'string'));
        // Calculate Jaccard similarity for each dimension
        const contentSimilarity = this.jaccardSimilarity(items1, items2);
        const tagSimilarity = this.jaccardSimilarity(tags1, tags2);
        const fileSimilarity = this.jaccardSimilarity(files1, files2);
        // Weighted average
        return contentSimilarity * 0.5 + tagSimilarity * 0.3 + fileSimilarity * 0.2;
    }
    /**
     * Calculate Jaccard similarity between two sets
     */
    static jaccardSimilarity(set1, set2) {
        const intersection = new Set([...set1].filter((x) => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        if (union.size === 0)
            return 0;
        return intersection.size / union.size;
    }
}
/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
    static measurements = new Map();
    /**
     * Start timing an operation
     */
    static startTiming(operation) {
        const startTime = performance.now();
        return () => {
            const duration = performance.now() - startTime;
            this.recordTiming(operation, duration);
        };
    }
    /**
     * Record a timing measurement
     */
    static recordTiming(operation, duration) {
        if (!this.measurements.has(operation)) {
            this.measurements.set(operation, []);
        }
        const measurements = this.measurements.get(operation);
        measurements.push(duration);
        // Keep only last 100 measurements
        if (measurements.length > 100) {
            measurements.shift();
        }
    }
    /**
     * Get performance statistics
     */
    static getStats(operation) {
        const measurements = this.measurements.get(operation);
        if (!measurements || measurements.length === 0) {
            return null;
        }
        const sorted = [...measurements].sort((a, b) => a - b);
        const count = measurements.length;
        const average = measurements.reduce((sum, val) => sum + val, 0) / count;
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const median = sorted[Math.floor(count / 2)];
        return { count, average, min, max, median };
    }
    /**
     * Get all performance statistics
     */
    static getAllStats() {
        const allStats = {};
        for (const operation of this.measurements.keys()) {
            allStats[operation] = this.getStats(operation);
        }
        return allStats;
    }
    /**
     * Clear all measurements
     */
    static clear() {
        this.measurements.clear();
    }
}
//# sourceMappingURL=contextUtils.js.map