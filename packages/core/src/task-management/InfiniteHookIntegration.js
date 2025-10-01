/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { TaskType, TaskPriority } from './types.js';
import { spawn } from 'node:child_process';
/**
 * Integration with infinite-continue-stop-hook system
 */
export class InfiniteHookIntegration {
    config;
    taskEngine;
    monitoring;
    hookConfig;
    taskManagerApiPath;
    isIntegrationActive = false;
    progressReportingTimer;
    lastProgressReport;
    constructor(config, taskEngine, monitoring, hookConfig) {
        this.config = config;
        this.taskEngine = taskEngine;
        this.monitoring = monitoring;
        // Default hook configuration
        this.hookConfig = {
            taskManagerApiPath: '/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js',
            agentId: 'TASK_EXECUTION_ENGINE',
            capabilities: [
                'implementation',
                'testing',
                'validation',
                'documentation',
                'analysis',
            ],
            autoApprovalEnabled: true,
            maxConcurrentTasks: 5,
            progressReportingIntervalMs: 60000, // 1 minute
            ...hookConfig,
        };
        this.taskManagerApiPath = this.hookConfig.taskManagerApiPath;
    }
    /**
     * Initializes integration with the hook system
     */
    async initialize() {
        try {
            console.log('Initializing TaskExecutionEngine integration with infinite-continue-stop-hook...');
            // Initialize or reinitialize the agent
            await this.initializeAgent();
            // Register agent capabilities
            await this.registerCapabilities();
            // Start periodic task checking
            this.startPeriodicTaskChecking();
            // Start progress reporting
            this.startProgressReporting();
            this.isIntegrationActive = true;
            console.log('TaskExecutionEngine successfully integrated with infinite-continue-stop-hook system');
        }
        catch (error) {
            console.error('Failed to initialize hook integration:', error);
            throw error;
        }
    }
    /**
     * Initializes the agent with the task manager API
     */
    async initializeAgent() {
        try {
            const result = await this.executeTaskManagerCommand('reinitialize', this.hookConfig.agentId);
            if (!result.success) {
                throw new Error(`Agent initialization failed: ${result.error}`);
            }
            console.log(`Agent ${this.hookConfig.agentId} initialized successfully`);
        }
        catch (error) {
            console.error('Agent initialization error:', error);
            throw error;
        }
    }
    /**
     * Registers agent capabilities with the task manager
     */
    async registerCapabilities() {
        try {
            const result = await this.executeTaskManagerCommand('registerAgentCapabilities', this.hookConfig.agentId, JSON.stringify(this.hookConfig.capabilities));
            if (!result.success) {
                console.warn(`Failed to register capabilities: ${result.error}`);
                // Non-fatal, continue with integration
            }
            else {
                console.log(`Registered capabilities: ${this.hookConfig.capabilities.join(', ')}`);
            }
        }
        catch (error) {
            console.warn('Capability registration failed:', error);
            // Non-fatal, continue with integration
        }
    }
    /**
     * Starts periodic checking for new tasks from approved features
     */
    startPeriodicTaskChecking() {
        // Check for new tasks every 30 seconds
        setInterval(async () => {
            if (!this.isIntegrationActive)
                return;
            try {
                await this.checkAndProcessNewTasks();
            }
            catch (error) {
                console.error('Error in periodic task checking:', error);
            }
        }, 30000);
    }
    /**
     * Checks for and processes new tasks from approved features
     */
    async checkAndProcessNewTasks() {
        try {
            // Get approved features that don't have tasks yet
            const approvedFeaturesResult = await this.executeTaskManagerCommand('list-features', JSON.stringify({ status: 'approved' }));
            if (!approvedFeaturesResult.success) {
                console.error('Failed to fetch approved features:', approvedFeaturesResult.error);
                return;
            }
            const approvedFeatures = approvedFeaturesResult.features || [];
            // Get existing task queue
            const taskQueueResult = await this.executeTaskManagerCommand('getTaskQueue');
            const existingTasks = taskQueueResult.success
                ? taskQueueResult.tasks || []
                : [];
            // Find features without tasks
            const featuresWithoutTasks = approvedFeatures.filter((feature) => !existingTasks.some((task) => task.feature_id === feature.id));
            if (featuresWithoutTasks.length === 0) {
                return; // No new features to process
            }
            console.log(`Found ${featuresWithoutTasks.length} approved features without tasks`);
            // Create tasks for approved features
            for (const feature of featuresWithoutTasks) {
                await this.createTaskFromFeature(feature);
            }
            // Process queued tasks with our execution engine
            await this.processQueuedTasks();
        }
        catch (error) {
            console.error('Error checking for new tasks:', error);
        }
    }
    /**
     * Creates a task from an approved feature
     */
    async createTaskFromFeature(feature) {
        try {
            // Map feature to task parameters
            const taskType = this.mapFeatureCategoryToTaskType(feature.category);
            const taskPriority = this.mapFeaturePriorityToTaskPriority(feature);
            // Create task in our execution engine
            const taskId = await this.taskEngine.queueTask(feature.title, feature.description, {
                type: taskType,
                priority: taskPriority,
                context: {
                    featureId: feature.id,
                    category: feature.category,
                    businessValue: feature.business_value,
                },
                expectedOutputs: {
                    implementation_status: 'Status of implementation completion',
                    validation_results: 'Results of validation and testing',
                    documentation_updates: 'Documentation changes made',
                },
            });
            // Also create task in the hook system for tracking
            const hookTaskResult = await this.executeTaskManagerCommand('createTaskFromFeature', feature.id, JSON.stringify({
                title: feature.title,
                description: feature.description,
                type: taskType,
                priority: taskPriority,
                metadata: {
                    execution_engine_task_id: taskId,
                    created_by_engine: true,
                },
            }));
            if (hookTaskResult.success) {
                console.log(`Created task for feature: ${feature.title}`);
            }
            else {
                console.warn(`Failed to create hook task for feature ${feature.id}: ${hookTaskResult.error}`);
            }
        }
        catch (error) {
            console.error(`Error creating task from feature ${feature.id}:`, error);
        }
    }
    /**
     * Processes queued tasks by assigning them to our execution engine
     */
    async processQueuedTasks() {
        try {
            // Get queued tasks from hook system
            const queueResult = await this.executeTaskManagerCommand('getTaskQueue', JSON.stringify({ status: 'queued' }));
            if (!queueResult.success || !queueResult.tasks) {
                return;
            }
            const queuedTasks = queueResult.tasks;
            // Filter tasks that can be handled by our capabilities
            const compatibleTasks = queuedTasks.filter((task) => this.canHandleTask(task));
            // Assign compatible tasks to our agent
            for (const task of compatibleTasks.slice(0, this.hookConfig.maxConcurrentTasks)) {
                await this.assignTaskToEngine(task);
            }
        }
        catch (error) {
            console.error('Error processing queued tasks:', error);
        }
    }
    /**
     * Checks if we can handle a task based on capabilities
     */
    canHandleTask(task) {
        const requiredCapabilities = task.required_capabilities || [];
        if (requiredCapabilities.length === 0)
            return true;
        return requiredCapabilities.some((cap) => this.hookConfig.capabilities.includes(cap) ||
            this.hookConfig.capabilities.includes('general'));
    }
    /**
     * Assigns a task to our execution engine
     */
    async assignTaskToEngine(hookTask) {
        try {
            // Assign task in hook system
            const assignResult = await this.executeTaskManagerCommand('assignTask', hookTask.id, this.hookConfig.agentId, JSON.stringify({
                reason: 'automated_assignment',
                metadata: {
                    assigned_by_engine: true,
                    assignment_time: new Date().toISOString(),
                },
            }));
            if (!assignResult.success) {
                console.warn(`Failed to assign task ${hookTask.id}: ${assignResult.error}`);
                return;
            }
            // Create corresponding task in our execution engine if it doesn't exist
            if (!hookTask.metadata?.execution_engine_task_id) {
                const engineTaskId = await this.taskEngine.queueTask(hookTask.title, hookTask.description, {
                    type: hookTask.type,
                    priority: hookTask.priority,
                    context: {
                        hookTaskId: hookTask.id,
                        ...hookTask.metadata,
                    },
                    expectedOutputs: {
                        task_completion: 'Task completion status and results',
                    },
                });
                console.log(`Assigned and queued task: ${hookTask.title} (Engine ID: ${engineTaskId})`);
            }
        }
        catch (error) {
            console.error(`Error assigning task ${hookTask.id}:`, error);
        }
    }
    /**
     * Starts periodic progress reporting to the hook system
     */
    startProgressReporting() {
        this.progressReportingTimer = setInterval(async () => {
            if (!this.isIntegrationActive)
                return;
            try {
                await this.reportProgress();
            }
            catch (error) {
                console.error('Error in progress reporting:', error);
            }
        }, this.hookConfig.progressReportingIntervalMs);
    }
    /**
     * Reports progress to the hook system
     */
    async reportProgress() {
        try {
            // Get current execution statistics
            const stats = this.taskEngine.getExecutionStats();
            const allTasks = this.taskEngine.getAllTasks();
            // Report progress for active tasks
            for (const task of allTasks.filter((t) => t.status === 'in_progress')) {
                const hookTaskId = task.context?.hookTaskId;
                if (!hookTaskId)
                    continue;
                const progressUpdate = {
                    status: this.mapEngineStatusToHookStatus(task.status),
                    progress_percentage: task.progress,
                    notes: `Task execution in progress. Retry count: ${task.retryCount}`,
                    updated_by: this.hookConfig.agentId,
                    metadata: {
                        engine_task_id: task.id,
                        last_updated: new Date().toISOString(),
                        execution_stats: {
                            duration_ms: task.startedAt
                                ? Date.now() - task.startedAt.getTime()
                                : 0,
                            retry_count: task.retryCount,
                        },
                    },
                };
                await this.executeTaskManagerCommand('updateTaskProgress', hookTaskId, JSON.stringify(progressUpdate));
            }
            // Report completed tasks
            for (const task of allTasks.filter((t) => t.status === 'completed' && !task.context?.reported)) {
                const hookTaskId = task.context?.hookTaskId;
                if (!hookTaskId)
                    continue;
                const completionUpdate = {
                    status: 'completed',
                    progress_percentage: 100,
                    notes: `Task completed successfully by TaskExecutionEngine. Results: ${JSON.stringify(task.outputs || {})}`,
                    updated_by: this.hookConfig.agentId,
                    metadata: {
                        engine_task_id: task.id,
                        completed_at: task.completedAt?.toISOString(),
                        execution_time_ms: task.metrics?.durationMs || 0,
                        outputs: task.outputs,
                    },
                };
                const updateResult = await this.executeTaskManagerCommand('updateTaskProgress', hookTaskId, JSON.stringify(completionUpdate));
                if (updateResult.success) {
                    // Mark as reported to avoid duplicate reporting
                    task.context = { ...task.context, reported: true };
                }
            }
            this.lastProgressReport = new Date();
        }
        catch (error) {
            console.error('Error reporting progress:', error);
        }
    }
    /**
     * Executes a command against the task manager API
     */
    async executeTaskManagerCommand(command, ...args) {
        return new Promise((resolve, reject) => {
            const fullArgs = [this.taskManagerApiPath, command, ...args];
            const child = spawn('timeout', ['10s', 'node', ...fullArgs], {
                stdio: ['inherit', 'pipe', 'pipe'],
            });
            let stdout = '';
            let stderr = '';
            child.stdout?.on('data', (data) => {
                stdout += data.toString();
            });
            child.stderr?.on('data', (data) => {
                stderr += data.toString();
            });
            child.on('close', (code) => {
                if (code === 0) {
                    try {
                        const result = JSON.parse(stdout);
                        resolve(result);
                    }
                    catch (error) {
                        resolve({ success: true, raw_output: stdout });
                    }
                }
                else {
                    reject(new Error(`Command failed with code ${code}: ${stderr || stdout}`));
                }
            });
            child.on('error', (error) => {
                reject(error);
            });
        });
    }
    /**
     * Maps feature category to task type
     */
    mapFeatureCategoryToTaskType(category) {
        switch (category) {
            case 'bug-fix':
                return TaskType.IMPLEMENTATION;
            case 'security':
                return TaskType.SECURITY;
            case 'performance':
                return TaskType.PERFORMANCE;
            case 'documentation':
                return TaskType.DOCUMENTATION;
            case 'new-feature':
                return TaskType.IMPLEMENTATION;
            case 'enhancement':
                return TaskType.IMPLEMENTATION;
            default:
                return TaskType.IMPLEMENTATION;
        }
    }
    /**
     * Maps feature priority indicators to task priority
     */
    mapFeaturePriorityToTaskPriority(feature) {
        if (feature.category === 'security')
            return TaskPriority.CRITICAL;
        if (feature.category === 'bug-fix')
            return TaskPriority.HIGH;
        const businessValue = feature.business_value?.toLowerCase() || '';
        if (businessValue.includes('critical'))
            return TaskPriority.CRITICAL;
        if (businessValue.includes('essential') ||
            businessValue.includes('important'))
            return TaskPriority.HIGH;
        return TaskPriority.NORMAL;
    }
    /**
     * Maps engine task status to hook system status
     */
    mapEngineStatusToHookStatus(status) {
        switch (status) {
            case 'queued':
                return 'queued';
            case 'assigned':
                return 'assigned';
            case 'in_progress':
                return 'in_progress';
            case 'completed':
                return 'completed';
            case 'failed':
                return 'failed';
            case 'cancelled':
                return 'cancelled';
            case 'blocked':
                return 'blocked';
            default:
                return 'queued';
        }
    }
    /**
     * Authorizes stop when all tasks are complete
     */
    async checkAndAuthorizeStop() {
        try {
            const stats = this.taskEngine.getExecutionStats();
            // Check if all critical conditions are met
            const allTasksComplete = stats.inProgress === 0 && stats.total > 0;
            const highSuccessRate = stats.successRate >= 80;
            const noFailures = stats.failed === 0;
            if (allTasksComplete && highSuccessRate && noFailures) {
                console.log('All tasks completed successfully. Authorizing stop...');
                const stopReason = `TaskExecutionEngine completed all tasks successfully: ${stats.completed} completed, ${stats.successRate.toFixed(1)}% success rate`;
                const result = await this.executeTaskManagerCommand('authorize-stop', this.hookConfig.agentId, JSON.stringify(stopReason));
                if (result.success) {
                    console.log('Stop authorized successfully');
                }
                else {
                    console.warn('Failed to authorize stop:', result.error);
                }
            }
        }
        catch (error) {
            console.error('Error checking stop authorization:', error);
        }
    }
    /**
     * Shuts down the integration
     */
    async shutdown() {
        this.isIntegrationActive = false;
        if (this.progressReportingTimer) {
            clearInterval(this.progressReportingTimer);
        }
        // Final progress report
        await this.reportProgress();
        // Check if we should authorize stop
        await this.checkAndAuthorizeStop();
        console.log('InfiniteHookIntegration shut down gracefully');
    }
}
//# sourceMappingURL=InfiniteHookIntegration.js.map