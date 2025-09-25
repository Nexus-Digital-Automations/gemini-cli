/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tracks user activity state to determine when memory monitoring should be active.
 *
 * The ActivityDetector monitors user interactions to optimize telemetry and resource
 * monitoring by distinguishing between active usage and idle periods. This enables
 * intelligent resource management and reduces unnecessary monitoring overhead.
 *
 * Key features:
 * - Configurable idle threshold for activity detection
 * - Timestamp tracking for precise activity timing
 * - Global singleton pattern for consistent state across the application
 * - Lightweight design for minimal performance impact
 *
 * @example
 * ```typescript
 * const detector = new ActivityDetector(30000); // 30 second idle threshold
 * detector.recordActivity();
 * if (detector.isUserActive()) {
 *   // User is active, enable intensive monitoring
 * }
 * ```
 */
export class ActivityDetector {
  lastActivityTime = Date.now();
  idleThresholdMs;
  /**
   * Creates a new ActivityDetector instance.
   *
   * @param idleThresholdMs - Milliseconds of inactivity before user is considered idle (default: 30 seconds)
   */
  constructor(idleThresholdMs = 30000) {
    this.idleThresholdMs = idleThresholdMs;
  }
  /**
   * Record user activity (called by CLI when user types, adds messages, etc.).
   *
   * Updates the last activity timestamp to the current time, resetting the idle timer.
   * Should be called on any meaningful user interaction.
   */
  recordActivity() {
    this.lastActivityTime = Date.now();
  }
  /**
   * Check if user is currently active (activity within idle threshold).
   *
   * @returns True if user activity occurred within the idle threshold, false otherwise
   */
  isUserActive() {
    const timeSinceActivity = Date.now() - this.lastActivityTime;
    return timeSinceActivity < this.idleThresholdMs;
  }
  /**
   * Get time since last activity in milliseconds.
   *
   * @returns Milliseconds elapsed since the last recorded activity
   */
  getTimeSinceLastActivity() {
    return Date.now() - this.lastActivityTime;
  }
  /**
   * Get last activity timestamp.
   *
   * @returns Unix timestamp (milliseconds) of the last recorded activity
   */
  getLastActivityTime() {
    return this.lastActivityTime;
  }
}
// Global activity detector instance (eagerly created with default threshold)
const globalActivityDetector = new ActivityDetector();
/**
 * Get global activity detector instance.
 *
 * Returns the singleton ActivityDetector instance used throughout the application.
 * This ensures consistent activity tracking across all modules.
 *
 * @returns The global ActivityDetector instance
 */
export function getActivityDetector() {
  return globalActivityDetector;
}
/**
 * Record user activity (convenience function for CLI to call).
 *
 * Convenience wrapper around the global activity detector's recordActivity method.
 * Preferred way for CLI components to signal user activity.
 */
export function recordUserActivity() {
  globalActivityDetector.recordActivity();
}
/**
 * Check if user is currently active (convenience function).
 *
 * Convenience wrapper around the global activity detector's isUserActive method.
 *
 * @returns True if user is currently active, false if idle
 */
export function isUserActive() {
  return globalActivityDetector.isUserActive();
}
//# sourceMappingURL=activity-detector.js.map
