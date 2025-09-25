/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CreateTaskRequest, UpdateTaskRequest } from '../types/Task';
import type { Logger } from './Logger';

/**
 * Validator utility for the Autonomous Task Management System
 */
export class Validator {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async validateCreateTaskRequest(request: CreateTaskRequest): Promise<void> {
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

  async validateUpdateTaskRequest(request: UpdateTaskRequest): Promise<void> {
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