/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { BudgetSettings, BudgetUsageData } from './types.js';

/**
 * Core budget tracking functionality for managing daily API request limits.
 * Handles tracking usage, checking limits, and managing budget resets.
 */
export class BudgetTracker {
  private projectRoot: string;
  private settings: BudgetSettings;
  private usageFilePath: string;

  constructor(projectRoot: string, settings: BudgetSettings) {
    this.projectRoot = projectRoot;
    this.settings = settings;
    this.usageFilePath = path.join(
      this.projectRoot,
      '.gemini',
      'budget-usage.json',
    );
  }

  /**
   * Check if budget tracking is enabled
   */
  isEnabled(): boolean {
    return (
      this.settings.enabled === true && (this.settings.dailyLimit ?? 0) > 0
    );
  }

  /**
   * Get current budget configuration
   */
  getBudgetSettings(): BudgetSettings {
    return { ...this.settings };
  }

  /**
   * Update budget settings
   */
  updateSettings(newSettings: Partial<BudgetSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Record a new API request in the budget tracking
   */
  async recordRequest(): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    const usageData = await this.getCurrentUsageData();
    const today = this.getTodayDateString();

    // Reset if it's a new day or past reset time
    if (usageData.date !== today || this.shouldReset(usageData)) {
      await this.resetDailyUsage();
      // Re-fetch after reset
      const resetUsageData = await this.getCurrentUsageData();
      resetUsageData.requestCount += 1;
      await this.saveUsageData(resetUsageData);
    } else {
      usageData.requestCount += 1;
      await this.saveUsageData(usageData);
    }
  }

  /**
   * Check if the current usage exceeds the daily limit
   */
  async isOverBudget(): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }

    const usageData = await this.getCurrentUsageData();
    const dailyLimit = this.settings.dailyLimit ?? 0;

    return usageData.requestCount >= dailyLimit;
  }

  /**
   * Check if a warning should be shown for the current usage level
   */
  async shouldShowWarning(): Promise<{ show: boolean; threshold?: number }> {
    if (!this.isEnabled()) {
      return { show: false };
    }

    const usageData = await this.getCurrentUsageData();
    const dailyLimit = this.settings.dailyLimit ?? 0;
    const usagePercentage = (usageData.requestCount / dailyLimit) * 100;
    const thresholds = this.settings.warningThresholds ?? [50, 75, 90];

    for (const threshold of thresholds.sort((a, b) => b - a)) {
      if (
        usagePercentage >= threshold &&
        !usageData.warningsShown.includes(threshold)
      ) {
        // Mark this warning as shown
        usageData.warningsShown.push(threshold);
        await this.saveUsageData(usageData);
        return { show: true, threshold };
      }
    }

    return { show: false };
  }

  /**
   * Get current usage statistics
   */
  async getUsageStats(): Promise<{
    requestCount: number;
    dailyLimit: number;
    remainingRequests: number;
    usagePercentage: number;
    timeUntilReset: string;
  }> {
    const usageData = await this.getCurrentUsageData();
    const dailyLimit = this.settings.dailyLimit ?? 0;
    const remainingRequests = Math.max(0, dailyLimit - usageData.requestCount);
    const usagePercentage =
      dailyLimit > 0 ? (usageData.requestCount / dailyLimit) * 100 : 0;
    const timeUntilReset = this.getTimeUntilReset();

    return {
      requestCount: usageData.requestCount,
      dailyLimit,
      remainingRequests,
      usagePercentage,
      timeUntilReset,
    };
  }

  /**
   * Manually reset the daily usage count
   */
  async resetDailyUsage(): Promise<void> {
    const today = this.getTodayDateString();
    const resetTime = new Date().toISOString();

    const usageData: BudgetUsageData = {
      date: today,
      requestCount: 0,
      lastResetTime: resetTime,
      warningsShown: [],
    };

    await this.saveUsageData(usageData);
  }

  /**
   * Temporarily extend the daily limit for today only
   */
  async extendDailyLimit(additionalRequests: number): Promise<void> {
    if (!this.isEnabled() || additionalRequests <= 0) {
      return;
    }

    // This is a temporary extension, so we modify the settings for this session only
    const currentLimit = this.settings.dailyLimit ?? 0;
    this.settings.dailyLimit = currentLimit + additionalRequests;
  }

  /**
   * Get current usage data, creating default if it doesn't exist
   */
  private async getCurrentUsageData(): Promise<BudgetUsageData> {
    try {
      const data = await fs.readFile(this.usageFilePath, 'utf-8');
      const usageData = JSON.parse(data) as BudgetUsageData;

      // Validate and migrate if necessary
      if (!usageData.date || !usageData.lastResetTime) {
        return this.createDefaultUsageData();
      }

      return usageData;
    } catch (_error) {
      // File doesn't exist or is corrupted, create default
      return this.createDefaultUsageData();
    }
  }

  /**
   * Save usage data to file
   */
  private async saveUsageData(usageData: BudgetUsageData): Promise<void> {
    try {
      // Ensure the .gemini directory exists
      const dir = path.dirname(this.usageFilePath);
      await fs.mkdir(dir, { recursive: true });

      await fs.writeFile(
        this.usageFilePath,
        JSON.stringify(usageData, null, 2),
      );
    } catch (error) {
      console.warn('Failed to save budget usage data:', error);
    }
  }

  /**
   * Create default usage data for today
   */
  private createDefaultUsageData(): BudgetUsageData {
    const today = this.getTodayDateString();
    const now = new Date().toISOString();

    return {
      date: today,
      requestCount: 0,
      lastResetTime: now,
      warningsShown: [],
    };
  }

  /**
   * Check if budget should be reset based on reset time
   */
  private shouldReset(usageData: BudgetUsageData): boolean {
    const resetTime = this.settings.resetTime ?? '00:00';
    const [resetHour, resetMinute] = resetTime.split(':').map(Number);

    const lastReset = new Date(usageData.lastResetTime);
    const now = new Date();

    // Create today's reset time
    const todayReset = new Date(now);
    todayReset.setHours(resetHour, resetMinute, 0, 0);

    // If current time is past today's reset time and last reset was before today's reset time
    return now >= todayReset && lastReset < todayReset;
  }

  /**
   * Get today's date as YYYY-MM-DD string
   */
  private getTodayDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Calculate time until next budget reset
   */
  private getTimeUntilReset(): string {
    const resetTime = this.settings.resetTime ?? '00:00';
    const [resetHour, resetMinute] = resetTime.split(':').map(Number);

    const now = new Date();
    const nextReset = new Date(now);
    nextReset.setHours(resetHour, resetMinute, 0, 0);

    // If reset time has passed today, set for tomorrow
    if (nextReset <= now) {
      nextReset.setDate(nextReset.getDate() + 1);
    }

    const timeDiff = nextReset.getTime() - now.getTime();
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
}

/**
 * Create a new BudgetTracker instance
 */
export function createBudgetTracker(
  projectRoot: string,
  settings: BudgetSettings,
): BudgetTracker {
  return new BudgetTracker(projectRoot, settings);
}
