/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Agent Registry for Dynamic Agent Registration and Capability Discovery
 *
 * This system provides:
 * - Dynamic agent registration and deregistration
 * - Capability-based agent discovery and matching
 * - Agent lifecycle management and health tracking
 * - Service discovery for distributed agent networks
 * - Agent metadata and configuration management
 */
import { EventEmitter } from 'node:events';
import type { AgentCapability } from './autonomousTaskIntegrator.js';
import type { AgentMetrics } from './agentCoordinator.js';
export interface AgentRegistration {
    id: string;
    name: string;
    description: string;
    version: string;
    capabilities: AgentCapability[];
    maxConcurrentTasks: number;
    currentTasks: string[];
    configuration: Record<string, unknown>;
    endpoints?: {
        health: string;
        status: string;
        commands: string;
    };
    registeredAt: Date;
    lastSeen: Date;
    tags: string[];
}
export interface CapabilityRequirement {
    capability: AgentCapability;
    required: boolean;
    priority: number;
    minVersion?: string;
}
export interface AgentDiscoveryQuery {
    capabilities?: CapabilityRequirement[];
    tags?: string[];
    maxLoad?: number;
    minSuccessRate?: number;
    excludeAgents?: string[];
    preferredAgents?: string[];
    sortBy?: 'performance' | 'load' | 'availability' | 'random';
}
export interface AgentServiceInfo {
    agent: AgentRegistration;
    metrics: AgentMetrics;
    status: 'available' | 'busy' | 'offline' | 'maintenance';
    score?: number;
}
export interface RegistryEvent {
    type: 'agent_registered' | 'agent_updated' | 'agent_removed' | 'capability_changed' | 'discovery_query';
    timestamp: Date;
    agentId?: string;
    data: Record<string, unknown>;
}
/**
 * Central registry for agent management and discovery
 */
export declare class AgentRegistry extends EventEmitter {
    private agents;
    private agentMetrics;
    private capabilityIndex;
    private tagIndex;
    private serviceEndpoints;
    private registrationHistory;
    private cleanupInterval;
    constructor();
    /**
     * Register a new agent in the registry
     */
    registerAgent(registration: Omit<AgentRegistration, 'registeredAt' | 'lastSeen'>): Promise<void>;
    /**
     * Update an existing agent's registration
     */
    updateAgent(agentId: string, updates: Partial<AgentRegistration>): Promise<void>;
    /**
     * Remove an agent from the registry
     */
    removeAgent(agentId: string): Promise<void>;
    /**
     * Update agent metrics
     */
    updateAgentMetrics(agentId: string, metrics: Partial<AgentMetrics>): void;
    /**
     * Discover agents based on requirements
     */
    discoverAgents(query: AgentDiscoveryQuery): Promise<AgentServiceInfo[]>;
    /**
     * Get agents by specific capability
     */
    getAgentsByCapability(capability: AgentCapability): AgentServiceInfo[];
    /**
     * Get all registered agents
     */
    getAllAgents(): AgentServiceInfo[];
    /**
     * Get registry statistics
     */
    getRegistryStats(): {
        totalAgents: number;
        agentsByCapability: Record<AgentCapability, number>;
        agentsByStatus: Record<string, number>;
        averageLoad: number;
        healthyAgents: number;
    };
    /**
     * Shutdown the registry
     */
    shutdown(): Promise<void>;
    private initializeCapabilityIndex;
    private updateCapabilityIndex;
    private updateTagIndex;
    private determineAgentStatus;
    private calculateDiscoveryScore;
    private sortDiscoveryResults;
    private startPeriodicCleanup;
    private performCleanup;
}
