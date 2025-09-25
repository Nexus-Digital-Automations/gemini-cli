/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { createServer } from 'node:http';
import { parse as parseUrl } from 'node:url';
import { parse as parseQuery } from 'node:querystring';
import { performance } from 'node:perf_hooks';
import EventEmitter from 'node:events';
import { promisify } from 'node:util';
import { getComponentLogger, createTimer, LogLevel } from '../utils/logger.js';
const logger = getComponentLogger('DashboardApiServer');
/**
 * Rate limiter implementation
 */
class RateLimiter {
    maxRequests;
    windowMs;
    requests = new Map();
    constructor(maxRequests, windowMs = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }
    isAllowed(clientId) {
        const now = Date.now();
        const windowStart = now - this.windowMs;
        // Get existing requests for this client
        let clientRequests = this.requests.get(clientId) || [];
        // Filter out old requests
        clientRequests = clientRequests.filter((timestamp) => timestamp > windowStart);
        // Check if under limit
        if (clientRequests.length >= this.maxRequests) {
            return false;
        }
        // Add current request
        clientRequests.push(now);
        this.requests.set(clientId, clientRequests);
        return true;
    }
    cleanup() {
        const cutoff = Date.now() - this.windowMs;
        for (const [clientId, requests] of this.requests.entries()) {
            const filtered = requests.filter((timestamp) => timestamp > cutoff);
            if (filtered.length === 0) {
                this.requests.delete(clientId);
            }
            else {
                this.requests.set(clientId, filtered);
            }
        }
    }
}
/**
 * Response cache for API endpoints
 */
class ResponseCache {
    ttlMs;
    cache = new Map();
    constructor(ttlMs) {
        this.ttlMs = ttlMs;
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        if (Date.now() - entry.timestamp > this.ttlMs) {
            this.cache.delete(key);
            return null;
        }
        entry.hits++;
        return entry.data;
    }
    set(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            hits: 0,
        });
    }
    clear() {
        this.cache.clear();
    }
    getStats() {
        let totalHits = 0;
        for (const entry of this.cache.values()) {
            totalHits += entry.hits;
        }
        return { size: this.cache.size, totalHits };
    }
}
/**
 * Server-Sent Events manager for real-time updates
 */
class SSEManager extends EventEmitter {
    connections = new Map();
    pingInterval;
    constructor() {
        super();
        // Keep connections alive with periodic ping
        this.pingInterval = setInterval(() => {
            this.broadcast({ type: 'ping', timestamp: Date.now() });
        }, 30000);
    }
    addConnection(connectionId, response) {
        // Setup SSE headers
        response.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control',
        });
        // Send initial connection established message
        response.write(`data: ${JSON.stringify({ type: 'connected', connectionId })}\n\n`);
        this.connections.set(connectionId, response);
        // Handle connection close
        response.on('close', () => {
            this.connections.delete(connectionId);
            logger.debug('SSE connection closed', { connectionId });
        });
        logger.debug('SSE connection established', {
            connectionId,
            totalConnections: this.connections.size,
        });
    }
    broadcast(data) {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        const deadConnections = [];
        for (const [connectionId, response] of this.connections.entries()) {
            try {
                response.write(message);
            }
            catch (error) {
                logger.debug('Failed to send SSE message', { connectionId, error });
                deadConnections.push(connectionId);
            }
        }
        // Clean up dead connections
        for (const connectionId of deadConnections) {
            this.connections.delete(connectionId);
        }
    }
    getConnectionCount() {
        return this.connections.size;
    }
    cleanup() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }
        // Close all connections
        for (const response of this.connections.values()) {
            try {
                response.end();
            }
            catch (error) {
                // Ignore errors when closing connections
            }
        }
        this.connections.clear();
        this.removeAllListeners();
    }
}
/**
 * High-performance dashboard API server with real-time capabilities
 */
export class DashboardApiServer extends EventEmitter {
    config;
    tokenTracker;
    storageEngine;
    intelligenceEngine;
    server = createServer();
    rateLimiter;
    responseCache;
    sseManager = new SSEManager();
    isRunning = false;
    constructor(config, tokenTracker, storageEngine, intelligenceEngine) {
        super();
        this.config = config;
        this.tokenTracker = tokenTracker;
        this.storageEngine = storageEngine;
        this.intelligenceEngine = intelligenceEngine;
        this.rateLimiter = new RateLimiter(config.maxRequestsPerMinute);
        this.responseCache = new ResponseCache(config.cacheTimeout);
        this.setupRequestHandler();
        this.setupRealtimeUpdates();
        this.setupPeriodicTasks();
        logger.info('DashboardApiServer initialized', {
            port: config.port,
            host: config.host,
            realTimeEnabled: config.enableRealTimeUpdates,
            cachingEnabled: config.enableCaching,
        });
    }
    /**
     * Start the dashboard API server
     */
    async start() {
        if (this.isRunning) {
            throw new Error('Dashboard API server is already running');
        }
        return new Promise((resolve, reject) => {
            this.server.listen(this.config.port, this.config.host, (error) => {
                if (error) {
                    logger.error('Failed to start dashboard API server', { error });
                    reject(error);
                    return;
                }
                this.isRunning = true;
                logger.info('Dashboard API server started', {
                    port: this.config.port,
                    host: this.config.host,
                    pid: process.pid,
                });
                this.emit('started');
                resolve();
            });
        });
    }
    /**
     * Stop the dashboard API server
     */
    async stop() {
        if (!this.isRunning) {
            return;
        }
        return new Promise((resolve) => {
            this.server.close(() => {
                this.isRunning = false;
                this.sseManager.cleanup();
                this.responseCache.clear();
                logger.info('Dashboard API server stopped');
                this.emit('stopped');
                resolve();
            });
        });
    }
    /**
     * Get server status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            port: this.config.port,
            host: this.config.host,
            connectionsCount: this.sseManager.getConnectionCount(),
            cacheStats: this.responseCache.getStats(),
            uptime: process.uptime() * 1000,
        };
    }
    setupRequestHandler() {
        this.server.on('request', async (req, res) => {
            const startTime = performance.now();
            const requestId = this.generateRequestId();
            try {
                // CORS handling
                this.setupCors(req, res);
                // Handle preflight requests
                if (req.method === 'OPTIONS') {
                    res.writeHead(200);
                    res.end();
                    return;
                }
                // Rate limiting
                const clientId = this.getClientId(req);
                if (!this.rateLimiter.isAllowed(clientId)) {
                    this.sendError(res, 'RATE_LIMITED', 'Too many requests', 429, requestId, startTime);
                    return;
                }
                // Authentication
                if (this.config.enableAuthentication && !this.isAuthenticated(req)) {
                    this.sendError(res, 'UNAUTHORIZED', 'Authentication required', 401, requestId, startTime);
                    return;
                }
                // Route request
                await this.routeRequest(req, res, requestId, startTime);
            }
            catch (error) {
                logger.error('Request handling failed', {
                    requestId,
                    url: req.url,
                    error,
                });
                this.sendError(res, 'INTERNAL_ERROR', 'Internal server error', 500, requestId, startTime);
            }
        });
    }
    async routeRequest(req, res, requestId, startTime) {
        const parsedUrl = parseUrl(req.url, true);
        const pathname = parsedUrl.pathname;
        const query = parsedUrl.query;
        // API routes
        switch (pathname) {
            case '/api/dashboard/insights':
                await this.handleDashboardInsights(req, res, query, requestId, startTime);
                break;
            case '/api/usage/statistics':
                await this.handleUsageStatistics(req, res, query, requestId, startTime);
                break;
            case '/api/usage/data':
                await this.handleUsageData(req, res, query, requestId, startTime);
                break;
            case '/api/analytics/patterns':
                await this.handleUsagePatterns(req, res, query, requestId, startTime);
                break;
            case '/api/analytics/recommendations':
                await this.handleOptimizationRecommendations(req, res, query, requestId, startTime);
                break;
            case '/api/analytics/prediction':
                await this.handlePerformancePrediction(req, res, query, requestId, startTime);
                break;
            case '/api/storage/stats':
                await this.handleStorageStats(req, res, query, requestId, startTime);
                break;
            case '/api/export/usage':
                await this.handleExportUsage(req, res, query, requestId, startTime);
                break;
            case '/api/realtime/events':
                this.handleRealtimeEvents(req, res, requestId);
                break;
            case '/api/health':
                this.handleHealthCheck(res, requestId, startTime);
                break;
            default:
                this.sendError(res, 'NOT_FOUND', `Endpoint ${pathname} not found`, 404, requestId, startTime);
        }
    }
    async handleDashboardInsights(req, res, query, requestId, startTime) {
        const cacheKey = `insights:${JSON.stringify(query)}`;
        if (this.config.enableCaching) {
            const cached = this.responseCache.get(cacheKey);
            if (cached) {
                return this.sendSuccess(res, cached, requestId, startTime, true);
            }
        }
        const timeRange = parseInt(query.timeRange) || 3600000; // 1 hour default
        const sessionId = query.sessionId;
        const [statistics, patterns, recommendations] = await Promise.all([
            this.tokenTracker.getRealtimeStatistics(timeRange, sessionId),
            this.intelligenceEngine.analyzeUsagePatterns(sessionId, timeRange),
            this.intelligenceEngine.generateOptimizationRecommendations(sessionId, timeRange),
        ]);
        // Get recent activity
        const recentActivity = sessionId
            ? this.tokenTracker.getSessionData(sessionId, 20).data
            : Array.from(statistics.breakdown.byHour.values())
                .flat()
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 20);
        // Convert patterns to alerts
        const alerts = patterns.map((pattern) => ({
            type: pattern.type,
            severity: pattern.severity,
            message: pattern.description,
            timestamp: pattern.detectedAt,
        }));
        const insights = {
            summary: {
                totalTokens: statistics.totalTokens,
                totalCost: statistics.totalCost,
                averageLatency: statistics.averageLatency,
                requestCount: statistics.requestCount,
                errorRate: statistics.errorRate,
                activeSessionsCount: statistics.breakdown.byCommand.size,
                costTrend: { slope: 0, isIncreasing: false }, // This would be calculated from historical data
            },
            recentActivity,
            topModels: statistics.topModels.map((model) => ({
                ...model,
                requests: statistics.breakdown.byModel.get(model.model)?.length || 0,
            })),
            patterns: patterns.slice(0, 5),
            recommendations: recommendations.slice(0, 3),
            alerts: alerts.slice(0, 10),
        };
        if (this.config.enableCaching) {
            this.responseCache.set(cacheKey, insights);
        }
        this.sendSuccess(res, insights, requestId, startTime);
    }
    async handleUsageStatistics(req, res, query, requestId, startTime) {
        const cacheKey = `stats:${JSON.stringify(query)}`;
        if (this.config.enableCaching) {
            const cached = this.responseCache.get(cacheKey);
            if (cached) {
                return this.sendSuccess(res, cached, requestId, startTime, true);
            }
        }
        const timeRange = parseInt(query.timeRange) || 3600000;
        const sessionId = query.sessionId;
        const statistics = this.tokenTracker.getRealtimeStatistics(timeRange, sessionId);
        if (this.config.enableCaching) {
            this.responseCache.set(cacheKey, statistics);
        }
        this.sendSuccess(res, statistics, requestId, startTime);
    }
    async handleUsageData(req, res, query, requestId, startTime) {
        const analyticsQuery = {
            sessionId: query.sessionId,
            model: query.model,
            authType: query.authType,
            command: query.command,
            feature: query.feature,
            startTime: query.startTime
                ? parseInt(query.startTime)
                : undefined,
            endTime: query.endTime ? parseInt(query.endTime) : undefined,
            limit: query.limit ? parseInt(query.limit) : 100,
            offset: query.offset ? parseInt(query.offset) : 0,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder || 'desc',
        };
        const result = await this.storageEngine.queryTokenUsage(analyticsQuery);
        this.sendSuccess(res, result, requestId, startTime);
    }
    async handleUsagePatterns(req, res, query, requestId, startTime) {
        const timeRange = parseInt(query.timeRange) || 3600000;
        const sessionId = query.sessionId;
        const patterns = await this.intelligenceEngine.analyzeUsagePatterns(sessionId, timeRange);
        this.sendSuccess(res, { patterns }, requestId, startTime);
    }
    async handleOptimizationRecommendations(req, res, query, requestId, startTime) {
        const timeRange = parseInt(query.timeRange) || 86400000; // 24 hours default
        const sessionId = query.sessionId;
        const recommendations = await this.intelligenceEngine.generateOptimizationRecommendations(sessionId, timeRange);
        this.sendSuccess(res, { recommendations }, requestId, startTime);
    }
    async handlePerformancePrediction(req, res, query, requestId, startTime) {
        const model = query.model;
        const promptLength = parseInt(query.promptLength);
        const sessionId = query.sessionId;
        if (!model || !promptLength) {
            return this.sendError(res, 'BAD_REQUEST', 'model and promptLength are required', 400, requestId, startTime);
        }
        const prediction = this.intelligenceEngine.predictPerformance({
            model,
            promptLength,
            sessionId,
        });
        this.sendSuccess(res, { prediction }, requestId, startTime);
    }
    async handleStorageStats(req, res, query, requestId, startTime) {
        const stats = this.storageEngine.getStorageStats();
        this.sendSuccess(res, stats, requestId, startTime);
    }
    async handleExportUsage(req, res, query, requestId, startTime) {
        const format = query.format || 'json';
        const analyticsQuery = {
            sessionId: query.sessionId,
            model: query.model,
            startTime: query.startTime
                ? parseInt(query.startTime)
                : undefined,
            endTime: query.endTime ? parseInt(query.endTime) : undefined,
        };
        const stream = await this.storageEngine.exportData(analyticsQuery, format);
        // Set appropriate headers
        const contentType = format === 'csv'
            ? 'text/csv'
            : format === 'ndjson'
                ? 'application/x-ndjson'
                : 'application/json';
        res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="usage-export.${format}"`,
            'X-Request-ID': requestId,
        });
        stream.pipe(res);
    }
    handleRealtimeEvents(req, res, requestId) {
        const connectionId = `${requestId}-${Date.now()}`;
        this.sseManager.addConnection(connectionId, res);
    }
    handleHealthCheck(res, requestId, startTime) {
        const health = {
            status: 'healthy',
            timestamp: Date.now(),
            uptime: process.uptime() * 1000,
            memory: process.memoryUsage(),
            server: this.getStatus(),
        };
        this.sendSuccess(res, health, requestId, startTime);
    }
    setupRealtimeUpdates() {
        if (!this.config.enableRealTimeUpdates)
            return;
        // Forward token usage events to SSE clients
        this.tokenTracker.on('token_usage', (event) => {
            this.sseManager.broadcast({
                type: 'token_usage_update',
                data: event,
                timestamp: Date.now(),
            });
        });
        this.tokenTracker.on('token_batch', (event) => {
            this.sseManager.broadcast({
                type: 'token_batch_update',
                data: event,
                timestamp: Date.now(),
            });
        });
        this.tokenTracker.on('alert', (event) => {
            this.sseManager.broadcast({
                type: 'alert',
                data: event,
                timestamp: Date.now(),
            });
        });
        // Forward pattern detection events
        this.intelligenceEngine.on('pattern_detected', (pattern) => {
            this.sseManager.broadcast({
                type: 'pattern_detected',
                data: pattern,
                timestamp: Date.now(),
            });
        });
    }
    setupPeriodicTasks() {
        // Cleanup rate limiter every 5 minutes
        setInterval(() => {
            this.rateLimiter.cleanup();
        }, 5 * 60 * 1000);
        // Send periodic statistics updates every 30 seconds
        if (this.config.enableRealTimeUpdates) {
            setInterval(async () => {
                try {
                    const insights = await this.getDashboardInsights();
                    this.sseManager.broadcast({
                        type: 'dashboard_update',
                        data: insights,
                        timestamp: Date.now(),
                    });
                }
                catch (error) {
                    logger.error('Failed to send periodic dashboard update', {
                        error,
                    });
                }
            }, 30000);
        }
    }
    async getDashboardInsights() {
        const statistics = this.tokenTracker.getRealtimeStatistics();
        const patterns = await this.intelligenceEngine.analyzeUsagePatterns();
        const recommendations = await this.intelligenceEngine.generateOptimizationRecommendations();
        return {
            summary: {
                totalTokens: statistics.totalTokens,
                totalCost: statistics.totalCost,
                averageLatency: statistics.averageLatency,
                requestCount: statistics.requestCount,
                errorRate: statistics.errorRate,
                activeSessionsCount: statistics.breakdown.byCommand.size,
                costTrend: { slope: 0, isIncreasing: false },
            },
            recentActivity: [],
            topModels: statistics.topModels.map((model) => ({
                ...model,
                requests: statistics.breakdown.byModel.get(model.model)?.length || 0,
            })),
            patterns: patterns.slice(0, 5),
            recommendations: recommendations.slice(0, 3),
            alerts: patterns.map((pattern) => ({
                type: pattern.type,
                severity: pattern.severity,
                message: pattern.description,
                timestamp: pattern.detectedAt,
            })),
        };
    }
    setupCors(req, res) {
        const origin = req.headers.origin;
        const allowedOrigins = this.config.corsOrigins;
        if (allowedOrigins.includes('*') ||
            (origin && allowedOrigins.includes(origin))) {
            res.setHeader('Access-Control-Allow-Origin', origin || '*');
        }
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    isAuthenticated(req) {
        if (!this.config.apiKey)
            return true;
        const authHeader = req.headers.authorization;
        const apiKey = req.headers['x-api-key'];
        return (authHeader === `Bearer ${this.config.apiKey}` ||
            apiKey === this.config.apiKey);
    }
    getClientId(req) {
        return req.connection.remoteAddress || 'unknown';
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    sendSuccess(res, data, requestId, startTime, cacheHit = false) {
        const response = {
            success: true,
            data,
            metadata: {
                requestId,
                timestamp: Date.now(),
                executionTimeMs: performance.now() - startTime,
                cacheHit,
            },
        };
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
        });
        res.end(JSON.stringify(response, null, 2));
    }
    sendError(res, code, message, status, requestId, startTime, details) {
        const response = {
            success: false,
            error: { code, message, details },
            metadata: {
                requestId,
                timestamp: Date.now(),
                executionTimeMs: performance.now() - startTime,
                cacheHit: false,
            },
        };
        res.writeHead(status, {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
        });
        res.end(JSON.stringify(response, null, 2));
    }
}
/**
 * Create and configure a dashboard API server instance
 */
export function createDashboardServer(tokenTracker, storageEngine, intelligenceEngine, config) {
    const defaultConfig = {
        port: 8080,
        host: 'localhost',
        corsOrigins: ['*'],
        maxRequestsPerMinute: 100,
        enableRealTimeUpdates: true,
        enableCaching: true,
        cacheTimeout: 30000, // 30 seconds
        enableAuthentication: false,
        ...config,
    };
    return new DashboardApiServer(defaultConfig, tokenTracker, storageEngine, intelligenceEngine);
}
//# sourceMappingURL=dashboard-api-server.js.map