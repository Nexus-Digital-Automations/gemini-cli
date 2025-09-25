/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'events';
import { Task } from '../types/Task';
import { AgentCoordinator } from './AgentCoordinator';
import { QualityGateway } from './QualityGateway';
import { MonitoringService } from './MonitoringService';
import { Logger } from '../utils/Logger';
/**
 * TaskExecutionEngine class - Manages task execution and validation
 */
export declare class TaskExecutionEngine extends EventEmitter {
    private readonly agentCoordinator;
    private readonly qualityGateway;
    private readonly monitoringService;
    private readonly logger;
    constructor(agentCoordinator: AgentCoordinator, qualityGateway: QualityGateway, monitoringService: MonitoringService, logger: Logger);
    initialize(): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
    executeTask(task: Task): Promise<void>;
}
