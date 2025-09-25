/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { CreateTaskRequest, UpdateTaskRequest } from '../types/Task';
import { Logger } from './Logger';
/**
 * Validator utility for the Autonomous Task Management System
 */
export class Validator {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    async validateCreateTaskRequest(request) {
        if (!request.title || request.title.trim().length === 0) {
            throw new Error('Task title is required');
        }
        if (!request.description || request.description.trim().length === 0) {
            throw new Error('Task description is required');
        }
        if (!request.businessValue || request.businessValue.trim().length === 0) {
            throw new Error('Business value justification is required');
        }
        if (!request.category) {
            throw new Error('Task category is required');
        }
        if (!request.priority) {
            throw new Error('Task priority is required');
        }
    }
    async validateUpdateTaskRequest(request) {
        if (!request.id) {
            throw new Error('Task ID is required for updates');
        }
        if (!request.reason || request.reason.trim().length === 0) {
            throw new Error('Update reason is required');
        }
        if (!request.agentId) {
            throw new Error('Agent ID is required for updates');
        }
    }
}
//# sourceMappingURL=Validator.js.map