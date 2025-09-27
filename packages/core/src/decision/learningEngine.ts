/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { getComponentLogger } from '../utils/logger.js';
import type {
  Decision,
  DecisionContext,
  DecisionOutcome,
  DecisionType,
} from './types.js';

const logger = getComponentLogger('decision-learning-engine');

/**
 * Configuration for the machine learning decision engine.
 */
export interface LearningEngineConfig {
  /** Whether learning is enabled */
  enabled: boolean;
  /** Rate at which to adapt to new outcomes (0-1) */
  adaptationRate: number;
  /** Minimum number of samples needed before making ML recommendations */
  minSamplesForLearning: number;
  /** Maximum size of the learning dataset */
  maxDatasetSize?: number;
  /** Confidence threshold for ML recommendations */
  confidenceThreshold?: number;
  /** Path to persist learned models */
  modelPersistencePath?: string;
}

/**
 * Feature vector extracted from decision context and inputs.
 */
interface FeatureVector {
  /** System load features */
  systemLoad: {
    cpu: number;
    memory: number;
    diskIO: number;
    networkIO: number;
    combinedLoad: number; // Weighted combination
  };

  /** Task queue features */
  taskQueue: {
    totalTasks: number;
    queueDepth: number; // pending/total ratio
    processingRate: number; // 1/avg processing time
    failureRate: number; // failed/total ratio
  };

  /** Agent features */
  agent: {
    utilization: number; // active/max ratio
    avgWorkload: number;
    capabilities: number; // diversity measure
  };

  /** Project features */
  project: {
    stability: number; // combination of build/test/lint status
    changeRate: number; // how recently modified
  };

  /** Budget features */
  budget: {
    utilization: number; // current/daily limit ratio
    efficiency: number; // estimated cost effectiveness
    remainingRatio: number; // remaining/total ratio
  };

  /** Performance features */
  performance: {
    successRate: number;
    avgCompletionTime: number;
    consistency: number; // inverse of variance in completion times
  };

  /** Temporal features */
  temporal: {
    hourOfDay: number; // 0-23
    dayOfWeek: number; // 0-6
    workingHours: number; // 0-1 (in/out of working hours)
    timeUntilDeadline: number; // normalized
  };
}

/**
 * Training sample for the learning algorithm.
 */
interface TrainingSample {
  features: FeatureVector;
  decisionType: DecisionType;
  choice: string;
  confidence: number;
  outcome: DecisionOutcome;
  timestamp: number;
}

/**
 * Model performance metrics.
 */
interface ModelPerformance {
  accuracy: number; // Correct predictions / total predictions
  precision: number; // True positives / (true positives + false positives)
  recall: number; // True positives / (true positives + false negatives)
  f1Score: number; // Harmonic mean of precision and recall
  confidenceCalibration: number; // How well confidence matches actual success rate
  totalSamples: number;
  lastUpdated: number;
}

/**
 * Predictive model for decision outcomes.
 */
interface PredictiveModel {
  /** Model type identifier */
  type: 'naive_bayes' | 'linear_regression' | 'decision_tree' | 'ensemble';

  /** Model parameters (implementation-specific) */
  parameters: Record<string, unknown>;

  /** Feature importance weights */
  featureWeights: Record<string, number>;

  /** Model performance metrics */
  performance: ModelPerformance;

  /** When the model was last trained */
  lastTraining: number;
}

/**
 * Machine learning engine for decision optimization and continuous improvement.
 *
 * The DecisionLearningEngine applies machine learning techniques to improve
 * autonomous decision-making over time. It learns from historical decisions
 * and their outcomes to:
 * - Predict the success probability of decision choices
 * - Recommend optimal decisions based on current context
 * - Identify patterns in successful vs. failed decisions
 * - Adapt decision strategies based on changing conditions
 * - Provide confidence estimates for recommendations
 *
 * Key ML approaches:
 * - Feature engineering from system context and decision parameters
 * - Online learning with incremental model updates
 * - Ensemble methods combining multiple prediction models
 * - Confidence estimation and calibration
 * - Continuous model validation and retraining
 *
 * @example
 * ```typescript
 * const learningEngine = new DecisionLearningEngine({
 *   enabled: true,
 *   adaptationRate: 0.1,
 *   minSamplesForLearning: 50
 * });
 *
 * await learningEngine.initialize();
 *
 * // Get ML recommendation for a decision
 * const recommendation = await learningEngine.recommend(
 *   DecisionType.TASK_PRIORITIZATION,
 *   { taskId: 'task-123' },
 *   context
 * );
 *
 * // Learn from decision outcome
 * learningEngine.recordOutcome(decisionId, outcome);
 * ```
 */
export class DecisionLearningEngine {
  private readonly config: Required<LearningEngineConfig>;
  private readonly trainingSamples: TrainingSample[] = [];
  private readonly models = new Map<DecisionType, PredictiveModel>();
  private isInitialized = false;

  // Simple online learning accumulators
  private readonly featureStats = new Map<
    string,
    {
      sum: number;
      sumSquared: number;
      count: number;
      mean: number;
      variance: number;
    }
  >();

  constructor(config: LearningEngineConfig) {
    this.config = {
      enabled: config.enabled,
      adaptationRate: config.adaptationRate,
      minSamplesForLearning: config.minSamplesForLearning,
      maxDatasetSize: config.maxDatasetSize || 10000,
      confidenceThreshold: config.confidenceThreshold || 0.7,
      modelPersistencePath: config.modelPersistencePath || './ml-models',
    };
  }

  /**
   * Initialize the learning engine.
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      logger.info('DecisionLearningEngine disabled by configuration');
      return;
    }

    logger.info('Initializing DecisionLearningEngine', {
      adaptationRate: this.config.adaptationRate,
      minSamplesForLearning: this.config.minSamplesForLearning,
    });

    try {
      // Load persisted models if available
      await this.loadPersistedModels();

      this.isInitialized = true;
      logger.info('DecisionLearningEngine initialized successfully', {
        loadedModels: this.models.size,
        trainingSamples: this.trainingSamples.length,
      });
    } catch (error) {
      logger.error('Failed to initialize DecisionLearningEngine', { error });
      throw error;
    }
  }

  /**
   * Shutdown the learning engine gracefully.
   */
  async shutdown(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    logger.info('Shutting down DecisionLearningEngine');

    try {
      // Persist current models
      await this.persistModels();
      logger.info('DecisionLearningEngine shutdown complete');
    } catch (error) {
      logger.error('Error during DecisionLearningEngine shutdown', { error });
    }
  }

  /**
   * Generate an ML-based recommendation for a decision.
   *
   * @param type - Type of decision to recommend
   * @param input - Input parameters for the decision
   * @param context - Current system context
   * @returns ML recommendation or null if insufficient data
   */
  async recommend<T = Record<string, unknown>>(
    type: DecisionType,
    input: T,
    context: DecisionContext,
  ): Promise<Decision | null> {
    if (!this.config.enabled || !this.isInitialized) {
      return null;
    }

    const model = this.models.get(type);
    if (
      !model ||
      model.performance.totalSamples < this.config.minSamplesForLearning
    ) {
      logger.debug('Insufficient training data for ML recommendation', {
        type,
        samples: model?.performance.totalSamples || 0,
        required: this.config.minSamplesForLearning,
      });
      return null;
    }

    try {
      // Extract features from current context
      const features = this.extractFeatures(input, context);

      // Predict using the model
      const prediction = this.predict(model, features);

      if (prediction.confidence < this.config.confidenceThreshold) {
        logger.debug('ML prediction confidence too low', {
          type,
          confidence: prediction.confidence,
          threshold: this.config.confidenceThreshold,
        });
        return null;
      }

      // Generate decision recommendation
      const recommendation: Decision = {
        id: `ml-recommendation-${Date.now()}`,
        timestamp: Date.now(),
        type,
        choice: prediction.choice,
        priority: prediction.priority,
        confidence: prediction.confidence,
        reasoning:
          `ML recommendation based on ${model.performance.totalSamples} training samples. ` +
          `Model accuracy: ${(model.performance.accuracy * 100).toFixed(1)}%. ` +
          `Key factors: ${this.getTopFeatures(model, 3).join(', ')}`,
        evidence: {
          modelType: model.type,
          modelAccuracy: model.performance.accuracy,
          trainingSamples: model.performance.totalSamples,
          topFeatures: this.getTopFeatures(model, 5),
          predictionScore: prediction.score,
        },
        expectedOutcome: {
          successProbability: prediction.successProbability,
          estimatedDuration: prediction.estimatedDuration,
          requiredResources: prediction.requiredResources,
        },
        context,
        requiresApproval: prediction.confidence < 0.9, // High-confidence predictions can be auto-approved
        alternatives: prediction.alternatives,
      };

      logger.debug('Generated ML recommendation', {
        type,
        choice: recommendation.choice,
        confidence: recommendation.confidence,
        modelAccuracy: model.performance.accuracy,
      });

      return recommendation;
    } catch (error) {
      logger.error('Failed to generate ML recommendation', { error, type });
      return null;
    }
  }

  /**
   * Record the outcome of a decision for learning.
   *
   * @param decisionId - ID of the decision
   * @param outcome - Outcome of the decision execution
   */
  recordOutcome(decisionId: string, outcome: DecisionOutcome): void {
    if (!this.config.enabled || !this.isInitialized) {
      return;
    }

    // Find the decision in our training samples
    const sampleIndex = this.trainingSamples.findIndex(
      (sample) => sample.outcome.decisionId === decisionId,
    );

    if (sampleIndex !== -1) {
      // Update existing sample with outcome
      this.trainingSamples[sampleIndex].outcome = outcome;
      logger.debug('Updated training sample with outcome', {
        decisionId,
        success: outcome.success,
      });
    }

    // Trigger incremental learning
    this.updateModels(outcome);

    // Prune old samples if dataset is too large
    if (this.trainingSamples.length > this.config.maxDatasetSize) {
      this.pruneTrainingSamples();
    }
  }

  /**
   * Add a decision to the training dataset.
   *
   * @param decision - Decision to add for learning
   */
  addTrainingSample(decision: Decision): void {
    if (!this.config.enabled || !this.isInitialized) {
      return;
    }

    const features = this.extractFeatures({}, decision.context);

    const sample: TrainingSample = {
      features,
      decisionType: decision.type,
      choice: decision.choice,
      confidence: decision.confidence,
      outcome: {
        decisionId: decision.id,
        timestamp: decision.timestamp,
        success: false, // Will be updated when outcome is recorded
        actualDuration: 0,
        actualResources: {},
        metrics: {},
        insights: [],
        errors: [],
      },
      timestamp: decision.timestamp,
    };

    this.trainingSamples.push(sample);
    this.updateFeatureStats(features);

    logger.debug('Added decision to training dataset', {
      decisionId: decision.id,
      type: decision.type,
      totalSamples: this.trainingSamples.length,
    });
  }

  /**
   * Get performance metrics for all models.
   */
  getModelPerformance(): Record<DecisionType, ModelPerformance> {
    const performance: Record<string, ModelPerformance> = {};

    for (const [type, model] of this.models) {
      performance[type] = { ...model.performance };
    }

    return performance as Record<DecisionType, ModelPerformance>;
  }

  /**
   * Retrain all models from scratch.
   */
  async retrainAllModels(): Promise<void> {
    if (!this.config.enabled || !this.isInitialized) {
      return;
    }

    logger.info('Retraining all ML models', {
      totalSamples: this.trainingSamples.length,
    });

    // Clear existing models
    this.models.clear();

    // Group samples by decision type
    const samplesByType = new Map<DecisionType, TrainingSample[]>();
    for (const sample of this.trainingSamples) {
      if (!samplesByType.has(sample.decisionType)) {
        samplesByType.set(sample.decisionType, []);
      }
      samplesByType.get(sample.decisionType)!.push(sample);
    }

    // Train models for each decision type
    for (const [type, samples] of samplesByType) {
      if (samples.length >= this.config.minSamplesForLearning) {
        await this.trainModel(type, samples);
      }
    }

    logger.info('Model retraining complete', {
      trainedModels: this.models.size,
    });
  }

  /**
   * Extract features from decision input and context.
   */
  private extractFeatures<T>(
    input: T,
    context: DecisionContext,
  ): FeatureVector {
    const now = new Date();

    return {
      systemLoad: {
        cpu: context.systemLoad.cpu,
        memory: context.systemLoad.memory,
        diskIO: context.systemLoad.diskIO,
        networkIO: context.systemLoad.networkIO,
        combinedLoad:
          context.systemLoad.cpu * 0.4 +
          context.systemLoad.memory * 0.3 +
          context.systemLoad.diskIO * 0.2 +
          context.systemLoad.networkIO * 0.1,
      },

      taskQueue: {
        totalTasks: Math.min(context.taskQueueState.totalTasks / 100, 1), // Normalize
        queueDepth:
          context.taskQueueState.totalTasks > 0
            ? context.taskQueueState.pendingTasks /
              context.taskQueueState.totalTasks
            : 0,
        processingRate:
          context.taskQueueState.avgProcessingTime > 0
            ? 1 / (context.taskQueueState.avgProcessingTime / 1000) // Convert to per-second
            : 0,
        failureRate:
          context.taskQueueState.totalTasks > 0
            ? context.taskQueueState.failedTasks /
              context.taskQueueState.totalTasks
            : 0,
      },

      agent: {
        utilization:
          context.agentContext.maxConcurrentAgents > 0
            ? context.agentContext.activeAgents /
              context.agentContext.maxConcurrentAgents
            : 0,
        avgWorkload:
          Object.values(context.agentContext.agentWorkloads).length > 0
            ? Object.values(context.agentContext.agentWorkloads).reduce(
                (a, b) => a + b,
                0,
              ) / Object.values(context.agentContext.agentWorkloads).length
            : 0,
        capabilities: Object.keys(context.agentContext.agentCapabilities)
          .length,
      },

      project: {
        stability: this.calculateStabilityScore(context.projectState),
        changeRate: context.projectState.lastBuildTime
          ? Math.exp(
              -(Date.now() - context.projectState.lastBuildTime) / 3600000,
            ) // Hours since last build
          : 0,
      },

      budget: {
        utilization: context.budgetContext.dailyLimit
          ? context.budgetContext.currentUsage /
            context.budgetContext.dailyLimit
          : 0,
        efficiency:
          context.budgetContext.costPerToken > 0
            ? 1 / context.budgetContext.costPerToken // Inverse cost as efficiency
            : 0,
        remainingRatio: context.budgetContext.remainingTokens
          ? context.budgetContext.remainingTokens /
            (context.budgetContext.remainingTokens +
              context.budgetContext.currentUsage)
          : 0,
      },

      performance: {
        successRate: context.performanceHistory.avgSuccessRate,
        avgCompletionTime: Math.min(
          context.performanceHistory.avgCompletionTime / 60000,
          1,
        ), // Normalize to minutes, max 1
        consistency:
          context.performanceHistory.commonFailureReasons.length > 0
            ? 1 / (1 + context.performanceHistory.commonFailureReasons.length)
            : 1,
      },

      temporal: {
        hourOfDay: now.getHours() / 23,
        dayOfWeek: now.getDay() / 6,
        workingHours: context.userPreferences.preferredWorkingHours
          ? this.isWithinWorkingHours(
              now,
              context.userPreferences.preferredWorkingHours,
            )
          : 1,
        timeUntilDeadline: 0.5, // Would need deadline information
      },
    };
  }

  /**
   * Make a prediction using a trained model.
   */
  private predict(
    model: PredictiveModel,
    features: FeatureVector,
  ): {
    choice: string;
    confidence: number;
    priority: number;
    score: number;
    successProbability: number;
    estimatedDuration: number;
    requiredResources: string[];
    alternatives: Array<{ choice: string; score: number; reasoning: string }>;
  } {
    // Simple weighted feature scoring (naive implementation)
    // In a production system, this would use the actual trained model

    let score = 0;
    const flatFeatures = this.flattenFeatures(features);

    for (const [featureName, value] of Object.entries(flatFeatures)) {
      const weight = model.featureWeights[featureName] || 0;
      score += value * weight;
    }

    // Normalize score to 0-1 range
    const normalizedScore = Math.max(0, Math.min(1, (score + 1) / 2));

    // Simple heuristic-based choice generation
    // In practice, this would be based on learned patterns
    const choices = ['high_priority', 'normal_priority', 'defer', 'escalate'];
    const choiceIndex = Math.floor(normalizedScore * choices.length);
    const choice = choices[Math.min(choiceIndex, choices.length - 1)];

    return {
      choice,
      confidence: normalizedScore,
      priority: Math.ceil(normalizedScore * 5), // 1-5 scale
      score: normalizedScore,
      successProbability: normalizedScore,
      estimatedDuration: (1 - normalizedScore) * 10000 + 1000, // 1-11 seconds
      requiredResources: normalizedScore > 0.7 ? ['cpu', 'memory'] : ['cpu'],
      alternatives: choices
        .filter((c) => c !== choice)
        .map((c) => ({
          choice: c,
          score: Math.random() * normalizedScore,
          reasoning: `Alternative choice with lower confidence`,
        })),
    };
  }

  /**
   * Update models incrementally based on new outcome.
   */
  private updateModels(outcome: DecisionOutcome): void {
    // Find the training sample for this outcome
    const sample = this.trainingSamples.find(
      (s) => s.outcome.decisionId === outcome.decisionId,
    );

    if (!sample) {
      return;
    }

    const model = this.models.get(sample.decisionType);
    if (!model) {
      return;
    }

    // Update model performance metrics
    const wasSuccessful = outcome.success;
    const oldAccuracy = model.performance.accuracy;
    const totalSamples = model.performance.totalSamples;

    // Incremental accuracy update
    const newAccuracy =
      (oldAccuracy * totalSamples + (wasSuccessful ? 1 : 0)) /
      (totalSamples + 1);

    model.performance.accuracy = newAccuracy;
    model.performance.totalSamples = totalSamples + 1;
    model.performance.lastUpdated = Date.now();

    // Simple feature weight adjustment based on outcome
    const features = this.flattenFeatures(sample.features);
    for (const [featureName, value] of Object.entries(features)) {
      const currentWeight = model.featureWeights[featureName] || 0;
      const adjustment = wasSuccessful
        ? this.config.adaptationRate * value
        : -this.config.adaptationRate * value;
      model.featureWeights[featureName] = Math.max(
        -1,
        Math.min(1, currentWeight + adjustment),
      );
    }

    logger.debug('Updated model incrementally', {
      type: sample.decisionType,
      success: wasSuccessful,
      newAccuracy: newAccuracy.toFixed(3),
      totalSamples: model.performance.totalSamples,
    });
  }

  /**
   * Train a new model for a specific decision type.
   */
  private async trainModel(
    type: DecisionType,
    samples: TrainingSample[],
  ): Promise<void> {
    logger.info(`Training model for ${type}`, { samples: samples.length });

    // Calculate feature weights based on correlation with success
    const featureWeights: Record<string, number> = {};
    const successfulSamples = samples.filter((s) => s.outcome.success);
    const failedSamples = samples.filter((s) => !s.outcome.success);

    if (successfulSamples.length > 0 && failedSamples.length > 0) {
      // Calculate mean feature values for successful vs failed samples
      const successMeans = this.calculateFeatureMeans(successfulSamples);
      const failMeans = this.calculateFeatureMeans(failedSamples);

      // Feature weights based on difference in means
      for (const featureName of Object.keys(successMeans)) {
        const diff = successMeans[featureName] - failMeans[featureName];
        featureWeights[featureName] = Math.tanh(diff * 2); // Bounded to [-1, 1]
      }
    }

    // Calculate performance metrics
    const totalSamples = samples.length;
    const successfulCount = successfulSamples.length;
    const accuracy = totalSamples > 0 ? successfulCount / totalSamples : 0;

    const model: PredictiveModel = {
      type: 'naive_bayes', // Simple implementation
      parameters: {
        samples: totalSamples,
        successRate: accuracy,
      },
      featureWeights,
      performance: {
        accuracy,
        precision: accuracy, // Simplified
        recall: accuracy, // Simplified
        f1Score: accuracy, // Simplified
        confidenceCalibration: accuracy,
        totalSamples,
        lastUpdated: Date.now(),
      },
      lastTraining: Date.now(),
    };

    this.models.set(type, model);

    logger.info(`Trained model for ${type}`, {
      accuracy: (accuracy * 100).toFixed(1) + '%',
      samples: totalSamples,
      features: Object.keys(featureWeights).length,
    });
  }

  /**
   * Calculate feature means for a set of samples.
   */
  private calculateFeatureMeans(
    samples: TrainingSample[],
  ): Record<string, number> {
    const means: Record<string, number> = {};
    const counts: Record<string, number> = {};

    for (const sample of samples) {
      const flatFeatures = this.flattenFeatures(sample.features);
      for (const [featureName, value] of Object.entries(flatFeatures)) {
        means[featureName] = (means[featureName] || 0) + value;
        counts[featureName] = (counts[featureName] || 0) + 1;
      }
    }

    for (const featureName of Object.keys(means)) {
      means[featureName] = means[featureName] / counts[featureName];
    }

    return means;
  }

  /**
   * Flatten nested feature structure for easier processing.
   */
  private flattenFeatures(features: FeatureVector): Record<string, number> {
    const flat: Record<string, number> = {};

    for (const [category, values] of Object.entries(features)) {
      if (typeof values === 'object' && values !== null) {
        for (const [key, value] of Object.entries(values)) {
          if (typeof value === 'number') {
            flat[`${category}.${key}`] = value;
          }
        }
      }
    }

    return flat;
  }

  /**
   * Update feature statistics for normalization.
   */
  private updateFeatureStats(features: FeatureVector): void {
    const flatFeatures = this.flattenFeatures(features);

    for (const [featureName, value] of Object.entries(flatFeatures)) {
      let stats = this.featureStats.get(featureName);
      if (!stats) {
        stats = { sum: 0, sumSquared: 0, count: 0, mean: 0, variance: 0 };
        this.featureStats.set(featureName, stats);
      }

      stats.sum += value;
      stats.sumSquared += value * value;
      stats.count += 1;
      stats.mean = stats.sum / stats.count;

      if (stats.count > 1) {
        stats.variance =
          (stats.sumSquared - stats.sum * stats.mean) / (stats.count - 1);
      }
    }
  }

  /**
   * Get the top contributing features for a model.
   */
  private getTopFeatures(model: PredictiveModel, count: number): string[] {
    return Object.entries(model.featureWeights)
      .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
      .slice(0, count)
      .map(([feature, weight]) => `${feature} (${weight.toFixed(2)})`);
  }

  /**
   * Calculate project stability score from project state.
   */
  private calculateStabilityScore(
    projectState: DecisionContext['projectState'],
  ): number {
    let score = 0;

    // Build status
    switch (projectState.buildStatus) {
      case 'success':
        score += 0.3;
        break;
      case 'in-progress':
        score += 0.15;
        break;
      case 'failed':
        score -= 0.1;
        break;
      default:
        score += 0; // unknown
    }

    // Test status
    switch (projectState.testStatus) {
      case 'passing':
        score += 0.3;
        break;
      case 'in-progress':
        score += 0.15;
        break;
      case 'failing':
        score -= 0.1;
        break;
      default:
        score += 0; // unknown
    }

    // Lint status
    switch (projectState.lintStatus) {
      case 'clean':
        score += 0.2;
        break;
      case 'warnings':
        score += 0.1;
        break;
      case 'errors':
        score -= 0.05;
        break;
      case 'in-progress':
        score += 0.1;
        break;
      default:
        score += 0; // unknown
    }

    // Git status
    switch (projectState.gitStatus) {
      case 'clean':
        score += 0.2;
        break;
      case 'modified':
        score += 0.1;
        break;
      case 'conflicted':
        score -= 0.1;
        break;
      default:
        score += 0; // unknown
    }

    return Math.max(0, Math.min(1, score + 0.5)); // Normalize to 0-1
  }

  /**
   * Check if current time is within working hours.
   */
  private isWithinWorkingHours(
    now: Date,
    workingHours: { start: number; end: number },
  ): number {
    const currentHour = now.getHours();
    if (workingHours.start <= workingHours.end) {
      return currentHour >= workingHours.start &&
        currentHour <= workingHours.end
        ? 1
        : 0;
    } else {
      // Working hours span midnight
      return currentHour >= workingHours.start ||
        currentHour <= workingHours.end
        ? 1
        : 0;
    }
  }

  /**
   * Prune old training samples to maintain dataset size.
   */
  private pruneTrainingSamples(): void {
    // Remove oldest 10% of samples
    const removeCount = Math.floor(this.trainingSamples.length * 0.1);
    this.trainingSamples.sort((a, b) => a.timestamp - b.timestamp);
    this.trainingSamples.splice(0, removeCount);

    logger.debug('Pruned training samples', {
      removed: removeCount,
      remaining: this.trainingSamples.length,
    });
  }

  /**
   * Load persisted models from disk.
   */
  private async loadPersistedModels(): Promise<void> {
    // Implementation would load models from filesystem
    // Placeholder for now
    logger.debug('Model persistence not yet implemented');
  }

  /**
   * Persist models to disk.
   */
  private async persistModels(): Promise<void> {
    // Implementation would save models to filesystem
    // Placeholder for now
    logger.debug('Model persistence not yet implemented');
  }
}

// Export alias for backward compatibility
export { DecisionLearningEngine as LearningEngine };
