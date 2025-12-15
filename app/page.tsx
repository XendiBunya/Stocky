'use client';

import React, { useState } from 'react';
import { ConfigPanel, AnalysisConfig } from '@/components/ConfigPanel';
import { StockChart } from '@/components/StockChart';
import { AnomalyDisplay } from '@/components/AnomalyDisplay';
import { AnalysisResponse, NewsArticle, SentimentAnalysis } from '@/lib/types';
import { formatMarketCap } from '@/lib/utils';
import { TrendingUp, BarChart3, Newspaper } from 'lucide-react';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [newsMatches, setNewsMatches] = useState<Record<string, NewsArticle[]> | null>(null);
  const [sentiments, setSentiments] = useState<Record<string, SentimentAnalysis> | null>(null);

  const handleAnalyze = async (config: AnalysisConfig) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setNewsMatches(null);
    setSentiments(null);

    try {
      // Fetch stock analysis
      const analysisRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: config.ticker,
          startDate: config.startDate,
          endDate: config.endDate,
          method: config.method,
          features: config.features,
          params: config.params,
        }),
      });

      if (!analysisRes.ok) {
        const errorData = await analysisRes.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const analysisData: AnalysisResponse = await analysisRes.json();
      setResult(analysisData);

      // Fetch news if enabled
      if (config.enableNews && analysisData.summary.totalAnomalies > 0) {
        try {
          const newsRes = await fetch('/api/news', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ticker: config.ticker,
              companyName: analysisData.stockInfo.name,
              anomalyDates: analysisData.summary.anomalyDates,
              windowDays: config.newsWindow,
              apiKey: config.newsApiKey,
            }),
          });

          if (newsRes.ok) {
            const newsData = await newsRes.json();
            setNewsMatches(newsData.newsMatches);
            setSentiments(newsData.sentiments);
          }
        } catch (newsError) {
          console.error('News fetch failed:', newsError);
          // Don't fail the whole analysis if news fails
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-3">
            📈 Stock Anomaly Detector
          </h1>
          <p className="text-lg text-gray-600">
            Analyze stock price data to detect anomalies and correlate them with news events
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Configuration */}
          <div className="lg:col-span-1">
            <ConfigPanel onAnalyze={handleAnalyze} isLoading={isLoading} />

            {/* Features Info */}
            <div className="mt-6 bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold mb-3">Features</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start">
                  <TrendingUp className="w-5 h-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>5 Detection Methods</strong>
                    <p className="text-gray-600">Z-Score, IQR, Isolation Forest, Bollinger Bands, Combined</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <BarChart3 className="w-5 h-5 text-secondary mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Historical Analysis</strong>
                    <p className="text-gray-600">Analyze custom date ranges with interactive charts</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Newspaper className="w-5 h-5 text-orange-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>News Correlation</strong>
                    <p className="text-gray-600">Match anomalies with news events and sentiment</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Results */}
          <div className="lg:col-span-2">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
                <strong>Error:</strong> {error}
              </div>
            )}

            {isLoading && (
              <div className="bg-white p-12 rounded-lg shadow text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-lg text-gray-600">Analyzing stock data...</p>
              </div>
            )}

            {result && !isLoading && (
              <div className="space-y-6">
                {/* Stock Info */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-2xl font-bold mb-4">{result.ticker} Analysis</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Company</p>
                      <p className="font-semibold">{result.stockInfo.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Sector</p>
                      <p className="font-semibold">{result.stockInfo.sector}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Industry</p>
                      <p className="font-semibold">{result.stockInfo.industry}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Market Cap</p>
                      <p className="font-semibold">
                        {formatMarketCap(result.stockInfo.marketCap)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    Analyzed {result.data.length} trading days
                  </p>
                </div>

                {/* Charts */}
                <StockChart data={result.data} />

                {/* Anomaly Details */}
                <AnomalyDisplay
                  summary={result.summary}
                  topAnomalies={result.topAnomalies}
                  newsMatches={newsMatches || undefined}
                  sentiments={sentiments || undefined}
                />
              </div>
            )}

            {!result && !isLoading && !error && (
              <div className="bg-white p-12 rounded-lg shadow text-center">
                <TrendingUp className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Ready to Analyze
                </h3>
                <p className="text-gray-600">
                  Configure your analysis parameters and click &quot;Run Analysis&quot; to begin
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-600 text-sm">
          <p>
            Built with Next.js, TypeScript, and Recharts | Data from Yahoo Finance
          </p>
        </footer>
      </div>
    </main>
  );
}
