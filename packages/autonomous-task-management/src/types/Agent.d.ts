/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { TaskId, TaskCategory, TaskPriority } from './Task';
/**
 * Unique identifier for agents
 */
export type AgentId = string;
/**
 * Agent session identifier
 */
export type SessionId = string;
/**
 * Agent status enumeration
 */
export declare enum AgentStatus {
    INITIALIZING = "initializing",
    IDLE = "idle",
    ACTIVE = "active",
    BUSY = "busy",
    BLOCKED = "blocked",
    ERROR = "error",
    OFFLINE = "offline",
    TERMINATED = "terminated"
}
/**
 * Agent specialization types
 */
export declare enum AgentSpecialization {
    GENERALIST = "generalist",
    FRONTEND = "frontend",
    BACKEND = "backend",
    TESTING = "testing",
    SECURITY = "security",
    PERFORMANCE = "performance",
    DOCUMENTATION = "documentation",
    ARCHITECTURE = "architecture",
    DEVOPS = "devops",
    DATABASE = "database",
    MONITORING = "monitoring",
    VALIDATION = "validation",
    INTEGRATION = "integration",
    RESEARCH = "research"
}
/**
 * Agent capability levels
 */
export declare enum CapabilityLevel {
    BASIC = "basic",
    INTERMEDIATE = "intermediate",
    ADVANCED = "advanced",
    EXPERT = "expert",
    SPECIALIST = "specialist"
}
/**
 * Core agent interface
 */
export interface Agent {
    /** Unique agent identifier */
    id: AgentId;
    /** Human-readable agent name */
    name: string;
    /** Agent description and purpose */
    description: string;
    /** Current agent status */
    status: AgentStatus;
    /** Agent specialization area */
    specialization: AgentSpecialization;
    /** Agent capabilities */
    capabilities: AgentCapabilities;
    /** Agent configuration */
    config: AgentConfiguration;
    /** Current session information */
    session: AgentSession;
    /** Agent statistics and metrics */
    stats: AgentStatistics;
    /** Agent timestamps */
    timestamps: AgentTimestamps;
    /** Agent history */
    history: AgentHistoryEntry[];
}
/**
 * Agent capabilities interface
 */
export interface AgentCapabilities {
    /** Task categories this agent can handle */
    supportedCategories: TaskCategory[];
    /** Maximum priority tasks this agent can handle */
    maxPriority: TaskPriority;
    /** Programming languages supported */
    programmingLanguages: string[];
    /** Tools and frameworks supported */
    tools: string[];
    /** Frameworks and libraries supported */
    frameworks: string[];
    /** File types this agent can work with */
    fileTypes: string[];
    /** Maximum concurrent tasks */
    maxConcurrentTasks: number;
    /** Capability levels by area */
    levels: Record<string, CapabilityLevel>;
    /** Custom capabilities */
    customCapabilities: Record<string, any>;
}
/**
 * Agent configuration interface
 */
export interface AgentConfiguration {
    /** Agent behavior settings */
    behavior: AgentBehavior;
    /** Resource limits */
    resources: ResourceLimits;
    /** Quality settings */
    quality: QualitySettings;
    /** Communication preferences */
    communication: CommunicationSettings;
    /** Security settings */
    security: SecuritySettings;
    /** Plugin configuration */
    plugins: PluginConfiguration[];
}
/**
 * Agent behavior settings
 */
export interface AgentBehavior {
    /** Autonomy level */
    autonomyLevel: number;
    /** Risk tolerance */
    riskTolerance: number;
    /** Verbosity level */
    verbosity: number;
    /** Creativity level */
    creativity: number;
    /** Persistence level */
    persistence: number;
    /** Collaboration preference */
    collaboration: number;
    /** Learning enabled */
    learningEnabled: boolean;
    /** Proactive behavior */
    proactiveMode: boolean;
}
/**
 * Resource limits for agent execution
 */
export interface ResourceLimits {
    /** Maximum memory usage in MB */
    maxMemory: number;
    /** Maximum CPU usage percentage */
    maxCpuUsage: number;
    /** Maximum execution time per task in milliseconds */
    maxExecutionTime: number;
    /** Maximum concurrent operations */
    maxConcurrentOperations: number;
    /** Maximum file operations per minute */
    maxFileOperations: number;
    /** Maximum network requests per minute */
    maxNetworkRequests: number;
}
/**
 * Quality settings for agent work
 */
export interface QualitySettings {
    /** Code quality threshold (0-100) */
    codeQualityThreshold: number;
    /** Test coverage requirement (0-100) */
    testCoverageThreshold: number;
    /** Security scan requirement */
    securityScanRequired: boolean;
    /** Performance benchmark requirement */
    performanceBenchmarkRequired: boolean;
    /** Code review requirement */
    codeReviewRequired: boolean;
    /** Documentation requirement */
    documentationRequired: boolean;
}
/**
 * Communication settings
 */
export interface CommunicationSettings {
    /** Preferred communication style */
    style: CommunicationStyle;
    /** Notification preferences */
    notifications: NotificationPreferences;
    /** Status reporting frequency in seconds */
    statusReportingInterval: number;
    /** Error reporting threshold */
    errorReportingThreshold: number;
}
/**
 * Communication style enumeration
 */
export declare enum CommunicationStyle {
    MINIMAL = "minimal",
    CONCISE = "concise",
    DETAILED = "detailed",
    VERBOSE = "verbose",
    TECHNICAL = "technical",
    CASUAL = "casual"
}
/**
 * Notification preferences
 */
export interface NotificationPreferences {
    /** Task assignment notifications */
    taskAssignment: boolean;
    /** Task completion notifications */
    taskCompletion: boolean;
    /** Error notifications */
    errors: boolean;
    /** Warning notifications */
    warnings: boolean;
    /** Status change notifications */
    statusChanges: boolean;
    /** Performance alerts */
    performanceAlerts: boolean;
}
/**
 * Security settings for agent
 */
export interface SecuritySettings {
    /** File access restrictions */
    fileAccessRestrictions: string[];
    /** Network access restrictions */
    networkAccessRestrictions: string[];
    /** Command execution restrictions */
    commandRestrictions: string[];
    /** API access restrictions */
    apiRestrictions: string[];
    /** Audit logging enabled */
    auditLogging: boolean;
    /** Secure mode enabled */
    secureMode: boolean;
}
/**
 * Plugin configuration
 */
export interface PluginConfiguration {
    /** Plugin name */
    name: string;
    /** Plugin version */
    version: string;
    /** Plugin enabled */
    enabled: boolean;
    /** Plugin configuration */
    config: Record<string, any>;
}
/**
 * Agent session interface
 */
export interface AgentSession {
    /** Session identifier */
    id: SessionId;
    /** Session start time */
    startTime: Date;
    /** Last heartbeat time */
    lastHeartbeat: Date;
    /** Session timeout in milliseconds */
    timeout: number;
    /** Currently assigned tasks */
    assignedTasks: TaskId[];
    /** Active task (currently being worked on) */
    activeTask?: TaskId;
    /** Session context */
    context: SessionContext;
    /** Session statistics */
    stats: SessionStatistics;
    /** Previous sessions */
    previousSessions: SessionId[];
}
/**
 * Session context
 */
export interface SessionContext {
    /** Working directory */
    workingDirectory: string;
    /** Environment variables */
    environment: Record<string, string>;
    /** Current branch */
    currentBranch: string;
    /** Project metadata */
    project: ProjectMetadata;
    /** Session variables */
    variables: Record<string, any>;
}
/**
 * Project metadata
 */
export interface ProjectMetadata {
    /** Project name */
    name: string;
    /** Project version */
    version: string;
    /** Project type */
    type: string;
    /** Programming languages */
    languages: string[];
    /** Frameworks used */
    frameworks: string[];
    /** Dependencies */
    dependencies: string[];
}
/**
 * Session statistics
 */
export interface SessionStatistics {
    /** Tasks completed in this session */
    tasksCompleted: number;
    /** Tasks failed in this session */
    tasksFailed: number;
    /** Total execution time in milliseconds */
    totalExecutionTime: number;
    /** Files modified in this session */
    filesModified: number;
    /** Lines of code written */
    linesWritten: number;
    /** Commands executed */
    commandsExecuted: number;
    /** Errors encountered */
    errorsEncountered: number;
}
/**
 * Agent statistics and metrics
 */
export interface AgentStatistics {
    /** Total tasks completed */
    totalTasksCompleted: number;
    /** Total tasks failed */
    totalTasksFailed: number;
    /** Success rate percentage */
    successRate: number;
    /** Average task completion time in milliseconds */
    averageCompletionTime: number;
    /** Total runtime in milliseconds */
    totalRuntime: number;
    /** Performance ratings */
    performanceRatings: PerformanceRatings;
    /** Quality metrics */
    qualityMetrics: QualityMetrics;
    /** Resource usage statistics */
    resourceUsage: ResourceUsageStats;
}
/**
 * Performance ratings
 */
export interface PerformanceRatings {
    /** Overall rating (0-10) */
    overall: number;
    /** Speed rating (0-10) */
    speed: number;
    /** Quality rating (0-10) */
    quality: number;
    /** Reliability rating (0-10) */
    reliability: number;
    /** Autonomy rating (0-10) */
    autonomy: number;
}
/**
 * Quality metrics
 */
export interface QualityMetrics {
    /** Code quality score (0-100) */
    codeQuality: number;
    /** Test coverage percentage */
    testCoverage: number;
    /** Documentation coverage percentage */
    documentationCoverage: number;
    /** Security issues found */
    securityIssues: number;
    /** Performance issues found */
    performanceIssues: number;
}
/**
 * Resource usage statistics
 */
export interface ResourceUsageStats {
    /** Average memory usage in MB */
    averageMemoryUsage: number;
    /** Peak memory usage in MB */
    peakMemoryUsage: number;
    /** Average CPU usage percentage */
    averageCpuUsage: number;
    /** Network requests made */
    networkRequests: number;
    /** File operations performed */
    fileOperations: number;
}
/**
 * Agent timestamps
 */
export interface AgentTimestamps {
    /** Agent creation time */
    createdAt: Date;
    /** Last update time */
    updatedAt: Date;
    /** Last activity time */
    lastActivityAt: Date;
    /** Last initialization time */
    lastInitializedAt: Date;
    /** Last termination time */
    lastTerminatedAt?: Date;
}
/**
 * Agent history entry
 */
export interface AgentHistoryEntry {
    /** Entry timestamp */
    timestamp: Date;
    /** Action performed */
    action: AgentAction;
    /** Session ID when action occurred */
    sessionId: SessionId;
    /** Action details */
    details: string;
    /** Related task ID if applicable */
    taskId?: TaskId;
    /** Action metadata */
    metadata?: Record<string, any>;
}
/**
 * Agent actions for history tracking
 */
export declare enum AgentAction {
    INITIALIZED = "initialized",
    STARTED = "started",
    STOPPED = "stopped",
    TASK_ASSIGNED = "task_assigned",
    TASK_STARTED = "task_started",
    TASK_COMPLETED = "task_completed",
    TASK_FAILED = "task_failed",
    STATUS_CHANGED = "status_changed",
    ERROR_OCCURRED = "error_occurred",
    HEARTBEAT = "heartbeat",
    SESSION_EXPIRED = "session_expired",
    CONFIGURATION_CHANGED = "configuration_changed"
}
/**
 * Agent creation request
 */
export interface CreateAgentRequest {
    /** Agent name */
    name: string;
    /** Agent description */
    description: string;
    /** Agent specialization */
    specialization: AgentSpecialization;
    /** Agent capabilities */
    capabilities?: Partial<AgentCapabilities>;
    /** Agent configuration */
    config?: Partial<AgentConfiguration>;
}
/**
 * Agent update request
 */
export interface UpdateAgentRequest {
    /** Agent ID */
    id: AgentId;
    /** Fields to update */
    updates: Partial<Agent>;
    /** Update reason */
    reason: string;
}
/**
 * Agent query interface
 */
export interface AgentQuery {
    /** Filter by IDs */
    ids?: AgentId[];
    /** Filter by status */
    status?: AgentStatus[];
    /** Filter by specialization */
    specialization?: AgentSpecialization[];
    /** Filter by capabilities */
    capabilities?: Partial<AgentCapabilities>;
    /** Filter by availability */
    available?: boolean;
    /** Text search */
    search?: string;
    /** Sort order */
    sortBy?: AgentSortField;
    /** Sort direction */
    sortDirection?: 'asc' | 'desc';
    /** Result limit */
    limit?: number;
    /** Result offset */
    offset?: number;
}
/**
 * Agent sort fields
 */
export declare enum AgentSortField {
    NAME = "name",
    STATUS = "status",
    SPECIALIZATION = "specialization",
    CREATED_AT = "createdAt",
    LAST_ACTIVITY = "lastActivityAt",
    SUCCESS_RATE = "successRate",
    PERFORMANCE_RATING = "performanceRating"
}
/**
 * Agent assignment request
 */
export interface AgentAssignmentRequest {
    /** Agent ID to assign task to */
    agentId: AgentId;
    /** Task ID to assign */
    taskId: TaskId;
    /** Assignment priority */
    priority: TaskPriority;
    /** Assignment reason */
    reason: string;
    /** Estimated completion time */
    estimatedCompletion?: Date;
}
/**
 * Agent heartbeat data
 */
export interface AgentHeartbeat {
    /** Agent ID */
    agentId: AgentId;
    /** Session ID */
    sessionId: SessionId;
    /** Heartbeat timestamp */
    timestamp: Date;
    /** Agent status */
    status: AgentStatus;
    /** Current task */
    currentTask?: TaskId;
    /** Resource usage */
    resourceUsage: Partial<ResourceUsageStats>;
    /** Health metrics */
    health: AgentHealth;
}
/**
 * Agent health metrics
 */
export interface AgentHealth {
    /** Overall health score (0-100) */
    overall: number;
    /** Memory health (0-100) */
    memory: number;
    /** CPU health (0-100) */
    cpu: number;
    /** Network health (0-100) */
    network: number;
    /** Error rate (0-100) */
    errorRate: number;
    /** Last error timestamp */
    lastError?: Date;
}
