/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { DecisionContext } from './types.js';
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
export declare class ContextCollector {
  private isInitialized;
  private lastSystemMetrics?;
  private lastCollectionTime;
  private readonly COLLECTION_CACHE_MS;
  private cachedContext?;
  /**
   * Initialize the context collector.
   */
  initialize(): Promise<void>;
  /**
   * Shutdown the context collector gracefully.
   */
  shutdown(): Promise<void>;
  /**
   * Collect comprehensive decision context.
   *
   * Gathers all available system state information for decision-making.
   * Results are cached briefly to avoid repeated expensive operations.
   *
   * @returns Promise resolving to complete decision context
   */
  collect(): Promise<DecisionContext>;
  /**
   * Collect current system load metrics.
   */
  private collectSystemLoad;
  /**
   * Collect task queue state information.
   */
  private collectTaskQueueState;
  /**
   * Collect agent context information.
   */
  private collectAgentContext;
  /**
   * Collect project state information.
   */
  private collectProjectState;
  /**
   * Collect budget context information.
   */
  private collectBudgetContext;
  /**
   * Collect performance history.
   */
  private collectPerformanceHistory;
  /**
   * Collect user preferences.
   */
  private collectUserPreferences;
  /**
   * Collect detailed system metrics.
   */
  private collectSystemMetrics;
  /**
   * Read FEATURES.json file for project context.
   */
  private readFeaturesJson;
  /**
   * Derive agent capabilities from agent ID.
   */
  private deriveAgentCapabilities;
  /**
   * Check if a file exists.
   */
  private fileExists;
  /**
   * Check if a directory exists.
   */
  private directoryExists;
  /**
   * Check git status (simplified).
   */
  private checkGitStatus;
}
