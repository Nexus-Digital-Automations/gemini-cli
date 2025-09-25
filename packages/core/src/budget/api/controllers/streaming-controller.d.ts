/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Budget Streaming Controller
 * Handles real-time budget data streaming via WebSocket connections
 * Provides live updates on usage, alerts, and analytics
 *
 * @author Claude Code - Budget Management API Endpoints Agent
 * @version 1.0.0
 */
import type { Request, Response } from 'express';
/**
 * Enhanced request interface with user context
 */
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    permissions: string[];
  };
  sessionId?: string;
}
/**
 * Controller for real-time budget data streaming
 */
export declare class StreamingController {
  private clients;
  private updateInterval?;
  private heartbeatInterval?;
  /**
   * Initialize streaming controller
   */
  constructor();
  /**
   * Handle WebSocket upgrade request
   * GET /api/budget/stream
   */
  handleStreamRequest(req: AuthenticatedRequest, res: Response): Promise<void>;
  /**
   * Get streaming connection status
   * GET /api/budget/stream/status
   */
  getStreamStatus(req: AuthenticatedRequest, res: Response): Promise<void>;
  /**
   * Handle new WebSocket connection
   */
  private handleWebSocketConnection;
  /**
   * Handle WebSocket message from client
   */
  private handleWebSocketMessage;
  /**
   * Handle WebSocket connection close
   */
  private handleWebSocketClose;
  /**
   * Handle WebSocket error
   */
  private handleWebSocketError;
  /**
   * Handle subscription changes
   */
  private handleSubscribe;
  /**
   * Handle unsubscription
   */
  private handleUnsubscribe;
  /**
   * Send message to specific client
   */
  private sendMessage;
  /**
   * Broadcast message to all subscribed clients
   */
  private broadcastMessage;
  /**
   * Start periodic update scheduler
   */
  private startUpdateScheduler;
  /**
   * Start heartbeat scheduler
   */
  private startHeartbeatScheduler;
  /**
   * Generate unique client ID
   */
  private generateClientId;
  /**
   * Cleanup resources
   */
  cleanup(): void;
}
export {};
