/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { EventEmitter } from 'node:events';
/**
 * Enhanced autonomous task management system types
 * Builds on existing TaskInterfaces.ts to provide comprehensive autonomous capabilities
 */
export * from './interfaces/TaskInterfaces.js';
/**
 * Autonomous system configuration
 */
export interface AutonomousSystemConfig {
    /** Maximum concurrent task execution */
    maxConcurrentTasks: number;
    /** Task execution timeout (milliseconds) */
    taskTimeout: number;
    /** Maximum retry attempts for failed tasks */
    maxRetries: number;
    /** Cross-session persistence enabled */
    enablePersistence: boolean;
    /** Real-time monitoring enabled */
    enableMonitoring: boolean;
    /** Automatic task breakdown enabled */
    enableAutonomousBreakdown: boolean;
    /** Self-learning from execution patterns */
    enableLearning: boolean;
    /** Resource allocation strategy */
    resourceStrategy: 'conservative' | 'aggressive' | 'adaptive';
    /** Session management configuration */
    sessionConfig: {
        /** Maximum session duration (milliseconds) */
        maxSessionDuration: number;
        /** Session persistence interval (milliseconds) */
        persistenceInterval: number;
        /** Cross-session task continuity */
        enableContinuity: boolean;
    };
}
/**
 * Autonomous task execution modes
 */
export declare enum AutonomousMode {
    /** Manual approval required for each task */
    MANUAL = "manual",
    /** Semi-autonomous with human oversight */
    SEMI_AUTONOMOUS = "semi_autonomous",
    /** Fully autonomous execution */
    FULLY_AUTONOMOUS = "fully_autonomous",
    /** Learning mode to observe patterns */
    LEARNING = "learning"
}
/**
 * Task complexity levels for autonomous handling
 */
export declare enum TaskComplexity {
    /** Simple, atomic operations */
    SIMPLE = "simple",
    /** Medium complexity requiring multiple steps */
    MEDIUM = "medium",
    /** Complex tasks requiring breakdown */
    COMPLEX = "complex",
    /** High complexity requiring human oversight */
    HIGH = "high",
    /** Critical tasks requiring manual approval */
    CRITICAL = "critical"
}
/**
 * Enhanced task definition for autonomous execution
 */
export interface AutonomousTask extends ITask {
    /** Autonomous execution mode */
    autonomousMode: AutonomousMode;
    /** Task complexity level */
    complexity: TaskComplexity;
    /** Autonomous execution metadata */
    autonomousMetadata: {
        /** AI confidence score (0-1) */
        confidence: number;
        /** Estimated risk level */
        riskLevel: 'low' | 'medium' | 'high' | 'critical';
        /** Required approvals */
        requiredApprovals: string[];
        /** Autonomous execution history */
        executionHistory: AutonomousExecutionRecord[];
        /** Learning insights from previous executions */
        learningInsights: Record<string, unknown>;
    };
    /** Cross-session tracking */
    sessionTracking: {
        /** Session where task was created */
        originSession: string;
        /** Sessions where task was active */
        activeSessions: string[];
        /** Current session continuation state */
        continuationState?: TaskContinuationState;
    };
    /** Validation and quality assurance */
    validation: {
        /** Pre-execution validation criteria */
        preExecution: ValidationCriteria[];
        /** Post-execution validation criteria */
        postExecution: ValidationCriteria[];
        /** Success criteria */
        successCriteria: SuccessCriteria[];
    };
}
/**
 * Task continuation state for cross-session persistence
 */
export interface TaskContinuationState {
    /** Last execution checkpoint */
    lastCheckpoint: Date;
    /** Saved execution state */
    executionState: Record<string, unknown>;
    /** Progress percentage (0-100) */
    progress: number;
    /** Next steps to continue execution */
    nextSteps: string[];
    /** Resources reserved for continuation */
    reservedResources: ResourceReservation[];
}
/**
 * Resource reservation for cross-session continuity
 */
export interface ResourceReservation {
    /** Resource type */
    resourceType: string;
    /** Reserved amount */
    amount: number;
    /** Reservation expiry */
    expiresAt: Date;
    /** Reservation priority */
    priority: number;
}
/**
 * Autonomous execution record for learning
 */
export interface AutonomousExecutionRecord {
    /** Execution timestamp */
    timestamp: Date;
    /** Execution duration */
    duration: number;
    /** Success/failure status */
    successful: boolean;
    /** Execution context */
    context: TaskContext;
    /** Decisions made during execution */
    decisions: ExecutionDecision[];
    /** Lessons learned */
    lessons: LessonLearned[];
    /** Performance metrics */
    performanceMetrics: PerformanceMetrics;
}
/**
 * Execution decision tracking for autonomous learning
 */
export interface ExecutionDecision {
    /** Decision point identifier */
    decisionId: string;
    /** Decision description */
    description: string;
    /** Available options */
    options: string[];
    /** Chosen option */
    chosenOption: string;
    /** Decision confidence */
    confidence: number;
    /** Decision outcome */
    outcome: 'success' | 'failure' | 'partial';
    /** Factors influencing decision */
    factors: Record<string, unknown>;
}
/**
 * Learning insights from autonomous execution
 */
export interface LessonLearned {
    /** Lesson category */
    category: 'performance' | 'quality' | 'efficiency' | 'risk' | 'user_preference';
    /** Lesson description */
    description: string;
    /** Confidence in lesson */
    confidence: number;
    /** Applicable contexts */
    applicableContexts: string[];
    /** Success rate when applied */
    successRate: number;
    /** Times this lesson was applied */
    applicationCount: number;
}
/**
 * Performance metrics for task execution
 */
export interface PerformanceMetrics {
    /** Execution time (milliseconds) */
    executionTime: number;
    /** Memory usage (bytes) */
    memoryUsage: number;
    /** CPU usage (percentage) */
    cpuUsage: number;
    /** Network requests made */
    networkRequests: number;
    /** Files modified */
    filesModified: number;
    /** Quality score (0-100) */
    qualityScore: number;
    /** User satisfaction score (0-100) */
    userSatisfaction?: number;
}
/**
 * Validation criteria for autonomous execution
 */
export interface ValidationCriteria {
    /** Validation rule identifier */
    id: string;
    /** Validation description */
    description: string;
    /** Validation type */
    type: 'syntax' | 'semantic' | 'performance' | 'security' | 'quality' | 'business';
    /** Validation function */
    validator: (context: TaskContext, result?: TaskResult) => Promise<ValidationResult>;
    /** Criticality level */
    criticality: 'low' | 'medium' | 'high' | 'critical';
    /** Auto-fix available */
    autoFixAvailable: boolean;
}
/**
 * Validation result
 */
export interface ValidationResult {
    /** Whether validation passed */
    passed: boolean;
    /** Validation message */
    message: string;
    /** Severity level */
    severity: 'info' | 'warning' | 'error' | 'critical';
    /** Suggested fixes */
    suggestedFixes?: string[];
    /** Auto-fix actions */
    autoFixActions?: AutoFixAction[];
}
/**
 * Auto-fix action for validation failures
 */
export interface AutoFixAction {
    /** Action identifier */
    id: string;
    /** Action description */
    description: string;
    /** Action implementation */
    action: (context: TaskContext) => Promise<void>;
    /** Risk level of applying fix */
    riskLevel: 'low' | 'medium' | 'high';
    /** Confidence in fix */
    confidence: number;
}
/**
 * Success criteria for task completion
 */
export interface SuccessCriteria {
    /** Criteria identifier */
    id: string;
    /** Criteria description */
    description: string;
    /** Success metric */
    metric: string;
    /** Expected value */
    expectedValue: unknown;
    /** Comparison operator */
    operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'regex_match';
    /** Weight in overall success calculation */
    weight: number;
    /** Measurement function */
    measure: (result: TaskResult) => Promise<unknown>;
}
/**
 * Enhanced autonomous task queue interface
 */
export interface IAutonomousTaskQueue extends ITaskQueue {
    /** Autonomous system configuration */
    readonly config: AutonomousSystemConfig;
    /** Current autonomous mode */
    readonly autonomousMode: AutonomousMode;
    /** Learning system interface */
    readonly learningSystem: ILearningSystem;
    /**
     * Add autonomous task with intelligent scheduling
     */
    enqueueAutonomous(task: AutonomousTask): Promise<void>;
    /**
     * Get next task based on autonomous scheduling
     */
    dequeueAutonomous(): Promise<AutonomousTask | null>;
    /**
     * Get tasks filtered by autonomous criteria
     */
    getAutonomousTasks(filter?: AutonomousTaskFilter): Promise<AutonomousTask[]>;
    /**
     * Update autonomous mode
     */
    setAutonomousMode(mode: AutonomousMode): Promise<void>;
    /**
     * Get queue intelligence insights
     */
    getIntelligenceInsights(): Promise<QueueIntelligenceInsights>;
}
/**
 * Autonomous task filter
 */
export interface AutonomousTaskFilter extends TaskFilter {
    /** Filter by autonomous mode */
    autonomousMode?: AutonomousMode[];
    /** Filter by complexity */
    complexity?: TaskComplexity[];
    /** Filter by confidence level */
    minConfidence?: number;
    maxConfidence?: number;
    /** Filter by risk level */
    riskLevel?: string[];
    /** Filter by session */
    sessionId?: string;
}
/**
 * Queue intelligence insights
 */
export interface QueueIntelligenceInsights {
    /** Queue optimization suggestions */
    optimizationSuggestions: string[];
    /** Predicted performance improvements */
    performanceProjections: Record<string, number>;
    /** Resource utilization efficiency */
    resourceEfficiency: number;
    /** Learning system health */
    learningSystemHealth: LearningSystemHealth;
    /** Autonomous execution success rate */
    autonomousSuccessRate: number;
}
/**
 * Learning system health metrics
 */
export interface LearningSystemHealth {
    /** Overall health score (0-100) */
    healthScore: number;
    /** Data quality score */
    dataQuality: number;
    /** Model confidence */
    modelConfidence: number;
    /** Learning velocity */
    learningVelocity: number;
    /** Prediction accuracy */
    predictionAccuracy: number;
}
/**
 * Learning system interface for autonomous improvement
 */
export interface ILearningSystem extends EventEmitter {
    /** Whether learning is enabled */
    readonly isEnabled: boolean;
    /** Learning model version */
    readonly modelVersion: string;
    /**
     * Learn from task execution
     */
    learnFromExecution(execution: AutonomousExecutionRecord): Promise<void>;
    /**
     * Get task execution predictions
     */
    predictExecution(task: AutonomousTask, context: TaskContext): Promise<ExecutionPrediction>;
    /**
     * Get optimization suggestions
     */
    suggestOptimizations(tasks: AutonomousTask[]): Promise<OptimizationSuggestion[]>;
    /**
     * Get learning insights
     */
    getInsights(): Promise<LearningInsights>;
    /**
     * Export learned knowledge
     */
    exportKnowledge(): Promise<LearningKnowledgeBase>;
    /**
     * Import learned knowledge
     */
    importKnowledge(knowledgeBase: LearningKnowledgeBase): Promise<void>;
}
/**
 * Task execution prediction
 */
export interface ExecutionPrediction {
    /** Predicted success probability */
    successProbability: number;
    /** Predicted execution time */
    estimatedDuration: number;
    /** Predicted resource requirements */
    resourceRequirements: ResourceRequirement[];
    /** Predicted risk factors */
    riskFactors: RiskFactor[];
    /** Confidence in predictions */
    confidence: number;
    /** Recommended execution strategy */
    recommendedStrategy: ExecutionStrategy;
}
/**
 * Resource requirement prediction
 */
export interface ResourceRequirement {
    /** Resource type */
    resourceType: string;
    /** Estimated amount needed */
    estimatedAmount: number;
    /** Confidence in estimate */
    confidence: number;
    /** Usage pattern */
    usagePattern: 'constant' | 'burst' | 'gradual' | 'variable';
}
/**
 * Risk factor identification
 */
export interface RiskFactor {
    /** Risk identifier */
    id: string;
    /** Risk description */
    description: string;
    /** Probability of occurrence */
    probability: number;
    /** Impact severity */
    impact: 'low' | 'medium' | 'high' | 'critical';
    /** Mitigation strategies */
    mitigationStrategies: string[];
}
/**
 * Execution strategy recommendation
 */
export interface ExecutionStrategy {
    /** Strategy identifier */
    id: string;
    /** Strategy description */
    description: string;
    /** Execution order recommendations */
    executionOrder: string[];
    /** Resource allocation strategy */
    resourceAllocation: ResourceAllocationStrategy;
    /** Monitoring requirements */
    monitoringRequirements: MonitoringRequirement[];
    /** Fallback strategies */
    fallbackStrategies: string[];
}
/**
 * Resource allocation strategy
 */
export interface ResourceAllocationStrategy {
    /** Allocation approach */
    approach: 'conservative' | 'optimal' | 'aggressive';
    /** Priority factors */
    priorityFactors: string[];
    /** Resource pools to use */
    resourcePools: string[];
    /** Scaling parameters */
    scalingParameters: Record<string, number>;
}
/**
 * Monitoring requirements for execution
 */
export interface MonitoringRequirement {
    /** Metric to monitor */
    metric: string;
    /** Monitoring frequency */
    frequency: number;
    /** Alert thresholds */
    thresholds: Record<string, number>;
    /** Actions on threshold breach */
    actions: MonitoringAction[];
}
/**
 * Monitoring action configuration
 */
export interface MonitoringAction {
    /** Action type */
    type: 'alert' | 'throttle' | 'pause' | 'abort' | 'scale';
    /** Action parameters */
    parameters: Record<string, unknown>;
    /** Action priority */
    priority: number;
}
/**
 * Optimization suggestion from learning system
 */
export interface OptimizationSuggestion {
    /** Optimization category */
    category: 'performance' | 'resource' | 'quality' | 'efficiency' | 'cost';
    /** Suggestion description */
    description: string;
    /** Expected improvement */
    expectedImprovement: number;
    /** Implementation difficulty */
    difficulty: 'low' | 'medium' | 'high';
    /** Confidence in suggestion */
    confidence: number;
    /** Implementation steps */
    implementationSteps: string[];
}
/**
 * Learning insights from system operation
 */
export interface LearningInsights {
    /** Most successful execution patterns */
    successPatterns: ExecutionPattern[];
    /** Common failure modes */
    failureModes: FailureMode[];
    /** Resource optimization opportunities */
    resourceOptimizations: ResourceOptimization[];
    /** Quality improvement suggestions */
    qualityImprovements: QualityImprovement[];
    /** User behavior patterns */
    userPatterns: UserPattern[];
}
/**
 * Execution pattern identification
 */
export interface ExecutionPattern {
    /** Pattern identifier */
    id: string;
    /** Pattern description */
    description: string;
    /** Pattern frequency */
    frequency: number;
    /** Success rate when pattern is followed */
    successRate: number;
    /** Context where pattern applies */
    applicableContext: string[];
    /** Pattern parameters */
    parameters: Record<string, unknown>;
}
/**
 * Failure mode analysis
 */
export interface FailureMode {
    /** Failure mode identifier */
    id: string;
    /** Failure description */
    description: string;
    /** Frequency of occurrence */
    frequency: number;
    /** Common causes */
    causes: string[];
    /** Prevention strategies */
    preventionStrategies: string[];
    /** Recovery strategies */
    recoveryStrategies: string[];
}
/**
 * Resource optimization opportunity
 */
export interface ResourceOptimization {
    /** Resource type */
    resourceType: string;
    /** Current utilization */
    currentUtilization: number;
    /** Optimal utilization */
    optimalUtilization: number;
    /** Potential savings */
    potentialSavings: number;
    /** Optimization strategy */
    strategy: string;
}
/**
 * Quality improvement suggestion
 */
export interface QualityImprovement {
    /** Quality aspect */
    aspect: 'correctness' | 'performance' | 'maintainability' | 'security' | 'usability';
    /** Current quality score */
    currentScore: number;
    /** Target quality score */
    targetScore: number;
    /** Improvement strategy */
    strategy: string;
    /** Expected effort */
    effort: 'low' | 'medium' | 'high';
}
/**
 * User behavior pattern analysis
 */
export interface UserPattern {
    /** Pattern type */
    type: 'workflow' | 'preference' | 'timing' | 'complexity' | 'domain';
    /** Pattern description */
    description: string;
    /** Pattern strength */
    strength: number;
    /** Pattern implications */
    implications: string[];
    /** Personalization opportunities */
    personalizationOpportunities: string[];
}
/**
 * Learning knowledge base for export/import
 */
export interface LearningKnowledgeBase {
    /** Knowledge base version */
    version: string;
    /** Creation timestamp */
    createdAt: Date;
    /** Execution patterns */
    patterns: ExecutionPattern[];
    /** Failure modes */
    failureModes: FailureMode[];
    /** Optimization insights */
    optimizations: OptimizationSuggestion[];
    /** Quality insights */
    qualityInsights: QualityImprovement[];
    /** User insights */
    userInsights: UserPattern[];
    /** Model parameters */
    modelParameters: Record<string, unknown>;
}
/**
 * Enhanced autonomous task execution engine
 */
export interface IAutonomousTaskExecutionEngine extends ITaskExecutionEngine {
    /** Autonomous system configuration */
    readonly config: AutonomousSystemConfig;
    /** Learning system integration */
    readonly learningSystem: ILearningSystem;
    /** Cross-session state manager */
    readonly sessionManager: ISessionStateManager;
    /**
     * Execute task with autonomous decision making
     */
    executeAutonomousTask(task: AutonomousTask): Promise<AutonomousTaskResult>;
    /**
     * Handle cross-session task continuation
     */
    continueTask(taskId: string): Promise<AutonomousTaskResult>;
    /**
     * Get autonomous execution insights
     */
    getAutonomousInsights(): Promise<AutonomousExecutionInsights>;
    /**
     * Configure autonomous behavior
     */
    configureAutonomousBehavior(config: Partial<AutonomousSystemConfig>): Promise<void>;
}
/**
 * Enhanced autonomous task result
 */
export interface AutonomousTaskResult extends TaskResult {
    /** Autonomous execution metadata */
    autonomousMetadata: {
        /** Decisions made during execution */
        decisions: ExecutionDecision[];
        /** Learning outcomes */
        learning: LessonLearned[];
        /** Confidence in result */
        confidence: number;
        /** Quality score */
        qualityScore: number;
        /** Autonomous mode used */
        modeUsed: AutonomousMode;
    };
    /** Cross-session tracking */
    sessionTracking: {
        /** Sessions involved in execution */
        sessionsInvolved: string[];
        /** State checkpoints */
        checkpoints: TaskContinuationState[];
        /** Continuation successful */
        continuationSuccessful: boolean;
    };
    /** Validation results */
    validationResults: {
        /** Pre-execution validation */
        preExecution: ValidationResult[];
        /** Post-execution validation */
        postExecution: ValidationResult[];
        /** Success criteria evaluation */
        successCriteria: SuccessCriteriaResult[];
    };
}
/**
 * Success criteria evaluation result
 */
export interface SuccessCriteriaResult {
    /** Criteria identifier */
    criteriaId: string;
    /** Whether criteria was met */
    met: boolean;
    /** Measured value */
    measuredValue: unknown;
    /** Expected value */
    expectedValue: unknown;
    /** Score contribution */
    scoreContribution: number;
}
/**
 * Autonomous execution insights
 */
export interface AutonomousExecutionInsights {
    /** Overall autonomous success rate */
    successRate: number;
    /** Average execution time improvement */
    timeImprovement: number;
    /** Resource utilization efficiency */
    resourceEfficiency: number;
    /** Quality improvement trends */
    qualityTrends: QualityTrend[];
    /** Learning velocity */
    learningVelocity: number;
    /** Most valuable optimizations */
    topOptimizations: OptimizationSuggestion[];
}
/**
 * Quality trend analysis
 */
export interface QualityTrend {
    /** Quality metric */
    metric: string;
    /** Trend direction */
    direction: 'improving' | 'declining' | 'stable';
    /** Rate of change */
    changeRate: number;
    /** Confidence in trend */
    confidence: number;
}
/**
 * Session state manager for cross-session continuity
 */
export interface ISessionStateManager extends EventEmitter {
    /** Current session identifier */
    readonly currentSessionId: string;
    /** Active sessions */
    readonly activeSessions: string[];
    /**
     * Save task state for cross-session persistence
     */
    saveTaskState(taskId: string, state: TaskContinuationState): Promise<void>;
    /**
     * Load task state from previous session
     */
    loadTaskState(taskId: string): Promise<TaskContinuationState | null>;
    /**
     * Transfer tasks between sessions
     */
    transferTasks(fromSessionId: string, toSessionId: string, taskIds: string[]): Promise<void>;
    /**
     * Get session analytics
     */
    getSessionAnalytics(sessionId?: string): Promise<SessionAnalytics>;
    /**
     * Cleanup expired sessions
     */
    cleanupExpiredSessions(): Promise<number>;
}
/**
 * Session analytics for monitoring
 */
export interface SessionAnalytics {
    /** Session identifier */
    sessionId: string;
    /** Session duration */
    duration: number;
    /** Tasks processed */
    tasksProcessed: number;
    /** Success rate */
    successRate: number;
    /** Resource utilization */
    resourceUtilization: Record<string, number>;
    /** Quality metrics */
    qualityMetrics: Record<string, number>;
    /** Continuation success rate */
    continuationSuccessRate: number;
}
/**
 * Master autonomous system interface
 */
export interface IAutonomousTaskManagementSystem extends EventEmitter {
    /** System configuration */
    readonly config: AutonomousSystemConfig;
    /** Task queue */
    readonly taskQueue: IAutonomousTaskQueue;
    /** Execution engine */
    readonly executionEngine: IAutonomousTaskExecutionEngine;
    /** Learning system */
    readonly learningSystem: ILearningSystem;
    /** Session manager */
    readonly sessionManager: ISessionStateManager;
    /** Status monitor */
    readonly statusMonitor: ITaskStatusMonitor;
    /** Persistence layer */
    readonly persistence: ITaskPersistence;
    /**
     * Initialize the autonomous system
     */
    initialize(): Promise<void>;
    /**
     * Start autonomous operation
     */
    start(): Promise<void>;
    /**
     * Stop autonomous operation
     */
    stop(graceful?: boolean): Promise<void>;
    /**
     * Submit task for autonomous execution
     */
    submitTask(task: AutonomousTask): Promise<string>;
    /**
     * Get system status and health
     */
    getSystemStatus(): Promise<SystemStatus>;
    /**
     * Configure system behavior
     */
    configure(config: Partial<AutonomousSystemConfig>): Promise<void>;
    /**
     * Get comprehensive system insights
     */
    getSystemInsights(): Promise<SystemInsights>;
}
/**
 * System status information
 */
export interface SystemStatus {
    /** System health score (0-100) */
    healthScore: number;
    /** System state */
    state: 'initializing' | 'running' | 'stopping' | 'stopped' | 'error';
    /** Active tasks count */
    activeTasks: number;
    /** Queue size */
    queueSize: number;
    /** Resource utilization */
    resourceUtilization: Record<string, number>;
    /** Performance metrics */
    performanceMetrics: SystemPerformanceMetrics;
    /** Error status */
    errors: SystemError[];
}
/**
 * System performance metrics
 */
export interface SystemPerformanceMetrics {
    /** Tasks per second throughput */
    throughput: number;
    /** Average task execution time */
    averageExecutionTime: number;
    /** System uptime */
    uptime: number;
    /** Memory usage */
    memoryUsage: number;
    /** CPU usage */
    cpuUsage: number;
    /** Success rate */
    successRate: number;
}
/**
 * System error information
 */
export interface SystemError {
    /** Error identifier */
    id: string;
    /** Error message */
    message: string;
    /** Error severity */
    severity: 'low' | 'medium' | 'high' | 'critical';
    /** Error timestamp */
    timestamp: Date;
    /** Error context */
    context: Record<string, unknown>;
    /** Resolution status */
    resolved: boolean;
}
/**
 * Comprehensive system insights
 */
export interface SystemInsights {
    /** Queue insights */
    queueInsights: QueueIntelligenceInsights;
    /** Execution insights */
    executionInsights: AutonomousExecutionInsights;
    /** Learning insights */
    learningInsights: LearningInsights;
    /** Session insights */
    sessionInsights: SessionInsights;
    /** Performance insights */
    performanceInsights: PerformanceInsights;
    /** Optimization recommendations */
    recommendations: SystemRecommendation[];
}
/**
 * Session insights across all sessions
 */
export interface SessionInsights {
    /** Average session duration */
    averageSessionDuration: number;
    /** Cross-session task success rate */
    crossSessionSuccessRate: number;
    /** Most productive session patterns */
    productivePatterns: SessionPattern[];
    /** Session resource efficiency */
    resourceEfficiency: number;
}
/**
 * Session pattern identification
 */
export interface SessionPattern {
    /** Pattern identifier */
    id: string;
    /** Pattern description */
    description: string;
    /** Pattern frequency */
    frequency: number;
    /** Success rate */
    successRate: number;
    /** Average duration */
    averageDuration: number;
}
/**
 * Performance insights for optimization
 */
export interface PerformanceInsights {
    /** Bottleneck identification */
    bottlenecks: PerformanceBottleneck[];
    /** Scaling recommendations */
    scalingRecommendations: ScalingRecommendation[];
    /** Performance trends */
    trends: PerformanceTrend[];
    /** Optimization opportunities */
    optimizationOpportunities: PerformanceOptimization[];
}
/**
 * Performance bottleneck identification
 */
export interface PerformanceBottleneck {
    /** Component affected */
    component: string;
    /** Bottleneck type */
    type: 'cpu' | 'memory' | 'io' | 'network' | 'concurrency';
    /** Impact severity */
    severity: number;
    /** Recommended solutions */
    solutions: string[];
}
/**
 * Scaling recommendation
 */
export interface ScalingRecommendation {
    /** Resource to scale */
    resource: string;
    /** Scaling direction */
    direction: 'up' | 'down' | 'out' | 'in';
    /** Scaling factor */
    factor: number;
    /** Expected improvement */
    expectedImprovement: number;
}
/**
 * Performance trend analysis
 */
export interface PerformanceTrend {
    /** Metric name */
    metric: string;
    /** Trend direction */
    direction: 'improving' | 'declining' | 'stable';
    /** Trend strength */
    strength: number;
    /** Projected future values */
    projections: Record<string, number>;
}
/**
 * Performance optimization opportunity
 */
export interface PerformanceOptimization {
    /** Optimization area */
    area: string;
    /** Potential improvement */
    potentialImprovement: number;
    /** Implementation effort */
    effort: 'low' | 'medium' | 'high';
    /** Implementation strategy */
    strategy: string;
}
/**
 * System recommendation
 */
export interface SystemRecommendation {
    /** Recommendation category */
    category: 'performance' | 'reliability' | 'efficiency' | 'quality' | 'user_experience';
    /** Recommendation title */
    title: string;
    /** Detailed description */
    description: string;
    /** Priority level */
    priority: 'low' | 'medium' | 'high' | 'critical';
    /** Expected benefits */
    benefits: string[];
    /** Implementation steps */
    implementationSteps: string[];
    /** Estimated effort */
    effort: number;
    /** Expected ROI */
    roi: number;
}
/**
 * Event types for autonomous system monitoring
 */
export declare enum AutonomousSystemEvent {
    SYSTEM_INITIALIZED = "system_initialized",
    SYSTEM_STARTED = "system_started",
    SYSTEM_STOPPED = "system_stopped",
    TASK_SUBMITTED = "task_submitted",
    TASK_STARTED = "task_started",
    TASK_COMPLETED = "task_completed",
    TASK_FAILED = "task_failed",
    LEARNING_INSIGHT = "learning_insight",
    OPTIMIZATION_FOUND = "optimization_found",
    SYSTEM_ERROR = "system_error",
    SYSTEM_WARNING = "system_warning",
    HEALTH_CHECK = "health_check",
    PERFORMANCE_ALERT = "performance_alert",
    SESSION_STARTED = "session_started",
    SESSION_ENDED = "session_ended",
    CROSS_SESSION_CONTINUATION = "cross_session_continuation"
}
