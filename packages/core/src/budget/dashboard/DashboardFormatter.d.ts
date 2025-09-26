/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { DashboardConfig, DashboardData, DashboardSections } from './BudgetDashboard.js';
/**
 * Dashboard Formatter for Budget Usage Visualizer
 *
 * Handles the layout, formatting, and visual presentation
 * of all dashboard components and sections.
 */
export declare class DashboardFormatter {
    private config;
    private chartRenderer;
    private readonly PANEL_WIDTH;
    constructor(config: Required<DashboardConfig>);
    /**
     * Format the complete dashboard with all sections
     */
    formatDashboard(data: DashboardData, sections: DashboardSections): string;
    /**
     * Format the dashboard header
     */
    private formatHeader;
    /**
     * Format the summary panel with key metrics
     */
    private formatSummaryPanel;
    /**
     * Format real-time usage section
     */
    private formatRealTimeUsage;
    /**
     * Format budget alerts section
     */
    private formatBudgetAlerts;
    /**
     * Format cost projections section
     */
    private formatCostProjections;
    /**
     * Format historical trends section
     */
    private formatHistoricalTrends;
    /**
     * Format feature analysis section
     */
    private formatFeatureAnalysis;
    /**
     * Format optimization recommendations section
     */
    private formatOptimizationRecommendations;
    /**
     * Format the dashboard footer
     */
    private formatFooter;
    /**
     * Get color for feature based on ROI
     */
    private getFeatureColor;
    /**
     * Get trend icon for cost trends
     */
    private getTrendIcon;
    /**
     * Get color for complexity level
     */
    private getComplexityColor;
}
