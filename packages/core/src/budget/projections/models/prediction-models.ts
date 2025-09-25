/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  CostDataPoint,
  CostProjection,
  TrendAnalysis,
  SeasonalAnalysis,
} from '../types.js';

/**
 * Model performance metrics
 */
export interface ModelPerformance {
  modelName: string;
  accuracy: number;
  mape: number; // Mean Absolute Percentage Error
  rmse: number; // Root Mean Square Error
  mae: number;  // Mean Absolute Error
  r2Score: number; // R-squared
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
  minimumAgreement: number; // Minimum agreement threshold for predictions
}

/**
 * Advanced prediction models using statistical analysis and machine learning techniques
 * Provides multiple prediction algorithms with ensemble methods for robust forecasting
 */
export class PredictionModels {
  private static readonly logger = console; // Will be replaced with proper logger

  /**
   * Linear regression model with regularization
   */
  public static async linearRegressionModel(
    trainingData: CostDataPoint[],
    predictionDays: number,
    regularization: 'none' | 'ridge' | 'lasso' = 'ridge',
    alpha: number = 0.1
  ): Promise<{
    predictions: Array<{ date: Date; value: number; confidence: number }>;
    performance: Partial<ModelPerformance>;
  }> {
    const startTime = Date.now();
    this.logger.info('Running linear regression model', {
      trainingData: trainingData.length,
      predictionDays,
      regularization,
      alpha,
    });

    try {
      if (trainingData.length < 3) {
        throw new Error('Insufficient training data for linear regression');
      }

      // Prepare data
      const sortedData = [...trainingData].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const baseTime = sortedData[0].timestamp.getTime();

      // Convert to numerical features
      const X = sortedData.map((point, index) => [
        (point.timestamp.getTime() - baseTime) / (24 * 60 * 60 * 1000), // Days from start
        index, // Sequential index
        point.timestamp.getHours(), // Hour of day
        point.timestamp.getDay(), // Day of week
      ]);

      const y = sortedData.map(point => point.cost);

      // Calculate coefficients using regularized least squares
      const coefficients = this.calculateRegularizedCoefficients(X, y, regularization, alpha);

      // Generate predictions
      const lastTimestamp = sortedData[sortedData.length - 1].timestamp.getTime();
      const predictions = [];

      for (let day = 1; day <= predictionDays; day++) {
        const predictionDate = new Date(lastTimestamp + day * 24 * 60 * 60 * 1000);
        const features = [
          (predictionDate.getTime() - baseTime) / (24 * 60 * 60 * 1000),
          sortedData.length + day - 1,
          predictionDate.getHours(),
          predictionDate.getDay(),
        ];

        const predictedValue = this.dotProduct(coefficients, [1, ...features]); // Include bias term
        const confidence = Math.max(0.3, 1 - (day - 1) * 0.02); // Decrease confidence over time

        predictions.push({
          date: predictionDate,
          value: Math.max(0, predictedValue),
          confidence,
        });
      }

      // Calculate performance metrics on training data
      const trainPredictions = sortedData.map((point, index) => {
        const features = X[index];
        return this.dotProduct(coefficients, [1, ...features]);
      });

      const performance: Partial<ModelPerformance> = {
        modelName: `Linear Regression (${regularization})`,
        trainingTime: Date.now() - startTime,
        predictionTime: Date.now() - startTime,
        rmse: this.calculateRMSE(y, trainPredictions),
        mae: this.calculateMAE(y, trainPredictions),
        r2Score: this.calculateR2Score(y, trainPredictions),
      };

      this.logger.info('Linear regression model completed', {
        duration: Date.now() - startTime,
        rmse: performance.rmse?.toFixed(4),
        r2Score: performance.r2Score?.toFixed(4),
      });

      return { predictions, performance };
    } catch (error) {
      this.logger.error('Failed to run linear regression model', { error: error.message });
      throw error;
    }
  }

  /**
   * Exponential smoothing model with trend and seasonality
   */
  public static async exponentialSmoothingModel(
    trainingData: CostDataPoint[],
    predictionDays: number,
    smoothingParams: {
      alpha: number; // Level smoothing
      beta: number;  // Trend smoothing
      gamma: number; // Seasonal smoothing
    } = { alpha: 0.3, beta: 0.1, gamma: 0.1 },
    seasonalPeriod: number = 7
  ): Promise<{
    predictions: Array<{ date: Date; value: number; confidence: number }>;
    performance: Partial<ModelPerformance>;
  }> {
    const startTime = Date.now();
    this.logger.info('Running exponential smoothing model', {
      trainingData: trainingData.length,
      predictionDays,
      smoothingParams,
      seasonalPeriod,
    });

    try {
      if (trainingData.length < seasonalPeriod * 2) {
        throw new Error(`Insufficient training data for exponential smoothing with seasonal period ${seasonalPeriod}`);
      }

      const sortedData = [...trainingData].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const values = sortedData.map(point => point.cost);

      // Initialize components
      const { level, trend, seasonal } = this.initializeHoltWinters(values, seasonalPeriod);
      const { alpha, beta, gamma } = smoothingParams;

      // Apply Holt-Winters exponential smoothing
      const smoothedValues = [];
      let currentLevel = level[0];
      let currentTrend = trend[0];
      const currentSeasonal = [...seasonal];

      for (let t = 0; t < values.length; t++) {
        const seasonalIndex = t % seasonalPeriod;
        const prediction = (currentLevel + currentTrend) * currentSeasonal[seasonalIndex];
        smoothedValues.push(prediction);

        if (t < values.length - 1) {
          // Update components
          const newLevel = alpha * (values[t] / currentSeasonal[seasonalIndex]) + (1 - alpha) * (currentLevel + currentTrend);
          const newTrend = beta * (newLevel - currentLevel) + (1 - beta) * currentTrend;
          const newSeasonal = gamma * (values[t] / newLevel) + (1 - gamma) * currentSeasonal[seasonalIndex];

          currentLevel = newLevel;
          currentTrend = newTrend;
          currentSeasonal[seasonalIndex] = newSeasonal;
        }
      }

      // Generate predictions
      const lastTimestamp = sortedData[sortedData.length - 1].timestamp.getTime();
      const predictions = [];

      for (let day = 1; day <= predictionDays; day++) {
        const predictionDate = new Date(lastTimestamp + day * 24 * 60 * 60 * 1000);
        const seasonalIndex = (values.length + day - 1) % seasonalPeriod;
        const predictedValue = (currentLevel + currentTrend * day) * currentSeasonal[seasonalIndex];
        const confidence = Math.max(0.2, 0.9 - (day - 1) * 0.03); // Exponential decay

        predictions.push({
          date: predictionDate,
          value: Math.max(0, predictedValue),
          confidence,
        });
      }

      // Calculate performance metrics
      const performance: Partial<ModelPerformance> = {
        modelName: 'Exponential Smoothing (Holt-Winters)',
        trainingTime: Date.now() - startTime,
        predictionTime: Date.now() - startTime,
        rmse: this.calculateRMSE(values, smoothedValues),
        mae: this.calculateMAE(values, smoothedValues),
        r2Score: this.calculateR2Score(values, smoothedValues),
      };

      this.logger.info('Exponential smoothing model completed', {
        duration: Date.now() - startTime,
        rmse: performance.rmse?.toFixed(4),
        r2Score: performance.r2Score?.toFixed(4),
      });

      return { predictions, performance };
    } catch (error) {
      this.logger.error('Failed to run exponential smoothing model', { error: error.message });
      throw error;
    }
  }

  /**
   * ARIMA model (simplified implementation)
   */
  public static async arimaModel(
    trainingData: CostDataPoint[],
    predictionDays: number,
    order: { p: number; d: number; q: number } = { p: 2, d: 1, q: 1 }
  ): Promise<{
    predictions: Array<{ date: Date; value: number; confidence: number }>;
    performance: Partial<ModelPerformance>;
  }> {
    const startTime = Date.now();
    this.logger.info('Running ARIMA model', {
      trainingData: trainingData.length,
      predictionDays,
      order,
    });

    try {
      if (trainingData.length < order.p + order.d + order.q + 10) {
        throw new Error('Insufficient training data for ARIMA model');
      }

      const sortedData = [...trainingData].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      let values = sortedData.map(point => point.cost);

      // Apply differencing (d parameter)
      for (let i = 0; i < order.d; i++) {
        values = this.difference(values);
      }

      // Simplified ARIMA estimation using least squares
      const { arParams, maParams, residuals } = this.estimateARIMAParameters(values, order);

      // Generate predictions
      const lastTimestamp = sortedData[sortedData.length - 1].timestamp.getTime();
      const predictions = [];
      const lastValues = values.slice(-order.p);
      const lastResiduals = residuals.slice(-order.q);

      for (let day = 1; day <= predictionDays; day++) {
        const predictionDate = new Date(lastTimestamp + day * 24 * 60 * 60 * 1000);

        // AR component
        let arComponent = 0;
        for (let i = 0; i < order.p; i++) {
          const valueIndex = lastValues.length - 1 - i;
          if (valueIndex >= 0) {
            arComponent += arParams[i] * lastValues[valueIndex];
          }
        }

        // MA component
        let maComponent = 0;
        for (let i = 0; i < order.q; i++) {
          const residualIndex = lastResiduals.length - 1 - i;
          if (residualIndex >= 0) {
            maComponent += maParams[i] * lastResiduals[residualIndex];
          }
        }

        const predictedDifference = arComponent + maComponent;

        // Integrate back (reverse differencing)
        let predictedValue = predictedDifference;
        if (order.d > 0) {
          const lastOriginalValue = sortedData[sortedData.length - 1].cost;
          predictedValue = lastOriginalValue + predictedDifference;
        }

        const confidence = Math.max(0.2, 0.8 - (day - 1) * 0.04);

        predictions.push({
          date: predictionDate,
          value: Math.max(0, predictedValue),
          confidence,
        });

        // Update for next iteration
        lastValues.push(predictedDifference);
        lastValues.shift();
        lastResiduals.push(0); // Assume zero residual for future
        lastResiduals.shift();
      }

      // Calculate performance metrics
      const fittedValues = this.calculateARIMAFittedValues(values, arParams, maParams, order);
      const performance: Partial<ModelPerformance> = {
        modelName: `ARIMA(${order.p},${order.d},${order.q})`,
        trainingTime: Date.now() - startTime,
        predictionTime: Date.now() - startTime,
        rmse: this.calculateRMSE(values.slice(Math.max(order.p, order.q)), fittedValues),
        mae: this.calculateMAE(values.slice(Math.max(order.p, order.q)), fittedValues),
      };

      this.logger.info('ARIMA model completed', {
        duration: Date.now() - startTime,
        rmse: performance.rmse?.toFixed(4),
      });

      return { predictions, performance };
    } catch (error) {
      this.logger.error('Failed to run ARIMA model', { error: error.message });
      throw error;
    }
  }

  /**
   * Ensemble model combining multiple prediction approaches
   */
  public static async ensembleModel(
    trainingData: CostDataPoint[],
    predictionDays: number,
    config: EnsembleConfig = {
      models: [
        { name: 'linear_regression', weight: 0.4, confidence: 0.8 },
        { name: 'exponential_smoothing', weight: 0.35, confidence: 0.75 },
        { name: 'arima', weight: 0.25, confidence: 0.7 },
      ],
      votingStrategy: 'weighted_average',
      minimumAgreement: 0.7,
    }
  ): Promise<{
    predictions: Array<{ date: Date; value: number; confidence: number }>;
    performance: Partial<ModelPerformance>;
    individualModels: Array<{ name: string; performance: Partial<ModelPerformance> }>;
  }> {
    const startTime = Date.now();
    this.logger.info('Running ensemble model', {
      trainingData: trainingData.length,
      predictionDays,
      config,
    });

    try {
      const individualResults = [];

      // Run individual models
      for (const modelConfig of config.models) {
        let modelResult;
        switch (modelConfig.name) {
          case 'linear_regression':
            modelResult = await this.linearRegressionModel(trainingData, predictionDays);
            break;
          case 'exponential_smoothing':
            modelResult = await this.exponentialSmoothingModel(trainingData, predictionDays);
            break;
          case 'arima':
            modelResult = await this.arimaModel(trainingData, predictionDays);
            break;
          default:
            this.logger.warn('Unknown model in ensemble config', { model: modelConfig.name });
            continue;
        }

        individualResults.push({
          name: modelConfig.name,
          weight: modelConfig.weight,
          confidence: modelConfig.confidence,
          predictions: modelResult.predictions,
          performance: modelResult.performance,
        });
      }

      // Combine predictions using ensemble strategy
      const ensemblePredictions = [];

      for (let day = 0; day < predictionDays; day++) {
        const dayPredictions = individualResults.map(result => ({
          value: result.predictions[day].value,
          weight: result.weight,
          confidence: result.confidence,
        }));

        let combinedValue: number;
        let combinedConfidence: number;

        switch (config.votingStrategy) {
          case 'weighted_average':
            const totalWeight = dayPredictions.reduce((sum, p) => sum + p.weight, 0);
            combinedValue = dayPredictions.reduce((sum, p) => sum + p.value * p.weight, 0) / totalWeight;
            combinedConfidence = dayPredictions.reduce((sum, p) => sum + p.confidence * p.weight, 0) / totalWeight;
            break;

          case 'median':
            const sortedValues = dayPredictions.map(p => p.value).sort((a, b) => a - b);
            combinedValue = this.median(sortedValues);
            combinedConfidence = dayPredictions.reduce((sum, p) => sum + p.confidence, 0) / dayPredictions.length;
            break;

          case 'confidence_weighted':
            const totalConfidence = dayPredictions.reduce((sum, p) => sum + p.confidence, 0);
            combinedValue = dayPredictions.reduce((sum, p) => sum + p.value * p.confidence, 0) / totalConfidence;
            combinedConfidence = totalConfidence / dayPredictions.length;
            break;

          default:
            combinedValue = dayPredictions.reduce((sum, p) => sum + p.value, 0) / dayPredictions.length;
            combinedConfidence = dayPredictions.reduce((sum, p) => sum + p.confidence, 0) / dayPredictions.length;
        }

        // Check for model agreement
        const meanValue = dayPredictions.reduce((sum, p) => sum + p.value, 0) / dayPredictions.length;
        const agreement = 1 - (Math.sqrt(dayPredictions.reduce((sum, p) => sum + Math.pow(p.value - meanValue, 2), 0) / dayPredictions.length) / meanValue);

        if (agreement < config.minimumAgreement) {
          combinedConfidence *= 0.7; // Reduce confidence when models disagree
        }

        ensemblePredictions.push({
          date: individualResults[0].predictions[day].date,
          value: Math.max(0, combinedValue),
          confidence: Math.max(0.1, Math.min(0.95, combinedConfidence)),
        });
      }

      // Calculate ensemble performance (weighted average of individual performances)
      const totalWeight = individualResults.reduce((sum, r) => sum + r.weight, 0);
      const ensemblePerformance: Partial<ModelPerformance> = {
        modelName: `Ensemble (${config.votingStrategy})`,
        trainingTime: Math.max(...individualResults.map(r => r.performance.trainingTime || 0)),
        predictionTime: Date.now() - startTime,
        rmse: individualResults.reduce((sum, r) => sum + (r.performance.rmse || 0) * r.weight, 0) / totalWeight,
        mae: individualResults.reduce((sum, r) => sum + (r.performance.mae || 0) * r.weight, 0) / totalWeight,
        r2Score: individualResults.reduce((sum, r) => sum + (r.performance.r2Score || 0) * r.weight, 0) / totalWeight,
      };

      const individualModels = individualResults.map(r => ({
        name: r.name,
        performance: r.performance,
      }));

      this.logger.info('Ensemble model completed', {
        duration: Date.now() - startTime,
        individualModels: individualModels.length,
        ensembleRmse: ensemblePerformance.rmse?.toFixed(4),
      });

      return {
        predictions: ensemblePredictions,
        performance: ensemblePerformance,
        individualModels,
      };
    } catch (error) {
      this.logger.error('Failed to run ensemble model', { error: error.message });
      throw error;
    }
  }

  // Private helper methods

  private static calculateRegularizedCoefficients(
    X: number[][],
    y: number[],
    regularization: 'none' | 'ridge' | 'lasso',
    alpha: number
  ): number[] {
    // Add bias column to X
    const XWithBias = X.map(row => [1, ...row]);
    const n = XWithBias.length;
    const p = XWithBias[0].length;

    // Calculate X^T * X
    const XTX = this.matrixMultiply(this.transpose(XWithBias), XWithBias);

    // Add regularization
    if (regularization === 'ridge') {
      for (let i = 1; i < p; i++) { // Skip bias term
        XTX[i][i] += alpha;
      }
    }

    // Calculate X^T * y
    const XTy = this.matrixVectorMultiply(this.transpose(XWithBias), y);

    // Solve (X^T * X + λI) * β = X^T * y using Gaussian elimination
    return this.gaussianElimination(XTX, XTy);
  }

  private static matrixMultiply(A: number[][], B: number[][]): number[][] {
    const result = [];
    for (let i = 0; i < A.length; i++) {
      result[i] = [];
      for (let j = 0; j < B[0].length; j++) {
        let sum = 0;
        for (let k = 0; k < B.length; k++) {
          sum += A[i][k] * B[k][j];
        }
        result[i][j] = sum;
      }
    }
    return result;
  }

  private static transpose(matrix: number[][]): number[][] {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
  }

  private static matrixVectorMultiply(matrix: number[][], vector: number[]): number[] {
    return matrix.map(row => this.dotProduct(row, vector));
  }

  private static dotProduct(a: number[], b: number[]): number {
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
  }

  private static gaussianElimination(A: number[][], b: number[]): number[] {
    const n = A.length;
    const augmented = A.map((row, i) => [...row, b[i]]);

    // Forward elimination
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

      // Make all rows below this one 0 in current column
      for (let k = i + 1; k < n; k++) {
        const c = augmented[k][i] / augmented[i][i];
        for (let j = i; j <= n; j++) {
          if (i === j) {
            augmented[k][j] = 0;
          } else {
            augmented[k][j] -= c * augmented[i][j];
          }
        }
      }
    }

    // Back substitution
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = augmented[i][n];
      for (let j = i + 1; j < n; j++) {
        x[i] -= augmented[i][j] * x[j];
      }
      x[i] /= augmented[i][i];
    }

    return x;
  }

  private static initializeHoltWinters(values: number[], seasonalPeriod: number) {
    // Simple initialization for Holt-Winters
    const level = [values[0]];
    const trend = [(values[seasonalPeriod] - values[0]) / seasonalPeriod];

    // Initialize seasonal components
    const seasonal = [];
    for (let i = 0; i < seasonalPeriod; i++) {
      let sum = 0;
      let count = 0;
      for (let j = i; j < values.length; j += seasonalPeriod) {
        sum += values[j] / (level[0] + trend[0] * j);
        count++;
      }
      seasonal[i] = count > 0 ? sum / count : 1;
    }

    return { level, trend, seasonal };
  }

  private static difference(values: number[]): number[] {
    const result = [];
    for (let i = 1; i < values.length; i++) {
      result.push(values[i] - values[i - 1]);
    }
    return result;
  }

  private static estimateARIMAParameters(
    values: number[],
    order: { p: number; d: number; q: number }
  ): { arParams: number[]; maParams: number[]; residuals: number[] } {
    // Simplified ARIMA parameter estimation using method of moments
    const { p, q } = order;

    // AR parameters estimation using Yule-Walker equations (simplified)
    const arParams = new Array(p).fill(0);
    if (p > 0) {
      const autocorrs = this.calculateAutocorrelations(values, p);
      arParams[0] = autocorrs[0];
      for (let i = 1; i < p; i++) {
        arParams[i] = autocorrs[i] * 0.5; // Simplified estimation
      }
    }

    // MA parameters (simplified initialization)
    const maParams = new Array(q).fill(0.1);

    // Calculate residuals
    const residuals = [];
    for (let t = Math.max(p, q); t < values.length; t++) {
      let prediction = 0;

      // AR component
      for (let i = 0; i < p; i++) {
        prediction += arParams[i] * values[t - 1 - i];
      }

      // MA component (using previous residuals)
      for (let i = 0; i < Math.min(q, residuals.length); i++) {
        prediction += maParams[i] * residuals[residuals.length - 1 - i];
      }

      const residual = values[t] - prediction;
      residuals.push(residual);
    }

    return { arParams, maParams, residuals };
  }

  private static calculateAutocorrelations(values: number[], lags: number): number[] {
    const n = values.length;
    const mean = values.reduce((sum, val) => sum + val, 0) / n;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;

    const autocorrs = [];
    for (let lag = 1; lag <= lags; lag++) {
      let covariance = 0;
      for (let i = lag; i < n; i++) {
        covariance += (values[i] - mean) * (values[i - lag] - mean);
      }
      covariance /= (n - lag);
      autocorrs.push(covariance / variance);
    }

    return autocorrs;
  }

  private static calculateARIMAFittedValues(
    values: number[],
    arParams: number[],
    maParams: number[],
    order: { p: number; d: number; q: number }
  ): number[] {
    const fitted = [];
    const residuals = [];

    for (let t = Math.max(order.p, order.q); t < values.length; t++) {
      let prediction = 0;

      // AR component
      for (let i = 0; i < order.p; i++) {
        if (t - 1 - i >= 0) {
          prediction += arParams[i] * values[t - 1 - i];
        }
      }

      // MA component
      for (let i = 0; i < Math.min(order.q, residuals.length); i++) {
        prediction += maParams[i] * residuals[residuals.length - 1 - i];
      }

      fitted.push(prediction);
      residuals.push(values[t] - prediction);
    }

    return fitted;
  }

  private static calculateRMSE(actual: number[], predicted: number[]): number {
    const n = Math.min(actual.length, predicted.length);
    let sumSquaredError = 0;
    for (let i = 0; i < n; i++) {
      sumSquaredError += Math.pow(actual[i] - predicted[i], 2);
    }
    return Math.sqrt(sumSquaredError / n);
  }

  private static calculateMAE(actual: number[], predicted: number[]): number {
    const n = Math.min(actual.length, predicted.length);
    let sumAbsoluteError = 0;
    for (let i = 0; i < n; i++) {
      sumAbsoluteError += Math.abs(actual[i] - predicted[i]);
    }
    return sumAbsoluteError / n;
  }

  private static calculateR2Score(actual: number[], predicted: number[]): number {
    const n = Math.min(actual.length, predicted.length);
    const actualMean = actual.slice(0, n).reduce((sum, val) => sum + val, 0) / n;

    let ssRes = 0; // Sum of squares of residuals
    let ssTot = 0; // Total sum of squares

    for (let i = 0; i < n; i++) {
      ssRes += Math.pow(actual[i] - predicted[i], 2);
      ssTot += Math.pow(actual[i] - actualMean, 2);
    }

    return ssTot === 0 ? 1 : 1 - (ssRes / ssTot);
  }

  private static median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
}