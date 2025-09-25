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
export declare class Validator {
    private readonly logger;
    constructor(logger: Logger);
    validateCreateTaskRequest(request: CreateTaskRequest): Promise<void>;
    validateUpdateTaskRequest(request: UpdateTaskRequest): Promise<void>;
}
