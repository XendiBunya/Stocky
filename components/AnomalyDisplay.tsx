'use client';

import React from 'react';
import { AnomalyDataPoint, AnomalySummary, NewsArticle, SentimentAnalysis } from '@/lib/types';
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils';

interface AnomalyDisplayProps {
  summary: AnomalySummary;
  topAnomalies: AnomalyDataPoint[];
  newsMatches?: Record<string, NewsArticle[]>;
  sentiments?: Record<string, SentimentAnalysis>;
}

export function AnomalyDisplay({
  summary,
  topAnomalies,
  newsMatches,
  sentiments,
}: AnomalyDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600 mb-1">Total Anomalies</h3>
          <p className="text-3xl font-bold text-primary">
            {summary.totalAnomalies}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600 mb-1">Anomaly Rate</h3>
          <p className="text-3xl font-bold text-secondary">
            {summary.anomalyRate.toFixed(2)}%
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600 mb-1">Max Anomaly Score</h3>
          <p className="text-3xl font-bold text-red-600">
            {summary.maxAnomalyScore.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Top Anomalies Table */}
      {topAnomalies.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Top Anomalies</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Close
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Return
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reasons
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topAnomalies.map((anomaly, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatDate(anomaly.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatCurrency(anomaly.close)}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                        (anomaly.returns || 0) >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {anomaly.returns
                        ? formatPercent(anomaly.returns)
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-orange-600">
                      {anomaly.anomalyScore.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {anomaly.anomalyReasons || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* News Matches */}
      {newsMatches && Object.keys(newsMatches).length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">News Correlation</h3>
          <div className="space-y-6">
            {Object.entries(newsMatches).map(([date, articles]) => (
              <div key={date} className="border-b pb-4 last:border-b-0">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-medium">
                    {formatDate(date)} ({articles.length} articles)
                  </h4>
                  {sentiments && sentiments[date] && (
                    <div className="text-sm">
                      <span
                        className={`px-3 py-1 rounded-full font-semibold ${
                          sentiments[date].dominant === 'positive'
                            ? 'bg-green-100 text-green-800'
                            : sentiments[date].dominant === 'negative'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {sentiments[date].dominant.toUpperCase()}
                      </span>
                      <span className="ml-2 text-gray-600">
                        (P: {sentiments[date].positive.toFixed(0)}% | N:{' '}
                        {sentiments[date].negative.toFixed(0)}%)
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {articles.slice(0, 5).map((article, idx) => (
                    <div key={idx} className="pl-4 border-l-2 border-gray-200">
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {article.title}
                      </a>
                      <p className="text-sm text-gray-600 mt-1">
                        {article.source.name} -{' '}
                        {new Date(article.publishedAt).toLocaleString()}
                      </p>
                      {article.description && (
                        <p className="text-sm text-gray-700 mt-1">
                          {article.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
