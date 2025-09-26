/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import chalk from 'chalk';
const execAsync = promisify(exec);
/**
 * TaskManager API Integration for Autonomous CLI Commands
 *
 * This module provides seamless integration with the infinite-continue-stop-hook
 * TaskManager API, ensuring backward compatibility and graceful fallback.
 */
const TASKMANAGER_API_PATH = '/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js';
const API_TIMEOUT = 10000; // 10 seconds
/**
 * Execute TaskManager API command with timeout and error handling
 */
async function executeTaskManagerCommand(command) {
    try {
        const fullCommand = `timeout ${API_TIMEOUT / 1000}s node "${TASKMANAGER_API_PATH}" ${command}`;
        const { stdout, stderr } = await execAsync(fullCommand);
        if (stderr) {
            console.warn(chalk.yellow(`TaskManager API Warning: ${stderr}`));
        }
        // Try to parse as JSON
        try {
            const result = JSON.parse(stdout);
            return {
                success: true,
                data: result,
                message: result.message || 'Command executed successfully',
            };
        }
        catch {
            // If not JSON, return raw output
            return {
                success: true,
                data: { output: stdout.trim() },
                message: 'Command executed successfully',
            };
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        // Check if it's a timeout error
        if (errorMessage.includes('timeout') || errorMessage.includes('124')) {
            return {
                success: false,
                error: 'TaskManager API timeout - system may be busy',
                message: 'Request timed out after 10 seconds',
            };
        }
        // Check if it's a file not found error
        if (errorMessage.includes('ENOENT') ||
            errorMessage.includes('No such file')) {
            return {
                success: false,
                error: 'TaskManager API not found',
                message: 'TaskManager API is not available at expected location',
            };
        }
        return {
            success: false,
            error: errorMessage,
            message: 'TaskManager API call failed',
        };
    }
}
/**
 * Initialize or reinitialize an agent
 */
export async function initializeAgent(agentId) {
    return executeTaskManagerCommand(`reinitialize ${agentId}`);
}
/**
 * Suggest a new feature
 */
export async function suggestFeature(feature) {
    const featureJson = JSON.stringify(feature).replace(/"/g, '\\"');
    return executeTaskManagerCommand(`suggest-feature "${featureJson}"`);
}
/**
 * List features with optional filtering
 */
export async function listFeatures(filter) {
    const filterArg = filter
        ? `"${JSON.stringify(filter).replace(/"/g, '\\"')}"`
        : '';
    return executeTaskManagerCommand(`list-features ${filterArg}`);
}
/**
 * Approve a feature
 */
export async function approveFeature(featureId, approvalData) {
    const approvalArg = approvalData
        ? `"${JSON.stringify(approvalData).replace(/"/g, '\\"')}"`
        : '';
    return executeTaskManagerCommand(`approve-feature ${featureId} ${approvalArg}`);
}
/**
 * Reject a feature
 */
export async function rejectFeature(featureId, rejectionData) {
    const rejectionArg = rejectionData
        ? `"${JSON.stringify(rejectionData).replace(/"/g, '\\"')}"`
        : '';
    return executeTaskManagerCommand(`reject-feature ${featureId} ${rejectionArg}`);
}
/**
 * Get feature statistics
 */
export async function getFeatureStats() {
    return executeTaskManagerCommand('feature-stats');
}
/**
 * Get initialization statistics
 */
export async function getInitializationStats() {
    return executeTaskManagerCommand('get-initialization-stats');
}
/**
 * Authorize agent to stop
 */
export async function authorizeStop(agentId, reason) {
    return executeTaskManagerCommand(`authorize-stop ${agentId} "${reason}"`);
}
/**
 * Check if TaskManager API is available
 */
export async function checkApiAvailability() {
    try {
        const result = await executeTaskManagerCommand('guide');
        return result.success;
    }
    catch {
        return false;
    }
}
/**
 * Get comprehensive API guide
 */
export async function getApiGuide() {
    return executeTaskManagerCommand('guide');
}
/**
 * List available API methods
 */
export async function listApiMethods() {
    return executeTaskManagerCommand('methods');
}
/**
 * Handle API response with user-friendly error messages
 */
export function handleApiResponse(response, operation) {
    if (response.success) {
        if (response.message) {
            console.log(chalk.green(`✅ ${operation}: ${response.message}`));
        }
        return true;
    }
    else {
        console.error(chalk.red(`❌ ${operation} failed:`));
        console.error(chalk.red(response.error || 'Unknown error'));
        if (response.error?.includes('not found') ||
            response.error?.includes('ENOENT')) {
            console.log(chalk.blue('\n💡 TaskManager API Troubleshooting:'));
            console.log('   • Ensure TaskManager API is installed at expected location');
            console.log('   • Check if the infinite-continue-stop-hook system is running');
            console.log('   • Verify file permissions for TaskManager API');
        }
        else if (response.error?.includes('timeout')) {
            console.log(chalk.blue('\n💡 TaskManager API Timeout:'));
            console.log('   • System may be under heavy load');
            console.log('   • Try again in a few moments');
            console.log('   • Check system resources and performance');
        }
        return false;
    }
}
/**
 * Graceful fallback handler for when TaskManager API is unavailable
 */
export function handleApiFallback(operation, fallbackAction) {
    console.log(chalk.yellow(`⚠️  TaskManager API not available for ${operation}`));
    console.log(chalk.blue('💡 Using local simulation mode'));
    if (fallbackAction) {
        fallbackAction();
    }
}
/**
 * Convert autonomous task to TaskManager feature suggestion
 */
export function convertTaskToFeature(task) {
    // Map task categories to TaskManager feature categories
    const categoryMap = {
        FEATURE: 'new-feature',
        BUG_FIX: 'bug-fix',
        ERROR: 'bug-fix',
        ENHANCEMENT: 'enhancement',
        PERFORMANCE: 'performance',
        SECURITY: 'security',
        DOCUMENTATION: 'documentation',
        TEST: 'enhancement',
    };
    const mappedCategory = categoryMap[task.category] || 'new-feature';
    return {
        title: task.title ||
            task.description?.substring(0, 50) + '...' ||
            'Autonomous Task',
        description: task.description || 'Autonomous task execution',
        business_value: `Autonomous task management: ${task.type || 'implementation'} with ${task.priority || 'medium'} priority`,
        category: mappedCategory,
    };
}
//# sourceMappingURL=taskManagerApi.js.map