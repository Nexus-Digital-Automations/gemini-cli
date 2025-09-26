/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CostDataPoint } from '../types.js';
/**
 * Model performance metrics
 */
export interface ModelPerformance {
    modelName: string;
    accuracy: number;
    mape: number;
    rmse: number;
    mae: number;
    r2Score: number;
    trainingTime: number;
    predictionTime: number;
}
/**
 * Ensemble model configuration
 */
export interface EnsembleConfig {
    models: Array<{
        name: string;
        weight: number;
        confidence: number;
    }>;
    votingStrategy: 'weighted_average' | 'median' | 'confidence_weighted';
    minimumAgreement: number;
}
/**
 * Advanced prediction models using statistical analysis and machine learning techniques
 * Provides multiple prediction algorithms with ensemble methods for robust forecasting
 */
export declare class PredictionModels {
    private static readonly logger;
    /**
     * Linear regression model with regularization
     */
    static linearRegressionModel(trainingData: CostDataPoint[], predictionDays: number, regularization?: 'none' | 'ridge' | 'lasso', alpha?: number): Promise<{
        predictions: Array<{
            date: Date;
            value: number;
            confidence: number;
        }>;
        performance: Partial<ModelPerformance>;
    }>;
    /**
     * Exponential smoothing model with trend and seasonality
     */
    static exponentialSmoothingModel(trainingData: CostDataPoint[], predictionDays: number, smoothingParams?: {
        alpha: number;
        beta: number;
        gamma: number;
    }, seasonalPeriod?: number): Promise<{
        predictions: Array<{
            date: Date;
            value: number;
            confidence: number;
        }>;
        performance: Partial<ModelPerformance>;
    }>;
    /**
     * ARIMA model (simplified implementation)
     */
    static arimaModel(trainingData: CostDataPoint[], predictionDays: number, order?: {
        p: number;
        d: number;
        q: number;
    }): Promise<{
        predictions: Array<{
            date: Date;
            value: number;
            confidence: number;
        }>;
        performance: Partial<ModelPerformance>;
    }>;
    /**
     * Ensemble model combining multiple prediction approaches
     */
    static ensembleModel(trainingData: CostDataPoint[], predictionDays: number, config?: EnsembleConfig): Promise<{
        predictions: Array<{
            date: Date;
            value: number;
            confidence: number;
        }>;
        performance: Partial<ModelPerformance>;
        individualModels: Array<{
            name: string;
            performance: Partial<ModelPerformance>;
        }>;
    }>;
    private static calculateRegularizedCoefficients;
    private static matrixMultiply;
    private static transpose;
    private static matrixVectorMultiply;
    private static dotProduct;
    private static gaussianElimination;
    private static initializeHoltWinters;
    private static difference;
    private static estimateARIMAParameters;
    private static calculateAutocorrelations;
    private static calculateARIMAFittedValues;
    private static calculateRMSE;
    private static calculateMAE;
    private static calculateR2Score;
    private static median;
}
