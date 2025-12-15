/**
 * Stock Analysis API Route
 * Handles stock data fetching and anomaly detection
 */

import { NextRequest, NextResponse } from 'next/server';
import { StockDataFetcher } from '@/lib/stockData';
import { AnomalyDetector } from '@/lib/anomalyDetector';
import { DetectionMethod } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticker, startDate, endDate, method, features, params } = body;

    // Validate inputs
    if (!ticker || !startDate || !endDate || !method || !features) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Fetch stock data
    const fetcher = new StockDataFetcher();

    // Validate ticker first
    const isValid = await fetcher.validateTicker(ticker);
    if (!isValid) {
      return NextResponse.json(
        { error: `Invalid ticker: ${ticker}` },
        { status: 400 }
      );
    }

    // Get stock info
    const stockInfo = await fetcher.getStockInfo(ticker);

    // Fetch historical data
    const stockData = await fetcher.fetchStockData(ticker, startDate, endDate);

    if (stockData.length === 0) {
      return NextResponse.json(
        { error: 'No data available for the selected date range' },
        { status: 404 }
      );
    }

    // Detect anomalies
    const detector = new AnomalyDetector(method as DetectionMethod, params || {});
    const anomalyData = detector.detectAnomalies(stockData, features);
    const summary = detector.getAnomalySummary(anomalyData);
    const topAnomalies = detector.getTopAnomalies(anomalyData, 10);

    return NextResponse.json({
      ticker,
      stockInfo,
      data: anomalyData,
      summary,
      topAnomalies,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
