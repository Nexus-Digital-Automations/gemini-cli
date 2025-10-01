/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Token Monitoring Service
 * Real-time tracking of token usage across all context windows and sessions
 *
 * Provides comprehensive monitoring for the auto-compression system to detect
 * when token limits are being approached and trigger appropriate responses.
 *
 * @author Claude Code - Auto-Compression Implementation Agent
 * @version 1.0.0
 */
import { getComponentLogger } from '../utils/logger.js';
import EventEmitter from 'node:events';
import { performance } from 'node:perf_hooks';
const logger = getComponentLogger('token-monitor-service');
/**
 * Token monitoring event types
 */
export var TokenEventType;
(function (TokenEventType) {
    TokenEventType["THRESHOLD_CROSSED"] = "threshold_crossed";
    TokenEventType["GROWTH_SPIKE"] = "growth_spike";
    TokenEventType["EFFICIENCY_DROP"] = "efficiency_drop";
    TokenEventType["COMPRESSION_NEEDED"] = "compression_needed";
    TokenEventType["LIMIT_APPROACHING"] = "limit_approaching";
    TokenEventType["CRITICAL_USAGE"] = "critical_usage";
    TokenEventType["EMERGENCY_STATE"] = "emergency_state";
    TokenEventType["OPTIMIZATION_OPPORTUNITY"] = "optimization_opportunity";
})(TokenEventType || (TokenEventType = {}));
/**
 * Default configuration
 */
export const DEFAULT_TOKEN_MONITOR_CONFIG = {
    checkInterval: 10000, // 10 seconds
    enableHighFrequencyMode: true,
    highFrequencyInterval: 2000, // 2 seconds
    highFrequencyThreshold: 0.8,
    thresholds: {
        maxTokens: 1048576, // 1M tokens
        warnings: {
            info: 0.7,
            warning: 0.8,
            critical: 0.9,
            emergency: 0.95,
        },
        compressionTriggers: {
            soft: 0.75,
            aggressive: 0.85,
            emergency: 0.95,
        },
    },
    enableDetailedTracking: true,
    retention: {
        detailedSnapshotRetention: 60 * 60 * 1000, // 1 hour
        summaryRetention: 24 * 60 * 60 * 1000, // 24 hours
        maxSnapshots: 1000,
        maxEvents: 500,
    },
};
/**
 * Token Monitoring Service
 *
 * The TokenMonitorService provides comprehensive real-time monitoring of token
 * usage across all context windows and sessions. It detects when limits are
 * being approached and emits events to trigger compression or other responses.
 *
 * Key Features:
 * - Real-time Token Tracking: Continuous monitoring of total token usage
 * - Adaptive Monitoring: Higher frequency monitoring during critical periods
 * - Growth Rate Analysis: Predicts when limits will be reached
 * - Efficiency Tracking: Monitors context window utilization effectiveness
 * - Event-based Notifications: Emits events for threshold crossings and alerts
 * - Detailed Breakdowns: Tracks usage by manager, section, type, and priority
 *
 * @example
 * ```typescript
 * const monitor = new TokenMonitorService();
 * monitor.registerContextManager('main', contextManager);
 * monitor.start();
 *
 * monitor.on(TokenEventType.COMPRESSION_NEEDED, (event) => {
 *   console.log(`Compression needed: ${event.message}`);
 *   triggerCompression(event.snapshot);
 * });
 * ```
 */
export class TokenMonitorService extends EventEmitter {
    config;
    contextManagers = new Map();
    usageHistory = [];
    eventHistory = [];
    monitoringTimer = null;
    isHighFrequencyMode = false;
    lastThresholdLevel = null;
    performanceCounters = {
        totalChecks: 0,
        totalEvents: 0,
        lastCheckDuration: 0,
        averageCheckDuration: 0,
    };
    constructor(config = {}) {
        super();
        this.config = { ...DEFAULT_TOKEN_MONITOR_CONFIG, ...config };
        this.setMaxListeners(100);
        logger.info('TokenMonitorService initialized', {
            checkInterval: this.config.checkInterval,
            maxTokens: this.config.thresholds.maxTokens,
            enableDetailedTracking: this.config.enableDetailedTracking,
        });
    }
    /**
     * Start token monitoring
     */
    start() {
        if (this.monitoringTimer) {
            logger.warn('TokenMonitorService already started');
            return;
        }
        logger.info('Starting token monitoring service');
        this.scheduleNextCheck();
        // Initial check
        this.performMonitoringCheck();
    }
    /**
     * Stop token monitoring
     */
    stop() {
        if (this.monitoringTimer) {
            clearTimeout(this.monitoringTimer);
            this.monitoringTimer = null;
        }
        logger.info('TokenMonitorService stopped');
    }
    /**
     * Register a context manager for monitoring
     */
    registerContextManager(id, manager) {
        this.contextManagers.set(id, manager);
        logger.debug(`Registered context manager for monitoring: ${id}`);
        // Immediately check if this changes our monitoring needs
        if (this.monitoringTimer) {
            this.performMonitoringCheck();
        }
    }
    /**
     * Unregister a context manager
     */
    unregisterContextManager(id) {
        this.contextManagers.delete(id);
        logger.debug(`Unregistered context manager: ${id}`);
    }
    /**
     * Get current token usage snapshot
     */
    getCurrentUsage() {
        return this.captureUsageSnapshot();
    }
    /**
     * Get usage history
     */
    getUsageHistory(limit = 100) {
        return this.usageHistory.slice(-limit);
    }
    /**
     * Get event history
     */
    getEventHistory(limit = 50) {
        return this.eventHistory.slice(-limit);
    }
    /**
     * Get monitoring statistics
     */
    getMonitoringStats() {
        return {
            ...this.performanceCounters,
            isHighFrequencyMode: this.isHighFrequencyMode,
            lastThresholdLevel: this.lastThresholdLevel,
            managersCount: this.contextManagers.size,
            snapshotsCount: this.usageHistory.length,
            eventsCount: this.eventHistory.length,
        };
    }
    /**
     * Manually trigger a monitoring check
     */
    triggerCheck() {
        return this.performMonitoringCheck();
    }
    /**
     * Update monitoring configuration
     */
    updateConfig(newConfig) {
        const oldConfig = { ...this.config };
        this.config = { ...this.config, ...newConfig };
        logger.info('TokenMonitorService configuration updated', {
            oldConfig,
            newConfig: this.config,
        });
        // Restart monitoring if interval changed
        if (newConfig.checkInterval && this.monitoringTimer) {
            this.stop();
            this.start();
        }
    }
    /**
     * Perform a monitoring check
     */
    performMonitoringCheck() {
        const startTime = performance.now();
        try {
            const snapshot = this.captureUsageSnapshot();
            this.addToHistory(snapshot);
            this.analyzeSnapshot(snapshot);
            this.updateMonitoringMode(snapshot);
            const duration = performance.now() - startTime;
            this.updatePerformanceCounters(duration);
            logger.debug('Monitoring check completed', {
                totalTokens: snapshot.totalTokens,
                utilizationRatio: snapshot.utilizationRatio,
                growthRate: snapshot.growthRate,
                checkDuration: duration.toFixed(2),
            });
            return snapshot;
        }
        catch (error) {
            logger.error('Error during monitoring check', { error });
            throw error;
        }
        finally {
            this.scheduleNextCheck();
        }
    }
    /**
     * Capture current usage snapshot across all managers
     */
    captureUsageSnapshot() {
        const timestamp = new Date();
        let totalTokens = 0;
        const byManager = {};
        const byType = {};
        const byPriority = {};
        // Collect data from all context managers
        for (const [managerId, manager] of this.contextManagers.entries()) {
            const window = manager.getCurrentWindow();
            const managerUsage = this.analyzeManagerUsage(managerId, manager);
            totalTokens += window.usedTokens;
            byManager[managerId] = managerUsage;
            // Aggregate by type and priority
            for (const [_sectionName, section] of Object.entries(window.sections)) {
                for (const item of section.items) {
                    const type = String(item.type);
                    const priority = String(item.priority);
                    byType[type] = (byType[type] || 0) + item.tokenCount;
                    byPriority[priority] = (byPriority[priority] || 0) + item.tokenCount;
                }
            }
        }
        const utilizationRatio = totalTokens / this.config.thresholds.maxTokens;
        const growthRate = this.calculateGrowthRate();
        const timeUntilLimit = growthRate > 0
            ? (this.config.thresholds.maxTokens - totalTokens) / growthRate
            : Infinity;
        const efficiency = this.calculateEfficiencyMetrics(byManager, totalTokens);
        return {
            timestamp,
            totalTokens,
            byManager,
            byType,
            byPriority,
            utilizationRatio,
            growthRate,
            timeUntilLimit,
            efficiency,
        };
    }
    /**
     * Analyze usage for a specific context manager
     */
    analyzeManagerUsage(managerId, manager) {
        const window = manager.getCurrentWindow();
        const sections = {};
        for (const [sectionName, section] of Object.entries(window.sections)) {
            const avgTokensPerItem = section.items.length > 0 ? section.tokens / section.items.length : 0;
            const utilization = section.maxTokens > 0 ? section.tokens / section.maxTokens : 0;
            // Estimate compression potential based on content type and current usage
            const compressionPotential = this.estimateCompressionPotential(section);
            sections[sectionName] = {
                sectionName,
                tokens: section.tokens,
                maxTokens: section.maxTokens,
                itemCount: section.items.length,
                avgTokensPerItem,
                utilization,
                compressionPotential,
            };
        }
        return {
            managerId,
            totalTokens: window.usedTokens,
            sections,
            windowConfig: {
                maxTokens: window.totalTokens,
                usedTokens: window.usedTokens,
                availableTokens: window.availableTokens,
            },
            performance: {
                compressionRatio: this.calculateCompressionRatio(window),
                accessFrequency: this.calculateAccessFrequency(window),
                lastOptimization: null, // Would track from manager if available
            },
        };
    }
    /**
     * Estimate compression potential for a section
     */
    estimateCompressionPotential(section) {
        if (section.items.length === 0)
            return 0;
        let potential = 0.3; // Base potential
        // Higher potential for conversations (summarizable)
        if (section.name === 'conversation') {
            potential += 0.3;
        }
        // Lower potential for code (harder to compress)
        if (section.name === 'code') {
            potential -= 0.1;
        }
        // Higher potential for large sections
        if (section.tokens > 10000) {
            potential += 0.2;
        }
        // Higher potential for repetitive content (many similar items)
        if (section.items.length > 10) {
            potential += 0.1;
        }
        return Math.max(0.1, Math.min(0.8, potential));
    }
    /**
     * Calculate compression ratio for a window
     */
    calculateCompressionRatio(_window) {
        // This would ideally track actual compression history
        // For now, estimate based on utilization and content types
        return 0.7; // Default assumption of 70% compression ratio
    }
    /**
     * Calculate access frequency for a window
     */
    calculateAccessFrequency(_window) {
        // This would ideally track actual access patterns
        // For now, estimate based on recent activity
        return 1.0; // Default assumption of recent activity
    }
    /**
     * Calculate token growth rate based on recent history
     */
    calculateGrowthRate() {
        if (this.usageHistory.length < 2)
            return 0;
        const recent = this.usageHistory.slice(-5); // Last 5 measurements
        if (recent.length < 2)
            return 0;
        let totalGrowth = 0;
        let timeSpan = 0;
        for (let i = 1; i < recent.length; i++) {
            const tokenDelta = recent[i].totalTokens - recent[i - 1].totalTokens;
            const timeDelta = recent[i].timestamp.getTime() - recent[i - 1].timestamp.getTime();
            if (timeDelta > 0) {
                totalGrowth += tokenDelta;
                timeSpan += timeDelta;
            }
        }
        if (timeSpan === 0)
            return 0;
        // Return tokens per minute
        return (totalGrowth / timeSpan) * (60 * 1000);
    }
    /**
     * Calculate efficiency metrics
     */
    calculateEfficiencyMetrics(byManager, _totalTokens) {
        let totalUtilization = 0;
        let wastedTokens = 0;
        let managerCount = 0;
        for (const manager of Object.values(byManager)) {
            const utilization = manager.windowConfig.maxTokens > 0
                ? manager.windowConfig.usedTokens / manager.windowConfig.maxTokens
                : 0;
            totalUtilization += utilization;
            wastedTokens += Math.max(0, manager.windowConfig.maxTokens - manager.windowConfig.usedTokens);
            managerCount++;
        }
        const overallUtilization = managerCount > 0 ? totalUtilization / managerCount : 0;
        return {
            overallUtilization,
            wastedTokens,
            compressionEffectiveness: 0.7, // Would track from actual compression history
            relevanceScore: 0.8, // Would calculate from context relevance
            accessEfficiency: 0.9, // Would calculate from access patterns
        };
    }
    /**
     * Analyze snapshot for events and alerts
     */
    analyzeSnapshot(snapshot) {
        // Check threshold crossings
        this.checkThresholdCrossings(snapshot);
        // Check growth rate spikes
        this.checkGrowthSpikes(snapshot);
        // Check efficiency drops
        this.checkEfficiencyDrops(snapshot);
        // Check for optimization opportunities
        this.checkOptimizationOpportunities(snapshot);
    }
    /**
     * Check for threshold crossings
     */
    checkThresholdCrossings(snapshot) {
        const thresholds = this.config.thresholds;
        let currentLevel = null;
        let severity = 'info';
        if (snapshot.utilizationRatio >= thresholds.warnings.emergency) {
            currentLevel = 'emergency';
            severity = 'emergency';
        }
        else if (snapshot.utilizationRatio >= thresholds.warnings.critical) {
            currentLevel = 'critical';
            severity = 'critical';
        }
        else if (snapshot.utilizationRatio >= thresholds.warnings.warning) {
            currentLevel = 'warning';
            severity = 'warning';
        }
        else if (snapshot.utilizationRatio >= thresholds.warnings.info) {
            currentLevel = 'info';
            severity = 'info';
        }
        // Only emit event if threshold level changed
        if (currentLevel && currentLevel !== this.lastThresholdLevel) {
            this.emitEvent({
                type: TokenEventType.THRESHOLD_CROSSED,
                timestamp: new Date(),
                snapshot,
                data: {
                    oldLevel: this.lastThresholdLevel,
                    newLevel: currentLevel,
                    threshold: thresholds.warnings[currentLevel],
                },
                severity,
                message: `Token usage crossed ${currentLevel} threshold: ${(snapshot.utilizationRatio * 100).toFixed(1)}%`,
            });
            this.lastThresholdLevel = currentLevel;
        }
        // Check compression triggers
        if (snapshot.utilizationRatio >= thresholds.compressionTriggers.emergency) {
            this.emitEvent({
                type: TokenEventType.COMPRESSION_NEEDED,
                timestamp: new Date(),
                snapshot,
                data: {
                    compressionType: 'emergency',
                    threshold: thresholds.compressionTriggers.emergency,
                },
                severity: 'emergency',
                message: 'Emergency compression needed immediately',
            });
        }
        else if (snapshot.utilizationRatio >= thresholds.compressionTriggers.aggressive) {
            this.emitEvent({
                type: TokenEventType.COMPRESSION_NEEDED,
                timestamp: new Date(),
                snapshot,
                data: {
                    compressionType: 'aggressive',
                    threshold: thresholds.compressionTriggers.aggressive,
                },
                severity: 'critical',
                message: 'Aggressive compression recommended',
            });
        }
        else if (snapshot.utilizationRatio >= thresholds.compressionTriggers.soft) {
            this.emitEvent({
                type: TokenEventType.COMPRESSION_NEEDED,
                timestamp: new Date(),
                snapshot,
                data: {
                    compressionType: 'soft',
                    threshold: thresholds.compressionTriggers.soft,
                },
                severity: 'warning',
                message: 'Soft compression recommended',
            });
        }
    }
    /**
     * Check for growth rate spikes
     */
    checkGrowthSpikes(snapshot) {
        if (snapshot.growthRate > 10000) {
            // More than 10K tokens per minute
            this.emitEvent({
                type: TokenEventType.GROWTH_SPIKE,
                timestamp: new Date(),
                snapshot,
                data: { growthRate: snapshot.growthRate },
                severity: 'warning',
                message: `High token growth rate detected: ${snapshot.growthRate.toFixed(0)} tokens/minute`,
            });
        }
        // Check time until limit
        if (snapshot.timeUntilLimit < 30 && snapshot.timeUntilLimit > 0) {
            // Less than 30 minutes
            this.emitEvent({
                type: TokenEventType.LIMIT_APPROACHING,
                timestamp: new Date(),
                snapshot,
                data: {
                    timeUntilLimit: snapshot.timeUntilLimit,
                    growthRate: snapshot.growthRate,
                },
                severity: 'critical',
                message: `Token limit will be reached in ${snapshot.timeUntilLimit.toFixed(1)} minutes`,
            });
        }
    }
    /**
     * Check for efficiency drops
     */
    checkEfficiencyDrops(snapshot) {
        if (snapshot.efficiency.overallUtilization < 0.5) {
            // Less than 50% efficiency
            this.emitEvent({
                type: TokenEventType.EFFICIENCY_DROP,
                timestamp: new Date(),
                snapshot,
                data: {
                    utilization: snapshot.efficiency.overallUtilization,
                    wastedTokens: snapshot.efficiency.wastedTokens,
                },
                severity: 'info',
                message: `Context window efficiency is low: ${(snapshot.efficiency.overallUtilization * 100).toFixed(1)}%`,
            });
        }
    }
    /**
     * Check for optimization opportunities
     */
    checkOptimizationOpportunities(snapshot) {
        let totalCompressionPotential = 0;
        let opportunitiesFound = 0;
        for (const manager of Object.values(snapshot.byManager)) {
            for (const section of Object.values(manager.sections)) {
                if (section.compressionPotential > 0.4 && section.tokens > 5000) {
                    totalCompressionPotential +=
                        section.tokens * section.compressionPotential;
                    opportunitiesFound++;
                }
            }
        }
        if (opportunitiesFound > 0 && totalCompressionPotential > 50000) {
            this.emitEvent({
                type: TokenEventType.OPTIMIZATION_OPPORTUNITY,
                timestamp: new Date(),
                snapshot,
                data: {
                    potentialSavings: totalCompressionPotential,
                    opportunities: opportunitiesFound,
                },
                severity: 'info',
                message: `Found ${opportunitiesFound} optimization opportunities with potential savings of ${totalCompressionPotential.toFixed(0)} tokens`,
            });
        }
    }
    /**
     * Update monitoring mode based on current usage
     */
    updateMonitoringMode(snapshot) {
        const shouldBeHighFrequency = this.config.enableHighFrequencyMode &&
            snapshot.utilizationRatio >= this.config.highFrequencyThreshold;
        if (shouldBeHighFrequency && !this.isHighFrequencyMode) {
            this.isHighFrequencyMode = true;
            logger.info('Switching to high-frequency monitoring mode', {
                utilizationRatio: snapshot.utilizationRatio,
                threshold: this.config.highFrequencyThreshold,
            });
        }
        else if (!shouldBeHighFrequency && this.isHighFrequencyMode) {
            this.isHighFrequencyMode = false;
            logger.info('Switching to normal monitoring mode', {
                utilizationRatio: snapshot.utilizationRatio,
            });
        }
    }
    /**
     * Schedule the next monitoring check
     */
    scheduleNextCheck() {
        const interval = this.isHighFrequencyMode
            ? this.config.highFrequencyInterval
            : this.config.checkInterval;
        this.monitoringTimer = setTimeout(() => {
            this.performMonitoringCheck();
        }, interval);
    }
    /**
     * Add snapshot to history with cleanup
     */
    addToHistory(snapshot) {
        this.usageHistory.push(snapshot);
        // Cleanup old snapshots
        const cutoffTime = Date.now() - this.config.retention.detailedSnapshotRetention;
        this.usageHistory = this.usageHistory.filter((s) => s.timestamp.getTime() > cutoffTime);
        // Limit by count
        if (this.usageHistory.length > this.config.retention.maxSnapshots) {
            this.usageHistory = this.usageHistory.slice(-this.config.retention.maxSnapshots);
        }
    }
    /**
     * Emit a monitoring event
     */
    emitEvent(event) {
        this.eventHistory.push(event);
        this.performanceCounters.totalEvents++;
        // Cleanup old events
        if (this.eventHistory.length > this.config.retention.maxEvents) {
            this.eventHistory = this.eventHistory.slice(-this.config.retention.maxEvents);
        }
        this.emit(event.type, event);
        this.emit('event', event);
        logger.info('Token monitoring event emitted', {
            type: event.type,
            severity: event.severity,
            message: event.message,
            totalTokens: event.snapshot.totalTokens,
            utilizationRatio: event.snapshot.utilizationRatio,
        });
    }
    /**
     * Update performance counters
     */
    updatePerformanceCounters(duration) {
        this.performanceCounters.totalChecks++;
        this.performanceCounters.lastCheckDuration = duration;
        // Calculate rolling average
        const alpha = 0.1; // Smoothing factor
        if (this.performanceCounters.averageCheckDuration === 0) {
            this.performanceCounters.averageCheckDuration = duration;
        }
        else {
            this.performanceCounters.averageCheckDuration =
                alpha * duration +
                    (1 - alpha) * this.performanceCounters.averageCheckDuration;
        }
    }
}
/**
 * Global singleton instance for efficient resource usage
 */
let globalTokenMonitorService = null;
/**
 * Get or create the global TokenMonitorService instance
 */
export function getGlobalTokenMonitorService(config) {
    if (!globalTokenMonitorService) {
        globalTokenMonitorService = new TokenMonitorService(config);
    }
    return globalTokenMonitorService;
}
/**
 * Reset the global monitor service (mainly for testing)
 */
export function resetGlobalTokenMonitorService() {
    if (globalTokenMonitorService) {
        globalTokenMonitorService.stop();
        globalTokenMonitorService = null;
    }
}
//# sourceMappingURL=TokenMonitorService.js.map