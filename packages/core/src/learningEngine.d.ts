/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Decision, DecisionContext, DecisionOutcome, DecisionType } from './types.js';
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
 * Model performance metrics.
 */
interface ModelPerformance {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    confidenceCalibration: number;
    totalSamples: number;
    lastUpdated: number;
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
export declare class DecisionLearningEngine {
    private readonly config;
    private readonly trainingSamples;
    private readonly models;
    private isInitialized;
    private readonly featureStats;
    constructor(config: LearningEngineConfig);
    /**
     * Initialize the learning engine.
     */
    initialize(): Promise<void>;
    /**
     * Shutdown the learning engine gracefully.
     */
    shutdown(): Promise<void>;
    /**
     * Generate an ML-based recommendation for a decision.
     *
     * @param type - Type of decision to recommend
     * @param input - Input parameters for the decision
     * @param context - Current system context
     * @returns ML recommendation or null if insufficient data
     */
    recommend<T = Record<string, unknown>>(type: DecisionType, input: T, context: DecisionContext): Promise<Decision | null>;
    /**
     * Record the outcome of a decision for learning.
     *
     * @param decisionId - ID of the decision
     * @param outcome - Outcome of the decision execution
     */
    recordOutcome(decisionId: string, outcome: DecisionOutcome): void;
    /**
     * Add a decision to the training dataset.
     *
     * @param decision - Decision to add for learning
     */
    addTrainingSample(decision: Decision): void;
    /**
     * Get performance metrics for all models.
     */
    getModelPerformance(): Record<DecisionType, ModelPerformance>;
    /**
     * Retrain all models from scratch.
     */
    retrainAllModels(): Promise<void>;
    /**
     * Extract features from decision input and context.
     */
    private extractFeatures;
    /**
     * Make a prediction using a trained model.
     */
    private predict;
    /**
     * Update models incrementally based on new outcome.
     */
    private updateModels;
    /**
     * Train a new model for a specific decision type.
     */
    private trainModel;
    /**
     * Calculate feature means for a set of samples.
     */
    private calculateFeatureMeans;
    /**
     * Flatten nested feature structure for easier processing.
     */
    private flattenFeatures;
    /**
     * Update feature statistics for normalization.
     */
    private updateFeatureStats;
    /**
     * Get the top contributing features for a model.
     */
    private getTopFeatures;
    /**
     * Calculate project stability score from project state.
     */
    private calculateStabilityScore;
    /**
     * Check if current time is within working hours.
     */
    private isWithinWorkingHours;
    /**
     * Prune old training samples to maintain dataset size.
     */
    private pruneTrainingSamples;
    /**
     * Load persisted models from disk.
     */
    private loadPersistedModels;
    /**
     * Persist models to disk.
     */
    private persistModels;
}
export { DecisionLearningEngine as LearningEngine };
