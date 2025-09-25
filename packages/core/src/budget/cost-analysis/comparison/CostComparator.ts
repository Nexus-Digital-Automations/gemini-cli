/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from &apos;node:fs/promises&apos;;
import * as path from &apos;node:path&apos;;
import type { FeatureCostEntry } from &apos;../tracking/FeatureCostTracker.js&apos;;
import type { FeatureEfficiencyMetrics } from &apos;../efficiency/EfficiencyAnalyzer.js&apos;;

/**
 * Comparison dimension for cost analysis
 */
export type ComparisonDimension =
  | &apos;feature&apos;
  | &apos;user&apos;
  | &apos;project&apos;
  | &apos;model&apos;
  | &apos;operation&apos;
  | &apos;time_period&apos;
  | &apos;geography&apos;
  | &apos;team&apos;
  | &apos;department&apos;;

/**
 * Benchmarking source types
 */
export type BenchmarkSource =
  | &apos;industry_standard&apos;
  | &apos;organization_average&apos;
  | &apos;best_in_class&apos;
  | &apos;historical_baseline&apos;
  | &apos;peer_group&apos;
  | &apos;external_data&apos;
  | &apos;custom_target&apos;;

/**
 * Statistical significance test results
 */
export interface StatisticalTest {
  /** Test type performed */
  testType: &apos;ttest&apos; | &apos;mannwhitney&apos; | &apos;chi_square&apos; | &apos;anova&apos;;
  /** P-value from statistical test */
  pValue: number;
  /** Test statistic */
  statistic: number;
  /** Degrees of freedom */
  degreesOfFreedom?: number;
  /** Effect size */
  effectSize: number;
  /** Confidence interval */
  confidenceInterval: [number, number];
  /** Statistical significance at 0.05 level */
  isSignificant: boolean;
}

/**
 * Cost comparison result
 */
export interface CostComparison {
  /** Comparison identifier */
  id: string;
  /** Comparison dimension */
  dimension: ComparisonDimension;
  /** Primary entity being compared */
  primary: {
    id: string;
    name: string;
    metrics: ComparisonMetrics;
  };
  /** Comparison targets */
  comparisons: Array<{
    id: string;
    name: string;
    metrics: ComparisonMetrics;
    difference: {
      absolute: number;
      percentage: number;
      direction: &apos;higher&apos; | &apos;lower&apos; | &apos;equal&apos;;
    };
    ranking: {
      position: number;
      percentile: number;
    };
  }>;
  /** Overall comparison summary */
  summary: {
    bestPerformer: string;
    worstPerformer: string;
    averageMetric: number;
    standardDeviation: number;
    coefficientOfVariation: number;
  };
  /** Statistical analysis */
  statistics: StatisticalTest;
  /** Time period for comparison */
  timePeriod: {
    start: string;
    end: string;
  };
  /** Comparison timestamp */
  timestamp: string;
}

/**
 * Comparison metrics for cost analysis
 */
export interface ComparisonMetrics {
  /** Total cost */
  totalCost: number;
  /** Cost per request */
  costPerRequest: number;
  /** Cost per token */
  costPerToken: number;
  /** Request count */
  requestCount: number;
  /** Token usage */
  tokenUsage: number;
  /** Average response time */
  avgResponseTime: number;
  /** Efficiency score */
  efficiencyScore: number;
  /** ROI percentage */
  roi: number;
  /** Value generated */
  valueGenerated: number;
  /** Utilization rate */
  utilizationRate: number;
}

/**
 * Benchmark data point
 */
export interface BenchmarkDataPoint {
  /** Benchmark source */
  source: BenchmarkSource;
  /** Benchmark name */
  name: string;
  /** Metric values */
  metrics: ComparisonMetrics;
  /** Data quality score (0-1) */
  quality: number;
  /** Last updated timestamp */
  lastUpdated: string;
  /** Geographic region */
  region?: string;
  /** Industry sector */
  sector?: string;
  /** Organization size category */
  sizeCategory?: 'small&apos; | &apos;medium&apos; | &apos;large&apos; | &apos;enterprise&apos;;
  /** Confidence in benchmark data */
  confidence: number;
}

/**
 * Benchmarking analysis result
 */
export interface BenchmarkingAnalysis {
  /** Entity being benchmarked */
  entity: {
    id: string;
    name: string;
    metrics: ComparisonMetrics;
  };
  /** Benchmark comparisons */
  benchmarks: Array<{
    benchmark: BenchmarkDataPoint;
    performance: {
      percentile: number;
      zscore: number;
      performance: &apos;excellent&apos; | &apos;above_average&apos; | &apos;average&apos; | &apos;below_average&apos; | &apos;poor&apos;;
      gap: number;
      gapPercentage: number;
    };
  }>;
  /** Overall benchmarking score */
  overallScore: {
    composite: number;
    grade: &apos;A+&apos; | &apos;A' | &apos;A-&apos; | &apos;B+&apos; | &apos;B' | &apos;B-&apos; | &apos;C+&apos; | &apos;C' | &apos;C-&apos; | &apos;D' | &apos;F';
    ranking: string;
  };
  /** Improvement recommendations */
  recommendations: BenchmarkRecommendation[];
  /** Analysis metadata */
  metadata: {
    analysisDate: string;
    benchmarkCount: number;
    confidenceScore: number;
  };
}

/**
 * Benchmark-based recommendation
 */
export interface BenchmarkRecommendation {
  /** Recommendation type */
  type: &apos;optimization&apos; | &apos;target_setting&apos; | &apos;resource_allocation&apos; | &apos;process_improvement&apos;;
  /** Priority level */
  priority: &apos;critical&apos; | &apos;high&apos; | &apos;medium&apos; | &apos;low&apos;;
  /** Recommendation title */
  title: string;
  /** Detailed description */
  description: string;
  /** Target metric improvement */
  targetImprovement: {
    metric: keyof ComparisonMetrics;
    currentValue: number;
    targetValue: number;
    improvementPercentage: number;
  };
  /** Expected impact */
  expectedImpact: {
    costSaving: number;
    efficiencyGain: number;
    timeframe: string;
  };
  /** Implementation complexity */
  complexity: &apos;low&apos; | &apos;medium&apos; | &apos;high&apos;;
  /** Success probability */
  successProbability: number;
}

/**
 * Cost comparison configuration
 */
export interface CostComparatorConfig {
  /** Data storage directory */
  dataDir: string;
  /** Enable detailed logging */
  enableLogging: boolean;
  /** Default benchmark sources */
  defaultBenchmarkSources: BenchmarkSource[];
  /** Statistical significance level */
  significanceLevel: number;
  /** Minimum sample size for comparison */
  minSampleSize: number;
  /** Cache duration for benchmarks in hours */
  benchmarkCacheDuration: number;
}

/**
 * Advanced cost comparison and benchmarking system
 *
 * Provides comprehensive cost comparison across dimensions,
 * statistical analysis, and benchmarking against industry standards.
 */
export class CostComparator {
  private config: CostComparatorConfig;
  private benchmarkDataFile: string;
  private comparisonHistoryFile: string;

  constructor(config: CostComparatorConfig) {
    this.config = {
      defaultBenchmarkSources: [&apos;industry_standard&apos;, &apos;organization_average&apos;],
      significanceLevel: 0.05,
      minSampleSize: 10,
      benchmarkCacheDuration: 24, // 24 hours
      ...config,
    };
    this.benchmarkDataFile = path.join(this.config.dataDir, &apos;benchmark-_data.json&apos;);
    this.comparisonHistoryFile = path.join(this.config.dataDir, &apos;comparison-history.jsonl&apos;);
  }

  /**
   * Compare costs across specified dimension
   */
  async compareCosts(
    entities: Array<{
      id: string;
      name: string;
      costs: FeatureCostEntry[];
    }>,
    dimension: ComparisonDimension,
    timePeriod: { start: string; end: string }
  ): Promise<CostComparison> {
    const logger = this.getLogger();
    logger.info(&apos;CostComparator.compareCosts - Starting cost comparison&apos;, {
      entitiesCount: entities.length,
      dimension,
      timePeriod,
    });

    try {
      // Calculate metrics for each entity
      const entityMetrics = entities.map(entity => ({
        id: entity.id,
        name: entity.name,
        metrics: this.calculateComparisonMetrics(entity.costs),
      }));

      if (entityMetrics.length < 2) {
        throw new Error(&apos;At least two entities required for comparison&apos;);
      }

      const primary = entityMetrics[0];
      const comparisons = entityMetrics.slice(1).map((entity, _index) => {
        const difference = this.calculateDifference(primary.metrics, entity.metrics);
        const ranking = this.calculateRanking(entity, entityMetrics);

        return {
          id: entity.id,
          name: entity.name,
          metrics: entity.metrics,
          difference,
          ranking,
        };
      });

      // Calculate summary statistics
      const _allMetrics = entityMetrics.map(e => e.metrics.totalCost);
      const summary = this.calculateSummary(entityMetrics);

      // Perform statistical analysis
      const statistics = this.performStatisticalTest(entityMetrics);

      const comparison: CostComparison = {
        id: `comparison_${Date.now()}`,
        dimension,
        primary,
        comparisons,
        summary,
        statistics,
        timePeriod,
        timestamp: new Date().toISOString(),
      };

      // Record comparison history
      await this.recordComparison(comparison);

      logger.info(&apos;CostComparator.compareCosts - Comparison completed&apos;, {
        comparisonId: comparison.id,
        entitiesCompared: entities.length,
        bestPerformer: summary.bestPerformer,
      });

      return comparison;
    } catch (_error) {
      logger.error(&apos;CostComparator.compareCosts - Comparison failed&apos;, {
        _error: error instanceof Error ? error.message : String(_error),
        dimension,
      });
      throw error;
    }
  }

  /**
   * Perform benchmarking analysis against industry standards
   */
  async performBenchmarking(
    entity: {
      id: string;
      name: string;
      costs: FeatureCostEntry[];
      _efficiencyMetrics?: FeatureEfficiencyMetrics;
    },
    sources: BenchmarkSource[] = this.config.defaultBenchmarkSources
  ): Promise<BenchmarkingAnalysis> {
    const logger = this.getLogger();
    logger.info(&apos;CostComparator.performBenchmarking - Starting benchmarking analysis&apos;, {
      entityId: entity.id,
      sources,
    });

    try {
      // Calculate entity metrics
      const entityMetrics = this.calculateComparisonMetrics(entity.costs);

      // Load benchmark data
      const benchmarkData = await this.loadBenchmarkData(sources);

      if (benchmarkData.length === 0) {
        throw new Error(&apos;No benchmark _data available for comparison&apos;);
      }

      // Perform benchmarking comparisons
      const benchmarkComparisons = benchmarkData.map(benchmark => ({
        benchmark,
        performance: this.calculateBenchmarkPerformance(entityMetrics, benchmark.metrics),
      }));

      // Calculate overall score
      const overallScore = this.calculateOverallBenchmarkScore(benchmarkComparisons);

      // Generate recommendations
      const recommendations = this.generateBenchmarkRecommendations(
        entityMetrics,
        benchmarkComparisons
      );

      const analysis: BenchmarkingAnalysis = {
        entity: {
          id: entity.id,
          name: entity.name,
          metrics: entityMetrics,
        },
        benchmarks: benchmarkComparisons,
        overallScore,
        recommendations,
        metadata: {
          analysisDate: new Date().toISOString(),
          benchmarkCount: benchmarkData.length,
          confidenceScore: benchmarkComparisons.reduce((sum, b) => sum + b.benchmark.confidence, 0) / benchmarkComparisons.length,
        },
      };

      logger.info(&apos;CostComparator.performBenchmarking - Benchmarking completed&apos;, {
        entityId: entity.id,
        overallGrade: overallScore.grade,
        recommendationCount: recommendations.length,
      });

      return analysis;
    } catch (_error) {
      logger.error(&apos;CostComparator.performBenchmarking - Benchmarking failed&apos;, {
        _error: error instanceof Error ? error.message : String(_error),
        entityId: entity.id,
      });
      throw error;
    }
  }

  /**
   * Generate cost comparison report across multiple dimensions
   */
  async generateComparisonReport(
    entities: Array<{
      id: string;
      name: string;
      costs: FeatureCostEntry[];
    }>,
    dimensions: ComparisonDimension[],
    timePeriod: { start: string; end: string }
  ): Promise<{
    comparisons: CostComparison[];
    crossDimensionalAnalysis: {
      correlations: Array<{
        dimension1: ComparisonDimension;
        dimension2: ComparisonDimension;
        correlation: number;
        significance: number;
      }>;
      patterns: string[];
      insights: string[];
    };
    executiveSummary: {
      keyFindings: string[];
      recommendations: string[];
      riskFactors: string[];
      opportunities: string[];
    };
  }> {
    const logger = this.getLogger();
    logger.info(&apos;CostComparator.generateComparisonReport - Generating comprehensive report&apos;, {
      entitiesCount: entities.length,
      dimensions,
    });

    try {
      // Perform comparisons across all dimensions
      const comparisons = await Promise.all(
        dimensions.map(dimension =>
          this.compareCosts(entities, dimension, timePeriod)
        )
      );

      // Analyze cross-dimensional relationships
      const crossDimensionalAnalysis = this.analyzeCrossDimensionalRelationships(comparisons);

      // Generate executive summary
      const executiveSummary = this.generateExecutiveSummary(comparisons, crossDimensionalAnalysis);

      logger.info(&apos;CostComparator.generateComparisonReport - Report generated&apos;, {
        comparisonsCount: comparisons.length,
        keyFindingsCount: executiveSummary.keyFindings.length,
      });

      return {
        comparisons,
        crossDimensionalAnalysis,
        executiveSummary,
      };
    } catch (_error) {
      logger.error(&apos;CostComparator.generateComparisonReport - Report generation failed&apos;, {
        _error: error instanceof Error ? error.message : String(_error),
      });
      throw error;
    }
  }

  /**
   * Calculate comparison metrics from cost entries
   */
  private calculateComparisonMetrics(costs: FeatureCostEntry[]): ComparisonMetrics {
    if (costs.length === 0) {
      return {
        totalCost: 0,
        costPerRequest: 0,
        costPerToken: 0,
        requestCount: 0,
        tokenUsage: 0,
        avgResponseTime: 0,
        efficiencyScore: 0,
        roi: 0,
        valueGenerated: 0,
        utilizationRate: 0,
      };
    }

    const totalCost = costs.reduce((sum, cost) => sum + cost.cost, 0);
    const _totalTokens = costs.reduce((sum, cost) => sum + (cost.tokens || 0), 0);
    const totalResponseTime = costs.reduce((sum, cost) => sum + (cost.responseTime || 0), 0);
    const _requestCount = costs.length;

    // Calculate efficiency score (simplified)
    const avgCostPerRequest = totalCost / requestCount;
    const avgCostPerToken = totalTokens > 0 ? totalCost / totalTokens : 0;
    const avgResponseTime = totalResponseTime / requestCount;

    const efficiencyScore = this.calculateEfficiencyScore(
      avgCostPerRequest,
      avgCostPerToken,
      avgResponseTime
    );

    return {
      totalCost,
      costPerRequest: avgCostPerRequest,
      costPerToken: avgCostPerToken,
      requestCount,
      tokenUsage: totalTokens,
      avgResponseTime,
      efficiencyScore,
      roi: 0, // Would need business value data
      valueGenerated: 0, // Would need business value data
      utilizationRate: this.calculateUtilizationRate(costs),
    };
  }

  /**
   * Calculate efficiency score from metrics
   */
  private calculateEfficiencyScore(
    costPerRequest: number,
    costPerToken: number,
    avgResponseTime: number
  ): number {
    // Normalize metrics to 0-1 scale and combine
    const costScore = Math.max(0, 1 - (costPerRequest / 10)); // Assume $10 per request is very expensive
    const tokenScore = Math.max(0, 1 - (costPerToken / 0.01)); // Assume $0.01 per token is expensive
    const timeScore = Math.max(0, 1 - (avgResponseTime / 5000)); // Assume 5 seconds is very slow

    return (costScore * 0.4 + tokenScore * 0.3 + timeScore * 0.3);
  }

  /**
   * Calculate utilization rate from costs
   */
  private calculateUtilizationRate(costs: FeatureCostEntry[]): number {
    if (costs.length === 0) return 0;

    // Simple utilization based on request consistency
    const timeSpan = this.getTimeSpanHours(costs);
    const expectedRequests = timeSpan * 0.5; // Assume 0.5 requests per hour is baseline
    const actualRequests = costs.length;

    return Math.min(actualRequests / expectedRequests, 1.0);
  }

  /**
   * Get time span in hours
   */
  private getTimeSpanHours(costs: FeatureCostEntry[]): number {
    if (costs.length < 2) return 1;

    const timestamps = costs.map(c => new Date(c.timestamp).getTime());
    const span = (Math.max(...timestamps) - Math.min(...timestamps)) / (1000 * 60 * 60); // Hours
    return Math.max(span, 1);
  }

  /**
   * Calculate difference between metrics
   */
  private calculateDifference(
    primary: ComparisonMetrics,
    comparison: ComparisonMetrics
  ): {
    absolute: number;
    percentage: number;
    direction: &apos;higher&apos; | &apos;lower&apos; | &apos;equal&apos;;
  } {
    const absoluteDifference = comparison.totalCost - primary.totalCost;
    const percentageDifference = primary.totalCost > 0
      ? (absoluteDifference / primary.totalCost) * 100
      : 0;

    let direction: &apos;higher&apos; | &apos;lower&apos; | &apos;equal&apos;;
    if (Math.abs(percentageDifference) < 1) {
      direction = &apos;equal&apos;;
    } else {
      direction = absoluteDifference > 0 ? &apos;higher&apos; : &apos;lower&apos;;
    }

    return {
      absolute: Math.abs(absoluteDifference),
      percentage: Math.abs(percentageDifference),
      direction,
    };
  }

  /**
   * Calculate ranking for entity
   */
  private calculateRanking(
    entity: { metrics: ComparisonMetrics },
    allEntities: Array<{ metrics: ComparisonMetrics }>
  ): { position: number; percentile: number } {
    const sortedByCost = allEntities.sort((a, b) => a.metrics.totalCost - b.metrics.totalCost);
    const position = sortedByCost.findIndex(e => e.metrics.totalCost === entity.metrics.totalCost) + 1;
    const percentile = ((allEntities.length - position + 1) / allEntities.length) * 100;

    return { position, percentile };
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(entities: Array<{ id: string; name: string; metrics: ComparisonMetrics }>): {
    bestPerformer: string;
    worstPerformer: string;
    averageMetric: number;
    standardDeviation: number;
    coefficientOfVariation: number;
  } {
    const costs = entities.map(e => e.metrics.totalCost);
    const avgCost = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;

    const variance = costs.reduce((sum, cost) => sum + Math.pow(cost - avgCost, 2), 0) / costs.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = avgCost > 0 ? standardDeviation / avgCost : 0;

    const bestPerformer = entities.reduce((best, current) =>
      current.metrics.efficiencyScore > best.metrics.efficiencyScore ? current : best
    ).name;

    const worstPerformer = entities.reduce((worst, current) =>
      current.metrics.efficiencyScore < worst.metrics.efficiencyScore ? current : worst
    ).name;

    return {
      bestPerformer,
      worstPerformer,
      averageMetric: avgCost,
      standardDeviation,
      coefficientOfVariation,
    };
  }

  /**
   * Perform statistical test
   */
  private performStatisticalTest(entities: Array<{ metrics: ComparisonMetrics }>): StatisticalTest {
    // Simplified statistical test - would need more sophisticated implementation
    const costs = entities.map(e => e.metrics.totalCost);
    const mean = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
    const variance = costs.reduce((sum, cost) => sum + Math.pow(cost - mean, 2), 0) / (costs.length - 1);
    const stdDev = Math.sqrt(variance);

    // Simple t-test approximation
    const tStatistic = mean / (stdDev / Math.sqrt(costs.length));
    const pValue = this.approximatePValue(tStatistic, costs.length - 1);

    return {
      testType: &apos;ttest&apos;,
      pValue,
      statistic: tStatistic,
      degreesOfFreedom: costs.length - 1,
      effectSize: mean / stdDev, // Cohen's d approximation
      confidenceInterval: [
        mean - 1.96 * (stdDev / Math.sqrt(costs.length)),
        mean + 1.96 * (stdDev / Math.sqrt(costs.length)),
      ],
      isSignificant: pValue < this.config.significanceLevel,
    };
  }

  /**
   * Approximate p-value for t-test
   */
  private approximatePValue(tStat: number, _df: number): number {
    // Very simplified p-value approximation
    // In practice, would use proper statistical libraries
    const absTStat = Math.abs(tStat);
    if (absTStat > 3) return 0.001;
    if (absTStat > 2.5) return 0.01;
    if (absTStat > 2) return 0.05;
    if (absTStat > 1.5) return 0.1;
    return 0.2;
  }

  /**
   * Load benchmark data
   */
  private async loadBenchmarkData(sources: BenchmarkSource[]): Promise<BenchmarkDataPoint[]> {
    try {
      const content = await fs.readFile(this.benchmarkDataFile, &apos;utf-8&apos;);
      const allBenchmarks: BenchmarkDataPoint[] = JSON.parse(content);

      return allBenchmarks.filter(benchmark =>
        sources.includes(benchmark.source) &&
        new Date(benchmark.lastUpdated).getTime() > Date.now() - (this.config.benchmarkCacheDuration * 60 * 60 * 1000)
      );
    } catch (_error) {
      return this.getDefaultBenchmarkData(sources);
    }
  }

  /**
   * Get default benchmark data
   */
  private getDefaultBenchmarkData(sources: BenchmarkSource[]): BenchmarkDataPoint[] {
    return sources.map(source => ({
      source,
      name: `Default ${source} Benchmark`,
      metrics: {
        totalCost: 1000,
        costPerRequest: 1.0,
        costPerToken: 0.001,
        _requestCount: 1000,
        tokenUsage: 1000000,
        avgResponseTime: 1000,
        efficiencyScore: 0.7,
        roi: 15,
        valueGenerated: 15000,
        utilizationRate: 0.8,
      },
      quality: 0.7,
      lastUpdated: new Date().toISOString(),
      confidence: 0.8,
    }));
  }

  /**
   * Calculate benchmark performance
   */
  private calculateBenchmarkPerformance(
    entityMetrics: ComparisonMetrics,
    benchmarkMetrics: ComparisonMetrics
  ): {
    percentile: number;
    zscore: number;
    performance: &apos;excellent&apos; | &apos;above_average&apos; | &apos;average&apos; | &apos;below_average&apos; | &apos;poor&apos;;
    gap: number;
    gapPercentage: number;
  } {
    const efficiencyGap = entityMetrics.efficiencyScore - benchmarkMetrics.efficiencyScore;
    const gapPercentage = benchmarkMetrics.efficiencyScore > 0
      ? (efficiencyGap / benchmarkMetrics.efficiencyScore) * 100
      : 0;

    // Calculate z-score (simplified)
    const zscore = efficiencyGap / 0.2; // Assume std dev of 0.2

    // Calculate percentile (simplified)
    const percentile = Math.max(0, Math.min(100, 50 + (zscore * 20)));

    // Determine performance category
    let performance: &apos;excellent&apos; | &apos;above_average&apos; | &apos;average&apos; | &apos;below_average&apos; | &apos;poor&apos;;
    if (percentile >= 90) performance = &apos;excellent&apos;;
    else if (percentile >= 70) performance = &apos;above_average&apos;;
    else if (percentile >= 30) performance = &apos;average&apos;;
    else if (percentile >= 10) performance = &apos;below_average&apos;;
    else performance = &apos;poor&apos;;

    return {
      percentile,
      zscore,
      performance,
      gap: Math.abs(efficiencyGap),
      gapPercentage: Math.abs(gapPercentage),
    };
  }

  /**
   * Calculate overall benchmark score
   */
  private calculateOverallBenchmarkScore(
    benchmarkComparisons: Array<{
      benchmark: BenchmarkDataPoint;
      performance: {
        percentile: number;
        performance: &apos;excellent&apos; | &apos;above_average&apos; | &apos;average&apos; | &apos;below_average&apos; | &apos;poor&apos;;
      };
    }>
  ): {
    composite: number;
    grade: &apos;A+&apos; | &apos;A' | &apos;A-&apos; | &apos;B+&apos; | &apos;B' | &apos;B-&apos; | &apos;C+&apos; | &apos;C' | &apos;C-&apos; | &apos;D' | &apos;F';
    ranking: string;
  } {
    const weightedScore = benchmarkComparisons.reduce((sum, comparison) => sum + (comparison.performance.percentile * comparison.benchmark.confidence), 0);

    const totalWeight = benchmarkComparisons.reduce((sum, comparison) => sum + comparison.benchmark.confidence, 0);
    const composite = totalWeight > 0 ? weightedScore / totalWeight : 50;

    // Determine grade
    let grade: &apos;A+&apos; | &apos;A' | &apos;A-&apos; | &apos;B+&apos; | &apos;B' | &apos;B-&apos; | &apos;C+&apos; | &apos;C' | &apos;C-&apos; | &apos;D' | &apos;F';
    if (composite >= 97) grade = &apos;A+&apos;;
    else if (composite >= 93) grade = &apos;A';
    else if (composite >= 90) grade = &apos;A-&apos;;
    else if (composite >= 87) grade = &apos;B+&apos;;
    else if (composite >= 83) grade = &apos;B';
    else if (composite >= 80) grade = &apos;B-&apos;;
    else if (composite >= 77) grade = &apos;C+&apos;;
    else if (composite >= 73) grade = &apos;C';
    else if (composite >= 70) grade = &apos;C-&apos;;
    else if (composite >= 60) grade = &apos;D';
    else grade = &apos;F';

    // Determine ranking description
    let ranking: string;
    if (composite >= 90) ranking = &apos;Top 10%&apos;;
    else if (composite >= 75) ranking = &apos;Top 25%&apos;;
    else if (composite >= 50) ranking = &apos;Above Average&apos;;
    else if (composite >= 25) ranking = &apos;Below Average&apos;;
    else ranking = &apos;Bottom 25%&apos;;

    return { composite, grade, ranking };
  }

  /**
   * Generate benchmark-based recommendations
   */
  private generateBenchmarkRecommendations(
    entityMetrics: ComparisonMetrics,
    benchmarkComparisons: Array<{
      benchmark: BenchmarkDataPoint;
      performance: {
        performance: &apos;excellent&apos; | &apos;above_average&apos; | &apos;average&apos; | &apos;below_average&apos; | &apos;poor&apos;;
        gap: number;
      };
    }>
  ): BenchmarkRecommendation[] {
    const recommendations: BenchmarkRecommendation[] = [];

    // Find underperforming areas
    const poorPerformers = benchmarkComparisons.filter(b =>
      b.performance.performance === &apos;poor&apos; || b.performance.performance === &apos;below_average&apos;
    );

    for (const poor of poorPerformers) {
      const benchmark = poor.benchmark;
      const gap = poor.performance.gap;

      if (entityMetrics.costPerRequest > benchmark.metrics.costPerRequest) {
        recommendations.push({
          type: &apos;optimization&apos;,
          priority: gap > 0.5 ? &apos;critical&apos; : &apos;high&apos;,
          title: &apos;Reduce Cost Per Request&apos;,
          description: `Current cost per request (${entityMetrics.costPerRequest.toFixed(3)}) is significantly higher than ${benchmark.name} benchmark (${benchmark.metrics.costPerRequest.toFixed(3)})`,
          targetImprovement: {
            metric: &apos;costPerRequest&apos;,
            currentValue: entityMetrics.costPerRequest,
            targetValue: benchmark.metrics.costPerRequest,
            improvementPercentage: ((entityMetrics.costPerRequest - benchmark.metrics.costPerRequest) / entityMetrics.costPerRequest) * 100,
          },
          expectedImpact: {
            costSaving: (entityMetrics.costPerRequest - benchmark.metrics.costPerRequest) * entityMetrics.requestCount,
            efficiencyGain: gap * 100,
            timeframe: &apos;3-6 months&apos;,
          },
          complexity: gap > 0.5 ? &apos;high&apos; : &apos;medium&apos;,
          successProbability: 0.7,
        });
      }

      if (entityMetrics.avgResponseTime > benchmark.metrics.avgResponseTime) {
        recommendations.push({
          type: &apos;performance_improvement&apos;,
          priority: &apos;medium&apos;,
          title: &apos;Improve Response Time&apos;,
          description: `Response time optimization needed to match ${benchmark.name} standards`,
          targetImprovement: {
            metric: &apos;avgResponseTime&apos;,
            currentValue: entityMetrics.avgResponseTime,
            targetValue: benchmark.metrics.avgResponseTime,
            improvementPercentage: ((entityMetrics.avgResponseTime - benchmark.metrics.avgResponseTime) / entityMetrics.avgResponseTime) * 100,
          },
          expectedImpact: {
            costSaving: 0,
            efficiencyGain: 15,
            timeframe: &apos;2-4 months&apos;,
          },
          complexity: &apos;medium&apos;,
          successProbability: 0.8,
        });
      }
    }

    return recommendations;
  }

  /**
   * Analyze cross-dimensional relationships
   */
  private analyzeCrossDimensionalRelationships(comparisons: CostComparison[]): {
    correlations: Array<{
      dimension1: ComparisonDimension;
      dimension2: ComparisonDimension;
      correlation: number;
      significance: number;
    }>;
    patterns: string[];
    insights: string[];
  } {
    const correlations: Array<{
      dimension1: ComparisonDimension;
      dimension2: ComparisonDimension;
      correlation: number;
      significance: number;
    }> = [];

    // Calculate correlations between dimensions (simplified)
    for (let i = 0; i < comparisons.length; i++) {
      for (let j = i + 1; j < comparisons.length; j++) {
        const correlation = this.calculateCorrelation(
          comparisons[i].comparisons.map(c => c.metrics.totalCost),
          comparisons[j].comparisons.map(c => c.metrics.totalCost)
        );

        correlations.push({
          dimension1: comparisons[i].dimension,
          dimension2: comparisons[j].dimension,
          correlation,
          significance: Math.abs(correlation) > 0.5 ? 0.05 : 0.1,
        });
      }
    }

    // Identify patterns
    const patterns: string[] = [];
    const highCorrelations = correlations.filter(c => Math.abs(c.correlation) > 0.7);
    for (const corr of highCorrelations) {
      patterns.push(
        `Strong ${corr.correlation > 0 ? &apos;positive&apos; : &apos;negative&apos;} correlation between ${corr.dimension1} and ${corr.dimension2} costs`
      );
    }

    // Generate insights
    const insights: string[] = [];
    const bestPerformers = comparisons.map(c => c.summary.bestPerformer);
    const mostCommonBest = this.findMostCommon(bestPerformers);
    if (mostCommonBest) {
      insights.push(`${mostCommonBest} consistently performs well across multiple dimensions`);
    }

    return { correlations, patterns, insights };
  }

  /**
   * Calculate correlation coefficient
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Find most common element
   */
  private findMostCommon(arr: string[]): string | null {
    if (arr.length === 0) return null;

    const counts: Record<string, number> = {};
    for (const item of arr) {
      counts[item] = (counts[item] || 0) + 1;
    }

    let maxCount = 0;
    let mostCommon = &apos;';
    for (const [item, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = item;
      }
    }

    return mostCommon;
  }

  /**
   * Generate executive summary
   */
  private generateExecutiveSummary(
    comparisons: CostComparison[],
    crossAnalysis: { patterns: string[]; insights: string[] }
  ): {
    keyFindings: string[];
    recommendations: string[];
    riskFactors: string[];
    opportunities: string[];
  } {
    const keyFindings: string[] = [];
    const recommendations: string[] = [];
    const riskFactors: string[] = [];
    const opportunities: string[] = [];

    // Key findings from comparisons
    for (const comparison of comparisons) {
      const bestPerformer = comparison.summary.bestPerformer;
      const worstPerformer = comparison.summary.worstPerformer;
      const cvPercent = (comparison.summary.coefficientOfVariation * 100).toFixed(1);

      keyFindings.push(
        `${comparison.dimension}: ${bestPerformer} is the top performer, ${worstPerformer} needs improvement (cost variation: ${cvPercent}%)`
      );

      if (comparison.summary.coefficientOfVariation > 0.5) {
        riskFactors.push(`High cost variability in ${comparison.dimension} dimension (${cvPercent}%)`);
      }

      if (comparison.summary.coefficientOfVariation < 0.2) {
        opportunities.push(`Consistent performance in ${comparison.dimension} - good baseline for optimization`);
      }
    }

    // Add cross-dimensional insights
    keyFindings.push(...crossAnalysis.insights);

    // General recommendations
    recommendations.push(
      &apos;Focus optimization efforts on highest-variation cost dimensions&apos;,
      &apos;Implement best practices from top-performing entities across dimensions&apos;,
      &apos;Establish regular benchmarking cycles for continuous improvement&apos;
    );

    return { keyFindings, recommendations, riskFactors, opportunities };
  }

  /**
   * Record comparison in history
   */
  private async recordComparison(comparison: CostComparison): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.comparisonHistoryFile), { recursive: true });
      const record = JSON.stringify(comparison) + &apos;\n&apos;;
      await fs.appendFile(this.comparisonHistoryFile, record);
    } catch (_error) {
      this.getLogger().error(&apos;Failed to record comparison history&apos;, {
        _error: error instanceof Error ? error.message : String(_error),
      });
    }
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
 * Create a new CostComparator instance
 */
export function createCostComparator(config: CostComparatorConfig): CostComparator {
  return new CostComparator(config);
}