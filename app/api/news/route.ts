/**
 * News Fetching API Route
 * Handles news correlation with anomalies
 */

import { NextRequest, NextResponse } from 'next/server';
import { NewsFetcher } from '@/lib/newsFetcher';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticker, companyName, anomalyDates, windowDays, apiKey } = body;

    // Validate inputs
    if (!ticker || !companyName || !anomalyDates) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Fetch news
    const fetcher = new NewsFetcher(apiKey);
    const newsMatches = await fetcher.matchNewsToAnomalies(
      anomalyDates,
      ticker,
      companyName,
      windowDays || 1
    );

    // Analyze sentiment for each date
    const sentiments: Record<string, any> = {};
    for (const [date, articles] of Object.entries(newsMatches)) {
      sentiments[date] = fetcher.analyzeSentiment(articles);
    }

    return NextResponse.json({
      newsMatches,
      sentiments,
    });
  } catch (error) {
    console.error('News fetching error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
