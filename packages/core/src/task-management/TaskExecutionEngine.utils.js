/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Utility methods and helper functions for TaskExecutionEngine
 * Separated for better maintainability and testing
 */
export class TaskExecutionUtils {
    /**
     * Checks if all dependencies for a task are satisfied
     */
    static areDependenciesSatisfied(taskId, taskQueue, completedTasks, taskDependencies) {
        const dependencies = taskDependencies.get(taskId) || [];
        for (const dep of dependencies) {
            if (dep.taskId !== taskId)
                continue;
            const dependencyTask = taskQueue.get(dep.dependsOnTaskId) ||
                completedTasks.get(dep.dependsOnTaskId);
            if (!dependencyTask || dependencyTask.status !== TaskStatus.COMPLETED) {
                return false;
            }
        }
        return true;
    }
    /**
     * Gets the maximum number of concurrent tasks based on system resources
     */
    static getMaxConcurrentTasks() {
        // Dynamic based on system resources - for now, use a reasonable default
        return 3;
    }
    /**
     * Populates execution context for a task
     */
    static populateExecutionContext(task, context) {
        // Set basic task information
        context.set('task_id', task.id);
        context.set('task_title', task.title);
        context.set('task_description', task.description);
        context.set('task_type', task.type);
        context.set('task_complexity', task.complexity);
        context.set('task_priority', task.priority);
        // Set custom context variables
        for (const [key, value] of Object.entries(task.context)) {
            context.set(key, String(value));
        }
        // Set expected outputs
        const outputsList = Object.entries(task.expectedOutputs)
            .map(([key, desc]) => `${key}: ${desc}`)
            .join(', ');
        context.set('expected_outputs', outputsList);
        // Set timing constraints
        context.set('max_execution_minutes', task.maxExecutionTimeMinutes.toString());
        context.set('created_at', task.createdAt.toISOString());
    }
    /**
     * Generates execution prompt for a task based on its characteristics
     */
    static generateExecutionPrompt(task) {
        const basePrompt = `You are an autonomous task execution agent specializing in ${task.type} tasks.

**TASK DETAILS:**
- ID: \${task_id}
- Title: \${task_title}
- Description: \${task_description}
- Type: \${task_type}
- Complexity: \${task_complexity}
- Priority: \${task_priority}
- Max Execution Time: \${max_execution_minutes} minutes

**YOUR MISSION:**
Execute this task autonomously and thoroughly. You have access to comprehensive tools and should use them effectively to complete the task.

**EXECUTION PRINCIPLES:**
1. **COMPREHENSIVE ANALYSIS**: Understand the task fully before beginning implementation
2. **METHODICAL EXECUTION**: Follow a systematic approach with clear progress indicators
3. **QUALITY FOCUS**: Implement with professional standards and best practices
4. **ERROR HANDLING**: Anticipate and handle potential issues proactively
5. **VALIDATION**: Verify your work meets all requirements before completion
6. **DOCUMENTATION**: Log your progress and reasoning for future reference

**EXPECTED OUTPUTS:**
\${expected_outputs}

**TASK-SPECIFIC GUIDANCE:**
${TaskExecutionUtils.getTaskTypeGuidance(task.type)}

**COMPLETION CRITERIA:**
- All requirements from the task description are met
- Code follows project standards and best practices
- Appropriate testing and validation is completed
- All expected outputs are generated with high quality
- Documentation is updated as needed

You must emit all required outputs using the 'self.emitvalue' tool before completion.
Focus on delivering production-ready results that exceed expectations.`;
        return basePrompt;
    }
    /**
     * Gets task type specific guidance
     */
    static getTaskTypeGuidance(type) {
        switch (type) {
            case TaskType.IMPLEMENTATION:
                return `**IMPLEMENTATION GUIDANCE:**
- Read and understand existing codebase patterns
- Design clean, maintainable code architecture
- Implement with proper error handling and logging
- Follow established coding conventions and standards
- Add unit tests for new functionality
- Update related documentation`;
            case TaskType.TESTING:
                return `**TESTING GUIDANCE:**
- Create comprehensive test plans covering edge cases
- Implement unit, integration, and end-to-end tests as appropriate
- Ensure high test coverage (>80% where applicable)
- Validate both positive and negative test scenarios
- Generate detailed test reports and metrics
- Set up automated test execution where possible`;
            case TaskType.VALIDATION:
                return `**VALIDATION GUIDANCE:**
- Define clear validation criteria and acceptance tests
- Perform thorough functionality verification
- Check performance and security requirements
- Validate against business requirements and user stories
- Document validation results with evidence
- Identify and report any deviations or issues`;
            case TaskType.DOCUMENTATION:
                return `**DOCUMENTATION GUIDANCE:**
- Research and understand the subject thoroughly
- Write clear, comprehensive, and user-focused documentation
- Include practical examples and use cases
- Ensure proper formatting and structure
- Add diagrams and visuals where helpful
- Review and edit for clarity and accuracy`;
            case TaskType.ANALYSIS:
                return `**ANALYSIS GUIDANCE:**
- Gather comprehensive data and requirements
- Apply analytical frameworks and methodologies
- Generate actionable insights and recommendations
- Support findings with data and evidence
- Present results in clear, structured formats
- Consider multiple perspectives and scenarios`;
            case TaskType.DEPLOYMENT:
                return `**DEPLOYMENT GUIDANCE:**
- Prepare detailed deployment plans and procedures
- Set up proper environments and configurations
- Implement rollback strategies and contingencies
- Perform thorough pre and post-deployment validation
- Monitor system health and performance
- Document deployment processes for future use`;
            case TaskType.SECURITY:
                return `**SECURITY GUIDANCE:**
- Conduct comprehensive security assessments
- Identify vulnerabilities and attack vectors
- Implement security best practices and controls
- Perform security testing and validation
- Document security measures and recommendations
- Ensure compliance with security standards`;
            case TaskType.PERFORMANCE:
                return `**PERFORMANCE GUIDANCE:**
- Profile and identify performance bottlenecks
- Implement optimizations with measurable improvements
- Conduct performance testing under various loads
- Monitor and track performance metrics
- Document optimization strategies and results
- Set up ongoing performance monitoring`;
            default:
                return `**GENERAL GUIDANCE:**
- Approach the task systematically and thoroughly
- Apply industry best practices and standards
- Ensure high quality deliverables
- Document your work comprehensively`;
        }
    }
    /**
     * Gets appropriate tools for a task based on its type and complexity
     */
    static getToolsForTask(task) {
        const baseTools = ['ReadFileTool', 'WriteFileTool', 'EditFileTool', 'ShellTool'];
        const typeSpecificTools = {
            [TaskType.IMPLEMENTATION]: [
                ...baseTools,
                'GitTool',
                'LintTool',
                'BuildTool',
                'SearchTool',
                'FormatTool'
            ],
            [TaskType.TESTING]: [
                ...baseTools,
                'TestRunnerTool',
                'CoverageAnalysisTool',
                'MockingTool',
                'BenchmarkTool'
            ],
            [TaskType.VALIDATION]: [
                ...baseTools,
                'ValidationTool',
                'ComplianceCheckerTool',
                'QualityAnalysisTool',
                'AuditTool'
            ],
            [TaskType.DOCUMENTATION]: [
                'ReadFileTool',
                'WriteFileTool',
                'SearchTool',
                'DiagramTool',
                'MarkdownTool',
                'WikiTool'
            ],
            [TaskType.ANALYSIS]: [
                'ReadFileTool',
                'DataAnalysisTool',
                'MetricsTool',
                'ReportingTool',
                'VisualizationTool'
            ],
            [TaskType.DEPLOYMENT]: [
                ...baseTools,
                'DockerTool',
                'KubernetesTool',
                'ConfigManagementTool',
                'MonitoringTool'
            ],
            [TaskType.SECURITY]: [
                ...baseTools,
                'SecurityScannerTool',
                'VulnerabilityAnalysisTool',
                'PenetrationTestingTool',
                'ComplianceTool'
            ],
            [TaskType.PERFORMANCE]: [
                ...baseTools,
                'ProfilerTool',
                'BenchmarkTool',
                'MonitoringTool',
                'OptimizationTool'
            ]
        };
        return typeSpecificTools[task.type] || baseTools;
    }
    /**
     * Gets dependency tasks for a given task ID
     */
    static getDependencyTasks(taskId, taskQueue, completedTasks, taskDependencies) {
        const dependencies = taskDependencies.get(taskId) || [];
        const dependencyTasks = [];
        for (const dep of dependencies) {
            if (dep.taskId !== taskId)
                continue;
            const dependencyTask = taskQueue.get(dep.dependsOnTaskId) ||
                completedTasks.get(dep.dependsOnTaskId);
            if (dependencyTask) {
                dependencyTasks.push(dependencyTask);
            }
        }
        return dependencyTasks;
    }
    /**
     * Updates task progress based on message analysis
     */
    static updateTaskProgress(task, message) {
        // Simple progress analysis based on message content
        const progressKeywords = {
            'starting': 10,
            'analyzing': 15,
            'implementing': 30,
            'coding': 40,
            'testing': 60,
            'validating': 70,
            'documenting': 80,
            'reviewing': 85,
            'completing': 95,
            'finished': 100,
            'done': 100,
            'complete': 100
        };
        const messageLower = message.toLowerCase();
        let highestProgress = task.progress;
        for (const [keyword, progress] of Object.entries(progressKeywords)) {
            if (messageLower.includes(keyword)) {
                highestProgress = Math.max(highestProgress, progress);
            }
        }
        // Only update progress if it's moving forward
        if (highestProgress > task.progress) {
            task.progress = Math.min(highestProgress, 100);
        }
    }
    /**
     * Gets retry delay in milliseconds based on retry count
     */
    static getRetryDelayMs(retryCount) {
        // Exponential backoff: 5s, 15s, 45s
        return Math.min(5000 * Math.pow(3, retryCount - 1), 60000);
    }
    /**
     * Schedules dependent tasks after a task completes
     */
    static async scheduleDependentTasks(completedTaskId, taskQueue, taskDependencies, scheduleFunction) {
        // Find all tasks that depend on the completed task
        const dependentTasks = [];
        for (const [taskId, dependencies] of taskDependencies.entries()) {
            for (const dep of dependencies) {
                if (dep.dependsOnTaskId === completedTaskId && dep.taskId === taskId) {
                    dependentTasks.push(taskId);
                    break;
                }
            }
        }
        // Schedule dependent tasks that are now ready
        for (const taskId of dependentTasks) {
            const task = taskQueue.get(taskId);
            if (task && (task.status === TaskStatus.ASSIGNED || task.status === TaskStatus.QUEUED)) {
                await scheduleFunction(taskId);
            }
        }
    }
    /**
     * Handles dependent tasks when a parent task fails
     */
    static async handleDependentTasksOnFailure(failedTaskId, taskQueue, taskDependencies, updateTaskStatus, handleTaskError) {
        // Find all tasks that depend on the failed task
        const dependentTasks = [];
        for (const [taskId, dependencies] of taskDependencies.entries()) {
            for (const dep of dependencies) {
                if (dep.dependsOnTaskId === failedTaskId && dep.taskId === taskId) {
                    dependentTasks.push(taskId);
                    break;
                }
            }
        }
        // Cancel or reschedule dependent tasks based on dependency type
        for (const taskId of dependentTasks) {
            const task = taskQueue.get(taskId);
            if (!task)
                continue;
            const dependencies = taskDependencies.get(taskId) || [];
            const relevantDep = dependencies.find(dep => dep.dependsOnTaskId === failedTaskId && dep.taskId === taskId);
            if (!relevantDep)
                continue;
            if (relevantDep.type === 'hard') {
                // Hard dependency - cancel the task
                updateTaskStatus(task, TaskStatus.CANCELLED);
                handleTaskError(task, `Cancelled due to hard dependency failure: ${failedTaskId}`);
            }
            else {
                // Soft dependency - could potentially continue, but for now we'll cancel
                // In future versions, we might implement smarter handling
                updateTaskStatus(task, TaskStatus.CANCELLED);
                handleTaskError(task, `Cancelled due to dependency failure: ${failedTaskId}`);
            }
        }
    }
    /**
     * Generates task summary for reporting
     */
    static generateTaskSummary(task) {
        const duration = task.completedAt && task.startedAt
            ? task.completedAt.getTime() - task.startedAt.getTime()
            : 0;
        return `Task ${task.id} (${task.title}):
- Status: ${task.status}
- Type: ${task.type}
- Complexity: ${task.complexity}
- Priority: ${task.priority}
- Progress: ${task.progress}%
- Duration: ${Math.round(duration / 1000)}s
- Retries: ${task.retryCount}
${task.lastError ? `- Last Error: ${task.lastError}` : ''}`;
    }
    /**
     * Validates task configuration
     */
    static validateTask(task) {
        const errors = [];
        if (!task.title || task.title.trim().length === 0) {
            errors.push('Task title is required');
        }
        if (!task.description || task.description.trim().length === 0) {
            errors.push('Task description is required');
        }
        if (task.maxExecutionTimeMinutes !== undefined && task.maxExecutionTimeMinutes <= 0) {
            errors.push('Max execution time must be positive');
        }
        if (task.maxRetries !== undefined && task.maxRetries < 0) {
            errors.push('Max retries cannot be negative');
        }
        if (task.priority !== undefined && !Object.values(TaskType).includes(task.priority)) {
            errors.push('Invalid task priority');
        }
        return errors;
    }
    /**
     * Gets human-readable status description
     */
    static getStatusDescription(status) {
        switch (status) {
            case TaskStatus.QUEUED: return 'Waiting in queue for analysis';
            case TaskStatus.ANALYZED: return 'Analysis complete, ready for assignment';
            case TaskStatus.ASSIGNED: return 'Assigned to execution engine';
            case TaskStatus.IN_PROGRESS: return 'Currently executing';
            case TaskStatus.BLOCKED: return 'Blocked waiting for dependencies';
            case TaskStatus.VALIDATION: return 'Validating results';
            case TaskStatus.COMPLETED: return 'Successfully completed';
            case TaskStatus.FAILED: return 'Failed execution';
            case TaskStatus.CANCELLED: return 'Cancelled by system or user';
        }
    }
    /**
     * Calculates task execution statistics
     */
    static calculateExecutionStats(tasks) {
        const completed = tasks.filter(t => t.status === TaskStatus.COMPLETED);
        const failed = tasks.filter(t => t.status === TaskStatus.FAILED);
        const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS);
        const totalFinished = completed.length + failed.length;
        const successRate = totalFinished > 0 ? (completed.length / totalFinished) * 100 : 0;
        const durations = completed
            .filter(t => t.startedAt && t.completedAt)
            .map(t => t.completedAt.getTime() - t.startedAt.getTime());
        const averageDurationMs = durations.length > 0
            ? durations.reduce((sum, d) => sum + d, 0) / durations.length
            : 0;
        return {
            total: tasks.length,
            completed: completed.length,
            failed: failed.length,
            inProgress: inProgress.length,
            averageDurationMs,
            successRate
        };
    }
}
//# sourceMappingURL=TaskExecutionEngine.utils.js.map