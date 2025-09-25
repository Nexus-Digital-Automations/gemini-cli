/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { AutonomousTaskIntegrator } from './autonomousTaskIntegrator.js';
/**
 * Bridge service that coordinates all autonomous task management components
 */
export class IntegrationBridge extends EventEmitter {
    config;
    integrationConfig;
    taskIntegrator;
    syncTimer;
    heartbeatTimer;
    isInitialized = false;
    constructor(config, integrationConfig) {
        super();
        this.config = config;
        this.integrationConfig = {
            taskManagerApiPath: '/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js',
            projectRoot: process.cwd(),
            enableCrossSessionPersistence: true,
            enableRealTimeUpdates: true,
            agentHeartbeatInterval: 30000, // 30 seconds
            taskSyncInterval: 60000, // 1 minute
            cliCommandsIntegration: true,
            autoStartTaskProcessing: true,
            maxConcurrentTasks: 10,
            ...integrationConfig,
        };
        this.taskIntegrator = new AutonomousTaskIntegrator(config);
        this.setupEventHandlers();
    }
    /**
     * Initialize the integration bridge and all components
     */
    async initialize() {
        try {
            console.log('🚀 Initializing Autonomous Task Management Integration Bridge...');
            // Initialize the core task integrator
            await this.taskIntegrator.initialize();
            // Sync with TaskManager API to restore session state
            await this.syncWithTaskManagerAPI();
            // Start periodic sync and heartbeat monitoring
            if (this.integrationConfig.enableRealTimeUpdates) {
                this.startPeriodicSync();
            }
            this.isInitialized = true;
            this.emit('bridge_initialized', { timestamp: new Date() });
            console.log('✅ Integration Bridge initialized successfully');
        }
        catch (error) {
            console.error('❌ Failed to initialize Integration Bridge:', error);
            this.emit('bridge_initialization_failed', { error, timestamp: new Date() });
            throw error;
        }
    }
    /**
     * Create task from approved feature in FEATURES.json
     */
    async createTaskFromFeature(featureId, options = {}) {
        if (!this.isInitialized) {
            throw new Error('Integration Bridge not initialized');
        }
        try {
            // Call TaskManager API to create task from feature
            const apiResponse = await this.callTaskManagerAPI('createTaskFromFeature', [featureId, options]);
            if (!apiResponse.success) {
                throw new Error(apiResponse.error || 'Failed to create task from feature');
            }
            // Convert API response to AutonomousTask and add to integrator
            const task = await this.taskIntegrator.createTask({
                title: apiResponse.task.title,
                description: apiResponse.task.description,
                type: apiResponse.task.type,
                priority: apiResponse.task.priority,
                dependencies: apiResponse.task.dependencies || [],
                requiredCapabilities: apiResponse.task.required_capabilities || [],
                featureId,
                metadata: {
                    ...apiResponse.task.metadata,
                    externalTaskId: apiResponse.task.id,
                },
            });
            console.log(`✅ Created task ${task.id} from feature ${featureId}`);
            return task;
        }
        catch (error) {
            console.error(`❌ Failed to create task from feature ${featureId}:`, error);
            throw error;
        }
    }
    /**
     * Auto-generate tasks from all approved features
     */
    async generateTasksFromApprovedFeatures() {
        if (!this.isInitialized) {
            throw new Error('Integration Bridge not initialized');
        }
        try {
            console.log('🔄 Generating tasks from approved features...');
            // Call TaskManager API to generate tasks
            const apiResponse = await this.callTaskManagerAPI('generateTasksFromApprovedFeatures');
            if (!apiResponse.success) {
                throw new Error(apiResponse.error || 'Failed to generate tasks from approved features');
            }
            const generatedTasks = [];
            // Create corresponding tasks in the integrator
            for (const apiTask of apiResponse.generated_tasks || []) {
                const task = await this.taskIntegrator.createTask({
                    title: apiTask.title,
                    description: apiTask.description,
                    type: apiTask.type,
                    priority: apiTask.priority,
                    dependencies: apiTask.dependencies || [],
                    requiredCapabilities: apiTask.required_capabilities || [],
                    featureId: apiTask.feature_id,
                    metadata: {
                        ...apiTask.metadata,
                        externalTaskId: apiTask.id,
                    },
                });
                generatedTasks.push(task);
            }
            console.log(`✅ Generated ${generatedTasks.length} tasks from approved features`);
            return generatedTasks;
        }
        catch (error) {
            console.error('❌ Failed to generate tasks from approved features:', error);
            throw error;
        }
    }
    /**
     * Register agent with both the integrator and TaskManager API
     */
    async registerAgent(agentConfig) {
        if (!this.isInitialized) {
            throw new Error('Integration Bridge not initialized');
        }
        try {
            console.log(`🤖 Registering agent ${agentConfig.id}...`);
            // Register with TaskManager API first
            await this.callTaskManagerAPI('registerAgentCapabilities', [agentConfig.id, agentConfig.capabilities]);
            // Register with the task integrator
            await this.taskIntegrator.registerAgent(agentConfig);
            console.log(`✅ Agent ${agentConfig.id} registered successfully`);
        }
        catch (error) {
            console.error(`❌ Failed to register agent ${agentConfig.id}:`, error);
            throw error;
        }
    }
    /**
     * Update task progress across all systems
     */
    async updateTaskProgress(taskId, progressUpdate) {
        if (!this.isInitialized) {
            throw new Error('Integration Bridge not initialized');
        }
        try {
            // Find the task to get its external ID
            const task = this.taskIntegrator['taskQueue'].get(taskId);
            if (!task) {
                throw new Error(`Task ${taskId} not found`);
            }
            const externalTaskId = task.metadata.externalTaskId;
            // Update in TaskManager API if external task exists
            if (externalTaskId) {
                await this.callTaskManagerAPI('updateTaskProgress', [externalTaskId, progressUpdate]);
            }
            // Update task status in integrator (this would be enhanced)
            // Currently the integrator handles completion internally through tool execution
            console.log(`✅ Updated progress for task ${taskId}`);
        }
        catch (error) {
            console.error(`❌ Failed to update task progress for ${taskId}:`, error);
            throw error;
        }
    }
    /**
     * Get comprehensive system status
     */
    async getSystemStatus() {
        const integratorStatus = this.taskIntegrator.getSystemStatus();
        try {
            const apiStats = await this.callTaskManagerAPI('getTaskQueue');
            const featureStats = await this.callTaskManagerAPI('feature-stats');
            return {
                bridge: {
                    status: this.isInitialized ? 'active' : 'inactive',
                    uptime: process.uptime(),
                },
                integrator: integratorStatus,
                taskManagerApi: {
                    tasks: apiStats.tasks || [],
                    features: featureStats.stats || {},
                },
                sync: {
                    lastSync: new Date(), // Would track actual last sync time
                    syncInterval: this.integrationConfig.taskSyncInterval,
                },
            };
        }
        catch (error) {
            console.error('❌ Failed to get system status:', error);
            return {
                bridge: {
                    status: this.isInitialized ? 'active' : 'inactive',
                    uptime: process.uptime(),
                },
                integrator: integratorStatus,
                taskManagerApi: { error: error.message },
                sync: {
                    lastSync: new Date(),
                    syncInterval: this.integrationConfig.taskSyncInterval,
                },
            };
        }
    }
    /**
     * Execute CLI command with task context
     */
    async executeCliCommand(command, args = [], taskContext) {
        if (!this.isInitialized) {
            throw new Error('Integration Bridge not initialized');
        }
        try {
            console.log(`📟 Executing CLI command: ${command} ${args.join(' ')}`);
            // Enhance command execution with task context
            const enhancedArgs = taskContext
                ? ['--task-id', taskContext.taskId, '--agent-id', taskContext.agentId, ...args]
                : args;
            // Execute command using spawn
            const result = await this.spawnCommand(command, enhancedArgs);
            if (taskContext) {
                await this.updateTaskProgress(taskContext.taskId, {
                    notes: `CLI command executed: ${command}`,
                    metadata: { command, args, output: result.output }
                });
            }
            return result;
        }
        catch (error) {
            console.error(`❌ CLI command failed: ${command}`, error);
            throw error;
        }
    }
    /**
     * Get CLI integration status and available commands
     */
    getCliIntegrationStatus() {
        return {
            enabled: this.integrationConfig.cliCommandsIntegration,
            availableCommands: [
                'gemini-task-create',
                'gemini-task-list',
                'gemini-task-status',
                'gemini-agent-register',
                'gemini-system-status'
            ],
            integrationMode: this.integrationConfig.autoStartTaskProcessing ? 'automatic' : 'manual'
        };
    }
    /**
     * Handle API requests directly from external tools
     */
    async handleExternalApiRequest(endpoint, params = []) {
        if (!this.isInitialized) {
            throw new Error('Integration Bridge not initialized');
        }
        try {
            // Route request to appropriate integrator
            return await this.taskIntegrator.handleApiCall(endpoint, params);
        }
        catch (error) {
            console.error(`❌ External API request failed: ${endpoint}`, error);
            throw error;
        }
    }
    /**
     * Shutdown the integration bridge gracefully
     */
    async shutdown() {
        console.log('🛑 Shutting down Integration Bridge...');
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
        }
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
        }
        this.isInitialized = false;
        this.emit('bridge_shutdown', { timestamp: new Date() });
        console.log('✅ Integration Bridge shutdown complete');
    }
    // Private methods
    setupEventHandlers() {
        // Handle events from the task integrator
        this.taskIntegrator.on('task_created', (event) => {
            this.emit('task_created', event);
            console.log(`📝 Task created: ${event.taskId}`);
        });
        this.taskIntegrator.on('task_completed', (event) => {
            this.emit('task_completed', event);
            console.log(`✅ Task completed: ${event.taskId} by ${event.agentId}`);
            // Sync completion back to TaskManager API
            this.syncTaskCompletion(event);
        });
        this.taskIntegrator.on('task_failed', (event) => {
            this.emit('task_failed', event);
            console.error(`❌ Task failed: ${event.taskId} - ${event.data.error}`);
        });
        this.taskIntegrator.on('agent_registered', (event) => {
            this.emit('agent_registered', event);
            console.log(`🤖 Agent registered: ${event.agentId}`);
        });
    }
    async syncWithTaskManagerAPI() {
        try {
            console.log('🔄 Syncing with TaskManager API...');
            // Get current state from TaskManager API
            const taskQueue = await this.callTaskManagerAPI('getTaskQueue');
            const agentStatus = await this.callTaskManagerAPI('feature-stats');
            // Restore any in-progress tasks (implementation would be more sophisticated)
            if (taskQueue.success && taskQueue.tasks) {
                for (const apiTask of taskQueue.tasks) {
                    if (apiTask.status === 'in_progress' || apiTask.status === 'assigned') {
                        // Recreate task in integrator
                        await this.taskIntegrator.createTask({
                            title: apiTask.title,
                            description: apiTask.description,
                            type: apiTask.type,
                            priority: apiTask.priority,
                            dependencies: apiTask.dependencies || [],
                            requiredCapabilities: apiTask.required_capabilities || [],
                            featureId: apiTask.feature_id,
                            metadata: {
                                ...apiTask.metadata,
                                externalTaskId: apiTask.id,
                                restored: true,
                            },
                        });
                    }
                }
            }
            console.log('✅ Sync with TaskManager API completed');
        }
        catch (error) {
            console.error('❌ Failed to sync with TaskManager API:', error);
            // Don't throw - allow bridge to continue with degraded functionality
        }
    }
    startPeriodicSync() {
        // Sync task status periodically
        this.syncTimer = setInterval(async () => {
            try {
                await this.syncWithTaskManagerAPI();
            }
            catch (error) {
                console.error('❌ Periodic sync failed:', error);
            }
        }, this.integrationConfig.taskSyncInterval);
        // Send heartbeats for agents
        this.heartbeatTimer = setInterval(async () => {
            try {
                // Implementation would send heartbeats for all registered agents
                console.log('💓 Sending agent heartbeats...');
            }
            catch (error) {
                console.error('❌ Heartbeat failed:', error);
            }
        }, this.integrationConfig.agentHeartbeatInterval);
    }
    async syncTaskCompletion(event) {
        try {
            if (event.taskId) {
                const task = this.taskIntegrator['taskQueue'].get(event.taskId);
                if (task && task.metadata.externalTaskId) {
                    await this.updateTaskProgress(event.taskId, {
                        status: 'completed',
                        progress_percentage: 100,
                        notes: 'Task completed successfully',
                        updated_by: event.agentId || 'autonomous_system',
                    });
                }
            }
        }
        catch (error) {
            console.error('❌ Failed to sync task completion:', error);
        }
    }
    async spawnCommand(command, args) {
        return new Promise((resolve) => {
            const child = spawn(command, args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: this.integrationConfig.projectRoot,
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
                    resolve({ success: true, output: stdout });
                }
                else {
                    resolve({ success: false, output: stdout, error: stderr });
                }
            });
            child.on('error', (error) => {
                resolve({ success: false, output: '', error: error.message });
            });
        });
    }
    async callTaskManagerAPI(command, args = []) {
        return new Promise((resolve, reject) => {
            const cmdArgs = [this.integrationConfig.taskManagerApiPath, command, ...args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)), '--project-root', this.integrationConfig.projectRoot];
            const child = spawn('timeout', ['10s', 'node', ...cmdArgs], {
                stdio: ['pipe', 'pipe', 'pipe'],
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
                        const response = JSON.parse(stdout);
                        resolve(response);
                    }
                    catch (error) {
                        reject(new Error(`Failed to parse API response: ${stdout}`));
                    }
                }
                else {
                    reject(new Error(`TaskManager API call failed: ${stderr || stdout}`));
                }
            });
            child.on('error', (error) => {
                reject(new Error(`Failed to execute TaskManager API: ${error.message}`));
            });
        });
    }
}
//# sourceMappingURL=integrationBridge.js.map