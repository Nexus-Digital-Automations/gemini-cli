/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { BudgetSettings } from '../types.js';
/**
 * CLI utility for ML budget operations
 */
export declare class MLBudgetCLI {
    private projectRoot;
    private defaultSettings;
    constructor(projectRoot?: string, settings?: BudgetSettings);
    /**
     * Generate and display budget forecast
     */
    forecast(hours?: number, settings?: BudgetSettings): Promise<void>;
    /**
     * Display optimization suggestions
     */
    optimize(settings?: BudgetSettings): Promise<void>;
    /**
     * Detect and display anomalies
     */
    anomalies(settings?: BudgetSettings): Promise<void>;
    /**
     * Display ML model performance metrics
     */
    metrics(settings?: BudgetSettings): Promise<void>;
    /**
     * Display enhanced usage statistics
     */
    stats(settings?: BudgetSettings): Promise<void>;
    /**
     * Health check for ML system
     */
    health(settings?: BudgetSettings): Promise<void>;
    private displayRecommendationCategory;
    private getRecommendationIcon;
    private getPerformanceIcon;
}
/**
 * Factory function to create CLI instance
 */
export declare function createMLBudgetCLI(projectRoot?: string, settings?: BudgetSettings): MLBudgetCLI;
/**
 * Command-line interface functions for direct usage
 */
export declare const mlBudgetCLI: {
    /**
     * Display budget forecast
     */
    forecast: (hours?: number, projectRoot?: string, settings?: BudgetSettings) => Promise<void>;
    /**
     * Display optimization suggestions
     */
    optimize: (projectRoot?: string, settings?: BudgetSettings) => Promise<void>;
    /**
     * Display anomaly detection results
     */
    anomalies: (projectRoot?: string, settings?: BudgetSettings) => Promise<void>;
    /**
     * Display ML model metrics
     */
    metrics: (projectRoot?: string, settings?: BudgetSettings) => Promise<void>;
    /**
     * Display usage statistics
     */
    stats: (projectRoot?: string, settings?: BudgetSettings) => Promise<void>;
    /**
     * Perform health check
     */
    health: (projectRoot?: string, settings?: BudgetSettings) => Promise<void>;
};
export default MLBudgetCLI;
