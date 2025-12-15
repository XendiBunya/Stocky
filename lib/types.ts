/**
 * Type definitions for the Stock Anomaly Detection app
 */

export interface StockDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  returns?: number;
  priceChange?: number;
  volumeChange?: number;
  range?: number;
  rangePct?: number;
  ma5?: number;
  ma20?: number;
  ma50?: number;
  volatility?: number;
  bbMiddle?: number;
  bbUpper?: number;
  bbLower?: number;
  rsi?: number;
}

export interface AnomalyDataPoint extends StockDataPoint {
  anomalyScore: number;
  isAnomaly: boolean;
  anomalyReasons: string;
}

export interface StockInfo {
  name: string;
  sector: string;
  industry: string;
  marketCap: number | string;
  currency: string;
}

export interface NewsArticle {
  title: string;
  url: string;
  description: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

export interface NewsMatch {
  [date: string]: NewsArticle[];
}

export interface SentimentAnalysis {
  positive: number;
  negative: number;
  neutral: number;
  dominant: 'positive' | 'negative' | 'neutral';
}

export interface AnomalySummary {
  totalAnomalies: number;
  anomalyRate: number;
  avgAnomalyScore: number;
  maxAnomalyScore: number;
  anomalyDates: string[];
}

export type DetectionMethod = 'z_score' | 'iqr' | 'isolation_forest' | 'bollinger' | 'combined';

export interface DetectionParams {
  method: DetectionMethod;
  zThreshold?: number;
  iqrMultiplier?: number;
  contamination?: number;
  nEstimators?: number;
  votingThreshold?: number;
}

export interface AnalysisRequest {
  ticker: string;
  startDate: string;
  endDate: string;
  method: DetectionMethod;
  features: string[];
  params?: Record<string, number>;
}

export interface AnalysisResponse {
  ticker: string;
  stockInfo: StockInfo;
  data: AnomalyDataPoint[];
  summary: AnomalySummary;
  topAnomalies: AnomalyDataPoint[];
}
