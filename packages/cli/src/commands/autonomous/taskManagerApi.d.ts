/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export interface TaskManagerResponse {
    success: boolean;
    data?: unknown;
    error?: string;
    message?: string;
}
export interface FeatureSuggestion {
    title: string;
    description: string;
    business_value: string;
    category: 'enhancement' | 'bug-fix' | 'new-feature' | 'performance' | 'security' | 'documentation';
}
export interface AgentInfo {
    id: string;
    status: string;
    sessionId?: string;
    timestamp?: string;
}
export interface AutonomousTask {
    title?: string;
    description?: string;
    category?: string;
    type?: string;
    priority?: string;
}
/**
 * Initialize or reinitialize an agent
 */
export declare function initializeAgent(agentId: string): Promise<TaskManagerResponse>;
/**
 * Suggest a new feature
 */
export declare function suggestFeature(feature: FeatureSuggestion): Promise<TaskManagerResponse>;
/**
 * List features with optional filtering
 */
export declare function listFeatures(filter?: Record<string, unknown>): Promise<TaskManagerResponse>;
/**
 * Approve a feature
 */
export declare function approveFeature(featureId: string, approvalData?: Record<string, unknown>): Promise<TaskManagerResponse>;
/**
 * Reject a feature
 */
export declare function rejectFeature(featureId: string, rejectionData?: Record<string, unknown>): Promise<TaskManagerResponse>;
/**
 * Get feature statistics
 */
export declare function getFeatureStats(): Promise<TaskManagerResponse>;
/**
 * Get initialization statistics
 */
export declare function getInitializationStats(): Promise<TaskManagerResponse>;
/**
 * Authorize agent to stop
 */
export declare function authorizeStop(agentId: string, reason: string): Promise<TaskManagerResponse>;
/**
 * Check if TaskManager API is available
 */
export declare function checkApiAvailability(): Promise<boolean>;
/**
 * Get comprehensive API guide
 */
export declare function getApiGuide(): Promise<TaskManagerResponse>;
/**
 * List available API methods
 */
export declare function listApiMethods(): Promise<TaskManagerResponse>;
/**
 * Handle API response with user-friendly error messages
 */
export declare function handleApiResponse(response: TaskManagerResponse, operation: string): boolean;
/**
 * Graceful fallback handler for when TaskManager API is unavailable
 */
export declare function handleApiFallback(operation: string, fallbackAction?: () => void): void;
/**
 * Convert autonomous task to TaskManager feature suggestion
 */
export declare function convertTaskToFeature(task: AutonomousTask): FeatureSuggestion;
