/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export declare enum TaskStatus {
    Todo = "todo",
    InProgress = "in_progress",
    Done = "done",
    Failed = "failed",
    Blocked = "blocked"
}
export declare enum TaskPriority {
    Low = "low",
    Medium = "medium",
    High = "high",
    Critical = "critical"
}
export interface ToolCall {
    toolName: string;
    args: Record<string, unknown>;
    result?: unknown;
    error?: string;
}
export interface TaskMetadata {
    toolCalls: ToolCall[];
    context: Record<string, unknown>;
    estimatedDuration?: number;
}
export declare enum TaskType {
    IMPLEMENTATION = "implementation",// Code implementation
    TESTING = "testing",// Test creation/execution
    VALIDATION = "validation",// Quality assurance
    DOCUMENTATION = "documentation",// Documentation creation
    ANALYSIS = "analysis",// Research and analysis
    DEPLOYMENT = "deployment",// Deployment and operations
    SECURITY = "security",// Security assessment/fixes
    PERFORMANCE = "performance",// Performance optimization
    REFACTORING = "refactoring",// Code refactoring
    CRITICAL = "critical",// Critical priority tasks
    QUALITY = "quality"
}
export interface Task {
    id: string;
    name: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    type?: TaskType;
    category?: string;
    dueDate?: string;
    assignee?: string;
    dependencies: string[];
    subtasks: string[];
    metadata: TaskMetadata;
    createdAt: string;
    updatedAt: string;
    results?: Record<string, unknown>;
    lastError?: string;
    metrics?: {
        startTime: Date;
        endTime?: Date;
        durationMs?: number;
        tokenUsage?: number;
        toolCallsCount?: number;
        subAgentCount?: number;
        errorCount?: number;
        retryCount?: number;
        memoryUsage?: number;
        cpuUsage?: number;
    };
}
