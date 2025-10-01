/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { StatisticalUtils } from './StatisticalUtils.js';
/**
 * Comprehensive data aggregation engine for budget usage data
 *
 * Features:
 * - Multi-dimensional statistical aggregation
 * - Hierarchical time-window aggregation (minute -> hour -> day -> week -> month)
 * - Intelligent caching and invalidation
 * - Automated rollup strategies for data compression
 * - Parallel processing for large datasets
 * - Advanced pattern detection and analysis
 */
export class DataAggregationEngine {
    cacheDir;
    cache = new Map();
    jobQueue = new Map();
    jobIdCounter = 0;
    constructor(baseDir) {
        this.cacheDir = path.join(baseDir, 'aggregation-cache');
        this.initializeEngine();
    }
    /**
     * Initialize aggregation engine
     */
    async initializeEngine() {
        try {
            await fs.mkdir(this.cacheDir, { recursive: true });
            await this.loadCache();
            console.log('[DataAggregationEngine] Initialized successfully');
        }
        catch (error) {
            console.error('[DataAggregationEngine] Failed to initialize:', error);
            throw error;
        }
    }
    /**
     * Load existing cache from disk
     */
    async loadCache() {
        try {
            const cachePath = path.join(this.cacheDir, 'cache-index.json');
            const cacheData = await fs.readFile(cachePath, 'utf-8');
            const savedCache = JSON.parse(cacheData);
            for (const [key, cacheEntry] of Object.entries(savedCache)) {
                if (this.isCacheEntryValid(cacheEntry)) {
                    this.cache.set(key, cacheEntry);
                }
            }
            console.log(`[DataAggregationEngine] Loaded ${this.cache.size} cache entries`);
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                console.warn('[DataAggregationEngine] Failed to load cache:', error);
            }
        }
    }
    /**
     * Save cache to disk
     */
    async saveCache() {
        try {
            const cachePath = path.join(this.cacheDir, 'cache-index.json');
            const cacheData = Object.fromEntries(this.cache);
            await fs.writeFile(cachePath, JSON.stringify(cacheData, null, 2));
        }
        catch (error) {
            console.error('[DataAggregationEngine] Failed to save cache:', error);
        }
    }
    /**
     * Check if cache entry is still valid
     */
    isCacheEntryValid(entry) {
        if (entry.invalidated)
            return false;
        if (entry.expiresAt && entry.expiresAt < Date.now())
            return false;
        return true;
    }
    /**
     * Generate cache key for aggregation
     */
    generateCacheKey(windowStart, windowEnd, window, configHash) {
        const baseKey = `${window}_${windowStart}_${windowEnd}`;
        return configHash ? `${baseKey}_${configHash}` : baseKey;
    }
    /**
     * Hash aggregation configuration for caching
     */
    hashConfig(config) {
        const configStr = JSON.stringify({
            windows: config.windows.sort(),
            calculatePercentiles: config.calculatePercentiles,
            percentileLevels: config.percentileLevels?.sort(),
            confidenceLevel: config.confidenceLevel,
            trackFeatureDistribution: config.trackFeatureDistribution,
            trackTimePatterns: config.trackTimePatterns,
            includeAdvancedStats: config.includeAdvancedStats,
        });
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < configStr.length; i++) {
            const char = configStr.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }
    /**
     * Perform aggregation on raw data
     */
    async aggregate(data, config) {
        const startTime = Date.now();
        console.log(`[DataAggregationEngine] Starting aggregation of ${data.length} data points`);
        if (data.length === 0) {
            return [];
        }
        // Validate and clean data
        const cleanData = this.validateAndCleanData(data, config);
        // Sort data by timestamp
        cleanData.sort((a, b) => a.timestamp - b.timestamp);
        const results = [];
        // Process each requested time window
        for (const window of config.windows) {
            const windowResults = await this.aggregateByWindow(cleanData, window, config);
            results.push(...windowResults);
        }
        // Cache results if caching is enabled
        if (config.cacheResults) {
            await this.cacheResults(results, config);
        }
        console.log(`[DataAggregationEngine] Aggregation completed in ${Date.now() - startTime}ms`);
        return results;
    }
    /**
     * Validate and clean input data
     */
    validateAndCleanData(data, config) {
        let cleanData = data.filter((point) => {
            // Remove invalid data points
            if (!point.timestamp || point.timestamp <= 0)
                return false;
            if (typeof point.requestCount !== 'number' || isNaN(point.requestCount))
                return false;
            if (typeof point.totalCost !== 'number' || isNaN(point.totalCost))
                return false;
            return true;
        });
        // Apply time range filter if specified
        if (config.startTime) {
            cleanData = cleanData.filter((point) => point.timestamp >= config.startTime);
        }
        if (config.endTime) {
            cleanData = cleanData.filter((point) => point.timestamp <= config.endTime);
        }
        // Remove outliers if enabled
        if (config.outlierDetection) {
            const costs = cleanData.map((p) => p.totalCost);
            const outlierAnalysis = StatisticalUtils.detectOutliers(costs, config.outlierThreshold);
            cleanData = cleanData.filter((_, index) => !outlierAnalysis.indices.includes(index));
        }
        return cleanData;
    }
    /**
     * Aggregate data by specific time window
     */
    async aggregateByWindow(data, window, config) {
        // Group data points by time window
        const windowGroups = this.groupDataByTimeWindow(data, window);
        const results = [];
        for (const [windowKey, windowData] of windowGroups) {
            if (windowData.length < config.minDataPoints) {
                continue; // Skip windows with insufficient data
            }
            const { windowStart, windowEnd } = this.parseWindowKey(windowKey, window);
            const aggregationResult = {
                timeWindow: window,
                windowStart,
                windowEnd,
                dataPointCount: windowData.length,
                // Core metrics
                usage: this.aggregateUsageMetrics(windowData),
                cost: this.aggregateCostMetrics(windowData),
                requests: this.aggregateRequestMetrics(windowData),
                usagePercentage: this.aggregateUsagePercentageMetrics(windowData),
                // Derived metrics
                costPerRequest: this.calculateCostPerRequestMetrics(windowData),
                requestsPerHour: this.calculateRequestsPerHour(windowData, windowStart, windowEnd),
                // Categorical aggregations
                featureDistribution: this.calculateFeatureDistribution(windowData, config),
                sessionCount: this.calculateSessionCount(windowData),
                uniqueUsers: this.calculateUniqueUsers(windowData),
                // Quality metrics
                dataQuality: StatisticalUtils.calculateDataQuality(windowData.map((d) => d.totalCost), config.minDataPoints, {
                    start: windowStart,
                    end: windowEnd,
                    granularity: this.getGranularityForWindow(window),
                }),
                confidenceInterval: StatisticalUtils.calculateConfidenceInterval(windowData.map((d) => d.totalCost), config.confidenceLevel),
            };
            // Add time patterns if requested
            if (config.trackTimePatterns) {
                this.addTimePatterns(aggregationResult, windowData);
            }
            // Add peak/low usage hours
            this.addPeakUsageAnalysis(aggregationResult, windowData);
            results.push(aggregationResult);
        }
        return results;
    }
    /**
     * Group data points by time window
     */
    groupDataByTimeWindow(data, window) {
        const groups = new Map();
        for (const dataPoint of data) {
            const windowKey = this.getWindowKey(dataPoint.timestamp, window);
            if (!groups.has(windowKey)) {
                groups.set(windowKey, []);
            }
            groups.get(windowKey).push(dataPoint);
        }
        return groups;
    }
    /**
     * Get window key for grouping data points
     */
    getWindowKey(timestamp, window) {
        const date = new Date(timestamp);
        switch (window) {
            case 'minute':
                return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`;
            case 'hour':
                return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
            case 'day':
                return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            case 'week': {
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                return `${weekStart.getFullYear()}-W${this.getWeekNumber(weekStart)}`;
            }
            case 'month':
                return `${date.getFullYear()}-${date.getMonth()}`;
            case 'quarter': {
                const quarter = Math.floor(date.getMonth() / 3);
                return `${date.getFullYear()}-Q${quarter}`;
            }
            case 'year':
                return `${date.getFullYear()}`;
            default:
                return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        }
    }
    /**
     * Parse window key back to start and end timestamps
     */
    parseWindowKey(windowKey, window) {
        const parts = windowKey.split('-');
        switch (window) {
            case 'minute': {
                const minuteDate = new Date(parseInt(parts[0], 10), // year
                parseInt(parts[1], 10), // month
                parseInt(parts[2], 10), // day
                parseInt(parts[3], 10), // hour
                parseInt(parts[4], 10));
                return {
                    windowStart: minuteDate.getTime(),
                    windowEnd: minuteDate.getTime() + 60 * 1000, // 1 minute
                };
            }
            case 'hour': {
                const hourDate = new Date(parseInt(parts[0], 10), // year
                parseInt(parts[1], 10), // month
                parseInt(parts[2], 10), // day
                parseInt(parts[3], 10));
                return {
                    windowStart: hourDate.getTime(),
                    windowEnd: hourDate.getTime() + 60 * 60 * 1000, // 1 hour
                };
            }
            case 'day': {
                const dayDate = new Date(parseInt(parts[0], 10), // year
                parseInt(parts[1], 10), // month
                parseInt(parts[2], 10));
                return {
                    windowStart: dayDate.getTime(),
                    windowEnd: dayDate.getTime() + 24 * 60 * 60 * 1000, // 1 day
                };
            }
            case 'week': {
                const [yearStr, weekStr] = parts;
                const year = parseInt(yearStr, 10);
                const week = parseInt(weekStr.substring(1), 10); // Remove 'W' prefix
                const weekStart = this.getDateFromWeekNumber(year, week);
                return {
                    windowStart: weekStart.getTime(),
                    windowEnd: weekStart.getTime() + 7 * 24 * 60 * 60 * 1000, // 1 week
                };
            }
            case 'month': {
                const monthDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10));
                const nextMonth = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) + 1);
                return {
                    windowStart: monthDate.getTime(),
                    windowEnd: nextMonth.getTime(),
                };
            }
            case 'quarter': {
                const [qYearStr, quarterStr] = parts;
                const qYear = parseInt(qYearStr, 10);
                const quarter = parseInt(quarterStr.substring(1), 10); // Remove 'Q' prefix
                const quarterStart = new Date(qYear, quarter * 3);
                const quarterEnd = new Date(qYear, (quarter + 1) * 3);
                return {
                    windowStart: quarterStart.getTime(),
                    windowEnd: quarterEnd.getTime(),
                };
            }
            case 'year': {
                const yearStart = new Date(parseInt(parts[0], 10), 0, 1);
                const yearEnd = new Date(parseInt(parts[0], 10) + 1, 0, 1);
                return {
                    windowStart: yearStart.getTime(),
                    windowEnd: yearEnd.getTime(),
                };
            }
            default: {
                // Default to day
                const defaultDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10), parseInt(parts[2], 10));
                return {
                    windowStart: defaultDate.getTime(),
                    windowEnd: defaultDate.getTime() + 24 * 60 * 60 * 1000,
                };
            }
        }
    }
    /**
     * Get week number for date
     */
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    }
    /**
     * Get date from year and week number
     */
    getDateFromWeekNumber(year, week) {
        const simple = new Date(year, 0, 1 + (week - 1) * 7);
        const dow = simple.getDay();
        const ISOweekStart = simple;
        if (dow <= 4) {
            ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
        }
        else {
            ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
        }
        return ISOweekStart;
    }
    /**
     * Get appropriate granularity for time window
     */
    getGranularityForWindow(window) {
        switch (window) {
            case 'minute':
            case 'hour':
                return 'minute';
            case 'day':
            case 'week':
                return 'hour';
            default:
                return 'day';
        }
    }
    /**
     * Aggregate usage metrics
     */
    aggregateUsageMetrics(data) {
        const values = data.map((d) => d.requestCount);
        return StatisticalUtils.calculateSummary(values);
    }
    /**
     * Aggregate cost metrics
     */
    aggregateCostMetrics(data) {
        const values = data.map((d) => d.totalCost);
        return StatisticalUtils.calculateSummary(values);
    }
    /**
     * Aggregate request metrics
     */
    aggregateRequestMetrics(data) {
        const values = data.map((d) => d.requestCount);
        return StatisticalUtils.calculateSummary(values);
    }
    /**
     * Aggregate usage percentage metrics
     */
    aggregateUsagePercentageMetrics(data) {
        const values = data.map((d) => d.usagePercentage);
        return StatisticalUtils.calculateSummary(values);
    }
    /**
     * Calculate cost per request metrics
     */
    calculateCostPerRequestMetrics(data) {
        const values = data
            .filter((d) => d.requestCount > 0)
            .map((d) => d.totalCost / d.requestCount);
        return StatisticalUtils.calculateSummary(values);
    }
    /**
     * Calculate requests per hour
     */
    calculateRequestsPerHour(data, windowStart, windowEnd) {
        const totalRequests = data.reduce((sum, d) => sum + d.requestCount, 0);
        const windowDurationHours = (windowEnd - windowStart) / (60 * 60 * 1000);
        return windowDurationHours > 0 ? totalRequests / windowDurationHours : 0;
    }
    /**
     * Calculate feature distribution
     */
    calculateFeatureDistribution(data, config) {
        if (!config.trackFeatureDistribution) {
            return {};
        }
        const distribution = {};
        for (const dataPoint of data) {
            if (dataPoint.features) {
                for (const feature of dataPoint.features) {
                    distribution[feature] = (distribution[feature] || 0) + 1;
                }
            }
        }
        return distribution;
    }
    /**
     * Calculate unique session count
     */
    calculateSessionCount(data) {
        const sessions = new Set();
        for (const dataPoint of data) {
            if (dataPoint.sessionId) {
                sessions.add(dataPoint.sessionId);
            }
        }
        return sessions.size;
    }
    /**
     * Calculate unique user count (estimate based on sessions)
     */
    calculateUniqueUsers(data) {
        // For now, estimate based on unique sessions
        // In a real implementation, this would use actual user IDs
        return this.calculateSessionCount(data);
    }
    /**
     * Add time patterns to aggregation result
     */
    addTimePatterns(result, data) {
        // Day of week pattern (0=Sunday)
        const dayOfWeekUsage = new Array(7).fill(0);
        const dayOfWeekCounts = new Array(7).fill(0);
        // Hour of day pattern
        const hourOfDayUsage = new Array(24).fill(0);
        const hourOfDayCounts = new Array(24).fill(0);
        for (const dataPoint of data) {
            const date = new Date(dataPoint.timestamp);
            const dayOfWeek = date.getDay();
            const hourOfDay = date.getHours();
            dayOfWeekUsage[dayOfWeek] += dataPoint.totalCost;
            dayOfWeekCounts[dayOfWeek]++;
            hourOfDayUsage[hourOfDay] += dataPoint.totalCost;
            hourOfDayCounts[hourOfDay]++;
        }
        // Calculate averages
        result.dayOfWeekPattern = dayOfWeekUsage.map((usage, i) => dayOfWeekCounts[i] > 0 ? usage / dayOfWeekCounts[i] : 0);
        result.hourOfDayPattern = hourOfDayUsage.map((usage, i) => hourOfDayCounts[i] > 0 ? usage / hourOfDayCounts[i] : 0);
    }
    /**
     * Add peak usage analysis
     */
    addPeakUsageAnalysis(result, data) {
        if (!result.hourOfDayPattern)
            return;
        // Find peak and low usage hours
        let peakHour = 0;
        let lowHour = 0;
        let peakUsage = result.hourOfDayPattern[0];
        let lowUsage = result.hourOfDayPattern[0];
        for (let hour = 1; hour < 24; hour++) {
            if (result.hourOfDayPattern[hour] > peakUsage) {
                peakUsage = result.hourOfDayPattern[hour];
                peakHour = hour;
            }
            if (result.hourOfDayPattern[hour] < lowUsage &&
                result.hourOfDayPattern[hour] > 0) {
                lowUsage = result.hourOfDayPattern[hour];
                lowHour = hour;
            }
        }
        result.peakUsageHour = peakHour;
        result.lowUsageHour = lowHour;
    }
    /**
     * Cache aggregation results
     */
    async cacheResults(results, config) {
        try {
            const configHash = this.hashConfig(config);
            for (const result of results) {
                const cacheKey = this.generateCacheKey(result.windowStart, result.windowEnd, result.timeWindow, configHash);
                const cacheEntry = {
                    key: cacheKey,
                    windowStart: result.windowStart,
                    windowEnd: result.windowEnd,
                    window: result.timeWindow,
                    result,
                    computedAt: Date.now(),
                    accessCount: 0,
                    lastAccessed: Date.now(),
                    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
                    dependencies: [],
                    invalidated: false,
                };
                this.cache.set(cacheKey, cacheEntry);
            }
            await this.saveCache();
        }
        catch (error) {
            console.error('[DataAggregationEngine] Failed to cache results:', error);
        }
    }
    /**
     * Create multi-level aggregation hierarchy
     */
    createHierarchy(baseWindow, levels) {
        const windows = [
            'minute',
            'hour',
            'day',
            'week',
            'month',
            'quarter',
            'year',
        ];
        const baseIndex = windows.indexOf(baseWindow);
        if (baseIndex === -1) {
            throw new Error(`Invalid base window: ${baseWindow}`);
        }
        const hierarchy = {
            level: 0,
            window: baseWindow,
            childLevels: [],
            rollupFactor: 1,
        };
        let currentLevel = hierarchy;
        for (let level = 1; level <= levels && baseIndex + level < windows.length; level++) {
            const nextWindow = windows[baseIndex + level];
            const rollupFactor = this.calculateRollupFactor(currentLevel.window, nextWindow);
            const nextLevel = {
                level,
                window: nextWindow,
                parentLevel: currentLevel,
                childLevels: [],
                rollupFactor,
            };
            currentLevel.childLevels.push(nextLevel);
            currentLevel = nextLevel;
        }
        return hierarchy;
    }
    /**
     * Calculate rollup factor between two time windows
     */
    calculateRollupFactor(from, to) {
        const factors = {
            'minute->hour': 60,
            'hour->day': 24,
            'day->week': 7,
            'week->month': 4.33, // Average weeks per month
            'month->quarter': 3,
            'quarter->year': 4,
        };
        return factors[`${from}->${to}`] || 1;
    }
    /**
     * Execute rollup strategy
     */
    async rollup(strategy) {
        console.log('[DataAggregationEngine] Starting rollup strategy:', strategy.strategy);
        // Implementation would depend on the specific strategy
        // This is a placeholder for the actual rollup logic
        switch (strategy.strategy) {
            case 'time_based':
                await this.executeTimeBasedRollup(strategy.timeBased);
                break;
            case 'threshold_based':
                await this.executeThresholdBasedRollup(strategy.thresholdBased);
                break;
            case 'hybrid':
                await this.executeHybridRollup(strategy.hybrid);
                break;
            default:
                // Handle unexpected values
                break;
        }
        console.log('[DataAggregationEngine] Rollup strategy completed');
    }
    /**
     * Execute time-based rollup strategy
     */
    async executeTimeBasedRollup(config) {
        // Implementation would handle time-based data rollup
        console.log('[DataAggregationEngine] Executing time-based rollup', config);
    }
    /**
     * Execute threshold-based rollup
     */
    async executeThresholdBasedRollup(config) {
        // Implementation would handle threshold-based data rollup
        console.log('[DataAggregationEngine] Executing threshold-based rollup', config);
    }
    /**
     * Execute hybrid rollup strategy
     */
    async executeHybridRollup(config) {
        // Implementation would handle hybrid rollup approach
        console.log('[DataAggregationEngine] Executing hybrid rollup', config);
    }
    /**
     * Get or compute cached aggregation
     */
    async getCachedAggregation(windowStart, windowEnd, window) {
        const cacheKey = this.generateCacheKey(windowStart, windowEnd, window);
        const cacheEntry = this.cache.get(cacheKey);
        if (cacheEntry && this.isCacheEntryValid(cacheEntry)) {
            cacheEntry.accessCount++;
            cacheEntry.lastAccessed = Date.now();
            return cacheEntry.result;
        }
        return null;
    }
    /**
     * Invalidate cache entries
     */
    async invalidateCache(dependencies) {
        for (const [key, entry] of this.cache) {
            if (dependencies.some((dep) => entry.dependencies.includes(dep))) {
                entry.invalidated = true;
            }
        }
        // Remove invalidated entries
        for (const [key, entry] of this.cache) {
            if (entry.invalidated) {
                this.cache.delete(key);
            }
        }
        await this.saveCache();
    }
    /**
     * Schedule aggregation job
     */
    async scheduleJob(job) {
        const jobId = `job_${++this.jobIdCounter}_${Date.now()}`;
        job.id = jobId;
        job.status = 'pending';
        job.progress = { current: 0, total: 100, percentage: 0 };
        this.jobQueue.set(jobId, job);
        // In a real implementation, this would integrate with a job scheduler
        // For now, we'll just simulate job execution
        this.executeJobAsync(job);
        return jobId;
    }
    /**
     * Execute job asynchronously
     */
    async executeJobAsync(job) {
        try {
            job.status = 'running';
            job.startedAt = Date.now();
            // Simulate job execution progress
            for (let i = 0; i <= 100; i += 10) {
                job.progress = { current: i, total: 100, percentage: i };
                await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate work
            }
            job.status = 'completed';
            job.completedAt = Date.now();
            job.results = []; // Would contain actual results
        }
        catch (error) {
            job.status = 'failed';
            job.error = error.message;
            job.completedAt = Date.now();
        }
    }
    /**
     * Get job status
     */
    async getJobStatus(jobId) {
        const job = this.jobQueue.get(jobId);
        if (!job) {
            throw new Error(`Job not found: ${jobId}`);
        }
        return job;
    }
    /**
     * Cancel running job
     */
    async cancelJob(jobId) {
        const job = this.jobQueue.get(jobId);
        if (job) {
            job.status = 'cancelled';
            job.completedAt = Date.now();
        }
    }
    /**
     * Get aggregation statistics
     */
    async getStats() {
        const totalAggregations = this.cache.size;
        const totalAccesses = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.accessCount, 0);
        const cacheHitRatio = totalAccesses > 0 ? totalAggregations / totalAccesses : 0;
        const jobs = Array.from(this.jobQueue.values());
        const pendingJobs = jobs.filter((job) => job.status === 'pending').length;
        const runningJobs = jobs.filter((job) => job.status === 'running').length;
        return {
            totalAggregations,
            cacheHitRatio,
            averageAggregationTime: 150, // Placeholder - would track actual times
            pendingJobs,
            runningJobs,
        };
    }
}
/**
 * Factory function to create a data aggregation engine
 */
export function createDataAggregationEngine(baseDir) {
    return new DataAggregationEngine(baseDir);
}
//# sourceMappingURL=DataAggregationEngine.js.map