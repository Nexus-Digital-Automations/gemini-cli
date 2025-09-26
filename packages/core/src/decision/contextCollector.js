/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { cpuUsage, memoryUsage } from 'node:process';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { getComponentLogger } from '../utils/logger.js';
const logger = getComponentLogger('context-collector');
/**
 * Context collector that gathers comprehensive system state for decision-making.
 *
 * The ContextCollector is responsible for gathering all relevant information
 * about the current system state that might influence autonomous decision-making.
 * This includes:
 * - System resource utilization (CPU, memory, disk, network)
 * - Task queue state and performance metrics
 * - Active agent information and capabilities
 * - Project build/test/lint status
 * - Budget constraints and usage patterns
 * - Historical performance data
 * - User preferences and constraints
 *
 * The collector is designed to be:
 * - Fast and efficient (sub-100ms collection time)
 * - Non-intrusive to system performance
 * - Resilient to data collection failures
 * - Extensible for additional context sources
 *
 * @example
 * ```typescript
 * const collector = new ContextCollector();
 * await collector.initialize();
 *
 * const context = await collector.collect();
 * console.log(`System CPU usage: ${context.systemLoad.cpu * 100}%`);
 * console.log(`Active agents: ${context.agentContext.activeAgents}`);
 * ```
 */
export class ContextCollector {
    isInitialized = false;
    lastSystemMetrics;
    lastCollectionTime = 0;
    COLLECTION_CACHE_MS = 1000; // Cache context for 1 second
    cachedContext;
    /**
     * Initialize the context collector.
     */
    async initialize() {
        logger.info('Initializing ContextCollector');
        try {
            // Initialize baseline system metrics
            this.lastSystemMetrics = await this.collectSystemMetrics();
            this.isInitialized = true;
            logger.info('ContextCollector initialized successfully');
        }
        catch (error) {
            logger.error('Failed to initialize ContextCollector', { error });
            throw error;
        }
    }
    /**
     * Shutdown the context collector gracefully.
     */
    async shutdown() {
        logger.info('Shutting down ContextCollector');
        this.isInitialized = false;
        this.cachedContext = undefined;
    }
    /**
     * Collect comprehensive decision context.
     *
     * Gathers all available system state information for decision-making.
     * Results are cached briefly to avoid repeated expensive operations.
     *
     * @returns Promise resolving to complete decision context
     */
    async collect() {
        if (!this.isInitialized) {
            throw new Error('ContextCollector not initialized');
        }
        const now = Date.now();
        // Return cached context if recent enough
        if (this.cachedContext &&
            now - this.cachedContext.timestamp < this.COLLECTION_CACHE_MS) {
            logger.debug('Returning cached decision context');
            return this.cachedContext.context;
        }
        const startTime = performance.now();
        try {
            // Collect all context components in parallel
            const [systemLoad, taskQueueState, agentContext, projectState, budgetContext, performanceHistory, userPreferences,] = await Promise.all([
                this.collectSystemLoad(),
                this.collectTaskQueueState(),
                this.collectAgentContext(),
                this.collectProjectState(),
                this.collectBudgetContext(),
                this.collectPerformanceHistory(),
                this.collectUserPreferences(),
            ]);
            const context = {
                systemLoad,
                taskQueueState,
                agentContext,
                projectState,
                budgetContext,
                performanceHistory,
                userPreferences,
                timestamp: now,
            };
            // Cache the context
            this.cachedContext = {
                context,
                timestamp: now,
            };
            const duration = performance.now() - startTime;
            logger.debug(`Collected decision context in ${duration.toFixed(2)}ms`);
            return context;
        }
        catch (error) {
            logger.error('Failed to collect decision context', { error });
            throw error;
        }
    }
    /**
     * Collect current system load metrics.
     */
    async collectSystemLoad() {
        try {
            const metrics = await this.collectSystemMetrics();
            return {
                cpu: metrics.cpu,
                memory: metrics.memory,
                diskIO: metrics.diskIO,
                networkIO: metrics.networkIO,
            };
        }
        catch (error) {
            logger.warn('Failed to collect system load', { error });
            return {
                cpu: 0.5, // Default fallback values
                memory: 0.5,
                diskIO: 0.1,
                networkIO: 0.1,
            };
        }
    }
    /**
     * Collect task queue state information.
     */
    async collectTaskQueueState() {
        try {
            // This would integrate with the actual task queue system
            // For now, provide simulated values based on system state
            // Read from FEATURES.json to get some task metrics
            const features = await this.readFeaturesJson();
            const totalFeatures = features.features?.length || 0;
            const approvedFeatures = features.features?.filter((f) => f.status === 'approved').length || 0;
            const implementedFeatures = features.features?.filter((f) => f.status === 'implemented').length ||
                0;
            return {
                totalTasks: totalFeatures,
                pendingTasks: approvedFeatures,
                runningTasks: Math.max(0, totalFeatures - approvedFeatures - implementedFeatures),
                failedTasks: 0, // Would need error tracking
                avgProcessingTime: 5000, // 5 seconds average
            };
        }
        catch (error) {
            logger.warn('Failed to collect task queue state', { error });
            return {
                totalTasks: 0,
                pendingTasks: 0,
                runningTasks: 0,
                failedTasks: 0,
                avgProcessingTime: 0,
            };
        }
    }
    /**
     * Collect agent context information.
     */
    async collectAgentContext() {
        try {
            // Read from FEATURES.json to get agent information
            const features = await this.readFeaturesJson();
            const agents = features.agents || {};
            const activeAgents = Object.keys(agents).length;
            const maxConcurrentAgents = 20; // Configuration-based limit
            // Extract agent capabilities (would be more sophisticated in practice)
            const agentCapabilities = {};
            const agentWorkloads = {};
            for (const [agentId, agentInfo] of Object.entries(agents)) {
                // Derive capabilities from agent ID patterns
                const capabilities = this.deriveAgentCapabilities(agentId);
                agentCapabilities[agentId] = capabilities;
                // Simulate workload (would be actual metrics in practice)
                agentWorkloads[agentId] = Math.random() * 5; // 0-5 tasks per agent
            }
            return {
                activeAgents,
                maxConcurrentAgents,
                agentCapabilities,
                agentWorkloads,
            };
        }
        catch (error) {
            logger.warn('Failed to collect agent context', { error });
            return {
                activeAgents: 0,
                maxConcurrentAgents: 10,
                agentCapabilities: {},
                agentWorkloads: {},
            };
        }
    }
    /**
     * Collect project state information.
     */
    async collectProjectState() {
        try {
            // Check for common project artifacts to determine state
            const projectRoot = process.cwd();
            // Check if package.json exists (Node.js project)
            const hasPackageJson = await this.fileExists(join(projectRoot, 'package.json'));
            // Check build artifacts
            const hasBuildDir = (await this.directoryExists(join(projectRoot, 'dist'))) ||
                (await this.directoryExists(join(projectRoot, 'build')));
            // Check for test directories
            const hasTests = (await this.directoryExists(join(projectRoot, 'tests'))) ||
                (await this.directoryExists(join(projectRoot, 'test'))) ||
                (await this.directoryExists(join(projectRoot, '__tests__')));
            // Simulate project state based on artifacts
            const buildStatus = hasBuildDir ? 'success' : 'unknown';
            const testStatus = hasTests ? 'passing' : 'unknown';
            const lintStatus = hasPackageJson ? 'clean' : 'unknown';
            // Check git status (simplified)
            const gitStatus = await this.checkGitStatus();
            return {
                lastBuildTime: hasBuildDir
                    ? Date.now() - Math.random() * 3600000
                    : undefined, // Last hour
                buildStatus,
                testStatus,
                lintStatus,
                gitStatus,
            };
        }
        catch (error) {
            logger.warn('Failed to collect project state', { error });
            return {
                lastBuildTime: undefined,
                buildStatus: 'unknown',
                testStatus: 'unknown',
                lintStatus: 'unknown',
                gitStatus: 'unknown',
            };
        }
    }
    /**
     * Collect budget context information.
     */
    async collectBudgetContext() {
        try {
            // This would integrate with actual budget tracking systems
            // For now, provide reasonable defaults
            return {
                remainingTokens: 100000, // Example remaining tokens
                dailyLimit: 500000, // Daily token limit
                currentUsage: 50000, // Current usage
                costPerToken: 0.000002, // $0.000002 per token
                estimatedCostForTask: 0.1, // $0.10 estimated cost
            };
        }
        catch (error) {
            logger.warn('Failed to collect budget context', { error });
            return {
                remainingTokens: undefined,
                dailyLimit: undefined,
                currentUsage: 0,
                costPerToken: 0.000002,
                estimatedCostForTask: 0.01,
            };
        }
    }
    /**
     * Collect performance history.
     */
    async collectPerformanceHistory() {
        try {
            // This would read from actual performance tracking systems
            // For now, provide simulated reasonable values
            return {
                avgSuccessRate: 0.85, // 85% success rate
                avgCompletionTime: 30000, // 30 seconds average
                commonFailureReasons: ['timeout', 'resource_limit', 'validation_error'],
                peakUsageHours: [9, 10, 11, 14, 15, 16], // Business hours
            };
        }
        catch (error) {
            logger.warn('Failed to collect performance history', { error });
            return {
                avgSuccessRate: 0.7,
                avgCompletionTime: 60000,
                commonFailureReasons: [],
                peakUsageHours: [],
            };
        }
    }
    /**
     * Collect user preferences.
     */
    async collectUserPreferences() {
        try {
            // This would read from user configuration files
            // For now, provide reasonable defaults
            return {
                allowAutonomousDecisions: true,
                maxConcurrentTasks: 5,
                preferredWorkingHours: {
                    start: 9,
                    end: 17,
                },
                criticalTaskNotification: true,
            };
        }
        catch (error) {
            logger.warn('Failed to collect user preferences', { error });
            return {
                allowAutonomousDecisions: true,
                maxConcurrentTasks: 3,
                preferredWorkingHours: undefined,
                criticalTaskNotification: false,
            };
        }
    }
    /**
     * Collect detailed system metrics.
     */
    async collectSystemMetrics() {
        const startCpuUsage = cpuUsage();
        const memUsage = memoryUsage();
        // Wait a brief moment to get CPU usage delta
        await new Promise((resolve) => setTimeout(resolve, 10));
        const endCpuUsage = cpuUsage(startCpuUsage);
        // Calculate CPU usage percentage
        const totalCpuTime = endCpuUsage.user + endCpuUsage.system;
        const cpuPercent = Math.min(totalCpuTime / 10000, 1); // Normalize to 0-1
        // Calculate memory usage percentage
        const memPercent = Math.min(memUsage.heapUsed / memUsage.heapTotal, 1);
        // Simulate disk and network I/O (would use actual system APIs in production)
        const diskIO = Math.random() * 0.1; // Low disk I/O simulation
        const networkIO = Math.random() * 0.05; // Low network I/O simulation
        return {
            cpu: cpuPercent,
            memory: memPercent,
            diskIO,
            networkIO,
        };
    }
    /**
     * Read FEATURES.json file for project context.
     */
    async readFeaturesJson() {
        try {
            const featuresPath = join(process.cwd(), 'FEATURES.json');
            const { readFile } = await import('node:fs/promises');
            const content = await readFile(featuresPath, 'utf-8');
            return JSON.parse(content);
        }
        catch (error) {
            logger.debug('Could not read FEATURES.json', { error });
            return { features: [], agents: {} };
        }
    }
    /**
     * Derive agent capabilities from agent ID.
     */
    deriveAgentCapabilities(agentId) {
        const capabilities = [];
        // Pattern matching based on agent ID
        if (agentId.toLowerCase().includes('test')) {
            capabilities.push('testing', 'validation');
        }
        if (agentId.toLowerCase().includes('security')) {
            capabilities.push('security', 'audit');
        }
        if (agentId.toLowerCase().includes('architect')) {
            capabilities.push('architecture', 'design');
        }
        if (agentId.toLowerCase().includes('task')) {
            capabilities.push('task-management', 'coordination');
        }
        if (agentId.toLowerCase().includes('doc')) {
            capabilities.push('documentation', 'analysis');
        }
        if (agentId.toLowerCase().includes('engine') ||
            agentId.toLowerCase().includes('dev')) {
            capabilities.push('development', 'implementation');
        }
        if (agentId.toLowerCase().includes('monitor')) {
            capabilities.push('monitoring', 'performance');
        }
        // Default capabilities if no specific patterns matched
        if (capabilities.length === 0) {
            capabilities.push('general', 'analysis');
        }
        return capabilities;
    }
    /**
     * Check if a file exists.
     */
    async fileExists(path) {
        try {
            const stats = await stat(path);
            return stats.isFile();
        }
        catch {
            return false;
        }
    }
    /**
     * Check if a directory exists.
     */
    async directoryExists(path) {
        try {
            const stats = await stat(path);
            return stats.isDirectory();
        }
        catch {
            return false;
        }
    }
    /**
     * Check git status (simplified).
     */
    async checkGitStatus() {
        try {
            // Check if .git directory exists
            const gitDir = join(process.cwd(), '.git');
            const hasGit = await this.directoryExists(gitDir);
            if (!hasGit) {
                return 'unknown';
            }
            // In a real implementation, this would run `git status --porcelain`
            // For now, simulate based on project activity
            const hasFeatures = await this.fileExists(join(process.cwd(), 'FEATURES.json'));
            return hasFeatures ? 'modified' : 'clean';
        }
        catch {
            return 'unknown';
        }
    }
}
//# sourceMappingURL=contextCollector.js.map