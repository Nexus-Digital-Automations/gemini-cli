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
import type { AgentCapability } from './autonomousTaskIntegrator.js';
export interface AgentMessage {
    id: string;
    from: string;
    to: string | string[];
    type: MessageType;
    priority: MessagePriority;
    payload: Record<string, unknown>;
    timestamp: Date;
    expiresAt?: Date;
    requiresResponse?: boolean;
    correlationId?: string;
    headers?: Record<string, string>;
}
export interface MessageResponse {
    messageId: string;
    from: string;
    success: boolean;
    payload?: Record<string, unknown>;
    error?: string;
    timestamp: Date;
}
export interface SubscriptionFilter {
    type?: MessageType[];
    from?: string[];
    to?: string[];
    payload?: Record<string, unknown>;
}
export interface SynchronizationBarrier {
    id: string;
    requiredParticipants: string[];
    waitingParticipants: string[];
    completedParticipants: string[];
    timeout: Date;
    payload?: Record<string, unknown>;
    status: 'waiting' | 'ready' | 'completed' | 'timeout';
}
export interface ConsensusOperation {
    id: string;
    type: 'leader_election' | 'distributed_lock' | 'state_agreement';
    participants: string[];
    votes: Map<string, unknown>;
    requiredVotes: number;
    status: 'voting' | 'decided' | 'timeout';
    result?: unknown;
    timeout: Date;
}
export type MessageType = 'task_coordination' | 'status_update' | 'resource_request' | 'synchronization' | 'consensus' | 'health_check' | 'performance_data' | 'error_report' | 'shutdown_signal' | 'custom';
export type MessagePriority = 'critical' | 'high' | 'normal' | 'low';
export interface CommunicationEvent {
    type: 'message_sent' | 'message_delivered' | 'message_failed' | 'subscription_added' | 'barrier_completed' | 'consensus_reached';
    timestamp: Date;
    data: Record<string, unknown>;
}
export interface MessageQueue {
    agentId: string;
    messages: AgentMessage[];
    maxSize: number;
    lastAccess: Date;
}
/**
 * Central communication hub for agent coordination
 */
export declare class AgentCommunicationHub extends EventEmitter {
    private connectedAgents;
    private messageQueues;
    private subscriptions;
    private messageHistory;
    private pendingResponses;
    private synchronizationBarriers;
    private consensusOperations;
    private routingTable;
    private messageStats;
    private cleanupInterval;
    constructor();
    /**
     * Connect an agent to the communication hub
     */
    connectAgent(agentId: string, capabilities?: AgentCapability[]): Promise<void>;
    /**
     * Disconnect an agent from the communication hub
     */
    disconnectAgent(agentId: string): Promise<void>;
    /**
     * Send a message between agents
     */
    sendMessage(message: Omit<AgentMessage, 'id' | 'timestamp'>): Promise<string>;
    /**
     * Send a message and wait for response
     */
    sendMessageWithResponse(message: Omit<AgentMessage, 'id' | 'timestamp' | 'requiresResponse'>, timeoutMs?: number): Promise<MessageResponse>;
    /**
     * Send a response to a message
     */
    sendResponse(originalMessageId: string, response: Omit<MessageResponse, 'timestamp'>): Promise<void>;
    /**
     * Subscribe to messages matching a filter
     */
    subscribe(agentId: string, filter: SubscriptionFilter): Promise<string>;
    /**
     * Unsubscribe from messages
     */
    unsubscribe(agentId: string, subscriptionId: string): Promise<void>;
    /**
     * Get messages for an agent
     */
    getMessages(agentId: string, limit?: number): Promise<AgentMessage[]>;
    /**
     * Create a synchronization barrier
     */
    createSynchronizationBarrier(barrierId: string, participants: string[], timeoutMs?: number, payload?: Record<string, unknown>): Promise<void>;
    /**
     * Join a synchronization barrier
     */
    joinSynchronizationBarrier(barrierId: string, agentId: string): Promise<boolean>;
    /**
     * Start a consensus operation
     */
    startConsensusOperation(operationId: string, type: ConsensusOperation['type'], participants: string[], timeoutMs?: number): Promise<void>;
    /**
     * Submit a vote for a consensus operation
     */
    submitVote(operationId: string, agentId: string, vote: unknown): Promise<boolean>;
    /**
     * Get communication statistics
     */
    getCommunicationStats(): {
        connectedAgents: number;
        messageStats: typeof this.messageStats;
        queueStats: {
            totalQueues: number;
            averageQueueSize: number;
            maxQueueSize: number;
        };
        synchronizationStats: {
            activeBarriers: number;
            activeConsensusOperations: number;
        };
    };
    /**
     * Shutdown the communication hub
     */
    shutdown(): Promise<void>;
    private deliverMessage;
    private broadcastMessage;
    private messageMatchesFilter;
    private generateMessageId;
    private generateSubscriptionId;
    private startPeriodicCleanup;
    private performCleanup;
}
