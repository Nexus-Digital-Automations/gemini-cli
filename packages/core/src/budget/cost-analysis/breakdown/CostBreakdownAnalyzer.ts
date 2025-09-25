/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from &apos;node:fs/promises&apos;;
import * as path from &apos;node:path&apos;;
import type { FeatureCostEntry } from &apos;../tracking/FeatureCostTracker.js&apos;;

/**
 * Cost breakdown dimension for analysis
 */
export type CostBreakdownDimension =
  | &apos;operation&apos;
  | &apos;user&apos;
  | &apos;project&apos;
  | 'session&apos;
  | &apos;model&apos;
  | &apos;feature&apos;
  | &apos;time&apos;
  | &apos;geographic&apos;;

/**
 * Time period granularity for breakdown analysis
 */
export type TimeGranularity =
  | &apos;hour&apos;
  | &apos;day&apos;
  | &apos;week&apos;
  | &apos;month&apos;
  | &apos;quarter&apos;
  | &apos;year&apos;;

/**
 * Cost breakdown entry for a specific dimension
 */
export interface CostBreakdownEntry {
  /** Dimension value (e.g., user ID, operation type) */
  dimension: string;
  /** Dimension category */
  dimensionType: CostBreakdownDimension;
  /** Total cost for this dimension */
  totalCost: number;
  /** Request count for this dimension */
  requestCount: number;
  /** Total tokens for this dimension */
  totalTokens: number;
  /** Average cost per request */
  avgCostPerRequest: number;
  /** Cost percentage of total */
  costPercentage: number;
  /** Request percentage of total */
  requestPercentage: number;
  /** Token percentage of total */
  tokenPercentage: number;
  /** First occurrence timestamp */
  firstSeen: string;
  /** Last occurrence timestamp */
  lastSeen: string;
  /** Sub-breakdown by other dimensions */
  subBreakdown?: Record<string, CostBreakdownEntry>;
}

/**
 * Multi-dimensional cost breakdown result
 */
export interface CostBreakdownAnalysis {
  /** Analysis time period */
  timePeriod: {
    start: string;
    end: string;
  };
  /** Primary dimension being analyzed */
  primaryDimension: CostBreakdownDimension;
  /** Total cost across all dimensions */
  totalCost: number;
  /** Total requests across all dimensions */
  totalRequests: number;
  /** Total tokens across all dimensions */
  totalTokens: number;
  /** Breakdown entries sorted by cost */
  breakdown: CostBreakdownEntry[];
  /** Summary statistics */
  statistics: CostBreakdownStatistics;
  /** Top consumers by different metrics */
  topConsumers: {
    byCost: CostBreakdownEntry[];
    byRequests: CostBreakdownEntry[];
    byTokens: CostBreakdownEntry[];
  };
}

/**
 * Statistical analysis of cost breakdown
 */
export interface CostBreakdownStatistics {
  /** Average cost per dimension */
  avgCostPerDimension: number;
  /** Standard deviation of costs */
  costStandardDeviation: number;
  /** Median cost */
  medianCost: number;
  /** 95th percentile cost */
  p95Cost: number;
  /** Cost concentration (Gini coefficient) */
  costConcentration: number;
  /** Most active dimension */
  mostActiveDimension: string;
  /** Most expensive dimension */
  mostExpensiveDimension: string;
  /** Cost distribution by quartiles */
  costQuartiles: {
    q1: number;
    q2: number;
    q3: number;
    q4: number;
  };
}

/**
 * Time-series cost breakdown for trend analysis
 */
export interface TimeSeries {
  /** Time period label */
  period: string;
  /** Timestamp for the period */
  timestamp: string;
  /** Cost for this time period */
  cost: number;
  /** Request count for this time period */
  requests: number;
  /** Token usage for this time period */
  tokens: number;
  /** Breakdown by dimension for this period */
  dimensionBreakdown: Record<string, number>;
}

/**
 * Time-series cost breakdown analysis
 */
export interface TimeSeriesAnalysis {
  /** Time granularity used */
  granularity: TimeGranularity;
  /** Analysis time period */
  timePeriod: {
    start: string;
    end: string;
  };
  /** Primary dimension for breakdown */
  dimension: CostBreakdownDimension;
  /** Time series data points */
  series: TimeSeries[];
  /** Trend analysis */
  trends: {
    costTrend: &apos;increasing&apos; | &apos;decreasing&apos; | 'stable&apos; | &apos;volatile&apos;;
    growthRate: number;
    seasonalPatterns: string[];
    anomalies: TimeSeries[];
  };
}

/**
 * Cost breakdown analyzer configuration
 */
export interface CostBreakdownConfig {
  /** Data storage directory */
  dataDir: string;
  /** Enable detailed logging */
  enableLogging: boolean;
  /** Cache duration in minutes */
  cacheDuration: number;
  /** Maximum entries to process in memory */
  maxEntriesInMemory: number;
}

/**
 * Advanced cost breakdown analysis system
 *
 * Provides multi-dimensional cost analysis across various dimensions
 * including operation types, users, projects, sessions, models, and time periods.
 */
export class CostBreakdownAnalyzer {
  private config: CostBreakdownConfig;
  private cacheDir: string;

  constructor(config: CostBreakdownConfig) {
    this.config = {
      cacheDuration: 15, // 15 minutes default
      maxEntriesInMemory: 100000, // 100k entries max
      ...config,
    };
    this.cacheDir = path.join(this.config.dataDir, &apos;breakdown-cache&apos;);
  }

  /**
   * Analyze cost breakdown by specified dimension
   */
  async analyzeCostBreakdown(
    entries: FeatureCostEntry[],
    dimension: CostBreakdownDimension,
    options?: {
      includeSubBreakdown?: boolean;
      subDimension?: CostBreakdownDimension;
      topN?: number;
    },
  ): Promise<CostBreakdownAnalysis> {
    const logger = this.getLogger();
    logger.info(
      &apos;CostBreakdownAnalyzer.analyzeCostBreakdown - Starting analysis&apos;,
      {
        entriesCount: entries.length,
        dimension,
        options,
      },
    );

    try {
      // Group entries by dimension
      const dimensionMap = new Map<string, FeatureCostEntry[]>();
      let totalCost = 0;
      let totalRequests = 0;
      let _totalTokens = 0;

      for (const entry of entries) {
        const dimensionValue = this.getDimensionValue(entry, dimension);

        if (!dimensionMap.has(dimensionValue)) {
          dimensionMap.set(dimensionValue, []);
        }
        dimensionMap.get(dimensionValue)!.push(entry);

        totalCost += entry.cost;
        totalRequests += 1;
        totalTokens += entry.tokens || 0;
      }

      // Calculate breakdown entries
      const breakdown: CostBreakdownEntry[] = [];
      for (const [dimensionValue, dimensionEntries] of dimensionMap) {
        const entry = await this.createBreakdownEntry(
          dimensionValue,
          dimension,
          dimensionEntries,
          totalCost,
          totalRequests,
          _totalTokens,
          options,
        );
        breakdown.push(entry);
      }

      // Sort by cost (descending)
      breakdown.sort((a, b) => b.totalCost - a.totalCost);

      // Calculate statistics
      const statistics = this.calculateStatistics(breakdown);

      // Get top consumers
      const topN = options?.topN || 10;
      const topConsumers = {
        byCost: [...breakdown]
          .sort((a, b) => b.totalCost - a.totalCost)
          .slice(0, topN),
        byRequests: [...breakdown]
          .sort((a, b) => b.requestCount - a.requestCount)
          .slice(0, topN),
        byTokens: [...breakdown]
          .sort((a, b) => b.totalTokens - a.totalTokens)
          .slice(0, topN),
      };

      const timePeriod = this.getTimePeriod(entries);

      logger.info(
        &apos;CostBreakdownAnalyzer.analyzeCostBreakdown - Analysis completed&apos;,
        {
          dimension,
          breakdownCount: breakdown.length,
          totalCost,
          totalRequests,
        },
      );

      return {
        timePeriod,
        primaryDimension: dimension,
        totalCost,
        totalRequests,
        totalTokens,
        breakdown,
        statistics,
        topConsumers,
      };
    } catch (_error) {
      logger.error(
        &apos;CostBreakdownAnalyzer.analyzeCostBreakdown - Analysis failed&apos;,
        {
          _error: error instanceof Error ? error.message : String(_error),
          dimension,
        },
      );
      throw error;
    }
  }

  /**
   * Analyze time-series cost breakdown
   */
  async analyzeTimeSeries(
    entries: FeatureCostEntry[],
    dimension: CostBreakdownDimension,
    granularity: TimeGranularity,
  ): Promise<TimeSeriesAnalysis> {
    const logger = this.getLogger();
    logger.info(
      &apos;CostBreakdownAnalyzer.analyzeTimeSeries - Starting time series analysis&apos;,
      {
        entriesCount: entries.length,
        dimension,
        granularity,
      },
    );

    try {
      // Group entries by time periods
      const timeMap = new Map<string, FeatureCostEntry[]>();

      for (const entry of entries) {
        const timePeriod = this.getTimePeriodLabel(
          new Date(entry.timestamp),
          granularity,
        );

        if (!timeMap.has(timePeriod)) {
          timeMap.set(timePeriod, []);
        }
        timeMap.get(timePeriod)!.push(entry);
      }

      // Create time series data points
      const series: TimeSeries[] = [];
      for (const [period, periodEntries] of timeMap) {
        const periodCost = periodEntries.reduce((sum, e) => sum + e.cost, 0);
        const periodTokens = periodEntries.reduce(
          (sum, e) => sum + (e.tokens || 0),
          0,
        );

        // Calculate dimension breakdown for this period
        const dimensionBreakdown: Record<string, number> = {};
        const dimensionMap = new Map<string, number>();

        for (const entry of periodEntries) {
          const dimensionValue = this.getDimensionValue(entry, dimension);
          dimensionMap.set(
            dimensionValue,
            (dimensionMap.get(dimensionValue) || 0) + entry.cost,
          );
        }

        for (const [dimValue, cost] of dimensionMap) {
          dimensionBreakdown[dimValue] = cost;
        }

        series.push({
          period,
          timestamp: this.getTimePeriodTimestamp(period, granularity),
          cost: periodCost,
          requests: periodEntries.length,
          tokens: periodTokens,
          dimensionBreakdown,
        });
      }

      // Sort by timestamp
      series.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

      // Analyze trends
      const trends = this.analyzeTrends(series);
      const timePeriod = this.getTimePeriod(entries);

      logger.info(
        &apos;CostBreakdownAnalyzer.analyzeTimeSeries - Time series analysis completed&apos;,
        {
          seriesLength: series.length,
          granularity,
          totalCost: series.reduce((sum, s) => sum + s.cost, 0),
        },
      );

      return {
        granularity,
        timePeriod,
        dimension,
        series,
        trends,
      };
    } catch (_error) {
      logger.error(
        &apos;CostBreakdownAnalyzer.analyzeTimeSeries - Time series analysis failed&apos;,
        {
          _error: error instanceof Error ? error.message : String(_error),
          dimension,
          granularity,
        },
      );
      throw error;
    }
  }

  /**
   * Compare cost breakdowns between different time periods
   */
  async compareBreakdowns(
    entries1: FeatureCostEntry[],
    entries2: FeatureCostEntry[],
    dimension: CostBreakdownDimension,
    _period1Label: string = &apos;Period 1&apos;,
    period2Label: string = &apos;Period 2&apos;,
  ): Promise<{
    period1: CostBreakdownAnalysis;
    period2: CostBreakdownAnalysis;
    comparison: {
      costChange: number;
      costChangePercentage: number;
      requestChange: number;
      tokenChange: number;
      newDimensions: string[];
      removedDimensions: string[];
      topGainers: Array<{
        dimension: string;
        change: number;
        changePercentage: number;
      }>;
      topLosers: Array<{
        dimension: string;
        change: number;
        changePercentage: number;
      }>;
    };
  }> {
    const logger = this.getLogger();
    logger.info(
      &apos;CostBreakdownAnalyzer.compareBreakdowns - Starting comparison&apos;,
      {
        entries1Count: entries1.length,
        entries2Count: entries2.length,
        dimension,
      },
    );

    try {
      // Analyze both periods
      const analysis1 = await this.analyzeCostBreakdown(entries1, dimension);
      const analysis2 = await this.analyzeCostBreakdown(entries2, dimension);

      // Create dimension maps for comparison
      const dim1Map = new Map(analysis1.breakdown.map((b) => [b.dimension, b]));
      const dim2Map = new Map(analysis2.breakdown.map((b) => [b.dimension, b]));

      // Calculate changes
      const costChange = analysis2.totalCost - analysis1.totalCost;
      const costChangePercentage =
        analysis1.totalCost > 0 ? (costChange / analysis1.totalCost) * 100 : 0;

      const requestChange = analysis2.totalRequests - analysis1.totalRequests;
      const tokenChange = analysis2.totalTokens - analysis1.totalTokens;

      // Find new and removed dimensions
      const newDimensions = Array.from(dim2Map.keys()).filter(
        (d) => !dim1Map.has(d),
      );
      const removedDimensions = Array.from(dim1Map.keys()).filter(
        (d) => !dim2Map.has(d),
      );

      // Calculate changes for each dimension
      const changes: Array<{
        dimension: string;
        change: number;
        changePercentage: number;
      }> = [];

      for (const [dimension, entry2] of dim2Map) {
        const entry1 = dim1Map.get(dimension);
        if (entry1) {
          const change = entry2.totalCost - entry1.totalCost;
          const changePercentage =
            entry1.totalCost > 0 ? (change / entry1.totalCost) * 100 : 0;
          changes.push({ dimension, change, changePercentage });
        }
      }

      changes.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

      const topGainers = changes.filter((c) => c.change > 0).slice(0, 5);
      const topLosers = changes.filter((c) => c.change < 0).slice(0, 5);

      logger.info(
        &apos;CostBreakdownAnalyzer.compareBreakdowns - Comparison completed&apos;,
        {
          costChange,
          costChangePercentage,
          newDimensions: newDimensions.length,
          removedDimensions: removedDimensions.length,
        },
      );

      return {
        period1: analysis1,
        period2: analysis2,
        comparison: {
          costChange,
          costChangePercentage,
          requestChange,
          tokenChange,
          newDimensions,
          removedDimensions,
          topGainers,
          topLosers,
        },
      };
    } catch (_error) {
      logger.error(
        &apos;CostBreakdownAnalyzer.compareBreakdowns - Comparison failed&apos;,
        {
          _error: error instanceof Error ? error.message : String(_error),
        },
      );
      throw error;
    }
  }

  /**
   * Get dimension value from a cost entry
   */
  private getDimensionValue(
    entry: FeatureCostEntry,
    dimension: CostBreakdownDimension,
  ): string {
    switch (dimension) {
      case &apos;operation&apos;:
        return entry.operationType || &apos;unknown&apos;;
      case &apos;user&apos;:
        return entry.userId || &apos;anonymous&apos;;
      case &apos;project&apos;:
        return entry.projectId || &apos;default&apos;;
      case 'session&apos;:
        return entry.sessionId || &apos;unknown&apos;;
      case &apos;model&apos;:
        return entry.model || &apos;unknown&apos;;
      case &apos;feature&apos;:
        return entry.featureId || &apos;unknown&apos;;
      case &apos;time&apos;:
        return new Date(entry.timestamp).toISOString().split(&apos;T')[0]; // Daily by default
      case &apos;geographic&apos;:
        return (entry.metadata?.region as string) || &apos;unknown&apos;;
      default:
        return &apos;unknown&apos;;
    }
  }

  /**
   * Create a breakdown entry for a dimension
   */
  private async createBreakdownEntry(
    dimensionValue: string,
    dimensionType: CostBreakdownDimension,
    entries: FeatureCostEntry[],
    totalCost: number,
    totalRequests: number,
    _totalTokens: number,
    options?: {
      includeSubBreakdown?: boolean;
      subDimension?: CostBreakdownDimension;
    },
  ): Promise<CostBreakdownEntry> {
    const entryCost = entries.reduce((sum, e) => sum + e.cost, 0);
    const entryTokens = entries.reduce((sum, e) => sum + (e.tokens || 0), 0);
    const _requestCount = entries.length;

    const timestamps = entries.map((e) => new Date(e.timestamp).getTime());
    const firstSeen = new Date(Math.min(...timestamps)).toISOString();
    const lastSeen = new Date(Math.max(...timestamps)).toISOString();

    const entry: CostBreakdownEntry = {
      dimension: dimensionValue,
      dimensionType,
      totalCost: entryCost,
      requestCount,
      totalTokens: entryTokens,
      avgCostPerRequest: entryCost / requestCount,
      costPercentage: totalCost > 0 ? (entryCost / totalCost) * 100 : 0,
      requestPercentage:
        totalRequests > 0 ? (_requestCount / totalRequests) * 100 : 0,
      tokenPercentage: totalTokens > 0 ? (entryTokens / _totalTokens) * 100 : 0,
      firstSeen,
      lastSeen,
    };

    // Add sub-breakdown if requested
    if (options?.includeSubBreakdown && options.subDimension) {
      const subAnalysis = await this.analyzeCostBreakdown(
        entries,
        options.subDimension,
      );
      entry.subBreakdown = {};
      for (const subEntry of subAnalysis.breakdown) {
        entry.subBreakdown[subEntry.dimension] = subEntry;
      }
    }

    return entry;
  }

  /**
   * Calculate statistical analysis of breakdown
   */
  private calculateStatistics(
    breakdown: CostBreakdownEntry[],
  ): CostBreakdownStatistics {
    const costs = breakdown.map((b) => b.totalCost);
    costs.sort((a, b) => a - b);

    const sum = costs.reduce((a, b) => a + b, 0);
    const mean = sum / costs.length;
    const variance =
      costs.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / costs.length;
    const stdDev = Math.sqrt(variance);

    const median =
      costs.length % 2 === 0
        ? (costs[costs.length / 2 - 1] + costs[costs.length / 2]) / 2
        : costs[Math.floor(costs.length / 2)];

    const p95Index = Math.floor(costs.length * 0.95);
    const p95 = costs[Math.min(p95Index, costs.length - 1)];

    // Calculate Gini coefficient for cost concentration
    const giniCoeff = this.calculateGiniCoefficient(costs);

    const mostActive = breakdown.reduce((max, b) =>
      b.requestCount > max.requestCount ? b : max,
    );
    const mostExpensive = breakdown.reduce((max, b) =>
      b.totalCost > max.totalCost ? b : max,
    );

    // Calculate quartiles
    const q1Index = Math.floor(costs.length * 0.25);
    const q3Index = Math.floor(costs.length * 0.75);

    return {
      avgCostPerDimension: mean,
      costStandardDeviation: stdDev,
      medianCost: median,
      p95Cost: p95,
      costConcentration: giniCoeff,
      mostActiveDimension: mostActive.dimension,
      mostExpensiveDimension: mostExpensive.dimension,
      costQuartiles: {
        q1: costs[q1Index] || 0,
        q2: median,
        q3: costs[q3Index] || 0,
        q4: costs[costs.length - 1] || 0,
      },
    };
  }

  /**
   * Calculate Gini coefficient for cost concentration
   */
  private calculateGiniCoefficient(values: number[]): number {
    if (values.length === 0) return 0;

    const sortedValues = [...values].sort((a, b) => a - b);
    const n = sortedValues.length;
    const sum = sortedValues.reduce((a, b) => a + b, 0);

    if (sum === 0) return 0;

    let numerator = 0;
    for (let i = 0; i < n; i++) {
      numerator += (2 * (i + 1) - n - 1) * sortedValues[i];
    }

    return numerator / (n * sum);
  }

  /**
   * Get time period from entries
   */
  private getTimePeriod(entries: FeatureCostEntry[]): {
    start: string;
    end: string;
  } {
    if (entries.length === 0) {
      const now = new Date().toISOString();
      return { start: now, end: now };
    }

    const timestamps = entries.map((e) => new Date(e.timestamp).getTime());
    return {
      start: new Date(Math.min(...timestamps)).toISOString(),
      end: new Date(Math.max(...timestamps)).toISOString(),
    };
  }

  /**
   * Get time period label based on granularity
   */
  private getTimePeriodLabel(date: Date, granularity: TimeGranularity): string {
    switch (granularity) {
      case &apos;hour&apos;:
        return date.toISOString().substring(0, 13) + &apos;:00:00Z&apos;;
      case &apos;day&apos;:
        return date.toISOString().substring(0, 10);
      case &apos;week&apos;:
      {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().substring(0, 10) + &apos;_week&apos;;
      case &apos;month&apos;:
        return date.toISOString().substring(0, 7);
      case &apos;quarter&apos;:
      {
        const quarter = Math.floor((date.getMonth() + 3) / 3);
        return `${date.getFullYear()
        default:
          break;}-Q${quarter}`;
      case &apos;year&apos;:
        return date.getFullYear().toString();
      default:
        return date.toISOString().substring(0, 10);
    }
  }

  /**
   * Get timestamp for a time period label
   */
  private getTimePeriodTimestamp(
    period: string,
    granularity: TimeGranularity,
  ): string {
    switch (granularity) {
      case &apos;hour&apos;:
        return period;
      case &apos;day&apos;:
        return period + &apos;T00:00:00Z&apos;;
      case &apos;week&apos;:
        return period.replace(&apos;_week&apos;, &apos;T00:00:00Z&apos;);
      case &apos;month&apos;:
        return period + &apos;-01T00:00:00Z&apos;;
      case &apos;quarter&apos;:
      {
        const [year, quarter] = period.split(&apos;-Q&apos;);
        const month = (parseInt(quarter, 10) - 1) * 3 + 1;
        return `${year
        default:
          break;}-${month.toString().padStart(2, &apos;0')}-01T00:00:00Z`;
      case &apos;year&apos;:
        return period + &apos;-01-01T00:00:00Z&apos;;
      default:
        return period + &apos;T00:00:00Z&apos;;
    }
  }

  /**
   * Analyze trends in time series data
   */
  private analyzeTrends(series: TimeSeries[]): {
    costTrend: &apos;increasing&apos; | &apos;decreasing&apos; | 'stable&apos; | &apos;volatile&apos;;
    growthRate: number;
    seasonalPatterns: string[];
    anomalies: TimeSeries[];
  } {
    if (series.length < 2) {
      return {
        costTrend: 'stable&apos;,
        growthRate: 0,
        seasonalPatterns: [],
        anomalies: [],
      };
    }

    const costs = series.map((s) => s.cost);
    const firstCost = costs[0];
    const lastCost = costs[costs.length - 1];

    // Calculate linear regression slope
    const n = costs.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = costs.reduce((a, b) => a + b, 0);
    const sumXY = costs.reduce((sum, cost, i) => sum + i * cost, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgCost = sumY / n;

    // Determine trend
    let trend: &apos;increasing&apos; | &apos;decreasing&apos; | 'stable&apos; | &apos;volatile&apos;;
    const slopeThreshold = avgCost * 0.05; // 5% of average cost

    if (Math.abs(slope) < slopeThreshold) {
      // Check volatility
      const variance =
        costs.reduce((sum, cost) => sum + Math.pow(cost - avgCost, 2), 0) / n;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = stdDev / avgCost;

      trend = coefficientOfVariation > 0.3 ? &apos;volatile&apos; : 'stable&apos;;
    } else {
      trend = slope > 0 ? &apos;increasing&apos; : &apos;decreasing&apos;;
    }

    // Calculate growth rate
    const growthRate =
      firstCost > 0 ? ((lastCost - firstCost) / firstCost) * 100 : 0;

    // Basic anomaly detection using z-score
    const stdDev = Math.sqrt(
      costs.reduce((sum, cost) => sum + Math.pow(cost - avgCost, 2), 0) / n,
    );
    const anomalies = series.filter(
      (s) => Math.abs(s.cost - avgCost) > 2 * stdDev,
    );

    return {
      costTrend: trend,
      growthRate,
      seasonalPatterns: [], // Would require more sophisticated analysis
      anomalies,
    };
  }

  /**
   * Get logger instance
   */
  private getLogger() {
    return {
      info: (message: string, meta?: Record<string, unknown>) => {
        if (this.config.enableLogging) {
          console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta) : &apos;');
        }
      },
      warn: (message: string, meta?: Record<string, unknown>) => {
        if (this.config.enableLogging) {
          console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : &apos;');
        }
      },
      error: (message: string, meta?: Record<string, unknown>) => {
        console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta) : &apos;');
      },
    };
  }
}

/**
 * Create a new CostBreakdownAnalyzer instance
 */
export function createCostBreakdownAnalyzer(
  config: CostBreakdownConfig,
): CostBreakdownAnalyzer {
  return new CostBreakdownAnalyzer(config);
}
