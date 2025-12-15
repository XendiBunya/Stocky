/**
 * Anomaly Detection Module
 * Implements multiple anomaly detection algorithms
 */

import { StockDataPoint, AnomalyDataPoint, AnomalySummary, DetectionMethod } from './types';

export class AnomalyDetector {
  private method: DetectionMethod;
  private params: Record<string, number>;

  constructor(method: DetectionMethod, params: Record<string, number> = {}) {
    this.method = method;
    this.params = params;
  }

  /**
   * Detect anomalies in stock data
   */
  detectAnomalies(data: StockDataPoint[], features: string[]): AnomalyDataPoint[] {
    let result: AnomalyDataPoint[];

    switch (this.method) {
      case 'z_score':
        result = this.zScoreDetection(data, features);
        break;
      case 'iqr':
        result = this.iqrDetection(data, features);
        break;
      case 'isolation_forest':
        result = this.isolationForestDetection(data, features);
        break;
      case 'bollinger':
        result = this.bollingerDetection(data);
        break;
      case 'combined':
        result = this.combinedDetection(data, features);
        break;
      default:
        throw new Error(`Unknown method: ${this.method}`);
    }

    return result;
  }

  /**
   * Z-Score anomaly detection
   */
  private zScoreDetection(data: StockDataPoint[], features: string[]): AnomalyDataPoint[] {
    const threshold = this.params.zThreshold || 3.0;
    const result: AnomalyDataPoint[] = data.map((d) => ({
      ...d,
      anomalyScore: 0,
      isAnomaly: false,
      anomalyReasons: '',
    }));

    for (const feature of features) {
      const values = this.extractFeature(data, feature);
      if (values.length === 0) continue;

      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const std = Math.sqrt(
        values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
      );

      if (std === 0) continue;

      for (let i = 0; i < result.length; i++) {
        const value = this.getFeatureValue(result[i], feature);
        if (value === undefined) continue;

        const zScore = Math.abs((value - mean) / std);

        if (zScore > threshold) {
          result[i].isAnomaly = true;
          result[i].anomalyReasons += `${feature} (Z=${zScore.toFixed(2)}); `;
        }

        result[i].anomalyScore = Math.max(result[i].anomalyScore, zScore);
      }
    }

    return result;
  }

  /**
   * IQR anomaly detection
   */
  private iqrDetection(data: StockDataPoint[], features: string[]): AnomalyDataPoint[] {
    const multiplier = this.params.iqrMultiplier || 1.5;
    const result: AnomalyDataPoint[] = data.map((d) => ({
      ...d,
      anomalyScore: 0,
      isAnomaly: false,
      anomalyReasons: '',
    }));

    for (const feature of features) {
      const values = this.extractFeature(data, feature);
      if (values.length === 0) continue;

      const sorted = [...values].sort((a, b) => a - b);
      const q1Index = Math.floor(sorted.length * 0.25);
      const q3Index = Math.floor(sorted.length * 0.75);
      const q1 = sorted[q1Index];
      const q3 = sorted[q3Index];
      const iqr = q3 - q1;

      const lowerBound = q1 - multiplier * iqr;
      const upperBound = q3 + multiplier * iqr;

      for (let i = 0; i < result.length; i++) {
        const value = this.getFeatureValue(result[i], feature);
        if (value === undefined) continue;

        const belowLower = value < lowerBound ? (lowerBound - value) / (iqr || 1) : 0;
        const aboveUpper = value > upperBound ? (value - upperBound) / (iqr || 1) : 0;
        const deviation = belowLower + aboveUpper;

        if (value < lowerBound || value > upperBound) {
          result[i].isAnomaly = true;
          result[i].anomalyReasons += `${feature} (IQR outlier); `;
        }

        result[i].anomalyScore = Math.max(result[i].anomalyScore, deviation);
      }
    }

    return result;
  }

  /**
   * Simplified Isolation Forest detection
   * (Using a statistical approximation instead of full ML implementation)
   */
  private isolationForestDetection(data: StockDataPoint[], features: string[]): AnomalyDataPoint[] {
    const contamination = this.params.contamination || 0.1;
    const result: AnomalyDataPoint[] = data.map((d) => ({
      ...d,
      anomalyScore: 0,
      isAnomaly: false,
      anomalyReasons: '',
    }));

    // Extract feature matrix
    const featureMatrix: number[][] = [];
    for (let i = 0; i < data.length; i++) {
      const row: number[] = [];
      for (const feature of features) {
        const value = this.getFeatureValue(data[i], feature);
        if (value !== undefined) {
          row.push(value);
        }
      }
      if (row.length === features.length) {
        featureMatrix.push(row);
      } else {
        featureMatrix.push([]);
      }
    }

    // Normalize features
    const normalized = this.normalizeMatrix(featureMatrix);

    // Calculate anomaly scores based on distance from median
    for (let i = 0; i < normalized.length; i++) {
      if (normalized[i].length === 0) continue;

      const distances: number[] = [];
      for (let j = 0; j < normalized.length; j++) {
        if (i === j || normalized[j].length === 0) continue;
        const dist = this.euclideanDistance(normalized[i], normalized[j]);
        distances.push(dist);
      }

      if (distances.length === 0) continue;

      const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
      result[i].anomalyScore = avgDistance;
    }

    // Mark top contamination% as anomalies
    const scores = result.map((r, i) => ({ score: r.anomalyScore, index: i }));
    scores.sort((a, b) => b.score - a.score);
    const anomalyCount = Math.floor(data.length * contamination);

    for (let i = 0; i < anomalyCount; i++) {
      const index = scores[i].index;
      result[index].isAnomaly = true;
      result[index].anomalyReasons = 'Isolation Forest detection; ';
    }

    return result;
  }

  /**
   * Bollinger Bands anomaly detection
   */
  private bollingerDetection(data: StockDataPoint[]): AnomalyDataPoint[] {
    const result: AnomalyDataPoint[] = data.map((d) => ({
      ...d,
      anomalyScore: 0,
      isAnomaly: false,
      anomalyReasons: '',
    }));

    for (let i = 0; i < result.length; i++) {
      const point = result[i];

      if (point.bbUpper && point.bbLower) {
        const bbRange = point.bbUpper - point.bbLower;
        const upperDistance = point.close > point.bbUpper
          ? (point.close - point.bbUpper) / bbRange
          : 0;
        const lowerDistance = point.close < point.bbLower
          ? (point.bbLower - point.close) / bbRange
          : 0;

        point.anomalyScore = upperDistance + lowerDistance;

        if (point.close > point.bbUpper) {
          point.isAnomaly = true;
          point.anomalyReasons = 'Above Bollinger Upper Band; ';
        } else if (point.close < point.bbLower) {
          point.isAnomaly = true;
          point.anomalyReasons = 'Below Bollinger Lower Band; ';
        }
      }
    }

    return result;
  }

  /**
   * Combined detection using voting mechanism
   */
  private combinedDetection(data: StockDataPoint[], features: string[]): AnomalyDataPoint[] {
    const votingThreshold = this.params.votingThreshold || 2;

    // Run multiple methods
    const zScoreResults = this.zScoreDetection([...data], features);
    const iqrResults = this.iqrDetection([...data], features);
    const bollingerResults = this.bollingerDetection([...data]);

    const result: AnomalyDataPoint[] = data.map((d, i) => ({
      ...d,
      anomalyScore:
        (zScoreResults[i].anomalyScore +
         iqrResults[i].anomalyScore +
         bollingerResults[i].anomalyScore) / 3,
      isAnomaly: false,
      anomalyReasons: '',
    }));

    // Voting mechanism
    for (let i = 0; i < result.length; i++) {
      const votes =
        (zScoreResults[i].isAnomaly ? 1 : 0) +
        (iqrResults[i].isAnomaly ? 1 : 0) +
        (bollingerResults[i].isAnomaly ? 1 : 0);

      result[i].isAnomaly = votes >= votingThreshold;

      const methods: string[] = [];
      if (zScoreResults[i].isAnomaly) methods.push('Z-score');
      if (iqrResults[i].isAnomaly) methods.push('IQR');
      if (bollingerResults[i].isAnomaly) methods.push('Bollinger');

      result[i].anomalyReasons = methods.join(', ');
    }

    return result;
  }

  /**
   * Get anomaly summary statistics
   */
  getAnomalySummary(data: AnomalyDataPoint[]): AnomalySummary {
    const anomalies = data.filter((d) => d.isAnomaly);

    return {
      totalAnomalies: anomalies.length,
      anomalyRate: data.length > 0 ? (anomalies.length / data.length) * 100 : 0,
      avgAnomalyScore:
        anomalies.length > 0
          ? anomalies.reduce((sum, a) => sum + a.anomalyScore, 0) / anomalies.length
          : 0,
      maxAnomalyScore:
        anomalies.length > 0
          ? Math.max(...anomalies.map((a) => a.anomalyScore))
          : 0,
      anomalyDates: anomalies.map((a) => a.date),
    };
  }

  /**
   * Get top N anomalies by score
   */
  getTopAnomalies(data: AnomalyDataPoint[], n: number = 10): AnomalyDataPoint[] {
    const anomalies = data.filter((d) => d.isAnomaly);
    return anomalies
      .sort((a, b) => b.anomalyScore - a.anomalyScore)
      .slice(0, n);
  }

  // Helper methods

  private extractFeature(data: StockDataPoint[], feature: string): number[] {
    return data
      .map((d) => this.getFeatureValue(d, feature))
      .filter((v): v is number => v !== undefined);
  }

  private getFeatureValue(data: StockDataPoint, feature: string): number | undefined {
    const key = feature.toLowerCase();

    if (key === 'returns') return data.returns;
    if (key === 'volume_change' || key === 'volumechange') return data.volumeChange;
    if (key === 'range_pct' || key === 'rangepct') return data.rangePct;
    if (key === 'volatility') return data.volatility;

    return undefined;
  }

  private normalizeMatrix(matrix: number[][]): number[][] {
    if (matrix.length === 0) return [];

    const numFeatures = matrix[0].length;
    const normalized: number[][] = [];

    // Calculate min and max for each feature
    const mins: number[] = [];
    const maxs: number[] = [];

    for (let j = 0; j < numFeatures; j++) {
      const column = matrix.map((row) => row[j]).filter((v) => v !== undefined);
      mins.push(Math.min(...column));
      maxs.push(Math.max(...column));
    }

    // Normalize
    for (const row of matrix) {
      if (row.length === 0) {
        normalized.push([]);
        continue;
      }

      const normalizedRow: number[] = [];
      for (let j = 0; j < row.length; j++) {
        const range = maxs[j] - mins[j];
        if (range === 0) {
          normalizedRow.push(0);
        } else {
          normalizedRow.push((row[j] - mins[j]) / range);
        }
      }
      normalized.push(normalizedRow);
    }

    return normalized;
  }

  private euclideanDistance(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += Math.pow(a[i] - b[i], 2);
    }
    return Math.sqrt(sum);
  }
}
