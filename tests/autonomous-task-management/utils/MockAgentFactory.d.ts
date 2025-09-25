/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SubAgentScope,
  type PromptConfig,
  type ModelConfig,
  type RunConfig,
  type SubAgentOptions,
} from '../../../packages/core/src/core/subagent.js';
import type { Config } from '../../../packages/core/src/config/config.js';
/**
 * Mock agent states for testing different scenarios
 */
export declare enum MockAgentState {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  TIMEOUT = 'TIMEOUT',
  MAX_TURNS = 'MAX_TURNS',
  PARTIAL_SUCCESS = 'PARTIAL_SUCCESS',
}
/**
 * Configuration for creating mock agents with specific behaviors
 */
export interface MockAgentConfig {
  name: string;
  state: MockAgentState;
  executionTime?: number;
  outputVars?: Record<string, string>;
  errorMessage?: string;
  toolCalls?: string[];
  maxTurns?: number;
  onMessage?: (message: string) => void;
}
/**
 * Factory for creating mock agents with predefined behaviors for testing
 */
export declare class MockAgentFactory {
  private static mockConfigs;
  private static executionLogs;
  /**
   * Creates a mock SubAgentScope with predefined behavior
   */
  static createMockAgent(
    config: MockAgentConfig,
    runtimeContext: Config,
    promptConfig: PromptConfig,
    modelConfig: ModelConfig,
    runConfig: RunConfig,
    options?: SubAgentOptions,
  ): Promise<SubAgentScope>;
  /**
   * Creates multiple mock agents for concurrent testing
   */
  static createMockAgentPool(
    configs: MockAgentConfig[],
    runtimeContext: Config,
  ): Promise<SubAgentScope[]>;
  /**
   * Simulates agent execution with controlled timing and outcomes
   */
  private static simulateExecution;
  /**
   * Creates mock output based on agent configuration
   */
  private static createMockOutput;
  /**
   * Logs messages for a specific agent
   */
  private static logMessage;
  /**
   * Gets execution logs for an agent
   */
  static getExecutionLogs(agentName: string): string[];
  /**
   * Gets all execution logs
   */
  static getAllExecutionLogs(): Map<string, string[]>;
  /**
   * Clears all execution logs
   */
  static clearLogs(): void;
  /**
   * Gets mock configuration for an agent
   */
  static getMockConfig(agentName: string): MockAgentConfig | undefined;
  /**
   * Creates predefined agent configurations for common test scenarios
   */
  static createStandardConfigurations(): Record<string, MockAgentConfig>;
  /**
   * Creates agents for performance testing with various characteristics
   */
  static createPerformanceTestAgents(count: number): MockAgentConfig[];
  /**
   * Resets all mock configurations and logs
   */
  static reset(): void;
  /**
   * Validates that an agent executed as expected
   */
  static validateAgentExecution(
    agentName: string,
    expectedState: MockAgentState,
    expectedOutputKeys?: string[],
  ): boolean;
}
