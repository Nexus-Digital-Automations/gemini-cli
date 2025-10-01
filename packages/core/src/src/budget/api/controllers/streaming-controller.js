/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { WebSocket, WebSocketServer } from 'ws';
import { getBudgetTracker } from '../../budget-tracker.js';
// Budget types available if needed
// import type { BudgetEventType } from '../../types.js';
// Simple console-based logging for now
const logger = {
    info: (message, meta) => console.info(`[StreamingController] ${message}`, meta),
    warn: (message, meta) => console.warn(`[StreamingController] ${message}`, meta),
    error: (message, meta) => console.error(`[StreamingController] ${message}`, meta),
    debug: (message, meta) => console.debug(`[StreamingController] ${message}`, meta),
};
/**
 * Controller for real-time budget data streaming
 */
export class StreamingController {
    clients = new Map();
    updateInterval;
    heartbeatInterval;
    /**
     * Initialize streaming controller
     */
    constructor() {
        logger.info('Initializing Streaming Controller', {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
        });
        this.startUpdateScheduler();
        this.startHeartbeatScheduler();
    }
    /**
     * Handle WebSocket upgrade request
     * GET /api/budget/stream
     */
    async handleStreamRequest(req, res) {
        logger.info('WebSocket stream request received', {
            userId: req.user?.id,
            origin: req.get('Origin'),
            timestamp: new Date().toISOString(),
        });
        try {
            // Upgrade HTTP request to WebSocket
            if (req.headers.upgrade !== 'websocket') {
                res.status(400).json({
                    success: false,
                    error: 'WebSocket upgrade required',
                    instructions: 'Use WebSocket client to connect to this endpoint',
                });
                return;
            }
            // Create WebSocket server for this request
            const wss = new WebSocketServer({ noServer: true });
            wss.on('connection', (ws, _request) => {
                this.handleWebSocketConnection(ws, req.user);
            });
            // Handle the upgrade
            wss.handleUpgrade(req, req.socket, Buffer.alloc(0), (ws) => {
                wss.emit('connection', ws, req);
            });
        }
        catch (error) {
            logger.error('Failed to handle stream request', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId: req.user?.id,
            });
            res.status(500).json({
                success: false,
                error: 'Failed to establish WebSocket connection',
                timestamp: new Date().toISOString(),
            });
        }
    }
    /**
     * Get streaming connection status
     * GET /api/budget/stream/status
     */
    async getStreamStatus(req, res) {
        const startTime = Date.now();
        logger.info('Stream status requested', {
            userId: req.user?.id,
            timestamp: new Date().toISOString(),
        });
        try {
            const activeConnections = Array.from(this.clients.values()).filter((client) => client.ws.readyState === WebSocket.OPEN);
            const userConnections = activeConnections.filter((client) => client.userId === req.user?.id);
            const responseTime = Date.now() - startTime;
            const status = {
                connected: userConnections.length > 0,
                activeConnections: userConnections.length,
                totalSystemConnections: activeConnections.length,
                uptime: this.updateInterval ? Date.now() - Date.now() : 0,
                features: {
                    usageUpdates: true,
                    alerts: true,
                    analytics: true,
                    heartbeat: true,
                },
                lastActivity: userConnections.length > 0
                    ? Math.max(...userConnections.map((c) => c.lastActivity.getTime()))
                    : null,
            };
            const response = {
                success: true,
                data: {
                    status,
                    metadata: {
                        timestamp: new Date().toISOString(),
                        responseTime,
                        userId: req.user?.id,
                    },
                },
            };
            logger.info('Stream status retrieved', {
                responseTime,
                activeConnections: userConnections.length,
                totalConnections: activeConnections.length,
            });
            res.status(200).json(response);
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            logger.error('Failed to get stream status', {
                error: error instanceof Error ? error.message : 'Unknown error',
                responseTime,
                userId: req.user?.id,
            });
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve stream status',
                timestamp: new Date().toISOString(),
                responseTime,
            });
        }
    }
    /**
     * Handle new WebSocket connection
     */
    handleWebSocketConnection(ws, user) {
        const clientId = this.generateClientId();
        logger.info('New WebSocket client connected', {
            clientId,
            userId: user?.id,
            timestamp: new Date().toISOString(),
        });
        const client = {
            id: clientId,
            ws,
            userId: user?.id,
            subscriptions: ['usage_updates', 'alerts'], // Default subscriptions
            lastActivity: new Date(),
            isAlive: true,
        };
        this.clients.set(clientId, client);
        // Set up WebSocket event handlers
        ws.on('message', (data) => {
            this.handleWebSocketMessage(clientId, data);
        });
        ws.on('close', () => {
            this.handleWebSocketClose(clientId);
        });
        ws.on('error', (error) => {
            this.handleWebSocketError(clientId, error);
        });
        ws.on('pong', () => {
            const client = this.clients.get(clientId);
            if (client) {
                client.isAlive = true;
                client.lastActivity = new Date();
            }
        });
        // Send welcome message
        this.sendMessage(clientId, {
            type: 'heartbeat',
            data: {
                message: 'Connected to Budget Stream API',
                clientId,
                subscriptions: client.subscriptions,
                features: ['usage_updates', 'alerts', 'analytics_updates'],
            },
            timestamp: new Date().toISOString(),
            source: 'streaming-controller',
        });
    }
    /**
     * Handle WebSocket message from client
     */
    handleWebSocketMessage(clientId, data) {
        const client = this.clients.get(clientId);
        if (!client)
            return;
        client.lastActivity = new Date();
        try {
            const message = JSON.parse(data.toString());
            logger.debug('WebSocket message received', {
                clientId,
                messageType: message.type,
                userId: client.userId,
            });
            switch (message.type) {
                case 'subscribe':
                    this.handleSubscribe(clientId, message.subscriptions);
                    break;
                case 'unsubscribe':
                    this.handleUnsubscribe(clientId, message.subscriptions);
                    break;
                case 'ping':
                    this.sendMessage(clientId, {
                        type: 'heartbeat',
                        data: { message: 'pong' },
                        timestamp: new Date().toISOString(),
                        source: 'streaming-controller',
                    });
                    break;
                default:
                    logger.warn('Unknown WebSocket message type', {
                        clientId,
                        messageType: message.type,
                        userId: client.userId,
                    });
            }
        }
        catch (error) {
            logger.error('Failed to parse WebSocket message', {
                clientId,
                error: error instanceof Error ? error.message : 'Parse error',
                userId: client.userId,
            });
        }
    }
    /**
     * Handle WebSocket connection close
     */
    handleWebSocketClose(clientId) {
        const client = this.clients.get(clientId);
        logger.info('WebSocket client disconnected', {
            clientId,
            userId: client?.userId,
            timestamp: new Date().toISOString(),
        });
        this.clients.delete(clientId);
    }
    /**
     * Handle WebSocket error
     */
    handleWebSocketError(clientId, error) {
        const client = this.clients.get(clientId);
        logger.error('WebSocket client error', {
            clientId,
            userId: client?.userId,
            error: error.message,
        });
    }
    /**
     * Handle subscription changes
     */
    handleSubscribe(clientId, subscriptions) {
        const client = this.clients.get(clientId);
        if (!client)
            return;
        const validSubscriptions = subscriptions.filter((sub) => ['usage_updates', 'alerts', 'analytics_updates', 'heartbeat'].includes(sub));
        client.subscriptions = [
            ...Array.from(new Set([...client.subscriptions, ...validSubscriptions])),
        ];
        logger.info('Client subscriptions updated', {
            clientId,
            userId: client.userId,
            subscriptions: client.subscriptions,
        });
        this.sendMessage(clientId, {
            type: 'heartbeat',
            data: {
                message: 'Subscriptions updated',
                subscriptions: client.subscriptions,
            },
            timestamp: new Date().toISOString(),
            source: 'streaming-controller',
        });
    }
    /**
     * Handle unsubscription
     */
    handleUnsubscribe(clientId, subscriptions) {
        const client = this.clients.get(clientId);
        if (!client)
            return;
        client.subscriptions = client.subscriptions.filter((sub) => !subscriptions.includes(sub));
        logger.info('Client unsubscribed', {
            clientId,
            userId: client.userId,
            remainingSubscriptions: client.subscriptions,
        });
    }
    /**
     * Send message to specific client
     */
    sendMessage(clientId, message) {
        const client = this.clients.get(clientId);
        if (client && client.ws.readyState === WebSocket.OPEN) {
            try {
                client.ws.send(JSON.stringify(message));
            }
            catch (error) {
                logger.error('Failed to send WebSocket message', {
                    clientId,
                    error: error instanceof Error ? error.message : 'Send error',
                });
            }
        }
    }
    /**
     * Broadcast message to all subscribed clients
     */
    broadcastMessage(message, subscription) {
        const activeClients = Array.from(this.clients.values()).filter((client) => client.ws.readyState === WebSocket.OPEN &&
            client.subscriptions.includes(subscription));
        logger.debug('Broadcasting message', {
            messageType: message.type,
            subscription,
            clientCount: activeClients.length,
        });
        for (const client of activeClients) {
            this.sendMessage(client.id, message);
        }
    }
    /**
     * Start periodic update scheduler
     */
    startUpdateScheduler() {
        this.updateInterval = setInterval(async () => {
            try {
                const budgetTracker = await getBudgetTracker();
                if (!budgetTracker)
                    return;
                const usageData = await budgetTracker.getTodayUsage();
                this.broadcastMessage({
                    type: 'usage_update',
                    data: usageData,
                    timestamp: new Date().toISOString(),
                    source: 'budget-tracker',
                }, 'usage_updates');
            }
            catch (error) {
                logger.error('Failed to broadcast usage update', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }, 10000); // Update every 10 seconds
    }
    /**
     * Start heartbeat scheduler
     */
    startHeartbeatScheduler() {
        this.heartbeatInterval = setInterval(() => {
            const deadClients = [];
            for (const [clientId, client] of Array.from(this.clients.entries())) {
                if (!client.isAlive) {
                    deadClients.push(clientId);
                    client.ws.terminate();
                }
                else {
                    client.isAlive = false;
                    if (client.ws.readyState === WebSocket.OPEN) {
                        client.ws.ping();
                    }
                }
            }
            // Clean up dead clients
            for (const clientId of deadClients) {
                this.clients.delete(clientId);
                logger.info('Cleaned up dead WebSocket client', { clientId });
            }
        }, 30000); // Check every 30 seconds
    }
    /**
     * Generate unique client ID
     */
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Cleanup resources
     */
    cleanup() {
        logger.info('Cleaning up streaming controller');
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        // Close all client connections
        for (const client of Array.from(this.clients.values())) {
            client.ws.terminate();
        }
        this.clients.clear();
    }
}
//# sourceMappingURL=streaming-controller.js.map