/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Agent Communication Hub for Inter-Agent Messaging and Coordination
 *
 * This system provides:
 * - Real-time messaging between agents with message routing
 * - Publish-subscribe patterns for event broadcasting
 * - Synchronization primitives for coordinated operations
 * - Message queuing and reliable delivery guarantees
 * - Distributed consensus and coordination protocols
 */
import { EventEmitter } from 'node:events';
/**
 * Central communication hub for agent coordination
 */
export class AgentCommunicationHub extends EventEmitter {
    connectedAgents = new Set();
    messageQueues = new Map();
    subscriptions = new Map(); // agentId -> subscriptionId -> filter
    messageHistory = [];
    pendingResponses = new Map();
    synchronizationBarriers = new Map();
    consensusOperations = new Map();
    routingTable = new Map(); // topic -> interested agents
    messageStats = {
        totalSent: 0,
        totalDelivered: 0,
        totalFailed: 0,
        totalSubscriptions: 0,
    };
    cleanupInterval = null;
    constructor() {
        super();
        this.startPeriodicCleanup();
    }
    /**
     * Connect an agent to the communication hub
     */
    async connectAgent(agentId, capabilities) {
        this.connectedAgents.add(agentId);
        // Initialize message queue for the agent
        this.messageQueues.set(agentId, {
            agentId,
            messages: [],
            maxSize: 100,
            lastAccess: new Date(),
        });
        // Initialize subscriptions map
        this.subscriptions.set(agentId, new Map());
        // Add agent to relevant routing tables based on capabilities
        if (capabilities) {
            for (const capability of capabilities) {
                let interestedAgents = this.routingTable.get(capability);
                if (!interestedAgents) {
                    interestedAgents = new Set();
                    this.routingTable.set(capability, interestedAgents);
                }
                interestedAgents.add(agentId);
            }
        }
        const event = {
            type: 'subscription_added',
            timestamp: new Date(),
            data: { agentId, capabilities },
        };
        this.emit('agent_connected', event);
        console.log(`📡 Agent ${agentId} connected to communication hub`);
    }
    /**
     * Disconnect an agent from the communication hub
     */
    async disconnectAgent(agentId) {
        this.connectedAgents.delete(agentId);
        // Clean up agent's resources
        this.messageQueues.delete(agentId);
        this.subscriptions.delete(agentId);
        // Remove from routing tables
        for (const [topic, agents] of this.routingTable) {
            agents.delete(agentId);
            if (agents.size === 0) {
                this.routingTable.delete(topic);
            }
        }
        // Remove from synchronization barriers
        for (const [barrierId, barrier] of this.synchronizationBarriers) {
            barrier.requiredParticipants = barrier.requiredParticipants.filter(id => id !== agentId);
            barrier.waitingParticipants = barrier.waitingParticipants.filter(id => id !== agentId);
            barrier.completedParticipants = barrier.completedParticipants.filter(id => id !== agentId);
        }
        // Remove from consensus operations
        for (const [operationId, operation] of this.consensusOperations) {
            operation.participants = operation.participants.filter(id => id !== agentId);
            operation.votes.delete(agentId);
        }
        console.log(`📡 Agent ${agentId} disconnected from communication hub`);
    }
    /**
     * Send a message between agents
     */
    async sendMessage(message) {
        const fullMessage = {
            ...message,
            id: this.generateMessageId(),
            timestamp: new Date(),
        };
        this.messageHistory.push(fullMessage);
        if (this.messageHistory.length > 10000) {
            this.messageHistory = this.messageHistory.slice(-10000);
        }
        let deliveryCount = 0;
        const recipients = Array.isArray(message.to) ? message.to : [message.to];
        for (const recipient of recipients) {
            if (recipient === '*') {
                // Broadcast to all connected agents
                const success = await this.broadcastMessage(fullMessage);
                deliveryCount += success ? this.connectedAgents.size : 0;
            }
            else {
                const success = await this.deliverMessage(fullMessage, recipient);
                if (success)
                    deliveryCount++;
            }
        }
        this.messageStats.totalSent++;
        this.messageStats.totalDelivered += deliveryCount;
        if (deliveryCount === 0) {
            this.messageStats.totalFailed++;
            const event = {
                type: 'message_failed',
                timestamp: new Date(),
                data: { messageId: fullMessage.id, recipients, reason: 'no_recipients' },
            };
            this.emit('message_failed', event);
        }
        else {
            const event = {
                type: 'message_sent',
                timestamp: new Date(),
                data: { messageId: fullMessage.id, recipients, deliveryCount },
            };
            this.emit('message_sent', event);
        }
        console.log(`📨 Message ${fullMessage.id} sent from ${message.from} (delivered to ${deliveryCount} recipients)`);
        return fullMessage.id;
    }
    /**
     * Send a message and wait for response
     */
    async sendMessageWithResponse(message, timeoutMs = 30000) {
        const messageId = await this.sendMessage({
            ...message,
            requiresResponse: true,
            correlationId: this.generateMessageId(),
        });
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingResponses.delete(messageId);
                reject(new Error('Message response timeout'));
            }, timeoutMs);
            this.pendingResponses.set(messageId, { resolve, reject, timeout });
        });
    }
    /**
     * Send a response to a message
     */
    async sendResponse(originalMessageId, response) {
        const fullResponse = {
            ...response,
            timestamp: new Date(),
        };
        const pendingResponse = this.pendingResponses.get(originalMessageId);
        if (pendingResponse) {
            clearTimeout(pendingResponse.timeout);
            this.pendingResponses.delete(originalMessageId);
            pendingResponse.resolve(fullResponse);
        }
        // Also emit the response for other listeners
        this.emit('message_response', fullResponse);
    }
    /**
     * Subscribe to messages matching a filter
     */
    async subscribe(agentId, filter) {
        if (!this.connectedAgents.has(agentId)) {
            throw new Error(`Agent ${agentId} is not connected`);
        }
        const subscriptionId = this.generateSubscriptionId();
        const agentSubscriptions = this.subscriptions.get(agentId);
        if (agentSubscriptions) {
            agentSubscriptions.set(subscriptionId, filter);
            this.messageStats.totalSubscriptions++;
            // Update routing table for efficient message routing
            if (filter.type) {
                for (const type of filter.type) {
                    let interestedAgents = this.routingTable.get(type);
                    if (!interestedAgents) {
                        interestedAgents = new Set();
                        this.routingTable.set(type, interestedAgents);
                    }
                    interestedAgents.add(agentId);
                }
            }
            const event = {
                type: 'subscription_added',
                timestamp: new Date(),
                data: { agentId, subscriptionId, filter },
            };
            this.emit('subscription_added', event);
            console.log(`📋 Agent ${agentId} subscribed with filter: ${JSON.stringify(filter)}`);
        }
        return subscriptionId;
    }
    /**
     * Unsubscribe from messages
     */
    async unsubscribe(agentId, subscriptionId) {
        const agentSubscriptions = this.subscriptions.get(agentId);
        if (agentSubscriptions) {
            agentSubscriptions.delete(subscriptionId);
            console.log(`📋 Agent ${agentId} unsubscribed from ${subscriptionId}`);
        }
    }
    /**
     * Get messages for an agent
     */
    async getMessages(agentId, limit = 50) {
        const queue = this.messageQueues.get(agentId);
        if (!queue) {
            return [];
        }
        queue.lastAccess = new Date();
        return queue.messages.slice(-limit);
    }
    /**
     * Create a synchronization barrier
     */
    async createSynchronizationBarrier(barrierId, participants, timeoutMs = 60000, payload) {
        const barrier = {
            id: barrierId,
            requiredParticipants: [...participants],
            waitingParticipants: [],
            completedParticipants: [],
            timeout: new Date(Date.now() + timeoutMs),
            payload,
            status: 'waiting',
        };
        this.synchronizationBarriers.set(barrierId, barrier);
        // Notify all participants about the barrier
        for (const participant of participants) {
            await this.sendMessage({
                from: 'system',
                to: participant,
                type: 'synchronization',
                priority: 'high',
                payload: {
                    action: 'barrier_created',
                    barrierId,
                    participants,
                    payload: barrier.payload,
                },
            });
        }
        console.log(`🚧 Synchronization barrier ${barrierId} created for ${participants.length} participants`);
    }
    /**
     * Join a synchronization barrier
     */
    async joinSynchronizationBarrier(barrierId, agentId) {
        const barrier = this.synchronizationBarriers.get(barrierId);
        if (!barrier || barrier.status !== 'waiting') {
            return false;
        }
        if (!barrier.requiredParticipants.includes(agentId)) {
            return false;
        }
        if (barrier.completedParticipants.includes(agentId)) {
            return true; // Already joined
        }
        barrier.completedParticipants.push(agentId);
        barrier.waitingParticipants = barrier.waitingParticipants.filter(id => id !== agentId);
        // Check if barrier is complete
        if (barrier.completedParticipants.length === barrier.requiredParticipants.length) {
            barrier.status = 'completed';
            // Notify all participants
            for (const participant of barrier.requiredParticipants) {
                await this.sendMessage({
                    from: 'system',
                    to: participant,
                    type: 'synchronization',
                    priority: 'high',
                    payload: {
                        action: 'barrier_completed',
                        barrierId,
                        completedParticipants: barrier.completedParticipants,
                    },
                });
            }
            const event = {
                type: 'barrier_completed',
                timestamp: new Date(),
                data: { barrierId, participants: barrier.completedParticipants },
            };
            this.emit('barrier_completed', event);
            console.log(`🚧 Synchronization barrier ${barrierId} completed`);
            // Clean up barrier after a delay
            setTimeout(() => {
                this.synchronizationBarriers.delete(barrierId);
            }, 60000);
        }
        return true;
    }
    /**
     * Start a consensus operation
     */
    async startConsensusOperation(operationId, type, participants, timeoutMs = 120000) {
        const operation = {
            id: operationId,
            type,
            participants: [...participants],
            votes: new Map(),
            requiredVotes: Math.floor(participants.length / 2) + 1, // Majority
            status: 'voting',
            timeout: new Date(Date.now() + timeoutMs),
        };
        this.consensusOperations.set(operationId, operation);
        // Notify participants to start voting
        for (const participant of participants) {
            await this.sendMessage({
                from: 'system',
                to: participant,
                type: 'consensus',
                priority: 'high',
                payload: {
                    action: 'vote_requested',
                    operationId,
                    type,
                    participants,
                },
            });
        }
        console.log(`🗳️ Consensus operation ${operationId} started with ${participants.length} participants`);
    }
    /**
     * Submit a vote for a consensus operation
     */
    async submitVote(operationId, agentId, vote) {
        const operation = this.consensusOperations.get(operationId);
        if (!operation || operation.status !== 'voting') {
            return false;
        }
        if (!operation.participants.includes(agentId)) {
            return false;
        }
        operation.votes.set(agentId, vote);
        // Check if we have enough votes for consensus
        if (operation.votes.size >= operation.requiredVotes) {
            // Determine consensus based on majority vote
            const voteCount = new Map();
            let maxVotes = 0;
            let consensusResult = null;
            for (const vote of operation.votes.values()) {
                const voteKey = JSON.stringify(vote);
                const count = (voteCount.get(voteKey) || 0) + 1;
                voteCount.set(voteKey, count);
                if (count > maxVotes) {
                    maxVotes = count;
                    consensusResult = vote;
                }
            }
            if (maxVotes >= operation.requiredVotes) {
                operation.status = 'decided';
                operation.result = consensusResult;
                // Notify all participants of the decision
                for (const participant of operation.participants) {
                    await this.sendMessage({
                        from: 'system',
                        to: participant,
                        type: 'consensus',
                        priority: 'high',
                        payload: {
                            action: 'consensus_reached',
                            operationId,
                            result: consensusResult,
                            votes: operation.votes.size,
                        },
                    });
                }
                const event = {
                    type: 'consensus_reached',
                    timestamp: new Date(),
                    data: { operationId, result: consensusResult, votes: operation.votes.size },
                };
                this.emit('consensus_reached', event);
                console.log(`🗳️ Consensus reached for operation ${operationId}: ${JSON.stringify(consensusResult)}`);
                // Clean up operation after a delay
                setTimeout(() => {
                    this.consensusOperations.delete(operationId);
                }, 60000);
            }
        }
        return true;
    }
    /**
     * Get communication statistics
     */
    getCommunicationStats() {
        const queueSizes = Array.from(this.messageQueues.values()).map(q => q.messages.length);
        const averageQueueSize = queueSizes.length > 0 ? queueSizes.reduce((a, b) => a + b, 0) / queueSizes.length : 0;
        const maxQueueSize = queueSizes.length > 0 ? Math.max(...queueSizes) : 0;
        return {
            connectedAgents: this.connectedAgents.size,
            messageStats: { ...this.messageStats },
            queueStats: {
                totalQueues: this.messageQueues.size,
                averageQueueSize,
                maxQueueSize,
            },
            synchronizationStats: {
                activeBarriers: this.synchronizationBarriers.size,
                activeConsensusOperations: this.consensusOperations.size,
            },
        };
    }
    /**
     * Shutdown the communication hub
     */
    async shutdown() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        // Send shutdown signal to all connected agents
        await this.broadcastMessage({
            id: this.generateMessageId(),
            from: 'system',
            to: '*',
            type: 'shutdown_signal',
            priority: 'critical',
            payload: { reason: 'hub_shutdown' },
            timestamp: new Date(),
        });
        // Clear all pending responses
        for (const { reject, timeout } of this.pendingResponses.values()) {
            clearTimeout(timeout);
            reject(new Error('Communication hub shutdown'));
        }
        // Clean up all data structures
        this.connectedAgents.clear();
        this.messageQueues.clear();
        this.subscriptions.clear();
        this.messageHistory = [];
        this.pendingResponses.clear();
        this.synchronizationBarriers.clear();
        this.consensusOperations.clear();
        this.routingTable.clear();
        console.log('🛑 Agent communication hub shutdown');
    }
    // Private helper methods
    async deliverMessage(message, recipient) {
        if (!this.connectedAgents.has(recipient)) {
            return false;
        }
        const queue = this.messageQueues.get(recipient);
        if (!queue) {
            return false;
        }
        // Check if message matches any subscriptions
        const agentSubscriptions = this.subscriptions.get(recipient);
        let shouldDeliver = !agentSubscriptions || agentSubscriptions.size === 0; // Default deliver if no subscriptions
        if (agentSubscriptions) {
            for (const filter of agentSubscriptions.values()) {
                if (this.messageMatchesFilter(message, filter)) {
                    shouldDeliver = true;
                    break;
                }
            }
        }
        if (!shouldDeliver) {
            return false;
        }
        // Add to queue
        queue.messages.push(message);
        // Trim queue if too large
        if (queue.messages.length > queue.maxSize) {
            queue.messages = queue.messages.slice(-queue.maxSize);
        }
        // Emit delivery event
        const event = {
            type: 'message_delivered',
            timestamp: new Date(),
            data: { messageId: message.id, recipient },
        };
        this.emit('message_delivered', event);
        return true;
    }
    async broadcastMessage(message) {
        let deliveries = 0;
        for (const agentId of this.connectedAgents) {
            if (agentId !== message.from) {
                const success = await this.deliverMessage(message, agentId);
                if (success)
                    deliveries++;
            }
        }
        return deliveries > 0;
    }
    messageMatchesFilter(message, filter) {
        // Check message type
        if (filter.type && !filter.type.includes(message.type)) {
            return false;
        }
        // Check sender
        if (filter.from && !filter.from.includes(message.from)) {
            return false;
        }
        // Check recipient
        if (filter.to) {
            const recipients = Array.isArray(message.to) ? message.to : [message.to];
            if (!filter.to.some(filterRecipient => recipients.includes(filterRecipient))) {
                return false;
            }
        }
        // Check payload (simplified - exact match for now)
        if (filter.payload) {
            for (const [key, value] of Object.entries(filter.payload)) {
                if (message.payload[key] !== value) {
                    return false;
                }
            }
        }
        return true;
    }
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateSubscriptionId() {
        return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    startPeriodicCleanup() {
        this.cleanupInterval = setInterval(() => {
            this.performCleanup();
        }, 300000); // Every 5 minutes
    }
    performCleanup() {
        const now = new Date();
        // Clean up expired messages
        for (const queue of this.messageQueues.values()) {
            queue.messages = queue.messages.filter(msg => !msg.expiresAt || msg.expiresAt > now);
        }
        // Clean up timed out barriers
        for (const [barrierId, barrier] of this.synchronizationBarriers) {
            if (barrier.status === 'waiting' && barrier.timeout < now) {
                barrier.status = 'timeout';
                // Notify participants of timeout
                for (const participant of barrier.requiredParticipants) {
                    this.sendMessage({
                        from: 'system',
                        to: participant,
                        type: 'synchronization',
                        priority: 'normal',
                        payload: {
                            action: 'barrier_timeout',
                            barrierId,
                        },
                    }).catch(error => console.error('Error notifying barrier timeout:', error));
                }
                // Remove after notification
                setTimeout(() => {
                    this.synchronizationBarriers.delete(barrierId);
                }, 5000);
            }
        }
        // Clean up timed out consensus operations
        for (const [operationId, operation] of this.consensusOperations) {
            if (operation.status === 'voting' && operation.timeout < now) {
                operation.status = 'timeout';
                // Notify participants of timeout
                for (const participant of operation.participants) {
                    this.sendMessage({
                        from: 'system',
                        to: participant,
                        type: 'consensus',
                        priority: 'normal',
                        payload: {
                            action: 'consensus_timeout',
                            operationId,
                            votes: operation.votes.size,
                        },
                    }).catch(error => console.error('Error notifying consensus timeout:', error));
                }
                // Remove after notification
                setTimeout(() => {
                    this.consensusOperations.delete(operationId);
                }, 5000);
            }
        }
        // Clean up old message history
        const historyLimit = 5000;
        if (this.messageHistory.length > historyLimit) {
            this.messageHistory = this.messageHistory.slice(-historyLimit);
        }
        // Clean up stale message queues (no access for 1 hour)
        const staleThreshold = 60 * 60 * 1000; // 1 hour
        for (const [agentId, queue] of this.messageQueues) {
            if (now.getTime() - queue.lastAccess.getTime() > staleThreshold && !this.connectedAgents.has(agentId)) {
                this.messageQueues.delete(agentId);
            }
        }
        console.log(`🧹 Communication hub cleanup completed`);
    }
}
//# sourceMappingURL=agentCommunicationHub.js.map