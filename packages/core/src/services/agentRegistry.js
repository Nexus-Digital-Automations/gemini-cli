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
/**
 * Central registry for agent management and discovery
 */
export class AgentRegistry extends EventEmitter {
  agents = new Map();
  agentMetrics = new Map();
  capabilityIndex = new Map();
  tagIndex = new Map();
  serviceEndpoints = new Map();
  registrationHistory = [];
  cleanupInterval = null;
  constructor() {
    super();
    this.initializeCapabilityIndex();
    this.startPeriodicCleanup();
  }
  /**
   * Register a new agent in the registry
   */
  async registerAgent(registration) {
    const agent = {
      ...registration,
      registeredAt: new Date(),
      lastSeen: new Date(),
    };
    // Store agent registration
    this.agents.set(agent.id, agent);
    // Update capability index
    this.updateCapabilityIndex(agent.id, [], agent.capabilities);
    // Update tag index
    this.updateTagIndex(agent.id, [], agent.tags);
    // Initialize default metrics
    const defaultMetrics = {
      id: agent.id,
      totalTasksCompleted: 0,
      totalTasksFailed: 0,
      averageExecutionTime: 0,
      successRate: 1.0,
      currentLoad: 0,
      lastActiveTime: new Date(),
      uptime: 0,
      errorCount: 0,
      recoveryCount: 0,
    };
    this.agentMetrics.set(agent.id, defaultMetrics);
    // Track registration history
    this.registrationHistory.push({
      agentId: agent.id,
      action: 'registered',
      timestamp: new Date(),
    });
    // Emit event
    const event = {
      type: 'agent_registered',
      timestamp: new Date(),
      agentId: agent.id,
      data: {
        capabilities: agent.capabilities,
        tags: agent.tags,
        maxConcurrentTasks: agent.maxConcurrentTasks,
      },
    };
    this.emit('agent_registered', event);
    console.log(
      `📋 Agent ${agent.id} registered in registry with capabilities: ${agent.capabilities.join(', ')}`,
    );
  }
  /**
   * Update an existing agent's registration
   */
  async updateAgent(agentId, updates) {
    const existing = this.agents.get(agentId);
    if (!existing) {
      throw new Error(`Agent ${agentId} not found in registry`);
    }
    const oldCapabilities = existing.capabilities;
    const oldTags = existing.tags;
    const updated = {
      ...existing,
      ...updates,
      lastSeen: new Date(),
    };
    this.agents.set(agentId, updated);
    // Update indices if capabilities or tags changed
    if (updates.capabilities) {
      this.updateCapabilityIndex(
        agentId,
        oldCapabilities,
        updates.capabilities,
      );
    }
    if (updates.tags) {
      this.updateTagIndex(agentId, oldTags, updates.tags);
    }
    const event = {
      type: 'agent_updated',
      timestamp: new Date(),
      agentId,
      data: { updates },
    };
    this.emit('agent_updated', event);
    console.log(`🔄 Agent ${agentId} updated in registry`);
  }
  /**
   * Remove an agent from the registry
   */
  async removeAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return; // Already removed
    }
    // Remove from indices
    this.updateCapabilityIndex(agentId, agent.capabilities, []);
    this.updateTagIndex(agentId, agent.tags, []);
    // Remove from maps
    this.agents.delete(agentId);
    this.agentMetrics.delete(agentId);
    this.serviceEndpoints.delete(agentId);
    // Track removal history
    this.registrationHistory.push({
      agentId,
      action: 'removed',
      timestamp: new Date(),
    });
    const event = {
      type: 'agent_removed',
      timestamp: new Date(),
      agentId,
      data: { reason: 'manual_removal' },
    };
    this.emit('agent_removed', event);
    console.log(`🗑️ Agent ${agentId} removed from registry`);
  }
  /**
   * Update agent metrics
   */
  updateAgentMetrics(agentId, metrics) {
    const existing = this.agentMetrics.get(agentId);
    if (!existing) {
      return;
    }
    const updated = { ...existing, ...metrics };
    this.agentMetrics.set(agentId, updated);
    // Update last seen
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.lastSeen = new Date();
      this.agents.set(agentId, agent);
    }
  }
  /**
   * Discover agents based on requirements
   */
  async discoverAgents(query) {
    const candidates = new Set();
    // Find agents by capabilities
    if (query.capabilities && query.capabilities.length > 0) {
      const requiredCapabilities = query.capabilities.filter(
        (req) => req.required,
      );
      const optionalCapabilities = query.capabilities.filter(
        (req) => !req.required,
      );
      // All required capabilities must be satisfied
      for (const req of requiredCapabilities) {
        const agentsWithCapability =
          this.capabilityIndex.get(req.capability) || new Set();
        if (candidates.size === 0) {
          // First required capability - start with all agents that have it
          agentsWithCapability.forEach((agentId) => candidates.add(agentId));
        } else {
          // Intersect with previous results
          const intersection = new Set();
          for (const agentId of candidates) {
            if (agentsWithCapability.has(agentId)) {
              intersection.add(agentId);
            }
          }
          candidates.clear();
          intersection.forEach((agentId) => candidates.add(agentId));
        }
      }
      // If no required capabilities, start with all agents
      if (requiredCapabilities.length === 0) {
        this.agents.forEach((_, agentId) => candidates.add(agentId));
      }
    } else {
      // No capability requirements - consider all agents
      this.agents.forEach((_, agentId) => candidates.add(agentId));
    }
    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      const tagMatches = new Set();
      for (const tag of query.tags) {
        const agentsWithTag = this.tagIndex.get(tag) || new Set();
        agentsWithTag.forEach((agentId) => tagMatches.add(agentId));
      }
      // Keep only agents that match at least one tag
      const intersection = new Set();
      for (const agentId of candidates) {
        if (tagMatches.has(agentId)) {
          intersection.add(agentId);
        }
      }
      candidates.clear();
      intersection.forEach((agentId) => candidates.add(agentId));
    }
    // Filter excluded agents
    if (query.excludeAgents) {
      for (const excludeId of query.excludeAgents) {
        candidates.delete(excludeId);
      }
    }
    // Build result set
    const results = [];
    for (const agentId of candidates) {
      const agent = this.agents.get(agentId);
      const metrics = this.agentMetrics.get(agentId);
      if (!agent || !metrics) continue;
      // Apply filters
      if (query.maxLoad && metrics.currentLoad > query.maxLoad) {
        continue;
      }
      if (query.minSuccessRate && metrics.successRate < query.minSuccessRate) {
        continue;
      }
      // Determine status
      const status = this.determineAgentStatus(agent, metrics);
      const serviceInfo = {
        agent,
        metrics,
        status,
        score: this.calculateDiscoveryScore(agent, metrics, query),
      };
      results.push(serviceInfo);
    }
    // Sort results
    this.sortDiscoveryResults(results, query.sortBy || 'performance');
    // Prioritize preferred agents
    if (query.preferredAgents && query.preferredAgents.length > 0) {
      const preferred = results.filter((info) =>
        query.preferredAgents.includes(info.agent.id),
      );
      const others = results.filter(
        (info) => !query.preferredAgents.includes(info.agent.id),
      );
      results.splice(0, results.length, ...preferred, ...others);
    }
    // Emit discovery event
    const event = {
      type: 'discovery_query',
      timestamp: new Date(),
      data: {
        query,
        resultsCount: results.length,
        candidateCount: candidates.size,
      },
    };
    this.emit('discovery_query', event);
    console.log(
      `🔍 Agent discovery: ${results.length} agents found matching criteria`,
    );
    return results;
  }
  /**
   * Get agents by specific capability
   */
  getAgentsByCapability(capability) {
    const agentIds = this.capabilityIndex.get(capability) || new Set();
    const results = [];
    for (const agentId of agentIds) {
      const agent = this.agents.get(agentId);
      const metrics = this.agentMetrics.get(agentId);
      if (agent && metrics) {
        results.push({
          agent,
          metrics,
          status: this.determineAgentStatus(agent, metrics),
        });
      }
    }
    return results;
  }
  /**
   * Get all registered agents
   */
  getAllAgents() {
    const results = [];
    for (const [agentId, agent] of this.agents) {
      const metrics = this.agentMetrics.get(agentId);
      if (metrics) {
        results.push({
          agent,
          metrics,
          status: this.determineAgentStatus(agent, metrics),
        });
      }
    }
    return results;
  }
  /**
   * Get registry statistics
   */
  getRegistryStats() {
    const agents = this.getAllAgents();
    const agentsByCapability = {};
    const agentsByStatus = {
      available: 0,
      busy: 0,
      offline: 0,
      maintenance: 0,
    };
    let totalLoad = 0;
    let healthyCount = 0;
    for (const info of agents) {
      // Count by capability
      for (const capability of info.agent.capabilities) {
        agentsByCapability[capability] =
          (agentsByCapability[capability] || 0) + 1;
      }
      // Count by status
      agentsByStatus[info.status]++;
      // Calculate load and health
      totalLoad += info.metrics.currentLoad;
      if (info.metrics.successRate > 0.8 && info.metrics.currentLoad < 0.8) {
        healthyCount++;
      }
    }
    return {
      totalAgents: agents.length,
      agentsByCapability,
      agentsByStatus,
      averageLoad: agents.length > 0 ? totalLoad / agents.length : 0,
      healthyAgents: healthyCount,
    };
  }
  /**
   * Shutdown the registry
   */
  async shutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.agents.clear();
    this.agentMetrics.clear();
    this.capabilityIndex.clear();
    this.tagIndex.clear();
    this.serviceEndpoints.clear();
    this.registrationHistory = [];
    console.log('🛑 Agent registry shutdown');
  }
  // Private helper methods
  initializeCapabilityIndex() {
    const capabilities = [
      'frontend',
      'backend',
      'testing',
      'documentation',
      'security',
      'performance',
      'analysis',
      'validation',
    ];
    for (const capability of capabilities) {
      this.capabilityIndex.set(capability, new Set());
    }
  }
  updateCapabilityIndex(agentId, oldCapabilities, newCapabilities) {
    // Remove from old capabilities
    for (const capability of oldCapabilities) {
      const agentSet = this.capabilityIndex.get(capability);
      if (agentSet) {
        agentSet.delete(agentId);
      }
    }
    // Add to new capabilities
    for (const capability of newCapabilities) {
      let agentSet = this.capabilityIndex.get(capability);
      if (!agentSet) {
        agentSet = new Set();
        this.capabilityIndex.set(capability, agentSet);
      }
      agentSet.add(agentId);
    }
  }
  updateTagIndex(agentId, oldTags, newTags) {
    // Remove from old tags
    for (const tag of oldTags) {
      const agentSet = this.tagIndex.get(tag);
      if (agentSet) {
        agentSet.delete(tag);
      }
    }
    // Add to new tags
    for (const tag of newTags) {
      let agentSet = this.tagIndex.get(tag);
      if (!agentSet) {
        agentSet = new Set();
        this.tagIndex.set(tag, agentSet);
      }
      agentSet.add(agentId);
    }
  }
  determineAgentStatus(agent, metrics) {
    const now = new Date();
    const timeSinceLastSeen = now.getTime() - agent.lastSeen.getTime();
    // Check if offline (no activity for 2 minutes)
    if (timeSinceLastSeen > 120000) {
      return 'offline';
    }
    // Check if in maintenance mode (could be configured per agent)
    if (agent.configuration?.maintenance === true) {
      return 'maintenance';
    }
    // Check if busy (high load)
    if (metrics.currentLoad >= 0.9) {
      return 'busy';
    }
    return 'available';
  }
  calculateDiscoveryScore(agent, metrics, query) {
    let score = 0;
    // Base performance score (0-40 points)
    score += metrics.successRate * 40;
    // Load factor score (0-30 points, lower load = higher score)
    score += (1 - metrics.currentLoad) * 30;
    // Capability match score (0-20 points)
    if (query.capabilities) {
      const totalCapabilities = query.capabilities.length;
      const matchedCapabilities = query.capabilities.filter((req) =>
        agent.capabilities.includes(req.capability),
      ).length;
      if (totalCapabilities > 0) {
        score += (matchedCapabilities / totalCapabilities) * 20;
      }
    } else {
      score += 20; // No specific requirements
    }
    // Response time score (0-10 points)
    const maxResponseTime = 5000; // 5 seconds
    const responseScore = Math.max(
      0,
      (maxResponseTime - metrics.averageExecutionTime) / maxResponseTime,
    );
    score += responseScore * 10;
    return score;
  }
  sortDiscoveryResults(results, sortBy) {
    switch (sortBy) {
      case 'performance':
        results.sort((a, b) => (b.score || 0) - (a.score || 0));
        break;
      case 'load':
        results.sort((a, b) => a.metrics.currentLoad - b.metrics.currentLoad);
        break;
      case 'availability':
        results.sort((a, b) => {
          const aAvailable = a.status === 'available' ? 1 : 0;
          const bAvailable = b.status === 'available' ? 1 : 0;
          return bAvailable - aAvailable;
        });
        break;
      case 'random':
        for (let i = results.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [results[i], results[j]] = [results[j], results[i]];
        }
        break;
      default:
        // Default to performance
        results.sort((a, b) => (b.score || 0) - (a.score || 0));
    }
  }
  startPeriodicCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 60000); // Every minute
  }
  performCleanup() {
    const now = new Date();
    const offlineThreshold = 5 * 60 * 1000; // 5 minutes
    const toRemove = [];
    // Find agents that have been offline too long
    for (const [agentId, agent] of this.agents) {
      const timeSinceLastSeen = now.getTime() - agent.lastSeen.getTime();
      if (timeSinceLastSeen > offlineThreshold) {
        toRemove.push(agentId);
      }
    }
    // Remove stale agents
    for (const agentId of toRemove) {
      this.removeAgent(agentId).catch((error) => {
        console.error(`Error removing stale agent ${agentId}:`, error);
      });
    }
    // Clean up old registration history (keep last 100 entries)
    if (this.registrationHistory.length > 100) {
      this.registrationHistory = this.registrationHistory.slice(-100);
    }
    if (toRemove.length > 0) {
      console.log(
        `🧹 Registry cleanup: removed ${toRemove.length} stale agents`,
      );
    }
  }
}
//# sourceMappingURL=agentRegistry.js.map
